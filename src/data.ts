/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  User,
  Portfolio,
  Project,
  ProjectCost,
  Sprint,
  WorkItem,
  ProjectActivity,
  TestSuite,
  TestCase,
  TestRun,
  Mockup,
  MockupScreen,
  MockupComponent,
  MockupConnection,
  GitHubConnection,
  GitCommit,
  PullRequest,
  TransitionRule
} from './types';

export const INITIAL_USERS: User[] = [
  {
    id: 'u-sa',
    first_name: 'SA',
    last_name: 'Administración',
    email: 'sa@campestre.com.sv',
    role: 'Sponsor / Directora',
    status: 'ACTIVE',
    password: 'Camp2026+Prub28'
  },
  {
    id: 'u-109903678',
    first_name: 'WILLIAM ALEXANDER',
    last_name: 'CASTRO RAMOS',
    email: 'alex.castro@campestre.com.sv',
    role: 'Project Manager',
    status: 'ACTIVE',
    password: 'Camp2026+Prub28'
  },
  {
    id: 'u-113944672',
    first_name: 'ELMER JOSUE',
    last_name: 'SEGOVIA TORRES',
    email: 'elmer.segovia@campestre.com.sv',
    role: 'Project Manager',
    status: 'ACTIVE',
    password: 'Camp2026+Prub28'
  },
  {
    id: 'u-121952036',
    first_name: 'KEVIN ADIN',
    last_name: 'FLORES PRIVADO',
    email: 'kevin.flores@campestre.com.sv',
    role: 'Project Manager',
    status: 'ACTIVE',
    password: 'Camp2026+Prub28'
  },
  {
    id: 'u-695768487',
    first_name: 'SANDRA CECILIA',
    last_name: 'RODRIGUEZ DE GUZMAN',
    email: 'Cecilia.Rodriguez@campestre.com.sv',
    role: 'Project Manager',
    status: 'ACTIVE',
    password: 'Camp2026+Prub28'
  },
  {
    id: 'u-121973398',
    first_name: 'JOSE RODOLFO',
    last_name: 'GALEAS ARIAS',
    email: 'rodolfo.galeas@campestre.com.sv',
    role: 'Project Manager',
    status: 'ACTIVE',
    password: 'Camp2026+Prub28'
  }
];
export const INITIAL_PORTFOLIOS: Portfolio[] = [
  {
    id: 'port-1',
    name: 'Portafolio de Logística y Operaciones Campestre',
    description: 'Portafolio corporativo para la gestión y seguimiento del ciclo de vida de proyectos.',
    status: 'ACTIVE',
    priority: 'HIGH'
  }
];

export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'proj-1',
    portfolio_id: 'port-1',
    team_id: 'team-1',
    name: 'Plataforma Control PMO Campestre',
    code: 'PMO-GCP',
    description: 'Sistema integral de planificación, estimados de costes, backlog ágil y aseguramiento de calidad QA de Grupo Campestre.',
    client: 'Grupo Campestre',
    sponsor: 'u-sa',
    project_manager_id: 'u-109903678',
    scrum_master_id: 'u-109903678',
    product_owner_id: 'u-sa',
    status: 'REQUERIMIENTOS',
    priority: 'HIGH',
    start_date: '2026-06-11',
    end_date: '2026-12-31',
    sprint_size_weeks: 2,
    sprint_size_days: 10,
    budget_total: 150000,
    desarrollo: 'Interno',
    categoria: 'Mediano'
  }
];

export const INITIAL_PROJECT_COSTS: ProjectCost[] = [];

export const INITIAL_SPRINTS: Sprint[] = [];

export const INITIAL_WORK_ITEMS: WorkItem[] = [];

export const INITIAL_PROJECT_ACTIVITIES: ProjectActivity[] = [];

export const INITIAL_TEST_SUITES: TestSuite[] = [];

export const INITIAL_TEST_CASES: TestCase[] = [];

export const INITIAL_TEST_RUNS: TestRun[] = [];

export const INITIAL_MOCKUPS: Mockup[] = [];

export const INITIAL_MOCKUP_SCREENS: MockupScreen[] = [];

export const INITIAL_MOCKUP_COMPONENTS: MockupComponent[] = [];

export const INITIAL_MOCKUP_CONNECTIONS: MockupConnection[] = [];

export const INITIAL_GITHUB_CONNECTION: GitHubConnection = {
  id: 'git-conn-1',
  project_id: 'proj-1',
  repository: '',
  branch: 'main',
  webhook_active: false
};

export const INITIAL_COMMITS: GitCommit[] = [];

export const INITIAL_PRS: PullRequest[] = [];

export const DEFAULT_TRANSITION_RULES: TransitionRule[] = [
  { id: 'no_iniciados_prioridad', name: 'Prioridad estipulada', desc: 'La historia debe tener prioridad estipulada.', category: 'No Iniciado', targetCol: 'NO_INICIADO', enabled: true },
  { id: 'no_iniciados_responsable', name: 'Responsable técnico asignado', desc: 'Debe asignarse un responsable técnico/funcional.', category: 'No Iniciado', targetCol: 'NO_INICIADO', enabled: true },
  
  { id: 'en_analisis_descripcion', name: 'Descripción clara', desc: 'Debe registrarse una descripción clara o analítica del requerimiento (>10 carac.).', category: 'En Análisis', targetCol: 'EN_ANALISIS', enabled: true },
  { id: 'en_analisis_responsable', name: 'Responsable técnico asignado', desc: 'Responsable técnico/funcional no asignado.', category: 'En Análisis', targetCol: 'EN_ANALISIS', enabled: true },
  
  { id: 'en_desarrollo_sp', name: 'Story Points estimulados (DOR)', desc: 'DOR: No estimulado. Ingrese Story Points (SP) antes de desarrollar.', category: 'En Desarrollo', targetCol: 'EN_DESARROLLO', enabled: true },
  { id: 'en_desarrollo_unblocked', name: 'No Bloqueada (DOR)', desc: 'DOR BLOQUEADA: Desbloquee el requerimiento ingresando el motivo.', category: 'En Desarrollo', targetCol: 'EN_DESARROLLO', enabled: true },
  
  { id: 'code_review_criteria', name: 'Criterios técnicos', desc: 'Debe documentar o seleccionar al menos un componente o Criterio Técnico.', category: 'Code Review', targetCol: 'CODE_REVIEW', enabled: true },
  
  { id: 'listo_qa_no_crit_bugs', name: 'Sin Bugs Críticos/Bloqueantes', desc: 'Existen bugs críticos o bloqueantes sin resolver en este ítem.', category: 'Listo para QA', targetCol: 'LISTO_PARA_QA', enabled: true },
  
  { id: 'en_qa_sprint_active', name: 'Sprint Activo', desc: 'El Sprint debe estar activo ("En Ejecución" o "En QA") para auditar pruebas.', category: 'En QA', targetCol: 'EN_QA', enabled: true },
  
  { id: 'devuelto_qa_require_bug', name: 'Reportar al menos un Bug abierto/Caso fallido', desc: 'Para devolver la historia debe reportarse al menos un Bug abierto o Caso fallido.', category: 'Devuelto QA', targetCol: 'DEVUELTO_QA', enabled: true },
  
  { id: 'aprobado_qa_has_cases', name: 'Pruebas Configuradas', desc: 'Falta Casos: No se han configurado pruebas para este requerimiento.', category: 'Aprobado QA', targetCol: 'APROBADO_QA', enabled: true },
  { id: 'aprobado_qa_cases_passed', name: '100% Casos Passed', desc: 'Falta Ejecución: Todos los casos de prueba cargados deben marcarse APROBADO (PASSED).', category: 'Aprobado QA', targetCol: 'APROBADO_QA', enabled: true },
  { id: 'aprobado_qa_no_bugs', name: 'Sin Bugs Críticos/Altos', desc: 'Defectos Abiertos: No se puede aprobar si cuenta con bugs Críticos/Altos activos.', category: 'Aprobado QA', targetCol: 'APROBADO_QA', enabled: true },
  { id: 'aprobado_qa_criteria_ok', name: 'Criterios Cumplidos', desc: 'Criterios Pendientes: Valide que todos los Criterios de Aceptación de la historia marquen "Cumple" o "No Aplica".', category: 'Aprobado QA', targetCol: 'APROBADO_QA', enabled: true },
  
  { id: 'aprobado_po_all_passed', name: 'Aprobación QA Previa', desc: 'No autorizado por PO: Es imperativo pasar al 100% las pruebas QA antes.', category: 'Aprobado PO', targetCol: 'APROBADO_FUNCIONAL', enabled: true },
  
  { id: 'finalizado_evidence', name: 'Evidencias funcionales (DOD)', desc: 'DOD INCUMPIDLO: Adjunte por lo menos una Captura/PDF de evidencia funcional antes de Cerrar.', category: 'Finalizado', targetCol: 'FINALIZADO', enabled: true },
  { id: 'finalizado_no_crit_bugs', name: 'Sin Defectos Activos', desc: 'DOD INCUMPLIDO: Sigue existiendo defectos críticos no solventados.', category: 'Finalizado', targetCol: 'FINALIZADO', enabled: true }
];

