// src/integrations/shared/user_roles.ts
import type { UserRoleName } from './users';

export type UserRole = {
  id: string;
  user_id: string;
  role: UserRoleName;
  created_at?: string;
};

export type UserRolesListParams = {
  user_id?: string;
  role?: UserRoleName;
  order?: 'created_at';
  direction?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
};
