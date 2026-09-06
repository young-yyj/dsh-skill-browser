/** Capabilities reviewed for the approved browser preview; never inferred from file mentions. */
export interface SkillMetadata {
  category: string
  purpose: string
  inputs: string[]
  outputs: { format: string; role: 'primary' | 'optional' | 'intermediate' | 'result' }[]
  required: string
  optional: string
  noUpload: boolean
  note: string
}

export const BROWSER_CATEGORIES = [
  "资讯与研究",
  "写作与公众号",
  "办公文件",
  "界面与视觉设计",
  "需求与规划",
  "开发与质量保障",
  "Git 与发布",
  "项目整理与交接",
  "技能与 MCP",
  "自动化与实用工具"
] as const

const metadata: Record<string, SkillMetadata> = {
  "aihot": {
    "category": "资讯与研究",
    "purpose": "查询 AI 行业动态，整理资讯简报。",
    "inputs": [
      "需求描述"
    ],
    "outputs": [
      {
        "format": "文本答复",
        "role": "result"
      }
    ],
    "required": "资讯查询需求",
    "optional": "日期、公司或主题范围",
    "noUpload": true,
    "note": "输入：日期、主题或资讯范围；Markdown 排版的对话简报，不默认标为 .md 文件。"
  },
  "hv-analysis": {
    "category": "资讯与研究",
    "purpose": "追踪发展历程、对比同类，形成深度研究报告。",
    "inputs": [
      "需求描述",
      "URL"
    ],
    "outputs": [
      {
        "format": "PDF",
        "role": "primary"
      },
      {
        "format": "Markdown",
        "role": "primary"
      },
      {
        "format": "HTML",
        "role": "intermediate"
      }
    ],
    "required": "研究对象",
    "optional": "参考链接或资料",
    "noUpload": true,
    "note": "必需：研究对象；PDF 是最终报告，Markdown 是稿件，HTML 是转换时保存的中间文件。"
  },
  "thinking-model-router": {
    "category": "资讯与研究",
    "purpose": "选择适合当前问题的思维模型，组织分析与建议。",
    "inputs": [
      "需求描述"
    ],
    "outputs": [
      {
        "format": "文本答复",
        "role": "result"
      }
    ],
    "required": "问题与背景",
    "optional": "补充资料",
    "noUpload": true,
    "note": "必需：问题与背景；没有固定文件产物。"
  },
  "khazix-writer": {
    "category": "写作与公众号",
    "purpose": "根据主题或素材撰写公众号长文。",
    "inputs": [
      "需求描述",
      "文本素材",
      "PDF",
      "URL"
    ],
    "outputs": [
      {
        "format": "文本答复",
        "role": "result"
      }
    ],
    "required": "主题或素材（任选其一）",
    "optional": "PDF、链接、参考文章",
    "noUpload": true,
    "note": "必需：主题或素材；不将素材格式误标为输出格式。"
  },
  "sk-tutorial-builder": {
    "category": "写作与公众号",
    "purpose": "收集资料并生成完整的 AI 知识教程。",
    "inputs": [
      "需求描述"
    ],
    "outputs": [
      {
        "format": "Markdown",
        "role": "primary"
      }
    ],
    "required": "知识主题",
    "optional": "学习基础、范围与深度",
    "noUpload": true,
    "note": "必需：知识主题；可补充深度与范围。"
  },
  "gzh-design": {
    "category": "写作与公众号",
    "purpose": "将文章排成适合公众号编辑器的版式。",
    "inputs": [
      "Markdown",
      "DOCX",
      "PDF",
      "文本素材"
    ],
    "outputs": [
      {
        "format": "HTML",
        "role": "primary"
      }
    ],
    "required": "文章（文字 / Markdown / Word / PDF 任选）",
    "optional": "主题与风格",
    "noUpload": true,
    "note": "必需：文章；可选：主题风格。"
  },
  "md2wechat": {
    "category": "写作与公众号",
    "purpose": "将 Markdown 转换为公众号内容，支持配图与草稿。",
    "inputs": [
      "Markdown"
    ],
    "outputs": [
      {
        "format": "HTML",
        "role": "optional"
      },
      {
        "format": "Markdown",
        "role": "optional"
      },
      {
        "format": "公众号草稿",
        "role": "result"
      }
    ],
    "required": "Markdown 文章（可直接粘贴）",
    "optional": "主题；发布草稿时需配置",
    "noUpload": true,
    "note": "必需：文章 Markdown。HTML 转换、Markdown 整理或公众号草稿按分支选择；草稿需要相应配置。"
  },
  "docx": {
    "category": "办公文件",
    "purpose": "创建、编辑与整理 Word 文档。",
    "inputs": [
      "DOCX",
      "需求描述",
      "文本素材"
    ],
    "outputs": [
      {
        "format": "DOCX",
        "role": "primary"
      },
      {
        "format": "Markdown",
        "role": "optional"
      },
      {
        "format": "PDF",
        "role": "intermediate"
      },
      {
        "format": "JPEG",
        "role": "intermediate"
      }
    ],
    "required": "新建：内容；编辑：Word 文件",
    "optional": "版式要求",
    "noUpload": true,
    "note": "新建需要内容；编辑需要 Word 文件。主要交付 DOCX，Markdown 用于内容提取，PDF/JPEG 用于预览检查。"
  },
  "pdf": {
    "category": "办公文件",
    "purpose": "创建、提取、合并、拆分和处理 PDF。",
    "inputs": [
      "PDF",
      "文本素材",
      "需求描述"
    ],
    "outputs": [
      {
        "format": "PDF",
        "role": "optional"
      },
      {
        "format": "TXT",
        "role": "optional"
      },
      {
        "format": "XLSX",
        "role": "optional"
      },
      {
        "format": "JPEG",
        "role": "optional"
      }
    ],
    "required": "新建：内容；处理：PDF 文件",
    "optional": "页面与导出要求",
    "noUpload": true,
    "note": "新建需要内容，编辑需要 PDF；按任务生成 PDF、导出 TXT、表格 XLSX 或内嵌 JPEG。"
  },
  "pptx": {
    "category": "办公文件",
    "purpose": "创建或修改演示文稿、版式与演讲备注。",
    "inputs": [
      "PPTX",
      "需求描述",
      "文本素材"
    ],
    "outputs": [
      {
        "format": "PPTX",
        "role": "primary"
      },
      {
        "format": "Markdown",
        "role": "optional"
      },
      {
        "format": "PDF",
        "role": "intermediate"
      },
      {
        "format": "JPEG",
        "role": "intermediate"
      }
    ],
    "required": "新建：主题与内容；编辑：PPTX",
    "optional": "模板与参考风格",
    "noUpload": true,
    "note": "新建需要目标与大纲；编辑需要 PPTX。Markdown 用于抽取，PDF/JPEG 用于预览检查。"
  },
  "xlsx": {
    "category": "办公文件",
    "purpose": "创建与处理工作簿、公式、数据和图表。",
    "inputs": [
      "XLSX",
      "XLSM",
      "CSV",
      "TSV",
      "需求描述"
    ],
    "outputs": [
      {
        "format": "XLSX",
        "role": "optional"
      },
      {
        "format": "XLSM",
        "role": "optional"
      },
      {
        "format": "CSV",
        "role": "optional"
      },
      {
        "format": "TSV",
        "role": "optional"
      }
    ],
    "required": "新建：数据或需求；编辑：表格文件",
    "optional": "公式与格式要求",
    "noUpload": true,
    "note": "新建需要数据或需求，编辑需要表格；具体表格格式依转换或编辑任务。"
  },
  "frontend-design": {
    "category": "界面与视觉设计",
    "purpose": "设计并实现网页、组件及交互界面。",
    "inputs": [
      "需求描述",
      "代码项目"
    ],
    "outputs": [
      {
        "format": "HTML",
        "role": "optional"
      },
      {
        "format": "代码改动",
        "role": "result"
      }
    ],
    "required": "界面目标与功能需求",
    "optional": "现有项目、参考设计",
    "noUpload": true,
    "note": "必需：界面需求；HTML 为可选实现形式，依技术栈而定。"
  },
  "claude-design-card": {
    "category": "界面与视觉设计",
    "purpose": "把文字与网页制作成信息卡、封面和分享图片。",
    "inputs": [
      "文本素材",
      "URL"
    ],
    "outputs": [
      {
        "format": "HTML",
        "role": "primary"
      },
      {
        "format": "PNG",
        "role": "optional"
      }
    ],
    "required": "文本内容或网页链接（二选一）",
    "optional": "尺寸、平台与风格",
    "noUpload": true,
    "note": "必需：内容或链接；可选：卡片尺寸与风格。"
  },
  "theme-factory": {
    "category": "界面与视觉设计",
    "purpose": "为已有文档、页面与演示应用统一视觉主题。",
    "inputs": [
      "HTML",
      "DOCX",
      "PPTX"
    ],
    "outputs": [
      {
        "format": "HTML",
        "role": "optional"
      },
      {
        "format": "DOCX",
        "role": "optional"
      },
      {
        "format": "PPTX",
        "role": "optional"
      }
    ],
    "required": "已有页面、文档或演示作品",
    "optional": "主题偏好",
    "noUpload": false,
    "note": "必需：已有作品；HTML、Word 或 PPT 按原格式修改主题。内置 PDF 示例不计为输出能力。"
  },
  "brainstorming": {
    "category": "需求与规划",
    "purpose": "澄清想法、比较方案，并形成设计说明。",
    "inputs": [
      "需求描述",
      "代码项目"
    ],
    "outputs": [
      {
        "format": "Markdown",
        "role": "optional"
      },
      {
        "format": "文本答复",
        "role": "result"
      }
    ],
    "required": "想法或目标",
    "optional": "现有项目背景",
    "noUpload": true,
    "note": "必需：想法或目标；项目背景按场景提供。"
  },
  "sk-prd-writer": {
    "category": "需求与规划",
    "purpose": "将产品想法整理为可以用于开发的需求文档。",
    "inputs": [
      "需求描述"
    ],
    "outputs": [
      {
        "format": "文本答复",
        "role": "result"
      }
    ],
    "required": "产品想法或功能需求",
    "optional": "竞品与已有资料",
    "noUpload": true,
    "note": "必需：产品想法；生成 PRD，说明采用 Markdown 风格模板，但未明确保存 .md 文件。"
  },
  "writing-plans": {
    "category": "需求与规划",
    "purpose": "把已明确的设计拆解为可执行实施计划。",
    "inputs": [
      "文本素材",
      "代码项目"
    ],
    "outputs": [
      {
        "format": "Markdown",
        "role": "primary"
      }
    ],
    "required": "明确的需求或设计与项目上下文",
    "optional": "实施约束",
    "noUpload": false,
    "note": "必需：已明确的需求或设计；代码上下文按项目提供。"
  },
  "executing-plans": {
    "category": "开发与质量保障",
    "purpose": "按既定计划实施任务，并逐步验证。",
    "inputs": [
      "Markdown",
      "代码项目"
    ],
    "outputs": [
      {
        "format": "代码改动",
        "role": "result"
      },
      {
        "format": "文本答复",
        "role": "result"
      }
    ],
    "required": "实施计划与对应项目",
    "optional": "检查点要求",
    "noUpload": false,
    "note": "必需：实施计划与对应项目；结果随计划而定。"
  },
  "subagent-driven-development": {
    "category": "开发与质量保障",
    "purpose": "用子代理执行独立开发任务并进行审查。",
    "inputs": [
      "Markdown",
      "代码项目"
    ],
    "outputs": [
      {
        "format": "代码改动",
        "role": "result"
      },
      {
        "format": "文本答复",
        "role": "result"
      }
    ],
    "required": "可拆分的计划与对应项目",
    "optional": "任务边界",
    "noUpload": false,
    "note": "必需：可拆分的实施计划与项目。"
  },
  "dispatching-parallel-agents": {
    "category": "开发与质量保障",
    "purpose": "分派独立任务并汇总并行工作结果。",
    "inputs": [
      "需求描述",
      "代码项目"
    ],
    "outputs": [
      {
        "format": "文本答复",
        "role": "result"
      }
    ],
    "required": "多个可独立完成的任务",
    "optional": "各任务的材料",
    "noUpload": true,
    "note": "必需：多个可独立完成的任务；交付随子任务而定。"
  },
  "test-driven-development": {
    "category": "开发与质量保障",
    "purpose": "先写失败测试，再实现并重构代码。",
    "inputs": [
      "需求描述",
      "代码项目"
    ],
    "outputs": [
      {
        "format": "代码改动",
        "role": "result"
      }
    ],
    "required": "功能或缺陷需求与对应代码",
    "optional": "验收用例",
    "noUpload": false,
    "note": "必需：功能或缺陷需求及对应代码。"
  },
  "systematic-debugging": {
    "category": "开发与质量保障",
    "purpose": "复现异常并沿数据流定位根因。",
    "inputs": [
      "代码项目",
      "日志",
      "需求描述"
    ],
    "outputs": [
      {
        "format": "文本答复",
        "role": "result"
      },
      {
        "format": "代码改动",
        "role": "result"
      }
    ],
    "required": "问题现象与可调查的环境",
    "optional": "日志、复现步骤",
    "noUpload": false,
    "note": "必需：问题现象与可调查上下文；代码改动取决于是否进入修复。"
  },
  "requesting-code-review": {
    "category": "开发与质量保障",
    "purpose": "发起代码审查，检查实现与需求是否一致。",
    "inputs": [
      "代码项目",
      "文本素材"
    ],
    "outputs": [
      {
        "format": "文本答复",
        "role": "result"
      }
    ],
    "required": "待审查改动",
    "optional": "需求与验收说明",
    "noUpload": false,
    "note": "必需：待审查改动；可选：需求说明。"
  },
  "receiving-code-review": {
    "category": "开发与质量保障",
    "purpose": "核实审查建议并落实适用的修改。",
    "inputs": [
      "代码项目",
      "文本素材"
    ],
    "outputs": [
      {
        "format": "文本答复",
        "role": "result"
      },
      {
        "format": "代码改动",
        "role": "result"
      }
    ],
    "required": "审查意见与对应代码",
    "optional": "需求背景",
    "noUpload": false,
    "note": "必需：审查意见及对应代码。"
  },
  "verification-before-completion": {
    "category": "开发与质量保障",
    "purpose": "用测试与检查证据确认完成状态。",
    "inputs": [
      "代码项目"
    ],
    "outputs": [
      {
        "format": "文本答复",
        "role": "result"
      }
    ],
    "required": "待验证项目与验收目标",
    "optional": "检查约束",
    "noUpload": false,
    "note": "必需：待验证项目与验收目标。"
  },
  "using-git-worktrees": {
    "category": "Git 与发布",
    "purpose": "为开发任务准备隔离的 Git 工作目录。",
    "inputs": [
      "代码项目",
      "需求描述"
    ],
    "outputs": [
      {
        "format": "仓库操作",
        "role": "result"
      }
    ],
    "required": "对应项目与任务目标",
    "optional": "补充要求",
    "noUpload": false,
    "note": "必需：Git 仓库及任务；输出是工作区操作结果。"
  },
  "finishing-a-development-branch": {
    "category": "Git 与发布",
    "purpose": "完成开发分支的合并、PR 或清理。",
    "inputs": [
      "代码项目"
    ],
    "outputs": [
      {
        "format": "仓库操作",
        "role": "result"
      },
      {
        "format": "文本答复",
        "role": "result"
      }
    ],
    "required": "对应项目与任务目标",
    "optional": "补充要求",
    "noUpload": false,
    "note": "必需：已完成并验证的开发分支。"
  },
  "sk-commit-guard": {
    "category": "Git 与发布",
    "purpose": "核对文档与变更并准备本地提交。",
    "inputs": [
      "代码项目"
    ],
    "outputs": [
      {
        "format": "仓库操作",
        "role": "result"
      },
      {
        "format": "Markdown",
        "role": "optional"
      }
    ],
    "required": "对应项目与任务目标",
    "optional": "补充要求",
    "noUpload": false,
    "note": "必需：待提交项目改动；可能同步项目文档。"
  },
  "sk-git-history-clean": {
    "category": "Git 与发布",
    "purpose": "清理提交信息与作者等 Git 历史元数据。",
    "inputs": [
      "代码项目",
      "需求描述"
    ],
    "outputs": [
      {
        "format": "仓库操作",
        "role": "result"
      }
    ],
    "required": "对应项目与任务目标",
    "optional": "补充要求",
    "noUpload": false,
    "note": "必需：Git 仓库与明确的历史整理目标。"
  },
  "sk-github-audit": {
    "category": "Git 与发布",
    "purpose": "审查项目首次上传 GitHub 的准备情况。",
    "inputs": [
      "代码项目"
    ],
    "outputs": [
      {
        "format": "文本答复",
        "role": "result"
      },
      {
        "format": "代码改动",
        "role": "result"
      }
    ],
    "required": "对应项目与任务目标",
    "optional": "补充要求",
    "noUpload": false,
    "note": "必需：本地项目；实际改动取决于选定修复项。"
  },
  "sk-github-launch": {
    "category": "Git 与发布",
    "purpose": "引导本地项目首次发布到 GitHub。",
    "inputs": [
      "代码项目",
      "需求描述"
    ],
    "outputs": [
      {
        "format": "仓库操作",
        "role": "result"
      },
      {
        "format": "文本答复",
        "role": "result"
      }
    ],
    "required": "对应项目与任务目标",
    "optional": "补充要求",
    "noUpload": false,
    "note": "必需：本地项目；发布时需要目标仓库与访问权限。"
  },
  "sk-project-structure": {
    "category": "项目整理与交接",
    "purpose": "规范项目目录布局与协作入口。",
    "inputs": [
      "代码项目"
    ],
    "outputs": [
      {
        "format": "代码改动",
        "role": "result"
      }
    ],
    "required": "对应项目与任务目标",
    "optional": "补充要求",
    "noUpload": false,
    "note": "必需：待整理项目目录。"
  },
  "sk-ai-context-docs": {
    "category": "项目整理与交接",
    "purpose": "生成帮助 AI 理解项目的上下文文档。",
    "inputs": [
      "代码项目"
    ],
    "outputs": [
      {
        "format": "Markdown",
        "role": "primary"
      }
    ],
    "required": "对应项目与任务目标",
    "optional": "补充要求",
    "noUpload": false,
    "note": "必需：项目；输出至 docs/ai-context/。"
  },
  "neat-freak": {
    "category": "项目整理与交接",
    "purpose": "核对代码、项目文档与记忆的一致性。",
    "inputs": [
      "代码项目"
    ],
    "outputs": [
      {
        "format": "Markdown",
        "role": "optional"
      },
      {
        "format": "文本答复",
        "role": "result"
      }
    ],
    "required": "对应项目与任务目标",
    "optional": "补充要求",
    "noUpload": false,
    "note": "必需：项目当前状态；更新相关文档与记忆。"
  },
  "skill-creator": {
    "category": "技能与 MCP",
    "purpose": "创建、改进和评估技能。",
    "inputs": [
      "需求描述",
      "技能文件"
    ],
    "outputs": [
      {
        "format": "Markdown",
        "role": "optional"
      },
      {
        "format": "代码改动",
        "role": "result"
      }
    ],
    "required": "新建：技能目标；优化：现有技能",
    "optional": "示例与评估标准",
    "noUpload": true,
    "note": "新建需要目标；优化需要现有技能及评估目标。"
  },
  "writing-skills": {
    "category": "技能与 MCP",
    "purpose": "编写与验证可复用的技能说明。",
    "inputs": [
      "需求描述",
      "技能文件"
    ],
    "outputs": [
      {
        "format": "Markdown",
        "role": "primary"
      }
    ],
    "required": "技能目标；修改时需已有技能",
    "optional": "测试场景",
    "noUpload": true,
    "note": "必需：技能目标；编辑时需要已有技能。"
  },
  "using-superpowers": {
    "category": "技能与 MCP",
    "purpose": "建立技能发现与调用的工作流程。",
    "inputs": [
      "需求描述"
    ],
    "outputs": [
      {
        "format": "文本答复",
        "role": "result"
      }
    ],
    "required": "当前任务上下文",
    "optional": "无特定要求",
    "noUpload": true,
    "note": "输入为当前任务上下文；无固定文件输出。"
  },
  "mcp-builder": {
    "category": "技能与 MCP",
    "purpose": "构建连接外部工具和服务的 MCP 服务端。",
    "inputs": [
      "需求描述",
      "代码项目"
    ],
    "outputs": [
      {
        "format": "代码改动",
        "role": "result"
      }
    ],
    "required": "服务目标与接口说明",
    "optional": "现有项目",
    "noUpload": true,
    "note": "必需：目标服务及接口说明；现有代码可选。"
  },
  "agent-browser": {
    "category": "自动化与实用工具",
    "purpose": "操作网页、提取页面信息与生成截图。",
    "inputs": [
      "URL",
      "需求描述"
    ],
    "outputs": [
      {
        "format": "浏览器操作",
        "role": "result"
      },
      {
        "format": "文本答复",
        "role": "result"
      }
    ],
    "required": "目标网页与操作需求",
    "optional": "登录态（按站点需要）",
    "noUpload": true,
    "note": "必需：目标页面与操作目标；说明提到截图但未明确扩展名，暂不推断 PNG/PDF。"
  },
  "sk-ts-translate": {
    "category": "自动化与实用工具",
    "purpose": "翻译 Qt Linguist 未完成条目并保留 XML 格式。",
    "inputs": [
      "Qt TS"
    ],
    "outputs": [
      {
        "format": "Qt TS",
        "role": "primary"
      },
      {
        "format": "JSON",
        "role": "intermediate"
      }
    ],
    "required": "Qt TS 文件与目标语言",
    "optional": "术语约定",
    "noUpload": false,
    "note": "必需：Qt TS 文件及目标语言；最终输出 _translated.ts，JSON 为翻译映射中间文件。"
  },
  "storage-analyzer": {
    "category": "自动化与实用工具",
    "purpose": "分析磁盘空间并生成交互式存储报告。",
    "inputs": [
      "本机目录"
    ],
    "outputs": [
      {
        "format": "HTML",
        "role": "primary"
      },
      {
        "format": "JSON",
        "role": "primary"
      },
      {
        "format": "文本答复",
        "role": "result"
      }
    ],
    "required": "本机磁盘访问权限",
    "optional": "指定扫描目录",
    "noUpload": false,
    "note": "无需上传文件，读取本机磁盘。HTML 为报告，JSON 为扫描数据；交互版依赖本地服务。"
  }
}

export function getSkillMetadata(name: string): SkillMetadata | undefined {
  return Object.hasOwn(metadata, name) ? metadata[name] : undefined
}
