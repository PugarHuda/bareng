"use client";

// App Router error boundary — a runtime error in any route recovers here instead of white-screening
// mid-pitch. `reset` re-renders the segment; a full reload is the fallback.

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-5 p-8 text-center">
      <p className="text-5xl">🤝</p>
      <div className="neo w-full rounded-2xl bg-[var(--yellow)] p-6">
        <h1 className="text-2xl font-black">Something hiccuped</h1>
        <p className="mt-2 text-sm font-medium text-black/70">
          The pot&apos;s fine — this screen just tripped.{error.message ? ` (${error.message.slice(0, 120)})` : ""}
        </p>
        <div className="mt-4 flex justify-center gap-2">
          <button onClick={reset} className="neo-btn rounded-lg bg-[var(--panel)] px-4 py-2 text-sm font-bold text-black">
            Try again
          </button>
          <a href="/app" className="neo-btn rounded-lg bg-[var(--panel)] px-4 py-2 text-sm font-bold text-black">
            Back to app
          </a>
        </div>
      </div>
    </main>
  );
}
