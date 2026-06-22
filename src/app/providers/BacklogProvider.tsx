import React, { createContext, useContext, useState, useEffect } from 'react';
import { Epic, UserStory } from '../../features/backlog/domain/backlog.types';
import { backlogRepository } from '../../features/backlog/infrastructure/backlogRepository';

export interface BacklogContextType {
  stories: UserStory[];
  setStories: React.Dispatch<React.SetStateAction<UserStory[]>>;
  epics: Epic[];
  setEpics: React.Dispatch<React.SetStateAction<Epic[]>>;
}

export const BacklogContext = createContext<BacklogContextType | undefined>(undefined);

export const BacklogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [epics, setEpics] = useState<Epic[]>(() => backlogRepository.loadEpics());
  const [stories, setStories] = useState<UserStory[]>(() => backlogRepository.loadStories());

  // Sync state with repository on changes
  useEffect(() => {
    backlogRepository.saveEpics(epics);
  }, [epics]);

  useEffect(() => {
    backlogRepository.saveStories(stories);
  }, [stories]);

  return (
    <BacklogContext.Provider value={{
      stories, setStories, epics, setEpics
    }}>
      {children}
    </BacklogContext.Provider>
  );
};

export const useBacklogStore = () => {
  const context = useContext(BacklogContext);
  if (!context) throw new Error('useBacklogStore debe utilizarse dentro de BacklogProvider o AppProviders');
  return context;
};
