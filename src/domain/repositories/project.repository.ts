/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Project, ProjectActivity, ProjectCost } from '../../types';
import { IRepository } from './repository.interface';

export interface IProjectRepository extends IRepository<Project> {
  getProjectsByTenant(tenantId: string): Promise<Project[]>;
}

export interface IProjectActivityRepository extends IRepository<ProjectActivity> {
  getActivitiesByProject(projectId: string): Promise<ProjectActivity[]>;
}

export interface IProjectCostRepository extends IRepository<ProjectCost> {
  getCostsByProject(projectId: string): Promise<ProjectCost[]>;
}
