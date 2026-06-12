/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ProjectStatus = 'REQUERIMIENTOS' | 'APROBADO' | 'DESARROLLO' | 'PRUEBAS' | 'FINALIZADO' | 'CANCELADO';
export type WorkItemType = 'HISTORIA_USUARIO' | 'TAREA' | 'BUG';
export type WorkItemStatus = 'BACKLOG' | 'POR_HACER' | 'EN_CURSO' | 'QA' | 'FINALIZADO';
export type SprintStatus = 'NO_INICIADO' | 'EN_CURSO' | 'FINALIZADO';
export type TestStatus = 'PENDING' | 'PASSED' | 'FAILED';

export interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  avatar_url?: string;
  role: string;
  status: 'ACTIVE' | 'INACTIVE';
  password?: string;
  tenant_id?: string;
}

export interface Tenant {
  id: string;
  name: string;
  description: string;
  domain: string;
  plan: 'Basics' | 'Enterprise' | 'Premium';
  status: 'Active' | 'Inactive';
}

export interface Team {
  id: string;
  name: string;
  capacity: number; // in hours/week
  members: TeamMember[];
}

export interface TeamMember {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  capacity_hours: number;
  skills: string[];
}

export interface Portfolio {
  id: string;
  name: string;
  description: string;
  status: 'ACTIVE' | 'ARCHIVED';
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface Project {
  id: string;
  portfolio_id?: string;
  team_id?: string;
  name: string;
  code: string;
  description: string;
  client: string;
  sponsor: string;
  project_manager_id: string; // references User
  scrum_master_id: string; // references User
  product_owner_id: string; // references User
  status: ProjectStatus;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  start_date: string;
  end_date: string;
  sprint_size_weeks: number;
  sprint_size_days: number;
  budget_total: number;
  tenant_id?: string;
  desarrollo?: 'Interno' | 'Mixto' | 'Externo' | 'Sin desarrollo';
  categoria?: 'Pequeño' | 'Mediano' | 'Grande' | 'Muy Grande';
}

export interface ProjectCost {
  id: string;
  project_id: string;
  cost_type: 'INFRAESTRUCTURA' | 'LICENCIAS' | 'OUTSOURCING' | 'NOMINA' | 'OTROS';
  description: string;
  amount: number;
  currency: string;
  created_at: string;
  document_number?: string;
  document_date?: string;
  // Cloud Simulated Storage Attachments
  storage_key?: string;
  storage_url?: string;
  file_name?: string;
  file_size?: string;
  uploaded_at?: string;
  raw_base64?: string;
}

export interface Sprint {
  id: string;
  project_id: string;
  name: string;
  goal: string;
  start_date: string;
  end_date: string;
  status: SprintStatus;
  velocity: number;
  capacity: number;
}

export interface WorkItem {
  id: string;
  project_id: string;
  sprint_id?: string; // empty means directly in Product Backlog
  parent_id?: string;
  assignee_id?: string; // references User
  reporter_id?: string; // references User
  key: string; // e.g., HU00001, T00001
  title: string;
  description: string;
  type: WorkItemType;
  status: WorkItemStatus;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  story_points?: number;
  created_at: string;
}

export interface ProjectActivity {
  id: string;
  project_id: string;
  sprint_id?: string;
  name: string;
  description: string;
  assigned_to_id?: string;
  start_date: string;
  end_date: string;
  duration_days: number;
  progress: number; // percentage 0-100
  status: 'PENDIENTE' | 'EN_CURSO' | 'COMPLETADA';
  depends_on_id?: string;
}

export interface TestSuite {
  id: string;
  project_id: string;
  name: string;
}

export interface TestCase {
  id: string;
  suite_id: string;
  work_item_id?: string; // traceability
  title: string;
  steps: string[];
  expected: string;
  status: 'PENDING' | 'PASSED' | 'FAILED';
}

export interface TestRun {
  id: string;
  test_case_id: string;
  executed_by_id: string;
  status: 'PASSED' | 'FAILED' | 'PENDING';
  evidence: string;
  notes: string;
  executed_at: string;
}

export interface Mockup {
  id: string;
  project_id: string;
  name: string;
  type: 'WEB' | 'MOBILE' | 'TABLET';
  status: 'BORRADOR' | 'APROBADO';
  description: string;
  canvas_width: number;
  canvas_height: number;
}

export interface MockupScreen {
  id: string;
  mockup_id: string;
  name: string;
  description: string;
  color: string;
  x: number;
  y: number;
}

export interface MockupComponent {
  id: string;
  screen_id: string;
  mockup_id: string;
  type: 'BUTTON' | 'INPUT' | 'CARD' | 'TABLE' | 'TEXT' | 'ICON';
  label: string;
  helper?: string;
  color: string;
  text_color: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface MockupConnection {
  id: string;
  mockup_id: string;
  from_node_id: string;
  to_node_id: string;
  label?: string;
}

export interface GitHubConnection {
  id: string;
  project_id: string;
  repository: string;
  branch: string;
  webhook_active: boolean;
}

export interface GitCommit {
  id: string;
  author: string;
  message: string;
  branch: string;
  hash: string;
  timestamp: string;
}

export interface PullRequest {
  id: string;
  number: number;
  title: string;
  author: string;
  status: 'OPEN' | 'MERGED' | 'CLOSED';
  created_at: string;
}

export interface PipelineStep {
  name: string;
  status: 'IDLE' | 'RUNNING' | 'SUCCESS' | 'FAILED';
  duration?: number;
  log?: string;
}

export interface TransitionRule {
  id: string;
  name: string;
  desc: string;
  category: string;
  targetCol: string;
  enabled: boolean;
}

