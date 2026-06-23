import React from 'react';
import { FolderKanban } from 'lucide-react';
import { useProjectsStore } from '../../../app/providers/ProjectsProvider';

interface ProjectStatusModalProps {
  updateProjectStatus: (projId: string, status: any) => void;
}

export const ProjectStatusModal: React.FC<ProjectStatusModalProps> = ({ updateProjectStatus }) => {
  const {
    projectStatusModalTarget,
    setProjectStatusModalTarget
  } = useProjectsStore();

  if (!projectStatusModalTarget) return null;

  return (
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
  );
};
