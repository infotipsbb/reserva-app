import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { redirect } from "next/navigation";
import Link from "next/link";
import AdminToastNotifier from "@/components/admin-toast";

export default async function AdminPage({ searchParams }: { searchParams: { success?: string; error?: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || (profile.role !== "admin" && profile.role !== "super_admin")) {
    redirect("/dashboard");
  }

  const successMessage = searchParams.success;
  const errorMessage = searchParams.error;

  const { data: reservations } = await supabase
    .from("reservations")
    .select(`*, courts(name), profiles(full_name, email, phone)`)
    .order("created_at", { ascending: false });

  const { data: courts } = await supabase
    .from("courts")
    .select("*")
    .order("name");

  const { data: blocks } = await supabase
    .from("availability_blocks")
    .select(`*, courts(name)`)
    .order("start_date", { ascending: false })
    .limit(20);

  async function updateStatus(formData: FormData) {
    "use server";
    const id = formData.get("id") as string;
    const status = formData.get("status") as string;
    const serverClient = await createClient();

    // Obtener datos de la reserva antes de actualizar (para el correo)
    const { data: reservationData } = await serverClient
      .from("reservations")
      .select("user_id, court_id, date, start_time, end_time, total_price")
      .eq("id", id)
      .single();

    await serverClient
      .from("reservations")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id);

    await serverClient.from("audit_logs").insert({
      actor_id: user?.id,
      action: `updated_reservation_status_to_${status}`,
      target_id: id,
      details: { status },
    });

    // Enviar correo si se aprueba
    if (status === "approved" && reservationData) {
      try {
        const { sendEmailNotification } = await import("@/lib/email-notifications");
        await sendEmailNotification("approved", reservationData);
      } catch (emailErr) {
        console.error("Error enviando correo de aprobación:", emailErr);
      }
    }

    redirect(`/admin?success=status_${status}`);
  }

  async function deleteReservation(formData: FormData) {
    "use server";
    const id = formData.get("id") as string;
    if (profile?.role !== "super_admin") return;
    const serverClient = await createClient();
    await serverClient.from("reservations").delete().eq("id", id);
    await serverClient.from("audit_logs").insert({
      actor_id: user?.id,
      action: "deleted_reservation",
      target_id: id,
    });
    redirect(`/admin?success=deleted`);
  }

  async function createBlock(formData: FormData) {
    "use server";
    const court_id = formData.get("court_id") as string;
    const start_date = formData.get("start_date") as string;
    const end_date = formData.get("end_date") as string;
    const reason = formData.get("reason") as string;
    
    if (!court_id || !start_date || !end_date) {
      redirect(`/admin?error=block_failed&message=campos-incompletos`);
    }

    const serverClient = await createClient();
    
    // Fix: Asegurar formato correcto de fechas ISO
    const startISO = new Date(start_date).toISOString();
    const endISO = new Date(end_date).toISOString();

    const { error } = await serverClient.from("availability_blocks").insert({
      court_id,
      start_date: startISO,
      end_date: endISO,
      reason: reason || null,
    });

    if (error) {
      console.error("Error creating block:", error);
      redirect(`/admin?error=block_failed&message=${encodeURIComponent(error.message)}`);
    }
    redirect(`/admin?success=blocked`);
  }

  async function deleteBlock(formData: FormData) {
    "use server";
    const id = formData.get("id") as string;
    const serverClient = await createClient();
    await serverClient.from("availability_blocks").delete().eq("id", id);
    redirect(`/admin?success=block_removed`);
  }

  async function updateCourt(formData: FormData) {
    "use server";
    const id = formData.get("id") as string;
    const price = parseFloat(formData.get("price") as string);
    const price_member = parseFloat(formData.get("price_member") as string);
    const is_active = formData.get("is_active") === "on";
    
    const serverClient = await createClient();
    await serverClient.from("courts").update({ 
      price_per_hour: price, 
      price_member: price_member,
      is_active 
    }).eq("id", id);
    redirect(`/admin?success=price_updated`);
  }

  async function editReservation(formData: FormData) {
    "use server";
    if (profile?.role !== "super_admin") return;
    const id = formData.get("id") as string;
    const date = formData.get("date") as string;
    const start_time = formData.get("start_time") as string;
    const end_time = formData.get("end_time") as string;
    
    const serverClient = await createClient();
    await serverClient.from("reservations").update({ date, start_time, end_time }).eq("id", id);
    await serverClient.from("audit_logs").insert({
      actor_id: user?.id,
      action: "edited_reservation",
      target_id: id,
      details: { date, start_time, end_time },
    });
    redirect(`/admin?success=edited`);
  }

  const pending = reservations?.filter((r) => r.status === "pending") || [];
  const approved = reservations?.filter((r) => r.status === "approved") || [];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:py-12">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8">Panel de Administración</h1>

      <AdminToastNotifier />

      <div className="grid gap-6 sm:gap-8">
        {/* PENDING RESERVATIONS */}
        <Card>
          <CardHeader>
            <CardTitle>Solicitudes Pendientes ({pending.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {pending.length === 0 ? (
              <p className="text-muted-foreground">No hay solicitudes pendientes.</p>
            ) : (
              <div className="space-y-4">
                {pending.map((res) => (
                  <div key={res.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-lg gap-4">
                    <div>
                      <p className="font-semibold">{res.profiles?.full_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {res.profiles?.email} · {res.profiles?.phone}
                      </p>
                      <p className="text-sm mt-1">
                        {res.courts?.name} · {res.date} · {res.start_time} - {res.end_time}
                      </p>
                      <p className="text-sm font-medium text-primary">
                        Total: ${res.total_price?.toLocaleString("es-CL")}
                      </p>
                      {res.payment_proof_url && (
                        <a 
                          href={res.payment_proof_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline mt-1 inline-block"
                        >
                          📎 Ver comprobante de pago
                        </a>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <form action={updateStatus}>
                        <input type="hidden" name="id" value={res.id} />
                        <input type="hidden" name="status" value="approved" />
                        <Button type="submit" size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                          Aprobar
                        </Button>
                      </form>
                      <form action={updateStatus}>
                        <input type="hidden" name="id" value={res.id} />
                        <input type="hidden" name="status" value="rejected" />
                        <Button type="submit" size="sm" variant="destructive">
                          Rechazar
                        </Button>
                      </form>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* BLOCK DAYS */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Bloquear Días / Horarios</CardTitle>
            <Link href="/calendario" target="_blank">
              <Button variant="outline" size="sm">Ver Calendario Público</Button>
            </Link>
          </CardHeader>
          <CardContent>
            <form action={createBlock} className="grid md:grid-cols-5 gap-4 items-end mb-6">
              <div>
                <label className="text-sm font-medium block mb-1">Cancha</label>
                <select name="court_id" required className="w-full h-10 rounded-md border px-3">
                  <option value="">Seleccionar...</option>
                  {courts?.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Inicio</label>
                <Input type="datetime-local" name="start_date" required />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Fin</label>
                <Input type="datetime-local" name="end_date" required />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Motivo</label>
                <Input type="text" name="reason" placeholder="Mantenimiento, evento..." />
              </div>
              <Button type="submit" className="bg-gray-700 hover:bg-gray-800">Bloquear</Button>
            </form>

            {blocks && blocks.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Bloqueos activos:</h4>
                {blocks.map((b) => (
                  <div key={b.id} className="flex justify-between items-center p-3 bg-gray-50 rounded text-sm">
                    <span>
                      <strong>{b.courts?.name}</strong> · {new Date(b.start_date).toLocaleString("es-CL")} → {new Date(b.end_date).toLocaleString("es-CL")}
                      {b.reason && <span className="text-muted-foreground"> ({b.reason})</span>}
                    </span>
                    <form action={deleteBlock}>
                      <input type="hidden" name="id" value={b.id} />
                      <Button type="submit" size="sm" variant="ghost" className="text-red-600 hover:text-red-700">Eliminar</Button>
                    </form>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* COURT MANAGEMENT */}
        <Card>
          <CardHeader>
            <CardTitle>Gestión de Canchas y Precios</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {courts?.map((court) => (
                <form key={court.id} action={updateCourt} className="flex flex-col md:flex-row md:items-center gap-4 p-4 border rounded-lg">
                  <input type="hidden" name="id" value={court.id} />
                  <div className="flex-1">
                    <p className="font-semibold">{court.name}</p>
                    <p className="text-sm text-muted-foreground">{court.type}</p>
                  </div>
                  <div className="flex items-center gap-4 flex-wrap">
                    <div>
                      <label className="text-xs text-muted-foreground block">Precio Socio</label>
                      <Input 
                        type="number" 
                        name="price_member" 
                        defaultValue={court.price_member || 0} 
                        className="w-28"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground block">Precio No Socio</label>
                      <Input 
                        type="number" 
                        name="price" 
                        defaultValue={court.price_per_hour} 
                        className="w-28"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        name="is_active" 
                        defaultChecked={court.is_active}
                        className="w-4 h-4"
                      />
                      <label className="text-sm">Activa</label>
                    </div>
                    <Button type="submit" size="sm" variant="outline">Guardar</Button>
                  </div>
                </form>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* APPROVED RESERVATIONS + EDIT */}
        <Card>
          <CardHeader>
            <CardTitle>Reservas Aprobadas ({approved.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {approved.length === 0 ? (
              <p className="text-muted-foreground">No hay reservas aprobadas aún.</p>
            ) : (
              <div className="space-y-4">
                {approved.map((res) => (
                  <div key={res.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-lg gap-4">
                    <div>
                      <p className="font-semibold">{res.profiles?.full_name}</p>
                      <p className="text-sm">
                        {res.courts?.name} · {res.date} · {res.start_time} - {res.end_time}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {profile.role === "super_admin" && (
                        <form action={editReservation} className="flex gap-2 items-center">
                          <input type="hidden" name="id" value={res.id} />
                          <Input type="date" name="date" defaultValue={res.date} className="w-36" />
                          <Input type="time" name="start_time" defaultValue={res.start_time} className="w-28" />
                          <Input type="time" name="end_time" defaultValue={res.end_time} className="w-28" />
                          <Button type="submit" size="sm" variant="outline">Editar</Button>
                        </form>
                      )}
                      {profile.role === "super_admin" && (
                        <form action={deleteReservation}>
                          <input type="hidden" name="id" value={res.id} />
                          <Button type="submit" size="sm" variant="destructive">
                            Eliminar
                          </Button>
                        </form>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* AUDITORIA LINK */}
        {profile.role === "super_admin" && (
          <Card className="bg-gray-50">
            <CardContent className="py-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">Registro de Auditoría</p>
                  <p className="text-sm text-muted-foreground">Ver historial completo de actividades del sistema</p>
                </div>
                <Link href="/admin/auditoria">
                  <Button variant="outline">Ver Auditoría →</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
