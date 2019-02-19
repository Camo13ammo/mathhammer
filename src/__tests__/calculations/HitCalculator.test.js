import { RerollType } from 'calculations/Dice';
import HitCalculator, { AUTO_HIT } from 'calculations/HitCalculator';

import { Chance } from 'chance';

describe('AUTO_HIT', () => {
  it('has a value of 1', () => {
    expect(AUTO_HIT).toEqual(1);
  });
});

describe('HitCalculator', () => {

  const random = new Chance();

  it('is constructed with a builder', () => {
    const expectedAttacks = random.integer({min: 2});
    const expectedSkill = random.integer({min: 2});
    const expectedRerollOn = RerollType.ONES;
    const expectedHitModifier = random.integer();
    const hitCalculator = new HitCalculator.Builder()
      .withNumOfAttacks(expectedAttacks)
      .withSkill(expectedSkill)
      .withRerollOn(expectedRerollOn)
      .withHitModifier(expectedHitModifier)
      .build();
    expect(hitCalculator.attacks).toEqual(expectedAttacks);
    expect(hitCalculator.skill).toEqual(expectedSkill);
    expect(hitCalculator.rerollOn).toEqual('ONES');
    expect(hitCalculator.hitModifier).toEqual(expectedHitModifier);
  });

  describe('Hit Modification', () => {

    it('calculates the modified attack skill', () => {
      const hitCalculator1 = new HitCalculator.Builder()
        .withSkill(4)
        .withHitModifier(1)
        .build();
      expect(hitCalculator1.getModifiedSkill()).toEqual(3);

      const hitCalculator2 = new HitCalculator.Builder()
        .withSkill(4)
        .withHitModifier(-1)
        .build();
      expect(hitCalculator2.getModifiedSkill()).toEqual(5);

      const hitCalculator3 = new HitCalculator.Builder()
        .withSkill(6)
        .withHitModifier(-2)
        .build();
      expect(hitCalculator3.getModifiedSkill()).toEqual(8);
    });

    it('does not modify auto hits', () => {
      const hitCalculator = new HitCalculator.Builder()
        .withSkill(AUTO_HIT)
        .withHitModifier(4)
        .build();
      expect(hitCalculator.getModifiedSkill()).toEqual(1);
    });

    it('does not modify attack skill below 2', () => {
      const hitCalculator = new HitCalculator.Builder()
        .withSkill(4)
        .withHitModifier(10)
        .build();
      expect(hitCalculator.getModifiedSkill()).toEqual(2);
    });

  });

  describe('Raw Hits', () => {

    it('gets the total amount of raw hits on the first rolling', () => {
      const hitCalculator1 = new HitCalculator.Builder()
        .withNumOfAttacks(6)
        .withSkill(5)
        .withHitModifier(1)
        .build();
      expect(hitCalculator1.getRawHits()).toEqual(3);

      const hitCalculator2 = new HitCalculator.Builder()
        .withNumOfAttacks(6)
        .withSkill(2)
        .withHitModifier(10)
        .build();
      expect(hitCalculator2.getRawHits()).toEqual(5);

      const hitCalculator3 = new HitCalculator.Builder()
        .withNumOfAttacks(6)
        .withSkill(5)
        .withHitModifier(-2)
        .build();
      expect(hitCalculator3.getRawHits()).toEqual(0);
    });

  });

  describe('Reroll max value', () => {

    it('determines the max dice value that warrants a reroll of the die', () => {
      const hitCalculator1 = new HitCalculator.Builder()
        .withSkill(4)
        .withHitModifier(0)
        .withRerollOn(RerollType.ONES)
        .build();
      expect(hitCalculator1.getModifiedRerollMaxValue()).toEqual(1);

      const hitCalculator2 = new HitCalculator.Builder()
        .withSkill(4)
        .withHitModifier(0)
        .withRerollOn(RerollType.ALL)
        .build();
      expect(hitCalculator2.getModifiedRerollMaxValue()).toEqual(3);
    });

    it('does not apply reroll to modified die values', () => {
      const hitCalculator = new HitCalculator.Builder()
        .withSkill(4)
        .withHitModifier(-2)
        .withRerollOn(RerollType.ALL)
        .build();
      expect(hitCalculator.getModifiedRerollMaxValue()).toEqual(3);
    });

    it('prevents reroll overlap when initial roll is modified', () => {
      const hitCalculator = new HitCalculator.Builder()
        .withSkill(4)
        .withHitModifier(2)
        .withRerollOn(RerollType.ALL)
        .build();
      expect(hitCalculator.getModifiedRerollMaxValue()).toEqual(1);
    });

  });

  describe('Reroll Hits', () => {
    it ('gets the total amount of hits on the reroll', () => {
      const hitCalculator1 = new HitCalculator.Builder()
        .withNumOfAttacks(6)
        .withSkill(4)
        .withHitModifier(0)
        .withRerollOn(RerollType.ONES)
        .build();
      expect(hitCalculator1.getRerollHits()).toEqual(0.5);

      const hitCalculator2 = new HitCalculator.Builder()
        .withNumOfAttacks(6)
        .withSkill(4)
        .withHitModifier(-2)
        .withRerollOn(RerollType.ALL)
        .build();
      expect(hitCalculator2.getRerollHits()).toEqual(0.5);

      const hitCalculator3 = new HitCalculator.Builder()
        .withNumOfAttacks(10)
        .withSkill(2)
        .withHitModifier(0)
        .withRerollOn(RerollType.ONES)
        .build();
      expect(hitCalculator3.getRerollHits()).toBeCloseTo(1.3888);
    });

  });

  describe('Total Attacks With Rerolls', () => {
    it('sums the initial attacks with the total reroll attacks', () => {
      const hitCalculator1 = new HitCalculator.Builder()
        .withNumOfAttacks(6)
        .withSkill(5)
        .withHitModifier(0)
        .withRerollOn(RerollType.ALL)
        .build();
      expect(hitCalculator1.getTotalAttacksWithRerolls()).toEqual(10);

      const hitCalculator2 = new HitCalculator.Builder()
        .withNumOfAttacks(6)
        .withSkill(4)
        .withHitModifier(0)
        .withRerollOn(RerollType.ONES)
        .build();
      expect(hitCalculator2.getTotalAttacksWithRerolls()).toEqual(7);

      const hitCalculator3 = new HitCalculator.Builder()
        .withNumOfAttacks(10)
        .withSkill(2)
        .withHitModifier(0)
        .withRerollOn(RerollType.ONES)
        .build();
      expect(hitCalculator3.getTotalAttacksWithRerolls()).toBeCloseTo(11.666);
    });
  });

  describe('Get Modified Trigger Value', () => {
    it ('modifies the trigger value', () => {
      const hitCalculator1 = new HitCalculator.Builder()
        .withNumOfAttacks(6)
        .withSkill(6)
        .withHitModifier(-1)
        .withRerollOn(RerollType.NONE)
        .withMinTriggerValue(5)
        .withAdditionalAttacksOnTrigger(0)
        .withAdditionalHitsOnTrigger(0)
        .withMortalsInsteadOnTrigger(0)
        .build();
      expect(hitCalculator1.getModifiedTriggerValue()).toEqual(6);

      const hitCalculator2 = new HitCalculator.Builder()
        .withNumOfAttacks(6)
        .withSkill(6)
        .withHitModifier(3)
        .withRerollOn(RerollType.NONE)
        .withMinTriggerValue(2)
        .withAdditionalAttacksOnTrigger(0)
        .withAdditionalHitsOnTrigger(0)
        .withMortalsInsteadOnTrigger(0)
        .build();
      expect(hitCalculator2.getModifiedTriggerValue()).toEqual(1);
    });
  });

  describe('Get Total Triggers', () => {
    it('gets the total average of trigger rolls', () => {
      const hitCalculator1 = new HitCalculator.Builder()
        .withNumOfAttacks(4)
        .withSkill(6)
        .withHitModifier(2)
        .withRerollOn(RerollType.ALL)
        .withMinTriggerValue(5)
        .withAdditionalAttacksOnTrigger(0)
        .withAdditionalHitsOnTrigger(0)
        .withMortalsInsteadOnTrigger(0)
        .build();
      expect(hitCalculator1.getTotalTriggers()).toEqual(4);
    });
  });

  describe('Get Extra Hits On Trigger', () => {
    it('gets the total extra hits from trigger', () => {
      const hitCalculator1 = new HitCalculator.Builder()
        .withNumOfAttacks(4)
        .withSkill(6)
        .withHitModifier(2)
        .withRerollOn(RerollType.ALL)
        .withMinTriggerValue(5)
        .withAdditionalAttacksOnTrigger(0)
        .withAdditionalHitsOnTrigger(2)
        .withMortalsInsteadOnTrigger(0)
        .build();
      expect(hitCalculator1.getExtraHitsOnTrigger()).toEqual(8);
    });
  });

  describe('Get Extra Attack Hits On Trigger', () => {
    it('gets the total extra hits from the bonus attacks trigger', () => {
      const hitCalculator1 = new HitCalculator.Builder()
        .withNumOfAttacks(4)
        .withSkill(6)
        .withHitModifier(2)
        .withRerollOn(RerollType.ALL)
        .withMinTriggerValue(5)
        .withAdditionalAttacksOnTrigger(3)
        .withAdditionalHitsOnTrigger(0)
        .withMortalsInsteadOnTrigger(0)
        .build();
      expect(hitCalculator1.getExtraAttackHitsOnTrigger()).toEqual(9);
    });
  });

  describe('Get Mortal Wound Triggers', () => {
    it('gets the total occurences of the mortal-wounds-instead trigger', () => {
      const hitCalculator1 = new HitCalculator.Builder()
        .withNumOfAttacks(4)
        .withSkill(6)
        .withHitModifier(2)
        .withRerollOn(RerollType.ALL)
        .withMinTriggerValue(5)
        .withAdditionalAttacksOnTrigger(3)
        .withAdditionalHitsOnTrigger(0)
        .withMortalsInsteadOnTrigger(3)
        .build();
      expect(hitCalculator1.getMortalWoundTriggers()).toEqual(4);
    });
  });

  describe('Get Total Hits', () => {

    it('gets the average total hits', () => {
      const hitCalculator1 = new HitCalculator.Builder()
        .withNumOfAttacks(6)
        .withSkill(4)
        .withHitModifier(0)
        .withRerollOn(RerollType.ALL)
        .withMinTriggerValue(0)
        .withAdditionalAttacksOnTrigger(0)
        .withAdditionalHitsOnTrigger(0)
        .withMortalsInsteadOnTrigger(0)
        .build();
      expect(hitCalculator1.getTotalHits()).toEqual(4.5);

      const hitCalculator2 = new HitCalculator.Builder()
        .withNumOfAttacks(6)
        .withSkill(AUTO_HIT)
        .withHitModifier(-2)
        .withRerollOn(RerollType.ONES)
        .withMinTriggerValue(0)
        .withAdditionalAttacksOnTrigger(0)
        .withAdditionalHitsOnTrigger(0)
        .withMortalsInsteadOnTrigger(0)
        .build();
      expect(hitCalculator2.getTotalHits()).toEqual(6);

      const hitCalculator3 = new HitCalculator.Builder()
        .withNumOfAttacks(6)
        .withSkill(5)
        .withHitModifier(-2)
        .withRerollOn(RerollType.ALL)
        .withMinTriggerValue(0)
        .withAdditionalAttacksOnTrigger(0)
        .withAdditionalHitsOnTrigger(0)
        .withMortalsInsteadOnTrigger(0)
        .build();
      expect(hitCalculator3.getTotalHits()).toEqual(0);

      const hitCalculator4 = new HitCalculator.Builder()
        .withNumOfAttacks(6)
        .withSkill(4)
        .withHitModifier(2)
        .withRerollOn(RerollType.ALL)
        .withMinTriggerValue(0)
        .withAdditionalAttacksOnTrigger(0)
        .withAdditionalHitsOnTrigger(0)
        .withMortalsInsteadOnTrigger(0)
        .build();
      expect(hitCalculator4.getTotalHits()).toBeCloseTo(5.8333);

      const hitCalculator5 = new HitCalculator.Builder()
        .withNumOfAttacks(6)
        .withSkill(6)
        .withHitModifier(0)
        .withRerollOn(RerollType.ALL)
        .withMinTriggerValue(5)
        .withAdditionalAttacksOnTrigger(3)
        .withAdditionalHitsOnTrigger(0)
        .withMortalsInsteadOnTrigger(0)
        .build();
      expect(hitCalculator5.getTotalHits()).toBeCloseTo(5.1944);

      const hitCalculator6 = new HitCalculator.Builder()
        .withNumOfAttacks(6)
        .withSkill(5)
        .withHitModifier(-2)
        .withRerollOn(RerollType.ONES)
        .withMinTriggerValue(3)
        .withAdditionalAttacksOnTrigger(0)
        .withAdditionalHitsOnTrigger(3)
        .withMortalsInsteadOnTrigger(0)
        .build();
      expect(hitCalculator6.getTotalHits()).toBeCloseTo(6.999);

      const hitCalculator7 = new HitCalculator.Builder()
        .withNumOfAttacks(6)
        .withSkill(4)
        .withHitModifier(2)
        .withRerollOn(RerollType.ALL)
        .withMinTriggerValue(5)
        .withAdditionalAttacksOnTrigger(3)
        .withAdditionalHitsOnTrigger(2)
        .withMortalsInsteadOnTrigger(1)
        .build();
      expect(hitCalculator7.getTotalHits()).toBeCloseTo(24.111);

      const hitCalculator8 = new HitCalculator.Builder()
        .withNumOfAttacks(6)
        .withSkill(6)
        .withHitModifier(-1)
        .withRerollOn(RerollType.NONE)
        .withMinTriggerValue(5)
        .withAdditionalAttacksOnTrigger(0)
        .withAdditionalHitsOnTrigger(0)
        .withMortalsInsteadOnTrigger(3)
        .build();
      expect(hitCalculator8.getTotalHits()).toBeCloseTo(0);
    });

  });

});
