import * as Mod from '@/app/(main)/admin/(admin)/services/serviceForm/ServiceForm';
const AnyMod = Mod as any;
const C = AnyMod.default ?? AnyMod.ServiceForm;
export const ServiceForm = AnyMod.ServiceForm ?? C;
export default C;
export * from '@/app/(main)/admin/(admin)/services/serviceForm/ServiceForm';
