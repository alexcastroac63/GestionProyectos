/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ProjectActivity, User } from '../types';
import { Plus, Trash2, Calendar, Link, CheckCircle2, Play, Circle, Download, Printer, FileSpreadsheet } from 'lucide-react';

interface GanttChartProps {
  activities: ProjectActivity[];
  users: User[];
  onAddActivity: (activity: Omit<ProjectActivity, 'id'>) => void;
  onUpdateActivityProgress: (id: string, progress: number) => void;
  onDeleteActivity: (id: string) => void;
}

export default function GanttChart({
  activities,
  users,
  onAddActivity,
  onUpdateActivityProgress,
  onDeleteActivity
}: GanttChartProps) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [startDate, setStartDate] = useState('2026-05-15');
  const [endDate, setEndDate] = useState('2026-05-25');
  const [dependsOn, setDependsOn] = useState('');

  // Sorter logic to list activities in order or by dependency
  const sortedActivities = [...activities].sort((a, b) => a.start_date.localeCompare(b.start_date));

  // --- Export Actions ---

  const handleExportCSV = () => {
    const columns = [
      'ID',
      'Actividad',
      'Descripcion',
      'Asignado_a',
      'Fecha_Inicio',
      'Fecha_Fin',
      'Duracion_Dias',
      'Progreso_Pct',
      'Estado',
      'Dependencia'
    ];
    
    const csvRows = [columns.join(',')];
    
    sortedActivities.forEach(act => {
      const assignedUser = users.find(u => u.id === act.assigned_to_id);
      const assignedName = assignedUser ? `${assignedUser.first_name} ${assignedUser.last_name} (${assignedUser.role})` : 'Sin asignar';
      const dependencyAct = act.depends_on_id ? activities.find(a => a.id === act.depends_on_id) : null;
      const dependencyName = dependencyAct ? dependencyAct.name : 'Ninguna';
      const statusText = act.progress === 100 ? 'COMPLETADA' : act.progress > 0 ? 'EN_CURSO' : 'PENDIENTE';
      
      const cleanStr = (str: string) => `"${(str || '').replace(/"/g, '""')}"`;
      
      const row = [
        cleanStr(act.id),
        cleanStr(act.name),
        cleanStr(act.description),
        cleanStr(assignedName),
        cleanStr(act.start_date),
        cleanStr(act.end_date),
        act.duration_days,
        act.progress,
        cleanStr(statusText),
        cleanStr(dependencyName)
      ];
      
      csvRows.push(row.join(','));
    });
    
    const blob = new Blob(['\uFEFF' + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `gantt_diagrama_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportExcel = () => {
    const title = 'Diagrama de Gantt - Plan de Trabajo';
    let tableHtml = `
      <html>
      <head>
        <meta charset="utf-8"/>
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Gantt</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayGridlines/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; }
          table { border-collapse: collapse; width: 100%; margin-top: 10px; }
          th { background-color: #0d9488; color: #ffffff; font-weight: bold; font-size: 13px; text-align: left; padding: 10px; border: 1px solid #cbd5e1; }
          td { padding: 8px 10px; font-size: 12px; border: 1px solid #cbd5e1; vertical-align: middle; }
          .hdr-title { font-size: 18px; font-weight: bold; color: #1e293b; padding: 10px 0; }
          .meta-info { font-size: 11px; color: #64748b; padding-bottom: 15px; }
          .status-completada { background-color: #ccfbf1; color: #0d9488; font-weight: bold; text-align: center; border-radius: 4px; padding: 2px 5px; }
          .status-en-curso { background-color: #fef3c7; color: #d97706; font-weight: bold; text-align: center; border-radius: 4px; padding: 2px 5px; }
          .status-pendiente { background-color: #f1f5f9; color: #475569; font-weight: bold; text-align: center; border-radius: 4px; padding: 2px 5px; }
        </style>
      </head>
      <body>
        <div class="hdr-title">${title}</div>
        <div class="meta-info">Reporte generado automáticamente el ${new Date().toLocaleDateString('es-ES')} a las ${new Date().toLocaleTimeString('es-ES')}</div>
        <table>
          <thead>
            <tr>
              <th style="width: 150px;">Actividad</th>
              <th style="width: 250px;">Descripción</th>
              <th style="width: 135px;">Responsable</th>
              <th style="width: 90px; text-align: center;">Inicio</th>
              <th style="width: 90px; text-align: center;">Fin</th>
              <th style="width: 70px; text-align: center;">Días</th>
              <th style="width: 100px; text-align: center;">Progreso</th>
              <th style="width: 90px; text-align: center;">Estado</th>
              <th style="width: 150px;">Dependencia</th>
            </tr>
          </thead>
          <tbody>
    `;

    sortedActivities.forEach(act => {
      const assignedUser = users.find(u => u.id === act.assigned_to_id);
      const assignedName = assignedUser ? `${assignedUser.first_name} ${assignedUser.last_name}` : 'Sin asignar';
      const dependencyAct = act.depends_on_id ? activities.find(a => a.id === act.depends_on_id) : null;
      const dependencyName = dependencyAct ? dependencyAct.name : 'Ninguna';
      const progressText = `${act.progress}%`;
      
      const statusClass = act.progress === 100 
        ? 'status-completada' 
        : act.progress > 0 
          ? 'status-en-curso' 
          : 'status-pendiente';
          
      const statusText = act.progress === 100 ? 'COMPLETADA' : act.progress > 0 ? 'EN CURSO' : 'PENDIENTE';

      tableHtml += `
        <tr>
          <td style="font-weight: bold; color: #1e293b;">${act.name}</td>
          <td style="color: #475569;">${act.description || 'Sin descripción'}</td>
          <td style="color: #334155;">${assignedName}</td>
          <td style="text-align: center; font-family: monospace;">${act.start_date}</td>
          <td style="text-align: center; font-family: monospace;">${act.end_date}</td>
          <td style="text-align: center; font-family: monospace;">${act.duration_days}</td>
          <td style="text-align: center; font-weight: bold; font-family: monospace;">${progressText}</td>
          <td style="text-align: center;"><span class="${statusClass}">${statusText}</span></td>
          <td style="color: #64748b; font-size: 11px;">${dependencyName}</td>
        </tr>
      `;
    });

    tableHtml += `
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([tableHtml], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `gantt_diagrama_${new Date().toISOString().split('T')[0]}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Por favor habilite las ventanas emergentes (popups) para poder exportar a PDF.');
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Diagrama de Gantt - Impresión</title>
        <meta charset="utf-8"/>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .no-print { display: none !important; }
          }
          body { font-family: 'Inter', ui-sans-serif, system-ui, sans-serif; background-color: #ffffff; }
        </style>
      </head>
      <body class="bg-white p-8">
        <div class="no-print mb-6 p-4 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-center">
          <div>
            <h4 class="font-bold text-slate-900 text-sm">Vista Previa de Impresión del Diagrama de Gantt</h4>
            <p class="text-xs text-slate-500">Ajuste las opciones de impresión. Se recomienda habilitar "Gráficos de fondo" en su navegador.</p>
          </div>
          <div class="flex gap-2">
            <button onclick="window.print()" class="bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs px-4 py-2 rounded-lg cursor-pointer transition">
              Imprimir / Guardar a PDF
            </button>
            <button onclick="window.close()" class="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs px-4 py-2 rounded-lg cursor-pointer transition">
              Cerrar Vista Previa
            </button>
          </div>
        </div>

        <div class="border-b-2 border-slate-100 pb-4 mb-6">
          <div class="flex justify-between items-end">
            <div>
              <span class="text-[10px] font-extrabold uppercase tracking-widest text-teal-600">Planificación Temporal</span>
              <h1 class="text-xl font-black text-slate-900 mt-0.5">Diagrama de Gantt - Plan de Trabajo</h1>
              <p class="text-xs text-slate-500">Secuencia visual, estimaciones y dependencias del desarrollo del software.</p>
            </div>
            <div class="text-right">
              <span class="text-[10px] font-mono font-bold text-slate-400 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded">
                ${new Date().toLocaleDateString('es-ES')}
              </span>
            </div>
          </div>
        </div>

        <!-- Visual Gantt Graph Presentation -->
        <div class="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
          <table class="w-full text-left border-collapse table-fixed">
            <thead class="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
              <tr>
                <th class="p-4 text-xs uppercase tracking-wider w-1/3">Actividad / Rol Responsable</th>
                <th class="p-4 text-xs uppercase tracking-wider w-2/3 relative">
                  <div class="flex justify-between px-2 text-[10px] text-slate-400 font-mono">
                    <span>${minDate.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}</span>
                    <span>${new Date(minDate.getTime() + (totalDays / 2) * 86400000).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}</span>
                    <span>${maxDate.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              ${sortedActivities.map(act => {
                const pos = getPositionStyles(act.start_date, act.end_date);
                const assignedUser = users.find(u => u.id === act.assigned_to_id);
                const assignedName = assignedUser ? `${assignedUser.first_name} ${assignedUser.last_name}` : 'Sin asignar';
                const assignedRole = assignedUser ? assignedUser.role : '';
                const dependencyAct = act.depends_on_id ? activities.find(a => a.id === act.depends_on_id) : null;

                // Color classes based on status
                const barColor = act.progress === 100 
                  ? 'bg-teal-500' 
                  : act.progress > 0 
                    ? 'bg-amber-400' 
                    : 'bg-slate-350';

                const textClass = act.progress === 100 ? 'text-white' : 'text-slate-800';

                return `
                  <tr>
                    <!-- Left Metadata column -->
                    <td class="p-4 align-top w-1/3">
                      <div class="flex items-center gap-1.5">
                        <span class="font-bold text-slate-800 text-xs">${act.name}</span>
                      </div>
                      <div class="flex items-center gap-2 mt-1 text-[9px] text-slate-500 font-mono">
                        <span class="font-semibold text-teal-700 bg-teal-50 border border-teal-100 px-1.5 py-0.5 rounded uppercase">${act.duration_days} días</span>
                        <span>•</span>
                        <span class="text-slate-600">${assignedName} ${assignedRole ? `(${assignedRole})` : ''}</span>
                      </div>
                      ${dependencyAct ? `
                        <div class="mt-1 flex items-center gap-0.5 text-[8px] text-purple-700 font-bold bg-purple-50 rounded px-1.5 py-0.5 w-max">
                          <span>Depende de: ${dependencyAct.name}</span>
                        </div>
                      ` : ''}
                    </td>

                    <!-- Right Visual Gantt Bar column -->
                    <td class="p-4 align-middle w-2/3">
                      <div class="h-10 relative bg-slate-50 rounded-lg border border-slate-200/50 w-full overflow-hidden">
                        <!-- Background reference guide lines -->
                        <div class="absolute inset-0 flex justify-between pointer-events-none">
                          <div class="border-r border-slate-200/40 h-full w-[25%]" />
                          <div class="border-r border-slate-200/40 h-full w-[25%]" />
                          <div class="border-r border-slate-200/40 h-full w-[25%]" />
                        </div>

                        <!-- Colored Activity progress bar -->
                        <div
                          class="absolute top-2.5 h-4.5 rounded-full ${barColor} shadow-3xs flex items-center"
                          style="left: ${pos.left}; width: ${pos.width};"
                        >
                          <!-- Progress filled overlay -->
                          <div 
                            class="bg-black/10 h-full rounded-full absolute left-0 top-0" 
                            style="width: ${act.progress}%"
                          ></div>
                          
                          <!-- Percent text -->
                          <span class="absolute inset-0 flex items-center justify-center text-[9px] font-black ${textClass} z-10 select-none">
                            ${act.progress}%
                          </span>
                        </div>

                        <!-- Date strings on bottom right edge -->
                        <span class="absolute bottom-0 right-1.5 text-[8px] font-mono text-slate-400 bg-white/70 px-1.5 rounded">
                          ${act.start_date} a ${act.end_date}
                        </span>
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  // Determine date bounds
  const getMinMaxDates = () => {
    if (activities.length === 0) {
      return { min: new Date('2026-05-01'), max: new Date('2026-06-15') };
    }
    const dates = activities.flatMap(a => [new Date(a.start_date), new Date(a.end_date)]);
    const min = new Date(Math.min(...dates.map(d => d.getTime())));
    const max = new Date(Math.max(...dates.map(d => d.getTime())));
    // Add margin buffer
    min.setDate(min.getDate() - 3);
    max.setDate(max.getDate() + 5);
    return { min, max };
  };

  const { min: minDate, max: maxDate } = getMinMaxDates();
  const totalDays = Math.max(1, Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)));

  const handleProgressChange = (id: string, value: number) => {
    onUpdateActivityProgress(id, value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !startDate || !endDate) return;

    const s = new Date(startDate);
    const e_date = new Date(endDate);
    const diffTime = Math.abs(e_date.getTime() - s.getTime());
    const duration = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    onAddActivity({
      project_id: 'proj-1',
      name,
      description,
      assigned_to_id: assignedTo || undefined,
      start_date: startDate,
      end_date: endDate,
      duration_days: duration,
      progress: 0,
      status: 'PENDIENTE',
      depends_on_id: dependsOn || undefined
    });

    // Reset Form
    setName('');
    setDescription('');
    setAssignedTo('');
    setDependsOn('');
    setShowForm(false);
  };

  // Helper function to render horizontal bars
  const getPositionStyles = (startStr: string, endStr: string) => {
    const s = new Date(startStr);
    const e = new Date(endStr);
    
    // Calculate distance from minDate
    const startOffset = Math.ceil((s.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
    const duration = Math.max(1, Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1);

    const leftPercent = (startOffset / totalDays) * 100;
    const widthPercent = (duration / totalDays) * 100;

    return {
      left: `${Math.max(0, Math.min(leftPercent, 95))}%`,
      width: `${Math.max(3, Math.min(widthPercent, 100))}%`
    };
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden" id="gantt-root">
      {/* Gantt Header */}
      <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="font-semibold text-slate-900 text-lg flex items-center gap-2">
            <Calendar className="w-5 h-5 text-teal-600" />
            Línea de Tiempo del Proyecto (Gantt)
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Fases recomendadas por DBA, DevOps y QA con visualización de dependencias e hitos clave.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* Export Actions Panel */}
          <div className="flex items-center gap-1 bg-slate-100 border border-slate-200 p-1 rounded-lg">
            <span className="text-[10px] uppercase font-mono font-bold text-slate-500 px-2">Exportar:</span>
            
            <button
              onClick={handleExportCSV}
              type="button"
              className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold text-[11px] px-2.5 py-1.5 rounded-md flex items-center gap-1 transition-all cursor-pointer shadow-xs"
              title="Descargar datos en formato CSV (compatible con Excel)"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              CSV
            </button>

            <button
              onClick={handleExportExcel}
              type="button"
              className="bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-150 font-semibold text-[11px] px-2.5 py-1.5 rounded-md flex items-center gap-1 transition-all cursor-pointer shadow-xs"
              title="Descargar reporte formateado en Excel (.xls)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              Excel
            </button>

            <button
              onClick={handleExportPDF}
              type="button"
              className="bg-white hover:bg-indigo-50 text-indigo-800 border border-indigo-150 font-semibold text-[11px] px-2.5 py-1.5 rounded-md flex items-center gap-1 transition-all cursor-pointer shadow-xs"
              title="Generar PDF / Reporte Ejecutivo de Impresión"
            >
              <Printer className="w-3.5 h-3.5 text-indigo-600" />
              PDF (Imprimir)
            </button>
          </div>

          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-teal-600 hover:bg-teal-700 text-white font-medium text-xs px-3.5 py-2.5 rounded-lg flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
            id="btn-toggle-activity-form"
          >
            <Plus className="w-4 h-4" />
            Nueva Fase / Actividad
          </button>
        </div>
      </div>

      {/* Activity Creation Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="p-6 bg-slate-50 border-b border-slate-100 animate-fadeIn" id="gantt-activity-form">
          <h4 className="font-semibold text-slate-800 text-sm mb-4">Añadir Actividad a la Línea de Tiempo</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Nombre de la Fase / Actividad*</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ej. Diseño de base multi-tenant"
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Asignar Responsable</label>
              <select
                value={assignedTo}
                onChange={e => setAssignedTo(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              >
                <option value="">Selecciona un rol...</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.first_name} {u.last_name} ({u.role})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Depende de (Actividad)</label>
              <select
                value={dependsOn}
                onChange={e => setDependsOn(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              >
                <option value="">Ninguna dependency</option>
                {activities.map(act => (
                  <option key={act.id} value={act.id}>
                    {act.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Fecha de Inicio*</label>
              <input
                type="date"
                required
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Fecha de Finalización*</label>
              <input
                type="date"
                required
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              />
            </div>

            <div className="md:col-span-3">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Descripción Breve</label>
              <input
                type="text"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Indica el objetivo de esta fase el ciclo de vida..."
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-3.5 py-1.5 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-lg text-xs font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-medium shadow-sm"
            >
              Añadir Actividad
            </button>
          </div>
        </form>
      )}

      {/* Grid Gantt Graph */}
      <div className="p-6 overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Header Dates Bar */}
          <div className="flex border-b border-slate-100 pb-2 mb-4">
            <div className="w-1/3 text-xs font-semibold text-slate-500 uppercase">Actividad / Rol</div>
            <div className="w-2/3 relative flex justify-between px-2">
              <div className="absolute left-0 text-[10px] font-mono font-medium text-slate-400">
                {minDate.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
              </div>
              <div className="absolute left-1/4 text-[10px] font-mono font-medium text-slate-400">
                {new Date(minDate.getTime() + (totalDays / 4) * 86400000).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
              </div>
              <div className="absolute left-2/4 text-[10px] font-mono font-medium text-slate-400">
                {new Date(minDate.getTime() + (totalDays / 2) * 86400000).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
              </div>
              <div className="absolute left-3/4 text-[10px] font-mono font-medium text-slate-400">
                {new Date(minDate.getTime() + (3 * totalDays / 4) * 86400000).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
              </div>
              <div className="absolute right-0 text-[10px] font-mono font-medium text-slate-400">
                {maxDate.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
              </div>
            </div>
          </div>

          {/* List of Bars */}
          <div className="space-y-4">
            {sortedActivities.map(act => {
              const pos = getPositionStyles(act.start_date, act.end_date);
              const assignedUser = users.find(u => u.id === act.assigned_to_id);
              const dependencyAct = act.depends_on_id ? activities.find(a => a.id === act.depends_on_id) : null;

              // Color classes based on status
              const barColor = act.progress === 100 
                ? 'bg-teal-500' 
                : act.progress > 0 
                  ? 'bg-amber-400' 
                  : 'bg-slate-300';

              return (
                <div key={act.id} className="flex items-center group relative py-1 hover:bg-slate-50 rounded-lg transition-colors">
                  {/* Left Metadata Panel */}
                  <div className="w-1/3 pr-4 flex flex-col justify-center">
                    <div className="flex items-center gap-2">
                      {act.progress === 100 ? (
                        <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                      ) : act.progress > 0 ? (
                        <Play className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      ) : (
                        <Circle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      )}
                      <span className="font-semibold text-slate-800 text-xs truncate max-w-[200px]" title={act.name}>
                        {act.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-500 font-mono">
                      <span>{act.duration_days} días</span>
                      {assignedUser && (
                        <span className="text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded text-[9px] uppercase font-bold">
                          {assignedUser.first_name}
                        </span>
                      )}
                      {dependencyAct && (
                        <span className="text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded text-[9px] font-bold flex items-center gap-0.5" title={`Depende de: ${dependencyAct.name}`}>
                          <Link className="w-2.5 h-2.5" />
                          {dependencyAct.name.slice(0, 10)}...
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right Graph Timeline bar */}
                  <div className="w-2/3 h-10 relative bg-slate-50 rounded border border-slate-100/50">
                    {/* Background lines for visual references */}
                    <div className="absolute inset-0 flex justify-between pointer-events-none">
                      <div className="border-r border-slate-100 h-full w-[25%]" />
                      <div className="border-r border-slate-100 h-full w-[25%]" />
                      <div className="border-r border-slate-100 h-full w-[25%]" />
                    </div>

                    {/* Colored Activity Bar */}
                    <div
                      className={`absolute top-2.5 h-5 rounded-full ${barColor} transition-all duration-300 group/bar hover:scale-y-110 cursor-pointer shadow-xs`}
                      style={{ left: pos.left, width: pos.width }}
                    >
                      {/* Completed fill overlay */}
                      <div 
                        className="bg-black/10 h-full rounded-full transition-all duration-300" 
                        style={{ width: `${act.progress}%` }}
                      />

                      {/* Tooltip on Hover */}
                      <div className="absolute hidden group-hover/bar:block bg-slate-950 text-white p-2.5 rounded-lg text-[10px] bottom-7 left-1/2 -translate-x-1/2 z-20 w-48 shadow-lg font-sans border border-slate-800">
                        <p className="font-bold">{act.name}</p>
                        <p className="text-slate-400 mt-0.5">{act.description || 'Sin descripción'}</p>
                        <div className="flex justify-between items-center mt-1.5 border-t border-slate-800 pt-1.5 text-slate-300">
                          <span>{act.start_date} al {act.end_date}</span>
                          <span className="font-bold text-teal-400">{act.progress}% completado</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Interactive sliders or controls (appears on hover) */}
                  <div className="absolute right-2 opacity-0 group-hover:opacity-100 flex items-center gap-2 transition-opacity z-10 bg-slate-50/90 pl-2 rounded-lg">
                    <span className="text-[10px] font-mono text-slate-500 font-bold">Progreso:</span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={act.progress}
                      onChange={e => handleProgressChange(act.id, parseInt(e.target.value))}
                      className="w-16 accent-teal-600 cursor-pointer h-1.5 rounded-full"
                    />
                    <button
                      onClick={() => {
                        if (window.confirm(`¿Está seguro de que desea eliminar la actividad "${act.name}"?`)) {
                          onDeleteActivity(act.id);
                        }
                      }}
                      className="text-slate-400 hover:text-red-500 p-1 rounded-md"
                      title="Eliminar actividad"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
