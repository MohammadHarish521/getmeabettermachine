import { PaymentPoll } from "@/components/site/PaymentPoll";
import { Wordmark } from "@/components/site/Wordmark";
import { localPaymentId } from "@/lib/payment-ref";

export const dynamic = "force-dynamic";

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
