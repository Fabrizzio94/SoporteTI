"use client";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  RefreshCcw,
  Upload,
  Plus,
  Server,
  Monitor,
  Keyboard,
  Mouse,
  Printer,
  Zap,
  Fingerprint,
  Barcode,
  Phone,
  ArrowLeftRight,
  Disc,
  CreditCard,
  TvMinimal,
} from "lucide-react";
import toast from "react-hot-toast";
import { Activo } from "@/app/types/activo";
import { Usuario } from "@/app/types/tecnico";
import ActivosTable from "../components/activos/ActivosTable";
import ActivoModal from "../components/activos/ActivoModal";
import ActivosSearch from "../components/activos/ActivosSearch";
import { useDebounce } from "../hooks/useDebounce";

const TIPO_CHIPS = [
  { nombre: "CPU", label: "CPU (Servidor)", icon: Server },
  { nombre: "CPU TERMINAL", label: "CPU Terminal", icon: Monitor },
  { nombre: "TECLADO", label: "Teclado", icon: Keyboard },
  { nombre: "MOUSE", label: "Mouse", icon: Mouse },
  { nombre: "IMPRESORA", label: "Impresora", icon: Printer },
  { nombre: "IMPRESORA TERMICA", label: "Impresora Termica", icon: Printer },
  {
    nombre: "IMPRESORA MULTIFUNCION",
    label: "Impresora Multifuncion",
    icon: Printer,
  },
  {
    nombre: "SWITCH",
    label: "Switch",
    icon: ArrowLeftRight,
  },
  {
    nombre: "ACCES POINT",
    label: "Access Point",
    icon: Disc,
  },
  { nombre: "UPS", label: "UPS", icon: Zap },
  {
    nombre: "LECTOR DE HUELLA DIGITAL",
    label: "Lector Huellas",
    icon: Fingerprint,
  },
  {
    nombre: "LECTOR DE CODIGO DE BARRAS",
    label: "Lector Barras",
    icon: Barcode,
  },
  {
    nombre: "LECTOR DE BANDA MAGNETICA",
    label: "Banda Magnetica",
    icon: CreditCard,
  },
  { nombre: "TELEFONO IP", label: "Teléfono IP", icon: Phone },
  { nombre: "MONITOR", label: "Monitor", icon: TvMinimal },
  { nombre: "MONITOR 19 PULGADAS", label: "Monitor 19'", icon: TvMinimal },
  { nombre: "MONITOR 19.5 PULGADAS", label: "Monitor 19.5'", icon: TvMinimal },
  { nombre: "MONITOR 18.5 PULGADAS", label: "Monitor 18.5'", icon: TvMinimal },
  { nombre: "MONITOR 16 PULGADAS", label: "Monitor 16'", icon: TvMinimal },
  { nombre: "MONITOR 16.5 PULGADAS", label: "Monitor 16.5'", icon: TvMinimal },
  { nombre: "MONITOR 15 PULGADAS", label: "Monitor 15'", icon: TvMinimal },
  { nombre: "MONITOR 15.6 PULGADAS", label: "Monitor 15.6'", icon: TvMinimal },
];

export default function ActivosPage() {
  const { data: session } = useSession();
  const user = session?.user as Usuario;
  const [activos, setActivos] = useState<Activo[]>([]);
  const [farmacias, setFarmacias] = useState<
    { oficina: string; nombre: string }[]
  >([]);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [total, setTotal] = useState(0);
  const [filtroFarmacia, setFiltroFarmacia] = useState("");
  const [filtroTecnico, setFiltroTecnico] = useState("");
  const [activoSeleccionado, setActivoSeleccionado] = useState<Activo | null>(
    null,
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [paginaActual, setPaginaActual] = useState(1);
  const [registroPorPagina, setRegistroPorPagina] = useState(10);
  const fileRef = useRef<HTMLInputElement>(null);
  const [habilitarBoton, setHabilitarBoton] = useState(false);
  // FILTRO DE MARCA
  const [filtroMarca, setFiltroMarca] = useState("");
  const [marcasDisponibles, setMarcasDisponibles] = useState<string[]>([]);
  const [tecnicosUnicos, setTecnicosUnicos] = useState<string[]>([]);
  const [farmaciasDisponibles, setFarmaciasDisponibles] = useState<string[]>(
    [],
  );
  const [conteoTipos, setConteoTipos] = useState<
    { nombre_activo: string; total: number }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const limit = registroPorPagina;
  useEffect(() => {
    fetch("/api/activos/filtros")
      .then((r) => r.json())
      .then((d) => {
        setMarcasDisponibles(d.marcas ?? []);
        setTecnicosUnicos(d.tecnicos ?? []);
        setFarmaciasDisponibles(d.farmacias ?? []);
        setConteoTipos(d.conteoTipos ?? []);
      });
    fetch("/api/farmacias")
      .then((r) => r.json())
      .then((d) =>
        setFarmacias(
          Array.isArray(d)
            ? d.map((f: any) => ({ oficina: f.oficina, nombre: f.nombre }))
            : [],
        ),
      );
  }, []);
  const refreshData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("busqueda", debouncedSearch);
    if (filtroFarmacia) params.set("farmacia", filtroFarmacia);
    if (filtroTecnico) params.set("tecnico", filtroTecnico);
    if (filtroMarca) params.set("marca", filtroMarca);
    params.set("page", paginaActual.toString());
    params.set("limit", registroPorPagina.toString());

    try {
      const r = await fetch(`/api/activos?${params.toString()}`);
      const d = await r.json();
      setActivos(d.data ?? []);
      setTotal(d.total ?? 0);
    } finally {
      setLoading(false);
    }
  }, [
    debouncedSearch,
    filtroFarmacia,
    filtroTecnico,
    filtroMarca,
    paginaActual,
    registroPorPagina,
  ]);
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  useEffect(() => {
    setPaginaActual(1);
  }, [
    debouncedSearch,
    filtroFarmacia,
    filtroTecnico,
    filtroMarca,
    registroPorPagina,
  ]);
  // Conteo por tipo para ccards mejorado para solo filtrar los disponibles segun lo que se filtre en filtered que maneja
  // filtro global por codigo, nombre, nombre farmacia, marca.
  const conteoPorTipo = TIPO_CHIPS.map((t) => ({
    ...t,
    count: conteoTipos.find((a) => a.nombre_activo === t.nombre)?.total ?? 0,
  }));
  // PAGINACION
  const totalPaginas = Math.ceil(total / limit);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Validar extensión en frontend, revisa que el usuario suba .xlsx y no otro formato.
    if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      toast.error("Solo se aceptan archivos Excel (.xlsx, .xls)");
      e.target.value = "";
      return;
    }
    const formData = new FormData();
    formData.append("file", file);
    try {
      const toastId = toast.loading("Importando Excel...");
      setHabilitarBoton(true);
      const r = await fetch("/api/activos/import", {
        method: "POST",
        body: formData,
      });
      const data = await r.json();
      if (!r.ok) {
        toast.error(data.error || "Error al importar", { id: toastId });
      } else {
        toast.success(
          `${data.insertados} insertados, ${data.actualizados} actualizados`,
          { id: toastId },
        );
        refreshData();
        setShowUpload(false);
      }
    } catch {
      toast.error("Error inesperado al procesar el archivo");
    } finally {
      e.target.value = "";
      setHabilitarBoton(false);
    }
  };
  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold text-slate-800 mb-1">Activos</h1>

      {/* CHIPS POR TIPO */}
      <div className="flex flex-wrap gap-2 mb-4">
        {conteoPorTipo
          .filter(({ count }) => count > 0)
          .map(({ nombre, label, icon: Icon, count }) => (
            <div
              key={nombre}
              className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-600 shadow-sm"
            >
              <Icon className="w-4 h-4 text-indigo-500" />
              <span>{label}</span>
              <span className="font-bold text-slate-800">{count}</span>
            </div>
          ))}
      </div>

      {/* TOOLBAR */}
      <div className="flex items-center justify-between bg-white border border-slate-200 rounded-lg px-4 py-2 shadow-sm mb-4">
        <div className="flex items-center gap-3 flex-wrap">
          <ActivosSearch onSearch={setSearch} className="w-32 lg:w-48" />
          <div className="w-px h-6 bg-slate-200" />
          <select
            className="text-sm border border-slate-200 rounded-md px-2 py-1.5 text-slate-600 outline-none w-32 lg:w-48"
            value={filtroFarmacia}
            onChange={(e) => setFiltroFarmacia(e.target.value)}
          >
            <option value="">Farmacia: Todas</option>
            {farmaciasDisponibles.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
          {user?.role === "COORDINADOR" && (
            <select
              className="text-sm border border-slate-200 rounded-md px-2 py-1.5 text-slate-600 outline-none w-32 lg:w-48"
              value={filtroTecnico}
              onChange={(e) => {
                setFiltroTecnico(e.target.value);
                setFiltroMarca("");
              }}
            >
              <option value="">Técnico: Todos</option>
              {tecnicosUnicos.sort().map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          )}
          <select
            className="text-sm border border-slate-200 rounded-md px-2 py-1.5 text-slate-600 outline-none w-32 lg:w-48"
            value={filtroMarca}
            onChange={(e) => setFiltroMarca(e.target.value)}
          >
            <option value="">Marca: Todas</option>
            {marcasDisponibles.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-3 ml-auto">
          {user?.role === "COORDINADOR" && (
            <>
              <button
                onClick={() => setShowUpload(!showUpload)}
                className="flex items-center gap-2 text-sm border border-slate-200 bg-white text-slate-600 px-3 py-1.5 rounded-md hover:bg-slate-50 transition"
              >
                <Upload className="w-4 h-4" />
                <span className="hidden lg:inline">Importar Excel</span>
              </button>
              <div className="w-px h-6 bg-slate-200" />
            </>
          )}
          <button
            disabled={habilitarBoton}
            onClick={() => {
              setActivoSeleccionado(null);
              setModalOpen(true);
            }}
            className="flex items-center gap-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-md transition"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden lg:inline">Nuevo Activo</span>
          </button>
        </div>
      </div>

      {/* ZONA IMPORTAR */}
      {showUpload && (
        <div className="border-2 border-dashed border-indigo-200 rounded-lg p-6 text-center bg-indigo-50 mb-4">
          <Upload className="w-8 h-8 text-indigo-400 mx-auto mb-2" />
          <p className="text-sm font-medium text-indigo-700">
            Subir Excel aqui, columnas requeridas:
          </p>
          <div className="flex flex-wrap gap-2 justify-center my-3">
            {[
              "Nombre Activo",
              "Activo Fijo",
              "Centro Costo Origen",
              "Fecha de Alta",
              "Detalle",
            ].map((c) => (
              <span
                key={c}
                className="bg-white border border-indigo-200 text-indigo-600 text-xs font-mono px-2 py-0.5 rounded"
              >
                {c}
              </span>
            ))}
          </div>
          <p className="text-xs text-indigo-400 mb-3">
            Farmacias franquicia: no se insertan activos nuevos · Solo se
            actualizan existentes
          </p>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={handleImport}
          />
          <div className="flex gap-2 justify-center">
            <button
              disabled={habilitarBoton}
              onClick={() => setShowUpload(false)}
              className="text-sm border border-slate-200 bg-white px-4 py-1.5 rounded-md text-slate-600"
            >
              Cancelar
            </button>
            <button
              disabled={habilitarBoton}
              onClick={() => fileRef.current?.click()}
              className="text-sm bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded-md"
            >
              Seleccionar archivo
            </button>
          </div>
        </div>
      )}

      {/* TABLA */}
      {loading ? (
        <div className="space-y-2 mt-4">
          {[...Array(registroPorPagina)].map((_, i) => (
            <div key={i} className="h-10 bg-slate-100 rounded animate-pulse" />
          ))}
        </div>
      ) : (
        <ActivosTable
          activos={activos}
          onEdit={(a) => {
            setActivoSeleccionado(a);
            setModalOpen(true);
          }}
        />
      )}

      {/* PAGINACIÓN */}
      <div className="mt-6 flex items-center justify-between">
        <select
          className="text-sm border border-slate-200 rounded-md px-2 py-1 text-slate-600"
          value={registroPorPagina}
          onChange={(e) => {
            setRegistroPorPagina(Number(e.target.value));
            setPaginaActual(1);
          }}
        >
          <option value={10}>10 por página</option>
          <option value={25}>25 por página</option>
          <option value={50}>50 por página</option>
        </select>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPaginaActual((p) => Math.max(p - 1, 1))}
            disabled={paginaActual === 1}
            className="px-3 py-1.5 text-sm border border-slate-200 rounded-md hover:bg-slate-800 hover:text-white disabled:opacity-40 transition"
          >
            Anterior
          </button>
          {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((num) => {
            if (
              num === 1 ||
              num === totalPaginas ||
              (num >= paginaActual - 1 && num <= paginaActual + 1)
            ) {
              return (
                <button
                  key={num}
                  onClick={() => setPaginaActual(num)}
                  className={`min-w-9 px-3 py-1.5 text-sm rounded-md transition ${paginaActual === num ? "bg-slate-800 text-white" : "border border-slate-200 hover:bg-slate-800 hover:text-white"}`}
                >
                  {num}
                </button>
              );
            }
            if (num === paginaActual - 2 || num === paginaActual + 2)
              return (
                <span key={num} className="px-1 text-slate-400">
                  ...
                </span>
              );
            return null;
          })}
          <button
            onClick={() =>
              setPaginaActual((p) => Math.min(p + 1, totalPaginas))
            }
            disabled={paginaActual === totalPaginas}
            className="px-3 py-1.5 text-sm border border-slate-200 rounded-md hover:bg-slate-800 hover:text-white disabled:opacity-40 transition"
          >
            Siguiente
          </button>
        </div>
      </div>

      {/* MODAL */}
      <ActivoModal
        open={modalOpen}
        activo={activoSeleccionado}
        farmacias={[...farmacias].sort((a, b) =>
          a.nombre?.localeCompare(b.nombre),
        )}
        onClose={() => setModalOpen(false)}
        onSaved={() => {
          setModalOpen(false);
          refreshData();
        }}
      />
    </main>
  );
}
