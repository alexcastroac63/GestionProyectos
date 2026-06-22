/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TestRun } from '../types';

/**
 * Servicio de Dominio para cálculos de aseguramiento de calidad (QA).
 */

/**
 * Calcula dinámicamente la tasa de aprobación de pruebas de software (Quality Tasa %).
 * Si hay ejecuciones reales en TestRuns, calcula (Passed / Total Ejecutados).
 * De lo contrario, retorna el valor histórico estipulado.
 * 
 * @param testRuns Lista de ejecuciones de prueba (Test Runs)
 * @param fallbackValue Porcentaje de fallback histórico si no existen ejecuciones
 * @returns Porcentaje de calidad (0-100)
 */
export function calculateQualityFromTestRuns(
  testRuns: TestRun[],
  fallbackValue: number
): number {
  if (!testRuns || testRuns.length === 0) {
    return fallbackValue;
  }
  
  // Filtrar ejecuciones válidas completadas o evaluadas (PASSED, FAILED)
  const evaluatedRuns = testRuns.filter(
    run => run.status === 'PASSED' || run.status === 'FAILED'
  );
  
  if (evaluatedRuns.length === 0) {
    return fallbackValue;
  }
  
  const passedRunsCount = evaluatedRuns.filter(run => run.status === 'PASSED').length;
  return Math.round((passedRunsCount / evaluatedRuns.length) * 100);
}

/**
 * Cuenta la cantidad de ejecuciones de prueba fallidas.
 * 
 * @param testRuns Lista de ejecuciones de prueba
 */
export function getCriticalBugsCount(testRuns: TestRun[]): number {
  if (!testRuns) return 0;
  return testRuns.filter(run => run.status === 'FAILED').length;
}

/**
 * Evalúa si una suite de pruebas cumple con el umbral mínimo aceptado de aprobación.
 * Por defecto, la PMO de Grupo Campestre requiere un umbral mínimo de 80% de casos aprobados.
 * 
 * @param passedCasos Número de casos aprobados
 * @param totalCasos Número total de casos configurados
 * @param minThreshold Umbral mínimo requerido (por defecto 80)
 */
export function isQualitySuiteAproved(
  passedCasos: number,
  totalCasos: number,
  minThreshold: number = 80
): boolean {
  if (totalCasos <= 0) {
    return false;
  }
  const rate = (passedCasos / totalCasos) * 100;
  return rate >= minThreshold;
}

/**
 * Formula 1: Cobertura de Requerimientos (%)
 * (Historias de Usuario con Casos de Prueba / Total Historias de Usuario) * 100
 */
export function calculateCoverageRate(husWithTestsCount: number, totalHUsCount: number): number {
  return totalHUsCount > 0 ? Math.round((husWithTestsCount / totalHUsCount) * 100) : 100;
}

/**
 * Formula 2: Avance de Ejecución (%)
 * (Casos de prueba ejecutados [no PENDING] / Total Casos de prueba) * 100
 */
export function calculateProgressRate(executedCasesCount: number, totalTestCasesCount: number): number {
  return totalTestCasesCount > 0 ? Math.round((executedCasesCount / totalTestCasesCount) * 100) : 100;
}

/**
 * Formula 3: Tasa de Aprobación (%)
 * (Casos de prueba PASSED / Total Ejecutados [no PENDING]) * 100
 */
export function calculateApprovalRate(passedCasesCount: number, executedCasesCount: number): number {
  return executedCasesCount > 0 ? Math.round((passedCasesCount / executedCasesCount) * 100) : 100;
}

/**
 * Formula 4: Tasa de Fallos (%)
 * (Casos de prueba FAILED / Total Ejecutados [no PENDING]) * 100
 */
export function calculateFailRate(failedCasesCount: number, executedCasesCount: number): number {
  return executedCasesCount > 0 ? Math.round((failedCasesCount / executedCasesCount) * 100) : 0;
}

/**
 * Formula 5: Densidad de Defectos por Requerimiento (Ratio)
 * (Total Bugs del Proyecto / Total Historias de Usuario con Pruebas)
 */
export function calculateBugsPerRequirement(bugsCount: number, testedHUsCount: number): string {
  return testedHUsCount > 0 ? (bugsCount / testedHUsCount).toFixed(1) : '0.0';
}

/**
 * Formula 6: Tasa de Defectos Abiertos (%)
 * (Bugs activos [Abierto, Asignado, En corrección] / Total Bugs) * 100
 */
export function calculateOpenBugsRate(openBugsCount: number, totalBugsCount: number): number {
  return totalBugsCount > 0 ? Math.round((openBugsCount / totalBugsCount) * 100) : 0;
}

/**
 * Formula 7: Tasa de Pruebas Bloqueadas (%)
 * (Casos de prueba bloqueados / Total Casos de prueba) * 100
 */
export function calculateBlockedRate(blockedCasesCount: number, totalTestCasesCount: number): number {
  return totalTestCasesCount > 0 ? Math.round((blockedCasesCount / totalTestCasesCount) * 100) : 0;
}

/**
 * Formula 8: Readiness Coeficiente de Liberación (%)
 * (Pruebas PASSED sin incidentes críticos en el Sprint / Total Casos de prueba planeados)
 */
export function calculateReadinessRate(approvalRate: number, criticalCrashed: boolean): number {
  return criticalCrashed ? Math.max(20, Math.round(approvalRate * 0.75)) : approvalRate;
}

