import React from 'react';
import { useSystemStore } from '../AppProviders';
import { Menu, LogOut } from 'lucide-react';

interface TopBarProps {
  handleLogout: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ handleLogout }) => {
  const {
    loggedInUser,
    tenants,
    setIsMobileMenuOpen
  } = useSystemStore();

  const currentTenantName = tenants.find(t => t.id === loggedInUser?.tenant_id)?.name || loggedInUser?.tenant_id;

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 md:px-8 shrink-0 gap-3 sm:gap-4">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {/* Hamburger toggle button for Mobile */}
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-1.5 -ml-1 text-slate-650 hover:text-slate-900 md:hidden hover:bg-slate-100 rounded-lg transition-all cursor-pointer shrink-0"
          aria-label="Abrir menú"
        >
          <Menu className="w-5.5 h-5.5" />
        </button>
        <h1 className="text-sm sm:text-base font-bold text-slate-800 truncate max-w-[140px] xs:max-w-[180px] sm:max-w-none">
          Gestión Integral de proyectos
        </h1>
      </div>

      {/* User Session and Tenant Header Tools */}
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        {/* Tenant Status Tag */}
        <div className="hidden lg:flex items-center gap-2 bg-slate-50 border border-slate-200/60 rounded-full px-3 py-1">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-[10px] text-slate-500 font-mono tracking-tight">
            CIA: <strong className="text-slate-700 uppercase">{currentTenantName}</strong>
          </span>
        </div>

        {/* Profile Avatar & Stack */}
        <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-slate-200 shrink-0">
          <div 
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 flex items-center justify-center font-bold text-xs uppercase cursor-help shrink-0 font-mono" 
            title={`${loggedInUser?.first_name || ''} ${loggedInUser?.last_name || ''} (${loggedInUser?.role || ''})`}
          >
            {loggedInUser ? `${loggedInUser.first_name?.[0] || 'U'}${loggedInUser.last_name?.[0] || 'S'}` : 'US'}
          </div>
          <div className="hidden sm:flex flex-col text-left min-w-0">
            <span className="text-xs font-semibold text-slate-850 truncate leading-none mb-0.5">
              {loggedInUser ? `${loggedInUser.first_name || ''} ${loggedInUser.last_name || ''}`.trim() || 'Usuario' : 'Usuario'}
            </span>
            <span className="text-[10px] text-slate-400 font-medium truncate">
              {loggedInUser ? loggedInUser.role : 'Invitado'}
            </span>
          </div>
        </div>

        {/* Logout interactive Button */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 bg-slate-50 hover:bg-red-50 text-slate-600 hover:text-red-650 border border-slate-200 hover:border-red-200 rounded-xl text-xs font-semibold tracking-tight transition-all duration-200 cursor-pointer shadow-xs shrink-0"
          title="Cerrar sesión de forma segura"
        >
          <LogOut className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden sm:inline">Cerrar Sesión</span>
        </button>
      </div>
    </header>
  );
};
