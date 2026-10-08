#!/usr/bin/env python3
"""为已公开的网页照片生成轻量副本；不读取或改写原始素材。"""
import argparse
import hashlib
import json
import re
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
VERSION = 1


def describe(path):
    # 宽度描述符使用实际像素宽度，竖幅照片不能把最长边当作宽度。
    with Image.open(path) as image:
        width, height = image.size
    return {"image": "/" + path.relative_to(ROOT).as_posix(),
            "width": width, "height": height, "bytes": path.stat().st_size}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="只检查清单和副本，不写入文件")
    args = parser.parse_args()
    manifest_path = ROOT / "_data/photo_variants.json"
    previous = json.loads(manifest_path.read_text()) if manifest_path.exists() else {}
    manifest = {}
    changed = 0
    for source in sorted((ROOT / "images/photos").glob("photo-*.webp")):
        if not re.fullmatch(r"photo-[0-9a-f]{12}\.webp", source.name):
            continue
        key = "/" + source.relative_to(ROOT).as_posix()
        digest = hashlib.sha256(source.read_bytes()).hexdigest()
        thumbnail = source.with_name(source.stem + "-thumb.webp")
        targets = {"small": source.with_name(source.stem + "-240.webp"),
                   "display": source.with_name(source.stem + "-1400.webp")}
        old = previous.get(key, {})
        current = old.get("source_sha256") == digest and old.get("version") == VERSION
        current = current and all(path.is_file() for path in targets.values())
        if not current:
            if args.check:
                raise SystemExit(f"缺少或过期的轻量图片，请运行本脚本生成：{source.name}")
            with Image.open(source) as image:
                # 保持完整画幅与颜色，仅缩小网页副本；清晰大图和既有缩略图不变。
                for kind, maximum, quality in (("small", 240, 75), ("display", 1400, 82)):
                    copy = image.copy()
                    copy.thumbnail((maximum, maximum), Image.Resampling.LANCZOS)
                    target = targets[kind]
                    temporary = target.with_name("." + target.name + ".tmp")
                    copy.save(temporary, format="WEBP", quality=quality, method=6)
                    temporary.replace(target)
            changed += 1
        record = {"version": VERSION, "source_sha256": digest,
                  "thumbnail": describe(thumbnail),
                  **{kind: describe(path) for kind, path in targets.items()}}
        if args.check and record != old:
            raise SystemExit(f"尺寸或大小与轻量图片清单不符：{source.name}")
        manifest[key] = record
    if args.check:
        if manifest != previous:
            raise SystemExit("图片清单包含已移除的源文件，请重新生成清单。")
    else:
        # 清单随源码发布，新电脑无需原始素材即可复现；无变化时不触发预览重建。
        content = json.dumps(manifest, ensure_ascii=False, indent=2) + "\n"
        if not manifest_path.exists() or manifest_path.read_text() != content:
            temporary = manifest_path.with_suffix('.json.tmp')
            temporary.write_text(content, encoding="utf-8")
            temporary.replace(manifest_path)
    total = sum(item[kind]["bytes"] for item in manifest.values() for kind in ("small", "display"))
    print(f"轻量图片{'检查通过' if args.check else '已准备'}：{len(manifest)} 组，更新 {changed} 组，新增副本共 {total / 1024**2:.1f} MiB。")


if __name__ == "__main__":
    main()
