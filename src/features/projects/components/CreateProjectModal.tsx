import React, { useState } from 'react';
import { FolderKanban } from 'lucide-react';
import { Project } from '../../../types';
import { useProjectsStore } from '../../../app/providers/ProjectsProvider';
import { useSystemStore } from '../../../app/providers/SystemProvider';

export const CreateProjectModal: React.FC = () => {
  const {
    setProjects,
    setCategoryBudgets,
    isCreateProjectModalOpen,
    setIsCreateProjectModalOpen
  } = useProjectsStore();

  const {
    loggedInUser,
    addLog,
    clientsList,
    sponsorsList
  } = useSystemStore();

  // Form states
  const [newProjName, setNewProjName] = useState('');
  const [newProjCode, setNewProjCode] = useState('');
  const [newProjClient, setNewProjClient] = useState('');
  const [newProjSponsor, setNewProjSponsor] = useState('');
  const [newProjSprintSizeDays, setNewProjSprintSizeDays] = useState(10);
  const [newProjBudget, setNewProjBudget] = useState(150000);
  const [newProjDesarrollo, setNewProjDesarrollo] = useState<'Desarrollo Interno' | 'Desarrollo Mixto' | 'Desarrollo Externo' | 'Sin Desarrollo' | 'Implementación'>('Desarrollo Interno');
  const [newProjCategoria, setNewProjCategoria] = useState<'Pequeño' | 'Mediano' | 'Grande' | 'Muy Grande'>('Mediano');

  if (!isCreateProjectModalOpen) return null;

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjName || !newProjCode) return;
    const budgetVal = Number(newProjBudget) || 150000;
    const selectedClient = newProjClient || (clientsList[0] || 'Cliente General');
    const selectedSponsor = newProjSponsor || (sponsorsList[0] || 'Sponsor Principal');
    const newProj: Project = {
      id: `proj-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      name: newProjName,
      code: newProjCode.toUpperCase(),
      description: 'Iniciativa del ciclo de vida del proyecto',
      client: selectedClient,
      sponsor: selectedSponsor,
      project_manager_id: 'u-2',
      scrum_master_id: 'u-3',
      product_owner_id: 'u-4',
      status: 'REQUERIMIENTOS',
      priority: 'MEDIUM',
      start_date: '2026-06-01',
      end_date: '2026-10-31',
      sprint_size_weeks: 2,
      sprint_size_days: Number(newProjSprintSizeDays) || 10,
      budget_total: budgetVal,
      tenant_id: loggedInUser?.tenant_id || 'grupo-campestre',
      desarrollo: newProjDesarrollo,
      categoria: newProjCategoria
    };

    setProjects(prev => [...prev, newProj]);
    setCategoryBudgets(prev => ({
      ...prev,
      [newProj.id]: {
        NOMINA: Math.round(budgetVal * 0.40),
        LICENCIAS: Math.round(budgetVal * 0.15),
        INFRAESTRUCTURA: Math.round(budgetVal * 0.20),
        OUTSOURCING: Math.round(budgetVal * 0.15),
        OTROS: Math.round(budgetVal * 0.10)
      }
    }));

    // Reset fields
    setNewProjName('');
    setNewProjCode('');
    setNewProjClient('');
    setNewProjSponsor('');
    setNewProjSprintSizeDays(10);
    setNewProjDesarrollo('Desarrollo Interno');
    setNewProjCategoria('Mediano');
    setIsCreateProjectModalOpen(false);

    addLog('Carlos Pérez (PM)', `Creó el proyecto de negocio [${newProj.code}] ${newProj.name}`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 shadow-xl" onClick={() => setIsCreateProjectModalOpen(false)}>
      <div className="bg-white border border-slate-200 text-slate-800 w-full max-w-md rounded-xl shadow-2xl overflow-y-auto max-h-[90vh] flex flex-col animate-fadeIn" onClick={e => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <FolderKanban className="w-4 h-4 text-blue-600" />
            <h4 className="font-bold text-sm text-slate-900 font-sans">Registrar Nuevo Proyecto de Negocio</h4>
          </div>
          <button
            onClick={() => setIsCreateProjectModalOpen(false)}
            className="text-slate-400 hover:text-slate-600 font-bold text-lg select-none px-1.5 focus:outline-none transition cursor-pointer"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleCreateProject} className="p-5 space-y-4">
          <div>
            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1 font-mono">Nombre del Proyecto*</label>
            <input
              type="text"
              required
              value={newProjName}
              onChange={e => setNewProjName(e.target.value)}
              placeholder="Ej. SaaS de Ventas"
              className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:ring-1 focus:ring-blue-500 rounded-lg px-3 py-2 text-xs text-slate-800 font-semibold outline-none transition-all font-sans"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1 font-mono">Código Único (Code)*</label>
              <input
                type="text"
                required
                value={newProjCode}
                onChange={e => setNewProjCode(e.target.value)}
                placeholder="Ej. SVD-01"
                className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:ring-1 focus:ring-blue-500 rounded-lg px-3 py-2 text-xs text-slate-800 font-mono font-bold outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1 font-mono">Cliente</label>
              <select
                value={newProjClient}
                onChange={e => setNewProjClient(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:ring-1 focus:ring-blue-500 rounded-lg px-3 py-2 text-xs text-slate-800 font-semibold outline-none transition-all cursor-pointer font-sans"
              >
                <option value="">-- Seleccionar Cliente --</option>
                {clientsList.map(c => (
                  <option key={c} value={c}>🏢 {c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1 font-mono">Sponsor</label>
              <select
                value={newProjSponsor}
                onChange={e => setNewProjSponsor(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:ring-1 focus:ring-blue-500 rounded-lg px-3 py-2 text-xs text-slate-800 font-semibold outline-none transition-all cursor-pointer font-sans"
              >
                <option value="">-- Seleccionar Sponsor --</option>
                {sponsorsList.map(s => (
                  <option key={s} value={s}>👤 {s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1 font-mono">Tamaño Sprints (Días Hábiles)*</label>
              <input
                type="number"
                required
                min={1}
                max={90}
                value={newProjSprintSizeDays}
                onChange={e => setNewProjSprintSizeDays(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:ring-1 focus:ring-blue-500 rounded-lg px-3 py-2 text-xs text-slate-800 font-mono font-bold outline-none transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1 font-mono">Tipo de Desarrollo</label>
              <select
                value={newProjDesarrollo}
                onChange={e => setNewProjDesarrollo(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:ring-1 focus:ring-blue-500 rounded-lg px-3 py-2 text-xs text-slate-800 font-semibold outline-none transition-all cursor-pointer font-sans"
              >
                <option value="Desarrollo Interno">⚙️ Desarrollo Interno</option>
                <option value="Desarrollo Mixto">🔄 Desarrollo Mixto</option>
                <option value="Desarrollo Externo">📦 Desarrollo Externo</option>
                <option value="Sin Desarrollo">🚫 Sin Desarrollo</option>
                <option value="Implementación">🚀 Implementación</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1 font-mono">Categoría</label>
              <select
                value={newProjCategoria}
                onChange={e => setNewProjCategoria(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:ring-1 focus:ring-blue-500 rounded-lg px-3 py-2 text-xs text-slate-800 font-semibold outline-none transition-all cursor-pointer font-sans"
              >
                <option value="Pequeño">🟢 Pequeño</option>
                <option value="Mediano">🟡 Mediano</option>
                <option value="Grande">🟠 Grande</option>
                <option value="Muy Grande">🔴 Muy Grande</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1 font-mono">Presupuesto Límite ($ USD)</label>
            <input
              type="number"
              value={newProjBudget}
              onChange={e => setNewProjBudget(Number(e.target.value))}
              placeholder="150000"
              className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:ring-1 focus:ring-blue-500 rounded-lg px-3 py-2 text-xs text-slate-800 font-mono font-bold outline-none transition-all"
            />
            <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed font-sans">
              El presupuesto total se distribuirá automáticamente en categorías ágiles de costos (Nómina, Licencia, Infraestructura, Outsourcing y Otros).
            </p>
          </div>

          <div className="flex justify-end gap-2 text-xs pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsCreateProjectModalOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg font-semibold transition cursor-pointer font-sans"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold shadow-md shadow-blue-500/10 hover:shadow-blue-500/20 transition cursor-pointer font-sans"
            >
              Registrar Proyecto
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
