import { Project, ProjectCost } from '../../../types';
import { safeLoad, safeSave } from '../../../shared/storage/localStorageAdapter';
import { INITIAL_PROJECTS, INITIAL_PROJECT_COSTS } from '../../../data';

export const projectsRepository = {
  loadProjects(): Project[] {
    const list = safeLoad<Project[]>('gcp_projects', INITIAL_PROJECTS);
    return list.map(p => ({
      ...p,
      tenant_id: p.tenant_id || 'grupo-campestre',
      sprint_size_days: p.sprint_size_days !== undefined ? p.sprint_size_days : 10
    }));
  },

  saveProjects(projects: Project[]): void {
    safeSave('gcp_projects', projects);
  },

  loadCosts(): ProjectCost[] {
    return safeLoad<ProjectCost[]>('gcp_costs', INITIAL_PROJECT_COSTS);
  },

  saveCosts(costs: ProjectCost[]): void {
    safeSave('gcp_costs', costs);
  },

  loadCategoryBudgets(initialBudgets: { [key: string]: { [cat: string]: number } }): { [projectId: string]: { [cat: string]: number } } {
    return safeLoad<{ [projectId: string]: { [cat: string]: number } }>('gcp_category_budgets', initialBudgets);
  },

  saveCategoryBudgets(budgets: { [projectId: string]: { [cat: string]: number } }): void {
    safeSave('gcp_category_budgets', budgets);
  },

  loadBudgetBaselines(): any {
    return safeLoad('gcp_budget_baselines_multi', {});
  },

  saveBudgetBaselines(baselines: any): void {
    safeSave('gcp_budget_baselines_multi', baselines);
  }
};
