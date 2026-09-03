import type { SkillCategory } from './contracts.ts'

interface ClassifiableSkill {
  name: string
  description: string
  whenToUse?: string
}

const RULES: readonly (readonly [SkillCategory, RegExp])[] = [
  ['spreadsheets', /\b(xlsx|excel|spreadsheet|csv|table)\b|表格|工作簿/iu],
  ['documents', /\b(pdf|docx|word|document|wechat|markdown)\b|文档|公众号|排版/iu],
  ['design', /\b(frontend|design|ux|ui|theme|layout)\b|设计|界面|主题/iu],
  ['visual', /\b(image|canvas|poster|visual)\b|图片|图像|海报|视觉/iu],
  ['media', /\b(audio|speech|video|media|voice)\b|语音|音频|视频|媒体/iu],
  ['data', /\b(data|chart|dashboard|visualization|analysis)\b|数据|图表|看板|分析/iu],
  ['research', /\b(search|research|writer|article|paper|scholar)\b|搜索|研究|写作|论文/iu],
  ['collaboration', /\b(agent|subagent|dispatch|parallel|team)\b|多端|协同|代理/iu],
  ['governance', /\b(review|verification|plan|tdd|debug|commit|git)\b|审查|验证|计划|治理/iu],
  ['system', /\b(windows|storage|archive|filesystem|browser)\b|系统|存储|归档/iu],
  ['dsh', /\b(dsh|deepseek|harness|cordis|mcp)\b/iu],
  ['development', /\b(code|developer|build|test|plugin|skill)\b|开发|代码|插件|技能/iu],
  ['lifestyle', /\b(life|music|game|travel|entertainment)\b|生活|娱乐|音乐|游戏/iu],
]

export function classifySkill(skill: ClassifiableSkill): SkillCategory {
  const text = `${skill.name}\n${skill.description}\n${skill.whenToUse ?? ''}`
  return RULES.find(([, pattern]) => pattern.test(text))?.[0] ?? 'other'
}
