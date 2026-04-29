"use server";

import { createServiceClient } from "@/lib/supabase/service";

export async function createProfileIfNotExists(
  userId: string,
  fullName: string,
  email: string,
  phone: string
) {
  try {
    const supabase = createServiceClient();

    // Verificar si el perfil ya existe
    const { data: existingProfile, error: selectError } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .maybeSingle();

    if (selectError) {
      console.error("Error checking profile:", selectError.message);
      return { success: false, error: selectError.message };
    }

    if (existingProfile) {
      return { success: true, message: "Profile already exists" };
    }

    // Crear el perfil con privilegios de servicio (bypass RLS)
    const { error } = await supabase.from("profiles").insert({
      id: userId,
      full_name: fullName,
      email: email,
      phone: phone,
      role: "user",
    });

    if (error) {
      console.error("Error creating profile:", error.message);
      return { success: false, error: error.message };
    }

    return { success: true, message: "Profile created successfully" };
  } catch (err: any) {
    console.error("Unexpected error in createProfileIfNotExists:", err);
    return { success: false, error: err.message || "Error inesperado al verificar perfil" };
  }
}
