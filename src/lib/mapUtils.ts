export function calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRadians = (degrees: number) => degrees * Math.PI / 180;
  const toDegrees = (radians: number) => radians * 180 / Math.PI;

  const φ1 = toRadians(lat1);
  const λ1 = toRadians(lon1);
  const φ2 = toRadians(lat2);
  const λ2 = toRadians(lon2);

  const y = Math.sin(λ2 - λ1) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(λ2 - λ1);
  const θ = Math.atan2(y, x);

  return (toDegrees(θ) + 360) % 360;
}

export function getDirectionFromBearing(bearing: number): string {
  if (bearing > 337.5 || bearing <= 22.5) return 'Northbound';
  if (bearing > 22.5 && bearing <= 67.5) return 'Northeastbound';
  if (bearing > 67.5 && bearing <= 112.5) return 'Eastbound';
  if (bearing > 112.5 && bearing <= 157.5) return 'Southeastbound';
  if (bearing > 157.5 && bearing <= 202.5) return 'Southbound';
  if (bearing > 202.5 && bearing <= 247.5) return 'Southwestbound';
  if (bearing > 247.5 && bearing <= 292.5) return 'Westbound';
  if (bearing > 292.5 && bearing <= 337.5) return 'Northwestbound';
  return 'Northbound';
}

export function calculateDistanceFeet(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRadians = (degrees: number) => degrees * Math.PI / 180;
  const R = 6371000;
  const φ1 = toRadians(lat1);
  const φ2 = toRadians(lat2);
  const Δφ = toRadians(lat2 - lat1);
  const Δλ = toRadians(lon2 - lon1);

  const a =
    Math.sin(Δφ / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c * 3.28084;
}
