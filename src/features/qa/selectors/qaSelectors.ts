import { TestSuite, TestCase } from '../../../types';

/**
 * Calculates the QA pass rate for a given project's test cases.
 */
export function getQaPassRate(
  testSuites: TestSuite[],
  testCases: TestCase[],
  projectId: string
): number {
  const projectSuites = testSuites.filter(s => s.project_id === projectId);
  const suiteIds = projectSuites.map(s => s.id);
  const suiteCases = testCases.filter(c => suiteIds.includes(c.suite_id));
  const passedCasesCount = suiteCases.filter(c => c.status === 'PASSED').length;
  
  return suiteCases.length > 0 ? Math.round((passedCasesCount / suiteCases.length) * 100) : 100;
}
