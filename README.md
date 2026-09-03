# DSH Skill Browser

一个面向 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 的本地只读技能浏览插件。它在 DSH Web 会话标题栏中加入“技能”入口，用搜索、分类和详情面板展示可用技能。

> 当前版本适配 DeepSeek Harness `0.1.0-rc.7`。DSH 仍处于 Developer Preview，升级 DSH 后可能需要同步更新本插件。

## 功能

- 浏览当前 DSH 会话解析出的技能目录。
- 按技能名、简介、适用场景、来源和提供方搜索。
- 自动分类并显示分类数量。
- 按需以纯文本查看 `SKILL.md`、路径、来源、提供方和元数据。
- 通过 SSE 接收目录变化通知并自动刷新。
- 支持中文和英文、键盘操作、焦点循环、双层 `Esc` 和移动端布局。

## 安全边界

- 插件只提供目录、详情与事件流三个 `GET` 端点，不提供写入、安装或删除能力。
- 详情只能读取当前目录中已经登记的技能名，不能提交任意文件路径。
- 技能正文和元数据只作为 React 文本及 `<pre>` 内容显示，不执行其中的 HTML 或脚本。
- 请求会校验回环连接、回环 Host、完整同源协议及浏览器来源提示。
- 响应字段、正文长度和 SSE 连接数量均有上限；断开或出现背压时会释放连接。

安全问题请不要公开披露，参见 [SECURITY.md](SECURITY.md)。

## 环境要求

- Node.js 22 或更高版本。
- DeepSeek Harness `0.1.0-rc.7`。
- npm。

## 从源码安装

```powershell
git clone https://github.com/young-yyj/dsh-skill-browser.git
cd dsh-skill-browser
npm ci
npm run verify
dsh plugin --profile web add "link:$PWD"
```

运行：

```powershell
dsh web
```

打开一个已有会话，然后点击会话标题栏中的“技能”。

卸载：

```powershell
dsh plugin --profile web remove dsh-skill-browser
```

## 开发与验证

```powershell
npm ci
npm run verify
npm pack --dry-run
```

`npm run verify` 会依次执行类型检查、全部测试以及 Host/Client 生产构建。

参与开发前请阅读 [CONTRIBUTING.md](CONTRIBUTING.md)。

## 许可证

[MIT](LICENSE)
