interface Props {
  size?: number
  className?: string
}

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
})

export const IconCheck = ({ size = 13 }: Props) => (
  <svg {...base(size)} strokeWidth={3} stroke="#fff">
    <path d="M20 6 9 17l-5-5" />
  </svg>
)

export const IconChevronLeft = ({ size = 18 }: Props) => (
  <svg {...base(size)}><path d="m15 18-6-6 6-6" /></svg>
)

export const IconChevronRight = ({ size = 18 }: Props) => (
  <svg {...base(size)}><path d="m9 18 6-6-6-6" /></svg>
)

export const IconCalendar = ({ size = 17 }: Props) => (
  <svg {...base(size)}>
    <rect x="3" y="5" width="18" height="16" rx="3" />
    <path d="M8 3v4M16 3v4M3 10h18" />
  </svg>
)

export const IconTarget = ({ size = 17 }: Props) => (
  <svg {...base(size)}>
    <circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="4.5" /><circle cx="12" cy="12" r="1" />
  </svg>
)

export const IconSearch = ({ size = 17 }: Props) => (
  <svg {...base(size)}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.2-3.2" /></svg>
)

export const IconTrash = ({ size = 15 }: Props) => (
  <svg {...base(size)}>
    <path d="M4 7h16M10 11v6M14 11v6" />
    <path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
  </svg>
)

export const IconGrip = ({ size = 15 }: Props) => (
  <svg {...base(size)} strokeWidth={2.4}>
    <path d="M9 6h.01M9 12h.01M9 18h.01M15 6h.01M15 12h.01M15 18h.01" />
  </svg>
)

export const IconArrowRight = ({ size = 15 }: Props) => (
  <svg {...base(size)}><path d="M5 12h14M13 6l6 6-6 6" /></svg>
)

export const IconPlus = ({ size = 16 }: Props) => (
  <svg {...base(size)}><path d="M12 5v14M5 12h14" /></svg>
)

export const IconBroom = ({ size = 15 }: Props) => (
  <svg {...base(size)}><path d="M19 5 14 10M11 7l6 6-5.5 5.5a3 3 0 0 1-4.2 0l-1.8-1.8a3 3 0 0 1 0-4.2L11 7Z" /></svg>
)

export const IconNote = ({ size = 15 }: Props) => (
  <svg {...base(size)}>
    <path d="M5 4h14v12l-5 5H5z" /><path d="M19 16h-5v5" />
  </svg>
)

export const IconFlame = ({ size = 15 }: Props) => (
  <svg {...base(size)}>
    <path d="M12 3s5 4 5 8a5 5 0 0 1-10 0c0-1.5 1-3 1-3s.5 2 2 2c0-3 2-5 2-7Z" />
  </svg>
)

export const IconDownload = ({ size = 15 }: Props) => (
  <svg {...base(size)}><path d="M12 4v11M8 11l4 4 4-4M5 20h14" /></svg>
)

export const IconUpload = ({ size = 15 }: Props) => (
  <svg {...base(size)}><path d="M12 15V4M8 8l4-4 4 4M5 20h14" /></svg>
)

export const IconLogo = ({ size = 18 }: Props) => (
  <svg {...base(size)} stroke="#fff" strokeWidth={2}>
    <path d="M5 6.5h14M5 12h9M5 17.5h6" />
  </svg>
)
