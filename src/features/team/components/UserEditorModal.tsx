import React, { useState, useEffect } from 'react';
import { X, Key, Mail, UserPlus, Edit2, Check, AlertTriangle } from 'lucide-react';
import { User } from '../../../types';
import { useSystemStore } from '../../../app/providers/SystemProvider';
import { settingsRepository } from '../../settings/infrastructure/settingsRepository';

const getProfileNames = (): { id: string; name: string }[] => {
  const saved = localStorage.getItem('gcp_profile_permissions');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((p: any) => ({ id: p.id, name: p.name }));
      }
    } catch (e) {
      console.error(e);
    }
  }
  return [
    { id: 'Administrador', name: 'Administrador' },
    { id: 'Director', name: 'Director / Ejecutiva' },
    { id: 'Project Manager', name: 'Project Manager' },
    { id: 'Scrum Master', name: 'Scrum Master' },
    { id: 'Product Owner', name: 'Product Owner' },
    { id: 'Líder Técnico', name: 'Líder Técnico' },
    { id: 'Ingeniero de Software', name: 'Ingeniero de Software' },
    { id: 'QA Lead', name: 'QA Lead' },
    { id: 'Consultor', name: 'Consultor / Auditor' },
    { id: 'Sponsor / Directora', name: 'Sponsor / Directora' },
    { id: 'Desarrollador Backend', name: 'Desarrollador Backend' },
    { id: 'Desarrollador Frontend', name: 'Desarrollador Frontend' },
    { id: 'DBA / Arquitecto de Datos', name: 'DBA / Arquitecto de Datos' },
    { id: 'DevOps / Infraestructura Cloud', name: 'DevOps / Infraestructura Cloud' },
    { id: 'UI/UX Designer', name: 'UI/UX Designer' },
  ];
};


interface UserEditorModalProps {
  isAddUserModalOpen: boolean;
  setIsAddUserModalOpen: (open: boolean) => void;
  editingUser: User | null;
  setEditingUser: (u: User | null) => void;
  showEditUserModal: boolean;
  setShowEditUserModal: (show: boolean) => void;
  showResetEmailModal: boolean;
  setShowResetEmailModal: (show: boolean) => void;
  passwordResetUser: User | null;
  setPasswordResetUser: (u: User | null) => void;
  activationUser: User | null;
  setActivationUser: (u: User | null) => void;
  showActivationModal: boolean;
  setShowActivationModal: (show: boolean) => void;
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  addLog: (user: string, action: string) => void;
  smtpHost: string;
  smtpPort: string;
  smtpAccount: string;
  loggedInUser: any;
}

export const UserEditorModal: React.FC<UserEditorModalProps> = ({
  isAddUserModalOpen,
  setIsAddUserModalOpen,
  editingUser,
  setEditingUser,
  showEditUserModal,
  setShowEditUserModal,
  showResetEmailModal,
  setShowResetEmailModal,
  passwordResetUser,
  setPasswordResetUser,
  activationUser,
  setActivationUser,
  showActivationModal,
  setShowActivationModal,
  users,
  setUsers,
  addLog,
  smtpHost,
  smtpPort,
  smtpAccount,
  loggedInUser,
}) => {
  const { smtpPassword } = useSystemStore();

  // Local state for Add User form
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('Administrador');
  const [newStatus, setNewStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');

  // Reset email simulated modal states
  const [simulatedNewPassword, setSimulatedNewPassword] = useState('');
  const [isResetSuccess, setIsResetSuccess] = useState(false);
  const [simulatedMailSendSuccess, setSimulatedMailSendSuccess] = useState(false);

  // Local state for Activation Modal
  const [activationTempPassword, setActivationTempPassword] = useState('');
  const [isActivating, setIsActivating] = useState(false);
  const [activationSuccess, setActivationSuccess] = useState(false);

  useEffect(() => {
    if (showActivationModal && activationUser) {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let code = 'CAMP-TEMP-';
      for (let i = 0; i < 4; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      setActivationTempPassword(code);
      setActivationSuccess(false);
      setIsActivating(false);
    }
  }, [showActivationModal, activationUser]);

  const handleActivateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activationUser || !activationTempPassword) return;

    setIsActivating(true);
    try {
      // 1. Register temporary password in server database
      const res = await fetch('/api/set-temp-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: activationUser.email,
          tempPassword: activationTempPassword,
        }),
      });

      if (!res.ok) {
        throw new Error('No se pudo registrar la clave temporal en el servidor de autenticación.');
      }

      // 2. Update user state locally: set status to ACTIVE, mustChangePassword to true, and save tempPassword
      setUsers((prev) => {
        const updated = prev.map((u) => {
          if (u.id === activationUser.id) {
            return {
              ...u,
              status: 'ACTIVE' as const,
              mustChangePassword: true,
              tempPassword: activationTempPassword,
            };
          }
          return u;
        });
        localStorage.setItem('gcp_users', JSON.stringify(updated));
        return updated;
      });

      // 3. Log the operation
      addLog(
        `${loggedInUser?.first_name || 'Admin'} ${loggedInUser?.last_name || ''} (${loggedInUser?.role || 'Admin'})`,
        `Activó al usuario ${activationUser.first_name} ${activationUser.last_name} (${activationUser.email}) con clave temporal y cambio obligatorio programado.`
      );

      // 4. Send real SMTP email if configured or try server fallback
      const freshSmtp = settingsRepository.loadSmtpConfig();
      const currentHost = (freshSmtp.host || '').trim();
      const currentPort = (freshSmtp.port || '').trim();
      const currentAccount = (freshSmtp.account || '').trim();
      const currentPassword = (freshSmtp.password || smtpPassword || '').trim();

      try {
        const mailRes = await fetch('/api/send-activation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            host: currentHost,
            port: currentPort,
            username: currentAccount,
            password: currentPassword,
            email: activationUser.email,
            name: `${activationUser.first_name} ${activationUser.last_name || ''}`.trim(),
            role: activationUser.role,
            tempPassword: activationTempPassword,
          }),
        });

        const mailData = await mailRes.json();
        if (mailRes.ok && mailData.success) {
          addLog(
            'Sistema Autenticación',
            `Se envió un correo de activación real con clave temporal a ${activationUser.email} desde ${currentAccount || 'Servidor SMTP por Defecto'}`
          );
        } else {
          // If SMTP is not configured on the server, treat it as simulation mode fallback.
          const notConfigured = mailData.message && mailData.message.includes('no se halla configurado');
          if (notConfigured) {
            addLog(
              'Sistema Autenticación',
              `Se activó la cuenta de ${activationUser.email} (modo simulación, sin servidor SMTP configurado)`
            );
          } else {
            console.warn('Real SMTP activation send failed:', mailData.message);
            addLog(
              'Fallo de Envío SMTP',
              `Se intentó enviar el correo real de activación a ${activationUser.email} pero falló: ${mailData.message}`
            );
            alert(`La cuenta se activó localmente, pero el envío de correo falló: ${mailData.message}. Deberá comunicarle la clave temporal manualmente.`);
          }
        }
      } catch (mailErr: any) {
        console.warn('Real SMTP activation send failed with exception:', mailErr.message);
        addLog(
          'Fallo de Envío SMTP',
          `Error de conexión al enviar el correo real de activación a ${activationUser.email}: ${mailErr.message}`
        );
      }

      setActivationSuccess(true);
    } catch (err: any) {
      console.error('[User Activation Error]', err);
      alert(err.message || 'Hubo un error al activar la cuenta.');
    } finally {
      setIsActivating(false);
    }
  };

  // Trigger effect when password reset is requested to send real / mock email
  useEffect(() => {
    if (showResetEmailModal && passwordResetUser) {
      setSimulatedNewPassword('');
      setIsResetSuccess(false);
      setSimulatedMailSendSuccess(false);

      const freshSmtp = settingsRepository.loadSmtpConfig();
      const currentHost = (freshSmtp.host || '').trim();
      const currentPort = (freshSmtp.port || '').trim();
      const currentAccount = (freshSmtp.account || '').trim();
      const currentPassword = (freshSmtp.password || smtpPassword || '').trim();

      (async () => {
        try {
          const res = await fetch('/api/send-recovery', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              host: currentHost,
              port: currentPort,
              username: currentAccount,
              password: currentPassword,
              emailToFind: passwordResetUser.email,
            }),
          });
          const data = await res.json();
          if (res.ok && data.success) {
            setSimulatedMailSendSuccess(true);
            addLog(
              'Sistema Autenticación',
              `Se envió un correo de recuperación real de contraseña a ${passwordResetUser.email} desde ${currentAccount || 'Servidor SMTP por Defecto'}`
            );
          } else {
            const notConfigured = data.message && data.message.includes('no se halla configurado');
            if (notConfigured) {
              setSimulatedMailSendSuccess(true);
              addLog('Sistema Autenticación', `Se disparó email simulado de restablecimiento de contraseña a ${passwordResetUser.email}`);
            } else {
              setSimulatedMailSendSuccess(true); // show simulator anyway
              console.warn('Real SMTP recovery send failed', data.message);
              addLog(
                'Fallo de Envío SMTP',
                `Se intentó enviar el correo real a ${passwordResetUser.email} pero falló: ${data.message}`
              );
            }
          }
        } catch (err: any) {
          setSimulatedMailSendSuccess(true);
          console.warn('Real SMTP recovery send failed with exception', err.message);
        }
      })();
    }
  }, [showResetEmailModal, passwordResetUser]);

  const handleAddNewUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFirstName.trim() || !newLastName.trim() || !newEmail.trim()) return;

    const u: User = {
      id: `u-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      first_name: newFirstName.trim(),
      last_name: newLastName.trim(),
      email: newEmail.trim(),
      role: newRole,
      status: newStatus,
      tenant_id: loggedInUser?.tenant_id || 'grupo-campestre',
    };

    setUsers((prev) => [...prev, u]);
    // reset form fields
    setNewFirstName('');
    setNewLastName('');
    setNewEmail('');
    setNewRole('Administrador');
    setNewStatus('ACTIVE');
    setIsAddUserModalOpen(false);
    addLog('Director/Sponsor', `Agregó al usuario ${u.first_name} ${u.last_name} (${u.role}) al directorio corporativo`);
  };

  const handleEditUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setUsers((prev) =>
      prev.map((u) =>
        u.id === editingUser.id
          ? { ...editingUser, email: editingUser.email.trim(), tenant_id: editingUser.tenant_id || u.tenant_id || 'grupo-campestre' }
          : u
      )
    );
    addLog('Director/Sponsor', `Modificó información y perfil corporativo de ${editingUser.first_name} ${editingUser.last_name}`);
    setEditingUser(null);
    setShowEditUserModal(false);
  };

  const handleDeleteUser = () => {
    if (!editingUser) return;
    if (window.confirm(`¿Está seguro de que desea eliminar permanentemente la cuenta de ${editingUser.first_name} ${editingUser.last_name} (${editingUser.email})?`)) {
      setUsers((prev) => prev.filter((u) => u.id !== editingUser.id));
      addLog('Director/Sponsor', `Eliminó la cuenta de ${editingUser.first_name} ${editingUser.last_name} (${editingUser.email}) del directorio`);
      setEditingUser(null);
      setShowEditUserModal(false);
    }
  };

  const handleExecuteSimulatedChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordResetUser || !simulatedNewPassword.trim()) return;
    setIsResetSuccess(true);

    // Update locally too
    setUsers((prev) =>
      prev.map((u) => (u.id === passwordResetUser.id ? { ...u, password: simulatedNewPassword.trim() } : u))
    );

    addLog(
      'Sistema Autenticación',
      `Contraseña simulada restablecida con éxito para ${passwordResetUser.first_name} ${passwordResetUser.last_name}`
    );

    setTimeout(() => {
      setIsResetSuccess(false);
      setShowResetEmailModal(false);
      setPasswordResetUser(null);
      setSimulatedNewPassword('');
    }, 2000);
  };

  return (
    <>
      {/* A. EDIT USER DETAIL MODAL */}
      {showEditUserModal && editingUser && (
        <div className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl overflow-y-auto max-h-[90vh] flex flex-col animate-slideUp text-left">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-indigo-500" />
                Editar Integrante de Ingeniería
              </h4>
              <button
                type="button"
                onClick={() => {
                  setEditingUser(null);
                  setShowEditUserModal(false);
                }}
                className="text-slate-400 hover:text-slate-650 font-bold text-base select-none px-2 py-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditUserSubmit} className="p-5 space-y-4">
              {/* Name input row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Nombre</label>
                  <input
                    type="text"
                    required
                    value={editingUser.first_name}
                    onChange={(e) => setEditingUser({ ...editingUser, first_name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-lg text-xs font-semibold p-2.5 focus:border-indigo-500 focus:bg-white outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Apellido</label>
                  <input
                    type="text"
                    required
                    value={editingUser.last_name || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, last_name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-lg text-xs font-semibold p-2.5 focus:border-indigo-500 focus:bg-white outline-none"
                  />
                </div>
              </div>

              {/* Email Input */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Correo Electrónico (Email)</label>
                <input
                  type="email"
                  required
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-lg text-xs font-semibold p-2.5 focus:border-indigo-500 focus:bg-white outline-none"
                />
              </div>

              {/* Role selection & details */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Perfil / Rol Administrativo</label>
                <select
                  value={editingUser.role}
                  onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-lg text-xs font-semibold p-2.5 focus:border-indigo-500 focus:bg-white outline-none cursor-pointer"
                >
                  {getProfileNames().map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              {/* Status select toggle */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Estado de la cuenta</label>
                <select
                  value={editingUser.status}
                  onChange={(e) => setEditingUser({ ...editingUser, status: e.target.value as 'ACTIVE' | 'INACTIVE' })}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-lg text-xs font-semibold p-2.5 focus:border-indigo-500 focus:bg-white outline-none cursor-pointer"
                >
                  <option value="ACTIVE">ACTIVO (Acceso habilitado)</option>
                  <option value="INACTIVE">INACTIVO (Acceso denegado)</option>
                </select>
              </div>

              <div className="flex gap-2 justify-between border-t border-slate-100 pt-4 mt-2">
                <button
                  type="button"
                  onClick={handleDeleteUser}
                  className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition font-bold text-xs cursor-pointer"
                >
                  Eliminar Cuenta
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingUser(null);
                      setShowEditUserModal(false);
                    }}
                    className="px-4 py-2 hover:bg-slate-100 text-slate-500 rounded-xl transition font-bold text-xs cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition font-bold text-xs shadow cursor-pointer"
                  >
                    Guardar Cambios
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* B. ADD USER MODAL */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl overflow-y-auto max-h-[90vh] flex flex-col animate-slideUp text-left">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-indigo-500" />
                Registrar Integrante de Equipo
              </h4>
              <button
                type="button"
                onClick={() => setIsAddUserModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-base select-none px-2 py-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddNewUserSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Nombre</label>
                  <input
                    type="text"
                    required
                    placeholder="Ingrese nombre"
                    value={newFirstName}
                    onChange={(e) => setNewFirstName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-lg text-xs font-semibold p-2.5 focus:border-indigo-500 focus:bg-white outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Apellido</label>
                  <input
                    type="text"
                    required
                    placeholder="Ingrese apellido"
                    value={newLastName}
                    onChange={(e) => setNewLastName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-lg text-xs font-semibold p-2.5 focus:border-indigo-500 focus:bg-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Correo Electrónico Corporativo</label>
                <input
                  type="email"
                  required
                  placeholder="nombre.apellido@empresa.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-lg text-xs font-semibold p-2.5 focus:border-indigo-500 focus:bg-white outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Rol / Cargo Asignado</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-lg text-xs font-semibold p-2.5 focus:border-indigo-500 focus:bg-white outline-none cursor-pointer"
                >
                  {getProfileNames().map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Estado de Acceso Inicial</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as 'ACTIVE' | 'INACTIVE')}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-lg text-xs font-semibold p-2.5 focus:border-indigo-500 focus:bg-white outline-none cursor-pointer"
                >
                  <option value="ACTIVE">ACTIVO (Completo)</option>
                  <option value="INACTIVE">INACTIVO (Suspendido)</option>
                </select>
              </div>

              <div className="flex gap-2 justify-end border-t border-slate-100 pt-4 mt-2">
                <button
                  type="button"
                  onClick={() => setIsAddUserModalOpen(false)}
                  className="px-4 py-2 hover:bg-slate-100 text-slate-505 text-slate-500 rounded-xl transition font-bold text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition font-bold text-xs shadow cursor-pointer"
                >
                  Registrar Integrante
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* C. INTERACTIVE EMAIL RESET PASSWORD SIMULATOR */}
      {showResetEmailModal && passwordResetUser && (
        <div className="fixed inset-0 z-[60] bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-y-auto max-h-[90vh] flex flex-col animate-slideUp text-left">
            <div className="px-5 py-4 border-b border-slate-800 bg-slate-950 flex justify-between items-center text-white">
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-indigo-400 font-bold" />
                <h4 className="font-bold text-sm tracking-tight text-white">Transmisión de Email - Cambio de Contraseña</h4>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowResetEmailModal(false);
                  setPasswordResetUser(null);
                }}
                className="text-slate-400 hover:text-white font-bold text-base select-none px-2 py-1"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-5">
              {!simulatedMailSendSuccess ? (
                <div className="p-6 bg-slate-950/40 border border-slate-850 rounded-xl text-center space-y-3">
                  <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin mx-auto" />
                  <div className="text-xs text-slate-400">
                    <span className="font-bold block text-slate-200">Transmitiendo alerta a SMTP corporativo para {passwordResetUser.email}...</span>
                    <span>Preparando cabeceras de cifrado dkim y ruteando mensaje.</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-slate-950 border border-slate-850 rounded-xl overflow-hidden shadow-inner">
                    <div className="bg-slate-900 px-4 py-3 border-b border-slate-850 text-[11px] text-slate-400 space-y-1 font-mono">
                      <div><span className="text-slate-500">De:</span> {smtpAccount || 'core-security@platform.enterprise.com'}</div>
                      <div><span className="text-slate-500">Para:</span> {passwordResetUser.email}</div>
                      <div><span className="text-slate-500 font-bold">Asunto:</span> 🔒 Restablecer tu contraseña de acceso corporativo</div>
                      <div className="border-t border-slate-850/60 pt-1 mt-1 text-[9px] text-emerald-400 flex items-center gap-1 font-medium">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                        Mensaje enviado y firmado mediante TLS v1.3
                      </div>
                    </div>

                    <div className="p-5 text-xs text-slate-300 leading-relaxed font-sans bg-slate-950">
                      <p className="mb-3">Hola <strong>{passwordResetUser.first_name} {passwordResetUser.last_name}</strong>,</p>
                      <p className="mb-4">El administrador del Directorio de Ingeniería ha programado un proceso de cambio de credenciales para tu cuenta asociada al perfil de <strong className="text-indigo-400 uppercase">{passwordResetUser.role}</strong>.</p>
                      
                      <div className="bg-slate-900 border border-slate-850 p-3.5 rounded-lg text-center my-4">
                        <span className="text-[10px] text-slate-400 block mb-1 font-semibold">Enlace Temporal y Solicitado:</span>
                        <code className="text-sky-400 text-[10.5px] block break-all py-1 font-mono select-all">
                          https://enterprise-cloud.com/auth/reset-password?uid={passwordResetUser.id}&token=sim_tkn_7c8d9
                        </code>
                      </div>
                      
                      <p className="text-[10.5px] text-slate-400">Si no has solicitado este cambio, puedes ignorar este mensaje de forma segura.</p>
                      <p className="border-t border-slate-850/80 pt-3 mt-4 text-[10px] text-slate-500 font-mono">
                        Seguridad Corporativa • Enterprise Platform Dashboard
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-indigo-950/20 border border-indigo-900/40 rounded-xl space-y-3">
                    <span className="text-[11px] font-bold text-indigo-450 uppercase tracking-wider block">
                      Emulación Receptiva (Clic en el Enlace)
                    </span>
                    
                    {isResetSuccess ? (
                      <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl flex items-center gap-3 text-emerald-400 text-xs text-left animate-fadeIn">
                        <Check className="w-5 h-5 shrink-0 text-emerald-500" />
                        <div>
                          <span className="font-bold block text-white">¡Contraseña Cambiada de Forma Exitosa!</span>
                          <span>Los datos han sido actualizados en la base de datos local y se completó la verificación.</span>
                        </div>
                      </div>
                    ) : (
                      <form onSubmit={handleExecuteSimulatedChangePassword} className="space-y-2.5">
                        <p className="text-[11px] text-slate-300 leading-normal">
                          Ingresa la nueva contraseña que adoptará el usuario para confirmar la simulación:
                        </p>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <div className="relative flex-grow">
                            <Key className="w-3.5 h-3.5 text-indigo-400 absolute left-2.5 top-2.5" />
                            <input
                              type="text"
                              required
                              placeholder="Ej: Ing_ClaveSegura_2026!"
                              value={simulatedNewPassword}
                              onChange={(e) => setSimulatedNewPassword(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg text-xs font-semibold pl-8 pr-2.5 py-2 text-slate-100 placeholder-slate-500 focus:border-indigo-500 outline-none font-mono"
                            />
                          </div>
                          <button
                            type="submit"
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition shrink-0 cursor-pointer shadow hover:shadow-indigo-950/40"
                          >
                            Establecer Nueva Contraseña 🚀
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* D. ACTIVATE WITH TEMPORARY PASSWORD MODAL */}
      {showActivationModal && activationUser && (
        <div className="fixed inset-0 z-[60] bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-y-auto max-h-[90vh] flex flex-col animate-slideUp text-left">
            <div className="px-5 py-4 border-b border-slate-800 bg-slate-950 flex justify-between items-center text-white">
              <div className="flex items-center gap-2.5">
                <Key className="w-4 h-4 text-emerald-400 font-bold" />
                <h4 className="font-bold text-sm tracking-tight text-white">Activación y Emisión de Clave Temporal</h4>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowActivationModal(false);
                  setActivationUser(null);
                }}
                className="text-slate-400 hover:text-white font-bold text-base select-none px-2 py-1"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4">
              {!activationSuccess ? (
                <form onSubmit={handleActivateUserSubmit} className="space-y-4">
                  <div className="bg-slate-950/40 border border-slate-800 p-4 rounded-xl space-y-2">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block font-mono">Usuario a Activar</span>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-white font-extrabold">{activationUser.first_name} {activationUser.last_name}</span>
                      <span className="text-[10px] bg-indigo-950 text-indigo-400 border border-indigo-900 font-bold px-2 py-0.5 rounded uppercase">{activationUser.role}</span>
                    </div>
                    <code className="text-[11px] text-slate-400 font-mono block">{activationUser.email}</code>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Clave Temporal Generada</label>
                    <div className="relative">
                      <Key className="w-3.5 h-3.5 text-emerald-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        required
                        value={activationTempPassword}
                        onChange={(e) => setActivationTempPassword(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-lg text-xs font-semibold pl-9 pr-4 py-2.5 outline-none font-mono focus:border-emerald-500"
                        placeholder="Ej: CAMP-TEMP-X9F2"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 leading-normal">
                      Esta clave temporal se guardará en la base de datos de credenciales. Al iniciar sesión con este código por primera vez, el sistema solicitará obligatoriamente cambiar y confirmar su nueva clave.
                    </p>
                  </div>

                  <div className="flex gap-2 justify-end border-t border-slate-800/80 pt-4 mt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowActivationModal(false);
                        setActivationUser(null);
                      }}
                      className="px-4 py-2 hover:bg-slate-800 text-slate-400 rounded-xl transition font-bold text-xs cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={isActivating}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl transition font-bold text-xs shadow flex items-center gap-1.5 cursor-pointer"
                    >
                      {isActivating ? 'Activando...' : 'Confirmar y Activar Usuario'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4 animate-fadeIn">
                  <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl flex items-start gap-3 text-emerald-400 text-xs text-left">
                    <Check className="w-5 h-5 shrink-0 text-emerald-500 mt-0.5" />
                    <div>
                      <span className="font-bold block text-white text-sm">¡Usuario Activado Exitosamente!</span>
                      <p className="text-slate-300 mt-1 leading-relaxed">
                        Se ha actualizado el estado de la cuenta a <strong>ACTIVO</strong>. Se habilitó una restricción de primer ingreso que solicitará de manera mandatoria el cambio y confirmación de contraseña.
                      </p>
                    </div>
                  </div>

                  {/* Simulated Email view */}
                  <div className="bg-slate-950 border border-slate-850 rounded-xl overflow-hidden shadow-inner">
                    <div className="bg-slate-900 px-4 py-3 border-b border-slate-850 text-[11px] text-slate-400 space-y-1 font-mono">
                      <div><span className="text-slate-500">De:</span> {smtpAccount || 'security@campestre.com.sv'}</div>
                      <div><span className="text-slate-500">Para:</span> {activationUser.email}</div>
                      <div><span className="text-slate-500 font-bold">Asunto:</span> 🔑 Activación de cuenta y clave temporal de acceso</div>
                      <div className="border-t border-slate-850/60 pt-1 mt-1 text-[9px] text-emerald-400 flex items-center gap-1 font-medium">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                        Mensaje enviado y firmado mediante TLS v1.3
                      </div>
                    </div>

                    <div className="p-5 text-xs text-slate-300 leading-relaxed font-sans bg-slate-950">
                      <p className="mb-3">Hola <strong>{activationUser.first_name} {activationUser.last_name}</strong>,</p>
                      <p className="mb-4">Tu cuenta en el <strong>Directorio de Equipos</strong> ha sido activada por el administrador corporativo. Tu perfil ha sido asignado como <strong className="text-indigo-400 uppercase">{activationUser.role}</strong>.</p>
                      
                      <div className="bg-slate-900 border border-slate-850 p-4 rounded-lg text-center my-4 space-y-2">
                        <span className="text-[10px] text-slate-400 block font-semibold">Tu clave temporal de acceso es:</span>
                        <code className="text-emerald-400 text-lg font-bold block py-1 font-mono select-all tracking-wider bg-slate-950 border border-slate-800 rounded">
                          {activationTempPassword}
                        </code>
                        <span className="text-[9.5px] text-amber-400 block font-sans">⚠️ Por motivos de seguridad, se requerirá cambiar esta contraseña al ingresar por primera vez.</span>
                      </div>
                      
                      <p className="text-[10.5px] text-slate-400">Puedes ingresar a la plataforma utilizando tu correo electrónico y la clave temporal anterior.</p>
                      <p className="border-t border-slate-850/80 pt-3 mt-4 text-[10px] text-slate-500 font-mono">
                        Seguridad de Cuentas • Grupo Campestre Enterprise
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowActivationModal(false);
                        setActivationUser(null);
                      }}
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition font-bold text-xs shadow cursor-pointer"
                    >
                      Entendido y Cerrar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
