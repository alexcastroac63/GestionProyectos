/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ProjectLocalRepository, ProjectActivityLocalRepository, ProjectCostLocalRepository } from './local/project.local.repository';
import { WorkItemLocalRepository, SprintLocalRepository } from './local/workitem.local.repository';
import { TestSuiteLocalRepository, TestCaseLocalRepository, TestRunLocalRepository } from './local/qa.local.repository';
import { UserLocalRepository, TenantLocalRepository } from './local/user.local.repository';

/**
 * Registry centralizado de Repositorios de Dominio.
 * Actualmente configurado con adaptadores de localStorage.
 * Cambiando las instancias exportadas aquí a futuros adaptadores HTTP (real API)
 * se migra todo el sistema sin costo de refatorización en la capa UI.
 */
export const projectRepository = new ProjectLocalRepository();
export const projectActivityRepository = new ProjectActivityLocalRepository();
export const projectCostRepository = new ProjectCostLocalRepository();

export const workItemRepository = new WorkItemLocalRepository();
export const sprintRepository = new SprintLocalRepository();

export const testSuiteRepository = new TestSuiteLocalRepository();
export const testCaseRepository = new TestCaseLocalRepository();
export const testRunRepository = new TestRunLocalRepository();

export const userRepository = new UserLocalRepository();
export const _tenantRepository = new TenantLocalRepository(); // Prefijo de uso interno para evitar colisiones
