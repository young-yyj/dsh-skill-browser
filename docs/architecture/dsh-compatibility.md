# DSH 兼容性验证

## 目标与改动

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
