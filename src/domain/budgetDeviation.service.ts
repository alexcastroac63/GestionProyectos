/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Servicio de Dominio para el cálculo y gestión de desviaciones presupuestarias.
 */

/**
 * Calcula la variación porcentual de presupuesto según el estándar PMO.
 * Fórmula: ((Costo Real Acumulado - Presupuesto Planificado Acumulado) / Presupuesto Planificado Acumulado) * 100
 * 
 * @param realCost Costo real acumulado
 * @param plannedBudget Presupuesto planificado acumulado
 * @returns Variación porcentual (siempre >= 0 para evitar distorsiones negativas)
 */
export function calculateBudgetVariation(realCost: number, plannedBudget: number): number {
  if (plannedBudget <= 0) {
    return 0;
  }
  const deviation = Math.round(((realCost - plannedBudget) / plannedBudget) * 100);
  return deviation < 0 ? 0 : deviation;
}

/**
 * Determina las clases CSS para colorear los KPIs presupuestarios según rangos definidos.
 * - Verde (Emerald): <= 5%
 * - Amarillo (Amber): > 5% y <= 10%
 * - Rojo (Rose): > 10%
 * 
 * @param variation Variación porcentual de presupuesto
 */
export function getBudgetHealthClasses(variation: number): string {
  if (variation <= 5) {
    return 'text-emerald-600 font-bold';
  }
  if (variation <= 10) {
    return 'text-amber-600';
  }
  return 'text-rose-600 font-bold';
}

/**
 * Obtiene la categoría cualitativa de desvío presupuestario
 * @param variation Variación porcentual de presupuesto
 */
export function getBudgetHealthStatus(variation: number): 'Verde' | 'Amarillo' | 'Rojo' {
  if (variation <= 5) {
    return 'Verde';
  }
  if (variation <= 10) {
    return 'Amarillo';
  }
  return 'Rojo';
}
