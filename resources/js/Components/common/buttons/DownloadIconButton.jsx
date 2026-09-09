import React from 'react'
import BareButton from '@/Components/common/buttons/BareButton'
import Tooltip from '@/Components/common/Tooltip'

export default function DownloadIconButton({ label, onClick, icon, tooltipPosition = 'right' }) {
  return (
    <Tooltip label={label} position={tooltipPosition}>
      <BareButton
        aria-label={label}
        onClick={onClick}
        className="group relative flex h-[50px] w-[50px] flex-col items-center justify-center gap-[3px] rounded-full bg-neutral-900 shadow-[2px_2px_10px_rgba(0,0,0,0.11)] transition-colors duration-300 hover:bg-theme-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-accent focus-visible:ring-offset-2 dark:hover:bg-theme-accent"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          fill="currentColor"
          viewBox="0 0 16 16"
          className="fill-theme-accent-light transition-colors duration-300 group-hover:fill-white group-hover:animate-slide-in-top"
        >
          {icon}
        </svg>
        <span
          aria-hidden="true"
          className="h-[5px] w-[18px] border-b-2 border-l-2 border-r-2 border-theme-accent-light transition-colors duration-300 group-hover:border-white"
        />
      </BareButton>
    </Tooltip>
  )
}
