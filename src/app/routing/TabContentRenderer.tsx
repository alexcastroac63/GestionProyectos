import React from 'react';
import {
  ClipboardList
} from 'lucide-react';

import {
  useSystemStore,
  useProjectsStore,
  useScrumStore,
  useQaStore
} from '../AppProviders';

// Selectors
import { getSegmentedProjects, getSegmentedUsers } from '../selectors/tenantSelectors';
import { getProjectSprints, getActiveSprint } from '../selectors/projectSelectors';

// Base static data for fallback imports or layouts
import {
  INITIAL_COMMITS,
  INITIAL_PRS
} from '../../data';

// Component Imports
import KPIDashboard from '../../features/dashboard/KPIDashboard';
import { ProjectPortfolioView } from '../../features/projects/components/ProjectPortfolioView';
import ProjectActivitiesSubTab from '../../features/projects/ProjectActivitiesSubTab';
import { QuickBacklogItemForm } from '../../features/backlog/components/QuickBacklogItemForm';
import ProductBacklogManager from '../../features/backlog/ProductBacklogManager';
import ScrumBoardAndQaManager from '../../features/scrum/ScrumBoardAndQaManager';
import { TeamDirectoryView } from '../../features/team/TeamDirectoryView';
import { SettingsManagerView } from '../../features/settings/SettingsManagerView';

// Lazy Loaded Large Components
const MockupCanvas = React.lazy(() => import('../../features/mockups/MockupCanvas'));
const DbaSchema = React.lazy(() => import('../../features/dba/DbaSchema'));
const DevOpsPipeline = React.lazy(() => import('../../features/devops/DevOpsPipeline'));
const QaSuiteWorkspace = React.lazy(() => import('../../features/qa/QaSuiteWorkspace'));

export const TabContentRenderer: React.FC = () => {
  const {
    activeTab,
    users,
    addLog,
    loggedInUser,
    smtpPassword,
    setSmtpPassword,
    clientsList,
    setClientsList,
    sponsorsList,
    setSponsorsList
  } = useSystemStore();

  const {
    projects,
    costs,
    selectedProjectId,
    setSelectedProjectId
  } = useProjectsStore();

  const {
    sprints,
    setSprints,
    workItems,
    setWorkItems,
    activities,
    setActivities,
    selectedSprintId
  } = useScrumStore();

  const {
    testCases,
    setTestCaseStatus,
    setTestCases,
    testSuites,
    setTestSuites,
    testRuns,
    setTestRuns
  } = useQaStore();

  // Multi-tenant segmentation selectors
  const segmentedProjects = getSegmentedProjects(projects, loggedInUser);
  const segmentedUsers = getSegmentedUsers(users, loggedInUser);

  // Active contextual references
  const projectSprints = getProjectSprints(sprints, selectedProjectId);
  const activeSprint = getActiveSprint(projectSprints, selectedSprintId);

  switch (activeTab) {
    case 'dashboard':
      return (
        <div className="animate-fadeIn" id="tab-dashboard">
          <KPIDashboard
            projects={segmentedProjects}
            users={segmentedUsers}
            sprints={sprints}
            workItems={workItems}
            activities={activities}
            costs={costs}
            testRuns={testRuns}
            testCases={testCases}
          />
        </div>
      );

    case 'projects':
      return <ProjectPortfolioView />;

    case 'activities':
      return (
        <div className="space-y-6 animate-fadeIn" id="tab-activities">
          {/* Header card for Project Selection & Scope Context */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="text-slate-900 font-extrabold text-base flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-indigo-600" />
                  Actividades del Plan de Trabajo
                </h3>
                <p className="text-xs text-slate-500">
                  Gestione, asigne e interconecte las actividades técnicas y de asegurabilidad asociadas a las Historias de Usuario (HU).
                </p>
              </div>
              
              {/* Selector de Proyecto Contextual */}
              <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
                <span className="text-xs font-bold text-slate-500 uppercase whitespace-nowrap">Proyecto Objetivo:</span>
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="bg-slate-50 hover:bg-slate-100 border border-slate-250 rounded-lg px-3 py-2 text-xs text-slate-800 font-extrabold cursor-pointer transition focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  {segmentedProjects.map(p => (
                    <option key={p.id} value={p.id}>💼 {p.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Renders the Activities View configured with the selected context */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <div className="mb-4 bg-indigo-50/45 border border-indigo-100/50 rounded-lg p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-indigo-850">
                <span className="flex h-2 w-2 relative shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                </span>
                <span>Vista enfocada en el Sprint activo: <strong className="font-bold underline">{activeSprint ? activeSprint.name : 'Backlog General'}</strong></span>
              </div>
              <div className="text-[10px] bg-indigo-100/65 text-indigo-800 font-mono font-bold px-2 py-0.5 rounded uppercase">
                Estado: {activeSprint ? activeSprint.status : 'N/A'}
              </div>
            </div>

            <ProjectActivitiesSubTab
              projectId={selectedProjectId}
              users={segmentedUsers}
              sprints={sprints}
              workItems={workItems}
              setWorkItems={setWorkItems}
              activities={activities}
              setActivities={setActivities}
              addLog={addLog}
            />
          </div>
        </div>
      );

    case 'backlog':
      return (
        <div className="space-y-6 animate-fadeIn" id="tab-backlog">
          <QuickBacklogItemForm
            projectId={selectedProjectId}
            workItems={workItems}
            setWorkItems={setWorkItems}
            addLog={addLog}
          />
          <ProductBacklogManager
            selectedProjectId={selectedProjectId}
            setSelectedProjectId={setSelectedProjectId}
            projects={segmentedProjects}
            users={segmentedUsers}
            sprints={sprints}
            setSprints={setSprints}
            addLog={addLog}
            workItems={workItems}
            setWorkItems={setWorkItems}
          />
        </div>
      );

    case 'kanban':
      return (
        <div className="space-y-6 animate-fadeIn" id="tab-kanban">
          <ScrumBoardAndQaManager
            selectedProjectId={selectedProjectId}
            setSelectedProjectId={setSelectedProjectId}
            projects={segmentedProjects}
            users={segmentedUsers}
            sprints={sprints}
            setSprints={setSprints}
            workItems={workItems}
            setWorkItems={setWorkItems}
            testCases={testCases}
            setTestCases={setTestCases}
            testRuns={testRuns}
            setTestRuns={setTestRuns}
            addLog={addLog}
            loggedInUser={loggedInUser || undefined}
          />
        </div>
      );

    case 'qa':
      return (
        <React.Suspense fallback={
          <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500 font-mono text-xs animate-pulse">
            Cargando Módulo de Pruebas de Calidad (QA)...
          </div>
        }>
          <QaSuiteWorkspace
            selectedProjectId={selectedProjectId}
            setSelectedProjectId={setSelectedProjectId}
            projects={segmentedProjects}
            users={segmentedUsers}
            sprints={sprints}
            setSprints={setSprints}
            workItems={workItems}
            setWorkItems={setWorkItems}
            testCases={testCases}
            setTestCases={setTestCases}
            testSuites={testSuites}
            setTestSuites={setTestSuites}
            testRuns={testRuns}
            setTestRuns={setTestRuns}
            addLog={addLog}
            loggedInUser={loggedInUser || undefined}
            activities={activities}
            setActivities={setActivities}
          />
        </React.Suspense>
      );

    case 'mockup':
      return (
        <div className="space-y-6 animate-fadeIn" id="tab-mockups">
          <React.Suspense fallback={
            <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500 font-mono text-xs animate-pulse">
              Cargando Canvas de Prototipado (Mockups)...
            </div>
          }>
            <MockupCanvas
              projects={segmentedProjects}
              selectedProjectId={selectedProjectId}
              setSelectedProjectId={setSelectedProjectId}
            />
          </React.Suspense>
        </div>
      );

    case 'teams':
      return <TeamDirectoryView smtpPassword={smtpPassword} />;

    case 'dba':
      return (
        <div className="space-y-6 animate-fadeIn" id="tab-dba">
          <React.Suspense fallback={
            <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500 font-mono text-xs animate-pulse">
              Cargando Modelador de Base de Datos (DBA)...
            </div>
          }>
            <DbaSchema />
          </React.Suspense>
        </div>
      );

    case 'devops':
      return (
        <div className="space-y-6 animate-fadeIn" id="tab-devops">
          {/* Conexión de Repositorios y Telemetría */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <h3 className="text-slate-900 font-bold text-base mb-2">Conexión de Repositorios y Telemetría</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              {/* Commits */}
              <div className="space-y-3">
                <span className="text-[10.5px] font-bold text-slate-450 uppercase tracking-wider block">Historial Reciente de Commits</span>
                {INITIAL_COMMITS.map(commit => (
                  <div key={commit.id} className="border border-slate-150 p-3 rounded-xl hover:bg-slate-50 text-xs transition">
                    <div className="flex justify-between">
                      <span className="font-mono text-indigo-600 font-bold bg-indigo-50 px-1 py-0.5 rounded">{commit.hash}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{new Date(commit.timestamp).toLocaleDateString()}</span>
                    </div>
                    <p className="font-semibold text-slate-800 mt-2">{commit.message}</p>
                    <p className="text-[10px] text-slate-500 mt-1">Autor: {commit.author} • Rama: <span className="text-indigo-600 font-bold font-mono">{commit.branch}</span></p>
                  </div>
                ))}
              </div>

              {/* Pull Requests */}
              <div className="space-y-3">
                <span className="text-[10.5px] font-bold text-slate-450 uppercase tracking-wider block">Pull Requests Activas (PRs)</span>
                {INITIAL_PRS.map(pr => (
                  <div key={pr.id} className="border border-slate-150 p-3 rounded-xl hover:bg-slate-50 text-xs transition">
                    <div className="flex justify-between">
                      <strong className="text-slate-800">#{pr.number} {pr.title}</strong>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                        pr.status === 'OPEN' ? 'bg-amber-50 text-amber-700' : 'bg-green-50 text-green-700'
                      }`}>
                        {pr.status}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-2">Autor: {pr.author} • Creada hace 2 días</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* CI/CD Dynamic Simulator Actions */}
          <React.Suspense fallback={
            <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500 font-mono text-xs animate-pulse">
              Cargando Pipeline de Integración Continua (DevOps)...
            </div>
          }>
            <DevOpsPipeline selectedProjectId={selectedProjectId} projects={segmentedProjects} />
          </React.Suspense>
        </div>
      );

    case 'settings':
      return (
        <SettingsManagerView
          smtpPassword={smtpPassword}
          setSmtpPassword={setSmtpPassword}
          clientsList={clientsList}
          setClientsList={setClientsList}
          sponsorsList={sponsorsList}
          setSponsorsList={setSponsorsList}
        />
      );

    default:
      return null;
  }
};
