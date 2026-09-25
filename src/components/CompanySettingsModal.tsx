import React, { useState, useEffect } from 'react';
import { X, Building2, Save, Check, ShieldCheck, Download, Phone, Globe, Copy, ExternalLink, MessageCircle } from 'lucide-react';
import { CompanyProfile } from '../types';
import { normalizeMercadoPagoUrl, getPublicStoreBaseUrl } from '../utils/qrCode';

interface CompanySettingsModalProps {
  company: CompanyProfile;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: CompanyProfile) => void;
  onOpenBackupModal?: () => void;
}

export const CompanySettingsModal: React.FC<CompanySettingsModalProps> = ({
  company,
  isOpen,
  onClose,
  onSave,
  onOpenBackupModal,
}) => {
  const [formData, setFormData] = useState<CompanyProfile>(company);
  const [copiedPublicUrl, setCopiedPublicUrl] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData(company);
    }
  }, [isOpen, company]);

  if (!isOpen) return null;

  const publicStoreUrl = getPublicStoreBaseUrl();

  const handleCopyPublicUrl = () => {
    navigator.clipboard.writeText(publicStoreUrl);
    setCopiedPublicUrl(true);
    setTimeout(() => setCopiedPublicUrl(false), 2500);
  };

  const handleChange = (field: keyof CompanyProfile, value: string) => {
    setFormData({
      ...formData,
      [field]: value,
    });
  };

  const handleBankChange = (field: keyof CompanyProfile['bankAccount'], value: string) => {
    setFormData({
      ...formData,
      bankAccount: {
        ...formData.bankAccount,
        [field]: value,
      },
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const sanitizedFormData = {
      ...formData,
      bankAccount: {
        ...formData.bankAccount,
        mercadoPagoLink: formData.bankAccount.mercadoPagoLink?.trim()
          ? normalizeMercadoPagoUrl(formData.bankAccount.mercadoPagoLink)
          : '',
      },
    };
    onSave(sanitizedFormData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-orange-500/20 text-orange-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base">Datos de la Empresa & Membrete</h2>
              <p className="text-xs text-slate-400">Información legal, fiscal y de contacto para catálogos y comprobantes</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Public Store Link Card (Para compartir con clientes sin cuenta Google) */}
          <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl space-y-2.5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-emerald-700" />
                <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
                  Enlace Público para Clientes (Sin pedir cuenta de Google)
                </span>
              </div>
              <span className="text-[10px] bg-emerald-200/80 text-emerald-900 font-bold px-2 py-0.5 rounded-full">
                Acceso Libre
              </span>
            </div>
            <p className="text-[11px] text-emerald-800 leading-relaxed">
              Este es el enlace oficial que podés enviar a cualquier cliente por WhatsApp o redes sociales. Funciona en cualquier celular o computadora directamente, <strong>sin pedir iniciar sesión con Google</strong>:
            </p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={publicStoreUrl}
                className="flex-1 px-3 py-1.5 text-xs bg-white border border-emerald-300 rounded-xl font-mono text-emerald-950 select-all"
              />
              <button
                type="button"
                onClick={handleCopyPublicUrl}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shrink-0 shadow-xs"
              >
                {copiedPublicUrl ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>¡Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar Enlace</span>
                  </>
                )}
              </button>
              <a
                href={publicStoreUrl}
                target="_blank"
                rel="noreferrer"
                className="p-1.5 text-emerald-700 hover:text-emerald-900 hover:bg-emerald-100 rounded-lg transition-colors shrink-0"
                title="Abrir tienda en nueva pestaña"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
            <p className="text-[10px] text-slate-500 italic">
              *Nota: El enlace que tiene <code className="text-orange-600 font-mono">ais-dev-</code> es tu entorno privado de programación de Google AI Studio, por eso ese te pide cuenta de Google. Para clientes siempre se usa este enlace público (<code className="text-emerald-700 font-mono">ais-pre-</code>).
            </p>
          </div>

          {/* Brand Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Nombre de Fantasía / Marca
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={e => handleChange('name', e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-orange-500 outline-none font-bold text-slate-900"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Eslogan / Bajada de Marca
              </label>
              <input
                type="text"
                value={formData.tagline}
                onChange={e => handleChange('tagline', e.target.value)}
                placeholder="EQUIPAMIENTO COMERCIAL & LAYOUT"
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-orange-500 outline-none font-medium"
              />
            </div>
          </div>

          {/* Legal and Tax */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Razón Social Legal
              </label>
              <input
                type="text"
                value={formData.legalName}
                onChange={e => handleChange('legalName', e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-orange-500 outline-none font-medium"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                CUIT / Identificación Fiscal
              </label>
              <input
                type="text"
                value={formData.taxId}
                onChange={e => handleChange('taxId', e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-orange-500 outline-none font-mono font-bold"
              />
            </div>
          </div>

          {/* Contact Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
                <span>Teléfono / WhatsApp</span>
                <span className="text-[10px] text-emerald-600 font-bold lowercase">atención clientes</span>
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={e => handleChange('phone', e.target.value)}
                placeholder="+54 9 11 5824-9100"
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-orange-500 outline-none font-medium"
              />
              <span className="text-[10px] text-slate-500 block">
                Número para recibir pedidos del carrito y consultas web por WhatsApp.
              </span>
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Correo Electrónico Oficial
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={e => handleChange('email', e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-orange-500 outline-none font-medium"
              />
            </div>
          </div>

          {/* WhatsApp Business Catalog Settings */}
          <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-emerald-600 fill-emerald-600" />
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-950">
                  Catálogo Oficial de WhatsApp Business
                </span>
              </div>
              <span className="text-[10px] bg-emerald-200 text-emerald-900 font-extrabold px-2 py-0.5 rounded-full uppercase">
                wa.me/c
              </span>
            </div>
            <p className="text-[11px] text-emerald-800 leading-relaxed">
              Enlace directo al catálogo de WhatsApp para que tus clientes puedan explorar productos directamente en WhatsApp:
            </p>
            <div className="flex items-center gap-2">
              <input
                type="url"
                value={formData.whatsappCatalogUrl || ''}
                onChange={e => handleChange('whatsappCatalogUrl', e.target.value)}
                placeholder={`https://wa.me/c/${formData.phone.replace(/[^0-9]/g, '') || '5491158249100'}`}
                className="flex-1 px-3 py-1.5 text-xs bg-white border border-emerald-300 rounded-xl font-mono text-emerald-950 outline-none focus:border-emerald-500"
              />
              {formData.whatsappCatalogUrl && (
                <a
                  href={formData.whatsappCatalogUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 text-emerald-700 hover:text-emerald-900 hover:bg-emerald-100 rounded-lg transition-colors"
                  title="Abrir enlace de WhatsApp"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
            <label className="flex items-center gap-2 cursor-pointer select-none pt-1">
              <input
                type="checkbox"
                checked={formData.showWhatsAppCatalogButton ?? true}
                onChange={e => setFormData({ ...formData, showWhatsAppCatalogButton: e.target.checked })}
                className="w-4 h-4 text-emerald-600 rounded border-emerald-300 focus:ring-emerald-500"
              />
              <span className="text-xs font-semibold text-emerald-900">
                Mostrar botón destacado "Ver Catálogo en WhatsApp" en la Tienda Pública
              </span>
            </label>
          </div>

          {/* Address */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Dirección Física / Fábrica
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={e => handleChange('address', e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-orange-500 outline-none font-medium"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Ciudad / Provincia
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={e => handleChange('city', e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-orange-500 outline-none font-medium"
              />
            </div>
          </div>

          {/* Banking Data */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Datos Bancarios para Transferencias & Remitos
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-slate-600">Entidad Bancaria</label>
                <input
                  type="text"
                  value={formData.bankAccount.bank}
                  onChange={e => handleBankChange('bank', e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-slate-600">Alias CBU</label>
                <input
                  type="text"
                  value={formData.bankAccount.alias}
                  onChange={e => handleBankChange('alias', e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg outline-none font-bold text-orange-600"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-slate-600">Número de CBU</label>
                <input
                  type="text"
                  value={formData.bankAccount.cbu}
                  onChange={e => handleBankChange('cbu', e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg outline-none font-mono"
                />
              </div>
            </div>

            {/* Mercado Pago & Digital Wallets */}
            <div className="pt-2 border-t border-slate-200/80 space-y-2.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-sky-700 flex items-center justify-between">
                    <span>Alias Mercado Pago (CVU)</span>
                    <span className="text-[10px] text-slate-400 font-normal">opcional</span>
                  </label>
                  <input
                    type="text"
                    value={formData.bankAccount.mercadoPagoAlias || ''}
                    onChange={e => handleBankChange('mercadoPagoAlias', e.target.value)}
                    placeholder="TITUFARIS.MP"
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg outline-none font-bold text-sky-700"
                  />
                  <span className="text-[10px] text-slate-500 block">
                    Tu Alias de MP para transferencias directas sin comisiones extra.
                  </span>
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-sky-700 flex items-center justify-between">
                    <span>Link de Cobro / QR Oficial MP</span>
                    <span className="text-[10px] text-slate-400 font-normal">URL oficial</span>
                  </label>
                  <input
                    type="url"
                    value={formData.bankAccount.mercadoPagoLink || ''}
                    onChange={e => handleBankChange('mercadoPagoLink', e.target.value)}
                    placeholder="https://link.mercadopago.com.ar/tu-negocio"
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg outline-none font-mono text-slate-700"
                  />
                  <span className="text-[10px] text-slate-500 block">
                    Ej: https://link.mercadopago.com.ar/tu-alias o link de cobro generado en tu app.
                  </span>
                </div>
              </div>

              <div className="p-2.5 bg-sky-50/70 border border-sky-200 rounded-lg text-[11px] text-sky-900 space-y-1">
                <p className="font-bold text-sky-950 flex items-center gap-1.5">
                  <span>ℹ️ ¿Cómo obtener tu Link de Mercado Pago?</span>
                </p>
                <p className="text-sky-850 leading-relaxed text-[10px]">
                  En tu app de Mercado Pago, entrá a <strong>"Cobrar con Link de pago"</strong> o <strong>"Cobrar con QR"</strong> ➔ Compartir tu link/QR ➔ Copiá el enlace y pegalo arriba. El código QR de la tienda dirigirá a los clientes directamente a tu pasarela para cobrar en cuenta.
                </p>
                <p className="text-[10px] text-amber-800 bg-amber-50 p-1.5 rounded border border-amber-200">
                  <strong>Nota sobre las pruebas:</strong> Si vos mismo escaneás el QR desde el mismo teléfono o cuenta dueña del link, Mercado Pago dirá <em>"No podés pagarte a vos mismo"</em>. Eso indica que el link está bien vinculado a tu cuenta. Para probar el pago real, escanealo desde otra cuenta o pedile a un tercero que lo abra.
                </p>
              </div>
            </div>
          </div>

          {/* Terms & Warranty printed on PDF */}
          <div className="space-y-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Condiciones Comerciales & Garantía (Pie de Catálogo PDF)
            </label>
            <textarea
              rows={2}
              value={formData.catalogNotes}
              onChange={e => handleChange('catalogNotes', e.target.value)}
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-orange-500 outline-none"
            />
          </div>

          {/* Backup & System Security Box */}
          {onOpenBackupModal && (
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    Copia de Seguridad y Migración al Servidor
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Descargue un archivo de respaldo con sus artículos o restaure una copia previa.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenBackupModal();
                }}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-2xs transition-colors shrink-0 cursor-pointer"
              >
                Abrir Respaldo
              </button>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="p-4 px-6 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-200 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            className="flex items-center gap-2 px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-md shadow-orange-500/20 transition-all cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Guardar Configuración</span>
          </button>
        </div>
      </div>
    </div>
  );
};
