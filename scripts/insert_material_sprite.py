#!/usr/bin/env python3
"""Insert assets/material-symbols-sprite.svg right after <body> if missing."""
import re
import sys

MARKER = "material-symbols-sprite"


def main() -> None:
    root = sys.argv[1] if len(sys.argv) > 1 else "."
    path = sys.argv[2] if len(sys.argv) > 2 else None
    if not path:
        print("usage: insert_material_sprite.py <root> <file.html>", file=sys.stderr)
        sys.exit(1)
    sprite_path = f"{root.rstrip('/')}/assets/material-symbols-sprite.svg"
    with open(sprite_path, encoding="utf-8") as f:
        sprite = f.read().strip()
    with open(path, encoding="utf-8") as f:
        html = f.read()
    if MARKER in html:
        print(f"{path}: sprite already present")
        return
    m = re.search(r"<body([^>]*)>", html, re.IGNORECASE)
    if not m:
        print(f"{path}: no <body>", file=sys.stderr)
        sys.exit(1)
    insert = f"\n<!-- {MARKER} -->\n{sprite}\n"
    idx = m.end()
    html = html[:idx] + insert + html[idx:]
    with open(path, "w", encoding="utf-8") as f:
        f.write(html)
    print(f"{path}: inserted sprite")


if __name__ == "__main__":
    main()
