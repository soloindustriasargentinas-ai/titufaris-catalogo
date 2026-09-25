import React, { useState } from 'react';
import { X, ShieldCheck, FileText, Lock, Scale, CheckCircle2, Building2 } from 'lucide-react';
import { CompanyProfile } from '../types';

export type LegalTab = 'terms' | 'privacy' | 'warranty';

interface LegalNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  company: CompanyProfile;
  initialTab?: LegalTab;
}

export const LegalNoticeModal: React.FC<LegalNoticeModalProps> = ({
  isOpen,
  onClose,
  company,
  initialTab = 'terms',
}) => {
  const [activeTab, setActiveTab] = useState<LegalTab>(initialTab);

  if (!isOpen) return null;

  return (
    <div id="legal-notice-modal" className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-200">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-orange-100 text-orange-600">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900">Marco Legal & Políticas Institucionales</h2>
              <p className="text-xs text-slate-500">{company.name} | CUIT: {company.taxId}</p>
            </div>
          </div>
          <button
            id="btn-close-legal-modal"
            onClick={onClose}
            aria-label="Cerrar modal de términos y privacidad"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
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
            <span>Términos y Condiciones</span>
          </button>

          <button
            id="tab-legal-privacy"
            onClick={() => setActiveTab('privacy')}
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
            <span>Garantía y Logística</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 text-slate-700 text-xs sm:text-sm space-y-4 leading-relaxed">
          {activeTab === 'terms' && (
            <div className="space-y-4">
              <div className="bg-orange-50/60 border border-orange-200 rounded-xl p-3 text-xs text-orange-900 font-medium">
                Última actualización: Septiembre 2026. Al navegar por el catálogo digital, solicitar cotizaciones o cursar pedidos en {company.name}, usted acepta las siguientes condiciones comerciales.
              </div>

              <section className="space-y-1.5">
                <h3 className="font-black text-slate-900 text-sm">1. Validez de Precios y Presupuestos</h3>
                <p className="text-slate-600 text-xs">
                  Los valores exhibidos en la lista pública son precios de lista en Pesos Argentinos (ARS), con IVA incluido para consumidor final salvo mención expresa en factura discriminada (Factura A / B). Debido a la dinámica del costo de materias primas (chapa plegada, acero, pintura electrostática epoxi y motocompresores), las cotizaciones formales emitidas por nuestros asesores tienen una vigencia de 7 (siete) días corridos desde su emisión.
                </p>
              </section>

              <section className="space-y-1.5">
                <h3 className="font-black text-slate-900 text-sm">2. Venta Mayorista y Descuentos por Volumen</h3>
                <p className="text-slate-600 text-xs">
                  Se considera compra mayorista todo pedido que acumule un mínimo de 10 (diez) unidades de la misma línea o un presupuesto integral de salón comercial. Las tarifas mayoristas son calculadas automáticamente por nuestro sistema y validadas por el equipo comercial de fábrica.
                </p>
              </section>

              <section className="space-y-1.5">
                <h3 className="font-black text-slate-900 text-sm">3. Equipamiento Fabricado a Pedido (Made to Order)</h3>
                <p className="text-slate-600 text-xs">
                  Los productos identificados con la etiqueta "A Pedido" (checkouts motorizados a medida, góndolas con colores corporativos especiales y murales refrigerados específicos) requieren un anticipo del 50% para inicio de producción en planta fabril, cancelándose el saldo contra aviso de despacho. El plazo promedio de fabricación oscila entre 15 y 25 días hábiles según la envergadura del proyecto.
                </p>
              </section>

              <section className="space-y-1.5">
                <h3 className="font-black text-slate-900 text-sm">4. Medios de Pago Habilitados</h3>
                <p className="text-slate-600 text-xs">
                  Aceptamos transferencias bancarias directas (CBU / Alias oficial), cheques electrónicos (eCheq de pago diferido previa calificación crediticia), cobro por código QR interconectable y tarjetas bancarias habilitadas. Toda operación formal cuenta con la emisión del comprobante fiscal electrónico respaldado por AFIP / ARCA.
                </p>
              </section>
            </div>
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
                  Los datos solicitados al armar su carrito comercial (Nombre de contacto o razón social, número de WhatsApp/teléfono, localidad o provincia para cálculo de flete) se emplean exclusivamente para:
                </p>
                <ul className="list-disc pl-5 text-xs text-slate-600 space-y-1">
                  <li>Elaborar cotizaciones comerciales y planos de implantación a medida.</li>
                  <li>Coordinar el despacho de la mercadería con las empresas de transporte o expresos.</li>
                  <li>Emisión de la factura fiscal y certificado de garantía oficial.</li>
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
                <h3 className="font-black text-slate-900 text-sm">4. Almacenamiento Local (IndexedDB & LocalStorage)</h3>
                <p className="text-slate-600 text-xs">
                  Esta plataforma web utiliza tecnologías de almacenamiento local en su propio navegador para permitir que su carrito de compras persista entre sesiones y para almacenar en caché las imágenes de los productos, garantizando una navegación ultrarrápida y catálogo disponible aún con conexión inestable.
                </p>
              </section>
            </div>
          )}

          {activeTab === 'warranty' && (
            <div className="space-y-4">
              <section className="space-y-1.5">
                <h3 className="font-black text-slate-900 text-sm">1. Garantía Oficial de Fábrica</h3>
                <p className="text-slate-600 text-xs">
                  Todo equipamiento estructural (góndolas, racks de almacén, ménsulas y estantes reforzados) cuenta con <strong>12 (doce) meses de garantía oficial</strong> contra defectos de fabricación o fallas en soldaduras y pintura epoxi horneada. Los equipos con motocompresores o componentes mecánicos/eléctricos (murales y checkouts) disponen de 6 (seis) meses de garantía técnica sobre sus unidades motoras.
                </p>
              </section>

              <section className="space-y-1.5">
                <h3 className="font-black text-slate-900 text-sm">2. Despacho y Logística a Todo el País</h3>
                <p className="text-slate-600 text-xs">
                  Efectuamos despachos a todo el territorio nacional mediante transportes y expresos seleccionados por el cliente o sugeridos por nuestro departamento de logística según la zona geográfica. El equipamiento viaja embalado con film protector y esquineros de cartón reforzado para asegurar su indemnidad durante el trayecto.
                </p>
              </section>

              <section className="space-y-1.5">
                <h3 className="font-black text-slate-900 text-sm">3. Recepción e Inspección en Obra</h3>
                <p className="text-slate-600 text-xs">
                  Al recibir la mercadería en destino, el cliente o su representante debe verificar el estado exterior del embalaje y firmar el remito de conformidad con el chofer del expreso. Cualquier observación por golpe o rotura en tránsito debe constar en el remito del transporte para habilitar el seguro de carga correspondiente.
                </p>
              </section>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Building2 className="w-4 h-4 text-slate-400" />
            <span>Fábrica & Showroom: {company.address}</span>
          </div>
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
  );
};
