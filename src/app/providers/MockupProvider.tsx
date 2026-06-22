import React, { createContext, useContext, useState, useEffect } from 'react';
import { Mockup, MockupScreen, MockupComponent, MockupConnection } from '../../types';
import { mockupRepository } from '../../features/mockups/infrastructure/mockupRepository';

export interface MockupContextType {
  mockups: Mockup[];
  setMockups: React.Dispatch<React.SetStateAction<Mockup[]>>;
  mockScreens: MockupScreen[];
  setMockScreens: React.Dispatch<React.SetStateAction<MockupScreen[]>>;
  mockComponents: MockupComponent[];
  setMockComponents: React.Dispatch<React.SetStateAction<MockupComponent[]>>;
  mockConnections: MockupConnection[];
  setMockConnections: React.Dispatch<React.SetStateAction<MockupConnection[]>>;
}

export const MockupContext = createContext<MockupContextType | undefined>(undefined);

export const MockupProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mockups, setMockups] = useState<Mockup[]>(() => mockupRepository.loadMockups());
  const [mockScreens, setMockScreens] = useState<MockupScreen[]>(() => mockupRepository.loadMockScreens());
  const [mockComponents, setMockComponents] = useState<MockupComponent[]>(() => mockupRepository.loadMockComponents());
  const [mockConnections, setMockConnections] = useState<MockupConnection[]>(() => mockupRepository.loadMockConnections());

  // Sync state with repository on changes
  useEffect(() => {
    mockupRepository.saveMockups(mockups);
  }, [mockups]);

  useEffect(() => {
    mockupRepository.saveMockScreens(mockScreens);
  }, [mockScreens]);

  useEffect(() => {
    mockupRepository.saveMockComponents(mockComponents);
  }, [mockComponents]);

  useEffect(() => {
    mockupRepository.saveMockConnections(mockConnections);
  }, [mockConnections]);

  return (
    <MockupContext.Provider value={{
      mockups, setMockups, mockScreens, setMockScreens, mockComponents, setMockComponents, mockConnections, setMockConnections
    }}>
      {children}
    </MockupContext.Provider>
  );
};

export const useMockupStore = () => {
  const context = useContext(MockupContext);
  if (!context) throw new Error('useMockupStore debe utilizarse dentro de MockupProvider o AppProviders');
  return context;
};
