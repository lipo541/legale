import Link from 'next/link'
import type { LogoProps } from '../types'

export default function Logo({ isDark }: LogoProps) {
  return (
    <Link href="/" className="flex items-center">
      <picture>
        <source
          srcSet={isDark ? "/asset/Legal.ge.webp" : "/asset/legal.ge.black.webp"}
          type="image/webp"
        />
        <img
          src={isDark ? "/asset/Legal.ge.png" : "/asset/legal.ge.black.png"}
          alt="LegalGE"
          width={140}
          height={40}
          className="object-contain object-left h-8 sm:h-9"
        />
      </picture>
      {/* Visible text for screen-readers only (keeps semantic branding) */}
      <span className="sr-only">LegalGE</span>
    </Link>
  )
}
