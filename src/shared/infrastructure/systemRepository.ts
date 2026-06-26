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
    let changed = false;
    const patchedList = list.map(u => {
      let email = u.email;
      if (email.toLowerCase() === 'sa@campestre.com.sv') {
        email = 'proyectosticampestre@gmail.com';
        changed = true;
      }
      return { ...u, email, tenant_id: u.tenant_id || 'grupo-campestre' };
    });
    if (changed) {
      safeSave('gcp_users', patchedList);
    }
    return patchedList;
  },

  saveUsers(users: User[]): void {
    safeSave('gcp_users', users);
    fetch('/api/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ users })
    }).catch(err => {
      console.error('Failed to sync users with server:', err);
    });
  },

  loadNoteTypes(initialNoteTypes: NoteType[]): NoteType[] {
    return safeLoad<NoteType[]>('gcp_project_note_types', initialNoteTypes);
  },

  saveNoteTypes(noteTypes: NoteType[]): void {
    safeSave('gcp_project_note_types', noteTypes);
  }
};
