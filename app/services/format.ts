// Formatage des quantités en kilogrammes (unité de mesure de l'app).
// Affiche au plus 2 décimales, avec la virgule comme séparateur (format FR),
// et sans décimales inutiles : 1 -> « 1 », 0.5 -> « 0,5 », 1.25 -> « 1,25 ».
export function formatKg(value: number): string {
  if (!Number.isFinite(value)) return '0';
  const arrondi = Math.round(value * 100) / 100;
  return arrondi
    .toLocaleString('fr-FR', { maximumFractionDigits: 2 })
    .replace(/ /g, ' '); // normalise l'espace insécable étroit
}

// Variante avec l'unité : « 0,5 kg »
export function formatKgUnit(value: number): string {
  return `${formatKg(value)} kg`;
}

// Devise locale : Ariary malgache (MGA). Réservé pour un usage futur
// (l'app ne manipule pas de montants pour l'instant).
export function formatAr(value: number): string {
  if (!Number.isFinite(value)) return '0 Ar';
  return `${Math.round(value).toLocaleString('fr-FR').replace(/ /g, ' ')} Ar`;
}
