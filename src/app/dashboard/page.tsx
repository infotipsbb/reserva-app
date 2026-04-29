"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { CalendarDays, Clock, MapPin } from "lucide-react";

export default function DashboardPage() {
  const supabase = createClient();
  const router = useRouter();
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          window.location.href = "/login";
          return;
        }
        setUser(session.user);

        const { data } = await supabase
          .from("reservations")
          .select(`*, courts(name)`)
          .eq("user_id", session.user.id)
          .order("date", { ascending: false });

        setReservations(data || []);
      } catch (err: any) {
        console.error("[Dashboard] Error cargando:", err);
        setLoadError("No se pudieron cargar tus reservas. Intenta recargar la página.");
      } finally {
        setLoading(false);
      }
    };
    init();

    // Timeout de seguridad: si algo se cuelga, liberar la pantalla en 8 segundos
    const timeout = setTimeout(() => {
      setLoading((prev) => {
        if (prev) {
          setLoadError("La carga tardó demasiado. Intenta recargar la página.");
          return false;
        }
        return prev;
      });
    }, 8000);

    return () => clearTimeout(timeout);
  }, [supabase]);

  const statusColors: Record<string, string> = {
    pending: "text-amber-600",
    approved: "text-green-600",
    rejected: "text-red-600",
  };

  const statusLabels: Record<string, string> = {
    pending: "Pendiente",
    approved: "Aprobada",
    rejected: "Rechazada",
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12 text-center">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12 text-center">
        <p className="text-destructive mb-4">{loadError}</p>
        <Button onClick={() => window.location.reload()}>Recargar página</Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 sm:py-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold">Mis Reservas</h1>
        <Button className="w-full sm:w-auto" onClick={() => window.location.href = "/reservar"}>
          Nueva Reserva
        </Button>
      </div>

      {reservations.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">No tienes reservas aún.</p>
            <Button onClick={() => window.location.href = "/reservar"}>
              Hacer una reserva
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:gap-4">
          {reservations.map((res) => (
            <Card key={res.id} className="overflow-hidden">
              <CardHeader className="pb-2 px-4 sm:px-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <CardTitle className="text-base sm:text-lg">{res.courts?.name}</CardTitle>
                  <span className={`text-sm font-semibold ${statusColors[res.status]}`}>
                    {statusLabels[res.status]}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="px-4 sm:px-6">
                <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <CalendarDays className="w-4 h-4 shrink-0" />
                    {new Date(res.date).toLocaleDateString("es-CL")}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 shrink-0" />
                    {res.start_time} - {res.end_time}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 shrink-0" />
                    Cancha {res.courts?.name}
                  </div>
                </div>
                {res.payment_proof_url && (
                  <p className="mt-2 text-xs text-muted-foreground truncate">
                    Comprobante: {res.payment_proof_url}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
