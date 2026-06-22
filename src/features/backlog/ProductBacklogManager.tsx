import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  Plus, 
  Trash2, 
  AlertTriangle, 
  CheckCircle, 
  CheckSquare, 
  Clock, 
  FileText, 
  MessageSquare, 
  Paperclip, 
  Search, 
  Sparkles, 
  TrendingUp, 
  Users, 
  ChevronRight, 
  ChevronDown, 
  Sliders, 
  FolderMinus, 
  Play, 
  Calendar, 
  Download,
  Info,
  Lock,
  Unlock,
  Eye,
  Check,
  Shield,
  HelpCircle,
  Edit2
} from 'lucide-react';
import jsPDF from 'jspdf';

// --- Roles definition ---
export type BacklogRole = 'ADMIN_PMO' | 'PROJECT_MANAGER' | 'PRODUCT_OWNER' | 'DEVELOPER' | 'QA_TESTER' | 'CONSULTA';

// --- Extended Data Models ---
export interface Epic {
  id: string;
  project_id: string;
  code: string;
  name: string;
  description: string;
  priority: 'Baja' | 'Media' | 'Alta' | 'Crítica';
  status: 'Borrador' | 'En ejecución' | 'Completada';
}

export type StoryType = 'Funcional' | 'Técnica' | 'Bug' | 'Mejora' | 'Spike' | 'Integración' | 'Reporte';
export type StoryPriority = 'Alta' | 'Media' | 'Baja' | 'Crítica';
export type StoryStatus = 
  | 'Borrador' 
  | 'En refinamiento' 
  | 'Ready' 
  | 'En desarrollo' 
  | 'En pruebas internas' 
  | 'En validación usuario' 
  | 'Aprobada' 
  | 'Cerrada' 
  | 'Bloqueada' 
  | 'Rechazada' 
  | 'Cancelada';

export interface AcceptanceCriterion {
  id: string;
  number: number;
  description: string;
  type: 'Funcional' | 'Validación' | 'Cálculo' | 'Integración' | 'Seguridad' | 'Reporte';
  expectedResult: string;
  status: 'Pendiente' | 'Cumple' | 'No cumple' | 'No aplica';
  validatedBy?: string;
  validatedAt?: string;
  evidenceId?: string;
  comment?: string;
}

export interface TechnicalCriteria {
  description: string;
  component: string;
  databaseObject: string;
  api: string;
  integration: string;
  securityRule: string;
  performanceExpected: string;
  auditConsideration: string;
  logsRequired: string;
  technicalDependency: string;
  technicalOwnerId: string;
}

export interface StoryDependency {
  id: string;
  targetStoryId: string;
  dependencyType: 'Bloquea' | 'Depende de' | 'Relacionada con' | 'Duplica' | 'Es parte de' | 'Requiere integración con';
  description: string;
}

export interface StoryComment {
  id: string;
  text: string;
  userId: string;
  userName: string;
  userRole: string;
  timestamp: string;
  type: 'General' | 'Técnico' | 'Funcional' | 'Bloqueo' | 'Validación' | 'Cambio de alcance';
}

export interface StoryAttachment {
  id: string;
  fileName: string;
  fileType: string;
  fileUrl: string;
  uploadedBy: string;
  uploadedAt: string;
  criterionId?: string; // Relation to accept criterion
}

export interface UserStory {
  id: string;
  project_id: string;
  epic_id?: string;
  sprint_id?: string;
  code: string; // HU-00000
  title: string;
  // Como / Quiero / Para
  role: string;
  want: string;
  benefit: string;
  huUnified?: string;
  description: string;
  type: StoryType;
  priority: StoryPriority;
  status: StoryStatus;
  
  // Prioritization score
  businessValue: number; // 1-5
  risk: number; // 1-5
  urgency: number; // 1-5
  moscow: 'Must' | 'Should' | 'Could' | 'Won’t';
  backlogOrder: number;

  // Estimates
  storyPoints: number; // 1, 2, 3, 5, 8, 13, 21
  estimatedHours?: number;
  complexity: 'Baja' | 'Media' | 'Alta';
  uncertainty: 'Baja' | 'Media' | 'Alta';
  functionalOwnerId?: string;
  technicalOwnerId?: string;
  requesterId?: string;
  company: string;
  branch?: string;

  // Dates
  createdAt: string;
  startDate?: string;
  dueDate?: string; // Compromiso
  endDate?: string; // Cierre

  // Blocking Info
  blockedReason?: string;
  unblockResponsible?: string;
  unblockTargetDate?: string;

  // Checklists (Ready & Done)
  dorChecklist: Record<string, boolean>;
  dodChecklist: Record<string, boolean>;

  // Substructures
  acceptanceCriteria: AcceptanceCriterion[];
  technicalCriteria?: TechnicalCriteria;
  dependencies: StoryDependency[];
  comments: StoryComment[];
  attachments: StoryAttachment[];
  history: {
    field: string;
    oldVal: string;
    newVal: string;
    by: string;
    at: string;
  }[];
}

// Default checklists to instantiate
const DEFAULT_DOR_ITEMS = [
  'Objetivo claro definido',
  'Descripción Como/Quiero/Para especificada',
  'Criterios de aceptación registrados',
  'Criterios técnicos identificados',
  'Prioridad de negocio definida',
  'Responsable funcional asignado',
  'Dependencias identificadas',
  'Datos de prueba o ejemplos disponibles',
  'Reglas de negocio documentadas',
  'Estimación de Story Points completada'
];

const DEFAULT_DOD_ITEMS = [
  'Desarrollo de código finalizado',
  'Pruebas unitarias ejecutadas',
  'Pruebas funcionales validadas',
  'Criterios de aceptación cumplidos',
  'Evidencia de prueba adjunta',
  'Documentación técnica actualizada',
  'Código revisado (Peer Review)',
  'Despliegue realizado en ambiente QA',
  'Aprobación firmada por el PO/Sponsor',
  'Sin bugs críticos abiertos'
];

interface ProductBacklogManagerProps {
  selectedProjectId: string;
  setSelectedProjectId: (id: string) => void;
  projects: any[];
  users: any[];
  sprints: any[];
  setSprints?: React.Dispatch<React.SetStateAction<any[]>>;
  onSprintUpdate?: () => void;
  addLog: (user: string, action: string) => void;
  workItems?: any[];
  setWorkItems?: React.Dispatch<React.SetStateAction<any[]>>;
}

export default function ProductBacklogManager({
  selectedProjectId,
  setSelectedProjectId,
  projects,
  users,
  sprints,
  setSprints,
  addLog,
  workItems,
  setWorkItems
}: ProductBacklogManagerProps) {
  
  // --- Simulating Roles ---
  const [currentRole, setCurrentRole] = useState<BacklogRole>('ADMIN_PMO');
  
  // Custom dialog to bypass iframe window.confirm blocks
  const [deleteConfirmState, setDeleteConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);
  
  // --- Persistent Local States ---
  const [stories, setStories] = useState<UserStory[]>(() => {
    const cached = localStorage.getItem('backlog_stories_advanced');
    if (cached && cached !== "undefined" && cached !== "null") {
      try {
        const parsed = JSON.parse(cached);
        if (parsed !== null && parsed !== undefined) return parsed;
      } catch (e) {
        console.error("Failed to parse stories", e);
      }
    }
    return [];
  });

  const [epics, setEpics] = useState<Epic[]>(() => {
    const cached = localStorage.getItem('backlog_epics');
    if (cached && cached !== "undefined" && cached !== "null") {
      try {
        const parsed = JSON.parse(cached);
        if (parsed !== null && parsed !== undefined) return parsed;
      } catch (e) {
        console.error("Failed to parse epics", e);
      }
    }
    return [
      {
        id: 'ep-1',
        project_id: 'proj-1',
        code: 'EPC-01',
        name: 'Forecast y demanda de Maquinaria',
        description: 'Módulo enfocado en predecir y planificar la asignación de materias primas estructurales para maquinaria.',
        priority: 'Alta',
        status: 'En ejecución'
      },
      {
        id: 'ep-2',
        project_id: 'proj-1',
        code: 'EPC-02',
        name: 'Portal de Compra Logística',
        description: 'Automatización y tracking de coberturas con transportadoras según Lead Time.',
        priority: 'Alta',
        status: 'Borrador'
      }
    ];
  });

  // --- UI/Tab management ---
  const [backlogSubTab, setBacklogSubTab] = useState<'dashboard' | 'list' | 'epics' | 'sprints'>('list');
  
  // --- Sprint creation and association states ---
  const [backlogSelectedSprintId, setBacklogSelectedSprintId] = useState<string>('');
  const [newSprintName, setNewSprintName] = useState<string>('');
  const [newSprintGoal, setNewSprintGoal] = useState<string>('');
  const [newSprintStartDate, setNewSprintStartDate] = useState<string>('2026-06-12');
  const [newSprintEndDate, setNewSprintEndDate] = useState<string>('2026-06-25');
  const [newSprintCapacity, setNewSprintCapacity] = useState<number>(35);
  const [newSprintVelocity, setNewSprintVelocity] = useState<number>(30);
  const [newSprintStatus, setNewSprintStatus] = useState<string>('NO_INICIADO');

  // Synchronize default selected sprint when project or sprints list changes
  useEffect(() => {
    const projectSprints = sprints.filter(s => s.project_id === selectedProjectId);
    if (projectSprints.length > 0) {
      // Keep existing selection if still valid for this project, otherwise pick first
      const exists = projectSprints.some(s => s.id === backlogSelectedSprintId);
      if (!exists) {
        setBacklogSelectedSprintId(projectSprints[0].id);
      }
    } else {
      setBacklogSelectedSprintId('');
    }
  }, [selectedProjectId, sprints]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterResponsible, setFilterResponsible] = useState<string>('all');
  const [filterEpic, setFilterEpic] = useState<string>('all');
  const [filterSprint, setFilterSprint] = useState<string>('all');
  const [collapsedGroups, setCollapsedGroups] = useState<{[key: string]: boolean}>({});

  const toggleGroup = (groupId: string, defaultValue: boolean) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [groupId]: !(prev[groupId] !== undefined ? prev[groupId] : defaultValue)
    }));
  };

  // --- Selection and Modals ---
  const [selectedStoryId, setSelectedStoryId] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isStoryFormOpen, setIsStoryFormOpen] = useState(false);
  const [isEpicFormOpen, setIsEpicFormOpen] = useState(false);

  // --- Sprint Edit Dialog States ---
  const [isEditSprintModalOpen, setIsEditSprintModalOpen] = useState(false);
  const [isCreateSprintModalOpen, setIsCreateSprintModalOpen] = useState(false);
  const [editSprintId, setEditSprintId] = useState('');
  const [editSprintName, setEditSprintName] = useState('');
  const [editSprintGoal, setEditSprintGoal] = useState('');
  const [editSprintStartDate, setEditSprintStartDate] = useState('');
  const [editSprintEndDate, setEditSprintEndDate] = useState('');
  const [editSprintCapacity, setEditSprintCapacity] = useState<number>(35);
  const [editSprintVelocity, setEditSprintVelocity] = useState<number>(30);
  const [editSprintStatus, setEditSprintStatus] = useState<string>('NO_INICIADO');

  // --- Edit Form State for creation and updates ---
  const [storyForm, setStoryForm] = useState<Partial<UserStory>>({});
  const [epicForm, setEpicForm] = useState<Partial<Epic>>({});
  
  // Detail Modal tab
  const [detailTab, setDetailTab] = useState<'general' | 'accept' | 'trace'>('general');
  const [isDragOver, setIsDragOver] = useState(false);
  const [previewAttachment, setPreviewAttachment] = useState<StoryAttachment | null>(null);
  const [confirmDeleteCritIdx, setConfirmDeleteCritIdx] = useState<number | null>(null);

  // Backlog link support states
  const [backlogCreateMode, setBacklogCreateMode] = useState<'file' | 'link'>('file');
  const [backlogCreateUrl, setBacklogCreateUrl] = useState('');
  const [backlogDetailMode, setBacklogDetailMode] = useState<'file' | 'link'>('file');
  const [backlogDetailUrl, setBacklogDetailUrl] = useState('');

  // New Comment state
  const [newCommentText, setNewCommentText] = useState('');
  const [newCommentType, setNewCommentType] = useState<StoryComment['type']>('General');

  // New Acceptance Criterion state inside modal
  const [newCritDesc, setNewCritDesc] = useState('');
  const [newCritType, setNewCritType] = useState<AcceptanceCriterion['type']>('Funcional');
  const [newCritExpected, setNewCritExpected] = useState('');

  // Editing existing activity/criterion state
  const [editingCritId, setEditingCritId] = useState<string | null>(null);
  const [editCritDesc, setEditCritDesc] = useState('');
  const [editCritType, setEditCritType] = useState<AcceptanceCriterion['type']>('Funcional');
  const [editCritExpected, setEditCritExpected] = useState('');

  // Save states to local storage
  useEffect(() => {
    localStorage.setItem('backlog_stories_advanced', JSON.stringify(stories));
  }, [stories]);

  // Synchronize backlog stories to the Scrum Board workItems
  useEffect(() => {
    if (!workItems || !setWorkItems) return;

    setWorkItems(prev => {
      // 1. Keep all items that are NOT HISTORIA_USUARIO (e.g. tasks/bugs/subtasks created on Scrum board directly)
      const nonHUs = prev.filter(item => item.type !== 'HISTORIA_USUARIO');

      // Helper status mapper
      const mapStatus = (status: string): 'BACKLOG' | 'POR_HACER' | 'EN_CURSO' | 'QA' | 'FINALIZADO' => {
        switch (status) {
          case 'Borrador':
          case 'En refinamiento':
            return 'BACKLOG';
          case 'Ready':
            return 'POR_HACER';
          case 'En desarrollo':
            return 'EN_CURSO';
          case 'En pruebas internas':
          case 'En validación usuario':
            return 'QA';
          case 'Aprobada':
          case 'Cerrada':
            return 'FINALIZADO';
          default:
            return 'BACKLOG';
        }
      };

      // 2. Map all current backlog user stories to WorkItems
      const mappedHUs = stories.map(story => {
        const existing = prev.find(item => item.id === story.id || item.key === story.code);
        
        return {
          id: story.id,
          project_id: story.project_id,
          sprint_id: story.sprint_id || undefined,
          key: story.code,
          title: story.title,
          description: story.description || '',
          type: 'HISTORIA_USUARIO' as const,
          status: existing ? existing.status : mapStatus(story.status),
          priority: story.priority === 'Alta' || story.priority === 'Crítica' ? 'HIGH' : story.priority === 'Media' ? 'MEDIUM' : 'LOW',
          story_points: story.storyPoints || 0,
          assignee_id: story.technicalOwnerId || story.functionalOwnerId || existing?.assignee_id,
          reporter_id: story.requesterId || existing?.reporter_id,
          created_at: story.createdAt || new Date().toISOString().slice(0, 10),
          parentId: story.epic_id || undefined
        };
      });

      // 3. Merge lists
      return [...nonHUs, ...mappedHUs];
    });
  }, [stories, setWorkItems]);

  useEffect(() => {
    localStorage.setItem('backlog_epics', JSON.stringify(epics));
  }, [epics]);

  // Seed default data if empty
  useEffect(() => {
    if (stories.length === 0) {
      const seeded: UserStory[] = [
        {
          id: 'story-1',
          project_id: 'proj-1',
          epic_id: 'ep-1',
          sprint_id: 'sprint-2',
          code: 'HU-04',
          title: 'Calcular demanda parametrizable de Acero estructural',
          role: 'Planificador de materias primas',
          want: 'visualizar el inventario proyectado por semana según lead times',
          benefit: 'tomar decisiones de compra oportuna con base en coberturas sugeridas',
          description: 'Cálculo algorítmico automatizado que cruza existencias y tránsitos contra órdenes de producción abiertas.',
          type: 'Funcional',
          priority: 'Crítica',
          status: 'Ready',
          businessValue: 5,
          risk: 3,
          urgency: 4,
          moscow: 'Must',
          backlogOrder: 1,
          storyPoints: 8,
          estimatedHours: 40,
          complexity: 'Alta',
          uncertainty: 'Media',
          functionalOwnerId: 'u-2',
          technicalOwnerId: 'u-3',
          requesterId: 'u-2',
          company: 'Corporación Logística S.A.',
          branch: 'Planta Principal',
          createdAt: '2026-05-15',
          startDate: '2026-06-01',
          dueDate: '2026-06-15',
          dorChecklist: DEFAULT_DOR_ITEMS.reduce((acc, curr) => ({ ...acc, [curr]: true }), {}),
          dodChecklist: DEFAULT_DOD_ITEMS.reduce((acc, curr, index) => ({ ...acc, [curr]: index < 3 }), {}),
          acceptanceCriteria: [
            {
              id: 'cr-1',
              number: 1,
              description: 'El sistema debe mostrar el listado de materiales asignados al proveedor seleccionado.',
              type: 'Funcional',
              expectedResult: 'Listado completo sin pérdidas de registros.',
              status: 'Cumple',
              validatedBy: 'SA',
              validatedAt: '2026-06-02'
            },
            {
              id: 'cr-2',
              number: 2,
              description: 'El sistema calcula el inventario final usando la fórmula: Inventario final = Inicial + Tránsito + CD - Estimado.',
              type: 'Cálculo',
              expectedResult: 'Cálculo matemático coincide contra plantilla de Excel.',
              status: 'Pendiente'
            },
            {
              id: 'cr-3',
              number: 3,
              description: 'El campo de inventario final acumulado semanal no debe ser editable bajo ninguna circunstancia.',
              type: 'Seguridad',
              expectedResult: 'Campo readonly con bootstrap grid.',
              status: 'Cumple'
            }
          ],
          technicalCriteria: {
            description: 'El backend debe computar el cálculo para evitar alteraciones.',
            component: 'DemandForecastEngine.ts',
            databaseObject: 'ST_INVENTORY_WEEKLY_PROJECTION',
            api: '/api/v1/projects/proj-1/forecast-steel',
            integration: 'API SAP RFC_INVENTORY_GET',
            securityRule: 'SSL HTTPS TLS1.3 + JWT Token with PMO signature validation',
            performanceExpected: 'Menos de 3 segundos para consultas de hasta 24 semanas consecutivas.',
            auditConsideration: 'Loguear IP del usuario y parámetros introducidos en tabla audit_log.',
            logsRequired: 'INFO logs al iniciar cálculo, ERROR logs con stack trace detallado.',
            technicalDependency: 'SAP Connector Engine v2.4-stable',
            technicalOwnerId: 'u-3'
          },
          dependencies: [],
          comments: [
            {
              id: 'com-1',
              timestamp: '2026-06-02 14:30',
              userName: 'Carlos Pérez',
              userRole: 'Project Manager',
              userId: 'u-2',
              text: 'Se acordó en la mesa metodológica que el Lead Time se alimentará dinámicamente.',
              type: 'Funcional'
            }
          ],
          attachments: [
            {
              id: 'att-1',
              fileName: 'formula-forecast-cobertura.xlsx',
              fileType: 'Excel Spreadsheet',
              fileUrl: '#',
              uploadedBy: 'Carlos Pérez',
              uploadedAt: '2026-06-01'
            }
          ],
          history: [
            {
              field: 'Estado',
              oldVal: 'Borrador',
              newVal: 'En desarrollo',
              by: 'Carlos Pérez',
              at: '2026-06-02 10:00'
            }
          ]
        },
        {
          id: 'story-2',
          project_id: 'proj-1',
          epic_id: 'ep-1',
          sprint_id: 'sprint-2',
          code: 'HU-05',
          title: 'Integración automática con SAP para tránsitos CD',
          role: 'Analista de Compras',
          want: 'obtener las posiciones de compras en tránsito de manera síncrona',
          benefit: 'evitar la carga manual y errores de digitación en el cálculo de inventario',
          description: 'Llamados síncronos a servicios web SOAP de SAP ERP.',
          type: 'Integración',
          priority: 'Alta',
          status: 'En refinamiento',
          businessValue: 4,
          risk: 5,
          urgency: 3,
          moscow: 'Should',
          backlogOrder: 2,
          storyPoints: 13,
          estimatedHours: 60,
          complexity: 'Alta',
          uncertainty: 'Alta',
          functionalOwnerId: 'u-2',
          technicalOwnerId: 'u-4', // No developer yet
          requesterId: 'u-2',
          company: 'Corporación Logística S.A.',
          createdAt: '2026-05-18',
          startDate: '2026-06-12',
          dorChecklist: DEFAULT_DOR_ITEMS.reduce((acc, curr, idx) => ({ ...acc, [curr]: idx < 6 }), {}),
          dodChecklist: DEFAULT_DOD_ITEMS.reduce((acc, curr) => ({ ...acc, [curr]: false }), {}),
          acceptanceCriteria: [],
          dependencies: [
            {
              id: 'dep-1',
              targetStoryId: 'story-1',
              dependencyType: 'Depende de',
              description: 'Requiere la estructura base de parámetros estructurados de la HU-04'
            }
          ],
          comments: [],
          attachments: [],
          history: []
        }
      ];
      setStories(seeded);
    }
  }, [stories]);

  const activeProject = projects.find(p => p.id === selectedProjectId) || projects[0];

  // Helper lists
  const projectEpics = epics.filter(e => e.project_id === selectedProjectId);
  const projectSprints = sprints.filter(s => s.project_id === selectedProjectId);

  // --- Calculate percentage helper ---
  /**
   * Calcula el porcentaje de elementos completados en una lista de validación (DoR o DoD).
   * @param {UserStory} story - La Historia de Usuario a evaluar.
   * @param {'dor' | 'dod'} checklistType - Tipo de lista de verificación a validar (Def. of Ready o Def. of Done).
   * @returns {number} Porcentaje de progreso de 0 a 100.
   */
  const getChecksPercent = (story: UserStory, checklistType: 'dor' | 'dod') => {
    const list = checklistType === 'dor' ? DEFAULT_DOR_ITEMS : DEFAULT_DOD_ITEMS;
    const checks = checklistType === 'dor' ? story.dorChecklist : story.dodChecklist;
    const checkedCount = list.filter(item => checks?.[item] === true).length;
    return list.length > 0 ? Math.round((checkedCount / list.length) * 100) : 0;
  };

  /**
   * Determina el porcentaje de criterios de aceptación funcionales que han sido validados como cumplidos.
   * @param {UserStory} story - La Historia de Usuario bajo análisis.
   * @returns {number} Porcentaje de criterios aprobados (0 a 100).
   */
  const getAcceptanceCriteriaMetPercent = (story: UserStory) => {
    if (story.acceptanceCriteria.length === 0) return 100;
    const met = story.acceptanceCriteria.filter(c => c.status === 'Cumple' || c.status === 'No aplica').length;
    return Math.round((met / story.acceptanceCriteria.length) * 100);
  };

  // --- Transition State Verification and Handling ---
  /**
   * Realiza la transición de estado de una Historia de Usuario (HU). Admite reglas de negocio estrictas
   * de auditoria corporativa, tales como la verificación del Definition of Ready (DoR), Definition of Done (DoD),
   * asignación técnica obligatoria y bloqueos explícitos detallados.
   * @param {UserStory} story - La HU a cambiar de estado.
   * @param {StoryStatus} newStatus - El nuevo estado objetivo de la HU.
   */
  const transitionStoryStatus = (story: UserStory, newStatus: StoryStatus) => {
    // 1. Authorization check based on simulated role
    if (currentRole === 'CONSULTA') {
      alert('⚠️ Error de Permiso: El rol de "Consulta Ejecutiva" solo cuenta con acceso de lectura.');
      return;
    }
    if (newStatus === 'Cerrada' && !['ADMIN_PMO', 'PROJECT_MANAGER', 'PRODUCT_OWNER'].includes(currentRole)) {
      alert('⚠️ Error de Permiso: Solo los roles directivos (Admin PMO, PM, PO) están autorizados a "Cerrar" historias.');
      return;
    }
    if (['Baja', 'Media', 'Alta', 'Crítica'].includes(story.priority) && !['ADMIN_PMO', 'PROJECT_MANAGER', 'PRODUCT_OWNER'].includes(currentRole) && story.priority !== storyForm.priority) {
      alert('⚠️ Error de Permiso: Solo dueños de producto (PO) o Directores PM pueden alterar las prioridades del backlog.');
      return;
    }

    // 2. Business transition rules
    if (newStatus === 'En desarrollo') {
      if (!story.technicalOwnerId) {
        alert('❌ Regla de Estado: El requerimiento no puede avanzar a "En desarrollo" sin un responsable técnico asignado.');
        return;
      }
    }

    if (newStatus === 'En validación usuario') {
      const completedCriterias = story.acceptanceCriteria.every(crit => crit.status === 'Cumple' || crit.status === 'No aplica');
      if (story.acceptanceCriteria.length > 0 && !completedCriterias) {
        alert('❌ Regla de Estado: No puede transicionar a "En validación usuario" sin que TODOS los criterios de aceptación funcionales estén aprobados o no apliquen.');
        return;
      }
    }

    if (newStatus === 'Cerrada') {
      if (story.dependencies.some(dep => {
        const dependent = stories.find(s => s.id === dep.targetStoryId);
        return dependent && dependent.status !== 'Cerrada' && dep.dependencyType === 'Depende de';
      })) {
        alert('❌ Regla de Estado crítica: Existen deudas técnicas o dependencias sin cerrar relacionadas a este requerimiento.');
        return;
      }
    }

    // 3. Handle specific Bloqueada state
    let bReason = story.blockedReason;
    let bResp = story.unblockResponsible;
    let bDate = story.unblockTargetDate;
    if (newStatus === 'Bloqueada') {
      const reason = prompt('Indique el motivo / causa de bloqueo técnico/operacional:');
      if (!reason || reason.trim().length === 0) {
        alert('❌ Es obligatorio documentar el motivo para registrar un bloqueo.');
        return;
      }
      const resp = prompt('¿Quién es el responsable designado del desbloqueo?');
      const targetDate = prompt('Fecha estimada de solución (YYYY-MM-DD):', new Date().toISOString().slice(0, 10));
      
      bReason = reason;
      bResp = resp || 'Sin asignar';
      bDate = targetDate || undefined;
    } else {
      bReason = undefined;
      bResp = undefined;
      bDate = undefined;
    }

    // Apply the update
    const prevStatus = story.status;
    const activeUserName = users.find(u => u.first_name === 'Carlos' || u.role === 'Project Manager')?.first_name || 'Autor';
    
    setStories(prev => prev.map(s => {
      if (s.id === story.id) {
        return {
          ...s,
          status: newStatus,
          blockedReason: bReason,
          unblockResponsible: bResp,
          unblockTargetDate: bDate,
          endDate: newStatus === 'Cerrada' ? new Date().toISOString().slice(0, 10) : s.endDate,
          history: [
            ...s.history,
            {
              field: 'Estado',
              oldVal: prevStatus,
              newVal: newStatus,
              by: `${activeUserName} (${currentRole})`,
              at: new Date().toISOString().replace('T', ' ').slice(0, 16)
            }
          ]
        };
      }
      return s;
    }));

    addLog('Gestor Backlog', `Cambió estado de ${story.code} de ${prevStatus} a ${newStatus} bajo el rol ${currentRole}`);
  };

  // --- Sprint creation and assignment handlers inside product backlog ---
  const handleCreateSprintInBacklog = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentRole === 'CONSULTA') {
      alert('⚠️ No cuenta con privilegios para crear sprints.');
      return;
    }
    if (!newSprintName.trim()) {
      alert('❌ Validación: El nombre del sprint es obligatorio.');
      return;
    }

    const newSp = {
      id: `sprint-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      project_id: selectedProjectId,
      name: newSprintName,
      goal: newSprintGoal,
      start_date: newSprintStartDate,
      end_date: newSprintEndDate,
      status: newSprintStatus as any,
      velocity: newSprintVelocity,
      capacity: newSprintCapacity
    };

    if (setSprints) {
      setSprints(prev => [...prev, newSp]);
    }
    
    setBacklogSelectedSprintId(newSp.id);
    
    // Clear form
    setNewSprintName('');
    setNewSprintGoal('');
    setNewSprintStartDate('2026-06-12');
    setNewSprintEndDate('2026-06-25');
    setNewSprintCapacity(35);
    setNewSprintVelocity(30);
    setNewSprintStatus('NO_INICIADO');
    setIsCreateSprintModalOpen(false);

    addLog('Sofía Ramírez (Scrum Master)', `Creó el Sprint: "${newSp.name}" en el Planificador de Backlog.`);
  };

  const handleOpenEditSprint = () => {
    const sprintToEdit = sprints.find(s => s.id === backlogSelectedSprintId);
    if (!sprintToEdit) return;
    setEditSprintId(sprintToEdit.id);
    setEditSprintName(sprintToEdit.name || '');
    setEditSprintGoal(sprintToEdit.goal || '');
    setEditSprintStartDate(sprintToEdit.start_date || '2026-06-12');
    setEditSprintEndDate(sprintToEdit.end_date || '2026-06-25');
    setEditSprintCapacity(sprintToEdit.capacity || 35);
    setEditSprintVelocity(sprintToEdit.velocity || 30);
    setEditSprintStatus(sprintToEdit.status || 'NO_INICIADO');
    setIsEditSprintModalOpen(true);
  };

  const handleUpdateSprint = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentRole === 'CONSULTA') {
      alert('⚠️ No cuenta con privilegios para modificar sprints.');
      return;
    }
    if (!editSprintName.trim()) {
      alert('❌ Validación: El nombre del sprint es obligatorio.');
      return;
    }

    if (setSprints) {
      setSprints(prev => prev.map(s => {
        if (s.id === editSprintId) {
          return {
            ...s,
            name: editSprintName,
            goal: editSprintGoal,
            start_date: editSprintStartDate,
            end_date: editSprintEndDate,
            capacity: editSprintCapacity,
            velocity: editSprintVelocity,
            status: editSprintStatus as any
          };
        }
        return s;
      }));
    }

    setIsEditSprintModalOpen(false);
    addLog('Sofía Ramírez (Scrum Master)', `Modificó información y metas del Sprint: "${editSprintName}".`);
  };

  const handleAssignStoryToSprint = (storyId: string, sprintId: string) => {
    if (currentRole === 'CONSULTA') {
      alert('⚠️ No cuenta con privilegios para asociar historias.');
      return;
    }
    const targetStory = stories.find(s => s.id === storyId);
    const targetSprint = sprints.find(s => s.id === sprintId);
    if (!targetStory || !targetSprint) return;

    const hasRealSprint = targetStory.sprint_id && sprints.some(sp => sp.id === targetStory.sprint_id);
    if (hasRealSprint && targetStory.sprint_id !== sprintId) {
      const currentSprintName = sprints.find(s => s.id === targetStory.sprint_id)?.name || 'otro Sprint';
      alert(`⚠️ Esta Historia de Usuario (${targetStory.code}) ya está asignada al "${currentSprintName}". Primero debes quitarla de ese Sprint para poder reasignarla.`);
      return;
    }

    setStories(prev => prev.map(s => {
      if (s.id === storyId) {
        return { ...s, sprint_id: sprintId };
      }
      return s;
    }));

    addLog('Sofía Ramírez (Scrum Master)', `Asoció la HU "${targetStory.code}: ${targetStory.title}" al Sprint "${targetSprint.name}".`);
  };

  const handleUnassignStoryFromSprint = (storyId: string) => {
    if (currentRole === 'CONSULTA') {
      alert('⚠️ No cuenta con privilegios para quitar historias del sprint.');
      return;
    }
    const targetStory = stories.find(s => s.id === storyId);
    if (!targetStory) return;

    setStories(prev => prev.map(s => {
      if (s.id === storyId) {
        return { ...s, sprint_id: undefined };
      }
      return s;
    }));

    addLog('Sofía Ramírez (Scrum Master)', `Desvinculó la HU "${targetStory.code}: ${targetStory.title}" de su Sprint asignado.`);
  };

  // --- Create or Update User Story Handler ---
  const handleSaveStory = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentRole === 'CONSULTA') {
      alert('⚠️ No cuenta con privilegios para guardar o editar requerimientos.');
      return;
    }

    if (!storyForm.title) {
      alert('❌ Validación: El título de la historia es obligatorio.');
      return;
    }

    const activeUser = 'Carlos Pérez';

    const rawHU = (storyForm.huUnified || '').trim();
    let parsedRole = '';
    let parsedWant = rawHU;
    let parsedBenefit = '';

    if (rawHU) {
      const matchFull = rawHU.match(/como\s+([\s\S]*?)\s+quiero\s+([\s\S]*?)\s+para\s+([\s\S]*)/i);
      if (matchFull) {
        parsedRole = matchFull[1].trim();
        parsedWant = matchFull[2].trim();
        parsedBenefit = matchFull[3].trim();
      } else {
        const matchSimple = rawHU.match(/como\s+([\s\S]*?)\s+quiero\s+([\s\S]*)/i);
        if (matchSimple) {
          parsedRole = matchSimple[1].trim();
          parsedWant = matchSimple[2].trim();
        }
      }
    }

    // Prepare updated story form with parsed narrative segments
    const finalStoryFormObj = {
      ...storyForm,
      role: parsedRole,
      want: parsedWant,
      benefit: parsedBenefit
    };

    if (finalStoryFormObj.id) {
      const originalStory = stories.find(s => s.id === finalStoryFormObj.id);
      const hasRealSprint = originalStory && originalStory.sprint_id && sprints.some(sp => sp.id === originalStory.sprint_id);
      if (originalStory && hasRealSprint && finalStoryFormObj.sprint_id && finalStoryFormObj.sprint_id !== originalStory.sprint_id) {
        const currentSprintName = sprints.find(s => s.id === originalStory.sprint_id)?.name || 'otro Sprint';
        alert(`⚠️ Esta Historia de Usuario (${originalStory.code}) ya está asignada al "${currentSprintName}". Primero debes quitarla de ese Sprint para poder reasignarla.`);
        return;
      }
    }

    if (finalStoryFormObj.id) {
      // Edit mode
      setStories(prev => prev.map(s => {
        if (s.id === finalStoryFormObj.id) {
          const modHistory = [...s.history];
          
          if (s.priority !== finalStoryFormObj.priority) {
            modHistory.push({
              field: 'Prioridad',
              oldVal: s.priority,
              newVal: finalStoryFormObj.priority || 'Media',
              by: activeUser,
              at: new Date().toISOString().replace('T', ' ').slice(0, 16)
            });
          }

          if (s.sprint_id !== finalStoryFormObj.sprint_id) {
            modHistory.push({
              field: 'Sprint',
              oldVal: s.sprint_id || 'Backlog',
              newVal: finalStoryFormObj.sprint_id || 'Backlog',
              by: activeUser,
              at: new Date().toISOString().replace('T', ' ').slice(0, 16)
            });
          }

          return {
            ...s,
            ...finalStoryFormObj,
            history: modHistory
          } as UserStory;
        }
        return s;
      }));
      addLog(activeUser, `Editó propiedades de la historia de usuario ${finalStoryFormObj.code}`);
    } else {
      // Create mode
      const nextIdNum = stories.length + 42;
      const newStory: UserStory = {
        id: `story-custom-${Date.now()}`,
        project_id: selectedProjectId,
        epic_id: finalStoryFormObj.epic_id || undefined,
        sprint_id: finalStoryFormObj.sprint_id || undefined,
        code: `HU-${nextIdNum}`,
        title: finalStoryFormObj.title,
        role: finalStoryFormObj.role || '',
        want: finalStoryFormObj.want || '',
        benefit: finalStoryFormObj.benefit || '',
        description: finalStoryFormObj.description || '',
        type: finalStoryFormObj.type || 'Funcional',
        priority: finalStoryFormObj.priority || 'Media',
        status: 'Borrador',
        businessValue: Number(finalStoryFormObj.businessValue) || 3,
        risk: Number(finalStoryFormObj.risk) || 3,
        urgency: Number(finalStoryFormObj.urgency) || 3,
        moscow: finalStoryFormObj.moscow || 'Should',
        backlogOrder: stories.length + 1,
        storyPoints: Number(finalStoryFormObj.storyPoints) || 3,
        estimatedHours: finalStoryFormObj.estimatedHours,
        complexity: finalStoryFormObj.complexity || 'Media',
        uncertainty: finalStoryFormObj.uncertainty || 'Media',
        functionalOwnerId: finalStoryFormObj.functionalOwnerId || 'u-2',
        technicalOwnerId: finalStoryFormObj.technicalOwnerId || undefined,
        requesterId: 'u-2',
        company: finalStoryFormObj.company || 'Compañía Principal',
        branch: finalStoryFormObj.branch || '',
        createdAt: new Date().toISOString().slice(0, 10),
        startDate: finalStoryFormObj.startDate || new Date().toISOString().slice(0, 10),
        dueDate: finalStoryFormObj.dueDate || undefined,
        dorChecklist: DEFAULT_DOR_ITEMS.reduce((acc, curr) => ({ ...acc, [curr]: false }), {}),
        dodChecklist: DEFAULT_DOD_ITEMS.reduce((acc, curr) => ({ ...acc, [curr]: false }), {}),
        acceptanceCriteria: finalStoryFormObj.acceptanceCriteria || [],
        dependencies: [],
        comments: [],
        attachments: finalStoryFormObj.attachments || [],
        history: [
          {
            field: 'Creado',
            oldVal: '-',
            newVal: 'Borrador inicial',
            by: activeUser,
            at: new Date().toISOString().replace('T', ' ').slice(0, 16)
          }
        ]
      };

      setStories(prev => [...prev, newStory]);
      addLog(activeUser, `Creó el requerimiento nuevo ${newStory.code}: "${newStory.title}"`);
    }

    setIsStoryFormOpen(false);
    setStoryForm({});
  };

  // Delete handler
  /**
   * Elimina de forma permanente una Historia de Usuario del backlog si el rol actual es Administrador PMO.
   * Cuenta con protección estricta para evitar la pérdida accidental de trazabilidad técnica.
   * @param {string} id - El identificador único de la HU a eliminar.
   * @param {string} code - El código visible de la HU (Ej: HU00003).
   */
  const handleDeleteStory = (id: string, code: string) => {
    if (currentRole === 'CONSULTA') return;
    if (currentRole !== 'ADMIN_PMO') {
      alert('❌ Privilegio denegado: Solo el perfil corporativo "Administrador PMO" tiene autorizado eliminar requerimientos con trazabilidad de auditoría.');
      return;
    }
    setDeleteConfirmState({
      isOpen: true,
      title: 'Confirmar Eliminación',
      message: `¿Está totalmente seguro de ELIMINAR definitivamente la Historia de Usuario ${code}? Esta acción es irreversible.`,
      onConfirm: () => {
        setStories(prev => prev.filter(s => s.id !== id));
        addLog('Administrador PMO', `Eliminó la historia de usuario ${code} del catálogo.`);
        setIsDetailOpen(false);
      }
    });
  };

  // --- Add Epic Handler ---
  const handleSaveEpic = (e: React.FormEvent) => {
    e.preventDefault();
    if (!epicForm.name) return;

    const newEpic: Epic = {
      id: `epic-${Date.now()}`,
      project_id: selectedProjectId,
      code: `EPC-0${epics.length + 1}`,
      name: epicForm.name,
      description: epicForm.description || '',
      priority: epicForm.priority || 'Media',
      status: 'Borrador'
    };

    setEpics(prev => [...prev, newEpic]);
    addLog('Project Manager', `Añadió la Épica ${newEpic.code}: ${newEpic.name}`);
    setIsEpicFormOpen(false);
    setEpicForm({});
  };

  // --- Comments and attachments actions inside modal ---
  const handleAddComment = () => {
    if (!newCommentText.trim() || !selectedStoryId) return;
    const author = users.find(u => u.first_name === 'Carlos' || u.role === 'Project Manager') || users[0];
    
    const comment: StoryComment = {
      id: `com-custom-${Date.now()}`,
      text: newCommentText,
      userId: author.id,
      userName: `${author.first_name || 'Carlos'} ${author.last_name || 'Pérez'}`,
      userRole: author.role || 'Project Manager',
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
      type: newCommentType
    };

    setStories(prev => prev.map(s => {
      if (s.id === selectedStoryId) {
        return {
          ...s,
          comments: [...s.comments, comment]
        };
      }
      return s;
    }));

    setNewCommentText('');
    addLog('Gestor Comentarios', `Agregó comentario de tipo [${newCommentType}] en HU id ${selectedStoryId}`);
  };

  // Attachments drag and drop & direct addition Mock-simulation
  const handleSimulateAttachment = () => {
    if (!selectedStoryId) return;
    const fileOptions = [
      { name: 'diagrama_navegacion_v1.pdf', type: 'Fichero PDF' },
      { name: 'criterios_QA_automatizados.docx', type: 'Word Document' },
      { name: 'captura_excepcion_SAP.png', type: 'Imagen PNG' }
    ];
    const picked = fileOptions[Math.floor(Math.random() * fileOptions.length)];

    const att: StoryAttachment = {
      id: `att-custom-${Date.now()}`,
      fileName: picked.name,
      fileType: picked.type,
      fileUrl: '#',
      uploadedBy: 'Carlos Pérez',
      uploadedAt: new Date().toISOString().slice(0, 10)
    };

    setStories(prev => prev.map(s => {
      if (s.id === selectedStoryId) {
        return {
          ...s,
          attachments: [...s.attachments, att]
        };
      }
      return s;
    }));
    addLog('Gestor Adjuntos', `Simuló la subida exitosa del archivo ${picked.name}`);
  };

  // Dedicated real file drag-and-drop / selector handler
  const handleFileDropOrSelect = (e: React.DragEvent<HTMLDivElement> | React.ChangeEvent<HTMLInputElement>, isCreationForm = false) => {
    if ('preventDefault' in e) e.preventDefault();
    setIsDragOver(false);

    let files: FileList | null = null;
    if ('dataTransfer' in e && e.dataTransfer) {
      files = e.dataTransfer.files;
    } else if ('target' in e && e.target && (e.target as HTMLInputElement).files) {
      files = (e.target as HTMLInputElement).files;
    }

    if (!files || files.length === 0) return;

    // Convert each file to base64 and append
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newAttachment: StoryAttachment = {
          id: `att-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          fileName: file.name,
          fileType: file.type || 'application/octet-stream',
          fileUrl: reader.result as string, // Base64 DataURL
          uploadedBy: 'Carlos Pérez',
          uploadedAt: new Date().toISOString().slice(0, 10)
        };

        // Synchronize with simulated Docker storage (S3 bucket: soporte-pmo-storage: pmo-storage-simulator)
        try {
          const customLocal = localStorage.getItem('gcp_storage_custom_files');
          let custom: any[] = [];
          if (customLocal && customLocal !== "undefined" && customLocal !== "null") {
            try {
              const parsed = JSON.parse(customLocal);
              if (Array.isArray(parsed)) {
                custom = parsed;
              }
            } catch (e) {
              console.error(e);
            }
          }
          
          const sizeStr = file.size > 1024 * 1024 
            ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
            : `${(file.size / 1024).toFixed(0)} KB`;
            
          let cleanKey = `backlog/story_${selectedStoryId || 'new'}/${file.name.trim().replace(/\s+/g, '_').toLowerCase()}`;
          
          const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
          let mime = file.type || 'application/octet-stream';

          const newObject = {
            id: `sim-backlog-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            key: cleanKey,
            name: file.name,
            size: sizeStr,
            url: `http://localhost:9000/soporte-pmo-storage/${cleanKey}`,
            uploadedAt: new Date().toISOString().substring(0, 10),
            type: mime,
            raw_base64: reader.result as string
          };

          custom.push(newObject);
          localStorage.setItem('gcp_storage_custom_files', JSON.stringify(custom));
        } catch (err) {
          console.error("Error syncing story file with simulated storage bucket", err);
        }

        if (isCreationForm) {
          setStoryForm(prev => ({
            ...prev,
            attachments: [...(prev.attachments || []), newAttachment]
          }));
        } else {
          setStories(prev => prev.map(s => {
            if (s.id === selectedStoryId) {
              return {
                ...s,
                attachments: [...(s.attachments || []), newAttachment]
              };
            }
            return s;
          }));
          addLog('Gestor Adjuntos', `Subió con éxito el archivo ${file.name} y lo sincronizó con el Docker de almacenamiento.`);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleBacklogAddLink = (isCreationForm = false) => {
    const urlStr = isCreationForm ? backlogCreateUrl.trim() : backlogDetailUrl.trim();
    if (!urlStr) return;

    if (!urlStr.startsWith('http://') && !urlStr.startsWith('https://')) {
      alert('Por favor proporcione un enlace válido con http:// o https://');
      return;
    }

    const namePart = urlStr.split('/').pop()?.split('?')[0] || 'Enlace externo';
    const isImage = urlStr.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i) != null;

    const newAttachment: StoryAttachment = {
      id: `att-link-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      fileName: namePart,
      fileType: isImage ? 'image/png' : 'application/octet-stream',
      fileUrl: urlStr,
      uploadedBy: 'Carlos Pérez',
      uploadedAt: new Date().toISOString().slice(0, 10)
    };

    if (isCreationForm) {
      setStoryForm(prev => ({
        ...prev,
        attachments: [...(prev.attachments || []), newAttachment]
      }));
      setBacklogCreateUrl('');
      setBacklogCreateMode('file');
    } else {
      if (!selectedStoryId) return;
      setStories(prev => prev.map(s => {
        if (s.id === selectedStoryId) {
          return {
            ...s,
            attachments: [...(s.attachments || []), newAttachment]
          };
        }
        return s;
      }));
      setBacklogDetailUrl('');
      setBacklogDetailMode('file');
      addLog('Gestor Adjuntos', `Vínculo exitoso del enlace externo: ${urlStr}`);
    }

    // Sincronizar en LocalStorage para Docker (soporte-pmo-storage)
    try {
      const customLocal = localStorage.getItem('gcp_storage_custom_files');
      let custom: any[] = [];
      if (customLocal && customLocal !== "undefined" && customLocal !== "null") {
        try {
          const parsed = JSON.parse(customLocal);
          if (Array.isArray(parsed)) {
            custom = parsed;
          }
        } catch (e) {
          console.error(e);
        }
      }
      
      let cleanKey = `backlog/story_${selectedStoryId || 'new'}/${namePart.trim().replace(/\s+/g, '_').toLowerCase()}`;
      const newObject = {
        id: `sim-backlog-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        key: cleanKey,
        name: namePart,
        size: 'Enlace Web',
        url: urlStr,
        uploadedAt: new Date().toISOString().substring(0, 10),
        type: isImage ? 'image/png' : 'text/html'
      };

      custom.push(newObject);
      localStorage.setItem('gcp_storage_custom_files', JSON.stringify(custom));
    } catch (err) {
      console.error("Error writing backlog file to simulated storage", err);
    }
  };

  // --- Add Acceptance Criterion ---
  const handleAddCrit = () => {
    if (!newCritDesc.trim() || !selectedStoryId) return;

    setStories(prev => prev.map(s => {
      if (s.id === selectedStoryId) {
        const nextNum = s.acceptanceCriteria.length + 1;
        const newCriterion: AcceptanceCriterion = {
          id: `crit-custom-${Date.now()}`,
          number: nextNum,
          description: newCritDesc,
          type: newCritType,
          expectedResult: newCritExpected,
          status: 'Pendiente'
        };
        return {
          ...s,
          acceptanceCriteria: [...s.acceptanceCriteria, newCriterion]
        };
      }
      return s;
    }));

    setNewCritDesc('');
    setNewCritExpected('');
  };

  // --- Edit acceptance criterion in story edit form ---
  const handleSaveEditCritInForm = (critId: string) => {
    setStoryForm(prev => {
      const updatedCriteria = (prev.acceptanceCriteria || []).map((cr, idx) => {
        const idToCheck = cr.id || String(idx);
        if (idToCheck === critId) {
          return {
            ...cr,
            description: editCritDesc,
            type: editCritType,
            expectedResult: editCritExpected
          };
        }
        return cr;
      });
      return {
        ...prev,
        acceptanceCriteria: updatedCriteria
      };
    });
    setEditingCritId(null);
  };

  // --- Edit acceptance criterion in direct detail modal ---
  const handleSaveEditCritDirectly = (storyId: string, critId: string) => {
    setStories(prev => prev.map(s => {
      if (s.id === storyId) {
        return {
          ...s,
          acceptanceCriteria: s.acceptanceCriteria.map((cr, idx) => {
            const idToCheck = cr.id || String(idx);
            if (idToCheck === critId) {
              return {
                ...cr,
                description: editCritDesc,
                type: editCritType,
                expectedResult: editCritExpected
              };
            }
            return cr;
          })
        };
      }
      return s;
    }));
    setEditingCritId(null);
  };

  // --- Toggle acceptance criterion status ---
  const toggleCritStatus = (critId: string, status: AcceptanceCriterion['status']) => {
    if (currentRole === 'CONSULTA') return;
    const author = 'Carlos Pérez';

    setStories(prev => prev.map(s => {
      if (s.id === selectedStoryId) {
        return {
          ...s,
          acceptanceCriteria: s.acceptanceCriteria.map(cr => {
            if (cr.id === critId) {
              return {
                ...cr,
                status,
                validatedBy: status === 'Cumple' ? author : undefined,
                validatedAt: status === 'Cumple' ? new Date().toISOString().slice(0, 10) : undefined
              };
            }
            return cr;
          })
        };
      }
      return s;
    }));
  };

  // --- Toggle Checklist Items ---
  const toggleCheckItem = (storyId: string, type: 'dor' | 'dod', item: string) => {
    setStories(prev => prev.map(s => {
      if (s.id === storyId) {
        const targetChecks = type === 'dor' ? { ...s.dorChecklist } : { ...s.dodChecklist };
        targetChecks[item] = !targetChecks[item];
        return {
          ...s,
          [type === 'dor' ? 'dorChecklist' : 'dodChecklist']: targetChecks
        };
      }
      return s;
    }));
  };

  // --- Exporting functions ---
  const exportCVSBacklog = () => {
    // Basic CSV Build
    let content = 'HU,Titulo,Prioridad,Estado,DOR%,DOD%,StoryPoints,Responsable Funcional\r\n';
    stories.filter(s => s.project_id === selectedProjectId).forEach(s => {
      const resp = users.find(u => u.id === s.functionalOwnerId);
      const respName = resp ? `${resp.first_name} ${resp.last_name}` : 'Sin asignar';
      content += `"${s.code}","${s.title.replace(/"/g, '""')}","${s.priority}","${s.status}","${getChecksPercent(s, 'dor')}%","${getChecksPercent(s, 'dod')}%","${s.storyPoints}","${respName}"\r\n`;
    });

    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Backlog_Proyecto_${activeProject.code}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addLog('Carlos Pérez (PM)', 'Exportó archivo de Backlog consolidado para Excel.');
  };

  const exportFichaPDF = (story: UserStory) => {
    const doc = new jsPDF();
    doc.setFillColor(13, 148, 136); // Teal color
    doc.rect(0, 0, 210, 30, 'F');
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.text(`FICHA TÉCNICA - ${story.code}`, 15, 12);
    
    doc.setFontSize(10);
    doc.text(`Proyecto: [${activeProject.code}] ${activeProject.name} | Estado: ${story.status}`, 15, 20);

    doc.setTextColor(50, 50, 50);
    doc.setFontSize(11);
    doc.text('1. Formato Historias de Usuario (HU):', 15, 42);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`COMO: Planificador de materias primas`, 20, 48);
    doc.text(`QUIERO: visualizar el inventario proyectado por semana según lead times`, 20, 54);
    doc.text(`PARA: tomar decisiones de compra oportuna con base en coberturas`, 20, 60);

    doc.setFont('helvetica', 'bold');
    doc.text('2. Estimación y Priorización MoSCoW:', 15, 75);
    doc.setFont('helvetica', 'normal');
    doc.text(`Story Points: ${story.storyPoints}  |  Complejidad: ${story.complexity}  |  Compromiso: ${story.dueDate || 'N/A'}`, 25, 82);

    doc.setFont('helvetica', 'bold');
    doc.text('3. Criterios de Aceptación Funcionales registrados:', 15, 95);
    doc.setFont('helvetica', 'normal');
    let offset = 101;
    story.acceptanceCriteria.forEach(crit => {
      doc.text(`[${crit.status}] Crit #${crit.number}: ${crit.description.substring(0, 60)}`, 20, offset);
      offset += 8;
    });

    doc.save(`Ficha_Backlog_${story.code}.pdf`);
    addLog('Carlos Pérez (PM)', `Exportó la ficha técnica en PDF de la historia ${story.code}`);
  };

  // --- Filtering process ---
  const filteredStories = stories.filter(s => {
    if (s.project_id !== selectedProjectId) return false;
    
    const matchesSearch = searchTerm === '' || 
      s.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      s.code.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesPriority = filterPriority === 'all' || s.priority === filterPriority;
    const matchesStatus = filterStatus === 'all' || s.status === filterStatus;
    const matchesResponsible = filterResponsible === 'all' || s.functionalOwnerId === filterResponsible || s.technicalOwnerId === filterResponsible;
    const matchesEpic = filterEpic === 'all' || s.epic_id === filterEpic;
    const matchesSprint = filterSprint === 'all' || s.sprint_id === filterSprint;

    return matchesSearch && matchesPriority && matchesStatus && matchesResponsible && matchesEpic && matchesSprint;
  });

  const selectedStory = stories.find(s => s.id === selectedStoryId);

  // Metrics calculating
  const metrics = (() => {
    const projStories = stories.filter(s => s.project_id === selectedProjectId);
    const total = projStories.length;
    const ready = projStories.filter(s => s.status === 'Ready' || getChecksPercent(s, 'dor') === 100).length;
    const blocked = projStories.filter(s => s.status === 'Bloqueada').length;
    const closed = projStories.filter(s => s.status === 'Cerrada').length;
    
    // SPs
    const spCommitted = projStories.filter(s => s.sprint_id).reduce((sum, s) => sum + s.storyPoints, 0);
    const spCompleted = projStories.filter(s => s.status === 'Cerrada').reduce((sum, s) => sum + s.storyPoints, 0);

    // Progress
    const totalSP = projStories.reduce((sum, s) => sum + s.storyPoints, 0);
    const completedSP = projStories.filter(s => s.status === 'Cerrada').reduce((sum, s) => sum + s.storyPoints, 0);
    const progressPercent = totalSP > 0 ? Math.round((completedSP / totalSP) * 100) : 0;

    return {
      total,
      ready,
      blocked,
      closed,
      spCommitted,
      spCompleted,
      progressPercent
    };
  })();

  const storyTypesEnum: StoryType[] = ['Funcional', 'Técnica', 'Bug', 'Mejora', 'Spike', 'Integración', 'Reporte'];
  const storyPrioritiesEnum: StoryPriority[] = ['Baja', 'Media', 'Alta', 'Crítica'];
  const storyStatusesEnum: StoryStatus[] = [
    'Borrador', 'En refinamiento', 'Ready'
  ];

  return (
    <div className="space-y-6" id="wbs-product-backlog-manager">
      {/* 1. Simulator and top project bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-teal-500/20 text-teal-400 rounded-xl flex items-center justify-center border border-teal-500/30">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm tracking-wide">Plataforma Avanzada de Backlog & Épicas</h3>
            <p className="text-[11px] text-teal-405/90 mt-1 font-sans font-medium">
              Bandeja Ágil e Historias de Usuario bajo el Estándar PMO Scrum
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 bg-slate-850 px-3 py-1.5 rounded-lg border border-slate-800">
            <span className="text-[10px] text-slate-400 font-bold font-mono">Proyecto:</span>
            <select
              value={selectedProjectId}
              onChange={e => setSelectedProjectId(e.target.value)}
              className="bg-transparent border-none text-xs text-white font-bold cursor-pointer focus:outline-none"
            >
              {projects.map(p => (
                <option key={p.id} value={p.id} className="bg-slate-900 text-white font-sans">
                  [{p.code}] {p.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => {
              setStoryForm({
                project_id: selectedProjectId,
                type: 'Funcional',
                priority: 'Media',
                businessValue: 3,
                risk: 3,
                urgency: 3,
                moscow: 'Should',
                storyPoints: 3,
                complexity: 'Media',
                uncertainty: 'Media',
                role: '',
                want: '',
                benefit: '',
                huUnified: ''
              });
              setIsStoryFormOpen(true);
            }}
            className="bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 transition cursor-pointer shadow-sm ml-auto md:ml-0"
          >
            <Plus className="w-4 h-4" />
            Crear H. Usuario (HU)
          </button>
        </div>
      </div>

      {/* 2. TAB Selector */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setBacklogSubTab('list')}
          className={`px-4 py-2.5 font-bold text-xs border-b-2 transition ${
            backlogSubTab === 'list'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          📋 Matriz de Gestión del Backlog
        </button>
        <button
          onClick={() => setBacklogSubTab('dashboard')}
          className={`px-4 py-2.5 font-bold text-xs border-b-2 transition ${
            backlogSubTab === 'dashboard'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          📊 Dashboard de Métricas
        </button>
        <button
          onClick={() => setBacklogSubTab('epics')}
          className={`px-4 py-2.5 font-bold text-xs border-b-2 transition ${
            backlogSubTab === 'epics'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          🗺️ Catálogo de Épicas ({projectEpics.length})
        </button>
        <button
          onClick={() => setBacklogSubTab('sprints')}
          className={`px-4 py-2.5 font-bold text-xs border-b-2 transition ${
            backlogSubTab === 'sprints'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          🏃‍♂️ Planificador de Sprints ({projectSprints.length})
        </button>
      </div>

      {/* 3. SUBTAB CONTENT Rendering */}
      
      {/* 3A: DASHBOARD SUBTAB */}
      {backlogSubTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Top KPIs widget */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-3xs flex items-center gap-3">
              <div className="w-10 h-10 bg-teal-50 text-teal-600 rounded-lg flex items-center justify-center shrink-0">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider">Demanda Total</span>
                <div className="text-xl font-bold font-mono text-slate-900">{metrics.total} HUs</div>
              </div>
            </div>
            
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-3xs flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center shrink-0">
                <CheckSquare className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider">Cerradas (DoD)</span>
                <div className="text-xl font-bold font-mono text-emerald-600">{metrics.closed} HUs</div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-3xs flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider">Ready (DoR)</span>
                <div className="text-xl font-bold font-mono text-blue-600">{metrics.ready} HUs</div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-3xs flex items-center gap-3">
              <div className="w-10 h-10 bg-red-50 text-red-650 rounded-lg flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider">Bloqueadas</span>
                <div className="text-xl font-bold font-mono text-red-600">{metrics.blocked} HUs</div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-3xs flex items-center gap-3 col-span-2 md:col-span-1">
              <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider">Story Points (SP)</span>
                <div className="text-xs text-slate-500 font-bold">{metrics.spCompleted} de {metrics.spCommitted} pts</div>
              </div>
            </div>
          </div>

          {/* Graphical charts layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-3xs">
              <h4 className="font-bold text-slate-930 text-sm mb-4">Avance Consolidado del Backlog</h4>
              <div className="flex items-center gap-6">
                {/* SVG Radial progress */}
                <div className="relative w-32 h-32 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="64" cy="64" r="50" stroke="#f1f5f9" strokeWidth="12" fill="transparent" />
                    <circle cx="64" cy="64" r="50" stroke="#0d9488" strokeWidth="12" fill="transparent"
                      strokeDasharray="314"
                      strokeDashoffset={314 - (314 * metrics.progressPercent) / 100}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute text-center">
                    <span className="text-2xl font-black font-mono text-slate-900">{metrics.progressPercent}%</span>
                    <span className="block text-[8px] uppercase tracking-widest text-slate-400 font-bold">SPs listos</span>
                  </div>
                </div>
                <div className="text-xs text-slate-500 space-y-2">
                  <p>• Los avances se calculan midiendo los <strong>Story Points</strong> de historias en estado terminadas (Cerrada) frente a los que están comprometidos.</p>
                  <p>• Lead Time de entrega semanal promedio: <strong className="text-slate-800 font-mono">11 días</strong>.</p>
                  <p>• Cycle Time en desarrollo: <strong className="text-slate-800 font-mono">4.5 días</strong>.</p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-3xs">
              <h4 className="font-bold text-slate-930 text-sm mb-4">Métricas de Sprints y Cumplimiento</h4>
              <div className="space-y-3.5">
                {projectSprints.map(sc => {
                  const spItems = stories.filter(s => s.sprint_id === sc.id);
                  const totalSp = spItems.reduce((acc, cr) => acc + cr.storyPoints, 0);
                  const closedSp = spItems.filter(s => s.status === 'Cerrada').reduce((acc, cr) => acc + cr.storyPoints, 0);
                  const percent = totalSp > 0 ? Math.round((closedSp / totalSp) * 100) : 0;
                  return (
                    <div key={sc.id} className="text-xs">
                      <div className="flex justify-between font-bold text-slate-800 mb-1">
                        <span>{sc.name} ({sc.goal?.substring(0, 30)}...)</span>
                        <span className="font-mono">{closedSp}/{totalSp} SPs ({percent}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-teal-600 h-full rounded-full transition-all duration-500" style={{ width: `${percent}%` }}></div>
                      </div>
                    </div>
                  );
                })}
                {projectSprints.length === 0 && <span className="text-slate-400 text-xs block">No hay sprints activos configurados para este proyecto.</span>}
              </div>
            </div>
          </div>

          {/* List of blocked demands layout */}
          <div className="bg-red-50/40 border border-red-150 rounded-2xl p-5">
            <h4 className="font-bold text-red-900 text-sm mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-650" />
              Historias de Usuario Bloqueadas y Plan de Contingencia
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-red-200 text-red-800 font-bold uppercase tracking-wider text-[10px]">
                    <th className="p-2.5">Código HU</th>
                    <th className="p-2.5">Descripción de Desconexión / Bloqueo</th>
                    <th className="p-2.5">Responsable del Destrabe</th>
                    <th className="p-2.5">Fecha Compromiso Destrabe</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-red-100 font-medium text-red-950">
                  {stories.filter(s => s.project_id === selectedProjectId && s.status === 'Bloqueada').map(s => (
                    <tr key={s.id} className="hover:bg-red-100/30">
                      <td className="p-2.5 font-bold font-mono">{s.code}</td>
                      <td className="p-2.5">{s.blockedReason || 'No especificado'}</td>
                      <td className="p-2.5">{s.unblockResponsible || 'Sin designar'}</td>
                      <td className="p-2.5 font-mono">{s.unblockTargetDate || 'Sin programar'}</td>
                    </tr>
                  ))}
                  {stories.filter(s => s.project_id === selectedProjectId && s.status === 'Bloqueada').length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-4 text-center text-red-700 italic">No hay historias de usuario con alarmas o bloqueos técnicos abiertos en este momento.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3B: BACKLOG MANAGEMENT GRID LIST */}
      {backlogSubTab === 'list' && (
        <div className="space-y-4">
          
          {/* Inline filters */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-3xs flex flex-wrap gap-3 items-center justify-between">
            <div className="flex flex-wrap items-center justify-center gap-3 w-full lg:w-auto">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar HU o código..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-800 w-full sm:w-48 outline-none focus:bg-white"
                />
              </div>

              <select
                value={filterPriority}
                onChange={e => setFilterPriority(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 cursor-pointer font-bold"
              >
                <option value="all">Prioridad (Todas)</option>
                {storyPrioritiesEnum.map(pr => <option key={pr} value={pr}>{pr}</option>)}
              </select>

              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 cursor-pointer font-bold"
              >
                <option value="all">Estado (Todos)</option>
                {storyStatusesEnum.map(st => <option key={st} value={st}>{st}</option>)}
              </select>

              <select
                value={filterEpic}
                onChange={e => setFilterEpic(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 cursor-pointer font-bold"
              >
                <option value="all">Épica (Todas)</option>
                {projectEpics.map(ep => <option key={ep.id} value={ep.id}>{ep.code}: {ep.name}</option>)}
              </select>

              <select
                value={filterSprint}
                onChange={e => setFilterSprint(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 cursor-pointer font-bold"
              >
                <option value="all">Sprint (Todos)</option>
                {projectSprints.map(sc => <option key={sc.id} value={sc.id}>{sc.name}</option>)}
              </select>
            </div>

            <button 
              onClick={exportCVSBacklog}
              className="bg-slate-100 hover:bg-slate-200 border border-slate-200 font-bold text-xs text-slate-700 px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition ml-auto"
            >
              <Download className="w-3.5 h-3.5 text-slate-650" />
              Exportar CSV Excel
            </button>
          </div>

          {/* Consolidated WBS-like Hierarchical Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50/80 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="p-3">Código HU</th>
                    <th className="p-3">Título de Requerimiento</th>
                    <th className="p-3 font-mono">Épica</th>
                    <th className="p-3 font-mono">Sprint</th>
                    <th className="p-3">Prioridad</th>
                    <th className="p-3 text-center font-mono">Story Points</th>
                    <th className="p-3">Fnal / Téc Owner</th>
                    <th className="p-3 text-right">Estado Backlog</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150">
                  {(() => {
                    const projectSprints = sprints.filter(s => s.project_id === selectedProjectId);
                    const activeSprints = projectSprints.filter(s => s.status === 'EN_CURSO' || s.status === 'EN_QA');
                    const otherSprints = projectSprints.filter(s => s.status !== 'EN_CURSO' && s.status !== 'EN_QA');

                    const groups: Array<{
                      id: string;
                      name: string;
                      isCompleted: boolean;
                      badgeText: string;
                      badgeStyle: string;
                      stories: UserStory[];
                    }> = [];

                    // 1. Active Sprints
                    activeSprints.forEach(s => {
                      groups.push({
                        id: s.id,
                        name: s.name,
                        isCompleted: false,
                        badgeText: s.status === 'EN_QA' ? 'En Pruebas QA (Activo)' : 'En Ejecución (Activo)',
                        badgeStyle: s.status === 'EN_QA' ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-blue-100 text-blue-800 border-blue-200',
                        stories: filteredStories.filter(st => st.sprint_id === s.id)
                      });
                    });

                    // 2. Backlog without Sprint
                    const noSprintStories = filteredStories.filter(story => {
                      return !story.sprint_id || !projectSprints.some(sp => sp.id === story.sprint_id);
                    });
                    groups.push({
                      id: 'backlog',
                      name: '📦 Product Backlog (Sin asignar a Sprint)',
                      isCompleted: false,
                      badgeText: 'Sin Sprint',
                      badgeStyle: 'bg-slate-150 text-slate-700 border border-slate-200',
                      stories: noSprintStories
                    });

                    // 3. Executed / Completed Sprints
                    const executedSprints = otherSprints.filter(s => s.status === 'FINALIZADO');
                    executedSprints.forEach(s => {
                      groups.push({
                        id: s.id,
                        name: s.name,
                        isCompleted: true, // Contracted static default
                        badgeText: 'Finalizado (Contraído)',
                        badgeStyle: 'bg-slate-200 text-slate-605 text-slate-600 border border-slate-300',
                        stories: filteredStories.filter(st => st.sprint_id === s.id)
                      });
                    });

                    // 4. Future / Planned Sprints (e.g. NO_INICIADO)
                    const futureSprints = otherSprints.filter(s => s.status !== 'FINALIZADO');
                    futureSprints.forEach(s => {
                      groups.push({
                        id: s.id,
                        name: s.name,
                        isCompleted: false,
                        badgeText: 'Planificado',
                        badgeStyle: 'bg-indigo-50 text-indigo-700 border border-indigo-150',
                        stories: filteredStories.filter(st => st.sprint_id === s.id)
                      });
                    });

                    // If filteredStories is totally empty
                    if (filteredStories.length === 0) {
                      return (
                        <tr>
                          <td colSpan={8} className="p-8 text-center text-slate-500 italic">
                            No se encontraron historias de usuario que coincidan con los filtros seleccionados.
                          </td>
                        </tr>
                      );
                    }

                    return groups.map(group => {
                      // Skip rendering empty groups if a specific sprint ID filter is active,
                      // or if they are not the 'backlog' group and contain no stories.
                      if (group.stories.length === 0 && group.id !== 'backlog' && filterSprint !== 'all') {
                        return null;
                      }

                      // Check if collapsed
                      const isCollapsed = collapsedGroups[group.id] !== undefined ? collapsedGroups[group.id] : group.isCompleted;

                      return (
                        <React.Fragment key={group.id}>
                          {/* Segment Group Header Row */}
                          <tr 
                            className="bg-slate-50 border-y border-slate-200/80 cursor-pointer hover:bg-slate-100/85 transition-colors select-none font-sans"
                            onClick={() => toggleGroup(group.id, group.isCompleted)}
                          >
                            <td colSpan={8} className="p-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="p-0.5 hover:bg-slate-200 rounded text-slate-500 transition">
                                    {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                  </span>
                                  <span className={`text-[11px] font-extrabold tracking-tight text-slate-900 ${group.isCompleted ? 'text-slate-500 line-through' : ''}`}>
                                    {group.name}
                                  </span>
                                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full font-mono uppercase tracking-wider ${group.badgeStyle}`}>
                                    {group.badgeText}
                                  </span>
                                </div>
                                <div className="text-[10px] font-medium text-slate-500 font-mono">
                                  {group.stories.length} {group.stories.length === 1 ? 'requerimiento' : 'requerimientos'}
                                </div>
                              </div>
                            </td>
                          </tr>

                          {/* Segment Group Stories Rows */}
                          {!isCollapsed && group.stories.length === 0 && (
                            <tr>
                              <td colSpan={8} className="p-4 text-center text-slate-400 italic bg-slate-50/25">
                                No se tienen requerimientos asignados a este segmento de sprint.
                              </td>
                            </tr>
                          )}

                          {!isCollapsed && group.stories.map(story => {
                            const funcOwner = users.find(u => u.id === story.functionalOwnerId);
                            const techOwner = users.find(u => u.id === story.technicalOwnerId);
                            const storyEpic = epics.find(e => e.id === story.epic_id);
                            const storySprint = sprints.find(s => s.id === story.sprint_id);
                            
                            const dorVal = getChecksPercent(story, 'dor');
                            const dodVal = getChecksPercent(story, 'dod');

                            // Warnings
                            const isOverdue = story.dueDate && new Date(story.dueDate) < new Date() && story.status !== 'Cerrada';
                            const hasOverStoryPoints = story.storyPoints > 13;
                            const hasMissingResponsible = !story.functionalOwnerId && !story.technicalOwnerId;

                            return (
                              <tr 
                                key={story.id} 
                                onDoubleClick={() => {
                                  setSelectedStoryId(story.id);
                                  const initHU = story.role || story.benefit
                                    ? `Como ${story.role || ''} quiero ${story.want || ''} para ${story.benefit || ''}`.trim()
                                    : (story.want || '');
                                  setStoryForm({ ...story, huUnified: initHU });
                                  setDetailTab('general');
                                  setIsDetailOpen(true);
                                }}
                                className="hover:bg-slate-50/60 cursor-pointer transition-all"
                              >
                                <td className="p-3 font-mono font-bold">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-100 text-[10.5px]">
                                      {story.code}
                                    </span>
                                  </div>
                                </td>
                                <td className="p-3 max-w-[200px]">
                                  <div>
                                    <span className="font-bold text-slate-850 block hover:text-teal-600 transition">{story.title}</span>
                                    <span className="text-[10px] text-slate-400 mt-0.5 block truncate max-w-[200px]">
                                      Como {story.role || '...'} quiero {story.want || '...'}
                                    </span>
                                    {/* Warning notifications */}
                                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                                      {isOverdue && (
                                        <span className="inline-flex items-center gap-1 text-[9px] bg-red-50 text-red-700 font-bold px-1.5 rounded border border-red-150 animate-pulse">
                                          <AlertTriangle className="w-2.5 h-2.5" /> Vencida
                                        </span>
                                      )}
                                      {hasOverStoryPoints && (
                                        <span className="inline-flex items-center gap-1 text-[9px] bg-amber-50 text-amber-700 font-bold px-1.5 rounded border border-amber-150">
                                          <AlertTriangle className="w-2.5 h-2.5" /> Est. Mayor a 13 (Dividir)
                                        </span>
                                      )}
                                      {hasMissingResponsible && (
                                        <span className="inline-flex items-center gap-1 text-[9px] bg-indigo-50 text-indigo-700 font-bold px-1.5 rounded border border-indigo-150">
                                          <Info className="w-2.5 h-2.5" /> Sin responsable asignado
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </td>
                                <td className="p-3">
                                  <span className="text-[10.5px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 font-mono">
                                    {storyEpic ? storyEpic.code : '-'}
                                  </span>
                                </td>
                                <td className="p-3">
                                  <span className="text-[10.5px] font-bold text-slate-600 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-150 font-mono">
                                    {storySprint ? (() => {
                                      const match = storySprint.name.match(/\d+/);
                                      return match ? `SPRINT ${match[0]}` : storySprint.name.toUpperCase();
                                    })() : 'Backlog'}
                                  </span>
                                </td>
                                <td className="p-3">
                                  <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-mono font-bold ${
                                    story.priority === 'Crítica' ? 'bg-red-50 text-red-700 border border-red-100' :
                                    story.priority === 'Alta' ? 'bg-amber-50 text-amber-800' : 'bg-slate-100 text-slate-700'
                                  }`}>
                                    {story.priority}
                                  </span>
                                </td>
                                <td className="p-3 text-center font-mono font-bold text-slate-800">
                                  {story.storyPoints} pts
                                </td>
                                <td className="p-3">
                                  <div className="space-y-0.5">
                                    <span className="text-[10px] text-slate-650 block">
                                      👤 F: {funcOwner ? `${funcOwner.first_name} ${funcOwner.last_name.charAt(0)}.` : 'Sin asignar'}
                                    </span>
                                    <span className="text-[10px] text-slate-450 block">
                                      ⚙️ T: {techOwner ? `${techOwner.first_name} ${techOwner.last_name.charAt(0)}.` : 'Sin asignar'}
                                    </span>
                                  </div>
                                </td>
                                <td className="p-3 text-right">
                                  <div className="flex items-center justify-end gap-2.5">
                                    <select
                                      value={story.status}
                                      onChange={e => transitionStoryStatus(story, e.target.value as StoryStatus)}
                                      className={`bg-slate-50 border text-[10px] uppercase rounded-full font-black px-2 py-1 focus:outline-none cursor-pointer ${
                                        story.status === 'Cerrada' ? 'bg-emerald-50 border-emerald-250 text-emerald-800' :
                                        story.status === 'Ready' ? 'bg-indigo-50 border-indigo-250 text-indigo-800' :
                                        story.status === 'En desarrollo' ? 'bg-blue-50 border-blue-250 text-blue-800' :
                                        story.status === 'Bloqueada' ? 'bg-red-55 border-red-250 text-red-800' : 'bg-slate-100 border-slate-200 text-slate-650'
                                      }`}
                                    >
                                      {storyStatusesEnum.map(st => (
                                        <option key={st} value={st}>{st}</option>
                                      ))}
                                    </select>

                                    {currentRole !== 'CONSULTA' && (
                                      <button
                                        type="button"
                                        title="Editar Historia de Usuario"
                                        onClick={(e) => {
                                          e.stopPropagation(); // Evitamos que haga trigger del doubleClick de la fila
                                          const initHU = story.role || story.benefit
                                            ? `Como ${story.role || ''} quiero ${story.want || ''} para ${story.benefit || ''}`.trim()
                                            : (story.want || '');
                                          setStoryForm({ ...story, huUnified: initHU });
                                          setIsStoryFormOpen(true);
                                        }}
                                        className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-slate-100 rounded-lg transition"
                                        id={`edit-story-btn-${story.id}`}
                                      >
                                        <Edit2 className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </React.Fragment>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
            <div className="bg-slate-50 p-3 border-t border-slate-200 text-slate-450 text-[10px] flex justify-between items-center">
              <span>💡 Tip: Haga <strong>Doble clic</strong> sobre cualquier fila para acceder al expediente completo, trazabilidad y criterios de aceptación técnicos.</span>
              <span className="font-bold">Total listados: {filteredStories.length} requerimientos</span>
            </div>
          </div>
        </div>
      )}

      {/* 3C: EPICS tab */}
      {backlogSubTab === 'epics' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-1">
            <div>
              <h4 className="font-bold text-slate-900 text-sm">Épicas de Proyecto</h4>
              <p className="text-xs text-slate-500">Módulos macro que agrupan las historias de usuario bajo alcances de negocio correlacionales.</p>
            </div>
            <button
              onClick={() => {
                setEpicForm({ project_id: selectedProjectId });
                setIsEpicFormOpen(true);
              }}
              className="bg-slate-900 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-3xs"
            >
              <Plus className="w-3.5 h-3.5" />
              Nueva Épica
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {projectEpics.map(ep => {
              const epStories = stories.filter(s => s.epic_id === ep.id);
              const epSP = epStories.reduce((acc, c) => acc + c.storyPoints, 0);
              const closedSP = epStories.filter(s => s.status === 'Cerrada').reduce((acc, c) => acc + c.storyPoints, 0);
              const epProgress = epSP > 0 ? Math.round((closedSP / epSP) * 100) : 0;

              return (
                <div key={ep.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-3xs space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="bg-teal-50 text-teal-800 border border-teal-100 font-mono font-bold text-[10px] px-2 py-0.5 rounded">
                        {ep.code}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[9.5px] uppercase font-bold tracking-tight ${
                        ep.status === 'Completada' ? 'bg-emerald-50 text-emerald-700' :
                        ep.status === 'En ejecución' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-650'
                      }`}>
                        {ep.status}
                      </span>
                    </div>
                    <h5 className="font-bold text-slate-900 text-sm">{ep.name}</h5>
                    <p className="text-xs text-slate-500 mt-1 lines-clamp-3">{ep.description || 'Sin descripción técnica registrada.'}</p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                    <div className="flex justify-between items-center text-slate-400 font-mono">
                      <span>Metríca SP: {closedSP} / {epSP} pts</span>
                      <span>{epStories.length} Historias</span>
                    </div>
                    <div>
                      <div className="flex justify-between text-slate-650 font-bold mb-1">
                        <span>Avance de Módulo</span>
                        <span>{epProgress}%</span>
                      </div>
                      <div className="w-full bg-slate-150 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-teal-600 h-full rounded-full transition-all" style={{ width: `${epProgress}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            {projectEpics.length === 0 && (
              <div className="col-span-2 text-center p-12 bg-white rounded-xl border border-dashed border-slate-300 text-slate-500">
                Aún no existen Épicas registradas para este proyecto de portafolio. ¡Crea una hoy desde el panel!
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3D: SPRINT PLANNER SUBTAB */}
      {backlogSubTab === 'sprints' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Header bar and info */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-3xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h4 className="font-bold text-slate-905 text-sm md:text-base">Planificador Integrado de Sprints</h4>
              <p className="text-xs text-slate-500 mt-1">
                Crea nuevos sprints de manera ágil y asocia historias de usuario (HUs) del backlog para planificar tus entregas.
              </p>
            </div>
            <div className="bg-teal-50 text-teal-800 border border-teal-100 text-[11px] font-bold px-3 py-1.5 rounded-lg font-mono">
              Sesión: Scrum Master / Product Owner Activo
            </div>
          </div>

          {/* Association Workspace container (Full width) */}
          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-3xs space-y-5">
            
            {/* Selector of sprint */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-3 border-b border-slate-100 gap-3">
              <div className="flex items-center flex-wrap gap-2.5">
                <span className="text-xs font-bold text-slate-650 uppercase tracking-widest font-mono">Sprint destino:</span>
                <select
                  value={backlogSelectedSprintId}
                  onChange={e => setBacklogSelectedSprintId(e.target.value)}
                  className="bg-slate-900 text-white font-bold text-xs px-3 py-1.5 rounded-lg border border-slate-800 cursor-pointer outline-none"
                >
                  <option value="">-- Elige un Sprint --</option>
                  {projectSprints.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.status})
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => setIsCreateSprintModalOpen(true)}
                  className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-[11px] px-3.5 py-1.5 rounded-lg transition duration-150 shrink-0 cursor-pointer flex items-center gap-1.5 shadow-3xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Crear Sprint</span>
                </button>

                {backlogSelectedSprintId && (
                  <button
                    type="button"
                    onClick={handleOpenEditSprint}
                    title="Editar metadatos, objetivos y capacidad del Sprint seleccionado"
                    className="bg-amber-50 hover:bg-amber-200 text-amber-800 border border-amber-200 font-bold text-[11px] px-3.5 py-1.5 rounded-lg transition duration-150 shrink-0 cursor-pointer flex items-center gap-1.5"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-amber-600" />
                    <span>Modificar Sprint</span>
                  </button>
                )}
                </div>

                {backlogSelectedSprintId && (() => {
                  const currentSprintNode = projectSprints.find(s => s.id === backlogSelectedSprintId);
                  if (!currentSprintNode) return null;
                  const sprStories = stories.filter(st => st.project_id === selectedProjectId && st.sprint_id === currentSprintNode.id);
                  const sprCommittedSp = sprStories.reduce((acc, st) => acc + (st.storyPoints || 0), 0);
                  const sprCapacity = currentSprintNode.capacity || 35;
                  const sprPct = Math.min(100, Math.round((sprCommittedSp / sprCapacity) * 100));
                  return (
                    <div className="flex items-center gap-4 text-xs font-mono">
                      <span className="text-[11px] font-bold text-slate-500">
                        Comprometido: <strong className="text-slate-900">{sprCommittedSp} / {sprCapacity} SP</strong> ({sprPct}%)
                      </span>
                      <div className="w-20 bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            sprPct > 100 ? 'bg-red-500' : sprPct > 80 ? 'bg-amber-500' : 'bg-teal-600'
                          }`}
                          style={{ width: `${sprPct}%` }}
                        />
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Association workspace */}
              {!backlogSelectedSprintId ? (
                <div className="text-center py-16 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-slate-500 space-y-2">
                  <Layers className="w-10 h-10 mx-auto text-slate-300 animate-pulse" />
                  <h6 className="font-bold text-slate-700 text-sm">Ningún Sprint Seleccionado</h6>
                  <p className="text-xs max-w-sm mx-auto text-slate-500">
                    Selecciona o crea un Sprint en el panel de la izquierda para ver y gestionar la asignación de historias de usuario.
                  </p>
                </div>
              ) : (() => {
                const currentSprintNode = projectSprints.find(s => s.id === backlogSelectedSprintId);
                if (!currentSprintNode) return null;

                // Backlog Stories of THIS project that are NOT in ANY active sprint (strictly in the product backlog)
                const availableBacklog = stories.filter(st => 
                  st.project_id === selectedProjectId && 
                  (!st.sprint_id || !projectSprints.some(sp => sp.id === st.sprint_id))
                );

                // Stories that ARE in this sprint
                const sprintAssignedStories = stories.filter(st => 
                  st.project_id === selectedProjectId && 
                  st.sprint_id === currentSprintNode.id
                );

                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    
                    {/* AVAILABLE STORIES column */}
                    <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50 flex flex-col h-[400px]">
                      <div className="bg-slate-200/70 border-b border-slate-200 px-3 py-2.5 flex justify-between items-center shrink-0">
                        <div>
                          <h6 className="font-bold text-slate-800 text-[11px] uppercase tracking-wide">
                            Disponibles en Backlog ({availableBacklog.length})
                          </h6>
                          <p className="text-[9.5px] text-slate-500">Asigna historias a este sprint.</p>
                        </div>
                      </div>

                      <div className="p-3 overflow-y-auto space-y-2 flex-grow">
                        {availableBacklog.map(st => {
                          const linkedSprint = sprints.find(s => s.id === st.sprint_id);
                          return (
                            <div 
                              key={st.id} 
                              className="bg-white border border-slate-250 hover:border-slate-350 p-2.5 rounded-lg flex justify-between items-start gap-2 text-xs transition shadow-3xs"
                            >
                              <div className="space-y-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono text-[9px] font-extrabold text-slate-600 bg-slate-100 px-1 rounded">
                                    {st.code}
                                  </span>
                                  <span className="font-bold text-slate-800 text-[11px] truncate block max-w-[140px]">
                                    {st.title}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5 text-[9px] text-slate-500">
                                  <span className="font-mono">SP: {st.storyPoints || 0}</span>
                                  <span>•</span>
                                  <span className={`px-1 rounded ${
                                    st.priority === 'Crítica' || st.priority === 'Alta' ? 'text-red-650 font-bold' : 'text-slate-600'
                                  }`}>
                                    {st.priority}
                                  </span>
                                  {linkedSprint && (
                                    <>
                                      <span>•</span>
                                      <span className="text-amber-700 bg-amber-50 px-1.5 rounded truncate max-w-[80px]" title={`Asignada en ${linkedSprint.name}`}>
                                        En: {linkedSprint.name}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>

                              <button
                                onClick={() => handleAssignStoryToSprint(st.id, currentSprintNode.id)}
                                type="button"
                                className="bg-teal-50 hover:bg-teal-600 hover:text-white text-teal-800 font-bold px-2 py-1 rounded text-[10px] transition shrink-0 cursor-pointer flex items-center gap-0.5 duration-100"
                              >
                                Asignar ➔
                              </button>
                            </div>
                          );
                        })}

                        {availableBacklog.length === 0 && (
                          <div className="text-center py-12 text-slate-400 italic text-[11px]">
                            No quedan historias de usuario disponibles para asignar en este proyecto.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* SPRINT ASSIGNED STORIES column */}
                    <div className="border border-slate-200 rounded-xl overflow-hidden bg-emerald-50/25 flex flex-col h-[400px]">
                      <div className="bg-teal-50 border-b border-teal-100 px-3 py-2.5 flex justify-between items-center shrink-0">
                        <div>
                          <h6 className="font-bold text-teal-900 text-[11px] uppercase tracking-wide flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-teal-600 animate-pulse" />
                            Historias en este Sprint ({sprintAssignedStories.length})
                          </h6>
                          <p className="text-[9.5px] text-teal-800">Compromisos contemplados para el equipo.</p>
                        </div>
                      </div>

                      <div className="p-3 overflow-y-auto space-y-2 flex-grow">
                        {sprintAssignedStories.map(st => (
                          <div 
                            key={st.id} 
                            className="bg-white border border-teal-150 hover:border-teal-250 p-2.5 rounded-lg flex justify-between items-start gap-2 text-xs transition shadow-3xs"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono text-[9px] font-extrabold text-teal-700 bg-teal-50 px-1 rounded">
                                  {st.code}
                                </span>
                                <span className="font-bold text-slate-800 text-[11px] truncate block max-w-[140px]">
                                  {st.title}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 text-[9px] text-slate-500">
                                <span className="font-mono text-teal-850 font-bold">SP: {st.storyPoints || 0}</span>
                                <span>•</span>
                                <span>{st.priority}</span>
                                <span>•</span>
                                <span className="bg-slate-100 px-1 rounded text-slate-600">
                                  {st.status}
                                </span>
                              </div>
                            </div>

                            <button
                              onClick={() => handleUnassignStoryFromSprint(st.id)}
                              type="button"
                              className="bg-red-50 hover:bg-red-550 hover:text-white text-red-700 font-bold px-2 py-1 rounded text-[10px] transition shrink-0 cursor-pointer flex items-center gap-0.5 duration-100"
                            >
                              ✕ Quitar
                            </button>
                          </div>
                        ))}

                        {sprintAssignedStories.length === 0 && (
                          <div className="text-center py-12 text-slate-400 italic text-[11px]">
                            Aún no has asociado ninguna historia de usuario a este Sprint.
                          </div>
                        )}
                      </div>
                    </div>

                  </div>
                );
              })()}
          </div>
        </div>
      )}

      {/* 4. MODALS AND FORMS */}

      {/* 4E: CREATE SPRINT MODAL */}
      {isCreateSprintModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-fadeIn flex flex-col">
            <div className="bg-slate-900 text-white p-5 flex justify-between items-center bg-gradient-to-r from-teal-600 to-teal-700">
              <div>
                <h3 className="font-bold text-sm tracking-wide flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Crear Nuevo Sprint
                </h3>
                <p className="text-[11px] text-teal-100 mt-0.5">Registre metas, fechas, capacidad y estado operacional inicial.</p>
              </div>
              <button 
                onClick={() => setIsCreateSprintModalOpen(false)} 
                className="text-teal-100 hover:text-white transition cursor-pointer font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSprintInBacklog} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Nombre del Sprint *</label>
                <input
                  type="text"
                  required
                  value={newSprintName}
                  onChange={e => setNewSprintName(e.target.value)}
                  placeholder="Ej. Sprint 5 - API de Envío"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Objetivo / Meta del Sprint</label>
                <textarea
                  rows={2}
                  value={newSprintGoal}
                  onChange={e => setNewSprintGoal(e.target.value)}
                  placeholder="Ej. Integrar servicios de tracking y notificaciones push."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none resize-none focus:bg-white focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Fecha de Inicio</label>
                  <input
                    type="date"
                    value={newSprintStartDate}
                    onChange={e => setNewSprintStartDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Fecha de Fin</label>
                  <input
                    type="date"
                    value={newSprintEndDate}
                    onChange={e => setNewSprintEndDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Capacidad (SP) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={newSprintCapacity}
                    onChange={e => setNewSprintCapacity(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Velocidad Requerida</label>
                  <input
                    type="number"
                    min={0}
                    value={newSprintVelocity}
                    onChange={e => setNewSprintVelocity(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Estado Inicial</label>
                <select
                  value={newSprintStatus}
                  onChange={e => setNewSprintStatus(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-xs text-slate-800 outline-none focus:bg-white cursor-pointer"
                >
                  <option value="NO_INICIADO">Planificado (No iniciado)</option>
                  <option value="EN_CURSO">En Curso (Ejecución)</option>
                  <option value="EN_QA">En Pruebas (En QA)</option>
                  <option value="FINALIZADO">Finalizado</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateSprintModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl transition cursor-pointer"
                >
                  Confirmar Registro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4D: EDIT SPRINT MODAL */}
      {isEditSprintModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-fadeIn flex flex-col">
            <div className="bg-slate-900 text-white p-5 flex justify-between items-center bg-gradient-to-r from-amber-600 to-amber-700">
              <div>
                <h3 className="font-bold text-sm tracking-wide flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Modificar Configuración del Sprint
                </h3>
                <p className="text-[11px] text-amber-100 mt-0.5">Modifique metas, fechas, capacidad y estado operacional.</p>
              </div>
              <button 
                onClick={() => setIsEditSprintModalOpen(false)} 
                className="text-amber-100 hover:text-white transition cursor-pointer font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateSprint} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Nombre del Sprint *</label>
                <input
                  type="text"
                  required
                  value={editSprintName}
                  onChange={e => setEditSprintName(e.target.value)}
                  placeholder="Ej. Sprint 5 - API de Envío"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Objetivo / Meta del Sprint</label>
                <textarea
                  rows={2}
                  value={editSprintGoal}
                  onChange={e => setEditSprintGoal(e.target.value)}
                  placeholder="Ej. Integrar servicios de tracking y notificaciones push."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none resize-none focus:bg-white focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Fecha de Inicio</label>
                  <input
                    type="date"
                    value={editSprintStartDate}
                    onChange={e => setEditSprintStartDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Fecha de Fin</label>
                  <input
                    type="date"
                    value={editSprintEndDate}
                    onChange={e => setEditSprintEndDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Capacidad (SP) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={editSprintCapacity}
                    onChange={e => setEditSprintCapacity(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Velocidad Requerida</label>
                  <input
                    type="number"
                    min={0}
                    value={editSprintVelocity}
                    onChange={e => setEditSprintVelocity(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Estado del Sprint</label>
                <select
                  value={editSprintStatus}
                  onChange={e => setEditSprintStatus(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-xs text-slate-800 outline-none focus:bg-white cursor-pointer"
                >
                  <option value="NO_INICIADO">Planificado (No iniciado)</option>
                  <option value="EN_CURSO">En Curso (Ejecución)</option>
                  <option value="EN_QA">En Pruebas (En QA)</option>
                  <option value="FINALIZADO">Finalizado</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditSprintModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl transition cursor-pointer"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4A: NEW STORY MODAL */}
      {isStoryFormOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden animate-fadeIn max-h-[90vh] flex flex-col justify-between">
            <div className="bg-slate-900 text-white p-5 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-sm tracking-wide">
                  {storyForm.id ? `Formulario de Modificación: ${storyForm.code}` : 'Nuevo Registro: Historia de Usuario (HU)'}
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Defina alcances, métricas corporativas, estimaciones de Story Points y dependencias.</p>
              </div>
              <button onClick={() => setIsStoryFormOpen(false)} className="text-slate-400 hover:text-white transition">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveStory} className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Título / Nombre Corto*</label>
                  <input
                    type="text"
                    required
                    value={storyForm.title || ''}
                    onChange={e => setStoryForm(p => ({ ...p, title: e.target.value }))}
                    placeholder="Ej. Parametrizar coberturas de acero"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Épica Relacionada</label>
                  <select
                    value={storyForm.epic_id || ''}
                    onChange={e => setStoryForm(p => ({ ...p, epic_id: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800"
                  >
                    <option value="">(Sin Épica)</option>
                    {projectEpics.map(ep => <option key={ep.id} value={ep.id}>[{ep.code}] {ep.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Tipo de Requerimiento</label>
                  <select
                    value={storyForm.type || 'Funcional'}
                    onChange={e => setStoryForm(p => ({ ...p, type: e.target.value as StoryType }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800"
                  >
                    {storyTypesEnum.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Prioridad Backlog</label>
                  <select
                    value={storyForm.priority || 'Media'}
                    onChange={e => setStoryForm(p => ({ ...p, priority: e.target.value as StoryPriority }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800"
                  >
                    {storyPrioritiesEnum.map(pr => <option key={pr} value={pr}>{pr}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Story Points (Estimación Fibonacci)</label>
                  <select
                    value={storyForm.storyPoints || 3}
                    onChange={e => setStoryForm(p => ({ ...p, storyPoints: Number(e.target.value) }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 font-mono"
                  >
                    <option value="1">1 pt - Súper Simple</option>
                    <option value="2">2 pts - Intermedio</option>
                    <option value="3">3 pts - Normal</option>
                    <option value="5">5 pts - Complejo</option>
                    <option value="8">8 pts - Grande</option>
                    <option value="13">13 pts - Épica / Recomendar dividir</option>
                    <option value="21">21 pts - Descomunal / Crítica</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">MÉTRICA MoSCoW</label>
                  <select
                    value={storyForm.moscow || 'Should'}
                    onChange={e => setStoryForm(p => ({ ...p, moscow: e.target.value as any }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800"
                  >
                    <option value="Must">MUST (Mandatorio para el Core)</option>
                    <option value="Should">SHOULD (Deseable / Añade Valor)</option>
                    <option value="Could">COULD (Opcional si hay holgura)</option>
                    <option value="Won’t">WON’T (Diferido a futuro)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Sprint Relacionado</label>
                  <select
                    value={storyForm.sprint_id || ''}
                    onChange={e => setStoryForm(p => ({ ...p, sprint_id: e.target.value || undefined }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800"
                  >
                    <option value="">(Bolsa de Product Backlog)</option>
                    {projectSprints.map(sc => <option key={sc.id} value={sc.id}>{sc.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Responsable Funcional</label>
                  <select
                    value={storyForm.functionalOwnerId || ''}
                    onChange={e => setStoryForm(p => ({ ...p, functionalOwnerId: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800"
                  >
                    {users.map(u => <option key={u.id} value={u.id}>{u.first_name} {u.last_name} ({u.role})</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Responsable Técnico</label>
                  <select
                    value={storyForm.technicalOwnerId || ''}
                    onChange={e => setStoryForm(p => ({ ...p, technicalOwnerId: e.target.value || undefined }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800"
                  >
                    <option value="">(Sin asignar)</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.first_name} {u.last_name} ({u.role})</option>)}
                  </select>
                </div>


              </div>

              {/* Formato Ágil Unificado: HU */}
              <div className="bg-slate-50 border border-slate-150 rounded-xl p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <h5 className="font-extrabold text-[10.5px] uppercase tracking-wider text-slate-500">Historia de Usuario (HU)</h5>
                  <span className="text-[9px] font-mono bg-teal-50 text-teal-700 px-2 py-0.5 rounded border border-teal-200 font-bold">Campo Unificado</span>
                </div>
                
                <div className="w-full">
                  <label htmlFor="story-hu-textarea" className="block text-[9.5px] font-bold text-teal-800 uppercase mb-1">
                    Descripción del Requerimiento en Formato Estándar Ágil
                  </label>
                  <textarea
                    id="story-hu-textarea"
                    rows={10}
                    placeholder="Escriba aquí la definición completa de la HU. Ejemplo:&#10;&#10;COMO Planificador de compras&#10;QUIERO visualizar el cálculo de la merma semanal en un tablero dinámico&#10;PARA evitar desabastos y programar adecuadamente turnos de mantenimiento."
                    value={storyForm.huUnified || ''}
                    onChange={e => setStoryForm(p => ({ ...p, huUnified: e.target.value }))}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-3 text-xs text-slate-800 focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none leading-relaxed resize-y font-medium min-h-[160px]"
                  />
                  <p className="text-[9.5px] text-slate-400 mt-1.5 font-medium">
                    💡 El sistema procesará el texto automáticamente para extraer y guardar los segmentos estructurados de "Como", "Quiero" y "Para".
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Análisis Detallado / Descripción funcional</label>
                <textarea
                  rows={3}
                  value={storyForm.description || ''}
                  onChange={e => setStoryForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="Detallar validaciones adicionales de base de datos..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none focus:bg-white"
                />
              </div>

              {/* SECTION: ACTIVIDADES (Antes Criterios de Aceptación) */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex justify-between items-center pb-2 border-b">
                  <h5 className="font-extrabold text-[10.5px] uppercase tracking-wider text-slate-650">Actividades Asociadas a la HU</h5>
                  <span className="font-mono text-[9px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-black">
                    {(storyForm.acceptanceCriteria || []).length} Actividades
                  </span>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {(storyForm.acceptanceCriteria || []).map((crit: any, idx: number) => {
                    const isEditingThis = editingCritId === (crit.id || String(idx));
                    return (
                      <div key={crit.id || idx} className="bg-white border rounded p-2.5 flex flex-col gap-2 text-xs">
                        {isEditingThis ? (
                          <div className="space-y-2.5 w-full bg-teal-50/10 p-2 rounded border border-teal-200 animate-fadeIn">
                            <span className="font-extrabold text-teal-850 text-[9px] uppercase">Editando Actividad #{idx + 1}</span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[8.5px] font-bold text-slate-500 uppercase">Descripción de la Actividad</label>
                                <textarea
                                  rows={1}
                                  value={editCritDesc}
                                  onChange={e => {
                                    setEditCritDesc(e.target.value);
                                    e.target.style.height = 'auto';
                                    e.target.style.height = `${e.target.scrollHeight}px`;
                                  }}
                                  style={{ height: editCritDesc ? undefined : 'auto' }}
                                  className="w-full bg-white border border-slate-200 rounded px-2.5 py-1 text-xs outline-none resize-none overflow-hidden min-h-[26px] focus:border-teal-500 font-medium text-slate-800 transition-all"
                                />
                              </div>
                              <div>
                                <label className="block text-[8.5px] font-bold text-slate-500 uppercase">Tipo</label>
                                <select
                                  value={editCritType}
                                  onChange={e => setEditCritType(e.target.value as any)}
                                  className="w-full bg-white border border-slate-200 rounded px-2.5 py-1 text-xs text-slate-850 focus:border-teal-500 font-medium"
                                >
                                  <option value="Funcional">Funcional</option>
                                  <option value="Validación">Validación de Interfaz</option>
                                  <option value="Cálculo">Cálculo Matemático</option>
                                  <option value="Integración">Integración de Gateway</option>
                                  <option value="Seguridad">Seguridad / Criptografía</option>
                                  <option value="Reporte">Reporte de Consultoría</option>
                                </select>
                              </div>
                              <div className="sm:col-span-2">
                                <label className="block text-[8.5px] font-bold text-slate-500 uppercase">Resultado esperado de validación técnica</label>
                                <textarea
                                  rows={1}
                                  value={editCritExpected}
                                  onChange={e => {
                                    setEditCritExpected(e.target.value);
                                    e.target.style.height = 'auto';
                                    e.target.style.height = `${e.target.scrollHeight}px`;
                                  }}
                                  style={{ height: editCritExpected ? 'auto' : undefined }}
                                  className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs outline-none resize-none overflow-hidden min-h-[30px] focus:border-teal-500 transition-all font-medium text-slate-800"
                                />
                              </div>
                            </div>
                            <div className="flex justify-end gap-1.5 pt-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingCritId(null);
                                }}
                                className="bg-slate-200 hover:bg-slate-300 text-slate-750 font-bold px-3 py-1 rounded text-[10px] cursor-pointer transition"
                              >
                                Cancelar
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSaveEditCritInForm(crit.id || String(idx))}
                                className="bg-teal-650 hover:bg-teal-700 text-white font-extrabold px-3 py-1 rounded text-[10px] cursor-pointer transition shadow-2xs"
                              >
                                Guardar Cambios
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex justify-between items-start gap-3 w-full">
                            <div className="space-y-1">
                              <span className="font-black text-teal-750 text-[9px] uppercase">Actividad #{idx + 1} - [{crit.type}]</span>
                              <p className="text-slate-850 font-bold leading-normal">{crit.description}</p>
                              {crit.expectedResult && (
                                <p className="text-[10.5px] text-slate-500 leading-normal">
                                  <strong>Resultado esperado:</strong> {crit.expectedResult}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingCritId(crit.id || String(idx));
                                  setEditCritDesc(crit.description);
                                  setEditCritType(crit.type);
                                  setEditCritExpected(crit.expectedResult || '');
                                }}
                                className="text-teal-600 hover:text-teal-800 hover:bg-teal-50 font-black px-1.5 py-0.5 rounded text-[10px] transition cursor-pointer"
                              >
                                Editar
                              </button>
                              {confirmDeleteCritIdx === idx ? (
                                <div className="flex flex-col items-end gap-1 shrink-0 bg-red-50 p-2 rounded-lg border border-red-200 animate-fadeIn text-right">
                                  <span className="text-[9px] text-red-700 font-extrabold uppercase">¿Remover actividad #{idx + 1}?</span>
                                  <div className="flex gap-1">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setStoryForm(prev => ({
                                          ...prev,
                                          acceptanceCriteria: (prev.acceptanceCriteria || []).filter((_, i) => i !== idx)
                                        }));
                                        setConfirmDeleteCritIdx(null);
                                      }}
                                      className="bg-red-600 hover:bg-red-700 text-white font-black px-2 py-0.5 rounded text-[9px] cursor-pointer shadow-3xs transition"
                                    >
                                      Sí, remover
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setConfirmDeleteCritIdx(null)}
                                      className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold px-2 py-0.5 rounded text-[9px] cursor-pointer transition"
                                    >
                                      No
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteCritIdx(idx)}
                                  className="text-red-500 hover:text-red-700 font-bold px-1.5 py-0.5 rounded text-[10px] hover:bg-red-50 transition cursor-pointer shrink-0"
                                >
                                  Remover
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {(storyForm.acceptanceCriteria || []).length === 0 && (
                    <p className="text-xs text-slate-400 italic text-center py-3">No se han registrado actividades aún para esta Historia de Usuario.</p>
                  )}
                </div>
 
                {/* Formulario rápido para insertar actividades */}
                <div className="bg-white border border-slate-200 rounded-lg p-3 space-y-2.5">
                  <span className="text-[9.5px] font-extrabold text-slate-500 block uppercase tracking-wider">Nueva Actividad para la HU</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[8.5px] font-bold text-slate-400 uppercase">Descripción de la Actividad</label>
                      <textarea
                        id="form-activity-desc"
                        rows={1}
                        placeholder="Ej. Realizar el mapeo de datos de la interfaz..."
                        onChange={e => {
                          e.target.style.height = 'auto';
                          e.target.style.height = `${e.target.scrollHeight}px`;
                        }}
                        className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs outline-none resize-none overflow-hidden min-h-[26px] focus:bg-white focus:border-teal-500 transition-all font-medium text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[8.5px] font-bold text-slate-400 uppercase">Tipo</label>
                      <select
                        id="form-activity-type"
                        className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs text-slate-800"
                      >
                        <option value="Funcional">Funcional</option>
                        <option value="Validación">Validación de Interfaz</option>
                        <option value="Cálculo">Cálculo Matemático</option>
                        <option value="Integración">Integración de Gateway</option>
                        <option value="Seguridad">Seguridad / Criptografía</option>
                        <option value="Reporte">Reporte de Consultoría</option>
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[8.5px] font-bold text-slate-400 uppercase">Resultado esperado</label>
                      <textarea
                        id="form-activity-expected"
                        rows={1}
                        placeholder="Ej. Interfaz cargando listado correcto..."
                        onChange={e => {
                          e.target.style.height = 'auto';
                          e.target.style.height = `${e.target.scrollHeight}px`;
                        }}
                        className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs outline-none resize-none overflow-hidden min-h-[26px] focus:bg-white focus:border-teal-500 transition-all"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const descInput = document.getElementById('form-activity-desc') as HTMLTextAreaElement;
                      const typeSelect = document.getElementById('form-activity-type') as HTMLSelectElement;
                      const expectedInput = document.getElementById('form-activity-expected') as HTMLTextAreaElement;
                      if (!descInput || !descInput.value.trim()) {
                        alert('Por favor ingrese la descripción de la actividad.');
                        return;
                      }
                      const newAct: any = {
                        id: `act-${Date.now()}`,
                        number: (storyForm.acceptanceCriteria || []).length + 1,
                        description: descInput.value.trim(),
                        type: typeSelect.value as any,
                        expectedResult: expectedInput.value.trim(),
                        status: 'Pendiente'
                      };
                      setStoryForm(prev => ({
                        ...prev,
                        acceptanceCriteria: [...(prev.acceptanceCriteria || []), newAct]
                      }));
                      descInput.value = '';
                      descInput.style.height = 'auto'; // Reset height
                      expectedInput.value = '';
                      expectedInput.style.height = 'auto'; // Reset height
                    }}
                    className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-[10px] px-3 py-1 rounded shadow-3xs cursor-pointer transition border border-transparent"
                  >
                    + Agregar Actividad
                  </button>
                </div>
              </div>

              {/* SECTION: IMAGES AND FILES DRAG AND DROP */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <span className="block text-[10px] font-bold uppercase text-slate-500 tracking-wider">Adjuntar Imágenes y Archivos (General)</span>
                
                {/* Tabs */}
                <div className="flex bg-slate-200/50 p-1 rounded-lg gap-1.5">
                  <button
                    type="button"
                    onClick={() => setBacklogCreateMode('file')}
                    className={`flex-1 text-[10.5px] font-bold py-1 rounded transition ${backlogCreateMode === 'file' ? 'bg-white shadow-3xs text-teal-600' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    Archivo Local
                  </button>
                  <button
                    type="button"
                    onClick={() => setBacklogCreateMode('link')}
                    className={`flex-1 text-[10.5px] font-bold py-1 rounded transition ${backlogCreateMode === 'link' ? 'bg-white shadow-3xs text-teal-600' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    Enlace Web (URL)
                  </button>
                </div>

                {backlogCreateMode === 'file' ? (
                  <div 
                    onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                    onDragLeave={() => setIsDragOver(false)}
                    onDrop={(e) => handleFileDropOrSelect(e, true)}
                    className={`border-2 border-dashed rounded-xl p-5 text-center transition cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                      isDragOver ? 'border-teal-500 bg-teal-50/20' : 'border-slate-300 hover:border-teal-500 hover:bg-slate-50'
                    }`}
                    onClick={() => document.getElementById('file-input-creation')?.click()}
                  >
                    <Paperclip className="w-7 h-7 text-slate-400" />
                    <p className="text-xs text-slate-600 font-bold">
                      Arrastra y suelta imágenes o archivos aquí, o <span className="text-teal-600 underline">haz clic para elegir</span>
                    </p>
                    <p className="text-[10px] text-slate-400">Archivos e imágenes se guardan de forma local</p>
                    <input 
                      type="file" 
                      id="file-input-creation" 
                      className="hidden" 
                      multiple 
                      onChange={(e) => handleFileDropOrSelect(e, true)} 
                    />
                  </div>
                ) : (
                  <div className="bg-white border text-slate-705 border-slate-200 rounded-xl p-3 space-y-2.5">
                    <span className="block text-[10.5px] font-bold text-slate-500 uppercase font-mono">Pegar enlace de adjunto en línea (Google Drive, Figma, Miro, etc.)</span>
                    <div className="flex gap-2">
                      <input 
                        type="text"
                        value={backlogCreateUrl}
                        onChange={e => setBacklogCreateUrl(e.target.value)}
                        placeholder="Pegue la URL del recurso externo..."
                        className="flex-1 bg-slate-50 focus:bg-white border border-slate-200 rounded-md p-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => handleBacklogAddLink(true)}
                        disabled={!backlogCreateUrl.trim()}
                        className="bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold text-xs px-3.5 rounded-lg transition-all cursor-pointer shadow-3xs"
                      >
                        Vincular
                      </button>
                    </div>
                  </div>
                )}

                {/* View attachments list in creation form */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto">
                  {(storyForm.attachments || []).map((att: any) => (
                    <div 
                      key={att.id} 
                      onClick={() => setPreviewAttachment(att)}
                      className="bg-white border hover:border-teal-400 hover:bg-teal-50/10 cursor-pointer group rounded-xl p-3 flex items-center justify-between gap-3 text-xs shadow-3xs overflow-hidden transition-all duration-200"
                      title="Haga clic para previsualizar o descargar"
                    >
                      <div className="flex items-center gap-3 truncate flex-1">
                        {att.fileUrl && (att.fileUrl.startsWith('data:image/') || att.fileType.startsWith('image/')) ? (
                          <img src={att.fileUrl} className="w-9 h-9 object-cover rounded border shrink-0 bg-white group-hover:scale-105 transition" referrerPolicy="no-referrer" alt={att.fileName} />
                        ) : (
                          <div className="w-9 h-9 bg-teal-500/10 text-teal-600 rounded flex items-center justify-center shrink-0 border border-teal-500/10 group-hover:bg-teal-500/20 transition">
                            <Eye className="w-4 h-4 hidden group-hover:block text-teal-700 animate-pulse" />
                            <FileText className="w-4 h-4 group-hover:hidden" />
                          </div>
                        )}
                        <div className="truncate">
                          <strong className="text-slate-700 group-hover:text-teal-700 block truncate font-bold" title={att.fileName}>{att.fileName}</strong>
                          <span className="block text-[9.5px] text-slate-400 mt-0.5">{att.fileType.split('/')[1]?.toUpperCase() || 'Archivo'} | {att.uploadedAt}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setStoryForm(prev => ({
                            ...prev,
                            attachments: (prev.attachments || []).filter((a: any) => a.id !== att.id)
                          }));
                        }}
                        className="text-red-500 hover:text-red-700 font-extrabold text-xs p-1 hover:bg-red-50 rounded shrink-0 transition"
                        title="Eliminar archivo"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-150/50 p-3 rounded-lg text-[10.5px] text-slate-500 font-mono">
                ℹ️ Todos los requerimientos nuevos se crean de manera automática en estado <strong>Borrador</strong>. Su avance estará supervisado por las reglas del Sprint actual.
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-150">
                <button
                  type="button"
                  onClick={() => setIsStoryFormOpen(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-4 py-2 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs px-5 py-2 rounded-xl cursor-pointer"
                >
                  Guardar Requerimiento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4B: NEW EPIC MODAL */}
      {isEpicFormOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden max-w-md w-full shadow-2xl animate-fadeIn">
            <div className="bg-slate-900 text-white p-4 justify-between flex items-center">
              <h4 className="font-bold text-xs">Añadir Nueva Épica de Trabajo</h4>
              <button onClick={() => setIsEpicFormOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleSaveEpic} className="p-5 space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Nombre epica*</label>
                <input
                  type="text"
                  required
                  placeholder="Forecast y Planificación de Demanda"
                  value={epicForm.name || ''}
                  onChange={e => setEpicForm(p => ({ ...p, name: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Descripción de Módulo macro</label>
                <textarea
                  rows={3}
                  placeholder="Permitirá estructurar variables para..."
                  value={epicForm.description || ''}
                  onChange={e => setEpicForm(p => ({ ...p, description: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Prioridad corporativa</label>
                <select
                  value={epicForm.priority || 'Media'}
                  onChange={e => setEpicForm(p => ({ ...p, priority: e.target.value as any }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs"
                >
                  {storyPrioritiesEnum.map(pr => <option key={pr} value={pr}>{pr}</option>)}
                </select>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t">
                <button type="button" onClick={() => setIsEpicFormOpen(false)} className="text-xs font-bold text-slate-600">Cancelar</button>
                <button type="submit" className="bg-teal-600 text-white text-xs font-bold px-4 py-1.5 rounded">Guardar Épica</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4C: ADVANCED DETAIL DRAWER / MODAL FOR USER STORY */}
      {isDetailOpen && selectedStory && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-4xl w-full max-h-[90vh] shadow-2xl overflow-hidden flex flex-col justify-between animate-fadeIn">
            
            {/* Header */}
            <div className="bg-slate-900 text-white p-5 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <span className="bg-teal-600/30 text-teal-300 font-mono font-black text-sm px-3 py-1 rounded-lg border border-teal-500/30">
                  {selectedStory.code}
                </span>
                <div>
                  <h3 className="font-extrabold text-sm tracking-wide text-white">{selectedStory.title}</h3>
                  <p className="text-[10px] text-slate-400 font-mono">Modo de Verificación e Historial</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button 
                  onClick={() => exportFichaPDF(selectedStory)}
                  className="bg-red-650 hover:bg-red-700 font-bold text-[10.5px] px-3 py-1.5 rounded flex items-center gap-1 border border-red-500/40"
                >
                  <Download className="w-3.5 h-3.5" /> PDF
                </button>
                <button 
                  onClick={() => setIsDetailOpen(false)}
                  className="text-slate-400 hover:text-white text-sm"
                >
                  ✕ Cerrar
                </button>
              </div>
            </div>

            {/* Menu tabs of Detail */}
            <div className="bg-slate-100 border-b border-slate-200 px-5 flex items-center gap-1 text-[11px] font-bold text-slate-500">
              <button
                onClick={() => setDetailTab('general')}
                className={`py-2 px-3 border-b-2 transition ${detailTab === 'general' ? 'border-teal-600 text-teal-700' : 'border-transparent'}`}
                id="tab-btn-general"
              >
                📋 General, Adjuntos & Comentarios
              </button>
              <button
                onClick={() => setDetailTab('accept')}
                className={`py-2 px-3 border-b-2 transition ${detailTab === 'accept' ? 'border-teal-600 text-teal-700' : 'border-transparent'}`}
                id="tab-btn-actividades"
              >
                ✔️ Actividades ({selectedStory.acceptanceCriteria.length})
              </button>
              <button
                onClick={() => setDetailTab('trace')}
                className={`py-2 px-3 border-b-2 transition ${detailTab === 'trace' ? 'border-teal-600 text-teal-700' : 'border-transparent'}`}
                id="tab-btn-trazabilidad"
              >
                🕒 Trazabilidad de Auditoría ({selectedStory.history.length})
              </button>
            </div>

            {/* Middle body display */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">

              {/* TABS: GENERAL */}
              {detailTab === 'general' && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-slate-50 p-3 rounded-lg border flex flex-col justify-between">
                      <span className="block text-[8.5px] uppercase font-bold text-slate-400 mb-1">Tipo</span>
                      {currentRole === 'CONSULTA' ? (
                        <span className="font-extrabold text-slate-800 text-xs">{selectedStory.type}</span>
                      ) : (
                        <select
                          value={selectedStory.type}
                          onChange={(e) => {
                            const val = e.target.value as StoryType;
                            setStories(prev => prev.map(s => s.id === selectedStory.id ? { ...s, type: val } : s));
                            addLog('Carlos Pérez', `Cambió Tipo de ${selectedStory.code} a ${val}`);
                          }}
                          className="bg-transparent border-none text-xs text-slate-800 font-extrabold focus:outline-none cursor-pointer p-0 select-none outline-none"
                        >
                          {storyTypesEnum.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      )}
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg border flex flex-col justify-between">
                      <span className="block text-[8.5px] uppercase font-bold text-slate-400 mb-1">Prioridad</span>
                      {currentRole === 'CONSULTA' ? (
                        <span className="font-extrabold text-slate-800 text-xs text-red-700">{selectedStory.priority}</span>
                      ) : (
                        <select
                          value={selectedStory.priority}
                          onChange={(e) => {
                            const val = e.target.value as StoryPriority;
                            setStories(prev => prev.map(s => s.id === selectedStory.id ? { ...s, priority: val } : s));
                            addLog('Carlos Pérez', `Cambió Prioridad de ${selectedStory.code} a ${val}`);
                          }}
                          className="bg-transparent border-none text-xs font-extrabold text-red-700 focus:outline-none cursor-pointer p-0 select-none outline-none"
                        >
                          {storyPrioritiesEnum.map(pr => <option key={pr} value={pr}>{pr}</option>)}
                        </select>
                      )}
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg border flex flex-col justify-between">
                      <span className="block text-[8.5px] uppercase font-bold text-slate-400 mb-1">Story Points</span>
                      {currentRole === 'CONSULTA' ? (
                        <span className="font-extrabold text-slate-800 text-xs font-mono">{selectedStory.storyPoints} pts</span>
                      ) : (
                        <select
                          value={selectedStory.storyPoints}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setStories(prev => prev.map(s => s.id === selectedStory.id ? { ...s, storyPoints: val } : s));
                            addLog('Carlos Pérez', `Cambió Story Points de ${selectedStory.code} a ${val} pts`);
                          }}
                          className="bg-transparent border-none text-xs text-slate-800 font-extrabold focus:outline-none cursor-pointer p-0 select-none outline-none font-mono"
                        >
                          <option value="1">1 pt - Simple</option>
                          <option value="2">2 pts - Intermedio</option>
                          <option value="3">3 pts - Normal</option>
                          <option value="5">5 pts - Complejo</option>
                          <option value="8">8 pts - Grande</option>
                          <option value="13">13 pts - Épica</option>
                          <option value="21">21 pts - Descomunal</option>
                        </select>
                      )}
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg border flex flex-col justify-between">
                      <span className="block text-[8.5px] uppercase font-bold text-slate-400 mb-1">Métrica MoSCoW</span>
                      {currentRole === 'CONSULTA' ? (
                        <span className="font-extrabold text-slate-800 text-xs">{selectedStory.moscow || 'Should'}</span>
                      ) : (
                        <select
                          value={selectedStory.moscow || 'Should'}
                          onChange={(e) => {
                            const val = e.target.value as any;
                            setStories(prev => prev.map(s => s.id === selectedStory.id ? { ...s, moscow: val } : s));
                            addLog('Carlos Pérez', `Cambió MoSCoW de ${selectedStory.code} a ${val}`);
                          }}
                          className="bg-transparent border-none text-xs text-slate-800 font-extrabold focus:outline-none cursor-pointer p-0 select-none outline-none"
                        >
                          <option value="Must">MUST</option>
                          <option value="Should">SHOULD</option>
                          <option value="Could">COULD</option>
                          <option value="Won’t">WON’T</option>
                        </select>
                      )}
                    </div>
                  </div>

                  {/* Formato structured list */}
                  {currentRole === 'CONSULTA' ? (
                    <div className="bg-teal-50/20 border border-teal-200/50 p-5 rounded-2xl space-y-3.5">
                      <h4 className="font-bold text-teal-950 text-xs uppercase tracking-wider">Estructura Narrativa del Requerimiento (Solo Consulta):</h4>
                      <div className="text-sm font-medium space-y-2">
                        <p className="text-slate-800"><span className="font-black text-teal-800">COMO:</span> {selectedStory.role || 'Planificador logístico'}</p>
                        <p className="text-slate-800"><span className="font-black text-teal-800">QUIERO:</span> {selectedStory.want || 'verificar tránsitos síncronos'}</p>
                        <p className="text-slate-800"><span className="font-black text-teal-800">PARA:</span> {selectedStory.benefit || 'calcular existencias semanales sin demoras'}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-teal-50 border border-teal-200 p-5 rounded-2xl space-y-3">
                      <div className="flex justify-between items-center">
                        <label htmlFor="detail-hu-textarea" className="font-extrabold text-[10.5px] uppercase tracking-wider text-teal-950">
                          Descripción del Requerimiento en Formato Estándar Ágil
                        </label>
                        <span className="text-[9px] font-mono bg-teal-100 text-teal-800 px-2 py-0.5 rounded border border-teal-300 font-bold">Modificación Rápida</span>
                      </div>
                      <textarea
                        id="detail-hu-textarea"
                        rows={4}
                        placeholder="Escriba la HU en formato: COMO [rol] QUIERO [funcionalidad] PARA [beneficio]"
                        value={selectedStory.huUnified !== undefined ? selectedStory.huUnified : (selectedStory.role ? `COMO ${selectedStory.role}\nQUIERO ${selectedStory.want}\nPARA ${selectedStory.benefit}` : '')}
                        onChange={(e) => {
                          const val = e.target.value;
                          let parsedRole = '';
                          let parsedWant = val.trim();
                          let parsedBenefit = '';

                          if (val.trim()) {
                            const matchFull = val.match(/como\s+([\s\S]*?)\s+quiero\s+([\s\S]*?)\s+para\s+([\s\S]*)/i);
                            if (matchFull) {
                              parsedRole = matchFull[1].trim();
                              parsedWant = matchFull[2].trim();
                              parsedBenefit = matchFull[3].trim();
                            } else {
                              const matchSimple = val.match(/como\s+([\s\S]*?)\s+quiero\s+([\s\S]*)/i);
                              if (matchSimple) {
                                parsedRole = matchSimple[1].trim();
                                parsedWant = matchSimple[2].trim();
                              }
                            }
                          }

                          setStories(prev => prev.map(s => s.id === selectedStory.id ? {
                            ...s,
                            huUnified: val,
                            role: parsedRole,
                            want: parsedWant,
                            benefit: parsedBenefit
                          } : s));
                        }}
                        className="w-full bg-white border border-teal-200 rounded-lg px-3.5 py-3 text-xs text-slate-800 focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none leading-relaxed resize-y font-medium min-h-[100px]"
                      />
                      <p className="text-[9.5px] text-teal-750 font-medium">
                        💡 Este texto se procesa en tiempo real para extraer estructuradamente: <strong>Como</strong>, <strong>Quiero</strong> y <strong>Para</strong>.
                      </p>
                    </div>
                  )}

                  {currentRole === 'CONSULTA' ? (
                    <div className="bg-white border rounded-xl p-4 shadow-3xs">
                      <span className="block text-[9.5px] font-bold text-slate-400 uppercase mb-1">Descripción contextualizada (Solo Consulta)</span>
                      <p className="text-xs text-slate-700 leading-relaxed font-medium">{selectedStory.description || 'No hay notas técnicas documentadas.'}</p>
                    </div>
                  ) : (
                    <div className="bg-white border rounded-xl p-4 shadow-3xs space-y-2">
                      <div className="flex justify-between items-center">
                        <label htmlFor="detail-desc-textarea" className="block text-[9.5px] font-bold text-slate-400 uppercase">
                          Análisis Detallado / Descripción funcional
                        </label>
                        <span className="text-[9px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-300 font-bold">Modificación Rápida</span>
                      </div>
                      <textarea
                        id="detail-desc-textarea"
                        rows={4}
                        placeholder="Escriba aquí el análisis detallado técnico o descripción funcional adicional..."
                        value={selectedStory.description || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setStories(prev => prev.map(s => s.id === selectedStory.id ? {
                            ...s,
                            description: val
                          } : s));
                        }}
                        className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:ring-1 focus:ring-teal-500 rounded-lg p-3 text-xs text-slate-800 outline-none leading-relaxed resize-y min-h-[100px]"
                      />
                    </div>
                  )}

                  {/* Basic meta information */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2 border-t text-xs font-medium">
                    <div>
                      <span className="block text-slate-400 text-[10px]">Fecha Creación:</span>
                      <strong className="text-slate-700 font-mono">{selectedStory.createdAt}</strong>
                    </div>
                    <div>
                      <span className="block text-slate-400 text-[10px]">Fecha Inicio Estimada:</span>
                      <strong className="text-slate-705 font-mono">{selectedStory.startDate || '-'}</strong>
                    </div>
                    <div>
                      <span className="block text-slate-400 text-[10px]">Fecha Compromiso (UAT):</span>
                      <strong className="text-slate-700 font-mono text-red-600">{selectedStory.dueDate || '-'}</strong>
                    </div>
                    <div>
                      <span className="block text-slate-400 text-[10px]">Fecha Cierre:</span>
                      <strong className="text-slate-700 font-mono text-emerald-700">{selectedStory.endDate || '-'}</strong>
                    </div>
                  </div>

                  {/* AREA COMPARTIDA: ADJUNTAR IMÁGENES Y ARCHIVOS (DRAG AND DROP) */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 shadow-3xs">
                    <div className="flex justify-between items-center pb-2 border-b">
                      <h4 className="font-extrabold text-[11px] uppercase tracking-wider text-slate-650">Imágenes y Archivos Adjuntos</h4>
                      <span className="font-mono text-[9px] bg-slate-200 text-slate-700 px-2.5 py-0.5 rounded font-black">
                        {(selectedStory.attachments || []).length} Archivos
                      </span>
                    </div>

                    {/* Tabs */}
                    <div className="flex bg-slate-200/50 p-1 rounded-lg gap-1.5">
                      <button
                        type="button"
                        onClick={() => setBacklogDetailMode('file')}
                        className={`flex-1 text-[10.5px] font-bold py-1 rounded transition ${backlogDetailMode === 'file' ? 'bg-white shadow-3xs text-teal-600' : 'text-slate-500 hover:text-slate-800'}`}
                      >
                        Archivo Local
                      </button>
                      <button
                        type="button"
                        onClick={() => setBacklogDetailMode('link')}
                        className={`flex-1 text-[10.5px] font-bold py-1 rounded transition ${backlogDetailMode === 'link' ? 'bg-white shadow-3xs text-teal-600' : 'text-slate-500 hover:text-slate-800'}`}
                      >
                        Enlace Web (URL)
                      </button>
                    </div>

                    {backlogDetailMode === 'file' ? (
                      <div 
                        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                        onDragLeave={() => setIsDragOver(false)}
                        onDrop={(e) => handleFileDropOrSelect(e, false)}
                        className={`border-2 border-dashed rounded-xl p-6 text-center transition cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                          isDragOver ? 'border-teal-500 bg-teal-50/20' : 'border-slate-300 hover:border-teal-500 hover:bg-white'
                        }`}
                        onClick={() => document.getElementById('file-input-detail')?.click()}
                      >
                        <Paperclip className="w-8 h-8 text-slate-400" />
                        <p className="text-xs text-slate-650 font-bold">
                          Arrastra y suelta imágenes o archivos aquí, o <span className="text-teal-600 underline">haz clic para elegir</span>
                        </p>
                        <p className="text-[10px] text-slate-400 font-medium">PNG, JPG, PDF, DOCX (Se almacena en memoria local del navegador)</p>
                        <input 
                          type="file" 
                          id="file-input-detail" 
                          className="hidden" 
                          multiple 
                          onChange={(e) => handleFileDropOrSelect(e, false)} 
                        />
                      </div>
                    ) : (
                      <div className="bg-white border text-slate-705 border-slate-200 rounded-xl p-3 space-y-2.5">
                        <span className="block text-[10.5px] font-bold text-slate-500 uppercase font-mono">Pegar enlace de adjunto en línea (Google Drive, Figma, Miro, etc.)</span>
                        <div className="flex gap-2">
                          <input 
                            type="text"
                            value={backlogDetailUrl}
                            onChange={e => setBacklogDetailUrl(e.target.value)}
                            placeholder="Pegue la URL del recurso externo..."
                            className="flex-1 bg-slate-50 focus:bg-white border border-slate-200 rounded-md p-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => handleBacklogAddLink(false)}
                            disabled={!backlogDetailUrl.trim()}
                            className="bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold text-xs px-3.5 rounded-lg transition-all cursor-pointer shadow-3xs"
                          >
                            Vincular
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Lista visual de adjuntos con previsualización */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {(selectedStory.attachments || []).map(att => (
                        <div 
                          key={att.id} 
                          onClick={() => setPreviewAttachment(att)}
                          className="bg-white border hover:border-teal-500 hover:bg-teal-50/10 cursor-pointer group text-slate-800 p-3.5 rounded-xl flex items-center justify-between gap-3 shadow-3xs overflow-hidden transition-all duration-200"
                          title="Haga clic para previsualizar o descargar"
                        >
                          <div className="flex items-center gap-3 truncate flex-1">
                            {att.fileUrl && (att.fileUrl.startsWith('data:image/') || att.fileType.startsWith('image/')) ? (
                              <img src={att.fileUrl} className="w-10 h-10 object-cover rounded border shrink-0 bg-slate-100 group-hover:scale-105 transition" referrerPolicy="no-referrer" alt={att.fileName} />
                            ) : (
                              <div className="w-10 h-10 bg-teal-500/10 text-teal-600 rounded flex items-center justify-center shrink-0 border border-teal-500/15 group-hover:bg-teal-500/20 transition">
                                <Eye className="w-5 h-5 hidden group-hover:block text-teal-700 animate-pulse" />
                                <FileText className="w-5 h-5 group-hover:hidden" />
                              </div>
                            )}
                            <div className="truncate text-xs">
                              <strong className="text-slate-800 group-hover:text-teal-700 block truncate font-bold" title={att.fileName}>{att.fileName}</strong>
                              <span className="block text-[10px] text-slate-400 mt-0.5">{att.fileType.split('/')[1]?.toUpperCase() || 'Archivo'} | {att.uploadedAt}</span>
                            </div>
                          </div>
                          
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setStories(prev => prev.map(s => {
                                if (s.id === selectedStoryId) {
                                  return {
                                    ...s,
                                    attachments: (s.attachments || []).filter((a: any) => a.id !== att.id)
                                  };
                                }
                                return s;
                              }));
                            }}
                            className="text-red-500 hover:text-red-700 font-extrabold text-xs p-1 hover:bg-rose-50 rounded shrink-0 transition"
                            title="Eliminar archivo"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                      {(selectedStory.attachments || []).length === 0 && (
                        <div className="col-span-2 text-center p-6 text-slate-400 italic text-xs">No hay entregables o registros de pruebas en la bitácora. Arrastre un archivo arriba.</div>
                      )}
                    </div>
                  </div>

                  {/* COMENTARIOS DE BITÁCORA INTEGRADOS */}
                  <div className="space-y-4 pt-4 border-t">
                    <h5 className="font-extrabold text-slate-800 text-xs uppercase border-b pb-2 tracking-wider">Comentarios Técnicos y Historial de Hilos</h5>
                    <div className="space-y-3.5 max-h-80 overflow-y-auto pr-1">
                      {(selectedStory.comments || []).map(com => (
                        <div key={com.id} className="bg-slate-50 border rounded-xl p-4 text-xs space-y-1.5 relative shadow-3xs">
                          <div className="flex justify-between items-center">
                            <strong className="text-slate-800">{com.userName} ({com.userRole})</strong>
                            <span className="text-[10px] text-slate-400 font-mono">{com.timestamp}</span>
                          </div>
                          <span className={`inline-block px-1.5 py-0.5 rounded text-[8.5px] font-mono font-bold tracking-wider ${
                            com.type === 'General' ? 'bg-slate-200 text-slate-700' :
                            com.type === 'Técnico' ? 'bg-indigo-50 text-indigo-700' : 'bg-amber-50 text-amber-700'
                          }`}>
                            {com.type.toUpperCase()}
                          </span>
                          <p className="text-slate-700 leading-relaxed font-semibold pt-1">{com.text}</p>
                        </div>
                      ))}
                      {(selectedStory.comments || []).length === 0 && (
                        <p className="text-xs text-slate-400 italic text-center py-4">No hay comentarios sobre esta historia de usuario.</p>
                      )}
                    </div>

                    {currentRole !== 'CONSULTA' && (
                      <div className="bg-slate-100 p-4 rounded-xl space-y-3 shadow-3xs">
                        <span className="block text-[10px] font-bold text-slate-650 uppercase">Nuevo Comentario de Bitácora</span>
                        <div className="flex gap-2">
                          <select
                            value={newCommentType}
                            onChange={e => setNewCommentType(e.target.value as any)}
                            className="bg-white border rounded px-2.5 py-1 text-xs text-slate-700 font-bold focus:outline-none"
                          >
                            <option value="General">Comentario General</option>
                            <option value="Técnico">Detalle Técnico</option>
                            <option value="Funcional">Análisis Funcional</option>
                            <option value="Bloqueo">Motivo de Bloqueo</option>
                          </select>
                        </div>
                        <div className="flex gap-2.5">
                          <input
                            type="text"
                            placeholder="Describa el cambio de alcance o consideraciones de base de datos..."
                            value={newCommentText}
                            onChange={e => setNewCommentText(e.target.value)}
                            className="flex-1 bg-white border rounded px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-teal-500"
                          />
                          <button
                            type="button"
                            onClick={handleAddComment}
                            className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2 rounded shadow-3xs cursor-pointer transition"
                          >
                            Publicar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TABS: ACTIVIDADES DE LA HISTORIA */}
              {detailTab === 'accept' && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="flex justify-between items-center bg-slate-50 p-3.5 rounded-xl border">
                    <span className="text-xs text-slate-500 font-bold">Porcentaje de Actividades Cumplidas:</span>
                    <strong className="text-teal-700 font-mono text-sm">{getAcceptanceCriteriaMetPercent(selectedStory)}%</strong>
                  </div>

                  <div className="space-y-3">
                    {selectedStory.acceptanceCriteria.map((crit, idx) => {
                      const idToCheck = crit.id || String(idx);
                      const isEditingThis = editingCritId === idToCheck;
                      return (
                        <div key={crit.id || idx} className="bg-white border rounded-xl p-4 text-xs space-y-3 shadow-3xs">
                          {isEditingThis ? (
                            <div className="space-y-3 w-full animate-fadeIn">
                              <span className="font-extrabold text-teal-850 text-[10px] uppercase">Editando Actividad #{crit.number}</span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-[9.5px] font-bold text-slate-500 uppercase">Descripción de la Actividad</label>
                                  <textarea
                                    rows={1}
                                    value={editCritDesc}
                                    onChange={e => {
                                      setEditCritDesc(e.target.value);
                                      e.target.style.height = 'auto';
                                      e.target.style.height = `${e.target.scrollHeight}px`;
                                    }}
                                    style={{ height: editCritDesc ? undefined : 'auto' }}
                                    className="w-full bg-white border rounded px-2.5 py-1.5 text-xs outline-none resize-none overflow-hidden min-h-[34px] focus:ring-1 focus:ring-teal-500 text-slate-800 font-semibold transition-all"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[9.5px] font-bold text-slate-500 uppercase">Tipo de Actividad</label>
                                  <select
                                    value={editCritType}
                                    onChange={e => setEditCritType(e.target.value as any)}
                                    className="w-full bg-white border rounded px-2.5 py-1.5 text-xs text-slate-850 focus:ring-1 focus:ring-teal-500 font-semibold"
                                  >
                                    <option value="Funcional">Funcional</option>
                                    <option value="Validación">Validación de Interfaz</option>
                                    <option value="Cálculo">Cálculo Matemático</option>
                                    <option value="Integración">Integración de Gateway</option>
                                    <option value="Seguridad">Seguridad / Cripografia</option>
                                    <option value="Reporte">Reporte de Consultoría</option>
                                  </select>
                                </div>
                                <div className="sm:col-span-2">
                                  <label className="block text-[9.5px] font-bold text-slate-500 uppercase">Resultado esperado de validación técnica</label>
                                  <textarea
                                    rows={1}
                                    value={editCritExpected}
                                    onChange={e => {
                                      setEditCritExpected(e.target.value);
                                      e.target.style.height = 'auto';
                                      e.target.style.height = `${e.target.scrollHeight}px`;
                                    }}
                                    style={{ height: editCritExpected ? 'auto' : undefined }}
                                    className="w-full bg-white border rounded px-2.5 py-1.5 text-xs outline-none resize-none overflow-hidden min-h-[34px] focus:ring-1 focus:ring-teal-500 transition-all font-semibold text-slate-800"
                                  />
                                </div>
                              </div>
                              <div className="flex justify-end gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={() => setEditingCritId(null)}
                                  className="bg-slate-200 hover:bg-slate-300 text-slate-755 font-bold px-3 py-1.5 rounded-lg text-[10.5px] cursor-pointer transition text-center"
                                >
                                  Cancelar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSaveEditCritDirectly(selectedStory.id, idToCheck)}
                                  className="bg-teal-650 hover:bg-teal-700 text-white font-black px-4 py-1.5 rounded-lg text-[10.5px] cursor-pointer transition shadow-2xs text-center"
                                >
                                  Guardar Cambios
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <div className="flex justify-between items-center gap-3 flex-wrap">
                                <span className="font-extrabold text-teal-850 uppercase">Actividad #{crit.number} - [{crit.type}]</span>
                                <div className="flex items-center gap-2">
                                  {currentRole !== 'CONSULTA' && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingCritId(idToCheck);
                                        setEditCritDesc(crit.description);
                                        setEditCritType(crit.type);
                                        setEditCritExpected(crit.expectedResult || '');
                                      }}
                                      className="text-teal-600 hover:text-teal-850 font-black px-2 py-0.5 rounded text-[10.5px] hover:bg-teal-50 transition cursor-pointer"
                                    >
                                      Editar
                                    </button>
                                  )}
                                  <div className="flex items-center gap-1.5">
                                    {(['Pendiente', 'Cumple', 'No cumple', 'No aplica'] as AcceptanceCriterion['status'][]).map(st => (
                                      <button
                                        key={st}
                                        type="button"
                                        disabled={currentRole === 'CONSULTA' || (currentRole === 'DEVELOPER' && st === 'Cumple')}
                                        onClick={() => toggleCritStatus(crit.id, st)}
                                        className={`px-2.5 py-1 text-[10px] font-bold rounded cursor-pointer transition ${
                                          crit.status === st
                                            ? st === 'Cumple' ? 'bg-emerald-600 text-white' :
                                              st === 'No cumple' ? 'bg-red-500 text-white' :
                                              st === 'No aplica' ? 'bg-slate-400 text-white' : 'bg-slate-700 text-white'
                                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                        }`}
                                      >
                                        {st}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </div>

                              <p className="text-slate-800 font-bold">{crit.description}</p>
                              {crit.expectedResult && (
                                <div className="p-2.5 bg-slate-50 rounded border border-slate-150 text-slate-650 font-medium whitespace-pre-wrap leading-normal">
                                  <strong>Resultado Esperado:</strong> {crit.expectedResult}
                                </div>
                              )}
                              {crit.validatedBy && (
                                <span className="block text-[10px] text-slate-400 font-mono font-medium">
                                  ✔️ Aprobado de conformidad por {crit.validatedBy} el {crit.validatedAt}
                                </span>
                              )}

                              {currentRole !== 'CONSULTA' ? (
                                <div className="pt-2 border-t border-dashed border-slate-200 flex flex-col sm:flex-row sm:items-center gap-2 mt-1">
                                  <span className="text-[9.5px] uppercase font-bold text-slate-400 shrink-0">💬 Observaciones / Comentario:</span>
                                  <input
                                    type="text"
                                    value={crit.comment || ''}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setStories(prev => prev.map(s => {
                                        if (s.id === selectedStory.id) {
                                          return {
                                            ...s,
                                            acceptanceCriteria: s.acceptanceCriteria.map(c => 
                                              (c.id === crit.id || (!c.id && c.number === crit.number)) ? { ...c, comment: val } : c
                                            )
                                          };
                                        }
                                        return s;
                                      }));
                                    }}
                                    placeholder="Escriba un comentario o nota de validación sobre esta actividad..."
                                    className="flex-1 text-[11px] bg-slate-50 border border-slate-200 focus:bg-white focus:border-slate-350 rounded px-2.5 py-1 outline-none text-slate-700 font-semibold"
                                  />
                                </div>
                              ) : (
                                crit.comment && (
                                  <div className="pt-2 border-t border-dashed border-slate-200 text-[11px] text-slate-600 leading-normal mt-1 flex gap-1.5 items-center">
                                    <span className="font-extrabold uppercase text-slate-400 text-[9.5px]">💬 Comentario:</span>
                                    <span className="italic">{crit.comment}</span>
                                  </div>
                                )
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {selectedStory.acceptanceCriteria.length === 0 && (
                      <span className="text-slate-400 italic block py-4 text-center text-xs">No hay actividades de control de la HU registradas. Genere una debajo.</span>
                    )}
                  </div>

                  {/* Add Acceptance Criteria inline form renamed to Actividades */}
                  {currentRole !== 'CONSULTA' && (
                    <div className="bg-slate-50 border border-dashed border-slate-300 rounded-2xl p-4 space-y-3.5 shadow-3xs">
                      <h5 className="font-bold text-slate-830 text-xs tracking-tight uppercase">Agregar Nueva Actividad</h5>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[9.5px] font-bold uppercase text-slate-500">Descripción de la Actividad*</label>
                          <textarea
                            rows={1}
                            required
                            placeholder="Ej. Asegurar orden descendente por fecha..."
                            value={newCritDesc}
                            onChange={e => {
                              setNewCritDesc(e.target.value);
                              e.target.style.height = 'auto';
                              e.target.style.height = `${e.target.scrollHeight}px`;
                            }}
                            style={{ height: newCritDesc ? undefined : 'auto' }}
                            className="w-full bg-white border rounded px-2.5 py-1.5 text-xs text-slate-800 outline-none resize-none overflow-hidden min-h-[34px] focus:ring-1 focus:ring-teal-500 focus:border-teal-500 transition-all font-semibold"
                          />
                        </div>
                        <div>
                          <label className="block text-[9.5px] font-bold uppercase text-slate-500">Tipo de Actividad</label>
                          <select
                            value={newCritType}
                            onChange={e => setNewCritType(e.target.value as any)}
                            className="w-full bg-white border rounded px-2.5 py-1.5 text-xs text-slate-850"
                          >
                            <option value="Funcional">Funcional</option>
                            <option value="Validación">Validación de Interfaz</option>
                            <option value="Cálculo">Cálculo Matemático</option>
                            <option value="Integración">Integración de Gateway</option>
                            <option value="Seguridad">Seguridad / Cripografia</option>
                            <option value="Reporte">Reporte de Consultoría</option>
                          </select>
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-[9.5px] font-bold uppercase text-slate-500">Resultado esperado de validación técnica</label>
                          <textarea
                            rows={1}
                            placeholder="Ej. Datos síncronos mapeados en tiempo real."
                            value={newCritExpected}
                            onChange={e => {
                              setNewCritExpected(e.target.value);
                              e.target.style.height = 'auto';
                              e.target.style.height = `${e.target.scrollHeight}px`;
                            }}
                            style={{ height: newCritExpected ? 'auto' : undefined }}
                            className="w-full bg-white border rounded px-2.5 py-1.5 text-xs text-slate-800 outline-none resize-none overflow-hidden min-h-[34px] focus:ring-1 focus:ring-teal-500 focus:border-teal-500 transition-all font-semibold"
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleAddCrit}
                        className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-1.5 rounded cursor-pointer transition shadow-3xs"
                      >
                        Insertar Actividad
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* TABS: AUDIT HISTORY */}
              {detailTab === 'trace' && (
                <div className="space-y-3">
                  {selectedStory.history.map((hist, idx) => (
                    <div key={idx} className="bg-white border border-slate-150/60 rounded-lg p-3.5 text-xs flex items-center gap-3.5">
                      <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center shrink-0 font-mono font-bold text-[10px]">
                        #{idx + 1}
                      </div>
                      <div className="flex-1 text-slate-650">
                        <p>
                          Campo <strong>{hist.field}</strong> modificado por <strong>{hist.by}</strong>.
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Valor previo: <span className="font-mono bg-slate-50 px-1 rounded text-red-705">"{hist.oldVal}"</span> → Nuevo valor: <span className="font-mono bg-slate-50 px-1 rounded text-emerald-705">"{hist.newVal}"</span>
                        </p>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono shrink-0">{hist.at}</span>
                    </div>
                  ))}
                  {selectedStory.history.length === 0 && <span className="text-slate-450 italic text-center py-4 text-xs block">No hay trazabilidad histórica para este ítem.</span>}
                </div>
              )}

            </div>

            {/* Footer buttons of detail screen */}
            <div className="bg-slate-50 border-t border-slate-200 p-4 flex justify-between shrink-0">
              <button
                type="button"
                onClick={() => handleDeleteStory(selectedStory.id, selectedStory.code)}
                className={`bg-red-50 hover:bg-red-100 text-red-650 font-bold text-xs px-4 py-2 rounded-xl border border-red-200 transition cursor-pointer flex items-center gap-1 ${
                  currentRole !== 'ADMIN_PMO' ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                id={`delete-story-detail-${selectedStory.id}`}
              >
                <Trash2 className="w-4 h-4" /> Eliminar (Solo Admin)
              </button>

              <div className="flex items-center gap-3">
                {currentRole !== 'CONSULTA' && (
                  <button
                    type="button"
                    onClick={() => {
                      const initHU = selectedStory.role || selectedStory.benefit
                        ? `Como ${selectedStory.role || ''} quiero ${selectedStory.want || ''} para ${selectedStory.benefit || ''}`.trim()
                        : (selectedStory.want || '');
                      setStoryForm({ ...selectedStory, huUnified: initHU });
                      setIsStoryFormOpen(true);
                    }}
                    className="bg-teal-650 hover:bg-teal-700 text-white font-extrabold text-xs px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                    id={`edit-story-detail-${selectedStory.id}`}
                  >
                    <Edit2 className="w-4 h-4" /> Editar Propiedades
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setIsDetailOpen(false)}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs px-5 py-2 rounded-xl transition cursor-pointer shadow-3xs"
                  id={`close-story-detail-${selectedStory.id}`}
                >
                  Listo
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {deleteConfirmState && deleteConfirmState.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-[99999] p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full border border-slate-100 overflow-hidden text-slate-800">
            <div className="p-5">
              <h3 className="text-sm font-bold text-slate-950 flex items-center gap-2">
                ⚠️ {deleteConfirmState.title}
              </h3>
              <p className="text-xs text-slate-600 mt-2.5 leading-normal">
                {deleteConfirmState.message}
              </p>
            </div>
            <div className="bg-slate-50 px-5 py-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmState(null)}
                className="px-3.5 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 text-xs font-semibold cursor-pointer transition hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteConfirmState.onConfirm();
                  setDeleteConfirmState(null);
                }}
                className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold cursor-pointer transition shadow-sm shadow-rose-100"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {previewAttachment && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center z-[999999] p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full border border-slate-100 flex flex-col text-slate-800 animate-zoomIn max-h-[90vh]">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-3xl">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider font-mono">Visualizador de Adjuntos</span>
                <h4 className="font-extrabold text-sm text-slate-900 truncate max-w-md" title={previewAttachment.fileName}>
                  {previewAttachment.fileName}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setPreviewAttachment(null)}
                className="text-slate-400 hover:text-slate-600 bg-white hover:bg-slate-100 rounded-lg p-2 transition cursor-pointer font-bold text-sm shadow-3xs"
              >
                ✕ Cerrar
              </button>
            </div>

            {/* Container */}
            <div className="p-6 overflow-y-auto flex-1 flex flex-col items-center justify-center min-h-[300px] bg-slate-50/50">
              {previewAttachment.fileUrl && (previewAttachment.fileUrl.startsWith('data:image/') || previewAttachment.fileType.startsWith('image/')) ? (
                <div className="relative group max-w-full">
                  <img
                    src={previewAttachment.fileUrl}
                    className="max-h-[50vh] max-w-full object-contain rounded-2xl mx-auto shadow-md border border-slate-200/60 bg-white"
                    referrerPolicy="no-referrer"
                    alt={previewAttachment.fileName}
                  />
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-slate-900/70 text-white text-[9.5px] px-3 py-1 rounded-full font-mono">
                    Resolución Completa en Memoria Local
                  </div>
                </div>
              ) : (
                <div className="text-center p-8 max-w-md mx-auto space-y-4">
                  <div className="bg-teal-500/10 text-teal-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto border border-teal-500/20">
                    <FileText className="w-8 h-8" />
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-800 text-sm">{previewAttachment.fileName}</h5>
                    <p className="text-xs text-slate-450 mt-1">Este archivo está en formato de datos [{previewAttachment.fileType}] y no se puede renderizar de forma interactiva.</p>
                  </div>
                  <div className="bg-white rounded-xl p-3.5 border text-left text-[11px] space-y-1.5 font-mono text-slate-600">
                    <div><span className="text-slate-400">Tipo Mime:</span> {previewAttachment.fileType}</div>
                    <div><span className="text-slate-400">Subido por:</span> {previewAttachment.uploadedBy || 'Carlos Pérez'}</div>
                    <div><span className="text-slate-400">Fecha:</span> {previewAttachment.uploadedAt}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Actions Footer */}
            <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50 rounded-b-3xl shrink-0 gap-4">
              <span className="text-[10px] text-slate-400 font-mono font-medium">
                Almacenado localmente en sesion
              </span>
              <div className="flex gap-2">
                {previewAttachment.fileUrl && (previewAttachment.fileUrl.startsWith('http://') || previewAttachment.fileUrl.startsWith('https://')) ? (
                  <a
                    href={previewAttachment.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold px-5 py-2.5 rounded-xl transition flex items-center gap-2 shadow-2xs cursor-pointer"
                  >
                    Abrir Enlace Web ↗
                  </a>
                ) : previewAttachment.fileUrl && previewAttachment.fileUrl !== '#' ? (
                  <a
                    href={previewAttachment.fileUrl}
                    download={previewAttachment.fileName}
                    className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-extrabold px-5 py-2.5 rounded-xl transition flex items-center gap-2 shadow-2xs cursor-pointer"
                  >
                    <Download className="w-4 h-4" /> Guardar en Mi Dispositivo
                  </a>
                ) : (
                  <button
                    onClick={() => alert('Este archivo es un marcador de demostración y no contiene datos adjuntos reales. Suba su propio archivo real en memoria mediante arrastrar y soltar.')}
                    className="bg-slate-400 text-white text-xs font-bold px-5 py-2.5 rounded-xl flex items-center gap-2 cursor-not-allowed"
                  >
                    <Download className="w-4 h-4" /> Descarga de demostración cerrada
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setPreviewAttachment(null)}
                  className="bg-slate-900 hover:bg-slate-850 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition cursor-pointer"
                >
                  Regresar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
