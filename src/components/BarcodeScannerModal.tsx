import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { Camera, CheckCircle2, AlertCircle, Volume2, X, RefreshCw, Zap, Plus, BookOpen } from "lucide-react";
import { Book } from "../types";
import { Modal, Btn } from "./ui";
import { fmt } from "../utils/helpers";

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  books: Book[];
  onAddToCart: (book: Book) => void;
}

export function BarcodeScannerModal({
  isOpen,
  onClose,
  books,
  onAddToCart,
}: BarcodeScannerModalProps) {
  const [error, setError] = useState<string>("");
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [lastScannedResult, setLastScannedResult] = useState<{
    book: Book | null;
    rawText: string;
    timestamp: number;
    found: boolean;
  } | null>(null);

  const [autoCloseOnScan, setAutoCloseOnScan] = useState(false);
  const [manualCode, setManualCode] = useState("");

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const lastScanTimeRef = useRef<number>(0);
  const lastScannedIsbnRef = useRef<string>("");
  const elementId = "reader-barcode-scanner-box";

  const playBeep = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const audioCtx = new AudioContextClass();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(1046.5, audioCtx.currentTime); // C6 note
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.12);
    } catch (e) {
      // Audio context might be restricted before user interaction
    }
  };

  const processBarcode = (decodedText: string) => {
    const now = Date.now();
    const cleanScanned = decodedText.trim().replace(/[^0-9xX]/gi, "").toLowerCase();

    // Debounce 1.5 seconds for identical code
    if (cleanScanned === lastScannedIsbnRef.current && now - lastScanTimeRef.current < 1500) {
      return;
    }

    lastScanTimeRef.current = now;
    lastScannedIsbnRef.current = cleanScanned;

    // Search book by cleaned ISBN, raw ISBN, or ID
    const foundBook = books.find(b => {
      const bIsbnClean = b.isbn.replace(/[^0-9xX]/gi, "").toLowerCase();
      return (
        bIsbnClean.includes(cleanScanned) ||
        cleanScanned.includes(bIsbnClean) ||
        b.isbn.toLowerCase().includes(decodedText.trim().toLowerCase()) ||
        b.id.toString() === decodedText.trim()
      );
    });

    playBeep();

    if (foundBook) {
      const stockDisp = foundBook.id < 0 ? 999 : ((foundBook.stock || 0) + (foundBook.stockTrama || 0));
      if (stockDisp > 0) {
        onAddToCart(foundBook);
        setLastScannedResult({
          book: foundBook,
          rawText: decodedText,
          timestamp: now,
          found: true,
        });

        if (autoCloseOnScan) {
          stopScanner().then(() => onClose());
        }
      } else {
        setLastScannedResult({
          book: foundBook,
          rawText: decodedText,
          timestamp: now,
          found: false,
        });
      }
    } else {
      setLastScannedResult({
        book: null,
        rawText: decodedText,
        timestamp: now,
        found: false,
      });
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (e) {
        console.error("Error stopping barcode scanner:", e);
      }
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    if (!isOpen) return;

    setError("");
    setLastScannedResult(null);

    const html5Qrcode = new Html5Qrcode(elementId, {
      formatsToSupport: [
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.EAN_8,
        Html5QrcodeSupportedFormats.UPC_A,
        Html5QrcodeSupportedFormats.UPC_E,
        Html5QrcodeSupportedFormats.CODE_128,
        Html5QrcodeSupportedFormats.CODE_39,
        Html5QrcodeSupportedFormats.QR_CODE,
      ],
      verbose: false,
    });

    scannerRef.current = html5Qrcode;

    const startScanner = async () => {
      try {
        await html5Qrcode.start(
          { facingMode: "environment" },
          {
            fps: 15,
            qrbox: { width: 280, height: 160 },
            aspectRatio: 1.5,
          },
          (decodedText) => {
            processBarcode(decodedText);
          },
          () => {}
        );
        setIsCameraActive(true);
      } catch (err: any) {
        console.warn("Back camera unavailable, attempting front camera...", err);
        try {
          await html5Qrcode.start(
            { facingMode: "user" },
            {
              fps: 15,
              qrbox: { width: 280, height: 160 },
              aspectRatio: 1.5,
            },
            (decodedText) => {
              processBarcode(decodedText);
            },
            () => {}
          );
          setIsCameraActive(true);
        } catch (err2: any) {
          console.error("Camera access failed", err2);
          setError("No se detectó cámara o falta permiso en el navegador.");
          setIsCameraActive(false);
        }
      }
    };

    // Small delay to ensure modal DOM container is mounted
    const timer = setTimeout(() => {
      startScanner();
    }, 150);

    return () => {
      clearTimeout(timer);
      stopScanner();
    };
  }, [isOpen]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    processBarcode(manualCode.trim());
    setManualCode("");
  };

  const handleClose = () => {
    stopScanner().then(() => onClose());
  };

  if (!isOpen) return null;

  return (
    <Modal
      title="Escanear Código de Barras / ISBN con Cámara"
      onClose={handleClose}
      footer={
        <div className="flex items-center justify-between w-full">
          <label className="inline-flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoCloseOnScan}
              onChange={(e) => setAutoCloseOnScan(e.target.checked)}
              className="rounded text-purple-600 focus:ring-0"
            />
            Cerrar automáticamente al escanear
          </label>
          <Btn onClick={handleClose} variant="primary">
            Listo / Cerrar
          </Btn>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Banner Informativo */}
        <div className="p-3 bg-purple-50 border border-purple-200 rounded-2xl flex items-center justify-between text-xs text-purple-900">
          <div className="flex items-center gap-2">
            <Camera size={18} className="text-purple-700 shrink-0" />
            <p className="font-medium">
              Apunta la cámara del dispositivo hacia el código de barras o ISBN del libro para agregarlo directamente al ticket.
            </p>
          </div>
        </div>

        {/* Visor de Cámara */}
        <div className="relative bg-black rounded-2xl overflow-hidden border border-gray-800 shadow-inner min-h-[220px] flex items-center justify-center">
          <div id={elementId} className="w-full h-full min-h-[220px]" />

          {!isCameraActive && !error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/90 text-white p-4 text-center space-y-2">
              <RefreshCw size={24} className="animate-spin text-purple-400" />
              <p className="text-xs font-semibold">Iniciando cámara del dispositivo...</p>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/95 text-red-200 p-4 text-center space-y-2">
              <AlertCircle size={28} className="text-red-400" />
              <p className="text-xs font-bold text-white">{error}</p>
              <p className="text-[11px] text-gray-300 max-w-xs">
                Asegúrate de conceder permisos de cámara al sitio web o utiliza el buscador manual por ISBN a continuación.
              </p>
            </div>
          )}
        </div>

        {/* Resultado del Último Escaneo */}
        {lastScannedResult && (
          <div
            className={`p-3.5 rounded-2xl border text-xs space-y-1 transition-all ${
              lastScannedResult.found && lastScannedResult.book
                ? "bg-emerald-50 border-emerald-200 text-emerald-950"
                : lastScannedResult.book && !lastScannedResult.found
                ? "bg-amber-50 border-amber-200 text-amber-950"
                : "bg-red-50 border-red-200 text-red-950"
            }`}
          >
            {lastScannedResult.found && lastScannedResult.book ? (
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl shrink-0">
                    <CheckCircle2 size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-extrabold text-sm truncate text-emerald-900">
                      ¡Añadido al Ticket!
                    </p>
                    <p className="font-bold text-gray-900 truncate">
                      {lastScannedResult.book.titulo}
                    </p>
                    <p className="text-[11px] text-emerald-800">
                      {lastScannedResult.book.autor} · <span className="font-mono font-bold">{fmt(lastScannedResult.book.precio)}</span>
                    </p>
                  </div>
                </div>
                <Btn
                  size="sm"
                  variant="primary"
                  className="bg-emerald-700 hover:bg-emerald-800 text-white shrink-0 font-bold"
                  onClick={() => onAddToCart(lastScannedResult.book!)}
                >
                  <Plus size={14} /> +1
                </Btn>
              </div>
            ) : lastScannedResult.book && !lastScannedResult.found ? (
              <div className="flex items-center gap-2">
                <AlertCircle size={18} className="text-amber-600 shrink-0" />
                <div>
                  <p className="font-bold">Libro sin stock disponible</p>
                  <p className="text-[11px]">{lastScannedResult.book.titulo} (Stock: 0)</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <AlertCircle size={18} className="text-red-600 shrink-0" />
                <div>
                  <p className="font-bold">Libro no encontrado en catálogo</p>
                  <p className="text-[11px]">Código detectado: <span className="font-mono">{lastScannedResult.rawText}</span></p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Fallback Entrada Manual de Código */}
        <form onSubmit={handleManualSubmit} className="pt-2 border-t border-gray-100 space-y-1.5">
          <label className="text-[11px] font-bold text-gray-700 block">
            ¿Código ilegible? Ingresa el ISBN manualmente:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="Ej: 9788426132745"
              className="flex-1 px-3 py-2 text-xs border border-gray-200 rounded-xl outline-none focus:border-purple-500 font-mono"
            />
            <Btn type="submit" size="sm" variant="outline" className="shrink-0 font-bold">
              Procesar Código
            </Btn>
          </div>
        </form>
      </div>
    </Modal>
  );
}
