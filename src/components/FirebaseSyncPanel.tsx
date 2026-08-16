import React, { useState, useEffect } from "react";
import {
  Wifi,
  WifiOff,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Database,
  Clock,
  Activity,
  Zap,
  RotateCcw,
  ShieldCheck,
  ShieldAlert,
  Server,
  FileCheck,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CloudDownload,
  CloudUpload,
  Copy,
  Check,
  Smartphone,
  Laptop,
  Layers,
  HelpCircle,
  Trash2,
  Share2
} from "lucide-react";
import {
  subscribeFirebaseSyncStatus,
  getFirebaseSyncStatus,
  testFirebaseConnection,
  forceSyncFromCloud,
  pushAllLocalToCloud,
  clearSyncLogs,
  getDeviceDiagnosticInfo,
  FirebaseSyncStatus,
  FirebaseSyncLogEntry
} from "../lib/firebase";

const COLLECTION_LABELS: Record<string, { label: string; icon: string; desc: string }> = {
  books: { label: "Inventario de Libros", icon: "📚", desc: "Catálogo completo, precios, stock y códigos" },
  ventas: { label: "Ventas y Boletas", icon: "🛒", desc: "Historial de transacciones y comprobantes" },
  proveedores: { label: "Proveedores & Editoriales", icon: "🏢", desc: "Cuentas por pagar y contactos" },
  librerias: { label: "Red Librerías Trama", icon: "📍", desc: "Sedes asociadas y márgenes de utilidad" },
  accesos: { label: "Usuarios y Personal", icon: "👥", desc: "Credenciales de administradores y vendedores" },
  movimientos: { label: "Kardex de Movimientos", icon: "📦", desc: "Entradas, salidas y ajustes de stock" },
  gastos: { label: "Gastos Operativos", icon: "💸", desc: "Egresos diarios y costos fijos de local" },
  otrosIngresos: { label: "Otros Ingresos", icon: "💰", desc: "Entradas adicionales y aportes de capital" },
  auditLogs: { label: "Auditoría de Seguridad", icon: "🛡️", desc: "Registros de eventos y cambios con hora Chile" },
  infoEmpresa: { label: "Datos Corporativos Trama", icon: "⚙️", desc: "RUT, dirección, teléfono, redes y horarios" },
  cierresCaja: { label: "Arqueos y Cierres Caja", icon: "🔒", desc: "Historial de arqueos de caja y diferencias" },
  liquidaciones: { label: "Liquidaciones Consignación", icon: "📑", desc: "Comprobantes de rendición de consignaciones" },
  aperturaActiva: { label: "Estado Sesión Caja Activa", icon: "🟢", desc: "Estado en vivo del turno de caja actual" },
};

export const FirebaseSyncPanel: React.FC = () => {
  const [syncStatus, setSyncStatus] = useState<FirebaseSyncStatus>(getFirebaseSyncStatus());
  const [isTesting, setIsTesting] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; latencyMs: number; message: string } | null>(null);
  const [showLogs, setShowLogs] = useState(true);
  const [logFilter, setLogFilter] = useState<"todos" | "success" | "error" | "syncing" | "info">("todos");
  const [copiedDiag, setCopiedDiag] = useState(false);
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");

  const deviceInfo = getDeviceDiagnosticInfo();

  useEffect(() => {
    const unsubscribe = subscribeFirebaseSyncStatus((newStatus) => {
      setSyncStatus(newStatus);
    });
    return () => unsubscribe();
  }, []);

  const handleRunPingTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const result = await testFirebaseConnection();
      setTestResult(result);
    } catch (err: any) {
      setTestResult({
        success: false,
        latencyMs: 0,
        message: `Error al probar conexión: ${err?.message || String(err)}`
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleForcePull = async () => {
    setIsPulling(true);
    try {
      const res = await forceSyncFromCloud();
      setTestResult({
        success: res.success,
        latencyMs: 0,
        message: res.message
      });
    } catch (err: any) {
      setTestResult({
        success: false,
        latencyMs: 0,
        message: `Error al forzar sincronización: ${err?.message || String(err)}`
      });
    } finally {
      setIsPulling(false);
    }
  };

  const handlePushAll = async () => {
    if (!window.confirm("¿Deseas subir todos los datos locales actuales (inventario, ventas, cuentas, etc.) a Cloud Firestore?")) {
      return;
    }
    setIsPushing(true);
    try {
      const res = await pushAllLocalToCloud();
      setTestResult({
        success: res.success,
        latencyMs: 0,
        message: res.message
      });
    } catch (err: any) {
      setTestResult({
        success: false,
        latencyMs: 0,
        message: `Error al subir datos: ${err?.message || String(err)}`
      });
    } finally {
      setIsPushing(false);
    }
  };

  const handleCopyDiagnostic = () => {
    const diagReport = {
      timestamp: new Date().toLocaleString("es-CL", { timeZone: "America/Santiago" }),
      zonaHoraria: "Chile (America/Santiago)",
      dispositivo: deviceInfo,
      estadoFirebase: {
        disponible: syncStatus.isAvailable,
        estado: syncStatus.status,
        ultimaSincronizacion: syncStatus.lastSyncTime,
        ultimaOperacion: syncStatus.lastOperation,
        erroresEscritura: syncStatus.writeErrors,
        erroresLectura: syncStatus.readErrors,
        ultimoError: syncStatus.lastErrorMessage,
      },
      colecciones: syncStatus.collections,
      ultimosLogs: syncStatus.logs.slice(0, 10),
    };

    navigator.clipboard.writeText(JSON.stringify(diagReport, null, 2));
    setCopiedDiag(true);
    setTimeout(() => setCopiedDiag(false), 3000);
  };

  const isConnected = syncStatus.status === "connected";
  const isSyncing = syncStatus.status === "syncing";
  const isError = syncStatus.status === "error" || syncStatus.writeErrors > 0;

  const filteredLogs = syncStatus.logs.filter(log => {
    if (logFilter === "todos") return true;
    return log.type === logFilter;
  });

  const totalSyncedDocs = Object.values(syncStatus.collections).reduce(
    (acc, curr) => acc + (curr.docsCount || 0),
    0
  );

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-2xs space-y-5 animate-in fade-in duration-200">
      {/* CABECERA PRINCIPAL Y ESTADO EN VIVO */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-4">
        <div className="flex items-center gap-3.5">
          <div className={`p-3 rounded-2xl ${
            isError
              ? "bg-rose-100 text-rose-700 border border-rose-200"
              : isSyncing
              ? "bg-purple-100 text-purple-700 border border-purple-200"
              : isConnected
              ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
              : "bg-amber-100 text-amber-700 border border-amber-200"
          }`}>
            {isError ? (
              <AlertTriangle size={24} className="animate-bounce" />
            ) : isSyncing ? (
              <RefreshCw size={24} className="animate-spin" />
            ) : isConnected ? (
              <Wifi size={24} />
            ) : (
              <WifiOff size={24} />
            )}
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-extrabold text-gray-900">
                Panel de Diagnóstico & Sincronización en Tiempo Real
              </h3>
              <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-900 border border-purple-200">
                Cloud Firestore
              </span>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 border border-stone-200">
                Hora Chile 🇨🇱
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Supervisión de enlaces en la nube, latencia de conexión, marcas de tiempo y resolución de estados entre dispositivos.
            </p>
          </div>
        </div>

        {/* ACCIONES SUPERIORES */}
        <div className="flex flex-wrap items-center gap-2">
          {/* BADGE GLOBAL DE ESTADO */}
          {isConnected && !isError && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
              <span>Conectado</span>
            </div>
          )}

          {isSyncing && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-purple-50 text-purple-800 border border-purple-200 shadow-2xs">
              <RefreshCw size={14} className="text-purple-600 animate-spin shrink-0" />
              <span>Sincronizando...</span>
            </div>
          )}

          {isError && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200 shadow-2xs">
              <AlertTriangle size={14} className="text-rose-600 shrink-0" />
              <span>Error en Red</span>
            </div>
          )}

          {!syncStatus.isAvailable && !isError && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 shadow-2xs">
              <WifiOff size={14} className="text-amber-600 shrink-0" />
              <span>Modo Local</span>
            </div>
          )}

          {/* BOTÓN FORZAR PULL NUBE */}
          <button
            type="button"
            onClick={handleForcePull}
            disabled={isPulling || isTesting || isPushing}
            className="px-3.5 py-1.5 bg-purple-900 hover:bg-purple-950 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-2xs"
            title="Descarga y sincroniza todos los datos actualizados desde Cloud Firestore"
          >
            <CloudDownload size={14} className={isPulling ? "animate-bounce text-purple-200" : "text-purple-300"} />
            <span>{isPulling ? "Descargando..." : "Descargar Nube"}</span>
          </button>

          {/* BOTÓN SUBIR A NUBE (PUSH) */}
          <button
            type="button"
            onClick={handlePushAll}
            disabled={isPushing || isTesting || isPulling}
            className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-2xs"
            title="Sube todos los datos locales actuales (inventario, ventas, cuentas) a Cloud Firestore"
          >
            <CloudUpload size={14} className={isPushing ? "animate-bounce text-emerald-200" : "text-emerald-200"} />
            <span>{isPushing ? "Subiendo..." : "Subir a Nube"}</span>
          </button>

          {/* BOTÓN PROBAR PING */}
          <button
            type="button"
            onClick={handleRunPingTest}
            disabled={isTesting || isPulling || isPushing}
            className="px-3.5 py-1.5 bg-stone-900 hover:bg-black text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-2xs"
            title="Prueba de lectura y escritura en tiempo real con cálculo de latencia"
          >
            <Zap size={14} className={isTesting ? "animate-spin text-amber-400" : "text-amber-400"} />
            <span>{isTesting ? "Midiendo..." : "Probar Ping"}</span>
          </button>

          {/* BOTÓN COPIAR DIAGNÓSTICO */}
          <button
            type="button"
            onClick={handleCopyDiagnostic}
            className="px-3 py-1.5 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="Copia el informe técnico de diagnóstico completo al portapapeles"
          >
            {copiedDiag ? (
              <>
                <Check size={14} className="text-emerald-600" />
                <span className="text-emerald-700">¡Copiado!</span>
              </>
            ) : (
              <>
                <Copy size={14} className="text-gray-500" />
                <span>Copiar Informe</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* METADATOS DEL DISPOSITIVO Y ESTADO DE RED LOCAL */}
      <div className="bg-stone-50/80 rounded-xl border border-stone-200 p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5 text-stone-700">
            <Laptop size={14} className="text-purple-700" />
            <span className="font-semibold text-stone-500">Dispositivo ID:</span>
            <span className="font-mono font-bold bg-white px-2 py-0.5 rounded border border-stone-200 text-stone-800">
              {deviceInfo.deviceId}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-stone-700">
            <span className="font-semibold text-stone-500">Navegador:</span>
            <span className="font-medium text-stone-800">{deviceInfo.browser}</span>
          </div>

          <div className="flex items-center gap-1.5 text-stone-700">
            <span className="font-semibold text-stone-500">Resolución:</span>
            <span className="font-mono text-stone-600">{deviceInfo.screen}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${deviceInfo.online ? "bg-emerald-500" : "bg-rose-500"}`}></span>
            <span className="font-medium text-stone-600">
              Internet: {deviceInfo.online ? "Conectado" : "Sin Conexión"}
            </span>
          </div>

          <div className="text-[11px] text-stone-400 border-l border-stone-200 pl-3">
            ID Proyecto: <span className="font-mono text-stone-600">{deviceInfo.projectId}</span>
          </div>
        </div>
      </div>

      {/* TARJETAS DE MÉTRICAS RÁPIDAS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* MÉTRICA 1: ESTADO CONEXIÓN */}
        <div className="bg-stone-50 rounded-xl p-3.5 border border-stone-200 space-y-1">
          <div className="flex items-center justify-between text-stone-500 text-xs font-semibold">
            <span>Enlace Firestore</span>
            <Server size={15} className="text-purple-600" />
          </div>
          <div className="text-sm font-black text-stone-900">
            {syncStatus.isAvailable ? "Cloud Firestore Activo" : "Almacenamiento Local"}
          </div>
          <p className="text-[11px] text-stone-500 font-medium truncate" title={syncStatus.lastOperation}>
            {syncStatus.lastOperation || "En espera de eventos..."}
          </p>
        </div>

        {/* MÉTRICA 2: ÚLTIMA SINCRONIZACIÓN */}
        <div className="bg-stone-50 rounded-xl p-3.5 border border-stone-200 space-y-1">
          <div className="flex items-center justify-between text-stone-500 text-xs font-semibold">
            <span>Última Sincronización</span>
            <Clock size={15} className="text-emerald-600" />
          </div>
          <div className="text-sm font-black text-stone-900">
            {syncStatus.lastSyncTime ? syncStatus.lastSyncTime : "Sin datos aún"}
          </div>
          <p className="text-[11px] text-stone-500 font-medium">
            Zona Horaria Oficial Chile 🇨🇱
          </p>
        </div>

        {/* MÉTRICA 3: ESCRITURAS Y PERSISTENCIA */}
        <div className="bg-stone-50 rounded-xl p-3.5 border border-stone-200 space-y-1">
          <div className="flex items-center justify-between text-stone-500 text-xs font-semibold">
            <span>Confiabilidad & Escrituras</span>
            {syncStatus.writeErrors > 0 ? (
              <ShieldAlert size={15} className="text-rose-600" />
            ) : (
              <ShieldCheck size={15} className="text-emerald-600" />
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-sm font-black ${syncStatus.writeErrors > 0 ? "text-rose-700" : "text-emerald-700"}`}>
              {syncStatus.writeErrors === 0 ? "100% Sin Errores" : `${syncStatus.writeErrors} Error(es) de escritura`}
            </span>
          </div>
          <p className="text-[11px] text-stone-500 font-medium">
            Protección anti-sobrescritura activa
          </p>
        </div>

        {/* MÉTRICA 4: TOTAL DE DOCUMENTOS SINCRONIZADOS */}
        <div className="bg-stone-50 rounded-xl p-3.5 border border-stone-200 space-y-1">
          <div className="flex items-center justify-between text-stone-500 text-xs font-semibold">
            <span>Registros en Nube</span>
            <Database size={15} className="text-amber-600" />
          </div>
          <div className="text-sm font-black text-stone-900">
            {totalSyncedDocs} Documentos
          </div>
          <p className="text-[11px] text-stone-500 font-medium">
            {Object.keys(syncStatus.collections).length} Colecciones monitoreadas
          </p>
        </div>
      </div>

      {/* RESULTADO DE PING / DIAGNÓSTICO EN VIVO */}
      {testResult && (
        <div className={`p-4 rounded-xl border text-xs flex items-start gap-3.5 animate-in fade-in duration-200 ${
          testResult.success
            ? "bg-emerald-50/90 border-emerald-200 text-emerald-950"
            : "bg-rose-50/90 border-rose-200 text-rose-950"
        }`}>
          {testResult.success ? (
            <CheckCircle2 size={20} className="text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle size={20} className="text-rose-600 shrink-0 mt-0.5" />
          )}
          <div className="flex-1 space-y-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-extrabold text-sm">
                {testResult.success ? "✓ Prueba de Conexión y Ping Exitosa" : "⚠️ Error en la Prueba de Conexión"}
              </span>
              {testResult.success && testResult.latencyMs > 0 && (
                <span className={`px-2 py-0.5 rounded-md font-mono font-black text-[11px] border ${
                  testResult.latencyMs < 250
                    ? "bg-emerald-100 text-emerald-900 border-emerald-300"
                    : testResult.latencyMs < 600
                    ? "bg-amber-100 text-amber-900 border-amber-300"
                    : "bg-rose-100 text-rose-900 border-rose-300"
                }`}>
                  Latencia: {testResult.latencyMs} ms ({testResult.latencyMs < 250 ? "Excelente ⚡" : testResult.latencyMs < 600 ? "Normal" : "Lenta"})
                </span>
              )}
            </div>
            <p className="font-medium leading-relaxed">{testResult.message}</p>
          </div>
        </div>
      )}

      {syncStatus.lastErrorMessage && !testResult && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-3.5">
          <AlertCircle size={20} className="text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-extrabold text-sm block">Alerta de Sincronización / Red Detectada</span>
            <p className="font-medium leading-relaxed">{syncStatus.lastErrorMessage}</p>
            <p className="text-[11px] text-rose-700 italic">
              * Los datos permanecen protegidos y seguros en la memoria de este navegador. La sincronización se reintentará automáticamente tan pronto como la conexión se restablezca.
            </p>
          </div>
        </div>
      )}

      {/* VISTA DETALLADA POR COLECCIÓN EN TIEMPO REAL */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
              <Layers size={15} className="text-purple-700" />
              <span>Matriz de Colecciones en Tiempo Real ({Object.keys(syncStatus.collections).length})</span>
            </h4>
            <p className="text-[11px] text-gray-500">
              Estado de hidratación y marcas de tiempo por cada tabla de la base de datos
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setViewMode("cards")}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                viewMode === "cards" ? "bg-purple-100 text-purple-900" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Tarjetas
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                viewMode === "table" ? "bg-purple-100 text-purple-900" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Tabla Detallada
            </button>
          </div>
        </div>

        {viewMode === "cards" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {Object.entries(syncStatus.collections).map(([key, info]) => {
              const meta = COLLECTION_LABELS[key] || { label: key, icon: "📁", desc: "" };
              const isCollSynced = info.status === "synced";
              const isCollSyncing = info.status === "syncing";
              const isCollError = info.status === "error";

              return (
                <div
                  key={key}
                  className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between ${
                    isCollError
                      ? "bg-rose-50/80 border-rose-200"
                      : isCollSyncing
                      ? "bg-purple-50/80 border-purple-200"
                      : isCollSynced
                      ? "bg-white border-gray-200 hover:border-emerald-300 hover:shadow-2xs"
                      : "bg-gray-50 border-gray-200"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-2">
                      <span className="text-base">{meta.icon}</span>
                      <div className="flex items-center gap-1">
                        {isCollSynced && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            <CheckCircle2 size={11} className="text-emerald-600" /> Sincronizado
                          </span>
                        )}
                        {isCollSyncing && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                            <RefreshCw size={11} className="text-purple-600 animate-spin" /> Guardando...
                          </span>
                        )}
                        {isCollError && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                            <AlertCircle size={11} className="text-rose-600" /> Error
                          </span>
                        )}
                        {info.status === "offline" && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                            Offline
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-xs font-bold text-gray-900 truncate" title={meta.label}>
                      {meta.label}
                    </div>
                    <p className="text-[10px] text-gray-400 line-clamp-1 mt-0.5" title={meta.desc}>
                      {meta.desc}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500 mt-2.5 pt-2 border-t border-gray-100">
                    <span className="font-bold text-gray-800">
                      {info.docsCount} {info.docsCount === 1 ? "reg." : "regs."}
                    </span>
                    <span className="text-[10px] text-gray-400 font-mono">
                      {info.lastUpdated ? info.lastUpdated : "--:--"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-stone-50 text-stone-600 font-bold border-b border-gray-200">
                  <tr>
                    <th className="px-3.5 py-2.5">Colección</th>
                    <th className="px-3.5 py-2.5">Descripción</th>
                    <th className="px-3.5 py-2.5 text-center">Registros</th>
                    <th className="px-3.5 py-2.5 text-center">Estado Cloud</th>
                    <th className="px-3.5 py-2.5 text-right">Última Actualización</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {Object.entries(syncStatus.collections).map(([key, info]) => {
                    const meta = COLLECTION_LABELS[key] || { label: key, icon: "📁", desc: "" };
                    return (
                      <tr key={key} className="hover:bg-stone-50/60 transition-colors">
                        <td className="px-3.5 py-2.5 font-bold text-stone-900 whitespace-nowrap">
                          <span className="mr-2">{meta.icon}</span>
                          {meta.label}
                          <span className="ml-1.5 text-[10px] font-mono text-stone-400">({key})</span>
                        </td>
                        <td className="px-3.5 py-2.5 text-stone-500">{meta.desc}</td>
                        <td className="px-3.5 py-2.5 text-center font-mono font-bold text-stone-800">
                          {info.docsCount}
                        </td>
                        <td className="px-3.5 py-2.5 text-center whitespace-nowrap">
                          {info.status === "synced" && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              <CheckCircle2 size={12} className="text-emerald-600" /> Sincronizado
                            </span>
                          )}
                          {info.status === "syncing" && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                              <RefreshCw size={12} className="text-purple-600 animate-spin" /> Guardando...
                            </span>
                          )}
                          {info.status === "error" && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                              <AlertCircle size={12} className="text-rose-600" /> Error
                            </span>
                          )}
                          {info.status === "offline" && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-stone-600 bg-stone-100 px-2 py-0.5 rounded">
                              Offline
                            </span>
                          )}
                        </td>
                        <td className="px-3.5 py-2.5 text-right font-mono text-stone-500 whitespace-nowrap">
                          {info.lastUpdated || "Sin registros"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* STREAM EN VIVO DE EVENTOS DE SINCRONIZACIÓN */}
      <div className="border border-gray-200 rounded-xl overflow-hidden bg-stone-50">
        <div className="px-4 py-3 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Activity size={16} className="text-purple-700 shrink-0" />
            <div>
              <h4 className="text-xs font-bold text-stone-900">
                Historial de Eventos de Sincronización en Tiempo Real
              </h4>
              <p className="text-[10px] text-stone-500">
                Registro secuencial de lecturas, escrituras y respuestas del servidor
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-0.5 text-xs">
              {(["todos", "success", "error", "syncing", "info"] as const).map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setLogFilter(filter)}
                  className={`px-2 py-0.5 rounded-md font-bold capitalize transition-colors cursor-pointer text-[11px] ${
                    logFilter === filter
                      ? "bg-purple-900 text-white shadow-2xs"
                      : "text-stone-600 hover:bg-stone-100"
                  }`}
                >
                  {filter === "todos" ? "Todos" : filter === "success" ? "Éxito" : filter === "error" ? "Errores" : filter === "syncing" ? "Sync" : "Info"}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={clearSyncLogs}
              className="p-1 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
              title="Limpiar registro de eventos"
            >
              <Trash2 size={15} />
            </button>

            <button
              type="button"
              onClick={() => setShowLogs(!showLogs)}
              className="p-1 text-stone-500 hover:text-stone-800 rounded-lg cursor-pointer"
              title={showLogs ? "Minimizar registros" : "Expandir registros"}
            >
              {showLogs ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
        </div>

        {showLogs && (
          <div className="p-3 bg-white max-h-64 overflow-y-auto space-y-1 font-mono text-[11px]">
            {filteredLogs.length === 0 ? (
              <p className="text-gray-400 italic text-center py-6">
                No hay eventos registrados bajo el filtro seleccionado.
              </p>
            ) : (
              filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-2.5 py-1.5 px-2 rounded hover:bg-stone-50 transition-colors border-b border-gray-50 last:border-0"
                >
                  <span className="text-gray-400 shrink-0 font-bold">{log.timestamp}</span>
                  <span className="shrink-0">
                    {log.type === "success" && (
                      <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-black border border-emerald-200 text-[10px]">
                        ✓ ÉXITO
                      </span>
                    )}
                    {log.type === "syncing" && (
                      <span className="text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded font-black border border-purple-200 text-[10px]">
                        🔄 SYNC
                      </span>
                    )}
                    {log.type === "error" && (
                      <span className="text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded font-black border border-rose-200 text-[10px]">
                        ⚠️ ERROR
                      </span>
                    )}
                    {log.type === "info" && (
                      <span className="text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded font-black border border-sky-200 text-[10px]">
                        ℹ INFO
                      </span>
                    )}
                  </span>
                  <span className="font-bold text-stone-800 shrink-0 uppercase text-[10px] bg-stone-100 px-1.5 py-0.5 rounded border border-stone-200">
                    [{log.collection}]
                  </span>
                  <span className="text-stone-700 flex-1 leading-snug">{log.message}</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* GUÍA DE DIAGNÓSTICO Y BUENAS PRÁCTICAS MULTI-DISPOSITIVO */}
      <div className="bg-gradient-to-r from-purple-50 via-stone-50 to-amber-50 rounded-xl p-4 border border-purple-100 flex items-start gap-3 text-xs">
        <HelpCircle size={18} className="text-purple-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold text-purple-950 block">
            Guía de Diagnóstico Multi-Dispositivo (Teléfonos, Tablets y Computadores):
          </span>
          <p className="text-purple-900 leading-relaxed">
            • <strong>Primer ingreso en un dispositivo nuevo:</strong> Al abrir el sistema en otro equipo, Cloud Firestore descargará automáticamente la versión más reciente del inventario y ventas. Si deseas forzar una actualización instantánea, utiliza el botón <span className="font-bold">"Sincronizar Nube"</span>.
          </p>
          <p className="text-purple-900 leading-relaxed">
            • <strong>Trabajo sin Internet (Offline):</strong> Las ventas e inventarios se guardan localmente de forma inmediata y se sincronizarán con la nube apenas se restablezca la conexión de red.
          </p>
        </div>
      </div>
    </div>
  );
};
