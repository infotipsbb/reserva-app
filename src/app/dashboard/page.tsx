import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { redirect } from "next/navigation";
import { CalendarDays, Clock, MapPin } from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: reservations } = await supabase
    .from("reservations")
    .select(`*, courts(name)`)
    .eq("user_id", user.id)
    .order("date", { ascending: false });

  const statusColors: Record<string, string> = {
    pending: "text-warning",
    approved: "text-success",
    rejected: "text-destructive",
  };

  const statusLabels: Record<string, string> = {
    pending: "Pendiente",
    approved: "Aprobada",
    rejected: "Rechazada",
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 sm:py-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold">Mis Reservas</h1>
        <Button className="w-full sm:w-auto" onClick={() => window.location.href = "/reservar"}>
          Nueva Reserva
        </Button>
      </div>

      {!reservations || reservations.length === 0 ? (
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
