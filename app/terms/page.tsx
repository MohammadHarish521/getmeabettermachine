import type { Metadata } from "next";
import { Wordmark } from "@/components/site/Wordmark";

export const metadata: Metadata = {
  title: "Terms",
  description:
    "Rules for taking a spot on Raise My Mac. Illegal activity and adult content are not allowed.",
};

const SECTIONS: { title: string; body: string[] }[] = [
  {
    title: "What you are paying for",
    body: [
      "Raise My Mac is a personal project. You pay to put your name, logo, and link on a numbered sticker on the computer I build and ship with.",
      "You are not buying the computer, a share of anything, or a guaranteed audience. The price on the spot is the price of that placement.",
    ],
  },
  {
    title: "What I will not place",
    body: [
      "I do not promote, host, or place anything illegal. I also do not place adult or sexual content. If your site, product, or brand is either of those, do not check out.",
      "The same rule covers anything I would not put next to my name: scams, phishing, malware, hate, harassment, violence, illegal drugs, illegal weapons, child exploitation, impersonation, and copyright or trademark infringement.",
      "You are responsible for the site you submit. I can refuse a placement before checkout finishes, and I can take a sticker off later, if it breaks these rules.",
    ],
  },
  {
    title: "Your site and logo",
    body: [
      "The name, logo, and link come from the URL you enter. You confirm you have the right to use them, and that the page they point to follows these terms.",
      "You give me permission to show that name, logo, and link on the computer, on this site, and in posts about the project, for as long as the placement is up.",
    ],
  },
  {
    title: "Payment",
    body: [
      "Checkout is in US dollars and is processed by Dodo Payments. Prices on this site are before tax. Dodo Payments may add tax at checkout, depending on where you are.",
      "The amount you approve on the Dodo page — including any tax they add — is what you pay for that spot.",
      "Starting checkout holds the spot for a short time so two people cannot buy it at once. If you cancel or the payment fails, the hold ends. If you pay, the spot is yours until someone takes it over.",
      "A taken spot can be claimed by paying 1.5× what the current holder paid. That is the price shown as “take over.”",
      "If I refuse or remove a placement because it breaks these terms, the payment is not refunded. If I cannot make the placement for a reason on my side, I will refund it.",
    ],
  },
  {
    title: "What I don’t promise",
    body: [
      "I don’t promise impressions, clicks, followers, or sales. The computer is mine. I use it, film with it, and ship from it, but I decide how and when it appears.",
      "A link on a sticker is not my endorsement of your product beyond the fact that you paid for the spot and it passed these rules.",
    ],
  },
  {
    title: "Liability",
    body: [
      "The placement is the sticker and the listing on this site, as described at checkout. I am not liable for what happens on your website, for losses that follow from the placement, or for anything beyond the amount you paid for that spot.",
    ],
  },
  {
    title: "Changes",
    body: [
      "I can update these terms. The date at the top is the version in force. Paying after a change means you accept the terms as they stand then.",
    ],
  },
];

export default function TermsPage() {
  return (
    <div className="min-h-dvh">
      <header className="border-b border-line">
        <div className="mx-auto flex h-14 max-w-[1120px] items-center px-5 sm:px-6">
          <Wordmark />
        </div>
      </header>
      <main className="mx-auto max-w-[720px] px-5 py-16 sm:px-6">
        <p className="eyebrow">Terms</p>
        <h1 className="section-title mt-3">Terms and conditions</h1>
        <p className="lede mt-4">
          Paying for a spot means you agree to this. Short version: no illegal
          activity, and no adult content.
        </p>
        <p className="mt-3 text-[13px] text-dim">Last updated 11 October 2026</p>

        <div className="mt-12 space-y-10">
          {SECTIONS.map((section) => (
            <section key={section.title}>
              <h2 className="text-[18px] font-semibold tracking-[-0.02em]">
                {section.title}
              </h2>
              <div className="mt-3 space-y-3 text-[15px] leading-7 text-mute">
                {section.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </section>
          ))}
          <section>
            <h2 className="text-[18px] font-semibold tracking-[-0.02em]">Contact</h2>
            <p className="mt-3 text-[15px] leading-7 text-mute">
              Questions about a placement go to{" "}
              <a
                className="text-link"
                href="https://x.com/Harish_521"
                target="_blank"
                rel="noopener noreferrer"
              >
                @Harish_521
              </a>
              .
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
