/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Sprint, WorkItem, ProjectActivity } from '../../../types';
import { safeLoad, safeSave } from '../../../shared/storage/localStorageAdapter';
import { INITIAL_SPRINTS, INITIAL_WORK_ITEMS, INITIAL_PROJECT_ACTIVITIES } from '../../../data';

export interface IScrumRepositoryPort {
  loadSprints(): Sprint[];
  saveSprints(sprints: Sprint[]): void;
  loadWorkItems(): WorkItem[];
  saveWorkItems(items: WorkItem[]): void;
  loadActivities(): ProjectActivity[];
  saveActivities(activities: ProjectActivity[]): void;
}

export class LocalScrumRepository implements IScrumRepositoryPort {
  loadSprints(): Sprint[] {
    return safeLoad<Sprint[]>('gcp_sprints', INITIAL_SPRINTS);
  }

  saveSprints(sprints: Sprint[]): void {
    safeSave('gcp_sprints', sprints);
  }

  loadWorkItems(): WorkItem[] {
    return safeLoad<WorkItem[]>('gcp_work_items', INITIAL_WORK_ITEMS);
  }

  saveWorkItems(items: WorkItem[]): void {
    safeSave('gcp_work_items', items);
  }

  loadActivities(): ProjectActivity[] {
    return safeLoad<ProjectActivity[]>('gcp_activities', INITIAL_PROJECT_ACTIVITIES);
  }

  saveActivities(activities: ProjectActivity[]): void {
    safeSave('gcp_activities', activities);
  }
}

// Default export uses the LocalStorage implementation,
// ready to be swapped with ApiScrumRepository when needed.
export const scrumRepository: IScrumRepositoryPort = new LocalScrumRepository();
