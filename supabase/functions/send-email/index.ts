import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

// Usar variables de entorno de Supabase (las que ya existen con prefijo SUPABASE_)
// o las custom que creamos nosotros
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || Deno.env.get("PROJECT_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SERVICE_ROLE_KEY");

serve(async (req) => {
  try {
    // DEBUG: Log qué variables de entorno están disponibles
    console.log("=== DEBUG ENV VARS ===");
    console.log("SUPABASE_URL exists:", !!Deno.env.get("SUPABASE_URL"));
    console.log("PROJECT_URL exists:", !!Deno.env.get("PROJECT_URL"));
    console.log("SUPABASE_SERVICE_ROLE_KEY exists:", !!Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"));
    console.log("SERVICE_ROLE_KEY exists:", !!Deno.env.get("SERVICE_ROLE_KEY"));
    console.log("RESEND_API_KEY exists:", !!RESEND_API_KEY);
    console.log("Final SUPABASE_URL:", SUPABASE_URL ? "Set" : "Not set");
    console.log("Final SUPABASE_SERVICE_ROLE_KEY:", SUPABASE_SERVICE_ROLE_KEY ? "Set" : "Not set");
    console.log("======================");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(
        JSON.stringify({ 
          error: "Missing environment variables", 
          details: "SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not found. Please check Edge Function Secrets." 
        }), 
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!RESEND_API_KEY) {
      return new Response(
        JSON.stringify({ 
          error: "Missing RESEND_API_KEY", 
          details: "Please add RESEND_API_KEY to Edge Function Secrets" 
        }), 
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Validar que RESEND_API_KEY parezca válida (empieza con re_)
    if (!RESEND_API_KEY.startsWith("re_")) {
      return new Response(
        JSON.stringify({ 
          error: "Invalid RESEND_API_KEY format", 
          details: "RESEND_API_KEY should start with 're_'. Get yours from https://resend.com" 
        }), 
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const { type, record } = await req.json();

    if (!record?.user_id) {
      return new Response("No user_id provided", { status: 400 });
    }

    console.log("Processing email type:", type, "for user:", record.user_id);

    // Create Supabase client with service role to fetch user profile
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch user profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", record.user_id)
      .single();

    if (profileError || !profile) {
      console.error("Profile fetch error:", profileError);
      return new Response(
        JSON.stringify({ error: "Profile not found", details: profileError }), 
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log("Profile found:", profile.email);

    // Fetch court name
    const { data: court, error: courtError } = await supabase
      .from("courts")
      .select("name")
      .eq("id", record.court_id)
      .single();

    const courtName = court?.name || "Cancha";
    const { full_name, email } = profile;

    let subject = "";
    let html = "";

    if (type === "pending") {
      subject = "Tu solicitud de reserva está pendiente de aprobación";
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #eab308;">Hola ${full_name},</h2>
          <p>Hemos recibido tu solicitud de reserva correctamente.</p>
          
          <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Detalle de tu solicitud:</h3>
            <p><strong>Espacio:</strong> ${courtName}</p>
            <p><strong>Fecha:</strong> ${record.date}</p>
            <p><strong>Horario:</strong> ${record.start_time} - ${record.end_time}</p>
            <p><strong>Total:</strong> $${Number(record.total_price).toLocaleString("es-CL")}</p>
          </div>
          
          <p>Tu solicitud se encuentra <strong>pendiente de aprobación</strong> por parte de la administración.</p>
          <p>Te notificaremos por correo cuando tu reserva sea confirmada.</p>
          
          <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 30px 0;" />
          <p style="color: #737373; font-size: 12px;">
            Club Deportivo Minvu Serviu<br/>
            Sistema de Reservas
          </p>
        </div>
      `;
    } else if (type === "approved") {
      subject = "Tu reserva ha sido aprobada";
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #16a34a;">¡Hola ${full_name}!</h2>
          <p>Nos complace informarte que tu reserva ha sido <strong>aprobada</strong>.</p>
          
          <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #86efac;">
            <h3 style="margin-top: 0; color: #15803d;">Detalle de tu reserva confirmada:</h3>
            <p><strong>Espacio:</strong> ${courtName}</p>
            <p><strong>Fecha:</strong> ${record.date}</p>
            <p><strong>Horario:</strong> ${record.start_time} - ${record.end_time}</p>
            <p><strong>Total:</strong> $${Number(record.total_price).toLocaleString("es-CL")}</p>
          </div>
          
          <p>Te esperamos en el recinto. Recuerda llegar con anticipación.</p>
          <p>Si tienes alguna consulta, responde a este correo.</p>
          
          <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 30px 0;" />
          <p style="color: #737373; font-size: 12px;">
            Club Deportivo Minvu Serviu<br/>
            Sistema de Reservas
          </p>
        </div>
      `;
    } else {
      return new Response("Unknown notification type", { status: 400 });
    }

    console.log("Sending email via Resend to:", email);

    // Send email via Resend
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Reservas Club Deportivo <onboarding@resend.dev>",
        to: email,
        subject,
        html,
      }),
    });

    const data = await res.json();
    
    console.log("Resend response:", res.status, data);
    
    if (!res.ok) {
      console.error("Resend API error:", data);
      return new Response(JSON.stringify(data), { status: 500 });
    }

    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Edge function error:", error);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
