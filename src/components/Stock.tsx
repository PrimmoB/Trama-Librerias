import React, { useState, useMemo } from "react";
import { Plus, Search, Edit2, Trash2, PackagePlus, AlertTriangle, FileSpreadsheet, ArrowUpDown, Building2, Percent, Package, Key, Lock, Tag, FileText, MapPin, Upload } from "lucide-react";
import { Book, Proveedor, Movimiento, LibreriaType, LibreriaEntry } from "../types";
import { fmt, catEmoji, generarCodigoInterno } from "../utils/helpers";
import { exportBooksToExcel } from "../utils/excelHelpers";
import { ImportExcelModal } from "./ImportExcelModal";
import { StockBadge, CoverBox, PortadaPicker, Modal, Btn, Input, Select, CategoriaMultiSelect } from "./ui";

interface StockProps {
  books: Book[];
  setBooks: React.Dispatch<React.SetStateAction<Book[]>>;
  proveedores: Proveedor[];
  librerias?: LibreriaEntry[];
  registrarMovimiento: (mov: Omit<Movimiento, "id" | "fecha" | "usuario">) => void;
}

export function Stock({ books, setBooks, proveedores, librerias, registrarMovimiento }: StockProps) {
  const [q, setQ] = useState("");
  const [catSel, setCatSel] = useState("Todas");
  const [libreriaFiltro, setLibreriaFiltro] = useState<string>("Todas");
  const [stockFiltro, setStockFiltro] = useState<"todos" | "bajo" | "agotado">("todos");
  const [modalBook, setModalBook] = useState<boolean>(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [modalReponer, setModalReponer] = useState<Book | null>(null);
  const [cantReponer, setCantReponer] = useState("5");
  const [modalImportExcel, setModalImportExcel] = useState<boolean>(false);

  // Estado para Validación de Clave de Acceso de Librería
  const [modalClave, setModalClave] = useState<boolean>(false);
  const [claveInput, setClaveInput] = useState<string>("");
  const [claveError, setClaveError] = useState<string>("");
  const [accionPendiente, setAccionPendiente] = useState<{ tipo: "nuevo" } | { tipo: "editar"; book: Book } | null>(null);

  const emptyForm = {
    titulo: "",
    autor: "",
    isbn: "",
    categoria: "Novela",
    precio: "",
    precioCosto: "",
    stock: "",
    stockTrama: "",
    stockMin: "3",
    proveedor: proveedores[0]?.id || 1,
    tipoAdquisicion: "Compra" as "Compra" | "Concesión" | "Donación" | "Otro",
    pagado: true,
    portada: "",
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
    libreria: "Trama" as LibreriaType,
    porcentajeLibreria: "90",
    porcentajeTrama: "10",
  };

  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");

  const updateForm = (field: string, val: any) => {
    setForm(prev => {
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

  const categorias = useMemo(() => [
    "Todas",
    ...Array.from(
      new Set(
        books.flatMap(b => (b.categoria ? b.categoria.split(",").map(c => c.trim()).filter(Boolean) : []))
      )
    ),
  ], [books]);

  const filtered = useMemo(() => {
    const catSelLower = catSel.toLowerCase();
    const query = q.toLowerCase().trim();

    return books.filter(b => {
      const bookCats = b.categoria ? b.categoria.split(",").map(c => c.trim().toLowerCase()) : [];
      const matchCat = catSel === "Todas" || bookCats.includes(catSelLower);
      const matchLibreria = libreriaFiltro === "Todas" || b.libreria === libreriaFiltro;
      const matchQ =
        !query ||
        b.titulo.toLowerCase().includes(query) ||
        b.autor.toLowerCase().includes(query) ||
        b.isbn.toLowerCase().includes(query) ||
        (b.editorial && b.editorial.toLowerCase().includes(query)) ||
        (b.libreria && b.libreria.toLowerCase().includes(query));

      let matchStock = true;
      if (stockFiltro === "bajo") matchStock = b.stock > 0 && b.stock <= b.stockMin;
      if (stockFiltro === "agotado") matchStock = b.stock === 0;

      return matchCat && matchLibreria && matchQ && matchStock;
    });
  }, [books, catSel, libreriaFiltro, q, stockFiltro]);

  const abrirNuevoBook = () => {
    setEditId(null);
    setForm(emptyForm);
    setError("");
    setModalBook(true);
  };

  const solicitarClave = (accion: { tipo: "nuevo" } | { tipo: "editar"; book: Book }) => {
    if (accion.tipo === "nuevo") {
      abrirNuevoBook();
      return;
    }
    setAccionPendiente(accion);
    setClaveInput("");
    setClaveError("");
    setModalClave(true);
  };

  const verificarClave = () => {
    const inputClean = claveInput.trim();
    if (!inputClean) {
      return setClaveError("Por favor ingresa la Clave de Acceso de la Librería.");
    }

    // Lista de librerías registradas o iniciales
    const libreriasLista = librerias && librerias.length > 0 ? librerias : [
      { id: 1, nombre: "Mar de Dudas", alias: "Mar de Dudas", claveAcceso: "mardedudas123" },
      { id: 2, nombre: "Kurripang", alias: "Kurripang", claveAcceso: "kurripang123" },
      { id: 3, nombre: "Antro", alias: "Antro", claveAcceso: "antro123" },
    ];

    const libEncontrada = libreriasLista.find(l => l.claveAcceso && l.claveAcceso.toLowerCase() === inputClean.toLowerCase());
    const esAdmin = inputClean.toLowerCase() === "admin123" || inputClean.toLowerCase() === "admin";

    if (libEncontrada || esAdmin) {
      setModalClave(false);
      setClaveError("");
      if (accionPendiente?.tipo === "nuevo") {
        setEditId(null);
        setForm({
          ...emptyForm,
          ...(libEncontrada?.alias ? { libreria: libEncontrada.alias as LibreriaType } : {})
        });
        setError("");
        setModalBook(true);
      } else if (accionPendiente?.tipo === "editar") {
        const b = accionPendiente.book;
        setEditId(b.id);
        setForm({
          titulo: b.titulo,
          autor: b.autor,
          isbn: b.isbn,
          categoria: b.categoria,
          precio: String(b.precio),
          precioCosto: String(b.precioCosto || ""),
          stock: String(b.stock),
          stockTrama: String(b.stockTrama || 0),
          stockMin: String(b.stockMin),
          proveedor: b.proveedor,
          tipoAdquisicion: (b.tipoAdquisicion as any) || "Compra",
          pagado: b.pagado ?? true,
          portada: b.portada || "",
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
          libreria: b.libreria || "Mar de Dudas",
          porcentajeLibreria: String(b.porcentajeLibreria ?? 90),
          porcentajeTrama: String(b.porcentajeTrama ?? 10),
        });
        setError("");
        setModalBook(true);
      }
      setAccionPendiente(null);
    } else {
      setClaveError("Clave incorrecta. Verifica la clave de acceso de tu librería o la clave de Administrador.");
    }
  };

  const guardarBook = () => {
    if (!form.titulo.trim()) return setError("El título es obligatorio.");
    if (!form.autor.trim()) return setError("El autor es obligatorio.");
    if (!form.precio || Number(form.precio) <= 0) return setError("Ingresa un precio de venta válido.");

    const pVenta = Number(form.precio);
    const pctLib = Number(form.porcentajeLibreria) ?? 90;
    const pctTrama = Number(form.porcentajeTrama) ?? 10;
    const pCosto = Number(form.precioCosto) || 0;

    if (pVenta > 0 && pCosto > 0) {
      if (pVenta < pCosto) {
        return setError(`El precio de venta (${pVenta}) no puede ser inferior al precio de costo (${pCosto}).`);
      }
    }

    const stockVal = Number(form.stock) || 0;
    const stockTramaVal = Number(form.stockTrama) || 0;
    const stockMinVal = Number(form.stockMin) || 3;

    const bookData = {
      titulo: form.titulo.trim(),
      autor: form.autor.trim(),
      isbn: form.isbn.trim() || "000-0-00-000000-0",
      categoria: form.categoria,
      precio: pVenta,
      precioCosto: pCosto,
      stock: stockVal,
      stockTrama: stockTramaVal,
      stockMin: stockMinVal,
      proveedor: Number(form.proveedor),
      tipoAdquisicion: form.tipoAdquisicion,
      pagado: form.pagado,
      portada: form.portada,
      observaciones: form.observaciones,
      paginas: Number(form.paginas) || undefined,
      tipoPapel: form.tipoPapel,
      tipoPortada: form.tipoPortada,
      editorial: form.editorial.trim(),
      anioLanzamiento: Number(form.anioLanzamiento) || undefined,
      anioProduccion: Number(form.anioProduccion) || undefined,
      estadoLibro: form.estadoLibro,
      alto: Number(form.alto) || undefined,
      ancho: Number(form.ancho) || undefined,
      espesor: Number(form.espesor) || undefined,
      peso: Number(form.peso) || undefined,
      ubicacion: form.ubicacion.trim(),
      codigoInterno: form.codigoInterno || generarCodigoInterno(form.libreria, form.proveedor, form.precio, form.ubicacion),
      libreria: form.libreria,
      porcentajeLibreria: pctLib,
      porcentajeTrama: pctTrama,
    };

    if (editId) {
      setBooks(prev =>
        prev.map(b =>
          b.id === editId
            ? { ...b, ...bookData }
            : b
        )
      );
    } else {
      const newId = Math.max(0, ...books.map(b => b.id)) + 1;
      const newBook: Book = {
        id: newId,
        ...bookData,
        isbn: form.isbn.trim() || `978-956-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(10 + Math.random() * 89)}-${Math.floor(Math.random() * 9)}`,
      };
      setBooks(prev => [newBook, ...prev]);

      registrarMovimiento({
        bookId: newId,
        titulo: newBook.titulo,
        tipo: "compra",
        cantidad: newBook.stock,
        montoUnit: newBook.precioCosto,
        motivo: `Alta por Inventario Propio (${newBook.libreria})`,
      });
    }

    setModalBook(false);
  };

  const eliminarBook = (id: number, titulo: string) => {
    if (window.confirm(`¿Seguro que deseas eliminar "${titulo}" del catálogo?`)) {
      setBooks(prev => prev.filter(b => b.id !== id));
    }
  };

  const confirmarReponer = () => {
    if (!modalReponer) return;
    const addQty = Number(cantReponer);
    if (!addQty || addQty <= 0) return;

    setBooks(prev =>
      prev.map(b => (b.id === modalReponer.id ? { ...b, stock: b.stock + addQty } : b))
    );

    registrarMovimiento({
      bookId: modalReponer.id,
      titulo: modalReponer.titulo,
      tipo: "compra",
      cantidad: addQty,
      montoUnit: modalReponer.precioCosto || 0,
      motivo: "Reposición manual de stock",
    });

    setModalReponer(null);
  };

  const exportarInventario = () => {
    exportBooksToExcel(filtered, `inventario_librerias_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const numCosto = Number(form.precioCosto) || 0;
  const numVenta = Number(form.precio) || 0;
  const margenNum =
    numVenta > 0
      ? numCosto > 0
        ? ((numVenta - numCosto) / numCosto) * 100
        : 100
      : null;
  const margenCalculado = margenNum !== null ? margenNum.toFixed(1) : null;

  return (
    <div className="space-y-4">
      {/* BARRA ACCIONES & FILTROS */}
      <div className="bg-white rounded-xl border border-gray-100 p-3 flex flex-col md:flex-row items-center justify-between gap-3 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar título, autor, ISBN, librería..."
              value={q}
              onChange={e => setQ(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-gray-400"
            />
          </div>

          <select
            value={catSel}
            onChange={e => setCatSel(e.target.value)}
            className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-gray-50 font-medium outline-none focus:border-purple-300"
          >
            <option value="Todas">🏷️ Categoría / Género (Todas)</option>
            {categorias.filter(c => c !== "Todas").map(c => (
              <option key={c} value={c}>
                {catEmoji[c] || "📚"} {c}
              </option>
            ))}
          </select>

          {/* Filtro Subitem Librería */}
          <select
            value={libreriaFiltro}
            onChange={e => setLibreriaFiltro(e.target.value)}
            className="text-xs border border-purple-200 rounded-lg px-2.5 py-1.5 bg-purple-50/50 text-purple-900 font-semibold outline-none"
          >
            <option value="Todas">🏢 Todas las Librerías</option>
            <option value="Trama">🟠 Trama</option>
            <option value="Mar de Dudas">🟢 Mar de Dudas</option>
            <option value="Kurripang">🔵 Kurripang</option>
            <option value="Antro">🟣 Antro</option>
          </select>

          <select
            value={stockFiltro}
            onChange={e => setStockFiltro(e.target.value as any)}
            className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-gray-50 outline-none"
          >
            <option value="todos">Todos los estados</option>
            <option value="bajo">⚠️ Stock bajo</option>
            <option value="agotado">🚫 Agotados</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          <Btn onClick={() => setModalImportExcel(true)} variant="outline" size="sm" className="bg-purple-50 text-purple-900 border-purple-200 hover:bg-purple-100 font-bold cursor-pointer">
            <Upload size={13} className="text-purple-700" /> Cargar Excel
          </Btn>
          <Btn onClick={exportarInventario} variant="outline" size="sm" className="cursor-pointer">
            <FileSpreadsheet size={13} /> Exportar Excel
          </Btn>
          <Btn onClick={abrirNuevoBook} variant="primary" size="sm" className="text-black font-extrabold shadow-sm transition-all cursor-pointer">
            <Plus size={14} className="stroke-[2.5] text-black" /> Nuevo Libro
          </Btn>
        </div>
      </div>

      {/* TABLA DE INVENTARIO */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs min-w-[750px]">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-gray-400 font-medium text-left">
                <th className="px-3 py-2.5">Libro</th>
                <th className="px-3 py-2.5">Editorial / % Ganancia</th>
                <th className="px-3 py-2.5">Ubicación / Año Prod.</th>
                <th className="px-3 py-2.5">Categoría / Género</th>
                <th className="px-3 py-2.5">P. Costo</th>
                <th className="px-3 py-2.5">P. Venta</th>
                <th className="px-3 py-2.5">Stock Local</th>
                <th className="px-3 py-2.5">Stock Trama</th>
                <th className="px-3 py-2.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-gray-400">
                    No hay libros registrados con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filtered.map(b => {
                  const pctLib = b.porcentajeLibreria ?? 30;
                  const pctTr = b.porcentajeTrama ?? 10;

                  return (
                    <tr key={b.id} className="hover:bg-purple-50/30 transition-colors">
                      <td className="px-3 py-2.5 font-medium">
                        <div
                          onClick={() => solicitarClave({ tipo: "editar", book: b })}
                          className="flex items-center gap-3 cursor-pointer group/stockitem"
                          title="Clic para editar este libro (Requiere Clave)"
                        >
                          <div className="relative shrink-0 transition-transform duration-200 group-hover/stockitem:scale-105">
                            <CoverBox book={b} className="w-12 h-16 sm:w-14 sm:h-20 shadow-sm" emojiSize="text-lg" />
                            <div className="absolute inset-0 bg-purple-900/20 rounded-lg opacity-0 group-hover/stockitem:opacity-100 transition-opacity flex items-center justify-center">
                              <span className="bg-white/90 text-purple-900 p-1 rounded-full shadow-xs">
                                <Edit2 size={12} />
                              </span>
                            </div>
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-gray-900 truncate max-w-[200px] group-hover/stockitem:text-purple-700 transition-colors">
                              {b.titulo}
                            </p>
                            <p className="text-gray-500 text-[11px] truncate">
                              {b.autor}{b.editorial ? ` • ${b.editorial}` : ""}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex flex-col items-start gap-0.5">
                          <span className="inline-block text-[10px] px-2.5 py-0.5 rounded-full font-bold border bg-purple-100 text-purple-900 border-purple-200">
                            📖 {b.editorial || "Sin Editorial"}
                          </span>
                          <span className="text-[10px] text-gray-600 font-mono">
                            Ganancia ({pctLib}%): {fmt(Math.round(b.precio * (pctLib / 100)))} | Trama ({pctTr}%): {fmt(Math.round(b.precio * (pctTr / 100)))}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-gray-500 text-[11px]">
                        {b.ubicacion && <div className="font-semibold text-gray-800">{b.ubicacion}</div>}
                        {b.anioProduccion ? (
                          <div className="text-[10px] text-purple-900 font-medium">Año Prod: {b.anioProduccion}</div>
                        ) : null}
                        {!b.ubicacion && !b.anioProduccion && <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="inline-block text-[10px] text-gray-700 bg-gray-100 px-2 py-0.5 rounded-full">
                          {b.categoria}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-gray-500 font-mono">
                        {b.precioCosto !== undefined && b.precioCosto !== null ? fmt(b.precioCosto) : "—"}
                      </td>
                      <td className="px-3 py-2.5 font-bold text-gray-900">
                        <div className="flex items-center gap-1.5">
                          <span>{fmt(b.precio)}</span>
                          {b.precio > 0 && (
                            <span className="text-[9px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-1 py-0.2 rounded font-mono font-bold" title="Margen de Ganancia respecto a Costo / Venta">
                              +{b.precioCosto > 0 ? Math.round(((b.precio - b.precioCosto) / b.precioCosto) * 100) : 100}%
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-1.5">
                          <StockBadge stock={b.stock} min={b.stockMin} />
                          <span className="font-medium text-gray-700">{b.stock}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="inline-block font-extrabold text-purple-900 bg-purple-50 border border-purple-200/80 px-2.5 py-0.5 rounded-full text-[11px]">
                          {b.stockTrama || 0} un.
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setModalReponer(b)}
                            title="Reposición de stock"
                            className="p-1.5 text-gray-500 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                          >
                            <PackagePlus size={15} />
                          </button>
                          <button
                            onClick={() => solicitarClave({ tipo: "editar", book: b })}
                            title="Editar libro (Requiere Clave)"
                            className="p-1.5 text-gray-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            onClick={() => eliminarBook(b.id, b.titulo)}
                            title="Eliminar"
                            className="p-1.5 text-gray-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 size={15} />
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

      {/* MODAL CREAR / EDITAR */}
      {modalBook && (
        <Modal
          title={editId ? "Editar Libro (Inventario Propio)" : "Nuevo Libro (Ingreso por Inventario Propio)"}
          onClose={() => setModalBook(false)}
          maxWidth="max-w-3xl"
          closeOnBackdrop={false}
          hideCloseButton={true}
          footer={
            <>
              <Btn onClick={() => setModalBook(false)}>Cancelar</Btn>
              <Btn onClick={guardarBook} variant="primary">
                Guardar Libro
              </Btn>
            </>
          }
        >
          <div className="space-y-4">
            <div className="bg-purple-50 p-2.5 rounded-xl border border-purple-100 text-xs text-purple-900 flex items-start gap-2">
              <Package size={15} className="text-purple-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">📥 Ingreso e Integración vía Inventario Propio</span>
                <span className="text-[11px] text-purple-800">
                  Todo libro en el Inventario General ingresa primero a través del Inventario Propio de la librería asignada (<strong>{form.libreria}</strong>) y desde allí se gestiona su stock y catálogo.
                </span>
              </div>
            </div>

            {error && <p className="text-xs text-red-600 bg-red-50 p-2 rounded-lg border border-red-100">{error}</p>}

            {/* 1. INFORMACIÓN BIBLIOGRÁFICA */}
            <div className="p-3.5 bg-gray-50/80 rounded-2xl border border-gray-200/80 space-y-3">
              <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
                <span className="w-5 h-5 rounded-full bg-purple-700 text-white text-[11px] font-bold flex items-center justify-center shrink-0">1</span>
                <h4 className="text-xs font-extrabold text-gray-900 uppercase tracking-wider">
                  Información Bibliográfica del Libro
                </h4>
              </div>

              {/* PORTADA Y SINOPSIS DEL LIBRO AL COSTADO */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-stretch">
                <div className="sm:col-span-1">
                  <PortadaPicker
                    value={form.portada}
                    onChange={v => updateForm("portada", v)}
                    placeholderLabel="Portada"
                  />
                </div>
                <div className="sm:col-span-2 flex flex-col h-full">
                  <label className="block text-xs font-bold text-gray-800 mb-1.5">
                    Reseña
                  </label>
                  <textarea
                    value={form.observaciones}
                    onChange={(e) => updateForm("observaciones", e.target.value)}
                    placeholder="Escribe la reseña o presentación del libro que aparecerá en la ficha del catálogo..."
                    className="w-full flex-1 min-h-[140px] p-2.5 text-xs bg-white border border-gray-300 rounded-xl outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 transition-all text-gray-800 resize-none shadow-2xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <Input label="Título *" value={form.titulo} onChange={(e: any) => updateForm("titulo", e.target.value)} placeholder="Ej: Cien años de soledad" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input label="Autor *" value={form.autor} onChange={(e: any) => updateForm("autor", e.target.value)} placeholder="Ej: Gabriel García Márquez" />
                <Input label="Editorial" value={form.editorial} onChange={(e: any) => updateForm("editorial", e.target.value)} placeholder="Ej: Planeta" />
              </div>

              {/* Fila entre Autor y Editorial: Páginas, Tipo de Portada y Código Interno */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Input label="Páginas" type="number" value={form.paginas} onChange={(e: any) => updateForm("paginas", e.target.value)} placeholder="300" />
                <Select label="Tipo de Portada" value={form.tipoPortada} onChange={(e: any) => updateForm("tipoPortada", e.target.value)}>
                  <option value="Tapa blanda">Tapa blanda</option>
                  <option value="Tapa dura">Tapa dura</option>
                  <option value="Bolsillo">Bolsillo</option>
                  <option value="Ebook / Digital">Ebook / Digital</option>
                </Select>
                <div>
                  <Input
                    label="Código Interno"
                    value={form.codigoInterno !== undefined && form.codigoInterno !== "" ? form.codigoInterno : generarCodigoInterno(form.libreria, form.proveedor, form.precio, form.ubicacion)}
                    onChange={(e: any) => updateForm("codigoInterno", e.target.value)}
                    placeholder="Ej: A-001-$12.990-A-1"
                  />
                  <p className="text-[10px] text-gray-500 mt-0.5 font-mono">
                    Librería ({form.libreria ? (form.libreria.toLowerCase().includes("antro") ? "A" : form.libreria.toLowerCase().includes("kurri") ? "K" : form.libreria.toLowerCase().includes("mar") ? "M" : form.libreria.charAt(0)) : "A"}), Prov ({String(form.proveedor || "XXX").padStart(3, "0")}), Precio ({Number(form.precio) > 0 ? `$${Number(form.precio).toLocaleString("es-CL")}` : "$XXX.XXX"}), Ubic ({form.ubicacion || "XX-XX-"})
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Input label="ISBN" value={form.isbn} onChange={(e: any) => updateForm("isbn", e.target.value)} placeholder="978-..." />
                <Select label="Estado *" value={form.estadoLibro} onChange={(e: any) => updateForm("estadoLibro", e.target.value)}>
                  <option value="Nuevo">Nuevo</option>
                  <option value="Segunda Mano">Segunda Mano</option>
                </Select>
                <Input label="Ubicación en tienda" value={form.ubicacion} onChange={(e: any) => updateForm("ubicacion", e.target.value)} placeholder="Ej: Estante A-1" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input label="Año de Edición" type="number" value={form.anioLanzamiento} onChange={(e: any) => updateForm("anioLanzamiento", e.target.value)} placeholder="Ej: 1967" />
                <Input label="Año Producción" type="number" value={form.anioProduccion} onChange={(e: any) => updateForm("anioProduccion", e.target.value)} placeholder="Ej: 2024" />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Input label="Alto (cm)" type="number" step="0.1" value={form.alto} onChange={(e: any) => updateForm("alto", e.target.value)} placeholder="21" />
                <Input label="Ancho (cm)" type="number" step="0.1" value={form.ancho} onChange={(e: any) => updateForm("ancho", e.target.value)} placeholder="14" />
                <Input label="Espesor (mm)" type="number" step="0.1" value={form.espesor} onChange={(e: any) => updateForm("espesor", e.target.value)} placeholder="15" />
                <Input label="Peso (g)" type="number" value={form.peso} onChange={(e: any) => updateForm("peso", e.target.value)} placeholder="350" />
              </div>

              <CategoriaMultiSelect
                value={form.categoria}
                onChange={(v) => updateForm("categoria", v)}
              />
            </div>

            {/* FILA DE PRECIOS */}
            <div className="grid grid-cols-3 gap-3">
              <Input label="Precio Costo ($) (Fijo)" type="number" value={form.precioCosto} onChange={(e: any) => updateForm("precioCosto", e.target.value)} placeholder="7800" />
              <Input label="Precio Venta ($) *" type="number" value={form.precio} onChange={(e: any) => updateForm("precio", e.target.value)} placeholder="12990" />
              <div className="flex flex-col justify-end">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] text-gray-500 font-medium">Margen Estimado</span>
                  <span className="text-[10px] text-gray-400 font-medium">(Mín. 11%)</span>
                </div>
                <span
                  className={`text-xs font-bold px-2 py-2 rounded-lg border text-center transition-colors ${
                    margenNum === null
                      ? "bg-gray-50 border-gray-200 text-gray-400"
                      : margenNum < 11
                      ? "bg-amber-50 border-amber-300 text-amber-800"
                      : "bg-emerald-50 border-emerald-200 text-emerald-800"
                  }`}
                >
                  {margenNum === null
                    ? "—"
                    : margenNum < 11
                    ? `+${margenCalculado}% ⚠️ (Bajo 11%)`
                    : `+${margenCalculado}% ✓`}
                </span>
              </div>
            </div>

            {/* SECCIÓN DESTACADA DE SUBITEM LIBRERÍA & PORCENTAJES (BAJO LA FILA DE PRECIOS) */}
            <div className="p-3 bg-purple-50/50 rounded-xl border border-purple-100 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                  <Building2 size={14} className="text-purple-700" /> Subitem Librería & Porcentajes de Utilidad
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Select
                  label="Subitem Librería *"
                  value={form.libreria}
                  onChange={(e: any) => updateForm("libreria", e.target.value)}
                >
                  <option value="Trama">Trama</option>
                  <option value="Mar de Dudas">Mar de Dudas</option>
                  <option value="Kurripang">Kurripang</option>
                  <option value="Antro">Antro</option>
                </Select>

                <Input
                  label="% Utilidad Trama (sobre Precio Venta)"
                  type="number"
                  min="0"
                  max="100"
                  value={form.porcentajeTrama}
                  onChange={(e: any) => updateForm("porcentajeTrama", e.target.value)}
                  placeholder="10"
                />
              </div>

              {/* RESUMEN DE PORCENTAJES Y MARGEN NETO DESTACADO */}
              {(() => {
                const pctT = Number(form.porcentajeTrama) || 10;
                const cifraT = Math.round(numVenta * (pctT / 100)); // Utilidad Trama (% sobre Precio Venta Final)
                const numBaseMargen = Math.max(0, numVenta - numCosto - cifraT); // Margen Neto = Venta - Costo - Utilidad Trama

                return (
                  <div className="bg-white p-3.5 rounded-xl border border-purple-100 text-xs space-y-3 shadow-2xs">
                    {/* BANDEROLA MARGEN NETO DESTACADO */}
                    <div className="bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 text-white p-3 rounded-xl shadow-sm flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <span className="text-[10px] uppercase font-extrabold tracking-wider text-purple-200 block">
                          MARGEN NETO DESTACADO (Venta - Costo - Trama)
                        </span>
                        <span className="text-xl font-black text-white tracking-tight">{fmt(numBaseMargen)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] font-medium text-purple-100">
                        <span className="bg-white/10 px-2 py-1 rounded-md">Venta: {fmt(numVenta)}</span>
                        <span className="bg-white/10 px-2 py-1 rounded-md">Costo: {fmt(numCosto)}</span>
                        <span className="bg-white/10 px-2 py-1 rounded-md">Trama ({pctT}%): {fmt(cifraT)}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div className="p-2.5 rounded-lg bg-indigo-50/80 border border-indigo-200 flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-indigo-700 block">
                            Utilidad Trama
                          </span>
                          <span className="text-[9px] text-indigo-600/90 font-medium block leading-tight">
                            ({pctT}% sobre Precio Venta Final)
                          </span>
                        </div>
                        <div className="flex items-baseline justify-between mt-1 gap-1">
                          <span className="text-xs font-semibold text-indigo-900">
                            {pctT}%
                          </span>
                          <span className="text-xs font-bold text-indigo-950">
                            {fmt(cifraT)}
                          </span>
                        </div>
                      </div>

                      <div className="p-2.5 rounded-lg bg-emerald-50/80 border border-emerald-200 flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-emerald-700 block">
                            Margen Neto Disponible
                          </span>
                          <span className="text-[9px] text-emerald-600/90 font-medium block leading-tight">
                            (Precio Venta - Precio Costo - Utilidad Trama)
                          </span>
                        </div>
                        <div className="flex items-baseline justify-between mt-1 gap-1">
                          <span className="text-xs font-semibold text-emerald-900">
                            Margen Neto
                          </span>
                          <span className="text-xs font-bold text-emerald-950">
                            {fmt(numBaseMargen)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* CONTROL DE STOCK Y UBICACIÓN EN TIENDA */}
            <div className="p-4 bg-gradient-to-br from-slate-50 via-purple-50/20 to-slate-50 rounded-2xl border border-slate-200/90 space-y-3 shadow-2xs">
              <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-purple-800 text-white text-[11px] font-bold flex items-center justify-center shrink-0 shadow-2xs">2</span>
                  <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Package size={14} className="text-purple-700" /> Control de Stock & Ubicación
                  </h4>
                </div>
                <span className="text-[10px] font-extrabold bg-purple-100 text-purple-900 px-2.5 py-0.5 rounded-full border border-purple-200">
                  Unidades en Inventario
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Input label="Stock Actual *" type="number" value={form.stock} onChange={(e: any) => updateForm("stock", e.target.value)} placeholder="5" />
                <Input label="Stock TRAMA *" type="number" value={form.stockTrama} onChange={(e: any) => updateForm("stockTrama", e.target.value)} placeholder="5" />
                <Input label="Stock Mínimo" type="number" value={form.stockMin} onChange={(e: any) => updateForm("stockMin", e.target.value)} placeholder="3" />
                <Input label="Ubicación" value={form.ubicacion} onChange={(e: any) => updateForm("ubicacion", e.target.value)} placeholder="Ej: Estante A-1" />
              </div>
            </div>

            {/* BANDEROLA RESUMEN Y VALORIZACIÓN DE STOCK ORDENADA POR VALORES Y MÁRGENES */}
            {(() => {
              const stkA = Number(form.stock) || 0;
              const stkT = Number(form.stockTrama) || 0;
              const stkTot = stkA + stkT;
              const prV = Number(form.precio) || 0;
              const prC = Number(form.precioCosto) || 0;
              const pctT = Number(form.porcentajeTrama) || 10;
              const cifraT = Math.round(prV * (pctT / 100)); // Utilidad Trama unitaria
              const numBaseMargenUnit = Math.max(0, prV - prC - cifraT); // Margen Neto Unitario

              // Valores (Valorización)
              const valVentaTotal = stkTot * prV;
              const valCostoTotal = stkTot * prC;
              const valTramaVenta = stkT * prV;
              const valTramaCosto = stkT * prC;

              // Márgenes
              const margenNetoEstTotal = stkTot * numBaseMargenUnit;
              const margenNetoEstTrama = stkT * numBaseMargenUnit;
              const utilidadTotalTramaEst = stkT * cifraT;
              const pctMargenNeto = valVentaTotal > 0 ? ((margenNetoEstTotal / valVentaTotal) * 100).toFixed(1) : "0";

              return (
                <div className="p-3.5 bg-purple-50/70 rounded-xl border border-purple-200/90 space-y-3 text-xs shadow-2xs">
                  <div className="flex items-center justify-between font-extrabold text-purple-950 flex-wrap gap-2 border-b border-purple-100 pb-2">
                    <span className="flex items-center gap-1.5 text-xs uppercase tracking-wide">
                      <Package size={15} className="text-purple-700 shrink-0" /> Resumen de Stock & Cálculo Financiero ({stkTot} un. totales)
                    </span>
                    <span className="text-[11px] bg-purple-100 text-purple-900 px-2.5 py-0.5 rounded-full border border-purple-200">
                      Tienda: {stkA} un. | Trama: {stkT} un.
                    </span>
                  </div>

                  {/* BLOQUE 1: LÍNEA DE VALORES (VALORIZACIÓN DE STOCK) */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wider block">
                      📈 Línea de Valores (Valorización de Inventario)
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div className="bg-white p-2.5 rounded-xl border border-gray-200">
                        <span className="text-[10px] text-gray-500 font-medium block">Valor Stock Total (Venta):</span>
                        <span className="text-sm font-black text-purple-950">{fmt(valVentaTotal)}</span>
                        <span className="text-[9px] text-gray-400 block">({stkTot} un. a p. venta)</span>
                      </div>
                      <div className="bg-white p-2.5 rounded-xl border border-gray-200">
                        <span className="text-[10px] text-gray-500 font-medium block">Valor Stock Total (Costo):</span>
                        <span className="text-sm font-bold text-gray-800">{fmt(valCostoTotal)}</span>
                        <span className="text-[9px] text-gray-400 block">({stkTot} un. a costo)</span>
                      </div>
                      <div className="bg-purple-100/60 p-2.5 rounded-xl border border-purple-200">
                        <span className="text-[10px] text-purple-900 font-bold block">Valor Stock TRAMA (Venta):</span>
                        <span className="text-sm font-black text-purple-900">{fmt(valTramaVenta)}</span>
                        <span className="text-[9px] text-purple-700 block">({stkT} un. en Trama)</span>
                      </div>
                      <div className="bg-purple-50 p-2.5 rounded-xl border border-purple-200">
                        <span className="text-[10px] text-purple-800 font-bold block">Valor Stock TRAMA (Costo):</span>
                        <span className="text-sm font-bold text-purple-900">{fmt(valTramaCosto)}</span>
                        <span className="text-[9px] text-purple-600 block">({stkT} un. a costo)</span>
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
                        <span className="text-[9px] text-amber-700 block">({stkT} un. netas Trama)</span>
                      </div>

                      <div className="bg-indigo-50/90 p-2.5 rounded-xl border border-indigo-200">
                        <span className="text-[10px] text-indigo-900 font-bold block">Utilidad Est. Trama ({pctT}%):</span>
                        <span className="text-sm font-black text-indigo-800">{fmt(utilidadTotalTramaEst)}</span>
                        <span className="text-[9px] text-indigo-700 block">({stkT} un. x {fmt(cifraT)})</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            <div className="grid grid-cols-2 gap-3">
              <Select label="Proveedor" value={form.proveedor} onChange={(e: any) => updateForm("proveedor", e.target.value)}>
                {proveedores.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.nombre}
                  </option>
                ))}
              </Select>

              <Select label="Tipo de Adquisición" value={form.tipoAdquisicion} onChange={(e: any) => updateForm("tipoAdquisicion", e.target.value)}>
                <option value="Compra">Compra</option>
                <option value="Concesión">Concesión</option>
                <option value="Donación">Donación</option>
                <option value="Otro">Otro</option>
              </Select>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL VERIFICACIÓN DE CLAVE DE LIBRERÍA */}
      {modalClave && (
        <Modal
          title="🔒 Verificación de Clave de Librería"
          onClose={() => { setModalClave(false); setAccionPendiente(null); }}
          footer={
            <>
              <Btn onClick={() => { setModalClave(false); setAccionPendiente(null); }}>Cancelar</Btn>
              <Btn onClick={verificarClave} variant="primary" className="bg-purple-700 hover:bg-purple-800">
                Verificar y Continuar
              </Btn>
            </>
          }
        >
          <div className="space-y-4">
            <div className="bg-purple-50 p-3 rounded-xl border border-purple-100 flex items-start gap-2.5 text-xs text-purple-900">
              <Key size={18} className="text-purple-700 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Acceso Protegido por Clave de Librería</p>
                <p className="text-[11px] text-purple-800 leading-relaxed mt-0.5">
                  Para {accionPendiente?.tipo === "nuevo" ? "crear un nuevo libro" : "editar un libro existente"} en el Inventario de Libros, se requiere ingresar la <strong>Clave de Acceso de la Librería</strong> o la clave de Administrador.
                </p>
              </div>
            </div>

            <form onSubmit={e => { e.preventDefault(); verificarClave(); }} className="space-y-3">
              <Input
                label="Clave de Acceso de Librería *"
                type="password"
                value={claveInput}
                onChange={e => setClaveInput(e.target.value)}
                placeholder="Ingresa la clave de acceso de librería..."
                autoFocus
                required
              />

              {claveError && (
                <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-100 font-semibold flex items-center gap-1.5">
                  <AlertTriangle size={14} className="shrink-0" />
                  {claveError}
                </p>
              )}
            </form>
          </div>
        </Modal>
      )}

      {/* MODAL REPONER STOCK */}
      {modalReponer && (
        <Modal
          title={`Reposición de Stock: ${modalReponer.titulo}`}
          onClose={() => setModalReponer(null)}
          footer={
            <>
              <Btn onClick={() => setModalReponer(null)}>Cancelar</Btn>
              <Btn onClick={confirmarReponer} variant="primary">
                Añadir Stock
              </Btn>
            </>
          }
        >
          <div className="space-y-3">
            <p className="text-xs text-gray-600">
              Stock actual: <span className="font-bold">{modalReponer.stock} unidades</span>.
            </p>
            <Input label="Cantidad a sumar *" type="number" min="1" value={cantReponer} onChange={(e: any) => setCantReponer(e.target.value)} />
          </div>
        </Modal>
      )}

      {/* MODAL IMPORTAR EXCEL */}
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

