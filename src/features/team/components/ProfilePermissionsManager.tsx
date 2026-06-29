import React, { useState, useEffect } from 'react';
import { Shield, Plus, Trash2, Search, Check, Save, Lock, Users, AlertTriangle } from 'lucide-react';
import { User } from '../../../types';

interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
}

interface Profile {
  id: string; // matches raw role name, or custom string
  name: string;
  description: string;
  permissions: string[];
  isSystem: boolean; // default system profiles cannot be deleted (permissions can be edited)
}

interface ProfilePermissionsManagerProps {
  users: User[];
  addLog: (user: string, action: string) => void;
  loggedInUser: User | null;
}

const MODULE_PERMISSIONS: Permission[] = [
  { id: 'projects_read', name: 'Ver Proyectos y Portafolios', description: 'Permite visualizar el listado de proyectos y portafolios corporativos.', category: 'Gestión de Proyectos & Portafolios' },
  { id: 'projects_create', name: 'Crear/Editar Proyectos', description: 'Habilita la creación de nuevos proyectos y la edición de sus metadatos principales.', category: 'Gestión de Proyectos & Portafolios' },
  { id: 'projects_delete', name: 'Eliminar Proyectos', description: 'Permiso crítico para archivar o eliminar proyectos permanentemente del catálogo.', category: 'Gestión de Proyectos & Portafolios' },
  { id: 'wbs_manage', name: 'Gestionar WBS (Cronograma)', description: 'Permite agregar, modificar, estructurar y eliminar elementos del cronograma (WBS).', category: 'Gestión de Proyectos & Portafolios' },
  
  { id: 'backlog_read', name: 'Ver Backlog de Producto', description: 'Permite explorar las historias de usuario, requerimientos y comentarios.', category: 'Requerimientos & Backlog' },
  { id: 'backlog_manage', name: 'Gestionar Requerimientos (Crear/Editar)', description: 'Habilita la creación, edición, priorización y estimación de historias de usuario.', category: 'Requerimientos & Backlog' },
  { id: 'backlog_delete', name: 'Eliminar Requerimientos', description: 'Permite borrar historias de usuario o ítems del backlog.', category: 'Requerimientos & Backlog' },
  { id: 'backlog_change_status', name: 'Actualizar Estados de Historias', description: 'Habilita la transición de estados en el tablero Scrum (Backlog -> To Do -> In Progress -> Done).', category: 'Requerimientos & Backlog' },

  { id: 'sprints_manage', name: 'Planificar e Iniciar Sprints', description: 'Permite la gestión de Sprints, su activación, cierre y asociación con metas.', category: 'Sprints & Despliegues DevOps' },
  { id: 'devops_deploy', name: 'Ejecutar Despliegues (DevOps)', description: 'Permite disparar pipelines y despliegues en contenedores e infraestructura cloud.', category: 'Sprints & Despliegues DevOps' },

  { id: 'testing_read', name: 'Ver Suites de Calidad', description: 'Habilita la visualización de los planes de pruebas y reportes de calidad.', category: 'Control de Calidad (QA)' },
  { id: 'testing_manage', name: 'Ejecutar y Gestionar Pruebas', description: 'Permite crear nuevos casos de pruebas y cambiar sus estados de cumplimiento.', category: 'Control de Calidad (QA)' },

  { id: 'team_read', name: 'Ver Directorio de Equipos', description: 'Permite visualizar la lista de personal e integrantes adscritos.', category: 'Administración de Personal & Perfiles' },
  { id: 'team_manage', name: 'Administrar Perfiles y Accesos', description: 'Habilita el control de roles de usuarios, clave temporal y edición de permisos de perfil.', category: 'Administración de Personal & Perfiles' },
];

const DEFAULT_PROFILES: Profile[] = [
  {
    id: 'Administrador',
    name: 'Administrador',
    description: 'Control de acceso total del sistema sin restricciones.',
    permissions: MODULE_PERMISSIONS.map(p => p.id),
    isSystem: true
  },
  {
    id: 'Director',
    name: 'Director / Ejecutiva',
    description: 'Nivel directivo con control completo sobre proyectos, portafolios, backlog y monitoreo de equipos.',
    permissions: [
      'projects_read', 'projects_create', 'projects_delete', 'wbs_manage',
      'backlog_read', 'backlog_manage', 'backlog_delete', 'backlog_change_status',
      'sprints_manage', 'devops_deploy', 'testing_read', 'testing_manage', 'team_read', 'team_manage'
    ],
    isSystem: true
  },
  {
    id: 'Project Manager',
    name: 'Project Manager',
    description: 'Administración ejecutiva de proyectos, cronogramas de actividades (WBS) y requerimientos.',
    permissions: [
      'projects_read', 'projects_create', 'wbs_manage',
      'backlog_read', 'backlog_manage', 'backlog_change_status',
      'sprints_manage', 'testing_read', 'team_read'
    ],
    isSystem: true
  },
  {
    id: 'Scrum Master',
    name: 'Scrum Master',
    description: 'Facilitador del marco de trabajo ágil, gestión de tableros Scrum y planificación de Sprints.',
    permissions: [
      'projects_read', 'wbs_manage',
      'backlog_read', 'backlog_manage', 'backlog_change_status',
      'sprints_manage', 'testing_read', 'team_read'
    ],
    isSystem: true
  },
  {
    id: 'Product Owner',
    name: 'Product Owner',
    description: 'Responsable de maximizar el valor del producto, gestionar el Backlog de Producto e historias.',
    permissions: [
      'projects_read', 'backlog_read', 'backlog_manage', 'backlog_change_status', 'team_read'
    ],
    isSystem: true
  },
  {
    id: 'Líder Técnico',
    name: 'Líder Técnico',
    description: 'Coordinador del equipo de ingeniería. Habilitado para estimar, estructurar WBS y desplegar a producción.',
    permissions: [
      'projects_read', 'wbs_manage', 'backlog_read', 'backlog_change_status',
      'sprints_manage', 'devops_deploy', 'testing_read', 'testing_manage', 'team_read'
    ],
    isSystem: true
  },
  {
    id: 'Ingeniero de Software',
    name: 'Ingeniero de Software',
    description: 'Desarrollador asignado a la ejecución de tareas, historias de usuario y reportes de calidad.',
    permissions: [
      'projects_read', 'backlog_read', 'backlog_change_status', 'testing_read', 'team_read'
    ],
    isSystem: true
  },
  {
    id: 'QA Lead',
    name: 'QA Lead',
    description: 'Responsable de la calidad del software, diseño y ejecución de casos de prueba.',
    permissions: [
      'projects_read', 'backlog_read', 'backlog_change_status', 'testing_read', 'testing_manage', 'team_read'
    ],
    isSystem: true
  },
  {
    id: 'Consultor',
    name: 'Consultor / Auditor',
    description: 'Acceso de solo lectura para auditorías externas, revisión de KPIs y reportes generales.',
    permissions: [
      'projects_read', 'backlog_read', 'testing_read', 'team_read'
    ],
    isSystem: true
  },
  {
    id: 'Sponsor / Directora',
    name: 'Sponsor / Directora',
    description: 'Patrocinadora corporativa con acceso a la revisión ejecutiva de avances y documentación general.',
    permissions: [
      'projects_read', 'backlog_read', 'testing_read', 'team_read'
    ],
    isSystem: true
  }
];

export const ProfilePermissionsManager: React.FC<ProfilePermissionsManagerProps> = ({
  users,
  addLog,
  loggedInUser
}) => {
  const [profiles, setProfiles] = useState<Profile[]>(() => {
    const saved = localStorage.getItem('gcp_profile_permissions');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error loading profile permissions, falling back to default', e);
      }
    }
    return DEFAULT_PROFILES;
  });

  const [selectedProfileId, setSelectedProfileId] = useState<string>('Administrador');
  const [permissionSearch, setPermissionSearch] = useState('');
  const [isAddProfileModalOpen, setIsAddProfileModalOpen] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [newProfileDesc, setNewProfileDesc] = useState('');
  const [copyPermissionsFrom, setCopyPermissionsFrom] = useState('Consultor');
  
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMsg, setNotificationMsg] = useState('');

  const triggerNotification = (msg: string) => {
    setNotificationMsg(msg);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };

  useEffect(() => {
    localStorage.setItem('gcp_profile_permissions', JSON.stringify(profiles));
  }, [profiles]);

  const selectedProfile = profiles.find(p => p.id === selectedProfileId) || profiles[0];

  const handleTogglePermission = (permissionId: string) => {
    // Admins cannot change own complete permission set to prevent locking out, but can customize others
    if (selectedProfile.id === 'Administrador') {
      triggerNotification('🚫 El perfil de Administrador del Sistema debe conservar todos los accesos habilitados.');
      return;
    }

    setProfiles(prev => {
      const updated = prev.map(p => {
        if (p.id === selectedProfile.id) {
          const exists = p.permissions.includes(permissionId);
          const nextPermissions = exists
            ? p.permissions.filter(id => id !== permissionId)
            : [...p.permissions, permissionId];
          return {
            ...p,
            permissions: nextPermissions
          };
        }
        return p;
      });
      return updated;
    });

    addLog(
      `${loggedInUser?.first_name || 'Admin'} ${loggedInUser?.last_name || ''} (${loggedInUser?.role || 'Admin'})`,
      `Actualizó los permisos del perfil "${selectedProfile.name}".`
    );
    triggerNotification(`Permisos actualizados para "${selectedProfile.name}" correctamente.`);
  };

  const handleAddProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProfileName.trim()) return;

    const profileId = newProfileName.trim();
    if (profiles.some(p => p.id.toLowerCase() === profileId.toLowerCase())) {
      triggerNotification('⚠️ Ya existe un perfil con ese nombre exacto.');
      return;
    }

    const templateProfile = profiles.find(p => p.id === copyPermissionsFrom);
    const initialPermissions = templateProfile ? [...templateProfile.permissions] : [];

    const newProfile: Profile = {
      id: profileId,
      name: newProfileName.trim(),
      description: newProfileDesc.trim() || `Perfil personalizado basado en ${copyPermissionsFrom}`,
      permissions: initialPermissions,
      isSystem: false
    };

    setProfiles(prev => [...prev, newProfile]);
    setSelectedProfileId(newProfile.id);
    setIsAddProfileModalOpen(false);
    setNewProfileName('');
    setNewProfileDesc('');

    addLog(
      `${loggedInUser?.first_name || 'Admin'} ${loggedInUser?.last_name || ''} (${loggedInUser?.role || 'Admin'})`,
      `Creó el nuevo perfil de accesos personalizado "${newProfile.name}".`
    );
    triggerNotification(`Perfil "${newProfile.name}" creado con éxito.`);
  };

  const handleDeleteProfile = (profileId: string) => {
    const profileToDelete = profiles.find(p => p.id === profileId);
    if (!profileToDelete) return;

    if (profileToDelete.isSystem) {
      triggerNotification('🚫 No se pueden eliminar perfiles preestablecidos del sistema.');
      return;
    }

    // Check if any users are assigned to this profile
    const assignedUsers = users.filter(u => u.role === profileToDelete.name || u.role === profileToDelete.id);
    if (assignedUsers.length > 0) {
      triggerNotification(`⚠️ No se puede eliminar. Hay ${assignedUsers.length} integrantes asignados a este perfil actualmente.`);
      return;
    }

    if (!window.confirm(`¿Estás seguro de que deseas eliminar el perfil personalizado "${profileToDelete.name}"?`)) {
      return;
    }

    setProfiles(prev => prev.filter(p => p.id !== profileId));
    setSelectedProfileId('Administrador');

    addLog(
      `${loggedInUser?.first_name || 'Admin'} ${loggedInUser?.last_name || ''} (${loggedInUser?.role || 'Admin'})`,
      `Eliminó el perfil personalizado "${profileToDelete.name}".`
    );
    triggerNotification(`Perfil "${profileToDelete.name}" eliminado.`);
  };

  const handleSelectAllPermissions = () => {
    if (selectedProfile.id === 'Administrador') return;
    setProfiles(prev => prev.map(p => {
      if (p.id === selectedProfile.id) {
        return {
          ...p,
          permissions: MODULE_PERMISSIONS.map(pm => pm.id)
        };
      }
      return p;
    }));
    triggerNotification(`Se otorgaron todos los permisos al perfil "${selectedProfile.name}".`);
  };

  const handleClearAllPermissions = () => {
    if (selectedProfile.id === 'Administrador') return;
    setProfiles(prev => prev.map(p => {
      if (p.id === selectedProfile.id) {
        return {
          ...p,
          permissions: []
        };
      }
      return p;
    }));
    triggerNotification(`Se removieron todos los permisos del perfil "${selectedProfile.name}".`);
  };

  // Group permissions by category
  const categories = Array.from(new Set(MODULE_PERMISSIONS.map(p => p.category)));

  // Filter permissions based on search query
  const filteredPermissions = MODULE_PERMISSIONS.filter(p => 
    p.name.toLowerCase().includes(permissionSearch.toLowerCase()) || 
    p.description.toLowerCase().includes(permissionSearch.toLowerCase()) ||
    p.category.toLowerCase().includes(permissionSearch.toLowerCase())
  );

  // Active users in selected profile
  const assignedUsers = users.filter(u => u.role === selectedProfile.name || u.role === selectedProfile.id);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-left relative" id="profile-access-manager">
      {/* Real-time Notification toast */}
      {showNotification && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white text-xs font-bold px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 animate-bounce">
          <Shield className="w-4 h-4 text-emerald-400" />
          <span>{notificationMsg}</span>
        </div>
      )}

      {/* Profiles Selection Column (4/12) */}
      <div className="lg:col-span-4 space-y-4">
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3.5">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-xs font-extrabold text-slate-850 uppercase tracking-wider block">Perfiles de Seguridad</span>
              <p className="text-[10px] text-slate-400 font-sans mt-0.5">Catálogo de perfiles y roles de acceso asignables a colaboradores.</p>
            </div>
            <button
              type="button"
              onClick={() => setIsAddProfileModalOpen(true)}
              className="p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition"
              title="Crear Perfil Personalizado"
            >
              <Plus className="w-4 h-4 text-white" />
            </button>
          </div>

          <div className="space-y-1.5 max-h-[480px] overflow-y-auto pr-1">
            {profiles.map(p => {
              const isActive = selectedProfileId === p.id;
              const uCount = users.filter(u => u.role === p.name || u.role === p.id).length;
              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedProfileId(p.id)}
                  className={`w-full text-left p-3 rounded-xl border transition cursor-pointer flex justify-between items-center ${
                    isActive
                      ? 'bg-indigo-50 border-indigo-250 text-indigo-900 shadow-3xs'
                      : 'bg-white border-slate-200 hover:bg-slate-50/70 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <span className="font-bold text-xs block truncate leading-tight">{p.name}</span>
                    <span className="text-[9.5px] text-slate-450 block truncate font-sans mt-0.5 leading-tight">{p.description}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full font-mono ${isActive ? 'bg-indigo-200/60 text-indigo-800' : 'bg-slate-100 text-slate-500'}`}>
                      {uCount} {uCount === 1 ? 'user' : 'users'}
                    </span>
                    {!p.isSystem && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteProfile(p.id);
                        }}
                        className="p-1 hover:bg-rose-100 text-slate-400 hover:text-rose-600 rounded transition"
                        title="Eliminar Perfil"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Profile Information */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-xs">
          <div className="flex items-center gap-2 text-indigo-600 border-b border-slate-100 pb-2">
            <Shield className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider font-mono">Detalles del Perfil</span>
          </div>
          <div className="space-y-1.5">
            <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider font-mono">Rol en el Directorio</span>
            <p className="text-xs font-extrabold text-slate-800 leading-normal">{selectedProfile.name}</p>
          </div>
          <div className="space-y-1.5">
            <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider font-mono">Descripción Funcional</span>
            <p className="text-[11px] text-slate-600 leading-relaxed font-sans">{selectedProfile.description}</p>
          </div>
          <div className="space-y-2 pt-2 border-t border-slate-150">
            <div className="flex justify-between items-center">
              <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider font-mono">Tipo de Perfil</span>
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${selectedProfile.isSystem ? 'bg-slate-100 text-slate-600' : 'bg-amber-100 text-amber-800'}`}>
                {selectedProfile.isSystem ? '🔒 Sistema' : '⚙️ Personalizado'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider font-mono">Total Permisos</span>
              <strong className="text-xs font-mono text-indigo-700 font-extrabold">{selectedProfile.permissions.length} / {MODULE_PERMISSIONS.length}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Permissions Configuration Panel (8/12) */}
      <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-150 pb-3 gap-3">
          <div>
            <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
              <span>Matriz de Accesos:</span>
              <span className="text-indigo-600">{selectedProfile.name}</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Controla qué módulos y acciones puede realizar un colaborador asignado a este perfil.</p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {selectedProfile.id !== 'Administrador' && (
              <>
                <button
                  type="button"
                  onClick={handleSelectAllPermissions}
                  className="bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-250 hover:border-slate-350 text-[10px] font-extrabold px-2.5 py-1.5 rounded-lg transition"
                >
                  Marcar Todos
                </button>
                <button
                  type="button"
                  onClick={handleClearAllPermissions}
                  className="bg-slate-50 hover:bg-slate-100 text-rose-600 hover:text-rose-700 border border-slate-250 hover:border-slate-350 text-[10px] font-extrabold px-2.5 py-1.5 rounded-lg transition"
                >
                  Desmarcar Todos
                </button>
              </>
            )}
          </div>
        </div>

        {/* Filter / Search permissions */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar por nombre de permiso o descripción de alcance..."
            value={permissionSearch}
            onChange={(e) => setPermissionSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 text-xs pl-8.5 pr-4 py-2 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
          />
        </div>

        {/* Permission List Grouped */}
        <div className="space-y-5 max-h-[460px] overflow-y-auto pr-2 divide-y divide-slate-100">
          {categories.map((cat, idx) => {
            const catPerms = filteredPermissions.filter(p => p.category === cat);
            if (catPerms.length === 0) return null;

            return (
              <div key={cat} className={`pt-4 ${idx === 0 ? 'pt-0' : ''}`}>
                <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest font-mono mb-2.5">{cat}</h4>
                <div className="space-y-2">
                  {catPerms.map(pm => {
                    const isChecked = selectedProfile.permissions.includes(pm.id);
                    const disabled = selectedProfile.id === 'Administrador';

                    return (
                      <label
                        key={pm.id}
                        className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer select-none transition-all ${
                          isChecked
                            ? 'bg-emerald-50/15 border-slate-200 hover:border-slate-300'
                            : 'bg-white border-slate-150 hover:border-slate-250 opacity-80 hover:opacity-100'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          disabled={disabled}
                          onChange={() => handleTogglePermission(pm.id)}
                          className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4 shrink-0 cursor-pointer disabled:cursor-not-allowed"
                        />
                        <div className="min-w-0 flex-1">
                          <span className="text-xs font-bold text-slate-800 block">{pm.name}</span>
                          <span className="text-[10.5px] text-slate-500 block font-sans mt-0.5 leading-normal">{pm.description}</span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {filteredPermissions.length === 0 && (
            <div className="text-center py-10 text-slate-400 italic">
              No se encontraron permisos que coincidan con la búsqueda.
            </div>
          )}
        </div>

        {/* Assigned Users Grid at bottom */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-150 mt-4 space-y-3">
          <div className="flex items-center gap-1.5 text-slate-600 border-b border-slate-200/80 pb-2">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[10px] font-extrabold uppercase tracking-widest font-mono">
              Integrantes con este Perfil ({assignedUsers.length})
            </span>
          </div>

          {assignedUsers.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {assignedUsers.map(u => {
                const initials = `${u.first_name?.[0] || ''}${u.last_name?.[0] || ''}`.toUpperCase();
                return (
                  <div key={u.id} className="bg-white border border-slate-150 rounded-lg p-2 flex items-center gap-2 shadow-2xs">
                    <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold text-[10px]">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-slate-800 block truncate">{u.first_name} {u.last_name}</span>
                      <code className="text-[9px] text-slate-450 block truncate font-mono">{u.email}</code>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-2 text-[10.5px] text-slate-400 italic font-sans select-none">
              Ningún profesional está asignado a este perfil actualmente.
            </div>
          )}
        </div>
      </div>

      {/* Add Custom Profile Modal */}
      {isAddProfileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-scaleIn">
            <div className="bg-slate-900 px-5 py-4 flex justify-between items-center text-white">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-400" />
                <span className="font-extrabold text-sm font-sans tracking-tight uppercase">Crear Perfil Personalizado</span>
              </div>
              <button
                type="button"
                onClick={() => setIsAddProfileModalOpen(false)}
                className="text-slate-400 hover:text-white font-bold text-lg focus:outline-none"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddProfile} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Nombre del Perfil / Rol</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Líder de Datos, Consultor Externo"
                  value={newProfileName}
                  onChange={(e) => setNewProfileName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-850 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Descripción Funcional</label>
                <textarea
                  placeholder="Describe brevemente el alcance de este perfil corporativo..."
                  value={newProfileDesc}
                  onChange={(e) => setNewProfileDesc(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 resize-none focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Copiar Permisos Iniciales De</label>
                <select
                  value={copyPermissionsFrom}
                  onChange={(e) => setCopyPermissionsFrom(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-semibold focus:bg-white focus:outline-none cursor-pointer"
                >
                  {profiles.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2.5 border-t border-slate-100 pt-4 mt-2">
                <button
                  type="button"
                  onClick={() => setIsAddProfileModalOpen(false)}
                  className="bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 hover:border-slate-300 text-xs font-bold py-2 px-4 rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2 px-4 rounded-xl shadow-sm hover:shadow transition cursor-pointer"
                >
                  Crear Perfil
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
