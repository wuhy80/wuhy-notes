from __future__ import annotations

import argparse
from pathlib import Path


def detect_newline(text: str) -> str:
    return "\r\n" if "\r\n" in text else "\n"


def split_frontmatter(lines: list[str]) -> tuple[list[str], list[str]]:
    if len(lines) >= 3 and lines[0].strip() == "---":
        for idx in range(1, len(lines)):
            if lines[idx].strip() == "---":
                return lines[: idx + 1], lines[idx + 1 :]
    return [], lines


def clean_lines(lines: list[str]) -> list[str]:
    result = list(lines)

    while result and result[0].strip() == "":
        result.pop(0)

    frontmatter, rest = split_frontmatter(result)
    if not frontmatter:
        return result

    while rest and rest[0].strip() == "":
        rest.pop(0)

    if rest and rest[0].strip() == "---":
        rest.pop(0)
        while rest and rest[0].strip() == "":
            rest.pop(0)

    cleaned: list[str] = []
    cleaned.extend(frontmatter)
    if rest:
        cleaned.append("")
        cleaned.extend(rest)

    while cleaned and cleaned[-1].strip() == "":
        cleaned.pop()

    return cleaned


def iter_files(paths: list[str]) -> list[Path]:
    files: list[Path] = []
    for raw in paths:
        path = Path(raw)
        if path.is_dir():
            files.extend(sorted(p for p in path.glob("*.md") if p.is_file()))
        elif path.is_file():
            files.append(path)
    return files


def main() -> int:
    parser = argparse.ArgumentParser(description="清理日记 frontmatter 周边的格式噪音。")
    parser.add_argument("paths", nargs="+", help="文件或目录")
    parser.add_argument("--dry-run", action="store_true", help="仅输出将修改的文件")
    args = parser.parse_args()

    changed = 0
    for path in iter_files(args.paths):
        original = path.read_text(encoding="utf-8")
        newline = detect_newline(original)
        lines = original.splitlines()
        cleaned_lines = clean_lines(lines)
        cleaned = newline.join(cleaned_lines).rstrip() + newline
        if cleaned == original:
            continue
        changed += 1
        print(path.as_posix())
        if not args.dry_run:
            path.write_text(cleaned, encoding="utf-8", newline="")

    print(f"changed={changed}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
