// =============================================================
// FILE: src/integrations/types/users.ts
// =============================================================

export type UserRoleName = "admin" | "moderator" | "consultant" | "user";

export type UserRole = {
  id: string;
  name: UserRoleName;
  description?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type UserMetadata =
  | {
    full_name?: string | null;
    name?: string | null;
    [k: string]: unknown;
  }
  | null;

export type ProfileRow = {
  id: string;
  email?: string | null;
  is_active?: boolean | 0 | 1 | "0" | "1" | null;

  full_name: string | null;
  phone?: string | null;
  avatar_url?: string | null;

  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  country?: string | null;
  postal_code?: string | null;

  wallet_balance?: number | string | null;

  created_at: string;
  updated_at?: string | null;
};

export type UserRoleRow = {
  id: string;
  user_id: string;
  role: UserRoleName;
  created_at?: string | null;
};

export type UserRoleListParams = {
  user_id?: string;
  role?: UserRoleName;
  order?: 'created_at';
  direction?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
};

/** Admin API ham cevabını kapsayan raw tip (role veya roles gelebilir) */
export type AdminUserRaw = {
  id: string;
  email: string | null;
  full_name?: string | null;
  created_at?: string | null;
  role?: UserRoleName | string | null;
  roles?: Array<UserRoleName | string> | string | null;
};

/** Normalize edilmiş admin user görünümü (UI bundan beslenecek) */
export type AdminUserView = {
  id: string;
  email: string | null;
  full_name: string | null;
  created_at: string | null;
  roles: UserRoleName[]; // her zaman dizi
};

/**
 * FE'de genel User tipi
 * - Auth endpoint'lerinden dönen core/types.User ile yapısal olarak uyumlu olacak şekilde geniş tutuldu
 */
export type User = {
  id: string;
  email: string;

  full_name?: string | null;
  phone?: string | null;

  // flag'ler backend'den 0/1 veya string olarak da gelebilir
  is_active?: boolean | 0 | 1 | "0" | "1" | null;
  email_verified?: boolean | 0 | 1 | "0" | "1" | null;

  // decimal alanlar string veya number olabilir
  wallet_balance?: string | number | null;

  last_sign_in_at?: string | null; // ISO
  created_at?: string;
  updated_at?: string;

  /**
   * Auth / status uçlarından string role gelebileceği için
   * hem UserRole objesini hem de string'i kabul edecek şekilde genişletildi.
   */
  role?: UserRole | UserRoleName | string | null;

  /** Bazı uçlar roles[] döndürebilir, opsiyonel bıraktık */
  roles?: Array<UserRoleName | string> | null;

  /** Supabase / custom metadata */
  user_metadata?: UserMetadata;

  [key: string]: unknown;
};
