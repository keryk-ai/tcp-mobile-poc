import { describe, it, expect } from 'vitest';
import { checkTACompatibility } from '@/lib/taCompatibility';

describe('test infrastructure', () => {
  it('resolves the @/ alias and runs', () => {
    expect(typeof checkTACompatibility).toBe('function');
  });
});
