import React from 'react';
import { Settings } from 'lucide-react';
import { useProjectsStore } from '../../../app/providers/ProjectsProvider';
import { useSystemStore } from '../../../app/providers/SystemProvider';

export const ProjectConfigModal: React.FC = () => {
  const {
    setProjects,
    projectConfigModalTarget,
    setProjectConfigModalTarget
  } = useProjectsStore();

  const {
    addLog,
    clientsList,
    sponsorsList
  } = useSystemStore();

  if (!projectConfigModalTarget) return null;

  return (
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
  );
};
