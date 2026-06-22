import { Tenant, User, NoteType } from '../../types';
import { safeLoad, safeSave } from '../storage/localStorageAdapter';
import { INITIAL_USERS } from '../../data';

export const systemRepository = {
  loadTenants(initialTenants: Tenant[]): Tenant[] {
    return safeLoad<Tenant[]>('gcp_tenants', initialTenants);
  },

  saveTenants(tenants: Tenant[]): void {
    safeSave('gcp_tenants', tenants);
  },

  loadUsers(): User[] {
    const list = safeLoad<User[]>('gcp_users', INITIAL_USERS);
    return list.map(u => ({ ...u, tenant_id: u.tenant_id || 'grupo-campestre' }));
  },

  saveUsers(users: User[]): void {
    safeSave('gcp_users', users);
  },

  loadNoteTypes(initialNoteTypes: NoteType[]): NoteType[] {
    return safeLoad<NoteType[]>('gcp_project_note_types', initialNoteTypes);
  },

  saveNoteTypes(noteTypes: NoteType[]): void {
    safeSave('gcp_project_note_types', noteTypes);
  }
};
