#!/usr/bin/env python3
"""从只读角色素材生成完整画幅的网页副本，保留透明背景与原始动图。"""
import argparse
import hashlib
import json
from pathlib import Path
import re

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path, help="小邪素材根目录，原文件只读")
    parser.add_argument("--selection", type=Path, default=ROOT / "content/mascot-selection.json")
    args = parser.parse_args()
    source_root = args.source.resolve(strict=True)
    selection = json.loads(args.selection.read_text(encoding="utf-8"))
    destination = ROOT / "images/mascot"
    destination.mkdir(parents=True, exist_ok=True)
    provenance, seen = [], set()
    for asset in selection["assets"]:
        identifier = asset["id"]
        if not re.fullmatch(r"art-[0-9a-f]{12}", identifier) or identifier in seen:
            raise ValueError(f"素材编号无效或重复：{identifier}")
        seen.add(identifier)
        source = (source_root / asset["source"]).resolve(strict=True)
        # 清单只能读取素材根目录内的文件，摘要核对保证副本确实来自已选原稿。
        if not source.is_relative_to(source_root) or not source.is_file():
            raise ValueError(f"素材路径越界或不是文件：{asset['source']}")
        original_bytes = source.read_bytes()
        digest = hashlib.sha256(original_bytes).hexdigest()
        if identifier != "art-" + digest[:12]:
            raise ValueError(f"素材已变化，请先核对清单：{asset['source']}")
        variants = {}
        with Image.open(source) as original:
            animated = getattr(original, "n_frames", 1) > 1
            # 动图取首帧作为默认静态预览；PNG 的透明通道不铺白底。
            original.seek(0)
            art = ImageOps.exif_transpose(original).convert("RGBA")
            for suffix, maximum in [("", 2200), ("-thumb", 800)]:
                copy = art.copy()
                copy.thumbnail((maximum, maximum), Image.Resampling.LANCZOS)
                target = destination / f"{identifier}{suffix}.webp"
                temporary = destination / f".{target.name}.tmp"
                copy.save(temporary, format="WEBP", quality=90, method=4)
                temporary.replace(target)
                variants[suffix or "full"] = {
                    "path": target.relative_to(ROOT).as_posix(),
                    "width": copy.width, "height": copy.height, "bytes": target.stat().st_size,
                }
            if animated:
                # 保留 GIF 原始帧、时长与色彩；仅复制，不重新编码或覆盖原稿。
                target = destination / f"{identifier}.gif"
                temporary = destination / f".{target.name}.tmp"
                temporary.write_bytes(original_bytes)
                temporary.replace(target)
                variants["animation"] = {
                    "path": target.relative_to(ROOT).as_posix(), "frames": original.n_frames,
                    "width": original.width, "height": original.height, "bytes": len(original_bytes),
                }
        provenance.append({"id": identifier, "source": asset["source"], "sha256": digest, "variants": variants})
    record = ROOT / "content/mascot-media-provenance.json"
    record.parent.mkdir(parents=True, exist_ok=True)
    record.write_text(json.dumps(provenance, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    total = sum(v["bytes"] for item in provenance for v in item["variants"].values())
    print(f"已生成 {len(provenance)} 组角色副本，共 {total / 1024**2:.1f} MiB；原稿未修改。")


if __name__ == "__main__":
    main()
