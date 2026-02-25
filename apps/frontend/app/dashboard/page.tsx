import Link from "next/link";

export default function DashboardPage() {
  return (
    <div>
      <h1>Dashboard</h1>
      <p>Nested route from <code>app/dashboard/page.tsx</code>.</p>
      <p>
        <Link href="/dashboard/settings">Go to Settings</Link>
      </p>
    </div>
  );
}
