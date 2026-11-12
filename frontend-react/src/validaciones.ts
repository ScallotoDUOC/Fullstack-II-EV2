// Validaciones simples y límites de largo para los datos que escribe el usuario.
// Los mismos límites se aplican en el servicio Usuarios (DTOs), así que aquí solo se evita ir a pedir algo que el servidor rechazaría.
export const LIMITES = { nombre: 50, email: 100, password: 64, rut: 12, telefono: 9, direccion: 100, indicaciones: 250, comentario: 500 } as const;

const RE_NOMBRE = /^\p{L}[\p{L} .'’-]*$/u;
const RE_DIRECCION = /^[\p{L}\p{N} .,#°ºª/'’()-]+$/u;

/** Deja solo dígitos y corta en `max` (para campos numéricos como el teléfono). */
export const soloDigitos = (texto: string, max: number): string => texto.replace(/\D/g, "").slice(0, max);

export function errorNombre(valor: string): string | null {
  const v = valor.trim();
  if (v.length < 2) return "El nombre debe tener al menos 2 letras";
  if (v.length > LIMITES.nombre) return `El nombre no puede pasar de ${LIMITES.nombre} caracteres`;
  if (!RE_NOMBRE.test(v)) return "El nombre solo puede tener letras, espacios, punto, apóstrofo y guion";
  return null;
}

export function errorEmail(valor: string): string | null {
  const v = valor.trim();
  if (!v) return "El correo es obligatorio";
  if (v.length > LIMITES.email) return `El correo no puede pasar de ${LIMITES.email} caracteres`;
  return null;
}

export function errorPassword(valor: string): string | null {
  if (valor.length < 6) return "La contraseña debe tener al menos 6 caracteres";
  if (valor.length > LIMITES.password) return `La contraseña no puede pasar de ${LIMITES.password} caracteres`;
  return null;
}

/** Teléfono chileno: exactamente 9 dígitos (ej. 912345678). Si no es obligatorio, vacío es válido. */
export function errorTelefono(valor: string, obligatorio = false): string | null {
  const v = valor.trim();
  if (!v) return obligatorio ? "El teléfono es obligatorio" : null;
  return /^\d{9}$/.test(v) ? null : "El teléfono debe tener exactamente 9 dígitos (ej. 912345678)";
}

export function errorDireccion(valor: string, obligatoria = false): string | null {
  const v = valor.trim();
  if (!v) return obligatoria ? "La dirección es obligatoria" : null;
  if (v.length > LIMITES.direccion) return `La dirección no puede pasar de ${LIMITES.direccion} caracteres`;
  if (!RE_DIRECCION.test(v)) return "La dirección tiene caracteres no permitidos (usa letras, números y . , # - / ( ))";
  return null;
}

/** Texto libre corto (indicaciones, comentarios): largo máximo y sin < > ni comillas invertidas. */
export function errorTextoLibre(valor: string, max: number, nombre: string): string | null {
  if (valor.length > max) return `${nombre} no puede pasar de ${max} caracteres`;
  if (/[<>`]/.test(valor)) return `${nombre} tiene caracteres no permitidos (< > \`)`;
  return null;
}
