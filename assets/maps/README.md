# 天协网站的本地地图数据

这些 GeoJSON 文件与网页一起托管。访客浏览地图时只读取本站文件，无需连接外部底图服务器或申请地图密钥。

数据来自 **© OpenStreetMap contributors**，通过 [Overpass API](https://overpass-api.de/) 提取。原始数据及这里经过筛选、简化、分组的衍生数据库均按 [Open Database License 1.0（ODbL）](https://opendatacommons.org/licenses/odbl/1-0/) 提供。此目录的数据许可独立于网站代码的 MIT 许可；复制或修改数据时请保留来源、署名与 ODbL 许可。

## 数据范围与用途

| 文件 | 范围与内容 |
| --- | --- |
| `overview.geojson` | 长春及周边总览，主要公路、铁路、水系、城镇 |
| `campus.geojson` | 吉林大学前卫南区周边，道路、建筑、地表与地名 |
| `observatory.geojson` | 北十字天文台周边，可获得的道路与前进乡地名 |
| `field.geojson` | 大酱缸村农家乐周边，可获得的道路、水体、地表与村屯地名 |
| `manifest.json` | 各文件范围、查询原文、原始响应与结果摘要、OSM 数据时间、大小与要素数量 |

坐标为 WGS84，GeoJSON 坐标顺序为 `[经度, 纬度]`。道路没有人为补画，乡村地区未被 OSM 收录的小路和建筑可能缺失；这里只用于展示地点与周边概况，不提供路径规划、实时路况或卫星影像。活动点位单独维护在 `_data/locations.json`，其来源不属于 OSM 数据。

浏览范围有限，地图不会自动更新。总览保留主要交通，放大到三个地点周边时叠加详图。天文台默认使用较宽视角，便于看见前进乡和周边道路。画面中保留 OpenStreetMap / ODbL 署名。

## 重新制作数据

在项目根目录运行 `python3 scripts/build_maps.py`，可从已有本地缓存重建。没有缓存时，明确使用 `--download` 才会查询有限区域的原始矢量数据；日常预览、构建和部署不调用 Overpass API。原始缓存保存在不公开的 `local/maps/raw/`。

需更新到新数据时，用新的缓存目录保留旧记录，例如：

```sh
python3 scripts/build_maps.py --download --cache local/maps/raw-2027-10
```

区域和简化容差定义在 `scripts/map-regions.json`；`bbox` 顺序为 `[西, 南, 东, 北]`，单位为度。总览线段简化容差 35 米，详图 1.5 或 2 米；坐标保留小数点后六位。相同属性的线段合并成 MultiLineString，仍然保留各自坐标，不连接不相邻道路；属性中的 `osm_way_ids` 可追溯到原对象。保留闭合区域和有归属的水体内环，不补画缺失几何。具体 OSM 快照时间与查询摘要以 `manifest.json` 为准。

不要从公共 `tile.openstreetmap.org` 批量下载瓦片。这里只有少数固定区域的原始数据提取，维护脚本串行查询并缓存；网站运行时不会访问公共查询服务。变更范围后重新制作数据、检查三个页面、构建并运行资源检查，再随代码一起发布。新地点超出现有范围时须补充真实数据，不能只扩大空白画布。
