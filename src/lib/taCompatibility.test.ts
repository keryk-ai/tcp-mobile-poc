import { describe, it, expect } from 'vitest';
import { categorizeRoad, checkTACompatibility } from './taCompatibility';

describe('categorizeRoad (mirrors relay.py categorize_road)', () => {
  it.each([
    [{ type: 'motorway' }, 'freeway'],
    [{ type: 'motorway_link' }, 'freeway'],
    [{ type: 'primary', isDivided: true, isOneWay: true, lanes: 3 }, 'divided-highway'],
    [{ type: 'residential', lanes: 2 }, '2-lane-2-way'],
    [{ type: 'residential', lanes: null }, '2-lane-2-way'],
    // AGE-89: residential is always flagging-eligible, even with bad upstream lane data
    [{ type: 'residential', lanes: 4 }, '2-lane-2-way'],
    [{ type: 'primary', lanes: 4, isDivided: true }, 'divided-highway'],
    [{ type: 'primary', lanes: 4 }, 'multi-lane-road'],
    [{ type: 'primary', lanes: 2, isOneWay: true }, '2-lane-road'],
    [{ type: 'primary', lanes: 3, hasMedian: true, isOneWay: true }, 'divided-highway'],
  ])('categorizes %j as %s', (road, expected) => {
    expect(categorizeRoad(road)).toBe(expected);
  });
});

describe('checkTACompatibility', () => {
  it('returns null for anything but TA-10', () => {
    expect(checkTACompatibility(null, { lanes: 2 })).toBeNull();
    expect(checkTACompatibility('TA-30', { lanes: 2 })).toBeNull();
  });

  it('is compatible on a 2-lane road', () => {
    expect(checkTACompatibility('TA-10', { type: 'residential', lanes: 2 })).toEqual({
      compatible: true,
      roadType: '2-lane-2-way',
      roadLabel: '2-lane road',
      lanes: 2,
    });
  });

  it('is case-insensitive on the portal TA', () => {
    expect(checkTACompatibility('ta-10', { lanes: 2 })?.compatible).toBe(true);
  });

  it('is incompatible on a multi-lane road, with label and lanes for the mismatch card', () => {
    expect(checkTACompatibility('TA-10', { type: 'primary', lanes: 4 })).toEqual({
      compatible: false,
      roadType: 'multi-lane-road',
      roadLabel: 'multi-lane road',
      lanes: 4,
    });
  });

  it('AGE-89: is compatible on a residential road even with bad upstream lane data (4 lanes)', () => {
    expect(checkTACompatibility('TA-10', { type: 'residential', lanes: 4 })).toEqual({
      compatible: true,
      roadType: '2-lane-2-way',
      roadLabel: '2-lane road',
      lanes: 4,
    });
  });

  it('AGE-89 control: non-residential 4-lane road remains incompatible', () => {
    expect(checkTACompatibility('TA-10', { type: 'secondary', lanes: 4 })?.compatible).toBe(false);
  });
});
