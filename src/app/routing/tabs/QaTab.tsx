import React from 'react';
import { useSystemStore, useProjectsStore, useScrumStore, useQaStore } from '../../AppProviders';
import { getSegmentedProjects, getSegmentedUsers } from '../../selectors/tenantSelectors';

const QaSuiteWorkspace = React.lazy(() => import('../../../features/qa/QaSuiteWorkspace'));

export const QaTab: React.FC = () => {
  const {
    users,
    addLog,
    loggedInUser
  } = useSystemStore();

  const {
    projects,
    selectedProjectId,
    setSelectedProjectId
  } = useProjectsStore();

  const {
    sprints,
    setSprints,
    workItems,
    setWorkItems,
    activities,
    setActivities
  } = useScrumStore();

  const {
    testCases,
    setTestCases,
    testSuites,
    setTestSuites,
    testRuns,
    setTestRuns
  } = useQaStore();

  const segmentedProjects = getSegmentedProjects(projects, loggedInUser);
  const segmentedUsers = getSegmentedUsers(users, loggedInUser);

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
};
