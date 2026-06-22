/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Settings, 
  Plus, 
  Edit3, 
  Archive, 
  Power, 
  Search, 
  X, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Tag, 
  User, 
  Sparkles,
  Paperclip,
  Link2,
  Trash2,
  ExternalLink,
  Download,
  UploadCloud,
  File
} from 'lucide-react';
import { NoteType, ProjectNote, NoteAttachment } from '../../types';

interface ProjectNotesSubTabProps {
  projectId: string;
  users: Array<{ id: string; first_name: string; last_name: string; email: string }>;
  addLog: (title: string, message: string) => void;
  noteTypes: NoteType[];
}

// Initial preloaded Notes
const INITIAL_PROJECT_NOTES: ProjectNote[] = [
  {
    id: 'note-1',
    project_id: '', // dynamically set or matched
    type_id: 'type-general',
    title: 'Acuerdos de Kick-off de Proyecto',
    content: 'Se completó la reunión inicial de alineación. El cliente ratificó que las entregas deben ser quincenales alineadas con los Sprints. Pendiente refinar los criterios de aceptación en las historias de usuario.',
    created_at: '2026-06-15T09:00:00Z',
    updated_at: '2026-06-15T09:00:00Z',
    created_by_id: '',
    active: true,
    attachments: [
      {
        id: 'att-1',
        name: 'Acta de Kickoff Firmada.pdf',
        type: 'file',
        url: '#archivo-kickoff-pdf',
        uploaded_at: '2026-06-15T09:30:00Z'
      },
      {
        id: 'att-2',
        name: 'Carpeta de Minutas GDrive',
        type: 'link',
        url: 'https://drive.google.com',
        uploaded_at: '2026-06-15T09:31:00Z'
      }
    ]
  },
  {
    id: 'note-2',
    project_id: '', // dynamically set or matched
    type_id: 'type-atraso',
    title: 'Retraso en Aprobación de Mockups UI',
    content: 'El patrocinador de negocio aplazó la reunión de aprobación de mockup al próximo jueves debido a su agenda comercial. Esto retrasa el inicio de la maquetación del frontend en el Sprint 1 por un estimado de 3 días hábiles.',
    created_at: '2026-06-18T14:30:00Z',
    updated_at: '2026-06-19T10:15:00Z',
    created_by_id: '',
    active: true,
    attachments: [
      {
        id: 'att-3',
        name: 'Mockups de Interfaz Figma',
        type: 'link',
        url: 'https://figma.com',
        uploaded_at: '2026-06-18T14:35:00Z'
      }
    ]
  }
];

export default function ProjectNotesSubTab({ projectId, users, addLog, noteTypes }: ProjectNotesSubTabProps) {
  // --- STATE MANAGEMENT ---
  const [notes, setNotes] = useState<ProjectNote[]>(() => {
    const saved = localStorage.getItem('gcp_project_notes');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_PROJECT_NOTES;
  });

  // Search & Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
  const [showStatusFilter, setShowStatusFilter] = useState<'active' | 'archived' | 'all'>('active');

  // Modal active states
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<ProjectNote | null>(null);

  // Form Fields for Project Note
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteTypeId, setNoteTypeId] = useState('');
  const [noteAuthorId, setNoteAuthorId] = useState('');

  // Attachment state for creation/editing inside note modal
  const [attachmentsList, setAttachmentsList] = useState<NoteAttachment[]>([]);
  // Individual input states for manual attachments
  const [attType, setAttType] = useState<'file' | 'link'>('file');
  const [attName, setAttName] = useState('');
  const [attUrl, setAttUrl] = useState('');

  // Drag over / upload states
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadingName, setUploadingName] = useState<string>('');

  // Save to LocalStorage whenever notes state changes
  useEffect(() => {
    localStorage.setItem('gcp_project_notes', JSON.stringify(notes));
  }, [notes]);

  // Sync sample notes with the current selected project if they don't have project_id defined
  useEffect(() => {
    if (notes.length > 0) {
      let changed = false;
      const updated = notes.map(n => {
        if (!n.project_id) {
          changed = true;
          return { ...n, project_id: projectId };
        }
        return n;
      });
      if (changed) {
        setNotes(updated);
      }
    }
  }, [projectId]);

  // Set default author to first user if empty
  useEffect(() => {
    if (users && users.length > 0 && !noteAuthorId) {
      setNoteAuthorId(users[0].id);
    }
  }, [users]);

  // --- ACTIONS: NOTES ---
  const handleOpenNoteModal = (note?: ProjectNote) => {
    if (note) {
      setEditingNote(note);
      setNoteTitle(note.title);
      setNoteContent(note.content);
      setNoteTypeId(note.type_id);
      setNoteAuthorId(note.created_by_id || (users[0]?.id || ''));
      setAttachmentsList(note.attachments || []);
    } else {
      setEditingNote(null);
      setNoteTitle('');
      setNoteContent('');
      // Default to the first active Note Type passed from parent
      const firstActiveType = noteTypes.find(t => t.active);
      setNoteTypeId(firstActiveType ? firstActiveType.id : '');
      setNoteAuthorId(users[0]?.id || '');
      setAttachmentsList([]);
    }
    // Reset individual attachment inputs
    setAttType('file');
    setAttName('');
    setAttUrl('');
    setUploadProgress(null);
    setUploadingName('');
    setIsNoteModalOpen(true);
  };

  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();

    if (!noteTitle.trim()) {
      alert('Por favor, ingrese un título para la nota.');
      return;
    }
    if (!noteTypeId) {
      alert('Por favor, seleccione un tipo de nota válido.');
      return;
    }

    if (editingNote) {
      // Modify
      const updatedNotes = notes.map(n => {
        if (n.id === editingNote.id) {
          return {
            ...n,
            title: noteTitle.trim(),
            content: noteContent.trim(),
            type_id: noteTypeId,
            created_by_id: noteAuthorId,
            updated_at: new Date().toISOString(),
            attachments: attachmentsList
          };
        }
        return n;
      });
      setNotes(updatedNotes);
      addLog('Bitácora Notas', `Nota de Proyecto modificada: "${noteTitle.trim()}"`);
    } else {
      // Create/Add
      const newNote: ProjectNote = {
        id: `note-${Date.now()}`,
        project_id: projectId,
        type_id: noteTypeId,
        title: noteTitle.trim(),
        content: noteContent.trim(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by_id: noteAuthorId,
        active: true,
        attachments: attachmentsList
      };
      setNotes([newNote, ...notes]);
      addLog('Bitácora Notas', `Nueva Nota de Proyecto creada: "${noteTitle.trim()}"`);
    }

    setIsNoteModalOpen(false);
    setEditingNote(null);
  };

  const handleToggleNoteActive = (noteId: string, currentStatus: boolean, title: string) => {
    const updated = notes.map(n => {
      if (n.id === noteId) {
        return { ...n, active: !currentStatus, updated_at: new Date().toISOString() };
      }
      return n;
    });
    setNotes(updated);
    const actionWord = currentStatus ? 'desactivada (archivada)' : 'reactivada';
    addLog('Bitácora Notas', `Nota de Proyecto "${title}" fue ${actionWord}`);
  };

  const handleDeleteNote = (noteId: string, title: string) => {
    if (confirm(`¿Está seguro que desea eliminar de forma permanente la nota: "${title}"? esta acción es irreversible.`)) {
      setNotes(notes.filter(n => n.id !== noteId));
      addLog('Bitácora Notas', `Nota de Proyecto eliminada de forma permanente: "${title}"`);
    }
  };

  // --- ATTACHMENT HANDLERS ---
  const handleDownloadAttachment = (att: NoteAttachment) => {
    if (att.type === 'link') {
      let finalUrl = att.url.trim();
      if (!/^https?:\/\//i.test(finalUrl)) {
        finalUrl = 'https://' + finalUrl;
      }
      window.open(finalUrl, '_blank', 'noopener,noreferrer');
    } else {
      let downloadUrl = att.url;
      if (downloadUrl.startsWith('#') || (!downloadUrl.startsWith('data:') && !downloadUrl.startsWith('blob:'))) {
        // Create simulated document for preloaded files
        const content = `=== DOCUMENTO DE PROYECTO GCP ===\n\nNombre: ${att.name}\nFecha de Registro: ${formatDate(att.uploaded_at)}\nEstado: Activo\n\nEste archivo ha sido cargado satisfactoriamente en el almacenamiento del proyecto.`;
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        downloadUrl = URL.createObjectURL(blob);
      }
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = att.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const handleAddManualLink = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!attName.trim()) {
      alert('Por favor ingrese un nombre para el enlace.');
      return;
    }
    if (!attUrl.trim()) {
      alert('Por favor ingrese la URL del enlace.');
      return;
    }

    const newAtt: NoteAttachment = {
      id: `att-${Date.now()}`,
      name: attName.trim(),
      type: 'link',
      url: attUrl.trim(),
      uploaded_at: new Date().toISOString()
    };

    setAttachmentsList([...attachmentsList, newAtt]);
    setAttName('');
    setAttUrl('');
  };

  const handleDeleteAttachment = (id: string) => {
    setAttachmentsList(attachmentsList.filter(a => a.id !== id));
  };

  const executeSimulatedUpload = (file: File) => {
    setUploadingName(file.name);
    setUploadProgress(10);
    
    // Simulate active progress steps for top tier UI feeling
    let currentProgress = 10;
    const interval = setInterval(() => {
      currentProgress += 30;
      if (currentProgress >= 100) {
        clearInterval(interval);
        setUploadProgress(100);
        
        // Generate actual ObjectURL of file for true local download ability within session!
        const fileUrl = URL.createObjectURL(file);
        
        const newAtt: NoteAttachment = {
          id: `att-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          name: file.name,
          type: 'file',
          url: fileUrl,
          uploaded_at: new Date().toISOString()
        };
        
        setAttachmentsList(prev => [...prev, newAtt]);
        
        setTimeout(() => {
          setUploadProgress(null);
          setUploadingName('');
        }, 800);
      } else {
        setUploadProgress(currentProgress);
      }
    }, 150);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files) as File[];
      // Process first file or multiple
      files.forEach(file => {
        executeSimulatedUpload(file);
      });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files) as File[];
      files.forEach(file => {
        executeSimulatedUpload(file);
      });
    }
  };

  // --- HELPERS ---
  const getBadgeColors = (color: string) => {
    switch (color) {
      case 'blue':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'indigo':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'rose':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'amber':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'emerald':
        return 'bg-emerald-50 text-emerald-700 border-emerald-250';
      case 'purple':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'slate':
        return 'bg-slate-50 text-slate-700 border-slate-200';
      default:
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    }
  };

  const getBadgeIndicatorDot = (color: string) => {
    switch (color) {
      case 'blue': return 'bg-blue-500';
      case 'indigo': return 'bg-indigo-500';
      case 'rose': return 'bg-rose-500';
      case 'amber': return 'bg-amber-500';
      case 'emerald': return 'bg-emerald-500';
      case 'purple': return 'bg-purple-500';
      case 'slate': return 'bg-slate-500';
      default: return 'bg-indigo-500';
    }
  };

  const getCreatorName = (userId?: string) => {
    if (!userId) return 'Soporte del Sistema';
    const usr = users.find(u => u.id === userId);
    return usr ? `${usr.first_name} ${usr.last_name}` : 'Usuario del Sistema';
  };

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('es-ES', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoString;
    }
  };

  // --- FILTERED DATASETS ---
  // Notes are specific to the active project
  const projectNotes = notes.filter(n => n.project_id === projectId);

  // Filter notes based on filters
  const filteredNotes = projectNotes.filter(n => {
    // Search key
    const matchesSearch = 
      n.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      n.content.toLowerCase().includes(searchTerm.toLowerCase());

    // Type filter
    const matchesType = selectedTypeFilter === 'all' || n.type_id === selectedTypeFilter;

    // Status filter
    const matchesStatus = 
      showStatusFilter === 'all' ||
      (showStatusFilter === 'active' && n.active) ||
      (showStatusFilter === 'archived' && !n.active);

    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="space-y-6" id="project-notes-subtab">
      
      {/* Header and panel switcher */}
      <div className="flex border-b border-slate-200/60 pb-4 justify-between items-center flex-wrap gap-3">
        <div className="flex items-center gap-1.5 p-1 bg-white select-none">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-blue-700 rounded-lg border border-blue-200/30">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm">Bitácora de Notas por Proyecto</h3>
              <p className="text-[10.5px] text-slate-500">Historial y clasificación de incidencias, reuniones y compromisos</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200/50">
            <Settings className="w-3.5 h-3.5 text-slate-400" />
            <span>Clasificaciones administradas en <strong>Configuración Central</strong></span>
          </div>
          
          <button
            onClick={() => handleOpenNoteModal()}
            className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[11px] px-4 py-2 md:py-2.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-3xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Registrar Nueva Nota</span>
          </button>
        </div>
      </div>

      <div className="space-y-4">
        
        {/* BARRA DE FILTROS & BÚSQUEDA */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 gap-3 flex flex-col md:flex-row md:items-center justify-between shadow-3xs">
          <div className="flex-1 relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Buscar nota de proyecto por título o contenido..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-slate-200 pl-9 pr-4 py-1.5 rounded-lg text-xs font-semibold text-slate-705 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-wrap gap-2.5">
            {/* Type Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-black uppercase text-slate-450 tracking-wider">Tipo:</span>
              <select
                value={selectedTypeFilter}
                onChange={(e) => setSelectedTypeFilter(e.target.value)}
                className="bg-white border border-slate-200 px-2 py-1.5 rounded-lg text-xs font-extrabold text-slate-700 cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">📁 Todos los Tipos</option>
                {noteTypes.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name} {!t.active ? '(Inactivo)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-black uppercase text-slate-450 tracking-wider">Estado:</span>
              <div className="bg-white border border-slate-200 p-0.5 rounded-lg flex gap-1 font-semibold text-[11px]">
                <button
                  onClick={() => setShowStatusFilter('active')}
                  className={`px-2.5 py-1 rounded transition cursor-pointer text-xs ${showStatusFilter === 'active' ? 'bg-blue-50 text-blue-700 font-extrabold shadow-3xs' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Activas
                </button>
                <button
                  onClick={() => setShowStatusFilter('archived')}
                  className={`px-2.5 py-1 rounded transition cursor-pointer text-xs ${showStatusFilter === 'archived' ? 'bg-amber-50 text-amber-700 font-extrabold shadow-3xs' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Inactivas
                </button>
                <button
                  onClick={() => setShowStatusFilter('all')}
                  className={`px-2.5 py-1 rounded transition cursor-pointer text-xs ${showStatusFilter === 'all' ? 'bg-slate-150 text-slate-800 font-extrabold' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Todas
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* RENDER LIST OF NOTES */}
        {filteredNotes.length === 0 ? (
          <div className="text-center py-12 bg-slate-50/55 rounded-2xl border border-dashed border-slate-200">
            <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-black text-slate-750">No se encontraron notas</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              No hay notas de proyecto que coincidan con la búsqueda o el filtro activo. Registre una nueva nota o limpie sus opciones de búsqueda.
            </p>
            {searchTerm || selectedTypeFilter !== 'all' || showStatusFilter !== 'active' ? (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedTypeFilter('all');
                  setShowStatusFilter('active');
                }}
                className="mt-3 text-xs text-blue-600 font-bold hover:underline cursor-pointer"
              >
                Limpiar filtros de búsqueda
              </button>
            ) : null}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredNotes.map(note => {
              const associatedType = noteTypes.find(t => t.id === note.type_id);
              const isDelay = associatedType?.id === 'type-atraso' || associatedType?.name?.toLowerCase()?.includes('atras');
              
              return (
                <div 
                  key={note.id} 
                  className={`border rounded-xl p-5 bg-white transition hover:shadow-2xs flex flex-col justify-between ${
                    !note.active 
                      ? 'opacity-65 border-slate-200 bg-slate-50/70 border-dashed' 
                      : isDelay 
                        ? 'border-amber-200 bg-amber-50/5 shadow-3xs' 
                        : 'border-slate-150 shadow-3xs'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Note Header: Type and Status */}
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {associatedType ? (
                          <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold border uppercase tracking-wider flex items-center gap-1.5 ${getBadgeColors(associatedType.color)}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${getBadgeIndicatorDot(associatedType.color)}`} />
                            {associatedType.name}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold border bg-slate-150 text-slate-600">
                            Sin Tipo
                          </span>
                        )}

                        {!associatedType?.active && associatedType && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-50 text-rose-600 border border-rose-100 uppercase">
                            Tipo Inactivo
                          </span>
                        )}

                        {!note.active && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-slate-200 text-slate-700 uppercase font-mono">
                            Inactiva / Archivada
                          </span>
                        )}
                      </div>

                      {/* Top action context button for Edit / Toggle / Delete */}
                      <div className="flex items-center gap-1.5 text-slate-400 self-start shrink-0">
                        <button
                          onClick={() => handleOpenNoteModal(note)}
                          className="p-1 rounded hover:bg-slate-100 hover:text-indigo-600 transition cursor-pointer"
                          title="Editar Nota"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        
                        <button
                          onClick={() => handleToggleNoteActive(note.id, note.active, note.title)}
                          className={`p-1 rounded hover:bg-slate-100 transition cursor-pointer ${note.active ? 'hover:text-amber-600' : 'hover:text-emerald-600'}`}
                          title={note.active ? 'Desactivar / Archivar Nota' : 'Reactivar Nota'}
                        >
                          {note.active ? <Archive className="w-3.5 h-3.5" /> : <Power className="w-3.5 h-3.5" />}
                        </button>

                        <button
                          onClick={() => handleDeleteNote(note.id, note.title)}
                          className="p-1 rounded hover:bg-slate-100 hover:text-rose-600 transition cursor-pointer"
                          title="Eliminar permanentemente"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Title & Body */}
                    <div className="space-y-1.5">
                      <h4 className="font-extrabold text-sm text-slate-800 leading-snug flex items-center gap-1.5">
                        {isDelay && <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />}
                        {note.title}
                      </h4>
                      <p className="text-xs text-slate-600 leading-relaxed font-sans whitespace-pre-line">
                        {note.content}
                      </p>
                    </div>

                    {/* Render Attachments */}
                    {note.attachments && note.attachments.length > 0 && (
                      <div className="mt-3.5 pt-3.5 border-t border-slate-100 space-y-1.5">
                        <span className="text-[10px] font-bold text-slate-400 tracking-wider flex items-center gap-1 uppercase block">
                          <Paperclip className="w-3 h-3" /> Adjuntos ({note.attachments.length})
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {note.attachments.map(att => (
                            <button
                              key={att.id}
                              onClick={() => handleDownloadAttachment(att)}
                              className="text-[10.5px] font-bold bg-slate-50 hover:bg-slate-100/90 hover:border-slate-300 text-slate-700 border border-slate-200 rounded-lg px-2.5 py-1.5 inline-flex items-center gap-1.5 transition cursor-pointer max-w-full group shadow-3xs"
                              title={att.type === 'link' ? `Enlace: ${att.url}` : `Descargar ${att.name}`}
                            >
                              {att.type === 'link' ? (
                                <Link2 className="w-3 h-3 text-blue-500 shrink-0" />
                              ) : (
                                <File className="w-3 h-3 text-indigo-500 shrink-0" />
                              )}
                              <span className="truncate max-w-[150px] text-left">{att.name}</span>
                              {att.type === 'link' ? (
                                <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-blue-600 transition shrink-0" />
                              ) : (
                                <Download className="w-3 h-3 text-slate-400 group-hover:text-indigo-600 transition shrink-0" />
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Divider & Footer metadata */}
                  <div className="mt-4 pt-3 border-t border-slate-150 flex items-center justify-between text-slate-400 text-[10px] select-none">
                    <div className="flex items-center gap-1" title="Responsable de registro">
                      <User className="w-3 h-3 text-slate-400" />
                      <span className="font-semibold text-slate-500 truncate max-w-[140px]">{getCreatorName(note.created_by_id)}</span>
                    </div>
                    <div className="flex items-center gap-1" title="Última modificación">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{formatDate(note.updated_at)}</span>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}

        {/* QUICK SUMMARY GUIDE */}
        <div className="bg-blue-50/20 border border-blue-100/50 rounded-xl p-4 flex gap-3 text-xs text-blue-800">
          <Sparkles className="w-5 h-5 text-blue-500 shrink-0 self-start" />
          <div>
            <p className="font-bold">Ciclo de Vida de las Notas de Proyecto</p>
            <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
              Utilice esta bitácora para registrar incidentes técnicos, compromisos o retrasos que afecten la planificación general. Recuerde que el personal administrativo puede habilitar, crear o modificar estos tipos de clasificaciones (etiquetas) de forma global navegando a la <strong>Configuración de la Plataforma</strong> en la barra lateral.
            </p>
          </div>
        </div>
      </div>

      {/* --- MODAL: REGISTRAR / EDITAR NOTA --- */}
      {isNoteModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn" id="modal-project-note">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl border border-slate-105 overflow-hidden text-slate-805 flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-150 flex justify-between items-center select-none shrink-0">
              <h3 className="font-extrabold text-sm text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-blue-600" />
                {editingNote ? 'Modificar Nota de Proyecto' : 'Registrar Nueva Nota en Proyecto'}
              </h3>
              <button 
                onClick={() => setIsNoteModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-200/50 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form with scrollable body */}
            <form onSubmit={handleSaveNote} className="flex-1 overflow-y-auto p-6 space-y-4 text-slate-800 max-h-[calc(90vh-120px)]">
              {/* Title field */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Título de la Nota</label>
                <input
                  type="text"
                  required
                  placeholder="Ej., Bloqueo por falta de credenciales de desarrollo"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  className="w-full bg-slate-50 hover:bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Note Type & Author Line */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Tipo/Clasificación</label>
                  <select
                    value={noteTypeId}
                    onChange={(e) => setNoteTypeId(e.target.value)}
                    className="w-full bg-slate-50 hover:bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:outline-none cursor-pointer"
                  >
                    <option value="" disabled>Seleccione clasificación...</option>
                    {noteTypes.filter(t => t.active || t.id === noteTypeId).map(t => (
                      <option key={t.id} value={t.id}>
                        🏷️ {t.name} {!t.active ? '(Inactivo)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Registrado por</label>
                  <select
                    value={noteAuthorId}
                    onChange={(e) => setNoteAuthorId(e.target.value)}
                    className="w-full bg-slate-50 hover:bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:outline-none cursor-pointer"
                  >
                    {users.map(u => (
                      <option key={u.id} value={u.id}>
                        👤 {u.first_name} {u.last_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Content field */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Contenido de la Nota</label>
                <textarea
                  placeholder="Detalle los acuerdos, impedimentos, atrasos o incidencias técnicas ocurridas en esta etapa."
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  rows={4}
                  required
                  className="w-full bg-slate-50 hover:bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-850 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none leading-relaxed"
                />
              </div>

              {/* --- INTEGRATED SECCIÓN DE ADJUNTOS EN LA NOTA --- */}
              <div className="space-y-3 pt-4 border-t border-slate-150">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5 text-blue-600 animate-pulse" /> Adjuntos y Recursos ({attachmentsList.length})
                  </label>
                  <div className="flex gap-1 bg-slate-100 p-0.5 rounded-lg select-none">
                    <button
                      type="button"
                      onClick={() => setAttType('file')}
                      className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded transition-all cursor-pointer ${
                        attType === 'file' ? 'bg-white text-slate-850 shadow-3xs font-black' : 'text-slate-400 hover:text-slate-700'
                      }`}
                    >
                      📁 Archivo
                    </button>
                    <button
                      type="button"
                      onClick={() => setAttType('link')}
                      className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded transition-all cursor-pointer ${
                        attType === 'link' ? 'bg-white text-slate-850 shadow-3xs font-black' : 'text-slate-400 hover:text-slate-700'
                      }`}
                    >
                      🔗 Enlace URL
                    </button>
                  </div>
                </div>

                {/* Input block according to active selection */}
                {attType === 'file' ? (
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById('note-file-uploader')?.click()}
                    className={`border-2 border-dashed rounded-xl p-4 text-center transition cursor-pointer flex flex-col items-center justify-center space-y-1 select-none ${
                      isDragging 
                        ? 'border-blue-500 bg-blue-50/40' 
                        : 'border-slate-200 hover:border-slate-350 hover:bg-slate-50/20 bg-slate-50/10'
                    }`}
                  >
                    <input
                      type="file"
                      multiple
                      id="note-file-uploader"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <UploadCloud className={`w-8 h-8 ${isDragging ? 'text-blue-500 animate-bounce' : 'text-slate-400'}`} />
                    <span className="text-xs font-extrabold text-slate-700">
                      Arrastre archivos o haga clic para buscar
                    </span>
                    <span className="text-[9.5px] text-slate-400">
                      Se cargará en la bitácora del proyecto de manera local.
                    </span>
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div className="space-y-1">
                        <span className="text-[9px] uppercase font-black text-slate-400">Nombre descriptivo</span>
                        <input
                          type="text"
                          placeholder="Ej: Registro Oficial o Figma"
                          value={attName}
                          onChange={(e) => setAttName(e.target.value)}
                          className="w-full bg-white border border-slate-200 px-2.5 py-1.5 rounded-lg text-xs font-semibold focus:outline-none text-slate-850"
                        />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[9px] uppercase font-black text-slate-400">URL del Enlace</span>
                        <input
                          type="text"
                          placeholder="https://example.com/item"
                          value={attUrl}
                          onChange={(e) => setAttUrl(e.target.value)}
                          className="w-full bg-white border border-slate-200 px-2.5 py-1.5 rounded-lg text-xs font-semibold focus:outline-none text-slate-850"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddManualLink}
                      className="w-full bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-[10px] py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer uppercase tracking-wider"
                    >
                      <Plus className="w-3.5 h-3.5" /> Vincular Enlace a Nota
                    </button>
                  </div>
                )}

                {/* Loading / Uploading state representation */}
                {uploadProgress !== null && (
                  <div className="bg-blue-50/50 border border-blue-105 rounded-xl p-3 space-y-1.5 animate-fadeIn">
                    <div className="flex justify-between items-center text-[10.5px]">
                      <span className="font-bold text-blue-800 truncate max-w-[80%] flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 animate-spin" /> Subiendo: {uploadingName}
                      </span>
                      <span className="font-mono text-blue-600 font-extrabold">{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-blue-600 h-1.5 transition-all duration-150" style={{ width: `${uploadProgress}%` }} />
                    </div>
                  </div>
                )}

                {/* Render current attached list with ability to edit/delete */}
                {attachmentsList.length > 0 && (
                  <div className="space-y-1.5 max-h-[145px] overflow-y-auto pr-1">
                    {attachmentsList.map((att) => (
                      <div
                        key={att.id}
                        className="bg-slate-100 hover:bg-indigo-50/10 border border-slate-200 hover:border-indigo-200 rounded-lg p-2.5 flex items-center justify-between transition group"
                      >
                        <div className="flex items-center gap-2 truncate flex-1">
                          {att.type === 'link' ? (
                            <Link2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                          ) : (
                            <File className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                          )}
                          <div className="truncate text-left select-none">
                            <span className="text-xs font-bold text-slate-850 truncate block leading-tight">{att.name}</span>
                            <span className="text-[10px] text-slate-450 block font-mono truncate">
                              {att.type === 'link' ? att.url : 'Archivo cargado'}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteAttachment(att.id)}
                          className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-white transition cursor-pointer shrink-0"
                          title="Remover adjunto"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions footer wrapper inside modal form */}
              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-150 select-none shrink-0">
                <button
                  type="button"
                  onClick={() => setIsNoteModalOpen(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-extrabold text-xs px-4 py-2.5 rounded-lg transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-lg transition shadow-sm cursor-pointer"
                >
                  {editingNote ? 'Guardar Cambios' : 'Registrar Nota'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
