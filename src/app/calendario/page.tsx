"use client";

import { useEffect, useState } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { createClient } from "@/lib/supabase/client";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function CalendarioPage() {
  const [reservations, setReservations] = useState<any[]>([]);
  const [myReservations, setMyReservations] = useState<any[]>([]);
  const [blocks, setBlocks] = useState<any[]>([]);
  const [courts, setCourts] = useState<any[]>([]);
  const [selectedCourt, setSelectedCourt] = useState<string>("all");
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [user, setUser] = useState<any>(null);
  const supabase = createClient();

  const fetchData = async () => {
    const { data: courtsData } = await supabase
      .from("courts")
      .select("*")
      .eq("is_active", true);
    
    // Siempre cargar bloqueos (públicos)
    const { data: blk } = await supabase
      .from("availability_blocks")
      .select("start_date, end_date, court_id, reason, courts(name)");
    
    // Cargar TODAS las reservas (las políticas RLS permiten ver aprobadas/pendientes públicas)
    const { data: res } = await supabase
      .from("reservations")
      .select("date, status, court_id, user_id, courts(name)")
      .in("status", ["pending", "approved"]);
    
    // Obtener usuario actual
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    
    if (courtsData) setCourts(courtsData);
    if (res) setReservations(res);
    if (blk) setBlocks(blk);
    if (currentUser) {
      setUser(currentUser);
      // Filtrar solo mis reservas
      setMyReservations(res?.filter((r: any) => r.user_id === currentUser.id) || []);
    }
    setLastUpdated(new Date().toLocaleTimeString("es-CL"));
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  const getDayStatus = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");

    // 1. Verificar bloqueos (siempre público)
    const relevantBlocks = selectedCourt === "all" 
      ? blocks 
      : blocks.filter((b) => b.court_id === selectedCourt);

    const isBlocked = relevantBlocks.some((b) => {
      const blockStart = new Date(b.start_date);
      const blockEnd = new Date(b.end_date);
      const blockStartDate = new Date(blockStart.getFullYear(), blockStart.getMonth(), blockStart.getDate());
      const blockEndDate = new Date(blockEnd.getFullYear(), blockEnd.getMonth(), blockEnd.getDate());
      const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      return checkDate >= blockStartDate && checkDate <= blockEndDate;
    });
    if (isBlocked) return "blocked";

    // 2. Si el usuario está logueado, mostrar SOLO sus reservas en el calendario
    if (user) {
      const myRelevantReservations = selectedCourt === "all"
        ? myReservations
        : myReservations.filter((r) => r.court_id === selectedCourt);

      const dayRes = myRelevantReservations.filter((r) => r.date === dateStr);
      if (dayRes.some((r) => r.status === "approved")) return "approved";
      if (dayRes.some((r) => r.status === "pending")) return "pending";
    }

    return "available";
  };

  const modifiersStyles = {
    blocked: { backgroundColor: "#9ca3af", color: "#ffffff", borderRadius: "100%", fontWeight: "bold" },
    pending: { backgroundColor: "#fde047", color: "#854d0e", borderRadius: "100%" },
    approved: { backgroundColor: "#86efac", color: "#14532d", borderRadius: "100%" },
  };

  const modifiers = {
    blocked: (date: Date) => getDayStatus(date) === "blocked",
    pending: (date: Date) => getDayStatus(date) === "pending",
    approved: (date: Date) => getDayStatus(date) === "approved",
  };

  // En el panel de detalles: solo mostrar MIS reservas (si estoy logueado)
  const selectedDayMyReservations = selectedDate
    ? myReservations.filter((r) => {
        const matchesDate = r.date === format(selectedDate, "yyyy-MM-dd");
        const matchesCourt = selectedCourt === "all" || r.court_id === selectedCourt;
        return matchesDate && matchesCourt;
      })
    : [];

  const selectedDayBlocks = selectedDate
    ? blocks.filter((b) => {
        const blockStart = new Date(b.start_date);
        const blockEnd = new Date(b.end_date);
        const blockStartDate = new Date(blockStart.getFullYear(), blockStart.getMonth(), blockStart.getDate());
        const blockEndDate = new Date(blockEnd.getFullYear(), blockEnd.getMonth(), blockEnd.getDate());
        const checkDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
        const matchesDate = checkDate >= blockStartDate && checkDate <= blockEndDate;
        const matchesCourt = selectedCourt === "all" || b.court_id === selectedCourt;
        return matchesDate && matchesCourt;
      })
    : [];

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8 text-center">Disponibilidad de Canchas</h1>

      {/* Selector de Cancha */}
      <div className="mb-4 max-w-md mx-auto">
        <label className="block text-sm font-medium mb-2">Seleccionar cancha</label>
        <div className="flex gap-2">
          <select
            value={selectedCourt}
            onChange={(e) => {
              setSelectedCourt(e.target.value);
              setSelectedDate(undefined);
            }}
            className="flex-1 h-10 rounded-md border px-3 bg-white"
          >
            <option value="all">Todas las canchas</option>
            {courts.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <Button variant="outline" size="sm" onClick={fetchData} className="h-10">
            Recargar
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {blocks.length} bloqueos cargados
          {user ? ` · ${myReservations.length} mis reservas` : ""}
          {lastUpdated && ` · Actualizado: ${lastUpdated}`}
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 items-start">
        <Card>
          <CardHeader>
            <CardTitle>Calendario</CardTitle>
          </CardHeader>
          <CardContent>
            <DayPicker
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              locale={es}
              modifiers={modifiers}
              modifiersStyles={modifiersStyles}
              className="mx-auto"
            />
            <div className="flex flex-wrap gap-4 mt-6 justify-center text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-white border" /> Disponible
              </div>
              {user && (
                <>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-yellow-300" /> Mi reserva pendiente
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-green-300" /> Mi reserva aprobada
                  </div>
                </>
              )}
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-gray-400" /> Bloqueado
              </div>
            </div>
            {!user && (
              <p className="text-xs text-muted-foreground text-center mt-4">
                <Link href="/login" className="text-primary hover:underline">Inicia sesión</Link> para ver tus reservas en el calendario.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              {selectedDate
                ? `Detalles del ${format(selectedDate, "dd/MM/yyyy")}`
                : "Selecciona una fecha"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedDate ? (
              <div className="space-y-3">
                {/* Bloqueos (públicos) */}
                {selectedDayBlocks.length > 0 && (
                  <div className="p-3 bg-gray-100 rounded-lg border border-gray-300">
                    <p className="font-semibold text-gray-700">Bloqueos activos</p>
                    {selectedDayBlocks.map((b, idx) => (
                      <div key={idx} className="text-sm text-gray-600 mt-1">
                        <span className="font-medium">{b.courts?.name}</span>
                        {b.reason && <span> - {b.reason}</span>}
                        <div className="text-xs text-gray-500">
                          {new Date(b.start_date).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })} 
                          {" → "} 
                          {new Date(b.end_date).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Mis reservas (solo si estoy logueado) */}
                {user && selectedDayMyReservations.length > 0 ? (
                  <>
                    <p className="font-semibold text-sm">Mis reservas:</p>
                    {selectedDayMyReservations.map((res, idx) => (
                      <div key={idx} className={`p-3 rounded-lg border ${
                        res.status === "approved" 
                          ? "bg-green-50 border-green-200" 
                          : res.status === "pending"
                          ? "bg-yellow-50 border-yellow-200"
                          : "bg-red-50 border-red-200"
                      }`}>
                        <p className="font-medium">{res.courts?.name}</p>
                        <p className="text-sm">
                          Estado:{" "}
                          {res.status === "pending"
                            ? "Pendiente de aprobación"
                            : res.status === "approved"
                            ? "Reservado"
                            : "Rechazado"}
                        </p>
                      </div>
                    ))}
                  </>
                ) : (
                  selectedDayBlocks.length === 0 && (
                    <div className="text-center py-4">
                      <p className="text-muted-foreground mb-4">
                        {user 
                          ? "No tienes reservas ni hay bloqueos para este día."
                          : "No hay bloqueos para este día."
                        }
                      </p>
                    </div>
                  )
                )}

                {/* Botón reservar si no hay bloqueos */}
                {selectedDayBlocks.length === 0 && (
                  <Link href="/reservar">
                    <Button className="w-full mt-4">Reservar esta fecha</Button>
                  </Link>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                Haz clic en una fecha del calendario para ver detalles.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
