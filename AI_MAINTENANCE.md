# 给后续 AI 的网站维护与发布指南

这份文档用于帮助以后接手的 AI 理解吉林大学天文协会网站，并完成从资料整理到上线的工作。维护者可以把仓库链接和本次需求一起交给 AI；不需要提供此前聊天记录。

文档按 2026 年 10 月 7 日的仓库整理。开始工作时仍须读取当前文件：后续管理层可能已更新数据、依赖或发布方式。具体字段见 [MAINTENANCE.md](MAINTENANCE.md)，项目约定见 [AGENTS.md](AGENTS.md)，新同学与维护者的入口见 [README.md](README.md)。

## 1. 先确认项目与本次任务

| 项目 | 当前配置 |
| --- | --- |
| 正式网站 | https://jasxiaoxie.github.io/ |
| 源码仓库 | https://github.com/JASxiaoxie/JASxiaoxie.github.io |
| 仓库所属账号 | 协会账号 `JASxiaoxie` |
| 发布分支与方式 | `main` → GitHub Actions → GitHub Pages |
| 技术基础 | Academic Pages / Jekyll，Liquid 模板，JSON 内容数据，原生 CSS 与 JavaScript |
| 构建环境 | Ruby 3.3、Bundler、Python 3；依赖版本以 `Gemfile.lock` 为准 |
| 默认本地预览 | `http://127.0.0.1:4173/`，仅在本机访问 |

这个仓库已有可用网站和发布流程。日常维护优先修改已有数据与组件，保持现有技术栈；不要因一次内容更新重建网站或迁移到其他框架。普通预览与构建不需要 Node.js，也不需要付费服务器。

收到任务后，先区分：更新文字、增加活动照片、增加摄影作品、换届、修改视觉交互、修复故障，还是迁移托管。简短说明准备修改的范围，再开始工作。

在项目目录检查：

```sh
git rev-parse --show-toplevel
git remote -v
git status --short --branch
```

确认操作的是协会网站仓库，保留维护者尚未提交的修改。不要把上层目录、个人主页项目或素材目录当作发布仓库，也不要清理不属于本次任务的文件。

用户要求发布时，完成检查、提交、上传和线上核对；用户只要求本地修改时，停留在本地。不要把旧文档中的授权日期当作以后所有任务的发布授权，也不要重复询问本次用户已经明确授权的常规步骤。

## 2. 先了解文件如何组成网站

网站的数据流是：`_data/` 内容 → `_pages/`、`_layouts/`、`_includes/` 模板 → Jekyll 静态页面 → GitHub Pages。活动详情地址还需先由 `scripts/prepare_content.py` 生成。

| 文件或目录 | 用途与维护方式 |
| --- | --- |
| [`_data/events.json`](_data/events.json) | 活动类型介绍、参与说明及保留的独立详情；不是每次活动照片的主入口 |
| [`_data/albums.json`](_data/albums.json) | 每场活动的照片、日期、标题与介绍；决定日期记录和活动小窗 |
| [`_data/categories.json`](_data/categories.json) | 五类活动的名称、介绍、入口与卡片图 |
| [`_data/competition.json`](_data/competition.json) | 大天赛介绍、届次与获奖记录 |
| [`_data/gallery.json`](_data/gallery.json) | 摄影作品、作者、拍摄参数与首页推荐作品 |
| [`_data/mascot.json`](_data/mascot.json) | 小邪的角色介绍、六段背景、插画、联动与草稿对照；页面为 `/xiaoxie/` |
| [`_data/observatory.json`](_data/observatory.json) | 天文台概况、四位成员、建设、设备、作品引用与日常照片 |
| [`_data/locations.json`](_data/locations.json) | 校园、天文台与野外观测地点，WGS84 坐标、导航入口与本地地图配置 |
| [`_data/team.json`](_data/team.json) | 历届管理层与前身天体组；`generations` 最后一条为当前任期 |
| [`_data/people.json`](_data/people.json) | 人物照片、简介与个人主页；当前会长按姓名匹配 |
| [`_data/website.json`](_data/website.json) | 网站制作署名、制作时的任期和仓库地址 |
| [`_data/club.json`](_data/club.json)、[`_data/history.json`](_data/history.json) | 协会简介、部门、入会说明、常见问题与历史节点 |
| [`_data/contact.json`](_data/contact.json) | QQ 群、微信公众号、B站；加入页与页脚共享 |
| [`_pages/`](_pages/) | 首页、活动列表、天文台、影像、管理层、关于、加入等页面 |
| [`_layouts/`](_layouts/)、[`_includes/`](_includes/) | 页面布局与共用组件；相册组件为 `_includes/activity-album.html` |
| [`assets/css/club.css`](assets/css/club.css)、[`assets/js/club.js`](assets/js/club.js) | 网站视觉、菜单、轮播、筛选和照片小窗 |
| [`images/`](images/) | 已准备公开展示的网页图片副本 |
| [`scripts/`](scripts/) | 活动生成、预览、发布检查及可选的资料导入脚本 |
| [`_config.yml`](_config.yml) | 正式网址、页面默认值和导出排除目录 |
| [`.github/workflows/pages.yml`](.github/workflows/pages.yml) | 构建、资源检查与 Pages 发布流程 |

`_pages/generated_events/` 由脚本维护，不手写其中的正文。正式内容应改到 `_data/events.json`。

`content/` 保存本地资料依据、选片清单与图片来源记录，`local/` 保存预览配置、导出和检查截图。这两个目录不在公开仓库中，也不导出到网站。新电脑从 GitHub 克隆后没有它们是正常的；已有网页图片足够运行网站，重建原图副本时才需要另行交接素材。

本指南、README、AGENTS 和维护说明通过 GitHub 阅读，已在 `_config.yml` 中排除，不是前台页面。

## 3. 保留已经确定的内容与视觉约定

- 网站面向新同学和协会成员，文字使用自然的中文社团口吻；不要把实现过程、占位提示或 AI 工作报告写进前台。
- 活动分为路边天文、天文学习班、联合活动、野外观测、大天赛。路边天文与学习班各保留统一入口；大天赛单列，不归入联合活动。
- 活动专页先介绍活动，再列每次活动。点击记录后，在页面中央的小窗阅读该次介绍与照片，关闭后回到列表原位置。
- 日期以已确认的资料为准。只知道年份就显示年份，不写“具体日期待补充”。未知作者、拍摄参数与姓名保持空缺，不由 AI 或相机元数据推测。
- 天文台顺序为总览与介绍 → 四位成员 → 建设过程 → 器材 → 摄影作品 → 台子日常。许航、王胤翔、王涵冰、娄锦畅使用同等人物版式，不突出两位创办者。
- 首页主图循环摄影作品；活动介绍大图循环各自相册；天文台页面两处介绍图循环器材全景与航拍图。间隔 3 秒，悬停暂停，不显示右下角序号与按钮。保留键盘、减少动态偏好、无脚本阅读及移动端支持。
- 会徽为 `images/brand/emblem.jpg`；小邪形象单独使用，不替换会徽。
- 小邪的故事明确作为角色设定，素材保持完整画幅与签名，透明背景不铺底。联动动图默认静态，主动点击播放，离开画面或切换标签页时暂停；不推断画师、生日或合作背景。
- 30 元入会说明须同时保留：不入会也可正常参加各类活动；名额受限时会员可能享有优先权，例如寒冷天气下的野外观测。简介、常见问题与参与说明应一致。
- 当前会长随名录更新；网站制作署名“娄锦畅”及个人主页记录制作贡献，不随换届替换。保留 Academic Pages / Minimal Mistakes 署名及许可证。
- 原图保持只读，网页使用副本。公开仓库不放会员表、财务、私密联系方式、密码或令牌。二维码使用维护者提供的真实图片，不生成或猜测。

维护者明确提出新需求时，按本次要求修改相关约定，并同步更新文档；不要擅自变更其他已确认的设计。

## 4. 准备环境并运行预览

新电脑先克隆仓库；已有项目则直接进入原目录，不覆盖重建：

```sh
git clone https://github.com/JASxiaoxie/JASxiaoxie.github.io.git
cd JASxiaoxie.github.io
ruby --version
bundle --version
python3 --version
bundle config set --local path vendor/bundle
bundle install
python3 scripts/preview.py
```

缺少环境时，先根据维护者的 macOS / Linux 环境处理 Ruby 3.3 和 Bundler；不要假定系统 Ruby 满足要求。`bundle install` 使用已有锁文件，普通维护不运行全面依赖升级。

打开 `http://127.0.0.1:4173/`。预览会先生成活动地址；修改活动数据后，监视器会更新生成页，Jekyll 重新构建后刷新浏览器。停止时按 `Ctrl+C`。

端口占用时可以运行 `python3 scripts/preview.py --port 4174`，不要关闭不明来源的进程。有已安装的依赖缓存时，可以用 `--bundle-path` 指向实际缓存目录；这是本机选项，不应写入公开页面或正式配置。

预览生成 `local/preview.yml` 覆盖本机网址。正式 `_config.yml` 的 `url` 保留正式域名，`baseurl` 保留现有设置；不要为预览把正式配置改成 localhost。

## 5. 按需求更新内容

### 新增一场已有类型的活动

1. 向维护者确认活动类型、日期或年份、简介及可公开的照片。没有具体地点时不编造。
2. 准备网页大图与缩略图副本，放进 `images/photos/`；保留原图与来源。当前图片规格为最长边 2200 / 800 像素，完整画幅，WebP 质量 88。
3. 在 `albums.json` 的 `sidewalk`、`class`、`joint` 或 `field` 相册的 `images` 数组追加照片记录。同一场活动的照片共用 `drawer_key`、日期、`activity_title` 和可选的 `activity_description`。
4. 图片保留 `id`、`title`、`image`、`thumbnail`、实际大图 `width` / `height` 等现有字段。JSON 布尔值使用 `true` / `false`，未知文字通常使用空字符串，参照邻近记录。
5. `date_label` 是对外文字；`sort_date` 为归档资料；`date_precision` 是 `day`、`month`、`year` 或 `unknown`。只知道年月时可用 `2024 年 5 月`、`2024-05-00`、`month`；只有年份时可用 `2027 年`、`2027-00-00`、`year`，不要编造月日。
6. **模板实际按 `drawer_key` 分组并倒序排列**，不是直接按 `sort_date` 排列。普通活动的键沿用“类别-补齐位数的年月日-稳定标识”形式；年份记录使用 `00` 月日。同类前缀保持一致，不同场次的键不同。只调整 `sort_date` 不会改变现有顺序。
7. 检查新活动只有一条日期记录，小窗只包含本场照片，封面、标题与介绍正确。不要为了新增一场路边天文或学习班重复创建类型入口。

修改活动类型介绍、参与方式或有明确要求的独立详情时，才修改 `events.json`。其 `date` 只接受真实的 `YYYY-MM-DD` 或空字符串，不能写年份或 `2027-00-00`；年份记录由相册字段表达。新增详情的 `id` 只能用小写字母、数字和短横线且不重复，随后运行 `prepare_content.py`。

### 增加大天赛记录或奖项

参赛小窗的照片维护在 `albums.competition.images`；校内竞赛使用 `albums.campus-contest.images`。各届的分组键沿用 `competition-年份`，与 `competition.json` 的 `editions[].album` 对应，以便读取届次介绍。

`competition.json` 的 `awards` 保存年份、届次、承办学校、奖项、姓名和来源。按维护者提供的原文录入，缺失获奖者留空；照片并不能证明获奖情况。

当前还保留部分按届次命名的相册与独立历史详情。更新同一届记录时检查已有引用，复用图片路径并保持内容一致。`_layouts/competition.html` 的页内快捷导航有明确年份链接，新增年份时也需更新这些链接，不能只改数据后认定所有导航已自动更新。

### 增加摄影作品

向 `gallery.json` 追加作品，使用唯一的作品 `id`。类别为 `nightscape`、`deep-sky`、`solar-system`，对应当前页面筛选；保留完整大图与缩略图路径，真实宽高。`metadata: true` 用于展示作者与参数栏，`featured: true` 会进入首页推荐区。

未知的 `author` 及 `parameters` 中的 `equipment`、`exposure`、`location`、`date`、`processing` 留空，不加虚构信息。首页轮播引用全部作品，但首张仍由 `_pages/home.html` 中的 `galactic-center` 编号指定；不要删掉这个编号后留下空图。如需替换首页首张，修改引用并核对。

### 换届与人物资料

在 `team.json` 的 `generations` **末尾追加**本届名单，不覆盖历史任期。当前会长照片和介绍来自 `people.json`，按新一届 `president` 姓名匹配；保留历史人物资料。没有资料时不伪造人物简介。

更新管理层页中的资料来源、截止时间等文字。`website.json` 的 `creator_id` 与 `creator_term` 不因换届改变；天文台人物资料另在 `observatory.json`，涉及职务变更时核对两处文字，不自动把换届当成天文台团队更换。

### 天文台、联系方式与视觉修改

天文台编辑 `observatory.json`，作品引用 `gallery.json` 的真实编号。新设备型号、口径和建站信息须有来源；保存的监控照片不描述为实时画面。

群号、账号名、二维码与外链编辑 `contact.json`。加入页和页脚共用这些数据。QQ群二维码若是长图，按原图实际尺寸维护 `qr_crop`；若是单独方形码则移除该裁切字段。具体方法见 [维护说明](MAINTENANCE.md)。

视觉改动优先复用 `club.css`、`club.js` 和已有组件。布局中的 CSS / JS 地址含基于构建时间的版本号，用于避免旧缓存；不要移除它。人物照片既有 CSS 尺寸限制，也有小尺寸 HTML 默认值，图片的原始像素宽高不能直接当成前台展示尺寸。

### 更新地点与地图

地点唯一来源为 `locations.json`，具体字段见 [维护说明](MAINTENANCE.md#更新观测地点与地图)。不要在三个页面中各存一份坐标。当前组件在 `_includes/location-map.html`，样式与脚本为 `assets/css/maps.css`、`assets/js/maps.js`；地图库 Leaflet 1.9.4 自托管在 `assets/lib/leaflet/`，保留上游许可证。首页与天文台通过 `location_map: true` 加载资源；野外观测按 `page.event_id` 加载。普通页面不引入地图，底图在组件接近可视区域时才请求。

首页地图在摄影作品区块后、历史传承区块前；天文台地图在总览介绍之后、人物之前；野外观测在类型介绍之后、活动日期列表之前。列表保留公开地址、正常站内链接与高德地图入口，地图加载失败不阻碍阅读。手机先轻触探索，再开启拖动；结束浏览恢复页面滚动。保留减少动态偏好与可见的地图署名。

数据分开保存 `latitude` 纬度、`longitude` 经度，底图主坐标使用 WGS84。高德导航 URI 显式选择坐标系统：没有 `navigation` 时用主坐标及 `coordinate=wgs84`；`navigation` 保存 GCJ02 原始选点时用其数值及 `coordinate=gaode`，避免二次偏移。野外农家乐已用维护者在高德重新选定的原始坐标，WGS84 由 [eviltransform gcj2wgs_exact](https://github.com/googollee/eviltransform)逆转换，导航则保留原值。手机照片 GPS 的坐标按 WGS84 处理，来自高德、腾讯、百度或来源不明的新坐标先核对，转换后再录入，不能直接改坐标系标签。度分秒换算按 `度 + 分/60 + 秒/3600`，南纬、西经为负值。来源与精度记入 `coordinate_source`；校区范围中心不能描述成集合点，一个常用地点不能自动套到全部历史活动。

底图为本站托管的 OpenStreetMap 矢量快照，文件在 `assets/maps/`，通过 `map.data_url` 引用清单；组件会将其转换成含 `baseurl` 和构建版本的地址。页面只请求同源 JSON，不能重新引入外部瓦片、地图 CDN 或运行时 Overpass 查询，否则可能重现不使用 VPN 时空白的问题。OSM 数据与衍生数据库使用 ODbL，独立于代码 MIT 许可，保留可见署名及 [地图数据说明](assets/maps/README.md)。

`build_maps.py` 从原始缓存生成 GeoJSON，查询与范围在 `scripts/map-regions.json`；仅显式 `--download` 时才读取未缓存的有限区域。需刷新数据时使用新缓存目录，例如 `--download --cache local/maps/raw-2027-10`，保留旧缓存。原始响应不发布；四个 GeoJSON 和 `manifest.json` 与源码一起提交。清单含查询、OSM 时间、范围、摘要和大小。简化线段但不补画未收录的小路或建筑；同属性线段分组不代表互相连通。总览不显示所有乡镇或匝道，放大才显示更多细节。有限区域内允许拖动缩放，不能将其描述为完整在线地图或导航系统。地点变更超出范围时，补充真实数据后再发布。正式页面没有地址搜索或反查 API，不把公共查询服务变成网站后台。

修改后核对坐标范围、三个页面的地点筛选、导航 URI 中经纬度顺序、地图选择与复位、手机滚动开关。`check_site.py` 检查页面内地图 JSON 的坐标、编号、坐标系统、同源数据地址，以及底图文件摘要、非空要素、有限几何坐标、范围覆盖与 ODbL 许可；不证明现实地址或坐标转换准确。额外地点若要出现在独立页，先明确组件引用与资源加载条件。

### 可选资料导入脚本

小邪插画使用 `scripts/import_mascot.py`：清单编号为 `art-` 加原稿 SHA-256 前 12 位，生成完整画幅的 WebP 大图与缩略图，保留透明通道；GIF 只复制原始字节，并生成静态首帧。清单 `content/mascot-selection.json` 和来源记录 `content/mascot-media-provenance.json` 需要另行交接。它不修改 `mascot.json`；导入后按 [维护说明](MAINTENANCE.md#小邪的故事与插画) 更新数据，再核对入口、放大窗口与动图按钮。不要把角色插画加入天文摄影作品相册。

`scripts/import_photos.py` 需要 Pillow、原始素材以及选片清单。它核对原图 SHA-256，以 `photo-` 加前 12 位摘要作为编号，生成两种网页副本，并写入本地来源记录。它**不会**自动给相册或作品新增记录；导入后仍需编辑 JSON。

新克隆的仓库没有默认 `content/media-selection.json`。只有拿到真实素材与已核对清单后才使用脚本；可通过 `--selection` 指定清单文件，不要为通过脚本编造清单或来源。需要新增照片时，先阅读脚本并按已有规则准备副本与本地记录。

`scripts/import_team.py` 可以从已确认的 Word 名录导入名单，但会更新名单数据。使用前保留现有内容，读取脚本，导入后逐项核对并查看差异，特别检查当前任期；人物资料和网站制作署名另行维护。

## 6. 修改后完成检查

先检查改动过的 JSON 语法、标识和引用，再运行项目已有构建检查：

```sh
python3 scripts/prepare_content.py
bundle exec jekyll build --strict_front_matter --destination local/export
python3 scripts/check_site.py local/export
git diff --check
git diff --stat
git status --short
```

`check_site.py` 会检查 HTML 中的站内链接、图片、轮播的后续图片，以及是否导出了本地目录或混入 localhost。它不验证文案事实、二维码能否识别、日期分组和视觉效果；这些仍需核对。检查页面数量以当前实际内容为准，不固定为某个历史数量。

内容变化时打开相关页，核对新记录、年份、图片与链接。视觉和交互变化时，再检查桌面与手机宽度、横向溢出、小窗关闭后位置、悬停暂停和键盘操作。需要浏览器时使用当前 AI 环境提供的浏览器工具；工具不可用时明确说明未做视觉验证，不声称已经看过。

普通文字和资料更新使用这些已有检查即可，不需要为每次维护添加测试框架。所有新代码注释使用中文。若检查失败，先修复本次变动造成的问题，再发布；记录无法解决的具体阻碍。

## 7. 提交、发布与线上核对

### 上传前

确认维护者要求发布，并检查当前分支、远端、工作区及待提交文件。若本地和远端分叉，先理解并处理冲突，保留双方修改，不强推。

从干净的本地 `main` 开始工作时，可先用 `git pull --ff-only origin main` 同步；存在未提交工作时先检查归属，不自动丢弃、重置或暂存维护者的内容。

GitHub 登录使用维护者自己的协作账号或已授权的协会账号。可用 `gh auth status` 检查现有登录；不要让维护者把密码或令牌贴到聊天、脚本或仓库中。登录账号可以与仓库所有者不同，关键是确有此仓库写权限。

### 提交并推送

只暂存这次已经核对的文件。以下以文档更新为例，实际内容更新时将文件列表换成对应的数据与图片路径：

```sh
git diff -- README.md AI_MAINTENANCE.md
git add -- README.md AI_MAINTENANCE.md
git diff --cached
git commit -m "更新网站维护说明"
git push origin main
```

不要使用 `git add .` 将陌生文件一起上传，不提交 `vendor/`、`.bundle/`、`_site/`、`local/`、`content/` 或原始私密资料。工作在其他分支时，按本次任务的协作方式将变动合入 `main`，不要把无关分支直接当作正式发布分支。

Git 网络连接失败时先区分认证、权限与传输问题，不认为本地提交已经上线。环境若提供可信的 GitHub 连接器或 REST API，可使用等价的提交与分支更新方式；须核对仓库、父提交和文件范围，避免覆盖并行更新，完成后核对远端提交。不要为了网络故障绕过证书校验或泄露令牌。

### 等待发布

`main` 的更新触发“发布天协网站”：获取源码 → 准备 Ruby → 生成活动页面和正式网址配置 → Jekyll 构建与资源检查 → 上传站点 → Pages 部署。Pages 发布来源已设置为 GitHub Actions，日常更新不用重新创建仓库或配置托管。

可以在 [Actions 页面](https://github.com/JASxiaoxie/JASxiaoxie.github.io/actions) 查看本次提交；可用 CLI 时：

```sh
gh run list --repo JASxiaoxie/JASxiaoxie.github.io --workflow pages.yml --limit 5
```

选中与本次提交一致的运行，等待 build 和 deploy 均成功。若使用 `gh run watch`，传入列表中该次运行的实际编号并加 `--exit-status`；不要把较早的成功运行当成本次发布结果。

### 核对线上结果并回报

发布成功后打开正式网站的相关页面，确认新内容、图片和链接实际可见；文档更新则核对 GitHub 中的对应文件及 README 的入口。必要时刷新页面以排除旧页面缓存。仅提交成功、本地预览成功或 HTTP 200 都不能单独证明指定变动已经发布。

交付时简短说明修改内容、主要文件、检查结果、是否发布以及可直接打开的链接。只有验证过的环节才写“完成”；无法验证时注明范围，并给出维护者下一步需要做的具体操作。

## 8. 常见故障与恢复

| 现象 | 优先检查 |
| --- | --- |
| 找不到 `bundle` 或依赖失败 | Ruby / Bundler 版本、PATH 和 `Gemfile.lock`；避免直接用旧系统 Ruby或全面升级依赖 |
| 活动没有新记录或混在一起 | 是否编辑了正确相册；同场是否共用键，不同场是否误用了同一个 `drawer_key` |
| 活动年份显示或顺序不对 | `date_label`、精度与分组键；尤其注意模板排序依据为键名 |
| 新图片为空或轮播后续帧空白 | 大图、缩略图路径及大小写，是否实际提交图片；运行资源检查 |
| 地图没有底图或位置偏移 | 先分清本站地图文件加载失败与坐标错误；检查底图清单与文件、WGS84、经纬度顺序与来源，不用换地址掩盖加载失败 |
| 新会长不显示 | `generations` 最后一条、`president` 姓名与 `people.json` 是否完全匹配 |
| 照片突然铺满页面或新样式未生效 | 样式请求、带版本号的 URL、CSS 尺寸和 HTML 默认宽高；核对线上已部署的内容 |
| 线上仍是旧内容 | 本次提交是否在远端 `main`、对应 Actions 是否成功、实际网页或浏览器缓存 |
| Actions 失败 | 找到失败任务和具体日志；修复原因，不删除检查步骤来绕过错误 |
| 缺少原始资料或本地选片清单 | 向管理层查找交接备份；仅日常运行网站无需重建全部图片 |

构建或部署失败时，上一版已经发布的网站通常继续保留。若已上线的变动有问题，优先修正并提交；确需恢复时，用 Git 的 revert 方式撤回明确的错误提交，再走同样检查与发布流程，保留可追溯历史。不使用强推或破坏性重置覆盖仓库。

## 9. 换届交接与托管迁移

交接公开源码、协会账号和仓库协作权限、维护文档、当前联系入口；原始照片、选片与来源记录另行备份。缓存和生成网站可以在新环境重建。账号登录与恢复资料通过管理层已有的私下交接渠道处理，不写进公开文档。

换届后按第 5 节追加名单和人物资料，检查新旧群聊及新媒体入口，保留历史活动与制作署名。若技术流程改变，同时更新本指南、README、MAINTENANCE 和 AGENTS 中的相关说明。

未来需要租服务器或换域名时，Jekyll 构建结果可以作为静态网站部署。先确认维护者选定的域名、托管方式与访问路径，再调整网址、`baseurl` 和部署流程；重新检查导航、图片、资源版本和正式链接。现有站点无需数据库，暂没有在线编辑后台或报名系统，不要把这些当成已实现功能。

迁移涉及账号、费用和正式切换时，按维护者本次授权推进，完成备份与可预览结果后再切换。迁移完成后保留源码和原始图像备份，并更新所有交接文档中的正式地址。
