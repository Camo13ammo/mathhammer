
/**
 * Gets the odds of rolling the minRollValue or higher
 * for a dice with a given number of sides
 *
 * @param sidesOfDie
 *    The sides of the dice
 * @param minRollVal
 *    The minimum required value for a successful roll
 * @return the odds of rolling the minRollValue or higher
 */
export const interpolateDie = (sidesOfDie, minRollVal) => {
  if (minRollVal <= 0) {
    throw new Error('Minimum roll value must be >= 1');
  }
  return Math.max(0, (sidesOfDie - (minRollVal - 1)) / sidesOfDie);
};

/**
 * Gets the odds of rolling the minRollValue or higher for a D6
 *
 * @see interpolateDie
 */
export const interpolateD6 = (minRollVal) => {
  return interpolateDie(6, minRollVal);
};

/**
 * Modifies the minimum required dice roll for successful roll
 * Note: This is the opposite of the 40k rules. It is modifying the
 * minimum required dice roll... NOT the value of an individual dice
 *
 * There is no upper limit. The lower limit is 1.
 * @param originalMinRoll
 *    The original minimum required dice roll
 * @param modifier
 * @return the modified minimum required dice roll
 */
export const modifyMinRequiredRoll = (originalMinRoll, modifier) => {
  return Math.max(1, originalMinRoll - modifier);
};

export const RerollType = {
  NONE: 'NONE',
  ONES: 'ONES',
  ALL: 'ALL',
};
