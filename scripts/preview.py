#!/usr/bin/env python3
"""启动仅在本机访问的 Jekyll 预览，自动刷新活动详情。"""
import argparse
import os
import shutil
import signal
import subprocess
import sys
import threading
from pathlib import Path

from prepare_content import prepare

ROOT = Path(__file__).resolve().parents[1]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--port", type=int, default=4173)
    parser.add_argument("--bundle-path", type=Path, help="可选的本机 Ruby 依赖缓存；项目内容不依赖此路径")
    args = parser.parse_args()
    if not 1024 <= args.port <= 65535:
        parser.error("端口应在 1024—65535 之间。")
    prepare()
    if not shutil.which("bundle"):
        raise SystemExit("未找到 bundle。请先安装 Ruby 与 Bundler，参见 README.md。")
    environment = os.environ.copy()
    # 即使终端继承正式构建环境，本机预览也不发送访问统计。
    environment["JEKYLL_ENV"] = "development"
    if args.bundle_path:
        environment["BUNDLE_PATH"] = str(args.bundle_path.resolve(strict=True))
    configuration = ROOT / "local/preview.yml"
    configuration.parent.mkdir(exist_ok=True)
    configuration.write_text(f'url: "http://127.0.0.1:{args.port}"\nbaseurl: ""\n', encoding="utf-8")
    command = ["bundle", "exec", "jekyll", "serve", "--config", "_config.yml,local/preview.yml", "--host", "127.0.0.1", "--port", str(args.port), "--strict_front_matter"]
    # 管理层只需修改活动数据，监视器会补充或撤去相应详情网址。
    stop = threading.Event()
    def watch_data():
        source = ROOT / "_data/events.json"
        previous = source.stat().st_mtime_ns
        while not stop.wait(0.8):
            changed = source.stat().st_mtime_ns
            if changed == previous:
                continue
            previous = changed
            try:
                prepare()
            except (ValueError, OSError) as exc:
                print(f"活动数据未更新成功：{exc}", file=sys.stderr, flush=True)
    thread = threading.Thread(target=watch_data, daemon=True)
    thread.start()
    process = subprocess.Popen(command, cwd=ROOT, env=environment)
    print(f"\n本地预览：http://127.0.0.1:{args.port}/\n按 Ctrl+C 停止。", flush=True)
    try:
        return_code = process.wait()
    except KeyboardInterrupt:
        process.send_signal(signal.SIGINT)
        try:
            process.wait(timeout=6)
        except subprocess.TimeoutExpired:
            process.terminate()
        return_code = 0
    finally:
        stop.set()
    raise SystemExit(return_code)


if __name__ == "__main__":
    main()
