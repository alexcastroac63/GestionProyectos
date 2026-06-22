import React, { useState, useEffect } from 'react';
import { ProjectActivity, WorkItem, User, Sprint } from '../types';
import { 
  Plus, 
  Trash2, 
  UserCheck, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Layers, 
  Tag, 
  X,
  Bug,
  ClipboardList,
  CheckCircle,
  Play,
  BookOpen,
  ListTodo,
  CheckSquare,
  FileText,
  ChevronDown,
  ChevronUp,
  FolderGit
} from 'lucide-react';

interface ProjectActivitiesSubTabProps {
  projectId: string;
  users: User[];
  sprints: Sprint[];
  workItems: WorkItem[];
  setWorkItems: React.Dispatch<React.SetStateAction<WorkItem[]>>;
  activities: ProjectActivity[];
  setActivities: React.Dispatch<React.SetStateAction<ProjectActivity[]>>;
  addLog: (user: string, text: string) => void;
}

export default function ProjectActivitiesSubTab({
  projectId,
  users,
  sprints,
  workItems,
  setWorkItems,
  activities,
  setActivities,
  addLog
}: ProjectActivitiesSubTabProps) {
  // Local states
  const [activitiesViewMode, setActivitiesViewMode] = useState<'listado' | 'desglose'>('listado');
  const [selectedSprintFilter, setSelectedSprintFilter] = useState<string>(() => {
    const activeSp = sprints.find(s => s.project_id === projectId && (s.status === 'EN_CURSO' || (s.status as string) === 'ACTIVO'));
    return activeSp ? activeSp.id : 'ALL';
  });
  const [expandedHuId, setExpandedHuId] = useState<string | null>(null);

  // Sync selected sprint when projectId changes
  useEffect(() => {
    const activeSp = sprints.find(s => s.project_id === projectId && (s.status === 'EN_CURSO' || (s.status as string) === 'ACTIVO'));
    if (activeSp) {
      setSelectedSprintFilter(activeSp.id);
    } else {
      setSelectedSprintFilter('ALL');
    }
  }, [projectId, sprints]);
  
  // Forms states
  const [isNewActivityModalOpen, setIsNewActivityModalOpen] = useState(false);
  const [isNewBacklogItemModalOpen, setIsNewBacklogItemModalOpen] = useState(false);
  
  // New Activity form state
  const [actName, setActName] = useState('');
  const [actDesc, setActDesc] = useState('');
  const [actSprintId, setActSprintId] = useState('');
  const [actAssigneeId, setActAssigneeId] = useState('');
  const [actWorkItemId, setActWorkItemId] = useState('');
  const [actStartDate, setActStartDate] = useState('2026-06-15');
  const [actEndDate, setActEndDate] = useState('2026-06-25');
  const [actDuration, setActDuration] = useState(10);

  // New Backlog item form state
  const [btTitle, setBtTitle] = useState('');
  const [btDesc, setBtDesc] = useState('');
  const [btType, setBtType] = useState<'TAREA' | 'BUG'>('TAREA');
  const [btSprintId, setBtSprintId] = useState('');
  const [btAssigneeId, setBtAssigneeId] = useState('');
  const [btPriority, setBtPriority] = useState<'HIGH' | 'MEDIUM' | 'LOW'>('MEDIUM');

  // Filter project-specific sprints, activities, and work items
  const projectSprints = sprints.filter(s => s.project_id === projectId);
  const projectActivities = activities.filter(a => a.project_id === projectId);
  const projectWorkItems = workItems.filter(wi => wi.project_id === projectId);

  // Filtered by sprint selection
  const filteredActivities = selectedSprintFilter === 'ALL'
    ? projectActivities
    : selectedSprintFilter === 'BACKLOG'
      ? projectActivities.filter(a => !a.sprint_id)
      : projectActivities.filter(a => a.sprint_id === selectedSprintFilter);

  const filteredWorkItems = selectedSprintFilter === 'ALL'
    ? projectWorkItems
    : selectedSprintFilter === 'BACKLOG'
      ? projectWorkItems.filter(wi => !wi.sprint_id)
      : projectWorkItems.filter(wi => wi.sprint_id === selectedSprintFilter);

  // Handlers for standard ProjectActivity
  const handleCreateActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!actName.trim() || !actWorkItemId) return;

    const newAct: ProjectActivity = {
      id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      project_id: projectId,
      sprint_id: actSprintId || undefined,
      work_item_id: actWorkItemId || undefined,
      name: actName.trim(),
      description: actDesc.trim(),
      assigned_to_id: actAssigneeId || undefined,
      start_date: actStartDate,
      end_date: actEndDate,
      duration_days: Number(actDuration) || 5,
      progress: 0,
      status: 'PENDIENTE'
    };

    setActivities(prev => [...prev, newAct]);
    
    // Log trace
    const sprintName = actSprintId ? (sprints.find(s => s.id === actSprintId)?.name || 'Sprint') : 'Backlog General';
    const assUser = users.find(u => u.id === actAssigneeId);
    const assName = assUser ? `${assUser.first_name} ${assUser.last_name}` : 'Sin asignar';
    const huNameStr = actWorkItemId ? ` (Asociada a HU [${workItems.find(w => w.id === actWorkItemId)?.key || 'HU'}])` : '';
    addLog('Sistema', `Creó actividad de cronograma: "${newAct.name}" para ${sprintName}${huNameStr}, asignado a: ${assName}`);

    // Reset
    setActName('');
    setActDesc('');
    setActSprintId('');
    setActAssigneeId('');
    setActWorkItemId('');
    setIsNewActivityModalOpen(false);
  };

  const handleDeleteActivity = (id: string, name: string) => {
    if (confirm(`¿Está seguro de eliminar la actividad "${name}" del cronograma?`)) {
      setActivities(prev => prev.filter(a => a.id !== id));
      addLog('Sistema', `Eliminó la actividad de cronograma: "${name}"`);
    }
  };

  const handleUpdateActivityAssignee = (actId: string, userId: string) => {
    setActivities(prev => prev.map(a => a.id === actId ? { ...a, assigned_to_id: userId || undefined } : a));
    const userObj = users.find(u => u.id === userId);
    addLog('Sistema', `Reasignó actividad de cronograma a: ${userObj ? `${userObj.first_name} ${userObj.last_name}` : 'Sin asignar'}`);
  };

  const handleUpdateActivityStatus = (actId: string, status: 'PENDIENTE' | 'EN_CURSO' | 'COMPLETADA') => {
    setActivities(prev => prev.map(a => {
      if (a.id === actId) {
        return {
          ...a,
          status,
          progress: status === 'COMPLETADA' ? 100 : status === 'EN_CURSO' ? 50 : 0
        };
      }
      return a;
    }));
    addLog('Sistema', `Actualizó estado de actividad de cronograma a: ${status}`);
  };

  const handleUpdateActivitySprint = (actId: string, sprintId: string) => {
    setActivities(prev => prev.map(a => a.id === actId ? { ...a, sprint_id: sprintId || undefined } : a));
    const sName = sprintId ? (sprints.find(s => s.id === sprintId)?.name || 'Sprint') : 'Backlog General';
    addLog('Sistema', `Movió actividad de cronograma a: ${sName}`);
  };

  const handleUpdateActivityWorkItem = (actId: string, workItemId: string) => {
    setActivities(prev => prev.map(a => a.id === actId ? { ...a, work_item_id: workItemId || undefined } : a));
    const wiObj = workItems.find(wi => wi.id === workItemId);
    addLog('Sistema', `Actualizó asociación de actividad a: ${wiObj ? `[${wiObj.key}] ${wiObj.title}` : 'Sin HU asociada'}`);
  };

  // Handlers for Backlog WorkItems
  const handleCreateBacklogItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!btTitle.trim()) return;

    // Count existing to generate key
    const currentCount = workItems.filter(wi => wi.type === btType).length;
    const prefix = btType === 'BUG' ? 'BUG' : 'TSK';
    const key = `${prefix}-${100 + currentCount + 1}`;

    const newWI: WorkItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      project_id: projectId,
      sprint_id: btSprintId || undefined,
      key,
      title: btTitle.trim(),
      description: btDesc.trim(),
      type: btType,
      status: btSprintId ? 'POR_HACER' : 'BACKLOG',
      priority: btPriority,
      assignee_id: btAssigneeId || undefined,
      created_at: new Date().toISOString()
    };

    setWorkItems(prev => [...prev, newWI]);

    const sName = btSprintId ? (sprints.find(s => s.id === btSprintId)?.name || 'Sprint') : 'Backlog General';
    const assUser = users.find(u => u.id === btAssigneeId);
    const assName = assUser ? `${assUser.first_name} ${assUser.last_name}` : 'Sin asignar';
    addLog('Sistema', `Creó ítem de backlog [${key}]: "${newWI.title}" (${btType}) para ${sName}, asignado a: ${assName}`);

    // Reset
    setBtTitle('');
    setBtDesc('');
    setBtSprintId('');
    setBtAssigneeId('');
    setBtPriority('MEDIUM');
    setIsNewBacklogItemModalOpen(false);
  };

  const handleDeleteBacklogItem = (id: string, keyCode: string, titleStr: string) => {
    if (confirm(`¿Está seguro de eliminar el ítem de backlog [${keyCode}] ${titleStr}?`)) {
      setWorkItems(prev => prev.filter(wi => wi.id !== id));
      addLog('Sistema', `Eliminó ítem de backlog: [${keyCode}] ${titleStr}`);
    }
  };

  const handleUpdateBacklogAssignee = (itemId: string, userId: string) => {
    setWorkItems(prev => prev.map(wi => wi.id === itemId ? { ...wi, assignee_id: userId || undefined } : wi));
    const userObj = users.find(u => u.id === userId);
    addLog('Sistema', `Reasignó ítem de backlog a: ${userObj ? `${userObj.first_name} ${userObj.last_name}` : 'Sin asignar'}`);
  };

  const handleUpdateBacklogStatus = (itemId: string, status: any) => {
    setWorkItems(prev => prev.map(wi => wi.id === itemId ? { ...wi, status } : wi));
    addLog('Sistema', `Cambió estado de ítem de backlog a: ${status}`);
  };

  const handleUpdateBacklogSprint = (itemId: string, sprintId: string) => {
    setWorkItems(prev => prev.map(wi => {
      if (wi.id === itemId) {
        return {
          ...wi,
          sprint_id: sprintId || undefined,
          status: (wi.status === 'BACKLOG' && sprintId) ? 'POR_HACER' : (!sprintId ? 'BACKLOG' : wi.status)
        };
      }
      return wi;
    }));
    const sName = sprintId ? (sprints.find(s => s.id === sprintId)?.name || 'Sprint') : 'Backlog General';
    addLog('Sistema', `Movió ítem de backlog a: ${sName}`);
  };

  return (
    <div className="bg-white border border-t-0 border-slate-200 rounded-b-xl p-5 shadow-sm space-y-6 animate-fadeIn" id="project-activities-subtab">
      
      {/* Banner de Bienvenida y Resumen */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-emerald-600" />
            Control de Actividades Agile y Backlog por Sprint
          </h3>
          <p className="text-[11px] text-slate-500 mt-1">
            Gestione las asignaciones, cronograma y estados de las actividades y elementos de trabajo del proyecto agrupados de forma dinámica por Sprint o Backlog general.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsNewBacklogItemModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] px-3.5 py-2 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-3xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nuevo Bug / Tarea Backlog</span>
          </button>
        </div>
      </div>

      {/* Tarjetas de Counters y Controles de Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Actividades Cronograma</span>
          <span className="text-2xl font-black font-mono text-blue-700 mt-1 block">
            {projectActivities.length}
          </span>
          <span className="text-[9px] text-slate-500 mt-1 block">
            {projectActivities.filter(a => a.status === 'COMPLETADA').length} completadas • {projectActivities.filter(a => a.status === 'EN_CURSO').length} en desarrollo
          </span>
        </div>

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Bugs & Tareas (Backlog)</span>
          <span className="text-2xl font-black font-mono text-emerald-700 mt-1 block">
            {projectWorkItems.length}
          </span>
          <span className="text-[9px] text-slate-500 mt-1 block">
            {projectWorkItems.filter(w => w.type === 'BUG').length} Bugs Activos • {projectWorkItems.filter(w => w.type === 'TAREA').length} Tareas prioritarias
          </span>
        </div>

        {/* Filtro de Sprint */}
        <div className="md:col-span-2 bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col justify-between">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Filtrar Vista por Sprint
            </label>
            <select
              value={selectedSprintFilter}
              onChange={(e) => setSelectedSprintFilter(e.target.value)}
              className="w-full bg-white border border-slate-250 rounded-lg px-3 py-2 text-xs text-slate-800 font-bold focus:outline-none cursor-pointer hover:border-slate-350"
            >
              <option value="ALL">🏃‍♂️ Todos los Sprints y Backlog ({projectActivities.length + projectWorkItems.length})</option>
              {projectSprints.map(s => {
                const actCount = projectActivities.filter(a => a.sprint_id === s.id).length;
                const wiCount = projectWorkItems.filter(wi => wi.sprint_id === s.id).length;
                return (
                  <option key={s.id} value={s.id}>
                    📦 {s.name} ({actCount + wiCount} ítems) — Estado: {s.status}
                  </option>
                );
              })}
              <option value="BACKLOG">🗄️ Sin Sprint asignado (Product Backlog)</option>
            </select>
          </div>
          <span className="text-[9.5px] text-slate-400 mt-1.5 select-none block italic">
            Visualice qué actividades se están desarrollando en cada iteración del ciclo de vida.
          </span>
        </div>
      </div>

      {/* Selector de Vista de Actividades */}
      <div className="flex border-b border-slate-250/20 pb-4 justify-between items-center flex-wrap gap-2">
        <div className="flex items-center gap-2 p-1 bg-slate-50 rounded-lg border border-slate-200 shadow-3xs">
          <button
            onClick={() => setActivitiesViewMode('listado')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-black rounded-md transition duration-155 cursor-pointer ${
              activitiesViewMode === 'listado'
                ? 'bg-white text-blue-700 shadow-sm border border-slate-200/50'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <ListTodo className="w-3.5 h-3.5" />
            <span>Listado de Actividades ({filteredActivities.length})</span>
          </button>

          <button
            onClick={() => setActivitiesViewMode('desglose')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-black rounded-md transition duration-155 cursor-pointer ${
              activitiesViewMode === 'desglose'
                ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/50'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Desglose por HU ({projectWorkItems.filter(wi => wi.type === 'HISTORIA_USUARIO').length})</span>
          </button>
        </div>

        <div>
          <button
            onClick={() => {
              setActWorkItemId('');
              setActSprintId('');
              setIsNewActivityModalOpen(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[11px] px-3.5 py-2 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-3xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Registrar Nueva Actividad</span>
          </button>
        </div>
      </div>

      {/* RENDER VISTA 1: LISTADO PLANO Y DETALLADO */}
      {activitiesViewMode === 'listado' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-450 flex items-center gap-1">
              <ListTodo className="w-3 h-3 text-blue-600" /> Registro General de Actividades del Proyecto
            </span>
            <span className="text-[9px] font-bold bg-blue-50 text-blue-700 px-2 py-0.2 rounded font-mono">
              {filteredActivities.length} actividades encontradas
            </span>
          </div>

          <div className="border border-slate-150 rounded-xl overflow-hidden bg-white shadow-3xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold select-none">
                  <tr>
                    <th className="p-3">Nombre Actividad / Requerimiento</th>
                    <th className="p-3">Historia de Usuario (HU)</th>
                    <th className="p-3">Sprint Asociado</th>
                    <th className="p-3">Responsable</th>
                    <th className="p-3">Fechas & Progreso</th>
                    <th className="p-3">Estado</th>
                    <th className="p-3 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredActivities.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-slate-400 italic text-xs bg-slate-50/50">
                        No hay ninguna actividad registrada para el sprint actual o no se han asociado HUs. Use el botón "Registrar Nueva Actividad" de arriba para comenzar.
                      </td>
                    </tr>
                  ) : (
                    filteredActivities.map(act => {
                      const associatedHu = projectWorkItems.find(wi => wi.id === act.work_item_id);
                      return (
                        <tr key={act.id} className="hover:bg-slate-50/70 transition">
                          <td className="p-3">
                            <div className="font-bold text-slate-900 leading-tight">
                              {act.name}
                            </div>
                            {act.description && (
                              <p className="text-[10px] text-slate-450 mt-1 max-w-xs truncate" title={act.description}>
                                {act.description}
                              </p>
                            )}
                          </td>

                          <td className="p-3">
                            {associatedHu ? (
                              <div className="flex flex-col gap-0.5 max-w-[150px]">
                                <span className="px-1.5 py-0.5 rounded font-mono font-bold text-[9.5px] bg-indigo-50 text-indigo-700 border border-indigo-150 inline-block w-fit">
                                  {associatedHu.key}
                                </span>
                                <span className="text-[10px] font-semibold text-slate-600 truncate" title={associatedHu.title}>
                                  {associatedHu.title}
                                </span>
                              </div>
                            ) : (
                              <select
                                value={act.work_item_id || ''}
                                onChange={(e) => handleUpdateActivityWorkItem(act.id, e.target.value)}
                                className="bg-slate-50 border border-slate-200 py-1 px-2 rounded font-bold text-[10.5px] text-indigo-700 cursor-pointer w-full focus:outline-none focus:bg-white"
                              >
                                <option value="">📂 Asociar a HU...</option>
                                {projectWorkItems.filter(wi => wi.type === 'HISTORIA_USUARIO').map(hu => (
                                  <option key={hu.id} value={hu.id}>📂 [{hu.key}] {hu.title}</option>
                                ))}
                              </select>
                            )}
                          </td>

                          <td className="p-3">
                            <select
                              value={act.sprint_id || ''}
                              onChange={(e) => handleUpdateActivitySprint(act.id, e.target.value)}
                              className="bg-slate-50 border border-slate-200 py-1 px-2 rounded font-bold text-[10.5px] text-slate-700 cursor-pointer w-full focus:outline-none focus:bg-white"
                            >
                              <option value="">🗄️ Sin Sprint (Backlog)</option>
                              {projectSprints.map(s => (
                                <option key={s.id} value={s.id}>📦 {s.name}</option>
                              ))}
                            </select>
                          </td>

                          <td className="p-3 font-medium">
                            <div className="flex items-center gap-1.5 min-w-[130px]">
                              <UserCheck className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                              <select
                                value={act.assigned_to_id || ''}
                                onChange={(e) => handleUpdateActivityAssignee(act.id, e.target.value)}
                                className="bg-slate-50 border border-slate-200 py-1 px-1.5 rounded text-[10.5px] text-slate-700 cursor-pointer w-full focus:outline-none focus:bg-white"
                              >
                                <option value="">👤 Sin Asignar</option>
                                {users.map(u => (
                                  <option key={u.id} value={u.id}>
                                    {u.first_name} {u.last_name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </td>

                          <td className="p-3">
                            <div className="space-y-1 max-w-[130px]">
                              <div className="flex justify-between text-[9px] font-semibold text-slate-400 font-mono">
                                <span>{act.start_date}</span>
                                <span>{act.end_date}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <div className="flex-1 bg-slate-100 h-1.5 rounded-full overflow-hidden border border-slate-200">
                                  <div 
                                    className="bg-indigo-500 h-full rounded-full transition-all"
                                    style={{ width: `${act.progress || 0}%` }}
                                  />
                                </div>
                                <span className="text-[9px] font-mono font-bold text-slate-650">{act.progress}%</span>
                              </div>
                            </div>
                          </td>

                          <td className="p-3">
                            <select
                              value={act.status}
                              onChange={(e) => handleUpdateActivityStatus(act.id, e.target.value as any)}
                              className={`font-semibold text-[10px] px-2 py-1 rounded border cursor-pointer focus:outline-none ${
                                act.status === 'COMPLETADA' 
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-250' 
                                  : act.status === 'EN_CURSO'
                                    ? 'bg-blue-50 text-blue-700 border-blue-250'
                                    : 'bg-slate-100 text-slate-630 border-slate-200 text-slate-600'
                              }`}
                            >
                              <option value="PENDIENTE">⏳ PENDIENTE</option>
                              <option value="EN_CURSO">⚙️ EN CURSO</option>
                              <option value="COMPLETADA">✅ COMPLETADA</option>
                            </select>
                          </td>

                          <td className="p-3 text-center">
                            <button
                              onClick={() => handleDeleteActivity(act.id, act.name)}
                              className="text-slate-400 hover:text-red-500 p-1.5 rounded transition hover:bg-slate-50 inline-flex items-center"
                              title="Eliminar Actividad"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* RENDER VISTA 2: DESGLOSE POR HISTORIA DE USUARIO */}
      {activitiesViewMode === 'desglose' && (
        <div className="space-y-4 pt-2 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-450 flex items-center gap-1">
              <BookOpen className="w-3 h-3 text-indigo-500" /> Desglose de Actividades Técnicas por Historia de Usuario (HU)
            </span>
            <span className="text-[9px] font-bold bg-indigo-50 text-indigo-700 px-2 py-0.2 rounded font-mono">
              {projectWorkItems.filter(wi => wi.type === 'HISTORIA_USUARIO').length} HUs registradas
            </span>
          </div>

            {projectWorkItems.filter(wi => wi.type === 'HISTORIA_USUARIO').length === 0 ? (
              <p className="text-center py-6 text-slate-400 italic text-xs bg-slate-50 rounded-xl border border-slate-150">
                No hay Historias de Usuario (HU) registradas en este proyecto aún. Use el botón "+ Nuevo Bug / Tarea Backlog" para crear una.
              </p>
            ) : (
              <div className="space-y-4">
                {projectWorkItems.filter(wi => wi.type === 'HISTORIA_USUARIO').map(hu => {
                  const huActivities = projectActivities.filter(a => a.work_item_id === hu.id);
                  const isExpanded = expandedHuId === hu.id;
                  const huSprint = sprints.find(s => s.id === hu.sprint_id);

                  return (
                    <div key={hu.id} className="bg-indigo-55/10 bg-indigo-50/5 border border-indigo-100 rounded-xl shadow-3xs overflow-hidden transition-all duration-155">
                      {/* Cabecera de la HU */}
                      <div className="bg-slate-50/50 p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-indigo-100/50">
                        <div className="flex items-start gap-2.5">
                          <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-indigo-100 text-indigo-700 border border-indigo-200/50 font-mono">
                            {hu.key}
                          </span>
                          <div>
                            <h4 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-2">
                              {hu.title}
                            </h4>
                            <p className="text-[10.5px] text-slate-500 mt-0.5" title={hu.description}>
                              {hu.description || 'Sin glosa descriptiva'} • <span className="font-bold text-slate-650">Sprint: {huSprint ? huSprint.name : 'Backlog General'}</span>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase border ${
                            hu.priority === 'HIGH' 
                              ? 'bg-rose-50 text-rose-700 border-rose-250' 
                              : hu.priority === 'MEDIUM'
                                ? 'bg-amber-50 text-amber-700 border-amber-250'
                                : 'bg-slate-50 text-slate-600 border-slate-200'
                          }`}>
                            {hu.priority === 'HIGH' ? '🔴 Alta' : hu.priority === 'MEDIUM' ? '🟡 Media' : '🟢 Baja'}
                          </span>

                          <span className="font-semibold text-[10px] px-2 py-0.5 rounded bg-indigo-100/40 text-indigo-805 text-indigo-800 border border-indigo-200/40 font-mono">
                            {huActivities.length} {huActivities.length === 1 ? 'Actividad' : 'Actividades'}
                          </span>

                          <button
                            onClick={() => {
                              setActWorkItemId(hu.id);
                              if (hu.sprint_id) setActSprintId(hu.sprint_id);
                              setIsNewActivityModalOpen(true);
                            }}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[10.5px] px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer focus:ring-2 focus:ring-indigo-305"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Nueva Actividad</span>
                          </button>

                          <button
                            onClick={() => setExpandedHuId(isExpanded ? null : hu.id)}
                            className="text-slate-500 hover:text-slate-850 p-1 rounded-md hover:bg-slate-200/60 transition"
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Lista de Actividades de la HU */}
                      {isExpanded && (
                        <div className="p-4 bg-white/70 animate-fadeIn">
                          {huActivities.length === 0 ? (
                            <div className="text-center py-5">
                              <p className="text-[11px] text-slate-450 italic">
                                No se han desglosado actividades técnicas de aseguramiento o desarrollo para esta HU en particular.
                              </p>
                              <button
                                onClick={() => {
                                  setActWorkItemId(hu.id);
                                  if (hu.sprint_id) setActSprintId(hu.sprint_id);
                                  setIsNewActivityModalOpen(true);
                                }}
                                className="text-indigo-600 hover:text-indigo-800 text-[10.5px] font-bold underline mt-1.5 cursor-pointer inline-flex items-center gap-1"
                              >
                                Desglosar primera actividad técnica ahora
                              </button>
                            </div>
                          ) : (
                            <div className="overflow-x-auto border border-slate-150 rounded-xl bg-white">
                              <table className="w-full text-left text-xs">
                                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold font-sans">
                                  <tr>
                                    <th className="p-2.5">Detalle de Actividad</th>
                                    <th className="p-2.5">Responsable</th>
                                    <th className="p-2.5">Cronograma & Progreso</th>
                                    <th className="p-2.5">Estado</th>
                                    <th className="p-2.5 text-center">Desvincular HU / Acción</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {huActivities.map(act => {
                                    return (
                                      <tr key={act.id} className="hover:bg-indigo-50/15 transition text-[11px]">
                                        <td className="p-2.5">
                                          <span className="font-semibold text-slate-800 font-sans block">{act.name}</span>
                                          {act.description && (
                                            <p className="text-[10px] text-slate-400 font-sans truncate max-w-xs" title={act.description}>
                                              {act.description}
                                            </p>
                                          )}
                                        </td>

                                        <td className="p-2.5">
                                          <div className="flex items-center gap-1.5">
                                            <UserCheck className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                                            <select
                                              value={act.assigned_to_id || ''}
                                              onChange={(e) => handleUpdateActivityAssignee(act.id, e.target.value)}
                                              className="bg-slate-50 border border-slate-200 py-1 px-1.5 rounded text-[10.5px] text-slate-700 cursor-pointer w-full focus:outline-none focus:bg-white font-medium"
                                              title="Cada actividad debe poderse asignar de forma única e interactiva"
                                            >
                                              <option value="">👤 Sin Asignar</option>
                                              {users.map(u => (
                                                <option key={u.id} value={u.id}>
                                                  {u.first_name} {u.last_name} ({u.role})
                                                </option>
                                              ))}
                                            </select>
                                          </div>
                                        </td>

                                        <td className="p-2.5">
                                          <div className="space-y-1 max-w-[150px]">
                                            <div className="flex justify-between text-[9px] font-semibold text-slate-400 font-mono animate-none">
                                              <span>{act.start_date}</span>
                                              <span>{act.end_date}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                              <div className="flex-1 bg-slate-100 h-1.5 rounded-full overflow-hidden border border-slate-250/50">
                                                <div 
                                                  className="bg-slate bg-indigo-500 h-full rounded-full transition-all"
                                                  style={{ width: `${act.progress || 0}%` }}
                                                />
                                              </div>
                                              <span className="text-[9.5px] font-mono font-bold text-slate-650">{act.progress}%</span>
                                            </div>
                                          </div>
                                        </td>

                                        <td className="p-2.5">
                                          <select
                                            value={act.status}
                                            onChange={(e) => handleUpdateActivityStatus(act.id, e.target.value as any)}
                                            className={`font-semibold text-[10px] px-1.5 py-0.5 rounded border cursor-pointer focus:outline-none ${
                                              act.status === 'COMPLETADA' 
                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-250' 
                                                : act.status === 'EN_CURSO'
                                                  ? 'bg-blue-50 text-blue-700 border-blue-250'
                                                  : 'bg-slate-100 text-slate-600 border-slate-250'
                                            }`}
                                          >
                                            <option value="PENDIENTE">⏳ PENDIENTE</option>
                                            <option value="EN_CURSO">⚙️ EN CURSO</option>
                                            <option value="COMPLETADA">✅ COMPLETADA</option>
                                          </select>
                                        </td>

                                        <td className="p-2.5 flex items-center justify-center gap-2">
                                          <select
                                            value={act.work_item_id || ''}
                                            onChange={(e) => handleUpdateActivityWorkItem(act.id, e.target.value)}
                                            className="bg-slate-50 border border-slate-200 py-0.5 px-1.5 rounded text-[10px] text-slate-600 max-w-[90px] focus:outline-none focus:bg-white shrink-0"
                                            title="Cambiar asociación de HU"
                                          >
                                            <option value="">Desvincular HU</option>
                                            {projectWorkItems.filter(wi => wi.type === 'HISTORIA_USUARIO').map(hwi => (
                                              <option key={hwi.id} value={hwi.id}>{hwi.key}</option>
                                            ))}
                                          </select>
                                          <button
                                            onClick={() => handleDeleteActivity(act.id, act.name)}
                                            className="text-slate-405 text-slate-400 hover:text-red-500 p-1.5 rounded transition hover:bg-slate-50"
                                            title="Eliminar Actividad"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

              </div>
            )}
          </div>
        )}

      {/* --- FORM MODAL: NUEVA ACTIVIDAD CRONOGRAMA --- */}
      {isNewActivityModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full max-h-[90vh] flex flex-col shadow-2xl animate-scaleUp overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-200 p-4 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-wider">
                <Calendar className="w-4 h-4 text-blue-500" />
                <span>Registrar Actividad Cronograma</span>
              </div>
              <button
                type="button"
                onClick={() => setIsNewActivityModalOpen(false)}
                className="text-slate-404 text-slate-400 hover:text-slate-650 p-1 hover:bg-slate-200 rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateActivity} className="p-5 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nombre de Actividad*</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Sincronizar endpoints e interfaces de datos"
                  value={actName}
                  onChange={e => setActName(e.target.value)}
                  className="w-full bg-slate-50 focus:bg-white border border-slate-250 rounded-lg px-2.5 py-2 text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Descripción detallada</label>
                <textarea
                  placeholder="Alcances o dependencias de la actividad"
                  value={actDesc}
                  onChange={e => setActDesc(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-50 focus:bg-white border border-slate-250 rounded-lg px-2.5 py-2 text-xs text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Sprint Asociado</label>
                  <select
                    value={actSprintId}
                    onChange={e => setActSprintId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-250 rounded-lg px-2 py-1.5 text-xs text-slate-800"
                  >
                    <option value="">🗄️ Sin Sprint (Backlog)</option>
                    {projectSprints.map(s => (
                      <option key={s.id} value={s.id}>📦 {s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Asignar Responsable</label>
                  <select
                    value={actAssigneeId}
                    onChange={e => setActAssigneeId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-250 rounded-lg px-2 py-1.5 text-xs text-slate-800"
                  >
                    <option value="">👤 Dejar sin asignar</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.first_name} {u.last_name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Asociar a Historia de Usuario (HU) *</label>
                <select
                  required
                  value={actWorkItemId}
                  onChange={e => {
                    const selectedHuId = e.target.value;
                    setActWorkItemId(selectedHuId);
                    if (selectedHuId) {
                      const associatedHu = projectWorkItems.find(wi => wi.id === selectedHuId);
                      if (associatedHu && associatedHu.sprint_id) {
                        setActSprintId(associatedHu.sprint_id);
                      }
                    }
                  }}
                  className="w-full bg-slate-50 border border-slate-250 rounded-lg px-2.5 py-2 text-xs text-slate-800 font-bold"
                >
                  <option value="">⚠️ Seleccionar Historia de Usuario (Obligatorio)...</option>
                  {projectWorkItems.filter(wi => wi.type === 'HISTORIA_USUARIO').map(hu => (
                    <option key={hu.id} value={hu.id}>📂 [{hu.key}] {hu.title}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Fecha Inicio</label>
                  <input
                    type="date"
                    value={actStartDate}
                    onChange={e => setActStartDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-250 rounded-lg px-2 py-1 text-xs text-slate-800 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Fecha Término</label>
                  <input
                    type="date"
                    value={actEndDate}
                    onChange={e => setActEndDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-250 rounded-lg px-2 py-1 text-xs text-slate-800 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Duración (Días)</label>
                  <input
                    type="number"
                    min={1}
                    value={actDuration}
                    onChange={e => setActDuration(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-250 rounded-lg px-2 py-1 text-xs text-slate-800 font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewActivityModalOpen(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-4 py-2 rounded-lg transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-5 py-2 rounded-lg transition shadow-sm"
                >
                  Guardar Actividad
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- FORM MODAL: NUEVO ELEMENTO BACKLOG (BUG / TAREA) --- */}
      {isNewBacklogItemModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full max-h-[90vh] flex flex-col shadow-2xl animate-scaleUp overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-200 p-4 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs uppercase tracking-wider">
                <Tag className="w-4 h-4 text-emerald-500 animate-pulse" />
                <span>Registrar Ítem de Trabajo Expreso</span>
              </div>
              <button
                type="button"
                onClick={() => setIsNewBacklogItemModalOpen(false)}
                className="text-slate-400 hover:text-slate-650 p-1 hover:bg-slate-200 rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateBacklogItem} className="p-5 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-2.5 rounded-lg border border-slate-200/60 mb-2">
                <label className={`flex items-center justify-center gap-2 p-2 rounded-lg cursor-pointer text-xs font-black transition border-2 ${
                  btType === 'TAREA' 
                    ? 'bg-blue-50/50 text-blue-700 border-blue-500' 
                    : 'bg-white text-slate-500 border-transparent hover:bg-slate-200/50'
                }`}>
                  <input 
                    type="radio" 
                    name="backlogType" 
                    checked={btType === 'TAREA'} 
                    onChange={() => setBtType('TAREA')}
                    className="hidden" 
                  />
                  <span>⚙️ Tarea Técnica</span>
                </label>

                <label className={`flex items-center justify-center gap-2 p-2 rounded-lg cursor-pointer text-xs font-black transition border-2 ${
                  btType === 'BUG' 
                    ? 'bg-rose-50/50 text-rose-700 border-rose-500' 
                    : 'bg-white text-slate-500 border-transparent hover:bg-slate-200/50'
                }`}>
                  <input 
                    type="radio" 
                    name="backlogType" 
                    checked={btType === 'BUG'} 
                    onChange={() => setBtType('BUG')}
                    className="hidden" 
                  />
                  <span>🐞 Bug Técnico</span>
                </label>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Título / Requerimiento*</label>
                <input
                  type="text"
                  required
                  placeholder={btType === 'BUG' ? "Ej. Error 500 al procesar pago del cliente" : "Ej. Implementar modulo de autenticación de seguridad"}
                  value={btTitle}
                  onChange={e => setBtTitle(e.target.value)}
                  className="w-full bg-slate-50 focus:bg-white border border-slate-250 rounded-lg px-2.5 py-2 text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Descripción corta</label>
                <textarea
                  placeholder="Describa el error de QA o especificación de desarrollo de la tarea técnica"
                  value={btDesc}
                  onChange={e => setBtDesc(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-50 focus:bg-white border border-slate-250 rounded-lg px-2.5 py-2 text-xs text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Sprint Objetivo</label>
                  <select
                    value={btSprintId}
                    onChange={e => setBtSprintId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-250 rounded-lg px-2 py-1.5 text-xs text-slate-800"
                  >
                    <option value="">🗄️ Dejar en Backlog General</option>
                    {projectSprints.map(s => (
                      <option key={s.id} value={s.id}>📦 {s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Asignar Desarrollador*</label>
                  <select
                    value={btAssigneeId}
                    onChange={e => setBtAssigneeId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-250 rounded-lg px-2 py-1.5 text-xs text-slate-800 font-bold"
                  >
                    <option value="">👤 Sin Asignar</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.first_name} {u.last_name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Prioridad de Elemento</label>
                <select
                  value={btPriority}
                  onChange={e => setBtPriority(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-250 rounded-lg px-2 py-1.5 text-xs text-slate-800 font-bold"
                >
                  <option value="HIGH">🔴 Prioridad Alta (Crítico)</option>
                  <option value="MEDIUM">🟡 Prioridad Media</option>
                  <option value="LOW">🟢 Prioridad Baja</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewBacklogItemModalOpen(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-4 py-2 rounded-lg transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-5 py-2 rounded-lg transition shadow-sm"
                >
                  Guardar en Backlog
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
