import { parseColor, serializeColor } from './colorCore'

function mixChannel(source: number, target: number, amount: number) {
  return source + (target - source) * amount
}

export function mixColors(source: string, target: string, amount: number) {
  const sourceColor = parseColor(source)
  const targetColor = parseColor(target)

  if (!sourceColor || !targetColor) {
    return '#000000'
  }

  if (sourceColor.a === 0 && targetColor.a === 0) {
    return 'transparent'
  }

  return serializeColor({
    r: mixChannel(sourceColor.r, targetColor.r, amount),
    g: mixChannel(sourceColor.g, targetColor.g, amount),
    b: mixChannel(sourceColor.b, targetColor.b, amount),
    a: mixChannel(sourceColor.a, targetColor.a, amount),
  })
}

export function lighten(value: string, amount: number) {
  const color = parseColor(value)

  if (!color) {
    return '#000000'
  }

  if (color.a === 0) {
    return 'transparent'
  }

  return serializeColor({
    ...color,
    r: mixChannel(color.r, 255, amount),
    g: mixChannel(color.g, 255, amount),
    b: mixChannel(color.b, 255, amount),
  })
}

export function darken(value: string, amount: number) {
  const color = parseColor(value)

  if (!color) {
    return '#000000'
  }

  if (color.a === 0) {
    return 'transparent'
  }

  return serializeColor({
    ...color,
    r: mixChannel(color.r, 0, amount),
    g: mixChannel(color.g, 0, amount),
    b: mixChannel(color.b, 0, amount),
  })
}

export function compositeColors(foreground: string, background: string) {
  const foregroundColor = parseColor(foreground)
  const backgroundColor = parseColor(background)

  if (!foregroundColor || !backgroundColor) {
    return '#000000'
  }

  if (foregroundColor.a <= 0) {
    return serializeColor(backgroundColor)
  }

  if (foregroundColor.a >= 1 || backgroundColor.a <= 0) {
    return serializeColor(foregroundColor)
  }

  const alpha = foregroundColor.a + backgroundColor.a * (1 - foregroundColor.a)

  if (alpha <= 0) {
    return 'transparent'
  }

  return serializeColor({
    r: (foregroundColor.r * foregroundColor.a + backgroundColor.r * backgroundColor.a * (1 - foregroundColor.a)) / alpha,
    g: (foregroundColor.g * foregroundColor.a + backgroundColor.g * backgroundColor.a * (1 - foregroundColor.a)) / alpha,
    b: (foregroundColor.b * foregroundColor.a + backgroundColor.b * backgroundColor.a * (1 - foregroundColor.a)) / alpha,
    a: alpha,
  })
}
