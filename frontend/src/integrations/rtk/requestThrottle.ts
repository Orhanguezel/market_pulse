// =============================================================
// Request concurrency throttle — 429 rate-limit koruması
// Nginx rate-limit'e çarpmamak için eşzamanlı HTTP istek sayısını sınırlar.
// Fazla istekler kuyruğa alınır, slot açıldığında sırayla gönderilir.
// =============================================================

const MAX_CONCURRENT = 6;
let active = 0;
const pending: Array<() => void> = [];

export function acquireSlot(): Promise<void> {
  if (active < MAX_CONCURRENT) {
    active++;
    return Promise.resolve();
  }
  return new Promise<void>((resolve) => {
    pending.push(resolve);
  });
}

export function releaseSlot(): void {
  active--;
  if (pending.length > 0) {
    active++;
    pending.shift()!();
  }
}
