import React, { useState, useRef } from 'react';
import { X, Users, Shield, UserCheck, Plus, Check, Trash2, Edit2, Key, Upload, Camera, Image, Sparkles, RefreshCw } from 'lucide-react';
import { User, UserRole, UserPermissions } from '../types';
import { DEFAULT_INITIAL_PASSWORD } from '../data/initialData';

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80',
];

interface AdminUsersModalProps {
  users: User[];
  currentUser: User;
  isOpen: boolean;
  onClose: () => void;
  onSaveUser: (user: User) => void;
  onSwitchUser: (userId: string) => void;
}

export const AdminUsersModal: React.FC<AdminUsersModalProps> = ({
  users,
  currentUser,
  isOpen,
  onClose,
  onSaveUser,
  onSwitchUser,
}) => {
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [mustResetPassword, setMustResetPassword] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('vendedor');
  const [avatar, setAvatar] = useState('');
  const [isDraggingPhoto, setIsDraggingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [permissions, setPermissions] = useState<UserPermissions>({
    canEditPrices: false,
    canManageInventory: false,
    canProcessSales: true,
    canViewReports: false,
    canManageUsers: false,
    canExportData: true,
    canEditCompany: false,
  });

  if (!isOpen) return null;

  const handleStartEdit = (user: User) => {
    setEditingUser(user);
    setIsCreating(false);
    setMustResetPassword(false);
    setName(user.name);
    setEmail(user.email);
    setRole(user.role);
    setAvatar(user.avatar || '');
    setPermissions(user.permissions);
  };

  const handleStartCreate = () => {
    setEditingUser(null);
    setIsCreating(true);
    setMustResetPassword(false);
    setName('');
    setEmail('');
    setRole('vendedor');
    setAvatar('');
    setPermissions({
      canEditPrices: false,
      canManageInventory: false,
      canProcessSales: true,
      canViewReports: false,
      canManageUsers: false,
      canExportData: true,
      canEditCompany: false,
    });
  };

  const handleProcessImageFile = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAvatar(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingPhoto(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingPhoto(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingPhoto(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleProcessImageFile(file);
    }
  };

  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole);
    if (newRole === 'admin') {
      setPermissions({
        canEditPrices: true,
        canManageInventory: true,
        canProcessSales: true,
        canViewReports: true,
        canManageUsers: true,
        canExportData: true,
        canEditCompany: true,
      });
    } else if (newRole === 'supervisor') {
      setPermissions({
        canEditPrices: true,
        canManageInventory: true,
        canProcessSales: true,
        canViewReports: true,
        canManageUsers: false,
        canExportData: true,
        canEditCompany: false,
      });
    } else if (newRole === 'cajero') {
      setPermissions({
        canEditPrices: false,
        canManageInventory: false,
        canProcessSales: true,
        canViewReports: false,
        canManageUsers: false,
        canExportData: false,
        canEditCompany: false,
      });
    } else {
      setPermissions({
        canEditPrices: false,
        canManageInventory: false,
        canProcessSales: true,
        canViewReports: false,
        canManageUsers: false,
        canExportData: true,
        canEditCompany: false,
      });
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(
      name.trim()
    )}&background=f97316&color=fff&size=200&bold=true`;

    const userToSave: User = {
      id: editingUser ? editingUser.id : 'usr-' + Date.now(),
      name: name.trim(),
      email: email.trim() || `${name.toLowerCase().replace(/\s+/g, '.')}@titufaris.com.ar`,
      password: isCreating
        ? DEFAULT_INITIAL_PASSWORD
        : (mustResetPassword ? DEFAULT_INITIAL_PASSWORD : (editingUser?.password || DEFAULT_INITIAL_PASSWORD)),
      mustChangePassword: isCreating ? true : (mustResetPassword ? true : (editingUser?.mustChangePassword ?? false)),
      role,
      avatar: avatar.trim() || defaultAvatar,
      status: 'active',
      permissions,
      lastActive: editingUser ? editingUser.lastActive : 'Activo ahora',
    };

    onSaveUser(userToSave);
    setEditingUser(null);
    setIsCreating(false);
  };

  const togglePerm = (key: keyof UserPermissions) => {
    setPermissions({
      ...permissions,
      [key]: !permissions[key],
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-orange-500/20 text-orange-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base">Gestión de Usuarios & Permisos</h2>
              <p className="text-xs text-slate-400">Control de acceso multiusuario y roles del personal</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {editingUser || isCreating ? (
            /* EDIT / CREATE USER FORM */
            <form onSubmit={handleSave} className="space-y-5">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h3 className="text-sm font-bold text-slate-900">
                  {editingUser ? `Editar Permisos: ${editingUser.name}` : 'Crear Nuevo Usuario / Empleado'}
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setEditingUser(null);
                    setIsCreating(false);
                  }}
                  className="text-xs text-slate-500 hover:text-slate-800 font-semibold cursor-pointer"
                >
                  Volver a la lista
                </button>
              </div>

              {/* Profile Photo Upload Section */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Foto de Perfil del Usuario
                  </label>
                  {avatar && (
                    <button
                      type="button"
                      onClick={() => setAvatar('')}
                      className="text-[11px] text-red-600 hover:text-red-700 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Quitar foto</span>
                    </button>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {/* Avatar circular preview */}
                  <div className="relative group shrink-0">
                    <div className="w-20 h-20 rounded-full bg-white border-2 border-slate-300 shadow-xs overflow-hidden flex items-center justify-center">
                      {(avatar && avatar.trim() !== '') ? (
                        <img
                          src={avatar}
                          alt={name || 'Avatar'}
                          className="w-full h-full object-cover"
                          onError={() => setAvatar('')}
                        />
                      ) : (
                        <div className="w-full h-full bg-orange-100 flex items-center justify-center text-orange-600 font-black text-2xl">
                          {name.trim() ? name.trim().charAt(0).toUpperCase() : <Camera className="w-8 h-8 text-orange-400" />}
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-0 right-0 p-1.5 rounded-full bg-orange-600 hover:bg-orange-700 text-white shadow-md border-2 border-white transition-transform hover:scale-110 cursor-pointer"
                      title="Subir foto desde dispositivo"
                    >
                      <Camera className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Drag & Drop zone & input buttons */}
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`flex-1 w-full border-2 border-dashed rounded-xl p-3.5 transition-all text-center sm:text-left flex flex-col justify-center gap-1.5 ${
                      isDraggingPhoto
                        ? 'border-orange-500 bg-orange-50/60 ring-2 ring-orange-500/20'
                        : 'border-slate-300 bg-white hover:border-slate-400'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="text-xs text-slate-700 font-semibold">
                        {isDraggingPhoto ? (
                          <span className="text-orange-600 font-bold">¡Suelta la imagen aquí!</span>
                        ) : (
                          <span>Arrastra una foto aquí o selecciona desde tu equipo</span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg border border-slate-300 cursor-pointer transition-colors shadow-2xs"
                      >
                        <Upload className="w-3.5 h-3.5 text-orange-600" />
                        <span>Examinar archivo</span>
                      </button>

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (file) handleProcessImageFile(file);
                        }}
                        className="hidden"
                      />
                    </div>

                    <p className="text-[10px] text-slate-400">
                      Soporta JPG, PNG, WEBP o GIF (tamaño recomendado: cuadrado o retrato)
                    </p>
                  </div>
                </div>

                {/* Quick Presets */}
                <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between gap-2">
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                    O elige un avatar rápido:
                  </span>
                  <div className="flex items-center gap-1.5 overflow-x-auto">
                    {AVATAR_PRESETS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setAvatar(preset)}
                        className={`w-7 h-7 rounded-full overflow-hidden border-2 transition-all cursor-pointer ${
                          avatar === preset
                            ? 'border-orange-500 ring-2 ring-orange-500/30 scale-110'
                            : 'border-slate-200 hover:border-slate-400 opacity-80 hover:opacity-100'
                        }`}
                      >
                        <img src={preset} alt="Preset" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1 sm:col-span-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Nombre Completo
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="ej. Mariana Gómez"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-orange-500 outline-none font-medium"
                  />
                </div>

                <div className="space-y-1 sm:col-span-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Email / Usuario
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="mariana@titufaris.com.ar"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-orange-500 outline-none font-medium"
                  />
                </div>

                {/* Account Security & Password Status */}
                <div className="space-y-1 sm:col-span-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Seguridad de Contraseña
                  </label>
                  {isCreating ? (
                    <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600 leading-tight">
                      <div className="flex items-center gap-1.5 font-bold text-slate-800 mb-1">
                        <Shield className="w-3.5 h-3.5 text-orange-600" />
                        <span>Clave Provisional Asignada</span>
                      </div>
                      <p>Se solicitará cambio obligatorio en el primer inicio de sesión.</p>
                    </div>
                  ) : (
                    <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                      <div className="text-[11px] text-slate-600 flex items-center justify-between">
                        <span>Estado:</span>
                        {editingUser?.mustChangePassword ? (
                          <span className="font-bold text-amber-700">Cambio pendiente</span>
                        ) : (
                          <span className="font-bold text-emerald-700">Protegida</span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setMustResetPassword(!mustResetPassword)}
                        className={`w-full py-1.5 px-2 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                          mustResetPassword
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 shadow-2xs'
                        }`}
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>{mustResetPassword ? '✓ Se restablecerá al guardar' : 'Restablecer clave provisional'}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Role Select */}
              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Rol Operativo
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'admin', label: 'Admin Total', desc: 'Acceso total' },
                    { id: 'supervisor', label: 'Supervisor', desc: 'Precios y stock' },
                    { id: 'vendedor', label: 'Vendedor', desc: 'Ventas y catálogo' },
                    { id: 'cajero', label: 'Cajero POS', desc: 'Solo terminal cobro' },
                  ].map(r => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => handleRoleChange(r.id as UserRole)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        role === r.id
                          ? 'border-orange-500 bg-orange-500/10 text-orange-800 ring-2 ring-orange-500/20'
                          : 'border-slate-200 hover:border-slate-300 bg-white text-slate-600'
                      }`}
                    >
                      <div className="font-bold text-xs">{r.label}</div>
                      <div className="text-[10px] text-slate-500">{r.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Granular Permissions Matrix */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-orange-600" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Matriz de Permisos Granulares
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  {[
                    { key: 'canEditPrices', label: 'Modificar Precios (Mayorista / Minorista)' },
                    { key: 'canManageInventory', label: 'Controlar y Modificar Stock' },
                    { key: 'canProcessSales', label: 'Procesar Ventas y Cobros en POS' },
                    { key: 'canViewReports', label: 'Ver Reportes de Auditoría y Ganancias' },
                    { key: 'canManageUsers', label: 'Gestionar Usuarios y Roles' },
                    { key: 'canExportData', label: 'Exportar Catálogo en PDF / Excel' },
                    { key: 'canEditCompany', label: 'Editar Datos de Empresa Titufaris' },
                  ].map(p => {
                    const k = p.key as keyof UserPermissions;
                    const isChecked = permissions[k];
                    return (
                      <label
                        key={k}
                        className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 hover:border-slate-300 cursor-pointer select-none"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => togglePerm(k)}
                          className="w-4 h-4 text-orange-600 rounded-sm border-slate-300 focus:ring-orange-500"
                        />
                        <span className="text-slate-700 font-medium">{p.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingUser(null);
                    setIsCreating(false);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
                >
                  {editingUser ? 'Guardar Cambios de Usuario' : 'Crear Usuario con Foto y Permisos'}
                </button>
              </div>
            </form>
          ) : (
            /* USERS LIST */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Usuarios Activos ({users.length})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Haga clic en un usuario para iniciar sesión como él o editar su foto y permisos
                  </p>
                </div>
                <button
                  onClick={handleStartCreate}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl shadow-2xs transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Nuevo Empleado</span>
                </button>
              </div>

              <div className="space-y-2.5">
                {users.map(u => {
                  const isCurrent = currentUser.id === u.id;
                  return (
                    <div
                      key={u.id}
                      className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                        isCurrent
                          ? 'border-orange-500 bg-orange-50/40 shadow-xs'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={
                            (u.avatar && u.avatar.trim() !== '')
                              ? u.avatar
                              : `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=f97316&color=fff&size=200&bold=true`
                          }
                          alt={u.name}
                          className="w-10 h-10 rounded-full object-cover border border-slate-200"
                          onError={e => {
                            (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                              u.name
                            )}&background=f97316&color=fff&size=200&bold=true`;
                          }}
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-xs text-slate-900 truncate">
                              {u.name}
                            </h4>
                            {isCurrent && (
                              <span className="text-[10px] font-extrabold bg-orange-600 text-white px-2 py-0.2 rounded-full">
                                Sesión Actual
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 truncate">{u.email}</p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="text-[10px] uppercase font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded-sm">
                              Rol: {u.role}
                            </span>
                            {u.mustChangePassword ? (
                              <span className="text-[10px] font-bold text-amber-800 bg-amber-100/80 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <Key className="w-3 h-3 text-amber-600" /> Cambio pendiente
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/80 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <Shield className="w-3 h-3 text-emerald-600" /> Contraseña protegida
                              </span>
                            )}
                            <span className="text-[10px] text-slate-400">
                              {u.lastActive}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {!isCurrent && (
                          <button
                            onClick={() => onSwitchUser(u.id)}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                          >
                            Cambiar a este usuario
                          </button>
                        )}

                        <button
                          onClick={() => handleStartEdit(u)}
                          title="Editar permisos y rol"
                          className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 px-6 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
