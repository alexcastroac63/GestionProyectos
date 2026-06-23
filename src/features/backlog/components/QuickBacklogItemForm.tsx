import React, { useState } from 'react';
import { WorkItem, WorkItemType } from '../../../types';
import { Plus, Tag } from 'lucide-react';

interface QuickBacklogItemFormProps {
  projectId: string;
  workItems: WorkItem[];
  setWorkItems: React.Dispatch<React.SetStateAction<WorkItem[]>>;
  addLog: (user: string, action: string) => void;
  onSuccess?: () => void;
}

export const QuickBacklogItemForm: React.FC<QuickBacklogItemFormProps> = ({
  projectId,
  workItems,
  setWorkItems,
  addLog,
  onSuccess
}) => {
  const [newHUTitle, setNewHUTitle] = useState('');
  const [newHUPoints, setNewHUPoints] = useState('5');
  const [newHUType, setNewHUType] = useState<WorkItemType>('HISTORIA_USUARIO');

  const handleAddBacklogItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHUTitle.trim()) return;

    const count = workItems.filter(w => w.type === newHUType).length + 1;
    // Format keys matching system standard: EPC, HU, BG, TSK etc.
    const key = newHUType === 'HISTORIA_USUARIO' ? `HU000${count}` : newHUType === 'TAREA' ? `T000${count}` : `BG000${count}`;

    const newItem: WorkItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      project_id: projectId,
      key,
      title: newHUTitle.trim(),
      description: 'Requerimiento estructurado rápido según metodología ágil',
      type: newHUType,
      status: 'BACKLOG',
      priority: 'MEDIUM',
      story_points: Number(newHUPoints) || undefined,
      created_at: new Date().toISOString().split('T')[0]
    };

    setWorkItems(prev => [...prev, newItem]);
    setNewHUTitle('');
    
    addLog('Mateo Herrera (PO)', `Creó requerimiento ágil ${newItem.key}: "${newItem.title}"`);
    
    if (onSuccess) {
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleAddBacklogItem} className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3" id="quick-backlog-item-form">
      <div className="flex items-center gap-1.5 text-blue-800 font-extrabold text-[11px] uppercase tracking-wider mb-1">
        <Tag className="w-3.5 h-3.5" />
        <span>Creación Rápida de Requerimiento / HU / Tarea</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
        <div className="md:col-span-5">
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Título del Requerimiento*</label>
          <input
            type="text"
            required
            placeholder="Ej. Integración con pasarela de pagos pasiva"
            value={newHUTitle}
            onChange={e => setNewHUTitle(e.target.value)}
            className="w-full bg-white border border-slate-250 rounded-lg px-3 py-1.5 text-xs text-slate-800 font-medium focus:ring-1 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <div className="md:col-span-3">
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Tipo de Elemento</label>
          <select
            value={newHUType}
            onChange={e => setNewHUType(e.target.value as WorkItemType)}
            className="w-full bg-white border border-slate-250 rounded-lg px-2 py-1.5 text-xs text-slate-800 font-bold focus:outline-none"
          >
            <option value="HISTORIA_USUARIO">📂 Historia de Usuario</option>
            <option value="TAREA">⚙️ Tarea Técnica</option>
            <option value="BUG">🐛 Bug / Error</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Puntos Estimación (SP)</label>
          <input
            type="number"
            min="1"
            max="21"
            value={newHUPoints}
            onChange={e => setNewHUPoints(e.target.value)}
            className="w-full bg-white border border-slate-250 rounded-lg px-2 py-1.5 text-xs text-slate-800 font-mono font-bold focus:outline-none"
          />
        </div>

        <div className="md:col-span-2">
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[11px] py-2 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer shadow-3xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Crear</span>
          </button>
        </div>
      </div>
    </form>
  );
};
