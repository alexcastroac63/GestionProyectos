/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type BacklogRole = 'ADMIN_PMO' | 'PROJECT_MANAGER' | 'PRODUCT_OWNER' | 'DEVELOPER' | 'QA_TESTER' | 'CONSULTA';

export interface Epic {
  id: string;
  project_id: string;
  code: string;
  name: string;
  description: string;
  priority: 'Baja' | 'Media' | 'Alta' | 'Crítica';
  status: 'Borrador' | 'En ejecución' | 'Completada';
}

export type StoryType = 'Funcional' | 'Técnica' | 'Bug' | 'Mejora' | 'Spike' | 'Integración' | 'Reporte';
export type StoryPriority = 'Alta' | 'Media' | 'Baja' | 'Crítica';
export type StoryStatus = 
  | 'Borrador' 
  | 'En refinamiento' 
  | 'Ready' 
  | 'En desarrollo' 
  | 'En pruebas internas' 
  | 'En validación usuario' 
  | 'Aprobada' 
  | 'Cerrada' 
  | 'Bloqueada' 
  | 'Rechazada' 
  | 'Cancelada';

export interface AcceptanceCriterion {
  id: string;
  number: number;
  description: string;
  type: 'Funcional' | 'Validación' | 'Cálculo' | 'Integración' | 'Seguridad' | 'Reporte';
  expectedResult: string;
  status: 'Pendiente' | 'Cumple' | 'No cumple' | 'No aplica';
  validatedBy?: string;
  validatedAt?: string;
  evidenceId?: string;
  comment?: string;
}

export interface TechnicalCriteria {
  description: string;
  component: string;
  databaseObject: string;
  api: string;
  integration: string;
  securityRule: string;
  performanceExpected: string;
  auditConsideration: string;
  logsRequired: string;
  technicalDependency: string;
  technicalOwnerId: string;
}

export interface StoryDependency {
  id: string;
  targetStoryId: string;
  dependencyType: 'Bloquea' | 'Depende de' | 'Relacionada con' | 'Duplica' | 'Es parte de' | 'Requiere integración con';
  description: string;
}

export interface StoryComment {
  id: string;
  text: string;
  userId: string;
  userName: string;
  userRole: string;
  timestamp: string;
  type: 'General' | 'Técnico' | 'Funcional' | 'Bloqueo' | 'Validación' | 'Cambio de alcance';
}

export interface StoryAttachment {
  id: string;
  fileName: string;
  fileType: string;
  fileUrl: string;
  uploadedBy: string;
  uploadedAt: string;
  criterionId?: string;
  rawBase64?: string;
}

export interface UserStoryHistoryEntry {
  field: string;
  oldVal: string;
  newVal: string;
  by: string;
  at: string;
}

export interface UserStory {
  id: string;
  project_id: string;
  epic_id?: string;
  sprint_id?: string;
  code: string; // HU-00000
  title: string;
  role: string;
  want: string;
  benefit: string;
  huUnified?: string;
  description: string;
  type: StoryType;
  priority: StoryPriority;
  status: StoryStatus;
  
  // Prioritization score
  businessValue: number; // 1-5
  risk: number; // 1-5
  urgency: number; // 1-5
  moscow: 'Must' | 'Should' | 'Could' | 'Won’t';
  backlogOrder: number;

  // Estimates
  storyPoints: number; // 1, 2, 3, 5, 8, 13, 21
  estimatedHours?: number;
  complexity: 'Baja' | 'Media' | 'Alta';
  uncertainty: 'Baja' | 'Media' | 'Alta';
  functionalOwnerId?: string;
  technicalOwnerId?: string;
  requesterId?: string;
  company: string;
  branch?: string;

  // Dates
  createdAt: string;
  startDate?: string;
  dueDate?: string; // Compromiso
  endDate?: string; // Cierre

  // Blocking Info
  blockedReason?: string;
  unblockResponsible?: string;
  unblockTargetDate?: string;

  // Checklists (Ready & Done)
  dorChecklist: Record<string, boolean>;
  dodChecklist: Record<string, boolean>;

  // Substructures
  acceptanceCriteria: AcceptanceCriterion[];
  technicalCriteria?: TechnicalCriteria;
  dependencies: StoryDependency[];
  comments: StoryComment[];
  attachments: StoryAttachment[];
  history: UserStoryHistoryEntry[];
}
