#!/usr/bin/env sh
set -eu

if [ "$#" -lt 1 ]; then
  printf '%s\n' "usage: curl -fsSL <script-url> | bash -s -- install <theme-name> <encoded-theme>"
  printf '%s\n' "   or: curl -fsSL <script-url> | bash -s -- import <theme-studio-url> [theme-name-or-path]"
  exit 1
fi

if ! command -v python3 >/dev/null 2>&1; then
  printf '%s\n' "python3 is required to import or install OpenCode themes"
  exit 1
fi

MODE="$1"
shift

python3 - "$MODE" "$@" <<'PY'
import base64
import json
import pathlib
import re
import shutil
import subprocess
import sys
import urllib.parse
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


def decode_install_payload(theme_name: str, encoded: str) -> dict:
    if encoded.startswith(CODEC_PREFIX_OT1):
        return decode_ot1_payload(encoded)

    return decode_compact_payload(theme_name, encoded)


def install_theme(theme_name: str, encoded: str):
    payload = decode_install_payload(theme_name, encoded)
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


def normalize_studio_url(url: str) -> str:
    parsed = urllib.parse.urlsplit(url.strip())

    if not parsed.scheme or not parsed.netloc:
        raise SystemExit('theme studio URL must be an absolute URL')

    return urllib.parse.urlunsplit((parsed.scheme, parsed.netloc, parsed.path or '/', '', ''))


def read_json(path: pathlib.Path):
    try:
        return json.loads(path.read_text(encoding='utf-8'))
    except FileNotFoundError:
        raise
    except json.JSONDecodeError as error:
        raise SystemExit(f'could not parse JSON from {path}: {error}')


def read_theme_ref_from_tui(path: pathlib.Path):
    data = read_json(path)

    if not isinstance(data, dict):
        return None

    theme_ref = data.get('theme')

    if isinstance(theme_ref, str) and theme_ref.strip():
        return theme_ref.strip()

    return None


def resolve_theme_reference(project_root: pathlib.Path, explicit_ref: str):
    if explicit_ref.strip():
        return explicit_ref.strip(), 'argument'

    config_candidates = [
        project_root / '.opencode' / 'tui.json',
        pathlib.Path.home() / '.config' / 'opencode' / 'tui.json',
    ]

    for candidate in config_candidates:
        if not candidate.exists():
            continue

        theme_ref = read_theme_ref_from_tui(candidate)

        if theme_ref:
            return theme_ref, str(candidate)

    raise SystemExit('could not find an active OpenCode theme; pass a theme name or JSON file path explicitly')


def build_theme_path_candidates(project_root: pathlib.Path, theme_ref: str):
    home = pathlib.Path.home()
    candidates = []
    raw = theme_ref.strip()
    expanded = pathlib.Path(raw).expanduser()
    stem = expanded.stem if expanded.suffix == '.json' else raw

    if expanded.is_absolute():
        candidates.append(expanded)
    elif raw.startswith('.') or '/' in raw or raw.endswith('.json'):
        candidates.append((project_root / expanded).resolve())

    if raw.endswith('.json'):
        candidates.append(project_root / '.opencode' / 'themes' / expanded.name)
        candidates.append(home / '.config' / 'opencode' / 'themes' / expanded.name)
    else:
        candidates.append(project_root / '.opencode' / 'themes' / f'{stem}.json')
        candidates.append(home / '.config' / 'opencode' / 'themes' / f'{stem}.json')

    unique_candidates = []
    seen = set()

    for candidate in candidates:
        normalized = str(candidate)

        if normalized in seen:
            continue

        seen.add(normalized)
        unique_candidates.append(candidate)

    return unique_candidates


def resolve_theme_path(project_root: pathlib.Path, theme_ref: str):
    candidates = build_theme_path_candidates(project_root, theme_ref)

    for candidate in candidates:
        if candidate.exists():
            return candidate

    raise SystemExit(
        'could not locate a local theme JSON file for the active theme; built-in themes are not importable with this command yet'
    )


def parse_hex_channel(value: str) -> int:
    return int(value, 16)


def parse_channel(value: str) -> int:
    stripped = value.strip()

    if stripped.endswith('%'):
        return round(max(0.0, min(100.0, float(stripped[:-1]))) * 2.55)

    return round(max(0.0, min(255.0, float(stripped))))


def parse_alpha(value: str) -> int:
    stripped = value.strip()

    if stripped.endswith('%'):
        return round(max(0.0, min(100.0, float(stripped[:-1]))) * 2.55)

    numeric = float(stripped)

    if numeric > 1:
        return round(max(0.0, min(255.0, numeric)))

    return round(max(0.0, min(1.0, numeric)) * 255)


RGBA_PATTERN = re.compile(r'^rgba?\((.+)\)$', re.IGNORECASE)

COLOR_NAME_HEX = {
    'aliceblue': '#f0f8ff',
    'antiquewhite': '#faebd7',
    'aqua': '#00ffff',
    'aquamarine': '#7fffd4',
    'azure': '#f0ffff',
    'beige': '#f5f5dc',
    'bisque': '#ffe4c4',
    'black': '#000000',
    'blanchedalmond': '#ffebcd',
    'blue': '#0000ff',
    'blueviolet': '#8a2be2',
    'brown': '#a52a2a',
    'burlywood': '#deb887',
    'cadetblue': '#5f9ea0',
    'chartreuse': '#7fff00',
    'chocolate': '#d2691e',
    'coral': '#ff7f50',
    'cornflowerblue': '#6495ed',
    'cornsilk': '#fff8dc',
    'crimson': '#dc143c',
    'cyan': '#00ffff',
    'darkblue': '#00008b',
    'darkcyan': '#008b8b',
    'darkgoldenrod': '#b8860b',
    'darkgray': '#a9a9a9',
    'darkgreen': '#006400',
    'darkgrey': '#a9a9a9',
    'darkkhaki': '#bdb76b',
    'darkmagenta': '#8b008b',
    'darkolivegreen': '#556b2f',
    'darkorange': '#ff8c00',
    'darkorchid': '#9932cc',
    'darkred': '#8b0000',
    'darksalmon': '#e9967a',
    'darkseagreen': '#8fbc8f',
    'darkslateblue': '#483d8b',
    'darkslategray': '#2f4f4f',
    'darkslategrey': '#2f4f4f',
    'darkturquoise': '#00ced1',
    'darkviolet': '#9400d3',
    'deeppink': '#ff1493',
    'deepskyblue': '#00bfff',
    'dimgray': '#696969',
    'dimgrey': '#696969',
    'dodgerblue': '#1e90ff',
    'firebrick': '#b22222',
    'floralwhite': '#fffaf0',
    'forestgreen': '#228b22',
    'fuchsia': '#ff00ff',
    'gainsboro': '#dcdcdc',
    'ghostwhite': '#f8f8ff',
    'gold': '#ffd700',
    'goldenrod': '#daa520',
    'gray': '#808080',
    'green': '#008000',
    'greenyellow': '#adff2f',
    'grey': '#808080',
    'honeydew': '#f0fff0',
    'hotpink': '#ff69b4',
    'indianred': '#cd5c5c',
    'indigo': '#4b0082',
    'ivory': '#fffff0',
    'khaki': '#f0e68c',
    'lavender': '#e6e6fa',
    'lavenderblush': '#fff0f5',
    'lawngreen': '#7cfc00',
    'lemonchiffon': '#fffacd',
    'lightblue': '#add8e6',
    'lightcoral': '#f08080',
    'lightcyan': '#e0ffff',
    'lightgoldenrodyellow': '#fafad2',
    'lightgray': '#d3d3d3',
    'lightgreen': '#90ee90',
    'lightgrey': '#d3d3d3',
    'lightpink': '#ffb6c1',
    'lightsalmon': '#ffa07a',
    'lightseagreen': '#20b2aa',
    'lightskyblue': '#87cefa',
    'lightslategray': '#778899',
    'lightslategrey': '#778899',
    'lightsteelblue': '#b0c4de',
    'lightyellow': '#ffffe0',
    'lime': '#00ff00',
    'limegreen': '#32cd32',
    'linen': '#faf0e6',
    'magenta': '#ff00ff',
    'maroon': '#800000',
    'mediumaquamarine': '#66cdaa',
    'mediumblue': '#0000cd',
    'mediumorchid': '#ba55d3',
    'mediumpurple': '#9370db',
    'mediumseagreen': '#3cb371',
    'mediumslateblue': '#7b68ee',
    'mediumspringgreen': '#00fa9a',
    'mediumturquoise': '#48d1cc',
    'mediumvioletred': '#c71585',
    'midnightblue': '#191970',
    'mintcream': '#f5fffa',
    'mistyrose': '#ffe4e1',
    'moccasin': '#ffe4b5',
    'navajowhite': '#ffdead',
    'navy': '#000080',
    'oldlace': '#fdf5e6',
    'olive': '#808000',
    'olivedrab': '#6b8e23',
    'orange': '#ffa500',
    'orangered': '#ff4500',
    'orchid': '#da70d6',
    'palegoldenrod': '#eee8aa',
    'palegreen': '#98fb98',
    'paleturquoise': '#afeeee',
    'palevioletred': '#db7093',
    'papayawhip': '#ffefd5',
    'peachpuff': '#ffdab9',
    'peru': '#cd853f',
    'pink': '#ffc0cb',
    'plum': '#dda0dd',
    'powderblue': '#b0e0e6',
    'purple': '#800080',
    'rebeccapurple': '#663399',
    'red': '#ff0000',
    'rosybrown': '#bc8f8f',
    'royalblue': '#4169e1',
    'saddlebrown': '#8b4513',
    'salmon': '#fa8072',
    'sandybrown': '#f4a460',
    'seagreen': '#2e8b57',
    'seashell': '#fff5ee',
    'sienna': '#a0522d',
    'silver': '#c0c0c0',
    'skyblue': '#87ceeb',
    'slateblue': '#6a5acd',
    'slategray': '#708090',
    'slategrey': '#708090',
    'snow': '#fffafa',
    'springgreen': '#00ff7f',
    'steelblue': '#4682b4',
    'tan': '#d2b48c',
    'teal': '#008080',
    'thistle': '#d8bfd8',
    'tomato': '#ff6347',
    'turquoise': '#40e0d0',
    'violet': '#ee82ee',
    'wheat': '#f5deb3',
    'white': '#ffffff',
    'whitesmoke': '#f5f5f5',
    'yellow': '#ffff00',
    'yellowgreen': '#9acd32',
}


def parse_color(value: str):
    normalized = value.strip().lower()

    if normalized in ('transparent', 'none'):
        return 0, 0, 0, 0

    named_color = COLOR_NAME_HEX.get(normalized)

    if named_color is not None:
        normalized = named_color

    if normalized.startswith('#'):
        hex_value = normalized[1:]

        if len(hex_value) == 3:
            red, green, blue = (parse_hex_channel(channel * 2) for channel in hex_value)
            return red, green, blue, 255

        if len(hex_value) == 4:
            red, green, blue, alpha = (parse_hex_channel(channel * 2) for channel in hex_value)
            return red, green, blue, alpha

        if len(hex_value) == 6:
            return (
                parse_hex_channel(hex_value[0:2]),
                parse_hex_channel(hex_value[2:4]),
                parse_hex_channel(hex_value[4:6]),
                255,
            )

        if len(hex_value) == 8:
            return (
                parse_hex_channel(hex_value[0:2]),
                parse_hex_channel(hex_value[2:4]),
                parse_hex_channel(hex_value[4:6]),
                parse_hex_channel(hex_value[6:8]),
            )

    match = RGBA_PATTERN.match(normalized)

    if match:
        parts = [part.strip() for part in match.group(1).split(',')]

        if len(parts) == 3:
            red, green, blue = (parse_channel(part) for part in parts)
            return red, green, blue, 255

        if len(parts) == 4:
            red, green, blue = (parse_channel(part) for part in parts[:3])
            alpha = parse_alpha(parts[3])
            return red, green, blue, alpha

    raise SystemExit(f'cannot encode unsupported color value: {value}')


def try_parse_color(value: str):
    try:
        return parse_color(value)
    except SystemExit:
        return None


def resolve_theme_token_color(value: str, defs: dict, token: str, visited_defs=None):
    direct_color = try_parse_color(value)

    if direct_color is not None:
        return rgba_to_color(*direct_color)

    if value not in defs:
        raise SystemExit(f'token {token} must be a color literal, transparent, or a name from defs')

    if visited_defs is None:
        visited_defs = set()

    if value in visited_defs:
        raise SystemExit(f'token {token} has a circular defs reference at {value}')

    next_value = defs[value]

    if not isinstance(next_value, str):
        raise SystemExit(f'defs.{value} must resolve to a string color value')

    next_visited_defs = set(visited_defs)
    next_visited_defs.add(value)

    return resolve_theme_token_color(next_value, defs, token, next_visited_defs)


def normalize_theme_file(data: dict):
    if not isinstance(data, dict):
        raise SystemExit('theme JSON must be an object')

    raw_theme = data.get('theme')
    raw_defs = data.get('defs')

    if not isinstance(raw_theme, dict):
        raise SystemExit('theme JSON must contain a theme object')

    if raw_defs is None:
        defs = {}
    elif isinstance(raw_defs, dict):
        defs = raw_defs
    else:
        raise SystemExit('theme JSON defs must be an object when provided')

    normalized_theme = {}

    for token in TOKEN_NAMES:
        value = raw_theme.get(token)

        if isinstance(value, dict):
            dark = value.get('dark')
            light = value.get('light')

            if dark is None and light is None:
                raise SystemExit(f'theme token {token} must contain a color string or dark/light color strings')

            if dark is None:
                dark = light

            if light is None:
                light = dark
        else:
            dark = value
            light = value

        if not isinstance(dark, str) or not isinstance(light, str):
            raise SystemExit(f'theme token {token} must contain color strings')

        normalized_theme[token] = {
            'dark': resolve_theme_token_color(dark, defs, token),
            'light': resolve_theme_token_color(light, defs, token),
        }

    return {
        '$schema': SCHEMA_URL,
        'theme': normalized_theme,
    }


def encode_theme_payload(theme_file: dict):
    palette_indexes = {}
    palette_bytes = []
    token_indexes = []

    for token in TOKEN_NAMES:
        for mode in ('dark', 'light'):
            color_value = theme_file['theme'][token][mode]
            rgba = parse_color(color_value)
            color_key = rgba_to_color(*rgba)
            palette_index = palette_indexes.get(color_key)

            if palette_index is None:
                if len(palette_indexes) >= 255:
                    raise SystemExit('theme uses too many unique colors for a shareable import payload')

                palette_index = len(palette_indexes)
                palette_indexes[color_key] = palette_index
                palette_bytes.extend(rgba)

            token_indexes.append(palette_index)

    payload = bytes([len(palette_indexes), *palette_bytes, *token_indexes])
    compressed = zlib.compress(payload, level=9, wbits=-15)

    return base64.urlsafe_b64encode(compressed).decode('ascii').rstrip('=')


def build_share_url(studio_url: str, theme_slug: str, encoded_payload: str):
    parsed = urllib.parse.urlsplit(studio_url)
    query = urllib.parse.urlencode({theme_slug: encoded_payload})

    return urllib.parse.urlunsplit((parsed.scheme, parsed.netloc, parsed.path, query, ''))


def open_url(url: str):
    for command in ('open', 'xdg-open'):
        executable = shutil.which(command)

        if not executable:
            continue

        subprocess.run([executable, url], check=False)
        return True

    return False


def import_theme(studio_url: str, theme_ref: str):
    normalized_studio_url = normalize_studio_url(studio_url)
    project_root = pathlib.Path.cwd()
    resolved_theme_ref, source = resolve_theme_reference(project_root, theme_ref)
    theme_path = resolve_theme_path(project_root, resolved_theme_ref)
    theme_slug = slugify(theme_path.stem)
    theme_data = normalize_theme_file(read_json(theme_path))
    encoded_payload = encode_theme_payload(theme_data)
    share_url = build_share_url(normalized_studio_url, theme_slug, encoded_payload)
    opened = open_url(share_url)

    print(f'Resolved theme from {source}: {theme_path}')
    print(share_url)

    if opened:
        print('Opened Theme Studio in your browser.')
    else:
        print('Could not auto-open a browser. Copy the URL above manually.')


mode = sys.argv[1] if len(sys.argv) > 1 else ''
args = sys.argv[2:]

if mode == 'install':
    if len(args) == 1:
        install_theme('', args[0])
    elif len(args) >= 2:
        install_theme(args[0], args[1])
    else:
        raise SystemExit('usage: ... install <theme-name> <encoded-theme>')
elif mode == 'import':
    if not args:
        raise SystemExit('usage: ... import <theme-studio-url> [theme-name-or-path]')

    import_theme(args[0], args[1] if len(args) >= 2 else '')
else:
    raise SystemExit(f'unknown mode: {mode}')
PY
