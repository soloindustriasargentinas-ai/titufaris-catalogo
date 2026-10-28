import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, FileText, Lock, Scale, Building2, Edit3, Check, RotateCcw } from 'lucide-react';
import { CompanyProfile } from '../types';

export type LegalTab = 'terms' | 'privacy' | 'warranty';

export function getDefaultTermsText(company: CompanyProfile): string {
  const minWholesale = company.wholesaleMinUnits || 10;
  const baseCustom = company.termsAndConditions?.trim();

  // If the store already saved a multi-paragraph custom terms text, return it as-is
  if (baseCustom && (baseCustom.includes('\n') || baseCustom.length > 260)) {
    return baseCustom;
  }

  return [
    baseCustom ? `Condiciones Generales: ${baseCustom}` : '',
    `1. Validez de Precios y Presupuestos\nLos valores exhibidos en la lista pública de ${company.name} son precios expresados en ${company.currency || 'ARS'} (${company.currencySymbol || '$'}). Las cotizaciones y presupuestos emitidos por nuestro equipo comercial tienen validez sujeta a disponibilidad de stock al momento de confirmar la operación.`,
    company.wholesaleEnabled !== false
      ? `2. Venta Mayorista y Descuentos por Volumen\nSe considera compra mayorista todo pedido que alcance o supere un mínimo de ${minWholesale} unidades o un presupuesto comercial por volumen. Las tarifas mayoristas se aplican automáticamente en el carrito o mediante atención directa por WhatsApp.`
      : `2. Modalidad de Venta y Atención Comercial\nTodos los pedidos se procesan con stock actualizado y confirmación inmediata a través de nuestro canal oficial de WhatsApp (${company.phone}).`,
    `3. Pedidos Especiales o Productos por Encargo\nLos artículos identificados bajo modalidad "A Pedido" o personalizados requieren confirmación previa de plazos de entrega con nuestro equipo comercial antes del despacho.`,
    `4. Medios de Pago y Facturación\nAceptamos transferencias bancarias directas (Alias: ${company.bankAccount?.alias || 'consultar'}), Mercado Pago, tarjetas y efectivo en salón. Emitimos comprobantes oficiales conforme a la normativa vigente.`
  ]
    .filter(Boolean)
    .join('\n\n');
}

export function getDefaultWarrantyText(company: CompanyProfile): string {
  const customWarranty = company.warrantyAndLogistics?.trim();
  if (customWarranty) {
    return customWarranty;
  }

  const notesIntro = company.catalogNotes?.trim();

  return [
    notesIntro ? `Resumen de Garantía y Envíos: ${notesIntro}` : '',
    `1. Garantía Oficial\nTodos los productos comercializados por ${company.name} cuentan con garantía oficial contra defectos de fabricación o fallas de origen. Ante cualquier inconveniente, nuestro equipo de postventa brinda asistencia directa para cambio, reposición o servicio técnico según corresponda.`,
    `2. Despacho y Logística a Todo el País\nRealizamos envíos a todo el país mediante empresas de correo, transporte o expresos de confianza, además de retiro coordinado en ${company.address || 'nuestro punto de entrega'}. Cada pedido se despacha con embalaje seguro y seguimiento.`,
    `3. Recepción y Conformidad del Pedido\nAl recibir la mercadería, recomendamos verificar el estado exterior del paquete junto al transportista. Cualquier consulta o gestión de cambio puede iniciarse de inmediato escribiendo a nuestro WhatsApp oficial (${company.phone}) o al correo ${company.email}.`
  ]
    .filter(Boolean)
    .join('\n\n');
}

interface LegalNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  company: CompanyProfile;
  initialTab?: LegalTab;
  isAdmin?: boolean;
  onSaveCompany?: (updated: CompanyProfile) => void;
}

export const LegalNoticeModal: React.FC<LegalNoticeModalProps> = ({
  isOpen,
  onClose,
  company,
  initialTab = 'terms',
  isAdmin = false,
  onSaveCompany,
}) => {
  const [activeTab, setActiveTab] = useState<LegalTab>(initialTab);
  const [isEditing, setIsEditing] = useState(false);
  const [draftTermsTitle, setDraftTermsTitle] = useState(company.termsTitle || 'Términos y Condiciones de Venta');
  const [draftTermsText, setDraftTermsText] = useState(() => getDefaultTermsText(company));
  const [draftWarrantyTitle, setDraftWarrantyTitle] = useState(company.warrantyTitle || 'Garantía de Fábrica & Logística');
  const [draftWarrantyText, setDraftWarrantyText] = useState(() => getDefaultWarrantyText(company));
  const [savedToast, setSavedToast] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setIsEditing(false);
      setDraftTermsTitle(company.termsTitle || 'Términos y Condiciones de Venta');
      setDraftTermsText(getDefaultTermsText(company));
      setDraftWarrantyTitle(company.warrantyTitle || 'Garantía de Fábrica & Logística');
      setDraftWarrantyText(getDefaultWarrantyText(company));
    }
  }, [isOpen, initialTab, company]);

  if (!isOpen) return null;

  const displayTermsTitle = company.termsTitle?.trim() || 'Términos y Condiciones de Venta';
  const displayWarrantyTitle = company.warrantyTitle?.trim() || 'Garantía de Fábrica & Logística';
  const displayTermsBody = getDefaultTermsText(company);
  const displayWarrantyBody = getDefaultWarrantyText(company);

  const handleSaveLegalChanges = () => {
    if (!onSaveCompany) return;
    const updated: CompanyProfile = {
      ...company,
      termsTitle: draftTermsTitle.trim() || 'Términos y Condiciones de Venta',
      termsAndConditions: draftTermsText.trim(),
      warrantyTitle: draftWarrantyTitle.trim() || 'Garantía de Fábrica & Logística',
      warrantyAndLogistics: draftWarrantyText.trim(),
    };
    onSaveCompany(updated);
    setIsEditing(false);
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2500);
  };

  const renderFormattedBlocks = (text: string) => {
    const blocks = text
      .split(/\n{2,}/)
      .map(b => b.trim())
      .filter(Boolean);

    return blocks.map((block, idx) => {
      const lines = block.split('\n');
      const firstLine = lines[0]?.trim() || '';
      const restLines = lines.slice(1).join('\n').trim();

      // If block has a heading line + body lines, style the first line as a section title
      if (restLines) {
        return (
          <section key={idx} className="space-y-1.5 bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5">
            <h3 className="font-black text-slate-900 text-sm">{firstLine}</h3>
            <p className="text-slate-600 text-xs whitespace-pre-line leading-relaxed">{restLines}</p>
          </section>
        );
      }

      return (
        <section key={idx} className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5">
          <p className="text-slate-700 text-xs whitespace-pre-line leading-relaxed">{firstLine}</p>
        </section>
      );
    });
  };

  return (
    <div id="legal-notice-modal" className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-200">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-orange-100 text-orange-600">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900">Marco Legal & Políticas Institucionales</h2>
              <p className="text-xs text-slate-500">{company.name} | CUIT: {company.taxId}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onSaveCompany && (activeTab === 'terms' || activeTab === 'warranty') && (
              <button
                type="button"
                onClick={() => setIsEditing(prev => !prev)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer border ${
                  isEditing
                    ? 'bg-slate-200 text-slate-800 border-slate-300'
                    : 'bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-200'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{isEditing ? 'Cancelar Edición' : 'Editar Políticas'}</span>
              </button>
            )}
            <button
              id="btn-close-legal-modal"
              onClick={onClose}
              aria-label="Cerrar modal de términos y privacidad"
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-white px-4 sm:px-6 gap-2 sm:gap-4 overflow-x-auto text-xs font-bold">
          <button
            id="tab-legal-terms"
            onClick={() => setActiveTab('terms')}
            className={`py-3 border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'terms'
                ? 'border-orange-600 text-orange-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>{displayTermsTitle}</span>
          </button>

          <button
            id="tab-legal-privacy"
            onClick={() => {
              setActiveTab('privacy');
              setIsEditing(false);
            }}
            className={`py-3 border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'privacy'
                ? 'border-orange-600 text-orange-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>Privacidad (Ley 25.326)</span>
          </button>

          <button
            id="tab-legal-warranty"
            onClick={() => setActiveTab('warranty')}
            className={`py-3 border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'warranty'
                ? 'border-orange-600 text-orange-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{displayWarrantyTitle}</span>
          </button>
        </div>

        {/* Saved Feedback Toast */}
        {savedToast && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-2 text-xs font-bold text-emerald-800 flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>Políticas de {company.name} actualizadas y guardadas correctamente.</span>
          </div>
        )}

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 text-slate-700 text-xs sm:text-sm space-y-4 leading-relaxed">
          {activeTab === 'terms' && (
            isEditing ? (
              <div className="space-y-4 bg-orange-50/40 border border-orange-200 rounded-2xl p-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                      Editor de Términos y Condiciones de Venta
                    </h3>
                    <p className="text-[11px] text-slate-600">
                      Personalizá el título y las cláusulas comerciales de {company.name}. Separá cada punto con una línea en blanco.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setDraftTermsTitle('Términos y Condiciones de Venta');
                      setDraftTermsText(getDefaultTermsText({ ...company, termsAndConditions: '' }));
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-[11px] font-bold cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Restaurar Plantilla Sugerida</span>
                  </button>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-800">
                    Título de la Sección (visible en el pie de página y pestaña):
                  </label>
                  <input
                    type="text"
                    value={draftTermsTitle}
                    onChange={e => setDraftTermsTitle(e.target.value)}
                    placeholder="Términos y Condiciones de Venta"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:border-orange-500 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-800">
                    Contenido de Términos y Condiciones de Venta:
                  </label>
                  <textarea
                    rows={10}
                    value={draftTermsText}
                    onChange={e => setDraftTermsText(e.target.value)}
                    placeholder="Escribí aquí los términos y condiciones de venta de tu tienda..."
                    className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-300 rounded-xl text-slate-800 focus:border-orange-500 outline-none leading-relaxed"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 font-bold text-xs cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveLegalChanges}
                    className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>Guardar Términos y Condiciones</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3.5">
                <div className="bg-orange-50/60 border border-orange-200 rounded-xl p-3 text-xs text-orange-900 font-medium">
                  Al navegar por el catálogo digital, solicitar cotizaciones o cursar pedidos en <strong>{company.name}</strong>, usted acepta las siguientes condiciones comerciales.
                </div>
                {renderFormattedBlocks(displayTermsBody)}
              </div>
            )
          )}

          {activeTab === 'privacy' && (
            <div className="space-y-4">
              <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-3 text-xs text-blue-900 font-medium">
                Cumplimiento de la Ley Nacional N° 25.326 de Protección de los Datos Personales de la República Argentina.
              </div>

              <section className="space-y-1.5">
                <h3 className="font-black text-slate-900 text-sm">1. Responsable del Tratamiento</h3>
                <p className="text-slate-600 text-xs">
                  El titular del banco de datos es <strong>{company.name}</strong>, con domicilio legal y comercial en {company.address}, CUIT {company.taxId}. Contacto directo de privacidad: {company.email}.
                </p>
              </section>

              <section className="space-y-1.5">
                <h3 className="font-black text-slate-900 text-sm">2. Finalidad de la Recolección de Datos</h3>
                <p className="text-slate-600 text-xs">
                  Los datos solicitados al armar su carrito comercial (Nombre de contacto o razón social, número de WhatsApp/teléfono, localidad o provincia para cálculo de envío) se emplean exclusivamente para:
                </p>
                <ul className="list-disc pl-5 text-xs text-slate-600 space-y-1">
                  <li>Elaborar cotizaciones comerciales y procesar pedidos de clientes.</li>
                  <li>Coordinar el despacho o entrega de la mercadería.</li>
                  <li>Emisión de comprobantes y certificado de garantía oficial.</li>
                </ul>
                <p className="text-slate-600 text-xs">
                  No comercializamos, cedemos ni transferimos bases de datos a terceros bajo ninguna circunstancia.
                </p>
              </section>

              <section className="space-y-1.5">
                <h3 className="font-black text-slate-900 text-sm">3. Derechos ARCO (Acceso, Rectificación y Supresión)</h3>
                <p className="text-slate-600 text-xs">
                  Conforme al Art. 14 y concordantes de la Ley 25.326, usted tiene derecho a acceder a su información de forma gratuita en intervalos no inferiores a seis meses, así como a solicitar en cualquier momento la actualización, rectificación o supresión de sus datos personales enviando un correo electrónico formal a <strong>{company.email}</strong>.
                </p>
                <p className="text-slate-500 text-[11px] italic">
                  La Agencia de Acceso a la Información Pública, órgano de control de la Ley N° 25.326, tiene la atribución de atender denuncias y reclamos en relación al incumplimiento de las normas de protección de datos personales.
                </p>
              </section>

              <section className="space-y-1.5">
                <h3 className="font-black text-slate-900 text-sm">4. Política de Cookies y Almacenamiento Local (LocalStorage)</h3>
                <p className="text-slate-600 text-xs">
                  Para brindar una experiencia de compra fluida y confiable, este sitio web utiliza <strong>cookies técnicas esenciales</strong> y tecnologías de <strong>almacenamiento local del navegador (LocalStorage / SessionStorage)</strong> en el dispositivo de cada usuario que visita la web.
                </p>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-600 space-y-1">
                  <p><strong>¿Qué datos se guardan en su equipo y para qué?</strong></p>
                  <ul className="list-disc pl-4 space-y-0.5">
                    <li><strong>Persistencia del Carrito de Compras:</strong> Los artículos y cantidades que usted agrega se guardan en el <em>LocalStorage</em> de su navegador para que permanezcan intactos al regresar sin necesidad de registrarse.</li>
                    <li><strong>Cookies Técnicas de Navegación:</strong> Se utilizan exclusivamente cookies de sesión técnica indispensables para el funcionamiento y seguridad de la plataforma.</li>
                  </ul>
                </div>
              </section>
            </div>
          )}

          {activeTab === 'warranty' && (
            isEditing ? (
              <div className="space-y-4 bg-emerald-50/40 border border-emerald-200 rounded-2xl p-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                      Editor de Garantía de Fábrica & Logística
                    </h3>
                    <p className="text-[11px] text-slate-600">
                      Personalizá los plazos de garantía, políticas de cambio, retiros y envíos de {company.name}.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setDraftWarrantyTitle('Garantía de Fábrica & Logística');
                      setDraftWarrantyText(getDefaultWarrantyText({ ...company, warrantyAndLogistics: '' }));
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-[11px] font-bold cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Restaurar Plantilla Sugerida</span>
                  </button>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-800">
                    Título de la Sección (visible en el pie de página y pestaña):
                  </label>
                  <input
                    type="text"
                    value={draftWarrantyTitle}
                    onChange={e => setDraftWarrantyTitle(e.target.value)}
                    placeholder="Garantía de Fábrica & Logística"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:border-emerald-500 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-800">
                    Contenido de Garantía & Logística:
                  </label>
                  <textarea
                    rows={10}
                    value={draftWarrantyText}
                    onChange={e => setDraftWarrantyText(e.target.value)}
                    placeholder="Escribí aquí las condiciones de garantía, cambios, envíos y logística..."
                    className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-300 rounded-xl text-slate-800 focus:border-emerald-500 outline-none leading-relaxed"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 font-bold text-xs cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveLegalChanges}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>Guardar Garantía & Logística</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3.5">
                <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-900 font-medium">
                  Políticas oficiales de cobertura de garantía, cambios, embalaje y envíos de <strong>{company.name}</strong>.
                </div>
                {renderFormattedBlocks(displayWarrantyBody)}
              </div>
            )
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
            <span>Ubicación Comercial: {company.address}</span>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && onSaveCompany && !isEditing && (activeTab === 'terms' || activeTab === 'warranty') && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Editar Texto</span>
              </button>
            )}
            <button
              id="btn-understand-legal"
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors cursor-pointer"
            >
              Entendido
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

