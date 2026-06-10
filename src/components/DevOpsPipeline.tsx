/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Terminal, Cpu, Play, CheckCircle2, AlertCircle, RefreshCw, Layers,
  Server, Database, Shield, Download, FileText, Check, Trash2, Folder, 
  ExternalLink, Info, Code, Eye, HelpCircle, HardDrive, Lock,
  Activity, Search, Plus, X, Users, Settings, StopCircle
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

export interface PortainerContainer {
  id: string;
  name: string;
  image: string;
  status: 'running' | 'stopped' | 'paused';
  cpu: number;
  memory: string;
  ip: string;
  ports: string;
  role: string;
  created: string;
}

const INITIAL_PORTAINER_CONTAINERS: PortainerContainer[] = [
  { id: 'c-postgres', name: 'pmo-postgres-1', image: 'postgres:16.3-alpine', status: 'running', cpu: 1.2, memory: '48.2 MB / 8.0 GB', ip: '172.24.0.2', ports: '5432:5432/tcp', role: 'Base de Datos Relacional PostgreSQL del Proyecto', created: '2026-06-01 08:31:12' },
  { id: 'c-gateway', name: 'pmo-nginx-gateway', image: 'nginx:1.26-alpine', status: 'running', cpu: 0.5, memory: '12.4 MB / 8.0 GB', ip: '172.24.0.3', ports: '4000:4000/tcp', role: 'Proxy Reverso & API Gateway Router de Microservicios', created: '2026-06-01 08:31:15' },
  { id: 'c-storage', name: 'pmo-storage-simulator', image: 'minio/minio:RELEASE', status: 'running', cpu: 0.8, memory: '64.1 MB / 8.0 GB', ip: '172.24.0.4', ports: '9000:9000/tcp', role: 'Servidor S3 Compatible para Soportes de Costos', created: '2026-06-01 08:31:18' },
  { id: 'c-provisioner', name: 'pmo-storage-provisioner', image: 'minio/mc:latest', status: 'stopped', cpu: 0, memory: '0 MB / 8.0 GB', ip: '172.24.0.5', ports: '-', role: 'Script Auto-Productor de Bucket Soportes', created: '2026-06-01 08:31:21' },
  { id: 'c-teams', name: 'pmo-api-teams', image: 'node:20.14-alpine', status: 'running', cpu: 2.1, memory: '185.0 MB / 8.0 GB', ip: '172.24.0.6', ports: '4106:4106/tcp', role: 'Microservicio de Autenticación & Estructura de Equipos', created: '2026-06-01 08:31:24' },
  { id: 'c-dashboard', name: 'pmo-api-dashboard', image: 'node:20.14-alpine', status: 'running', cpu: 1.7, memory: '210.5 MB / 8.0 GB', ip: '172.24.0.7', ports: '4101:4101/tcp', role: 'Microservicio de Control Financiero & OKRs', created: '2026-06-01 08:31:26' },
  { id: 'c-projects', name: 'pmo-api-projects', image: 'node:20.14-alpine', status: 'running', cpu: 1.1, memory: '192.4 MB / 8.0 GB', ip: '172.24.0.8', ports: '4102:4102/tcp', role: 'Microservicio de Planificación de Proyectos & Gantt', created: '2026-06-01 08:31:28' },
  { id: 'c-scrum', name: 'pmo-api-scrum', image: 'node:20.14-alpine', status: 'running', cpu: 1.4, memory: '178.9 MB / 8.0 GB', ip: '172.24.0.9', ports: '4103:4103/tcp', role: 'Microservicio De Tableros Scrum & Sprints', created: '2026-06-01 08:31:30' },
  { id: 'c-qa', name: 'pmo-api-qa', image: 'node:20.14-alpine', status: 'running', cpu: 0.9, memory: '115.6 MB / 8.0 GB', ip: '172.24.0.10', ports: '4104:4104/tcp', role: 'Microservicio De Auditoría, QA & Traza De Certificaciones', created: '2026-06-01 08:31:32' },
  { id: 'c-ui', name: 'pmo-web-ui', image: 'node:20-alpine', status: 'running', cpu: 0.3, memory: '52.7 MB / 8.0 GB', ip: '172.24.0.11', ports: '3000:3000/tcp', role: 'Contenedor UI Principal Web en Puerto Externo 3000', created: '2026-06-01 08:31:35' }
];

export default function DevOpsPipeline() {
  const [running, setRunning] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(-1);
  const [activeTab, setActiveTab] = useState<'cicd' | 'docker' | 'storage'>('cicd');

  // Portainer IO States
  const [portainerNavTab, setPortainerNavTab] = useState<'dashboard' | 'containers' | 'images' | 'volumes' | 'networks'>('dashboard');
  const [portainerContainers, setPortainerContainers] = useState<PortainerContainer[]>(INITIAL_PORTAINER_CONTAINERS);
  const [selectedContainerLogs, setSelectedContainerLogs] = useState<PortainerContainer | null>(null);
  const [portainerLogs, setPortainerLogs] = useState<string[]>([]);
  const [portainerSearchQuery, setPortainerSearchQuery] = useState('');
  const [showDeployModal, setShowDeployModal] = useState(false);
  const [deployName, setDeployName] = useState('');
  const [deployImage, setDeployImage] = useState('');
  const [deployPort, setDeployPort] = useState('');
  const [deployRole, setDeployRole] = useState('');
  const [portainerAlert, setPortainerAlert] = useState<string | null>(null);
  
  // Storage Interactive Console States
  const [storageObjects, setStorageObjects] = useState<StorageObject[]>([]);
  const [selectedObject, setSelectedObject] = useState<StorageObject | null>(INITIAL_STORAGE_MOCKS[1]); // Default select PDF
  const [storageUploadName, setStorageUploadName] = useState('');
  const [storageUploadSize, setStorageUploadSize] = useState('256 KB');
  const [selectedAwsCodeTab, setSelectedAwsCodeTab] = useState<'nodejs' | 'terraform' | 'docker'>('nodejs');
  const [notification, setNotification] = useState<string | null>(null);

  // Custom dialog state to bypass iframe window.confirm blocks
  const [deleteConfirmState, setDeleteConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

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

  // Helper to trigger Portainer alerts
  const triggerPortainerAlert = (msg: string) => {
    setPortainerAlert(msg);
    setTimeout(() => {
      setPortainerAlert(prev => prev === msg ? null : prev);
    }, 3500);
  };

  // Generate simulated historical logs on command
  const getContainerHistoryLogs = (c: PortainerContainer): string[] => {
    const timestamp = () => new Date().toISOString().replace('T', ' ').substring(0, 19);
    const idHex = c.id.substring(c.id.length - 6);
    
    if (c.status !== 'running') {
      return [
        `[${timestamp()}] [system] Container ${c.name} is currently ${c.status.toUpperCase()}`,
        `[${timestamp()}] [system] Process terminated with exit code 0`,
        `[${timestamp()}] [system] Use the Portainer dashboard to start/restart this resource.`
      ];
    }

    if (c.name.includes('postgres')) {
      return [
        `[${timestamp()}] [postgres] database system is ready to accept connections on port 5432`,
        `[${timestamp()}] [postgres] server started / socket is listening on [::]:5432`,
        `[${timestamp()}] [postgres] database "dev_db" has been initialized with schema tables`,
        `[${timestamp()}] [postgres] client connected: index 1 - IP: 172.24.0.6 (pmo-api-teams)`,
        `[${timestamp()}] [postgres] LOG:  checkpoint starting: force database commit`,
        `[${timestamp()}] [postgres] LOG:  checkpoint complete: wrote 42 buffers (0.1%); backup enabled`,
        `[${timestamp()}] [postgres] client connected: index 2 - IP: 172.24.0.7 (pmo-api-dashboard)`,
        `[${timestamp()}] [postgres] LOG:  vacuum process running on public.project_costs... completed (0.01s)`
      ];
    } else if (c.name.includes('gateway')) {
      return [
        `[${timestamp()}] [nginx] starting nginx/1.26.2 gateway agent...`,
        `[${timestamp()}] [nginx] loading routing maps from /etc/nginx/conf.d/gateway.conf`,
        `[${timestamp()}] [nginx] 127.0.0.1 - - [PORT 3000] "GET /api/health HTTP/1.1" 200 48 "-" "cURL/7.81.0"`,
        `[${timestamp()}] [nginx] upstream routing: mapping "/api/teams" -> "http://172.24.0.6:4106"`,
        `[${timestamp()}] [nginx] upstream routing: mapping "/api/dashboard" -> "http://172.24.0.7:4101"`,
        `[${timestamp()}] [nginx] 172.24.0.1 - - "POST /api/costs/upload HTTP/1.1" 201 104 "http://localhost:3000/"`,
        `[${timestamp()}] [nginx] [warn] connection rate-limiting bypass enabled for debug subnet 172.24.0.0/16`
      ];
    } else if (c.name.includes('storage')) {
      return [
        `[${timestamp()}] [minio] MinIO Object Storage Simulator running on cluster`,
        `[${timestamp()}] [minio] API Endpoint: http://172.24.0.4:9000 (Local secure storage S3 client bound)`,
        `[${timestamp()}] [minio] Console UI available locally at: http://localhost:9001`,
        `[${timestamp()}] [minio] PUT /soporte-pmo-storage/uploads/roadmap_pmo_v2.pdf [Status: 200 OK] (Size: 4.8MB)`,
        `[${timestamp()}] [minio] GET /soporte-pmo-storage/uploads/roadmap_pmo_v2.pdf [Status: 200 OK] - fetched`,
        `[${timestamp()}] [minio] Authenticated request from accessKeyId: mock_storage_key_id (signature v4)`
      ];
    } else if (c.name.startsWith('pmo-api-')) {
      const svcName = c.name.replace('pmo-api-', '').toUpperCase();
      return [
        `[${timestamp()}] [${svcName}] NestJS microservice core framework v10.3 initialized`,
        `[${timestamp()}] [${svcName}] connected to PostgreSQL cluster: "postgres://pmo-postgres-1:5432/dev_db"`,
        `[${timestamp()}] [${svcName}] listening on internal port ${c.ports.split(':')[0]} [HTTP Engine active]`,
        `[${timestamp()}] [${svcName}] telemetry reporter mapped to Prometheus server on port 9100/metrics`,
        `[${timestamp()}] [${svcName}] HEARTBEAT: CPU: ${c.cpu}% | MEM: ${c.memory} | connection pool: 8 active`
      ];
    } else if (c.name.includes('web-ui')) {
      return [
        `[${timestamp()}] [vite] dev server running on host 0.0.0.0, binding external port 3000`,
        `[${timestamp()}] [vite] hot module replacement (HMR) turned OFF by control plane orchestration`,
        `[${timestamp()}] [vite] client asset pipeline compiled in 4.1s. All modules loaded successfully.`,
        `[${timestamp()}] [vite] GET /main.tsx - 200 OK - client fetched main SPA code`,
        `[${timestamp()}] [vite] GET /src/components/DevOpsPipeline.tsx - 200 OK (hot code updated)`
      ];
    } else {
      return [
        `[${timestamp()}] [custom-container] Container ${c.name} started successfully`,
        `[${timestamp()}] [custom-container] executing command specified by entrypoint image ${c.image}`,
        `[${timestamp()}] [custom-container] running daemon monitoring health checks...`,
        `[${timestamp()}] [custom-container] Log thread listening on tty stdio.`
      ];
    }
  };

  // Stop a container simulation
  const handleStopPortainerContainer = (id: string) => {
    setPortainerContainers(prev => prev.map(c => {
      if (c.id === id) {
        triggerPortainerAlert(`Contenedor '${c.name}' detenido con éxito (STOP SIGTERM)`);
        showToast(`Portainer.io: '${c.name}' detenido`);
        return { ...c, status: 'stopped', cpu: 0 };
      }
      return c;
    }));
  };

  // Start a container simulation
  const handleStartPortainerContainer = (id: string) => {
    setPortainerContainers(prev => prev.map(c => {
      if (c.id === id) {
        triggerPortainerAlert(`Contenedor '${c.name}' iniciado con éxito`);
        showToast(`Portainer.io: '${c.name}' iniciado`);
        return { ...c, status: 'running', cpu: 0.5 };
      }
      return c;
    }));
  };

  // Restart a container simulation
  const handleRestartPortainerContainer = (id: string) => {
    const randomCpu = Number((Math.random() * 2 + 0.5).toFixed(1));
    setPortainerContainers(prev => prev.map(c => {
      if (c.id === id) {
        triggerPortainerAlert(`Reiniciando contenedor '${c.name}' (RESTART SIGKILL/SIGSTART)`);
        showToast(`Portainer.io: Reiniciando '${c.name}'`);
        return { ...c, status: 'runner' as any, cpu: 0 }; // Temporary intermediate state
      }
      return c;
    }));

    setTimeout(() => {
      setPortainerContainers(prev => prev.map(c => {
        if (c.id === id || (c.id === id && c.status === 'runner' as any)) {
          return { ...c, status: 'running', cpu: randomCpu };
        }
        return c;
      }));
    }, 1200);
  };

  // Pause/Resume container simulation
  const handlePausePortainerContainer = (id: string) => {
    setPortainerContainers(prev => prev.map(c => {
      if (c.id === id) {
        if (c.status === 'paused') {
          triggerPortainerAlert(`Contenedor '${c.name}' reanudado`);
          return { ...c, status: 'running', cpu: 0.3 };
        } else {
          triggerPortainerAlert(`Contenedor '${c.name}' pausado`);
          return { ...c, status: 'paused', cpu: 0 };
        }
      }
      return c;
    }));
  };

  // Deploy custom container in Portainer simulation
  const handleDeployPortainerContainer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deployName || !deployImage) return;

    let cleanName = deployName.trim().replace(/\s+/g, '-').toLowerCase();
    if (!cleanName.startsWith('pmo-')) cleanName = 'pmo-' + cleanName;

    const newSvc: PortainerContainer = {
      id: `c-custom-${Date.now()}`,
      name: cleanName,
      image: deployImage.trim().toLowerCase(),
      status: 'running',
      cpu: 0.8,
      memory: '22.0 MB / 8.0 GB',
      ip: `172.24.0.${Math.floor(Math.random() * 80 + 20)}`,
      ports: deployPort ? `${deployPort}:${deployPort}/tcp` : '-',
      role: deployRole.trim() || 'Servicio Personalizado de Portainer IO',
      created: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };

    setPortainerContainers(prev => [...prev, newSvc]);
    setShowDeployModal(false);
    setDeployName('');
    setDeployImage('');
    setDeployPort('');
    setDeployRole('');
    triggerPortainerAlert(`Se desplegó el contenedor '${cleanName}' en el Docker Node`);
    showToast(`✓ Contenedor Portainer '${cleanName}' creado con éxito`);
  };

  // Inspect logs
  const handleInspectContainerLogs = (c: PortainerContainer) => {
    setSelectedContainerLogs(c);
    setPortainerLogs(getContainerHistoryLogs(c));
  };

  // Dynamic Telemetry updates for Docker Portainer running containers
  useEffect(() => {
    const telemetryInterval = setInterval(() => {
      setPortainerContainers(prev => prev.map(c => {
        if (c.status !== 'running') return c;
        // Minor dynamic variation in CPU Usage (+ or - 0.2)
        const diff = (Math.random() - 0.5) * 0.4;
        const nextCpu = Math.max(0.1, Number((c.cpu + diff).toFixed(1)));
        
        // Minor dynamic memory simulation (e.g. modify MB value by +/- 0.5 MB)
        const memParts = c.memory.split(' ');
        if (memParts.length > 0) {
          const numericMem = parseFloat(memParts[0]);
          const nextNumericMem = Math.max(5, Number((numericMem + (Math.random() - 0.5) * 0.8).toFixed(1)));
          const nextMemory = `${nextNumericMem} MB / 8.0 GB`;
          return { ...c, cpu: nextCpu, memory: nextMemory };
        }
        
        return { ...c, cpu: nextCpu };
      }));
    }, 3000);

    return () => clearInterval(telemetryInterval);
  }, []);

  // Log append loop when checking logs
  useEffect(() => {
    if (!selectedContainerLogs || selectedContainerLogs.status !== 'running') return;

    const logAppendInterval = setInterval(() => {
      const timestamp = new Date().toISOString().replace('T', ' ').substring(11, 19);
      let newLine = '';
      if (selectedContainerLogs.name.includes('postgres')) {
        newLine = `[${timestamp}] [postgres] client disconnected or routine transaction finished. Vacuum status: idle.`;
      } else if (selectedContainerLogs.name.includes('gateway')) {
        newLine = `[${timestamp}] [nginx] 127.0.0.1 - "GET /api/health HTTP/1.1" 200 OK (Heartbeat tracer request)`;
      } else if (selectedContainerLogs.name.includes('storage')) {
        newLine = `[${timestamp}] [minio] Simulating incoming stats validation request on soporte-pmo-storage bucket.`;
      } else {
        newLine = `[${timestamp}] [system] telemetry probe reported container metrics [CPU: ${selectedContainerLogs.cpu}% | MEM: ${selectedContainerLogs.memory}]`;
      }

      setPortainerLogs(prev => [...prev, newLine]);
    }, 2000);

    return () => clearInterval(logAppendInterval);
  }, [selectedContainerLogs]);

  // Load objects uploaded inside support documents
  const loadStorageObjects = () => {
    // 1. Costs with files
    const local = localStorage.getItem('gcp_costs');
    let costFiles: any[] = [];
    if (local && local !== "undefined" && local !== "null") {
      try {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed)) {
          costFiles = parsed;
        }
      } catch (e) {
        console.error("Failed to parse gcp_costs inside loadStorageObjects", e);
      }
    }
    const attached: StorageObject[] = costFiles
      .filter((c: any) => c && c.storage_key)
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
    let custom: StorageObject[] = [];
    if (customLocal && customLocal !== "undefined" && customLocal !== "null") {
      try {
        const parsed = JSON.parse(customLocal);
        if (Array.isArray(parsed)) {
          custom = parsed;
        }
      } catch (e) {
        console.error("Failed to parse custom local storage files", e);
      }
    }

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
    let custom: StorageObject[] = [];
    if (customLocal && customLocal !== "undefined" && customLocal !== "null") {
      try {
        const parsed = JSON.parse(customLocal);
        if (Array.isArray(parsed)) {
          custom = parsed;
        }
      } catch (e) {
        console.error("Failed to parse custom local files during upload", e);
      }
    }
    const updated = [...custom, newObj];
    localStorage.setItem('gcp_storage_custom_files', JSON.stringify(updated));

    setStorageUploadName('');
    showToast(`✓ Archivo '${cleanName}' subido al Repositorio (soporte-pmo-storage)`);
    loadStorageObjects();
    setSelectedObject(newObj);
  };

  const handleDeleteStorageObject = (id: string, name: string) => {
    const customLocal = localStorage.getItem('gcp_storage_custom_files');
    let custom: StorageObject[] = [];
    if (customLocal && customLocal !== "undefined" && customLocal !== "null") {
      try {
        const parsed = JSON.parse(customLocal);
        if (Array.isArray(parsed)) {
          custom = parsed;
        }
      } catch (e) {
        console.error("Failed to parse custom files during deletion", e);
      }
    }
    
    if (custom.some((o: any) => o.id === id)) {
      setDeleteConfirmState({
        isOpen: true,
        title: 'Eliminar Archivo de Almacenamiento',
        message: `¿Está seguro de que desea eliminar el archivo '${name}' del Repositorio de Almacenamiento de forma permanente?`,
        onConfirm: () => {
          custom = custom.filter((o: any) => o.id !== id);
          localStorage.setItem('gcp_storage_custom_files', JSON.stringify(custom));
          showToast(`✗ Archivo '${name}' eliminado del Repositorio de Almacenamiento`);
          loadStorageObjects();
          if (selectedObject?.id === id) {
            setSelectedObject(INITIAL_STORAGE_MOCKS[1]);
          }
        }
      });
    } else {
      // If it comes from costs, warn that they must delete it from standard receipts
      showToast(`¡Aviso! '${name}' está vinculado a un documento de soporte. Anúlalo en la pestaña "Presupuesto y Gastos".`);
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
        <div className="bg-slate-900 text-slate-100 flex flex-col font-sans animate-fadeIn min-h-[600px] rounded-b-xl border-t border-slate-800">
          {/* Portainer Blue/Cyan top banner */}
          <div className="px-5 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-teal-400 font-extrabold text-sm tracking-widest uppercase font-mono">PORTAINER</span>
                <span className="text-indigo-400 font-medium text-xs bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-900/40">Community v2.19.4</span>
              </div>
              <span className="text-slate-600 font-mono text-xs">|</span>
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
                <span>Entorno activo: <strong className="text-slate-200">local (Socket /var/run/docker.sock)</strong></span>
              </div>
            </div>

            <button 
              onClick={() => {
                setPortainerContainers(INITIAL_PORTAINER_CONTAINERS);
                triggerPortainerAlert("Entorno recreado: Lista restaurada con contenedores oficiales de fábrica");
              }}
              title="Restaurar estado inicial de contenedores"
              className="px-2.5 py-1 bg-slate-850 hover:bg-slate-800 text-slate-350 text-[11px] rounded border border-slate-750 font-medium transition cursor-pointer flex items-center gap-1 font-mono"
            >
              <RefreshCw className="w-3 h-3 text-teal-400" />
              Reset Stack
            </button>
          </div>

          {/* Portainer Alert Notification Banner */}
          {portainerAlert && (
            <div className="bg-teal-950 border-b border-teal-800 text-teal-250 text-xs px-5 py-2 flex items-center gap-2 font-mono text-teal-300">
              <span className="bg-teal-900 text-teal-300 font-bold px-1.5 py-0.2 rounded text-[10px]">SUCCESS</span>
              <span>{portainerAlert}</span>
            </div>
          )}

          {/* Core Portainer Inner Side+Main layout */}
          <div className="grid grid-cols-1 md:grid-cols-12 min-h-[500px]">
            {/* Sidebar Navigation */}
            <div className="md:col-span-3 bg-slate-950/75 border-r border-slate-850 p-4 space-y-5 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block mb-2 font-sans pl-2">NAVEGACIÓN</span>
                <div className="space-y-1">
                  <button
                    onClick={() => setPortainerNavTab('dashboard')}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium transition text-left cursor-pointer ${
                      portainerNavTab === 'dashboard' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5 text-indigo-400" />
                    Dashboards (Cluster)
                  </button>
                  <button
                    onClick={() => setPortainerNavTab('containers')}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium transition text-left cursor-pointer ${
                      portainerNavTab === 'containers' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                    }`}
                  >
                    <Terminal className="w-3.5 h-3.5 text-teal-400" />
                    Contenedores ({portainerContainers.length})
                  </button>
                  <button
                    onClick={() => setPortainerNavTab('images')}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium transition text-left cursor-pointer ${
                      portainerNavTab === 'images' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                    }`}
                  >
                    <Cpu className="w-3.5 h-3.5 text-amber-400" />
                    Imágenes (14)
                  </button>
                  <button
                    onClick={() => setPortainerNavTab('networks')}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium transition text-left cursor-pointer ${
                      portainerNavTab === 'networks' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                    }`}
                  >
                    <Server className="w-3.5 h-3.5 text-violet-400" />
                    Redes Virtuales (3)
                  </button>
                  <button
                    onClick={() => setPortainerNavTab('volumes')}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium transition text-left cursor-pointer ${
                      portainerNavTab === 'volumes' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                    }`}
                  >
                    <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
                    Volúmenes Persistidos (5)
                  </button>
                </div>
              </div>

              <div className="border-t border-slate-850 pt-4 pl-2 space-y-2">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block font-sans">CONTROL DE ACCESO</span>
                <div className="flex items-center gap-2 text-slate-400">
                  <Users className="w-3.5 h-3.5 text-slate-500" />
                  <span>Usuarios: Admin (pmo-sys)</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <Settings className="w-3.5 h-3.5 text-slate-500" />
                  <span>Configuración Engine</span>
                </div>
              </div>

              <div className="bg-slate-950 border border-slate-800 p-3 rounded-lg space-y-1.5 font-mono text-[10px] text-slate-500 text-left">
                <div className="text-slate-400 font-bold">DOCKER ENGINE VER:</div>
                <div>v26.0.2-ce (API 1.45)</div>
                <div className="text-slate-400 font-bold mt-1">S.O. ANFITRIÓN:</div>
                <div>Alpine Linux v3.19</div>
                <div className="text-slate-400 font-bold mt-1">DOCKER SOCKET:</div>
                <div className="text-indigo-400">unix:///docker.sock</div>
              </div>
            </div>

            {/* Main Portainer View Content Area */}
            <div className="md:col-span-9 p-6 space-y-6 overflow-y-auto">
              
              {/* VIEW: DASHBOARD PANEL */}
              {portainerNavTab === 'dashboard' && (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-md font-bold text-slate-100 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-teal-400" />
                      Panel General de Recursos Docker (Dashboard)
                    </h4>
                    <p className="text-xs text-slate-450 mt-1">
                      Vista consolidada de los objetos de infraestructura orquestados en el stack de desarrollo local.
                    </p>
                  </div>

                  {/* Summary grid bento */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    
                    <div 
                      onClick={() => setPortainerNavTab('containers')}
                      className="bg-slate-950/40 border border-slate-800 hover:border-teal-500/50 p-4 rounded-xl flex items-center justify-between hover:bg-slate-950/90 transition cursor-pointer group"
                    >
                      <div className="space-y-1.5">
                        <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider font-mono">CONTENEDORES</span>
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-black text-slate-100">{portainerContainers.length}</span>
                          <span className="text-[10px] text-emerald-400 font-bold">
                            ({portainerContainers.filter(c => c.status === 'running').length} en línea)
                          </span>
                        </div>
                      </div>
                      <div className="p-3 bg-teal-950/50 text-teal-400 rounded-lg group-hover:bg-teal-900/50 transition">
                        <Terminal className="w-5 h-5" />
                      </div>
                    </div>

                    <div 
                      onClick={() => setPortainerNavTab('images')}
                      className="bg-slate-950/40 border border-slate-800 hover:border-amber-500/50 p-4 rounded-xl flex items-center justify-between hover:bg-slate-950/90 transition cursor-pointer group"
                    >
                      <div className="space-y-1.5">
                        <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider font-mono">IMÁGENES REGISTRADAS</span>
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-black text-slate-100">14</span>
                          <span className="text-[10px] text-slate-400">Total: 4.12 GB</span>
                        </div>
                      </div>
                      <div className="p-3 bg-amber-950/50 text-amber-400 rounded-lg group-hover:bg-amber-900/50 transition">
                        <Cpu className="w-5 h-5" />
                      </div>
                    </div>

                    <div 
                      onClick={() => setPortainerNavTab('networks')}
                      className="bg-slate-950/40 border border-slate-800 hover:border-violet-500/50 p-4 rounded-xl flex items-center justify-between hover:bg-slate-950/90 transition cursor-pointer group"
                    >
                      <div className="space-y-1.5">
                        <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider font-mono">REDES (DOCKER NET)</span>
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-black text-slate-100">3</span>
                          <span className="text-[10px] text-violet-400 font-bold">Bridge Orquestado</span>
                        </div>
                      </div>
                      <div className="p-3 bg-violet-950/50 text-violet-400 rounded-lg group-hover:bg-violet-900/50 transition">
                        <Server className="w-5 h-5" />
                      </div>
                    </div>

                    <div 
                      onClick={() => setPortainerNavTab('volumes')}
                      className="bg-slate-950/40 border border-slate-800 hover:border-emerald-500/50 p-4 rounded-xl flex items-center justify-between hover:bg-slate-950/90 transition cursor-pointer group"
                    >
                      <div className="space-y-1.5">
                        <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider font-mono">VOLÚMENES MOUNTED</span>
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-black text-slate-100">5</span>
                          <span className="text-[10px] text-slate-400">Establezados en compose</span>
                        </div>
                      </div>
                      <div className="p-3 bg-emerald-950/50 text-emerald-400 rounded-lg group-hover:bg-emerald-900/50 transition">
                        <HardDrive className="w-5 h-5" />
                      </div>
                    </div>

                    {/* Additional Portainer dashboard panels */}
                    <div className="bg-slate-950/40 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
                      <div className="space-y-1.5">
                        <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider font-mono">STACKS INSTALADOS</span>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-2xl font-black text-white">1</span>
                          <span className="text-[10px] font-mono text-indigo-400">pmo-cluster-stack</span>
                        </div>
                      </div>
                      <div className="p-3 bg-slate-900 text-slate-400 rounded-lg">
                        <Layers className="w-5 h-5" />
                      </div>
                    </div>

                    <div className="bg-slate-950/40 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
                      <div className="space-y-1.5">
                        <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider font-mono">ESTADO DEL CLUSTER</span>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-400" />
                          <span className="text-xs text-slate-200 font-bold">100% Saludable</span>
                        </div>
                      </div>
                      <div className="p-3 bg-slate-900 text-slate-400 rounded-lg">
                        <Shield className="w-5 h-5 text-emerald-400" />
                      </div>
                    </div>

                  </div>

                  {/* System Architecture summary block */}
                  <div className="bg-slate-950/20 border border-slate-800 p-5 rounded-xl space-y-3">
                    <h5 className="text-xs font-bold text-slate-300 block font-mono">INSTRUCCIONES DE ACCESO AL SÉQUITO PORTAINER IO:</h5>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      El panel administrativo de Portainer está conectado nativamente con el socket de control local. Aquí puedes simular cualquier operación del Docker Engine como detener bases de datos Postgres, reiniciar el gateway reverso Nginx para refrescar redireccionamientos, pausar APIs para validar resiliencias de error en frontend, o desplegar nuevos servicios temporales de prueba.
                    </p>
                  </div>
                </div>
              )}

              {/* VIEW: CONTAINERS LIST */}
              {portainerNavTab === 'containers' && (
                <div className="space-y-6">
                  
                  {/* Title and Add button */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <h4 className="text-md font-bold text-slate-100 flex items-center gap-2">
                        <Terminal className="w-4 h-4 text-teal-400" />
                        Lista de Contenedores (Docker Engine Socket)
                      </h4>
                      <p className="text-xs text-slate-405 text-slate-400 mt-1">
                        Utiliza la barra de herramientas para controlar la ejecución y recursos asignados del stack.
                      </p>
                    </div>

                    <button
                      onClick={() => setShowDeployModal(true)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 rounded-lg flex items-center gap-1.5 shadow-md cursor-pointer transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Añadir Contenedor (Run CLI)
                    </button>
                  </div>

                  {/* Search and Toolbar actions */}
                  <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-4">
                    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 font-mono text-xs">
                      
                      {/* Batch Controls */}
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => {
                            setPortainerContainers(prev => prev.map(c => ({ ...c, status: 'running', cpu: 1.0 })));
                            triggerPortainerAlert("Iniciando todos los contenedores del cluster...");
                          }}
                          className="px-3 py-1.5 bg-emerald-950 text-emerald-300 border border-emerald-800/85 hover:bg-emerald-900 rounded font-semibold transition cursor-pointer flex items-center gap-1"
                        >
                          <Play className="w-3.5 h-3.5" /> Start All
                        </button>
                        <button
                          onClick={() => {
                            setPortainerContainers(prev => prev.map(c => ({ ...c, status: 'stopped', cpu: 0 })));
                            triggerPortainerAlert("Deteniendo todos los contenedores de soporte...");
                          }}
                          className="px-3 py-1.5 bg-red-950 text-red-300 border border-red-800/85 hover:bg-red-900 rounded font-semibold transition cursor-pointer flex items-center gap-1"
                        >
                          <StopCircle className="w-3.5 h-3.5" /> Stop All
                        </button>
                        <button
                          onClick={() => {
                            setPortainerContainers(prev => prev.map(c => ({ ...c, status: 'running', cpu: 1.4 })));
                            triggerPortainerAlert("Reinstalando y reiniciando cluster stack completo...");
                          }}
                          className="px-3 py-1.5 bg-slate-850 text-slate-200 border border-slate-750 hover:bg-slate-800 rounded font-semibold transition cursor-pointer flex items-center gap-1"
                        >
                          <RefreshCw className="w-3.5 h-3.5" /> Restart All
                        </button>
                      </div>

                      {/* Filter Search */}
                      <div className="relative font-sans text-xs w-full md:w-64">
                        <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          placeholder="Buscar contenedores..."
                          value={portainerSearchQuery}
                          onChange={e => setPortainerSearchQuery(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-750 focus:border-indigo-500 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-100 placeholder-slate-505"
                        />
                      </div>

                    </div>
                  </div>

                  {/* Containers Table */}
                  <div className="bg-slate-950/40 border border-slate-800 rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800 uppercase text-[10px] tracking-wider">
                          <tr>
                            <th className="p-3.5 pl-5">Nombre Contenedor</th>
                            <th className="p-3.5">Estado</th>
                            <th className="p-3.5">Dirección IP</th>
                            <th className="p-3.5">Mapeo Puertos</th>
                            <th className="p-3.5">Monitor Telemetría CPU/Mem</th>
                            <th className="p-3.5 text-right pr-5">Acciones Rápidas (Engine)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-850 font-mono text-[11px]">
                          {portainerContainers
                            .filter(c => c.name.toLowerCase().includes(portainerSearchQuery.toLowerCase()) || c.image.toLowerCase().includes(portainerSearchQuery.toLowerCase()))
                            .map((c) => (
                              <tr key={c.id} className="hover:bg-slate-950/40 transition">
                                
                                <td className="p-3.5 pl-5">
                                  <div>
                                    <span className="font-bold text-slate-150 font-mono block">{c.name}</span>
                                    <span className="text-[10px] text-slate-505 text-slate-500 font-mono">{c.image}</span>
                                  </div>
                                  <div className="text-[9.5px] text-slate-500 font-sans mt-0.5">{c.role}</div>
                                </td>

                                <td className="p-3.5">
                                  {c.status === 'running' && (
                                    <span className="text-[9px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800/40 px-2 py-0.5 rounded-full font-sans uppercase inline-flex items-center gap-1">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                      RUNNING
                                    </span>
                                  )}
                                  {c.status === 'stopped' && (
                                    <span className="text-[9px] font-bold bg-slate-800 text-slate-400 border border-slate-700 px-2 py-0.5 rounded-full font-sans uppercase inline-flex items-center gap-1">
                                      STOPPED
                                    </span>
                                  )}
                                  {c.status === 'paused' && (
                                    <span className="text-[9px] font-bold bg-amber-950 text-amber-400 border border-amber-800/40 px-2 py-0.5 rounded-full font-sans uppercase inline-flex items-center gap-1">
                                      PAUSED
                                    </span>
                                  )}
                                  {c.status as any === 'runner' && (
                                    <span className="text-[9px] font-bold bg-teal-950 text-teal-300 border border-teal-800 px-2 py-0.5 rounded-full font-sans uppercase inline-flex items-center gap-1 animate-pulse">
                                      RESTARTING
                                    </span>
                                  )}
                                </td>

                                <td className="p-3.5 text-slate-300">{c.ip}</td>
                                
                                <td className="p-3.5 text-indigo-400 font-bold font-mono">{c.ports}</td>

                                <td className="p-3.5 font-sans">
                                  {c.status === 'running' ? (
                                    <div className="space-y-1 w-32">
                                      <div className="flex justify-between text-[9px] font-mono font-bold text-slate-400">
                                        <span>CPU: {c.cpu}%</span>
                                        <span>MEM</span>
                                      </div>
                                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                        <div 
                                          className={`h-full rounded-full transition-all duration-300 ${c.cpu > 2 ? 'bg-amber-450 bg-amber-500' : 'bg-teal-400'}`}
                                          style={{ width: `${Math.min(100, Math.max(8, c.cpu * 20))}%` }}
                                        />
                                      </div>
                                      <div className="text-[9px] text-slate-500 truncate font-mono text-left">{c.memory}</div>
                                    </div>
                                  ) : (
                                    <span className="text-slate-600 font-mono italic text-[10px]">Sin telemetría</span>
                                  )}
                                </td>

                                <td className="p-3.5 text-right pr-5">
                                  <div className="flex justify-end items-center gap-2" onClick={e => e.stopPropagation()}>
                                    
                                    {c.status === 'stopped' ? (
                                      <button
                                        onClick={() => handleStartPortainerContainer(c.id)}
                                        className="p-1.5 bg-slate-800 hover:bg-emerald-950 text-slate-300 hover:text-emerald-400 rounded border border-slate-700 hover:border-emerald-800 transition cursor-pointer"
                                        title="Iniciar Contenedor (docker start)"
                                      >
                                        <Play className="w-3.5 h-3.5" />
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => handleStopPortainerContainer(c.id)}
                                        className="p-1.5 bg-slate-800 hover:bg-red-950 text-slate-300 hover:text-red-400 rounded border border-slate-700 hover:border-red-800 transition cursor-pointer"
                                        title="Detener Contenedor (docker stop)"
                                      >
                                        <StopCircle className="w-3.5 h-3.5" />
                                      </button>
                                    )}

                                    <button
                                      onClick={() => handleRestartPortainerContainer(c.id)}
                                      disabled={c.status === 'stopped'}
                                      className="p-1.5 bg-slate-800 hover:bg-indigo-950 text-slate-300 hover:text-indigo-400 disabled:opacity-40 rounded border border-slate-700 hover:border-indigo-800 transition cursor-pointer"
                                      title="Reiniciar Contenedor (docker restart)"
                                    >
                                      <RefreshCw className="w-3.5 h-3.5" />
                                    </button>

                                    <button
                                      onClick={() => handlePausePortainerContainer(c.id)}
                                      disabled={c.status === 'stopped'}
                                      className="p-1.5 bg-slate-800 hover:bg-amber-950 text-slate-300 hover:text-amber-400 disabled:opacity-40 rounded border border-slate-700 hover:border-amber-800 transition cursor-pointer"
                                      title={c.status === 'paused' ? "Reanudar Contenedor (docker unpause)" : "Pausar Contenedor (docker pause)"}
                                    >
                                      <Cpu className="w-3.5 h-3.5" />
                                    </button>

                                    <button
                                      onClick={() => handleInspectContainerLogs(c)}
                                      className="p-1.5 bg-indigo-950 text-indigo-400 hover:bg-indigo-900 rounded border border-indigo-900 transition cursor-pointer flex items-center justify-center gap-1 px-2 text-[10px] font-sans font-bold"
                                      title="Inspeccionar Logs de Ejecución (stdout/stderr)"
                                    >
                                      <Terminal className="w-3.5 h-3.5" />
                                      Logs
                                    </button>

                                    {/* Delete option for custom containers only */}
                                    {c.id.startsWith('c-custom-') && (
                                      <button
                                        onClick={() => {
                                          setPortainerContainers(prev => prev.filter(item => item.id !== c.id));
                                          triggerPortainerAlert(`Contenedor '${c.name}' eliminado del Docker Engine`);
                                          showToast(`Portainer.io: '${c.name}' eliminado`);
                                        }}
                                        className="p-1.5 bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 rounded border border-slate-700 hover:border-rose-800 transition cursor-pointer"
                                        title="Eliminar Contenedor (docker rm -f)"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    )}

                                  </div>
                                </td>

                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* ACTIVE LOOGER TERMINAL MODAL DRIVER */}
                  {selectedContainerLogs && (
                    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center z-[99999] p-4 text-slate-800 animate-fadeIn font-sans">
                      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl max-w-4xl w-full text-slate-100 flex flex-col h-[550px]" onClick={e => e.stopPropagation()}>
                        
                        {/* Drawer Header */}
                        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Terminal className="w-4 h-4 text-teal-400" />
                            <div>
                              <h3 className="text-xs font-bold text-slate-100 uppercase font-mono tracking-wide">
                                INSPECTOR DOCKER LOGS: {selectedContainerLogs.name}
                              </h3>
                              <p className="text-[10px] text-slate-450 mt-0.5">Filtro de salida estándar de ejecución en tiempo real (stdout/stderr)</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-900 px-2.5 py-0.5 rounded font-mono font-bold uppercase">
                              STREAM DISPONIBLE (LIVE)
                            </span>
                            <button
                              type="button"
                              onClick={() => setSelectedContainerLogs(null)}
                              className="p-1 bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-white rounded transition cursor-pointer"
                              title="Cerrar Terminal"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Terminal Body */}
                        <div className="flex-1 p-5 bg-slate-950 font-mono text-[11px] leading-relaxed overflow-y-auto whitespace-pre-wrap select-text text-slate-300">
                          {portainerLogs.length === 0 ? (
                            <p className="text-slate-600 italic">Conectando con la tty del contenedor... Esperando buffers.</p>
                          ) : (
                            <div className="space-y-1">
                              {portainerLogs.map((log, idx) => (
                                <div key={idx} className={idx === portainerLogs.length - 1 ? 'text-teal-300 animate-fadeIn' : ''}>
                                  {log}
                                </div>
                              ))}
                              <div className="h-4" />
                            </div>
                          )}
                        </div>

                        {/* Control actions footer */}
                        <div className="p-3.5 bg-slate-950 border-t border-slate-850 flex items-center justify-between font-mono text-xs">
                          <div className="text-slate-500 font-sans text-[10px]">
                            Consola ANSI Emulation compliant • host_stream: true
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setPortainerLogs(getContainerHistoryLogs(selectedContainerLogs))}
                              className="px-3 py-1 bg-slate-850 hover:bg-slate-800 hover:text-white rounded text-[11px] font-semibold text-slate-300 border border-slate-750 transition cursor-pointer"
                            >
                              Reiniciar Stream
                            </button>
                            <button
                              onClick={() => setPortainerLogs([])}
                              className="px-3 py-1 bg-slate-850 hover:bg-slate-800 hover:text-white rounded text-[11px] font-semibold text-slate-300 border border-slate-750 transition cursor-pointer"
                            >
                              Limpiar Consola
                            </button>
                            <button
                              onClick={() => setSelectedContainerLogs(null)}
                              className="px-4 py-1 bg-indigo-600 hover:bg-indigo-700 rounded text-[11px] font-bold text-white transition cursor-pointer"
                            >
                              Cerrar Inspector
                            </button>
                          </div>
                        </div>

                      </div>
                    </div>
                  )}

                  {/* QUICK CONTAINER DEPLOY FORM MODAL */}
                  {showDeployModal && (
                    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center z-[99999] p-4 text-slate-800 animate-fadeIn font-sans">
                      <form onSubmit={handleDeployPortainerContainer} className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden text-slate-100 flex flex-col">
                        
                        <div className="p-5 bg-slate-950 border-b border-slate-850 flex justify-between items-center">
                          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                            🐳 Desplegar Contenedor (Portainer Run Engine)
                          </h3>
                          <button
                            type="button"
                            onClick={() => setShowDeployModal(false)}
                            className="text-slate-400 hover:text-white font-bold cursor-pointer font-mono"
                          >
                            ×
                          </button>
                        </div>

                        <div className="p-5 space-y-4 text-xs">
                          <div className="space-y-1">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">Nombre del Contenedor / Alias*</label>
                            <input
                              type="text"
                              required
                              placeholder="Ej. custom-cache-redis"
                              value={deployName}
                              onChange={e => setDeployName(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-750 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-600 font-mono"
                            />
                            <p className="text-[9px] text-slate-500">Se le antepondrá el prefijo 'pmo-' automáticamente.</p>
                          </div>

                          <div className="space-y-1">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">Imagen Docker (Registro Hub)*</label>
                            <input
                              type="text"
                              required
                              placeholder="Ej. redis:7-alpine, rabbitmq:management"
                              value={deployImage}
                              onChange={e => setDeployImage(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-750 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-600 font-mono"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">Puerto Interno</label>
                              <input
                                type="text"
                                placeholder="Ej. 6379, 5672"
                                value={deployPort}
                                onChange={e => setDeployPort(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-750 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-600 font-mono"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">Protocolo de Red</label>
                              <select className="w-full bg-slate-950 border border-slate-750 rounded-lg px-3 py-2 text-xs text-slate-400 cursor-pointer">
                                <option>TCP (Por Defecto)</option>
                                <option>UDP (Fast delivery)</option>
                              </select>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">Descripción u Orquestación de Rubro</label>
                            <input
                              type="text"
                              placeholder="Ej. Broker de Mensajería para Auditoría"
                              value={deployRole}
                              onChange={e => setDeployRole(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-750 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-600 font-mono"
                            />
                          </div>
                        </div>

                        <div className="bg-slate-950 px-5 py-3 border-t border-slate-850 flex justify-end gap-2 text-xs font-semibold">
                          <button
                            type="button"
                            onClick={() => setShowDeployModal(false)}
                            className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white cursor-pointer"
                          >
                            Cancelar
                          </button>
                          <button
                            type="submit"
                            className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm cursor-pointer transition"
                          >
                            Desplegar Contenedor
                          </button>
                        </div>

                      </form>
                    </div>
                  )}

                </div>
              )}

              {/* VIEW: IMAGES */}
              {portainerNavTab === 'images' && (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-md font-bold text-slate-100 flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-amber-400" />
                      Imágenes Locales Registradas (Docker Node Storage)
                    </h4>
                    <p className="text-xs text-slate-450 mt-1">
                      Catálogo de imágenes descargadas en la caché local para aprovisionamiento inmediato de microservicios.
                    </p>
                  </div>

                  <div className="bg-slate-950/40 border border-slate-800 rounded-xl overflow-hidden">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800 uppercase text-[10px]">
                        <tr>
                          <th className="p-3.5 pl-5">Identificador Hash</th>
                          <th className="p-3.5">Tags Asociados</th>
                          <th className="p-3.5">Tamaño Físico</th>
                          <th className="p-3.5">Uso en Stack</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-850 font-mono text-[11px]">
                        <tr className="hover:bg-slate-950/40">
                          <td className="p-3.5 pl-5 text-indigo-400 font-bold">sha256:d8b2e118ae23</td>
                          <td className="p-3.5 text-slate-200">postgres:16.3-alpine</td>
                          <td className="p-3.5 text-slate-400">231.2 MB</td>
                          <td className="p-3.5"><span className="text-[9px] font-bold bg-indigo-950 text-indigo-400 border border-indigo-900 px-2 py-0.5 rounded-full font-sans uppercase">EN USO</span></td>
                        </tr>
                        <tr className="hover:bg-slate-950/40">
                          <td className="p-3.5 pl-5 text-indigo-400 font-bold">sha256:ee4f82d18471</td>
                          <td className="p-3.5 text-slate-200">nginx:1.26-alpine</td>
                          <td className="p-3.5 text-slate-400">42.5 MB</td>
                          <td className="p-3.5"><span className="text-[9px] font-bold bg-indigo-950 text-indigo-400 border border-indigo-900 px-2 py-0.5 rounded-full font-sans uppercase">EN USO</span></td>
                        </tr>
                        <tr className="hover:bg-slate-950/40">
                          <td className="p-3.5 pl-5 text-indigo-400 font-bold">sha256:bb15e19de8a3</td>
                          <td className="p-3.5 text-slate-200">minio/minio:RELEASE</td>
                          <td className="p-3.5 text-slate-400">147.8 MB</td>
                          <td className="p-3.5"><span className="text-[9px] font-bold bg-indigo-950 text-indigo-400 border border-indigo-900 px-2 py-0.5 rounded-full font-sans uppercase">EN USO</span></td>
                        </tr>
                        <tr className="hover:bg-slate-950/40">
                          <td className="p-3.5 pl-5 text-indigo-400 font-bold">sha256:fb4f08f8aa91</td>
                          <td className="p-3.5 text-slate-200">node:20.14-alpine</td>
                          <td className="p-3.5 text-slate-400">118.4 MB</td>
                          <td className="p-3.5"><span className="text-[9px] font-bold bg-indigo-950 text-indigo-400 border border-indigo-900 px-2 py-0.5 rounded-full font-sans uppercase">EN USO</span></td>
                        </tr>
                        <tr className="hover:bg-slate-950/40">
                          <td className="p-3.5 pl-5 text-slate-500">sha256:98fa2a77fe19</td>
                          <td className="p-3.5 text-slate-400">ubuntu:latest</td>
                          <td className="p-3.5 text-slate-400">77.9 MB</td>
                          <td className="p-3.5"><span className="text-[9px] font-bold bg-slate-800 text-slate-400 border border-slate-700 px-2 py-0.5 rounded-full font-sans uppercase">HUÉRFANO</span></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* VIEW: NETWORKS */}
              {portainerNavTab === 'networks' && (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-md font-bold text-slate-100 flex items-center gap-2">
                      <Server className="w-4 h-4 text-violet-400" />
                      Redes Virtuales de Comunicación Interna (Docker Networks)
                    </h4>
                    <p className="text-xs text-slate-450 mt-1">
                      Aislamiento y subredes privadas creadas para prevenir accesos maliciosos externos.
                    </p>
                  </div>

                  <div className="bg-slate-950/40 border border-slate-800 rounded-xl overflow-hidden">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800 uppercase text-[10px]">
                        <tr>
                          <th className="p-3.5 pl-5">Nombre Red</th>
                          <th className="p-3.5">Driver Orquestador</th>
                          <th className="p-3.5">Rango de Subred / Gateway (CIDR)</th>
                          <th className="p-3.5">Ámbito</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-850 font-mono text-[11px]">
                        <tr className="hover:bg-slate-950/40">
                          <td className="p-3.5 pl-5 text-indigo-400 font-bold">pmo-cluster-network-bridge</td>
                          <td className="p-3.5 text-slate-200">bridge</td>
                          <td className="p-3.5 text-slate-350">172.24.0.0/16 (GW: 172.24.0.1)</td>
                          <td className="p-3.5 text-slate-500">local</td>
                        </tr>
                        <tr className="hover:bg-slate-950/40">
                          <td className="p-3.5 pl-5 text-slate-400">bridge</td>
                          <td className="p-3.5 text-slate-400">bridge</td>
                          <td className="p-3.5 text-slate-500">172.17.0.0/16 (GW: 172.17.0.1)</td>
                          <td className="p-3.5 text-slate-500">local</td>
                        </tr>
                        <tr className="hover:bg-slate-950/40">
                          <td className="p-3.5 pl-5 text-slate-400">host</td>
                          <td className="p-3.5 text-slate-400">host</td>
                          <td className="p-3.5 text-slate-500">-</td>
                          <td className="p-3.5 text-slate-500">local</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* VIEW: VOLUMES */}
              {portainerNavTab === 'volumes' && (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-md font-bold text-slate-100 flex items-center gap-2">
                      <HardDrive className="w-4 h-4 text-emerald-400" />
                      Volúmenes de Datos Persistentes (Mounted Volumes)
                    </h4>
                    <p className="text-xs text-slate-450 mt-1">
                      Directorios persistidos fuera del ciclo de vida del contenedor para asegurar almacenamiento durable.
                    </p>
                  </div>

                  <div className="bg-slate-950/40 border border-slate-800 rounded-xl overflow-hidden">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800 uppercase text-[10px]">
                        <tr>
                          <th className="p-3.5 pl-5">Nombre del Volumen</th>
                          <th className="p-3.5">Driver</th>
                          <th className="p-3.5">Ruta de Montaje Virtual</th>
                          <th className="p-3.5">Acción</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-850 font-mono text-[11px]">
                        <tr className="hover:bg-slate-950/40">
                          <td className="p-3.5 pl-5 text-emerald-400 font-bold">pmo-postgres-volume-data</td>
                          <td className="p-3.5 text-slate-200">local</td>
                          <td className="p-3.5 text-slate-350">/var/lib/postgresql/data</td>
                          <td className="p-3.5"><span className="text-[9px] bg-slate-850 text-slate-450 px-2 py-0.5 rounded font-bold">SISTEMA COMPLEMENTARIO</span></td>
                        </tr>
                        <tr className="hover:bg-slate-950/40">
                          <td className="p-3.5 pl-5 text-emerald-400 font-bold">pmo-storage-bucket-data</td>
                          <td className="p-3.5 text-slate-200">local</td>
                          <td className="p-3.5 text-slate-350">/var/lib/storage-minio/data</td>
                          <td className="p-3.5"><span className="text-[9px] bg-slate-850 text-slate-450 px-2 py-0.5 rounded font-bold">SISTEMA COMPLEMENTARIO</span></td>
                        </tr>
                        <tr className="hover:bg-slate-950/40">
                          <td className="p-3.5 pl-5 text-slate-300">pmo-teams-express-cache</td>
                          <td className="p-3.5 text-slate-400">local</td>
                          <td className="p-3.5 text-slate-500">/root/.npm/_cacache</td>
                          <td className="p-3.5">
                            <button 
                              onClick={() => {
                                triggerPortainerAlert("Volumen 'pmo-teams-express-cache' vaciado por comando CLI");
                                showToast("Portainer: Volumen de caché vaciado");
                              }}
                              className="px-2 py-0.5 hover:bg-red-950 text-slate-400 hover:text-red-400 border border-slate-750 hover:border-red-800 transition rounded font-sans uppercase font-bold text-[9px] cursor-pointer"
                            >
                              Podar Volumen
                            </button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </div>
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
                                  showToast(`↓ Iniciando descarga de '${obj.name}' desde Repositorio Almacenamiento Seguro`);
                                  if (obj.raw_base64) {
                                    try {
                                      const parts = obj.raw_base64.split(';base64,');
                                      const contentType = parts.length > 1 ? parts[0].split(':')[1] : 'application/octet-stream';
                                      const base64Str = parts.length > 1 ? parts[1] : parts[0];
                                      const raw = window.atob(base64Str);
                                      const rawLength = raw.length;
                                      const uInt8Array = new Uint8Array(rawLength);
                                      for (let i = 0; i < rawLength; ++i) {
                                        uInt8Array[i] = raw.charCodeAt(i);
                                      }
                                      const exactBlob = new Blob([uInt8Array], { type: contentType });
                                      const downloadUrl = URL.createObjectURL(exactBlob);
                                      const link = document.createElement('a');
                                      link.href = downloadUrl;
                                      link.download = obj.name;
                                      document.body.appendChild(link);
                                      link.click();
                                      document.body.removeChild(link);
                                      URL.revokeObjectURL(downloadUrl);
                                      return;
                                    } catch (err) {
                                      console.error("Error decoding base64 data for storage object download", err);
                                    }
                                  }
                                  // Open new mock tab fallback
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
                  selectedAwsCodeTab === 'nodejs' ? 'bg-white text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-850'
                }`}
              >
                Secure Storage SDK (NodeJS / Nest)
              </button>
              <button
                onClick={() => setSelectedAwsCodeTab('terraform')}
                className={`px-4 py-2 border-r border-slate-200 ${
                  selectedAwsCodeTab === 'terraform' ? 'bg-white text-indigo-600' : 'text-slate-500 hover:text-slate-850'
                }`}
              >
                Terraform Prov
              </button>
              <button
                onClick={() => setSelectedAwsCodeTab('docker')}
                className={`px-4 py-2 border-r border-slate-200 ${
                  selectedAwsCodeTab === 'docker' ? 'bg-white text-indigo-600' : 'text-slate-500 hover:text-slate-850'
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
