import React, { useState, useRef } from 'react';
import {
  X,
  ShieldCheck,
  Download,
  Upload,
  FileJson,
  CheckCircle2,
  AlertCircle,
  Package,
  Layers,
  Building2,
  Users,
  Copy,
  Check,
  Code2,
  FileText,
  Clock,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';
import { Product, Category, CompanyProfile, User, Sale, ActivityLog, AppBackupData } from '../types';
import {
  generateBackupData,
  downloadBackupJSONFile,
  parseAndValidateBackup,
  formatDate,
} from '../utils/storage';

interface BackupRestoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  categories: Category[];
  company: CompanyProfile;
  users: User[];
  sales?: Sale[];
  activityLogs?: ActivityLog[];
  onRestore: (backup: AppBackupData, mode: 'replace' | 'merge') => void;
  onLoggedActivity?: (title: string, details: string) => void;
  onOpenRecoveryModal?: () => void;
}

export const BackupRestoreModal: React.FC<BackupRestoreModalProps> = ({
  isOpen,
  onClose,
  products,
  categories,
  company,
  users,
  sales = [],
  activityLogs = [],
  onRestore,
  onLoggedActivity,
  onOpenRecoveryModal,
}) => {
  const [activeTab, setActiveTab] = useState<'download' | 'restore' | 'code'>('download');
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);

  // Restore state
  const [dragOver, setDragOver] = useState(false);
  const [parsedBackup, setParsedBackup] = useState<AppBackupData | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [restoreMode, setRestoreMode] = useState<'replace' | 'merge'>('replace');
  const [isSuccessRestored, setIsSuccessRestored] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const currentBackup = generateBackupData(
    products,
    categories,
    company,
    users,
    sales,
    activityLogs
  );

  const handleDownload = () => {
    downloadBackupJSONFile(currentBackup);
    onLoggedActivity?.(
      'Copia de seguridad descargada',
      `Archivo JSON generado con ${products.length} productos y ${categories.length} categorías.`
    );
  };

  const handleCopyJSON = () => {
    navigator.clipboard.writeText(JSON.stringify(currentBackup, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2500);
  };

  const handleProcessFile = (file: File) => {
    setParseError(null);
    setIsSuccessRestored(false);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (!content) {
        setParseError('No se pudo leer el contenido del archivo.');
        return;
      }
      const result = parseAndValidateBackup(content);
      if (!result.valid || !result.data) {
        setParseError(result.error || 'Archivo inválido.');
        setParsedBackup(null);
      } else {
        setParsedBackup(result.data);
      }
    };
    reader.onerror = () => {
      setParseError('Error de lectura al abrir el archivo seleccionado.');
    };
    reader.readAsText(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
  };

  const handleConfirmRestore = () => {
    if (!parsedBackup) return;

    onRestore(parsedBackup, restoreMode);
    setIsSuccessRestored(true);
    onLoggedActivity?.(
      'Copia de seguridad restaurada',
      `Restauración de ${parsedBackup.products.length} artículos en modo ${
        restoreMode === 'replace' ? 'Reemplazo Total' : 'Combinado'
      }.`
    );

    setTimeout(() => {
      onClose();
      setIsSuccessRestored(false);
      setParsedBackup(null);
      setFileName(null);
    }, 1800);
  };

  const handleCopyInitialCode = () => {
    const code = `// Copia exportada para src/data/initialData.ts
export const initialProducts = ${JSON.stringify(products, null, 2)};
`;
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-orange-500/20 text-orange-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base">Copia de Seguridad & Restauración</h2>
              <p className="text-xs text-slate-400">
                Respalde, descargue y transfiera todo su catálogo al servidor
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('download')}
            className={`py-3 px-4 font-bold text-xs border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'download'
                ? 'border-orange-600 text-orange-600 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>1. Descargar Copia</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('restore')}
            className={`py-3 px-4 font-bold text-xs border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'restore'
                ? 'border-orange-600 text-orange-600 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>2. Restaurar en el Servidor</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('code')}
            className={`py-3 px-4 font-bold text-xs border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'code'
                ? 'border-orange-600 text-orange-600 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>3. Fijar en Código</span>
          </button>
          {onOpenRecoveryModal && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenRecoveryModal();
              }}
              title="Escanear memoria local previa o pegar listado de artículos"
              className="py-3 px-4 font-bold text-xs border-b-2 border-transparent text-amber-700 hover:text-amber-900 hover:bg-amber-50 flex items-center gap-2 transition-all cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 text-amber-600" />
              <span>4. Recuperador / Escáner</span>
            </button>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* TAB 1: DESCARGAR COPIA */}
          {activeTab === 'download' && (
            <div className="space-y-5">
              <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-4 text-xs text-amber-900">
                <h4 className="font-bold flex items-center gap-1.5 text-amber-950 mb-1">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  Todo lo que tienes cargado se guardará en un archivo de respaldo
                </h4>
                <p className="leading-relaxed">
                  Descarga este archivo ahora. Cuando subas tu aplicación al servidor o la abras desde otra computadora, simplemente ve a la pestaña <strong>"Restaurar en el Servidor"</strong> y selecciona este archivo.
                </p>
              </div>

              {/* Summary of What's Included */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2.5">
                  Contenido incluido en la copia de seguridad
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                    <Package className="w-5 h-5 text-orange-600 mx-auto mb-1" />
                    <div className="font-black text-slate-900 text-lg">{products.length}</div>
                    <div className="text-[11px] text-slate-500 font-medium">Artículos y Fotos</div>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                    <Layers className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                    <div className="font-black text-slate-900 text-lg">{categories.length}</div>
                    <div className="text-[11px] text-slate-500 font-medium">Categorías</div>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                    <Building2 className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
                    <div className="font-black text-slate-900 text-sm truncate">{company.name}</div>
                    <div className="text-[11px] text-slate-500 font-medium">Datos Empresa</div>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                    <Users className="w-5 h-5 text-purple-600 mx-auto mb-1" />
                    <div className="font-black text-slate-900 text-lg">{users.length}</div>
                    <div className="text-[11px] text-slate-500 font-medium">Usuarios & Roles</div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleDownload}
                  className="flex-1 flex items-center justify-center gap-2 px-5 py-3.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-md shadow-orange-500/20 transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Descargar Copia de Seguridad (.json)</span>
                </button>
                <button
                  type="button"
                  onClick={handleCopyJSON}
                  className="flex items-center justify-center gap-2 px-4 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-all cursor-pointer"
                >
                  {copiedJson ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600 font-bold" />
                      <span className="text-emerald-700">¡Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copiar JSON</span>
                    </>
                  )}
                </button>
              </div>

              {/* Step by Step Guide */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <h5 className="text-xs font-bold text-slate-800 mb-2">Pasos para migrar al servidor:</h5>
                <ol className="text-xs text-slate-600 space-y-1.5 list-decimal list-inside">
                  <li>Haz clic en el botón naranja <strong>"Descargar Copia de Seguridad (.json)"</strong>.</li>
                  <li>Guarda el archivo en tu computadora.</li>
                  <li>Abre la aplicación en el servidor o nueva computadora.</li>
                  <li>Ve a esta misma ventana y selecciona <strong>"2. Restaurar en el Servidor"</strong>.</li>
                  <li>Arrastra el archivo y pulsa <strong>"Restaurar Catálogo Ahora"</strong>.</li>
                </ol>
              </div>
            </div>
          )}

          {/* TAB 2: RESTAURAR EN EL SERVIDOR */}
          {activeTab === 'restore' && (
            <div className="space-y-5">
              {isSuccessRestored ? (
                <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-8 text-center space-y-3">
                  <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto animate-bounce" />
                  <h3 className="font-bold text-emerald-950 text-base">
                    ¡Catálogo Restaurado con Éxito!
                  </h3>
                  <p className="text-xs text-emerald-800">
                    Se han cargado todos los productos, fotos, precios y configuraciones.
                  </p>
                </div>
              ) : (
                <>
                  <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3.5 text-xs text-blue-900">
                    Sube el archivo <strong>.json</strong> que descargaste previamente para cargar todos tus artículos y fotografías en este navegador o servidor.
                  </div>

                  {/* Dropzone */}
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOver(true);
                    }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer ${
                      dragOver
                        ? 'border-orange-500 bg-orange-500/10 scale-[0.99]'
                        : 'border-slate-300 hover:border-orange-400 bg-slate-50 hover:bg-white'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".json,application/json"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <FileJson className="w-10 h-10 text-orange-600 mx-auto mb-2.5" />
                    <h4 className="font-bold text-xs text-slate-800 mb-1">
                      {fileName ? fileName : 'Haga clic para seleccionar o arrastre el archivo .json aquí'}
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Archivo de copia de seguridad generado por Titufaris
                    </p>
                  </div>

                  {/* Error Notification */}
                  {parseError && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-red-800">
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold">Error en el archivo</div>
                        <div>{parseError}</div>
                      </div>
                    </div>
                  )}

                  {/* Valid Backup Preview */}
                  {parsedBackup && (
                    <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          Copia de seguridad válida detectada
                        </span>
                        <span className="text-[11px] text-emerald-700 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {formatDate(parsedBackup.exportedAt)}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center text-xs">
                        <div className="bg-white/80 p-2 rounded-lg border border-emerald-200">
                          <span className="block font-black text-emerald-950 text-base">
                            {parsedBackup.products.length}
                          </span>
                          <span className="text-[10px] text-emerald-800">Artículos</span>
                        </div>
                        <div className="bg-white/80 p-2 rounded-lg border border-emerald-200">
                          <span className="block font-black text-emerald-950 text-base">
                            {parsedBackup.categories.length}
                          </span>
                          <span className="text-[10px] text-emerald-800">Categorías</span>
                        </div>
                        <div className="bg-white/80 p-2 rounded-lg border border-emerald-200">
                          <span className="block font-black text-emerald-950 text-xs truncate">
                            {parsedBackup.company.name}
                          </span>
                          <span className="text-[10px] text-emerald-800">Empresa</span>
                        </div>
                      </div>

                      {/* Restore Mode Choice */}
                      <div className="pt-2 border-t border-emerald-200/60">
                        <label className="block text-[11px] font-bold text-emerald-950 uppercase tracking-wider mb-2">
                          Modo de Restauración:
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setRestoreMode('replace')}
                            className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                              restoreMode === 'replace'
                                ? 'bg-white border-emerald-600 ring-2 ring-emerald-500/20 shadow-xs'
                                : 'bg-emerald-100/40 border-emerald-200 text-emerald-800'
                            }`}
                          >
                            <div className="font-bold text-xs text-slate-900">
                              Reemplazar Todo (Recomendado)
                            </div>
                            <div className="text-[10px] text-slate-500 leading-tight">
                              Sustituye todo el catálogo actual por el de la copia.
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() => setRestoreMode('merge')}
                            className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                              restoreMode === 'merge'
                                ? 'bg-white border-emerald-600 ring-2 ring-emerald-500/20 shadow-xs'
                                : 'bg-emerald-100/40 border-emerald-200 text-emerald-800'
                            }`}
                          >
                            <div className="font-bold text-xs text-slate-900">
                              Combinar con Existente
                            </div>
                            <div className="text-[10px] text-slate-500 leading-tight">
                              Conserva lo actual y agrega los productos nuevos.
                            </div>
                          </button>
                        </div>
                      </div>

                      {/* Confirm Restore Button */}
                      <button
                        type="button"
                        onClick={handleConfirmRestore}
                        className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                      >
                        <Upload className="w-4 h-4" />
                        <span>
                          Restaurar Catálogo Ahora ({parsedBackup.products.length} productos)
                        </span>
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* TAB 3: FIJAR EN CÓDIGO PERMANENTE */}
          {activeTab === 'code' && (
            <div className="space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-700 space-y-2">
                <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Code2 className="w-4 h-4 text-orange-600" />
                  ¿Quieres que tus productos sean los predeterminados de fábrica?
                </h4>
                <p className="leading-relaxed">
                  Si deseas que tus productos actuales queden grabados permanentemente en el proyecto (de modo que cualquier usuario o servidor nuevo los tenga cargados sin importar nada), puedes copiar los datos para el archivo <code>src/data/initialData.ts</code>.
                </p>
              </div>

              <div className="p-4 bg-slate-900 text-slate-200 rounded-xl font-mono text-[11px] overflow-x-auto max-h-48 border border-slate-800">
                <pre>{`// Contiene ${products.length} productos con fotos, precios y stock\nexport const initialProducts = ${JSON.stringify(
                  products.slice(0, 2),
                  null,
                  2
                ).slice(0, 250)}... (+${products.length - 2} productos más)`}</pre>
              </div>

              <button
                type="button"
                onClick={handleCopyInitialCode}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                {copiedCode ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400 font-bold" />
                    <span className="text-emerald-400">¡Código Copiado al Portapapeles!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copiar Todos los Productos para initialData.ts</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 px-6 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-500">
            Formato estándar compatible con cualquier servidor web
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-200 transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
