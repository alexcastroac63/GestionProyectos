/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TestSuite, TestCase, TestRun } from '../../types';
import { IRepository } from './repository.interface';

export interface ITestSuiteRepository extends IRepository<TestSuite> {
  getSuitesByProject(projectId: string): Promise<TestSuite[]>;
}

export interface ITestCaseRepository extends IRepository<TestCase> {
  getTestCasesBySuite(suiteId: string): Promise<TestCase[]>;
}

export interface ITestRunRepository extends IRepository<TestRun> {
  getRunsByTestCase(testCaseId: string): Promise<TestRun[]>;
}
