// Warm the cached client fingerprint hash at boot so the first login/register submit
// doesn't pay the WebCrypto round-trip cost.
export default defineNuxtPlugin(async () => {
  await clientHash();
});
