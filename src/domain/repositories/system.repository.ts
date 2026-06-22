/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Tenant, User, NoteType } from '../../types';

export interface ISystemRepository {
  loadTenants(initialTenants: Tenant[]): Promise<Tenant[]>;
  saveTenants(tenants: Tenant[]): Promise<void>;
  loadUsers(): Promise<User[]>;
  saveUsers(users: User[]): Promise<void>;
  loadNoteTypes(initialNoteTypes: NoteType[]): Promise<NoteType[]>;
  saveNoteTypes(noteTypes: NoteType[]): Promise<void>;
}
