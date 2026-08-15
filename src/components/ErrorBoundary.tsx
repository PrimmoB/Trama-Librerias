import React from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error in application component:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-stone-50 flex items-center justify-center p-6 text-stone-800">
          <div className="bg-white rounded-3xl border border-stone-200 p-8 max-w-md w-full shadow-2xl text-center space-y-4">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-2">
              <AlertTriangle size={32} />
            </div>
            <h2 className="text-lg font-black text-stone-900">Se produjo un inconveniente en la visualización</h2>
            <p className="text-xs text-stone-600 leading-relaxed">
              Ocurrió un detalle al procesar esta sección. Los datos del sistema están resguardados de forma segura.
            </p>
            {this.state.error && (
              <div className="bg-stone-100 p-3 rounded-xl text-[11px] font-mono text-stone-700 text-left overflow-x-auto max-h-24">
                {this.state.error.toString()}
              </div>
            )}
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.reload();
                }}
                className="px-4 py-2.5 bg-purple-900 hover:bg-purple-950 text-white text-xs font-extrabold rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
              >
                <RefreshCw size={14} /> Reintentar Cargar
              </button>
              <button
                onClick={() => {
                  localStorage.removeItem("trama_role");
                  window.location.href = "/";
                }}
                className="px-4 py-2.5 bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer"
              >
                <Home size={14} /> Ir al Inicio
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
