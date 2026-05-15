import * as Mod from '@/app/(main)/admin/(admin)/db/_components/admin-db-client';
const AnyMod = Mod as any;
const C = AnyMod.default ?? AnyMod.AdminDbPage;
export const AdminDbPage = AnyMod.AdminDbPage ?? C;
export default C;
export * from '@/app/(main)/admin/(admin)/db/_components/admin-db-client';
