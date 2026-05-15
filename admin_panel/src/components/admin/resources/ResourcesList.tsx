import * as Mod from '@/app/(main)/admin/(admin)/resources/ResourcesList';
const AnyMod = Mod as any;
const C = AnyMod.default ?? AnyMod.ResourcesList;
export const ResourcesList = AnyMod.ResourcesList ?? C;
export default C;
export * from '@/app/(main)/admin/(admin)/resources/ResourcesList';
