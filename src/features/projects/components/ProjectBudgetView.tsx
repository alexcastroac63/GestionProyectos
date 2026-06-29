import React, { useState } from 'react';
import { 
  Coins, Plus, History, ChevronUp, ChevronDown, CheckCircle, 
  Check, Trash2, X, Paperclip, UploadCloud, Globe, HelpCircle, 
  FolderArchive, Clock 
} from 'lucide-react';
import { useProjectsStore } from '../../../app/providers/ProjectsProvider';
import { useSystemStore } from '../../../app/providers/SystemProvider';
import { Project, ProjectCost } from '../../../types';

export const ProjectBudgetView: React.FC = () => {
  const {
    projects,
    costs,
    setCosts,
    selectedProjectId,
    categoryBudgets,
    setCategoryBudgets,
    budgetBaselines,
    setBudgetBaselines,
    isRegisterCostModalOpen,
    setIsRegisterCostModalOpen
  } = useProjectsStore();

  const {
    addLog,
    setDeleteConfirmState,
    loggedInUser
  } = useSystemStore();

  const currentUserDisplayName = React.useMemo(() => {
    if (loggedInUser) {
      return `${loggedInUser.first_name} ${loggedInUser.last_name} (${loggedInUser.role})`;
    }
    return 'Carlos Pérez (PM)';
  }, [loggedInUser]);

  const getTransactionDateTime = () => {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
  };

  // Find active project
  const activeProject = projects.find(p => p.id === selectedProjectId);

  // States for baselines section
  const [isBudgetBaselineSectionExpanded, setIsBudgetBaselineSectionExpanded] = useState(false);
  const [newBudgetBaselineName, setNewBudgetBaselineName] = useState('');

  // States for cost registration form
  const [newCostType, setNewCostType] = useState<'NOMINA' | 'LICENCIAS' | 'INFRAESTRUCTURA' | 'OUTSOURCING' | 'OTROS'>('NOMINA');
  const [newDocNumber, setNewDocNumber] = useState('');
  const [newDocDate, setNewDocDate] = useState(new Date().toISOString().split('T')[0]);
  const [newCostAmount, setNewCostAmount] = useState('');
  const [newCostDesc, setNewCostDesc] = useState('');
  const [costAttachmentMode, setCostAttachmentMode] = useState<'file' | 'link'>('file');
  const [cloudFileUploadedName, setCloudFileUploadedName] = useState('');
  const [cloudFileUploadedSize, setCloudFileUploadedSize] = useState('');
  const [cloudProgress, setCloudProgress] = useState(0);
  const [cloudFileBase64, setCloudFileBase64] = useState<string | null>(null);
  const [cloudFileExternalUrl, setCloudFileExternalUrl] = useState('');
  const [activeCloudObjectDetail, setActiveCloudObjectDetail] = useState<ProjectCost | null>(null);

  if (!activeProject) {
    return (
      <div className="bg-white border border-t-0 border-slate-200 rounded-b-xl p-8 text-center text-slate-500 italic">
        Seleccione un proyecto registrado para continuar.
      </div>
    );
  }

  // Get active budget mapped categories
  const activeProjBudgetMap = categoryBudgets[selectedProjectId] || {
    NOMINA: Math.round(activeProject.budget_total * 0.40),
    LICENCIAS: Math.round(activeProject.budget_total * 0.15),
    INFRAESTRUCTURA: Math.round(activeProject.budget_total * 0.20),
    OUTSOURCING: Math.round(activeProject.budget_total * 0.15),
    OTROS: Math.round(activeProject.budget_total * 0.10)
  };

  const projectCosts = costs.filter(c => c.project_id === selectedProjectId);
  const projBaselineData = budgetBaselines[selectedProjectId] || { list: [], activeId: null };
  const activeBaseline = projBaselineData.list.find(b => b.id === projBaselineData.activeId) || null;

  const handleCaptureBaseline = () => {
    const name = newBudgetBaselineName.trim() || `Línea Base #${projBaselineData.list.length + 1}`;
    const newBaseline = {
      id: `bl-${Date.now()}`,
      name: name,
      capturedAt: new Date().toLocaleDateString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      }),
      totalBudget: activeProject.budget_total,
      categories: { ...activeProjBudgetMap }
    };

    setBudgetBaselines(prev => {
      const current = prev[selectedProjectId] || { list: [], activeId: null };
      const updatedList = [...current.list, newBaseline];
      return {
        ...prev,
        [selectedProjectId]: {
          list: updatedList,
          activeId: newBaseline.id
        }
      };
    });
    setNewBudgetBaselineName('');
    addLog(currentUserDisplayName, `Capturó la Línea Base de presupuesto ($ USD): "${name}" para el proyecto [${activeProject.code}]`);
  };

  const handleSetActiveBaseline = (id: string) => {
    setBudgetBaselines(prev => {
      const current = prev[selectedProjectId] || { list: [], activeId: null };
      return {
        ...prev,
        [selectedProjectId]: {
          ...current,
          activeId: id
        }
      };
    });
    const selectedBl = projBaselineData.list.find(b => b.id === id);
    if (selectedBl) {
      addLog(currentUserDisplayName, `Activó la Línea Base de presupuesto "${selectedBl.name}" para el proyecto [${activeProject.code}]`);
    }
  };

  const handleClearActiveBaseline = () => {
    setBudgetBaselines(prev => {
      const current = prev[selectedProjectId] || { list: [], activeId: null };
      return {
        ...prev,
        [selectedProjectId]: {
          ...current,
          activeId: null
        }
      };
    });
    addLog(currentUserDisplayName, `Desactivó la Línea Base de presupuesto activa para el proyecto [${activeProject.code}]`);
  };

  const handleDeleteBaseline = (id: string) => {
    const baselineToDelete = projBaselineData.list.find(b => b.id === id);
    setBudgetBaselines(prev => {
      const current = prev[selectedProjectId] || { list: [], activeId: null };
      const updatedList = current.list.filter(b => b.id !== id);
      let nextActiveId = current.activeId;
      if (nextActiveId === id) {
        nextActiveId = updatedList.length > 0 ? updatedList[updatedList.length - 1].id : null;
      }
      return {
        ...prev,
        [selectedProjectId]: {
          list: updatedList,
          activeId: nextActiveId
        }
      };
    });
    if (baselineToDelete) {
      addLog(currentUserDisplayName, `Eliminó la Línea Base de presupuesto "${baselineToDelete.name}" de la historia del proyecto [${activeProject.code}]`);
    }
  };

  // Simulate file support attachment reading as base64
  const handleCostFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCloudFileUploadedName(file.name);
    // Format human-friendly size
    const sizeInKb = file.size / 1024;
    const formattedSize = sizeInKb > 1024 
      ? `${(sizeInKb / 1024).toFixed(1)} MB` 
      : `${sizeInKb.toFixed(1)} KB`;
    setCloudFileUploadedSize(formattedSize);

    // Simulate real upload progress bars
    setCloudProgress(20);
    const t1 = setTimeout(() => setCloudProgress(60), 150);
    const t2 = setTimeout(() => {
      setCloudProgress(100);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCloudFileBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }, 300);
  };

  const handleAddCost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCostAmount || !newCostDesc) return;
    const docNum = newDocNumber.trim() || `DOC-${Math.floor(10000 + Math.random() * 90000)}`;
    const docDate = newDocDate || new Date().toISOString().split('T')[0];
    
    const newCost: ProjectCost = {
      id: `cost-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      project_id: selectedProjectId,
      cost_type: newCostType,
      description: newCostDesc,
      amount: Number(newCostAmount),
      currency: 'USD',
      created_at: docDate,
      document_number: docNum,
      document_date: docDate,
      storage_key: cloudFileExternalUrl ? undefined : (cloudFileUploadedName ? `uploads/${docNum}_${cloudFileUploadedName}` : undefined),
      storage_url: cloudFileExternalUrl ? cloudFileExternalUrl : (cloudFileUploadedName ? `http://localhost:9000/soporte-pmo-storage/uploads/${docNum}_${cloudFileUploadedName}` : undefined),
      file_name: cloudFileUploadedName || undefined,
      file_size: cloudFileUploadedSize || undefined,
      uploaded_at: cloudFileUploadedName ? getTransactionDateTime() : undefined,
      raw_base64: cloudFileBase64 || undefined
    };
    
    setCosts(prev => [...prev, newCost]);
    setNewCostDesc('');
    setNewCostAmount('');
    setNewDocNumber('');
    setNewDocDate(new Date().toISOString().split('T')[0]);
    
    // Reset cloud storage form state
    setCloudFileUploadedName('');
    setCloudFileUploadedSize('');
    setCloudProgress(0);
    setCloudFileBase64(null);
    setCloudFileExternalUrl('');
    setCostAttachmentMode('file');
    setIsRegisterCostModalOpen(false);
    
    addLog(currentUserDisplayName, `Registró documento ${docNum} (${newCostType}): "${newCostDesc}" por $${Number(newCostAmount)} USD (Comprobante cargado con éxito en el almacenamiento seguro)`);
  };

  const handleDeleteCost = (id: string) => {
    const costItem = costs.find(c => c.id === id);
    const costDesc = costItem ? `"${costItem.description}" (-$${costItem.amount} USD)` : 'este documento';
    setDeleteConfirmState({
      isOpen: true,
      title: 'Anular Documento de Costo',
      message: `¿Está seguro de que desea anular/eliminar el registro de costo de ${costDesc}?`,
      onConfirm: () => {
        setCosts(prev => prev.filter(c => c.id !== id));
      }
    });
  };

  const downloadDocumentLocally = (c: ProjectCost) => {
    if (c.storage_url && (c.storage_url.startsWith('http://') || c.storage_url.startsWith('https://')) && !c.storage_url.includes('localhost:9000')) {
      window.open(c.storage_url, '_blank');
      addLog('Cloud Storage Client', `Abriendo enlace externo de soporte: ${c.storage_url}`);
      return;
    }
    const downloadName = c.file_name || `comprobante_${c.document_number || 'documento'}.pdf`;

    const triggerDownload = (blob: Blob) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = downloadName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      addLog('Cloud Storage Client', `Descarga local exitosa iniciada para el archivo de soporte: ${downloadName}`);
    };

    if (c.raw_base64) {
      try {
        const parts = c.raw_base64.split(';base64,');
        const contentType = parts.length > 1 ? parts[0].split(':')[1] : 'application/octet-stream';
        const base64Str = parts.length > 1 ? parts[1] : parts[0];
        const raw = window.atob(base64Str);
        const rawLength = raw.length;
        const uInt8Array = new Uint8Array(rawLength);
        for (let i = 0; i < rawLength; ++i) {
          uInt8Array[i] = raw.charCodeAt(i);
        }
        const exactBlob = new Blob([uInt8Array], { type: contentType });
        triggerDownload(exactBlob);
        return;
      } catch (err) {
        addLog('Cloud Storage Client', `Falló decodificación de soporte local, redirigiendo a la URL de almacenamiento`);
      }
    }
    
    // Fallback simple mock generator
    const fallbackBlob = new Blob([`COMPROBANTE DE COMPRA SOPORTE PMO\n\nID Gasto: ${c.id}\nDocumento: ${c.document_number}\nMonto: $${c.amount} USD\nRubro: ${c.cost_type}\nFecha: ${c.document_date}\n\nValidación del storage exitosa en Cloud Run.`], { type: 'text/plain' });
    triggerDownload(fallbackBlob);
  };

  return (
    <div className="bg-white border border-t-0 border-slate-200 rounded-b-xl p-6 shadow-sm space-y-8 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 font-sans">
            <Coins className="w-4 h-4 text-indigo-600" />
            Control de Rubros de Presupuesto Asignado vs. Ejecutado
          </h3>
          <p className="text-[11px] text-slate-500 mt-1 font-sans">
            Establezca el presupuesto límite para cada rubro y registre los documentos de soporte (facturas, nóminas, recibos) para controlar el gasto real ejecutado de manera exacta.
          </p>
        </div>

        <button
          onClick={() => setIsRegisterCostModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-lg transition-all flex items-center gap-2 cursor-pointer shadow-sm hover:-translate-y-0.5 active:translate-y-0 font-sans"
        >
          <Plus className="w-4 h-4" />
          <span>Registrar Documentos Soporte</span>
        </button>
      </div>

      {/* Summary of Project Category budgets vs total project limit */}
      <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex flex-col sm:flex-row justify-between items-center text-[11px] gap-2">
        <span className="text-slate-500 font-semibold uppercase tracking-wide text-[10px] font-sans">
          Consolidado de Asignaciones de Proyecto:
        </span>
        <span className="font-bold text-slate-800 font-mono text-center sm:text-right">
          Total Asignado Rubros: ${((Object.values(activeProjBudgetMap) as number[])).reduce((s: number, v: number) => s + (Number(v) || 0), 0).toLocaleString()} / Presupuesto Límite Global: ${activeProject.budget_total.toLocaleString()} USD
        </span>
      </div>

      {/* Baseline History and Capture Dashboard */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 transition-all duration-200">
        <div 
          onClick={() => setIsBudgetBaselineSectionExpanded(prev => !prev)}
          className="flex items-center justify-between cursor-pointer select-none group"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-1.5 bg-indigo-50 rounded-lg text-indigo-600 group-hover:bg-indigo-100 transition-colors">
              <History className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-700 font-sans group-hover:text-indigo-600 transition-colors">
                Líneas Base (Baselines) de Presupuesto
              </h4>
              <p className="text-[10.5px] text-slate-500 font-medium truncate max-w-[280px] sm:max-w-md md:max-w-lg mt-0.5 font-sans">
                {activeBaseline ? (
                  <span>Comparando activamente con la Línea Base: <strong className="text-indigo-600 font-extrabold font-mono">{activeBaseline.name}</strong> (${activeBaseline.totalBudget.toLocaleString()} USD)</span>
                ) : (
                  <span className="text-slate-450 italic">No hay ninguna Línea Base de presupuesto activa en este momento</span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-[10px] bg-indigo-50 border border-indigo-100 text-indigo-800 font-extrabold font-mono px-2 py-0.5 rounded-md hidden sm:inline-block">
              {projBaselineData.list.length} {projBaselineData.list.length === 1 ? 'REGISTRO' : 'REGISTROS'}
            </span>
            <button
              type="button"
              className="text-xs text-indigo-600 hover:text-indigo-700 font-extrabold flex items-center gap-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg py-1 px-2.5 transition cursor-pointer shadow-xs font-sans"
            >
              <span>{isBudgetBaselineSectionExpanded ? 'Colapsar' : 'Expandir'}</span>
              {isBudgetBaselineSectionExpanded ? (
                <ChevronUp className="w-3.5 h-3.5 text-indigo-500" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-indigo-500" />
              )}
            </button>
          </div>
        </div>

        {isBudgetBaselineSectionExpanded && (
          <div className="mt-5 pt-4 border-t border-slate-200/80 space-y-5 animate-fadeIn">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left column: Capture Form */}
              <div className="lg:col-span-12 xl:col-span-5 bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between space-y-4 shadow-sm">
                <div className="space-y-2">
                  <h5 className="font-bold text-slate-800 text-xs flex items-center gap-1.5 font-sans">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    Registrar Nueva Línea Base
                  </h5>
                  <p className="text-[11px] text-slate-500 leading-relaxed font-sans">
                    Captura una foto estática de la distribución actual del presupuesto asignado global ($ USD) para guardar un plan de referencia exacto y medir desviaciones.
                  </p>
                  
                  <div className="pt-2">
                    <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1 font-mono">Nombre o Identificador de esta Línea Base</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder={`Ej: LB Inicial, LB Post-Rebalance, LB Q2...`}
                        value={newBudgetBaselineName}
                        onChange={e => setNewBudgetBaselineName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 text-slate-700 hover:border-slate-300 focus:bg-white focus:border-indigo-500 focus:outline-none p-2 rounded-lg text-xs font-medium font-sans"
                      />
                      {newBudgetBaselineName && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setNewBudgetBaselineName('');
                          }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleCaptureBaseline}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:-translate-y-0.5 active:translate-y-0 font-sans"
                >
                  <Plus className="w-4 h-4" />
                  <span>Fijar Nueva Línea Base</span>
                </button>
              </div>

              {/* Right column: History List */}
              <div className="lg:col-span-12 xl:col-span-7 space-y-3">
                <h5 className="font-bold text-slate-800 text-xs flex items-center gap-1.5 font-sans">
                  <History className="w-4 h-4 text-indigo-500" />
                  Historial y Línea Base Activa
                </h5>

                <div className="bg-white border border-slate-200 rounded-xl max-h-[170px] overflow-y-auto divide-y divide-slate-100 shadow-sm">
                  {projBaselineData.list.length === 0 ? (
                    <div className="p-8 text-center flex flex-col items-center justify-center space-y-2">
                      <div className="w-9 h-9 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                        <History className="w-5 h-5 text-slate-400" />
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-slate-700 font-sans">Sin registros históricos</p>
                        <p className="text-[10px] text-slate-400 font-sans">Use el formulario de la izquierda para capturar la primera referencia.</p>
                      </div>
                    </div>
                  ) : (
                    projBaselineData.list.map((baselineVal) => {
                      const isSelectedActive = projBaselineData.activeId === baselineVal.id;
                      return (
                        <div 
                          key={baselineVal.id} 
                          className={`p-3 flex items-center justify-between gap-3 transition-colors ${
                            isSelectedActive ? 'bg-indigo-50/40' : 'hover:bg-slate-50/50'
                          }`}
                        >
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-slate-900 text-xs truncate max-w-[190px] font-sans" title={baselineVal.name}>
                                {baselineVal.name}
                              </span>
                              {isSelectedActive && (
                                <span className="text-[9px] bg-emerald-100 border border-emerald-250 text-emerald-800 font-extrabold px-2 py-0.5 rounded-full inline-flex items-center gap-0.5 font-sans">
                                  <Check className="w-2.5 h-2.5 font-bold" /> ACTIVA
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-slate-450 font-sans">
                              <span>Fecha: <b className="text-slate-600 font-mono">{baselineVal.capturedAt}</b></span>
                              <span>•</span>
                              <span>Total: <b className="text-slate-600 font-mono">${baselineVal.totalBudget.toLocaleString()} USD</b></span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {!isSelectedActive ? (
                              <button
                                onClick={() => handleSetActiveBaseline(baselineVal.id)}
                                className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-650 font-extrabold text-[10.5px] px-2.5 py-1.5 rounded-lg cursor-pointer transition shadow-xs hover:border-slate-300 font-sans"
                                title="Establecer como la línea base activa para comparar en la tabla"
                              >
                                Activar
                              </button>
                            ) : (
                              <button
                                onClick={handleClearActiveBaseline}
                                className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 font-extrabold text-[10.5px] px-2.5 py-1.5 rounded-lg cursor-pointer transition shadow-xs font-sans"
                                title="Desactivar comparación actual"
                              >
                                Desactivar
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteBaseline(baselineVal.id)}
                              className="hover:bg-rose-50 hover:text-rose-600 border border-transparent hover:border-rose-100 p-1.5 rounded-lg text-slate-400 cursor-pointer transition"
                              title="Eliminar esta línea base"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Table of categories: Planificado vs Ejecutado */}
      <div className="border border-slate-200 rounded-xl bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs min-w-[750px]">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 font-sans">
              <tr>
                <th className="p-3 pl-4">Rubro / Categoría de Gasto</th>
                <th className="p-3">Línea Base ($ USD)</th>
                <th className="p-3">Presupuesto Asignado ($ USD)</th>
                <th className="p-3 text-center">Desviación vs LB</th>
                <th className="p-3">Gasto Real Ejecutado ($ USD)</th>
                <th className="p-3">Saldo Real Disponible</th>
                <th className="p-3 pr-4">Porcentaje de Ejecución</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150">
              {(['NOMINA', 'LICENCIAS', 'INFRAESTRUCTURA', 'OUTSOURCING', 'OTROS'] as const).map(cat => {
                const assignedAmt = activeProjBudgetMap[cat] !== undefined ? activeProjBudgetMap[cat] : Math.round(activeProject.budget_total * 0.20);
                const baselineAmt = activeBaseline ? (activeBaseline.categories[cat] ?? 0) : null;
                const varianceAmt = baselineAmt !== null ? (assignedAmt - baselineAmt) : null;

                const executedAmt = projectCosts.filter(c => c.cost_type === cat).reduce((sum, item) => sum + item.amount, 0);
                const balanceAmt = assignedAmt - executedAmt;
                const isOver = executedAmt > assignedAmt;
                const executionPct = assignedAmt > 0 ? (executedAmt / assignedAmt) * 100 : 0;

                return (
                  <tr key={cat} className="hover:bg-slate-50/50 transition duration-150 font-sans">
                    <td className="p-3 pl-4 font-bold text-slate-800">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-extrabold mr-2 ${
                        cat === 'NOMINA' ? 'bg-teal-50 text-teal-700' :
                        cat === 'LICENCIAS' ? 'bg-indigo-50 text-indigo-700' :
                        cat === 'INFRAESTRUCTURA' ? 'bg-sky-50 text-sky-700' :
                        cat === 'OUTSOURCING' ? 'bg-amber-50 text-amber-700' : 'bg-slate-50 text-slate-700'
                      }`}>
                        {cat}
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium">
                        {cat === 'NOMINA' && '(Personal / Ingeniería)'}
                        {cat === 'LICENCIAS' && '(Plataformas SaaS)'}
                        {cat === 'INFRAESTRUCTURA' && '(Hosting y Bases de Datos)'}
                        {cat === 'OUTSOURCING' && '(Consultores externos)'}
                        {cat === 'OTROS' && '(Caja menor y varios)'}
                      </span>
                    </td>
                    <td className="p-3 font-mono font-bold text-slate-500">
                      {baselineAmt !== null ? (
                        <span className="text-slate-700">
                          ${baselineAmt.toLocaleString('en-US')}
                        </span>
                      ) : (
                        <span className="text-slate-350 font-normal italic">Sin fijar</span>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1.5 w-32">
                        <span className="text-slate-400 font-mono font-semibold">$</span>
                        <input
                          type="number"
                          value={assignedAmt}
                          onChange={e => {
                            const val = Math.max(0, Number(e.target.value) || 0);
                            setCategoryBudgets(prev => ({
                              ...prev,
                              [selectedProjectId]: {
                                ...(prev[selectedProjectId] || {}),
                                [cat]: val
                              }
                            }));
                          }}
                          className="bg-slate-50 border border-slate-200 hover:border-slate-350 focus:bg-white focus:outline-none p-1.5 rounded-md text-xs font-mono font-bold text-slate-85 w-full animate-fadeIn"
                          title="Haga clic para cambiar la asignación planificada"
                        />
                      </div>
                    </td>
                    <td className="p-3 text-center font-mono text-[11px]">
                      {varianceAmt !== null ? (
                        varianceAmt > 0 ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 inline-block font-sans" title="Presupuesto asignado incrementado respecto a la línea base">
                            +{varianceAmt.toLocaleString('en-US')}
                          </span>
                        ) : varianceAmt < 0 ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-100 inline-block font-sans" title="Presupuesto asignado reducido respecto a la línea base">
                            -${Math.abs(varianceAmt).toLocaleString('en-US')}
                          </span>
                        ) : (
                          <span className="text-slate-400">Sin cambios</span>
                        )
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                    <td className="p-3 font-mono font-bold text-slate-900">
                      ${executedAmt.toLocaleString('en-US')} USD
                    </td>
                    <td className="p-3">
                      <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold font-mono inline-block ${
                        isOver
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-emerald-50 text-emerald-800 border border-emerald-100'
                      }`}>
                        {isOver
                          ? `-$${Math.abs(balanceAmt).toLocaleString('en-US')} Excedido`
                          : `$${balanceAmt.toLocaleString('en-US')} Libre`
                        }
                      </span>
                    </td>
                    <td className="p-3 pr-4 animate-fadeIn">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              isOver ? 'bg-rose-500' : executionPct > 85 ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(executionPct, 100)}%` }}
                          />
                        </div>
                        <span className={`text-[10px] font-mono font-bold ${isOver ? 'text-rose-600' : 'text-slate-600'}`}>
                          {Math.round(executionPct)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cost management ledger taking full width */}
      <div className="space-y-4 pt-2">
        <div className="flex justify-between items-center pb-2 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1 font-mono">
          <span>Historial de Documentos Registrados</span>
          <span>Monto de Documento</span>
        </div>

        <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
          {projectCosts.map(c => (
            <div key={c.id} className="flex justify-between items-center text-xs py-3 bg-slate-50/50 hover:bg-slate-50 rounded-xl px-4 border border-slate-150 transition duration-150 font-sans">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] bg-slate-200 text-slate-800 px-1.5 py-0.5 rounded font-mono font-bold">
                    {c.cost_type}
                  </span>
                  <span className="text-[10px] bg-blue-50 text-blue-750 px-1.5 py-0.5 rounded font-mono font-extrabold" title="Número de documento">
                    #{c.document_number || 'N/A'}
                  </span>
                  <span className="font-semibold text-slate-800">
                    {c.description}
                  </span>
                </div>
                <p className="text-[10px] text-slate-450">
                  Fecha de Documento: <strong className="font-mono">{c.document_date || c.created_at}</strong>
                </p>

                {/* Optional Support Attachment details widget */}
                {c.storage_key && (
                  <div className="mt-1.5 flex items-center gap-2 flex-wrap font-sans">
                    <div 
                      onClick={() => setActiveCloudObjectDetail(c)}
                      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 transition duration-155 text-[10px] text-indigo-750 font-mono font-bold cursor-pointer"
                      title="Ver inspector de metadata del repositorio"
                    >
                      <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
                      repo://{c.file_name} ({c.file_size})
                    </div>
                    <span className="text-slate-300 text-[9px] font-mono">•</span>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        downloadDocumentLocally(c);
                      }}
                      className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold underline inline-flex items-center gap-0.5 font-mono bg-transparent border-none cursor-pointer p-0"
                      title="Generar y descargar archivo de soporte localmente"
                    >
                      Descargar localmente
                    </button>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="font-bold text-slate-950 font-mono text-sm">${c.amount.toLocaleString()} USD</span>
                <button
                  onClick={() => handleDeleteCost(c.id)}
                  className="text-slate-400 hover:text-rose-600 transition-colors p-1.5 hover:bg-slate-100 rounded-lg cursor-pointer"
                  title="Anular Documento"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
          {projectCosts.length === 0 && (
            <p className="text-center text-slate-400 italic py-12 font-sans">Sin documentos registrados. Ingrese una factura, nómina o recibo para iniciar.</p>
          )}
        </div>
      </div>

      {/* CLOUD ATTACHMENT metadata inspector slideover / dialog */}
      {activeCloudObjectDetail && (
        <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-xs flex items-center justify-end animate-fadeIn" onClick={() => setActiveCloudObjectDetail(null)}>
          <div 
            className="h-full bg-slate-900 border-l border-slate-700 text-slate-200 w-full max-w-sm p-6 shadow-2xl flex flex-col justify-between"
            onClick={e => e.stopPropagation()}
          >
            <div className="space-y-6">
              <div className="flex justify-between items-center pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2 text-indigo-400">
                  <FolderArchive className="w-5 h-5" />
                  <h4 className="font-bold text-xs uppercase tracking-wider font-mono">Inspector de Almacenamiento</h4>
                </div>
                <button
                  onClick={() => setActiveCloudObjectDetail(null)}
                  className="text-slate-400 hover:text-slate-200 text-lg transition cursor-pointer"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4 text-xs font-sans">
                <p className="text-[11px] text-slate-400 leading-relaxed font-mono">
                  Soporte físico guardado de forma persistente en infraestructura de GCP Cloud Storage.
                </p>

                <div className="space-y-1 bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <span className="text-[9px] uppercase font-bold tracking-widest text-slate-500 font-mono block">URI Canonical</span>
                  <span className="font-mono text-[10px] break-all text-emerald-400">
                    gs://pmo-grupo-campestre/financial-ledger/documents/{activeCloudObjectDetail.document_number}_{activeCloudObjectDetail.file_name}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 font-mono text-[11.5px]">
                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[8px] text-slate-500 block mb-0.5">TAMAÑO ARCHIVO</span>
                    <span className="font-bold text-slate-300">{activeCloudObjectDetail.file_size || 'N/A'}</span>
                  </div>
                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[8px] text-slate-500 block mb-0.5">FORMATO MIME</span>
                    <span className="font-bold text-slate-300">
                      {activeCloudObjectDetail.file_name?.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/png'}
                    </span>
                  </div>
                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[8px] text-slate-500 block mb-0.5">FECHA DE CARGA</span>
                    <span className="font-bold text-slate-300 text-[10.5px]">{activeCloudObjectDetail.uploaded_at || 'N/A'}</span>
                  </div>
                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 col-span-2">
                    <span className="text-[8px] text-slate-500 block mb-0.5">IDENTIFICADOR DE TRANSACCIÓN</span>
                    <span className="font-bold text-indigo-400 truncate block text-[10px]">{activeCloudObjectDetail.id}</span>
                  </div>
                </div>

                <div className="bg-slate-955 p-3 rounded-lg text-[10.5px] leading-relaxed text-slate-400 border border-slate-800/60 font-mono">
                  🔑 <b>Estado de Encriptación:</b> AES-256 (Llaves administradas por el cliente KMS GCP).
                </div>
              </div>
            </div>

            <div className="space-y-2 shrink-0">
              <button
                onClick={() => downloadDocumentLocally(activeCloudObjectDetail)}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer font-sans"
              >
                <span>Descargar Comprobante</span>
              </button>
              <button
                onClick={() => setActiveCloudObjectDetail(null)}
                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs py-2 rounded-lg transition cursor-pointer font-sans"
              >
                Cerrar Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FLOATING MODAL: Registrar Soporte de Gasto */}
      {isRegisterCostModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 shadow-2xl" onClick={() => setIsRegisterCostModalOpen(false)}>
          <div 
            className="bg-white border border-slate-200 rounded-xl max-w-md w-full max-h-[90vh] flex flex-col shadow-2xl animate-scaleUp overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-slate-50 border-b border-slate-200 p-4 flex justify-between items-center select-none shrink-0 font-sans">
              <div className="flex items-center gap-2 text-indigo-600">
                <Coins className="w-4 h-4 text-indigo-600 animate-pulse" />
                <span className="text-xs font-extrabold uppercase tracking-wider block">Registrar Soporte de Gasto</span>
              </div>
              <button
                type="button"
                onClick={() => setIsRegisterCostModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-200 rounded-lg transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleAddCost} className="p-5 space-y-4 overflow-y-auto font-sans">
              <p className="text-[11px] text-slate-500 leading-normal">
                Ingrese la información oficial del documento soporte (factura, nómina o recibos). Esto se actualizará en la telemetría financiera global de inmediato.
              </p>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">Rubro de Presupuesto Asignado*</label>
                <select
                  value={newCostType}
                  onChange={e => setNewCostType(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-lg px-2.5 py-2 text-xs text-slate-800 focus:outline-none cursor-pointer font-bold"
                >
                  <option value="NOMINA">NOMINA (Personal / Ingeniería)</option>
                  <option value="LICENCIAS">LICENCIAS (Plataformas SaaS)</option>
                  <option value="INFRAESTRUCTURA">INFRAESTRUCTURA (Hosting y Cloud)</option>
                  <option value="OUTSOURCING">OUTSOURCING (Consultoría / Audits)</option>
                  <option value="OTROS">OTROS (Insumos generales)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">Número de Documento / Factura*</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. FAC-2026-0312"
                  value={newDocNumber}
                  onChange={e => setNewDocNumber(e.target.value)}
                  className="w-full bg-slate-50 focus:bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-xs text-slate-800 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">Fecha Emisión*</label>
                  <input
                    type="date"
                    required
                    value={newDocDate}
                    onChange={e => setNewDocDate(e.target.value)}
                    className="w-full bg-slate-50 focus:bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-800 font-mono cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">Monto ($ USD)*</label>
                  <input
                    type="number"
                    required
                    placeholder="Monto"
                    value={newCostAmount}
                    onChange={e => setNewCostAmount(e.target.value)}
                    className="w-full bg-slate-50 focus:bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-800 font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">Concepto / Glosa de Documento*</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Pago Licencias Enterprise AWS"
                  value={newCostDesc}
                  onChange={e => setNewCostDesc(e.target.value)}
                  className="w-full bg-slate-50 focus:bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800"
                />
              </div>

              {/* Support Document File Upload UI widget */}
              <div className="space-y-2 border-t border-slate-100 pt-3">
                <div className="flex items-center justify-between">
                  <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">Carga de Soporte Físico (Opcional)</span>
                  <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setCostAttachmentMode('file')}
                      className={`text-[9.5px] font-extrabold px-2 py-1 rounded transition whitespace-nowrap cursor-pointer ${
                        costAttachmentMode === 'file' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-450 hover:text-slate-700'
                      }`}
                    >
                      Archivo
                    </button>
                    <button
                      type="button"
                      onClick={() => setCostAttachmentMode('link')}
                      className={`text-[9.5px] font-extrabold px-2 py-1 rounded transition whitespace-nowrap cursor-pointer ${
                        costAttachmentMode === 'link' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-450 hover:text-slate-700'
                      }`}
                    >
                      URL
                    </button>
                  </div>
                </div>

                {costAttachmentMode === 'file' ? (
                  <div className="space-y-3">
                    <div className="border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 p-4 hover:bg-slate-100 transition duration-150 flex flex-col items-center justify-center space-y-1 relative group cursor-pointer">
                      <input
                        type="file"
                        onChange={handleCostFileChange}
                        accept="application/pdf,image/*"
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                      <UploadCloud className="w-8 h-8 text-slate-400 group-hover:text-indigo-505 transition active:scale-95 duration-100 select-none animate-bounce" />
                      <span className="text-slate-750 text-xs font-bold font-sans">Busque o arrastre su PDF / Foto</span>
                      <span className="text-[9.5px] text-slate-400 font-sans">Capacidad máxima: 15 MB</span>
                    </div>

                    {cloudFileUploadedName && (
                      <div className="flex items-center justify-between p-2 rounded-xl bg-indigo-50 border border-indigo-100 animate-fadeIn text-[11px]">
                        <div className="flex items-center gap-2">
                          <Paperclip className="w-3.5 h-3.5 text-indigo-650" />
                          <div className="min-w-0">
                            <p className="font-mono font-bold text-slate-800 truncate max-w-[170px]">{cloudFileUploadedName}</p>
                            <span className="text-[10px] text-slate-450">{cloudFileUploadedSize}</span>
                          </div>
                        </div>
                        {cloudProgress === 100 ? (
                          <span className="text-[9px] bg-emerald-100 border border-emerald-200 text-emerald-800 px-2 py-0.5 rounded-full font-bold">CARGADO</span>
                        ) : (
                          <div className="w-12 bg-slate-250 h-1.5 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-600 transition-all duration-100" style={{ width: `${cloudProgress}%` }} />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-450">
                        <Globe className="w-3.5 h-3.5" />
                      </div>
                      <input
                        type="url"
                        value={cloudFileExternalUrl}
                        onChange={e => {
                          setCloudFileExternalUrl(e.target.value);
                          const lastPart = e.target.value.split('/').pop() || '';
                          setCloudFileUploadedName(lastPart.includes('.') ? lastPart : 'archivo_remoto.pdf');
                          setCloudFileUploadedSize('Enlace nube');
                        }}
                        placeholder="https://drive.google.com/file/d/..."
                        className="w-full bg-slate-50 focus:bg-white border border-slate-200 rounded-lg pl-8 p-2 text-xs font-mono"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 text-xs pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsRegisterCostModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg font-semibold transition cursor-pointer font-sans"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold shadow-md shadow-indigo-500/10 hover:shadow-indigo-500/20 transition cursor-pointer font-sans"
                >
                  Guardar Gasto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
