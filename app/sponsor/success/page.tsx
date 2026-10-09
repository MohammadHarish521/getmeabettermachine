import { PaymentPoll } from "@/components/site/PaymentPoll";
import { Wordmark } from "@/components/site/Wordmark";

export const dynamic = "force-dynamic";

function localPaymentId(value: string | string[] | undefined) {
  const parts = (Array.isArray(value) ? value : value ? [value] : [])
    .flatMap((part) => part.split(","))
    .map((part) => part.trim())
    .filter(Boolean);
  return parts.find((part) => !part.startsWith("pay_")) ?? null;
}

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string | string[]; payment_id?: string | string[] }>;
}) {
  const params = await searchParams;
  const paymentId = localPaymentId(params.ref) ?? localPaymentId(params.payment_id);
  return (
    <div className="min-h-dvh">
      <header className="border-b border-line">
        <div className="mx-auto flex h-14 max-w-[1120px] items-center px-5">
          <Wordmark />
        </div>
      </header>
      <PaymentPoll paymentId={paymentId} />
    </div>
  );
}
