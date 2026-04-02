#!/usr/bin/env python3
"""
Inline SVG <use> for Figma / html-to-design (capture.js does not resolve fragments):

1) Material: <svg class="...mi..."><use href="#mi-foo"/></svg> → paths from
   assets/material-symbols-sprite.svg
2) Heroicons in coach HTML: <svg ...><use href="#hi-foo"/></svg> → paths from
   <symbol id="hi-foo"> in the same file

Run from repo root:
  python3 scripts/expand_mi_inline.py
  python3 scripts/expand_mi_inline.py coach-dashboard-v2.html
"""
import re
import sys
from pathlib import Path

# <svg ... class="...mi..."> ... single <use href="#mi-name"/> ... </svg>
SVG_MI_USE = re.compile(
    r'<svg(\s[^>]*\bclass="[^"]*\bmi\b[^"]*"[^>]*)>\s*'
    r'<use\s+href="#(mi-[a-z0-9_]+)"\s*/>\s*</svg>',
    re.IGNORECASE | re.DOTALL,
)

# Heroicons wrapper: xmlns + fill="none" + 24×24 viewBox, single <use href="#hi-…"/>
SVG_HI_USE = re.compile(
    r'<svg(\s[^>]*xmlns="http://www\.w3\.org/2000/svg"[^>]*)\s*>\s*'
    r'<use\s+href="#(hi-[a-z0-9-]+)"\s*/>\s*</svg>',
    re.IGNORECASE | re.DOTALL,
)

HI_SYM_RE = re.compile(
    r'<symbol\s+id="(hi-[a-z0-9-]+)"\s+viewBox="([^"]+)"(?:\s+fill="none")?\s*>(.*?)</symbol>',
    re.IGNORECASE | re.DOTALL,
)


def load_symbols(sprite_path: Path) -> dict[str, tuple[str, str]]:
    text = sprite_path.read_text(encoding="utf-8")
    sym_re = re.compile(
        r'<symbol\s+id="(mi-[a-z0-9_]+)"\s+viewBox="([^"]+)"\s*>(.*?)</symbol>',
        re.IGNORECASE | re.DOTALL,
    )
    out: dict[str, tuple[str, str]] = {}
    for m in sym_re.finditer(text):
        sid, vb, inner = m.group(1), m.group(2), m.group(3).strip()
        out[sid] = (vb, inner)
    return out


def merge_viewbox(attrs: str, viewbox: str) -> str:
    # Keep leading space after "<svg" — strip() would produce invalid "<svgclass=..."
    attrs = attrs.rstrip()
    if re.search(r"\bviewBox\s*=", attrs, re.I):
        return re.sub(
            r'\sviewBox="[^"]*"',
            f' viewBox="{viewbox}"',
            attrs,
            count=1,
            flags=re.I,
        )
    return f'{attrs} viewBox="{viewbox}"'


def load_hi_symbols_from_html(html: str) -> dict[str, tuple[str, str]]:
    out: dict[str, tuple[str, str]] = {}
    for m in HI_SYM_RE.finditer(html):
        sid, vb, inner = m.group(1), m.group(2), m.group(3).strip()
        out[sid] = (vb, inner)
    return out


def expand_mi_uses(html: str, symbols: dict[str, tuple[str, str]]) -> tuple[str, int]:
    total = 0

    def repl(m: re.Match[str]) -> str:
        nonlocal total
        attrs, sid = m.group(1), m.group(2)
        if sid not in symbols:
            return m.group(0)
        vb, inner = symbols[sid]
        new_attrs = merge_viewbox(attrs, vb)
        total += 1
        return f"<svg{new_attrs}>{inner}</svg>"

    while True:
        html2, c = SVG_MI_USE.subn(repl, html)
        if c == 0:
            break
        html = html2
    return html, total


def expand_hi_uses(html: str, symbols: dict[str, tuple[str, str]]) -> tuple[str, int]:
    if not symbols:
        return html, 0
    total = 0

    def repl(m: re.Match[str]) -> str:
        nonlocal total
        attrs, sid = m.group(1), m.group(2)
        if sid not in symbols:
            return m.group(0)
        if 'viewBox="0 0 24 24"' not in attrs:
            return m.group(0)
        vb, inner = symbols[sid]
        new_attrs = merge_viewbox(attrs, vb)
        total += 1
        return f"<svg{new_attrs}>{inner}</svg>"

    while True:
        html2, c = SVG_HI_USE.subn(repl, html)
        if c == 0:
            break
        html = html2
    return html, total


def process_html(html: str, mi_symbols: dict[str, tuple[str, str]]) -> tuple[str, int, int]:
    hi_syms = load_hi_symbols_from_html(html)
    html, n_hi = expand_hi_uses(html, hi_syms)
    html, n_mi = expand_mi_uses(html, mi_symbols)
    return html, n_mi, n_hi


def main() -> None:
    root = Path(__file__).resolve().parent.parent
    sprite = root / "assets" / "material-symbols-sprite.svg"
    if not sprite.is_file():
        print(f"Missing {sprite}", file=sys.stderr)
        sys.exit(1)
    symbols = load_symbols(sprite)
    if not symbols:
        print("No symbols parsed from sprite", file=sys.stderr)
        sys.exit(1)

    paths = [Path(p) for p in sys.argv[1:]] if sys.argv[1:] else []
    if not paths:
        paths = [
            root / "index.html",
            root / "landing-page.html",
            root / "teacher-ai-chat.html",
            root / "coach-dashboard.html",
            root / "coach-dashboard-v2.html",
        ]

    for p in paths:
        if not p.is_file():
            print(f"skip missing: {p}", file=sys.stderr)
            continue
        html = p.read_text(encoding="utf-8")
        new_html, n_mi, n_hi = process_html(html, symbols)
        if n_mi or n_hi:
            p.write_text(new_html, encoding="utf-8")
            print(f"{p.name}: expanded {n_mi} mi + {n_hi} hi <use> icons")
        else:
            print(f"{p.name}: no mi/hi <use> blocks matched")


if __name__ == "__main__":
    main()
