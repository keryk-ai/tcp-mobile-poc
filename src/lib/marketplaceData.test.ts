import { describe, it, expect } from 'vitest';
import { MARKETPLACE_OFFERINGS } from './marketplaceData';

describe('MARKETPLACE_OFFERINGS', () => {
  it('has 5 offerings', () => {
    expect(MARKETPLACE_OFFERINGS).toHaveLength(5);
  });

  it('marks only AWP Equipment as firstParty', () => {
    const firstParty = MARKETPLACE_OFFERINGS.filter((o) => o.firstParty);
    expect(firstParty).toHaveLength(1);
    expect(firstParty[0].partner).toBe('AWP Equipment');
  });
});
