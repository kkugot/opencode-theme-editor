#!/usr/bin/env sh
set -eu

if [ "$#" -lt 1 ]; then
  printf '%s\n' "usage: curl -fsSL <install-url> | bash -s -- <theme-name> <encoded-theme>"
  printf '%s\n' "legacy usage: curl -fsSL <install-url> | bash -s -- <encoded-theme>"
  exit 1
fi

if ! command -v python3 >/dev/null 2>&1; then
  printf '%s\n' "python3 is required to install this theme"
  exit 1
fi

if [ "$#" -ge 2 ]; then
  THEME_NAME="$1"
  ENCODED_THEME="$2"
else
  THEME_NAME=""
  ENCODED_THEME="$1"
fi

python3 - "$THEME_NAME" "$ENCODED_THEME" <<'PY'
import base64
import json
import pathlib
import re
import sys
import zlib

SCHEMA_URL = 'https://opencode.ai/theme.json'
TUI_SCHEMA_URL = 'https://opencode.ai/tui.json'
CODEC_PREFIX_OT1 = 'ot1'
LENGTH_WIDTH = 5
CHUNK_WIDTH = 5
TOKEN_NAMES = [
    'primary',
    'secondary',
    'accent',
    'error',
    'warning',
    'success',
    'info',
    'text',
    'textMuted',
    'selectedListItemText',
    'background',
    'backgroundPanel',
    'backgroundElement',
    'backgroundMenu',
    'border',
    'borderActive',
    'borderSubtle',
    'diffAdded',
    'diffRemoved',
    'diffContext',
    'diffHunkHeader',
    'diffHighlightAdded',
    'diffHighlightRemoved',
    'diffAddedBg',
    'diffRemovedBg',
    'diffContextBg',
    'diffLineNumber',
    'diffAddedLineNumberBg',
    'diffRemovedLineNumberBg',
    'markdownText',
    'markdownHeading',
    'markdownLink',
    'markdownLinkText',
    'markdownCode',
    'markdownBlockQuote',
    'markdownEmph',
    'markdownStrong',
    'markdownHorizontalRule',
    'markdownListItem',
    'markdownListEnumeration',
    'markdownImage',
    'markdownImageText',
    'markdownCodeBlock',
    'syntaxComment',
    'syntaxKeyword',
    'syntaxFunction',
    'syntaxVariable',
    'syntaxString',
    'syntaxNumber',
    'syntaxType',
    'syntaxOperator',
    'syntaxPunctuation',
]


def slugify(value: str) -> str:
    cleaned = re.sub(r'[^a-z0-9]+', '-', value.strip().lower())
    return cleaned.strip('-') or 'opencode-theme'


def rgba_to_color(red: int, green: int, blue: int, alpha: int) -> str:
    if alpha <= 0:
        return 'transparent'

    if alpha >= 255:
        return f'#{red:02x}{green:02x}{blue:02x}'

    return f'#{red:02x}{green:02x}{blue:02x}{alpha:02x}'


def decode_ot1_payload(encoded: str) -> dict:
    body = encoded[len(CODEC_PREFIX_OT1):]
    byte_length = int(body[:LENGTH_WIDTH], 36)
    chunk_data = body[LENGTH_WIDTH:]

    if len(chunk_data) % CHUNK_WIDTH != 0:
        raise SystemExit('invalid ot1 theme payload body')

    decoded = bytearray()

    for offset in range(0, len(chunk_data), CHUNK_WIDTH):
      value = int(chunk_data[offset:offset + CHUNK_WIDTH], 36)
      decoded.extend(((value >> 16) & 0xFF, (value >> 8) & 0xFF, value & 0xFF))

    raw = zlib.decompress(bytes(decoded[:byte_length]), -15)
    payload = json.loads(raw.decode('utf-8'))
    theme_slug = slugify(payload.get('n', 'opencode-theme'))

    return {
        'theme_slug': theme_slug,
        'theme_file': {
            '$schema': SCHEMA_URL,
            'theme': payload['t'],
        },
    }


def decode_compact_payload(theme_name: str, encoded: str) -> dict:
    if not theme_name:
        raise SystemExit('theme name is required for theme install payloads')

    padding = '=' * ((4 - len(encoded) % 4) % 4)
    compressed = base64.urlsafe_b64decode(encoded + padding)
    raw = zlib.decompress(compressed, -15)

    if not raw:
        raise SystemExit('invalid theme payload')

    palette_size = raw[0]
    palette_byte_length = palette_size * 4
    token_bytes = raw[1 + palette_byte_length:]

    if len(token_bytes) != len(TOKEN_NAMES) * 2:
        raise SystemExit('invalid token payload size')

    palette = []

    for index in range(palette_size):
        offset = 1 + index * 4
        palette.append(rgba_to_color(raw[offset], raw[offset + 1], raw[offset + 2], raw[offset + 3]))

    theme = {}

    for index, token in enumerate(TOKEN_NAMES):
        dark_index = token_bytes[index * 2]
        light_index = token_bytes[index * 2 + 1]
        theme[token] = {
            'dark': palette[dark_index],
            'light': palette[light_index],
        }

    return {
        'theme_slug': slugify(theme_name),
        'theme_file': {
            '$schema': SCHEMA_URL,
            'theme': theme,
        },
    }


def decode_payload(theme_name: str, encoded: str) -> dict:
    if encoded.startswith(CODEC_PREFIX_OT1):
        return decode_ot1_payload(encoded)

    return decode_compact_payload(theme_name, encoded)


payload = decode_payload(sys.argv[1], sys.argv[2])
theme_slug = payload['theme_slug']
theme_file = payload['theme_file']

project_root = pathlib.Path.cwd()
opencode_dir = project_root / '.opencode'
themes_dir = opencode_dir / 'themes'
theme_path = themes_dir / f'{theme_slug}.json'
tui_path = opencode_dir / 'tui.json'

themes_dir.mkdir(parents=True, exist_ok=True)
theme_path.write_text(json.dumps(theme_file, indent=2) + '\n', encoding='utf-8')

if tui_path.exists():
    try:
        tui_data = json.loads(tui_path.read_text(encoding='utf-8'))
    except json.JSONDecodeError:
        tui_data = {}
else:
    tui_data = {}

if not isinstance(tui_data, dict):
    tui_data = {}

tui_data.setdefault('$schema', TUI_SCHEMA_URL)
tui_data['theme'] = theme_slug
tui_path.write_text(json.dumps(tui_data, indent=2) + '\n', encoding='utf-8')

print(f'Installed {theme_slug} to {theme_path}')
print(f'Activated project theme in {tui_path}')
PY
