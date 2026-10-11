export function HowItWorks() {
  const steps = [
    {
      n: "01",
      title: "You pick a spot",
      body: "Choose a sticker on the Mac. Price is on the slot, before tax — Dodo may add tax at checkout. Taken seats can be claimed by paying more.",
    },
    {
      n: "02",
      title: "Your brand sits there",
      body: "Logo on the Mac, on this page, in the story of whatever gets built next.",
    },
    {
      n: "03",
      title: "The Mac upgrades",
      body: "Every dollar from those placements unlocks the next configuration. I build on it.",
    },
  ];

  return (
    <section id="how" className="mx-auto max-w-[1120px] px-5 py-20 text-center sm:px-6 lg:py-28">
      <p className="eyebrow">How it works</p>
      <h2 className="section-title mt-3">Attention first. Machine second.</h2>
      <ol className="mt-12 grid gap-10 sm:grid-cols-3 sm:gap-8">
        {steps.map((step) => (
          <li key={step.n} className="text-left">
            <div className="inline-flex items-center justify-center rounded-full bg-charcoal px-3 py-1">
              <span className="text-[13px] font-semibold text-mute">{step.n}</span>
            </div>
            <h3 className="mt-4 text-xl font-semibold">{step.title}</h3>
            <p className="mt-2 text-[15px] leading-relaxed text-mute">{step.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
