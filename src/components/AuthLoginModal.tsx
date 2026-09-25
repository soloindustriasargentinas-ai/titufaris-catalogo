import React, { useState, useEffect } from 'react';
import { X, Lock, ShieldCheck, KeyRound, AlertCircle, Eye, EyeOff, UserCheck, ShieldAlert, CheckCircle2, ArrowRight } from 'lucide-react';
import { User, CompanyProfile } from '../types';
import { DEFAULT_INITIAL_PASSWORD } from '../data/initialData';
import { verifyCredential, hashCredential } from '../utils/crypto';

interface AuthLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  onSuccess: (user: User) => void;
  onUpdateUserPassword?: (userId: string, newPassword: string) => Promise<void> | void;
  company: CompanyProfile;
}

export const AuthLoginModal: React.FC<AuthLoginModalProps> = ({
  isOpen,
  onClose,
  users,
  onSuccess,
  onUpdateUserPassword,
  company,
}) => {
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Mandatory first-time password change step
  const [step, setStep] = useState<'login' | 'force_change_password'>('login');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmNewPassword, setConfirmNewPassword] = useState<string>('');
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      if (users.length > 0 && (!selectedUserId || !users.some(u => u.id === selectedUserId))) {
        setSelectedUserId(users[0].id);
      }
      setPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setErrorMsg('');
      setStep('login');
      setIsSubmitting(false);
    }
  }, [isOpen, users]);

  if (!isOpen) return null;

  const activeUser = users.find(u => u.id === selectedUserId) || users[0];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!activeUser) {
      setErrorMsg('Seleccione un usuario autorizado.');
      return;
    }

    if (!password) {
      setErrorMsg('Por favor ingrese su contraseña de acceso.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Validate password against stored hash or plaintext fallback
      const userPass = activeUser.password || DEFAULT_INITIAL_PASSWORD;
      const isLegacyPinMatch = activeUser.pin && password === activeUser.pin;
      const isPasswordMatch = (await verifyCredential(password, userPass)) || isLegacyPinMatch;

      if (isPasswordMatch) {
        // Check if user must change password (first login or flagged)
        const isDefaultPass = await verifyCredential(DEFAULT_INITIAL_PASSWORD, userPass);
        const needsPasswordChange = activeUser.mustChangePassword === true || isDefaultPass;

        if (needsPasswordChange) {
          setStep('force_change_password');
          setIsSubmitting(false);
          setErrorMsg('');
        } else {
          onSuccess(activeUser);
          onClose();
        }
      } else {
        setErrorMsg('Contraseña incorrecta. Verifique sus credenciales con el administrador.');
        setIsSubmitting(false);
      }
    } catch {
      setErrorMsg('Error en verificación de credenciales.');
      setIsSubmitting(false);
    }
  };

  const handleForcePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!newPassword || newPassword.length < 6) {
      setErrorMsg('La nueva contraseña debe tener un mínimo de 6 caracteres alfanuméricos.');
      return;
    }

    if (newPassword === DEFAULT_INITIAL_PASSWORD) {
      setErrorMsg('No puede utilizar la contraseña provisional por defecto. Elija una clave personal diferente.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setErrorMsg('Las dos contraseñas no coinciden. Verifíquelas.');
      return;
    }

    // Require at least one letter and one number for real security
    const hasLetter = /[a-zA-Z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    if (!hasLetter || !hasNumber) {
      setErrorMsg('Por seguridad, la contraseña debe combinar al menos una letra y un número.');
      return;
    }

    setIsSubmitting(true);

    try {
      const hashed = await hashCredential(newPassword);
      if (onUpdateUserPassword && activeUser) {
        await onUpdateUserPassword(activeUser.id, hashed);
      }
      
      const updatedUser: User = {
        ...activeUser,
        password: hashed,
        mustChangePassword: false,
      };

      onSuccess(updatedUser);
      onClose();
    } catch (err) {
      setErrorMsg('Ocurrió un error al actualizar la contraseña. Intente nuevamente.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base flex items-center gap-2">
                <span>{step === 'login' ? 'Acceso al Panel' : 'Seguridad de Acceso'}</span>
                <span className="text-[10px] uppercase font-bold bg-orange-600 text-white px-2 py-0.5 rounded-full">
                  {step === 'login' ? 'Admin / Staff' : 'Primer Acceso'}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                {step === 'login' ? `${company.name} - Autenticación Segura` : 'Actualización Obligatoria de Contraseña'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Cerrar y volver al catálogo público"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        {step === 'login' ? (
          <div className="p-5 space-y-4">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
              <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                El acceso a la edición de artículos, inventario, costos y facturación requiere contraseña de usuario autorizado de <strong>{company.name}</strong>.
              </p>
            </div>

            {/* User Selector Carousel/Grid */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
                Seleccionar Usuario
              </label>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
                {users.map(u => {
                  const isSelected = u.id === (activeUser ? activeUser.id : '');
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => {
                        setSelectedUserId(u.id);
                        setPassword('');
                        setErrorMsg('');
                      }}
                      className={`p-2 rounded-xl border flex items-center gap-2 text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'border-orange-500 bg-orange-50/90 text-orange-950 ring-2 ring-orange-500/20 font-bold shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-slate-50/60 text-slate-700'
                      }`}
                    >
                      <img
                        src={
                          (u.avatar && u.avatar.trim() !== '')
                            ? u.avatar
                            : `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=ea580c&color=fff&size=80&bold=true`
                        }
                        alt={u.name}
                        className="w-8 h-8 rounded-full object-cover shrink-0 border border-slate-200"
                        onError={e => {
                          (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                            u.name
                          )}&background=ea580c&color=fff&size=80&bold=true`;
                        }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs truncate font-bold">{u.name.split(' ')[0]}</div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-tight truncate">
                          {u.role}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Password Input Form */}
            <form onSubmit={handleLogin} className="space-y-4 pt-1">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700">
                    Contraseña de Acceso
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer font-medium"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{showPassword ? 'Ocultar' : 'Ver'}</span>
                  </button>
                </div>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => {
                      setErrorMsg('');
                      setPassword(e.target.value);
                    }}
                    placeholder="Ingresa tu contraseña..."
                    autoFocus
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-orange-500 outline-none font-medium text-slate-900 transition-colors"
                  />
                </div>
              </div>

              {/* Error Message */}
              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Volver al Catálogo
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting || !password}
                  className="flex-1 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>{isSubmitting ? 'Verificando...' : 'Ingresar'}</span>
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* Mandatory First-Time Password Change Step */
          <div className="p-5 space-y-4">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
              <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold mb-0.5">Cambio de Contraseña Requerido</strong>
                <p className="leading-relaxed">
                  Por seguridad de la empresa, todo usuario debe reemplazar la contraseña provisional por defecto por una clave personal antes de ingresar al panel administrativo.
                </p>
              </div>
            </div>

            {/* User card summary */}
            {activeUser && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3">
                <img
                  src={
                    (activeUser.avatar && activeUser.avatar.trim() !== '')
                      ? activeUser.avatar
                      : `https://ui-avatars.com/api/?name=${encodeURIComponent(activeUser.name)}&background=ea580c&color=fff&size=100&bold=true`
                  }
                  alt={activeUser.name}
                  className="w-10 h-10 rounded-full object-cover border border-slate-300"
                />
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-xs text-slate-900 truncate">{activeUser.name}</div>
                  <div className="text-[11px] text-slate-500 truncate">{activeUser.email}</div>
                  <div className="text-[10px] font-bold text-orange-600 uppercase mt-0.5">
                    Rol: {activeUser.role}
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleForcePasswordChange} className="space-y-3.5">
              {/* New Password */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700">
                    Nueva Contraseña
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer font-medium"
                  >
                    {showNewPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    <span>{showNewPassword ? 'Ocultar' : 'Ver'}</span>
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={e => {
                      setErrorMsg('');
                      setNewPassword(e.target.value);
                    }}
                    placeholder="Mínimo 6 caracteres (letras y números)"
                    autoFocus
                    className="w-full pl-10 pr-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-orange-500 outline-none font-medium text-slate-900"
                  />
                </div>
              </div>

              {/* Confirm New Password */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700">
                  Confirmar Nueva Contraseña
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={confirmNewPassword}
                    onChange={e => {
                      setErrorMsg('');
                      setConfirmNewPassword(e.target.value);
                    }}
                    placeholder="Repita la nueva contraseña"
                    className="w-full pl-10 pr-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-orange-500 outline-none font-medium text-slate-900"
                  />
                </div>
              </div>

              {/* Security requirements checklist */}
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-[11px] text-slate-600">
                <div className={`flex items-center gap-1.5 ${newPassword.length >= 6 ? 'text-emerald-700 font-bold' : ''}`}>
                  <CheckCircle2 className={`w-3.5 h-3.5 ${newPassword.length >= 6 ? 'text-emerald-600' : 'text-slate-300'}`} />
                  <span>Al menos 6 caracteres</span>
                </div>
                <div className={`flex items-center gap-1.5 ${(/[a-zA-Z]/.test(newPassword) && /[0-9]/.test(newPassword)) ? 'text-emerald-700 font-bold' : ''}`}>
                  <CheckCircle2 className={`w-3.5 h-3.5 ${(/[a-zA-Z]/.test(newPassword) && /[0-9]/.test(newPassword)) ? 'text-emerald-600' : 'text-slate-300'}`} />
                  <span>Combina letras y números</span>
                </div>
                <div className={`flex items-center gap-1.5 ${newPassword && newPassword !== DEFAULT_INITIAL_PASSWORD ? 'text-emerald-700 font-bold' : ''}`}>
                  <CheckCircle2 className={`w-3.5 h-3.5 ${newPassword && newPassword !== DEFAULT_INITIAL_PASSWORD ? 'text-emerald-600' : 'text-slate-300'}`} />
                  <span>Diferente a la clave provisional por defecto</span>
                </div>
                <div className={`flex items-center gap-1.5 ${newPassword && newPassword === confirmNewPassword ? 'text-emerald-700 font-bold' : ''}`}>
                  <CheckCircle2 className={`w-3.5 h-3.5 ${newPassword && newPassword === confirmNewPassword ? 'text-emerald-600' : 'text-slate-300'}`} />
                  <span>Las contraseñas coinciden</span>
                </div>
              </div>

              {/* Error Message */}
              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Submit button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting || !newPassword || !confirmNewPassword}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{isSubmitting ? 'Guardando...' : 'Establecer Contraseña y Acceder'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
