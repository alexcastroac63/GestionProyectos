import React, { createContext, useContext, useState, useEffect } from 'react';
import { Project, ProjectCost } from '../../types';
import { projectsRepository } from '../../features/projects/infrastructure/projectsRepository';
import { INITIAL_PROJECTS } from '../../data';

export interface ProjectsContextType {
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

export const ProjectsContext = createContext<ProjectsContextType | undefined>(undefined);

export const ProjectsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [projects, setProjects] = useState<Project[]>(() => projectsRepository.loadProjects());
  const [costs, setCosts] = useState<ProjectCost[]>(() => projectsRepository.loadCosts());

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
    return projectsRepository.loadCategoryBudgets(getInitialCategoryBudgets(INITIAL_PROJECTS || []));
  });

  const [budgetBaselines, setBudgetBaselines] = useState(() => projectsRepository.loadBudgetBaselines());

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

  // Sync state with repository on changes
  useEffect(() => {
    projectsRepository.saveProjects(projects);
  }, [projects]);

  useEffect(() => {
    projectsRepository.saveCosts(costs);
  }, [costs]);

  useEffect(() => {
    projectsRepository.saveCategoryBudgets(categoryBudgets);
  }, [categoryBudgets]);

  useEffect(() => {
    projectsRepository.saveBudgetBaselines(budgetBaselines);
  }, [budgetBaselines]);

  return (
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
      {children}
    </ProjectsContext.Provider>
  );
};

export const useProjectsStore = () => {
  const context = useContext(ProjectsContext);
  if (!context) throw new Error('useProjectsStore debe utilizarse dentro de ProjectsProvider o AppProviders');
  return context;
};
