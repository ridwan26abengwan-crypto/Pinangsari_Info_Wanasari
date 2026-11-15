let csrfTokenStore = '';

export function setCsrfToken(token: string) {
  csrfTokenStore = token;
}

export function getCsrfToken(): string {
  return csrfTokenStore;
}

async function parseResponse<T>(res: Response): Promise<T> {
  const contentType = res.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await res.json() : await res.text();
  if (!res.ok) {
    const message =
      typeof data === 'object' && data !== null && 'error' in data
        ? String((data as { error: unknown }).error)
        : `Terjadi kesalahan (${res.status})`;
    throw new Error(message);
  }
  return data as T;
}

export async function apiGet<T>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: 'include' });
  return parseResponse<T>(res);
}

export async function apiPost<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(csrfTokenStore ? { 'X-CSRF-Token': csrfTokenStore } : {}),
    },
    body: JSON.stringify(body),
  });
  return parseResponse<T>(res);
}

export async function apiPut<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'PUT',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(csrfTokenStore ? { 'X-CSRF-Token': csrfTokenStore } : {}),
    },
    body: JSON.stringify(body),
  });
  return parseResponse<T>(res);
}

export async function apiDelete<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    method: 'DELETE',
    credentials: 'include',
    headers: {
      ...(csrfTokenStore ? { 'X-CSRF-Token': csrfTokenStore } : {}),
    },
  });
  return parseResponse<T>(res);
}

export async function apiUploadForm<T>(url: string, formData: FormData): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    credentials: 'include',
    headers: {
      ...(csrfTokenStore ? { 'X-CSRF-Token': csrfTokenStore } : {}),
    },
    body: formData,
  });
  return parseResponse<T>(res);
}
