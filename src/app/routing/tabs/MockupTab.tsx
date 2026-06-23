import React from 'react';
import { useSystemStore, useProjectsStore } from '../../AppProviders';
import { getSegmentedProjects } from '../../selectors/tenantSelectors';

const MockupCanvas = React.lazy(() => import('../../../features/mockups/MockupCanvas'));

export const MockupTab: React.FC = () => {
  const { loggedInUser } = useSystemStore();
  const { projects, selectedProjectId, setSelectedProjectId } = useProjectsStore();

  const segmentedProjects = getSegmentedProjects(projects, loggedInUser);

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
};
