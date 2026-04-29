"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { format, addHours, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ReservarPage() {
  const supabase = createClient();
  const router = useRouter();
  const [courts, setCourts] = useState<any[]>([]);
  const [selectedCourt, setSelectedCourt] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [slots, setSlots] = useState<string[]>([]);
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [isMember, setIsMember] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [user, setUser] = useState<any>(null);
  const [reservationSuccess, setReservationSuccess] = useState(false);
  const [lastReservation, setLastReservation] = useState<any>(null);
  const [paymentFile, setPaymentFile] = useState<File | null>(null);

  // Verificar sesión y cargar canchas SECUENCIALMENTE (evita race condition de locks)
  useEffect(() => {
    const init = async () => {
      // 1. Verificar sesión primero (solo lectura, no refresca)
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        window.location.href = "/login";
        return;
      }
      setUser(session.user);

      // 2. Luego cargar canchas (una sola petición a la vez)
      const { data } = await supabase.from("courts").select("*, price_member").eq("is_active", true);
      if (data) setCourts(data);
    };
    init();
  }, [supabase]);

  useEffect(() => {
    const fetchAvailability = async () => {
      if (!selectedCourt || !selectedDate) return;
      const dateStr = format(selectedDate, "yyyy-MM-dd");

      // Get reservations for this court/date
      const { data: reservations } = await supabase
        .from("reservations")
        .select("start_time, end_time, status")
        .eq("court_id", selectedCourt)
        .eq("date", dateStr)
        .in("status", ["pending", "approved"]);

      // Get blocks
      const { data: blocks } = await supabase
        .from("availability_blocks")
        .select("start_date, end_date")
        .eq("court_id", selectedCourt);

      // Generate slots from 08:00 to 22:00 (1 hour blocks)
      const allSlots = [];
      for (let h = 8; h < 22; h++) {
        allSlots.push(`${h.toString().padStart(2, "0")}:00`);
      }

      // Filter out reserved slots
      const reservedSlots = new Set<string>();
      reservations?.forEach((r: any) => {
        const start = parseInt(r.start_time.split(":")[0]);
        const end = parseInt(r.end_time.split(":")[0]);
        for (let h = start; h < end; h++) {
          reservedSlots.add(`${h.toString().padStart(2, "0")}:00`);
        }
      });

      // Filter out blocked slots - check if selected date overlaps with block period
      const blockedSlots = new Set<string>();
      blocks?.forEach((b: any) => {
        const blockStart = new Date(b.start_date);
        const blockEnd = new Date(b.end_date);
        
        // Create range for selected date
        const dayStart = new Date(selectedDate);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(selectedDate);
        dayEnd.setHours(23, 59, 59, 999);
        
        // Check if day overlaps with block
        const overlaps = dayStart <= blockEnd && dayEnd >= blockStart;
        
        if (overlaps) {
          // Determine which hours of the day are blocked
          const blockStartHour = blockStart.toDateString() === selectedDate.toDateString() 
            ? blockStart.getHours() 
            : 0;
          const blockEndHour = blockEnd.toDateString() === selectedDate.toDateString() 
            ? blockEnd.getHours() 
            : 23;
          
          for (let h = Math.max(blockStartHour, 8); h < Math.min(blockEndHour, 22); h++) {
            blockedSlots.add(`${h.toString().padStart(2, "0")}:00`);
          }
        }
      });

      const available = allSlots.filter((s) => 
        !reservedSlots.has(s) && !blockedSlots.has(s)
      );

      setSlots(available);
      setSelectedSlots([]);
    };

    fetchAvailability();
  }, [selectedCourt, selectedDate, supabase]);

  const toggleSlot = (slot: string) => {
    setSelectedSlots((prev) => {
      if (prev.includes(slot)) {
        return prev.filter((s) => s !== slot);
      }
      // Only allow consecutive slots
      if (prev.length === 0) return [slot];
      const hour = parseInt(slot.split(":")[0]);
      const prevHours = prev.map((s) => parseInt(s.split(":")[0]));
      const minHour = Math.min(...prevHours);
      const maxHour = Math.max(...prevHours);

      if (hour === minHour - 1 || hour === maxHour + 1) {
        return [...prev, slot].sort();
      }
      return [slot]; // Reset if not consecutive
    });
  };

  const getTotalPrice = () => {
    const court = courts.find((c) => c.id === selectedCourt);
    if (!court || selectedSlots.length === 0) return 0;
    const price = isMember && court.price_member ? court.price_member : court.price_per_hour;
    return price * selectedSlots.length;
  };

  const getPriceLabel = () => {
    const court = courts.find((c) => c.id === selectedCourt);
    if (!court) return "";
    return isMember && court.price_member ? `${court.price_member.toLocaleString("es-CL")} (Socio)` : `${court.price_per_hour.toLocaleString("es-CL")} (No socio)`;
  };

  const handleSubmit = async () => {
    if (!selectedCourt || !selectedDate || selectedSlots.length === 0) {
      setError("Selecciona cancha, fecha y al menos un horario.");
      return;
    }

    if (!paymentFile) {
      setError("Debes subir el comprobante de pago para confirmar la reserva.");
      return;
    }

    // Validar archivo
    if (!paymentFile.name) {
      setError("No se pudo leer el nombre del archivo. Intenta seleccionar otro.");
      return;
    }
    if (paymentFile.size > 5 * 1024 * 1024) {
      setError("El archivo es muy grande. Máximo 5 MB.");
      return;
    }

    setLoading(true);
    setError("");

    // Timeout global de seguridad: si todo el flujo tarda más de 25s, liberar
    const globalTimeout = setTimeout(() => {
      setLoading(false);
      setError("La operación tardó demasiado. Intenta recargar la página y vuelve a intentar.");
    }, 25000);

    try {
      // 1. Sesión
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setError("Debes iniciar sesión para reservar.");
        setTimeout(() => router.push("/login"), 1500);
        return;
      }
      const currentUser = session.user;

      // 2. Perfil (crear si no existe)
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", currentUser.id)
        .maybeSingle();

      if (!existingProfile) {
        await supabase.from("profiles").insert({
          id: currentUser.id,
          full_name: currentUser.user_metadata?.full_name || currentUser.email || "Usuario",
          email: currentUser.email || "",
          phone: currentUser.user_metadata?.phone || "",
          role: "user",
        });
      }

      // 3. Subir comprobante
      let paymentUrl = null;
      const fileExt = paymentFile.name.split('.').pop() || 'jpg';
      const safeExt = fileExt.replace(/[^a-zA-Z0-9]/g, '').substring(0, 10);
      const fileName = `${currentUser.id}_${Date.now()}.${safeExt || 'jpg'}`;
      const filePath = `${currentUser.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('payment-proofs')
        .upload(filePath, paymentFile, { cacheControl: '3600', upsert: false });

      if (uploadError) {
        setError("Error al subir comprobante: " + uploadError.message);
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from('payment-proofs')
        .getPublicUrl(filePath);
      paymentUrl = publicUrlData.publicUrl;

      // 4. Preparar datos
      const startTime = selectedSlots[0];
      const endHour = parseInt(selectedSlots[selectedSlots.length - 1].split(":")[0]) + 1;
      const endTime = `${endHour.toString().padStart(2, "0")}:00`;
      const dateStr = format(selectedDate, "yyyy-MM-dd");

      // 5. Validar disponibilidad
      const { data: existingReservations } = await supabase
        .from("reservations")
        .select("id, start_time, end_time")
        .eq("court_id", selectedCourt)
        .eq("date", dateStr)
        .in("status", ["pending", "approved"]);

      const requestedStart = parseInt(startTime.split(":")[0]);
      const requestedEnd = parseInt(endTime.split(":")[0]);

      const isOverlap = existingReservations?.some((res: any) => {
        const resStart = parseInt(res.start_time.split(":")[0]);
        const resEnd = parseInt(res.end_time.split(":")[0]);
        return requestedStart < resEnd && requestedEnd > resStart;
      });

      if (isOverlap) {
        setError("Este horario acaba de ser reservado. Selecciona otro.");
        setSelectedSlots([]);
        return;
      }

      // 6. Insertar reserva
      const { error: insertError } = await supabase.from("reservations").insert({
        user_id: currentUser.id,
        court_id: selectedCourt,
        date: dateStr,
        start_time: startTime,
        end_time: endTime,
        total_price: getTotalPrice(),
        status: "pending",
        payment_proof_url: paymentUrl,
      });

      if (insertError) {
        setError(insertError.message);
        return;
      }

      // 7. Email fire-and-forget (no esperamos respuesta)
      import("@/lib/email-notifications").then(({ sendEmailNotification }) => {
        sendEmailNotification("pending", {
          user_id: currentUser.id,
          court_id: selectedCourt,
          date: dateStr,
          start_time: startTime,
          end_time: endTime,
          total_price: getTotalPrice(),
        }).catch(() => { /* Email es opcional */ });
      });

      setLastReservation({
        court: courts.find((c) => c.id === selectedCourt)?.name,
        date: selectedDate,
        startTime,
        endTime,
        total: getTotalPrice(),
      });
      setReservationSuccess(true);
    } catch (unexpectedErr: any) {
      console.error("Error en reserva:", unexpectedErr);
      setError(unexpectedErr?.message || "Ocurrió un error. Recarga la página e intenta de nuevo.");
    } finally {
      clearTimeout(globalTimeout);
      setLoading(false);
    }
  };

  const handleNewReservation = () => {
    setReservationSuccess(false);
    setSelectedCourt("");
    setSelectedDate(undefined);
    setSelectedSlots([]);
    setError("");
  };

  if (reservationSuccess && lastReservation) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <div className="mb-6">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-green-700 mb-2">Reserva Solicitada</h1>
          <p className="text-muted-foreground">
            Tu reserva está <strong>pendiente de aprobación</strong>. Te notificaremos por correo cuando sea confirmada.
          </p>
        </div>

        <Card className="mb-8 text-left">
          <CardHeader>
            <CardTitle>Detalle de tu reserva</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Espacio</span>
              <span className="font-medium">{lastReservation.court}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Fecha</span>
              <span className="font-medium">{format(lastReservation.date, "dd/MM/yyyy")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Horario</span>
              <span className="font-medium">{lastReservation.startTime} - {lastReservation.endTime}</span>
            </div>
            <div className="border-t pt-3 flex justify-between">
              <span className="font-semibold">Total</span>
              <span className="font-bold text-primary">${lastReservation.total.toLocaleString("es-CL")}</span>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/dashboard">
            <Button size="lg" className="w-full sm:w-auto">
              Ver mis reservas
            </Button>
          </Link>
          <Button size="lg" variant="outline" className="w-full sm:w-auto" onClick={handleNewReservation}>
            Realizar otra reserva
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-12">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8">Nueva Reserva</h1>

      <div className="grid md:grid-cols-2 gap-6 sm:gap-8">
        <div className="space-y-6">
          {/* Select Court */}
          <Card>
            <CardHeader>
              <CardTitle>1. Selecciona la cancha</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {courts.map((court) => (
                <div
                  key={court.id}
                  onClick={() => { setSelectedCourt(court.id); setSelectedSlots([]); }}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedCourt === court.id
                      ? "border-primary bg-primary/5"
                      : "hover:bg-muted"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold">{court.name}</p>
                      <p className="text-sm text-muted-foreground">{court.type}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary text-sm">
                        ${(court.price_member || court.price_per_hour).toLocaleString("es-CL")}/hr
                      </p>
                      <p className="text-xs text-muted-foreground line-through">
                        ${court.price_per_hour.toLocaleString("es-CL")}/hr
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Select Date */}
          <Card>
            <CardHeader>
              <CardTitle>2. Selecciona la fecha</CardTitle>
            </CardHeader>
            <CardContent>
              <DayPicker
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                locale={es}
                disabled={{ before: new Date() }}
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Select Slots */}
          <Card>
            <CardHeader>
              <CardTitle>3. Selecciona los horarios</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedCourt && selectedDate ? (
                slots.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {slots.map((slot) => (
                      <button
                        key={slot}
                        onClick={() => toggleSlot(slot)}
                        className={`p-2 text-sm border rounded-md transition-colors ${
                          selectedSlots.includes(slot)
                            ? "bg-primary text-white border-primary"
                            : "hover:bg-muted"
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">
                    No hay horarios disponibles para esta fecha.
                  </p>
                )
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  Primero selecciona una cancha y fecha.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle>4. Resumen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Cancha</span>
                <span className="font-medium">
                  {courts.find((c) => c.id === selectedCourt)?.name || "-"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Fecha</span>
                <span className="font-medium">
                  {selectedDate ? format(selectedDate, "dd/MM/yyyy") : "-"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Horarios</span>
                <span className="font-medium">
                  {selectedSlots.length > 0
                    ? `${selectedSlots[0]} - ${parseInt(selectedSlots[selectedSlots.length - 1].split(":")[0]) + 1}:00`
                    : "-"}
                </span>
              </div>

              {/* Toggle Socio / No Socio */}
              <div className="p-3 bg-muted rounded-lg">
                <label className="text-sm font-medium block mb-2">¿Eres socio del club?</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsMember(true)}
                    className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors border ${
                      isMember
                        ? "bg-primary text-white border-primary"
                        : "bg-white text-foreground border-border hover:bg-muted"
                    }`}
                  >
                    Sí, soy socio
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsMember(false)}
                    className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors border ${
                      !isMember
                        ? "bg-primary text-white border-primary"
                        : "bg-white text-foreground border-border hover:bg-muted"
                    }`}
                  >
                    No soy socio
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Precio por hora: <strong>${getPriceLabel()}</strong>
                </p>
              </div>

              <div className="border-t pt-4 flex justify-between items-center">
                <div>
                  <span className="font-semibold block">Total</span>
                  <span className="text-xs text-muted-foreground">
                    {selectedSlots.length} {selectedSlots.length === 1 ? "hora" : "horas"} × ${getPriceLabel().split(" ")[0]}
                  </span>
                </div>
                <span className="text-2xl font-bold text-primary">
                  ${getTotalPrice().toLocaleString("es-CL")}
                </span>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Comprobante de pago <span className="text-destructive">*</span>
                </label>
                <Input 
                  type="file" 
                  accept="image/png,image/jpeg,image/jpg,application/pdf" 
                  onChange={(e) => setPaymentFile(e.target.files?.[0] || null)}
                />
                <p className="text-xs text-muted-foreground">
                  Sube una foto o PDF de tu comprobante de transferencia (obligatorio, máx. 5 MB).
                </p>
                {paymentFile ? (
                  <p className="text-xs text-primary">Archivo seleccionado: {paymentFile.name}</p>
                ) : (
                  <p className="text-xs text-destructive">No has seleccionado ningún archivo.</p>
                )}
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button
                type="button"
                className="w-full"
                disabled={selectedSlots.length === 0 || !paymentFile || loading}
                onClick={handleSubmit}
              >
                {loading ? "Procesando..." : "Confirmar Reserva"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
