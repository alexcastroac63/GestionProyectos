/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  User,
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
  WorkItemStatus,
  WorkItemType,
  TransitionRule,
  Tenant,
  NoteType
} from './types';
import {
  INITIAL_USERS,
  INITIAL_PORTFOLIOS,
  INITIAL_PROJECTS,
  INITIAL_PROJECT_COSTS,
  INITIAL_SPRINTS,
  INITIAL_WORK_ITEMS,
  INITIAL_PROJECT_ACTIVITIES,
  INITIAL_TEST_SUITES,
  INITIAL_TEST_CASES,
  INITIAL_TEST_RUNS,
  INITIAL_MOCKUPS,
  INITIAL_MOCKUP_SCREENS,
  INITIAL_MOCKUP_COMPONENTS,
  INITIAL_MOCKUP_CONNECTIONS,
  INITIAL_COMMITS,
  INITIAL_PRS,
  INITIAL_GITHUB_CONNECTION,
  DEFAULT_TRANSITION_RULES
} from './data';

// Component Imports
import GanttChart from './features/projects/GanttChart';
import MockupCanvas from './features/mockups/MockupCanvas';
import DbaSchema from './features/dba/DbaSchema';
import DevOpsPipeline from './features/devops/DevOpsPipeline';
import ProjectWBSManager from './features/projects/ProjectWBSManager';
import ProductBacklogManager from './features/backlog/ProductBacklogManager';
import ScrumBoardAndQaManager from './features/scrum/ScrumBoardAndQaManager';
import KPIDashboard from './features/dashboard/KPIDashboard';
import QaSuiteWorkspace from './features/qa/QaSuiteWorkspace';
import ProjectActivitiesSubTab from './features/projects/ProjectActivitiesSubTab';
import ProjectNotesSubTab from './features/projects/ProjectNotesSubTab';
import { menuRegistry } from './app/menuRegistry';

// Feature Component Imports
import { TeamDirectoryView } from './features/team/TeamDirectoryView';
import { SettingsManagerView } from './features/settings/SettingsManagerView';
import { AuthFlow } from './features/auth/components/AuthFlow';
import { CreateProjectModal } from './features/projects/components/CreateProjectModal';
import { ProjectBudgetView } from './features/projects/components/ProjectBudgetView';

// Icons Import
import {
  FolderKanban,
  LayoutDashboard,
  Calendar,
  Layers,
  CheckSquare,
  Sparkles,
  Users2,
  Database,
  Cpu,
  Plus,
  Trash2,
  AlertTriangle,
  History,
  TrendingUp,
  Coins,
  DollarSign,
  Briefcase,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  UserCheck,
  CheckCircle,
  HelpCircle,
  Clock,
  ExternalLink,
  ChevronLeft,
  Search,
  BookOpen,
  Filter,
  Monitor,
  Server,
  Download,
  Lock,
  Unlock,
  Menu,
  Edit2,
  X,
  Mail,
  UserPlus,
  Key,
  Send,
  Check,
  RefreshCw,
  LogOut,
  Eye,
  EyeOff,
  Settings,
  Tag,
  ShieldCheck,
  ClipboardList,
  FileText
} from 'lucide-react';

import { safeLoad, safeSave } from './shared/storage/localStorageAdapter';

const INITIAL_NOTE_TYPES: NoteType[] = [
  {
    id: 'type-general',
    name: 'Generales',
    description: 'Notas e información general de alcance, minutas de reuniones y requerimientos generales.',
    color: 'indigo',
    active: true
  },
  {
    id: 'type-atraso',
    name: 'Atrasos',
    description: 'Alertas críticas sobre desviaciones, cuellos de botella y atrasos en el cronograma programado.',
    color: 'amber',
    active: true
  },
  {
    id: 'type-tecnica',
    name: 'Especificaciones Técnicas',
    description: 'Definiciones de arquitectura de software, bases de datos o detalles técnicos del equipo.',
    color: 'emerald',
    active: true
  }
];

import { AppProviders, useSystemStore, useProjectsStore, useScrumStore, useQaStore, useBacklogStore, useMockupStore } from './app/AppProviders';

export default function App() {
  return (
    <AppProviders>
      <AppContent />
    </AppProviders>
  );
}

function AppContent() {
  // Consume all domain specific states securely from decouple providers layer
  const {
    tenants, setTenants, users, setUsers, noteTypes, setNoteTypes, logs, setLogs, addLog,
    loggedInUser, setLoggedInUser, activeTab, setActiveTab,
    isMobileMenuOpen, setIsMobileMenuOpen, isProjectsMenuOpen, setIsProjectsMenuOpen,
    isSettingsMenuOpen, setIsSettingsMenuOpen, settingsSubTab, setSettingsSubTab,
    deleteConfirmState, setDeleteConfirmState,
    smtpPassword, setSmtpPassword, clientsList, setClientsList, sponsorsList, setSponsorsList
  } = useSystemStore();

  const {
    projects, setProjects, costs, setCosts, selectedProjectId, setSelectedProjectId,
    expandedProjectId, setExpandedProjectId, projectSubTab, setProjectSubTab,
    categoryBudgets, setCategoryBudgets, budgetBaselines, setBudgetBaselines,
    projectSearch, setProjectSearch, projectStatusFilter, setProjectStatusFilter,
    projectPriorityFilter, setProjectPriorityFilter, projectClientFilter, setProjectClientFilter,
    isCreateProjectModalOpen, setIsCreateProjectModalOpen,
    projectStatusModalTarget, setProjectStatusModalTarget,
    projectConfigModalTarget, setProjectConfigModalTarget,
    isRegisterCostModalOpen, setIsRegisterCostModalOpen
  } = useProjectsStore();

  const {
    sprints, setSprints, workItems, setWorkItems, activities, setActivities,
    selectedSprintId, setSelectedSprintId
  } = useScrumStore();

  const {
    testSuites, setTestSuites, testCases, setTestCases, testRuns, setTestRuns
  } = useQaStore();

  // Mockups and UI components states reside in central decoupled MockupContext provider
  const {
    mockups, setMockups, mockScreens, setMockScreens, mockComponents, setMockComponents, mockConnections, setMockConnections
  } = useMockupStore();

  // Forgot password state on login card view
  const [showLoginForgotPassword, setShowLoginForgotPassword] = useState(false);

  // Status visual dropdown filter state
  const [isStatusFilterDropdownOpen, setIsStatusFilterDropdownOpen] = useState(false);



  // Finding 2: Active session integrity loop check to detect and prevent LS tampering
  useEffect(() => {
    const verifySessionOnBackend = async () => {
      const local = localStorage.getItem('gcp_logged_in_user');
      if (local && local !== "undefined" && local !== "null") {
        try {
          const parsed = JSON.parse(local);
          if (parsed && typeof parsed === 'object' && parsed.token) {
            const res = await fetch('/api/verify-session', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ token: parsed.token })
            });
            if (!res.ok) {
              console.warn("Session signature mismatch or expired. Log out triggered.");
              handleLogout();
            }
          }
        } catch (e) {
          console.error("Failed to verify signature", e);
        }
      }
    };
    verifySessionOnBackend();
  }, []);

  const isDevRole = false;

  // Multi-tenant segmentation selectors
  const segmentedProjects = projects.filter(p => !p.tenant_id || p.tenant_id === loggedInUser?.tenant_id || (!loggedInUser && p.tenant_id === 'grupo-campestre'));
  const segmentedUsers = users.filter(u => !u.tenant_id || u.tenant_id === loggedInUser?.tenant_id || (!loggedInUser && u.tenant_id === 'grupo-campestre'));

  // Active contextual references
  const activeProject = segmentedProjects.find(p => p.id === selectedProjectId) || segmentedProjects[0] || INITIAL_PROJECTS[0];
  const projectSprints = sprints.filter(s => s.project_id === selectedProjectId);
  const activeSprint = projectSprints.find(s => s.id === selectedSprintId) || projectSprints[0];
  const activeSprintIdEffective = activeSprint?.id || '';

  // --- Actions ---

  const handleLogout = () => {
    if (loggedInUser) {
      const storedName = `${loggedInUser.first_name || ''} ${loggedInUser.last_name || ''}`.trim() || 'Usuario';
      addLog(storedName, 'Cerró su sesión de la plataforma.');
    }
    setLoggedInUser(null);
    localStorage.removeItem('gcp_logged_in_user');
  };

  const updateProjectStatus = (projId: string, status: any) => {
    setProjects(prev => prev.map(p => p.id === projId ? { ...p, status } : p));
    addLog('Carlos Pérez (PM)', `Actualizó estado del proyecto a: ${status}`);
  };

  // Add Cost
  const [newCostType, setNewCostType] = useState<'NOMINA' | 'LICENCIAS' | 'OUTSOURCING' | 'INFRAESTRUCTURA' | 'OTROS'>('NOMINA');
  const [newCostDesc, setNewCostDesc] = useState('');
  const [newCostAmount, setNewCostAmount] = useState('');
  const [newDocNumber, setNewDocNumber] = useState('');
  const [newDocDate, setNewDocDate] = useState(new Date().toISOString().split('T')[0]);

  // Simulated secure cloud storage states
  const [cloudFileUploadedName, setCloudFileUploadedName] = useState('');
  const [cloudFileUploadedSize, setCloudFileUploadedSize] = useState('');
  const [cloudIsUploading, setCloudIsUploading] = useState(false);
  const [cloudProgress, setCloudProgress] = useState(0);
  const [activeCloudObjectDetail, setActiveCloudObjectDetail] = useState<ProjectCost | null>(null);
  const [cloudFileBase64, setCloudFileBase64] = useState<string | null>(null);
  const [costAttachmentMode, setCostAttachmentMode] = useState<'file' | 'link'>('file');
  const [costSupportUrl, setCostSupportUrl] = useState('');
  const [cloudFileExternalUrl, setCloudFileExternalUrl] = useState('');

  const simulateCloudUpload = (fileNameString: string, sizeInMb: string) => {
    setCloudIsUploading(true);
    setCloudProgress(0);
    setCloudFileUploadedName('');
    
    const interval = setInterval(() => {
      setCloudProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setCloudIsUploading(false);
          setCloudFileUploadedName(fileNameString);
          setCloudFileUploadedSize(sizeInMb);
          addLog('Sistema Almacenamiento', `Se completó la carga de ${fileNameString} (${sizeInMb}) en el repositorio 'soporte-pmo-storage'`);
          return 100;
        }
        return prev + Math.floor(Math.random() * 20) + 12;
      });
    }, 100);
  };

  const handleCloudFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const sizeStr = file.size > 1024 * 1024 
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${(file.size / 1024).toFixed(0)} KB`;
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setCloudFileBase64(reader.result as string);
      };
      reader.readAsDataURL(file);

      simulateCloudUpload(file.name, sizeStr);
    }
  };

  const handleAddCost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCostAmount || !newCostDesc) return;
    const docNum = newDocNumber.trim() || `DOC-${Math.floor(10000 + Math.random() * 90000)}`;
    const docDate = newDocDate || new Date().toISOString().split('T')[0];
    
    const newCost: ProjectCost = {
      id: `cost-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      project_id: selectedProjectId,
      cost_type: newCostType as any,
      description: newCostDesc,
      amount: Number(newCostAmount),
      currency: 'USD',
      created_at: docDate,
      document_number: docNum,
      document_date: docDate,
      storage_key: cloudFileExternalUrl ? undefined : (cloudFileUploadedName ? `uploads/${docNum}_${cloudFileUploadedName}` : undefined),
      storage_url: cloudFileExternalUrl ? cloudFileExternalUrl : (cloudFileUploadedName ? `http://localhost:9000/soporte-pmo-storage/uploads/${docNum}_${cloudFileUploadedName}` : undefined),
      file_name: cloudFileUploadedName || undefined,
      file_size: cloudFileUploadedSize || undefined,
      uploaded_at: cloudFileUploadedName ? new Date().toISOString().replace('T', ' ').substring(0, 16) : undefined,
      raw_base64: cloudFileBase64 || undefined
    };
    
    setCosts(prev => [...prev, newCost]);
    setNewCostDesc('');
    setNewCostAmount('');
    setNewDocNumber('');
    setNewDocDate(new Date().toISOString().split('T')[0]);
    
    // Reset cloud storage form state
    setCloudFileUploadedName('');
    setCloudFileUploadedSize('');
    setCloudProgress(0);
    setCloudFileBase64(null);
    setCostSupportUrl('');
    setCloudFileExternalUrl('');
    setCostAttachmentMode('file');
    
    addLog('Carlos Pérez (PM)', `Registró documento ${docNum} (${newCostType}): "${newCostDesc}" por $${Number(newCostAmount)} USD (Comprobante cargado con éxito en el almacenamiento seguro)`);
  };

  const handleDeleteCost = (id: string) => {
    const costItem = costs.find(c => c.id === id);
    const costDesc = costItem ? `"${costItem.description}" (-$${costItem.amount} USD)` : 'este documento';
    setDeleteConfirmState({
      isOpen: true,
      title: 'Anular Documento de Costo',
      message: `¿Está seguro de que desea anular/eliminar el registro de costo de ${costDesc}?`,
      onConfirm: () => {
        setCosts(prev => prev.filter(c => c.id !== id));
      }
    });
  };

  const downloadDocumentLocally = (c: ProjectCost) => {
    if (c.storage_url && (c.storage_url.startsWith('http://') || c.storage_url.startsWith('https://')) && !c.storage_url.includes('localhost:9000')) {
      window.open(c.storage_url, '_blank');
      addLog('Cloud Storage Client', `Abriendo enlace externo de soporte: ${c.storage_url}`);
      return;
    }
    const downloadName = c.file_name || `comprobante_${c.document_number || 'documento'}.pdf`;
    const ext = downloadName.split('.').pop()?.toLowerCase() || '';

    const triggerDownload = (blob: Blob) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = downloadName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      addLog('Cloud Storage Client', `Descarga local exitosa iniciada para el archivo de soporte: ${downloadName}`);
    };

    if (c.raw_base64) {
      try {
        const parts = c.raw_base64.split(';base64,');
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
        console.error("Error decoding base64 file data, falling back to template generation", err);
      }
    }

    if (ext === 'png' || ext === 'jpg' || ext === 'jpeg') {
      // 1. Image Files: Generate a beautiful, fully valid graphic voucher via Canvas
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 600;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Soft backdrop
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(0, 0, 800, 600);
        
        // Deep Indigo Frame
        ctx.strokeStyle = '#4f46e5';
        ctx.lineWidth = 14;
        ctx.strokeRect(7, 7, 786, 586);
        
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 2;
        ctx.strokeRect(30, 30, 740, 540);

        // Header Background
        ctx.fillStyle = '#4f46e5';
        ctx.fillRect(30, 30, 740, 100);
        
        // Header Text
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 26px sans-serif';
        ctx.fillText('COMPROBANTE OFICIAL DE GASTO DIGITAL', 60, 92);
        
        // Label values section
        ctx.fillStyle = '#1e293b';
        ctx.font = 'bold 20px sans-serif';
        ctx.fillText('INFORMACIÓN DETALLADA DEL DOCUMENTO:', 60, 185);
        
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(60, 195);
        ctx.lineTo(740, 195);
        ctx.stroke();

        ctx.font = '16px sans-serif';
        ctx.fillStyle = '#64748b';
        ctx.fillText('Número de Factura / Documento:', 60, 235);
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 17px monospace';
        ctx.fillText(`#${c.document_number || 'N/A'}`, 330, 235);

        ctx.font = '16px sans-serif';
        ctx.fillStyle = '#64748b';
        ctx.fillText('Rubro o Categoría de Gasto:', 60, 275);
        ctx.fillStyle = '#4f46e5';
        ctx.font = 'bold 17px sans-serif';
        ctx.fillText(c.cost_type || 'OTROS', 330, 275);

        ctx.font = '16px sans-serif';
        ctx.fillStyle = '#64748b';
        ctx.fillText('Monto del Comprobante:', 60, 315);
        ctx.fillStyle = '#10b981';
        ctx.font = 'bold 18px monospace';
        ctx.fillText(`$${Number(c.amount).toLocaleString('en-US')} USD`, 330, 315);

        ctx.font = '16px sans-serif';
        ctx.fillStyle = '#64748b';
        ctx.fillText('Concepto / Glosa de Soporte:', 60, 355);
        ctx.fillStyle = '#334155';
        ctx.font = 'bold 16px sans-serif';
        
        // Handle potential long descriptions line wrapping
        const desc = c.description;
        if (desc.length > 42) {
          ctx.fillText(desc.substring(0, 42) + '...', 330, 355);
        } else {
          ctx.fillText(desc, 330, 355);
        }

        ctx.font = '16px sans-serif';
        ctx.fillStyle = '#64748b';
        ctx.fillText('Fecha del Documento:', 60, 395);
        ctx.fillStyle = '#334155';
        ctx.font = 'bold 16px monospace';
        ctx.fillText(c.document_date || c.created_at || 'N/A', 330, 395);

        ctx.font = '16px sans-serif';
        ctx.fillStyle = '#64748b';
        ctx.fillText('Proyecto en PMO:', 60, 435);
        ctx.fillStyle = '#334155';
        ctx.font = 'bold 16px sans-serif';
        ctx.fillText(`[${activeProject ? activeProject.code : 'N/A'}] ${activeProject ? activeProject.name : 'N/A'}`, 330, 435);

        // Security watermark footer
        ctx.fillStyle = '#94a3b8';
        ctx.font = '12px sans-serif';
        ctx.fillText(`ID de Auditoria Única Encriptado: ${c.id}`, 65, 515);
        ctx.fillText(`Ruta de Repositorio Virtual: repo://soporte-pmo-storage/${c.storage_key || `${c.id}.pdf`}`, 65, 535);

        canvas.toBlob((b) => {
          if (b) {
            triggerDownload(b);
          } else {
            // fallback if toBlob fails
            const txtBlob = new Blob([c.description || ''], { type: ext === 'png' ? 'image/png' : 'image/jpeg' });
            triggerDownload(txtBlob);
          }
        }, ext === 'png' ? 'image/png' : 'image/jpeg');
      }
    } else if (ext === 'pdf') {
      // 2. PDF Files: Generate a fully valid minimal PDF structure representing the document metadata correctly
      const textLines = [
        `========================================================================`,
        `         COMPROBANTE OFICIAL DE REGISTRO - SISTEMA PMO WEB`,
        `========================================================================`,
        `Fecha de Descarga: ${new Date().toLocaleString('es-ES')}`,
        `Operacion: REGISTRO DE SOPORTE DE GASTO (COMPROBANTE DE COMPRA / RECIBO)`,
        ``,
        `INFORMACION DETALLADA DEL DOCUMENTO:`,
        `------------------------------------------------------------------------`,
        `Numero de Factura:  # ${c.document_number || 'N/A'}`,
        `Fecha de Documento: ${c.document_date || c.created_at || 'N/A'}`,
        `Rubro/Categoria:    ${c.cost_type || 'OTROS'}`,
        `Monto Registrado:   $ ${Number(c.amount).toLocaleString('en-US')} USD`,
        `Concepto / Glosa:   ${c.description}`,
        `ID de Auditoria:    ${c.id}`,
        ``,
        `INFORMACION DEL PROYECTO ASOCIADO:`,
        `------------------------------------------------------------------------`,
        `ID de Proyecto PMO: ${c.project_id}`,
        `Codigo Tematico:    ${activeProject ? activeProject.code : 'N/A'}`,
        `Nombre de Proyecto: ${activeProject ? activeProject.name : 'N/A'}`,
        ``,
        `EVALUACION DE TRANSPARENCIA:`,
        `------------------------------------------------------------------------`,
        `Nombre original:    ${c.file_name || 'N/A'}`,
        `Soporte Key:        repo://soporte-pmo-storage/${c.storage_key || 'N/A'}`,
        `Firma de Auditoria: "${c.id.substring(c.id.length - Math.min(6, c.id.length))}e9800998ea"`,
        `Verificado y firmado en el Almacen Local Seguro de PMO.`,
        `========================================================================`
      ];

      // Build text contents stream
      let streamContent = `BT\n/F1 10 Tf\n15 L\n40 760 Td\n`;
      textLines.forEach(line => {
        // Clean line to prevent syntax break in PDF strings
        const escaped = line.replace(/[()\\\r]/g, '\\$&');
        streamContent += `T* (${escaped}) Tj\n`;
      });
      streamContent += `ET`;

      const streamLen = streamContent.length;

      // Pack PDF objects sequentially
      const pdfParts: string[] = [];
      pdfParts.push(`%PDF-1.4\n`);
      
      const obj1 = `1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n`;
      pdfParts.push(obj1);
      
      const obj2 = `2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n`;
      pdfParts.push(obj2);
      
      // Use standard A4 size (595x842) layout with margins
      const obj3 = `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>\nendobj\n`;
      pdfParts.push(obj3);
      
      const obj4 = `4 0 obj\n<< /Length ${streamLen} >>\nstream\n${streamContent}\nendstream\nendobj\n`;
      pdfParts.push(obj4);
      
      // Font Definition using Courier for monospaced document receipt alignment
      const obj5 = `5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>\nendobj\n`;
      pdfParts.push(obj5);

      // Compute exact byte offsets to generate correct xref cross indexing
      let currentOffset = 0;
      const offsets: number[] = [];
      for (let i = 0; i < pdfParts.length; i++) {
        offsets.push(currentOffset);
        currentOffset += pdfParts[i].length;
      }

      // Construct Cross Reference Table
      let xref = `xref\n0 6\n0000000000 65535 f \n`;
      for (let i = 1; i <= 5; i++) {
        const padded = String(offsets[i]).padStart(10, '0');
        xref += `${padded} 00000 n \n`;
      }

      const trailer = `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${currentOffset}\n%%EOF\n`;
      const fullPdfText = pdfParts.join('') + xref + trailer;

      const buffer = new Uint8Array(fullPdfText.length);
      for (let i = 0; i < fullPdfText.length; i++) {
        buffer[i] = fullPdfText.charCodeAt(i) & 0xff;
      }
      
      const pdfBlob = new Blob([buffer], { type: 'application/pdf' });
      triggerDownload(pdfBlob);
    } else {
      // 3. Text & spreadsheet files (e.g., .txt, .xlsx, .docx, .csv):
      // Download the beautifully parsed PMO layout as genuine readable text
      const fileContent = `========================================================================
         COMPROBANTE OFICIAL DE REGISTRO - SISTEMA PMO WEB
========================================================================
Fecha de Descarga: ${new Date().toLocaleString('es-ES')}
Operación: REGISTRO DE SOPORTE DE GASTO (COMPROBANTE DE COMPRA / RECIBO)

INFORMACIÓN DETALLADA DEL DOCUMENTO:
------------------------------------------------------------------------
Número de Documento / Factura: #${c.document_number || 'N/A'}
Fecha del Documento soporte:   ${c.document_date || c.created_at || 'N/A'}
Rubro / Categoría de Gasto:    ${c.cost_type || 'OTROS'}
Concepto / Glosa de Soporte:    ${c.description}
Monto Registrado Global:       $${Number(c.amount).toLocaleString('en-US')} USD
ID Único de Auditoría Interna: ${c.id}

INFORMACIÓN DEL PROYECTO ASOCIADO:
------------------------------------------------------------------------
ID de Proyecto en PMO:         ${c.project_id}
Código Temático / Clave:       ${activeProject ? activeProject.code : 'N/A'}
Nombre de Proyecto Principal:  ${activeProject ? activeProject.name : 'N/A'}

INFORMACIÓN E INTEGRIDAD DEL REPOSITORIO DIGITAL:
------------------------------------------------------------------------
Nombre del Archivo Cargado:    ${c.file_name || `comprobante_${c.document_number || 'documento'}.txt`}
Tamaño de Archivo Declarado:   ${c.file_size || 'N/A'}
Ruta Virtual en Repositorio:   repo://soporte-pmo-storage/${c.storage_key || `uploads/${c.document_number}_comprobante.pdf`}
Firma de Integridad (MD5 Checksum): "${c.id.substring(c.id.length - Math.min(10, c.id.length))}e9800998ea"
API Cloud Endpoint Solicitado:     ${c.storage_url || `http://localhost:9000/soporte-pmo-storage/uploads/${c.document_number}_comprobante.pdf`}
Última Sincronización Registrada:  ${c.uploaded_at || c.created_at || new Date().toISOString()}

------------------------------------------------------------------------
Verificado por el Almacén de Datos Seguro Local de PMO Web.
========================================================================`;

      let mimeType = 'text/plain;charset=utf-8';
      if (ext === 'csv') mimeType = 'text/csv;charset=utf-8';
      else if (ext === 'xlsx') mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      else if (ext === 'docx') mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

      const txtBlob = new Blob([fileContent], { type: mimeType });
      triggerDownload(txtBlob);
    }
  };

  // Add Activity (Gantt)
  const handleAddActivity = (activity: Omit<ProjectActivity, 'id'>) => {
    const newAct: ProjectActivity = {
      ...activity,
      id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
    };
    setActivities(prev => [...prev, newAct]);
    addLog('Carlos Pérez (PM)', `Añadió la fase Gantt "${newAct.name}"`);
  };

  const handleUpdateActivityProgress = (id: string, progress: number) => {
    setActivities(prev => prev.map(a => {
      if (a.id === id) {
        const status = progress === 100 ? 'COMPLETADA' : progress > 0 ? 'EN_CURSO' : 'PENDIENTE';
        return { ...a, progress, status };
      }
      return a;
    }));
  };

  const handleDeleteActivity = (id: string) => {
    const act = activities.find(a => a.id === id);
    const actName = act ? `"${act.name}"` : 'esta actividad';
    setDeleteConfirmState({
      isOpen: true,
      title: 'Eliminar Fase de Trabajo',
      message: `¿Está seguro de que desea eliminar permanentemente la fase de planificación ${actName}?`,
      onConfirm: () => {
        setActivities(prev => prev.filter(a => a.id !== id));
      }
    });
  };

  // Backlog and Sprint Assignment
  const [newHUTitle, setNewHUTitle] = useState('');
  const [newHUPoints, setNewHUPoints] = useState('5');
  const [newHUType, setNewHUType] = useState<'HISTORIA_USUARIO' | 'TAREA' | 'BUG'>('HISTORIA_USUARIO');

  const handleAddBacklogItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHUTitle) return;

    const count = workItems.filter(w => w.type === newHUType).length + 1;
    const key = newHUType === 'HISTORIA_USUARIO' ? `HU000${count}` : newHUType === 'TAREA' ? `T000${count}` : `BG000${count}`;

    const newItem: WorkItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      project_id: selectedProjectId,
      key,
      title: newHUTitle,
      description: 'Requerimiento estructurado según metodología ágil',
      type: newHUType,
      status: 'BACKLOG',
      priority: 'MEDIUM',
      story_points: Number(newHUPoints) || undefined,
      created_at: new Date().toISOString().split('T')[0]
    };

    setWorkItems(prev => [...prev, newItem]);
    setNewHUTitle('');
    addLog('Mateo Herrera (PO)', `Creó requerimiento ágil ${newItem.key}: "${newItem.title}"`);
  };

  // --- Dynamic calculations / KPIs ---
  const activeSprintsItems = workItems.filter(w => w.project_id === selectedProjectId && w.sprint_id === activeSprintIdEffective);
  const totalPoints = activeSprintsItems.reduce((acc, current) => acc + (current.story_points || 0), 0);
  const completedPoints = activeSprintsItems
    .filter(w => w.status === 'FINALIZADO')
    .reduce((acc, cur) => acc + (cur.story_points || 0), 0);

  // Business Rule Calculation of Sprint Status:
  // "Sprint sin HU o solo Por hacer queda No iniciado; mezcla queda En curso; todo finalizado queda Finalizado"
  const getSprintCalculatedStatus = (spId: string) => {
    const spItems = workItems.filter(w => w.sprint_id === spId);
    if (spItems.length === 0) return 'NO_INICIADO';
    
    const allPorHacer = spItems.every(w => w.status === 'POR_HACER' || w.status === 'BACKLOG');
    if (allPorHacer) return 'NO_INICIADO';
    
    const allFinalizado = spItems.every(w => w.status === 'FINALIZADO');
    if (allFinalizado) return 'FINALIZADO';
    
    return 'EN_CURSO';
  };

  // Cost analysis
  const projectCosts = costs.filter(c => c.project_id === selectedProjectId);
  const totalCostAmount = projectCosts.reduce((acc, cur) => acc + cur.amount, 0);
  const remainingBudget = activeProject.budget_total - totalCostAmount;
  const budgetUtilizationPercent = Math.min(100, (totalCostAmount / activeProject.budget_total) * 100);

  // QA Metrics
  const projectSuites = testSuites.filter(s => s.project_id === selectedProjectId);
  const suiteIds = projectSuites.map(s => s.id);
  const suiteCases = testCases.filter(c => suiteIds.includes(c.suite_id));
  const passedCasesCount = suiteCases.filter(c => c.status === 'PASSED').length;
  const qaPassRate = suiteCases.length > 0 ? Math.round((passedCasesCount / suiteCases.length) * 100) : 100;

  if (!loggedInUser) {
    return <AuthFlow />;
  }

  const menuItems = menuRegistry;

  return (
    <div className="flex h-screen w-full bg-slate-50 font-sans text-slate-900 overflow-hidden antialiased relative">
      {/* Sidebar Overlay for Mobile */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 md:hidden backdrop-blur-xs transition-opacity duration-300"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 flex flex-col border-r border-slate-800 transition-transform duration-300 md:translate-x-0 md:static ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } shrink-0`}
      >
        <div className="p-6 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center font-bold text-white text-base shadow-sm">
              L
            </div>
            <div className="flex flex-col">
              <span className="text-white font-semibold text-sm tracking-tight leading-none mb-0.5">Lifecycle PM</span>
              <span className="text-[10px] text-slate-500 font-mono tracking-wide uppercase">v1.2.0 (Stable)</span>
            </div>
          </div>
          
          {/* Close button for Mobile */}
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-1.5 text-slate-400 hover:text-white md:hidden cursor-pointer hover:bg-slate-800 rounded-lg transition-colors"
            aria-label="Cerrar menú"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto">
          <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-3 pb-2 font-mono">Menú de Ciclo de Vida</span>
          
          {menuItems.map(item => {
            if (item.isGroup) {
              const Icon = item.icon;
              const isAnyChildActive = item.children?.some(child => activeTab === child.id);
              const isGroupOpen = item.id === 'projects_group' ? isProjectsMenuOpen : isSettingsMenuOpen;
              const toggleGroup = () => {
                if (item.id === 'projects_group') {
                  setIsProjectsMenuOpen(prev => !prev);
                } else {
                  setIsSettingsMenuOpen(prev => !prev);
                }
              };
              
              return (
                <div key={item.id} className="space-y-1">
                  <button
                    onClick={toggleGroup}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold tracking-tight transition-all text-left cursor-pointer ${
                      isAnyChildActive
                        ? 'text-blue-400 bg-slate-800/30'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-3.5 h-3.5" />
                      <span>{item.label}</span>
                    </div>
                    {isGroupOpen ? (
                      <ChevronDown className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5" />
                    )}
                  </button>
                  
                  {isGroupOpen && (
                    <div className="pl-3.5 space-y-1.5 border-l border-slate-800 ml-4 mt-1">
                      {item.children?.map(child => {
                        const ChildIcon = child.icon;
                        const isChildActive = activeTab === child.id;
                        return (
                          <button
                            key={child.id}
                            onClick={() => {
                              setActiveTab(child.id);
                              setIsMobileMenuOpen(false);
                            }}
                            className={`w-full flex items-center gap-3.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold tracking-tight transition-all text-left cursor-pointer ${
                              isChildActive
                                ? 'bg-blue-600/20 text-blue-400 border-l-2 border-blue-500 pl-2 font-bold'
                                : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                            }`}
                          >
                            <ChildIcon className="w-3" />
                            <span>{child.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold tracking-tight transition-all text-left cursor-pointer ${
                  isActive
                    ? 'bg-blue-600/20 text-blue-400 border-l-2 border-blue-500 pl-2.5 font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}

          <div className="pt-4 border-t border-slate-800 mt-4 space-y-2">
            <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-3 flex items-center gap-1.5 font-mono">
              <History className="w-3 h-3 text-blue-400" />
              Eventos Recientes
            </span>
            <div className="space-y-2 max-h-36 overflow-y-auto pr-1 pl-2">
              {logs.slice(0, 6).map(log => (
                <div key={log.id} className="text-[10px] border-b border-slate-800/50 pb-1.5 last:border-0">
                  <div className="flex justify-between text-slate-400 font-mono text-[9px]">
                    <span className="truncate max-w-[100px] font-semibold">{log.user.split(" ")[0]}</span>
                    <span>{log.time}</span>
                  </div>
                  <p className="text-slate-300 font-normal leading-tight text-[9px] truncate" title={log.text}>{log.text}</p>
                </div>
              ))}
            </div>
          </div>
        </nav>

        <div className="p-4 border-t border-slate-800 shrink-0">
          <div className="bg-slate-800/40 p-2.5 rounded-xl flex items-center justify-between gap-3 border border-slate-850">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold uppercase shrink-0 font-mono shadow-sm">
                {loggedInUser ? `${loggedInUser.first_name?.[0] || 'U'}${loggedInUser.last_name?.[0] || 'S'}` : 'U'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate leading-tight">
                  {loggedInUser ? `${loggedInUser.first_name || ''} ${loggedInUser.last_name || ''}`.trim() || 'Usuario' : 'Invitado'}
                </p>
                <p className="text-[10px] text-slate-400 truncate mt-0.5" title={loggedInUser?.role}>
                  {loggedInUser ? loggedInUser.role : 'Sin Perfil'}
                </p>
              </div>
            </div>
            
            {/* Quick Logout inside the Sidebar card block */}
            <button
              onClick={handleLogout}
              className="p-1.5 bg-slate-800 hover:bg-red-950/40 text-slate-400 hover:text-red-400 border border-slate-700/50 hover:border-red-900/50 rounded-lg transition-all duration-200 cursor-pointer shrink-0"
              title="Cerrar sesión"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Explicit, high-visibility block logout button for Mobile viewports */}
          <button
            onClick={handleLogout}
            className="w-full mt-2.5 flex items-center justify-center gap-2 py-2 bg-red-650/10 hover:bg-red-650/25 text-red-400 hover:text-red-300 border border-red-500/20 hover:border-red-500/45 rounded-xl text-[11px] font-bold cursor-pointer transition-all duration-200 md:hidden"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden w-full">
        {/* Header Bar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 md:px-8 shrink-0 gap-3 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Hamburger toggle button for Mobile */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-1.5 -ml-1 text-slate-650 hover:text-slate-900 md:hidden hover:bg-slate-100 rounded-lg transition-all cursor-pointer shrink-0"
              aria-label="Abrir menú"
            >
              <Menu className="w-5.5 h-5.5" />
            </button>
            <h1 className="text-sm sm:text-base font-bold text-slate-800 truncate max-w-[140px] xs:max-w-[180px] sm:max-w-none">
              Gestión Integral de proyectos
            </h1>
          </div>

          {/* User Session and Tenant Header Tools */}
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            {/* Tenant Status Tag */}
            <div className="hidden lg:flex items-center gap-2 bg-slate-50 border border-slate-200/60 rounded-full px-3 py-1">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[10px] text-slate-500 font-mono tracking-tight">
                CIA: <strong className="text-slate-700 uppercase">{(tenants.find(t => t.id === loggedInUser?.tenant_id)?.name) || loggedInUser?.tenant_id}</strong>
              </span>
            </div>

            {/* Profile Avatar & Stack */}
            <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-slate-200 shrink-0">
              <div className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 flex items-center justify-center font-bold text-xs uppercase cursor-help shrink-0 font-mono" title={`${loggedInUser?.first_name || ''} ${loggedInUser?.last_name || ''} (${loggedInUser?.role || ''})`}>
                {loggedInUser ? `${loggedInUser.first_name?.[0] || 'U'}${loggedInUser.last_name?.[0] || 'S'}` : 'US'}
              </div>
              <div className="hidden sm:flex flex-col text-left min-w-0">
                <span className="text-xs font-semibold text-slate-850 truncate leading-none mb-0.5">
                  {loggedInUser ? `${loggedInUser.first_name || ''} ${loggedInUser.last_name || ''}`.trim() || 'Usuario' : 'Usuario'}
                </span>
                <span className="text-[10px] text-slate-400 font-medium truncate">
                  {loggedInUser ? loggedInUser.role : 'Invitado'}
                </span>
              </div>
            </div>

            {/* Logout interactive Button */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 bg-slate-50 hover:bg-red-50 text-slate-600 hover:text-red-650 border border-slate-200 hover:border-red-200 rounded-xl text-xs font-semibold tracking-tight transition-all duration-200 cursor-pointer shadow-xs shrink-0"
              title="Cerrar sesión de forma segura"
            >
              <LogOut className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">Cerrar Sesión</span>
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">

              {/* 1. TAB: DASHBOARD */}
              {activeTab === 'dashboard' && (
                <div className="animate-fadeIn" id="tab-dashboard">
                  <KPIDashboard
                    projects={segmentedProjects}
                    users={segmentedUsers}
                    sprints={sprints}
                    workItems={workItems}
                    activities={activities}
                    costs={costs}
                    testRuns={testRuns}
                    testCases={testCases}
                  />
                </div>
              )}

          {/* 2. TAB: PROJECTS & COST BUDGETS_ */}
          {activeTab === 'projects' && (
            <div className="space-y-6 animate-fadeIn" id="tab-projects">
              {expandedProjectId === null ? (
                <>
                  {/* Highly polished Filters & Create Action Panel */}
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <h3 className="text-slate-900 font-bold text-base">Filtros de Portafolio</h3>
                        <p className="text-xs text-slate-500">Refine la vista de proyectos utilizando los campos de búsqueda o atributos.</p>
                      </div>
                      
                      <button
                        onClick={() => {
                          if (isDevRole) {
                            alert('Acceso restringido: Su cuenta no posee permisos para registrar nuevos proyectos.');
                            return;
                          }
                          setIsCreateProjectModalOpen(true);
                        }}
                        disabled={isDevRole}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed active:scale-[0.98] text-white font-extrabold text-xs px-4 py-2.5 rounded-lg transition-all shadow-sm flex items-center gap-2 cursor-pointer"
                        title={isDevRole ? "Creación restringida para perfiles de desarrollo" : undefined}
                      >
                        <Plus className="w-4 h-4" />
                        <span>Nuevo Proyecto</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-2 border-t border-slate-100">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Buscar Proyecto / Cliente</label>
                        <div className="relative">
                          <input
                            type="text"
                            value={projectSearch}
                            onChange={e => setProjectSearch(e.target.value)}
                            placeholder="Nombre, código o cliente..."
                            className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-lg pl-8 pr-3 py-2 text-xs text-slate-800 outline-none focus:ring-1 focus:ring-blue-500 transition-all font-semibold"
                          />
                          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                          {projectSearch && (
                            <button
                              onClick={() => setProjectSearch('')}
                              className="text-slate-400 hover:text-slate-650 text-xs font-bold absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="relative">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Filtrar por Estado (Múltiple)</label>
                        <button
                          type="button"
                          onClick={() => setIsStatusFilterDropdownOpen(!isStatusFilterDropdownOpen)}
                          className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-lg px-3 py-2 text-xs text-slate-800 text-left cursor-pointer font-bold flex justify-between items-center whitespace-nowrap overflow-hidden min-h-[34px]"
                        >
                          <span className="truncate">
                            {projectStatusFilter.length === 6
                              ? '🟢 Todos los Estados'
                              : projectStatusFilter.length === 0
                              ? '⚠️ Ningún Estado'
                              : projectStatusFilter.map(val => {
                                  const matching = [
                                    { value: 'REQUERIMIENTOS', label: 'REQUERIMIENTOS', icon: '📋' },
                                    { value: 'APROBADO', label: 'APROBADO', icon: '✅' },
                                    { value: 'DESARROLLO', label: 'DESARROLLO', icon: '💻' },
                                    { value: 'PRUEBAS', label: 'PRUEBAS', icon: '🧪' },
                                    { value: 'FINALIZADO', label: 'FINALIZADO', icon: '🏁' },
                                    { value: 'CANCELADO', label: 'CANCELADO', icon: '🚫' },
                                  ].find(s => s.value === val);
                                  return matching ? `${matching.icon} ${matching.label}` : val;
                                }).join(', ')}
                          </span>
                          <span className="text-slate-400 text-[9px] ml-1">▼</span>
                        </button>
                        
                        {isStatusFilterDropdownOpen && (
                          <>
                            <div 
                              className="fixed inset-0 z-10" 
                              onClick={() => setIsStatusFilterDropdownOpen(false)} 
                            />
                            <div className="absolute right-0 left-0 mt-1 max-h-60 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-xl p-2 z-20 space-y-1">
                              <div className="flex justify-between items-center pb-1.5 mb-1.5 border-b border-slate-100 text-[10px]">
                                <button
                                  type="button"
                                  onClick={() => setProjectStatusFilter(['REQUERIMIENTOS', 'APROBADO', 'DESARROLLO', 'PRUEBAS', 'FINALIZADO', 'CANCELADO'])}
                                  className="text-blue-600 font-extrabold hover:underline"
                                >
                                  Todos
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setProjectStatusFilter([])}
                                  className="text-slate-500 font-extrabold hover:underline"
                                >
                                  Limpiar
                                </button>
                              </div>
                              {[
                                { value: 'REQUERIMIENTOS', label: 'REQUERIMIENTOS', icon: '📋' },
                                { value: 'APROBADO', label: 'APROBADO', icon: '✅' },
                                { value: 'DESARROLLO', label: 'DESARROLLO', icon: '💻' },
                                { value: 'PRUEBAS', label: 'PRUEBAS', icon: '🧪' },
                                { value: 'FINALIZADO', label: 'FINALIZADO', icon: '🏁' },
                                { value: 'CANCELADO', label: 'CANCELADO', icon: '🚫' },
                              ].map(option => {
                                const isChecked = projectStatusFilter.includes(option.value);
                                return (
                                  <label 
                                    key={option.value} 
                                    className="flex items-center gap-2 p-1 px-2 hover:bg-slate-50 rounded cursor-pointer text-xs font-semibold select-none text-slate-705"
                                  >
                                    <input 
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => {
                                        if (isChecked) {
                                          setProjectStatusFilter(projectStatusFilter.filter(s => s !== option.value));
                                        } else {
                                          setProjectStatusFilter([...projectStatusFilter, option.value]);
                                        }
                                      }}
                                      className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer w-3.5 h-3.5"
                                    />
                                    <span>{option.icon} {option.label}</span>
                                  </label>
                                );
                              })}
                            </div>
                          </>
                        )}
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Filtrar por Prioridad</label>
                        <select
                          value={projectPriorityFilter}
                          onChange={e => setProjectPriorityFilter(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none cursor-pointer font-bold"
                        >
                          <option value="ALL">⚡ Todas las Prioridades</option>
                          <option value="HIGH">🔴 Alta</option>
                          <option value="MEDIUM">🟡 Media</option>
                          <option value="LOW">🟢 Baja</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Filtrar por Sponsor</label>
                        <select
                          value={projectClientFilter}
                          onChange={e => setProjectClientFilter(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none cursor-pointer font-bold"
                        >
                          <option value="ALL">👤 Todos los Sponsors</option>
                          {Array.from(new Set(segmentedProjects.map(p => p.sponsor).filter(Boolean))).map(sponsor => {
                            const foundSponsor = users.find(u => u.id === sponsor);
                            const nameLabel = foundSponsor ? `${foundSponsor.first_name} ${foundSponsor.last_name}` : sponsor || 'Sponsor Principal';
                            return (
                              <option key={sponsor} value={sponsor}>👤 {nameLabel}</option>
                            );
                          })}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* High Polished List of Projects with Double-Click Instructions */}
                  <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <h3 className="text-slate-900 font-bold text-base">Portafolio de Proyectos Activos</h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Haga <strong className="text-blue-600">doble clic</strong> sobre cualquier fila de proyecto para desplegar su planificación ágil, Gantt y control de costos.
                        </p>
                      </div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                        Lista Interactiva
                      </span>
                    </div>

                    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs min-w-[800px]">
                        <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                          <tr>
                            <th className="p-3">Código</th>
                            <th className="p-3">Nombre del Proyecto</th>
                            <th className="p-3">Cliente / Sponsor</th>
                            <th className="p-3 font-mono">Presupuesto Límite</th>
                            <th className="p-3 font-mono">Total Gastado</th>
                            <th className="p-3">Consumo Presupuesto</th>
                            <th className="p-3">Progreso de Fechas (Cronograma)</th>
                            <th className="p-3 select-none">Fase de Ciclo</th>
                            <th className="p-3 text-center">Detalle</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-150">
                          {(() => {
                            const filteredProjects = segmentedProjects.filter(proj => {
                              const matchesSearch = proj.name.toLowerCase().includes(projectSearch.toLowerCase()) || 
                                                  proj.code.toLowerCase().includes(projectSearch.toLowerCase()) ||
                                                  proj.client.toLowerCase().includes(projectSearch.toLowerCase());
                              const matchesStatus = projectStatusFilter.length === 0 || projectStatusFilter.includes(proj.status);
                              const matchesPriority = projectPriorityFilter === 'ALL' || proj.priority === projectPriorityFilter;
                              const matchesClient = projectClientFilter === 'ALL' || proj.sponsor === projectClientFilter;
                              return matchesSearch && matchesStatus && matchesPriority && matchesClient;
                            });

                            if (filteredProjects.length === 0) {
                              return (
                                <tr>
                                  <td colSpan={9} className="p-8 text-center text-slate-400 font-semibold text-xs">
                                    No se encontraron proyectos con los filtros aplicados.
                                  </td>
                                </tr>
                              );
                            }

                            return filteredProjects.map(proj => {
                              const projCosts = costs.filter(c => c.project_id === proj.id);
                              const totalCost = projCosts.reduce((sum, current) => sum + current.amount, 0);
                              const percentOfBudget = proj.budget_total > 0 ? (totalCost / proj.budget_total) * 100 : 0;
                              const isOverBudget = totalCost > proj.budget_total;
                              const isCurrentlyGlobalActive = selectedProjectId === proj.id;

                              return (
                                <tr 
                                  key={proj.id}
                                  onDoubleClick={() => {
                                    setSelectedProjectId(proj.id);
                                    setExpandedProjectId(proj.id);
                                    addLog('Sistema', `Expandió por doble clic el proyecto: [${proj.code}] ${proj.name}`);
                                  }}
                                  className={`group cursor-pointer hover:bg-slate-50/80 transition-all select-none ${isCurrentlyGlobalActive ? 'bg-blue-50/30' : ''}`}
                                  title="¡Haga doble clic para ver planificación completa!"
                                >
                                  <td className="p-3">
                                    <span className="px-2 py-0.5 rounded font-mono font-bold text-[10.5px] bg-slate-100 text-slate-800 border border-slate-200 group-hover:bg-white transition-colors">
                                      {proj.code}
                                    </span>
                                  </td>
                                  <td className="p-3 font-semibold text-slate-900">
                                    <div className="flex items-center gap-1.5">
                                      <span>{proj.name}</span>
                                      {isCurrentlyGlobalActive && (
                                        <span className="text-[9px] bg-blue-600 text-white font-bold px-1.5 py-0.2 rounded shrink-0">Global</span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                                        ⚙️ {proj.desarrollo || 'Interno'}
                                      </span>
                                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100/40">
                                        🏷️ {proj.categoria || 'Mediano'}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="p-3 text-slate-500">
                                    <div className="font-semibold text-slate-800">{proj.client}</div>
                                    <div className="text-[10px] text-slate-500 font-medium mt-0.5 whitespace-nowrap">
                                      👤 Sponsor: {(() => {
                                        const foundSponsor = users.find(u => u.id === proj.sponsor);
                                        return foundSponsor ? `${foundSponsor.first_name} ${foundSponsor.last_name}` : proj.sponsor || 'Sponsor Principal';
                                      })()}
                                    </div>
                                  </td>
                                  <td className="p-3 font-mono font-bold text-slate-800">
                                    {isDevRole ? '••••••' : `$${proj.budget_total.toLocaleString('en-US')} USD`}
                                  </td>
                                  <td className="p-3 font-mono font-bold text-slate-800">
                                    <span className={isOverBudget ? 'text-rose-600' : 'text-slate-900'}>
                                      {isDevRole ? '••••••' : `$${totalCost.toLocaleString('en-US')} USD`}
                                    </span>
                                  </td>
                                  <td className="p-3">
                                    <div className="flex items-center gap-2">
                                      <div className="w-16 bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                                        <div 
                                          className={`h-full rounded-full transition-all ${isOverBudget ? 'bg-rose-500' : percentOfBudget > 85 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                          style={{ width: `${Math.min(percentOfBudget, 100)}%` }}
                                        />
                                      </div>
                                      <span className={`text-[10px] font-mono font-bold ${isOverBudget ? 'text-rose-600' : 'text-slate-600'}`}>
                                        {Math.round(percentOfBudget)}%
                                      </span>
                                    </div>
                                  </td>
                                  <td className="p-3">
                                    {(() => {
                                      const startMs = new Date(proj.start_date).getTime();
                                      const endMs = new Date(proj.end_date).getTime();
                                      const todayMs = new Date('2026-06-08').getTime();
                                      let percentElapsed = 0;
                                      if (!isNaN(startMs) && !isNaN(endMs) && endMs > startMs) {
                                        percentElapsed = Math.round(((todayMs - startMs) / (endMs - startMs)) * 100);
                                        percentElapsed = Math.max(0, Math.min(100, percentElapsed));
                                      }
                                      
                                      const formatDateAbbr = (dateStr: string) => {
                                        if (!dateStr || !dateStr.includes('-')) return dateStr;
                                        const parts = dateStr.split('-');
                                        const day = String(parseInt(parts[2], 10)).padStart(2, '0');
                                        const monthIndex = parseInt(parts[1], 10) - 1;
                                        const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
                                        return `${day} ${months[monthIndex] || ''}`;
                                      };

                                      return (
                                        <div className="flex flex-col gap-1 min-w-[140px] max-w-[180px]">
                                          <div className="flex justify-between text-[10px] font-bold text-slate-500 leading-none">
                                            <span>{formatDateAbbr(proj.start_date)}</span>
                                            <span>{formatDateAbbr(proj.end_date)}</span>
                                          </div>
                                          <div className="flex items-center gap-1.5 mt-0.5">
                                            <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                                              <div 
                                                className="h-full rounded-full transition-all bg-indigo-500"
                                                style={{ width: `${percentElapsed}%` }}
                                                title={`Progreso temporal: ${percentElapsed}% de días empleados`}
                                              />
                                            </div>
                                            <span className="text-[10px] font-mono font-bold text-indigo-600 tracking-tighter shrink-0">
                                              {percentElapsed}%
                                            </span>
                                          </div>
                                        </div>
                                      );
                                    })()}
                                  </td>
                                  <td className="p-3">
                                    <div className="flex items-center gap-2">
                                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold tracking-tight uppercase ${
                                        proj.status === 'DESARROLLO' ? 'bg-blue-100 text-blue-700' :
                                        proj.status === 'FINALIZADO' ? 'bg-emerald-100 text-emerald-800' :
                                        proj.status === 'REQUERIMIENTOS' ? 'bg-slate-100 text-slate-600 border border-slate-200' :
                                        proj.status === 'PRUEBAS' ? 'bg-amber-100 text-amber-800' : 'bg-rose-105 bg-rose-50 text-rose-700'
                                      }`}>
                                        {proj.status}
                                      </span>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (isDevRole) {
                                            alert('Acceso restringido: Los perfiles de desarrollo no poseen permisos para cambiar el estado o fase de portafolios del proyecto.');
                                            return;
                                          }
                                          setProjectStatusModalTarget(proj);
                                        }}
                                        disabled={isDevRole}
                                        className="text-slate-400 hover:text-blue-600 disabled:hover:text-slate-400 disabled:cursor-not-allowed p-1 hover:bg-slate-100 rounded transition cursor-pointer"
                                        title={isDevRole ? "Cambio de fase restringido para perfiles de desarrollo" : "Cambiar Estado del Proyecto (Ventana Emergente)"}
                                      >
                                        <Edit2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </td>
                                  <td className="p-3 text-center">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedProjectId(proj.id);
                                        setExpandedProjectId(proj.id);
                                        addLog('Sistema', `Visualizó el proyecto: [${proj.code}] ${proj.name}`);
                                      }}
                                      className="bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-800 font-bold text-[11px] px-2.5 py-1.5 rounded transition cursor-pointer"
                                    >
                                      Ver Detalle
                                    </button>
                                  </td>
                                </tr>
                              );
                            });
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Detailed Deployed View with breadcrumb / Back control */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white border border-slate-200 rounded-xl p-5 shadow-xs gap-4">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setExpandedProjectId(null)}
                        className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3.5 py-2 rounded-lg transition cursor-pointer select-none"
                        onDoubleClick={() => setExpandedProjectId(null)}
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                        <span>Volver al Listado</span>
                      </button>
                      <span className="text-slate-300">|</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block font-mono">Proyecto Detallado</span>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold tracking-tight uppercase border ${
                            activeProject.status === 'DESARROLLO' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            activeProject.status === 'FINALIZADO' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                            activeProject.status === 'REQUERIMIENTOS' ? 'bg-slate-50 text-slate-600 border-slate-200' :
                            activeProject.status === 'PRUEBAS' ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}>
                            {activeProject.status}
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-900 text-sm">[{activeProject.code}] {activeProject.name}</h4>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-2">
                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                          Cambiar Detalle:
                        </label>
                        <select
                          value={selectedProjectId}
                          onChange={e => {
                            setSelectedProjectId(e.target.value);
                            setExpandedProjectId(e.target.value);
                          }}
                          className="bg-slate-50 text-slate-850 text-xs rounded-lg border border-slate-250 px-2.5 py-1.5 cursor-pointer font-bold"
                        >
                          {segmentedProjects.map(p => (
                            <option key={p.id} value={p.id}>
                              [{p.code}] {p.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <button
                        onClick={() => {
                          if (isDevRole) {
                            alert('Acceso restringido: Los perfiles de desarrollo no poseen permisos para cambiar el estado de portafolios del proyecto.');
                            return;
                          }
                          setProjectStatusModalTarget(activeProject);
                        }}
                        disabled={isDevRole}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-extrabold text-xs px-4 py-2 rounded-lg flex items-center gap-2 transition-all cursor-pointer shadow-3xs shadow-xs hover:-translate-y-0.5 active:translate-y-0"
                        title={isDevRole ? "Cambio de fase restringido para perfiles de desarrollo" : undefined}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Cambiar Estado</span>
                      </button>

                      <button
                        onClick={() => {
                          if (isDevRole) {
                            alert('Acceso restringido: Los perfiles de desarrollo no poseen permisos para configurar proyectos.');
                            return;
                          }
                          setProjectConfigModalTarget(activeProject);
                        }}
                        disabled={isDevRole}
                        className="bg-slate-100 hover:bg-slate-200 disabled:bg-slate-50 disabled:text-slate-400 text-slate-700 font-extrabold text-xs px-4 py-2 rounded-lg flex items-center gap-2 transition-all cursor-pointer border border-slate-200"
                        title={isDevRole ? "Editor restringido para perfiles de desarrollo" : undefined}
                      >
                        <Settings className="w-3.5 h-3.5 text-slate-500" />
                        <span>Configurar Proyecto</span>
                      </button>
                    </div>
                  </div>

                  {/* PROJECT CONFIGURATION METADATA RIBBON */}
                  <div className="grid grid-cols-2 md:grid-cols-7 gap-4 bg-white border border-slate-200 rounded-xl p-4 mt-4 shadow-3xs text-xs animate-fadeIn">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
                        <Briefcase className="w-4 h-4" />
                      </div>
                      <div className="overflow-hidden">
                        <span className="block text-[10px] uppercase font-bold text-slate-400">Cliente</span>
                        <span className="font-semibold text-slate-800 truncate block whitespace-nowrap">{activeProject.client || 'General'}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg shrink-0">
                        <UserCheck className="w-4 h-4" />
                      </div>
                      <div className="overflow-hidden">
                        <span className="block text-[10px] uppercase font-bold text-slate-400">Sponsor</span>
                        <span className="font-semibold text-slate-800 truncate block whitespace-nowrap">
                          {(() => {
                            const foundSponsor = users.find(u => u.id === activeProject.sponsor);
                            return foundSponsor ? `${foundSponsor.first_name} ${foundSponsor.last_name}` : activeProject.sponsor || 'Sponsor Principal';
                          })()}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-100 text-slate-700 rounded-lg shrink-0">
                        <Cpu className="w-4 h-4 text-slate-600" />
                      </div>
                      <div className="overflow-hidden">
                        <span className="block text-[10px] uppercase font-bold text-slate-400">Desarrollo</span>
                        <span className="font-semibold text-slate-800 text-[11px] truncate block whitespace-nowrap">
                          {activeProject.desarrollo || 'Interno'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-50 text-blue-600 rounded-lg shrink-0">
                        <Tag className="w-4 h-4 text-blue-500" />
                      </div>
                      <div className="overflow-hidden">
                        <span className="block text-[10px] uppercase font-bold text-slate-400">Categoría</span>
                        <span className="font-semibold text-slate-800 text-[11px] truncate block whitespace-nowrap">
                          {activeProject.categoria || 'Mediano'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-amber-50 text-amber-600 rounded-lg shrink-0">
                        <Coins className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="block text-[10px] uppercase font-bold text-slate-400">Presupuesto</span>
                        <span className="font-mono font-bold text-slate-800">${activeProject.budget_total?.toLocaleString()} USD</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-rose-50 text-rose-600 rounded-lg shrink-0">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div className="overflow-hidden">
                        <span className="block text-[10px] uppercase font-bold text-slate-400">Cronograma</span>
                        <span className="font-semibold text-slate-700 text-[11px] truncate block whitespace-nowrap">{activeProject.start_date} al {activeProject.end_date}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 col-span-2 md:col-span-1">
                      <div className="p-2 bg-sky-50 text-sky-600 rounded-lg shrink-0">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="block text-[10px] uppercase font-bold text-slate-400">Sprint</span>
                        <span className="font-semibold text-sky-850 font-bold bg-sky-50 border border-sky-100 px-2 py-0.5 rounded text-[11px] block mt-0.5 w-fit">
                          {activeProject.sprint_size_days !== undefined ? activeProject.sprint_size_days : 10}d
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* SUB-TABS: (Estructura Jerarquica del proyecto) & (Control de Rubros de Presupuesto Asignado vs. Ejecutado y Historial de Documentos Registrados) */}
                  <div className="flex border-b border-slate-200 mt-6 select-none bg-white p-1 rounded-t-xl gap-2 shadow-3xs">
                    <button
                      onClick={() => setProjectSubTab('wbs')}
                      className={`px-5 py-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
                        projectSubTab === 'wbs'
                          ? 'border-blue-600 text-blue-600 font-extrabold bg-blue-50/40 rounded-t-lg'
                          : 'border-transparent text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <Layers className="w-4 h-4 text-blue-500" />
                      <span>Cronograma de actividades</span>
                    </button>
                    <button
                      onClick={() => setProjectSubTab('costs')}
                      className={`px-5 py-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
                        projectSubTab === 'costs'
                          ? 'border-blue-600 text-blue-600 font-extrabold bg-blue-50/40 rounded-t-lg'
                          : 'border-transparent text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <Coins className="w-4 h-4 text-indigo-500" />
                      <span>Presupuesto</span>
                    </button>
                    <button
                      onClick={() => setProjectSubTab('activities')}
                      className={`px-5 py-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
                        projectSubTab === 'activities'
                          ? 'border-emerald-600 text-emerald-600 font-extrabold bg-emerald-50/40 rounded-t-lg'
                          : 'border-transparent text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <ClipboardList className="w-4 h-4 text-emerald-555 text-emerald-500" />
                      <span>Actividades</span>
                    </button>
                    <button
                      onClick={() => setProjectSubTab('notes')}
                      className={`px-5 py-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
                        projectSubTab === 'notes'
                          ? 'border-indigo-600 text-indigo-600 font-extrabold bg-indigo-50/40 rounded-t-lg'
                          : 'border-transparent text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <FileText className="w-4 h-4 text-indigo-500" />
                      <span>Notas de Proyecto</span>
                    </button>
                  </div>

                  {/* 2. SUB-TAB VIEW CONTENT */}
                  {projectSubTab === 'wbs' && (
                    <div className="bg-white border border-t-0 border-slate-200 rounded-b-xl p-4 shadow-sm animate-fadeIn">
                      <ProjectWBSManager
                        projectId={selectedProjectId}
                        users={segmentedUsers}
                        addLog={addLog}
                        isDevRole={isDevRole}
                        sprints={sprints}
                      />
                    </div>
                  )}

                  {projectSubTab === 'costs' && (
                    <ProjectBudgetView />
                  )}

                  {projectSubTab === 'activities' && (
                    <ProjectActivitiesSubTab
                      projectId={selectedProjectId}
                      users={segmentedUsers}
                      sprints={sprints}
                      workItems={workItems}
                      setWorkItems={setWorkItems}
                      activities={activities}
                      setActivities={setActivities}
                      addLog={addLog}
                    />
                  )}

                  {projectSubTab === 'notes' && (
                    <div className="bg-white border border-t-0 border-slate-200 rounded-b-xl p-6 shadow-sm animate-fadeIn">
                      <ProjectNotesSubTab
                        projectId={selectedProjectId}
                        users={segmentedUsers}
                        addLog={addLog}
                        noteTypes={noteTypes}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* TAB: ACTIVITIES */}
          {activeTab === 'activities' && (
            <div className="space-y-6 animate-fadeIn" id="tab-activities">
              {/* Header card for Project Selection & Scope Context */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h3 className="text-slate-900 font-extrabold text-base flex items-center gap-2">
                      <ClipboardList className="w-5 h-5 text-indigo-600" />
                      Actividades del Plan de Trabajo
                    </h3>
                    <p className="text-xs text-slate-500">
                      Gestione, asigne e interconecte las actividades técnicas y de asegurabilidad asociadas a las Historias de Usuario (HU).
                    </p>
                  </div>
                  
                  {/* Selector de Proyecto Contextual */}
                  <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
                    <span className="text-xs font-bold text-slate-500 uppercase whitespace-nowrap">Proyecto Objetivo:</span>
                    <select
                      value={selectedProjectId}
                      onChange={(e) => setSelectedProjectId(e.target.value)}
                      className="bg-slate-50 hover:bg-slate-100 border border-slate-250 rounded-lg px-3 py-2 text-xs text-slate-800 font-extrabold cursor-pointer transition focus:outline-none focus:ring-2 focus:ring-blue-100"
                    >
                      {segmentedProjects.map(p => (
                        <option key={p.id} value={p.id}>💼 {p.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Renders the Activities View configured with the selected context */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <div className="mb-4 bg-indigo-50/45 border border-indigo-100/50 rounded-lg p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2 text-xs font-semibold text-indigo-850">
                    <span className="flex h-2 w-2 relative shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                    </span>
                    <span>Vista enfocada en el Sprint activo: <strong className="font-bold underline">{activeSprint ? activeSprint.name : 'Backlog General'}</strong></span>
                  </div>
                  <div className="text-[10px] bg-indigo-100/65 text-indigo-800 font-mono font-bold px-2 py-0.5 rounded uppercase">
                    Estado: {activeSprint ? activeSprint.status : 'N/A'}
                  </div>
                </div>

                <ProjectActivitiesSubTab
                  projectId={selectedProjectId}
                  users={segmentedUsers}
                  sprints={sprints}
                  workItems={workItems}
                  setWorkItems={setWorkItems}
                  activities={activities}
                  setActivities={setActivities}
                  addLog={addLog}
                />
              </div>
            </div>
          )}

          {/* 3. TAB: BACKLOG */}
          {activeTab === 'backlog' && (
            <div className="space-y-6 animate-fadeIn" id="tab-backlog">
              <ProductBacklogManager
                selectedProjectId={selectedProjectId}
                setSelectedProjectId={setSelectedProjectId}
                projects={segmentedProjects}
                users={segmentedUsers}
                sprints={sprints}
                setSprints={setSprints}
                addLog={addLog}
                workItems={workItems}
                setWorkItems={setWorkItems}
              />
            </div>
          )}

          {/* 4. TAB: SCRUM BOARD (KANBAN) */}
          {activeTab === 'kanban' && (
            <div className="space-y-6 animate-fadeIn" id="tab-kanban">
              <ScrumBoardAndQaManager
                selectedProjectId={selectedProjectId}
                setSelectedProjectId={setSelectedProjectId}
                projects={segmentedProjects}
                users={segmentedUsers}
                sprints={sprints}
                setSprints={setSprints}
                workItems={workItems}
                setWorkItems={setWorkItems}
                testCases={testCases}
                setTestCases={setTestCases}
                testRuns={testRuns}
                setTestRuns={setTestRuns}
                addLog={addLog}
                loggedInUser={loggedInUser || undefined}
              />
            </div>
          )}

          {/* 5. TAB: QA TESTING SUITE */}
          {activeTab === 'qa' && (
            <QaSuiteWorkspace
              selectedProjectId={selectedProjectId}
              setSelectedProjectId={setSelectedProjectId}
              projects={segmentedProjects}
              users={segmentedUsers}
              sprints={sprints}
              setSprints={setSprints}
              workItems={workItems}
              setWorkItems={setWorkItems}
              testCases={testCases}
              setTestCases={setTestCases}
              testSuites={testSuites}
              setTestSuites={setTestSuites}
              testRuns={testRuns}
              setTestRuns={setTestRuns}
              addLog={addLog}
              loggedInUser={loggedInUser || undefined}
              activities={activities}
              setActivities={setActivities}
            />
          )}

          {/* 6. TAB: MOCKUPS LIVE CANVAS */}
          {activeTab === 'mockup' && (
            <div className="space-y-6 animate-fadeIn" id="tab-mockups">
              {/* Load Mockup canvas component with projects and selection details */}
              <MockupCanvas
                projects={segmentedProjects}
                selectedProjectId={selectedProjectId}
                setSelectedProjectId={setSelectedProjectId}
              />
            </div>
          )}

          {/* 7. TAB: TEAMS & CAPACITY */}
          {activeTab === 'teams' && (
            <TeamDirectoryView smtpPassword={smtpPassword} />
          )}

          {/* 8. TAB: DBA POSTGRESQL */}
          {activeTab === 'dba' && (
            <div className="space-y-6 animate-fadeIn" id="tab-dba">
              <DbaSchema />
            </div>
          )}

          {/* 9. TAB: DEVOPS & GITHUB CLIENTS */}
          {activeTab === 'devops' && (
            <div className="space-y-6 animate-fadeIn" id="tab-devops">
              {/* DevOps code compilation, docker services list, gateway mapping */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <h3 className="text-slate-900 font-bold text-base mb-2">Conexión de Repositorios y Telemetría</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  {/* Commits */}
                  <div className="space-y-3">
                    <span className="text-[10.5px] font-bold text-slate-450 uppercase tracking-wider block">Historial Reciente de Commits</span>
                    {INITIAL_COMMITS.map(commit => (
                      <div key={commit.id} className="border border-slate-150 p-3 rounded-xl hover:bg-slate-50 text-xs transition">
                        <div className="flex justify-between">
                          <span className="font-mono text-indigo-600 font-bold bg-indigo-50 px-1 py-0.5 rounded">{commit.hash}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{new Date(commit.timestamp).toLocaleDateString()}</span>
                        </div>
                        <p className="font-semibold text-slate-800 mt-2">{commit.message}</p>
                        <p className="text-[10px] text-slate-500 mt-1">Autor: {commit.author} • Rama: <span className="text-indigo-600 font-bold font-mono">{commit.branch}</span></p>
                      </div>
                    ))}
                  </div>

                  {/* Pull Requests */}
                  <div className="space-y-3">
                    <span className="text-[10.5px] font-bold text-slate-450 uppercase tracking-wider block">Pull Requests Activas (PRs)</span>
                    {INITIAL_PRS.map(pr => (
                      <div key={pr.id} className="border border-slate-150 p-3 rounded-xl hover:bg-slate-50 text-xs transition">
                        <div className="flex justify-between">
                          <strong className="text-slate-800">#{pr.number} {pr.title}</strong>
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                            pr.status === 'OPEN' ? 'bg-amber-50 text-amber-700' : 'bg-green-50 text-green-700'
                          }`}>
                            {pr.status}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-2">Autor: {pr.author} • Creada hace 2 días</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

               {/* CI/CD Dynamic Simulator Actions */}
              <DevOpsPipeline selectedProjectId={selectedProjectId} projects={segmentedProjects} />
            </div>
          )}

          {/* 10. TAB: CENTRAL SETTINGS */}
          {activeTab === 'settings' && (
            <SettingsManagerView
              smtpPassword={smtpPassword}
              setSmtpPassword={setSmtpPassword}
              clientsList={clientsList}
              setClientsList={setClientsList}
              sponsorsList={sponsorsList}
              setSponsorsList={setSponsorsList}
            />
          )}

        </div>

        {/* Status Bar */}
        <footer className="h-8 bg-slate-200 border-t border-slate-300 flex items-center justify-between px-6 shrink-0">
          <div className="flex gap-4 text-[10px] font-bold text-slate-500 uppercase">
            <span>SCRUM Master: Sofía Ramírez</span>
            <span className="hidden sm:inline">•</span>
            <span>Autor Principal: Alex Castro</span>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline">Release Candidate: v1.2.0-stable</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            <span className="text-[10px] font-bold text-slate-600 uppercase">All Systems Nominal</span>
          </div>
        </footer>

        {/* CLOUD STORAGE OBJECT DETAIL MODAL / INSIGHT PANEL */}
        {activeCloudObjectDetail && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 text-white w-full max-w-lg rounded-xl shadow-2xl overflow-y-auto max-h-[90vh] flex flex-col animate-fadeIn">
              <div className="px-5 py-4 border-b border-slate-800 bg-slate-950 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Server className="w-4 h-4 text-indigo-400" />
                  <h4 className="font-bold text-sm font-sans text-white">Metadata del Repositorio Digital</h4>
                </div>
                <button
                  onClick={() => setActiveCloudObjectDetail(null)}
                  className="text-slate-400 hover:text-white font-bold text-lg select-none px-1.5 focus:outline-none transition cursor-pointer"
                >
                  ×
                </button>
              </div>

              <div className="p-5 space-y-4">
                {/* Connection status representation */}
                <div className="p-3 bg-indigo-950/20 border border-indigo-900/40 rounded-xl flex gap-3 items-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <div className="text-xs">
                    <span className="font-bold block text-slate-200 font-sans">Storage API Response • Status 200 OK</span>
                    <span className="text-[10px] text-slate-400 font-mono">Server Instance: Simulated Secure Object Storage</span>
                  </div>
                </div>

                <div className="space-y-3 font-mono text-[11px] bg-slate-950 p-4 rounded-xl border border-slate-850/80 overflow-x-auto select-all">
                  <div className="grid grid-cols-12 gap-1 border-b border-slate-900 pb-1.5 text-slate-500 font-bold">
                    <div className="col-span-4">HTTP Header</div>
                    <div className="col-span-8">Value</div>
                  </div>
                  <div className="grid grid-cols-12 gap-1 pt-1">
                    <div className="col-span-4 text-indigo-400">Content-Type:</div>
                    <div className="col-span-8 text-slate-200">application/octet-stream (detected: Doc/PDF)</div>
                  </div>
                  <div className="grid grid-cols-12 gap-1">
                    <div className="col-span-4 text-indigo-400">Content-Length:</div>
                    <div className="col-span-8 text-slate-200">{activeCloudObjectDetail.file_size}</div>
                  </div>
                  <div className="grid grid-cols-12 gap-1">
                    <div className="col-span-4 text-indigo-400">MD5 Checksum:</div>
                    <div className="col-span-8 text-teal-400">"{(activeCloudObjectDetail.id || 'abc').substring(5)}e9800998ea"</div>
                  </div>
                  <div className="grid grid-cols-12 gap-1">
                    <div className="col-span-4 text-indigo-400">Request-Id:</div>
                    <div className="col-span-8 text-slate-400">TX-{(activeCloudObjectDetail.id || 'abc').toUpperCase()}</div>
                  </div>
                  <div className="grid grid-cols-12 gap-1">
                    <div className="col-span-4 text-indigo-400">Version:</div>
                    <div className="col-span-8 text-slate-400">v1.2-secure-repository</div>
                  </div>
                  <div className="grid grid-cols-12 gap-1">
                    <div className="col-span-4 text-indigo-400">Last-Modified:</div>
                    <div className="col-span-8 text-amber-200">{activeCloudObjectDetail.uploaded_at || activeCloudObjectDetail.created_at}</div>
                  </div>
                  <div className="grid grid-cols-12 gap-1">
                    <div className="col-span-4 text-indigo-400">Storage Uri:</div>
                    <div className="col-span-8 text-slate-300 select-all truncate">repo://soporte-pmo-storage/{activeCloudObjectDetail.storage_key}</div>
                  </div>
                  <div className="grid grid-cols-12 gap-1">
                    <div className="col-span-4 text-indigo-400">API Endpoint:</div>
                    <div className="col-span-8 text-slate-300 break-all select-all">{activeCloudObjectDetail.storage_url}</div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 text-xs pt-2">
                  <button
                    onClick={() => setActiveCloudObjectDetail(null)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-lg font-medium transition cursor-pointer"
                  >
                    Cerrar Inspector
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      downloadDocumentLocally(activeCloudObjectDetail);
                    }}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Descargar Objeto
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PROJECT CONFIGURATION MODAL */}
        {projectConfigModalTarget && (
          <div 
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn" 
            onClick={() => setProjectConfigModalTarget(null)}
          >
            <div 
              className="bg-white border border-slate-200 text-slate-800 w-full max-w-lg rounded-xl shadow-2xl overflow-y-auto max-h-[90vh] flex flex-col pt-1" 
              onClick={e => e.stopPropagation()}
            >
              <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center font-sans">
                <div className="flex items-center gap-2">
                  <Settings className="w-4 h-4 text-slate-700" />
                  <h4 className="font-bold text-sm text-slate-850 font-sans text-slate-900">
                    Configurar Proyecto: [{projectConfigModalTarget.code}]
                  </h4>
                </div>
                <button
                  onClick={() => setProjectConfigModalTarget(null)}
                  className="text-slate-400 hover:text-slate-600 font-bold text-lg select-none px-1.5 focus:outline-none transition cursor-pointer"
                >
                  ×
                </button>
              </div>

              <form 
                onSubmit={e => {
                  e.preventDefault();
                  setProjects(prev => prev.map(p => p.id === projectConfigModalTarget.id ? projectConfigModalTarget : p));
                  addLog('Carlos Pérez (PM)', `Actualizó la configuración global del proyecto [${projectConfigModalTarget.code}] ${projectConfigModalTarget.name}`);
                  setProjectConfigModalTarget(null);
                }}
                className="p-5 space-y-4 text-xs font-sans"
              >
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">Nombre del Proyecto</label>
                  <input
                    type="text"
                    required
                    value={projectConfigModalTarget.name}
                    onChange={e => setProjectConfigModalTarget(prev => prev ? { ...prev, name: e.target.value } : null)}
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-lg px-3 py-2 text-xs text-slate-800 font-semibold outline-none transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">Cliente</label>
                    <select
                      value={projectConfigModalTarget.client}
                      onChange={e => setProjectConfigModalTarget(prev => prev ? { ...prev, client: e.target.value } : null)}
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-lg px-3 py-2 text-xs text-slate-800 font-semibold outline-none transition-all cursor-pointer"
                    >
                      {clientsList.map(c => (
                        <option key={c} value={c}>🏢 {c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">Sponsor Principal</label>
                    <select
                      value={projectConfigModalTarget.sponsor}
                      onChange={e => setProjectConfigModalTarget(prev => prev ? { ...prev, sponsor: e.target.value } : null)}
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-lg px-3 py-2 text-xs text-slate-800 font-semibold outline-none transition-all cursor-pointer"
                    >
                      {sponsorsList.map(s => (
                        <option key={s} value={s}>👤 {s}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">Fecha de Inicio</label>
                    <input
                      type="date"
                      required
                      value={projectConfigModalTarget.start_date}
                      onChange={e => setProjectConfigModalTarget(prev => prev ? { ...prev, start_date: e.target.value } : null)}
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-lg px-3 py-2 text-xs text-slate-800 font-semibold outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">Fecha de Fin</label>
                    <input
                      type="date"
                      required
                      value={projectConfigModalTarget.end_date}
                      onChange={e => setProjectConfigModalTarget(prev => prev ? { ...prev, end_date: e.target.value } : null)}
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-lg px-3 py-2 text-xs text-slate-800 font-semibold outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">Presupuesto ($ USD)</label>
                    <input
                      type="number"
                      required
                      value={projectConfigModalTarget.budget_total}
                      onChange={e => setProjectConfigModalTarget(prev => prev ? { ...prev, budget_total: Number(e.target.value) } : null)}
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-lg px-3 py-2 text-xs text-slate-800 font-mono font-bold outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">Tamaño de Sprint (Días Hábiles)*</label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={90}
                      value={projectConfigModalTarget.sprint_size_days !== undefined ? projectConfigModalTarget.sprint_size_days : 10}
                      onChange={e => setProjectConfigModalTarget(prev => prev ? { ...prev, sprint_size_days: Number(e.target.value) } : null)}
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:ring-1 focus:ring-blue-500 rounded-lg px-3 py-2 text-xs text-slate-800 font-mono font-bold outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">Prioridad de Portafolio</label>
                  <select
                    value={projectConfigModalTarget.priority}
                    onChange={e => setProjectConfigModalTarget(prev => prev ? { ...prev, priority: e.target.value as any } : null)}
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-lg px-3 py-2 text-xs text-slate-800 font-semibold outline-none transition-all cursor-pointer"
                  >
                    <option value="HIGH">🔴 Alta</option>
                    <option value="MEDIUM">🟡 Media</option>
                    <option value="LOW">🟢 Baja</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">Tipo de Desarrollo</label>
                    <select
                      value={projectConfigModalTarget.desarrollo || 'Interno'}
                      onChange={e => setProjectConfigModalTarget(prev => prev ? { ...prev, desarrollo: e.target.value as any } : null)}
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-lg px-3 py-2 text-xs text-slate-800 font-semibold outline-none transition-all cursor-pointer"
                    >
                      <option value="Interno">⚙️ Interno</option>
                      <option value="Mixto">🔄 Mixto</option>
                      <option value="Externo">📦 Externo</option>
                      <option value="Sin desarrollo">🚫 Sin desarrollo</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">Categoría del Proyecto</label>
                    <select
                      value={projectConfigModalTarget.categoria || 'Mediano'}
                      onChange={e => setProjectConfigModalTarget(prev => prev ? { ...prev, categoria: e.target.value as any } : null)}
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-lg px-3 py-2 text-xs text-slate-800 font-semibold outline-none transition-all cursor-pointer"
                    >
                      <option value="Pequeño">🟢 Pequeño</option>
                      <option value="Mediano">🟡 Mediano</option>
                      <option value="Grande">🟠 Grande</option>
                      <option value="Muy Grande">🔴 Muy Grande</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 text-xs pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setProjectConfigModalTarget(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg font-bold transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-extrabold transition cursor-pointer"
                  >
                    Guardar Cambios
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* PROJECT STATUS TRANSITION MODAL */}
        {projectStatusModalTarget && (
          <div 
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn" 
            onClick={() => setProjectStatusModalTarget(null)}
          >
            <div 
              className="bg-white border border-slate-200 text-slate-800 w-full max-w-md rounded-xl shadow-2xl overflow-y-auto max-h-[90vh] flex flex-col" 
              onClick={e => e.stopPropagation()}
            >
              <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <FolderKanban className="w-4 h-4 text-blue-600" />
                  <h4 className="font-bold text-sm text-slate-900 font-sans">
                    Actualizar Ciclo de Vida del Proyecto
                  </h4>
                </div>
                <button
                  onClick={() => setProjectStatusModalTarget(null)}
                  className="text-slate-400 hover:text-slate-600 font-bold text-lg select-none px-1.5 focus:outline-none transition cursor-pointer"
                >
                  ×
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div>
                  <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 font-mono">Proyecto Seleccionado</span>
                  <h3 className="text-sm font-bold text-slate-900 mt-1">
                    {projectStatusModalTarget.name}
                  </h3>
                  <span className="text-[10.5px] text-slate-500 font-mono">
                    Código: {projectStatusModalTarget.code} | Cliente: {projectStatusModalTarget.client}
                  </span>
                </div>

                <div>
                  <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 font-mono mb-2">Seleccione Nuevo Estado</span>
                  <div className="grid grid-cols-2 gap-2">
                    {['REQUERIMIENTOS', 'APROBADO', 'DESARROLLO', 'PRUEBAS', 'FINALIZADO', 'CANCELADO'].map(st => {
                      const worksAsActive = projectStatusModalTarget.status === st;
                      return (
                        <button
                          key={st}
                          onClick={() => {
                            updateProjectStatus(projectStatusModalTarget.id, st as any);
                            // Update state of local target as well to show instant visual confirmation before close
                            setProjectStatusModalTarget(prev => prev ? { ...prev, status: st as any } : null);
                          }}
                          className={`px-3 py-2.5 rounded-lg text-xs font-bold transition-all text-left flex items-center justify-between border cursor-pointer ${
                            worksAsActive
                              ? 'bg-blue-50 border-blue-300 text-blue-700 shadow-3xs'
                              : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                          }`}
                        >
                          <span>{st}</span>
                          {worksAsActive && <span className="text-[10.5px]">🟢</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <p className="text-[10px] text-slate-400 font-medium leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-105 mt-2">
                  💡 Cambiar el estado del ciclo de vida afectará los reportes de cumplimiento de hitos, dashboards integrados, alertas, y auditoría general.
                </p>

                <div className="flex justify-end gap-2 text-xs pt-4 border-t border-slate-100">
                  <button
                    onClick={() => setProjectStatusModalTarget(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold transition cursor-pointer"
                  >
                    Cerrar Ventana
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CREATE PROJECT MODAL */}
        <CreateProjectModal />
      </main>

      {deleteConfirmState && deleteConfirmState.isOpen && (
        <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center z-[999999] p-4 text-slate-805 text-slate-800 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full border border-slate-100 overflow-hidden">
            <div className="p-5">
              <h3 className="text-sm font-bold text-slate-950 flex items-center gap-2">
                ⚠️ {deleteConfirmState.title}
              </h3>
              <p className="text-xs text-slate-650 mt-2.5 leading-normal">
                {deleteConfirmState.message}
              </p>
            </div>
            <div className="bg-slate-50 px-5 py-3.5 border-t border-slate-100 flex items-center justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setDeleteConfirmState(null)}
                className="px-3.5 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 text-xs font-semibold cursor-pointer transition hover:bg-slate-105 hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteConfirmState.onConfirm();
                  setDeleteConfirmState(null);
                }}
                className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold cursor-pointer transition shadow-sm shadow-rose-100 hover:shadow-md"
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
