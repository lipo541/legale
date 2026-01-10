import Link from 'next/link'
import type { DesktopNavProps } from '../types'

export default function DesktopNav({ navLinks, isDark }: DesktopNavProps) {
  return (
    <nav className="hidden lg:flex items-center space-x-8">
      {navLinks.map(({ href, label }) => (
        <Link 
          key={href} 
          href={href} 
          className={`relative inline-block text-xs font-medium transition-all duration-300 after:absolute after:left-0 after:-bottom-1 after:h-[1px] after:w-full after:origin-left after:scale-x-0 after:rounded-full after:content-[""] after:transition-transform after:duration-300 ${isDark ? 'text-white/70 hover:text-white after:bg-white hover:after:scale-x-100' : 'text-black hover:text-black/80 after:bg-black hover:after:scale-x-100'}`}
        >
          {label}
        </Link>
      ))}
    </nav>
  )
}
