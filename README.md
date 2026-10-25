# 知径教程｜教程导航与分享平台

中文教程导航平台，支持外部教程、安全跳转提示、推广声明、站内图文、账户收藏、密码重置和受角色保护的管理后台。

## 技术栈

- Next.js 15、React 19、TypeScript
- PostgreSQL、Prisma ORM 和版本化迁移
- bcrypt 密码哈希、JWT 签名 HttpOnly Cookie、Zod 服务端校验
- Vitest 核心安全测试

## 本地运行

要求 Node.js 20+、npm 和 PostgreSQL。可用 Docker 启动数据库：

```powershell
docker compose up -d
Copy-Item .env.example .env
npm install
npm run db:deploy
$env:ADMIN_EMAIL='admin@example.com'
$env:ADMIN_PASSWORD='请替换为至少10位且包含字母和数字的强密码'
npm run db:seed
npm run dev
```

打开 <http://localhost:3000>。后台入口为 `/admin`，只有通过种子命令初始化为 `ADMIN` 的账号可进入。

请修改 `.env` 中的数据库地址，并用密码管理器生成至少 32 字符的 `AUTH_SECRET`。不要提交 `.env` 或真实密码。

## 数据初始化与迁移

```powershell
npm run db:deploy
npm run db:seed
```

种子包含预留分类、标签和“如何开通 ChatGPT Plus”示例教程，并清楚标注推广属性。操作可重复执行。

## 密码重置

重置令牌 30 分钟有效且只能使用一次，数据库仅保存其哈希。开发环境会在页面显示重置链接；生产环境必须接入邮件服务后再开放此功能，系统不会通过日志输出令牌。

## 质量检查

```powershell
npm run typecheck
npm test
npm run build
```

## 部署到 Render

`render.yaml` 会创建 Web Service 和 PostgreSQL。部署前将代码推送至新 GitHub 仓库，在 Blueprint 中填写正式 `APP_URL`。首次部署后通过 Render Shell 临时设置 `ADMIN_EMAIL` 与 `ADMIN_PASSWORD` 并运行 `npm run db:seed`，不要把密码写入仓库。

## 合规与安全

- 推广链接明确标注；外链经提示页在新窗口打开并使用 `noopener noreferrer`。
- 本站可能因推广链接获得佣金，与 OpenAI 等第三方品牌不存在官方关联。
- 不收集第三方账号密码，不提供违法网络服务、规避监管、盗版或共享账号内容。
- 管理操作均在服务端校验管理员角色，普通用户仅能管理自己的账户和收藏。
