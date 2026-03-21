import { clampChannel, parseColor } from './colorCore'
import { compositeColors } from './colorTransforms'

export function relativeLuminance(value: string) {
  const color = parseColor(value)

  if (!color) {
    return null
  }

  const toLinear = (channel: number) => {
    const normalized = clampChannel(channel) / 255

    return normalized <= 0.03928
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4
  }

  return 0.2126 * toLinear(color.r) + 0.7152 * toLinear(color.g) + 0.0722 * toLinear(color.b)
}

export function getContrastRatio(foreground: string, background: string, backdrop = '#ffffff') {
  const resolvedBackground = compositeColors(background, backdrop)
  const resolvedForeground = compositeColors(foreground, resolvedBackground)
  const foregroundLuminance = relativeLuminance(resolvedForeground)
  const backgroundLuminance = relativeLuminance(resolvedBackground)

  if (foregroundLuminance === null || backgroundLuminance === null) {
    return 1
  }

  const lighter = Math.max(foregroundLuminance, backgroundLuminance)
  const darker = Math.min(foregroundLuminance, backgroundLuminance)

  return (lighter + 0.05) / (darker + 0.05)
}

export function getColorLightness(value: string) {
  const color = parseColor(value)

  if (!color) {
    return null
  }

  const red = color.r / 255
  const green = color.g / 255
  const blue = color.b / 255
  const max = Math.max(red, green, blue)
  const min = Math.min(red, green, blue)

  return (max + min) / 2
}
