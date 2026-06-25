import { TestSuite, TestCase } from '../../../types';

/**
 * Calculates the QA pass rate for a given project's test cases.
 */
export function getQaPassRate(
  testSuites: TestSuite[] = [],
  testCases: TestCase[] = [],
  projectId: string
): number {
  const safeSuites = testSuites || [];
  const safeCases = testCases || [];
  const projectSuites = safeSuites.filter(s => s.project_id === projectId);
  const suiteIds = projectSuites.map(s => s.id);
  const suiteCases = safeCases.filter(c => suiteIds.includes(c.suite_id));
  const passedCasesCount = suiteCases.filter(c => c.status === 'PASSED').length;
  
  return suiteCases.length > 0 ? Math.round((passedCasesCount / suiteCases.length) * 100) : 100;
}
