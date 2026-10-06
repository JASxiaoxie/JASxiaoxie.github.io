#!/usr/bin/env python3
"""检查构建后的站内链接、图片与意外导出的本地资料。"""
import argparse
import json
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit


class PageResources(HTMLParser):
    def __init__(self):
        super().__init__()
        self.paths = []
        self.slideshow_text = None

    def handle_starttag(self, tag, attrs):
        fields = dict(attrs)
        for name in ('src', 'href', 'data-image'):
            if fields.get(name):
                self.paths.append(fields[name])
        if tag == 'template' and 'data-slideshow-data' in fields:
            self.slideshow_text = ''

    def handle_data(self, data):
        if self.slideshow_text is not None:
            self.slideshow_text += data

    def handle_endtag(self, tag):
        if tag == 'template' and self.slideshow_text is not None:
            # 轮播中的非首张图片也必须存在，不能只检查封面。
            for photo in json.loads(self.slideshow_text):
                self.paths.append(photo['image'])
            self.slideshow_text = None


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('directory', type=Path)
    parser.add_argument('--baseurl', default='')
    args = parser.parse_args()
    root = args.directory.resolve(strict=True)
    failures = []
    for private in ('content', 'local', 'scripts', '.github', '.bundle', 'vendor'):
        if (root / private).exists():
            failures.append('导出包含本地维护目录：' + private)
    pages = list(root.rglob('*.html'))
    if not pages:
        failures.append('没有生成 HTML 页面')
    for page in pages:
        document = page.read_text(encoding='utf-8')
        if 'http://127.0.0.1:' in document or 'http://localhost:' in document:
            failures.append('正式页面仍含本地网址：' + str(page.relative_to(root)))
        resources = PageResources()
        resources.feed(document)
        for value in resources.paths:
            link = urlsplit(value)
            if link.scheme or link.netloc or not link.path:
                continue
            path = unquote(link.path)
            if args.baseurl and path.startswith(args.baseurl + '/'):
                path = path[len(args.baseurl):]
            target = root / path.lstrip('/') if path.startswith('/') else page.parent / path
            target = target.resolve()
            # 验证路径仍在发布目录内，目录形式的页面应有 index.html。
            if not target.is_relative_to(root):
                failures.append('链接超出发布目录：' + value)
                continue
            if target.is_dir():
                target = target / 'index.html'
            if not target.is_file() or target.stat().st_size == 0:
                failures.append(str(page.relative_to(root)) + '：缺失或空文件 ' + value)
    if failures:
        raise SystemExit('\n'.join(sorted(set(failures))))
    print(f'发布检查通过：{len(pages)} 个页面，站内资源完整，本地资料未导出。')


if __name__ == '__main__':
    main()
