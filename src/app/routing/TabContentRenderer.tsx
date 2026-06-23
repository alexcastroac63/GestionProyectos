import React from 'react';
import { useSystemStore } from '../AppProviders';

// Modular Tab Views
import { DashboardTab } from './tabs/DashboardTab';
import { ProjectPortfolioView } from '../../features/projects/components/ProjectPortfolioView';
import { ActivitiesTab } from './tabs/ActivitiesTab';
import { BacklogTab } from './tabs/BacklogTab';
import { KanbanTab } from './tabs/KanbanTab';
import { QaTab } from './tabs/QaTab';
import { MockupTab } from './tabs/MockupTab';
import { TeamsTab } from './tabs/TeamsTab';
import { DbaTab } from './tabs/DbaTab';
import { DevOpsTab } from './tabs/DevOpsTab';
import { SettingsTab } from './tabs/SettingsTab';

export const TabContentRenderer: React.FC = () => {
  const { activeTab } = useSystemStore();

  switch (activeTab) {
    case 'dashboard':
      return <DashboardTab />;

    case 'projects':
      return <ProjectPortfolioView />;

    case 'activities':
      return <ActivitiesTab />;

    case 'backlog':
      return <BacklogTab />;

    case 'kanban':
      return <KanbanTab />;

    case 'qa':
      return <QaTab />;

    case 'mockup':
      return <MockupTab />;

    case 'teams':
      return <TeamsTab />;

    case 'dba':
      return <DbaTab />;

    case 'devops':
      return <DevOpsTab />;

    case 'settings':
      return <SettingsTab />;

    default:
      return null;
  }
};
