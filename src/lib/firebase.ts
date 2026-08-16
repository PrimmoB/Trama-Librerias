import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import {
  getFirestore,
  initializeFirestore,
  collection,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
  writeBatch,
  getDocs,
  getDocFromServer,
  Firestore,
  Unsubscribe,
} from "firebase/firestore";
import defaultFirebaseConfig from "../../firebase-applet-config.json";
import { normalizeLibreriasList } from "../data/initialData";

// Mapeo de colecciones a claves de almacenamiento local
export const storageKeyMap: Record<string, string> = {
  books: "trama_books",
  ventas: "trama_ventas",
  proveedores: "trama_proveedores",
  librerias: "trama_librerias_data",
  accesos: "trama_accesos",
  movimientos: "trama_movimientos",
  gastos: "trama_gastos",
  otrosIngresos: "trama_otros_ingresos",
  auditLogs: "trama_audit_logs",
  infoEmpresa: "trama_info_data",
  cierresCaja: "trama_cierres_caja",
  liquidaciones: "trama_liquidaciones",
  aperturaActiva: "trama_apertura_activa",
};

export interface FirebaseSyncCollectionInfo {
  status: "synced" | "syncing" | "error" | "offline";
  docsCount: number;
  lastUpdated?: string;
  errorMessage?: string;
}

export interface FirebaseSyncLogEntry {
  id: string;
  timestamp: string;
  type: "success" | "syncing" | "error" | "info";
  collection: string;
  message: string;
}

export interface FirebaseSyncStatus {
  isAvailable: boolean;
  status: "connected" | "syncing" | "offline" | "error";
  lastSyncTime: string | null;
  lastOperation: string;
  writeErrors: number;
  readErrors: number;
  lastErrorMessage: string | null;
  collections: Record<string, FirebaseSyncCollectionInfo>;
  logs: FirebaseSyncLogEntry[];
}

const firebaseConfig = {
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || defaultFirebaseConfig.projectId || "single-crow-5f6jr",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || defaultFirebaseConfig.appId || "1:683975518409:web:30270491b492359ea8c518",
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || defaultFirebaseConfig.apiKey || "AIzaSyD-GMtP158C06gow_jRcVvNDVPltWtPucM",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || defaultFirebaseConfig.authDomain || "single-crow-5f6jr.firebaseapp.com",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || defaultFirebaseConfig.storageBucket || "single-crow-5f6jr.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || defaultFirebaseConfig.messagingSenderId || "683975518409",
};

let app: FirebaseApp | null = null;
export let db: Firestore | null = null;
export let isFirebaseAvailable = false;

// Estado global de sincronización
const syncStatusState: FirebaseSyncStatus = {
  isAvailable: false,
  status: "offline",
  lastSyncTime: null,
  lastOperation: "Iniciando enlace con Cloud Firestore...",
  writeErrors: 0,
  readErrors: 0,
  lastErrorMessage: null,
  collections: {
    books: { status: "offline", docsCount: 0 },
    ventas: { status: "offline", docsCount: 0 },
    proveedores: { status: "offline", docsCount: 0 },
    librerias: { status: "offline", docsCount: 0 },
    accesos: { status: "offline", docsCount: 0 },
    movimientos: { status: "offline", docsCount: 0 },
    gastos: { status: "offline", docsCount: 0 },
    otrosIngresos: { status: "offline", docsCount: 0 },
    auditLogs: { status: "offline", docsCount: 0 },
    infoEmpresa: { status: "offline", docsCount: 0 },
    cierresCaja: { status: "offline", docsCount: 0 },
    liquidaciones: { status: "offline", docsCount: 0 },
    aperturaActiva: { status: "offline", docsCount: 0 },
  },
  logs: [],
};

const syncStatusListeners = new Set<(status: FirebaseSyncStatus) => void>();

export function clearSyncLogs() {
  syncStatusState.logs = [];
  const snapshot = getFirebaseSyncStatus();
  syncStatusListeners.forEach(cb => cb(snapshot));
}

export function getDeviceDiagnosticInfo() {
  if (typeof window === "undefined") {
    return {
      deviceId: "servidor",
      browser: "Node.js",
      online: true,
      screen: "N/A",
      projectId: firebaseConfig.projectId,
      appId: firebaseConfig.appId,
    };
  }

  let devId = localStorage.getItem("trama_device_id");
  if (!devId) {
    devId = `DEV-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    try {
      localStorage.setItem("trama_device_id", devId);
    } catch {}
  }

  const ua = navigator.userAgent;
  let browser = "Navegador Web";
  if (ua.includes("Chrome") && !ua.includes("Edg")) browser = "Google Chrome";
  else if (ua.includes("Safari") && !ua.includes("Chrome")) browser = "Apple Safari";
  else if (ua.includes("Firefox")) browser = "Mozilla Firefox";
  else if (ua.includes("Edg")) browser = "Microsoft Edge";

  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);

  return {
    deviceId: devId,
    browser: `${browser} (${isMobile ? "Móvil / Tablet" : "Escritorio / PC"})`,
    online: navigator.onLine,
    screen: `${window.innerWidth}x${window.innerHeight}px`,
    projectId: firebaseConfig.projectId,
    appId: firebaseConfig.appId,
  };
}

export function subscribeFirebaseSyncStatus(callback: (status: FirebaseSyncStatus) => void): () => void {
  syncStatusListeners.add(callback);
  callback(getFirebaseSyncStatus());
  return () => {
    syncStatusListeners.delete(callback);
  };
}

export function getFirebaseSyncStatus(): FirebaseSyncStatus {
  return {
    ...syncStatusState,
    collections: { ...syncStatusState.collections },
    logs: [...syncStatusState.logs],
  };
}

function updateSyncStatus(updater: (prev: FirebaseSyncStatus) => void) {
  updater(syncStatusState);
  const snapshot = getFirebaseSyncStatus();
  syncStatusListeners.forEach(cb => cb(snapshot));
}

function addSyncLog(type: "success" | "syncing" | "error" | "info", collectionName: string, message: string) {
  const timeZoneStr = new Date().toLocaleTimeString("es-CL", { timeZone: "America/Santiago" });
  const entry: FirebaseSyncLogEntry = {
    id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: timeZoneStr,
    type,
    collection: collectionName,
    message,
  };
  syncStatusState.logs = [entry, ...syncStatusState.logs].slice(0, 50);
}

// Banderas de control multi-dispositivo y prevención de loops
const isCollectionHydrated: Record<string, boolean> = {};
const lastDataSignatures: Record<string, string> = {};
const pendingDebounceTimers: Record<string, any> = {};

// Callbacks registrados para sincronización forzada bajo demanda
const registeredCollectionUpdaters: Record<string, (data: any[]) => void> = {};

// Canal de comunicación en tiempo real inter-pestañas / inter-ventanas del mismo navegador
let syncBroadcastChannel: BroadcastChannel | null = null;
const localDeviceId = typeof window !== "undefined" ? (localStorage.getItem("trama_device_id") || "local") : "node";

try {
  if (typeof window !== "undefined" && typeof BroadcastChannel !== "undefined") {
    syncBroadcastChannel = new BroadcastChannel("trama_realtime_sync_bus");
    syncBroadcastChannel.onmessage = (event) => {
      try {
        const { collectionName, data, senderDeviceId } = event.data || {};
        if (senderDeviceId === localDeviceId) return; // Evitar eco de la misma pestaña
        if (collectionName && Array.isArray(data) && registeredCollectionUpdaters[collectionName]) {
          const localKey = storageKeyMap[collectionName] || collectionName;
          try {
            localStorage.setItem(localKey, JSON.stringify(data));
          } catch {}
          lastDataSignatures[collectionName] = calculateFingerprint(data);
          registeredCollectionUpdaters[collectionName](data);
        }
      } catch {}
    };
  }
} catch {}

/**
 * Sanitiza recursivamente objetos eliminando propiedades 'undefined' o funciones para Firestore
 */
export function sanitizeForFirestore<T>(data: T): T {
  if (data === undefined || data === null) return data;
  try {
    const jsonStr = JSON.stringify(data, (key, value) => {
      if (value === undefined) return null;
      return value;
    });
    return JSON.parse(jsonStr);
  } catch {
    return data;
  }
}

/**
 * Convierte cualquier identificador en un ID válido para Firestore (sin barras ni caracteres inválidos)
 */
export function toSafeDocId(id: any): string {
  if (id === null || id === undefined || String(id).trim() === "") {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  }
  return String(id).replace(/[\/\\]/g, "-").replace(/\s+/g, "_").trim();
}

/**
 * Calcula una firma hash estable para comparar cambios reales
 */
export function calculateFingerprint(data: any): string {
  try {
    if (data === null || data === undefined) return "";
    return JSON.stringify(data);
  } catch {
    return "";
  }
}

// Inicialización de Firestore con ignoreUndefinedProperties y detección automática de long-polling para entornos con proxies/iframes
try {
  if (typeof window !== "undefined") {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    const dbId =
      import.meta.env.VITE_FIREBASE_DATABASE_ID ||
      (defaultFirebaseConfig as any)?.firestoreDatabaseId ||
      (defaultFirebaseConfig as any)?.databaseId;

    const firestoreSettings = {
      ignoreUndefinedProperties: true,
      experimentalAutoDetectLongPolling: true,
    };

    if (dbId) {
      try {
        db = initializeFirestore(app, firestoreSettings, dbId);
      } catch {
        db = getFirestore(app, dbId);
      }
    } else {
      try {
        db = initializeFirestore(app, firestoreSettings);
      } catch {
        db = getFirestore(app);
      }
    }

    if (db) {
      isFirebaseAvailable = true;
      syncStatusState.isAvailable = true;
      syncStatusState.status = "connected";
      syncStatusState.lastSyncTime = new Date().toLocaleTimeString("es-CL", { timeZone: "America/Santiago" });
      syncStatusState.lastOperation = `Conectado a Firestore Cloud (${dbId || "default"})`;
      addSyncLog("info", "sistema", `Conexión a Firebase Cloud Firestore activa en tiempo real.`);
    }
  }
} catch (err: any) {
  console.warn("[Firebase] Error en inicialización de Firestore:", err);
  db = null;
  isFirebaseAvailable = false;
  syncStatusState.isAvailable = false;
  syncStatusState.status = "error";
  syncStatusState.lastErrorMessage = err?.message || String(err);
  addSyncLog("error", "sistema", `Error al inicializar Firebase: ${syncStatusState.lastErrorMessage}`);
}

/**
 * Test de diagnóstico en tiempo real (ping)
 */
export async function testFirebaseConnection(): Promise<{ success: boolean; latencyMs: number; message: string }> {
  const startTime = Date.now();
  if (!db || !isFirebaseAvailable) {
    updateSyncStatus(s => {
      s.status = "offline";
      s.lastErrorMessage = "Firebase no disponible o sin conexión";
    });
    return { success: false, latencyMs: 0, message: "Firebase no está inicializado o no hay conexión." };
  }

  try {
    updateSyncStatus(s => {
      s.status = "syncing";
      s.lastOperation = "Probando sincronización en tiempo real (Ping Firestore)...";
    });

    const testDocRef = doc(db, "_sync_test", "ping");
    const timestamp = new Date().toISOString();
    await setDoc(testDocRef, { ping: true, timestamp, app: "Trama Librerías", updatedAt: Date.now() }, { merge: true });

    const latencyMs = Date.now() - startTime;
    const timeStr = new Date().toLocaleTimeString("es-CL", { timeZone: "America/Santiago" });

    updateSyncStatus(s => {
      s.status = "connected";
      s.lastSyncTime = timeStr;
      s.lastOperation = `Ping en tiempo real exitoso (${latencyMs} ms)`;
      s.lastErrorMessage = null;
    });

    addSyncLog("success", "ping", `Lectura y escritura en la nube confirmadas (${latencyMs} ms).`);

    return {
      success: true,
      latencyMs,
      message: `Conexión activa con Cloud Firestore. Latencia: ${latencyMs} ms.`
    };
  } catch (err: any) {
    const latencyMs = Date.now() - startTime;
    const errMsg = err?.message || String(err);

    updateSyncStatus(s => {
      s.status = "error";
      s.writeErrors += 1;
      s.lastErrorMessage = errMsg;
    });

    addSyncLog("error", "ping", `Error en prueba de conexión: ${errMsg}`);

    return {
      success: false,
      latencyMs,
      message: `Error de respuesta en Firestore: ${errMsg}`
    };
  }
}

/**
 * Forzar lectura inmediata de todas las colecciones desde Firestore a la memoria local (PULL)
 */
export async function forceSyncFromCloud(): Promise<{ success: boolean; message: string }> {
  if (!db || !isFirebaseAvailable) {
    return { success: false, message: "Firebase no está disponible o no hay conexión." };
  }

  try {
    updateSyncStatus(s => {
      s.status = "syncing";
      s.lastOperation = "Descargando estado actualizado desde Cloud Firestore...";
    });

    const collectionsToFetch = Object.keys(storageKeyMap).filter(k => k !== "infoEmpresa" && k !== "aperturaActiva");

    for (const colName of collectionsToFetch) {
      const colRef = collection(db, colName);
      const snap = await getDocs(colRef);
      const items: any[] = [];

      snap.forEach(d => {
        const raw = d.data();
        const docId = d.id;
        const numId = Number(docId);
        const item = {
          ...raw,
          id: raw?.id != null ? raw.id : (!isNaN(numId) ? numId : docId),
        };
        items.push(item);
      });

      // Ordenar por updatedAt o id si es aplicable
      if (colName === "books" || colName === "ventas" || colName === "movimientos" || colName === "auditLogs") {
        items.sort((a: any, b: any) => (Number(b.updatedAt || b.id || 0) - Number(a.updatedAt || a.id || 0)));
      }

      lastDataSignatures[colName] = calculateFingerprint(items);
      isCollectionHydrated[colName] = true;

      const localKey = storageKeyMap[colName] || colName;
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(localKey, JSON.stringify(items));
        } catch {}
      }

      if (registeredCollectionUpdaters[colName]) {
        registeredCollectionUpdaters[colName](items);
      }

      updateSyncStatus(s => {
        if (s.collections[colName]) {
          s.collections[colName].status = "synced";
          s.collections[colName].docsCount = items.length;
        }
      });
    }

    const timeStr = new Date().toLocaleTimeString("es-CL", { timeZone: "America/Santiago" });
    updateSyncStatus(s => {
      s.status = "connected";
      s.lastSyncTime = timeStr;
      s.lastOperation = "Sincronización completada con éxito";
    });

    addSyncLog("success", "sistema", "Todas las colecciones fueron sincronizadas desde la nube.");
    return { success: true, message: "Datos actualizados correctamente desde Cloud Firestore." };
  } catch (err: any) {
    const errMsg = err?.message || String(err);
    updateSyncStatus(s => {
      s.status = "error";
      s.lastErrorMessage = errMsg;
    });
    addSyncLog("error", "sistema", `Error al sincronizar: ${errMsg}`);
    return { success: false, message: `Error al sincronizar: ${errMsg}` };
  }
}

/**
 * Subir todos los datos locales actuales a Cloud Firestore (PUSH / Sembrar / Reemplazar)
 */
export async function pushAllLocalToCloud(): Promise<{ success: boolean; message: string }> {
  if (!db || !isFirebaseAvailable) {
    return { success: false, message: "Firebase no está disponible o no hay conexión." };
  }

  try {
    updateSyncStatus(s => {
      s.status = "syncing";
      s.lastOperation = "Subiendo datos locales a Cloud Firestore...";
    });

    let totalUploaded = 0;

    for (const [colName, localKey] of Object.entries(storageKeyMap)) {
      if (colName === "infoEmpresa") {
        const rawInfo = localStorage.getItem("trama_info_data");
        if (rawInfo) {
          try {
            const info = JSON.parse(rawInfo);
            await setDoc(doc(db, "infoEmpresa", "general"), sanitizeForFirestore(info), { merge: true });
            totalUploaded += 1;
          } catch {}
        }
        continue;
      }

      if (colName === "aperturaActiva") {
        const rawAp = localStorage.getItem("trama_apertura_activa");
        if (rawAp) {
          try {
            const ap = JSON.parse(rawAp);
            if (ap) {
              await setDoc(doc(db, "aperturaActiva", "actual"), sanitizeForFirestore(ap), { merge: true });
              totalUploaded += 1;
            }
          } catch {}
        }
        continue;
      }

      const raw = localStorage.getItem(localKey);
      if (raw) {
        try {
          const items = JSON.parse(raw);
          if (Array.isArray(items)) {
            await saveEntireCollection(colName, items);
            totalUploaded += items.length;
          }
        } catch {}
      }
    }

    const timeStr = new Date().toLocaleTimeString("es-CL", { timeZone: "America/Santiago" });
    updateSyncStatus(s => {
      s.status = "connected";
      s.lastSyncTime = timeStr;
      s.lastOperation = `Subida completada (${totalUploaded} registros)`;
    });

    addSyncLog("success", "sistema", `Subida completa a Firestore finalizada (${totalUploaded} registros).`);
    return { success: true, message: `Se subieron ${totalUploaded} registros a Cloud Firestore con éxito.` };
  } catch (err: any) {
    const errMsg = err?.message || String(err);
    updateSyncStatus(s => {
      s.status = "error";
      s.lastErrorMessage = errMsg;
    });
    return { success: false, message: `Error al subir datos: ${errMsg}` };
  }
}

/**
 * Suscribe una colección a Firestore con sincronización bidireccional inmediata
 */
export function syncCollection<T extends { id: string | number; updatedAt?: number }>(
  collectionName: string,
  onUpdate: (data: T[]) => void,
  initialData: T[] = []
): Unsubscribe {
  const localKey = storageKeyMap[collectionName] || collectionName;
  registeredCollectionUpdaters[collectionName] = onUpdate;

  if (!db || !isFirebaseAvailable) {
    updateSyncStatus(s => {
      if (s.collections[collectionName]) {
        s.collections[collectionName].status = "offline";
      }
    });
    return () => {};
  }

  try {
    const colRef = collection(db, collectionName);

    const unsubscribe = onSnapshot(
      colRef,
      async (snapshot) => {
        try {
          const timeStr = new Date().toLocaleTimeString("es-CL", { timeZone: "America/Santiago" });
          const remoteItems: T[] = [];

          snapshot.forEach((docSnap) => {
            const raw = docSnap.data();
            const docId = docSnap.id;
            const numId = Number(docId);
            const item = {
              ...raw,
              id: raw?.id != null ? raw.id : (!isNaN(numId) ? numId : docId),
            } as T;

            remoteItems.push(item);
          });

          // Ordenar elementos para consistencia multi-dispositivo
          if (collectionName === "books" || collectionName === "ventas" || collectionName === "movimientos" || collectionName === "auditLogs") {
            remoteItems.sort((a: any, b: any) => (Number(b.updatedAt || b.id || 0) - Number(a.updatedAt || a.id || 0)));
          }

          let finalItems: T[] = remoteItems;
          const isFirstHydration = !isCollectionHydrated[collectionName];

          if (isFirstHydration) {
            let localExisting: T[] = [];
            if (typeof window !== "undefined") {
              try {
                const rawLocal = localStorage.getItem(localKey);
                if (rawLocal) {
                  const parsed = JSON.parse(rawLocal);
                  if (Array.isArray(parsed) && parsed.length > 0) {
                    localExisting = parsed;
                  }
                }
              } catch {}
            }

            if (localExisting.length === 0 && initialData.length > 0) {
              localExisting = initialData;
            }

            if (remoteItems.length > 0) {
              // Si Firestore ya contiene registros, la nube es la fuente autoritativa de verdad.
              // Aceptamos los datos de la nube sin resucitar borradores viejos del localStorage local.
              finalItems = remoteItems;
              isCollectionHydrated[collectionName] = true;
            } else if (localExisting.length > 0) {
              // Si la nube está completamente VACÍA para esta colección, la sembramos con el estado local/inicial.
              finalItems = localExisting;
              isCollectionHydrated[collectionName] = true;
              saveEntireCollection(collectionName, finalItems);
            } else {
              isCollectionHydrated[collectionName] = true;
              finalItems = remoteItems;
            }
          } else {
            // Actualizaciones subsecuentes en tiempo real
            isCollectionHydrated[collectionName] = true;
            finalItems = remoteItems;
          }

          // Si es librerías, asegurar lista normalizada antes de calcular firma y notificar
          if (collectionName === "librerias") {
            finalItems = normalizeLibreriasList(finalItems as any) as any;
          }

          // Guardar en almacenamiento local para acceso offline instantáneo
          if (typeof window !== "undefined") {
            try {
              localStorage.setItem(localKey, JSON.stringify(finalItems));
            } catch {}
          }

          // Notificar a otras pestañas/ventanas del navegador
          if (syncBroadcastChannel) {
            try {
              syncBroadcastChannel.postMessage({
                collectionName,
                data: finalItems,
                senderDeviceId: localDeviceId,
              });
            } catch {}
          }

          // Guardar la firma exacta para que el useEffect local no re-escriba Firestore innecesariamente
          lastDataSignatures[collectionName] = calculateFingerprint(finalItems);

          // Notificar al estado de React
          onUpdate(finalItems);

          updateSyncStatus(s => {
            s.status = "connected";
            s.lastSyncTime = timeStr;
            s.lastOperation = `Sincronizados ${finalItems.length} registros en '${collectionName}'`;
            s.collections[collectionName] = {
              status: "synced",
              docsCount: finalItems.length,
              lastUpdated: timeStr,
            };
          });
        } catch (innerErr: any) {
          console.warn(`[Firebase] Error procesando snapshot '${collectionName}':`, innerErr);
          updateSyncStatus(s => {
            s.status = "error";
            s.readErrors += 1;
            s.lastErrorMessage = innerErr?.message || String(innerErr);
            s.collections[collectionName] = {
              status: "error",
              docsCount: s.collections[collectionName]?.docsCount || 0,
              errorMessage: innerErr?.message || String(innerErr),
            };
          });
        }
      },
      (error) => {
        console.warn(`[Firebase] Error en listener de '${collectionName}':`, error.message);
        updateSyncStatus(s => {
          s.status = "error";
          s.readErrors += 1;
          s.lastErrorMessage = error.message;
          s.collections[collectionName] = {
            status: "error",
            docsCount: s.collections[collectionName]?.docsCount || 0,
            errorMessage: error.message,
          };
        });
      }
    );

    return unsubscribe;
  } catch (err: any) {
    console.warn(`[Firebase] Error al iniciar suscripción '${collectionName}':`, err);
    return () => {};
  }
}

/**
 * Guarda o actualiza un documento individual de forma inmediata y atómica en Firestore
 */
export async function saveDocument<T extends { id: string | number; updatedAt?: number }>(
  collectionName: string,
  item: T
) {
  if (!item || item.id == null) return;
  const docId = toSafeDocId(item.id);
  (item as any).updatedAt = Date.now();

  const localKey = storageKeyMap[collectionName] || collectionName;
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(localKey);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) {
          const idx = arr.findIndex((x: any) => toSafeDocId(x.id) === docId);
          if (idx >= 0) arr[idx] = item;
          else arr.unshift(item);
          localStorage.setItem(localKey, JSON.stringify(arr));
        }
      }
    } catch {}
  }

  if (syncBroadcastChannel) {
    try {
      syncBroadcastChannel.postMessage({
        collectionName,
        action: "saveDocument",
        item,
        senderDeviceId: localDeviceId,
      });
    } catch {}
  }

  if (!db || !isFirebaseAvailable) return;

  try {
    const sanitized = sanitizeForFirestore(item);
    const docRef = doc(db, collectionName, docId);
    await setDoc(docRef, sanitized, { merge: true });

    const timeStr = new Date().toLocaleTimeString("es-CL", { timeZone: "America/Santiago" });
    updateSyncStatus(s => {
      s.status = "connected";
      s.lastSyncTime = timeStr;
      s.lastOperation = `Guardado doc #${docId} en '${collectionName}'`;
      if (s.collections[collectionName]) {
        s.collections[collectionName].status = "synced";
        s.collections[collectionName].lastUpdated = timeStr;
      }
    });
    addSyncLog("success", collectionName, `Doc #${docId} guardado en Firestore.`);
  } catch (err: any) {
    console.warn(`[Firebase] Error guardando doc #${docId} en '${collectionName}':`, err);
    const errMsg = err?.message || String(err);
    updateSyncStatus(s => {
      s.writeErrors += 1;
      s.lastErrorMessage = errMsg;
    });
    addSyncLog("error", collectionName, `Error al guardar #${docId}: ${errMsg}`);
  }
}

/**
 * Elimina un documento individual de forma inmediata en Firestore
 */
export async function deleteDocument(
  collectionName: string,
  docId: string | number
) {
  if (docId == null) return;
  const idStr = toSafeDocId(docId);

  const localKey = storageKeyMap[collectionName] || collectionName;
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(localKey);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) {
          const filtered = arr.filter((x: any) => toSafeDocId(x.id) !== idStr);
          localStorage.setItem(localKey, JSON.stringify(filtered));
        }
      }
    } catch {}
  }

  if (syncBroadcastChannel) {
    try {
      syncBroadcastChannel.postMessage({
        collectionName,
        action: "deleteDocument",
        docId: idStr,
        senderDeviceId: localDeviceId,
      });
    } catch {}
  }

  if (!db || !isFirebaseAvailable) return;

  try {
    const docRef = doc(db, collectionName, idStr);
    await deleteDoc(docRef);

    const timeStr = new Date().toLocaleTimeString("es-CL", { timeZone: "America/Santiago" });
    updateSyncStatus(s => {
      s.status = "connected";
      s.lastSyncTime = timeStr;
      s.lastOperation = `Eliminado doc #${idStr} en '${collectionName}'`;
    });
    addSyncLog("info", collectionName, `Doc #${idStr} eliminado de Firestore.`);
  } catch (err: any) {
    console.warn(`[Firebase] Error eliminando doc #${idStr} en '${collectionName}':`, err);
    addSyncLog("error", collectionName, `Error al eliminar #${idStr}: ${err?.message || String(err)}`);
  }
}

/**
 * Guarda o sincroniza una colección completa en Firestore con reconciliación y eliminación de registros borrados
 */
export async function saveEntireCollection<T extends { id: string | number; updatedAt?: number }>(
  collectionName: string,
  data: T[]
) {
  if (!Array.isArray(data)) return;

  const localKey = storageKeyMap[collectionName] || collectionName;

  // Persistencia local instantánea
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(localKey, JSON.stringify(data));
    } catch {}
  }

  // Notificar a otras pestañas/ventanas abiertas en este mismo navegador
  if (syncBroadcastChannel) {
    try {
      syncBroadcastChannel.postMessage({
        collectionName,
        data,
        senderDeviceId: localDeviceId,
      });
    } catch {}
  }

  // Si la colección no ha recibido el primer snapshot de Firestore, no escribir para evitar colisiones
  if (!isCollectionHydrated[collectionName]) {
    return;
  }

  // Comprobar si los datos son idénticos a los ya sincronizados
  const fingerprint = calculateFingerprint(data);
  if (lastDataSignatures[collectionName] === fingerprint) {
    return;
  }

  lastDataSignatures[collectionName] = fingerprint;

  // Debounce para agrupar llamadas
  if (pendingDebounceTimers[collectionName]) {
    clearTimeout(pendingDebounceTimers[collectionName]);
  }

  pendingDebounceTimers[collectionName] = setTimeout(async () => {
    if (!db || !isFirebaseAvailable) return;

    try {
      if (data.length === 0) {
        await clearCollectionInFirestore(collectionName);
        return;
      }

      // Obtener snapshot remoto actual para reconciliar eliminaciones
      const colRef = collection(db, collectionName);
      const currentSnap = await getDocs(colRef);
      const localIdSet = new Set<string>();

      data.forEach(item => {
        if (item && item.id != null) {
          localIdSet.add(toSafeDocId(item.id));
        }
      });

      // 1. Eliminar documentos que ya no existen localmente
      const toDeleteDocs: any[] = [];
      currentSnap.forEach(remoteDoc => {
        if (!localIdSet.has(remoteDoc.id)) {
          toDeleteDocs.push(remoteDoc.ref);
        }
      });

      if (toDeleteDocs.length > 0) {
        for (let i = 0; i < toDeleteDocs.length; i += 400) {
          const chunk = toDeleteDocs.slice(i, i + 400);
          const delBatch = writeBatch(db);
          chunk.forEach(ref => delBatch.delete(ref));
          await delBatch.commit();
        }
      }

      // 2. Guardar / actualizar documentos locales
      for (let i = 0; i < data.length; i += 400) {
        const chunk = data.slice(i, i + 400);
        const batch = writeBatch(db);
        chunk.forEach(item => {
          if (item && item.id != null) {
            const docId = toSafeDocId(item.id);
            const sanitized = sanitizeForFirestore({
              ...item,
              updatedAt: (item as any).updatedAt || Date.now(),
            });
            const docRef = doc(db!, collectionName, docId);
            batch.set(docRef, sanitized, { merge: true });
          }
        });
        await batch.commit();
      }

      const timeStr = new Date().toLocaleTimeString("es-CL", { timeZone: "America/Santiago" });
      updateSyncStatus(s => {
        s.status = "connected";
        s.lastSyncTime = timeStr;
        s.lastOperation = `Sincronizados ${data.length} docs en '${collectionName}'`;
        if (s.collections[collectionName]) {
          s.collections[collectionName].status = "synced";
          s.collections[collectionName].docsCount = data.length;
          s.collections[collectionName].lastUpdated = timeStr;
        }
      });
      addSyncLog("success", collectionName, `${data.length} registros sincronizados en Firestore.`);
    } catch (err: any) {
      console.warn(`[Firebase] Error en saveEntireCollection '${collectionName}':`, err);
      const errMsg = err?.message || String(err);
      updateSyncStatus(s => {
        s.writeErrors += 1;
        s.lastErrorMessage = errMsg;
      });
      addSyncLog("error", collectionName, `Error al sincronizar: ${errMsg}`);
    }
  }, 100);
}

/**
 * Vacia una colección completa en Firestore
 */
export async function clearCollectionInFirestore(collectionName: string) {
  if (!db || !isFirebaseAvailable) return;

  try {
    const colRef = collection(db, collectionName);
    const snap = await getDocs(colRef);
    if (snap.empty) return;

    for (let i = 0; i < snap.docs.length; i += 400) {
      const chunk = snap.docs.slice(i, i + 400);
      const batch = writeBatch(db);
      chunk.forEach(d => {
        batch.delete(d.ref);
      });
      await batch.commit();
    }

    const timeStr = new Date().toLocaleTimeString("es-CL", { timeZone: "America/Santiago" });
    updateSyncStatus(s => {
      s.status = "connected";
      s.lastSyncTime = timeStr;
      s.lastOperation = `Colección '${collectionName}' vaciada`;
      if (s.collections[collectionName]) {
        s.collections[collectionName].docsCount = 0;
        s.collections[collectionName].lastUpdated = timeStr;
      }
    });
    addSyncLog("info", collectionName, `Colección vaciada completamente en Firestore.`);
  } catch (err: any) {
    console.warn(`[Firebase] Error vaciando '${collectionName}':`, err);
  }
}

/**
 * Guarda o actualiza la información corporativa de Trama
 */
export async function saveInfoEmpresa(info: any) {
  if (!info) return;

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("trama_info_data", JSON.stringify(info));
    } catch {}
  }

  if (!isCollectionHydrated["infoEmpresa"]) return;

  const fingerprint = calculateFingerprint(info);
  if (lastDataSignatures["infoEmpresa"] === fingerprint) return;
  lastDataSignatures["infoEmpresa"] = fingerprint;

  if (!db || !isFirebaseAvailable) return;

  try {
    const sanitized = sanitizeForFirestore(info);
    if (!sanitized.updatedAt) sanitized.updatedAt = Date.now();
    const docRef = doc(db, "infoEmpresa", "general");
    await setDoc(docRef, sanitized, { merge: true });

    const timeStr = new Date().toLocaleTimeString("es-CL", { timeZone: "America/Santiago" });
    updateSyncStatus(s => {
      s.status = "connected";
      s.lastSyncTime = timeStr;
      s.lastOperation = "Información corporativa guardada";
      if (s.collections.infoEmpresa) {
        s.collections.infoEmpresa.status = "synced";
        s.collections.infoEmpresa.docsCount = 1;
        s.collections.infoEmpresa.lastUpdated = timeStr;
      }
    });
  } catch (err: any) {
    console.warn("[Firebase] Error guardando infoEmpresa:", err);
  }
}

/**
 * Suscribe la información corporativa en tiempo real
 */
export function syncInfoEmpresa(
  onUpdate: (info: any) => void,
  initialInfo: any
): Unsubscribe {
  if (!db || !isFirebaseAvailable) {
    return () => {};
  }
  try {
    const docRef = doc(db, "infoEmpresa", "general");
    return onSnapshot(
      docRef,
      async (docSnap) => {
        const timeStr = new Date().toLocaleTimeString("es-CL", { timeZone: "America/Santiago" });

        let finalInfo = initialInfo;
        if (docSnap.exists()) {
          finalInfo = { ...initialInfo, ...docSnap.data() };
          isCollectionHydrated["infoEmpresa"] = true;
        } else {
          isCollectionHydrated["infoEmpresa"] = true;
          await saveInfoEmpresa(initialInfo);
        }

        if (typeof window !== "undefined") {
          try {
            localStorage.setItem("trama_info_data", JSON.stringify(finalInfo));
          } catch {}
        }

        lastDataSignatures["infoEmpresa"] = calculateFingerprint(finalInfo);
        onUpdate(finalInfo);

        updateSyncStatus(s => {
          s.status = "connected";
          s.lastSyncTime = timeStr;
          s.lastOperation = "Información corporativa sincronizada";
          if (s.collections.infoEmpresa) {
            s.collections.infoEmpresa.status = "synced";
            s.collections.infoEmpresa.docsCount = 1;
            s.collections.infoEmpresa.lastUpdated = timeStr;
          }
        });
      },
      (error) => {
        console.warn("[Firebase] Listener infoEmpresa error:", error.message);
      }
    );
  } catch (err: any) {
    return () => {};
  }
}

/**
 * Guarda o actualiza la sesión activa de caja
 */
export async function saveAperturaActiva(apertura: any) {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("trama_apertura_activa", JSON.stringify(apertura));
    } catch {}
  }

  if (!isCollectionHydrated["aperturaActiva"]) return;

  const fingerprint = calculateFingerprint(apertura);
  if (lastDataSignatures["aperturaActiva"] === fingerprint) return;
  lastDataSignatures["aperturaActiva"] = fingerprint;

  if (!db || !isFirebaseAvailable) return;

  try {
    const docRef = doc(db, "aperturaActiva", "actual");
    if (apertura === null) {
      await deleteDoc(docRef);
    } else {
      const sanitized = sanitizeForFirestore(apertura);
      if (!sanitized.updatedAt) sanitized.updatedAt = Date.now();
      await setDoc(docRef, sanitized, { merge: true });
    }
  } catch (err: any) {
    console.warn("[Firebase] Error guardando aperturaActiva:", err);
  }
}

/**
 * Suscribe el estado de apertura de caja activa en tiempo real
 */
export function syncAperturaActiva(
  onUpdate: (apertura: any) => void,
  initialApertura: any = null
): Unsubscribe {
  if (!db || !isFirebaseAvailable) {
    return () => {};
  }
  try {
    const docRef = doc(db, "aperturaActiva", "actual");
    return onSnapshot(
      docRef,
      (docSnap) => {
        let finalApertura = initialApertura;
        if (docSnap.exists()) {
          finalApertura = docSnap.data();
        } else {
          finalApertura = null;
        }

        isCollectionHydrated["aperturaActiva"] = true;

        if (typeof window !== "undefined") {
          try {
            localStorage.setItem("trama_apertura_activa", JSON.stringify(finalApertura));
          } catch {}
        }

        lastDataSignatures["aperturaActiva"] = calculateFingerprint(finalApertura);
        onUpdate(finalApertura);
      },
      (error) => {
        console.warn("[Firebase] Listener aperturaActiva error:", error.message);
      }
    );
  } catch (err: any) {
    return () => {};
  }
}
