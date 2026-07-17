// Gate for AlphaNotice (mounted in AppShell): once acknowledged, the notice
// never shows again on this device. SSR-safe — the server always reports
// "acknowledged" so the modal never renders during server rendering.
const ALPHA_ACK_KEY = 'tcp:alphaAck:v1';

export function hasAcknowledgedAlpha(): boolean {
  if (typeof window === 'undefined') return true;
  return window.localStorage.getItem(ALPHA_ACK_KEY) === 'true';
}

export function setAcknowledgedAlpha(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(ALPHA_ACK_KEY, 'true');
}
