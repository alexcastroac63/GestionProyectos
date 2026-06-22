/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { WorkItem, TransitionRule } from '../types';

/**
 * Interfaz que modela el contexto técnico y funcional de una historia de usuario
 * al intentar transicionar en el tablero ágil Scrum / Kanban.
 */
export interface TransitionContext {
  story: WorkItem;
  targetCol: string;
  activeRules: TransitionRule[];
  techCriteriaCount: number;
  unresolvedCriticalBugsCount: number;
  currentSprintStatus?: string;
  activeBugsCount: number;
  failedTestCasesCount: number;
  totalTestCasesCount: number;
  passedTestCasesCount: number;
  notPassedCriteriaCount: number;
  hasEvidence: boolean;
  openBugsCount: number;
}

/**
 * Valida la transición de un ítem de trabajo a una columna de destino en el tablero Kanban.
 * Devuelve un booleano indicando el éxito y un arreglo de errores descriptivos si se violan reglas.
 * 
 * @param context Contexto del ítem y las reglas de negocio
 * @returns { success: boolean; errors: string[] }
 */
export function validateStateTransition(context: TransitionContext): { success: boolean; errors: string[] } {
  const {
    story,
    targetCol,
    activeRules,
    techCriteriaCount,
    unresolvedCriticalBugsCount,
    currentSprintStatus,
    activeBugsCount,
    failedTestCasesCount,
    totalTestCasesCount,
    passedTestCasesCount,
    notPassedCriteriaCount,
    hasEvidence,
    openBugsCount,
  } = context;

  const errors: string[] = [];

  const isRuleEnabled = (id: string) => {
    const r = activeRules.find(x => x.id === id);
    return r ? r.enabled : true;
  };

  const getRuleDesc = (id: string, defaultDesc: string) => {
    const r = activeRules.find(x => x.id === id);
    return r ? r.desc : defaultDesc;
  };

  // 1. NO_INICIADO
  if (targetCol === 'NO_INICIADO') {
    if (isRuleEnabled('no_iniciados_prioridad') && !story.priority) {
      errors.push(getRuleDesc('no_iniciados_prioridad', 'La historia debe tener prioridad estipulada.'));
    }
    if (isRuleEnabled('no_iniciados_responsable') && !story.assignee_id) {
      errors.push(getRuleDesc('no_iniciados_responsable', 'Debe asignarse un responsable técnico/funcional.'));
    }
  }

  // 2. EN_ANALISIS
  if (targetCol === 'EN_ANALISIS') {
    if (isRuleEnabled('en_analisis_descripcion') && (!story.description || story.description.length < 10)) {
      errors.push(getRuleDesc('en_analisis_descripcion', 'Debe registrarse una descripción clara o analítica del requerimiento.'));
    }
    if (isRuleEnabled('en_analisis_responsable') && !story.assignee_id) {
      errors.push(getRuleDesc('en_analisis_responsable', 'Responsable técnico/funcional no asignado.'));
    }
  }

  // 3. EN_DESARROLLO (Definition of Ready - DOR)
  if (targetCol === 'EN_DESARROLLO') {
    if (isRuleEnabled('en_desarrollo_sp') && !story.story_points) {
      errors.push(getRuleDesc('en_desarrollo_sp', 'DOR: No estimulado. Ingrese Story Points (SP) antes de desarrollar.'));
    }
    if (isRuleEnabled('en_desarrollo_unblocked') && (story as any).blocked) {
      errors.push(getRuleDesc('en_desarrollo_unblocked', 'DOR BLOQUEADA: Desbloquee el requerimiento ingresando el motivo.'));
    }
  }

  // 4. CODE_REVIEW
  if (targetCol === 'CODE_REVIEW') {
    if (isRuleEnabled('code_review_criteria') && techCriteriaCount === 0) {
      errors.push(getRuleDesc('code_review_criteria', 'Debe documentar o seleccionar al menos un componente o Criterio Técnico.'));
    }
  }

  // 5. LISTO_PARA_QA
  if (targetCol === 'LISTO_PARA_QA') {
    if (isRuleEnabled('listo_qa_no_crit_bugs') && unresolvedCriticalBugsCount > 0) {
      errors.push(getRuleDesc('listo_qa_no_crit_bugs', 'Existen bugs críticos o bloqueantes sin resolver en este ítem.'));
    }
  }

  // 6. EN_QA
  if (targetCol === 'EN_QA') {
    if (
      isRuleEnabled('en_qa_sprint_active') &&
      (!currentSprintStatus || (currentSprintStatus !== 'EN_QA' && currentSprintStatus !== 'EN_CURSO'))
    ) {
      errors.push(getRuleDesc('en_qa_sprint_active', 'El Sprint debe estar activo ("En Ejecución" o "En QA") para auditar pruebas.'));
    }
  }

  // 7. DEVUELTO_QA
  if (targetCol === 'DEVUELTO_QA') {
    const hasFailed = failedTestCasesCount > 0;
    if (isRuleEnabled('devuelto_qa_require_bug') && activeBugsCount === 0 && !hasFailed) {
      errors.push(getRuleDesc('devuelto_qa_require_bug', 'Para devolver la historia debe reportarse al menos un Bug abierto o Caso fallido.'));
    }
  }

  // 8. APROBADO_QA
  if (targetCol === 'APROBADO_QA') {
    if (isRuleEnabled('aprobado_qa_has_cases') && totalTestCasesCount === 0) {
      errors.push(getRuleDesc('aprobado_qa_has_cases', 'Falta Casos: No se han configurado pruebas para este requerimiento.'));
    } else {
      const allCompleted = totalTestCasesCount > 0 && passedTestCasesCount === totalTestCasesCount;
      if (isRuleEnabled('aprobado_qa_cases_passed') && !allCompleted) {
        errors.push(getRuleDesc('aprobado_qa_cases_passed', 'Falta Ejecución: Todos los casos de prueba cargados deben marcarse APROBADO (PASSED).'));
      }
    }

    if (isRuleEnabled('aprobado_qa_no_bugs') && unresolvedCriticalBugsCount > 0) {
      errors.push(getRuleDesc('aprobado_qa_no_bugs', 'Defectos Abiertos: No se puede aprobar si cuenta con bugs Críticos/Altos activos.'));
    }

    const allPassedCriteria = notPassedCriteriaCount === 0;
    if (isRuleEnabled('aprobado_qa_criteria_ok') && !allPassedCriteria) {
      errors.push(getRuleDesc('aprobado_qa_criteria_ok', 'Criterios Pendientes: Valide que todos los Criterios de Aceptación obligatorios marquen "Cumple" o "No Aplica".'));
    }
  }

  // 9. APROBADO_FUNCIONAL / APROBADO_PO
  if (targetCol === 'APROBADO_FUNCIONAL') {
    const allPassed = totalTestCasesCount > 0 && passedTestCasesCount === totalTestCasesCount;
    if (isRuleEnabled('aprobado_po_all_passed') && !allPassed) {
      errors.push(getRuleDesc('aprobado_po_all_passed', 'No autorizado por PO: Es imperativo pasar al 100% las pruebas QA antes.'));
    }
  }

  // 10. FINALIZADO (Definition of Done - DOD)
  if (targetCol === 'FINALIZADO') {
    if (isRuleEnabled('finalizado_evidence') && !hasEvidence) {
      errors.push(getRuleDesc('finalizado_evidence', 'DOD INCUMPIDLO: Adjunte por lo menos una Captura/PDF de evidencia funcional antes de Cerrar.'));
    }
    if (isRuleEnabled('finalizado_no_crit_bugs') && openBugsCount > 0) {
      errors.push(getRuleDesc('finalizado_no_crit_bugs', 'DOD INCUMPLIDO: Sigue existiendo defectos críticos no solventados.'));
    }
  }

  return {
    success: errors.length === 0,
    errors
  };
}
