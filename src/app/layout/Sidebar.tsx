import React from 'react';
import { useSystemStore } from '../AppProviders';
import { menuRegistry } from '../menuRegistry';
import { X, ChevronDown, ChevronRight, History, LogOut } from 'lucide-react';

interface SidebarProps {
  handleLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ handleLogout }) => {
  const {
    loggedInUser,
    activeTab,
    setActiveTab,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    isProjectsMenuOpen,
    setIsProjectsMenuOpen,
    isSettingsMenuOpen,
    setIsSettingsMenuOpen,
    logs
  } = useSystemStore();

  const menuItems = menuRegistry;

  return (
    <>
      {/* Sidebar Overlay for Mobile */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 md:hidden backdrop-blur-xs transition-opacity duration-300"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 flex flex-col border-r border-slate-800 transition-transform duration-300 md:translate-x-0 md:static ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } shrink-0`}
      >
        <div className="p-6 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center font-bold text-white text-base shadow-sm">
              L
            </div>
            <div className="flex flex-col">
              <span className="text-white font-semibold text-sm tracking-tight leading-none mb-0.5">Lifecycle PM</span>
              <span className="text-[10px] text-slate-500 font-mono tracking-wide uppercase">v1.2.0 (Stable)</span>
            </div>
          </div>
          
          {/* Close button for Mobile */}
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-1.5 text-slate-400 hover:text-white md:hidden cursor-pointer hover:bg-slate-800 rounded-lg transition-colors"
            aria-label="Cerrar menú"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto">
          <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-3 pb-2 font-mono">Menú de Ciclo de Vida</span>
          
          {menuItems.map(item => {
            if (item.isGroup) {
              const Icon = item.icon;
              const isAnyChildActive = item.children?.some(child => activeTab === child.id);
              const isGroupOpen = item.id === 'projects_group' ? isProjectsMenuOpen : isSettingsMenuOpen;
              const toggleGroup = () => {
                if (item.id === 'projects_group') {
                  setIsProjectsMenuOpen(!isProjectsMenuOpen);
                } else {
                  setIsSettingsMenuOpen(!isSettingsMenuOpen);
                }
              };
              
              return (
                <div key={item.id} className="space-y-1">
                  <button
                    onClick={toggleGroup}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold tracking-tight transition-all text-left cursor-pointer ${
                      isAnyChildActive
                        ? 'text-blue-400 bg-slate-800/30'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-3.5 h-3.5" />
                      <span>{item.label}</span>
                    </div>
                    {isGroupOpen ? (
                      <ChevronDown className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5" />
                    )}
                  </button>
                  
                  {isGroupOpen && (
                    <div className="pl-3.5 space-y-1.5 border-l border-slate-800 ml-4 mt-1">
                      {item.children?.map(child => {
                        const ChildIcon = child.icon;
                        const isChildActive = activeTab === child.id;
                        return (
                          <button
                            key={child.id}
                            onClick={() => {
                              setActiveTab(child.id);
                              setIsMobileMenuOpen(false);
                            }}
                            className={`w-full flex items-center gap-3.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold tracking-tight transition-all text-left cursor-pointer ${
                              isChildActive
                                ? 'bg-blue-600/20 text-blue-400 border-l-2 border-blue-500 pl-2 font-bold'
                                : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                            }`}
                          >
                            <ChildIcon className="w-3" />
                            <span>{child.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold tracking-tight transition-all text-left cursor-pointer ${
                  isActive
                    ? 'bg-blue-600/20 text-blue-400 border-l-2 border-blue-500 pl-2.5 font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}

          <div className="pt-4 border-t border-slate-800 mt-4 space-y-2">
            <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-3 flex items-center gap-1.5 font-mono">
              <History className="w-3 h-3 text-blue-400" />
              Eventos Recientes
            </span>
            <div className="space-y-2 max-h-36 overflow-y-auto pr-1 pl-2">
              {logs.slice(0, 6).map(log => (
                <div key={log.id} className="text-[10px] border-b border-slate-800/50 pb-1.5 last:border-0">
                  <div className="flex justify-between text-slate-400 font-mono text-[9px]">
                    <span className="truncate max-w-[100px] font-semibold">{log.user.split(" ")[0]}</span>
                    <span>{log.time}</span>
                  </div>
                  <p className="text-slate-300 font-normal leading-tight text-[9px] truncate" title={log.text}>{log.text}</p>
                </div>
              ))}
            </div>
          </div>
        </nav>

        <div className="p-4 border-t border-slate-800 shrink-0">
          <div className="bg-slate-800/40 p-2.5 rounded-xl flex items-center justify-between gap-3 border border-slate-850">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold uppercase shrink-0 font-mono shadow-sm">
                {loggedInUser ? `${loggedInUser.first_name?.[0] || 'U'}${loggedInUser.last_name?.[0] || 'S'}` : 'U'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate leading-tight">
                  {loggedInUser ? `${loggedInUser.first_name || ''} ${loggedInUser.last_name || ''}`.trim() || 'Usuario' : 'Invitado'}
                </p>
                <p className="text-[10px] text-slate-400 truncate mt-0.5" title={loggedInUser?.role}>
                  {loggedInUser ? loggedInUser.role : 'Sin Perfil'}
                </p>
              </div>
            </div>
            
            {/* Quick Logout inside the Sidebar card block */}
            <button
              onClick={handleLogout}
              className="p-1.5 bg-slate-800 hover:bg-red-950/40 text-slate-400 hover:text-red-400 border border-slate-700/50 hover:border-red-900/50 rounded-lg transition-all duration-200 cursor-pointer shrink-0"
              title="Cerrar sesión"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Explicit, high-visibility block logout button for Mobile viewports */}
          <button
            onClick={handleLogout}
            className="w-full mt-2.5 flex items-center justify-center gap-2 py-2 bg-red-650/10 hover:bg-red-650/25 text-red-400 hover:text-red-300 border border-red-500/20 hover:border-red-500/45 rounded-xl text-[11px] font-bold cursor-pointer transition-all duration-200 md:hidden"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>
    </>
  );
};
