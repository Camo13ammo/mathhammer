import { interpolateD6, modifyMinRequiredRoll, RerollType } from 'calculations/Dice';

// Range of enemy toughnesses
export const toughnesses = [3, 4, 5, 6, 7, 8];

export const AutoWound = {
  ALWAYS: "ALWAYS",
  TOUGHNESS_GT_STRENGTH: "TOUGHNESS_GT_STRENGTH",
  NONE: "NONE",
};

/**
 * Translates strength/toughness to required wound roll
 *
 * @return the required roll needed to wound base on the strength/toughness of models
 */
export const neededRollToWound = (strength, toughness) => {
  const ratio = strength / toughness;
  switch(true) {
    case (ratio >= 2): // str twice or more
      return 2;
      break;
    case (ratio > 1): // str greater than
      return 3;
      break;
    case (ratio === 1): // str equal
      return 4;
      break;
    case (ratio > 0.5): // str less than
      return 5;
      break;
    case (ratio <= 0.5): // str half or less
      return 6;
      break;
  }
}

/**
 * Class for calculating average wounds.
 * Taking into account modifiers, rerolls and triggers
 */
export default class WoundCalculator {

  constructor(builder) {
    this.hits = builder.hits;
    this.strength = builder.strength;
    this.rerollOn = builder.rerollOn;
    this.woundModifier = builder.woundModifier;
    this.autoWoundCondition = builder.autoWoundCondition;
    this.autoWoundOn = builder.autoWoundOn;
    this.minTriggerValue = builder.minTriggerValue;
    this.apModifierOnTrigger = builder.apModifierOnTrigger;
    this.damageReplacementOnTrigger = builder.damageReplacementOnTrigger;
    this.extraMortalsOnTrigger = builder.extraMortalsOnTrigger;
  }

  /**
   * Get the array of unmodified required rolls needed to wound
   *
   * @return array of unmodified required rolls needed to wound
   */
  getUnmodifiedWoundsOn() {
    return toughnesses.map((toughness, i) => {
      const unmodifiedWoundOn = neededRollToWound(this.strength, toughness);
      switch (this.autoWoundCondition) {
        case AutoWound.ALWAYS:
          return this.autoWoundOn;
        case AutoWound.TOUGHNESS_GT_STRENGTH:
          return toughnesses[i] > this.strength ? this.autoWoundOn : unmodifiedWoundOn;
        case AutoWound.NONE:
          return unmodifiedWoundOn;
        default:
          throw Error('Unknown AutoWound Type, ' + this.autoWoundCondition);
      }
    });
  }

  /**
   * Get the array of modified required rolls needed to wound using the wound modifier
   *
   * @return array of modified required rolls needed to wound using the wound modifier
   */
  getModifiedWoundsOn() {
    return this.getUnmodifiedWoundsOn().map((unmodifiedVal, i) => {
      const modifiedWoundOn = Math.max(2, modifyMinRequiredRoll(unmodifiedVal, this.woundModifier));
      switch (this.autoWoundCondition) {
        case AutoWound.ALWAYS:
          return this.autoWoundOn;
        case AutoWound.TOUGHNESS_GT_STRENGTH:
          return toughnesses[i] > this.strength ? this.autoWoundOn : modifiedWoundOn;
        case AutoWound.NONE:
          return modifiedWoundOn;
        default:
          throw Error('Unknown AutoWound Type, ' + this.autoWoundCondition);
      }
    });
  }

  /**
   * Get the array of probabilities to wound
   *
   * @return array of probabilities to wound
   */
  getWoundChances() {
    return this.getModifiedWoundsOn().map(modifiedVal => interpolateD6(modifiedVal));
  }

  /**
   * Get the array of average wounds on initial roll
   *
   * @return array of average wounds on initial roll
   */
  getRawWounds() {
    return this.getWoundChances().map(woundChance => woundChance * this.hits);
  }

  /**
   * Get the array of modified required reroll values
   * Accounts for wound modifier and prevents rerolls of dice already considered wounds.
   *
   * @return array of modified required reroll values
   */
  getModifiedRerollMaxValues() {
    let rerollMaxValue;
    switch(this.rerollOn) {
      case RerollType.ALL:
        // Prevents overlap when hit modifying positive
        rerollMaxValue = this.getModifiedWoundsOn()
          .map((w, i) => Math.min(w, this.getUnmodifiedWoundsOn()[i]) - 1);
        break;
      case RerollType.ONES:
        rerollMaxValue = this.getModifiedWoundsOn().map(w => 1);
        break;
      case RerollType.NONE:
        rerollMaxValue = this.getModifiedWoundsOn().map(w => 0);
        break;
      default:
        throw Error('Unknown RerollType, ' + this.rerollOn);
    }
    return rerollMaxValue;
  }

  /**
   * Get the array of average wounds on the reroll
   *
   * @return array of average wounds on the reroll
   */
  getRerollWounds() {
    return this.getModifiedRerollMaxValues()
      .map((rerollChance, i) => (rerollChance / 6) * this.getRawWounds()[i]);
  }

  /**
   * Get the total quantity of rolls made during wounding phase, including rerolls
   *
   * @return array of the total rolls made during the wounding phase
   */
  getTotalWoundRolls() {
    return this.getModifiedRerollMaxValues().map(reroll => this.hits * ((reroll / 6) + 1));
  }

  /**
   * Gets the modified dice roll required to trigger
   *
   * @return the modified dice roll required to trigger
   */
  getModifiedTriggerValue() {
    return modifyMinRequiredRoll(this.minTriggerValue, this.woundModifier);
  }

  /**
   * Gets the average amount of rolls that will activate a trigger
   *
   * @return the average amount of rolls that will activate a trigger
   */
  getTotalTriggers() {
    return this.getTotalWoundRolls().map(totalRolls => totalRolls  * interpolateD6(this.getModifiedTriggerValue()));
  }

  /**
   * Gets the total mortal wounds expected from the wound rolling phase
   *
   * @return the total mortal wounds expected from the wound rolling phase
   */
  getTotalMortalWounds() {
    return this.getTotalTriggers().map(mwTriggers => this.extraMortalsOnTrigger * mwTriggers);
  }

  getTotalModifiedWounds() {
    return this.getTotalTriggers()
      .map((triggers, i) => {
        const hasModifierTriggers = this.apModifierOnTrigger || this.damageReplacementOnTrigger;
        const successfulWounds = this.getRawWounds()[i] + this.getRerollWounds()[i];
        const modifiedWounds = this.getModifiedTriggerValue() >= this.getModifiedWoundsOn()[i] ? triggers : successfulWounds;
        return hasModifierTriggers ? modifiedWounds : 0;
      });
  }

  /**
   * Gets an array of the total average wound rolls made based on enemy toughness
   *
   * @return array of the total average wound rolls made based on enemy toughness
   */
  getTotalNormalWounds() {
    return this.getRawWounds().map((rawWounds, i) => rawWounds
      + this.getRerollWounds()[i]
      - this.getTotalModifiedWounds()[i]);
  }

  /**
   * Builder for creating a WoundCalculator
   */
  static get Builder() {

    class Builder {

      constructor() {
        this.hits;
        this.strength;
        this.rerollOn = 0;
        this.woundModifier = 0; // Default no modifier
        this.autoWoundCondition;
        this.autoWoundOn;
        this.minTriggerValue = 0; // Default no trigger
        this.apModifierOnTrigger;
        this.damageReplacementOnTrigger;
        this.extraMortalsOnTrigger;
      }

      /**
       * Specifies the number of hits made by the model
       */
      withHits(hits) {
        this.hits = hits;
        return this;
      }

      /**
       * Specifies the required roll to wound
       */
      withStrength(strength) {
        this.strength = strength;
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
       * Specifies the wound modifier for all hits
       */
      withWoundModifier(woundModifier) {
        this.woundModifier = woundModifier;
        return this;
      }

      withAutoWoundCondition(autoWoundCondition) {
        this.autoWoundCondition = autoWoundCondition;
        return this;
      }

      withAutoWoundOn(autoWoundOn) {
         this.autoWoundOn = autoWoundOn;
         return this;
      }

      withMinTriggerValue(minTriggerValue) {
        this.minTriggerValue = minTriggerValue;
        return this;
      }

      withApModifierOnTrigger(apModifierOnTrigger) {
        this.apModifierOnTrigger = apModifierOnTrigger;
        return this;
      }

      withDamageReplacementOnTrigger(damageReplacementOnTrigger) {
        this.damageReplacementOnTrigger = damageReplacementOnTrigger;
        return this;
      }

      withExtraMortalsOnTrigger(extraMortalsOnTrigger) {
        this.extraMortalsOnTrigger = extraMortalsOnTrigger;
        return this;
      }

      build() {
        return new WoundCalculator(this);
      }
    }
    return Builder;
  }

}
