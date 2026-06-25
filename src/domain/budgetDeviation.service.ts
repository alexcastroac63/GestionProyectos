/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Servicio de Dominio para el cálculo y gestión de consumo de presupuestos.
 */

/**
 * Calcula el porcentaje de consumo de presupuesto.
 * Fórmula: (Costo Real Acumulado / Presupuesto Total Aprobado) * 100
 * 
 * @param realCost Costo real acumulado
 * @param approvedBudget Presupuesto total aprobado
 * @returns Porcentaje de consumo
 */
export function calculateBudgetConsumption(realCost: number, approvedBudget: number): number {
  if (approvedBudget <= 0) {
    return 0;
  }
  return Math.round((realCost / approvedBudget) * 100);
}

/**
 * Determina las clases CSS para colorear los KPIs presupuestarios según rangos definidos para consumo.
 * - Verde (Emerald): <= 80%
 * - Amarillo (Amber): > 80% y <= 100%
 * - Rojo (Rose): > 100%
 * 
 * @param consumption Porcentaje de consumo de presupuesto
 */
export function getBudgetHealthClasses(consumption: number): string {
  if (consumption <= 80) {
    return 'text-emerald-600 font-bold';
  }
  if (consumption <= 100) {
    return 'text-amber-600';
  }
  return 'text-rose-600 font-bold';
}

/**
 * Obtiene la categoría cualitativa de salud del consumo presupuestario.
 * @param consumption Porcentaje de consumo de presupuesto
 */
export function getBudgetHealthStatus(consumption: number): 'Verde' | 'Amarillo' | 'Rojo' {
  if (consumption <= 80) {
    return 'Verde';
  }
  if (consumption <= 100) {
    return 'Amarillo';
  }
  return 'Rojo';
}
