# 吉林大学天文协会网站

基于 Academic Pages/Jekyll 的独立本地网站。已完成框架与视觉交互，并加入 134 张活动照片、28 幅摄影作品和 16 张北十字天文台照片，会徽与小邪保留各自的品牌用途。

每类活动先展示活动介绍，下面按日期列出每次活动，点开某次活动后，介绍与照片在页面中央的小窗中呈现。日期由新到旧排列，关闭小窗回到原列表。

首页主图每 3 秒循环摄影作品；五类活动介绍页的大图轮播各自相册；天文台总览与下方介绍图循环器材全景和航拍图。鼠标悬停时暂停，移开后继续；画面不叠加序号与按钮。

网站有首页、活动、北十字天文台、星空影像、历届管理层、关于天协、加入我们七个主要页面，以及独立大天赛页面、观测指南和活动详情。

## 本地预览

需要 Ruby 3.3、Bundler 和 Python 3。首次在新环境使用时：

```sh
bundle config set --local path vendor/bundle
bundle install
python3 scripts/preview.py
```

默认地址：http://127.0.0.1:4173/ 。修改 HTML、CSS 或数据后，Jekyll 会重新构建，刷新浏览器查看。

有现成 Ruby 依赖缓存时，可使用 `python3 scripts/preview.py --bundle-path <依赖缓存目录>`。此参数只影响本机启动，不影响网站数据和迁移。

## 内容入口

- `_data/events.json`：五类活动、历史回顾、独立详情正文。
- `_data/team.json`：当前与历届管理层、前身天体组。
- `_data/people.json`：人物照片、简短介绍与个人主页，供现任会长介绍和制作署名使用。
- `_data/website.json`：网站制作署名、制作时的任期与协会源码仓库地址。
- `_data/gallery.json`：摄影作品、作者与拍摄参数（目前留空）。
- `_data/albums.json`：各类活动及比赛年份的照片与日期抽屉。
- `_data/competition.json`：大天赛页面介绍与年份索引。
- `content/media-selection.json`：选片清单与相对来源。
- `content/media-provenance.json`：网页副本、原始文件校验值与尺寸记录。
- `_data/observatory.json`：北十字天文台总览、四位成员、建设时间线、器材介绍、作品索引与日常照片。
- `_data/club.json`：简介、部门、入会与常见问题。
- `_data/contact.json`：QQ群、公众号二维码与 B站主页入口。
- `_pages/`：页面框架。
- `assets/css/club.css`、`assets/js/club.js`：视觉与交互。

交接与更新步骤见 [MAINTENANCE.md](MAINTENANCE.md)。

## 导出与正式发布

```sh
python3 scripts/prepare_content.py
bundle exec jekyll build --strict_front_matter --destination local/export
python3 scripts/check_site.py local/export
```

`local/export/` 为可部署的静态网站。正式发布目标为协会账号 `JASxiaoxie` 的仓库 `JASxiaoxie.github.io`，默认网址 `https://jasxiaoxie.github.io/`。本地预览仍使用 `http://127.0.0.1:4173/`。

仓库的 Settings → Pages 中选择 GitHub Actions。`.github/workflows/pages.yml` 会在 `main` 更新后自动生成活动页、构建网站、检查图片与链接，再发布。构建失败时不会覆盖上一版网站。未来绑定协会域名时，Pages 配置会将网址传给构建流程。

Git 上传排除 `content/`、`local/`、Ruby 依赖与本机缓存，公开仓库只保留网站源码、公开展示的图片和维护说明。现阶段仍通过数据文件维护内容。
