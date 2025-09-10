import { testUtilFunction, calculateSum } from '../testUtils';

describe('testUtils', () => {
  describe('testUtilFunction', () => {
    it('should process input string correctly', () => {
      const result = testUtilFunction('Hello');
      expect(result).toBe('Processed: Hello');
    });

    it('should handle empty string', () => {
      const result = testUtilFunction('');
      expect(result).toBe('Processed: ');
    });
  });

  describe('calculateSum', () => {
    it('should add two positive numbers', () => {
      expect(calculateSum(2, 3)).toBe(5);
    });

    it('should add negative numbers', () => {
      expect(calculateSum(-2, -3)).toBe(-5);
    });

    it('should add zero', () => {
      expect(calculateSum(5, 0)).toBe(5);
    });
  });
});
