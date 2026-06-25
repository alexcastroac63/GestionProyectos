import React, { useState } from 'react';
import { Mail, Cpu, ExternalLink } from 'lucide-react';
import { useSystemStore } from '../../app/AppProviders';

interface SmtpSettingsPanelProps {
  smtpHost: string;
  setSmtpHost: (h: string) => void;
  smtpPort: string;
  setSmtpPort: (p: string) => void;
  smtpAccount: string;
  smtpAccountSet: (a: string) => void; // custom callback or setter
  smtpPassword: string;
  setSmtpPassword: (pw: string) => void;
}

export const SmtpSettingsPanel: React.FC<SmtpSettingsPanelProps> = ({
  smtpHost,
  setSmtpHost,
  smtpPort,
  setSmtpPort,
  smtpAccount,
  smtpAccountSet,
  smtpPassword,
  setSmtpPassword,
}) => {
  const { addLog } = useSystemStore();
  const [smtpTestStatus, setSmtpTestStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [smtpTestMessage, setSmtpTestMessage] = useState<string>('');
  const [smtpTestDetails, setSmtpTestDetails] = useState<string>('');
  const [testRecipient, setTestRecipient] = useState<string>('proyectosticampestre@gmail.com');

  return (
    <div className="max-w-2xl mx-auto border border-slate-150 rounded-2xl p-6 bg-slate-50/50 animate-fadeIn">
      <div className="flex items-center gap-2.5 border-b border-slate-200 pb-3 mb-5 text-left">
        <Mail className="w-5 h-5 text-blue-500" />
        <div>
          <span className="text-sm font-extrabold text-slate-800 uppercase tracking-wider block">Servidor de Alertas SMTP</span>
          <p className="text-[11px] text-slate-500 mt-0.5">Establezca los parámetros de host y credenciales para el envío masivo de notificaciones de riesgo.</p>
        </div>
      </div>

      <div className="space-y-4 text-left">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1.5 tracking-wider">Servidor SMTP (Host)</label>
            <input
              type="text"
              value={smtpHost}
              onChange={(e) => {
                setSmtpHost(e.target.value);
                localStorage.setItem('gcp_smtp_host', e.target.value);
              }}
              placeholder="smtp.gmail.com"
              className="w-full bg-white border border-slate-200 focus:ring-1 focus:ring-blue-500 rounded-lg px-3 py-2.5 text-xs text-slate-800 outline-none transition shadow-xs"
            />
          </div>

          <div>
            <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1.5 tracking-wider">Puerto SMTP</label>
            <input
              type="text"
              value={smtpPort}
              onChange={(e) => {
                setSmtpPort(e.target.value);
                localStorage.setItem('gcp_smtp_port', e.target.value);
              }}
              placeholder="587"
              className="w-full bg-white border border-slate-200 focus:ring-1 focus:ring-blue-500 rounded-lg px-3 py-2.5 text-xs text-slate-800 outline-none transition font-mono shadow-xs"
            />
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1.5 tracking-wider">Cuenta de Correo (SMTP User Sender)</label>
          <input
            type="email"
            value={smtpAccount}
            onChange={(e) => {
              smtpAccountSet(e.target.value);
              localStorage.setItem('gcp_smtp_account', e.target.value);
            }}
            placeholder="notificaciones-pmo@example.com"
            className="w-full bg-white border border-slate-200 focus:ring-1 focus:ring-blue-500 rounded-lg px-3 py-2.5 text-xs text-slate-800 outline-none transition shadow-xs"
          />
        </div>

        <div>
          <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1.5 tracking-wider">Clave de Correo (App Password / Credentials)</label>
          <input
            type="password"
            value={smtpPassword}
            onChange={(e) => {
              setSmtpPassword(e.target.value);
            }}
            placeholder="Ingrese contraseña o app password..."
            className="w-full bg-white border border-slate-200 focus:ring-1 focus:ring-blue-500 rounded-lg px-3 py-2.5 text-xs text-slate-800 outline-none transition font-mono shadow-xs"
          />
          <p className="text-[10px] text-slate-400 mt-1.5 leading-normal">
            La clave SMTP se almacena localmente de forma segura para conservar tus credenciales con cada cambio y evitar tener que reingresarla, o se define del lado del servidor como una variable de entorno.
          </p>

          <div className="mt-3.5 p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 leading-relaxed shadow-xs">
            <div className="flex items-start gap-2.5">
              <span className="text-sm shrink-0">💡</span>
              <div className="flex-1 space-y-1">
                <p className="font-extrabold text-amber-950">¿Gmail u Outlook reportan "Error 535: Invalid login"?</p>
                <p className="text-[11px] text-slate-600">
                  Los servidores SMTP modernos de Gmail u Outlook <span className="font-semibold text-rose-700">no aceptan tu contraseña habitual</span> por motivos de seguridad corporativa.
                </p>
                <div className="pt-1.5 pl-3 border-l-2 border-amber-300 space-y-1 text-[10.5px]">
                  <p><strong>Paso 1:</strong> Habilita la "Verificación en dos pasos" en tu cuenta de correo.</p>
                  <p><strong>Paso 2:</strong> Ve a <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" className="underline font-bold text-blue-700 hover:text-blue-800 flex inline-flex items-center gap-0.5 web-link">Contraseñas de Aplicaciones de Google<ExternalLink className="w-2.5 h-2.5 inline" /></a>.</p>
                  <p><strong>Paso 3:</strong> Genera una clave exclusiva de 16 caracteres para "Correo" y copia el código sin espacios en esta casilla.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mt-5">
          <div className="flex items-start gap-3">
            <span className="text-lg">✉️</span>
            <div className="flex-1">
              <span className="text-[11px] font-extrabold text-blue-800 uppercase block mb-1">Prueba Dinámica de Envío</span>
              <p className="text-[11px] text-blue-700 leading-normal mb-3.5">
                Verifique que la plataforma de correo alerte correctamente de desviaciones y métricas críticas de presupuesto de Lifecycle PM.
              </p>

              <div className="mb-4 text-left">
                <label className="block text-[10px] font-extrabold text-blue-800 uppercase mb-1.5 tracking-wider">Destinatario de Prueba</label>
                <input
                  type="email"
                  value={testRecipient}
                  onChange={(e) => setTestRecipient(e.target.value)}
                  placeholder="ejemplo@campestre.com.sv"
                  className="w-full max-w-md bg-white border border-blue-200 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none transition shadow-sm"
                />
                <p className="text-[10px] text-blue-600/80 mt-1">Escriba cualquier dirección de correo (como <strong>alex.castro@campestre.com.sv</strong>) para comprobar que su servidor SMTP puede entregar correos a ese dominio.</p>
              </div>

              <button
                type="button"
                disabled={smtpTestStatus === 'loading'}
                onClick={async () => {
                  if (!smtpHost.trim() || !smtpPort.trim()) {
                    setSmtpTestStatus('error');
                    setSmtpTestMessage('Por favor configure el Servidor SMTP (Host) y el Puerto.');
                    setSmtpTestDetails('La configuración de host y puerto es mandatoria.');
                    return;
                  }
                  if (!smtpAccount.trim() || !smtpPassword.trim()) {
                    setSmtpTestStatus('error');
                    setSmtpTestMessage('Por favor complete la Cuenta de Correo y la Contraseña de Alertas antes de probar.');
                    setSmtpTestDetails('Las credenciales de correo emisor no pueden estar vacías.');
                    return;
                  }
                  if (!testRecipient.trim() || !testRecipient.includes('@')) {
                    setSmtpTestStatus('error');
                    setSmtpTestMessage('Por favor especifique un correo electrónico de destinatario válido.');
                    setSmtpTestDetails('El destinatario de prueba no posee un formato correcto.');
                    return;
                  }

                  setSmtpTestStatus('loading');
                  setSmtpTestMessage('Conectando con el servidor SMTP...');
                  setSmtpTestDetails('Estableciendo conexión por socket de red...');

                  try {
                    const res = await fetch('/api/test-smtp', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json'
                      },
                      body: JSON.stringify({
                        host: smtpHost.trim(),
                        port: smtpPort.trim(),
                        username: smtpAccount.trim(),
                        password: smtpPassword.trim(),
                        recipient: testRecipient.trim()
                      })
                    });

                    const data = await res.json();
                    if (res.ok && data.success) {
                      setSmtpTestStatus('success');
                      setSmtpTestMessage(data.message || '¡Conexión SMTP exitosa!');
                      setSmtpTestDetails(data.banner || '');
                      addLog('Prueba SMTP', `Envío de prueba exitoso a ${smtpHost}:${smtpPort} desde ${smtpAccount}`);
                    } else {
                      setSmtpTestStatus('error');
                      setSmtpTestMessage(data.message || 'Error al conectar con el servidor.');
                      setSmtpTestDetails(data.code ? `Código de error: ${data.code}` : 'Verifique sus credenciales, puertos y bloqueos de seguridad del host.');
                      addLog('Prueba SMTP', `Fallo de conexión SMTP a ${smtpHost}:${smtpPort}: ${data.message || 'Error desconocido'}`);
                    }
                  } catch (err: any) {
                    setSmtpTestStatus('error');
                    setSmtpTestMessage('No se pudo establecer comunicación con el servidor local/remoto.');
                    setSmtpTestDetails(err.message || 'Fallo general de red o servicio de pruebas inactivo.');
                  }
                }}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold text-xs py-2 px-4 rounded-xl transition active:scale-[0.98] cursor-pointer shadow-sm shadow-blue-500/10 flex items-center gap-1.5"
              >
                {smtpTestStatus === 'loading' ? (
                  <>
                    <Cpu className="w-3.5 h-3.5 animate-spin" />
                    <span>Probando Conexión...</span>
                  </>
                ) : (
                  <span>Probar Envío de Alerta Ahora</span>
                )}
              </button>

              {smtpTestStatus !== 'idle' && (
                <div className={`mt-3.5 p-3.5 rounded-xl border text-xs leading-relaxed animate-fadeIn ${
                  smtpTestStatus === 'loading' ? 'bg-amber-50 border-amber-200 text-amber-800' :
                  smtpTestStatus === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
                  'bg-rose-50 border-rose-200 text-rose-800'
                }`}>
                  <div className="flex items-start gap-2.5">
                    <span className="text-sm shrink-0">
                      {smtpTestStatus === 'loading' && '⏳'}
                      {smtpTestStatus === 'success' && '✅'}
                      {smtpTestStatus === 'error' && '❌'}
                    </span>
                    <div className="flex-1 space-y-1">
                      <p className="font-extrabold">{smtpTestMessage}</p>
                      {smtpTestDetails && (
                        <p className="text-[10.5px] opacity-95 font-mono bg-white/60 p-2 rounded border border-slate-200/50 break-all select-all mt-1">
                          {smtpTestDetails}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
