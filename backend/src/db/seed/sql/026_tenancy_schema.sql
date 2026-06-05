CREATE TABLE IF NOT EXISTS tenants (
  tenant_key VARCHAR(64) NOT NULL,
  name VARCHAR(255) NOT NULL,
  locale VARCHAR(8) NOT NULL DEFAULT 'tr',
  status VARCHAR(32) NOT NULL DEFAULT 'active',
  plan VARCHAR(64) NOT NULL DEFAULT 'agency',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (tenant_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS tenant_settings (
  tenant_key VARCHAR(64) NOT NULL,
  `key` VARCHAR(128) NOT NULL,
  value_json JSON NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (tenant_key, `key`),
  CONSTRAINT fk_tenant_settings_tenant
    FOREIGN KEY (tenant_key) REFERENCES tenants(tenant_key)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS tenant_secrets (
  tenant_key VARCHAR(64) NOT NULL,
  `key` VARCHAR(128) NOT NULL,
  value_encrypted TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (tenant_key, `key`),
  CONSTRAINT fk_tenant_secrets_tenant
    FOREIGN KEY (tenant_key) REFERENCES tenants(tenant_key)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO tenants (tenant_key, name, locale, status, plan)
VALUES
  ('avrasya', 'Avrasya Otomotiv', 'tr', 'active', 'agency'),
  ('tarvista', 'TarVista', 'tr', 'active', 'agency'),
  ('vistaseeds', 'VistaSeeds', 'tr', 'active', 'agency'),
  ('bereketfide', 'Bereket Fide', 'tr', 'active', 'agency'),
  ('default', 'MarketPulse', 'tr', 'active', 'agency')
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  locale = VALUES(locale),
  status = VALUES(status),
  plan = VALUES(plan);

INSERT INTO tenant_settings (tenant_key, `key`, value_json)
VALUES
  (
    'avrasya',
    'external_erp',
    JSON_OBJECT(
      'enabled', TRUE,
      'provider', 'promat',
      'connectionKey', 'promat',
      'tables', JSON_OBJECT(
        'customers', 'musteriler',
        'products', 'urunler',
        'orders', 'satis_siparisleri',
        'orderLines', 'siparis_kalemleri'
      )
    )
  ),
  (
    'tarvista',
    'external_erp',
    JSON_OBJECT(
      'enabled', FALSE,
      'provider', '',
      'connectionKey', '',
      'tables', JSON_OBJECT(
        'customers', '',
        'products', '',
        'orders', '',
        'orderLines', ''
      )
    )
  ),
  (
    'vistaseeds',
    'external_erp',
    JSON_OBJECT(
      'enabled', TRUE,
      'provider', 'ecosystem',
      'connectionKey', 'vistaseeds'
    )
  ),
  (
    'bereketfide',
    'external_erp',
    JSON_OBJECT(
      'enabled', TRUE,
      'provider', 'ecosystem',
      'connectionKey', 'bereketfide'
    )
  ),
  (
    'default',
    'external_erp',
    JSON_OBJECT(
      'enabled', FALSE,
      'provider', '',
      'connectionKey', ''
    )
  ),
  (
    'vistaseeds',
    'external_db',
    JSON_OBJECT(
      'enabled', TRUE,
      'provider', 'ecosystem',
      'host', '127.0.0.1',
      'port', 3306,
      'database', 'vistaseed',
      'connectionKey', 'vistaseeds'
    )
  ),
  (
    'bereketfide',
    'external_db',
    JSON_OBJECT(
      'enabled', TRUE,
      'provider', 'ecosystem',
      'host', '127.0.0.1',
      'port', 3306,
      'database', 'bereketfide',
      'connectionKey', 'bereketfide'
    )
  ),
  (
    'tarvista',
    'external_db',
    JSON_OBJECT('enabled', FALSE)
  ),
  (
    'default',
    'external_db',
    JSON_OBJECT('enabled', FALSE)
  ),
  (
    'avrasya',
    'branding',
    JSON_OBJECT(
      'appName', 'MarketPulse',
      'displayName', 'Avrasya Otomotiv',
      'logoUrl', '',
      'sector', 'automotive'
    )
  ),
  (
    'tarvista',
    'branding',
    JSON_OBJECT(
      'appName', 'MarketPulse',
      'displayName', 'TarVista',
      'logoUrl', '',
      'sector', 'platform'
    )
  ),
  (
    'vistaseeds',
    'branding',
    JSON_OBJECT(
      'appName', 'MarketPulse',
      'displayName', 'VistaSeeds',
      'logoUrl', '',
      'sector', 'seed'
    )
  ),
  (
    'bereketfide',
    'branding',
    JSON_OBJECT(
      'appName', 'MarketPulse',
      'displayName', 'Bereket Fide',
      'logoUrl', '',
      'sector', 'seedling'
    )
  ),
  (
    'default',
    'branding',
    JSON_OBJECT(
      'appName', 'MarketPulse',
      'displayName', 'MarketPulse',
      'logoUrl', '',
      'sector', 'platform'
    )
  ),
  ('avrasya', 'locale', JSON_OBJECT('default', 'tr')),
  ('tarvista', 'locale', JSON_OBJECT('default', 'tr')),
  ('vistaseeds', 'locale', JSON_OBJECT('default', 'tr')),
  ('bereketfide', 'locale', JSON_OBJECT('default', 'tr')),
  ('default', 'locale', JSON_OBJECT('default', 'tr'))
ON DUPLICATE KEY UPDATE
  value_json = VALUES(value_json);
