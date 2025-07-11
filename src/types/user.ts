// Enum que coincide con tu roles.enum del backend
export enum UserRole {
  CLIENTE = "cliente",
  EMPRESA = "empresa",
  EMBAJADOR = "embajador",
  ADMIN = "admin",
}

// Interface simple para Empresa (sin referencias circulares)
export interface Empresa {
  id: string;
  nombre: string;
}

// Interface para User basada en tu entidad
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
  isActive: boolean;
  empresa?: Empresa;
}

// Interface para Producto basada en tu entidad
export interface Producto {
  id: string;
  nombre: string;
  precio: number;
  categoria?: string;
  caracteristicas?: string;
  inventario: number;
  iva: number;
  ivaIncluido: boolean;
  envioDisponible: boolean;
  costoEnvio?: number;
  empresa: Empresa;
  imagen?: string;
  imagenPublicId?: string;
  imagenes?: string[];
  imagenesPublicIds?: string[];
}

// Para autenticación
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  empresa?: Empresa;
}

export interface LoginResponse {
  access_token: string;
  message: string;
  user: AuthUser;
}
