import * as Mod from '@/app/(main)/admin/(admin)/services/_components/ServicesList';
const AnyMod = Mod as any;
const C = AnyMod.default ?? AnyMod.ServicesList;
export const ServicesList = AnyMod.ServicesList ?? C;
export default C;
export * from '@/app/(main)/admin/(admin)/services/_components/ServicesList';
