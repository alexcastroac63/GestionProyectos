import React from 'react';
import { useSystemStore, useProjectsStore, useScrumStore, useQaStore } from '../../AppProviders';
import { getSegmentedProjects, getSegmentedUsers } from '../../selectors/tenantSelectors';
import KPIDashboard from '../../../features/dashboard/KPIDashboard';

export const DashboardTab: React.FC = () => {
  const { loggedInUser, users } = useSystemStore();
  const { projects, costs } = useProjectsStore();
  const { sprints, workItems, activities } = useScrumStore();
  const { testRuns, testCases } = useQaStore();

  const segmentedProjects = getSegmentedProjects(projects, loggedInUser);
  const segmentedUsers = getSegmentedUsers(users, loggedInUser);

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
};
