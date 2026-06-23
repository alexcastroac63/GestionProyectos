import React from 'react';
import { useSystemStore } from '../AppProviders';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { Footer } from './Footer';
import { CreateProjectModal } from '../../features/projects/components/CreateProjectModal';
import { ProjectConfigModal } from '../../features/projects/components/ProjectConfigModal';
import { ProjectStatusModal } from '../../features/projects/components/ProjectStatusModal';

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
    setDeleteConfirmState
  } = useSystemStore();

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
        <ProjectConfigModal />

        {/* PROJECT STATUS TRANSITION MODAL */}
        <ProjectStatusModal updateProjectStatus={updateProjectStatus} />

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
