#!/usr/bin/env python3
"""Build inline SVG sprite from @material-symbols/svg-400 npm tarball (outlined)."""
import html
import sys
import tarfile
import xml.etree.ElementTree as ET

TAR = "material-symbols-svg-400-0.42.3.tgz"
# Font ligature name -> filename stem in package/outlined/*.svg (when different)
ALIASES = {
    "expand_more": "keyboard_arrow_down",
    "auto_awesome": "wand_stars",
    "insights": "query_stats",
}

ICONS = sorted(
    {
        "add",
        "analytics",
        "arrow_downward",
        "arrow_forward",
        "assignment_turned_in",
        "auto_awesome",
        "auto_stories",
        "book_5",
        "build",
        "calendar_month",
        "campaign",
        "casino",
        "chat",
        "chat_bubble",
        "check_circle",
        "chevron_left",
        "close",
        "content_copy",
        "dashboard",
        "description",
        "directions_alt",
        "download",
        "edit",
        "edit_note",
        "event",
        "event_available",
        "event_busy",
        "expand_more",
        "feedback",
        "folder",
        "format_quote",
        "grass",
        "group",
        "hourglass_empty",
        "hourglass_top",
        "hub",
        "info",
        "insights",
        "inventory_2",
        "lightbulb",
        "manage_accounts",
        "mark_chat_read",
        "menu",
        "person",
        "person_off",
        "play_circle",
        "priority_high",
        "quiz",
        "schedule",
        "school",
        "search",
        "send",
        "settings",
        "share",
        "show_chart",
        "star",
        "supervisor_account",
        "timer",
        "timer_off",
        "trending_up",
        "video_camera_front",
        "videocam",
        "visibility",
        "visibility_off",
        "warning",
    }
)

SVG_NS = "{http://www.w3.org/2000/svg}"


def read_paths(tf: tarfile.TarFile, file_stem: str) -> tuple[str, str]:
    path = f"package/outlined/{file_stem}.svg"
    f = tf.extractfile(path)
    if f is None:
        raise FileNotFoundError(path)
    data = f.read()
    root = ET.fromstring(data)
    vb = root.get("viewBox") or "0 -960 960 960"
    parts = []
    for el in root.iter():
        if el.tag == SVG_NS + "path":
            d = el.get("d")
            if d and d.strip():
                parts.append(f'<path fill="currentColor" d="{html.escape(d, quote=True)}"/>')
    if not parts:
        raise ValueError(f"No paths in {path}")
    return vb, "".join(parts)


def main() -> None:
    root = sys.argv[1] if len(sys.argv) > 1 else "."
    tar_path = f"{root.rstrip('/')}/{TAR}"
    out_path = f"{root.rstrip('/')}/assets/material-symbols-sprite.svg"

    symbols = []
    missing = []
    with tarfile.open(tar_path, "r:gz") as tf:
        for ligature in ICONS:
            stem = ALIASES.get(ligature, ligature)
            try:
                vb, inner = read_paths(tf, stem)
            except (FileNotFoundError, ValueError) as e:
                missing.append((ligature, stem, str(e)))
                continue
            symbols.append(f'<symbol id="mi-{ligature}" viewBox="{vb}">{inner}</symbol>')

    if missing:
        for lig, st, err in missing:
            print(f"MISSING: {lig} (file {st}.svg): {err}", file=sys.stderr)
        sys.exit(1)

    body = "\n    ".join(symbols)
    doc = f'''<svg xmlns="http://www.w3.org/2000/svg" style="position:absolute;width:0;height:0;overflow:hidden" aria-hidden="true" focusable="false">
  <defs>
    {body}
  </defs>
</svg>
'''
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(doc)
    print(f"Wrote {out_path} ({len(symbols)} symbols)")


if __name__ == "__main__":
    main()
