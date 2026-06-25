/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useSystemStore } from '../../app/providers/SystemProvider';
import { TeamDirectory } from './components/TeamDirectory';
import { UserEditorModal } from './components/UserEditorModal';
import { settingsRepository } from '../settings/infrastructure/settingsRepository';

export const TeamDirectoryView: React.FC = () => {
  const { users, setUsers, loggedInUser, addLog, smtpPassword } = useSystemStore();

  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [passwordResetUser, setPasswordResetUser] = useState<any>(null);
  const [showResetEmailModal, setShowResetEmailModal] = useState(false);
  const [activationUser, setActivationUser] = useState<any>(null);
  const [showActivationModal, setShowActivationModal] = useState(false);

  // Load current SMTP configuration from the settingsRepository
  const smtpConfig = settingsRepository.loadSmtpConfig();

  return (
    <div className="space-y-6 animate-fadeIn" id="tab-teams-view">
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <TeamDirectory
          users={users}
          setUsers={setUsers}
          loggedInUser={loggedInUser}
          addLog={addLog}
          setIsAddUserModalOpen={setIsAddUserModalOpen}
          setEditingUser={setEditingUser}
          setShowEditUserModal={setShowEditUserModal}
          setPasswordResetUser={setPasswordResetUser}
          setShowResetEmailModal={setShowResetEmailModal}
          setActivationUser={setActivationUser}
          setShowActivationModal={setShowActivationModal}
        />
      </div>

      <UserEditorModal
        isAddUserModalOpen={isAddUserModalOpen}
        setIsAddUserModalOpen={setIsAddUserModalOpen}
        editingUser={editingUser}
        setEditingUser={setEditingUser}
        showEditUserModal={showEditUserModal}
        setShowEditUserModal={setShowEditUserModal}
        showResetEmailModal={showResetEmailModal}
        setShowResetEmailModal={setShowResetEmailModal}
        passwordResetUser={passwordResetUser}
        setPasswordResetUser={setPasswordResetUser}
        activationUser={activationUser}
        setActivationUser={setActivationUser}
        showActivationModal={showActivationModal}
        setShowActivationModal={setShowActivationModal}
        users={users}
        setUsers={setUsers}
        addLog={addLog}
        smtpHost={smtpConfig.host}
        smtpPort={smtpConfig.port}
        smtpAccount={smtpConfig.account}
        smtpPassword={smtpPassword}
        loggedInUser={loggedInUser}
      />
    </div>
  );
};
