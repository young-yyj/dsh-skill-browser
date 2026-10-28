/** 环形图：以 stroke-dasharray 在 100 单位周长(r=15.9155 → 周长≈100)上按百分比分段。
 * 全零数据绘制中性轨道，不误导为"100% 的空集"。分段可点击用于筛选。 */

import type { CSSProperties } from 'react'

const SEG_GAP = 0.6

export interface DonutSegment {
  key: string
  color: string
  value: number
}

export interface DonutChartProps {
  segments: DonutSegment[]
  centerTop: string
  centerSub?: string
  size?: number
  activeKey?: string | null
  onSegmentClick?: (key: string) => void
  clearLabel: string
}

export function DonutChart({ segments, centerTop, centerSub, size = 116, activeKey, onSegmentClick, clearLabel }: DonutChartProps): React.JSX.Element {
  const total = segments.reduce((sum, segment) => sum + (Number.isFinite(segment.value) && segment.value > 0 ? segment.value : 0), 0)
  const arcs: { key: string; color: string; len: number; offset: number }[] = []
  if (total > 0) {
    let acc = 0
    for (const segment of segments) {
      const value = Number.isFinite(segment.value) && segment.value > 0 ? segment.value : 0
      if (value === 0) continue
      const pct = value / total * 100
      arcs.push({ key: segment.key, color: segment.color, len: pct, offset: 100 - acc + 25 })
      acc += pct
    }
  }
  if (arcs.length > 1) {
    for (const arc of arcs) {
      const cut = Math.min(SEG_GAP / 2, arc.len / 4)
      arc.len -= cut * 2
      arc.offset -= cut
    }
  }
  return (
    <div className="qx-sb-donut" style={{ width: size, height: size }} data-donut="">
      <svg viewBox="0 0 42 42" width={size} height={size} aria-hidden={onSegmentClick ? undefined : true}>
        {arcs.length === 0
          ? <circle className="qx-sb-donut-track" cx="21" cy="21" r="15.9155" />
          : arcs.map(arc => (
            <circle
              key={arc.key}
              className={'qx-sb-donut-seg' + (activeKey === arc.key ? ' qx-sb-donut-seg-on' : '')}
              cx="21"
              cy="21"
              r="15.9155"
              strokeDasharray={`${arc.len} ${100 - arc.len}`}
              strokeDashoffset={arc.offset}
              style={{ stroke: arc.color } as CSSProperties}
              role={onSegmentClick ? 'button' : undefined}
              tabIndex={onSegmentClick ? 0 : undefined}
              aria-label={onSegmentClick ? `${arc.key} · ${clearLabel}` : undefined}
              onClick={onSegmentClick ? () => onSegmentClick(arc.key) : undefined}
              onKeyDown={onSegmentClick ? event => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  onSegmentClick(arc.key)
                }
              } : undefined}
            />
          ))}
      </svg>
      <div className="qx-sb-donut-center">
        <b style={{ fontSize: Math.max(11, Math.round(size * 0.135)) }}>{centerTop}</b>
        {centerSub !== undefined && <span style={{ fontSize: Math.max(9, Math.round(size * 0.1)) }}>{centerSub}</span>}
      </div>
    </div>
  )
}
