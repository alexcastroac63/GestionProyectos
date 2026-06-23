import { WorkItem } from '../../../types';

/**
 * Filters work items for the active sprint in a given project.
 */
export function getActiveSprintsItems(
  workItems: WorkItem[],
  projectId: string,
  activeSprintId: string
): WorkItem[] {
  return workItems.filter(w => w.project_id === projectId && w.sprint_id === activeSprintId);
}

/**
 * Calculates total story points for a set of work items.
 */
export function getTotalPoints(workItems: WorkItem[]): number {
  return workItems.reduce((acc, current) => acc + (current.story_points || 0), 0);
}

/**
 * Calculates completed story points (status === 'FINALIZADO') for a set of work items.
 */
export function getCompletedPoints(workItems: WorkItem[]): number {
  return workItems
    .filter(w => w.status === 'FINALIZADO')
    .reduce((acc, cur) => acc + (cur.story_points || 0), 0);
}
