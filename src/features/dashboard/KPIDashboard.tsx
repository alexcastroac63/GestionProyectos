import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  TrendingUp,
  AlertTriangle,
  ShieldCheck,
  Zap,
  BarChart2,
  CheckCircle2,
  DollarSign,
  Calendar,
  Layers,
  Award,
  Filter,
  Activity,
  Users,
  FileText,
  Bug,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Info,
  Clock,
  Briefcase,
  Sliders,
  Sparkles,
  Search,
  X
} from 'lucide-react';
import { Project, User, Sprint, WorkItem, ProjectActivity, ProjectCost, Team, TestRun, TestCase } from '../../types';
import { calculateBudgetConsumption } from '../../domain/budgetDeviation.service';
import { calculateWeightedPhysicalProgress, calculateScheduleCompliance, evaluateProjectRiskStatus } from '../../domain/projectProgress.service';
import { calculateQualityFromTestRuns } from '../../domain/qaQuality.service';
import { getInitialWBSItems, WBSItem, WBSBaseline } from '../projects/ProjectWBSManager';

interface DonutChartProps {
  data: { name: string; value: number; percentage: number }[];
  colors: string[];
  unit?: string;
  isCurrency?: boolean;
}

function DashboardDonutChart({ data = [], colors, unit = '', isCurrency = false }: DonutChartProps) {
  // Filter out zero values
  const validData = (data || []).filter(d => d.value > 0);
  
  if (validData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-32 text-slate-400 text-xs font-medium">
        No hay datos disponibles para graficar
      </div>
    );
  }

  // Calculate total
  const totalVal = validData.reduce((acc, d) => acc + d.value, 0);

  // Build standard SVG donut rings
  let accumulatedPercent = 0;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-6 py-2">
      {/* Chart Canvas */}
      <div className="relative w-36 h-36 flex-shrink-0">
        <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
          {validData.map((item, idx) => {
            const pct = (item.value / totalVal) * 100;
            if (pct <= 0) return null;

            const radius = 34;
            const circumference = 2 * Math.PI * radius;
            const strokeDasharray = `${(pct / 100) * circumference} ${circumference}`;
            const strokeDashoffset = -((accumulatedPercent / 100) * circumference);

            accumulatedPercent += pct;
            const strokeColor = colors[idx % colors.length];

            return (
              <g key={idx} className="group cursor-pointer">
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="transparent"
                  stroke={strokeColor}
                  strokeWidth="15"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="butt"
                  className="transition-all duration-300 hover:stroke-[18] origin-center"
                />
                <title>{`${item.name}: ${isCurrency ? '$' : ''}${item.value.toLocaleString()}${unit} (${Math.round(pct)}%)`}</title>
              </g>
            );
          })}
          {/* Central Donut Hole */}
          <circle cx="50" cy="50" r="26" fill="white" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[9px] uppercase tracking-wider text-slate-400 font-extrabold">Total</span>
          <span className="text-xs font-extrabold text-slate-800 font-mono">
            {isCurrency ? `$${(totalVal / 1000000).toFixed(1)}M` : `${totalVal} Proj`}
          </span>
        </div>
      </div>

      {/* Legend list */}
      <div className="flex-1 min-w-0 space-y-1.5 w-full">
        {validData.slice(0, 5).map((item, idx) => {
          const pct = Math.round((item.value / totalVal) * 100);
          return (
            <div key={idx} className="flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="w-2.5 h-2.5 rounded-sm shrink-0 block" style={{ backgroundColor: colors[idx % colors.length] }} />
                <span className="truncate font-semibold text-slate-700 text-[11px]" title={item.name}>
                  {item.name}
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 font-mono text-[11px] text-right">
                <span className="text-slate-400 text-[9px]">
                  {isCurrency ? `$${(item.value / 1000000).toFixed(1)}M` : `${item.value}`}
                </span>
                <span className="font-bold text-slate-900 w-8">
                  {pct}%
                </span>
              </div>
            </div>
          );
        })}
        {validData.length > 5 && (
          <div className="text-[9px] text-slate-400 text-right pr-1 italic">
            + {validData.length - 5} más en portafolio
          </div>
        )}
      </div>
    </div>
  );
}

interface KPIDashboardProps {
  projects: Project[];
  users: User[];
  sprints: Sprint[];
  workItems: WorkItem[];
  activities: ProjectActivity[];
  costs: ProjectCost[];
  teams?: Team[];
  testRuns?: TestRun[];
  testCases?: TestCase[];
}

export default function KPIDashboard({
  projects = [],
  users = [],
  sprints = [],
  workItems = [],
  activities = [],
  costs = [],
  teams = [],
  testRuns = [],
  testCases = []
}: KPIDashboardProps) {
  // --- Dashboard Navigation & UI State ---
  const [viewMode, setViewMode] = useState<'ejecutiva' | 'operativa'>('ejecutiva');
  const [activeIndicatorInfo, setActiveIndicatorInfo] = useState<number | null>(null);
  const [isHeaderExpanded, setIsHeaderExpanded] = useState(false);
  const [isFiltersCollapsed, setIsFiltersCollapsed] = useState(true);

  // --- Filtering States ---
  const [selectedProjFilter, setSelectedProjFilter] = useState<string>('ALL');
  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState<string>('ALL');
  const [selectedAreaFilter, setSelectedAreaFilter] = useState<string>('ALL');
  const [selectedLeaderFilter, setSelectedLeaderFilter] = useState<string>('ALL');
  const [selectedScrumFilter, setSelectedScrumFilter] = useState<string>('ALL');
  const [selectedTeamFilter, setSelectedTeamFilter] = useState<string>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string[]>(['DESARROLLO', 'PRUEBAS']);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // --- Active operational view selection ---
  const [operDetailProjId, setOperDetailProjId] = useState<string>('proj-1');
  const [overdueLevelFilter, setOverdueLevelFilter] = useState<'ALL' | 'TAREA' | 'SUBTAREA' | 'SUBSUBTAREA'>('ALL');

  // --- Static/Helper listings based on projects data ---
  const companies = useMemo(() => {
    const list = new Set(projects.map(p => p.client).filter(Boolean));
    return Array.from(list);
  }, [projects]);

  const areas = useMemo(() => {
    return ['Tecnología de la Información', 'Finanzas de Portafolio', 'Operaciones & Logística', 'Negocios & Canales', 'Sistemas Internos'];
  }, []);

  const types = ['Desarrollo Interno', 'Desarrollo Mixto', 'Desarrollo Externo', 'Sin Desarrollo', 'Implementación'];

  const projectStatuses = [
    'REQUERIMIENTOS',
    'APROBADO',
    'DESARROLLO',
    'PRUEBAS',
    'FINALIZADO',
    'CANCELADO'
  ];

  // --- Map and Enrich Projects list for Calculations ---
  const enrichedProjects = useMemo(() => {
    return projects.map((proj, idx) => {
      // 1. Assign deterministic Area
      const areaList = [
        'Tecnología de la Información',
        'Finanzas de Portafolio',
        'Operaciones & Logística',
        'Negocios & Canales',
        'Sistemas Internos'
      ];
      const area = areaList[idx % areaList.length];

      // 2. Assign Project Type from the project's 'desarrollo' configuration field
      const projType = proj.desarrollo || 'Desarrollo Interno';

      // 3. Chronogram/Activities Calculations
      const projActivities = activities.filter(a => a.project_id === proj.id);
      const completedActivitiesValue = projActivities.filter(a => a.status === 'COMPLETADA').length;
      
      const fallbackCronograma = idx === 0 ? 92 : idx === 1 ? 84 : 68;
      const cronogramaCumplimiento = calculateScheduleCompliance(
        completedActivitiesValue,
        projActivities.length,
        fallbackCronograma
      );

      // 4. Budget Calculations (Consumo del Presupuesto)
      const projCosts = costs.filter(c => c.project_id === proj.id);
      const actualCostReal = projCosts.reduce((acc, current) => acc + current.amount, 0) || 
                             (proj.budget_total * (idx === 0 ? 0.72 : idx === 1 ? 0.81 : 0.40));

      const consumoPresupuesto = calculateBudgetConsumption(actualCostReal, proj.budget_total);

      // 5. Avance Físico % (Fases ponderadas o total de entregables)
      let avanceLevantamiento = idx === 0 ? 100 : idx === 1 ? 100 : 100;
      let avanceDiseno = idx === 0 ? 100 : idx === 1 ? 85 : 90;
      let avanceDesarrollo = idx === 0 ? 80 : idx === 1 ? 40 : 10;
      let avancePruebas = idx === 0 ? 30 : idx === 1 ? 10 : 0;
      let avanceProduccion = idx === 0 ? 0 : idx === 1 ? 0 : 0;

      const calcAvanceFisico = calculateWeightedPhysicalProgress(
        avanceLevantamiento,
        avanceDiseno,
        avanceDesarrollo,
        avancePruebas,
        avanceProduccion
      );

      // 6. Velocidad del equipo ágil & Historias
      const projSprints = sprints.filter(s => s.project_id === proj.id);
      const projItems = workItems.filter(w => w.project_id === proj.id);
      
      const sprintActual = projSprints.find(s => s.status === 'EN_CURSO') || projSprints[0];
      const completedPoints = projItems
        .filter(w => w.status === 'FINALIZADO' && w.sprint_id === (sprintActual?.id || ''))
        .reduce((sum, item) => sum + (item.story_points || 0), 0);
      const committedPoints = projItems
        .filter(w => w.sprint_id === (sprintActual?.id || ''))
        .reduce((sum, item) => sum + (item.story_points || 0), 0) || 30; // Fallback 30 ptos

      let sprintCumplimientoPoints = 100;
      if (committedPoints > 0) {
        sprintCumplimientoPoints = Math.round((completedPoints / committedPoints) * 100);
      } else {
        sprintCumplimientoPoints = idx === 0 ? 94 : idx === 1 ? 80 : 60;
      }

      // 7. Calidad de entregables
      const projWorkItemIds = workItems.filter(w => w.project_id === proj.id).map(w => w.id);
      const projTestCaseIds = testCases ? testCases.filter(tc => tc.work_item_id && projWorkItemIds.includes(tc.work_item_id)).map(tc => tc.id) : [];
      const projTestRuns = testRuns ? testRuns.filter(tr => projTestCaseIds.includes(tr.test_case_id)) : [];
      
      const fallbackCalidad = idx === 0 ? 94 : idx === 1 ? 86 : 72;
      const calidadPercent = calculateQualityFromTestRuns(projTestRuns, fallbackCalidad);

      // 8. RIESGO GENERAL (Cálculo según reglas exactas del usuario)
      const riesgo = evaluateProjectRiskStatus(cronogramaCumplimiento, consumoPresupuesto, calidadPercent);

      return {
        ...proj,
        IdProyecto: proj.id,
        NombreProyecto: proj.name,
        Compañía: proj.client,
        ÁreaSolicitante: area,
        LíderProyecto: users.find(u => u.id === proj.project_manager_id)?.last_name || 'PM Solicitante',
        ScrumMaster: users.find(u => u.id === proj.scrum_master_id)?.last_name || 'Agile Lead',
        FechaInicioPlanificada: proj.start_date,
        FechaFinPlanificada: proj.end_date,
        FechaInicioReal: proj.start_date,
        FechaFinReal: proj.end_date,
        PresupuestoAprobado: proj.budget_total,
        CostoRealAcumulado: actualCostReal,
        EstadoProyecto: proj.status,
        TipoProyecto: projType,
        percentAvanceFisico: calcAvanceFisico,
        percentCumplimientoCronograma: cronogramaCumplimiento,
        percentConsumoPresupuesto: consumoPresupuesto,
        percentVariacionPresupuesto: consumoPresupuesto,
        percentCalidad: calidadPercent,
        RiesgoGeneral: riesgo,
        avancesFases: {
          levantamiento: avanceLevantamiento,
          diseno: avanceDiseno,
          desarrollo: avanceDesarrollo,
          pruebas: avancePruebas,
          produccion: avanceProduccion
        },
        defectsCount: idx === 0 ? 3 : idx === 1 ? 8 : 14,
        reprocesosCount: idx === 0 ? 1 : idx === 1 ? 3 : 6,
        desviacionBaseDays: (() => {
          let calculatedDesviacionBaseDays = 0;
          try {
            const cachedTasksStr = localStorage.getItem(`wbs_tasks_${proj.id}`);
            const cachedBaselinesStr = localStorage.getItem(`wbs_baselines_${proj.id}`);
            
            let projectTasksList: WBSItem[] = [];
            if (cachedTasksStr && cachedTasksStr !== "null" && cachedTasksStr !== "undefined") {
              const parsed = JSON.parse(cachedTasksStr);
              if (Array.isArray(parsed)) {
                projectTasksList = parsed;
              }
            }
            if (projectTasksList.length === 0) {
              projectTasksList = getInitialWBSItems(proj.id);
            }

            let baselinesList: WBSBaseline[] = [];
            if (cachedBaselinesStr && cachedBaselinesStr !== "null" && cachedBaselinesStr !== "undefined") {
              const parsed = JSON.parse(cachedBaselinesStr);
              if (Array.isArray(parsed)) {
                baselinesList = parsed;
              }
            }
            if (baselinesList.length === 0) {
              baselinesList = [
                {
                  id: 'bs-initial',
                  savedAt: '2026-05-14 09:00',
                  savedBy: 'Carlos Pérez (PM)',
                  itemsSnapshot: getInitialWBSItems(proj.id).map(it => ({
                    id: it.id,
                    startDate: it.startDate,
                    endDate: it.endDate === '2026-06-03' ? '2026-05-31' : it.endDate,
                    progress: 0
                  }))
                }
              ];
            }

            const activeBaseline = baselinesList[0];
            if (activeBaseline) {
              const tasksAndSubtasks = projectTasksList.filter(t => t.level === 'TAREA' || t.level === 'SUBTAREA');
              tasksAndSubtasks.forEach(task => {
                const bsSnapshot = activeBaseline.itemsSnapshot.find(snap => snap.id === task.id);
                if (bsSnapshot && bsSnapshot.endDate && task.endDate) {
                  const tDate = new Date(task.endDate);
                  const bDate = new Date(bsSnapshot.endDate);
                  const diff = tDate.getTime() - bDate.getTime();
                  const diffDays = Math.round(diff / (1000 * 60 * 60 * 24));
                  if (diffDays > 0) {
                    calculatedDesviacionBaseDays += diffDays;
                  }
                }
              });
            }
          } catch (e) {
            console.error("Error calculating dynamic baseline deviation", e);
          }

          if (calculatedDesviacionBaseDays === 0) {
            return idx === 0 ? 3 : idx === 1 ? 5 : 8;
          }
          return calculatedDesviacionBaseDays;
        })(),
        committedPoints,
        completedPoints,
        sprintCumplimientoPoints
      };
    });
  }, [projects, users, sprints, workItems, activities, costs]);

  // --- Compute lists after search filters ---
  const filteredProjects = useMemo(() => {
    return enrichedProjects.filter(p => {
      // 1. Text Search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = p.NombreProyecto.toLowerCase().includes(query);
        const matchesClient = p.Compañía.toLowerCase().includes(query);
        const matchesId = p.IdProyecto.toLowerCase().includes(query);
        const matchesLeader = p.LíderProyecto.toLowerCase().includes(query);
        if (!matchesName && !matchesClient && !matchesId && !matchesLeader) return false;
      }
      // 2. Project Selector
      if (selectedProjFilter !== 'ALL' && p.IdProyecto !== selectedProjFilter) return false;
      // 3. Company Selector
      if (selectedCompanyFilter !== 'ALL' && p.Compañía !== selectedCompanyFilter) return false;
      // 4. Area Selector
      if (selectedAreaFilter !== 'ALL' && p.ÁreaSolicitante !== selectedAreaFilter) return false;
      // 5. Leader Selector
      if (selectedLeaderFilter !== 'ALL' && p.project_manager_id !== selectedLeaderFilter) return false;
      // 6. Scrum Selector
      if (selectedScrumFilter !== 'ALL' && p.scrum_master_id !== selectedScrumFilter) return false;
      // 7. Team Selector
      if (selectedTeamFilter !== 'ALL' && p.team_id !== selectedTeamFilter) return false;
      // 8. Status Selector
      if (selectedStatusFilter.length > 0 && !selectedStatusFilter.includes(p.EstadoProyecto)) return false;
      // 9. Type Selector
      if (selectedTypeFilter !== 'ALL' && p.TipoProyecto !== selectedTypeFilter) return false;
      
      return true;
    });
  }, [enrichedProjects, searchQuery, selectedProjFilter, selectedCompanyFilter, selectedAreaFilter, selectedLeaderFilter, selectedScrumFilter, selectedTeamFilter, selectedStatusFilter, selectedTypeFilter]);

  // --- Core Metatrends / Executives metrics sum ---
  const globalSummary = useMemo(() => {
    const totalCount = filteredProjects.length;
    if (totalCount === 0) {
      return {
        total: 0,
        verde: 0,
        amarillo: 0,
        rojo: 0,
        avgCronograma: 0,
        avgPresupuesto: 0,
        avgAvance: 0,
        avgVelocidad: 0,
        avgCalidad: 0,
        avgDesviacion: 0,
        maxTypeName: 'Ninguno',
        typeConcentration: 0,
        maxCompanyName: 'Ninguno',
        companyBudgetConcentration: 0,
        totalBudget: 0,
        typeDistribution: [],
        companyDistribution: []
      };
    }

    const verdeCount = filteredProjects.filter(p => p.RiesgoGeneral === 'Verde').length;
    const amarilloCount = filteredProjects.filter(p => p.RiesgoGeneral === 'Amarillo').length;
    const rojoCount = filteredProjects.filter(p => p.RiesgoGeneral === 'Rojo').length;

    const sumCronograma = filteredProjects.reduce((acc, p) => acc + p.percentCumplimientoCronograma, 0);
    const sumPresupuesto = filteredProjects.reduce((acc, p) => acc + p.percentConsumoPresupuesto, 0);
    const sumAvance = filteredProjects.reduce((acc, p) => acc + p.percentAvanceFisico, 0);
    const sumCalidad = filteredProjects.reduce((acc, p) => acc + p.percentCalidad, 0);
    const sumVelocidad = filteredProjects.reduce((acc, p) => acc + p.sprintCumplimientoPoints, 0);
    const sumDesviacion = filteredProjects.reduce((acc, p) => acc + (p.desviacionBaseDays || 0), 0);

    // Development Type concentration (Tipo de Desarrollo)
    const typeCounts: { [key: string]: number } = {};
    filteredProjects.forEach(p => {
      const tp = p.TipoProyecto || 'Desarrollo Interno';
      typeCounts[tp] = (typeCounts[tp] || 0) + 1;
    });
    let maxTypeName = 'Desarrollo Interno';
    let maxTypeCount = 0;
    Object.entries(typeCounts).forEach(([name, val]) => {
      if (val > maxTypeCount) {
        maxTypeCount = val;
        maxTypeName = name;
      }
    });
    const typeConcentration = totalCount > 0 ? Math.round((maxTypeCount / totalCount) * 100) : 0;

    // Company Projects Concentration
    const companyProjectCounts: { [key: string]: number } = {};
    let totalBudget = 0;
    filteredProjects.forEach(p => {
      const co = p.client || 'Cliente General';
      companyProjectCounts[co] = (companyProjectCounts[co] || 0) + 1;
      totalBudget += (p.budget_total || 0);
    });
    let maxCompanyName = 'Empresa General';
    let maxCompanyProjects = 0;
    Object.entries(companyProjectCounts).forEach(([name, countVal]) => {
      if (countVal > maxCompanyProjects) {
        maxCompanyProjects = countVal;
        maxCompanyName = name;
      }
    });
    const companyBudgetConcentration = totalCount > 0 ? Math.round((maxCompanyProjects / totalCount) * 100) : 0;

    // Entire Project Type Distribution list
    const typeDistribution = Object.entries(typeCounts).map(([name, val]) => {
      return {
        name,
        value: val,
        percentage: totalCount > 0 ? Math.round((val / totalCount) * 100) : 0,
      };
    }).sort((a, b) => b.value - a.value);

    // Entire Company Projects Distribution list
    const companyDistribution = Object.entries(companyProjectCounts).map(([name, countVal]) => {
      return {
        name,
        value: countVal,
        percentage: totalCount > 0 ? Math.round((countVal / totalCount) * 100) : 0,
      };
    }).sort((a, b) => b.value - a.value);

    return {
      total: totalCount,
      verde: verdeCount,
      amarillo: amarilloCount,
      rojo: rojoCount,
      avgCronograma: Math.round(sumCronograma / totalCount),
      avgPresupuesto: Math.round(sumPresupuesto / totalCount),
      avgAvance: Math.round(sumAvance / totalCount),
      avgVelocidad: Math.round(sumVelocidad / totalCount),
      avgCalidad: Math.round(sumCalidad / totalCount),
      avgDesviacion: totalCount > 0 ? Number((sumDesviacion / totalCount).toFixed(1)) : 0,
      maxTypeName,
      typeConcentration,
      maxCompanyName: maxCompanyName,
      companyBudgetConcentration,
      totalBudget,
      typeDistribution,
      companyDistribution
    };
  }, [filteredProjects, users]);

  const handleSelectOperProject = (pId: string) => {
    setOperDetailProjId(pId);
    setViewMode('operativa');
  };

  const selectedOperProjectDetail = useMemo(() => {
    return enrichedProjects.find(p => p.id === operDetailProjId) || enrichedProjects[0];
  }, [enrichedProjects, operDetailProjId]);

  const selectedProjectModules = useMemo(() => {
    if (!selectedOperProjectDetail) return [];
    const projectId = selectedOperProjectDetail.id;
    const localKey = `wbs_tasks_${projectId}`;
    const localData = localStorage.getItem(localKey);
    let items: WBSItem[] = [];
    if (localData) {
      try {
        items = JSON.parse(localData);
      } catch (e) {
        items = getInitialWBSItems(projectId);
      }
    } else {
      items = getInitialWBSItems(projectId);
    }
    return items.filter(it => it.level === 'MODULO');
  }, [selectedOperProjectDetail]);

  const selectedProjectOverdueActivities = useMemo(() => {
    if (!selectedOperProjectDetail) return [];
    const projectId = selectedOperProjectDetail.id;
    const localKey = `wbs_tasks_${projectId}`;
    const localData = localStorage.getItem(localKey);
    let items: WBSItem[] = [];
    if (localData) {
      try {
        items = JSON.parse(localData);
      } catch (e) {
        items = getInitialWBSItems(projectId);
      }
    } else {
      items = getInitialWBSItems(projectId);
    }
    const todayStr = (() => {
      const local = new Date();
      const offset = local.getTimezoneOffset();
      const localTime = new Date(local.getTime() - (offset * 60 * 1000));
      return localTime.toISOString().split('T')[0];
    })();
    return items.filter(it => 
      (it.level === 'TAREA' || it.level === 'SUBTAREA' || it.level === 'SUBSUBTAREA') &&
      it.endDate < todayStr &&
      it.progress < 100
    );
  }, [selectedOperProjectDetail]);

  const handleClearFilters = () => {
    setSelectedProjFilter('ALL');
    setSelectedCompanyFilter('ALL');
    setSelectedAreaFilter('ALL');
    setSelectedLeaderFilter('ALL');
    setSelectedScrumFilter('ALL');
    setSelectedTeamFilter('ALL');
    setSelectedStatusFilter([]);
    setSelectedTypeFilter('ALL');
    setSearchQuery('');
  };

  const hasActiveFilters = 
    selectedProjFilter !== 'ALL' ||
    selectedCompanyFilter !== 'ALL' ||
    selectedAreaFilter !== 'ALL' ||
    selectedLeaderFilter !== 'ALL' ||
    selectedScrumFilter !== 'ALL' ||
    selectedTeamFilter !== 'ALL' ||
    selectedStatusFilter.length > 0 ||
    selectedTypeFilter !== 'ALL' ||
    searchQuery !== '';

  return (
    <div className="space-y-6" id="dashboard-system-master">
      {/* 1. ARCHITECTURAL HEADER & DESCRIPTION */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-2xl text-white relative overflow-hidden shadow-lg transition-all duration-300">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20 pointer-events-none" />
        
        {/* Siempre visible: Título, insignias y toggles */}
        <div className="relative z-10 p-5 md:p-6 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-extrabold uppercase px-2.5 py-0.5 rounded-full border border-indigo-500/30 font-mono tracking-widest flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5 text-indigo-400" /> PMO EXPERT CONTROL
              </span>
              
              {/* Botón de expansión para Alternar Detalles */}
              <button
                onClick={() => setIsHeaderExpanded(!isHeaderExpanded)}
                className="text-[10px] bg-slate-950/65 hover:bg-slate-950 border border-slate-800 hover:border-indigo-500/40 text-slate-350 hover:text-indigo-300 font-bold px-2.5 py-0.5 rounded-full transition-all duration-200 cursor-pointer flex items-center gap-1 font-mono uppercase tracking-wider"
                title={isHeaderExpanded ? "Ocultar descripción detallada" : "Mostrar descripción detallada"}
              >
                {isHeaderExpanded ? "Ocon. Detalles" : "Ver Descripción"}
                {isHeaderExpanded ? <ChevronUp className="w-3 h-3 text-indigo-400" /> : <ChevronDown className="w-3 h-3 text-indigo-400" />}
              </button>
            </div>
            
            <h2 className="text-xl md:text-2xl font-extrabold text-slate-100 tracking-tight leading-none">
              Tablero de Control del Portafolio Integrado
            </h2>
          </div>
          
          {/* Toggles de Vista Ejecutiva / Operativa */}
          <div className="bg-slate-950/80 p-1 rounded-xl border border-slate-800 flex items-center shadow-inner gap-1 shrink-0">
            <button
              onClick={() => setViewMode('ejecutiva')}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'ejecutiva'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              Vista Ejecutiva
            </button>
            <button
              onClick={() => setViewMode('operativa')}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'operativa'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              Vista Operativa
            </button>
          </div>
        </div>

        {/* Bloque expandible con la descripción técnica y la guía de uso de la PMO */}
        {isHeaderExpanded && (
          <div className="relative z-10 px-5 md:px-6 pb-5 md:pb-6 pt-1 bg-slate-950/20 border-t border-slate-850/60 transition-all duration-300 animate-fadeIn">
            <p className="text-slate-300 text-xs md:text-sm max-w-4xl leading-relaxed">
              Consola analítica y operativa de proyectos informáticos en base al avance de cronograma (tareas completadas), estados presupuestarios de valor ganado (Earned Value Management) y balance de velocidad ágil.
            </p>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="p-3.5 bg-slate-950/50 rounded-xl border border-slate-850/50 flex items-start gap-2.5">
                <span className="text-emerald-400 text-sm mt-0.5">📊</span>
                <div className="space-y-0.5">
                  <h4 className="text-[11px] font-extrabold text-slate-200 uppercase tracking-wide">Vista Ejecutiva</h4>
                  <p className="text-[10px] leading-relaxed text-slate-450">Indicadores clave de rendimiento presupuestario (CPI, SPI), curvas acumuladas e informes del valor ganado.</p>
                </div>
              </div>
              <div className="p-3.5 bg-slate-950/50 rounded-xl border border-slate-850/50 flex items-start gap-2.5">
                <span className="text-indigo-400 text-sm mt-0.5">⚙️</span>
                <div className="space-y-0.5">
                  <h4 className="text-[11px] font-extrabold text-slate-200 uppercase tracking-wide">Vista Operativa</h4>
                  <p className="text-[10px] leading-relaxed text-slate-450">Fases de desarrollo e ingeniería (diseño, QA, implantación) y avance ágil con historiales de Sprints cerrados.</p>
                </div>
              </div>
              <div className="p-3.5 bg-slate-950/50 rounded-xl border border-slate-850/50 flex items-start gap-2.5">
                <span className="text-amber-400 text-sm mt-0.5">💡</span>
                <div className="space-y-0.5">
                  <h4 className="text-[11px] font-extrabold text-slate-200 uppercase tracking-wide">Filtros Dinámicos</h4>
                  <p className="text-[10px] leading-relaxed text-slate-450">Use la consola inferior para segmentar por responsables, empresas consultoras de outsourcing y líder ágil.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. FLEXIBLE FILTERS CONSOLE */}
      {isFiltersCollapsed ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-row justify-between items-center gap-4 transition-all duration-200">
          <div className="flex items-center gap-2.5">
            <div className="bg-slate-100 p-2 rounded-lg text-slate-500">
              <Filter className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Filtros de Consulta</h3>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Segmentación por líder, área solicitante, cliente/empresa, Scrum Master o estado de ciclo de vida.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-[11px] font-mono text-slate-600 bg-slate-50 border border-slate-150 px-2.5 py-1 rounded-lg hidden md:block">
              Mostrando: <strong>{filteredProjects.length} / {projects.length}</strong> Proyectos
            </div>
            {hasActiveFilters && (
              <span className="bg-amber-105 text-amber-800 font-extrabold text-[10px] px-2 py-0.5 rounded-full border border-amber-200">
                Filtros Activos
              </span>
            )}
            <button 
              onClick={() => setIsFiltersCollapsed(false)}
              className="text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 px-3 py-1.5 rounded-lg border border-slate-250 font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <span>Mostrar Filtros</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-500" />
              <h3 className="font-bold text-slate-800 text-sm">Filtros Avanzados de Consulta</h3>
              <button
                onClick={() => setIsFiltersCollapsed(true)}
                className="ml-2 text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 px-2.5 py-0.5 rounded border border-slate-250 font-bold transition flex items-center gap-1 cursor-pointer"
              >
                <span>Contraer</span>
                <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
              </button>
            </div>
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="text-xs text-rose-600 hover:text-rose-700 font-extrabold flex items-center gap-1 cursor-pointer transition-all hover:underline"
              >
                <X className="w-3 h-3" /> Limpiar Filtros
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
            {/* Text Search */}
            <div className="md:col-span-1">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Búsqueda de Texto
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Proyecto, Líder..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white transition-all font-semibold"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Project SELECTOR */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Identificador Proyecto
              </label>
              <select
                value={selectedProjFilter}
                onChange={e => setSelectedProjFilter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-2.5 text-xs text-slate-800 outline-none focus:ring-1 focus:ring-indigo-500 transition-all font-semibold"
              >
                <option value="ALL">Todos los Proyectos</option>
                {enrichedProjects.map(p => (
                  <option key={p.id} value={p.id}>
                    [{p.code}] {p.name.substring(0, 24)}...
                  </option>
                ))}
              </select>
            </div>

            {/* Company Client Selector */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Compañía / Cliente
              </label>
              <select
                value={selectedCompanyFilter}
                onChange={e => setSelectedCompanyFilter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-2.5 text-xs text-slate-800 outline-none focus:ring-1 focus:ring-indigo-500 transition-all font-semibold"
              >
                <option value="ALL">Cualquier Compañía</option>
                {companies.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Area solicitante */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Área Solicitante
              </label>
              <select
                value={selectedAreaFilter}
                onChange={e => setSelectedAreaFilter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-2.5 text-xs text-slate-800 outline-none focus:ring-1 focus:ring-indigo-500 transition-all font-semibold"
              >
                <option value="ALL">Cualquier Área</option>
                {areas.map(a => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>

            {/* Project Manager Leader */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Líder de Proyecto / PM
              </label>
              <select
                value={selectedLeaderFilter}
                onChange={e => setSelectedLeaderFilter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-2.5 text-xs text-slate-800 outline-none focus:ring-1 focus:ring-indigo-500 transition-all font-semibold"
              >
                <option value="ALL">Cualquier Líder</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.first_name} {u.last_name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
            {/* Scrum Master */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Scrum Master
              </label>
              <select
                value={selectedScrumFilter}
                onChange={e => setSelectedScrumFilter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-3 text-xs text-slate-800 outline-none focus:ring-1 focus:ring-indigo-500 transition-all font-semibold"
              >
                <option value="ALL">Cualquier Scrum Master</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.first_name} {u.last_name}</option>
                ))}
              </select>
            </div>

            {/* Tipo de Desarrollo */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Tipo de Desarrollo
              </label>
              <select
                value={selectedTypeFilter}
                onChange={e => setSelectedTypeFilter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-3 text-xs text-slate-800 outline-none focus:ring-1 focus:ring-indigo-500 transition-all font-semibold"
              >
                <option value="ALL">Cualquier Tipo de Desarrollo ({types.length})</option>
                {types.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            {/* Estado Proyecto */}
            <div className="relative">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Estado Ciclo de Vida (Múltiple)
              </label>
              <button
                type="button"
                onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-3 text-xs text-slate-800 text-left cursor-pointer font-bold flex justify-between items-center whitespace-nowrap overflow-hidden min-h-[34px]"
              >
                <span className="truncate">
                  {selectedStatusFilter.length === 6
                    ? '🟢 Todos los Estados'
                    : selectedStatusFilter.length === 0
                    ? '⚠️ Cualquier Estado (Sin filtro)'
                    : selectedStatusFilter.map(val => {
                        const matching = [
                          { value: 'REQUERIMIENTOS', label: 'REQUERIMIENTOS', icon: '📋' },
                          { value: 'APROBADO', label: 'APROBADO', icon: '✅' },
                          { value: 'DESARROLLO', label: 'DESARROLLO', icon: '💻' },
                          { value: 'PRUEBAS', label: 'PRUEBAS', icon: '🧪' },
                          { value: 'FINALIZADO', label: 'FINALIZADO', icon: '🏁' },
                          { value: 'CANCELADO', label: 'CANCELADO', icon: '🚫' },
                        ].find(s => s.value === val);
                        return matching ? `${matching.icon} ${matching.label}` : val;
                      }).join(', ')}
                </span>
                <span className="text-slate-400 text-[9px] ml-1">▼</span>
              </button>
              
              {isStatusDropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setIsStatusDropdownOpen(false)} 
                  />
                  <div className="absolute right-0 left-0 mt-1 max-h-60 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-xl p-2 z-20 space-y-1">
                    <div className="flex justify-between items-center pb-1.5 mb-1.5 border-b border-slate-100 text-[10px]">
                      <button
                        type="button"
                        onClick={() => setSelectedStatusFilter(['REQUERIMIENTOS', 'APROBADO', 'DESARROLLO', 'PRUEBAS', 'FINALIZADO', 'CANCELADO'])}
                        className="text-indigo-600 font-extrabold hover:underline"
                      >
                        Todos
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedStatusFilter([])}
                        className="text-slate-500 font-extrabold hover:underline"
                      >
                        Limpiar
                      </button>
                    </div>
                    {[
                      { value: 'REQUERIMIENTOS', label: 'REQUERIMIENTOS', icon: '📋' },
                      { value: 'APROBADO', label: 'APROBADO', icon: '✅' },
                      { value: 'DESARROLLO', label: 'DESARROLLO', icon: '💻' },
                      { value: 'PRUEBAS', label: 'PRUEBAS', icon: '🧪' },
                      { value: 'FINALIZADO', label: 'FINALIZADO', icon: '🏁' },
                      { value: 'CANCELADO', label: 'CANCELADO', icon: '🚫' },
                    ].map(option => {
                      const isChecked = selectedStatusFilter.includes(option.value);
                      return (
                        <label 
                          key={option.value} 
                          className="flex items-center gap-2 p-1 px-2 hover:bg-slate-50 rounded cursor-pointer text-xs font-semibold select-none text-slate-705"
                        >
                          <input 
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              if (isChecked) {
                                setSelectedStatusFilter(selectedStatusFilter.filter(s => s !== option.value));
                              } else {
                                setSelectedStatusFilter([...selectedStatusFilter, option.value]);
                              }
                            }}
                            className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer w-3.5 h-3.5"
                          />
                          <span>{option.icon} {option.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* Active stats indicator summary */}
            <div className="flex items-end justify-end pb-0.5">
              <div className="text-right text-[11px] text-slate-500 bg-slate-50 border border-slate-150 px-3 py-1.5 rounded-lg w-full flex items-center justify-between">
                <span className="font-semibold text-slate-600">Mostrando:</span>
                <span className="font-mono font-bold text-slate-900">{filteredProjects.length} / {projects.length} Proyectos</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =======================================================
          3A. EXECUTIVE VIEW TAB
          ======================================================= */}
      {viewMode === 'ejecutiva' && (
        <div className="space-y-6 animate-fadeIn">
          
          {/* Executive Summary Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* KPI WIDGET: Proyectos Activos */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs relative overflow-hidden flex flex-col justify-between min-h-[120px]">
              <div className="absolute top-0 left-0 bg-indigo-500 h-1 w-full" />
              <div className="flex justify-between items-start text-xs font-bold text-slate-500 uppercase tracking-wider">
                <span>Proyectos Activos</span>
                <Briefcase className="w-4.5 h-4.5 text-indigo-500" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <h4 className="text-4xl font-black text-slate-900 font-mono">
                  {globalSummary.total}
                </h4>
                <span className="text-xs text-slate-400 font-semibold uppercase font-mono">Proyectos</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Filtros activos aplicados al portafolio general.
              </div>
            </div>

            {/* KPI WIDGET: Riesgo General */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs relative flex flex-col justify-between min-h-[120px]">
              <div className="absolute top-0 left-0 bg-slate-550 h-1 w-full" />
              <div className="flex justify-between items-start text-xs font-bold text-slate-500 uppercase tracking-wider">
                <span>Semáforos de Riesgo General</span>
                <AlertTriangle className="w-4.5 h-4.5 text-amber-500" />
              </div>
              <div className="flex items-center gap-2.5 mt-3">
                <div className="flex-1 flex flex-col items-center bg-emerald-50/50 border border-emerald-100 rounded-xl p-2">
                  <span className="text-[10px] text-emerald-700 font-extrabold uppercase font-mono">Verde</span>
                  <span className="text-lg font-black text-emerald-800 font-mono mt-0.5">{globalSummary.verde}</span>
                </div>
                <div className="flex-1 flex flex-col items-center bg-amber-50/50 border border-amber-100 rounded-xl p-2">
                  <span className="text-[10px] text-amber-700 font-extrabold uppercase font-mono">Amarillo</span>
                  <span className="text-lg font-black text-amber-800 font-mono mt-0.5">{globalSummary.amarillo}</span>
                </div>
                <div className="flex-1 flex flex-col items-center bg-rose-50/50 border border-rose-100 rounded-xl p-2">
                  <span className="text-[10px] text-rose-700 font-extrabold uppercase font-mono">Rojo</span>
                  <span className="text-lg font-black text-rose-800 font-mono mt-0.5">{globalSummary.rojo}</span>
                </div>
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Proyectos evaluados automáticamente por la PMO.
              </div>
            </div>

            {/* KPI WIDGET: Executive Summary Info */}
            <div className="bg-gradient-to-br from-indigo-950 to-slate-900 text-white border border-indigo-950 rounded-2xl p-5 shadow-xs relative overflow-hidden flex flex-col justify-between min-h-[120px]">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none" />
              <div className="flex justify-between items-start text-[10px] font-bold uppercase tracking-wider text-indigo-300">
                <span>Resumen de Desempeño</span>
                <Sparkles className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="mt-2">
                <p className="text-xs text-slate-200 leading-relaxed font-medium">
                  El portafolio general registra un avance promedio del <strong className="text-cyan-400">{globalSummary.avgCronograma}%</strong> en cronograma, con un consumo promedio de presupuesto del <strong className="text-violet-400">{globalSummary.avgPresupuesto}%</strong> de los recursos aprobados.
                </p>
              </div>
            </div>

          </div>

          {/* 6 KPIs Core Grid */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-150 pb-2">
              <Activity className="w-5 h-5 text-indigo-600" />
              <h3 className="font-extrabold text-slate-800 text-sm tracking-tight">
                6 Indicadores Clave de Desempeño (KPIs)
              </h3>
              <span className="text-[10px] bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded-full font-mono">
                Valores Promedio del Portafolio
              </span>
            </div>

            <div className="space-y-4">
              {/* Row of 3 KPIs */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* KPI 2: Consumo de Presupuesto */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs relative flex flex-col justify-between">
                  <div className="absolute top-0 left-0 bg-violet-500 h-1 w-full" />
                  <div className="flex justify-between items-start text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <span>Consumo de Presupuesto</span>
                    <DollarSign className="w-4 h-4 text-violet-500" />
                  </div>
                  <div className="my-3">
                    <h4 className={`text-2xl font-black font-mono ${
                      globalSummary.avgPresupuesto > 100 ? 'text-rose-600' : 'text-slate-900'
                    }`}>
                      {globalSummary.avgPresupuesto}%
                    </h4>
                    <p className="text-[10px] text-slate-500 font-medium mt-1">
                      Porcentaje de presupuesto real consumido.
                    </p>
                  </div>
                  <div className="space-y-1.5 mt-1">
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          globalSummary.avgPresupuesto <= 80
                            ? 'bg-emerald-500'
                            : globalSummary.avgPresupuesto <= 100
                            ? 'bg-amber-500'
                            : 'bg-rose-500'
                        }`}
                        style={{ width: `${Math.min(100, globalSummary.avgPresupuesto)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[9px] font-bold text-slate-400">
                      <span>Meta: &lt;=80%</span>
                      <span className={globalSummary.avgPresupuesto > 100 ? 'text-rose-500' : 'text-slate-400'}>
                        {globalSummary.avgPresupuesto > 100 ? 'Límite Excedido' : `Actual: ${globalSummary.avgPresupuesto}%`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* KPI 1: Avance de Cronograma */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs relative flex flex-col justify-between">
                  <div className="absolute top-0 left-0 bg-cyan-500 h-1 w-full" />
                  <div className="flex justify-between items-start text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <span>Avance de Cronograma</span>
                    <Calendar className="w-4 h-4 text-cyan-500" />
                  </div>
                  <div className="my-3">
                    <h4 className="text-2xl font-black text-slate-900 font-mono">
                      {globalSummary.avgCronograma}%
                    </h4>
                    <p className="text-[10px] text-slate-500 font-medium mt-1">
                      Tareas completas del cronograma general.
                    </p>
                  </div>
                  <div className="space-y-1.5 mt-1">
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          globalSummary.avgCronograma >= 90
                            ? 'bg-emerald-500'
                            : globalSummary.avgCronograma >= 75
                            ? 'bg-amber-500'
                            : 'bg-rose-500'
                        }`}
                        style={{ width: `${globalSummary.avgCronograma}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[9px] font-bold text-slate-400">
                      <span>Meta: &gt;=90%</span>
                      <span>Actual: {globalSummary.avgCronograma}%</span>
                    </div>
                  </div>
                </div>

                {/* KPI 3: Avance Físico Ponderado */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs relative flex flex-col justify-between">
                  <div className="absolute top-0 left-0 bg-orange-500 h-1 w-full" />
                  <div className="flex justify-between items-start text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <span>Avance Físico Ponderado</span>
                    <Layers className="w-4 h-4 text-orange-500" />
                  </div>
                  <div className="my-3">
                    <h4 className="text-2xl font-black text-slate-900 font-mono">
                      {globalSummary.avgAvance}%
                    </h4>
                    <p className="text-[10px] text-slate-500 font-medium mt-1">
                      Progreso real por entregables ponderados.
                    </p>
                  </div>
                  <div className="space-y-1.5 mt-1">
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-orange-500"
                        style={{ width: `${globalSummary.avgAvance}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[9px] font-bold text-slate-400">
                      <span>Por fases PMO</span>
                      <span>Actual: {globalSummary.avgAvance}%</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Row of 3 KPIs */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* KPI 4: Velocidad de Equipos Ágiles */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs relative flex flex-col justify-between">
                  <div className="absolute top-0 left-0 bg-emerald-500 h-1 w-full" />
                  <div className="flex justify-between items-start text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <span>Velocidad de Equipos</span>
                    <Zap className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div className="my-3">
                    <h4 className="text-2xl font-black text-slate-900 font-mono">
                      {globalSummary.avgVelocidad}%
                    </h4>
                    <p className="text-[10px] text-slate-500 font-medium mt-1">
                      Cumplimiento de Story Points del sprint.
                    </p>
                  </div>
                  <div className="space-y-1.5 mt-1">
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          globalSummary.avgVelocidad >= 90
                            ? 'bg-emerald-500'
                            : globalSummary.avgVelocidad >= 75
                            ? 'bg-amber-500'
                            : 'bg-rose-500'
                        }`}
                        style={{ width: `${Math.min(100, globalSummary.avgVelocidad)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[9px] font-bold text-slate-400">
                      <span>Meta: &gt;=90%</span>
                      <span>Actual: {globalSummary.avgVelocidad}%</span>
                    </div>
                  </div>
                </div>

                {/* KPI 5: Calidad de Entregables */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs relative flex flex-col justify-between">
                  <div className="absolute top-0 left-0 bg-teal-500 h-1 w-full" />
                  <div className="flex justify-between items-start text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <span>Calidad de Entregables</span>
                    <ShieldCheck className="w-4 h-4 text-teal-500" />
                  </div>
                  <div className="my-3">
                    <h4 className="text-2xl font-black text-slate-900 font-mono">
                      {globalSummary.avgCalidad}%
                    </h4>
                    <p className="text-[10px] text-slate-500 font-medium mt-1">
                      Casos de pruebas aprobadas sin reproceso.
                    </p>
                  </div>
                  <div className="space-y-1.5 mt-1">
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          globalSummary.avgCalidad >= 90
                            ? 'bg-teal-500'
                            : globalSummary.avgCalidad >= 75
                            ? 'bg-amber-500'
                            : 'bg-rose-500'
                        }`}
                        style={{ width: `${globalSummary.avgCalidad}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[9px] font-bold text-slate-400">
                      <span>Meta QA: &gt;=90%</span>
                      <span>Actual: {globalSummary.avgCalidad}%</span>
                    </div>
                  </div>
                </div>

                {/* KPI 6: Días promedio de Desviación Base */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs relative flex flex-col justify-between">
                  <div className="absolute top-0 left-0 bg-rose-500 h-1 w-full" />
                  <div className="flex justify-between items-start text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <span>Desviación Base Promedio</span>
                    <Clock className="w-4 h-4 text-rose-500" />
                  </div>
                  <div className="my-3">
                    <h4 className="text-2xl font-black text-slate-900 font-mono">
                      {globalSummary.avgDesviacion} d
                    </h4>
                    <p className="text-[10px] text-slate-500 font-medium mt-1">
                      Atraso promedio en días vs. línea base.
                    </p>
                  </div>
                  <div className="space-y-1.5 mt-1">
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          globalSummary.avgDesviacion <= 3
                            ? 'bg-emerald-500'
                            : globalSummary.avgDesviacion <= 7
                            ? 'bg-amber-500'
                            : 'bg-rose-500'
                        }`}
                        style={{ width: `${Math.min(100, (globalSummary.avgDesviacion / 10) * 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[9px] font-bold text-slate-400">
                      <span>Límite Sano: &lt;= 3.0 d</span>
                      <span>Actual: {globalSummary.avgDesviacion} d</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* Pie Charts Grid for Sponsors and company budgets */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* KPI WIDGET 6: Tipo de Desarrollo de los proyectos (Gráfico de Pastel) */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-0 left-0 bg-indigo-500 h-1 w-full" />
              <div className="flex justify-between items-center text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                <span className="flex items-center gap-1.5 text-slate-700 font-extrabold">
                  <Layers className="w-4 h-4 text-indigo-500" /> Tipo de Desarrollo (Proyectos Activos)
                </span>
                <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full border border-indigo-150 font-bold">
                  Tipo Mayoritario: {globalSummary.maxTypeName} ({globalSummary.typeConcentration}%)
                </span>
              </div>
              <div className="mt-1">
                <DashboardDonutChart
                  data={globalSummary.typeDistribution}
                  colors={['#4f46e5', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#14b8a6', '#6366f1']}
                />
              </div>
            </div>

            {/* KPI WIDGET 7: Proyectos por Compañía (Gráfico de Pastel) */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-0 left-0 bg-amber-500 h-1 w-full" />
              <div className="flex justify-between items-center text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                <span className="flex items-center gap-1.5 text-slate-700 font-extrabold">
                  <Briefcase className="w-4 h-4 text-amber-500" /> Proyectos por Compañía (Volumen)
                </span>
                <span className="text-[10px] bg-amber-50 text-amber-700 px-2.5 py-0.5 rounded-full border border-amber-150 font-bold">
                  Compañía Mayoritaria: {globalSummary.maxCompanyName} ({globalSummary.companyBudgetConcentration}%)
                </span>
              </div>
              <div className="mt-1">
                <DashboardDonutChart
                  data={globalSummary.companyDistribution}
                  colors={['#d97706', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4', '#14b8a6', '#6366f1']}
                  isCurrency={false}
                />
              </div>
            </div>

          </div>

          {/* GRÁFICOS DE BARRAS HORIZONTALES POR PROYECTO */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 my-6">
            
            {/* Gráfico 1: Avance de Cronograma por Proyecto */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-0 left-0 bg-cyan-500 h-1 w-full" />
              <div className="mb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-cyan-500" /> Avance de Cronograma por Proyecto
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Porcentaje de tareas completadas del cronograma general.
                    </p>
                  </div>
                  <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-bold font-mono">
                    {filteredProjects.length} Proy.
                  </span>
                </div>
              </div>

              <div className="space-y-4 max-h-[320px] overflow-y-auto pr-1 scrollbar-thin">
                {filteredProjects.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-400 font-medium">
                    No hay proyectos activos que coincidan con los filtros.
                  </div>
                ) : (
                  filteredProjects.map((p) => {
                    const val = p.percentCumplimientoCronograma;
                    let barColor = "bg-emerald-500";
                    let textColor = "text-emerald-700 bg-emerald-50 border-emerald-100";
                    if (val < 75) {
                      barColor = "bg-rose-500";
                      textColor = "text-rose-700 bg-rose-50 border-rose-100";
                    } else if (val < 90) {
                      barColor = "bg-amber-500";
                      textColor = "text-amber-700 bg-amber-50 border-amber-100";
                    }

                    return (
                      <div key={p.IdProyecto} className="space-y-1 animate-fadeIn">
                        <div className="flex justify-between items-center text-xs">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-[9px] font-mono font-extrabold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded shrink-0">
                              {p.IdProyecto}
                            </span>
                            <span className="font-bold text-slate-700 truncate" title={p.NombreProyecto}>
                              {p.NombreProyecto}
                            </span>
                            <span className="text-[10px] text-slate-400 truncate hidden sm:inline">
                              • {p.Compañía}
                            </span>
                          </div>
                          <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded border ${textColor} shrink-0`}>
                            {val}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden relative">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(val, 100)}%` }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className={`h-full rounded-full ${barColor}`}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Gráfico 2: Consumo de Presupuesto por Proyecto */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-0 left-0 bg-emerald-500 h-1 w-full" />
              <div className="mb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4 text-emerald-500" /> Consumo de Presupuesto por Proyecto
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Mapeo del presupuesto devengado frente al límite financiero asignado.
                    </p>
                  </div>
                  <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-bold font-mono">
                    {filteredProjects.length} Proy.
                  </span>
                </div>
              </div>

              <div className="space-y-4 max-h-[320px] overflow-y-auto pr-1 scrollbar-thin">
                {filteredProjects.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-400 font-medium">
                    No hay proyectos activos que coincidan con los filtros.
                  </div>
                ) : (
                  filteredProjects.map((p) => {
                    const val = p.percentConsumoPresupuesto;
                    let barColor = "bg-emerald-500";
                    let textColor = "text-emerald-700 bg-emerald-50 border-emerald-100";
                    if (val > 100) {
                      barColor = "bg-rose-500";
                      textColor = "text-rose-700 bg-rose-50 border-rose-100 animate-pulse";
                    } else if (val > 90) {
                      barColor = "bg-amber-500";
                      textColor = "text-amber-700 bg-amber-50 border-amber-100";
                    }

                    return (
                      <div key={p.IdProyecto} className="space-y-1 animate-fadeIn">
                        <div className="flex justify-between items-center text-xs">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-[9px] font-mono font-extrabold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded shrink-0">
                              {p.IdProyecto}
                            </span>
                            <span className="font-bold text-slate-700 truncate" title={p.NombreProyecto}>
                              {p.NombreProyecto}
                            </span>
                            <span className="text-[10px] text-slate-400 truncate hidden sm:inline">
                              • {p.Compañía}
                            </span>
                          </div>
                          <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded border ${textColor} shrink-0`}>
                            {val}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden relative">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(val, 100)}%` }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className={`h-full rounded-full ${barColor}`}
                          />
                          {val > 100 && (
                            <div className="absolute right-0 top-0 h-full bg-rose-500/10 w-[10%] animate-pulse" />
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>

          {/* MAIN PORTFOLIO PROJECTS STATUS TABLE & ANALYSIS */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Portafolio General de Proyectos</h3>
                <p className="text-xs text-slate-500">Métricas analizadas, semáforos resultantes de riesgo y ciclo de vida de los proyectos cargados.</p>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 font-mono text-[10px] uppercase">
                    <th className="py-3 px-4">Cod / Proyecto</th>
                    <th className="py-3 px-3">Cliente / Desarrollo</th>
                    <th className="py-3 px-3">PM / Scrum</th>
                    <th className="py-3 px-3 text-center">Avance Cronograma</th>
                    <th className="py-3 px-3 text-center">Desviación Base</th>
                    <th className="py-3 px-3 text-center">Consumo Presupuesto</th>
                    <th className="py-3 px-3 text-center">Avance Físico</th>
                    <th className="py-3 px-3 text-center">Calidad</th>
                    <th className="py-3 px-3 text-center">Riesgo Calculado</th>
                    <th className="py-3 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150">
                  {filteredProjects.map((p, pIdx) => {
                    const colorCronograma = p.percentCumplimientoCronograma >= 90 ? 'text-emerald-600 font-bold' : p.percentCumplimientoCronograma >= 75 ? 'text-amber-600' : 'text-rose-600 font-bold';
                    const colorPresupuesto = p.percentConsumoPresupuesto <= 80 ? 'text-emerald-600 font-bold' : p.percentConsumoPresupuesto <= 100 ? 'text-amber-600' : 'text-rose-600 font-bold';
                    const colorCalidad = p.percentCalidad >= 90 ? 'text-emerald-600 font-bold' : p.percentCalidad >= 75 ? 'text-amber-600' : 'text-rose-600 font-bold';

                    let badgeRiesgo = 'bg-emerald-50 text-emerald-800 border-emerald-250';
                    if (p.RiesgoGeneral === 'Amarillo') badgeRiesgo = 'bg-amber-50 text-amber-800 border-amber-250';
                    if (p.RiesgoGeneral === 'Rojo') badgeRiesgo = 'bg-rose-50 text-rose-800 border-rose-250';

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <span className="font-mono text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-extrabold uppercase">
                            {p.code || `PROJ-${pIdx + 1}`}
                          </span>
                          <span className="block font-bold text-slate-900 mt-1 hover:text-indigo-600 transition-colors cursor-pointer" onClick={() => handleSelectOperProject(p.id)}>
                            {p.NombreProyecto}
                          </span>
                          <span className="block text-[10px] text-slate-400 font-mono mt-0.5">
                            Fase: {p.avancesFases.pruebas > 0 ? (p.avancesFases.produccion > 0 ? 'Puesta en producción' : 'Pruebas QA') : 'Desarrollo Activo'}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-semibold text-slate-800 block text-[11px]">{p.Compañía}</span>
                          <span className="text-[10px] text-slate-500 font-medium italic block mt-0.5">{p.TipoProyecto}</span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="text-slate-700 block font-semibold">PM: Ing. {p.LíderProyecto}</span>
                          <span className="text-[10px] text-slate-500 block mt-0.5">SM: {p.ScrumMaster}</span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`text-[12px] font-mono font-bold ${colorCronograma}`}>
                            {p.percentCumplimientoCronograma}%
                          </span>
                          <span className="block text-[9px] text-slate-400">tareas comp.</span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`text-[12px] font-mono font-bold ${
                            p.desviacionBaseDays > 3
                              ? p.desviacionBaseDays > 7 ? 'text-rose-600' : 'text-amber-500'
                              : 'text-emerald-600'
                          }`}>
                            {p.desviacionBaseDays} d
                          </span>
                          <span className="block text-[9px] text-slate-400">atraso acum.</span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`text-[12px] font-mono font-bold ${colorPresupuesto}`}>
                            {p.percentConsumoPresupuesto}%
                          </span>
                          <span className="block text-[9px] text-slate-400">del total</span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="text-[12px] font-mono font-bold text-slate-900 block">
                            {p.percentAvanceFisico}%
                          </span>
                          <div className="w-12 bg-slate-100 h-1.5 rounded-full mx-auto mt-1 overflow-hidden">
                            <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${p.percentAvanceFisico}%` }} />
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`text-[12px] font-mono font-bold ${colorCalidad}`}>
                            {p.percentCalidad}%
                          </span>
                          <span className="block text-[9px] text-slate-400">QA aprobados</span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border ${badgeRiesgo}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              p.RiesgoGeneral === 'Verde' ? 'bg-emerald-500' : p.RiesgoGeneral === 'Amarillo' ? 'bg-amber-500' : 'bg-red-500'
                            }`} />
                            {p.RiesgoGeneral}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleSelectOperProject(p.id)}
                            className="text-xs bg-indigo-55 hover:bg-indigo-100 text-indigo-700 font-extrabold px-3 py-1.5 rounded-lg transition-all active:scale-[0.98] cursor-pointer"
                          >
                            Análisis Operativo
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredProjects.length === 0 && (
                    <tr>
                      <td colSpan={9} className="text-center py-8 text-slate-405 font-semibold italic">
                        No se encontraron proyectos activos con los criterios de filtros aplicados. Pruebe otra combinación.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* INDICATORS DETAILED COMPENDIUM (Accordion structure) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-slate-900 font-extrabold text-base flex items-center gap-2">
                  <Activity className="w-5 h-5 text-indigo-600" /> 6 Indicadores Clave de Desempeño (KPIs)
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Revise los objetivos analíticos establecidos, las fórmulas de cálculo exactas y las directrices de color. Haga clic en un indicador para expandir.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3" id="indicators-kpis-accordion">
              {[
                {
                  id: 2,
                  title: 'Consumo de Presupuesto',
                  obj: 'Medir el nivel de gasto real ejecutado frente al presupuesto total aprobado del proyecto.',
                  formula: '% Consumo de Presupuesto = (Costo real acumulado / Presupuesto aprobado total) × 100',
                  req: 'Proyecto, Presupuesto Aprobado, Costo real acumulado, Tipo de costo, Facturas / Comprobantes',
                  sem: 'Verde: <= 80% | Amarillo: > 80% y <= 100% | Rojo: > 100% (Sobrecosto)',
                  inter: 'Porcentaje acumulado del presupuesto ejecutado. Un valor superior a 100% representa un rebase presupuestal directo.',
                  average: globalSummary.avgPresupuesto,
                  suf: '%',
                  color: 'violet',
                  icon: DollarSign
                },
                {
                  id: 1,
                  title: 'Avance de Cronograma',
                  obj: 'Medir el avance general del proyecto conforme a las tareas completadas de la planificación.',
                  formula: '% Avance de Cronograma = (Tareas completadas del cronograma / Total de tareas planificadas) × 100',
                  req: 'Proyecto, Cronograma, Tarea, Fechas Planificadas/Reales, Estado de actividad, Responsable',
                  sem: 'Verde: >= 90% | Amarillo: >= 75% y < 90% | Rojo: < 75%',
                  inter: 'Representa el avance de cronograma del proyecto en base a las tareas completadas frente a lo planificado (Avance General).',
                  average: globalSummary.avgCronograma,
                  color: 'cyan',
                  icon: Calendar
                },
                {
                  id: 3,
                  title: 'Avance Físico Ponderado',
                  obj: 'Medir el avance real del proyecto según entregables completados por peso acordado por fase.',
                  formula: '% Avance Proyecto = Levantamiento (15%) + Diseño (20%) + Desarrollo (35%) + Pruebas (20%) + Puesta en prod (10%)',
                  req: 'Proyecto, Fase, Entregable, Peso de la fase, Estado, % avance entregable, Fecha Compromiso',
                  sem: 'Verde: real >= esperado | Amarillo: real 85%-99% del esperado | Rojo: real < 85%',
                  inter: 'Establece el progreso real físico entregado frente al avance cronológico previsto.',
                  average: globalSummary.avgAvance,
                  color: 'orange',
                  icon: Layers
                },
                {
                  id: 4,
                  title: 'Velocidad de Equipos Ágiles',
                  obj: 'Capacidad de entrega de valor del equipo de software en cada sprint.',
                  formula: 'Velocidad = Story Points completados | % Cumplimiento = (Story Points finalizados / Story Points comprometidos) × 100',
                  req: 'Proyecto, Equipo, Sprint, Historias de Usuario, Story Points Planificados/Terminados, Scrum Master',
                  sem: 'Verde: >= 90% | Amarillo: >= 75% y < 90% | Rojo: < 75%',
                  inter: 'Capacidad predictiva de entrega de valor iterativo del equipo ágil.',
                  average: globalSummary.avgVelocidad,
                  color: 'emerald',
                  icon: Zap
                },
                {
                  id: 5,
                  title: 'Calidad de Entregables',
                  obj: 'Controlar reprocesos, defectos y rechazos en pruebas ejecutadas por QA / UAT.',
                  formula: '% Calidad = (Entregables aprobados sin reproceso / Total de entregables revisados) × 100',
                  req: 'Proyecto, Sprint, Defectos, Gravedad de bug, Requiere reproceso?, Estado QA, Responsable',
                  sem: 'Verde: >= 90% | Amarillo: >= 75% y < 90% | Rojo: < 75%',
                  inter: 'Evalúa la salud técnica del software. Un bajo indicador advierte altos tiempos de corrección futura.',
                  average: globalSummary.avgCalidad,
                  color: 'teal',
                  icon: ShieldCheck
                },
                {
                  id: 6,
                  title: 'Días promedio de Desviación Base',
                  obj: 'Medir el desfase o desviación promedio en días del cronograma real de los proyectos frente a su línea base aprobada.',
                  formula: 'Desviación Base Promedio = Suma de (Días de retraso acumulados / Total de Proyectos Activos)',
                  req: 'Proyecto, Línea Base, Fecha Fin Real, Fecha Fin Planificada, Actividades',
                  sem: 'Verde: <= 3.0 d | Amarillo: > 3.0 d y <= 7.0 d | Rojo: > 7.0 d (Desviación crítica)',
                  inter: 'Muestra la desviación promedio respecto a la línea base original de cronograma. Un valor superior a 3 días requiere atención para evitar cuellos de botella.',
                  average: globalSummary.avgDesviacion,
                  suf: ' d',
                  color: 'rose',
                  icon: Clock
                }
              ].map((item: any) => {
                const Icon = item.icon;
                const isSelected = activeIndicatorInfo === item.id;
                return (
                  <div
                    key={item.id}
                    className={`border rounded-xl transition-all ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50/25 col-span-1 sm:col-span-2 lg:col-span-6 shadow-md'
                        : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50'
                    } p-4 cursor-pointer`}
                    onClick={() => setActiveIndicatorInfo(isSelected ? null : item.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-lg bg-white border border-slate-200`}>
                          <Icon className="w-4 h-4 text-slate-700" />
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-405 font-bold block font-mono">IND-0{item.id}</span>
                          <h4 className="text-xs font-extrabold text-slate-900 leading-tight">{item.title}</h4>
                        </div>
                      </div>
                      <ChevronRight className={`w-4 h-4 text-slate-400 transition-all ${isSelected ? 'rotate-90' : ''}`} />
                    </div>

                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="text-xl font-mono font-bold text-slate-950">
                        {item.id === 2 && item.average > 0 ? `+${item.average}` : item.average}{item.suf || '%'}
                      </span>
                      <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Consolidado</span>
                    </div>

                    {/* Progress slider mini */}
                    <div className="w-full bg-slate-200 h-1 mt-1.5 overflow-hidden">
                      <div className="h-full bg-slate-700" style={{ width: `${Math.min(100, Math.max(0, item.suf && item.suf.trim() === 'd' ? (item.average / 10) * 100 : Math.abs(item.average)))}%` }} />
                    </div>

                    {/* Expanded details */}
                    {isSelected && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-4 pt-4 border-t border-slate-200 space-y-3 text-xs text-slate-700"
                        onClick={e => e.stopPropagation()}
                      >
                        <div>
                          <strong className="text-slate-800 uppercase block text-[9px] tracking-wider mb-0.5">Objetivo Analítico:</strong>
                          <p className="leading-relaxed bg-white p-2 rounded border border-slate-200">{item.obj}</p>
                        </div>
                        <div>
                          <strong className="text-slate-800 uppercase block text-[9px] tracking-wider mb-0.5">Fórmula de Cálculo PMO:</strong>
                          <p className="font-mono bg-slate-950 text-indigo-300 p-2.5 rounded text-[10px] font-semibold leading-relaxed overflow-x-auto select-all">
                            {item.formula}
                          </p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <strong className="text-slate-800 uppercase block text-[9px] tracking-wider mb-0.5">Campos Requeridos de Tabla:</strong>
                            <p className="text-[11px] leading-relaxed italic">{item.req}</p>
                          </div>
                          <div>
                            <strong className="text-slate-800 uppercase block text-[9px] tracking-wider mb-0.5">Rangos de Semáforo:</strong>
                            <p className="text-[11px] leading-relaxed font-semibold text-slate-705">{item.sem}</p>
                          </div>
                        </div>
                        <div>
                          <strong className="text-slate-800 uppercase block text-[9px] tracking-wider mb-0.5">Interpretación en Operaciones:</strong>
                          <p className="leading-relaxed text-slate-600">{item.inter}</p>
                        </div>
                      </motion.div>
                    )}
                  </div>
                );
              })}
            </div>
            {activeIndicatorInfo === null && (
              <p className="text-[11px] text-slate-400 mt-3 text-right flex items-center justify-end gap-1 select-none">
                <Info className="w-3.5 h-3.5" /> Consejo de PMO: Clic en cualquiera de los bloques para ver la ficha técnica del indicador.
              </p>
            )}
          </div>



        </div>
      )}

      {/* =======================================================
          3B. OPERATIVE VIEW TAB
          ======================================================= */}
      {viewMode === 'operativa' && (
        <div className="space-y-6 animate-fadeIn">
          
          {/* Main operative selector */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <span className="text-[10px] font-bold uppercase py-0.5 px-2 bg-indigo-100 text-indigo-800 rounded font-mono">Control Detallado</span>
              <h3 className="font-extrabold text-slate-900 text-base mt-1">
                Monitoreo Detallado por Proyecto Individual
              </h3>
              <p className="text-xs text-slate-500">Seleccione el proyecto para ver su rendimiento en gantt, presupuestos de fases, velocidad de sprints y QA.</p>
            </div>

            <div className="w-full sm:w-72">
              <select
                value={operDetailProjId}
                onChange={e => setOperDetailProjId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 py-2 px-3 rounded-xl text-xs text-slate-900 outline-none focus:ring-1 focus:ring-indigo-500 font-extrabold shadow-inner"
              >
                {enrichedProjects.map(p => (
                  <option key={p.id} value={p.id}>
                    [{p.code}] {p.NombreProyecto}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* PROJECT DETAIL METRICS WRAP */}
          {selectedOperProjectDetail ? (
            <div className="space-y-6">
              
              {/* Top info card of the selected project */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 grid grid-cols-1 md:grid-cols-5 gap-4">
                
                <div>
                  <span className="text-[9px] text-indigo-600 font-extrabold uppercase font-mono tracking-widest block mb-0.5">Estado Ciclo de Vida:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900 uppercase">{selectedOperProjectDetail.EstadoProyecto}</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-1">Líder: Ing. {selectedOperProjectDetail.LíderProyecto}</span>
                </div>

                <div>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mb-0.5">Presupuesto Aprobado:</span>
                  <h4 className="text-lg font-mono font-extrabold text-slate-950">
                    ${selectedOperProjectDetail.PresupuestoAprobado.toLocaleString('en-US')} USD
                  </h4>
                  <span className="text-[10px] text-slate-550 block mt-1">Real Acumulado: ${Math.round(selectedOperProjectDetail.CostoRealAcumulado).toLocaleString('en-US')} USD</span>
                </div>

                <div>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mb-0.5">Área Solicitante:</span>
                  <span className="text-xs font-semibold text-slate-800 block mt-0.5">
                    {selectedOperProjectDetail.ÁreaSolicitante}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-1">Cliente: {selectedOperProjectDetail.Compañía}</span>
                </div>

                <div>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mb-0.5">Desviación Base:</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className={`text-base font-mono font-black ${
                      selectedOperProjectDetail.desviacionBaseDays > 3
                        ? selectedOperProjectDetail.desviacionBaseDays > 7 ? 'text-rose-600' : 'text-amber-600'
                        : 'text-emerald-600'
                    }`}>
                      {selectedOperProjectDetail.desviacionBaseDays} días
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-1">atraso vs. LB aprobada</span>
                </div>

                <div>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mb-0.5">Semaforización Riesgo:</span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className={`inline-flex items-center gap-1 px-3 py-1 text-[11px] font-black uppercase rounded-lg border ${
                      selectedOperProjectDetail.RiesgoGeneral === 'Verde'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : selectedOperProjectDetail.RiesgoGeneral === 'Amarillo'
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : 'bg-rose-50 text-rose-800 border-rose-200'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        selectedOperProjectDetail.RiesgoGeneral === 'Verde' ? 'bg-emerald-500' : selectedOperProjectDetail.RiesgoGeneral === 'Amarillo' ? 'bg-amber-500' : 'bg-rose-500'
                      }`} />
                      Riesgo: {selectedOperProjectDetail.RiesgoGeneral}
                    </span>
                  </div>
                </div>

              </div>

              {/* THREE DIMENTIONAL OPERATIVE SPLIT (Cronograma, Presupuesto, Agilismo) */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

                {/* 1. CICLOS DE ENTREGA ÁGIL (Sprints del Proyecto) */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs md:col-span-7 space-y-4">
                  <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                        <Zap className="w-4.5 h-4.5 text-indigo-600" /> 1. Ciclos de Entrega Ágil (Sprints del Proyecto)
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Historial de sprints, objetivos de negocio e historias de usuario comprometidas.
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 uppercase block font-bold">Velocidad Promedio:</span>
                      <span className="text-sm font-mono font-bold text-indigo-600">
                        {selectedOperProjectDetail.sprintCumplimientoPoints}%
                      </span>
                    </div>
                  </div>

                  {/* Sprints Display */}
                  <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
                    {(() => {
                      // Filter sprints for selected project
                      let projectSprints = sprints.filter(s => s.project_id === selectedOperProjectDetail.id);

                      // If no sprints exist in database for this project, provide beautiful, highly detailed fallback sprints
                      if (projectSprints.length === 0) {
                        const start = new Date(selectedOperProjectDetail.FechaInicioPlanificada || '2026-05-15');
                        const formatOffsetDate = (offsetDays: number) => {
                          const d = new Date(start);
                          d.setDate(d.getDate() + offsetDays);
                          return d.toISOString().split('T')[0];
                        };

                        projectSprints = [
                          {
                            id: `fallback-sprint-1-${selectedOperProjectDetail.id}`,
                            project_id: selectedOperProjectDetail.id,
                            name: 'Sprint 1: Cimentación e Infraestructura',
                            goal: 'Configurar bases de datos relacionales, montar pipeline CI/CD en la nube y diseñar modelo de datos principal.',
                            start_date: formatOffsetDate(0),
                            end_date: formatOffsetDate(14),
                            status: 'FINALIZADO',
                            velocity: 28,
                            capacity: 30
                          },
                          {
                            id: `fallback-sprint-2-${selectedOperProjectDetail.id}`,
                            project_id: selectedOperProjectDetail.id,
                            name: 'Sprint 2: Integraciones y Core API',
                            goal: 'Construir pasarela de pagos, flujos de autenticación OAuth 2.0 y servicios del dominio de negocio principal.',
                            start_date: formatOffsetDate(15),
                            end_date: formatOffsetDate(29),
                            status: 'EN_CURSO',
                            velocity: 24,
                            capacity: 32
                          },
                          {
                            id: `fallback-sprint-3-${selectedOperProjectDetail.id}`,
                            project_id: selectedOperProjectDetail.id,
                            name: 'Sprint 3: Frontend y Despliegue',
                            goal: 'Desarrollar vistas adaptativas, optimizar caché de consultas y ejecutar planes de pruebas integrales UAT.',
                            start_date: formatOffsetDate(30),
                            end_date: formatOffsetDate(44),
                            status: 'NO_INICIADO',
                            velocity: 0,
                            capacity: 25
                          }
                        ];
                      }

                      return projectSprints.map((sprint, sprintIdx) => {
                        // Gather sprint items from workItems
                        const sprintWorkItems = workItems.filter(w => w.sprint_id === sprint.id);
                        
                        // Calculate metrics
                        const totalPoints = sprint.capacity || 30;
                        const completedPoints = sprint.status === 'FINALIZADO' 
                          ? (sprint.velocity || sprint.capacity)
                          : sprint.status === 'EN_CURSO'
                          ? Math.round(sprint.capacity * 0.65)
                          : 0;

                        const percent = sprint.status === 'FINALIZADO' 
                          ? 100 
                          : sprint.status === 'EN_CURSO' 
                          ? Math.round((completedPoints / totalPoints) * 100) 
                          : 0;

                        // Status Badge styling
                        let badgeClass = "bg-slate-100 text-slate-700 border-slate-200";
                        if (sprint.status === 'FINALIZADO') {
                          badgeClass = "bg-emerald-50 text-emerald-800 border-emerald-250";
                        } else if (sprint.status === 'EN_CURSO') {
                          badgeClass = "bg-indigo-55 text-indigo-800 border-indigo-200 animate-pulse";
                        }

                        return (
                          <div
                            key={sprint.id}
                            className={`p-4 rounded-xl border transition-all ${
                              sprint.status === 'EN_CURSO'
                                ? 'border-indigo-200 bg-indigo-50/20 shadow-xs'
                                : 'border-slate-150 bg-slate-50/10'
                            }`}
                          >
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2">
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded border ${badgeClass}`}>
                                    {sprint.status}
                                  </span>
                                  <span className="text-[10px] text-slate-450 font-mono font-bold">
                                    {sprint.start_date} al {sprint.end_date}
                                  </span>
                                </div>
                                <h5 className="font-extrabold text-slate-900 text-xs mt-1">
                                  {sprint.name}
                                </h5>
                              </div>

                              <div className="text-right">
                                <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">
                                  Story Points:
                                </span>
                                <span className="text-xs font-mono font-extrabold text-slate-800">
                                  {completedPoints} / {totalPoints} SP ({percent}%)
                                </span>
                              </div>
                            </div>

                            <p className="text-[11px] leading-relaxed text-slate-650 bg-white/70 border border-slate-150/50 p-2.5 rounded-lg mt-2">
                              <strong className="text-slate-800 font-extrabold block text-[9px] uppercase tracking-wide mb-0.5">Objetivo / Meta del Sprint:</strong>
                              {sprint.goal || 'No se ha definido meta explícita para este sprint.'}
                            </p>

                            {/* Progress bar */}
                            <div className="mt-3 space-y-1">
                              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    sprint.status === 'FINALIZADO'
                                      ? 'bg-emerald-500'
                                      : sprint.status === 'EN_CURSO'
                                      ? 'bg-indigo-600'
                                      : 'bg-slate-300'
                                  }`}
                                  style={{ width: `${percent}%` }}
                                />
                              </div>
                            </div>

                            {/* Associated tasks / user stories */}
                            {sprintWorkItems.length > 0 && (
                              <div className="mt-3 pt-3 border-t border-dashed border-slate-200 space-y-1.5">
                                <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest block mb-1">
                                  Historias de Usuario comprometidas:
                                </span>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  {sprintWorkItems.map((wi) => (
                                    <div key={wi.id} className="bg-white border border-slate-150 p-2 rounded-lg text-[10px] flex justify-between items-center">
                                      <div className="min-w-0 pr-2">
                                        <span className="font-mono text-[8px] bg-slate-100 px-1 py-0.2 rounded font-extrabold text-slate-500 block w-max mb-0.5">
                                          {wi.key || 'US-ID'}
                                        </span>
                                        <span className="font-bold text-slate-700 truncate block" title={wi.title}>
                                          {wi.title}
                                        </span>
                                      </div>
                                      <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded border shrink-0 ${
                                        wi.status === 'FINALIZADO'
                                          ? 'bg-emerald-50 text-emerald-800 border-emerald-100'
                                          : wi.status === 'QA'
                                          ? 'bg-amber-50 text-amber-800 border-amber-100'
                                          : 'bg-slate-50 text-slate-600 border-slate-200'
                                      }`}>
                                        {wi.status}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>

                {/* 2. PRESUPUESTO & COST CONTROL (Right 5-span) */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs md:col-span-5 space-y-4 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4 font-sans">
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                          <DollarSign className="w-4.5 h-4.5 text-indigo-600" /> 2. Costos & Presupuestos
                        </h4>
                        <p className="text-[11px] text-slate-500 font-sans">Comparativa con la línea base para control de sobrecostos.</p>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 uppercase block font-bold">Consumo:</span>
                        <span className={`text-sm font-mono font-bold ${
                          selectedOperProjectDetail.percentConsumoPresupuesto > 100 ? 'text-rose-600' : selectedOperProjectDetail.percentConsumoPresupuesto > 80 ? 'text-amber-500' : 'text-emerald-600'
                        }`}>
                          {selectedOperProjectDetail.percentConsumoPresupuesto}%
                        </span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-xs font-semibold mb-1">
                          <span className="text-slate-600">Presupuesto Ejecutado Real:</span>
                          <span className="text-slate-900 font-bold font-mono">
                            ${Math.round(selectedOperProjectDetail.CostoRealAcumulado).toLocaleString('en-US')} USD
                          </span>
                        </div>
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-slate-600 text-[11px]">Proporción del fondo de ${selectedOperProjectDetail.PresupuestoAprobado.toLocaleString('en-US')} USD:</span>
                          <span className="text-slate-900 font-extrabold font-mono text-[11px]">
                            {Math.round((selectedOperProjectDetail.CostoRealAcumulado / selectedOperProjectDetail.PresupuestoAprobado) * 100)}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 h-3 rounded-full mt-2 overflow-hidden border border-slate-200/50">
                          <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${Math.min(100, (selectedOperProjectDetail.CostoRealAcumulado / selectedOperProjectDetail.PresupuestoAprobado) * 100)}%` }} />
                        </div>
                      </div>

                      <div className="pt-4 border-t border-slate-100 space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                        <h5 className="text-[10px] text-slate-505 font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-indigo-500" /> 3. Avance de Cronograma General
                        </h5>
                        {selectedProjectModules.length > 0 ? (
                          selectedProjectModules.map((mod) => {
                            let barColor = 'bg-indigo-600';
                            if (mod.status === 'COMPLETADA') {
                              barColor = 'bg-emerald-500';
                            } else if (mod.status === 'BLOQUEADO') {
                              barColor = 'bg-rose-500';
                            } else if (mod.status === 'EN_CURSO') {
                              barColor = 'bg-sky-500';
                            }

                            return (
                              <div key={mod.id} className="space-y-1.5 text-xs bg-slate-50/40 p-2.5 rounded-xl border border-slate-150/50">
                                <div className="flex justify-between items-start gap-2">
                                  <div className="space-y-0.5">
                                    <span className="text-[8px] font-mono font-bold bg-slate-200/80 text-slate-650 px-1 py-0.2 rounded">
                                      MÓDULO
                                    </span>
                                    <h6 className="font-bold text-slate-800 leading-tight text-[11px] mt-0.5">
                                      {mod.name}
                                    </h6>
                                    <div className="flex items-center gap-1.5 text-[9px] text-slate-450 mt-0.5 font-mono">
                                      <span>{mod.startDate} al {mod.endDate}</span>
                                      <span>•</span>
                                      <span>{mod.durationDays}d</span>
                                    </div>
                                  </div>
                                  <div className="text-right shrink-0">
                                    <span className="font-mono font-extrabold text-slate-900 text-xs">
                                      {mod.progress}%
                                    </span>
                                    <span className={`text-[8px] font-extrabold block px-1.5 py-0.5 rounded uppercase mt-0.5 ${
                                      mod.status === 'COMPLETADA'
                                        ? 'bg-emerald-50 text-emerald-850 border border-emerald-150'
                                        : mod.status === 'EN_CURSO'
                                        ? 'bg-indigo-50 text-indigo-850 border border-indigo-150'
                                        : mod.status === 'BLOQUEADO'
                                        ? 'bg-rose-50 text-rose-850 border border-rose-150'
                                        : 'bg-slate-100 text-slate-650 border border-slate-200'
                                    }`}>
                                      {mod.status}
                                    </span>
                                  </div>
                                </div>
                                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1">
                                  <div className={`h-full rounded-full ${barColor}`} style={{ width: `${mod.progress}%` }} />
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <p className="text-[11px] text-slate-455 italic text-center py-4 border border-dashed rounded-lg border-slate-200">
                            No se encontraron módulos de cronograma para este proyecto.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    <span className="font-bold uppercase tracking-wide text-slate-600">Avance Físico Consolidado:</span>
                    <span className="font-extrabold text-indigo-700 font-mono text-xs">{selectedOperProjectDetail.percentAvanceFisico}%</span>
                  </div>
                </div>

              </div>

              {/* SECTION: ACTIVIDADES VENCIDAS */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-slate-100 gap-4">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-rose-500 animate-pulse" /> Monitoreo de Actividades Vencidas (Tareas, Subtareas, Subsubtareas)
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Control detallado de los requerimientos que han superado su fecha de finalización planificada sin completarse.
                    </p>
                  </div>

                  {/* Mini state selector / filter inside this card */}
                  <div className="flex items-center gap-1.5 self-stretch sm:self-auto overflow-x-auto pb-1 sm:pb-0">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mr-1.5 hidden md:inline">Nivel:</span>
                    {(['ALL', 'TAREA', 'SUBTAREA', 'SUBSUBTAREA'] as const).map((lvl) => (
                      <button
                        key={lvl}
                        onClick={() => setOverdueLevelFilter(lvl)}
                        className={`px-2.5 py-1 text-[10px] font-black uppercase rounded-lg border transition-all cursor-pointer whitespace-nowrap ${
                          overdueLevelFilter === lvl
                            ? 'bg-rose-500 text-white border-rose-500 shadow-sm'
                            : 'bg-slate-50 text-slate-650 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {lvl === 'ALL' ? 'Todos' : lvl}
                      </button>
                    ))}
                  </div>
                </div>

                {/* List wrapper */}
                {selectedProjectOverdueActivities.length > 0 ? (
                  (() => {
                    // Filter overdue activities based on overdueLevelFilter
                    const filteredOverdue = selectedProjectOverdueActivities.filter(
                      item => overdueLevelFilter === 'ALL' || item.level === overdueLevelFilter
                    );

                    if (filteredOverdue.length === 0) {
                      return (
                        <div className="text-center py-8 bg-slate-50 border border-dashed rounded-xl border-slate-200">
                          <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                          <p className="text-xs text-slate-650 font-bold">Sin coincidencias para el nivel seleccionado.</p>
                          <p className="text-[10px] text-slate-450 mt-1">Intente cambiar el filtro de nivel.</p>
                        </div>
                      );
                    }

                    return (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[450px] overflow-y-auto pr-1">
                        {filteredOverdue.map((item) => {
                          // Get assigned user
                          const userAssigned = users.find(u => u.id === item.assignedToId);
                          const assigneeName = userAssigned ? `${userAssigned.first_name} ${userAssigned.last_name}` : 'Sin asignar';
                          const assigneeRole = userAssigned ? userAssigned.role : 'N/A';
                          const assigneeAvatar = userAssigned ? userAssigned.avatar_url : null;

                          // Calculate how many days has passed since endDate
                          const daysPassed = (() => {
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            const end = new Date(item.endDate);
                            end.setHours(0, 0, 0, 0);
                            const diffMs = today.getTime() - end.getTime();
                            return Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
                          })();

                          // Priority badge styling
                          let priorityClass = 'bg-slate-100 text-slate-600 border-slate-200';
                          if (item.priority === 'ALTA') {
                            priorityClass = 'bg-rose-50 text-rose-700 border-rose-200';
                          } else if (item.priority === 'MEDIA') {
                            priorityClass = 'bg-amber-50 text-amber-700 border-amber-200';
                          }

                          // Status badge styling
                          let statusClass = 'bg-slate-100 text-slate-600 border-slate-200';
                          if (item.status === 'BLOQUEADO') {
                            statusClass = 'bg-rose-500 text-white border-rose-600 font-extrabold';
                          } else if (item.status === 'EN_CURSO') {
                            statusClass = 'bg-sky-50 text-sky-700 border-sky-200';
                          }

                          // Level indicator classes
                          let levelBadgeClass = 'bg-purple-50 text-purple-700 border-purple-200';
                          if (item.level === 'SUBTAREA') {
                            levelBadgeClass = 'bg-blue-50 text-blue-700 border-blue-200';
                          } else if (item.level === 'SUBSUBTAREA') {
                            levelBadgeClass = 'bg-teal-50 text-teal-700 border-teal-200';
                          }

                          return (
                            <div key={item.id} className="bg-slate-50/50 border border-slate-150 rounded-xl p-4 flex flex-col justify-between gap-3 hover:shadow-xs transition duration-150">
                              <div className="space-y-1.5">
                                <div className="flex justify-between items-start gap-2">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className={`text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded border ${levelBadgeClass}`}>
                                      {item.level}
                                    </span>
                                    <span className={`text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded border ${priorityClass}`}>
                                      {item.priority}
                                    </span>
                                  </div>
                                  <span className="text-[10px] font-mono font-bold text-rose-600 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                                    {daysPassed} {daysPassed === 1 ? 'día' : 'días'} de retraso
                                  </span>
                                </div>

                                <h5 className="font-extrabold text-slate-800 text-xs leading-tight">
                                  {item.name}
                                </h5>

                                <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-450 font-mono py-1.5 border-y border-dashed border-slate-200/60">
                                  <div>
                                    <span className="text-slate-400 block text-[8px] font-bold uppercase">Plazo Planificado:</span>
                                    <span className="font-bold text-slate-700">{item.startDate} al {item.endDate}</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-400 block text-[8px] font-bold uppercase">Duración:</span>
                                    <span className="font-bold text-slate-700">{item.durationDays} días</span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex justify-between items-center gap-2 pt-1">
                                {/* Responsable */}
                                <div className="flex items-center gap-2 min-w-0">
                                  {assigneeAvatar ? (
                                    <img
                                      src={assigneeAvatar}
                                      alt={assigneeName}
                                      referrerPolicy="no-referrer"
                                      className="w-6 h-6 rounded-full border border-slate-200 object-cover shrink-0"
                                    />
                                  ) : (
                                    <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200 flex items-center justify-center font-black text-[9px] uppercase tracking-tighter shrink-0 font-mono">
                                      {assigneeName.slice(0, 2)}
                                    </div>
                                  )}
                                  <div className="min-w-0">
                                    <span className="text-[10px] font-extrabold text-slate-700 block truncate leading-tight">
                                      {assigneeName}
                                    </span>
                                    <span className="text-[8px] text-slate-400 block truncate font-mono">
                                      {assigneeRole}
                                    </span>
                                  </div>
                                </div>

                                {/* Progress / Status */}
                                <div className="text-right shrink-0">
                                  <div className="flex items-center gap-1.5 justify-end">
                                    <span className="text-[9px] font-mono font-extrabold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                      {item.progress}%
                                    </span>
                                    <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded border ${statusClass}`}>
                                      {item.status}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Progress bar */}
                              <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden">
                                <div className="h-full bg-rose-500 rounded-full" style={{ width: `${item.progress}%` }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()
                ) : (
                  <div className="text-center py-10 bg-emerald-50/50 border border-dashed rounded-2xl border-emerald-200 p-6">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mb-3 shadow-xs">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <h5 className="text-xs font-black text-emerald-950 uppercase tracking-wide">¡Todo al día y controlado!</h5>
                    <p className="text-[11px] text-emerald-700 max-w-md mx-auto mt-1">
                      No se registran actividades vencidas de ningún nivel para este proyecto. El cronograma de ejecución avanza de acuerdo a lo planificado.
                    </p>
                  </div>
                )}
              </div>

              {/* SECTION: AGILISMO & QUALITY COMPILATION */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* 4. AGILISMO & VELOCITY (Left side) */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
                  <div className="flex justify-between items-center pb-3 border-b border-slate-200">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                        <Zap className="w-4.5 h-4.5 text-indigo-600" /> 4. Velocidad del Sprint & Scrum Control
                      </h4>
                      <p className="text-[11px] text-slate-505">Rendimiento de velocidad y puntos estimados cumplidos por iteración.</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 uppercase block font-bold">Cumplimiento Sprint:</span>
                      <span className="text-sm font-mono font-bold text-indigo-600">{selectedOperProjectDetail.sprintCumplimientoPoints}%</span>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-4 flex flex-col sm:flex-row items-center gap-5">
                    {/* Big graphical radial meter */}
                    <div className="relative w-28 h-28 flex items-center justify-center bg-white rounded-full border border-slate-100 shadow-inner">
                      <svg className="absolute w-full h-full transform -rotate-90">
                        <circle cx="56" cy="56" r="48" stroke="#f1f5f9" strokeWidth="8" fill="transparent" />
                        <circle cx="56" cy="56" r="48" stroke="#4f46e5" strokeWidth="8" fill="transparent"
                                strokeDasharray={2 * Math.PI * 48}
                                strokeDashoffset={2 * Math.PI * 48 * (1 - selectedOperProjectDetail.sprintCumplimientoPoints / 100)}
                        />
                      </svg>
                      <div className="text-center">
                        <span className="text-lg font-black text-slate-900">{selectedOperProjectDetail.sprintCumplimientoPoints}%</span>
                        <span className="text-[8px] text-slate-400 uppercase tracking-widest font-black block mt-0.5">Meta</span>
                      </div>
                    </div>

                    <div className="space-y-2 text-xs flex-1">
                      <div className="flex justify-between leading-snug">
                        <span className="text-slate-650 font-medium">Story Points Planificados:</span>
                        <strong className="text-slate-900 font-mono">{selectedOperProjectDetail.committedPoints} pts</strong>
                      </div>
                      <div className="flex justify-between leading-snug">
                        <span className="text-slate-650 font-medium">Story Points Completados:</span>
                        <strong className="text-emerald-600 font-mono">{selectedOperProjectDetail.completedPoints} pts</strong>
                      </div>
                      <div className="flex justify-between leading-snug">
                        <span className="text-slate-650 font-medium">Story Points No Completados:</span>
                        <strong className="text-rose-600 font-mono">
                          {Math.max(0, selectedOperProjectDetail.committedPoints - selectedOperProjectDetail.completedPoints)} pts
                        </strong>
                      </div>
                      <p className="text-[11px] text-slate-500 italic border-t border-slate-200 pt-2 block">
                        Gestionado bajo supervisión del Scrum Master asignado para la iteración ágil activa.
                      </p>
                    </div>
                  </div>
                </div>

                {/* 5. CALIDAD DE ENTREGABLES & QA DEFECTS */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
                  <div className="flex justify-between items-center pb-3 border-b border-slate-200">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                        <Bug className="w-4.5 h-4.5 text-rose-500" /> 5. Calidad de Entregables & Salud QA
                      </h4>
                      <p className="text-[11px] text-slate-500">Métricas analíticas de reprocesos, historias rechazadas y densidad de defectos.</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 uppercase block font-bold">Calidad Score:</span>
                      <span className="text-sm font-mono font-bold text-emerald-600">{selectedOperProjectDetail.percentCalidad}%</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    
                    {/* Stat 1: Defectos */}
                    <div className="bg-slate-50 p-3 rounded-xl text-center border border-slate-150">
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wide font-sans">Defectos QA</span>
                      <h5 className="text-2xl font-black text-rose-600 font-mono mt-1">
                        {selectedOperProjectDetail.defectsCount}
                      </h5>
                      <span className="text-[10px] text-slate-500 block leading-tight mt-1">fallas detectadas</span>
                    </div>

                    {/* Stat 2: Requiere reproceso */}
                    <div className="bg-slate-50 p-3 rounded-xl text-center border border-slate-150">
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wide font-sans">Reprocesos</span>
                      <h5 className="text-2xl font-black text-amber-600 font-mono mt-1">
                        {selectedOperProjectDetail.reprocesosCount}
                      </h5>
                      <span className="text-[10px] text-slate-500 block leading-tight mt-1">reabiertos</span>
                    </div>

                    {/* Stat 3: Densidad de defectos */}
                    <div className="bg-slate-50 p-3 rounded-xl text-center border border-slate-150">
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wide font-sans">Densidad Defectos</span>
                      <h5 className="text-2xl font-black text-indigo-700 font-mono mt-1">
                        {(selectedOperProjectDetail.defectsCount / 3).toFixed(1)}
                      </h5>
                      <span className="text-[10px] text-slate-500 block leading-tight mt-1">bugs / entregables</span>
                    </div>

                  </div>

                  <p className="text-[11px] text-slate-500 italic bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-center block">
                    Porcentaje de calidad medido bajo: <strong>% Calidad Entregables = (Aprobados sin reproceso / Total revisados) × 100</strong>.
                  </p>
                </div>

              </div>

            </div>
          ) : (
            <p className="text-slate-405 text-center font-bold italic py-10 border border-dashed rounded-xl border-slate-300">
              Cargue o seleccione un proyecto para visualizar el desglose operativo.
            </p>
          )}

        </div>
      )}

      {/* FOOTER AUDITING */}
      <div className="bg-slate-900 border border-slate-800 text-slate-400 p-4 rounded-xl flex flex-col sm:flex-row justify-between items-center text-[10px] tracking-wide uppercase font-mono">
        <span>GCP Integrated Control Platform • PMO Systems v3.4 • Autor: Alex Castro</span>
        <span className="text-indigo-400 py-1 sm:py-0">Aseguramiento de Calidad y Gobierno Ágil</span>
      </div>
    </div>
  );
}
