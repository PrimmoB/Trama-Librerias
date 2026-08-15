import React, { useState, useMemo } from "react";
import { X, Calendar, Download, Printer, CheckCircle2, FileText, Building2, Percent, DollarSign, ArrowRight, RefreshCw, AlertCircle } from "lucide-react";
import { Book, Venta, Proveedor, LiquidacionConsignacion, LiquidacionItem } from "../types";
import { fmt } from "../utils/helpers";

interface ConsignmentSettlementModalProps {
  books: Book[];
  ventas: Venta[];
  proveedores: Proveedor[];
  usuarioActual: string;
  liquidacionesGuardadas: LiquidacionConsignacion[];
  onSaveLiquidacion: (liq: LiquidacionConsignacion) => void;
  onUpdateEstadoLiquidacion?: (id: string, estado: "Pendiente" | "Pagada" | "Anulada") => void;
  onClose: () => void;
}

export function ConsignmentSettlementModal({
  books,
  ventas,
  proveedores,
  usuarioActual,
  liquidacionesGuardadas,
  onSaveLiquidacion,
  onUpdateEstadoLiquidacion,
  onClose,
}: ConsignmentSettlementModalProps) {
  const [activeTab, setActiveTab] = useState<"nueva" | "historial">("nueva");

  // Filtros para nueva liquidación
  const [selectedProveedorId, setSelectedProveedorId] = useState<number | "all">("all");
  const today = new Date();
  const firstDayMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
  const todayStr = today.toISOString().slice(0, 10);

  const [fechaDesde, setFechaDesde] = useState<string>(firstDayMonth);
  const [fechaHasta, setFechaHasta] = useState<string>(todayStr);
  const [comisionDefault, setComisionDefault] = useState<number>(30); // 30% por defecto para la librería
  const [observaciones, setObservaciones] = useState<string>("");
  const [liquidacionVisual, setLiquidacionVisual] = useState<LiquidacionConsignacion | null>(null);

  // Filtrar ventas dentro del rango de fechas que no estén anuladas
  const ventasEnRango = useMemo(() => {
    return ventas.filter(v => {
      if (v.estado === "anulado") return false;
      return v.fecha >= fechaDesde && v.fecha <= fechaHasta;
    });
  }, [ventas, fechaDesde, fechaHasta]);

  // Proveedores que entregan en Consignación / Concesión
  const proveedoresConsignacion = useMemo(() => {
    return proveedores.filter(p => p.activo);
  }, [proveedores]);

  // Generar preview de liquidación para el proveedor seleccionado
  const previewData = useMemo(() => {
    // Buscar todos los libros del catálogo asociados al proveedor o de tipo "Concesión"
    const mapLibroVendidos: { [bookId: number]: { qty: number; totalGross: number } } = {};

    ventasEnRango.forEach(v => {
      (v.detalle || []).forEach(d => {
        if (!mapLibroVendidos[d.id]) {
          mapLibroVendidos[d.id] = { qty: 0, totalGross: 0 };
        }
        mapLibroVendidos[d.id].qty += d.qty;
        mapLibroVendidos[d.id].totalGross += d.subtotal;
      });
    });

    const items: LiquidacionItem[] = [];

    books.forEach(b => {
      const vend = mapLibroVendidos[b.id];
      if (!vend || vend.qty <= 0) return;

      // Verificar si corresponde al proveedor seleccionado
      const esProveedorMatch =
        selectedProveedorId === "all" || b.proveedor === selectedProveedorId;

      // Debe ser de tipo concesión/consignación o pertenecer al proveedor
      const esConsignacion =
        b.tipoAdquisicion === "Concesión" ||
        b.tipoAdquisicion === "Consignación" ||
        selectedProveedorId !== "all";

      if (esProveedorMatch && esConsignacion) {
        const porcentajeComision = b.porcentajeLibreria || comisionDefault;
        const totalVentaGross = vend.totalGross;
        const montoComisionLibreria = Math.round(totalVentaGross * (porcentajeComision / 100));
        const montoAPagarProveedor = totalVentaGross - montoComisionLibreria;

        items.push({
          bookId: b.id,
          titulo: b.titulo,
          isbn: b.isbn,
          editorial: b.editorial,
          unidadesVendidas: vend.qty,
          precioVenta: b.precio,
          precioCosto: b.precioCosto || 0,
          porcentajeComision,
          totalVentaGross,
          montoComisionLibreria,
          montoAPagarProveedor,
        });
      }
    });

    const totalUnidadesVendidas = items.reduce((acc, i) => acc + i.unidadesVendidas, 0);
    const totalVentaGross = items.reduce((acc, i) => acc + i.totalVentaGross, 0);
    const totalComisionLibreria = items.reduce((acc, i) => acc + i.montoComisionLibreria, 0);
    const totalAPagarProveedor = items.reduce((acc, i) => acc + i.montoAPagarProveedor, 0);

    const provObj = proveedores.find(p => p.id === selectedProveedorId);

    return {
      items,
      totalUnidadesVendidas,
      totalVentaGross,
      totalComisionLibreria,
      totalAPagarProveedor,
      proveedorNombre: provObj ? provObj.nombre : selectedProveedorId === "all" ? "Todos los Proveedores" : "Editorial / Proveedor",
      rutProveedor: provObj?.rut || "",
    };
  }, [books, ventasEnRango, selectedProveedorId, proveedores, comisionDefault]);

  // Guardar nueva liquidación
  const handleGuardarLiquidacion = () => {
    if (previewData.items.length === 0) {
      alert("No hay ventas registradas en el período seleccionado para este proveedor.");
      return;
    }

    const provObj = proveedores.find(p => p.id === selectedProveedorId);
    const provIdNum = typeof selectedProveedorId === "number" ? selectedProveedorId : 0;

    const nuevaLiq: LiquidacionConsignacion = {
      id: `LIQ-${Date.now().toString().slice(-6)}`,
      proveedorId: provIdNum,
      proveedorNombre: previewData.proveedorNombre,
      rutProveedor: previewData.rutProveedor,
      fechaDesde,
      fechaHasta,
      fechaGeneracion: new Date().toISOString().slice(0, 10),
      registradoPor: usuarioActual || "Sistema",
      items: previewData.items,
      totalUnidadesVendidas: previewData.totalUnidadesVendidas,
      totalVentaGross: previewData.totalVentaGross,
      totalComisionLibreria: previewData.totalComisionLibreria,
      totalAPagarProveedor: previewData.totalAPagarProveedor,
      estado: "Pendiente",
      observaciones: observaciones || "Liquidación automática de consignación.",
    };

    onSaveLiquidacion(nuevaLiq);
    setLiquidacionVisual(nuevaLiq);
    alert(`Liquidación ${nuevaLiq.id} generada y guardada correctamente.`);
  };

  const handlePrintOrExportPDF = (liq: LiquidacionConsignacion) => {
    window.print();
  };

  const handleExportCSV = (liq: LiquidacionConsignacion) => {
    const headers = ["ISBN", "Titulo", "Editorial", "Unidades Vendidas", "Precio Venta", "Venta Total", "% Comisión", "Comisión Librería", "Monto a Pagar Editorial"];
    const rows = liq.items.map(i => [
      `"${i.isbn}"`,
      `"${i.titulo.replace(/"/g, '""')}"`,
      `"${(i.editorial || "").replace(/"/g, '""')}"`,
      i.unidadesVendidas,
      i.precioVenta,
      i.totalVentaGross,
      `${i.porcentajeComision}%`,
      i.montoComisionLibreria,
      i.montoAPagarProveedor,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Liquidacion_${liq.proveedorNombre.replace(/\s+/g, "_")}_${liq.id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-5xl my-auto flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* HEADER MODAL */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-purple-900 to-indigo-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-xl">
              <Building2 size={22} className="text-purple-200" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg tracking-tight">Liquidaciones en Consignación</h3>
              <p className="text-xs text-purple-200 font-medium">
                Cierre automático de ventas, comisiones e importe neto a pagar a editoriales y proveedores
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* TABS DE NAVEGACIÓN */}
        <div className="flex border-b border-gray-200 bg-gray-50 px-4 pt-3 shrink-0">
          <button
            onClick={() => setActiveTab("nueva")}
            className={`px-4 py-2.5 font-extrabold text-xs rounded-t-xl transition-all cursor-pointer ${
              activeTab === "nueva"
                ? "bg-white text-purple-900 border-t-2 border-purple-700 shadow-2xs"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            ➕ Generar Nueva Liquidación
          </button>
          <button
            onClick={() => setActiveTab("historial")}
            className={`px-4 py-2.5 font-extrabold text-xs rounded-t-xl transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "historial"
                ? "bg-white text-purple-900 border-t-2 border-purple-700 shadow-2xs"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            <span>📜 Historial Guardado</span>
            <span className="bg-purple-100 text-purple-800 text-[10px] px-2 py-0.5 rounded-full font-bold">
              {liquidacionesGuardadas.length}
            </span>
          </button>
        </div>

        {/* CONTENIDO PRINCIPAL TAB NUEVA */}
        {activeTab === "nueva" && (
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5">
            {/* PANEL DE FILTROS */}
            <div className="bg-purple-50/50 border border-purple-100 p-4 rounded-xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">Editorial / Proveedor</label>
                <select
                  value={selectedProveedorId}
                  onChange={e => setSelectedProveedorId(e.target.value === "all" ? "all" : Number(e.target.value))}
                  className="w-full bg-white border border-gray-300 text-xs font-semibold rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-purple-500"
                >
                  <option value="all">📦 Todos los proveedores en Consignación</option>
                  {proveedoresConsignacion.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.nombre} {p.rut ? `(${p.rut})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">Fecha Inicial (Desde)</label>
                <input
                  type="date"
                  value={fechaDesde}
                  onChange={e => setFechaDesde(e.target.value)}
                  className="w-full bg-white border border-gray-300 text-xs font-semibold rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">Fecha Final (Hasta)</label>
                <input
                  type="date"
                  value={fechaHasta}
                  onChange={e => setFechaHasta(e.target.value)}
                  className="w-full bg-white border border-gray-300 text-xs font-semibold rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">% Comisión Base Librería</label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={comisionDefault}
                    onChange={e => setComisionDefault(Number(e.target.value))}
                    className="w-full bg-white border border-gray-300 text-xs font-bold rounded-lg pl-3 pr-7 py-2 text-gray-900 focus:ring-2 focus:ring-purple-500"
                  />
                  <Percent size={13} className="absolute right-2.5 top-2.5 text-gray-400" />
                </div>
              </div>
            </div>

            {/* TARJETAS RESUMEN DE LA PREVISUALIZACIÓN */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">Ejemplares Vendidos</span>
                <span className="text-xl font-black text-gray-900">{previewData.totalUnidadesVendidas} uds</span>
              </div>
              <div className="bg-emerald-50 p-3.5 rounded-xl border border-emerald-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">Ventas Brutas Totales</span>
                <span className="text-xl font-black text-emerald-900">{fmt(previewData.totalVentaGross)}</span>
              </div>
              <div className="bg-purple-50 p-3.5 rounded-xl border border-purple-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-800 block">Comisión Librería ({comisionDefault}%)</span>
                <span className="text-xl font-black text-purple-900">{fmt(previewData.totalComisionLibreria)}</span>
              </div>
              <div className="bg-indigo-600 text-white p-3.5 rounded-xl shadow-md">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-200 block">Liquidez a Pagar Editorial</span>
                <span className="text-2xl font-black text-white">{fmt(previewData.totalAPagarProveedor)}</span>
              </div>
            </div>

            {/* TABLA DE DETALLE DE LIBROS EN LIQUIDACIÓN */}
            <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
              <div className="bg-gray-100 px-4 py-2.5 border-b border-gray-200 flex items-center justify-between">
                <h4 className="font-extrabold text-xs text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText size={14} className="text-purple-700" />
                  <span>Detalle de Títulos Vendidos en el Período</span>
                </h4>
                <span className="text-xs text-gray-500 font-semibold">{previewData.items.length} registros encontrados</span>
              </div>

              {previewData.items.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  <AlertCircle size={32} className="mx-auto mb-2 text-gray-300" />
                  <p className="font-bold text-sm text-gray-600">No hay ventas registradas en concesión para estas fechas</p>
                  <p className="text-xs text-gray-400 mt-1">Prueba seleccionando otro rango de fechas o proveedor.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-gray-50 text-gray-500 font-bold uppercase text-[10px] border-b border-gray-200">
                        <th className="p-2.5">Título / ISBN</th>
                        <th className="p-2.5">Editorial</th>
                        <th className="p-2.5 text-center">Cant.</th>
                        <th className="p-2.5 text-right">Precio Venta</th>
                        <th className="p-2.5 text-right">Venta Bruta</th>
                        <th className="p-2.5 text-center">% Com.</th>
                        <th className="p-2.5 text-right">Comisión</th>
                        <th className="p-2.5 text-right font-black text-gray-900">Neto a Pagar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-medium">
                      {previewData.items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-purple-50/30 transition-colors">
                          <td className="p-2.5">
                            <p className="font-bold text-gray-900 leading-tight">{item.titulo}</p>
                            <p className="text-[10px] font-mono text-gray-400">{item.isbn}</p>
                          </td>
                          <td className="p-2.5 text-gray-600">{item.editorial || "—"}</td>
                          <td className="p-2.5 text-center font-bold bg-gray-50/50">{item.unidadesVendidas}</td>
                          <td className="p-2.5 text-right text-gray-700">{fmt(item.precioVenta)}</td>
                          <td className="p-2.5 text-right font-bold text-emerald-700">{fmt(item.totalVentaGross)}</td>
                          <td className="p-2.5 text-center font-bold text-purple-700">{item.porcentajeComision}%</td>
                          <td className="p-2.5 text-right text-purple-800 font-semibold">{fmt(item.montoComisionLibreria)}</td>
                          <td className="p-2.5 text-right font-black text-indigo-900 bg-indigo-50/40">{fmt(item.montoAPagarProveedor)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* OBSERVACIONES Y ACCIONES */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <div className="w-full sm:w-1/2">
                <input
                  type="text"
                  placeholder="Observaciones o nota de pago (ej: Ficha enviada por correo el 05/08)..."
                  value={observaciones}
                  onChange={e => setObservaciones(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 text-xs px-3 py-2 rounded-xl focus:bg-white"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={handleGuardarLiquidacion}
                  disabled={previewData.items.length === 0}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-800 to-indigo-800 hover:from-purple-900 hover:to-indigo-900 text-white font-extrabold text-xs rounded-xl shadow-md active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                >
                  <CheckCircle2 size={16} />
                  <span>Guardar Ficha de Liquidación</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CONTENIDO TAB HISTORIAL */}
        {activeTab === "historial" && (
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
            {liquidacionesGuardadas.length === 0 ? (
              <div className="p-12 text-center text-gray-400">
                <FileText size={40} className="mx-auto mb-2 text-gray-300" />
                <p className="font-bold text-base text-gray-600">No hay liquidaciones guardadas todavía</p>
                <p className="text-xs text-gray-400 mt-1">Genera tu primera liquidación en la pestaña "Generar Nueva Liquidación".</p>
              </div>
            ) : (
              <div className="space-y-3">
                {liquidacionesGuardadas.map(liq => (
                  <div key={liq.id} className="bg-white border border-gray-200 hover:border-purple-300 rounded-2xl p-4 shadow-2xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-sm text-purple-900">{liq.id}</span>
                        <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                          liq.estado === "Pagada"
                            ? "bg-emerald-100 text-emerald-800"
                            : liq.estado === "Pendiente"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-red-100 text-red-800"
                        }`}>
                          {liq.estado}
                        </span>
                        <span className="text-xs text-gray-400">| Generada el {liq.fechaGeneracion}</span>
                      </div>
                      <p className="font-bold text-sm text-gray-900">{liq.proveedorNombre} {liq.rutProveedor ? `(${liq.rutProveedor})` : ""}</p>
                      <p className="text-xs text-gray-500">
                        Período: <strong className="text-gray-700">{liq.fechaDesde}</strong> al <strong className="text-gray-700">{liq.fechaHasta}</strong> • {liq.totalUnidadesVendidas} libros vendidos
                      </p>
                    </div>

                    <div className="flex items-center gap-4 border-t sm:border-t-0 pt-3 sm:pt-0 border-gray-100 justify-between sm:justify-end">
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-gray-400 block">Total a Pagar</span>
                        <span className="text-lg font-black text-indigo-900">{fmt(liq.totalAPagarProveedor)}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {onUpdateEstadoLiquidacion && (
                          <button
                            onClick={() => onUpdateEstadoLiquidacion(liq.id, liq.estado === "Pagada" ? "Pendiente" : "Pagada")}
                            className="p-2 text-xs font-bold rounded-xl border border-gray-200 hover:bg-gray-100 text-gray-700"
                            title="Cambiar estado de pago"
                          >
                            {liq.estado === "Pagada" ? "Marcar Pendiente" : "Marcar Pagada"}
                          </button>
                        )}
                        <button
                          onClick={() => handleExportCSV(liq)}
                          className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                          title="Descargar archivo Excel / CSV"
                        >
                          <Download size={15} />
                        </button>
                        <button
                          onClick={() => handlePrintOrExportPDF(liq)}
                          className="p-2 bg-purple-50 hover:bg-purple-100 text-purple-800 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                          title="Imprimir Ficha PDF"
                        >
                          <Printer size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
