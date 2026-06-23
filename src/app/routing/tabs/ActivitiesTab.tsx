import React from 'react';
import { ClipboardList } from 'lucide-react';
import { useSystemStore, useProjectsStore, useScrumStore } from '../../AppProviders';
import { getSegmentedProjects, getSegmentedUsers } from '../../selectors/tenantSelectors';
import { getProjectSprints, getActiveSprint } from '../../selectors/projectSelectors';
import ProjectActivitiesSubTab from '../../../features/projects/ProjectActivitiesSubTab';

export const ActivitiesTab: React.FC = () => {
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
    workItems,
    setWorkItems,
    activities,
    setActivities,
    selectedSprintId
  } = useScrumStore();

  const segmentedProjects = getSegmentedProjects(projects, loggedInUser);
  const segmentedUsers = getSegmentedUsers(users, loggedInUser);

  const projectSprints = getProjectSprints(sprints, selectedProjectId);
  const activeSprint = getActiveSprint(projectSprints, selectedSprintId);

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
};
