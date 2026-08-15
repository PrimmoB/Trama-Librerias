import React, { useState, useEffect, Dispatch, SetStateAction } from "react";

export const fmt = (n: number) => "$" + Math.round(n).toLocaleString("es-CL");

export const catEmoji: Record<string, string> = {
  "Novela": "📖",
  "Infantil": "🌟",
  "Ficción": "🚀",
  "Misterio": "🔍",
  "Clásicos": "🏛",
  "No ficción": "🧠",
  "Poesía": "✒️",
  "Ensayo": "📜",
  "Arte / Diseño": "🎨",
  "Arte": "🎨",
  "Comic / Manga": "💥",
  "Cómic/Manga": "💥",
  "Historia": "🗺️",
  "Filosofía": "🦉",
  "Ciencia": "🔬",
  "Cuento": "📚",
  "Biografía": "👤",
  "Autoayuda": "🌱",
  "Cocina": "🍳",
  "Viajes": "🧳",
  "Otros": "🏷️"
};

export function exportCSV(filename: string, rows: Record<string, any>[]) {
  if (!rows || rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const escapeVal = (v: any) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csv = [headers.join(","), ...rows.map(r => headers.map(h => escapeVal(r[h])).join(","))].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function useLocalStorage<T>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setState] = useState<T>(() => {
    try {
      const saved = window.localStorage.getItem(key);
      return saved !== null ? JSON.parse(saved) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(state));
    } catch {
      // Ignore quota or private browsing issues
    }
  }, [key, state]);

  return [state, setState];
}

export function generarCodigoInterno(
  libreria?: string,
  proveedor?: number | string,
  precio?: number | string,
  ubicacion?: string
): string {
  // 1. Librería (A, K o M)
  let lib = "A";
  if (libreria) {
    const l = libreria.toLowerCase().trim();
    if (l.includes("antro")) lib = "A";
    else if (l.includes("kurripang")) lib = "K";
    else if (l.includes("mar")) lib = "M";
    else if (l.includes("trama")) lib = "T";
    else if (l.length > 0) lib = l.charAt(0).toUpperCase();
  }

  // 2. Código Proveedor (XXX)
  let prov = "XXX";
  if (proveedor !== undefined && proveedor !== null && proveedor !== "" && proveedor !== 0) {
    const pNum = Number(proveedor);
    if (!isNaN(pNum) && pNum > 0) {
      prov = String(pNum).padStart(3, "0");
    } else {
      prov = String(proveedor).trim().toUpperCase();
    }
  }

  // 3. Precio Venta ($XXX.XXX)
  let precioFormatted = "$XXX.XXX";
  if (precio !== undefined && precio !== null && precio !== "") {
    const val = typeof precio === "number" ? precio : parseFloat(String(precio).replace(/[^0-9.]/g, ""));
    if (!isNaN(val) && val > 0) {
      precioFormatted = `$${Math.round(val).toLocaleString("es-CL")}`;
    }
  }

  // 4. Ubicación (XX-XX-)
  let ubi = "XX-XX-";
  if (ubicacion && ubicacion.trim()) {
    ubi = ubicacion.trim();
  }

  return `${lib}-${prov}-${precioFormatted}-${ubi}`;
}

export function getFechaHoraChile(dateInput?: Date | string | number): string {
  let d: Date;
  if (!dateInput) {
    d = new Date();
  } else if (typeof dateInput === "string" || typeof dateInput === "number") {
    d = new Date(dateInput);
    if (isNaN(d.getTime())) d = new Date();
  } else {
    d = dateInput;
  }

  try {
    const options: Intl.DateTimeFormatOptions = {
      timeZone: "America/Santiago",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    };
    const formatter = new Intl.DateTimeFormat("es-CL", options);
    const parts = formatter.formatToParts(d);
    const getPart = (type: string) => parts.find(p => p.type === type)?.value || "00";
    return `${getPart("year")}-${getPart("month")}-${getPart("day")} ${getPart("hour")}:${getPart("minute")}:${getPart("second")}`;
  } catch {
    return d.toISOString().replace("T", " ").slice(0, 19);
  }
}

