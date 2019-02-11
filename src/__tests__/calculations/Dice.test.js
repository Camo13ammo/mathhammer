import { Chance } from 'chance';

import {interpolateDie, interpolateD6, modifyMinRequiredRoll} from 'calculations/Dice';

describe('Dice', () => {

  const random = new Chance();

  describe('interpolateDie', () => {

    it('interpolates the % chance to get the mimimum required roll or higher', () => {
      expect(interpolateDie(3, 2)).toEqual(2/3);
      expect(interpolateDie(6, 4)).toEqual(0.5);
      expect(interpolateDie(6, 6)).toEqual(1/6);
      expect(interpolateDie(10,6)).toEqual(0.5);
    });

    it('handles minimum required rolls that are higher than sides of die faces', () => {
      const roll = random.integer({min: 2});
      const diceFaces = roll - 1;
      expect(interpolateDie(diceFaces, roll)).toEqual(0);
    });

    it('throws an error when the minimum required roll value is <= 0', () => {
      expect(() => interpolateDie(random.integer({min: 2}), -1)).toThrow();
      expect(() => interpolateDie(random.integer({min: 2}), 0)).toThrow();
    });

  });

  describe('interpolateD6', () => {

    it('is a convenience method to automatically interpolate a D6', () => {
      expect(interpolateD6(1)).toEqual(1);
      expect(interpolateD6(2)).toEqual(5/6);
      expect(interpolateD6(3)).toEqual(4/6);
      expect(interpolateD6(4)).toEqual(3/6);
      expect(interpolateD6(5)).toEqual(2/6);
      expect(interpolateD6(6)).toEqual(1/6);
      expect(interpolateD6(7)).toEqual(0);
    });

  });

  describe('modifyMinRequiredRoll', () => {

    it ('modifies the minimum required dice roll needed for a particular event', () => {
      expect(modifyMinRequiredRoll(4, 1)).toEqual(3);
      expect(modifyMinRequiredRoll(4, 3)).toEqual(1);
      expect(modifyMinRequiredRoll(4, 5)).toEqual(1);
      expect(modifyMinRequiredRoll(4, -1)).toEqual(5);
      expect(modifyMinRequiredRoll(4, -3)).toEqual(7);
    });

  });

});
