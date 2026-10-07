import React, { useState, useRef, useEffect } from 'react';
import {
  ShoppingCart,
  Bell,
  Download,
  Plus,
  Settings,
  Users,
  Activity,
  Layers,
  Cloud,
  CloudOff,
  RefreshCw,
  Store,
  ShieldCheck,
  LogOut,
  RotateCcw,
  MessageCircle,
  Globe,
  Menu,
  X,
  ChevronDown,
  SlidersHorizontal,
  ExternalLink,
  Sparkles,
  Database,
  Building2,
} from 'lucide-react';
import { TitufarisLogo } from './TitufarisLogo';
import { User, SyncStatus } from '../types';

interface NavbarProps {
  activeTab: 'catalog' | 'pos' | 'reports';
  setActiveTab: (tab: 'catalog' | 'pos' | 'reports') => void;
  currentUser: User;
  syncStatus: SyncStatus;
  isOnline: boolean;
  cartCount: number;
  unreadNotifsCount: number;
  onOpenNotifications: () => void;
  onOpenExport: () => void;
  onOpenWhatsAppCatalog?: () => void;
  onOpenGoogleMerchant?: () => void;
  onOpenNewProduct: () => void;
  onOpenUsersModal: () => void;
  onOpenCompanySettings: () => void;
  onManualSync: () => void;
  onSwitchToStoreMode?: () => void;
  onOpenBackupModal?: () => void;
  onOpenRecoveryModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  syncStatus,
  isOnline,
  cartCount,
  unreadNotifsCount,
  onOpenNotifications,
  onOpenExport,
  onOpenWhatsAppCatalog,
  onOpenGoogleMerchant,
  onOpenNewProduct,
  onOpenUsersModal,
  onOpenCompanySettings,
  onManualSync,
  onSwitchToStoreMode,
  onOpenBackupModal,
  onOpenRecoveryModal,
}) => {
  const [isAdminDropdownOpen, setIsAdminDropdownOpen] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const canManageInventory = currentUser.permissions.canManageInventory || currentUser.role === 'admin';
  const canExport = currentUser.permissions.canExportData || currentUser.role === 'admin';
  const canManageUsers = currentUser.permissions.canManageUsers || currentUser.role === 'admin';
  const canEditCompany = currentUser.permissions.canEditCompany || currentUser.role === 'admin';

  // Close dropdown on outside click or Escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsAdminDropdownOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsAdminDropdownOpen(false);
        setIsMobileDrawerOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const avatarSrc = (currentUser.avatar && currentUser.avatar.trim() !== '')
    ? currentUser.avatar
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name)}&background=f97316&color=fff&size=100&bold=true`;

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs divide-y divide-slate-100">
        {/* RENGLÓN 1: Identidad Corporativa + Estado Global + Tienda Web + Usuario */}
        <div className="max-w-7xl mx-auto px-3 sm:px-5 lg:px-6 h-14 flex items-center justify-between gap-3">
          {/* LEFT: Official Logo + Mobile Drawer Toggle */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => setIsMobileDrawerOpen(true)}
              className="md:hidden p-1.5 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Abrir menú de navegación"
              aria-label="Abrir menú"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center">
              <TitufarisLogo size="sm" showTagline={false} className="sm:hidden" />
              <TitufarisLogo size="md" showTagline={true} className="hidden sm:flex" />
            </div>
          </div>

          {/* RIGHT: Cloud Status + Tienda Web + Notificaciones + Perfil */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* Cloud Sync Status Indicator */}
            <button
              onClick={onManualSync}
              title={
                !isOnline
                  ? 'Sin conexión a internet (modo offline local)'
                  : syncStatus === 'syncing'
                  ? 'Sincronizando con base de datos en la nube...'
                  : 'Conectado y sincronizado con Google Cloud Firestore'
              }
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border cursor-pointer transition-all ${
                !isOnline
                  ? 'bg-amber-50 text-amber-800 border-amber-300'
                  : syncStatus === 'syncing'
                  ? 'bg-blue-50 text-blue-800 border-blue-200'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              {!isOnline ? (
                <CloudOff className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              ) : syncStatus === 'syncing' ? (
                <RefreshCw className="w-3.5 h-3.5 text-blue-600 animate-spin shrink-0" />
              ) : (
                <Cloud className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              )}
              <span className="hidden sm:inline">
                {!isOnline ? 'Offline' : syncStatus === 'syncing' ? 'Sincronizando...' : 'Nube Conectada'}
              </span>
            </button>

            {/* Ver Tienda Web button */}
            {onSwitchToStoreMode && (
              <button
                onClick={onSwitchToStoreMode}
                title="Ver Tienda Web Pública (Catálogo, Carrito y WhatsApp para clientes)"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-extrabold text-xs transition-all shadow-2xs cursor-pointer hover:scale-102"
              >
                <Store className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Ver Tienda Web</span>
              </button>
            )}

            {/* Notifications Bell */}
            <button
              onClick={onOpenNotifications}
              title="Notificaciones push de inventario"
              className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
              {unreadNotifsCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-orange-600 rounded-full ring-2 ring-white" />
              )}
            </button>

            {/* Comprehensive Admin Menu Dropdown (Solves overflow by organizing tools cleanly) */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsAdminDropdownOpen(prev => !prev)}
                title="Menú de Administración, Ajustes y Herramientas"
                className={`flex items-center gap-1.5 p-1 sm:px-2.5 sm:py-1 rounded-xl border transition-all cursor-pointer ${
                  isAdminDropdownOpen
                    ? 'border-orange-500 bg-orange-50 text-orange-900 ring-2 ring-orange-400/30'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <img
                  src={avatarSrc}
                  alt={currentUser.name}
                  className="w-7 h-7 rounded-full object-cover border border-slate-200 shrink-0"
                  onError={e => {
                    (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      currentUser.name
                    )}&background=f97316&color=fff&size=100&bold=true`;
                  }}
                />
                <div className="hidden sm:block text-left leading-tight">
                  <div className="text-xs font-bold text-slate-800 truncate max-w-[85px] lg:max-w-[110px]">
                    {currentUser.name.split(' ')[0]}
                  </div>
                  <div className="text-[9px] font-extrabold text-orange-600 uppercase tracking-wider">
                    {currentUser.role}
                  </div>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${isAdminDropdownOpen ? 'rotate-180 text-orange-600' : ''}`} />
              </button>

              {/* Floating Menu Dropdown Panel */}
              {isAdminDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 p-2 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                  {/* User Profile Header */}
                  <div className="px-3 py-2.5 bg-slate-50 rounded-xl border border-slate-100 mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <img
                        src={avatarSrc}
                        alt={currentUser.name}
                        className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0"
                      />
                      <div className="truncate">
                        <p className="text-xs font-black text-slate-900 truncate">{currentUser.name}</p>
                        <p className="text-[10px] text-slate-500 truncate">{currentUser.email}</p>
                        <span className="inline-block px-1.5 py-0.2 rounded bg-orange-100 text-orange-700 text-[9px] font-black uppercase mt-0.5">
                          {currentUser.role}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 text-xs max-h-[75vh] overflow-y-auto pr-1">
                    {/* SECTION 1: Canales de Venta & Tienda */}
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-2 py-1">
                        Canales de Venta & Marketing
                      </p>
                      <div className="space-y-0.5">
                        {onOpenWhatsAppCatalog && (
                          <button
                            onClick={() => {
                              setIsAdminDropdownOpen(false);
                              onOpenWhatsAppCatalog();
                            }}
                            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-emerald-800 hover:bg-emerald-50 transition-colors cursor-pointer text-left font-bold"
                          >
                            <MessageCircle className="w-4 h-4 fill-emerald-600 text-emerald-600 shrink-0" />
                            <div className="flex-1">
                              <div>Catálogo WhatsApp Business</div>
                              <div className="text-[10px] font-normal text-emerald-600">Sincronización Meta Commerce & WhatsApp</div>
                            </div>
                          </button>
                        )}

                        {onOpenGoogleMerchant && (
                          <button
                            onClick={() => {
                              setIsAdminDropdownOpen(false);
                              onOpenGoogleMerchant();
                            }}
                            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-blue-800 hover:bg-blue-50 transition-colors cursor-pointer text-left font-bold"
                          >
                            <Globe className="w-4 h-4 text-blue-600 shrink-0" />
                            <div className="flex-1">
                              <div>Google Shopping / Merchant</div>
                              <div className="text-[10px] font-normal text-blue-600">Fichas de producto gratuitas en Google</div>
                            </div>
                          </button>
                        )}

                        {onSwitchToStoreMode && (
                          <button
                            onClick={() => {
                              setIsAdminDropdownOpen(false);
                              onSwitchToStoreMode();
                            }}
                            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer text-left font-semibold"
                          >
                            <Store className="w-4 h-4 text-emerald-600 shrink-0" />
                            <div className="flex-1">
                              <div>Ver Tienda Web Pública</div>
                              <div className="text-[10px] font-normal text-slate-500">Vista de clientes con carrito y WhatsApp</div>
                            </div>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* SECTION 2: Herramientas de Catálogo */}
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-2 py-1">
                        Herramientas & Respaldo
                      </p>
                      <div className="space-y-0.5">
                        {canExport && (
                          <button
                            onClick={() => {
                              setIsAdminDropdownOpen(false);
                              onOpenExport();
                            }}
                            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer text-left font-semibold"
                          >
                            <Download className="w-4 h-4 text-orange-600 shrink-0" />
                            <div className="flex-1">
                              <div>Exportar Catálogo (PDF/Excel)</div>
                              <div className="text-[10px] font-normal text-slate-500">PDF con imágenes, TSV para Google y CSV</div>
                            </div>
                          </button>
                        )}

                        {canManageInventory && (
                          <button
                            onClick={() => {
                              setIsAdminDropdownOpen(false);
                              onOpenBackupModal?.();
                            }}
                            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer text-left font-semibold"
                          >
                            <Database className="w-4 h-4 text-purple-600 shrink-0" />
                            <div className="flex-1">
                              <div>Copia de Seguridad Cloud</div>
                              <div className="text-[10px] font-normal text-slate-500">Crear snapshot JSON completo y restaurar</div>
                            </div>
                          </button>
                        )}

                        {canManageInventory && onOpenRecoveryModal && (
                          <button
                            onClick={() => {
                              setIsAdminDropdownOpen(false);
                              onOpenRecoveryModal();
                            }}
                            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-amber-900 hover:bg-amber-50 transition-colors cursor-pointer text-left font-semibold"
                          >
                            <RotateCcw className="w-4 h-4 text-amber-600 shrink-0" />
                            <div className="flex-1">
                              <div>Recuperador & Carga Masiva</div>
                              <div className="text-[10px] font-normal text-amber-700">Restaurar de memoria local o pegar Excel</div>
                            </div>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* SECTION 3: Ajustes y Empresa */}
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-2 py-1">
                        Configuración
                      </p>
                      <div className="space-y-0.5">
                        {canManageUsers && (
                          <button
                            onClick={() => {
                              setIsAdminDropdownOpen(false);
                              onOpenUsersModal();
                            }}
                            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer text-left font-semibold"
                          >
                            <Users className="w-4 h-4 text-blue-600 shrink-0" />
                            <div className="flex-1">
                              <div>Equipo & Permisos</div>
                              <div className="text-[10px] font-normal text-slate-500">Gestionar vendedores y roles</div>
                            </div>
                          </button>
                        )}

                        {canEditCompany && (
                          <button
                            onClick={() => {
                              setIsAdminDropdownOpen(false);
                              onOpenCompanySettings();
                            }}
                            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer text-left font-semibold"
                          >
                            <Building2 className="w-4 h-4 text-slate-600 shrink-0" />
                            <div className="flex-1">
                              <div>Perfil de Empresa & Branding</div>
                              <div className="text-[10px] font-normal text-slate-500">Datos fiscales, WhatsApp, logo y redes</div>
                            </div>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RENGLÓN 2: Barra de Pestañas de Navegación + Acciones Rápidas (WhatsApp, Google Shopping, Exportar, Nuevo Producto) */}
        <div className="max-w-7xl mx-auto px-3 sm:px-5 lg:px-6 py-2 flex flex-wrap items-center justify-between gap-2.5">
          {/* LEFT: Core View Tabs (Catálogo, POS Tablet, Auditoría & CRM) */}
          <nav className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200/80 text-xs font-bold shrink-0">
            <button
              onClick={() => setActiveTab('catalog')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'catalog'
                  ? 'bg-white text-orange-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Catálogo</span>
            </button>

            <button
              onClick={() => setActiveTab('pos')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer relative ${
                activeTab === 'pos'
                  ? 'bg-white text-orange-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>POS Tablet</span>
              {cartCount > 0 && (
                <span className="bg-orange-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-black ml-0.5">
                  {cartCount}
                </span>
              )}
            </button>

            <button
              id="nav-tab-reports"
              onClick={() => setActiveTab('reports')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'reports'
                  ? 'bg-white text-orange-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Auditoría & CRM</span>
            </button>
          </nav>

          {/* RIGHT: Botones de Acción Directa sin desbordes */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            {/* WhatsApp Catalog button */}
            {onOpenWhatsAppCatalog && (
              <button
                onClick={onOpenWhatsAppCatalog}
                title="Integración Catálogo de WhatsApp Business & Meta Commerce"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition-all shadow-2xs cursor-pointer hover:scale-102"
              >
                <MessageCircle className="w-3.5 h-3.5 fill-emerald-600 text-emerald-600 shrink-0" />
                <span>Catálogo WhatsApp</span>
              </button>
            )}

            {/* Google Shopping button */}
            {onOpenGoogleMerchant && (
              <button
                onClick={onOpenGoogleMerchant}
                title="Integración con Google Shopping & Google Merchant Center"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-blue-300 bg-blue-50 hover:bg-blue-100 text-blue-800 text-xs font-bold transition-all shadow-2xs cursor-pointer hover:scale-102"
              >
                <Globe className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>Google Shopping</span>
              </button>
            )}

            {/* Export button */}
            {canExport && onOpenExport && (
              <button
                onClick={onOpenExport}
                title="Exportar catálogo en PDF de alta calidad, Excel y CSV"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-2xs cursor-pointer hover:scale-102"
              >
                <Download className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                <span>Exportar PDF</span>
              </button>
            )}

            {/* Primary CTA: + Nuevo Producto */}
            {canManageInventory && (
              <button
                id="btn-navbar-new-product"
                onClick={onOpenNewProduct}
                title="Cargar Nuevo Producto al Catálogo"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-black transition-all shadow-xs shadow-orange-500/25 active:scale-95 cursor-pointer hover:scale-102"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>+ Nuevo Producto</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* MOBILE SLIDE-OVER DRAWER (For tablets and smartphones) */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileDrawerOpen(false)}
          />

          {/* Drawer container */}
          <div className="relative w-4/5 max-w-xs bg-white h-full shadow-2xl flex flex-col z-10 p-4 overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <TitufarisLogo size="sm" showTagline={true} />
              <button
                onClick={() => setIsMobileDrawerOpen(false)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="space-y-1 mb-5">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-2 mb-1">
                Vistas Principales
              </p>
              <button
                onClick={() => {
                  setActiveTab('catalog');
                  setIsMobileDrawerOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-xs transition-colors cursor-pointer ${
                  activeTab === 'catalog'
                    ? 'bg-orange-50 text-orange-700 border border-orange-200'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Layers className="w-4 h-4 text-orange-600" />
                <span>Inventario & Catálogo</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('pos');
                  setIsMobileDrawerOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-bold text-xs transition-colors cursor-pointer ${
                  activeTab === 'pos'
                    ? 'bg-orange-50 text-orange-700 border border-orange-200'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <ShoppingCart className="w-4 h-4 text-orange-600" />
                  <span>POS Tablet (Caja & Ventas)</span>
                </div>
                {cartCount > 0 && (
                  <span className="bg-orange-600 text-white text-[10px] px-2 py-0.5 rounded-full font-black">
                    {cartCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => {
                  setActiveTab('reports');
                  setIsMobileDrawerOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-xs transition-colors cursor-pointer ${
                  activeTab === 'reports'
                    ? 'bg-orange-50 text-orange-700 border border-orange-200'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Activity className="w-4 h-4 text-orange-600" />
                <span>Auditoría & CRM de Clientes</span>
              </button>
            </div>

            {/* Admin Tools in Mobile Drawer */}
            <div className="space-y-1 mb-5">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-2 mb-1">
                Herramientas de Administración
              </p>

              {onOpenWhatsAppCatalog && (
                <button
                  onClick={() => {
                    setIsMobileDrawerOpen(false);
                    onOpenWhatsAppCatalog();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-emerald-800 hover:bg-emerald-50 text-xs font-bold"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-600 fill-emerald-600" />
                  <span>Catálogo WhatsApp Business</span>
                </button>
              )}

              {onOpenGoogleMerchant && (
                <button
                  onClick={() => {
                    setIsMobileDrawerOpen(false);
                    onOpenGoogleMerchant();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-blue-800 hover:bg-blue-50 text-xs font-bold"
                >
                  <Globe className="w-4 h-4 text-blue-600" />
                  <span>Google Shopping</span>
                </button>
              )}

              {canExport && (
                <button
                  onClick={() => {
                    setIsMobileDrawerOpen(false);
                    onOpenExport();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 text-xs font-semibold"
                >
                  <Download className="w-4 h-4 text-orange-600" />
                  <span>Exportar Listas PDF / Excel</span>
                </button>
              )}

              {onOpenRecoveryModal && (
                <button
                  onClick={() => {
                    setIsMobileDrawerOpen(false);
                    onOpenRecoveryModal();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-slate-700 hover:bg-amber-50 text-xs font-semibold"
                >
                  <RotateCcw className="w-4 h-4 text-amber-600" />
                  <span>Recuperador & Carga Masiva</span>
                </button>
              )}

              {onOpenBackupModal && (
                <button
                  onClick={() => {
                    setIsMobileDrawerOpen(false);
                    onOpenBackupModal();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-slate-700 hover:bg-blue-50 text-xs font-semibold"
                >
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <span>Copia de Seguridad</span>
                </button>
              )}

              {canEditCompany && (
                <button
                  onClick={() => {
                    setIsMobileDrawerOpen(false);
                    onOpenCompanySettings();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 text-xs font-semibold"
                >
                  <Settings className="w-4 h-4 text-slate-600" />
                  <span>Configuración de Empresa</span>
                </button>
              )}

              {canManageUsers && (
                <button
                  onClick={() => {
                    setIsMobileDrawerOpen(false);
                    onOpenUsersModal();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 text-xs font-semibold"
                >
                  <Users className="w-4 h-4 text-slate-600" />
                  <span>Gestión de Usuarios</span>
                </button>
              )}
            </div>

            {/* Drawer Footer */}
            <div className="mt-auto pt-3 border-t border-slate-100 space-y-2">
              {onSwitchToStoreMode && (
                <button
                  onClick={() => {
                    setIsMobileDrawerOpen(false);
                    onSwitchToStoreMode();
                  }}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-xs"
                >
                  <Store className="w-4 h-4" />
                  <span>Ver Tienda Web Pública</span>
                </button>
              )}
              {onSwitchToStoreMode && (
                <button
                  onClick={() => {
                    setIsMobileDrawerOpen(false);
                    onSwitchToStoreMode();
                  }}
                  className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-xl text-red-600 hover:bg-red-50 font-bold text-xs"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Cerrar Sesión</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
