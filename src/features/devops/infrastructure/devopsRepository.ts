import { GitCommit, PullRequest } from '../../../types';
import { safeLoad, safeSave } from '../../../shared/storage/localStorageAdapter';

const DEFAULT_COMMITS: GitCommit[] = [
  {
    id: 'commit-1',
    author: 'Alex Castro',
    message: 'feat: add postgresql DDL tables and schema diagrams',
    branch: 'main',
    hash: 'aef783b',
    timestamp: new Date(Date.now() - 3600000 * 24 * 3).toISOString() // 3 days ago
  },
  {
    id: 'commit-2',
    author: 'Alex Castro',
    message: 'fix: resolve memory leak on workspace telemetry dashboard',
    branch: 'development',
    hash: '4f2910c',
    timestamp: new Date(Date.now() - 3600000 * 24).toISOString() // 1 day ago
  },
  {
    id: 'commit-3',
    author: 'PMO Builder',
    message: 'feat: build modular TabContentRenderer for routing delegation',
    branch: 'main',
    hash: 'cb81a2f',
    timestamp: new Date(Date.now() - 3600000 * 4).toISOString() // 4 hours ago
  },
  {
    id: 'commit-4',
    author: 'PMO Builder',
    message: 'fix: resolve Uncaught TypeError filtering undefined costs',
    branch: 'main',
    hash: '9a2bc8e',
    timestamp: new Date(Date.now() - 3600000 * 1.5).toISOString() // 1.5 hours ago
  }
];

const DEFAULT_PRS: PullRequest[] = [
  {
    id: 'pr-1',
    number: 104,
    title: 'feat: add robust full-stack telemetry and live CPU analytics',
    author: 'Alex Castro',
    status: 'OPEN',
    created_at: new Date(Date.now() - 3600000 * 24 * 2).toISOString() // 2 days ago
  },
  {
    id: 'pr-2',
    number: 103,
    title: 'fix: update project budgets and category cost calculations',
    author: 'PMO Builder',
    status: 'MERGED',
    created_at: new Date(Date.now() - 3600000 * 24 * 5).toISOString() // 5 days ago
  },
  {
    id: 'pr-3',
    number: 102,
    title: 'feat: add dynamic mockup canvas interactive connectors',
    author: 'Alex Castro',
    status: 'MERGED',
    created_at: new Date(Date.now() - 3600000 * 24 * 7).toISOString() // 7 days ago
  }
];

export const devopsRepository = {
  loadCommits(): GitCommit[] {
    return safeLoad<GitCommit[]>('gcp_devops_commits', DEFAULT_COMMITS);
  },

  saveCommits(commits: GitCommit[]): void {
    safeSave('gcp_devops_commits', commits);
  },

  loadPRs(): PullRequest[] {
    return safeLoad<PullRequest[]>('gcp_devops_prs', DEFAULT_PRS);
  },

  savePRs(prs: PullRequest[]): void {
    safeSave('gcp_devops_prs', prs);
  }
};
