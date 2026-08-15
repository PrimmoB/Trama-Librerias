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
  CloudDownload
} from "lucide-react";
import {
  subscribeFirebaseSyncStatus,
  getFirebaseSyncStatus,
  testFirebaseConnection,
  forceSyncFromCloud,
  FirebaseSyncStatus,
  FirebaseSyncLogEntry
} from "../lib/firebase";

const COLLECTION_LABELS: Record<string, { label: string; icon: string }> = {
  books: { label: "Inventario de Libros", icon: "📚" },
  ventas: { label: "Ventas y Transacciones", icon: "🛒" },
  proveedores: { label: "Proveedores y Cuentas", icon: "🏢" },
  librerias: { label: "Red de Librerías Trama", icon: "📍" },
  accesos: { label: "Usuarios y Accesos", icon: "👥" },
  movimientos: { label: "Kardex de Movimientos", icon: "📦" },
  gastos: { label: "Gastos Operativos", icon: "💸" },
  otrosIngresos: { label: "Otros Ingresos", icon: "💰" },
  auditLogs: { label: "Auditoría de Seguridad", icon: "🛡️" },
  infoEmpresa: { label: "Datos Corporativos Trama", icon: "⚙️" },
  cierresCaja: { label: "Arqueos y Cierres de Caja", icon: "🔒" },
  liquidaciones: { label: "Liquidaciones Consignación", icon: "📑" },
  aperturaActiva: { label: "Estado Sesión Caja Activa", icon: "🟢" },
};

export const FirebaseSyncPanel: React.FC = () => {
  const [syncStatus, setSyncStatus] = useState<FirebaseSyncStatus>(getFirebaseSyncStatus());
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; latencyMs: number; message: string } | null>(null);
  const [showLogs, setShowLogs] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeFirebaseSyncStatus((newStatus) => {
      setSyncStatus(newStatus);
    });
    return () => unsubscribe();
  }, []);

  const [isPulling, setIsPulling] = useState(false);

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

  const isConnected = syncStatus.status === "connected";
  const isSyncing = syncStatus.status === "syncing";
  const isError = syncStatus.status === "error" || syncStatus.writeErrors > 0;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-2xs space-y-5 animate-in fade-in duration-200">
      {/* CABECERA PRINCIPAL */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl ${
            isError
              ? "bg-rose-100 text-rose-700 border border-rose-200"
              : isSyncing
              ? "bg-purple-100 text-purple-700 border border-purple-200"
              : isConnected
              ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
              : "bg-amber-100 text-amber-700 border border-amber-200"
          }`}>
            {isError ? (
              <AlertTriangle size={22} className="animate-bounce" />
            ) : isSyncing ? (
              <RefreshCw size={22} className="animate-spin" />
            ) : isConnected ? (
              <Wifi size={22} />
            ) : (
              <WifiOff size={22} />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-gray-900">
                Estado de Sincronización en Tiempo Real
              </h3>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-purple-100 text-purple-900 border border-purple-200">
                Firebase Cloud
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Monitoreo activo de conexiones de red, escrituras en la nube y persistencia de datos.
            </p>
          </div>
        </div>

        {/* BADGE GLOBAL DE ESTADO */}
        <div className="flex items-center gap-2">
          {isConnected && !isError && (
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-black bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
              <span>Conexión Exitosa (En Línea)</span>
            </div>
          )}

          {isSyncing && (
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-black bg-purple-50 text-purple-800 border border-purple-200 shadow-2xs">
              <RefreshCw size={15} className="text-purple-600 animate-spin shrink-0" />
              <span>Sincronizando Cambios...</span>
            </div>
          )}

          {isError && (
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-black bg-rose-50 text-rose-800 border border-rose-200 shadow-2xs">
              <AlertTriangle size={15} className="text-rose-600 shrink-0" />
              <span>Error de Escritura / Red</span>
            </div>
          )}

          {!syncStatus.isAvailable && !isError && (
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-black bg-amber-50 text-amber-800 border border-amber-200 shadow-2xs">
              <WifiOff size={15} className="text-amber-600 shrink-0" />
              <span>Modo Local (Offline)</span>
            </div>
          )}

          <button
            type="button"
            onClick={handleForcePull}
            disabled={isPulling || isTesting}
            className="px-3.5 py-1.5 bg-purple-900 hover:bg-purple-950 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-2xs"
            title="Descarga y sincroniza todos los datos actualizados desde Cloud Firestore"
          >
            <CloudDownload size={14} className={isPulling ? "animate-bounce text-purple-200" : "text-purple-300"} />
            <span>{isPulling ? "Sincronizando..." : "Sincronizar Nube"}</span>
          </button>

          <button
            type="button"
            onClick={handleRunPingTest}
            disabled={isTesting || isPulling}
            className="px-3.5 py-1.5 bg-stone-900 hover:bg-black text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-2xs"
          >
            <Zap size={14} className={isTesting ? "animate-spin text-amber-400" : "text-amber-400"} />
            <span>{isTesting ? "Probando..." : "Probar Ping"}</span>
          </button>
        </div>
      </div>

      {/* TARJETAS DE MÉTRICAS RÁPIDAS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* MÉTRICA 1: ESTADO CONEXIÓN */}
        <div className="bg-stone-50 rounded-xl p-3.5 border border-stone-200 space-y-1">
          <div className="flex items-center justify-between text-stone-500 text-xs font-semibold">
            <span>Estado Servidor</span>
            <Server size={15} className="text-purple-600" />
          </div>
          <div className="text-sm font-black text-stone-900">
            {syncStatus.isAvailable ? "Firestore Conectado" : "Almacenamiento Local"}
          </div>
          <p className="text-[11px] text-stone-500 font-medium truncate">
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
            {syncStatus.lastSyncTime ? syncStatus.lastSyncTime : "Sin datos aun"}
          </div>
          <p className="text-[11px] text-stone-500 font-medium">
            Zona Horaria Chile 🇨🇱
          </p>
        </div>

        {/* MÉTRICA 3: ESCRITURAS Y PERSISTENCIA */}
        <div className="bg-stone-50 rounded-xl p-3.5 border border-stone-200 space-y-1">
          <div className="flex items-center justify-between text-stone-500 text-xs font-semibold">
            <span>Persistencia & Escrituras</span>
            {syncStatus.writeErrors > 0 ? (
              <ShieldAlert size={15} className="text-rose-600" />
            ) : (
              <ShieldCheck size={15} className="text-emerald-600" />
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-sm font-black ${syncStatus.writeErrors > 0 ? "text-rose-700" : "text-emerald-700"}`}>
              {syncStatus.writeErrors === 0 ? "100% Correcta" : `${syncStatus.writeErrors} Error(es)`}
            </span>
          </div>
          <p className="text-[11px] text-stone-500 font-medium">
            Respaldo automático en LocalStorage
          </p>
        </div>

        {/* MÉTRICA 4: COLECCIONES ACTIVAS */}
        <div className="bg-stone-50 rounded-xl p-3.5 border border-stone-200 space-y-1">
          <div className="flex items-center justify-between text-stone-500 text-xs font-semibold">
            <span>Colecciones en Nube</span>
            <Database size={15} className="text-amber-600" />
          </div>
          <div className="text-sm font-black text-stone-900">
            {Object.keys(syncStatus.collections).length} Tablas Monitoreadas
          </div>
          <p className="text-[11px] text-stone-500 font-medium">
            Sincronización en tiempo real
          </p>
        </div>
      </div>

      {/* BANNER RESULTADO DE PING / ALERTA DE ERROR */}
      {testResult && (
        <div className={`p-3.5 rounded-xl border text-xs flex items-start gap-3 animate-in fade-in duration-200 ${
          testResult.success
            ? "bg-emerald-50 border-emerald-200 text-emerald-900"
            : "bg-rose-50 border-rose-200 text-rose-900"
        }`}>
          {testResult.success ? (
            <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle size={18} className="text-rose-600 shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <span className="font-extrabold block">
              {testResult.success ? "✓ Prueba de Conexión y Ping Exitosa" : "⚠️ Error en la Prueba de Conexión"}
            </span>
            <p className="mt-0.5 font-medium">{testResult.message}</p>
          </div>
        </div>
      )}

      {syncStatus.lastErrorMessage && !testResult && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-3">
          <AlertCircle size={18} className="text-rose-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-extrabold block">Alerta de Escritura / Sincronización</span>
            <p className="mt-0.5 font-medium">{syncStatus.lastErrorMessage}</p>
            <p className="text-[11px] text-rose-700 mt-1 italic">
              * Nota: Los datos están seguros y guardados en tu navegador (LocalStorage). Al restablecerse la red se reintentará la sincronización.
            </p>
          </div>
        </div>
      )}

      {/* DETALLE POR COLECCIÓN EN TIEMPO REAL */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center justify-between">
          <span>Estado por Colección de Datos</span>
          <span className="text-[11px] text-gray-400 font-normal normal-case">
            Actualización automática
          </span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {Object.entries(syncStatus.collections).map(([key, info]) => {
            const meta = COLLECTION_LABELS[key] || { label: key, icon: "📁" };
            const isCollSynced = info.status === "synced";
            const isCollSyncing = info.status === "syncing";
            const isCollError = info.status === "error";

            return (
              <div
                key={key}
                className={`p-3 rounded-xl border transition-all ${
                  isCollError
                    ? "bg-rose-50/80 border-rose-200"
                    : isCollSyncing
                    ? "bg-purple-50/80 border-purple-200"
                    : isCollSynced
                    ? "bg-white border-gray-200 hover:border-emerald-300 shadow-2xs"
                    : "bg-gray-50 border-gray-200"
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <span className="text-sm">{meta.icon}</span>
                  <div className="flex items-center gap-1">
                    {isCollSynced && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-200">
                        <CheckCircle2 size={11} className="text-emerald-600" /> Sincronizado
                      </span>
                    )}
                    {isCollSyncing && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded border border-purple-200">
                        <RefreshCw size={11} className="text-purple-600 animate-spin" /> Guardando...
                      </span>
                    )}
                    {isCollError && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded border border-rose-200">
                        <AlertCircle size={11} className="text-rose-600" /> Error
                      </span>
                    )}
                    {info.status === "offline" && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded">
                        Offline
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-xs font-bold text-gray-900 truncate" title={meta.label}>
                  {meta.label}
                </div>

                <div className="flex items-center justify-between text-[11px] text-gray-500 mt-1 pt-1 border-t border-gray-100">
                  <span className="font-semibold text-gray-700">
                    {info.docsCount} {info.docsCount === 1 ? "reg." : "regs."}
                  </span>
                  <span className="text-[10px] text-gray-400">
                    {info.lastUpdated ? info.lastUpdated : "--:--"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ACCORDEÓN HISTORIAL DE EVENTOS DE SINCRONIZACIÓN */}
      <div className="border border-gray-200 rounded-xl overflow-hidden bg-stone-50">
        <button
          type="button"
          onClick={() => setShowLogs(!showLogs)}
          className="w-full px-4 py-2.5 flex items-center justify-between text-xs font-bold text-stone-800 hover:bg-stone-100 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Activity size={15} className="text-purple-600" />
            <span>Historial de Eventos de Sincronización en Tiempo Real ({syncStatus.logs.length})</span>
          </div>
          <div className="flex items-center gap-1 text-purple-700 text-[11px] font-extrabold">
            <span>{showLogs ? "Ocultar Registros" : "Ver Registros Live"}</span>
            {showLogs ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </button>

        {showLogs && (
          <div className="p-3 bg-white border-t border-gray-200 max-h-60 overflow-y-auto space-y-1 font-mono text-[11px]">
            {syncStatus.logs.length === 0 ? (
              <p className="text-gray-400 italic text-center py-4">No hay eventos registrados en la sesión activa.</p>
            ) : (
              syncStatus.logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-2.5 py-1.5 px-2 rounded hover:bg-stone-50 transition-colors border-b border-gray-50 last:border-0"
                >
                  <span className="text-gray-400 shrink-0 font-bold">{log.timestamp}</span>
                  <span className="shrink-0">
                    {log.type === "success" && <span className="text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded font-black border border-emerald-200">✓ ÉXITO</span>}
                    {log.type === "syncing" && <span className="text-purple-700 bg-purple-50 px-1 py-0.5 rounded font-black border border-purple-200">🔄 SYNC</span>}
                    {log.type === "error" && <span className="text-rose-700 bg-rose-50 px-1 py-0.5 rounded font-black border border-rose-200">⚠️ ERROR</span>}
                    {log.type === "info" && <span className="text-sky-700 bg-sky-50 px-1 py-0.5 rounded font-black border border-sky-200">ℹ INFO</span>}
                  </span>
                  <span className="font-bold text-stone-800 shrink-0 uppercase text-[10px] bg-stone-100 px-1 py-0.5 rounded border border-stone-200">
                    [{log.collection}]
                  </span>
                  <span className="text-stone-700 truncate">{log.message}</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
