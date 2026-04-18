interface IconProps {
  size?: number
  strokeWidth?: number
  className?: string
}

function Icon({ paths, circles, size = 16, strokeWidth = 1.6, className = '' }: IconProps & { paths?: string[]; circles?: { cx: number; cy: number; r: number }[] }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ flexShrink: 0 }}
    >
      {paths?.map((d, i) => <path key={i} d={d} />)}
      {circles?.map((c, i) => <circle key={i} cx={c.cx} cy={c.cy} r={c.r} />)}
    </svg>
  )
}

export const Icons = {
  Plus: (p: IconProps) => <Icon {...p} paths={['M5 12h14', 'M12 5v14']} />,
  X: (p: IconProps) => <Icon {...p} paths={['M18 6 6 18', 'M6 6l12 12']} />,
  ChevronDown: (p: IconProps) => <Icon {...p} paths={['M6 9l6 6 6-6']} />,
  ChevronUp: (p: IconProps) => <Icon {...p} paths={['M18 15l-6-6-6 6']} />,
  ChevronRight: (p: IconProps) => <Icon {...p} paths={['M9 18l6-6-6-6']} />,
  Save: (p: IconProps) => <Icon {...p} paths={['M15.2 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7.8L15.2 3Z', 'M17 21v-7H7v7', 'M7 3v5h8']} />,
  Camera: (p: IconProps) => <Icon {...p} paths={['M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z']} />,
  MessageSquare: (p: IconProps) => <Icon {...p} paths={['M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z']} />,
  Folder: (p: IconProps) => <Icon {...p} paths={['M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z']} />,
  History: (p: IconProps) => <Icon {...p} paths={['M3 12a9 9 0 1 0 3-6.7L3 8', 'M3 3v5h5', 'M12 7v5l4 2']} />,
  PanelLeft: (p: IconProps) => <Icon {...p} paths={['M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z', 'M9 3v18']} />,
  Grip: (p: IconProps) => <Icon {...p} circles={[{cx:9,cy:5,r:1},{cx:9,cy:12,r:1},{cx:9,cy:19,r:1},{cx:15,cy:5,r:1},{cx:15,cy:12,r:1},{cx:15,cy:19,r:1}]} />,
  MoreHorizontal: (p: IconProps) => <Icon {...p} circles={[{cx:12,cy:12,r:1},{cx:19,cy:12,r:1},{cx:5,cy:12,r:1}]} />,
  Search: (p: IconProps) => <Icon {...p} circles={[{cx:11,cy:11,r:8}]} paths={['m21 21-4.3-4.3']} />,
  Check: (p: IconProps) => <Icon {...p} paths={['M20 6 9 17l-5-5']} />,
}
