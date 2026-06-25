import React, { useState } from 'react';
import {
  Plus,
  Search,
  ChevronLeft,
  Edit2,
  Settings,
  Briefcase,
  UserCheck,
  Cpu,
  Tag,
  Coins,
  Calendar,
  Clock,
  Layers,
  ClipboardList,
  FileText
} from 'lucide-react';

import {
  useSystemStore,
  useProjectsStore,
  useScrumStore
} from '../../../app/providers/AppProviders';

import { getSegmentedProjects, getSegmentedUsers } from '../../../app/selectors/tenantSelectors';
import { getActiveProject } from '../../../app/selectors/projectSelectors';
import { INITIAL_PROJECTS } from '../../../data';

import GanttChart from '../GanttChart';
import ProjectWBSManager from '../ProjectWBSManager';
import { ProjectBudgetView } from './ProjectBudgetView';
import ProjectActivitiesSubTab from '../ProjectActivitiesSubTab';
import ProjectNotesSubTab from '../ProjectNotesSubTab';

export const ProjectPortfolioView: React.FC = () => {
  const {
    users,
    addLog,
    loggedInUser,
    noteTypes
  } = useSystemStore();

  const {
    projects,
    costs,
    selectedProjectId,
    setSelectedProjectId,
    expandedProjectId,
    setExpandedProjectId,
    projectSubTab,
    setProjectSubTab,
    projectSearch,
    setProjectSearch,
    projectStatusFilter,
    setProjectStatusFilter,
    projectPriorityFilter,
    setProjectPriorityFilter,
    projectClientFilter,
    setProjectClientFilter,
    setIsCreateProjectModalOpen,
    setProjectStatusModalTarget,
    setProjectConfigModalTarget
  } = useProjectsStore();

  const {
    sprints,
    workItems,
    setWorkItems,
    activities,
    setActivities
  } = useScrumStore();

  // Status visual dropdown filter state
  const [isStatusFilterDropdownOpen, setIsStatusFilterDropdownOpen] = useState(false);

  const isDevRole = false;

  // Multi-tenant segmentation selectors
  const segmentedProjects = getSegmentedProjects(projects, loggedInUser);
  const segmentedUsers = getSegmentedUsers(users, loggedInUser);

  // Active contextual references
  const activeProject = getActiveProject(segmentedProjects, selectedProjectId, INITIAL_PROJECTS[0]);

  return (
    <div className="space-y-6 animate-fadeIn" id="tab-projects">
      {expandedProjectId === null ? (
        <>
          {/* Highly polished Filters & Create Action Panel */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-slate-900 font-bold text-base">Filtros de Portafolio</h3>
                <p className="text-xs text-slate-500">Refine la vista de proyectos utilizando los campos de búsqueda o atributos.</p>
              </div>
              
              <button
                onClick={() => {
                  if (isDevRole) {
                    alert('Acceso restringido: Su cuenta no posee permisos para registrar nuevos proyectos.');
                    return;
                  }
                  setIsCreateProjectModalOpen(true);
                }}
                disabled={isDevRole}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed active:scale-[0.98] text-white font-extrabold text-xs px-4 py-2.5 rounded-lg transition-all shadow-sm flex items-center gap-2 cursor-pointer"
                title={isDevRole ? "Creación restringida para perfiles de desarrollo" : undefined}
              >
                <Plus className="w-4 h-4" />
                <span>Nuevo Proyecto</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Buscar Proyecto / Cliente</label>
                <div className="relative">
                  <input
                    type="text"
                    value={projectSearch}
                    onChange={e => setProjectSearch(e.target.value)}
                    placeholder="Nombre, código o cliente..."
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-lg pl-8 pr-3 py-2 text-xs text-slate-800 outline-none focus:ring-1 focus:ring-blue-500 transition-all font-semibold"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  {projectSearch && (
                    <button
                      onClick={() => setProjectSearch('')}
                      className="text-slate-400 hover:text-slate-650 text-xs font-bold absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>

              <div className="relative">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Filtrar por Estado (Múltiple)</label>
                <button
                  type="button"
                  onClick={() => setIsStatusFilterDropdownOpen(!isStatusFilterDropdownOpen)}
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-lg px-3 py-2 text-xs text-slate-800 text-left cursor-pointer font-bold flex justify-between items-center whitespace-nowrap overflow-hidden min-h-[34px]"
                >
                  <span className="truncate">
                    {projectStatusFilter.length === 6
                      ? '🟢 Todos los Estados'
                      : projectStatusFilter.length === 0
                      ? '⚠️ Ningún Estado'
                      : projectStatusFilter.map(val => {
                          const matching = [
                            { value: 'REQUERIMIENTOS', label: 'REQUERIMIENTOS', icon: '📋' },
                            { value: 'APROBADO', label: 'APROBADO', icon: '✅' },
                            { value: 'DESARROLLO', label: 'DESARROLLO', icon: '💻' },
                            { value: 'PRUEBAS', label: 'PRUEBAS', icon: '🧪' },
                            { value: 'FINALIZADO', label: 'FINALIZADO', icon: '🏁' },
                            { value: 'CANCELADO', label: 'CANCELADO', icon: '🚫' },
                          ].find(s => s.value === val);
                          return matching ? `${matching.icon} ${matching.label}` : val;
                        }).join(', ')}
                  </span>
                  <span className="text-slate-400 text-[9px] ml-1">▼</span>
                </button>
                
                {isStatusFilterDropdownOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setIsStatusFilterDropdownOpen(false)} 
                    />
                    <div className="absolute right-0 left-0 mt-1 max-h-60 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-xl p-2 z-20 space-y-1">
                      <div className="flex justify-between items-center pb-1.5 mb-1.5 border-b border-slate-100 text-[10px]">
                        <button
                          type="button"
                          onClick={() => setProjectStatusFilter(['REQUERIMIENTOS', 'APROBADO', 'DESARROLLO', 'PRUEBAS', 'FINALIZADO', 'CANCELADO'])}
                          className="text-blue-600 font-extrabold hover:underline"
                        >
                          Todos
                        </button>
                        <button
                          type="button"
                          onClick={() => setProjectStatusFilter([])}
                          className="text-slate-500 font-extrabold hover:underline"
                        >
                          Limpiar
                        </button>
                      </div>
                      {[
                        { value: 'REQUERIMIENTOS', label: 'REQUERIMIENTOS', icon: '📋' },
                        { value: 'APROBADO', label: 'APROBADO', icon: '✅' },
                        { value: 'DESARROLLO', label: 'DESARROLLO', icon: '💻' },
                        { value: 'PRUEBAS', label: 'PRUEBAS', icon: '🧪' },
                        { value: 'FINALIZADO', label: 'FINALIZADO', icon: '🏁' },
                        { value: 'CANCELADO', label: 'CANCELADO', icon: '🚫' },
                      ].map(option => {
                        const isChecked = projectStatusFilter.includes(option.value);
                        return (
                          <label 
                            key={option.value} 
                            className="flex items-center gap-2 p-1 px-2 hover:bg-slate-50 rounded cursor-pointer text-xs font-semibold select-none text-slate-705"
                          >
                            <input 
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                if (isChecked) {
                                  setProjectStatusFilter(projectStatusFilter.filter(s => s !== option.value));
                                } else {
                                  setProjectStatusFilter([...projectStatusFilter, option.value]);
                                }
                              }}
                              className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer w-3.5 h-3.5"
                            />
                            <span>{option.icon} {option.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Filtrar por Prioridad</label>
                <select
                  value={projectPriorityFilter}
                  onChange={e => setProjectPriorityFilter(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none cursor-pointer font-bold"
                >
                  <option value="ALL">⚡ Todas las Prioridades</option>
                  <option value="HIGH">🔴 Alta</option>
                  <option value="MEDIUM">🟡 Media</option>
                  <option value="LOW">🟢 Baja</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Filtrar por Sponsor</label>
                <select
                  value={projectClientFilter}
                  onChange={e => setProjectClientFilter(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none cursor-pointer font-bold"
                >
                  <option value="ALL">👤 Todos los Sponsors</option>
                  {Array.from(new Set(segmentedProjects.map(p => p.sponsor).filter(Boolean))).map(sponsor => {
                    const foundSponsor = users.find(u => u.id === sponsor);
                    const nameLabel = foundSponsor ? `${foundSponsor.first_name} ${foundSponsor.last_name}` : sponsor || 'Sponsor Principal';
                    return (
                      <option key={sponsor} value={sponsor}>👤 {nameLabel}</option>
                    );
                  })}
                </select>
              </div>
            </div>
          </div>

          {/* High Polished List of Projects with Double-Click Instructions */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-slate-900 font-bold text-base">Portafolio de Proyectos Activos</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Haga <strong className="text-blue-600">doble clic</strong> sobre cualquier fila de proyecto para desplegar su planificación ágil, Gantt y control de costos.
                </p>
              </div>
              <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                Lista Interactiva
              </span>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs min-w-[800px]">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3">Código</th>
                    <th className="p-3">Nombre del Proyecto</th>
                    <th className="p-3">Cliente / Sponsor</th>
                    <th className="p-3 font-mono">Presupuesto Límite</th>
                    <th className="p-3 font-mono">Total Gastado</th>
                    <th className="p-3">Consumo Presupuesto</th>
                    <th className="p-3">Progreso de Fechas (Cronograma)</th>
                    <th className="p-3 select-none">Fase de Ciclo</th>
                    <th className="p-3 text-center">Detalle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150">
                  {(() => {
                    const filteredProjects = segmentedProjects.filter(proj => {
                      const matchesSearch = proj.name.toLowerCase().includes(projectSearch.toLowerCase()) || 
                                          proj.code.toLowerCase().includes(projectSearch.toLowerCase()) ||
                                          proj.client.toLowerCase().includes(projectSearch.toLowerCase());
                      const matchesStatus = projectStatusFilter.length === 0 || projectStatusFilter.includes(proj.status);
                      const matchesPriority = projectPriorityFilter === 'ALL' || proj.priority === projectPriorityFilter;
                      const matchesClient = projectClientFilter === 'ALL' || proj.sponsor === projectClientFilter;
                      return matchesSearch && matchesStatus && matchesPriority && matchesClient;
                    });

                    if (filteredProjects.length === 0) {
                      return (
                        <tr>
                          <td colSpan={9} className="p-8 text-center text-slate-400 font-semibold text-xs">
                            No se encontraron proyectos con los filtros aplicados.
                          </td>
                        </tr>
                      );
                    }

                    return filteredProjects.map(proj => {
                      const projCosts = costs.filter(c => c.project_id === proj.id);
                      const totalCost = projCosts.reduce((sum, current) => sum + current.amount, 0);
                      const percentOfBudget = proj.budget_total > 0 ? (totalCost / proj.budget_total) * 100 : 0;
                      const isOverBudget = totalCost > proj.budget_total;
                      const isCurrentlyGlobalActive = selectedProjectId === proj.id;

                      return (
                        <tr 
                          key={proj.id}
                          onDoubleClick={() => {
                            setSelectedProjectId(proj.id);
                            setExpandedProjectId(proj.id);
                            addLog('Sistema', `Expandió por doble clic el proyecto: [${proj.code}] ${proj.name}`);
                          }}
                          className={`group cursor-pointer hover:bg-slate-50/80 transition-all select-none ${isCurrentlyGlobalActive ? 'bg-blue-50/30' : ''}`}
                          title="¡Haga doble clic para ver planificación completa!"
                        >
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded font-mono font-bold text-[10.5px] bg-slate-100 text-slate-800 border border-slate-200 group-hover:bg-white transition-colors">
                              {proj.code}
                            </span>
                          </td>
                          <td className="p-3 font-semibold text-slate-900">
                            <div className="flex items-center gap-1.5">
                              <span>{proj.name}</span>
                              {isCurrentlyGlobalActive && (
                                <span className="text-[9px] bg-blue-600 text-white font-bold px-1.5 py-0.2 rounded shrink-0">Global</span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                                ⚙️ {proj.desarrollo || 'Desarrollo Interno'}
                              </span>
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100/40">
                                🏷️ {proj.categoria || 'Mediano'}
                              </span>
                            </div>
                          </td>
                          <td className="p-3 text-slate-500">
                            <div className="font-semibold text-slate-800">{proj.client}</div>
                            <div className="text-[10px] text-slate-500 font-medium mt-0.5 whitespace-nowrap">
                              👤 Sponsor: {(() => {
                                const foundSponsor = users.find(u => u.id === proj.sponsor);
                                return foundSponsor ? `${foundSponsor.first_name} ${foundSponsor.last_name}` : proj.sponsor || 'Sponsor Principal';
                              })()}
                            </div>
                          </td>
                          <td className="p-3 font-mono font-bold text-slate-800">
                            {isDevRole ? '••••••' : `$${proj.budget_total.toLocaleString('en-US')} USD`}
                          </td>
                          <td className="p-3 font-mono font-bold text-slate-800">
                            <span className={isOverBudget ? 'text-rose-600' : 'text-slate-900'}>
                              {isDevRole ? '••••••' : `$${totalCost.toLocaleString('en-US')} USD`}
                            </span>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                                <div 
                                  className={`h-full rounded-full transition-all ${isOverBudget ? 'bg-rose-500' : percentOfBudget > 85 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                  style={{ width: `${Math.min(percentOfBudget, 100)}%` }}
                                />
                              </div>
                              <span className={`text-[10px] font-mono font-bold ${isOverBudget ? 'text-rose-600' : 'text-slate-600'}`}>
                                {Math.round(percentOfBudget)}%
                              </span>
                            </div>
                          </td>
                          <td className="p-3">
                            {(() => {
                              const startMs = new Date(proj.start_date).getTime();
                              const endMs = new Date(proj.end_date).getTime();
                              const todayMs = new Date('2026-06-08').getTime();
                              let percentElapsed = 0;
                              if (!isNaN(startMs) && !isNaN(endMs) && endMs > startMs) {
                                percentElapsed = Math.round(((todayMs - startMs) / (endMs - startMs)) * 100);
                                percentElapsed = Math.max(0, Math.min(100, percentElapsed));
                              }
                              
                              const formatDateAbbr = (dateStr: string) => {
                                if (!dateStr || !dateStr.includes('-')) return dateStr;
                                const parts = dateStr.split('-');
                                const day = String(parseInt(parts[2], 10)).padStart(2, '0');
                                const monthIndex = parseInt(parts[1], 10) - 1;
                                const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
                                return `${day} ${months[monthIndex] || ''}`;
                              };

                              return (
                                <div className="flex flex-col gap-1 min-w-[140px] max-w-[180px]">
                                  <div className="flex justify-between text-[10px] font-bold text-slate-500 leading-none">
                                    <span>{formatDateAbbr(proj.start_date)}</span>
                                    <span>{formatDateAbbr(proj.end_date)}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                                      <div 
                                        className="h-full rounded-full transition-all bg-indigo-500"
                                        style={{ width: `${percentElapsed}%` }}
                                        title={`Progreso temporal: ${percentElapsed}% de días empleados`}
                                      />
                                    </div>
                                    <span className="text-[10px] font-mono font-bold text-indigo-600 tracking-tighter shrink-0">
                                      {percentElapsed}%
                                    </span>
                                  </div>
                                </div>
                              );
                            })()}
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold tracking-tight uppercase ${
                                proj.status === 'DESARROLLO' ? 'bg-blue-100 text-blue-700' :
                                proj.status === 'FINALIZADO' ? 'bg-emerald-100 text-emerald-800' :
                                proj.status === 'REQUERIMIENTOS' ? 'bg-slate-100 text-slate-600 border border-slate-200' :
                                proj.status === 'PRUEBAS' ? 'bg-amber-100 text-amber-800' : 'bg-rose-105 bg-rose-50 text-rose-700'
                              }`}>
                                {proj.status}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (isDevRole) {
                                    alert('Acceso restringido: Los perfiles de desarrollo no poseen permisos para cambiar el estado o fase de portafolios del proyecto.');
                                    return;
                                  }
                                  setProjectStatusModalTarget(proj);
                                }}
                                disabled={isDevRole}
                                className="text-slate-400 hover:text-blue-600 disabled:hover:text-slate-400 disabled:cursor-not-allowed p-1 hover:bg-slate-100 rounded transition cursor-pointer"
                                title={isDevRole ? "Cambio de fase restringido para perfiles de desarrollo" : "Cambiar Estado del Proyecto (Ventana Emergente)"}
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                          <td className="p-3 text-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedProjectId(proj.id);
                                setExpandedProjectId(proj.id);
                                addLog('Sistema', `Visualizó el proyecto: [${proj.code}] ${proj.name}`);
                              }}
                              className="bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-800 font-bold text-[11px] px-2.5 py-1.5 rounded transition cursor-pointer"
                            >
                              Ver Detalle
                            </button>
                          </td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
          </div>
          </div>
        </>
      ) : (
        <>
          {/* Detailed Deployed View with breadcrumb / Back control */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white border border-slate-200 rounded-xl p-5 shadow-xs gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setExpandedProjectId(null)}
                className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3.5 py-2 rounded-lg transition cursor-pointer select-none"
                onDoubleClick={() => setExpandedProjectId(null)}
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Volver al Listado</span>
              </button>
              <span className="text-slate-300">|</span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block font-mono">Proyecto Detallado</span>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold tracking-tight uppercase border ${
                    activeProject.status === 'DESARROLLO' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                    activeProject.status === 'FINALIZADO' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                    activeProject.status === 'REQUERIMIENTOS' ? 'bg-slate-50 text-slate-600 border-slate-200' :
                    activeProject.status === 'PRUEBAS' ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}>
                    {activeProject.status}
                  </span>
                </div>
                <h4 className="font-bold text-slate-900 text-sm">[{activeProject.code}] {activeProject.name}</h4>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  Cambiar Detalle:
                </label>
                <select
                  value={selectedProjectId}
                  onChange={e => {
                    setSelectedProjectId(e.target.value);
                    setExpandedProjectId(e.target.value);
                  }}
                  className="bg-slate-50 text-slate-850 text-xs rounded-lg border border-slate-250 px-2.5 py-1.5 cursor-pointer font-bold"
                >
                  {segmentedProjects.map(p => (
                    <option key={p.id} value={p.id}>
                      [{p.code}] {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => {
                  if (isDevRole) {
                    alert('Acceso restringido: Los perfiles de desarrollo no poseen permisos para cambiar el estado de portafolios del proyecto.');
                    return;
                  }
                  setProjectStatusModalTarget(activeProject);
                }}
                disabled={isDevRole}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-extrabold text-xs px-4 py-2 rounded-lg flex items-center gap-2 transition-all cursor-pointer shadow-3xs shadow-xs hover:-translate-y-0.5 active:translate-y-0"
                title={isDevRole ? "Cambio de fase restringido para perfiles de desarrollo" : undefined}
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Cambiar Estado</span>
              </button>

              <button
                onClick={() => {
                  if (isDevRole) {
                    alert('Acceso restringido: Los perfiles de desarrollo no poseen permisos para configurar proyectos.');
                    return;
                  }
                  setProjectConfigModalTarget(activeProject);
                }}
                disabled={isDevRole}
                className="bg-slate-100 hover:bg-slate-200 disabled:bg-slate-50 disabled:text-slate-400 text-slate-700 font-extrabold text-xs px-4 py-2 rounded-lg flex items-center gap-2 transition-all cursor-pointer border border-slate-200"
                title={isDevRole ? "Editor restringido para perfiles de desarrollo" : undefined}
              >
                <Settings className="w-3.5 h-3.5 text-slate-500" />
                <span>Configurar Proyecto</span>
              </button>
            </div>
          </div>

          {/* PROJECT CONFIGURATION METADATA RIBBON */}
          <div className="grid grid-cols-2 md:grid-cols-7 gap-4 bg-white border border-slate-200 rounded-xl p-4 mt-4 shadow-3xs text-xs animate-fadeIn">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
                <Briefcase className="w-4 h-4" />
              </div>
              <div className="overflow-hidden">
                <span className="block text-[10px] uppercase font-bold text-slate-400">Cliente</span>
                <span className="font-semibold text-slate-800 truncate block whitespace-nowrap">{activeProject.client || 'General'}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg shrink-0">
                <UserCheck className="w-4 h-4" />
              </div>
              <div className="overflow-hidden">
                <span className="block text-[10px] uppercase font-bold text-slate-400">Sponsor</span>
                <span className="font-semibold text-slate-800 truncate block whitespace-nowrap">
                  {(() => {
                    const foundSponsor = users.find(u => u.id === activeProject.sponsor);
                    return foundSponsor ? `${foundSponsor.first_name} ${foundSponsor.last_name}` : activeProject.sponsor || 'Sponsor Principal';
                  })()}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-100 text-slate-700 rounded-lg shrink-0">
                <Cpu className="w-4 h-4 text-slate-600" />
              </div>
              <div className="overflow-hidden">
                <span className="block text-[10px] uppercase font-bold text-slate-400">Desarrollo</span>
                <span className="font-semibold text-slate-800 text-[11px] truncate block whitespace-nowrap">
                  {activeProject.desarrollo || 'Desarrollo Interno'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg shrink-0">
                <Tag className="w-4 h-4 text-blue-500" />
              </div>
              <div className="overflow-hidden">
                <span className="block text-[10px] uppercase font-bold text-slate-400">Categoría</span>
                <span className="font-semibold text-slate-800 text-[11px] truncate block whitespace-nowrap">
                  {activeProject.categoria || 'Mediano'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-50 text-amber-600 rounded-lg shrink-0">
                <Coins className="w-4 h-4" />
              </div>
              <div>
                <span className="block text-[10px] uppercase font-bold text-slate-400">Presupuesto</span>
                <span className="font-mono font-bold text-slate-800">${activeProject.budget_total?.toLocaleString()} USD</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-rose-50 text-rose-600 rounded-lg shrink-0">
                <Calendar className="w-4 h-4" />
              </div>
              <div className="overflow-hidden">
                <span className="block text-[10px] uppercase font-bold text-slate-400">Cronograma</span>
                <span className="font-semibold text-slate-700 text-[11px] truncate block whitespace-nowrap">{activeProject.start_date} al {activeProject.end_date}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 col-span-2 md:col-span-1">
              <div className="p-2 bg-sky-50 text-sky-600 rounded-lg shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <span className="block text-[10px] uppercase font-bold text-slate-400">Sprint</span>
                <span className="font-semibold text-sky-850 font-bold bg-sky-50 border border-sky-100 px-2 py-0.5 rounded text-[11px] block mt-0.5 w-fit">
                  {activeProject.sprint_size_days !== undefined ? activeProject.sprint_size_days : 10}d
                </span>
              </div>
            </div>
          </div>

          {/* SUB-TABS: (Estructura Jerarquica del proyecto) & (Control de Rubros de Presupuesto Asignado vs. Ejecutado y Historial de Documentos Registrados) */}
          <div className="flex border-b border-slate-200 mt-6 select-none bg-white p-1 rounded-t-xl gap-2 shadow-3xs">
            <button
              onClick={() => setProjectSubTab('wbs')}
              className={`px-5 py-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
                projectSubTab === 'wbs'
                  ? 'border-blue-600 text-blue-600 font-extrabold bg-blue-50/40 rounded-t-lg'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Layers className="w-4 h-4 text-blue-500" />
              <span>Cronograma de actividades</span>
            </button>
            <button
              onClick={() => setProjectSubTab('costs')}
              className={`px-5 py-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
                projectSubTab === 'costs'
                  ? 'border-blue-600 text-blue-600 font-extrabold bg-blue-50/40 rounded-t-lg'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Coins className="w-4 h-4 text-indigo-500" />
              <span>Presupuesto</span>
            </button>
            <button
              onClick={() => setProjectSubTab('activities')}
              className={`px-5 py-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
                projectSubTab === 'activities'
                  ? 'border-emerald-600 text-emerald-600 font-extrabold bg-emerald-50/40 rounded-t-lg'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <ClipboardList className="w-4 h-4 text-emerald-555 text-emerald-500" />
              <span>Actividades</span>
            </button>
            <button
              onClick={() => setProjectSubTab('notes')}
              className={`px-5 py-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
                projectSubTab === 'notes'
                  ? 'border-indigo-600 text-indigo-600 font-extrabold bg-indigo-50/40 rounded-t-lg'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileText className="w-4 h-4 text-indigo-500" />
              <span>Notas de Proyecto</span>
            </button>
          </div>

          {/* 2. SUB-TAB VIEW CONTENT */}
          {projectSubTab === 'wbs' && (
            <div className="bg-white border border-t-0 border-slate-200 rounded-b-xl p-4 shadow-sm animate-fadeIn">
              <ProjectWBSManager
                projectId={selectedProjectId}
                users={segmentedUsers}
                addLog={addLog}
                isDevRole={isDevRole}
                sprints={sprints}
              />
            </div>
          )}

          {projectSubTab === 'costs' && (
            <ProjectBudgetView />
          )}

          {projectSubTab === 'activities' && (
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
          )}

          {projectSubTab === 'notes' && (
            <div className="bg-white border border-t-0 border-slate-200 rounded-b-xl p-6 shadow-sm animate-fadeIn">
              <ProjectNotesSubTab
                projectId={selectedProjectId}
                users={segmentedUsers}
                addLog={addLog}
                noteTypes={noteTypes}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};
