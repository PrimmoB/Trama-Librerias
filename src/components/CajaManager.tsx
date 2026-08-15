import React, { useState, useMemo } from "react";
import { X, Lock, Unlock, DollarSign, Calculator, CheckCircle2, AlertTriangle, Printer, FileSpreadsheet, Clock, ArrowRight } from "lucide-react";
import { AperturaCaja, CierreCaja, Venta, Gasto, OtroIngreso } from "../types";
import { fmt } from "../utils/helpers";

interface CajaManagerProps {
  aperturaActiva: AperturaCaja | null;
  usuarioActual: string;
  ventas: Venta[];
  gastos: Gasto[];
  otrosIngresos: OtroIngreso[];
  cierresGuardados: CierreCaja[];
  onAbrirCaja: (apertura: AperturaCaja) => void;
  onCerrarCaja: (cierre: CierreCaja) => void;
  onClose: () => void;
}

export function CajaManager({
  aperturaActiva,
  usuarioActual,
  ventas,
  gastos,
  otrosIngresos,
  cierresGuardados,
  onAbrirCaja,
  onCerrarCaja,
  onClose,
}: CajaManagerProps) {
  const [tab, setTab] = useState<"arqueo" | "historial">("arqueo");

  // Estado para apertura
  const [fondoInicialInput, setFondoInicialInput] = useState<number>(30000);

  // Estado para cierre / arqueo
  const [tipoCierre, setTipoCierre] = useState<"X" | "Z">("Z");
  const [efectivoContadoInput, setEfectivoContadoInput] = useState<string>("");
  const [observacionesCierre, setObservacionesCierre] = useState<string>("");

  const todayStr = new Date().toISOString().slice(0, 10);

  // Calcular movimientos de efectivo durante la sesión de caja activa
  const sessionStats = useMemo(() => {
    const fechaApertura = aperturaActiva ? aperturaActiva.fecha : todayStr;

    // Ventas de hoy
    const ventasHoy = ventas.filter(v => v.fecha === fechaApertura && v.estado !== "anulado");
    const ventasEfectivo = ventasHoy
      .filter(v => v.metodoPago === "Efectivo")
      .reduce((acc, v) => acc + v.total, 0);
    const ventasTarjeta = ventasHoy
      .filter(v => v.metodoPago === "Tarjeta")
      .reduce((acc, v) => acc + v.total, 0);
    const ventasTransferencia = ventasHoy
      .filter(v => v.metodoPago === "Transferencia")
      .reduce((acc, v) => acc + v.total, 0);

    // Gastos en efectivo de hoy
    const gastosEfectivo = gastos
      .filter(g => g.fecha === fechaApertura && g.metodoPago === "Efectivo")
      .reduce((acc, g) => acc + g.monto, 0);

    // Otros ingresos en efectivo
    const otrosIngresosEfectivo = otrosIngresos
      .filter(i => i.fecha === fechaApertura && i.metodoPago === "Efectivo")
      .reduce((acc, i) => acc + i.monto, 0);

    const fondoInicial = aperturaActiva ? aperturaActiva.fondoInicial : 0;
    const totalEfectivoEsperado = fondoInicial + ventasEfectivo - gastosEfectivo + otrosIngresosEfectivo;
    const totalVentasDia = ventasEfectivo + ventasTarjeta + ventasTransferencia;

    return {
      fondoInicial,
      ventasEfectivo,
      ventasTarjeta,
      ventasTransferencia,
      gastosEfectivo,
      otrosIngresosEfectivo,
      totalEfectivoEsperado,
      totalVentasDia,
    };
  }, [aperturaActiva, ventas, gastos, otrosIngresos, todayStr]);

  // Arqueo live math
  const efectivoContadoNum = Number(efectivoContadoInput) || 0;
  const diferencia = efectivoContadoNum - sessionStats.totalEfectivoEsperado;

  // Manejar apertura
  const handleAperturaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const horaNow = new Date().toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });

    const nuevaApertura: AperturaCaja = {
      id: `OPEN-${Date.now().toString().slice(-6)}`,
      fecha: todayStr,
      horaApertura: horaNow,
      fondoInicial: fondoInicialInput,
      cajero: usuarioActual || "Cajero",
      estado: "Abierta",
    };

    onAbrirCaja(nuevaApertura);
    alert(`✅ Turno iniciado con éxito. Caja abierta con fondo inicial de ${fmt(fondoInicialInput)}.`);
    onClose();
  };

  // Manejar cierre / arqueo
  const handleCierreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aperturaActiva && tipoCierre === "Z") {
      alert("No hay una sesión de caja abierta registrada.");
      return;
    }

    const horaNow = new Date().toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });

    const nuevoCierre: CierreCaja = {
      id: `CR-${tipoCierre}-${Date.now().toString().slice(-6)}`,
      aperturaId: aperturaActiva?.id,
      fecha: todayStr,
      horaCierre: horaNow,
      vendedor: usuarioActual || "Cajero",
      tipoCierre,
      fondoInicial: sessionStats.fondoInicial,
      ventasEfectivo: sessionStats.ventasEfectivo,
      gastosEfectivo: sessionStats.gastosEfectivo,
      otrosIngresosEfectivo: sessionStats.otrosIngresosEfectivo,
      totalEfectivoEsperado: sessionStats.totalEfectivoEsperado,
      totalEfectivoContado: efectivoContadoNum,
      diferencia,
      totalTarjeta: sessionStats.ventasTarjeta,
      totalTransferencia: sessionStats.ventasTransferencia,
      totalVentasDia: sessionStats.totalVentasDia,
      observaciones: observacionesCierre || `Arqueo ${tipoCierre} realizado con éxito.`,
    };

    onCerrarCaja(nuevoCierre);
    alert(`Arqueo Cierre ${tipoCierre} registrado correctamente.`);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-3xl my-auto flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* HEADER MODAL */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-900 to-teal-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-xl">
              <Calculator size={22} className="text-emerald-200" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg tracking-tight">Arqueo y Cierre de Caja Diario</h3>
              <p className="text-xs text-emerald-200 font-medium">
                Control de efectivo inicial, Cierre X (Parcial) y Cierre Z (Final de jornada)
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* NAVEGACIÓN Y ESTADO DE CAJA */}
        <div className="bg-gray-50 border-b border-gray-200 px-4 py-2.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTab("arqueo")}
              className={`px-3 py-1.5 font-extrabold text-xs rounded-lg transition-all ${
                tab === "arqueo" ? "bg-emerald-800 text-white shadow-2xs" : "text-gray-600 hover:bg-gray-200"
              }`}
            >
              💵 Panel de Arqueo
            </button>
            <button
              onClick={() => setTab("historial")}
              className={`px-3 py-1.5 font-extrabold text-xs rounded-lg transition-all ${
                tab === "historial" ? "bg-emerald-800 text-white shadow-2xs" : "text-gray-600 hover:bg-gray-200"
              }`}
            >
              📜 Historial de Arqueos ({cierresGuardados.length})
            </button>
          </div>

          <div className="flex items-center gap-2">
            {aperturaActiva ? (
              <span className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-900 font-extrabold text-xs px-2.5 py-1 rounded-full border border-emerald-300">
                <Unlock size={13} className="text-emerald-700" />
                <span>Caja Abierta ({aperturaActiva.horaApertura})</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-900 font-extrabold text-xs px-2.5 py-1 rounded-full border border-amber-300">
                <Lock size={13} className="text-amber-700" />
                <span>Caja Cerrada / Requieres Apertura</span>
              </span>
            )}
          </div>
        </div>

        {/* CONTENIDO TAB ARQUEO */}
        {tab === "arqueo" && (
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5">
            
            {/* SI NO HAY CAJA ABIERTA -> FORMULARIO DE APERTURA */}
            {!aperturaActiva ? (
              <form onSubmit={handleAperturaSubmit} className="bg-emerald-50/60 border-2 border-emerald-200 p-5 rounded-2xl space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-emerald-700 text-white rounded-xl">
                    <Unlock size={24} />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-base text-emerald-950">Declaración de Apertura de Caja</h4>
                    <p className="text-xs text-emerald-800">
                      Ingresa el saldo en efectivo disponible para sencillo y cambio al inicio del turno.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Cajero de Turno</label>
                    <input
                      type="text"
                      readOnly
                      value={usuarioActual}
                      className="w-full bg-gray-100 border border-gray-300 text-xs font-bold rounded-xl px-3 py-2 text-gray-700"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Fondo Inicial en Efectivo ($)</label>
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      required
                      value={fondoInicialInput}
                      onChange={e => setFondoInicialInput(Number(e.target.value))}
                      className="w-full bg-white border border-emerald-300 text-sm font-black text-emerald-900 rounded-xl px-3 py-2 focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-emerald-800 hover:bg-emerald-900 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Unlock size={16} />
                  <span>Iniciar Turno de Caja con {fmt(fondoInicialInput)}</span>
                </button>
              </form>
            ) : (
              /* SI HAY CAJA ABIERTA -> RESUMEN DE VENTAS + ARQUEO CIERRE X / Z */
              <form onSubmit={handleCierreSubmit} className="space-y-5">
                
                {/* SELECTOR TIPO CIERRE */}
                <div className="grid grid-cols-2 gap-3 bg-gray-100 p-1.5 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => setTipoCierre("X")}
                    className={`py-2 px-3 rounded-xl font-extrabold text-xs transition-all cursor-pointer ${
                      tipoCierre === "X"
                        ? "bg-white text-emerald-900 shadow-sm border border-gray-200"
                        : "text-gray-500 hover:text-gray-800"
                    }`}
                  >
                    🔍 Cierre X (Arqueo Parcial)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTipoCierre("Z")}
                    className={`py-2 px-3 rounded-xl font-extrabold text-xs transition-all cursor-pointer ${
                      tipoCierre === "Z"
                        ? "bg-emerald-800 text-white shadow-sm"
                        : "text-gray-500 hover:text-gray-800"
                    }`}
                  >
                    🔒 Cierre Z (Cierre Final Jornada)
                  </button>
                </div>

                {/* DESGLOSE MATEMÁTICO DE EFECTIVO */}
                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-3">
                  <h4 className="font-black text-xs uppercase tracking-wider text-gray-700 flex items-center justify-between">
                    <span>Resumen de Caja Registradora</span>
                    <span className="text-[10px] text-gray-500 font-medium">Apertura: {aperturaActiva.horaApertura} hrs</span>
                  </h4>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div className="bg-white p-2.5 rounded-xl border border-gray-200">
                      <span className="text-[10px] text-gray-500 font-bold block">1. Fondo Inicial</span>
                      <span className="font-extrabold text-gray-900">{fmt(sessionStats.fondoInicial)}</span>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-gray-200">
                      <span className="text-[10px] text-emerald-700 font-bold block">+ Ventas Efectivo</span>
                      <span className="font-extrabold text-emerald-800">+{fmt(sessionStats.ventasEfectivo)}</span>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-gray-200">
                      <span className="text-[10px] text-red-600 font-bold block">- Gastos Caja</span>
                      <span className="font-extrabold text-red-700">-{fmt(sessionStats.gastosEfectivo)}</span>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-gray-200">
                      <span className="text-[10px] text-blue-600 font-bold block">+ Otros Ingresos</span>
                      <span className="font-extrabold text-blue-700">+{fmt(sessionStats.otrosIngresosEfectivo)}</span>
                    </div>
                  </div>

                  {/* EFECTIVO ESPERADO TOTAL */}
                  <div className="bg-emerald-900 text-white p-3.5 rounded-xl flex items-center justify-between shadow-sm">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-200 block">Efectivo Esperado en Caja</span>
                      <p className="text-[11px] text-emerald-300">Calculado automáticamente por el sistema</p>
                    </div>
                    <span className="text-2xl font-black text-white">{fmt(sessionStats.totalEfectivoEsperado)}</span>
                  </div>

                  {/* OTRASH METODOS DE PAGO */}
                  <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                    <div className="bg-purple-50 p-2 rounded-lg border border-purple-100 flex items-center justify-between">
                      <span className="text-[11px] font-bold text-purple-900">💳 Ventas Tarjetas:</span>
                      <span className="font-extrabold text-purple-900">{fmt(sessionStats.ventasTarjeta)}</span>
                    </div>
                    <div className="bg-blue-50 p-2 rounded-lg border border-blue-100 flex items-center justify-between">
                      <span className="text-[11px] font-bold text-blue-900">🏦 Transferencias:</span>
                      <span className="font-extrabold text-blue-900">{fmt(sessionStats.ventasTransferencia)}</span>
                    </div>
                  </div>
                </div>

                {/* CONTEO FISICO EN CAJA */}
                <div className="border-2 border-emerald-600/40 bg-emerald-50/30 p-4 rounded-2xl space-y-3">
                  <label className="block text-xs font-black text-gray-900 uppercase tracking-wide">
                    💵 Ingresa el Efectivo Real Contado en Billetes y Monedas ($)
                  </label>
                  
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      required
                      min="0"
                      placeholder="Ej: 85000"
                      value={efectivoContadoInput}
                      onChange={e => setEfectivoContadoInput(e.target.value)}
                      className="flex-1 bg-white border-2 border-emerald-500 text-lg font-black text-gray-900 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-600"
                    />

                    <div className={`px-4 py-2.5 rounded-xl border font-black text-sm flex items-center gap-1.5 shrink-0 ${
                      diferencia === 0
                        ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                        : diferencia > 0
                        ? "bg-amber-100 text-amber-900 border-amber-300"
                        : "bg-red-100 text-red-900 border-red-300"
                    }`}>
                      {diferencia === 0 && <span>✅ Caja Cuadrada ($0)</span>}
                      {diferencia > 0 && <span>🟡 Sobrante +{fmt(diferencia)}</span>}
                      {diferencia < 0 && <span>🔴 Faltante {fmt(diferencia)}</span>}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Notas u Observaciones del Arqueo</label>
                  <input
                    type="text"
                    placeholder="Ej: Sencillo adicional agregado, sin novedades..."
                    value={observacionesCierre}
                    onChange={e => setObservacionesCierre(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-300 text-xs px-3 py-2 rounded-xl focus:bg-white"
                  />
                </div>

                {/* BOTÓN REGISTRAR */}
                <button
                  type="submit"
                  className={`w-full py-3 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    tipoCierre === "Z" ? "bg-emerald-900 hover:bg-emerald-950" : "bg-gray-900 hover:bg-black"
                  }`}
                >
                  <Lock size={16} />
                  <span>Confirmar y Guardar {tipoCierre === "Z" ? "Cierre Z Final" : "Arqueo Parcial X"}</span>
                </button>
              </form>
            )}

          </div>
        )}

        {/* CONTENIDO TAB HISTORIAL */}
        {tab === "historial" && (
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-3">
            {cierresGuardados.length === 0 ? (
              <div className="p-10 text-center text-gray-400">
                <Clock size={36} className="mx-auto mb-2 text-gray-300" />
                <p className="font-bold text-sm text-gray-600">No hay cierres o arqueos registrados aún</p>
              </div>
            ) : (
              cierresGuardados.map(c => (
                <div key={c.id} className="bg-white border border-gray-200 rounded-2xl p-3.5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-xs text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        Cierre {c.tipoCierre || "Z"}
                      </span>
                      <span className="font-bold text-xs text-gray-900">{c.fecha} ({c.horaCierre || "—"})</span>
                      <span className="text-[10px] text-gray-400">por {c.vendedor}</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      Ventas Día: <strong>{fmt(c.totalVentasDia)}</strong> • Efectivo Contado: <strong>{fmt(c.totalEfectivoContado)}</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-3 justify-between sm:justify-end border-t sm:border-0 pt-2 sm:pt-0">
                    <span className={`text-xs font-black px-2.5 py-1 rounded-lg ${
                      c.diferencia === 0
                        ? "bg-emerald-100 text-emerald-800"
                        : c.diferencia > 0
                        ? "bg-amber-100 text-amber-900"
                        : "bg-red-100 text-red-900"
                    }`}>
                      {c.diferencia === 0 ? "Cuadrado $0" : c.diferencia > 0 ? `+${fmt(c.diferencia)}` : fmt(c.diferencia)}
                    </span>

                    <button
                      onClick={() => window.print()}
                      className="p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg cursor-pointer"
                      title="Imprimir resumen de arqueo"
                    >
                      <Printer size={15} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

      </div>
    </div>
  );
}
