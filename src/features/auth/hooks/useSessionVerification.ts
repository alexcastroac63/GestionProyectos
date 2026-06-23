import { useEffect } from 'react';
import { User } from '../../../types';

interface UseSessionVerificationProps {
  loggedInUser: User | null;
  handleLogout: () => void;
}

export function useSessionVerification({ loggedInUser, handleLogout }: UseSessionVerificationProps) {
  useEffect(() => {
    const verifySessionOnBackend = async () => {
      const local = localStorage.getItem('gcp_logged_in_user');
      if (local && local !== "undefined" && local !== "null") {
        try {
          const parsed = JSON.parse(local);
          if (parsed && typeof parsed === 'object' && parsed.token) {
            const res = await fetch('/api/verify-session', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ token: parsed.token })
            });
            if (!res.ok) {
              console.warn("Session signature mismatch or expired. Log out triggered.");
              handleLogout();
            }
          }
        } catch (e) {
          console.error("Failed to verify signature", e);
        }
      }
    };

    verifySessionOnBackend();
  }, [handleLogout]);
}
