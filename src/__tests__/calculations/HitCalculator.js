import { Chance } from 'chance';

import HitCalculator, { AUTO_HIT } from 'calculations/HitCalculator';

describe('AUTO_HIT', () => {
  it('has a value of 1', () => {
    expect(AUTO_HIT).toEqual(1);
  });
});

describe('HitCalculator', () => {

  const random = new Chance();

  it('is constructed with a builder', () => {
    const expectedAttacks = random.integer({min: 2});
    const expectedAttackSkill = random.integer({min: 2});
    const expectedRerollMaxValue = random.integer({min: 2});
    const expectedHitModifier = random.integer();
    const builder = new HitCalculator.Builder()
      .withNumOfAttacks(expectedAttacks)
      .withAttackSkill(expectedAttackSkill)
      .withRerollMaxValue(expectedRerollMaxValue)
      .withHitModifier(expectedHitModifier)
      .build();
    const hitCalculator = new HitCalculator(builder);
    expect(hitCalculator.attacks).toEqual(expectedAttacks);
    expect(hitCalculator.attackSkill).toEqual(expectedAttackSkill);
    expect(hitCalculator.rerollMaxValue).toEqual(expectedRerollMaxValue);
    expect(hitCalculator.hitModifier).toEqual(expectedHitModifier);
  });

  describe('Hit Modification', () => {

    it('calculates the modified attack skill', () => {
      const builder1 = new HitCalculator.Builder()
        .withAttackSkill(4)
        .withHitModifier(1)
        .build();
      const hitCalculator1 = new HitCalculator(builder1);
      expect(hitCalculator1.getModifiedAttackSkill()).toEqual(3);

      const builder2 = new HitCalculator.Builder()
        .withAttackSkill(4)
        .withHitModifier(-1)
        .build();
      const hitCalculator2 = new HitCalculator(builder2);
      expect(hitCalculator2.getModifiedAttackSkill()).toEqual(5);

      const builder3 = new HitCalculator.Builder()
        .withAttackSkill(6)
        .withHitModifier(-2)
        .build();
      const hitCalculator3 = new HitCalculator(builder3);
      expect(hitCalculator3.getModifiedAttackSkill()).toEqual(8);
    });

    it('does not modify auto hits', () => {
      const builder = new HitCalculator.Builder()
        .withAttackSkill(AUTO_HIT)
        .withHitModifier(4)
        .build();
      const hitCalculator = new HitCalculator(builder);
      expect(hitCalculator.getModifiedAttackSkill()).toEqual(1);
    });

    it('does not modify attack skill below 2', () => {
      const builder = new HitCalculator.Builder()
        .withAttackSkill(4)
        .withHitModifier(10)
        .build();
      const hitCalculator = new HitCalculator(builder);
      expect(hitCalculator.getModifiedAttackSkill()).toEqual(2);
    });

  });

  describe('Raw Hits', () => {

    it('gets the total amount of raw hits on the first rolling', () => {
      const builder1 = new HitCalculator.Builder()
        .withNumOfAttacks(6)
        .withAttackSkill(5)
        .withHitModifier(1)
        .build();
      const hitCalculator1 = new HitCalculator(builder1);
      expect(hitCalculator1.getRawHits()).toEqual(3);

      const builder2 = new HitCalculator.Builder()
        .withNumOfAttacks(6)
        .withAttackSkill(2)
        .withHitModifier(10)
        .build();
      const hitCalculator2 = new HitCalculator(builder2);
      expect(hitCalculator2.getRawHits()).toEqual(5);

      const builder3 = new HitCalculator.Builder()
        .withNumOfAttacks(6)
        .withAttackSkill(5)
        .withHitModifier(-2)
        .build();
      const hitCalculator3 = new HitCalculator(builder3);
      expect(hitCalculator3.getRawHits()).toEqual(0);
    });

  });

  describe('Reroll max value', () => {

    it('determines the max dice value that warrants a reroll of the die', () => {
      const builder1 = new HitCalculator.Builder()
        .withAttackSkill(4)
        .withHitModifier(0)
        .withRerollMaxValue(1)
        .build();
      const hitCalculator1 = new HitCalculator(builder1);
      expect(hitCalculator1.getModifiedRerollMaxValue()).toEqual(1);

      const builder2 = new HitCalculator.Builder()
        .withAttackSkill(4)
        .withHitModifier(0)
        .withRerollMaxValue(3)
        .build();
      const hitCalculator2 = new HitCalculator(builder2);
      expect(hitCalculator2.getModifiedRerollMaxValue()).toEqual(3);
    });

    it('does not apply reroll to modified die values', () => {
      const builder = new HitCalculator.Builder()
        .withAttackSkill(4)
        .withHitModifier(-2)
        .withRerollMaxValue(3)
        .build();
      const hitCalculator = new HitCalculator(builder);
      expect(hitCalculator.getModifiedRerollMaxValue()).toEqual(3);
    });

    it('prevents reroll overlap when initial roll is modified', () => {
      const builder = new HitCalculator.Builder()
        .withAttackSkill(4)
        .withHitModifier(2)
        .withRerollMaxValue(3)
        .build();
      const hitCalculator = new HitCalculator(builder);
      expect(hitCalculator.getModifiedRerollMaxValue()).toEqual(1);
    });

  });

  describe('Reroll Hits', () => {
    it ('gets the total amount of hits on the reroll', () => {
      const builder1 = new HitCalculator.Builder()
        .withNumOfAttacks(6)
        .withAttackSkill(4)
        .withHitModifier(0)
        .withRerollMaxValue(1)
        .build();
      const hitCalculator1 = new HitCalculator(builder1);
      expect(hitCalculator1.getRerollHits()).toEqual(0.5);

      const builder2 = new HitCalculator.Builder()
        .withNumOfAttacks(6)
        .withAttackSkill(4)
        .withHitModifier(-2)
        .withRerollMaxValue(3)
        .build();
      const hitCalculator2 = new HitCalculator(builder2);
      expect(hitCalculator2.getRerollHits()).toEqual(0.5);

      const builder3 = new HitCalculator.Builder()
        .withNumOfAttacks(10)
        .withAttackSkill(2)
        .withHitModifier(0)
        .withRerollMaxValue(1)
        .build();
      const hitCalculator3 = new HitCalculator(builder3);
      expect(hitCalculator3.getRerollHits()).toBeCloseTo(1.3888);
    });

  });

  describe('Total Attacks With Rerolls', () => {
    it('sums the initial attacks with the total reroll attacks', () => {
      const builder1 = new HitCalculator.Builder()
        .withNumOfAttacks(6)
        .withAttackSkill(5)
        .withHitModifier(0)
        .withRerollMaxValue(4)
        .build();
      const hitCalculator1 = new HitCalculator(builder1);
      expect(hitCalculator1.getTotalAttacksWithRerolls()).toEqual(10);

      const builder2 = new HitCalculator.Builder()
        .withNumOfAttacks(6)
        .withAttackSkill(4)
        .withHitModifier(0)
        .withRerollMaxValue(1)
        .build();
      const hitCalculator2 = new HitCalculator(builder2);
      expect(hitCalculator2.getTotalAttacksWithRerolls()).toEqual(7);

      const builder3 = new HitCalculator.Builder()
        .withNumOfAttacks(10)
        .withAttackSkill(2)
        .withHitModifier(0)
        .withRerollMaxValue(1)
        .build();
      const hitCalculator3 = new HitCalculator(builder3);
      expect(hitCalculator3.getTotalAttacksWithRerolls()).toBeCloseTo(11.666);
    });
  });

  describe('Get Total Hits', () => {
    it('gets the average total hits', () => {
      const builder1 = new HitCalculator.Builder()
        .withNumOfAttacks(6)
        .withAttackSkill(4)
        .withHitModifier(0)
        .withRerollMaxValue(3)
        .build();
      const hitCalculator1 = new HitCalculator(builder1);
      expect(hitCalculator1.getTotalHits()).toEqual(4.5);

      const builder2 = new HitCalculator.Builder()
        .withNumOfAttacks(6)
        .withAttackSkill(AUTO_HIT)
        .withHitModifier(-2)
        .withRerollMaxValue(3)
        .build();
      const hitCalculator2 = new HitCalculator(builder2);
      expect(hitCalculator2.getTotalHits()).toEqual(6);

      const builder3 = new HitCalculator.Builder()
        .withNumOfAttacks(6)
        .withAttackSkill(5)
        .withHitModifier(-2)
        .withRerollMaxValue(4)
        .build();
      const hitCalculator3 = new HitCalculator(builder3);
      expect(hitCalculator3.getTotalHits()).toEqual(0);

      const builder4 = new HitCalculator.Builder()
        .withNumOfAttacks(6)
        .withAttackSkill(4)
        .withHitModifier(2)
        .withRerollMaxValue(3)
        .build();
      const hitCalculator4 = new HitCalculator(builder4);
      expect(hitCalculator4.getTotalHits()).toBeCloseTo(5.83333);
    });
  });

});
