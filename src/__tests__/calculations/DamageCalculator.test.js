import HitCalculator from 'calculations/HitCalculator';
import WoundCalculator, { AutoWound } from 'calculations/WoundCalculator';
import DamageCalculator from 'calculations/DamageCalculator';
import { RerollType } from 'calculations/Dice';

import { toBeDeepCloseTo } from 'jest-matcher-deep-close-to';
expect.extend({ toBeDeepCloseTo });

describe('Damage Calculator', () => {

  it ('Calculates damage', () => {
    const hitCalculator1 = new HitCalculator.Builder()
      .withNumOfAttacks(6)
      .withSkill(3)
      .withHitModifier(0)
      .withRerollOn(RerollType.NONE)
      .withMinTriggerValue(0)
      .withAdditionalAttacksOnTrigger(0)
      .withAdditionalHitsOnTrigger(0)
      .withMortalsInsteadOnTrigger(0)
      .build();

    const woundCalculator1 = new WoundCalculator.Builder()
      .withHits(hitCalculator1.getTotalHits())
      .withStrength(4)
      .withRerollOn(RerollType.NONE)
      .withWoundModifier(0)
      .withAutoWoundCondition(AutoWound.NONE)
      .withAutoWoundOn(0)
      .withMinTriggerValue(6)
      .withExtraMortalsOnTrigger(1)
      .withApModifierOnTrigger(0)
      .withDamageReplacementOnTrigger(0)
      .build();

    const damageCalculator = new DamageCalculator.Builder()
      .withHitCalculator(hitCalculator1)
      .withWoundCalculator(woundCalculator1)
      .withDamage(1)
      .withEnemySave(3)
      .withBaseAp(0)
      .build();

    expect(damageCalculator.getMortalWounds()).toBeDeepCloseTo([0.67, 0.67, 0.67, 0.67, 0.67, 0.67], 2);
    expect(damageCalculator.getTotalDamage()).toBeDeepCloseTo([1.55, 1.33, 1.11, 1.11, 1.11, 0.89], 2);

  });

  it ('Calculates more damage', () => {
    const hitCalculator1 = new HitCalculator.Builder()
      .withNumOfAttacks(6)
      .withSkill(3)
      .withHitModifier(0)
      .withRerollOn(RerollType.ONES)
      .withMinTriggerValue(0)
      .withAdditionalAttacksOnTrigger(0)
      .withAdditionalHitsOnTrigger(0)
      .withMortalsInsteadOnTrigger(0)
      .build();

    const woundCalculator1 = new WoundCalculator.Builder()
      .withHits(hitCalculator1.getTotalHits())
      .withStrength(4)
      .withRerollOn(RerollType.NONE)
      .withWoundModifier(0)
      .withAutoWoundCondition(AutoWound.NONE)
      .withAutoWoundOn(0)
      .withMinTriggerValue(0)
      .withExtraMortalsOnTrigger(0)
      .withApModifierOnTrigger(0)
      .withDamageReplacementOnTrigger(0)
      .build();

    const damageCalculator = new DamageCalculator.Builder()
      .withHitCalculator(hitCalculator1)
      .withWoundCalculator(woundCalculator1)
      .withDamage(1)
      .withEnemySave(3)
      .withBaseAp(0)
      .build();

    expect(damageCalculator.getTotalDamage()).toBeDeepCloseTo([1.04, 0.78, 0.52, 0.52, 0.52, 0.26], 2);
  });

  it ('Calculates even more damage', () => {
    const hitCalculator1 = new HitCalculator.Builder()
      .withNumOfAttacks(6)
      .withSkill(6)
      .withHitModifier(-1)
      .withRerollOn(RerollType.NONE)
      .withMinTriggerValue(5)
      .withAdditionalAttacksOnTrigger(1)
      .withAdditionalHitsOnTrigger(1)
      .withMortalsInsteadOnTrigger(0)
      .build();
    expect(hitCalculator1.getTotalHits()).toBeCloseTo(1.17);

    const woundCalculator1 = new WoundCalculator.Builder()
      .withHits(hitCalculator1.getTotalHits())
      .withStrength(4)
      .withRerollOn(RerollType.NONE)
      .withWoundModifier(0)
      .withAutoWoundCondition(AutoWound.NONE)
      .withAutoWoundOn(0)
      .withMinTriggerValue(5)
      .withExtraMortalsOnTrigger(0)
      .withApModifierOnTrigger(0)
      .withDamageReplacementOnTrigger(3)
      .build();


    const damageCalculator = new DamageCalculator.Builder()
      .withHitCalculator(hitCalculator1)
      .withWoundCalculator(woundCalculator1)
      .withDamage(2)
      .withEnemySave(2)
      .withBaseAp(0)
      .build();
    expect(damageCalculator.getTotalDamage()).toBeDeepCloseTo([0.32, 0.26, 0.19, 0.19, 0.19, 0.097], 2);

  });

  it ('Still calculates damage', () => {
    const hitCalculator1 = new HitCalculator.Builder()
      .withNumOfAttacks(6)
      .withSkill(7)
      .withHitModifier(1)
      .withRerollOn(RerollType.NONE)
      .withMinTriggerValue(0)
      .withAdditionalAttacksOnTrigger(0)
      .withAdditionalHitsOnTrigger(0)
      .withMortalsInsteadOnTrigger(0)
      .build();

    const woundCalculator1 = new WoundCalculator.Builder()
      .withHits(hitCalculator1.getTotalHits())
      .withStrength(4)
      .withRerollOn(RerollType.NONE)
      .withWoundModifier(0)
      .withAutoWoundCondition(AutoWound.NONE)
      .withAutoWoundOn(0)
      .withMinTriggerValue(0)
      .withExtraMortalsOnTrigger(0)
      .withApModifierOnTrigger(0)
      .withDamageReplacementOnTrigger(0)
      .build();


    const damageCalculator = new DamageCalculator.Builder()
      .withHitCalculator(hitCalculator1)
      .withWoundCalculator(woundCalculator1)
      .withDamage(1)
      .withEnemySave(7)
      .withBaseAp(0)
      .build();
    expect(damageCalculator.getTotalDamage()).toBeDeepCloseTo([0.66, 0.5, 0.33, 0.33, 0.33, 0.17], 2);

  });

});
