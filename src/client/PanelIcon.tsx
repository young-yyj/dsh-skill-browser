/** 侧栏面板行图标:拼图块轮廓,stroke: currentColor 随主题与选中态变色。 */

export interface PanelIconProps {
  size?: number
}

export function PanelIcon({ size = 18 }: PanelIconProps): React.JSX.Element {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {/* 拼图块:主体 + 上凸 + 右凸,与产品内"技能"意象一致 */}
      <path d="M10 4.5a1.9 1.9 0 0 1 3.8 0V6h2.7a1 1 0 0 1 1 1v2.7h1.5a1.9 1.9 0 0 1 0 3.8H17.5V19a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h4V4.5Z" />
    </svg>
  )
}
