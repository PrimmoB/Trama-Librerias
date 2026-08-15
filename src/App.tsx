import React, { useState, useEffect } from "react";
import { ShoppingBag, DollarSign, Users, LogOut, Menu, X, Building2, AlertTriangle, Calculator, Tag, BookOpen, ChevronDown, PieChart, Receipt, Coins, Truck, History, Download, Moon, Sun, Lock, Unlock, ShieldCheck, Zap, MapPin, Phone } from "lucide-react";
import { RoleType, Book, Venta, Proveedor, Acceso, Movimiento, Gasto, OtroIngreso, TramaInfo, LibreriaEntry, AperturaCaja, CierreCaja, LiquidacionConsignacion, AuditLog } from "./types";
import { BOOKS_INIT, PROVEEDORES_INIT, VENTAS_INIT, ACCESOS_INIT, MOVIMIENTOS_INIT, GASTOS_INIT, OTROS_INGRESOS_INIT, TRAMA_INFO_INIT, LIBRERIAS_INIT, normalizeLibreriasList } from "./data/initialData";
import { useLocalStorage, getFechaHoraChile } from "./utils/helpers";
import { POS } from "./components/POS";
import { Finanzas } from "./components/Finanzas";
import { DistribucionLibrerias } from "./components/DistribucionLibrerias";
import { Accesos } from "./components/Accesos";
import { Login } from "./components/Login";
import { PublicCatalog } from "./components/PublicCatalog";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ConsultaMesonModal } from "./components/ConsultaMesonModal";
import { Logo } from "./components/Logo";
import { Input } from "./components/ui";
import { syncCollection, saveEntireCollection, syncInfoEmpresa, saveInfoEmpresa, syncAperturaActiva, saveAperturaActiva } from "./lib/firebase";

export default function App() {
  const [role, setRole] = useState<RoleType | null>(null);
  const [usuarioActual, setUsuarioActual] = useState<string>("");
  const [page, setPage] = useState<string>("pos");
  const [isPublicCatalogView, setIsPublicCatalogView] = useState<boolean>(false);
  const [finanzasTab, setFinanzasTab] = useState<"resumen" | "gastos" | "otrosIngresos" | "librerias" | "cierre" | "proveedores" | "movimientos">("resumen");
  const [accesosTab, setAccesosTab] = useState<"personal" | "datosTrama" | "respaldos" | "sync">("personal");
  const [libreriaPrivadaActiva, setLibreriaPrivadaActiva] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [posSubModal, setPosSubModal] = useState<"caja" | "etiquetas" | "catalogo" | "liquidaciones" | null>(null);
  const [consultaMesonOpen, setConsultaMesonOpen] = useState<boolean>(false);
  const [pendingCartBook, setPendingCartBook] = useState<Book | null>(null);

  // Escuchador de teclado global F2 para Consulta de Mesón Rápidamente
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F2") {
        e.preventDefault();
        setConsultaMesonOpen(prev => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({
    pos: false,
    finanzas: false,
    accesos: false,
  });

  const toggleMenu = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setOpenMenus(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Estado de modo oscuro (Entornos de librería con iluminación tenue)
  const [darkMode, setDarkMode] = useLocalStorage<boolean>("trama_dark_mode", false);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  // Estados persistentes con localStorage
  const [books, setBooks] = useLocalStorage<Book[]>("trama_books", BOOKS_INIT);
  const [ventas, setVentas] = useLocalStorage<Venta[]>("trama_ventas", VENTAS_INIT);
  const [proveedores, setProveedores] = useLocalStorage<Proveedor[]>("trama_proveedores", PROVEEDORES_INIT);
  const [tramaInfo, setTramaInfo] = useLocalStorage<TramaInfo>("trama_info_data", TRAMA_INFO_INIT);
  const [librerias, setLibrerias] = useLocalStorage<LibreriaEntry[]>("trama_librerias_data", LIBRERIAS_INIT);
  const [accesos, setAccesos] = useLocalStorage<Acceso[]>("trama_accesos", ACCESOS_INIT);

  // Sincronización y validación de integridad independiente de librerías
  useEffect(() => {
    setLibrerias(prev => {
      const normalized = normalizeLibreriasList(prev);
      if (JSON.stringify(normalized) !== JSON.stringify(prev)) {
        return normalized;
      }
      return prev;
    });
  }, []);

  // Sincronización de accesos
  useEffect(() => {
    if (accesos.some(a => a.nombre.toLowerCase().includes("jorge"))) {
      setAccesos(prev => prev.filter(a => !a.nombre.toLowerCase().includes("jorge")));
    }
  }, [accesos, setAccesos]);


  const [movimientos, setMovimientos] = useLocalStorage<Movimiento[]>("trama_movimientos", MOVIMIENTOS_INIT);

  const [gastos, setGastos] = useLocalStorage<Gasto[]>("trama_gastos", GASTOS_INIT);
  const [otrosIngresos, setOtrosIngresos] = useLocalStorage<OtroIngreso[]>("trama_otros_ingresos", OTROS_INGRESOS_INIT);
  const [aperturaActiva, setAperturaActiva] = useLocalStorage<AperturaCaja | null>("trama_apertura_activa", null);
  const [cierresCaja, setCierresCaja] = useLocalStorage<CierreCaja[]>("trama_cierres_caja", []);
  const [liquidaciones, setLiquidaciones] = useLocalStorage<LiquidacionConsignacion[]>("trama_liquidaciones", []);

  // Registros de Auditoría y Seguridad
  const [auditLogs, setAuditLogs] = useLocalStorage<AuditLog[]>("trama_audit_logs", [
    {
      id: "LOG-1001",
      fechaHora: getFechaHoraChile(),
      usuario: "Sistema Trama",
      rol: "admin",
      accion: "Inicialización del Sistema",
      modulo: "Seguridad",
      detalles: "Módulos de auditoría y protección de terminales iniciados correctamente (Hora Oficial Chile)",
      tipo: "info",
    },
  ]);

  // Sincronización en tiempo real con Firebase Firestore
  useEffect(() => {
    const unsubBooks = syncCollection<Book>("books", (data) => setBooks(data), BOOKS_INIT);
    const unsubVentas = syncCollection<Venta>("ventas", (data) => setVentas(data), VENTAS_INIT);
    const unsubProveedores = syncCollection<Proveedor>("proveedores", (data) => setProveedores(data), PROVEEDORES_INIT);
    const unsubLibrerias = syncCollection<LibreriaEntry>("librerias", (data) => setLibrerias(normalizeLibreriasList(data)), LIBRERIAS_INIT);
    const unsubAccesos = syncCollection<Acceso>("accesos", (data) => setAccesos(data), ACCESOS_INIT);
    const unsubMovimientos = syncCollection<Movimiento>("movimientos", (data) => setMovimientos(data), MOVIMIENTOS_INIT);
    const unsubGastos = syncCollection<Gasto>("gastos", (data) => setGastos(data), GASTOS_INIT);
    const unsubOtros = syncCollection<OtroIngreso>("otrosIngresos", (data) => setOtrosIngresos(data), OTROS_INGRESOS_INIT);
    const unsubAudit = syncCollection<AuditLog>("auditLogs", (data) => setAuditLogs(data), []);
    const unsubCierres = syncCollection<CierreCaja>("cierresCaja", (data) => setCierresCaja(data), []);
    const unsubLiquidaciones = syncCollection<LiquidacionConsignacion>("liquidaciones", (data) => setLiquidaciones(data), []);
    const unsubApertura = syncAperturaActiva((ap) => setAperturaActiva(ap), null);
    const unsubInfo = syncInfoEmpresa((info) => setTramaInfo(info), TRAMA_INFO_INIT);

    return () => {
      unsubBooks();
      unsubVentas();
      unsubProveedores();
      unsubLibrerias();
      unsubAccesos();
      unsubMovimientos();
      unsubGastos();
      unsubOtros();
      unsubAudit();
      unsubCierres();
      unsubLiquidaciones();
      unsubApertura();
      unsubInfo();
    };
  }, []);

  // Actualización instantánea a Firestore al modificar datos locales
  useEffect(() => { saveEntireCollection("books", books); }, [books]);
  useEffect(() => { saveEntireCollection("ventas", ventas); }, [ventas]);
  useEffect(() => { saveEntireCollection("proveedores", proveedores); }, [proveedores]);
  useEffect(() => { saveEntireCollection("librerias", librerias); }, [librerias]);
  useEffect(() => { saveEntireCollection("accesos", accesos); }, [accesos]);
  useEffect(() => { saveEntireCollection("movimientos", movimientos); }, [movimientos]);
  useEffect(() => { saveEntireCollection("gastos", gastos); }, [gastos]);
  useEffect(() => { saveEntireCollection("otrosIngresos", otrosIngresos); }, [otrosIngresos]);
  useEffect(() => { saveEntireCollection("auditLogs", auditLogs); }, [auditLogs]);
  useEffect(() => { saveEntireCollection("cierresCaja", cierresCaja); }, [cierresCaja]);
  useEffect(() => { saveEntireCollection("liquidaciones", liquidaciones); }, [liquidaciones]);
  useEffect(() => { saveAperturaActiva(aperturaActiva); }, [aperturaActiva]);
  useEffect(() => { if (tramaInfo) saveInfoEmpresa(tramaInfo); }, [tramaInfo]);

  const logAuditAction = (
    accion: string,
    modulo: string,
    detalles: string,
    tipo: "info" | "warning" | "security_alert" | "success" = "info"
  ) => {
    const newLog: AuditLog = {
      id: `LOG-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      fechaHora: getFechaHoraChile(),
      usuario: usuarioActual || "Sistema",
      rol: role || "vendedor",
      accion,
      modulo,
      detalles,
      tipo,
    };
    setAuditLogs(prev => [newLog, ...prev.slice(0, 199)]);
  };

  // Bloqueo de sesión por inactividad
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [unlockPassword, setUnlockPassword] = useState<string>("");
  const [unlockError, setUnlockError] = useState<string>("");

  useEffect(() => {
    if (!role || isLocked) return;

    let timeoutId: any;

    const resetInactivityTimer = () => {
      clearTimeout(timeoutId);
      // Bloquear tras 15 minutos (900.000 ms) de inactividad
      timeoutId = setTimeout(() => {
        setIsLocked(true);
        logAuditAction(
          "Bloqueo por Inactividad",
          "Seguridad",
          `Sesión de ${usuarioActual} pausada automáticamente por inactividad en la caja/terminal`,
          "warning"
        );
      }, 15 * 60 * 1000);
    };

    const events = ["mousedown", "mousemove", "keydown", "scroll", "touchstart"];
    events.forEach(e => window.addEventListener(e, resetInactivityTimer));

    resetInactivityTimer();

    return () => {
      clearTimeout(timeoutId);
      events.forEach(e => window.removeEventListener(e, resetInactivityTimer));
    };
  }, [role, isLocked, usuarioActual]);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    setUnlockError("");

    const currentAcc = accesos.find(a => a.nombre === usuarioActual || (a.activo && a.rol === role));
    const validPass = currentAcc?.clave || "admin123";

    if (unlockPassword.trim() === validPass) {
      setIsLocked(false);
      setUnlockPassword("");
      logAuditAction("Desbloqueo de Sesión", "Seguridad", `Sesión reactivada exitosamente por ${usuarioActual}`, "success");
    } else {
      setUnlockError("Contraseña incorrecta. Ingresa la clave correspondiente a tu usuario.");
      logAuditAction("Intento Fallido de Desbloqueo", "Seguridad", `Clave errónea ingresada al desbloquear terminal por ${usuarioActual}`, "security_alert");
    }
  };

  // Notificación de autoguardado
  const [autoBackupNotif, setAutoBackupNotif] = useState<string>("");

  const ejecutarRespaldoJSON = (motivo: "autoguardado" | "manual" = "manual") => {
    const hoyStr = new Date().toISOString().slice(0, 10);
    const data = {
      version: "2.0",
      tipoRespaldo: motivo === "autoguardado" ? "Autoguardado Diario Automático" : "Respaldo Manual JSON",
      fechaExportacion: new Date().toISOString(),
      libros: books,
      books,
      ventas,
      gastos,
      otrosIngresos,
      proveedores,
      movimientos,
      accesos,
      auditLogs,
      cierresCaja,
      liquidaciones,
      librerias,
      tramaInfo,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = motivo === "autoguardado"
      ? `autoguardado_diario_trama_${hoyStr}.json`
      : `respaldo_libreria_trama_${hoyStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const comprobarAutoguardadoDiario = () => {
    const hoy = new Date().toISOString().slice(0, 10);
    const ultimoAutoguardado = localStorage.getItem("trama_last_auto_backup_date");

    if (ultimoAutoguardado !== hoy) {
      ejecutarRespaldoJSON("autoguardado");
      localStorage.setItem("trama_last_auto_backup_date", hoy);
      setAutoBackupNotif(`📥 Autoguardado diario automático descargado: Base de datos completa en JSON (libros, ventas, gastos y movimientos) respaldada.`);
      setTimeout(() => setAutoBackupNotif(""), 10000);
    }
  };

  useEffect(() => {
    if (role === "admin" || role === "admin_secundario") {
      comprobarAutoguardadoDiario();
    }
    if (role && role !== "admin" && page === "accesos") {
      setPage("pos");
    }
  }, [role, page]);

  const registrarMovimiento = (mov: Omit<Movimiento, "id" | "fecha" | "usuario">) => {
    const nuevoMov: Movimiento = {
      id: `M-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      fecha: new Date().toISOString().slice(0, 10),
      usuario: usuarioActual || "Sistema",
      ...mov,
    };
    setMovimientos(prev => [nuevoMov, ...prev]);
  };

  const handleLogin = (r: RoleType, nombre: string) => {
    setRole(r);
    setUsuarioActual(nombre);
    setPage("pos");
    setIsLocked(false);
    logAuditAction("Inicio de Sesión", "Autenticación", `Sesión iniciada correctamente por ${nombre} (${r})`, "success");
    if (r === "admin" || r === "admin_secundario") {
      comprobarAutoguardadoDiario();
    }
  };

  const handleLogout = () => {
    logAuditAction("Cierre de Sesión", "Autenticación", `Sesión de ${usuarioActual} finalizada por el usuario`, "info");
    setRole(null);
    setUsuarioActual("");
    setIsLocked(false);
  };

  const handleResetAccesos = () => {
    setAccesos(ACCESOS_INIT);
    logAuditAction("Restablecimiento de Personal", "Seguridad", "Cuentas de usuario restablecidas a valores de fábrica", "warning");
  };

  const handleLoginLibreria = (alias: string) => {
    setRole("admin_secundario");
    setUsuarioActual(`Librería ${alias}`);
    setPage("distribucion");
    setFinanzasTab("librerias");
    setLibreriaPrivadaActiva(alias);
    setIsLocked(false);
    logAuditAction("Inicio de Sesión Librería", "Autenticación", `Acceso privado iniciado para Librería ${alias}`, "success");
  };

  if (isPublicCatalogView) {
    return (
      <PublicCatalog
        books={books}
        tramaInfo={tramaInfo}
        onGoToLogin={() => setIsPublicCatalogView(false)}
        onCloseModal={() => setIsPublicCatalogView(false)}
      />
    );
  }

  if (!role) {
    return (
      <Login
        accesos={accesos}
        librerias={librerias}
        onLogin={handleLogin}
        onLoginLibreria={handleLoginLibreria}
        onResetAccesos={handleResetAccesos}
        onLogAudit={logAuditAction}
        onOpenPublicCatalog={() => setIsPublicCatalogView(true)}
      />
    );
  }

  // Configuración de menús según rol
  const navItems = role === "admin"
    ? [
        { id: "pos", label: "Punto de Ventas", icon: ShoppingBag },
        { id: "distribucion", label: "Distribución Librerías", icon: Building2 },
        { id: "finanzas", label: "Finanzas y Arqueo", icon: DollarSign },
        { id: "accesos", label: "Personal y Respaldos", icon: Users },
      ]
    : role === "admin_secundario"
    ? [
        { id: "pos", label: "Punto de Ventas", icon: ShoppingBag },
        { id: "distribucion", label: "Distribución Librerías", icon: Building2 },
        { id: "finanzas", label: "Finanzas y Arqueo", icon: DollarSign },
      ]
    : [
        { id: "pos", label: "Punto de Ventas", icon: ShoppingBag },
        { id: "distribucion", label: "Distribución Librerías", icon: Building2 },
      ];

  const stockBajoCount = books.filter(b => b.stock <= b.stockMin).length;

  return (
    <div className="flex h-screen bg-[#f8f5eb] text-stone-900 font-sans overflow-hidden relative">
      {/* FONDO CORPORATIVO MARCA DE AGUA (TRAMA LIBRERÍAS) */}
      <div className="pointer-events-none fixed inset-0 flex items-center justify-center opacity-[0.05] z-0 overflow-hidden select-none">
        <img
          src="/LogoWeb1.jpg"
          alt="Watermark Trama Librerías"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            if (target.src.endsWith("/LogoWeb1.jpg")) {
              target.src = "/LogoWeb1.jpg";
            }
          }}
          className="w-[650px] h-[650px] max-w-none object-contain blur-[0.3px]"
        />
      </div>

      {/* SIDEBAR OVERLAY EN MÓVIL */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* SIDEBAR DE NAVEGACIÓN */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 w-64 bg-white border-r border-gray-200 z-40 flex flex-col transition-transform duration-200 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Header Branding */}
        <div className="p-4 border-b border-gray-100 flex items-start justify-between shrink-0 bg-white">
          <div className="flex flex-col gap-2 w-full min-w-0">
            <div className="flex items-center justify-between w-full gap-2">
              <Logo size="lg" className="object-contain" />
              <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-400 hover:text-gray-600 p-1 shrink-0">
                <X size={20} />
              </button>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-gray-100/80">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                <span className="text-[10px] text-gray-500 font-semibold capitalize">
                  {role === "admin"
                    ? "Administrador General"
                    : role === "admin_secundario"
                    ? "Administrador Secundario"
                    : "Vendedor POS"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Menú de Navegación */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map(item => {
            const Icon = item.icon;
            const active = page === item.id;

            return (
              <div key={item.id} className="space-y-0.5">
                <button
                  onClick={() => {
                    setPage(item.id);
                    if (item.id === "distribucion") {
                      setFinanzasTab("librerias");
                      setLibreriaPrivadaActiva(null);
                    } else if (item.id === "finanzas" && finanzasTab === "librerias") {
                      setFinanzasTab("resumen");
                    }
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    active ? "bg-gray-900 text-white shadow-2xs" : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon size={16} />
                    <span>{item.label}</span>
                  </div>
                </button>
              </div>
            );
          })}
        </nav>

        {/* Footer Sidebar / Perfil */}
        <div className="p-3 border-t border-gray-100 bg-gray-50/50 shrink-0">
          <div className="flex items-center justify-between">
            <div className="min-w-0 pr-2">
              <p className="text-xs font-bold text-gray-900 truncate">{usuarioActual}</p>
              <p className="text-[10px] text-gray-400 truncate">Sesión activa</p>
            </div>
            <button
              onClick={handleLogout}
              title="Cerrar sesión"
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* ÁREA PRINCIPAL */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto h-full">
        {/* TOPBAR */}
        <header className="h-14 bg-white border-b border-gray-100 px-4 flex items-center justify-between shrink-0 shadow-2xs">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-600 hover:text-gray-900 p-1">
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <span>{navItems.find(i => i.id === page)?.label || "TramaLibros"}</span>
                {page === "distribucion" && (
                  <span className="text-xs text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200 font-semibold">
                    {libreriaPrivadaActiva ? `🏢 Acceso Privado: ${libreriaPrivadaActiva}` : "🌐 Visión General Red"}
                  </span>
                )}
                {page === "finanzas" && (
                  <span className="text-xs text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200 font-semibold">
                    {finanzasTab === "resumen" && "📊 Resumen Ingresos & Gastos"}
                    {finanzasTab === "gastos" && "💸 Gastos Diarios"}
                    {finanzasTab === "otrosIngresos" && "💰 Otros Ingresos"}
                    {finanzasTab === "cierre" && "🧾 Arqueo de Caja Hoy"}
                    {finanzasTab === "proveedores" && "🚚 Cuentas por Pagar Proveedores"}
                    {finanzasTab === "movimientos" && "📋 Historial de Movimientos"}
                  </span>
                )}
                {page === "accesos" && (
                  <span className="text-xs text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200 font-semibold">
                    {accesosTab === "personal" && "👤 Personal y Cuentas"}
                    {accesosTab === "datosTrama" && "🏢 Datos de Trama & Ubicación"}
                    {accesosTab === "respaldos" && "💾 Respaldos y Seguridad"}
                    {accesosTab === "sync" && "⚡ Diagnóstico Nube & Firestore"}
                  </span>
                )}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* BOTÓN CONTROL / APERTURA DE CAJA EN TOPBAR */}
            <button
              onClick={() => {
                setPage("pos");
                setPosSubModal("caja");
              }}
              title="Abrir Gestor y Control de Caja Registradora"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer border shadow-2xs ${
                aperturaActiva?.estado === "Abierta"
                  ? "bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100"
                  : "bg-amber-100 text-amber-950 border-amber-400 hover:bg-amber-200 animate-pulse"
              }`}
            >
              {aperturaActiva?.estado === "Abierta" ? (
                <>
                  <Unlock size={14} className="text-emerald-700" />
                  <span className="hidden sm:inline">Caja Abierta</span>
                </>
              ) : (
                <>
                  <Lock size={14} className="text-amber-800" />
                  <span>Abrir Caja</span>
                </>
              )}
            </button>


            {/* Alerta rápida de stock bajo en topbar */}
            {stockBajoCount > 0 && (
              <div
                className="hidden sm:flex items-center gap-1.5 text-xs bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-lg font-medium"
              >
                <AlertTriangle size={13} className="text-amber-600" />
                <span>{stockBajoCount} libros con stock crítico</span>
              </div>
            )}

            {/* Botón de Modo Oscuro para iluminación tenue con alto contraste */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              title={darkMode ? "Cambiar a Modo Claro" : "Activar Modo Oscuro (Ideal para Iluminación Tenue)"}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border shadow-2xs ${
                darkMode
                  ? "bg-slate-800 text-amber-300 border-amber-500/40 hover:bg-slate-700 hover:border-amber-400 shadow-amber-950/20"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
              }`}
            >
              {darkMode ? (
                <>
                  <Sun size={15} className="text-amber-400 shrink-0 animate-pulse" />
                  <span className="hidden sm:inline text-amber-300 font-extrabold">Modo Claro</span>
                </>
              ) : (
                <>
                  <Moon size={15} className="text-purple-600 shrink-0" />
                  <span className="hidden sm:inline">Modo Oscuro</span>
                </>
              )}
            </button>
          </div>
        </header>

        {/* NOTIFICACIÓN DE AUTOGUARDADO DIARIO */}
        {autoBackupNotif && (
          <div className="bg-emerald-700 text-white text-xs px-4 py-2.5 flex items-center justify-between shadow-xs animate-fadeIn shrink-0">
            <div className="flex items-center gap-2 font-bold">
              <Download size={16} className="text-amber-300 shrink-0 animate-bounce" />
              <span>{autoBackupNotif}</span>
            </div>
            <button onClick={() => setAutoBackupNotif("")} className="text-white/80 hover:text-white text-xs underline font-bold cursor-pointer">
              Entendido
            </button>
          </div>
        )}

        {/* CONTENIDO DE PÁGINAS */}
        <main className="flex-1 p-3 sm:p-4 bg-[#f8f5eb]">
          <ErrorBoundary>
          {page === "pos" && (
            <POS
              books={books}
              setBooks={setBooks}
              ventas={ventas}
              setVentas={setVentas}
              usuarioActual={usuarioActual}
              registrarMovimiento={registrarMovimiento}
              aperturaActiva={aperturaActiva}
              cierresGuardados={cierresCaja}
              onAbrirCaja={(a) => setAperturaActiva(a)}
              onCerrarCaja={(c) => {
                setCierresCaja(prev => [c, ...prev]);
                setAperturaActiva(null);
              }}
              liquidacionesGuardadas={liquidaciones}
              onSaveLiquidacion={(l) => setLiquidaciones(prev => [l, ...prev])}
              onUpdateEstadoLiquidacion={(id, st) =>
                setLiquidaciones(prev => prev.map(item => item.id === id ? { ...item, estado: st } : item))
              }
              proveedores={proveedores}
              gastos={gastos}
              otrosIngresos={otrosIngresos}
              activeSubModal={posSubModal}
              setActiveSubModal={setPosSubModal}
              pendingAddToCartBook={pendingCartBook}
              onClearPendingCartBook={() => setPendingCartBook(null)}
            />
          )}

          {page === "finanzas" && (
            <Finanzas
              ventas={ventas}
              setVentas={setVentas}
              books={books}
              setBooks={setBooks}
              proveedores={proveedores}
              setProveedores={setProveedores}
              movimientos={movimientos}
              gastos={gastos}
              setGastos={setGastos}
              otrosIngresos={otrosIngresos}
              setOtrosIngresos={setOtrosIngresos}
              usuarioActual={usuarioActual}
              librerias={librerias}
              setLibrerias={setLibrerias}
              tramaInfo={tramaInfo}
              registrarMovimiento={registrarMovimiento}
              initialTab={finanzasTab}
              onTabChange={(t) => setFinanzasTab(t)}
            />
          )}

          {page === "distribucion" && (
            <DistribucionLibrerias
              ventas={ventas}
              setVentas={setVentas}
              books={books}
              setBooks={setBooks}
              proveedores={proveedores}
              setProveedores={setProveedores}
              movimientos={movimientos}
              gastos={gastos}
              setGastos={setGastos}
              otrosIngresos={otrosIngresos}
              setOtrosIngresos={setOtrosIngresos}
              usuarioActual={usuarioActual}
              librerias={librerias}
              setLibrerias={setLibrerias}
              tramaInfo={tramaInfo}
              registrarMovimiento={registrarMovimiento}
              initialLibreriaPrivada={libreriaPrivadaActiva}
              onLibreriaPrivadaChange={(lib) => setLibreriaPrivadaActiva(lib)}
            />
          )}

          {page === "accesos" && role === "admin" && (
            <Accesos
              userRole={role}
              accesos={accesos}
              setAccesos={setAccesos}
              books={books}
              ventas={ventas}
              proveedores={proveedores}
              movimientos={movimientos}
              setBooks={setBooks}
              setVentas={setVentas}
              setProveedores={setProveedores}
              setMovimientos={setMovimientos}
              gastos={gastos}
              setGastos={setGastos}
              otrosIngresos={otrosIngresos}
              setOtrosIngresos={setOtrosIngresos}
              onEjecutarRespaldo={() => ejecutarRespaldoJSON("manual")}
              auditLogs={auditLogs}
              onLogAudit={logAuditAction}
              tramaInfo={tramaInfo}
              setTramaInfo={setTramaInfo}
              librerias={librerias}
              setLibrerias={setLibrerias}
              activeTab={accesosTab}
              onTabChange={setAccesosTab}
              onOpenPublicCatalog={() => setIsPublicCatalogView(true)}
            />
          )}
          </ErrorBoundary>
        </main>
      </div>

      {/* MODAL DE CONSULTA DE MESÓN RÁPIDA (F2) */}
      {consultaMesonOpen && (
        <ConsultaMesonModal
          books={books}
          librerias={librerias}
          onClose={() => setConsultaMesonOpen(false)}
          onAddToCart={(book) => {
            setPendingCartBook(book);
            setPage("pos");
            setConsultaMesonOpen(false);
          }}
        />
      )}

      {/* MODAL DE BLOQUEO DE SEGURIDAD POR INACTIVIDAD */}
      {isLocked && (
        <div className="fixed inset-0 z-50 bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 dark:border-slate-700 text-center space-y-4 animate-scaleUp">
            <div className="w-14 h-14 bg-amber-100 dark:bg-amber-900/50 rounded-2xl flex items-center justify-center mx-auto text-amber-600 dark:text-amber-300 shadow-xs">
              <Lock size={28} />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">Terminal Pausado por Inactividad</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Sesión de <span className="font-bold text-purple-700 dark:text-purple-400">{usuarioActual}</span> protegida automáticamente por seguridad de la caja.
              </p>
            </div>
            <form onSubmit={handleUnlock} className="space-y-3">
              {unlockError && (
                <p className="text-xs text-red-600 bg-red-50 dark:bg-red-950/50 p-2 rounded-xl border border-red-200 dark:border-red-900 font-semibold">{unlockError}</p>
              )}
              <Input
                type="password"
                placeholder="Ingresa tu contraseña"
                value={unlockPassword}
                onChange={(e: any) => setUnlockPassword(e.target.value)}
                autoFocus
              />
              <button
                type="submit"
                className="w-full bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold py-2.5 rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5"
              >
                <ShieldCheck size={15} /> Desbloquear Terminal
              </button>
            </form>
            <div className="pt-2 border-t border-gray-100 dark:border-slate-700">
              <button
                type="button"
                onClick={handleLogout}
                className="text-xs text-gray-400 hover:text-red-500 underline transition-colors cursor-pointer"
              >
                Cerrar sesión e ir a pantalla de inicio
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
