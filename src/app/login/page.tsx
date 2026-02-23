"use client";
import React, { useState } from "react";
import { signIn } from "next-auth/react";
import toast from "react-hot-toast";
export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  // manejador de evento de ingreso
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Evita que la página se recargue
    setLoading(true);

    try {
      // signIn apunta directamente a tu archivo api/auth/[...nextauth]/route.ts
      const result = await signIn("credentials", {
        username: username,
        password: password,
        redirect: false, // Manejamos la redirección manualmente
      });

      if (result?.error) {
        toast.error("Usuario o contraseña incorrectos");
        setLoading(false);
      } else {
        toast.success("¡Bienvenido!");
        // Redirigir al dashboard o farmacias
        window.location.href = "/farmacias";
      }
    } catch (error) {
      toast.error("Ocurrió un error al intentar ingresar");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-slate-900">Bienvenido</h1>
          <p className="text-center text-xs text-slate-400 mt-8 uppercase tracking-widest text-slate-400">
            Soporte Técnico TI
          </p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Usuario
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="text-black w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              placeholder="Ingrese usuario"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="text-black w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 rounded-xl shadow-lg transition-transform active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? "Cargando..." : "Iniciar Sesión"}
          </button>
        </form>
      </div>
    </div>
  );
}
