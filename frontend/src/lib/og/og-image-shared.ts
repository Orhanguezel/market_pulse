import { getPublicApiBaseUrl, getPublicAppName, getSiteDisplayHostname } from '@/lib/site-config';

export function getOgImageAltSuffix(featureLabel: string): string {
  return `${getPublicAppName()} ${featureLabel}`;
}

export { getPublicApiBaseUrl as ogImageApiBaseUrl, getSiteDisplayHostname as ogImageDomainLabel };
