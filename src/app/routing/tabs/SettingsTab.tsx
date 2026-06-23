import React from 'react';
import { useSystemStore } from '../../AppProviders';
import { SettingsManagerView } from '../../../features/settings/SettingsManagerView';

export const SettingsTab: React.FC = () => {
  const {
    smtpPassword,
    setSmtpPassword,
    clientsList,
    setClientsList,
    sponsorsList,
    setSponsorsList
  } = useSystemStore();

  return (
    <SettingsManagerView
      smtpPassword={smtpPassword}
      setSmtpPassword={setSmtpPassword}
      clientsList={clientsList}
      setClientsList={setClientsList}
      sponsorsList={sponsorsList}
      setSponsorsList={setSponsorsList}
    />
  );
};
