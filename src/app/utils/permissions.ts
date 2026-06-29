export interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
}

export interface Profile {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  isSystem: boolean;
}

export const MODULE_PERMISSIONS: Permission[] = [
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

export const DEFAULT_PROFILES: Profile[] = [
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

export const tabPermissionsMap: Record<string, string[]> = {
  'projects': ['projects_read'],
  'backlog': ['backlog_read'],
  'kanban': ['backlog_read', 'backlog_change_status'],
  'activities': ['projects_read', 'wbs_manage'],
  'qa': ['testing_read'],
  'devops': ['devops_deploy'],
  'teams': ['team_read'],
  'settings': ['team_manage']
};

export function hasTabAccess(userRole: string | undefined, tabId: string): boolean {
  if (!userRole) return false;
  
  const roleName = userRole.trim();
  
  // Administrators always have full access
  if (roleName === 'Administrador') return true;

  const saved = typeof window !== 'undefined' ? localStorage.getItem('gcp_profile_permissions') : null;
  let profiles = DEFAULT_PROFILES;
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        profiles = parsed;
      }
    } catch (e) {
      console.error('Error parsing profile permissions', e);
    }
  }

  // Find profile
  const profile = profiles.find(p => p.id === roleName || p.name === roleName);
  if (!profile) {
    // If we have no matching custom profile, fallback to default allowed list
    const defaultAllowedTabs = ['dashboard', 'mockup'];
    return defaultAllowedTabs.includes(tabId);
  }

  const requiredPerms = tabPermissionsMap[tabId];
  if (!requiredPerms) {
    // No permissions required (e.g. dashboard, mockup)
    return true;
  }

  // User has access if they have at least one of the required permissions
  return requiredPerms.some(perm => profile.permissions.includes(perm));
}
