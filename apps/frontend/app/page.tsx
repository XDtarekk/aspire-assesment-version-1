"use client";

import { useState, useEffect } from "react";
import { api, type Book } from "@/lib/api";
import BookCard from "./components/BookCard";

export default function HomePage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [tag, setTag] = useState("");

  useEffect(() => {
    const params: Record<string, string> = {};
    if (q) params.q = q;
    if (status) params.status = status;
    if (tag) params.tag = tag;
    setLoading(true);
    api.books
      .list(params)
      .then(setBooks)
      .catch((e) => {
        const msg = e instanceof Error ? e.message : "Failed to load";
        setError(
          msg.includes("fetch") || msg.includes("Failed")
            ? "Could not reach the API. Start the backend: cd apps/backend && npm run dev"
            : msg
        );
      })
      .finally(() => setLoading(false));
  }, [q, status, tag]);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Browse books</h1>

      <div className="mb-6 flex flex-wrap gap-4">
        <input
          type="search"
          placeholder="Search by title, author..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        >
          <option value="">All statuses</option>
          <option value="AVAILABLE">Available</option>
          <option value="CHECKED_OUT">Checked out</option>
          <option value="LOST">Lost</option>
          <option value="ARCHIVED">Archived</option>
        </select>
        <input
          type="text"
          placeholder="Filter by tag"
          value={tag}
          onChange={(e) => setTag(e.target.value)}
          className="rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {error && (
        <div className="mb-4 rounded bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      {loading ? (
        <p className="text-gray-500">Loading books…</p>
      ) : books.length === 0 ? (
        <p className="text-gray-500">No books found.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {books.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      )}
    </div>
  );
}
