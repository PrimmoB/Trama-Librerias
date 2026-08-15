import React, { useState, useMemo } from "react";
import {
  Plus,
  Edit3,
  Trash2,
  Building,
  Store,
  Truck,
  Mail,
  Phone,
  MapPin,
  Globe,
  Percent,
  Search,
  CheckCircle,
  ToggleLeft,
  ToggleRight,
  Info,
  Layers,
  FileText
} from "lucide-react";
import { Proveedor, TramaInfo, LibreriaEntry, LibreriaType } from "../types";
import { Badge, Modal, Btn, Input } from "./ui";

interface ProveedoresProps {
  tramaInfo: TramaInfo;
  setTramaInfo: React.Dispatch<React.SetStateAction<TramaInfo>>;
  librerias: LibreriaEntry[];
  setLibrerias: React.Dispatch<React.SetStateAction<LibreriaEntry[]>>;
  proveedores: Proveedor[];
  setProveedores: React.Dispatch<React.SetStateAction<Proveedor[]>>;
}

export function Proveedores({
  tramaInfo,
  setTramaInfo,
  librerias,
  setLibrerias,
  proveedores,
  setProveedores,
}: ProveedoresProps) {
  // Pestaña activa: "trama" | "librerias" | "proveedores"
  const [activeTab, setActiveTab] = useState<"trama" | "librerias" | "proveedores">("trama");
  const [searchTerm, setSearchTerm] = useState("");

  // Modales
  const [modalTramaOpen, setModalTramaOpen] = useState(false);
  const [tramaForm, setTramaForm] = useState<TramaInfo>(tramaInfo);

  // Librerías state modal
  const [modalLibreriaOpen, setModalLibreriaOpen] = useState(false);
  const [editingLibreriaId, setEditingLibreriaId] = useState<number | null>(null);
  const emptyLibreriaForm = {
    nombre: "",
    alias: "",
    contacto: "",
    email: "",
    telefono: "",
    ciudad: "",
    direccion: "",
    porcentajeComision: 30,
    observaciones: "",
  };
  const [libreriaForm, setLibreriaForm] = useState(emptyLibreriaForm);

  // Proveedores state modal
  const [modalProveedorOpen, setModalProveedorOpen] = useState(false);
  const [editingProveedorId, setEditingProveedorId] = useState<number | null>(null);
  const emptyProveedorForm = {
    nombre: "",
    codigoInterno: "",
    email: "",
    telefono: "",
    ciudad: "",
    categoria: "",
    contacto: "",
    condicionesPago: "Consignación 60 días",
  };
  const [proveedorForm, setProveedorForm] = useState(emptyProveedorForm);

  const [formError, setFormError] = useState("");

  // Handler Trama
  const handleSaveTrama = () => {
    if (!tramaForm.nombre.trim()) {
      setFormError("El nombre de la empresa es obligatorio.");
      return;
    }
    setTramaInfo(tramaForm);
    setModalTramaOpen(false);
    setFormError("");
  };

  // Handlers Librería
  const handleOpenNewLibreria = () => {
    setEditingLibreriaId(null);
    setLibreriaForm(emptyLibreriaForm);
    setFormError("");
    setModalLibreriaOpen(true);
  };

  const handleOpenEditLibreria = (lib: LibreriaEntry) => {
    setEditingLibreriaId(lib.id);
    setLibreriaForm({
      nombre: lib.nombre,
      alias: lib.alias,
      contacto: lib.contacto,
      email: lib.email,
      telefono: lib.telefono,
      ciudad: lib.ciudad,
      direccion: lib.direccion || "",
      porcentajeComision: lib.porcentajeComision,
      observaciones: lib.observaciones || "",
    });
    setFormError("");
    setModalLibreriaOpen(true);
  };

  const handleSaveLibreria = () => {
    if (!libreriaForm.nombre.trim()) {
      setFormError("El nombre de la librería es obligatorio.");
      return;
    }
    if (!libreriaForm.alias.trim()) {
      setFormError("El alias corto (para los filtros) es obligatorio.");
      return;
    }

    if (editingLibreriaId !== null) {
      setLibrerias(prev =>
        prev.map(item =>
          item.id === editingLibreriaId
            ? {
                ...item,
                nombre: libreriaForm.nombre.trim(),
                alias: libreriaForm.alias.trim(),
                contacto: libreriaForm.contacto.trim(),
                email: libreriaForm.email.trim(),
                telefono: libreriaForm.telefono.trim(),
                ciudad: libreriaForm.ciudad.trim(),
                direccion: libreriaForm.direccion.trim() || undefined,
                porcentajeComision: Number(libreriaForm.porcentajeComision) || 0,
                observaciones: libreriaForm.observaciones.trim() || undefined,
              }
            : item
        )
      );
    } else {
      const newId = Math.max(0, ...librerias.map(l => l.id)) + 1;
      const newLibreria: LibreriaEntry = {
        id: newId,
        nombre: libreriaForm.nombre.trim(),
        alias: libreriaForm.alias.trim(),
        contacto: libreriaForm.contacto.trim(),
        email: libreriaForm.email.trim(),
        telefono: libreriaForm.telefono.trim(),
        ciudad: libreriaForm.ciudad.trim(),
        direccion: libreriaForm.direccion.trim() || undefined,
        porcentajeComision: Number(libreriaForm.porcentajeComision) || 0,
        activo: true,
        observaciones: libreriaForm.observaciones.trim() || undefined,
      };
      setLibrerias(prev => [...prev, newLibreria]);
    }

    setModalLibreriaOpen(false);
    setFormError("");
  };

  const toggleActivoLibreria = (id: number) => {
    setLibrerias(prev => prev.map(l => (l.id === id ? { ...l, activo: !l.activo } : l)));
  };

  const handleDeleteLibreria = (id: number, nombre: string) => {
    if (confirm(`¿Estás seguro de eliminar la librería "${nombre}" del directorio?`)) {
      setLibrerias(prev => prev.filter(l => l.id !== id));
    }
  };

  // Handlers Proveedor
  const handleOpenNewProveedor = () => {
    setEditingProveedorId(null);
    setProveedorForm(emptyProveedorForm);
    setFormError("");
    setModalProveedorOpen(true);
  };

  const handleOpenEditProveedor = (p: Proveedor) => {
    setEditingProveedorId(p.id);
    setProveedorForm({
      nombre: p.nombre,
      codigoInterno: p.codigoInterno || "",
      email: p.email,
      telefono: p.telefono || "",
      ciudad: p.ciudad,
      categoria: p.categoria,
      contacto: p.contacto || "",
      condicionesPago: p.condicionesPago || "Consignación 60 días",
    });
    setFormError("");
    setModalProveedorOpen(true);
  };

  const handleSaveProveedor = () => {
    if (!proveedorForm.nombre.trim()) {
      setFormError("El nombre de la editorial o proveedor es obligatorio.");
      return;
    }
    if (!proveedorForm.email.trim() || !proveedorForm.email.includes("@")) {
      setFormError("Ingresa un correo electrónico válido.");
      return;
    }

    if (editingProveedorId !== null) {
      setProveedores(prev =>
        prev.map(p =>
          p.id === editingProveedorId
            ? {
                ...p,
                nombre: proveedorForm.nombre.trim(),
                codigoInterno: proveedorForm.codigoInterno.trim() || undefined,
                email: proveedorForm.email.trim(),
                telefono: proveedorForm.telefono.trim() || undefined,
                ciudad: proveedorForm.ciudad.trim() || "—",
                categoria: proveedorForm.categoria.trim() || "General",
                contacto: proveedorForm.contacto.trim() || undefined,
                condicionesPago: proveedorForm.condicionesPago.trim() || undefined,
              }
            : p
        )
      );
    } else {
      const newId = Math.max(0, ...proveedores.map(p => p.id)) + 1;
      const nuevoProv: Proveedor = {
        id: newId,
        nombre: proveedorForm.nombre.trim(),
        codigoInterno: proveedorForm.codigoInterno.trim() || undefined,
        email: proveedorForm.email.trim(),
        telefono: proveedorForm.telefono.trim() || undefined,
        ciudad: proveedorForm.ciudad.trim() || "—",
        categoria: proveedorForm.categoria.trim() || "General",
        contacto: proveedorForm.contacto.trim() || undefined,
        condicionesPago: proveedorForm.condicionesPago.trim() || undefined,
        activo: true,
      };
      setProveedores(prev => [...prev, nuevoProv]);
    }

    setModalProveedorOpen(false);
    setFormError("");
  };

  const toggleActivoProveedor = (id: number) => {
    setProveedores(prev => prev.map(p => (p.id === id ? { ...p, activo: !p.activo } : p)));
  };

  const handleDeleteProveedor = (id: number, nombre: string) => {
    if (confirm(`¿Estás seguro de eliminar el proveedor "${nombre}" del directorio?`)) {
      setProveedores(prev => prev.filter(p => p.id !== id));
    }
  };

  // Filtrado de listas según término de búsqueda (Memoizado)
  const filteredLibrerias = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return librerias.filter(
      l =>
        l.nombre.toLowerCase().includes(term) ||
        l.alias.toLowerCase().includes(term) ||
        l.contacto.toLowerCase().includes(term) ||
        l.ciudad.toLowerCase().includes(term) ||
        l.email.toLowerCase().includes(term)
    );
  }, [librerias, searchTerm]);

  const filteredProveedores = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return proveedores.filter(
      p =>
        p.nombre.toLowerCase().includes(term) ||
        (p.contacto && p.contacto.toLowerCase().includes(term)) ||
        p.ciudad.toLowerCase().includes(term) ||
        p.categoria.toLowerCase().includes(term) ||
        p.email.toLowerCase().includes(term)
    );
  }, [proveedores, searchTerm]);

  return (
    <div className="space-y-4">
      {/* HEADER PRINCIPAL Y METRICAS */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-purple-100 text-purple-800 rounded-xl">
                <Layers size={18} />
              </span>
              <div>
                <h1 className="text-base font-bold text-gray-900">Directorio General de Librerías y Proveedores</h1>
                <p className="text-xs text-gray-500">
                  Estructura jerárquica editable de Trama, Red de Librerías Aliadas y Editoriales/Proveedores.
                </p>
              </div>
            </div>
          </div>

          <div className="relative min-w-[200px] sm:min-w-[260px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar entidad, contacto o email..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-purple-500 focus:bg-white"
            />
          </div>
        </div>

        {/* NAVEGACION JERARQUICA PESTAÑAS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
          {/* BOTON TAB 1: TRAMA */}
          <button
            onClick={() => setActiveTab("trama")}
            className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
              activeTab === "trama"
                ? "bg-purple-900 text-white border-purple-900 shadow-xs"
                : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div
                className={`p-2 rounded-lg ${
                  activeTab === "trama" ? "bg-purple-800 text-purple-200" : "bg-purple-50 text-purple-700"
                }`}
              >
                <Building size={16} />
              </div>
              <div>
                <p className="text-xs font-bold">1. Casa Matriz (Trama)</p>
                <p className={`text-[10px] ${activeTab === "trama" ? "text-purple-200" : "text-gray-400"}`}>
                  Administración Central
                </p>
              </div>
            </div>
            <span
              className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                activeTab === "trama" ? "bg-purple-800 text-purple-100" : "bg-gray-100 text-gray-600"
              }`}
            >
              Central
            </span>
          </button>

          {/* BOTON TAB 2: LIBRERIAS ALIADAS */}
          <button
            onClick={() => setActiveTab("librerias")}
            className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
              activeTab === "librerias"
                ? "bg-purple-900 text-white border-purple-900 shadow-xs"
                : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div
                className={`p-2 rounded-lg ${
                  activeTab === "librerias" ? "bg-purple-800 text-purple-200" : "bg-blue-50 text-blue-700"
                }`}
              >
                <Store size={16} />
              </div>
              <div>
                <p className="text-xs font-bold">2. Librerías Aliadas</p>
                <p className={`text-[10px] ${activeTab === "librerias" ? "text-purple-200" : "text-gray-400"}`}>
                  Puntos de Venta & Consignación
                </p>
              </div>
            </div>
            <span
              className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                activeTab === "librerias" ? "bg-purple-800 text-purple-100" : "bg-blue-100 text-blue-800"
              }`}
            >
              {librerias.length}
            </span>
          </button>

          {/* BOTON TAB 3: PROVEEDORES & EDITORIALES */}
          <button
            onClick={() => setActiveTab("proveedores")}
            className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
              activeTab === "proveedores"
                ? "bg-purple-900 text-white border-purple-900 shadow-xs"
                : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div
                className={`p-2 rounded-lg ${
                  activeTab === "proveedores" ? "bg-purple-800 text-purple-200" : "bg-emerald-50 text-emerald-700"
                }`}
              >
                <Truck size={16} />
              </div>
              <div>
                <p className="text-xs font-bold">3. Proveedores / Editoriales</p>
                <p className={`text-[10px] ${activeTab === "proveedores" ? "text-purple-200" : "text-gray-400"}`}>
                  Adquisiciones y Distribuidores
                </p>
              </div>
            </div>
            <span
              className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                activeTab === "proveedores" ? "bg-purple-800 text-purple-100" : "bg-emerald-100 text-emerald-800"
              }`}
            >
              {proveedores.length}
            </span>
          </button>
        </div>
      </div>

      {/* CONTENIDO DE TAB 1: TRAMA */}
      {activeTab === "trama" && (
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2">
              <Building className="text-purple-700" size={20} />
              <div>
                <h2 className="text-sm font-extrabold text-gray-900">Configuración & Ficha Institucional de Trama</h2>
                <p className="text-xs text-gray-400">
                  Casa Matriz, centro administrativo y porcentajes de utilidad base
                </p>
              </div>
            </div>
            <Btn onClick={() => { setTramaForm(tramaInfo); setFormError(""); setModalTramaOpen(true); }} variant="primary">
              <Edit3 size={13} /> Editar Datos de Trama
            </Btn>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div className="p-3.5 bg-purple-50/50 rounded-xl border border-purple-100 space-y-1">
              <span className="text-purple-600 font-bold block text-[11px] uppercase tracking-wider">
                Empresa / Razón Social
              </span>
              <p className="text-sm font-extrabold text-gray-900">{tramaInfo.nombre}</p>
              <p className="text-gray-500 font-mono">RUT: {tramaInfo.rut}</p>
            </div>

            <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-100 space-y-1">
              <span className="text-gray-400 font-bold block text-[11px] uppercase tracking-wider">
                Dirección & Ubicación
              </span>
              <p className="font-bold text-gray-800 flex items-center gap-1.5">
                <MapPin size={13} className="text-purple-600 shrink-0" />
                {tramaInfo.direccion}
              </p>
              <p className="text-gray-500 pl-4.5">{tramaInfo.ciudad}, Chile</p>
            </div>

            <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-100 space-y-1">
              <span className="text-gray-400 font-bold block text-[11px] uppercase tracking-wider">
                Contacto Principal
              </span>
              <p className="font-bold text-gray-800">{tramaInfo.contacto}</p>
              <p className="text-blue-600 flex items-center gap-1">
                <Mail size={12} /> {tramaInfo.email}
              </p>
              <p className="text-gray-600 flex items-center gap-1">
                <Phone size={12} /> {tramaInfo.telefono}
              </p>
            </div>

            <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-100 space-y-1">
              <span className="text-gray-400 font-bold block text-[11px] uppercase tracking-wider">
                Comisión Utilidad Estándar
              </span>
              <div className="flex items-center gap-2">
                <span className="text-lg font-extrabold text-purple-900 font-mono">
                  {tramaInfo.porcentajeComisionStandard}%
                </span>
                <span className="text-gray-500 text-[11px]">
                  (Retención base Trama para gestión e inventario)
                </span>
              </div>
            </div>

            <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-100 space-y-1">
              <span className="text-gray-400 font-bold block text-[11px] uppercase tracking-wider">
                Sitio Web & Redes
              </span>
              <p className="font-semibold text-purple-700 flex items-center gap-1">
                <Globe size={13} /> {tramaInfo.sitioWeb || "www.tramalibros.cl"}
              </p>
            </div>

            <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-100 space-y-1">
              <span className="text-gray-400 font-bold block text-[11px] uppercase tracking-wider">
                Estado & Observaciones
              </span>
              <Badge variant="green">Operativo / Casa Matriz</Badge>
              <p className="text-gray-500 text-[11px] italic pt-1">{tramaInfo.observaciones}</p>
            </div>
          </div>
        </div>
      )}

      {/* CONTENIDO DE TAB 2: LIBRERIAS ALIADAS */}
      {activeTab === "librerias" && (
        <div className="bg-white rounded-2xl border border-gray-200/80 overflow-hidden shadow-2xs">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <div>
              <span className="text-sm font-bold text-gray-900">Directorio de Librerías Aliadas</span>
              <p className="text-xs text-gray-400">
                Puntos de venta independientes y consiganatarias registradas en la Red Trama
              </p>
            </div>
            <Btn onClick={handleOpenNewLibreria} variant="primary">
              <Plus size={13} /> Nueva Librería Aliada
            </Btn>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs min-w-[700px]">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-gray-400 font-medium text-left">
                  <th className="px-4 py-2.5">Librería / Nombre</th>
                  <th className="px-4 py-2.5">Alias (Filtro)</th>
                  <th className="px-4 py-2.5">Contacto & Email</th>
                  <th className="px-4 py-2.5">Teléfono & Ubicación</th>
                  <th className="px-4 py-2.5">Comisión (%)</th>
                  <th className="px-4 py-2.5">Estado</th>
                  <th className="px-4 py-2.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredLibrerias.map(lib => (
                  <tr key={lib.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-bold text-gray-900">{lib.nombre}</p>
                      {lib.observaciones && <p className="text-[10px] text-gray-400 italic">{lib.observaciones}</p>}
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-purple-900 bg-purple-50/70 px-2 py-0.5 rounded w-fit">
                      {lib.alias}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="font-semibold text-gray-700">{lib.contacto}</span>
                        <span className="text-blue-600 flex items-center gap-1">
                          <Mail size={11} /> {lib.email}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      <div className="flex flex-col">
                        <span className="flex items-center gap-1 font-medium text-gray-700">
                          <Phone size={11} /> {lib.telefono}
                        </span>
                        <span className="flex items-center gap-1 text-[11px] text-gray-400">
                          <MapPin size={11} /> {lib.ciudad} {lib.direccion ? `(${lib.direccion})` : ""}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-extrabold text-purple-900 font-mono bg-purple-50 border border-purple-100 px-2 py-0.5 rounded-lg">
                        {lib.porcentajeComision}%
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={lib.activo ? "green" : "gray"}>
                        {lib.activo ? "Activo" : "Inactivo"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEditLibreria(lib)}
                          className="p-1.5 text-gray-500 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer"
                          title="Editar Librería"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => toggleActivoLibreria(lib.id)}
                          className="text-gray-500 hover:text-gray-800 transition-colors inline-flex items-center"
                          title={lib.activo ? "Desactivar" : "Activar"}
                        >
                          {lib.activo ? (
                            <ToggleRight size={22} className="text-green-600" />
                          ) : (
                            <ToggleLeft size={22} className="text-gray-300" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDeleteLibreria(lib.id, lib.nombre)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Eliminar Librería"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredLibrerias.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-6 text-gray-400 text-xs">
                      No se encontraron librerías aliadas registradas.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CONTENIDO DE TAB 3: PROVEEDORES / EDITORIALES */}
      {activeTab === "proveedores" && (
        <div className="bg-white rounded-2xl border border-gray-200/80 overflow-hidden shadow-2xs">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <div>
              <span className="text-sm font-bold text-gray-900">Directorio de Editoriales y Proveedores</span>
              <p className="text-xs text-gray-400">
                Proveedores externos para la adquisición directa y consignación de libros
              </p>
            </div>
            <Btn onClick={handleOpenNewProveedor} variant="primary">
              <Plus size={13} /> Nuevo Proveedor / Editorial
            </Btn>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs min-w-[700px]">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-gray-400 font-medium text-left">
                  <th className="px-4 py-2.5">Proveedor / Editorial</th>
                  <th className="px-4 py-2.5">Cód. Interno</th>
                  <th className="px-4 py-2.5">Contacto & Email</th>
                  <th className="px-4 py-2.5">Teléfono & Ciudad</th>
                  <th className="px-4 py-2.5">Categoría</th>
                  <th className="px-4 py-2.5">Condiciones</th>
                  <th className="px-4 py-2.5">Estado</th>
                  <th className="px-4 py-2.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredProveedores.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-4 py-3 font-bold text-gray-900">{p.nombre}</td>
                    <td className="px-4 py-3 font-mono">
                      {p.codigoInterno ? (
                        <span className="px-2 py-0.5 bg-purple-50 text-purple-900 border border-purple-200 rounded-md text-[11px] font-bold">
                          {p.codigoInterno}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        {p.contacto && <span className="font-semibold text-gray-700">{p.contacto}</span>}
                        <span className="text-blue-600 flex items-center gap-1">
                          <Mail size={11} /> {p.email}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      <div className="flex flex-col">
                        {p.telefono ? (
                          <span className="flex items-center gap-1 font-medium text-gray-700">
                            <Phone size={11} /> {p.telefono}
                          </span>
                        ) : (
                          "—"
                        )}
                        <span className="flex items-center gap-1 text-[11px] text-gray-400">
                          <MapPin size={11} /> {p.ciudad}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="blue">{p.categoria}</Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-600 font-medium">
                      {p.condicionesPago || "Consignación 60 días"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={p.activo ? "green" : "gray"}>
                        {p.activo ? "Activo" : "Inactivo"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEditProveedor(p)}
                          className="p-1.5 text-gray-500 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer"
                          title="Editar Proveedor"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => toggleActivoProveedor(p.id)}
                          className="text-gray-500 hover:text-gray-800 transition-colors inline-flex items-center"
                          title={p.activo ? "Desactivar" : "Activar"}
                        >
                          {p.activo ? (
                            <ToggleRight size={22} className="text-green-600" />
                          ) : (
                            <ToggleLeft size={22} className="text-gray-300" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDeleteProveedor(p.id, p.nombre)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Eliminar Proveedor"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredProveedores.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-6 text-gray-400 text-xs">
                      No se encontraron proveedores o editoriales registradas.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: EDITAR TRAMA */}
      {modalTramaOpen && (
        <Modal
          title="Editar Datos Institucionales de Trama (Casa Matriz)"
          onClose={() => setModalTramaOpen(false)}
          footer={
            <>
              <Btn onClick={() => setModalTramaOpen(false)}>Cancelar</Btn>
              <Btn onClick={handleSaveTrama} variant="primary">
                <CheckCircle size={13} /> Guardar Cambios Trama
              </Btn>
            </>
          }
        >
          <div className="space-y-3">
            {formError && (
              <p className="text-xs text-red-600 bg-red-50 p-2 rounded-lg border border-red-100 font-semibold">
                {formError}
              </p>
            )}
            <Input
              label="Nombre de la Empresa / Marca *"
              value={tramaForm.nombre}
              onChange={(e: any) => setTramaForm({ ...tramaForm, nombre: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="RUT / ID Fiscal"
                value={tramaForm.rut}
                onChange={(e: any) => setTramaForm({ ...tramaForm, rut: e.target.value })}
              />
              <Input
                label="% Comisión Standard Trama (%)"
                type="number"
                value={String(tramaForm.porcentajeComisionStandard)}
                onChange={(e: any) =>
                  setTramaForm({ ...tramaForm, porcentajeComisionStandard: Number(e.target.value) || 0 })
                }
              />
            </div>
            <Input
              label="Dirección Central *"
              value={tramaForm.direccion}
              onChange={(e: any) => setTramaForm({ ...tramaForm, direccion: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Ciudad / Región"
                value={tramaForm.ciudad}
                onChange={(e: any) => setTramaForm({ ...tramaForm, ciudad: e.target.value })}
              />
              <Input
                label="Teléfono Principal"
                value={tramaForm.telefono}
                onChange={(e: any) => setTramaForm({ ...tramaForm, telefono: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Email de Contacto *"
                type="email"
                value={tramaForm.email}
                onChange={(e: any) => setTramaForm({ ...tramaForm, email: e.target.value })}
              />
              <Input
                label="Persona Encargada / Contacto"
                value={tramaForm.contacto}
                onChange={(e: any) => setTramaForm({ ...tramaForm, contacto: e.target.value })}
              />
            </div>
            <Input
              label="Sitio Web / Redes"
              value={tramaForm.sitioWeb || ""}
              onChange={(e: any) => setTramaForm({ ...tramaForm, sitioWeb: e.target.value })}
              placeholder="www.tramalibros.cl"
            />
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">
                Observaciones / Notas de Casa Matriz
              </label>
              <textarea
                value={tramaForm.observaciones || ""}
                onChange={e => setTramaForm({ ...tramaForm, observaciones: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl outline-none focus:border-purple-500 min-h-[60px]"
              />
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL 2: CREAR / EDITAR LIBRERIA */}
      {modalLibreriaOpen && (
        <Modal
          title={editingLibreriaId ? "Editar Librería Aliada" : "Agregar Nueva Librería Aliada"}
          onClose={() => setModalLibreriaOpen(false)}
          footer={
            <>
              <Btn onClick={() => setModalLibreriaOpen(false)}>Cancelar</Btn>
              <Btn onClick={handleSaveLibreria} variant="primary">
                <CheckCircle size={13} /> {editingLibreriaId ? "Guardar Cambios" : "Crear Librería"}
              </Btn>
            </>
          }
        >
          <div className="space-y-3">
            {formError && (
              <p className="text-xs text-red-600 bg-red-50 p-2 rounded-lg border border-red-100 font-semibold">
                {formError}
              </p>
            )}
            <Input
              label="Nombre Comercial de la Librería *"
              value={libreriaForm.nombre}
              onChange={(e: any) => setLibreriaForm({ ...libreriaForm, nombre: e.target.value })}
              placeholder="Ej: Librería Mar de Dudas"
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Alias Corto (Filtro en POS/Stock) *"
                value={libreriaForm.alias}
                onChange={(e: any) => setLibreriaForm({ ...libreriaForm, alias: e.target.value })}
                placeholder="Ej: Mar de Dudas"
              />
              <Input
                label="% Comisión Librería (%)"
                type="number"
                value={String(libreriaForm.porcentajeComision)}
                onChange={(e: any) => setLibreriaForm({ ...libreriaForm, porcentajeComision: Number(e.target.value) || 0 })}
                placeholder="30"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Persona de Contacto"
                value={libreriaForm.contacto}
                onChange={(e: any) => setLibreriaForm({ ...libreriaForm, contacto: e.target.value })}
                placeholder="Ej: Camila Henríquez"
              />
              <Input
                label="Email *"
                type="email"
                value={libreriaForm.email}
                onChange={(e: any) => setLibreriaForm({ ...libreriaForm, email: e.target.value })}
                placeholder="contacto@libreria.cl"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Teléfono"
                value={libreriaForm.telefono}
                onChange={(e: any) => setLibreriaForm({ ...libreriaForm, telefono: e.target.value })}
                placeholder="+56 9..."
              />
              <Input
                label="Ciudad"
                value={libreriaForm.ciudad}
                onChange={(e: any) => setLibreriaForm({ ...libreriaForm, ciudad: e.target.value })}
                placeholder="Valparaíso"
              />
            </div>
            <Input
              label="Dirección Física"
              value={libreriaForm.direccion}
              onChange={(e: any) => setLibreriaForm({ ...libreriaForm, direccion: e.target.value })}
              placeholder="Ej: Av. Brasil 123"
            />
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Observaciones</label>
              <textarea
                value={libreriaForm.observaciones}
                onChange={e => setLibreriaForm({ ...libreriaForm, observaciones: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl outline-none focus:border-purple-500 min-h-[50px]"
                placeholder="Detalles de convenio o entrega de catálogo..."
              />
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL 3: CREAR / EDITAR PROVEEDOR */}
      {modalProveedorOpen && (
        <Modal
          title={editingProveedorId ? "Editar Editorial / Proveedor" : "Agregar Editorial / Proveedor"}
          onClose={() => setModalProveedorOpen(false)}
          footer={
            <>
              <Btn onClick={() => setModalProveedorOpen(false)}>Cancelar</Btn>
              <Btn onClick={handleSaveProveedor} variant="primary">
                <CheckCircle size={13} /> {editingProveedorId ? "Guardar Cambios" : "Guardar Proveedor"}
              </Btn>
            </>
          }
        >
          <div className="space-y-3">
            {formError && (
              <p className="text-xs text-red-600 bg-red-50 p-2 rounded-lg border border-red-100 font-semibold">
                {formError}
              </p>
            )}
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Nombre de Editorial / Proveedor *"
                value={proveedorForm.nombre}
                onChange={(e: any) => setProveedorForm({ ...proveedorForm, nombre: e.target.value })}
                placeholder="Ej: Editorial Planeta Chile"
              />
              <Input
                label="Código Interno de Proveedor(a)"
                value={proveedorForm.codigoInterno}
                onChange={(e: any) => setProveedorForm({ ...proveedorForm, codigoInterno: e.target.value })}
                placeholder="Ej: PROV-PLN-01"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Persona de Contacto"
                value={proveedorForm.contacto}
                onChange={(e: any) => setProveedorForm({ ...proveedorForm, contacto: e.target.value })}
                placeholder="Ej: Loreto Morales"
              />
              <Input
                label="Correo Electrónico *"
                type="email"
                value={proveedorForm.email}
                onChange={(e: any) => setProveedorForm({ ...proveedorForm, email: e.target.value })}
                placeholder="ventas@editorial.cl"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Teléfono"
                value={proveedorForm.telefono}
                onChange={(e: any) => setProveedorForm({ ...proveedorForm, telefono: e.target.value })}
                placeholder="+56 2..."
              />
              <Input
                label="Ciudad"
                value={proveedorForm.ciudad}
                onChange={(e: any) => setProveedorForm({ ...proveedorForm, ciudad: e.target.value })}
                placeholder="Santiago"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Categoría Principal"
                value={proveedorForm.categoria}
                onChange={(e: any) => setProveedorForm({ ...proveedorForm, categoria: e.target.value })}
                placeholder="Ej: Novela / Ensayo"
              />
              <Input
                label="Condiciones de Pago / Consignación"
                value={proveedorForm.condicionesPago}
                onChange={(e: any) => setProveedorForm({ ...proveedorForm, condicionesPago: e.target.value })}
                placeholder="Ej: Consignación 60 días"
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
