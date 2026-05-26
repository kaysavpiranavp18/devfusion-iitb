import { supabase } from './supabase';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

async function getAuthToken() {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token || null;
}

function buildHeaders(initHeaders?: HeadersInit, token?: string | null) {
  const headers = new Headers(initHeaders || {});

  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  return headers;
}

export async function backendFetch(path: string, init: RequestInit = {}) {
  const token = await getAuthToken();
  return fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: buildHeaders(init.headers, token),
  });
}

export async function backendJson<T>(path: string, init: RequestInit = {}) {
  const response = await backendFetch(path, init);
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error || 'Request failed');
  }

  return data as T;
}