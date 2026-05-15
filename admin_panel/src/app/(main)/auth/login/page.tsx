import { fetchBrandingConfig } from '@/server/fetch-branding';
import { LoginClient } from './login-client';

export default async function LoginPage() {
  const branding = await fetchBrandingConfig();
  return <LoginClient branding={branding} />;
}
