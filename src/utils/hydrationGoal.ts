/**
 * Calculates the daily hydration goal in milliliters (ml) based on body weight in kilograms.
 * 
 * Rules:
 * 0 - 20 kg  => 1000 ml (1.0 L)
 * >20 - 40 kg => 2000 ml (2.0 L)
 * >40 - 50 kg => 2500 ml (2.5 L)
 * >50 - 60 kg => 3000 ml (3.0 L)
 * >60 - 70 kg => 3500 ml (3.5 L)
 * >70 - 80 kg => 4000 ml (4.0 L)
 * >80 - 90 kg => 4500 ml (4.5 L)
 * >90 - 100 kg => 5000 ml (5.0 L)
 * >100 kg    => 5000 ml + 500 ml for every 10 kg over 100 kg
 */
export function calculateDailyGoalMl(weightKg: number): number {
  if (weightKg <= 0) return 2000; // default fallback if invalid
  
  if (weightKg <= 20) return 1000;
  if (weightKg <= 40) return 2000;
  if (weightKg <= 50) return 2500;
  if (weightKg <= 60) return 3000;
  if (weightKg <= 70) return 3500;
  if (weightKg <= 80) return 4000;
  if (weightKg <= 90) return 4500;
  if (weightKg <= 100) return 5000;
  
  // For weights > 100 kg, add 500 ml for each 10 kg step
  const extraKg = weightKg - 100;
  const extraSteps = Math.ceil(extraKg / 10);
  return 5000 + (extraSteps * 500);
}

/**
 * Formats milliliters to Liters string representation (e.g. 2500 -> "2.5 L")
 */
export function formatMlToLiters(ml: number): string {
  const liters = ml / 1000;
  // If whole number, format without decimal, else 1 or 2 decimals
  if (liters % 1 === 0) {
    return `${liters.toFixed(0)}.0 L`;
  }
  return `${liters.toFixed(2).replace(/\.?0+$/, '')} L`;
}

/**
 * Gets local YYYY-MM-DD date string for strict local timezone handling
 */
export function getLocalDateString(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
