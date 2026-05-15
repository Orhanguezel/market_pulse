// Google Maps Places JS SDK'yı tek seferlik dinamik yükler.
// Birden fazla bileşen aynı anda çağırırsa aynı promise'ı paylaşır.
// Not: @types/google.maps eklemek yerine 'any' kullanıyoruz — runtime erişim
// (window.google.maps.places) zaten çalışıyor.

type GMaps = any;

let loaderPromise: Promise<GMaps> | null = null;

export function loadGoogleMaps(): Promise<GMaps> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('googleMaps_only_in_browser'));
  }
  if ((window as any).google?.maps?.places) {
    return Promise.resolve((window as any).google);
  }
  if (loaderPromise) return loaderPromise;

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return Promise.reject(new Error('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY missing'));
  }

  loaderPromise = new Promise((resolve, reject) => {
    const cbName = `__gm_cb_${Date.now()}`;
    (window as any)[cbName] = () => {
      delete (window as any)[cbName];
      resolve((window as any).google);
    };
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&language=tr&callback=${cbName}`;
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      loaderPromise = null;
      reject(new Error('google_maps_script_failed'));
    };
    document.head.appendChild(script);
  });

  return loaderPromise;
}
