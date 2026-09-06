# DSH Skill Browser

一个面向 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 的本地只读技能浏览插件。它在 DSH Web 会话标题栏中加入“技能”入口，用搜索、分类和详情面板展示 DSH Home `skills` 目录中的技能。

> 当前版本适配 DeepSeek Harness `0.1.0-rc.7`。DSH 仍处于 Developer Preview，升级 DSH 后可能需要同步更新本插件。

## 功能

- 只浏览 DSH Home 的 `<DSH_HOME>/skills/*/SKILL.md`，不读取项目目录或当前会话的技能注册表。
- 按技能名、简介、适用场景、来源和提供方搜索。
- 现有 41 个技能使用已审核的 10 类用途映射；未收录技能显示在“其他”，输入输出格式标为待确认。
- 按输出格式与输入材料筛选：输出支持任意/全部匹配，跨组条件同时满足，可排除中间/预览产物。
- 卡片展示“适用于、输入、可选、输出”，区分主要交付、按需输出与中间产物；同一行同步展开详情。
- 无结果时提供带结果数量的放宽条件建议；点击技能名可查看原始技能文件。
- 支持 YAML 多行简介、UTF-8 BOM 和 Windows 换行；缺少简介时显示占位提示，元数据解析失败时保留技能并在详情中显示原因。
- 按需以纯文本查看 `SKILL.md`、路径、来源、提供方和元数据。
- 通过 SSE 接收目录变化通知并自动刷新。
- 支持中文和英文、键盘操作、焦点循环、双层 `Esc` 和移动端布局。

## 安全边界

- 插件只提供目录、详情与事件流三个 `GET` 端点，不提供写入、安装或删除能力。
- 详情只能读取 DSH Home 目录中已经枚举的技能名，不能提交任意文件路径。
- 技能正文和元数据只作为 React 文本及 `<pre>` 内容显示，不执行其中的 HTML 或脚本。
- 请求会校验回环连接、回环 Host、完整同源协议及浏览器来源提示。
- 响应字段、正文长度和 SSE 连接数量均有上限；断开或出现背压时会释放连接。

安全问题请不要公开披露，参见 [SECURITY.md](SECURITY.md)。

## 环境要求

- Node.js 22 或更高版本。
- DeepSeek Harness `0.1.0-rc.7`。
- npm。

## 稳定安装与手动更新

稳定版插件安装在 DSH Home 的本地包目录中，与本仓库解耦；因此可以移动、删除或重新克隆本仓库，而不影响日常使用的 `web` profile。

每次确认修改可发布后，在项目目录执行：

```powershell
npm run verify
npm run build
npm version patch --no-git-tag-version

$dshRoot = if ($env:DSH_HOME) { $env:DSH_HOME } else { Join-Path ([Environment]::GetFolderPath('UserProfile')) '.dsh' }
$archiveDir = Join-Path $dshRoot 'local-packages/dsh-skill-browser'
New-Item -ItemType Directory -Force -Path $archiveDir | Out-Null
$pack = npm pack --json --pack-destination $archiveDir | ConvertFrom-Json
$tarball = Join-Path $archiveDir $pack[0].filename
dsh plugin --profile web add $tarball --save-exact
```

然后重启稳定版 DSH Web：

```powershell
dsh web --no-open
```

`npm version patch --no-git-tag-version` 只更新本地版本号；请在验证后将该版本号变更与代码一起提交。每次发布保留上一版本 `.tgz`，以便回退。

## 开发安装与即时验证

开发 profile 使用源码链接，不影响稳定 `web` profile。首次创建开发环境：

```powershell
dsh plugin --profile web-dev add "link:$PWD" --save-exact
```

日常开发时，修改代码后执行：

```powershell
npm run build
dsh --profile web-dev web
```

重新启动开发版 Web 并打开已有会话，即可在会话标题栏验证“技能”入口和浏览器功能。开发 profile 依赖当前源码目录；稳定 profile 不依赖该目录。

## 开发与验证

```powershell
npm ci
npm run verify
npm pack --dry-run
```

`npm run verify` 会依次执行类型检查、全部测试以及 Host/Client 生产构建。

分类、输入与输出资料在 `src/skill-metadata.ts` 中维护，筛选逻辑在 `src/client/skill-filters.ts` 中维护。新增或更新技能后，应核对其说明再更新映射；不能仅凭正文出现的文件扩展名认定输出能力。技能原文件始终只读。

版本 0.1.4 的界面已通过独立 React 测试页面与真实目录快照验证；为遵守手动启动偏好，安装后由使用者自行重启 DSH Web，完成运行环境复核。

参与开发前请阅读 [CONTRIBUTING.md](CONTRIBUTING.md)。

架构说明：[技能目录与安全边界](docs/architecture/dsh-home-skills-catalog.md)、[稳定与开发环境分离](docs/architecture/dsh-profile-separation.md)。历史实施计划保留在本地 `docs/superpowers/plans/`，不纳入版本控制。

## 许可证

[MIT](LICENSE)
