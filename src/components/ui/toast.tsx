"use client";

import { useEffect, useState } from "react";
import { X, CheckCircle, AlertCircle, Info } from "lucide-react";
import { Button } from "./button";

interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (message: string, type: Toast["type"] = "info") => {
    const id = Math.random().toString(36).substring(7);
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return { toasts, addToast, removeToast };
}

export function ToastContainer({ 
  toasts, 
  removeToast 
}: { 
  toasts: Toast[]; 
  removeToast: (id: string) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-start gap-3 p-4 rounded-lg shadow-lg border animate-in slide-in-from-right-full duration-300 ${
            toast.type === "success"
              ? "bg-green-50 border-green-200 text-green-800"
              : toast.type === "error"
              ? "bg-red-50 border-red-200 text-red-800"
              : "bg-blue-50 border-blue-200 text-blue-800"
          }`}
        >
          {toast.type === "success" && <CheckCircle className="w-5 h-5 mt-0.5 shrink-0" />}
          {toast.type === "error" && <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />}
          {toast.type === "info" && <Info className="w-5 h-5 mt-0.5 shrink-0" />}
          <div className="flex-1 text-sm font-medium">{toast.message}</div>
          <Button
            variant="ghost"
            size="sm"
            className="h-auto p-1 hover:bg-black/5"
            onClick={() => removeToast(toast.id)}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}
