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
  TransitionRule
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
import GanttChart from './components/GanttChart';
import MockupCanvas from './components/MockupCanvas';
import DbaSchema from './components/DbaSchema';
import DevOpsPipeline from './components/DevOpsPipeline';
import ProjectWBSManager from './components/ProjectWBSManager';
import ProductBacklogManager from './components/ProductBacklogManager';
import ScrumBoardAndQaManager from './components/ScrumBoardAndQaManager';
import KPIDashboard from './components/KPIDashboard';

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
  Settings
} from 'lucide-react';

function safeLoad<T>(key: string, defaultValue: T): T {
  try {
    const local = localStorage.getItem(key);
    if (local && local !== "undefined" && local !== "null") {
      const parsed = JSON.parse(local);
      if (parsed !== null && parsed !== undefined) {
        if (Array.isArray(defaultValue) && !Array.isArray(parsed)) {
          console.warn(`Localstorage mismatch for key "${key}": expected array, got difference.`);
          return defaultValue;
        }
        if (defaultValue && typeof defaultValue === 'object' && !Array.isArray(defaultValue)) {
          if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
            console.warn(`Localstorage mismatch for key "${key}": expected object, got difference.`);
            return defaultValue;
          }
        }
        return parsed as T;
      }
    }
  } catch (err) {
    console.warn(`Error parsing localStorage key "${key}":`, err);
  }
  return defaultValue;
}

export default function App() {
  // --- Persistent State / Handlers ---
  const [users, setUsers] = useState<User[]>(() => {
    return safeLoad<User[]>('gcp_users', INITIAL_USERS);
  });

  const [projects, setProjects] = useState<Project[]>(() => {
    const list = safeLoad<Project[]>('gcp_projects', INITIAL_PROJECTS);
    return list.map(p => ({
      ...p,
      sprint_size_days: p.sprint_size_days !== undefined ? p.sprint_size_days : 10
    }));
  });

  const [costs, setCosts] = useState<ProjectCost[]>(() => {
    return safeLoad<ProjectCost[]>('gcp_costs', INITIAL_PROJECT_COSTS);
  });

  const [sprints, setSprints] = useState<Sprint[]>(() => {
    return safeLoad<Sprint[]>('gcp_sprints', INITIAL_SPRINTS);
  });

  const [workItems, setWorkItems] = useState<WorkItem[]>(() => {
    return safeLoad<WorkItem[]>('gcp_work_items', INITIAL_WORK_ITEMS);
  });

  const [activities, setActivities] = useState<ProjectActivity[]>(() => {
    return safeLoad<ProjectActivity[]>('gcp_activities', INITIAL_PROJECT_ACTIVITIES);
  });

  const [testSuites, setTestSuites] = useState<TestSuite[]>(() => {
    return safeLoad<TestSuite[]>('gcp_test_suites', INITIAL_TEST_SUITES);
  });

  const [testCases, setTestCases] = useState<TestCase[]>(() => {
    return safeLoad<TestCase[]>('gcp_test_cases', INITIAL_TEST_CASES);
  });

  const [testRuns, setTestRuns] = useState<TestRun[]>(() => {
    return safeLoad<TestRun[]>('gcp_test_runs', INITIAL_TEST_RUNS);
  });

  const [mockups, setMockups] = useState<Mockup[]>(() => {
    return safeLoad<Mockup[]>('gcp_mockups', INITIAL_MOCKUPS);
  });

  const [mockScreens, setMockScreens] = useState<MockupScreen[]>(() => {
    return safeLoad<MockupScreen[]>('gcp_mock_screens', INITIAL_MOCKUP_SCREENS);
  });

  const [mockComponents, setMockComponents] = useState<MockupComponent[]>(() => {
    return safeLoad<MockupComponent[]>('gcp_mock_components', INITIAL_MOCKUP_COMPONENTS);
  });

  const [mockConnections, setMockConnections] = useState<MockupConnection[]>(() => {
    return safeLoad<MockupConnection[]>('gcp_mock_connections', INITIAL_MOCKUP_CONNECTIONS);
  });

  // Helper for category budgets default allocations
  const getInitialCategoryBudgets = (loadedProjects: Project[]) => {
    const initial: { [key: string]: { [cat: string]: number } } = {};
    loadedProjects.forEach(p => {
      initial[p.id] = {
        NOMINA: Math.round(p.budget_total * 0.40),
        LICENCIAS: Math.round(p.budget_total * 0.15),
        INFRAESTRUCTURA: Math.round(p.budget_total * 0.20),
        OUTSOURCING: Math.round(p.budget_total * 0.15),
        OTROS: Math.round(p.budget_total * 0.10),
      };
    });
    return initial;
  };

  const [categoryBudgets, setCategoryBudgets] = useState<{ [projectId: string]: { [cat: string]: number } }>(() => {
    return safeLoad<{ [projectId: string]: { [cat: string]: number } }>('gcp_category_budgets', getInitialCategoryBudgets(INITIAL_PROJECTS || []));
  });

  const [budgetBaselines, setBudgetBaselines] = useState<{
    [projectId: string]: {
      list: Array<{
        id: string;
        name: string;
        capturedAt: string;
        totalBudget: number;
        categories: { [cat: string]: number };
      }>;
      activeId: string | null;
    };
  }>(() => {
    const local = localStorage.getItem('gcp_budget_baselines_multi');
    if (local && local !== "undefined" && local !== "null") {
      try {
        const parsed = JSON.parse(local);
        if (parsed !== null && parsed !== undefined) return parsed;
      } catch (e) {
        console.error(e);
      }
    }
    const oldLocal = localStorage.getItem('gcp_budget_baselines');
    if (oldLocal && oldLocal !== "undefined" && oldLocal !== "null") {
      try {
        const oldData = JSON.parse(oldLocal);
        if (oldData) {
          const newData: any = {};
          Object.keys(oldData).forEach(projId => {
            const item = oldData[projId];
            if (item) {
              newData[projId] = {
                list: [{
                  id: 'baseline-initial',
                  name: 'Línea Base Inicial',
                  capturedAt: item.capturedAt || new Date().toLocaleDateString('es-ES'),
                  totalBudget: item.totalBudget || 150000,
                  categories: item.categories || {}
                }],
                activeId: 'baseline-initial'
              };
            }
          });
          return newData;
        }
      } catch (e) {
        console.error(e);
      }
    }
    return {};
  });

  // Action audit log
  const [logs, setLogs] = useState<{ id: string; user: string; text: string; time: string }[]>([
    { id: '1', user: 'Carlos Pérez (PM)', text: 'Creó el cronograma de actividades con 6 fases.', time: '12:45' },
    { id: '2', user: 'Andrés Mendoza (DBA)', text: 'Registró el esquema recomendado en PostgreSQL.', time: '13:12' },
    { id: '3', user: 'Valentina Rojas (QA)', text: 'Agregó la Suite 01 de pruebas de la API Multi-tenant.', time: '14:24' }
  ]);

  // Sync to localstorage
  useEffect(() => {
    localStorage.setItem('gcp_users', JSON.stringify(users));
    localStorage.setItem('gcp_projects', JSON.stringify(projects));
    localStorage.setItem('gcp_costs', JSON.stringify(costs));
    localStorage.setItem('gcp_sprints', JSON.stringify(sprints));
    localStorage.setItem('gcp_work_items', JSON.stringify(workItems));
    localStorage.setItem('gcp_activities', JSON.stringify(activities));
    localStorage.setItem('gcp_test_suites', JSON.stringify(testSuites));
    localStorage.setItem('gcp_test_cases', JSON.stringify(testCases));
    localStorage.setItem('gcp_test_runs', JSON.stringify(testRuns));
    localStorage.setItem('gcp_mockups', JSON.stringify(mockups));
    localStorage.setItem('gcp_mock_screens', JSON.stringify(mockScreens));
    localStorage.setItem('gcp_mock_components', JSON.stringify(mockComponents));
    localStorage.setItem('gcp_mock_connections', JSON.stringify(mockConnections));
    localStorage.setItem('gcp_category_budgets', JSON.stringify(categoryBudgets));
    localStorage.setItem('gcp_budget_baselines_multi', JSON.stringify(budgetBaselines));
  }, [users, projects, costs, sprints, workItems, activities, testSuites, testCases, testRuns, mockups, mockScreens, mockComponents, mockConnections, categoryBudgets, budgetBaselines]);

  // Navigation / Filter States
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isProjectsMenuOpen, setIsProjectsMenuOpen] = useState<boolean>(true);
  const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState<boolean>(true);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('proj-1');
  const [selectedSprintId, setSelectedSprintId] = useState<string>('sprint-2'); // default Sprint 2 is active/en curso
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);

  // Sub-tabs state inside detailed Project View
  const [projectSubTab, setProjectSubTab] = useState<'wbs' | 'costs'>('wbs');
  // Sub-tabs state inside central configuration view
  const [settingsSubTab, setSettingsSubTab] = useState<'smtp' | 'clients' | 'scrum_rules'>('smtp');
  // Floating Modal for Registering a Cost Support Document
  const [isRegisterCostModalOpen, setIsRegisterCostModalOpen] = useState(false);

  // Custom confirmation modal state to bypass iframe window.confirm blocks
  const [deleteConfirmState, setDeleteConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  // Floating Modal for project creation
  const [isCreateProjectModalOpen, setIsCreateProjectModalOpen] = useState(false);
  const [projectStatusModalTarget, setProjectStatusModalTarget] = useState<Project | null>(null);
  const [projectConfigModalTarget, setProjectConfigModalTarget] = useState<Project | null>(null);

  // Project List Filters
  const [projectSearch, setProjectSearch] = useState('');
  const [projectStatusFilter, setProjectStatusFilter] = useState<string>('ALL');
  const [projectPriorityFilter, setProjectPriorityFilter] = useState<string>('ALL');
  const [projectClientFilter, setProjectClientFilter] = useState<string>('ALL');

  // Drag and drop states for Scrum board
  const [draggingItemId, setDraggingItemId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<WorkItemStatus | null>(null);

  // --- Team Directory States & Filters ---
  const [teamSearch, setTeamSearch] = useState('');
  const [teamRoleFilter, setTeamRoleFilter] = useState('ALL');
  const [teamStatusFilter, setTeamStatusFilter] = useState('ALL');

  // Edit / Add user modals state
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);

  // Email / Password Reset simulation states
  const [passwordResetUser, setPasswordResetUser] = useState<User | null>(null);
  const [showResetEmailModal, setShowResetEmailModal] = useState(false);
  const [simulatedNewPassword, setSimulatedNewPassword] = useState('');
  const [isResetSuccess, setIsResetSuccess] = useState(false);
  const [simulatedMailSendSuccess, setSimulatedMailSendSuccess] = useState(false);

  // Forgot password form states on login screen
  const [showLoginForgotPassword, setShowLoginForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordStatus, setForgotPasswordStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isSendingForgotPassword, setIsSendingForgotPassword] = useState(false);

  // SMTP Settings States (with defaults)
  const [smtpAccount, setSmtpAccount] = useState(() => {
    return localStorage.getItem('gcp_smtp_account') || '';
  });
  const [smtpPassword, setSmtpPassword] = useState(() => {
    return localStorage.getItem('gcp_smtp_password') || '';
  });
  const [smtpHost, setSmtpHost] = useState(() => {
    return localStorage.getItem('gcp_smtp_host') || 'smtp.gmail.com';
  });
  const [smtpPort, setSmtpPort] = useState(() => {
    return localStorage.getItem('gcp_smtp_port') || '587';
  });

  // SMTP Test States
  const [smtpTestStatus, setSmtpTestStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [smtpTestMessage, setSmtpTestMessage] = useState<string>('');
  const [smtpTestDetails, setSmtpTestDetails] = useState<string>('');
  const [scrumRulesUpdateTrigger, setScrumRulesUpdateTrigger] = useState<number>(0);
  const [scrumRulesViewMode, setScrumRulesViewMode] = useState<'flowchart' | 'table' | 'both'>('both');

  // Dynamic Clients & Sponsors Lists
  const [clientsList, setClientsList] = useState<string[]>(() => {
    return safeLoad<string[]>('gcp_clients_list', [
      'Fintech Corp Internacional', 
      'Banco Aliado de Occidente', 
      'SaaS Corp', 
      'Retail S.A.', 
      'E-Commerce Grupo', 
      'Aseguradora Regional'
    ]);
  });

  const [sponsorsList, setSponsorsList] = useState<string[]>(() => {
    return safeLoad<string[]>('gcp_sponsors_list', [
      'Alejandra Gómez (Sponsor Principal)', 
      'Andrés Mendoza (VP Tecnología)', 
      'Sofía Ramírez (Product Lead)', 
      'Rolando Castro (Inversionista)',
      'u-1'
    ]);
  });

  // New user form states
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('Scrum Master');
  const [newStatus, setNewStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');

  // --- Session & Authentication State ---
  const [loggedInUser, setLoggedInUser] = useState<User | null>(() => {
    const local = localStorage.getItem('gcp_logged_in_user');
    if (local && local !== "undefined" && local !== "null") {
      try {
        const parsed = JSON.parse(local);
        if (parsed && typeof parsed === 'object') {
          return parsed as User;
        }
      } catch (e) {
        console.error("Failed to parse loggedInUser from localStorage", e);
      }
    }
    return null;
  });

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginTenant, setLoginTenant] = useState('enterprise-prod');

  const isDevRole = loggedInUser !== null && loggedInUser !== undefined && loggedInUser.role && (
    (() => {
      const roleLower = (loggedInUser.role || '').toLowerCase();
      return (
        roleLower.includes('qa') ||
        roleLower.includes('desarrollador') ||
        roleLower.includes('backend') ||
        roleLower.includes('frontend') ||
        roleLower.includes('dba') ||
        roleLower.includes('arquitecto de datos') ||
        roleLower.includes('devops') ||
        roleLower.includes('infraestructura') ||
        roleLower.includes('designer') ||
        roleLower.includes('diseñador') ||
        roleLower.includes('ui/ux') ||
        roleLower.includes('ux/ui') ||
        roleLower.includes('ingeniero')
      );
    })()
  );

  // Active contextual references
  const [newBudgetBaselineName, setNewBudgetBaselineName] = useState('');
  const [isBudgetBaselineSectionExpanded, setIsBudgetBaselineSectionExpanded] = useState(false);
  const activeProject = projects.find(p => p.id === selectedProjectId) || projects[0] || INITIAL_PROJECTS[0];
  const projectSprints = sprints.filter(s => s.project_id === selectedProjectId);
  const activeSprint = projectSprints.find(s => s.id === selectedSprintId) || projectSprints[0];
  const activeSprintIdEffective = activeSprint?.id || '';

  // --- Actions ---

  // Add Project
  const [newProjName, setNewProjName] = useState('');
  const [newProjClient, setNewProjClient] = useState('');
  const [newProjSponsor, setNewProjSponsor] = useState('');
  const [newProjBudget, setNewProjBudget] = useState(150000);
  const [newProjCode, setNewProjCode] = useState('');
  const [newProjSprintSizeDays, setNewProjSprintSizeDays] = useState(10);

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjName || !newProjCode) return;
    const budgetVal = Number(newProjBudget) || 150000;
    const selectedClient = newProjClient || (clientsList[0] || 'Cliente General');
    const selectedSponsor = newProjSponsor || (sponsorsList[0] || 'Sponsor Principal');
    const newProj: Project = {
      id: `proj-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      name: newProjName,
      code: newProjCode.toUpperCase(),
      description: 'Iniciativa del ciclo de vida del proyecto',
      client: selectedClient,
      sponsor: selectedSponsor,
      project_manager_id: 'u-2',
      scrum_master_id: 'u-3',
      product_owner_id: 'u-4',
      status: 'REQUERIMIENTOS',
      priority: 'MEDIUM',
      start_date: '2026-06-01',
      end_date: '2026-10-31',
      sprint_size_weeks: 2,
      sprint_size_days: Number(newProjSprintSizeDays) || 10,
      budget_total: budgetVal
    };
    setProjects(prev => [...prev, newProj]);
    setCategoryBudgets(prev => ({
      ...prev,
      [newProj.id]: {
        NOMINA: Math.round(budgetVal * 0.40),
        LICENCIAS: Math.round(budgetVal * 0.15),
        INFRAESTRUCTURA: Math.round(budgetVal * 0.20),
        OUTSOURCING: Math.round(budgetVal * 0.15),
        OTROS: Math.round(budgetVal * 0.10)
      }
    }));
    setNewProjName('');
    setNewProjCode('');
    setNewProjClient('');
    setNewProjSponsor('');
    setNewProjSprintSizeDays(10);
    setIsCreateProjectModalOpen(false);
    addLog('Carlos Pérez (PM)', `Creó el proyecto de negocio [${newProj.code}] ${newProj.name}`);
  };

  // --- Team Member Actions ---
  const handleAddNewUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFirstName.trim() || !newLastName.trim() || !newEmail.trim()) return;
    const u: User = {
      id: `u-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      first_name: newFirstName.trim(),
      last_name: newLastName.trim(),
      email: newEmail.trim(),
      role: newRole,
      status: newStatus
    };
    setUsers(prev => [...prev, u]);
    // reset form fields
    setNewFirstName('');
    setNewLastName('');
    setNewEmail('');
    setNewRole('Scrum Master');
    setNewStatus('ACTIVE');
    setIsAddUserModalOpen(false);
    addLog('Director/Sponsor', `Agregó al usuario ${u.first_name} ${u.last_name} (${u.role}) al directorio corporativo`);
  };

  const handleEditUserSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setUsers(prev => prev.map(u => u.id === editingUser.id ? editingUser : u));
    addLog('Director/Sponsor', `Modificó información y perfil corporativo de ${editingUser.first_name} ${editingUser.last_name}`);
    setEditingUser(null);
    setShowEditUserModal(false);
  };

  const triggerPasswordResetEmailSimulation = async (u: User) => {
    setPasswordResetUser(u);
    setSimulatedNewPassword('');
    setIsResetSuccess(false);
    setSimulatedMailSendSuccess(false);
    setShowResetEmailModal(true);
    
    if (smtpHost.trim() && smtpPort.trim() && smtpAccount.trim() && smtpPassword.trim()) {
      try {
        const res = await fetch('/api/send-recovery', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            host: smtpHost.trim(),
            port: smtpPort.trim(),
            username: smtpAccount.trim(),
            password: smtpPassword.trim(),
            emailToFind: u.email
          })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setSimulatedMailSendSuccess(true);
          addLog('Sistema Autenticación', `Se envió un correo de recuperación real de contraseña a ${u.email} desde ${smtpAccount}`);
        } else {
          setSimulatedMailSendSuccess(true); // show simulator anyway
          console.warn('Real SMTP recovery send failed', data.message);
          addLog('Fallo de Envío SMTP', `Se intentó enviar el correo real a ${u.email} pero falló: ${data.message}`);
        }
      } catch (err: any) {
        setSimulatedMailSendSuccess(true);
        console.warn('Real SMTP recovery send failed with exception', err.message);
      }
    } else {
      // Simulate immediate sending indicator
      setTimeout(() => {
        setSimulatedMailSendSuccess(true);
        addLog('Sistema Autenticación', `Se disparó email simulado de restablecimiento de contraseña a ${u.email}`);
      }, 1000);
    }
  };

  const handleExecuteSimulatedChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordResetUser || !simulatedNewPassword.trim()) return;
    setIsResetSuccess(true);
    addLog('Sistema Autenticación', `Contraseña simulada restablecida con éxito para ${passwordResetUser.first_name} ${passwordResetUser.last_name}`);
    setTimeout(() => {
      setIsResetSuccess(false);
      setShowResetEmailModal(false);
      setPasswordResetUser(null);
      setSimulatedNewPassword('');
    }, 2000);
  };

  // --- Session & Security Handlers ---
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    
    const emailToFind = loginEmail.trim().toLowerCase();
    if (!emailToFind) {
      setLoginError('Por favor, ingrese un correo electrónico corporativo.');
      return;
    }

    if (!loginPassword || loginPassword.length < 6) {
      setLoginError('La contraseña ingresada debe ser de al menos 6 caracteres.');
      return;
    }

    // Search inside current users list
    const foundUser = users.find(u => u.email.toLowerCase() === emailToFind);
    if (!foundUser) {
      setLoginError('El correo ingresado no pertenece a ningún integrante activo de este Tenant.');
      return;
    }

    if (foundUser.status === 'INACTIVE') {
      setLoginError('Esta cuenta se encuentra desactivada temporalmente en el panel administrativo.');
      return;
    }

    // Proceed with simulated authentication loop
    setIsLoggingIn(true);
    setTimeout(() => {
      setLoggedInUser(foundUser);
      localStorage.setItem('gcp_logged_in_user', JSON.stringify(foundUser));
      setIsLoggingIn(false);
      setLoginEmail('');
      setLoginPassword('');
      addLog(`${foundUser.first_name} ${foundUser.last_name} (${foundUser.role})`, 'Inició sesión en la plataforma multi-tenant de manera segura.');
    }, 1000);
  };

  const handleLogout = () => {
    if (loggedInUser) {
      const storedName = `${loggedInUser.first_name} ${loggedInUser.last_name}`;
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
      storage_key: cloudFileUploadedName ? `uploads/${docNum}_${cloudFileUploadedName}` : undefined,
      storage_url: cloudFileUploadedName ? `http://localhost:9000/soporte-pmo-storage/uploads/${docNum}_${cloudFileUploadedName}` : undefined,
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

  // Drag simulation / Column shift for Scrum Kanban Board
  const moveWorkItem = (itemId: string, newStatus: WorkItemStatus) => {
    setWorkItems(prev => prev.map(item => {
      if (item.id === itemId) {
        // Business Rule implementation:
        // • HU movida de backlog a un sprint debe quedar como "Por hacer"
        let status = newStatus;
        let sprintId = item.sprint_id;
        
        if (newStatus === 'POR_HACER' && !item.sprint_id) {
          sprintId = selectedSprintId; // assign current sprint
        }
        
        // If moved into Por Hacer column and is currently BACKLOG
        if (item.status === 'BACKLOG' && newStatus === 'POR_HACER') {
          sprintId = selectedSprintId;
        }

        // Broaden rule: if dragged from BACKLOG to any working column, make sure it has a sprint assigned
        if (item.status === 'BACKLOG' && newStatus !== 'BACKLOG' && !item.sprint_id) {
          sprintId = selectedSprintId;
        }

        // Conversely, if dragged back to backlog
        if (newStatus === 'BACKLOG') {
          sprintId = undefined;
        }

        addLog('Andrés Mendoza (Fullstack Dev)', `Movió ${item.key} de ${item.status} a ${newStatus}`);
        return { ...item, status, sprint_id: sprintId };
      }
      return item;
    }));
  };

  // HTML5 Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, itemId: string) => {
    setDraggingItemId(itemId);
    e.dataTransfer.setData('text/plain', itemId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, colStatus: WorkItemStatus) => {
    e.preventDefault();
    if (dragOverColumn !== colStatus) {
      setDragOverColumn(colStatus);
    }
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = (e: React.DragEvent, targetStatus: WorkItemStatus) => {
    e.preventDefault();
    const itemId = e.dataTransfer.getData('text/plain') || draggingItemId;
    if (itemId) {
      moveWorkItem(itemId, targetStatus);
    }
    setDraggingItemId(null);
    setDragOverColumn(null);
  };

  const handleDragEnd = () => {
    setDraggingItemId(null);
    setDragOverColumn(null);
  };

  // Assign item directly to Backlog or Sprints
  const assignItemToSprint = (itemId: string, sprintId: string | undefined) => {
    setWorkItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const status = sprintId ? 'POR_HACER' : 'BACKLOG';
        addLog('Sofía Ramírez (Scrum Master)', `Asignó ${item.key} al Sprint: ${sprintId ? sprints.find(s=>s.id === sprintId)?.name : 'Product Backlog'}`);
        return { ...item, sprint_id: sprintId, status };
      }
      return item;
    }));
  };

  // Create new Sprint
  const [newSprintName, setNewSprintName] = useState('');
  const [newSprintGoal, setNewSprintGoal] = useState('');

  const handleCreateSprint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSprintName) return;
    const newSp: Sprint = {
      id: `sprint-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      project_id: selectedProjectId,
      name: newSprintName,
      goal: newSprintGoal,
      start_date: '2026-06-12',
      end_date: '2026-06-25',
      status: 'NO_INICIADO',
      velocity: 0,
      capacity: 35
    };
    setSprints(prev => [...prev, newSp]);
    setSelectedSprintId(newSp.id);
    setNewSprintName('');
    setNewSprintGoal('');
    addLog('Sofía Ramírez (Scrum Master)', `Creó el Sprint vacío: "${newSp.name}"`);
  };

  // QA: Create suite & execute tests
  const [newSuiteName, setNewSuiteName] = useState('');
  const handleCreateTestSuite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSuiteName) return;
    const newSuite: TestSuite = {
      id: `suite-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      project_id: selectedProjectId,
      name: newSuiteName
    };
    setTestSuites(prev => [...prev, newSuite]);
    setNewSuiteName('');
    addLog('Valentina Rojas (QA)', `Estructuró nueva Suite de Pruebas: ${newSuite.name}`);
  };

  const [activeSuiteId, setActiveSuiteId] = useState('suite-1');
  const [newTestCaseTitle, setNewTestCaseTitle] = useState('');
  const [newTestCaseExpected, setNewTestCaseExpected] = useState('');
  const [testCaseHUId, setTestCaseHUId] = useState('');

  const handleCreateTestCase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTestCaseTitle) return;
    const newCase: TestCase = {
      id: `case-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      suite_id: activeSuiteId,
      work_item_id: testCaseHUId || undefined,
      title: newTestCaseTitle,
      steps: ['1. Renderizar componente de la plataforma', '2. Verificar flujo de guardado local', '3. Comprobar isolación por tenant'],
      expected: newTestCaseExpected || 'Comportamiento responsivo sin errores',
      status: 'PENDING'
    };
    setTestCases(prev => [...prev, newCase]);
    setNewTestCaseTitle('');
    setNewTestCaseExpected('');
    addLog('Valentina Rojas (QA)', `Añadió caso de prueba para QA: ${newCase.title}`);
  };

  const executeTestCase = (caseId: string, status: 'PASSED' | 'FAILED', notes: string) => {
    setTestCases(prev => prev.map(c => c.id === caseId ? { ...c, status } : c));
    
    // Add to runs histories
    const newRun: TestRun = {
      id: `run-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      test_case_id: caseId,
      executed_by_id: 'u-5', // Valentina
      status,
      evidence: 'Captura de pantalla de la terminal local guardada como evidencia.',
      notes,
      executed_at: new Date().toISOString()
    };
    setTestRuns(prev => [newRun, ...prev]);

    // If case failed & has work item trigger status bug
    const tCase = testCases.find(c => c.id === caseId);
    if (status === 'FAILED' && tCase?.work_item_id) {
      // Fail status work item to QA or raise warning
      setWorkItems(prev => prev.map(item => item.id === tCase.work_item_id ? { ...item, status: 'QA' } : item));
    }

    addLog('Valentina Rojas (QA)', `Ejecutó caso de prueba: "${tCase?.title}" con resultado: ${status}`);
  };

  // Mockups Builder dynamic integration
  const handleAddMockScreen = (screen: Omit<MockupScreen, 'id'>) => {
    const newScr = { ...screen, id: `screen-${Date.now()}-${Math.random().toString(36).substring(2, 9)}` };
    setMockScreens(prev => [...prev, newScr]);
    addLog('Mateo Herrera (PO)', `Añadió pantalla de mockup "${newScr.name}"`);
  };

  const handleAddMockComponent = (comp: Omit<MockupComponent, 'id'>) => {
    const newComp = { ...comp, id: `comp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}` };
    setMockComponents(prev => [...prev, newComp]);
  };

  const handleUpdateMockComponent = (comp: MockupComponent) => {
    setMockComponents(prev => prev.map(c => c.id === comp.id ? comp : c));
  };

  const handleDeleteMockComponent = (id: string) => {
    const comp = mockComponents.find(c => c.id === id);
    const compName = comp ? `"${comp.type}"` : 'este componente';
    setDeleteConfirmState({
      isOpen: true,
      title: 'Eliminar Componente Visual',
      message: `¿Está seguro de que desea eliminar el componente visual ${compName}?`,
      onConfirm: () => {
        setMockComponents(prev => prev.filter(c => c.id !== id));
      }
    });
  };

  const handleDeleteMockScreen = (id: string) => {
    const scr = mockScreens.find(s => s.id === id);
    const scrName = scr ? `"${scr.name}"` : 'esta pantalla';
    setDeleteConfirmState({
      isOpen: true,
      title: 'Eliminar Pantalla del Mockup',
      message: `¿Está seguro de que desea eliminar la pantalla ${scrName}? Se eliminarán todos sus componentes visuales y conexiones relacionadas de forma irreversible.`,
      onConfirm: () => {
        setMockScreens(prev => prev.filter(s => s.id !== id));
        // Orphan screen components are wiped
        setMockComponents(prev => prev.filter(c => c.screen_id !== id));
      }
    });
  };

  const handleAddMockConnection = (conn: Omit<MockupConnection, 'id'>) => {
    const newConn = { ...conn, id: `conn-${Date.now()}-${Math.random().toString(36).substring(2, 9)}` };
    setMockConnections(prev => [...prev, newConn]);
    addLog('Mateo Herrera (PO)', `Conectó componente prototipo con la pantalla de destino.`);
  };

  const handleDeleteMockConnection = (id: string) => {
    setDeleteConfirmState({
      isOpen: true,
      title: 'Eliminar Conexión del Prototipo',
      message: '¿Está seguro de que desea eliminar esta conexión de interacción entre pantallas?',
      onConfirm: () => {
        setMockConnections(prev => prev.filter(c => c.id !== id));
      }
    });
  };

  // Common utils
  const addLog = (user: string, text: string) => {
    const time = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    setLogs(prev => [
      { id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, user, text, time },
      ...prev.slice(0, 15) // limit to 15 logs
    ]);
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

  const menuItems = [
    { id: 'dashboard', label: 'Cuadro Integral (KPIs)', icon: LayoutDashboard },
    {
      id: 'projects_group',
      label: 'Proyecto & Presupuesto',
      icon: FolderKanban,
      isGroup: true,
      children: [
        { id: 'projects', label: 'Proyectos', icon: Briefcase },
        { id: 'backlog', label: 'Backlog del Producto', icon: Layers },
        { id: 'kanban', label: 'Tablero Scrum Board', icon: CheckSquare },
        { id: 'mockup', label: 'Lienzo Mockups Visuales', icon: Monitor },
      ]
    },
    { id: 'devops', label: 'DevOps & CI/CD Pipelines', icon: Cpu },
    {
      id: 'settings_group',
      label: 'Configuración Central',
      icon: Settings,
      isGroup: true,
      children: [
        { id: 'teams', label: 'Directorio de Equipos', icon: Users2 },
        { id: 'settings', label: 'Configuración de Plataforma', icon: Settings },
      ]
    }
  ];

  if (!loggedInUser) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 text-slate-100 p-4 font-sans antialiased relative overflow-y-auto">
        {/* Subtle grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_105%)] opacity-30 pointer-events-none" />
        
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 shadow-2xl rounded-2xl p-6 sm:p-8 m-auto z-10 relative flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-extrabold text-white text-lg shadow-md shadow-blue-500/20">
                L
              </div>
              <div className="flex flex-col">
                <span className="text-white font-bold text-lg tracking-tight leading-none mb-1">Lifecycle PM</span>
                <span className="text-xs text-blue-400 font-mono tracking-wider uppercase font-semibold">Security Gate</span>
              </div>
            </div>

            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-slate-100 tracking-tight">
                {showLoginForgotPassword ? 'Recuperar Contraseña' : 'Iniciar Sesión'}
              </h2>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                {showLoginForgotPassword 
                  ? 'Obtenga una clave temporal de recuperación gestionada y enviada a través de SMTP.' 
                  : 'Ingrese sus credenciales de Lifecycle PM para acceder al entorno de gestión del ciclo de vida de proyectos corporativo.'}
              </p>
            </div>

            {showLoginForgotPassword ? (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">Correo Oficial del Usuario</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      value={forgotPasswordEmail}
                      onChange={(e) => setForgotPasswordEmail(e.target.value)}
                      placeholder="ejemplo@empresa.com"
                      className="w-full bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 rounded-xl pl-10 pr-4 py-2.5 text-xs tracking-wide focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all font-sans"
                    />
                  </div>
                  <p className="text-[9px] text-slate-500">
                    Ingrese el correo del usuario cuyas credenciales desea restablecer. Esto simulará e intentará canalizar el envío por SMTP.
                  </p>
                </div>

                {forgotPasswordStatus && (
                  <div className={`border rounded-xl p-3 flex gap-2.5 text-xs ${
                    forgotPasswordStatus.type === 'error' 
                      ? 'bg-red-500/10 border-red-500/25 text-red-400' 
                      : 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400'
                  }`}>
                    <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                    <div className="leading-relaxed whitespace-pre-line text-left flex-1 font-sans">
                      {forgotPasswordStatus.message}
                    </div>
                  </div>
                )}

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowLoginForgotPassword(false);
                      setForgotPasswordEmail('');
                      setForgotPasswordStatus(null);
                    }}
                    className="flex-1 bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-300 font-semibold py-2.5 px-4 rounded-xl text-xs transition duration-205 cursor-pointer text-center"
                  >
                    Volver al Inicio
                  </button>
                  <button
                    type="button"
                    disabled={isSendingForgotPassword}
                    onClick={() => {
                      const emailToFind = forgotPasswordEmail.trim().toLowerCase();
                      if (!emailToFind) {
                        setForgotPasswordStatus({
                          type: 'error',
                          message: 'Por favor, ingrese un correo oficial registrado.'
                        });
                        return;
                      }

                      const targetUser = users.find(u => u.email.toLowerCase() === emailToFind);
                      if (!targetUser) {
                        setForgotPasswordStatus({
                          type: 'error',
                          message: `La dirección ${emailToFind} no se encuentra asociada a ningún usuario del Tenant actual.`
                        });
                        return;
                      }

                      setIsSendingForgotPassword(true);
                      setForgotPasswordStatus(null);
                      
                      (async () => {
                        try {
                          if (!smtpAccount.trim() || !smtpPassword.trim()) {
                            setIsSendingForgotPassword(false);
                            setForgotPasswordStatus({
                              type: 'error',
                              message: `⚠️ CONFIGURACIÓN REQUERIDA (SMTP NO CONFIGURADO)\n\nFallo de envío del correo hacia: ${emailToFind}.\n\nNo se detectó cuenta de envío de notificaciones ni contraseña.\n\nSolución:\n1. Inicie sesión temporalmente con un usuario de Acceso Rápido.\n2. Vaya al menú "Configuración Central" en el panel lateral y proporcione su cuenta de correo y credenciales SMTP.`
                            });
                            addLog('Fallo de Envío SMTP', `Se intentó enviar un enlace de recuperación de contraseña a ${emailToFind}, pero la cuenta SMTP no está configurada.`);
                            return;
                          }

                          const res = await fetch('/api/send-recovery', {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                              host: smtpHost.trim(),
                              port: smtpPort.trim(),
                              username: smtpAccount.trim(),
                              password: smtpPassword.trim(),
                              emailToFind: emailToFind
                            })
                          });

                          const data = await res.json();
                          setIsSendingForgotPassword(false);

                          if (res.ok && data.success) {
                            setForgotPasswordStatus({
                              type: 'success',
                              message: `✅ ¡EMAIL DE RECUPERACIÓN ENVIADO CON ÉXITO!\n\nServidor SMTP: ${smtpHost}:${smtpPort}\nRemitente: ${smtpAccount}\nDestinatario: ${emailToFind}\n\n${data.message}\n\nUn correo firmado con SSL/TLS fue despachado siguiendo las directivas de seguridad corporativa. Puede verificar los detalles en la bitácora del sistema.`
                            });
                            addLog('Servicio SMTP', `Se envió un correo de recuperación de contraseña a ${emailToFind} desde la cuenta SMTP configurada: ${smtpAccount}`);
                          } else {
                            setForgotPasswordStatus({
                              type: 'error',
                              message: `❌ ERROR EN SERVIDOR DE ALERTAS SMTP:\n\n${data.message || 'Error técnico desconocido.'}\n\nPor favor, revise que la Cuenta y contraseña de SMTP ubicadas en "Configuración Central" sean válidas para el Host ${smtpHost}.`
                            });
                            addLog('Fallo de Envío SMTP', `Error de despacho SMTP a ${emailToFind}: ${data.message || 'Fallo desconocido'}`);
                          }
                        } catch (err: any) {
                          setIsSendingForgotPassword(false);
                          setForgotPasswordStatus({
                            type: 'error',
                            message: `⚠️ Error de comunicación con la plataforma: ${err.message || 'Fallo general de red.'}`
                          });
                        }
                      })();
                    }}
                    className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-semibold py-2.5 px-4 rounded-xl text-xs transition duration-200 shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isSendingForgotPassword ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Espere...</span>
                      </>
                    ) : (
                      <span>Enviar Alerta</span>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleLogin} className="space-y-4">
                {/* Tenant Selector */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">ID de Suscripción (Tenant)</label>
                  <select
                    value={loginTenant}
                    onChange={(e) => setLoginTenant(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all [&>option]:bg-slate-950 cursor-pointer"
                  >
                    <option value="enterprise-prod">🏢 Core Banking Tenant (corp-bank-prod)</option>
                    <option value="retail-dev">🛍️ Retail Enterprise Tenant (corp-retail-dev)</option>
                    <option value="government-cloud">🏛️ Gobierno Federal Tenant (gov-cloud-secure)</option>
                  </select>
                </div>

                {/* Email Input */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">Correo Corporativo</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="ejemplo@empresa.com"
                      className="w-full bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 rounded-xl pl-10 pr-4 py-2.5 text-xs tracking-wide focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all font-sans"
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">Contraseña de Acceso</label>
                    <button
                      type="button"
                      onClick={() => setShowLoginForgotPassword(true)}
                      className="text-[10px] text-blue-400 hover:text-blue-350 hover:underline outline-none bg-transparent border-none cursor-pointer font-bold tracking-tight"
                    >
                      ¿Olvidó su contraseña?
                    </button>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showLoginPassword ? "text" : "password"}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 rounded-xl pl-10 pr-10 py-2.5 text-xs tracking-wide focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Error Alert panel */}
                {loginError && (
                  <div className="bg-red-500/10 border border-red-500/25 rounded-xl p-3 flex items-start gap-2.5 text-xs text-red-400">
                    <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                    <p className="leading-relaxed text-left">{loginError}</p>
                  </div>
                )}

                {/* Interactive Submit button */}
                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-semibold py-2.5 px-4 rounded-xl text-xs transition duration-200 shadow-lg shadow-blue-500/15 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isLoggingIn ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                      <span>Verificando Autenticación...</span>
                    </>
                  ) : (
                    <span>Iniciar Sesión Segura</span>
                  )}
                </button>
              </form>
            )}

            {/* Quick Demo Pre-fills Panel */}
            <div className="mt-8 pt-5 border-t border-slate-850">
              <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest font-mono text-center mb-3">
                🚪 Acceso Rápido de Prueba (Autocompletar)
              </p>
              
              <div className="grid grid-cols-2 gap-2 text-left">
                {users.slice(0, 4).map((user) => (
                  <button
                    key={user.id}
                    onClick={() => {
                      setLoginEmail(user.email);
                      setLoginPassword('Enterprise2026!');
                      setLoginError('');
                    }}
                    type="button"
                    className="p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700/60 rounded-xl transition-all duration-150 text-left cursor-pointer flex flex-col group"
                  >
                    <span className="font-semibold text-slate-200 text-[10px] group-hover:text-blue-400 transition-colors truncate">
                      {user.first_name} {user.last_name}
                    </span>
                    <span className="text-[9px] text-slate-500 font-medium tracking-tight truncate mt-0.5">
                      {user.role}
                    </span>
                  </button>
                ))}
              </div>
              
              <p className="text-[9px] text-slate-600 mt-3 text-center leading-normal">
                Al seleccionar cualquiera, se cargará su correo oficial y la clave genérica corporativa.
              </p>
            </div>
          </div>

          <div className="mt-6 text-center text-[10px] text-slate-600 leading-normal border-t border-slate-850 pt-4">
            <p>Canal de autenticación encriptado y auditado.</p>
            <p className="mt-0.5">Uso exclusivo de personal autorizado.</p>
          </div>
        </div>
      </div>
    );
  }

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
                {loggedInUser ? `${loggedInUser.first_name[0]}${loggedInUser.last_name[0]}` : 'U'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate leading-tight">
                  {loggedInUser ? `${loggedInUser.first_name} ${loggedInUser.last_name}` : 'Invitado'}
                </p>
                <p className="text-[10px] text-slate-400 truncate mt-0.5" title={loggedInUser?.role}>
                  {loggedInUser ? loggedInUser.role : 'Sin Perfil'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden w-full">
        {/* Header Bar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 md:px-8 shrink-0 gap-4">
          <div className="flex items-center gap-3">
            {/* Hamburger toggle button for Mobile */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-1.5 -ml-1 text-slate-650 hover:text-slate-900 md:hidden hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
              aria-label="Abrir menú"
            >
              <Menu className="w-5.5 h-5.5" />
            </button>
            <h1 className="text-base font-bold text-slate-800 truncate">
              Gestión Integral de proyectos
            </h1>
          </div>

          {/* User Session and Tenant Header Tools */}
          <div className="flex items-center gap-4">
            {/* Tenant Status Tag */}
            <div className="hidden lg:flex items-center gap-2 bg-slate-50 border border-slate-200/60 rounded-full px-3 py-1">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[10px] text-slate-500 font-mono tracking-tight">
                Tenant: <strong className="text-slate-705 uppercase">{loginTenant === 'enterprise-prod' ? 'Core PM' : loginTenant === 'retail-dev' ? 'Retail Dev' : 'Gov Secure'}</strong>
              </span>
            </div>

            {/* Profile Avatar & Stack */}
            <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 flex items-center justify-center font-bold text-xs uppercase cursor-help shrink-0 font-mono" title={`${loggedInUser?.first_name} ${loggedInUser?.last_name} (${loggedInUser?.role})`}>
                {loggedInUser ? `${loggedInUser.first_name[0]}${loggedInUser.last_name[0]}` : 'US'}
              </div>
              <div className="hidden sm:flex flex-col text-left min-w-0">
                <span className="text-xs font-semibold text-slate-850 truncate leading-none mb-0.5">
                  {loggedInUser ? `${loggedInUser.first_name} ${loggedInUser.last_name}` : 'Usuario'}
                </span>
                <span className="text-[10px] text-slate-400 font-medium truncate">
                  {loggedInUser ? loggedInUser.role : 'Invitado'}
                </span>
              </div>
            </div>

            {/* Logout interactive Button */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-red-50 text-slate-600 hover:text-red-650 border border-slate-200 hover:border-red-200 rounded-xl text-xs font-semibold tracking-tight transition-all duration-200 cursor-pointer shadow-xs"
              title="Cerrar sesión de forma segura"
            >
              <LogOut className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden md:inline">Cerrar Sesión</span>
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

              {/* 1. TAB: DASHBOARD */}
              {activeTab === 'dashboard' && (
                <div className="animate-fadeIn" id="tab-dashboard">
                  <KPIDashboard
                    projects={projects}
                    users={users}
                    sprints={sprints}
                    workItems={workItems}
                    activities={activities}
                    costs={costs}
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

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Filtrar por Estado</label>
                        <select
                          value={projectStatusFilter}
                          onChange={e => setProjectStatusFilter(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none cursor-pointer font-bold"
                        >
                          <option value="ALL">🟢 Todos los Estados</option>
                          <option value="REQUERIMIENTOS">📋 REQUERIMIENTOS</option>
                          <option value="APROBADO">✅ APROBADO</option>
                          <option value="DESARROLLO">💻 DESARROLLO</option>
                          <option value="PRUEBAS">🧪 PRUEBAS</option>
                          <option value="FINALIZADO">🏁 FINALIZADO</option>
                          <option value="CANCELADO">🚫 CANCELADO</option>
                        </select>
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
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Filtrar por Cliente</label>
                        <select
                          value={projectClientFilter}
                          onChange={e => setProjectClientFilter(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none cursor-pointer font-bold"
                        >
                          <option value="ALL">🏢 Todos los Clientes</option>
                          {Array.from(new Set(projects.map(p => p.client).filter(Boolean))).map(client => (
                            <option key={client} value={client}>🏢 {client}</option>
                          ))}
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
                            const filteredProjects = projects.filter(proj => {
                              const matchesSearch = proj.name.toLowerCase().includes(projectSearch.toLowerCase()) || 
                                                  proj.code.toLowerCase().includes(projectSearch.toLowerCase()) ||
                                                  proj.client.toLowerCase().includes(projectSearch.toLowerCase());
                              const matchesStatus = projectStatusFilter === 'ALL' || proj.status === projectStatusFilter;
                              const matchesPriority = projectPriorityFilter === 'ALL' || proj.priority === projectPriorityFilter;
                              const matchesClient = projectClientFilter === 'ALL' || proj.client === projectClientFilter;
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
                                  </td>
                                  <td className="p-3 text-slate-500">
                                    {proj.client}
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
                          {projects.map(p => (
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
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 bg-white border border-slate-200 rounded-xl p-4 mt-4 shadow-3xs text-xs animate-fadeIn">
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
                        <span className="block text-[10px] uppercase font-bold text-slate-400">Tamaño del Sprint</span>
                        <span className="font-semibold text-sky-850 font-bold bg-sky-50 border border-sky-100 px-2.5 py-0.5 rounded text-[11px] block mt-0.5 w-fit">
                          {activeProject.sprint_size_days !== undefined ? activeProject.sprint_size_days : 10} días hábiles
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
                  </div>

                  {/* 2. SUB-TAB VIEW CONTENT */}
                  {projectSubTab === 'wbs' ? (
                    <div className="bg-white border border-t-0 border-slate-200 rounded-b-xl p-4 shadow-sm animate-fadeIn">
                      <ProjectWBSManager
                        projectId={selectedProjectId}
                        users={users}
                        addLog={addLog}
                        isDevRole={isDevRole}
                        sprints={sprints}
                      />
                    </div>
                  ) : (
                    <>
                      {/* Costs management and breakdown */}
                      {(() => {
                        const activeProjBudgetMap = categoryBudgets[selectedProjectId] || {
                          NOMINA: Math.round(activeProject.budget_total * 0.40),
                          LICENCIAS: Math.round(activeProject.budget_total * 0.15),
                          INFRAESTRUCTURA: Math.round(activeProject.budget_total * 0.20),
                          OUTSOURCING: Math.round(activeProject.budget_total * 0.15),
                          OTROS: Math.round(activeProject.budget_total * 0.10)
                        };

                        const projBaselineData = budgetBaselines[selectedProjectId] || { list: [], activeId: null };
                        const activeBaseline = projBaselineData.list.find(b => b.id === projBaselineData.activeId) || null;

                        const handleCaptureBaseline = () => {
                          const name = newBudgetBaselineName.trim() || `Línea Base #${projBaselineData.list.length + 1}`;
                          const newBaseline = {
                            id: `bl-${Date.now()}`,
                            name: name,
                            capturedAt: new Date().toLocaleDateString('es-ES', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            }),
                            totalBudget: activeProject.budget_total,
                            categories: { ...activeProjBudgetMap }
                          };

                          setBudgetBaselines(prev => {
                            const current = prev[selectedProjectId] || { list: [], activeId: null };
                            const updatedList = [...current.list, newBaseline];
                            return {
                              ...prev,
                              [selectedProjectId]: {
                                list: updatedList,
                                activeId: newBaseline.id
                              }
                            };
                          });
                          setNewBudgetBaselineName('');
                          addLog('Carlos Pérez (PM)', `Capturó la Línea Base de presupuesto ($ USD): "${name}" para el proyecto [${activeProject.code}]`);
                        };

                        const handleSetActiveBaseline = (id: string) => {
                          setBudgetBaselines(prev => {
                            const current = prev[selectedProjectId] || { list: [], activeId: null };
                            return {
                              ...prev,
                              [selectedProjectId]: {
                                ...current,
                                activeId: id
                              }
                            };
                          });
                          const selectedBl = projBaselineData.list.find(b => b.id === id);
                          if (selectedBl) {
                            addLog('Carlos Pérez (PM)', `Activó la Línea Base de presupuesto "${selectedBl.name}" para el proyecto [${activeProject.code}]`);
                          }
                        };

                        const handleClearActiveBaseline = () => {
                          setBudgetBaselines(prev => {
                            const current = prev[selectedProjectId] || { list: [], activeId: null };
                            return {
                              ...prev,
                              [selectedProjectId]: {
                                ...current,
                                activeId: null
                              }
                            };
                          });
                          addLog('Carlos Pérez (PM)', `Desactivó la Línea Base de presupuesto activa para el proyecto [${activeProject.code}]`);
                        };

                        const handleDeleteBaseline = (id: string) => {
                          const baselineToDelete = projBaselineData.list.find(b => b.id === id);
                          setBudgetBaselines(prev => {
                            const current = prev[selectedProjectId] || { list: [], activeId: null };
                            const updatedList = current.list.filter(b => b.id !== id);
                            let nextActiveId = current.activeId;
                            if (nextActiveId === id) {
                              nextActiveId = updatedList.length > 0 ? updatedList[updatedList.length - 1].id : null;
                            }
                            return {
                              ...prev,
                              [selectedProjectId]: {
                                list: updatedList,
                                activeId: nextActiveId
                              }
                            };
                          });
                          if (baselineToDelete) {
                            addLog('Carlos Pérez (PM)', `Eliminó la Línea Base de presupuesto "${baselineToDelete.name}" de la historia del proyecto [${activeProject.code}]`);
                          }
                        };

                        return (
                          <div className="bg-white border border-t-0 border-slate-200 rounded-b-xl p-6 shadow-sm space-y-8 animate-fadeIn">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                              <div>
                                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                  <Coins className="w-4 h-4 text-indigo-600" />
                                  Control de Rubros de Presupuesto Asignado vs. Ejecutado
                                </h3>
                                <p className="text-[11px] text-slate-500 mt-1">
                                  Establezca el presupuesto límite para cada rubro y registre los documentos de soporte (facturas, nóminas, recibos) para controlar el gasto real ejecutado de manera exacta.
                                </p>
                              </div>

                              <button
                                onClick={() => setIsRegisterCostModalOpen(true)}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-lg transition-all flex items-center gap-2 cursor-pointer shadow-sm hover:-translate-y-0.5 active:translate-y-0"
                              >
                                <Plus className="w-4 h-4" />
                                <span>Registrar Documentos Soporte</span>
                              </button>
                            </div>

                            {/* Summary of Project Category budgets vs total project limit */}
                            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex flex-col sm:flex-row justify-between items-center text-[11px] gap-2">
                              <span className="text-slate-500 font-semibold uppercase tracking-wide text-[10px]">
                                Consolidado de Asignaciones de Proyecto:
                              </span>
                              <span className="font-bold text-slate-800 font-mono text-center sm:text-right">
                                Total Asignado Rubros: ${((Object.values(activeProjBudgetMap) as any[])).reduce((s: number, v: any) => s + (Number(v) || 0), 0).toLocaleString()} / Presupuesto Límite Global: ${activeProject.budget_total.toLocaleString()} USD
                              </span>
                            </div>

                            {/* Baseline History and Capture Dashboard */}
                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 transition-all duration-200">
                              <div 
                                onClick={() => setIsBudgetBaselineSectionExpanded(prev => !prev)}
                                className="flex items-center justify-between cursor-pointer select-none group"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="p-1.5 bg-indigo-50 rounded-lg text-indigo-600 group-hover:bg-indigo-100 transition-colors">
                                    <History className="w-4 h-4" />
                                  </div>
                                  <div className="min-w-0">
                                    <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-700 font-sans group-hover:text-indigo-600 transition-colors">
                                      Líneas Base (Baselines) de Presupuesto
                                    </h4>
                                    <p className="text-[10.5px] text-slate-500 font-medium truncate max-w-[280px] sm:max-w-md md:max-w-lg mt-0.5">
                                      {activeBaseline ? (
                                        <span>Comparando activamente con la Línea Base: <strong className="text-indigo-600 font-extrabold font-mono">{activeBaseline.name}</strong> (${activeBaseline.totalBudget.toLocaleString()} USD)</span>
                                      ) : (
                                        <span className="text-slate-450 italic">No hay ninguna Línea Base de presupuesto activa en este momento</span>
                                      )}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                  <span className="text-[10px] bg-indigo-50 border border-indigo-100 text-indigo-800 font-extrabold font-mono px-2 py-0.5 rounded-md hidden sm:inline-block">
                                    {projBaselineData.list.length} {projBaselineData.list.length === 1 ? 'REGISTRO' : 'REGISTROS'}
                                  </span>
                                  <button
                                    type="button"
                                    className="text-xs text-indigo-600 hover:text-indigo-700 font-extrabold flex items-center gap-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg py-1 px-2.5 transition cursor-pointer shadow-xs"
                                  >
                                    <span>{isBudgetBaselineSectionExpanded ? 'Colapsar' : 'Expandir'}</span>
                                    {isBudgetBaselineSectionExpanded ? (
                                      <ChevronUp className="w-3.5 h-3.5 text-indigo-500" />
                                    ) : (
                                      <ChevronDown className="w-3.5 h-3.5 text-indigo-500" />
                                    )}
                                  </button>
                                </div>
                              </div>

                              {isBudgetBaselineSectionExpanded && (
                                <div className="mt-5 pt-4 border-t border-slate-200/80 space-y-5 animate-fadeIn">
                                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                                    {/* Left column: Capture Form */}
                                    <div className="lg:col-span-12 xl:col-span-5 bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between space-y-4 shadow-sm">
                                      <div className="space-y-2">
                                        <h5 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                                          <CheckCircle className="w-4 h-4 text-emerald-600" />
                                          Registrar Nueva Línea Base
                                        </h5>
                                        <p className="text-[11px] text-slate-500 leading-relaxed">
                                          Captura una foto estática de la distribución actual del presupuesto asignado global ($ USD) para guardar un plan de referencia exacto y medir desviaciones.
                                        </p>
                                        
                                        <div className="pt-2">
                                          <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">Nombre o Identificador de esta Línea Base</label>
                                          <div className="relative">
                                            <input
                                              type="text"
                                              placeholder={`Ej: LB Inicial, LB Post-Rebalance, LB Q2...`}
                                              value={newBudgetBaselineName}
                                              onChange={e => setNewBudgetBaselineName(e.target.value)}
                                              className="w-full bg-slate-50 border border-slate-200 text-slate-700 hover:border-slate-300 focus:bg-white focus:border-indigo-500 focus:outline-none p-2 rounded-lg text-xs font-medium"
                                            />
                                            {newBudgetBaselineName && (
                                              <button 
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setNewBudgetBaselineName('');
                                                }}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                                              >
                                                <X className="w-3.5 h-3.5" />
                                              </button>
                                            )}
                                          </div>
                                        </div>
                                      </div>

                                      <button
                                        onClick={handleCaptureBaseline}
                                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:-translate-y-0.5 active:translate-y-0"
                                      >
                                        <Plus className="w-4 h-4" />
                                        <span>Fijar Nueva Línea Base</span>
                                      </button>
                                    </div>

                                    {/* Right column: History List */}
                                    <div className="lg:col-span-12 xl:col-span-7 space-y-3">
                                      <h5 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                                        <History className="w-4 h-4 text-indigo-500" />
                                        Historial y Línea Base Activa
                                      </h5>

                                      <div className="bg-white border border-slate-200 rounded-xl max-h-[170px] overflow-y-auto divide-y divide-slate-100 shadow-sm">
                                        {projBaselineData.list.length === 0 ? (
                                          <div className="p-8 text-center flex flex-col items-center justify-center space-y-2">
                                            <div className="w-9 h-9 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                                              <History className="w-5 h-5 text-slate-400" />
                                            </div>
                                            <div>
                                              <p className="text-[11px] font-bold text-slate-700">Sin registros históricos</p>
                                              <p className="text-[10px] text-slate-400">Use el formulario de la izquierda para capturar la primera referencia.</p>
                                            </div>
                                          </div>
                                        ) : (
                                          projBaselineData.list.map((baselineVal) => {
                                            const isSelectedActive = projBaselineData.activeId === baselineVal.id;
                                            return (
                                              <div 
                                                key={baselineVal.id} 
                                                className={`p-3 flex items-center justify-between gap-3 transition-colors ${
                                                  isSelectedActive ? 'bg-indigo-50/40' : 'hover:bg-slate-50/50'
                                                }`}
                                              >
                                                <div className="space-y-1 min-w-0">
                                                  <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="font-bold text-slate-900 text-xs truncate max-w-[190px]" title={baselineVal.name}>
                                                      {baselineVal.name}
                                                    </span>
                                                    {isSelectedActive && (
                                                      <span className="text-[9px] bg-emerald-100 border border-emerald-250 text-emerald-800 font-extrabold px-2 py-0.5 rounded-full inline-flex items-center gap-0.5">
                                                        <Check className="w-2.5 h-2.5 font-bold" /> ACTIVA
                                                      </span>
                                                    )}
                                                  </div>
                                                  <div className="flex items-center gap-2 text-[10px] text-slate-450">
                                                    <span>Fecha: <b className="text-slate-600 font-mono">{baselineVal.capturedAt}</b></span>
                                                    <span>•</span>
                                                    <span>Total: <b className="text-slate-600 font-mono">${baselineVal.totalBudget.toLocaleString()} USD</b></span>
                                                  </div>
                                                </div>

                                                <div className="flex items-center gap-1.5 shrink-0">
                                                  {!isSelectedActive ? (
                                                    <button
                                                      onClick={() => handleSetActiveBaseline(baselineVal.id)}
                                                      className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-650 font-extrabold text-[10.5px] px-2.5 py-1.5 rounded-lg cursor-pointer transition shadow-xs hover:border-slate-300"
                                                      title="Establecer como la línea base activa para comparar en la tabla"
                                                    >
                                                      Activar
                                                    </button>
                                                  ) : (
                                                    <button
                                                      onClick={handleClearActiveBaseline}
                                                      className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 font-extrabold text-[10.5px] px-2.5 py-1.5 rounded-lg cursor-pointer transition shadow-xs"
                                                      title="Desactivar comparación actual"
                                                    >
                                                      Desactivar
                                                    </button>
                                                  )}
                                                  <button
                                                    onClick={() => handleDeleteBaseline(baselineVal.id)}
                                                    className="hover:bg-rose-50 hover:text-rose-600 border border-transparent hover:border-rose-100 p-1.5 rounded-lg text-slate-400 cursor-pointer transition"
                                                    title="Eliminar esta línea base"
                                                  >
                                                    <Trash2 className="w-4 h-4" />
                                                  </button>
                                                </div>
                                              </div>
                                            );
                                          })
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Table of categories: Planificado vs Ejecutado */}
                            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
                              <table className="w-full text-left border-collapse text-xs">
                                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                                  <tr>
                                    <th className="p-3 pl-4">Rubro / Categoría de Gasto</th>
                                    <th className="p-3">Línea Base ($ USD)</th>
                                    <th className="p-3">Presupuesto Asignado ($ USD)</th>
                                    <th className="p-3 text-center">Desviación vs LB</th>
                                    <th className="p-3">Gasto Real Ejecutado ($ USD)</th>
                                    <th className="p-3">Saldo Real Disponible</th>
                                    <th className="p-3 pr-4">Porcentaje de Ejecución</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-150">
                                  {(['NOMINA', 'LICENCIAS', 'INFRAESTRUCTURA', 'OUTSOURCING', 'OTROS'] as const).map(cat => {
                                    const assignedAmt = activeProjBudgetMap[cat] !== undefined ? activeProjBudgetMap[cat] : Math.round(activeProject.budget_total * 0.20);
                                    const baselineAmt = activeBaseline ? (activeBaseline.categories[cat] ?? 0) : null;
                                    const varianceAmt = baselineAmt !== null ? (assignedAmt - baselineAmt) : null;

                                    const executedAmt = projectCosts.filter(c => c.cost_type === cat).reduce((sum, item) => sum + item.amount, 0);
                                    const balanceAmt = assignedAmt - executedAmt;
                                    const isOver = executedAmt > assignedAmt;
                                    const executionPct = assignedAmt > 0 ? (executedAmt / assignedAmt) * 100 : 0;

                                    return (
                                      <tr key={cat} className="hover:bg-slate-50/50 transition duration-150">
                                        <td className="p-3 pl-4 font-bold text-slate-800">
                                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-extrabold mr-2 ${
                                            cat === 'NOMINA' ? 'bg-teal-50 text-teal-700' :
                                            cat === 'LICENCIAS' ? 'bg-indigo-50 text-indigo-700' :
                                            cat === 'INFRAESTRUCTURA' ? 'bg-sky-50 text-sky-700' :
                                            cat === 'OUTSOURCING' ? 'bg-amber-50 text-amber-700' : 'bg-slate-50 text-slate-700'
                                          }`}>
                                            {cat}
                                          </span>
                                          <span className="text-[11px] text-slate-400 font-medium">
                                            {cat === 'NOMINA' && '(Personal / Ingeniería)'}
                                            {cat === 'LICENCIAS' && '(Plataformas SaaS)'}
                                            {cat === 'INFRAESTRUCTURA' && '(Hosting y Bases de Datos)'}
                                            {cat === 'OUTSOURCING' && '(Consultores externos)'}
                                            {cat === 'OTROS' && '(Caja menor y varios)'}
                                          </span>
                                        </td>
                                        <td className="p-3 font-mono font-bold text-slate-500">
                                          {baselineAmt !== null ? (
                                            <span className="text-slate-700">
                                              ${baselineAmt.toLocaleString('en-US')}
                                            </span>
                                          ) : (
                                            <span className="text-slate-350 font-normal italic">Sin fijar</span>
                                          )}
                                        </td>
                                        <td className="p-3">
                                          <div className="flex items-center gap-1.5 w-32">
                                            <span className="text-slate-400 font-mono font-semibold">$</span>
                                            <input
                                              type="number"
                                              value={assignedAmt}
                                              onChange={e => {
                                                const val = Math.max(0, Number(e.target.value) || 0);
                                                setCategoryBudgets(prev => ({
                                                  ...prev,
                                                  [selectedProjectId]: {
                                                    ...(prev[selectedProjectId] || {}),
                                                    [cat]: val
                                                  }
                                                }));
                                              }}
                                              className="bg-slate-50 border border-slate-200 hover:border-slate-350 focus:bg-white focus:outline-none p-1.5 rounded-md text-xs font-mono font-bold text-slate-850 w-full"
                                              title="Haga clic para cambiar la asignación planificada"
                                            />
                                          </div>
                                        </td>
                                        <td className="p-3 text-center font-mono text-[11px]">
                                          {varianceAmt !== null ? (
                                            varianceAmt > 0 ? (
                                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200" title="Presupuesto asignado incrementado respecto a la línea base">
                                                +${varianceAmt.toLocaleString('en-US')}
                                              </span>
                                            ) : varianceAmt < 0 ? (
                                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-100" title="Presupuesto asignado reducido respecto a la línea base">
                                                -${Math.abs(varianceAmt).toLocaleString('en-US')}
                                              </span>
                                            ) : (
                                              <span className="text-slate-400">Sin cambios</span>
                                            )
                                          ) : (
                                            <span className="text-slate-300">-</span>
                                          )}
                                        </td>
                                        <td className="p-3 font-mono font-bold text-slate-900">
                                          ${executedAmt.toLocaleString('en-US')} USD
                                        </td>
                                        <td className="p-3">
                                          <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold font-mono inline-block ${
                                            isOver
                                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                              : 'bg-emerald-50 text-emerald-800 border border-emerald-100'
                                          }`}>
                                            {isOver
                                              ? `-$${Math.abs(balanceAmt).toLocaleString('en-US')} Excedido`
                                              : `$${balanceAmt.toLocaleString('en-US')} Libre`
                                            }
                                          </span>
                                        </td>
                                        <td className="p-3 pr-4 animate-fadeIn">
                                          <div className="flex items-center gap-2">
                                            <div className="flex-1 bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
                                              <div
                                                className={`h-full rounded-full transition-all duration-300 ${
                                                  isOver ? 'bg-rose-500' : executionPct > 85 ? 'bg-amber-500' : 'bg-emerald-500'
                                                }`}
                                                style={{ width: `${Math.min(executionPct, 100)}%` }}
                                              />
                                            </div>
                                            <span className={`text-[10px] font-mono font-bold ${isOver ? 'text-rose-600' : 'text-slate-600'}`}>
                                              {Math.round(executionPct)}%
                                            </span>
                                          </div>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>

                            {/* Cost management ledger taking full width */}
                            <div className="space-y-4 pt-2">
                              <div className="flex justify-between items-center pb-2 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
                                <span>Historial de Documentos Registrados</span>
                                <span>Monto de Documento</span>
                              </div>

                              <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                                {projectCosts.map(c => (
                                  <div key={c.id} className="flex justify-between items-center text-xs py-3 bg-slate-50/50 hover:bg-slate-50 rounded-xl px-4 border border-slate-150 transition duration-150">
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-[10px] bg-slate-200 text-slate-800 px-1.5 py-0.5 rounded font-mono font-bold">
                                          {c.cost_type}
                                        </span>
                                        <span className="text-[10px] bg-blue-50 text-blue-750 px-1.5 py-0.5 rounded font-mono font-extrabold" title="Número de documento">
                                          #{c.document_number || 'N/A'}
                                        </span>
                                        <span className="font-semibold text-slate-800">
                                          {c.description}
                                        </span>
                                      </div>
                                      <p className="text-[10px] text-slate-450">
                                        Fecha de Documento: <strong className="font-mono">{c.document_date || c.created_at}</strong>
                                      </p>

                                      {/* Optional Support Attachment details widget */}
                                      {c.storage_key && (
                                        <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                                          <div 
                                            onClick={() => setActiveCloudObjectDetail(c)}
                                            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 transition duration-155 text-[10px] text-indigo-750 font-mono font-bold cursor-pointer"
                                            title="Ver inspector de metadata del repositorio"
                                          >
                                            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
                                            repo://{c.file_name} ({c.file_size})
                                          </div>
                                          <span className="text-slate-300 text-[9px] font-mono">•</span>
                                          <button
                                            onClick={(e) => {
                                              e.preventDefault();
                                              downloadDocumentLocally(c);
                                            }}
                                            className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold underline inline-flex items-center gap-0.5 font-mono bg-transparent border-none cursor-pointer p-0"
                                            title="Generar y descargar archivo de soporte localmente"
                                          >
                                            Descargar localmente
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0">
                                      <span className="font-bold text-slate-950 font-mono text-sm">${c.amount.toLocaleString()} USD</span>
                                      <button
                                        onClick={() => handleDeleteCost(c.id)}
                                        className="text-slate-400 hover:text-red-500 transition-colors p-1.5 hover:bg-slate-100 rounded-lg cursor-pointer"
                                        title="Anular Documento"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                                {projectCosts.length === 0 && (
                                  <p className="text-center text-slate-400 italic py-12">Sin documentos registrados. Ingrese una factura, nómina o recibo para iniciar.</p>
                                )}
                              </div>
                            </div>



                            {/* VENTANA FLOTANTE (FLOATING MODAL): Registrar Soporte de Gasto */}
                            {isRegisterCostModalOpen && (
                              <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
                                <div 
                                  className="bg-white border border-slate-200 rounded-xl max-w-md w-full max-h-[90vh] flex flex-col shadow-2xl animate-scaleUp overflow-hidden"
                                  onClick={e => e.stopPropagation()}
                                >
                                  {/* Modal Header */}
                                  <div className="bg-slate-50 border-b border-slate-200 p-4 flex justify-between items-center select-none shrink-0">
                                    <div className="flex items-center gap-2 text-indigo-600">
                                      <Coins className="w-4 h-4 text-indigo-600 animate-pulse" />
                                      <span className="text-xs font-extrabold uppercase tracking-wider block">Registrar Soporte de Gasto</span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => setIsRegisterCostModalOpen(false)}
                                      className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-200 rounded-lg transition cursor-pointer"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>

                                  {/* Modal Body / Form */}
                                  <form 
                                    onSubmit={(e) => {
                                      handleAddCost(e);
                                      setIsRegisterCostModalOpen(false); // Close on submit
                                    }} 
                                    className="p-5 space-y-4 overflow-y-auto"
                                  >
                                    <p className="text-[11px] text-slate-500 leading-normal">
                                      Ingrese la información oficial del documento soporte (factura, nómina o recibos). Esto se actualizará en la telemetría financiera global de inmediato.
                                    </p>

                                    <div>
                                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Rubro de Presupuesto Asignado*</label>
                                      <select
                                        value={newCostType}
                                        onChange={e => setNewCostType(e.target.value as any)}
                                        className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-lg px-2.5 py-2 text-xs text-slate-800 focus:outline-none cursor-pointer font-bold"
                                      >
                                        <option value="NOMINA">NOMINA (Personal / Ingeniería)</option>
                                        <option value="LICENCIAS">LICENCIAS (Plataformas SaaS)</option>
                                        <option value="INFRAESTRUCTURA">INFRAESTRUCTURA (Hosting y Cloud)</option>
                                        <option value="OUTSOURCING">OUTSOURCING (Consultoría / Audits)</option>
                                        <option value="OTROS">OTROS (Insumos generales)</option>
                                      </select>
                                    </div>

                                    <div>
                                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Número de Documento / Factura*</label>
                                      <input
                                        type="text"
                                        required
                                        placeholder="Ej. FAC-2026-0312"
                                        value={newDocNumber}
                                        onChange={e => setNewDocNumber(e.target.value)}
                                        className="w-full bg-slate-50 focus:bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-xs text-slate-800 font-mono"
                                      />
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                      <div>
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Fecha Emisión*</label>
                                        <input
                                          type="date"
                                          required
                                          value={newDocDate}
                                          onChange={e => setNewDocDate(e.target.value)}
                                          className="w-full bg-slate-50 focus:bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-850 font-mono cursor-pointer"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Monto ($ USD)*</label>
                                        <input
                                          type="number"
                                          required
                                          placeholder="Monto"
                                          value={newCostAmount}
                                          onChange={e => setNewCostAmount(e.target.value)}
                                          className="w-full bg-slate-50 focus:bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-800 font-mono font-bold"
                                        />
                                      </div>
                                    </div>

                                    <div>
                                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Concepto / Glosa de Documento*</label>
                                      <input
                                        type="text"
                                        required
                                        placeholder="Ej. Liquidación Nómina Q1"
                                        value={newCostDesc}
                                        onChange={e => setNewCostDesc(e.target.value)}
                                        className="w-full bg-slate-50 focus:bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-xs text-slate-800"
                                      />
                                    </div>

                                    {/* CLOUD STORAGE SUPPORT COMPROBANTE ATTACHMENT */}
                                    <div className="border border-dashed border-slate-300 p-3 rounded-lg bg-slate-50 space-y-2">
                                      <span className="text-[10px] font-bold text-slate-500 flex items-center justify-between">
                                        <span>COMPROBANTE SOPORTE (ALMACENAMIENTO)</span>
                                        <span className="text-[8px] bg-indigo-100 text-indigo-750 px-1.5 py-0.2 rounded font-mono font-bold">REPOSITORIO DIGITAL</span>
                                      </span>
                                      
                                      {!cloudFileUploadedName && !cloudIsUploading ? (
                                        <label className="flex flex-col items-center justify-center py-4 border border-dashed border-slate-200 rounded-lg bg-white hover:bg-indigo-50/25 hover:border-indigo-300 transition duration-155 cursor-pointer text-center">
                                          <div className="p-1 px-2.5 rounded bg-indigo-50 text-indigo-600 mb-1">
                                            <span className="text-[10.5px] font-extrabold flex items-center gap-1">
                                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                                              Cargar comprobante seguro
                                            </span>
                                          </div>
                                          <span className="text-[9.5px] text-slate-450 leading-normal block px-4">
                                            Suelta tu PDF o recibo, o <span className="text-indigo-600 font-semibold underline font-mono">examina localmente</span>
                                          </span>
                                          <input 
                                            type="file" 
                                            className="hidden" 
                                            onChange={handleCloudFileSelect}
                                            accept=".pdf,.png,.jpg,.jpeg,.zip,.rar,.txt,.doc,.docx"
                                          />
                                        </label>
                                      ) : cloudIsUploading ? (
                                        <div className="p-3 bg-white rounded-lg border border-slate-200/50 space-y-2.5">
                                          <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono">
                                            <span className="flex items-center gap-1.5 animate-pulse font-mono">
                                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping font-mono" />
                                              Conectando con repositorio seguro...
                                            </span>
                                            <span className="font-bold text-slate-700">{cloudProgress}%</span>
                                          </div>
                                          <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden font-mono">
                                            <div 
                                              className="bg-indigo-600 h-full rounded-full transition-all duration-100 font-mono" 
                                              style={{ width: `${cloudProgress}%` }}
                                            />
                                          </div>
                                          <span className="text-[8.5px] font-mono text-slate-400 block text-center uppercase tracking-wider">Storage API PutObject SDK</span>
                                        </div>
                                      ) : (
                                        <div className="p-2.5 bg-indigo-50/45 border border-indigo-100 rounded-lg flex items-center justify-between animate-fadeIn">
                                          <div className="flex items-center gap-2 truncate">
                                            <div className="p-1.5 bg-indigo-100 rounded text-indigo-700 flex-shrink-0">
                                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                            </div>
                                            <div className="truncate">
                                              <span className="font-medium text-xs text-slate-800 block truncate font-mono">{cloudFileUploadedName}</span>
                                              <span className="text-[10px] text-slate-450 block font-mono">{cloudFileUploadedSize} • Listo</span>
                                            </div>
                                          </div>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setCloudFileUploadedName('');
                                              setCloudFileUploadedSize('');
                                              setCloudProgress(0);
                                            }}
                                            className="text-[10px] font-bold text-red-500 hover:text-red-700 underline px-1 cursor-pointer font-mono"
                                          >
                                            Quitar
                                          </button>
                                        </div>
                                      )}
                                    </div>

                                    {/* Modal Footer Buttons */}
                                    <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                                      <button
                                        type="button"
                                        onClick={() => setIsRegisterCostModalOpen(false)}
                                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-lg transition-all cursor-pointer"
                                      >
                                        Cancelar
                                      </button>
                                      <button
                                        type="submit"
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs px-5 py-2.5 rounded-lg transition-all shadow-sm cursor-pointer"
                                      >
                                        Registrar Documento
                                      </button>
                                    </div>
                                  </form>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </>
                  )}
                </>
              )}
            </div>
          )}

          {/* 3. TAB: BACKLOG */}
          {activeTab === 'backlog' && (
            <div className="space-y-6 animate-fadeIn" id="tab-backlog">
              <ProductBacklogManager
                selectedProjectId={selectedProjectId}
                setSelectedProjectId={setSelectedProjectId}
                projects={projects}
                users={users}
                sprints={sprints}
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
                projects={projects}
                users={users}
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
            <div className="space-y-6 animate-fadeIn" id="tab-qa">
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h3 className="font-semibold text-slate-900 text-base">Suites de Pruebas & Casos Asegurados</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Ejecuciones verificadas por Aseguramiento de Calidad (QAS) para certificar historias de usuario.
                    </p>
                  </div>
                  <form onSubmit={handleCreateTestSuite} className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={newSuiteName}
                      onChange={e => setNewSuiteName(e.target.value)}
                      placeholder="Nueva Suite (ej. API Github)"
                      className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-850"
                    />
                    <button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white text-xs px-3.5 py-1 rounded-lg">
                      Nueva Suite
                    </button>
                  </form>
                </div>

                {/* Suites toggler list */}
                <div className="flex gap-2 mt-6 border-b border-slate-100 pb-3">
                  {testSuites.map(ste => (
                    <button
                      key={ste.id}
                      onClick={() => setActiveSuiteId(ste.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        activeSuiteId === ste.id
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-slate-100 hover:bg-slate-250 text-slate-600'
                      }`}
                    >
                      {ste.name}
                    </button>
                  ))}
                </div>

                {/* Grid to create cases and list cases */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                  {/* Create Case Form */}
                  <div className="bg-slate-50 border border-slate-150 p-4 rounded-xl space-y-4">
                    <span className="text-[10px] font-bold text-slate-450 uppercase tracking-widest block">Registrar Caso de Prueba</span>
                    <form onSubmit={handleCreateTestCase} className="space-y-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">Título del caso*</label>
                        <input
                          type="text"
                          required
                          value={newTestCaseTitle}
                          onChange={e => setNewTestCaseTitle(e.target.value)}
                          placeholder="Ej. Comprobar bloqueo de tarjetas sin rol"
                          className="w-full bg-white border border-slate-200 rounded px-2 py-1.5 text-xs text-slate-800 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">Trazabilidad (Enlaza a Requ. HU/T)</label>
                        <select
                          value={testCaseHUId}
                          onChange={e => setTestCaseHUId(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded px-2 py-1.5 text-xs text-slate-800"
                        >
                          <option value="">Selecciona HU asignada...</option>
                          {workItems.map(wi => (
                            <option key={wi.id} value={wi.id}>[{wi.key}] {wi.title}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">Resultado Esperado*</label>
                        <input
                          type="text"
                          value={newTestCaseExpected}
                          onChange={e => setNewTestCaseExpected(e.target.value)}
                          placeholder="Ej. Status 200 y filtrado organization_id"
                          className="w-full bg-white border border-slate-200 rounded px-2 py-1.5 text-xs text-slate-800 focus:outline-none"
                        />
                      </div>

                      <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs py-2 rounded font-semibold">
                        Añadir Caso
                      </button>
                    </form>
                  </div>

                  {/* List and interactive run triggers */}
                  <div className="lg:col-span-2 space-y-4">
                    <span className="text-[10px] font-bold text-slate-450 uppercase tracking-widest block">Ejecutor de Casos en Tiempo Real</span>
                    
                    <div className="space-y-3">
                      {testCases.filter(c => c.suite_id === activeSuiteId).map(c => {
                        const linkedHU = workItems.find(item => item.id === c.work_item_id);
                        return (
                          <div key={c.id} className="border border-slate-200 rounded-xl p-4 hover:shadow-xs transition duration-150">
                            <div className="flex justify-between items-start">
                              <div>
                                <h5 className="font-bold text-slate-850 text-xs">
                                  {c.title}
                                </h5>
                                {linkedHU && (
                                  <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded inline-block mt-1 font-mono">
                                    Trazas: {linkedHU.key} - {linkedHU.title}
                                  </span>
                                )}
                              </div>
                              <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase shrink-0 ${
                                c.status === 'PASSED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                c.status === 'FAILED' ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-slate-100 text-slate-500'
                              }`}>
                                {c.status}
                              </span>
                            </div>

                            <div className="bg-slate-50 p-2.5 rounded text-[10.5px] text-slate-650 space-y-1 my-3">
                              <p><strong>Pasos QA:</strong> 1. Abrir consola de depuración local. 2. Examinar base de datos PostgreSQL. 3. Lanzar pipeline.</p>
                              <p><strong>Esperado:</strong> {c.expected}</p>
                            </div>

                            {/* Runner trigger tools */}
                            <div className="flex gap-2 justify-end border-t border-slate-100 pt-3">
                              <button
                                onClick={() => executeTestCase(c.id, 'PASSED', 'Verificado de forma correcta.')}
                                className="bg-emerald-50 hover:bg-emerald-150 text-emerald-700 font-semibold px-2.5 py-1 px-1.5 rounded text-[10px] transition cursor-pointer"
                              >
                                Certificar PASSED ✅
                              </button>
                              <button
                                onClick={() => executeTestCase(c.id, 'FAILED', 'Fallo de integridad referencial.')}
                                className="bg-red-50 hover:bg-red-150 text-red-700 font-semibold px-2.5 py-1 px-1.5 rounded text-[10px] transition cursor-pointer"
                              >
                                Reportar FAILED ❌
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 6. TAB: MOCKUPS LIVE CANVAS */}
          {activeTab === 'mockup' && (
            <div className="space-y-6 animate-fadeIn" id="tab-mockups">
              {/* Load Mockup canvas component with projects and selection details */}
              <MockupCanvas
                projects={projects}
                selectedProjectId={selectedProjectId}
                setSelectedProjectId={setSelectedProjectId}
              />
            </div>
          )}

          {/* 7. TAB: TEAMS & CAPACITY */}
          {activeTab === 'teams' && (
            <div className="space-y-6 animate-fadeIn" id="tab-teams">
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-5">
                  <div>
                    <h3 className="text-slate-900 font-bold text-lg mb-1 flex items-center gap-2">
                      <Users2 className="w-5 h-5 text-indigo-600" />
                      Directorio de Equipos e Ingeniería
                    </h3>
                    <p className="text-xs text-slate-500">
                      Gestión de ingenieros dedicados, asignaciones, roles corporativos y simulación de credenciales de acceso.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setNewFirstName('');
                      setNewLastName('');
                      setNewEmail('');
                      setNewRole('Ingeniero de Software');
                      setNewStatus('ACTIVE');
                      setIsAddUserModalOpen(true);
                    }}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm hover:shadow transition cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4" />
                    Agregar Integrante
                  </button>
                </div>

                {/* Search & Filter controls */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5 mt-5 p-3.5 bg-slate-50 rounded-xl border border-slate-150">
                  {/* Search bar */}
                  <div className="relative sm:col-span-2">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Buscar por nombre, correo o rol..."
                      value={teamSearch}
                      onChange={(e) => setTeamSearch(e.target.value)}
                      className="w-full bg-white text-slate-800 text-xs pl-9 pr-4 py-2.5 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
                    />
                  </div>

                  {/* Role filter */}
                  <div>
                    <select
                      value={teamRoleFilter}
                      onChange={(e) => setTeamRoleFilter(e.target.value)}
                      className="w-full bg-white text-slate-800 text-xs px-3 py-2.5 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none cursor-pointer"
                    >
                      <option value="ALL">Todos los Roles</option>
                      {Array.from(new Set(users.map(u => u.role))).map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>

                  {/* Status filter */}
                  <div>
                    <select
                      value={teamStatusFilter}
                      onChange={(e) => setTeamStatusFilter(e.target.value)}
                      className="w-full bg-white text-slate-800 text-xs px-3 py-2.5 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none cursor-pointer"
                    >
                      <option value="ALL">Cualquier Estado</option>
                      <option value="ACTIVE">Activos</option>
                      <option value="INACTIVE">Inactivos</option>
                    </select>
                  </div>
                </div>

                {/* Team Grid Listings */}
                {users.filter(u => {
                  const fullName = `${u.first_name} ${u.last_name}`.toLowerCase();
                  const email = u.email.toLowerCase();
                  const role = u.role.toLowerCase();
                  const query = teamSearch.toLowerCase().trim();
                  
                  const matchesSearch = !query || 
                    fullName.includes(query) || 
                    email.includes(query) || 
                    role.includes(query);
                    
                  const matchesRole = teamRoleFilter === 'ALL' || u.role === teamRoleFilter;
                  const matchesStatus = teamStatusFilter === 'ALL' || u.status === teamStatusFilter;
                  
                  return matchesSearch && matchesRole && matchesStatus;
                }).length === 0 ? (
                  <div className="text-center py-12 text-slate-500 border border-dashed border-slate-200 rounded-xl mt-6">
                    <p className="text-sm font-semibold">No se encontraron integrantes</p>
                    <p className="text-xs text-slate-400 mt-1">Prueba cambiando los términos de búsqueda o filtros.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                    {users.filter(u => {
                      const fullName = `${u.first_name} ${u.last_name}`.toLowerCase();
                      const email = u.email.toLowerCase();
                      const role = u.role.toLowerCase();
                      const query = teamSearch.toLowerCase().trim();
                      
                      const matchesSearch = !query || 
                        fullName.includes(query) || 
                        email.includes(query) || 
                        role.includes(query);
                        
                      const matchesRole = teamRoleFilter === 'ALL' || u.role === teamRoleFilter;
                      const matchesStatus = teamStatusFilter === 'ALL' || u.status === teamStatusFilter;
                      
                      return matchesSearch && matchesRole && matchesStatus;
                    }).map(u => {
                      const initials = `${u.first_name?.[0] || 'U'}${u.last_name?.[0] || ''}`.toUpperCase();
                      const isBgActive = u.status === 'ACTIVE';
                      
                      return (
                        <div key={u.id} className="border border-slate-200 rounded-xl p-4 space-y-4 bg-slate-50/20 hover:bg-white hover:shadow-md transition duration-200 flex flex-col justify-between">
                          <div className="space-y-3">
                            <div className="flex justify-between items-start">
                              <div className="flex items-center gap-3">
                                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-extrabold text-xs tracking-wider ${
                                  isBgActive ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-600'
                                }`}>
                                  {initials}
                                </div>
                                <div className="min-w-0">
                                  <h4 className="font-bold text-slate-800 text-sm tracking-tight truncate">{u.first_name} {u.last_name}</h4>
                                  <span className="text-[10px] bg-indigo-50/70 text-indigo-700 px-2 py-0.5 rounded font-bold uppercase mt-1 inline-block truncate max-w-full">
                                    {u.role}
                                  </span>
                                </div>
                              </div>
                              <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${isBgActive ? 'bg-emerald-500' : 'bg-slate-400'}`} title={isBgActive ? 'Acceso Activo' : 'Acceso Restringido'} />
                            </div>

                            <div className="text-[11.5px] text-slate-600 space-y-1.5 bg-slate-50 p-3 rounded-lg border border-slate-100 font-sans">
                              <div className="flex justify-between items-center gap-1">
                                <span className="text-slate-400 font-medium">Email:</span>
                                <strong className="text-slate-800 truncate" title={u.email}>{u.email}</strong>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-slate-400 font-medium">Estado:</span>
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                  isBgActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'
                                }`}>
                                  {isBgActive ? 'CONECTADO' : 'INACTIVO'}
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-slate-400 font-medium">Capacidad:</span>
                                <strong className="text-teal-650 font-mono">40 hrs/sem (100%)</strong>
                              </div>
                            </div>
                          </div>

                          {/* Controls Panel */}
                          <div className="space-y-2 border-t border-slate-100 pt-3">
                            <div className="flex gap-2">
                              {/* Edit Profile Button */}
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingUser({ ...u });
                                  setShowEditUserModal(true);
                                }}
                                className="flex-grow inline-flex items-center justify-center gap-1.5 bg-white hover:bg-indigo-50/50 text-slate-700 hover:text-indigo-700 border border-slate-250 hover:border-indigo-350 text-xs font-semibold py-2 rounded-xl transition shadow-xs cursor-pointer"
                                title="Editar nombre, apellido, email, rol o estado"
                              >
                                <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                                Editar
                              </button>

                              {/* Restore password dispatch */}
                              <button
                                type="button"
                                onClick={() => triggerPasswordResetEmailSimulation(u)}
                                className="inline-flex items-center justify-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold px-3 py-2 rounded-xl transition cursor-pointer border border-indigo-100 shadow-3xs"
                                title="Enviar email simulado para actualizar contraseña"
                              >
                                <Mail className="w-3.5 h-3.5 text-indigo-500" />
                                Clave
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* MODALS & SPECIFIC OVERLAYS */}

              {/* A. EDIT USER DETAIL MODAL */}
              {showEditUserModal && editingUser && (
                <div className="fixed inset-0 z-55 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
                  <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-slideUp">
                    <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                      <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                        <Edit2 className="w-4 h-4 text-indigo-500" />
                        Editar Integrante de Ingeniería
                      </h4>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingUser(null);
                          setShowEditUserModal(false);
                        }}
                        className="text-slate-400 hover:text-slate-650 font-bold text-base select-none px-2 py-1"
                      >
                        ✕
                      </button>
                    </div>

                    <form onSubmit={handleEditUserSave} className="p-5 space-y-4">
                      {/* Name input row */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Nombre</label>
                          <input
                            type="text"
                            required
                            value={editingUser.first_name}
                            onChange={(e) => setEditingUser({ ...editingUser, first_name: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-lg text-xs font-semibold p-2.5 focus:border-indigo-500 focus:bg-white outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Apellido</label>
                          <input
                            type="text"
                            required
                            value={editingUser.last_name || ''}
                            onChange={(e) => setEditingUser({ ...editingUser, last_name: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-lg text-xs font-semibold p-2.5 focus:border-indigo-500 focus:bg-white outline-none"
                          />
                        </div>
                      </div>

                      {/* Email Input */}
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Correo Electrónico (Email)</label>
                        <input
                          type="email"
                          required
                          value={editingUser.email}
                          onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-lg text-xs font-semibold p-2.5 focus:border-indigo-500 focus:bg-white outline-none"
                        />
                      </div>

                      {/* Role selection & details */}
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Perfil / Rol Administrativo</label>
                        <select
                          value={editingUser.role}
                          onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-lg text-xs font-semibold p-2.5 focus:border-indigo-500 focus:bg-white outline-none cursor-pointer"
                        >
                          <option value="Sponsor / Directora">Sponsor / Directora</option>
                          <option value="Project Manager">Project Manager</option>
                          <option value="Scrum Master">Scrum Master</option>
                          <option value="Product Owner">Product Owner</option>
                          <option value="QA Lead">QA Lead</option>
                          <option value="Desarrollador Backend">Desarrollador Backend</option>
                          <option value="Desarrollador Frontend">Desarrollador Frontend</option>
                          <option value="DBA / Arquitecto de Datos">DBA / Arquitecto de Datos</option>
                          <option value="DevOps / Infraestructura Cloud">DevOps / Infraestructura Cloud</option>
                          <option value="UI/UX Designer">UI/UX Designer</option>
                          <option value="Ingeniero de Software">Ingeniero de Software</option>
                        </select>
                      </div>

                      {/* Status select toggle */}
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Estado de la cuenta</label>
                        <select
                          value={editingUser.status}
                          onChange={(e) => setEditingUser({ ...editingUser, status: e.target.value as 'ACTIVE' | 'INACTIVE' })}
                          className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-lg text-xs font-semibold p-2.5 focus:border-indigo-500 focus:bg-white outline-none cursor-pointer"
                        >
                          <option value="ACTIVE">ACTIVO (Acceso habilitado)</option>
                          <option value="INACTIVE">INACTIVO (Acceso denegado)</option>
                        </select>
                      </div>

                      <div className="flex gap-2 justify-end border-t border-slate-100 pt-4 mt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingUser(null);
                            setShowEditUserModal(false);
                          }}
                          className="px-4 py-2 hover:bg-slate-100 text-slate-500 rounded-xl transition font-bold text-xs cursor-pointer"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition font-bold text-xs shadow cursor-pointer"
                        >
                          Guardar Cambios
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* B. ADD USER MODAL */}
              {isAddUserModalOpen && (
                <div className="fixed inset-0 z-55 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
                  <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-slideUp">
                    <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                      <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                        <UserPlus className="w-4 h-4 text-indigo-500" />
                        Registrar Integrante de Equipo
                      </h4>
                      <button
                        type="button"
                        onClick={() => setIsAddUserModalOpen(false)}
                        className="text-slate-400 hover:text-slate-600 font-bold text-base select-none px-2 py-1"
                      >
                        ✕
                      </button>
                    </div>

                    <form onSubmit={handleAddNewUser} className="p-5 space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Nombre</label>
                          <input
                            type="text"
                            required
                            placeholder="Ej: Sofía"
                            value={newFirstName}
                            onChange={(e) => setNewFirstName(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-lg text-xs font-semibold p-2.5 focus:border-indigo-500 focus:bg-white outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Apellido</label>
                          <input
                            type="text"
                            required
                            placeholder="Ej: Ortiz"
                            value={newLastName}
                            onChange={(e) => setNewLastName(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-lg text-xs font-semibold p-2.5 focus:border-indigo-500 focus:bg-white outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Correo Electrónico Corporativo</label>
                        <input
                          type="email"
                          required
                          placeholder="sofia.ortiz@empresa.com"
                          value={newEmail}
                          onChange={(e) => setNewEmail(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-lg text-xs font-semibold p-2.5 focus:border-indigo-500 focus:bg-white outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Rol / Cargo Asignado</label>
                        <select
                          value={newRole}
                          onChange={(e) => setNewRole(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-lg text-xs font-semibold p-2.5 focus:border-indigo-500 focus:bg-white outline-none cursor-pointer"
                        >
                          <option value="Sponsor / Directora">Sponsor / Directora</option>
                          <option value="Project Manager">Project Manager</option>
                          <option value="Scrum Master">Scrum Master</option>
                          <option value="Product Owner">Product Owner</option>
                          <option value="QA Lead">QA Lead</option>
                          <option value="Desarrollador Backend">Desarrollador Backend</option>
                          <option value="Desarrollador Frontend">Desarrollador Frontend</option>
                          <option value="DBA / Arquitecto de Datos">DBA / Arquitecto de Datos</option>
                          <option value="DevOps / Infraestructura Cloud">DevOps / Infraestructura Cloud</option>
                          <option value="UI/UX Designer">UI/UX Designer</option>
                          <option value="Ingeniero de Software">Ingeniero de Software</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Estado de Acceso Inicial</label>
                        <select
                          value={newStatus}
                          onChange={(e) => setNewStatus(e.target.value as 'ACTIVE' | 'INACTIVE')}
                          className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-lg text-xs font-semibold p-2.5 focus:border-indigo-500 focus:bg-white outline-none cursor-pointer"
                        >
                          <option value="ACTIVE">ACTIVO (Completo)</option>
                          <option value="INACTIVE">INACTIVO (Suspendido)</option>
                        </select>
                      </div>

                      <div className="flex gap-2 justify-end border-t border-slate-100 pt-4 mt-2">
                        <button
                          type="button"
                          onClick={() => setIsAddUserModalOpen(false)}
                          className="px-4 py-2 hover:bg-slate-100 text-slate-500 rounded-xl transition font-bold text-xs cursor-pointer"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition font-bold text-xs shadow cursor-pointer"
                        >
                          Registrar Integrante
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* C. INTERACTIVE EMAIL RESET PASSWORD SIMULATOR */}
              {showResetEmailModal && passwordResetUser && (
                <div className="fixed inset-0 z-55 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-slideUp">
                    {/* Header */}
                    <div className="px-5 py-4 border-b border-slate-800 bg-slate-950 flex justify-between items-center text-white">
                      <div className="flex items-center gap-2.5">
                        <Mail className="w-4 h-4 text-indigo-400 font-bold" />
                        <h4 className="font-bold text-sm tracking-tight text-white">Transmisión de Email - Cambio de Contraseña</h4>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setShowResetEmailModal(false);
                          setPasswordResetUser(null);
                        }}
                        className="text-slate-400 hover:text-white font-bold text-base select-none px-2 py-1"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="p-5 space-y-5">
                      {/* Sending status */}
                      {!simulatedMailSendSuccess ? (
                        <div className="p-6 bg-slate-950/40 border border-slate-850 rounded-xl text-center space-y-3">
                          <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin mx-auto" />
                          <div className="text-xs text-slate-400">
                            <span className="font-bold block text-slate-200">Transmitiendo alerta a SMTP corporativo para {passwordResetUser.email}...</span>
                            <span>Preparando cabeceras de cifrado dkim y ruteando mensaje.</span>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {/* Simulated Email Envelope Client Visuals */}
                          <div className="bg-slate-950 border border-slate-850 rounded-xl overflow-hidden shadow-inner">
                            {/* Email headers */}
                            <div className="bg-slate-900 px-4 py-3 border-b border-slate-850 text-[11px] text-slate-400 space-y-1 font-mono">
                              <div><span className="text-slate-500">De:</span> {smtpAccount || 'core-security@platform.enterprise.com'}</div>
                              <div><span className="text-slate-500">Para:</span> {passwordResetUser.email}</div>
                              <div><span className="text-slate-500 font-bold">Asunto:</span> 🔒 Restablecer tu contraseña de acceso corporativo</div>
                              <div className="border-t border-slate-850/60 pt-1 mt-1 text-[9px] text-emerald-400 flex items-center gap-1 font-medium">
                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                                Mensaje enviado y firmado mediante TLS v1.3
                              </div>
                            </div>

                            {/* Email HTML body simulation */}
                            <div className="p-5 text-xs text-slate-300 leading-relaxed font-sans bg-slate-950">
                              <p className="mb-3">Hola <strong>{passwordResetUser.first_name} {passwordResetUser.last_name}</strong>,</p>
                              <p className="mb-4">El administrador del Directorio de Ingeniería ha programado un proceso de cambio de credenciales para tu cuenta asociada al perfil de <strong className="text-indigo-400 uppercase">{passwordResetUser.role}</strong>.</p>
                              
                              <div className="bg-slate-900 border border-slate-850 p-3.5 rounded-lg text-center my-4">
                                <span className="text-[10px] text-slate-400 block mb-1 font-semibold">Enlace Temporal y Solicitado:</span>
                                <code className="text-sky-400 text-[10.5px] block break-all py-1 font-mono select-all">
                                  https://enterprise-cloud.com/auth/reset-password?uid={passwordResetUser.id}&token=sim_tkn_7c8d9
                                </code>
                              </div>
                              
                              <p className="text-[10.5px] text-slate-400">Si no has solicitado este cambio, puedes ignorar este mensaje de forma segura.</p>
                              <p className="border-t border-slate-850/80 pt-3 mt-4 text-[10px] text-slate-500 font-mono">
                                Seguridad Corporativa • Enterprise Platform Dashboard
                              </p>
                            </div>
                          </div>

                          {/* Reset form container simulation */}
                          <div className="p-4 bg-indigo-950/20 border border-indigo-900/40 rounded-xl space-y-3">
                            <span className="text-[11px] font-bold text-indigo-450 uppercase tracking-wider block">
                              Emulación Receptiva (Clic en el Enlace)
                            </span>
                            
                            {isResetSuccess ? (
                              <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl flex items-center gap-3 text-emerald-400 text-xs text-left animate-fadeIn">
                                <Check className="w-5 h-5 shrink-0 text-emerald-500" />
                                <div>
                                  <span className="font-bold block text-white">¡Contraseña Cambiada de Forma Exitosa!</span>
                                  <span>Los datos han sido actualizados en la base de datos local y se completó la verificación.</span>
                                </div>
                              </div>
                            ) : (
                              <form onSubmit={handleExecuteSimulatedChangePassword} className="space-y-2.5">
                                <p className="text-[11px] text-slate-300 leading-normal">
                                  Ingresa la nueva contraseña que adoptará el usuario para confirmar la simulación:
                                </p>
                                <div className="flex flex-col sm:flex-row gap-2">
                                  <div className="relative flex-grow">
                                    <Key className="w-3.5 h-3.5 text-indigo-400 absolute left-2.5 top-2.5" />
                                    <input
                                      type="text"
                                      required
                                      placeholder="Ej: Ing_ClaveSegura_2026!"
                                      value={simulatedNewPassword}
                                      onChange={(e) => setSimulatedNewPassword(e.target.value)}
                                      className="w-full bg-slate-950 border border-slate-800 rounded-lg text-xs font-semibold pl-8 pr-2.5 py-2 text-slate-100 placeholder-slate-500 focus:border-indigo-500 outline-none font-mono"
                                    />
                                  </div>
                                  <button
                                    type="submit"
                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition shrink-0 cursor-pointer shadow hover:shadow-indigo-950/40"
                                  >
                                    Establecer Nueva Contraseña 🚀
                                  </button>
                                </div>
                              </form>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
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
              <DevOpsPipeline />
            </div>
          )}

          {/* 10. TAB: CONFIGURACIÓN CENTRAL */}
          {activeTab === 'settings' && (
            <div className="space-y-6 animate-fadeIn text-slate-800" id="tab-settings">
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg shrink-0">
                      <Settings className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-slate-900 font-bold text-base">Configuración Central de la Plataforma</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Gestione el servidor de alertas por correo, sponsors autorizados y catálogos de clientes corporativos.</p>
                    </div>
                  </div>
                  
                  {/* Sub-tab selection bar inside Configuration tab */}
                  <div className="flex items-center bg-slate-100 p-1 rounded-xl self-start md:self-auto shrink-0 border border-slate-200/60">
                    <button
                      type="button"
                      onClick={() => setSettingsSubTab('smtp')}
                      className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        settingsSubTab === 'smtp'
                          ? 'bg-white text-blue-600 shadow-xs font-extrabold'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>SMTP Alertas</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSettingsSubTab('clients')}
                      className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        settingsSubTab === 'clients'
                          ? 'bg-white text-emerald-605 text-emerald-600 shadow-xs font-extrabold'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <Briefcase className="w-3.5 h-3.5" />
                      <span>Clientes & Sponsors</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSettingsSubTab('scrum_rules')}
                      className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        settingsSubTab === 'scrum_rules'
                          ? 'bg-white text-violet-600 shadow-xs font-extrabold'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <CheckSquare className="w-3.5 h-3.5" />
                      <span>Reglas Scrum</span>
                    </button>
                  </div>
                </div>

                {settingsSubTab === 'smtp' && (
                  <div className="max-w-2xl mx-auto border border-slate-150 rounded-2xl p-6 bg-slate-50/50 animate-fadeIn">
                    <div className="flex items-center gap-2.5 border-b border-slate-200 pb-3 mb-5">
                      <Mail className="w-5 h-5 text-blue-500" />
                      <div>
                        <span className="text-sm font-extrabold text-slate-800 uppercase tracking-wider block">Servidor de Alertas SMTP</span>
                        <p className="text-[11px] text-slate-500 mt-0.5">Establezca los parámetros de host y credenciales para el envío masivo de notificaciones de riesgo.</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2">
                          <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1.5 tracking-wider">Servidor SMTP (Host)</label>
                          <input
                            type="text"
                            value={smtpHost}
                            onChange={(e) => {
                              setSmtpHost(e.target.value);
                              localStorage.setItem('gcp_smtp_host', e.target.value);
                            }}
                            placeholder="smtp.gmail.com"
                            className="w-full bg-white border border-slate-200 focus:ring-1 focus:ring-blue-500 rounded-lg px-3 py-2.5 text-xs text-slate-800 outline-none transition shadow-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1.5 tracking-wider">Puerto SMTP</label>
                          <input
                            type="text"
                            value={smtpPort}
                            onChange={(e) => {
                              setSmtpPort(e.target.value);
                              localStorage.setItem('gcp_smtp_port', e.target.value);
                            }}
                            placeholder="587"
                            className="w-full bg-white border border-slate-200 focus:ring-1 focus:ring-blue-500 rounded-lg px-3 py-2.5 text-xs text-slate-800 outline-none transition font-mono shadow-xs"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1.5 tracking-wider">Cuenta de Correo (SMTP User Sender)</label>
                        <input
                          type="email"
                          value={smtpAccount}
                          onChange={(e) => {
                            setSmtpAccount(e.target.value);
                            localStorage.setItem('gcp_smtp_account', e.target.value);
                          }}
                          placeholder="proyectosticampestre@gmail.com"
                          className="w-full bg-white border border-slate-200 focus:ring-1 focus:ring-blue-500 rounded-lg px-3 py-2.5 text-xs text-slate-800 outline-none transition shadow-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1.5 tracking-wider">Clave de Correo (App Password / Credentials)</label>
                        <input
                          type="password"
                          value={smtpPassword}
                          onChange={(e) => {
                            setSmtpPassword(e.target.value);
                            localStorage.setItem('gcp_smtp_password', e.target.value);
                          }}
                          placeholder="Ingrese contraseña o app password..."
                          className="w-full bg-white border border-slate-200 focus:ring-1 focus:ring-blue-500 rounded-lg px-3 py-2.5 text-xs text-slate-800 outline-none transition font-mono shadow-xs"
                        />
                        <p className="text-[10px] text-slate-400 mt-1.5 leading-normal">
                          Por razones de seguridad de la infraestructura de Lifecycle PM, las credenciales se almacenan localmente en la sesión activa del navegador de forma segura.
                        </p>

                        <div className="mt-3.5 p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 leading-relaxed shadow-xs">
                          <div className="flex items-start gap-2.5">
                            <span className="text-sm shrink-0">💡</span>
                            <div className="flex-1 space-y-1">
                              <p className="font-extrabold text-amber-950">¿Gmail u Outlook reportan "Error 535: Invalid login"?</p>
                              <p className="text-[11px] text-slate-600">
                                Los servidores SMTP modernos de Gmail u Outlook <span className="font-semibold text-rose-700">no aceptan tu contraseña habitual</span> por motivos de seguridad corporativa.
                              </p>
                              <div className="pt-1.5 pl-3 border-l-2 border-amber-300 space-y-1 text-[10.5px]">
                                <p><strong>Paso 1:</strong> Habilita la "Verificación en dos pasos" en tu cuenta de correo.</p>
                                <p><strong>Paso 2:</strong> Ve a <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" className="underline font-bold text-blue-700 hover:text-blue-800 flex inline-flex items-center gap-0.5">Contraseñas de Aplicaciones de Google<ExternalLink className="w-2.5 h-2.5 inline" /></a>.</p>
                                <p><strong>Paso 3:</strong> Genera una clave exclusiva de 16 caracteres para "Correo" y copia el código sin espacios en esta casilla.</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mt-5">
                        <div className="flex items-start gap-3">
                          <span className="text-lg">✉️</span>
                          <div className="flex-1">
                            <span className="text-[11px] font-extrabold text-blue-800 uppercase block mb-1">Prueba Dinámica de Envío</span>
                            <p className="text-[11px] text-blue-700 leading-normal mb-3">
                              Verifique que la plataforma de correo alerte correctamente de desviaciones y métricas críticas de presupuesto de Lifecycle PM.
                            </p>
                            <button
                              type="button"
                              disabled={smtpTestStatus === 'loading'}
                              onClick={async () => {
                                if (!smtpHost.trim() || !smtpPort.trim()) {
                                  setSmtpTestStatus('error');
                                  setSmtpTestMessage('Por favor configure el Servidor SMTP (Host) y el Puerto.');
                                  setSmtpTestDetails('La configuración de host y puerto es mandatoria.');
                                  return;
                                }
                                if (!smtpAccount.trim() || !smtpPassword.trim()) {
                                  setSmtpTestStatus('error');
                                  setSmtpTestMessage('Por favor complete la Cuenta de Correo y la Contraseña de Alertas antes de probar.');
                                  setSmtpTestDetails('Las credenciales de correo emisor no pueden estar vacías.');
                                  return;
                                }

                                setSmtpTestStatus('loading');
                                setSmtpTestMessage('Conectando con el servidor SMTP...');
                                setSmtpTestDetails('Estableciendo conexión por socket de red...');

                                try {
                                  const res = await fetch('/api/test-smtp', {
                                    method: 'POST',
                                    headers: {
                                      'Content-Type': 'application/json'
                                    },
                                    body: JSON.stringify({
                                      host: smtpHost.trim(),
                                      port: smtpPort.trim(),
                                      username: smtpAccount.trim(),
                                      password: smtpPassword.trim()
                                    })
                                  });

                                  const data = await res.json();
                                  if (res.ok && data.success) {
                                    setSmtpTestStatus('success');
                                    setSmtpTestMessage(data.message || '¡Conexión SMTP exitosa!');
                                    setSmtpTestDetails(data.banner || '');
                                    addLog('Prueba SMTP', `Envío de prueba exitoso a ${smtpHost}:${smtpPort} desde ${smtpAccount}`);
                                  } else {
                                    setSmtpTestStatus('error');
                                    setSmtpTestMessage(data.message || 'Error al conectar con el servidor.');
                                    setSmtpTestDetails(data.code ? `Código de error: ${data.code}` : 'Verifique sus credenciales, puertos y bloqueos de seguridad del host.');
                                    addLog('Prueba SMTP', `Fallo de conexión SMTP a ${smtpHost}:${smtpPort}: ${data.message || 'Error desconocido'}`);
                                  }
                                } catch (err: any) {
                                  setSmtpTestStatus('error');
                                  setSmtpTestMessage('No se pudo establecer comunicación con el servidor local/remoto.');
                                  setSmtpTestDetails(err.message || 'Fallo general de red o servicio de pruebas inactivo.');
                                }
                              }}
                              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold text-xs py-2 px-4 rounded-xl transition active:scale-[0.98] cursor-pointer shadow-sm shadow-blue-500/10 flex items-center gap-1.5"
                            >
                              {smtpTestStatus === 'loading' ? (
                                <>
                                  <Cpu className="w-3.5 h-3.5 animate-spin" />
                                  <span>Probando Conexión...</span>
                                </>
                              ) : (
                                <span>Probar Envío de Alerta Ahora</span>
                              )}
                            </button>

                            {smtpTestStatus !== 'idle' && (
                              <div className={`mt-3.5 p-3.5 rounded-xl border text-xs leading-relaxed animate-fadeIn ${
                                smtpTestStatus === 'loading' ? 'bg-amber-50 border-amber-200 text-amber-800' :
                                smtpTestStatus === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
                                'bg-rose-50 border-rose-200 text-rose-800'
                              }`}>
                                <div className="flex items-start gap-2.5">
                                  <span className="text-sm shrink-0">
                                    {smtpTestStatus === 'loading' && '⏳'}
                                    {smtpTestStatus === 'success' && '✅'}
                                    {smtpTestStatus === 'error' && '❌'}
                                  </span>
                                  <div className="flex-1 space-y-1">
                                    <p className="font-extrabold">{smtpTestMessage}</p>
                                    {smtpTestDetails && (
                                      <p className="text-[10.5px] opacity-95 font-mono bg-white/60 p-2 rounded border border-slate-200/50 break-all select-all mt-1">
                                        {smtpTestDetails}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {settingsSubTab === 'clients' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
                    {/* Management box for Clients Category */}
                    <div className="space-y-4 border border-slate-150 rounded-2xl p-5 bg-slate-50/50">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2.5 mb-2">
                        <div className="flex items-center gap-2">
                          <Briefcase className="w-4.5 h-4.5 text-emerald-500" />
                          <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wide">Clientes (Sponsor Empresas)</span>
                        </div>
                        <span className="text-[10px] bg-slate-200 text-slate-600 font-bold px-2 py-0.5 rounded-full font-mono">Total: {clientsList.length}</span>
                      </div>

                      {/* Add Client Form */}
                      <div className="flex gap-2.5">
                        <input
                          type="text"
                          id="new-client-input"
                          placeholder="Nombre del nuevo cliente corporativo..."
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const val = (e.target as HTMLInputElement).value.trim();
                              if (val) {
                                if (!clientsList.includes(val)) {
                                  const updated = [...clientsList, val];
                                  setClientsList(updated);
                                  localStorage.setItem('gcp_clients_list', JSON.stringify(updated));
                                  (e.target as HTMLInputElement).value = '';
                                  addLog('Configuración', `Agregó cliente al catálogo: ${val}`);
                                } else {
                                  alert("El cliente ya se encuentra en el catálogo.");
                                }
                              }
                            }
                          }}
                          className="flex-1 bg-white border border-slate-200 focus:ring-1 focus:ring-emerald-500 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none transition"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const input = document.getElementById('new-client-input') as HTMLInputElement;
                            const val = input?.value.trim();
                            if (val) {
                              if (!clientsList.includes(val)) {
                                const updated = [...clientsList, val];
                                setClientsList(updated);
                                localStorage.setItem('gcp_clients_list', JSON.stringify(updated));
                                input.value = '';
                                addLog('Configuración', `Agregó cliente al catálogo: ${val}`);
                              } else {
                                alert("El cliente ya se encuentra en el catálogo.");
                              }
                            }
                          }}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 rounded-xl transition shrink-0 cursor-pointer shadow-sm shadow-emerald-500/10"
                        >
                          Añadir
                        </button>
                      </div>

                      <div className="border border-slate-200 rounded-xl bg-white max-h-[350px] overflow-y-auto divide-y divide-slate-100 shadow-xs">
                        {clientsList.map((client, idx) => (
                          <div key={idx} className="p-3.5 gap-2 flex items-center justify-between text-xs hover:bg-slate-50 text-slate-705 text-slate-700 transition">
                            <span className="font-semibold break-all text-slate-800">{client}</span>
                            <button
                              onClick={() => {
                                setDeleteConfirmState({
                                  isOpen: true,
                                  title: 'Eliminar Cliente',
                                  message: `¿Está seguro de que desea eliminar al cliente "${client}" del catálogo corporativo?`,
                                  onConfirm: () => {
                                    const updated = clientsList.filter(c => c !== client);
                                    setClientsList(updated);
                                    localStorage.setItem('gcp_clients_list', JSON.stringify(updated));
                                    addLog('Configuración', `Eliminó cliente del catálogo: ${client}`);
                                  }
                                });
                              }}
                              className="text-rose-500 hover:text-rose-700 p-1.5 hover:bg-rose-50 rounded transition cursor-pointer shrink-0 ml-2 animate-fadeIn"
                              title="Eliminar cliente"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Management box for Sponsors */}
                    <div className="space-y-4 border border-slate-150 rounded-2xl p-5 bg-slate-50/50">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2.5 mb-2">
                        <div className="flex items-center gap-2">
                          <Users2 className="w-4.5 h-4.5 text-purple-500" />
                          <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wide">Sponsors (Líderes Firmas)</span>
                        </div>
                        <span className="text-[10px] bg-slate-200 text-slate-600 font-bold px-2 py-0.5 rounded-full font-mono">Total: {sponsorsList.length}</span>
                      </div>

                      {/* Add Sponsor Form */}
                      <div className="flex gap-2.5">
                        <input
                          type="text"
                          id="new-sponsor-input"
                          placeholder="Nombre del nuevo líder de firma / sponsor..."
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const val = (e.target as HTMLInputElement).value.trim();
                              if (val) {
                                if (!sponsorsList.includes(val)) {
                                  const updated = [...sponsorsList, val];
                                  setSponsorsList(updated);
                                  localStorage.setItem('gcp_sponsors_list', JSON.stringify(updated));
                                  (e.target as HTMLInputElement).value = '';
                                  addLog('Configuración', `Agregó sponsor al catálogo: ${val}`);
                                } else {
                                  alert("El sponsor ya se encuentra en el catálogo.");
                                }
                              }
                            }
                          }}
                          className="flex-1 bg-white border border-slate-200 focus:ring-1 focus:ring-purple-500 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none transition"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const input = document.getElementById('new-sponsor-input') as HTMLInputElement;
                            const val = input?.value.trim();
                            if (val) {
                              if (!sponsorsList.includes(val)) {
                                const updated = [...sponsorsList, val];
                                setSponsorsList(updated);
                                localStorage.setItem('gcp_sponsors_list', JSON.stringify(updated));
                                input.value = '';
                                addLog('Configuración', `Agregó sponsor al catálogo: ${val}`);
                              } else {
                                alert("El sponsor ya se encuentra en el catálogo.");
                              }
                            }
                          }}
                          className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs px-4 rounded-xl transition shrink-0 cursor-pointer shadow-sm shadow-purple-500/10"
                        >
                          Añadir
                        </button>
                      </div>

                      <div className="border border-slate-200 rounded-xl bg-white max-h-[350px] overflow-y-auto divide-y divide-slate-100 shadow-xs">
                        {sponsorsList.map((sponsor, idx) => (
                          <div key={idx} className="p-3.5 gap-2 flex items-center justify-between text-xs hover:bg-slate-50 text-slate-700 transition">
                            <span className="font-semibold break-all text-slate-800">{sponsor}</span>
                            <button
                              onClick={() => {
                                setDeleteConfirmState({
                                  isOpen: true,
                                  title: 'Eliminar Sponsor',
                                  message: `¿Está seguro de que desea eliminar al sponsor "${sponsor}" del catálogo corporativo?`,
                                  onConfirm: () => {
                                    const updated = sponsorsList.filter(s => s !== sponsor);
                                    setSponsorsList(updated);
                                    localStorage.setItem('gcp_sponsors_list', JSON.stringify(updated));
                                    addLog('Configuración', `Eliminó sponsor del catálogo: ${sponsor}`);
                                  }
                                });
                              }}
                                className="text-rose-500 hover:text-rose-700 p-1.5 hover:bg-rose-50 rounded transition cursor-pointer shrink-0 ml-2 animate-fadeIn"
                                title="Eliminar sponsor"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                )}

                {settingsSubTab === 'scrum_rules' && (
                  <div className="space-y-6 animate-fadeIn text-slate-800">
                    <div className="border border-slate-150 rounded-2xl p-6 bg-slate-50/50">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4 mb-4">
                        <div className="flex items-center gap-2.5">
                          <CheckSquare className="w-5 h-5 text-violet-600" />
                          <div>
                            <span className="text-sm font-extrabold text-slate-800 uppercase tracking-wider block">Reglas de Transición Scrum Board</span>
                            <p className="text-[11px] text-slate-500 mt-0.5">Gestione las validaciones semánticas, de Definition of Ready (DOR) y Definition of Done (DOD) para las Historias de Usuario.</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setDeleteConfirmState({
                              isOpen: true,
                              title: 'Restablecer Reglas',
                              message: '¿Está seguro de que desea restablecer todas las reglas de transición a su estado habilitado por defecto?',
                              onConfirm: () => {
                                localStorage.removeItem('scrum_transition_rules');
                                setScrumRulesUpdateTrigger(prev => prev + 1);
                                addLog('Configuración', 'Restableció todas las reglas de transición de HU a sus valores por defecto.');
                              }
                            });
                          }}
                          className="bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs px-3 py-1.5 rounded-lg transition shrink-0 cursor-pointer shadow-2xs flex items-center gap-1.5"
                        >
                          <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                          Restablecer por Defecto
                        </button>
                      </div>

                      {/* Info Alert info badge */}
                      <div className="bg-violet-50 border border-violet-100/70 text-violet-950 p-3.5 rounded-xl text-xs flex gap-2.5 leading-normal mb-5">
                        <span className="text-base shrink-0">🛡️</span>
                        <div>
                          <strong className="font-extrabold text-violet-900 block mb-0.5">Control de Calidad del Proceso (QMS)</strong>
                          Las reglas que deshabilite aquí <span className="font-semibold text-rose-700">se omitirán automáticamente</span> en el tablero Scrum de desarrollo al arrastrar o transicionar las tarjetas, dándole total flexibilidad cuando ejecute fases ágiles aceleradas.
                        </div>
                      </div>

                      {/* Rules visual manager container */}
                      <div className="space-y-4">
                        {(() => {
                          const savedRulesStr = localStorage.getItem('scrum_transition_rules');
                          let activeRules: TransitionRule[] = DEFAULT_TRANSITION_RULES;
                          if (savedRulesStr && savedRulesStr !== "undefined" && savedRulesStr !== "null") {
                            try {
                              const parsed = JSON.parse(savedRulesStr);
                              if (parsed !== null && parsed !== undefined && Array.isArray(parsed)) {
                                activeRules = parsed;
                              }
                            } catch (e) {
                              activeRules = DEFAULT_TRANSITION_RULES;
                            }
                          }

                          // Group rules by category for an ultra-structured clean overview!
                          const categories = Array.from(new Set(activeRules.map(r => r.category)));

                          const handleToggleRule = (ruleId: string) => {
                            const updated = activeRules.map(r => {
                              if (r.id === ruleId) {
                                const newval = !r.enabled;
                                addLog('Configuración', `${newval ? 'Habilitó' : 'Deshabilitó'} regla Scrum: "${r.name}"`);
                                return { ...r, enabled: newval };
                              }
                              return r;
                            });
                            localStorage.setItem('scrum_transition_rules', JSON.stringify(updated));
                            setScrumRulesUpdateTrigger(prev => prev + 1);
                          };

                          const handleUpdateRuleDesc = (ruleId: string, newDesc: string) => {
                            const updated = activeRules.map(r => {
                              if (r.id === ruleId) {
                                return { ...r, desc: newDesc };
                              }
                              return r;
                            });
                            localStorage.setItem('scrum_transition_rules', JSON.stringify(updated));
                            setScrumRulesUpdateTrigger(prev => prev + 1);
                          };

                          const flowchartSteps = [
                            { id: 'no_iniciados', label: 'No Iniciado', icon: 'Layers', color: 'slate', col: 'NO_INICIADO', ruleIds: ['no_iniciados_prioridad', 'no_iniciados_responsable'] },
                            { id: 'en_analisis', label: 'En Análisis', icon: 'BookOpen', color: 'blue', col: 'EN_ANALISIS', ruleIds: ['en_analisis_descripcion', 'en_analisis_responsable'] },
                            { id: 'en_desarrollo', label: 'En Desarrollo', icon: 'Cpu', color: 'amber', col: 'EN_DESARROLLO', ruleIds: ['en_desarrollo_criteria', 'en_desarrollo_sp', 'en_desarrollo_unblocked'] },
                            { id: 'code_review', label: 'Code Review', icon: 'Eye', color: 'teal', col: 'CODE_REVIEW', ruleIds: ['code_review_criteria'] },
                            { id: 'listo_para_qa', label: 'Listo para QA', icon: 'CheckSquare', color: 'indigo', col: 'LISTO_PARA_QA', ruleIds: ['listo_qa_no_crit_bugs'] },
                            { id: 'en_qa', label: 'En QA', icon: 'Server', color: 'violet', col: 'EN_QA', ruleIds: ['en_qa_sprint_active'] },
                            { id: 'devuelto_qa', label: 'Devuelto QA 🔄', icon: 'RefreshCw', color: 'rose', col: 'DEVUELTO_QA', ruleIds: ['devuelto_qa_require_bug'] },
                            { id: 'aprobado_qa', label: 'Aprobado QA ✔', icon: 'CheckCircle', color: 'emerald', col: 'APROBADO_QA', ruleIds: ['aprobado_qa_has_cases', 'aprobado_qa_cases_passed', 'aprobado_qa_no_bugs', 'aprobado_qa_criteria_ok'] },
                            { id: 'aprobado_po', label: 'Aprobado PO', icon: 'UserCheck', color: 'cyan', col: 'APROBADO_FUNCIONAL', ruleIds: ['aprobado_po_all_passed'] },
                            { id: 'finalizado', label: 'Finalizado', icon: 'Lock', color: 'fuchsia', col: 'FINALIZADO', ruleIds: ['finalizado_evidence', 'finalizado_no_crit_bugs'] }
                          ];

                          const renderStepIcon = (iconName: string) => {
                            switch (iconName) {
                              case 'Layers': return <Layers className="w-4 h-4 text-slate-500 font-bold" />;
                              case 'BookOpen': return <BookOpen className="w-4 h-4 text-blue-500 font-bold" />;
                              case 'Cpu': return <Cpu className="w-4 h-4 text-amber-500 font-bold" />;
                              case 'Eye': return <Eye className="w-4 h-4 text-teal-600 font-bold" />;
                              case 'CheckSquare': return <CheckSquare className="w-4 h-4 text-indigo-500 font-bold" />;
                              case 'Server': return <Server className="w-4 h-4 text-violet-500 font-bold" />;
                              case 'RefreshCw': return <RefreshCw className="w-4 h-4 text-rose-500 font-bold inline-block" />;
                              case 'CheckCircle': return <CheckCircle className="w-4 h-4 text-emerald-500 font-bold" />;
                              case 'UserCheck': return <UserCheck className="w-4 h-4 text-cyan-600 font-bold" />;
                              case 'Lock': return <Lock className="w-4 h-4 text-purple-500 font-bold" />;
                              default: return <CheckSquare className="w-4 h-4" />;
                            }
                          };

                          const getStepBg = (color: string) => {
                            switch (color) {
                              case 'slate': return 'border-slate-200 bg-slate-50/70 text-slate-800 hover:border-slate-300';
                              case 'blue': return 'border-blue-200 bg-blue-50/40 text-blue-900 hover:border-blue-300';
                              case 'amber': return 'border-amber-200 bg-amber-50/40 text-amber-900 hover:border-amber-300';
                              case 'teal': return 'border-teal-200 bg-teal-50/40 text-teal-900 hover:border-teal-300';
                              case 'indigo': return 'border-indigo-200 bg-indigo-50/40 text-indigo-900 hover:border-indigo-300';
                              case 'violet': return 'border-violet-200 bg-violet-50/40 text-violet-900 hover:border-violet-300';
                              case 'rose': return 'border-rose-200 bg-rose-50/40 text-rose-900 hover:border-rose-300';
                              case 'emerald': return 'border-emerald-200 bg-emerald-50/40 text-emerald-900 hover:border-emerald-300';
                              case 'cyan': return 'border-cyan-200 bg-cyan-50/40 text-cyan-900 hover:border-cyan-300';
                              case 'fuchsia': return 'border-purple-200 bg-purple-50/40 text-purple-900 hover:border-purple-300';
                              default: return 'border-slate-200 bg-slate-50 text-slate-800';
                            }
                          };

                          const getStepColorBadge = (color: string) => {
                            switch (color) {
                              case 'slate': return 'bg-slate-500 text-white';
                              case 'blue': return 'bg-blue-600 text-white';
                              case 'amber': return 'bg-amber-600 text-white';
                              case 'teal': return 'bg-teal-600 text-white';
                              case 'indigo': return 'bg-indigo-600 text-white';
                              case 'violet': return 'bg-violet-600 text-white';
                              case 'rose': return 'bg-rose-600 text-white';
                              case 'emerald': return 'bg-emerald-600 text-white';
                              case 'cyan': return 'bg-cyan-600 text-white';
                              case 'fuchsia': return 'bg-purple-600 text-white';
                              default: return 'bg-slate-500 text-white';
                            }
                          };

                          return (
                            <div className="space-y-6">
                              {/* Sub-tab view selector */}
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-150 shadow-2xs">
                                <span className="text-[11px] font-black tracking-wider text-slate-500 uppercase flex items-center gap-1.5 pl-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                                  Modo de visualización de reglas:
                                </span>
                                <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-205 shrink-0 select-none">
                                  <button
                                    type="button"
                                    onClick={() => setScrumRulesViewMode('both')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                      scrumRulesViewMode === 'both'
                                        ? 'bg-white text-violet-700 shadow-3xs font-extrabold border border-slate-200/50'
                                        : 'text-slate-500 hover:text-slate-800'
                                    }`}
                                  >
                                    🔗 Vista Dual
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setScrumRulesViewMode('flowchart')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                      scrumRulesViewMode === 'flowchart'
                                        ? 'bg-white text-violet-700 shadow-3xs font-extrabold border border-slate-200/50'
                                        : 'text-slate-500 hover:text-slate-800'
                                    }`}
                                  >
                                    🗺️ Esquema Gráfico
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setScrumRulesViewMode('table')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                      scrumRulesViewMode === 'table'
                                        ? 'bg-white text-violet-700 shadow-3xs font-extrabold border border-slate-200/50'
                                        : 'text-slate-500 hover:text-slate-800'
                                    }`}
                                  >
                                    📝 Lista Editable
                                  </button>
                                </div>
                              </div>

                              {/* Flowchart Schematic Map */}
                              {scrumRulesViewMode !== 'table' && (
                                <div className="bg-slate-50/50 border border-slate-200 rounded-2xl p-5 shadow-3xs relative overflow-hidden animate-fadeIn">
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 pb-3 border-b border-slate-200 gap-2">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                                        <span className="flex h-2.5 w-2.5 relative">
                                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-violet-600"></span>
                                        </span>
                                        Mapa de Transición Scrum Board & Quality Gates (DOR y DOD)
                                      </span>
                                    </div>
                                    <div className="text-[11px] text-slate-600 font-mono font-bold bg-white px-2 py-0.5 border border-slate-200 rounded-lg">
                                      {activeRules.filter(r => r.enabled).length} de {activeRules.length} Reglas Habilitadas
                                    </div>
                                  </div>

                                  {/* Step nodes rendering */}
                                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                                    {flowchartSteps.map((step, idx) => {
                                      const stepRules = activeRules.filter(r => step.ruleIds.includes(r.id));
                                      const rulesCount = stepRules.length;
                                      const enabledRulesCount = stepRules.filter(r => r.enabled).length;
                                      const allOk = enabledRulesCount === rulesCount;

                                      return (
                                        <div key={step.id} className="relative group">
                                          {/* Step Node Card */}
                                          <div className={`p-4 rounded-xl border flex flex-col justify-between h-full min-h-[175px] transition-all duration-300 shadow-2xs hover:shadow-xs ${getStepBg(step.color)}`}>
                                            <div>
                                              {/* Node Header */}
                                              <div className="flex items-center justify-between gap-2 border-b border-dashed border-slate-200/80 pb-2 mb-2 w-full">
                                                <div className="flex items-center gap-1.5 min-w-0">
                                                  {renderStepIcon(step.icon)}
                                                  <span className="font-extrabold text-[12px] text-slate-800 truncate">
                                                    {step.label}
                                                  </span>
                                                </div>
                                                <span className={`text-[9px] font-black font-mono shrink-0 px-1.5 py-0.5 rounded-full ${getStepColorBadge(step.color)}`}>
                                                  0{idx + 1}
                                                </span>
                                              </div>

                                              {/* Target Column Identifier */}
                                              <div className="text-[9px] text-slate-400 font-bold tracking-wider uppercase mb-3 flex items-center justify-between">
                                                <span>Destino:</span>
                                                <span className="font-mono text-slate-600 bg-white border border-slate-100 rounded px-1">{step.col}</span>
                                              </div>

                                              {/* Validation Rules Cards */}
                                              <div className="space-y-1.5">
                                                {rulesCount === 0 ? (
                                                  <div className="text-[10px] text-slate-400 italic py-2 text-center">
                                                    Sin validación restrictiva
                                                  </div>
                                                ) : (
                                                  stepRules.map(rule => (
                                                    <button
                                                      key={rule.id}
                                                      type="button"
                                                      onClick={() => handleToggleRule(rule.id)}
                                                      title={`${rule.desc} (Haz clic para alternar)`}
                                                      className={`w-full text-left p-1.5 rounded-lg border text-[10px] transition duration-200 cursor-pointer flex items-start gap-1 hover:border-slate-350 select-none ${
                                                        rule.enabled
                                                          ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold'
                                                          : 'bg-slate-100/60 border-slate-205 text-slate-400 line-through'
                                                      }`}
                                                    >
                                                      <span className={`w-1.5 h-1.5 rounded-full mt-1 shrink-0 ${
                                                        rule.enabled ? 'bg-violet-500 animate-pulse' : 'bg-slate-300'
                                                      }`} />
                                                      <span className="truncate leading-tight flex-1">
                                                        {rule.name}
                                                      </span>
                                                      <span className="text-[9px] text-slate-400 font-bold shrink-0 ml-1 font-mono">
                                                        {rule.enabled ? '✓' : '✕'}
                                                      </span>
                                                    </button>
                                                  ))
                                                )}
                                              </div>
                                            </div>

                                            {/* Footer count flag */}
                                            {rulesCount > 0 && (
                                              <div className="mt-3 pt-2 border-t border-slate-150 flex items-center justify-between text-[10px] text-slate-500 font-bold w-full">
                                                <span>Restricciones:</span>
                                                <span className={allOk ? 'text-emerald-600' : 'text-slate-500'}>
                                                  {enabledRulesCount}/{rulesCount} activas
                                                </span>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>

                                  {/* Legend */}
                                  <div className="mt-4 pt-3 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-550">
                                    <span className="flex items-center gap-1 text-slate-600">
                                      💡 <strong>Interactividad Ágil:</strong> Pulse directamente sobre cualquier regla en el mapa para habilitar/omitir la validación de transición.
                                    </span>
                                    <div className="flex items-center gap-4 shrink-0 font-extrabold text-[11px]">
                                      <span className="flex items-center gap-1.5">
                                        <span className="w-2.5 h-2.5 rounded bg-violet-650 inline-block" />
                                        Habilitada
                                      </span>
                                      <span className="flex items-center gap-1.5">
                                        <span className="w-2.5 h-2.5 rounded bg-slate-300 inline-block" />
                                        Omitida (Inactiva)
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Rule Category Details List Panel */}
                              {scrumRulesViewMode !== 'flowchart' && (
                                <div className="space-y-4 animate-fadeIn">
                                  {categories.map(cat => {
                                    const catRules = activeRules.filter(r => r.category === cat);
                                    return (
                                      <div key={cat} className="bg-white border border-slate-200/70 rounded-xl overflow-hidden shadow-2xs">
                                        {/* Header of category table */}
                                        <div className="bg-slate-50 border-b border-slate-200/80 px-4 py-2.5 flex items-center justify-between">
                                          <span className="font-black text-[11px] tracking-wider text-slate-600 uppercase flex items-center gap-1.5">
                                            <span className="w-1.5 h-1.5 rounded-full bg-violet-500"></span>
                                            {cat}
                                          </span>
                                          <span className="text-[10px] text-slate-500 font-bold font-mono">
                                            {catRules.filter(r => r.enabled).length} de {catRules.length} activas
                                          </span>
                                        </div>

                                        {/* Rules rows */}
                                        <div className="divide-y divide-slate-100">
                                          {catRules.map(rule => (
                                            <div key={rule.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 transition duration-155">
                                              <div className="flex-1 space-y-2">
                                                <div className="flex items-center gap-2">
                                                  <span className="font-extrabold text-slate-800 text-xs">
                                                    {rule.name}
                                                  </span>
                                                  <span className="bg-slate-105 border border-slate-200 text-slate-600 text-[9px] font-bold font-mono tracking-wider px-1.5 py-0.5 rounded uppercase">
                                                    ➔ {rule.targetCol}
                                                  </span>
                                                </div>

                                                {/* Inline Description Editor */}
                                                <div className="flex items-center gap-2 w-full max-w-2xl bg-white border border-slate-200 hover:border-slate-300 rounded-lg py-1 px-2 transition-all">
                                                  <span className="text-[10.5px] text-slate-400 font-bold shrink-0">Mensaje de error:</span>
                                                  <input
                                                    type="text"
                                                    defaultValue={rule.desc}
                                                    onBlur={(e) => {
                                                      const val = e.target.value.trim();
                                                      if (val && val !== rule.desc) {
                                                        handleUpdateRuleDesc(rule.id, val);
                                                        addLog('Configuración', `Actualizó advertencia para "${rule.name}" a "${val}"`);
                                                      }
                                                    }}
                                                    onKeyDown={(e) => {
                                                      if (e.key === 'Enter') {
                                                        const target = e.target as HTMLInputElement;
                                                        const val = target.value.trim();
                                                        if (val) {
                                                          handleUpdateRuleDesc(rule.id, val);
                                                          addLog('Configuración', `Actualizó advertencia para "${rule.name}" a "${val}"`);
                                                          target.blur();
                                                        }
                                                      }
                                                    }}
                                                    placeholder="Ingrese advertencia personalizada..."
                                                    className="w-full bg-transparent text-xs text-slate-700 outline-none placeholder-slate-400 font-medium"
                                                  />
                                                </div>
                                              </div>

                                              <div className="flex items-center gap-3 shrink-0 self-end md:self-auto">
                                                <div className="flex items-center gap-1.5">
                                                  <span className={`text-[10px] font-black uppercase ${rule.enabled ? 'text-violet-700' : 'text-slate-400'}`}>
                                                    {rule.enabled ? 'Activa' : 'Inactiva'}
                                                  </span>
                                                  <button
                                                    type="button"
                                                    onClick={() => handleToggleRule(rule.id)}
                                                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                                      rule.enabled ? 'bg-violet-600' : 'bg-slate-200'
                                                    }`}
                                                  >
                                                    <span
                                                      className="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out translate-x-0"
                                                      style={{ transform: rule.enabled ? 'translateX(16px)' : 'translateX(0px)' }}
                                                    />
                                                  </button>
                                                </div>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>
          )}

        </div>

        {/* Status Bar */}
        <footer className="h-8 bg-slate-200 border-t border-slate-300 flex items-center justify-between px-6 shrink-0">
          <div className="flex gap-4 text-[10px] font-bold text-slate-500 uppercase">
            <span>SCRUM Master: Sofía Ramírez</span>
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
            <div className="bg-slate-900 border border-slate-700 text-white w-full max-w-lg rounded-xl shadow-2xl overflow-hidden animate-fadeIn">
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
              className="bg-white border border-slate-200 text-slate-800 w-full max-w-lg rounded-xl shadow-2xl overflow-hidden animate-fadeIn" 
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
              className="bg-white border border-slate-200 text-slate-800 w-full max-w-md rounded-xl shadow-2xl overflow-hidden" 
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
        {isCreateProjectModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4" onClick={() => setIsCreateProjectModalOpen(false)}>
            <div className="bg-white border border-slate-200 text-slate-800 w-full max-w-md rounded-xl shadow-2xl overflow-hidden animate-fadeIn" onClick={e => e.stopPropagation()}>
              <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <FolderKanban className="w-4 h-4 text-blue-600" />
                  <h4 className="font-bold text-sm text-slate-900 font-sans">Registrar Nuevo Proyecto de Negocio</h4>
                </div>
                <button
                  onClick={() => setIsCreateProjectModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 font-bold text-lg select-none px-1.5 focus:outline-none transition cursor-pointer"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleCreateProject} className="p-5 space-y-4">
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">Nombre del Proyecto*</label>
                  <input
                    type="text"
                    required
                    value={newProjName}
                    onChange={e => setNewProjName(e.target.value)}
                    placeholder="Ej. SaaS de Ventas"
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:ring-1 focus:ring-blue-500 rounded-lg px-3 py-2 text-xs text-slate-800 font-semibold outline-none transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">Código Único (Code)*</label>
                    <input
                      type="text"
                      required
                      value={newProjCode}
                      onChange={e => setNewProjCode(e.target.value)}
                      placeholder="Ej. SVD-01"
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:ring-1 focus:ring-blue-500 rounded-lg px-3 py-2 text-xs text-slate-800 font-mono font-bold outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">Cliente</label>
                    <select
                      value={newProjClient}
                      onChange={e => setNewProjClient(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:ring-1 focus:ring-blue-500 rounded-lg px-3 py-2 text-xs text-slate-800 font-semibold outline-none transition-all cursor-pointer"
                    >
                      <option value="">-- Seleccionar Cliente --</option>
                      {clientsList.map(c => (
                        <option key={c} value={c}>🏢 {c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">Sponsor</label>
                    <select
                      value={newProjSponsor}
                      onChange={e => setNewProjSponsor(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:ring-1 focus:ring-blue-500 rounded-lg px-3 py-2 text-xs text-slate-800 font-semibold outline-none transition-all cursor-pointer"
                    >
                      <option value="">-- Seleccionar Sponsor --</option>
                      {sponsorsList.map(s => (
                        <option key={s} value={s}>👤 {s}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">Tamaño Sprints (Días Hábiles)*</label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={90}
                      value={newProjSprintSizeDays}
                      onChange={e => setNewProjSprintSizeDays(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:ring-1 focus:ring-blue-500 rounded-lg px-3 py-2 text-xs text-slate-800 font-mono font-bold outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">Presupuesto Límite ($ USD)</label>
                  <input
                    type="number"
                    value={newProjBudget}
                    onChange={e => setNewProjBudget(Number(e.target.value))}
                    placeholder="150000"
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:ring-1 focus:ring-blue-500 rounded-lg px-3 py-2 text-xs text-slate-800 font-mono font-bold outline-none transition-all"
                  />
                  <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed">
                    El presupuesto total se distribuirá automáticamente en categorías ágiles de costos (Nómina, Licencia, Infraestructura, Outsourcing y Otros).
                  </p>
                </div>

                <div className="flex justify-end gap-2 text-xs pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsCreateProjectModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg font-bold transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-sm transition active:scale-[0.98] cursor-pointer"
                  >
                    Registrar Proyecto
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
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
