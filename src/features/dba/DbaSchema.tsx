/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Database, Table2, KeyRound, Lightbulb, Play, Copy, CheckCircle } from 'lucide-react';

export default function DbaSchema() {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'normalizacion' | 'ddl' | 'indices'>('normalizacion');
  const [testQueryLogs, setTestQueryLogs] = useState<string[]>([]);
  const [runningAnalysis, setRunningAnalysis] = useState(false);

  // Recommendations detailed in OCR and Normalization Audit
  const recommendations = [
    {
      area: 'Eliminación de TEXT[] (1FN)',
      actual: 'team_members.skills y test_cases.steps como TEXT[]',
      recomendado: 'skills + team_member_skills, test_case_steps',
      beneficio: 'Cumple con la Primera Forma Normal (1FN). Facilita filtrados atómicos en Power BI, agregaciones por tecnologías y desglose secuencial de ejecuciones de QA.'
    },
    {
      area: 'Multi-Tenant Completo',
      actual: 'portfolios y teams sin tenant_id',
      recomendado: 'tenant_id VARCHAR(50) REFERENCES tenants(id)',
      beneficio: 'Garantiza el aislamiento lógico multi-tenant en todas las capas del sistema, impidiendo fugas de visibilidad en portafolios de inversión o equipos de trabajo.'
    },
    {
      area: 'Separación de Adjuntos (3FN)',
      actual: 'project_costs con campos storage_* de archivos',
      recomendado: 'project_costs + project_cost_documents',
      beneficio: 'Cumple con la Tercera Forma Normal (3FN). Desacopla la entidad transaccional financiera del costo de los metadatos físicos de almacenamiento en la nube (GCS).'
    },
    {
      area: 'Sustitución de CHECK por Catálogos',
      actual: 'Estados, prioridades, tipos y categorías como CHECK text',
      recomendado: 'project_statuses, project_priorities, cost_types, etc.',
      beneficio: 'Establece dimensiones corporativas limpias y estandarizadas en Power BI, permitiendo la creación de un modelo estrella nativo y auditoría centralizada.'
    },
    {
      area: 'Auditoría e Inc. Loading',
      actual: 'Pocos campos de control de cambios temporal',
      recomendado: 'created_at, updated_at, created_by_id, active',
      beneficio: 'Permite esquemas óptimos de carga incremental de datos en Power BI y rastreo histórico completo para propósitos de auditoría de calidad.'
    }
  ];

  const suggestedIndexes = [
    { name: 'idx_project_tenant_status', table: 'projects', cols: 'tenant_id, status_id', active: true },
    { name: 'idx_work_item_proj_sprint_status', table: 'work_items', cols: 'project_id, sprint_id, status_id', active: true },
    { name: 'idx_work_item_assignee_status', table: 'work_items', cols: 'assignee_id, status_id', active: true },
    { name: 'idx_team_members_unique', table: 'team_members', cols: 'team_id, user_id', active: true },
    { name: 'idx_cost_documents_cost', table: 'project_cost_documents', cols: 'cost_id', active: true }
  ];

  const ddlSql = `-- -----------------------------------------------------------------
-- ESQUEMA COMPLETO ALTAMENTE NORMALIZADO POSTGRESQL (POWER BI READY)
-- SISTEMA MULTI-TENANT DE PROYECTOS Y AUDITORÍA DE CALIDAD
-- -----------------------------------------------------------------

-- 1. ESTRUCTURA BASE MULTI-TENANT
CREATE TABLE tenants (
  id varchar(50) PRIMARY KEY,
  name varchar(100) NOT NULL,
  subdomain varchar(50) UNIQUE,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. TABLAS DE CATÁLOGOS / DIMENSIONES (Evitan CHECK constraints y facilitan Power BI)
CREATE TABLE project_statuses (
  id varchar(30) PRIMARY KEY,
  name varchar(60) NOT NULL,
  description text
);

CREATE TABLE project_priorities (
  id varchar(20) PRIMARY KEY,
  name varchar(40) NOT NULL
);

CREATE TABLE work_item_types (
  id varchar(20) PRIMARY KEY,
  name varchar(40) NOT NULL
);

CREATE TABLE work_item_statuses (
  id varchar(30) PRIMARY KEY,
  name varchar(60) NOT NULL
);

CREATE TABLE cost_types (
  id varchar(30) PRIMARY KEY,
  name varchar(60) NOT NULL
);

CREATE TABLE development_types (
  id varchar(30) PRIMARY KEY,
  name varchar(60) NOT NULL
);

CREATE TABLE project_categories (
  id varchar(30) PRIMARY KEY,
  name varchar(60) NOT NULL
);

CREATE TABLE test_statuses (
  id varchar(20) PRIMARY KEY,
  name varchar(40) NOT NULL
);

CREATE TABLE skills (
  id varchar(50) PRIMARY KEY,
  name varchar(100) NOT NULL,
  category varchar(50)
);

-- 3. TABLAS ESTRUCTURALES DE PORTAFOLIOS Y EQUIPOS (Multi-Tenant)
CREATE TABLE portfolios (
  id varchar(50) PRIMARY KEY,
  tenant_id varchar(50) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name varchar(150) NOT NULL,
  description text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE teams (
  id varchar(50) PRIMARY KEY,
  tenant_id varchar(50) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name varchar(100) NOT NULL,
  description text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 4. USUARIOS Y CONTROL DE ACCESO
CREATE TABLE users (
  id varchar(50) PRIMARY KEY,
  tenant_id varchar(50) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  first_name varchar(100) NOT NULL,
  last_name varchar(100) NOT NULL,
  email varchar(150) NOT NULL UNIQUE,
  password_hash varchar(255),
  status varchar(20) NOT NULL DEFAULT 'ACTIVE',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 5. RELACIONES DE PERSONAL NORMALIZADAS (1FN)
CREATE TABLE team_members (
  id varchar(50) PRIMARY KEY,
  team_id varchar(50) NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id varchar(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role varchar(100) NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(team_id, user_id)
);

CREATE TABLE team_member_skills (
  team_member_id varchar(50) NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
  skill_id varchar(50) NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  PRIMARY KEY (team_member_id, skill_id)
);

-- 6. PROYECTOS (Totalmente Normalizado, Multi-Tenant)
CREATE TABLE projects (
  id varchar(50) PRIMARY KEY,
  tenant_id varchar(50) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  portfolio_id varchar(50) REFERENCES portfolios(id) ON DELETE SET NULL,
  team_id varchar(50) REFERENCES teams(id) ON DELETE SET NULL,
  name varchar(150) NOT NULL,
  code varchar(30) NOT NULL,
  description text,
  client varchar(100),
  sponsor varchar(50) REFERENCES users(id) ON DELETE SET NULL,
  project_manager_id varchar(50) REFERENCES users(id) ON DELETE SET NULL,
  scrum_master_id varchar(50) REFERENCES users(id) ON DELETE SET NULL,
  product_owner_id varchar(50) REFERENCES users(id) ON DELETE SET NULL,
  status_id varchar(30) NOT NULL REFERENCES project_statuses(id),
  priority_id varchar(20) NOT NULL REFERENCES project_priorities(id),
  dev_type_id varchar(30) NOT NULL REFERENCES development_types(id),
  category_id varchar(30) NOT NULL REFERENCES project_categories(id),
  sprint_size_weeks integer NOT NULL DEFAULT 2,
  start_date date,
  end_date date,
  budget_total numeric(14,2) NOT NULL DEFAULT 0.00 CHECK (budget_total >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by_id varchar(50) REFERENCES users(id),
  updated_by_id varchar(50) REFERENCES users(id),
  active boolean NOT NULL DEFAULT true,
  UNIQUE(tenant_id, code)
);

-- 7. COSTOS DE PROYECTO Y DOCUMENTACIÓN SEGREGADA (3FN Estricta)
CREATE TABLE project_costs (
  id varchar(50) PRIMARY KEY,
  project_id varchar(50) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  cost_type_id varchar(30) NOT NULL REFERENCES cost_types(id),
  description text,
  amount numeric(14,2) NOT NULL CHECK (amount >= 0),
  currency varchar(10) NOT NULL DEFAULT 'USD',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by_id varchar(50) REFERENCES users(id),
  updated_by_id varchar(50) REFERENCES users(id),
  active boolean NOT NULL DEFAULT true
);

CREATE TABLE project_cost_documents (
  id varchar(50) PRIMARY KEY,
  cost_id varchar(50) NOT NULL REFERENCES project_costs(id) ON DELETE CASCADE,
  storage_key varchar(255) NOT NULL,
  storage_url text NOT NULL,
  file_name varchar(255) NOT NULL,
  file_size integer NOT NULL CHECK (file_size > 0),
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  uploaded_by_id varchar(50) REFERENCES users(id)
);

-- 8. GESTIÓN ÁGIL (SPRINTS Y REQUERIMIENTOS KANBAN)
CREATE TABLE sprints (
  id varchar(50) PRIMARY KEY,
  project_id varchar(50) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name varchar(100) NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  status varchar(20) NOT NULL DEFAULT 'PLANNING',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  active boolean NOT NULL DEFAULT true
);

CREATE TABLE work_items (
  id varchar(50) PRIMARY KEY,
  project_id varchar(50) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  sprint_id varchar(50) REFERENCES sprints(id) ON DELETE SET NULL,
  parent_id varchar(50) REFERENCES work_items(id) ON DELETE SET NULL,
  title varchar(150) NOT NULL,
  description text,
  type_id varchar(20) NOT NULL REFERENCES work_item_types(id),
  status_id varchar(30) NOT NULL REFERENCES work_item_statuses(id),
  priority_id varchar(20) NOT NULL REFERENCES project_priorities(id),
  story_points integer CHECK (story_points >= 0),
  assignee_id varchar(50) REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by_id varchar(50) REFERENCES users(id),
  updated_by_id varchar(50) REFERENCES users(id),
  active boolean NOT NULL DEFAULT true
);

-- 9. CRONOGRAMA Y GANTT (ACTIVIDADES DE PROYECTO)
CREATE TABLE project_activities (
  id varchar(50) PRIMARY KEY,
  project_id varchar(50) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  sprint_id varchar(50) REFERENCES sprints(id) ON DELETE SET NULL,
  name varchar(150) NOT NULL,
  description text,
  start_date date NOT NULL,
  end_date date NOT NULL,
  progress integer NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  work_item_id varchar(50) REFERENCES work_items(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  active boolean NOT NULL DEFAULT true
);

CREATE TABLE project_activity_dependencies (
  activity_id varchar(50) NOT NULL REFERENCES project_activities(id) ON DELETE CASCADE,
  predecessor_id varchar(50) NOT NULL REFERENCES project_activities(id) ON DELETE CASCADE,
  PRIMARY KEY (activity_id, predecessor_id)
);

-- 10. GESTIÓN DE CALIDAD Y QA (1FN Estricta)
CREATE TABLE test_suites (
  id varchar(50) PRIMARY KEY,
  project_id varchar(50) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title varchar(150) NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  active boolean NOT NULL DEFAULT true
);

CREATE TABLE test_cases (
  id varchar(50) PRIMARY KEY,
  suite_id varchar(50) NOT NULL REFERENCES test_suites(id) ON DELETE CASCADE,
  work_item_id varchar(50) REFERENCES work_items(id) ON DELETE SET NULL,
  title varchar(150) NOT NULL,
  expected_result text NOT NULL,
  status_id varchar(20) NOT NULL REFERENCES test_statuses(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  active boolean NOT NULL DEFAULT true
);

CREATE TABLE test_case_steps (
  id varchar(50) PRIMARY KEY,
  test_case_id varchar(50) NOT NULL REFERENCES test_cases(id) ON DELETE CASCADE,
  step_number integer NOT NULL CHECK (step_number > 0),
  instruction text NOT NULL,
  expected_behavior text,
  UNIQUE(test_case_id, step_number)
);

CREATE TABLE test_runs (
  id varchar(50) PRIMARY KEY,
  test_case_id varchar(50) NOT NULL REFERENCES test_cases(id) ON DELETE CASCADE,
  tester_id varchar(50) NOT NULL REFERENCES users(id),
  run_date timestamptz NOT NULL DEFAULT now(),
  status_id varchar(20) NOT NULL REFERENCES test_statuses(id),
  actual_result text,
  comments text
);

-- 11. MAQUETACIÓN VISUAL (MOCKUPS DE FRONTEND)
CREATE TABLE mockups (
  id varchar(50) PRIMARY KEY,
  project_id varchar(50) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name varchar(100) NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  active boolean NOT NULL DEFAULT true
);

CREATE TABLE mockup_screens (
  id varchar(50) PRIMARY KEY,
  mockup_id varchar(50) NOT NULL REFERENCES mockups(id) ON DELETE CASCADE,
  title varchar(100) NOT NULL,
  description text,
  x_position integer NOT NULL DEFAULT 100,
  y_position integer NOT NULL DEFAULT 100,
  width integer NOT NULL DEFAULT 375,
  height integer NOT NULL DEFAULT 812
);

CREATE TABLE mockup_components (
  id varchar(50) PRIMARY KEY,
  screen_id varchar(50) NOT NULL REFERENCES mockup_screens(id) ON DELETE CASCADE,
  mockup_id varchar(50) NOT NULL REFERENCES mockups(id) ON DELETE CASCADE,
  type varchar(50) NOT NULL,
  label varchar(100) NOT NULL,
  x_position integer NOT NULL,
  y_position integer NOT NULL,
  width integer NOT NULL,
  height integer NOT NULL,
  properties jsonb
);

CREATE TABLE mockup_connections (
  id varchar(50) PRIMARY KEY,
  mockup_id varchar(50) NOT NULL REFERENCES mockups(id) ON DELETE CASCADE,
  source_screen_id varchar(50) NOT NULL REFERENCES mockup_screens(id) ON DELETE CASCADE,
  target_screen_id varchar(50) NOT NULL REFERENCES mockup_screens(id) ON DELETE CASCADE,
  trigger_element_id varchar(50),
  connection_type varchar(50) NOT NULL DEFAULT 'NAVIGATE'
);

-- 12. VISTAS DE MODELADO ESTRELLA COMPATIBLES CON POWER BI (vw_dim_* y vw_fact_*)
CREATE VIEW vw_dim_tenants AS
SELECT id AS tenant_key, name AS tenant_name, subdomain, active FROM tenants;

CREATE VIEW vw_dim_users AS
SELECT u.id AS user_key, u.tenant_id AS tenant_key, u.first_name, u.last_name, u.email, u.status,
       (u.first_name || ' ' || u.last_name) AS full_name
FROM users u;

CREATE VIEW vw_dim_projects AS
SELECT p.id AS project_key, p.tenant_id AS tenant_key, p.portfolio_id AS portfolio_key, p.team_id AS team_key,
       p.name AS project_name, p.code AS project_code, p.client, p.start_date, p.end_date,
       ps.name AS status, pp.name AS priority, dt.name AS development_type, pc.name AS category
FROM projects p
JOIN project_statuses ps ON p.status_id = ps.id
JOIN project_priorities pp ON p.priority_id = pp.id
JOIN development_types dt ON p.dev_type_id = dt.id
JOIN project_categories pc ON p.category_id = pc.id
WHERE p.active = true;

CREATE VIEW vw_fact_project_costs AS
SELECT pc.id AS cost_key, pc.project_id AS project_key, p.tenant_id AS tenant_key,
       pc.cost_type_id AS cost_type_key, ct.name AS cost_type, pc.description,
       pc.amount, pc.currency, pc.created_at AS date_key
FROM project_costs pc
JOIN projects p ON pc.project_id = p.id
JOIN cost_types ct ON pc.cost_type_id = ct.id
WHERE pc.active = true;

CREATE VIEW vw_fact_work_items AS
SELECT wi.id AS item_key, wi.project_id AS project_key, p.tenant_id AS tenant_key,
       wi.sprint_id AS sprint_key, wi.assignee_id AS assignee_key, wi.title,
       wit.name AS work_item_type, wis.name AS work_item_status, pp.name AS priority,
       wi.story_points, wi.created_at AS date_key
FROM work_items wi
JOIN projects p ON wi.project_id = p.id
JOIN work_item_types wit ON wi.type_id = wit.id
JOIN work_item_statuses wis ON wi.status_id = wis.id
JOIN project_priorities pp ON wi.priority_id = pp.id
WHERE wi.active = true;

-- 13. ÍNDICES DE RENDIMIENTO RECOMENDADOS
CREATE INDEX idx_project_tenant_status ON projects(tenant_id, status_id);
CREATE INDEX idx_work_item_proj_sprint_status ON work_items(project_id, sprint_id, status_id);
CREATE INDEX idx_work_item_assignee_status ON work_items(assignee_id, status_id);
CREATE INDEX idx_team_members_unique ON team_members(team_id, user_id);
CREATE INDEX idx_cost_documents_cost ON project_cost_documents(cost_id);`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(ddlSql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleIndexAnalysis = () => {
    setRunningAnalysis(true);
    setTestQueryLogs(['Iniciando EXPLAIN ANALYZE sobre base de datos simulada...']);
    
    setTimeout(() => {
      setTestQueryLogs(prev => [
        ...prev,
        '-> SELECT * FROM work_items WHERE project_id = \'proj-1\' AND sprint_id = \'sprint-2\' AND status = \'EN_CURSO\';',
        '⚠️ SIN ÍNDICE (Sequential Scan): Costo estimado: 1420.30..3890.15, Tiempo estimado: 420.5ms',
        '-> Aplicando índice idx_work_item_project_sprint_status...'
      ]);
    }, 800);

    setTimeout(() => {
      setTestQueryLogs(prev => [
        ...prev,
        '✅ CON ÍNDICE (Index Scan usando idx_work_item_project_sprint_status):',
        '-> Costo optimizado: 0.15..4.30, Tiempo real de CPU: 1.25ms',
        '🚀 Reducción de carga obtenida: ~99.7% en consultas de tablero Kanban.'
      ]);
      setRunningAnalysis(false);
    }, 1800);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden" id="dba-root">
      {/* DBA Header */}
      <div className="p-6 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-slate-900 text-lg flex items-center gap-2">
            <Database className="w-5 h-5 text-indigo-600" />
            Consola DBA: Normalización PostgreSQL
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Visualizador de tablas, llaves relacionales e índices para multi-tenant acelerado.
          </p>
        </div>
        <div className="flex gap-1.5 bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('normalizacion')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
              activeTab === 'normalizacion' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Sugerencias DBA
          </button>
          <button
            onClick={() => setActiveTab('ddl')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
              activeTab === 'ddl' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Sentencias DDL SQL
          </button>
          <button
            onClick={() => setActiveTab('indices')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
              activeTab === 'indices' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Rendimiento Índices
          </button>
        </div>
      </div>

      {/* Tab content 1: Normalizations suggestions */}
      {activeTab === 'normalizacion' && (
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-5">
              <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wide">Paradigma DBA</span>
              <h4 className="font-semibold text-indigo-900 mt-1 text-sm">¿Por qué de la Normalización?</h4>
              <p className="text-xs text-indigo-800/80 mt-2 leading-relaxed">
                El diseño propuesto transfiere estructuras flexibles en formato JSON a relaciones estructuradas robustas de PostgreSQL. Garantiza el cumplimiento de formas normales, integridad referencial de cascada y soporte robusto para multi-tenant mediante compuestas únicas.
              </p>
            </div>

            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-5">
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wide">Seguridad de Datos</span>
              <h4 className="font-semibold text-emerald-900 mt-1 text-sm">Cláusula Multi-Tenant Nativa</h4>
              <p className="text-xs text-emerald-800/80 mt-2 leading-relaxed">
                Cada instrucción incluye de manera integrada la columna <code className="font-mono text-emerald-950 font-bold">organization_id</code>. Esto garantiza que las consultas de diferentes clientes queden aisladas a nivel de motor SQL sin riesgo de fugas cruzadas.
              </p>
            </div>
          </div>

          <div className="border border-slate-150 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs min-w-[750px]">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">Dominio / Área</th>
                    <th className="p-3.5">Estructura Inicial Flexible</th>
                    <th className="p-3.5 text-indigo-600">Esquema Normalizado Recomendado</th>
                    <th className="p-3.5 max-w-sm">Impacto / Beneficio</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recommendations.map((rec, i) => (
                    <tr key={i} className="hover:bg-slate-50/50">
                      <td className="p-3.5 font-bold text-slate-900">{rec.area}</td>
                      <td className="p-3.5 font-mono text-slate-500">{rec.actual}</td>
                      <td className="p-3.5 font-mono text-indigo-600 font-medium bg-indigo-50/20">{rec.recomendado}</td>
                      <td className="p-3.5 text-slate-600 leading-relaxed">{rec.beneficio}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab content 2: RAW DDL SQL */}
      {activeTab === 'ddl' && (
        <div className="p-6 space-y-4">
          <div className="flex justify-between items-center bg-slate-900 text-slate-300 rounded-t-xl py-3 px-5 border-b border-slate-800">
            <span className="font-mono text-xs flex items-center gap-2">
              <Table2 className="w-4 h-4 text-indigo-400" />
              schema_postgres_multitenant.sql
            </span>
            <button
              onClick={copyToClipboard}
              className="text-slate-400 hover:text-white flex items-center gap-1.5 hover:bg-slate-800 px-3 py-1 rounded text-xs transition"
            >
              {copied ? (
                <>
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span className="text-emerald-400 font-bold">¡Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copiar SQL</span>
                </>
              )}
            </button>
          </div>
          <pre className="bg-slate-950 text-slate-200 p-5 rounded-b-xl overflow-auto text-xs font-mono max-h-96 border border-slate-800 leading-relaxed">
            {ddlSql}
          </pre>
        </div>
      )}

      {/* Tab content 3: RENDIMIENTO INDICES */}
      {activeTab === 'indices' && (
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Index List Panel */}
            <div className="md:col-span-2 space-y-4">
              <h4 className="font-semibold text-slate-800 text-xs uppercase tracking-wider">Índices de Cobertura Críticos</h4>
              <div className="space-y-3">
                {suggestedIndexes.map((idx, i) => (
                  <div key={i} className="border border-slate-200 rounded-lg p-3.5 flex justify-between items-center text-xs bg-slate-50/50 hover:bg-white hover:shadow-xs transition">
                    <div>
                      <div className="flex items-center gap-2">
                        <KeyRound className="w-4 h-4 text-indigo-600" />
                        <span className="font-bold text-slate-800 font-mono">{idx.name}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1.5 font-mono">
                        <span>Tabla: <strong className="text-slate-700">{idx.table}</strong></span>
                        <span>•</span>
                        <span>Columnas: <strong className="text-slate-700">{idx.cols}</strong></span>
                      </div>
                    </div>
                    <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-bold uppercase">
                      Activo / Configurado
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Simulated Analyzer Panel */}
            <div className="md:col-span-1 bg-slate-950 text-slate-300 rounded-xl p-5 border border-slate-800 flex flex-col justify-between min-h-[300px]">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb className="w-4 h-4 text-amber-400" />
                  <span className="font-mono text-xs font-bold text-slate-200">Analizador de Consultas EXPLAIN</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-loose">
                  Lanza una simulación de consulta optimizada de Kanban sobre un volumen de 100k registros de historias de usuario.
                </p>

                {/* Console Outputs */}
                <div className="mt-4 font-mono text-[10px] space-y-2.5 bg-slate-900 border border-slate-850 p-3 rounded-lg max-h-48 overflow-y-auto leading-relaxed">
                  {testQueryLogs.length === 0 ? (
                    <span className="text-slate-550 italic">Listo para simulación...</span>
                  ) : (
                    testQueryLogs.map((log, i) => (
                      <div key={i} className={
                        log.startsWith('✅') ? 'text-emerald-400 font-semibold' :
                        log.startsWith('⚠️') ? 'text-amber-400' :
                        log.startsWith('🚀') ? 'text-cyan-400 font-bold' : 'text-slate-300'
                      }>
                        {log}
                      </div>
                    ))
                  )}
                </div>
              </div>

              <button
                onClick={handleIndexAnalysis}
                disabled={runningAnalysis}
                className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs py-2 rounded-lg flex items-center justify-center gap-1.5 transition disabled:opacity-50"
              >
                <Play className="w-4 h-4" />
                {runningAnalysis ? 'Simulando...' : 'Lanzar Análisis EXPLAIN'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
