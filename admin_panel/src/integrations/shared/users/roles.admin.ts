// src/integrations/shared/roles.admin.ts

export type Permission = {
  key: string;
  name: string;
  group: string | null;
  description: string | null;
};

export type Role = {
  slug: string;
  name: string;
  description: string | null;
  permissions: string[];
  created_at: string;
  updated_at: string;
};

export type ApiRole = Omit<Role, 'permissions' | 'created_at' | 'updated_at'> & {
  permissions: string[] | string;
  created_at: string | number | Date;
  updated_at: string | number | Date;
};

export type RolesListParams = {
  q?: string;
  limit?: number;
  offset?: number;
  sort?: 'created_at' | 'name';
  order?: 'asc' | 'desc';
};

export type UpsertRoleBody = {
  slug: string;
  name: string;
  description?: string | null;
  permissions?: string[];
};

export type PatchRoleBody = Partial<Omit<UpsertRoleBody, 'slug'>> & { permissions?: string[] };
