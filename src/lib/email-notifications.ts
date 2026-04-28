"use server";

import { createClient } from "@/lib/supabase/server";

export async function sendEmailNotification(
  type: "pending" | "approved",
  reservation: {
    user_id: string;
    court_id: string;
    date: string;
    start_time: string;
    end_time: string;
    total_price: number;
  }
) {
  try {
    const supabase = await createClient();
    
    // Llamar Edge Function directamente
    const { data, error } = await supabase.functions.invoke("send-email", {
      body: {
        type,
        record: reservation,
      },
    });

    if (error) {
      console.error("Error calling send-email function:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err: any) {
    console.error("Exception calling send-email:", err);
    return { success: false, error: err.message };
  }
}
