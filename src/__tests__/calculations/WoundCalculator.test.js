import WoundCalculator, { toughnesses, AutoWound, neededRollToWound } from 'calculations/WoundCalculator';
import { RerollType } from 'calculations/Dice';

import { Chance } from 'chance';
import { toBeDeepCloseTo } from 'jest-matcher-deep-close-to';

expect.extend({ toBeDeepCloseTo });

describe('Toughnesses', () => {
  it('is an expected array of toughnesses', () => {
    expect(toughnesses).toEqual([3, 4, 5, 6, 7, 8]);
  });
});

describe('neededRollToWound', () => {
  it('is a function for determining the required roll to wound based on strength/toughness', () => {
    expect(neededRollToWound(9, 4)).toEqual(2);
    expect(neededRollToWound(8, 4)).toEqual(2);
    expect(neededRollToWound(7, 4)).toEqual(3);
    expect(neededRollToWound(4, 4)).toEqual(4);
    expect(neededRollToWound(4, 5)).toEqual(5);
    expect(neededRollToWound(4, 8)).toEqual(6);
    expect(neededRollToWound(4, 9)).toEqual(6);
  });
});

describe('AutoWound', () => {
  it('is an object to help define various auto-wound types', () => {
    expect(typeof AutoWound).toBe('object');
    expect(AutoWound.ALWAYS).toEqual('ALWAYS');
    expect(AutoWound.TOUGHNESS_GT_STRENGTH).toEqual('TOUGHNESS_GT_STRENGTH');
    expect(AutoWound.NONE).toEqual('NONE');
  });
});

describe('WoundCalculator', () => {

  const random = new Chance();

  it ('is constructed with a builder', () => {
    const expectedHits = random.integer({min: 2});
    const expectedStrength = random.integer({min: 2});
    const expectedRerollOn = RerollType.ALL;
    const expectedWoundModifier = random.integer();
    const woundCalculator = new WoundCalculator.Builder()
      .withHits(expectedHits)
      .withStrength(expectedStrength)
      .withRerollOn(expectedRerollOn)
      .withWoundModifier(expectedWoundModifier)
      .build();
    expect(woundCalculator.hits).toEqual(expectedHits);
    expect(woundCalculator.strength).toEqual(expectedStrength);
    expect(woundCalculator.rerollOn).toEqual('ALL');
    expect(woundCalculator.woundModifier).toEqual(expectedWoundModifier);
  });

  describe('Unmodified Wound On', () => {

    it('gets an array of the required wound rolls without modification', () => {
      const woundCalculator = new WoundCalculator.Builder()
        .withHits(6)
        .withStrength(4)
        .withRerollOn(RerollType.NONE)
        .withWoundModifier(0)
        .withAutoWoundCondition(AutoWound.NONE)
        .withAutoWoundOn(0)
        .build();
      expect(woundCalculator.getUnmodifiedWoundsOn()).toEqual([3, 4, 5, 5, 5, 6]);
    });
  });

  describe('Modified Wound On', () => {

    it('gets an array of the required wound rolls without modification', () => {
      const woundCalculator1 = new WoundCalculator.Builder()
        .withHits(6)
        .withStrength(4)
        .withRerollOn(RerollType.NONE)
        .withWoundModifier(-1)
        .withAutoWoundCondition(AutoWound.NONE)
        .withAutoWoundOn(0)
        .build();
      expect(woundCalculator1.getModifiedWoundsOn()).toEqual([4, 5, 6, 6, 6, 7]);

      const woundCalculator2 = new WoundCalculator.Builder()
        .withHits(6)
        .withStrength(6)
        .withRerollOn(RerollType.NONE)
        .withWoundModifier(3)
        .withAutoWoundCondition(AutoWound.NONE)
        .withAutoWoundOn(0)
        .build(); // Cannot go below 2
      expect(woundCalculator2.getModifiedWoundsOn()).toEqual([2, 2, 2, 2, 2, 2]);
    });
  });

  describe('Get Wound Chances', () => {

    it('gets the statistical odds of achieving a wound roll', () => {
      const woundCalculator1 = new WoundCalculator.Builder()
        .withHits(6)
        .withStrength(4)
        .withRerollOn(RerollType.NONE)
        .withWoundModifier(-1)
        .withAutoWoundCondition(AutoWound.NONE)
        .withAutoWoundOn(0)
        .build();
      expect(woundCalculator1.getWoundChances()).toEqual([3/6, 2/6, 1/6, 1/6, 1/6, 0]);
    });
  });

  describe('Get Raw Wounds', () => {

    it('gets the average raw wounds achieved on the initial roll', () => {
      const woundCalculator1 = new WoundCalculator.Builder()
        .withHits(6)
        .withStrength(4)
        .withRerollOn(RerollType.NONE)
        .withWoundModifier(-1)
        .withAutoWoundCondition(AutoWound.NONE)
        .withAutoWoundOn(0)
        .build();
      expect(woundCalculator1.getRawWounds()).toEqual([3, 2, 1, 1, 1, 0]);
    });
  });

  describe('Get Modified Reroll Max Value', () => {

    it('gets the reroll value of ones', () => {
      const woundCalculator1 = new WoundCalculator.Builder()
        .withHits(6)
        .withStrength(4)
        .withRerollOn(RerollType.ONES)
        .withWoundModifier(-1)
        .withAutoWoundCondition(AutoWound.NONE)
        .withAutoWoundOn(0)
        .build();
      expect(woundCalculator1.getModifiedRerollMaxValues()).toEqual([1, 1, 1, 1, 1, 1]);
    });

    it('gets the reroll value of none', () => {
      const woundCalculator1 = new WoundCalculator.Builder()
        .withHits(6)
        .withStrength(4)
        .withRerollOn(RerollType.NONE)
        .withWoundModifier(0)
        .withAutoWoundCondition(AutoWound.NONE)
        .withAutoWoundOn(0)
        .build();
      expect(woundCalculator1.getModifiedRerollMaxValues()).toEqual([0, 0, 0, 0, 0, 0]);
    });

    it('gets the reroll value unaffected by the wound modifier', () => {
      const woundCalculator1 = new WoundCalculator.Builder()
        .withHits(6)
        .withStrength(4)
        .withRerollOn(RerollType.ALL)
        .withWoundModifier(-1)
        .withAutoWoundCondition(AutoWound.NONE)
        .withAutoWoundOn(0)
        .build();
      expect(woundCalculator1.getModifiedRerollMaxValues()).toEqual([2, 3, 4, 4, 4, 5]);
    });

    it('gets the reroll value when wound modifier is positive, preventing reroll overlap', () => {
      const woundCalculator1 = new WoundCalculator.Builder()
        .withHits(6)
        .withStrength(4)
        .withRerollOn(RerollType.ALL)
        .withWoundModifier(2)
        .withAutoWoundCondition(AutoWound.NONE)
        .withAutoWoundOn(0)
        .build();
      expect(woundCalculator1.getModifiedRerollMaxValues()).toEqual([1, 1, 2, 2, 2, 3]);
    });

    it('handles unknown reroll types', () => {
      const woundCalculator1 = new WoundCalculator.Builder()
        .withHits(6)
        .withStrength(4)
        .withRerollOn('WAT')
        .withWoundModifier(2)
        .withAutoWoundCondition(AutoWound.NONE)
        .withAutoWoundOn(0)
        .build();
      expect(() => woundCalculator1.getModifiedRerollMaxValues()).toThrow('Unknown RerollType, WAT');
    });
  });

  describe('Get Reroll Wounds', () => {

    it('gets the average reroll wounds achieved on initial reroll', () => {
      const woundCalculator1 = new WoundCalculator.Builder()
        .withHits(6)
        .withStrength(4)
        .withRerollOn(RerollType.ALL)
        .withWoundModifier(0)
        .withAutoWoundCondition(AutoWound.NONE)
        .withAutoWoundOn(0)
        .build();
      expect(woundCalculator1.getRerollWounds()).toBeDeepCloseTo([1.33, 1.5, 1.33, 1.33, 1.33, 0.83], 2);

      const woundCalculator2 = new WoundCalculator.Builder()
        .withHits(6)
        .withStrength(6)
        .withRerollOn(RerollType.ALL)
        .withWoundModifier(0)
        .withAutoWoundCondition(AutoWound.NONE)
        .withAutoWoundOn(0)
        .build();
      expect(woundCalculator2.getRerollWounds()).toBeDeepCloseTo([0.83, 1.33, 1.33, 1.5, 1.33, 1.33], 2);
    });
  });

  describe('Get Total Rolls', () => {

    it('gets the total wound roll attempts made', () => {
      const woundCalculator1 = new WoundCalculator.Builder()
        .withHits(6)
        .withStrength(4)
        .withRerollOn(RerollType.ALL)
        .withWoundModifier(0)
        .withAutoWoundCondition(AutoWound.NONE)
        .withAutoWoundOn(0)
        .build();
      expect(woundCalculator1.getTotalWoundRolls()).toBeDeepCloseTo([8, 9, 10, 10, 10, 11], 2);

      const woundCalculator2 = new WoundCalculator.Builder()
        .withHits(6)
        .withStrength(5)
        .withRerollOn(RerollType.ALL)
        .withWoundModifier(1)
        .withAutoWoundCondition(AutoWound.NONE)
        .withAutoWoundOn(0)
        .build();
      expect(woundCalculator2.getTotalWoundRolls()).toBeDeepCloseTo([7, 7, 8, 9, 9, 9], 2);

      const woundCalculator3 = new WoundCalculator.Builder()
        .withHits(6)
        .withStrength(4)
        .withRerollOn(RerollType.ALL)
        .withWoundModifier(-1)
        .withAutoWoundCondition(AutoWound.NONE)
        .withAutoWoundOn(0)
        .build();
      expect(woundCalculator3.getTotalWoundRolls()).toBeDeepCloseTo([8, 9, 10, 10, 10, 11], 2);
    });
  });

  describe('Get Modified Trigger Value', () => {
    it('modifies the required minimum trigger value', () => {
      const woundCalculator1 = new WoundCalculator.Builder()
        .withHits(6)
        .withStrength(4)
        .withRerollOn(RerollType.NONE)
        .withWoundModifier(1)
        .withAutoWoundCondition(AutoWound.NONE)
        .withAutoWoundOn(0)
        .withMinTriggerValue(4)
        .withExtraMortalsOnTrigger(0)
        .build();
      expect(woundCalculator1.getModifiedTriggerValue()).toEqual(3);
    });
  });

  describe('Get Total Triggers', () => {
    it('gets the total triggers that occured during all rolling', () => {
      const woundCalculator1 = new WoundCalculator.Builder()
        .withHits(6)
        .withStrength(4)
        .withRerollOn(RerollType.ALL)
        .withWoundModifier(0)
        .withAutoWoundCondition(AutoWound.NONE)
        .withAutoWoundOn(0)
        .withMinTriggerValue(4)
        .withExtraMortalsOnTrigger(1)
        .build();
      expect(woundCalculator1.getTotalTriggers()).toEqual([4, 4.5, 5, 5, 5, 5.5]);

      const woundCalculator2 = new WoundCalculator.Builder()
        .withHits(6)
        .withStrength(5)
        .withRerollOn(RerollType.ALL)
        .withWoundModifier(1)
        .withAutoWoundCondition(AutoWound.NONE)
        .withAutoWoundOn(0)
        .withMinTriggerValue(5)
        .withExtraMortalsOnTrigger(1)
        .build();
      expect(woundCalculator2.getTotalTriggers()).toEqual([3.5, 3.5, 4, 4.5, 4.5, 4.5]);

      const woundCalculator3 = new WoundCalculator.Builder()
        .withHits(6)
        .withStrength(1)
        .withRerollOn(RerollType.ALL)
        .withWoundModifier(-1)
        .withAutoWoundCondition(AutoWound.NONE)
        .withAutoWoundOn(0)
        .withMinTriggerValue(5)
        .withExtraMortalsOnTrigger(1)
        .build();
      expect(woundCalculator3.getTotalTriggers()).toBeDeepCloseTo([1.83, 1.83, 1.83, 1.83, 1.83, 1.83], 2);
    });
  });

  describe('Get Total Mortal Wounds', () => {
    it('gets the total mortal wounds', () => {
      const woundCalculator2 = new WoundCalculator.Builder()
        .withHits(6)
        .withStrength(4)
        .withRerollOn(RerollType.ALL)
        .withWoundModifier(0)
        .withAutoWoundCondition(AutoWound.NONE)
        .withAutoWoundOn(0)
        .withMinTriggerValue(4)
        .withExtraMortalsOnTrigger(2)
        .build();
      expect(woundCalculator2.getTotalMortalWounds()).toEqual([8, 9, 10, 10, 10, 11]);
    });
  });

  describe('Get Successful Wound Rolls', () => {

    it('gets the total wounds from the calculator', () => {
      const woundCalculator1 = new WoundCalculator.Builder()
        .withHits(6)
        .withStrength(4)
        .withRerollOn(RerollType.NONE)
        .withWoundModifier(0)
        .withAutoWoundCondition(AutoWound.NONE)
        .withAutoWoundOn(0)
        .withMinTriggerValue(0)
        .withExtraMortalsOnTrigger(0)
        .build();
      expect(woundCalculator1.getTotalNormalWounds()).toBeDeepCloseTo([4, 3, 2, 2, 2, 1], 2);

      const woundCalculator2 = new WoundCalculator.Builder()
        .withHits(6)
        .withStrength(4)
        .withRerollOn(RerollType.ONES)
        .withWoundModifier(0)
        .withAutoWoundCondition(AutoWound.NONE)
        .withAutoWoundOn(0)
        .withMinTriggerValue(0)
        .withExtraMortalsOnTrigger(0)
        .build();
      expect(woundCalculator2.getTotalNormalWounds()).toBeDeepCloseTo([4.66, 3.5, 2.33, 2.33, 2.33, 1.17], 2);

      const woundCalculator3 = new WoundCalculator.Builder()
        .withHits(6)
        .withStrength(4)
        .withRerollOn(RerollType.ALL)
        .withWoundModifier(0)
        .withAutoWoundCondition(AutoWound.NONE)
        .withAutoWoundOn(0)
        .withMinTriggerValue(0)
        .withExtraMortalsOnTrigger(0)
        .build();
      expect(woundCalculator3.getTotalNormalWounds()).toBeDeepCloseTo([5.33, 4.5, 3.33, 3.33, 3.33, 1.83], 2);

      const woundCalculator4 = new WoundCalculator.Builder()
        .withHits(6)
        .withStrength(4)
        .withRerollOn(RerollType.ALL)
        .withWoundModifier(-4)
        .withAutoWoundCondition(AutoWound.NONE)
        .withAutoWoundOn(0)
        .withMinTriggerValue(0)
        .withExtraMortalsOnTrigger(0)
        .build();
      expect(woundCalculator4.getTotalNormalWounds()).toBeDeepCloseTo([0, 0, 0, 0, 0, 0], 2);

      const woundCalculator5 = new WoundCalculator.Builder()
        .withHits(6)
        .withStrength(7)
        .withRerollOn(RerollType.ALL)
        .withWoundModifier(1)
        .withAutoWoundCondition(AutoWound.NONE)
        .withAutoWoundOn(0)
        .withMinTriggerValue(0)
        .withExtraMortalsOnTrigger(0)
        .build();
      expect(woundCalculator5.getTotalNormalWounds()).toBeDeepCloseTo([5.83, 5.83, 5.83, 5.83, 5.33, 4.5], 2);

      const woundCalculator6 = new WoundCalculator.Builder()
        .withHits(12)
        .withStrength(4)
        .withRerollOn(RerollType.ALL)
        .withWoundModifier(1)
        .withAutoWoundCondition(AutoWound.NONE)
        .withAutoWoundOn(0)
        .withMinTriggerValue(5)
        .withExtraMortalsOnTrigger(0)
        .withApModifierOnTrigger(1)
        .withDamageReplacementOnTrigger(0)
        .build();
      expect(woundCalculator6.getTotalModifiedWounds()).toBeDeepCloseTo([7, 8, 9, 9, 9, 6.66], 2);
      expect(woundCalculator6.getTotalNormalWounds()).toBeDeepCloseTo([4.66, 2.66, 0, 0, 0, 0], 2);

      // TODO: Add more tests as shit eventually maybe breaks
    });
  });

});
