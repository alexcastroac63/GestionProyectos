import React from 'react';
import { useSystemStore } from '../../AppProviders';
import { TeamDirectoryView } from '../../../features/team/TeamDirectoryView';

export const TeamsTab: React.FC = () => {
  const { smtpPassword } = useSystemStore();

  return <TeamDirectoryView smtpPassword={smtpPassword} />;
};
