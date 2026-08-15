import React from "react";
import { X, BookOpen, Camera, Upload, Image as ImageIcon, Link as LinkIcon, Trash2, ChevronDown, ChevronUp, Check, Search } from "lucide-react";
import { Book } from "../types";
import { catEmoji } from "../utils/helpers";

export function Badge({ children, variant = "gray", className = "" }: { children: React.ReactNode; variant?: string; className?: string }) {
  const variants: Record<string, string> = {
    green: "bg-green-100 text-green-700",
    red: "bg-red-100 text-red-700",
    amber: "bg-amber-100 text-amber-700",
    blue: "bg-blue-100 text-blue-700",
    gray: "bg-gray-100 text-gray-600",
    purple: "bg-purple-100 text-purple-700",
  };
  return (
    <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${variants[variant] || variants.gray} ${className}`}>
      {children}
    </span>
  );
}

export function StockBadge({ stock, min }: { stock: number; min: number }) {
  if (stock === 0) return <Badge variant="red">Agotado</Badge>;
  if (stock <= min) return <Badge variant="amber">Stock bajo</Badge>;
  return <Badge variant="green">OK</Badge>;
}

export function getBookCoverGradient(category: string = "") {
  const cat = (category || "").toLowerCase();
  if (cat.includes("novela")) {
    return {
      bg: "bg-gradient-to-br from-rose-950 via-rose-900 to-amber-950 text-rose-50",
      accent: "border-amber-400/30 text-amber-300",
      tag: "bg-rose-900/80 text-rose-200 border-rose-700/50"
    };
  }
  if (cat.includes("infantil") || cat.includes("juvenil")) {
    return {
      bg: "bg-gradient-to-br from-amber-600 via-orange-600 to-yellow-700 text-amber-50",
      accent: "border-yellow-200/40 text-yellow-100",
      tag: "bg-amber-800/80 text-amber-100 border-amber-500/50"
    };
  }
  if (cat.includes("ficción") || cat.includes("fantasia") || cat.includes("sci-fi")) {
    return {
      bg: "bg-gradient-to-br from-slate-950 via-indigo-950 to-blue-900 text-indigo-50",
      accent: "border-indigo-400/30 text-indigo-200",
      tag: "bg-indigo-900/80 text-indigo-200 border-indigo-700/50"
    };
  }
  if (cat.includes("misterio") || cat.includes("terror") || cat.includes("thriller")) {
    return {
      bg: "bg-gradient-to-br from-zinc-950 via-stone-900 to-neutral-950 text-zinc-100",
      accent: "border-red-500/40 text-red-300",
      tag: "bg-zinc-900/90 text-red-200 border-red-900/50"
    };
  }
  if (cat.includes("clásico") || cat.includes("historia") || cat.includes("poesía")) {
    return {
      bg: "bg-gradient-to-br from-amber-950 via-yellow-950 to-stone-900 text-amber-100",
      accent: "border-amber-300/40 text-amber-200",
      tag: "bg-amber-900/80 text-amber-200 border-amber-700/50"
    };
  }
  return {
    bg: "bg-gradient-to-br from-purple-950 via-indigo-900 to-slate-900 text-purple-50",
    accent: "border-purple-300/30 text-purple-200",
    tag: "bg-purple-900/80 text-purple-200 border-purple-700/50"
  };
}
export function CoverBox({
  book,
  className = "w-16 h-24",
  emojiSize = "text-xl",
  showEffect = false,
  interactive = false,
}: {
  book: Book;
  className?: string;
  emojiSize?: string;
  showEffect?: boolean;
  interactive?: boolean;
}) {
  const coverStyle = getBookCoverGradient(book.categoria);

  return (
    <div
      className={`relative ${className} overflow-hidden shrink-0 bg-white select-none group/cover rounded-none border-none shadow-none ${
        interactive ? "transition-all duration-300 transform-gpu hover:-translate-y-0.5" : ""
      }`}
      style={{ borderRadius: "0px", backgroundColor: "#ffffff", borderStyle: "none", borderWidth: "0px", boxShadow: "none" }}
    >
      {/* PORTADA (FRENTE) */}
      {book.portada ? (
        <img
          src={book.portada}
          alt={book.titulo}
          className="w-full h-full object-cover object-center rounded-none bg-white border-none shadow-none"
          style={{ borderRadius: "0px", backgroundColor: "#ffffff", borderStyle: "none", borderWidth: "0px", boxShadow: "none" }}
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
      ) : (
        <div className={`w-full h-full p-2 flex flex-col justify-between ${coverStyle.bg} relative z-10 transition-all duration-300 ease-in-out`}>
          <div className={`border-b ${coverStyle.accent} pb-1 flex items-center justify-between`}>
            <span className="text-[7px] tracking-widest uppercase font-mono opacity-80 truncate">
              {book.editorial || "TRAMA"}
            </span>
          </div>

          <div className="my-auto py-0.5">
            <h5 className="font-extrabold text-[10px] leading-tight line-clamp-3 tracking-tight font-serif">
              {book.titulo}
            </h5>
            <p className="text-[8px] font-medium opacity-85 mt-0.5 line-clamp-1 italic">
              {book.autor}
            </p>
          </div>

          <div className="pt-0.5 border-t border-white/10 flex items-center justify-between text-[7px]">
            <span className={`px-1 py-0.2 rounded text-[7px] font-bold border ${coverStyle.tag}`}>
              {book.editorial || book.categoria || "Editorial"}
            </span>
            <span className="font-mono opacity-70">{book.tipoPortada || "Libro"}</span>
          </div>
        </div>
      )}
    </div>
  );
}

const PRESET_COVERS = [
  { name: "Cien Años de Soledad", url: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=800" },
  { name: "El Principito", url: "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=800" },
  { name: "1984 / Ficción", url: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=800" },
  { name: "Rayuela", url: "https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&q=80&w=800" },
  { name: "Sombra del Viento", url: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=800" },
  { name: "Harry Potter / Infantil", url: "https://images.unsplash.com/photo-1626618012641-bfbca5a31239?auto=format&fit=crop&q=80&w=800" },
  { name: "Sapiens / Ensayo", url: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&q=80&w=800" },
  { name: "Don Quijote / Clásico", url: "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&q=80&w=800" },
  { name: "Arte & Poesía", url: "https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&q=80&w=800" },
  { name: "Filosofía / Novela", url: "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&q=80&w=800" },
];

export function PortadaPicker({
  value,
  onChange,
  placeholderLabel = "Portada",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholderLabel?: string;
}) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [viewMode, setViewMode] = React.useState<"menu" | "galeria" | "enlace">("menu");
  const [customUrl, setCustomUrl] = React.useState("");
  const inputId = React.useId();

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      onChange(reader.result as string);
      setIsOpen(false);
      setViewMode("menu");
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const applyUrl = () => {
    if (customUrl.trim()) {
      onChange(customUrl.trim());
      setCustomUrl("");
      setIsOpen(false);
      setViewMode("menu");
    }
  };

  return (
    <>
      {/* CUADRO DE FOTO UNICO EN COLUMNA - SIN TITULOS NI BOTONES FUERA */}
      <div
        onClick={() => {
          setIsOpen(true);
          setViewMode("menu");
        }}
        className="w-full h-52 sm:h-60 overflow-hidden bg-white cursor-pointer relative group flex items-center justify-center transition-all select-none rounded-none border-none shadow-none"
        style={{
          borderRadius: "0px",
          backgroundColor: "#ffffff",
          borderStyle: "none",
          borderWidth: "0px",
          boxShadow: "none",
        }}
        title={`Clic para opciones de ${placeholderLabel}`}
      >
        {value ? (
          <>
            <img
              src={value}
              alt={placeholderLabel}
              className="w-full h-full object-cover rounded-none bg-white border-none shadow-none"
              style={{ borderRadius: "0px", backgroundColor: "#ffffff", borderStyle: "none", borderWidth: "0px", boxShadow: "none" }}
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-1.5 p-2 text-center">
              <Camera size={22} className="text-white" />
              <span className="text-xs font-bold">Cambiar {placeholderLabel}</span>
              <span className="text-[10px] text-gray-200">Clic para opciones</span>
            </div>
          </>
        ) : (
          <div
            className="w-full h-full flex flex-col items-center justify-center p-3 text-center text-gray-400 space-y-1.5 hover:text-purple-600 transition-colors bg-white border-none"
            style={{ backgroundColor: "#ffffff", borderColor: "#ffffff", borderStyle: "none" }}
          >
            <BookOpen size={32} className="text-gray-400 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold text-gray-600">{placeholderLabel}</span>
            <span className="text-[10px] text-purple-600 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200 font-medium">
              Clic para agregar
            </span>
          </div>
        )}
      </div>

      {/* POPUP DE OPCIONES AL CLICAR */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="bg-white rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-2xl border border-purple-100 animate-in zoom-in-95 duration-150"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
              <h3 className="text-sm font-extrabold text-gray-900 flex items-center gap-2">
                <Camera size={16} className="text-purple-700" />
                <span>Opciones de Foto ({placeholderLabel})</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-2.5">
              {/* 1. SUBIR FOTO */}
              <input
                id={inputId}
                type="file"
                accept="image/*"
                onChange={handleFile}
                className="hidden"
              />
              <label
                htmlFor={inputId}
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-purple-200 bg-purple-50/70 hover:bg-purple-100 cursor-pointer font-bold text-purple-950 transition-all text-xs"
              >
                <div className="p-2 bg-purple-600 text-white rounded-lg shrink-0 shadow-2xs">
                  <Upload size={18} />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-extrabold text-sm text-purple-950">Subir Foto</div>
                  <div className="text-[10px] text-purple-700 font-normal">Cargar desde dispositivo o cámara</div>
                </div>
              </label>

              {/* 2. GALERÍA */}
              <button
                type="button"
                onClick={() => setViewMode(viewMode === "galeria" ? "menu" : "galeria")}
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100 cursor-pointer font-bold text-indigo-950 transition-all text-xs text-left"
              >
                <div className="p-2 bg-indigo-600 text-white rounded-lg shrink-0 shadow-2xs">
                  <ImageIcon size={18} />
                </div>
                <div className="flex-1">
                  <div className="font-extrabold text-sm text-indigo-950">Galería</div>
                  <div className="text-[10px] text-indigo-700 font-normal">Elegir de portadas HD sugeridas</div>
                </div>
              </button>

              {/* GALERÍA DESPLEGABLE */}
              {viewMode === "galeria" && (
                <div className="p-2 bg-gray-50 rounded-xl border border-indigo-100 space-y-2 max-h-52 overflow-y-auto">
                  <span className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wider block px-1">
                    Selecciona una portada HD:
                  </span>
                  <div className="grid grid-cols-4 gap-2">
                    {PRESET_COVERS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          onChange(preset.url);
                          setIsOpen(false);
                          setViewMode("menu");
                        }}
                        className="group relative rounded-lg overflow-hidden border border-gray-200 hover:border-purple-600 hover:ring-2 hover:ring-purple-400 aspect-[2/3] transition-all bg-gray-100 cursor-pointer"
                        title={preset.name}
                      >
                        <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. ENLACE */}
              <button
                type="button"
                onClick={() => setViewMode(viewMode === "enlace" ? "menu" : "enlace")}
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 cursor-pointer font-bold text-gray-900 transition-all text-xs text-left"
              >
                <div className="p-2 bg-gray-800 text-white rounded-lg shrink-0 shadow-2xs">
                  <LinkIcon size={18} />
                </div>
                <div className="flex-1">
                  <div className="font-extrabold text-sm text-gray-900">Enlace</div>
                  <div className="text-[10px] text-gray-500 font-normal">Pegar dirección URL de la foto</div>
                </div>
              </button>

              {/* ENLACE DESPLEGABLE */}
              {viewMode === "enlace" && (
                <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
                  <span className="text-[10px] font-medium text-gray-600 block">Pega el enlace de la imagen:</span>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      placeholder="https://..."
                      value={customUrl}
                      onChange={e => setCustomUrl(e.target.value)}
                      className="flex-1 px-3 py-2 text-xs bg-white border border-gray-300 rounded-lg outline-none focus:border-purple-600"
                    />
                    <button
                      type="button"
                      onClick={applyUrl}
                      className="px-3 py-2 text-xs font-bold bg-purple-700 text-white rounded-lg hover:bg-purple-800 transition-all cursor-pointer"
                    >
                      Aplicar
                    </button>
                  </div>
                </div>
              )}

              {/* OPCIÓN PARA QUITAR FOTO SI EXISTE */}
              {value && (
                <button
                  type="button"
                  onClick={() => {
                    onChange("");
                    setIsOpen(false);
                    setViewMode("menu");
                  }}
                  className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl text-red-600 hover:bg-red-50 text-xs font-bold transition-all border border-red-100 cursor-pointer mt-2"
                >
                  <Trash2 size={15} /> Quitar foto actual
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function Modal({
  title,
  onClose,
  children,
  footer,
  maxWidth = "max-w-lg",
  closeOnBackdrop = true,
  hideCloseButton = false,
  isOpen,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string;
  closeOnBackdrop?: boolean;
  hideCloseButton?: boolean;
  isOpen?: boolean;
}) {
  if (isOpen === false) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-start sm:items-center justify-center p-2 sm:p-4"
      onClick={closeOnBackdrop ? onClose : undefined}
    >
      <div
        className={`bg-white rounded-2xl border border-slate-200/90 w-full ${maxWidth} my-3 sm:my-0 max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-3rem)] flex flex-col shadow-2xl overflow-hidden`}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-slate-100 shrink-0 bg-slate-50/90">
          <h3 className="font-extrabold text-slate-900 text-sm sm:text-base flex items-center gap-2">{title}</h3>
          {!hideCloseButton && (
            <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-200/60 transition-colors cursor-pointer">
              <X size={18} />
            </button>
          )}
        </div>
        <div className="overflow-y-auto px-4 sm:px-6 py-4 flex-1 min-h-0 space-y-4">{children}</div>
        {footer && <div className="px-4 sm:px-6 py-3 border-t border-slate-100 flex justify-end gap-2 shrink-0 bg-slate-50/90">{footer}</div>}
      </div>
    </div>
  );
}

export function Btn({ children, onClick, variant = "outline", size = "sm", className = "", disabled = false, type = "button", title, style }: { children: React.ReactNode; onClick?: () => void; variant?: "outline" | "primary" | "danger" | "success" | "purple" | "emerald" | "black"; size?: "sm" | "md"; className?: string; disabled?: boolean; type?: "button" | "submit" | "reset"; title?: string; style?: React.CSSProperties }) {
  const base = "inline-flex items-center justify-center gap-1.5 font-bold rounded-xl transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none";
  const sizes = { sm: "text-xs px-3.5 py-1.5", md: "text-sm px-4 py-2" };
  const variants = {
    outline: "border border-stone-300 bg-white hover:bg-purple-50 text-stone-800 shadow-2xs hover:border-purple-300",
    primary: "bg-purple-900 hover:bg-purple-950 text-white font-extrabold border-0 shadow-xs transition-all",
    danger: "bg-red-800 hover:bg-red-900 text-white font-extrabold border-0 shadow-xs transition-all",
    success: "bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold border-0 shadow-xs transition-all",
    purple: "bg-purple-800 hover:bg-purple-900 text-white font-extrabold border-0 shadow-xs transition-all",
    emerald: "bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold border-0 shadow-xs transition-all",
    black: "bg-black hover:bg-stone-900 text-white font-extrabold border-0 shadow-xs transition-all",
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} title={title} className={`${base} ${sizes[size]} ${variants[variant] || variants.outline} ${className}`} style={style}>
      {children}
    </button>
  );
}

export function CategoriaMultiSelect({
  label = "Categoría / Género *",
  value = "",
  onChange,
}: {
  label?: string;
  value: string;
  onChange: (val: string) => void;
}) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isOtroActive, setIsOtroActive] = React.useState(false);
  const [otroValue, setOtroValue] = React.useState("");
  const [searchTerm, setSearchTerm] = React.useState("");
  const [customCategories, setCustomCategories] = React.useState<string[]>([]);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const categoriasPredefinidas = React.useMemo(() => [
    "Novela",
    "Infantil",
    "Ficción",
    "Misterio",
    "Clásicos",
    "No ficción",
    "Poesía",
    "Ensayo",
    "Arte / Diseño",
    "Comic / Manga",
    "Historia",
    "Filosofía",
    "Ciencia",
    "Cuento",
    "Biografía",
    "Autoayuda",
    "Cocina",
    "Viajes",
  ], []);

  const currentSelectedList = React.useMemo(() => {
    if (!value) return [];
    return value.split(",").map(s => s.trim()).filter(Boolean);
  }, [value]);

  // Sincronizar categorías personalizadas desde el valor recibido o estado
  React.useEffect(() => {
    const customItems = currentSelectedList.filter(
      item => !categoriasPredefinidas.includes(item)
    );
    if (customItems.length > 0) {
      setCustomCategories(prev => {
        const set = new Set([...prev, ...customItems]);
        return Array.from(set);
      });
    }
  }, [value, categoriasPredefinidas]);

  // Lista combinada con categorías predefinidas y personalizadas fijadas
  const allCategories = React.useMemo(() => {
    const set = new Set([...categoriasPredefinidas, ...customCategories]);
    return Array.from(set);
  }, [categoriasPredefinidas, customCategories]);

  // Cierre automático al hacer clic fuera del desplegable
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleCategory = (catName: string) => {
    let nextList = [...currentSelectedList];
    if (nextList.includes(catName)) {
      nextList = nextList.filter(c => c !== catName);
    } else {
      nextList.push(catName);
    }
    onChange(nextList.join(", "));
  };

  const handleAddCustom = () => {
    const trimmed = otroValue.trim();
    if (!trimmed) return;

    // Agregar a la lista fija si no existe
    if (!customCategories.includes(trimmed) && !categoriasPredefinidas.includes(trimmed)) {
      setCustomCategories(prev => [...prev, trimmed]);
    }

    // Seleccionar automáticamente la categoría
    if (!currentSelectedList.includes(trimmed)) {
      const nextList = [...currentSelectedList, trimmed];
      onChange(nextList.join(", "));
    }

    setOtroValue("");
  };

  const toggleOtro = () => {
    setIsOtroActive(!isOtroActive);
  };

  const filteredCategorias = allCategories.filter(c =>
    c.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-1.5 relative" ref={containerRef}>
      <label className="block text-xs font-bold text-gray-800">
        {label}
      </label>

      {/* Botón Gatillo / Campo del Desplegable */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left p-2.5 bg-white border border-gray-300 hover:border-purple-400 focus:border-purple-600 focus:ring-1 focus:ring-purple-600 rounded-xl outline-none text-xs transition-all flex items-center justify-between gap-2 shadow-2xs cursor-pointer min-h-[42px]"
      >
        <div className="flex flex-wrap items-center gap-1.5 flex-1 overflow-hidden">
          {currentSelectedList.length === 0 ? (
            <span className="text-gray-400 font-normal">Seleccionar categoría / género...</span>
          ) : (
            currentSelectedList.map(c => (
              <span
                key={c}
                className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded-lg text-xs font-semibold border border-purple-200"
              >
                {c}
              </span>
            ))
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0 text-gray-500">
          {currentSelectedList.length > 0 && (
            <span className="text-[10px] font-extrabold bg-purple-700 text-white px-1.5 py-0.5 rounded-full">
              {currentSelectedList.length}
            </span>
          )}
          {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {/* Menú Desplegable Popover */}
      {isOpen && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-2xl shadow-xl p-3 space-y-2.5 animate-in fade-in slide-in-from-top-1 duration-150 max-h-84 overflow-y-auto">
          {/* Buscador dentro del desplegable */}
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar categoría..."
              className="w-full text-xs pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:bg-white focus:border-purple-500 text-gray-800"
            />
          </div>

          {/* Opciones Categorías (Predefinidas + Personalizadas Fijadas) */}
          <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto p-1">
            {filteredCategorias.map((c) => {
              const isSelected = currentSelectedList.includes(c);
              const isCustom = !categoriasPredefinidas.includes(c);
              return (
                <button
                  type="button"
                  key={c}
                  onClick={() => toggleCategory(c)}
                  className={`text-xs px-2.5 py-1.5 rounded-xl border font-medium transition-all flex items-center gap-1.5 cursor-pointer select-none ${
                    isSelected
                      ? "bg-purple-700 text-white border-purple-800 shadow-2xs font-semibold"
                      : isCustom
                      ? "bg-purple-50 text-purple-900 border-purple-200 hover:bg-purple-100"
                      : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-purple-50 hover:border-purple-300"
                  }`}
                >
                  <span>{c}</span>
                  {isSelected && <Check size={13} className="stroke-[3]" />}
                </button>
              );
            })}

            {filteredCategorias.length === 0 && (
              <p className="text-xs text-gray-400 py-1 italic w-full">Sin coincidencia de categoría</p>
            )}
          </div>

          {/* Opción Otro Editable / Agregar Nueva Categoría */}
          <div className="pt-2 border-t border-gray-100 space-y-2">
            <button
              type="button"
              onClick={toggleOtro}
              className={`w-full text-xs px-2.5 py-1.5 rounded-xl border font-medium transition-all flex items-center justify-between cursor-pointer select-none ${
                isOtroActive
                  ? "bg-purple-100 text-purple-900 border-purple-300 font-bold"
                  : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-purple-50 hover:border-purple-300"
              }`}
            >
              <span>Agregar categoría personalizada / Otro</span>
              {isOtroActive && <Check size={14} className="text-purple-700 stroke-[3]" />}
            </button>

            {isOtroActive && (
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={otroValue}
                  onChange={(e) => setOtroValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddCustom();
                    }
                  }}
                  placeholder="Escribe categoría personalizada..."
                  className="flex-1 text-xs p-2.5 bg-white border border-purple-400 focus:border-purple-600 focus:ring-1 focus:ring-purple-600 rounded-xl outline-none text-gray-800 shadow-2xs font-medium"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleAddCustom}
                  className="px-3 py-2 text-xs font-bold bg-purple-700 hover:bg-purple-800 text-white rounded-xl shadow-2xs cursor-pointer shrink-0"
                >
                  Fijar y Seleccionar
                </button>
              </div>
            )}
          </div>

          {/* Botón Listo para cerrar */}
          <div className="pt-2 border-t border-gray-100 flex justify-end">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-3 py-1.5 text-xs font-bold bg-purple-700 hover:bg-purple-800 text-white rounded-xl shadow-2xs cursor-pointer"
            >
              Listo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function StatCard({ label, value, sub, icon: Icon, color = "text-gray-900" }: { label: string; value: string | number; sub?: string; icon?: any; color?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-2xs">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-medium text-gray-500">{label}</span>
        {Icon && <Icon size={16} className="text-gray-400" />}
      </div>
      <div className={`text-2xl font-bold tracking-tight ${color}`}>{value}</div>
      {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
    </div>
  );
}

export function Input({ label, ...props }: { label?: string; [key: string]: any }) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-xs font-semibold text-slate-700">{label}</label>}
      <input className="border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 bg-white transition-all shadow-2xs text-slate-900 placeholder:text-slate-400" {...props} />
    </div>
  );
}

export function Select({ label, children, ...props }: { label?: string; children: React.ReactNode; [key: string]: any }) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-xs font-semibold text-slate-700">{label}</label>}
      <select className="border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 bg-white transition-all shadow-2xs text-slate-900" {...props}>
        {children}
      </select>
    </div>
  );
}
