import { Book, Venta, Proveedor, Gasto, OtroIngreso, Movimiento, Acceso, LibreriaEntry, AuditLog, TramaInfo } from "../types";

/**
 * Función auxiliar para descargar un string como archivo (CSV, JSON, etc.)
 * con codificación UTF-8 BOM para soporte perfecto en Microsoft Excel.
 */
export function downloadFile(filename: string, content: string, mimeType: string = "text/csv;charset=utf-8;") {
  const blob = new Blob(["\uFEFF" + content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Escapa comillas y delimitadores para CSV limpio.
 */
function escapeCSV(val: any): string {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

/**
 * Exporta el catálogo completo de libros e inventario a CSV / Excel
 */
export function exportBooksToCSV(books: Book[], filename: string = "inventario_libros_trama.csv") {
  const headers = [
    "ID",
    "Título",
    "Autor",
    "ISBN",
    "Categoría",
    "Precio Venta ($ CLP)",
    "Precio Costo ($ CLP)",
    "Stock Matriz",
    "Stock Mínimo",
    "Librería Asignada",
    "Ubicación / Estantería",
    "Proveedor ID",
    "Tipo Adquisición",
    "Pagado",
    "Tipo Portada",
    "Páginas",
    "Observaciones / Notas"
  ];

  const rows = books.map(b => [
    escapeCSV(b.id),
    escapeCSV(b.titulo),
    escapeCSV(b.autor),
    escapeCSV(b.isbn),
    escapeCSV(b.categoria),
    escapeCSV(b.precio),
    escapeCSV(b.precioCosto || 0),
    escapeCSV(b.stock),
    escapeCSV(b.stockMin),
    escapeCSV(b.libreria || "Casa Matriz"),
    escapeCSV(b.ubicacion || "Estantería Principal"),
    escapeCSV(b.proveedor || "Directo"),
    escapeCSV(b.tipoAdquisicion || "Compra"),
    escapeCSV(b.pagado ? "Sí" : "No"),
    escapeCSV(b.tipoPortada || "Tapa blanda"),
    escapeCSV(b.paginas || ""),
    escapeCSV(b.observaciones || "")
  ]);

  const csvContent = [headers.join(";"), ...rows.map(r => r.join(";"))].join("\r\n");
  downloadFile(filename, csvContent);
}

/**
 * Exporta el historial de ventas a CSV / Excel
 */
export function exportVentasToCSV(ventas: Venta[], filename: string = "ventas_historial_trama.csv") {
  const headers = [
    "ID Venta",
    "Fecha",
    "Hora",
    "Vendedor",
    "Medio de Pago",
    "Total Venta ($ CLP)",
    "Cant. Items",
    "Detalle de Libros Vendidos"
  ];

  const rows = ventas.map(v => {
    const detalleStr = (v.detalle || [])
      .map(item => `${item.titulo} (Cant: ${item.qty} x $${item.precio})`)
      .join(" | ");

    return [
      escapeCSV(v.id),
      escapeCSV(v.fecha),
      escapeCSV(v.hora || ""),
      escapeCSV(v.vendedor || "Caja"),
      escapeCSV(v.metodoPago || "Efectivo"),
      escapeCSV(v.total),
      escapeCSV(v.items || 0),
      escapeCSV(detalleStr)
    ];
  });

  const csvContent = [headers.join(";"), ...rows.map(r => r.join(";"))].join("\r\n");
  downloadFile(filename, csvContent);
}

/**
 * Exporta el directorio de proveedores a CSV / Excel
 */
export function exportProveedoresToCSV(proveedores: Proveedor[], filename: string = "proveedores_trama.csv") {
  const headers = [
    "ID",
    "Nombre / Razón Social",
    "Código Interno",
    "RUT",
    "Email",
    "Teléfono",
    "Contacto Directo",
    "Ciudad",
    "Categoría",
    "Condiciones de Pago"
  ];

  const rows = proveedores.map(p => [
    escapeCSV(p.id),
    escapeCSV(p.nombre),
    escapeCSV(p.codigoInterno || ""),
    escapeCSV(p.rut || ""),
    escapeCSV(p.email || ""),
    escapeCSV(p.telefono || ""),
    escapeCSV(p.contacto || ""),
    escapeCSV(p.ciudad || ""),
    escapeCSV(p.categoria || ""),
    escapeCSV(p.condicionesPago || "")
  ]);

  const csvContent = [headers.join(";"), ...rows.map(r => r.join(";"))].join("\r\n");
  downloadFile(filename, csvContent);
}

/**
 * Exporta reporte de Gastos a CSV
 */
export function exportGastosToCSV(gastos: Gasto[], filename: string = "gastos_operativos_trama.csv") {
  const headers = [
    "ID Gasto",
    "Fecha",
    "Hora",
    "Categoría",
    "Descripción",
    "Monto ($ CLP)",
    "Medio de Pago",
    "Registrado Por"
  ];

  const rows = gastos.map(g => [
    escapeCSV(g.id),
    escapeCSV(g.fecha),
    escapeCSV(g.hora || ""),
    escapeCSV(g.categoria),
    escapeCSV(g.descripcion),
    escapeCSV(g.monto),
    escapeCSV(g.metodoPago || "Efectivo"),
    escapeCSV(g.registradoPor || "Admin")
  ]);

  const csvContent = [headers.join(";"), ...rows.map(r => r.join(";"))].join("\r\n");
  downloadFile(filename, csvContent);
}

/**
 * Exporta el Respaldo Integral del Sistema en formato JSON
 */
export function exportFullJSONBackup(data: {
  books: Book[];
  ventas: Venta[];
  proveedores: Proveedor[];
  movimientos: Movimiento[];
  gastos: Gasto[];
  otrosIngresos: OtroIngreso[];
  accesos: Acceso[];
  librerias: LibreriaEntry[];
  tramaInfo?: TramaInfo;
  auditLogs?: AuditLog[];
}) {
  const hoyStr = new Date().toISOString().slice(0, 10);
  const fullBackup = {
    version: "2.5",
    tipo: "Respaldo Completo de Seguridad Trama Librerías",
    fechaExportacion: new Date().toISOString(),
    ...data
  };

  const jsonStr = JSON.stringify(fullBackup, null, 2);
  downloadFile(`respaldo_seguridad_trama_${hoyStr}.json`, jsonStr, "application/json");
}
