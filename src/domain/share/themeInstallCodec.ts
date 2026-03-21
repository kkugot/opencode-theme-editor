import { exportCombinedThemeFile, type OpenCodeCombinedThemeFile } from '../opencode/exportTheme'
import { serializeColor, normalizeColorValue, parseColor } from '../theme/color'
import type { ThemeTokens } from '../theme/model'
import { THEME_TOKEN_NAMES } from '../theme/model'

const LEGACY_THEME_INSTALL_CODEC_VERSION = 'ot1'
const LEGACY_LENGTH_WIDTH = 5
const LEGACY_CHUNK_BYTES = 3
const LEGACY_CHUNK_WIDTH = 5
const TOKEN_VALUE_COUNT = THEME_TOKEN_NAMES.length * 2

const SCHEMA_URL = 'https://opencode.ai/theme.json'

type LegacyThemeInstallPayload = {
  v: 1
  n: string
  t: OpenCodeCombinedThemeFile['theme']
}

function decodeLegacyBase36ToBytes(encoded: string) {
  if (!encoded.startsWith(LEGACY_THEME_INSTALL_CODEC_VERSION)) {
    throw new Error('Unknown theme install payload version')
  }

  const body = encoded.slice(LEGACY_THEME_INSTALL_CODEC_VERSION.length)
  const byteLength = Number.parseInt(body.slice(0, LEGACY_LENGTH_WIDTH), 36)

  if (!Number.isFinite(byteLength) || byteLength < 0) {
    throw new Error('Invalid theme install payload length')
  }

  const chunkData = body.slice(LEGACY_LENGTH_WIDTH)

  if (chunkData.length % LEGACY_CHUNK_WIDTH !== 0) {
    throw new Error('Invalid theme install payload body')
  }

  const bytes = new Uint8Array(Math.ceil(chunkData.length / LEGACY_CHUNK_WIDTH) * LEGACY_CHUNK_BYTES)

  for (let offset = 0; offset < chunkData.length; offset += LEGACY_CHUNK_WIDTH) {
    const chunk = chunkData.slice(offset, offset + LEGACY_CHUNK_WIDTH)
    const value = Number.parseInt(chunk, 36)
    const byteOffset = (offset / LEGACY_CHUNK_WIDTH) * LEGACY_CHUNK_BYTES

    bytes[byteOffset] = (value >> 16) & 0xff
    bytes[byteOffset + 1] = (value >> 8) & 0xff
    bytes[byteOffset + 2] = value & 0xff
  }

  return bytes.slice(0, byteLength)
}

function encodeBase64Url(bytes: Uint8Array) {
  let binary = ''

  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    const chunk = bytes.subarray(offset, offset + 0x8000)

    binary += String.fromCharCode(...chunk)
  }

  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/u, '')
}

function decodeBase64Url(encoded: string) {
  const padded = encoded.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (encoded.length % 4 || 4)) % 4)
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }

  return bytes
}

async function compressBytes(bytes: Uint8Array) {
  const stream = new CompressionStream('deflate-raw')
  const writer = stream.writable.getWriter()
  const compressedPromise = new Response(stream.readable).arrayBuffer()

  await writer.write(bytes)
  await writer.close()

  const compressed = await compressedPromise

  return new Uint8Array(compressed)
}

async function decompressBytes(bytes: Uint8Array) {
  const stream = new DecompressionStream('deflate-raw')
  const writer = stream.writable.getWriter()
  const decompressedPromise = new Response(stream.readable).arrayBuffer()

  await writer.write(bytes)
  await writer.close()

  const decompressed = await decompressedPromise

  return new Uint8Array(decompressed)
}

function encodeBinaryThemePayload(themeFile: OpenCodeCombinedThemeFile) {
  const palette = new Map<string, number>()
  const paletteBytes: number[] = []
  const tokenIndexes = new Uint8Array(TOKEN_VALUE_COUNT)
  let tokenOffset = 0

  for (const token of THEME_TOKEN_NAMES) {
    for (const mode of ['dark', 'light'] as const) {
      const colorValue = themeFile.theme[token][mode]
      const normalized = normalizeColorValue(colorValue)
      const parsed = normalized ? parseColor(normalized) : null

      if (!normalized || !parsed) {
        throw new Error(`Cannot encode non-color token value for ${token}.${mode}`)
      }

      let paletteIndex = palette.get(normalized)

      if (paletteIndex === undefined) {
        if (palette.size >= 255) {
          throw new Error('Theme install payload has too many unique colors')
        }

        paletteIndex = palette.size
        palette.set(normalized, paletteIndex)
        paletteBytes.push(parsed.r, parsed.g, parsed.b, Math.round(parsed.a * 255))
      }

      tokenIndexes[tokenOffset] = paletteIndex
      tokenOffset += 1
    }
  }

  return new Uint8Array([palette.size, ...paletteBytes, ...tokenIndexes])
}

function decodeBinaryThemePayload(bytes: Uint8Array) {
  const paletteSize = bytes[0] ?? 0
  const paletteBytesLength = paletteSize * 4
  const tokenIndexOffset = 1 + paletteBytesLength
  const tokenIndexes = bytes.slice(tokenIndexOffset)

  if (tokenIndexes.length !== TOKEN_VALUE_COUNT) {
    throw new Error('Invalid binary theme payload size')
  }

  const palette = Array.from({ length: paletteSize }, (_, index) => {
    const offset = 1 + index * 4

    return serializeColor({
      r: bytes[offset] ?? 0,
      g: bytes[offset + 1] ?? 0,
      b: bytes[offset + 2] ?? 0,
      a: (bytes[offset + 3] ?? 255) / 255,
    })
  })

  const darkTheme = {} as ThemeTokens
  const lightTheme = {} as ThemeTokens

  for (const [index, token] of THEME_TOKEN_NAMES.entries()) {
    const darkIndex = tokenIndexes[index * 2] ?? 0
    const lightIndex = tokenIndexes[index * 2 + 1] ?? 0

    darkTheme[token] = palette[darkIndex] ?? '#000000'
    lightTheme[token] = palette[lightIndex] ?? '#000000'
  }

  return exportCombinedThemeFile(darkTheme, lightTheme)
}

function decodeLegacyPayload(serialized: string) {
  const decoded = decodeLegacyBase36ToBytes(serialized)

  return decompressBytes(decoded).then((decompressed) => JSON.parse(new TextDecoder().decode(decompressed)) as LegacyThemeInstallPayload)
}

export function supportsThemeInstallCodec() {
  return typeof CompressionStream !== 'undefined' && typeof DecompressionStream !== 'undefined'
}

export async function encodeThemeInstallPayload(themeFile: OpenCodeCombinedThemeFile) {
  const binaryPayload = encodeBinaryThemePayload(themeFile)
  const compressed = await compressBytes(binaryPayload)

  return encodeBase64Url(compressed)
}

export async function decodeThemeInstallPayload(encoded: string, themeSlug?: string) {
  if (!encoded.startsWith(LEGACY_THEME_INSTALL_CODEC_VERSION)) {
    if (!themeSlug) {
      throw new Error('Theme slug is required for theme install payloads')
    }

    const compressed = decodeBase64Url(encoded)
    const decompressed = await decompressBytes(compressed)

    return {
      themeSlug,
      themeFile: decodeBinaryThemePayload(decompressed),
    }
  }

  const parsed = await decodeLegacyPayload(encoded)

  return {
    themeSlug: themeSlug ?? parsed.n,
    themeFile: {
      $schema: SCHEMA_URL,
      theme: parsed.t,
    } satisfies OpenCodeCombinedThemeFile,
  }
}
