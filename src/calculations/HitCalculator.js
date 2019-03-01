import { interpolateD6, modifyMinRequiredRoll, RerollType } from 'calculations/Dice';

export const AUTO_HIT = 1;

/**
 * Class for calculating average hits.
 * Taking into account modifiers, rerolls and triggers
 */
export default class HitCalculator {

  constructor(builder) {
    this.attacks = builder.attacks;
    this.skill = builder.skill;
    this.rerollOn = builder.rerollOn;
    this.hitModifier = builder.hitModifier;
    this.minTriggerValue = builder.minTriggerValue;
    this.additionalHitsOnTrigger = builder.additionalHitsOnTrigger;
    this.additionalAttacksOnTrigger = builder.additionalAttacksOnTrigger;
    this.mortalsInsteadOnTrigger = builder.mortalsInsteadOnTrigger;
  }

  /**
   * Gets the modified skill based on the hit modifier
   * Autohitting weapons cannot be modified
   * Other attacks cannot be modified below 2
   *
   * @return the modified skill based on the hit modifier
   */
  getModifiedSkill() {
    if (this.skill === AUTO_HIT) return AUTO_HIT; // Auto hit unmodifiable
    return Math.max(2, modifyMinRequiredRoll(this.skill, this.hitModifier)); // No less than 2
  }

  /**
   * Gets the total average of raw hits on intial roll
   *
   * @return the total average raw hits on initial roll
   */
  getRawHits() {
    return this.attacks * (interpolateD6(this.getModifiedSkill()));
  }

  /**
   * Gets the modified maximum dice reroll value.
   * Accounts for hit modifier and prevents rerolls of dice already considered hits.
   *
   * @return the maximum value (inclusive) that permits a die to be rerolled.
   */
  getModifiedRerollMaxValue() {
    if (this.skill === AUTO_HIT) return 0; // Cannot reroll on auto hit
    let rerollMaxValue;
    switch(this.rerollOn) {
      case RerollType.ALL:
        rerollMaxValue = Math.min(this.getModifiedSkill(), this.skill) - 1;
        break;
      case RerollType.ONES:
        rerollMaxValue = 1;
        break;
      case RerollType.NONE:
      default:
        rerollMaxValue = 0;
    }
    return rerollMaxValue;
  }

  /**
   * Gets the total average of hits from rerolling dice
   *
   * @return the total average of hits from rerolling dice
   */
  getRerollHits() {
    return (this.getModifiedRerollMaxValue() / 6) * this.getRawHits();
  }

  /**
   * Gets the total attacks made from intial attacks and reroll attacks
   *
   * @return the total attacks made from intial and reroll attacks
   */
  getTotalAttacksWithRerolls() {
    return this.attacks * ((this.getModifiedRerollMaxValue() / 6) + 1);
  }

  /**
   * Gets the modified dice roll required to trigger
   *
   * @return the modified dice roll required to trigger
   */
  getModifiedTriggerValue() {
    return modifyMinRequiredRoll(this.minTriggerValue, this.hitModifier);
  }

  /**
   * Gets the average amount of rolls that will activate a trigger
   *
   * @return the average amount of rolls that will activate a trigger
   */
  getTotalTriggers() {
    return this.getTotalAttacksWithRerolls() * interpolateD6(this.getModifiedTriggerValue());
  }

  /**
   * Gets the extra hits from the bonus hits trigger
   *
   * @return the extra hits from the bonus hits trigger
   */
  getExtraHitsOnTrigger() {
    return this.additionalHitsOnTrigger * this.getTotalTriggers();
  }

  /**
   * Gets the total extra hits calculated from the extra attacks trigger
   *
   * @return the total extra hits calculated from the extra attacks trigger
   */
  getExtraAttackHitsOnTrigger() {
    if (!this.additionalAttacksOnTrigger) return 0;
    const extraAttacks = this.additionalAttacksOnTrigger * this.getTotalTriggers();
    return new HitCalculator.Builder()
      .withNumOfAttacks(extraAttacks)
      .withSkill(this.skill)
      .withHitModifier(this.hitModifier)
      .withRerollOn(this.rerollOn)
      .withMinTriggerValue(this.minTriggerValue)
      .withAdditionalAttacksOnTrigger(0)
      .withAdditionalHitsOnTrigger(this.additionalHitsOnTrigger)
      .withMortalsInsteadOnTrigger(0)
      .build()
      .getTotalHits();
  }

  /**
   * Gets the total triggers for the mortals-instead trigger
   * Note: This trigger must be distinguished from the total triggers calculator
   *    because it is used in subtraction of the total hits calculator
   *
   * @return the total triggers for the mortals-instead trigger
   */
  getMortalWoundTriggers() {
    return this.mortalsInsteadOnTrigger ? this.getTotalTriggers() : 0;
  }

  /**
   * Gets the total mortal wounds expected from the hit rolling phase
   *
   * @return the total mortal wounds expected from the hit rolling phase
   */
  getTotalMortalWounds() {
    return this.mortalsInsteadOnTrigger * this.getMortalWoundTriggers();
  }

  /**
   * Gets the total average hits made during the attacking phase
   *
   * @return the total average hits made during the attacking phase
   */
  getTotalHits() {
    return Math.max(0, this.getRawHits()
      + this.getRerollHits()
      + this.getExtraHitsOnTrigger()
      + this.getExtraAttackHitsOnTrigger()
      - this.getMortalWoundTriggers());
  }

  /**
   * Builder for creating a HitCalculator
   */
  static get Builder() {

    class Builder {

      constructor() {
        this.attacks;
        this.skill;
        this.rerollOn = 0; // Default no rerolls
        this.hitModifier = 0; // Default no modifier
        this.minTriggerValue;
        this.additionalAttacksOnTrigger;
        this.additionalHitsOnTrigger;
        this.mortalsInsteadOnTrigger;
      }

      /**
       * Specifies the number of attacks the model can make
       */
      withNumOfAttacks(attacks) {
        this.attacks = attacks;
        return this;
      }

      /**
       * Specifies the required roll to hit
       */
      withSkill(skill) {
        this.skill = skill;
        return this;
      }

      /**
       * Specifies the max dice value that permits a reroll
       */
      withRerollOn(rerollOn) {
        this.rerollOn = rerollOn;
        return this;
      }

      /**
       * Specifies the hit modifier for all attacks
       */
      withHitModifier(hitModifier) {
        this.hitModifier = hitModifier;
        return this;
      }

      /**
       * Specifies the minimum required value to activate triggers
       */
      withMinTriggerValue(minTriggerValue) {
        this.minTriggerValue = minTriggerValue;
        return this;
      }

      /**
       * Specifies the total additional attacks received when a trigger is activated
       */
      withAdditionalAttacksOnTrigger(additionalAttacksOnTrigger) {
        this.additionalAttacksOnTrigger = additionalAttacksOnTrigger;
        return this;
      }

      /**
       * Specifies the total additional hits received when a trigger is activated
       */
      withAdditionalHitsOnTrigger(additionalHitsOnTrigger) {
        this.additionalHitsOnTrigger = additionalHitsOnTrigger;
        return this;
      }

      /**
       * Specifies the total mortal wounds inflicted when a trigger is activated
       */
      withMortalsInsteadOnTrigger(mortalsInsteadOnTrigger) {
        this.mortalsInsteadOnTrigger = mortalsInsteadOnTrigger;
        return this;
      }

      /**
       * Generates the builder for the HitCalculator
       */
      build() {
        return new HitCalculator(this);
      }
    }
    return Builder;
  }

}
