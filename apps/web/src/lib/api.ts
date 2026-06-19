import { getSession } from 'next-auth/react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

async function request(path: string, options: RequestInit = {}) {
  const session = (await getSession()) as { accessToken?: string } | null;

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(session?.accessToken
        ? { Authorization: `Bearer ${session.accessToken}` }
        : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message ?? 'Erro na requisição');
  }

  return res.json();
}

export const api = {
  get: (path: string) => request(path),
  post: (path: string, data: unknown) =>
    request(path, { method: 'POST', body: JSON.stringify(data) }),
  patch: (path: string, data: unknown) =>
    request(path, { method: 'PATCH', body: JSON.stringify(data) }),
  put: (path: string, data: unknown) =>
    request(path, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (path: string) => request(path, { method: 'DELETE' }),
};
