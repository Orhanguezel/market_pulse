import * as Mod from '@/app/(main)/admin/_components/common/useAdminLocales';
const AnyMod = Mod as any;
const C = AnyMod.default ?? AnyMod.useAdminLocales;
export const useAdminLocales = AnyMod.useAdminLocales ?? C;
export default C;
export * from '@/app/(main)/admin/_components/common/useAdminLocales';
