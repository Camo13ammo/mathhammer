import {interpolateD6, modifyMinRequiredRoll} from 'calculations/Dice';

export const AUTO_HIT = 1;

/**
 * Class for calculating average hits.
 * Taking into account modifiers, rerolls and triggers
 */
export default class HitCalculator {

  constructor(builder) {
    this.attacks = builder.attacks;
    this.attackSkill = builder.attackSkill;
    this.rerollMaxValue = builder.rerollMaxValue;
    this.hitModifier = builder.hitModifier;
    this.minTriggerValue = builder.minTriggerValue;
    this.additionalHitsOnTrigger = builder.additionalHitsOnTrigger;
    this.additionalAttacksOnTrigger = builder.additionalAttacksOnTrigger;
    this.mortalHitsOnTrigger = builder.mortalHitsOnTrigger;
  }

  /**
   * Gets the modified attack skill based on the hit modifier
   * Autohitting weapons cannot be modified
   * Other attacks cannot be modified below 2
   *
   * @return the modified attack skill based on the hit modifier
   */
  getModifiedAttackSkill() {
    if (this.attackSkill === AUTO_HIT) return AUTO_HIT; // Auto hit unmodifiable
    return Math.max(2, modifyMinRequiredRoll(this.attackSkill, this.hitModifier)); // No less than 2
  }

  /**
   * Gets the total average of raw hits on intial roll
   *
   * @return the total average raw hits on initial roll
   */
  getRawHits() {
    return this.attacks * (interpolateD6(this.getModifiedAttackSkill()));
  }

  /**
   * Gets the modified maximum dice reroll value.
   * Accounts for hit modifier and prevents rerolls of dice already considered hits.
   *
   * @return the maximum value (inclusive) that permits a die to be rerolled.
   */
  getModifiedRerollMaxValue() {
    // The reroll value or the modified attack skill. Prevents overlap
    return Math.min(this.getModifiedAttackSkill() - 1, this.rerollMaxValue);
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

  // TODO - Triggers
  getModifiedTriggerValue() {
    return modifyMinRequiredRoll(this.minTriggerValue, this.hitModifier);
  }

  /**
   * Gets the total average hits made during the attacking phase
   *
   * @return the total average hits made during the attacking phase
   */
  getTotalHits() {
    // const bonusHitsOnTrigger = this.additionalHitsOnTrigger * (this.getTotalAttacksWithRerolls() * (interpolateD6(this.getModifiedTriggerValue())));
    // const bonusAttacksOnTrigger = this.getTotalAttacksWithRerolls() * (this.additionalAttacksOnTrigger * interpolateD6(this.getModifiedTriggerValue()));
    // const bonusAttackHitsOnTrigger = bonusAttacksOnTrigger * (interpolateD6(this.getModifiedAttackSkill()));
    // const bonusAttackRerollHitsOnTrigger = (this.getModifiedRerollMaxValue() / 6) * bonusAttackHitsOnTrigger;
    // const mortalHitsOnTrigger = this.mortalHitsOnTrigger ? this.getTotalAttacksWithRerolls() * (interpolateD6(this.getModifiedTriggerValue())) : 0;
    return this.getRawHits() + this.getRerollHits();
     // + bonusHitsOnTrigger + bonusAttackHitsOnTrigger + bonusAttackRerollHitsOnTrigger - mortalHitsOnTrigger;
  }

  /**
   * Builder for creating a HitCalculator
   */
  static get Builder() {

    class Builder {

      constructor() {
        this.attacks;
        this.attackSkill;
        this.rerollMaxValue = 0; // Default no rerolls
        this.hitModifier = 0; // Default no modifier
        this.minTriggerValue;
        this.additionalAttacksOnTrigger;
        this.additionalHitsOnTrigger;
        this.mortalHitsOnTrigger;
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
       * TODO: Rename this to include WS as well
       */
      withAttackSkill(attackSkill) {
        this.attackSkill = attackSkill;
        return this;
      }

      /**
       * Specifies the max dice value that permits a reroll
       * e.g. for rerolls of 1, rerollMaxValue = 1
       *      for rerolls of 1's or 2's rerollMaxValue = 2
       *      for reroll all misses of BS 4+ rerollMaxValue = 3
       */
      withRerollMaxValue(rerollMaxValue) {
        this.rerollMaxValue = rerollMaxValue;
        return this;
      }

      /**
       * Specifies the hit modifier for all attacks
       */
      withHitModifier(hitModifier) {
        this.hitModifier = hitModifier;
        return this;
      }

      withMinTriggerValue(minTriggerValue) {
        this.minTriggerValue = minTriggerValue;
        return this;
      }

      withAdditionalAttacksOnTrigger(additionalAttacksOnTrigger) {
        this.additionalAttacksOnTrigger = additionalAttacksOnTrigger;
        return this;
      }

      withAdditionalHitsOnTrigger(additionalHitsOnTrigger) {
        this.additionalHitsOnTrigger = additionalHitsOnTrigger;
        return this;
      }

      withMortalHitsOnTrigger(mortalHitsOnTrigger) {
        this.mortalHitsOnTrigger = mortalHitsOnTrigger;
        return this;
      }

      build() {
        return new HitCalculator(this);
      }
    }
    return Builder;
  }

}
