import React from 'react';
import { useSystemStore } from '../AppProviders';
import { hasTabAccess } from '../utils/permissions';

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
  const { activeTab, loggedInUser } = useSystemStore();

  const hasAccess = hasTabAccess(loggedInUser?.role, activeTab);

  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white border border-slate-200 rounded-xl shadow-xs text-center space-y-4 max-w-lg mx-auto mt-8 animate-fadeIn" id="access-denied-view">
        <div className="w-14 h-14 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 shadow-sm border border-rose-100">
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <div>
          <h4 className="text-slate-900 font-bold text-base">Acceso Denegado</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-sm">
            Tu perfil actual (<strong className="text-indigo-600 font-semibold">{loggedInUser?.role || 'Ninguno'}</strong>) no cuenta con los permisos necesarios para acceder al módulo <strong className="font-semibold text-slate-700">"{activeTab}"</strong>.
          </p>
        </div>
        <p className="text-[11px] text-slate-400 max-w-xs leading-relaxed">
          Si requieres acceder a esta sección, solicita a un Administrador que actualice las políticas de acceso de tu perfil de seguridad.
        </p>
      </div>
    );
  }

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
