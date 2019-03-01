import { interpolateD6, modifyMinRequiredRoll } from 'calculations/Dice';

export default class DamageCalculator {

  constructor(builder) {
    this.hitCalculator = builder.hitCalculator;
    this.woundCalculator = builder.woundCalculator;
    this.damage = builder.damage;
    this.enemySave = builder.enemySave;
    this.baseAp = builder.baseAp;
  }

  getMortalWounds() {
    return this.woundCalculator.getTotalMortalWounds()
      .map(mw => mw + this.hitCalculator.getTotalMortalWounds());
  }

  getUnsavedNormalWounds() {
    return this.woundCalculator.getTotalNormalWounds()
      .map(wounds => wounds * (1 - interpolateD6(modifyMinRequiredRoll(this.enemySave, this.baseAp))));
  }

  getUnsavedModifiedWounds() {
    return this.woundCalculator.getTotalModifiedWounds().map(wounds => {
      return wounds * (1 - interpolateD6(modifyMinRequiredRoll(this.enemySave, this.woundCalculator.apModifierOnTrigger)));
    });
  }

  getTotalDamage() {
    return this.getUnsavedNormalWounds().map((unsavedNormalWounds, i) => {
      const normalDamage = unsavedNormalWounds * this.damage;
      const modifiedDamage = this.getUnsavedModifiedWounds()[i] * this.woundCalculator.damageReplacementOnTrigger;
      return normalDamage + modifiedDamage + this.getMortalWounds()[i];
    });
  }


  static get Builder() {

    class Builder {

      constructor() {
        this.hitCalculator;
        this.woundCalculator;
        this.damage;
        this.enemySave;
        this.baseAp;
      }

      withHitCalculator(hitCalculator) {
        this.hitCalculator = hitCalculator;
        return this;
      }

      withWoundCalculator(woundCalculator) {
        this.woundCalculator = woundCalculator;
        return this;
      }

      withDamage(damage) {
        this.damage = damage;
        return this;
      }

      withEnemySave(enemySave) {
        this.enemySave = enemySave;
        return this;
      }

      withBaseAp(baseAp) {
        this.baseAp = baseAp;
        return this;
      }

      build() {
        return new DamageCalculator(this);
      }
    }
    return Builder;
  }

}
