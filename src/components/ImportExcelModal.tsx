import React, { useState } from "react";
import { FileSpreadsheet, Upload, Download, CheckCircle2, AlertTriangle, X, RefreshCw, Layers, BookOpen, FileCheck } from "lucide-react";
import { Book, LibreriaType, Proveedor } from "../types";
import { Modal, Btn, Badge } from "./ui";
import { parseExcelInventory, downloadExcelTemplate, exportBooksToExcel } from "../utils/excelHelpers";
import { fmt } from "../utils/helpers";

interface ImportExcelModalProps {
  isOpen: boolean;
  onClose: () => void;
  books: Book[];
  setBooks: React.Dispatch<React.SetStateAction<Book[]>>;
  proveedores: Proveedor[];
  registrarMovimiento?: (mov: any) => void;
}

export function ImportExcelModal({
  isOpen,
  onClose,
  books,
  setBooks,
  proveedores,
  registrarMovimiento,
}: ImportExcelModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [parsedItems, setParsedItems] = useState<Partial<Book>[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [totalRows, setTotalRows] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [modoImportacion, setModoImportacion] = useState<"crear" | "actualizar">("crear");
  const [libreriaDestino, setLibreriaDestino] = useState<"excel" | LibreriaType>("excel");
  const [dragOver, setDragOver] = useState(false);
  const [exitoMsg, setExitoMsg] = useState("");

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      processFile(selectedFile);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      processFile(droppedFile);
    }
  };

  const processFile = async (f: File) => {
    setFile(f);
    setLoading(true);
    setErrorMsg("");
    setExitoMsg("");
    setParsedItems([]);
    setWarnings([]);

    try {
      const res = await parseExcelInventory(f, proveedores);
      setParsedItems(res.books);
      setWarnings(res.warnings);
      setTotalRows(res.totalRows);
      if (res.books.length === 0) {
        setErrorMsg("No se pudieron extraer libros válidos del archivo. Asegúrate de incluir encabezados como Título, Autor, Precio, Stock.");
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Error al leer el archivo Excel.");
    } finally {
      setLoading(false);
    }
  };

  const reiniciar = () => {
    setFile(null);
    setParsedItems([]);
    setWarnings([]);
    setErrorMsg("");
    setExitoMsg("");
  };

  const ejecutarImportacion = () => {
    if (parsedItems.length === 0) return;

    let maxId = Math.max(0, ...books.map(b => b.id));
    let agregadosCount = 0;
    let actualizadosCount = 0;

    const nuevosLibros = [...books];

    parsedItems.forEach((p) => {
      const targetLib = libreriaDestino === "excel" ? (p.libreria || "Mar de Dudas") : libreriaDestino;

      if (modoImportacion === "actualizar") {
        // Buscar coincidencia por ISBN o Título exacto
        const indexExistente = nuevosLibros.findIndex(
          b => (p.isbn && b.isbn === p.isbn && b.isbn !== "000-0-00-000000-0") ||
               (b.titulo.toLowerCase().trim() === p.titulo?.toLowerCase().trim())
        );

        if (indexExistente !== -1) {
          // Actualizar datos y sumar stock
          const itemOld = nuevosLibros[indexExistente];
          const stockAdicional = p.stock || 0;
          nuevosLibros[indexExistente] = {
            ...itemOld,
            stock: itemOld.stock + stockAdicional,
            precio: p.precio && p.precio > 0 ? p.precio : itemOld.precio,
            precioCosto: p.precioCosto && p.precioCosto > 0 ? p.precioCosto : itemOld.precioCosto,
            categoria: p.categoria || itemOld.categoria,
            editorial: p.editorial || itemOld.editorial,
            libreria: targetLib,
          };
          actualizadosCount++;

          if (registrarMovimiento && stockAdicional > 0) {
            registrarMovimiento({
              bookId: itemOld.id,
              titulo: itemOld.titulo,
              tipo: "compra",
              cantidad: stockAdicional,
              montoUnit: p.precioCosto || itemOld.precioCosto || 0,
              motivo: `Carga Masiva Excel - Reposición de Stock (${targetLib})`,
            });
          }
          return;
        }
      }

      // Si no existe o modo es crear siempre nuevo
      maxId++;
      const nuevoBook: Book = {
        id: maxId,
        titulo: p.titulo || "Título Desconocido",
        autor: p.autor || "Autor Desconocido",
        editorial: p.editorial || "",
        isbn: p.isbn || `978-956-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(10 + Math.random() * 89)}-${Math.floor(Math.random() * 9)}`,
        categoria: p.categoria || "Novela",
        precio: p.precio || 0,
        precioCosto: p.precioCosto || 0,
        stock: p.stock || 0,
        stockMin: p.stockMin || 3,
        proveedor: p.proveedor || (proveedores[0]?.id || 1),
        tipoAdquisicion: p.tipoAdquisicion || "Compra",
        pagado: true,
        ubicacion: p.ubicacion || "",
        paginas: p.paginas,
        estadoLibro: p.estadoLibro || "Nuevo",
        observaciones: p.observaciones || "",
        libreria: targetLib,
        porcentajeLibreria: 90,
        porcentajeTrama: 10,
      };

      nuevosLibros.unshift(nuevoBook);
      agregadosCount++;

      if (registrarMovimiento && nuevoBook.stock > 0) {
        registrarMovimiento({
          bookId: nuevoBook.id,
          titulo: nuevoBook.titulo,
          tipo: "compra",
          cantidad: nuevoBook.stock,
          montoUnit: nuevoBook.precioCosto,
          motivo: `Alta por Importación Masiva Excel (${targetLib})`,
        });
      }
    });

    setBooks(nuevosLibros);
    setExitoMsg(`¡Importación exitosa! Se procesaron ${parsedItems.length} títulos (${agregadosCount} creados nuevos, ${actualizadosCount} actualizados/sumados).`);

    setTimeout(() => {
      onClose();
      reiniciar();
    }, 2200);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="📥 Carga Masiva de Inventario Vía Excel (.xlsx / .csv)" maxWidth="max-w-4xl">
      <div className="space-y-4">
        {/* DESCARGA DE PLANTILLA & INSTRUCCIONES */}
        <div className="bg-gradient-to-r from-purple-900 to-indigo-900 text-white rounded-xl p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="font-extrabold text-sm flex items-center gap-2">
              <FileSpreadsheet className="text-amber-400 shrink-0" size={18} />
              <span>Plantilla Estándar de Excel para Inventario</span>
            </div>
            <p className="text-xs text-purple-200">
              Descarga la plantilla con encabezados recomendados (Título, Autor, Editorial, ISBN, Precio Venta, Stock, etc.) para asegurar una carga sin errores.
            </p>
          </div>
          <Btn
            onClick={downloadExcelTemplate}
            variant="outline"
            className="bg-white/10 hover:bg-white/20 text-white border-white/20 font-bold text-xs shrink-0 cursor-pointer"
          >
            <Download size={14} className="text-amber-400" /> Descargar Plantilla .xlsx
          </Btn>
        </div>

        {/* MENSAJE DE ÉXITO */}
        {exitoMsg && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
            <span>{exitoMsg}</span>
          </div>
        )}

        {/* MENSAJE DE ERROR */}
        {errorMsg && (
          <div className="p-3.5 bg-red-50 border border-red-200 text-red-800 text-xs font-medium rounded-xl flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertTriangle size={18} className="text-red-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button onClick={reiniciar} className="text-xs text-red-700 underline font-bold cursor-pointer">
              Reintentar
            </button>
          </div>
        )}

        {/* ZONA DE CARGA SI NO HAY ARCHIVO PROCESADO */}
        {parsedItems.length === 0 ? (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
              dragOver ? "border-purple-600 bg-purple-50 scale-[1.01]" : "border-gray-200 bg-gray-50/50 hover:bg-gray-50"
            }`}
          >
            <input
              type="file"
              id="excelInput"
              accept=".xlsx, .xls, .csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <label htmlFor="excelInput" className="cursor-pointer flex flex-col items-center gap-3">
              <div className="w-14 h-14 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center shadow-xs">
                {loading ? <RefreshCw size={26} className="animate-spin text-purple-700" /> : <Upload size={26} />}
              </div>
              <div>
                <span className="text-sm font-extrabold text-gray-900 block">
                  {loading ? "Leyendo archivo Excel..." : "Haz clic para seleccionar tu archivo Excel o arrástralo aquí"}
                </span>
                <span className="text-xs text-gray-500 mt-1 block">
                  Formatos soportados: <strong>.xlsx</strong>, <strong>.xls</strong>, <strong>.csv</strong>
                </span>
              </div>
            </label>
          </div>
        ) : (
          /* VISTA PREVIA Y CONFIGURACIÓN DE IMPORTACIÓN */
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-purple-50 border border-purple-100 rounded-xl p-3">
              <div className="flex items-center gap-2.5">
                <FileCheck size={20} className="text-purple-700 shrink-0" />
                <div>
                  <span className="text-xs font-bold text-purple-950 block">
                    Archivo cargado: {file?.name}
                  </span>
                  <span className="text-[11px] text-purple-700 font-medium">
                    {parsedItems.length} libros válidos detectados de {totalRows} filas.
                  </span>
                </div>
              </div>
              <Btn size="sm" variant="outline" onClick={reiniciar} className="text-xs cursor-pointer">
                <X size={13} /> Cambiar Archivo
              </Btn>
            </div>

            {/* OPCIONES DE CONFIGURACIÓN */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-3.5 rounded-xl border border-gray-100">
              <div>
                <label className="text-xs font-bold text-gray-800 block mb-1">
                  Acción de Importación
                </label>
                <select
                  value={modoImportacion}
                  onChange={(e) => setModoImportacion(e.target.value as any)}
                  className="w-full text-xs border border-gray-200 rounded-lg p-2 bg-gray-50 outline-none font-medium"
                >
                  <option value="crear">➕ Agregar todos como nuevos libros</option>
                  <option value="actualizar">🔄 Actualizar y sumar stock si coincide ISBN/Título</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-800 block mb-1">
                  Librería / Subitem Destino
                </label>
                <select
                  value={libreriaDestino}
                  onChange={(e) => setLibreriaDestino(e.target.value as any)}
                  className="w-full text-xs border border-gray-200 rounded-lg p-2 bg-gray-50 outline-none font-medium"
                >
                  <option value="excel">📄 Usar columna del Excel (o "Mar de Dudas" si no trae)</option>
                  <option value="Mar de Dudas">🟢 Asignar todos a "Mar de Dudas"</option>
                  <option value="Kurripang">🔵 Asignar todos a "Kurripang"</option>
                  <option value="Antro">🟣 Asignar todos a "Antro"</option>
                  <option value="Trama">🟠 Asignar todos a "Trama"</option>
                </select>
              </div>
            </div>

            {/* ADVERTENCIAS SI LAS HAY */}
            {warnings.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-amber-900 text-xs space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-amber-900">
                  <AlertTriangle size={14} className="text-amber-600" />
                  <span>Observaciones detectadas durante la lectura ({warnings.length}):</span>
                </div>
                <ul className="list-disc list-inside text-[11px] text-amber-800 max-h-24 overflow-y-auto space-y-0.5">
                  {warnings.map((w, idx) => (
                    <li key={idx}>{w}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* TABLA PREVIEW */}
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-2xs">
              <div className="px-3.5 py-2.5 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                  <BookOpen size={14} className="text-purple-700" />
                  Vista Previa de Datos a Importar ({parsedItems.length} ítems)
                </span>
              </div>
              <div className="overflow-x-auto max-h-60">
                <table className="w-full text-xs min-w-[650px]">
                  <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 sticky top-0">
                    <tr className="text-left">
                      <th className="px-3 py-2">#</th>
                      <th className="px-3 py-2">Título</th>
                      <th className="px-3 py-2">Autor</th>
                      <th className="px-3 py-2">Editorial</th>
                      <th className="px-3 py-2">ISBN</th>
                      <th className="px-3 py-2">Categoría</th>
                      <th className="px-3 py-2 text-right">Precio Venta</th>
                      <th className="px-3 py-2 text-right">Precio Costo</th>
                      <th className="px-3 py-2 text-center">Stock</th>
                      <th className="px-3 py-2">Librería</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {parsedItems.map((item, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-3 py-2 text-gray-400 text-[10px] font-mono">{idx + 1}</td>
                        <td className="px-3 py-2 font-bold text-gray-900">{item.titulo}</td>
                        <td className="px-3 py-2 text-gray-600">{item.autor}</td>
                        <td className="px-3 py-2 text-gray-500">{item.editorial || "—"}</td>
                        <td className="px-3 py-2 font-mono text-[10px] text-gray-500">{item.isbn}</td>
                        <td className="px-3 py-2">
                          <Badge variant="purple">{item.categoria}</Badge>
                        </td>
                        <td className="px-3 py-2 text-right font-mono font-extrabold text-gray-900">
                          {fmt(item.precio || 0)}
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-gray-600">
                          {fmt(item.precioCosto || 0)}
                        </td>
                        <td className="px-3 py-2 text-center font-mono font-bold text-purple-900">
                          {item.stock} un.
                        </td>
                        <td className="px-3 py-2">
                          <Badge variant="amber">
                            {libreriaDestino === "excel" ? (item.libreria || "Mar de Dudas") : libreriaDestino}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* BOTONES ACCION FINAL */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <Btn variant="outline" onClick={onClose} className="cursor-pointer">
                Cancelar
              </Btn>
              <Btn
                variant="primary"
                onClick={ejecutarImportacion}
                className="bg-amber-400 hover:bg-amber-500 text-purple-950 font-extrabold shadow-md cursor-pointer"
              >
                <CheckCircle2 size={16} /> Confirmar e Importar {parsedItems.length} Libros
              </Btn>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
