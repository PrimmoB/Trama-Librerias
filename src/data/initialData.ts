import { Book, Proveedor, Venta, Acceso, Movimiento, Gasto, OtroIngreso, TramaInfo, LibreriaEntry } from "../types";

export const TRAMA_INFO_INIT: TramaInfo = {
  nombre: "Trama Librerías",
  rut: "77.654.321-K",
  direccion: "Av. Cartagena 330 interior.",
  ciudad: "Cartagena",
  telefono: "+56 9 6449 0175",
  celular: "+56 9 6449 0175",
  email: "contacto@tramalibros.cl",
  contacto: "Dirección General Trama",
  sitioWeb: "www.tramalibros.cl",
  horarioAtencion: "Lunes a Viernes de 10:00 a 19:30 hrs | Sábados de 11:00 a 16:00 hrs",
  instagram: "@trama.librerias",
  facebook: "TramaLibreriasChile",
  twitter: "@TramaLibros",
  tiktok: "@tramalibrerias",
  mapaEmbedUrl: "https://maps.google.com/maps?q=Av.%20Cartagena%20330%20interior%2C%20Cartagena&t=&z=15&ie=UTF8&iwloc=&output=embed",
  coordenadasMapa: "Av. Cartagena 330 interior, Cartagena, Valparaíso, Chile",
  porcentajeComisionStandard: 10,
  observaciones: "Casa Matriz, Distribución y Administración Central de la Red Trama Librerías."
};

export const DEFAULT_LIBRERIAS: LibreriaEntry[] = [
  {
    id: 1,
    nombre: "Trama Coordinación Central & Red Editorial",
    alias: "Trama",
    contacto: "Plataforma & Dirección General",
    email: "contacto@tramalibros.cl",
    telefono: "+56 9 6449 0175",
    ciudad: "Cartagena, Valparaíso",
    direccion: "Av. Cartagena 330 interior",
    porcentajeComision: 10,
    activo: true,
    claveAcceso: "trama123",
    logo: "",
    observaciones: "Casa Matriz, Distribución y Administración Central"
  },
  {
    id: 2,
    nombre: "Librería Mar de Dudas",
    alias: "Mar de Dudas",
    contacto: "Administración Mar de Dudas",
    email: "contacto@mardedudas.cl",
    telefono: "+56 9 8765 4321",
    ciudad: "Valparaíso",
    direccion: "Paseo Dimalow 260, Cerro Alegre",
    porcentajeComision: 30,
    activo: true,
    claveAcceso: "mardedudas123",
    logo: "",
    observaciones: "Sede Valparaíso"
  },
  {
    id: 3,
    nombre: "Librería Kurripang",
    alias: "Kurripang",
    contacto: "Administración Kurripang",
    email: "contacto@kurripang.cl",
    telefono: "+56 9 7654 3210",
    ciudad: "Santiago",
    direccion: "Barrio Lastarria, Santiago",
    porcentajeComision: 30,
    activo: true,
    claveAcceso: "kurripang123",
    logo: "",
    observaciones: "Sede Santiago Centro"
  },
  {
    id: 4,
    nombre: "Librería Antro",
    alias: "Antro",
    contacto: "Administración Antro",
    email: "contacto@antro.cl",
    telefono: "+56 9 6543 2109",
    ciudad: "Concepción",
    direccion: "Plaza Perú, Concepción",
    porcentajeComision: 30,
    activo: true,
    claveAcceso: "antro123",
    logo: "",
    observaciones: "Sede Concepción"
  }
];

export const LIBRERIAS_INIT: LibreriaEntry[] = DEFAULT_LIBRERIAS;

export function normalizeLibreriasList(rawList: any[] | null | undefined): LibreriaEntry[] {
  if (!rawList || !Array.isArray(rawList) || rawList.length === 0) {
    return DEFAULT_LIBRERIAS;
  }

  const result: LibreriaEntry[] = [];
  const seenAliases = new Set<string>();

  // Helper de alias limpio
  const cleanAlias = (a: string) => (a || "").trim().toLowerCase();

  // 1. Procesar elementos existentes preservando datos propios
  for (const item of rawList) {
    if (!item) continue;
    const aliasStr = (item.alias || item.nombre || "").trim();
    const aliasKey = cleanAlias(aliasStr);
    if (!aliasKey || seenAliases.has(aliasKey)) continue;

    seenAliases.add(aliasKey);
    const defaultMatch = DEFAULT_LIBRERIAS.find(d => cleanAlias(d.alias) === aliasKey);

    result.push({
      id: typeof item.id === "number" ? item.id : (defaultMatch?.id || Date.now() + Math.floor(Math.random() * 1000)),
      nombre: item.nombre || defaultMatch?.nombre || `Librería ${aliasStr}`,
      alias: item.alias || defaultMatch?.alias || aliasStr,
      contacto: item.contacto || defaultMatch?.contacto || "Administración",
      email: item.email || defaultMatch?.email || `contacto@${aliasKey.replace(/\s+/g, "")}.cl`,
      telefono: item.telefono || defaultMatch?.telefono || "+56 9 9999 9999",
      ciudad: item.ciudad || defaultMatch?.ciudad || "Chile",
      direccion: item.direccion || defaultMatch?.direccion,
      porcentajeComision: typeof item.porcentajeComision === "number" ? item.porcentajeComision : (defaultMatch?.porcentajeComision ?? 30),
      activo: item.activo !== false,
      observaciones: item.observaciones || defaultMatch?.observaciones,
      claveAcceso: item.claveAcceso || defaultMatch?.claveAcceso || `${aliasKey.replace(/\s+/g, "")}123`,
      logo: item.logo || defaultMatch?.logo || "",
    });
  }

  // 2. Asegurar que las 4 librerías base (Trama, Mar de Dudas, Kurripang, Antro) siempre existan independientemente
  for (const def of DEFAULT_LIBRERIAS) {
    const defKey = cleanAlias(def.alias);
    if (!seenAliases.has(defKey)) {
      result.push({ ...def });
      seenAliases.add(defKey);
    }
  }

  return result;
}

export const PROVEEDORES_INIT: Proveedor[] = [];

export const BOOKS_INIT: Book[] = [];

export const VENTAS_INIT: Venta[] = [];

export const ACCESOS_INIT: Acceso[] = [
  { id: 1, nombre: "Admin General", email: "admin@tramalibros.cl", clave: "admin123", rol: "admin", activo: true, ultimo: "Nunca" },
  { id: 2, nombre: "Admin Secundario", email: "admin2@tramalibros.cl", clave: "admin2123", rol: "admin_secundario", activo: true, ultimo: "Nunca" },
  { id: 3, nombre: "Sofía Vendedora", email: "sofia@tramalibros.cl", clave: "sofia123", rol: "vendedor", activo: true, ultimo: "Nunca" },
];

export const MOVIMIENTOS_INIT: Movimiento[] = [];

export const GASTOS_INIT: Gasto[] = [];

export const OTROS_INGRESOS_INIT: OtroIngreso[] = [];
