import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import AdminToastNotifier from "@/components/admin-toast";

export default async function AuditoriaPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "super_admin") {
    redirect("/dashboard");
  }

  const { data: auditLogs } = await supabase
    .from("audit_logs")
    .select(`*, profiles(full_name)`)
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Registro de Auditoría</h1>
        <Link href="/admin">
          <Button variant="outline">← Volver al Panel</Button>
        </Link>
      </div>

      <AdminToastNotifier />

      <Card>
        <CardHeader>
          <CardTitle>Historial de Actividades</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Fecha</th>
                  <th className="text-left py-2">Usuario</th>
                  <th className="text-left py-2">Acción</th>
                  <th className="text-left py-2">Detalle</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs && auditLogs.length > 0 ? (
                  auditLogs.map((log) => (
                    <tr key={log.id} className="border-b">
                      <td className="py-2">{new Date(log.created_at).toLocaleString("es-CL")}</td>
                      <td className="py-2">{log.profiles?.full_name || "Sistema"}</td>
                      <td className="py-2">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                          log.action.includes("deleted") ? "bg-red-100 text-red-800" :
                          log.action.includes("approved") ? "bg-green-100 text-green-800" :
                          log.action.includes("rejected") ? "bg-yellow-100 text-yellow-800" :
                          "bg-gray-100 text-gray-800"
                        }`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="py-2 text-muted-foreground">{JSON.stringify(log.details)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-4 text-muted-foreground text-center">
                      No hay registros aún.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
