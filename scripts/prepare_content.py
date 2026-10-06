#!/usr/bin/env python3
"""验证活动数据，并为 Jekyll 生成独立活动地址。"""
import json
import re
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
GENERATED = ROOT / "_pages/generated_events"
MARKER = "# 由 scripts/prepare_content.py 生成；正文维护于 _data/events.json。"


def prepare():
    # 数据文件独立于模板，新增活动不需要改动 HTML 布局。
    events = json.loads((ROOT / "_data/events.json").read_text(encoding="utf-8"))
    categories = {item["id"] for item in json.loads((ROOT / "_data/categories.json").read_text(encoding="utf-8"))}
    if not isinstance(events, list):
        raise ValueError("活动数据必须为列表。")
    expected = set()
    documents = []
    for event in events:
        identifier = event.get("id", "")
        # 限制活动标识为网址片段，同时防止路径穿越或重复地址。
        if not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", identifier) or identifier in expected:
            raise ValueError(f"活动标识无效或重复：{identifier!r}")
        if event.get("category") not in categories:
            raise ValueError(f"活动分类未定义：{identifier}")
        if event.get("kind") not in {"intro", "archive"}:
            raise ValueError(f"活动内容类型未定义：{identifier}")
        # 允许保留历史详情而暂不显示列表卡片，且防止字符串被误当成开关。
        if "show_in_list" in event and not isinstance(event["show_in_list"], bool):
            raise ValueError(f"活动列表显示开关必须为布尔值：{identifier}")
        page_layout = event.get("page_layout", "event")
        if page_layout not in {"event", "competition"}:
            raise ValueError(f"活动页面布局未定义：{identifier}")
        permalink = event.get("url", f"/events/{identifier}/")
        if not re.fullmatch(r"/(?:[a-z0-9-]+/)+", permalink):
            raise ValueError(f"活动地址必须为站内路径：{identifier}")
        for field in ["title", "date", "location", "status", "summary", "body", "source"]:
            if not isinstance(event.get(field), str):
                raise ValueError(f"活动字段缺失或不是文本：{identifier}/{field}")
        if event["date"]:
            date.fromisoformat(event["date"])
        expected.add(identifier)
        header = {
            "layout": page_layout, "title": event["title"], "description": event["summary"],
            "permalink": permalink, "event_id": identifier, "nav": "events", "photo_viewer": True,
        }
        # JSON 字符串同样是合法 YAML 字符串，标题中的标点不会破坏元数据。
        content = "---\n" + MARKER + "\n" + "\n".join(f"{key}: {json.dumps(value, ensure_ascii=False)}" for key, value in header.items()) + "\n---\n"
        documents.append((identifier, content))
    GENERATED.mkdir(parents=True, exist_ok=True)
    for identifier, content in documents:
        target = GENERATED / f"{identifier}.md"
        if target.exists() and MARKER not in target.read_text(encoding="utf-8"):
            raise ValueError("目标页存在人工内容，停止覆盖。")
        if not target.exists() or target.read_text(encoding="utf-8") != content:
            target.write_text(content, encoding="utf-8")
    for target in GENERATED.glob("*.md"):
        # 只清理本程序拥有的生成页，路径必须位于独立生成目录中。
        if target.stem not in expected and target.resolve().parent == GENERATED.resolve() and MARKER in target.read_text(encoding="utf-8"):
            target.unlink()
    print(f"活动数据校验通过，已准备 {len(events)} 个详情页面。")


if __name__ == "__main__":
    prepare()
