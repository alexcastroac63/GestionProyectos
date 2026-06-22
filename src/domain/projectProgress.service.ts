/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Servicio de Dominio para el cálculo y gestión del avance físico y cumplimiento de cronogramas.
 */

/**
 * Calcula el avance físico ponderado del proyecto en base a las 5 fases estándar de la PMO del Grupo Campestre.
 * Ponderaciones oficiales:
 * - Levantamiento / Requerimientos: 15%
 * - Diseño: 20%
 * - Desarrollo / Codificación: 35%
 * - Pruebas / QA: 20%
 * - Despliegue / Producción: 10%
 * 
 * @param levantamiento Progreso de la fase de Levantamiento (0-100)
 * @param diseno Progreso de la fase de Diseño (0-100)
 * @param desarrollo Progreso de la fase de Desarrollo (0-100)
 * @param pruebas Progreso de la fase de Pruebas (0-100)
 * @param produccion Progreso de la fase de Producción (0-100)
 * @returns Avance físico ponderado redondeado al entero más cercano
 */
export function calculateWeightedPhysicalProgress(
  levantamiento: number,
  diseno: number,
  desarrollo: number,
  pruebas: number,
  produccion: number
): number {
  const weighted = 
    (levantamiento * 0.15) +
    (diseno * 0.20) +
    (desarrollo * 0.35) +
    (pruebas * 0.20) +
    (produccion * 0.10);
  return Math.round(weighted);
}

/**
 * Calcula el porcentaje de cumplimiento del cronograma con base en actividades completadas.
 * 
 * @param completedCount Cantidad de actividades completas/realizadas
 * @param totalCount Cantidad total de actividades en el proyecto
 * @param fallbackValue Valor por defecto si no hay actividades registradas en el mapa actual
 */
export function calculateScheduleCompliance(
  completedCount: number,
  totalCount: number,
  fallbackValue: number = 100
): number {
  if (totalCount <= 0) {
    return fallbackValue;
  }
  return Math.round((completedCount / totalCount) * 100);
}

/**
 * Evalúa el indicador de riesgo de un proyecto según los 3 factores clave definidos por la PMO:
 * - % Cumplimiento Cronograma (Rojo si < 75%, Amarillo si 75-89%, Verde si >= 90%)
 * - % Variación Presupuesto (Rojo si > 10%, Amarillo si 5-10%, Verde si <= 5%)
 * - % Calidad (Rojo si < 75%, Amarillo si 75-89%, Verde si >= 90%)
 * 
 * @param scheduleCompliance % Cumplimiento de Cronograma
 * @param budgetVariation % Variación del Presupuesto
 * @param qualityPercent % Calidad de Entregables
 * @returns 'Rojo' | 'Amarillo' | 'Verde'
 */
export function evaluateProjectRiskStatus(
  scheduleCompliance: number,
  budgetVariation: number,
  qualityPercent: number
): 'Rojo' | 'Amarillo' | 'Verde' {
  if (scheduleCompliance < 75 || budgetVariation > 10 || qualityPercent < 75) {
    return 'Rojo';
  }
  
  if (
    (scheduleCompliance >= 75 && scheduleCompliance < 90) ||
    (budgetVariation > 5 && budgetVariation <= 10) ||
    (qualityPercent >= 75 && qualityPercent < 90)
  ) {
    return 'Amarillo';
  }
  
  return 'Verde';
}
