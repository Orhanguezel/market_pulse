import * as Mod from '@/app/(main)/admin/_components/common/AdminJsonEditor';
const AnyMod = Mod as any;
const C = AnyMod.default ?? AnyMod.AdminJsonEditor;
export const AdminJsonEditor = AnyMod.AdminJsonEditor ?? C;
export default C;
export * from '@/app/(main)/admin/_components/common/AdminJsonEditor';
