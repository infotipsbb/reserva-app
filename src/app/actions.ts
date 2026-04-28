"use server";

import { createServiceClient } from "@/lib/supabase/service";

export async function createProfileIfNotExists(
  userId: string,
  fullName: string,
  email: string,
  phone: string
) {
  const supabase = createServiceClient();

  // Verificar si el perfil ya existe
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .single();

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
    return { success: false, error: error.message };
  }

  return { success: true, message: "Profile created successfully" };
}
