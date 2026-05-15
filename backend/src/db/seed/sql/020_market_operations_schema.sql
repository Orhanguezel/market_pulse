CREATE TABLE IF NOT EXISTS market_test_runs (
  id CHAR(36) PRIMARY KEY,
  suite VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  command VARCHAR(500) NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'not_run',
  pass_count INT NOT NULL DEFAULT 0,
  fail_count INT NOT NULL DEFAULT 0,
  skip_count INT NOT NULL DEFAULT 0,
  output_excerpt TEXT NULL,
  risk_note TEXT NULL,
  created_by VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_market_test_runs_suite (suite),
  INDEX idx_market_test_runs_status (status),
  INDEX idx_market_test_runs_created_at (created_at)
);

CREATE TABLE IF NOT EXISTS market_developer_notes (
  id CHAR(36) PRIMARY KEY,
  subject VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  priority VARCHAR(30) NOT NULL DEFAULT 'normal',
  status VARCHAR(30) NOT NULL DEFAULT 'open',
  page_path VARCHAR(500) NULL,
  attachment_url VARCHAR(1000) NULL,
  created_by VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_market_developer_notes_status (status),
  INDEX idx_market_developer_notes_priority (priority),
  INDEX idx_market_developer_notes_page_path (page_path),
  INDEX idx_market_developer_notes_created_at (created_at)
);
