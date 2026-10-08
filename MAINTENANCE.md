# 给下一届管理层的维护说明

遇到不懂的地方，可以问 AI。将仓库和 [给 AI 的维护与发布指南](AI_MAINTENANCE.md) 一起交给它，说明已确认的资料，以及这次只做本地预览还是需要发布；可直接使用 [README 中的提问模板](README.md#不懂的地方可以问-ai)。

## 先找到内容，再修改页面

日常活动、名单与图片位置都保存在 `_data/` 中的 JSON 文件，页面会自动使用这些数据。中文文字直接保留，正文换行使用 `\n`，保留英文双引号、逗号和方括号。

先复制项目作备份，再维护内容。原始 Word、PDF、照片与会员资料不放在网页工程里；只将要展示的公开内容和图片副本放入网站。

## 记录一次活动，或修改活动介绍

给路边天文、学习班等已有类型新增一次活动时，通常只需在 `_data/albums.json` 的对应相册中增加照片，并为同一场活动填写相同的 `drawer_key`、日期和介绍。页面会自动增加一条日期记录；不需要为每场活动复制一个类型入口。具体字段见下文“维护活动照片与摄影作品”。

需要修改某类活动的介绍，或确实需要一个独立详情地址时，再维护 `_data/events.json`。新增独立详情可以复制一条相近记录，并按以下字段核对：

| 字段 | 含义 |
|---|---|
| `id` | 只用小写英文、数字和短横线，不能与现有活动重复 |
| `title` | 活动标题 |
| `category` | `sidewalk` 路边天文、`class` 学习班、`joint` 联合活动、`field` 野外观测、`competition` 大天赛 |
| `kind` | `intro` 为常设活动介绍，`archive` 为已确认的历史记录 |
| `show_in_list` | 可选，省略或 `true` 时显示卡片，`false` 时仅保留详情地址 |
| `date` | 确认的日期，格式 `2026-10-05`；常设介绍留空 |
| `location` | 可公开的地点或活动形式；留空时详情不显示该项 |
| `status` | 与记录对应的状态文字 |
| `summary` | 列表中的短简介 |
| `body` | 活动正文，可用 Markdown 标题与列表 |
| `source` | 信息来源 |
| `image` | 封面大图的相对站点路径 |
| `thumbnail` | 列表缩略图；省略时使用 `image` |
| `album` | `_data/albums.json` 中的相册键 |
| `url` | 可选的独立地址；大天赛为 `/competition/` |
| `page_layout` | 默认 `event`；大天赛使用 `competition` |

预览脚本会生成 `/events/<id>/`。`_pages/generated_events/` 由程序维护，不手动写正文。新增未来通知的状态与报名字段尚未实现，应先完善数据定义与页面，而不是把未来活动当成已结束记录。

天文学习班与路边天文目前各展示一个统一介绍入口，不按主题拆分类型。点击活动类别直接进入专页，先展示介绍与参与方式，再把每一次活动按日期收进可点击的日期记录。点开后在页面中央的小窗中浏览该次活动与照片。旧的 `?category=` 地址自动转到相应专页。已有相关记录的 `show_in_list` 为 `false`，暂作资料保留。路边天文介绍不填写固定地点，实际安排以当期通知为准。

大天赛使用单独的 `competition` 分类与 `/competition/` 页面，不放入联合活动。2024、2025 年参赛记录按年份收进抽屉，校内天文知识竞赛另作一组，页面文字保存在 `competition.json` 中。比赛的年份与届次依据已给资料，奖项没有确认时不补写。

历届获奖记录维护在 `competition.json` 的 `awards` 数组中。每条包含 `year` 年份、`edition` 届次、`host` 承办学校、`awards` 奖项列表和 `source` 资料来源。每个奖项保存原文 `label` 与获奖者 `recipient`；缺失姓名留空。页面按年份由新到旧展示，目前已录入 2011—2019 年汇总与既有的 2024 年特等奖记录。原始获奖表截图保存在 `content/references/competition-awards-2011-2019.png`，仅作为本地维护依据，不参与网站导出。

## 更新观测地点与地图

地点统一保存在 `_data/locations.json` 的 `places` 中。首页 `/#our-sky` 展示三处总览；天文台 `/observatory/#observatory-location` 和野外观测 `/events/field-observing/#field-location` 各显示自己的地点。修改同一条记录后，地图、地址与高德地图入口一起更新。

| 字段 | 填写方式 |
| --- | --- |
| `id` | 稳定编号；目前为 `campus`、`observatory`、`field`，页面用它筛选地点 |
| `name` / `short_name` | 完整展示名称 / 地图中的简短名称 |
| `number` / `kind` | 列表序号 / 地点类型 |
| `address` / `description` | 已确认的公开地址 / 简短介绍 |
| `latitude` / `longitude` | 纬度 / 经度，JSON 数字，不能互换 |
| `coordinate_system` | 目前必须为 `WGS84`；高德、腾讯或百度坐标须先正确转换，不能直接改标签 |
| `coordinate_source` | 坐标来源、精度和核对范围，便于后来的人追查 |
| `zoom` | 地点默认缩放级别；校园和农家乐为 14，天文台为 12，便于同时看到前进乡与周边道路 |
| `page_url` / `page_label` | 首页地点卡片进入相应栏目的站内地址 / 链接文字 |
| `navigation` | 可选的导航原始坐标，包含 `latitude`、`longitude` 和 `coordinate_system`（`WGS84` 或 `GCJ02`）；高德重新选点时保留 GCJ02 原值，无此字段则使用主坐标 |

2026-10-07 录入：前卫南区使用 OpenStreetMap 校区范围中心，仅用于总览，不代表活动集合点；天文台使用维护者提供的手机照片 GPS 定位 `44.00892, 124.27826`。野外观测最初的照片坐标稍偏，维护者后来在高德卫星图重新选定农家乐，主干道支路尽头有两幢民房：东经 `125.652192`、北纬 `43.104785`（GCJ-02）。导航保留这组原值，本站底图使用 [eviltransform 的逆转换算法](https://github.com/googollee/eviltransform)得到 WGS84 主坐标，算法换算不能描述成实地测量。活动出行仍以当期通知为准，不把大酱缸村自动标成每场历史活动的地点。

地图组件为 `_includes/location-map.html`，样式与交互在 `assets/css/maps.css`、`assets/js/maps.js`。首页与天文台用页面头部 `location_map: true` 加载地图资源；野外观测由布局按 `page.event_id == 'field-observing'` 加载。新增带地图的页面也须开启这个字段，不能只插入组件。

Leaflet 1.9.4 和底图均随网站自托管，无需申请密钥。`map.data_url` 指向 `assets/maps/manifest.json`，`map.attribution` 保存画面内署名；访客浏览时只请求本站文件，不连接第三方底图或查询服务。底图采用 OpenStreetMap 的原始矢量数据，按 ODbL 许可提供，来源、范围和更新方法见 [地图数据说明](assets/maps/README.md)。

总览显示细线主要路网与城市名称；放大后增加乡镇、村屯与道路名称，并在三个地点周边叠加详图。数据是有限区域的快照，不会自动更新，乡村小路和建筑可能未被收录，导航仍使用高德入口。地图数据变更后随源码一起提交；地点超出已有范围时，还需补充真实地图数据。

日常预览无需重新制作底图。有原始缓存时运行 `python3 scripts/build_maps.py`；首次提取或更新使用 `--download`，更新可指定新的 `--cache` 目录保留旧缓存。范围与容差维护在 `scripts/map-regions.json`。脚本只读取少数固定区域的原始数据，不下载公共地图瓦片。原始响应放在 `local/maps/raw/`，生成的四个 GeoJSON、清单和数据许可说明保存在 `assets/maps/`。地址、导航入口与加载失败提示独立于地图。

手机端默认让页面正常滚动，轻触“探索地图”后才能拖动；“结束浏览”恢复页面滚动。地图不截获鼠标滚轮，支持缩放按钮、地点切换与减少动态偏好。修改后检查三个页面、地点选中、总览复位、手机开关和高德链接，再按现有流程构建与发布。

## 会徽与品牌图形

网站会徽统一使用 `images/brand/emblem.jpg`，来源为指定的星月会徽原图副本，不使用带小邪的会徽版本。看板娘小邪有独立的 `/xiaoxie/` 页面，也用于协会介绍与入会页面。

## 小邪的故事与插画

小邪页在 `_pages/xiaoxie.html`，文字和作品维护在 `_data/mascot.json`。导航、首页的小邪图片与“关于天协”都能进入该页；角色故事与实际协会历史分开描述。

- `intro`、`tagline`、`hero` 为角色概况与主图；`motifs` 是月亮、土星环、棒旋星系与星星四项形象设定。
- `story` 保留六段角色背景，来自《小邪背景人设.docx》；`index` 为章节序号，`title`、`text` 为标题与正文。
- `illustrations` 为单人插画，`band` 为宽幅乐队作品，`collaborations` 为联动作品；`sketches` 每组保存 `key`、`title`、`draft` 与 `finished`。
- 每幅作品包含唯一的素材 `id`、便于引用的 `key`、`title`、`label`、`alt`、`image`、`thumbnail`、实际大图 `width` / `height` 与可选 `note`。重复展示同一作品时，浏览序列使用不同的键。未确认的画师、生日日期或合作背景不猜测。
- 插画和草稿完整显示，保留原图中的字样与签名，透明背景保留透明通道。`animation` 可指向真实 GIF，默认显示静态首帧，点“播放动图”后播放，点“暂停动图”或离开画面后恢复静态；无脚本时仍可打开原动图。

新增插画时先准备网页副本，放入 `images/mascot/`，再更新数据。静态大图最长边 2200、缩略图 800 像素，WebP 质量 90；原稿只读，GIF 原样复制。需要重建时，在有 Pillow 的 Python 环境中运行：

```sh
python3 scripts/import_mascot.py /小邪素材的实际路径 --selection /选片清单的实际路径.json
```

选片清单格式为 `{"assets": [{"id": "art-原稿SHA256前12位", "source": "相对素材路径"}]}`。本地清单与来源记录位于 `content/mascot-selection.json`、`content/mascot-media-provenance.json`，原始故事依据在 `content/references/xiaoxie-source-notes.md`；这些本地文件不随网站发布，交接时另行保存。脚本只生成副本，不自动向 `mascot.json` 增加作品。

## 更新群聊与新媒体入口

公开联系入口统一维护在 `_data/contact.json` 的 `channels` 数组中，加入页和全站页脚会自动同步。`name` 是展示的群名或账号名，`value` 是复制内容，`description` 和 `instruction` 是介绍及关注方式，`url` 是已确认的主页地址。没有链接时保持空字符串，不填写猜测的地址。

当前 QQ 群为“吉林大学天文协会2026”，群号 `298485520`；公众号为“JAS天协的小邪”，二维码存放在 `images/contact/wechat-qr.png`，也可按名称搜索；B站为“天协的小邪”，主页为 `https://space.bilibili.com/103719333`。

QQ群原图副本存放在 `images/contact/qq-group-2026.jpg`。页面只用 CSS 显示原图中的二维码区域，放大时仍使用相同原图；不要重绘、调色或重复压缩。更换二维码时更新 `qr_image`；若新图本身就是方形二维码，删除 `qr_crop` 即可完整显示。若使用含二维码的长图，`qr_crop` 记录原图宽高、显示区域的 `x` / `y` 左上角和正方形 `size`，单位为像素，四周需保留足够白边。

账号截图、二维码原图与校验记录保存在 `content/references/contact-channels/`，仅作本地维护依据，不参与网站导出。换届时先确认群是否继续使用，再更新群名、群号、二维码及说明。

## 换届时更新名单

在 `_data/team.json` 的 `generations` 末尾追加一届，保留原届次。年份与任期按真实资料填写；网站将最后一届显示为当前任期。

管理层页顶部的现任会长介绍从 `_data/people.json` 中按本届会长姓名匹配，包含照片、简短介绍与个人主页。换届时增添新会长的资料；没有对应资料时不展示人物介绍。历史人物资料继续保留，不覆盖旧记录；导入新版 Word 名录也不会改写这些人物资料。

页脚和“关于天协”页面的网站制作署名使用 `_data/website.json` 的 `creator_id`，对应 `_data/people.json` 中的人物编号。`creator_term` 记录制作网站时的任期，不随换届修改；`repository_url` 为协会网站源码地址。现任会长与网站制作署名分别维护。

不要把未记录的信息改写为“没有”。`predecessors` 是前身天体组，单独保存。

已有更新的 Word 名录时，可运行：

```sh
python3 scripts/import_team.py /名录的实际路径/新版名录.docx
```

导入只读取职务表格，结果应与原 Word 人工核对。

## 维护活动照片与摄影作品

将网页副本放入 `images/` 的相应子目录，保留原图。图片路径使用 `/images/…`，不要填写个人电脑的绝对路径。

- 活动：在 `albums.json` 中对应相册的 `images` 数组增添照片。路边天文与学习班仍使用统一入口，相册内部按活动日期进入小窗，不生成单独主题入口。
- 影像：`gallery.json` 当前是 28 幅真实作品，标题暂沿用原文件名。`image` 为放大图，`thumbnail` 为缩略图。
- 作者与拍摄参数目前留空。`parameters` 包含 `equipment` 器材、`exposure` 曝光、`location` 地点、`date` 日期和 `processing` 后期处理；有确切资料后再填写。不要从文件名或相机元数据自动推测。
- 天文台：`observatory.json` 保存总览、四位成员、建设时间线、器材类型、作品索引与日常照片，页面按这个顺序展示。四位成员使用同样的版式，不区分创办者与后来加入者。
- 图片作者、拍摄参数与归属没有确认时，不补写。

原图始终只读。照片导入通常生成最长边 2200 像素的清晰大图与 800 像素的缩略图；只调整网页尺寸与压缩，不改变构图和颜色。放大窗口显示完整画幅。

网页另有 240 像素的小封面与 1400 像素的展示图，由 `scripts/prepare_photo_variants.py` 从已公开的大图生成。活动日期列表与小窗选片按钮使用小封面，普通卡片与轮播通过 `srcset` / `sizes` 按屏幕宽度和像素密度选择 800 或 1400 像素副本；清晰大图保留给放大查看。小窗先显示预览，清晰图解码后替换，快速切换时不会被上一张迟到的请求覆盖。

尺寸与路径由 `_data/photo_variants.json` 自动维护，不手写该清单，也不改相册中的清晰大图路径。直接添加网页大图与缩略图后，在装有 Pillow 的环境运行：

```sh
python3 scripts/prepare_photo_variants.py
python3 scripts/prepare_photo_variants.py --check
```

把新增的 `-240.webp`、`-1400.webp` 与清单一并提交。生成脚本只更新新增或源图变化的副本；既有清晰大图、缩略图与原始素材不变。普通预览和 GitHub 构建不需要 Pillow；清单与副本已随仓库提供。没有清单记录时组件仍能显示旧图，但不会得到轻量加载，应在发布前补齐。

需要重建已选照片副本时，使用装有 Pillow 的 Python 环境运行：

```sh
python3 scripts/import_photos.py /素材根目录的实际路径
```

选片对应的相对文件路径保存在 `content/media-selection.json`。脚本会核对原图校验值，并记录网页副本的尺寸与大小到 `content/media-provenance.json`，随后自动生成轻量副本。两个本地记录文件不随网页发布。新的素材要先核对画面，再更新选片清单；不批量导入包含私人联系方式的资料照片。

每张活动照片的日期归档字段：

| 字段 | 含义 |
|---|---|
| `drawer_key` | 同一场活动的照片使用相同键；通常为分类、日期与来源标识 |
| `date_label` | 页面显示的日期，如 `2026.09.28`、`2024 年 5 月`、`2025 年` 或 `日期待补充` |
| `sort_date` | 记录归档日期；只知道年月时为 `2024-05-00`，只有年份时为 `2025-00-00`，未知为 `0000-00-00`，它不是对外显示的日历日期，也不是模板直接使用的排序字段 |
| `date_precision` | `day`、`month`、`year` 或 `unknown`；年月或年份记录直接显示已确认的精度，不附加具体日期待补充的说明 |
| `activity_title` | 活动记录中的活动名称；学习班与路边天文保持统一名称 |
| `activity_description` | 可选的本次活动介绍，同一场活动保持一致；尚无资料时留空 |

模板按 `drawer_key` 分组并倒序排列。普通活动的归档键应保留统一的分类前缀、补齐位数的年月日和稳定标识；年份记录的月日用 `00`，只改 `sort_date` 不会改变列表顺序。点击日期记录，在页面中央的小窗中查看该次活动的日期、介绍与照片；只在本次照片间切换，关闭后保留列表位置。未开启脚本的浏览器仍能原地展开阅读。具体活动的补充介绍可填写照片的 `activity_description`；目前没有专门正文时沿用该类活动简介，大天赛使用已确认的届次说明。2019 年野外观测的父子目录日期不一致，暂按年份归档，核对后再补具体日期。

## 手机菜单与过渡

手机与较窄屏幕的菜单使用约 0.28 秒的淡入和轻微下滑，收起时反向过渡；菜单旁的加号同步旋转。样式在 `assets/css/club.css`，状态与键盘行为在 `assets/js/club.js`。关闭时立即停用隐藏菜单的点击与键盘焦点，切回桌面后恢复正常导航。快速反复点击会从当前动画位置继续；系统开启“减少动态效果”时直接切换。

## 维护介绍图轮播

轮播资料直接引用已有数据： 首页首屏使用 `gallery.json` 全部摄影作品，五类活动介绍大图分别使用 `albums.json` 中的 `sidewalk`、`class`、`joint`、`field`、`competition`，天文台的两处介绍图使用 `observatory.json` 的 `overview_photo` 与 `aerial_photo`。更新对应数据后，轮播内容自动更新，不需要另存一份图片。

公共组件是 `_includes/photo-slideshow.html`，默认间隔为 3000 毫秒，淡入淡出为 0.55 秒，画面不显示序号与按钮。鼠标悬停、键盘聚焦、画幅离开屏幕、页面隐藏或打开大图小窗时会暂停。浏览器设置减少动态时默认暂停；键盘仍可用左右键切换、空格暂停或继续。无脚本时保留首张图片。后续照片按需加载，不在打开页面时下载整个相册。

天文台轮播中点开放大图，会打开当前显示的照片，窗口只在该组两张实景之间切换。日期记录的小窗继续按单次活动浏览，不自动轮播。

## 更新北十字天文台

编辑 `_data/observatory.json`：`facts` 为概况，`people` 为四位成员，`timeline` 和 `construction_photos` 为建设过程，`instruments` 为器材介绍，`work_ids` 引用 `gallery.json` 中的作品编号，`life_photos` 为日常照片。人物卡片、建设照片与日常影像均沿用页面中的图片小窗；不同区块各有独立浏览序列。

器材目前仅列出已确认的设备数量与光学类型，具体型号、口径和成像参数获得清单后再补。团队作品不默认认定全部摄于观测站；作品作者与参数继续留空。监控图片是保存下来的照片，不代表实时状态。资料依据保存在 `content/references/observatory-source-notes.md`，不参与网站导出。

## 交接时带走什么

交接整个项目目录，包括 `_data/`、`_pages/`、`content/`、布局、图片、样式、脚本、Gemfile 与 Gemfile.lock。缓存、`vendor/`、`_site/`、`local/` 不需要随内容交接，可在新环境重建。

未来租用空间时，域名、托管账号和续费联系人由协会共同管理，记录交接日期与责任人。网站源码与原始图像另存备份，避免只保留托管平台中的一份。

## 查看和维护访问统计

2026-10-07 接入 Cloudflare Web Analytics，统计站点为 `jasxiaoxie.github.io`。登录 [Cloudflare 后台](https://dash.cloudflare.com/)，进入 Observability → Analytics → Web analytics，选择站点和日期范围；查看某个页面时，按路径筛选，例如 `/observatory/` 或 `/events/field-observing/`。统计数据由 Cloudflare 保存，换届时交接对应账号或访问权限。

- `Page views`：页面浏览次数，同一个人打开多个页面或重新加载会产生多次浏览。
- `Visits`：从其他网站或直接链接进入本站的访问次数，一次访问可以包含多个页面；不能把它当作去重访客人数。口径以 [Cloudflare 官方说明](https://developers.cloudflare.com/web-analytics/data-metrics/high-level-metrics/) 为准。
- 数据从接入后开始，之前的访问量无法补算。统计脚本被网络、广告拦截工具或浏览器设置阻止时会漏计。
- 活动小窗和摄影作品小窗属于所在页面，当前只统计页面访问，没有额外上报按钮点击或每张照片的浏览事件。

站点标识保存在 `_config.yml` 的 `analytics.cloudflare_token`。这是由 Cloudflare 提供、随网页公开的收集标识，不是账号密码或 API 密钥。脚本由 `_includes/analytics.html` 在公共布局 `_layouts/club.html` 的 `</body>` 前加载，沿用维护者提供的 `type="module"` 安装代码。只在 `JEKYLL_ENV=production` 构建且标识非空时启用；GitHub Actions 已设置正式构建环境，`scripts/preview.py` 明确使用 `development`，避免本机维护计入统计。停用时将标识改为 `""` 并发布；更换站点时从 Cloudflare 的 Manage site 获取真实新标识，不自行生成。

统计加载失败不影响照片、菜单或本站地图。访客需要访问 `https://static.cloudflareinsights.com/beacon.min.js` 和 `https://cloudflareinsights.com/cdn-cgi/rum`；本站地图依然使用自己的文件。脚本及上报地址见 [Cloudflare 数据收集说明](https://developers.cloudflare.com/web-analytics/data-metrics/data-origin-and-collection/)，不要把上报接口下载成静态文件或换成猜测的域名。

检查时先确认本次 Actions 发布成功，再在正式网页源码中检查每页只有一份统计脚本且标识正确；浏览器中核对脚本加载和上报请求。测试访问后等待几分钟，再查看后台日期、站点和路径筛选。国内访问需在实际不使用 VPN 的环境核对上报，不能仅凭维护电脑可连通就保证所有访客都计入。没有后台访问权限时，只说明已经验证的脚本或请求，不声称统计数据已到账。

## GitHub Pages 发布与交接

网站发布到协会账号 `JASxiaoxie` 的 `JASxiaoxie.github.io` 仓库，网址为 `https://jasxiaoxie.github.io/`。管理层更替时交接协会账号与仓库权限，维护者使用自己的协作账号更新内容，不依赖某一位同学的个人仓库。

仓库 Settings → Pages 的发布来源选择 GitHub Actions。修改 `_data/`、页面或图片后，提交到 `main`；Actions 中的“发布天协网站”会构建并检查资源，通过后自动上线。更新失败时查看失败步骤的日志，上一版网站继续保留。

本地提交前运行 `python3 scripts/prepare_content.py`、`JEKYLL_ENV=production bundle exec jekyll build --strict_front_matter --destination local/export` 和 `python3 scripts/check_site.py local/export`。`content/` 中的选片记录与原始资料不上传 GitHub，交接时单独备份；公开仓库已经包含展示所需的图片副本，日常更新不需要原始资料。

在线编辑后台与报名同步尚未建设；本地预览仍只在本机访问。
