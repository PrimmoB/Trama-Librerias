# Trama Libros — Sistema de Gestión, Inventario y Punto de Venta (POS)

Sistema integral de gestión de inventario, ventas, consignaciones y finanzas diseñado para **Trama Impresores / Trama Libros** y su red de librerías aliadas independientes.

---

## 🚀 Características Principales

1. **Punto de Venta (POS)**
   - Venta rápida con escáner de código de barras o búsqueda en tiempo real.
   - Soporte para múltiples métodos de pago (Efectivo, Transferencia, Débito, Crédito).
   - Generación e impresión de tickets de venta y cálculo automático de cambio/vueltas.
   - Lector QR / Códigos de Barra integrado con cámara del dispositivo (`html5-qrcode`).
   - Módulo de arqueo y cierre de caja diario.

2. **Inventario y Gestión de Stock**
   - Catálogo centralizado de libros con precios, autores, editoriales, ISBN y ubicación física en estanterías.
   - Generador e impresor de etiquetas de precios con códigos de barra de formato estandarizado.
   - Control de stock bajo y alertas de reposición.
   - Importación y exportación masiva a planillas Excel (`.xlsx`).

3. **Red de Distribución y Librerías Aliadas**
   - Gestión de consignaciones con librerías asociadas (*Mar de Dudas*, *Kurripang*, *Antro*, etc.).
   - Páginas de gestión privada e individual para cada librería aliada.
   - Directorio de proveedores y cuentas por pagar por editorial.
   - Módulo de liquidaciones periódicas de libros consignados.

4. **Catálogo Público Abierto Trama**
   - Vista pública para clientes finales sin necesidad de iniciar sesión.
   - Consulta de stock disponible, fichas técnicas y portadas de libros.
   - Botón directo de compra/consulta vía WhatsApp con mensaje preformateado.

5. **Finanzas y Reportes Contables**
   - Resumen financiero en tiempo real (ingresos, gastos, utilidad neta, flujo de caja).
   - Gráficos interactivos de ventas semanales y mensuales con `recharts`.
   - Registro y categorización de gastos operativos y otros ingresos.

6. **Seguridad y Control de Accesos**
   - Perfiles de usuario diferenciados (`Administrador General`, `Administrador Secundario`, `Vendedor POS`).
   - Modo Seguro Activo por defecto.
   - Registro de auditoría (*Audit Log*) para trazabilidad de acciones del sistema.
   - Bloqueo automático anti-fuerza bruta en login.

---

## 🛠️ Tecnologías Utilizadas

- **Frontend**: React 19 + TypeScript + Vite
- **Estilos**: Tailwind CSS v4
- **Iconos**: Lucide React
- **Gráficos**: Recharts
- **Lectura de Código de Barras**: html5-qrcode
- **Manejo de Planillas Excel**: SheetJS (`xlsx`)
- **Animaciones**: Motion

---

## 💻 Instalación y Ejecución Local

### Prerrequisitos
- **Node.js** 18.x o superior
- **npm** 9.x o superior

### Pasos
1. Clona este repositorio:
   ```bash
   git clone https://github.com/tu-usuario/trama-gestion-libreria.git
   cd trama-gestion-libreria
   ```

2. Instala las dependencias:
   ```bash
   npm install
   ```

3. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```

4. Abre tu navegador en `http://localhost:3000`.

---

## 📦 Scripts Disponibles

- `npm run dev`: Ejecuta la aplicación en modo desarrollo.
- `npm run build`: Compila el proyecto para producción en la carpeta `dist/`.
- `npm run preview`: Previsualiza la build de producción localmente.
- `npm run lint`: Ejecuta la verificación de tipos con TypeScript.

---

## 📂 Estructura del Proyecto

```
├── public/              # Archivos estáticos e imágenes
├── src/
│   ├── components/      # Componentes principales (POS, Stock, Finanzas, DistribucionLibrerias, Accesos, Login)
│   │   ├── ui/          # Componentes de interfaz reutilizables (Badge, Modal, Btn, Input)
│   ├── data/            # Datos iniciales y estructuras de prueba
│   ├── utils/           # Utilidades (exportación a Excel, formateo)
│   ├── App.tsx          # Componente raíz y navegación
│   ├── main.tsx         # Punto de entrada de la aplicación
│   ├── types.ts         # Definición de tipos de TypeScript
│   └── index.css        # Estilos globales y Tailwind CSS
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 📄 Licencia

Desarrollado para **Trama Impresores & Librería**. Todos los derechos reservados.
