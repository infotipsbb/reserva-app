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
  const [blocks, setBlocks] = useState<any[]>([]);
  const [courts, setCourts] = useState<any[]>([]);
  const [selectedCourt, setSelectedCourt] = useState<string>("all");
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const supabase = createClient();

  const fetchData = async () => {
    const { data: courtsData } = await supabase
      .from("courts")
      .select("*")
      .eq("is_active", true);
    
    const { data: res } = await supabase
      .from("reservations")
      .select("date, status, court_id, courts(name)")
      .in("status", ["pending", "approved"]);
    
    const { data: blk } = await supabase
      .from("availability_blocks")
      .select("start_date, end_date, court_id, reason, courts(name)");
    
    if (courtsData) setCourts(courtsData);
    if (res) setReservations(res);
    if (blk) {
      setBlocks(blk);
      console.log("Blocks loaded:", blk);
    }
    setLastUpdated(new Date().toLocaleTimeString("es-CL"));
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  const getDayStatus = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");

    // Filter blocks by court if selected
    const relevantBlocks = selectedCourt === "all" 
      ? blocks 
      : blocks.filter((b) => b.court_id === selectedCourt);

    // Check blocks - a day is blocked if ANY block covers this date
    const isBlocked = relevantBlocks.some((b) => {
      // Parse block dates (they come as ISO strings from Supabase)
      const blockStart = new Date(b.start_date);
      const blockEnd = new Date(b.end_date);
      
      // Create date objects for comparison (ignore time)
      const blockStartDate = new Date(blockStart.getFullYear(), blockStart.getMonth(), blockStart.getDate());
      const blockEndDate = new Date(blockEnd.getFullYear(), blockEnd.getMonth(), blockEnd.getDate());
      const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      
      return checkDate >= blockStartDate && checkDate <= blockEndDate;
    });
    if (isBlocked) return "blocked";

    // Filter reservations by court if selected
    const relevantReservations = selectedCourt === "all"
      ? reservations
      : reservations.filter((r) => r.court_id === selectedCourt);

    // Check reservations
    const dayRes = relevantReservations.filter((r) => r.date === dateStr);
    if (dayRes.some((r) => r.status === "approved")) return "approved";
    if (dayRes.some((r) => r.status === "pending")) return "pending";
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

  const selectedDayReservations = selectedDate
    ? reservations.filter((r) => {
        const matchesDate = r.date === format(selectedDate, "yyyy-MM-dd");
        const matchesCourt = selectedCourt === "all" || r.court_id === selectedCourt;
        return matchesDate && matchesCourt;
      })
    : [];

  const selectedDayBlocks = selectedDate
    ? blocks.filter((b) => {
        const blockStart = new Date(b.start_date);
        const blockEnd = new Date(b.end_date);
        
        // Compare dates ignoring time and timezone
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
          {blocks.length} bloqueos cargados · {reservations.length} reservas cargadas 
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
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-yellow-300" /> Pendiente
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-green-300" /> Aprobada
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-gray-400" /> Bloqueado
              </div>
            </div>
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

                {selectedDayReservations.length > 0 ? (
                  <>
                    <p className="font-semibold text-sm">Reservas:</p>
                    {selectedDayReservations.map((res, idx) => (
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
                ) : selectedDayBlocks.length === 0 && (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground mb-4">
                      No hay reservas ni bloqueos para este día.
                    </p>
                  </div>
                )}

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
