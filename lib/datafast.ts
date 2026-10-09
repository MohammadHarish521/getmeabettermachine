/** Wait until the DataFast script has written its visitor cookie. */
export function ensureDataFast() {
  if (typeof document === "undefined") return Promise.resolve();
  return new Promise<void>((resolve) => {
    const started = Date.now();
    const tick = () => {
      if (
        document.cookie.includes("datafast_visitor_id=") ||
        Date.now() - started > 1500
      ) {
        resolve();
        return;
      }
      window.setTimeout(tick, 50);
    };
    tick();
  });
}
