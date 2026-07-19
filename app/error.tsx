"use client";

// App Router error boundary — a runtime error in any route recovers here instead of white-screening
// mid-pitch. `reset` re-renders the segment; a full reload is the fallback.

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto flex max-w-md flex-col items-center gap-4 p-8 text-center">
      <p className="text-4xl">🤝</p>
      <h1 className="text-xl font-bold">Something hiccuped</h1>
      <p className="text-sm text-neutral-400">
        The pot&apos;s fine — this screen just tripped. {error.message ? `(${error.message.slice(0, 120)})` : ""}
      </p>
      <div className="flex gap-2">
        <button onClick={reset} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold">
          Try again
        </button>
        <a href="/" className="rounded-xl border border-neutral-700 px-4 py-2 text-sm font-semibold">
          Back to dashboard
        </a>
      </div>
    </main>
  );
}
