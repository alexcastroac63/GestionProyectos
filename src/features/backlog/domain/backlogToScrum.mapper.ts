/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { UserStory, StoryStatus } from './backlog.types';
import { WorkItem, WorkItemStatus } from '../../../types';

/**
 * Traduce el estado de una historia de usuario del Backlog al estado correspondiente de un WorkItem en el Scrum Board.
 */
export function mapStoryStatusToWorkItemStatus(status: StoryStatus): WorkItemStatus {
  switch (status) {
    case 'Borrador':
    case 'En refinamiento':
      return 'BACKLOG';
    case 'Ready':
      return 'POR_HACER';
    case 'En desarrollo':
      return 'EN_CURSO';
    case 'En pruebas internas':
    case 'En validación usuario':
      return 'QA';
    case 'Aprobada':
    case 'Cerrada':
      return 'FINALIZADO';
    default:
      return 'BACKLOG';
  }
}

/**
 * Convierte una Historia de Usuario del Backlog en un objeto WorkItem compatible con el Scrum Board.
 * Si ya existe una versión previa en el tablero, conserva sus estados modificados localmente (como estatus o asignación si aplica).
 */
export function mapUserStoryToWorkItem(story: UserStory, existingWorkItems: WorkItem[] = []): WorkItem {
  // Buscar previa existencia para preservar el estado actual del Scrum Board
  const existing = existingWorkItems.find(item => item.id === story.id || item.key === story.code);

  return {
    id: story.id,
    project_id: story.project_id,
    sprint_id: story.sprint_id || undefined,
    key: story.code,
    title: story.title,
    description: story.description || '',
    type: 'HISTORIA_USUARIO',
    status: existing ? existing.status : mapStoryStatusToWorkItemStatus(story.status),
    priority: story.priority === 'Alta' || story.priority === 'Crítica' ? 'HIGH' : story.priority === 'Media' ? 'MEDIUM' : 'LOW',
    story_points: story.storyPoints || 0,
    assignee_id: story.technicalOwnerId || story.functionalOwnerId || existing?.assignee_id,
    reporter_id: story.requesterId || existing?.reporter_id,
    created_at: story.createdAt || new Date().toISOString().slice(0, 10),
    parent_id: story.epic_id || undefined
  };
}

/**
 * Sincroniza una lista de historias de usuario con el set actual de WorkItems de la base de datos.
 * Preserva las tareas de tipo TAREA o BUG creadas de manera independiente en el Scrum Board.
 */
export function syncStoriesWithWorkItems(stories: UserStory[], currentWorkItems: WorkItem[]): WorkItem[] {
  // 1. Conservar todos los elementos que NO sean de tipo HISTORIA_USUARIO (como Tareas o Bugs técnicos del desarrollador)
  const nonHUs = currentWorkItems.filter(item => item.type !== 'HISTORIA_USUARIO');

  // 2. Mapear todas las historias activas a estructuras del tablero
  const mappedHUs = stories.map(story => mapUserStoryToWorkItem(story, currentWorkItems));

  // 3. Unificar ambas listas
  return [...nonHUs, ...mappedHUs];
}
