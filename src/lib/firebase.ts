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
  Firestore,
  Unsubscribe,
} from "firebase/firestore";
import defaultFirebaseConfig from "../../firebase-applet-config.json";

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
  lastOperation: "Iniciando sincronización con Firebase Cloud...",
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
    id: `${Date.now()}-${Math.random()}`,
    timestamp: timeZoneStr,
    type,
    collection: collectionName,
    message,
  };
  syncStatusState.logs = [entry, ...syncStatusState.logs].slice(0, 40);
}

// Banderas de control multi-dispositivo y prevención de loops
const isCollectionHydrated: Record<string, boolean> = {};
const lastDataSignatures: Record<string, string> = {};
const knownFirestoreDocIds: Record<string, Set<string>> = {};
const pendingDebounceTimers: Record<string, any> = {};

// Callbacks registrados para sincronización forzada bajo demanda
const registeredCollectionUpdaters: Record<string, (data: any[]) => void> = {};

/**
 * Sanitiza recursivamente objetos eliminando propiedades 'undefined' o funciones para Firestore
 */
export function sanitizeForFirestore<T>(data: T): T {
  if (data === undefined || data === null) return data;
  return JSON.parse(JSON.stringify(data));
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

// Inicialización segura de Firestore
try {
  if (typeof window !== "undefined") {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    const dbId =
      import.meta.env.VITE_FIREBASE_DATABASE_ID ||
      (defaultFirebaseConfig as any)?.firestoreDatabaseId ||
      (defaultFirebaseConfig as any)?.databaseId;

    if (dbId) {
      try {
        db = getFirestore(app, dbId);
      } catch {
        db = initializeFirestore(app, { ignoreUndefinedProperties: true }, dbId);
      }
    } else {
      try {
        db = getFirestore(app);
      } catch {
        db = initializeFirestore(app, { ignoreUndefinedProperties: true });
      }
    }

    if (db) {
      isFirebaseAvailable = true;
      syncStatusState.isAvailable = true;
      syncStatusState.status = "connected";
      syncStatusState.lastSyncTime = new Date().toLocaleTimeString("es-CL", { timeZone: "America/Santiago" });
      syncStatusState.lastOperation = `Conectado a Firestore (${dbId || "default"})`;
      addSyncLog("info", "sistema", "Conexión a Firebase Cloud Firestore activa en tiempo real.");
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
 * Forzar lectura inmediata de todas las colecciones desde Firestore a la memoria local
 */
export async function forceSyncFromCloud(): Promise<{ success: boolean; message: string }> {
  if (!db || !isFirebaseAvailable) {
    return { success: false, message: "Firebase no está disponible." };
  }

  try {
    updateSyncStatus(s => {
      s.status = "syncing";
      s.lastOperation = "Descargando estado actualizado desde Firestore...";
    });

    const collectionsToFetch = Object.keys(storageKeyMap).filter(k => k !== "infoEmpresa" && k !== "aperturaActiva");

    for (const colName of collectionsToFetch) {
      const colRef = collection(db, colName);
      const snap = await getDocs(colRef);
      const items: any[] = [];
      const docIds = new Set<string>();

      snap.forEach(d => {
        const item = d.data();
        if (item && item.id != null) {
          items.push(item);
          docIds.add(String(item.id));
        }
      });

      if (!snap.empty) {
        knownFirestoreDocIds[colName] = docIds;
        lastDataSignatures[colName] = calculateFingerprint(items);
        isCollectionHydrated[colName] = true;

        const localKey = storageKeyMap[colName] || colName;
        if (typeof window !== "undefined") {
          localStorage.setItem(localKey, JSON.stringify(items));
        }

        if (registeredCollectionUpdaters[colName]) {
          registeredCollectionUpdaters[colName](items);
        }
      }
    }

    const timeStr = new Date().toLocaleTimeString("es-CL", { timeZone: "America/Santiago" });
    updateSyncStatus(s => {
      s.status = "connected";
      s.lastSyncTime = timeStr;
      s.lastOperation = "Sincronización manual completada con éxito";
    });

    addSyncLog("success", "sistema", "Todas las colecciones fueron actualizadas desde la nube.");
    return { success: true, message: "Datos actualizados correctamente desde Cloud Firestore." };
  } catch (err: any) {
    const errMsg = err?.message || String(err);
    updateSyncStatus(s => {
      s.status = "error";
      s.lastErrorMessage = errMsg;
    });
    return { success: false, message: `Error al sincronizar: ${errMsg}` };
  }
}

/**
 * Suscribe una colección a Firestore con sincronización bidireccional inmediata y protección contra sobreescrituras
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
          const currentDocIds = new Set<string>();

          snapshot.forEach((docSnap) => {
            const item = docSnap.data() as T;
            if (item && item.id != null) {
              remoteItems.push(item);
              currentDocIds.add(String(item.id));
            }
          });

          knownFirestoreDocIds[collectionName] = currentDocIds;

          // Leer estado local actual de la memoria caché
          const localRaw = typeof window !== "undefined" ? localStorage.getItem(localKey) : null;
          let localItems: T[] = [];
          if (localRaw) {
            try {
              const parsed = JSON.parse(localRaw);
              if (Array.isArray(parsed)) localItems = parsed;
            } catch {}
          }

          let finalItems: T[] = [];

          if (snapshot.empty) {
            // Firestore está completamente vacío (primera inicialización de la nube)
            if (localItems.length > 0) {
              finalItems = localItems;
            } else if (initialData.length > 0) {
              finalItems = initialData;
            } else {
              finalItems = [];
            }

            // Marcar hidratado ANTES de sembrar Firestore para permitir el guardado
            isCollectionHydrated[collectionName] = true;
            if (finalItems.length > 0) {
              writeCollectionToFirestore(collectionName, finalItems);
            }
          } else {
            // Firestore tiene datos: Firestore es la fuente de verdad definitiva para todos los navegadores/dispositivos
            finalItems = remoteItems;
            isCollectionHydrated[collectionName] = true;
          }

          // Guardar en almacenamiento local
          if (typeof window !== "undefined") {
            try {
              localStorage.setItem(localKey, JSON.stringify(finalItems));
            } catch {}
          }

          // Guardar la firma exacta para que el useEffect local no re-escriba Firestore
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
 * Función interna para enviar un lote completo a Firestore
 */
async function writeCollectionToFirestore<T extends { id: string | number; updatedAt?: number }>(
  collectionName: string,
  data: T[]
) {
  if (!db || !isFirebaseAvailable || !Array.isArray(data)) return;

  try {
    const currentDocIds = new Set<string>();
    const sanitizedData = data.map(item => {
      const sanitized = sanitizeForFirestore(item);
      if (!(sanitized as any).updatedAt) {
        (sanitized as any).updatedAt = Date.now();
      }
      if (sanitized && sanitized.id != null) {
        currentDocIds.add(String(sanitized.id));
      }
      return sanitized;
    });

    const previousDocIds = knownFirestoreDocIds[collectionName] || new Set<string>();
    const ops: Array<{ type: "set"; ref: any; docData: any } | { type: "delete"; ref: any }> = [];

    sanitizedData.forEach((item) => {
      if (item && item.id != null) {
        const docRef = doc(db!, collectionName, String(item.id));
        ops.push({ type: "set", ref: docRef, docData: item });
      }
    });

    // Detectar eliminaciones y borrarlas en Firestore
    if (previousDocIds.size > 0) {
      previousDocIds.forEach((oldId) => {
        if (!currentDocIds.has(oldId)) {
          const docRef = doc(db!, collectionName, oldId);
          ops.push({ type: "delete", ref: docRef });
        }
      });
    }

    if (ops.length > 0) {
      for (let i = 0; i < ops.length; i += 400) {
        const batch = writeBatch(db!);
        const chunk = ops.slice(i, i + 400);
        chunk.forEach((op) => {
          if (op.type === "set") {
            batch.set(op.ref, op.docData, { merge: true });
          } else {
            batch.delete(op.ref);
          }
        });
        await batch.commit();
      }
    }

    knownFirestoreDocIds[collectionName] = currentDocIds;

    const timeStr = new Date().toLocaleTimeString("es-CL", { timeZone: "America/Santiago" });
    updateSyncStatus(s => {
      s.status = "connected";
      s.lastSyncTime = timeStr;
      s.lastOperation = `Guardado exitoso en '${collectionName}' (${sanitizedData.length} docs)`;
      s.collections[collectionName] = {
        status: "synced",
        docsCount: sanitizedData.length,
        lastUpdated: timeStr,
      };
    });
    addSyncLog("success", collectionName, `${sanitizedData.length} registros guardados en Firestore.`);
  } catch (err: any) {
    console.warn(`[Firebase] Error al escribir en '${collectionName}':`, err);
    const errMsg = err?.message || String(err);
    updateSyncStatus(s => {
      s.status = "error";
      s.writeErrors += 1;
      s.lastErrorMessage = errMsg;
      s.collections[collectionName] = {
        status: "error",
        docsCount: data.length,
        errorMessage: errMsg,
      };
    });
    addSyncLog("error", collectionName, `Error al guardar: ${errMsg}`);
  }
}

/**
 * Guarda o actualiza la colección completa en Firestore con debouncing y guardas anti-sobrescritura
 */
export function saveEntireCollection<T extends { id: string | number; updatedAt?: number }>(
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

  // Si la colección no ha recibido el primer snapshot de Firestore, NO sobrescribir Firestore con valores locales iniciales
  if (!isCollectionHydrated[collectionName]) {
    return;
  }

  // Comprobar si los datos son idénticos a los ya sincronizados
  const fingerprint = calculateFingerprint(data);
  if (lastDataSignatures[collectionName] === fingerprint) {
    return;
  }

  lastDataSignatures[collectionName] = fingerprint;

  // Debounce para agrupar múltiples llamadas rápidas
  if (pendingDebounceTimers[collectionName]) {
    clearTimeout(pendingDebounceTimers[collectionName]);
  }

  pendingDebounceTimers[collectionName] = setTimeout(() => {
    writeCollectionToFirestore(collectionName, data);
  }, 100);
}

/**
 * Guarda un documento individual de forma inmediata
 */
export async function saveDocument<T extends { id: string | number; updatedAt?: number }>(
  collectionName: string,
  item: T
) {
  if (!item || item.id == null) return;
  const docId = String(item.id);
  (item as any).updatedAt = Date.now();

  const localKey = storageKeyMap[collectionName] || collectionName;
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(localKey);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) {
          const idx = arr.findIndex((x: any) => String(x.id) === docId);
          if (idx >= 0) arr[idx] = item;
          else arr.unshift(item);
          localStorage.setItem(localKey, JSON.stringify(arr));
        }
      }
    } catch {}
  }

  if (!db || !isFirebaseAvailable) return;

  try {
    const sanitized = sanitizeForFirestore(item);
    const docRef = doc(db, collectionName, docId);
    await setDoc(docRef, sanitized, { merge: true });

    if (!knownFirestoreDocIds[collectionName]) {
      knownFirestoreDocIds[collectionName] = new Set<string>();
    }
    knownFirestoreDocIds[collectionName].add(docId);
  } catch (err: any) {
    console.warn(`[Firebase] Error guardando doc #${docId} en '${collectionName}':`, err);
  }
}

/**
 * Elimina un documento individual de forma inmediata
 */
export async function deleteDocument(
  collectionName: string,
  docId: string | number
) {
  if (docId == null) return;
  const idStr = String(docId);

  const localKey = storageKeyMap[collectionName] || collectionName;
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(localKey);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) {
          const filtered = arr.filter((x: any) => String(x.id) !== idStr);
          localStorage.setItem(localKey, JSON.stringify(filtered));
        }
      }
    } catch {}
  }

  if (!db || !isFirebaseAvailable) return;

  try {
    const docRef = doc(db, collectionName, idStr);
    await deleteDoc(docRef);

    if (knownFirestoreDocIds[collectionName]) {
      knownFirestoreDocIds[collectionName].delete(idStr);
    }
  } catch (err: any) {
    console.warn(`[Firebase] Error eliminando doc #${idStr} en '${collectionName}':`, err);
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
