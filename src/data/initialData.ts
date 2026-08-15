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

export const LIBRERIAS_INIT: LibreriaEntry[] = [];

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
