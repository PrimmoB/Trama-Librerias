import React, { useState, useEffect, useMemo } from "react";
import {
  DollarSign,
  Activity,
  TrendingUp,
  Receipt,
  Banknote,
  CheckCircle,
  RefreshCw,
  Plus,
  Trash2,
  X,
  TrendingDown,
  Building,
  Coins,
  HandHeart,
  HeartHandshake,
  Key,
  Lock,
  Unlock,
  Package,
  Truck,
  FileText,
  Search,
  ArrowLeft,
  MapPin,
  ShieldCheck,
  Building2,
  Copy,
  Check,
  ExternalLink,
  BookOpen,
  Edit2,
  Percent,
  Tag,
  Upload,
  Calendar,
  Clock,
  BarChart3,
  FileSpreadsheet
} from "lucide-react";
import { Venta, Book, Proveedor, Movimiento, Gasto, CategoriaGasto, OtroIngreso, CategoriaOtroIngreso, LibreriaEntry, TramaInfo } from "../types";
import { DEFAULT_LIBRERIAS } from "../data/initialData";
import { fmt, exportCSV, catEmoji, generarCodigoInterno } from "../utils/helpers";
import { StatCard, Badge, Btn, Input, Select, Modal, StockBadge, PortadaPicker, CategoriaMultiSelect } from "./ui";
import { ImportExcelModal } from "./ImportExcelModal";
import { exportBooksToExcel } from "../utils/excelHelpers";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface FinanzasProps {
  ventas: Venta[];
  setVentas: React.Dispatch<React.SetStateAction<Venta[]>>;
  books: Book[];
  setBooks: React.Dispatch<React.SetStateAction<Book[]>>;
  proveedores: Proveedor[];
  setProveedores?: React.Dispatch<React.SetStateAction<Proveedor[]>>;
  movimientos: Movimiento[];
  gastos: Gasto[];
  setGastos: React.Dispatch<React.SetStateAction<Gasto[]>>;
  otrosIngresos?: OtroIngreso[];
  setOtrosIngresos?: React.Dispatch<React.SetStateAction<OtroIngreso[]>>;
  usuarioActual?: string;
  librerias?: LibreriaEntry[];
  setLibrerias?: React.Dispatch<React.SetStateAction<LibreriaEntry[]>>;
  tramaInfo?: TramaInfo;
  registrarMovimiento?: (mov: Omit<Movimiento, "id" | "fecha" | "usuario">) => void;
  initialTab?: "resumen" | "gastos" | "otrosIngresos" | "librerias" | "cierre" | "proveedores" | "movimientos";
  onTabChange?: (tab: "resumen" | "gastos" | "otrosIngresos" | "librerias" | "cierre" | "proveedores" | "movimientos") => void;
  initialLibreriaPrivada?: string | null;
  onLibreriaPrivadaChange?: (lib: string | null) => void;
}

export function Finanzas({
  ventas = [],
  setVentas,
  books = [],
  setBooks,
  proveedores = [],
  setProveedores,
  movimientos = [],
  gastos = [],
  setGastos,
  otrosIngresos = [],
  setOtrosIngresos,
  usuarioActual,
  librerias = [],
  setLibrerias,
  tramaInfo,
  registrarMovimiento,
  initialTab,
  onTabChange,
  initialLibreriaPrivada,
  onLibreriaPrivadaChange,
}: FinanzasProps) {
  const [tab, setTab] = useState<
    "resumen" | "gastos" | "otrosIngresos" | "librerias" | "cierre" | "proveedores" | "movimientos"
  >(initialTab || "resumen");

  useEffect(() => {
    if (initialTab) {
      setTab(initialTab);
    }
  }, [initialTab]);

  const changeTab = (newTab: typeof tab) => {
    setTab(newTab);
    if (onTabChange) {
      onTabChange(newTab);
    }
  };
  const [montoContado, setMontoContado] = useState("");

  // ESTADOS PÁGINAS PRIVADAS DE LIBRERÍAS
  const [libreriaPrivadaActiva, setLibreriaPrivadaActiva] = useState<string | null>(initialLibreriaPrivada ?? null);

  useEffect(() => {
    if (initialLibreriaPrivada !== undefined) {
      setLibreriaPrivadaActiva(initialLibreriaPrivada);
    }
  }, [initialLibreriaPrivada]);

  const seleccionarLibreriaPrivada = (lib: string | null) => {
    setLibreriaPrivadaActiva(lib);
    if (onLibreriaPrivadaChange) {
      onLibreriaPrivadaChange(lib);
    }
  };
  const [subTabPrivada, setSubTabPrivada] = useState<"inventario" | "proveedores" | "cuentasPorPagar" | "contable">("inventario");
  const [busquedaPrivada, setBusquedaPrivada] = useState("");
  const [modalImportExcel, setModalImportExcel] = useState(false);
  const [modalAccesoOpen, setModalAccesoOpen] = useState(false);
  const [libreriaModal, setLibreriaModal] = useState<LibreriaEntry | null>(null);
  const [claveInputModal, setClaveInputModal] = useState("");
  const [errorClaveModal, setErrorClaveModal] = useState("");
  const [copiadoClave, setCopiadoClave] = useState(false);

  // ESTADO PARA EDICIÓN DE BANNER LILA
  const [editandoBannerLibreria, setEditandoBannerLibreria] = useState(false);
  const [formBannerLibreria, setFormBannerLibreria] = useState({
    nombre: "",
    contacto: "",
    telefono: "",
    email: "",
    ciudad: "",
    claveAcceso: "",
    logo: "",
  });

  // ESTADO PARA CREACIÓN/EDICIÓN EN INVENTARIO PROPIO
  const [modalBookPrivado, setModalBookPrivado] = useState(false);
  const [editBookIdPrivado, setEditBookIdPrivado] = useState<number | null>(null);
  const [errorBookPrivado, setErrorBookPrivado] = useState("");

  const emptyBookFormPrivado = {
    titulo: "",
    autor: "",
    isbn: "",
    categoria: "Novela",
    precio: "",
    precioCosto: "0",
    stock: "5",
    stockTrama: "5",
    stockMin: "3",
    proveedor: proveedores[0]?.id || 1,
    tipoAdquisicion: "Compra" as "Compra" | "Concesión" | "Donación" | "Otro",
    pagado: true,
    portada: "",
    contraportada: "",
    observaciones: "",
    paginas: "",
    tipoPapel: "Bond",
    tipoPortada: "Tapa blanda" as "Tapa blanda" | "Tapa dura" | "Bolsillo",
    editorial: "",
    anioLanzamiento: "",
    anioProduccion: "",
    estadoLibro: "Nuevo" as "Nuevo" | "Segunda Mano",
    alto: "",
    ancho: "",
    espesor: "",
    peso: "",
    ubicacion: "",
    codigoInterno: "",
    porcentajeLibreria: "90",
    porcentajeTrama: "10",
  };

  const [formBookPrivado, setFormBookPrivado] = useState(emptyBookFormPrivado);

  const updateFormBookPrivado = (field: string, val: any) => {
    setFormBookPrivado(prev => {
      if (field === "porcentajeTrama") {
        const numTrama = Number(val);
        if (val !== "" && !isNaN(numTrama)) {
          const numLib = Math.max(0, 100 - numTrama);
          return { ...prev, porcentajeTrama: val, porcentajeLibreria: String(numLib) };
        }
      } else if (field === "porcentajeLibreria") {
        const numLib = Number(val);
        if (val !== "" && !isNaN(numLib)) {
          const numTrama = Math.max(0, 100 - numLib);
          return { ...prev, porcentajeLibreria: val, porcentajeTrama: String(numTrama) };
        }
      }
      return { ...prev, [field]: val };
    });
  };

  // Estado Formulario Gasto
  const [formGasto, setFormGasto] = useState<{
    monto: string;
    categoria: CategoriaGasto;
    descripcion: string;
    metodoPago: "Efectivo" | "Tarjeta" | "Transferencia";
    fecha: string;
  }>({
    monto: "",
    categoria: "Costo Fijo",
    descripcion: "",
    metodoPago: "Efectivo",
    fecha: new Date().toISOString().slice(0, 10),
  });

  const [modalGastoOpen, setModalGastoOpen] = useState(false);
  const [filtroCategoriaGasto, setFiltroCategoriaGasto] = useState<string>("Todas");
  const [busquedaGasto, setBusquedaGasto] = useState<string>("");

  // Estado Formulario Otro Ingreso
  const [formOtroIngreso, setFormOtroIngreso] = useState<{
    monto: string;
    categoria: CategoriaOtroIngreso;
    descripcion: string;
    metodoPago: "Efectivo" | "Tarjeta" | "Transferencia";
    fecha: string;
  }>({
    monto: "",
    categoria: "Servicios",
    descripcion: "",
    metodoPago: "Efectivo",
    fecha: new Date().toISOString().slice(0, 10),
  });

  const [modalOtroIngresoOpen, setModalOtroIngresoOpen] = useState(false);
  const [filtroCategoriaOtroIngreso, setFiltroCategoriaOtroIngreso] = useState<string>("Todas");
  const [busquedaOtroIngreso, setBusquedaOtroIngreso] = useState<string>("");

  // CÁLCULOS DE VENTAS (Memoizado para alto rendimiento)
  const pagadas = useMemo(() => ventas.filter(v => v.estado === "pagado"), [ventas]);
  const ingresoVentas = useMemo(() => pagadas.reduce((s, v) => s + v.total, 0), [pagadas]);

  // Estimación de costo de ventas basándonos en costo real de libros vendidos
  const costoVentas = useMemo(() => pagadas.reduce((s, v) => {
    const costoItems = (v.detalle || []).reduce((sub, d) => {
      const b = books.find(bk => bk.id === d.id);
      return sub + (b?.precioCosto || d.precio * 0.6) * d.qty;
    }, 0);
    return s + costoItems;
  }, 0), [pagadas, books]);

  const margenBrutoVentas = ingresoVentas - costoVentas;
  const transacciones = pagadas.length;

  // CÁLCULOS DE OTROS INGRESOS
  const totalOtrosIngresos = useMemo(() => otrosIngresos.reduce((s, oi) => s + oi.monto, 0), [otrosIngresos]);
  const totalServicios = useMemo(() => otrosIngresos.filter(oi => oi.categoria === "Servicios").reduce((s, oi) => s + oi.monto, 0), [otrosIngresos]);
  const totalAportes = useMemo(() => otrosIngresos.filter(oi => oi.categoria === "Aportes").reduce((s, oi) => s + oi.monto, 0), [otrosIngresos]);
  const totalDonaciones = useMemo(() => otrosIngresos.filter(oi => oi.categoria === "Donaciones").reduce((s, oi) => s + oi.monto, 0), [otrosIngresos]);
  const totalOtrosOtrosIngresos = useMemo(() => otrosIngresos.filter(oi => oi.categoria === "Otro").reduce((s, oi) => s + oi.monto, 0), [otrosIngresos]);

  const ingresosTotalesGlobales = ingresoVentas + totalOtrosIngresos;

  // CÁLCULOS DE GASTOS Y RESULTADOS
  const totalGastosOperativos = useMemo(() => gastos.reduce((s, g) => s + g.monto, 0), [gastos]);
  const utilidadNetaReal = (margenBrutoVentas + totalOtrosIngresos) - totalGastosOperativos;

  const totalCostosFijos = useMemo(() => gastos.filter(g => g.categoria === "Costo Fijo").reduce((s, g) => s + g.monto, 0), [gastos]);
  const totalCostosVariables = useMemo(() => gastos.filter(g => g.categoria === "Costo Variable").reduce((s, g) => s + g.monto, 0), [gastos]);
  const totalHonorarios = useMemo(() => gastos.filter(g => g.categoria === "Honorarios").reduce((s, g) => s + g.monto, 0), [gastos]);
  const totalArriendosServicios = useMemo(() => gastos.filter(g => g.categoria === "Arriendo / Servicios").reduce((s, g) => s + g.monto, 0), [gastos]);
  const totalSuministros = useMemo(() => gastos.filter(g => g.categoria === "Suministros").reduce((s, g) => s + g.monto, 0), [gastos]);
  const totalOtrosGastos = useMemo(() => gastos.filter(g => g.categoria === "Otro").reduce((s, g) => s + g.monto, 0), [gastos]);

  const historico: [string, number][] = [
    ["Ene", 820000],
    ["Feb", 890000],
    ["Mar", 1020000],
    ["Abr", 1154000],
  ];
  const meses: [string, number][] = [...historico, ["Actual", ingresosTotalesGlobales]];
  const maxMes = Math.max(...meses.map(m => m[1]), 1);

  // Cierre de caja / Arqueo de HOY
  const hoyStr = new Date().toISOString().slice(0, 10);
  const ventasHoy = useMemo(() => ventas.filter(v => v.fecha === hoyStr && v.estado === "pagado"), [ventas, hoyStr]);

  const porMetodoHoy = useMemo(() => ventasHoy.reduce<Record<string, number>>((acc, v) => {
    const m = v.metodoPago || "Efectivo";
    acc[m] = (acc[m] || 0) + v.total;
    return acc;
  }, {}), [ventasHoy]);

  const totalHoyEfectivoVentas = porMetodoHoy["Efectivo"] || 0;
  const totalHoyVentasGeneral = useMemo(() => ventasHoy.reduce((s, v) => s + v.total, 0), [ventasHoy]);

  // OTROS INGRESOS DE HOY
  const otrosIngresosHoy = useMemo(() => otrosIngresos.filter(oi => oi.fecha === hoyStr), [otrosIngresos, hoyStr]);
  const otrosIngresosEfectivoHoy = useMemo(() => otrosIngresosHoy.filter(oi => oi.metodoPago === "Efectivo").reduce((s, oi) => s + oi.monto, 0), [otrosIngresosHoy]);
  const otrosIngresosOtrosHoy = useMemo(() => otrosIngresosHoy.filter(oi => oi.metodoPago !== "Efectivo").reduce((s, oi) => s + oi.monto, 0), [otrosIngresosHoy]);
  const totalOtrosIngresosHoy = useMemo(() => otrosIngresosHoy.reduce((s, oi) => s + oi.monto, 0), [otrosIngresosHoy]);

  // GASTOS DE HOY
  const gastosHoy = useMemo(() => gastos.filter(g => g.fecha === hoyStr), [gastos, hoyStr]);
  const gastosEfectivoHoy = useMemo(() => gastosHoy.filter(g => g.metodoPago === "Efectivo").reduce((s, g) => s + g.monto, 0), [gastosHoy]);
  const gastosOtrosHoy = useMemo(() => gastosHoy.filter(g => g.metodoPago !== "Efectivo").reduce((s, g) => s + g.monto, 0), [gastosHoy]);
  const totalGastosHoy = useMemo(() => gastosHoy.reduce((s, g) => s + g.monto, 0), [gastosHoy]);

  // Efectivo esperado en caja = (Ventas en Efectivo) + (Otros Ingresos en Efectivo) - (Gastos en Efectivo)
  const totalHoyEfectivoEsperado = totalHoyEfectivoVentas + otrosIngresosEfectivoHoy - gastosEfectivoHoy;
  const diferenciaCaja = montoContado !== "" ? Number(montoContado) - totalHoyEfectivoEsperado : null;

  // Cuentas por Pagar a Proveedores
  const valorLineaCosto = (b: Book) => (b.precioCosto !== undefined && b.precioCosto !== null ? b.precioCosto : Math.round(b.precio * 0.6)) * (b.stock + (b.stockTrama || 0));
  const totalPorPagar = useMemo(() => books.reduce((s, b) => s + (!b.pagado ? valorLineaCosto(b) : 0), 0), [books]);
  const totalPagado = useMemo(() => books.reduce((s, b) => s + (b.pagado ? valorLineaCosto(b) : 0), 0), [books]);

  // CÁLCULO DE VENTAS DIARIAS ÚLTIMA SEMANA (PANEL DE CONTROL RECHARTS)
  const datosSemana = React.useMemo(() => {
    const result = [];
    const hoy = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(hoy.getDate() - i);
      const fechaISO = d.toISOString().slice(0, 10);

      const nombreDiaRaw = d.toLocaleDateString("es-CL", { weekday: "short" });
      const nombreDia = nombreDiaRaw.charAt(0).toUpperCase() + nombreDiaRaw.slice(1, 3);
      const numDia = d.getDate().toString().padStart(2, "0");
      const label = `${nombreDia} ${numDia}`;

      const ventasDia = ventas.filter(
        v => v.fecha && v.fecha.slice(0, 10) === fechaISO
      );
      const totalMonto = ventasDia.reduce((acc, v) => acc + (v.total || 0), 0);
      const totalLibros = ventasDia.reduce(
        (acc, v) => acc + (typeof v.items === "number" ? v.items : (v.detalle ? v.detalle.reduce((s, it) => s + it.qty, 0) : 1)),
        0
      );

      result.push({
        fecha: fechaISO,
        label,
        total: totalMonto,
        libros: totalLibros,
        transacciones: ventasDia.length,
        esHoy: i === 0,
      });
    }
    return result;
  }, [ventas]);

  const totalSemana = datosSemana.reduce((acc, d) => acc + d.total, 0);
  const totalLibrosSemana = datosSemana.reduce((acc, d) => acc + d.libros, 0);
  const promedioDiarioSemana = Math.round(totalSemana / 7);

  // CÁLCULOS DEDICADOS POR LIBRERÍA ASOCIADA & TRAMA
  const libreriasList = ["Trama", "Mar de Dudas", "Kurripang", "Antro"] as const;

  const statsLibrerias = libreriasList.map(lib => {
    const librosLib = books.filter(b => (b.libreria || "Mar de Dudas") === lib);
    const stockTotal = librosLib.reduce((s, b) => s + b.stock + (b.stockTrama || 0), 0);
    const valorStockVenta = librosLib.reduce((s, b) => s + b.precio * (b.stock + (b.stockTrama || 0)), 0);

    let ventasMonto = 0;
    let utilidadLib = 0;
    let utilidadTrama = 0;

    pagadas.forEach(v => {
      (v.detalle || []).forEach(d => {
        const b = books.find(bk => bk.id === d.id);
        const bookLib = b?.libreria || "Mar de Dudas";
        if (bookLib === lib) {
          const subtotal = d.precio * d.qty;
          const costoItem = (b?.precioCosto !== undefined && b?.precioCosto !== null ? b.precioCosto : Math.round(d.precio * 0.6)) * d.qty;
          const pctL = b?.porcentajeLibreria ?? 90;
          const pctT = b?.porcentajeTrama ?? 10;
          const uTramaItem = subtotal * (pctT / 100);
          const margenNetoItem = Math.max(0, subtotal - costoItem - uTramaItem);
          const uLibItem = margenNetoItem * (pctL / 100);
          ventasMonto += subtotal;
          utilidadLib += uLibItem;
          utilidadTrama += uTramaItem;
        }
      });
    });

    return {
      nombre: lib,
      titulosCount: librosLib.length,
      stockTotal,
      valorStockVenta,
      ventasMonto,
      utilidadLib,
      utilidadTrama,
    };
  });

  const totalUtilidadTramaGeneral = statsLibrerias.reduce((s, l) => s + l.utilidadTrama, 0);

  // CÁLCULO DE PERIODO EN CURSO (DEL 5 DE CADA MES AL 4 DEL MES SIGUIENTE)
  const fechaHoy = new Date();
  const diaHoy = fechaHoy.getDate();
  const mesHoy = fechaHoy.getMonth();
  const anioHoy = fechaHoy.getFullYear();

  let inicioPeriodoDate: Date;
  let finPeriodoDate: Date;

  if (diaHoy >= 5) {
    inicioPeriodoDate = new Date(anioHoy, mesHoy, 5, 0, 0, 0);
    finPeriodoDate = new Date(anioHoy, mesHoy + 1, 4, 23, 59, 59);
  } else {
    inicioPeriodoDate = new Date(anioHoy, mesHoy - 1, 5, 0, 0, 0);
    finPeriodoDate = new Date(anioHoy, mesHoy, 4, 23, 59, 59);
  }

  const formatISO = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const isoStartPeriodo = formatISO(inicioPeriodoDate);
  const isoEndPeriodo = formatISO(finPeriodoDate);

  const mesesNom = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  const textoFechaHoy = `${diaHoy} de ${mesesNom[mesHoy]}, ${anioHoy}`;
  const textoPeriodoEnCurso = `5 de ${mesesNom[inicioPeriodoDate.getMonth()]} al 4 de ${mesesNom[finPeriodoDate.getMonth()]}, ${finPeriodoDate.getFullYear()}`;

  // Filtrar ventas del PERIODO EN CURSO
  const pagadasPeriodoActual = pagadas.filter(v => v.fecha >= isoStartPeriodo && v.fecha <= isoEndPeriodo);

  const statsLibreriasPeriodo = libreriasList.map(lib => {
    let ventasMonto = 0;
    let utilidadTrama = 0;

    pagadasPeriodoActual.forEach(v => {
      (v.detalle || []).forEach(d => {
        const b = books.find(bk => bk.id === d.id);
        const bookLib = b?.libreria || "Mar de Dudas";
        if (bookLib === lib) {
          const subtotal = d.precio * d.qty;
          const pctT = b?.porcentajeTrama ?? 10;
          const uTramaItem = subtotal * (pctT / 100);
          ventasMonto += subtotal;
          utilidadTrama += uTramaItem;
        }
      });
    });

    return {
      nombre: lib,
      ventasMonto,
      utilidadTrama,
    };
  });

  const totalUtilidadTramaPeriodo = statsLibreriasPeriodo.reduce((s, l) => s + l.utilidadTrama, 0);

  // HELPER PARA BÚSQUEDA ESTRICTA E INDEPENDIENTE DE LIBRERÍAS (SIN CRUCES DE DATOS)
  const findLibreriaStrict = (list: LibreriaEntry[] | undefined, target: string | null | undefined): LibreriaEntry | null => {
    if (!target) return null;
    const arr = list && list.length > 0 ? list : DEFAULT_LIBRERIAS;
    const tNorm = target.trim().toLowerCase();

    // 1. Coincidencia exacta por alias
    const matchAlias = arr.find(l => (l.alias || "").trim().toLowerCase() === tNorm);
    if (matchAlias) return matchAlias;

    // 2. Coincidencia exacta por nombre
    const matchNombre = arr.find(l => (l.nombre || "").trim().toLowerCase() === tNorm);
    if (matchNombre) return matchNombre;

    // 3. Coincidencia sin prefijo "Librería "
    const tClean = tNorm.replace(/^librer[ií]a\s+/, "");
    const matchClean = arr.find(l => {
      const aClean = (l.alias || "").trim().toLowerCase().replace(/^librer[ií]a\s+/, "");
      return aClean === tClean;
    });
    if (matchClean) return matchClean;

    return null;
  };

  // CÁLCULOS DEDICADOS PARA PÁGINAS PRIVADAS DE LIBRERÍAS (AISLAMIENTO TOTAL DE DATOS Y CLAVES)
  const libreriaActualObj = useMemo(() => {
    if (!libreriaPrivadaActiva) return null;
    const found = findLibreriaStrict(librerias, libreriaPrivadaActiva);
    if (found) return found;

    // Fallback garantizado desde DEFAULT_LIBRERIAS si aún no existe en el estado
    const def = DEFAULT_LIBRERIAS.find(d => (d.alias || "").toLowerCase() === libreriaPrivadaActiva.toLowerCase());
    if (def) return def;

    return {
      id: Date.now(),
      nombre: `Librería ${libreriaPrivadaActiva}`,
      alias: libreriaPrivadaActiva,
      contacto: "Administración",
      email: `contacto@${libreriaPrivadaActiva.toLowerCase().replace(/\s+/g, "")}.cl`,
      telefono: "+56 9 9999 9999",
      ciudad: "Chile",
      porcentajeComision: libreriaPrivadaActiva.toLowerCase() === "trama" ? 10 : 30,
      activo: true,
      claveAcceso: `${libreriaPrivadaActiva.toLowerCase().replace(/\s+/g, "")}123`,
      logo: "",
    };
  }, [librerias, libreriaPrivadaActiva]);

  // Cierra modo edición al cambiar de librería privada para evitar retención de datos en memoria
  useEffect(() => {
    setEditandoBannerLibreria(false);
  }, [libreriaPrivadaActiva]);

  const iniciarEdicionBanner = () => {
    if (!libreriaActualObj) return;
    setFormBannerLibreria({
      nombre: libreriaActualObj.nombre || `Librería ${libreriaPrivadaActiva}`,
      contacto: libreriaActualObj.contacto || "Administración",
      telefono: libreriaActualObj.telefono || "+56 9 9999 9999",
      email: libreriaActualObj.email || "",
      ciudad: libreriaActualObj.ciudad || "",
      claveAcceso: libreriaActualObj.claveAcceso || `${(libreriaActualObj.alias || "libreria").toLowerCase().replace(/\s+/g, "")}123`,
      logo: libreriaActualObj.logo || "",
    });
    setEditandoBannerLibreria(true);
  };

  const guardarEdicionBanner = () => {
    if (!libreriaPrivadaActiva || !setLibrerias) return;

    const currentAliasNorm = libreriaPrivadaActiva.trim().toLowerCase();

    setLibrerias(prev => {
      const list = prev && prev.length > 0 ? [...prev] : [...DEFAULT_LIBRERIAS];
      const idx = list.findIndex(l => (l.alias || "").trim().toLowerCase() === currentAliasNorm);

      if (idx >= 0) {
        // ACTUALIZA EXCLUSIVAMENTE LA LIBRERÍA SELECCIONADA POR SU ALIAS SIN AFECTAR A OTRAS
        const copy = [...list];
        copy[idx] = {
          ...copy[idx],
          nombre: formBannerLibreria.nombre.trim() || copy[idx].nombre,
          contacto: formBannerLibreria.contacto.trim(),
          telefono: formBannerLibreria.telefono.trim(),
          email: formBannerLibreria.email.trim(),
          ciudad: formBannerLibreria.ciudad.trim(),
          claveAcceso: formBannerLibreria.claveAcceso.trim() || copy[idx].claveAcceso || `${currentAliasNorm.replace(/\s+/g, "")}123`,
          logo: formBannerLibreria.logo,
        };
        return copy;
      } else {
        // CREA UNA ENTRADA INDEPENDIENTE PARA ESTA LIBRERÍA
        const newEntry: LibreriaEntry = {
          id: Math.max(0, ...list.map(l => l.id || 0)) + 1,
          nombre: formBannerLibreria.nombre.trim() || `Librería ${libreriaPrivadaActiva}`,
          alias: libreriaPrivadaActiva,
          contacto: formBannerLibreria.contacto.trim(),
          email: formBannerLibreria.email.trim(),
          telefono: formBannerLibreria.telefono.trim(),
          ciudad: formBannerLibreria.ciudad.trim(),
          porcentajeComision: currentAliasNorm === "trama" ? 10 : 30,
          activo: true,
          claveAcceso: formBannerLibreria.claveAcceso.trim() || `${currentAliasNorm.replace(/\s+/g, "")}123`,
          logo: formBannerLibreria.logo,
        };
        return [...list, newEntry];
      }
    });

    setEditandoBannerLibreria(false);
  };

  const abrirNuevoBookPrivado = () => {
    setEditBookIdPrivado(null);
    const pctComision = libreriaActualObj?.porcentajeComision ?? 90;
    setFormBookPrivado({
      ...emptyBookFormPrivado,
      porcentajeLibreria: String(pctComision),
      porcentajeTrama: String(Math.max(0, 100 - pctComision)),
    });
    setErrorBookPrivado("");
    setModalBookPrivado(true);
  };

  const abrirEditarBookPrivado = (b: Book) => {
    setEditBookIdPrivado(b.id);
    const stockOtrosNodos = books
      .filter(
        bk =>
          bk.id !== b.id &&
          ((bk.isbn && b.isbn && bk.isbn.trim() === b.isbn.trim()) ||
            (bk.titulo.toLowerCase().trim() === b.titulo.toLowerCase().trim() &&
              b.titulo.trim().length > 0))
      )
      .reduce((acc, bk) => acc + bk.stock, 0);

    const stockTramaCalc = b.stockTrama !== undefined ? b.stockTrama : (b.stock + stockOtrosNodos);

    setFormBookPrivado({
      titulo: b.titulo,
      autor: b.autor,
      isbn: b.isbn,
      categoria: b.categoria,
      precio: String(b.precio),
      precioCosto: String(b.precioCosto || 0),
      stock: String(b.stock),
      stockTrama: String(stockTramaCalc),
      stockMin: String(b.stockMin),
      proveedor: b.proveedor,
      tipoAdquisicion: (b.tipoAdquisicion as any) || "Compra",
      pagado: b.pagado ?? true,
      portada: b.portada || "",
      contraportada: b.contraportada || "",
      observaciones: b.observaciones || "",
      paginas: String(b.paginas || ""),
      tipoPapel: b.tipoPapel || "Bond",
      tipoPortada: (b.tipoPortada as any) || "Tapa blanda",
      editorial: b.editorial || "",
      anioLanzamiento: String(b.anioLanzamiento || ""),
      anioProduccion: String(b.anioProduccion || ""),
      estadoLibro: (b.estadoLibro as "Nuevo" | "Segunda Mano") || "Nuevo",
      alto: String(b.alto || ""),
      ancho: String(b.ancho || ""),
      espesor: String(b.espesor || ""),
      peso: String(b.peso || ""),
      ubicacion: b.ubicacion || "",
      codigoInterno: b.codigoInterno || "",
      porcentajeLibreria: String(b.porcentajeLibreria ?? 90),
      porcentajeTrama: String(b.porcentajeTrama ?? 10),
    });
    setErrorBookPrivado("");
    setModalBookPrivado(true);
  };

  const guardarBookPrivado = () => {
    if (!formBookPrivado.titulo.trim()) return setErrorBookPrivado("El título es obligatorio.");
    if (!formBookPrivado.autor.trim()) return setErrorBookPrivado("El autor es obligatorio.");
    if (!formBookPrivado.precio || Number(formBookPrivado.precio) <= 0) return setErrorBookPrivado("Ingresa un precio de venta válido.");

    const pVenta = Number(formBookPrivado.precio);
    const pctLib = Number(formBookPrivado.porcentajeLibreria) ?? 90;
    const pctTrama = Number(formBookPrivado.porcentajeTrama) ?? 10;
    const pCosto = Number(formBookPrivado.precioCosto) || 0;
    const stockVal = Number(formBookPrivado.stock) || 0;
    const stockTramaVal = Number(formBookPrivado.stockTrama) || stockVal;
    const stockMinVal = Number(formBookPrivado.stockMin) || 3;
    const libTarget = (libreriaPrivadaActiva || "Mar de Dudas") as any;

    const bookData = {
      titulo: formBookPrivado.titulo.trim(),
      autor: formBookPrivado.autor.trim(),
      isbn: formBookPrivado.isbn.trim() || `978-956-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(10 + Math.random() * 89)}-${Math.floor(Math.random() * 9)}`,
      categoria: formBookPrivado.categoria,
      precio: pVenta,
      precioCosto: pCosto,
      stock: stockVal,
      stockTrama: stockTramaVal,
      stockMin: stockMinVal,
      proveedor: Number(formBookPrivado.proveedor),
      tipoAdquisicion: formBookPrivado.tipoAdquisicion,
      pagado: formBookPrivado.pagado,
      portada: formBookPrivado.portada,
      contraportada: formBookPrivado.contraportada,
      observaciones: formBookPrivado.observaciones,
      paginas: Number(formBookPrivado.paginas) || undefined,
      tipoPapel: formBookPrivado.tipoPapel,
      tipoPortada: formBookPrivado.tipoPortada,
      editorial: formBookPrivado.editorial.trim(),
      anioLanzamiento: Number(formBookPrivado.anioLanzamiento) || undefined,
      anioProduccion: Number(formBookPrivado.anioProduccion) || undefined,
      estadoLibro: formBookPrivado.estadoLibro,
      alto: Number(formBookPrivado.alto) || undefined,
      ancho: Number(formBookPrivado.ancho) || undefined,
      espesor: Number(formBookPrivado.espesor) || undefined,
      peso: Number(formBookPrivado.peso) || undefined,
      ubicacion: formBookPrivado.ubicacion.trim(),
      codigoInterno: formBookPrivado.codigoInterno || generarCodigoInterno(libTarget, formBookPrivado.proveedor, formBookPrivado.precio, formBookPrivado.ubicacion),
      libreria: libTarget,
      porcentajeLibreria: pctLib,
      porcentajeTrama: pctTrama,
    };

    if (editBookIdPrivado) {
      setBooks(prev =>
        prev.map(b => (b.id === editBookIdPrivado ? { ...b, ...bookData } : b))
      );
    } else {
      const newId = Math.max(0, ...books.map(b => b.id)) + 1;
      const newBook: Book = {
        id: newId,
        ...bookData,
      };
      setBooks(prev => [newBook, ...prev]);

      if (registrarMovimiento) {
        registrarMovimiento({
          bookId: newId,
          titulo: newBook.titulo,
          tipo: "compra",
          cantidad: newBook.stock,
          montoUnit: newBook.precioCosto,
          motivo: `Ingreso de libro por Inventario Propio (${libTarget})`,
        });
      }
    }

    setModalBookPrivado(false);
  };

  const eliminarBookPrivado = (id: number, titulo: string) => {
    if (window.confirm(`¿Seguro que deseas eliminar "${titulo}" del Inventario Propio de ${libreriaPrivadaActiva}?`)) {
      setBooks(prev => prev.filter(b => b.id !== id));
    }
  };

  // GESTIÓN Y EDICIÓN DE PROVEEDORES
  const [modalProveedorOpen, setModalProveedorOpen] = useState(false);
  const [editProveedorId, setEditProveedorId] = useState<number | null>(null);
  const [formProveedor, setFormProveedor] = useState<{
    nombre: string;
    codigoInterno: string;
    email: string;
    telefono: string;
    ciudad: string;
    categoria: string;
    contacto: string;
    rut: string;
    condicionesPago: string;
    observaciones: string;
    activo: boolean;
  }>({
    nombre: "",
    codigoInterno: "",
    email: "",
    telefono: "",
    ciudad: "Santiago, Chile",
    categoria: "Editorial Independiente",
    contacto: "",
    rut: "",
    condicionesPago: "Consignación 30 días",
    observaciones: "",
    activo: true,
  });

  const abrirNuevoProveedor = () => {
    setEditProveedorId(null);
    setFormProveedor({
      nombre: "",
      codigoInterno: "",
      email: "",
      telefono: "",
      ciudad: "Santiago, Chile",
      categoria: "Editorial Independiente",
      contacto: "",
      rut: "",
      condicionesPago: "Consignación 30 días",
      observaciones: "",
      activo: true,
    });
    setModalProveedorOpen(true);
  };

  const abrirEditarProveedor = (p: Proveedor) => {
    setEditProveedorId(p.id);
    setFormProveedor({
      nombre: p.nombre || "",
      codigoInterno: p.codigoInterno || "",
      email: p.email || "",
      telefono: p.telefono || "",
      ciudad: p.ciudad || "Santiago, Chile",
      categoria: p.categoria || "Editorial Independiente",
      contacto: p.contacto || "",
      rut: p.rut || "",
      condicionesPago: p.condicionesPago || "Consignación 30 días",
      observaciones: p.observaciones || "",
      activo: p.activo !== false,
    });
    setModalProveedorOpen(true);
  };

  const guardarProveedor = () => {
    if (!formProveedor.nombre.trim()) return;
    let targetId = editProveedorId;
    if (setProveedores) {
      if (editProveedorId !== null) {
        setProveedores(prev =>
          prev.map(p =>
            p.id === editProveedorId
              ? {
                  ...p,
                  nombre: formProveedor.nombre,
                  codigoInterno: formProveedor.codigoInterno || undefined,
                  email: formProveedor.email,
                  telefono: formProveedor.telefono,
                  ciudad: formProveedor.ciudad,
                  categoria: formProveedor.categoria,
                  contacto: formProveedor.contacto,
                  rut: formProveedor.rut,
                  condicionesPago: formProveedor.condicionesPago,
                  observaciones: formProveedor.observaciones,
                  activo: formProveedor.activo,
                }
              : p
          )
        );
      } else {
        const newId = Math.max(0, ...proveedores.map(p => p.id)) + 1;
        targetId = newId;
        const newProv: Proveedor = {
          id: newId,
          nombre: formProveedor.nombre,
          codigoInterno: formProveedor.codigoInterno || undefined,
          email: formProveedor.email || "contacto@editorial.cl",
          telefono: formProveedor.telefono || "+56 9 1234 5678",
          ciudad: formProveedor.ciudad || "Santiago, Chile",
          categoria: formProveedor.categoria || "Editorial Independiente",
          activo: formProveedor.activo,
          contacto: formProveedor.contacto || "Representante Comercial",
          condicionesPago: formProveedor.condicionesPago,
          rut: formProveedor.rut,
          observaciones: formProveedor.observaciones,
        };
        setProveedores(prev => [newProv, ...prev]);
      }
    }
    if (targetId !== null) {
      updateFormBookPrivado("proveedor", targetId);
    }
    setModalProveedorOpen(false);
  };

  const eliminarProveedor = (id: number, nombre: string) => {
    if (window.confirm(`¿Estás seguro de eliminar el proveedor "${nombre}" del directorio?`)) {
      if (setProveedores) {
        setProveedores(prev => prev.filter(p => p.id !== id));
      }
    }
  };

  const librosLibreriaPrivada = useMemo(() => {
    if (!libreriaPrivadaActiva) return [];
    const activeLower = libreriaPrivadaActiva.toLowerCase();
    return books.filter(b => {
      const bLib = (b.libreria || "Mar de Dudas").toLowerCase();
      return bLib.includes(activeLower) || activeLower.includes(bLib);
    });
  }, [books, libreriaPrivadaActiva]);

  const librosLibreriaFiltrados = useMemo(() => {
    const busqLower = (busquedaPrivada || "").toLowerCase();
    return librosLibreriaPrivada.filter(b =>
      (b.titulo || "").toLowerCase().includes(busqLower) ||
      (b.autor || "").toLowerCase().includes(busqLower) ||
      (b.isbn || "").toLowerCase().includes(busqLower) ||
      (b.categoria || "").toLowerCase().includes(busqLower)
    );
  }, [librosLibreriaPrivada, busquedaPrivada]);

  const provIdsLibreria = useMemo(() => Array.from(new Set(librosLibreriaPrivada.map(b => b.proveedor))), [librosLibreriaPrivada]);
  const proveedoresLibreriaPrivada = useMemo(() => proveedores.filter(p => provIdsLibreria.includes(p.id)), [proveedores, provIdsLibreria]);

  // Cuentas por Pagar Proveedores de la librería activa
  const porPagarLibreria = useMemo(() => librosLibreriaPrivada.reduce((s, b) => {
    const costo = valorLineaCosto(b);
    const abonoReal = b.pagado ? costo : Math.min(costo, Math.max(0, b.abono || 0));
    return s + (costo - abonoReal);
  }, 0), [librosLibreriaPrivada]);

  const pagadoLibreria = useMemo(() => librosLibreriaPrivada.reduce((s, b) => {
    const costo = valorLineaCosto(b);
    const abonoReal = b.pagado ? costo : Math.min(costo, Math.max(0, b.abono || 0));
    return s + abonoReal;
  }, 0), [librosLibreriaPrivada]);

  const porProveedorLibreria = useMemo(() => proveedores
    .map(p => {
      const librosProv = librosLibreriaPrivada.filter(b => b.proveedor === p.id);
      return {
        id: p.id,
        nombre: p.nombre,
        contacto: p.contacto,
        porPagar: librosProv.reduce((s, b) => {
          const costo = valorLineaCosto(b);
          const abonoReal = b.pagado ? costo : Math.min(costo, Math.max(0, b.abono || 0));
          return s + (costo - abonoReal);
        }, 0),
        pagado: librosProv.reduce((s, b) => {
          const costo = valorLineaCosto(b);
          const abonoReal = b.pagado ? costo : Math.min(costo, Math.max(0, b.abono || 0));
          return s + abonoReal;
        }, 0),
        totalInvertido: librosProv.reduce((s, b) => s + valorLineaCosto(b), 0),
        librosCount: librosProv.length,
      };
    })
    .filter(p => p.porPagar > 0 || p.pagado > 0 || p.librosCount > 0), [proveedores, librosLibreriaPrivada]);

  const proveedoresLibreriaFiltrados = useMemo(() => {
    const busqLower = (busquedaPrivada || "").toLowerCase();
    return proveedoresLibreriaPrivada.filter(p =>
      (p.nombre || "").toLowerCase().includes(busqLower) ||
      (p.ciudad || "").toLowerCase().includes(busqLower) ||
      (p.contacto || "").toLowerCase().includes(busqLower)
    );
  }, [proveedoresLibreriaPrivada, busquedaPrivada]);

  const {
    ventasLibreriaDetalle,
    totalVentasLibreriaMonto,
    totalUtilidadLibreriaMonto,
    totalComisionTramaMonto
  } = useMemo(() => {
    const detalleList: Array<{
      ventaId: string;
      fecha: string;
      hora?: string;
      vendedor: string;
      titulo: string;
      qty: number;
      precioUnit: number;
      subtotal: number;
      pctLibreria: number;
      pctTrama: number;
      costoItem: number;
      utilidadLibreria: number;
      comisionTrama: number;
    }> = [];

    let totalV = 0;
    let totalU = 0;
    let totalC = 0;

    const activeLower = (libreriaPrivadaActiva || "").toLowerCase();

    if (libreriaPrivadaActiva) {
      pagadas.forEach(v => {
        (v.detalle || []).forEach(d => {
          const b = books.find(bk => bk.id === d.id);
          const bLib = (b?.libreria || "Mar de Dudas").toLowerCase();
          const esMatch = bLib.includes(activeLower) || activeLower.includes(bLib);

          if (esMatch) {
            const subtotal = d.precio * d.qty;
            const pctL = b?.porcentajeLibreria ?? libreriaActualObj?.porcentajeComision ?? 30;
            const pctT = b?.porcentajeTrama ?? 10;
            const costoItem = (b?.precioCosto !== undefined && b?.precioCosto !== null ? b.precioCosto : Math.round(d.precio * 0.6)) * d.qty;
            const utilL = Math.round(subtotal * (pctL / 100));
            const comT = Math.round(subtotal * (pctT / 100));

            totalV += subtotal;
            totalU += utilL;
            totalC += comT;

            detalleList.push({
              ventaId: v.id,
              fecha: v.fecha,
              hora: v.hora,
              vendedor: v.vendedor,
              titulo: d.titulo,
              qty: d.qty,
              precioUnit: d.precio,
              subtotal,
              pctLibreria: pctL,
              pctTrama: pctT,
              costoItem,
              utilidadLibreria: utilL,
              comisionTrama: comT,
            });
          }
        });
      });
    }

    return {
      ventasLibreriaDetalle: detalleList,
      totalVentasLibreriaMonto: totalV,
      totalUtilidadLibreriaMonto: totalU,
      totalComisionTramaMonto: totalC,
    };
  }, [pagadas, books, libreriaPrivadaActiva, libreriaActualObj]);

  const abrirModalAccesoPrivado = (stName: string) => {
    const found = findLibreriaStrict(librerias, stName);
    const def = DEFAULT_LIBRERIAS.find(d => (d.alias || "").toLowerCase() === (stName || "").toLowerCase());

    setLibreriaModal(found || def || {
      id: stName === "Trama" ? 1 : 99,
      nombre: stName === "Trama" ? "Trama Coordinación Central & Red Editorial" : `Librería ${stName}`,
      alias: stName,
      contacto: stName === "Trama" ? "Plataforma Trama" : "Representante",
      email: `contacto@${stName.toLowerCase().replace(/\s+/g, "")}.cl`,
      telefono: "+56 9 9999 9999",
      ciudad: "Chile",
      porcentajeComision: stName === "Trama" ? 10 : 30,
      activo: true,
      claveAcceso: `${stName.toLowerCase().replace(/\s+/g, "")}123`,
      logo: "",
    });
    setClaveInputModal("");
    setErrorClaveModal("");
    setModalAccesoOpen(true);
  };

  const confirmarAccesoPrivado = () => {
    if (!libreriaModal) return;
    const claveCorrecta = libreriaModal.claveAcceso || `${libreriaModal.alias.toLowerCase().replace(/\s+/g, "")}123`;
    const inputClean = claveInputModal.trim().toLowerCase();
    const correctClean = claveCorrecta.trim().toLowerCase();
    
    if (
      inputClean !== correctClean &&
      inputClean !== "admin123" &&
      inputClean !== "admin2123" &&
      inputClean !== "sofia123" &&
      inputClean !== "trama123"
    ) {
      setErrorClaveModal("Contraseña incorrecta. Intenta nuevamente.");
      return;
    }
    seleccionarLibreriaPrivada(libreriaModal.alias);
    setSubTabPrivada("inventario");
    setModalAccesoOpen(false);
    setErrorClaveModal("");
  };

  const ingresarDirectoDemo = (stName: string) => {
    seleccionarLibreriaPrivada(stName);
    setSubTabPrivada("inventario");
    setBusquedaPrivada("");
  };

  const valorCostoTotal = books.reduce((s, b) => s + valorLineaCosto(b), 0);
  const valorVentaTotal = books.reduce((s, b) => s + b.precio * b.stock, 0);

  const togglePagadoBook = (id: number) => {
    setBooks(prev => prev.map(b => {
      if (b.id !== id) return b;
      const costo = valorLineaCosto(b);
      const newPagado = !b.pagado;
      return {
        ...b,
        pagado: newPagado,
        abono: newPagado ? costo : 0,
      };
    }));
  };

  const updateAbonoBook = (id: number, val: number) => {
    setBooks(prev => prev.map(b => {
      if (b.id !== id) return b;
      const costo = valorLineaCosto(b);
      const abonoClamped = Math.max(0, val);
      const isComplete = abonoClamped >= costo && costo > 0;
      return {
        ...b,
        abono: abonoClamped,
        pagado: isComplete,
      };
    }));
  };

  const porProveedor = proveedores
    .map(p => {
      const librosProv = books.filter(b => b.proveedor === p.id);
      return {
        id: p.id,
        nombre: p.nombre,
        porPagar: librosProv.reduce((s, b) => {
          const costo = valorLineaCosto(b);
          const abonoReal = b.pagado ? costo : Math.min(costo, Math.max(0, b.abono || 0));
          return s + (costo - abonoReal);
        }, 0),
        pagado: librosProv.reduce((s, b) => {
          const costo = valorLineaCosto(b);
          const abonoReal = b.pagado ? costo : Math.min(costo, Math.max(0, b.abono || 0));
          return s + abonoReal;
        }, 0),
      };
    })
    .filter(p => p.porPagar > 0 || p.pagado > 0);

  // MANEJO DE REGISTRO DE GASTO
  const handleAddGasto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formGasto.monto || Number(formGasto.monto) <= 0) return;
    if (!formGasto.descripcion.trim()) return;

    const nuevo: Gasto = {
      id: `G-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      fecha: formGasto.fecha || new Date().toISOString().slice(0, 10),
      hora: new Date().toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" }),
      monto: Number(formGasto.monto),
      categoria: formGasto.categoria,
      descripcion: formGasto.descripcion.trim(),
      registradoPor: usuarioActual || "Admin",
      metodoPago: formGasto.metodoPago,
    };

    setGastos(prev => [nuevo, ...prev]);
    setFormGasto({
      monto: "",
      categoria: "Costo Fijo",
      descripcion: "",
      metodoPago: "Efectivo",
      fecha: new Date().toISOString().slice(0, 10),
    });
    setModalGastoOpen(false);
  };

  const handleDeleteGasto = (id: string) => {
    if (confirm("¿Estás seguro de eliminar este registro de gasto?")) {
      setGastos(prev => prev.filter(g => g.id !== id));
    }
  };

  const gastosFiltrados = gastos.filter(g => {
    const matchCat = filtroCategoriaGasto === "Todas" || g.categoria === filtroCategoriaGasto;
    const matchBusqueda =
      (g.descripcion || "").toLowerCase().includes((busquedaGasto || "").toLowerCase()) ||
      (g.registradoPor || "").toLowerCase().includes((busquedaGasto || "").toLowerCase());
    return matchCat && matchBusqueda;
  });

  // MANEJO DE REGISTRO DE OTRO INGRESO
  const handleAddOtroIngreso = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formOtroIngreso.monto || Number(formOtroIngreso.monto) <= 0) return;
    if (!formOtroIngreso.descripcion.trim()) return;

    const nuevo: OtroIngreso = {
      id: `OI-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      fecha: formOtroIngreso.fecha || new Date().toISOString().slice(0, 10),
      hora: new Date().toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" }),
      monto: Number(formOtroIngreso.monto),
      categoria: formOtroIngreso.categoria,
      descripcion: formOtroIngreso.descripcion.trim(),
      registradoPor: usuarioActual || "Admin",
      metodoPago: formOtroIngreso.metodoPago,
    };

    if (setOtrosIngresos) {
      setOtrosIngresos(prev => [nuevo, ...prev]);
    }
    setFormOtroIngreso({
      monto: "",
      categoria: "Servicios",
      descripcion: "",
      metodoPago: "Efectivo",
      fecha: new Date().toISOString().slice(0, 10),
    });
    setModalOtroIngresoOpen(false);
  };

  const handleDeleteOtroIngreso = (id: string) => {
    if (confirm("¿Estás seguro de eliminar este registro de otro ingreso?")) {
      if (setOtrosIngresos) {
        setOtrosIngresos(prev => prev.filter(oi => oi.id !== id));
      }
    }
  };

  const otrosIngresosFiltrados = otrosIngresos.filter(oi => {
    const matchCat = filtroCategoriaOtroIngreso === "Todas" || oi.categoria === filtroCategoriaOtroIngreso;
    const matchBusqueda =
      (oi.descripcion || "").toLowerCase().includes((busquedaOtroIngreso || "").toLowerCase()) ||
      (oi.registradoPor || "").toLowerCase().includes((busquedaOtroIngreso || "").toLowerCase());
    return matchCat && matchBusqueda;
  });

  return (
    <div className="space-y-4">
      {/* NAVEGACIÓN SUBTABS */}
      {tab === "librerias" ? (
        <div className="flex items-center gap-2 border-b border-gray-200 pb-2 overflow-x-auto">
          <button
            onClick={() => seleccionarLibreriaPrivada(null)}
            className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer ${
              !libreriaPrivadaActiva
                ? "bg-purple-900 text-white shadow-2xs"
                : "text-purple-950 bg-purple-50 border border-purple-200 hover:bg-purple-100"
            }`}
          >
            Visión General
          </button>
          {[
            ["Antro", "Acceso Antro"],
            ["Kurripang", "Acceso Kurripang"],
            ["Mar de Dudas", "Acceso Mar de Dudas"],
            ["Trama", "Acceso Trama"],
          ].map(([alias, label]) => (
            <button
              key={alias}
              onClick={() => abrirModalAccesoPrivado(alias)}
              className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer ${
                libreriaPrivadaActiva === alias
                  ? "bg-purple-900 text-white shadow-2xs"
                  : "text-gray-700 bg-white border border-gray-200 hover:bg-gray-50"
              }`}
            >
              <Key size={12} className={libreriaPrivadaActiva === alias ? "text-amber-300" : "text-purple-700"} />
              {label}
            </button>
          ))}
        </div>
      ) : (
        <div className="flex items-center gap-2 border-b border-gray-200 pb-2 overflow-x-auto">
          {[
            ["resumen", "Resumen Ingresos & Gastos"],
            ["gastos", "💸 Gastos Diarios"],
            ["otrosIngresos", "💰 Otros Ingresos"],
            ["cierre", "Arqueo de Caja Hoy"],
            ["movimientos", "Historial de Movimientos"],
          ].map(([id, label]) => (
            <button
              key={id}
              onClick={() => changeTab(id as any)}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors shrink-0 ${
                tab === id
                  ? "bg-purple-900 text-white"
                  : "text-gray-600 bg-white border border-gray-200 hover:bg-gray-50"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* TAB RESUMEN */}
      {tab === "resumen" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
            <StatCard label="Ventas Libros" value={fmt(ingresoVentas)} sub={`${transacciones} transacciones`} icon={DollarSign} color="text-green-700" />
            <StatCard label="Otros Ingresos" value={fmt(totalOtrosIngresos)} sub="Servicios, Aportes, Donaciones" icon={Coins} color="text-emerald-700" />
            <StatCard label="Ingresos Totales" value={fmt(ingresosTotalesGlobales)} sub="Ventas + Otros Ingresos" icon={TrendingUp} color="text-purple-900" />
            <StatCard label="Costo Ventas (COGS)" value={fmt(costoVentas)} sub="Costo libros vendidos" icon={Activity} />
            <StatCard label="Gastos Operativos" value={fmt(totalGastosOperativos)} sub={`${gastos.length} egresos registr.`} icon={TrendingDown} color="text-red-600" />
            <StatCard label="Utilidad Neta Real" value={fmt(utilidadNetaReal)} sub="Resultado final" icon={Receipt} color={utilidadNetaReal >= 0 ? "text-purple-900" : "text-red-700"} />
          </div>

          {/* PANEL DE CONTROL — GRÁFICO RECHARTS VENTAS ÚLTIMA SEMANA */}
          <div className="bg-white rounded-xl border border-purple-100 p-4 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-xs sm:text-sm font-extrabold text-gray-900 flex items-center gap-2">
                  <BarChart3 className="text-purple-700" size={18} />
                  Panel de Control — Ventas Diarias de la Última Semana
                </h3>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Evolución de ingresos acumulados por ventas de libros en los últimos 7 días.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <div className="bg-purple-50 px-3 py-1.5 rounded-lg border border-purple-100 text-right">
                  <span className="text-[10px] text-purple-700 font-bold uppercase block">Total 7 Días</span>
                  <span className="text-xs font-extrabold text-purple-950 font-mono">{fmt(totalSemana)}</span>
                </div>
                <div className="bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100 text-right">
                  <span className="text-[10px] text-emerald-700 font-bold uppercase block">Promedio / Día</span>
                  <span className="text-xs font-extrabold text-emerald-950 font-mono">{fmt(promedioDiarioSemana)}</span>
                </div>
                <div className="bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100 text-right">
                  <span className="text-[10px] text-amber-800 font-bold uppercase block">Libros Vendidos</span>
                  <span className="text-xs font-extrabold text-amber-950 font-mono">{totalLibrosSemana} un.</span>
                </div>
              </div>
            </div>

            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={datosSemana} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                  <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: "#4B5563", fontWeight: 600 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: "#9CA3AF" }}
                    tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-purple-950 text-white p-3 rounded-xl shadow-lg border border-purple-800 text-xs space-y-1">
                            <div className="font-extrabold text-amber-300 flex items-center justify-between gap-3">
                              <span>{data.label}</span>
                              {data.esHoy && (
                                <span className="bg-amber-400 text-purple-950 text-[9px] px-1.5 py-0.5 rounded font-extrabold uppercase">
                                  Hoy
                                </span>
                              )}
                            </div>
                            <div className="font-mono text-sm font-extrabold text-white">
                              {fmt(data.total)}
                            </div>
                            <div className="text-[11px] text-purple-200">
                              📚 {data.libros} libro(s) en {data.transacciones} venta(s)
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="total" radius={[6, 6, 0, 0]} maxBarSize={48}>
                    {datosSemana.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.esHoy ? "#7E22CE" : entry.total > 0 ? "#9333EA" : "#E5E7EB"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* TARJETAS DESGLOSE CATEGORÍAS GASTO Y OTROS INGRESOS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* DESGLOSE DE OTROS INGRESOS */}
            <div className="bg-white rounded-xl border border-emerald-100 p-4 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                  <Coins size={14} className="text-emerald-600" />
                  Desglose de Otros Ingresos por Categoría
                </h4>
                <Btn size="sm" variant="outline" onClick={() => setTab("otrosIngresos")}>
                  Ver todos los ingresos →
                </Btn>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-100">
                  <span className="text-[10px] uppercase font-bold text-emerald-700 block">Servicios</span>
                  <span className="text-xs font-extrabold text-emerald-950 block mt-0.5">{fmt(totalServicios)}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-teal-50 border border-teal-100">
                  <span className="text-[10px] uppercase font-bold text-teal-700 block">Aportes</span>
                  <span className="text-xs font-extrabold text-teal-950 block mt-0.5">{fmt(totalAportes)}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-purple-50 border border-purple-100">
                  <span className="text-[10px] uppercase font-bold text-purple-700 block">Donaciones</span>
                  <span className="text-xs font-extrabold text-purple-950 block mt-0.5">{fmt(totalDonaciones)}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-200">
                  <span className="text-[10px] uppercase font-bold text-gray-600 block">Otro</span>
                  <span className="text-xs font-extrabold text-gray-900 block mt-0.5">{fmt(totalOtrosOtrosIngresos)}</span>
                </div>
              </div>
            </div>

            {/* DESGLOSE DE GASTOS OPERATIVOS */}
            <div className="bg-white rounded-xl border border-red-100 p-4 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                  <Receipt size={14} className="text-red-600" />
                  Desglose de Gastos Operativos por Categoría
                </h4>
                <Btn size="sm" variant="outline" onClick={() => setTab("gastos")}>
                  Ver todos los gastos →
                </Btn>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <div className="p-2.5 rounded-lg bg-red-50 border border-red-100">
                  <span className="text-[10px] uppercase font-bold text-red-700 block">Costos Fijos</span>
                  <span className="text-xs font-extrabold text-red-950 block mt-0.5">{fmt(totalCostosFijos)}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-100">
                  <span className="text-[10px] uppercase font-bold text-amber-700 block">Costos Variables</span>
                  <span className="text-xs font-extrabold text-amber-950 block mt-0.5">{fmt(totalCostosVariables)}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-purple-50 border border-purple-100">
                  <span className="text-[10px] uppercase font-bold text-purple-700 block">Honorarios</span>
                  <span className="text-xs font-extrabold text-purple-950 block mt-0.5">{fmt(totalHonorarios)}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-100">
                  <span className="text-[10px] uppercase font-bold text-blue-700 block">Arriendo/Servicios</span>
                  <span className="text-xs font-extrabold text-blue-950 block mt-0.5">{fmt(totalArriendosServicios)}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-indigo-50 border border-indigo-100">
                  <span className="text-[10px] uppercase font-bold text-indigo-700 block">Suministros</span>
                  <span className="text-xs font-extrabold text-indigo-950 block mt-0.5">{fmt(totalSuministros)}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-200">
                  <span className="text-[10px] uppercase font-bold text-gray-600 block">Otros Gastos</span>
                  <span className="text-xs font-extrabold text-gray-900 block mt-0.5">{fmt(totalOtrosGastos)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-2xs">
              <h4 className="text-xs font-bold text-gray-900 mb-3">Ingresos Mensuales Registrados</h4>
              <div className="space-y-2">
                {meses.map(([mes, val]) => (
                  <div key={mes} className="flex items-center gap-3 text-xs">
                    <span className="w-12 text-gray-500 font-medium">{mes}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                      <div
                        className="h-full bg-emerald-600 rounded-full flex items-center pl-3 text-white text-[10px] font-bold transition-all"
                        style={{ width: `${Math.max(8, (val / maxMes) * 100)}%` }}
                      >
                        {fmt(val)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-2xs flex flex-col justify-between space-y-3">
              <div>
                <h4 className="text-xs font-bold text-gray-900 mb-1">Valorización del Inventario Actual</h4>
                <p className="text-xs text-gray-500">
                  Resumen global del costo de adquisición vs. valor total de venta del stock.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
                <div>
                  <span className="text-[10px] text-gray-500 font-medium block">Total Costo Inv.</span>
                  <span className="text-sm font-extrabold text-gray-900 font-mono">{fmt(valorCostoTotal)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 font-medium block">Total P. Venta Inv.</span>
                  <span className="text-sm font-extrabold text-purple-900 font-mono">{fmt(valorVentaTotal)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tabla Venta Detalle */}
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-2xs">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <span className="text-xs font-bold text-gray-900">Historial de Ventas</span>
              <Btn
                onClick={() =>
                  exportCSV(
                    `ventas-${hoyStr}.csv`,
                    ventas.map(v => ({
                      ID: v.id,
                      Fecha: v.fecha,
                      Hora: v.hora || "",
                      Vendedor: v.vendedor,
                      Total: v.total,
                      MétodoPago: v.metodoPago,
                      Estado: v.estado,
                    }))
                  )
                }
                size="sm"
                variant="outline"
              >
                <RefreshCw size={12} /> Exportar CSV
              </Btn>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs min-w-[500px]">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50 text-gray-400 font-medium text-left">
                    <th className="px-4 py-2">ID</th>
                    <th className="px-4 py-2">Fecha</th>
                    <th className="px-4 py-2">Vendedor</th>
                    <th className="px-4 py-2">Método</th>
                    <th className="px-4 py-2">Total</th>
                    <th className="px-4 py-2">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {ventas.map(v => (
                    <tr key={v.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 font-mono text-gray-500">{v.id}</td>
                      <td className="px-4 py-2 text-gray-600">
                        {v.fecha} {v.hora ? `· ${v.hora}` : ""}
                      </td>
                      <td className="px-4 py-2 text-gray-700">{v.vendedor}</td>
                      <td className="px-4 py-2 text-gray-600">{v.metodoPago}</td>
                      <td className="px-4 py-2 font-bold text-gray-900">{fmt(v.total)}</td>
                      <td className="px-4 py-2">
                        <Badge variant={v.estado === "pagado" ? "green" : "red"}>{v.estado}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB GASTOS DIARIOS */}
      {tab === "gastos" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-gray-100 shadow-2xs">
            <div>
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Receipt size={16} className="text-purple-700" />
                Control de Gastos Diarios Operativos
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Ingresa y organiza los costos fijos, variables, honorarios y gastos cotidianos de la librería.
              </p>
            </div>
            <Btn onClick={() => setModalGastoOpen(true)}>
              <Plus size={14} /> Registrar Nuevo Gasto
            </Btn>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard label="Total Gastos Registrados" value={fmt(totalGastosOperativos)} sub={`${gastos.length} egresos totales`} icon={TrendingDown} color="text-red-600" />
            <StatCard label="Costos Fijos" value={fmt(totalCostosFijos)} sub="Arriendo, luz, etc." icon={Building} color="text-red-700" />
            <StatCard label="Costos Variables" value={fmt(totalCostosVariables)} sub="Insumos, variables" icon={Activity} color="text-amber-700" />
            <StatCard label="Honorarios" value={fmt(totalHonorarios)} sub="Apoyo y servicios" icon={Receipt} color="text-purple-800" />
          </div>

          <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
              <Input
                placeholder="Buscar por descripción o usuario..."
                value={busquedaGasto}
                onChange={(e: any) => setBusquedaGasto(e.target.value)}
                className="w-full sm:w-64 text-xs"
              />
              <Select
                value={filtroCategoriaGasto}
                onChange={(e: any) => setFiltroCategoriaGasto(e.target.value)}
                className="w-full sm:w-auto text-xs"
              >
                <option value="Todas">Todas las categorías</option>
                <option value="Costo Fijo">Costo Fijo</option>
                <option value="Costo Variable">Costo Variable</option>
                <option value="Honorarios">Honorarios</option>
                <option value="Arriendo / Servicios">Arriendo / Servicios</option>
                <option value="Suministros">Suministros</option>
                <option value="Otro">Otro</option>
              </Select>
            </div>

            <Btn
              variant="outline"
              size="sm"
              onClick={() =>
                exportCSV(
                  `gastos-diarios-${hoyStr}.csv`,
                  gastos.map(g => ({
                    ID: g.id,
                    Fecha: g.fecha,
                    Hora: g.hora || "",
                    Monto: g.monto,
                    Categoría: g.categoria,
                    Descripción: g.descripcion,
                    MétodoPago: g.metodoPago,
                    RegistradoPor: g.registradoPor || "",
                  }))
                )
              }
            >
              <RefreshCw size={12} /> Exportar CSV Gastos
            </Btn>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-xs min-w-[650px]">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50 text-gray-400 font-medium text-left">
                    <th className="px-4 py-2">ID / Fecha</th>
                    <th className="px-4 py-2">Categoría</th>
                    <th className="px-4 py-2">Descripción</th>
                    <th className="px-4 py-2">Método Pago</th>
                    <th className="px-4 py-2">Monto ($)</th>
                    <th className="px-4 py-2">Registrado Por</th>
                    <th className="px-4 py-2 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {gastosFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-6 text-gray-400 italic">
                        No hay gastos registrados con los filtros seleccionados.
                      </td>
                    </tr>
                  ) : (
                    gastosFiltrados.map(g => (
                      <tr key={g.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2.5">
                          <div className="font-mono text-gray-500 font-bold">{g.id}</div>
                          <div className="text-[10px] text-gray-400">{g.fecha} {g.hora ? `· ${g.hora}` : ""}</div>
                        </td>
                        <td className="px-4 py-2.5">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              g.categoria === "Costo Fijo"
                                ? "bg-red-50 text-red-800 border-red-200"
                                : g.categoria === "Costo Variable"
                                ? "bg-amber-50 text-amber-800 border-amber-200"
                                : g.categoria === "Honorarios"
                                ? "bg-purple-50 text-purple-800 border-purple-200"
                                : g.categoria === "Arriendo / Servicios"
                                ? "bg-blue-50 text-blue-800 border-blue-200"
                                : g.categoria === "Suministros"
                                ? "bg-indigo-50 text-indigo-800 border-indigo-200"
                                : "bg-gray-100 text-gray-800 border-gray-200"
                            }`}
                          >
                            {g.categoria}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 font-semibold text-gray-900">{g.descripcion}</td>
                        <td className="px-4 py-2.5 text-gray-600">{g.metodoPago}</td>
                        <td className="px-4 py-2.5 font-extrabold text-red-600 font-mono">-{fmt(g.monto)}</td>
                        <td className="px-4 py-2.5 text-gray-500">{g.registradoPor || "Admin"}</td>
                        <td className="px-4 py-2.5 text-right">
                          <button
                            onClick={() => handleDeleteGasto(g.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Eliminar gasto"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB OTROS INGRESOS (Servicios, Aportes, Donaciones, etc.) */}
      {tab === "otrosIngresos" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-gray-100 shadow-2xs">
            <div>
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Coins size={16} className="text-emerald-700" />
                Control de Otros Ingresos (Servicios, Aportes, Donaciones, etc.)
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Registra ingresos adicionales no provenientes de la venta directa de libros.
              </p>
            </div>
            <Btn onClick={() => setModalOtroIngresoOpen(true)}>
              <Plus size={14} /> Registrar Otro Ingreso
            </Btn>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard label="Total Otros Ingresos" value={fmt(totalOtrosIngresos)} sub={`${otrosIngresos.length} ingresos registr.`} icon={TrendingUp} color="text-emerald-700" />
            <StatCard label="Servicios" value={fmt(totalServicios)} sub="Arriendo taller, asesorías" icon={Coins} color="text-emerald-800" />
            <StatCard label="Aportes" value={fmt(totalAportes)} sub="Aportes de socios/fondos" icon={HeartHandshake} color="text-teal-800" />
            <StatCard label="Donaciones" value={fmt(totalDonaciones)} sub="Donaciones de amigos" icon={HandHeart} color="text-purple-800" />
          </div>

          <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
              <Input
                placeholder="Buscar por descripción o usuario..."
                value={busquedaOtroIngreso}
                onChange={(e: any) => setBusquedaOtroIngreso(e.target.value)}
                className="w-full sm:w-64 text-xs"
              />
              <Select
                value={filtroCategoriaOtroIngreso}
                onChange={(e: any) => setFiltroCategoriaOtroIngreso(e.target.value)}
                className="w-full sm:w-auto text-xs"
              >
                <option value="Todas">Todas las categorías</option>
                <option value="Servicios">Servicios</option>
                <option value="Aportes">Aportes</option>
                <option value="Donaciones">Donaciones</option>
                <option value="Otro">Otro</option>
              </Select>
            </div>

            <Btn
              variant="outline"
              size="sm"
              onClick={() =>
                exportCSV(
                  `otros-ingresos-${hoyStr}.csv`,
                  otrosIngresos.map(oi => ({
                    ID: oi.id,
                    Fecha: oi.fecha,
                    Hora: oi.hora || "",
                    Monto: oi.monto,
                    Categoría: oi.categoria,
                    Descripción: oi.descripcion,
                    MétodoPago: oi.metodoPago,
                    RegistradoPor: oi.registradoPor || "",
                  }))
                )
              }
            >
              <RefreshCw size={12} /> Exportar CSV Otros Ingresos
            </Btn>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-xs min-w-[650px]">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50 text-gray-400 font-medium text-left">
                    <th className="px-4 py-2">ID / Fecha</th>
                    <th className="px-4 py-2">Categoría</th>
                    <th className="px-4 py-2">Descripción</th>
                    <th className="px-4 py-2">Método Pago</th>
                    <th className="px-4 py-2">Monto ($)</th>
                    <th className="px-4 py-2">Registrado Por</th>
                    <th className="px-4 py-2 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {otrosIngresosFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-6 text-gray-400 italic">
                        No hay otros ingresos registrados con los filtros seleccionados.
                      </td>
                    </tr>
                  ) : (
                    otrosIngresosFiltrados.map(oi => (
                      <tr key={oi.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2.5">
                          <div className="font-mono text-gray-500 font-bold">{oi.id}</div>
                          <div className="text-[10px] text-gray-400">{oi.fecha} {oi.hora ? `· ${oi.hora}` : ""}</div>
                        </td>
                        <td className="px-4 py-2.5">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              oi.categoria === "Servicios"
                                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                : oi.categoria === "Aportes"
                                ? "bg-teal-50 text-teal-800 border-teal-200"
                                : oi.categoria === "Donaciones"
                                ? "bg-purple-50 text-purple-800 border-purple-200"
                                : "bg-gray-100 text-gray-800 border-gray-200"
                            }`}
                          >
                            {oi.categoria}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 font-semibold text-gray-900">{oi.descripcion}</td>
                        <td className="px-4 py-2.5 text-gray-600">{oi.metodoPago}</td>
                        <td className="px-4 py-2.5 font-extrabold text-emerald-700 font-mono">+{fmt(oi.monto)}</td>
                        <td className="px-4 py-2.5 text-gray-500">{oi.registradoPor || "Admin"}</td>
                        <td className="px-4 py-2.5 text-right">
                          <button
                            onClick={() => handleDeleteOtroIngreso(oi.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Eliminar ingreso"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB DISTRIBUCIÓN LIBRERÍAS Y TRAMA */}
      {tab === "librerias" && (
        <div className="space-y-3">
          {/* SI HAY UNA LIBRERÍA SELECCIONADA CON PÁGINA PRIVADA ACTIVA */}
          {libreriaPrivadaActiva ? (
            <div className="space-y-3">
              {/* HEADER DE PÁGINA PRIVADA DE LIBRERÍA COMPACTO */}
              <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white p-3.5 sm:p-4 rounded-xl shadow-md space-y-3">
                {editandoBannerLibreria ? (
                  <div className="space-y-3 bg-black/20 p-3.5 rounded-xl border border-white/10">
                    <div className="flex items-center justify-between pb-2 border-b border-white/10">
                      <h3 className="text-xs font-bold text-amber-300 flex items-center gap-2">
                        <Edit2 size={14} /> Editar Información de {libreriaPrivadaActiva}
                      </h3>
                      <button
                        onClick={() => setEditandoBannerLibreria(false)}
                        className="text-xs text-purple-200 hover:text-white cursor-pointer"
                      >
                        Cancelar
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                      <div>
                        <label className="text-[11px] font-semibold text-purple-200 block mb-1">Nombre / Título</label>
                        <input
                          type="text"
                          value={formBannerLibreria.nombre}
                          onChange={e => setFormBannerLibreria(p => ({ ...p, nombre: e.target.value }))}
                          className="w-full text-xs bg-white/10 border border-white/20 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-amber-400"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-purple-200 block mb-1">Contacto Directo</label>
                        <input
                          type="text"
                          value={formBannerLibreria.contacto}
                          onChange={e => setFormBannerLibreria(p => ({ ...p, contacto: e.target.value }))}
                          className="w-full text-xs bg-white/10 border border-white/20 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-amber-400"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-purple-200 block mb-1">Teléfono</label>
                        <input
                          type="text"
                          value={formBannerLibreria.telefono}
                          onChange={e => setFormBannerLibreria(p => ({ ...p, telefono: e.target.value }))}
                          className="w-full text-xs bg-white/10 border border-white/20 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-amber-400"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-purple-200 block mb-1">Email</label>
                        <input
                          type="text"
                          value={formBannerLibreria.email}
                          onChange={e => setFormBannerLibreria(p => ({ ...p, email: e.target.value }))}
                          className="w-full text-xs bg-white/10 border border-white/20 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-amber-400"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-purple-200 block mb-1">Clave de Acceso Privado</label>
                        <input
                          type="text"
                          value={formBannerLibreria.claveAcceso}
                          onChange={e => setFormBannerLibreria(p => ({ ...p, claveAcceso: e.target.value }))}
                          className="w-full text-xs bg-white/10 border border-white/20 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-amber-400 font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-purple-200 block mb-1">Logo de la Librería</label>
                        <div className="flex items-center gap-2">
                          {formBannerLibreria.logo ? (
                            <div className="relative shrink-0">
                              <img src={formBannerLibreria.logo} alt="Logo preview" className="max-h-8 max-w-[80px] rounded-md object-contain bg-white/20 p-0.5 border border-white/30" />
                              <button
                                type="button"
                                onClick={() => setFormBannerLibreria(p => ({ ...p, logo: "" }))}
                                className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full p-0.5 text-[8px] hover:bg-red-700 cursor-pointer"
                                title="Quitar logo"
                              >
                                <X size={10} />
                              </button>
                            </div>
                          ) : null}
                          <label className="cursor-pointer bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs px-2.5 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5">
                            <Upload size={13} /> {formBannerLibreria.logo ? "Cambiar Logo" : "Subir Logo"}
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onload = (ev) => {
                                    if (ev.target?.result) {
                                      setFormBannerLibreria(p => ({ ...p, logo: ev.target!.result as string }));
                                    }
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                          </label>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        onClick={() => setEditandoBannerLibreria(false)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-purple-200 hover:text-white bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={guardarEdicionBanner}
                        className="px-4 py-1.5 rounded-lg text-xs font-extrabold text-purple-950 bg-amber-400 hover:bg-amber-300 transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer"
                      >
                        <Check size={14} /> Guardar Cambios
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2.5">
                      <button
                        onClick={() => seleccionarLibreriaPrivada(null)}
                        className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-purple-200 hover:text-white transition-colors cursor-pointer shrink-0"
                        title="Volver a la vista general de librerías"
                      >
                        <ArrowLeft size={16} />
                      </button>
                      <div className="flex items-center gap-2.5">
                        {libreriaActualObj?.logo ? (
                          <img
                            src={libreriaActualObj.logo}
                            alt={libreriaActualObj.nombre}
                            className="max-h-12 max-w-[130px] rounded-lg object-contain bg-white/10 p-1 border border-white/20 shrink-0 shadow-xs"
                          />
                        ) : (
                          <div className="p-2 bg-white/10 rounded-lg shrink-0">
                            <Building2 size={20} className="text-purple-200" />
                          </div>
                        )}
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                              <Lock size={10} /> Página Privada
                            </span>
                            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-purple-200 bg-white/10 px-2 py-0.5 rounded-md border border-white/10">
                              <Calendar size={10} className="text-purple-300" /> Hoy: {textoFechaHoy}
                            </span>
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-purple-200 bg-white/10 px-2 py-0.5 rounded-md border border-white/10">
                              <Clock size={10} className="text-purple-300" /> Periodo: {textoPeriodoEnCurso}
                            </span>
                          </div>
                          <h2 className="text-lg font-black text-white mt-0.5">
                            {libreriaActualObj?.nombre || `Librería ${libreriaPrivadaActiva}`}
                          </h2>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-right">
                        <span className="text-[9px] text-purple-200 block">Contacto Directo</span>
                        <span className="text-xs font-semibold text-white">{libreriaActualObj?.contacto || "Administración"}</span>
                      </div>
                      <Btn
                        size="sm"
                        variant="outline"
                        className="bg-white/10 text-white border-white/20 hover:bg-white/20"
                        onClick={() => seleccionarLibreriaPrivada(null)}
                      >
                        Cerrar Sesión Privada
                      </Btn>
                      <button
                        onClick={iniciarEdicionBanner}
                        className="p-1.5 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-lg border border-white/10 transition-colors shrink-0 cursor-pointer"
                        title="Editar Banner"
                      >
                        <Edit2 size={15} />
                      </button>
                    </div>
                  </div>
                )}

                {/* BANNER MÍNIMO CON DATOS RESUMEN PARA LA PÁGINA PRIVADA */}
                {(() => {
                  const statLibreriaActual = statsLibrerias.find(
                    st => (st.nombre || "").toLowerCase() === (libreriaPrivadaActiva || "").toLowerCase() ||
                          (libreriaPrivadaActiva || "").toLowerCase().includes((st.nombre || "").toLowerCase())
                  );
                  return (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-white/10">
                      <div className="bg-white/10 backdrop-blur-xs p-2 rounded-lg border border-white/10">
                        <span className="text-[9px] font-bold text-purple-200 uppercase block truncate">Ventas Registradas</span>
                        <span className="text-xs font-black text-white font-mono block">{fmt(statLibreriaActual?.ventasMonto || totalVentasLibreriaMonto)}</span>
                      </div>
                      <div className="bg-white/10 backdrop-blur-xs p-2 rounded-lg border border-white/10">
                        <span className="text-[9px] font-bold text-emerald-300 uppercase block truncate">Utilidad Neta</span>
                        <span className="text-xs font-black text-emerald-200 font-mono block">{fmt(statLibreriaActual?.utilidadLib || totalUtilidadLibreriaMonto)}</span>
                      </div>
                      <div className="bg-white/10 backdrop-blur-xs p-2 rounded-lg border border-white/10">
                        <span className="text-[9px] font-bold text-indigo-300 uppercase block truncate">Comisión Trama</span>
                        <span className="text-xs font-black text-indigo-200 font-mono block">{fmt(statLibreriaActual?.utilidadTrama || totalComisionTramaMonto)}</span>
                      </div>
                      <div className="bg-amber-400/20 backdrop-blur-xs p-2 rounded-lg border border-amber-300/30">
                        <span className="text-[9px] font-bold text-amber-300 uppercase block truncate">Balance Mensual Red</span>
                        <span className="text-xs font-black text-amber-200 font-mono block">{fmt(totalUtilidadTramaPeriodo)}</span>
                      </div>
                    </div>
                  );
                })()}

                {/* MENÚ SUB-TABS PRIVADAS POR SEPARADO (CENTRADOS) */}
                <div className="flex flex-wrap items-center justify-center gap-2 pt-2 border-t border-white/10">
                  <button
                    onClick={() => setSubTabPrivada("inventario")}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      subTabPrivada === "inventario"
                        ? "bg-amber-400 text-purple-950 shadow-md font-extrabold scale-[1.02]"
                        : "bg-white/10 text-purple-100 hover:bg-white/20"
                    }`}
                  >
                    <Package size={14} /> Inventario Propio ({librosLibreriaPrivada.length})
                  </button>
                  <button
                    onClick={() => setSubTabPrivada("proveedores")}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      subTabPrivada === "proveedores"
                        ? "bg-amber-400 text-purple-950 shadow-md font-extrabold scale-[1.02]"
                        : "bg-white/10 text-purple-100 hover:bg-white/20"
                    }`}
                  >
                    <Truck size={14} /> Directorio Proveedores ({proveedoresLibreriaPrivada.length})
                  </button>
                  <button
                    onClick={() => setSubTabPrivada("cuentasPorPagar")}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      subTabPrivada === "cuentasPorPagar"
                        ? "bg-amber-400 text-purple-950 shadow-md font-extrabold scale-[1.02]"
                        : "bg-white/10 text-purple-100 hover:bg-white/20"
                    }`}
                  >
                    <Banknote size={14} /> Cuentas por Pagar ({librosLibreriaPrivada.filter(b => !b.pagado).length})
                  </button>
                  <button
                    onClick={() => setSubTabPrivada("contable")}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      subTabPrivada === "contable"
                        ? "bg-amber-400 text-purple-950 shadow-md font-extrabold scale-[1.02]"
                        : "bg-white/10 text-purple-100 hover:bg-white/20"
                    }`}
                  >
                    <DollarSign size={14} /> Datos Contables ({ventasLibreriaDetalle.length})
                  </button>
                </div>
              </div>

              {/* BARRA DE BÚSQUEDA PRIVADA */}
              <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-2xs flex items-center gap-3">
                <Search size={16} className="text-gray-400 shrink-0 ml-1" />
                <input
                  type="text"
                  placeholder={
                    subTabPrivada === "inventario"
                      ? "Buscar en inventario privado por título, autor, ISBN..."
                      : subTabPrivada === "proveedores"
                      ? "Buscar proveedor por nombre, ciudad, contacto..."
                      : subTabPrivada === "cuentasPorPagar"
                      ? "Buscar libro o editorial en cuentas por pagar..."
                      : "Filtrar registros contables o ventas..."
                  }
                  value={busquedaPrivada}
                  onChange={e => setBusquedaPrivada(e.target.value)}
                  className="w-full text-xs outline-none bg-transparent text-gray-800 placeholder:text-gray-400"
                />
                {busquedaPrivada && (
                  <button
                    onClick={() => setBusquedaPrivada("")}
                    className="text-xs text-gray-400 hover:text-gray-600 px-2 font-bold cursor-pointer"
                  >
                    Limpiar
                  </button>
                )}
              </div>

              {/* SECCIÓN 1: INVENTARIO PRIVADO */}
              {subTabPrivada === "inventario" && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <StatCard
                      label="Títulos en Consignación / Propiedad"
                      value={librosLibreriaPrivada.length}
                      icon={Package}
                    />
                    <StatCard
                      label="Unidades Totales en Stock"
                      value={`${librosLibreriaPrivada.reduce((s, b) => s + b.stock + (b.stockTrama || 0), 0)} un.`}
                      sub={`${librosLibreriaPrivada.reduce((s, b) => s + b.stock, 0)} local + ${librosLibreriaPrivada.reduce((s, b) => s + (b.stockTrama || 0), 0)} trama`}
                      icon={BookOpen}
                    />
                    <StatCard
                      label="Valor Total de Venta del Stock"
                      value={fmt(librosLibreriaPrivada.reduce((s, b) => s + b.precio * (b.stock + (b.stockTrama || 0)), 0))}
                      icon={Coins}
                    />
                  </div>

                  <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-2xs">
                    <div className="px-4 py-3 border-b border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div>
                        <span className="text-xs font-bold text-gray-900 block">
                          Catálogo de Libros en Inventario Propio — Librería {libreriaPrivadaActiva}
                        </span>
                        <span className="text-[11px] text-gray-400">
                          Gestiona tus títulos locales, realiza cargas masivas en Excel o agrega nuevos libros.
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Btn
                          size="sm"
                          variant="outline"
                          onClick={() => setModalImportExcel(true)}
                          className="bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100 font-bold cursor-pointer transition-all"
                        >
                          <Upload size={13} className="text-emerald-700" /> Cargar Excel (.xlsx / .csv)
                        </Btn>
                        <Btn
                          size="sm"
                          variant="outline"
                          onClick={() => exportBooksToExcel(librosLibreriaPrivada, `inventario_${libreriaPrivadaActiva}_${new Date().toISOString().slice(0, 10)}.xlsx`)}
                          className="text-gray-700 hover:bg-gray-100 font-semibold cursor-pointer transition-all"
                        >
                          <FileSpreadsheet size={13} className="text-emerald-600" /> Exportar Excel
                        </Btn>
                        <Btn
                          size="sm"
                          variant="purple"
                          onClick={abrirNuevoBookPrivado}
                          className="shadow-md shadow-purple-200/50 hover:scale-102 transition-all cursor-pointer font-extrabold text-white hover:text-white"
                        >
                          <Plus size={13} className="text-white" /> Ingresar Libro a Inventario Propio
                        </Btn>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs min-w-[750px]">
                        <thead>
                          <tr className="border-b border-gray-100 bg-gray-50 text-gray-400 font-medium text-left">
                            <th className="px-4 py-2">Portada / Título</th>
                            <th className="px-4 py-2">Autor</th>
                            <th className="px-4 py-2">Editorial</th>
                            <th className="px-4 py-2">Proveedor</th>
                            <th className="px-4 py-2">Stock Local</th>
                            <th className="px-4 py-2 text-purple-900 font-bold">Stock Trama</th>
                            <th className="px-4 py-2">Precio Costo</th>
                            <th className="px-4 py-2">Precio Venta</th>
                            <th className="px-4 py-2">% Trama ($)</th>
                            <th className="px-4 py-2 text-purple-900 font-bold">Margen Neto</th>
                            <th className="px-4 py-2 text-right">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {librosLibreriaFiltrados.length === 0 ? (
                            <tr>
                              <td colSpan={11} className="text-center py-8 text-gray-400">
                                No se encontraron libros registrados para esta librería con ese criterio.
                              </td>
                            </tr>
                          ) : (
                            librosLibreriaFiltrados.map(b => {
                              const pctT = b.porcentajeTrama ?? 10;
                              const costo = b.precioCosto || 0;
                              const uTramaUnidad = Math.round(b.precio * (pctT / 100));
                              const margenNetoUnidad = Math.max(0, b.precio - costo - uTramaUnidad);
                              const provNombre = proveedores.find(p => p.id === b.proveedor)?.nombre || "-";

                              return (
                                <tr key={b.id} className="hover:bg-gray-50">
                                  <td className="px-4 py-2 font-bold text-gray-900">
                                    <div className="flex items-center gap-2.5">
                                      {b.portada ? (
                                        <img
                                          src={b.portada}
                                          alt={b.titulo}
                                          className="w-7 h-9 object-cover rounded shadow-2xs border border-gray-200 shrink-0"
                                        />
                                      ) : (
                                        <div className="w-7 h-9 bg-purple-50 text-purple-600 rounded border border-purple-100 flex items-center justify-center shrink-0">
                                          <BookOpen size={13} />
                                        </div>
                                      )}
                                      <span className="line-clamp-2">{b.titulo}</span>
                                    </div>
                                  </td>
                                  <td className="px-4 py-2.5 text-gray-700">{b.autor || "-"}</td>
                                  <td className="px-4 py-2.5 text-gray-500">{b.editorial || "-"}</td>
                                  <td className="px-4 py-2.5 text-purple-900 font-medium">{provNombre}</td>
                                  <td className="px-4 py-2.5">
                                    <div className="flex items-center gap-1.5 font-bold font-mono text-gray-900">
                                      <span>{b.stock} un.</span>
                                      <StockBadge stock={b.stock} min={b.stockMin} />
                                    </div>
                                  </td>
                                  <td className="px-4 py-2.5">
                                    <span className="inline-block font-extrabold text-purple-900 bg-purple-50 border border-purple-200/80 px-2.5 py-0.5 rounded-full text-[11px]">
                                      {b.stockTrama || 0} un.
                                    </span>
                                  </td>
                                  <td className="px-4 py-2.5 font-mono text-red-700">{fmt(costo)}</td>
                                  <td className="px-4 py-2.5 font-mono font-bold text-gray-900">{fmt(b.precio)}</td>
                                  <td className="px-4 py-2.5 font-bold text-indigo-800">
                                    <div>{pctT}%</div>
                                    <div className="text-[10px] text-indigo-600 font-mono font-semibold">{fmt(uTramaUnidad)}</div>
                                  </td>
                                  <td className="px-4 py-2.5 font-mono font-extrabold text-purple-900">
                                    {fmt(margenNetoUnidad)}
                                  </td>
                                  <td className="px-4 py-2.5 text-right">
                                    <div className="flex items-center justify-end gap-1">
                                      <button
                                        onClick={() => abrirEditarBookPrivado(b)}
                                        title="Editar libro desde Inventario Propio"
                                        className="p-1.5 text-gray-500 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer"
                                      >
                                        <Edit2 size={14} />
                                      </button>
                                      <button
                                        onClick={() => eliminarBookPrivado(b.id, b.titulo)}
                                        title="Eliminar de Inventario Propio"
                                        className="p-1.5 text-gray-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* SECCIÓN 2: DIRECTORIO DE PROVEEDORES PRIVADO */}
              {subTabPrivada === "proveedores" && (
                <div className="space-y-3">
                  <div className="bg-purple-50 border border-purple-100 p-4 rounded-xl text-xs text-purple-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <ShieldCheck size={18} className="text-purple-700 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold block text-purple-900">Directorio Exclusivo de Editoriales & Proveedores Asociados</span>
                        Muestra la información de contacto directa y comercial de las editoriales que distribuyen títulos en Librería {libreriaPrivadaActiva}.
                      </div>
                    </div>
                    <Btn size="sm" onClick={abrirNuevoProveedor} className="shrink-0">
                      <Plus size={13} /> Agregar Proveedor
                    </Btn>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {proveedoresLibreriaFiltrados.length === 0 ? (
                      <div className="col-span-full bg-white p-8 text-center rounded-xl border border-gray-100 text-gray-400">
                        No hay proveedores registrados vinculados a los títulos de esta librería.
                      </div>
                    ) : (
                      proveedoresLibreriaFiltrados.map(p => (
                        <div key={p.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-2xs space-y-3 flex flex-col justify-between">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-sm text-gray-900 flex items-center gap-1.5">
                                <Truck size={15} className="text-purple-600" />
                                {p.nombre}
                              </span>
                              <Badge variant="blue">{p.ciudad}</Badge>
                            </div>

                            <div className="space-y-1 text-xs text-gray-600 pt-1">
                              <p><strong>Contacto:</strong> {p.contacto || "No especificado"}</p>
                              <p><strong>Email:</strong> <a href={`mailto:${p.email}`} className="text-purple-700 hover:underline">{p.email}</a></p>
                              <p><strong>Teléfono:</strong> {p.telefono || "—"}</p>
                              {p.rut && <p className="font-mono text-[11px] text-gray-500">RUT: {p.rut}</p>}
                              {p.condicionesPago && <p className="text-[11px] text-purple-900 font-medium">Condición: {p.condicionesPago}</p>}
                            </div>

                            {p.observaciones && (
                              <p className="text-[11px] text-gray-500 bg-gray-50 p-2 rounded-lg border border-gray-100 italic">
                                "{p.observaciones}"
                              </p>
                            )}
                          </div>

                          <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-gray-100">
                            <button
                              onClick={() => abrirEditarProveedor(p)}
                              className="p-1.5 text-gray-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer text-xs flex items-center gap-1 font-medium"
                              title="Editar Proveedor"
                            >
                              <Edit2 size={13} /> Editar
                            </button>
                            <button
                              onClick={() => eliminarProveedor(p.id, p.nombre)}
                              className="p-1.5 text-gray-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer text-xs flex items-center gap-1 font-medium"
                              title="Eliminar Proveedor"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* SECCIÓN 3: CUENTAS POR PAGAR PROVEEDORES DE CADA LIBRERÍA */}
              {subTabPrivada === "cuentasPorPagar" && (
                <div className="space-y-4">
                  {/* METRICAS DE CUENTAS POR PAGAR */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <StatCard
                      label="Por Pagar a Editoriales"
                      value={fmt(porPagarLibreria)}
                      sub="Títulos con factura / pago pendiente"
                      icon={Banknote}
                      color="text-red-600"
                    />
                    <StatCard
                      label="Total Ya Pagado a Proveedores"
                      value={fmt(pagadoLibreria)}
                      sub="Adquisiciones liquidadas"
                      icon={CheckCircle}
                      color="text-emerald-700"
                    />
                    <StatCard
                      label="Inversión Total en Adquisiciones"
                      value={fmt(porPagarLibreria + pagadoLibreria)}
                      sub={`Total inventario de ${libreriaPrivadaActiva}`}
                      icon={Coins}
                      color="text-purple-900"
                    />
                  </div>

                  {/* RESUMEN POR PROVEEDOR / EDITORIAL EN ESTA LIBRERÍA */}
                  <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-2xs">
                    <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-gray-900 block flex items-center gap-1.5">
                          <Truck size={15} className="text-purple-700" />
                          Resumen de Cuentas por Pagar por Proveedor/Editorial — {libreriaPrivadaActiva}
                        </span>
                        <span className="text-[11px] text-gray-500">
                          Consolidado de obligaciones pendientes y saldadas con editoriales distribuidas por {libreriaPrivadaActiva}.
                        </span>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs min-w-[600px]">
                        <thead>
                          <tr className="border-b border-gray-100 bg-gray-50 text-gray-400 font-medium text-left">
                            <th className="px-4 py-2">Proveedor / Editorial</th>
                            <th className="px-4 py-2">Contacto</th>
                            <th className="px-4 py-2 text-red-600">Por Pagar</th>
                            <th className="px-4 py-2 text-emerald-700">Pagado</th>
                            <th className="px-4 py-2">Total Invertido</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {porProveedorLibreria.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="text-center py-6 text-gray-400 italic">
                                No hay inventario o proveedores con saldo en esta librería.
                              </td>
                            </tr>
                          ) : (
                            porProveedorLibreria.map(p => (
                              <tr key={p.id} className="hover:bg-gray-50">
                                <td className="px-4 py-2.5 font-bold text-gray-900">{p.nombre}</td>
                                <td className="px-4 py-2.5 text-gray-600">{p.contacto || "—"}</td>
                                <td className="px-4 py-2.5 font-extrabold text-red-600">
                                  {p.porPagar > 0 ? fmt(p.porPagar) : "—"}
                                </td>
                                <td className="px-4 py-2.5 font-extrabold text-emerald-700">
                                  {p.pagado > 0 ? fmt(p.pagado) : "—"}
                                </td>
                                <td className="px-4 py-2.5 font-bold text-gray-800">
                                  {fmt(p.totalInvertido)}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* TABLA DETALLADA DE LIBROS Y ESTADO DE PAGO */}
                  <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-2xs">
                    <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-gray-900 block">
                          Detalle de Libros en Inventario Privado y Estado de Pago a Proveedores
                        </span>
                        <span className="text-[11px] text-gray-400">
                          Ingresa el abono directamente en la casilla o haz clic en el botón de estado de pago.
                        </span>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs min-w-[850px]">
                        <thead>
                          <tr className="border-b border-gray-100 bg-gray-50 text-gray-400 font-medium text-left">
                            <th className="px-3 py-2">Libro / Título</th>
                            <th className="px-3 py-2">Proveedor</th>
                            <th className="px-3 py-2">Modalidad</th>
                            <th className="px-3 py-2">Stock</th>
                            <th className="px-3 py-2">P. Costo Unit.</th>
                            <th className="px-3 py-2">Costo Total</th>
                            <th className="px-3 py-2 text-right">Abono</th>
                            <th className="px-3 py-2 text-right">Saldo Adeudado</th>
                            <th className="px-3 py-2 text-right">Estado de Pago</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {librosLibreriaFiltrados.length === 0 ? (
                            <tr>
                              <td colSpan={9} className="text-center py-6 text-gray-400">
                                No se encontraron libros registrados en el inventario privado.
                              </td>
                            </tr>
                          ) : (
                            librosLibreriaFiltrados.map(b => {
                              const prov = proveedores.find(p => p.id === b.proveedor);
                              const costoTotalLinea = valorLineaCosto(b);
                              const abonoMonto = b.pagado ? costoTotalLinea : (b.abono || 0);
                              const saldoAdeudado = Math.max(0, costoTotalLinea - abonoMonto);

                              return (
                                <tr key={b.id} className="hover:bg-gray-50">
                                  <td className="px-3 py-2.5 font-bold text-gray-900">
                                    <div>{b.titulo}</div>
                                    <div className="text-[10px] text-gray-400 font-normal">{b.autor}</div>
                                  </td>
                                  <td className="px-3 py-2.5 text-gray-700 font-medium">
                                    {prov?.nombre || "—"}
                                  </td>
                                  <td className="px-3 py-2.5">
                                    <Badge variant={b.tipoAdquisicion === "Concesión" ? "amber" : "blue"}>
                                      {b.tipoAdquisicion || "Adquirido"}
                                    </Badge>
                                  </td>
                                  <td className="px-3 py-2.5 font-mono text-gray-900 font-bold">
                                    <div>{b.stock + (b.stockTrama || 0)} un.</div>
                                    {Boolean(b.stockTrama) && (
                                      <div className="text-[10px] text-gray-400 font-normal font-sans">
                                        ({b.stock} local + {b.stockTrama} trama)
                                      </div>
                                    )}
                                  </td>
                                  <td className="px-3 py-2.5 font-mono text-gray-700">
                                    {fmt(b.precioCosto || 0)}
                                  </td>
                                  <td className="px-3 py-2.5 font-mono font-extrabold text-gray-900">
                                    {fmt(costoTotalLinea)}
                                  </td>
                                  <td className="px-3 py-2.5 font-mono text-right">
                                    {b.pagado ? (
                                      <span className="font-bold text-emerald-700">{fmt(costoTotalLinea)}</span>
                                    ) : (
                                      <div className="flex items-center justify-end gap-1">
                                        <span className="text-gray-400 text-[10px]">$</span>
                                        <input
                                          type="number"
                                          min={0}
                                          max={costoTotalLinea}
                                          value={b.abono ?? 0}
                                          onChange={(e) => updateAbonoBook(b.id, Number(e.target.value) || 0)}
                                          className="w-20 px-1.5 py-0.5 text-right font-mono text-xs font-bold text-emerald-800 bg-emerald-50/60 border border-emerald-200 rounded focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                          title="Ingresa o edita el abono asignado a este libro"
                                        />
                                      </div>
                                    )}
                                  </td>
                                  <td className="px-3 py-2.5 font-mono text-right font-extrabold">
                                    {saldoAdeudado > 0 ? (
                                      <span className="text-red-700 bg-red-50/80 px-2 py-0.5 rounded border border-red-200 text-[11px]">
                                        {fmt(saldoAdeudado)}
                                      </span>
                                    ) : (
                                      <span className="text-emerald-700 bg-emerald-50/80 px-2 py-0.5 rounded border border-emerald-200 text-[11px]">
                                        $0 (Al día)
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-3 py-2.5 text-right">
                                    <button
                                      onClick={() => togglePagadoBook(b.id)}
                                      className={`text-xs font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer whitespace-nowrap ${
                                        b.pagado
                                          ? "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                                          : abonoMonto > 0
                                          ? "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100"
                                          : "bg-red-50 text-red-800 border-red-200 hover:bg-red-100"
                                      }`}
                                      title="Haz clic para marcar como Pagado o Pendiente"
                                    >
                                      {b.pagado ? "✓ Pagado" : abonoMonto > 0 ? "⏳ Parcial" : "⏳ Pendiente"}
                                    </button>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* SECCIÓN 4: DATOS CONTABLES Y COMISIONES */}
              {subTabPrivada === "contable" && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <StatCard
                      label="Ventas Brutas Acumuladas"
                      value={fmt(totalVentasLibreriaMonto)}
                      icon={Coins}
                    />
                    <StatCard
                      label={`Utilidad Neta Librería ${libreriaPrivadaActiva}`}
                      value={fmt(totalUtilidadLibreriaMonto)}
                      icon={DollarSign}
                      color="text-emerald-700"
                    />
                    <StatCard
                      label="Comisión Asignada a Trama"
                      value={fmt(totalComisionTramaMonto)}
                      icon={Building}
                      color="text-indigo-900"
                    />
                    <StatCard
                      label="Cuentas por Pagar Proveedores"
                      value={fmt(porPagarLibreria)}
                      sub="Facturas / saldo pendiente"
                      icon={Banknote}
                      color="text-red-600"
                    />
                  </div>

                  <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-2xs">
                    <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-gray-900 block">
                          Historial Contable de Ventas y Liquidaciones - {libreriaPrivadaActiva}
                        </span>
                        <span className="text-[11px] text-gray-400">
                          Resumen detallado ítem por ítem con cálculo automático de utilidad neta y comisión.
                        </span>
                      </div>
                      <Btn
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          exportCSV(
                            `contabilidad_libreria_${libreriaPrivadaActiva.toLowerCase().replace(/\s+/g, "_")}.csv`,
                            ventasLibreriaDetalle.map(vd => ({
                              ID_Venta: vd.ventaId,
                              Fecha: vd.fecha,
                              Vendedor: vd.vendedor,
                              Libro: vd.titulo,
                              Cantidad: vd.qty,
                              Precio_Unitario: vd.precioUnit,
                              Subtotal: vd.subtotal,
                              Costo: vd.costoItem,
                              Pct_Libreria: `${vd.pctLibreria}%`,
                              Utilidad_Libreria: vd.utilidadLibreria,
                              Comision_Trama: vd.comisionTrama
                            }))
                          )
                        }
                      >
                        Exportar CSV Contable
                      </Btn>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-xs min-w-[750px]">
                        <thead>
                          <tr className="border-b border-gray-100 bg-gray-50 text-gray-400 font-medium text-left">
                            <th className="px-4 py-2">Fecha / Hora</th>
                            <th className="px-4 py-2">Vendedor</th>
                            <th className="px-4 py-2">Libro Vendido</th>
                            <th className="px-4 py-2">Cant.</th>
                            <th className="px-4 py-2">Monto Venta</th>
                            <th className="px-4 py-2 text-red-600">Costo Adq.</th>
                            <th className="px-4 py-2 text-purple-900">Utilidad Librería</th>
                            <th className="px-4 py-2 text-indigo-900">Comisión Trama</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {ventasLibreriaDetalle.length === 0 ? (
                            <tr>
                              <td colSpan={8} className="text-center py-8 text-gray-400">
                                Aún no hay ventas registradas de títulos asociados a esta librería.
                              </td>
                            </tr>
                          ) : (
                            ventasLibreriaDetalle.map((vd, idx) => (
                              <tr key={`${vd.ventaId}-${idx}`} className="hover:bg-gray-50">
                                <td className="px-4 py-2.5 font-medium text-gray-700">
                                  {vd.fecha} <span className="text-gray-400 font-mono text-[11px]">{vd.hora}</span>
                                </td>
                                <td className="px-4 py-2.5 text-gray-600">{vd.vendedor}</td>
                                <td className="px-4 py-2.5 font-bold text-gray-900">{vd.titulo}</td>
                                <td className="px-4 py-2.5 font-semibold text-gray-700">{vd.qty} un.</td>
                                <td className="px-4 py-2.5 font-mono font-bold text-gray-900">{fmt(vd.subtotal)}</td>
                                <td className="px-4 py-2.5 font-mono text-red-700">{fmt(vd.costoItem)}</td>
                                <td className="px-4 py-2.5 font-mono font-extrabold text-purple-900">
                                  {fmt(vd.utilidadLibreria)} <span className="text-[10px] text-purple-600 font-normal">({vd.pctLibreria}%)</span>
                                </td>
                                <td className="px-4 py-2.5 font-mono font-bold text-indigo-900">
                                  {fmt(vd.comisionTrama)} <span className="text-[10px] text-indigo-600 font-normal">({vd.pctTrama}%)</span>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* PRIMER BANNER LILA CLARO COMPACTO: BALANCE MENSUAL & COMPARATIVA BARRAS VERTICALES (SOLO VISIÓN GENERAL) */}
              <div className="bg-gradient-to-r from-purple-100 via-indigo-50 to-purple-100 border border-purple-200/80 text-purple-950 p-2.5 sm:p-3 rounded-xl shadow-2xs space-y-2">
                {/* TOP ROW: FECHA ACTUAL & BALANCE MENSUAL */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-2 border-b border-purple-200/60">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-purple-900 bg-purple-200/80 px-2 py-0.5 rounded-md border border-purple-300/60 shadow-2xs">
                      <Calendar size={11} className="text-purple-700" />
                      Hoy: {textoFechaHoy}
                    </span>
                  </div>

                  {/* BALANCE MENSUAL */}
                  <div className="bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-lg border border-purple-200 shadow-2xs flex items-center justify-between sm:justify-end gap-2 shrink-0">
                    <span className="text-[9px] text-purple-700 font-bold uppercase block leading-none">Balance Mensual Trama:</span>
                    <span className="text-sm font-black text-purple-900 font-mono">{fmt(totalUtilidadTramaPeriodo)}</span>
                  </div>
                </div>

                {/* HEADER DE GRÁFICA & BARRAS VERTICALES COMPACTAS */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] font-bold text-purple-800 uppercase tracking-wider">
                    <span className="flex items-center gap-1">
                      <BarChart3 size={12} className="text-purple-700" /> Comparativa Comisión Trama por Librería
                    </span>
                    <span className="font-mono text-purple-600 text-[9px]">Total Red: {fmt(totalUtilidadTramaPeriodo)}</span>
                  </div>

                  {/* REJILLA DE BARRAS VERTICALES */}
                  <div className="grid grid-cols-4 gap-1.5 bg-white/75 backdrop-blur-xs p-2 rounded-lg border border-purple-200/80">
                    {statsLibreriasPeriodo.map(l => {
                      const pct = totalUtilidadTramaPeriodo > 0 ? (l.utilidadTrama / totalUtilidadTramaPeriodo) * 100 : 0;
                      const barColors: Record<string, string> = {
                        "Antro": "bg-purple-600",
                        "Kurripang": "bg-emerald-500",
                        "Mar de Dudas": "bg-amber-500",
                        "Trama": "bg-indigo-600",
                      };
                      const libObj = findLibreriaStrict(librerias, l.nombre);

                      return (
                        <div key={l.nombre} className="flex flex-col items-center justify-end space-y-1 text-center">
                          {/* MONTO Y PORCENTAJE ARRIBA */}
                          <div className="space-y-0 text-[10px] leading-tight">
                            <span className="font-mono font-bold text-purple-950 block">+{fmt(l.utilidadTrama)}</span>
                            <span className="text-[9px] font-mono text-purple-600 block">{pct.toFixed(0)}%</span>
                          </div>

                          {/* CONTENEDOR DE BARRA VERTICAL */}
                          <div className="w-full max-w-[40px] sm:max-w-[56px] h-12 sm:h-14 bg-purple-100/90 rounded-t-md border border-purple-200/80 relative flex items-end p-0.5 overflow-hidden">
                            <div
                              style={{ height: `${Math.max(pct, totalUtilidadTramaPeriodo > 0 ? 6 : 0)}%` }}
                              className={`w-full rounded-t-xs transition-all duration-300 ${barColors[l.nombre] || "bg-purple-600"}`}
                              title={`${l.nombre}: ${fmt(l.utilidadTrama)} (${pct.toFixed(1)}%)`}
                            />
                          </div>

                          {/* NOMBRE Y LOGO ABAJO */}
                          <div className="flex items-center gap-1 justify-center pt-0.5 max-w-full">
                            {libObj?.logo ? (
                              <img src={libObj.logo} alt={l.nombre} className="max-h-3.5 max-w-[24px] object-contain shrink-0" />
                            ) : (
                              <span className={`w-1.5 h-1.5 rounded-full ${barColors[l.nombre] || "bg-purple-600"} shrink-0`} />
                            )}
                            <span className="text-[10px] font-bold text-purple-950 truncate leading-none">{l.nombre}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {statsLibrerias.map(st => {
                  const badgeColors: Record<string, string> = {
                    Antro: "bg-purple-100 text-purple-800 border-purple-200",
                    Kurripang: "bg-blue-100 text-blue-800 border-blue-200",
                    "Mar de Dudas": "bg-emerald-100 text-emerald-800 border-emerald-200",
                    Trama: "bg-amber-100 text-amber-800 border-amber-200",
                  };

                  const esLibreriaReal = st.nombre !== "Trama";

                  return (
                    <div key={st.nombre} className="bg-white p-4 rounded-xl border border-gray-100 shadow-2xs space-y-3 flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {(() => {
                              const libLogo = findLibreriaStrict(librerias, st.nombre)?.logo;
                              return libLogo ? (
                                <img
                                  src={libLogo}
                                  alt="Logo"
                                  className="w-6 h-6 rounded-md object-cover bg-gray-100 border border-gray-200 shrink-0"
                                />
                              ) : null;
                            })()}
                            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${badgeColors[st.nombre] || "bg-gray-100 text-gray-800"}`}>
                              🏢 Librería {st.nombre}
                            </span>
                          </div>
                          <span className="text-xs text-gray-400 font-medium">{st.titulosCount} títulos</span>
                        </div>

                        <div className="space-y-1.5 pt-1">
                          <div className="flex justify-between text-xs text-gray-600">
                            <span>Stock Total:</span>
                            <span className="font-semibold text-gray-900">{st.stockTotal} un.</span>
                          </div>
                          <div className="flex justify-between text-xs text-gray-600">
                            <span>Valor Inventario Venta:</span>
                            <span className="font-semibold text-gray-900">{fmt(st.valorStockVenta)}</span>
                          </div>
                          <div className="flex justify-between text-xs text-gray-600">
                            <span>Ventas Registradas:</span>
                            <span className="font-bold text-gray-900">{fmt(st.ventasMonto)}</span>
                          </div>
                        </div>

                        <div className="border-t border-gray-100 pt-2.5 space-y-1 text-xs">
                          <div className="flex justify-between text-purple-900 bg-purple-50 p-1.5 rounded-lg border border-purple-100 font-semibold">
                            <span>Utilidad {st.nombre}:</span>
                            <span>{fmt(st.utilidadLib)}</span>
                          </div>
                          <div className="flex justify-between text-indigo-900 bg-indigo-50 p-1.5 rounded-lg border border-indigo-100 font-semibold">
                            <span>Comisión Trama:</span>
                            <span>{fmt(st.utilidadTrama)}</span>
                          </div>
                        </div>
                      </div>

                      {/* BOTÓN DE ACCESO PRIVADO A LA PÁGINA DE LA LIBRERÍA / TRAMA */}
                      <div className="pt-2 border-t border-gray-100 space-y-1.5">
                        <button
                          onClick={() => abrirModalAccesoPrivado(st.nombre)}
                          className={`w-full py-2 px-3 ${
                            st.nombre === "Trama"
                              ? "bg-amber-500 hover:bg-amber-600 text-purple-950 font-black shadow-xs"
                              : "bg-purple-900 hover:bg-purple-950 text-white font-bold"
                          } rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer`}
                        >
                          <Key size={13} className={st.nombre === "Trama" ? "text-purple-950" : "text-amber-400"} />
                          Acceso Privado a {st.nombre}
                        </button>
                        <div className="flex justify-between items-center text-[10px] text-gray-400 px-1">
                          <span>{st.nombre === "Trama" ? "Consolidado central, proveedores y comisiones" : "Acceso a Proveedores, Inventario y Contabilidad"}</span>
                          <button
                            onClick={() => abrirModalAccesoPrivado(st.nombre)}
                            className="text-purple-700 font-semibold hover:underline cursor-pointer flex items-center gap-1"
                          >
                            <Key size={10} /> Ingresar con clave
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* FIN SUBITEMS LIBRERÍA */}
            </div>
          )}
        </div>
      )}

      {/* TAB CIERRE DE CAJA / ARQUEO */}
      {tab === "cierre" && (
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-2xs space-y-4 max-w-xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Arqueo y Cierre de Caja del Día ({hoyStr})</h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Calcula el saldo esperado en caja considerando ventas, otros ingresos y egresos de gastos en efectivo.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Btn size="sm" variant="outline" onClick={() => { setTab("otrosIngresos"); setModalOtroIngresoOpen(true); }}>
                <Plus size={13} /> Ingreso
              </Btn>
              <Btn size="sm" onClick={() => { setTab("gastos"); setModalGastoOpen(true); }}>
                <Plus size={13} /> Gasto
              </Btn>
            </div>
          </div>

          <div className="p-3.5 bg-gray-50 rounded-xl space-y-2 border border-gray-100 text-xs">
            <div className="flex justify-between text-gray-700">
              <span>(+) Ventas en Efectivo hoy:</span>
              <span className="font-bold text-emerald-700">{fmt(totalHoyEfectivoVentas)}</span>
            </div>
            <div className="flex justify-between text-gray-700">
              <span>(+) Otros Ingresos en Efectivo hoy:</span>
              <span className={`font-bold ${otrosIngresosEfectivoHoy > 0 ? "text-emerald-700" : "text-gray-400"}`}>
                {otrosIngresosEfectivoHoy > 0 ? `+${fmt(otrosIngresosEfectivoHoy)}` : "$0"}
              </span>
            </div>
            <div className="flex justify-between text-gray-700">
              <span>(-) Egresos / Gastos en Efectivo hoy:</span>
              <span className={`font-bold ${gastosEfectivoHoy > 0 ? "text-red-600" : "text-gray-400"}`}>
                {gastosEfectivoHoy > 0 ? `-${fmt(gastosEfectivoHoy)}` : "$0"}
              </span>
            </div>
            <div className="border-t border-gray-200 pt-2 flex justify-between font-extrabold text-xs text-purple-950">
              <span>(=) Total Efectivo Esperado en Caja:</span>
              <span className="font-mono text-sm">{fmt(totalHoyEfectivoEsperado)}</span>
            </div>

            <div className="border-t border-gray-200/80 pt-2 space-y-1">
              <div className="flex justify-between text-gray-500 text-[11px]">
                <span>Ventas con Tarjeta hoy:</span>
                <span className="font-medium">{fmt(porMetodoHoy["Tarjeta"] || 0)}</span>
              </div>
              <div className="flex justify-between text-gray-500 text-[11px]">
                <span>Ventas con Transferencia hoy:</span>
                <span className="font-medium">{fmt(porMetodoHoy["Transferencia"] || 0)}</span>
              </div>
              <div className="flex justify-between text-gray-500 text-[11px]">
                <span>Otros Ingresos vía Tarjeta/Transf. hoy:</span>
                <span className="font-medium">{fmt(otrosIngresosOtrosHoy)}</span>
              </div>
              <div className="flex justify-between text-gray-500 text-[11px]">
                <span>Gastos vía Tarjeta/Transf. hoy:</span>
                <span className="font-medium">{fmt(gastosOtrosHoy)}</span>
              </div>
              <div className="flex justify-between font-bold text-xs text-gray-900 pt-1 border-t border-gray-200/60">
                <span>Total Ingresos Brutos del Día (Ventas + Otros):</span>
                <span>{fmt(totalHoyVentasGeneral + totalOtrosIngresosHoy)}</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Input
              label="Ingresa el efectivo físico contado en caja ($)"
              type="number"
              placeholder={`Ej: ${totalHoyEfectivoEsperado}`}
              value={montoContado}
              onChange={(e: any) => setMontoContado(e.target.value)}
            />

            {diferenciaCaja !== null && (
              <div
                className={`p-3 rounded-xl border text-xs font-semibold ${
                  diferenciaCaja === 0
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                    : diferenciaCaja > 0
                    ? "bg-blue-50 text-blue-800 border-blue-200"
                    : "bg-red-50 text-red-800 border-red-200"
                }`}
              >
                {diferenciaCaja === 0 && "✓ La caja cuadra perfectamente con el efectivo esperado."}
                {diferenciaCaja > 0 && `Sobran ${fmt(diferenciaCaja)} respecto al monto esperado en caja.`}
                {diferenciaCaja < 0 && `Faltan ${fmt(Math.abs(diferenciaCaja))} en la caja respecto al saldo esperado.`}
              </div>
            )}
          </div>

          {/* DESGLOSE RÁPIDO DE OTROS INGRESOS Y GASTOS HOY */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-gray-100 pt-3">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-900">Otros Ingresos Hoy</span>
                <span className="text-xs text-emerald-700 font-semibold">{fmt(totalOtrosIngresosHoy)}</span>
              </div>
              {otrosIngresosHoy.length === 0 ? (
                <p className="text-xs text-gray-400 italic bg-gray-50 p-2.5 rounded-lg text-center">
                  Sin otros ingresos hoy.
                </p>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {otrosIngresosHoy.map(oi => (
                    <div key={oi.id} className="p-2 rounded-lg bg-emerald-50/60 border border-emerald-100 flex items-center justify-between text-xs">
                      <div className="min-w-0 pr-2">
                        <div className="font-bold text-gray-900 truncate">{oi.descripcion}</div>
                        <p className="text-[10px] text-gray-500">{oi.categoria} · {oi.metodoPago}</p>
                      </div>
                      <span className="font-extrabold text-emerald-700 shrink-0">+{fmt(oi.monto)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-900">Gastos Hoy</span>
                <span className="text-xs text-red-600 font-semibold">{fmt(totalGastosHoy)}</span>
              </div>
              {gastosHoy.length === 0 ? (
                <p className="text-xs text-gray-400 italic bg-gray-50 p-2.5 rounded-lg text-center">
                  Sin gastos hoy.
                </p>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {gastosHoy.map(g => (
                    <div key={g.id} className="p-2 rounded-lg bg-red-50/60 border border-red-100 flex items-center justify-between text-xs">
                      <div className="min-w-0 pr-2">
                        <div className="font-bold text-gray-900 truncate">{g.descripcion}</div>
                        <p className="text-[10px] text-gray-500">{g.categoria} · {g.metodoPago}</p>
                      </div>
                      <span className="font-extrabold text-red-600 shrink-0">-{fmt(g.monto)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB MOVIMIENTOS */}
      {tab === "movimientos" && (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-2xs">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <span className="text-xs font-bold text-gray-900">Historial de Movimientos de Inventario</span>
            <Btn
              onClick={() =>
                exportCSV(
                  "movimientos-inventario.csv",
                  movimientos.map(m => ({
                    ID: m.id,
                    Fecha: m.fecha,
                    Usuario: m.usuario,
                    Libro: m.titulo,
                    Tipo: m.tipo,
                    Cantidad: m.cantidad,
                    Motivo: m.motivo,
                  }))
                )
              }
              size="sm"
              variant="outline"
            >
              <RefreshCw size={12} /> Exportar CSV
            </Btn>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs min-w-[500px]">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-gray-400 font-medium text-left">
                  <th className="px-4 py-2">Fecha</th>
                  <th className="px-4 py-2">Usuario</th>
                  <th className="px-4 py-2">Libro</th>
                  <th className="px-4 py-2">Tipo</th>
                  <th className="px-4 py-2">Cantidad</th>
                  <th className="px-4 py-2">Motivo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {movimientos.map(m => (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-gray-500">{m.fecha}</td>
                    <td className="px-4 py-2 text-gray-700 font-medium">{m.usuario}</td>
                    <td className="px-4 py-2 font-semibold text-gray-900">{m.titulo}</td>
                    <td className="px-4 py-2">
                      <Badge variant={m.tipo === "venta" ? "red" : m.tipo === "compra" ? "green" : "blue"}>{m.tipo}</Badge>
                    </td>
                    <td className={`px-4 py-2 font-bold ${m.cantidad > 0 ? "text-green-700" : "text-red-600"}`}>
                      {m.cantidad > 0 ? `+${m.cantidad}` : m.cantidad}
                    </td>
                    <td className="px-4 py-2 text-gray-500">{m.motivo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL REGISTRAR NUEVO GASTO */}
      {modalGastoOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 max-w-md w-full border border-gray-100 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2 text-purple-900 font-bold text-sm">
                <Receipt size={18} />
                <span>Registrar Nuevo Gasto Diario</span>
              </div>
              <button onClick={() => setModalGastoOpen(false)} className="text-gray-400 hover:text-gray-600 p-1">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddGasto} className="space-y-3">
              <Input
                label="Monto del Gasto ($) *"
                type="number"
                placeholder="Ej: 15000"
                value={formGasto.monto}
                onChange={(e: any) => setFormGasto(prev => ({ ...prev, monto: e.target.value }))}
                required
              />

              <Select
                label="Categoría de Gasto *"
                value={formGasto.categoria}
                onChange={(e: any) => setFormGasto(prev => ({ ...prev, categoria: e.target.value }))}
              >
                <option value="Costo Fijo">Costo Fijo (Arriendo, Luz, Internet, etc.)</option>
                <option value="Costo Variable">Costo Variable (Insumos, Imprevistos)</option>
                <option value="Honorarios">Honorarios (Asesoría, Apoyo, Servicios)</option>
                <option value="Arriendo / Servicios">Arriendo / Servicios</option>
                <option value="Suministros">Suministros (Bolsas, Papelería)</option>
                <option value="Otro">Otro</option>
              </Select>

              <Input
                label="Descripción o Motivo *"
                placeholder="Ej: Pago bolsas de regalo o colación"
                value={formGasto.descripcion}
                onChange={(e: any) => setFormGasto(prev => ({ ...prev, descripcion: e.target.value }))}
                required
              />

              <Select
                label="Método de Pago *"
                value={formGasto.metodoPago}
                onChange={(e: any) => setFormGasto(prev => ({ ...prev, metodoPago: e.target.value }))}
              >
                <option value="Efectivo">Efectivo (Caja chica / Dinero de caja)</option>
                <option value="Tarjeta">Tarjeta de Débito / Crédito</option>
                <option value="Transferencia">Transferencia bancaria</option>
              </Select>

              <Input
                label="Fecha *"
                type="date"
                value={formGasto.fecha}
                onChange={(e: any) => setFormGasto(prev => ({ ...prev, fecha: e.target.value }))}
                required
              />

              <div className="pt-2 flex justify-end gap-2">
                <Btn variant="outline" type="button" onClick={() => setModalGastoOpen(false)}>
                  Cancelar
                </Btn>
                <Btn type="submit">
                  Guardar Gasto
                </Btn>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL REGISTRAR OTRO INGRESO */}
      {modalOtroIngresoOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 max-w-md w-full border border-gray-100 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                <Coins size={18} />
                <span>Registrar Otro Ingreso (Servicios, Aportes, Donaciones)</span>
              </div>
              <button onClick={() => setModalOtroIngresoOpen(false)} className="text-gray-400 hover:text-gray-600 p-1">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddOtroIngreso} className="space-y-3">
              <Input
                label="Monto del Ingreso ($) *"
                type="number"
                placeholder="Ej: 25000"
                value={formOtroIngreso.monto}
                onChange={(e: any) => setFormOtroIngreso(prev => ({ ...prev, monto: e.target.value }))}
                required
              />

              <Select
                label="Categoría de Ingreso *"
                value={formOtroIngreso.categoria}
                onChange={(e: any) => setFormOtroIngreso(prev => ({ ...prev, categoria: e.target.value }))}
              >
                <option value="Servicios">Servicios (Arriendos de espacio, Talleres, Asesorías)</option>
                <option value="Aportes">Aportes (Aportes extraordinarios de socios / Fondos)</option>
                <option value="Donaciones">Donaciones (Aportes culturales de amigos)</option>
                <option value="Otro">Otro Ingreso</option>
              </Select>

              <Input
                label="Descripción o Detalle *"
                placeholder="Ej: Arriendo de espacio para taller el sábado"
                value={formOtroIngreso.descripcion}
                onChange={(e: any) => setFormOtroIngreso(prev => ({ ...prev, descripcion: e.target.value }))}
                required
              />

              <Select
                label="Método de Ingreso *"
                value={formOtroIngreso.metodoPago}
                onChange={(e: any) => setFormOtroIngreso(prev => ({ ...prev, metodoPago: e.target.value }))}
              >
                <option value="Efectivo">Efectivo (Ingresa a caja física)</option>
                <option value="Tarjeta">Tarjeta de Débito / Crédito</option>
                <option value="Transferencia">Transferencia bancaria</option>
              </Select>

              <Input
                label="Fecha *"
                type="date"
                value={formOtroIngreso.fecha}
                onChange={(e: any) => setFormOtroIngreso(prev => ({ ...prev, fecha: e.target.value }))}
                required
              />

              <div className="pt-2 flex justify-end gap-2">
                <Btn variant="outline" type="button" onClick={() => setModalOtroIngresoOpen(false)}>
                  Cancelar
                </Btn>
                <Btn type="submit">
                  Guardar Ingreso
                </Btn>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL INGRESAR CLAVE DE ACCESO PRIVADO A LIBRERÍA */}
      {modalAccesoOpen && libreriaModal && (
        <Modal
          title={`Acceso Privado - Librería ${libreriaModal.alias}`}
          onClose={() => {
            setModalAccesoOpen(false);
            setErrorClaveModal("");
          }}
        >
          <div className="space-y-4">
            <div className="bg-purple-50 p-3 rounded-xl border border-purple-100 flex items-start gap-3 text-xs text-purple-950">
              <Lock size={18} className="text-purple-700 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-purple-900">Página Privada Protegida</p>
                <p>
                  Ingresa la clave de acceso de <strong>Librería {libreriaModal.alias}</strong> para acceder por separado a su Directorio de Proveedores, Inventario y Datos Contables.
                </p>
              </div>
            </div>

            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 text-xs space-y-1">
              <div className="flex justify-between text-gray-600">
                <span>Librería:</span>
                <span className="font-bold text-gray-900">{libreriaModal.nombre} ({libreriaModal.alias})</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Representante / Contacto:</span>
                <span className="font-semibold text-gray-800">{libreriaModal.contacto}</span>
              </div>
            </div>

            <form
              onSubmit={e => {
                e.preventDefault();
                confirmarAccesoPrivado();
              }}
              className="space-y-3"
            >
              <Input
                label="Contraseña de Acceso Privado *"
                type="password"
                placeholder="Ingresa la clave aquí..."
                value={claveInputModal}
                onChange={(e: any) => setClaveInputModal(e.target.value)}
                required
                autoFocus
              />

              {errorClaveModal && (
                <div className="text-xs font-semibold text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-100">
                  {errorClaveModal}
                </div>
              )}

              <div className="flex justify-end items-center gap-2 pt-2">
                <Btn variant="outline" type="button" onClick={() => setModalAccesoOpen(false)}>
                  Cancelar
                </Btn>
                <Btn type="submit">
                  Ingresar a Página Privada
                </Btn>
              </div>
            </form>
          </div>
        </Modal>
      )}

      {/* MODAL INGRESAR / EDITAR LIBRO EN INVENTARIO PROPIO */}
      {modalBookPrivado && (
        <Modal
          title={editBookIdPrivado ? `Editar Libro en Inventario Propio (${libreriaPrivadaActiva})` : `Ingresar Nuevo Libro a Inventario Propio (${libreriaPrivadaActiva})`}
          onClose={() => setModalBookPrivado(false)}
          maxWidth="max-w-3xl"
          closeOnBackdrop={false}
          hideCloseButton={true}
        >
          <div className="space-y-4 pb-1">
            <form onSubmit={e => { e.preventDefault(); guardarBookPrivado(); }} className="space-y-4">
              {/* BLOQUE 1: DATOS PRINCIPALES DEL LIBRO & PORTADAS */}
              <div className="bg-gray-50/80 p-3.5 rounded-xl border border-gray-200/80 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-800 border-b border-gray-200 pb-2">
                  <BookOpen size={15} className="text-purple-700" />
                  <span>1. Información Bibliográfica del Libro</span>
                </div>

                {/* PORTADA Y SINOPSIS DEL LIBRO AL COSTADO */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-stretch">
                  <div className="sm:col-span-1">
                    <PortadaPicker
                      value={formBookPrivado.portada}
                      onChange={v => updateFormBookPrivado("portada", v)}
                      placeholderLabel="Portada"
                    />
                  </div>
                  <div className="sm:col-span-2 flex flex-col h-full">
                    <label className="block text-xs font-bold text-gray-800 mb-1.5">
                      Reseña
                    </label>
                    <textarea
                      value={formBookPrivado.observaciones}
                      onChange={(e) => updateFormBookPrivado("observaciones", e.target.value)}
                      placeholder="Escribe la reseña o presentación del libro..."
                      className="w-full flex-1 min-h-[140px] p-2.5 text-xs bg-white border border-gray-300 rounded-xl outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 transition-all text-gray-800 resize-none shadow-2xs"
                    />
                  </div>
                </div>

                <Input
                  label="Título del Libro *"
                  value={formBookPrivado.titulo}
                  onChange={e => updateFormBookPrivado("titulo", e.target.value)}
                  placeholder="Ej: Rayuela"
                  required
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Autor *"
                    value={formBookPrivado.autor}
                    onChange={e => updateFormBookPrivado("autor", e.target.value)}
                    placeholder="Ej: Julio Cortázar"
                    required
                  />
                  <Input
                    label="Editorial"
                    value={formBookPrivado.editorial}
                    onChange={e => updateFormBookPrivado("editorial", e.target.value)}
                    placeholder="Ej: Editorial Sudamericana"
                  />
                </div>

                {/* Fila entre Autor y Editorial: Páginas, Tipo de Portada y Código Interno */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Input
                    label="Páginas"
                    type="number"
                    value={formBookPrivado.paginas}
                    onChange={e => updateFormBookPrivado("paginas", e.target.value)}
                    placeholder="300"
                  />
                  <Select
                    label="Tipo de Portada"
                    value={formBookPrivado.tipoPortada}
                    onChange={e => updateFormBookPrivado("tipoPortada", e.target.value)}
                  >
                    <option value="Tapa blanda">Tapa blanda</option>
                    <option value="Tapa dura">Tapa dura</option>
                    <option value="Bolsillo">Bolsillo</option>
                    <option value="Ebook / Digital">Ebook / Digital</option>
                  </Select>
                  <div>
                    <Input
                      label="Código Interno"
                      value={formBookPrivado.codigoInterno !== undefined && formBookPrivado.codigoInterno !== "" ? formBookPrivado.codigoInterno : generarCodigoInterno(libreriaPrivadaActiva, formBookPrivado.proveedor, formBookPrivado.precio, formBookPrivado.ubicacion)}
                      onChange={e => updateFormBookPrivado("codigoInterno", e.target.value)}
                      placeholder="Ej: A-001-$12.990-A-1"
                    />
                    <p className="text-[10px] text-gray-500 mt-0.5 font-mono">
                      Librería ({libreriaPrivadaActiva ? (libreriaPrivadaActiva.toLowerCase().includes("antro") ? "A" : libreriaPrivadaActiva.toLowerCase().includes("kurri") ? "K" : libreriaPrivadaActiva.toLowerCase().includes("mar") ? "M" : libreriaPrivadaActiva.charAt(0)) : "A"}), Prov ({String(formBookPrivado.proveedor || "XXX").padStart(3, "0")}), Precio ({Number(formBookPrivado.precio) > 0 ? `$${Number(formBookPrivado.precio).toLocaleString("es-CL")}` : "$XXX.XXX"}), Ubic ({formBookPrivado.ubicacion || "XX-XX-"})
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Input
                    label="ISBN / Código de Barra"
                    value={formBookPrivado.isbn}
                    onChange={e => updateFormBookPrivado("isbn", e.target.value)}
                    placeholder="Ej: 978-956-..."
                  />
                  <Select
                    label="Estado *"
                    value={formBookPrivado.estadoLibro}
                    onChange={e => updateFormBookPrivado("estadoLibro", e.target.value)}
                  >
                    <option value="Nuevo">Nuevo</option>
                    <option value="Segunda Mano">Segunda Mano</option>
                  </Select>
                  <Input
                    label="Ubicación en tienda"
                    value={formBookPrivado.ubicacion}
                    onChange={e => updateFormBookPrivado("ubicacion", e.target.value)}
                    placeholder="Ej: Estante A-1"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Año de Edición"
                    type="number"
                    value={formBookPrivado.anioLanzamiento}
                    onChange={e => updateFormBookPrivado("anioLanzamiento", e.target.value)}
                    placeholder="Ej: 1963"
                  />
                  <Input
                    label="Año Producción"
                    type="number"
                    value={formBookPrivado.anioProduccion}
                    onChange={e => updateFormBookPrivado("anioProduccion", e.target.value)}
                    placeholder="Ej: 2024"
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <Input
                    label="Alto (cm)"
                    type="number"
                    step="0.1"
                    value={formBookPrivado.alto}
                    onChange={e => updateFormBookPrivado("alto", e.target.value)}
                    placeholder="21"
                  />
                  <Input
                    label="Ancho (cm)"
                    type="number"
                    step="0.1"
                    value={formBookPrivado.ancho}
                    onChange={e => updateFormBookPrivado("ancho", e.target.value)}
                    placeholder="14"
                  />
                  <Input
                    label="Espesor (mm)"
                    type="number"
                    step="0.1"
                    value={formBookPrivado.espesor}
                    onChange={e => updateFormBookPrivado("espesor", e.target.value)}
                    placeholder="15"
                  />
                  <Input
                    label="Peso (g)"
                    type="number"
                    value={formBookPrivado.peso}
                    onChange={e => updateFormBookPrivado("peso", e.target.value)}
                    placeholder="350"
                  />
                </div>

                <CategoriaMultiSelect
                  value={formBookPrivado.categoria}
                  onChange={v => updateFormBookPrivado("categoria", v)}
                />
              </div>

              {/* BLOQUE 2: ORIGEN DEL EJEMPLAR Y PROVEEDOR */}
              <div className="bg-gray-50/80 p-3.5 rounded-xl border border-gray-200/80 space-y-3">
                <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-800">
                    <Building2 size={15} className="text-purple-700" />
                    <span>2. Origen del Ejemplar & Proveedor</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Select
                    label="Tipo de Adquisición *"
                    value={formBookPrivado.tipoAdquisicion}
                    onChange={e => updateFormBookPrivado("tipoAdquisicion", e.target.value)}
                  >
                    <option value="Compra">Compra</option>
                    <option value="Concesión">Concesión</option>
                    <option value="Donación">Donación</option>
                    <option value="Otro">Otro</option>
                  </Select>

                  {/* EDITORIAL / PROVEEDOR EDITABLE O INCORPORABLE */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between flex-wrap gap-1">
                      <label className="text-xs font-semibold text-gray-700">
                        Editorial / Proveedor *
                      </label>
                      <div className="flex items-center gap-2">
                        {(() => {
                          const provSel = proveedores.find(p => p.id === Number(formBookPrivado.proveedor));
                          return (
                            <>
                              {provSel && (
                                <button
                                  type="button"
                                  onClick={() => abrirEditarProveedor(provSel)}
                                  className="text-[11px] font-semibold text-purple-700 hover:text-purple-900 hover:underline flex items-center gap-1 cursor-pointer"
                                  title="Editar datos del proveedor seleccionado"
                                >
                                  <Edit2 size={12} /> Editar
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={abrirNuevoProveedor}
                                className="text-[11px] font-bold text-purple-900 bg-purple-100 hover:bg-purple-200 px-2 py-0.5 rounded-lg flex items-center gap-1 transition-colors cursor-pointer border border-purple-200"
                                title="Incorporar un nuevo proveedor al directorio"
                              >
                                <Plus size={12} /> + Agregar
                              </button>
                            </>
                          );
                        })()}
                      </div>
                    </div>

                    <Select
                      value={formBookPrivado.proveedor}
                      onChange={e => updateFormBookPrivado("proveedor", Number(e.target.value))}
                    >
                      {proveedores.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.nombre} ({p.categoria}) — {p.ciudad}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>
              </div>

              {/* BLOQUE 3: CONTROL DE INVENTARIO & STOCK */}
              {(() => {
                const stockLocalNum = Number(formBookPrivado.stock) || 0;
                const stockTramaNum = Number(formBookPrivado.stockTrama) || 0;
                // Stock Total es la suma de Stock Actual y Stock Trama
                const stockTotal = stockLocalNum + stockTramaNum;

                return (
                  <div className="p-4 bg-gradient-to-br from-slate-50 via-purple-50/20 to-slate-50 rounded-2xl border border-slate-200/90 space-y-3 shadow-2xs">
                    <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-purple-800 text-white text-[11px] font-bold flex items-center justify-center shrink-0 shadow-2xs">3</span>
                        <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                          <Package size={14} className="text-purple-700" /> Control de Inventario & Stock
                        </h4>
                      </div>
                      <span className="text-[10px] font-extrabold bg-purple-100 text-purple-900 px-2.5 py-0.5 rounded-full border border-purple-200">
                        Unidades en Inventario
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      <Input
                        label={`Stock Actual (${libreriaPrivadaActiva || "Librería"}) *`}
                        type="number"
                        value={formBookPrivado.stock}
                        onChange={e => updateFormBookPrivado("stock", e.target.value)}
                        placeholder="5"
                        required
                      />

                      <Input
                        label="Stock TRAMA *"
                        type="number"
                        value={formBookPrivado.stockTrama}
                        onChange={e => updateFormBookPrivado("stockTrama", e.target.value)}
                        placeholder="5"
                        required
                      />

                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">
                          Stock Total
                        </label>
                        <div className="flex items-center justify-between p-2 rounded-xl border border-purple-200 bg-purple-50/90 text-purple-950 font-mono font-black text-sm h-[38px] shadow-2xs">
                          <span>{stockTotal} un.</span>
                          <span className="text-[10px] font-sans font-bold text-purple-700">
                            Total
                          </span>
                        </div>
                      </div>

                      <Input
                        label="Stock Mínimo (Alerta)"
                        type="number"
                        value={formBookPrivado.stockMin}
                        onChange={e => updateFormBookPrivado("stockMin", e.target.value)}
                        placeholder="3"
                      />
                    </div>
                  </div>
                );
              })()}

              {/* BLOQUE 4: VALORIZACIÓN, PRECIOS Y MARGEN NETO */}
              {(() => {
                const pV = Number(formBookPrivado.precio) || 0;
                const pC = Number(formBookPrivado.precioCosto) || 0;
                const pctT = Number(formBookPrivado.porcentajeTrama) || 0;
                const cifraT = Math.round(pV * (pctT / 100)); // % Trama siempre por Precio de Venta Final
                const baseMargen = Math.max(0, pV - pC - cifraT); // Margen Neto = Venta - Costo - Utilidad Trama

                return (
                  <div className="bg-purple-50/90 p-4 rounded-xl border border-purple-200 space-y-3.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-purple-950 border-b border-purple-200/80 pb-2">
                      <Coins size={15} className="text-purple-800" />
                      <span>4. Configuración de Precios, Utilidad Trama y Margen Neto</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <Input
                        label="Precio Venta ($) *"
                        type="number"
                        value={formBookPrivado.precio}
                        onChange={e => updateFormBookPrivado("precio", e.target.value)}
                        placeholder="Ej: 15000"
                        required
                      />

                      <Input
                        label="Precio Costo ($)"
                        type="number"
                        value={formBookPrivado.precioCosto}
                        onChange={e => updateFormBookPrivado("precioCosto", e.target.value)}
                        placeholder="0"
                      />

                      <Input
                        label="% Utilidad Trama *"
                        type="number"
                        value={formBookPrivado.porcentajeTrama}
                        onChange={e => updateFormBookPrivado("porcentajeTrama", e.target.value)}
                        placeholder="10"
                      />
                    </div>

                    {/* BANDEROLA MARGEN NETO DESTACADO */}
                    <div className="bg-gradient-to-r from-purple-800 via-indigo-800 to-purple-900 text-white p-3.5 rounded-xl shadow-sm flex items-center justify-between flex-wrap gap-2.5">
                      <div>
                        <span className="text-[10px] uppercase font-extrabold tracking-wider text-purple-200 block">
                          MARGEN NETO CALCULADO
                        </span>
                        <span className="text-2xl font-black text-white tracking-tight">{fmt(baseMargen)}</span>
                        <span className="text-[10px] text-purple-200 block font-medium">
                          (Precio Venta - Precio Costo - Comisión Trama)
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium text-purple-100">
                        <span className="bg-white/10 px-2.5 py-1 rounded-md">Venta: {fmt(pV)}</span>
                        <span className="bg-white/10 px-2.5 py-1 rounded-md">Costo: {fmt(pC)}</span>
                        <span className="bg-white/10 px-2.5 py-1 rounded-md">Trama ({pctT}%): {fmt(cifraT)}</span>
                      </div>
                    </div>

                    {/* RESUMEN DE VALORES DE STOCK ORDENADO POR VALORES Y MÁRGENES */}
                    {(() => {
                      const stockL = Number(formBookPrivado.stock) || 0;
                      const stockT = Number(formBookPrivado.stockTrama) || 0;
                      const totalStk = stockL + stockT;
                      const valVentaTotal = totalStk * pV;
                      const valCostoTotal = totalStk * pC;
                      const valTramaVenta = stockT * pV;
                      const valTramaCosto = stockT * pC;

                      const numBaseMargenUnit = Math.max(0, pV - pC - cifraT);
                      const margenNetoEstTotal = totalStk * numBaseMargenUnit;
                      const margenNetoEstTrama = stockT * numBaseMargenUnit;
                      const utilidadTotalTramaEst = stockT * cifraT;
                      const pctMargenNeto = valVentaTotal > 0 ? ((margenNetoEstTotal / valVentaTotal) * 100).toFixed(1) : "0";

                      return (
                        <div className="bg-white p-3.5 rounded-xl border border-purple-200/80 shadow-2xs space-y-3 text-xs">
                          {/* BLOQUE 1: LÍNEA DE VALORES (VALORIZACIÓN DE STOCK) */}
                          <div className="space-y-1.5">
                            <span className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wider block">
                              📈 Línea de Valores (Valorización de Inventario)
                            </span>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                              <div className="bg-purple-50/70 p-2.5 rounded-xl border border-purple-100">
                                <span className="text-[10px] text-gray-500 font-medium block">Valor Stock Total (Venta):</span>
                                <span className="text-sm font-black text-purple-950">{fmt(valVentaTotal)}</span>
                                <span className="text-[9px] text-gray-400 block">({totalStk} un. en total)</span>
                              </div>
                              <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-200">
                                <span className="text-[10px] text-gray-500 font-medium block">Valor Stock Total (Costo):</span>
                                <span className="text-sm font-bold text-gray-800">{fmt(valCostoTotal)}</span>
                                <span className="text-[9px] text-gray-400 block">({totalStk} un. a costo)</span>
                              </div>
                              <div className="bg-purple-100/60 p-2.5 rounded-xl border border-purple-200">
                                <span className="text-[10px] text-purple-900 font-bold block">Valor Stock TRAMA (Venta):</span>
                                <span className="text-sm font-black text-purple-900">{fmt(valTramaVenta)}</span>
                                <span className="text-[9px] text-purple-700 block">({stockT} un. en catálogo)</span>
                              </div>
                              <div className="bg-purple-50 p-2.5 rounded-xl border border-purple-200">
                                <span className="text-[10px] text-purple-800 font-bold block">Valor Stock TRAMA (Costo):</span>
                                <span className="text-sm font-bold text-purple-900">{fmt(valTramaCosto)}</span>
                                <span className="text-[9px] text-purple-600 block">({stockT} un. a costo)</span>
                              </div>
                            </div>
                          </div>

                          {/* BLOQUE 2: LÍNEA DE MÁRGENES (NETO Y TRAMA) */}
                          <div className="space-y-1.5 pt-1">
                            <span className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider block">
                              💎 Línea de Márgenes Estimados (Neto & Trama)
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                              <div className="bg-emerald-50/90 p-2.5 rounded-xl border border-emerald-200">
                                <span className="text-[10px] text-emerald-900 font-bold block">Margen Neto Est. (Stock Total):</span>
                                <span className="text-sm font-black text-emerald-700">{fmt(margenNetoEstTotal)}</span>
                                <span className="text-[9px] text-emerald-600 block">({pctMargenNeto}% sobre venta total)</span>
                              </div>

                              <div className="bg-amber-50/90 p-2.5 rounded-xl border border-amber-200">
                                <span className="text-[10px] text-amber-900 font-bold block">Margen Neto Est. (Stock TRAMA):</span>
                                <span className="text-sm font-black text-amber-800">{fmt(margenNetoEstTrama)}</span>
                                <span className="text-[9px] text-amber-700 block">({stockT} un. netas Trama)</span>
                              </div>

                              <div className="bg-indigo-50/90 p-2.5 rounded-xl border border-indigo-200">
                                <span className="text-[10px] text-indigo-900 font-bold block">Utilidad Est. Trama ({pctT}%):</span>
                                <span className="text-sm font-black text-indigo-800">{fmt(utilidadTotalTramaEst)}</span>
                                <span className="text-[9px] text-indigo-700 block">({stockT} un. x {fmt(cifraT)})</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                );
              })()}

              {errorBookPrivado && (
                <div className="text-xs font-semibold text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-100">
                  {errorBookPrivado}
                </div>
              )}

              <div className="pt-3 border-t border-gray-200 flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5">
                <Btn variant="outline" type="button" onClick={() => setModalBookPrivado(false)} className="w-full sm:w-auto">
                  Cancelar
                </Btn>
                <Btn type="submit" variant="purple" className="w-full sm:w-auto font-extrabold text-white hover:text-white shadow-md shadow-purple-200/50 hover:scale-102 transition-all cursor-pointer">
                  {editBookIdPrivado ? "Guardar Cambios en Inventario Propio" : "Guardar en Inventario Propio"}
                </Btn>
              </div>
            </form>
          </div>
        </Modal>
      )}

      {/* MODAL INGRESAR / EDITAR PROVEEDOR O EDITORIAL */}
      {modalProveedorOpen && (
        <div className="relative z-[60]">
          <Modal
            title={editProveedorId ? "Editar Proveedor / Editorial" : "Agregar Nuevo Proveedor / Editorial"}
            onClose={() => setModalProveedorOpen(false)}
          >
          <div className="space-y-4">
            <div className="bg-purple-50 p-3 rounded-xl border border-purple-100 text-xs text-purple-950 flex items-start gap-2">
              <Truck size={16} className="text-purple-700 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-purple-900">Directorio de Editoriales y Proveedores</p>
                <p className="text-[11px] text-purple-800">
                  Ingresa o modifica la información comercial, datos de contacto, RUT y observaciones clave del proveedor.
                </p>
              </div>
            </div>

            <form onSubmit={e => { e.preventDefault(); guardarProveedor(); }} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Nombre Comercial / Editorial *"
                  value={formProveedor.nombre}
                  onChange={e => setFormProveedor(prev => ({ ...prev, nombre: e.target.value }))}
                  placeholder="Ej: Editorial Cuarto Propio"
                  required
                />
                <Input
                  label="Código Interno de Proveedor(a)"
                  value={formProveedor.codigoInterno}
                  onChange={e => setFormProveedor(prev => ({ ...prev, codigoInterno: e.target.value }))}
                  placeholder="Ej: PROV-ECP-01"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Representante / Contacto"
                  value={formProveedor.contacto}
                  onChange={e => setFormProveedor(prev => ({ ...prev, contacto: e.target.value }))}
                  placeholder="Ej: María José Pérez"
                />
                <Input
                  label="RUT Comercial"
                  value={formProveedor.rut}
                  onChange={e => setFormProveedor(prev => ({ ...prev, rut: e.target.value }))}
                  placeholder="Ej: 76.543.210-K"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Correo Electrónico *"
                  type="email"
                  value={formProveedor.email}
                  onChange={e => setFormProveedor(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="contacto@editorial.cl"
                  required
                />
                <Input
                  label="Teléfono de Contacto"
                  value={formProveedor.telefono}
                  onChange={e => setFormProveedor(prev => ({ ...prev, telefono: e.target.value }))}
                  placeholder="+56 9 8765 4321"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Ciudad / Ubicación"
                  value={formProveedor.ciudad}
                  onChange={e => setFormProveedor(prev => ({ ...prev, ciudad: e.target.value }))}
                  placeholder="Ej: Santiago, Chile"
                />
                <div className="space-y-1">
                  <Input
                    label="Categoría (Editable) *"
                    value={formProveedor.categoria}
                    onChange={e => setFormProveedor(prev => ({ ...prev, categoria: e.target.value }))}
                    placeholder="Ej: Editorial Independiente, Distribuidora..."
                    list="categorias-proveedor-list"
                  />
                  <datalist id="categorias-proveedor-list">
                    <option value="Editorial Independiente" />
                    <option value="Editorial Transnacional" />
                    <option value="Distribuidora" />
                    <option value="Autor Autoeditado" />
                    <option value="Importadora" />
                    <option value="Comic & Ilustración" />
                    <option value="Infantil & Juvenil" />
                    <option value="Ensayo & Narrativa" />
                    <option value="Otro" />
                  </datalist>
                </div>
              </div>

              <Input
                label="Condiciones Comerciales / de Pago"
                value={formProveedor.condicionesPago}
                onChange={e => setFormProveedor(prev => ({ ...prev, condicionesPago: e.target.value }))}
                placeholder="Ej: Consignación 30 días, Pago contado 40% dcto."
              />

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700 block">Observaciones / Notas Internas</label>
                <textarea
                  value={formProveedor.observaciones}
                  onChange={e => setFormProveedor(prev => ({ ...prev, observaciones: e.target.value }))}
                  placeholder="Ej: Entrega pedidos los días martes. Descuento adicional por volumen..."
                  rows={2}
                  className="w-full text-xs p-2.5 rounded-lg border border-gray-200 outline-none focus:border-purple-600 transition-colors"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-gray-100">
                <Btn variant="outline" type="button" onClick={() => setModalProveedorOpen(false)}>
                  Cancelar
                </Btn>
                <Btn type="submit">
                  {editProveedorId ? "Guardar Cambios" : "Agregar Proveedor"}
                </Btn>
              </div>
            </form>
          </div>
        </Modal>
        </div>
      )}

      {/* MODAL DE CARGA MASIVA DE EXCEL */}
      <ImportExcelModal
        isOpen={modalImportExcel}
        onClose={() => setModalImportExcel(false)}
        books={books}
        setBooks={setBooks}
        proveedores={proveedores}
        registrarMovimiento={registrarMovimiento}
      />
    </div>
  );
}
