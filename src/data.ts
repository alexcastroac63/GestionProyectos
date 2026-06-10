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
    id: 'u-1',
    first_name: 'Ana',
    last_name: 'Gómez',
    email: 'ana.gomez@empresa.com',
    role: 'Sponsor / Directora',
    status: 'ACTIVE'
  },
  {
    id: 'u-2',
    first_name: 'Carlos',
    last_name: 'Pérez',
    email: 'carlos.perez@empresa.com',
    role: 'Project Manager',
    status: 'ACTIVE'
  },
  {
    id: 'u-3',
    first_name: 'Sofía',
    last_name: 'Ramírez',
    email: 'sofia.r@empresa.com',
    role: 'Scrum Master',
    status: 'ACTIVE'
  },
  {
    id: 'u-4',
    first_name: 'Mateo',
    last_name: 'Herrera',
    email: 'mateo.h@empresa.com',
    role: 'Product Owner',
    status: 'ACTIVE'
  },
  {
    id: 'u-5',
    first_name: 'Valentina',
    last_name: 'Rojas',
    email: 'valentina.rojas@empresa.com',
    role: 'QA Automation Engineer',
    status: 'ACTIVE'
  },
  {
    id: 'u-6',
    first_name: 'Andrés',
    last_name: 'Mendoza',
    email: 'andres.mendoza@empresa.com',
    role: 'Fullstack Dev & DBA',
    status: 'ACTIVE'
  }
];

export const INITIAL_PORTFOLIOS: Portfolio[] = [
  {
    id: 'port-1',
    name: 'Transformación Digital Bancaria',
    description: 'Portafolio de iniciativas ágiles para modernizar plataformas bancarias.',
    status: 'ACTIVE',
    priority: 'HIGH'
  },
  {
    id: 'port-2',
    name: 'SaaS & Herramientas Internas',
    description: 'Iniciativas de estandarización de herramientas de desarrollo y DevOps corporativos.',
    status: 'ACTIVE',
    priority: 'MEDIUM'
  }
];

export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'proj-1',
    portfolio_id: 'port-2',
    team_id: 'team-1',
    name: 'SaaS de Gestión de Ciclos de Proyectos',
    code: 'GCP-01',
    description: 'Plataforma para estructurar los proyectos desde su requerimiento, estimación de costos, presupuesto por fases, Gantt, Scrum Backlog, Kanban, suites de pruebas QA, mockups dinámicos y telemetría de pipelines.',
    client: 'Fintech Corp Internacional',
    sponsor: 'u-1',
    project_manager_id: 'u-2',
    scrum_master_id: 'u-3',
    product_owner_id: 'u-4',
    status: 'DESARROLLO',
    priority: 'HIGH',
    start_date: '2026-05-01',
    end_date: '2026-08-30',
    sprint_size_weeks: 2,
    sprint_size_days: 10,
    budget_total: 120000
  },
  {
    id: 'proj-2',
    portfolio_id: 'port-1',
    team_id: 'team-2',
    name: 'Plataforma de Microcréditos App',
    code: 'PMA-02',
    description: 'Diseño e integración de módulos de crédito al consumo e scoring financiero con IA.',
    client: 'Banco Aliado de Occidente',
    sponsor: 'u-1',
    project_manager_id: 'u-2',
    scrum_master_id: 'u-3',
    product_owner_id: 'u-4',
    status: 'REQUERIMIENTOS',
    priority: 'HIGH',
    start_date: '2026-06-15',
    end_date: '2026-12-15',
    sprint_size_weeks: 3,
    sprint_size_days: 10,
    budget_total: 250000
  }
];

export const INITIAL_PROJECT_COSTS: ProjectCost[] = [
  {
    id: 'cost-1',
    project_id: 'proj-1',
    cost_type: 'NOMINA',
    description: 'Equipo de Ingeniería Principal (4 ingenieros a tiempo parcial)',
    amount: 45000,
    currency: 'USD',
    created_at: '2026-05-02'
  },
  {
    id: 'cost-2',
    project_id: 'proj-1',
    cost_type: 'LICENCIAS',
    description: 'Suscripciones corporativas de Nube y Control de Repositorios',
    amount: 8500,
    currency: 'USD',
    created_at: '2026-05-02'
  },
  {
    id: 'cost-3',
    project_id: 'proj-1',
    cost_type: 'INFRAESTRUCTURA',
    description: 'Servidores de Pruebas, Docker Ingress, y Host Postgres Multi-Tenant',
    amount: 12000,
    currency: 'USD',
    created_at: '2026-05-03'
  },
  {
    id: 'cost-4',
    project_id: 'proj-1',
    cost_type: 'OUTSOURCING',
    description: 'Auditoría externa de QA y Pentesting de Seguridad',
    amount: 15400,
    currency: 'USD',
    created_at: '2026-05-05'
  },
  {
    id: 'cost-5',
    project_id: 'proj-1',
    cost_type: 'OTROS',
    description: 'Servicio de traducción externa para manuales',
    amount: 3200,
    currency: 'USD',
    created_at: '2026-05-10'
  }
];

export const INITIAL_SPRINTS: Sprint[] = [
  {
    id: 'sprint-1',
    project_id: 'proj-1',
    name: 'Sprint 1: Cimientos & Modelo Postgres',
    goal: 'Estructurar el esquema normalizado en PostgreSQL con 5 dominios y crear el pipeline CI/CD inicial.',
    start_date: '2026-05-01',
    end_date: '2026-05-14',
    status: 'FINALIZADO',
    velocity: 28,
    capacity: 32
  },
  {
    id: 'sprint-2',
    project_id: 'proj-1',
    name: 'Sprint 2: Kanban Integrado & Gantt Actividades',
    goal: 'Construir el visualizador interactivo de Gantt con dependencias y habilitar el Kanban con drag and drop.',
    start_date: '2026-05-15',
    end_date: '2026-05-28',
    status: 'EN_CURSO',
    velocity: 32,
    capacity: 35
  },
  {
    id: 'sprint-3',
    project_id: 'proj-1',
    name: 'Sprint 3: Suite QA con Reportes & Canvas Mockup',
    goal: 'Implementación del lienzo visual de mockups interactivos y la suite de ejecución de casos de prueba.',
    start_date: '2026-05-29',
    end_date: '2026-06-11',
    status: 'NO_INICIADO',
    velocity: 0,
    capacity: 35
  }
];

export const INITIAL_WORK_ITEMS: WorkItem[] = [
  // User Stories (Historias de Usuario) with prefix HU00000
  {
    id: 'item-1',
    project_id: 'proj-1',
    sprint_id: 'sprint-1',
    key: 'HU00001',
    title: 'Modelamiento base multi-tenant en PostgreSQL',
    description: 'Crear el esquema relacional con restricciones de llave primaria/foránea nativas para Portafolios, Proyectos, Requerimientos, QA, Sprints y Auditoría.',
    type: 'HISTORIA_USUARIO',
    status: 'FINALIZADO',
    priority: 'HIGH',
    story_points: 8,
    assignee_id: 'u-6',
    reporter_id: 'u-4',
    created_at: '2026-05-01'
  },
  {
    id: 'item-2',
    project_id: 'proj-1',
    sprint_id: 'sprint-1',
    key: 'HU00002',
    title: 'Pipeline CI/CD en GitHub Actions multilenguaje',
    description: 'Configurar acciones de compilación para frontend React y backend NestJS usando PNPM y validar con linter estricto.',
    type: 'HISTORIA_USUARIO',
    status: 'FINALIZADO',
    priority: 'MEDIUM',
    story_points: 5,
    assignee_id: 'u-6',
    reporter_id: 'u-3',
    created_at: '2026-05-02'
  },
  {
    id: 'item-3',
    project_id: 'proj-1',
    sprint_id: 'sprint-2',
    key: 'HU00003',
    title: 'Tablero Kanban de despliegue interactivo',
    description: 'Implementar el paso dinámico de tarjetas de Backlog a Por Hacer, En curso, QA, y Terminado de acuerdo a las reglas del sprint.',
    type: 'HISTORIA_USUARIO',
    status: 'EN_CURSO',
    priority: 'HIGH',
    story_points: 8,
    assignee_id: 'u-6',
    reporter_id: 'u-4',
    created_at: '2026-05-15'
  },
  {
    id: 'item-4',
    project_id: 'proj-1',
    sprint_id: 'sprint-2',
    key: 'HU00004',
    title: 'Reporte de Costos & Desglose Financiero de Fases',
    description: 'Generar KPI de varianza del presupuesto (Presupuestado vs Real) con gráficos circulares interactivos de categorías.',
    type: 'HISTORIA_USUARIO',
    status: 'POR_HACER',
    priority: 'MEDIUM',
    story_points: 5,
    assignee_id: 'u-2',
    reporter_id: 'u-1',
    created_at: '2026-05-16'
  },
  {
    id: 'item-5',
    project_id: 'proj-1',
    sprint_id: 'sprint-3',
    key: 'HU00005',
    title: 'Lienzo interactivo de mockup y diseño de pantallas',
    description: 'Habilitar un Canvas 2D interactivo con componentes predefinidos (Inputs, Botones, Tablas) modificables por posición y color.',
    type: 'HISTORIA_USUARIO',
    status: 'BACKLOG',
    priority: 'HIGH',
    story_points: 13,
    assignee_id: 'u-6',
    reporter_id: 'u-4',
    created_at: '2026-05-18'
  },
  {
    id: 'item-6',
    project_id: 'proj-1',
    sprint_id: 'sprint-2',
    key: 'HU00006',
    title: 'Suite de pruebas QA para ejecución de casos de prueba',
    description: 'Implementar la estructura de test suites y asignación de casos de prueba a ejecuciones de usuarios con estado final de aprobación.',
    type: 'HISTORIA_USUARIO',
    status: 'EN_CURSO',
    priority: 'HIGH',
    story_points: 8,
    assignee_id: 'u-5',
    reporter_id: 'u-3',
    created_at: '2026-05-19'
  },

  // Tareas asociadas prefix T00000
  {
    id: 'item-t1',
    project_id: 'proj-1',
    sprint_id: 'sprint-1',
    key: 'T00001',
    title: 'Escribir script SQL DDL para base multi-tenant',
    description: 'Crear llaves foráneas en cascada e índices compuestos para mejorar búsquedas de organizationId.',
    type: 'TAREA',
    status: 'FINALIZADO',
    priority: 'HIGH',
    story_points: 3,
    assignee_id: 'u-6',
    reporter_id: 'u-6',
    created_at: '2026-05-02'
  },
  {
    id: 'item-t2',
    project_id: 'proj-1',
    sprint_id: 'sprint-2',
    key: 'T00002',
    title: 'Refactorizar componentes del Kanban interactivo con estados',
    description: 'Crear handlers onDragOver y onDrop en React para mover sin lags.',
    type: 'TAREA',
    status: 'EN_CURSO',
    priority: 'MEDIUM',
    story_points: 3,
    assignee_id: 'u-6',
    reporter_id: 'u-3',
    created_at: '2026-05-16'
  },
  {
    id: 'item-b1',
    project_id: 'proj-1',
    sprint_id: 'sprint-2',
    key: 'BG00001',
    title: 'Bug: Error de fecha en línea de tiempo del Gantt',
    description: 'Las actividades que tienen dependencias de fin a comienzo a veces exceden las fechas estimadas del proyecto.',
    type: 'BUG',
    status: 'QA',
    priority: 'HIGH',
    story_points: 2,
    assignee_id: 'u-5',
    reporter_id: 'u-2',
    created_at: '2026-05-20'
  }
];

export const INITIAL_PROJECT_ACTIVITIES: ProjectActivity[] = [
  {
    id: 'act-1',
    project_id: 'proj-1',
    sprint_id: 'sprint-1',
    name: 'Fase 1: Requerimientos & Modelo Conceptual',
    description: 'Estructuración de datos y requerimientos generales con el cliente.',
    assigned_to_id: 'u-4',
    start_date: '2026-05-01',
    end_date: '2026-05-05',
    duration_days: 5,
    progress: 100,
    status: 'COMPLETADA'
  },
  {
    id: 'act-2',
    project_id: 'proj-1',
    sprint_id: 'sprint-1',
    name: 'Fase 2: Scripting DDL en PostgreSQL',
    description: 'Normalización, declaración de llaves compuestas e índices recomendados por el DBA.',
    assigned_to_id: 'u-6',
    start_date: '2026-05-06',
    end_date: '2026-05-14',
    duration_days: 9,
    progress: 100,
    status: 'COMPLETADA',
    depends_on_id: 'act-1'
  },
  {
    id: 'act-3',
    project_id: 'proj-1',
    sprint_id: 'sprint-2',
    name: 'Fase 3: Kanban Integrado & UI de Sprints',
    description: 'Habilitar interfaz de control ágil con asignación veloz de sprints.',
    assigned_to_id: 'u-6',
    start_date: '2026-05-15',
    end_date: '2026-05-24',
    duration_days: 10,
    progress: 75,
    status: 'EN_CURSO',
    depends_on_id: 'act-2'
  },
  {
    id: 'act-4',
    project_id: 'proj-1',
    sprint_id: 'sprint-2',
    name: 'Fase 4: Configuración de Presupuestos & Alertas',
    description: 'Integrar los costos por fases y mostrar gráficos Reales vs Estimados.',
    assigned_to_id: 'u-2',
    start_date: '2026-05-20',
    end_date: '2026-05-28',
    duration_days: 9,
    progress: 40,
    status: 'EN_CURSO',
    depends_on_id: 'act-3'
  },
  {
    id: 'act-5',
    project_id: 'proj-1',
    sprint_id: 'sprint-3',
    name: 'Fase 5: Suite QA automatizada',
    description: 'Enlazar suites de pruebas al backlog para garantizar trazabilidad.',
    assigned_to_id: 'u-5',
    start_date: '2026-05-29',
    end_date: '2026-06-05',
    duration_days: 8,
    progress: 10,
    status: 'PENDIENTE',
    depends_on_id: 'act-3'
  },
  {
    id: 'act-6',
    project_id: 'proj-1',
    sprint_id: 'sprint-3',
    name: 'Fase 6: Despliegue DevOps y Docker Compose',
    description: 'Puesta en marcha con proxy Gateway Nginx y variables de producción.',
    assigned_to_id: 'u-6',
    start_date: '2026-06-06',
    end_date: '2026-06-12',
    duration_days: 7,
    progress: 0,
    status: 'PENDIENTE',
    depends_on_id: 'act-5'
  }
];

export const INITIAL_TEST_SUITES: TestSuite[] = [
  {
    id: 'suite-1',
    project_id: 'proj-1',
    name: 'Suite 01: Seguridad / Control Multi-tenant'
  },
  {
    id: 'suite-2',
    project_id: 'proj-1',
    name: 'Suite 02: Kanban Reglas de Negocio'
  }
];

export const INITIAL_TEST_CASES: TestCase[] = [
  {
    id: 'case-1',
    suite_id: 'suite-1',
    work_item_id: 'item-1',
    title: 'Validación de multi-tenant usando organizationId en SELECT',
    steps: [
      'Iniciar sesión con usuario de Organización A',
      'Ejecutar petición HTTP a GET /api/projects',
      'Verificar que ningún id de proyecto de la Organización B es retornado'
    ],
    expected: 'Status 200 y filtrado estricto por organization_id',
    status: 'PASSED'
  },
  {
    id: 'case-2',
    suite_id: 'suite-2',
    work_item_id: 'item-3',
    title: 'Mover historia del Backlog al Sprint - Asegurar estado "Por Hacer"',
    steps: [
      'Arrastrar HU00003 fuera del panel de Product Backlog hacia el panel del Sprint Activo',
      'Verificar el campo status en el work_item modificado'
    ],
    expected: 'El estado cambia automáticamente de BACKLOG a POR_HACER',
    status: 'PASSED'
  },
  {
    id: 'case-3',
    suite_id: 'suite-2',
    work_item_id: 'item-3',
    title: 'Regla de Sprint: Sprint vacío o solo "Por Hacer" queda "No Iniciado"',
    steps: [
      'Crear un nuevo Sprint vacío',
      'Asignarle un ítem en estado POR_HACER',
      'Verificar el estado general calculado del Sprint'
    ],
    expected: 'El sprint tiene estado NO_INICIADO',
    status: 'PENDING'
  },
  {
    id: 'case-4',
    suite_id: 'suite-2',
    work_item_id: 'item-t2',
    title: 'Regla de Negocio: Restringir movimiento libre sin rol asignado',
    steps: [
      'Tratar de cambiar una tarea asignada a un usuario diferente sin permisos',
      'Verificar bloqueo de interfaz o rechazo de operación'
    ],
    expected: 'Reversión automática de la tarjeta y notificación visual de error',
    status: 'FAILED'
  }
];

export const INITIAL_TEST_RUNS: TestRun[] = [
  {
    id: 'run-1',
    test_case_id: 'case-1',
    executed_by_id: 'u-5',
    status: 'PASSED',
    evidence: 'Log de consultas Postgres incluye WHERE organization_id = $1 de forma nativa.',
    notes: 'Prueba completada con éxito en contenedor local dba-postgres-1.',
    executed_at: '2026-05-18T10:00:00Z'
  },
  {
    id: 'run-2',
    test_case_id: 'case-4',
    executed_by_id: 'u-5',
    status: 'FAILED',
    evidence: 'La UI no revirtió la tarjeta al arrastrarla de vuelta. Se quedó flotando entre columnas.',
    notes: 'Se requiere revisar las validaciones del evento onDragEnd.',
    executed_at: '2026-05-22T15:30:00Z'
  }
];

export const INITIAL_MOCKUPS: Mockup[] = [
  {
    id: 'mock-1',
    project_id: 'proj-1',
    name: 'Dashboard Administrativo Multi-Fase',
    type: 'WEB',
    status: 'BORRADOR',
    description: 'Prototipo interactivo de la pantalla de bienvenida con KPIs y Costos.',
    canvas_width: 800,
    canvas_height: 500
  }
];

export const INITIAL_MOCKUP_SCREENS: MockupScreen[] = [
  {
    id: 'screen-1',
    mockup_id: 'mock-1',
    name: 'Escritorio de Control (Main View)',
    description: 'Pantalla principal que muestra el resumen financiero y Scrum del proyecto.',
    color: '#1e293b', // slate-800
    x: 40,
    y: 50
  },
  {
    id: 'screen-2',
    mockup_id: 'mock-1',
    name: 'Detalle de Costos por Hito (Drill Down)',
    description: 'Diálogo modal que despliega costos de Nómina y DevOps por fases.',
    color: '#0f172a', // slate-900
    x: 460,
    y: 120
  }
];

export const INITIAL_MOCKUP_COMPONENTS: MockupComponent[] = [
  // Components for Screen 1
  {
    id: 'comp-1',
    screen_id: 'screen-1',
    mockup_id: 'mock-1',
    type: 'CARD',
    label: 'KPI: Desviación Presupuestaria',
    helper: 'Efectivo: +/- 3.5% bajo lo estimado',
    color: '#3b82f6', // blue
    text_color: '#ffffff',
    x: 20,
    y: 30,
    width: 160,
    height: 90
  },
  {
    id: 'comp-2',
    screen_id: 'screen-1',
    mockup_id: 'mock-1',
    type: 'CARD',
    label: 'Sprint Active Burn-Down',
    helper: '8 items completados / 3 pendientes',
    color: '#10b981', // green
    text_color: '#ffffff',
    x: 190,
    y: 30,
    width: 160,
    height: 90
  },
  {
    id: 'comp-3',
    screen_id: 'screen-1',
    mockup_id: 'mock-1',
    type: 'BUTTON',
    label: 'Ver Fases (Gantt Direct)',
    helper: 'Acción para abrir Línea de tiempo',
    color: '#f59e0b', // amber
    text_color: '#ffffff',
    x: 20,
    y: 140,
    width: 150,
    height: 40
  },
  {
    id: 'comp-4',
    screen_id: 'screen-1',
    mockup_id: 'mock-1',
    type: 'INPUT',
    label: 'Filtrar por Fase',
    helper: 'Ej. Sprint 1, Nomina',
    color: '#334155', // slate-700
    text_color: '#cbd5e1',
    x: 190,
    y: 140,
    width: 160,
    height: 40
  },

  // Components for Screen 2
  {
    id: 'comp-5',
    screen_id: 'screen-2',
    mockup_id: 'mock-1',
    type: 'TEXT',
    label: 'Presupuesto Fase 2: $15,400',
    helper: 'Auditoría Externa QA en curso',
    color: '#0f172a',
    text_color: '#f8fafc',
    x: 20,
    y: 30,
    width: 260,
    height: 60
  },
  {
    id: 'comp-6',
    screen_id: 'screen-2',
    mockup_id: 'mock-1',
    type: 'BUTTON',
    label: 'Cerrar Modal',
    helper: 'Volver al dashboard',
    color: '#ef4444', // red
    text_color: '#ffffff',
    x: 20,
    y: 110,
    width: 120,
    height: 35
  }
];

export const INITIAL_MOCKUP_CONNECTIONS: MockupConnection[] = [
  {
    id: 'conn-1',
    mockup_id: 'mock-1',
    from_node_id: 'comp-3', // Button
    to_node_id: 'screen-2', // To screen 2 modal
    label: 'Abre desglose de fase'
  }
];

export const INITIAL_GITHUB_CONNECTION: GitHubConnection = {
  id: 'git-conn-1',
  project_id: 'proj-1',
  repository: 'github.com/proyectos-corp/project-agile-saas',
  branch: 'main',
  webhook_active: true
};

export const INITIAL_COMMITS: GitCommit[] = [
  {
    id: 'c-1',
    author: 'Andrés Mendoza',
    message: 'feat(dba): add postgresql DDL tables and composite index unique definitions',
    branch: 'main',
    hash: 'aef783b',
    timestamp: '2026-05-24T18:32:00Z'
  },
  {
    id: 'c-2',
    author: 'Valentina Rojas',
    message: 'test(qa): add multi-tenant assertion and mockup drag test cases',
    branch: 'release-1.0',
    hash: '7cd5a14',
    timestamp: '2026-05-25T14:15:00Z'
  },
  {
    id: 'c-3',
    author: 'Andrés Mendoza',
    message: 'fix(gantt): solve date offset boundary in finishes dependency link',
    branch: 'main',
    hash: '410abf2',
    timestamp: '2026-05-26T21:10:00Z'
  }
];

export const INITIAL_PRS: PullRequest[] = [
  {
    id: 'pr-1',
    number: 142,
    title: 'Integrate dynamic interactive Mockup Canvas using SVG and local coordinates',
    author: 'Andrés Mendoza',
    status: 'OPEN',
    created_at: '2026-05-26T09:00:00Z'
  },
  {
    id: 'pr-2',
    number: 140,
    title: 'QA automated test suite integration panel + visual logs',
    author: 'Valentina Rojas',
    status: 'MERGED',
    created_at: '2026-05-24T11:20:00Z'
  }
];

export const DEFAULT_TRANSITION_RULES: TransitionRule[] = [
  { id: 'no_iniciados_prioridad', name: 'Prioridad estipulada', desc: 'La historia debe tener prioridad estipulada.', category: 'No Iniciado', targetCol: 'NO_INICIADO', enabled: true },
  { id: 'no_iniciados_responsable', name: 'Responsable técnico asignado', desc: 'Debe asignarse un responsable técnico/funcional.', category: 'No Iniciado', targetCol: 'NO_INICIADO', enabled: true },
  
  { id: 'en_analisis_descripcion', name: 'Descripción clara', desc: 'Debe registrarse una descripción clara o analítica del requerimiento (>10 carac.).', category: 'En Análisis', targetCol: 'EN_ANALISIS', enabled: true },
  { id: 'en_analisis_responsable', name: 'Responsable técnico asignado', desc: 'Responsable técnico/funcional no asignado.', category: 'En Análisis', targetCol: 'EN_ANALISIS', enabled: true },
  
  { id: 'en_desarrollo_criteria', name: 'Criterios de Aceptación (DOR)', desc: 'DOR: Debe registrarse por lo menos 1 Criterio de Aceptación.', category: 'En Desarrollo', targetCol: 'EN_DESARROLLO', enabled: true },
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

