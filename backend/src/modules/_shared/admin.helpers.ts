import { pickUserDto } from './dto';

type AdminUserRowLike = Parameters<typeof pickUserDto>[0];

export function formatAdminUserRow(u: AdminUserRowLike, role: string) {
  return pickUserDto(u, role);
}
