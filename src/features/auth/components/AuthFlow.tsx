import React, { useState } from 'react';
import { Mail, Lock, AlertTriangle, Key, RefreshCw, UserPlus, Users2, Plus, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { User, Tenant } from '../../../types';
import { googleSignIn, microsoftSignIn } from '../../../firebase';
import { useSystemStore } from '../../../app/providers/SystemProvider';
import { ForgotPasswordFlow } from '../ForgotPasswordFlow';

export const AuthFlow: React.FC = () => {
  const {
    tenants,
    setTenants,
    users,
    setUsers,
    addLog,
    setLoggedInUser,
  } = useSystemStore();

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginTenant, setLoginTenant] = useState('grupo-campestre');
  const [msOperationNotAllowed, setMsOperationNotAllowed] = useState(false);

  // States for consultative registration is tenant exists or needs to be created
  const [pendingNewUser, setPendingNewUser] = useState<{
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    avatar_url?: string;
    source: 'Google' | 'Microsoft' | 'Microsoft Demo';
  } | null>(null);
  const [joinOrBrandOption, setJoinOrBrandOption] = useState<'join' | 'create'>('join');
  const [selectedAssociationTenantId, setSelectedAssociationTenantId] = useState('grupo-campestre');
  const [newTenantName, setNewTenantName] = useState('');
  const [newTenantId, setNewTenantId] = useState('');
  const [newTenantDescription, setNewTenantDescription] = useState('');
  const [newTenantDomain, setNewTenantDomain] = useState('');
  const [registrationError, setRegistrationError] = useState('');
  const [registrationSuccessMessage, setRegistrationSuccessMessage] = useState('');
  const [showLoginForgotPassword, setShowLoginForgotPassword] = useState(false);

  // --- Handlers ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    
    const emailToFind = loginEmail.trim().toLowerCase();
    if (!emailToFind) {
      setLoginError('Por favor, ingrese un correo electrónico corporativo.');
      return;
    }

    if (!loginPassword || loginPassword.length < 6) {
      setLoginError('La contraseña ingresada debe ser de al menos 6 caracteres.');
      return;
    }

    // Search inside current users list
    const foundUser = users.find(u => u.email.toLowerCase() === emailToFind);
    if (!foundUser) {
      setLoginError('El correo ingresado no pertenece a ningún integrante activo de este Tenant.');
      return;
    }

    // Validate tenant association
    const userTenant = foundUser.tenant_id || 'grupo-campestre';
    if (userTenant !== loginTenant) {
      setLoginError('Esta cuenta no está autorizada para acceder a la suscripción (Tenant) seleccionada.');
      return;
    }

    if (foundUser.status === 'PENDING') {
      const tenantObj = tenants.find(t => t.id === foundUser?.tenant_id);
      const tenantName = tenantObj ? tenantObj.name : (foundUser?.tenant_id || '');
      setLoginError(`Su solicitud para unirse al Tenant "${tenantName}" está pendiente de aprobación por el Administrador. El Administrador debe aprobar su ingreso e incluirlo con un perfil corporativo activo antes de que pueda iniciar sesión.`);
      return;
    }

    if (foundUser.status === 'INACTIVE') {
      setLoginError('Esta cuenta se encuentra desactivada temporalmente en el panel administrativo.');
      return;
    }

    setIsLoggingIn(true);
    try {
      // Secure password matching validation for live implementation via server check
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: emailToFind,
          password: loginPassword
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setLoginError(data.message || 'La contraseña ingresada es incorrecta.');
        setIsLoggingIn(false);
        return;
      }

      // Proceed with authenticated secure session
      setLoggedInUser(foundUser);
      localStorage.setItem('gcp_logged_in_user', JSON.stringify({
        user: foundUser,
        token: data.token
      }));
      setIsLoggingIn(false);
      setLoginEmail('');
      setLoginPassword('');
      addLog(`${foundUser.first_name} ${foundUser.last_name} (${foundUser.role})`, 'Inició sesión en la plataforma multi-tenant de manera segura.');

    } catch (err: any) {
      setLoginError(`Error de comunicación con el Directorio de Autenticación: ${err.message || 'Error general de red.'}`);
      setIsLoggingIn(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoginError('');
    setIsLoggingIn(true);
    try {
      const gUser = await googleSignIn();
      if (!gUser) {
        setLoginError('No se pudo completar el inicio de sesión con Google.');
        setIsLoggingIn(false);
        return;
      }

      if (!gUser.email) {
        setLoginError('No se pudo obtener un correo electrónico válido de su cuenta de Google.');
        setIsLoggingIn(false);
        return;
      }

      const emailToFind = gUser.email.toLowerCase();
      let foundUser = users.find(u => u.email.toLowerCase() === emailToFind);

      if (!foundUser) {
        const displayName = gUser.displayName || 'Usuario Google';
        const parts = displayName.split(' ');
        const first_name = parts[0] || 'Usuario';
        const last_name = parts.slice(1).join(' ') || 'Google';

        setPendingNewUser({
          id: gUser.uid,
          first_name,
          last_name,
          email: emailToFind,
          avatar_url: gUser.photoURL || undefined,
          source: 'Google'
        });
        setSelectedAssociationTenantId(loginTenant);
        setRegistrationError('');
      } else {
        if (foundUser.status === 'PENDING') {
          const tenantObj = tenants.find(t => t.id === foundUser?.tenant_id);
          const tenantName = tenantObj ? tenantObj.name : (foundUser?.tenant_id || '');
          setLoginError(`Su solicitud para unirse al Tenant "${tenantName}" está pendiente de aprobación por el Administrador.`);
          setIsLoggingIn(false);
          return;
        }
        if (foundUser.status === 'INACTIVE') {
          setLoginError('Esta cuenta se encuentra desactivada temporalmente en el panel administrativo.');
          setIsLoggingIn(false);
          return;
        }

        if (foundUser.tenant_id && foundUser.tenant_id !== loginTenant) {
          setLoginTenant(foundUser.tenant_id);
          addLog('Sistema Autenticación', `Redireccionando usuario Google al Tenant asociado (${foundUser.tenant_id}).`);
        }

        if (gUser.photoURL && foundUser.avatar_url !== gUser.photoURL) {
          const updatedUser = { ...foundUser, avatar_url: gUser.photoURL };
          foundUser = updatedUser;
          setUsers(prev => {
            const updated = prev.map(u => u.id === updatedUser.id ? updatedUser : u);
            localStorage.setItem('gcp_users', JSON.stringify(updated));
            return updated;
          });
        }

        setLoggedInUser(foundUser);
        localStorage.setItem('gcp_logged_in_user', JSON.stringify(foundUser));
        setLoginEmail('');
        setLoginPassword('');
        addLog(`${foundUser.first_name} ${foundUser.last_name} (${foundUser.role})`, 'Inició sesión de manera segura con Google.');
      }
    } catch (error: any) {
      if (error && error.code === 'auth/popup-closed-by-user') {
        console.warn('Google Sign-In popup closed by user.');
      } else {
        setLoginError(`Error de Google Auth: ${error?.message || error}`);
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleMicrosoftLogin = async () => {
    setLoginError('');
    setMsOperationNotAllowed(false);
    setIsLoggingIn(true);
    try {
      const mUser = await microsoftSignIn();
      if (!mUser) {
        setLoginError('No se pudo completar el inicio de sesión con Microsoft.');
        setIsLoggingIn(false);
        return;
      }

      if (!mUser.email) {
        setLoginError('No se pudo obtener un correo electrónico válido de su cuenta de Microsoft.');
        setIsLoggingIn(false);
        return;
      }

      const emailToFind = mUser.email.toLowerCase();
      let foundUser = users.find(u => u.email.toLowerCase() === emailToFind);

      if (!foundUser) {
        const displayName = mUser.displayName || 'Usuario Microsoft';
        const parts = displayName.split(' ');
        const first_name = parts[0] || 'Usuario';
        const last_name = parts.slice(1).join(' ') || 'Microsoft';

        setPendingNewUser({
          id: mUser.uid,
          first_name,
          last_name,
          email: emailToFind,
          avatar_url: mUser.photoURL || undefined,
          source: 'Microsoft'
        });
        setSelectedAssociationTenantId(loginTenant);
        setRegistrationError('');
      } else {
        if (foundUser.status === 'PENDING') {
          const tenantObj = tenants.find(t => t.id === foundUser?.tenant_id);
          const tenantName = tenantObj ? tenantObj.name : (foundUser?.tenant_id || '');
          setLoginError(`Su solicitud para unirse al Tenant "${tenantName}" está pendiente de aprobación por el Administrador.`);
          setIsLoggingIn(false);
          return;
        }
        if (foundUser.status === 'INACTIVE') {
          setLoginError('Esta cuenta se encuentra desactivada temporalmente en el panel administrativo.');
          setIsLoggingIn(false);
          return;
        }

        if (foundUser.tenant_id && foundUser.tenant_id !== loginTenant) {
          setLoginTenant(foundUser.tenant_id);
          addLog('Sistema Autenticación', `Redireccionando usuario Microsoft al Tenant asociado (${foundUser.tenant_id}).`);
        }

        if (mUser.photoURL && foundUser.avatar_url !== mUser.photoURL) {
          const updatedUser = { ...foundUser, avatar_url: mUser.photoURL };
          foundUser = updatedUser;
          setUsers(prev => {
            const updated = prev.map(u => u.id === updatedUser.id ? updatedUser : u);
            localStorage.setItem('gcp_users', JSON.stringify(updated));
            return updated;
          });
        }

        setLoggedInUser(foundUser);
        localStorage.setItem('gcp_logged_in_user', JSON.stringify(foundUser));
        setLoginEmail('');
        setLoginPassword('');
        addLog(`${foundUser.first_name} ${foundUser.last_name} (${foundUser.role})`, 'Inició sesión de manera segura con Microsoft.');
      }
    } catch (error: any) {
      if (error && error.code === 'auth/operation-not-allowed') {
        setMsOperationNotAllowed(true);
        setLoginError('Inicio de sesión de Microsoft no habilitado: El proveedor microsoft.com está desactivado en la configuración de Firebase.');
      } else if (error && error.code === 'auth/popup-closed-by-user') {
        console.warn('Microsoft Sign-In popup closed by user.');
      } else {
        setLoginError(`Error de Microsoft Auth: ${error?.message || error}`);
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleDemoMicrosoftLogin = () => {
    setLoginError('');
    setIsLoggingIn(true);
    
    setTimeout(() => {
      const emailToFind = `microsoft.demo@${loginTenant}.com`;
      let foundUser = users.find(u => u.email.toLowerCase() === emailToFind);

      if (!foundUser) {
        setPendingNewUser({
          id: 'demo-ms-uid-123456',
          first_name: 'Santiago',
          last_name: 'Mendoza (MS Demo)',
          email: emailToFind,
          source: 'Microsoft Demo'
        });
        setSelectedAssociationTenantId(loginTenant);
        setRegistrationError('');
        setIsLoggingIn(false);
        setMsOperationNotAllowed(false);
      } else {
        if (foundUser.status === 'PENDING') {
          const tenantObj = tenants.find(t => t.id === foundUser?.tenant_id);
          const tenantName = tenantObj ? tenantObj.name : (foundUser?.tenant_id || '');
          setLoginError(`Su solicitud para unirse al Tenant "${tenantName}" está pendiente de aprobación por el Administrador.`);
          setIsLoggingIn(false);
          setMsOperationNotAllowed(false);
          return;
        }
        if (foundUser.status === 'INACTIVE') {
          setLoginError('Esta cuenta se encuentra desactivada temporalmente en el panel administrativo.');
          setIsLoggingIn(false);
          setMsOperationNotAllowed(false);
          return;
        }
        setLoggedInUser(foundUser);
        localStorage.setItem('gcp_logged_in_user', JSON.stringify(foundUser));
        setLoginEmail('');
        setLoginPassword('');
        addLog(`${foundUser.first_name} ${foundUser.last_name}`, 'Inició sesión en modo de demostración con Microsoft.');
        setIsLoggingIn(false);
        setMsOperationNotAllowed(false);
      }
    }, 800);
  };

  const handleCompleteSocialRegistration = () => {
    if (!pendingNewUser) return;
    setRegistrationError('');
    setRegistrationSuccessMessage('');

    if (joinOrBrandOption === 'join') {
      const selectedTenantId = selectedAssociationTenantId;
      if (!selectedTenantId) {
        setRegistrationError('Debe seleccionar un Tenant válido al que unirse.');
        return;
      }

      const emailToFind = pendingNewUser.email.toLowerCase();
      let foundUser = users.find(u => u.email.toLowerCase() === emailToFind);

      if (!foundUser) {
        foundUser = {
          id: pendingNewUser.id,
          first_name: pendingNewUser.first_name,
          last_name: pendingNewUser.last_name,
          email: emailToFind,
          avatar_url: pendingNewUser.avatar_url,
          role: 'Pendiente de Asignación',
          status: 'PENDING',
          tenant_id: selectedTenantId
        };

        setUsers(prev => {
          const updated = [...prev, foundUser!];
          localStorage.setItem('gcp_users', JSON.stringify(updated));
          return updated;
        });

        addLog('Sistema Autenticación', `Se envió una solicitud de ingreso de ${pendingNewUser.first_name} ${pendingNewUser.last_name} (${emailToFind}) para unirse al Tenant ${selectedTenantId}.`);
      }

      const tenantObj = tenants.find(t => t.id === selectedTenantId);
      const tenantName = tenantObj ? tenantObj.name : selectedTenantId;

      setRegistrationSuccessMessage(`¡Solicitud de ingreso registrada con éxito! Su cuenta ha sido enviada para su aprobación en el Tenant "${tenantName}". El administrador de este Tenant debe revisar su solicitud, activarlo y asignarle un determinado perfil corporativo para que pueda iniciar sesión.`);
      setPendingNewUser(null);
    } else {
      const tid = newTenantId.trim().toLowerCase();
      const tname = newTenantName.trim();
      if (!tname) {
        setRegistrationError('El nombre de la suscripción (Tenant) es requerido.');
        return;
      }
      if (!tid) {
        setRegistrationError('El ID Identificador de la suscripción es requerido.');
        return;
      }
      if (tid.length < 3) {
        setRegistrationError('El ID Identificador debe tener al menos 3 caracteres.');
        return;
      }

      const exists = tenants.some(t => t.id === tid);
      if (exists) {
        setRegistrationError(`La suscripción única con ID "${tid}" ya existe en el sistema. Por favor elija otro ID Identificador.`);
        return;
      }

      const nextTenantObj: Tenant = {
        id: tid,
        name: tname,
        description: newTenantDescription.trim() || `Suscripción autónoma de ${tname}`,
        domain: newTenantDomain.trim() || pendingNewUser.email.split('@')[1] || 'domain.com',
        plan: 'Premium',
        status: 'Active'
      };

      const emailToFind = pendingNewUser.email.toLowerCase();
      const rootAdminUser: User = {
        id: pendingNewUser.id,
        first_name: pendingNewUser.first_name,
        last_name: pendingNewUser.last_name,
        email: emailToFind,
        avatar_url: pendingNewUser.avatar_url,
        role: 'Administrador',
        status: 'ACTIVE',
        tenant_id: tid
      };

      setTenants(prev => {
        const updated = [...prev, nextTenantObj];
        localStorage.setItem('gcp_tenants', JSON.stringify(updated));
        return updated;
      });

      setUsers(prev => {
        const updated = [...prev, rootAdminUser];
        localStorage.setItem('gcp_users', JSON.stringify(updated));
        return updated;
      });

      setLoggedInUser(rootAdminUser);
      localStorage.setItem('gcp_logged_in_user', JSON.stringify(rootAdminUser));
      setPendingNewUser(null);

      addLog('Sistema Autenticación', `Se aprovisionó exitosamente un nuevo Tenant corporativo [${tid}] para la empresa "${tname}".`);
      addLog(`${rootAdminUser.first_name} ${rootAdminUser.last_name}`, `Se registró y asumió rol de Administrador Principal para el Tenant [${tid}].`);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 text-slate-100 p-4 font-sans antialiased relative overflow-y-auto">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_105%)] opacity-30 pointer-events-none" />
      
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 shadow-2xl rounded-2xl p-6 sm:p-8 m-auto z-10 relative flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-extrabold text-white text-lg shadow-md shadow-blue-500/20">
              L
            </div>
            <div className="flex flex-col">
              <span className="text-white font-bold text-lg tracking-tight leading-none mb-1 font-sans">Lifecycle PM</span>
              <span className="text-xs text-blue-400 font-mono tracking-wider uppercase font-semibold">Security Gate</span>
            </div>
          </div>

          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-slate-100 tracking-tight font-sans">
              {pendingNewUser 
                ? `Completar Registro (${pendingNewUser.source})`
                : showLoginForgotPassword 
                  ? 'Recuperar Contraseña' 
                  : 'Iniciar Sesión'}
            </h2>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed font-sans">
              {pendingNewUser
                ? 'Personalice y prepare su espacio de trabajo segregado seleccionando o creando la suscripción única (CIA) correspondiente.'
                : showLoginForgotPassword 
                  ? 'Obtenga una clave temporal de recuperación gestionada y enviada a través de SMTP.' 
                  : 'Ingrese sus credenciales de Lifecycle PM para acceder al entorno de gestión del ciclo de vida de proyectos corporativo.'}
            </p>
          </div>

          {registrationSuccessMessage && (
            <div className="mb-4 bg-green-500/10 border border-green-500/25 rounded-xl p-4 text-xs text-green-400 leading-normal text-left">
              <p>{registrationSuccessMessage}</p>
              <button
                onClick={() => setRegistrationSuccessMessage('')}
                className="mt-3 text-[11px] font-bold text-green-300 hover:text-green-200 underline cursor-pointer"
              >
                Entendido
              </button>
            </div>
          )}

          {pendingNewUser ? (
            <div className="space-y-4 text-left">
              <div className="inline-flex items-center justify-start w-full gap-3 p-3 bg-slate-950/40 border border-slate-800/60 rounded-xl mb-1">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 overflow-hidden shrink-0">
                  {pendingNewUser.avatar_url ? (
                    <img src={pendingNewUser.avatar_url} alt="Profile" className="w-10 h-10 object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <UserPlus className="w-5 h-5 text-blue-400" />
                  )}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200 font-sans">¡Hola, {pendingNewUser.first_name} {pendingNewUser.last_name}!</h4>
                  <p className="text-[10px] text-slate-400 font-mono leading-none mt-1">{pendingNewUser.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => {
                    setJoinOrBrandOption('join');
                    setRegistrationError('');
                  }}
                  className={`py-3 px-3 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1.5 cursor-pointer text-center ${
                    joinOrBrandOption === 'join'
                      ? 'bg-blue-600/10 border-blue-500 text-blue-400 shadow-lg shadow-blue-500/5'
                      : 'bg-slate-950/60 border-slate-800/60 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <Users2 className="w-4 h-4 shrink-0" />
                  <span>Unirme a CIA</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setJoinOrBrandOption('create');
                    setRegistrationError('');
                    if (!newTenantName) {
                      setNewTenantName('Empresa ' + pendingNewUser.last_name);
                      const slug = (pendingNewUser.last_name).toLowerCase().replace(/[^a-z0-9]/g, '-') + '-corp';
                      setNewTenantId(slug);
                      setNewTenantDomain(pendingNewUser.email.split('@')[1] || 'domain.com');
                    }
                  }}
                  className={`py-3 px-3 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1.5 cursor-pointer text-center ${
                    joinOrBrandOption === 'create'
                      ? 'bg-blue-600/10 border-blue-500 text-blue-400 shadow-lg shadow-blue-500/5'
                      : 'bg-slate-950/60 border-slate-800/60 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <Plus className="w-4 h-4 shrink-0" />
                  <span>Crear Nueva CIA</span>
                </button>
              </div>

              {joinOrBrandOption === 'join' ? (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Suscripción Existente (CIA)</label>
                    <select
                      value={selectedAssociationTenantId}
                      onChange={(e) => setSelectedAssociationTenantId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all cursor-pointer [&>option]:bg-slate-950"
                    >
                      {tenants.map(t => (
                        <option key={t.id} value={t.id}>
                          🏢 {t.name} ({t.id})
                        </option>
                      ))}
                    </select>
                    <p className="text-[10px] text-slate-500 leading-normal font-sans">
                      Entrará como integrante independiente en esta CIA con el rol corporativo por defecto de <strong className="text-slate-300">Líder Técnico</strong>.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-1.5 align-left text-left">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Nombre de la Suscripción / Compañía</label>
                    <input
                      type="text"
                      value={newTenantName}
                      onChange={(e) => {
                        setNewTenantName(e.target.value);
                        const slug = e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9\s-]/g, '')
                          .replace(/\s+/g, '-')
                          .replace(/-+/g, '-');
                        setNewTenantId(slug);
                      }}
                      placeholder="Ej: Mi Empresa Consultores"
                      className="w-full bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all font-sans"
                    />
                  </div>

                  <div className="space-y-1.5 align-left text-left">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">ID Identificador Único (CIA ID)</label>
                    <input
                      type="text"
                      value={newTenantId}
                      onChange={(e) => setNewTenantId(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                      placeholder="Ej: mi-empresa-consultores"
                      className="w-full bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 rounded-xl px-3.5 py-2.5 text-xs font-mono tracking-wide focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all"
                    />
                    <p className="text-[9px] text-slate-500 font-mono leading-tight">
                      Este identificador se utilizará internamente para segregar lógicamente sus proyectos y planes presupuestarios.
                    </p>
                  </div>

                  <div className="space-y-1.5 align-left text-left">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Dominio Corporativo Principal</label>
                    <input
                      type="text"
                      value={newTenantDomain}
                      onChange={(e) => setNewTenantDomain(e.target.value.toLowerCase().trim())}
                      placeholder="Ej: miempresa.com"
                      className="w-full bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all font-mono"
                    />
                  </div>

                  <div className="space-y-1.5 align-left text-left">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Descripción del Workspace</label>
                    <textarea
                      value={newTenantDescription}
                      onChange={(e) => setNewTenantDescription(e.target.value)}
                      placeholder="Breve descripción del entorno de desarrollo privado corporativo."
                      rows={2}
                      className="w-full bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all font-sans resize-none"
                    />
                  </div>

                  <div className="bg-blue-600/10 border border-blue-500/20 rounded-xl p-3 text-[10px] text-blue-300 leading-normal">
                    🛡️ Al crear una CIA corporativa, usted se registrará como el <strong className="text-white font-semibold">Administrador Principal</strong>.
                  </div>
                </div>
              )}

              {registrationError && (
                <div className="bg-red-500/10 border border-red-500/25 rounded-xl p-3 flex items-start gap-2.5 text-xs text-red-400">
                  <AlertTriangle className="w-4.5 h-4.5 mt-0.5 shrink-0" />
                  <p className="leading-relaxed text-left font-sans">{registrationError}</p>
                </div>
              )}

              <div className="flex gap-2 text-xs font-sans pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setPendingNewUser(null);
                    setRegistrationError('');
                  }}
                  className="flex-1 bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-300 font-semibold py-2.5 px-4 rounded-xl text-xs transition duration-200 cursor-pointer text-center font-sans"
                >
                  Regresar
                </button>
                <button
                  type="button"
                  onClick={handleCompleteSocialRegistration}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition duration-200 shadow-md flex items-center justify-center gap-1.5 cursor-pointer font-sans"
                >
                  <span>{joinOrBrandOption === 'join' ? 'Unirse y Entrar' : 'Aprovisionar y Entrar'}</span>
                </button>
              </div>
            </div>
          ) : showLoginForgotPassword ? (
            <ForgotPasswordFlow
              onClose={() => setShowLoginForgotPassword(false)}
              users={users}
              setUsers={setUsers}
              addLog={addLog}
            />
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Tenant Selector */}
              <div className="space-y-1.5 text-left">
                <label id="login-cia-label" className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">CIA</label>
                <select
                  value={loginTenant}
                  onChange={(e) => setLoginTenant(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all [&>option]:bg-slate-950 cursor-pointer font-sans"
                >
                  {tenants.map(t => (
                    <option key={t.id} value={t.id}>
                      🏢 {t.name} ({t.id})
                    </option>
                  ))}
                </select>
              </div>

              {/* Email Input */}
              <div className="space-y-1.5 text-left">
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">Correo</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="ejemplo@empresa.com"
                    className="w-full bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 rounded-xl pl-10 pr-4 py-2.5 text-xs tracking-wide focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all font-sans"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5 text-left">
                <div className="flex justify-between items-center">
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">Contraseña</label>
                  <button
                    type="button"
                    onClick={() => setShowLoginForgotPassword(true)}
                    className="text-[10px] text-blue-400 hover:text-blue-300 font-semibold font-sans cursor-pointer focus:outline-none"
                  >
                    ¿Olvidó su contraseña?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 rounded-xl pl-10 pr-10 py-2.5 text-xs tracking-wide focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all font-sans"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-400 cursor-pointer"
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {loginError && (
                <div className="bg-red-500/10 border border-red-500/25 rounded-xl p-3 flex items-start gap-2.5 text-xs text-red-400 text-left leading-normal font-sans">
                  <AlertTriangle className="w-4.5 h-4.5 mt-0.5 shrink-0" />
                  <p>{loginError}</p>
                </div>
              )}

              {/* Submit button */}
              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition duration-200 shadow-md shadow-blue-600/10 hover:shadow-blue-600/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed font-sans mt-2"
              >
                {isLoggingIn ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Autenticando...</span>
                  </>
                ) : (
                  <>
                    <span>Entrar al Sistema</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>

              {/* Microsoft and Google login alternatives */}
              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-slate-800/80"></div>
                <span className="flex-shrink mx-3 text-[10px] text-slate-500 font-bold uppercase tracking-wider font-mono">O ingresar con</span>
                <div className="flex-grow border-t border-slate-800/80"></div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={isLoggingIn}
                  className="flex items-center justify-center gap-2 bg-slate-950 border border-slate-800 hover:bg-slate-850 text-slate-300 font-semibold py-2 px-3 rounded-xl text-xs transition duration-200 cursor-pointer"
                >
                  {/* Google SVG icon */}
                  <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                    <path fill="#EA4335" d="M12 5.04c1.65 0 3.13.57 4.3 1.69l3.22-3.22C17.56 1.7 14.97 1 12 1 7.35 1 3.39 3.66 1.39 7.56l3.86 3C6.18 7.37 8.82 5.04 12 5.04z" />
                    <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.46c-.28 1.48-1.12 2.73-2.38 3.58l3.7 2.87c2.16-1.99 3.71-4.92 3.71-8.6z" />
                    <path fill="#FBBC05" d="M5.25 14.44A6.97 6.97 0 0 1 4.86 12c0-.85.15-1.67.4-2.44L1.39 6.56C.5 8.35 0 10.12 0 12s.5 3.65 1.39 5.44l3.86-3z" />
                    <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.7-2.87c-1.03.69-2.34 1.1-4.26 1.1-3.18 0-5.82-2.33-6.75-5.52l-3.86 3C3.39 20.34 7.35 23 12 23z" />
                  </svg>
                  <span>Google</span>
                </button>

                <button
                  type="button"
                  onClick={handleMicrosoftLogin}
                  disabled={isLoggingIn}
                  className="flex items-center justify-center gap-2 bg-slate-950 border border-slate-800 hover:bg-slate-850 text-slate-300 font-semibold py-2 px-3 rounded-xl text-xs transition duration-200 cursor-pointer"
                >
                  {/* Microsoft SVG icon */}
                  <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 23 23">
                    <path fill="#f35325" d="M0 0h11v11H0z" />
                    <path fill="#80bb1a" d="M12 0h11v11H12z" />
                    <path fill="#00a1f1" d="M0 12h11v11H0z" />
                    <path fill="#ffb900" d="M12 12h11v11H12z" />
                  </svg>
                  <span>Microsoft</span>
                </button>
              </div>

              {/* Microsoft operation not allowed handler with instant Local Demo simulation */}
              {msOperationNotAllowed && (
                <div className="pt-2 text-center">
                  <p className="text-[10px] text-slate-400 italic leading-relaxed mb-2 font-mono">
                    ¿Desea probar el flujo de inicio de sesión con Microsoft usando nuestra pasarela de simulación integrada para este tenant?
                  </p>
                  <button
                    type="button"
                    onClick={handleDemoMicrosoftLogin}
                    disabled={isLoggingIn}
                    className="inline-flex items-center gap-1.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/25 text-blue-400 font-bold px-3 py-2 rounded-xl text-[10px] font-mono hover:text-blue-300 transition duration-150 cursor-pointer"
                  >
                    <Key className="w-3 h-3 shrink-0" />
                    <span>Iniciar Simulación Microsoft</span>
                  </button>
                </div>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
