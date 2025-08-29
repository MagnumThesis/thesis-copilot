/**
 * Unit tests for DateFormatter
 */

import { describe, it, expect } from 'vitest';
import { DateFormatter } from '../date-formatter';

describe('DateFormatter', () => {
  const sampleDate = new Date('2023-05-15');
  const accessDate = new Date('2023-12-01');

  describe('formatMLA', () => {
    it('should format date as year only', () => {
      const result = DateFormatter.formatMLA(sampleDate);
      expect(result).toBe('2023');
    });

    it('should return empty string for undefined date', () => {
      const result = DateFormatter.formatMLA(undefined);
      expect(result).toBe('');
    });
  });

  describe('formatChicago', () => {
    it('should format date as year only', () => {
      const result = DateFormatter.formatChicago(sampleDate);
      expect(result).toBe('2023');
    });

    it('should return empty string for undefined date', () => {
      const result = DateFormatter.formatChicago(undefined);
      expect(result).toBe('');
    });
  });

  describe('formatHarvard', () => {
    it('should format date as year only', () => {
      const result = DateFormatter.formatHarvard(sampleDate);
      expect(result).toBe('2023');
    });

    it('should return "n.d." for undefined date', () => {
      const result = DateFormatter.formatHarvard(undefined);
      expect(result).toBe('n.d.');
    });
  });

  describe('formatAPA', () => {
    it('should format date as year only', () => {
      const result = DateFormatter.formatAPA(sampleDate);
      expect(result).toBe('2023');
    });

    it('should return "n.d." for undefined date', () => {
      const result = DateFormatter.formatAPA(undefined);
      expect(result).toBe('n.d.');
    });
  });

  describe('formatAccessDateAPA', () => {
    it('should format access date correctly', () => {
      const result = DateFormatter.formatAccessDateAPA(accessDate);
      expect(result).toBe('Retrieved December 1, 2023');
    });

    it('should return empty string for undefined date', () => {
      const result = DateFormatter.formatAccessDateAPA(undefined);
      expect(result).toBe('');
    });

    it('should handle all months correctly', () => {
      const januaryDate = new Date('2023-01-15');
      const result = DateFormatter.formatAccessDateAPA(januaryDate);
      expect(result).toBe('Retrieved January 15, 2023');
    });
  });

  describe('formatFullDateMLA', () => {
    it('should format full date correctly', () => {
      const result = DateFormatter.formatFullDateMLA(sampleDate);
      expect(result).toBe('15 May 2023');
    });

    it('should return empty string for undefined date', () => {
      const result = DateFormatter.formatFullDateMLA(undefined);
      expect(result).toBe('');
    });

    it('should handle single-digit days', () => {
      const singleDigitDate = new Date('2023-03-05');
      const result = DateFormatter.formatFullDateMLA(singleDigitDate);
      expect(result).toBe('5 Mar. 2023');
    });
  });

  describe('formatFullDateChicago', () => {
    it('should format full date correctly', () => {
      const result = DateFormatter.formatFullDateChicago(sampleDate);
      expect(result).toBe('May 15, 2023');
    });

    it('should return empty string for undefined date', () => {
      const result = DateFormatter.formatFullDateChicago(undefined);
      expect(result).toBe('');
    });

    it('should handle all months correctly', () => {
      const septemberDate = new Date('2023-09-30');
      const result = DateFormatter.formatFullDateChicago(septemberDate);
      expect(result).toBe('September 30, 2023');
    });
  });

  describe('formatFullDateAPA', () => {
    it('should format full date correctly', () => {
      const result = DateFormatter.formatFullDateAPA(sampleDate);
      expect(result).toBe('2023, May 15');
    });

    it('should return empty string for undefined date', () => {
      const result = DateFormatter.formatFullDateAPA(undefined);
      expect(result).toBe('');
    });

    it('should handle different months and days', () => {
      const winterDate = new Date('2023-02-28');
      const result = DateFormatter.formatFullDateAPA(winterDate);
      expect(result).toBe('2023, February 28');
    });
  });

  describe('edge cases', () => {
    it('should handle leap year dates', () => {
      const leapYearDate = new Date('2024-02-29');
      const mlaResult = DateFormatter.formatFullDateMLA(leapYearDate);
      const chicagoResult = DateFormatter.formatFullDateChicago(leapYearDate);
      const apaResult = DateFormatter.formatFullDateAPA(leapYearDate);
      
      expect(mlaResult).toBe('29 Feb. 2024');
      expect(chicagoResult).toBe('February 29, 2024');
      expect(apaResult).toBe('2024, February 29');
    });

    it('should handle end of year dates', () => {
      const newYearEve = new Date('2023-12-31');
      const result = DateFormatter.formatAPA(newYearEve);
      expect(result).toBe('2023');
    });

    it('should handle beginning of year dates', () => {
      const newYearDay = new Date('2023-01-01');
      const result = DateFormatter.formatFullDateMLA(newYearDay);
      expect(result).toBe('1 Jan. 2023');
    });
  });
});
