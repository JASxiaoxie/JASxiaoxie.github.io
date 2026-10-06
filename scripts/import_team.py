#!/usr/bin/env python3
"""只读读取协会名录，将公开职务和姓名转为独立维护数据。"""
import argparse
import json
import re
import xml.etree.ElementTree as ET
from pathlib import Path
from zipfile import ZipFile

NAMESPACE = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}


def cell_text(cell):
    # 保留原名录的换行，避免副职、部员与更换说明失去对应关系。
    return "\n".join(
        "".join(text.text or "" for text in paragraph.findall(".//w:t", NAMESPACE))
        for paragraph in cell.findall("w:p", NAMESPACE)
    ).strip()


def import_roster(source):
    # 仅读取 Word 内的表格，不提取照片或个人登记材料。
    with ZipFile(source) as archive:
        document = ET.fromstring(archive.read("word/document.xml"))
    generations, predecessors = [], []
    for table in document.findall(".//w:tbl", NAMESPACE):
        for row in table.findall("w:tr", NAMESPACE):
            cells = [cell_text(cell) for cell in row.findall("w:tc", NAMESPACE)]
            if not cells or not re.match(r"^\d{4}", cells[0]):
                continue
            years = re.findall(r"\d{4}", cells[0])
            if len(years) < 2:
                raise ValueError("名录学年缺少起止年份。")
            term = "—".join(years[:2])
            if len(cells) == 3:
                predecessors.append({"term": term, "leader": cells[1], "vice": cells[2]})
            elif len(cells) == 8:
                note = cells[0].split("【", 1)[1].rstrip("】") if "【" in cells[0] else ""
                generations.append({
                    "id": "-".join(years[:2]), "term": term,
                    "number": cells[1], "president": cells[2], "vice": cells[3], "note": note,
                    "departments": [
                        {"name": name, "members": value if value not in {"", "-"} else "暂无记录"}
                        for name, value in zip(["学术部", "观测部", "秘书部", "媒体设计部"], cells[4:])
                    ],
                })
            else:
                raise ValueError("名录列数发生变化，请先核对 Word 表格结构。")
    if not generations or not predecessors:
        raise ValueError("未找到完整的协会与前身名录，停止输出。")
    return {"source": source.name, "generations": generations, "predecessors": predecessors}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path, help="新版公开管理层名录的 Word 文件")
    parser.add_argument("--output", type=Path, default=Path(__file__).resolve().parents[1] / "_data/team.json")
    args = parser.parse_args()
    data = import_roster(args.source.resolve(strict=True))
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(data, ensure_ascii=False, indent=2, allow_nan=False) + "\n", encoding="utf-8")
    print(f"已整理 {len(data['generations'])} 届管理层与 {len(data['predecessors'])} 个前身学年。")


if __name__ == "__main__":
    main()
