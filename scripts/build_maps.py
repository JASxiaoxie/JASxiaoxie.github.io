#!/usr/bin/env python3
"""从有限范围的 OSM 原始矢量数据生成本站地图；不下载公共地图瓦片。"""
import argparse
from collections import defaultdict
import hashlib
import json
import math
from pathlib import Path
import time
import urllib.parse
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
ENDPOINT = 'https://overpass-api.de/api/interpreter'
LICENSE = 'https://opendatacommons.org/licenses/odbl/1-0/'


def query_for(region):
    """总览只取主要交通和地名，周边详图增加实际道路、建筑与地表。"""
    west, south, east, north = region['bbox']
    box = f'({south},{west},{north},{east})'
    roads = '.' if region['detail'] else '^(motorway|trunk|primary|secondary)(_link)?$'
    places = '.' if region['detail'] else '^(city|town)$'
    lines = [f'way[highway~"{roads}"]{box};', f'way[railway=rail]{box};',
             f'way[waterway~"^(river|canal)$"]{box};', f'way[natural=water]{box};',
             f'relation[type=multipolygon][natural=water]{box};', f'node[place~"{places}"]{box};']
    if region['detail']:
        lines += [f'way[building]{box};', f'way[landuse]{box};',
                  f'way[leisure~"^(park|garden|pitch)$"]{box};',
                  f'way[amenity=university]{box};', f'way[natural=wood]{box};']
    return '[out:json][timeout:45][maxsize:134217728];(' + ''.join(lines) + ');out body geom;'


def load_raw(key, region, cache, download):
    """按查询摘要缓存原始响应；网络下载必须由维护者显式开启。"""
    query = query_for(region)
    digest = hashlib.sha256(query.encode()).hexdigest()
    path = cache / f'{key}-{digest[:12]}.json'
    if not path.exists():
        if not download:
            raise SystemExit(f'缺少原始缓存 {path}；如需更新，使用 --download。')
        request = urllib.request.Request(ENDPOINT + '?' + urllib.parse.urlencode({'data': query}), headers={
            'User-Agent': 'JLAS-local-map-build/1.0 (https://github.com/JASxiaoxie/JASxiaoxie.github.io)',
            'Accept': 'application/json'})
        print(f'读取 {key} 的有限区域原始数据……', flush=True)
        with urllib.request.urlopen(request, timeout=60) as response:
            raw = response.read()
        parsed = json.loads(raw)
        if parsed.get('remark') or not parsed.get('elements'):
            raise SystemExit(f'{key} 查询未完整成功：{parsed.get("remark", "没有要素")}')
        cache.mkdir(parents=True, exist_ok=True)
        path.write_bytes(raw)
        # 公共查询服务有冷却时间，维护时串行读取少数区域，不作为网站后台。
        time.sleep(10)
    raw = path.read_bytes()
    return json.loads(raw), {'query': query, 'query_sha256': digest, 'raw_sha256': hashlib.sha256(raw).hexdigest()}


def coordinates(geometry):
    """GeoJSON 采用经度在前；拒绝坏点，避免把缺失坐标连成假道路。"""
    result = []
    for point in geometry:
        lon, lat = point.get('lon'), point.get('lat')
        if not all(isinstance(v, (int, float)) and math.isfinite(v) for v in (lon, lat)):
            return []
        if abs(lon) > 180 or abs(lat) > 90:
            return []
        pair = [round(lon, 6), round(lat, 6)]
        if not result or pair != result[-1]:
            result.append(pair)
    return result


def simplify(points, tolerance):
    """用局部米制近似执行 RDP 简化，保留首尾与超出容差的折点。"""
    if len(points) <= 2:
        return points
    scale_x = 111320 * math.cos(math.radians(points[0][1]))
    scale_y = 111320
    projected = [(p[0] * scale_x, p[1] * scale_y) for p in points]
    keep, stack = {0, len(points) - 1}, [(0, len(points) - 1)]
    while stack:
        start, end = stack.pop()
        ax, ay = projected[start]
        bx, by = projected[end]
        dx, dy = bx - ax, by - ay
        length = dx * dx + dy * dy
        farthest, largest = None, tolerance * tolerance
        for index in range(start + 1, end):
            px, py = projected[index]
            fraction = max(0, min(1, ((px - ax) * dx + (py - ay) * dy) / length)) if length else 0
            distance = (px - ax - fraction * dx) ** 2 + (py - ay - fraction * dy) ** 2
            if distance > largest:
                farthest, largest = index, distance
        if farthest is not None:
            keep.add(farthest)
            stack.extend([(start, farthest), (farthest, end)])
    return [points[index] for index in sorted(keep)]


def join_rings(segments):
    """按真实端点拼接关系成员，只接受闭合环，不补画缺失边界。"""
    pending = [segment[:] for segment in segments if len(segment) >= 2]
    rings = []
    while pending:
        ring = pending.pop()
        while ring[0] != ring[-1]:
            for index, other in enumerate(pending):
                if ring[-1] == other[0]:
                    ring.extend(other[1:])
                elif ring[-1] == other[-1]:
                    ring.extend(other[-2::-1])
                elif ring[0] == other[-1]:
                    ring = other[:-1] + ring
                elif ring[0] == other[0]:
                    ring = other[:0:-1] + ring
                else:
                    continue
                pending.pop(index)
                break
            else:
                break
        if len(ring) >= 4 and ring[0] == ring[-1]:
            rings.append(ring)
    return rings


def point_in_ring(point, ring):
    """射线交点奇偶性用于归属内环，不改变湖泊实际边界。"""
    x, y = point
    inside = False
    for a, b in zip(ring, ring[1:]):
        if (a[1] > y) != (b[1] > y) and x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]:
            inside = not inside
    return inside


def make_features(raw, region):
    """仅保留可绘制的真实对象和必要标签；OSM 编号用于追溯。"""
    features = []
    for element in raw['elements']:
        tags = element.get('tags', {})
        props = {key: tags[key] for key in ('highway', 'railway', 'waterway', 'natural', 'landuse',
                  'leisure', 'building', 'amenity', 'place', 'ref') if key in tags}
        name = tags.get('name:zh') or tags.get('name')
        if name:
            props['name'] = name
        geometry = None
        if element['type'] == 'node':
            points = coordinates([element])
            if points:
                geometry = {'type': 'Point', 'coordinates': points[0]}
        elif element['type'] == 'way':
            points = coordinates(element.get('geometry', []))
            closed = len(points) >= 4 and points[0] == points[-1]
            area = closed and not tags.get('highway') and not tags.get('railway') and not tags.get('waterway')
            simple = simplify(points, region['simplify_m'])
            if area and len(simple) >= 4:
                geometry = {'type': 'Polygon', 'coordinates': [simple]}
            elif len(simple) >= 2:
                geometry = {'type': 'LineString', 'coordinates': simple}
        elif element['type'] == 'relation':
            roles = {'outer': [], 'inner': []}
            for member in element.get('members', []):
                role = member.get('role') or 'outer'
                if role in roles and member['type'] == 'way':
                    roles[role].append(coordinates(member.get('geometry', [])))
            outers, inners = join_rings(roles['outer']), join_rings(roles['inner'])
            polygons = []
            for outer in outers:
                rings = [outer] + [inner for inner in inners if point_in_ring(inner[0], outer)]
                simple = [simplify(ring, region['simplify_m']) for ring in rings]
                if len(simple[0]) >= 4:
                    polygons.append([ring for ring in simple if len(ring) >= 4])
            if polygons:
                geometry = {'type': 'MultiPolygon', 'coordinates': polygons}
        if geometry:
            features.append({'type': 'Feature', 'id': f'{element["type"]}/{element["id"]}',
                             'properties': props, 'geometry': geometry})
    # 同属性的实际线段归入 MultiLineString，减少重复标签，线段之间不补连接。
    groups = defaultdict(list)
    retained = []
    for feature in features:
        if feature['geometry']['type'] == 'LineString':
            signature = json.dumps(feature['properties'], ensure_ascii=False, sort_keys=True)
            groups[signature].append(feature)
        else:
            retained.append(feature)
    for signature, segments in groups.items():
        retained.append({'type': 'Feature', 'properties': {**json.loads(signature),
            'osm_way_ids': [int(segment['id'].split('/')[1]) for segment in segments]},
            'geometry': {'type': 'MultiLineString', 'coordinates': [segment['geometry']['coordinates'] for segment in segments]}})
    return {'type': 'FeatureCollection', 'bbox': region['bbox'], 'features': retained,
            'license': LICENSE, 'attribution': '© OpenStreetMap contributors'}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--download', action='store_true', help='显式允许查询缺少缓存的有限区域')
    parser.add_argument('--cache', type=Path, default=ROOT / 'local/maps/raw')
    parser.add_argument('--output', type=Path, default=ROOT / 'assets/maps')
    args = parser.parse_args()
    regions = json.loads((Path(__file__).with_name('map-regions.json')).read_text(encoding='utf-8'))
    manifest = {'version': 1, 'source': 'OpenStreetMap / Overpass API', 'endpoint': ENDPOINT,
                'license': LICENSE, 'coordinate_system': 'WGS84', 'regions': {}}
    args.output.mkdir(parents=True, exist_ok=True)
    for key, region in regions.items():
        raw, provenance = load_raw(key, region, args.cache, args.download)
        collection = make_features(raw, region)
        if not collection['features']:
            raise SystemExit(f'{key} 没有有效地图要素，停止生成。')
        content = json.dumps(collection, ensure_ascii=False, separators=(',', ':')).encode('utf-8')
        path = args.output / f'{key}.geojson'
        path.write_bytes(content)
        manifest['regions'][key] = {**region, **provenance, 'file': path.name,
            'sha256': hashlib.sha256(content).hexdigest(), 'bytes': len(content),
            'feature_count': len(collection['features']), 'osm_timestamp': raw['osm3s']['timestamp_osm_base']}
        print(f'{key}: {len(collection["features"])} 个要素，{len(content) / 1024:.0f} KiB', flush=True)
    (args.output / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


if __name__ == '__main__':
    main()
