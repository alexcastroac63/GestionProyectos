import { TestSuite, TestCase, TestRun } from '../../../types';
import { safeLoad, safeSave } from '../../../shared/storage/localStorageAdapter';
import { INITIAL_TEST_SUITES, INITIAL_TEST_CASES, INITIAL_TEST_RUNS } from '../../../data';

export const qaRepository = {
  loadTestSuites(): TestSuite[] {
    return safeLoad<TestSuite[]>('gcp_test_suites', INITIAL_TEST_SUITES);
  },

  saveTestSuites(suites: TestSuite[]): void {
    safeSave('gcp_test_suites', suites);
  },

  loadTestCases(): TestCase[] {
    return safeLoad<TestCase[]>('gcp_test_cases', INITIAL_TEST_CASES);
  },

  saveTestCases(cases: TestCase[]): void {
    safeSave('gcp_test_cases', cases);
  },

  loadTestRuns(): TestRun[] {
    return safeLoad<TestRun[]>('gcp_test_runs', INITIAL_TEST_RUNS);
  },

  saveTestRuns(runs: TestRun[]): void {
    safeSave('gcp_test_runs', runs);
  }
};
