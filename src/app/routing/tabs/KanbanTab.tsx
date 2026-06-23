import React from 'react';
import { useSystemStore, useProjectsStore, useScrumStore, useQaStore } from '../../AppProviders';
import { getSegmentedProjects, getSegmentedUsers } from '../../selectors/tenantSelectors';
import ScrumBoardAndQaManager from '../../../features/scrum/ScrumBoardAndQaManager';

export const KanbanTab: React.FC = () => {
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
    setWorkItems
  } = useScrumStore();

  const {
    testCases,
    setTestCases,
    testRuns,
    setTestRuns
  } = useQaStore();

  const segmentedProjects = getSegmentedProjects(projects, loggedInUser);
  const segmentedUsers = getSegmentedUsers(users, loggedInUser);

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
};
