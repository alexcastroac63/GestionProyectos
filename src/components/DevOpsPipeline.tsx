/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Terminal, Cpu, Play, CheckCircle2, AlertCircle, RefreshCw, Layers,
  Server, Database, Shield, Download, FileText, Check, Trash2, Folder, 
  ExternalLink, Info, Code, Eye, HelpCircle, HardDrive, Lock
} from 'lucide-react';

interface PipelineLogStep {
  name: string;
  command: string;
  duration: number;
  status: 'IDLE' | 'RUNNING' | 'SUCCESS' | 'FAILED';
  outputs: string[];
}

interface StorageObject {
  id: string;
  key: string;
  name: string;
  size: string;
  url: string;
  costId?: string;
  uploadedAt: string;
  type: string;
}

const INITIAL_STORAGE_MOCKS: StorageObject[] = [
  {
    id: 'storage-mock-1',
    key: 'uploads/recursos_arquitectura.png',
    name: 'recursos_arquitectura.png',
    size: '1.2 MB',
    url: 'http://localhost:9000/soporte-pmo-storage/uploads/recursos_arquitectura.png',
    uploadedAt: '2026-05-27 14:15',
    type: 'image/png'
  },
  {
    id: 'storage-mock-2',
    key: 'uploads/roadmap_pmo_v2.pdf',
    name: 'roadmap_pmo_v2.pdf',
    size: '4.8 MB',
    url: 'http://localhost:9000/soporte-pmo-storage/uploads/roadmap_pmo_v2.pdf',
    uploadedAt: '2026-05-27 16:30',
    type: 'application/pdf'
  },
  {
    id: 'storage-mock-3',
    key: 'uploads/esquema_db_postgres.sql',
    name: 'esquema_db_postgres.sql',
    size: '22 KB',
    url: 'http://localhost:9000/soporte-pmo-storage/uploads/esquema_db_postgres.sql',
    uploadedAt: '2026-05-28 09:12',
    type: 'text/x-sql'
  }
];

export default function DevOpsPipeline() {
  const [running, setRunning] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(-1);
  const [activeTab, setActiveTab] = useState<'cicd' | 'docker' | 'storage'>('cicd');
  
  // Storage Interactive Console States
  const [storageObjects, setStorageObjects] = useState<StorageObject[]>([]);
  const [selectedObject, setSelectedObject] = useState<StorageObject | null>(INITIAL_STORAGE_MOCKS[1]); // Default select PDF
  const [storageUploadName, setStorageUploadName] = useState('');
  const [storageUploadSize, setStorageUploadSize] = useState('256 KB');
  const [selectedAwsCodeTab, setSelectedAwsCodeTab] = useState<'nodejs' | 'terraform' | 'docker'>('nodejs');
  const [notification, setNotification] = useState<string | null>(null);

  const [steps, setSteps] = useState<PipelineLogStep[]>([
    {
      name: 'Checkout Código Fuente',
      command: 'uses: actions/checkout@v4',
      duration: 1200,
      status: 'IDLE',
      outputs: [
        'Syncing repository with Git...',
        'Checked out commit aef783b (feat: add postgresql DDL tables)',
        'Initializing workspace directories'
      ]
    },
    {
      name: 'Configurar PNPM Engine',
      command: 'uses: pnpm/action-setup@v4 { version: 9.15.0 }',
      duration: 1800,
      status: 'IDLE',
      outputs: [
        'Downloading and installing PNPM package manager...',
        'pnpm version locked to 9.15.0',
        'Restoring package cache directories successfully'
      ]
    },
    {
      name: 'Instalar Workspace Node_Modules',
      command: 'pnpm install --frozen-lockfile',
      duration: 2500,
      status: 'IDLE',
      outputs: [
        'Locked dependencies tree validation',
        'Installing packages for @devhub/api, @devhub/web and UI packages',
        'Resolved 482 packages, fully populated in 2.3s'
      ]
    },
    {
      name: 'Prisma Client Schema Generation',
      command: 'pnpm --filter @devhub/api prisma:generate',
      duration: 1500,
      status: 'IDLE',
      outputs: [
        'Schema validation completed for PostgreSQL database model',
        'Parsed 14 entities (organizations, users, roles, projects, backlogs, test_runs...)',
        'Prisma client client-side engines written into disk'
      ]
    },
    {
      name: 'Compilar Servidor NestJS API',
      command: 'pnpm --filter @devhub/api build',
      duration: 2200,
      status: 'IDLE',
      outputs: [
        'Running TypeScript compiler target ES2022',
        'Resolving microservices routing modules...',
        'Build artifacts generated in apps/api/dist (esbuild bundle compliant)'
      ]
    },
    {
      name: 'Compilar Aplicación Web NextJS/Vite UI',
      command: 'pnpm --filter @devhub/web build',
      duration: 2800,
      status: 'IDLE',
      outputs: [
        'Compiling TSX pages under Web environment',
        'Bundling index.html and multi-tab modular layouts',
        'Static distribution directory successfully created: /apps/web/dist'
      ]
    },
    {
      name: 'Construir Contenedores Docker Compose',
      command: 'docker compose build --parallel',
      duration: 3200,
      status: 'IDLE',
      outputs: [
        'Docker compose caching structures validated',
        'Building image for api-gateway (nginx reverse proxy)',
        'Building image for local secure storage simulation (Storage Client)',
        'Building multi-tenant postgres image volume',
        'Successfully generated developer images and ready for execution!'
      ]
    }
  ]);

  const dockerServices = [
    { name: 'postgres', port: 5432, role: 'PostgreSQL 16 Database host', status: 'ACTIVE' },
    { name: 'api-gateway', port: 4000, role: 'Nginx gateway router /api/*', status: 'ACTIVE' },
    { name: 'storage-simulator', port: 9000, role: 'Secure Object Storage API (Consola Web: 9001)', status: 'ACTIVE' },
    { name: 'storage-provisioner', port: 0, role: 'Storage Client Bucket Setup Script', status: 'COMPLETED' },
    { name: 'api-teams', port: 4106, role: 'Authentication & Teams microservice', status: 'ACTIVE' },
    { name: 'api-dashboard', port: 4101, role: 'KPIs, Reports & settings', status: 'ACTIVE' },
    { name: 'api-projects', port: 4102, role: 'Projects & Gantt manager', status: 'ACTIVE' },
    { name: 'api-scrum-board', port: 4103, role: 'Backlogs, Sprints & boards', status: 'ACTIVE' },
    { name: 'api-qa', port: 4104, role: 'Suites, cases and QA test traces', status: 'ACTIVE' },
    { name: 'ui', port: 3000, role: 'Main React Web UI Container', status: 'ACTIVE' }
  ];

  // Load objects uploaded inside support documents
  const loadStorageObjects = () => {
    // 1. Costs with files
    const local = localStorage.getItem('gcp_costs');
    const costFiles = local ? JSON.parse(local) : [];
    const attached: StorageObject[] = costFiles
      .filter((c: any) => c.storage_key)
      .map((c: any) => {
        const fileExt = c.file_name?.split('.').pop() || 'pdf';
        let mime = 'application/pdf';
        if (['png', 'jpg', 'jpeg'].includes(fileExt)) mime = 'image/png';
        if (['zip', 'rar'].includes(fileExt)) mime = 'application/zip';
        
        return {
          id: c.id,
          key: c.storage_key,
          name: c.file_name || c.description + '.pdf',
          size: c.file_size || '256 KB',
          url: c.storage_url || `http://localhost:9000/soporte-pmo-storage/${c.storage_key}`,
          costId: c.id,
          uploadedAt: c.uploaded_at || c.created_at || '2026-05-28',
          type: mime
        };
      });

    // 2. Custom files uploaded here directly
    const customLocal = localStorage.getItem('gcp_storage_custom_files');
    const custom: StorageObject[] = customLocal ? JSON.parse(customLocal) : [];

    setStorageObjects([...INITIAL_STORAGE_MOCKS, ...attached, ...custom]);
  };

  useEffect(() => {
    loadStorageObjects();
    // Watch for localstorage updates dynamically
    const interval = setInterval(loadStorageObjects, 2500);
    return () => clearInterval(interval);
  }, []);

  const startPipeline = () => {
    if (running) return;
    setRunning(true);
    setCurrentStepIndex(0);

    // Reset steps
    setSteps(prev => prev.map(s => ({ ...s, status: 'IDLE' })));
  };

  useEffect(() => {
    if (!running) return;
    if (currentStepIndex < 0 || currentStepIndex >= steps.length) {
      setRunning(false);
      setCurrentStepIndex(-1);
      return;
    }

    // Set active step to RUNNING
    setSteps(prev => prev.map((s, idx) => {
      if (idx === currentStepIndex) return { ...s, status: 'RUNNING' };
      return s;
    }));

    const activeStep = steps[currentStepIndex];
    const timer = setTimeout(() => {
      // Complete step
      setSteps(prev => prev.map((s, idx) => {
        if (idx === currentStepIndex) return { ...s, status: 'SUCCESS' };
        return s;
      }));
      // Move next
      setCurrentStepIndex(currentStepIndex + 1);
    }, activeStep.duration);

    return () => clearTimeout(timer);
  }, [running, currentStepIndex]);

  // Handle direct custom simulation uploads
  const handleDirectStorageUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!storageUploadName) return;

    let cleanName = storageUploadName.trim();
    if (!cleanName.includes('.')) cleanName += '.pdf';

    const fileExt = cleanName.split('.').pop() || 'pdf';
    let mime = 'application/pdf';
    if (['png', 'jpg', 'jpeg'].includes(fileExt.toLowerCase())) mime = 'image/png';
    else if (['json', 'txt', 'sql'].includes(fileExt.toLowerCase())) mime = 'text/plain';
    else if (['zip', 'rar'].includes(fileExt.toLowerCase())) mime = 'application/zip';

    const cleanKey = `uploads/${cleanName}`;
    const newObj: StorageObject = {
      id: `custom-storage-${Date.now()}`,
      key: cleanKey,
      name: cleanName,
      size: storageUploadSize,
      url: `http://localhost:9000/soporte-pmo-storage/${cleanKey}`,
      uploadedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      type: mime
    };

    const customLocal = localStorage.getItem('gcp_storage_custom_files');
    const custom = customLocal ? JSON.parse(customLocal) : [];
    const updated = [...custom, newObj];
    localStorage.setItem('gcp_storage_custom_files', JSON.stringify(updated));

    setStorageUploadName('');
    showToast(`✓ Archivo '${cleanName}' subido al Repositorio (soporte-pmo-storage)`);
    loadStorageObjects();
    setSelectedObject(newObj);
  };

  const handleDeleteStorageObject = (id: string, name: string) => {
    // If it is a custom file
    const customLocal = localStorage.getItem('gcp_storage_custom_files');
    let custom = customLocal ? JSON.parse(customLocal) : [];
    
    if (custom.some((o: any) => o.id === id)) {
      custom = custom.filter((o: any) => o.id !== id);
      localStorage.setItem('gcp_storage_custom_files', JSON.stringify(custom));
      showToast(`✗ Archivo '${name}' eliminado del Repositorio de Almacenamiento`);
    } else {
      // If it comes from costs, warn that they must delete it from standard receipts
      showToast(`¡Aviso! '${name}' está vinculado a un documento de soporte. Anúlalo en la pestaña "Presupuesto y Gastos".`);
    }
    loadStorageObjects();
    if (selectedObject?.id === id) {
      setSelectedObject(INITIAL_STORAGE_MOCKS[1]);
    }
  };

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  // Safe ETag calculator
  const getSimulatedETag = (name: string) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = (hash << 5) - hash + name.charCodeAt(i);
      hash |= 0;
    }
    return `"${Math.abs(hash).toString(16)}09825b4bc7038e1e"` ;
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden" id="devops-root">
      {notification && (
        <div className="bg-slate-900 border-b border-indigo-500/30 text-white text-[11px] px-6 py-2.5 flex items-center justify-between font-medium">
          <span className="flex items-center gap-2 font-mono">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
            {notification}
          </span>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-white transition font-mono">×</button>
        </div>
      )}

      {/* DevOps Header */}
      <div className="p-6 border-b border-slate-100 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h3 className="font-semibold text-slate-900 text-lg flex items-center gap-2">
            <Cpu className="w-5 h-5 text-indigo-600" />
            Consola DevOps & Storage Clientes
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Gobernabilidad de micro-servicios Docker, pipelines de despliegue GitHub Actions, y simulación de repositorios de almacenamiento local.
          </p>
        </div>

        <div className="flex gap-2 shrink-0">
          {/* Toggle Tab */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/60">
            <button
               onClick={() => setActiveTab('cicd')}
               className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                 activeTab === 'cicd' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
               }`}
            >
              GitHub CI/CD Runner
            </button>
            <button
               onClick={() => setActiveTab('docker')}
               className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                 activeTab === 'docker' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
               }`}
            >
              Servicios Docker Stack
            </button>
            <button
               onClick={() => setActiveTab('storage')}
               className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                 activeTab === 'storage' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
               }`}
            >
              <Server className="w-3.5 h-3.5" />
              Repositorio Secure Local
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'cicd' && (
        <div className="grid grid-cols-1 md:grid-cols-5 divide-y md:divide-y-0 md:divide-x divide-slate-100 animate-fadeIn">
          {/* Steps Left Panel */}
          <div className="md:col-span-2 p-6 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Flujo de Compilación</span>
              <button
                onClick={startPipeline}
                disabled={running}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:opacity-50 text-white font-medium text-xs px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition shadow-sm cursor-pointer"
              >
                <Play className="w-3.5 h-3.5" />
                {running ? 'Ejecutando...' : 'Lanzar Actions Runner'}
              </button>
            </div>

            <div className="space-y-3">
              {steps.map((step, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg border transition ${
                    step.status === 'RUNNING' ? 'border-amber-400 bg-amber-50/40 shadow-xs' :
                    step.status === 'SUCCESS' ? 'border-indigo-200 bg-indigo-50/20' : 'border-slate-150 bg-slate-50/50'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-semibold text-slate-800 block">{step.name}</span>
                    {step.status === 'RUNNING' && (
                      <span className="text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-mono font-bold uppercase animate-pulse">
                        EN CURSO
                      </span>
                    )}
                    {step.status === 'SUCCESS' && (
                      <span className="text-[9px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-mono font-bold uppercase">
                        ÉXITO
                      </span>
                    )}
                    {step.status === 'IDLE' && (
                      <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-mono font-bold uppercase">
                        EN COLA
                      </span>
                    )}
                  </div>
                  <code className="text-[10px] text-slate-500 font-mono block mt-1">{step.command}</code>
                </div>
              ))}
            </div>
          </div>

          {/* Terminal Outputs Right Panel */}
          <div className="md:col-span-3 p-6 bg-slate-950 text-slate-350 min-h-[400px] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-850 pb-3 mb-4 font-mono">
                <div className="flex items-center gap-2 font-mono">
                  <Terminal className="w-4 h-4 text-indigo-400" />
                  <span className="font-mono text-xs font-bold text-slate-200">Terminal de Logs Runner (stdout)</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">Job ID: hub-storage-actions-run-9</span>
              </div>

              {/* Console Code */}
              <div className="space-y-4 font-mono text-[11px] leading-relaxed max-h-96 overflow-y-auto">
                {steps.map((step, idx) => {
                  if (step.status === 'IDLE') return null;
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="text-slate-400 font-bold border-b border-slate-900 pb-0.5 flex gap-2 items-center">
                        {step.status === 'RUNNING' ? (
                          <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
                        )}
                        <span>$ {step.command} ({step.duration}ms)</span>
                      </div>
                      <div className="pl-3 space-y-0.5 text-slate-400 border-l border-slate-900">
                        {step.outputs.map((out, oIdx) => (
                          <div key={oIdx} className={step.status === 'RUNNING' && oIdx === step.outputs.length - 1 ? 'text-amber-300 animate-pulse' : ''}>
                            {out}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
                {steps.every(s => s.status === 'IDLE') && (
                  <p className="text-slate-500 italic text-[11px] py-12 text-center">Consola asíncrona inactiva. Haz clic en "Lanzar Actions Runner" para verificar la integración y construcción de servicios.</p>
                )}
              </div>
            </div>

            {/* Docker Deployment Status Hook */}
            <div className="mt-8 border-t border-slate-900 pt-3 flex justify-between items-center text-xs">
              <span className="text-slate-500 font-sans">Despliegue de microservicios con:</span>
              <span className="font-mono text-indigo-400 font-bold bg-indigo-950/40 px-3 py-1 rounded-md border border-indigo-900/30">
                ACTIVE MULTI-CONTAINER CLUSTER
              </span>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'docker' && (
        <div className="p-6 animate-fadeIn">
          <div className="mb-6 bg-slate-50 border border-slate-200/70 rounded-xl p-4 flex gap-3.5 items-start">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-slate-800 text-sm">Arquitectura Multi-Servicio de Contenedores Docker</h4>
              <p className="text-xs text-slate-500 mt-1">
                La solución desacopla la bases de datos relacionales, el gateway reverso Nginx, los micro-servicios internos de negocio y el servicio de almacenamiento compatible de S3 (MinIO). Todos los sub-servicios están orquestados via <code className="font-mono bg-slate-200 text-slate-800 px-1 rounded font-bold">docker-compose.yml</code> de forma nativa.
              </p>
            </div>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden mt-6">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Nombre Contenedor</th>
                  <th className="p-3.5">Puerto Interno</th>
                  <th className="p-3.5">Función de Orquestación</th>
                  <th className="p-3.5 text-right font-bold">Estado Docker Engine</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dockerServices.map((srv, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 transition">
                    <td className="p-3.5">
                      <div className="flex items-center gap-2">
                        <Terminal className="w-4 h-4 text-indigo-500 font-mono" />
                        <span className="font-mono font-bold text-slate-800">{srv.name}</span>
                      </div>
                    </td>
                    <td className="p-3.5 font-mono text-indigo-700 font-bold">{srv.port === 0 ? '-' : srv.port}</td>
                    <td className="p-3.5 text-slate-500">{srv.role}</td>
                    <td className="p-3.5 text-right">
                      {srv.status === 'COMPLETED' ? (
                        <span className="text-[10px] inline-flex items-center gap-1.5 bg-blue-50 text-blue-750 px-2 py-0.5 rounded-full font-bold uppercase">
                          COMPLETED
                        </span>
                      ) : (
                        <span className="text-[10px] inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full font-bold uppercase">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          RUNNING
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'storage' && (
        <div className="p-6 animate-fadeIn space-y-6">
          {/* Storage Quick Summary Statistics cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex gap-3.5 items-center">
              <div className="p-2.5 bg-indigo-50 rounded-lg text-indigo-600">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <span className="block text-[9px] font-extrabold uppercase text-slate-400 tracking-wider">Storage Endpoint</span>
                <span className="text-xs font-bold font-mono text-slate-800">http://localhost:9000</span>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex gap-3.5 items-center">
              <div className="p-2.5 bg-blue-50 rounded-lg text-blue-600">
                <Server className="w-4 h-4" />
              </div>
              <div>
                <span className="block text-[9px] font-extrabold uppercase text-slate-400 tracking-wider">Repositorio Inicial</span>
                <span className="text-xs font-bold font-mono text-slate-800">soporte-pmo-storage</span>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex gap-3.5 items-center">
              <div className="p-2.5 bg-indigo-50 rounded-lg text-indigo-600">
                <HardDrive className="w-4 h-4" />
              </div>
              <div>
                <span className="block text-[9px] font-extrabold uppercase text-slate-400 tracking-wider">Objetos Almacenados</span>
                <span className="text-xs font-bold font-mono text-slate-800">{storageObjects.length} Archivos</span>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex gap-3.5 items-center">
              <div className="p-2.5 bg-emerald-50 rounded-lg text-emerald-600">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <span className="block text-[9px] font-extrabold uppercase text-slate-400 tracking-wider">Políticas de Repositorio (ACL)</span>
                <span className="text-xs font-bold font-mono text-slate-850 font-sans">public-read-write</span>
              </div>
            </div>
          </div>

          {/* Storage Panel Grid Split Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left: Storage details and list of Directories */}
            <div className="lg:col-span-4 bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
              <div>
                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest block font-sans">Credenciales de Acceso Almacenamiento</span>
                <p className="text-[9.5px] text-slate-450 mt-0.5">Utilizadas para configurar localmente el Storage Client SDK.</p>
              </div>

              <div className="space-y-2.5 bg-white border border-slate-150 p-3 rounded-lg text-xs font-mono">
                <div>
                   <span className="block text-[8.5px] font-bold text-slate-400 uppercase">STORAGE_KEY_ID:</span>
                   <span className="text-slate-800 font-bold">mock_storage_key_id</span>
                </div>
                <div>
                   <span className="block text-[8.5px] font-bold text-slate-400 uppercase">STORAGE_SECRET_KEY:</span>
                   <span className="text-slate-700">mock_storage_secret_key</span>
                </div>
                <div>
                   <span className="block text-[8.5px] font-bold text-slate-400 uppercase">DEFAULT_PROVIDER:</span>
                   <span className="text-slate-700">local-secure-provider</span>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-3">
                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block mb-2 font-sans">Directorios de Almacenamiento</span>
                <div className="space-y-1 text-xs">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-950 font-semibold cursor-pointer">
                    <span className="flex items-center gap-1.5 font-mono">
                      <Folder className="w-3.5 h-3.5 text-indigo-500 fill-indigo-200" />
                      soporte-pmo-storage
                    </span>
                    <span className="text-[9px] bg-indigo-150 bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full font-bold">ACTIVO</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg text-slate-500 hover:bg-slate-100/70 border border-transparent transition cursor-not-allowed">
                    <span className="flex items-center gap-1.5 font-mono">
                      <Folder className="w-3.5 h-3.5 text-slate-400 fill-slate-100" />
                      pmo-backup-database
                    </span>
                    <span className="text-[9px] bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded-full font-bold">SOLO_LECTURA</span>
                  </div>
                </div>
              </div>

              {/* Mini Upload Form targeting local simulation */}
              <form onSubmit={handleDirectStorageUpload} className="border-t border-slate-200 pt-4 space-y-3">
                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">Subir un objeto simulado</span>
                <p className="text-[10px] text-slate-400 leading-normal">
                  Inserta un archivo ficticio directamente en <code className="font-mono text-slate-600 bg-slate-200 px-1 py-0.2 rounded font-semibold text-[9.5px]">soporte-pmo-storage</code> para emular respuestas SDK del API.
                </p>

                <div className="space-y-2">
                  <input
                    type="text"
                    required
                    placeholder="Ej. backup_key.pem, index.html, schema.sql"
                    value={storageUploadName}
                    onChange={e => setStorageUploadName(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-850 font-mono"
                  />
                  
                  <select
                    value={storageUploadSize}
                    onChange={e => setStorageUploadSize(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-700 font-mono cursor-pointer"
                  >
                    <option value="128 KB">128 KB (Liviano)</option>
                    <option value="1.4 MB">1.4 MB (Documento PDF estándar)</option>
                    <option value="10.2 MB">10.2 MB (Dump Base de Datos)</option>
                    <option value="56 KB">56 KB (Llave pública RSA)</option>
                  </select>

                  <button
                    type="submit"
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-1.5 rounded-lg border-b-2 border-indigo-805 transition cursor-pointer"
                  >
                    Subir al Storage seguro
                  </button>
                </div>
              </form>
            </div>

            {/* Right: Buckets Table browser */}
            <div className="lg:col-span-8 flex flex-col justify-between space-y-4">
              
              <div className="bg-white border border-slate-205 rounded-xl border-slate-200 overflow-hidden">
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center flex-wrap gap-2">
                  <div className="flex items-center gap-1.5 text-xs text-slate-505 text-slate-500">
                    <span className="font-bold text-slate-700">Explorador de Objetos</span>
                    <span>/</span>
                    <span className="font-mono bg-slate-200/60 px-1.5 py-0.5 rounded font-bold text-slate-800">repo://soporte-pmo-storage/uploads/</span>
                  </div>
                  
                  <span className="text-[10px] text-indigo-600 font-mono font-bold bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded">
                    STORAGE PROVIDER: local-secure
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs table-fixed">
                    <thead className="bg-slate-50/55 text-[10px] font-bold text-slate-400 border-b border-slate-100 uppercase tracking-wider">
                      <tr>
                        <th className="p-3 pl-4 w-[45%]">Ruta del Key Objeto</th>
                        <th className="p-3 text-center w-[15%]">Tamaño</th>
                        <th className="p-3 text-center w-[20%]">F. Modificación</th>
                        <th className="p-3 text-center w-[20%]">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                      {storageObjects.map(obj => (
                        <tr 
                          key={obj.id} 
                          onClick={() => setSelectedObject(obj)}
                          className={`hover:bg-slate-50/80 transition cursor-pointer ${
                            selectedObject?.id === obj.id ? 'bg-indigo-50/30' : ''
                          }`}
                        >
                          <td className="p-3 pl-4 truncate">
                            <div className="flex items-center gap-2">
                              <FileText className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                              <span className="font-bold text-slate-800">{obj.name}</span>
                            </div>
                            <div className="text-[9px] text-slate-450 pl-5 truncate">{obj.key}</div>
                          </td>
                          <td className="p-3 text-center text-slate-600 font-bold">{obj.size}</td>
                          <td className="p-3 text-center text-slate-450">{obj.uploadedAt}</td>
                          <td className="p-3 text-center" onClick={e => e.stopPropagation()}>
                            <div className="flex justify-center items-center gap-2">
                              <a
                                href="#devops-root"
                                onClick={() => {
                                  showToast(`↓ Iniciando descarga simulada de '${obj.name}' desde Repositorio Almacenamiento Seguro`);
                                  // Open new mock tab
                                  window.open(obj.url, '_blank');
                                }}
                                className="p-1 bg-slate-100 rounded text-slate-500 hover:text-indigo-600 border border-slate-200 transition"
                                title="Descargar Objeto"
                              >
                                <Download className="w-3 h-3" />
                              </a>
                              <button
                                onClick={() => handleDeleteStorageObject(obj.id, obj.name)}
                                className="p-1 bg-slate-100 rounded text-slate-500 hover:text-red-500 hover:bg-red-50 border border-slate-200 transition cursor-pointer"
                                title="Eliminar Objeto"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {storageObjects.length === 0 && (
                        <tr>
                          <td colSpan={4} className="p-8 text-center text-slate-400 italic font-sans">
                            Ningún objeto cargado en repo://soporte-pmo-storage/
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Secure Storage File Inspector Details */}
              {selectedObject && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-white animate-fadeIn">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2 mb-3">
                    <span className="text-[10px] font-extrabold uppercase text-indigo-400 tracking-wider flex items-center gap-1.5 font-mono">
                      <Lock className="w-3 h-3" />
                      Response Object Storage API Inspector
                    </span>
                    <span className="text-[9.5px] font-mono text-slate-500 font-bold">Status Code: 200 OK</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[10px]">
                    <div className="space-y-1.5 font-mono">
                      <div>
                        <span className="text-slate-500">OBJECT KEY:</span>{' '}
                        <span className="text-indigo-300 break-all">{selectedObject.key}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">CONTENT-TYPE:</span>{' '}
                        <span className="text-slate-300">{selectedObject.type}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">CONTENT-LENGTH:</span>{' '}
                        <span className="text-slate-300">{selectedObject.size}</span>
                      </div>
                    </div>

                    <div className="space-y-1.5 font-mono text-left md:text-right">
                      <div>
                        <span className="text-slate-500">MD5SUM / HASH:</span>{' '}
                        <span className="text-teal-400">{getSimulatedETag(selectedObject.name)}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">HTTP ENDPOINT:</span>{' '}
                        <span className="text-slate-300 break-all">{selectedObject.url}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 font-sans">SOPORTE PMO ID:</span>{' '}
                        <span className="text-slate-400">{selectedObject.costId || 'DEV-MOCK-MANUAL'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Integration Recipes panel */}
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
            <div className="p-4 bg-slate-50 border-b border-slate-200">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wide block">Guías de Integración para Desarrolladores</span>
              <p className="text-[10px] text-slate-500 mt-0.5">Cómo conectar tu aplicación backend API al contenedor Docker de Almacenamiento Seguro</p>
            </div>

            <div className="flex border-b border-slate-200 bg-slate-50/50 text-[11px] font-bold">
              <button
                onClick={() => setSelectedAwsCodeTab('nodejs')}
                className={`px-4 py-2 border-r border-slate-200 ${
                  selectedAwsCodeTab === 'nodejs' ? 'bg-white text-indigo-650 font-bold' : 'text-slate-500 hover:text-slate-850'
                }`}
              >
                Secure Storage SDK (NodeJS / Nest)
              </button>
              <button
                onClick={() => setSelectedAwsCodeTab('terraform')}
                className={`px-4 py-2 border-r border-slate-200 ${
                  selectedAwsCodeTab === 'terraform' ? 'bg-white text-indigo-650' : 'text-slate-500 hover:text-slate-850'
                }`}
              >
                Terraform Prov
              </button>
              <button
                onClick={() => setSelectedAwsCodeTab('docker')}
                className={`px-4 py-2 border-r border-slate-200 ${
                  selectedAwsCodeTab === 'docker' ? 'bg-white text-indigo-650' : 'text-slate-500 hover:text-slate-850'
                }`}
              >
                Docker Compose CLI
              </button>
            </div>

            <div className="p-4 bg-slate-950 font-mono text-[11px] text-slate-350">
              {selectedAwsCodeTab === 'nodejs' && (
                <pre className="overflow-x-auto leading-relaxed">
{`import { StorageDriver } from "@google-cloud/storage";

// Configuración obligatoria para redirigir peticiones de almacenamiento al contenedor de simulación local
const storage = new StorageDriver({
  apiEndpoint: "http://localhost:9000",       // Puerto API de almacenamiento seguro en docker-compose
  projectId: "soporte-pmo-project",
  credentials: {
    client_email: "mock_storage_client_email", // Declarado en .env.example
    private_key: "mock_storage_private_key"
  }
});

export async function uploadSupportDoc(fileBuffer: Buffer, fileName: string) {
  const bucket = storage.bucket("soporte-pmo-storage");
  const blob = bucket.file(\`uploads/\${Date.now()}_\${fileName}\`);
  
  await blob.save(fileBuffer, {
    metadata: { contentType: "application/pdf" },
    resumable: false
  });
  
  return blob.publicUrl();
}`}
                </pre>
              )}

              {selectedAwsCodeTab === 'terraform' && (
                <pre className="overflow-x-auto leading-relaxed">
{`# Declaracion de Infraestructura en código para crear el Bucket usando provider genérico local
provider "google" {
  project     = "soporte-pmo-project"
  region      = "us-central1"
  credentials = "mock_storage_credentials_json"
}

resource "google_storage_bucket" "soporte_pmo" {
  name          = "soporte-pmo-storage"
  location      = "US"
  force_destroy = true

  website {
    main_page_suffix = "index.html"
    not_found_page   = "404.html"
  }
}`}
                </pre>
              )}

              {selectedAwsCodeTab === 'docker' && (
                <pre className="overflow-x-auto leading-relaxed">
{`# 1. Ejecutar el cluster de servicios que contiene a Almacenamiento seguro Simulado (Inmediato)
docker-compose -f docker-compose.yml up -d storage-simulator storage-provisioner

# 2. Verificar carpetas creadas automáticamente usando la consola del Storage Client CLI
docker exec -it pmo_storage_provisioner mc ls local_storage/

# 3. Descargar un archivo directamente desde consola utilizando cURL
curl -O http://localhost:9000/soporte-pmo-storage/uploads/roadmap_pmo_v2.pdf`}
                </pre>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
