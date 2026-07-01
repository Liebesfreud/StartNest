# StartNest

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/Liebesfreud/StartNest)

StartNest 是一个自托管的私人起始页和书签工作台，用来管理常用链接、分组、界面偏好和 Web 面板。

## 部署方式

本项目部署目标是 **Cloudflare Workers + Workers Assets + D1**。

不要按 Cloudflare Pages 的纯静态站点方式部署；项目需要 Worker 后端处理登录、API、D1 数据库和前端资源托管。

> 一键部署会打开 Cloudflare 部署流程；部署前仍需要创建自己的 D1 数据库，并配置 `ADMIN_USERNAME`、`ADMIN_PASSWORD`、`SESSION_SECRET` 等 secrets。

## 准备工作

你需要准备：

- 一个 Cloudflare 账号
- 一个托管代码的 Git 仓库，例如 GitHub
- 本项目代码已推送到仓库
- 一个随机长字符串，用作 `SESSION_SECRET`

## 本地开发

复制本地环境变量模板：

```bash
cp .dev.vars.example .dev.vars
```

然后编辑 `.dev.vars`，设置本地管理员账号、密码和 `SESSION_SECRET`。不要提交 `.dev.vars`。

先安装依赖：

```bash
npm install
```

启动前端开发环境：

```bash
npm run dev
```

启动 Cloudflare Worker 本地环境：

```bash
npm run cf:dev
```

## 数据库迁移

执行本地 D1 迁移：

```bash
npm run db:migrate:local
```

执行远程 D1 迁移：

```bash
npm run db:migrate:remote
```

如果你修改了 migration 文件，但本地 `.wrangler/state` 里的数据库已经是旧结构，需要继续新增 migration，而不是只改旧 migration 文件。

## 构建

提交前确认项目能构建：

```bash
npm run build
```

## 1. 创建 D1 数据库

在 Cloudflare 控制台中：

1. 进入 **Workers & Pages**
2. 打开 **D1 SQL Database**
3. 点击 **Create database**
4. 数据库名称填写：

```text
startnest-db
```

创建完成后，复制数据库的 **Database ID**。

然后把 `wrangler.jsonc` 中的 `database_id` 改成你自己的 ID：

```jsonc
"d1_databases": [
	{
		"binding": "DB",
		"database_name": "startnest-db",
		"database_id": "你的 Database ID",
		"migrations_dir": "migrations"
	}
]
```

注意：`binding` 必须保持为 `DB`，因为代码中使用 `env.DB` 访问数据库。公开模板仓库里应保留占位值；自己的私有 fork 或部署分支中才替换成真实值。

## 2. 初始化数据库表

在 Cloudflare 控制台中：

1. 进入刚创建的 `startnest-db`
2. 打开 **Console** 或 **Query** 页面
3. 按文件名顺序执行 `migrations/` 目录下的 SQL 文件

执行顺序示例：

```text
0001_init.sql
0002_add_search_engine.sql
0003_add_weather_settings.sql
0004_add_link_tile_size.sql
0005_add_link_icon_prefs.sql
0006_add_wallpaper_url.sql
0007_add_user_profiles.sql
0008_add_wallpaper_effect_settings.sql
0009_remove_link_flags.sql
0010_normalize_settings_schema.sql
0011_create_web_panels.sql
0012_add_login_attempts.sql
0013_add_wallpaper_effects_compat.sql
0014_create_search_engines.sql
```

建议每次执行一个文件。全部执行完成后，数据库中应包含链接、分组、设置、用户资料、Web 面板和登录限制相关表。

如果后续项目新增 migration，也继续在 Cloudflare 控制台中按顺序执行新增 SQL，不要反复修改已经执行过的旧 migration。

## 3. 创建 Worker 项目

在 Cloudflare 控制台中：

1. 进入 **Workers & Pages**
2. 选择 **Create application**
3. 选择创建 **Worker**，并连接你的 Git 仓库
4. 项目名称建议填写：

```text
startnest-private-start
```

构建配置：

```text
Build command: npm run build
Build output directory: dist
Root directory: /
```

项目会使用 `wrangler.jsonc` 中的配置：

- Worker 入口：`worker/index.ts`
- 静态资源目录：`dist`
- Assets binding：`ASSETS`
- D1 binding：`DB`
- 应用名变量：`APP_NAME = StartNest`

如果控制台要求手动配置静态资源目录，请填写：

```text
dist
```

## 4. 配置环境变量和密钥

进入 Worker 项目的 **Settings**，配置变量。

普通变量：

| Name | Value |
| --- | --- |
| `APP_NAME` | `StartNest` |

Secrets：

| Name | 说明 |
| --- | --- |
| `ADMIN_USERNAME` | 管理员用户名 |
| `ADMIN_PASSWORD` | 管理员密码 |
| `SESSION_SECRET` | 用于签名登录 session 的随机长字符串 |

`SESSION_SECRET` 建议使用 32 位以上随机字符串。示例格式：

```text
3m8Kv9nPq2sT7xZaL4cY6uRbW0eHdJ1f
```

不要把真实密码和 `SESSION_SECRET` 提交到仓库。

## 5. 确认 D1 绑定

进入 Worker 项目的 **Settings**，确认 D1 数据库绑定：

| Binding name | Database |
| --- | --- |
| `DB` | `startnest-db` |

如果控制台没有自动读取 `wrangler.jsonc` 中的 D1 配置，就手动添加一个 D1 binding，绑定名必须是 `DB`。

## 6. 部署

完成以上配置后，在 Cloudflare 控制台中触发部署：

1. 打开 Worker 项目的 **Deployments**
2. 选择最新 Git 提交
3. 点击重新部署或等待自动部署完成

部署成功后，访问 Cloudflare 提供的 Worker 域名。

首次访问会进入登录页，使用你在 Secrets 中配置的：

- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`

登录成功后即可开始创建分组、添加链接、配置外观和管理 Web 面板。

## 7. 绑定自定义域名

如果需要使用自己的域名：

1. 进入 Worker 项目的 **Settings**
2. 打开 **Domains & Routes**
3. 添加自定义域名或路由
4. 按 Cloudflare 提示完成 DNS 配置

建议使用 HTTPS 默认配置即可。

## 常见问题

### 登录时报错或一直回到登录页

检查 Worker Secrets 是否配置完整：

- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`
- `SESSION_SECRET`

还要确认浏览器允许该站点写入 Cookie。

### 页面能打开，但数据加载失败

优先检查：

- D1 binding 名是否为 `DB`
- `startnest-db` 是否已经执行全部 migration
- `wrangler.jsonc` 中的 `database_id` 是否是当前数据库 ID

### 部署成功但静态资源 404

确认构建输出目录是：

```text
dist
```

并确认 Worker Assets 已绑定到 `ASSETS`。

### 修改配置后没有生效

在 Cloudflare 控制台中重新部署最新提交。环境变量、Secrets、D1 binding 修改后，也建议重新部署一次。

## API 概览

主要接口包括：

- `GET /api/bootstrap`
- `POST /api/groups`
- `PATCH /api/groups/:id`
- `DELETE /api/groups/:id`
- `POST /api/links`
- `PATCH /api/links/:id`
- `DELETE /api/links/:id`
- `POST /api/reorder`
- `GET /api/export`
- `POST /api/import`

## 项目结构

```text
src/          前端应用
worker/       Cloudflare Worker 后端
migrations/   D1 数据库迁移 SQL
public/       静态资源与 service worker
```

## 开源部署注意事项

- 不要提交真实 `.dev.vars`、`.env`、Cloudflare API token、管理员密码或 `SESSION_SECRET`。
- `wrangler.jsonc` 中的 `database_id` 必须保持为示例占位值；部署自己的实例时再替换为个人 D1 ID。
- 首次部署前必须通过 `wrangler secret put` 设置 `ADMIN_USERNAME`、`ADMIN_PASSWORD` 和 `SESSION_SECRET`。
- 数据库结构变更必须新增 migration，不要修改已发布 migration。

## 许可证

本项目基于 MIT License 开源，详见 `LICENSE`。
