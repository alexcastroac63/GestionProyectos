/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const DEFAULT_DOR_ITEMS = [
  'Objetivo claro definido',
  'Descripción Como/Quiero/Para especificada',
  'Criterios de aceptación registrados',
  'Criterios técnicos identificados',
  'Prioridad de negocio definida',
  'Responsable funcional asignado',
  'Dependencias identificadas',
  'Datos de prueba o ejemplos disponibles',
  'Reglas de negocio documentadas',
  'Estimación de Story Points completada'
];

export const DEFAULT_DOD_ITEMS = [
  'Desarrollo de código finalizado',
  'Pruebas unitarias ejecutadas',
  'Pruebas funcionales validadas',
  'Pruebas de regresión completadas (QA)',
  'Criterios de aceptación cumplidos',
  'Revisión de pares (Code Review) aprobada',
  'Integración continua exitosa (Pipeline verde)',
  'Documentación técnica y manual de usuario actualizados',
  'Demo presentada y aprobada por el PO',
  'Despliegue a ambiente de pruebas (Staging/Pre-producción) certificado'
];

export const USER_STORY_COMPLEXITIES = ['Baja', 'Media', 'Alta'] as const;
export const USER_STORY_UNCERTAINTIES = ['Baja', 'Media', 'Alta'] as const;
export const USER_STORY_MOSCOWS = ['Must', 'Should', 'Could', 'Won’t'] as const;
export const USER_STORY_STORY_POINTS = [0, 1, 2, 3, 5, 8, 13, 21] as const;
