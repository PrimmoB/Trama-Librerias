import React, { useState, useMemo, useEffect } from "react";
import {
  Search,
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  BookOpen,
  LayoutGrid,
  List,
  MessageSquare,
  Share2,
  Send,
  MapPin,
  FileText,
  Info,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Tag,
  Building2,
  Lock,
  X,
  QrCode,
  Download,
  Instagram,
  Phone,
  Mail,
  Sun,
  Moon,
  Truck,
  CreditCard,
  Landmark,
  DollarSign,
  AlertTriangle,
  XCircle,
  Copy,
  Check,
  Sparkles,
  Store,
  ShoppingCart
} from "lucide-react";
import { Book, TramaInfo } from "../types";
import { fmt, catEmoji } from "../utils/helpers";
import { CoverBox, Modal, Btn, Badge } from "./ui";
import { Logo } from "./Logo";

export interface CartItem {
  book: Book;
  qty: number;
}

export interface PublicCatalogProps {
  books: Book[];
  tramaInfo?: TramaInfo;
  onCloseModal?: () => void;
  isEmbeddedModal?: boolean;
  onGoToLogin?: () => void;
}

type ViewMode = "grid" | "list";
type SortOption = "titulo-asc" | "precio-asc" | "precio-desc" | "stock-desc";

function BookDetailGallery({ book }: { book: Book }) {
  return (
    <div className="relative w-full h-[240px] sm:h-[280px] bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden flex items-center justify-center select-none shadow-xs group">
      {book.portada ? (
        <img
          src={book.portada}
          alt={`Portada de ${book.titulo}`}
          className="w-full h-full object-contain p-2"
        />
      ) : (
        <div className="p-2 text-center space-y-1">
          <CoverBox book={book} className="w-36 h-52 mx-auto shadow-none border-none" emojiSize="text-4xl" showEffect={false} />
          <span className="text-[10px] text-slate-400 block font-medium">Portada digital estándar</span>
        </div>
      )}
    </div>
  );
}

export function PublicCatalog({
  books,
  tramaInfo,
  onCloseModal,
  isEmbeddedModal = false,
  onGoToLogin
}: PublicCatalogProps) {
  // Filtros del Catálogo tipo POS
  const [catSel, setCatSel] = useState<string>("Todas");
  const [q, setQ] = useState<string>("");
  const [onlyInStock, setOnlyInStock] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sortBy, setSortBy] = useState<SortOption>("titulo-asc");

  // Libro en detalle para la Ficha del Producto
  const [detalleBook, setDetalleBook] = useState<Book | null>(null);

  // Carrito de Compras
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem("trama_public_cart");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [cartOpen, setCartOpen] = useState<boolean>(false);
  const [couponCode, setCouponCode] = useState<string>("");
  const [couponDiscount, setCouponDiscount] = useState<number>(0);
  const [couponError, setCouponError] = useState<string>("");

  // Formulario del Cliente
  const [clienteNombre, setClienteNombre] = useState<string>("");
  const [clienteTelefono, setClienteTelefono] = useState<string>("");
  const [clienteEmail, setClienteEmail] = useState<string>("");
  const [clienteRut, setClienteRut] = useState<string>("");
  const [metodoEntrega, setMetodoEntrega] = useState<"retiro" | "envio">("retiro");
  const [direccionEnvio, setDireccionEnvio] = useState<string>("");
  const [ciudadEnvio, setCiudadEnvio] = useState<string>("");
  const [formaPago, setFormaPago] = useState<"transferencia" | "webpay" | "presencial" | "mach">("transferencia");
  const [notasPedido, setNotasPedido] = useState<string>("");

  // Modales adicionales
  const [showQrModal, setShowQrModal] = useState<boolean>(false);
  const [showOrderConfirmed, setShowOrderConfirmed] = useState<boolean>(false);
  const [lastOrderDetails, setLastOrderDetails] = useState<any>(null);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // EL CATÁLOGO PÚBLICO SIEMPRE SE MUESTRA EN MODO OSCURO
  useEffect(() => {
    const wasDark = document.documentElement.classList.contains("dark");
    document.documentElement.classList.add("dark");
    return () => {
      if (!wasDark) {
        document.documentElement.classList.remove("dark");
      }
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("trama_public_cart", JSON.stringify(cart));
    } catch (e) {
      console.error(e);
    }
  }, [cart]);

  const info = tramaInfo || {
    nombre: "Trama Librerías",
    rut: "77.654.321-K",
    direccion: "Av. Cartagena 330 interior.",
    ciudad: "Cartagena",
    telefono: "+56 9 6449 0175",
    email: "contacto@tramalibros.cl",
    contacto: "Ventas y Atención al Cliente",
    sitioWeb: "www.tramalibros.cl",
    instagram: "@trama.librerias"
  };

  const whatsappPhoneClean = info.telefono.replace(/[^0-9]/g, "") || "56987654321";
  const instagramHandleClean = (info.instagram || "@trama.librerias").replace(/^@/, "").trim();

  // Categorías de libros dinámicas (idéntico a POS)
  const categorias = useMemo(() => {
    const set = new Set<string>();
    set.add("Todas");
    books.forEach(b => {
      if (b.categoria) {
        b.categoria.split(",").forEach(c => {
          const trimmed = c.trim();
          if (trimmed) set.add(trimmed);
        });
      }
    });
    return Array.from(set);
  }, [books]);

  // Libros filtrados e igualados a POS
  const filteredBooks = useMemo(() => {
    return books
      .filter(b => {
        const totalStock = (b.stock || 0) + (b.stockTrama || 0);
        if (onlyInStock && totalStock <= 0) return false;

        if (catSel !== "Todas") {
          const bookCats = b.categoria ? b.categoria.split(",").map(c => c.trim().toLowerCase()) : [];
          if (!bookCats.includes(catSel.toLowerCase())) return false;
        }

        if (q.trim()) {
          const term = q.toLowerCase();
          const matchTitle = b.titulo.toLowerCase().includes(term);
          const matchAuthor = b.autor.toLowerCase().includes(term);
          const matchIsbn = (b.isbn || "").includes(term);
          const matchEditorial = b.editorial ? b.editorial.toLowerCase().includes(term) : false;
          return matchTitle || matchAuthor || matchIsbn || matchEditorial;
        }

        return true;
      })
      .sort((a, b) => {
        const totalStockA = (a.stock || 0) + (a.stockTrama || 0);
        const totalStockB = (b.stock || 0) + (b.stockTrama || 0);
        if (sortBy === "precio-asc") return a.precio - b.precio;
        if (sortBy === "precio-desc") return b.precio - a.precio;
        if (sortBy === "stock-desc") return totalStockB - totalStockA;
        return a.titulo.localeCompare(b.titulo);
      });
  }, [books, q, catSel, onlyInStock, sortBy]);

  // Funciones de Carrito
  const addToCart = (book: Book, qtyToAdd: number = 1) => {
    const totalStock = (book.stock || 0) + (book.stockTrama || 0);
    setCart(prev => {
      const idx = prev.findIndex(item => item.book.id === book.id);
      if (idx >= 0) {
        const currentQty = prev[idx].qty;
        const maxQty = totalStock > 0 ? totalStock : 99;
        const newQty = Math.min(currentQty + qtyToAdd, maxQty);
        const updated = [...prev];
        updated[idx] = { ...updated[idx], qty: newQty };
        return updated;
      } else {
        const initialQty = Math.min(qtyToAdd, totalStock > 0 ? totalStock : 1);
        return [...prev, { book, qty: initialQty }];
      }
    });
  };

  const updateCartQty = (bookId: number, delta: number) => {
    setCart(prev => {
      return prev
        .map(item => {
          if (item.book.id === bookId) {
            const newQty = item.qty + delta;
            if (newQty <= 0) return null;
            const totalStock = (item.book.stock || 0) + (item.book.stockTrama || 0);
            const maxQty = totalStock > 0 ? totalStock : 99;
            return { ...item, qty: Math.min(newQty, maxQty) };
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const removeFromCart = (bookId: number) => {
    setCart(prev => prev.filter(item => item.book.id !== bookId));
  };

  const cartItemCount = useMemo(() => cart.reduce((acc, i) => acc + i.qty, 0), [cart]);
  const cartSubtotal = useMemo(() => cart.reduce((acc, i) => acc + i.book.precio * i.qty, 0), [cart]);
  const costoEnvio = metodoEntrega === "envio" ? 3500 : 0;
  const descuentoMonto = Math.round(cartSubtotal * couponDiscount);
  const cartTotal = Math.max(0, cartSubtotal - descuentoMonto + costoEnvio);

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError("");
    const code = couponCode.trim().toUpperCase();
    if (!code) return;

    if (code === "TRAMA10" || code === "LIBROS10") {
      setCouponDiscount(0.1);
    } else if (code === "TRAMA20") {
      setCouponDiscount(0.2);
    } else {
      setCouponError("Cupón no válido. Prueba TRAMA10");
      setCouponDiscount(0);
    }
  };

  const handleWhatsAppCheckout = () => {
    if (cart.length === 0) return;
    if (!clienteNombre.trim() || !clienteTelefono.trim()) {
      alert("Por favor ingresa tu Nombre y Teléfono WhatsApp antes de enviar la orden.");
      return;
    }

    const orderId = `TRM-${Math.floor(100000 + Math.random() * 900000)}`;
    const fechaHora = new Date().toLocaleString("es-CL");

    let text = `📚 *NUEVO PEDIDO DE COMPRA - TRAMA LIBRERÍAS*\n`;
    text += `----------------------------------------\n`;
    text += `🔖 *N° Pedido:* ${orderId}\n`;
    text += `📅 *Fecha:* ${fechaHora}\n`;
    text += `👤 *Cliente:* ${clienteNombre.trim()}\n`;
    text += `📞 *WhatsApp:* ${clienteTelefono.trim()}\n`;
    if (clienteEmail.trim()) text += `✉️ *Email:* ${clienteEmail.trim()}\n`;
    if (clienteRut.trim()) text += `🆔 *RUT:* ${clienteRut.trim()}\n`;
    text += `----------------------------------------\n`;
    text += `🚚 *Modalidad:* ${metodoEntrega === "envio" ? "Envío a Domicilio / Regiones" : "Retiro en Tienda"}\n`;
    if (metodoEntrega === "envio") {
      text += `🏠 *Dirección:* ${direccionEnvio.trim() || "A coordinar"}, ${ciudadEnvio.trim() || "Chile"}\n`;
    }
    text += `💳 *Pago:* ${
      formaPago === "transferencia"
        ? "Transferencia Bancaria Directa"
        : formaPago === "webpay"
        ? "WebPay / Tarjeta Débito-Crédito"
        : formaPago === "mach"
        ? "MACH / Pago Móvil"
        : "Pago Presencial al Retirar"
    }\n`;
    text += `----------------------------------------\n`;
    text += `🛒 *DETALLE DE LIBROS:* \n\n`;

    cart.forEach((item, index) => {
      text += `${index + 1}. *${item.book.titulo}*\n`;
      text += `   • Autor: ${item.book.autor}\n`;
      if (item.book.editorial) text += `   • Ed.: ${item.book.editorial}\n`;
      text += `   • Cantidad: ${item.qty} un. × ${fmt(item.book.precio)} = *${fmt(item.book.precio * item.qty)}*\n\n`;
    });

    text += `----------------------------------------\n`;
    text += `💵 *Subtotal:* ${fmt(cartSubtotal)}\n`;
    if (couponDiscount > 0) {
      text += `🎟️ *Descuento Cupón (${couponDiscount * 100}%):* -${fmt(descuentoMonto)}\n`;
    }
    if (metodoEntrega === "envio") {
      text += `🚚 *Envío Estimado:* ${fmt(costoEnvio)}\n`;
    }
    text += `💰 *TOTAL A PAGAR:* *${fmt(cartTotal)}*\n`;
    text += `----------------------------------------\n`;
    if (notasPedido.trim()) {
      text += `📝 *Notas:* ${notasPedido.trim()}\n`;
      text += `----------------------------------------\n`;
    }
    text += `\n*¡Quedo atento a la confirmación de disponibilidad y datos de transferencia!*`;

    const encodedText = encodeURIComponent(text);
    const whatsappUrl = `https://wa.me/${whatsappPhoneClean}?text=${encodedText}`;

    setLastOrderDetails({
      orderId,
      fechaHora,
      clienteNombre,
      clienteTelefono,
      metodoEntrega,
      direccionEnvio,
      formaPago,
      items: [...cart],
      total: cartTotal,
      whatsappUrl
    });

    window.open(whatsappUrl, "_blank");
    setShowOrderConfirmed(true);
    setCartOpen(false);
  };

  const copyCatalogLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className={`min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200 ${isEmbeddedModal ? "p-0" : ""}`}>
      
      {/* HEADER PRINCIPAL IGUAL AL POS Y SISTEMA */}
      <header className="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-xs">
        
        {/* BARRA DE CONTACTO TOPBAR */}
        <div className="bg-purple-950 dark:bg-slate-950 text-purple-100 text-[11px] py-1.5 px-4">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-4 flex-wrap">
              <span className="flex items-center gap-1 font-medium">
                <MapPin size={12} className="text-purple-300" />
                <span>{info.direccion}</span>
              </span>
              <span className="hidden sm:flex items-center gap-1 font-medium">
                <Phone size={12} className="text-emerald-400" />
                <span>{info.telefono}</span>
              </span>
            </div>

            <div className="flex items-center gap-3 ml-auto">
              <span className="text-[10px] text-purple-300 font-extrabold uppercase tracking-wider hidden xs:inline">Conéctate:</span>
              <a
                href={`https://wa.me/${whatsappPhoneClean}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-emerald-400 transition-colors flex items-center gap-1 font-bold"
              >
                <MessageSquare size={13} className="text-emerald-400" />
                <span className="hidden sm:inline">WhatsApp</span>
              </a>
              <a
                href={`https://www.instagram.com/${instagramHandleClean}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-rose-300 transition-colors flex items-center gap-1 font-bold"
              >
                <Instagram size={13} className="text-rose-400" />
                <span className="hidden sm:inline">Instagram</span>
              </a>
            </div>
          </div>
        </div>

        {/* LOGO Y BOTONES SUPERIORES */}
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {(onGoToLogin || onCloseModal) && (
              <button
                onClick={onGoToLogin || onCloseModal}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-stone-950 font-black text-xs rounded-xl transition-all cursor-pointer shadow-sm shrink-0 border border-amber-400"
                title="Volver al Sistema / Pantalla Anterior"
              >
                <ArrowLeft size={16} className="text-stone-950 stroke-[3]" />
                <span>Volver</span>
              </button>
            )}

            <Logo size="md" className="shrink-0" />
            <div className="min-w-0">
              <h1 className="text-sm sm:text-lg font-black tracking-tight text-slate-900 dark:text-white leading-tight flex items-center gap-1.5 truncate">
                <span className="truncate">{info.nombre}</span>
                <span className="text-[10px] bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider hidden sm:inline shrink-0">
                  Catálogo Público 🌐
                </span>
              </h1>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden xs:block font-medium truncate">
                Punto de Venta y Fichas Técnicas de Libros
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              onClick={() => setShowQrModal(true)}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-purple-50 dark:bg-slate-800 text-purple-700 dark:text-purple-300 hover:bg-purple-100 border border-purple-200 dark:border-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
              title="Obtener código QR o enlace del catálogo"
            >
              <QrCode size={15} className="text-purple-600 dark:text-purple-400 shrink-0" />
              <span className="hidden sm:inline">Desplegar QR</span>
            </button>

            <div className="hidden xs:flex items-center gap-1 px-2.5 py-1 bg-purple-950/80 text-purple-200 border border-purple-800 rounded-xl text-xs font-semibold shadow-2xs" title="Catálogo Público presentado en Modo Oscuro">
              <Moon size={14} className="text-purple-400" />
              <span>Modo Oscuro</span>
            </div>

            {onGoToLogin && (
              <button
                onClick={onGoToLogin}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 text-xs font-bold rounded-xl transition-all cursor-pointer shrink-0"
              >
                <Lock size={13} />
                <span>Acceso Sistema</span>
              </button>
            )}

            {isEmbeddedModal && onCloseModal && (
              <button
                onClick={onCloseModal}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            )}

            {/* BOTÓN CARRITO PRINCIPAL `#0db01b` */}
            <button
              onClick={() => setCartOpen(true)}
              className="relative flex items-center gap-2 px-3 py-1.5 text-black font-extrabold rounded-xl transition-all shadow-md cursor-pointer hover:brightness-105"
              style={{ backgroundColor: "#0db01b" }}
            >
              <ShoppingCart size={17} className="text-black shrink-0" />
              <span className="text-xs font-black hidden sm:inline">Ticket</span>
              {cartItemCount > 0 && (
                <span className="bg-black text-white text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[20px] text-center shadow-xs">
                  {cartItemCount}
                </span>
              )}
              {cartSubtotal > 0 && (
                <span className="text-xs font-black text-black hidden md:inline ml-1 border-l border-black/20 pl-2">
                  {fmt(cartSubtotal)}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ÁREA PRINCIPAL CATÁLOGO TIPO POS */}
      <main className="max-w-7xl mx-auto p-3 sm:p-4 flex-1 w-full space-y-3">
        
        {/* PANEL DEL CATÁLOGO (ESTRUCURA E IDÉNTICA A POS.tsx) */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs">
          
          {/* BARRA SUPERIOR DE BÚSQUEDA Y FILTROS TIPO POS */}
          <div className="p-3 border-b border-slate-100 dark:border-slate-800 space-y-2.5 bg-slate-50/50 dark:bg-slate-950/50">
            <div className="flex flex-col sm:flex-row gap-2">
              
              {/* Buscador General POS */}
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar por título, autor, editorial o ISBN..."
                  value={q}
                  onChange={e => setQ(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-500 font-medium text-slate-900 dark:text-white placeholder-slate-400"
                />
                {q && (
                  <button
                    onClick={() => setQ("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-white"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* FILTROS SECUNDARIOS & MODO DE VISTA TIPO POS */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
              
              {/* Desplegable de Categorías */}
              <div className="flex items-center gap-1.5 min-w-[180px]">
                <select
                  value={catSel}
                  onChange={e => setCatSel(e.target.value)}
                  className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-slate-800 dark:text-slate-200 outline-none font-semibold cursor-pointer focus:border-purple-600 shadow-2xs"
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
              <div className="flex items-center gap-2 shrink-0">
                <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer select-none bg-white dark:bg-slate-900 px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={onlyInStock}
                    onChange={e => setOnlyInStock(e.target.checked)}
                    className="rounded text-purple-600 focus:ring-0"
                  />
                  <span>Con Stock</span>
                </label>

                {/* Ordenar */}
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as SortOption)}
                  className="text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1 text-slate-700 dark:text-slate-200 outline-none font-semibold cursor-pointer"
                >
                  <option value="titulo-asc">A-Z Título</option>
                  <option value="precio-asc">Precio: Menor a Mayor</option>
                  <option value="precio-desc">Precio: Mayor a Menor</option>
                  <option value="stock-desc">Mayor Stock</option>
                </select>

                {/* Toggle Vista Grid/List */}
                <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 p-0.5">
                  <button
                    onClick={() => setViewMode("grid")}
                    title="Vista Tarjetas"
                    className={`p-1.5 rounded-lg font-bold transition-all ${viewMode === "grid" ? "text-black" : "text-slate-400 hover:text-slate-700 dark:hover:text-white"}`}
                    style={viewMode === "grid" ? { backgroundColor: "#0db01b", color: "#000000" } : {}}
                  >
                    <LayoutGrid size={14} />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    title="Vista Lista Compacta"
                    className={`p-1.5 rounded-lg font-bold transition-all ${viewMode === "list" ? "text-black" : "text-slate-400 hover:text-slate-700 dark:hover:text-white"}`}
                    style={viewMode === "list" ? { backgroundColor: "#0db01b", color: "#000000" } : {}}
                  >
                    <List size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* HEADER INDICADOR DE RESULTADOS */}
          <div className="px-3.5 py-2 bg-slate-50/80 dark:bg-slate-950/80 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 dark:text-white">{catSel === "Todas" ? "Todo el Catálogo" : catSel}</span>
              <span className="text-[11px] text-slate-400">• {filteredBooks.length} títulos encontrados</span>
            </div>

            {q && (
              <span className="text-[11px] text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded-full font-medium">
                Búsqueda: "{q}"
              </span>
            )}
          </div>

          {/* CATÁLOGO DE LIBROS (GRILLA O LISTA IDÉNTICO A POS.tsx) */}
          <div className="p-3">
            {filteredBooks.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
                <BookOpen size={40} className="text-slate-300 dark:text-slate-700" />
                <p className="font-bold text-slate-700 dark:text-slate-300 text-sm">No se encontraron libros</p>
                <p className="text-slate-400 max-w-xs">Intenta ajustar la búsqueda, filtro de stock o seleccionar otra categoría.</p>
              </div>
            ) : viewMode === "grid" ? (
              /* VISTA DE TARJETAS (GRID TIPO POS) */
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {filteredBooks.map(b => {
                  const inCart = cart.find(ci => ci.book.id === b.id)?.qty || 0;
                  const totalStock = (b.stock || 0) + (b.stockTrama || 0);
                  const sinStock = totalStock <= 0;

                  return (
                    <div
                      key={b.id}
                      onClick={() => setDetalleBook(b)}
                      className={`group relative border rounded-2xl p-3 flex flex-col justify-between transition-all bg-white dark:bg-slate-900 cursor-pointer ${
                        sinStock
                          ? "border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60 opacity-60"
                          : inCart > 0
                          ? "border-slate-900 dark:border-purple-500 ring-1 ring-slate-900 dark:ring-purple-500 shadow-xs"
                          : "border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 hover:shadow-sm"
                      }`}
                    >
                      <div>
                        {/* Portada & Stock Badge */}
                        <div
                          title="Clic para ver ficha del producto"
                          className="relative mb-2 flex items-center justify-center bg-white dark:bg-slate-900 p-0 border-0 shadow-none group/covercontainer cursor-pointer transition-all"
                        >
                          <CoverBox book={b} className="w-20 sm:w-24 h-28 sm:h-34 shadow-none border-none" emojiSize="text-2xl" showEffect={false} />

                          <div className="absolute top-1 right-1 bg-black/70 backdrop-blur-xs text-white text-[9px] font-bold px-2 py-0.5 rounded-full opacity-0 group-hover/covercontainer:opacity-100 transition-opacity pointer-events-none">
                            Ver Ficha
                          </div>
                        </div>

                        {/* Título & Autor */}
                        <div className="group/title">
                          <h4 className="font-extrabold text-xs text-slate-900 dark:text-white line-clamp-2 leading-tight group-hover/title:text-purple-600 transition-colors">
                            {b.titulo}
                          </h4>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">{b.autor}</p>
                        </div>

                        <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                          {b.editorial && (
                            <span className="text-[9px] font-bold text-purple-900 dark:text-purple-300 bg-purple-100/80 dark:bg-purple-950/80 border border-purple-200 dark:border-purple-800 px-1.5 py-0.5 rounded">
                              {b.editorial}
                            </span>
                          )}
                          {b.categoria && (
                            <span className="text-[9px] text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-medium truncate max-w-[100px]">
                              {b.categoria}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Precio & Controles de Carrito `#0db01b` */}
                      <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <span className="font-black text-xs text-slate-900 dark:text-white">{fmt(b.precio)}</span>

                        {sinStock ? (
                          <span className="text-[9px] font-bold text-red-500 bg-red-50 dark:bg-red-950/60 px-2 py-0.5 rounded">Agotado</span>
                        ) : inCart > 0 ? (
                          <div
                            className="flex items-center gap-0.5 text-black font-extrabold text-xs px-1.5 py-0.5 rounded-lg shadow-xs"
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
                            className="inline-flex items-center justify-center gap-1 text-[11px] font-bold text-black hover:brightness-105 active:scale-95 transition-all cursor-pointer px-2.5 py-1 rounded-lg shadow-2xs"
                            style={{
                              backgroundColor: "#0db01b",
                              color: "#000000",
                            }}
                            title="Añadir al carrito"
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
              /* VISTA DE LISTA COMPACTA (LIST TIPO POS) */
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-x-auto bg-white dark:bg-slate-900 shadow-2xs">
                <table className="w-full text-xs text-left border-collapse min-w-[640px]">
                  <thead>
                    <tr className="bg-slate-50/90 dark:bg-slate-950/90 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold text-[11px] uppercase tracking-wider">
                      <th className="px-3.5 py-2.5">Libro</th>
                      <th className="px-3.5 py-2.5">Editorial / Ficha</th>
                      <th className="px-3.5 py-2.5">Categoría</th>
                      <th className="px-3.5 py-2.5 text-center">Stock</th>
                      <th className="px-3.5 py-2.5 text-right">Precio</th>
                      <th className="px-3.5 py-2.5 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredBooks.map(b => {
                      const inCart = cart.find(ci => ci.book.id === b.id)?.qty || 0;
                      const totalStock = (b.stock || 0) + (b.stockTrama || 0);
                      const sinStock = totalStock <= 0;

                      return (
                        <tr key={b.id} className="hover:bg-purple-50/40 dark:hover:bg-purple-950/30 transition-colors">
                          <td className="px-3.5 py-2.5 font-medium min-w-[200px]">
                            <div
                              onClick={() => setDetalleBook(b)}
                              className="flex items-start gap-2.5 cursor-pointer group/listitem"
                              title="Clic para desplegar Ficha del Producto"
                            >
                              <CoverBox book={b} className="w-9 h-12 shrink-0 shadow-2xs" emojiSize="text-[11px]" showEffect={false} />
                              <div className="min-w-0 flex-1">
                                <p className="font-bold text-slate-900 dark:text-white text-xs leading-snug group-hover/listitem:text-purple-600 transition-colors">
                                  {b.titulo}
                                </p>
                                <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium leading-snug mt-0.5">{b.autor}</p>
                                {b.isbn && (
                                  <p className="text-[9px] text-slate-400 font-mono tracking-tight mt-0.5">
                                    ISBN: {b.isbn}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="px-3.5 py-2.5 text-slate-600 dark:text-slate-400 text-[11px] min-w-[130px] align-top">
                            <div className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
                              {b.editorial || "Edición Independiente"}
                            </div>
                            <div className="flex flex-wrap items-center gap-1 mt-1">
                              {(b.anioProduccion || b.anioLanzamiento) && (
                                <span className="text-[9px] font-bold text-purple-900 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/80 border border-purple-200 dark:border-purple-800 px-1.5 py-0.2 rounded">
                                  Año: {b.anioProduccion || b.anioLanzamiento}
                                </span>
                              )}
                              {b.tipoPortada && (
                                <span className="text-[9px] text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded font-medium">
                                  {b.tipoPortada}
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="px-3.5 py-2.5 min-w-[120px] align-top">
                            <span className="inline-block text-[10px] text-purple-900 dark:text-purple-300 bg-purple-100/70 dark:bg-purple-950/80 border border-purple-200 dark:border-purple-800 px-2 py-0.5 rounded-md font-semibold">
                              {b.categoria || "General"}
                            </span>
                          </td>

                          <td className="px-3.5 py-2.5 text-center align-top whitespace-nowrap">
                            {sinStock ? (
                              <span className="inline-block text-[10px] font-bold text-red-700 bg-red-50 dark:bg-red-950/80 border border-red-200 dark:border-red-900 px-2 py-0.5 rounded-full">
                                Agotado
                              </span>
                            ) : (
                              <div className="inline-flex flex-col items-center">
                                <span className="inline-block text-[10px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full">
                                  {totalStock} un.
                                </span>
                                {Boolean(b.stockTrama) && b.stock > 0 && (
                                  <span className="text-[8.5px] text-slate-400 font-medium mt-0.5">
                                    ({b.stock} lib + {b.stockTrama} trama)
                                  </span>
                                )}
                              </div>
                            )}
                          </td>

                          <td className="px-3.5 py-2.5 text-right font-black text-slate-900 dark:text-white text-xs whitespace-nowrap align-top">
                            {fmt(b.precio)}
                          </td>

                          <td className="px-3.5 py-2.5 text-right align-top whitespace-nowrap">
                            {sinStock ? (
                              <span className="text-[10px] text-slate-400 font-bold bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md inline-block">
                                Sin Stock
                              </span>
                            ) : inCart > 0 ? (
                              <div
                                className="inline-flex items-center gap-1 text-black font-extrabold text-xs px-2 py-1 rounded-md shadow-2xs"
                                style={{ backgroundColor: "#0db01b", color: "#000000" }}
                              >
                                <button
                                  type="button"
                                  onClick={e => {
                                    e.stopPropagation();
                                    updateCartQty(b.id, -1);
                                  }}
                                  className="hover:bg-black/15 active:scale-90 p-0.5 rounded transition-all cursor-pointer"
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
                                className="inline-flex items-center justify-center gap-1 text-[11px] font-bold text-black hover:brightness-105 active:scale-95 transition-all cursor-pointer px-2.5 py-1 rounded-md shadow-2xs"
                                style={{ backgroundColor: "#0db01b", color: "#000000" }}
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
      </main>

      {/* FOOTER INFORMATIVO Y REDES SOCIALES */}
      <footer className="mt-8 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-6 px-4 text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Logo size="sm" />
              <span className="font-extrabold text-slate-900 dark:text-white text-sm">{info.nombre}</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Catálogo digital con atención personalizada y despachos a todo Chile.
            </p>
          </div>

          <div className="space-y-1.5">
            <h4 className="font-extrabold text-slate-900 dark:text-white text-xs uppercase tracking-wider">Atención y Despachos</h4>
            <ul className="space-y-1 text-[11px]">
              <li className="flex items-center gap-1.5"><Store size={13} className="text-purple-600" /> Retiro en Tienda: {info.direccion}</li>
              <li className="flex items-center gap-1.5"><Truck size={13} className="text-emerald-600" /> Envíos por BlueExpress .</li>
            </ul>
          </div>

          <div className="space-y-1.5">
            <h4 className="font-extrabold text-slate-900 dark:text-white text-xs uppercase tracking-wider">Formas de Pago Aceptadas</h4>
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-md text-[10px] font-bold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center gap-1">
                <Landmark size={12} className="text-purple-600" /> Transferencia
              </span>
              <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-md text-[10px] font-bold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center gap-1">
                <CreditCard size={12} className="text-blue-600" /> WebPay / Tarjetas
              </span>
              <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-md text-[10px] font-bold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center gap-1">
                <DollarSign size={12} className="text-emerald-600" /> Presencial
              </span>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto border-t border-slate-200 dark:border-slate-800 mt-6 pt-3 text-center text-[10px] text-slate-400">
          © {new Date().getFullYear()} {info.nombre}. Todos los derechos reservados. Catálogo Trama.
        </div>
      </footer>

      {/* MODAL FICHA DEL PRODUCTO IDÉNTICA A POS.tsx */}
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

        const inCart = cart.find(i => i.book.id === detalleBook.id)?.qty || 0;

        return (
          <Modal title="Ficha del Producto" onClose={() => setDetalleBook(null)} maxWidth="max-w-2xl">
            <div className="space-y-2.5 text-slate-900 dark:text-slate-100">
              
              {/* BARRA NAVEGACIÓN CONTIGUA ENTRE PRODUCTOS */}
              <div className="flex items-center justify-between gap-2 p-1.5 px-2.5 bg-purple-50/60 dark:bg-purple-950/40 rounded-xl border border-purple-100 dark:border-purple-900 text-xs">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-slate-700 dark:text-slate-300">Navegación:</span>
                  {catSel !== "Todas" && (
                    <Badge variant="purple" className="text-[10px]">
                      {catEmoji[catSel] || "📚"} {catSel}
                    </Badge>
                  )}
                  <span className="text-slate-600 dark:text-slate-300 font-extrabold font-mono bg-white dark:bg-slate-900 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                    {detalleIndex >= 0 ? `${detalleIndex + 1} de ${totalCount}` : `1 de ${totalCount}`}
                  </span>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={handlePrev}
                    disabled={!hasPrev}
                    title="Anterior"
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-purple-50 disabled:opacity-30 text-slate-700 dark:text-slate-200 text-xs font-semibold cursor-pointer disabled:cursor-not-allowed"
                  >
                    <ChevronLeft size={15} /> <span className="hidden sm:inline">Anterior</span>
                  </button>
                  <button
                    onClick={handleNext}
                    disabled={!hasNext}
                    title="Siguiente"
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-purple-50 disabled:opacity-30 text-slate-700 dark:text-slate-200 text-xs font-semibold cursor-pointer disabled:cursor-not-allowed"
                  >
                    <span className="hidden sm:inline">Siguiente</span> <ChevronRight size={15} />
                  </button>
                </div>
              </div>

              {/* CONTENIDO PRINCIPAL REORDENADO DE LA FICHA TIPO POS */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-start">
                
                {/* PORTADA AGRANDADA */}
                <div className="sm:col-span-5 flex flex-col justify-start">
                  <BookDetailGallery book={detalleBook} />
                </div>

                {/* COLUMNA DERECHA: DATOS DEL LIBRO */}
                <div className="sm:col-span-7 flex flex-col space-y-2 justify-start">
                  <div className="space-y-0.5">
                    <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white leading-tight">{detalleBook.titulo}</h3>
                    <p className="text-purple-800 dark:text-purple-300 font-bold text-xs sm:text-sm">{detalleBook.autor}</p>
                    <div className="flex items-center gap-1 flex-wrap pt-0.5">
                      {detalleBook.editorial && <Badge variant="gray">{detalleBook.editorial}</Badge>}
                      {detalleBook.categoria && <Badge variant="blue">{detalleBook.categoria}</Badge>}
                    </div>
                  </div>

                  {/* GRILLA DE ESPECIFICACIONES TÉCNICAS */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 p-2 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px]">
                    <div>
                      <span className="text-slate-400 block font-medium">Páginas:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{detalleBook.paginas || "N/I"} págs.</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">Año Edición:</span>
                      <span className="font-semibold text-purple-900 dark:text-purple-300">
                        {detalleBook.anioLanzamiento ? `${detalleBook.anioLanzamiento}` : "N/I"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">Portada:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{detalleBook.tipoPortada || "Tapa blanda"}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">Dimensiones:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {detalleBook.alto || detalleBook.ancho || detalleBook.espesor
                          ? `${detalleBook.alto || "—"}×${detalleBook.ancho || "—"} cm (${detalleBook.espesor || "—"} mm)`
                          : "N/I"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">Peso:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {detalleBook.peso ? `${detalleBook.peso} g` : "N/I"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">ISBN:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono text-[10px]">
                        {detalleBook.isbn || "S/N"}
                      </span>
                    </div>
                  </div>

                  {/* RESEÑA O OBSERVACIONES */}
                  <div className="p-2.5 bg-purple-50/70 dark:bg-purple-950/50 rounded-xl border border-purple-100 dark:border-purple-900">
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line max-h-[160px] overflow-y-auto pr-1">
                      {detalleBook.observaciones ? detalleBook.observaciones : "Sin reseña registrada para este título."}
                    </p>
                  </div>
                </div>
              </div>

              {/* PIE DE LA FICHA CON BOTÓN VERDE `#0db01b` */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2">
                <Btn
                  onClick={() => setDetalleBook(null)}
                  variant="outline"
                  size="md"
                  className="py-2 px-3.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5 rounded-xl border-slate-300 dark:border-slate-700"
                >
                  <ArrowLeft size={15} /> Volver al Catálogo
                </Btn>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase leading-none">Precio</span>
                    <span className="text-xl font-black text-slate-900 dark:text-white">{fmt(detalleBook.precio)}</span>
                  </div>

                  {((detalleBook.stock || 0) + (detalleBook.stockTrama || 0)) > 0 ? (
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
                        borderRadius: "8px",
                      }}
                    >
                      <Plus size={14} className="stroke-[2.5] text-black" />
                      <span>{inCart > 0 ? `Añadir Otro (${inCart} en carrito)` : "Añadir al Carrito"}</span>
                    </button>
                  ) : (
                    <span className="text-xs font-bold text-red-600 bg-red-50 dark:bg-red-950/80 border border-red-200 dark:border-red-900 px-3 py-1.5 rounded-xl">
                      Sin stock disponible
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Modal>
        );
      })()}

      {/* MODAL CARRITO Y PEDIDO POR WHATSAPP */}
      {cartOpen && (
        <Modal title="Ticket y Carrito de Compras" onClose={() => setCartOpen(false)} maxWidth="max-w-2xl">
          <div className="space-y-4 text-slate-900 dark:text-slate-100">
            {cart.length === 0 ? (
              <div className="py-8 text-center text-slate-400 space-y-2">
                <ShoppingBag size={40} className="mx-auto text-slate-300 dark:text-slate-700" />
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">El carrito está vacío</p>
                <p className="text-xs">Añade libros desde el catálogo para generar tu orden de compra.</p>
              </div>
            ) : (
              <>
                {/* LISTA DE ITEMS */}
                <div className="max-h-[220px] overflow-y-auto space-y-2 pr-1">
                  {cart.map(item => (
                    <div
                      key={item.book.id}
                      className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-xs"
                    >
                      <div className="flex-1 min-w-0 pr-2">
                        <p className="font-bold text-slate-900 dark:text-white truncate">{item.book.titulo}</p>
                        <p className="text-[11px] text-slate-500">{item.book.autor} • {fmt(item.book.precio)} c/u</p>
                      </div>

                      <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-1">
                        <button
                          onClick={() => updateCartQty(item.book.id, -1)}
                          className="p-1 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="font-extrabold w-5 text-center">{item.qty}</span>
                        <button
                          onClick={() => updateCartQty(item.book.id, 1)}
                          className="p-1 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
                        >
                          <Plus size={12} />
                        </button>
                        <button
                          onClick={() => removeFromCart(item.book.id)}
                          className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-950 rounded ml-1"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>

                      <span className="font-black text-xs text-slate-900 dark:text-white ml-3">
                        {fmt(item.book.precio * item.qty)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* FORMULARIO DE DESPACHO Y PAGO */}
                <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                  <h4 className="font-extrabold text-xs uppercase tracking-wider text-purple-700 dark:text-purple-300">
                    Datos para el Envío de la Orden
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Nombre Completo *"
                      value={clienteNombre}
                      onChange={e => setClienteNombre(e.target.value)}
                      className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl font-medium"
                    />
                    <input
                      type="text"
                      placeholder="Teléfono WhatsApp (Ej: +569...) *"
                      value={clienteTelefono}
                      onChange={e => setClienteTelefono(e.target.value)}
                      className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl font-medium"
                    />
                  </div>

                  {/* MODALIDAD Y FORMA DE PAGO */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Modalidad Entrega</label>
                      <select
                        value={metodoEntrega}
                        onChange={e => setMetodoEntrega(e.target.value as any)}
                        className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl font-bold"
                      >
                        <option value="retiro">Retiro Gratis en Tienda</option>
                        <option value="envio">Envío a Domicilio (+ $3.500 est.)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Forma de Pago</label>
                      <select
                        value={formaPago}
                        onChange={e => setFormaPago(e.target.value as any)}
                        className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl font-bold"
                      >
                        <option value="transferencia">Transferencia Bancaria Directa</option>
                        <option value="webpay">WebPay / Tarjeta Débito-Crédito</option>
                        <option value="mach">MACH / Pago Móvil</option>
                        <option value="presencial">Pago Presencial en Tienda</option>
                      </select>
                    </div>
                  </div>

                  {metodoEntrega === "envio" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Dirección de Envío *"
                        value={direccionEnvio}
                        onChange={e => setDireccionEnvio(e.target.value)}
                        className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl font-medium"
                      />
                      <input
                        type="text"
                        placeholder="Ciudad / Comuna *"
                        value={ciudadEnvio}
                        onChange={e => setCiudadEnvio(e.target.value)}
                        className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl font-medium"
                      />
                    </div>
                  )}

                </div>

                {/* RESUMEN TOTAL Y BOTÓN DE WHATSAPP `#0db01b` */}
                <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Subtotal</span>
                    <span className="font-bold">{fmt(cartSubtotal)}</span>
                  </div>
                  {metodoEntrega === "envio" && (
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>Costo Envío Estimado</span>
                      <span className="font-bold">{fmt(costoEnvio)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-black border-t border-slate-200 dark:border-slate-800 pt-2 text-slate-900 dark:text-white">
                    <span>Total Orden</span>
                    <span className="text-emerald-600 dark:text-emerald-400">{fmt(cartTotal)}</span>
                  </div>

                  <button
                    onClick={handleWhatsAppCheckout}
                    className="w-full py-3 px-4 text-slate-950 font-black text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer hover:brightness-105 mt-2"
                    style={{ backgroundColor: "#0db01b" }}
                  >
                    <MessageSquare size={18} className="fill-slate-950 stroke-none" />
                    <span>Enviar Orden de Compra vía WhatsApp</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </Modal>
      )}

      {/* MODAL ORDEN CONFIRMADA */}
      {showOrderConfirmed && lastOrderDetails && (
        <Modal title="¡Orden de Compra Generada!" onClose={() => setShowOrderConfirmed(false)}>
          <div className="space-y-4 text-center py-2">
            <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-950 rounded-full flex items-center justify-center mx-auto text-emerald-600">
              <CheckCircle2 size={32} />
            </div>
            <div>
              <h3 className="font-black text-lg text-slate-900 dark:text-white">¡Gracias, {lastOrderDetails.clienteNombre}!</h3>
              <p className="text-xs text-slate-500 mt-1">
                Tu orden N° <span className="font-mono font-bold text-purple-700">{lastOrderDetails.orderId}</span> ha sido enviada a nuestro equipo vía WhatsApp.
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-left space-y-1 font-medium">
              <p><span className="text-slate-400">Total:</span> <strong className="text-emerald-600">{fmt(lastOrderDetails.total)}</strong></p>
              <p><span className="text-slate-400">Modalidad:</span> {lastOrderDetails.metodoEntrega === "envio" ? "Envío a Domicilio" : "Retiro en Tienda"}</p>
            </div>

            <a
              href={lastOrderDetails.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 text-slate-950 font-black text-xs rounded-xl shadow-md hover:bg-emerald-600 transition-all cursor-pointer"
            >
              <MessageSquare size={16} /> Reabrir WhatsApp
            </a>
          </div>
        </Modal>
      )}

      {/* MODAL QR Y ENLACE DEL CATÁLOGO */}
      {showQrModal && (
        <Modal title="Desplegar y Compartir Catálogo" onClose={() => setShowQrModal(false)} maxWidth="max-w-md">
          <div className="space-y-4 text-center py-2 text-slate-900 dark:text-slate-100">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 inline-block shadow-md">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(window.location.href)}`}
                alt="Código QR del Catálogo Público"
                className="w-56 h-56 mx-auto rounded-lg object-contain"
              />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium max-w-xs mx-auto">
              Escanea este código QR con la cámara de tu teléfono móvil o comparte el enlace directo para abrir el catálogo público.
            </p>

            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={window.location.href}
                className="flex-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl font-mono text-slate-800 dark:text-slate-200"
              />
              <button
                onClick={copyCatalogLink}
                className="px-3 py-2 bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold rounded-xl flex items-center gap-1 cursor-pointer shrink-0"
              >
                {copiedLink ? <Check size={14} /> : <Copy size={14} />}
                <span>{copiedLink ? "Copiado" : "Copiar"}</span>
              </button>
            </div>

            <div className="pt-2 flex justify-center">
              <a
                href={`https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(window.location.href)}`}
                download="QR_Catalogo_Trama.png"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 transition-all"
              >
                <Download size={14} />
                <span>Descargar Imagen QR</span>
              </a>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
