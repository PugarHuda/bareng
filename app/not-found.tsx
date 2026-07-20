import Link from "next/link";

// Custom 404 — a mistyped route lands somewhere on-brand instead of a bare Next page.
export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-5 p-8 text-center">
      <p className="text-5xl">🧭</p>
      <div className="neo w-full rounded-2xl bg-[var(--pink)] p-6">
        <h1 className="text-2xl font-black">That page isn&apos;t here</h1>
        <p className="mt-2 text-sm font-medium text-black/70">Maybe the handle moved.</p>
        <div className="mt-4 flex justify-center gap-2">
          <Link href="/" className="neo-btn rounded-lg bg-[var(--panel)] px-4 py-2 text-sm font-bold text-black">
            Home
          </Link>
          <Link href="/app" className="neo-btn rounded-lg bg-[var(--panel)] px-4 py-2 text-sm font-bold text-black">
            Open app
          </Link>
        </div>
      </div>
    </main>
  );
}
