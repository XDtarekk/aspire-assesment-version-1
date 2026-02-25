"use client";

import Link from "next/link";
import type { Book } from "@/lib/api";
import { bookImageUrl } from "@/lib/api";

const statusColors: Record<string, string> = {
  AVAILABLE: "bg-green-100 text-green-800",
  CHECKED_OUT: "bg-amber-100 text-amber-800",
  LOST: "bg-red-100 text-red-800",
  ARCHIVED: "bg-gray-100 text-gray-600",
};

export default function BookCard({ book }: { book: Book }) {
  const imgUrl = bookImageUrl(book);
  return (
    <Link
      href={`/books/${book.id}`}
      className="flex gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition hover:border-blue-200 hover:shadow"
    >
      <div className="h-24 w-16 shrink-0 overflow-hidden rounded bg-gray-100">
        {imgUrl ? (
          <img src={imgUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">No cover</div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="font-semibold text-gray-900 truncate">{book.title}</h3>
        <p className="text-sm text-gray-500">{book.author}</p>
        <div className="mt-2 flex flex-wrap gap-1">
          <span className={`rounded px-2 py-0.5 text-xs font-medium ${statusColors[book.status] ?? "bg-gray-100"}`}>
            {book.status.replace("_", " ")}
          </span>
          {book.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}
