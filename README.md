# AeroNav

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/Liebesfreud/AeroNav)

> 一键部署会打开 Cloudflare 部署流程；部署前仍需要创建自己的 D1 数据库，并配置 `ADMIN_USERNAME`、`ADMIN_PASSWORD`、`SESSION_SECRET` 等 secrets。

AeroNav 是一个简洁的个人导航页项目，用来管理常用链接、分组和界面偏好。

## 功能简介

- 导航首页：展示和搜索链接
- 分组与链接管理：支持新增、删除、排序
- 设置页：支持主题、密度、打开方式等配置
- 数据导入/导出：可备份和恢复 JSON 数据
- 后端接口：基于 Cloudflare Workers
- 数据存储：使用 Cloudflare D1

## 技术栈

- React 19
- TypeScript
- Vite
- React Router
- TanStack Query
- Cloudflare Workers
- Cloudflare D1
- Zod
- Tailwind CSS

## 页面

- `/`：导航首页
- `/settings`：设置页
- `/widgets`：组件页

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

```bash
npm run build
```

## 部署到 Cloudflare

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/Liebesfreud/AeroNav)

这个项目部署目标是 **Cloudflare Workers + Workers Assets + D1**，不是 Cloudflare Pages。

> 重要：Cloudflare Deploy Button 只是帮你快速进入 Cloudflare 部署流程，不会自动替你创建 D1 数据库，也不会替你生成管理员账号和 session 密钥。AeroNav 不是纯静态站，必须完成下面的 D1 和 secrets 配置，否则部署后无法正常使用。

### 一键部署流程

推荐使用 **先 Fork，再部署** 的方式。不要直接把你自己的真实 `database_id` 提交回上游仓库。

1. Fork 本仓库

   点击 GitHub 页面右上角的 **Fork**，把 AeroNav 复制到你自己的 GitHub 账号下。

2. 安装依赖并登录 Cloudflare

   在你 fork 后的仓库本地执行：

   ```bash
   npm install
   npx wrangler login
   ```

3. 创建 D1 数据库

   ```bash
   npx wrangler d1 create aeronav-db
   ```

   命令执行成功后会输出类似下面的信息：

   ```text
   [[d1_databases]]
   binding = "DB"
   database_name = "aeronav-db"
   database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
   ```

   复制其中的 `database_id`。

4. 修改你的 `wrangler.jsonc`

   把 `YOUR_D1_DATABASE_ID` 替换成刚才创建出来的真实 D1 ID：

   ```jsonc
   "d1_databases": [
     {
       "binding": "DB",
       "database_name": "aeronav-db",
       "database_id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
       "migrations_dir": "migrations"
     }
   ]
   ```

   这个 ID 不是密码，但它是你的部署环境标识。公开模板仓库里应保留占位值；自己的私有 fork 或部署分支中才替换成真实值。

5. 提交配置到你的 fork

   ```bash
   git add wrangler.jsonc
   git commit -m "Configure D1 database"
   git push
   ```

6. 打开 Cloudflare Deploy Button

   如果你部署的是上游仓库，可以点击本节顶部按钮。

   如果你部署的是自己的 fork，更推荐手动打开下面这个地址，并把 `<your-github-name>` 替换成你的 GitHub 用户名：

   ```text
   https://deploy.workers.cloudflare.com/?url=https://github.com/<your-github-name>/AeroNav
   ```

7. 在 Cloudflare 页面完成授权和项目创建

   按 Cloudflare 页面提示选择账号、仓库和部署项目。首次部署时如果提示需要 GitHub 授权，按页面提示授权即可。

8. 设置管理员登录 secrets

   部署完成后，在本地仓库执行：

   ```bash
   npx wrangler secret put ADMIN_USERNAME
   npx wrangler secret put ADMIN_PASSWORD
   npx wrangler secret put SESSION_SECRET
   ```

   建议：

   - `ADMIN_USERNAME`：不要使用过于明显的用户名。
   - `ADMIN_PASSWORD`：使用强密码，不要复用其他网站密码。
   - `SESSION_SECRET`：使用足够随机的长字符串，例如 32 字符以上。

9. 执行远程数据库迁移

   ```bash
   npm run db:migrate:remote
   ```

10. 重新部署 Worker

    ```bash
    npm run cf:deploy
    ```

11. 访问你的 Worker 地址

    部署成功后，Cloudflare 会给出类似下面的地址：

    ```text
    https://aeronav.<your-subdomain>.workers.dev
    ```

    打开站点后，使用刚才设置的管理员账号和密码登录。

### 手动部署流程

如果你不使用 Cloudflare Deploy Button，可以完全通过命令行部署：

```bash
npm install
npx wrangler login
npx wrangler d1 create aeronav-db
```

然后把输出的 `database_id` 填入 `wrangler.jsonc`，再执行：

```bash
npm run build
npm run db:migrate:remote
npm run cf:deploy
npx wrangler secret put ADMIN_USERNAME
npx wrangler secret put ADMIN_PASSWORD
npx wrangler secret put SESSION_SECRET
```

如果 secrets 是在首次部署后才设置的，建议再执行一次：

```bash
npm run cf:deploy
```

### 本地部署前验证

部署前建议先在本地确认项目可以构建：

```bash
npm run typecheck
npm run build
npm audit --audit-level=moderate
```

### 管理员登录说明

项目使用 **Worker 内置管理员登录**，不依赖 Cloudflare Access。

后端需要以下运行时配置：

- `ADMIN_USERNAME`：管理员用户名
- `ADMIN_PASSWORD`：管理员明文密码
- `SESSION_SECRET`：用于签名 session cookie 的密钥

认证相关接口：

- `POST /api/login`
- `POST /api/logout`

登录成功后，Worker 会返回 `HttpOnly` session cookie。后续访问其他业务 API 和页面时都需要携带该 cookie。

### 常见问题

- 部署时报 `database_id` 无效：确认 `wrangler.jsonc` 中已经把 `YOUR_D1_DATABASE_ID` 替换成真实 D1 ID。
- 登录接口报错：确认已经设置 `ADMIN_USERNAME`、`ADMIN_PASSWORD`、`SESSION_SECRET` 三个 secrets，并重新部署 Worker。
- 页面能打开但没有数据：确认已经执行 `npm run db:migrate:remote`。
- 不要把 `.dev.vars`、Cloudflare API token、管理员密码或 `SESSION_SECRET` 提交到 GitHub。

### 推荐上线顺序

```bash
npm run typecheck
npm run build
npm run db:migrate:remote
npm run cf:deploy
```
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
src/
  app/         应用入口与路由
  features/    页面与功能模块
  lib/         API 与通用逻辑
  hooks/       React Hooks
worker/        Cloudflare Worker 后端
migrations/    D1 数据库迁移
```

## 说明

这是一个前后端一体的导航站项目：前端负责界面与交互，Worker 提供 API，D1 负责持久化存储。
## 开源部署注意事项

- 不要提交真实 `.dev.vars`、`.env`、Cloudflare API token、管理员密码或 `SESSION_SECRET`。
- `wrangler.jsonc` 中的 `database_id` 必须保持为示例占位值；部署自己的实例时再替换为个人 D1 ID。
- 首次部署前必须通过 `wrangler secret put` 设置 `ADMIN_USERNAME`、`ADMIN_PASSWORD` 和 `SESSION_SECRET`。
- 数据库结构变更必须新增 migration，不要修改已发布 migration。

## 许可证

本项目基于 MIT License 开源，详见 `LICENSE`。




