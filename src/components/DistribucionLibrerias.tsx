import React from "react";
import { Finanzas } from "./Finanzas";
import { Venta, Book, Proveedor, Movimiento, Gasto, OtroIngreso, LibreriaEntry, TramaInfo } from "../types";

export interface DistribucionLibreriasProps {
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
  initialLibreriaPrivada?: string | null;
  onLibreriaPrivadaChange?: (lib: string | null) => void;
}

export function DistribucionLibrerias({
  ventas = [],
  setVentas = () => {},
  books = [],
  setBooks = () => {},
  proveedores = [],
  setProveedores,
  movimientos = [],
  gastos = [],
  setGastos = () => {},
  otrosIngresos = [],
  setOtrosIngresos,
  usuarioActual,
  librerias = [],
  setLibrerias,
  tramaInfo,
  registrarMovimiento,
  initialLibreriaPrivada = null,
  onLibreriaPrivadaChange,
}: DistribucionLibreriasProps) {
  return (
    <Finanzas
      ventas={ventas}
      setVentas={setVentas}
      books={books}
      setBooks={setBooks}
      proveedores={proveedores}
      setProveedores={setProveedores}
      movimientos={movimientos}
      gastos={gastos}
      setGastos={setGastos}
      otrosIngresos={otrosIngresos}
      setOtrosIngresos={setOtrosIngresos}
      usuarioActual={usuarioActual}
      librerias={librerias}
      setLibrerias={setLibrerias}
      tramaInfo={tramaInfo}
      registrarMovimiento={registrarMovimiento}
      initialTab="librerias"
      initialLibreriaPrivada={initialLibreriaPrivada}
      onLibreriaPrivadaChange={onLibreriaPrivadaChange}
    />
  );
}

export default DistribucionLibrerias;
