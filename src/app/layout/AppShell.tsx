import React from 'react';
import { useSystemStore, useProjectsStore } from '../AppProviders';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { Footer } from './Footer';
import { FolderKanban, Settings } from 'lucide-react';
import { CreateProjectModal } from '../../features/projects/components/CreateProjectModal';

interface AppShellProps {
  children: React.ReactNode;
  handleLogout: () => void;
  updateProjectStatus: (projId: string, status: any) => void;
}

export const AppShell: React.FC<AppShellProps> = ({
  children,
  handleLogout,
  updateProjectStatus
}) => {
  const {
    deleteConfirmState,
    setDeleteConfirmState,
    addLog,
    clientsList,
    sponsorsList
  } = useSystemStore();

  const {
    setProjects,
    projectConfigModalTarget,
    setProjectConfigModalTarget,
    projectStatusModalTarget,
    setProjectStatusModalTarget
  } = useProjectsStore();

  return (
    <div className="flex h-screen w-full bg-slate-50 font-sans text-slate-900 overflow-hidden antialiased relative">
      {/* Sidebar Navigation */}
      <Sidebar handleLogout={handleLogout} />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden w-full">
        {/* Header Bar */}
        <TopBar handleLogout={handleLogout} />

        {/* Content Panel */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
          {children}
        </div>

        {/* Status Bar */}
        <Footer />

        {/* PROJECT CONFIGURATION MODAL */}
        {projectConfigModalTarget && (
          <div 
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn" 
            onClick={() => setProjectConfigModalTarget(null)}
          >
            <div 
              className="bg-white border border-slate-200 text-slate-800 w-full max-w-lg rounded-xl shadow-2xl overflow-y-auto max-h-[90vh] flex flex-col pt-1" 
              onClick={e => e.stopPropagation()}
            >
              <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center font-sans">
                <div className="flex items-center gap-2">
                  <Settings className="w-4 h-4 text-slate-700" />
                  <h4 className="font-bold text-sm text-slate-850 font-sans text-slate-900">
                    Configurar Proyecto: [{projectConfigModalTarget.code}]
                  </h4>
                </div>
                <button
                  onClick={() => setProjectConfigModalTarget(null)}
                  className="text-slate-400 hover:text-slate-600 font-bold text-lg select-none px-1.5 focus:outline-none transition cursor-pointer"
                >
                  ×
                </button>
              </div>

              <form 
                onSubmit={e => {
                  e.preventDefault();
                  setProjects(prev => prev.map(p => p.id === projectConfigModalTarget.id ? projectConfigModalTarget : p));
                  addLog('Carlos Pérez (PM)', `Actualizó la configuración global del proyecto [${projectConfigModalTarget.code}] ${projectConfigModalTarget.name}`);
                  setProjectConfigModalTarget(null);
                }}
                className="p-5 space-y-4 text-xs font-sans"
              >
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">Nombre del Proyecto</label>
                  <input
                    type="text"
                    required
                    value={projectConfigModalTarget.name}
                    onChange={e => setProjectConfigModalTarget(prev => prev ? { ...prev, name: e.target.value } : null)}
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-lg px-3 py-2 text-xs text-slate-800 font-semibold outline-none transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">Cliente</label>
                    <select
                      value={projectConfigModalTarget.client}
                      onChange={e => setProjectConfigModalTarget(prev => prev ? { ...prev, client: e.target.value } : null)}
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-lg px-3 py-2 text-xs text-slate-800 font-semibold outline-none transition-all cursor-pointer"
                    >
                      {clientsList.map(c => (
                        <option key={c} value={c}>🏢 {c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">Sponsor Principal</label>
                    <select
                      value={projectConfigModalTarget.sponsor}
                      onChange={e => setProjectConfigModalTarget(prev => prev ? { ...prev, sponsor: e.target.value } : null)}
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-lg px-3 py-2 text-xs text-slate-800 font-semibold outline-none transition-all cursor-pointer"
                    >
                      {sponsorsList.map(s => (
                        <option key={s} value={s}>👤 {s}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">Fecha de Inicio</label>
                    <input
                      type="date"
                      required
                      value={projectConfigModalTarget.start_date}
                      onChange={e => setProjectConfigModalTarget(prev => prev ? { ...prev, start_date: e.target.value } : null)}
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-lg px-3 py-2 text-xs text-slate-800 font-semibold outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">Fecha de Fin</label>
                    <input
                      type="date"
                      required
                      value={projectConfigModalTarget.end_date}
                      onChange={e => setProjectConfigModalTarget(prev => prev ? { ...prev, end_date: e.target.value } : null)}
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-lg px-3 py-2 text-xs text-slate-800 font-semibold outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">Presupuesto ($ USD)</label>
                    <input
                      type="number"
                      required
                      value={projectConfigModalTarget.budget_total}
                      onChange={e => setProjectConfigModalTarget(prev => prev ? { ...prev, budget_total: Number(e.target.value) } : null)}
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-lg px-3 py-2 text-xs text-slate-800 font-mono font-bold outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">Tamaño de Sprint (Días Hábiles)*</label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={90}
                      value={projectConfigModalTarget.sprint_size_days !== undefined ? projectConfigModalTarget.sprint_size_days : 10}
                      onChange={e => setProjectConfigModalTarget(prev => prev ? { ...prev, sprint_size_days: Number(e.target.value) } : null)}
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:ring-1 focus:ring-blue-500 rounded-lg px-3 py-2 text-xs text-slate-800 font-mono font-bold outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">Prioridad de Portafolio</label>
                  <select
                    value={projectConfigModalTarget.priority}
                    onChange={e => setProjectConfigModalTarget(prev => prev ? { ...prev, priority: e.target.value as any } : null)}
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-lg px-3 py-2 text-xs text-slate-800 font-semibold outline-none transition-all cursor-pointer"
                  >
                    <option value="HIGH">🔴 Alta</option>
                    <option value="MEDIUM">🟡 Media</option>
                    <option value="LOW">🟢 Baja</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">Tipo de Desarrollo</label>
                    <select
                      value={projectConfigModalTarget.desarrollo || 'Interno'}
                      onChange={e => setProjectConfigModalTarget(prev => prev ? { ...prev, desarrollo: e.target.value as any } : null)}
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-lg px-3 py-2 text-xs text-slate-800 font-semibold outline-none transition-all cursor-pointer"
                    >
                      <option value="Interno">⚙️ Interno</option>
                      <option value="Mixto">🔄 Mixto</option>
                      <option value="Externo">📦 Externo</option>
                      <option value="Sin desarrollo">🚫 Sin desarrollo</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">Categoría del Proyecto</label>
                    <select
                      value={projectConfigModalTarget.categoria || 'Mediano'}
                      onChange={e => setProjectConfigModalTarget(prev => prev ? { ...prev, categoria: e.target.value as any } : null)}
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-lg px-3 py-2 text-xs text-slate-800 font-semibold outline-none transition-all cursor-pointer"
                    >
                      <option value="Pequeño">🟢 Pequeño</option>
                      <option value="Mediano">🟡 Mediano</option>
                      <option value="Grande">🟠 Grande</option>
                      <option value="Muy Grande">🔴 Muy Grande</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 text-xs pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setProjectConfigModalTarget(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg font-bold transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-extrabold transition cursor-pointer"
                  >
                    Guardar Cambios
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* PROJECT STATUS TRANSITION MODAL */}
        {projectStatusModalTarget && (
          <div 
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn" 
            onClick={() => setProjectStatusModalTarget(null)}
          >
            <div 
              className="bg-white border border-slate-200 text-slate-800 w-full max-w-md rounded-xl shadow-2xl overflow-y-auto max-h-[90vh] flex flex-col" 
              onClick={e => e.stopPropagation()}
            >
              <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <FolderKanban className="w-4 h-4 text-blue-600" />
                  <h4 className="font-bold text-sm text-slate-900 font-sans">
                    Actualizar Ciclo de Vida del Proyecto
                  </h4>
                </div>
                <button
                  onClick={() => setProjectStatusModalTarget(null)}
                  className="text-slate-400 hover:text-slate-600 font-bold text-lg select-none px-1.5 focus:outline-none transition cursor-pointer"
                >
                  ×
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div>
                  <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 font-mono">Proyecto Seleccionado</span>
                  <h3 className="text-sm font-bold text-slate-900 mt-1">
                    {projectStatusModalTarget.name}
                  </h3>
                  <span className="text-[10.5px] text-slate-500 font-mono">
                    Código: {projectStatusModalTarget.code} | Cliente: {projectStatusModalTarget.client}
                  </span>
                </div>

                <div>
                  <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 font-mono mb-2">Seleccione Nuevo Estado</span>
                  <div className="grid grid-cols-2 gap-2">
                    {['REQUERIMIENTOS', 'APROBADO', 'DESARROLLO', 'PRUEBAS', 'FINALIZADO', 'CANCELADO'].map(st => {
                      const worksAsActive = projectStatusModalTarget.status === st;
                      return (
                        <button
                          key={st}
                          onClick={() => {
                            updateProjectStatus(projectStatusModalTarget.id, st as any);
                            setProjectStatusModalTarget(prev => prev ? { ...prev, status: st as any } : null);
                          }}
                          className={`px-3 py-2.5 rounded-lg text-xs font-bold transition-all text-left flex items-center justify-between border cursor-pointer ${
                            worksAsActive
                              ? 'bg-blue-50 border-blue-300 text-blue-700 shadow-3xs'
                              : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                          }`}
                        >
                          <span>{st}</span>
                          {worksAsActive && <span className="text-[10.5px]">🟢</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <p className="text-[10px] text-slate-400 font-medium leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-105 mt-2">
                  💡 Cambiar el estado del ciclo de vida afectará los reportes de cumplimiento de hitos, dashboards integrados, alertas, y auditoría general.
                </p>

                <div className="flex justify-end gap-2 text-xs pt-4 border-t border-slate-100">
                  <button
                    onClick={() => setProjectStatusModalTarget(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold transition cursor-pointer"
                  >
                    Cerrar Ventana
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CONFIRMATION DIALOG */}
        {deleteConfirmState && deleteConfirmState.isOpen && (
          <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center z-[999999] p-4 text-slate-805 text-slate-800 animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full border border-slate-100 overflow-hidden">
              <div className="p-5">
                <h3 className="text-sm font-bold text-slate-950 flex items-center gap-2">
                  ⚠️ {deleteConfirmState.title}
                </h3>
                <p className="text-xs text-slate-650 mt-2.5 leading-normal">
                  {deleteConfirmState.message}
                </p>
              </div>
              <div className="bg-slate-50 px-5 py-3.5 border-t border-slate-100 flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmState(null)}
                  className="px-3.5 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 text-xs font-semibold cursor-pointer transition hover:bg-slate-105 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    deleteConfirmState.onConfirm();
                    setDeleteConfirmState(null);
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold cursor-pointer transition shadow-sm shadow-rose-100 hover:shadow-md"
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        )}

        <CreateProjectModal />
      </main>
    </div>
  );
};
