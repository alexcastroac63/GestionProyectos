/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { WorkItem, Sprint } from '../../types';
import { IRepository } from './repository.interface';

export interface IWorkItemRepository extends IRepository<WorkItem> {
  getWorkItemsByProject(projectId: string): Promise<WorkItem[]>;
  getWorkItemsBySprint(sprintId: string): Promise<WorkItem[]>;
}

export interface ISprintRepository extends IRepository<Sprint> {
  getSprintsByProject(projectId: string): Promise<Sprint[]>;
}
