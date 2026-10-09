import { Wordmark } from "@/components/site/Wordmark";

export default function CancelPage() {
  return (
    <div className="min-h-dvh">
      <header className="border-b border-line">
        <div className="mx-auto flex h-14 max-w-[1120px] items-center px-5">
          <Wordmark />
        </div>
      </header>
      <div className="mx-auto max-w-lg px-5 py-24 text-center">
        <h1 className="text-[32px] font-medium tracking-[-0.04em]">Checkout cancelled</h1>
        <p className="mt-3 text-[15px] text-mute">
          Nothing was charged. The meter is exactly where you left it.
        </p>
        <a href="/" className="btn-primary mt-8 inline-flex">
          Back to Raise My Mac
        </a>
      </div>
    </div>
  );
}
