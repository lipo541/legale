'use client';

import { useTheme } from '@/contexts/ThemeContext';
import { Building2, Users, Briefcase } from 'lucide-react';

interface InfoCardsProps {
  totalCompanies: number;
  totalSpecialists: number;
  totalServices: number;
}

export default function InfoCards({
  totalCompanies,
  totalSpecialists,
  totalServices,
}: InfoCardsProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const cards = [
    {
      icon: Building2,
      label: 'კომპანიები',
      count: totalCompanies,
    },
    {
      icon: Users,
      label: 'სპეციალისტები',
      count: totalSpecialists,
    },
    {
      icon: Briefcase,
      label: 'სერვისები',
      count: totalServices,
    },
  ];

  return (
    <div className="grid gap-2 sm:grid-cols-3">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <div
            key={card.label}
            className={`group flex items-center gap-2 rounded-lg border px-3 py-2 transition-all duration-300 ${
              isDark
                ? 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                : 'border-black/10 bg-white hover:border-black/20 hover:bg-gray-50 shadow-sm'
            }`}
          >
            {/* Icon */}
            <div className="flex-shrink-0">
              <Icon
                className={`transition-transform duration-300 group-hover:scale-110 ${
                  isDark ? 'text-white/60' : 'text-black/60'
                }`}
                size={18}
                strokeWidth={1.5}
              />
            </div>

            {/* Content */}
            <div className="flex flex-1 items-baseline gap-1.5">
              {/* Count */}
              <div
                className={`text-2xl font-bold ${
                  isDark ? 'text-white' : 'text-black'
                }`}
              >
                {card.count}
              </div>

              {/* Label */}
              <div
                className={`text-xs font-medium ${
                  isDark ? 'text-white/70' : 'text-black/70'
                }`}
              >
                {card.label}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
