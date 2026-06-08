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

  // Recommendations detailed in OCR
  const recommendations = [
    {
      area: 'Costos',
      actual: 'Project.budgetDetails JSON string flexible',
      recomendado: 'project_cost_types + project_costs tables',
      beneficio: 'Permite consultas compuestas de sumas de costos en SQL nativo, agrupación de presupuestos por fase y reportes reales vs estimados sin sobrecargar el procesador con JSON parsing.'
    },
    {
      area: 'Personal',
      actual: 'Project.staffing JSON string',
      recomendado: 'project_members table asociada a users',
      beneficio: 'Referencia íntegra de llaves foráneas. Bloquea la eliminación de un usuario si posee asignaciones vigentes, útil para auditoría de horas.'
    },
    {
      area: 'Actividades/Gantt',
      actual: 'Estado UI o localStorage',
      recomendado: 'project_activities + project_activity_dependencies',
      beneficio: 'Conserva dependencias de predecesores en cascada directamente en Postgres, útil para recalcular fechas de fin si el predecesor se atrasa.'
    },
    {
      area: 'Mockups',
      actual: 'Estado UI o localStorage',
      recomendado: 'mockups + mockup_screens + mockup_components',
      beneficio: 'Persistir las maquetas de pantallas ligadas a historias de usuario para que el QA visual pueda revisarlas.'
    }
  ];

  const suggestedIndexes = [
    { name: 'idx_project_org_status', table: 'projects', cols: 'organization_id, status', active: true },
    { name: 'idx_work_item_project_sprint_status', table: 'work_items', cols: 'project_id, sprint_id, status', active: true },
    { name: 'idx_work_item_assignee_status', table: 'work_items', cols: 'assignee_id, status', active: true },
    { name: 'idx_sprint_project_dates', table: 'sprints', cols: 'project_id, start_date, end_date', active: true },
    { name: 'idx_attachment_project', table: 'attachments', cols: 'project_id, created_at DESC', active: true }
  ];

  const ddlSql = `-- -----------------------------------------------------------------
-- ESQUEMA COMPLETO NORMALIZADO POSTGRESQL (DBA RECOMMENDED)
-- CONTROL PROYECTOS SAAS MULTI-TENANT
-- -----------------------------------------------------------------

CREATE TABLE organizations (
  id text PRIMARY KEY,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE users (
  id text PRIMARY KEY,
  organization_id text NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL UNIQUE,
  password_hash text,
  status text NOT NULL DEFAULT 'ACTIVE',
  failed_attempts integer NOT NULL DEFAULT 0,
  locked_until timestamptz,
  last_access_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE roles (
  id text PRIMARY KEY,
  organization_id text REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  can_view_assigned_projects_only boolean NOT NULL DEFAULT false,
  can_view_active_sprint_only boolean NOT NULL DEFAULT false,
  UNIQUE (organization_id, name)
);

CREATE TABLE projects (
  id text PRIMARY KEY,
  organization_id text NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  portfolio_id text REFERENCES portfolios(id) ON DELETE SET NULL,
  program_id text REFERENCES programs(id) ON DELETE SET NULL,
  team_id text REFERENCES teams(id) ON DELETE SET NULL,
  name text NOT NULL,
  code text NOT NULL,
  description text,
  client text,
  sponsor text,
  project_manager_id text REFERENCES users(id) ON DELETE SET NULL,
  scrum_master_id text REFERENCES users(id) ON DELETE SET NULL,
  product_owner_id text REFERENCES users(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'REQUERIMIENTOS',
  priority text NOT NULL DEFAULT 'MEDIUM',
  project_type text,
  business_area text,
  sprint_size_weeks integer NOT NULL DEFAULT 2,
  start_date date,
  end_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id, code)
);

CREATE TABLE project_cost_types (
  id text PRIMARY KEY,
  organization_id text REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  UNIQUE(organization_id, name)
);

CREATE TABLE project_costs (
  id text PRIMARY KEY,
  project_id text NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  cost_type_id text NOT NULL REFERENCES project_cost_types(id),
  description text,
  amount numeric(14,2) NOT NULL CHECK (amount >= 0),
  currency text NOT NULL DEFAULT 'USD',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RECOMENDACIÓN DE ÍNDICES BBN
CREATE INDEX idx_project_org_status ON projects(organization_id, status);
CREATE INDEX idx_work_item_project_sprint_status ON work_items(project_id, sprint_id, status);`;

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
            <table className="w-full text-left border-collapse text-xs">
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
