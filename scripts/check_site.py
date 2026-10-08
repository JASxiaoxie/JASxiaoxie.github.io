#!/usr/bin/env python3
"""检查构建后的站内链接、图片与意外导出的本地资料。"""
import argparse
import hashlib
import json
import math
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit


class PageResources(HTMLParser):
    def __init__(self):
        super().__init__()
        self.paths = []
        self.slideshow_text = None
        self.map_text = None
        self.maps = []

    def handle_starttag(self, tag, attrs):
        fields = dict(attrs)
        for name in ('src', 'href', 'data-image', 'data-preview', 'data-thumbnail'):
            if fields.get(name):
                self.paths.append(fields[name])
        if fields.get('srcset'):
            # 响应式候选也要检查，避免仅某些手机或高像素屏出现缺图。
            self.paths.extend(candidate.strip().split()[0] for candidate in fields['srcset'].split(','))
        if tag == 'template' and 'data-slideshow-data' in fields:
            self.slideshow_text = ''
        if tag == 'script' and 'data-location-map-data' in fields:
            self.map_text = ''

    def handle_data(self, data):
        if self.slideshow_text is not None:
            self.slideshow_text += data
        if self.map_text is not None:
            self.map_text += data

    def handle_endtag(self, tag):
        if tag == 'template' and self.slideshow_text is not None:
            # 轮播中的非首张图片也必须存在，不能只检查封面。
            for entry in json.loads(self.slideshow_text):
                self.paths.append(entry['photo']['image'])
                self.paths.extend(entry[key] for key in ('preview', 'display') if entry.get(key))
            self.slideshow_text = None
        if tag == 'script' and self.map_text is not None:
            self.maps.append(json.loads(self.map_text))
            self.map_text = None


def check_map_data(data):
    """阻止坐标系统、经纬度范围和地图供应商配置错误进入正式页面。"""
    places = data.get('places', [])
    if not places or any(not place.get('id') for place in places) or len({place.get('id') for place in places}) != len(places):
        return '地点为空或编号重复'
    for place in places:
        for key, limit in (('latitude', 90), ('longitude', 180)):
            value = place.get(key)
            if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value) or abs(value) > limit:
                return f'{place.get("id")} 的 {key} 无效'
        if place.get('coordinate_system') != 'WGS84':
            return f'{place.get("id")} 必须先确认并转换为 WGS84 坐标'
        # 导航允许保留高德原始选点，但必须明确坐标系统，避免重复偏移。
        navigation = place.get('navigation')
        if navigation is not None:
            if navigation.get('coordinate_system') not in ('WGS84', 'GCJ02'):
                return f'{place.get("id")} 的导航坐标系统无效'
            for key, limit in (('latitude', 90), ('longitude', 180)):
                value = navigation.get(key)
                if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value) or abs(value) > limit:
                    return f'{place.get("id")} 的导航 {key} 无效'
    provider = data.get('map', {})
    link = urlsplit(data.get('data_url', ''))
    if link.scheme or link.netloc or not link.path.startswith('/') or not provider.get('attribution') or 'tile_url' in provider:
        return '底图必须使用本站数据，并保留来源署名'
    return ''


def check_local_map_files(data, root, baseurl):
    """核对随站发布的数据、来源与几何，避免重新引入外部底图或漏传文件。"""
    path = unquote(urlsplit(data['data_url']).path)
    if baseurl and path.startswith(baseurl + '/'):
        path = path[len(baseurl):]
    manifest_path = (root / path.lstrip('/')).resolve()
    if not manifest_path.is_relative_to(root):
        raise ValueError('底图清单超出发布目录')
    manifest = json.loads(manifest_path.read_text(encoding='utf-8'))
    if manifest.get('coordinate_system') != 'WGS84' or 'odbl' not in manifest.get('license', '').lower():
        raise ValueError('底图缺少坐标系统或 ODbL 许可')
    regions = manifest.get('regions', {})
    needed = [place['id'] for place in data['places']]
    if len(needed) > 1:
        needed.append('overview')
    if not all(key in regions for key in needed):
        raise ValueError('底图未包含全部展示地点')
    for key, region in regions.items():
        bounds = region.get('bbox', [])
        if len(bounds) != 4 or not all(isinstance(v, (int, float)) and not isinstance(v, bool) and math.isfinite(v) for v in bounds):
            raise ValueError(key + ' 的范围无效')
        west, south, east, north = bounds
        if not (-180 <= west < east <= 180 and -90 <= south < north <= 90):
            raise ValueError(key + ' 的范围顺序或数值无效')
        for place in data['places']:
            if key in (place['id'], 'overview') and not (west <= place['longitude'] <= east and south <= place['latitude'] <= north):
                raise ValueError(place['id'] + ' 在底图范围之外，需要补充真实数据')
        target = (manifest_path.parent / region['file']).resolve()
        if not target.is_relative_to(manifest_path.parent):
            raise ValueError('底图文件超出地图目录')
        content = target.read_bytes()
        if len(content) != region['bytes'] or hashlib.sha256(content).hexdigest() != region['sha256']:
            raise ValueError(key + ' 的底图大小或摘要不一致')
        collection = json.loads(content)
        if collection.get('type') != 'FeatureCollection' or not collection.get('features') or len(collection['features']) != region['feature_count']:
            raise ValueError(key + ' 的底图要素缺失')
        if collection.get('license') != manifest['license']:
            raise ValueError(key + ' 的数据许可与清单不同')
        for feature in collection['features']:
            geometry = feature.get('geometry', {})
            if geometry.get('type') not in ('Point', 'Polygon', 'MultiPolygon', 'MultiLineString'):
                raise ValueError(key + ' 有不支持的几何类型')
            stack = [geometry.get('coordinates', [])]
            while stack:
                item = stack.pop()
                if not isinstance(item, list) or not item:
                    raise ValueError(key + ' 有空的几何坐标')
                if isinstance(item[0], list):
                    stack.extend(item)
                elif len(item) != 2 or not all(isinstance(v, (int, float)) and not isinstance(v, bool) and math.isfinite(v) for v in item) or abs(item[0]) > 180 or abs(item[1]) > 90:
                    raise ValueError(key + ' 有无效的经纬度')


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
        for data in resources.maps:
            problem = check_map_data(data)
            if problem:
                failures.append(str(page.relative_to(root)) + '：地图数据错误 ' + problem)
            else:
                try:
                    check_local_map_files(data, root, args.baseurl)
                except (KeyError, ValueError, OSError) as error:
                    failures.append(str(page.relative_to(root)) + '：底图数据错误 ' + str(error))
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
