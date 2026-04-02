#!/usr/bin/env python3
"""
Replace <span class="... material-symbols-outlined ...">icon_name</span>
with <svg class="mi ..." width="1em" height="1em"><use href="#mi-icon_name"/></svg>
so icons work in Figma without the Material Symbols webfont.
"""
import re
import sys

SPAN_RE = re.compile(
    r'<span(\s[^>]*\bclass="([^"]*\bmaterial-symbols-outlined\b[^"]*)"[^>]*)>([^<]*)</span>',
    re.IGNORECASE,
)


def replacer(match: re.Match[str]) -> str:
    attr_blob = match.group(1)
    class_attr = match.group(2)
    icon_name = match.group(3).strip()
    if not icon_name:
        return match.group(0)

    classes = class_attr.replace("material-symbols-outlined", "mi").strip()
    classes = re.sub(r"\s+", " ", classes).strip()

    rest = attr_blob
    rest = re.sub(r'\bclass="[^"]*"', f'class="{classes}"', rest, count=1)
    if "aria-hidden" not in rest:
        rest = rest.rstrip() + ' aria-hidden="true"'
    return (
        f'<svg{rest} width="1em" height="1em" fill="currentColor" '
        f'focusable="false"><use href="#mi-{icon_name}"/></svg>'
    )


def main() -> None:
    path = sys.argv[1]
    with open(path, encoding="utf-8") as f:
        html = f.read()
    new_html, n = SPAN_RE.subn(replacer, html)
    if n == 0:
        print(f"{path}: no matches", file=sys.stderr)
    else:
        print(f"{path}: replaced {n} icon spans")
    with open(path, "w", encoding="utf-8") as f:
        f.write(new_html)


if __name__ == "__main__":
    main()
