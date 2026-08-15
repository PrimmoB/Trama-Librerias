import React, { useState, useEffect, useRef } from "react";
import { Search, BookOpen, MapPin, Check, Copy, ShoppingBag, X, Zap, Building2, Tag, ArrowRight } from "lucide-react";
import { Book, LibreriaEntry } from "../types";
import { fmt, catEmoji } from "../utils/helpers";
import { Badge, CoverBox } from "./ui";

interface ConsultaMesonModalProps {
  books: Book[];
  librerias?: LibreriaEntry[];
  onClose: () => void;
  onAddToCart?: (book: Book) => void;
}

export function ConsultaMesonModal({
  books,
  librerias = [],
  onClose,
  onAddToCart,
}: ConsultaMesonModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedId, setCopiedId] = useState<string | number | null>(null);
  const [addedId, setAddedId] = useState<string | number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus al abrir la consulta de mesón
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Filtrado instantáneo
  const filteredBooks = React.useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return books.slice(0, 10); // Mostrar los primeros 10 si no hay búsqueda

    return books.filter((b) => {
      const matchTitle = (b.titulo || "").toLowerCase().includes(q);
      const matchAuthor = (b.autor || "").toLowerCase().includes(q);
      const matchIsbn = (b.isbn || "").toLowerCase().includes(q);
      const matchCat = (b.categoria || "").toLowerCase().includes(q);
      const matchProv = String(b.proveedor || "").toLowerCase().includes(q);
      const matchEditorial = (b.editorial || "").toLowerCase().includes(q);
      const matchUbicacion = (b.ubicacion || "").toLowerCase().includes(q);

      return matchTitle || matchAuthor || matchIsbn || matchCat || matchProv || matchEditorial || matchUbicacion;
    });
  }, [books, searchTerm]);

  const handleCopyFicha = (book: Book) => {
    const text = `📖 *${book.titulo}*\n✍️ Autor: ${book.autor}\n💰 Precio: ${fmt(book.precio)}\n🏷️ ISBN: ${book.isbn}\n📍 Ubicación: ${book.ubicacion || book.categoria}\n✅ Disponibilidad: ${book.stock > 0 ? `${book.stock} unid. en Trama Librerías` : 'Agotado'}`;
    
    navigator.clipboard.writeText(text);
    setCopiedId(book.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAddCart = (book: Book) => {
    if (onAddToCart) {
      onAddToCart(book);
      setAddedId(book.id);
      setTimeout(() => setAddedId(null), 1500);
    }
  };

  return (
    <div className="fixed inset-0 bg-stone-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* ENCABEZADO CONSULTA DE MESÓN */}
        <div className="bg-stone-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-stone-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500 text-stone-950 rounded-2xl shrink-0 font-bold shadow-md">
              <Zap size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white">Consulta Rápidade Mesón</h2>
                <span className="text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Atención Mostrador
                </span>
              </div>
              <p className="text-xs text-stone-300 mt-0.5">
                Búsqueda instantánea de precios, stock, estantería y consignación en librerías
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-white hover:bg-stone-800 rounded-xl transition-all cursor-pointer"
            title="Cerrar (Esc)"
          >
            <X size={20} />
          </button>
        </div>

        {/* BARRA DE BÚSQUEDA MESÓN */}
        <div className="p-4 bg-stone-50 border-b border-stone-200 shrink-0 space-y-2">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-600" size={20} />
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar título, autor, ISBN, editorial, estantería o categoría..."
              className="w-full pl-11 pr-10 py-3.5 bg-white text-stone-900 font-bold text-sm sm:text-base rounded-2xl border-2 border-stone-300 focus:border-amber-600 focus:outline-none focus:ring-4 focus:ring-amber-500/10 shadow-xs placeholder:text-stone-400 placeholder:font-normal"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-1"
              >
                <X size={16} />
              </button>
            )}
          </div>
          
          <div className="flex flex-wrap items-center justify-between text-xs text-stone-500 px-1 pt-1 gap-2">
            <span>
              Mostrando <strong className="text-stone-800">{filteredBooks.length}</strong> {filteredBooks.length === 1 ? 'ejemplar' : 'ejemplares'}
            </span>
            <span className="hidden sm:inline-block text-[11px] text-stone-400 font-mono">
              💡 Presiona <kbd className="px-1.5 py-0.5 bg-stone-200 border border-stone-300 rounded-md font-bold text-stone-700">ESC</kbd> para cerrar
            </span>
          </div>
        </div>

        {/* LISTA DE RESULTADOS MESÓN */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-stone-100/60">
          {filteredBooks.map((book) => {
            const hasStock = book.stock > 0;
            const isLowStock = book.stock > 0 && book.stock <= book.stockMin;

            return (
              <div
                key={book.id}
                className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs hover:border-amber-400 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group"
              >
                {/* PORTADA Y DATOS BÁSICOS */}
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <div className="w-14 h-20 shrink-0 bg-stone-100 rounded-xl overflow-hidden border border-stone-200 flex items-center justify-center shadow-2xs">
                    {book.portada ? (
                      <img src={book.portada} alt={book.titulo} className="w-full h-full object-cover" />
                    ) : (
                      <CoverBox book={book} className="w-full h-full" emojiSize="text-xl" showEffect={false} />
                    )}
                  </div>

                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 border border-stone-200">
                        {catEmoji[book.categoria] || "📚"} {book.categoria}
                      </span>
                      {book.isbn && (
                        <span className="text-[10px] font-mono font-bold text-stone-500 bg-stone-50 px-2 py-0.5 rounded-md border border-stone-200">
                          ISBN: {book.isbn}
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm sm:text-base font-black text-stone-900 group-hover:text-amber-900 transition-colors leading-tight truncate">
                      {book.titulo}
                    </h3>

                    <p className="text-xs font-bold text-stone-600 truncate">
                      ✍️ {book.autor} {book.editorial ? `• Ed. ${book.editorial}` : ''}
                    </p>

                    {/* UBICACIÓN FÍSICA EN TIENDA */}
                    <div className="flex flex-wrap items-center gap-2 pt-0.5 text-[11px] text-stone-500 font-medium">
                      <span className="inline-flex items-center gap-1 text-purple-900 font-bold bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100">
                        <MapPin size={12} className="text-purple-600" />
                        {book.ubicacion || "Estantería Principal"}
                      </span>
                      {book.proveedor && (
                        <span className="text-stone-500">
                          Prov ID: <strong className="text-stone-700">{book.proveedor}</strong>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* PRECIO, STOCK Y ACCIONES MESÓN */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-100 shrink-0 gap-3">
                  <div className="text-left sm:text-right">
                    <p className="text-lg sm:text-xl font-black text-stone-900 tracking-tight">
                      {fmt(book.precio)}
                    </p>

                    <div className="flex items-center sm:justify-end gap-1.5 mt-0.5">
                      {hasStock ? (
                        <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                          isLowStock
                            ? "bg-amber-100 text-amber-900 border border-amber-300"
                            : "bg-emerald-100 text-emerald-900 border border-emerald-300"
                        }`}>
                          ● {book.stock} unidades en Matriz
                        </span>
                      ) : (
                        <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-300">
                          ✕ Agotado en Matriz
                        </span>
                      )}
                    </div>
                  </div>

                  {/* BOTONES DE ACCIÓN RÁPIDA DE MESÓN */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopyFicha(book)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                        copiedId === book.id
                          ? "bg-emerald-600 text-white border-emerald-700"
                          : "bg-stone-100 text-stone-700 hover:bg-stone-200 border-stone-200"
                      }`}
                      title="Copiar resumen para enviar al cliente por WhatsApp"
                    >
                      {copiedId === book.id ? <Check size={14} /> : <Copy size={14} />}
                      <span className="hidden sm:inline">{copiedId === book.id ? "¡Copiado!" : "Copiar Ficha"}</span>
                    </button>

                    {onAddToCart && (
                      <button
                        onClick={() => handleAddCart(book)}
                        disabled={!hasStock}
                        className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
                          addedId === book.id
                            ? "bg-emerald-600 text-white"
                            : hasStock
                            ? "bg-purple-900 hover:bg-purple-950 text-white active:scale-95"
                            : "bg-stone-200 text-stone-400 cursor-not-allowed"
                        }`}
                      >
                        {addedId === book.id ? (
                          <>
                            <Check size={14} />
                            <span>¡Agregado!</span>
                          </>
                        ) : (
                          <>
                            <ShoppingBag size={14} />
                            <span>＋ A Venta</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {filteredBooks.length === 0 && (
            <div className="p-10 text-center bg-white rounded-3xl border border-stone-200 space-y-3">
              <BookOpen size={40} className="mx-auto text-stone-300" />
              <p className="text-sm font-bold text-stone-800">No se encontraron libros que coincidan con "{searchTerm}"</p>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                Verifica el título, autor o ISBN introducido. Puedes registrar nuevos ejemplares desde el módulo de Inventario.
              </p>
            </div>
          )}
        </div>

        {/* PIE DE PÁGINA MESÓN */}
        <div className="p-3.5 bg-stone-900 text-stone-300 border-t border-stone-800 shrink-0 flex items-center justify-between text-xs">
          <span className="flex items-center gap-1.5 font-medium">
            <Building2 size={14} className="text-amber-500" />
            Trama Librerías — Punto de Atención y Consulta de Mesón
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-stone-800 hover:bg-stone-700 text-white font-bold rounded-xl text-xs transition-all cursor-pointer"
          >
            Cerrar Consulta
          </button>
        </div>

      </div>
    </div>
  );
}
