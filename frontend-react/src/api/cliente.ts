const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8080";

export async function api<T>(ruta: string, opciones: RequestInit = {}): Promise<T> {
    const token = sessionStorage.getItem("token");
    const res = await fetch(`${BASE}${ruta}`, {
        ...opciones,
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...opciones.headers,
        },
    });
    if (!res.ok) {
        const error = await res.json().catch(() => null);
        throw new Error(error?.mensaje ?? `Error ${res.status}`);
    }
    return res.status === 204 ? (undefined as T) : res.json();
}