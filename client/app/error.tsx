"use client";

export default function Error({ reset }: { reset: () => void }) {
  return (
    <main
      role="alert"
      className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center"
    >
      <h2 className="text-2xl font-semibold text-foreground">Something went wrong</h2>
      <button
        onClick={reset}
        className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary-hover text-sm font-medium cursor-pointer"
      >
        Try again
      </button>
    </main>
  );
}