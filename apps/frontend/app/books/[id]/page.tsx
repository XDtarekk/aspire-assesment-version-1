"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api, bookImageUrl, type Book } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const statusColors: Record<string, string> = {
  AVAILABLE: "bg-green-100 text-green-800",
  CHECKED_OUT: "bg-amber-100 text-amber-800",
  ARCHIVED: "bg-gray-100 text-gray-600",
};

export default function BookDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { token } = useAuth();
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkingOut, setCheckingOut] = useState(false);

  useEffect(() => {
    api.books
      .get(id)
      .then(setBook)
      .catch((e) => setError(e instanceof Error ? e.message : "Not found"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleCheckout = () => {
    if (!token || !book) return;
    setCheckingOut(true);
    api.loans
      .checkout(book.id, token)
      .then(() => router.push("/me/loans"))
      .catch((e) => {
        setError(e instanceof Error ? e.message : "Checkout failed");
        setCheckingOut(false);
      });
  };

  if (loading) return <p className="text-gray-500">Loading…</p>;
  if (error || !book) return <div className="rounded bg-red-50 p-4 text-red-700">{error ?? "Book not found"}</div>;

  const imgUrl = bookImageUrl(book);

  return (
    <div className="max-w-2xl">
      <Link href="/" className="mb-4 inline-block text-sm text-blue-600 hover:underline">← Back to books</Link>
      <div className="flex gap-8">
        <div className="h-64 w-44 shrink-0 overflow-hidden rounded-lg bg-gray-100">
          {imgUrl ? (
            <img src={imgUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-gray-400">No cover</div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{book.title}</h1>
          <p className="mt-1 text-lg text-gray-600">{book.author}</p>
          <span className={`mt-2 inline-block rounded px-2 py-1 text-sm font-medium ${statusColors[book.status] ?? ""}`}>
            {book.status.replace("_", " ")}
          </span>
          {book.isbn && <p className="mt-2 text-sm text-gray-500">ISBN: {book.isbn}</p>}
          {book.description && <p className="mt-4 text-gray-700">{book.description}</p>}
          <div className="mt-4 flex flex-wrap gap-2">
            {book.tags.map((t) => (
              <span key={t} className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-600">{t}</span>
            ))}
          </div>
          {book.status === "AVAILABLE" && token && (
            <button
              type="button"
              onClick={handleCheckout}
              disabled={checkingOut}
              className="mt-6 rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {checkingOut ? "Checking out…" : "Check out this book"}
            </button>
          )}
          {book.status === "AVAILABLE" && !token && (
            <p className="mt-4 text-sm text-gray-500">
              <Link href="/login" className="text-blue-600 hover:underline">Log in</Link> to check out this book.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
