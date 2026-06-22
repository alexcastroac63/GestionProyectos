import React, { useState } from 'react';
import { Users2, UserPlus, Search, Edit2, Mail, UserCheck, X } from 'lucide-react';
import { User } from '../../../types';

interface TeamDirectoryProps {
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  loggedInUser: User | null;
  addLog: (user: string, action: string) => void;
  setIsAddUserModalOpen: (open: boolean) => void;
  setEditingUser: (u: User | null) => void;
  setShowEditUserModal: (show: boolean) => void;
  setPasswordResetUser: (u: User | null) => void;
  setShowResetEmailModal: (show: boolean) => void;
}

export const TeamDirectory: React.FC<TeamDirectoryProps> = ({
  users,
  setUsers,
  loggedInUser,
  addLog,
  setIsAddUserModalOpen,
  setEditingUser,
  setShowEditUserModal,
  setPasswordResetUser,
  setShowResetEmailModal,
}) => {
  const [teamSearch, setTeamSearch] = useState('');
  const [teamRoleFilter, setTeamRoleFilter] = useState('ALL');
  const [teamStatusFilter, setTeamStatusFilter] = useState('ALL');
  const [approvalRoles, setApprovalRoles] = useState<{ [userId: string]: string }>({});

  const segmentedUsers = users.filter(
    (u) =>
      !u.tenant_id ||
      u.tenant_id === loggedInUser?.tenant_id ||
      (!loggedInUser && u.tenant_id === 'grupo-campestre')
  );

  const pendingUsers = segmentedUsers.filter((u) => u.status === 'PENDING');

  const handleApproveUser = (user: User, selectedRole: string) => {
    setUsers((prev) => {
      const updated = prev.map((u) => {
        if (u.id === user.id) {
          return {
            ...u,
            status: 'ACTIVE' as const,
            role: selectedRole,
          };
        }
        return u;
      });
      localStorage.setItem('gcp_users', JSON.stringify(updated));
      return updated;
    });

    addLog(
      `${loggedInUser?.first_name || 'Admin'} ${loggedInUser?.last_name || ''} (${loggedInUser?.role || 'Admin'})`,
      `Aprobó el ingreso de ${user.first_name} ${user.last_name} (${user.email}) asignándole el perfil corporativo: "${selectedRole}".`
    );
  };

  const handleRejectUser = (user: User) => {
    setUsers((prev) => {
      const updated = prev.filter((u) => u.id !== user.id);
      localStorage.setItem('gcp_users', JSON.stringify(updated));
      return updated;
    });

    addLog(
      `${loggedInUser?.first_name || 'Admin'} ${loggedInUser?.last_name || ''} (${loggedInUser?.role || 'Admin'})`,
      `Rechazó y descartó la solicitud de ingreso de ${user.first_name} ${user.last_name} (${user.email}).`
    );
  };

  const triggerPasswordResetEmailSimulation = (u: User) => {
    setPasswordResetUser(u);
    setShowResetEmailModal(true);
  };

  return (
    <div className="space-y-6 text-left">
      {/* Pending Approvals Panel */}
      {pendingUsers.length > 0 && (
        <div className="border border-amber-250 border-amber-200 rounded-2xl p-5 bg-amber-50/50 animate-fadeIn text-left">
          <div className="flex justify-between items-center border-b border-amber-200/60 pb-3 mb-4">
            <div className="flex items-center gap-2.5">
              <span className="text-lg">📢</span>
              <div>
                <span className="text-xs font-extrabold text-amber-950 uppercase tracking-wider block">
                  Solicitudes de Acceso Pendientes ({pendingUsers.length})
                </span>
                <p className="text-[10.5px] text-amber-800 font-sans mt-0.5">
                  Los siguientes profesionales solicitaron unirse al entorno corporativo del tenant activo. Revise sus perfiles para confirmar su ingreso.
                </p>
              </div>
            </div>
            <span className="text-[10px] bg-amber-200 text-amber-900 font-bold px-2.5 py-0.5 rounded-full font-mono">
              Requieren Acción
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingUsers.map((user) => {
              const initials = `${user.first_name?.[0] || 'U'}${user.last_name?.[0] || ''}`.toUpperCase();
              const isAdmin = loggedInUser?.role === 'Administrador' || loggedInUser?.role === 'Director';

              return (
                <div
                  key={user.id}
                  className="bg-white border border-amber-150 rounded-xl p-4 flex flex-col justify-between shadow-xs hover:border-amber-300 transition duration-150"
                >
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-extrabold text-xs shrink-0">
                        {initials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-xs font-extrabold text-slate-900 block truncate">
                          {user.first_name} {user.last_name}
                        </span>
                        <code className="text-[10px] text-slate-500 block truncate font-mono mt-0.5">
                          {user.email}
                        </code>
                      </div>
                    </div>

                    {isAdmin ? (
                      <div className="border-t border-slate-100 pt-3 space-y-3">
                        <div className="space-y-1">
                          <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                            Asignar Perfil Corporativo
                          </label>
                          <select
                            value={approvalRoles[user.id] || 'Líder Técnico'}
                            onChange={(e) =>
                              setApprovalRoles((prev) => ({ ...prev, [user.id]: e.target.value }))
                            }
                            className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg py-1.5 px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer font-medium"
                          >
                            <option value="Líder Técnico">Líder Técnico</option>
                            <option value="Ingeniero de Software">Ingeniero de Software</option>
                            <option value="Planificador">Planificador</option>
                            <option value="Consultor">Consultor</option>
                            <option value="Director">Director</option>
                            <option value="Administrador">Administrador (Acceso Completo)</option>
                          </select>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleRejectUser(user)}
                            className="flex-1 bg-white hover:bg-rose-50 text-rose-600 border border-slate-200 hover:border-rose-200 text-[10px] font-bold py-1.5 px-3 rounded-lg transition text-center cursor-pointer flex items-center justify-center gap-1"
                          >
                            <X className="w-3 h-3" />
                            Rechazar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleApproveUser(user, approvalRoles[user.id] || 'Líder Técnico')}
                            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold py-1.5 px-3 rounded-lg shadow-sm hover:shadow transition text-center cursor-pointer flex items-center justify-center gap-1"
                          >
                            <UserCheck className="w-3 h-3 text-white" />
                            Aprobar e Incorporar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-lg text-[9px] text-slate-500 leading-relaxed text-left">
                        🔒 El acceso debe ser aprobado por el <strong className="text-slate-700">Administrador</strong> de esta suscripción para la visualización y la asignación del perfil corporativo de esta persona.
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Directory Area */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-100/50 p-4 rounded-2xl border border-slate-200/60 text-left">
          <div>
            <span className="text-sm font-extrabold text-slate-850 uppercase tracking-wider block">
              Catálogo de Personal e Ingeniería
            </span>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Directorio de profesionales, ingenieros e investigadores adscritos al Tenant actual para el ruteo de historias de usuario.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsAddUserModalOpen(true)}
            className="inline-flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition duration-200 select-none cursor-pointer shrink-0 shadow-sm shadow-indigo-500/10"
          >
            <UserPlus className="w-4 h-4 text-white" />
            <span>Agregar Profesional</span>
          </button>
        </div>

        {/* Search & Filter controls */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5 mt-5 p-3.5 bg-slate-50 rounded-xl border border-slate-150">
          {/* Search bar */}
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por nombre, correo o rol..."
              value={teamSearch}
              onChange={(e) => setTeamSearch(e.target.value)}
              className="w-full bg-white text-slate-800 text-xs pl-9 pr-4 py-2.5 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition font-sans"
            />
          </div>

          {/* Role filter */}
          <div>
            <select
              value={teamRoleFilter}
              onChange={(e) => setTeamRoleFilter(e.target.value)}
              className="w-full bg-white text-slate-800 text-xs px-3 py-2.5 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none cursor-pointer font-medium"
            >
              <option value="ALL">Todos los Roles</option>
              {Array.from(new Set(users.map((u) => u.role))).map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Status filter */}
          <div>
            <select
              value={teamStatusFilter}
              onChange={(e) => setTeamStatusFilter(e.target.value)}
              className="w-full bg-white text-slate-800 text-xs px-3 py-2.5 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none cursor-pointer font-medium"
            >
              <option value="ALL">Cualquier Estado</option>
              <option value="ACTIVE">Activos</option>
              <option value="INACTIVE">Inactivos</option>
              <option value="PENDING">Pendientes</option>
            </select>
          </div>
        </div>

        {/* Team Grid Listings */}
        {segmentedUsers.filter((u) => {
          const fullName = `${u.first_name} ${u.last_name}`.toLowerCase();
          const email = u.email.toLowerCase();
          const role = u.role.toLowerCase();
          const query = teamSearch.toLowerCase().trim();

          const matchesSearch =
            !query ||
            fullName.includes(query) ||
            email.includes(query) ||
            role.includes(query);

          const matchesRole = teamRoleFilter === 'ALL' || u.role === teamRoleFilter;
          const matchesStatus = teamStatusFilter === 'ALL' || u.status === teamStatusFilter;

          return matchesSearch && matchesRole && matchesStatus;
        }).length === 0 ? (
          <div className="text-center py-12 text-slate-500 border border-dashed border-slate-200 rounded-xl mt-6">
            <p className="text-sm font-semibold">No se encontraron integrantes</p>
            <p className="text-xs text-slate-400 mt-1">Prueba cambiando los términos de búsqueda o filtros.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            {segmentedUsers
              .filter((u) => {
                const fullName = `${u.first_name} ${u.last_name}`.toLowerCase();
                const email = u.email.toLowerCase();
                const role = u.role.toLowerCase();
                const query = teamSearch.toLowerCase().trim();

                const matchesSearch =
                  !query ||
                  fullName.includes(query) ||
                  email.includes(query) ||
                  role.includes(query);

                const matchesRole = teamRoleFilter === 'ALL' || u.role === teamRoleFilter;
                const matchesStatus = teamStatusFilter === 'ALL' || u.status === teamStatusFilter;

                return matchesSearch && matchesRole && matchesStatus;
              })
              .map((u) => {
                const initials = `${u.first_name?.[0] || 'U'}${u.last_name?.[0] || ''}`.toUpperCase();

                return (
                  <div
                    key={u.id}
                    className="border border-slate-200 rounded-xl p-4 space-y-4 bg-slate-50/20 hover:bg-white hover:shadow-md transition duration-200 flex flex-col justify-between text-left"
                  >
                    <div className="space-y-3">
                      <div className="flex justify-between items-start min-w-0 w-full gap-2">
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center font-extrabold text-xs tracking-wider shrink-0 ${
                              u.status === 'ACTIVE'
                                ? 'bg-indigo-100 text-indigo-700'
                                : u.status === 'PENDING'
                                ? 'bg-amber-100 text-amber-700 animate-pulse'
                                : 'bg-slate-200 text-slate-600'
                            }`}
                          >
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-slate-800 text-sm tracking-tight truncate">
                              {u.first_name} {u.last_name}
                            </h4>
                            <span className="text-[10px] bg-indigo-50/70 text-indigo-700 px-2 py-0.5 rounded font-bold uppercase mt-1 inline-block truncate max-w-full">
                              {u.role}
                            </span>
                          </div>
                        </div>
                        <span
                          className={`w-2.5 h-2.5 rounded-full shrink-0 mt-1 ${
                            u.status === 'ACTIVE'
                              ? 'bg-emerald-500'
                              : u.status === 'PENDING'
                              ? 'bg-amber-500'
                              : 'bg-slate-400'
                          }`}
                          title={
                            u.status === 'ACTIVE'
                              ? 'Acceso Activo'
                              : u.status === 'PENDING'
                              ? 'Pendiente de Aprobación'
                              : 'Acceso Restringido'
                          }
                        />
                      </div>

                      <div className="text-[11.5px] text-slate-600 space-y-1.5 bg-slate-50 p-3 rounded-lg border border-slate-100 font-sans min-w-0 text-left">
                        <div className="flex justify-between items-center gap-1.5 min-w-0">
                          <span className="text-slate-400 font-medium shrink-0 font-sans text-xs">Email:</span>
                          <strong className="text-slate-800 truncate text-[11px] font-semibold" title={u.email}>
                            {u.email}
                          </strong>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400 font-medium font-sans text-xs">Estado:</span>
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              u.status === 'ACTIVE'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                : u.status === 'PENDING'
                                ? 'bg-amber-50 text-amber-700 border border-amber-100'
                                : 'bg-rose-50 text-rose-700 border border-rose-100'
                            }`}
                          >
                            {u.status === 'ACTIVE'
                              ? 'ACTIVO'
                              : u.status === 'PENDING'
                              ? 'PENDIENTE'
                              : 'INACTIVO'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400 font-medium font-sans text-xs">Capacidad:</span>
                          <strong className="text-teal-650 font-mono text-xs text-teal-600">40 hrs/sem (100%)</strong>
                        </div>
                      </div>
                    </div>

                    {/* Controls Panel */}
                    <div className="space-y-2 border-t border-slate-100 pt-3">
                      <div className="flex gap-2">
                        {/* Edit Profile Button */}
                        <button
                          type="button"
                          onClick={() => {
                            setEditingUser({ ...u });
                            setShowEditUserModal(true);
                          }}
                          className="flex-grow inline-flex items-center justify-center gap-1.5 bg-white hover:bg-indigo-50/50 text-slate-700 hover:text-indigo-700 border border-slate-250 hover:border-indigo-350 text-xs font-semibold py-2 rounded-xl transition shadow-xs cursor-pointer"
                          title="Editar nombre, apellido, email, rol o estado"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                          Editar
                        </button>

                        {/* Restore password dispatch */}
                        <button
                          type="button"
                          onClick={() => triggerPasswordResetEmailSimulation(u)}
                          className="inline-flex items-center justify-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold px-3 py-2 rounded-xl transition cursor-pointer border border-indigo-100 shadow-3xs font-semibold"
                          title="Enviar email simulado para actualizar contraseña"
                        >
                          <Mail className="w-3.5 h-3.5 text-indigo-500" />
                          Clave
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
};
