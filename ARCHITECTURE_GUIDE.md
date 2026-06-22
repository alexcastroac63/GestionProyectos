# GUÍA DE ARQUITECTURA DE LA APLICACIÓN
## Plataforma de Gestión de Portafolio de Proyectos - Grupo Campestre
---

Este documento técnico de arquitectura expone detalladamente la estructura del software, modelo de datos, flujo de información, opciones de menú, módulos interactivos, capacidades funcionales e interrelaciones sistémicas dentro de la plataforma. Está diseñado bajo los principios de modularidad, consistencia del estado en React y persistencia local reactiva con sincronización.

---

## 1. Patrón Arquitectónico del Frontend y Modelo de Flujo de Datos

La aplicación está diseñada bajo el patrón de **Single Page Application (SPA)** implementada en **React (v19+)** con **TypeScript** y empaquetada mediante **Vite**. 

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

* **Clean Architecture en React:** Separación de componentes visuales de presentación organizados en subcarpetas modulares (`src/features/*`) de la lógica del contenedor raíz (`App.tsx`), facilitando la realización de auditorías de código.
* **Sistema de Iconos Centralizado:** Uso exclusivo de bibliotecas tipadas nativas (`lucide-react`) para evitar inconsistencias en el diseño.
* **Diseño Responsivo Intencional:** Interfaces basadas en clases de utilidad de **Tailwind CSS**, permitiendo una legibilidad perfecta en monitores widescreen o pantallas medianas/móviles gracias a los prefijos adaptativos (`lg:`, `md:`, `sm:`).
* **Ausencia de Dependencias Externas Complejas:** Reducción de fugas de memoria o problemas de compilación mediante el uso óptimo de hooks React integrados (`useEffect`, `useState`, `useMemo`).
* **Seguridad Sólida:** Ninguna credencial ni clave expuesta en el frontend. Lógicas simplificadas de inicio de sesión con simulaciones robustas que preservan el enfoque del usuario final.

---

## 5. Capa de Persistencia y Patrón Repository (Clean Architecture)

Para desacoplar por completo la interfaz de usuario (UI) y las lógicas de negocio de los detalles técnicos de almacenamiento (localStorage, bases de datos remotas u APIs REST), se ha estructurado una capa de persistencia formal siguiendo los principios de **Clean Architecture**.

```
  ┌─────────────────────────────────────────────────────────────┐
  │                        CAPA DE DOMINIO                      │
  │  Define los contratos e interfaces puras de persistencia    │
  │  (e.g., IProjectRepository, IUserRepository)                │
  └──────────────────────────────┬──────────────────────────────┘
                                 │
                                 ▼
  ┌─────────────────────────────────────────────────────────────┐
  │                    CAPA DE INFRAESTRUCTURA                  │
  │  Implementa los adaptadores concretos para almacenamiento   │
  │                                                             │
  │      ┌─────────────────────────┐   ┌───────────────────┐    │
  │      │ LocalStorage Repository  │   │ Real API Adapter  │    │
  │      │   (Fase 3 - Activo)     │   │   (Preparado)     │    │
  │      └─────────────────────────┘   └───────────────────┘    │
  └──────────────────────────────┬──────────────────────────────┘
                                 │
                                 ▼
  ┌─────────────────────────────────────────────────────────────┐
  │                        REGISTRY / INDEX                     │
  │  Exporta el Unit of Work o Singleton de acceso a datos      │
  └──────────────────────────────┬──────────────────────────────┘
                                 │
                                 ▼
  ┌─────────────────────────────────────────────────────────────┐
  │                 CAPA DE PRESENTACIÓN (UI)                   │
  │  Sino se entera de cómo se guardan los datos (Local / API)   │
  └─────────────────────────────────────────────────────────────┘
```

### Contratos e Interfaces de Dominio (`src/domain/repositories/`)
* **`IRepository<T>`**: Contrato genérico con métodos fuertemente tipados para CRUD (`getAll`, `getById`, `create`, `update`, `delete`, `saveAll`).
* **`IProjectRepository`**: Métodos específicos para consultar portfolios, proyectos, actividades cronograma, presupuestos e hitos.
* **`IWorkItemRepository`**: Consultas relacionales para historias de usuario, tareas, incidentes y asociaciones por Sprints.
* **`IUserRepository`**: Verificación de identidades multi-inquilino y asignaciones de roles.
* **`ITestRepository`**: Consultas de suites de pruebas, casos evaluatorios e historial de QA.

### Adaptadores de Infraestructura (`src/infrastructure/repositories/`)
* **`LocalRepository<T>`**: Clase base que encapsula la serialización y deserialización a JSON, resolución automática de cuotas de almacenamiento y mitigación de bloqueos de I/O en `localStorage`.
* **Clases Especializadas (`ProjectLocalRepository`, `WorkItemLocalRepository`, etc.)**: Heredan el comportamiento base CRUD y resuelven consultas relacionales y filtros de dominio de manera local y ultra-ágil.

Esta separación estratégica permite implementar cambios de almacenamiento en caliente (como conectarse a un backend NestJS, Go o Firebase) reemplazando exclusivamente los adaptadores en el archivo central index sin modificar una sola línea de código en los hook states ni componentes visuales.

---

## 6. Arquitectura de Seguridad, Criptografía y Control Anti-Tampering (Backend)

La robustez de la plataforma no se limita únicamente al cliente visual; implementa un esquema de middleware y lógica de seguridad de nivel industrial en el servidor Express (`server.ts`):

```
                        SERVIDORES Y SERVICIOS EXPRESS (server.ts)
  ┌────────────────────────────────────────────────────────────────────────┐
  │                                                                        │
  │     SOLICITUD DE CLIENTE ────────► [Filtro Rate Limiter] ─────────┐     │
  │                                           │                       │     │
  │                                   (Permitido / < 3 fallos)        │     │
  │                                           ▼                       │     │
  │                               [Verificación de Hash]              ▼     │
  │                              HMAC-SHA-256 + cryptographic         [429 Bloqueado]
  │                                       salt base                   (Tiempo de espera
  │                                           │                        de 10 minutos)
  │                                    (Firma Válida)                  │
  │                                           ▼                        │
  │                               [Generación de Token HMAC]           │
  │                                 Payload + Exp + Signature ◄────────┘     │
  │                                                                        │
  └────────────────────────────────────────────────────────────────────────┘
```

1. **Criptografía de Credenciales por Salteo (Hashed Passwords con Salting):**
   * Las claves ingresadas por los usuarios **nunca** son tratadas o almacenadas en texto plano en la memoria del servidor.
   * Se utiliza una función criptográfica HMAC (basada en el algoritmo SHA-256) acoplada a una variable de sal de protección única (`PASSWORD_SALT`). Esto imposibilita ataques de diccionario de contraseñas habituales.

2. **Fermado Criptográfico de Sesión contra Alteraciones Locales (Anti-Tampering):**
   * Tras la autenticación exitosa, el servidor emite una firma digital tokenizada empleando un secreto seguro (`JWT_SECRET`).
   * El payload incluye un timestamp explícito de expiración (`exp`) y el correo verificado del usuario.
   * El cliente almacena de forma íntegra este token en local. En cada consulta crítica, la autenticidad de la sesión es contrastada; si se altera un solo bit o carácter de la firma, el servidor rechaza enérgicamente el token, impidiendo manipulaciones de identidad en la sesión del navegador.

3. **Control Anti Fuerza Bruta (Rate Limiting y Bloqueo Temporal):**
   * Implementa un sistema de control de tasa de intentos por usuario para proteger los endpoints de autenticación y de recuperación de contraseñas.
   * Si se superan 3 intentos fallidos consecutivos, el acceso para dicho correo electrónico es bloqueado por un lapso configurable de seguridad (10 minutos), notificándole al usuario en segundos restantes el tiempo que debe aguardar antes de reintentarlo.
   * El inicio de sesión correcto o un reinicio manual de credenciales en el servidor restablece automáticamente los contadores de bloqueo.

---

## 7. Mapeador de Sincronización Dominio-Tablero Scrum

Para garantizar que el Backlog del Producto y el Tablero Scrum de ejecución se mantengan en sintonía perfecta sin causar corrupciones de datos ni borrar el trabajo de desarrollo concurrente, se ha diseñado un despachador síncrono mapeador modular (`src/features/backlog/domain/backlogToScrum.mapper.ts`):

* **Sincronización síncrona no invasiva:** Traduce de forma transparente el backlog prioritario de requerimientos en elementos del tablero Scrum Board (`WorkItem` con propiedades mapeadas).
* **Conservación de items del desarrollador:** Al sincronizar el Backlog con el Tablero, el motor identifica y separa todas las tarjetas creadas directamente por los equipos técnicos en el tablero Scrum (como `TAREA` de integración o `BUG` de software). Esto asegura que estas adiciones de ingeniería no se eliminen al actualizar la especificación del negocio.
* **Mapeo Consistente de Estados y Prioridades:**
  * `Borrador` y `En refinamiento` transicionan naturalmente en la columna de **BACKLOG**.
  * `Ready` fluye directamente hacia la columna **POR_HACER** (activándose para el equipo).
  * `En desarrollo` se despliega en **EN_CURSO**.
  * `En pruebas internas` o `En validación de usuario` mapean preventivamente a la columna de **QA** para verificación formal.
  * `Aprobada` o `Cerrada` se transfieren de inmediato al estado **FINALIZADO**.
* **Prevalencia del Override de Scrum (Board-State Precedence):** Si el equipo ya ha modificado manualmente el carril o el asignado de una Historia de Usuario directamente en el Scrum Board, la sincronización respeta dicho "override" para no entorpecer el flujo dinámico de trabajo diario coordinado por el Scrum Master.

---

## 8. Registro Unificado Modular de Navegación y Menús

A fin de promover un alto estándar de clean code y desacoplar la lógica de renderizado del menú visual del layout principal de `App.tsx`, se introdujo el subsistema centralizado de registro de navegación:

* **Módulo:** `src/app/menuRegistry.ts`
* **Definición modular:** centraliza los items principales, subgrupos jerárquicos (Proyecto, Presupuesto, Configuración) e íconos (`lucide-react`) en una estructura tipada estricta (`MenuItem[]`).
* **Ventajas operacionales:** Permite desactivar, reordenar, añadir nuevos módulos o realizar migraciones de menú de forma inmediata sin intervenir en el layout central de visualización del frontend.

---

## 9. Suite Integrada de Pruebas Automatizadas de Arquitectura

Para proteger la integridad de los contratos de software contra regresiones o cambios accidentales en futuros despliegues, se ha incorporado una suite de software de validación independiente:

* **Archivo de pruebas:** `test-suite.ts`
* **Ejecución de Comando:** `npx tsx test-suite.ts`
* **Pruebas de Continuidad Funcional:**
  * **Casos del Grupo 1 (Criptografía y Tokenización):** Valida la irreversibilidad del hashing de contraseñas de usuarios, la equivalencia de firmas válidas y el rechazo proactivo de tokens alterados o con expiración vencida.
  * **Casos del Grupo 2 (Mapeos y Cohesión de Sincronización):** Certifica la exactitud del mapeador de estados (backlog a Scrum), el traspaso correcto de identificadores e hilos prioritarios, y la resiliencia del tablero Scrum Board al conservar de forma intacta las tareas de ingenierías y overrides de estado de los desarrolladores.
  
La integración exitosa del pipeline de compilación (`npm run build` y `npm run lint`) y las pruebas garantizan la certificación de código óptimo antes de su entrega formal a la plataforma en la nube.

---

## 10. Logros de Arquitectura Alcanzados (Refactorización y Mitigación de Deuda)

Durante la iteración actual, se completó con éxito la transición de la plataforma de un "prototipo organizado" a una **base modular productiva formal**, resolviendo los puntos críticos de acoplamiento de estado y seguridad del backend:

### 10.1. Desacoplamiento Absoluto de App.tsx mediante AppProviders y Context Stores
* **Estado Anterior:** El componente raíz (`App.tsx`) acumulaba más de 400 líneas de lógica de inicialización y sincronización de múltiples entidades hacia `localStorage`, convirtiéndose en el principal punto de fricción técnica.
* **Implementación:** Se introdujo la capa técnica centralizada **`src/app/AppProviders.tsx`**, la cual expone proveedores de React Context fuertemente tipados por dominio funcional (`useSystemStore`, `useProjectsStore`, `useScrumStore`, `useQaStore`, `useBacklogStore`).
* **Resultado:** `App.tsx` fue refactorizado exitosamente para actuar exclusivamente como un shell de navegación y layout de presentación limpio. Toda la persistencia reactiva por entidad de negocio fue delegada a los stores correspondientes en `AppProviders`, optimizando significativamente la modularidad, velocidad de renderizado y mantenibilidad del frontend.

### 10.2. Persistencia Segura y Hashing de Contraseñas (Capa de Seguridad Backend)
* **Estado Anterior:** El backend utilizaba credenciales volátiles en memoria y hashes HMAC planos basados en un único fallback global de sal.
* **Implementación:**
  * **PBKDF2 con SHA-512:** Se migró el algoritmo criptográfico de verificación y reseteo de claves a una derivación de clave robusta **PBKDF2 por sal aleatorio único individual por usuario** de 64 bytes generado por CSPRNG (`crypto.randomBytes`).
  * **Capa de Almacenamiento Persistente en Servidor:** Se sustituyó el mapa volátil de memoria por una base de datos local JSON segura (`credentials_db.json`), garantizando la preservación total de las credenciales de inquilino registradas y recuperadas tras reinicios del servicio de Cloud Run.
  * **JWT Secret Obligatorio:** Se reforzó la verificación de firma JWT de sesión, garantizando la detección instantánea de alteraciones locales (anti-tampering) con validación automática y expiración rígida de 2 horas.

---

## 11. Siguientes Pasos Operacionales (Próximas Iteraciones)

1. **Transición Definitiva de Storage Local a Cloud DB:** Migrar de `localStorageAdapter` a una base de datos en tiempo real (p. ej. Firestore en Firebase) simplemente reemplazando los conectores en la capa de adaptadores dentro de `repositories/`, sin tocar los visualizadores.
2. **Federación Completa de Micro-Feature Stores:** Continuar dividiendo componentes atómicos dentro de `src/features/*` para consumir directamente los hooks expuestos en `AppProviders.tsx`, erradicando la intermediación de propiedades prop-drilling en niveles profundos.


