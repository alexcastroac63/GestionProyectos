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
  HelpCircle
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
  onSprintUpdate?: () => void;
  addLog: (user: string, action: string) => void;
}

export default function ProductBacklogManager({
  selectedProjectId,
  setSelectedProjectId,
  projects,
  users,
  sprints,
  addLog
}: ProductBacklogManagerProps) {
  
  // --- Simulating Roles ---
  const [currentRole, setCurrentRole] = useState<BacklogRole>('PROJECT_MANAGER');
  
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
    if (cached) return JSON.parse(cached);
    return [];
  });

  const [epics, setEpics] = useState<Epic[]>(() => {
    const cached = localStorage.getItem('backlog_epics');
    if (cached) return JSON.parse(cached);
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
  const [backlogSubTab, setBacklogSubTab] = useState<'dashboard' | 'list' | 'epics'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterResponsible, setFilterResponsible] = useState<string>('all');
  const [filterEpic, setFilterEpic] = useState<string>('all');
  const [filterSprint, setFilterSprint] = useState<string>('all');

  // --- Selection and Modals ---
  const [selectedStoryId, setSelectedStoryId] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isStoryFormOpen, setIsStoryFormOpen] = useState(false);
  const [isEpicFormOpen, setIsEpicFormOpen] = useState(false);

  // --- Edit Form State for creation and updates ---
  const [storyForm, setStoryForm] = useState<Partial<UserStory>>({});
  const [epicForm, setEpicForm] = useState<Partial<Epic>>({});
  
  // Detail Modal tab
  const [detailTab, setDetailTab] = useState<'general' | 'checks' | 'accept' | 'technical' | 'attachments' | 'trace'>('general');

  // New Comment state
  const [newCommentText, setNewCommentText] = useState('');
  const [newCommentType, setNewCommentType] = useState<StoryComment['type']>('General');

  // New Acceptance Criterion state inside modal
  const [newCritDesc, setNewCritDesc] = useState('');
  const [newCritType, setNewCritType] = useState<AcceptanceCriterion['type']>('Funcional');
  const [newCritExpected, setNewCritExpected] = useState('');

  // Save states to local storage
  useEffect(() => {
    localStorage.setItem('backlog_stories_advanced', JSON.stringify(stories));
  }, [stories]);

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
          status: 'En desarrollo',
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
          company: 'Cervecería Campestre S.A.',
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
              validatedBy: 'Ana Gómez',
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
          company: 'Cervecería Campestre S.A.',
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

    if (storyForm.id) {
      // Edit mode
      setStories(prev => prev.map(s => {
        if (s.id === storyForm.id) {
          const modHistory = [...s.history];
          
          if (s.priority !== storyForm.priority) {
            modHistory.push({
              field: 'Prioridad',
              oldVal: s.priority,
              newVal: storyForm.priority || 'Media',
              by: activeUser,
              at: new Date().toISOString().replace('T', ' ').slice(0, 16)
            });
          }

          if (s.sprint_id !== storyForm.sprint_id) {
            modHistory.push({
              field: 'Sprint',
              oldVal: s.sprint_id || 'Backlog',
              newVal: storyForm.sprint_id || 'Backlog',
              by: activeUser,
              at: new Date().toISOString().replace('T', ' ').slice(0, 16)
            });
          }

          return {
            ...s,
            ...storyForm,
            history: modHistory
          } as UserStory;
        }
        return s;
      }));
      addLog(activeUser, `Editó propiedades de la historia de usuario ${storyForm.code}`);
    } else {
      // Create mode
      const nextIdNum = stories.length + 42;
      const newStory: UserStory = {
        id: `story-custom-${Date.now()}`,
        project_id: selectedProjectId,
        epic_id: storyForm.epic_id || undefined,
        sprint_id: storyForm.sprint_id || undefined,
        code: `HU-${nextIdNum}`,
        title: storyForm.title,
        role: storyForm.role || '',
        want: storyForm.want || '',
        benefit: storyForm.benefit || '',
        description: storyForm.description || '',
        type: storyForm.type || 'Funcional',
        priority: storyForm.priority || 'Media',
        status: 'Borrador',
        businessValue: Number(storyForm.businessValue) || 3,
        risk: Number(storyForm.risk) || 3,
        urgency: Number(storyForm.urgency) || 3,
        moscow: storyForm.moscow || 'Should',
        backlogOrder: stories.length + 1,
        storyPoints: Number(storyForm.storyPoints) || 3,
        estimatedHours: storyForm.estimatedHours,
        complexity: storyForm.complexity || 'Media',
        uncertainty: storyForm.uncertainty || 'Media',
        functionalOwnerId: storyForm.functionalOwnerId || 'u-2',
        technicalOwnerId: storyForm.technicalOwnerId || undefined,
        requesterId: 'u-2',
        company: storyForm.company || 'Compañía Principal',
        branch: storyForm.branch || '',
        createdAt: new Date().toISOString().slice(0, 10),
        startDate: storyForm.startDate || new Date().toISOString().slice(0, 10),
        dueDate: storyForm.dueDate || undefined,
        dorChecklist: DEFAULT_DOR_ITEMS.reduce((acc, curr) => ({ ...acc, [curr]: false }), {}),
        dodChecklist: DEFAULT_DOD_ITEMS.reduce((acc, curr) => ({ ...acc, [curr]: false }), {}),
        acceptanceCriteria: [],
        dependencies: [],
        comments: [],
        attachments: [],
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
    'Borrador', 'En refinamiento', 'Ready', 'En desarrollo', 'En pruebas internas', 'En validación usuario', 'Aprobada', 'Cerrada', 'Bloqueada', 'Rechazada', 'Cancelada'
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
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] text-slate-400 font-mono">Simulador de Permisos Corporativos:</span>
              <div className="flex items-center gap-1 bg-slate-800 border border-slate-700 rounded px-2 py-0.5 text-[10px] text-teal-400 font-bold">
                <Shield className="w-3 h-3" />
                <select 
                  value={currentRole} 
                  onChange={e => setCurrentRole(e.target.value as BacklogRole)}
                  className="bg-transparent border-none text-[10px] uppercase font-bold text-teal-400 font-sans focus:outline-none cursor-pointer"
                >
                  <option value="ADMIN_PMO">Administrador PMO (Full Access)</option>
                  <option value="PROJECT_MANAGER">Project Manager (PM)</option>
                  <option value="PRODUCT_OWNER">Product Owner / Demand (PO)</option>
                  <option value="DEVELOPER">Líder Técnico / Desarrollador</option>
                  <option value="QA_TESTER">QA / Tester Asegurador</option>
                  <option value="CONSULTA">Consulta Planificación / Invitado</option>
                </select>
              </div>
            </div>
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
                uncertainty: 'Media'
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
                    <th className="p-3">Épica / Sprint</th>
                    <th className="p-3">Prioridad</th>
                    <th className="p-3 text-center font-mono">Story Points</th>
                    <th className="p-3">Fnal / Téc Owner</th>
                    <th className="p-3 text-right">Estado Backlog</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150">
                  {filteredStories.map(story => {
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
                          setStoryForm({ ...story });
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
                          <div className="space-y-0.5">
                            <span className="text-[10.5px] font-semibold text-slate-600 block">
                              🏙️ {storyEpic ? `${storyEpic.code} - ${storyEpic.name}` : 'Sin Épica'}
                            </span>
                            <span className="text-[10px] text-slate-400 block">
                              🏃 {storySprint ? storySprint.name : 'En Product Backlog'}
                            </span>
                          </div>
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
                        </td>
                      </tr>
                    );
                  })}
                  {filteredStories.length === 0 && (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-500 italic">No se encontraron historias de usuario que coincidan con los filtros seleccionados.</td>
                    </tr>
                  )}
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

      {/* 4. MODALS AND FORMS */}
      
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

              {/* Formato Ágil Como / Quiero / Para */}
              <div className="bg-slate-50 border border-slate-150 rounded-xl p-4 space-y-4">
                <h5 className="font-extrabold text-[10.5px] uppercase tracking-wider text-slate-500">Formato Estructurado de Historia de Usuario (HU)</h5>
                
                <div className="flex flex-col gap-4 w-full">
                  <div className="w-full">
                    <span className="block text-[9.5px] font-bold text-teal-800 uppercase mb-1">COMO [Rol del Usuario]</span>
                    <textarea
                      rows={4}
                      placeholder="Ej. Planificador de compras, Operador logístico..."
                      value={storyForm.role || ''}
                      onChange={e => setStoryForm(p => ({ ...p, role: e.target.value }))}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none resize-y"
                    />
                  </div>
                  <div className="w-full">
                    <span className="block text-[9.5px] font-bold text-teal-800 uppercase mb-1">QUIERO [Acción / Funcionalidad]</span>
                    <textarea
                      rows={4}
                      placeholder="Ej. Visualizar el cálculo de la merma semanal en un tablero dinámico..."
                      value={storyForm.want || ''}
                      onChange={e => setStoryForm(p => ({ ...p, want: e.target.value }))}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none resize-y"
                    />
                  </div>
                  <div className="w-full">
                    <span className="block text-[9.5px] font-bold text-teal-800 uppercase mb-1">PARA [Beneficio / Valor Técnico]</span>
                    <textarea
                      rows={4}
                      placeholder="Ej. Evitar desabastos, programar turnos de mantenimiento y optimizar recursos..."
                      value={storyForm.benefit || ''}
                      onChange={e => setStoryForm(p => ({ ...p, benefit: e.target.value }))}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none resize-y"
                    />
                  </div>
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

              <div className="bg-slate-100/50 p-3 rounded-lg text-[10.5px] text-slate-500 font-mono">
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
                  <p className="text-[10px] text-slate-400 font-mono">Modo de Verificación e Historial | Rol actual: {currentRole}</p>
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
              >
                📋 General & Como/Quiero/Para
              </button>
              <button
                onClick={() => setDetailTab('accept')}
                className={`py-2 px-3 border-b-2 transition ${detailTab === 'accept' ? 'border-teal-600 text-teal-700' : 'border-transparent'}`}
              >
                ✔️ Criterios de Aceptación ({selectedStory.acceptanceCriteria.length})
              </button>
              <button
                onClick={() => setDetailTab('technical')}
                className={`py-2 px-3 border-b-2 transition ${detailTab === 'technical' ? 'border-teal-600 text-teal-700' : 'border-transparent'}`}
              >
                💻 Datos Técnicos & Auditables
              </button>
              <button
                onClick={() => setDetailTab('attachments')}
                className={`py-2 px-3 border-b-2 transition ${detailTab === 'attachments' ? 'border-teal-600 text-teal-700' : 'border-transparent'}`}
              >
                📎 Comentarios y Evidencias
              </button>
              <button
                onClick={() => setDetailTab('trace')}
                className={`py-2 px-3 border-b-2 transition ${detailTab === 'trace' ? 'border-teal-600 text-teal-700' : 'border-transparent'}`}
              >
                🕒 Trazabilidad de Auditoría ({selectedStory.history.length})
              </button>
            </div>

            {/* Middle body display */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">

              {/* TABS: GENERAL */}
              {detailTab === 'general' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-slate-50 p-3 rounded-lg">
                      <span className="block text-[8.5px] uppercase font-bold text-slate-400">Tipo</span>
                      <span className="font-extrabold text-slate-800 text-xs">{selectedStory.type}</span>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg">
                      <span className="block text-[8.5px] uppercase font-bold text-slate-400">Prioridad</span>
                      <span className="font-extrabold text-slate-800 text-xs text-red-700">{selectedStory.priority}</span>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg">
                      <span className="block text-[8.5px] uppercase font-bold text-slate-400">Story Points (Complejidad)</span>
                      <span className="font-extrabold text-slate-800 text-xs font-mono">{selectedStory.storyPoints} pts ({selectedStory.complexity})</span>
                    </div>
                  </div>

                  {/* Formato structured list */}
                  <div className="bg-teal-50/20 border border-teal-200/50 p-5 rounded-2xl space-y-3.5">
                    <h4 className="font-bold text-teal-900 text-xs uppercase tracking-wider">Estructura Narrativa del Requerimiento:</h4>
                    <div className="text-sm font-medium space-y-2">
                      <p className="text-slate-700"><span className="font-black text-teal-800">COMO:</span> {selectedStory.role || 'Planificador logístico'}</p>
                      <p className="text-slate-700"><span className="font-black text-teal-800">QUIERO:</span> {selectedStory.want || 'verificar tránsitos síncronos'}</p>
                      <p className="text-slate-700"><span className="font-black text-teal-800">PARA:</span> {selectedStory.benefit || 'calcular existencias semanales sin demoras'}</p>
                    </div>
                  </div>

                  <div className="bg-white border rounded-xl p-4">
                    <span className="block text-[9.5px] font-bold text-slate-400 uppercase mb-1">Descripción contextualizada</span>
                    <p className="text-xs text-slate-650 leading-relaxed">{selectedStory.description || 'No hay notas técnicas documentadas.'}</p>
                  </div>

                  {/* Basic meta information */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2 border-t text-xs">
                    <div>
                      <span className="block text-slate-400">Fecha Creación:</span>
                      <strong className="text-slate-700 font-mono">{selectedStory.createdAt}</strong>
                    </div>
                    <div>
                      <span className="block text-slate-400">Fecha Inicio Estimada:</span>
                      <strong className="text-slate-700 font-mono">{selectedStory.startDate || '-'}</strong>
                    </div>
                    <div>
                      <span className="block text-slate-400">Fecha Compromiso (UAT):</span>
                      <strong className="text-slate-700 font-mono text-red-600">{selectedStory.dueDate || '-'}</strong>
                    </div>
                    <div>
                      <span className="block text-slate-400">Fecha Cierre:</span>
                      <strong className="text-slate-700 font-mono text-emerald-700">{selectedStory.endDate || '-'}</strong>
                    </div>
                  </div>
                </div>
              )}

              {/* TABS: DEFINITIONS CHECKS REMOVED */}

              {/* TABS: ACCEPTANCE CRITERIA */}
              {detailTab === 'accept' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border">
                    <span className="text-xs text-slate-500 font-bold">Porcentaje de Criterios Cumplidos:</span>
                    <strong className="text-teal-700 font-mono text-sm">{getAcceptanceCriteriaMetPercent(selectedStory)}%</strong>
                  </div>

                  <div className="space-y-3">
                    {selectedStory.acceptanceCriteria.map(crit => (
                      <div key={crit.id} className="bg-white border rounded-xl p-4 text-xs space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="font-black text-teal-700 uppercase">Criterio #{crit.number} - [{crit.type}]</span>
                          <div className="flex items-center gap-1.5">
                            {(['Pendiente', 'Cumple', 'No cumple', 'No aplica'] as AcceptanceCriterion['status'][]).map(st => (
                              <button
                                key={st}
                                type="button"
                                disabled={currentRole === 'CONSULTA' || (currentRole === 'DEVELOPER' && st === 'Cumple')}
                                onClick={() => toggleCritStatus(crit.id, st)}
                                className={`px-2.5 py-1 text-[10px] font-bold rounded cursor-pointer ${
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

                        <p className="text-slate-800 font-bold">{crit.description}</p>
                        {crit.expectedResult && (
                          <div className="p-2.5 bg-slate-50 rounded border border-slate-150 text-slate-600">
                            <strong>Resultado Esperado:</strong> {crit.expectedResult}
                          </div>
                        )}
                        {crit.validatedBy && (
                          <span className="block text-[10px] text-slate-400 font-mono">
                            ✔️ Aprobado de conformidad por {crit.validatedBy} el {crit.validatedAt}
                          </span>
                        )}
                      </div>
                    ))}
                    {selectedStory.acceptanceCriteria.length === 0 && <span className="text-slate-400 italic block py-4 text-center text-xs">No hay criterios registrados. Cree uno abajo.</span>}
                  </div>

                  {/* Add Acceptance Criteria inline form */}
                  {currentRole !== 'CONSULTA' && (
                    <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-4 space-y-3.5">
                      <h5 className="font-bold text-slate-830 text-xs tracking-tight">Agregar Criterio de Aceptación</h5>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[9.5px] font-bold uppercase text-slate-500">Descripción*</label>
                          <input
                            type="text"
                            required
                            placeholder="El listado debe ordenar ascendente..."
                            value={newCritDesc}
                            onChange={e => setNewCritDesc(e.target.value)}
                            className="w-full bg-white border rounded px-2.5 py-1.5 text-xs text-slate-800 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[9.5px] font-bold uppercase text-slate-500">Tipo de criterio</label>
                          <select
                            value={newCritType}
                            onChange={e => setNewCritType(e.target.value as any)}
                            className="w-full bg-white border rounded px-2.5 py-1.5 text-xs text-slate-800"
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
                          <label className="block text-[9.5px] font-bold uppercase text-slate-500">Resultado esperado de prueba técnica</label>
                          <input
                            type="text"
                            placeholder="Código devuelto 200 HTTP OK con payload cifrado."
                            value={newCritExpected}
                            onChange={e => setNewCritExpected(e.target.value)}
                            className="w-full bg-white border rounded px-2.5 py-1.5 text-xs text-slate-800 outline-none"
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleAddCrit}
                        className="bg-slate-900 text-white font-bold text-xs px-4 py-1.5 rounded cursor-pointer shadow-3xs"
                      >
                        Insertar Criterio
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* TABS: TECHNICAL DATA */}
              {detailTab === 'technical' && (
                <div className="space-y-4">
                  <div className="bg-slate-50 border p-5 rounded-2xl grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-medium">
                    <div className="md:col-span-2">
                      <span className="block text-slate-400 font-bold uppercase text-[9px] mb-1">Descripción técnica de afectación</span>
                      <p className="text-slate-850 p-3 bg-white border rounded">
                        {selectedStory.technicalCriteria?.description || 'El cálculo síncrono consulta ST_INVENTORY_WEEKLY_PROJECTION con validación JWT.'}
                      </p>
                    </div>
                    <div>
                      <span className="block text-slate-400 uppercase text-[8.5px]">Componente de código afectado</span>
                      <strong className="text-slate-700 font-mono">{selectedStory.technicalCriteria?.component || 'DemandForecastEngine.ts'}</strong>
                    </div>
                    <div>
                      <span className="block text-slate-400 uppercase text-[8.5px]">API relacionada / Endpoint REST</span>
                      <strong className="text-slate-700 font-mono">{selectedStory.technicalCriteria?.api || '/api/v1/projects/proj-1/forecast-steel'}</strong>
                    </div>
                    <div>
                      <span className="block text-slate-400 uppercase text-[8.5px]">Objeto Base de Datos relacional</span>
                      <strong className="text-slate-700 font-mono">{selectedStory.technicalCriteria?.databaseObject || 'ST_INVENTORY_WEEKLY_PROJECTION'}</strong>
                    </div>
                    <div>
                      <span className="block text-slate-400 uppercase text-[8.5px]">Logs Requeridos de auditoría</span>
                      <strong className="text-slate-700 font-mono">{selectedStory.technicalCriteria?.logsRequired || 'Audit Log de transacciones.'}</strong>
                    </div>
                  </div>

                  {/* Dependencies view list */}
                  <div className="bg-white border rounded-xl p-4">
                    <h5 className="font-extrabold text-xs text-slate-800 mb-2 uppercase">Dependencias Registradas</h5>
                    <div className="divide-y text-xs">
                      {selectedStory.dependencies.map(dep => {
                        const target = stories.find(st => st.id === dep.targetStoryId);
                        return (
                          <div key={dep.id} className="py-2 flex justify-between items-center">
                            <div>
                              <strong className="text-slate-700 font-mono">[{dep.dependencyType}]</strong> con {target ? target.code : 'Historia ID externa'}: {target ? target.title : 'External Title'}
                              <p className="text-slate-400 font-medium text-[11px]">{dep.description}</p>
                            </div>
                            <span className={`px-2 py-0.5 rounded font-bold text-[9px] ${
                              target?.status === 'Cerrada' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700 animate-pulse'
                            }`}>
                              {target ? target.status : 'Desconocido'}
                            </span>
                          </div>
                        );
                      })}
                      {selectedStory.dependencies.length === 0 && <span className="text-slate-400 italic block py-2 text-center text-xs">No tiene dependencias asignadas.</span>}
                    </div>
                  </div>
                </div>
              )}

              {/* TABS: COMMENTS AND ATTACHMENTS */}
              {detailTab === 'attachments' && (
                <div className="space-y-6">
                  {/* Attachments & simulated documents gallery */}
                  <div className="bg-white border rounded-xl p-4 space-y-4">
                    <div className="flex justify-between items-center mb-1">
                      <h5 className="font-bold text-slate-800 text-xs uppercase">Documentación, Imágenes & Evidencias</h5>
                      <button 
                        onClick={handleSimulateAttachment}
                        disabled={currentRole === 'CONSULTA'}
                        className="bg-slate-100 hover:bg-slate-200 border text-slate-700 font-bold text-[10px] px-3 py-1 rounded cursor-pointer transition flex items-center gap-1"
                      >
                        <Paperclip className="w-3.5 h-3.5 text-slate-500" />
                        Simular Adjunto
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {selectedStory.attachments.map(att => (
                        <div key={att.id} className="bg-slate-50 border p-3 rounded-lg flex items-center gap-3">
                          <div className="w-8 h-8 bg-teal-500/10 text-teal-600 rounded flex items-center justify-center shrink-0 border border-teal-500/20">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div className="text-xs truncate">
                            <strong className="text-slate-700 block truncate">{att.fileName}</strong>
                            <span className="block text-[10px] text-slate-450 mt-0.5">{att.fileType} | Subido por {att.uploadedBy}</span>
                          </div>
                        </div>
                      ))}
                      {selectedStory.attachments.length === 0 && (
                        <div className="col-span-2 text-center p-6 text-slate-400 italic text-xs">No hay entregables o registros de pruebas en la bitácora.</div>
                      )}
                    </div>
                  </div>

                  {/* Tracing comments block */}
                  <div className="space-y-4">
                    <h5 className="font-bold text-slate-800 text-xs uppercase border-b pb-2">Comentarios Técnicos y Historial de Hilos</h5>
                    <div className="space-y-3.5">
                      {selectedStory.comments.map(com => (
                        <div key={com.id} className="bg-slate-50 border rounded-xl p-4 text-xs space-y-1.5 relative">
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
                          <p className="text-slate-700 leading-relaxed font-medium pt-1">{com.text}</p>
                        </div>
                      ))}
                    </div>

                    {currentRole !== 'CONSULTA' && (
                      <div className="bg-slate-100 p-4 rounded-xl space-y-3">
                        <span className="block text-[10px] font-bold text-slate-600 uppercase">Nuevo Comentario de Bitácora</span>
                        <div className="flex gap-2">
                          <select
                            value={newCommentType}
                            onChange={e => setNewCommentType(e.target.value as any)}
                            className="bg-white border rounded px-2 py-1 text-xs text-slate-700 font-bold focus:outline-none"
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
                            className="flex-1 bg-white border rounded px-3 py-2 text-xs outline-none"
                          />
                          <button
                            type="button"
                            onClick={handleAddComment}
                            className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2 rounded shadow-3xs cursor-pointer"
                          >
                            Publicar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
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
              >
                <Trash2 className="w-4 h-4" /> Eliminar (Solo Admin)
              </button>

              <button
                type="button"
                onClick={() => setIsDetailOpen(false)}
                className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs px-5 py-2 rounded-xl transition cursor-pointer shadow-3xs"
              >
                Listo
              </button>
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

    </div>
  );
}
