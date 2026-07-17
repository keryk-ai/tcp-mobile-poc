// Gate for MarketplaceNotice (mounted in the Apps/Marketplace screen, Task
// 4): once acknowledged, the notice never shows again on this device.
// SSR-safe — the server always reports "acknowledged" so the modal never
// renders during server rendering. Same pattern as @/lib/alphaAck.
const MARKETPLACE_ACK_KEY = 'tcp:marketplaceAck:v1';

export function hasAcknowledgedMarketplace(): boolean {
  if (typeof window === 'undefined') return true;
  return window.localStorage.getItem(MARKETPLACE_ACK_KEY) === 'true';
}

export function setAcknowledgedMarketplace(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(MARKETPLACE_ACK_KEY, 'true');
}
