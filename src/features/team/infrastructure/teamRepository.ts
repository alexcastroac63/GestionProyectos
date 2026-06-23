/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { User } from '../../../types';
import { systemRepository } from '../../../shared/infrastructure/systemRepository';

export interface ITeamRepositoryPort {
  loadUsers(): User[];
  saveUsers(users: User[]): void;
}

export class LocalTeamRepository implements ITeamRepositoryPort {
  loadUsers(): User[] {
    return systemRepository.loadUsers();
  }

  saveUsers(users: User[]): void {
    systemRepository.saveUsers(users);
  }
}

export class ApiTeamRepository implements ITeamRepositoryPort {
  loadUsers(): User[] {
    // Falls back to systemRepository structure or queries custom endpoint
    return systemRepository.loadUsers();
  }

  saveUsers(users: User[]): void {
    systemRepository.saveUsers(users);
    fetch('/api/team/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(users),
    }).catch(() => {});
  }
}

export const teamRepository: ITeamRepositoryPort = new LocalTeamRepository();
