"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const fetchProfile = async (userId: string) => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .single();
      if (profile) setRole(profile.role);
    };

    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        await fetchProfile(session.user.id);
      }
      setLoading(false);
    };
    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: any, session: any) => {
        if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
          setUser(session?.user ?? null);
          if (session?.user) await fetchProfile(session.user.id);
        } else if (event === "SIGNED_OUT") {
          setUser(null);
          setRole(null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setMobileOpen(false);
    router.push("/");
    router.refresh();
  };

  const isLanding = pathname === "/";

  const navLinkClass = (active?: boolean) =>
    `text-sm hover:opacity-80 transition-opacity ${active ? "font-bold underline" : ""} ${isLanding ? "text-white" : ""}`;

  const navItems = (
    <>
      <Link href="/calendario" className={navLinkClass()} onClick={() => setMobileOpen(false)}>
        Calendario
      </Link>
      {user ? (
        <>
          <Link href="/dashboard" className={navLinkClass()} onClick={() => setMobileOpen(false)}>
            Mis Reservas
          </Link>
          {(role === "admin" || role === "super_admin") && (
            <>
              <Link href="/admin" className={navLinkClass(pathname.startsWith("/admin"))} onClick={() => setMobileOpen(false)}>
                Administración
              </Link>
              {pathname.startsWith("/admin") && role === "super_admin" && (
                <Link href="/admin/auditoria" className={navLinkClass(pathname === "/admin/auditoria")} onClick={() => setMobileOpen(false)}>
                  Auditoría
                </Link>
              )}
            </>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className={isLanding ? "border-white text-white bg-transparent hover:bg-white/20 hover:text-white" : ""}
          >
            Cerrar Sesión
          </Button>
        </>
      ) : (
        <Link href="/login" onClick={() => setMobileOpen(false)}>
          <Button
            variant={isLanding ? "outline" : "default"}
            size="sm"
            className={isLanding ? "border-white text-white bg-transparent hover:bg-white/20 hover:text-white" : ""}
          >
            Iniciar Sesión
          </Button>
        </Link>
      )}
    </>
  );

  if (loading) {
    return (
      <nav className={`w-full px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between ${isLanding ? "fixed top-0 left-0 z-50 text-white" : "fixed top-0 left-0 z-50 bg-white border-b text-foreground"}`}>
        <Link href="/" className="text-lg sm:text-xl font-bold">CD Minvu Serviu Biobío</Link>
        <div className="h-9 w-20 bg-gray-200/20 rounded animate-pulse" />
      </nav>
    );
  }

  return (
    <>
      <nav
        className={`fixed top-0 left-0 w-full z-50 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between ${
          isLanding
            ? "text-white bg-black/30 backdrop-blur-sm"
            : "bg-white border-b text-foreground"
        }`}
      >
        <Link href="/" className="text-lg sm:text-xl font-bold truncate">
          CD Minvu Serviu Biobío
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-4">
          {navItems}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 rounded-md hover:bg-white/10 active:bg-white/20"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </nav>

      {/* Mobile menu overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          {/* Menu panel */}
          <div
            className={`absolute top-[60px] left-0 right-0 mx-4 rounded-xl shadow-2xl overflow-hidden ${
              isLanding ? "bg-gray-900/95 text-white" : "bg-white text-foreground border"
            }`}
          >
            <div className="flex flex-col items-stretch p-4 gap-3">
              {navItems}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
