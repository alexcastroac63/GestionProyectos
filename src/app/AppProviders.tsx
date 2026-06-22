/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
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
  Tenant,
  NoteType
} from '../types';
import {
  UserStory,
  Epic
} from '../features/backlog/domain/backlog.types';
import {
  INITIAL_USERS,
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
} from '../data';
import { DEFAULT_DOR_ITEMS, DEFAULT_DOD_ITEMS } from '../features/backlog/domain/backlog.constants';
import { safeLoad, safeSave } from '../shared/storage/localStorageAdapter';
import { INITIAL_EPICS, INITIAL_USER_STORIES } from '../shared/seeds/backlogSeeds';

// --- System State Context ---
interface SystemContextType {
  tenants: Tenant[];
  setTenants: React.Dispatch<React.SetStateAction<Tenant[]>>;
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  noteTypes: NoteType[];
  setNoteTypes: React.Dispatch<React.SetStateAction<NoteType[]>>;
  logs: { id: string; user: string; text: string; time: string }[];
  setLogs: React.Dispatch<React.SetStateAction<{ id: string; user: string; text: string; time: string }[]>>;
  addLog: (user: string, action: string) => void;
  loggedInUser: User | null;
  setLoggedInUser: React.Dispatch<React.SetStateAction<User | null>>;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
  isProjectsMenuOpen: boolean;
  setIsProjectsMenuOpen: (open: boolean) => void;
  isSettingsMenuOpen: boolean;
  setIsSettingsMenuOpen: (open: boolean) => void;
  settingsSubTab: 'smtp' | 'clients' | 'scrum_rules' | 'tenants' | 'note_types';
  setSettingsSubTab: (tab: 'smtp' | 'clients' | 'scrum_rules' | 'tenants' | 'note_types') => void;
  deleteConfirmState: { isOpen: boolean; title: string; message: string; onConfirm: () => void } | null;
  setDeleteConfirmState: React.Dispatch<React.SetStateAction<{ isOpen: boolean; title: string; message: string; onConfirm: () => void } | null>>;
}

const SystemContext = createContext<SystemContextType | undefined>(undefined);

// --- Projects State Context ---
interface ProjectsContextType {
  projects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  costs: ProjectCost[];
  setCosts: React.Dispatch<React.SetStateAction<ProjectCost[]>>;
  selectedProjectId: string;
  setSelectedProjectId: (id: string) => void;
  expandedProjectId: string | null;
  setExpandedProjectId: (id: string | null) => void;
  projectSubTab: 'wbs' | 'costs' | 'activities' | 'notes';
  setProjectSubTab: (tab: 'wbs' | 'costs' | 'activities' | 'notes') => void;
  categoryBudgets: { [projectId: string]: { [cat: string]: number } };
  setCategoryBudgets: React.Dispatch<React.SetStateAction<{ [projectId: string]: { [cat: string]: number } }>>;
  budgetBaselines: {
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
  };
  setBudgetBaselines: React.Dispatch<React.SetStateAction<{
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
  }>>;
  projectSearch: string;
  setProjectSearch: (s: string) => void;
  projectStatusFilter: string[];
  setProjectStatusFilter: React.Dispatch<React.SetStateAction<string[]>>;
  projectPriorityFilter: string;
  setProjectPriorityFilter: (p: string) => void;
  projectClientFilter: string;
  setProjectClientFilter: (c: string) => void;
  isCreateProjectModalOpen: boolean;
  setIsCreateProjectModalOpen: (open: boolean) => void;
  projectStatusModalTarget: Project | null;
  setProjectStatusModalTarget: (p: Project | null) => void;
  projectConfigModalTarget: Project | null;
  setProjectConfigModalTarget: (p: Project | null) => void;
  isRegisterCostModalOpen: boolean;
  setIsRegisterCostModalOpen: (open: boolean) => void;
}

const ProjectsContext = createContext<ProjectsContextType | undefined>(undefined);

// --- Scrum State Context ---
interface ScrumContextType {
  sprints: Sprint[];
  setSprints: React.Dispatch<React.SetStateAction<Sprint[]>>;
  workItems: WorkItem[];
  setWorkItems: React.Dispatch<React.SetStateAction<WorkItem[]>>;
  activities: ProjectActivity[];
  setActivities: React.Dispatch<React.SetStateAction<ProjectActivity[]>>;
  selectedSprintId: string;
  setSelectedSprintId: (id: string) => void;
}

const ScrumContext = createContext<ScrumContextType | undefined>(undefined);

// --- QA State Context ---
interface QaContextType {
  testSuites: TestSuite[];
  setTestSuites: React.Dispatch<React.SetStateAction<TestSuite[]>>;
  testCases: TestCase[];
  setTestCases: React.Dispatch<React.SetStateAction<TestCase[]>>;
  testRuns: TestRun[];
  setTestRuns: React.Dispatch<React.SetStateAction<TestRun[]>>;
}

const QaContext = createContext<QaContextType | undefined>(undefined);

// --- Mockup State Context ---
export interface MockupContextType {
  mockups: Mockup[];
  setMockups: React.Dispatch<React.SetStateAction<Mockup[]>>;
  mockScreens: MockupScreen[];
  setMockScreens: React.Dispatch<React.SetStateAction<MockupScreen[]>>;
  mockComponents: MockupComponent[];
  setMockComponents: React.Dispatch<React.SetStateAction<MockupComponent[]>>;
  mockConnections: MockupConnection[];
  setMockConnections: React.Dispatch<React.SetStateAction<MockupConnection[]>>;
}

const MockupContext = createContext<MockupContextType | undefined>(undefined);

// --- Backlog State Context ---
interface BacklogContextType {
  stories: UserStory[];
  setStories: React.Dispatch<React.SetStateAction<UserStory[]>>;
  epics: Epic[];
  setEpics: React.Dispatch<React.SetStateAction<Epic[]>>;
}

const BacklogContext = createContext<BacklogContextType | undefined>(undefined);

// --- Unified App Providers Wrap ---
export const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // --- Initialize System States ---
  const INITIAL_TENANTS: Tenant[] = [
    {
      id: 'grupo-campestre',
      name: 'Grupo Campestre',
      description: 'Suscripción corporativa principal para la gestión de marcas de alimentación y avícolas.',
      domain: 'campestre.com.sv',
      plan: 'Premium',
      status: 'Active'
    }
  ];

  const INITIAL_NOTE_TYPES: NoteType[] = [
    { id: 'type-general', name: 'Generales', description: 'Notas e información general de alcance, minutas de reuniones.', color: 'indigo', active: true },
    { id: 'type-atraso', name: 'Atrasos', description: 'Alertas críticas sobre desviaciones.', color: 'amber', active: true },
    { id: 'type-tecnica', name: 'Especificaciones Técnicas', description: 'Definiciones de arquitectura de software.', color: 'emerald', active: true }
  ];

  const [tenants, setTenants] = useState<Tenant[]>(() => safeLoad<Tenant[]>('gcp_tenants', INITIAL_TENANTS));
  const [users, setUsers] = useState<User[]>(() => {
    const list = safeLoad<User[]>('gcp_users', INITIAL_USERS);
    return list.map(u => ({ ...u, tenant_id: u.tenant_id || 'grupo-campestre' }));
  });
  const [noteTypes, setNoteTypes] = useState<NoteType[]>(() => safeLoad<NoteType[]>('gcp_project_note_types', INITIAL_NOTE_TYPES));
  
  const [logs, setLogs] = useState<{ id: string; user: string; text: string; time: string }[]>([
    { id: '1', user: 'Carlos Pérez (PM)', text: 'Creó el cronograma de actividades con 6 fases.', time: '12:45' },
    { id: '2', user: 'Andrés Mendoza (DBA)', text: 'Registró el esquema recomendado en PostgreSQL.', time: '13:12' },
    { id: '3', user: 'Valentina Rojas (QA)', text: 'Agregó la Suite 01 de pruebas de la API Multi-tenant.', time: '14:24' }
  ]);

  const addLog = (user: string, action: string) => {
    const time = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    setLogs(prev => [
      { id: Date.now().toString(), user, text: action, time },
      ...prev.slice(0, 49) // Limitar a las últimas 50 entradas
    ]);
  };

  const [loggedInUser, setLoggedInUser] = useState<User | null>(() => {
    // Unpack nested { user, token } structure if present
    const loaded = safeLoad<any>('gcp_logged_in_user', null);
    if (loaded && typeof loaded === 'object') {
      if ('user' in loaded && loaded.user) {
        return loaded.user as User;
      }
      return loaded as User;
    }
    return null;
  });

  useEffect(() => {
    if (loggedInUser === null) {
      localStorage.removeItem('gcp_logged_in_user');
    } else {
      // Check if we already have a session token stored in local storage
      let existingToken: string | undefined = undefined;
      try {
        const raw = localStorage.getItem('gcp_logged_in_user');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object' && parsed.token) {
            existingToken = parsed.token;
          }
        }
      } catch (err) {
        console.warn('Failed to parse existing gcp_logged_in_user for token preservation:', err);
      }

      if (existingToken) {
        localStorage.setItem('gcp_logged_in_user', JSON.stringify({
          user: loggedInUser,
          token: existingToken
        }));
      } else {
        safeSave('gcp_logged_in_user', loggedInUser);
      }
    }
  }, [loggedInUser]);

  // --- UI Layout state ---
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [isProjectsMenuOpen, setIsProjectsMenuOpen] = useState<boolean>(true);
  const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState<boolean>(true);
  const [settingsSubTab, setSettingsSubTab] = useState<'smtp' | 'clients' | 'scrum_rules' | 'tenants' | 'note_types'>('smtp');
  const [deleteConfirmState, setDeleteConfirmState] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void } | null>(null);

  // --- Initialize Projects & Budget States ---
  const [projects, setProjects] = useState<Project[]>(() => {
    const list = safeLoad<Project[]>('gcp_projects', INITIAL_PROJECTS);
    return list.map(p => ({
      ...p,
      tenant_id: p.tenant_id || 'grupo-campestre',
      sprint_size_days: p.sprint_size_days !== undefined ? p.sprint_size_days : 10
    }));
  });

  const [costs, setCosts] = useState<ProjectCost[]>(() => safeLoad<ProjectCost[]>('gcp_costs', INITIAL_PROJECT_COSTS));

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
    return safeLoad('gcp_budget_baselines_multi', {});
  });

  const [selectedProjectId, setSelectedProjectId] = useState<string>('proj-1');
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);
  const [projectSubTab, setProjectSubTab] = useState<'wbs' | 'costs' | 'activities' | 'notes'>('wbs');
  const [projectSearch, setProjectSearch] = useState('');
  const [projectStatusFilter, setProjectStatusFilter] = useState<string[]>(['REQUERIMIENTOS', 'APROBADO', 'DESARROLLO', 'PRUEBAS']);
  const [projectPriorityFilter, setProjectPriorityFilter] = useState<string>('ALL');
  const [projectClientFilter, setProjectClientFilter] = useState<string>('ALL');

  const [isCreateProjectModalOpen, setIsCreateProjectModalOpen] = useState(false);
  const [projectStatusModalTarget, setProjectStatusModalTarget] = useState<Project | null>(null);
  const [projectConfigModalTarget, setProjectConfigModalTarget] = useState<Project | null>(null);
  const [isRegisterCostModalOpen, setIsRegisterCostModalOpen] = useState(false);

  // --- Initialize Scrum & Sprints States ---
  const [sprints, setSprints] = useState<Sprint[]>(() => safeLoad<Sprint[]>('gcp_sprints', INITIAL_SPRINTS));
  const [workItems, setWorkItems] = useState<WorkItem[]>(() => safeLoad<WorkItem[]>('gcp_work_items', INITIAL_WORK_ITEMS));
  const [activities, setActivities] = useState<ProjectActivity[]>(() => safeLoad<ProjectActivity[]>('gcp_activities', INITIAL_PROJECT_ACTIVITIES));
  const [selectedSprintId, setSelectedSprintId] = useState<string>('sprint-2'); // Sprint 2 es el activo por defecto

  // --- Initialize QA States ---
  const [testSuites, setTestSuites] = useState<TestSuite[]>(() => safeLoad<TestSuite[]>('gcp_test_suites', INITIAL_TEST_SUITES));
  const [testCases, setTestCases] = useState<TestCase[]>(() => safeLoad<TestCase[]>('gcp_test_cases', INITIAL_TEST_CASES));
  const [testRuns, setTestRuns] = useState<TestRun[]>(() => safeLoad<TestRun[]>('gcp_test_runs', INITIAL_TEST_RUNS));

  // --- Initialize Mockups & Screens States ---
  const [mockups, setMockups] = useState<Mockup[]>(() => safeLoad<Mockup[]>('gcp_mockups', INITIAL_MOCKUPS));
  const [mockScreens, setMockScreens] = useState<MockupScreen[]>(() => safeLoad<MockupScreen[]>('gcp_mock_screens', INITIAL_MOCKUP_SCREENS));
  const [mockComponents, setMockComponents] = useState<MockupComponent[]>(() => safeLoad<MockupComponent[]>('gcp_mock_components', INITIAL_MOCKUP_COMPONENTS));
  const [mockConnections, setMockConnections] = useState<MockupConnection[]>(() => safeLoad<MockupConnection[]>('gcp_mock_connections', INITIAL_MOCKUP_CONNECTIONS));

  // --- Initialize Backlog States ---
  const [epics, setEpics] = useState<Epic[]>(() => safeLoad<Epic[]>('backlog_epics', INITIAL_EPICS));
  const [stories, setStories] = useState<UserStory[]>(() => safeLoad<UserStory[]>('backlog_stories_advanced', INITIAL_USER_STORIES));

  // --- Core Persistor Effect --
  useEffect(() => {
    safeSave('gcp_tenants', tenants);
    safeSave('gcp_users', users);
    safeSave('gcp_project_note_types', noteTypes);
    safeSave('gcp_projects', projects);
    safeSave('gcp_costs', costs);
    safeSave('gcp_category_budgets', categoryBudgets);
    safeSave('gcp_budget_baselines_multi', budgetBaselines);
    safeSave('gcp_sprints', sprints);
    safeSave('gcp_work_items', workItems);
    safeSave('gcp_activities', activities);
    safeSave('gcp_test_suites', testSuites);
    safeSave('gcp_test_cases', testCases);
    safeSave('gcp_test_runs', testRuns);
    safeSave('gcp_mockups', mockups);
    safeSave('gcp_mock_screens', mockScreens);
    safeSave('gcp_mock_components', mockComponents);
    safeSave('gcp_mock_connections', mockConnections);
    safeSave('backlog_epics', epics);
    safeSave('backlog_stories_advanced', stories);
  }, [
    tenants, users, noteTypes, projects, costs, categoryBudgets, budgetBaselines, 
    sprints, workItems, activities, testSuites, testCases, testRuns, 
    mockups, mockScreens, mockComponents, mockConnections, epics, stories
  ]);

  return (
    <SystemContext.Provider value={{
      tenants, setTenants, users, setUsers, noteTypes, setNoteTypes, logs, setLogs, addLog,
      loggedInUser, setLoggedInUser, activeTab, setActiveTab,
      isMobileMenuOpen, setIsMobileMenuOpen, isProjectsMenuOpen, setIsProjectsMenuOpen,
      isSettingsMenuOpen, setIsSettingsMenuOpen, settingsSubTab, setSettingsSubTab,
      deleteConfirmState, setDeleteConfirmState
    }}>
      <ProjectsContext.Provider value={{
        projects, setProjects, costs, setCosts, selectedProjectId, setSelectedProjectId,
        expandedProjectId, setExpandedProjectId, projectSubTab, setProjectSubTab,
        categoryBudgets, setCategoryBudgets, budgetBaselines, setBudgetBaselines,
        projectSearch, setProjectSearch, projectStatusFilter, setProjectStatusFilter,
        projectPriorityFilter, setProjectPriorityFilter, projectClientFilter, setProjectClientFilter,
        isCreateProjectModalOpen, setIsCreateProjectModalOpen,
        projectStatusModalTarget, setProjectStatusModalTarget,
        projectConfigModalTarget, setProjectConfigModalTarget,
        isRegisterCostModalOpen, setIsRegisterCostModalOpen
      }}>
        <ScrumContext.Provider value={{
          sprints, setSprints, workItems, setWorkItems, activities, setActivities,
          selectedSprintId, setSelectedSprintId
        }}>
          <QaContext.Provider value={{
            testSuites, setTestSuites, testCases, setTestCases, testRuns, setTestRuns
          }}>
            <BacklogContext.Provider value={{
              stories, setStories, epics, setEpics
            }}>
              <MockupContext.Provider value={{
                mockups, setMockups, mockScreens, setMockScreens, mockComponents, setMockComponents, mockConnections, setMockConnections
              }}>
                {children}
              </MockupContext.Provider>
            </BacklogContext.Provider>
          </QaContext.Provider>
        </ScrumContext.Provider>
      </ProjectsContext.Provider>
    </SystemContext.Provider>
  );
};

// --- Custom Hooks per Domain ---
export const useSystemStore = () => {
  const context = useContext(SystemContext);
  if (!context) throw new Error('useSystemStore debe utilizarse dentro de AppProviders');
  return context;
};

export const useProjectsStore = () => {
  const context = useContext(ProjectsContext);
  if (!context) throw new Error('useProjectsStore debe utilizarse dentro de AppProviders');
  return context;
};

export const useScrumStore = () => {
  const context = useContext(ScrumContext);
  if (!context) throw new Error('useScrumStore debe utilizarse dentro de AppProviders');
  return context;
};

export const useQaStore = () => {
  const context = useContext(QaContext);
  if (!context) throw new Error('useQaStore debe utilizarse dentro de AppProviders');
  return context;
};

export const useBacklogStore = () => {
  const context = useContext(BacklogContext);
  if (!context) throw new Error('useBacklogStore debe utilizarse dentro de AppProviders');
  return context;
};

export const useMockupStore = () => {
  const context = useContext(MockupContext);
  if (!context) throw new Error('useMockupStore debe utilizarse dentro de AppProviders');
  return context;
};
