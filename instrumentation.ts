export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { assertProductionPayments } = await import("@/lib/dodo");
    assertProductionPayments();
  }
}
