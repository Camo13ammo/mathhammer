import { interpolateD6, modifyMinRequiredRoll, RerollType } from 'calculations/Dice';

// Range of enemy toughnesses
export const toughnesses = [3, 4, 5, 6, 7, 8];

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
  }

  /**
   * Get the array of unmodified required rolls needed to wound
   *
   * @return array of unmodified required rolls needed to wound
   */
  getUnmodifiedWoundsOn() {
    return toughnesses.map(toughness => neededRollToWound(this.strength, toughness));
  }

  /**
   * Get the array of modified required rolls needed to wound using the wound modifier
   *
   * @return array of modified required rolls needed to wound using the wound modifier
   */
  getModifiedWoundsOn() {
    return this.getUnmodifiedWoundsOn()
      .map(unmodifiedVal => Math.max(2, modifyMinRequiredRoll(unmodifiedVal, this.woundModifier)));
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
   * Gets an array of the total average wounds made based on enemy toughness
   *
   * @return array of the total average wounds made based on enemy toughness
   */
  getTotalWounds() {
    return toughnesses.map((t, i) => this.getRawWounds()[i]
      + this.getRerollWounds()[i]);
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
       * Specifies the wound modifier for all attacks
       */
      withWoundModifier(woundModifier) {
        this.woundModifier = woundModifier;
        return this;
      }

      build() {
        return new WoundCalculator(this);
      }
    }
    return Builder;
  }

}
