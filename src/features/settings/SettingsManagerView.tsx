/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Mail, Briefcase, CheckSquare, Building, Tag, RefreshCw, Plus, Edit2, AlertTriangle, Check } from 'lucide-react';
import { useSystemStore } from '../../app/providers/SystemProvider';
import { SmtpSettingsPanel } from './SmtpSettingsPanel';
import { ClientSponsorSettings } from './ClientSponsorSettings';
import { settingsRepository } from './infrastructure/settingsRepository';
import { Tenant, NoteType } from '../../types';
import { DEFAULT_TRANSITION_RULES } from '../../data';

export const SettingsManagerView: React.FC = () => {
  const {
    tenants,
    setTenants,
    noteTypes,
    setNoteTypes,
    addLog,
    setDeleteConfirmState,
    settingsSubTab,
    setSettingsSubTab,
    clientsList,
    setClientsList,
    sponsorsList,
    setSponsorsList,
    smtpPassword,
    setSmtpPassword,
  } = useSystemStore();

  // SMTP Settings States (loaded from decoupled repository or defaulted)
  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState('');
  const [smtpAccount, setSmtpAccount] = useState('');

  useEffect(() => {
    const config = settingsRepository.loadSmtpConfig();
    setSmtpHost(config.host);
    setSmtpPort(config.port);
    setSmtpAccount(config.account);
  }, []);

  // Scrum Transition Rules States
  const [scrumRulesUpdateTrigger, setScrumRulesUpdateTrigger] = useState(0);

  // Custom Note Types Editing States
  const [editingNoteType, setEditingNoteType] = useState<NoteType | null>(null);
  const [noteTypeName, setNoteTypeName] = useState('');
  const [noteTypeDescription, setNoteTypeDescription] = useState('');
  const [noteTypeColor, setNoteTypeColor] = useState('indigo');
  const [noteTypeActive, setNoteTypeActive] = useState(true);

  // Sync clients & sponsors back to repository on change
  useEffect(() => {
    if (clientsList.length > 0) {
      settingsRepository.saveClients(clientsList);
    }
  }, [clientsList]);

  useEffect(() => {
    if (sponsorsList.length > 0) {
      settingsRepository.saveSponsors(sponsorsList);
    }
  }, [sponsorsList]);

  return (
    <div className="space-y-6 animate-fadeIn" id="configuration-root-panel">
      
      {/* Sub-navigation bar for config menu */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs text-left">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-slate-900 font-bold text-base flex items-center gap-2">
              ⚙️ Consola de Configuración PMO
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Gestione el servidor de alertas por correo, sponsors autorizados y catálogos de clientes corporativos.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 bg-slate-50 border border-slate-150 p-1.5 rounded-xl">
            <button
              type="button"
              id="subtab-smtp-btn"
              onClick={() => setSettingsSubTab('smtp')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition shadow-2xs cursor-pointer ${
                settingsSubTab === 'smtp'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Servidor SMTP</span>
            </button>

            <button
              type="button"
              id="subtab-clients-btn"
              onClick={() => setSettingsSubTab('clients')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition shadow-2xs cursor-pointer ${
                settingsSubTab === 'clients'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Clientes & Sponsors</span>
            </button>

            <button
              type="button"
              id="subtab-scrum-rules-btn"
              onClick={() => setSettingsSubTab('scrum_rules')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition shadow-2xs cursor-pointer ${
                settingsSubTab === 'scrum_rules'
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>Reglas Scrum</span>
            </button>

            <button
              type="button"
              id="subtab-tenants-btn"
              onClick={() => setSettingsSubTab('tenants')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition shadow-2xs cursor-pointer ${
                settingsSubTab === 'tenants'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
              }`}
            >
              <Building className="w-3.5 h-3.5" />
              <span>CIA Multi-tenant</span>
            </button>

            <button
              type="button"
              id="subtab-note-types-btn"
              onClick={() => setSettingsSubTab('note_types')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition shadow-2xs cursor-pointer ${
                settingsSubTab === 'note_types'
                  ? 'bg-indigo-650 bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Tag className="w-3.5 h-3.5 text-indigo-500" />
              <span>Tipos de Notas</span>
            </button>
          </div>
        </div>
      </div>

      {/* Dynamic Sub-tab displays */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        
        {settingsSubTab === 'smtp' && (
          <SmtpSettingsPanel
            smtpHost={smtpHost}
            setSmtpHost={(h) => {
              setSmtpHost(h);
              settingsRepository.saveSmtpConfig({ host: h, port: smtpPort, account: smtpAccount, password: smtpPassword });
            }}
            smtpPort={smtpPort}
            setSmtpPort={(p) => {
              setSmtpPort(p);
              settingsRepository.saveSmtpConfig({ host: smtpHost, port: p, account: smtpAccount, password: smtpPassword });
            }}
            smtpAccount={smtpAccount}
            smtpAccountSet={(a) => {
              setSmtpAccount(a);
              settingsRepository.saveSmtpConfig({ host: smtpHost, port: smtpPort, account: a, password: smtpPassword });
            }}
            smtpPassword={smtpPassword}
            setSmtpPassword={(pw) => {
              setSmtpPassword(pw);
              settingsRepository.saveSmtpConfig({ host: smtpHost, port: smtpPort, account: smtpAccount, password: pw });
            }}
          />
        )}

        {settingsSubTab === 'clients' && (
          <ClientSponsorSettings
            clientsList={clientsList}
            setClientsList={setClientsList}
            sponsorsList={sponsorsList}
            setSponsorsList={setSponsorsList}
          />
        )}

        {settingsSubTab === 'scrum_rules' && (
          <div className="space-y-6 animate-fadeIn text-slate-800">
            <div className="border border-slate-150 rounded-2xl p-6 bg-slate-50/50 text-left">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4 mb-4">
                <div className="flex items-center gap-2.5">
                  <CheckSquare className="w-5 h-5 text-violet-600" />
                  <div>
                    <span className="text-sm font-extrabold text-slate-800 uppercase tracking-wider block">Reglas de Transición Scrum Board</span>
                    <p className="text-[11px] text-slate-500 mt-0.5">Gestione las validaciones semánticas, de Definition of Ready (DOR) y Definition of Done (DOD) para las Historias de Usuario.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setDeleteConfirmState({
                      isOpen: true,
                      title: 'Restablecer Reglas',
                      message: '¿Está seguro de que desea restablecer todas las reglas de transición a su estado habilitado por defecto?',
                      onConfirm: () => {
                        localStorage.removeItem('scrum_transition_rules');
                        setScrumRulesUpdateTrigger(prev => prev + 1);
                        addLog('Configuración', 'Restableció todas las reglas de transición de HU a sus valores por defecto.');
                      }
                    });
                  }}
                  className="bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs px-3 py-1.5 rounded-lg transition shrink-0 cursor-pointer shadow-2xs flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                  Restablecer por Defecto
                </button>
              </div>

              <div className="bg-violet-50 border border-violet-100/70 text-violet-950 p-3.5 rounded-xl text-xs flex gap-2.5 leading-normal mb-5">
                <span className="text-base shrink-0">🛡️</span>
                <div>
                  <strong className="font-extrabold text-violet-900 block mb-0.5">Control de Calidad del Proceso (QMS)</strong>
                  Las reglas que deshabilite aquí <span className="font-semibold text-rose-700">se omitirán automáticamente</span> en el tablero Scrum de desarrollo al arrastrar o transicionar las tarjetas, dándole total flexibilidad cuando ejecute fases ágiles aceleradas.
                </div>
              </div>

              <div className="space-y-4">
                {(() => {
                  const savedRulesStr = localStorage.getItem('scrum_transition_rules');
                  let activeRules: any[] = DEFAULT_TRANSITION_RULES;
                  if (savedRulesStr && savedRulesStr !== "undefined" && savedRulesStr !== "null") {
                    try {
                      const parsed = JSON.parse(savedRulesStr);
                      if (parsed !== null && parsed !== undefined && Array.isArray(parsed)) {
                        activeRules = parsed;
                      }
                    } catch (e) {
                      activeRules = DEFAULT_TRANSITION_RULES;
                    }
                  }

                  const categories = Array.from(new Set(activeRules.map(r => r.category)));

                  const handleToggleRule = (ruleId: string) => {
                    const updated = activeRules.map(r => {
                      if (r.id === ruleId) {
                        const newval = !r.enabled;
                        addLog('Configuración', `${newval ? 'Habilitó' : 'Deshabilitó'} regla Scrum: "${r.name}"`);
                        return { ...r, enabled: newval };
                      }
                      return r;
                    });
                    localStorage.setItem('scrum_transition_rules', JSON.stringify(updated));
                    setScrumRulesUpdateTrigger(prev => prev + 1);
                  };

                  return categories.map((category: any) => (
                    <div key={category} className="border border-slate-200 rounded-xl bg-white overflow-hidden shadow-2xs">
                      <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 flex items-center justify-between">
                        <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-600 block">
                          Clasificación: {category === 'dor' ? 'DOR (Definition of Ready)' : 'DOD (Definition of Done)'}
                        </span>
                      </div>
                      <div className="divide-y divide-slate-100">
                        {activeRules.filter(r => r.category === category).map(rule => (
                          <div key={rule.id} className="p-4 flex items-start gap-4 transition hover:bg-slate-50/50">
                            <input
                              type="checkbox"
                              checked={rule.enabled}
                              onChange={() => handleToggleRule(rule.id)}
                              className="mt-1 rounded border-slate-300 text-violet-600 focus:ring-violet-500 w-4 h-4 cursor-pointer"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-xs text-slate-800">{rule.name}</span>
                                {rule.enabled ? (
                                  <span className="text-[8.5px] font-black bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full border border-emerald-250">ACTIVA</span>
                                ) : (
                                  <span className="text-[8.5px] font-black bg-slate-150 text-slate-500 px-2.5 py-0.5 rounded-full border border-slate-200">INACTIVA (REJAS ABIERTAS)</span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500 leading-normal mt-1">{rule.description}</p>
                              {rule.errorMsg && (
                                <p className="text-[9.5px] text-slate-400 font-mono mt-1.5">Alertas visuales: "{rule.errorMsg}"</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>
          </div>
        )}

        {settingsSubTab === 'tenants' && (
          <div className="space-y-6 animate-fadeIn" id="settings-tenants-tab">
            <div className="flex flex-col lg:flex-row gap-6 text-slate-800 text-left">
              <div className="w-full lg:w-1/3 bg-slate-50 rounded-2xl p-5 border border-slate-205">
                <div className="flex items-center gap-2 mb-4">
                  <span className="p-1 px-2.5 rounded-lg bg-teal-100 text-teal-700 font-extrabold text-[10px] uppercase">
                    Nueva Suscripción
                  </span>
                </div>
                <h4 className="text-slate-800 font-extrabold text-sm mb-1">
                  Registrar CIA / Cliente SaaS
                </h4>
                <p className="text-[11px] text-slate-500 mb-4 leading-normal">
                  Agregue un nuevo espacio de trabajo aislado (CIA) con su propio dominio, usuarios, proyectos e integraciones.
                </p>

                <form onSubmit={(e) => {
                  e.preventDefault();
                  const form = e.target as HTMLFormElement;
                  const tId = (form.elements.namedItem('tenantId') as HTMLInputElement).value.trim().toLowerCase().replace(/\s+/g, '-');
                  const tName = (form.elements.namedItem('tenantName') as HTMLInputElement).value.trim();
                  const tDomain = (form.elements.namedItem('tenantDomain') as HTMLInputElement).value.trim();
                  const tPlan = (form.elements.namedItem('tenantPlan') as HTMLSelectElement).value as 'Basics' | 'Enterprise' | 'Premium';
                  const tDesc = (form.elements.namedItem('tenantDesc') as HTMLInputElement).value.trim();
                  
                  if (!tId || !tName || !tDomain) {
                    alert('Por favor complete los campos obligatorios (*).');
                    return;
                  }

                  if (tenants.some(t => t.id === tId)) {
                    alert('El Identificador (ID) de CIA ya se encuentra registrado.');
                    return;
                  }

                  const newTenant: Tenant = {
                    id: tId,
                    name: tName,
                    domain: tDomain,
                    plan: tPlan,
                    description: tDesc || 'Sin descripción',
                    status: 'Active'
                  };

                  setTenants([...tenants, newTenant]);
                  addLog('Suscripción', `Creó un nuevo Tenant corporativo: ${tName} (${tId})`);
                  form.reset();
                }} className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">ID Corporativo (CIA) *</label>
                    <input name="tenantId" type="text" placeholder="grupo-calleja" className="w-full bg-white border border-slate-200 focus:ring-1 focus:ring-teal-500 rounded-lg px-3 py-2 text-xs text-slate-850 outline-none" required />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Nombre Comercial *</label>
                    <input name="tenantName" type="text" placeholder="Super Selectos S.A." className="w-full bg-white border border-slate-200 focus:ring-1 focus:ring-teal-500 rounded-lg px-3 py-2 text-xs text-slate-850 outline-none" required />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Dominio de Correo Autorizado *</label>
                    <input name="tenantDomain" type="text" placeholder="selectos.com.sv" className="w-full bg-white border border-slate-200 focus:ring-1 focus:ring-teal-500 rounded-lg px-3 py-2 text-xs text-slate-850 outline-none" required />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Suscripción SaaS / Plan</label>
                    <select name="tenantPlan" className="w-full bg-white border border-slate-200 focus:ring-1 focus:ring-teal-500 rounded-lg px-3 py-2 text-xs text-slate-850 outline-none">
                      <option value="Premium">👑 Premium SaaS (Completo)</option>
                      <option value="Enterprise">🏢 Enterprise (Soporte)</option>
                      <option value="Basics">⚙️ Starter (Básico)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Descripción Breve</label>
                    <input name="tenantDesc" type="text" placeholder="Especifique el rol del grupo corporativo..." className="w-full bg-white border border-slate-200 focus:ring-1 focus:ring-teal-500 rounded-lg px-3 py-2 text-xs text-slate-850 outline-none" />
                  </div>
                  <button type="submit" className="w-full bg-teal-600 hover:bg-teal-750 hover:bg-teal-700 text-white font-extrabold text-xs py-2 rounded-xl shadow-md cursor-pointer flex items-center justify-center gap-1 transition">
                    <Plus className="w-4 h-4" />
                    <span>Registrar CIA</span>
                  </button>
                </form>
              </div>

              <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
                <div className="border-b border-slate-100 pb-3.5 mb-4">
                  <span className="text-xs font-black text-slate-700 uppercase tracking-widest font-mono">
                    Catálogo de Clientes / Tenants Activos en Node Server
                  </span>
                </div>
                <div className="space-y-4">
                  {tenants.map(t => (
                    <div key={t.id} className="border border-slate-150 p-4 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-slate-50 transition">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2.5">
                          <span className="font-extrabold text-sm text-slate-850 text-slate-800">{t.name}</span>
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${
                            t.plan === 'Premium' ? 'bg-amber-50 text-amber-600 border-amber-250' : 'bg-slate-100 text-slate-600'
                          }`}>{t.plan}</span>
                        </div>
                        <p className="text-xs text-slate-500 font-sans">{t.description}</p>
                        <div className="flex items-center gap-4 text-[10.5px] text-slate-400 font-mono pt-1">
                          <span>📍 ID: {t.id}</span>
                          <span>🌐 Dominio: @{t.domain}</span>
                        </div>
                      </div>

                      {t.id !== 'grupo-campestre' && (
                        <button
                          type="button"
                          onClick={() => {
                            setDeleteConfirmState({
                              isOpen: true,
                              title: 'Dar de baja Suscripción',
                              message: `¿Está seguro de que desea eliminar la suscripción para "${t.name}"? Los usuarios vinculados perderán acceso.`,
                              onConfirm: () => {
                                setTenants(prev => prev.filter(item => item.id !== t.id));
                                addLog('Suscripción', `Dio de baja suscripción del Tenant: ${t.name}`);
                              }
                            });
                          }}
                          className="bg-white border border-red-200 hover:bg-red-50 text-red-600 font-bold text-xs px-3 py-1.5 rounded-lg transition shadow-2xs cursor-pointer"
                        >
                          Dar de Baja
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {settingsSubTab === 'note_types' && (
          <div className="space-y-6 animate-fadeIn" id="settings-note-types text-left">
            <div className="flex flex-col lg:flex-row gap-6 text-slate-800 text-left">
              <div className="w-full lg:w-1/3 bg-slate-50 rounded-2xl p-5 border border-slate-205">
                <div className="flex items-center gap-2 mb-4">
                  <span className="p-1 px-2.5 rounded-lg bg-indigo-100 text-indigo-700 font-extrabold text-[10px] uppercase">
                    {editingNoteType ? 'Modificar Tipo' : 'Nuevo Tipo de Nota'}
                  </span>
                </div>
                <h4 className="text-slate-800 font-extrabold text-sm mb-1">
                  {editingNoteType ? 'Editar Clasificación' : 'Registrar Clasificación de Notas'}
                </h4>
                <p className="text-[11px] text-slate-500 mb-4 leading-normal">
                  Defina las categorías de notas disponibles para todos los proyectos activos de la plataforma, como alertas críticas, actas o especificaciones técnicas.
                </p>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!noteTypeName.trim()) {
                      alert('Por favor ingrese un nombre para el tipo de nota.');
                      return;
                    }

                    if (editingNoteType) {
                      const updated = noteTypes.map(t => {
                        if (t.id === editingNoteType.id) {
                          return {
                            ...t,
                            name: noteTypeName.trim(),
                            description: noteTypeDescription.trim(),
                            color: noteTypeColor,
                            active: noteTypeActive
                          };
                        }
                        return t;
                      });
                      setNoteTypes(updated);
                      addLog('Configuración Notas', `Tipo de Nota modificado: "${noteTypeName.trim()}"`);
                    } else {
                      const newType: NoteType = {
                        id: `type-${Date.now()}`,
                        name: noteTypeName.trim(),
                        description: noteTypeDescription.trim(),
                        color: noteTypeColor,
                        active: true
                      };
                      setNoteTypes([...noteTypes, newType]);
                      addLog('Configuración Notas', `Nuevo Tipo de Nota creado: "${noteTypeName.trim()}"`);
                    }

                    // Reset form
                    setEditingNoteType(null);
                    setNoteTypeName('');
                    setNoteTypeDescription('');
                    setNoteTypeColor('indigo');
                    setNoteTypeActive(true);
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Nombre *</label>
                    <input
                      type="text"
                      value={noteTypeName}
                      onChange={e => setNoteTypeName(e.target.value)}
                      placeholder="Minuta de Reunión"
                      className="w-full bg-white border border-slate-200 focus:ring-1 focus:ring-indigo-500 rounded-lg px-3 py-2 text-xs text-slate-850 outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Descripción Breve</label>
                    <input
                      type="text"
                      value={noteTypeDescription}
                      onChange={e => setNoteTypeDescription(e.target.value)}
                      placeholder="Registro de compromisos logrados con Sponsors..."
                      className="w-full bg-white border border-slate-200 focus:ring-1 focus:ring-indigo-500 rounded-lg px-3 py-2 text-xs text-slate-850 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Color de Distintivo</label>
                    <select
                      value={noteTypeColor}
                      onChange={e => setNoteTypeColor(e.target.value)}
                      className="w-full bg-white border border-slate-200 focus:ring-1 focus:ring-indigo-500 rounded-lg px-3 py-2 text-xs text-slate-850 outline-none"
                    >
                      <option value="indigo">💜 Indigo / Violeta</option>
                      <option value="amber">💛 Amber / Alertadora</option>
                      <option value="emerald">💚 Esmeralda / Técnica</option>
                      <option value="rose">❤️ Rojo / Crítico</option>
                      <option value="sky">💙 Sky / Informativa</option>
                    </select>
                  </div>
                  {editingNoteType && (
                    <div className="flex items-center gap-2 pt-1.5">
                      <input
                        type="checkbox"
                        id="note-active-chk"
                        checked={noteTypeActive}
                        onChange={e => setNoteTypeActive(e.target.checked)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                      <label htmlFor="note-active-chk" className="text-xs text-slate-700 font-bold cursor-pointer">
                        Clasificación Activa en Proyectos
                      </label>
                    </div>
                  )}
                  <div className="flex gap-2 pt-2">
                    {editingNoteType && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingNoteType(null);
                          setNoteTypeName('');
                          setNoteTypeDescription('');
                          setNoteTypeColor('indigo');
                          setNoteTypeActive(true);
                        }}
                        className="flex-1 bg-white border border-slate-250 text-slate-750 font-bold text-xs py-2 rounded-xl hover:bg-slate-50 transition"
                      >
                        Cancelar
                      </button>
                    )}
                    <button
                      type="submit"
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs py-2 rounded-xl shadow-md cursor-pointer flex items-center justify-center gap-1 transition"
                    >
                      {editingNoteType ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                      <span>{editingNoteType ? 'Actualizar' : 'Añadir'}</span>
                    </button>
                  </div>
                </form>
              </div>

              <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
                <div className="border-b border-slate-100 pb-3.5 mb-4">
                  <span className="text-xs font-black text-slate-700 uppercase tracking-widest font-mono">
                    Tipos de Notas Disponibles en Gestor Proyectos
                  </span>
                </div>
                <div className="space-y-4">
                  {noteTypes.map(t => (
                    <div key={t.id} className="border border-slate-150 p-4 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-slate-50 transition">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2.5">
                          <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 bg-${t.color}-500 ${
                            t.color === 'indigo' ? 'bg-indigo-500' :
                            t.color === 'amber' ? 'bg-amber-500' :
                            t.color === 'emerald' ? 'bg-emerald-500' :
                            t.color === 'rose' ? 'bg-rose-500' : 'bg-sky-500'
                          }`} />
                          <span className="font-extrabold text-xs text-slate-850 text-slate-800">{t.name}</span>
                          {!t.active && (
                            <span className="text-[8.5px] bg-slate-100 text-slate-400 font-bold px-2 py-0.5 rounded-full">
                              INACTIVO
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 leading-normal">{t.description}</p>
                      </div>

                      <div className="flex gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingNoteType(t);
                            setNoteTypeName(t.name);
                            setNoteTypeDescription(t.description || '');
                            setNoteTypeColor(t.color);
                            setNoteTypeActive(t.active !== false);
                          }}
                          className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs p-1.5 rounded-lg transition shadow-2xs cursor-pointer flex items-center justify-center"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                        </button>
                        {t.id !== 'type-general' && (
                          <button
                            type="button"
                            onClick={() => {
                              setDeleteConfirmState({
                                isOpen: true,
                                title: 'Eliminar Clasificación Notas',
                                message: `¿Está seguro de que desea eliminar la clasificación "${t.name}"? Se desactivará la agrupación para notas existentes.`,
                                onConfirm: () => {
                                  setNoteTypes(prev => prev.filter(item => item.id !== t.id));
                                  addLog('Configuración Notas', `Eliminó tipo de nota: ${t.name}`);
                                }
                              });
                            }}
                            className="bg-white border border-red-150 hover:bg-red-50 text-red-500 font-bold text-xs px-2.5 py-1.5 rounded-lg transition shadow-2xs cursor-pointer"
                          >
                            Eliminar
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
