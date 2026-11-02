export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { initSharedRateLimiting } = await import("./lib/rate-limit-upstash");
    initSharedRateLimiting();
  }
}
