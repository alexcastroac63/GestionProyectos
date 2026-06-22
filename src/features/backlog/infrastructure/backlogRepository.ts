import { Epic, UserStory } from '../domain/backlog.types';
import { safeLoad, safeSave } from '../../../shared/storage/localStorageAdapter';
import { INITIAL_EPICS, INITIAL_USER_STORIES } from '../../../shared/seeds/backlogSeeds';

export const backlogRepository = {
  loadEpics(): Epic[] {
    return safeLoad<Epic[]>('backlog_epics', INITIAL_EPICS);
  },

  saveEpics(epics: Epic[]): void {
    safeSave('backlog_epics', epics);
  },

  loadStories(): UserStory[] {
    return safeLoad<UserStory[]>('backlog_stories_advanced', INITIAL_USER_STORIES);
  },

  saveStories(stories: UserStory[]): void {
    safeSave('backlog_stories_advanced', stories);
  }
};
