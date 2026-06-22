/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { User, Tenant } from '../../../types';
import { IUserRepository, ITenantRepository } from '../../../domain/repositories/user.repository';
import { LocalRepository } from './localRepository';

/**
 * Repositorio de Usuarios respaldado por localStorage.
 */
export class UserLocalRepository extends LocalRepository<User> implements IUserRepository {
  constructor() {
    super('gcp_users');
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const all = await this.getAll();
    return all.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
  }

  async getUsersByTenant(tenantId: string): Promise<User[]> {
    const all = await this.getAll();
    return all.filter(u => u.tenant_id === tenantId);
  }
}

/**
 * Repositorio de Tenants multi-inquilino respaldado por localStorage.
 */
export class TenantLocalRepository extends LocalRepository<Tenant> implements ITenantRepository {
  constructor() {
    super('gcp_tenants');
  }

  async getTenantByDomain(domain: string): Promise<Tenant | null> {
    const all = await this.getAll();
    return all.find(t => t.domain.toLowerCase() === domain.toLowerCase()) || null;
  }
}
