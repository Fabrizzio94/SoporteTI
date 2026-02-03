import React from "react";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-slate-900">Bienvenido</h1>
          <p className="text-center text-xs text-slate-400 mt-8 uppercase tracking-widest">
            Soporte Técnico IT
          </p>
        </div>

        <form className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Usuario
            </label>
            <input
              type="text"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-slate-600"
              placeholder="usuario"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Contraseña
            </label>
            <input
              type="password"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-slate-600"
              placeholder="••••••••"
            />
          </div>

          <button className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 rounded-xl shadow-lg transition-transform active:scale-[0.98]">
            Iniciar Sesión
          </button>
        </form>
      </div>
    </div>
  );
}
