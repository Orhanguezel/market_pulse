export interface BoothGrid {
  hall: string | null;
  row: string | null;
  col: number | null;
  raw: string;
}

export function parseBooth(input: string | null | undefined): BoothGrid {
  const raw = String(input ?? '').trim();
  if (!raw) return { hall: null, row: null, col: null, raw };

  const compact = raw.replace(/\s+/g, ' ');
  const match = compact.match(/(?:hall\s*)?([0-9]+(?:\.[0-9]+)?)\s*[,/-]?\s*([A-Z])\s*[-\s]?([0-9]+)/i);
  if (!match) return { hall: null, row: null, col: null, raw };

  return {
    hall: match[1],
    row: match[2].toUpperCase(),
    col: Number(match[3]),
    raw,
  };
}

export function isNeighborBooth(
  booth: BoothGrid,
  anchor: BoothGrid = parseBooth('3.1 D11'),
  maxColumnDistance = 5,
): boolean {
  if (!booth.hall || !booth.row || booth.col === null) return false;
  if (!anchor.hall || !anchor.row || anchor.col === null) return false;
  return booth.hall === anchor.hall
    && booth.row === anchor.row
    && Math.abs(booth.col - anchor.col) <= maxColumnDistance
    && booth.col !== anchor.col;
}
