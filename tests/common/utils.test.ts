import { describe, it, expect } from 'vitest';
import { escapeXml, isValidHex, toHexColor } from '../../src/common/utils.js';

describe('utils', () => {
  describe('escapeXml', () => {
    it('should escape xml special characters', () => {
      expect(escapeXml('<foo & "bar" \'baz\'>')).toBe('&lt;foo &amp; &quot;bar&quot; &apos;baz&apos;&gt;');
    });
  });

  describe('isValidHex', () => {
    it('should validate 6-char hex', () => {
      expect(isValidHex('ff0000')).toBe(true);
      expect(isValidHex('zzz000')).toBe(false);
    });

    it('should validate 8-char hex', () => {
      expect(isValidHex('ff0000ff')).toBe(true);
    });
  });

  describe('toHexColor', () => {
    it('should add # prefix if missing', () => {
      expect(toHexColor('ff0000')).toBe('#ff0000');
    });

    it('should not add # prefix if present', () => {
      expect(toHexColor('#ff0000')).toBe('#ff0000');
    });
  });
});
