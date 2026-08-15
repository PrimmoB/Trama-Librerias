import * as XLSX from "xlsx";
import { Book, LibreriaType, Proveedor } from "../types";
import { generarCodigoInterno } from "./helpers";

export interface ExcelImportRow {
  titulo: string;
  autor: string;
  editorial?: string;
  isbn?: string;
  categoria?: string;
  precio: number;
  precioCosto?: number;
  stock: number;
  stockMin?: number;
  libreria?: LibreriaType;
  tipoAdquisicion?: string;
  ubicacion?: string;
  paginas?: number;
  estadoLibro?: string;
  observaciones?: string;
  proveedorNombre?: string;
}

export function exportBooksToExcel(books: Book[], filename: string = "inventario_libreria.xlsx") {
  const data = books.map(b => {
    const pctLib = b.porcentajeLibreria ?? 90;
    const pctTr = b.porcentajeTrama ?? 10;
    const pVenta = b.precio || 0;
    const pCosto = b.precioCosto || 0;
    const ganancia = pVenta > pCosto ? pVenta - pCosto : 0;

    return {
      "ID": b.id,
      "Título": b.titulo,
      "Autor": b.autor,
      "Editorial": b.editorial || "",
      "ISBN": b.isbn || "",
      "Categoría": b.categoria || "Novela",
      "Librería Asignada": b.libreria || "Mar de Dudas",
      "Precio Venta ($)": pVenta,
      "Precio Costo ($)": pCosto,
      "Ganancia Estimada ($)": ganancia,
      "% Comision Libreria": `${pctLib}%`,
      "% Comision Trama": `${pctTr}%`,
      "Stock Actual": b.stock,
      "Stock Mínimo": b.stockMin || 3,
      "Modalidad Adquisición": b.tipoAdquisicion || "Compra",
      "Estado Pago": b.pagado ? "Pagado" : "Pendiente",
      "Ubicación Físic": b.ubicacion || "",
      "Páginas": b.paginas || "",
      "Tipo Portada": b.tipoPortada || "Tapa blanda",
      "Código Interno": b.codigoInterno || generarCodigoInterno(b.libreria, b.proveedor, b.precio, b.ubicacion),
      "Estado Libro": b.estadoLibro || "Nuevo",
      "Observaciones": b.observaciones || "",
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(data);

  // Set column widths
  worksheet["!cols"] = [
    { wch: 6 },  // ID
    { wch: 30 }, // Título
    { wch: 22 }, // Autor
    { wch: 20 }, // Editorial
    { wch: 18 }, // ISBN
    { wch: 16 }, // Categoría
    { wch: 18 }, // Librería
    { wch: 15 }, // Precio Venta
    { wch: 15 }, // Precio Costo
    { wch: 18 }, // Ganancia
    { wch: 16 }, // % Librería
    { wch: 16 }, // % Trama
    { wch: 12 }, // Stock Actual
    { wch: 12 }, // Stock Mín
    { wch: 20 }, // Modalidad
    { wch: 12 }, // Estado Pago
    { wch: 16 }, // Ubicación
    { wch: 10 }, // Páginas
    { wch: 14 }, // Tipo Portada
    { wch: 14 }, // Estado Libro
    { wch: 25 }, // Observaciones
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Inventario Libros");
  XLSX.writeFile(workbook, filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`);
}

export function downloadExcelTemplate() {
  const sampleData = [
    {
      "Título": "Cien años de soledad",
      "Autor": "Gabriel García Márquez",
      "Editorial": "Sudamericana",
      "ISBN": "978-950-07-0098-6",
      "Categoría": "Clásicos",
      "Precio Venta": 18000,
      "Precio Costo": 11000,
      "Stock": 10,
      "Stock Mínimo": 3,
      "Librería": "Mar de Dudas",
      "Modalidad": "Compra",
      "Proveedor": "Editorial Sudamericana",
      "Ubicación": "Estante A-1",
      "Páginas": 472,
      "Estado": "Nuevo",
      "Observaciones": "Edición especial tapa blanda"
    },
    {
      "Título": "El infinito en un junco",
      "Autor": "Irene Vallejo",
      "Editorial": "Siruela",
      "ISBN": "978-841-78-6079-0",
      "Categoría": "Ensayo",
      "Precio Venta": 22000,
      "Precio Costo": 14000,
      "Stock": 5,
      "Stock Mínimo": 2,
      "Librería": "Kurripang",
      "Modalidad": "Concesión",
      "Proveedor": "Librerías del Sur",
      "Ubicación": "Mesa central",
      "Páginas": 452,
      "Estado": "Nuevo",
      "Observaciones": "Bestseller rotación alta"
    },
    {
      "Título": "Desolación",
      "Autor": "Gabriela Mistral",
      "Editorial": "Nascimento",
      "ISBN": "978-956-11-1234-5",
      "Categoría": "Poesía",
      "Precio Venta": 12000,
      "Precio Costo": 7000,
      "Stock": 8,
      "Stock Mínimo": 3,
      "Librería": "Antro",
      "Modalidad": "Compra",
      "Proveedor": "Distribuidora Mistral",
      "Ubicación": "Vitrina Principal",
      "Páginas": 210,
      "Estado": "Nuevo",
      "Observaciones": "Poesía chilena"
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  worksheet["!cols"] = [
    { wch: 28 }, { wch: 24 }, { wch: 18 }, { wch: 18 }, { wch: 15 },
    { wch: 14 }, { wch: 14 }, { wch: 10 }, { wch: 12 }, { wch: 16 },
    { wch: 14 }, { wch: 20 }, { wch: 14 }, { wch: 10 }, { wch: 12 }, { wch: 25 }
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Plantilla Inventario");
  XLSX.writeFile(workbook, "Plantilla_Carga_Inventario.xlsx");
}

export function parseExcelInventory(
  file: File,
  proveedores: Proveedor[] = []
): Promise<{ books: Partial<Book>[]; warnings: string[]; totalRows: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const buffer = e.target?.result;
        if (!buffer) {
          return reject(new Error("No se pudo leer el archivo seleccionado."));
        }

        const workbook = XLSX.read(buffer, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        if (!firstSheetName) {
          return reject(new Error("El archivo de Excel está vacío o no tiene hojas."));
        }

        const sheet = workbook.Sheets[firstSheetName];
        const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

        if (rawRows.length === 0) {
          return resolve({ books: [], warnings: ["El archivo no contiene filas de datos."], totalRows: 0 });
        }

        const parsedBooks: Partial<Book>[] = [];
        const warnings: string[] = [];

        rawRows.forEach((row, index) => {
          const rowNum = index + 2; // Row number in spreadsheet (1-indexed header)

          // Flexible header resolution
          const getVal = (...keys: string[]): any => {
            for (const k of keys) {
              const matchedKey = Object.keys(row).find(
                rk => rk.trim().toLowerCase() === k.toLowerCase()
              );
              if (matchedKey && row[matchedKey] !== undefined && row[matchedKey] !== "") {
                return row[matchedKey];
              }
            }
            return "";
          };

          const titulo = String(getVal("Título", "Titulo", "Book", "Libro", "Nombre") || "").trim();
          const autor = String(getVal("Autor", "Author", "Escritor") || "").trim();

          if (!titulo && !autor) {
            // Ignore completely empty rows
            return;
          }

          if (!titulo) {
            warnings.push(`Fila ${rowNum}: Faltó el Título del libro (se omitió o requiere nombre).`);
            return;
          }

          const editorial = String(getVal("Editorial", "Publisher") || "").trim();
          const isbn = String(getVal("ISBN", "Isbn", "Codigo", "Código") || "").trim();
          const categoria = String(getVal("Categoría", "Categoria", "Generó", "Género", "Category") || "Novela").trim();

          // Prices and Stock parsing
          const parseNum = (val: any): number => {
            if (typeof val === "number") return val;
            if (!val) return 0;
            const cleaned = String(val).replace(/[^0-9.-]+/g, "");
            const num = parseFloat(cleaned);
            return isNaN(num) ? 0 : num;
          };

          const precioVenta = parseNum(getVal("Precio Venta", "Precio", "P.Venta", "PVenta", "PrecioVenta", "Precio de Venta"));
          const precioCosto = parseNum(getVal("Precio Costo", "P.Costo", "PCosto", "Costo", "PrecioCosto", "Coste"));
          const stock = parseNum(getVal("Stock", "Stock Local", "Cantidad", "Unidades", "Existencias"));
          const stockMin = parseNum(getVal("Stock Mínimo", "Stock Minimo", "StockMin", "Minimo")) || 3;

          // Libreria resolution
          let libreriaRaw = String(getVal("Librería", "Libreria", "Subitem", "Sucursal") || "Mar de Dudas").trim();
          let libreriaVal: LibreriaType = "Mar de Dudas";
          if (/kurripang/i.test(libreriaRaw)) libreriaVal = "Kurripang";
          else if (/antro/i.test(libreriaRaw)) libreriaVal = "Antro";
          else if (/trama/i.test(libreriaRaw)) libreriaVal = "Trama";

          // Modalidad
          let modalidadRaw = String(getVal("Modalidad", "Modalidad Adquisición", "Tipo Adquisicion", "TipoAdquisicion", "Adquisicion") || "Compra").trim();
          let tipoAdquisicion = "Compra";
          if (/concesi/i.test(modalidadRaw)) tipoAdquisicion = "Concesión";
          else if (/donaci/i.test(modalidadRaw)) tipoAdquisicion = "Donación";
          else if (/otro/i.test(modalidadRaw)) tipoAdquisicion = "Otro";

          // Proveedor matching
          const provNombre = String(getVal("Proveedor", "Editorial/Proveedor", "Distribuidor") || "").trim();
          let provId = proveedores[0]?.id || 1;
          if (provNombre && proveedores.length > 0) {
            const matchedProv = proveedores.find(
              p => p.nombre.toLowerCase().includes(provNombre.toLowerCase()) || provNombre.toLowerCase().includes(p.nombre.toLowerCase())
            );
            if (matchedProv) provId = matchedProv.id;
          }

          const ubicacion = String(getVal("Ubicación", "Ubicacion", "Estante", "Lugar") || "").trim();
          const paginas = parseNum(getVal("Páginas", "Paginas", "NumPaginas")) || undefined;
          const estadoLibro = String(getVal("Estado", "Estado Libro", "EstadoLibro", "Condicion") || "Nuevo").trim();
          const observaciones = String(getVal("Observaciones", "Notas", "Comentarios") || "").trim();

          if (precioVenta <= 0) {
            warnings.push(`Fila ${rowNum} (${titulo}): Se cargó sin precio de venta ($0). Por favor revísalo.`);
          }

          parsedBooks.push({
            titulo,
            autor: autor || "Autor Desconocido",
            editorial,
            isbn: isbn || `978-956-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(10 + Math.random() * 89)}-${Math.floor(Math.random() * 9)}`,
            categoria: categoria || "Novela",
            precio: precioVenta,
            precioCosto: precioCosto,
            stock: stock,
            stockMin: stockMin,
            libreria: libreriaVal,
            tipoAdquisicion,
            proveedor: provId,
            ubicacion,
            paginas,
            estadoLibro: estadoLibro.toLowerCase().includes("segunda") ? "Segunda Mano" : "Nuevo",
            observaciones,
            pagado: true,
            porcentajeLibreria: 90,
            porcentajeTrama: 10,
          });
        });

        resolve({
          books: parsedBooks,
          warnings,
          totalRows: rawRows.length
        });

      } catch (err: any) {
        reject(new Error("Error al procesar el archivo Excel: " + (err?.message || err)));
      }
    };

    reader.onerror = () => {
      reject(new Error("Error al leer el archivo."));
    };

    reader.readAsArrayBuffer(file);
  });
}
