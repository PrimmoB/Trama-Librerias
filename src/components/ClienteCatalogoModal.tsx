import React from "react";
import { Book, TramaInfo } from "../types";
import { PublicCatalog } from "./PublicCatalog";

interface ClienteCatalogoModalProps {
  books: Book[];
  tramaInfo?: TramaInfo;
  onClose: () => void;
}

export function ClienteCatalogoModal({ books, tramaInfo, onClose }: ClienteCatalogoModalProps) {
  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-7xl max-h-[96vh] rounded-3xl overflow-hidden shadow-2xl border border-slate-800 bg-slate-900 my-auto flex flex-col">
        <PublicCatalog
          books={books}
          tramaInfo={tramaInfo}
          isEmbeddedModal={true}
          onCloseModal={onClose}
        />
      </div>
    </div>
  );
}
