/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { SystemProvider } from './SystemProvider';
import { ProjectsProvider } from './ProjectsProvider';
import { ScrumProvider } from './ScrumProvider';
import { QaProvider } from './QaProvider';
import { BacklogProvider } from './BacklogProvider';
import { MockupProvider } from './MockupProvider';

export const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <SystemProvider>
      <ProjectsProvider>
        <ScrumProvider>
          <QaProvider>
            <BacklogProvider>
              <MockupProvider>
                {children}
              </MockupProvider>
            </BacklogProvider>
          </QaProvider>
        </ScrumProvider>
      </ProjectsProvider>
    </SystemProvider>
  );
};

export { useSystemStore } from './SystemProvider';
export { useProjectsStore } from './ProjectsProvider';
export { useScrumStore } from './ScrumProvider';
export { useQaStore } from './QaProvider';
export { useBacklogStore } from './BacklogProvider';
export { useMockupStore } from './MockupProvider';
