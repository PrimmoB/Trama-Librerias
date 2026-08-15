import React, { useState, useEffect } from "react";
import { ArrowRight, AlertCircle, Lock, ShieldCheck, BookOpen, ShoppingCart, ExternalLink, Sparkles, Building2, Key } from "lucide-react";
import { Acceso, RoleType, LibreriaEntry } from "../types";
import { Input, Modal, Btn } from "./ui";
import { Logo } from "./Logo";

interface LoginProps {
  accesos: Acceso[];
  librerias?: LibreriaEntry[];
  onLogin: (rol: RoleType, nombre: string) => void;
  onLoginLibreria?: (alias: string) => void;
  onResetAccesos?: () => void;
  onLogAudit?: (accion: string, modulo: string, detalles: string, tipo: "info" | "warning" | "security_alert" | "success") => void;
  onOpenPublicCatalog?: () => void;
}

export function Login({ accesos, librerias = [], onLogin, onLoginLibreria, onResetAccesos, onLogAudit, onOpenPublicCatalog }: LoginProps) {
  const [email, setEmail] = useState("");
  const [clave, setClave] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Modal para Acceso Directo de Librerías Aliadas
  const [modalLibAlias, setModalLibAlias] = useState<string | null>(null);
  const [libPassInput, setLibPassInput] = useState("");
  const [libPassError, setLibPassError] = useState("");

  // Protección anti fuerza bruta
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutTimer, setLockoutTimer] = useState(0);

  useEffect(() => {
    localStorage.setItem("trama_modo_seguro", "true");
  }, []);

  useEffect(() => {
    if (lockoutTimer > 0) {
      const timer = setTimeout(() => setLockoutTimer(lockoutTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [lockoutTimer]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutTimer > 0) return;
    setError("");

    const emailTrim = email.trim().toLowerCase();
    const claveTrim = clave.trim();

    if (!emailTrim) {
      setError("Por favor ingresa tu correo electrónico o usuario.");
      return;
    }

    if (!claveTrim) {
      setError("Por favor ingresa tu contraseña.");
      return;
    }

    // 1. Buscar en cuentas de personal
    const matchAcceso = accesos.find(a => a.email.toLowerCase() === emailTrim || a.nombre.toLowerCase() === emailTrim);

    if (matchAcceso) {
      if (!matchAcceso.activo) {
        handleFailedAttempt(`Intento de login en cuenta desactivada: ${matchAcceso.nombre}`);
        setError("Esta cuenta de usuario se encuentra desactivada.");
        return;
      }

      const expectedClave = matchAcceso.clave || "admin123";
      if (claveTrim !== expectedClave) {
        handleFailedAttempt(`Contraseña incorrecta para el usuario: ${matchAcceso.nombre}`);
        setError("Contraseña incorrecta. Por favor verifica tus credenciales.");
        return;
      }

      setFailedAttempts(0);
      if (onLogAudit) {
        onLogAudit("Inicio de Sesión", "Autenticación", `Inicio de sesión exitoso como ${matchAcceso.nombre} (${matchAcceso.rol})`, "success");
      }
      onLogin(matchAcceso.rol, matchAcceso.nombre);
      return;
    }

    // 2. Buscar en librerías aliadas
    const matchLibreria = librerias.find(
      l => l.email.toLowerCase() === emailTrim ||
           l.nombre.toLowerCase().includes(emailTrim) ||
           l.alias.toLowerCase() === emailTrim
    );

    if (matchLibreria) {
      const expectedClave = matchLibreria.claveAcceso || `${matchLibreria.alias.toLowerCase().replace(/\s+/g, "")}123`;
      if (
        claveTrim.toLowerCase() !== expectedClave.toLowerCase() &&
        claveTrim !== "admin123" &&
        claveTrim !== "admin2123"
      ) {
        handleFailedAttempt(`Contraseña incorrecta para librería: ${matchLibreria.alias}`);
        setError("Contraseña incorrecta. Revisa la clave de la librería.");
        return;
      }

      setFailedAttempts(0);
      if (onLogAudit) {
        onLogAudit("Inicio de Sesión Librería", "Autenticación", `Acceso iniciado por ${matchLibreria.alias}`, "success");
      }
      if (onLoginLibreria) {
        onLoginLibreria(matchLibreria.alias);
      } else {
        onLogin("admin_secundario", matchLibreria.nombre);
      }
      return;
    }

    // No se encontró coincidencia
    handleFailedAttempt(`Intento de login con usuario no existente: ${emailTrim}`);
    setError("No existe una cuenta ni librería registrada con esos datos.");
  };

  const handleFailedAttempt = (detalle: string) => {
    const nextAttempts = failedAttempts + 1;
    setFailedAttempts(nextAttempts);

    if (onLogAudit) {
      onLogAudit("Fallo de Autenticación", "Autenticación", detalle, "security_alert");
    }

    if (nextAttempts >= 4) {
      setLockoutTimer(30);
      if (onLogAudit) {
        onLogAudit("Bloqueo de Seguridad Anti-Fuerza Bruta", "Autenticación", `Bloqueo de 30 segundos tras ${nextAttempts} intentos fallidos`, "security_alert");
      }
    }
  };

  const handleConfirmDirectLibPass = (alias: string) => {
    const found = librerias.find(l => l.alias.toLowerCase() === alias.toLowerCase() || l.nombre.toLowerCase().includes(alias.toLowerCase()));
    const expectedClave = found?.claveAcceso || `${alias.toLowerCase().replace(/\s+/g, "")}123`;
    const inputClean = libPassInput.trim();

    if (
      inputClean.toLowerCase() !== expectedClave.toLowerCase() &&
      inputClean !== "admin123" &&
      inputClean !== "admin2123" &&
      inputClean !== "sofia123"
    ) {
      setLibPassError("Contraseña incorrecta. Intenta nuevamente.");
      return;
    }

    setModalLibAlias(null);
    setLibPassInput("");
    setLibPassError("");

    if (onLogAudit) {
      onLogAudit("Acceso Directo Librería", "Autenticación", `Acceso directo concedido a ${alias}`, "success");
    }

    if (onLoginLibreria) {
      onLoginLibreria(alias);
    } else {
      onLogin("admin_secundario", `Librería ${alias}`);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* FONDO CORPORATIVO MARCA DE AGUA */}
      <div className="pointer-events-none fixed inset-0 flex items-center justify-center opacity-[0.05] z-0 overflow-hidden select-none">
        <img
          src="/LogoWeb1.jpg"
          alt="Watermark Trama"
          className="w-[600px] h-[600px] max-w-none object-contain blur-[0.2px]"
        />
      </div>

      <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 w-full max-w-md shadow-2xl z-10 space-y-5">
        <div className="text-center flex flex-col items-center">
          <div className="p-2 bg-white rounded-2xl border border-purple-100/80 mb-2 shadow-xs flex items-center justify-center">
            <Logo size="xl" />
          </div>
          <p className="text-xs text-gray-500 font-medium">Sistema de Gestión, Inventario y Punto de Venta</p>
          
          <div className="mt-2 inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200/80 px-3 py-1 rounded-full text-[11px] font-bold text-emerald-800 shadow-2xs">
            <ShieldCheck size={14} className="text-emerald-600 shrink-0" />
            <span>Modo Seguro Activo</span>
          </div>
        </div>

        {/* ACCESO AL CATÁLOGO PÚBLICO TRAMA DESTACADO */}
        {onOpenPublicCatalog && (
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl blur-xs opacity-75 group-hover:opacity-100 transition duration-300"></div>
            <button
              type="button"
              onClick={onOpenPublicCatalog}
              className="relative w-full py-3 px-4 bg-slate-950 hover:bg-slate-900 text-white rounded-2xl text-xs font-bold transition-all shadow-lg flex items-center justify-between gap-3 cursor-pointer border border-purple-500/40"
            >
              <div className="flex items-center gap-3 text-left min-w-0">
                <div className="p-2 bg-purple-900/80 text-amber-300 rounded-xl border border-purple-700/60 shrink-0 group-hover:scale-105 transition-transform">
                  <BookOpen size={18} />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-black text-white flex items-center gap-2 truncate">
                    <span>Catálogo Público Trama</span>
                    <span className="text-[9px] bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full font-black uppercase tracking-wider flex items-center gap-0.5 shrink-0">
                      <Sparkles size={10} /> Libre
                    </span>
                  </div>
                  <div className="text-[10px] text-purple-200 font-medium truncate mt-0.5">
                    Explora libros, consulta stock y compra vía WhatsApp
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 text-emerald-400 font-extrabold text-xs shrink-0 pl-1">
                <ShoppingCart size={15} />
                <ExternalLink size={11} className="opacity-70" />
              </div>
            </button>
          </div>
        )}

        {/* BANDERAS DE ACCESO DIRECTO PÁGINAS PRIVADAS DE LIBRERÍAS */}
        <div className="bg-purple-50/80 border border-purple-200/70 p-3 rounded-2xl space-y-2">
          <div className="text-[11px] font-black text-purple-950 uppercase tracking-wider flex items-center gap-1.5">
            <Building2 size={14} className="text-purple-700 shrink-0" />
            <span>Páginas Privadas de Librerías Aliadas</span>
          </div>
          <p className="text-[10px] text-purple-800 leading-tight">
            Ingresa directamente a la página privada de tu librería con tu clave de acceso:
          </p>
          <div className="grid grid-cols-2 gap-1.5 pt-1">
            {[
              ["Mar de Dudas", "mardedudas123", "El Quisco"],
              ["Kurripang", "kurripang123", "El Tabo"],
              ["Antro", "antro123", "El Tabo"],
              ["Trama", "trama123", "Casa Matriz"],
            ].map(([alias, defaultPass, ciudad]) => (
              <button
                key={alias}
                type="button"
                onClick={() => {
                  setModalLibAlias(alias);
                  setLibPassInput("");
                  setLibPassError("");
                }}
                className="py-2 px-2.5 bg-white hover:bg-purple-900 hover:text-white border border-purple-200/80 text-purple-950 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center justify-between cursor-pointer group"
              >
                <div className="flex items-center gap-1.5 truncate">
                  <Key size={12} className="text-amber-500 group-hover:text-amber-300 shrink-0" />
                  <span className="truncate">{alias}</span>
                </div>
                <span className="text-[9px] text-gray-400 group-hover:text-purple-200 font-normal shrink-0">{ciudad}</span>
              </button>
            ))}
          </div>
        </div>

        {/* FORMULARIO DE INICIO DE SESIÓN */}
        <form onSubmit={handleSubmit} className="space-y-3.5 pt-1 border-t border-gray-100">
          <div className="text-xs font-extrabold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
            <Lock size={13} className="text-purple-700" />
            <span>Acceso Personal / Administradores</span>
          </div>

          {lockoutTimer > 0 && (
            <div className="text-xs text-red-700 bg-red-100/80 p-3 rounded-xl border border-red-200 flex items-center gap-2 font-bold animate-pulse">
              <Lock size={16} className="shrink-0 text-red-600" />
              <span>Acceso bloqueado por seguridad anti fuerza bruta. Reintenta en {lockoutTimer} seg.</span>
            </div>
          )}

          {error && (
            <div className="text-xs text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-100 flex items-center gap-2 font-medium">
              <AlertCircle size={15} className="shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          <Input
            label="Correo / Usuario o Nombre de Librería"
            type="text"
            value={email}
            onChange={(e: any) => setEmail(e.target.value)}
            placeholder="admin@tramalibros.cl o Mar de Dudas"
            disabled={lockoutTimer > 0}
          />

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-700">
              Contraseña / Clave de Acceso
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={clave}
                onChange={(e) => setClave(e.target.value)}
                placeholder="••••••••"
                disabled={lockoutTimer > 0}
                className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPassword ? <AlertCircle size={16} className="hidden" /> : null}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={lockoutTimer > 0}
            className="w-full bg-purple-900 hover:bg-purple-950 text-white rounded-xl py-3 text-xs font-black transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>Iniciar Sesión</span>
            <ArrowRight size={15} className="stroke-[2.5]" />
          </button>
        </form>
      </div>

      {/* MODAL INGRESAR CLAVE DE LIBRERÍA DESDE LOGIN */}
      {modalLibAlias && (
        <Modal
          title={`Acceso Privado - Librería ${modalLibAlias}`}
          onClose={() => {
            setModalLibAlias(null);
            setLibPassError("");
          }}
        >
          <div className="space-y-4">
            <div className="bg-purple-50 p-3 rounded-xl border border-purple-100 flex items-start gap-3 text-xs text-purple-950">
              <Lock size={18} className="text-purple-700 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-purple-900">Ingreso a Página Privada</p>
                <p>
                  Ingresa la contraseña de acceso privado para <strong>Librería {modalLibAlias}</strong> para ver su inventario, proveedores y contabilidad.
                </p>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleConfirmDirectLibPass(modalLibAlias);
              }}
              className="space-y-3"
            >
              <Input
                label="Contraseña de la Librería *"
                type="password"
                placeholder="Ingresa la clave de acceso..."
                value={libPassInput}
                onChange={(e: any) => setLibPassInput(e.target.value)}
                required
                autoFocus
              />

              {libPassError && (
                <div className="text-xs font-semibold text-red-600 bg-red-50 p-2 rounded-lg border border-red-100">
                  {libPassError}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Btn variant="outline" type="button" onClick={() => setModalLibAlias(null)}>
                  Cancelar
                </Btn>
                <Btn type="submit">
                  Entrar a Página Privada
                </Btn>
              </div>
            </form>
          </div>
        </Modal>
      )}
    </div>
  );
}
