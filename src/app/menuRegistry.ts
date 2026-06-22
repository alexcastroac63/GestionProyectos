/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  LayoutDashboard,
  FolderKanban,
  Briefcase,
  Layers,
  CheckSquare,
  ClipboardList,
  ShieldCheck,
  Monitor,
  Cpu,
  Settings,
  Users2,
  LucideIcon
} from 'lucide-react';

export interface MenuItem {
  id: string;
  label: string;
  icon: LucideIcon;
  isGroup?: boolean;
  children?: MenuItem[];
}

/**
 * Registro unificado de navegación y menús de la Plataforma Lifecycle PMO.
 * Permite añadir, desactivar o reordenar menús de forma modular
 * sin interferir con la lógica de renderizado principal en App.tsx.
 */
export const menuRegistry: MenuItem[] = [
  { id: 'dashboard', label: 'Cuadro Integral (KPIs)', icon: LayoutDashboard },
  {
    id: 'projects_group',
    label: 'Proyecto & Presupuesto',
    icon: FolderKanban,
    isGroup: true,
    children: [
      { id: 'projects', label: 'Proyectos', icon: Briefcase },
      { id: 'backlog', label: 'Backlog del Producto', icon: Layers },
      { id: 'kanban', label: 'Tablero Scrum Board', icon: CheckSquare },
      { id: 'activities', label: 'Actividades', icon: ClipboardList },
      { id: 'qa', label: 'Gestión Calidad QA (QAS)', icon: ShieldCheck },
      { id: 'mockup', label: 'Lienzo Mockups Visuales', icon: Monitor },
    ]
  },
  { id: 'devops', label: 'Repositorios', icon: Cpu },
  {
    id: 'settings_group',
    label: 'Configuración Central',
    icon: Settings,
    isGroup: true,
    children: [
      { id: 'teams', label: 'Directorio de Equipos', icon: Users2 },
      { id: 'settings', label: 'Configuración de Plataforma', icon: Settings },
    ]
  }
];

/**
 * Obtiene el listado plano de todos los nodos finales de navegación (submenús/items individuales).
 */
export function getFlatMenuItems(items: MenuItem[] = menuRegistry): MenuItem[] {
  const flat: MenuItem[] = [];
  items.forEach(item => {
    if (item.children) {
      flat.push(...getFlatMenuItems(item.children));
    } else {
      flat.push(item);
    }
  });
  return flat;
}
