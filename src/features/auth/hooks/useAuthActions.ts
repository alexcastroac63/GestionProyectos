import { User } from '../../../types';

interface UseAuthActionsProps {
  loggedInUser: User | null;
  setLoggedInUser: (user: User | null) => void;
  addLog: (user: string, action: string) => void;
}

export function useAuthActions({ loggedInUser, setLoggedInUser, addLog }: UseAuthActionsProps) {
  const handleLogout = () => {
    if (loggedInUser) {
      const storedName = `${loggedInUser.first_name || ''} ${loggedInUser.last_name || ''}`.trim() || 'Usuario';
      addLog(storedName, 'Cerró su sesión de la plataforma.');
    }
    setLoggedInUser(null);
    localStorage.removeItem('gcp_logged_in_user');
  };

  return {
    handleLogout
  };
}
