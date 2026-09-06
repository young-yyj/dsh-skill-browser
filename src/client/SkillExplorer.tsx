import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { BrowserSkillSummary } from '../contracts.ts'
import { BROWSER_CATEGORIES, getSkillMetadata } from '../skill-metadata.ts'
import { DEFAULT_FILTERS, filterCatalog, type FilterState } from './skill-filters.ts'
import { SkillCard } from './SkillCard.tsx'
import type { SkillBrowserTranslate } from './SkillBrowser.tsx'

const COMMON = ['HTML', 'PDF', 'PNG', 'DOCX', 'PPTX', 'XLSX', 'Markdown']
const EXTRA = ['JPEG', 'XLSM', 'CSV', 'TSV', 'TXT', 'JSON', 'Qt TS']
const RESULTS = ['文本答复', '代码改动', '仓库操作', '浏览器操作', '公众号草稿']
const INPUTS = ['需求描述', '文本素材', 'URL', 'PDF', 'HTML', 'Markdown', 'DOCX', 'PPTX', 'XLSX', 'XLSM', 'CSV', 'TSV', '代码项目', '日志', '技能文件', 'Qt TS', '本机目录']
const FORMAT_LABELS: Record<string, string> = { DOCX: 'Word · DOCX', PPTX: 'PPT · PPTX', XLSX: 'Excel · XLSX', PNG: 'PNG' }

export function SkillExplorer({ skills, query, onQueryChange, t, onOpen }: {
  skills: BrowserSkillSummary[]
  query: string
  onQueryChange: (query: string) => void
  t: SkillBrowserTranslate
  onOpen: (name: string) => void
}): React.JSX.Element {
  const [selection, setSelection] = useState<FilterState>({ ...DEFAULT_FILTERS, inputs: [], outputs: [] })
  const filters = useMemo(() => ({ ...selection, query }), [selection, query])
  const filtered = useMemo(() => filterCatalog(skills, filters), [skills, filters])
  const grid = useRef<HTMLDivElement>(null)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const english = t('category.all') === 'All'
  const l = (zh: string, en: string): string => english ? en : zh
  const patch = (next: Partial<FilterState>): void => {
    if (next.query !== undefined) onQueryChange(next.query)
    setSelection(previous => ({ ...previous, ...next }))
  }
  const clear = (): void => { patch({ ...DEFAULT_FILTERS, inputs: [], outputs: [], query: '' }) }
  const toggle = (key: 'outputs' | 'inputs', value: string): void => {
    patch({ [key]: selection[key].includes(value) ? selection[key].filter(item => item !== value) : [...selection[key], value] })
  }
  const rows = useCallback((): HTMLElement[][] => {
    const groups: { top: number, cards: HTMLElement[] }[] = []
    for (const card of grid.current?.querySelectorAll<HTMLElement>('[data-skill-card]') ?? []) {
      const top = card.getBoundingClientRect().top
      let group = groups.find(row => Math.abs(row.top - top) < 2)
      if (!group) { group = { top, cards: [] }; groups.push(group) }
      group.cards.push(card)
    }
    return groups.map(group => group.cards)
  }, [])
  const toggleRow = (name: string): void => {
    const row = rows().find(items => items.some(card => card.dataset.skillCard === name)) ?? []
    setExpanded(previous => {
      const next = new Set(previous)
      for (const card of row) {
        const key = card.dataset.skillCard!
        if (previous.has(name)) next.delete(key)
        else next.add(key)
      }
      return next
    })
  }
  useLayoutEffect(() => {
    setExpanded(new Set())
  }, [filtered])
  useLayoutEffect(() => {
    if (!grid.current || typeof ResizeObserver === 'undefined') return
    let width = grid.current.getBoundingClientRect().width
    const observer = new ResizeObserver(entries => {
      const nextWidth = entries[0]?.contentRect.width ?? width
      if (Math.abs(nextWidth - width) < 1) return
      width = nextWidth
      const currentRows = rows()
      setExpanded(previous => {
        const next = new Set(previous)
        for (const row of currentRows) {
          if (row.some(card => previous.has(card.dataset.skillCard!))) {
            for (const card of row) next.add(card.dataset.skillCard!)
          }
        }
        return next
      })
    })
    observer.observe(grid.current)
    return () => observer.disconnect()
  }, [rows, filtered])
  const count = (change: Partial<FilterState>): number => filterCatalog(skills, { ...filters, ...change }).length
  const outputChip = (format: string): React.JSX.Element => (
    <button key={format} type="button" className="qx-sb-pill qx-sb-output-pill" data-output={format}
      aria-pressed={filters.outputs.includes(format)} onClick={() => toggle('outputs', format)}
      title={l('保留其他组条件时支持此格式的技能数', 'Skills supporting this format under the other filter groups')}>
      {FORMAT_LABELS[format] ?? format} <span className="qx-sb-pill-count">{count({ outputs: [format], mode: 'any' })}</span>
    </button>
  )
  const alternatives: { label: string, change: Partial<FilterState> }[] = []
  if (filters.inputs.length || filters.noUpload) alternatives.push({ label: l('移除输入限制', 'Remove input restrictions'), change: { inputs: [], noUpload: false } })
  if (filters.category !== 'all') alternatives.push({ label: l('不限用途分类', 'Any category'), change: { category: 'all' } })
  if (filters.mode === 'all' && filters.outputs.length > 1) alternatives.push({ label: l('输出改为任意匹配', 'Match any output'), change: { mode: 'any' } })
  if (filters.deliverableOnly) alternatives.push({ label: l('包含中间 / 预览文件', 'Include intermediate / preview files'), change: { deliverableOnly: false } })
  if (query) alternatives.push({ label: l('移除搜索词', 'Remove search text'), change: { query: '' } })
  const categories = [...BROWSER_CATEGORIES, '其他'].filter(category => skills.some(skill => (getSkillMetadata(skill.name)?.category ?? '其他') === category))
  return <section className="qx-sb-explorer">
    <div className="qx-sb-filter-box">
      <div className="qx-sb-filter-row"><span>{l('想要什么输出', 'Desired output')}</span><div>
        <div className="qx-sb-pills" role="group" aria-label={l('输出格式', 'Output formats')}>
          <button className="qx-sb-pill" type="button" aria-pressed={!filters.outputs.length} onClick={() => patch({ outputs: [] })}>{l('不限', 'Any')}</button>
          {COMMON.map(outputChip)}
        </div>
        <details className="qx-sb-filter-more"><summary>{l('更多格式与执行结果', 'More formats and action results')}{filters.outputs.some(value => !COMMON.includes(value)) && ' · ' + filters.outputs.filter(value => !COMMON.includes(value)).length}</summary>
          <p>{l('其他文件格式', 'Other file formats')}</p><div className="qx-sb-pills">{EXTRA.map(outputChip)}</div>
          <p>{l('执行结果 · 非文件格式', 'Action results · not file formats')}</p><div className="qx-sb-pills">{RESULTS.map(outputChip)}</div>
        </details>
        <div className="qx-sb-filter-options"><label>{l('多选时', 'Multiple outputs')} <select aria-label={l('输出匹配方式', 'Output matching')} value={filters.mode} onChange={event => patch({ mode: event.target.value as 'any' | 'all' })}>
          <option value="any">{l('包含任意一项', 'Match any')}</option><option value="all">{l('同时包含全部', 'Match all')}</option>
        </select></label><label><input type="checkbox" checked={filters.deliverableOnly} onChange={event => patch({ deliverableOnly: event.target.checked })} /> {l('排除中间 / 预览文件', 'Exclude intermediate / preview files')}</label></div>
      </div></div>
      <div className="qx-sb-filter-row"><span>{l('用途分类', 'Category')}</span><div className="qx-sb-pills" role="group" aria-label={l('用途分类', 'Category')}>
        <button type="button" className="qx-sb-pill" aria-pressed={filters.category === 'all'} onClick={() => patch({ category: 'all' })}>{t('category.all')} <span>{count({ category: 'all' })}</span></button>
        {categories.map(category => <button type="button" className="qx-sb-pill" key={category} aria-pressed={filters.category === category} onClick={() => patch({ category: filters.category === category ? 'all' : category })}>{category} <span>{count({ category })}</span></button>)}
      </div></div>
      <details className="qx-sb-filter-more qx-sb-input-panel"><summary>{l('限定输入材料', 'Limit input materials')} · {filters.inputs.length + Number(filters.noUpload) || l('可选', 'optional')}</summary>
        <div className="qx-sb-pills" role="group" aria-label={l('输入类型', 'Input types')}>
          <button type="button" className="qx-sb-pill" aria-pressed={!filters.inputs.length} onClick={() => patch({ inputs: [] })}>{l('不限', 'Any')}</button>
          {INPUTS.map(input => <button key={input} type="button" className="qx-sb-pill" data-input={input} aria-pressed={filters.inputs.includes(input)} onClick={() => toggle('inputs', input)}>{input} <span>{count({ inputs: [input], noUpload: false })}</span></button>)}
        </div>
        <label className="qx-sb-filter-options"><input type="checkbox" checked={filters.noUpload} onChange={event => patch({ noUpload: event.target.checked })} />{l('可从描述开始，无需提供已有文件', 'Can start from a description without an existing file')}</label>
        <p>{l('输入类型表示支持的材料，不代表每项都必须提供；卡片列明具体条件。', 'Input types are supported materials, not a list of mandatory requirements.')}</p>
      </details>
    </div>
    <p className="qx-sb-counter-note">{l('标签数字：在其他组条件下可匹配的技能数；多选结果有重叠，数字不能相加。', 'Counts retain other filter groups; overlapping results cannot be added together.')}</p>
    <div className="qx-sb-results-head"><span role="status">{l('找到', 'Found')} <strong>{filtered.length}</strong> {l('个技能', 'skills')} / {skills.length}</span><button className="qx-sb-button" type="button" onClick={clear}>{l('清空筛选', 'Clear filters')}</button></div>
    <div className="qx-sb-active-filters">
      {filters.category !== 'all' && <button type="button" onClick={() => patch({ category: 'all' })}>{filters.category} ×</button>}
      {(['outputs', 'inputs'] as const).flatMap(key => filters[key].map(value => <button type="button" key={key + value} onClick={() => toggle(key, value)}>{key === 'outputs' ? l('输出', 'Output') : l('输入', 'Input')}：{value} ×</button>))}
      {filters.noUpload && <button type="button" onClick={() => patch({ noUpload: false })}>{l('无需已有文件', 'No existing file')} ×</button>}
      {filters.deliverableOnly && <button type="button" onClick={() => patch({ deliverableOnly: false })}>{l('排除中间文件', 'Exclude intermediate files')} ×</button>}
      {query && <button type="button" onClick={() => patch({ query: '' })}>{query} ×</button>}
    </div>
    {filtered.length === 0 && skills.length > 0 && <div className="qx-sb-state"><div>
      <strong>{t('status.noResults')}</strong><p>{l('可以保留目标输出，先放宽一项限制：', 'Keep your target output and relax one restriction:')}</p>
      <div className="qx-sb-relaxations">{alternatives.map(option => ({ ...option, count: count(option.change) })).filter(option => option.count > 0).map(option => <button type="button" className="qx-sb-button" key={option.label} onClick={() => patch(option.change)}>{option.label} · {option.count}</button>)}</div>
    </div></div>}
    <div className="qx-sb-grid" ref={grid}>
      {filtered.map(skill => <SkillCard key={skill.name} skill={skill} t={t} categoryLabel={getSkillMetadata(skill.name)?.category ?? l('其他', 'Other')} onOpen={onOpen} expanded={expanded.has(skill.name)} onToggle={() => toggleRow(skill.name)} selectedOutputs={filters.outputs} deliverableOnly={filters.deliverableOnly} />)}
    </div>
    <p className="qx-sb-counter-note">{l('格式资料按已审核的技能说明整理；输出依任务选择。点击技能名查看原始 SKILL.md。', 'Format metadata is curated from skill instructions; outputs depend on the task. Select a skill name to view SKILL.md.')}</p>
  </section>
}
