from __future__ import annotations

import argparse
import os
from pathlib import Path

from dfindexeddb.indexeddb.chromium.record import DatabaseNameKey, FolderReader, ObjectStoreDataKey


def load_database_ids(reader: FolderReader) -> dict[str, int]:
    result: dict[str, int] = {}
    for record in reader.GetRecords(parse_value=True, load_blobs=False):
        if isinstance(record.key, DatabaseNameKey):
            result[str(record.key.database_name)] = int(record.value)
    return result


def collect_best_snapshots(reader: FolderReader, database_id: int) -> dict[str, tuple[float, str]]:
    snapshots: dict[str, tuple[float, str]] = {}
    for record in reader.GetRecords(parse_value=True, load_blobs=True):
        key = record.key
        if not isinstance(key, ObjectStoreDataKey):
            continue
        if key.key_prefix.database_id != database_id or key.key_prefix.object_store_id != 1:
            continue
        value = record.value.value if hasattr(record.value, "value") else record.value
        if not isinstance(value, dict):
            continue
        path = value.get("path")
        data = value.get("data")
        ts = value.get("ts", 0)
        if not isinstance(path, str) or not isinstance(data, str):
            continue
        current = snapshots.get(path)
        if current is None:
            snapshots[path] = (float(ts), data)
            continue
        current_ts, current_data = current
        current_len = len(current_data)
        new_len = len(data)
        if new_len > current_len or (new_len == current_len and ts >= current_ts):
            snapshots[path] = (float(ts), data)
    return snapshots


def main() -> int:
    parser = argparse.ArgumentParser(description="从 Obsidian IndexedDB backup 快照恢复指定文件。")
    parser.add_argument("paths", nargs="+", help="要恢复的文件路径")
    parser.add_argument(
        "--db-name",
        default="fdbf9acad0530f16-backup",
        help="IndexedDB backup 数据库名",
    )
    parser.add_argument(
        "--indexeddb-dir",
        default=os.path.expandvars(r"%APPDATA%\Obsidian\IndexedDB\app_obsidian.md_0.indexeddb.leveldb"),
        help="Obsidian IndexedDB leveldb 目录",
    )
    parser.add_argument("--dry-run", action="store_true", help="只输出将恢复的文件，不写回")
    args = parser.parse_args()

    reader = FolderReader(Path(args.indexeddb_dir))
    db_ids = load_database_ids(reader)
    if args.db_name not in db_ids:
        raise SystemExit(f"backup database not found: {args.db_name}")

    snapshots = collect_best_snapshots(reader, db_ids[args.db_name])
    restored = 0
    missing: list[str] = []

    for raw_path in args.paths:
        path = Path(raw_path)
        normalized = path.as_posix()
        snapshot = snapshots.get(normalized)
        if snapshot is None:
            missing.append(normalized)
            continue
        restored += 1
        print(normalized)
        if not args.dry_run:
            path.write_text(snapshot[1], encoding="utf-8", newline="")

    print(f"restored={restored}")
    if missing:
        print("missing:")
        for item in missing:
            print(item)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
