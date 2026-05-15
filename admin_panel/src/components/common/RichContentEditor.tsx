import * as Mod from '@/app/(main)/admin/_components/common/RichContentEditor';
const AnyMod = Mod as any;
const C = AnyMod.default ?? AnyMod.RichContentEditor;
export const RichContentEditor = AnyMod.RichContentEditor ?? C;
export default C;
export * from '@/app/(main)/admin/_components/common/RichContentEditor';
