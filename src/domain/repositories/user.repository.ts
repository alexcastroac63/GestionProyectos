/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { User, Tenant } from '../../types';
import { IRepository } from './repository.interface';

export interface IUserRepository extends IRepository<User> {
  getUserByEmail(email: string): Promise<User | null>;
  getUsersByTenant(tenantId: string): Promise<User[]>;
}

export interface ITenantRepository extends IRepository<Tenant> {
  getTenantByDomain(domain: string): Promise<Tenant | null>;
}
