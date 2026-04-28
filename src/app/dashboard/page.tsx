import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { CalendarDays, Clock, MapPin } from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

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
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <h1 className="text-3xl font-bold">Mis Reservas</h1>
        <Link href="/reservar">
          <Button className="w-full sm:w-auto">Nueva Reserva</Button>
        </Link>
      </div>

      {!reservations || reservations.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">No tienes reservas aún.</p>
            <Link href="/reservar">
              <Button>Hacer una reserva</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {reservations.map((res) => (
            <Card key={res.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{res.courts?.name}</CardTitle>
                  <span className={`font-semibold ${statusColors[res.status]}`}>
                    {statusLabels[res.status]}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <CalendarDays className="w-4 h-4" />
                    {new Date(res.date).toLocaleDateString("es-CL")}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {res.start_time} - {res.end_time}
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    Cancha {res.courts?.name}
                  </div>
                </div>
                {res.payment_proof_url && (
                  <p className="mt-2 text-xs text-muted-foreground">
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
