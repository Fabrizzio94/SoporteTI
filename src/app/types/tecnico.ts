export interface Tecnico {
  cedula: string;
  nombres: string;
  apellidos: string;
  nombreCompleto?: string;
  celular: string;
  estado: string;
  usuario: string;
  password: string;
  rol: string;
}

export interface Usuario {
  name?: string | null;
  role: string;
  cedula: string;
}