const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

class ApiError extends Error {
  response: { status: number; data: { message: string; [key: string]: unknown } };

  constructor(message: string, status: number, data: { message: string; [key: string]: unknown }) {
    super(message);
    this.response = { status, data };
  }
}

function getToken(): string | null {
  return typeof window !== 'undefined' ? sessionStorage.getItem('access_token') : null;
}

function buildHeaders(token: string | null, hasBody: boolean): HeadersInit {
  const headers: Record<string, string> = {};
  if (hasBody) headers['Content-Type'] = 'application/json';
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

function doFetch(method: string, url: string, token: string | null, body?: unknown): Promise<Response> {
  return fetch(url, {
    method,
    headers: buildHeaders(token, body !== undefined),
    credentials: 'include',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  params?: Record<string, string>,
): Promise<{ data: T }> {
  let url = `${BASE_URL}${path}`;
  if (params && Object.keys(params).length > 0) {
    url += '?' + new URLSearchParams(params).toString();
  }

  let res = await doFetch(method, url, getToken(), body);

  if (res.status === 401) {
    try {
      const refreshRes = await fetch(`${BASE_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!refreshRes.ok) throw new Error('Refresh failed');
      const { accessToken } = await refreshRes.json();
      sessionStorage.setItem('access_token', accessToken);
      res = await doFetch(method, url, accessToken, body);
    } catch {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('access_token');
        window.location.href = '/login';
      }
      throw new ApiError('Unauthorized', 401, { message: 'Unauthorized' });
    }
  }

  if (!res.ok) {
    let errorData: { message: string } = { message: 'Erro inesperado' };
    try {
      errorData = await res.json();
    } catch {}
    throw new ApiError(errorData.message ?? 'Erro inesperado', res.status, errorData);
  }

  if (res.status === 204) {
    return { data: undefined as T };
  }

  const data: T = await res.json();
  return { data };
}

const api = {
  get: <T = any>(path: string, config?: { params?: Record<string, string> }) =>
    request<T>('GET', path, undefined, config?.params),
  post: <T = any>(path: string, body?: unknown) =>
    request<T>('POST', path, body),
  patch: <T = any>(path: string, body?: unknown) =>
    request<T>('PATCH', path, body),
  put: <T = any>(path: string, body?: unknown) =>
    request<T>('PUT', path, body),
  delete: <T = any>(path: string) =>
    request<T>('DELETE', path),
};

export default api;
