from __future__ import annotations

import argparse
import difflib
import re
import sys
from pathlib import Path


HEADING_RE = re.compile(r"^(#{1,6})\s+(.*)$")
FOOTER_RE = re.compile(r"^<<\s+\[\[[^\]]+\]\]\s+\|\s+\[\[[^\]]+\]\]\s+>>\s*$")
FENCE_RE = re.compile(r"^```")
POLLUTED_RE = re.compile(r"^#{1,6}\s+\?{2,}(?:\s*/\s+\?{2,})?\s*$")

TODO_TITLES = {"待办", "待办任务"}
PROCESS_TITLES = {"今日处理事务记录"}
DONE_TITLES = {"今日完成"}
RECORD1_TITLES = {"记录 1"}
RECORD2_TITLES = {"记录 2"}
WEEKLY_TITLES = {"本周日志"}
ROOT_TITLES = {"日志记录"}
FOCUS_TITLES = {"今日重点"}
FRAGMENT_TITLES = {"碎片记录"}
TOMORROW_TITLES = {"明日提示"}
WORK_TITLES = {"工作 / 学习"}
LIFE_TITLES = {"生活 / 想法"}
SUPPLEMENT_TITLES = {"补充记录"}
EXTRA_TITLES = {"附加索引"}
OTHER_TITLES = {"其他结构"}
CURRENT_ROOT_TITLES = FOCUS_TITLES | {"待办任务"} | DONE_TITLES | FRAGMENT_TITLES | TOMORROW_TITLES
INTRO_STOP_TITLES = (
    ROOT_TITLES
    | TODO_TITLES
    | PROCESS_TITLES
    | DONE_TITLES
    | RECORD1_TITLES
    | RECORD2_TITLES
    | WEEKLY_TITLES
    | CURRENT_ROOT_TITLES
)


def detect_newline(text: str) -> str:
    return "\r\n" if "\r\n" in text else "\n"


def split_frontmatter(lines: list[str]) -> tuple[list[str], list[str]]:
    if len(lines) >= 3 and lines[0].strip() == "---":
        for idx in range(1, len(lines)):
            if lines[idx].strip() == "---":
                return lines[: idx + 1], lines[idx + 1 :]
    return [], lines


def split_footer(lines: list[str]) -> tuple[list[str], list[str]]:
    if len(lines) >= 2 and FOOTER_RE.match(lines[-1].strip()):
        idx = len(lines) - 2
        while idx >= 0 and lines[idx].strip() == "":
            idx -= 1
        if idx >= 0 and lines[idx].strip() == "---":
            return lines[:idx], lines[idx:]
    return lines, []


def split_intro(lines: list[str]) -> tuple[list[str], list[str]]:
    in_fence = False
    for idx, line in enumerate(lines):
        if FENCE_RE.match(line):
            in_fence = not in_fence
            continue
        if in_fence:
            continue
        match = HEADING_RE.match(line)
        if match:
            title = match.group(2).strip()
            if title in INTRO_STOP_TITLES:
                return lines[:idx], lines[idx:]
    return lines, []


def sanitize_intro(lines: list[str]) -> list[str]:
    result = list(lines)
    while result and result[-1].strip() == "":
        result.pop()
    while result and result[0].strip() == "":
        result.pop(0)
    if result and all(line.strip() in {"---"} for line in result):
        return []
    return result


def parse_sections(lines: list[str], split_levels: set[int] | None = None) -> list[tuple[int, str, list[str]]]:
    sections: list[tuple[int, str, list[str]]] = []
    in_fence = False
    current_level: int | None = None
    current_title: str | None = None
    current_content: list[str] = []

    def flush() -> None:
        nonlocal current_level, current_title, current_content
        if current_title is not None:
            sections.append((current_level or 0, current_title, current_content))
        current_level = None
        current_title = None
        current_content = []

    for line in lines:
        if FENCE_RE.match(line):
            in_fence = not in_fence
            if current_title is not None:
                current_content.append(line)
            continue
        if not in_fence:
            match = HEADING_RE.match(line)
            if match:
                level = len(match.group(1))
                if split_levels is not None and level not in split_levels:
                    if current_title is not None:
                        current_content.append(line)
                    continue
                flush()
                current_level = level
                current_title = match.group(2).strip()
                continue
        if current_title is None:
            if line.strip():
                current_level = 0
                current_title = "__preamble__"
                current_content = [line]
            continue
        current_content.append(line)
    flush()
    return sections


def extract_from_root(content: list[str]) -> dict[str, list[str]]:
    result = {
        "focus": [],
        "todo": [],
        "process": [],
        "done": [],
        "record1": [],
        "record2": [],
        "weekly": [],
        "other": [],
        "life": [],
        "tomorrow": [],
    }
    subsections = parse_sections(content, split_levels={1, 2})
    for level, title, section_content in subsections:
        if level == 2 and title in TODO_TITLES:
            result["todo"].extend(section_content)
        elif level == 2 and title in PROCESS_TITLES:
            result["process"].extend(section_content)
        elif level == 2 and title in DONE_TITLES:
            result["done"].extend(section_content)
        elif level == 1 and title in DONE_TITLES:
            result["done"].extend(section_content)
        elif level == 1 and title in RECORD1_TITLES:
            result["record1"].extend(section_content)
        elif level == 1 and title in RECORD2_TITLES:
            result["record2"].extend(section_content)
        elif level == 1 and title in WEEKLY_TITLES:
            result["weekly"].extend(section_content)
        elif title != "__preamble__":
            block = [f"{'#' * max(level, 1)} {title}"] + section_content
            result["other"].extend(block)
            if block and block[-1].strip():
                result["other"].append("")
    return result


def clean_block(lines: list[str]) -> list[str]:
    result = list(lines)
    while result and result[0].strip() == "":
        result.pop(0)
    while result and result[-1].strip() == "":
        result.pop()
    return result


def is_empty_block(lines: list[str]) -> bool:
    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue
        if re.fullmatch(r"-\s*", stripped):
            continue
        if re.fullmatch(r"-\s+\[\s\]\s*", stripped):
            continue
        if re.fullmatch(r"-\s+\[x\]\s*", stripped, re.IGNORECASE):
            continue
        return False
    return True


def append_block(output: list[str], heading: str, content: list[str] | None = None, default: list[str] | None = None) -> None:
    output.append(heading)
    output.append("")
    block = clean_block(content or [])
    if block:
        output.extend(block)
    elif default:
        output.extend(default)
    output.append("")


def append_subsection(output: list[str], heading: str, content: list[str] | None = None, default: list[str] | None = None) -> None:
    output.append(heading)
    output.append("")
    block = clean_block(content or [])
    if block:
        output.extend(block)
    elif default:
        output.extend(default)
    output.append("")


def strip_nested_current_structure(lines: list[str]) -> list[str]:
    result: list[str] = []
    in_fence = False
    for line in lines:
        if FENCE_RE.match(line):
            in_fence = not in_fence
            result.append(line)
            continue
        if not in_fence:
            match = HEADING_RE.match(line)
            if match and len(match.group(1)) == 1 and match.group(2).strip() in CURRENT_ROOT_TITLES:
                break
        result.append(line)
    return clean_block(result)


def extract_current_structure(content_lines: list[str]) -> dict[str, list[str]] | None:
    top_sections = parse_sections(content_lines, split_levels={1})
    if not any(level == 1 and title in FOCUS_TITLES for level, title, _ in top_sections):
        return None

    result = {
        "focus": [],
        "todo": [],
        "process": [],
        "done": [],
        "record1": [],
        "record2": [],
        "weekly": [],
        "other": [],
        "life": [],
        "tomorrow": [],
    }

    for level, title, section_content in top_sections:
        if level != 1:
            continue
        if title in FOCUS_TITLES and not result["focus"]:
            result["focus"] = section_content
            continue
        if title == "待办任务" and not result["todo"]:
            result["todo"] = section_content
            continue
        if title in DONE_TITLES and not result["done"]:
            result["done"] = section_content
            continue
        if title in TOMORROW_TITLES and not result["tomorrow"]:
            result["tomorrow"] = section_content
            continue
        if title in FRAGMENT_TITLES and not (
            result["process"] or result["life"] or result["record1"] or result["record2"] or result["other"] or result["weekly"]
        ):
            fragment_sections = parse_sections(section_content, split_levels={2})
            for sub_level, sub_title, sub_content in fragment_sections:
                if sub_level != 2:
                    continue
                if sub_title in WORK_TITLES and not result["process"]:
                    result["process"] = sub_content
                elif sub_title in LIFE_TITLES and not result["life"]:
                    result["life"] = sub_content
                elif sub_title in EXTRA_TITLES and not result["weekly"]:
                    result["weekly"] = sub_content
                elif sub_title in SUPPLEMENT_TITLES:
                    supplement_sections = parse_sections(sub_content, split_levels={3})
                    for extra_level, extra_title, extra_content in supplement_sections:
                        if extra_level != 3:
                            continue
                        if extra_title in RECORD1_TITLES and not result["record1"]:
                            result["record1"] = extra_content
                        elif extra_title in RECORD2_TITLES and not result["record2"]:
                            result["record2"] = extra_content
                        elif extra_title in OTHER_TITLES and not result["other"]:
                            result["other"] = strip_nested_current_structure(extra_content)
            continue
    return result


def build_new_body(sections: dict[str, list[str]], intro: list[str]) -> list[str]:
    body: list[str] = []
    intro_block = sanitize_intro(intro)
    if intro_block:
        body.extend(intro_block)
        body.append("")
        body.append("")

    append_block(body, "# 今日重点", sections.get("focus"), default=["- "])
    append_block(body, "# 待办任务", sections["todo"], default=["- [ ]"])
    append_block(body, "# 今日完成", sections["done"], default=["- [x]"])

    body.append("# 碎片记录")
    body.append("")
    append_subsection(body, "## 工作 / 学习", sections["process"])
    append_subsection(body, "## 生活 / 想法", sections.get("life"))

    record1 = clean_block(sections["record1"])
    record2 = clean_block(sections["record2"])
    other = clean_block(sections["other"])
    weekly = clean_block(sections["weekly"])

    if record1 or record2 or other:
        body.append("## 补充记录")
        body.append("")
        if record1:
            body.append("### 记录 1")
            body.append("")
            body.extend(record1)
            body.append("")
        if record2:
            body.append("### 记录 2")
            body.append("")
            body.extend(record2)
            body.append("")
        if other:
            body.append("### 其他结构")
            body.append("")
            body.extend(other)
            body.append("")

    if weekly:
        body.append("## 附加索引")
        body.append("")
        body.extend(weekly)
        body.append("")

    append_block(body, "# 明日提示", sections.get("tomorrow"), default=["- "])

    while body and body[-1] == "":
        body.pop()
    return body


def migrate_text(text: str) -> tuple[str, bool]:
    newline = detect_newline(text)
    lines = text.splitlines()
    frontmatter, rest = split_frontmatter(lines)
    body_lines, footer = split_footer(rest)
    intro, content_lines = split_intro(body_lines)
    normalized_intro = sanitize_intro(intro)
    sections_raw = parse_sections(content_lines, split_levels={1, 2})

    content = {
        "focus": [],
        "todo": [],
        "process": [],
        "done": [],
        "record1": [],
        "record2": [],
        "weekly": [],
        "other": [],
        "life": [],
        "tomorrow": [],
    }

    current_sections = extract_current_structure(content_lines)
    if current_sections is not None:
        new_lines: list[str] = []
        if frontmatter:
            new_lines.extend(frontmatter)
            new_lines.append("")
        new_lines.extend(build_new_body(current_sections, normalized_intro))
        if footer:
            new_lines.append("")
            new_lines.append("")
            new_lines.extend(footer)
        normalized_text = newline.join(new_lines).rstrip() + newline
        return normalized_text, normalized_text != text

    has_old_structure = False
    for level, title, section_content in sections_raw:
        if title == "__preamble__":
            content["other"].extend(section_content)
            continue
        if POLLUTED_RE.match(f"{'#' * max(level, 1)} {title}"):
            has_old_structure = True
            continue
        if level == 1 and title in ROOT_TITLES:
            has_old_structure = True
            extracted = extract_from_root(section_content)
            for key in content:
                content[key].extend(extracted[key])
            continue
        if title in TODO_TITLES:
            has_old_structure = True
            content["todo"].extend(section_content)
            continue
        if title in PROCESS_TITLES:
            has_old_structure = True
            content["process"].extend(section_content)
            continue
        if title in DONE_TITLES:
            has_old_structure = True
            content["done"].extend(section_content)
            continue
        if title in RECORD1_TITLES:
            has_old_structure = True
            content["record1"].extend(section_content)
            continue
        if title in RECORD2_TITLES:
            has_old_structure = True
            content["record2"].extend(section_content)
            continue
        if title in WEEKLY_TITLES:
            has_old_structure = True
            content["weekly"].extend(section_content)
            continue
        content["other"].extend([f"{'#' * max(level, 1)} {title}"] + section_content)
        if content["other"] and content["other"][-1].strip():
            content["other"].append("")

    if not has_old_structure:
        if frontmatter and normalized_intro != intro:
            first_heading = next((line.strip() for line in content_lines if line.strip()), "")
            if first_heading == "# 今日重点":
                rebuilt: list[str] = []
                rebuilt.extend(frontmatter)
                rebuilt.append("")
                if normalized_intro:
                    rebuilt.extend(normalized_intro)
                    rebuilt.append("")
                    rebuilt.append("")
                rebuilt.extend(content_lines)
                if footer:
                    rebuilt.append("")
                    rebuilt.append("")
                    rebuilt.extend(footer)
                normalized_text = newline.join(rebuilt).rstrip() + newline
                return normalized_text, normalized_text != text
        return text, False

    new_lines: list[str] = []
    if frontmatter:
        new_lines.extend(frontmatter)
    new_body = build_new_body(content, normalized_intro)
    if frontmatter and new_body:
        new_lines.append("")
    new_lines.extend(new_body)
    if footer:
        new_lines.append("")
        new_lines.append("")
        new_lines.extend(footer)
    migrated = newline.join(new_lines).rstrip() + newline
    return migrated, migrated != text


def iter_files(paths: list[str]) -> list[Path]:
    result: list[Path] = []
    for raw_path in paths:
        path = Path(raw_path)
        if path.is_dir():
            result.extend(sorted(p for p in path.rglob("*.md") if p.is_file()))
        elif path.is_file() and path.suffix.lower() == ".md":
            result.append(path)
    return result


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(encoding="utf-8")

    parser = argparse.ArgumentParser(description="迁移旧版日记结构到新版模板结构。")
    parser.add_argument("paths", nargs="+", help="文件或目录路径")
    parser.add_argument("--dry-run", action="store_true", help="只输出变更摘要，不写回文件")
    parser.add_argument("--diff", action="store_true", help="输出 unified diff")
    args = parser.parse_args()

    changed_files: list[Path] = []
    for path in iter_files(args.paths):
        original = path.read_text(encoding="utf-8")
        migrated, changed = migrate_text(original)
        if not changed:
            continue
        changed_files.append(path)
        if args.diff:
            diff = difflib.unified_diff(
                original.splitlines(),
                migrated.splitlines(),
                fromfile=str(path),
                tofile=str(path),
                lineterm="",
            )
            print("\n".join(diff))
        if not args.dry_run:
            path.write_text(migrated, encoding="utf-8", newline="")

    print(f"changed={len(changed_files)}")
    for path in changed_files:
        print(path.as_posix())
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
