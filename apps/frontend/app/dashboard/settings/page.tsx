import Link from "next/link";

export default function SettingsPage() {
  return (
    <div>
      <h1>Settings</h1>
      <p>Nested route from <code>app/dashboard/settings/page.tsx</code> (URL: /dashboard/settings).</p>
      <p>
        <Link href="/dashboard">Back to Dashboard</Link>
      </p>
    </div>
  );
}
