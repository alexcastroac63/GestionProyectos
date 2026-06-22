import { Mockup, MockupScreen, MockupComponent, MockupConnection } from '../../../types';
import { safeLoad, safeSave } from '../../../shared/storage/localStorageAdapter';
import { INITIAL_MOCKUPS, INITIAL_MOCKUP_SCREENS, INITIAL_MOCKUP_COMPONENTS, INITIAL_MOCKUP_CONNECTIONS } from '../../../data';

export const mockupRepository = {
  loadMockups(): Mockup[] {
    return safeLoad<Mockup[]>('gcp_mockups', INITIAL_MOCKUPS);
  },

  saveMockups(mockups: Mockup[]): void {
    safeSave('gcp_mockups', mockups);
  },

  loadMockScreens(): MockupScreen[] {
    return safeLoad<MockupScreen[]>('gcp_mock_screens', INITIAL_MOCKUP_SCREENS);
  },

  saveMockScreens(screens: MockupScreen[]): void {
    safeSave('gcp_mock_screens', screens);
  },

  loadMockComponents(): MockupComponent[] {
    return safeLoad<MockupComponent[]>('gcp_mock_components', INITIAL_MOCKUP_COMPONENTS);
  },

  saveMockComponents(components: MockupComponent[]): void {
    safeSave('gcp_mock_components', components);
  },

  loadMockConnections(): MockupConnection[] {
    return safeLoad<MockupConnection[]>('gcp_mock_connections', INITIAL_MOCKUP_CONNECTIONS);
  },

  saveMockConnections(connections: MockupConnection[]): void {
    safeSave('gcp_mock_connections', connections);
  }
};
