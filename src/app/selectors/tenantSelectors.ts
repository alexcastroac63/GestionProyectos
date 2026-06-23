import { Project, User } from '../../types';

/**
 * Filters projects based on the logged-in user's tenant ID.
 * Falls back to 'grupo-campestre' if no user is logged in.
 */
export function getSegmentedProjects(projects: Project[], loggedInUser: User | null): Project[] {
  return projects.filter(p => 
    !p.tenant_id || 
    p.tenant_id === loggedInUser?.tenant_id || 
    (!loggedInUser && p.tenant_id === 'grupo-campestre')
  );
}

/**
 * Filters users based on the logged-in user's tenant ID.
 * Falls back to 'grupo-campestre' if no user is logged in.
 */
export function getSegmentedUsers(users: User[], loggedInUser: User | null): User[] {
  return users.filter(u => 
    !u.tenant_id || 
    u.tenant_id === loggedInUser?.tenant_id || 
    (!loggedInUser && u.tenant_id === 'grupo-campestre')
  );
}
