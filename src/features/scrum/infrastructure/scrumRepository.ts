import { Sprint, WorkItem, ProjectActivity } from '../../../types';
import { safeLoad, safeSave } from '../../../shared/storage/localStorageAdapter';
import { INITIAL_SPRINTS, INITIAL_WORK_ITEMS, INITIAL_PROJECT_ACTIVITIES } from '../../../data';

export const scrumRepository = {
  loadSprints(): Sprint[] {
    return safeLoad<Sprint[]>('gcp_sprints', INITIAL_SPRINTS);
  },

  saveSprints(sprints: Sprint[]): void {
    safeSave('gcp_sprints', sprints);
  },

  loadWorkItems(): WorkItem[] {
    return safeLoad<WorkItem[]>('gcp_work_items', INITIAL_WORK_ITEMS);
  },

  saveWorkItems(items: WorkItem[]): void {
    safeSave('gcp_work_items', items);
  },

  loadActivities(): ProjectActivity[] {
    return safeLoad<ProjectActivity[]>('gcp_activities', INITIAL_PROJECT_ACTIVITIES);
  },

  saveActivities(activities: ProjectActivity[]): void {
    safeSave('gcp_activities', activities);
  }
};
