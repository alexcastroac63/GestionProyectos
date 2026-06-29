/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { User } from '../../types';
import {
  ChevronRight,
  ChevronDown,
  Plus,
  Trash2,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Paperclip,
  MessageSquare,
  Search,
  Filter,
  Download,
  FileSpreadsheet,
  Printer,
  TrendingUp,
  Sparkles,
  Database,
  BookOpen,
  ShieldCheck,
  History,
  X,
  Layers,
  Edit2,
  AlertCircle,
  HelpCircle,
  Info
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useSystemStore } from '../../app/AppProviders';

// --- Types ---
export interface WBSItem {
  id: string;
  projectId: string;
  parentId?: string; // Reference to Phase or Module or Task parent
  level: 'MODULO' | 'TAREA' | 'SUBTAREA' | 'SUBSUBTAREA';
  name: string;
  assignedToId?: string; // References User
  startDate: string;
  endDate: string;
  durationDays: number;
  progress: number; // 0 - 100
  priority: 'ALTA' | 'MEDIA' | 'BAJA';
  status: 'PENDIENTE' | 'EN_CURSO' | 'COMPLETADA' | 'BLOQUEADO';
  dependsOnId?: string; // Dependency task ID
  dependsOnIds?: string[]; // Multiple dependency task IDs
  comments: WBSComment[];
  evidenceFiles: WBSEvidence[];
  sprintId?: string; // Associated Sprint
}

export interface WBSComment {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  text: string;
  timestamp: string;
}

export interface WBSEvidence {
  id: string;
  fileName: string;
  fileSize: string;
  uploadedAt: string;
  uploadedBy: string;
  externalUrl?: string;
  rawBase64?: string;
}

// Module-level in-memory cache to bypass localStorage quota limits during active session
const wbsFileInMemoryCache = new Map<string, string>();


export interface WBSBaseline {
  id: string;
  savedAt: string;
  savedBy: string;
  itemsSnapshot: {
    id: string;
    startDate: string;
    endDate: string;
    progress: number;
  }[];
}

interface ProjectWBSManagerProps {
  projectId: string;
  users: User[];
  addLog: (user: string, text: string) => void;
  isDevRole?: boolean;
  sprints?: any[];
}

// --- Dynamic Dummy Data Builder ---
export const getInitialWBSItems = (projectId: string): WBSItem[] => {
  return [
    // MODULO 1 (anterior FASE I)
    {
      id: 'item-f1',
      projectId,
      level: 'MODULO',
      name: 'Módulo I: Requerimientos, Análisis y Base de Datos',
      startDate: '2026-05-15',
      endDate: '2026-05-24',
      durationDays: 10,
      progress: 100,
      priority: 'ALTA',
      status: 'COMPLETADA',
      comments: [],
      evidenceFiles: []
    },
    {
      id: 'item-f1-m1',
      projectId,
      parentId: 'item-f1',
      level: 'TAREA',
      name: 'Tarea: Arquitectura de Persistencia PostgreSQL',
      startDate: '2026-05-15',
      endDate: '2026-05-19',
      durationDays: 5,
      progress: 100,
      priority: 'ALTA',
      status: 'COMPLETADA',
      comments: [],
      evidenceFiles: []
    },
    {
      id: 'item-f1-m1-t1',
      projectId,
      parentId: 'item-f1-m1',
      level: 'SUBTAREA',
      name: 'Diseño del Modelo Entidad-Relación y Schemas en Drizzle',
      assignedToId: 'u-2', // Carlos Pérez
      startDate: '2026-05-15',
      endDate: '2026-05-17',
      durationDays: 3,
      progress: 100,
      priority: 'ALTA',
      status: 'COMPLETADA',
      dependsOnId: undefined,
      comments: [
        {
          id: 'c-1',
          userId: 'u-2',
          userName: 'Carlos Pérez',
          userRole: 'Analista DevOps / DBA',
          text: 'Esquema PostgreSQL optimizado para multi-inquilino guardado satisfactoriamente.',
          timestamp: '2026-05-16 14:32'
        }
      ],
      evidenceFiles: [
        {
          id: 'ev-1',
          fileName: 'schema_v1_postgres.sql',
          fileSize: '45 KB',
          uploadedAt: '2026-05-16 11:20',
          uploadedBy: 'Carlos Pérez'
        }
      ]
    },
    {
      id: 'item-f1-m1-t1-s1',
      projectId,
      parentId: 'item-f1-m1-t1',
      level: 'SUBSUBTAREA',
      name: 'Definir llaves foráneas y constraints de integridad',
      assignedToId: 'u-2',
      startDate: '2026-05-15',
      endDate: '2026-05-16',
      durationDays: 2,
      progress: 100,
      priority: 'MEDIA',
      status: 'COMPLETADA',
      comments: [],
      evidenceFiles: []
    },
    {
      id: 'item-f1-m1-t1-s2',
      projectId,
      parentId: 'item-f1-m1-t1',
      level: 'SUBSUBTAREA',
      name: 'Guardar scripts SQL en repositorio para control de cambios',
      assignedToId: 'u-2',
      startDate: '2026-05-16',
      endDate: '2026-05-17',
      durationDays: 1,
      progress: 100,
      priority: 'MEDIA',
      status: 'COMPLETADA',
      comments: [],
      evidenceFiles: []
    },
    {
      id: 'item-f1-m2',
      projectId,
      parentId: 'item-f1',
      level: 'TAREA',
      name: 'Tarea: Definición de Casos de Uso y Backlog',
      startDate: '2026-05-20',
      endDate: '2026-05-24',
      durationDays: 5,
      progress: 100,
      priority: 'MEDIA',
      status: 'COMPLETADA',
      comments: [],
      evidenceFiles: []
    },
    {
      id: 'item-f1-m2-t1',
      projectId,
      parentId: 'item-f1-m2',
      level: 'SUBTAREA',
      name: 'Reunión de alineación con el cliente para aprobación de Historias',
      assignedToId: 'u-4', // Mateo Herrera PO
      startDate: '2026-05-20',
      endDate: '2026-05-22',
      durationDays: 3,
      progress: 100,
      priority: 'ALTA',
      status: 'COMPLETADA',
      comments: [],
      evidenceFiles: [
        {
          id: 'ev-2',
          fileName: 'minuta_aprobacion_alcance.pdf',
          fileSize: '1.2 MB',
          uploadedAt: '2026-05-21 16:45',
          uploadedBy: 'Sofía Castro'
        }
      ]
    },

    // MODULO 2 (anterior FASE II)
    {
      id: 'item-f2',
      projectId,
      level: 'MODULO',
      name: 'Módulo II: Diseño Visual, UI y Mockups Interactivos',
      startDate: '2026-05-25',
      endDate: '2026-06-03',
      durationDays: 10,
      progress: 80,
      priority: 'MEDIA',
      status: 'EN_CURSO',
      comments: [],
      evidenceFiles: []
    },
    {
      id: 'item-f2-m1',
      projectId,
      parentId: 'item-f2',
      level: 'TAREA',
      name: 'Tarea: Prototipado y Definición Visual en Lienzo',
      startDate: '2026-05-25',
      endDate: '2026-06-03',
      durationDays: 10,
      progress: 80,
      priority: 'MEDIA',
      status: 'EN_CURSO',
      comments: [],
      evidenceFiles: []
    },
    {
      id: 'item-f2-m1-t1',
      projectId,
      parentId: 'item-f2-m1',
      level: 'SUBTAREA',
      name: 'Diseñar el Mockup interactivo y flujos del Kanban Scrum',
      assignedToId: 'u-3', // Sofía Ramírez PO / UX
      startDate: '2026-05-25',
      endDate: '2026-05-30',
      durationDays: 6,
      progress: 100,
      priority: 'ALTA',
      status: 'COMPLETADA',
      comments: [],
      evidenceFiles: []
    },
    {
      id: 'item-f2-m1-t2',
      projectId,
      parentId: 'item-f2-m1',
      level: 'SUBTAREA',
      name: 'Diseño del Módulo de Cronograma y Pantallas de Reportes en Figma',
      assignedToId: 'u-3',
      startDate: '2026-05-31',
      endDate: '2026-06-03',
      durationDays: 4,
      progress: 50,
      priority: 'MEDIA',
      status: 'EN_CURSO',
      dependsOnId: 'item-f2-m1-t1',
      comments: [
        {
          id: 'c-figma',
          userId: 'u-3',
          userName: 'Sofía Ramírez',
          userRole: 'Diseñadora UI/UX',
          text: 'Falta definir la cuadrícula editable responsive para pantallas móviles muy pequeñas.',
          timestamp: '2026-06-01 10:15'
        }
      ],
      evidenceFiles: []
    },

    // MODULO 3 (anterior FASE III)
    {
      id: 'item-f3',
      projectId,
      level: 'MODULO',
      name: 'Módulo III: Desarrollo de API REST, Kanban y Cuadrícula',
      startDate: '2026-06-04',
      endDate: '2026-06-18',
      durationDays: 15,
      progress: 25,
      priority: 'ALTA',
      status: 'EN_CURSO',
      comments: [],
      evidenceFiles: []
    },
    {
      id: 'item-f3-m1',
      projectId, parentId: 'item-f3',
      level: 'TAREA',
      name: 'Tarea: Lógica de Negocio y Endpoints del Servidor',
      startDate: '2026-06-04',
      endDate: '2026-06-12',
      durationDays: 9,
      progress: 40,
      priority: 'ALTA',
      status: 'EN_CURSO',
      comments: [],
      evidenceFiles: []
    },
    {
      id: 'item-f3-m1-t1',
      projectId, parentId: 'item-f3-m1',
      level: 'SUBTAREA',
      name: 'Escribir Controladores Express para persistir Fases, Tareas y Subtareas',
      assignedToId: 'u-2', // Carlos Pérez
      startDate: '2026-06-04',
      endDate: '2026-06-08',
      durationDays: 5,
      progress: 80,
      priority: 'ALTA',
      status: 'EN_CURSO',
      comments: [],
      evidenceFiles: []
    },
    {
      id: 'item-f3-m1-t2',
      projectId, parentId: 'item-f3-m1',
      level: 'SUBTAREA',
      name: 'Implementar cálculo automático de hitos, desviaciones y línea base',
      assignedToId: 'u-6', // Andrés Mendoza
      startDate: '2026-06-09',
      endDate: '2026-06-12',
      durationDays: 4,
      progress: 0,
      priority: 'MEDIA',
      status: 'PENDIENTE',
      dependsOnId: 'item-f3-m1-t1',
      comments: [],
      evidenceFiles: []
    },
    {
      id: 'item-f3-m2',
      projectId, parentId: 'item-f3',
      level: 'TAREA',
      name: 'Tarea: UI Cuadrícula Editable y Gantt SVG',
      startDate: '2026-06-10',
      endDate: '2026-06-18',
      durationDays: 9,
      progress: 10,
      priority: 'ALTA',
      status: 'PENDIENTE',
      comments: [],
      evidenceFiles: []
    },
    {
      id: 'item-f3-m2-t1',
      projectId, parentId: 'item-f3-m2',
      level: 'SUBTAREA',
      name: 'Implementar controles interactivos en la cuadrícula y panel de detalle',
      assignedToId: 'u-6',
      startDate: '2026-06-10',
      endDate: '2026-06-14',
      durationDays: 5,
      progress: 20,
      priority: 'ALTA',
      status: 'EN_CURSO',
      comments: [],
      evidenceFiles: []
    },
    {
      id: 'item-f3-m2-t2',
      projectId, parentId: 'item-f3-m2',
      level: 'SUBTAREA',
      name: 'Visualización doble de cronograma (Línea Base vs Real)',
      assignedToId: 'u-6',
      startDate: '2026-06-15',
      endDate: '2026-06-18',
      durationDays: 4,
      progress: 0,
      priority: 'ALTA',
      status: 'PENDIENTE',
      dependsOnId: 'item-f3-m2-t1',
      comments: [],
      evidenceFiles: []
    },

    // MODULO 4 (anterior FASE IV)
    {
      id: 'item-f4',
      projectId,
      level: 'MODULO',
      name: 'Módulo IV: Aseguramiento de Calidad y Suite QA / Pruebas',
      startDate: '2026-06-19',
      endDate: '2026-06-25',
      durationDays: 7,
      progress: 0,
      priority: 'MEDIA',
      status: 'PENDIENTE',
      comments: [],
      evidenceFiles: []
    },

    // MODULO 5 (anterior FASE V)
    {
      id: 'item-f5',
      projectId,
      level: 'MODULO',
      name: 'Módulo V: DevOps, Telemetría y Despliegue en Producción',
      startDate: '2026-06-26',
      endDate: '2026-07-05',
      durationDays: 10,
      progress: 0,
      priority: 'MEDIA',
      status: 'PENDIENTE',
      comments: [],
      evidenceFiles: []
    },
    {
      id: 'item-f5-m1',
      projectId, parentId: 'item-f5',
      level: 'TAREA',
      name: 'Tarea: Canalización Automatizada de Despliegue',
      startDate: '2026-06-26',
      endDate: '2026-06-30',
      durationDays: 5,
      progress: 0,
      priority: 'MEDIA',
      status: 'PENDIENTE',
      comments: [],
      evidenceFiles: []
    },
    {
      id: 'item-f5-m1-t1',
      projectId, parentId: 'item-f5-m1',
      level: 'SUBTAREA',
      name: 'Simulador intermitente de ejecución de pipeline (Build, Unit Testing, Docker)',
      assignedToId: 'u-1', // Carlos Pérez
      startDate: '2026-06-26',
      endDate: '2026-06-28',
      durationDays: 3,
      progress: 0,
      priority: 'ALTA',
      status: 'PENDIENTE',
      comments: [],
      evidenceFiles: []
    },
    {
      id: 'item-f5-m1-t2',
      projectId, parentId: 'item-f5-m1',
      level: 'SUBTAREA',
      name: 'Alineación de puerto único y orquestador local en docker-compose',
      assignedToId: 'u-4', // Alex Castro (DevOps)
      startDate: '2026-06-29',
      endDate: '2026-06-30',
      durationDays: 2,
      progress: 0,
      priority: 'MEDIA',
      status: 'PENDIENTE',
      comments: [],
      evidenceFiles: []
    },
    {
      id: 'item-f5-m2',
      projectId, parentId: 'item-f5',
      level: 'TAREA',
      name: 'Tarea: Telemetría y Almacenamiento Seguro Cloud',
      startDate: '2026-07-01',
      endDate: '2026-07-05',
      durationDays: 5,
      progress: 0,
      priority: 'MEDIA',
      status: 'PENDIENTE',
      comments: [],
      evidenceFiles: []
    },
    {
      id: 'item-f5-m2-t1',
      projectId, parentId: 'item-f5-m2',
      level: 'SUBTAREA',
      name: 'Consolidación de métricas deterministas de contenedores',
      assignedToId: 'u-4', // Alex Castro
      startDate: '2026-07-01',
      endDate: '2026-07-03',
      durationDays: 3,
      progress: 0,
      priority: 'ALTA',
      status: 'PENDIENTE',
      comments: [],
      evidenceFiles: []
    },
    {
      id: 'item-f5-m2-t2',
      projectId, parentId: 'item-f5-m2',
      level: 'SUBTAREA',
      name: 'Simulación del Bucket local utilizando ETag criptográfico',
      assignedToId: 'u-4', // Alex Castro
      startDate: '2026-07-04',
      endDate: '2026-07-05',
      durationDays: 2,
      progress: 0,
      priority: 'BAJA',
      status: 'PENDIENTE',
      comments: [],
      evidenceFiles: []
    }
  ];
};

export default function ProjectWBSManager({ projectId, users, addLog, isDevRole = false, sprints = [] }: ProjectWBSManagerProps) {
  const { loggedInUser } = useSystemStore();

  const currentUserDisplayName = useMemo(() => {
    if (loggedInUser) {
      return `${loggedInUser.first_name} ${loggedInUser.last_name} (${loggedInUser.role})`;
    }
    return 'Carlos Pérez (PM)';
  }, [loggedInUser]);

  const getTransactionDateTime = () => {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
  };

  const saveCustomFilesToLocalStorage = (files: any[]) => {
    try {
      localStorage.setItem('gcp_storage_custom_files', JSON.stringify(files));
      return;
    } catch (e) {
      if (files.length > 1) {
        const pruned = files.map((item, index) => {
          if (index === files.length - 1) {
            return item;
          }
          return { ...item, raw_base64: undefined };
        });
        try {
          localStorage.setItem('gcp_storage_custom_files', JSON.stringify(pruned));
          return;
        } catch (inner) {}
      }

      const allPruned = files.map(item => ({ ...item, raw_base64: undefined }));
      try {
        localStorage.setItem('gcp_storage_custom_files', JSON.stringify(allPruned));
        return;
      } catch (inner) {}

      if (allPruned.length > 5) {
        try {
          localStorage.setItem('gcp_storage_custom_files', JSON.stringify(allPruned.slice(-5)));
          return;
        } catch (inner) {}
      }
    }
  };

  // --- States ---
  const [items, setItems] = useState<WBSItem[]>(() => {
    const key = `wbs_tasks_${projectId}`;
    const cached = localStorage.getItem(key);
    if (cached && cached !== "null" && cached !== "undefined") {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch (e) {
        console.error("Error reading wbs cache", e);
      }
    }
    return getInitialWBSItems(projectId);
  });

  const [baselines, setBaselines] = useState<WBSBaseline[]>(() => {
    const key = `wbs_baselines_${projectId}`;
    const cached = localStorage.getItem(key);
    if (cached && cached !== "null" && cached !== "undefined") {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch (e) {
        console.error("Error reading baselines cache", e);
      }
    }
    // Pre-calculate one initial baseline to show the feature out of the box
    return [
      {
        id: 'bs-initial',
        savedAt: '2026-05-14 09:00',
        savedBy: 'Carlos Pérez (PM)',
        itemsSnapshot: getInitialWBSItems(projectId).map(it => ({
          id: it.id,
          startDate: it.startDate,
          // simulated small baseline change so there is visual deviation
          endDate: it.endDate === '2026-06-03' ? '2026-05-31' : it.endDate, 
          progress: 0 // initially clean
        }))
      }
    ];
  });

  const [selectedBaselineId, setSelectedBaselineId] = useState<string>('bs-initial');

  // Interactive filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterResponsible, setFilterResponsible] = useState<string>('ALL');

  const projectSprints = sprints.filter((s: any) => s.project_id === projectId);

  // Expansion levels
  const [expandedItemIds, setExpandedItemIds] = useState<Record<string, boolean>>({
    'item-f1': true,
    'item-f1-m1': true,
    'item-f1-m1-t1': true,
    'item-f2': true,
    'item-f2-m1': true,
    'item-f3': true,
    'item-f3-m1': true,
    'item-f3-m2': true
  });

  // Selected item for the right-side detail drawer
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  
  // Custom View Tabs (Cuadrícula, Gráfico de Gantt)
  const [wbsTab, setWbsTab] = useState<'grid' | 'gantt'>('grid');
  
  // Custom Gantt Chart Scale (Días, Semanas, Meses)
  const [ganttScale, setGanttScale] = useState<'dias' | 'semanas' | 'meses'>('dias');

  // Drawer auxiliary states
  const [newCommentText, setNewCommentText] = useState('');
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [wbsAttachmentMode, setWbsAttachmentMode] = useState<'file' | 'link'>('file');
  const [wbsSupportUrl, setWbsSupportUrl] = useState('');

  // Custom confirmation modal state to bypass iframe window.confirm blocks
  const [deleteConfirmState, setDeleteConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  // Drag and drop states
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [dragOverItemId, setDragOverItemId] = useState<string | null>(null);
  const [dropPosition, setDropPosition] = useState<'above' | 'inside' | 'below' | null>(null);

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; itemId: string } | null>(null);

  // Double-click edit modal states
  const [editingSubtaskId, setEditingSubtaskId] = useState<string | null>(null);
  const [draftSubtask, setDraftSubtask] = useState<WBSItem | null>(null);

  const [sidebarDepSearch, setSidebarDepSearch] = useState('');
  const [modalDepSearch, setModalDepSearch] = useState('');

  // --- Calculate WBS Codes (hierarchical outline numbers / correlativos) ---
  const wbsNumbers: Record<string, string> = useMemo(() => {
    const result: Record<string, string> = {};
    
    // Roots are items with no parentId OR parentId that does not exist in items list
    const roots = items.filter(it => !it.parentId || !items.some(p => p.id === it.parentId));
    
    // Group children by parentId
    const childrenMap: Record<string, WBSItem[]> = {};
    items.forEach(it => {
      if (it.parentId) {
        if (!childrenMap[it.parentId]) {
          childrenMap[it.parentId] = [];
        }
        childrenMap[it.parentId].push(it);
      }
    });

    // We sort children based on their original index in the flat items array to preserve visual/dragged order
    const orderMap = new Map<string, number>();
    items.forEach((it, idx) => {
      orderMap.set(it.id, idx);
    });

    const sortChildrenByOrder = (list: WBSItem[]) => {
      return [...list].sort((a, b) => (orderMap.get(a.id) || 0) - (orderMap.get(b.id) || 0));
    };

    const sortedRoots = sortChildrenByOrder(roots);

    const traverse = (node: WBSItem, prefix: string) => {
      result[node.id] = prefix;
      const children = childrenMap[node.id] || [];
      const sortedChildren = sortChildrenByOrder(children);
      sortedChildren.forEach((child, idx) => {
        traverse(child, `${prefix}.${idx + 1}`);
      });
    };

    sortedRoots.forEach((root, idx) => {
      traverse(root, `${idx + 1}`);
    });

    return result;
  }, [items]);

  const handleUpdateDraftField = (field: keyof WBSItem, value: any) => {
    if (!draftSubtask) return;
    setDraftSubtask(prev => {
      if (!prev) return null;
      const updated = {
        ...prev,
        [field]: value
      };
      if (field === 'dependsOnIds') {
        const arr = Array.isArray(value) ? value : [];
        updated.dependsOnId = arr.length > 0 ? arr[0] : undefined;
      }
      return updated;
    });
  };

  const handleSaveSubtaskDraft = () => {
    if (!draftSubtask) return;
    if (isDevRole) {
      alert('Modificación de WBS bloqueada en base a privilegios de Desarrollo.');
      return;
    }

    // Double check end date >= start date validation
    if (draftSubtask.startDate && draftSubtask.endDate) {
      const parseDateString = (str: string): Date => {
        if (!str) return new Date();
        let parts = str.split('-');
        if (parts.length === 3) {
          if (parts[0].length === 4) {
            return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
          } else if (parts[2].length === 4) {
            return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
          }
        }
        parts = str.split('/');
        if (parts.length === 3) {
          if (parts[0].length === 4) {
            return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
          } else if (parts[2].length === 4) {
            return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
          }
        }
        return new Date(str);
      };

      const sTime = parseDateString(draftSubtask.startDate).getTime();
      const eTime = parseDateString(draftSubtask.endDate).getTime();

      if (!isNaN(sTime) && !isNaN(eTime) && eTime < sTime) {
        alert('Error: La fecha de entrega (fecha fin) debe ser mayor o igual a la fecha de inicio.');
        return;
      }
    }

    // Now update items and recalculate
    setItems(prev => {
      const copy = prev.map(it => {
        if (it.id === draftSubtask.id) {
          return { ...draftSubtask };
        }
        return it;
      });
      return handleRecalculateProgress(copy);
    });

    if (addLog) {
      addLog(currentUserDisplayName, `Modificó subtarea en Ventana Emergente: ${draftSubtask.name}`);
    }

    // Close the modal
    setEditingSubtaskId(null);
    setDraftSubtask(null);
  };

  // Global click listener to close context menu
  useEffect(() => {
    const handleGlobalClick = () => {
      setContextMenu(null);
    };
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  // Check if an item is a descendant of another
  const isDescendant = (pId: string, cId: string): boolean => {
    let curr = items.find(it => it.id === cId);
    while (curr && curr.parentId) {
      if (curr.parentId === pId) return true;
      curr = items.find(it => it.id === curr.parentId);
    }
    return false;
  };

  // Drag move reordering logic
  const dragMoveItem = (draggedId: string, targetId: string, position: 'above' | 'inside' | 'below') => {
    if (draggedId === targetId) return;
    if (isDescendant(draggedId, targetId)) {
      alert("No se puede mover un elemento dentro de uno de sus descendientes.");
      return;
    }

    setItems(prev => {
      const list = [...prev];
      const draggedIdx = list.findIndex(it => it.id === draggedId);
      if (draggedIdx === -1) return prev;
      const draggedItem = { ...list[draggedIdx] };

      // Remove dragged item from the list
      list.splice(draggedIdx, 1);

      // Find target index in remaining list
      const targetIdx = list.findIndex(it => it.id === targetId);
      if (targetIdx === -1) return prev;

      const targetItem = list[targetIdx];

      if (position === 'inside') {
        // Drop inside
        draggedItem.parentId = targetItem.id;
        if (targetItem.level === 'MODULO') {
          draggedItem.level = 'TAREA';
        } else if (targetItem.level === 'TAREA') {
          draggedItem.level = 'SUBTAREA';
        } else if (targetItem.level === 'SUBTAREA' || targetItem.level === 'SUBSUBTAREA') {
          draggedItem.level = 'SUBSUBTAREA';
        }
        // Insert right after target
        list.splice(targetIdx + 1, 0, draggedItem);
      } else {
        // Sibling
        draggedItem.parentId = targetItem.parentId;
        draggedItem.level = targetItem.level; // adopt target level
        const insertIdx = position === 'above' ? targetIdx : targetIdx + 1;
        list.splice(insertIdx, 0, draggedItem);
      }

      return handleRecalculateProgress(list);
    });

    addLog(currentUserDisplayName, `Reordenó y colocó el requerimiento por arrastre.`);
  };

  const handleDragOverRow = (e: React.DragEvent<HTMLTableRowElement>, targetItem: WBSItem) => {
    if (!draggedItemId || draggedItemId === targetItem.id) return;
    
    // Calculate vertical coordinate relative to row
    const rect = e.currentTarget.getBoundingClientRect();
    const relativeY = e.clientY - rect.top;
    const height = rect.height;

    let pos: 'above' | 'inside' | 'below' = 'inside';
    if (relativeY < height * 0.3) {
      pos = 'above';
    } else if (relativeY > height * 0.7) {
      pos = 'below';
    }

    setDragOverItemId(targetItem.id);
    setDropPosition(pos);
  };

  const handleDropRow = (e: React.DragEvent<HTMLTableRowElement>, targetItem: WBSItem) => {
    if (!draggedItemId) return;
    dragMoveItem(draggedItemId, targetItem.id, dropPosition || 'inside');
    setDraggedItemId(null);
    setDragOverItemId(null);
    setDropPosition(null);
  };

  // Convert level
  const handleConvertLevel = (id: string, newLevel: 'MODULO' | 'TAREA' | 'SUBTAREA' | 'SUBSUBTAREA') => {
    if (isDevRole) {
      alert('Modificación de WBS bloqueada en base a privilegios de Desarrollo.');
      return;
    }
    setItems(prev => {
      const list = prev.map(it => {
        if (it.id === id) {
          let parentId = it.parentId;
          if (newLevel === 'MODULO') {
            parentId = undefined;
          }
          return {
            ...it,
            level: newLevel,
            parentId
          };
        }
        return it;
      });
      return handleRecalculateProgress(list);
    });
    addLog(currentUserDisplayName, `Convertió el tipo de elemento del cronograma a ${newLevel}.`);
  };

  // Indent and Outdent structural buttons/menu
  const handleIndentOutdent = (id: string, action: 'indent' | 'outdent') => {
    if (isDevRole) {
      alert('Modificación de WBS bloqueada en base a privilegios de Desarrollo.');
      return;
    }

    let prevIdToExpand: string | null = null;
    const idx = items.findIndex(it => it.id === id);
    if (idx !== -1 && action === 'indent' && idx > 0) {
      const prevItem = items[idx - 1];
      if (prevItem.id !== id && !isDescendant(id, prevItem.id)) {
        prevIdToExpand = prevItem.id;
      }
    }

    setItems(prev => {
      const idx = prev.findIndex(it => it.id === id);
      if (idx === -1) return prev;
      
      const list = [...prev];
      const item = { ...list[idx] };
      
      if (action === 'indent') {
        if (idx > 0) {
          const prevItem = list[idx - 1];
          if (prevItem.id !== item.id && !isDescendant(item.id, prevItem.id)) {
            item.parentId = prevItem.id;
            if (prevItem.level === 'MODULO') item.level = 'TAREA';
            else if (prevItem.level === 'TAREA') item.level = 'SUBTAREA';
            else if (prevItem.level === 'SUBTAREA' || prevItem.level === 'SUBSUBTAREA') item.level = 'SUBSUBTAREA';
            list[idx] = item;
          }
        }
      } else {
        if (item.parentId) {
          const parent = list.find(it => it.id === item.parentId);
          if (parent) {
            item.parentId = parent.parentId;
            if (parent.level === 'MODULO') {
              item.level = 'MODULO';
              item.parentId = undefined;
            } else if (parent.level === 'TAREA') {
              item.level = 'TAREA';
            } else if (parent.level === 'SUBTAREA') {
              item.level = 'SUBTAREA';
            } else {
              item.level = 'SUBTAREA';
            }
            list[idx] = item;
          }
        }
      }
      
      return handleRecalculateProgress(list);
    });
    
    if (prevIdToExpand) {
      setExpandedItemIds(ex => ({ ...ex, [prevIdToExpand!]: true }));
    }
    
    addLog(currentUserDisplayName, `Ajustó el nivel jerárquico del elemento con acción: ${action}.`);
  };

  // Save WBS items state to localStorage whenever it changes (pruning rawBase64 to keep size within quota)
  useEffect(() => {
    try {
      const prunedItems = items.map(it => {
        if (!it.evidenceFiles || it.evidenceFiles.length === 0) return it;
        return {
          ...it,
          evidenceFiles: it.evidenceFiles.map(ev => ({
            ...ev,
            rawBase64: undefined
          }))
        };
      });
      localStorage.setItem(`wbs_tasks_${projectId}`, JSON.stringify(prunedItems));
    } catch (err) {
      console.error("Failed to save pruned WBS tasks:", err);
    }
  }, [items, projectId]);

  // Load and recalculate items when projectId changes or on initial mount to align subtask dates
  useEffect(() => {
    const key = `wbs_tasks_${projectId}`;
    const cached = localStorage.getItem(key);
    let loadedItems: WBSItem[] | null = null;
    if (cached && cached !== "null" && cached !== "undefined") {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          loadedItems = parsed;
        }
      } catch (e) {
        console.error("Error reading wbs cache", e);
      }
    }
    if (!loadedItems) {
      loadedItems = getInitialWBSItems(projectId);
    }
    setItems(handleRecalculateProgress(loadedItems));
  }, [projectId]);

  // Save baselines state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(`wbs_baselines_${projectId}`, JSON.stringify(baselines));
  }, [baselines, projectId]);

  // Recalculate automatic hierarchical progress (Level-up calculations!)
  // In our model: Subtask changes update Task progress -> Task progress updates Module progress -> Module progress updates Phase progress -> Phase progress updates Project overall.
  /**
   * Recalcula jerárquicamente el progreso (%) y fechas de duración de todos los elementos del WBS.
   * La ponderación sube de Subtarea -> Tarea -> Módulo -> Fase.
   * @param {WBSItem[]} currentItems - Arreglo de ítems WBS previos a la actualización estática.
   * @returns {WBSItem[]} Arreglo de ítems actualizado con cálculos propagados hacia arriba.
   */
  const handleRecalculateProgress = (currentItems: WBSItem[]): WBSItem[] => {
    // Perform a deep map copy of all items in the array to ensure React triggers updates properly
    const updated = currentItems.map(it => ({ ...it }));

    // Parse date safely without timezone-shift, supports both standard YYYY-MM-DD and DD/MM/YYYY
    const parseDateString = (str: string): Date => {
      if (!str) return new Date();
      
      // Support dash separation
      let parts = str.split('-');
      if (parts.length === 3) {
        if (parts[0].length === 4) { // YYYY-MM-DD
          const y = Number(parts[0]);
          const m = Number(parts[1]);
          const d = Number(parts[2]);
          if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
            return new Date(y, m - 1, d);
          }
        } else if (parts[2].length === 4) { // DD-MM-YYYY
          const d = Number(parts[0]);
          const m = Number(parts[1]);
          const y = Number(parts[2]);
          if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
            return new Date(y, m - 1, d);
          }
        }
      }

      // Support slash separation
      parts = str.split('/');
      if (parts.length === 3) {
        if (parts[0].length === 4) { // YYYY/MM/DD
          const y = Number(parts[0]);
          const m = Number(parts[1]);
          const d = Number(parts[2]);
          if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
            return new Date(y, m - 1, d);
          }
        } else if (parts[2].length === 4) { // DD/MM/YYYY
          const d = Number(parts[0]);
          const m = Number(parts[1]);
          const y = Number(parts[2]);
          if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
            return new Date(y, m - 1, d);
          }
        }
      }

      return new Date(str);
    };

    // Format local date back to string
    const formatDateLocal = (d: Date): string => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    // Step A: Rollup dates for SUBTAREAs if they have SUBSUBTAREAs
    updated.forEach(sub => {
      if (sub.level === 'SUBTAREA') {
        const subsubtasks = updated.filter(subsub => subsub.parentId === sub.id && subsub.level === 'SUBSUBTAREA');
        if (subsubtasks.length > 0) {
          const validSubsub = subsubtasks.filter(subsub => {
            if (!subsub.startDate || !subsub.endDate) return false;
            const sTime = parseDateString(subsub.startDate).getTime();
            const eTime = parseDateString(subsub.endDate).getTime();
            return !isNaN(sTime) && !isNaN(eTime);
          });

          if (validSubsub.length > 0) {
            const startTimes = validSubsub.map(subsub => parseDateString(subsub.startDate).getTime());
            const endTimes = validSubsub.map(subsub => parseDateString(subsub.endDate).getTime());
            
            const minStart = new Date(Math.min(...startTimes));
            const maxEnd = new Date(Math.max(...endTimes));

            sub.startDate = formatDateLocal(minStart);
            sub.endDate = formatDateLocal(maxEnd);
          }
        }
      }
    });

    // Step B: Rollup dates for TAREAs if they have SUBTAREAs
    updated.forEach(task => {
      if (task.level === 'TAREA') {
        const subtasks = updated.filter(sub => sub.parentId === task.id && sub.level === 'SUBTAREA');
        if (subtasks.length > 0) {
          const validSubtasks = subtasks.filter(sub => {
            if (!sub.startDate || !sub.endDate) return false;
            const sTime = parseDateString(sub.startDate).getTime();
            const eTime = parseDateString(sub.endDate).getTime();
            return !isNaN(sTime) && !isNaN(eTime);
          });

          if (validSubtasks.length > 0) {
            const startTimes = validSubtasks.map(sub => parseDateString(sub.startDate).getTime());
            const endTimes = validSubtasks.map(sub => parseDateString(sub.endDate).getTime());
            
            const minStart = new Date(Math.min(...startTimes));
            const maxEnd = new Date(Math.max(...endTimes));

            task.startDate = formatDateLocal(minStart);
            task.endDate = formatDateLocal(maxEnd);
          }
        }
      }
    });

    // Step C: Rollup dates for MODULOs if they have TAREAs
    updated.forEach(mod => {
      if (mod.level === 'MODULO') {
        const tasks = updated.filter(t => t.parentId === mod.id && t.level === 'TAREA');
        if (tasks.length > 0) {
          const validTasks = tasks.filter(t => {
            if (!t.startDate || !t.endDate) return false;
            const sTime = parseDateString(t.startDate).getTime();
            const eTime = parseDateString(t.endDate).getTime();
            return !isNaN(sTime) && !isNaN(eTime);
          });

          if (validTasks.length > 0) {
            const startTimes = validTasks.map(t => parseDateString(t.startDate).getTime());
            const endTimes = validTasks.map(t => parseDateString(t.endDate).getTime());
            
            const minStart = new Date(Math.min(...startTimes));
            const maxEnd = new Date(Math.max(...endTimes));

            mod.startDate = formatDateLocal(minStart);
            mod.endDate = formatDateLocal(maxEnd);
          }
        }
      }
    });

    // Recalculate duration automatically for each single item
    updated.forEach(it => {
      if (it.startDate && it.endDate) {
        const s = parseDateString(it.startDate);
        const e = parseDateString(it.endDate);
        const diff = e.getTime() - s.getTime();
        it.durationDays = Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1);
      }
    });

    // Step 1: Recalculate subtask progress based on subsubtasks
    updated.forEach(sub => {
      if (sub.level === 'SUBTAREA') {
        const subsubtasks = updated.filter(subsub => subsub.parentId === sub.id && subsub.level === 'SUBSUBTAREA');
        if (subsubtasks.length > 0) {
          const sumProg = subsubtasks.reduce((sum, current) => sum + current.progress, 0);
          sub.progress = Math.round(sumProg / subsubtasks.length);
        }
      }
    });

    // Step 2: Recalculate task progress based on subtasks
    updated.forEach(task => {
      if (task.level === 'TAREA') {
        const subtasks = updated.filter(sub => sub.parentId === task.id && sub.level === 'SUBTAREA');
        if (subtasks.length > 0) {
          const sumProg = subtasks.reduce((sum, current) => sum + current.progress, 0);
          task.progress = Math.round(sumProg / subtasks.length);
        }
      }
    });

    // Step 3: Recalculate module progress based on tasks
    updated.forEach(mod => {
      if (mod.level === 'MODULO') {
        const tasks = updated.filter(t => t.parentId === mod.id && t.level === 'TAREA');
        if (tasks.length > 0) {
          const sumProg = tasks.reduce((sum, current) => sum + current.progress, 0);
          mod.progress = Math.round(sumProg / tasks.length);
        }
      }
    });

    // Step 4: Enforce statuses for all items based on their current progress
    updated.forEach(it => {
      if (it.progress === 0) {
        it.status = 'PENDIENTE';
      } else if (it.progress >= 1 && it.progress <= 99) {
        it.status = 'EN_CURSO';
      } else if (it.progress === 100) {
        it.status = 'COMPLETADA';
      }
    });

    // Step 5: Hierarchical Sorting to ensure parents are always followed by their children recursively
    const hierarchicalSort = (flatList: WBSItem[]): WBSItem[] => {
      const result: WBSItem[] = [];
      const roots = flatList.filter(it => !it.parentId || !flatList.some(p => p.id === it.parentId));
      const childrenMap: Record<string, WBSItem[]> = {};
      flatList.forEach(it => {
        if (it.parentId) {
          if (!childrenMap[it.parentId]) {
            childrenMap[it.parentId] = [];
          }
          childrenMap[it.parentId].push(it);
        }
      });

      const orderMap = new Map<string, number>();
      flatList.forEach((it, idx) => {
        orderMap.set(it.id, idx);
      });

      const sortChildrenByOrder = (arr: WBSItem[]) => {
        return [...arr].sort((a, b) => (orderMap.get(a.id) || 0) - (orderMap.get(b.id) || 0));
      };

      const sortedRoots = sortChildrenByOrder(roots);

      const traverse = (node: WBSItem) => {
        result.push(node);
        const children = childrenMap[node.id] || [];
        const sortedChildren = sortChildrenByOrder(children);
        sortedChildren.forEach(child => {
          traverse(child);
        });
      };

      sortedRoots.forEach(root => {
        traverse(root);
      });

      return result;
    };

    return hierarchicalSort(updated);
  };

  // Trigger recalculation on state changes
  /**
   * Ejecuta manualmente la recalculación jerárquica de progreso y actualiza el estado de los ítems.
   */
  const runHierarchicalRecalculation = () => {
    setItems(prev => handleRecalculateProgress(prev));
  };

  /**
   * Modifica un atributo específico de un elemento del WBS (por ejemplo, nombre, responsable, etc.)
   * y desencadena los recalculados automáticos en cascada.
   * @param {string} id - Id único del ítem a actualizar.
   * @param {keyof WBSItem} field - Propiedad del ítem a actualizar.
   * @param {any} value - Nuevo valor asignado al campo especifico.
   */
  const handleUpdateItemField = (id: string, field: keyof WBSItem, value: any) => {
    if (isDevRole) {
      alert('Modificación de WBS bloqueada en base a privilegios de Desarrollo.');
      return;
    }

    const targetItem = items.find(it => it.id === id);
    if (!targetItem) return;

    // Validation: End date (fecha fin) must be greater than or equal to start date (fecha de inicio)
    if (field === 'startDate' || field === 'endDate') {
      if (targetItem.sprintId) {
        alert('Error: Las fechas de ejecución de este elemento están bloqueadas porque se encuentran vinculadas al Sprint asociado.');
        return; // Block the update
      }
      const newStart = field === 'startDate' ? value : targetItem.startDate;
      const newEnd = field === 'endDate' ? value : targetItem.endDate;

      if (newStart && newEnd) {
        const parseDateString = (str: string): Date => {
          if (!str) return new Date();
          let parts = str.split('-');
          if (parts.length === 3) {
            if (parts[0].length === 4) {
              return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
            } else if (parts[2].length === 4) {
              return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
            }
          }
          parts = str.split('/');
          if (parts.length === 3) {
            if (parts[0].length === 4) {
              return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
            } else if (parts[2].length === 4) {
              return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
            }
          }
          return new Date(str);
        };

        const sTime = parseDateString(newStart).getTime();
        const eTime = parseDateString(newEnd).getTime();

        if (!isNaN(sTime) && !isNaN(eTime) && eTime < sTime) {
          alert('Error: La fecha de entrega (fecha fin) debe ser mayor o igual a la fecha de inicio.');
          return; // Block the update
        }
      }
    }

    // Safe outer logging before state update
    if (field === 'sprintId') {
      if (value) {
        const sprint = projectSprints.find(s => s.id === value);
        if (sprint) {
          if (addLog) {
            addLog(currentUserDisplayName, `Vinculó actividad "${targetItem.name}" al Sprint "${sprint.name}". Fechas sincronizadas a ${sprint.start_date} al ${sprint.end_date}.`);
          }
        }
      } else {
        if (addLog) {
          addLog(currentUserDisplayName, `Desvinculó la actividad "${targetItem.name}" del Sprint.`);
        }
      }
    } else if (field === 'dependsOnIds') {
      const arr = Array.isArray(value) ? value : [];
      if (addLog) {
        const depNames = arr.map(depId => {
          const found = items.find(p => p.id === depId);
          return found ? found.name : depId;
        }).join(', ');
        addLog(currentUserDisplayName, `Actualizó pre-requisitos de dependencia para "${targetItem.name}": [${depNames || 'Ninguno'}].`);
      }
    }

    setItems(prev => {
      const copy = prev.map(it => {
        if (it.id === id) {
          const updatedItem = { ...it, [field]: value };
          if (field === 'status') {
            if (value === 'COMPLETADA') {
              updatedItem.progress = 100;
            } else if (value === 'PENDIENTE') {
              updatedItem.progress = 0;
            } else if (value === 'EN_CURSO') {
              if (it.progress === 0 || it.progress === 100) {
                updatedItem.progress = 50;
              }
            }
          } else if (field === 'progress') {
            const val = Number(value) || 0;
            if (val === 0) {
              updatedItem.status = 'PENDIENTE';
            } else if (val >= 1 && val <= 99) {
              updatedItem.status = 'EN_CURSO';
            } else if (val === 100) {
              updatedItem.status = 'COMPLETADA';
            }
          } else if (field === 'sprintId') {
            if (value) {
              const sprint = projectSprints.find(s => s.id === value);
              if (sprint) {
                updatedItem.startDate = sprint.start_date;
                updatedItem.endDate = sprint.end_date;
              }
            }
          } else if (field === 'dependsOnIds') {
            const arr = Array.isArray(value) ? value : [];
            updatedItem.dependsOnIds = arr;
            updatedItem.dependsOnId = arr.length > 0 ? arr[0] : undefined;
          }
          return updatedItem;
        }
        return it;
      });
      return handleRecalculateProgress(copy);
    });
  };

  // Add elements
  const handleAddItem = (level: 'MODULO' | 'TAREA' | 'SUBTAREA' | 'SUBSUBTAREA', parentId?: string) => {
    if (isDevRole) {
      alert('Creación de elementos de WBS bloqueada en base a privilegios de Desarrollo.');
      return;
    }
    const today = new Date().toISOString().split('T')[0];
    const defaultEnd = new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0]; // +5 days

    let prefix = 'Nuevo Módulo';
    if (level === 'TAREA') prefix = 'Nueva Tarea';
    if (level === 'SUBTAREA') prefix = 'Nueva Subtarea';
    if (level === 'SUBSUBTAREA') prefix = 'Nueva Subsubtarea';

    const parentItem = parentId ? items.find(it => it.id === parentId) : null;
    const initialAssignedToId = parentItem?.assignedToId;

    const newItem: WBSItem = {
      id: `item-gen-${Date.now()}`,
      projectId,
      parentId,
      level,
      name: `${prefix} (Por editar)`,
      startDate: today,
      endDate: defaultEnd,
      durationDays: 6,
      progress: 0,
      priority: 'MEDIA',
      status: 'PENDIENTE',
      assignedToId: initialAssignedToId,
      comments: [],
      evidenceFiles: []
    };

    setItems(prev => {
      const updated = [...prev, newItem];
      return handleRecalculateProgress(updated);
    });

    // Expand the parent automatically outside of setItems updater
    if (parentId) {
      setExpandedItemIds(ex => ({ ...ex, [parentId]: true }));
    }

    addLog(currentUserDisplayName, `Añadió un elemento de nivel ${level} al plan de trabajo.`);
    setActiveItemId(newItem.id); // open detail drawer to immediately edit it
  };

  // Delete element (and its children)
  const handleDeleteItem = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (isDevRole) {
      alert('Eliminación de elementos de WBS bloqueada en base a privilegios de Desarrollo.');
      return;
    }
    
    const targetItem = items.find(it => it.id === id);
    const targetName = targetItem ? targetItem.title : 'este elemento';
    
    setDeleteConfirmState({
      isOpen: true,
      title: 'Eliminar Elemento de WBS',
      message: `¿Está totalmente seguro de eliminar "${targetName}" y todas sus sub-tareas/hijos asociados? Esta acción no se puede deshacer.`,
      onConfirm: () => {
        // Recursive search to delete all children nested deeper
        const getIdsToDelete = (targetId: string): string[] => {
          const ids = [targetId];
          const children = items.filter(it => it.parentId === targetId);
          children.forEach(c => {
            ids.push(...getIdsToDelete(c.id));
          });
          return ids;
        };

        const targetIds = getIdsToDelete(id);
        
        setItems(prev => {
          const filtered = prev.filter(it => !targetIds.includes(it.id));
          return handleRecalculateProgress(filtered);
        });

        if (activeItemId && targetIds.includes(activeItemId)) {
          setActiveItemId(null);
        }

        addLog(currentUserDisplayName, `Eliminó elemento del gestor de tareas junto a sus sub-elementos filiales (${targetIds.length} eliminados).`);
      }
    });
  };

  // Collapse/Expand toggle
  const toggleExpanded = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedItemIds(prev => {
      const current = prev[id] !== false;
      return {
        ...prev,
        [id]: !current
      };
    });
  };

  // Helper to determine if an item is visible based on ancestor expansion states
  const isItemVisible = (it: WBSItem): boolean => {
    let currentParentId = it.parentId;
    const visited = new Set<string>();
    while (currentParentId) {
      if (visited.has(currentParentId)) break;
      visited.add(currentParentId);
      if (expandedItemIds[currentParentId] === false) {
        return false;
      }
      const parent = items.find(p => p.id === currentParentId);
      currentParentId = parent?.parentId;
    }
    return true;
  };

  // Baseline save
  const handleSaveBaseline = () => {
    if (isDevRole) {
      alert('Captura de Línea Base bloqueada en base a privilegios de Desarrollo.');
      return;
    }
    const newBaseline: WBSBaseline = {
      id: `bs-${Date.now()}`,
      savedAt: getTransactionDateTime(),
      savedBy: currentUserDisplayName,
      itemsSnapshot: items.map(it => ({
        id: it.id,
        startDate: it.startDate,
        endDate: it.endDate,
        progress: it.progress
      }))
    };

    setBaselines(prev => [newBaseline, ...prev]);
    setSelectedBaselineId(newBaseline.id);
    addLog(currentUserDisplayName, `Guardó línea base de planificación "${newBaseline.savedAt}" para auditoría.`);
  };

  // Delete baseline
  const handleDeleteBaseline = (id: string) => {
    if (isDevRole) {
      alert('Eliminación de Línea Base bloqueada en base a privilegios de Desarrollo.');
      return;
    }
    const baseline = baselines.find(b => b.id === id);
    const label = baseline ? baseline.savedAt : 'esta línea base';
    setDeleteConfirmState({
      isOpen: true,
      title: 'Eliminar Línea Base',
      message: `¿Está seguro de que desea eliminar la línea base "${label}"?`,
      onConfirm: () => {
        setBaselines(prev => prev.filter(b => b.id !== id));
        if (selectedBaselineId === id) {
          setSelectedBaselineId('');
        }
      }
    });
  };

  // Clear tasks to default dummy data
  const handleResetToDefault = () => {
    if (isDevRole) {
      alert('Restaurar planificación bloqueado en base a privilegios de Desarrollo.');
      return;
    }
    setDeleteConfirmState({
      isOpen: true,
      title: 'Reiniciar Planificación',
      message: '¿Está seguro de reiniciar toda la planificación al árbol de tareas por defecto? Esto descartará todos tus cambios de progreso y tareas nuevas.',
      onConfirm: () => {
        setItems(handleRecalculateProgress(getInitialWBSItems(projectId)));
        addLog('Sistema', 'Reinició la planificación del proyecto al estado estándar recomendado.');
      }
    });
  };

  // --- Calculations and Indicators ---
  const activeBaseline = baselines.find(b => b.id === selectedBaselineId);

  // Metrics
  const projectTasks = items.filter(it => it.level === 'TAREA');
  const projectSubtasks = items.filter(it => it.level === 'SUBTAREA');
  const projectSubsubtasks = items.filter(it => it.level === 'SUBSUBTAREA');
  
  // Total overall progress (weighted calculation by level)
  const modules = items.filter(it => it.level === 'MODULO');
  const overallProgress = modules.length > 0 
    ? Math.round(modules.reduce((sum, m) => sum + m.progress, 0) / modules.length)
    : 0;

  // Identify overdue tasks (endDate < today and progress < 100)
  const todayStr = (() => {
    const local = new Date();
    const offset = local.getTimezoneOffset();
    const localTime = new Date(local.getTime() - (offset * 60 * 1000));
    return localTime.toISOString().split('T')[0];
  })();
  const delayTasks = items.filter(it => it.level === 'TAREA' || it.level === 'SUBTAREA' || it.level === 'SUBSUBTAREA');
  const overdueTasksCount = delayTasks.filter(t => t.endDate < todayStr && t.progress < 100).length;
  const dueTodayTasksCount = delayTasks.filter(t => t.endDate === todayStr && t.progress < 100).length;

  // Compliance % (completed items vs total items within planning deadline)
  const completedTasksCount = delayTasks.filter(t => t.progress === 100).length;
  const complianceRate = delayTasks.length > 0
    ? Math.round((completedTasksCount / delayTasks.length) * 100)
    : 100;

  // Baseline deviation calculation: calculate tasks that finished later or differ from baseline end dates
  let baselineDeviationDays = 0;
  if (activeBaseline) {
    delayTasks.forEach(task => {
      const bsSnapshot = activeBaseline.itemsSnapshot.find(snap => snap.id === task.id);
      if (bsSnapshot && bsSnapshot.endDate && task.endDate) {
        const tDate = new Date(task.endDate);
        const bDate = new Date(bsSnapshot.endDate);
        const diff = tDate.getTime() - bDate.getTime();
        const diffDays = Math.round(diff / (1000 * 60 * 60 * 24));
        if (diffDays > 0) {
          baselineDeviationDays += diffDays;
        }
      }
    });
  }

  // Active alarms list
  const activeAlarms: string[] = [];
  if (overdueTasksCount > 0) {
    activeAlarms.push(`¡Hay ${overdueTasksCount} tareas críticas con fecha de entrega vencida!`);
  }
  if (dueTodayTasksCount > 0) {
    activeAlarms.push(`¡Hay ${dueTodayTasksCount} tareas planificadas para finalizar hoy!`);
  }
  if (baselineDeviationDays > 0) {
    activeAlarms.push(`Desviación de ${baselineDeviationDays} días acumulados respecto a la Línea Base.`);
  }
  
  // List blocked items
  const blockedTasks = items.filter(it => it.status === 'BLOQUEADO');
  if (blockedTasks.length > 0) {
    activeAlarms.push(`${blockedTasks.length} requerimientos se encuentran actualmente en estado "BLOQUEADO".`);
  }

  // --- Filtering Logic ---
  const getHierarchyFilteredItems = (): WBSItem[] => {
    // 1. First, filters apply directly to Tareas and Subtareas, but we keep Phases and Modules visible if they contain matching children.
    // However, for simplicity and a beautiful design, we render the full parent path of any matching leaf node.
    let itemMap = new Map<string, WBSItem>();
    
    const matchesFilters = (it: WBSItem) => {
      const matchesSearch = searchTerm === '' || it.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesPriority = filterPriority === 'ALL' || it.priority === filterPriority;
      const matchesStatus = filterStatus === 'ALL' || it.status === filterStatus;
      const matchesResp = filterResponsible === 'ALL' || it.assignedToId === filterResponsible;
      
      return matchesSearch && matchesPriority && matchesStatus && matchesResp;
    };

    // Filter leaves (Tareas, Subtareas & Subsubtareas)
    const matchingLeafs = items.filter(it => (it.level === 'TAREA' || it.level === 'SUBTAREA' || it.level === 'SUBSUBTAREA') && matchesFilters(it));

    // If search & filters are empty, return all items preserving order
    if (searchTerm === '' && filterPriority === 'ALL' && filterStatus === 'ALL' && filterResponsible === 'ALL') {
      return items;
    }

    // Trace back all parents for matches
    const keepIds = new Set<string>();
    matchingLeafs.forEach(leaf => {
      keepIds.add(leaf.id);
      let parent = items.find(p => p.id === leaf.parentId);
      while (parent) {
        keepIds.add(parent.id);
        parent = items.find(p => p.id === parent?.parentId);
      }
    });

    return items.filter(it => keepIds.has(it.id));
  };

  const filteredItems = getHierarchyFilteredItems();
  const selectedItem = items.find(it => it.id === activeItemId);

  // --- Detail Drawer Comment Submission ---
  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (isDevRole) {
      alert('La adición de comentarios en el WBS está restringida.');
      return;
    }
    if (!newCommentText.trim() || !activeItemId) return;

    const newComment: WBSComment = {
      id: `c-gen-${Date.now()}`,
      userId: loggedInUser?.id || 'u-2',
      userName: loggedInUser ? `${loggedInUser.first_name} ${loggedInUser.last_name}` : 'Carlos Pérez',
      userRole: loggedInUser ? loggedInUser.role : 'Analista DevOps / PM',
      text: newCommentText,
      timestamp: getTransactionDateTime()
    };

    setItems(prev => {
      return prev.map(it => {
        if (it.id === activeItemId) {
          return {
            ...it,
            comments: [...it.comments, newComment]
          };
        }
        return it;
      });
    });

    setNewCommentText('');
    addLog(currentUserDisplayName, `Agregó un comentario técnico en la tarea activa.`);
  };

  // --- Simulated File Upload Handlers ---
  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (isDevRole) {
      alert('La carga de evidencias de WBS está restringida.');
      return;
    }
    setIsDraggingFile(false);
    if (!activeItemId) return;

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      simulateFileUpload(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isDevRole) {
      alert('La carga de evidencias de WBS está restringida.');
      return;
    }
    if (!activeItemId) return;
    const files = e.target.files;
    if (files && files.length > 0) {
      simulateFileUpload(files[0]);
    }
  };

  const handleAddWbsLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (isDevRole) {
      alert('La carga de evidencias de WBS está restringida.');
      return;
    }
    if (!activeItemId || !wbsSupportUrl.trim()) return;

    const urlStr = wbsSupportUrl.trim();
    if (!urlStr.startsWith('http://') && !urlStr.startsWith('https://')) {
      alert('Por favor, inserte un enlace URL válido con http:// o https://');
      return;
    }

    const namePart = urlStr.split('/').pop()?.split('?')[0] || 'Enlace externo';
    const newEvidence: WBSEvidence = {
      id: `ev-gen-${Date.now()}`,
      fileName: namePart,
      fileSize: 'Enlace Web',
      uploadedAt: getTransactionDateTime(),
      uploadedBy: currentUserDisplayName,
      externalUrl: urlStr
    };

    setItems(prev => {
      return prev.map(it => {
        if (it.id === activeItemId) {
          return {
            ...it,
            evidenceFiles: [...it.evidenceFiles, newEvidence]
          };
        }
        return it;
      });
    });

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
      let cleanKey = `wbs/task_${activeItemId}/${namePart.trim().replace(/\s+/g, '_').toLowerCase()}`;
      
      const newObject = {
        id: `sim-wbs-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        key: cleanKey,
        name: namePart,
        size: 'Enlace Web',
        url: urlStr,
        uploadedAt: getTransactionDateTime().substring(0, 10),
        type: 'text/html'
      };

      custom.push(newObject);
      saveCustomFilesToLocalStorage(custom);
    } catch (err) {
      console.error("Error writing WBS evidence link to simulated storage", err);
    }

    addLog(currentUserDisplayName, `Vinculó el enlace de evidencia "${namePart}" de forma segura en el repositorio virtual S3.`);
    setWbsSupportUrl('');
    setWbsAttachmentMode('file');
  };

  const simulateFileUpload = (file: File) => {
    if (isDevRole) return;
    if (!activeItemId) return;
    
    const sizeKB = Math.round(file.size / 1024);
    const sizeStr = sizeKB > 1024 ? `${(sizeKB / 1024).toFixed(1)} MB` : `${sizeKB} KB`;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Data = reader.result as string;

      const newEvidence: WBSEvidence = {
        id: `ev-gen-${Date.now()}`,
        fileName: file.name,
        fileSize: sizeStr,
        uploadedAt: getTransactionDateTime(),
        uploadedBy: currentUserDisplayName,
        rawBase64: base64Data
      };

      // Store in memory cache to bypass storage quota limits and avoid file corruption
      wbsFileInMemoryCache.set(newEvidence.id, base64Data);
      wbsFileInMemoryCache.set(file.name, base64Data);

      setItems(prev => {
        return prev.map(it => {
          if (it.id === activeItemId) {
            return {
              ...it,
              evidenceFiles: [...it.evidenceFiles, newEvidence]
            };
          }
          return it;
        });
      });

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
        let cleanKey = `wbs/task_${activeItemId}/${file.name.trim().replace(/\s+/g, '_').toLowerCase()}`;
        
        const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
        let mime = 'application/octet-stream';
        if (['png', 'jpg', 'jpeg'].includes(fileExt)) mime = `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`;
        else if (fileExt === 'pdf') mime = 'application/pdf';
        else if (['zip', 'rar'].includes(fileExt)) mime = 'application/zip';
        else if (['txt', 'sql', 'json'].includes(fileExt)) mime = 'text/plain';

        const newObject = {
          id: `sim-wbs-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          key: cleanKey,
          name: file.name,
          size: sizeStr,
          url: `http://localhost:9000/soporte-pmo-storage/${cleanKey}`,
          uploadedAt: getTransactionDateTime().substring(0, 10),
          type: mime,
          raw_base64: base64Data
        };

        custom.push(newObject);
        saveCustomFilesToLocalStorage(custom);
      } catch (err) {
        console.error("Error writing WBS evidence file to simulated storage bucket", err);
      }

      addLog(currentUserDisplayName, `Subió archivo de evidencia "${file.name}" de forma segura al repositorio 'soporte-pmo-storage' en Docker.`);
    };

    reader.readAsDataURL(file);
  };

  const handleDownloadEvidence = (ev: WBSEvidence) => {
    const isLink = ev.externalUrl || ev.fileName.startsWith('http://') || ev.fileName.startsWith('https://');
    if (isLink) {
      window.open(ev.externalUrl || ev.fileName, '_blank');
      addLog(currentUserDisplayName, `Abrió enlace externo de evidencia: ${ev.fileName}`);
      return;
    }

    const downloadName = ev.fileName;

    const triggerDownload = (blob: Blob) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = downloadName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      addLog(currentUserDisplayName, `Descargó el archivo de evidencia: ${downloadName}`);
    };

    // 1. Check in-memory caches first (which bypass localStorage quota limits completely)
    const cachedBase64 = ev.rawBase64 || wbsFileInMemoryCache.get(ev.id) || wbsFileInMemoryCache.get(ev.fileName);
    if (cachedBase64) {
      try {
        const parts = cachedBase64.split(';base64,');
        const contentType = parts.length > 1 ? parts[0].split(':')[1] : 'application/octet-stream';
        const base64Str = parts.length > 1 ? parts[1] : parts[0];
        const raw = window.atob(base64Str);
        const rawLength = raw.length;
        const uInt8Array = new Uint8Array(rawLength);
        for (let i = 0; i < rawLength; ++i) {
          uInt8Array[i] = raw.charCodeAt(i);
        }
        const exactBlob = new Blob([uInt8Array], { type: contentType });
        triggerDownload(exactBlob);
        return;
      } catch (err) {
        console.error("Failed decoding cached base64 file", err);
      }
    }

    // 2. Try to find the file in simulated Docker storage (localstorage 'gcp_storage_custom_files')
    try {
      const customLocal = localStorage.getItem('gcp_storage_custom_files');
      if (customLocal && customLocal !== "undefined" && customLocal !== "null") {
        const custom = JSON.parse(customLocal);
        if (Array.isArray(custom)) {
          // Find by name or key
          const found = custom.find(f => f.name === ev.fileName || (f.key && f.key.endsWith(ev.fileName)));
          if (found && found.raw_base64) {
            const parts = found.raw_base64.split(';base64,');
            const contentType = parts.length > 1 ? parts[0].split(':')[1] : 'application/octet-stream';
            const base64Str = parts.length > 1 ? parts[1] : parts[0];
            const raw = window.atob(base64Str);
            const rawLength = raw.length;
            const uInt8Array = new Uint8Array(rawLength);
            for (let i = 0; i < rawLength; ++i) {
              uInt8Array[i] = raw.charCodeAt(i);
            }
            const exactBlob = new Blob([uInt8Array], { type: contentType });
            triggerDownload(exactBlob);
            return;
          }
        }
      }
    } catch (err) {
      console.error("Error reading from simulated Docker storage", err);
    }

    // 3. Fallback if not found in custom files or if pruned (produces clean compatible formats instead of plain text that triggers corruption)
    let fallbackContent: any = `SOPORTE PMO VIRTUAL\n\nNombre del Archivo: ${ev.fileName}\nTamaño: ${ev.fileSize}\nFecha de Carga: ${ev.uploadedAt}\nSubido Por: ${ev.uploadedBy}\n\nDescarga exitosa desde el almacenamiento seguro simulado en Docker.`;
    let fallbackMime = 'text/plain';

    const lowerName = ev.fileName.toLowerCase();
    if (lowerName.endsWith('.sql')) {
      fallbackContent = `-- ESQUEMA DE BASE DE DATOS POSTGRESQL (SOPORTE PMO)\n-- Archivo: ${ev.fileName}\n-- Cargado el: ${ev.uploadedAt} por ${ev.uploadedBy}\n\nCREATE TABLE IF NOT EXISTS projects (\n  id SERIAL PRIMARY KEY,\n  code VARCHAR(50) UNIQUE NOT NULL,\n  name VARCHAR(255) NOT NULL\n);`;
      fallbackMime = 'text/plain';
    } else if (lowerName.endsWith('.pdf')) {
      fallbackContent = `%PDF-1.4\n% MOCK PDF FILE GENERATED BY PMO WORKSPACE\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /Resources << >> /Contents 4 0 R >>\nendobj\n4 0 obj\n<< /Length 100 >>\nstream\nBT\n/F1 12 Tf\n72 712 Td\n(APROBACION DE ALCANCE: ${ev.fileName}) Tj\nET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f\ntrailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n310\n%%EOF`;
      fallbackMime = 'application/pdf';
    } else if (lowerName.endsWith('.docx')) {
      fallbackContent = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head><title>Soporte WBS PMO</title></head>
<body style="font-family: Arial, sans-serif; padding: 20px;">
  <h2 style="color: #1e3a8a;">SOPORTE PMO VIRTUAL - EVIDENCIA WBS</h2>
  <hr/>
  <p><b>Archivo de Evidencia:</b> ${ev.fileName}</p>
  <p><b>Tamaño:</b> ${ev.fileSize}</p>
  <p><b>Fecha de Carga:</b> ${ev.uploadedAt}</p>
  <p><b>Subido Por:</b> ${ev.uploadedBy}</p>
  <br/>
  <p style="color: #475569;">Este documento ha sido generado y recuperado de manera segura desde el simulador de almacenamiento del proyecto.</p>
</body>
</html>`;
      fallbackMime = 'application/msword';
    } else if (lowerName.endsWith('.xlsx')) {
      fallbackContent = `sep=,\n"SOPORTE PMO VIRTUAL","EVIDENCIA WBS"\n"Archivo:","${ev.fileName}"\n"Tamaño:","${ev.fileSize}"\n"Fecha:","${ev.uploadedAt}"\n"Subido Por:","${ev.uploadedBy}"\n\n"Estado","Simulación segura de almacenamiento Docker exitosa"`;
      fallbackMime = 'text/csv';
    } else if (lowerName.endsWith('.pptx')) {
      fallbackContent = `SOPORTE PMO VIRTUAL - PRESENTACION\n\nArchivo: ${ev.fileName}\nTamaño: ${ev.fileSize}\nCargado por: ${ev.uploadedBy}\n\nEste archivo es una simulación de PowerPoint generada localmente. Para presentaciones interactivas completas, recomendamos adjuntar la URL del enlace web real de su Drive o SharePoint.`;
      fallbackMime = 'text/plain';
    } else if (['png', 'jpg', 'jpeg', 'gif', 'svg'].some(ext => lowerName.endsWith(ext))) {
      fallbackContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 200" width="100%" height="100%">
  <rect width="100%" height="100%" fill="#f1f5f9"/>
  <text x="50%" y="45%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="16" fill="#1e3a8a" font-weight="bold">Evidencia de Soporte PMO</text>
  <text x="50%" y="60%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="12" fill="#64748b">${ev.fileName}</text>
  <text x="50%" y="75%" dominant-baseline="middle" text-anchor="middle" font-family="mono" font-size="10" fill="#94a3b8">${ev.fileSize} • ${ev.uploadedBy}</text>
</svg>`;
      fallbackMime = 'image/svg+xml';
    }

    const fallbackBlob = new Blob([fallbackContent], { type: fallbackMime });
    triggerDownload(fallbackBlob);
  };

  const handleDeleteEvidence = (evId: string) => {
    if (isDevRole) {
      alert('Eliminación de evidencias de WBS restringida.');
      return;
    }
    if (!activeItemId) return;

    const activeItem = items.find(it => it.id === activeItemId);
    const ev = activeItem?.evidenceFiles.find(e => e.id === evId);
    const evName = ev ? ev.fileName : 'este archivo de evidencia';

    setDeleteConfirmState({
      isOpen: true,
      title: 'Eliminar Evidencia de Soporte',
      message: `¿Está seguro de que desea eliminar la evidencia de soporte "${evName}" de forma permanente?`,
      onConfirm: () => {
        setItems(prev => {
          return prev.map(it => {
            if (it.id === activeItemId) {
              return {
                ...it,
                evidenceFiles: it.evidenceFiles.filter(ev => ev.id !== evId)
              };
            }
            return it;
          });
        });
      }
    });
  };

  // --- Export Actions ---
  const handleExportCSV = () => {
    const columns = [
      'Correlativo',
      'Elemento / Nombre',
      'Responsable ID',
      'Responsable Nombre',
      'Inicio',
      'Fin',
      'Duracion (Dias)',
      'Progreso (%)',
      'Prioridad',
      'Estado',
      'Pre-requisito ID'
    ];
    
    const csvRows = [columns.join(',')];
    
    items.forEach(it => {
      const assignedUser = users.find(u => u.id === it.assignedToId);
      const assignedName = assignedUser ? `${assignedUser.first_name} ${assignedUser.last_name}` : '';
      const cleanStr = (strString: string) => `"${(strString || '').replace(/"/g, '""')}"`;
      
      const row = [
        wbsNumbers[it.id] || '',
        cleanStr(it.name),
        it.assignedToId || '',
        cleanStr(assignedName),
        it.startDate,
        it.endDate,
        it.durationDays,
        it.progress,
        it.priority,
        it.status,
        (() => {
          const deps = it.dependsOnIds || (it.dependsOnId ? [it.dependsOnId] : []);
          const wbsCodes = deps.map(depId => wbsNumbers[depId]).filter(Boolean);
          return wbsCodes.join('; ');
        })()
      ];
      csvRows.push(row.join(','));
    });
    
    const blob = new Blob(['\uFEFF' + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `proyecto_cronograma_wbs_${projectId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportExcel = () => {
    let tableHtml = `
      <html>
      <head>
        <meta charset="utf-8"/>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; }
          table { border-collapse: collapse; width: 100%; }
          th { background-color: #1e3a8a; color: #ffffff; font-weight: bold; border: 1px solid #cbd5e1; padding: 8px; }
          td { border: 1px solid #cbd5e1; padding: 6px 8px; font-size: 11px; }
          .lvl-f { background-color: #eff6ff; font-weight: bold; }
          .lvl-m { background-color: #f8fafc; font-weight: bold; }
          .lvl-t { padding-left: 15px; }
          .lvl-s { padding-left: 30px; color: #475569; italic; }
        </style>
      </head>
      <body>
        <h3>Estructura WBS / Cronograma del Proyecto Integrado</h3>
        <table>
          <thead>
            <tr>
              <th>Correlativo</th>
              <th>Tareas y Subtareas</th>
              <th>Inicio</th>
              <th>Fin</th>
              <th>Días</th>
              <th>Progreso</th>
              <th>Prioridad</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
    `;

    items.forEach(it => {
      let cssClass = 'lvl-t';
      if (it.level === 'MODULO') cssClass = 'lvl-f';
      if (it.level === 'TAREA') cssClass = 'lvl-m';
      if (it.level === 'SUBSUBTAREA') cssClass = 'lvl-s';

      const paddingText = it.level === 'TAREA' ? '  ' : it.level === 'SUBTAREA' ? '    ' : it.level === 'SUBSUBTAREA' ? '      ' : '';

      tableHtml += `
        <tr class="${cssClass}">
          <td>${wbsNumbers[it.id] || ''}</td>
          <td>${paddingText}${it.name}</td>
          <td>${it.startDate}</td>
          <td>${it.endDate}</td>
          <td style="text-align: right;">${it.durationDays}</td>
          <td style="text-align: right;">${it.progress}%</td>
          <td>${it.priority}</td>
          <td>${it.status}</td>
        </tr>
      `;
    });

    tableHtml += `
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([tableHtml], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cronograma_reporte_${projectId}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = async () => {
    const element = document.getElementById('wbs-gantt-chart-container');
    if (!element) return;

    setIsExportingPDF(true);
    addLog(currentUserDisplayName, 'Inició la exportación del Diagrama Gantt en formato PDF.');

    // Inner helper functions for oklch and oklab support
    const oklchToRgb = (lStr: string, cStr: string, hStr: string, alphaStr?: string): string => {
      let L = parseFloat(lStr);
      let C = parseFloat(cStr);
      let H = parseFloat(hStr);
      let alpha = alphaStr ? parseFloat(alphaStr) : 1;

      if (lStr.includes('%')) L = parseFloat(lStr) / 100;
      if (cStr.includes('%')) C = parseFloat(cStr) / 100;
      if (hStr.includes('%')) H = (parseFloat(hStr) / 100) * 360;

      if (hStr.endsWith('deg')) H = parseFloat(hStr);
      else if (hStr.endsWith('rad')) H = parseFloat(hStr) * (180 / Math.PI);
      else if (hStr.endsWith('grad')) H = parseFloat(hStr) * 0.9;
      else if (hStr.endsWith('turn')) H = parseFloat(hStr) * 360;

      const hRad = (H * Math.PI) / 180;
      const aCoordVal = C * Math.cos(hRad);
      const bCoordVal = C * Math.sin(hRad);

      const l_ = L + 0.3963377774 * aCoordVal + 0.2158037573 * bCoordVal;
      const m_ = L - 0.1055613458 * aCoordVal - 0.0638541167 * bCoordVal;
      const s_ = L - 0.0894841775 * aCoordVal - 1.2914855480 * bCoordVal;

      const l_lms = Math.pow(Math.max(0, l_), 3);
      const m_lms = Math.pow(Math.max(0, m_), 3);
      const s_lms = Math.pow(Math.max(0, s_), 3);

      const r_l = +4.0767416621 * l_lms - 3.3077115913 * m_lms + 0.2309699292 * s_lms;
      const g_l = -1.2684380046 * l_lms + 2.6097574011 * m_lms - 0.3413193965 * s_lms;
      const b_l = -0.0041960863 * l_lms - 0.7034186147 * m_lms + 1.7076147010 * s_lms;

      const gamma = (c: number) => {
        const clamped = Math.max(0, Math.min(1, c));
        return clamped <= 0.0031308 
          ? 12.92 * clamped 
          : 1.055 * Math.pow(clamped, 1 / 2.4) - 0.055;
      };

      const rVal = Math.round(gamma(r_l) * 255);
      const gVal = Math.round(gamma(g_l) * 255);
      const bVal = Math.round(gamma(b_l) * 255);

      return alpha === 1 ? `rgb(${rVal}, ${gVal}, ${bVal})` : `rgba(${rVal}, ${gVal}, ${bVal}, ${alpha})`;
    };

    const oklabToRgb = (lStr: string, aStr: string, bStr: string, alphaStr?: string): string => {
      let L = parseFloat(lStr);
      let aCoordVal = parseFloat(aStr);
      let bCoordVal = parseFloat(bStr);
      let alpha = alphaStr ? parseFloat(alphaStr) : 1;

      if (lStr.includes('%')) L = parseFloat(lStr) / 100;
      if (aStr.includes('%')) aCoordVal = parseFloat(aStr) / 100;
      if (bStr.includes('%')) bCoordVal = parseFloat(bStr) / 100;

      const l_ = L + 0.3963377774 * aCoordVal + 0.2158037573 * bCoordVal;
      const m_ = L - 0.1055613458 * aCoordVal - 0.0638541167 * bCoordVal;
      const s_ = L - 0.0894841775 * aCoordVal - 1.2914855480 * bCoordVal;

      const l_lms = Math.pow(Math.max(0, l_), 3);
      const m_lms = Math.pow(Math.max(0, m_), 3);
      const s_lms = Math.pow(Math.max(0, s_), 3);

      const r_l = +4.0767416621 * l_lms - 3.3077115913 * m_lms + 0.2309699292 * s_lms;
      const g_l = -1.2684380046 * l_lms + 2.6097574011 * m_lms - 0.3413193965 * s_lms;
      const b_l = -0.0041960863 * l_lms - 0.7034186147 * m_lms + 1.7076147010 * s_lms;

      const gamma = (c: number) => {
        const clamped = Math.max(0, Math.min(1, c));
        return clamped <= 0.0031308 
          ? 12.92 * clamped 
          : 1.055 * Math.pow(clamped, 1 / 2.4) - 0.055;
      };

      const rVal = Math.round(gamma(r_l) * 255);
      const gVal = Math.round(gamma(g_l) * 255);
      const bVal = Math.round(gamma(b_l) * 255);

      return alpha === 1 ? `rgb(${rVal}, ${gVal}, ${bVal})` : `rgba(${rVal}, ${gVal}, ${bVal}, ${alpha})`;
    };

    const replaceOklStyleText = (text: string): string => {
      if (!text) return text;
      
      // 1. Replace oklch comma-separated format
      let result = text.replace(/oklch\(\s*([^,\/)]+)\s*,\s*([^,\/)]+)\s*,\s*([^,\/)]+)(?:\s*,\s*([^)]+))?\s*\)/g, (match, l, c, h, a) => {
        try {
          return oklchToRgb(l, c, h, a);
        } catch (e) {
          return 'rgb(128, 128, 128)';
        }
      });

      // Space/slash-separated format: oklch(0.9 0.02 240 / 0.5)
      result = result.replace(/oklch\(\s*([^\/\s]+)\s+([^\/\s]+)\s+([^\/\s]+)(?:\s*\/\s*([^)]+))?\s*\)/g, (match, l, c, h, a) => {
        try {
          return oklchToRgb(l, c, h, a);
        } catch (e) {
          return 'rgb(128, 128, 128)';
        }
      });

      // 2. Replace oklab comma-separated format
      result = result.replace(/oklab\(\s*([^,\/)]+)\s*,\s*([^,\/)]+)\s*,\s*([^,\/)]+)(?:\s*,\s*([^)]+))?\s*\)/g, (match, l, aCoord, bCoord, a) => {
        try {
          return oklabToRgb(l, aCoord, bCoord, a);
        } catch (e) {
          return 'rgb(128, 128, 128)';
        }
      });

      // Space-separated format
      result = result.replace(/oklab\(\s*([^\/\s]+)\s+([^\/\s]+)\s+([^\/\s]+)(?:\s*\/\s*([^)]+))?\s*\)/g, (match, l, aCoord, bCoord, a) => {
        try {
          return oklabToRgb(l, aCoord, bCoord, a);
        } catch (e) {
          return 'rgb(128, 128, 128)';
        }
      });

      // Defensive cleanup of any remaining oklch or oklab calls that didn't match the regexes
      if (result && (result.includes('oklch') || result.includes('oklab'))) {
        result = result.replace(/oklch\([^)]+\)/g, 'rgb(128, 128, 128)');
        result = result.replace(/oklab\([^)]+\)/g, 'rgb(128, 128, 128)');
      }

      return result;
    };

    // Override main window getComputedStyle during html2canvas capture
    const originalGetComputedStyle = window.getComputedStyle;
    window.getComputedStyle = function (elt, pseudoElt) {
      const style = originalGetComputedStyle.call(window, elt, pseudoElt);
      return new Proxy(style, {
        get(target, prop) {
          if (prop === 'getPropertyValue') {
            return function(propertyName: string) {
              const val = target.getPropertyValue(propertyName);
              if (typeof val === 'string' && (val.includes('oklch') || val.includes('oklab'))) {
                return replaceOklStyleText(val);
              }
              return val;
            };
          }
          const val = Reflect.get(target, prop);
          if (typeof val === 'string' && (val.includes('oklch') || val.includes('oklab'))) {
            return replaceOklStyleText(val);
          }
          if (typeof val === 'function') {
            return val.bind(target);
          }
          return val;
        }
      });
    };

    try {
      const canvas = await html2canvas(element, {
        scale: 2, // Better resolution
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: element.scrollWidth,
        height: element.scrollHeight,
        onclone: (clonedDoc) => {
          // Override cloned window getComputedStyle as well
          const clonedWindow = clonedDoc.defaultView;
          if (clonedWindow) {
            const originalClonedGetComputedStyle = clonedWindow.getComputedStyle;
            clonedWindow.getComputedStyle = function (elt, pseudoElt) {
              const style = originalClonedGetComputedStyle.call(clonedWindow, elt, pseudoElt);
              return new Proxy(style, {
                get(target, prop) {
                  if (prop === 'getPropertyValue') {
                    return function(propertyName: string) {
                      const val = target.getPropertyValue(propertyName);
                      if (typeof val === 'string' && (val.includes('oklch') || val.includes('oklab'))) {
                        return replaceOklStyleText(val);
                      }
                      return val;
                    };
                  }
                  const val = Reflect.get(target, prop);
                  if (typeof val === 'string' && (val.includes('oklch') || val.includes('oklab'))) {
                    return replaceOklStyleText(val);
                  }
                  if (typeof val === 'function') {
                    return val.bind(target);
                  }
                  return val;
                }
              });
            };
          }

          // Sanitize style tags
          const clonedStyles = clonedDoc.querySelectorAll('style');
          clonedStyles.forEach(styleEl => {
            if (styleEl.textContent) {
              styleEl.textContent = replaceOklStyleText(styleEl.textContent);
            }
          });

          // Sanitize inline styles
          const clonedElements = clonedDoc.querySelectorAll('*');
          clonedElements.forEach(el => {
            const htmlEl = el as HTMLElement;
            if (htmlEl.style) {
              for (let i = 0; i < htmlEl.style.length; i++) {
                const prop = htmlEl.style[i];
                const val = htmlEl.style.getPropertyValue(prop);
                if (val && (val.includes('oklch') || val.includes('oklab'))) {
                  htmlEl.style.setProperty(prop, replaceOklStyleText(val));
                }
              }
            }
          });

          // Sanitize nested dynamic CSS Rules inside stylesheets
          try {
            Array.from(clonedDoc.styleSheets).forEach((sheet: any) => {
              try {
                const rules = sheet.cssRules || sheet.rules;
                if (!rules) return;
                for (let i = 0; i < rules.length; i++) {
                  const rule = rules[i];
                  if (rule.style) {
                    for (let j = 0; j < rule.style.length; j++) {
                      const prop = rule.style[j];
                      const val = rule.style.getPropertyValue(prop);
                      if (val && (val.includes('oklch') || val.includes('oklab'))) {
                        rule.style.setProperty(prop, replaceOklStyleText(val));
                      }
                    }
                  }
                }
              } catch (e) {
                // cross-origin styleSheet rules cannot be read, safe to ignore
              }
            });
          } catch (e) {}

          // Inject custom print styles for the Gantt Chart to prevent text truncation/cut-off at the bottom
          const printStyle = clonedDoc.createElement('style');
          printStyle.innerHTML = `
            .gantt-task-row {
              display: flex !important;
              align-items: center !important;
              height: auto !important;
              min-height: 44px !important;
              padding-top: 6px !important;
              padding-bottom: 6px !important;
              box-sizing: border-box !important;
            }
            .gantt-task-meta {
              display: flex !important;
              align-items: center !important;
              height: auto !important;
            }
            .gantt-task-name-container {
              display: flex !important;
              align-items: center !important;
              gap: 8px !important;
              overflow: visible !important;
              white-space: nowrap !important;
            }
            .gantt-task-badge {
              display: inline-flex !important;
              align-items: center !important;
              justify-content: center !important;
              font-family: sans-serif !important;
              font-size: 8px !important;
              font-weight: 900 !important;
              height: 16px !important;
              line-height: 1 !important;
              padding: 0 5px !important;
              margin: 0 !important;
              box-sizing: border-box !important;
              border-radius: 4px !important;
              vertical-align: middle !important;
            }
            .gantt-task-name {
              display: inline-block !important;
              overflow: visible !important;
              text-overflow: clip !important;
              white-space: nowrap !important;
              line-height: 1.5 !important;
              padding-bottom: 2px !important;
              margin: 0 !important;
              height: auto !important;
              box-sizing: content-box !important;
              vertical-align: middle !important;
            }
          `;
          clonedDoc.head.appendChild(printStyle);
        }
      });

      const imgData = canvas.toDataURL('image/png');

      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = 297;
      const pageHeight = 210;
      const margin = 10;
      const printableWidth = pageWidth - (margin * 2); // 277mm

      const imgWidth = printableWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Title bar
      pdf.setFillColor(30, 58, 138);
      pdf.rect(0, 0, pageWidth, 25, 'F');

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(14);
      pdf.setTextColor(255, 255, 255);
      pdf.text(`CRONOGRAMA GANTT`, margin, 11);

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor(219, 234, 254);
      pdf.text(`Proyecto ID: ${projectId} | Exportado por: Carlos Pérez (PM) | Fecha: ${new Date().toLocaleString()}`, margin, 18);

      const startY = 30;
      const maxPrintHeight = pageHeight - startY - margin;

      if (imgHeight <= maxPrintHeight) {
        pdf.addImage(imgData, 'PNG', margin, startY, imgWidth, imgHeight);
      } else {
        let heightLeft = imgHeight;
        let pageNum = 1;

        // Draw portion 1
        pdf.addImage(imgData, 'PNG', margin, startY, imgWidth, maxPrintHeight);
        heightLeft -= maxPrintHeight;

        while (heightLeft > 0) {
          pdf.addPage();
          pageNum++;

          pdf.setFillColor(30, 58, 138);
          pdf.rect(0, 0, pageWidth, 15, 'F');
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(10);
          pdf.setTextColor(255, 255, 255);
          pdf.text(`CRONOGRAMA GANTT - Pág. ${pageNum}`, margin, 10);

          pdf.addImage(imgData, 'PNG', margin, startY, imgWidth, maxPrintHeight);
          heightLeft -= maxPrintHeight;
        }
      }

      pdf.save(`Cronograma Gantt.pdf`);
      addLog(currentUserDisplayName, 'Se completó la exportación del Diagrama Gantt de forma exitosa.');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      addLog(currentUserDisplayName, 'Falló la exportación del Diagrama Gantt a PDF.');
    } finally {
      window.getComputedStyle = originalGetComputedStyle;
      setIsExportingPDF(false);
    }
  };

  // Gantt Chart horizontal placement calculus
  // Date bounds for Gantt
  const getGanttBounds = () => {
    let minMs = Infinity;
    let maxMs = -Infinity;

    const parseAndTrack = (dateStr?: string) => {
      if (!dateStr) return;
      const t = new Date(dateStr).getTime();
      if (!isNaN(t)) {
        if (t < minMs) minMs = t;
        if (t > maxMs) maxMs = t;
      }
    };

    if (items && items.length > 0) {
      items.forEach(it => {
        parseAndTrack(it.startDate);
        parseAndTrack(it.endDate);
      });
    }

    if (activeBaseline && activeBaseline.itemsSnapshot && items) {
      const activeIds = new Set(items.map(it => it.id));
      activeBaseline.itemsSnapshot.forEach(it => {
        if (activeIds.has(it.id)) {
          parseAndTrack(it.startDate);
          parseAndTrack(it.endDate);
        }
      });
    }

    // Default fallback dates if no valid dates found
    if (minMs === Infinity || maxMs === -Infinity || isNaN(minMs) || isNaN(maxMs)) {
      minMs = new Date('2026-05-15').getTime();
      maxMs = new Date('2026-07-05').getTime();
    }

    // Define visual padding based on scale
    let paddingLeft = 0;
    let paddingRight = 4 * 24 * 60 * 60 * 1000;

    if (ganttScale === 'semanas') {
      paddingRight = 14 * 24 * 60 * 60 * 1000;
    } else if (ganttScale === 'meses') {
      paddingRight = 40 * 24 * 60 * 60 * 1000;
    }

    return {
      min: new Date(minMs - paddingLeft),
      max: new Date(maxMs + paddingRight)
    };
  };

  const { min: ganttMin, max: ganttMax } = getGanttBounds();
  const totalGanttDays = Math.ceil((ganttMax.getTime() - ganttMin.getTime()) / (1000 * 60 * 60 * 24));

  const getBarPosition = (startStr: string, endStr: string) => {
    const s = new Date(startStr);
    const e = new Date(endStr);
    
    const minMs = ganttMin.getTime();
    const maxMs = ganttMax.getTime();
    
    const sMs = s.getTime();
    const eMs = e.getTime();

    // If completely outside timeline interval, either before or after
    if (eMs < minMs || sMs > maxMs) {
      return { left: '0%', width: '0%', visible: false };
    }

    // Clip the task dates to the timeline interval boundaries
    const visibleStartMs = Math.max(sMs, minMs);
    const visibleEndMs = Math.min(eMs, maxMs);

    // Calculate start position as percentage of timeline
    const startDeltaMs = visibleStartMs - minMs;
    const leftPercent = (startDeltaMs / (maxMs - minMs)) * 100;

    // Calculate duration as percentage of timeline
    const durationMs = Math.max(1000 * 60 * 60 * 24, visibleEndMs - visibleStartMs);
    const widthPercent = (durationMs / (maxMs - minMs)) * 100;

    return {
      left: `${Math.max(0, Math.min(leftPercent, 95))}%`,
      width: `${Math.max(2, Math.min(widthPercent, 100 - leftPercent))}%`,
      visible: true
    };
  };

  // Dynamically compute beautifully spaced labels for Gantt chart headers
  const getGanttHeaderLabels = () => {
    const minTime = ganttMin.getTime();
    const maxTime = ganttMax.getTime();
    const range = maxTime - minTime;
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    
    const labels = [];
    
    if (ganttScale === 'dias') {
      for (let i = 0; i < 6; i++) {
        const t = minTime + (range / 5) * i;
        const d = new Date(t);
        const mLabel = months[d.getMonth()]?.toUpperCase() || '';
        const dLabel = String(d.getDate()).padStart(2, '0');
        
        const isToday = d.getFullYear() === 2026 && d.getMonth() === 5 && d.getDate() === 5;
        const label = `${mLabel} ${dLabel}${isToday ? ' (HOY)' : ''}`;
        labels.push(label);
      }
    } else if (ganttScale === 'semanas') {
      for (let i = 0; i < 6; i++) {
        const t = minTime + (range / 5) * i;
        const d = new Date(t);
        const mLabel = months[d.getMonth()] || '';
        const dLabel = d.getDate();
        const label = `Semana ${i + 1} (${dLabel} ${mLabel})`;
        labels.push(label);
      }
    } else {
      // 'meses'
      for (let i = 0; i < 5; i++) {
        const t = minTime + (range / 4) * i;
        const d = new Date(t);
        const mLabel = months[d.getMonth()] || '';
        const year = d.getFullYear();
        const label = `${mLabel} ${year}`;
        labels.push(label);
      }
    }
    return labels;
  };

  return (
    <div className="space-y-6" id="wbs-project-module">
      {isDevRole && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-3 text-amber-800 text-xs animate-fadeIn">
          <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h5 className="font-bold text-amber-950 uppercase tracking-wide">Módulo WBS y Cronograma en Modo Consulta</h5>
            <p className="mt-1 leading-relaxed text-amber-800 font-medium font-sans">
              Su rol de desarrollo tiene restringido realizar modificaciones directas sobre el cronograma, fases del proyecto, y presupuestos. Este módulo opera en modo <strong>Solo Lectura</strong>.
            </p>
          </div>
        </div>
      )}
      {/* 1. TOP METRIC INDICATORS (KPIs Style) */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {/* Progress KPI Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-3xs flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider">Avance General</span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black text-slate-900">{overallProgress}%</span>
              <span className="text-[9px] text-slate-400 font-medium">calculado</span>
            </div>
            <div className="w-20 bg-slate-100 h-1 rounded-full overflow-hidden mt-1">
              <div className="bg-blue-600 h-full" style={{ width: `${overallProgress}%` }}></div>
            </div>
          </div>
        </div>

        {/* Completed vs Total KPI Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-3xs flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider">Cumplimiento Hitos</span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black text-slate-950">{completedTasksCount}/{projectTasks.length}</span>
              <span className="text-[9px] text-slate-400 font-bold">Tareas OK</span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium mt-0.5">{complianceRate}% de efectividad</p>
          </div>
        </div>

        {/* Overdue Tasks KPI Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-3xs flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${overdueTasksCount > 0 ? 'bg-rose-50 text-rose-600 animate-bounce' : dueTodayTasksCount > 0 ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-600'}`}>
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider">Alertas de Cronograma</span>
            <div className="flex items-center gap-3 mt-0.5">
              <div className="flex items-baseline gap-0.5">
                <span className={`text-lg font-black ${overdueTasksCount > 0 ? 'text-rose-600' : 'text-slate-800'}`}>{overdueTasksCount}</span>
                <span className="text-[9px] text-rose-500 font-bold uppercase tracking-tight">Vencidas</span>
              </div>
              <div className="flex items-baseline gap-0.5 border-l border-slate-250 pl-3">
                <span className={`text-lg font-black ${dueTodayTasksCount > 0 ? 'text-amber-600' : 'text-slate-800'}`}>{dueTodayTasksCount}</span>
                <span className="text-[9px] text-amber-600 font-bold uppercase tracking-tight">Hoy</span>
              </div>
            </div>
            <p className="text-[10px] text-slate-500 font-medium mt-1">Vencimientos vs Fecha actual</p>
          </div>
        </div>

        {/* Baseline Compliance Rate Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-3xs flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider">Desviación Base</span>
            <div className="flex items-baseline gap-1">
              <span className={`text-xl font-black ${baselineDeviationDays > 0 ? 'text-amber-600' : 'text-slate-900'}`}>{baselineDeviationDays} días</span>
            </div>
            <p className="text-[9px] text-slate-500">con retraso acumulado</p>
          </div>
        </div>

        {/* Alerta de bloqueo/Riesgos Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-3xs flex items-center gap-3 col-span-2 md:col-span-1">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${activeAlarms.length > 0 ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-emerald-600'}`}>
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider">Alertas y Salud</span>
            <p className="text-xs font-bold text-slate-800 truncate">
              {activeAlarms.length > 0 ? `${activeAlarms.length} Riesgos Activos` : 'Salud Óptima 🟢'}
            </p>
            <span className="text-[9px] text-slate-400 block truncate">{activeAlarms[0] || 'Ningún bloqueo detectado'}</span>
          </div>
        </div>
      </div>

      {/* Alarms Alerts Banner if triggered */}
      {activeAlarms.length > 0 && (
        <div className="bg-rose-50 border border-rose-150 p-4 rounded-xl flex items-start gap-3 animate-fadeIn">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h5 className="font-bold text-rose-900 text-xs uppercase tracking-wide">Riesgos de Planificación Detectados</h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 mt-1.5">
              {activeAlarms.map((alm, index) => (
                <div key={index} className="text-[10.5px] text-rose-800 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-rose-500 rounded-full shrink-0"></span>
                  <span>{alm}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. BASELINE & EXPORT CRONTROLS PANEL */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        {/* Baseline Management */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5">
            <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-blue-600" />
              Línea Base Activa:
            </span>
            {baselines.length > 0 ? (
              <select
                value={selectedBaselineId}
                onChange={e => setSelectedBaselineId(e.target.value)}
                className="bg-transparent font-semibold font-mono text-[11px] text-slate-800 outline-none cursor-pointer"
              >
                <option value="">Ninguna</option>
                {baselines.map(bs => (
                  <option key={bs.id} value={bs.id}>
                    Saved: {bs.savedAt}
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-[11px] text-slate-400 font-medium">Sin Líneas Base</span>
            )}
          </div>

          <button
            onClick={handleSaveBaseline}
            className="bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-700 font-extrabold text-[11px] px-3.5 py-2 rounded-lg transition-colors cursor-pointer"
            title="Capturar y congelar versión actual para comparar con la ejecución futura"
          >
            Capturar Línea Base
          </button>
          
          {selectedBaselineId && (
            <button
              onClick={() => handleDeleteBaseline(selectedBaselineId)}
              className="text-slate-400 hover:text-red-500 p-1.5"
              title="Borrar línea base seleccionada"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>



        {/* Global reset & downloads */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          <button
            onClick={handleExportCSV}
            className="flex-1 lg:flex-none bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-[11px] px-3 py-2 rounded-lg transition"
            title="Exportar archivo CSV con jerarquías"
          >
            📥 CSV
          </button>
          <button
            onClick={handleExportExcel}
            className="flex-1 lg:flex-none bg-white hover:bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-[11px] px-3 py-2 rounded-lg transition"
            title="Generar planilla de Excel .xls"
          >
            🟢 Excel (WBS)
          </button>
          <button
            onClick={handleResetToDefault}
            className="text-[10px] text-slate-400 hover:text-slate-600 pr-1 ml-auto lg:ml-0"
            title="Reiniciar datos"
          >
            Reiniciar
          </button>
        </div>
      </div>

      {/* 3. INTERACTIVE SEARCH & FILTERS */}
      <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 animate-fadeIn">
        <div>
          <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wide mb-1 font-mono">Buscar Tarea</label>
          <div className="relative">
            <input
              type="text"
              placeholder="Nombre de tarea / módulo..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wide mb-1 font-mono">Prioridad</label>
            <select
              value={filterPriority}
              onChange={e => setFilterPriority(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 font-bold"
            >
              <option value="ALL">🔴 Todas</option>
              <option value="ALTA">ALTA</option>
              <option value="MEDIA">MEDIA</option>
              <option value="BAJA">BAJA</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wide mb-1 font-mono">Estado</label>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 font-bold"
            >
              <option value="ALL">🔵 Todos</option>
              <option value="PENDIENTE">PENDIENTE</option>
              <option value="EN_CURSO">EN CURSO</option>
              <option value="COMPLETADA">COMPLETADA</option>
              <option value="BLOQUEADO">BLOQUEADO</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wide mb-1 font-mono">Responsable</label>
            <select
              value={filterResponsible}
              onChange={e => setFilterResponsible(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800"
            >
              <option value="ALL">🟢 Cualquier Responsable</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>
                  {u.first_name} {u.last_name} ({u.role})
                </option>
              ))}
            </select>
          </div>
        </div>

      {/* 4. MAIN WORKSPACE */}

      {/* --- TAB VIEW 1: TreeGrid Editable WBS / Tasks --- */}
      {wbsTab === 'grid' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs animate-fadeIn">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs min-w-[900px]">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 select-none">
                <tr>
                  <th className="p-3 w-10"></th>
                  <th className="p-3 pl-2 w-1/3">Cronograma de actividades</th>
                  <th className="p-3 w-32">Responsable</th>
                  <th className="p-3 w-28">F. Inicio</th>
                  <th className="p-3 w-28">F. Fin</th>
                  <th className="p-3 w-16 text-center">Días</th>
                  <th className="p-3 w-24">Progreso</th>
                  <th className="p-3 w-24">Prioridad</th>
                  <th className="p-3 w-28">Estado</th>
                  <th className="p-3 w-24 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150 font-medium">
                {filteredItems.filter(isItemVisible).map(it => {
                  const paddingClass = 
                    it.level === 'TAREA' ? 'pl-6' : 
                    it.level === 'SUBTAREA' ? 'pl-11' : 
                    it.level === 'SUBSUBTAREA' ? 'pl-16' : 'pl-2';

                  const isOverdue = (it.level === 'TAREA' || it.level === 'SUBTAREA' || it.level === 'SUBSUBTAREA') && it.endDate < todayStr && it.progress < 100;
                  const isDueToday = (it.level === 'TAREA' || it.level === 'SUBTAREA' || it.level === 'SUBSUBTAREA') && it.endDate === todayStr && it.progress < 100;

                  const bannerColor =
                    isOverdue ? 'bg-rose-50/10 text-rose-950 hover:bg-rose-50/30' :
                    isDueToday ? 'bg-amber-50/10 text-amber-950 hover:bg-amber-50/30' :
                    it.level === 'MODULO' ? 'bg-blue-50/70 border-l-[3.5px] border-l-blue-600 text-blue-900 font-black text-xs' :
                    it.level === 'TAREA' ? 'bg-slate-50 border-l-[3.1px] border-l-slate-400 text-slate-800 font-bold hover:bg-slate-50' :
                    it.level === 'SUBTAREA' ? 'bg-white hover:bg-slate-50/50 text-slate-850' : 
                    'bg-slate-50/20 text-slate-600 italic hover:bg-slate-50/40';

                  const hasChildren = items.some(child => child.parentId === it.id);
                  const isExpanded = expandedItemIds[it.id] !== false;

                  let dragOverStyles = '';
                  if (dragOverItemId === it.id && dropPosition) {
                    if (dropPosition === 'above') {
                      dragOverStyles = ' border-t-[3px] border-t-blue-500 bg-blue-50/50';
                    } else if (dropPosition === 'below') {
                      dragOverStyles = ' border-b-[3px] border-b-blue-500 bg-blue-50/50';
                    } else if (dropPosition === 'inside') {
                      dragOverStyles = ' outline-[2px] outline-dashed outline-blue-500 bg-blue-100/30';
                    }
                  }

                  return (
                    <tr 
                      key={it.id} 
                      className={`group cursor-pointer hover:bg-slate-50 transition-all ${bannerColor} ${activeItemId === it.id ? 'bg-blue-100/40' : ''} ${draggedItemId === it.id ? 'opacity-40' : ''}${dragOverStyles}`}
                      onClick={() => setActiveItemId(it.id)}
                      onDoubleClick={() => {
                        setActiveItemId(it.id);
                      }}
                      draggable={!isDevRole}
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', it.id);
                        setDraggedItemId(it.id);
                      }}
                      onDragEnd={() => {
                        setDraggedItemId(null);
                        setDragOverItemId(null);
                        setDropPosition(null);
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        handleDragOverRow(e, it);
                      }}
                      onDragLeave={() => {
                        setDragOverItemId(null);
                        setDropPosition(null);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        handleDropRow(e, it);
                      }}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        setContextMenu({
                          x: e.clientX,
                          y: e.clientY,
                          itemId: it.id
                        });
                      }}
                    >
                      {/* Left collapse toggle arrow */}
                      <td className="p-3 text-center align-middle" onClick={(e) => { e.stopPropagation(); }}>
                        {hasChildren ? (
                          <button 
                            onClick={(e) => toggleExpanded(it.id, e)}
                            className="p-1 hover:bg-slate-200 rounded text-slate-500 cursor-pointer"
                          >
                            {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                          </button>
                        ) : null}
                      </td>

                      {/* Name / Title column (Editable inline) */}
                      <td className={`p-2.5 transition-all ${
                        isOverdue ? 'bg-rose-50/60 border-l-[3.5px] border-l-rose-500' :
                        isDueToday ? 'bg-amber-50/60 border-l-[3.5px] border-l-amber-400' : ''
                      }`}>
                        <div className={`flex items-center gap-2 ${paddingClass}`}>
                          {isOverdue && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-rose-100 border border-rose-200 text-rose-700 text-[8.5px] font-black uppercase font-mono tracking-tight shrink-0 select-none animate-pulse">
                              <AlertTriangle className="w-2.5 h-2.5 text-rose-600" />
                              <span>Vencida</span>
                            </span>
                          )}

                          {isDueToday && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-150 border border-amber-300 text-amber-800 text-[8.5px] font-black uppercase font-mono tracking-tight shrink-0 select-none">
                              <Clock className="w-2.5 h-2.5 text-amber-600 animate-spin" style={{ animationDuration: '4s' }} />
                              <span>Vence Hoy</span>
                            </span>
                          )}

                          <span className="text-[10px] font-extrabold text-slate-500 font-mono select-none shrink-0" title={`WBS: ${wbsNumbers[it.id]}`}>
                            {wbsNumbers[it.id]}
                          </span>

                          <input
                            type="text"
                            value={it.name}
                            onChange={(e) => handleUpdateItemField(it.id, 'name', e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            className={`bg-transparent border-b border-transparent group-hover:border-slate-250 focus:border-blue-500 outline-none w-full px-1 py-0.5 text-xs ${
                              isOverdue ? 'text-rose-950 font-black' :
                              isDueToday ? 'text-amber-950 font-black' : 'text-slate-800'
                            }`}
                            title="Haga clic para editar nombre del requerimiento"
                          />

                          {it.sprintId && (() => {
                            const found = projectSprints.find(s => s.id === it.sprintId);
                            if (!found) return null;
                            return (
                              <span 
                                className="text-[9px] bg-indigo-50 border border-indigo-150 text-indigo-700 font-extrabold px-1.5 py-0.2 rounded shrink-0 font-mono select-none" 
                                title={`Asigned to Sprint: ${found.name}`}
                              >
                                ⚡ {found.name}
                              </span>
                            );
                          })()}

                          {/* Quick indicators */}
                          {it.comments.length > 0 && (
                            <span className="flex items-center gap-0.5 text-[10px] text-slate-400" title={`${it.comments.length} Comentarios`}>
                              <MessageSquare className="w-3 h-3" />
                              {it.comments.length}
                            </span>
                          )}
                          {it.evidenceFiles.length > 0 && (
                            <span className="flex items-center gap-0.5 text-[10px] text-slate-400" title={`${it.evidenceFiles.length} Archivos adjuntos`}>
                              <Paperclip className="w-3 h-3" />
                              {it.evidenceFiles.length}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Assigned User selector */}
                      <td className="p-1.5" onClick={(e) => e.stopPropagation()}>
                        {it.level !== 'MODULO' && it.level !== 'TAREA' ? (
                          <select
                            value={it.assignedToId || ''}
                            onChange={(e) => handleUpdateItemField(it.id, 'assignedToId', e.target.value || undefined)}
                            className="bg-transparent font-medium text-xs text-slate-800 cursor-pointer focus:bg-white p-1 rounded hover:bg-slate-100 w-full"
                          >
                            <option value="">Sin asignar</option>
                            {users.map(u => (
                              <option key={u.id} value={u.id}>
                                {u.first_name} {u.last_name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic pl-1">(Heredado)</span>
                        )}
                      </td>

                      {/* Start Date */}
                      <td className="p-1.5" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="date"
                          value={it.startDate}
                          disabled={hasChildren || isDevRole || !!it.sprintId}
                          onChange={(e) => handleUpdateItemField(it.id, 'startDate', e.target.value)}
                          title={hasChildren ? "Calculado automáticamente de elementos secundarios" : it.sprintId ? "Bloqueado: La fecha está determinada por el Sprint asociado" : undefined}
                          className={`bg-transparent font-semibold font-mono text-[11px] p-1 rounded outline-none w-full ${
                            hasChildren || it.sprintId ? 'text-slate-450 bg-slate-50/20 cursor-not-allowed selection:bg-transparent' : 'text-slate-700 cursor-pointer hover:bg-slate-100 focus:bg-white'
                          }`}
                        />
                      </td>

                      {/* End Date */}
                      <td className="p-1.5" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="date"
                          value={it.endDate}
                          disabled={hasChildren || isDevRole || !!it.sprintId}
                          onChange={(e) => handleUpdateItemField(it.id, 'endDate', e.target.value)}
                          title={hasChildren ? "Calculado automáticamente de elementos secundarios" : it.sprintId ? "Bloqueado: La fecha está determinada por el Sprint asociado" : undefined}
                          className={`bg-transparent font-semibold font-mono text-[11px] p-1 rounded outline-none w-full ${
                            hasChildren || it.sprintId ? 'text-slate-450 bg-slate-50/20 cursor-not-allowed selection:bg-transparent' : 'text-slate-700 cursor-pointer hover:bg-slate-100 focus:bg-white'
                          } ${
                            !hasChildren && !it.sprintId && it.endDate < todayStr && it.progress < 100
                              ? 'text-rose-700 bg-rose-100/60 font-extrabold border border-rose-200/80'
                              : !hasChildren && !it.sprintId && it.endDate === todayStr && it.progress < 100
                              ? 'text-amber-850 bg-amber-100/60 font-extrabold border border-amber-250/80'
                              : ''
                          }`}
                        />
                      </td>

                      {/* Duration */}
                      <td className="p-2.5 text-center font-mono font-bold text-slate-600">
                        {it.durationDays}d
                      </td>

                      {/* Progress input/display */}
                      <td className="p-1.5" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="5"
                            value={it.progress}
                            onChange={(e) => handleUpdateItemField(it.id, 'progress', Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
                            className="w-11 bg-transparent hover:bg-slate-100 focus:bg-white text-right p-0.5 rounded font-mono font-bold text-slate-800 focus:outline-none"
                          />
                          <span className="text-[10px] text-slate-500 font-bold">%</span>
                        </div>
                      </td>

                      {/* Priority selector */}
                      <td className="p-1.5" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={it.priority}
                          onChange={(e) => handleUpdateItemField(it.id, 'priority', e.target.value)}
                          className={`bg-transparent font-bold text-[10px] cursor-pointer p-1 rounded outline-none w-full ${
                            it.priority === 'ALTA' ? 'text-red-600' :
                            it.priority === 'MEDIA' ? 'text-amber-600' : 'text-emerald-600'
                          }`}
                        >
                          <option value="ALTA">🔴 ALTA</option>
                          <option value="MEDIA">🟡 MEDIA</option>
                          <option value="BAJA">🟢 BAJA</option>
                        </select>
                      </td>

                      {/* Status selector */}
                      <td className="p-1.5" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={it.status}
                          onChange={(e) => handleUpdateItemField(it.id, 'status', e.target.value)}
                          className={`bg-slate-50 border border-slate-200 font-extrabold text-[10px] p-1 rounded-lg w-full cursor-pointer focus:bg-white ${
                            it.status === 'COMPLETADA' ? 'text-emerald-700 bg-emerald-50' :
                            it.status === 'EN_CURSO' ? 'text-blue-700 bg-blue-50' :
                            it.status === 'PENDIENTE' ? 'text-slate-500 bg-slate-50' : 'text-red-700 bg-red-50'
                          }`}
                        >
                          <option value="PENDIENTE">PENDIENTE</option>
                          <option value="EN_CURSO">EN CURSO</option>
                          <option value="COMPLETADA">COMPLETADA</option>
                          <option value="BLOQUEADO">🔒 BLOQUEADO</option>
                        </select>
                      </td>

                      {/* Actions inline */}
                      <td className="p-2 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Add structural sub-element inside */}
                          {it.level !== 'SUBSUBTAREA' && (
                            <button
                              onClick={() => {
                                const nextLvl = 
                                  it.level === 'MODULO' ? 'TAREA' :
                                  it.level === 'TAREA' ? 'SUBTAREA' : 'SUBSUBTAREA';
                                handleAddItem(nextLvl, it.id);
                              }}
                              className="bg-blue-50 hover:bg-blue-100 text-blue-600 p-1 rounded-md"
                              title={`Añadir element filial dentro de este`}
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          )}
                          
                          {/* Delete */}
                          <button
                            onClick={(e) => handleDeleteItem(it.id, e)}
                            className="opacity-0 group-hover:opacity-100 hover:bg-rose-100 text-slate-400 hover:text-red-500 p-1 rounded-md transition-all"
                            title="Eliminar este elemento y su rama jerárquica"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {/* Add Module base row */}
                <tr>
                  <td colSpan={10} className="p-4 bg-slate-50 text-center">
                    <button
                      onClick={() => handleAddItem('MODULO')}
                      type="button"
                      className="bg-white border border-slate-250 hover:bg-slate-100 text-slate-700 font-extrabold text-xs px-4 py-2.5 rounded-xl transition cursor-pointer inline-flex items-center gap-2 shadow-3xs"
                    >
                      <Plus className="w-4 h-4 text-blue-600" />
                      <span>Agregar Nuevo Módulo al Plan de Trabajo</span>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}




      {/* 5. RIGHT DRAWER DETAILS SIDE PANEL */}
      {activeItemId && selectedItem && (
        <div className="fixed inset-y-0 right-0 z-50 w-full sm:max-w-md bg-white border-l border-slate-200 shadow-2xl overflow-hidden flex flex-col animate-slideIn">
          {/* Header of Panel */}
          <div className="px-5 py-4 bg-slate-900 text-white flex justify-between items-center shrink-0">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-400" />
              <div>
                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 block font-mono">Detalles de Requerimiento</span>
                <h4 className="font-extrabold text-xs truncate max-w-[250px] font-sans">{selectedItem.name}</h4>
              </div>
            </div>
            <button
              onClick={() => setActiveItemId(null)}
              className="text-slate-400 hover:text-white font-bold text-lg px-2 select-none"
            >
              ×
            </button>
          </div>

          {/* Drawer Body - Scrollable content */}
          <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6">
            
            {/* Form Fields for updates */}
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1 font-mono">Nombre de Elemento</label>
                <input
                  type="text"
                  value={selectedItem.name}
                  onChange={(e) => handleUpdateItemField(selectedItem.id, 'name', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-250 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg px-3 py-2 text-xs text-slate-800 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1 font-mono">Fecha de Inicio</label>
                  <input
                    type="date"
                    value={selectedItem.startDate}
                    disabled={items.some(child => child.parentId === selectedItem.id) || isDevRole || !!selectedItem.sprintId}
                    onChange={(e) => handleUpdateItemField(selectedItem.id, 'startDate', e.target.value)}
                    title={items.some(child => child.parentId === selectedItem.id) ? "Calculado automáticamente de elementos secundarios" : selectedItem.sprintId ? "Bloqueado por Sprint asociado" : undefined}
                    className={`w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-mono font-semibold ${
                      items.some(child => child.parentId === selectedItem.id) || selectedItem.sprintId ? 'text-slate-450 bg-slate-100 opacity-70 cursor-not-allowed' : ''
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1 font-mono">Fecha de Entrega</label>
                  <input
                    type="date"
                    value={selectedItem.endDate}
                    disabled={items.some(child => child.parentId === selectedItem.id) || isDevRole || !!selectedItem.sprintId}
                    onChange={(e) => handleUpdateItemField(selectedItem.id, 'endDate', e.target.value)}
                    title={items.some(child => child.parentId === selectedItem.id) ? "Calculado automáticamente de elementos secundarios" : selectedItem.sprintId ? "Bloqueado por Sprint asociado" : undefined}
                    className={`w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-mono font-semibold ${
                      items.some(child => child.parentId === selectedItem.id) || selectedItem.sprintId ? 'text-slate-450 bg-slate-100 opacity-70 cursor-not-allowed' : ''
                    }`}
                  />
                </div>
                {selectedItem.sprintId && (
                  <div className="col-span-2 text-[10px] text-amber-700 bg-amber-50 px-2 py-1 rounded border border-amber-250 flex items-center gap-1 font-medium select-none">
                    <span>⚡ Fechas bloqueadas y sincronizadas con el Sprint.</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1 font-mono">Prioridad</label>
                  <select
                    value={selectedItem.priority}
                    onChange={(e) => handleUpdateItemField(selectedItem.id, 'priority', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-bold"
                  >
                    <option value="ALTA">🔴 ALTA</option>
                    <option value="MEDIA">🟡 MEDIA</option>
                    <option value="BAJA">🟢 BAJA</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1 font-mono">Estado</label>
                  <select
                    value={selectedItem.status}
                    onChange={(e) => handleUpdateItemField(selectedItem.id, 'status', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-bold"
                  >
                    <option value="PENDIENTE">PENDIENTE</option>
                    <option value="EN_CURSO">EN CURSO</option>
                    <option value="COMPLETADA">COMPLETADA</option>
                    <option value="BLOQUEADO">🔒 BLOQUEADO</option>
                  </select>
                </div>
              </div>

              {selectedItem.level !== 'MODULO' && selectedItem.level !== 'TAREA' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1 font-mono">Asignado A</label>
                    <select
                      value={selectedItem.assignedToId || ''}
                      onChange={(e) => handleUpdateItemField(selectedItem.id, 'assignedToId', e.target.value || undefined)}
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-semibold"
                    >
                      <option value="">Sin asignar</option>
                      {users.map(u => (
                        <option key={u.id} value={u.id}>
                          {u.first_name} {u.last_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1 font-mono">Progreso (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={selectedItem.progress}
                      onChange={(e) => handleUpdateItemField(selectedItem.id, 'progress', Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-lg px-3 py-1.5 text-xs text-slate-800 font-mono font-bold"
                    />
                  </div>
                </div>
              )}

              {selectedItem.level !== 'MODULO' && selectedItem.level !== 'TAREA' && projectSprints.length > 0 && (
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1 font-mono">Sprint Relacionado</label>
                  <select
                    value={selectedItem.sprintId || ''}
                    onChange={(e) => handleUpdateItemField(selectedItem.id, 'sprintId', e.target.value || undefined)}
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-lg px-3 py-2 text-xs text-slate-800 font-bold"
                  >
                    <option value="">Ninguno (Backlog del Proyecto)</option>
                    {projectSprints.map(s => (
                      <option key={s.id} value={s.id}>
                        ⚡ {s.name} ({s.status === 'ACTIVO' ? 'Activo' : s.status === 'PLANIFICADO' ? 'Planificado' : 'Finalizado'})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Pre-requisite Dependency selector (Multiple) */}
              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1 font-mono">Pre-requisitos De Dependencia (Múltiples)</label>
                
                {(() => {
                  const currentDeps = selectedItem.dependsOnIds || (selectedItem.dependsOnId ? [selectedItem.dependsOnId] : []);
                  return (
                    <div className="space-y-2">
                      {currentDeps.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 border border-slate-200 rounded-lg min-h-[38px]">
                          {currentDeps.map(depId => {
                            const depItem = items.find(it => it.id === depId);
                            if (!depItem) return null;
                            return (
                              <span 
                                key={depId} 
                                className="inline-flex items-center gap-1 bg-violet-50 text-violet-700 border border-violet-150 px-2 py-0.5 rounded text-[10px] font-bold font-mono"
                              >
                                <span>[{wbsNumbers[depId] || ''}] {depItem.name}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const nextDeps = currentDeps.filter(id => id !== depId);
                                    handleUpdateItemField(selectedItem.id, 'dependsOnIds', nextDeps);
                                  }}
                                  className="text-violet-400 hover:text-violet-600 focus:outline-none font-black text-[10px] px-0.5"
                                  title="Quitar dependencia"
                                >
                                  ×
                                </button>
                              </span>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-[10px] text-slate-400 italic bg-slate-50 border border-slate-150 rounded-lg p-2.5 text-center select-none">
                          Ninguna (Tarea independiente)
                        </div>
                      )}

                      {/* Dropdown list of potential dependencies with scroll & search */}
                      <div className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-xs">
                        <div className="bg-slate-50 border-b border-slate-150 p-1.5 flex items-center gap-1.5">
                          <input
                            type="text"
                            value={sidebarDepSearch}
                            onChange={(e) => setSidebarDepSearch(e.target.value)}
                            placeholder="Buscar dependencia..."
                            className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-[11px] placeholder-slate-400 focus:outline-hidden"
                          />
                          {sidebarDepSearch && (
                            <button
                              type="button"
                              onClick={() => setSidebarDepSearch('')}
                              className="text-xs text-slate-400 hover:text-slate-600 px-1 font-bold"
                            >
                              ✕
                            </button>
                          )}
                        </div>

                        <div className="max-h-36 overflow-y-auto divide-y divide-slate-100">
                          {(() => {
                            const eligibleItems = items.filter(it => it.id !== selectedItem.id && it.level !== 'MODULO');
                            const searchLower = sidebarDepSearch.toLowerCase();
                            const filteredEligible = eligibleItems.filter(it => {
                              const wbs = wbsNumbers[it.id] || '';
                              return it.name.toLowerCase().includes(searchLower) || wbs.includes(searchLower);
                            });

                            if (filteredEligible.length === 0) {
                              return (
                                <div className="text-[10px] text-slate-400 italic p-3 text-center">
                                  No se encontraron actividades
                                </div>
                              );
                            }

                            return filteredEligible.map(it => {
                              const isChecked = currentDeps.includes(it.id);
                              return (
                                <label 
                                  key={it.id} 
                                  className="flex items-center gap-2 px-2.5 py-1.5 hover:bg-slate-50 cursor-pointer text-[11px] text-slate-700 font-medium select-none"
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => {
                                      const nextDeps = isChecked 
                                        ? currentDeps.filter(id => id !== it.id)
                                        : [...currentDeps, it.id];
                                      handleUpdateItemField(selectedItem.id, 'dependsOnIds', nextDeps);
                                    }}
                                    className="rounded border-slate-300 text-violet-600 focus:ring-violet-500 h-3.5 w-3.5 shrink-0"
                                  />
                                  <span className="font-bold text-slate-400 font-mono text-[9px] shrink-0">
                                    {wbsNumbers[it.id] || ''}
                                  </span>
                                  <span className="truncate">{it.name}</span>
                                </label>
                              );
                            });
                          })()}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Evidence & support documents uploads (Simulated Storage) */}
            <div className="border-t border-slate-100 pt-5 space-y-3">
              <h5 className="font-bold text-slate-900 text-xs flex items-center gap-1.5 select-none font-mono">
                <Paperclip className="w-4 h-4 text-blue-600 font-mono" />
                <span>Documentos de Evidencia de Entrega</span>
              </h5>

              {/* Mode toggler */}
              <div className="flex bg-slate-100 p-1 rounded-lg gap-1">
                <button
                  type="button"
                  onClick={() => setWbsAttachmentMode('file')}
                  className={`flex-1 text-[11px] font-bold py-1 rounded transition ${wbsAttachmentMode === 'file' ? 'bg-white shadow-3xs text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  Archivo Local
                </button>
                <button
                  type="button"
                  onClick={() => setWbsAttachmentMode('link')}
                  className={`flex-1 text-[11px] font-bold py-1 rounded transition ${wbsAttachmentMode === 'link' ? 'bg-white shadow-3xs text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  Enlace Web (URL)
                </button>
              </div>
              
              {wbsAttachmentMode === 'file' ? (
                /* Drag and drop zone */
                <div
                  onDragOver={e => { e.preventDefault(); setIsDraggingFile(true); }}
                  onDragLeave={() => setIsDraggingFile(false)}
                  onDrop={handleFileDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition ${isDraggingFile ? 'border-blue-500 bg-blue-50/50' : 'border-slate-200 hover:bg-slate-50'}`}
                >
                  <span className="block text-[11px] text-slate-500 font-semibold">Deslice un archivo de soporte o haga clic</span>
                  <span className="block text-[9px] text-slate-440 mt-0.5">Almacenamiento seguro para guardar logs de pruebas</span>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="bg-white border text-slate-700 border-slate-200 rounded-xl p-3 space-y-2.5">
                  <span className="block text-[10px] font-bold text-slate-500 uppercase font-mono">Vincular Recurso Externo / Enlace Nube</span>
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      value={wbsSupportUrl}
                      onChange={e => setWbsSupportUrl(e.target.value)}
                      placeholder="Pegue el enlace aquí (ej: https://drive.google.com/...)"
                      className="flex-1 bg-slate-50 focus:bg-white border border-slate-250 rounded-md p-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleAddWbsLink}
                      disabled={!wbsSupportUrl.trim()}
                      className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs px-3.5 rounded-lg transition-all cursor-pointer shadow-3xs"
                    >
                      Vincular
                    </button>
                  </div>
                </div>
              )}

              {/* File List */}
              {selectedItem.evidenceFiles.length > 0 ? (
                <div className="space-y-1.5 pt-1">
                  {selectedItem.evidenceFiles.map(ev => {
                    const isLink = ev.externalUrl || ev.fileName.startsWith('http://') || ev.fileName.startsWith('https://');
                    return (
                      <div key={ev.id} className="bg-slate-50 border border-slate-200 p-2.5 rounded-lg flex justify-between items-center">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          {isLink ? (
                            <svg className="w-3.5 h-3.5 text-blue-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                          ) : (
                            <Paperclip className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          )}
                          <div className="truncate flex-1">
                            {isLink ? (
                              <a 
                                href={ev.externalUrl || ev.fileName} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="block text-[11px] font-bold text-blue-600 hover:underline truncate animate-pulse"
                                title="Haga clic para abrir el enlace externo en nueva pestaña"
                              >
                                {ev.fileName} ↗
                              </a>
                            ) : (
                              <button 
                                onClick={() => handleDownloadEvidence(ev)}
                                className="block text-[11px] font-bold text-slate-700 hover:text-blue-600 hover:underline truncate text-left cursor-pointer flex items-center gap-1.5"
                                title="Haga clic para descargar este archivo de evidencia"
                              >
                                <span className="truncate">{ev.fileName}</span>
                                <Download className="w-3 h-3 text-slate-400 hover:text-blue-600 shrink-0 inline-block" />
                              </button>
                            )}
                            <span className="block text-[9px] text-slate-400 font-mono font-medium">{ev.fileSize} • Subido por: {ev.uploadedBy}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteEvidence(ev.id)}
                          className="text-slate-400 hover:text-red-500 p-1 rounded-md text-sm cursor-pointer ml-1"
                          title="Eliminar soporte"
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-[10px] text-slate-400 italic text-center py-1">Ninguna evidencia cargada en esta tarea.</p>
              )}
            </div>

            {/* Comments block */}
            <div className="border-t border-slate-100 pt-5 space-y-3">
              <h5 className="font-bold text-slate-900 text-xs flex items-center gap-1.5 select-none">
                <MessageSquare className="w-4 h-4 text-blue-600" />
                <span>Historial de Comentarios Técnicos</span>
              </h5>

              {/* Comment logs */}
              {selectedItem.comments.length > 0 ? (
                <div className="space-y-3 max-h-52 overflow-y-auto pr-1">
                  {selectedItem.comments.map(c => (
                    <div key={c.id} className="bg-slate-50 border border-slate-150 p-2.5 rounded-lg space-y-1">
                      <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                        <span className="font-bold text-blue-700">{c.userName} ({c.userRole})</span>
                        <span>{c.timestamp}</span>
                      </div>
                      <p className="text-[11px] text-slate-700 font-sans leading-relaxed">{c.text}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[10px] text-slate-400 italic text-center py-1">Ningún comentario cargado.</p>
              )}

              {/* Submission block */}
              <form onSubmit={handleAddComment} className="flex gap-1.5 pt-1">
                <input
                  type="text"
                  placeholder="Agregar un comentario..."
                  value={newCommentText}
                  onChange={e => setNewCommentText(e.target.value)}
                  className="flex-1 bg-slate-50 border border-slate-200 outline-none focus:bg-white rounded-lg px-2.5 py-1.5 text-xs"
                />
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm cursor-pointer"
                >
                  Enviar
                </button>
              </form>
            </div>
          </div>

          {/* Close Panel Drawer Footer */}
          <div className="px-5 py-4 border-t border-slate-150 bg-slate-50 flex justify-end gap-2 shrink-0">
            <button
              onClick={() => setActiveItemId(null)}
              className="bg-slate-200 hover:bg-slate-250 text-slate-700 font-bold text-xs px-4 py-2 rounded-lg transition"
            >
              Guardar y Cerrar
            </button>
          </div>
        </div>
      )}

      {/* 6. FLOATING RIGHT-CLICK CONTEXT MENU */}
      {contextMenu && (
        <div 
          className="fixed z-50 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 min-w-[200px] animate-fadeIn text-xs text-slate-700"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-3 py-1 text-[10px] text-slate-400 font-extrabold uppercase tracking-wide border-b border-slate-100 select-none font-mono">
            Opciones de Estructura
          </div>
          
          <button
            onClick={() => {
              handleConvertLevel(contextMenu.itemId, 'MODULO');
              setContextMenu(null);
            }}
            type="button"
            className="w-full text-left px-3 py-1.5 hover:bg-slate-50 flex items-center gap-2 cursor-pointer transition text-slate-700 font-medium"
          >
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            Convertir a <strong className="font-semibold text-blue-900">MÓDULO</strong>
          </button>
          <button
            onClick={() => {
              handleConvertLevel(contextMenu.itemId, 'TAREA');
              setContextMenu(null);
            }}
            type="button"
            className="w-full text-left px-3 py-1.5 hover:bg-slate-50 flex items-center gap-2 cursor-pointer transition text-slate-700 font-medium"
          >
            <span className="w-2 h-2 rounded-full bg-slate-400"></span>
            Convertir a <strong className="font-semibold text-slate-900">TAREA</strong>
          </button>
          <button
            onClick={() => {
              handleConvertLevel(contextMenu.itemId, 'SUBTAREA');
              setContextMenu(null);
            }}
            type="button"
            className="w-full text-left px-3 py-1.5 hover:bg-slate-50 flex items-center gap-2 cursor-pointer transition text-slate-700 font-medium"
          >
            <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
            Convertir a <strong className="font-semibold text-indigo-900">SUBTAREA</strong>
          </button>
          <button
            onClick={() => {
              handleConvertLevel(contextMenu.itemId, 'SUBSUBTAREA');
              setContextMenu(null);
            }}
            type="button"
            className="w-full text-left px-3 py-1.5 hover:bg-slate-50 flex items-center gap-2 cursor-pointer transition text-slate-700 font-medium"
          >
            <span className="w-2 h-2 rounded-full bg-violet-600"></span>
            Convertir a <strong className="font-semibold text-violet-900">SUBSUBTAREA</strong>
          </button>
          
          <div className="border-t border-slate-100 my-1"></div>
          
          <button
            onClick={() => {
              handleIndentOutdent(contextMenu.itemId, 'indent');
              setContextMenu(null);
            }}
            type="button"
            className="w-full text-left px-3 py-1.5 hover:bg-slate-50 flex items-center gap-2 cursor-pointer transition text-slate-700 font-medium"
          >
            <span>➡️</span> Indentar (Hacer subtarea)
          </button>
          <button
            onClick={() => {
              handleIndentOutdent(contextMenu.itemId, 'outdent');
              setContextMenu(null);
            }}
            type="button"
            className="w-full text-left px-3 py-1.5 hover:bg-slate-50 flex items-center gap-2 cursor-pointer transition text-slate-700 font-medium"
          >
            <span>⬅️</span> Outdent (Subir un nivel)
          </button>
          
          <div className="border-t border-slate-100 my-1"></div>
          
          <button
            onClick={() => {
              handleDeleteItem(contextMenu.itemId);
              setContextMenu(null);
            }}
            type="button"
            className="w-full text-left px-3 py-1.5 hover:bg-red-50 text-red-650 flex items-center gap-2 font-semibold cursor-pointer transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Eliminar Elemento
          </button>
        </div>
      )}

      {/* 5.5 MODAL DE EDICIÓN DE SUBTAREA (DOBLE CLIC) */}
      {editingSubtaskId && draftSubtask && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={() => {
              setEditingSubtaskId(null);
              setDraftSubtask(null);
            }}
          ></div>
          
          {/* Modal Container */}
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-150 max-w-lg w-full overflow-hidden flex flex-col relative z-10 animate-scaleUp max-h-[90vh]">
            {/* Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="bg-violet-600 p-1.5 rounded-lg text-white">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-violet-300 block font-mono">Diseño de Estructura - Edición de Subtarea</span>
                  <h4 className="font-extrabold text-sm font-sans tracking-tight">Editar: {draftSubtask.name}</h4>
                </div>
              </div>
              <button
                onClick={() => {
                  setEditingSubtaskId(null);
                  setDraftSubtask(null);
                }}
                className="text-slate-400 hover:text-white font-bold text-xl p-1 hover:bg-slate-800 rounded transition cursor-pointer select-none"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content (Scrollable) */}
            <div className="p-6 overflow-y-auto space-y-4">
              
              {/* Field 1: Name */}
              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1 font-mono">Nombre de la Subtarea</label>
                <textarea
                  rows={2}
                  value={draftSubtask.name}
                  onChange={(e) => handleUpdateDraftField('name', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500 rounded-lg px-3 py-2 text-xs text-slate-800 font-bold resize-none"
                  placeholder="Ej. Crear script de migración para endpoints..."
                />
              </div>

              {/* Field 2 & 3: Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1 font-mono">Fecha de Inicio</label>
                  <div className="relative">
                    <input
                      type="date"
                      value={draftSubtask.startDate}
                      disabled={isDevRole}
                      onChange={(e) => handleUpdateDraftField('startDate', e.target.value)}
                      className={`w-full bg-slate-50 border border-slate-250 focus:bg-white rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-mono font-semibold ${
                        isDevRole ? 'opacity-60 cursor-not-allowed bg-slate-100' : ''
                      }`}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1 font-mono">Fecha de Entrega</label>
                  <div className="relative">
                    <input
                      type="date"
                      value={draftSubtask.endDate}
                      disabled={isDevRole}
                      onChange={(e) => handleUpdateDraftField('endDate', e.target.value)}
                      className={`w-full bg-slate-50 border border-slate-250 focus:bg-white rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-mono font-semibold ${
                        isDevRole ? 'opacity-60 cursor-not-allowed bg-slate-100' : ''
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Inline Date Validation Warning */}
              {draftSubtask.startDate && draftSubtask.endDate && (() => {
                const sDate = new Date(draftSubtask.startDate).getTime();
                const eDate = new Date(draftSubtask.endDate).getTime();
                if (!isNaN(sDate) && !isNaN(eDate) && eDate < sDate) {
                  return (
                    <div className="flex items-center gap-2 p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-[11px] text-rose-700 font-medium">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
                      <span>La fecha de entrega no puede ser menor a la fecha de inicio.</span>
                    </div>
                  );
                }
                return null;
              })()}

              {/* Field 4 & 5: Responsibility and Priority */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1 font-mono">Responsable</label>
                  <select
                    value={draftSubtask.assignedToId || ''}
                    disabled={isDevRole}
                    onChange={(e) => handleUpdateDraftField('assignedToId', e.target.value || undefined)}
                    className={`w-full bg-slate-50 border border-slate-250 focus:bg-white rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-bold ${
                      isDevRole ? 'opacity-60 cursor-not-allowed bg-slate-100' : ''
                    }`}
                  >
                    <option value="">Sin asignar</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.first_name} {u.last_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1 font-mono">Prioridad</label>
                  <select
                    value={draftSubtask.priority}
                    onChange={(e) => handleUpdateDraftField('priority', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-250 focus:bg-white rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-bold"
                  >
                    <option value="ALTA">🔴 ALTA</option>
                    <option value="MEDIA">🟡 MEDIA</option>
                    <option value="BAJA">🟢 BAJA</option>
                  </select>
                </div>
              </div>

              {/* Field 6 & 7: Progress and Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1 font-mono">Progreso % ({draftSubtask.progress}%)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={draftSubtask.progress}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        handleUpdateDraftField('progress', val);
                        if (val === 100) {
                          handleUpdateDraftField('status', 'COMPLETADA');
                        } else if (val >= 1 && val <= 99) {
                          handleUpdateDraftField('status', 'EN_CURSO');
                        } else if (val === 0) {
                          handleUpdateDraftField('status', 'PENDIENTE');
                        }
                      }}
                      className="w-full accent-violet-600 h-2 bg-slate-100 rounded-lg cursor-pointer animate-none"
                    />
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="5"
                      value={draftSubtask.progress}
                      onChange={(e) => {
                        const val = Math.max(0, Math.min(100, Number(e.target.value)));
                        handleUpdateDraftField('progress', val);
                        if (val === 100) {
                          handleUpdateDraftField('status', 'COMPLETADA');
                        } else if (val >= 1 && val <= 99) {
                          handleUpdateDraftField('status', 'EN_CURSO');
                        } else if (val === 0) {
                          handleUpdateDraftField('status', 'PENDIENTE');
                        }
                      }}
                      className="w-12 bg-slate-50 border border-slate-200 rounded text-center py-0.5 text-xs font-bold font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1 font-mono">Estado</label>
                  <select
                    value={draftSubtask.status}
                    onChange={(e) => {
                      const stat = e.target.value;
                      handleUpdateDraftField('status', stat);
                      if (stat === 'COMPLETADA') {
                        handleUpdateDraftField('progress', 100);
                      } else if (stat === 'PENDIENTE') {
                        handleUpdateDraftField('progress', 0);
                      } else if (stat === 'EN_CURSO') {
                        if (draftSubtask.progress === 0 || draftSubtask.progress === 100) {
                          handleUpdateDraftField('progress', 50);
                        }
                      }
                    }}
                    className="w-full bg-slate-50 border border-slate-250 focus:bg-white rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-bold"
                  >
                    <option value="PENDIENTE">PENDIENTE</option>
                    <option value="EN_CURSO">EN CURSO</option>
                    <option value="COMPLETADA">COMPLETADA</option>
                    <option value="BLOQUEADO">BLOQUEADO</option>
                  </select>
                </div>
              </div>

              {/* Pre-requisito De Dependencia (Múltiples) */}
              <div className="border-t border-slate-100 pt-4 mt-2">
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1 font-mono">Pre-requisitos De Dependencia (Múltiples)</label>
                
                {(() => {
                  const currentDeps = draftSubtask.dependsOnIds || (draftSubtask.dependsOnId ? [draftSubtask.dependsOnId] : []);
                  return (
                    <div className="space-y-2">
                      {/* Selected badges */}
                      {currentDeps.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 border border-slate-200 rounded-lg min-h-[38px]">
                          {currentDeps.map(depId => {
                            const depItem = items.find(it => it.id === depId);
                            if (!depItem) return null;
                            return (
                              <span 
                                key={depId} 
                                className="inline-flex items-center gap-1 bg-violet-50 text-violet-700 border border-violet-150 px-2 py-0.5 rounded text-[10px] font-bold font-mono"
                              >
                                <span>[{wbsNumbers[depId] || ''}] {depItem.name}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const nextDeps = currentDeps.filter(id => id !== depId);
                                    handleUpdateDraftField('dependsOnIds', nextDeps);
                                  }}
                                  className="text-violet-400 hover:text-violet-600 focus:outline-none font-black text-[10px] px-0.5"
                                  title="Quitar dependencia"
                                >
                                  ×
                                </button>
                              </span>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-[10px] text-slate-400 italic bg-slate-50 border border-slate-150 rounded-lg p-2.5 text-center select-none">
                          Ninguna (Tarea independiente)
                        </div>
                      )}

                      {/* Dropdown filter box */}
                      <div className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-xs">
                        <div className="bg-slate-50 border-b border-slate-150 p-1.5 flex items-center gap-1.5">
                          <input
                            type="text"
                            value={modalDepSearch}
                            onChange={(e) => setModalDepSearch(e.target.value)}
                            placeholder="Buscar dependencia..."
                            className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-[11px] placeholder-slate-400 focus:outline-hidden"
                          />
                          {modalDepSearch && (
                            <button
                              type="button"
                              onClick={() => setModalDepSearch('')}
                              className="text-xs text-slate-400 hover:text-slate-600 px-1 font-bold"
                            >
                              ✕
                            </button>
                          )}
                        </div>

                        <div className="max-h-36 overflow-y-auto divide-y divide-slate-100">
                          {(() => {
                            const eligibleItems = items.filter(it => it.id !== draftSubtask.id && it.level !== 'MODULO');
                            const searchLower = modalDepSearch.toLowerCase();
                            const filteredEligible = eligibleItems.filter(it => {
                              const wbs = wbsNumbers[it.id] || '';
                              return it.name.toLowerCase().includes(searchLower) || wbs.includes(searchLower);
                            });

                            if (filteredEligible.length === 0) {
                              return (
                                <div className="text-[10px] text-slate-400 italic p-3 text-center">
                                  No se encontraron actividades
                                </div>
                              );
                            }

                            return filteredEligible.map(it => {
                              const isChecked = currentDeps.includes(it.id);
                              return (
                                <label 
                                  key={it.id} 
                                  className="flex items-center gap-2 px-2.5 py-1.5 hover:bg-slate-50 cursor-pointer text-[11px] text-slate-700 font-medium select-none"
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => {
                                      const nextDeps = isChecked 
                                        ? currentDeps.filter(id => id !== it.id)
                                        : [...currentDeps, it.id];
                                      handleUpdateDraftField('dependsOnIds', nextDeps);
                                    }}
                                    className="rounded border-slate-300 text-violet-600 focus:ring-violet-500 h-3.5 w-3.5 shrink-0"
                                  />
                                  <span className="font-bold text-slate-400 font-mono text-[9px] shrink-0">
                                    {wbsNumbers[it.id] || ''}
                                  </span>
                                  <span className="truncate">{it.name}</span>
                                </label>
                              );
                            });
                          })()}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

            </div>

            {/* Footer Buttons */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setEditingSubtaskId(null);
                  setDraftSubtask(null);
                }}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-150 hover:text-slate-800 transition cursor-pointer font-sans"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveSubtaskDraft}
                disabled={(() => {
                  if (!draftSubtask.startDate || !draftSubtask.endDate) return false;
                  const sTime = new Date(draftSubtask.startDate).getTime();
                  const eTime = new Date(draftSubtask.endDate).getTime();
                  return !isNaN(sTime) && !isNaN(eTime) && eTime < sTime;
                })()}
                className={`px-5 py-2 rounded-lg text-xs font-bold shadow-sm transition flex items-center gap-1.5 font-sans ${
                  draftSubtask.startDate && draftSubtask.endDate && (new Date(draftSubtask.endDate).getTime() < new Date(draftSubtask.startDate).getTime())
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                    : 'bg-violet-600 hover:bg-violet-750 text-white cursor-pointer hover:shadow'
                }`}
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirmState && deleteConfirmState.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-[99999] p-4 text-slate-800 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full border border-slate-100 overflow-hidden">
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
