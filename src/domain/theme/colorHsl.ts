import { clampAlpha, parseColor, serializeColor } from './colorCore'

export function colorToHsl(value: string) {
  const color = parseColor(value)

  if (!color) {
    return null
  }

  const red = color.r / 255
  const green = color.g / 255
  const blue = color.b / 255
  const max = Math.max(red, green, blue)
  const min = Math.min(red, green, blue)
  const delta = max - min
  const lightness = (max + min) / 2

  if (delta === 0) {
    return {
      h: 0,
      s: 0,
      l: lightness,
      a: color.a,
    }
  }

  const saturation = delta / (1 - Math.abs(2 * lightness - 1))
  let hue = 0

  if (max === red) {
    hue = ((green - blue) / delta) % 6
  } else if (max === green) {
    hue = (blue - red) / delta + 2
  } else {
    hue = (red - green) / delta + 4
  }

  return {
    h: (hue * 60 + 360) % 360,
    s: saturation,
    l: lightness,
    a: color.a,
  }
}

function hueToRgb(p: number, q: number, t: number) {
  let next = t

  if (next < 0) {
    next += 1
  }

  if (next > 1) {
    next -= 1
  }

  if (next < 1 / 6) {
    return p + (q - p) * 6 * next
  }

  if (next < 1 / 2) {
    return q
  }

  if (next < 2 / 3) {
    return p + (q - p) * (2 / 3 - next) * 6
  }

  return p
}

export function hslToColor(hue: number, saturation: number, lightness: number, alpha = 1) {
  const normalizedHue = ((hue % 360) + 360) % 360
  const normalizedSaturation = clampAlpha(saturation)
  const normalizedLightness = clampAlpha(lightness)

  if (normalizedSaturation === 0) {
    const channel = normalizedLightness * 255

    return serializeColor({
      r: channel,
      g: channel,
      b: channel,
      a: alpha,
    })
  }

  const q =
    normalizedLightness < 0.5
      ? normalizedLightness * (1 + normalizedSaturation)
      : normalizedLightness + normalizedSaturation - normalizedLightness * normalizedSaturation
  const p = 2 * normalizedLightness - q
  const hueFraction = normalizedHue / 360

  return serializeColor({
    r: hueToRgb(p, q, hueFraction + 1 / 3) * 255,
    g: hueToRgb(p, q, hueFraction) * 255,
    b: hueToRgb(p, q, hueFraction - 1 / 3) * 255,
    a: alpha,
  })
}

export function hueDistance(leftHue: number, rightHue: number) {
  const distance = Math.abs(leftHue - rightHue) % 360
  return distance > 180 ? 360 - distance : distance
}
