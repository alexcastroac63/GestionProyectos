/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TestSuite, TestCase, TestRun } from '../../../types';
import { ITestSuiteRepository, ITestCaseRepository, ITestRunRepository } from '../../../domain/repositories/qa.repository';
import { LocalRepository } from './localRepository';

/**
 * Repositorio de Suites de Prueba estructurado para localStorage.
 */
export class TestSuiteLocalRepository extends LocalRepository<TestSuite> implements ITestSuiteRepository {
  constructor() {
    super('gcp_test_suites');
  }

  async getSuitesByProject(projectId: string): Promise<TestSuite[]> {
    const all = await this.getAll();
    return all.filter(ts => ts.project_id === projectId);
  }
}

/**
 * Repositorio de Casos de Prueba mapeados para localStorage.
 */
export class TestCaseLocalRepository extends LocalRepository<TestCase> implements ITestCaseRepository {
  constructor() {
    super('gcp_test_cases');
  }

  async getTestCasesBySuite(suiteId: string): Promise<TestCase[]> {
    const all = await this.getAll();
    return all.filter(tc => tc.suite_id === suiteId);
  }
}

/**
 * Repositorio de Ejecuciones e Historial de QA respaldado por localStorage.
 */
export class TestRunLocalRepository extends LocalRepository<TestRun> implements ITestRunRepository {
  constructor() {
    super('gcp_test_runs');
  }

  async getRunsByTestCase(testCaseId: string): Promise<TestRun[]> {
    const all = await this.getAll();
    return all.filter(tr => tr.test_case_id === testCaseId);
  }
}
