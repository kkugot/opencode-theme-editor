import { colorToHsl, hueDistance, normalizeColorValue } from '../theme/color'

type PaletteNameInput = {
  palette: string[]
  tags?: string[]
  metaLabel?: string
  fallbackId?: string
}

const NEUTRAL_WORDS = {
  pale: ['Alabaster', 'Pearl', 'Linen', 'Ivory', 'Chalk'],
  muted: ['Dune', 'Stone', 'Taupe', 'Drift', 'Clay'],
  deep: ['Slate', 'Graphite', 'Onyx', 'Coal', 'Shadow'],
} as const

const HUE_WORDS = {
  red: {
    pale: ['Shell', 'Petal', 'Rosewater', 'Blush'],
    mid: ['Rose', 'Coral', 'Ruby', 'Scarlet'],
    deep: ['Crimson', 'Garnet', 'Ember', 'Mulberry'],
  },
  orange: {
    pale: ['Peach', 'Apricot', 'Mango', 'Cantaloupe'],
    mid: ['Amber', 'Copper', 'Cider', 'Tangerine'],
    deep: ['Rust', 'Sienna', 'Paprika', 'Cinder'],
  },
  yellow: {
    pale: ['Butter', 'Flax', 'Vanilla', 'Lemon'],
    mid: ['Honey', 'Gold', 'Citrine', 'Saffron'],
    deep: ['Ochre', 'Harvest', 'Bronze', 'Spice'],
  },
  green: {
    pale: ['Mint', 'Celery', 'Sage', 'Moss'],
    mid: ['Fern', 'Jade', 'Olive', 'Clover'],
    deep: ['Forest', 'Pine', 'Basil', 'Myrtle'],
  },
  cyan: {
    pale: ['Mist', 'Seafoam', 'Frost', 'Spray'],
    mid: ['Aqua', 'Teal', 'Lagoon', 'Glacier'],
    deep: ['Harbor', 'Reef', 'Cove', 'Tide'],
  },
  blue: {
    pale: ['Powder', 'Sky', 'Rain', 'Cirrus'],
    mid: ['Azure', 'Cobalt', 'Cerulean', 'Denim'],
    deep: ['Indigo', 'Navy', 'Storm', 'Midnight'],
  },
  purple: {
    pale: ['Lilac', 'Orchid', 'Wisteria', 'Iris'],
    mid: ['Violet', 'Amethyst', 'Plum', 'Heather'],
    deep: ['Velvet', 'Nocturne', 'Mulberry', 'Aubergine'],
  },
  pink: {
    pale: ['Peony', 'Bloom', 'Petal', 'Ballet'],
    mid: ['Fuchsia', 'Camellia', 'Flamingo', 'Rosette'],
    deep: ['Berry', 'Magenta', 'Cherry', 'Dahlia'],
  },
} as const

const PHYSICAL_NEUTRAL_WORDS = {
  pale: ['Porcelain', 'Pearl', 'Marble', 'Silk', 'Frost'],
  muted: ['Stone', 'Driftwood', 'Canvas', 'Sand', 'Ash'],
  deep: ['Metal', 'Steel', 'Iron', 'Obsidian', 'Slate'],
} as const

const PHYSICAL_HUE_WORDS = {
  red: ['Brick', 'Copper', 'Cinder', 'Mahogany', 'Clay'],
  orange: ['Amber', 'Copper', 'Cedar', 'Terracotta', 'Dune'],
  yellow: ['Brass', 'Pollen', 'Wheat', 'Honey', 'Sunstone'],
  green: ['Moss', 'Fern', 'Lichen', 'Canopy', 'Pine'],
  cyan: ['Rain', 'Seafoam', 'Glass', 'Lagoon', 'Spray'],
  blue: ['Ocean', 'Rain', 'Harbor', 'Tide', 'Steel'],
  purple: ['Velvet', 'Smoke', 'Ink', 'Amethyst', 'Twilight'],
  pink: ['Petal', 'Quartz', 'Shell', 'Bloom', 'Rosewater'],
} as const

const CATEGORY_WORDS = {
  pastel: ['Petal', 'Whisper', 'Bloom', 'Cloud', 'Powder', 'Ribbon', 'Dew'],
  vintage: ['Patina', 'Heirloom', 'Parlor', 'Sepia', 'Relic', 'Brass', 'Velvet'],
  retro: ['Arcade', 'Cassette', 'Disco', 'Vinyl', 'Replay', 'Chrome', 'Neon'],
  neon: ['Pulse', 'Glow', 'Voltage', 'Flash', 'Vapor', 'Laser', 'Prism'],
  gold: ['Crown', 'Treasure', 'Gild', 'Halo', 'Aureate', 'Brass', 'Sunstone'],
  light: ['Dawn', 'Halo', 'Breeze', 'Gleam', 'Lilt', 'Rain', 'Pearl'],
  dark: ['Midnight', 'Nocturne', 'Shade', 'Eclipse', 'Velvet', 'Metal', 'Smoke'],
  warm: ['Ember', 'Hearth', 'Glow', 'Spice', 'Solstice', 'Copper', 'Dune'],
  cold: ['Frost', 'Glacier', 'Boreal', 'Tundra', 'Rime', 'Rain', 'Steel'],
  summer: ['Lagoon', 'Canopy', 'Drift', 'Solstice', 'Harbor', 'Citrus', 'Spray'],
  fall: ['Harvest', 'Maple', 'Russet', 'Cider', 'Orchard', 'Copper', 'Loam'],
  winter: ['Aurora', 'Fir', 'Flurry', 'Frost', 'Snowdrop', 'Ice', 'Pine'],
  spring: ['Blossom', 'Meadow', 'Dew', 'Sprout', 'Petal', 'Rain', 'Grove'],
  happy: ['Jubilee', 'Spark', 'Confetti', 'Picnic', 'Smile', 'Carnival', 'Ribbon'],
  nature: ['Grove', 'Fern', 'Meadow', 'Canopy', 'Thicket', 'River', 'Moss'],
  earth: ['Canyon', 'Dune', 'Clay', 'Mesa', 'Loam', 'Stone', 'Terracotta'],
  night: ['Moon', 'Comet', 'Shadow', 'Nebula', 'Nocturne', 'Rain', 'Ember'],
  space: ['Nebula', 'Orbit', 'Quasar', 'Nova', 'Comet', 'Meteor', 'Void'],
  rainbow: ['Prism', 'Spectrum', 'Arc', 'Ribbon', 'Carnival', 'Aurora', 'Glass'],
  gradient: ['Drift', 'Cascade', 'Blend', 'Fade', 'Ribbon', 'Wash', 'Current'],
  sunset: ['Dusk', 'Afterglow', 'Sundown', 'Horizon', 'Ember', 'Copper', 'Cinder'],
  sky: ['Zenith', 'Cirrus', 'Skyline', 'Aerial', 'Cloud', 'Rain', 'Horizon'],
  sea: ['Tide', 'Lagoon', 'Current', 'Harbor', 'Reef', 'Ocean', 'Rain'],
  kids: ['Toybox', 'Story', 'Playroom', 'Marble', 'Confetti', 'Balloon', 'Carousel'],
  skin: ['Bare', 'Aura', 'Velour', 'Silk', 'Bloom', 'Rosewater', 'Linen'],
  food: ['Feast', 'Spice', 'Cocoa', 'Citrus', 'Biscuit', 'Honey', 'Roast'],
  cream: ['Custard', 'Velvet', 'Butter', 'Linen', 'Truffle', 'Pearl', 'Porcelain'],
  coffee: ['Roast', 'Mocha', 'Crema', 'Bean', 'Brew', 'Espresso', 'Cedar'],
  wedding: ['Vow', 'Veil', 'Bouquet', 'Lace', 'Toast', 'Pearl', 'Rose'],
  christmas: ['Holly', 'Yuletide', 'Candle', 'Ribbon', 'Fir', 'Berry', 'Pine'],
  halloween: ['Hex', 'Lantern', 'Phantom', 'Cinder', 'Pumpkin', 'Smoke', 'Ember'],
} as const satisfies Record<string, readonly string[]>

const ATMOSPHERE_WORDS = {
  light: ['Dawn', 'Halo', 'Breeze', 'Glow', 'Rain', 'Mist'],
  balanced: ['Drift', 'Studio', 'Field', 'Current', 'Harbor', 'Meadow'],
  dark: ['Nocturne', 'Ember', 'Velvet', 'Shadow', 'Smoke', 'Storm'],
} as const

function hashString(value: string) {
  let hash = 2166136261

  for (const character of value) {
    hash ^= character.charCodeAt(0)
    hash = Math.imul(hash, 16777619)
  }

  return hash >>> 0
}

function pickDeterministically(words: readonly string[], seed: number, offset = 0) {
  return words[(seed + offset) % words.length] ?? words[0] ?? 'Theme'
}

function normalizeTag(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, '-')
    .replace(/^-+|-+$/gu, '')
}

function getColorToneBucket(lightness: number) {
  if (lightness >= 0.78) {
    return 'pale'
  }

  if (lightness <= 0.32) {
    return 'deep'
  }

  return 'mid'
}

function getHueFamily(hue: number) {
  if (hue >= 345 || hue < 18) {
    return 'red'
  }

  if (hue < 45) {
    return 'orange'
  }

  if (hue < 68) {
    return 'yellow'
  }

  if (hue < 165) {
    return 'green'
  }

  if (hue < 200) {
    return 'cyan'
  }

  if (hue < 255) {
    return 'blue'
  }

  if (hue < 315) {
    return 'purple'
  }

  return 'pink'
}

function getPaletteTokens(palette: string[]) {
  return palette
    .map((color) => {
      const normalized = normalizeColorValue(color)
      const hsl = normalized ? colorToHsl(normalized) : null

      if (!normalized || !hsl) {
        return null
      }

      return {
        color: normalized,
        hsl,
      }
    })
    .filter((token): token is { color: string; hsl: NonNullable<ReturnType<typeof colorToHsl>> } => token !== null)
}

function getColorWord(color: string, seed: number, offset = 0) {
  const hsl = colorToHsl(color)

  if (!hsl) {
    return pickDeterministically(ATMOSPHERE_WORDS.balanced, seed, offset)
  }

  if (hsl.s < 0.14) {
    const tone = hsl.l >= 0.78 ? 'pale' : hsl.l <= 0.32 ? 'deep' : 'muted'
    return pickDeterministically(NEUTRAL_WORDS[tone], seed, offset)
  }

  const family = getHueFamily(hsl.h)
  const tone = getColorToneBucket(hsl.l)

  return pickDeterministically(HUE_WORDS[family][tone], seed, offset)
}

function getPhysicalWord(color: string, seed: number, offset = 0) {
  const hsl = colorToHsl(color)

  if (!hsl) {
    return pickDeterministically(ATMOSPHERE_WORDS.balanced, seed, offset)
  }

  if (hsl.s < 0.14) {
    const tone = hsl.l >= 0.78 ? 'pale' : hsl.l <= 0.32 ? 'deep' : 'muted'
    return pickDeterministically(PHYSICAL_NEUTRAL_WORDS[tone], seed, offset)
  }

  return pickDeterministically(PHYSICAL_HUE_WORDS[getHueFamily(hsl.h)], seed, offset)
}

function getPaletteKeyColors(palette: string[]) {
  const tokens = getPaletteTokens(palette)

  if (tokens.length === 0) {
    return {
      primary: '#5f8bff',
      secondary: '#f4d58d',
      averageLightness: 0.5,
    }
  }

  const averageLightness = tokens.reduce((sum, token) => sum + token.hsl.l, 0) / tokens.length
  const primary = [...tokens].sort((left, right) => {
    const leftScore = left.hsl.s * 1.8 + (1 - Math.abs(left.hsl.l - 0.56)) * 0.28
    const rightScore = right.hsl.s * 1.8 + (1 - Math.abs(right.hsl.l - 0.56)) * 0.28

    return rightScore - leftScore
  })[0]

  const secondary = [...tokens]
    .filter((token) => token.color !== primary.color)
    .sort((left, right) => {
      const leftScore =
        hueDistance(left.hsl.h, primary.hsl.h) * 0.018 +
        Math.abs(left.hsl.l - primary.hsl.l) * 0.7 +
        left.hsl.s * 0.35
      const rightScore =
        hueDistance(right.hsl.h, primary.hsl.h) * 0.018 +
        Math.abs(right.hsl.l - primary.hsl.l) * 0.7 +
        right.hsl.s * 0.35

      return rightScore - leftScore
    })[0] ?? [...tokens].sort((left, right) => Math.abs(right.hsl.l - primary.hsl.l) - Math.abs(left.hsl.l - primary.hsl.l))[0] ?? primary

  return {
    primary: primary.color,
    secondary: secondary.color,
    averageLightness,
  }
}

function getCategoryKey(tags?: string[], metaLabel?: string) {
  const tagCandidates = [...(tags ?? []), ...(metaLabel ? [metaLabel] : [])]

  for (const candidate of tagCandidates) {
    const normalized = normalizeTag(candidate)

    if (normalized && normalized in CATEGORY_WORDS) {
      return normalized as keyof typeof CATEGORY_WORDS
    }
  }

  return null
}

export function buildGeneratedPaletteThemeName({ palette, tags, metaLabel, fallbackId }: PaletteNameInput) {
  const normalizedPalette = palette.map((color) => normalizeColorValue(color)).filter((color): color is string => color !== null)
  const seed = hashString([fallbackId ?? '', metaLabel ?? '', ...(tags ?? []), ...normalizedPalette].join('|'))
  const { primary, secondary, averageLightness } = getPaletteKeyColors(normalizedPalette)
  const categoryKey = getCategoryKey(tags, metaLabel)
  const primaryWord = getColorWord(primary, seed)
  let secondaryWord = getColorWord(secondary, seed, 5)
  let physicalWord = getPhysicalWord(secondary, seed, 9)

  if (secondaryWord === primaryWord) {
    secondaryWord = getColorWord(secondary, seed, 11)
  }

  if (physicalWord === primaryWord || physicalWord === secondaryWord) {
    physicalWord = getPhysicalWord(primary, seed, 13)
  }

  const atmosphereBucket = averageLightness >= 0.76 ? 'light' : averageLightness <= 0.34 ? 'dark' : 'balanced'
  const atmosphereWord = pickDeterministically(ATMOSPHERE_WORDS[atmosphereBucket], seed, 7)

  const candidatePairs = [
    [primaryWord, physicalWord],
    categoryKey ? [primaryWord, pickDeterministically(CATEGORY_WORDS[categoryKey], seed, 3)] : null,
    categoryKey ? [pickDeterministically(CATEGORY_WORDS[categoryKey], seed, 3), physicalWord] : null,
    [secondaryWord, physicalWord],
    [primaryWord, atmosphereWord],
  ]
  const rotation = seed % candidatePairs.length

  for (let index = 0; index < candidatePairs.length; index += 1) {
    const pair = candidatePairs[(index + rotation) % candidatePairs.length]

    if (!pair) {
      continue
    }

    const [first, second] = pair

    if (first && second && first.toLowerCase() !== second.toLowerCase()) {
      return `${first} ${second}`
    }
  }

  if (secondaryWord && secondaryWord !== primaryWord) {
    return `${primaryWord} ${secondaryWord}`
  }

  return `${primaryWord} ${atmosphereWord}`
}
