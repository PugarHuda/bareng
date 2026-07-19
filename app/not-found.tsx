import Link from "next/link";

// Custom 404 — a mistyped pot/route lands somewhere on-brand instead of a bare Next page.
export default function NotFound() {
  return (
    <main className="mx-auto flex max-w-md flex-col items-center gap-4 p-8 text-center">
      <p className="text-4xl">🧭</p>
      <h1 className="text-xl font-bold">That page isn&apos;t here</h1>
      <p className="text-sm text-neutral-400">Maybe the handle moved. Back to the shared pot?</p>
      <Link href="/" className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold">
        Go to dashboard
      </Link>
    </main>
  );
}
