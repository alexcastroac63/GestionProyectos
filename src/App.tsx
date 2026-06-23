/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppProviders, useSystemStore, useProjectsStore } from './app/AppProviders';
import { AuthFlow } from './features/auth/components/AuthFlow';
import { useSessionVerification } from './features/auth/hooks/useSessionVerification';
import { useAuthActions } from './features/auth/hooks/useAuthActions';
import { useProjectActions } from './features/projects/hooks/useProjectActions';
import { AppShell } from './app/layout/AppShell';
import { TabContentRenderer } from './app/routing/TabContentRenderer';

export default function App() {
  return (
    <AppProviders>
      <AppContent />
    </AppProviders>
  );
}

function AppContent() {
  const {
    loggedInUser,
    setLoggedInUser,
    addLog
  } = useSystemStore();

  const {
    setProjects
  } = useProjectsStore();

  const { handleLogout } = useAuthActions({ loggedInUser, setLoggedInUser, addLog });

  // Active session integrity loop check to detect and prevent LS tampering
  useSessionVerification({ loggedInUser, handleLogout });

  const { updateProjectStatus } = useProjectActions({ setProjects, addLog });

  if (!loggedInUser) {
    return <AuthFlow />;
  }

  return (
    <AppShell
      handleLogout={handleLogout}
      updateProjectStatus={updateProjectStatus}
    >
      <TabContentRenderer />
    </AppShell>
  );
}

