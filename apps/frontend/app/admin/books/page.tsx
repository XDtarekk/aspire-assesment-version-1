"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api, bookImageUrl, type Book, type BookStatus } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { parseJwtPayload } from "@/lib/jwt";

const statusColors: Record<string, string> = {
  AVAILABLE: "bg-green-100 text-green-800",
  CHECKED_OUT: "bg-amber-100 text-amber-800",
  ARCHIVED: "bg-gray-100 text-gray-600",
};

type FormState = { title: string; author: string; isbn: string; description: string; imageUrl: string; tags: string; status: BookStatus };

const emptyForm: FormState = { title: "", author: "", isbn: "", description: "", imageUrl: "", tags: "", status: "AVAILABLE" };

export default function AdminBooksPage() {
  const { token, isReady } = useAuth();
  const router = useRouter();
  const [books, setBooks] = useState<Book[]>([]);
  const [archivedBooks, setArchivedBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Book | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [enriching, setEnriching] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [archivingId, setArchivingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [unarchivingId, setUnarchivingId] = useState<string | null>(null);

  const role = token ? parseJwtPayload(token).role : null;
  const canEdit = role === "ADMIN" || role === "LIBRARIAN";

  const loadBooks = () => {
    if (!token) return;
    setLoading(true);
    Promise.all([
      api.books.list(undefined, token),
      api.books.list({ archived: "true" }, token),
    ])
      .then(([active, archived]) => {
        setBooks(active);
        setArchivedBooks(archived);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!isReady) return;
    if (!token || !canEdit) {
      router.replace("/login");
      return;
    }
    loadBooks();
  }, [token, isReady, canEdit, router]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (book: Book) => {
    setEditing(book);
    setForm({
      title: book.title,
      author: book.author,
      isbn: book.isbn ?? "",
      description: book.description ?? "",
      imageUrl: book.imageUrl ?? "",
      tags: book.tags.join(", "),
      status: book.status,
    });
    setModalOpen(true);
  };

  const handleEnrich = async () => {
    if (!form.title.trim() || !form.author.trim() || !token) return;
    setEnriching(true);
    try {
      const res = await api.ai.enrichBook(form.title.trim(), form.author.trim(), token);
      setForm((f) => ({
        ...f,
        description: res.description,
        tags: res.tags.join(", "),
      }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Enrich failed");
    } finally {
      setEnriching(false);
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;
    setUploading(true);
    try {
      const { imageUrl } = await api.upload(file, token);
      setForm((f) => ({ ...f, imageUrl }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    setError(null);
    try {
      const payload: Parameters<typeof api.books.update>[1] = {
        title: form.title.trim(),
        author: form.author.trim(),
        isbn: form.isbn.trim() || undefined,
        description: form.description.trim() || undefined,
        imageUrl: form.imageUrl.trim() || undefined,
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      };
      if (editing) {
        payload.status = form.status;
        const updated = await api.books.update(editing.id, payload, token);
        if (updated.archivedAt) {
          setBooks((prev) => prev.filter((b) => b.id !== updated.id));
          setArchivedBooks((prev) => [...prev, updated]);
        } else {
          setBooks((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
        }
      } else {
        const created = await api.books.create(payload, token);
        setBooks((prev) => [created, ...prev]);
      }
      setModalOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = async (book: Book) => {
    if (!token || !confirm(`Archive "${book.title}"? It will no longer be available for checkout.`)) return;
    setArchivingId(book.id);
    try {
      const updated = await api.books.update(book.id, { status: "ARCHIVED" }, token);
      setBooks((prev) => prev.filter((b) => b.id !== book.id));
      setArchivedBooks((prev) => [...prev, updated]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Archive failed");
    } finally {
      setArchivingId(null);
    }
  };

  const handleDelete = async (book: Book) => {
    if (!token || !confirm(`Delete "${book.title}"? This will archive the book.`)) return;
    setDeletingId(book.id);
    try {
      await api.books.delete(book.id, token);
      loadBooks();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setDeletingId(null);
    }
  };

  const handleUnarchive = async (book: Book) => {
    if (!token || !confirm(`Make "${book.title}" available again for checkout?`)) return;
    setUnarchivingId(book.id);
    try {
      const updated = await api.books.update(book.id, { status: "AVAILABLE" }, token);
      setArchivedBooks((prev) => prev.filter((b) => b.id !== book.id));
      setBooks((prev) => [updated, ...prev]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to make available");
    } finally {
      setUnarchivingId(null);
    }
  };

  if (!isReady || !token || !canEdit) return null;
  if (loading) return <p className="text-gray-500">Loading…</p>;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Manage books</h1>
        <button
          type="button"
          onClick={openCreate}
          className="rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
        >
          Add book
        </button>
      </div>
      {error && <div className="mb-4 rounded bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Title</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Author</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Status</th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {books.map((book) => (
              <tr key={book.id}>
                <td className="px-4 py-3 font-medium text-gray-900">{book.title}</td>
                <td className="px-4 py-3 text-gray-600">{book.author}</td>
                <td className="px-4 py-3">
                  <span className={`rounded px-2 py-0.5 text-xs font-medium ${statusColors[book.status] ?? ""}`}>
                    {book.status.replace("_", " ")}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => openEdit(book)}
                    disabled={archivingId === book.id || deletingId === book.id}
                    className="mr-2 text-blue-600 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleArchive(book)}
                    disabled={archivingId === book.id || deletingId === book.id}
                    className="mr-2 text-amber-600 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {archivingId === book.id ? "Archiving…" : "Archive"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(book)}
                    disabled={archivingId === book.id || deletingId === book.id}
                    className="text-red-600 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {deletingId === book.id ? "Deleting…" : "Delete"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {archivedBooks.length > 0 && (
        <div className="mt-10">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">Archived books</h2>
          <p className="mb-4 text-sm text-gray-600">Archived books are hidden from the catalog and cannot be checked out. Make available to return them to the main list.</p>
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Title</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Author</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {archivedBooks.map((book) => (
                  <tr key={book.id}>
                    <td className="px-4 py-3 font-medium text-gray-900">{book.title}</td>
                    <td className="px-4 py-3 text-gray-600">{book.author}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleUnarchive(book)}
                        disabled={unarchivingId === book.id}
                        className="text-blue-600 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {unarchivingId === book.id ? "Making available…" : "Make available"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold">{editing ? "Edit book" : "Add book"}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Title *</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  required
                  className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Author *</label>
                <input
                  value={form.author}
                  onChange={(e) => setForm((f) => ({ ...f, author: e.target.value }))}
                  required
                  className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleEnrich}
                  disabled={enriching || !form.title.trim() || !form.author.trim()}
                  className="rounded bg-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-300 disabled:opacity-50"
                >
                  {enriching ? "Generating…" : "Generate summary + tags (AI)"}
                </button>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={3}
                  className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Tags (comma-separated)</label>
                <input
                  value={form.tags}
                  onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
                  className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Cover image</label>
                <div className="mt-1 flex items-center gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    disabled={uploading}
                    className="text-sm"
                  />
                  {uploading && <span className="text-sm text-gray-500">Uploading…</span>}
                </div>
                {form.imageUrl && (
                  <p className="mt-1 text-xs text-gray-500">Image set: {form.imageUrl}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">ISBN</label>
                <input
                  value={form.isbn}
                  onChange={(e) => setForm((f) => ({ ...f, isbn: e.target.value }))}
                  className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              {editing && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as BookStatus }))}
                    className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
                  >
                    <option value="AVAILABLE">Available</option>
                    <option value="CHECKED_OUT">Checked out</option>
                    <option value="ARCHIVED">Archived (no checkout)</option>
                  </select>
                </div>
              )}
              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? "Saving…" : editing ? "Save" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
