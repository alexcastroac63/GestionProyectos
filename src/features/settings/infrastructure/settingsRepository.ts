/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { safeLoad, safeSave } from '../../../shared/storage/localStorageAdapter';

export interface ISmtpConfig {
  host: string;
  port: string;
  account: string;
}

export interface ISettingsRepositoryPort {
  loadSmtpConfig(): ISmtpConfig;
  saveSmtpConfig(config: ISmtpConfig): void;
  loadClients(): string[];
  saveClients(clients: string[]): void;
  loadSponsors(): string[];
  saveSponsors(sponsors: string[]): void;
}

export class LocalSettingsRepository implements ISettingsRepositoryPort {
  loadSmtpConfig(): ISmtpConfig {
    return {
      host: localStorage.getItem('gcp_smtp_host') || 'smtp.gmail.com',
      port: localStorage.getItem('gcp_smtp_port') || '587',
      account: localStorage.getItem('gcp_smtp_account') || ''
    };
  }

  saveSmtpConfig(config: ISmtpConfig): void {
    localStorage.setItem('gcp_smtp_host', config.host);
    localStorage.setItem('gcp_smtp_port', config.port);
    localStorage.setItem('gcp_smtp_account', config.account);
  }

  loadClients(): string[] {
    return safeLoad<string[]>('gcp_clients_list', [
      'Corporación Global S.A de C.V', 
      'Distribuidora Logística S.A de C.V'
    ]);
  }

  saveClients(clients: string[]): void {
    safeSave('gcp_clients_list', clients);
  }

  loadSponsors(): string[] {
    return safeLoad<string[]>('gcp_sponsors_list', [
      'Sponsor Principal'
    ]);
  }

  saveSponsors(sponsors: string[]): void {
    safeSave('gcp_sponsors_list', sponsors);
  }
}

export const settingsRepository: ISettingsRepositoryPort = new LocalSettingsRepository();
