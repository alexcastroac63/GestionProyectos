import React, { useState, useEffect } from 'react';
import { 
  Sprint, 
  WorkItem, 
  User, 
  Project, 
  WorkItemStatus,
  TestSuite,
  TestCase,
  TestRun,
  TransitionRule
} from '../types';
import { DEFAULT_TRANSITION_RULES } from '../data';

const formatSprintName = (name: string): string => {
  const match = name.match(/\d+/);
  return match ? `SPRINT ${match[0]}` : name.toUpperCase();
};
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Users, 
  UserCheck, 
  Sparkles, 
  Layers, 
  Plus, 
  Trash2, 
  Check, 
  X, 
  HelpCircle, 
  ChevronRight, 
  ChevronDown, 
  Play, 
  History, 
  Bug, 
  Paperclip, 
  TrendingUp, 
  Target, 
  Lock, 
  Unlock, 
  ShieldAlert,
  Sliders,
  ChevronLeft
} from 'lucide-react';

interface ScrumBoardAndQaManagerProps {
  selectedProjectId: string;
  setSelectedProjectId: (id: string) => void;
  projects: Project[];
  users: User[];
  sprints: Sprint[];
  setSprints: React.Dispatch<React.SetStateAction<Sprint[]>>;
  workItems: WorkItem[];
  setWorkItems: React.Dispatch<React.SetStateAction<WorkItem[]>>;
  testCases: TestCase[];
  setTestCases: React.Dispatch<React.SetStateAction<TestCase[]>>;
  testRuns: TestRun[];
  setTestRuns: React.Dispatch<React.SetStateAction<TestRun[]>>;
  addLog: (user: string, text: string) => void;
  loggedInUser?: User;
}

// 11 Columns for main board
type MainColumnStatus = 
  | 'BACKLOG_SPRINT'
  | 'NO_INICIADO'
  | 'EN_ANALISIS'
  | 'EN_DESARROLLO'
  | 'CODE_REVIEW'
  | 'LISTO_PARA_QA'
  | 'EN_QA'
  | 'DEVUELTO_QA'
  | 'APROBADO_QA'
  | 'APROBADO_FUNCIONAL'
  | 'FINALIZADO';

// 11 Columns for special QA board
type QaColumnStatus =
  | 'PENDIENTE_CASOS'
  | 'CASOS_DEFINIDOS'
  | 'EJECUCION_QA'
  | 'PRUEBA_FALLIDA'
  | 'DEFECTO_REPORTADO'
  | 'CORRECCION_DEV'
  | 'CORREGIDO_DEV'
  | 'RE_TEST'
  | 'APROBADO_QA'
  | 'APROBADO_FUNCIONAL'
  | 'CERRADO_QA';

interface AcceptanceCriterion {
  id: string;
  user_story_id: string;
  number: number;
  description: string;
  type: 'Funcional' | 'Validación' | 'Cálculo' | 'Integración' | 'Seguridad' | 'Reporte';
  expected_result: string;
  status: 'Pendiente' | 'Cumple' | 'No cumple' | 'No aplica';
  validated_by?: string; // User ID
  validated_at?: string;
  comment?: string;
}

interface TechnicalCriterion {
  id: string;
  user_story_id: string;
  description: string;
  component: string;
  api?: string;
  database_object?: string;
  integration?: string;
  security_rule?: string;
}

interface ScrumBug {
  id: string;
  user_story_id: string;
  test_case_id?: string;
  sprint_id: string;
  code: string;
  title: string;
  description: string;
  steps_to_reproduce: string;
  expected_result: string;
  actual_result: string;
  severity: 'Bloqueante' | 'Crítica' | 'Alta' | 'Media' | 'Baja';
  priority: 'Alta' | 'Media' | 'Baja';
  status: 'Abierto' | 'Asignado' | 'En corrección' | 'Corregido' | 'En re-test' | 'Cerrado' | 'Rechazado';
  assigned_developer_id?: string;
  assigned_qa_id?: string;
  reported_by: string; // User Name
  reported_at: string;
}

interface ScrumEvidence {
  id: string;
  entity_type: 'story' | 'criterion' | 'testcase' | 'bug' | 'sprint';
  entity_id: string;
  file_name: string;
  file_type: string;
  description: string;
  uploaded_by: string;
  uploaded_at: string;
  url: string;
}

interface AuditLog {
  id: string;
  sprint_id: string;
  user: string;
  role: string;
  action: string;
  timestamp: string;
}

export default function ScrumBoardAndQaManager({
  selectedProjectId,
  setSelectedProjectId,
  projects,
  users,
  sprints,
  setSprints,
  workItems,
  setWorkItems,
  testCases,
  setTestCases,
  testRuns,
  setTestRuns,
  addLog,
  loggedInUser
}: ScrumBoardAndQaManagerProps) {
  // Active User Selection (role based testing)
  const [currentUser, setCurrentUser] = useState<User>(() => {
    return loggedInUser || users[0] || {
      id: 'u-admin',
      first_name: 'Carlos',
      last_name: 'Pérez',
      email: 'carlos@empresa.com',
      role: 'Administrador PMO',
      status: 'ACTIVE'
    };
  });

  useEffect(() => {
    if (loggedInUser) {
      setCurrentUser(loggedInUser);
    }
  }, [loggedInUser]);

  // Sprint lists state
  const projectSprints = sprints.filter(s => s.project_id === selectedProjectId);
  const activeSprint = projectSprints.length > 0 
    ? (projectSprints.find(s => s.status === 'EN_CURSO' || (s.status as any) === 'EN_QA') || projectSprints[0])
    : null;
  
  const [selectedSprintId, setSelectedSprintId] = useState<string>(activeSprint?.id || '');

  // Synchronize when projectId changes
  useEffect(() => {
    const spts = SprintsForProject;
    if (spts.length > 0) {
      const activeSp = spts.find(s => s.status === 'EN_CURSO' || (s.status as any) === 'EN_QA') || spts[0];
      setSelectedSprintId(activeSp.id);
    } else {
      setSelectedSprintId('');
    }
  }, [selectedProjectId, sprints]);

  const SprintsForProject = sprints.filter(s => s.project_id === selectedProjectId);
  const currentSprint = SprintsForProject.find(s => s.id === selectedSprintId) || SprintsForProject[0];

  // Active Sub-tab in Scrum Board
  const [scrumSubTab, setScrumSubTab] = useState<'main_board' | 'qa_board' | 'dashboard' | 'detail' | 'logs'>('main_board');

  // Collapsible state for top controls, defaulted to false (collapsed)
  const [isTopControlsExpanded, setIsTopControlsExpanded] = useState<boolean>(false);

  // Load and manage our extended custom data models from local storage
  const [criteria, setCriteria] = useState<AcceptanceCriterion[]>(() => {
    const raw = localStorage.getItem('scrum_criteria');
    if (raw && raw !== "undefined" && raw !== "null") {
      try {
        const parsed = JSON.parse(raw);
        if (parsed !== null && parsed !== undefined) return parsed;
      } catch (e) {
        console.error("Failed to parse scrum_criteria", e);
      }
    }
    return [
      {
        id: 'crit-1',
        user_story_id: 'item-3', // HU00003
        number: 1,
        description: 'La vista semanal del inventario proyectado debe reflejar el lead time configurado.',
        type: 'Cálculo',
        expected_result: 'El cálculo automático de inventario proyectado despliega la merma configurada en base al lead time.',
        status: 'Cumple',
        validated_by: 'u-5',
        validated_at: '2026-06-01T14:30:00Z',
        comment: 'Validado con datos del mock y bases relacionales perfectas.'
      },
      {
        id: 'crit-2',
        user_story_id: 'item-3',
        number: 2,
        description: 'No se debe permitir rebasar el límite de cobertura de seguridad de la planta.',
        type: 'Validación',
        expected_result: 'Disparar advertencia visual roja al superar el umbral.',
        status: 'Pendiente'
      }
    ];
  });

  const [techCriteria, setTechCriteria] = useState<TechnicalCriterion[]>(() => {
    const raw = localStorage.getItem('scrum_tech_criteria');
    if (raw && raw !== "undefined" && raw !== "null") {
      try {
        const parsed = JSON.parse(raw);
        if (parsed !== null && parsed !== undefined) return parsed;
      } catch (e) {
        console.error("Failed to parse scrum_tech_criteria", e);
      }
    }
    return [
      {
        id: 't-crit-1',
        user_story_id: 'item-3',
        description: 'El cálculo de coberturas semanales debe ejecutarse usando llamadas preparadas Postgres optimizadas.',
        component: 'Data Access Engine',
        api: 'GET /api/inventory/projections',
        database_object: 'v_projected_inventory',
        security_rule: 'Filtrado estricto por clúster de planta asignada en token JWT.'
      }
    ];
  });

  const [bugs, setBugs] = useState<ScrumBug[]>(() => {
    const raw = localStorage.getItem('scrum_bugs');
    if (raw && raw !== "undefined" && raw !== "null") {
      try {
        const parsed = JSON.parse(raw);
        if (parsed !== null && parsed !== undefined) return parsed;
      } catch (e) {
        console.error("Failed to parse scrum_bugs", e);
      }
    }
    return [
      {
        id: 'bug-1',
        user_story_id: 'item-3',
        test_case_id: 'case-4',
        sprint_id: 'sprint-2',
        code: 'BUG-101',
        title: 'Desfase de zona horaria en el cálculo semanal',
        description: 'Al calcular el inventario proyectado para plantas de Occidente, el día domingo se muestra doble.',
        steps_to_reproduce: '1. Ingresar con planta Tepic\n2. Cargar proyecciones de demanda semana 24\n3. Observar eje temporal en histograma',
        expected_result: '7 días continuos sin traslapes ni duplicidad el fin de semana.',
        actual_result: '8 divisiones en el eje con el domingo replicado 2 veces.',
        severity: 'Crítica',
        priority: 'Alta',
        status: 'Abierto',
        reported_by: 'Valentina Rojas (QA)',
        reported_at: '2026-06-02T16:00:00Z'
      }
    ];
  });

  const [evidences, setEvidences] = useState<ScrumEvidence[]>(() => {
    const raw = localStorage.getItem('scrum_evidences');
    if (raw && raw !== "undefined" && raw !== "null") {
      try {
        const parsed = JSON.parse(raw);
        if (parsed !== null && parsed !== undefined) return parsed;
      } catch (e) {
        console.error("Failed to parse scrum_evidences", e);
      }
    }
    return [
      {
        id: 'ev-1',
        entity_type: 'story',
        entity_id: 'item-3',
        file_name: 'test_coverage_pass.png',
        file_type: 'image/png',
        description: 'Evidencia inicial de pruebas lógicas unitarias en frontend.',
        uploaded_by: 'Juan Pérez (Dev)',
        uploaded_at: '2026-06-03T11:00:00Z',
        url: '#'
      }
    ];
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const raw = localStorage.getItem('scrum_audit_logs');
    if (raw && raw !== "undefined" && raw !== "null") {
      try {
        const parsed = JSON.parse(raw);
        if (parsed !== null && parsed !== undefined) return parsed;
      } catch (e) {
        console.error("Failed to parse scrum_audit_logs", e);
      }
    }
    return [
      {
        id: 'log-1',
        sprint_id: 'sprint-2',
        user: 'Juan Pérez (Dev)',
        role: 'Developer',
        action: 'Actualizó estado de HU00003: Cambió de "POR_HACER" a "EN_CURSO".',
        timestamp: '2026-06-01T09:45:00Z'
      },
      {
        id: 'log-2',
        sprint_id: 'sprint-2',
        user: 'Valentina Rojas (QA)',
        role: 'QA',
        action: 'Generó 2 casos automáticos para HU00003 desde criterios de aceptación.',
        timestamp: '2026-06-02T15:30:00Z'
      }
    ];
  });

  // State Persistence syncs
  useEffect(() => {
    localStorage.setItem('scrum_criteria', JSON.stringify(criteria));
  }, [criteria]);

  useEffect(() => {
    localStorage.setItem('scrum_tech_criteria', JSON.stringify(techCriteria));
  }, [techCriteria]);

  useEffect(() => {
    localStorage.setItem('scrum_bugs', JSON.stringify(bugs));
  }, [bugs]);

  useEffect(() => {
    localStorage.setItem('scrum_evidences', JSON.stringify(evidences));
  }, [evidences]);

  useEffect(() => {
    localStorage.setItem('scrum_audit_logs', JSON.stringify(auditLogs));
  }, [auditLogs]);

  // Helper inside PM for adding dynamic logs
  const registerAudit = (action: string) => {
    const newAudit: AuditLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      sprint_id: selectedSprintId,
      user: `${currentUser.first_name} ${currentUser.last_name}`,
      role: currentUser.role,
      action,
      timestamp: new Date().toISOString()
    };
    setAuditLogs(prev => [newAudit, ...prev]);
  };

  // Form states for Sprints and details
  const [newGoal, setNewGoal] = useState('');
  const [newCap, setNewCap] = useState(35);
  const [newVel, setNewVel] = useState(30);

  // Modal control & interactive story manager
  const [selectedStoryId, setSelectedStoryId] = useState<string>('');
  const [isStoryDetailOpen, setIsStoryDetailOpen] = useState(false);
  const activeStory = workItems.find(w => w.id === selectedStoryId);

  // Transition validation failed list
  const [transitionWarnings, setTransitionWarnings] = useState<string[]>([]);
  const [blockedItemPromptId, setBlockedItemPromptId] = useState<string | null>(null);
  const [blockReasonText, setBlockReasonText] = useState('');

  // Form states inside details modal
  const [newCriterionDesc, setNewCriterionDesc] = useState('');
  const [newCriterionType, setNewCriterionType] = useState<'Funcional' | 'Validación' | 'Cálculo' | 'Integración' | 'Seguridad' | 'Reporte'>('Funcional');
  const [newCriterionExpected, setNewCriterionExpected] = useState('');

  const [newCaseTitle, setNewCaseTitle] = useState('');
  const [newCasePre, setNewCasePre] = useState('');
  const [newCaseSteps, setNewCaseSteps] = useState('');
  const [newCaseExpected, setNewCaseExpected] = useState('');

  const [newBugTitle, setNewBugTitle] = useState('');
  const [newBugDesc, setNewBugDesc] = useState('');
  const [newBugSteps, setNewBugSteps] = useState('');
  const [newBugExpected, setNewBugExpected] = useState('');
  const [newBugActual, setNewBugActual] = useState('');
  const [newBugSev, setNewBugSev] = useState<'Bloqueante' | 'Crítica' | 'Alta' | 'Media' | 'Baja'>('Media');
  const [newBugPri, setNewBugPri] = useState<'Alta' | 'Media' | 'Baja'>('Media');

  const [newEvidenceName, setNewEvidenceName] = useState('');
  const [newEvidenceDesc, setNewEvidenceDesc] = useState('');

  // Sprint Transition Error Banners
  const [sprintCloseErrors, setSprintCloseErrors] = useState<string[]>([]);

  // Calculate detailed parameters for WorkItems & Sprints
  const activeStories = workItems.filter(w => w.project_id === selectedProjectId && w.sprint_id === selectedSprintId);
  
  // Custom Status mapping inside UI to keep compatibility with standard 'POR_HACER' / 'EN_CURSO' tags
  const getExtendedStatus = (item: WorkItem): MainColumnStatus => {
    return (item as any).extendedStatus || (
      item.status === 'BACKLOG' ? 'BACKLOG_SPRINT' :
      item.status === 'POR_HACER' ? 'NO_INICIADO' :
      item.status === 'EN_CURSO' ? 'EN_DESARROLLO' :
      item.status === 'QA' ? 'EN_QA' :
      item.status === 'FINALIZADO' ? 'FINALIZADO' : 'NO_INICIADO'
    );
  };

  const getExtendedQaStatus = (item: WorkItem): QaColumnStatus => {
    return (item as any).extendedQaStatus || (
      item.status === 'QA' ? 'EJECUCION_QA' :
      item.status === 'FINALIZADO' ? 'CERRADO_QA' : 'PENDIENTE_CASOS'
    );
  };

  // Set internal status fields
  const setExtendedStatusForStory = (storyId: string, ext: MainColumnStatus) => {
    // Sync to main WorkItem status as fallback
    let mapped: WorkItemStatus = 'POR_HACER';
    if (ext === 'BACKLOG_SPRINT') mapped = 'BACKLOG';
    if (ext === 'NO_INICIADO' || ext === 'EN_ANALISIS') mapped = 'POR_HACER';
    if (ext === 'EN_DESARROLLO' || ext === 'CODE_REVIEW') mapped = 'EN_CURSO';
    if (ext === 'LISTO_PARA_QA' || ext === 'EN_QA' || ext === 'DEVUELTO_QA') mapped = 'QA';
    if (ext === 'APROBADO_QA' || ext === 'APROBADO_FUNCIONAL' || ext === 'FINALIZADO') mapped = 'FINALIZADO';

    setWorkItems(prev => prev.map(wi => {
      if (wi.id === storyId) {
        return {
          ...wi,
          status: mapped,
          extendedStatus: ext
        } as any;
      }
      return wi;
    }));
  };

  const setExtendedQaStatusForStory = (storyId: string, ext: QaColumnStatus) => {
    setWorkItems(prev => prev.map(wi => {
      if (wi.id === storyId) {
        return {
          ...wi,
          extendedQaStatus: ext
        } as any;
      }
      return wi;
    }));
  };

  // Rule Checklist Validations for Transitions
  const validateTransition = (story: WorkItem, targetCol: MainColumnStatus): { success: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    // Load rules from localStorage with fallback to defaults
    const savedRulesStr = localStorage.getItem('scrum_transition_rules');
    let activeRules = DEFAULT_TRANSITION_RULES;
    if (savedRulesStr && savedRulesStr !== "undefined" && savedRulesStr !== "null") {
      try {
        const parsed = JSON.parse(savedRulesStr);
        if (parsed !== null && parsed !== undefined) {
          activeRules = parsed;
        }
      } catch (e) {
        // Fallback
      }
    }

    const isRuleEnabled = (id: string) => {
      const r = activeRules.find(x => x.id === id);
      return r ? r.enabled : true;
    };

    const getRuleDesc = (id: string, defaultDesc: string) => {
      const r = activeRules.find(x => x.id === id);
      return r ? r.desc : defaultDesc;
    };

    // BACKLOG_SPRINT -> NO_INICIADO
    if (targetCol === 'NO_INICIADO') {
      if (isRuleEnabled('no_iniciados_prioridad') && !story.priority) {
        errors.push(getRuleDesc('no_iniciados_prioridad', 'La historia debe tener prioridad estipulada.'));
      }
      if (isRuleEnabled('no_iniciados_responsable') && !story.assignee_id) {
        errors.push(getRuleDesc('no_iniciados_responsable', 'Debe asignarse un responsable técnico/funcional.'));
      }
    }

    // NO_INICIADO -> EN_ANALISIS
    if (targetCol === 'EN_ANALISIS') {
      if (isRuleEnabled('en_analisis_descripcion') && (!story.description || story.description.length < 10)) {
        errors.push(getRuleDesc('en_analisis_descripcion', 'Debe registrarse una descripción clara o analítica del requerimiento.'));
      }
      if (isRuleEnabled('en_analisis_responsable') && !story.assignee_id) {
        errors.push(getRuleDesc('en_analisis_responsable', 'Responsable técnico/funcional no asignado.'));
      }
    }

    // EN_ANALISIS -> EN_DESARROLLO (Definition of Ready)
    if (targetCol === 'EN_DESARROLLO') {
      if (isRuleEnabled('en_desarrollo_sp') && !story.story_points) {
        errors.push(getRuleDesc('en_desarrollo_sp', 'DOR: No estimulado. Ingrese Story Points (SP) antes de desarrollar.'));
      }
      if (isRuleEnabled('en_desarrollo_unblocked') && (story as any).blocked) {
        errors.push(getRuleDesc('en_desarrollo_unblocked', 'DOR BLOQUEADA: Desbloquee el requerimiento ingresando el motivo.'));
      }
    }

    // EN_DESARROLLO -> CODE_REVIEW
    if (targetCol === 'CODE_REVIEW') {
      const techCritCount = techCriteria.filter(tc => tc.user_story_id === story.id).length;
      if (isRuleEnabled('code_review_criteria') && techCritCount === 0) {
        errors.push(getRuleDesc('code_review_criteria', 'Debe documentar o seleccionar al menos un componente o Criterio Técnico.'));
      }
    }

    // CODE_REVIEW -> LISTO_PARA_QA
    if (targetCol === 'LISTO_PARA_QA') {
      const bgs = bugs.filter(b => b.user_story_id === story.id && b.status !== 'Cerrado' && (b.severity === 'Crítica' || b.severity === 'Bloqueante'));
      if (isRuleEnabled('listo_qa_no_crit_bugs') && bgs.length > 0) {
        errors.push(getRuleDesc('listo_qa_no_crit_bugs', 'Existen bugs críticos o bloqueantes sin resolver en este ítem.'));
      }
    }

    // LISTO_PARA_QA -> EN_QA
    if (targetCol === 'EN_QA') {
      if (isRuleEnabled('en_qa_sprint_active') && (!currentSprint || ((currentSprint.status as any) !== 'EN_QA' && currentSprint.status !== 'EN_CURSO'))) {
        errors.push(getRuleDesc('en_qa_sprint_active', 'El Sprint debe estar activo ("En Ejecución" o "En QA") para auditar pruebas.'));
      }
    }

    // EN_QA -> DEVUELTO_QA / DEVUELTO CON ERRORES
    if (targetCol === 'DEVUELTO_QA') {
      const activeBugs = bugs.filter(b => b.user_story_id === story.id && b.status !== 'Cerrado');
      const testCasesForStory = testCases.filter(tc => tc.work_item_id === story.id);
      const hasFailed = testCasesForStory.some(tc => tc.status === 'FAILED');
      
      if (isRuleEnabled('devuelto_qa_require_bug') && activeBugs.length === 0 && !hasFailed) {
        errors.push(getRuleDesc('devuelto_qa_require_bug', 'Para devolver la historia debe reportarse al menos un Bug abierto o Caso fallido.'));
      }
    }

    // EN_QA -> APROBADO_QA
    if (targetCol === 'APROBADO_QA') {
      const storyTests = testCases.filter(tc => tc.work_item_id === story.id);
      const openCriticalBugs = bugs.filter(b => b.user_story_id === story.id && b.status !== 'Cerrado' && (b.severity === 'Bloqueante' || b.severity === 'Crítica' || b.severity === 'Alta'));
      
      if (isRuleEnabled('aprobado_qa_has_cases') && storyTests.length === 0) {
        errors.push(getRuleDesc('aprobado_qa_has_cases', 'Falta Casos: No se han configurado pruebas para este requerimiento.'));
      } else {
        const allCompleted = storyTests.every(t => t.status === 'PASSED');
        if (isRuleEnabled('aprobado_qa_cases_passed') && !allCompleted) {
          errors.push(getRuleDesc('aprobado_qa_cases_passed', 'Falta Ejecución: Todos los casos de prueba cargados deben marcarse APROBADO (PASSED).'));
        }
      }

      if (isRuleEnabled('aprobado_qa_no_bugs') && openCriticalBugs.length > 0) {
        errors.push(getRuleDesc('aprobado_qa_no_bugs', 'Defectos Abiertos: No se puede aprobar si cuenta con bugs Críticos/Altos activos.'));
      }

      // Check criteria validate
      const storyCriteria = criteria.filter(c => c.user_story_id === story.id);
      const allPassedCriteria = storyCriteria.every(c => c.status === 'No aplica' || c.status === 'Cumple');
      if (isRuleEnabled('aprobado_qa_criteria_ok') && storyCriteria.length > 0 && !allPassedCriteria) {
        errors.push(getRuleDesc('aprobado_qa_criteria_ok', 'Criterios Pendientes: Valide que todos los Criterios de Aceptación obligatorios marquen "Cumple" o "No Aplica".'));
      }
    }

    // APROBADO_QA -> APROBADO_FUNCIONAL
    if (targetCol === 'APROBADO_FUNCIONAL') {
      const storyTests = testCases.filter(tc => tc.work_item_id === story.id);
      const allPassed = storyTests.every(t => t.status === 'PASSED');
      if (isRuleEnabled('aprobado_po_all_passed') && !allPassed) {
        errors.push(getRuleDesc('aprobado_po_all_passed', 'No autorizado por PO: Es imperativo pasar al 100% las pruebas QA antes.'));
      }
    }

    // APROBADO_FUNCIONAL -> FINALIZADO (Definition of Done Compliancy)
    if (targetCol === 'FINALIZADO') {
      const hasEv = evidences.some(ev => ev.entity_id === story.id && ev.entity_type === 'story');
      if (isRuleEnabled('finalizado_evidence') && !hasEv) {
        errors.push(getRuleDesc('finalizado_evidence', 'DOD INCUMPIDLO: Adjunte por lo menos una Captura/PDF de evidencia funcional antes de Cerrar.'));
      }
      
      const openBugs = bugs.filter(b => b.user_story_id === story.id && b.status !== 'Cerrado' && (b.severity === 'Bloqueante' || b.severity === 'Crítica'));
      if (isRuleEnabled('finalizado_no_crit_bugs') && openBugs.length > 0) {
        errors.push(getRuleDesc('finalizado_no_crit_bugs', 'DOD INCUMPLIDO: Sigue existiendo defectos críticos no solventados.'));
      }
    }

    return {
      success: errors.length === 0,
      errors
    };
  };

  // Drag and drop mechanics
  const handleDragStartLocal = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDropLocal = (e: React.DragEvent, targetCol: MainColumnStatus) => {
    e.preventDefault();
    const storyId = e.dataTransfer.getData('text/plain');
    const story = workItems.find(w => w.id === storyId);
    if (!story) return;

    // Check transition rules
    const validation = validateTransition(story, targetCol);
    if (validation.success) {
      setExtendedStatusForStory(story.id, targetCol);
      registerAudit(`Movió Historia de Usuario ${story.key} a la columna "${targetCol}" satisfactoriamente.`);
      setTransitionWarnings([]);
      // Auto triggers
      handleAutoTriggers(story, targetCol);
    } else {
      setTransitionWarnings(validation.errors);
      setSelectedStoryId(story.id);
      // Auto open detail modal so they can fix errors immediately
      setIsStoryDetailOpen(true);
    }
  };

  // QA Drag Drop
  const handleQaDrop = (e: React.DragEvent, targetCol: QaColumnStatus) => {
    e.preventDefault();
    const storyId = e.dataTransfer.getData('text/plain');
    const story = workItems.find(w => w.id === storyId);
    if (!story) return;

    // Sync state
    setExtendedQaStatusForStory(story.id, targetCol);
    registerAudit(`Módulo Suite QA: Transicionó estado QA de ${story.key} a "${targetCol}".`);
    
    // Auto map to main board statuses where logical
    if (targetCol === 'APROBADO_QA') {
      setExtendedStatusForStory(story.id, 'APROBADO_QA');
    } else if (targetCol === 'PRUEBA_FALLIDA' || targetCol === 'DEFECTO_REPORTADO') {
      setExtendedStatusForStory(story.id, 'DEVUELTO_QA');
    } else if (targetCol === 'EJECUCION_QA') {
      setExtendedStatusForStory(story.id, 'EN_QA');
    }
  };

  // Specification 28: Automations handler
  const handleAutoTriggers = (story: WorkItem, nextCol: MainColumnStatus) => {
    // Listo para QA triggers notify
    if (nextCol === 'LISTO_PARA_QA') {
      addLog('Sistema Automatizado (QA)', `Historia ${story.key} lista para validar. Notificado al Líder QA Valentina Rojas.`);
    }

    // QA failed transitions devuelto
    if (nextCol === 'DEVUELTO_QA') {
      addLog('Sistema Automatizado (Scrum)', `Alerta de falla en ${story.key}. Re-abriendo tareas técnicas para el Developer.`);
    }

    // QA Approved notify
    if (nextCol === 'APROBADO_QA') {
      addLog('Sistema Automatizado (Pruebas)', `Alcanzado 100% de criterios válidos para ${story.key}. Enviada propuesta de cierre al Product Owner.`);
    }
  };

  // Change Sprint status including deep validators
  const handleSprintStatusToggle = (nextStatus: 'NO_INICIADO' | 'EN_CURSO' | 'EN_QA' | 'FINALIZADO') => {
    const errors: string[] = [];

    // Validar: No iniciar Sprint sin Historias asignadas
    if (nextStatus === 'EN_CURSO') {
      if (activeStories.length === 0) {
        errors.push('Regla Sprint: No se puede activar un Sprint vacío sin requerimientos asignados.');
      }
    }

    // Validar: En QA automations
    if (nextStatus === 'EN_QA') {
      // Auto trigger: Generate sugeridos cases for all stories in sprint
      let countGen = 0;
      activeStories.forEach(st => {
        const storyCriteria = criteria.filter(c => c.user_story_id === st.id);
        const storyExistingCases = testCases.filter(tc => tc.work_item_id === st.id);
        
        if (storyCriteria.length > 0 && storyExistingCases.length === 0) {
          // System generates a case suggestion for every criterion
          storyCriteria.forEach((crit, index) => {
            const newSug: TestCase = {
              id: `case-gen-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 9)}`,
              suite_id: 'suite-2',
              work_item_id: st.id,
              title: `Caso Sugerido QA-${crit.number}: Validar que ${crit.description}`,
              steps: [
                'Ingresar con las credenciales del rol estipulado.',
                'Ejecutar pasos correspondientes al Criterio de Aceptación.',
                `Asegurar que el sistema arroja: ${crit.expected_result}`
              ],
              expected: crit.expected_result,
              status: 'PENDING'
            };
            setTestCases(prev => [...prev, newSug]);
            countGen++;
          });
        }
      });
      registerAudit(`Sprint pasó a "En QA". Automatización: Se generaron ${countGen} casos de prueba a partir de criterios.`);
      addLog('Sistema Scrum/QA', `Se habilitó el Tablero Especial de Pruebas QA dadas las reglas para ${currentSprint?.name || 'Sprint'}.`);
    }

    // Validar: Cerrar Sprint rules (Specification 18)
    if (nextStatus === 'FINALIZADO') {
      const activeUnfinished = activeStories.filter(st => {
        const ext = getExtendedStatus(st);
        return ext !== 'FINALIZADO';
      });

      if (activeUnfinished.length > 0) {
        errors.push(`Existen ${activeUnfinished.length} historias activas sin pasar a estado FINALIZADO.`);
      }

      const activeBugs = bugs.filter(b => b.sprint_id === selectedSprintId && b.status !== 'Cerrado' && (b.severity === 'Bloqueante' || b.severity === 'Crítica' || b.severity === 'Alta'));
      if (activeBugs.length > 0) {
        errors.push(`Existen ${activeBugs.length} defectos (bugs) con severidad Alta/Crítica abiertos.`);
      }

      const storyIdsInSprint = activeStories.map(s => s.id);
      const pendingTestCount = testCases.filter(tc => storyIdsInSprint.includes(tc.work_item_id || '') && tc.status === 'PENDING').length;
      if (pendingTestCount > 0) {
        errors.push(`Existen ${pendingTestCount} casos de prueba obligatorios pendientes de ejecutar en QA.`);
      }

      // Check functional PO approve
      const nonApprovedByPO = activeStories.filter(st => getExtendedStatus(st) !== 'FINALIZADO' && getExtendedStatus(st) !== 'APROBADO_FUNCIONAL');
      if (nonApprovedByPO.length > 0 && activeUnfinished.length > 0) {
        errors.push(`DOD error: El Product Owner no ha aprobado formalmente el sprint.`);
      }
    }

    if (errors.length > 0) {
      setSprintCloseErrors(errors);
      return;
    }

    setSprintCloseErrors([]);
    setSprints(prev => prev.map(s => {
      if (s.id === selectedSprintId) {
        return { ...s, status: nextStatus };
      }
      return s;
    }));
    registerAudit(`Cambió estado del Sprint a "${nextStatus}".`);
    addLog(`${currentUser.first_name} ${currentUser.last_name}`, `Cambió estado de ${currentSprint?.name} a ${nextStatus}`);
  };

  // Story action handlers
  const handleToggleBlock = (storyId: string) => {
    const story = workItems.find(w => w.id === storyId);
    if (!story) return;

    const isBlockedNow = !(story as any).blocked;

    if (isBlockedNow) {
      // Prompt for reason
      setBlockedItemPromptId(storyId);
      setBlockReasonText('');
    } else {
      setWorkItems(prev => prev.map(wi => {
        if (wi.id === storyId) {
          return { ...wi, blocked: false, blocked_reason: '' } as any;
        }
        return wi;
      }));
      registerAudit(`Desbloqueó la historia de usuario ${story.key}`);
    }
  };

  const submitBlockStory = () => {
    if (!blockedItemPromptId) return;
    setWorkItems(prev => prev.map(wi => {
      if (wi.id === blockedItemPromptId) {
        return {
          ...wi,
          blocked: true,
          blocked_reason: blockReasonText || 'Bloqueo técnico por servicios dependientes'
        } as any;
      }
      return wi;
    }));

    const story = workItems.find(w => w.id === blockedItemPromptId);
    if (story) {
      registerAudit(`Marcó Historia ${story.key} como BLOQUEADA. Motivo: ${blockReasonText}`);
      addLog('Sistema Scrum (Bloqueo)', `Alerta Crítica: ${story.key} bloqueada por ${currentUser.first_name}. Notificación enviada.`);
    }

    setBlockedItemPromptId(null);
    setBlockReasonText('');
  };

  // Add individual acceptance criterion
  const handleAddCriterion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCriterionDesc || !selectedStoryId) return;

    const newCrit: AcceptanceCriterion = {
      id: `crit-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      user_story_id: selectedStoryId,
      number: criteria.filter(c => c.user_story_id === selectedStoryId).length + 1,
      description: newCriterionDesc,
      type: newCriterionType,
      expected_result: newCriterionExpected || 'El sistema procede con regularidad sin errores.',
      status: 'Pendiente'
    };

    setCriteria(prev => [...prev, newCrit]);
    registerAudit(`Añadió Criterio de Aceptación #${newCrit.number} a la historia ${activeStory?.key}`);
    setNewCriterionDesc('');
    setNewCriterionExpected('');
  };

  const handleUpdateCriterionStatus = (critId: string, nextStatus: 'Pendiente' | 'Cumple' | 'No cumple' | 'No aplica') => {
    setCriteria(prev => prev.map(c => {
      if (c.id === critId) {
        return {
          ...c,
          status: nextStatus,
          validated_by: currentUser.id,
          validated_at: new Date().toISOString()
        };
      }
      return c;
    }));
    registerAudit(`Actualizó estatus de Criterio de Aceptación (${critId}) a: "${nextStatus}".`);
  };

  // Add Manual Test Case in Suite de Pruebas tab
  const handleAddTestCase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCaseTitle || !selectedStoryId) return;

    const newId = `case-manual-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const newCase: TestCase = {
      id: newId,
      suite_id: 'suite-2',
      work_item_id: selectedStoryId,
      title: newCaseTitle,
      steps: newCaseSteps ? newCaseSteps.split('\n') : ['1. Entrar al módulo con permisos.', '2. Probar la captura visual.'],
      expected: newCaseExpected || 'Se ejecuta el proceso sin advertencias.',
      status: 'PENDING'
    };

    setTestCases(prev => [...prev, newCase]);
    registerAudit(`Creó caso de prueba manual "${newCaseTitle}" para ${activeStory?.key}`);
    setNewCaseTitle('');
    setNewCasePre('');
    setNewCaseSteps('');
    setNewCaseExpected('');
  };

  // Toggle Test Case actual validation status
  const handleRunTestCase = (caseId: string, status: 'PASSED' | 'FAILED') => {
    setTestCases(prev => prev.map(tc => {
      if (tc.id === caseId) {
        // Log in executing results
        const run: TestRun = {
          id: `run-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          test_case_id: caseId,
          executed_by_id: currentUser.id,
          status: status,
          evidence: `Ejecución manual satisfactoria por ${currentUser.first_name} en rol ${currentUser.role}.`,
          notes: 'Ninguna distorsión observada.',
          executed_at: new Date().toISOString()
        };
        setTestRuns(r => [run, ...r]);
        return { ...tc, status: status };
      }
      return tc;
    }));

    registerAudit(`Corrió caso QA (${caseId}) marcando resultado como: ${status}`);

    // Specification 28: Fallar caso QA auto transitions story on main board to "DEVUELTO_QA"
    if (status === 'FAILED' && activeStory) {
      setExtendedStatusForStory(activeStory.id, 'DEVUELTO_QA');
      setExtendedQaStatusForStory(activeStory.id, 'PRUEBA_FALLIDA');
      addLog('Automatización QA', `Prueba Fallida en ${activeStory.key}. Requerimiento devuelto a desarrollo de forma automática.`);
    }
  };

  // Suggesting tests automatically from acceptance criteria
  const handleAutoSuggestTestCases = () => {
    if (!activeStory) return;
    const storyCriteria = criteria.filter(c => c.user_story_id === activeStory.id);
    if (storyCriteria.length === 0) return;

    let count = 0;
    storyCriteria.forEach((crit, idx) => {
      // Avoid duplication
      const exists = testCases.some(tc => tc.work_item_id === activeStory.id && tc.title.includes(`QA-${crit.number}`));
      if (!exists) {
        const newSug: TestCase = {
          id: `case-sug-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 9)}`,
          suite_id: 'suite-2',
          work_item_id: activeStory.id,
          title: `Validación Criterio QA-${crit.number}: ${crit.description}`,
          steps: [
            `Ingresar con el rol adecuado para: ${crit.type}`,
            `Cargar variables de datos de prueba.`,
            `Esperar resultado de la especificación: ${crit.expected_result}`
          ],
          expected: crit.expected_result,
          status: 'PENDING'
        };
        setTestCases(prev => [...prev, newSug]);
        count++;
      }
    });

    registerAudit(`Generación sugerida automatizada: Se integraron ${count} casos de prueba basados en Criterios.`);
  };

  // Add Bug defect
  const handleAddBug = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBugTitle || !selectedStoryId) return;

    const newBug: ScrumBug = {
      id: `scrum-bug-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      user_story_id: selectedStoryId,
      sprint_id: selectedSprintId,
      code: `BUG-${bugs.length + 102}`,
      title: newBugTitle,
      description: newBugDesc,
      steps_to_reproduce: newBugSteps || 'Pasos estándar del caso fallido.',
      expected_result: newBugExpected,
      actual_result: newBugActual,
      severity: newBugSev,
      priority: newBugPri,
      status: 'Abierto',
      reported_by: `${currentUser.first_name} ${currentUser.last_name}`,
      reported_at: new Date().toISOString()
    };

    setBugs(prev => [...prev, newBug]);
    registerAudit(`Reportó defecto defectuoso: ${newBug.code} - ${newBugTitle}`);

    // If critical/blocking, auto-flag story blockage (Specification 28)
    if (newBugSev === 'Bloqueante' || newBugSev === 'Crítica') {
      setWorkItems(prev => prev.map(wi => {
        if (wi.id === selectedStoryId) {
          return {
            ...wi,
            blocked: true,
            blocked_reason: `Bloqueado automáticamente por defecto crítico abierto: ${newBug.code}`
          } as any;
        }
        return wi;
      }));
      addLog('Sistema Automatizado QA', `Alerta Crítica: El bug ${newBug.code} bloqueó automáticamente la historia de usuario.`);
    }

    setNewBugTitle('');
    setNewBugDesc('');
    setNewBugSteps('');
    setNewBugExpected('');
    setNewBugActual('');
  };

  // Resolve / Close Bug
  const handleUpdateBugStatus = (bugId: string, nextStatus: ScrumBug['status']) => {
    setBugs(prev => prev.map(b => {
      if (b.id === bugId) {
        return { ...b, status: nextStatus };
      }
      return b;
    }));
    registerAudit(`Actualizó estado del BUG ${bugId} a: "${nextStatus}"`);

    // If resolved/closed, let's see if we can safely unblock corresponding history
    const b = bugs.find(x => x.id === bugId);
    if (b && (nextStatus === 'Cerrado' || nextStatus === 'Corregido')) {
      // If there are no more critical bugs open, unblock story
      const otherCritical = bugs.filter(x => x.user_story_id === b.user_story_id && x.id !== bugId && x.status !== 'Cerrado' && (x.severity === 'Bloqueante' || x.severity === 'Crítica'));
      if (otherCritical.length === 0) {
        setWorkItems(prev => prev.map(wi => {
          if (wi.id === b.user_story_id) {
            return {
              ...wi,
              blocked: false,
              blocked_reason: ''
            } as any;
          }
          return wi;
        }));
        registerAudit(`Unidad de control: Desbloqueada historia ${b.user_story_id} por resolución de defecto.`);
      }
    }
  };

  // Add final evaluation evidence metadata
  const handleAddEvidence = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvidenceName || !selectedStoryId) return;

    const newEv: ScrumEvidence = {
      id: `ev-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      entity_type: 'story',
      entity_id: selectedStoryId,
      file_name: newEvidenceName,
      file_type: 'image/png',
      description: newEvidenceDesc,
      uploaded_by: `${currentUser.first_name} (${currentUser.role})`,
      uploaded_at: new Date().toISOString(),
      url: '#'
    };

    setEvidences(prev => [...prev, newEv]);
    registerAudit(`Adjuntó evidencia "${newEvidenceName}" a la historia.`);
    setNewEvidenceName('');
    setNewEvidenceDesc('');
  };

  // Move stories between Sprints logic
  const handleMoveStoryToSprint = (storyId: string, targetSprintId: string, reason: string) => {
    if (!reason) {
      alert('Debe estipular y registrar un motivo para mover la historia de Sprint.');
      return;
    }
    setWorkItems(prev => prev.map(wi => {
      if (wi.id === storyId) {
        return {
          ...wi,
          sprint_id: targetSprintId,
          historical_origin_sprint: selectedSprintId,
          move_reason: reason
        } as any;
      }
      return wi;
    }));

    const story = workItems.find(x => x.id === storyId);
    const targetSp = sprints.find(x => x.id === targetSprintId);
    registerAudit(`Movió Historia ${story?.key} al ${targetSp?.name || 'Incierto'}. Motivo: ${reason}`);
    addLog('Scrum Master Master', `Re-planificación: ${story?.key} movido al ${targetSp?.name}. Motivo: ${reason}`);
    setIsStoryDetailOpen(false);
  };

  // UI calculations metrics
  const activeSprintStories = activeStories;
  const completedStoriesCount = activeStories.filter(wi => getExtendedStatus(wi) === 'FINALIZADO').length;
  const totalSpCount = activeStories.reduce((sum, st) => sum + (st.story_points || 0), 0);
  const completedSpCount = activeStories.filter(wi => getExtendedStatus(wi) === 'FINALIZADO').reduce((sum, st) => sum + (st.story_points || 0), 0);
  const blockedStoriesCount = activeStories.filter(wi => (wi as any).blocked).length;
  const activeBugsCount = bugs.filter(b => b.sprint_id === selectedSprintId && b.status !== 'Cerrado').length;
  const criticalBugsCount = bugs.filter(b => b.sprint_id === selectedSprintId && b.status !== 'Cerrado' && (b.severity === 'Bloqueante' || b.severity === 'Crítica')).length;

  const totalTestsCount = testCases.filter(tc => activeStories.map(s => s.id).includes(tc.work_item_id || '')).length;
  const passedTestsCount = testCases.filter(tc => activeStories.map(s => s.id).includes(tc.work_item_id || '') && tc.status === 'PASSED').length;
  const failedTestsCount = testCases.filter(tc => activeStories.map(s => s.id).includes(tc.work_item_id || '') && tc.status === 'FAILED').length;

  const sprintProgressPercent = activeStories.length > 0 
    ? Math.round((completedStoriesCount / activeStories.length) * 100)
    : 0;

  const qaProgressPercent = totalTestsCount > 0
    ? Math.round((passedTestsCount / totalTestsCount) * 100)
    : 0;

  return (
    <div className="space-y-6" id="wbs-product-backlog-manager">
      
      {/* top controls, Sprint metrics & selector (Collapsible - starts collapsed by default) */}
      <div className="bg-slate-900 text-white rounded-2xl border border-slate-800 shadow-xl relative overflow-hidden transition-all duration-300">
        {/* Background mesh ornament styling */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        
        {/* Siempre visible: Cabecera interactiva y selectores */}
        <div className="p-5 relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800/60">
          <div className="flex flex-col md:flex-row md:items-center gap-3.5 flex-1 min-w-0">
            <div className="flex items-center gap-2 shrink-0">
              <span className="bg-teal-500/20 text-teal-300 font-mono text-[9px] font-bold uppercase py-0.5 px-2 rounded-full border border-teal-500/30 tracking-wider">
                SCRUM &amp; SUITE DE PRUEBAS (DUAL)
              </span>
              {(currentSprint?.status as any) === 'EN_QA' && (
                <span className="bg-amber-500/20 text-amber-300 font-mono text-[9px] font-bold uppercase py-0.5 px-2 rounded-full border border-amber-500/30 flex items-center gap-1.5 animate-pulse shrink-0">
                  <span className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
                  Tablero QA Activo
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2.5 min-w-0">
              <h2 className="text-sm md:text-base font-black tracking-tight shrink-0 text-slate-100">
                {currentSprint ? formatSprintName(currentSprint.name) : 'Sin Sprint Activo'}
              </h2>

              {/* Selector de Proyecto Activo */}
              <div className="flex items-center gap-1.5 bg-slate-850 border border-slate-800 hover:border-slate-700 px-2.5 py-1 rounded-xl cursor-pointer">
                <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest font-mono">PROYECTO:</span>
                <select
                  value={selectedProjectId}
                  onChange={e => setSelectedProjectId(e.target.value)}
                  className="bg-transparent text-[11px] font-bold text-white rounded cursor-pointer focus:outline-none max-w-[150px]"
                >
                  {projects.map(p => (
                    <option key={p.id} value={p.id} className="bg-slate-900 text-white">{p.name}</option>
                  ))}
                </select>
              </div>

              {/* Selector de Sprint */}
              <div className="flex items-center gap-1.5 bg-slate-855 border border-slate-800 hover:border-slate-700 px-2.5 py-1 rounded-xl cursor-pointer">
                <span className="text-[9px] font-extrabold text-teal-400 uppercase tracking-widest font-mono">SPRINT:</span>
                <select
                  value={selectedSprintId}
                  onChange={e => setSelectedSprintId(e.target.value)}
                  className="bg-transparent text-[11px] font-bold text-teal-400 rounded cursor-pointer focus:outline-none"
                >
                  {SprintsForProject.map(sp => (
                    <option key={sp.id} value={sp.id} className="bg-slate-900 text-teal-450">{formatSprintName(sp.name)}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 self-end lg:self-auto">
            {/* Quick compact metric pill when collapsed */}
            {!isTopControlsExpanded && (
              <div className="hidden sm:flex items-center gap-2 bg-slate-850/80 border border-slate-800/80 rounded-xl px-2.5 py-1 text-[10px] font-mono font-medium">
                <span className="text-teal-400">Avance Scrum: <strong className="font-bold">{sprintProgressPercent}%</strong></span>
                <span className="text-slate-700">|</span>
                <span className="text-purple-400">QA: <strong className="font-bold">{qaProgressPercent}%</strong></span>
              </div>
            )}

            <button
              onClick={() => setIsTopControlsExpanded(!isTopControlsExpanded)}
              className="bg-slate-805 hover:bg-slate-700 border border-slate-755 text-slate-200 hover:text-white font-bold text-[11px] px-3.5 py-1.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer select-none"
            >
              <span>{isTopControlsExpanded ? 'Ocultar Indicadores' : 'Ver Indicadores y Métricas'}</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${isTopControlsExpanded ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {/* CONTENIDO DESPLEGABLE */}
        {isTopControlsExpanded && (
          <div className="p-6 space-y-6 relative z-10 animate-fadeIn">
            <div className="flex flex-col xl:flex-row justify-between gap-6 relative z-10">
              <div>
                <p className="text-xs text-slate-400 mt-2 max-w-2xl italic">
                  <strong>Objetivo:</strong> {currentSprint?.goal || 'No se tiene un objetivo explícito parametrizado para este sprint de desarrollo.'}
                </p>

                <div className="flex flex-wrap gap-4 mt-4 text-[11px] text-slate-350">
                  <span className="bg-slate-800 py-1 px-2.5 rounded-lg border border-slate-700/60">📅 <strong>Fechas:</strong> {currentSprint?.start_date || 'N/A'} al {currentSprint?.end_date || 'N/A'}</span>
                </div>
              </div>

              {/* Action controller for Sprint Status (Specification 2, 18) */}
              <div className="flex flex-col justify-center sm:items-end gap-3 shrink-0">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Controles de Transición del Sprint</span>
                
                <div className="flex flex-wrap gap-2">
                  {currentSprint?.status === 'NO_INICIADO' && (
                    <button
                      onClick={() => handleSprintStatusToggle('EN_CURSO')}
                      className="bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition cursor-pointer flex items-center gap-1.5"
                    >
                      🚀 Iniciar Sprint a "En Ejecución"
                    </button>
                  )}

                  {currentSprint?.status === 'EN_CURSO' && (
                    <button
                      onClick={() => handleSprintStatusToggle('EN_QA')}
                      className="bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-md shadow-amber-950/40"
                    >
                      🧪 Activar Fase "En QA" (Configuración QA)
                    </button>
                  )}

                  {(currentSprint?.status as any) === 'EN_QA' && (
                    <button
                      onClick={() => handleSprintStatusToggle('FINALIZADO')}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-md shadow-emerald-950/40"
                    >
                      🏁 Finalizar &amp; Cerrar Sprint (Check DoD)
                    </button>
                  )}

                  {currentSprint?.status === 'FINALIZADO' && (
                    <span className="bg-slate-800 text-slate-400 font-mono text-xs font-bold py-2 px-4 rounded-xl border border-slate-700/60 block text-center">
                      🔒 SPRINT COMPLETADO &amp; CERRADO
                    </span>
                  )}
                </div>

                {/* Error logs banner if DoD fails */}
                {sprintCloseErrors.length > 0 && (
                  <div className="bg-red-500/15 border border-red-500/45 rounded-xl p-3 max-w-md text-[11px] text-red-200">
                    <span className="font-bold block text-red-400 mb-1">⚠️ Error al finalizar (Falta DoD):</span>
                    <ul className="list-disc pl-4 space-y-0.5">
                      {sprintCloseErrors.map((err, i) => <li key={i}>{err}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Dashboard KPIs strip (Specification 19) */}
            <div className="mt-6 pt-6 border-t border-slate-850/60 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              <div className="bg-slate-850 p-3 rounded-xl border border-slate-800/50">
                <span className="text-[10px] text-slate-400 font-bold block">AVANCE SCRUM</span>
                <span className="text-xl font-extrabold text-teal-400 font-mono">{sprintProgressPercent}%</span>
                <div className="w-full bg-slate-800 h-1 rounded-full mt-1.5 overflow-hidden">
                  <div className="bg-teal-400 h-1 rounded-full" style={{ width: `${sprintProgressPercent}%` }} />
                </div>
              </div>

              <div className="bg-slate-850 p-3 rounded-xl border border-slate-800/50">
                <span className="text-[10px] text-slate-400 font-bold block">STORY POINTS</span>
                <span className="text-xl font-extrabold text-slate-200 font-mono">{completedSpCount} <span className="text-xs text-slate-450">/ {totalSpCount}</span></span>
                <span className="text-[9px] text-slate-500 block mt-1">SP de historias</span>
              </div>

              <div className="bg-slate-850 p-3 rounded-xl border border-slate-800/50">
                <span className="text-[10px] text-slate-400 font-bold block">HISTORIAS (HU)</span>
                <span className="text-xl font-extrabold text-slate-200 font-mono">{completedStoriesCount} <span className="text-xs text-slate-450">/ {activeStories.length}</span></span>
                <span className="text-[9px] text-slate-500 block mt-0.5">Completadas</span>
              </div>

              <div className="bg-slate-855 p-3 rounded-xl border border-slate-800/50">
                <span className="text-[10px] text-slate-400 font-bold block">HISTORIAS BLOQUEADAS</span>
                <span className={`text-xl font-extrabold font-mono ${blockedStoriesCount > 0 ? 'text-red-400' : 'text-slate-300'}`}>{blockedStoriesCount}</span>
                <span className="text-[9px] text-slate-500 block mt-0.5">En espera</span>
              </div>

              <div className="bg-slate-850 p-3 rounded-xl border border-slate-800/50">
                <span className="text-[10px] text-slate-400 font-bold block">AVANCE QA</span>
                <span className="text-xl font-extrabold text-slate-200 font-mono text-purple-400">{qaProgressPercent}%</span>
                <div className="w-full bg-slate-800 h-1 rounded-full mt-1.5 overflow-hidden">
                  <div className="bg-purple-400 h-1 rounded-full" style={{ width: `${qaProgressPercent}%` }} />
                </div>
              </div>

              <div className="bg-slate-850 p-3 rounded-xl border border-slate-800/50">
                <span className="text-[10px] text-slate-400 font-bold block">CASOS EJECUTADOS</span>
                <span className="text-xl font-extrabold text-slate-200 font-mono">{passedTestsCount + failedTestsCount} <span className="text-xs text-slate-450">/ {totalTestsCount}</span></span>
                <span className="text-[9px] text-slate-500 block mt-0.5">Pruebas QA</span>
              </div>

              <div className="bg-slate-855 p-3 rounded-xl border border-slate-800/50">
                <span className="text-[10px] text-slate-400 font-bold block">DEFECTOS ACTIVOS</span>
                <span className={`text-xl font-extrabold font-mono ${activeBugsCount > 0 ? 'text-red-400' : 'text-slate-300'}`}>{activeBugsCount} <span className="text-xs text-slate-500">({criticalBugsCount} crít.)</span></span>
                <span className="text-[9px] text-slate-500 block mt-0.5">Defectos</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sub menu tabs - dedicated strictly to development scrum sprint board */}
      <div className="bg-slate-100 p-1.5 rounded-xl border border-slate-200 flex flex-wrap gap-1.5">
        <button
          onClick={() => setScrumSubTab('main_board')}
          className="px-4 py-2 font-bold text-xs rounded-lg bg-slate-900 text-white shadow-sm flex items-center gap-2"
        >
          📋 Tablero de Desarrollo Scrum
        </button>
      </div>

      {/* RENDER DYNAMIC TAB CONTENT */}

      {/* SUB-TAB 1: DEVELOPMENT KANBAN BOARD (11 COLUMNS) */}
      {scrumSubTab === 'main_board' && (
        <div className="space-y-4">
          <div className="bg-sky-50 border border-sky-100 rounded-xl p-3 flex justify-between items-center text-xs">
            <span className="text-sky-850 font-medium">💡 <strong>Módulo Scrum:</strong> Arrastre tarjetas para transicionarlas de estado cumpliendo la definición de Listo (Ready) y Hecho (Done).</span>
            <span className="font-mono text-[10px] text-sky-800 font-bold bg-white border px-2 py-0.5 rounded shadow-2xs">PROCESO KANBAN ÁGIL</span>
          </div>

          <div className="overflow-x-auto select-none">
            <div className="flex gap-4 pb-4 min-w-[2800px]">
              {(['BACKLOG_SPRINT', 'NO_INICIADO', 'EN_ANALISIS', 'EN_DESARROLLO', 'CODE_REVIEW', 'LISTO_PARA_QA', 'EN_QA', 'DEVUELTO_QA', 'APROBADO_QA', 'APROBADO_FUNCIONAL', 'FINALIZADO'] as MainColumnStatus[]).map(statusKey => {
                const colStories = activeStories.filter(wi => getExtendedStatus(wi) === statusKey);
                
                return (
                  <div
                    key={statusKey}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleDropLocal(e, statusKey)}
                    className="w-64 shrink-0 bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col justify-between"
                  >
                    <div>
                      {/* Column Header */}
                      <div className="flex justify-between items-center border-b border-slate-250 pb-2 mb-3">
                        <span className="text-[11px] font-black tracking-tight text-slate-700 uppercase flex items-center gap-1">
                          {statusKey === 'BACKLOG_SPRINT' ? '📦 Backlog Sprint' :
                           statusKey === 'NO_INICIADO' ? '⚪ No Iniciado' :
                           statusKey === 'EN_ANALISIS' ? '🔍 En Análisis' :
                           statusKey === 'EN_DESARROLLO' ? '💻 En Desarrollo' :
                           statusKey === 'CODE_REVIEW' ? '👀 Code Review' :
                           statusKey === 'LISTO_PARA_QA' ? '🧪 Listo QA' :
                           statusKey === 'EN_QA' ? '🛠️ En QA' :
                           statusKey === 'DEVUELTO_QA' ? '❌ Devuelto QA' :
                           statusKey === 'APROBADO_QA' ? '✅ Aprobado QA' :
                           statusKey === 'APROBADO_FUNCIONAL' ? '👑 Aprobado PO' : '🎉 Finalizado'}
                        </span>
                        <span className="font-mono bg-slate-200 text-slate-700 font-bold rounded px-1.5 py-0.5 text-[9.5px]">
                          {colStories.length}
                        </span>
                      </div>

                      {/* Card lists */}
                      <div className="space-y-2.5 max-h-[480px] overflow-y-auto">
                        {colStories.map(wi => {
                          const isBlocked = (wi as any).blocked;
                          const bugsCount = bugs.filter(b => b.user_story_id === wi.id && b.status !== 'Cerrado').length;
                          const critBugs = bugs.filter(b => b.user_story_id === wi.id && b.status !== 'Cerrado' && (b.severity === 'Bloqueante' || b.severity === 'Crítica')).length;
                          const tests = testCases.filter(tc => tc.work_item_id === wi.id);
                          const passedTests = tests.filter(tc => tc.status === 'PASSED').length;

                          return (
                            <div
                              key={wi.id}
                              draggable
                              onDragStart={(e) => handleDragStartLocal(e, wi.id)}
                              onClick={() => {
                                setSelectedStoryId(wi.id);
                                setIsStoryDetailOpen(true);
                              }}
                              className={`bg-white border rounded-lg p-3 hover:shadow-md cursor-grab active:cursor-grabbing transition-all relative border-slate-200 ${
                                isBlocked ? 'ring-2 ring-red-400 bg-red-50/10' : ''
                              }`}
                            >
                              <div className="flex justify-between items-center mb-1">
                                <span className="font-mono font-black text-[9.5px] text-teal-800 bg-teal-50 px-1 rounded border border-teal-100">
                                  {wi.key}
                                </span>
                                <span className={`text-[9px] uppercase font-bold text-slate-400`}>
                                  {wi.type}
                                </span>
                              </div>

                              <h5 className="font-bold text-slate-900 text-xs truncate" title={wi.title}>
                                {wi.title}
                              </h5>

                              <p className="text-[10px] text-slate-500 line-clamp-2 mt-1.5">
                                {wi.description || 'Sin descripción funcional.'}
                              </p>

                              {/* Story indicators strip (Spec 4) */}
                              <div className="grid grid-cols-2 gap-2 mt-3 pt-2.5 border-t border-slate-100 text-[9px] text-slate-500">
                                <div className="flex items-center gap-1 font-semibold">
                                  <span>SP: <strong>{wi.story_points || 'Unest.'}</strong></span>
                                </div>
                                <div className="flex items-center gap-1 font-semibold">
                                  <span>QA Casos: <strong className="text-purple-600">{passedTests}/{tests.length}</strong></span>
                                </div>
                                <div className="flex items-center gap-1 font-semibold col-span-2">
                                  <span>Defectos: <strong className={bugsCount > 0 ? 'text-red-650' : 'text-slate-505'}>{bugsCount} ({critBugs} C.)</strong></span>
                                </div>
                              </div>

                              {isBlocked && (
                                <div className="absolute top-2 right-2 flex items-center justify-center p-0.5 bg-red-105 border border-red-200 text-red-600 rounded-full animate-bounce">
                                  <AlertTriangle className="w-3.5 h-3.5" />
                                </div>
                              )}

                              {/* Action controller footer fallback inside story card */}
                              <div className="mt-3 pt-2.5 border-t border-slate-100 flex justify-between">
                                <span className="text-[8.5px] font-bold text-slate-400">Arrástrame ✥</span>
                                <span className="text-[8.5px] font-bold text-teal-700">Ver Detalles ➔</span>
                              </div>
                            </div>
                          );
                        })}
                        {colStories.length === 0 && (
                          <div className="text-center p-8 bg-slate-100/50 rounded-lg border border-dashed border-slate-200 text-[10.5px] text-slate-400 italic">
                            Sin historias
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: QA SPECIAL KANBAN BOARD FOR SPRINT (11 COLUMNS) */}
      {scrumSubTab === 'qa_board' && (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-3.5 flex justify-between items-center text-xs text-amber-900">
            <span>🧪 <strong>Tablero Especial Kanban QA:</strong> Gestione casos de prueba, reporte defectos en proyecciones, re-pruebas técnicas y cierres normativos.</span>
            <span className="font-mono text-[10px] bg-white border border-amber-200 px-2 py-0.5 rounded font-black text-amber-800">QA SUITE</span>
          </div>

          <div className="overflow-x-auto select-none">
            <div className="flex gap-4 pb-4 min-w-[2800px]">
              {(['PENDIENTE_CASOS', 'CASOS_DEFINIDOS', 'EJECUCION_QA', 'PRUEBA_FALLIDA', 'DEFECTO_REPORTADO', 'CORRECCION_DEV', 'CORREGIDO_DEV', 'RE_TEST', 'APROBADO_QA', 'APROBADO_FUNCIONAL', 'CERRADO_QA'] as QaColumnStatus[]).map(statusKey => {
                const colStories = activeStories.filter(wi => getExtendedQaStatus(wi) === statusKey);

                return (
                  <div
                    key={statusKey}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleQaDrop(e, statusKey)}
                    className="w-64 shrink-0 bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col justify-between"
                  >
                    <div>
                      {/* Column Header */}
                      <div className="flex justify-between items-center border-b border-teal-150 pb-2 mb-3">
                        <span className="text-[11px] font-black tracking-tight text-teal-900 uppercase flex items-center gap-1">
                          {statusKey === 'PENDIENTE_CASOS' ? '🚫 Pendiente Casos' :
                           statusKey === 'CASOS_DEFINIDOS' ? '📝 Casos Definidos' :
                           statusKey === 'EJECUCION_QA' ? '⚙️ Ejecución QA' :
                           statusKey === 'PRUEBA_FALLIDA' ? '🚨 Prueba Fallida' :
                           statusKey === 'DEFECTO_REPORTADO' ? '🐛 Defecto Abierto' :
                           statusKey === 'CORRECCION_DEV' ? '🔧 En Corrección' :
                           statusKey === 'CORREGIDO_DEV' ? '✔️ Corregido Dev' :
                           statusKey === 'RE_TEST' ? '🔄 Re-test QA' :
                           statusKey === 'APROBADO_QA' ? '🧪 Aprobado QA' :
                           statusKey === 'APROBADO_FUNCIONAL' ? '👑 Aprobado PO' : '🎉 Cerrado QA'}
                        </span>
                        <span className="font-mono bg-teal-100 text-teal-800 font-bold rounded px-1.5 py-0.5 text-[9.5px]">
                          {colStories.length}
                        </span>
                      </div>

                      {/* Card lists */}
                      <div className="space-y-2.5 max-h-[480px] overflow-y-auto">
                        {colStories.map(wi => {
                          const storyTests = testCases.filter(tc => tc.work_item_id === wi.id);
                          const activeBugsCount = bugs.filter(b => b.user_story_id === wi.id && b.status !== 'Cerrado').length;
                          const criteriaCount = criteria.filter(c => c.user_story_id === wi.id).length;

                          return (
                            <div
                              key={wi.id}
                              draggable
                              onDragStart={(e) => handleDragStartLocal(e, wi.id)}
                              onClick={() => {
                                setSelectedStoryId(wi.id);
                                setIsStoryDetailOpen(true);
                              }}
                              className="bg-white border rounded-lg p-3 hover:shadow-sm cursor-grab active:cursor-grabbing border-slate-200 relative"
                            >
                              <div className="flex justify-between items-center mb-1">
                                <span className="font-mono font-black text-[9.5px] text-teal-800 bg-teal-50 px-1.5 rounded">
                                  {wi.key}
                                </span>
                                <span className="text-[9px] text-purple-650 bg-purple-50 px-1 rounded uppercase font-bold">QA CONTROL</span>
                              </div>

                              <h5 className="font-bold text-slate-900 text-xs truncate">{wi.title}</h5>

                              <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-1.5 text-[10px] text-slate-500">
                                <div className="flex justify-between">
                                  <span>Criterios Aceptación:</span>
                                  <strong className="text-slate-700">{criteriaCount}</strong>
                                </div>
                                <div className="flex justify-between">
                                  <span>Casos de Prueba:</span>
                                  <strong className="text-purple-700">{storyTests.length}</strong>
                                </div>
                                <div className="flex justify-between">
                                  <span>Defectos bug:</span>
                                  <strong className={activeBugsCount > 0 ? 'text-red-650' : 'text-slate-600'}>{activeBugsCount}</strong>
                                </div>
                              </div>

                              <div className="mt-3 pt-2 border-t border-slate-100 flex justify-between select-none">
                                <span className="text-[8.5px] uppercase font-bold text-slate-350">QA Board</span>
                                <span className="text-[8.5px] font-bold text-teal-600">Ejecutar Pruebas ➔</span>
                              </div>
                            </div>
                          );
                        })}
                        {colStories.length === 0 && (
                          <div className="text-center p-8 bg-slate-100/50 rounded-lg border border-dashed border-slate-200 text-[10.5px] text-slate-400 italic">
                            Sin historias
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: ANALYTICS & METRICS DASHBOARD (Specification 20) */}
      {scrumSubTab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* QA TEST EXECUTIONS STATUS */}
            <div className="bg-white border rounded-2xl p-5 shadow-sm">
              <h4 className="font-black text-slate-800 text-xs uppercase tracking-wider mb-3">Seguimiento de Casos de Prueba (QA)</h4>
              
              <div className="flex items-center justify-between gap-6">
                {/* SVG Pie Representation */}
                <div className="w-24 h-24 shrink-0 relative flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f1f5f9" strokeWidth="3" />
                    {totalTestsCount > 0 && (
                      <>
                        <circle 
                          cx="18" cy="18" r="15.915" fill="none" stroke="#22c55e" strokeWidth="3" 
                          strokeDasharray={`${(passedTestsCount / totalTestsCount) * 100} ${100 - (passedTestsCount / totalTestsCount) * 100}`}
                        />
                        <circle 
                          cx="18" cy="18" r="15.915" fill="none" stroke="#ef4444" strokeWidth="3" 
                          strokeDasharray={`${(failedTestsCount / totalTestsCount) * 100} ${100 - (failedTestsCount / totalTestsCount) * 100}`}
                          strokeDashoffset={-((passedTestsCount / totalTestsCount) * 100)}
                        />
                      </>
                    )}
                  </svg>
                  <div className="absolute text-center">
                    <span className="text-base font-extrabold text-slate-800 block">{totalTestsCount}</span>
                    <span className="text-[8px] text-slate-400 uppercase">Proba. No.</span>
                  </div>
                </div>

                <div className="flex-1 space-y-2.5">
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span className="flex items-center gap-1.5 font-medium">
                      <span className="w-2.5 h-2.5 bg-green-500 rounded-full" />
                      Aprobados (Passed)
                    </span>
                    <strong className="font-mono text-slate-800">{passedTestsCount}</strong>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span className="flex items-center gap-1.5 font-medium">
                      <span className="w-2.5 h-2.5 bg-red-500 rounded-full" />
                      Fallidos (Failed)
                    </span>
                    <strong className="font-mono text-slate-800">{failedTestsCount}</strong>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span className="flex items-center gap-1.5 font-medium">
                      <span className="w-2.5 h-2.5 bg-slate-300 rounded-full" />
                      Pendientes / Otros
                    </span>
                    <strong className="font-mono text-slate-800">
                      {totalTestsCount - (passedTestsCount + failedTestsCount)}
                    </strong>
                  </div>
                </div>
              </div>
            </div>

            {/* BUGS BY SEVERITY */}
            <div className="bg-white border rounded-2xl p-5 shadow-sm">
              <h4 className="font-black text-slate-800 text-xs uppercase tracking-wider mb-3">Defectos / Bugs por Severidad</h4>
              
              <div className="space-y-3 pt-1">
                {(['Bloqueante', 'Crítica', 'Alta', 'Media', 'Baja'] as const).map(sev => {
                  const itemsSev = bugs.filter(b => b.sprint_id === selectedSprintId && b.severity === sev && b.status !== 'Cerrado');
                  const count = itemsSev.length;
                  const totalB = bugs.filter(b => b.sprint_id === selectedSprintId && b.status !== 'Cerrado').length || 1;
                  const percent = Math.round((count / totalB) * 100);

                  return (
                    <div key={sev} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className={`font-semibold uppercase text-[9.5px] ${
                          sev === 'Bloqueante' || sev === 'Crítica' ? 'text-red-600' :
                          sev === 'Alta' ? 'text-amber-600' : 'text-slate-505'
                        }`}>
                          {sev}
                        </span>
                        <span className="font-mono font-bold text-slate-850">{count} abiertos</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${
                            sev === 'Bloqueante' || sev === 'Crítica' ? 'bg-red-505' :
                            sev === 'Alta' ? 'bg-amber-450' : 'bg-slate-350'
                          }`} 
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* HISTORIAS POR ESTADO DE QA */}
            <div className="bg-white border rounded-2xl p-5 shadow-sm">
              <h4 className="font-black text-slate-800 text-xs uppercase tracking-wider mb-3">Requerimientos por Auditoría QA</h4>
              
              <div className="space-y-3 pt-1">
                {[
                  { label: 'Pendiente de casos', color: 'bg-slate-400', count: activeStories.filter(s => getExtendedQaStatus(s) === 'PENDIENTE_CASOS').length },
                  { label: 'Ejecutando Pruebas', color: 'bg-sky-400', count: activeStories.filter(s => getExtendedQaStatus(s) === 'EJECUCION_QA').length },
                  { label: 'Con Fallas QA', color: 'bg-red-500', count: activeStories.filter(s => getExtendedQaStatus(s) === 'PRUEBA_FALLIDA').length },
                  { label: 'Aprobado QA', color: 'bg-green-500', count: activeStories.filter(s => getExtendedQaStatus(s) === 'APROBADO_QA' || getExtendedQaStatus(s) === 'CERRADO_QA').length },
                ].map((item, idx) => {
                  const percent = activeStories.length > 0 ? Math.round((item.count / activeStories.length) * 100) : 0;
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs text-slate-650">
                        <span>{item.label}</span>
                        <strong className="text-slate-800">{item.count} HU ({percent}%)</strong>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${item.color}`} style={{ width: `${percent}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ACTIVE CRITICAL DEFECTS */}
          <div className="bg-white border rounded-2xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-bold text-slate-800 text-sm">Defectos Críticos &amp; Bloqueos Activos</h4>
              <span className="font-mono text-xs bg-red-50 text-red-700 px-3 py-1 rounded-full font-bold">Defectos Críticos</span>
            </div>

            <div className="space-y-3">
              {bugs.filter(b => b.sprint_id === selectedSprintId && b.status !== 'Cerrado' && (b.severity === 'Bloqueante' || b.severity === 'Crítica')).map(b => (
                <div key={b.id} className="border border-red-250 bg-red-50/20 rounded-xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold bg-red-100 text-red-800 px-2 py-0.5 rounded border border-red-200">
                        {b.code}
                      </span>
                      <strong className="text-xs text-slate-900">{b.title}</strong>
                      <span className="text-[10px] bg-red-50 text-red-700 uppercase font-black tracking-wide">
                        {b.severity}
                      </span>
                    </div>
                    <p className="text-xs text-slate-550 leading-relaxed">
                      {b.description}
                    </p>
                    <div className="text-[10px] text-slate-450">
                      Reportado el: {new Date(b.reported_at).toLocaleString('es-ES')} por {b.reported_by}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <select
                      value={b.status}
                      onChange={(e) => handleUpdateBugStatus(b.id, e.target.value as any)}
                      className="bg-white border rounded-lg px-2.5 py-1.5 text-xs text-red-750 font-bold"
                    >
                      <option value="Abierto">💻 Abierto</option>
                      <option value="Asignado">👥 Asignado</option>
                      <option value="En corrección">🔧 En Corrección</option>
                      <option value="Corregido">✔️ Corregido Dev</option>
                      <option value="En re-test">🔄 Re-test QA</option>
                      <option value="Cerrado">✅ Cerrado (Cerra.)</option>
                    </select>
                  </div>
                </div>
              ))}
              {bugs.filter(b => b.sprint_id === selectedSprintId && b.status !== 'Cerrado' && (b.severity === 'Bloqueante' || b.severity === 'Crítica')).length === 0 && (
                <p className="text-center p-8 bg-slate-50 rounded-xl text-xs text-slate-500 italic">
                  ¡Increíble! No se tienen reportados defectos bloqueantes o críticos para este periodo de Sprint.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: STORIES ACCEPTANCE CRITERIA & QA DETAILED MANAGER */}
      {scrumSubTab === 'detail' && (
        <div className="space-y-4">
          <div className="bg-slate-50 border border-slate-205 p-4 rounded-xl flex justify-between items-center">
            <span className="text-xs text-slate-550">Seleccione un requerimiento activo para desglosar sus criterios, generar casos QA y reportar bugs.</span>
            <span className="text-[10px] uppercase font-bold text-slate-400">Panel de Control Ágil</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* LHS: STORIES LIST */}
            <div className="bg-white border rounded-xl p-4 shadow-3xs space-y-3 max-h-[500px] overflow-y-auto">
              <span className="block font-bold text-xs text-slate-500 uppercase tracking-wider mb-2">Historias del Sprint ({activeStories.length})</span>
              
              {activeStories.map(st => {
                const isSelected = selectedStoryId === st.id;
                const critList = criteria.filter(c => c.user_story_id === st.id);
                const passedC = critList.filter(c => c.status === 'Cumple').length;
                const totalC = critList.length;

                return (
                  <div
                    key={st.id}
                    onClick={() => setSelectedStoryId(st.id)}
                    className={`p-3 rounded-lg border transition cursor-pointer select-none flex justify-between items-center ${
                      isSelected 
                        ? 'border-teal-500 bg-teal-50/40 text-teal-950 font-bold' 
                        : 'border-slate-150 hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <div className="space-y-1 flex-1 truncate pr-3">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[10px] text-teal-800 bg-teal-50 px-1 rounded font-black border border-teal-100">
                          {st.key}
                        </span>
                        <span className="text-[10px] font-mono font-bold text-slate-400 font-bold">{st.story_points} SP</span>
                      </div>
                      <h6 className="text-xs truncate">{st.title}</h6>
                    </div>

                    <span className="bg-slate-200 text-slate-700 font-mono text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0">
                      {passedC}/{totalC} Crit.
                    </span>
                  </div>
                );
              })}
            </div>

            {/* RHS: DETAILED QA PANEL */}
            <div className="bg-white border rounded-xl p-6 shadow-3xs lg:col-span-2 space-y-6">
              {activeStory ? (
                <>
                  <div className="pb-4 border-b">
                    <div className="flex justify-between items-center">
                      <span className="font-mono bg-teal-50 text-teal-800 text-xs px-2.5 py-1 rounded font-black border border-teal-100">
                        {activeStory.key}
                      </span>
                      <span className="text-xs text-slate-450 leading-relaxed">
                        Estado técnico: <strong className="text-slate-800">{getExtendedStatus(activeStory)}</strong>
                      </span>
                    </div>
                    <h3 className="font-black text-slate-900 mt-2 text-base">{activeStory.title}</h3>
                    <p className="text-xs text-slate-500 mt-2 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-150">
                      <strong>Fórmula Ágil:</strong> COMO [<strong>{ (activeStory as any).role || 'Rol del usuario' }</strong>], QUIERO [<strong>{ (activeStory as any).want || 'Acción o requerimiento' }</strong>], PARA [<strong>{ (activeStory as any).benefit || 'Beneficio esperado' }</strong>].
                    </p>
                  </div>

                  {/* Criteria Section */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center sm:flex-row flex-col">
                      <h4 className="font-bold text-xs uppercase text-slate-500 tracking-wider">Criterios de Aceptación obligatorios ({criteria.filter(c => c.user_story_id === activeStory.id).length})</h4>
                      <button 
                        onClick={handleAutoSuggestTestCases}
                        className="text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 px-3.5 py-1.5 rounded-xl border border-purple-200"
                      >
                        ⚡ Generar sugeridos de suite QA
                      </button>
                    </div>

                    <div className="space-y-3">
                      {criteria.filter(c => c.user_story_id === activeStory.id).map(crit => (
                        <div key={crit.id} className="p-3 bg-slate-50 rounded-xl border border-slate-150 space-y-2">
                          <div className="flex justify-between items-start md:items-center flex-col md:flex-row gap-2">
                            <span className="text-xs text-slate-850 font-medium">
                              <strong>Criterio {crit.number} [{crit.type}]:</strong> {crit.description}
                            </span>
                            
                            <div className="flex items-center gap-1.5 shrink-0">
                              {(['Pendiente', 'Cumple', 'No cumple', 'No aplica'] as const).map(badge => (
                                <button
                                  key={badge}
                                  onClick={() => handleUpdateCriterionStatus(crit.id, badge)}
                                  className={`px-2 py-1 text-[9.5px] font-bold rounded-lg border cursor-pointer transition ${
                                    crit.status === badge
                                      ? badge === 'Cumple' ? 'bg-green-100 border-green-300 text-green-800' :
                                        badge === 'No cumple' ? 'bg-red-100 border-red-300 text-red-800' :
                                        badge === 'No aplica' ? 'bg-slate-200 border-slate-350 text-slate-800' : 'bg-slate-100 border-slate-300 text-slate-700'
                                      : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-500'
                                  }`}
                                >
                                  {badge}
                                </button>
                              ))}
                            </div>
                          </div>
                          
                          <p className="text-[10px] text-slate-500 leading-relaxed italic">
                            💻 <strong>Resultado Esperado:</strong> {crit.expected_result}
                          </p>

                          {/* Editable comment field for acceptance criterion validation */}
                          <div className="pt-2 border-t border-dashed border-slate-200 mt-1 flex flex-col sm:flex-row sm:items-center gap-2">
                            <span className="text-[9.5px] uppercase font-bold text-slate-400 shrink-0">💬 Observaciones / Comentario:</span>
                            <input
                              type="text"
                              value={crit.comment || ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                setCriteria(prev => prev.map(c => c.id === crit.id ? { ...c, comment: val } : c));
                              }}
                              placeholder="Escriba un comentario o nota de validación sobre este criterio..."
                              className="flex-1 text-[11px] bg-white border border-slate-200 focus:border-slate-300 rounded px-2.5 py-1 outline-none text-slate-700 font-semibold"
                            />
                          </div>
                        </div>
                      ))}

                      {/* Add criterion form */}
                      <form onSubmit={handleAddCriterion} className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-2 border-t border-dashed">
                        <input
                          type="text"
                          required
                          placeholder="Nuevo criterio de aceptación funcional..."
                          value={newCriterionDesc}
                          onChange={e => setNewCriterionDesc(e.target.value)}
                          className="md:col-span-2 text-xs bg-slate-50 border p-2 rounded-xl focus:bg-white outline-none"
                        />
                        <select
                          value={newCriterionType}
                          onChange={e => setNewCriterionType(e.target.value as any)}
                          className="text-xs bg-slate-55 border p-2 rounded-xl"
                        >
                          <option value="Funcional">Funcional</option>
                          <option value="Validación">Validación</option>
                          <option value="Cálculo">Cálculo</option>
                          <option value="Integración">Integración</option>
                          <option value="Seguridad">Seguridad</option>
                          <option value="Reporte">Reporte</option>
                        </select>
                        <input
                          type="text"
                          placeholder="Resultado esperado..."
                          value={newCriterionExpected}
                          onChange={e => setNewCriterionExpected(e.target.value)}
                          className="md:col-span-3 text-xs bg-slate-50 border p-2 rounded-xl focus:bg-white outline-none"
                        />
                        <button type="submit" className="bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs p-2 rounded-xl md:col-span-3 transition cursor-pointer">
                          + Agregar Criterio de Aceptación
                        </button>
                      </form>
                    </div>
                  </div>

                  {/* Test Cases List */}
                  <div className="space-y-4 pt-4 border-t">
                    <h4 className="font-bold text-xs uppercase text-slate-500 tracking-wider">Casos de Prueba (Suite QA)</h4>
                    
                    <div className="space-y-2.5">
                      {testCases.filter(tc => tc.work_item_id === activeStory.id).map(tc => (
                        <div key={tc.id} className="border border-purple-200 rounded-xl p-4 space-y-2 bg-purple-50/5">
                          <div className="flex justify-between items-center sm:flex-row flex-col gap-2">
                            <h5 className="font-bold text-xs text-slate-900">{tc.title}</h5>
                            <div className="flex items-center gap-1 shrink-0">
                              <span className={`px-2.5 py-1 text-[9.5px] font-black uppercase rounded-lg border ${
                                tc.status === 'PASSED' ? 'bg-green-105 border-green-300 text-green-700' :
                                tc.status === 'FAILED' ? 'bg-red-105 border-red-300 text-red-650' : 'bg-slate-100 border-slate-300 text-slate-500'
                              }`}>
                                {tc.status}
                              </span>

                              <button
                                onClick={() => handleRunTestCase(tc.id, 'PASSED')}
                                className="bg-green-600 text-white p-1 rounded-lg hover:bg-green-500 text-[10px] font-bold px-2 py-1 flex items-center gap-1 cursor-pointer"
                              >
                                Pasó
                              </button>
                              <button
                                onClick={() => handleRunTestCase(tc.id, 'FAILED')}
                                className="bg-red-600 text-white p-1 rounded-lg hover:bg-red-500 text-[10px] font-bold px-2 py-1 flex items-center gap-1 cursor-pointer"
                              >
                                Falló
                              </button>
                            </div>
                          </div>

                          <div className="text-[10.5px] text-slate-600 font-medium">
                            👣 <strong>Paso a paso:</strong>
                            <ul className="list-decimal pl-4.5 space-y-0.5 mt-1 text-[10px]">
                              {tc.steps?.map((st, i) => <li key={i}>{st}</li>)}
                            </ul>
                          </div>

                          <span className="block text-[10px] text-purple-700 italic">
                            🎯 <strong>Resultado esperado:</strong> {tc.expected}
                          </span>
                        </div>
                      ))}

                      {testCases.filter(tc => tc.work_item_id === activeStory.id).length === 0 && (
                        <p className="text-center p-6 bg-slate-50 rounded-xl text-xs text-slate-500 italic border border-dashed">
                          Sin casos de prueba creados. Pruebe a agregarlos desde el botón Generar o complete la plantilla debajo.
                        </p>
                      )}

                      {/* Add manual Case */}
                      <form onSubmit={handleAddTestCase} className="space-y-2 bg-slate-50 border p-4 rounded-xl">
                        <span className="block text-[10px] font-bold text-teal-800 uppercase">Añadir Caso Manualmente a la Suite</span>
                        <input
                          type="text"
                          required
                          placeholder="Nombre del caso de prueba (ej. Validar persistencia base)"
                          value={newCaseTitle}
                          onChange={e => setNewCaseTitle(e.target.value)}
                          className="w-full text-xs bg-white border p-2 rounded-xl focus:ring-1 focus:ring-teal-500 outline-none"
                        />
                        <textarea
                          placeholder="Escriba los pasos para reproducir (uno por renglón)..."
                          value={newCaseSteps}
                          onChange={e => setNewCaseSteps(e.target.value)}
                          rows={3}
                          className="w-full text-xs bg-white border p-2 rounded-xl focus:ring-1 focus:ring-teal-500 outline-none"
                        />
                        <input
                          type="text"
                          placeholder="Resultado esperado..."
                          value={newCaseExpected}
                          onChange={e => setNewCaseExpected(e.target.value)}
                          className="w-full text-xs bg-white border p-2 rounded-xl focus:ring-1 focus:ring-teal-500 outline-none"
                        />
                        <button type="submit" className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs p-2 rounded-xl w-full transition cursor-pointer">
                          Añadir Caso a la Suite
                        </button>
                      </form>
                    </div>
                  </div>

                  {/* Bug reporting tab */}
                  <div className="space-y-4 pt-4 border-t">
                    <h4 className="font-bold text-xs uppercase text-slate-500 tracking-wider">Reportar Defecto / Bug en QA</h4>
                    
                    <form onSubmit={handleAddBug} className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-50 border p-4 rounded-xl">
                      <div className="md:col-span-2">
                        <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Título del Bug</label>
                        <input
                          type="text"
                          required
                          placeholder="Ej. Error fatal en la validación el domingo"
                          value={newBugTitle}
                          onChange={e => setNewBugTitle(e.target.value)}
                          className="w-full text-xs bg-white border p-2 rounded-xl focus:ring-1 focus:ring-teal-400 outline-none"
                        />
                      </div>
                      
                      <div className="md:col-span-2">
                        <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Descripción de la falla</label>
                        <textarea
                          placeholder="Descripción detallada de la anomalía técnica..."
                          value={newBugDesc}
                          onChange={e => setNewBugDesc(e.target.value)}
                          rows={2}
                          className="w-full text-xs bg-white border p-2 rounded-xl focus:ring-1 focus:ring-teal-400 outline-none"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Pasos para reproducir</label>
                        <textarea
                          placeholder="1. Ir a...\n2. Hacer cliq en..."
                          value={newBugSteps}
                          onChange={e => setNewBugSteps(e.target.value)}
                          rows={2.5}
                          className="w-full text-xs bg-white border p-2 rounded-xl focus:ring-1 focus:ring-teal-400 outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Resultado Esperado</label>
                        <input
                          type="text"
                          placeholder="Debe proceder sin alertas."
                          value={newBugExpected}
                          onChange={e => setNewBugExpected(e.target.value)}
                          className="w-full text-xs bg-white border p-2 rounded-xl focus:ring-1 focus:ring-teal-400 outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Resultado Obtenido</label>
                        <input
                          type="text"
                          placeholder="Se despliega alerta de falla."
                          value={newBugActual}
                          onChange={e => setNewBugActual(e.target.value)}
                          className="w-full text-xs bg-white border p-2 rounded-xl focus:ring-1 focus:ring-teal-400 outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Severidad</label>
                        <select
                          value={newBugSev}
                          onChange={e => setNewBugSev(e.target.value as any)}
                          className="w-full text-xs bg-white border p-2 rounded-xl focus:ring-1 focus:ring-teal-400 outline-none font-bold"
                        >
                          <option value="Baja">🟢 Baja (Cosmético)</option>
                          <option value="Media">🟡 Media</option>
                          <option value="Alta">🟠 Alta</option>
                          <option value="Crítica">🔴 Crítica</option>
                          <option value="Bloqueante">🚨 Bloqueante</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Prioridad</label>
                        <select
                          value={newBugPri}
                          onChange={e => setNewBugPri(e.target.value as any)}
                          className="w-full text-xs bg-white border p-1.5 p-2 rounded-xl font-bold"
                        >
                          <option value="Baja">🟡 Baja</option>
                          <option value="Media">🟠 Media</option>
                          <option value="Alta">🔴 Alta</option>
                        </select>
                      </div>

                      <button type="submit" className="bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs p-2.5 rounded-xl md:col-span-2 transition cursor-pointer flex items-center justify-center gap-1.5 shadow">
                        🐞 Registrar Bug de Bloqueo QA
                      </button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="text-center p-16 space-y-3">
                  <span className="block text-2xl">⚡</span>
                  <p className="text-sm font-bold text-slate-600">Por favor seleccione un requerimiento de la barra izquierda para auditar QA.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 5: SCRUM SPRINT TRACE LOGS */}
      {scrumSubTab === 'logs' && (
        <div className="bg-white border rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b pb-3.5">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Bitácora Automatizada de Trazabilidad y Cambios</h3>
              <p className="text-[11px] text-slate-450 mt-0.5">Control de auditoría completo y seguro para auditores ágiles PMO.</p>
            </div>
            <button
              onClick={() => {
                setAuditLogs([]);
                registerAudit('Inicializó historial limpio de la bitácora Scrum.');
              }}
              className="text-xs font-bold text-red-650 bg-red-50 hover:bg-red-100 border border-red-200 px-3 py-1.5 rounded-xl cursor-pointer"
            >
              Limpiar Bitácora Historica
            </button>
          </div>

          <div className="space-y-3 max-h-[460px] overflow-y-auto">
            {auditLogs.filter(log => log.sprint_id === selectedSprintId).map(log => (
              <div key={log.id} className="p-3 bg-slate-50 border border-slate-150 rounded-xl flex items-start gap-3.5 text-xs">
                <span className="p-1.5 bg-slate-200 text-slate-700 rounded-lg font-bold text-[10.5px] select-none text-center">
                  ⏱️
                </span>
                <div className="flex-1 space-y-0.5">
                  <p className="text-slate-800 leading-relaxed font-mono text-[11px]">
                    {log.action}
                  </p>
                  <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
                    <strong>{log.user} ({log.role})</strong>
                    <span>•</span>
                    <span>{new Date(log.timestamp).toLocaleString('es-ES')}</span>
                  </div>
                </div>
              </div>
            ))}
            {auditLogs.filter(log => log.sprint_id === selectedSprintId).length === 0 && (
              <p className="text-center p-8 text-xs text-slate-450 italic">
                Ningún cambio registrado en bitácora para este Sprint.
              </p>
            )}
          </div>
        </div>
      )}

      {/* FLOATING MODAL OVERLAY: POWERFUL USER STORY DETAIL & COMPLIANCE SPEC WRITER */}
      {isStoryDetailOpen && activeStory && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-4xl w-full max-h-[92vh] shadow-2xl overflow-y-auto flex flex-col justify-between animate-fadeIn">
            
            {/* Header */}
            <div className="bg-slate-900 text-white p-5 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <span className="font-mono bg-teal-500/20 text-teal-300 font-extrabold text-xs px-2.5 py-1 rounded border border-teal-500/30">
                  {activeStory.key}
                </span>
                <h4 className="font-black text-sm tracking-tight truncate max-w-lg">{activeStory.title}</h4>
              </div>
              <button
                onClick={() => {
                  setIsStoryDetailOpen(false);
                  setTransitionWarnings([]);
                }}
                className="text-slate-400 hover:text-white transition p-1 cursor-pointer bg-slate-800 rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Area */}
            <div className="p-6 space-y-5 overflow-y-auto flex-1">
              
              {/* DOR/DOD validation warning flag if transition alert is present */}
              {transitionWarnings.length > 0 && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-[11.5px] text-red-100 flex gap-2">
                  <ShieldAlert className="w-5 h-5 text-red-500 shrink-0" />
                  <div>
                    <strong className="text-red-400 block mb-1">⚠️ Error al mover de columna (Reglas de Transición):</strong>
                    <ul className="list-disc pl-4 space-y-0.5">
                      {transitionWarnings.map((err, i) => <li key={i}>{err}</li>)}
                    </ul>
                  </div>
                </div>
              )}

              {/* Story summary & status strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 border p-4 rounded-xl text-xs">
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase font-bold">Estado Técnico</span>
                  <strong className="text-slate-800 text-xs mt-0.5 block">{getExtendedStatus(activeStory)}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase font-bold">Sprint Asignado</span>
                  <strong className="text-teal-700 text-xs mt-0.5 block">
                    {(() => {
                      const sp = sprints.find(s=>s.id === activeStory.sprint_id);
                      return sp ? formatSprintName(sp.name) : 'Product Backlog';
                    })()}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase font-bold">Story Points</span>
                  <strong className="text-slate-800 text-xs mt-0.5 block">{activeStory.story_points || 'Sin estimar'}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase font-bold">Bloqueado?</span>
                  <button 
                    onClick={() => handleToggleBlock(activeStory.id)}
                    className={`mt-1 font-bold text-[10px] px-2 py-0.5 rounded flex items-center gap-1 ${
                      (activeStory as any).blocked ? 'bg-red-100 text-red-700' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {(activeStory as any).blocked ? '🔴 SÍ (Bloqueada)' : '⚪ No'}
                  </button>
                </div>
              </div>

              {/* Blocking reason detail editor if block active */}
              {blockedItemPromptId === activeStory.id && (
                <div className="bg-red-500/5 border border-red-300 rounded-xl p-4 space-y-2">
                  <span className="block text-xs font-bold text-red-800">⚠️ Indique el motivo del Bloqueo:</span>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Esperando que Infraestructura levante el DNS provisional..."
                    value={blockReasonText}
                    onChange={e => setBlockReasonText(e.target.value)}
                    className="w-full text-xs bg-white border p-2 rounded-xl outline-none"
                  />
                  <div className="flex gap-2">
                    <button onClick={submitBlockStory} className="bg-red-650 hover:bg-red-700 text-white font-bold text-[10px] py-1.5 px-3 rounded-lg cursor-pointer">
                      Confirmar Bloqueo
                    </button>
                    <button onClick={() => setBlockedItemPromptId(null)} className="text-slate-500 font-bold text-[10px] py-1.5 px-3 hover:bg-slate-100 rounded-lg cursor-pointer">
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {/* Show block explanation if activeStory is indeed blocked */}
              {(activeStory as any).blocked && (
                <div className="bg-red-105 border border-red-200 text-red-800 rounded-xl p-4 text-[11px]">
                  <strong>⚠️ HISTORIA BLOQUEADA:</strong> {(activeStory as any).blocked_reason || 'Esperando respuesta del Product Owner con respecto a reglas financieras.'}
                </div>
              )}

              {/* Formula box and detailed specification description fields */}
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase font-black text-slate-500 tracking-wider">Detalle del Requerimiento Ágil</span>
                <div className="bg-slate-50 border p-4 rounded-xl space-y-3">
                  <div className="text-xs text-slate-800">
                    <span className="font-bold text-teal-800 uppercase text-[9.5px] block mb-1">COMO:</span>
                    { (activeStory as any).role || 'Planificador logístico de proyecciones' }
                  </div>
                  <div className="text-xs text-slate-800">
                    <span className="font-bold text-teal-800 uppercase text-[9.5px] block mb-1">QUIERO:</span>
                    { (activeStory as any).want || 'Poder visualizar la merma en un tablero consolidado por semana' }
                  </div>
                  <div className="text-xs text-slate-800">
                    <span className="font-bold text-teal-800 uppercase text-[9.5px] block mb-1">PARA:</span>
                    { (activeStory as any).benefit || 'Reducir la pérdida de existencias por retrasos del proveedor en Occidente' }
                  </div>
                </div>
              </div>

              {/* Re-prioritize or re-assign sprint form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t">
                <div>
                  <span className="font-bold text-xs text-slate-500 uppercase tracking-wider block mb-2">Re-Planificar / Mover a otro Sprint (Transición)</span>
                  <div className="flex gap-2 bg-slate-50 p-3 rounded-xl border">
                    <select
                      id="sprint-reassign-select"
                      className="bg-white border rounded-xl px-2 py-1.5 text-xs text-slate-700"
                    >
                      <option value="">Product Backlog</option>
                      {sprints.filter(s => s.project_id === selectedProjectId && s.id !== selectedSprintId).map(sp => (
                        <option key={sp.id} value={sp.id}>{formatSprintName(sp.name)}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => {
                        const sel = document.getElementById('sprint-reassign-select') as HTMLSelectElement;
                        const targetId = sel?.value;
                        const reason = prompt('Indique el motivo / justificación de la re-planificación hacia el Sprint destino:');
                        if (reason) {
                          handleMoveStoryToSprint(activeStory.id, targetId, reason);
                        }
                      }}
                      className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10.5px] py-1 px-3.5 rounded-xl cursor-pointer"
                    >
                      Mover Sprint ➔
                    </button>
                  </div>
                </div>

                <div>
                  <span className="font-bold text-xs text-slate-500 uppercase tracking-wider block mb-2">Responsables Asignados</span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-55 p-2 rounded border">
                      <span className="block text-[8px] uppercase text-slate-400">Developer</span>
                      <strong>{users.find(u=>u.id === activeStory.assignee_id)?.first_name || 'Sin Asignar'}</strong>
                    </div>
                    <div className="bg-slate-55 p-2 rounded border">
                      <span className="block text-[8px] uppercase text-slate-400">Revisor QA</span>
                      <strong>Valentina Rojas</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Evidence attachments tab */}
              <div className="space-y-4 pt-4 border-t">
                <span className="text-xs uppercase font-black text-slate-500 tracking-wider">Evidencias Adjuntas (Documentación Técnica)</span>
                
                <div className="space-y-2">
                  {evidences.filter(ev => ev.entity_id === activeStory.id && ev.entity_type === 'story').map(ev => (
                    <div key={ev.id} className="p-3 bg-slate-50 rounded-xl border flex justify-between items-center text-xs">
                      <div className="flex items-center gap-2">
                        <Paperclip className="w-4 h-4 text-slate-400 shrink-0" />
                        <div>
                          <strong>{ev.file_name}</strong>
                          <span className="block text-[9.5px] text-slate-500 mt-0.5">Subido el {new Date(ev.uploaded_at).toLocaleString('es-ES')} por {ev.uploaded_by}</span>
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-400">Guardado en sim. cloud</span>
                    </div>
                  ))}
                  {evidences.filter(ev => ev.entity_id === activeStory.id && ev.entity_type === 'story').length === 0 && (
                    <p className="text-center py-4 bg-slate-50 rounded-xl text-[10.5px] text-slate-400 italic border">
                      No se tienen archivos o evidencias funcionales adjuntadas todavía.
                    </p>
                  )}

                  <form onSubmit={handleAddEvidence} className="flex gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <input
                      type="text"
                      required
                      placeholder="Nombre del archivo/test (ej. screenshot_passed_po.png)"
                      value={newEvidenceName}
                      onChange={e => setNewEvidenceName(e.target.value)}
                      className="bg-white border rounded-lg px-2.5 py-1 text-xs text-slate-800 flex-1 focus:outline-none"
                    />
                    <button type="submit" className="bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs px-4 py-1 rounded-xl cursor-pointer">
                      Subir Evidencia
                    </button>
                  </form>
                </div>
              </div>

            </div>

            {/* Footer buttons */}
            <div className="bg-slate-100 p-4 border-t flex justify-end gap-2 shrink-0">
              <button
                onClick={() => {
                  setIsStoryDetailOpen(false);
                  setTransitionWarnings([]);
                }}
                className="bg-slate-900 text-white font-bold text-xs py-2 px-5 rounded-xl hover:bg-slate-800 cursor-pointer"
              >
                Cerrar Panel de Control
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
