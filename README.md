# 吉林大学天文协会网站

> 在吉大，一起看见更远的星空。

欢迎来到吉大天协。这里是协会网站的源码仓库，也是我们保存活动、影像与社团记忆的地方。这份说明写给刚认识天协的新同学，也写给以后接手网站的管理层。

**[访问天协网站](https://jasxiaoxie.github.io/)** · **[网站维护与交接指南](MAINTENANCE.md)** · **[给 AI 的维护与发布指南](AI_MAINTENANCE.md)**

## 给第一次来到天协的同学

没有天文基础也没关系。学习班、校园里的望远镜和一次次观测，都是认识星空的起点。

在网站里，可以先从这些地方逛起：

- **[我们的活动](https://jasxiaoxie.github.io/events/)**：路边天文、天文学习班、联合活动与野外观测。点开一场活动，就能看到那一次的介绍和照片；[大天赛](https://jasxiaoxie.github.io/competition/)也有自己的页面。
- **[北十字天文台](https://jasxiaoxie.github.io/observatory/)**：认识观测团队，看看天文台的建设过程、器材和日常。
- **[星空影像](https://jasxiaoxie.github.io/gallery/)**：浏览协会成员的天文摄影作品。
- **[小邪](https://jasxiaoxie.github.io/xiaoxie/)**：认识天协看板娘，读读她的宇宙来客故事，看看插画和与朋友们的联动作品。
- **[历届管理层](https://jasxiaoxie.github.io/team/)**与**[关于天协](https://jasxiaoxie.github.io/about/)**：了解现在的天协，也看看前辈们留下的名字与故事。
- **[加入我们](https://jasxiaoxie.github.io/join/)**：找到协会 QQ 群、微信公众号和 B站账号，留意最新活动通知。

**不入会也可以正常参加协会的各类活动。** 部分名额受限的活动中，会员会享有优先权，例如天气寒冷、野外观测人数有限时。具体参与方式和安排以当次通知为准。

## 给接手网站的管理层

网站会随着协会继续更新。接手以后，最常做的事情是补充一次活动、上传几张照片、更新管理层名单，以及维护群聊与新媒体入口。

日常内容主要保存在 `_data/` 中，页面会自动读取这些资料。先找到对应文件，再修改内容；详细字段、照片归档和换届步骤请看 [维护与交接指南](MAINTENANCE.md)。

| 想更新什么 | 从哪里开始 |
| --- | --- |
| 各类活动的介绍与参与说明 | [`_data/events.json`](_data/events.json) |
| 每一次活动的日期、介绍与照片 | [`_data/albums.json`](_data/albums.json) |
| 大天赛介绍、参赛记录与获奖情况 | [`_data/competition.json`](_data/competition.json) |
| 当前与历届管理层名单 | [`_data/team.json`](_data/team.json) |
| 现任会长的人物资料、照片与个人主页 | [`_data/people.json`](_data/people.json) |
| 北十字天文台的团队、建设、器材与日常 | [`_data/observatory.json`](_data/observatory.json) |
| 首页总览、天文台与野外观测地图中的地点 | [`_data/locations.json`](_data/locations.json) |
| 摄影作品、作者与拍摄参数 | [`_data/gallery.json`](_data/gallery.json) |
| 小邪的角色故事、插画、联动与草稿 | [`_data/mascot.json`](_data/mascot.json) |
| 协会简介、部门、入会说明与常见问题 | [`_data/club.json`](_data/club.json) |
| QQ 群、公众号二维码与 B站入口 | [`_data/contact.json`](_data/contact.json) |
| 协会历史中的重要节点 | [`_data/history.json`](_data/history.json) |
| 网站制作署名与源码仓库地址 | [`_data/website.json`](_data/website.json) |

页面结构在 [`_pages/`](_pages/)，样式和交互在 [`assets/`](assets/)。少量文字可以通过 GitHub 的文件编辑功能更新；照片或布局有较多变化时，建议先在本地预览。

整理内容时，请保留历届记录。没有确认的作者和拍摄参数先留空；活动只知道年份，就写年份。把准备公开展示的照片副本放进 `images/`，原始照片另存备份。会员信息、财务资料与私密联系方式不放进公开仓库。

## 不懂的地方，可以问 AI

不必先把网页开发学完才开始维护。遇到看不懂的文件、不会修改的内容，或者发布失败的报错，都可以请 AI 帮忙。把这个仓库和 [给 AI 的维护与发布指南](AI_MAINTENANCE.md) 发给它，再说明这次想改什么、哪些资料已经确认。

可以直接复制下面这段话，补上自己的需求：

> 请帮我维护吉林大学天文协会网站，仓库是 https://github.com/JASxiaoxie/JASxiaoxie.github.io 。请先阅读 AGENTS.md、README.md、AI_MAINTENANCE.md 和 MAINTENANCE.md，再检查当前代码。我的需求是：【填写这次要更新的内容】。我提供的已确认资料是：【填写文字、照片、日期等】。这次需要：【只在本地预览／检查后发布到协会网站，选择一种】。请保留历史记录，不猜测缺失信息，并告诉我修改了哪些文件、检查结果和发布情况。

AI 可以协助整理资料、修改文件和排查问题，活动日期、人名、获奖情况与照片归属仍需要我们核对。提问时不必提供账号密码、令牌或私密社团资料；需要登录时，使用维护者自己的授权方式。

## 在自己的电脑上预览

先获取这个仓库并进入项目目录，准备好 Ruby 3.3、Bundler 和 Python 3。第一次使用时运行：

```sh
bundle config set --local path vendor/bundle
bundle install
python3 scripts/preview.py
```

打开 [本地预览](http://127.0.0.1:4173/)，就能看到网站。修改内容后，等待程序重新构建，再刷新浏览器；按 `Ctrl+C` 可以结束预览。

本地预览适用于 macOS 和 Linux。有现成依赖缓存时，也可以使用 `python3 scripts/preview.py --bundle-path <依赖缓存目录>`。

提交前，在项目目录里检查一次正式构建：

```sh
python3 scripts/prepare_content.py
bundle exec jekyll build --strict_front_matter --destination local/export
python3 scripts/check_site.py local/export
```

检查通过后，再核对文字、照片、日期和链接是否正确。`local/export/` 是生成的静态网站，不需要提交到仓库。

## 把更新发布到网站

网站使用协会账号 **JASxiaoxie** 管理，正式地址是 **[jasxiaoxie.github.io](https://jasxiaoxie.github.io/)**。

将修改提交到 `main` 分支后，[GitHub Actions](https://github.com/JASxiaoxie/JASxiaoxie.github.io/actions) 中的“发布天协网站”会自动构建、检查并发布。发布成功后，打开网站核对这次变化；如果失败，先查看失败步骤的日志，修正问题后再提交。构建失败时，上一版网站会继续保留。

发布流程保存在 [`.github/workflows/pages.yml`](.github/workflows/pages.yml)。现有仓库已经配置好 GitHub Pages，日常更新只需要提交内容。

## 换届时，把网站一起交接

请把协会账号与仓库权限、网站维护说明、原始照片和本地素材清单一起交给下一届。公开仓库已包含网页展示所需的图片副本；原始材料和本地整理记录需要另行备份与交接。

换届后，更新本届名单、会长介绍和联系入口，保留过去的任期与活动记录。网站制作署名记录的是制作时的贡献，不随现任会长更替而改写。

网站由 **2026—2027 学年协会会长 [娄锦畅](https://astrotorpedo.github.io/)** 设计制作，后续由管理层接续维护。希望每一届都能在这里留下自己的活动，也让新同学有机会认识此前的天协。

网站基于 Academic Pages/Jekyll。更新时请继续保留上游署名与许可证，相关说明见 [UPSTREAM.md](UPSTREAM.md) 和 [LICENSE](LICENSE)。
