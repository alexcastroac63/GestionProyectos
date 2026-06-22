# GUÍA DE ARQUITECTURA DE LA APLICACIÓN
## Plataforma de Gestión de Portafolio de Proyectos - Grupo Campestre
---

Este documento técnico de arquitectura expone detalladamente la estructura del software, modelo de datos, flujo de información, opciones de menú, módulos interactivos, capacidades funcionales e interrelaciones sistémicas dentro de la plataforma. Está diseñado bajo los principios de modularidad, consistencia del estado en React y persistencia local reactiva con sincronización.

---

## 1. Patrón Arquitectónico del Frontend y Modelo de Flujo de Datos

La aplicación está diseñada bajo el patrón de **Single Page Application (SPA)** implementada en **React (v18+)** con **TypeScript** y empaquetada mediante **Vite**. 

```
                               ┌────────────────────────────────┐
                               │     App.tsx (Main Context)     │
                               │  - State & LocalStorage Sync   │
                               │  - Central Navigation Engine   │
                               └──────────────┬─────────────────┘
                                              │
                    ┌─────────────────────────┼─────────────────────────┐
                    ▼                         ▼                         ▼
         ┌─────────────────────┐   ┌─────────────────────┐   ┌─────────────────────┐
         │   MÓDULOS DE VISTA  │   │  MÓDULOS DEL MOTOR  │   │ MÓDULOS DE SOPORTE  │
         │ - KPIDashboard      │   │ - ScrumBoardAndQa   │   │ - DbaSchema (ERD)   │
         │ - GanttChart        │   │ - ProductBacklog    │   │ - DevOpsPipeline    │
         │ - ProjectWBSManager │   │ - QaSuiteWorkspace  │   │ - ProjectNotes      │
         └─────────────────────┘   └─────────────────────┘   └─────────────────────┘
```

### Características Técnicas Clave:
1. **Estado Central Cohesivo (App.tsx):**
   * El componente raíz (`App.tsx`) actúa como el orquestador absoluto de la verdad. Almacena las colecciones en memoria de Proyectos, Usuarios, Sprints, Items del Backlog, Pruebas unitarias/funcionales (Test Cases/Test Runs), Mockups UI, Costos, Notas de Proyecto y Configuraciones generales.
   * **Persistencia Reactiva Hacia LocalStorage:** Implementa de forma síncrona `safeLoad` y `safeSave` para almacenar el estado completo de la plataforma en el almacenamiento local del navegador, de modo de garantizar que las recargas accidentales, reinicios de desarrollo o cierres de pestaña del navegador preserven todo el trabajo del usuario. Incluye optimización automática de almacenamiento limitando los payloads redundantes (p. ej. descartando representaciones base64 si exceden las cuotas de 5 MB de tamaño).

2. **Control de Ingress y Reverse Proxy:**
   * La aplicación se ejecuta encapsulada en contenedores y expone los servicios por medio del puerto único estructurado `3000`.

3. **Inyección y Formulario de Tipados (`src/types.ts`):**
   * Tipado estricto para todas las entidades clave (Sprints, ProjectNotes, NoteAttachments, WorkItems, etc.), erradicando variables booleanas implícitas y permitiendo una completa traza en tiempo de compilación.

---

## 2. Descripción Detallada del Menú y Módulos de la Barra Lateral

La barra lateral izquierda de navegación organiza la totalidad del espacio de trabajo en las siguientes secciones estandarizadas:

### 1. Panel de Control (Dashboard)
* **Componente:** `KPIDashboard.tsx`
* **Meteológica:** Consiste en un cuadro de mando integral con indicadores analíticos consolidados.
* **Funciones:**
  * **Indicadores Financieros de Capacidad:** Visualiza presupuestos globales, costos acumulados gastados, desviaciones financieras del portafolio, y el estado de salud financiera del conjunto de proyectos.
  * **Control de Variaciones Presupuestarias:** Implementa algoritmos de seguridad donde, si la variación del presupuesto (`percentVariacionPresupuesto`) es calculada con un valor negativo por la fórmula de avance, se ajusta de inmediato a `0` como piso financiero para evitar distorsiones de variaciones irreales.
  * **Gráficos Dinámicos:** Gráficos multieje (`recharts`) que ilustran presupuestos teóricos versus costos incurridos reales.
  * **Diagnósticos Rápidos:** Accesos directos a un visor de deudas del backlog, demoras críticas de cronograma, y tasas de calidad que evalúan la densidad de defectos en las pruebas de software.

### 2. Gestión de Proyectos (Gantt, WBS, Configuraciones)
* **Componentes integrados:** `GanttChart.tsx`, `ProjectWBSManager.tsx`, `ProjectActivitiesSubTab.tsx`, `ProjectNotesSubTab.tsx`.
* **Funciones:**
  * **Cronograma de Gantt:** Permite definir hitos, duraciones y trazar fases (Planificación, Análisis, Diseño, Codificación, Pruebas, Despliegue) con visualización gráfica interactiva de lapsos temporales.
  * **WBS / EDT (Estructura de Desglose de Trabajo):** Descompone el entregable en niveles jerárquicos permitiendo asociar presupuestos parciales por componente y rastrear el porcentaje de ejecución física y ponderada.
  * **Bitácora de Notas por Proyecto (`ProjectNotesSubTab.tsx`):**
    * Permite registrar incidentes, acuerdos, minutas y atrasos organizados por tipo y autor.
    * **Sistema de Adjuntos e Hibridación de Enlaces (Nuevo):** Permite subir archivos de forma local (con previsualizador de transferencias por barra de progreso animada interactiva) o adjuntar enlaces URL externos (Drive, Figma, Jira, etc.). Los usuarios pueden descargar directamente los archivos en la sesión de navegador actual y abrir los hipervínculos en pestañas independientes de forma transparente.

### 3. Backlog del Producto (Product Backlog)
* **Componente:** `ProductBacklogManager.tsx`
* **Funciones:**
  * Representa la pila prioritaria de requerimientos y necesidades de negocio especificadas por el Owner.
  * Permite la creación, edición, categorización (Historias de Usuario, Errores/Bugs, Tareas técnicas, Spikes de investigación) y estimación en Puntos de Historia (secuencia Fibonacci estándar).
  * Admite la asignación directa de tareas a un proyecto determinado o a Sprints programados.

### 4. Tablero Scrum / Tablero Kanban (Sprints & Kanban)
* **Componente:** `ScrumBoardAndQaManager.tsx`
* **Funciones:**
  * Tablero Kanban dinámico de 4 columnas base (`To Do`, `In Progress`, `QA/Testing`, `Done`).
  * **Reglas de Transición de Estados:** Implementa restricciones de compliance técnico de manera que los items no pueden ser movidos a "Done" de forma directa sin pasar de manera exitosa las fases de pruebas o revisiones pertinentes.
  * Permite asignar responsables del equipo y transicionar arrastrando elementos de un carril a otro.

### 5. Suite de Calidad (QA Space / Testing Space)
* **Componente:** `QaSuiteWorkspace.tsx`
* **Funciones:**
  * Diseñado para QA Engineers. Centraliza la creación de planes de pruebas agrupados en Test Suites de acuerdo al módulo de funcionalidad.
  * Permite documentar casos de pruebas detallados (pasos, precondiciones, resultados esperados y criticidad).
  * **Ejecuciones de Pruebas (Test Runs):** Permite ejecutar conjuntos de pruebas y asignar un estado en tiempo real (`Passed`, `Failed`, `Blocked`). Las pruebas clasificadas como fallidas disparan de manera automática anomalías de calidad en el Dashboard general.

### 6. Lienzo de Prototipado / Mockups (Mockup Studio)
* **Componente:** `MockupCanvas.tsx`
* **Funciones:**
  * Un lienzo interactivo para el diseño visual de pantallas.
  * Permite arrastrar interfaces de formularios, botones, campos de texto, paneles laterales y menús desplegables.
  * **Rutas e Interrelación de Componentes:** Permite simular flujos de navegación al trazar conexiones físicas direccionales entre diferentes pantallas diseñadas, representando de manera simulada la experiencia de experiencia del usuario (UX) final.

### 7. Arquitectura de Datos / Esquemas DBA
* **Componente:** `DbaSchema.tsx`
* **Funciones:**
  * Genera interactivamente diagramas de Entidad-Relación (ERD) en base a esquemas de bases de datos.
  * Permite visualizar nombres de campos, tipos de datos, llaves primarias y foráneas, ayudando al personal técnico en el diseño de arquitecturas robustas que posteriormente alimentan el desarrollo de software.

### 8. Pipelines de Despliegue CI/CD (DevOps Panel)
* **Componente:** `DevOpsPipeline.tsx`
* **Funciones:**
  * Simula canalizaciones de despliegue automatizado compuestas por fases clave (`Linter & Build`, `Unit Testing`, `Security Scan`, `Artifact Packaging`, `Contenedores / Cloud Run Deployment`).
  * Monitorea métricas operacionales útiles para auditorías y revisiones de QA, como la duración de construcción, cobertura de pruebas unitarias y estado general del servicio.

### 9. Equipo de Trabajo (Teams Office)
* **Funciones:** Permite registrar los perfiles de los ingenieros, analistas y project managers que colaboran en el desarrollo físico de las tareas.

---

## 3. Matriz de Interrelaciones Sistémicas y Flujo de Información

Ningún módulo de la plataforma opera de manera aislada. Hay una fuerte interconexión jerárquica y relacional que se define por las siguientes dependencias de negocio:

```
  ┌─────────────────────────────────────────────────────────────────────────┐
  │                           PROYECTO (PROJECT)                            │
  └───────┬────────────────────────────┬────────────────────────────┬───────┘
          │                            │                            │
          ▼                            ▼                            ▼
  ┌────────────────┐           ┌────────────────┐           ┌────────────────┐
  │    BACKLOG     │           │    SPRINTS     │           │    CRONOGRAMA  │
  │ (User Stories) │           │ (Scrum Board)  │           │  (Gantt / WBS) │
  └───────┬────────┘           └────────┬───────┘           └────────┬───────┘
          │                             │                            │
          │     Pertenece a Sprint      │                            │
          ├─────────────────────────────┘                            │ Actualizan
          ▼                                                          │ Presupuesto
  ┌────────────────┐                                                 │ Acumulado y
  │ KANBAN ITEMS   ├─────────────────────────────────────────────────┼─────────┐
  └───────┬────────┘                                                 │         │
          │                                                          ▼         ▼
          │ Vinculado para Calidad                        ┌────────────┐ ┌─────────────┐
          ▼                                               │ DASHBOARD  │ │ BITÁCORA DE │
  ┌────────────────┐                                      │ ANALÍTICO  │ │   NOTAS     │
  │   QA SUITE     │                                      └────────────┘ └─────────────┘
  │  (Test Runs)   │
  └────────────────┘
```

A continuación, se tabula detalladamente cómo impacta una acción en un módulo sobre los demás sistemas:

| Acción en el Módulo Origen | Módulo(s) Impactado(s) | Naturaleza de la Sincronización e Interrelación |
| :--- | :--- | :--- |
| **Backlog del Producto** <br>*(Asignación de Sprint e Item)* | `Tablero Scrum/Kanban` | Los items priorizados se despliegan automáticamente en las columnas correspondientes del tablero Kanban asociados al Sprint activo seleccionado. |
| **Tablero Kanban** <br>*(Actualización de Estado a Realizado)* | `Gantt / WBS` y `Dashboard` | La culminación de actividades e ítems actualiza el avance real acumulado (%) en las tareas de Gantt, re-calcula el KPI de Cumplimiento de Cronograma y actualiza los indicadores en el Panel de Control. |
| **Bitácora de Notas** <br>*(Registro de una Nota de Atraso)* | `Dashboard` y `Gantt` | Al clasificar una nota de tipo "Atraso" (asociándole opcionalmente los archivos adjuntos que demuestran el bloqueo), el Dashboard de Control refleja de inmediato desviaciones en las métricas de mitigación de riesgo para el proyecto activo. |
| **Planes de Pruebas (QA)** <br>*(Ejecución de un Test Run como Fallido)* | `Dashboard` y `Backlog` | Reduce el índice de calidad porcentual del proyecto. El motor del Dashboard lee la tasa de defectos (`percentCalidad`), marcando una alerta visual en Rojo/Amarillo de riesgo del proyecto si el indicador disminuye del 75%. |
| **Fase / WBS Costo** <br>*(Revisión financiera o Baseline)* | `Dashboard (Gastos)` | Los montos planificados en las categorías (Nómina, Licencias, etc.) y los registros de costos reales consumidos recalcularán la variación del presupuesto de inmediato en el Dashboard. |
| **Lienzo de Mockups** <br>*(Diseño de Pantallas)* | `Backlog / Historias de Usuario` | Los mockups interactivos proveen el soporte visual de la UI. La definición de pantallas y sus enlaces simula requerimientos de frontend que se transforman en tareas operativas dentro del backlog. |

---

## 4. Estilos de Programación y Estándares Aplicados

* **Clean Architecture en React:** Separación de componentes visuales de presentación (`src/components/*`) de la lógica del contenedor raíz (`App.tsx`), facilitando la realización de auditorías de código.
* **Sistema de Iconos Centralizado:** Uso exclusivo de bibliotecas tipadas nativas (`lucide-react`) para evitar inconsistencias en el diseño.
* **Diseño Responsivo Intencional:** Interfaces basadas en clases de utilidad de **Tailwind CSS**, permitiendo una legibilidad perfecta en monitores widescreen o pantallas medianas/móviles gracias a los prefijos adaptativos (`lg:`, `md:`, `sm:`).
* **Ausencia de Dependencias Externas Complejas:** Reducción de fugas de memoria o problemas de compilación mediante el uso óptimo de hooks React integrados (`useEffect`, `useState`, `useMemo`).
* **Seguridad Sólida:** Ninguna credencial ni clave expuesta en el frontend. Lógicas simplificadas de inicio de sesión con simulaciones robustas que preservan el enfoque del usuario final.
