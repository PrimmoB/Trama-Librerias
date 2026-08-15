import React, { useState, useMemo } from "react";
import { X, Printer, Barcode, QrCode, Tag, Check, Search, Grid, Plus, Minus, RotateCcw } from "lucide-react";
import { Book } from "../types";
import { fmt } from "../utils/helpers";
import { generateBarcodeSVGString } from "../utils/barcode";

interface EtiquetasModalProps {
  books: Book[];
  onClose: () => void;
}

export function EtiquetasModal({ books, onClose }: EtiquetasModalProps) {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedBookIds, setSelectedBookIds] = useState<{ [id: number]: number }>({});
  
  // Opciones de configuración de plantilla
  const [formato, setFormato] = useState<"rollo" | "a4_24" | "a4_40">("a4_24");
  const [mostrarPrecio, setMostrarPrecio] = useState<boolean>(true);
  const [mostrarBarcode, setMostrarBarcode] = useState<boolean>(true);
  const [mostrarQR, setMostrarQR] = useState<boolean>(false);
  const [mostrarUbicacion, setMostrarUbicacion] = useState<boolean>(true);
  const [mostrarNombreTienda, setMostrarNombreTienda] = useState<boolean>(true);
  const [mostrarCodigoInterno, setMostrarCodigoInterno] = useState<boolean>(true);

  // Filtrar libros por búsqueda
  const booksFiltrados = useMemo(() => {
    if (!searchTerm.trim()) return books;
    const q = searchTerm.toLowerCase();
    return books.filter(
      b =>
        b.titulo.toLowerCase().includes(q) ||
        b.autor.toLowerCase().includes(q) ||
        b.isbn.includes(q) ||
        (b.codigoInterno && b.codigoInterno.toLowerCase().includes(q)) ||
        (b.editorial && b.editorial.toLowerCase().includes(q))
    );
  }, [books, searchTerm]);

  // Actualizar cantidad de etiquetas para un libro
  const updateQty = (id: number, delta: number) => {
    setSelectedBookIds(prev => {
      const current = prev[id] || 0;
      const next = Math.max(0, current + delta);
      if (next === 0) {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      }
      return { ...prev, [id]: next };
    });
  };

  const seleccionarTodos = () => {
    const map: { [id: number]: number } = {};
    booksFiltrados.forEach(b => {
      map[b.id] = 1;
    });
    setSelectedBookIds(map);
  };

  const limpiarSeleccion = () => {
    setSelectedBookIds({});
  };

  // Generar lista final de etiquetas multiplicando por cantidad
  const etiquetasList = useMemo(() => {
    const list: Book[] = [];
    Object.entries(selectedBookIds).forEach(([idStr, qty]) => {
      const count = Number(qty);
      const b = books.find(item => item.id === Number(idStr));
      if (b && count > 0) {
        for (let i = 0; i < count; i++) {
          list.push(b);
        }
      }
    });
    return list;
  }, [selectedBookIds, books]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-5xl my-auto flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* HEADER MODAL */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-gray-900 to-gray-800 text-white flex items-center justify-between shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-xl">
              <Tag size={22} className="text-purple-300" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg tracking-tight">Impresor de Etiquetas y Códigos de Barras</h3>
              <p className="text-xs text-gray-300 font-medium">
                Generador de etiquetas adhesivas para precios, ISBN barcode y exhibidores
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* CONTENIDO DIVIDIDO (SELECCIÓN + PREVIEW) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 print:p-0 print:block">
          
          {/* COLUMNA IZQUIERDA: CONTROLES Y SELECCIÓN DE LIBROS */}
          <div className="lg:col-span-5 space-y-4 print:hidden">
            
            {/* OPCIONES DE PLANTILLA Y DISEÑO */}
            <div className="bg-gray-50 border border-gray-200 p-4 rounded-2xl space-y-3">
              <h4 className="font-extrabold text-xs text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                <Grid size={14} className="text-purple-700" />
                <span>Formato de Plantilla</span>
              </h4>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setFormato("a4_24")}
                  className={`p-2 rounded-xl text-center font-bold text-xs border transition-all cursor-pointer ${
                    formato === "a4_24" ? "bg-purple-900 text-white border-purple-900 shadow-xs" : "bg-white text-gray-700 border-gray-200"
                  }`}
                >
                  Pliego A4 (24)
                </button>
                <button
                  type="button"
                  onClick={() => setFormato("a4_40")}
                  className={`p-2 rounded-xl text-center font-bold text-xs border transition-all cursor-pointer ${
                    formato === "a4_40" ? "bg-purple-900 text-white border-purple-900 shadow-xs" : "bg-white text-gray-700 border-gray-200"
                  }`}
                >
                  Pliego A4 (40)
                </button>
                <button
                  type="button"
                  onClick={() => setFormato("rollo")}
                  className={`p-2 rounded-xl text-center font-bold text-xs border transition-all cursor-pointer ${
                    formato === "rollo" ? "bg-purple-900 text-white border-purple-900 shadow-xs" : "bg-white text-gray-700 border-gray-200"
                  }`}
                >
                  Rollo Térmico
                </button>
              </div>

              {/* TOGGLES DE ELEMENTOS */}
              <div className="pt-2 border-t border-gray-200 grid grid-cols-2 gap-2 text-xs">
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-gray-700">
                  <input type="checkbox" checked={mostrarNombreTienda} onChange={e => setMostrarNombreTienda(e.target.checked)} className="rounded text-purple-700 focus:ring-purple-500" />
                  <span>Marca Trama</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-gray-700">
                  <input type="checkbox" checked={mostrarPrecio} onChange={e => setMostrarPrecio(e.target.checked)} className="rounded text-purple-700 focus:ring-purple-500" />
                  <span>Precio de Venta</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-gray-700">
                  <input type="checkbox" checked={mostrarBarcode} onChange={e => setMostrarBarcode(e.target.checked)} className="rounded text-purple-700 focus:ring-purple-500" />
                  <span>Código de Barras</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-gray-700">
                  <input type="checkbox" checked={mostrarCodigoInterno} onChange={e => setMostrarCodigoInterno(e.target.checked)} className="rounded text-purple-700 focus:ring-purple-500" />
                  <span>Código Interno</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-gray-700 col-span-2">
                  <input type="checkbox" checked={mostrarUbicacion} onChange={e => setMostrarUbicacion(e.target.checked)} className="rounded text-purple-700 focus:ring-purple-500" />
                  <span>Ubicación Estante</span>
                </label>
              </div>
            </div>

            {/* SELECCIÓN DE LIBROS */}
            <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-extrabold text-xs text-gray-900 uppercase tracking-wider">Libros Seleccionados ({etiquetasList.length})</h4>
                <div className="flex items-center gap-2">
                  <button onClick={seleccionarTodos} className="text-[11px] font-extrabold text-purple-800 hover:underline">
                    Elegir Todos
                  </button>
                  <span className="text-gray-300">|</span>
                  <button onClick={limpiarSeleccion} className="text-[11px] font-extrabold text-gray-500 hover:underline">
                    Limpiar
                  </button>
                </div>
              </div>

              {/* BARRA DE BÚSQUEDA */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar título, ISBN o autor..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 text-xs pl-8 pr-3 py-2 rounded-xl focus:bg-white focus:ring-2 focus:ring-purple-500"
                />
                <Search size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
              </div>

              {/* LISTA DE SELECCIÓN DE LIBROS */}
              <div className="max-h-[220px] overflow-y-auto divide-y divide-gray-100 pr-1">
                {booksFiltrados.map(b => {
                  const qty = selectedBookIds[b.id] || 0;
                  return (
                    <div key={b.id} className="py-2 flex items-center justify-between gap-2">
                      <div className="min-w-0 pr-1">
                        <p className="font-bold text-xs text-gray-900 truncate">{b.titulo}</p>
                        <p className="text-[10px] text-gray-400 font-mono">{b.isbn} • {fmt(b.precio)}</p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => updateQty(b.id, -1)}
                          className="p-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 cursor-pointer"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="font-extrabold text-xs w-5 text-center">{qty}</span>
                        <button
                          type="button"
                          onClick={() => updateQty(b.id, 1)}
                          className="p-1 rounded bg-purple-100 hover:bg-purple-200 text-purple-900 cursor-pointer font-bold"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* BOTÓN IMPRIMIR */}
            <button
              onClick={handlePrint}
              disabled={etiquetasList.length === 0}
              className="w-full py-3 bg-purple-900 hover:bg-black text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Printer size={16} />
              <span>Imprimir {etiquetasList.length} Etiquetas</span>
            </button>
          </div>

          {/* COLUMNA DERECHA: HOJA DE PREVISUALIZACIÓN DE ETIQUETAS */}
          <div className="lg:col-span-7 bg-gray-100/80 p-4 rounded-2xl border border-gray-200 min-h-[400px] max-h-[600px] overflow-y-auto print:p-0 print:bg-white print:border-none print:max-h-none">
            {etiquetasList.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 text-gray-400 print:hidden">
                <Barcode size={48} className="mb-2 text-gray-300" />
                <p className="font-bold text-sm text-gray-600">No has seleccionado ninguna etiqueta</p>
                <p className="text-xs text-gray-400">Aumenta la cantidad de los libros de la izquierda para previsualizar.</p>
              </div>
            ) : (
              <div
                className={`bg-white p-4 rounded-xl shadow-md mx-auto print:shadow-none print:p-0 ${
                  formato === "a4_24"
                    ? "grid grid-cols-3 gap-2"
                    : formato === "a4_40"
                    ? "grid grid-cols-4 gap-1.5"
                    : "grid grid-cols-1 gap-3 max-w-[280px]"
                }`}
              >
                {etiquetasList.map((b, idx) => (
                  <div
                    key={idx}
                    className="border border-dashed border-gray-300 p-2 rounded-lg bg-white flex flex-col justify-between text-center overflow-hidden h-[95px] print:border-solid print:border-gray-200 print:h-[90px]"
                  >
                    {mostrarNombreTienda && (
                      <span className="text-[8px] font-black tracking-widest text-purple-900 uppercase block border-b border-gray-100 pb-0.5">
                        Trama Librerías
                      </span>
                    )}

                    <div className="my-auto py-0.5">
                      <p className="font-extrabold text-[10px] text-gray-900 line-clamp-1 leading-tight">{b.titulo}</p>
                      <p className="text-[8px] text-gray-500 truncate">{b.autor}</p>
                      {mostrarCodigoInterno && (
                        <p className="text-[7.5px] font-mono font-bold text-purple-900 truncate">
                          {b.codigoInterno || `COD-${b.id}`}
                        </p>
                      )}
                    </div>

                    {mostrarBarcode && b.isbn && (
                      <div className="w-full max-h-[28px] mx-auto overflow-hidden my-0.5" dangerouslySetInnerHTML={{ __html: generateBarcodeSVGString(b.isbn) }} />
                    )}

                    <div className="flex items-center justify-between pt-0.5 border-t border-gray-100 text-[9px] font-bold">
                      {mostrarUbicacion ? (
                        <span className="text-gray-400 text-[8px] font-mono">{b.ubicacion || "Estante"}</span>
                      ) : <span />}
                      
                      {mostrarPrecio && (
                        <span className="font-black text-xs text-gray-900">{fmt(b.precio)}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
