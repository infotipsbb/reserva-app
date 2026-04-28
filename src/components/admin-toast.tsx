"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { ToastContainer, useToast } from "@/components/ui/toast";

const successMessages: Record<string, string> = {
  status_approved: "Reserva aprobada exitosamente.",
  status_rejected: "Reserva rechazada exitosamente.",
  deleted: "Reserva eliminada exitosamente.",
  blocked: "Bloqueo creado exitosamente.",
  block_removed: "Bloqueo eliminado exitosamente.",
  price_updated: "Precio actualizado exitosamente.",
  edited: "Reserva editada exitosamente.",
};

const errorMessages: Record<string, string> = {
  block_failed: "Error al crear el bloqueo. Verifica que las fechas sean válidas.",
};

export default function AdminToastNotifier() {
  const searchParams = useSearchParams();
  const { toasts, addToast, removeToast } = useToast();
  const lastShownKey = useRef<string | null>(null);

  useEffect(() => {
    const success = searchParams.get("success");
    const error = searchParams.get("error");
    const message = searchParams.get("message");
    
    // Crear una clave única para este estado de URL
    const currentKey = `${success}-${error}-${message}`;
    
    // Solo mostrar si hay un mensaje nuevo y no es el mismo que ya mostramos
    if (currentKey !== lastShownKey.current && (success || error)) {
      lastShownKey.current = currentKey;
      
      if (success && successMessages[success]) {
        addToast(successMessages[success], "success");
      }
      if (error) {
        // Si hay un mensaje personalizado en la URL, mostrarlo
        const customMessage = message && message !== "null" ? decodeURIComponent(message) : null;
        addToast(customMessage || errorMessages[error] || "Ha ocurrido un error.", "error");
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]); // Solo depende de searchParams, no de addToast

  return <ToastContainer toasts={toasts} removeToast={removeToast} />;
}
