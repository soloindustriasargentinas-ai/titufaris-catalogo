import React, { useState } from 'react';
import {
  Globe,
  X,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Copy,
  Check,
  ExternalLink,
  RefreshCw,
  Trash2,
  Server,
  ArrowRight,
  Lock,
  Sparkles,
  HelpCircle,
  Link2
} from 'lucide-react';
import { SaaSTenantStore, SaaSDomainConfig, SaaSDomainDnsRecord, SaaSDomainStatus } from '../types/saas';
import {
  sanitizeDomainName,
  validateDomainFormat,
  associateCustomDomain,
  disassociateCustomDomain,
  verifyDomainDns,
  renewDomainSslCertificate
} from '../utils/saasStorage';

interface CustomDomainModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenant: SaaSTenantStore;
  allTenants: SaaSTenantStore[];
  onUpdateTenants: (updated: SaaSTenantStore[]) => void;
  onSelectTenantDomain?: (domain: string) => void;
}

export const CustomDomainModal: React.FC<CustomDomainModalProps> = ({
  isOpen,
  onClose,
  tenant,
  allTenants,
  onUpdateTenants,
  onSelectTenantDomain
}) => {
  const [domainInput, setDomainInput] = useState<string>(tenant.customDomain || '');
  const [forceHttps, setForceHttps] = useState<boolean>(tenant.domainConfig?.forceHttps ?? true);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [verificationFeedback, setVerificationFeedback] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showConfirmUnlink, setShowConfirmUnlink] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentConfig: SaaSDomainConfig | undefined = tenant.domainConfig;
  const isTitufaris = tenant.id === 'titufaris' || tenant.isDefaultStore;
  const defaultSubdomain = `${tenant.slug}.titufaris.online`;

  const handleCopy = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleConnectDomain = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setVerificationFeedback(null);

    const clean = sanitizeDomainName(domainInput);
    if (!clean) {
      setErrorMessage('Por favor ingrese un nombre de dominio válido (ej. mitienda.com)');
      return;
    }

    const validation = validateDomainFormat(clean);
    if (!validation.valid) {
      setErrorMessage(validation.reason || 'Formato de dominio inválido.');
      return;
    }

    const res = associateCustomDomain(allTenants, tenant.id, clean, forceHttps);
    if (!res.success) {
      setErrorMessage(res.error || 'No se pudo asociar el dominio.');
      return;
    }

    onUpdateTenants(res.updatedTenants);
    setVerificationFeedback({
      success: true,
      message: `Dominio "${clean}" configurado. Ahora debe agregar los registros DNS en su proveedor (DonWeb, GoDaddy, Nic.ar, Cloudflare, etc.).`
    });
  };

  const handleRunDnsVerification = (simulateSuccess: boolean = true) => {
    setIsVerifying(true);
    setErrorMessage(null);
    setVerificationFeedback(null);

    setTimeout(() => {
      const res = verifyDomainDns(tenant, simulateSuccess);
      const updatedTenants = allTenants.map(t => (t.id === tenant.id ? res.updatedTenant : t));
      onUpdateTenants(updatedTenants);
      setVerificationFeedback({
        success: res.success,
        message: res.message
      });
      setIsVerifying(false);
    }, 900);
  };

  const handleUnlinkDomain = () => {
    if (isTitufaris) {
      setErrorMessage('El dominio insignia titufaris.online no puede ser desvinculado.');
      return;
    }

    const res = disassociateCustomDomain(allTenants, tenant.id);
    if (res.success) {
      onUpdateTenants(res.updatedTenants);
      setDomainInput('');
      setVerificationFeedback({
        success: true,
        message: 'Dominio propio desvinculado. Su tienda ahora utilizará el subdominio gratuito oficial.'
      });
      setShowConfirmUnlink(false);
    } else {
      setErrorMessage(res.error || 'Error al desvincular el dominio.');
    }
  };

  const handleRenewSsl = () => {
    const renewed = renewDomainSslCertificate(tenant);
    const updated = allTenants.map(t => (t.id === tenant.id ? renewed : t));
    onUpdateTenants(updated);
    setVerificationFeedback({
      success: true,
      message: 'Certificado SSL renovado exitosamente por 90 días más.'
    });
  };

  const handleTestPreviewWithDomain = () => {
    if (tenant.customDomain) {
      const url = new URL(window.location.href);
      url.searchParams.set('dominio', tenant.customDomain);
      url.searchParams.set('tienda', tenant.slug);
      window.history.pushState({}, '', url.toString());
      if (onSelectTenantDomain) {
        onSelectTenantDomain(tenant.customDomain);
      }
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-indigo-300">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-black text-lg text-white">Dominio Propio (Web Personalizada)</h2>
                <span className="bg-indigo-500/30 text-indigo-200 text-[10px] font-black px-2 py-0.5 rounded-full border border-indigo-400/30 uppercase tracking-wider">
                  Paso 4 SaaS
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Tienda: <strong className="text-white font-bold">{tenant.name}</strong> ({tenant.slug})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Subdomain vs Custom Domain Status Banner */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                <Link2 className="w-4 h-4 text-indigo-600" />
                <span>Enlace Web Actual de la Tienda</span>
              </div>
              {tenant.customDomain ? (
                <span className={`text-[11px] font-black px-2.5 py-1 rounded-full flex items-center gap-1.5 ${
                  tenant.domainStatus === 'ssl_active' || tenant.domainStatus === 'verified'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : tenant.domainStatus === 'propagating'
                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                    : 'bg-blue-100 text-blue-800 border border-blue-300'
                }`}>
                  {tenant.domainStatus === 'ssl_active' || tenant.domainStatus === 'verified' ? (
                    <>
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Dominio Propio Activo & SSL Seguro</span>
                    </>
                  ) : (
                    <>
                      <Clock className="w-3.5 h-3.5 text-amber-600 animate-spin" />
                      <span>DNS Pendiente de Verificación</span>
                    </>
                  )}
                </span>
              ) : (
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-200 text-slate-700">
                  Subdominio Gratuito
                </span>
              )}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 font-mono text-xs">
              <div className="flex items-center gap-2 truncate">
                <Lock className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-slate-900 font-bold truncate">
                  {tenant.customDomain ? `https://${tenant.customDomain}` : `https://${defaultSubdomain}`}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() =>
                    handleCopy(
                      tenant.customDomain ? `https://${tenant.customDomain}` : `https://${defaultSubdomain}`,
                      'current-url'
                    )
                  }
                  className="px-2.5 py-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition font-sans text-xs flex items-center gap-1 cursor-pointer"
                >
                  {copiedField === 'current-url' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700 font-bold">Copiado</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar</span>
                    </>
                  )}
                </button>
                {tenant.customDomain && (
                  <button
                    type="button"
                    onClick={handleTestPreviewWithDomain}
                    className="px-2.5 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg transition font-sans text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Ver Tienda</span>
                  </button>
                )}
              </div>
            </div>

            <p className="text-[11px] text-slate-500">
              * El subdominio oficial <code className="text-indigo-600 font-semibold">{defaultSubdomain}</code> siempre permanece activo como respaldo garantizado aunque asocie un dominio propio.
            </p>
          </div>

          {/* Error / Feedback Alerts */}
          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-rose-800 text-xs">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Error en la configuración</p>
                <p className="mt-0.5">{errorMessage}</p>
              </div>
            </div>
          )}

          {verificationFeedback && (
            <div
              className={`p-3.5 rounded-2xl flex items-start gap-3 text-xs ${
                verificationFeedback.success
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                  : 'bg-amber-50 border border-amber-200 text-amber-800'
              }`}
            >
              {verificationFeedback.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              )}
              <div>
                <p className="font-bold">
                  {verificationFeedback.success ? 'Estado de Dominio Actualizado' : 'Verificación de DNS'}
                </p>
                <p className="mt-0.5">{verificationFeedback.message}</p>
              </div>
            </div>
          )}

          {/* Form to Associate / Change Custom Domain */}
          <form onSubmit={handleConnectDomain} className="space-y-4">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1">
                Asociar Nombre de Dominio Propio
              </label>
              <p className="text-xs text-slate-500 mb-2">
                Ingrese el dominio que registró en DonWeb, GoDaddy, Nic.ar, Hostinger o su registrador preferido (ej: <code className="text-indigo-600 font-bold">mitienda.com</code> o <code className="text-indigo-600 font-bold">www.mimarca.com.ar</code>):
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Globe className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    disabled={isTitufaris}
                    value={domainInput}
                    onChange={e => setDomainInput(e.target.value)}
                    placeholder="ej: mitienda.com o www.mimarca.ar"
                    className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none font-bold text-slate-900 disabled:opacity-60"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isTitufaris || isVerifying}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition shadow-xs cursor-pointer flex items-center justify-center gap-2 shrink-0 disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>{tenant.customDomain ? 'Actualizar Dominio' : 'Conectar Dominio'}</span>
                </button>
              </div>
            </div>

            {/* HTTPS Toggle & Details */}
            <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <div>
                  <span className="font-bold text-slate-800">Forzar Redirección HTTPS Automática</span>
                  <p className="text-[11px] text-slate-500">
                    Redirige automáticamente todo el tráfico HTTP no seguro a HTTPS seguro.
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={forceHttps}
                  onChange={e => setForceHttps(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>
          </form>

          {/* DNS Configuration Instructions & Records Table */}
          {tenant.customDomain && currentConfig && (
            <div className="space-y-4 pt-2 border-t border-slate-200">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="font-black text-sm text-slate-900 flex items-center gap-1.5">
                    <Server className="w-4 h-4 text-indigo-600" />
                    <span>Instrucciones de Configuración DNS para {tenant.customDomain}</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Ingrese al panel de control de su registrador de dominio y añada estos 3 registros:
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleRunDnsVerification(true)}
                    disabled={isVerifying}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    {isVerifying ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />
                    )}
                    <span>Verificar DNS en Vivo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRunDnsVerification(false)}
                    disabled={isVerifying}
                    title="Simular caso de propagación en curso"
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
                  >
                    Simular Espera
                  </button>
                </div>
              </div>

              {/* Records Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs divide-y divide-slate-200">
                  <thead className="bg-slate-100/80 text-slate-700 font-black uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-2.5 px-3">Tipo</th>
                      <th className="py-2.5 px-3">Nombre / Host</th>
                      <th className="py-2.5 px-3">Destino / Valor</th>
                      <th className="py-2.5 px-3 text-center">TTL</th>
                      <th className="py-2.5 px-3 text-center">Estado</th>
                      <th className="py-2.5 px-3 text-right">Copiar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {currentConfig.dnsRecords.map((record: SaaSDomainDnsRecord, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 px-3">
                          <span className={`font-black px-2 py-0.5 rounded text-[10px] ${
                            record.type === 'A'
                              ? 'bg-blue-100 text-blue-800'
                              : record.type === 'CNAME'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {record.type}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                          {record.name}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-700 truncate max-w-[220px]">
                          {record.target}
                        </td>
                        <td className="py-2.5 px-3 text-center text-slate-500 font-mono text-[11px]">
                          {record.ttl || 3600}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {record.status === 'resolved' ? (
                            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Resuelto
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                              <Clock className="w-3 h-3 text-amber-600" /> Pendiente
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleCopy(record.target, `record-${idx}`)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                            title="Copiar valor de registro"
                          >
                            {copiedField === `record-${idx}` ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* SSL & Certificate Details Card */}
              <div className="bg-slate-900 text-white p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span className="font-bold text-xs text-white">Certificado SSL Automático Let's Encrypt</span>
                    <span className={`text-[10px] font-black px-1.5 py-0.2 rounded ${
                      currentConfig.sslActive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                    }`}>
                      {currentConfig.sslActive ? 'ACTIVO' : 'EN ESPERA DE DNS'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Emisor: {currentConfig.sslIssuer || "Let's Encrypt Authority X3"} · Renovación automática cada 90 días con cifrado TLS 1.3
                  </p>
                  {currentConfig.verifiedAt && (
                    <p className="text-[10px] text-emerald-400">
                      ✓ Verificado el: {new Date(currentConfig.verifiedAt).toLocaleString('es-AR')}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleRenewSsl}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition cursor-pointer flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3 h-3 text-slate-400" />
                    <span>Renovar SSL</span>
                  </button>
                </div>
              </div>

              {/* Unlink Domain Option (Hidden for flagship Titufaris) */}
              {!isTitufaris && (
                <div className="pt-2 flex justify-between items-center text-xs">
                  {!showConfirmUnlink ? (
                    <button
                      type="button"
                      onClick={() => setShowConfirmUnlink(true)}
                      className="text-rose-600 hover:text-rose-800 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Desvincular este dominio de la tienda</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 p-2.5 rounded-xl w-full justify-between">
                      <span className="text-rose-800 font-bold text-xs">
                        ¿Confirmar desvinculación de {tenant.customDomain}?
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleUnlinkDomain}
                          className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-xs cursor-pointer"
                        >
                          Sí, desvincular
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowConfirmUnlink(false)}
                          className="px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs cursor-pointer"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 px-6 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
            <span>Los cambios DNS pueden tardar de 5 minutos a 24 horas en propagarse mundialmente.</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
