/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Tenant, User, NoteType } from '../../../types';
import { ISystemRepository } from '../../../domain/repositories/system.repository';

export class ApiSystemRepository implements ISystemRepository {
  async loadTenants(initialTenants: Tenant[]): Promise<Tenant[]> {
    try {
      const res = await fetch('/api/tenants');
      if (!res.ok) throw new Error('Failed to fetch tenants');
      return await res.json();
    } catch {
      // Fallback
      return initialTenants;
    }
  }

  async saveTenants(tenants: Tenant[]): Promise<void> {
    await fetch('/api/tenants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tenants)
    });
  }

  async loadUsers(): Promise<User[]> {
    try {
      const res = await fetch('/api/users');
      if (!res.ok) throw new Error('Failed to fetch users');
      return await res.json();
    } catch {
      return [];
    }
  }

  async saveUsers(users: User[]): Promise<void> {
    await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(users)
    });
  }

  async loadNoteTypes(initialNoteTypes: NoteType[]): Promise<NoteType[]> {
    try {
      const res = await fetch('/api/note-types');
      if (!res.ok) throw new Error('Failed to fetch note types');
      return await res.json();
    } catch {
      return initialNoteTypes;
    }
  }

  async saveNoteTypes(noteTypes: NoteType[]): Promise<void> {
    await fetch('/api/note-types', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(noteTypes)
    });
  }
}
