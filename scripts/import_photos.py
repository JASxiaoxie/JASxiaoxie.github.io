#!/usr/bin/env python3
"""从只读素材生成网页尺寸副本，并记录相对来源与校验值。"""
import argparse
import hashlib
import json
import re
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path, help="素材根目录，原始照片始终只读")
    parser.add_argument("--selection", type=Path, default=ROOT / "content/media-selection.json")
    args = parser.parse_args()
    source_root = args.source.resolve(strict=True)
    selection = json.loads(args.selection.read_text(encoding="utf-8"))
    destination = ROOT / "images/photos"
    destination.mkdir(parents=True, exist_ok=True)
    provenance = []
    seen = set()
    for asset in selection["assets"]:
        identifier = asset["id"]
        if not re.fullmatch(r"photo-[0-9a-f]{12}", identifier) or identifier in seen:
            raise ValueError(f"素材编号无效或重复：{identifier}")
        seen.add(identifier)
        source = (source_root / asset["source"]).resolve(strict=True)
        # 确认读取范围属于选定素材目录，避免清单中的路径越界。
        if not source.is_relative_to(source_root) or not source.is_file():
            raise ValueError(f"素材路径越界或不是文件：{asset['source']}")
        digest = hashlib.sha256(source.read_bytes()).hexdigest()
        if identifier != "photo-" + digest[:12]:
            raise ValueError(f"素材已变化，请先核对选片清单：{asset['source']}")
        with Image.open(source) as original:
            # 校正相机的方向标记，只缩小网页副本，不改变构图、颜色或原文件。
            photo = ImageOps.exif_transpose(original).convert("RGB")
            variants = {}
            for suffix, maximum in [("", 2200), ("-thumb", 800)]:
                copy = photo.copy()
                copy.thumbnail((maximum, maximum), Image.Resampling.LANCZOS)
                target = destination / f"{identifier}{suffix}.webp"
                # 完整写入后再替换副本，避免预览监视器在压缩过程中读取空文件。
                temporary = destination / f".{target.name}.tmp"
                copy.save(temporary, format="WEBP", quality=88, method=4)
                temporary.replace(target)
                variants[suffix or "full"] = {
                    "path": target.relative_to(ROOT).as_posix(),
                    "width": copy.width, "height": copy.height, "bytes": target.stat().st_size,
                }
        provenance.append({"id": identifier, "source": asset["source"], "sha256": digest, "variants": variants})
    # 记录文件使用相对目录；不会将个人电脑路径和相机元数据写入网页。
    (ROOT / "content/media-provenance.json").write_text(
        json.dumps(provenance, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    total = sum(variant["bytes"] for item in provenance for variant in item["variants"].values())
    print(f"已生成 {len(provenance)} 组网页照片副本，共 {total / 1024**2:.1f} MiB；原始文件未修改。")


if __name__ == "__main__":
    main()
