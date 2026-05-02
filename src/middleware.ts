import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANTE: getUser() es más seguro que getSession() porque valida el token con el servidor de Supabase
  const { data: { user } } = await supabase.auth.getUser();

  const url = new URL(request.url);
  const isAuthPage = url.pathname === "/" || url.pathname === "/login" || url.pathname === "/register";
  const isDashboardPage = url.pathname.startsWith("/dashboard");

  // Lógica de Redirección Protegida
  
  // 1. Si el usuario NO está logueado y trata de entrar al dashboard -> Al login
  if (!user && isDashboardPage) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 2. Si el usuario YA está logueado y trata de entrar a login/register -> Al dashboard
  if (user && isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Protege todas las rutas excepto archivos estáticos y api interna
     */
    "/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};