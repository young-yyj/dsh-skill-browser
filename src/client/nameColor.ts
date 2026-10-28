/** 稳定名称配色：同一名称(技能名/分类/来源)在所有视图中保持同一颜色。
 * 调色板变量定义在 .qx-sb-dialog 上(styles.ts)；回退值与变量定义保持一致。 */

const FALLBACKS = [
  '#4d83ff', // c1 蓝
  '#2fbf8f', // c2 绿
  '#8b72f0', // c3 紫
  '#f2994a', // c4 橙
  '#e562a4', // c5 粉
  '#3ab3c9', // c6 青
  '#d9b541', // c7 琥珀
  '#7d8fb3', // c8 蓝灰
] as const

/** djb2 哈希：确定性映射，跨会话稳定。 */
export function paletteIndexOf(name: string): number {
  let hash = 5381
  for (let i = 0; i < name.length; i++) hash = ((hash << 5) + hash + name.charCodeAt(i)) >>> 0
  return hash % FALLBACKS.length
}

export function nameColorOf(name: string): string {
  return `var(--qxsb-c${paletteIndexOf(name) + 1}, ${FALLBACKS[paletteIndexOf(name)]})`
}
