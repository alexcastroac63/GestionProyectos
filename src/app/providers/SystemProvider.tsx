import React, { createContext, useContext, useState, useEffect } from 'react';
import { Tenant, User, NoteType } from '../../types';
import { systemRepository } from '../../shared/infrastructure/systemRepository';
import { safeLoad, safeSave } from '../../shared/storage/localStorageAdapter';
import { settingsRepository } from '../../features/settings/infrastructure/settingsRepository';

export interface SystemContextType {
  tenants: Tenant[];
  setTenants: React.Dispatch<React.SetStateAction<Tenant[]>>;
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  noteTypes: NoteType[];
  setNoteTypes: React.Dispatch<React.SetStateAction<NoteType[]>>;
  logs: { id: string; user: string; text: string; time: string }[];
  setLogs: React.Dispatch<React.SetStateAction<{ id: string; user: string; text: string; time: string }[]>>;
  addLog: (user: string, action: string) => void;
  loggedInUser: User | null;
  setLoggedInUser: React.Dispatch<React.SetStateAction<User | null>>;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
  isProjectsMenuOpen: boolean;
  setIsProjectsMenuOpen: (open: boolean) => void;
  isSettingsMenuOpen: boolean;
  setIsSettingsMenuOpen: (open: boolean) => void;
  settingsSubTab: 'smtp' | 'clients' | 'scrum_rules' | 'tenants' | 'note_types';
  setSettingsSubTab: (tab: 'smtp' | 'clients' | 'scrum_rules' | 'tenants' | 'note_types') => void;
  deleteConfirmState: { isOpen: boolean; title: string; message: string; onConfirm: () => void } | null;
  setDeleteConfirmState: React.Dispatch<React.SetStateAction<{ isOpen: boolean; title: string; message: string; onConfirm: () => void } | null>>;
  smtpPassword: string;
  setSmtpPassword: React.Dispatch<React.SetStateAction<string>>;
  clientsList: string[];
  setClientsList: React.Dispatch<React.SetStateAction<string[]>>;
  sponsorsList: string[];
  setSponsorsList: React.Dispatch<React.SetStateAction<string[]>>;
}

export const SystemContext = createContext<SystemContextType | undefined>(undefined);

export const SystemProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const INITIAL_TENANTS: Tenant[] = [
    {
      id: 'grupo-campestre',
      name: 'Grupo Campestre',
      description: 'Suscripción corporativa principal para la gestión de marcas de alimentación y avícolas.',
      domain: 'campestre.com.sv',
      plan: 'Premium',
      status: 'Active'
    }
  ];

  const INITIAL_NOTE_TYPES: NoteType[] = [
    { id: 'type-general', name: 'Generales', description: 'Notas e información general de alcance, minutas de reuniones.', color: 'indigo', active: true },
    { id: 'type-atraso', name: 'Atrasos', description: 'Alertas críticas sobre desviaciones.', color: 'amber', active: true },
    { id: 'type-tecnica', name: 'Especificaciones Técnicas', description: 'Definiciones de arquitectura de software.', color: 'emerald', active: true }
  ];

  const [tenants, setTenants] = useState<Tenant[]>(() => systemRepository.loadTenants(INITIAL_TENANTS));
  const [users, setUsers] = useState<User[]>(() => systemRepository.loadUsers());
  const [noteTypes, setNoteTypes] = useState<NoteType[]>(() => systemRepository.loadNoteTypes(INITIAL_NOTE_TYPES));
  
  const [logs, setLogs] = useState<{ id: string; user: string; text: string; time: string }[]>([
    { id: '1', user: 'Carlos Pérez (PM)', text: 'Creó el cronograma de actividades con 6 fases.', time: '12:45' },
    { id: '2', user: 'Andrés Mendoza (DBA)', text: 'Registró el esquema recomendado en PostgreSQL.', time: '13:12' },
    { id: '3', user: 'Valentina Rojas (QA)', text: 'Agregó la Suite 01 de pruebas de la API Multi-tenant.', time: '14:24' }
  ]);

  const addLog = (user: string, action: string) => {
    const time = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    setLogs(prev => [
      { id: Date.now().toString(), user, text: action, time },
      ...prev.slice(0, 49)
    ]);
  };

  const [loggedInUser, setLoggedInUser] = useState<User | null>(() => {
    const loaded = safeLoad<any>('gcp_logged_in_user', null);
    if (loaded && typeof loaded === 'object') {
      if ('user' in loaded && loaded.user) {
        return loaded.user as User;
      }
      return loaded as User;
    }
    return null;
  });

  useEffect(() => {
    if (loggedInUser === null) {
      localStorage.removeItem('gcp_logged_in_user');
    } else {
      let existingToken: string | undefined = undefined;
      try {
        const raw = localStorage.getItem('gcp_logged_in_user');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object' && parsed.token) {
            existingToken = parsed.token;
          }
        }
      } catch (err) {
        console.warn('Failed to parse existing gcp_logged_in_user for token preservation:', err);
      }

      if (existingToken) {
        localStorage.setItem('gcp_logged_in_user', JSON.stringify({
          user: loggedInUser,
          token: existingToken
        }));
      } else {
        safeSave('gcp_logged_in_user', loggedInUser);
      }
    }
  }, [loggedInUser]);

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [isProjectsMenuOpen, setIsProjectsMenuOpen] = useState<boolean>(true);
  const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState<boolean>(true);
  const [settingsSubTab, setSettingsSubTab] = useState<'smtp' | 'clients' | 'scrum_rules' | 'tenants' | 'note_types'>('smtp');
  const [deleteConfirmState, setDeleteConfirmState] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void } | null>(null);

  // SMTP password (persistent)
  const [smtpPassword, setSmtpPassword] = useState<string>(() => {
    return settingsRepository.loadSmtpConfig().password || '';
  });

  // Clients & Sponsors Lists (bound to Settings Repository)
  const [clientsList, setClientsList] = useState<string[]>(() => {
    return settingsRepository.loadClients();
  });
  const [sponsorsList, setSponsorsList] = useState<string[]>(() => {
    return settingsRepository.loadSponsors();
  });

  const hasSynced = React.useRef(false);

  // Fetch users from centralized server database on startup to synchronize across all clients/browsers
  useEffect(() => {
    const syncUsersFromServer = async () => {
      try {
        const res = await fetch('/api/users');
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.users && Array.isArray(data.users) && data.users.length > 0) {
            setUsers(data.users);
            localStorage.setItem('gcp_users', JSON.stringify(data.users));
          } else {
            // Server has no users list yet, populate it with current local users
            const localUsers = systemRepository.loadUsers();
            if (localUsers && localUsers.length > 0) {
              await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ users: localUsers })
              });
            }
          }
        }
      } catch (err) {
        console.error('Failed to sync users from server on mount:', err);
      } finally {
        setTimeout(() => {
          hasSynced.current = true;
        }, 800);
      }
    };
    syncUsersFromServer();
  }, []);

  // Sync state with repository on changes
  useEffect(() => {
    systemRepository.saveTenants(tenants);
  }, [tenants]);

  useEffect(() => {
    if (hasSynced.current) {
      systemRepository.saveUsers(users);
    }
  }, [users]);

  useEffect(() => {
    systemRepository.saveNoteTypes(noteTypes);
  }, [noteTypes]);

  return (
    <SystemContext.Provider value={{
      tenants, setTenants, users, setUsers, noteTypes, setNoteTypes, logs, setLogs, addLog,
      loggedInUser, setLoggedInUser, activeTab, setActiveTab,
      isMobileMenuOpen, setIsMobileMenuOpen, isProjectsMenuOpen, setIsProjectsMenuOpen,
      isSettingsMenuOpen, setIsSettingsMenuOpen, settingsSubTab, setSettingsSubTab,
      deleteConfirmState, setDeleteConfirmState,
      smtpPassword, setSmtpPassword,
      clientsList, setClientsList,
      sponsorsList, setSponsorsList
    }}>
      {children}
    </SystemContext.Provider>
  );
};

export const useSystemStore = () => {
  const context = useContext(SystemContext);
  if (!context) throw new Error('useSystemStore debe utilizarse dentro de SystemProvider o AppProviders');
  return context;
};
