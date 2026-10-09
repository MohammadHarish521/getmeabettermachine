"use client";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-lg px-5 py-24 text-center">
      <h1 className="section-title">Something broke</h1>
      <p className="mt-3 text-[15px] text-mute">
        The page failed to render. Try again, or go back home.
      </p>
      <div className="mt-8 flex justify-center gap-3">
        <button type="button" className="btn-primary" onClick={reset}>
          Try again
        </button>
        <a href="/" className="btn-secondary">
          Home
        </a>
      </div>
    </div>
  );
}
