# DSH 兼容性验证

## 0.1.9：适配 DSH 0.2.1-rc.2

2026-10-17 将支持声明、开发依赖、运行依赖及 peer 依赖中的 DSH 包统一更新至 `0.2.1-rc.2`，Cordis 更新至 `4.0.5`。官方新版仍保留本插件使用的标题栏 utilities 插槽、语言注册、Web 路由及 DSH Home 路径接口，业务代码无需修改。本机 `@deepseek-ai/dsh` 已升级至 `0.2.1-rc.2`。

| 检查 | 结果 |
| --- | --- |
| 修改前基线 | 83 项测试通过、1 项跳过，类型检查和构建通过 |
| 新依赖验证 | 83 项测试通过、1 项跳过，类型检查和构建通过；npm 审计 0 漏洞；业务源码零改动 |
| slots 包位置变化 | `@deepseek-ai/dsh-client-ui-slots` 已不在 DSH 0.2.1-rc.2 主包内，但 npm 仍发布 `0.2.1-rc.2`，且继续导出本插件使用的 `Translate` / `LocaleDictOf`；本插件对该包及 renderer、locale、conversation 均为 `import type`，无运行时引用，运行时只依赖 `dsh-home-paths` |
| 依赖对齐 | `@deepseek-ai/dsh-home-paths` 由 `0.2.0-rc.1` 对齐至 `0.2.1-rc.2`（本次唯一随插件依赖变更的包）。profile 内原另有 `@deepseek-ai/cordis@4.0.1`、`@deepseek-ai/schemastery@3.18.4`、`schemastery@3.18.0` 副本，`pnpm why` 显示无包依赖 cordis，属历史残留；经用户确认后删除 profile 私有的 cordis 副本，解析回落至共享层 `4.0.5`（`profiles/node_modules` 经符号链接指向 DSH 宿主），删除后 `--dump-config` 仍为 1483 行且无 `incompatible` 记录。本插件对 cordis 仅有 `import type`，无运行时引用；第三方 `@linxin666/*` 插件存在运行时 cordis 引用，现已与宿主同版本 |
| 隔离安装 | 未执行；本次按用户要求直接安装到稳定 `web` profile，运行态验证直接在该 profile 上进行 |
| 真实界面 | 用户确认通过：刷新稳定 web 后标题栏「技能」入口可见并可正常打开 |

2026-10-18 在正在运行的稳定 `web`（DSH `0.2.1-rc.2`，进程启动于 12:08）上完成运行态复核：`catalog` 返回 200 且 `revision` 为 2，38 个技能与 DSH Home `skills` 目录逐项一致；`detail` 对有效技能返回 200、缺失技能 404、非法技能名 400；`events` 返回 200 且首行为 `: connected`；跨来源请求 403、非 GET 405，均在源码契约内。profile 内安装副本与 `dsh-skill-browser-0.1.9.tgz` 逐字节一致，tgz 的 SHA256 与 `SHA256SUMS` 一致。DSH Web 自 0.2.1-rc.2 起对首页启用令牌鉴权（`GET /` 返回 401，需 `dsh web` 启动时打印的带 token 链接），不影响插件端点。

审计说明：升级依赖后 `npm audit` 曾出现 3 项 high（`undici`、`source-map-js` 来自 devDependencies 的 jsdom/vitest，`compression` 来自 DSH 官方包 `dsh-host-webserver`）；执行 `npm audit fix` 后归零，均不进入发布包（`files` 仅含 `lib`、`cordis.patch.yml`、`README.md`、`LICENSE`）。

## 0.1.8：适配 DSH 0.2.0-rc.1

2026-09-28 将支持声明、开发依赖、运行依赖及 peer 依赖中的 DSH 包统一更新至 `0.2.0-rc.1`，Cordis 保持 `4.0.4`。官方新版仍保留本插件使用的标题栏 utilities 插槽、语言注册、Web 路由及 DSH Home 路径接口，业务代码无需修改。本机 `@deepseek-ai/dsh` 已升级至 `0.2.0-rc.1`。

| 检查 | 结果 |
| --- | --- |
| 修改前基线 | 83 项测试通过、1 项跳过，类型检查和构建通过 |
| 新依赖验证 | 83 项测试通过、1 项跳过，类型检查和构建通过；npm 审计 0 漏洞；业务源码零改动 |
| 隔离安装 | 临时 DSH Home 的 web-verify（base + web-app + 本插件）使用 0.1.8 tgz 安装，不依赖源码 link；未出现 `incompatible-version` 拒绝，DSH 0.2.0-rc.1 启动成功 |
| HTTP | 目录与详情返回 200（缺失技能 404），跨来源请求返回 403 |
| 目录刷新 | 启动时已有技能目录后新增临时技能，revision 从 0 变为 1，列表从 3 项变为 4 项 |
| SSE | `/api/dsh-skill-browser/events` 返回 200 并输出 `: connected` |
| 真实界面 | 用户确认通过：稳定 web 重启后标题栏入口、搜索、筛选、详情正常 |

安装工具曾在临时 profile 写入 `minimumReleaseAgeExclude`；已移除该例外并启用 `minimumReleaseAgeStrict`，未修改日常 `web` profile 的安全配置。

已按用户要求将 0.1.8 tgz 安装到稳定 `web` profile：安装成功、未出现 `incompatible-version` 拒绝，核验安装版本为 0.1.8、声明支持 DSH 0.2.0-rc.1，`--dump-config` 含 `qx-skill-browser`。0.1.7 及更早 tgz 仍保留在 DSH Home 本地归档目录中以便回退。稳定环境重启 DSH Web 后，用户确认界面运行正常。

## 0.1.7：适配 DSH 0.1.7-rc.1

2026-09-24 将支持声明、开发依赖、运行依赖及 peer 依赖中的 DSH 包统一更新至 `0.1.7-rc.1`，Cordis 更新至 `4.0.4`。根因是 DSH 0.1.7 起在安装与 profile 启动时强制校验 `@deepseek-ai/dsh*` peer 范围与运行时版本是否匹配，不匹配且无精确豁免时以 `incompatible-version` 拒绝加载；本插件此前精确钉在 `0.1.5-rc.1`，因此无法在新版 DSH 上加载。官方新版仍保留本插件使用的标题栏 utilities 插槽、语言注册、Web 路由及 DSH Home 路径接口，业务代码无需修改。另在 `package.json` 顶层补充官方 schema 位置的 `engines.dsh` 声明。

| 检查 | 结果 |
| --- | --- |
| 修改前基线 | 83 项测试通过、1 项跳过，类型检查和构建通过 |
| 新依赖验证 | 83 项测试通过、1 项跳过，类型检查和构建通过；npm 审计 0 漏洞；业务源码零改动 |
| 隔离安装 | 临时 DSH Home 的 web-verify（base + web-app + 本插件）使用 0.1.7 tgz 安装，不依赖源码 link；未出现 `incompatible-version` 拒绝，DSH 0.1.7-rc.1 启动成功 |
| HTTP | 目录与详情返回 200，跨来源请求返回 403 |
| 目录刷新 | 新增临时技能后目录 revision 从 0 变为 1，列表从 1 项变为 2 项 |
| SSE | `/api/dsh-skill-browser/events` 返回 200 并输出 `: connected` |
| 真实界面 | 用户确认通过：稳定 web 重启后标题栏入口、搜索、筛选、详情正常 |

安装工具仍会自动在临时 profile 写入 `minimumReleaseAgeExclude`；已移除这些例外并启用 `minimumReleaseAgeStrict`，未修改日常 profile 的安全配置。

已按用户要求将 0.1.7 tgz 安装到稳定 `web` profile：安装成功、未出现 `incompatible-version` 拒绝，核验安装版本为 0.1.7、声明支持 DSH 0.1.7-rc.1，`--dump-config` 含 `qx-skill-browser`。0.1.6 及更早 tgz 仍保留在 DSH Home 本地归档目录中以便回退。稳定环境重启 DSH Web 后，用户确认界面运行正常。

## 0.1.6：适配 DSH 0.1.5-rc.1

2026-09-10 将支持声明、开发依赖及 peer 依赖中的 DSH 包统一更新至 `0.1.5-rc.1`，Cordis 保持 `4.0.2`。官方新版保留本插件使用的标题栏 utilities 插槽、语言注册、Web 路由及 DSH Home 路径接口，无需修改业务代码。README 补齐其他电脑首次安装及后续更新步骤。

| 检查 | 结果 |
| --- | --- |
| 修改前基线 | 83 项测试通过、1 项跳过，类型检查和构建通过 |
| 新依赖验证 | 83 项测试通过、1 项跳过，类型检查和构建通过；npm 审计 0 漏洞 |
| 隔离安装 | 临时 DSH Home 的 web-dev 使用 0.1.6 tgz 安装，不依赖源码 link，DSH 0.1.5-rc.1 启动成功 |
| HTTP | 目录与详情返回 200，跨来源请求返回 403 |
| 真实界面 | 标题栏入口、搜索、清空筛选、PDF 筛选及原始技能详情通过 |
| SSE | 打开的技能列表在新增临时 pdf 技能后自动从 1 项刷新至 2 项 |

已按用户要求将 DSH Home 本地归档目录中的 0.1.6 tgz 安装到稳定 web profile，核验安装版本为 0.1.6、声明支持 DSH 0.1.5-rc.1，并保留旧版本归档。安装成功，仍有 peer 依赖告警；稳定环境重启后的运行情况尚未验证。

安装工具曾自动在临时 profile 写入 minimumReleaseAgeExclude；已移除这些例外并启用 minimumReleaseAgeStrict，未修改日常 profile 的安全配置。以下为上一版历史记录。

## 0.1.5：目标与改动

插件 0.1.5 面向 DSH `0.1.2-rc.1`，Cordis `4.0.2`。

- 客户端改为注入 `@deepseek-ai/dsh-client-ui-renderer`，显式加载其 Context 类型扩展。
- 保留实际使用的 locale、conversation、slots、host-webserver 和 home-paths 依赖。
- 移除未使用的 agent、agent-presets、scope、session、session-query、skill 直接依赖，以及强制旧版传递依赖的 overrides。
- DSH 版本保持精确声明；未验证的版本不纳入兼容范围。

## 2026-09-09 至 2026-09-10 验证记录

环境为 Windows、Node.js `24.14.0`、DSH `0.1.2-rc.1`。

| 检查 | 结果 |
| --- | --- |
| 旧依赖基线 | 82 项测试通过，1 项跳过；类型检查与构建通过 |
| 新依赖验证 | 83 项测试通过，1 项跳过；类型检查与构建通过 |
| npm 依赖 | 无缺失依赖，审计 0 漏洞；依赖总数由 264 降至 135 |
| 官方接口审计 | WebRoute/register、locale.register、标题栏插槽、模块加载封装、home-paths 兼容 |
| 隔离 DSH 启动 | 临时 DSH Home 下 web-dev profile 仅加载官方 base、web-app 和本插件，启动成功 |
| 真实 HTTP | 测试技能的目录、详情均返回 200；跨来源目录请求返回 403 |
| 浏览器 | 真实会话标题栏入口、列表、PDF 输出筛选、原始技能详情均通过 |
| SSE 自动刷新 | 在临时 DSH Home 新增 pdf 测试技能后，打开的列表自动从 1 项变为 2 项 |
| 用户补测 | 搜索、清空筛选、关闭和重新打开均由用户确认正常 |
| 本地安装包 | 通过 npm pack 生成 0.1.5 tgz，使用 dsh plugin 安装到另一个临时 web-dev profile；不依赖源码 link，启动成功且目录接口返回 200 |

## 环境限制与发布门槛

原有 web-dev profile 中第三方 UI 插件引用新版已不存在的 `settingsNamespace`、`installSettingsSection`，agent-teams 调用不存在的 `registerContinuableSetup`，导致整个 profile 启动失败。这些第三方插件未在本次修改范围内。

隔离验证使用官方网页目录选择器：禁用 directory-picker 自动选择条目，插入 host-directory-picker-browse 与 client-ui-directory-picker-browse 配套条目。用户选择工作区后，执行本地 `/goal` 查询即可进入真实会话并显示标题栏，无需配置 API Key 或调用模型。此前工作区选择阻塞已解除，真实页面验收已完成。

验证完成后，已按用户要求将 DSH Home 本地归档目录中的 0.1.5 安装包安装到稳定 `web` profile，并确认安装版本及归档路径。安装成功，但 peer 依赖检查仍有告警；稳定 profile 重启后的运行情况尚未验证。

本次未修改供应链安全策略或用户技能文件。临时验证技能仅位于临时 DSH Home。
