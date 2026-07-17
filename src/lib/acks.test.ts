// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { hasAcknowledgedAlpha, setAcknowledgedAlpha } from './alphaAck';
import { hasAcknowledgedMarketplace, setAcknowledgedMarketplace } from './marketplaceAck';

describe('alphaAck', () => {
  beforeEach(() => localStorage.clear());

  it('defaults to unacknowledged', () => {
    expect(hasAcknowledgedAlpha()).toBe(false);
  });

  it('setAcknowledgedAlpha persists true under tcp:alphaAck:v1', () => {
    setAcknowledgedAlpha();
    expect(localStorage.getItem('tcp:alphaAck:v1')).toBe('true');
    expect(hasAcknowledgedAlpha()).toBe(true);
  });
});

describe('marketplaceAck', () => {
  beforeEach(() => localStorage.clear());

  it('defaults to unacknowledged', () => {
    expect(hasAcknowledgedMarketplace()).toBe(false);
  });

  it('setAcknowledgedMarketplace persists true under tcp:marketplaceAck:v1', () => {
    setAcknowledgedMarketplace();
    expect(localStorage.getItem('tcp:marketplaceAck:v1')).toBe('true');
    expect(hasAcknowledgedMarketplace()).toBe(true);
  });
});
