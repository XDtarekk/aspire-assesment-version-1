const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export type Role = "ADMIN" | "LIBRARIAN" | "MEMBER";
export type BookStatus = "AVAILABLE" | "CHECKED_OUT" | "LOST" | "ARCHIVED";

export interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string | null;
  description: string | null;
  imageUrl: string | null;
  tags: string[];
  status: BookStatus;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
}

export interface Loan {
  id: string;
  bookId: string;
  userId: string;
  checkedOutAt: string;
  dueAt: string;
  returnedAt: string | null;
  book: Book;
  user?: { id: string; email: string; name: string | null; role: Role };
}

export interface User {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  createdAt?: string;
}

async function request<T>(
  path: string,
  options: RequestInit & { token?: string | null } = {}
): Promise<T> {
  const { token, ...init } = options;
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const res = await fetch(`${API_URL}${path}`, { ...init, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error?: string }).error || res.statusText);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  role: Role;
}

export const api = {
  health: () => request<{ ok: boolean }>("/health"),

  auth: {
    google: (idToken: string) =>
      request<{ token: string; user: AuthUser }>("/api/auth/google", {
        method: "POST",
        body: JSON.stringify({ idToken }),
      }),
    login: (email: string, password: string) =>
      request<{ token: string; user: AuthUser }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }),
  },

  books: {
    list: (params?: { q?: string; title?: string; author?: string; tag?: string; status?: string }, token?: string | null) => {
      const search = params ? "?" + new URLSearchParams(params as Record<string, string>).toString() : "";
      return request<Book[]>(`/api/books${search}`, { token });
    },
    get: (id: string) => request<Book>(`/api/books/${id}`),
    create: (body: { title: string; author: string; isbn?: string; description?: string; imageUrl?: string | null; tags?: string[] }, token: string) =>
      request<Book>("/api/books", { method: "POST", body: JSON.stringify(body), token }),
    update: (id: string, body: Partial<{ title: string; author: string; isbn: string | null; description: string | null; imageUrl: string | null; tags: string[]; status: BookStatus }>, token: string) =>
      request<Book>(`/api/books/${id}`, { method: "PATCH", body: JSON.stringify(body), token }),
    delete: (id: string, token: string) =>
      request<void>(`/api/books/${id}`, { method: "DELETE", token }),
  },

  loans: {
    checkout: (bookId: string, token: string) =>
      request<Loan>("/api/loans/checkout", { method: "POST", body: JSON.stringify({ bookId }), token }),
    return: (loanId: string, token: string) =>
      request<void>("/api/loans/return", { method: "POST", body: JSON.stringify({ loanId }), token }),
    me: (token: string) => request<Loan[]>("/api/loans/me", { token }),
    list: (token: string) => request<Loan[]>("/api/loans", { token }),
  },

  users: {
    list: (token: string) => request<User[]>("/api/users", { token }),
    updateRole: (id: string, role: Role, token: string) =>
      request<User>(`/api/users/${id}/role`, { method: "PATCH", body: JSON.stringify({ role }), token }),
    setPassword: (userId: string, password: string, token: string) =>
      request<User>(`/api/auth/users/${userId}/password`, {
        method: "PATCH",
        body: JSON.stringify({ password }),
        token,
      }),
  },

  upload: (file: File, token: string): Promise<{ imageUrl: string }> => {
    const form = new FormData();
    form.append("image", file);
    return new Promise((resolve, reject) => {
      fetch(`${API_URL}/api/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      })
        .then((r) => (r.ok ? r.json() : r.json().then((e) => Promise.reject(new Error((e as { error?: string }).error || "Upload failed")))))
        .then(resolve)
        .catch(reject);
    });
  },

  ai: {
    enrichBook: (title: string, author: string, token: string) =>
      request<{ description: string; tags: string[] }>("/api/ai/enrich-book", {
        method: "POST",
        body: JSON.stringify({ title, author }),
        token,
      }),
  },
};

export function bookImageUrl(book: Book): string | null {
  if (!book.imageUrl) return null;
  if (book.imageUrl.startsWith("http")) return book.imageUrl;
  const base = API_URL.replace(/\/$/, "");
  return `${base}${book.imageUrl.startsWith("/") ? "" : "/"}${book.imageUrl}`;
}
