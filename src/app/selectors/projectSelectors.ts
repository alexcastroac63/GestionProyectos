import { Project, Sprint } from '../../types';

/**
 * Finds the currently active project based on selected id.
 */
export function getActiveProject(
  segmentedProjects: Project[],
  selectedProjectId: string,
  fallbackProject: Project
): Project {
  return (
    segmentedProjects.find(p => p.id === selectedProjectId) ||
    segmentedProjects[0] ||
    fallbackProject
  );
}

/**
 * Filters sprints for the selected project.
 */
export function getProjectSprints(sprints: Sprint[], selectedProjectId: string): Sprint[] {
  return sprints.filter(s => s.project_id === selectedProjectId);
}

/**
 * Finds the active sprint for the selected project.
 */
export function getActiveSprint(projectSprints: Sprint[], selectedSprintId: string): Sprint | undefined {
  return projectSprints.find(s => s.id === selectedSprintId) || projectSprints[0];
}
