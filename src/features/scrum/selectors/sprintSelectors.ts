import { WorkItem } from '../../../types';

/**
 * Calculates sprint status based on its work items:
 * "Sprint sin HU o solo Por hacer queda No iniciado; mezcla queda En curso; todo finalizado queda Finalizado"
 */
export function getSprintCalculatedStatus(workItems: WorkItem[], spId: string): 'NO_INICIADO' | 'FINALIZADO' | 'EN_CURSO' {
  const spItems = workItems.filter(w => w.sprint_id === spId);
  if (spItems.length === 0) return 'NO_INICIADO';
  
  const allPorHacer = spItems.every(w => w.status === 'POR_HACER' || w.status === 'BACKLOG');
  if (allPorHacer) return 'NO_INICIADO';
  
  const allFinalizado = spItems.every(w => w.status === 'FINALIZADO');
  if (allFinalizado) return 'FINALIZADO';
  
  return 'EN_CURSO';
}
