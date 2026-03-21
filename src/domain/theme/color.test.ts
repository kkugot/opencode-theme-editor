import { describe, expect, it } from 'vitest'
import {
  areColorValuesEqual,
  colorToHsl,
  compositeColors,
  darken,
  getColorInputValue,
  getColorLightness,
  getContrastRatio,
  hasTransparency,
  hslToColor,
  hueDistance,
  isColorValue,
  lighten,
  mixColors,
  normalizeColorValue,
  parseColor,
  relativeLuminance,
  serializeColor,
} from './color'

describe('color helpers', () => {
  it('normalizes supported color literals', () => {
    expect(normalizeColorValue(' #AbC ')).toBe('#aabbcc')
    expect(normalizeColorValue('#abcd')).toBe('#aabbccdd')
    expect(normalizeColorValue('#ABCDEF')).toBe('#abcdef')
    expect(normalizeColorValue('none')).toBe('transparent')
    expect(normalizeColorValue('transparent')).toBe('transparent')
    expect(normalizeColorValue('rgb(1, 2, 3)')).toBeNull()
    expect(isColorValue('#123456')).toBe(true)
    expect(isColorValue('oops')).toBe(false)
  })

  it('parses and serializes opaque, alpha, and transparent colors', () => {
    expect(parseColor('#010203')).toEqual({
      r: 1,
      g: 2,
      b: 3,
      a: 1,
    })
    expect(parseColor('#01020380')).toEqual({
      r: 1,
      g: 2,
      b: 3,
      a: 128 / 255,
    })
    expect(parseColor('transparent')).toEqual({
      r: 0,
      g: 0,
      b: 0,
      a: 0,
    })
    expect(parseColor('invalid')).toBeNull()

    expect(
      serializeColor({
        r: 255.4,
        g: -2,
        b: 16.7,
        a: 1.2,
      }),
    ).toBe('#ff0011')
    expect(
      serializeColor({
        r: 12,
        g: 34,
        b: 56,
        a: 0.5,
      }),
    ).toBe('#0c223880')
    expect(
      serializeColor({
        r: 12,
        g: 34,
        b: 56,
        a: -1,
      }),
    ).toBe('transparent')
  })

  it('mixes, lightens, and darkens colors with current fallback behavior', () => {
    expect(mixColors('#ff0000', '#0000ff', 0.5)).toBe('#800080')
    expect(mixColors('transparent', 'transparent', 0.5)).toBe('transparent')
    expect(mixColors('invalid', '#0000ff', 0.5)).toBe('#000000')

    expect(lighten('#000000', 0.5)).toBe('#808080')
    expect(lighten('transparent', 0.5)).toBe('transparent')
    expect(lighten('invalid', 0.5)).toBe('#000000')

    expect(darken('#ffffff', 0.5)).toBe('#808080')
    expect(darken('transparent', 0.5)).toBe('transparent')
    expect(darken('invalid', 0.5)).toBe('#000000')
  })

  it('normalizes equality and color input helpers', () => {
    expect(areColorValuesEqual('#abc', '#aabbcc')).toBe(true)
    expect(areColorValuesEqual('transparent', 'none')).toBe(true)
    expect(areColorValuesEqual('#abc', '#000000')).toBe(false)

    expect(getColorInputValue('#12345680')).toBe('#123456')
    expect(getColorInputValue('invalid')).toBe('#000000')
    expect(hasTransparency('#12345680')).toBe(true)
    expect(hasTransparency('#123456')).toBe(false)
  })

  it('composites colors and computes luminance and contrast', () => {
    expect(compositeColors('transparent', '#123456')).toBe('#123456')
    expect(compositeColors('#ff000080', '#0000ff')).toBe('#80007f')
    expect(compositeColors('invalid', '#0000ff')).toBe('#000000')

    expect(relativeLuminance('#000000')).toBe(0)
    expect(relativeLuminance('#ffffff')).toBe(1)
    expect(relativeLuminance('invalid')).toBeNull()

    expect(getContrastRatio('#000000', '#ffffff')).toBe(21)
    expect(getContrastRatio('transparent', '#ffffff')).toBe(1)
  })

  it('computes color lightness', () => {
    expect(getColorLightness('#000000')).toBe(0)
    expect(getColorLightness('#ffffff')).toBe(1)
    expect(getColorLightness('#ff0000')).toBe(0.5)
    expect(getColorLightness('invalid')).toBeNull()
  })

  it('converts between RGB and HSL', () => {
    expect(colorToHsl('#ff0000')).toEqual({
      h: 0,
      s: 1,
      l: 0.5,
      a: 1,
    })
    expect(colorToHsl('#80808080')).toEqual({
      h: 0,
      s: 0,
      l: 128 / 255,
      a: 128 / 255,
    })
    expect(colorToHsl('invalid')).toBeNull()

    expect(hslToColor(0, 1, 0.5)).toBe('#ff0000')
    expect(hslToColor(360, 1, 0.5)).toBe('#ff0000')
    expect(hslToColor(120, 0, 0.5, 0.5)).toBe('#80808080')
  })

  it('measures hue distance across the wraparound boundary', () => {
    expect(hueDistance(10, 350)).toBe(20)
    expect(hueDistance(45, 225)).toBe(180)
    expect(hueDistance(30, 60)).toBe(30)
  })
})
