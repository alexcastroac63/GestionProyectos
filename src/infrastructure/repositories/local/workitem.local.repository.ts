/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { WorkItem, Sprint } from '../../../types';
import { IWorkItemRepository, ISprintRepository } from '../../../domain/repositories/workitem.repository';
import { LocalRepository } from './localRepository';

/**
 * Repositorio de WorkItems (Historias de Usuario, Tareas, Defectos) en localStorage.
 */
export class WorkItemLocalRepository extends LocalRepository<WorkItem> implements IWorkItemRepository {
  constructor() {
    super('gcp_work_items');
  }

  async getWorkItemsByProject(projectId: string): Promise<WorkItem[]> {
    const all = await this.getAll();
    return all.filter(w => w.project_id === projectId);
  }

  async getWorkItemsBySprint(sprintId: string): Promise<WorkItem[]> {
    const all = await this.getAll();
    return all.filter(w => w.sprint_id === sprintId);
  }
}

/**
 * Repositorio de Sprints respaldado por localStorage.
 */
export class SprintLocalRepository extends LocalRepository<Sprint> implements ISprintRepository {
  constructor() {
    super('gcp_sprints');
  }

  async getSprintsByProject(projectId: string): Promise<Sprint[]> {
    const all = await this.getAll();
    return all.filter(s => s.project_id === projectId);
  }
}
