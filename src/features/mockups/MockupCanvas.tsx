/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Project } from '../../types';
import { 
  Plus, 
  Minus, 
  Maximize2, 
  RefreshCw, 
  Layers, 
  Upload, 
  Link as LinkIcon, 
  Check, 
  Trash2, 
  ChevronRight, 
  Image as ImageIcon, 
  ZoomIn, 
  ZoomOut, 
  Move, 
  ArrowUp, 
  ArrowDown, 
  ArrowLeft, 
  ArrowRight,
  Info,
  History,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface MockupVersion {
  id: string;
  version: number;
  url: string;
  fileName?: string;
  notes: string;
  updatedAt: string;
  author: string;
}

interface ProjectDivision {
  id: string;
  name: string;
  activeVersionId: string | null;
  versions: MockupVersion[];
}

interface MockupCanvasProps {
  projects: Project[];
  selectedProjectId: string;
  setSelectedProjectId: (id: string) => void;
}

// Curated high-fidelity mockups for demo references
const DEFAULT_PRESET_IMAGES = [
  {
    name: '💻 Analytics Web Dashboard',
    url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80',
    description: 'Diseño preliminar del dashboard web con gráficos D3 y control de costos.'
  },
  {
    name: '📱 iOS Mobile App Wallet',
    url: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=1200&q=80',
    description: 'Interfaz nativa móvil para iPhone - Transacciones y vista de portafolios.'
  },
  {
    name: '🤖 Tablet Android Interface',
    url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80',
    description: 'Boceto interactivo para tablet de control de inventarios de ingeniería.'
  },
  {
    name: '⚙️ Backoffice & Admin Panel',
    url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80',
    description: 'Consola de gestión para administradores, auditorías de seguridad y multi-tenant.'
  }
];

// Seed standard divisions with mock version history
const getInitialDivisions = (): ProjectDivision[] => [
  {
    id: 'web',
    name: 'Web (Desktop Portal)',
    activeVersionId: 'v-web-2',
    versions: [
      {
        id: 'v-web-1',
        version: 1,
        url: DEFAULT_PRESET_IMAGES[0].url,
        fileName: 'dashboard_v1_draft.png',
        notes: 'Borrador inicial del portal de control para aprobación del Product Owner.',
        updatedAt: '2026-06-02T14:30:00Z',
        author: 'Mateo Herrera (PO)'
      },
      {
        id: 'v-web-2',
        version: 2,
        url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80',
        fileName: 'dashboard_v2_final.png',
        notes: 'Rediseño de KPI con colores corporativos e integración de filtros de sprint.',
        updatedAt: '2026-06-05T10:15:00Z',
        author: 'Valentina Rojas (QA)'
      }
    ]
  },
  {
    id: 'movil',
    name: 'Móvil (iOS Wallet)',
    activeVersionId: 'v-movil-1',
    versions: [
      {
        id: 'v-movil-1',
        version: 1,
        url: DEFAULT_PRESET_IMAGES[1].url,
        fileName: 'ios_wallet_v1.png',
        notes: 'Diagrama de flujo de inicio de sesión y tablero de transacciones rápidas.',
        updatedAt: '2026-06-04T16:45:00Z',
        author: 'Mateo Herrera (PO)'
      }
    ]
  },
  {
    id: 'android',
    name: 'Android (Tablet Native)',
    activeVersionId: 'v-android-1',
    versions: [
      {
        id: 'v-android-1',
        version: 1,
        url: DEFAULT_PRESET_IMAGES[2].url,
        fileName: 'android_production_layout.png',
        notes: 'Esquema técnico preliminar para pantallas de operario en fábrica.',
        updatedAt: '2026-06-03T11:20:00Z',
        author: 'Carlos Pérez (PM)'
      }
    ]
  },
  {
    id: 'admin',
    name: 'Administración (Consola Backoffice)',
    activeVersionId: 'v-admin-1',
    versions: [
      {
        id: 'v-admin-1',
        version: 1,
        url: DEFAULT_PRESET_IMAGES[3].url,
        fileName: 'admin_backpanel_v1.png',
        notes: 'Caso de uso para visualización de logs multi-tenant e inventario general.',
        updatedAt: '2026-06-01T09:00:00Z',
        author: 'Carlos Pérez (PM)'
      }
    ]
  }
];

export default function MockupCanvas({
  projects,
  selectedProjectId,
  setSelectedProjectId
}: MockupCanvasProps) {
  
  // Standard selected project data
  const currentProject = projects.find(p => p.id === selectedProjectId) || projects[0];

  // Custom confirmation modal state to bypass iframe window.confirm blocks
  const [deleteConfirmState, setDeleteConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  // Persistent mockups database by project ID
  const [projectData, setProjectData] = useState<{ [projId: string]: ProjectDivision[] }>(() => {
    const saved = localStorage.getItem('gcp_mockup_divisions_v2');
    if (saved && saved !== "null" && saved !== "undefined") {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return parsed;
        }
      } catch (e) {
        console.error('Error parseando mockup divisions local storage', e);
      }
    }
    
    // Seed initial data for existing projects
    const initial: { [projId: string]: ProjectDivision[] } = {};
    initial['proj-1'] = getInitialDivisions();
    initial['proj-2'] = [
      {
        id: 'web',
        name: 'Web (Desktop Portal)',
        activeVersionId: 'v-proj2-web-1',
        versions: [
          {
            id: 'v-proj2-web-1',
            version: 1,
            url: DEFAULT_PRESET_IMAGES[3].url,
            fileName: 'backoffice_p2_v1.jpg',
            notes: 'Dashboard administrativo para el portafolio de telecomunicaciones.',
            updatedAt: '2026-06-04T12:00:00Z',
            author: 'Laura Gómez (PO)'
          }
        ]
      },
      {
        id: 'movil',
        name: 'Móvil (Android Client)',
        activeVersionId: null,
        versions: []
      }
    ];
    
    return initial;
  });

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem('gcp_mockup_divisions_v2', JSON.stringify(projectData));
  }, [projectData]);

  // Current active Divisions for selected project
  const activeDivisions = projectData[selectedProjectId] || [
    { id: 'web', name: 'Web', activeVersionId: null, versions: [] },
    { id: 'movil', name: 'Móvil (iOS)', activeVersionId: null, versions: [] },
    { id: 'android', name: 'Android', activeVersionId: null, versions: [] },
    { id: 'admin', name: 'Administración', activeVersionId: null, versions: [] },
  ];

  // Selected Division State
  const [selectedDivisionId, setSelectedDivisionId] = useState<string>('web');

  // Verify chosen division exists for the current output, otherwise default to first available
  const activeDivision = activeDivisions.find(div => div.id === selectedDivisionId) || activeDivisions[0] || null;

  // Modals Toggles State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showAddDivision, setShowAddDivision] = useState(false);
  const [showFullscreenModal, setShowFullscreenModal] = useState(false);
  const [fullscreenImageUrl, setFullscreenImageUrl] = useState<string | null>(null);
  const [fullscreenTitle, setFullscreenTitle] = useState<string>('');
  const [newDivisionName, setNewDivisionName] = useState('');

  // New mockup image form inputs
  const [newMockUrl, setNewMockUrl] = useState('');
  const [newMockNotes, setNewMockNotes] = useState('');
  const [customAuthor, setCustomAuthor] = useState('Mateo Herrera (PO)');
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'err'; text: string } | null>(null);

  // Drag & Canvas zoom states
  const [scale, setScale] = useState<number>(1);
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 640) {
      setScale(0.6);
    }
  }, []);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [showGrid, setShowGrid] = useState<boolean>(true);

  // Fullscreen Drag & zoom states
  const [fsScale, setFsScale] = useState<number>(1);
  const [fsOffset, setFsOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [fsIsDragging, setFsIsDragging] = useState<boolean>(false);
  const [fsDragStart, setFsDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Reset zoom & pan when entering fullscreen
  useEffect(() => {
    if (showFullscreenModal) {
      setFsScale(1);
      setFsOffset({ x: 0, y: 0 });
    }
  }, [showFullscreenModal]);

  const handleFsZoomIn = () => setFsScale(s => Math.min(s + 1.0, 10.0));
  const handleFsZoomOut = () => setFsScale(s => Math.max(s - 1.0, 1.0));
  const handleFsZoomReset = () => {
    setFsScale(1);
    setFsOffset({ x: 0, y: 0 });
  };

  const handleFsMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left click drag
    e.preventDefault();
    setFsIsDragging(true);
    setFsDragStart({ x: e.clientX - fsOffset.x, y: e.clientY - fsOffset.y });
  };

  const handleFsMouseMove = (e: React.MouseEvent) => {
    if (!fsIsDragging) return;
    setFsOffset({
      x: e.clientX - fsDragStart.x,
      y: e.clientY - fsDragStart.y
    });
  };

  const handleFsMouseUpOrLeave = () => {
    setFsIsDragging(false);
  };

  const handleFsWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = 1.0;
    if (e.deltaY < 0) {
      setFsScale(s => Math.min(s + zoomFactor, 10.0));
    } else {
      setFsScale(s => Math.max(s - zoomFactor, 1.0));
    }
  };

  const handleFsMove = (direction: 'up' | 'down' | 'left' | 'right') => {
    const step = 50;
    setFsOffset(prev => {
      switch (direction) {
        case 'up': return { ...prev, y: prev.y - step };
        case 'down': return { ...prev, y: prev.y + step };
        case 'left': return { ...prev, x: prev.x - step };
        case 'right': return { ...prev, x: prev.x + step };
        default: return prev;
      }
    });
  };

  const canvasRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Load active versions of the mockup
  const activeVersion = activeDivision && activeDivision.versions 
    ? activeDivision.versions.find(v => v.id === activeDivision.activeVersionId) 
    : null;

  // Clean feedback after delay
  useEffect(() => {
    if (feedbackMsg) {
      const timer = setTimeout(() => setFeedbackMsg(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [feedbackMsg]);

  // Reset zoom & pan when active mockup changes
  useEffect(() => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  }, [selectedProjectId, selectedDivisionId, activeDivision?.activeVersionId]);

  // Listen for Escape key to exit fullscreen mockup presentation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowFullscreenModal(false);
        setFullscreenImageUrl(null);
      }
    };
    if (showFullscreenModal) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showFullscreenModal]);

  // Zoom manipulation actions
  const handleZoomIn = () => setScale(s => Math.min(s + 1.0, 10.0));
  const handleZoomOut = () => setScale(s => Math.max(s - 1.0, 1.0));
  const handleZoomReset = () => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  };

  // Directional Fine-Tuning controls
  const handleMove = (direction: 'up' | 'down' | 'left' | 'right') => {
    const step = 40;
    setOffset(prev => {
      switch (direction) {
        case 'up': return { ...prev, y: prev.y - step };
        case 'down': return { ...prev, y: prev.y + step };
        case 'left': return { ...prev, x: prev.x - step };
        case 'right': return { ...prev, x: prev.x + step };
        default: return prev;
      }
    });
  };

  // Mouse Drag implementation
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left click drag
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  // Wheel zoom helper
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = 1.0;
    if (e.deltaY < 0) {
      setScale(s => Math.min(s + zoomFactor, 10.0));
    } else {
      setScale(s => Math.max(s - zoomFactor, 1.0));
    }
  };

  // Add custom layout division to selected project
  const handleCreateDivision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDivisionName.trim()) return;

    const divId = newDivisionName.trim().toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-');

    if (activeDivisions.some(d => d.id === divId)) {
      setFeedbackMsg({ type: 'err', text: 'Ya existe una división con ese nombre.' });
      return;
    }

    const newDiv: ProjectDivision = {
      id: divId,
      name: newDivisionName.trim(),
      activeVersionId: null,
      versions: []
    };

    const updatedDivs = [...activeDivisions, newDiv];
    setProjectData(prev => ({
      ...prev,
      [selectedProjectId]: updatedDivs
    }));

    setSelectedDivisionId(divId);
    setNewDivisionName('');
    setShowAddDivision(false);
    setFeedbackMsg({ type: 'success', text: `División "${newDiv.name}" creada correctamente.` });
  };

  // General add/upload of a mockup image
  const addNewMockupVersion = (url: string, sourceName: string) => {
    if (!activeDivision) return;

    const vNumber = activeDivision.versions.length + 1;
    const newVerId = `v-${selectedDivisionId}-${Date.now()}`;
    
    const newVersion: MockupVersion = {
      id: newVerId,
      version: vNumber,
      url: url,
      fileName: sourceName || `mockup_v${vNumber}.png`,
      notes: newMockNotes.trim() || `Subida rápida de mockup V${vNumber}.`,
      updatedAt: new Date().toISOString(),
      author: customAuthor
    };

    const updatedVersions = [newVersion, ...activeDivision.versions];
    
    const updatedDivs = activeDivisions.map(d => {
      if (d.id === selectedDivisionId) {
        return {
          ...d,
          activeVersionId: newVerId,
          versions: updatedVersions
        };
      }
      return d;
    });

    setProjectData(prev => ({
      ...prev,
      [selectedProjectId]: updatedDivs
    }));

    setNewMockNotes('');
    setNewMockUrl('');
    setFeedbackMsg({ type: 'success', text: `Añadida versión ${vNumber} y asignada como activa.` });
  };

  // Trigger from URL form
  const handleAddFromUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMockUrl.trim()) return;
    
    // Simple verification check for URL
    if (!newMockUrl.trim().startsWith('http://') && !newMockUrl.trim().startsWith('https://') && !newMockUrl.trim().startsWith('data:image')) {
      setFeedbackMsg({ type: 'err', text: 'Por favor, introduce una URL de imagen válida.' });
      return;
    }

    addNewMockupVersion(newMockUrl.trim(), 'url_source_link.jpg');
  };

  // Trigger from File selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2.5 * 1024 * 1024) {
      setFeedbackMsg({ type: 'err', text: 'La imagen excede los 2.5 MB. Elige un archivo más liviano para el almacenamiento en navegador.' });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      addNewMockupVersion(base64, file.name);

      // S3 compatible MinIO Docker bucket sync (soporte-pmo-storage)
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
          
        let cleanKey = `mockups/division_${selectedDivisionId || 'general'}/${file.name.trim().replace(/\s+/g, '_').toLowerCase()}`;
        const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
        let mime = file.type || 'image/png';

        const newObject = {
          id: `sim-mockup-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          key: cleanKey,
          name: file.name,
          size: sizeStr,
          url: `http://localhost:9000/soporte-pmo-storage/${cleanKey}`,
          uploadedAt: new Date().toISOString().substring(0, 10),
          type: mime,
          raw_base64: base64
        };

        custom.push(newObject);
        localStorage.setItem('gcp_storage_custom_files', JSON.stringify(custom));
      } catch (err) {
        console.error("Error syncing mockup file build with storage bucket", err);
      }
    };
    reader.onerror = () => {
      setFeedbackMsg({ type: 'err', text: 'Error procesando el archivo de imagen.' });
    };
    reader.readAsDataURL(file);
  };

  // Set built-in sample reference mockup directly
  const handlePickPreset = (presetUrl: string, presetName: string, desc: string) => {
    setNewMockNotes(desc);
    addNewMockupVersion(presetUrl, presetName);
  };

  // Set historical version as active preview
  const handleRestoreVersion = (verId: string) => {
    if (!activeDivision) return;

    const targetVer = activeDivision.versions.find(v => v.id === verId);
    if (!targetVer) return;

    const updatedDivs = activeDivisions.map(d => {
      if (d.id === selectedDivisionId) {
        return {
          ...d,
          activeVersionId: verId
        };
      }
      return d;
    });

    setProjectData(prev => ({
      ...prev,
      [selectedProjectId]: updatedDivs
    }));

    setFeedbackMsg({ type: 'success', text: `Restaurada versión de diseño v${targetVer.version} como activa.` });
  };

  // Delete an item from mockup version history
  const handleDeleteVersion = (verId: string) => {
    if (!activeDivision) return;

    const version = activeDivision.versions.find(v => v.id === verId);
    const verNumber = version ? `v${version.version}` : '';

    setDeleteConfirmState({
      isOpen: true,
      title: 'Eliminar Versión del Mockup',
      message: `¿Está seguro de que desea eliminar la versión ${verNumber} del historial de mockups de forma permanente?`,
      onConfirm: () => {
        const filtered = activeDivision.versions.filter(v => v.id !== verId);
        let nextActiveId = activeDivision.activeVersionId;

        // Adjust active pointer if we deleted the current active item
        if (activeDivision.activeVersionId === verId) {
          nextActiveId = filtered.length > 0 ? filtered[0].id : null;
        }

        const updatedDivs = activeDivisions.map(d => {
          if (d.id === selectedDivisionId) {
            return {
              ...d,
              activeVersionId: nextActiveId,
              versions: filtered
            };
          }
          return d;
        });

        setProjectData(prev => ({
          ...prev,
          [selectedProjectId]: updatedDivs
        }));

        setFeedbackMsg({ type: 'success', text: 'Versión del historial eliminada.' });
      }
    });
  };

  return (
    <div className="space-y-6" id="mockup-manager-tab-view">
      
      {/* HUB HEADER: NAVIGATION & CONTROLLERS BAR */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-2xl p-5 shadow-lg border border-slate-800">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-5">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-sky-500/20 text-sky-300 font-mono text-[9px] font-bold uppercase py-0.5 px-2 rounded-full border border-sky-500/30">
                Lienzo de Prototipado e Imágenes
              </span>
              <span className="bg-indigo-500/20 text-indigo-300 font-mono text-[9px] font-bold uppercase py-0.5 px-2 rounded-full border border-indigo-500/30 hidden sm:inline-block">
                Con Historial de Versiones
              </span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white mt-1.5">
              Lienzo de Mockups Prototipo
            </h2>
            <p className="text-xs text-slate-350 mt-1 leading-relaxed max-w-2xl">
              Cargue capturas, vistas móviles, diagramas de flujo o links de Figma para cada una de las divisiones de referencias locales. Amplíe, aleje y arrastre las imágenes para analizar detalles con historial de log.
            </p>
          </div>

          {/* DUAL FILTERS LAYER: PROJECT WITH SYSTEM DIVISION DROP-DOWNS */}
          <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
            
            {/* PROJECT SELECT SELECTOR */}
            <div className="space-y-1.5 flex-1 sm:flex-initial">
              <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                Seleccione el Proyecto:
              </label>
              <select
                id="header-project-select"
                value={selectedProjectId}
                onChange={e => {
                  setSelectedProjectId(e.target.value);
                  // Resets division ID state to avoid mismatched indices
                  setSelectedDivisionId('web');
                }}
                className="w-full sm:w-60 bg-slate-850 hover:bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500 font-semibold cursor-pointer shadow-md transition"
              >
                {projects.map(p => (
                  <option key={p.id} value={p.id} className="bg-slate-900 transition">
                    [{p.code}] {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* SYSTEM DIVISION SELECTOR DROPDOWN */}
            <div className="space-y-1.5 flex-1 sm:flex-initial">
              <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                Módulo / División:
              </label>
              <div className="flex items-center gap-1.5">
                <select
                  id="header-division-select"
                  value={selectedDivisionId}
                  onChange={e => {
                    setSelectedDivisionId(e.target.value);
                    setNewMockUrl('');
                  }}
                  className="w-full sm:w-56 bg-slate-850 hover:bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold cursor-pointer shadow-md transition"
                >
                  {activeDivisions.map(div => (
                    <option key={div.id} value={div.id} className="bg-slate-900 transition">
                      {div.name}
                    </option>
                  ))}
                </select>
                <button 
                  type="button" 
                  onClick={() => setShowAddDivision(true)}
                  className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 hover:border-slate-600 transition shadow"
                  title="Nueva División del Sistema"
                  id="add-division-trigger"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ACTIVE PROJECT CARD DETAIL */}
        <div className="mt-4 pt-3.5 border-t border-slate-800/80 flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-350">
          <div>
            <span className="text-slate-500 text-[10px] uppercase font-bold mr-1">Cliente:</span>
            <strong className="text-slate-200">{currentProject.client || 'N/A'}</strong>
          </div>
          <div className="hidden sm:block text-slate-600">|</div>
          <div>
            <span className="text-slate-500 text-[10px] uppercase font-bold mr-1">Patrocinador:</span>
            <strong className="text-slate-200">{currentProject.sponsor || 'N/A'}</strong>
          </div>
          <div className="hidden sm:block text-slate-600">|</div>
          <div>
            <span className="text-slate-500 text-[10px] uppercase font-bold mr-1">Sprints:</span>
            <strong className="text-slate-200">{currentProject.sprint_size_weeks || 2} semanas ciclo</strong>
          </div>
          <div className="hidden sm:block text-slate-600">|</div>
          <div>
            <span className="text-slate-500 text-[10px] uppercase font-bold mr-1">División Seleccionada Historial:</span>
            <strong className="text-sky-300 font-mono">
              {activeDivision?.versions.length || 0} versiones
            </strong>
          </div>
        </div>
      </div>

      {/* FLOATING ACTION TOOLBAR UNDER HEADER */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <Layers className="w-4.5 h-4.5 text-indigo-600" />
          <div className="text-xs">
            <span className="text-slate-550">Lienzo activo:</span>{' '}
            <strong className="text-slate-800 font-extrabold font-sans">
              {currentProject.name} &gt; {activeDivision?.name || 'Módulo'}
            </strong>
          </div>
        </div>

        {/* CORE TRIGGERS FOR FLOATING MODALS */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* TRIGGER 1: FLOATING MOCKUP LOADER BUTTON */}
          <button
            type="button"
            id="trigger-floating-upload"
            onClick={() => setShowUploadModal(true)}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md hover:shadow-lg transition cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            Cargar Mockup / Archivos
          </button>

          {/* TRIGGER 2: VERSION HISTORY CONSULT BUTTON */}
          <button
            type="button"
            id="trigger-floating-history"
            onClick={() => setShowHistoryModal(true)}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-slate-700 hover:text-indigo-900 text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition cursor-pointer"
          >
            <History className="w-4 h-4 text-indigo-600" />
            Consultar Historial ({activeDivision?.versions.length || 0})
          </button>
        </div>
      </div>

      {/* FEEDBACK STATUS INDICATOR */}
      {feedbackMsg && (
        <div className={`p-3.5 rounded-xl text-xs flex items-center gap-2.5 shadow-xs border animate-fadeIn ${
          feedbackMsg.type === 'success' 
            ? 'bg-emerald-50 border-emerald-250 text-emerald-800' 
            : 'bg-rose-50 border-rose-250 text-rose-800'
        }`}>
          {feedbackMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
          <span className="font-semibold">{feedbackMsg.text}</span>
        </div>
      )}

      {/* MAIN GRAPHIC WORKSPACE AREA - NOW EXPANDED TO THE FULL 100% WIDTH */}
      <div className="w-full" id="expanded-graphic-canvas-container">
        
        {/* THE SCREEN VIEWPORT CARD CONTROLLER */}
        <div className="bg-slate-905 rounded-2xl border border-slate-800 shadow-xl overflow-hidden flex flex-col h-[600px] relative">
          
          {/* CANVAS VIEWPORT STATUS SUMMARY HEADER */}
          <div className="bg-slate-950 border-b border-slate-800/80 px-4 py-3.5 flex items-center justify-between text-xs text-slate-350 select-none z-10">
            <div className="flex items-center gap-2 text-slate-800">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-mono text-slate-200 uppercase tracking-tight text-[11px] font-bold">
                {activeDivision?.name || 'Módulo'}
              </span>
              <span className="text-slate-600">|</span>
              <span className="text-slate-300 font-medium">
                {activeVersion ? `Versión Activa: v${activeVersion.version} (${activeVersion.fileName})` : 'Sin diseño activo'}
              </span>
            </div>
            
            {/* TOGGLE OPTIONS AND DETAIL VIEWPORT */}
            <div className="flex items-center gap-3">
              {activeVersion && (
                <button
                  type="button"
                  onClick={() => {
                    setFullscreenImageUrl(activeVersion.url);
                    setFullscreenTitle(`${activeDivision?.name || 'Módulo'} - Versión ${activeVersion.version} (${activeVersion.fileName || 'diseño.png'})`);
                    setShowFullscreenModal(true);
                  }}
                  className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10.5px] px-2.5 py-1 rounded-lg border border-indigo-755 transition cursor-pointer shadow-sm shadow-indigo-950/20"
                  title="Ver imagen en pantalla completa"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  PANTALLA COMPLETA
                </button>
              )}
              <div className="flex items-center gap-1">
                <span className="text-[10px] uppercase font-bold text-slate-500 font-mono hidden sm:inline">Escala:</span>
                <select
                  value={Math.round(scale)}
                  onChange={(e) => setScale(Number(e.target.value))}
                  className="text-[10.5px] font-bold text-slate-200 bg-slate-850 hover:bg-slate-800 border border-slate-800 px-2 py-0.5 rounded outline-none cursor-pointer transition focus:ring-1 focus:ring-indigo-500 font-mono [&>option]:bg-slate-900"
                  title="Configurar porcentaje de Escala"
                >
                  <option value={1}>100% (1:1)</option>
                  <option value={2}>200% (2:1)</option>
                  <option value={3}>300% (3:1)</option>
                  <option value={4}>400% (4:1)</option>
                  <option value={5}>500% (5:1)</option>
                  <option value={6}>600% (6:1)</option>
                  <option value={7}>700% (7:1)</option>
                  <option value={8}>800% (8:1)</option>
                  <option value={9}>900% (9:1)</option>
                  <option value={10}>1000% (10:1)</option>
                </select>
              </div>
              <button
                onClick={() => setShowGrid(!showGrid)}
                className={`text-[10.5px] font-bold px-2.5 py-0.5 rounded border transition ${
                  showGrid 
                    ? 'bg-slate-800 text-slate-200 border-slate-700' 
                    : 'bg-transparent text-slate-500 border-slate-800'
                }`}
                title="Alternar rejilla de fondo"
              >
                REJILLA
              </button>
            </div>
          </div>

          {/* INTERACTIVE WORKSPACE ELEMENT */}
          <div 
            ref={canvasRef}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUpOrLeave}
            onMouseLeave={handleMouseUpOrLeave}
            className={`flex-1 relative overflow-hidden select-none cursor-grab active:cursor-grabbing ${
              showGrid ? 'bg-slate-900' : 'bg-slate-950'
            }`}
          >
            {/* Dot Grid representation layer */}
            {showGrid && (
              <div 
                className="absolute inset-0 pointer-events-none opacity-20"
                style={{
                  backgroundImage: 'radial-gradient(#94a3b8 1px, transparent 0)',
                  backgroundSize: '16px 16px'
                }}
              />
            )}

            {/* No mockup available overlay placeholder */}
            {!activeVersion ? (
              <div className="absolute inset-4 flex flex-col justify-center items-center text-center p-6 bg-slate-950/20 rounded-2xl border border-slate-850/50">
                <ImageIcon className="w-14 h-14 text-slate-750 animate-bounce mb-3" />
                <h4 className="text-slate-100 font-bold text-sm">No hay un diseño cargado en la división "{activeDivision?.name}"</h4>
                <p className="text-xs text-slate-400 max-w-sm mt-1.5 leading-normal">
                  Haga clic en el botón <strong className="text-sky-300">"Cargar Mockup / Archivos"</strong> arriba para elegir maquetas de referencias demo, subir archivos PNG/JPG o ingresar enlaces web.
                </p>
                <button
                  type="button"
                  onClick={() => setShowUploadModal(true)}
                  className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow transition"
                >
                  Cargar primera imagen
                </button>
              </div>
            ) : (
              /* The Interactive Image Container */
              <div
                className="absolute origin-center transition-all duration-75"
                style={{
                  transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
                  left: 'calc(50% - 240px)',
                  top: 'calc(50% - 180px)',
                  width: '480px',
                  height: '360px'
                }}
              >
                <img
                  ref={imageRef}
                  draggable={false}
                  src={activeVersion.url}
                  alt="Mockup activo prototipo"
                  className="max-w-none w-full h-full object-cover rounded-xl shadow-2xl border-4 border-slate-800 bg-slate-950 select-none"
                  onError={(e) => {
                    // fallback for invalid url
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80';
                  }}
                />
                
                {/* Decorative title ribbon */}
                <div className="absolute top-1 right-2 bg-black/75 backdrop-blur-md text-[8px] text-slate-350 font-bold px-2.5 py-0.5 rounded-full z-15 shadow uppercase tracking-wide">
                   VISTA PREVIA ACTIVA
                </div>
              </div>
            )}

            {/* FLOATING ACTION OVERLAY CONTROLS - ZOOM & D-PAD OVERLAYS */}
            {activeVersion && (
              <div className="absolute bottom-5 right-5 z-20 flex flex-col gap-2 bg-slate-950/90 border border-slate-850 p-2.5 rounded-2xl shadow-xl backdrop-blur-md">
                
                {/* Zoom controls pad */}
                <div className="flex items-center gap-1.5 border-b border-slate-800 pb-2">
                  <button
                    onClick={handleZoomOut}
                    className="w-7 h-7 bg-slate-900 border border-slate-800 hover:border-slate-750 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg flex items-center justify-center transition cursor-pointer"
                    title="Alejar Zoom (-)"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={handleZoomReset}
                    className="text-[10px] font-black font-mono text-slate-300 w-11 h-7 bg-slate-900 border border-slate-800 hover:border-indigo-500 rounded-lg flex items-center justify-center transition cursor-pointer"
                    title="Resetear escala 100%"
                  >
                    1:1
                  </button>
                  <button
                    onClick={handleZoomIn}
                    className="w-7 h-7 bg-slate-900 border border-slate-800 hover:border-slate-755 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg flex items-center justify-center transition cursor-pointer"
                    title="Acercar Zoom (+)"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Move navigation D-PAD Controls */}
                <div className="grid grid-cols-3 gap-1 pt-1 justify-items-center">
                  <div />
                  <button
                    onClick={() => handleMove('up')}
                    className="w-6 h-6 bg-slate-900 border border-slate-800 hover:bg-slate-850 text-slate-300 rounded flex items-center justify-center cursor-pointer hover:border-slate-700"
                    title="Mover arriba"
                  >
                    <ArrowUp className="w-3 h-3" />
                  </button>
                  <div />
                  <button
                    onClick={() => handleMove('left')}
                    className="w-6 h-6 bg-slate-900 border border-slate-800 hover:bg-slate-850 text-slate-300 rounded flex items-center justify-center cursor-pointer hover:border-slate-700"
                    title="Mover izquierda"
                  >
                    <ArrowLeft className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => setOffset({ x: 0, y: 0 })}
                    className="w-6 h-6 bg-indigo-900/60 hover:bg-indigo-900 text-indigo-300 rounded flex items-center justify-center cursor-pointer text-[8px] font-black"
                    title="Centrar offset"
                  >
                    🎯
                  </button>
                  <button
                    onClick={() => handleMove('right')}
                    className="w-6 h-6 bg-slate-900 border border-slate-800 hover:bg-slate-850 text-slate-300 rounded flex items-center justify-center cursor-pointer hover:border-slate-700"
                    title="Mover derecha"
                  >
                    <ArrowRight className="w-3 h-3" />
                  </button>
                  <div />
                  <button
                    onClick={() => handleMove('down')}
                    className="w-6 h-6 bg-slate-900 border border-slate-800 hover:bg-slate-850 text-slate-300 rounded flex items-center justify-center cursor-pointer hover:border-slate-700"
                    title="Mover abajo"
                  >
                    <ArrowDown className="w-3 h-3" />
                  </button>
                  <div />
                </div>
              </div>
            )}

            {/* PANNING INSTRUCTION NOTE FLOATER */}
            {activeVersion && (
              <div className="absolute top-4 left-4 z-20 bg-slate-950/80 p-2.5 rounded-xl border border-slate-850 backdrop-blur-md max-w-[220px] shadow pointer-events-none">
                <div className="flex items-center gap-1.5 text-slate-450 mb-1">
                  <Info className="w-3 h-3 text-sky-405 shrink-0" />
                  <span className="text-[9px] font-bold text-slate-300 uppercase">Tip de navegación</span>
                </div>
                <span className="text-[9.5px] text-slate-400 block leading-normal">
                  Mantenga presionado el <strong>clic izquierdo y arrastre</strong> con el cursor sobre la rejilla para panear / mover libremente el mockup.
                </span>
              </div>
            )}
          </div>

          {/* FILE SUB-PREVIEW DETAILED BAR */}
          {activeVersion && (
            <div className="bg-slate-950 border-t border-slate-850 px-4 py-3.5 text-[11px] text-slate-400 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="flex gap-4">
                <div>
                  <span className="text-slate-500 text-[10px] block font-bold uppercase tracking-wide">Publicado por</span>
                  <strong className="text-slate-200 font-semibold">{activeVersion.author}</strong>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block font-bold uppercase tracking-wide">Modificación</span>
                  <strong className="text-slate-300 font-mono">
                    {new Date(activeVersion.updatedAt).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </strong>
                </div>
              </div>

              <div className="bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 text-[10.5px] leading-tight max-w-sm">
                <span className="text-slate-400 block font-bold text-[9px] uppercase tracking-wider mb-0.5">Bitácora / Log de Cambios</span>
                <span className="text-slate-300 italic font-mono">"{activeVersion.notes}"</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* FLOATING DIRECTORY MODAL 1: MOCKUP DESIGN LOADER / UPLOADER FORM OVERLAY */}
      {/* ========================================================================= */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Upload className="w-4.5 h-4.5 text-indigo-400" />
                <h3 className="font-bold text-sm tracking-tight text-white">Cargar Mockup o Maqueta</h3>
              </div>
              <button 
                onClick={() => setShowUploadModal(false)}
                className="text-slate-400 hover:text-white transition font-bold text-lg cursor-pointer px-1"
              >
                ✕
              </button>
            </div>
            
            {/* Modal Content container */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs text-slate-705">
              
              {/* Target division destination tag */}
              <div className="bg-indigo-50 border border-indigo-150 p-3 rounded-xl flex items-center gap-2.5">
                <Layers className="w-4 h-4 text-indigo-600" />
                <div>
                  <span className="text-slate-500 font-bold text-[10px] uppercase block">Destino de la Carga:</span>
                  <span className="text-indigo-950 font-bold text-xs">Módulo "{activeDivision?.name || 'Módulo'}"</span>
                </div>
              </div>

              {/* DEMO REFERENCE PRESETS BLOCK */}
              <div className="space-y-2">
                <span className="block text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                  Muestras de Prototipado Rápidas (Carga Demo):
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {DEFAULT_PRESET_IMAGES.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        handlePickPreset(preset.url, preset.name, preset.description);
                        setShowUploadModal(false);
                      }}
                      className="text-left bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 p-2.5 rounded-xl transition truncate cursor-pointer text-[10.5px]"
                    >
                      <span className="font-semibold text-slate-800 block truncate">{preset.name}</span>
                      <span className="text-[9px] text-slate-400 block truncate mt-0.5">{preset.description}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* LOCAL FILE PC DRAG-DROP AREA */}
              <div className="space-y-2 pt-2.5 border-t border-slate-150">
                <span className="block text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                  Opción de Carga 1: Imagen de su Dispositivo
                </span>
                <label className="border border-dashed border-slate-250 hover:border-indigo-400 rounded-xl p-4 bg-slate-50 hover:bg-white text-center block cursor-pointer transition">
                  <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1.5" />
                  <span className="text-xs font-semibold text-indigo-600 block">Elegir Archivo PNG o JPG</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Máx 2.5MB (Codificado Base64 para guardado persistente)</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      handleFileChange(e);
                      setShowUploadModal(false);
                    }}
                    className="hidden"
                  />
                </label>
              </div>

              {/* URL LINK LOAD FORM */}
              <form 
                onSubmit={(e) => {
                  handleAddFromUrl(e);
                  setShowUploadModal(false);
                }} 
                className="space-y-3.5 pt-2.5 border-t border-slate-150"
              >
                <div className="space-y-1.5">
                  <span className="block text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                    Opción de Carga 2: Pegar Enlace Web Directo
                  </span>
                  <div className="relative">
                    <LinkIcon className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3.5" />
                    <input
                      type="text"
                      value={newMockUrl}
                      onChange={e => setNewMockUrl(e.target.value)}
                      placeholder="https://servidor.com/mi_maqueta_diseno.png"
                      className="w-full bg-slate-50 border border-slate-250 rounded-xl py-2 px-3 pl-9 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* Author Selection and Version description metadata */}
                <div className="grid grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="block text-[10px] text-slate-550 font-bold uppercase tracking-wide">Autor Responsable:</label>
                    <select
                      value={customAuthor}
                      onChange={e => setCustomAuthor(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-250 rounded-xl p-2 text-xs text-slate-700 focus:outline-none"
                    >
                      <option value="Mateo Herrera (PO)">Mateo Herrera (PO)</option>
                      <option value="Valentina Rojas (QA)">Valentina Rojas (QA)</option>
                      <option value="Laura Gómez (PO)">Laura Gómez (PO)</option>
                      <option value="Carlos Pérez (PM)">Carlos Pérez (PM)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] text-slate-550 font-bold uppercase tracking-wide">Bitácora / Log Cambios:</label>
                    <textarea
                      rows={1}
                      value={newMockNotes}
                      onChange={e => setNewMockNotes(e.target.value)}
                      placeholder="Detalles sobre esta versión..."
                      className="w-full bg-slate-50 border border-slate-250 rounded-xl py-1.5 px-2.5 text-xs text-slate-800 focus:outline-none resize-none"
                    />
                  </div>
                </div>

                <div className="flex gap-2 justify-end pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowUploadModal(false)}
                    className="bg-slate-100 hover:bg-slate-255 text-slate-600 font-semibold px-4 py-2 rounded-xl text-xs transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={!newMockUrl}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-semibold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Cargar enlace
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* FLOATING DIRECTORY MODAL 2: VERSION TIMELINE LIST SLIDING RIGHT OVERLAY */}
      {/* ========================================================================= */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex justify-end animate-fadeIn">
          {/* Click backdrop to close */}
          <div className="absolute inset-0" onClick={() => setShowHistoryModal(false)} />
          
          {/* Sliding side drawer panel */}
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col z-10 animate-slideOver">
            
            {/* Drawer Header */}
            <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-sky-400" />
                <div>
                  <h3 className="font-bold text-sm tracking-tight text-white">Historial de Versiones</h3>
                  <span className="text-[10px] text-slate-400 block font-mono">Módulo: {activeDivision?.name || 'Módulo'}</span>
                </div>
              </div>
              <button 
                onClick={() => setShowHistoryModal(false)}
                className="text-slate-400 hover:text-white transition font-bold text-lg cursor-pointer px-1.5"
              >
                ✕
              </button>
            </div>

            <div className="p-4 bg-slate-50 border-b border-slate-150 text-[11px] text-slate-500 leading-normal">
              A continuación se listan las maquetas cargadas ordenadamente. Puede restaurar cualquier versión para que sea visualizada como activa del proyecto por su equipo.
            </div>

            {/* Timelines list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {!activeDivision || activeDivision.versions.length === 0 ? (
                <div className="text-center py-24 text-slate-400">
                  <History className="w-10 h-10 text-slate-300 mx-auto mb-2 opacity-50" />
                  <p className="font-bold text-xs text-slate-600">Sin historial registrado</p>
                  <p className="text-[10.5px] text-slate-400 max-w-xs mx-auto mt-1 leading-normal">
                    Utilice el formulario de carga de imágenes para crear las primeras referencias gráficas.
                  </p>
                </div>
              ) : (
                activeDivision.versions.map((ver) => {
                  const isActive = ver.id === activeDivision.activeVersionId;
                  return (
                    <div
                      key={ver.id}
                      className={`border rounded-xl p-4 space-y-3 transition ${
                        isActive 
                          ? 'border-indigo-400 bg-indigo-50/15 ring-2 ring-indigo-400/20' 
                          : 'border-slate-150 bg-white hover:bg-slate-50'
                      }`}
                    >
                      {/* Badge indicator and date */}
                      <div className="flex justify-between items-start">
                        <div>
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                            isActive 
                              ? 'bg-indigo-600 text-white' 
                              : 'bg-slate-150 text-slate-650'
                          }`}>
                            VERSIÓN {ver.version} {isActive && ' (ACTIVA)'}
                          </span>
                          <span className="text-[10px] text-slate-400 block mt-1 font-semibold">
                            {new Date(ver.updatedAt).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        
                        {/* Only allow deletion of historical records that aren't actively configured */}
                        {!isActive && (
                          <button
                            onClick={() => handleDeleteVersion(ver.id)}
                            className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-1 rounded-lg transition"
                            title="Eliminar esta versión de visualización"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Small image container */}
                      <div className="flex gap-2 items-center bg-slate-950/5 p-1.5 rounded-lg border border-slate-100">
                        <img 
                          src={ver.url} 
                          alt="preview mini" 
                          className="w-11 h-11 object-cover rounded border bg-white shrink-0" 
                          onError={(e) => {
                            e.currentTarget.src = DEFAULT_PRESET_IMAGES[0].url;
                          }}
                        />
                        <div className="truncate text-[10.5px]">
                          <span className="block font-bold text-slate-700 truncate">{ver.fileName || 'imagen.png'}</span>
                          <span className="block text-slate-400 truncate">Sometido por: {ver.author}</span>
                        </div>
                      </div>

                      {/* Notes / Log of changes */}
                      <p className="text-[11px] text-slate-550 leading-relaxed italic bg-slate-50 p-2.5 rounded-lg border border-slate-150/50">
                        "{ver.notes}"
                      </p>

                      {/* Acciones de cada versión del historial */}
                      <div className="flex gap-2">
                        {!isActive ? (
                          <button
                            type="button"
                            onClick={() => {
                              handleRestoreVersion(ver.id);
                              setShowHistoryModal(false);
                            }}
                            className="flex-grow bg-slate-100 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-400 text-slate-705 hover:text-indigo-900 font-bold text-[10.5px] py-2 rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer"
                          >
                            <RefreshCw className="w-3.5 h-3.5 text-indigo-500" />
                            Restaurar
                          </button>
                        ) : (
                          <div className="flex-grow bg-emerald-50 text-emerald-800 font-bold font-mono text-[10px] rounded-lg py-2 flex items-center justify-center gap-1 border border-emerald-200 select-none">
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            Actual / Activa
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setFullscreenImageUrl(ver.url);
                            setFullscreenTitle(`${activeDivision?.name || 'Módulo'} - Versión ${ver.version} (${ver.fileName || 'maqueta.png'})`);
                            setShowFullscreenModal(true);
                          }}
                          className="bg-indigo-55 bg-indigo-50 hover:bg-indigo-150 border border-indigo-200 hover:border-indigo-300 text-indigo-800 font-bold text-[10.5px] px-3 py-2 rounded-lg flex items-center justify-center gap-1 transition cursor-pointer shadow-xs"
                          title="Ver esta versión en pantalla completa"
                        >
                          <Maximize2 className="w-3.5 h-3.5" />
                          Ampliar
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Bottom action trigger bar */}
            <div className="p-4 border-t border-slate-150 bg-slate-50">
              <button
                onClick={() => setShowHistoryModal(false)}
                className="w-full bg-slate-700 hover:bg-slate-800 text-white font-bold text-xs py-2.5 rounded-xl transition cursor-pointer"
              >
                Cerrar consulta de historial
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* FLOATING DIRECTORY MODAL 3: ADD NEW DIVISION INPUT CONTAINER BLOCK       */}
      {/* ========================================================================= */}
      {showAddDivision && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs flex justify-center items-center z-55 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xl max-w-sm w-full space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 animate-fadeIn">
              <h4 className="font-bold text-slate-850 text-sm">Nueva División del Proyecto</h4>
              <button onClick={() => setShowAddDivision(false)} className="text-slate-450 hover:text-slate-650 cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleCreateDivision} className="space-y-3.5">
              <div className="space-y-1">
                <label className="block text-[10.5px] text-slate-500 font-bold uppercase tracking-wider">Nombre del Módulo / División:</label>
                <input
                  type="text"
                  required
                  value={newDivisionName}
                  onChange={e => setNewDivisionName(e.target.value)}
                  placeholder="Ej. Tablet Android, iOS Client, Web Admin..."
                  className="w-full bg-slate-50 border border-slate-250 rounded-xl py-2 px-3 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div className="flex gap-2 justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddDivision(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold px-3.5 py-2 rounded-xl text-xs transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Crear División
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* FLOATING DIRECTORY MODAL 4: FULLSCREEN IMAGE VIEWER LIGHTBOX             */}
      {/* ========================================================================= */}
      {showFullscreenModal && fullscreenImageUrl && (
        <div 
          className="fixed inset-0 bg-slate-950/95 backdrop-blur-md flex flex-col justify-between items-center z-[100] p-4 animate-fadeIn select-none"
        >
          {/* Backdrop layer for background click closing */}
          <div 
            className="absolute inset-0 z-0 cursor-zoom-out" 
            onClick={() => {
              setShowFullscreenModal(false);
              setFullscreenImageUrl(null);
            }} 
          />

          {/* Header area with details and close action */}
          <div 
            className="w-full flex justify-between items-center bg-slate-900/90 border border-slate-800 p-4 rounded-2xl max-w-7xl backdrop-blur-sm z-10 transition-all hover:border-slate-700 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking header
          >
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
              <div>
                <span className="text-[10px] text-sky-400 font-mono font-black uppercase tracking-widest block">Lienzo en Pantalla Completa</span>
                <h4 className="font-extrabold text-white text-sm shrink-0 tracking-tight">{fullscreenTitle}</h4>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <a 
                href={fullscreenImageUrl} 
                target="_blank" 
                rel="noreferrer"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white rounded-xl text-xs font-semibold border border-slate-700 transition"
              >
                <LinkIcon className="w-3.5 h-3.5" />
                Abrir en pestaña nueva
              </a>
              <button
                type="button"
                onClick={() => {
                  setShowFullscreenModal(false);
                  setFullscreenImageUrl(null);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition cursor-pointer font-bold text-xs flex items-center justify-center gap-1.5 text-center shadow-lg hover:shadow-rose-900/35"
                title="Cerrar pantalla completa (Escape)"
              >
                ✕ Cerrar
              </button>
            </div>
          </div>

          {/* Main big image viewer body with Drag & Wheel Zoom support */}
          <div 
            className="flex-1 w-full relative overflow-hidden flex justify-center items-center z-10 cursor-grab active:cursor-grabbing"
            onClick={(e) => e.stopPropagation()}
            onWheel={handleFsWheel}
            onMouseDown={handleFsMouseDown}
            onMouseMove={handleFsMouseMove}
            onMouseUp={handleFsMouseUpOrLeave}
            onMouseLeave={handleFsMouseUpOrLeave}
          >
            {/* Grid background for feedback when panning */}
            <div 
              className="absolute inset-0 pointer-events-none opacity-10"
              style={{
                backgroundImage: 'radial-gradient(#94a3b8 1.5px, transparent 0)',
                backgroundSize: '24px 24px'
              }}
            />

            {/* Scale & Pan Wrapper */}
            <div
              className="absolute origin-center transition-all duration-75"
              style={{
                transform: `translate(${fsOffset.x}px, ${fsOffset.y}px) scale(${fsScale})`,
                maxWidth: '90%',
                maxHeight: '90%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <img
                src={fullscreenImageUrl}
                alt="Mockup pantalla completa"
                className="max-h-[80vh] max-w-[85vw] object-contain rounded-xl shadow-2xl border-4 border-slate-800 bg-slate-900 select-none cursor-grab active:cursor-grabbing"
                draggable={false}
                onError={(e) => {
                  e.currentTarget.src = DEFAULT_PRESET_IMAGES[0].url;
                }}
              />
            </div>

            {/* FLOATING ZOOM & PAN OVERLAYS */}
            <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 z-25 flex flex-col gap-2 bg-slate-900/95 border border-slate-800 p-2.5 sm:p-3.5 rounded-2xl shadow-2xl backdrop-blur-md scale-95 sm:scale-100 origin-bottom-right">
              <div className="border-b border-slate-800 pb-2 text-center">
                <span className="text-[9px] text-slate-400 block font-mono font-bold tracking-wider uppercase mb-1">
                  Escala Fullscreen:
                </span>
                <select
                  value={Math.round(fsScale)}
                  onChange={(e) => setFsScale(Number(e.target.value))}
                  className="w-full text-[10.5px] font-bold text-slate-200 bg-slate-950 hover:bg-slate-900 border border-slate-850 px-2 py-1 rounded-lg outline-none cursor-pointer transition focus:ring-1 focus:ring-indigo-500 font-mono text-center [&>option]:bg-slate-900"
                  title="Configurar escala de visualización Fullscreen"
                >
                  <option value={1}>100% (1:1)</option>
                  <option value={2}>200% (2:1)</option>
                  <option value={3}>300% (3:1)</option>
                  <option value={4}>400% (4:1)</option>
                  <option value={5}>500% (5:1)</option>
                  <option value={6}>600% (6:1)</option>
                  <option value={7}>700% (7:1)</option>
                  <option value={8}>800% (8:1)</option>
                  <option value={9}>900% (9:1)</option>
                  <option value={10}>1000% (10:1)</option>
                </select>
              </div>
              
              {/* Zoom Controls */}
              <div className="flex items-center gap-1.5 border-b border-slate-800 pb-2">
                <button
                  type="button"
                  onClick={handleFsZoomOut}
                  className="w-8 h-8 bg-slate-950 border border-slate-800 hover:border-slate-700 hover:bg-slate-850 text-slate-300 hover:text-white rounded-xl flex items-center justify-center transition cursor-pointer"
                  title="Alejar Zoom (-)"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleFsZoomReset}
                  className="text-[10.5px] font-black font-mono text-slate-350 px-2.5 h-8 bg-slate-950 border border-slate-800 hover:border-indigo-500 hover:text-indigo-400 rounded-xl flex items-center justify-center transition cursor-pointer"
                  title="Centrar y resetear zoom"
                >
                  CENTRAR (1:1)
                </button>
                <button
                  type="button"
                  onClick={handleFsZoomIn}
                  className="w-8 h-8 bg-slate-950 border border-slate-800 hover:border-slate-700 hover:bg-slate-850 text-slate-300 hover:text-white rounded-xl flex items-center justify-center transition cursor-pointer"
                  title="Acercar Zoom (+)"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
              </div>

              {/* Move navigation D-PAD Controls */}
              <div className="grid grid-cols-3 gap-1 pt-1 justify-items-center">
                <div />
                <button
                  type="button"
                  onClick={() => handleFsMove('up')}
                  className="w-7 h-7 bg-slate-950 border border-slate-800 hover:bg-slate-800 text-slate-300 rounded flex items-center justify-center cursor-pointer hover:border-slate-700"
                  title="Mover arriba"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <div />
                <button
                  type="button"
                  onClick={() => handleFsMove('left')}
                  className="w-7 h-7 bg-slate-950 border border-slate-800 hover:bg-slate-800 text-slate-300 rounded flex items-center justify-center cursor-pointer hover:border-slate-700"
                  title="Mover izquierda"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setFsOffset({ x: 0, y: 0 })}
                  className="w-7 h-7 bg-indigo-900/40 hover:bg-indigo-900 text-indigo-300 rounded flex items-center justify-center cursor-pointer text-xs"
                  title="Restaurar posición"
                >
                  🎯
                </button>
                <button
                  type="button"
                  onClick={() => handleFsMove('right')}
                  className="w-7 h-7 bg-slate-950 border border-slate-800 hover:bg-slate-800 text-slate-300 rounded flex items-center justify-center cursor-pointer hover:border-slate-700"
                  title="Mover derecha"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <div />
                <button
                  type="button"
                  onClick={() => handleFsMove('down')}
                  className="w-7 h-7 bg-slate-950 border border-slate-800 hover:bg-slate-800 text-slate-300 rounded flex items-center justify-center cursor-pointer hover:border-slate-700"
                  title="Mover abajo"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
                <div />
              </div>
            </div>

            {/* Interactive instructions Note */}
            <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-25 bg-slate-950/80 p-3 rounded-2xl border border-slate-800/80 backdrop-blur-md max-w-[180px] sm:max-w-xs shadow-2xl pointer-events-none hidden sm:block">
              <div className="flex items-center gap-1.5 text-slate-300 mb-1">
                <Info className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <span className="text-[9.5px] font-bold text-slate-200 uppercase tracking-wider">Control Interactivo FS</span>
              </div>
              <span className="text-[10px] text-slate-400 block leading-normal">
                Usa la <strong className="text-white">rueda del mouse</strong> para zoom rápido, <strong className="text-white">clic izquierdo y arrastra</strong> para moverte libremente, o el D-PAD de control.
              </span>
            </div>
          </div>

          {/* Footer controls for interactive presentation */}
          <div 
            className="w-full bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 py-3 px-5 rounded-2xl max-w-xl text-center backdrop-blur-sm z-10 mb-2 select-none"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="font-mono text-slate-300">
              💡 Presiona <strong className="text-white">el fondo</strong> o haz clic en <strong className="text-rose-450 font-bold">Cerrar</strong> para regresar al lienzo normal.
            </p>
          </div>
        </div>
      )}

      {deleteConfirmState && deleteConfirmState.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-[999999] p-4 text-slate-800 animate-fadeIn">
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
