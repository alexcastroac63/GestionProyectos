import React, { useState } from 'react';
import { Mail, Key, Lock, Check, AlertTriangle, RefreshCw } from 'lucide-react';
import { User } from '../../types';
import { useSystemStore } from '../../app/providers/SystemProvider';
import { settingsRepository } from '../settings/infrastructure/settingsRepository';

interface ForgotPasswordFlowProps {
  onClose: () => void;
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  addLog: (user: string, action: string) => void;
}

export const ForgotPasswordFlow: React.FC<ForgotPasswordFlowProps> = ({
  onClose,
  users,
  setUsers,
  addLog,
}) => {
  const { smtpPassword } = useSystemStore();
  const smtpConfig = settingsRepository.loadSmtpConfig();
  const smtpAccount = smtpConfig.account;
  const smtpHost = smtpConfig.host;
  const smtpPort = smtpConfig.port;

  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordStatus, setForgotPasswordStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isSendingForgotPassword, setIsSendingForgotPassword] = useState(false);
  const [forgotPasswordStep, setForgotPasswordStep] = useState<'request' | 'verify'>('request');
  const [forgotPasswordVerificationCode, setForgotPasswordVerificationCode] = useState('');
  const [forgotPasswordCodeInput, setForgotPasswordCodeInput] = useState('');
  const [forgotPasswordNewPassword, setForgotPasswordNewPassword] = useState('');
  const [forgotPasswordSuccessMessage, setForgotPasswordSuccessMessage] = useState('');

  return (
    <div className="space-y-4 animate-fadeIn text-left">
      {forgotPasswordStep === 'request' ? (
        <>
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">
              Correo Oficial del Usuario
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                value={forgotPasswordEmail}
                onChange={(e) => setForgotPasswordEmail(e.target.value)}
                placeholder="ejemplo@empresa.com"
                className="w-full bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 rounded-xl pl-10 pr-4 py-2.5 text-xs tracking-wide focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all font-sans"
              />
            </div>
            <p className="text-[9px] text-slate-500">
              Ingrese el correo del usuario cuyas credenciales desea restablecer. Esto simulará o canalizará la entrega de un código de acceso de un solo uso por SMTP.
            </p>
          </div>

          {forgotPasswordStatus && (
            <div
              className={`border rounded-xl p-3 flex gap-2.5 text-xs ${
                forgotPasswordStatus.type === 'error'
                  ? 'bg-red-500/10 border-red-500/25 text-red-400'
                  : 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400'
              }`}
            >
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <div className="leading-relaxed whitespace-pre-line text-left flex-1 font-sans">
                {forgotPasswordStatus.message}
              </div>
            </div>
          )}



          <div className="flex gap-2.5 pt-1">
            <button
              type="button"
              onClick={() => {
                onClose();
                setForgotPasswordEmail('');
                setForgotPasswordStatus(null);
              }}
              className="flex-1 bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-300 font-semibold py-2.5 px-4 rounded-xl text-xs transition duration-205 cursor-pointer text-center"
            >
              Volver al Inicio
            </button>
            <button
              type="button"
              disabled={isSendingForgotPassword}
              onClick={async () => {
                const emailToFind = forgotPasswordEmail.trim().toLowerCase();
                if (!emailToFind) {
                  setForgotPasswordStatus({
                    type: 'error',
                    message: 'Por favor, ingrese un correo oficial registrado.',
                  });
                  return;
                }

                setIsSendingForgotPassword(true);
                setForgotPasswordStatus(null);

                let currentUsersList = users;
                try {
                  const usersRes = await fetch('/api/users');
                  if (usersRes.ok) {
                    const usersData = await usersRes.json();
                    if (usersData.success && usersData.users && Array.isArray(usersData.users)) {
                      setUsers(usersData.users);
                      localStorage.setItem('gcp_users', JSON.stringify(usersData.users));
                      currentUsersList = usersData.users;
                    }
                  }
                } catch (err) {
                  console.warn('Failed to fetch fresh users list during forgot password:', err);
                }

                const targetUser = currentUsersList.find((u) => u.email.trim().toLowerCase() === emailToFind);
                if (!targetUser) {
                  setForgotPasswordStatus({
                    type: 'error',
                    message: `La dirección ${emailToFind} no se encuentra asociada a ningún usuario del Tenant actual.`,
                  });
                  setIsSendingForgotPassword(false);
                  return;
                }

                try {
                  if (!smtpAccount.trim() || !smtpPassword.trim()) {
                      setIsSendingForgotPassword(false);
                      setForgotPasswordStatus({
                        type: 'error',
                        message: `⚠️ CONFIGURACIÓN REQUERIDA (SMTP NO CONFIGURADO)\n\nFallo de envío del correo hacia: ${emailToFind}.\n\nNo se detectó cuenta de envío de notificaciones ni contraseña.\n\nSolución:\n1. Inicie sesión temporalmente con un usuario de Acceso Rápido.\n2. Vaya al menú "Configuración Central" en el panel lateral y proporcione su cuenta de correo y credenciales SMTP.\n3. O bien, intente la opción de "Simulación Directa Local" de arriba.`,
                      });
                      addLog(
                        'Fallo de Envío SMTP',
                        `Se intentó enviar un enlace de recuperación de contraseña a ${emailToFind}, pero la cuenta SMTP no está configurada.`
                      );
                      return;
                    }

                    const res = await fetch('/api/send-recovery', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        host: smtpHost.trim(),
                        port: smtpPort.trim(),
                        username: smtpAccount.trim(),
                        password: smtpPassword.trim(),
                        emailToFind: emailToFind,
                      }),
                    });

                    const data = await res.json();
                    setIsSendingForgotPassword(false);

                    if (res.ok && data.success) {
                      setForgotPasswordVerificationCode('EXISTS_SERVER_SIDE_VAL');
                      setForgotPasswordStep('verify');
                      setForgotPasswordStatus({
                        type: 'success',
                        message: `✅ ¡CÓDIGO DE RECUPERACIÓN DESPACHADO CON ÉXITO!\n\nServidor SMTP: ${smtpHost}:${smtpPort}\nRemitente: ${smtpAccount}\n\nUn correo firmado con SSL/TLS fue despachado siguiendo las directivas de seguridad corporativa. Por favor consulte su buzón (incluso Correo no Deseado/Spam) para encontrar el código aleatorio e ingréselo a continuación.`,
                      });
                      addLog(
                        'Servicio SMTP',
                        `Se envió un correo de recuperación de contraseña a ${emailToFind} (secreto guardado en servidor de forma segura)`
                      );
                    } else {
                      setForgotPasswordStatus({
                        type: 'error',
                        message: `❌ ERROR EN SERVIDOR DE ALERTAS SMTP:\n\n${
                          data.message || 'Error técnico desconocido.'
                        }\n\nPor favor, revise que la Cuenta y contraseña de SMTP sean válidas.`,
                      });
                      addLog(
                        'Fallo de Envío SMTP',
                        `Error de despacho SMTP a ${emailToFind}: ${data.message || 'Fallo desconocido'}`
                      );
                    }
                  } catch (err: any) {
                    setIsSendingForgotPassword(false);
                    setForgotPasswordStatus({
                      type: 'error',
                      message: `⚠️ Error de comunicación con la plataforma: ${err.message || 'Fallo general de red.'}`,
                    });
                  }
              }}
              className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-semibold py-2.5 px-4 rounded-xl text-xs transition duration-200 shadow-lg flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSendingForgotPassword ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Espere...</span>
                </>
              ) : (
                <span>Enviar Alerta</span>
              )}
            </button>
          </div>
        </>
      ) : (
        <>
          {forgotPasswordStatus && (
            <div
              className={`border rounded-xl p-3 flex gap-2.5 text-[11px] ${
                forgotPasswordStatus.type === 'error'
                  ? 'bg-red-500/10 border-red-500/25 text-red-400'
                  : 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400'
              }`}
            >
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <div className="leading-relaxed whitespace-pre-line text-left flex-1 font-sans">
                {forgotPasswordStatus.message}
              </div>
            </div>
          )}

          {/* Input verification code */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">
              Código de Seguridad / Verificación *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Key className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={forgotPasswordCodeInput}
                onChange={(e) => setForgotPasswordCodeInput(e.target.value)}
                placeholder="Ingrese el código recibido"
                required
                className="w-full bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 rounded-xl pl-10 pr-4 py-2.5 text-xs font-mono tracking-widest uppercase focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all outline-none"
              />
            </div>
          </div>

          {/* Input new password */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">
              Nueva Contraseña de Acceso *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                value={forgotPasswordNewPassword}
                onChange={(e) => setForgotPasswordNewPassword(e.target.value)}
                placeholder="Establezca su nueva contraseña clave"
                required
                className="w-full bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 rounded-xl pl-10 pr-4 py-2.5 text-xs tracking-wide focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all outline-none"
              />
            </div>
          </div>

          {forgotPasswordSuccessMessage && (
            <div className="bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 rounded-xl p-3 flex gap-2.5 text-xs text-left animate-fadeIn">
              <Check className="w-4 h-4 mt-0.5 shrink-0 text-emerald-500" />
              <div className="leading-relaxed font-sans">{forgotPasswordSuccessMessage}</div>
            </div>
          )}

          <div className="flex gap-2.5 pt-1">
            <button
              type="button"
              onClick={() => {
                setForgotPasswordStep('request');
                setForgotPasswordCodeInput('');
                setForgotPasswordNewPassword('');
                setForgotPasswordStatus(null);
                setForgotPasswordSuccessMessage('');
              }}
              className="flex-1 bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-300 font-semibold py-2.5 px-4 rounded-xl text-xs transition duration-205 cursor-pointer text-center"
            >
              Atrás / Solicitar de nuevo
            </button>

            <button
              type="button"
              onClick={() => {
                const typedCode = forgotPasswordCodeInput.trim().toUpperCase();
                const emailToFind = forgotPasswordEmail.trim().toLowerCase();

                if (!typedCode) {
                  setForgotPasswordStatus({
                    type: 'error',
                    message: 'Por favor, ingrese el código de verificación enviado.',
                  });
                  return;
                }

                if (!forgotPasswordNewPassword.trim() || forgotPasswordNewPassword.length < 4) {
                  setForgotPasswordStatus({
                    type: 'error',
                    message: 'Por favor, ingrese una nueva contraseña válida (mínimo 4 caracteres).',
                  });
                  return;
                }

                const targetUser = users.find((u) => u.email.toLowerCase() === emailToFind);
                if (!targetUser) {
                  setForgotPasswordStatus({
                    type: 'error',
                    message: 'Error al asociar el usuario para el cambio de credenciales.',
                  });
                  return;
                }

                (async () => {
                  try {
                    const res = await fetch('/api/reset-password', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        email: emailToFind,
                        code: typedCode,
                        newPassword: forgotPasswordNewPassword.trim(),
                      }),
                    });

                    const data = await res.json();
                    if (!res.ok || !data.success) {
                      setForgotPasswordStatus({
                        type: 'error',
                        message: data.message || 'El código de seguridad ingresado es incorrecto o ha expirado.',
                      });
                      return;
                    }

                    // Update state
                    setUsers((prev) =>
                      prev.map((u) => (u.id === targetUser.id ? { ...u, password: forgotPasswordNewPassword.trim() } : u))
                    );
                    setForgotPasswordSuccessMessage(
                      `¡Contraseña restablecida correctamente para ${targetUser.first_name}!\n\nSu cuenta se ha actualizado en el servidor de forma segura. Volviendo a la ventana de login en 3 segundos...`
                    );
                    setForgotPasswordStatus(null);
                    addLog(
                      'Seguridad',
                      `Restableció con éxito su propia contraseña para la cuenta de ${targetUser.email} mediante verificación de token de seguridad.`
                    );

                    setTimeout(() => {
                      onClose();
                      setForgotPasswordEmail('');
                      setForgotPasswordStatus(null);
                      setForgotPasswordStep('request');
                      setForgotPasswordCodeInput('');
                      setForgotPasswordNewPassword('');
                      setForgotPasswordSuccessMessage('');
                    }, 3500);
                  } catch (err: any) {
                    setForgotPasswordStatus({
                      type: 'error',
                      message: `Fallo de comunicación con la plataforma: ${err.message || 'Error general de red.'}`,
                    });
                  }
                })();
              }}
              className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition duration-200 shadow-md cursor-pointer text-center"
            >
              Verificar y Guardar
            </button>
          </div>
        </>
      )}
    </div>
  );
};
