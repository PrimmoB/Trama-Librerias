export type LibreriaType = "Antro" | "Kurripang" | "Mar de Dudas" | "Trama";

export interface Book {
  id: number;
  titulo: string;
  autor: string;
  isbn: string;
  categoria: string;
  precio: number; // Precio de venta final
  stock: number;
  stockMin: number;
  proveedor: number;
  precioCosto: number; // Precio de costo / compra
  tipoAdquisicion: "Compra" | "Concesión" | "Donación" | "Otro" | string;
  pagado: boolean;
  abono?: number; // Monto abonado al proveedor por este lote/libro
  portada?: string;
  contraportada?: string;
  observaciones?: string;
  paginas?: number;
  tipoPapel?: "Bond" | "Ahuesado" | "Kraft" | "Otro" | string;
  tipoPortada?: "Tapa blanda" | "Tapa dura" | "Bolsillo" | "Ebook / Digital";
  editorial?: string;
  anioLanzamiento?: number;
  anioProduccion?: number;
  estadoLibro?: "Nuevo" | "Segunda Mano" | string;
  alto?: number;
  ancho?: number;
  espesor?: number;
  peso?: number;
  ubicacion?: string; // Ej: Estante A-3, Vitrina
  codigoInterno?: string; // Código Interno auto/manual: Librería (A, K o M) - Prov (XXX) - Precio ($XXX.XXX) - Ubicación (XX-XX-)
  libreria?: LibreriaType; // "Antro" | "Kurripang" | "Mar de Dudas"
  porcentajeLibreria?: number; // % utilidad / comisión de la librería seleccionada (Antro, Kurripang, Mar de Dudas)
  porcentajeTrama?: number; // % utilidad / comisión diferenciado para Trama
  stockTrama?: number; // Stock total editable para el Catálogo de Trama
  esArticulo?: boolean; // Identifica si es un artículo / producto no libro
  tipoArticulo?: "Stickers" | "Fanzines" | "Cuadros" | "Tarjetas" | "Otros" | string;
  especificacionOtros?: string; // Especificación cuando tipoArticulo es "Otros"
}

export interface TramaInfo {
  nombre: string;
  rut: string;
  direccion: string;
  ciudad: string;
  telefono: string;
  celular?: string;
  email: string;
  contacto: string;
  sitioWeb?: string;
  horarioAtencion?: string;
  instagram?: string;
  facebook?: string;
  twitter?: string;
  tiktok?: string;
  mapaEmbedUrl?: string;
  coordenadasMapa?: string;
  porcentajeComisionStandard: number;
  observaciones?: string;
}

export interface LibreriaEntry {
  id: number;
  nombre: string;
  alias: LibreriaType | string;
  contacto: string;
  email: string;
  telefono: string;
  ciudad: string;
  direccion?: string;
  porcentajeComision: number;
  activo: boolean;
  observaciones?: string;
  claveAcceso?: string;
  logo?: string;
}

export interface Proveedor {
  id: number;
  nombre: string;
  codigoInterno?: string;
  email: string;
  telefono?: string;
  ciudad: string;
  categoria: string;
  activo: boolean;
  contacto?: string;
  condicionesPago?: string;
  rut?: string;
  observaciones?: string;
}

export interface VentaDetalle {
  id: number;
  titulo: string;
  precio: number;
  qty: number;
  subtotal: number;
}

export interface Venta {
  id: string;
  fecha: string; // YYYY-MM-DD
  hora?: string; // HH:MM
  total: number;
  items: number;
  estado: "pagado" | "anulado";
  metodoPago: "Efectivo" | "Tarjeta" | "Transferencia";
  vendedor: string;
  efectivoEntregado?: number;
  vuelto?: number;
  detalle: VentaDetalle[];
}

export interface Acceso {
  id: number;
  nombre: string;
  email: string;
  clave: string;
  rol: "admin" | "admin_secundario" | "vendedor";
  activo: boolean;
  ultimo: string;
}

export interface Movimiento {
  id: string;
  fecha: string;
  usuario: string;
  bookId: number;
  titulo: string;
  tipo: "venta" | "compra" | "ajuste";
  cantidad: number;
  montoUnit: number;
  motivo: string;
}

export interface AperturaCaja {
  id: string;
  fecha: string; // YYYY-MM-DD
  horaApertura: string;
  fondoInicial: number;
  cajero: string;
  estado: "Abierta" | "Cerrada";
  horaCierre?: string;
  cierreId?: string;
  observaciones?: string;
}

export interface CierreCaja {
  id: string;
  aperturaId?: string;
  fecha: string;
  horaCierre: string;
  vendedor: string;
  tipoCierre: "X" | "Z"; // X = Arqueo parcial, Z = Cierre final de jornada
  fondoInicial: number;
  ventasEfectivo: number;
  gastosEfectivo: number;
  otrosIngresosEfectivo?: number;
  totalEfectivoEsperado: number;
  totalEfectivoContado: number;
  diferencia: number;
  totalTarjeta: number;
  totalTransferencia: number;
  totalVentasDia: number;
  observaciones?: string;
}

export interface LiquidacionItem {
  bookId: number;
  titulo: string;
  isbn: string;
  editorial?: string;
  unidadesVendidas: number;
  precioVenta: number;
  precioCosto: number;
  porcentajeComision: number;
  totalVentaGross: number;
  montoComisionLibreria: number;
  montoAPagarProveedor: number;
}

export interface LiquidacionConsignacion {
  id: string;
  proveedorId: number;
  proveedorNombre: string;
  rutProveedor?: string;
  fechaDesde: string;
  fechaHasta: string;
  fechaGeneracion: string;
  registradoPor: string;
  items: LiquidacionItem[];
  totalUnidadesVendidas: number;
  totalVentaGross: number;
  totalComisionLibreria: number;
  totalAPagarProveedor: number;
  estado: "Pendiente" | "Pagada" | "Anulada";
  observaciones?: string;
}

export type CategoriaGasto =
  | "Costo Fijo"
  | "Costo Variable"
  | "Honorarios"
  | "Arriendo / Servicios"
  | "Suministros"
  | "Otro";

export interface Gasto {
  id: string;
  fecha: string; // YYYY-MM-DD
  hora?: string;
  monto: number;
  categoria: CategoriaGasto;
  descripcion: string;
  registradoPor?: string;
  metodoPago: "Efectivo" | "Tarjeta" | "Transferencia";
}

export interface AuditLog {
  id: string;
  fechaHora: string;
  usuario: string;
  rol: RoleType;
  accion: string;
  modulo: string;
  detalles: string;
  tipo: "info" | "warning" | "security_alert" | "success";
}

export type RoleType = "admin" | "admin_secundario" | "vendedor";

export type CategoriaOtroIngreso =
  | "Servicios"
  | "Aportes"
  | "Donaciones"
  | "Otro";

export interface OtroIngreso {
  id: string;
  fecha: string; // YYYY-MM-DD
  hora?: string;
  monto: number;
  categoria: CategoriaOtroIngreso;
  descripcion: string;
  registradoPor?: string;
  metodoPago: "Efectivo" | "Tarjeta" | "Transferencia";
}

