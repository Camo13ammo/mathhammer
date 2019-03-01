import { interpolateD6, modifyMinRequiredRoll } from 'calculations/Dice';

/**
 * Class for calculating average damage.
 * Taking into account hits, wounds, ap, damage and enemy save
 */
export default class DamageCalculator {

  constructor(builder) {
    this.hitCalculator = builder.hitCalculator;
    this.woundCalculator = builder.woundCalculator;
    this.damage = builder.damage;
    this.enemySave = builder.enemySave;
    this.baseAp = builder.baseAp;
  }

  /**
   * Gets the total mortal wounds based on the enemies toughness
   *
   * @return the total expected mortal wounds based on the enemies toughness
   */
  getMortalWounds() {
    return this.woundCalculator.getTotalMortalWounds()
      .map(mw => mw + this.hitCalculator.getTotalMortalWounds());
  }

  /**
   * Gets the total unsaved normal wounds based on the enemies toughness
   *
   * @return the total expected unsaved normal wounds based on the enemies toughness
   */
  getUnsavedNormalWounds() {
    return this.woundCalculator.getTotalNormalWounds()
      .map(wounds => wounds * (1 - interpolateD6(modifyMinRequiredRoll(this.enemySave, this.baseAp))));
  }

  /**
   * Gets the total unsaved modified wounds based on the enemies toughness
   *
   * @return the total expected unsaved modified wounds based on the enemies toughness
   */
  getUnsavedModifiedWounds() {
    return this.woundCalculator.getTotalModifiedWounds().map(wounds => {
      return wounds * (1 - interpolateD6(modifyMinRequiredRoll(this.enemySave, this.woundCalculator.apModifierOnTrigger)));
    });
  }

  /**
   * Gets the total damage based on the enemies toughness
   *
   * @return the total damage wounds based on the enemies toughness
   */
  getTotalDamage() {
    return this.getUnsavedNormalWounds().map((unsavedNormalWounds, i) => {
      const normalDamage = unsavedNormalWounds * this.damage;
      const modifiedDamage = this.getUnsavedModifiedWounds()[i] * this.woundCalculator.damageReplacementOnTrigger;
      return normalDamage + modifiedDamage + this.getMortalWounds()[i];
    });
  }

  /**
   * Builder for creating a WoundCalculator
   */
  static get Builder() {

    class Builder {

      constructor() {
        this.hitCalculator;
        this.woundCalculator;
        this.damage;
        this.enemySave;
        this.baseAp;
      }

      /**
       * Specifies the hit calculator for the model
       * @return this
       */
      withHitCalculator(hitCalculator) {
        this.hitCalculator = hitCalculator;
        return this;
      }

      /**
       * Specifies the wound calculator for the model
       * @return this
       */
      withWoundCalculator(woundCalculator) {
        this.woundCalculator = woundCalculator;
        return this;
      }

      /**
       * Specifies the normal damage of the model's weapon
       * @return this
       */
      withDamage(damage) {
        this.damage = damage;
        return this;
      }

      /**
       * Specifies enemies save value
       * @return this
       */
      withEnemySave(enemySave) {
        this.enemySave = enemySave;
        return this;
      }

      /**
       * Specifies the baseAp of the model
       * @return this
       */
      withBaseAp(baseAp) {
        this.baseAp = baseAp;
        return this;
      }

      /**
       * Builds the DamageCalculator based on the builder properties
       * @return DamageCalculator
       */
      build() {
        return new DamageCalculator(this);
      }
    }

    return Builder;
  }

}
