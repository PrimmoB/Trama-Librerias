import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Search,
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  Printer,
  BookOpen,
  Barcode,
  LayoutGrid,
  List,
  Zap,
  MessageSquare,
  Share2,
  Send,
  MapPin,
  FileText,
  Info,
  Camera,
  Package,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Tag,
  Calculator,
  Building2,
  Lock,
  Unlock,
  AlertTriangle
} from "lucide-react";
import { Book, Venta, Movimiento, AperturaCaja, CierreCaja, LiquidacionConsignacion, Proveedor, Gasto, OtroIngreso } from "../types";
import { fmt, catEmoji } from "../utils/helpers";
import { StockBadge, CoverBox, Modal, Btn, Badge } from "./ui";
import { Logo } from "./Logo";
import { BarcodeScannerModal } from "./BarcodeScannerModal";
import { playScanBeep } from "../utils/barcode";
import { EtiquetasModal } from "./EtiquetasModal";
import { ClienteCatalogoModal } from "./ClienteCatalogoModal";
import { CajaManager } from "./CajaManager";
import { ConsignmentSettlementModal } from "./ConsignmentSettlementModal";

interface CartItem {
  book: Book;
  qty: number;
}

interface POSProps {
  books: Book[];
  setBooks: React.Dispatch<React.SetStateAction<Book[]>>;
  ventas: Venta[];
  setVentas: React.Dispatch<React.SetStateAction<Venta[]>>;
  usuarioActual: string;
  registrarMovimiento: (mov: Omit<Movimiento, "id" | "fecha" | "usuario">) => void;
  aperturaActiva?: AperturaCaja | null;
  cierresGuardados?: CierreCaja[];
  onAbrirCaja?: (a: AperturaCaja) => void;
  onCerrarCaja?: (c: CierreCaja) => void;
  liquidacionesGuardadas?: LiquidacionConsignacion[];
  onSaveLiquidacion?: (l: LiquidacionConsignacion) => void;
  onUpdateEstadoLiquidacion?: (id: string, e: "Pendiente" | "Pagada" | "Anulada") => void;
  proveedores?: Proveedor[];
  gastos?: Gasto[];
  otrosIngresos?: OtroIngreso[];
  activeSubModal?: "caja" | "etiquetas" | "catalogo" | "liquidaciones" | null;
  setActiveSubModal?: (modal: "caja" | "etiquetas" | "catalogo" | "liquidaciones" | null) => void;
  pendingAddToCartBook?: Book | null;
  onClearPendingCartBook?: () => void;
}

type ViewMode = "grid" | "list";
type SortOption = "titulo-asc" | "precio-asc" | "precio-desc" | "stock-desc";

function BookDetailGallery({ book }: { book: Book }) {
  return (
    <div className="relative w-full h-[240px] sm:h-[280px] bg-white rounded-none border-none overflow-hidden flex items-center justify-center select-none shadow-none group" style={{ backgroundColor: "#ffffff" }}>
      {book.portada ? (
        <img
          src={book.portada}
          alt={`Portada de ${book.titulo}`}
          className="w-full h-full object-contain p-0.5"
        />
      ) : (
        <div className="p-2 text-center space-y-1 bg-white">
          <CoverBox book={book} className="w-36 h-52 mx-auto shadow-none border-none" emojiSize="text-4xl" showEffect={false} />
          <span className="text-[10px] text-gray-400 block font-medium">Portada digital estándar</span>
        </div>
      )}
    </div>
  );
}

export function POS({
  books,
  setBooks,
  ventas = [],
  setVentas,
  usuarioActual,
  registrarMovimiento,
  aperturaActiva = null,
  cierresGuardados = [],
  onAbrirCaja,
  onCerrarCaja,
  liquidacionesGuardadas = [],
  onSaveLiquidacion,
  onUpdateEstadoLiquidacion,
  proveedores = [],
  gastos = [],
  otrosIngresos = [],
  activeSubModal = null,
  setActiveSubModal,
  pendingAddToCartBook = null,
  onClearPendingCartBook
}: POSProps) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [catSel, setCatSel] = useState("Todas");
  const [q, setQ] = useState("");
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sortBy, setSortBy] = useState<SortOption>("titulo-asc");

  const [metodoPago, setMetodoPago] = useState<"Efectivo" | "Tarjeta" | "Transferencia">("Efectivo");
  const [efectivo, setEfectivo] = useState("");
  const [detalleBook, setDetalleBook] = useState<Book | null>(null);
  const [ventaConfirmada, setVentaConfirmada] = useState<Venta | null>(null);
  const [scanningIsbn, setScanningIsbn] = useState("");
  const [cameraModalOpen, setCameraModalOpen] = useState(false);
  const [waModalOpen, setWaModalOpen] = useState(false);
  const [telefonoWa, setTelefonoWa] = useState("");
  const [targetVentaWa, setTargetVentaWa] = useState<Venta | null>(null);

  // Modales de nuevas funcionalidades recomendadas
  const [showEtiquetasModal, setShowEtiquetasModal] = useState<boolean>(false);
  const [showCatalogoClienteModal, setShowCatalogoClienteModal] = useState<boolean>(false);
  const [showCajaManagerModal, setShowCajaManagerModal] = useState<boolean>(false);
  const [showConsignmentModal, setShowConsignmentModal] = useState<boolean>(false);
  const [scanToast, setScanToast] = useState<string | null>(null);

  // Venta fuera de catálogo (Canasto libro usado, varios, etc.)
  const [fueraCatalogoModal, setFueraCatalogoModal] = useState<boolean>(false);
  const [fcConcepto, setFcConcepto] = useState<string>("Canasto Libro Usado");
  const [fcPrecio, setFcPrecio] = useState<string>("");
  const [fcCantidad, setFcCantidad] = useState<string>("1");

  useEffect(() => {
    if (activeSubModal === "caja") setShowCajaManagerModal(true);
    else if (activeSubModal === "etiquetas") setShowEtiquetasModal(true);
    else if (activeSubModal === "catalogo") setShowCatalogoClienteModal(true);
    else if (activeSubModal === "liquidaciones") setShowConsignmentModal(true);
  }, [activeSubModal]);

  // LECTURA RÁPIDA GLOBAL CON PISTOLA DE CÓDIGO DE BARRAS
  useEffect(() => {
    let buffer = "";
    let lastTime = Date.now();

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT")
      ) {
        return;
      }

      const now = Date.now();
      if (now - lastTime > 120) {
        buffer = "";
      }
      lastTime = now;

      if (e.key === "Enter") {
        if (buffer.trim().length >= 3) {
          const query = buffer.trim().toLowerCase();
          const matched = books.find(
            b =>
              b.isbn.toLowerCase() === query ||
              b.isbn.replace(/-/g, "").toLowerCase() === query.replace(/-/g, "") ||
              b.id.toString() === query
          );

          if (matched) {
            const avail = matched.id < 0 ? 999 : ((matched.stock || 0) + (matched.stockTrama || 0));
            if (avail > 0) {
              addToCart(matched, 1);
              playScanBeep(true);
              setScanToast(`⚡ Escaneado y agregado al ticket: ${matched.titulo}`);
              setTimeout(() => setScanToast(null), 3500);
            } else {
              playScanBeep(false);
              setScanToast(`⚠️ Escaneado "${matched.titulo}" pero está AGOTADO`);
              setTimeout(() => setScanToast(null), 3500);
            }
          } else {
            playScanBeep(false);
          }
        }
        buffer = "";
      } else if (e.key.length === 1) {
        buffer += e.key;
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [books]);

  const generarTextoTicketWhatsApp = (v: Venta | { detalle: { qty: number; titulo: string; subtotal: number }[]; total: number; id?: string }) => {
    const isVenta = Boolean(v.id);
    const idHeader = isVenta ? `*TICKET DE VENTA #${v.id}*` : "*COTIZACIÓN DE COMPRA*";
    const fechaStr = isVenta && (v as Venta).fecha ? `${(v as Venta).fecha} ${(v as Venta).hora || ""}` : new Date().toLocaleString("es-CL");
    const vendedorStr = isVenta && (v as Venta).vendedor ? (v as Venta).vendedor : (usuarioActual || "Caja");

    const itemsList = v.detalle
      .map(d => `• ${d.qty}x ${d.titulo} → ${fmt(d.subtotal)}`)
      .join("\n");

    const metodoStr = isVenta ? (v as Venta).metodoPago : metodoPago;

    return (
`📚 *TRAMA LIBRERÍAS* 📚
_Mar de Dudas • Kurripang • Antro_
-----------------------------------
${idHeader}
📅 Fecha: ${fechaStr}
👤 Atendido por: ${vendedorStr}

*Detalle de Libros:*
${itemsList}

-----------------------------------
💰 *TOTAL: ${fmt(v.total)}*
💳 Método de pago: ${metodoStr}
-----------------------------------
¡Gracias por tu compra en Librerías Trama!
📖 Conserva este comprobante digital.`
    );
  };

  const enviarTicketWhatsApp = (ventaObj?: Venta) => {
    const v = ventaObj || ventaConfirmada || {
      detalle: cart.map(item => ({
        qty: item.qty,
        titulo: item.book.titulo,
        subtotal: item.book.precio * item.qty,
      })),
      total,
    };

    const texto = generarTextoTicketWhatsApp(v as any);
    const cleanPhone = telefonoWa.replace(/[^0-9]/g, "");
    
    let url = "";
    if (cleanPhone) {
      // Direct number link (add 56 prefix for Chile if 9 digits)
      const formattedPhone = cleanPhone.length === 9 ? `56${cleanPhone}` : cleanPhone;
      url = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(texto)}`;
    } else {
      url = `https://wa.me/?text=${encodeURIComponent(texto)}`;
    }
    
    window.open(url, "_blank");
    setWaModalOpen(false);
  };

  const categorias = useMemo(() => [
    "Todas",
    ...Array.from(
      new Set(
        books.flatMap(b => (b.categoria ? b.categoria.split(",").map(c => c.trim()).filter(Boolean) : []))
      )
    ),
  ], [books]);

  const getStockDisponible = useCallback((b: Book) => (b.id < 0 ? 999 : ((b.stock || 0) + (b.stockTrama || 0))), []);

  const handleAgregarFueraCatalogo = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const precioNum = Number(fcPrecio);
    if (!fcConcepto.trim()) {
      alert("Por favor ingresa un concepto o descripción para la venta.");
      return;
    }
    if (isNaN(precioNum) || precioNum <= 0) {
      alert("Por favor ingresa un precio válido mayor a 0.");
      return;
    }
    const qtyNum = Math.max(1, Number(fcCantidad) || 1);

    const customBook: Book = {
      id: -Date.now(),
      titulo: fcConcepto.trim(),
      autor: "Fuera de Catálogo",
      isbn: "FC-" + Math.floor(1000 + Math.random() * 9000),
      categoria: "Fuera de Catálogo",
      precio: precioNum,
      stock: 999,
      stockMin: 0,
      proveedor: 0,
      precioCosto: 0,
      tipoAdquisicion: "Otro",
      pagado: true,
      stockTrama: 999,
      esArticulo: true,
      editorial: "Venta Directa"
    };

    addToCart(customBook, qtyNum);
    setFueraCatalogoModal(false);
    setFcConcepto("Canasto Libro Usado");
    setFcPrecio("");
    setFcCantidad("1");
  };

  // Filtering & Sorting logic (Memoized for high performance)
  const filteredBooks = useMemo(() => {
    const query = q.toLowerCase().trim();
    const catSelLower = catSel.toLowerCase();

    return books
      .filter(b => {
        const bookCats = b.categoria ? b.categoria.split(",").map(c => c.trim().toLowerCase()) : [];
        const matchCat = catSel === "Todas" || bookCats.includes(catSelLower);
        const matchQ =
          !query ||
          b.titulo.toLowerCase().includes(query) ||
          b.autor.toLowerCase().includes(query) ||
          b.isbn.toLowerCase().includes(query) ||
          (b.editorial && b.editorial.toLowerCase().includes(query)) ||
          (b.libreria && b.libreria.toLowerCase().includes(query));
        const matchStock = !onlyInStock || getStockDisponible(b) > 0;
        return matchCat && matchQ && matchStock;
      })
      .sort((a, b) => {
        if (sortBy === "titulo-asc") return a.titulo.localeCompare(b.titulo);
        if (sortBy === "precio-asc") return a.precio - b.precio;
        if (sortBy === "precio-desc") return b.precio - a.precio;
        if (sortBy === "stock-desc") return getStockDisponible(b) - getStockDisponible(a);
        return 0;
      });
  }, [books, catSel, q, onlyInStock, sortBy, getStockDisponible]);

  // Navegación con teclado (Flechas izquierda/derecha) en la Ficha
  useEffect(() => {
    if (!detalleBook) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const idx = filteredBooks.findIndex(b => b.id === detalleBook.id);
      if (e.key === "ArrowLeft") {
        if (idx > 0) setDetalleBook(filteredBooks[idx - 1]);
      } else if (e.key === "ArrowRight") {
        if (idx >= 0 && idx < filteredBooks.length - 1) setDetalleBook(filteredBooks[idx + 1]);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [detalleBook, filteredBooks]);

  const addToCart = (b: Book, qty = 1) => {
    const avail = getStockDisponible(b);
    if (avail <= 0) return;
    setCart(prev => {
      const idx = prev.findIndex(item => item.book.id === b.id);
      if (idx >= 0) {
        const newQty = prev[idx].qty + qty;
        if (newQty > avail) return prev;
        const next = [...prev];
        next[idx] = { ...next[idx], qty: newQty };
        return next;
      }
      return [...prev, { book: b, qty: Math.min(qty, avail) }];
    });
  };

  useEffect(() => {
    if (pendingAddToCartBook) {
      addToCart(pendingAddToCartBook, 1);
      if (onClearPendingCartBook) {
        onClearPendingCartBook();
      }
    }
  }, [pendingAddToCartBook]);

  const updateCartQty = (id: number, delta: number) => {
    setCart(prev =>
      prev
        .map(item => {
          if (item.book.id === id) {
            const avail = getStockDisponible(item.book);
            const newQty = item.qty + delta;
            if (newQty <= 0) return null;
            if (newQty > avail) return item;
            return { ...item, qty: newQty };
          }
          return item;
        })
        .filter((item): item is CartItem => item !== null)
    );
  };

  const removeFromCart = (id: number) => {
    setCart(prev => prev.filter(item => item.book.id !== id));
  };

  const handleScanIsbn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanningIsbn.trim()) return;
    const cleanIsbn = scanningIsbn.trim().toLowerCase();
    const found = books.find(b => b.isbn.toLowerCase().includes(cleanIsbn) || b.id.toString() === cleanIsbn);
    if (found) {
      if (getStockDisponible(found) > 0) {
        addToCart(found);
        setScanningIsbn("");
      } else {
        alert(`El libro "${found.titulo}" se encuentra agotado en el Catálogo TRAMA.`);
      }
    } else {
      alert(`No se encontró ningún libro con ISBN/código: ${scanningIsbn}`);
    }
  };

  const total = cart.reduce((acc, item) => acc + item.book.precio * item.qty, 0);
  const totalItems = cart.reduce((acc, item) => acc + item.qty, 0);

  const numEfectivo = Number(efectivo) || 0;
  const vuelto = metodoPago === "Efectivo" && numEfectivo >= total ? numEfectivo - total : 0;

  const aplicarEfectivoRapido = (monto: number) => {
    setMetodoPago("Efectivo");
    setEfectivo(String(monto));
  };

  const procesarVenta = () => {
    if (cart.length === 0) return;

    if (!aperturaActiva || aperturaActiva.estado !== "Abierta") {
      alert("⚠️ CAJA CERRADA: El primer paso para iniciar las ventas del turno es Abrir Caja e ingresar el fondo inicial.");
      setShowCajaManagerModal(true);
      return;
    }

    if (metodoPago === "Efectivo" && numEfectivo < total) {
      alert(`Monto en efectivo insuficiente. El total a pagar es ${fmt(total)}.`);
      return;
    }

    const hoy = new Date();
    const fecha = hoy.toISOString().slice(0, 10);
    const hora = hoy.toTimeString().slice(0, 5);
    const ventaId = `V-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;

    const nuevaVenta: Venta = {
      id: ventaId,
      fecha,
      hora,
      total,
      items: totalItems,
      estado: "pagado",
      metodoPago,
      vendedor: usuarioActual || "Caja General",
      efectivoEntregado: metodoPago === "Efectivo" ? numEfectivo : undefined,
      vuelto: metodoPago === "Efectivo" ? vuelto : undefined,
      detalle: cart.map(item => ({
        id: item.book.id,
        titulo: item.book.titulo,
        precio: item.book.precio,
        qty: item.qty,
        subtotal: item.book.precio * item.qty,
      })),
    };

    // Actualizar stock de libros: La venta descuenta tanto de Stock TRAMA como de Stock Local
    setBooks(prev =>
      prev.map(b => {
        const itemInCart = cart.find(ci => ci.book.id === b.id);
        if (itemInCart) {
          let qtyToDeduct = itemInCart.qty;
          let currentTrama = b.stockTrama || 0;
          let currentStock = b.stock || 0;

          // Si el libro tiene stockTrama explícito, descontamos primero de ahí
          if (currentTrama > 0) {
            const deductTrama = Math.min(currentTrama, qtyToDeduct);
            currentTrama -= deductTrama;
            qtyToDeduct -= deductTrama;
          }

          // Si aún queda cantidad por descontar (o si stockTrama era 0 / no definido), descontamos del stock local
          if (qtyToDeduct > 0) {
            currentStock = Math.max(0, currentStock - qtyToDeduct);
          }

          return {
            ...b,
            stock: currentStock,
            stockTrama: b.stockTrama !== undefined ? currentTrama : undefined
          };
        }
        return b;
      })
    );

    // Registrar movimientos de inventario
    cart.forEach(item => {
      registrarMovimiento({
        bookId: item.book.id,
        titulo: item.book.titulo,
        tipo: "venta",
        cantidad: -item.qty,
        montoUnit: item.book.precio,
        motivo: `Venta ${ventaId} (${metodoPago})`,
      });
    });

    // Guardar venta
    setVentas(prev => [nuevaVenta, ...prev]);

    setVentaConfirmada(nuevaVenta);
    setCart([]);
    setEfectivo("");
  };

  const [mobileTab, setMobileTab] = useState<"catalogo" | "ticket">("catalogo");

  return (
    <div className="flex flex-col h-auto lg:h-full min-h-0 gap-3 relative">
      {/* BANNER INDICADOR DE CAJA Y APERTURA DE TURNO */}
      <div
        className={`p-2.5 sm:p-3 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 shadow-2xs transition-all ${
          aperturaActiva?.estado === "Abierta"
            ? "bg-emerald-50/90 border-emerald-200 text-emerald-950"
            : "bg-amber-50 border-amber-300 text-amber-950"
        }`}
      >
        <div className="flex items-center gap-2.5">
          <div
            className={`p-2 rounded-xl shrink-0 ${
              aperturaActiva?.estado === "Abierta"
                ? "bg-emerald-700 text-white"
                : "bg-amber-600 text-white animate-pulse"
            }`}
          >
            {aperturaActiva?.estado === "Abierta" ? <Unlock size={18} /> : <Lock size={18} />}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-extrabold text-xs sm:text-sm">
                {aperturaActiva?.estado === "Abierta" ? "🟢 Caja Abierta y Turno Iniciado" : "⚠️ PASO 1: ABRIR CAJA E INICIAR TURNO"}
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  aperturaActiva?.estado === "Abierta"
                    ? "bg-emerald-100 border-emerald-300 text-emerald-800"
                    : "bg-amber-100 border-amber-300 text-amber-900 font-extrabold"
                }`}
              >
                {aperturaActiva?.estado === "Abierta" ? `Apertura ${aperturaActiva.horaApertura}` : "Primer paso obligatorio"}
              </span>
            </div>
            <p className="text-[11px] font-medium text-gray-700 mt-0.5">
              {aperturaActiva?.estado === "Abierta"
                ? `Atendido por ${aperturaActiva.cajero} • Fondo Inicial: ${fmt(aperturaActiva.fondoInicial)}`
                : "Antes de comenzar a registrar ventas, debes realizar la Apertura de Caja e ingresar el fondo inicial."}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowCajaManagerModal(true)}
          className={`shrink-0 px-3.5 py-2 text-xs font-black rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-1.5 ${
            aperturaActiva?.estado === "Abierta"
              ? "bg-white hover:bg-emerald-100 border border-emerald-300 text-emerald-900"
              : "bg-amber-700 hover:bg-amber-800 text-white border border-amber-800 shadow-amber-900/20 animate-bounce"
          }`}
        >
          {aperturaActiva?.estado === "Abierta" ? (
            <>
              <Calculator size={14} />
              <span>Control / Arqueo de Caja</span>
            </>
          ) : (
            <>
              <Unlock size={14} />
              <span>Abrir Caja e Iniciar Turno</span>
            </>
          )}
        </button>
      </div>

      {/* ÁREA PRINCIPAL POS: CATÁLOGO Y TICKET */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 gap-3 lg:gap-4 overflow-visible relative">
        {/* BARRA MÓVIL TOGGLE (CÁTALOGO / TICKET) - Solo en pantallas pequeñas */}
        <div className="flex lg:hidden bg-white p-1 rounded-xl border border-gray-200 shadow-2xs shrink-0 mb-1">
          <button
            onClick={() => setMobileTab("catalogo")}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
              mobileTab === "catalogo" ? "bg-purple-900 text-white shadow-2xs" : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <BookOpen size={14} />
            <span>Catálogo ({filteredBooks.length})</span>
          </button>
          <button
            onClick={() => {
              setMobileTab("ticket");
              setDetalleBook(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              mobileTab === "ticket" ? "bg-purple-900 text-white shadow-2xs" : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <ShoppingBag size={14} className="stroke-[2.5]" />
            <span>Ticket ({totalItems})</span>
            {totalItems > 0 && (
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-black text-white">
                {fmt(total)}
              </span>
            )}
          </button>
        </div>

        {/* PANEL IZQUIERDO: CATÁLOGO DE LIBROS */}
        <div
          className={`flex-1 flex flex-col min-w-0 bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-2xs h-auto lg:h-full ${
            mobileTab === "ticket" ? "hidden lg:flex" : "flex"
          }`}
        >
          {/* BARRA SUPERIOR DE BÚSQUEDA Y VISTA */}
          <div className="p-2.5 border-b border-gray-100 space-y-2 shrink-0 bg-gray-50/50">
            {/* BANNER NOTIFICACIÓN ESCÁNER BARRAS */}
            {scanToast && (
              <div className="bg-emerald-600 text-white px-2.5 py-1 rounded-lg font-bold text-xs flex items-center gap-2 shadow-md animate-in slide-in-from-top duration-200">
                <Zap size={13} className="animate-spin" />
                <span>{scanToast}</span>
              </div>
            )}

          <div className="flex flex-col sm:flex-row gap-2">
            {/* Buscador General */}
            <div className="relative flex-1">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por título, autor, editorial o ISBN..."
                value={q}
                onChange={e => setQ(e.target.value)}
                className="w-full pl-8 pr-7 py-1.5 text-xs bg-white border border-gray-200 rounded-lg outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-200 font-medium"
              />
              {q && (
                <button
                  onClick={() => setQ("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* FILTROS SECUNDARIOS & MODO DE VISTA */}
          <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1 border-t border-gray-100/80">
            {/* Categorías (Desplegable / Select) */}
            <div className="flex items-center gap-1.5 min-w-[160px]">
              <select
                id="pos-category-select"
                value={catSel}
                onChange={e => setCatSel(e.target.value)}
                className="w-full text-[11px] bg-white border border-gray-200 rounded-lg px-2 py-1 text-gray-800 outline-none font-medium cursor-pointer focus:border-purple-600 focus:ring-1 focus:ring-purple-500 shadow-2xs"
              >
                {categorias.map(cat => {
                  const count = books.filter(b => {
                    if (cat === "Todas") return true;
                    const bookCats = b.categoria ? b.categoria.split(",").map(c => c.trim().toLowerCase()) : [];
                    return bookCats.includes(cat.toLowerCase());
                  }).length;
                  const label = cat === "Todas" ? "Todas las Categorías" : `${catEmoji[cat] || "📚"} ${cat}`;
                  return (
                    <option key={cat} value={cat}>
                      {label} ({count})
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Controles de Vista & Filtro de Stock */}
            <div className="flex items-center gap-1.5 shrink-0">
              <label className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-600 cursor-pointer select-none bg-white px-2 py-0.5 rounded-lg border border-gray-200 hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={onlyInStock}
                  onChange={e => setOnlyInStock(e.target.checked)}
                  className="rounded text-gray-900 focus:ring-0"
                />
                Con Stock
              </label>

              {/* Ordenar */}
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as SortOption)}
                className="text-[11px] bg-white border border-gray-200 rounded-lg px-1.5 py-0.5 text-gray-700 outline-none font-medium cursor-pointer"
              >
                <option value="titulo-asc">A-Z Título</option>
                <option value="precio-asc">Precio: Menor a Mayor</option>
                <option value="precio-desc">Precio: Mayor a Menor</option>
                <option value="stock-desc">Mayor Stock</option>
              </select>

              {/* Toggle Vista */}
              <div className="flex items-center border border-gray-200 rounded-lg bg-white p-0.5">
                <button
                  onClick={() => setViewMode("grid")}
                  title="Vista Tarjetas"
                  className={`p-1 rounded font-bold transition-all cursor-pointer ${viewMode === "grid" ? "bg-purple-900 text-white" : "text-gray-400 hover:text-gray-700"}`}
                >
                  <LayoutGrid size={13} />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  title="Vista Lista Compacta"
                  className={`p-1 rounded font-bold transition-all cursor-pointer ${viewMode === "list" ? "bg-purple-900 text-white" : "text-gray-400 hover:text-gray-700"}`}
                >
                  <List size={13} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* HEADER INDICADOR DEL CATÁLOGO */}
        <div className="px-3 py-1.5 bg-gray-50/80 border-b border-gray-100 flex items-center justify-between text-xs text-gray-500 font-medium">
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-900">{catSel === "Todas" ? "Todo el Catálogo" : catSel}</span>
            <span className="text-[11px] text-gray-400">• {filteredBooks.length} títulos encontrados</span>
          </div>

          {q && (
            <span className="text-[11px] text-gray-500 bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full font-medium">
              Filtrado por: "{q}"
            </span>
          )}
        </div>

        {/* CATÁLOGO DE LIBROS (GRILLA O LISTA) */}
        <div className="flex-1 overflow-y-auto p-2.5 sm:p-3">
          {filteredBooks.length === 0 ? (
            <div className="h-full py-12 text-center text-gray-400 text-xs flex flex-col items-center justify-center gap-2">
              <BookOpen size={32} className="text-gray-300" />
              <p className="font-semibold text-gray-700 text-sm">No se encontraron libros</p>
              <p className="text-gray-400 max-w-xs">Intenta ajustar la búsqueda, filtro de stock o seleccionar otra categoría.</p>
            </div>
          ) : viewMode === "grid" ? (
            /* VISTA DE TARJETAS (GRID) */
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-2.5">
              {filteredBooks.map(b => {
                const inCart = cart.find(ci => ci.book.id === b.id)?.qty || 0;
                const sinStock = getStockDisponible(b) <= 0;

                return (
                  <div
                    key={b.id}
                    onClick={() => setDetalleBook(b)}
                    className={`group relative border rounded-xl p-2.5 flex flex-col justify-between transition-all bg-white cursor-pointer ${
                      sinStock
                        ? "border-gray-100 bg-gray-50/60 opacity-60"
                        : inCart > 0
                        ? "border-gray-900 ring-1 ring-gray-900 shadow-xs"
                        : "border-gray-200 hover:border-gray-400 hover:shadow-sm"
                    }`}
                  >
                    <div>
                      {/* Portada & Stock Badge - Clickable to open details sheet */}
                      <div
                        title="Clic para ver ficha del producto"
                        className="relative mb-2 flex items-center justify-center bg-white p-0 border-0 shadow-none group/covercontainer cursor-pointer transition-all"
                        style={{ backgroundColor: "#ffffff", borderStyle: "none", borderWidth: "0px", boxShadow: "none" }}
                      >
                        <CoverBox book={b} className="w-20 sm:w-24 h-28 sm:h-34 shadow-none border-none" emojiSize="text-2xl" showEffect={false} />

                        {/* Indicador sutil al pasar el mouse */}
                        <div className="absolute top-1 right-1 bg-black/60 backdrop-blur-xs text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full opacity-0 group-hover/covercontainer:opacity-100 transition-opacity pointer-events-none">
                          Ver Ficha
                        </div>
                      </div>

                      {/* Título & Autor - Clickable to open details */}
                      <div className="group/title">
                        <h4 className="font-bold text-xs text-gray-900 line-clamp-2 leading-tight group-hover/title:text-purple-600 transition-colors">
                          {b.titulo}
                        </h4>
                        <p className="text-[10px] text-gray-500 line-clamp-1 mt-0.5 group-hover/title:text-gray-700">{b.autor}</p>
                      </div>

                      <div className="flex items-center gap-1 mt-1 flex-wrap">
                        {b.editorial && (
                          <span className="text-[9px] font-bold text-purple-900 bg-purple-100/80 border border-purple-200 px-1.5 py-0.5 rounded">
                            {b.editorial}
                          </span>
                        )}
                        {b.categoria && (
                          <span className="text-[9px] text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded font-medium">
                            {b.categoria}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Precio & Controles de Carrito Directos */}
                    <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between">
                      <span className="font-extrabold text-xs text-gray-900">{fmt(b.precio)}</span>

                      {sinStock ? (
                        <span className="text-[9px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded">Agotado</span>
                      ) : inCart > 0 ? (
                        <div
                          className="flex items-center gap-0.5 text-black font-extrabold text-xs px-1.5 py-0.5 rounded-md shadow-xs"
                          style={{
                            backgroundColor: "#0db01b",
                            color: "#000000",
                          }}
                        >
                          <button
                            type="button"
                            onClick={e => {
                              e.stopPropagation();
                              updateCartQty(b.id, -1);
                            }}
                            className="hover:bg-black/15 active:scale-90 p-0.5 rounded transition-all cursor-pointer"
                            title="Restar 1"
                          >
                            <Minus size={11} className="stroke-[3]" />
                          </button>
                          <span className="font-extrabold px-1 text-[11px] min-w-[12px] text-center">{inCart}</span>
                          <button
                            type="button"
                            onClick={e => {
                              e.stopPropagation();
                              addToCart(b, 1);
                            }}
                            className="hover:bg-black/15 active:scale-90 p-0.5 rounded transition-all cursor-pointer"
                            title="Sumar 1"
                          >
                            <Plus size={11} className="stroke-[3]" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            addToCart(b);
                          }}
                          className="inline-flex items-center justify-center gap-1 text-[11px] font-bold text-white bg-purple-900 hover:bg-purple-950 active:scale-95 transition-all cursor-pointer px-2.5 py-1 rounded-md shadow-2xs"
                          title="Añadir al ticket"
                        >
                          <Plus size={11} className="stroke-[3]" />
                          <span>Agregar</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* VISTA DE LISTA COMPACTA (LIST) */
            <div className="border border-gray-200 rounded-xl overflow-x-auto bg-white shadow-2xs">
              <table className="w-full text-xs text-left border-collapse min-w-[640px]">
                <thead>
                  <tr className="bg-gray-50/90 border-b border-gray-200 text-gray-500 font-semibold text-[11px] uppercase tracking-wider">
                    <th className="px-3 py-2">Libro</th>
                    <th className="px-3 py-2">Editorial / Ficha</th>
                    <th className="px-3 py-2">Categoría / Ubicación</th>
                    <th className="px-3 py-2 text-center">Stock</th>
                    <th className="px-3 py-2 text-right">Precio</th>
                    <th className="px-3 py-2 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredBooks.map(b => {
                    const inCart = cart.find(ci => ci.book.id === b.id)?.qty || 0;
                    const stockDisp = getStockDisponible(b);
                    const sinStock = stockDisp <= 0;
                    const esStockBajo = stockDisp > 0 && stockDisp <= b.stockMin;

                    return (
                      <tr key={b.id} className={`hover:bg-purple-50/40 transition-colors ${sinStock ? "bg-gray-50/50" : ""}`}>
                        {/* LIBRO: PORTADA, TÍTULO, AUTOR E ISBN */}
                        <td className="px-3 py-2.5 font-medium min-w-[200px]">
                          <div
                            onClick={() => setDetalleBook(b)}
                            className="flex items-start gap-2.5 cursor-pointer group/listitem"
                            title="Clic para desplegar Ficha del Producto"
                          >
                            <CoverBox book={b} className="w-9 h-12 shrink-0 shadow-2xs" emojiSize="text-[11px]" showEffect={false} />
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-gray-900 text-xs leading-snug group-hover/listitem:text-purple-600 transition-colors">
                                {b.titulo}
                              </p>
                              <p className="text-[11px] text-gray-600 font-medium leading-snug mt-0.5">{b.autor}</p>
                              {b.isbn && (
                                <p className="text-[9px] text-gray-400 font-mono tracking-tight mt-0.5">
                                  ISBN: {b.isbn}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* EDITORIAL / FICHA / AÑO */}
                        <td className="px-3 py-2.5 text-gray-600 text-[11px] min-w-[130px] align-top">
                          <div className="font-semibold text-gray-800 text-xs">
                            {b.editorial || "Edición Independiente"}
                          </div>
                          <div className="flex flex-wrap items-center gap-1 mt-1">
                            {(b.anioProduccion || b.anioLanzamiento) && (
                              <span className="text-[9px] font-bold text-purple-900 bg-purple-50 border border-purple-200 px-1.5 py-0.2 rounded">
                                Año: {b.anioProduccion || b.anioLanzamiento}
                              </span>
                            )}
                            {b.tipoPortada && (
                              <span className="text-[9px] text-gray-600 bg-gray-100 px-1.5 py-0.2 rounded font-medium">
                                {b.tipoPortada}
                              </span>
                            )}
                            {b.estadoLibro === "Segunda Mano" && (
                              <span className="text-[9px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded">
                                Usado
                              </span>
                            )}
                          </div>
                        </td>

                        {/* CATEGORÍA / UBICACIÓN */}
                        <td className="px-3 py-2.5 min-w-[120px] align-top">
                          <div className="flex flex-wrap items-center gap-1">
                            {b.categoria ? (
                              b.categoria.split(",").map((cat, idx) => (
                                <span
                                  key={idx}
                                  className="inline-block text-[10px] text-purple-900 bg-purple-100/70 border border-purple-200/80 px-2 py-0.5 rounded-md font-semibold"
                                >
                                  {cat.trim()}
                                </span>
                              ))
                            ) : (
                              <span className="text-[10px] text-gray-400 font-normal">Sin categoría</span>
                            )}
                          </div>
                          {b.ubicacion && (
                            <p className="text-[10px] text-gray-500 font-medium mt-1 flex items-center gap-1">
                              <span className="text-gray-400">📍</span> {b.ubicacion}
                            </p>
                          )}
                        </td>

                        {/* STOCK DISPONIBLE */}
                        <td className="px-3 py-2.5 text-center align-top whitespace-nowrap min-w-[90px]">
                          {sinStock ? (
                            <span className="inline-block text-[10px] font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                              Agotado (0 un.)
                            </span>
                          ) : esStockBajo ? (
                            <span
                              className="inline-block text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full"
                              title={`Stock bajo. Mínimo configurado: ${b.stockMin}`}
                            >
                              {stockDisp} un. (Bajo)
                            </span>
                          ) : (
                            <span className="inline-block text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                              {stockDisp} un.
                            </span>
                          )}
                        </td>

                        {/* PRECIO */}
                        <td className="px-3 py-2.5 text-right font-extrabold text-gray-900 text-xs whitespace-nowrap align-top">
                          {fmt(b.precio)}
                        </td>

                        {/* ACCIONES (AGREGAR / MODIFICAR CARRITO) */}
                        <td className="px-3 py-2.5 text-right align-top whitespace-nowrap min-w-[100px]">
                          {sinStock ? (
                            <span className="text-[10px] text-gray-400 font-bold bg-gray-100 px-2 py-1 rounded-md inline-block">
                              Sin Stock
                            </span>
                          ) : inCart > 0 ? (
                            <div
                              className="inline-flex items-center gap-1 text-black font-extrabold text-xs px-2 py-1 rounded-md shadow-2xs"
                              style={{
                                backgroundColor: "#0db01b",
                                color: "#000000",
                              }}
                            >
                              <button
                                type="button"
                                onClick={e => {
                                  e.stopPropagation();
                                  updateCartQty(b.id, -1);
                                }}
                                className="hover:bg-black/15 active:scale-90 p-0.5 rounded transition-all cursor-pointer"
                                title="Restar 1"
                              >
                                <Minus size={11} className="stroke-[3]" />
                              </button>
                              <span className="font-black px-1 text-xs min-w-[14px] text-center">{inCart}</span>
                              <button
                                type="button"
                                onClick={e => {
                                  e.stopPropagation();
                                  addToCart(b, 1);
                                }}
                                className="hover:bg-black/15 active:scale-90 p-0.5 rounded transition-all cursor-pointer"
                                title="Sumar 1"
                              >
                                <Plus size={11} className="stroke-[3]" />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={e => {
                                e.stopPropagation();
                                addToCart(b);
                              }}
                              className="inline-flex items-center justify-center gap-1 text-[11px] font-bold text-white bg-purple-900 hover:bg-purple-950 active:scale-95 transition-all cursor-pointer px-2.5 py-1 rounded-md shadow-2xs"
                              title="Añadir al ticket"
                            >
                              <Plus size={11} className="stroke-[3]" />
                              <span>Agregar</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* PANEL DERECHO: CARRITO / TICKET DE VENTA (STICKY Y SIEMPRE VISIBLE EN EL BORDE SUPERIOR) */}
      <div
        className={`w-full lg:w-80 xl:w-80 max-w-sm h-auto lg:max-h-[calc(100vh-1.5rem)] lg:sticky lg:top-3 lg:self-start shrink-0 bg-white rounded-2xl border border-gray-200 flex flex-col shadow-2xs overflow-hidden z-10 ${
          mobileTab === "catalogo" ? "hidden lg:flex" : "flex"
        }`}
      >
        {/* Header del Ticket */}
        <div className="shrink-0 px-3.5 py-2.5 border-b border-gray-100 flex items-center justify-between bg-gray-50/80">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-purple-900 text-white rounded-lg shadow-2xs">
              <ShoppingBag size={14} className="stroke-[2.5]" />
            </div>
            <div>
              <span className="text-xs font-bold text-gray-900 block leading-none">Ticket de Venta</span>
              <span className="text-[10px] text-gray-500 font-medium">{totalItems} {totalItems === 1 ? "libro" : "libros"}</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {cart.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={() => setWaModalOpen(true)}
                  title="Enviar resumen por WhatsApp"
                  className="px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg transition-colors flex items-center gap-1 text-[10px] font-bold border border-emerald-200 cursor-pointer"
                >
                  <MessageSquare size={12} />
                  <span>WhatsApp</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCart([])}
                  className="text-[10px] text-red-600 hover:text-red-700 font-semibold hover:underline px-1.5 cursor-pointer"
                >
                  Vaciar
                </button>
              </>
            )}
          </div>
        </div>

        {/* Botón Destacado: Venta Fuera de Catálogo */}
        <div className="shrink-0 px-2.5 py-1.5 bg-purple-50/70 border-b border-purple-100 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setFueraCatalogoModal(true)}
            title="Agregar item fuera de catálogo (Libros usados, canastos, fanzines, etc.)"
            className="w-full py-1.5 px-2 bg-white hover:bg-purple-100/80 text-purple-950 border border-purple-200/90 rounded-xl text-[11px] font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs hover:shadow-xs active:scale-98"
          >
            <Plus size={13} className="text-purple-700 stroke-[3]" />
            <span>🧺 Venta Fuera de Catálogo (Usados/Varios)</span>
          </button>
        </div>

        {/* Lista de Libros en Carrito (Área dinámica con scroll independiente, sin filas en blanco) */}
        <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5 min-h-[120px] bg-gray-50/30 flex flex-col">
          {cart.length === 0 ? (
            <div className="my-auto p-4 rounded-xl border border-dashed border-gray-200 bg-white/90 text-center text-gray-400 space-y-1.5 shadow-2xs">
              <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-700 mx-auto">
                <ShoppingBag size={18} />
              </div>
              <p className="text-xs font-bold text-gray-800">Ticket Vacío</p>
              <p className="text-[10px] text-gray-400 max-w-[200px] mx-auto leading-tight">
                Selecciona libros del catálogo o agrega ventas fuera de catálogo.
              </p>
              <button
                type="button"
                onClick={() => setFueraCatalogoModal(true)}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-purple-900 bg-purple-50 border border-purple-200 hover:bg-purple-100 rounded-lg transition-colors cursor-pointer mt-1"
              >
                <Plus size={12} className="stroke-[3]" />
                <span>Agregar Item Fuera de Catálogo</span>
              </button>
            </div>
          ) : (
            cart.map(item => (
              <div
                key={item.book.id}
                className="flex items-center justify-between p-2 rounded-xl bg-white border border-gray-200/80 text-xs shadow-2xs transition-all hover:border-gray-300 gap-2 shrink-0"
              >
                <div className="flex-1 min-w-0">
                  <p
                    onClick={() => item.book.id > 0 && setDetalleBook(item.book)}
                    className={`font-bold text-gray-900 truncate leading-tight ${
                      item.book.id > 0 ? "hover:text-purple-700 cursor-pointer" : ""
                    }`}
                    title={item.book.id > 0 ? "Ver ficha del libro" : item.book.titulo}
                  >
                    {item.book.titulo}
                  </p>
                  {item.book.id < 0 && (
                    <span className="inline-block text-[9px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded mt-0.5">
                      🧺 Fuera de catálogo
                    </span>
                  )}
                  <div className="flex items-center justify-between text-[10px] text-gray-500 mt-0.5">
                    <span className="font-medium text-gray-500">{item.qty} un. × {fmt(item.book.precio)}</span>
                    <span className="font-extrabold text-gray-900 text-right ml-1">{fmt(item.book.precio * item.qty)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0 bg-gray-50 border border-gray-200 rounded-lg p-0.5 shadow-2xs">
                  <button onClick={() => updateCartQty(item.book.id, -1)} className="p-0.5 text-gray-600 hover:bg-gray-200 rounded cursor-pointer" title="Restar 1">
                    <Minus size={11} />
                  </button>
                  <span className="font-extrabold w-4 text-center text-xs text-gray-900">{item.qty}</span>
                  <button onClick={() => updateCartQty(item.book.id, 1)} className="p-0.5 text-gray-600 hover:bg-gray-200 rounded cursor-pointer" title="Sumar 1">
                    <Plus size={11} />
                  </button>
                  <button onClick={() => removeFromCart(item.book.id)} className="p-0.5 text-red-500 hover:bg-red-50 rounded ml-0.5 border-l border-gray-200 cursor-pointer" title="Eliminar">
                    <Trash2 size={11} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Resumen & Método de Pago (PANEL INFERIOR SIEMPRE VISIBLE) */}
        <div className="shrink-0 p-3 border-t border-gray-200 bg-white space-y-2 shadow-lg">
          {/* Banner Destacado de Total (SIEMPRE VISIBLE) */}
          <div className="flex items-center justify-between p-2.5 rounded-xl shadow-xs bg-emerald-800 text-white">
            <div>
              <span className="text-xs text-emerald-100 font-extrabold uppercase leading-none">Total ({totalItems} un.)</span>
            </div>
            <span className="text-lg font-black tracking-tight text-white text-right">{fmt(total)}</span>
          </div>

          {/* Selección de Método de Pago */}
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Pago</label>
              <span className="text-[10px] font-bold text-gray-600">{metodoPago}</span>
            </div>
            <div className="grid grid-cols-3 gap-1">
              {(["Efectivo", "Tarjeta", "Transferencia"] as const).map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMetodoPago(m)}
                  className={`py-1 px-1 text-[10px] font-bold rounded-lg border text-center transition-all cursor-pointer ${
                    metodoPago === m
                      ? "bg-purple-900 text-white border-purple-900 shadow-2xs"
                      : "bg-white text-gray-600 border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Detalles de Efectivo (Solo si aplica y hay total > 0) */}
          {metodoPago === "Efectivo" && cart.length > 0 && (
            <div className="p-2 bg-purple-50/60 rounded-xl border border-purple-100 space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-gray-600 uppercase">Recibido</label>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => aplicarEfectivoRapido(total)}
                    className="text-[9px] bg-white border border-gray-200 px-1.5 py-0.5 rounded font-bold text-gray-700 hover:bg-gray-100 shadow-2xs cursor-pointer"
                  >
                    Exacto
                  </button>
                  <button
                    type="button"
                    onClick={() => aplicarEfectivoRapido(Math.ceil(total / 5000) * 5000 || 5000)}
                    className="text-[9px] bg-white border border-gray-200 px-1.5 py-0.5 rounded font-bold text-gray-700 hover:bg-gray-100 shadow-2xs cursor-pointer"
                  >
                    Redondeo
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  placeholder={String(total)}
                  value={efectivo}
                  onChange={e => setEfectivo(e.target.value)}
                  className="w-full px-2 py-1 text-xs font-black bg-white border border-gray-200 rounded-lg outline-none focus:border-purple-500"
                />
                {numEfectivo >= total && total > 0 && (
                  <div className="text-right shrink-0 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-lg">
                    <span className="text-[9px] text-emerald-800 font-bold block uppercase leading-none">Vuelto</span>
                    <span className="text-xs font-black text-emerald-900">{fmt(vuelto)}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* BOTÓN CONFIRMAR VENTA O ABRIR CAJA (SIEMPRE ACTIVO) */}
          <Btn
            onClick={() => {
              if (!aperturaActiva || aperturaActiva.estado !== "Abierta") {
                setShowCajaManagerModal(true);
              } else {
                procesarVenta();
              }
            }}
            variant={(!aperturaActiva || aperturaActiva.estado !== "Abierta") ? "emerald" : "primary"}
            size="md"
            disabled={(!aperturaActiva || aperturaActiva.estado !== "Abierta") ? false : cart.length === 0}
            className={`w-full py-2.5 text-xs font-black shadow-md border-0 tracking-wide flex items-center justify-center gap-2 rounded-xl transition-all ${
              (!aperturaActiva || aperturaActiva.estado !== "Abierta" || cart.length > 0) ? "cursor-pointer" : "opacity-50 cursor-not-allowed"
            }`}
          >
            {(!aperturaActiva || aperturaActiva.estado !== "Abierta") ? (
              <>
                <Unlock size={15} className="stroke-[2.5]" />
                <span>Abrir Caja e Iniciar Turno</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={15} className="stroke-[2.5]" />
                {cart.length === 0 ? "Agregar productos al ticket" : `Confirmar Venta (${fmt(total)})`}
              </>
            )}
          </Btn>
        </div>
      </div>

      {/* MODAL FICHA (ACCESO A INFORMACIÓN Y NAVEGACIÓN DE PRODUCTOS CONTIGUOS) */}
      {detalleBook && (() => {
        const detalleIndex = filteredBooks.findIndex(b => b.id === detalleBook.id);
        const totalCount = filteredBooks.length;
        const hasPrev = detalleIndex > 0;
        const hasNext = detalleIndex >= 0 && detalleIndex < totalCount - 1;

        const handlePrev = () => {
          if (hasPrev) setDetalleBook(filteredBooks[detalleIndex - 1]);
        };

        const handleNext = () => {
          if (hasNext) setDetalleBook(filteredBooks[detalleIndex + 1]);
        };

        return (
          <Modal title="Ficha del Producto" onClose={() => setDetalleBook(null)} maxWidth="max-w-2xl">
            <div className="space-y-2.5">
              {/* BARRA SUPERIOR DE NAVEGACIÓN CONTIGUA ENTRE PRODUCTOS */}
              <div className="flex items-center justify-between gap-2 p-1.5 px-2.5 bg-purple-50/60 rounded-xl border border-purple-100 text-xs">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-gray-700">Navegación:</span>
                  {catSel !== "Todas" && (
                    <Badge variant="purple" className="text-[10px]">
                      {catEmoji[catSel] || "📚"} {catSel}
                    </Badge>
                  )}
                  <span className="text-gray-600 font-extrabold font-mono bg-white px-2 py-0.5 rounded-md border border-gray-200">
                    {detalleIndex >= 0 ? `${detalleIndex + 1} de ${totalCount}` : `1 de ${totalCount}`}
                  </span>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={handlePrev}
                    disabled={!hasPrev}
                    title="Producto anterior (Flecha Izquierda)"
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-gray-300 bg-white hover:bg-purple-50 hover:border-purple-300 disabled:opacity-30 disabled:hover:bg-white disabled:hover:border-gray-300 text-gray-700 text-xs font-semibold transition-all cursor-pointer disabled:cursor-not-allowed shadow-2xs"
                  >
                    <ChevronLeft size={15} /> <span className="hidden sm:inline">Anterior</span>
                  </button>
                  <button
                    onClick={handleNext}
                    disabled={!hasNext}
                    title="Producto siguiente (Flecha Derecha)"
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-gray-300 bg-white hover:bg-purple-50 hover:border-purple-300 disabled:opacity-30 disabled:hover:bg-white disabled:hover:border-gray-300 text-gray-700 text-xs font-semibold transition-all cursor-pointer disabled:cursor-not-allowed shadow-2xs"
                  >
                    <span className="hidden sm:inline">Siguiente</span> <ChevronRight size={15} />
                  </button>
                </div>
              </div>

              {/* CONTENIDO PRINCIPAL REORDENADO DE LA FICHA */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-start">
                {/* PORTADA AGRANDADA (COLUMNA IZQUIERDA) */}
                <div className="sm:col-span-5 flex flex-col justify-start">
                  <BookDetailGallery book={detalleBook} />
                </div>

                {/* COLUMNA DERECHA: TÍTULO, AUTOR, CATEGORÍA, DATOS Y RESEÑA DINÁMICA */}
                <div className="sm:col-span-7 flex flex-col space-y-2 justify-start">
                  {/* CABECERA CON TÍTULO Y AUTOR */}
                  <div className="space-y-0.5">
                    <h3 className="font-extrabold text-base sm:text-lg text-gray-900 leading-tight">{detalleBook.titulo}</h3>
                    <p className="text-purple-800 font-bold text-xs sm:text-sm">{detalleBook.autor}</p>
                    <div className="flex items-center gap-1 flex-wrap pt-0.5">
                      {detalleBook.editorial && <Badge variant="gray">{detalleBook.editorial}</Badge>}
                      {detalleBook.categoria && <Badge variant="blue">{detalleBook.categoria}</Badge>}
                    </div>
                  </div>

                  {/* GRILLA DE DATOS DEL LIBRO */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 p-2 bg-gray-50 rounded-xl border border-gray-200/80 text-[11px]">
                    <div>
                      <span className="text-gray-400 block font-medium">Páginas:</span>
                      <span className="font-semibold text-gray-800">{detalleBook.paginas || "N/I"} págs.</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block font-medium">Año Edición:</span>
                      <span className="font-semibold text-purple-900">
                        {detalleBook.anioLanzamiento ? `${detalleBook.anioLanzamiento}` : "N/I"}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 block font-medium">Portada:</span>
                      <span className="font-semibold text-gray-800">{detalleBook.tipoPortada || "Tapa blanda"}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block font-medium">Dimensiones:</span>
                      <span className="font-semibold text-gray-800">
                        {detalleBook.alto || detalleBook.ancho || detalleBook.espesor
                          ? `${detalleBook.alto || "—"}×${detalleBook.ancho || "—"} cm (${detalleBook.espesor || "—"} mm)`
                          : "N/I"}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 block font-medium">Peso:</span>
                      <span className="font-semibold text-gray-800">
                        {detalleBook.peso ? `${detalleBook.peso} g` : "N/I"}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 block font-medium">Ubicación:</span>
                      <span className="font-semibold text-gray-800 truncate block">
                        {detalleBook.ubicacion || "Mesa Principal"}
                      </span>
                    </div>
                  </div>

                  {/* SECCIÓN RESEÑA DINÁMICA (SIN TÍTULO NI ÍCONO) */}
                  <div className="p-2.5 bg-purple-50/70 rounded-xl border border-purple-100 transition-all">
                    <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-line max-h-[160px] overflow-y-auto pr-1">
                      {detalleBook.observaciones ? detalleBook.observaciones : "Sin reseña registrada para este título."}
                    </p>
                  </div>
                </div>
              </div>

              {/* PIE DE LA FICHA: BOTÓN VOLVER AL CATÁLOGO + BOTÓN AÑADIR */}
              <div className="pt-2 border-t border-gray-200 flex items-center justify-between flex-wrap gap-2">
                <Btn
                  onClick={() => setDetalleBook(null)}
                  variant="outline"
                  size="md"
                  className="py-2 px-3.5 text-xs font-bold text-gray-700 hover:bg-gray-100 flex items-center gap-1.5 rounded-xl border-gray-300 shadow-2xs"
                >
                  <ArrowLeft size={15} /> Volver al Catálogo
                </Btn>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[10px] text-gray-400 font-bold block uppercase leading-none">Precio</span>
                    <span className="text-xl font-black text-gray-900">{fmt(detalleBook.precio)}</span>
                  </div>

                  {getStockDisponible(detalleBook) > 0 ? (
                    <button
                      type="button"
                      onClick={() => {
                        addToCart(detalleBook, 1);
                        setDetalleBook(null);
                      }}
                      className="py-2 px-4 text-xs font-bold text-black hover:brightness-105 flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                      style={{
                        backgroundColor: "#0db01b",
                        color: "#000000",
                        fontWeight: 700,
                        borderRadius: "4px",
                        fontFamily: "system-ui, sans-serif",
                      }}
                    >
                      <Plus size={14} className="stroke-[2.5] text-black" /> Añadir al Ticket
                    </button>
                  ) : (
                    <span className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-3 py-1.5 rounded-xl">
                      Sin stock disponible
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Modal>
        );
      })()}

      {/* MODAL ENVIAR COTIZACIÓN/TICKET PREVIO POR WHATSAPP */}
      {waModalOpen && (
        <Modal
          title="Enviar Ticket por WhatsApp"
          onClose={() => setWaModalOpen(false)}
          footer={
            <div className="flex justify-end gap-2 w-full">
              <Btn onClick={() => setWaModalOpen(false)} variant="outline">
                Cancelar
              </Btn>
              <Btn
                onClick={() => enviarTicketWhatsApp()}
                variant="primary"
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Send size={14} /> Abrir en WhatsApp
              </Btn>
            </div>
          }
        >
          <div className="space-y-3 py-2 text-xs">
            <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-900">
              <MessageSquare size={24} className="shrink-0 text-emerald-600" />
              <div>
                <p className="font-bold">Compartir Ticket o Cotización Digital</p>
                <p className="text-[11px] text-emerald-800">
                  Ingresa el número telefónico del cliente o déjalo en blanco para abrir WhatsApp Web con el texto preparado.
                </p>
              </div>
            </div>

            <div>
              <label className="font-bold text-gray-700 block mb-1">Número WhatsApp del Cliente (Opcional):</label>
              <div className="flex items-center gap-2">
                <span className="px-3 py-2 bg-gray-100 border border-gray-200 rounded-xl text-xs font-bold text-gray-600">+56</span>
                <input
                  type="text"
                  placeholder="912345678"
                  value={telefonoWa}
                  onChange={e => setTelefonoWa(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-bold outline-none focus:border-emerald-500"
                />
              </div>
              <p className="text-[10px] text-gray-400 mt-1">Ejemplo: 987654321</p>
            </div>

            <div className="p-3 bg-gray-50 border border-gray-200 rounded-2xl text-[11px] font-mono text-gray-700 max-h-36 overflow-y-auto whitespace-pre-wrap">
              {generarTextoTicketWhatsApp({
                detalle: cart.map(item => ({
                  qty: item.qty,
                  titulo: item.book.titulo,
                  subtotal: item.book.precio * item.qty,
                })),
                total,
              })}
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL BOLETA / TICKET CONFIRMADO */}
      {ventaConfirmada && (
        <Modal
          title="Venta Confirmada con Éxito"
          onClose={() => setVentaConfirmada(null)}
          footer={
            <div className="flex flex-wrap justify-between w-full items-center gap-2">
              <div className="flex items-center gap-2">
                <Btn
                  onClick={() => {
                    setTargetVentaWa(ventaConfirmada);
                    setWaModalOpen(true);
                  }}
                  variant="outline"
                  className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                >
                  <MessageSquare size={14} /> WhatsApp
                </Btn>
                <Btn onClick={() => window.print()} variant="outline">
                  <Printer size={14} /> Imprimir Comprobante
                </Btn>
              </div>
              <Btn onClick={() => setVentaConfirmada(null)} variant="primary">
                Aceptar
              </Btn>
            </div>
          }
        >
          <div className="text-center space-y-3 py-2">
            <div className="flex justify-center mb-1">
              <Logo size="md" />
            </div>

            <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 shadow-2xs">
              <CheckCircle2 size={22} />
            </div>

            <div>
              <h2 className="text-base font-extrabold text-gray-900">Comprobante de Venta #{ventaConfirmada.id}</h2>
              <p className="text-xs text-gray-400">
                {ventaConfirmada.fecha} · {ventaConfirmada.hora || ""} · Vendedor: {ventaConfirmada.vendedor}
              </p>
            </div>

            {/* Recibo Formateado con Logo y Tipografía Corporativa */}
            <div id="printable-ticket" className="border border-dashed border-gray-300 rounded-2xl p-5 text-left space-y-3 bg-white text-xs shadow-xs font-sans">
              {/* Header con solo Logo en la esquina izquierda */}
              <div className="flex items-center justify-start pb-2 border-b border-dashed border-gray-300">
                <Logo size="md" className="h-10 w-auto object-contain" />
              </div>

              {/* Información de la Transacción */}
              <div className="py-1 border-b border-dashed border-gray-300 text-[11px] space-y-0.5 text-gray-600 font-medium">
                <div className="flex justify-between">
                  <span className="font-bold text-gray-900">Comprobante N°:</span>
                  <span className="font-mono font-bold text-gray-900">#TRAMA-{ventaConfirmada.id}</span>
                </div>
                <div className="flex justify-between">
                  <span>Fecha y Hora:</span>
                  <span>{ventaConfirmada.fecha} {ventaConfirmada.hora ? `· ${ventaConfirmada.hora}` : ""}</span>
                </div>
                <div className="flex justify-between">
                  <span>Vendedor:</span>
                  <span className="font-semibold text-gray-800">{ventaConfirmada.vendedor}</span>
                </div>
                <div className="flex justify-between">
                  <span>Forma de Pago:</span>
                  <span className="font-bold text-gray-900 uppercase">{ventaConfirmada.metodoPago}</span>
                </div>
              </div>

              {/* Encabezado de Productos */}
              <div className="space-y-2 py-1">
                <div className="grid grid-cols-12 text-[10px] font-extrabold uppercase text-gray-500 border-b border-gray-200 pb-1">
                  <span className="col-span-2 text-center">Cant</span>
                  <span className="col-span-6">Detalle / Libro</span>
                  <span className="col-span-4 text-right">Subtotal</span>
                </div>

                <div className="space-y-1.5 divide-y divide-gray-100">
                  {ventaConfirmada.detalle.map((d, i) => (
                    <div key={i} className="grid grid-cols-12 text-[11px] pt-1 text-gray-800 font-medium items-center">
                      <span className="col-span-2 text-center font-bold font-mono text-gray-900">{d.qty}x</span>
                      <span className="col-span-6 truncate font-semibold text-gray-900 pr-1">{d.titulo}</span>
                      <span className="col-span-4 text-right font-mono font-bold text-gray-900">{fmt(d.subtotal)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totales y Pago */}
              <div className="border-t-2 border-dashed border-gray-300 pt-2.5 space-y-1">
                <div className="flex justify-between text-[11px] text-gray-600">
                  <span>Items Totales:</span>
                  <span className="font-bold text-gray-900">{ventaConfirmada.items} un.</span>
                </div>
                <div className="flex justify-between items-center text-sm font-extrabold pt-1">
                  <span className="text-gray-900">TOTAL PAGADO:</span>
                  <span className="text-base font-black px-2 py-0.5 rounded text-black" style={{ backgroundColor: "#0db01b", color: "#000000" }}>
                    {fmt(ventaConfirmada.total)}
                  </span>
                </div>

                {ventaConfirmada.efectivoEntregado !== undefined && (
                  <div className="pt-1 text-[11px] text-gray-600 space-y-0.5 border-t border-gray-100 mt-1">
                    <div className="flex justify-between">
                      <span>Efectivo Entregado:</span>
                      <span className="font-mono">{fmt(ventaConfirmada.efectivoEntregado)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-emerald-800">
                      <span>Vuelto al Cliente:</span>
                      <span className="font-mono">{fmt(ventaConfirmada.vuelto || 0)}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Mensaje de Agradecimiento & Código de Barras Simulado */}
              <div className="border-t border-dashed border-gray-300 pt-3 text-center space-y-1.5">
                <p className="text-[11px] font-bold text-gray-800">¡Gracias por preferir Trama Librerías!</p>
                <p className="text-[9px] text-gray-400">Conserve este ticket para cambios o devoluciones (30 días)</p>
                
                <div className="pt-2 flex flex-col items-center">
                  {/* Código de barras estilizado */}
                  <div className="tracking-[4px] font-mono text-[14px] text-gray-800 font-extrabold select-none opacity-80">
                    ||| | |||| | ||| |||| || |||
                  </div>
                  <span className="text-[9px] font-mono text-gray-400">TRAMA-{ventaConfirmada.id}</span>
                </div>
              </div>
            </div>

            {/* Enviar WhatsApp Rápido desde la confirmación */}
            <div className="p-3 bg-emerald-50/70 rounded-2xl border border-emerald-200 text-left space-y-2">
              <label className="text-[11px] font-bold text-emerald-900 block flex items-center gap-1.5">
                <MessageSquare size={13} className="text-emerald-600" />
                Enviar este comprobante a WhatsApp del cliente:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Número (ej: 912345678)"
                  value={telefonoWa}
                  onChange={e => setTelefonoWa(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs bg-white border border-emerald-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-200 font-medium"
                />
                <button
                  type="button"
                  onClick={() => enviarTicketWhatsApp(ventaConfirmada)}
                  className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-colors flex items-center gap-1 shrink-0 cursor-pointer shadow-xs"
                >
                  <Send size={12} /> Enviar
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL ESCÁNER CÁMARA */}
      <BarcodeScannerModal
        isOpen={cameraModalOpen}
        onClose={() => setCameraModalOpen(false)}
        books={books}
        onAddToCart={b => addToCart(b, 1)}
      />

      {/* MODAL ETIQUETAS Y CÓDIGOS DE BARRAS */}
      {showEtiquetasModal && (
        <EtiquetasModal
          books={books}
          onClose={() => {
            setShowEtiquetasModal(false);
            if (setActiveSubModal) setActiveSubModal(null);
          }}
        />
      )}

      {/* MODAL CATÁLOGO PÚBLICO PARA CLIENTES */}
      {showCatalogoClienteModal && (
        <ClienteCatalogoModal
          books={books}
          onClose={() => {
            setShowCatalogoClienteModal(false);
            if (setActiveSubModal) setActiveSubModal(null);
          }}
        />
      )}

      {/* MODAL ARQUEO Y CIERRE DE CAJA */}
      {showCajaManagerModal && (
        <CajaManager
          aperturaActiva={aperturaActiva}
          usuarioActual={usuarioActual}
          ventas={ventas}
          gastos={gastos}
          otrosIngresos={otrosIngresos}
          cierresGuardados={cierresGuardados}
          onAbrirCaja={ap => {
            if (onAbrirCaja) onAbrirCaja(ap);
          }}
          onCerrarCaja={cr => {
            if (onCerrarCaja) onCerrarCaja(cr);
          }}
          onClose={() => {
            setShowCajaManagerModal(false);
            if (setActiveSubModal) setActiveSubModal(null);
          }}
        />
      )}

      {/* MODAL LIQUIDACIONES DE CONSIGNACIÓN */}
      {showConsignmentModal && (
        <ConsignmentSettlementModal
          books={books}
          ventas={ventas}
          proveedores={proveedores}
          usuarioActual={usuarioActual}
          liquidacionesGuardadas={liquidacionesGuardadas}
          onSaveLiquidacion={liq => {
            if (onSaveLiquidacion) onSaveLiquidacion(liq);
          }}
          onUpdateEstadoLiquidacion={onUpdateEstadoLiquidacion}
          onClose={() => {
            setShowConsignmentModal(false);
            if (setActiveSubModal) setActiveSubModal(null);
          }}
        />
      )}

      {/* MODAL VENTA FUERA DE CATÁLOGO (CANASTOS, LIBROS USADOS, VARIOS) */}
      {fueraCatalogoModal && (
        <Modal
          title="🧺 Venta Fuera de Catálogo"
          onClose={() => setFueraCatalogoModal(false)}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleAgregarFueraCatalogo} className="p-4 space-y-4">
            <div className="bg-purple-50/80 border border-purple-100 p-3 rounded-xl space-y-1">
              <p className="text-xs font-bold text-purple-950 flex items-center gap-1.5">
                <Tag size={14} className="text-purple-700" />
                <span>Atajos de Venta Rápida (Predefinidos)</span>
              </p>
              <p className="text-[10px] text-purple-800">
                Selecciona una opción para autocompletar el concepto y precio:
              </p>
              <div className="grid grid-cols-2 gap-1.5 pt-1.5">
                {[
                  { label: "🧺 Canasto $1.000", concepto: "Canasto Libro Usado ($1.000)", precio: 1000 },
                  { label: "🧺 Canasto $2.000", concepto: "Canasto Libro Usado ($2.000)", precio: 2000 },
                  { label: "🧺 Canasto $3.000", concepto: "Canasto Libro Usado ($3.000)", precio: 3000 },
                  { label: "📖 Libro Usado Especial", concepto: "Libro Usado Selección", precio: 5000 },
                  { label: "🎨 Fanzines / Varios", concepto: "Fanzines / Stickers / Varios", precio: 1500 },
                  { label: "🛍️ Producto Especial", concepto: "Venta Especial", precio: 0 },
                ].map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setFcConcepto(preset.concepto);
                      setFcPrecio(preset.precio > 0 ? String(preset.precio) : "");
                    }}
                    className="text-left px-2 py-1.5 bg-white border border-purple-200 hover:border-purple-500 hover:bg-purple-100/50 rounded-lg text-[11px] font-bold text-purple-950 transition-all cursor-pointer shadow-2xs flex items-center justify-between"
                  >
                    <span className="truncate">{preset.label}</span>
                    {preset.precio > 0 && <span className="text-[10px] font-extrabold text-purple-700 ml-1">{fmt(preset.precio)}</span>}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-extrabold text-gray-700 mb-1">
                  Concepto o Descripción del Item *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Canasto libro usado, Bolsa de tela, Fanzine..."
                  value={fcConcepto}
                  onChange={e => setFcConcepto(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold bg-white border border-gray-300 rounded-xl outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-extrabold text-gray-700 mb-1">
                    Precio Unitario ($) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="1000"
                    value={fcPrecio}
                    onChange={e => setFcPrecio(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-extrabold bg-white border border-gray-300 rounded-xl outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-gray-700 mb-1">
                    Cantidad
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={fcCantidad}
                    onChange={e => setFcCantidad(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-extrabold bg-white border border-gray-300 rounded-xl outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-200"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <Btn
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setFueraCatalogoModal(false)}
              >
                Cancelar
              </Btn>
              <Btn
                type="submit"
                variant="primary"
                size="sm"
                className="bg-purple-900 text-white font-extrabold hover:bg-purple-950 px-4 cursor-pointer"
              >
                ＋ Agregar al Ticket
              </Btn>
            </div>
          </form>
        </Modal>
      )}
      </div>
    </div>
  );
}

