/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Epic, UserStory } from '../../features/backlog/domain/backlog.types';
import { DEFAULT_DOR_ITEMS, DEFAULT_DOD_ITEMS } from '../../features/backlog/domain/backlog.constants';

export const INITIAL_EPICS: Epic[] = [
  {
    id: 'ep-1',
    project_id: 'proj-1',
    code: 'EPC-01',
    name: 'Forecast y demanda de Maquinaria',
    description: 'Módulo enfocado en predecir y planificar la asignación de materias primas estructurales para maquinaria.',
    priority: 'Alta',
    status: 'En ejecución'
  },
  {
    id: 'ep-2',
    project_id: 'proj-1',
    code: 'EPC-02',
    name: 'Portal de Compra Logística',
    description: 'Automatización y tracking de coberturas con transportadoras según Lead Time.',
    priority: 'Alta',
    status: 'Borrador'
  }
];

export const INITIAL_USER_STORIES: UserStory[] = [
  {
    id: 'story-1',
    project_id: 'proj-1',
    epic_id: 'ep-1',
    sprint_id: 'sprint-2',
    code: 'HU-04',
    title: 'Calcular demanda parametrizable de Acero estructural',
    role: 'Planificador de materias primas',
    want: 'visualizar el inventario proyectado por semana según lead times',
    benefit: 'tomar decisiones de compra oportuna con base en coberturas sugeridas',
    description: 'Cálculo algorítmico automatizado que cruza existencias y tránsitos contra órdenes de producción abiertas.',
    type: 'Funcional',
    priority: 'Crítica',
    status: 'Ready',
    businessValue: 5,
    risk: 3,
    urgency: 4,
    moscow: 'Must',
    backlogOrder: 1,
    storyPoints: 8,
    estimatedHours: 40,
    complexity: 'Alta',
    uncertainty: 'Media',
    functionalOwnerId: 'u-2',
    technicalOwnerId: 'u-3',
    requesterId: 'u-2',
    company: 'Corporación Logística S.A.',
    branch: 'Planta Principal',
    createdAt: '2026-05-15',
    startDate: '2026-06-01',
    dueDate: '2026-06-15',
    dorChecklist: DEFAULT_DOR_ITEMS.reduce((acc, curr) => ({ ...acc, [curr]: true }), {}),
    dodChecklist: DEFAULT_DOD_ITEMS.reduce((acc, curr, index) => ({ ...acc, [curr]: index < 3 }), {}),
    acceptanceCriteria: [
      {
        id: 'cr-1',
        number: 1,
        description: 'El sistema debe mostrar el listado de materiales asignados al proveedor seleccionado.',
        type: 'Funcional',
        expectedResult: 'Listado completo sin pérdidas de registros.',
        status: 'Cumple',
        validatedBy: 'SA',
        validatedAt: '2026-06-02'
      },
      {
        id: 'cr-2',
        number: 2,
        description: 'El sistema calcula el inventario final usando la fórmula: Inventario final = Inicial + Tránsito + CD - Estimado.',
        type: 'Cálculo',
        expectedResult: 'Cálculo matemático coincide contra plantilla de Excel.',
        status: 'Pendiente'
      },
      {
        id: 'cr-3',
        number: 3,
        description: 'El campo de inventario final acumulado semanal no debe ser editable bajo ninguna circunstancia.',
        type: 'Seguridad',
        expectedResult: 'Campo readonly con bootstrap grid.',
        status: 'Cumple'
      }
    ],
    technicalCriteria: {
      description: 'El backend debe computar el cálculo para evitar alteraciones.',
      component: 'DemandForecastEngine.ts',
      databaseObject: 'ST_INVENTORY_WEEKLY_PROJECTION',
      api: '/api/v1/projects/proj-1/forecast-steel',
      integration: 'API SAP RFC_INVENTORY_GET',
      securityRule: 'SSL HTTPS TLS1.3 + JWT Token with PMO signature validation',
      performanceExpected: 'Menos de 3 segundos para consultas de hasta 24 semanas consecutivas.',
      auditConsideration: 'Loguear IP del usuario y parámetros introducidos en tabla audit_log.',
      logsRequired: 'INFO logs al iniciar cálculo, ERROR logs con stack trace detallado.',
      technicalDependency: 'SAP Connector Engine v2.4-stable',
      technicalOwnerId: 'u-3'
    },
    dependencies: [],
    comments: [
      {
        id: 'com-1',
        timestamp: '2026-06-02 14:30',
        userName: 'Carlos Pérez',
        userRole: 'Project Manager',
        userId: 'u-2',
        text: 'Se acordó en la mesa metodológica que el Lead Time se alimentará dinámicamente.',
        type: 'Funcional'
      }
    ],
    attachments: [
      {
        id: 'att-1',
        fileName: 'formula-forecast-cobertura.xlsx',
        fileType: 'Excel Spreadsheet',
        fileUrl: '#',
        uploadedBy: 'Carlos Pérez',
        uploadedAt: '2026-06-01'
      }
    ],
    history: [
      {
        field: 'Estado',
        oldVal: 'Borrador',
        newVal: 'En desarrollo',
        by: 'Carlos Pérez',
        at: '2026-06-02 10:00'
      }
    ]
  }
];
