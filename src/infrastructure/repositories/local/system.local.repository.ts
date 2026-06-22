/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Tenant, User, NoteType } from '../../../types';
import { ISystemRepository } from '../../../domain/repositories/system.repository';
import { safeLoad, safeSave } from '../../../shared/storage/localStorageAdapter';
import { INITIAL_USERS } from '../../../data';

export class LocalSystemRepository implements ISystemRepository {
  async loadTenants(initialTenants: Tenant[]): Promise<Tenant[]> {
    return safeLoad<Tenant[]>('gcp_tenants', initialTenants);
  }

  async saveTenants(tenants: Tenant[]): Promise<void> {
    safeSave('gcp_tenants', tenants);
  }

  async loadUsers(): Promise<User[]> {
    const list = safeLoad<User[]>('gcp_users', INITIAL_USERS);
    return list.map(u => ({ ...u, tenant_id: u.tenant_id || 'grupo-campestre' }));
  }

  async saveUsers(users: User[]): Promise<void> {
    safeSave('gcp_users', users);
  }

  async loadNoteTypes(initialNoteTypes: NoteType[]): Promise<NoteType[]> {
    return safeLoad<NoteType[]>('gcp_project_note_types', initialNoteTypes);
  }

  async saveNoteTypes(noteTypes: NoteType[]): Promise<void> {
    safeSave('gcp_project_note_types', noteTypes);
  }
}
