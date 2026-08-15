import React, { useState, useEffect, useMemo } from "react";
import {
  Plus,
  ToggleLeft,
  ToggleRight,
  Download,
  Upload,
  RotateCcw,
  Shield,
  CheckCircle,
  KeyRound,
  Pencil,
  ShieldAlert,
  ShieldCheck,
  Lock,
  Users,
  Search,
  UserCheck,
  AlertCircle,
  Building2,
  MapPin,
  Phone,
  Smartphone,
  Mail,
  Globe,
  Instagram,
  Facebook,
  Twitter,
  MessageSquare,
  Clock,
  ExternalLink,
  Save,
  Check,
  BookOpen,
  Sparkles,
  Trash2,
  Activity,
  Zap,
  Wifi
} from "lucide-react";
import { Acceso, Book, Venta, Proveedor, Movimiento, Gasto, OtroIngreso, AuditLog, TramaInfo, LibreriaEntry, RoleType } from "../types";
import { Badge, Modal, Btn, Input, Select } from "./ui";
import { exportBooksToCSV, exportVentasToCSV, exportProveedoresToCSV, exportGastosToCSV, exportFullJSONBackup } from "../utils/exportHelpers";
import { FirebaseSyncPanel } from "./FirebaseSyncPanel";

interface AccesosProps {
  userRole?: RoleType;
  accesos: Acceso[];
  setAccesos: React.Dispatch<React.SetStateAction<Acceso[]>>;
  books: Book[];
  ventas: Venta[];
  proveedores: Proveedor[];
  movimientos: Movimiento[];
  setBooks: React.Dispatch<React.SetStateAction<Book[]>>;
  setVentas: React.Dispatch<React.SetStateAction<Venta[]>>;
  setProveedores: React.Dispatch<React.SetStateAction<Proveedor[]>>;
  setMovimientos: React.Dispatch<React.SetStateAction<Movimiento[]>>;
  gastos?: Gasto[];
  setGastos?: React.Dispatch<React.SetStateAction<Gasto[]>>;
  otrosIngresos?: OtroIngreso[];
  setOtrosIngresos?: React.Dispatch<React.SetStateAction<OtroIngreso[]>>;
  librerias?: LibreriaEntry[];
  setLibrerias?: React.Dispatch<React.SetStateAction<LibreriaEntry[]>>;
  onEjecutarRespaldo?: () => void;
  auditLogs?: AuditLog[];
  onLogAudit?: (accion: string, modulo: string, detalles: string, tipo: "info" | "warning" | "security_alert" | "success") => void;
  tramaInfo?: TramaInfo;
  setTramaInfo?: React.Dispatch<React.SetStateAction<TramaInfo>>;
  activeTab?: "personal" | "datosTrama" | "respaldos" | "sync";
  onTabChange?: (tab: "personal" | "datosTrama" | "respaldos" | "sync") => void;
  onOpenPublicCatalog?: () => void;
}

export function Accesos({
  userRole,
  accesos,
  setAccesos,
  books,
  ventas,
  proveedores,
  movimientos,
  setBooks,
  setVentas,
  setProveedores,
  setMovimientos,
  gastos,
  setGastos,
  otrosIngresos,
  setOtrosIngresos,
  librerias = [],
  setLibrerias,
  auditLogs = [],
  onLogAudit,
  tramaInfo,
  setTramaInfo,
  activeTab = "personal",
  onTabChange,
  onOpenPublicCatalog,
}: AccesosProps) {
  // Manejo de pestaña activa
  const [currentTab, setCurrentTab] = useState<"personal" | "datosTrama" | "respaldos" | "sync">(activeTab);

  useEffect(() => {
    if (activeTab) {
      setCurrentTab(activeTab);
    }
  }, [activeTab]);

  const handleSelectTab = (tab: "personal" | "datosTrama" | "respaldos" | "sync") => {
    setCurrentTab(tab);
    if (onTabChange) {
      onTabChange(tab);
    }
  };

  // Modales Personal
  const [modalNuevo, setModalNuevo] = useState(false);
  const [modalEdit, setModalEdit] = useState<Acceso | null>(null);
  const [modalPassword, setModalPassword] = useState<Acceso | null>(null);

  // Forms
  const [form, setForm] = useState({ id: 0, nombre: "", email: "", clave: "", rol: "vendedor" as "admin" | "admin_secundario" | "vendedor" });
  const [passForm, setPassForm] = useState({ nuevaClave: "", confirmarClave: "" });

  const [error, setError] = useState("");
  const [importStatus, setImportStatus] = useState("");

  // Filters & Search Personal
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("todos");

  // Audit filters
  const [auditSearch, setAuditSearch] = useState("");
  const [auditFilterTipo, setAuditFilterTipo] = useState<string>("todos");

  // ESTADO DE DATOS DE TRAMA FORM
  const defaultTrama: TramaInfo = {
    nombre: "Trama Librerías",
    rut: "77.654.321-K",
    direccion: "Av. Cartagena 330 interior.",
    ciudad: "Cartagena",
    telefono: "+56 9 6449 0175",
    celular: "+56 9 6449 0175",
    email: "contacto@tramalibros.cl",
    contacto: "Dirección General Trama",
    sitioWeb: "www.tramalibros.cl",
    horarioAtencion: "Lunes a Viernes de 10:00 a 19:30 hrs | Sábados de 11:00 a 16:00 hrs",
    instagram: "@trama.librerias",
    facebook: "TramaLibreriasChile",
    twitter: "@TramaLibros",
    tiktok: "@tramalibrerias",
    mapaEmbedUrl: "https://maps.google.com/maps?q=Av.%20Cartagena%20330%20interior%2C%20Cartagena&t=&z=15&ie=UTF8&iwloc=&output=embed",
    coordenadasMapa: "Av. Cartagena 330 interior, Cartagena, Valparaíso, Chile",
    porcentajeComisionStandard: 10,
    observaciones: "Casa Matriz, Distribución y Administración Central de la Red Trama Librerías."
  };

  const [tramaForm, setTramaForm] = useState<TramaInfo>(() => ({
    ...defaultTrama,
    ...(tramaInfo || {})
  }));

  const [tramaSaveSuccess, setTramaSaveSuccess] = useState(false);
  const [errorTrama, setErrorTrama] = useState("");

  useEffect(() => {
    if (tramaInfo) {
      setTramaForm(prev => ({
        ...defaultTrama,
        ...tramaInfo
      }));
    }
  }, [tramaInfo]);

  const visibleAccesos = useMemo(() => {
    return accesos.filter(a => !a.nombre.toLowerCase().includes("admin general") && a.email.toLowerCase() !== "admin@tramalibros.cl");
  }, [accesos]);

  // KPI Calculations Personal
  const totalUsuarios = visibleAccesos.length;
  const activosCount = visibleAccesos.filter(a => a.activo).length;
  const adminsGeneralCount = visibleAccesos.filter(a => a.rol === "admin").length;
  const adminsSecundariosCount = visibleAccesos.filter(a => a.rol === "admin_secundario").length;
  const adminsCount = adminsGeneralCount + adminsSecundariosCount;
  const vendedoresCount = visibleAccesos.filter(a => a.rol === "vendedor").length;

  const toggleActivo = (id: number) => {
    const target = accesos.find(a => a.id === id);
    if (!target) return;

    const nextState = !target.activo;
    setAccesos(prev => prev.map(a => (a.id === id ? { ...a, activo: nextState } : a)));

    if (onLogAudit) {
      onLogAudit(
        nextState ? "Activación de Usuario" : "Desactivación de Usuario",
        "Personal",
        `Cuenta de ${target.nombre} (${target.email}) ${nextState ? "activada" : "desactivada"}`,
        nextState ? "info" : "warning"
      );
    }
  };

  const crearAcceso = () => {
    if (!form.nombre.trim()) return setError("El nombre completo es obligatorio.");
    if (!form.email.trim() || !form.email.includes("@")) return setError("Ingresa un correo electrónico válido.");
    if (accesos.some(a => a.email.toLowerCase() === form.email.trim().toLowerCase())) return setError("Ya existe un usuario con este correo electrónico.");
    if (!form.clave || form.clave.length < 4) return setError("La contraseña debe tener al menos 4 caracteres por seguridad.");

    const nuevo: Acceso = {
      id: Math.max(0, ...accesos.map(a => a.id)) + 1,
      nombre: form.nombre.trim(),
      email: form.email.trim().toLowerCase(),
      clave: form.clave.trim(),
      rol: form.rol,
      activo: true,
      ultimo: "Nunca",
    };

    setAccesos(prev => [...prev, nuevo]);
    if (onLogAudit) {
      onLogAudit("Creación de Usuario", "Personal", `Nuevo usuario registrado: ${nuevo.nombre} con rol ${nuevo.rol}`, "success");
    }

    setModalNuevo(false);
    setForm({ id: 0, nombre: "", email: "", clave: "", rol: "vendedor" });
    setError("");
  };

  const guardarEdicionPerfil = () => {
    if (!form.nombre.trim()) return setError("El nombre completo es obligatorio.");
    if (!form.email.trim() || !form.email.includes("@")) return setError("Ingresa un correo electrónico válido.");

    setAccesos(prev =>
      prev.map(a =>
        a.id === form.id
          ? { ...a, nombre: form.nombre.trim(), email: form.email.trim().toLowerCase(), rol: form.rol }
          : a
      )
    );

    if (onLogAudit) {
      onLogAudit("Actualización de Usuario", "Personal", `Perfil actualizado para ${form.nombre} (${form.email})`, "info");
    }

    setModalEdit(null);
    setError("");
  };

  const guardarNuevaPassword = () => {
    if (!modalPassword) return;
    if (!passForm.nuevaClave || passForm.nuevaClave.length < 4) {
      return setError("La nueva contraseña debe tener al menos 4 caracteres.");
    }
    if (passForm.nuevaClave !== passForm.confirmarClave) {
      return setError("Las contraseñas no coinciden. Verifícalas cuidadosamente.");
    }

    setAccesos(prev =>
      prev.map(a => (a.id === modalPassword.id ? { ...a, clave: passForm.nuevaClave.trim() } : a))
    );

    if (onLogAudit) {
      onLogAudit(
        "Cambio de Contraseña",
        "Seguridad",
        `Contraseña restablecida correctamente para el usuario ${modalPassword.nombre} (${modalPassword.email})`,
        "security_alert"
      );
    }

    setModalPassword(null);
    setPassForm({ nuevaClave: "", confirmarClave: "" });
    setError("");
  };

  const guardarDatosTramaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorTrama("");

    if (!tramaForm.nombre.trim()) {
      return setErrorTrama("El nombre oficial de la empresa es obligatorio.");
    }
    if (!tramaForm.direccion.trim()) {
      return setErrorTrama("La dirección física es obligatoria.");
    }

    if (setTramaInfo) {
      setTramaInfo(tramaForm);
    }

    if (onLogAudit) {
      onLogAudit(
        "Actualización Datos de Trama",
        "Configuración",
        `Datos corporativos de Trama actualizados: ${tramaForm.nombre}, ${tramaForm.direccion}, Cel/WhatsApp: ${tramaForm.celular || "N/A"}`,
        "success"
      );
    }

    setTramaSaveSuccess(true);
    setTimeout(() => setTramaSaveSuccess(false), 3500);
  };

  const exportarJSON = () => {
    const data = {
      version: "2.5",
      fechaExportacion: new Date().toISOString(),
      tramaInfo: tramaForm,
      books,
      ventas,
      gastos: gastos || [],
      otrosIngresos: otrosIngresos || [],
      proveedores,
      accesos,
      movimientos,
      librerias: librerias || [],
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `respaldo-libreria-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importarJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportStatus("");

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string);
        if (!data.books || !Array.isArray(data.books)) throw new Error("Archivo de respaldo inválido.");

        if (window.confirm("¿Deseas restaurar la base de datos completa con los datos de este respaldo?")) {
          setBooks(data.books || []);
          setVentas(data.ventas || []);
          setProveedores(data.proveedores || []);
          setAccesos(data.accesos || []);
          setMovimientos(data.movimientos || []);
          if (data.tramaInfo && setTramaInfo) {
            setTramaInfo(data.tramaInfo);
            setTramaForm(data.tramaInfo);
          }
          if (data.librerias && Array.isArray(data.librerias) && setLibrerias) {
            setLibrerias(data.librerias);
          }
          if (data.gastos && Array.isArray(data.gastos) && setGastos) setGastos(data.gastos);
          if (data.otrosIngresos && Array.isArray(data.otrosIngresos) && setOtrosIngresos) setOtrosIngresos(data.otrosIngresos);
          setImportStatus("✓ Base de datos restaurada con éxito.");
          if (onLogAudit) {
            onLogAudit("Restauración de Respaldo", "Mantenimiento", "Base de datos restaurada desde un archivo de respaldo JSON", "warning");
          }
        }
      } catch (err) {
        setImportStatus("❌ El archivo seleccionado no es un respaldo válido.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const resetDatos = () => {
    if (window.confirm("¿Estás seguro de restablecer el sistema a los datos iniciales de fábrica? Esto eliminará los cambios locales.")) {
      ["trama_books", "trama_ventas", "trama_accesos", "trama_proveedores", "trama_movimientos", "trama_info_data", "trama_librerias_data", "trama_gastos", "trama_otros_ingresos"].forEach(k => window.localStorage.removeItem(k));
      if (onLogAudit) {
        onLogAudit("Restablecimiento de Fábrica", "Mantenimiento", "Sistema restablecido a los valores por defecto", "security_alert");
      }
      window.location.reload();
    }
  };

  const limpiarDatosEjemplo = () => {
    if (window.confirm("¿Estás seguro de realizar la limpieza de datos de ejemplo?\n\nEsta acción vaciará el inventario de prueba, ventas de muestra, movimientos y gastos iniciales de demo, dejando la base de datos limpia para comenzar a registrar el catálogo real en producción. Tus usuarios y datos de Trama se conservarán.")) {
      setBooks([]);
      setVentas([]);
      setMovimientos([]);
      if (setGastos) setGastos([]);
      if (setOtrosIngresos) setOtrosIngresos([]);
      if (onLogAudit) {
        onLogAudit("Limpieza de Datos de Ejemplo", "Mantenimiento", "Se vaciaron los datos de prueba/ejemplo para iniciar el modo seguro en producción real.", "warning");
      }
      setImportStatus("✓ Se limpiaron los datos de ejemplo exitosamente. El sistema está 100% listo para producción.");
    }
  };

  const filteredAccesos = useMemo(() => {
    return visibleAccesos.filter(a => {
      const matchRole = roleFilter === "todos" || a.rol === roleFilter;
      const q = searchTerm.toLowerCase();
      const matchSearch = !q || a.nombre.toLowerCase().includes(q) || a.email.toLowerCase().includes(q);
      return matchRole && matchSearch;
    });
  }, [visibleAccesos, searchTerm, roleFilter]);

  const cleanCelularWA = (tramaForm.celular || tramaForm.telefono || "").replace(/[^0-9]/g, "");

  return (
    <div className="space-y-5">
      {/* NAVEGACIÓN POR PESTAÑAS (PERSONAL, DATOS DE TRAMA, RESPALDOS, DIAGNÓSTICO FIREBASE) */}
      <div className="flex items-center gap-1.5 border-b border-gray-200 pb-3 overflow-x-auto">
        <button
          onClick={() => handleSelectTab("personal")}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            currentTab === "personal"
              ? "bg-purple-900 text-white shadow-xs"
              : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
          }`}
        >
          <Users size={15} />
          <span>Personal y Cuentas ({totalUsuarios})</span>
        </button>

        <button
          onClick={() => handleSelectTab("datosTrama")}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            currentTab === "datosTrama"
              ? "bg-amber-600 text-white shadow-xs"
              : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
          }`}
        >
          <Building2 size={15} />
          <span>Datos de Trama & Ubicación</span>
        </button>

        <button
          onClick={() => handleSelectTab("respaldos")}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            currentTab === "respaldos"
              ? "bg-emerald-700 text-white shadow-xs"
              : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
          }`}
        >
          <ShieldCheck size={15} />
          <span>Respaldos y Seguridad</span>
        </button>

        <button
          onClick={() => handleSelectTab("sync")}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            currentTab === "sync"
              ? "bg-stone-900 text-white shadow-xs"
              : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
          }`}
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <Activity size={15} className={currentTab === "sync" ? "text-amber-400" : "text-purple-600"} />
          <span>Diagnóstico Nube & Firestore</span>
        </button>
      </div>

      {/* PESTAÑA 1: PERSONAL Y CUENTAS */}
      {currentTab === "personal" && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* TARJETAS RESUMEN DE PERSONAL Y SEGURIDAD */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white p-3.5 rounded-xl border border-gray-100 shadow-2xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Total Personal</p>
                <p className="text-xl font-black text-gray-900 mt-0.5">{totalUsuarios}</p>
                <p className="text-[10px] text-gray-400 font-medium">{activosCount} activos / {totalUsuarios - activosCount} inactivos</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
                <Users size={20} />
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-gray-100 shadow-2xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Administradores</p>
                <p className="text-xl font-black text-purple-900 mt-0.5">{adminsCount}</p>
                <p className="text-[10px] text-purple-600 font-medium">Control total y finanzas</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <Shield size={20} />
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-gray-100 shadow-2xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Vendedores POS</p>
                <p className="text-xl font-black text-blue-900 mt-0.5">{vendedoresCount}</p>
                <p className="text-[10px] text-blue-600 font-medium">Caja e Inventario</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <UserCheck size={20} />
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-gray-100 shadow-2xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Estado Seguridad</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <p className="text-sm font-bold text-emerald-800">Cifrado Activo</p>
                </div>
                <p className="text-[10px] text-gray-400 font-medium">Auditoría en tiempo real</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Lock size={20} />
              </div>
            </div>
          </div>

          {/* DIRECTORIO DE USUARIOS Y PERMISOS DE ACCESO */}
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-2xs">
            <div className="px-4 py-3 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <Users size={16} className="text-purple-700" /> Personal y Cuentas de Acceso
                </h3>
                <p className="text-xs text-gray-400">Gestión segura de credenciales, roles y estado del equipo</p>
              </div>

              <div className="flex flex-wrap items-center gap-2 ml-auto">
                <div className="relative">
                  <Search size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar por nombre o email..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="text-xs pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500 w-48"
                  />
                </div>

                <select
                  value={roleFilter}
                  onChange={e => setRoleFilter(e.target.value)}
                  className="text-xs px-2.5 py-1.5 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-purple-500 text-gray-700"
                >
                  <option value="todos">Todos los roles</option>
                  <option value="admin">Admin General</option>
                  <option value="admin_secundario">Admin Secundario</option>
                  <option value="vendedor">Vendedores POS</option>
                </select>

                <Btn onClick={() => { setError(""); setModalNuevo(true); }} variant="primary">
                  <Plus size={14} /> Nuevo Usuario
                </Btn>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs min-w-[700px]">
                <thead className="bg-gray-50 border-b border-gray-100 text-gray-400 font-medium text-left">
                  <tr>
                    <th className="px-4 py-2.5">Usuario / Personal</th>
                    <th className="px-4 py-2.5">Correo Electrónico</th>
                    <th className="px-4 py-2.5">Rol de Acceso</th>
                    <th className="px-4 py-2.5">Último Acceso</th>
                    <th className="px-4 py-2.5">Estado</th>
                    <th className="px-4 py-2.5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 font-medium">
                  {filteredAccesos.map(a => (
                    <tr key={a.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-900 font-black flex items-center justify-center text-xs shrink-0">
                            {a.nombre.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">{a.nombre}</p>
                            <p className="text-[10px] text-gray-400 font-mono">ID: ACC-00{a.id}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3 text-gray-600 font-mono">{a.email}</td>

                      <td className="px-4 py-3">
                        {a.rol === "admin" ? (
                          <Badge variant="purple">🛡️ Admin. General</Badge>
                        ) : a.rol === "admin_secundario" ? (
                          <Badge variant="amber">🛡️ Admin. Secundario</Badge>
                        ) : (
                          <Badge variant="blue">🛍️ Vendedor POS</Badge>
                        )}
                      </td>

                      <td className="px-4 py-3 text-gray-500 text-[11px] font-mono">{a.ultimo || "Reciente"}</td>

                      <td className="px-4 py-3">
                        {a.activo ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Activo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-gray-500 font-semibold bg-gray-100 px-2 py-0.5 rounded-full">
                            Inactivo
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setModalEdit(a);
                              setForm({ id: a.id, nombre: a.nombre, email: a.email, clave: "", rol: a.rol });
                              setError("");
                            }}
                            className="text-gray-600 hover:text-purple-700 p-1.5 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer"
                            title="Editar datos de perfil"
                          >
                            <Pencil size={15} />
                          </button>

                          <button
                            onClick={() => {
                              setModalPassword(a);
                              setPassForm({ nuevaClave: "", confirmarClave: "" });
                              setError("");
                            }}
                            className="text-gray-600 hover:text-amber-700 p-1.5 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                            title="Restablecer o cambiar contraseña"
                          >
                            <KeyRound size={15} />
                          </button>

                          <button
                            onClick={() => toggleActivo(a.id)}
                            className="text-gray-500 hover:text-gray-800 p-1 transition-colors inline-flex items-center cursor-pointer"
                            title={a.activo ? "Desactivar usuario" : "Activar usuario"}
                          >
                            {a.activo ? (
                              <ToggleRight size={22} className="text-green-600" />
                            ) : (
                              <ToggleLeft size={22} className="text-gray-300" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {filteredAccesos.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-400 italic">
                        No se encontraron usuarios con los criterios de búsqueda.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* PESTAÑA 2: DATOS DE TRAMA & UBICACIÓN (PÁGINA SOLICITADA) */}
      {currentTab === "datosTrama" && (
        <form onSubmit={guardarDatosTramaSubmit} className="space-y-5 animate-in fade-in duration-200">
          
          {/* BANNER DE NOTIFICACIÓN DE ÉXITO */}
          {tramaSaveSuccess && (
            <div className="bg-emerald-800 text-white p-3.5 rounded-xl shadow-md flex items-center justify-between animate-fadeIn">
              <div className="flex items-center gap-2 text-xs font-bold">
                <CheckCircle size={18} className="text-amber-300" />
                <span>✓ ¡Datos corporativos de Trama guardados e integrados correctamente en el sistema!</span>
              </div>
              {onOpenPublicCatalog && (
                <button
                  type="button"
                  onClick={onOpenPublicCatalog}
                  className="bg-white/20 hover:bg-white/30 text-white text-xs px-3 py-1 rounded-lg font-bold transition-colors cursor-pointer"
                >
                  Ver Catálogo Público 🌐
                </button>
              )}
            </div>
          )}

          {errorTrama && (
            <div className="bg-red-50 text-red-700 p-3 rounded-xl border border-red-200 text-xs font-bold flex items-center gap-2">
              <AlertCircle size={16} className="text-red-500 shrink-0" />
              <span>{errorTrama}</span>
            </div>
          )}

          {/* CABECERA PÁGINA DATOS DE TRAMA */}
          <div className="bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-indigo-500/10 p-4 rounded-2xl border border-amber-200/80 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-600 text-white flex items-center justify-center shadow-md shrink-0">
                <Building2 size={24} />
              </div>
              <div>
                <h3 className="text-base font-black text-gray-900 flex items-center gap-2">
                  <span>Página de Datos de Trama Librerías</span>
                  <span className="text-[10px] bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full font-bold">
                    Oficial
                  </span>
                </h3>
                <p className="text-xs text-gray-600 mt-0.5">
                  Dirección, mapa interactivo, redes sociales, teléfono, celular / WhatsApp y horarios sincronizados en tiempo real.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 ml-auto">
              {onOpenPublicCatalog && (
                <button
                  type="button"
                  onClick={onOpenPublicCatalog}
                  className="px-3.5 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-purple-900 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                >
                  <BookOpen size={14} className="text-purple-700" />
                  <span>Ver Ficha en Catálogo</span>
                </button>
              )}

              <button
                type="submit"
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-black rounded-xl flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
              >
                <Save size={15} />
                <span>Guardar Datos de Trama</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* BLOQUE 1: IDENTIFICACIÓN Y UBICACIÓN FÍSICA CON MAPA */}
            <div className="space-y-4">
              {/* DATOS BÁSICOS CORPORATIVOS */}
              <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-2xs space-y-3">
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-2">
                  <Building2 size={16} className="text-amber-600" /> Identificación Corporativa Trama
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Nombre Comercial de la Librería *"
                    value={tramaForm.nombre}
                    onChange={(e: any) => setTramaForm(prev => ({ ...prev, nombre: e.target.value }))}
                    placeholder="Ej: Trama Librerías"
                  />
                  <Input
                    label="RUT de la Empresa *"
                    value={tramaForm.rut}
                    onChange={(e: any) => setTramaForm(prev => ({ ...prev, rut: e.target.value }))}
                    placeholder="77.654.321-K"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Representante / Contacto Principal"
                    value={tramaForm.contacto}
                    onChange={(e: any) => setTramaForm(prev => ({ ...prev, contacto: e.target.value }))}
                    placeholder="Dirección General Trama"
                  />
                  <Input
                    label="% Comisión Estándar Distribución"
                    type="number"
                    value={tramaForm.porcentajeComisionStandard}
                    onChange={(e: any) => setTramaForm(prev => ({ ...prev, porcentajeComisionStandard: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
              </div>

              {/* DIRECCIÓN Y MAPA INTERACTIVO */}
              <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                  <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                    <MapPin size={16} className="text-red-600" /> Ubicación y Mapa Interactivo
                  </h4>
                  {tramaForm.coordenadasMapa || tramaForm.direccion ? (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(tramaForm.coordenadasMapa || tramaForm.direccion)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-purple-700 hover:text-purple-900 font-bold flex items-center gap-1 underline"
                    >
                      <ExternalLink size={12} /> Google Maps
                    </a>
                  ) : null}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Dirección Física *"
                    value={tramaForm.direccion}
                    onChange={(e: any) => setTramaForm(prev => ({ ...prev, direccion: e.target.value }))}
                    placeholder="Ej: Av. Providencia 1234, Local 5"
                  />
                  <Input
                    label="Ciudad / Comuna *"
                    value={tramaForm.ciudad}
                    onChange={(e: any) => setTramaForm(prev => ({ ...prev, ciudad: e.target.value }))}
                    placeholder="Santiago, Chile"
                  />
                </div>

                <Input
                  label="Referencia / Coordenadas de Ubicación para GPS"
                  value={tramaForm.coordenadasMapa || ""}
                  onChange={(e: any) => setTramaForm(prev => ({ ...prev, coordenadasMapa: e.target.value }))}
                  placeholder="Av. Providencia 1234, Local 5, Providencia, Santiago"
                />

                <Input
                  label="URL Embed de Google Maps (Iframe Source)"
                  value={tramaForm.mapaEmbedUrl || ""}
                  onChange={(e: any) => setTramaForm(prev => ({ ...prev, mapaEmbedUrl: e.target.value }))}
                  placeholder="https://maps.google.com/maps?q=...&output=embed"
                />

                {/* PREVISUALIZADOR DEL MAPA */}
                <div className="space-y-1 pt-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                    Previsualización del Mapa de Ubicación
                  </label>
                  <div className="w-full h-52 bg-slate-100 rounded-xl overflow-hidden border border-gray-200 relative flex items-center justify-center">
                    {tramaForm.mapaEmbedUrl ? (
                      <iframe
                        src={tramaForm.mapaEmbedUrl}
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        allowFullScreen={false}
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        title="Mapa Trama Librerías"
                        className="w-full h-full"
                      />
                    ) : (
                      <div className="text-center p-4 space-y-2">
                        <MapPin size={32} className="mx-auto text-red-500 animate-bounce" />
                        <p className="text-xs font-bold text-gray-700">{tramaForm.direccion || "Av. Providencia 1234, Local 5"}, {tramaForm.ciudad || "Santiago"}</p>
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(tramaForm.coordenadasMapa || tramaForm.direccion)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white font-bold text-xs rounded-lg shadow-xs hover:bg-red-700 transition-all"
                        >
                          <ExternalLink size={13} /> Abrir Mapa en Nueva Pestaña
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* BLOQUE 2: TELÉFONOS, WHATSAPP, REDES SOCIALES Y HORARIOS */}
            <div className="space-y-4">
              {/* CONTACTO DIRECTO, CELULAR Y HORARIOS */}
              <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-2xs space-y-3">
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-2">
                  <Phone size={16} className="text-emerald-600" /> Teléfonos, WhatsApp & Horarios
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Teléfono Fijo Matriz"
                    value={tramaForm.telefono}
                    onChange={(e: any) => setTramaForm(prev => ({ ...prev, telefono: e.target.value }))}
                    placeholder="+56 2 2687 1200"
                  />

                  <div className="space-y-1">
                    <Input
                      label="Celular / WhatsApp Directo *"
                      value={tramaForm.celular || ""}
                      onChange={(e: any) => setTramaForm(prev => ({ ...prev, celular: e.target.value }))}
                      placeholder="+56 9 8765 4321"
                    />
                    {cleanCelularWA && (
                      <a
                        href={`https://wa.me/${cleanCelularWA}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-emerald-700 hover:text-emerald-900 font-bold flex items-center gap-1 mt-0.5"
                      >
                        <MessageSquare size={12} className="text-emerald-600" />
                        <span>Probar enlace WhatsApp ({cleanCelularWA})</span>
                      </a>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Correo Electrónico Oficial *"
                    type="email"
                    value={tramaForm.email}
                    onChange={(e: any) => setTramaForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="contacto@tramalibros.cl"
                  />
                  <Input
                    label="Sitio Web Oficial"
                    value={tramaForm.sitioWeb || ""}
                    onChange={(e: any) => setTramaForm(prev => ({ ...prev, sitioWeb: e.target.value }))}
                    placeholder="www.tramalibros.cl"
                  />
                </div>

                <Input
                  label="Horario de Atención de la Librería *"
                  value={tramaForm.horarioAtencion || ""}
                  onChange={(e: any) => setTramaForm(prev => ({ ...prev, horarioAtencion: e.target.value }))}
                  placeholder="Lunes a Viernes de 10:00 a 19:30 hrs | Sábados de 11:00 a 16:00 hrs"
                />
              </div>

              {/* REDES SOCIALES OFICIALES */}
              <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-2xs space-y-3">
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-2">
                  <Instagram size={16} className="text-rose-600" /> Redes Sociales Oficiales Trama
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Instagram"
                    value={tramaForm.instagram || ""}
                    onChange={(e: any) => setTramaForm(prev => ({ ...prev, instagram: e.target.value }))}
                    placeholder="@tramalibrerias"
                  />
                  <Input
                    label="Facebook"
                    value={tramaForm.facebook || ""}
                    onChange={(e: any) => setTramaForm(prev => ({ ...prev, facebook: e.target.value }))}
                    placeholder="TramaLibreriasChile"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Twitter / X"
                    value={tramaForm.twitter || ""}
                    onChange={(e: any) => setTramaForm(prev => ({ ...prev, twitter: e.target.value }))}
                    placeholder="@TramaLibros"
                  />
                  <Input
                    label="TikTok"
                    value={tramaForm.tiktok || ""}
                    onChange={(e: any) => setTramaForm(prev => ({ ...prev, tiktok: e.target.value }))}
                    placeholder="@tramalibrerias"
                  />
                </div>
              </div>

              {/* OBSERVACIONES */}
              <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-2xs space-y-2">
                <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider block">
                  Observaciones Corporativas de la Red
                </label>
                <textarea
                  value={tramaForm.observaciones || ""}
                  onChange={(e) => setTramaForm(prev => ({ ...prev, observaciones: e.target.value }))}
                  rows={3}
                  className="w-full text-xs p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 font-medium"
                  placeholder="Información adicional sobre la casa matriz y red de librerías..."
                />
              </div>

              {/* BOTÓN GUARDAR AL FINAL DE PÁGINA */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="submit"
                  className="w-full sm:w-auto px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Save size={16} />
                  <span>Guardar Datos de Trama</span>
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* PESTAÑA 3: RESPALDOS, AUDITORÍA Y SEGURIDAD */}
      {currentTab === "respaldos" && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* ESTADO DE SINCRONIZACIÓN EN TIEMPO REAL FIREBASE */}
          <FirebaseSyncPanel />

          {/* REGISTRO DE AUDITORÍA Y EVENTOS DE SEGURIDAD */}
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-2xs">
            <div className="px-4 py-3 border-b border-gray-100 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-purple-600 shrink-0" />
                <div>
                  <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    Registro de Auditoría y Eventos de Seguridad
                    <span className="text-[10px] font-extrabold bg-purple-100 text-purple-900 px-2 py-0.5 rounded-md border border-purple-200">
                      Hora Chile 🇨🇱
                    </span>
                  </h3>
                  <p className="text-xs text-gray-400">Historial en tiempo real en zona horaria oficial de Chile (America/Santiago)</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Buscar en auditoría..."
                  value={auditSearch}
                  onChange={e => setAuditSearch(e.target.value)}
                  className="text-xs px-2.5 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500 w-44"
                />
                <select
                  value={auditFilterTipo}
                  onChange={e => setAuditFilterTipo(e.target.value)}
                  className="text-xs px-2.5 py-1.5 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                >
                  <option value="todos">Todos los eventos</option>
                  <option value="security_alert">Alertas de Seguridad</option>
                  <option value="success">Operaciones Exitosas</option>
                  <option value="warning">Advertencias / Cambios</option>
                  <option value="info">Información General</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto max-h-80 overflow-y-auto">
              <table className="w-full text-xs min-w-[650px]">
                <thead className="sticky top-0 bg-gray-50 border-b border-gray-100 text-gray-400 font-medium text-left z-10">
                  <tr>
                    <th className="px-4 py-2.5">Fecha y Hora (Chile 🇨🇱)</th>
                    <th className="px-4 py-2.5">Usuario</th>
                    <th className="px-4 py-2.5">Acción</th>
                    <th className="px-4 py-2.5">Módulo</th>
                    <th className="px-4 py-2.5">Detalles</th>
                    <th className="px-4 py-2.5 text-right">Tipo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 font-mono">
                  {auditLogs
                    .filter(log => {
                      const matchTipo = auditFilterTipo === "todos" || log.tipo === auditFilterTipo;
                      const q = auditSearch.toLowerCase();
                      const matchQ =
                        !q ||
                        log.usuario.toLowerCase().includes(q) ||
                        log.accion.toLowerCase().includes(q) ||
                        log.modulo.toLowerCase().includes(q) ||
                        log.detalles.toLowerCase().includes(q);
                      return matchTipo && matchQ;
                    })
                    .map((log, idx) => (
                      <tr key={`${log.id}-${idx}`} className="hover:bg-gray-50/80 transition-colors">
                        <td className="px-4 py-2 text-gray-500 whitespace-nowrap">{log.fechaHora}</td>
                        <td className="px-4 py-2 font-semibold text-gray-900 whitespace-nowrap">{log.usuario}</td>
                        <td className="px-4 py-2 font-bold text-purple-900 whitespace-nowrap">{log.accion}</td>
                        <td className="px-4 py-2 text-gray-600 whitespace-nowrap">{log.modulo}</td>
                        <td className="px-4 py-2 text-gray-700 max-w-xs truncate">{log.detalles}</td>
                        <td className="px-4 py-2 text-right whitespace-nowrap">
                          {log.tipo === "security_alert" && <Badge variant="red">⚠️ Alerta</Badge>}
                          {log.tipo === "success" && <Badge variant="green">✓ Éxito</Badge>}
                          {log.tipo === "warning" && <Badge variant="amber">⚡ Cambio</Badge>}
                          {log.tipo === "info" && <Badge variant="gray">ℹ Info</Badge>}
                        </td>
                      </tr>
                    ))}
                  {auditLogs.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-6 text-center text-gray-400 italic">
                        No hay registros de auditoría aún.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* EXPORTACIÓN EXCEL / CSV Y CENTRO DE RESPALDOS */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-2xs space-y-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold text-gray-900">Centro de Exportaciones en Excel (CSV) y Respaldos</h3>
                <Badge variant="green">Seguridad Total</Badge>
              </div>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Descarga copias de seguridad de tus datos en hojas de cálculo compatibles con Excel en cualquier momento, o exporta/restaura la base de datos completa en formato JSON.
              </p>
            </div>

            {/* SECCIÓN 1: EXPORTACIONES EXCEL DE MÓDULOS */}
            <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-3">
              <h4 className="text-xs font-bold text-stone-800 uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen size={14} className="text-purple-700" /> Exportar Planillas para Microsoft Excel / Google Sheets
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                <button
                  type="button"
                  onClick={() => exportBooksToCSV(books)}
                  className="px-3.5 py-2.5 bg-white hover:bg-purple-50 text-purple-900 border border-purple-200 rounded-xl font-bold text-xs flex items-center justify-between transition-all cursor-pointer shadow-2xs group"
                >
                  <span className="flex items-center gap-2">
                    <Download size={14} className="text-purple-600 group-hover:scale-110 transition-transform" />
                    <span>Inventario Libros</span>
                  </span>
                  <span className="text-[10px] bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded font-black">{books.length}</span>
                </button>

                <button
                  type="button"
                  onClick={() => exportVentasToCSV(ventas)}
                  className="px-3.5 py-2.5 bg-white hover:bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-xl font-bold text-xs flex items-center justify-between transition-all cursor-pointer shadow-2xs group"
                >
                  <span className="flex items-center gap-2">
                    <Download size={14} className="text-emerald-600 group-hover:scale-110 transition-transform" />
                    <span>Historial Ventas</span>
                  </span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-black">{ventas.length}</span>
                </button>

                <button
                  type="button"
                  onClick={() => exportProveedoresToCSV(proveedores)}
                  className="px-3.5 py-2.5 bg-white hover:bg-amber-50 text-amber-900 border border-amber-200 rounded-xl font-bold text-xs flex items-center justify-between transition-all cursor-pointer shadow-2xs group"
                >
                  <span className="flex items-center gap-2">
                    <Download size={14} className="text-amber-600 group-hover:scale-110 transition-transform" />
                    <span>Proveedores</span>
                  </span>
                  <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-black">{proveedores.length}</span>
                </button>

                <button
                  type="button"
                  onClick={() => exportGastosToCSV(gastos || [])}
                  className="px-3.5 py-2.5 bg-white hover:bg-rose-50 text-rose-900 border border-rose-200 rounded-xl font-bold text-xs flex items-center justify-between transition-all cursor-pointer shadow-2xs group"
                >
                  <span className="flex items-center gap-2">
                    <Download size={14} className="text-rose-600 group-hover:scale-110 transition-transform" />
                    <span>Gastos Operativos</span>
                  </span>
                  <span className="text-[10px] bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded font-black">{(gastos || []).length}</span>
                </button>
              </div>
            </div>

            {/* SECCIÓN 2: RESPALDO INTEGRAL JSON */}
            <div className="pt-2 border-t border-gray-100 space-y-3">
              <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck size={15} className="text-emerald-600" /> Respaldo Integral y Copia de Restauración (JSON)
              </h4>

              <div className="flex flex-wrap gap-2.5 items-center">
                <button
                  type="button"
                  onClick={() => exportFullJSONBackup({
                    books,
                    ventas,
                    proveedores,
                    movimientos,
                    gastos: gastos || [],
                    otrosIngresos: otrosIngresos || [],
                    accesos,
                    librerias,
                    tramaInfo,
                    auditLogs
                  })}
                  className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-2"
                >
                  <Download size={14} />
                  <span>Descargar Copia Completa (JSON)</span>
                </button>

                <label className="inline-flex items-center gap-2 text-xs px-4 py-2.5 border border-gray-300 bg-white hover:bg-gray-50 text-gray-800 rounded-xl font-bold cursor-pointer transition-colors shadow-2xs">
                  <Upload size={14} className="text-purple-600" />
                  <span>Restaurar Desde Archivo JSON</span>
                  <input type="file" accept=".json" onChange={importarJSON} style={{ position: "fixed", top: "-9999px", left: "-9999px" }} />
                </label>

                <Btn onClick={resetDatos} variant="danger" className="ml-auto">
                  <RotateCcw size={13} /> Restablecer Fábrica
                </Btn>
              </div>

              {importStatus && <p className="text-xs font-semibold text-emerald-800 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">{importStatus}</p>}
            </div>
          </div>

          {/* LIMPIEZA DE DATOS DE EJEMPLO Y ACTIVACIÓN MODO SEGURO */}
          <div className="bg-amber-50/80 rounded-2xl border border-amber-200/90 p-4 shadow-2xs space-y-3">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-amber-100 text-amber-800 rounded-xl shrink-0">
                <Sparkles size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-extrabold text-amber-950">Limpieza de Datos de Ejemplo (Preparar Modo Seguro)</h3>
                  <Badge variant="amber">Producción Real</Badge>
                </div>
                <p className="text-xs text-amber-900/90 mt-1 leading-relaxed">
                  Vacía los libros de prueba, ventas de muestra, movimientos y gastos de demo para comenzar con una base de datos limpia lista para cargar el inventario real en producción. Tus cuentas de usuario y la configuración corporativa se mantendrán intactas.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end pt-1">
              <button
                type="button"
                onClick={limpiarDatosEjemplo}
                className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-black rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer border border-amber-500"
              >
                <Trash2 size={14} />
                <span>Vaciar / Limpiar Datos de Ejemplo</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PESTAÑA 4: DIAGNÓSTICO NUBE & FIRESTORE */}
      {currentTab === "sync" && (
        <div className="space-y-5 animate-in fade-in duration-200">
          <FirebaseSyncPanel />
        </div>
      )}

      {/* MODAL NUEVO USUARIO */}
      {modalNuevo && (
        <Modal
          title="Agregar Usuario al Personal"
          onClose={() => setModalNuevo(false)}
          footer={
            <>
              <Btn onClick={() => setModalNuevo(false)}>Cancelar</Btn>
              <Btn onClick={crearAcceso} variant="primary">
                <CheckCircle size={13} /> Crear Usuario
              </Btn>
            </>
          }
        >
          <div className="space-y-3">
            {error && (
              <div className="text-xs text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-100 flex items-center gap-2 font-medium">
                <AlertCircle size={14} className="shrink-0 text-red-500" />
                <span>{error}</span>
              </div>
            )}
            <Input label="Nombre Completo *" value={form.nombre} onChange={(e: any) => setForm(prev => ({ ...prev, nombre: e.target.value }))} placeholder="Ej: Sofía Vendedora" />
            <Input label="Correo Electrónico *" type="email" value={form.email} onChange={(e: any) => setForm(prev => ({ ...prev, email: e.target.value }))} placeholder="sofia@tramalibros.cl" />
            
            <div className="space-y-1">
              <Input label="Contraseña Inicial *" type="password" value={form.clave} onChange={(e: any) => setForm(prev => ({ ...prev, clave: e.target.value }))} placeholder="••••••••" />
              <p className="text-[11px] text-gray-400">Mínimo 4 caracteres. Las contraseñas quedan almacenadas protegidas.</p>
            </div>

            <Select label="Rol de Acceso" value={form.rol} onChange={(e: any) => setForm(prev => ({ ...prev, rol: e.target.value }))}>
              <option value="vendedor">Vendedor POS (Punto de Venta e Inventario)</option>
              <option value="admin_secundario">Administrador Secundario (POS + Finanzas / Sin Personal ni Respaldos)</option>
              <option value="admin">Administrador General (Acceso Total + Personal y Respaldos)</option>
            </Select>
          </div>
        </Modal>
      )}

      {/* MODAL EDITAR PERFIL DE USUARIO */}
      {modalEdit && (
        <Modal
          title={`Editar Datos de Perfil: ${modalEdit.nombre}`}
          onClose={() => setModalEdit(null)}
          footer={
            <>
              <Btn onClick={() => setModalEdit(null)}>Cancelar</Btn>
              <Btn onClick={guardarEdicionPerfil} variant="primary">
                <CheckCircle size={13} /> Guardar Cambios
              </Btn>
            </>
          }
        >
          <div className="space-y-3">
            {error && (
              <div className="text-xs text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-100 flex items-center gap-2 font-medium">
                <AlertCircle size={14} className="shrink-0 text-red-500" />
                <span>{error}</span>
              </div>
            )}
            <Input label="Nombre Completo *" value={form.nombre} onChange={(e: any) => setForm(prev => ({ ...prev, nombre: e.target.value }))} />
            <Input label="Correo Electrónico *" type="email" value={form.email} onChange={(e: any) => setForm(prev => ({ ...prev, email: e.target.value }))} />
            <Select label="Rol de Acceso" value={form.rol} onChange={(e: any) => setForm(prev => ({ ...prev, rol: e.target.value }))}>
              <option value="vendedor">Vendedor POS (Punto de Venta e Inventario)</option>
              <option value="admin_secundario">Administrador Secundario (POS + Finanzas / Sin Personal ni Respaldos)</option>
              <option value="admin">Administrador General (Acceso Total + Personal y Respaldos)</option>
            </Select>
          </div>
        </Modal>
      )}

      {/* MODAL SEGURO DE CAMBIO DE CONTRASEÑA */}
      {modalPassword && (
        <Modal
          title={`Restablecer Contraseña: ${modalPassword.nombre}`}
          onClose={() => setModalPassword(null)}
          footer={
            <>
              <Btn onClick={() => setModalPassword(null)}>Cancelar</Btn>
              <Btn onClick={guardarNuevaPassword} variant="primary">
                <KeyRound size={13} /> Actualizar Contraseña
              </Btn>
            </>
          }
        >
          <div className="space-y-3">
            <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-xs text-amber-900 flex items-start gap-2">
              <ShieldAlert size={16} className="shrink-0 text-amber-600 mt-0.5" />
              <div>
                <p className="font-bold">Acción de Seguridad Administrada</p>
                <p className="text-[11px] text-amber-800 mt-0.5">
                  Estás cambiando la contraseña para <span className="font-bold">{modalPassword.nombre}</span> ({modalPassword.email}). La clave anterior no será revelada por seguridad.
                </p>
              </div>
            </div>

            {error && (
              <div className="text-xs text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-100 flex items-center gap-2 font-medium">
                <AlertCircle size={14} className="shrink-0 text-red-500" />
                <span>{error}</span>
              </div>
            )}

            <Input
              label="Nueva Contraseña *"
              type="password"
              placeholder="••••••••"
              value={passForm.nuevaClave}
              onChange={(e: any) => setPassForm(prev => ({ ...prev, nuevaClave: e.target.value }))}
            />

            <Input
              label="Confirmar Nueva Contraseña *"
              type="password"
              placeholder="••••••••"
              value={passForm.confirmarClave}
              onChange={(e: any) => setPassForm(prev => ({ ...prev, confirmarClave: e.target.value }))}
            />
          </div>
        </Modal>
      )}
    </div>
  );
}
