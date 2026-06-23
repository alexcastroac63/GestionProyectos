import React from 'react';
import { useSystemStore, useProjectsStore, useScrumStore } from '../../AppProviders';
import { getSegmentedProjects, getSegmentedUsers } from '../../selectors/tenantSelectors';
import { QuickBacklogItemForm } from '../../../features/backlog/components/QuickBacklogItemForm';
import ProductBacklogManager from '../../../features/backlog/ProductBacklogManager';

export const BacklogTab: React.FC = () => {
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

  const segmentedProjects = getSegmentedProjects(projects, loggedInUser);
  const segmentedUsers = getSegmentedUsers(users, loggedInUser);

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
};
