/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Project, ProjectActivity, ProjectCost } from '../../../types';
import { IProjectRepository, IProjectActivityRepository, IProjectCostRepository } from '../../../domain/repositories/project.repository';
import { LocalRepository } from './localRepository';

/**
 * Repositorio de Proyectos respaldado por localStorage.
 */
export class ProjectLocalRepository extends LocalRepository<Project> implements IProjectRepository {
  constructor() {
    super('gcp_projects');
  }

  async getProjectsByTenant(tenantId: string): Promise<Project[]> {
    const all = await this.getAll();
    return all.filter(p => p.tenant_id === tenantId);
  }
}

/**
 * Repositorio de Actividades del cronograma/WBS respaldado por localStorage.
 */
export class ProjectActivityLocalRepository extends LocalRepository<ProjectActivity> implements IProjectActivityRepository {
  constructor() {
    super('gcp_activities');
  }

  async getActivitiesByProject(projectId: string): Promise<ProjectActivity[]> {
    const all = await this.getAll();
    return all.filter(a => a.project_id === projectId);
  }
}

/**
 * Repositorio de Costos Reales de Proyectos respaldado por localStorage.
 */
export class ProjectCostLocalRepository extends LocalRepository<ProjectCost> implements IProjectCostRepository {
  constructor() {
    super('gcp_costs');
  }

  async getCostsByProject(projectId: string): Promise<ProjectCost[]> {
    const all = await this.getAll();
    return all.filter(c => c.project_id === projectId);
  }
}
