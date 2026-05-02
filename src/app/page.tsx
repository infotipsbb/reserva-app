"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });

      if (authError) {
        setError(authError.message);
        setLoading(false);
      } else {
        // Hard navigation es correcto aquí para asegurar que el middleware 
        // de Next.js detecte la nueva cookie de sesión inmediatamente.
        window.location.href = "/dashboard";
      }
    } catch (err: any) {
      setError("Error de conexión. Intenta de nuevo.");
      setLoading(false);
    }
  };

  return (
    <main className="flex-center">
      <section className="auth-card">
        <header className="auth-header">
          <h1 className="auth-title">Iniciar Sesión</h1>
          <p className="auth-description">Ingresa tus credenciales para acceder</p>
        </header>

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="email" className="form-label">Correo electrónico</label>
            <input
              id="email"
              type="email"
              className="form-input"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">Contraseña</label>
            <input
              id="password"
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          {error && <p className="error-message" role="alert">{error}</p>}

          <button 
            type="submit" 
            className="btn-primary" 
            disabled={loading}
          >
            {loading ? "Cargando..." : "Ingresar"}
          </button>
        </form>

        <footer className="auth-footer">
          ¿No tienes cuenta?{" "}
          <Link href="/register" className="link">
            Regístrate aquí
          </Link>
        </footer>
      </section>
    </main>
  );
}