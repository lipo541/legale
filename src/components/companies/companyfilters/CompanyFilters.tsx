'use client';

import { useTheme } from '@/contexts/ThemeContext';
import { ChevronDown, Building2, Briefcase, MapPin, X } from 'lucide-react';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { companiesTranslations } from '@/translations/companies';

interface CompanyFiltersProps {
  isOpen: boolean;
  companies: Array<{ id: string; full_name: string }>;
  specializations: Array<{ id: string; name: string }>;
  cities: string[];
  selectedCompany: string | null;
  selectedSpecialization: string | null;
  selectedCity: string | null;
  onCompanyChange: (id: string | null) => void;
  onSpecializationChange: (id: string | null) => void;
  onCityChange: (city: string | null) => void;
  onClearFilters: () => void;
}

export default function CompanyFilters({
  isOpen,
  companies,
  specializations,
  cities,
  selectedCompany,
  selectedSpecialization,
  selectedCity,
  onCompanyChange,
  onSpecializationChange,
  onCityChange,
  onClearFilters,
}: CompanyFiltersProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const pathname = usePathname();
  const locale = pathname?.split('/')[1] || 'ka';
  const t = companiesTranslations[locale as keyof typeof companiesTranslations] || companiesTranslations.ka;

  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const toggleDropdown = (dropdown: string) => {
    setOpenDropdown(openDropdown === dropdown ? null : dropdown);
  };

  if (!isOpen) return null;

  const hasActiveFilters = selectedCompany || selectedSpecialization || selectedCity;

  return (
    <div
      id="company-filters"
      role="region"
      aria-label={t.filterTitle}
      className={`rounded-lg border p-3 transition-all duration-300 ${
        isDark
          ? 'border-white/10 bg-white/5'
          : 'border-black/10 bg-white shadow-sm'
      }`}
    >
      <div className="mb-2 flex items-center justify-between">
        <h3 className={`text-sm font-medium ${isDark ? 'text-white' : 'text-black'}`}>
          {t.filterTitle}
        </h3>
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className={`flex items-center gap-0.5 text-xs transition-colors ${
              isDark
                ? 'text-white/50 hover:text-white'
                : 'text-black/50 hover:text-black'
            }`}
          >
            <X size={12} />
            {t.clearFilters}
          </button>
        )}
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        {/* Companies Filter */}
        <div className="relative">
          <button
            onClick={() => toggleDropdown('company')}
            aria-label={t.companyFilter}
            aria-expanded={openDropdown === 'company'}
            aria-controls="company-dropdown"
            className={`flex w-full items-center justify-between rounded border px-2 py-1.5 text-left transition-all focus-visible:ring-2 focus-visible:ring-offset-2 ${
              selectedCompany
                ? isDark
                  ? 'border-white bg-white text-black focus-visible:ring-white/20'
                  : 'border-black bg-black text-white focus-visible:ring-black/20'
                : isDark
                ? 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10 focus-visible:ring-white/20'
                : 'border-black/10 bg-gray-50 hover:border-black/20 hover:bg-gray-100 focus-visible:ring-black/20'
            }`}
          >
            <div className="flex items-center gap-1">
              <Building2 size={12} strokeWidth={1.5} aria-hidden="true" />
              <span className="text-xs font-medium">{t.companyFilter}</span>
            </div>
            <ChevronDown
              size={12}
              className={`transition-transform ${
                openDropdown === 'company' ? 'rotate-180' : ''
              }`}
            />
          </button>

          {openDropdown === 'company' && (
            <div
              className={`absolute left-0 right-0 top-full z-10 mt-1 max-h-40 overflow-y-auto rounded border ${
                isDark
                  ? 'border-white/10 bg-black'
                  : 'border-black/10 bg-white shadow-md'
              }`}
            >
              {companies.map((company) => (
                <button
                  key={company.id}
                  onClick={() => {
                    onCompanyChange(company.id === selectedCompany ? null : company.id);
                    setOpenDropdown(null);
                  }}
                  className={`w-full px-2 py-1 text-left text-xs transition-colors ${
                    selectedCompany === company.id
                      ? isDark
                        ? 'bg-white text-black'
                        : 'bg-black text-white'
                      : isDark
                      ? 'text-white/70 hover:bg-white/10 hover:text-white'
                      : 'text-black/70 hover:bg-gray-100 hover:text-black'
                  }`}
                >
                  {company.full_name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Specializations Filter */}
        <div className="relative">
          <button
            onClick={() => toggleDropdown('specialization')}
            aria-label={t.specializationFilter}
            aria-expanded={openDropdown === 'specialization'}
            aria-controls="specialization-dropdown"
            className={`flex w-full items-center justify-between rounded border px-2 py-1.5 text-left transition-all focus-visible:ring-2 focus-visible:ring-offset-2 ${
              selectedSpecialization
                ? isDark
                  ? 'border-white bg-white text-black focus-visible:ring-white/20'
                  : 'border-black bg-black text-white focus-visible:ring-black/20'
                : isDark
                ? 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10 focus-visible:ring-white/20'
                : 'border-black/10 bg-gray-50 hover:border-black/20 hover:bg-gray-100 focus-visible:ring-black/20'
            }`}
          >
            <div className="flex items-center gap-1">
              <Briefcase size={12} strokeWidth={1.5} aria-hidden="true" />
              <span className="text-xs font-medium">{t.specializationFilter}</span>
            </div>
            <ChevronDown
              size={12}
              className={`transition-transform ${
                openDropdown === 'specialization' ? 'rotate-180' : ''
              }`}
            />
          </button>

          {openDropdown === 'specialization' && (
            <div
              className={`absolute left-0 right-0 top-full z-10 mt-1 max-h-40 overflow-y-auto rounded border ${
                isDark
                  ? 'border-white/10 bg-black'
                  : 'border-black/10 bg-white shadow-md'
              }`}
            >
              {specializations.map((spec) => (
                <button
                  key={spec.id}
                  onClick={() => {
                    onSpecializationChange(spec.id === selectedSpecialization ? null : spec.id);
                    setOpenDropdown(null);
                  }}
                  className={`w-full px-2 py-1 text-left text-xs transition-colors ${
                    selectedSpecialization === spec.id
                      ? isDark
                        ? 'bg-white text-black'
                        : 'bg-black text-white'
                      : isDark
                      ? 'text-white/70 hover:bg-white/10 hover:text-white'
                      : 'text-black/70 hover:bg-gray-100 hover:text-black'
                  }`}
                >
                  {spec.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Cities Filter */}
        <div className="relative">
          <button
            onClick={() => toggleDropdown('city')}
            aria-label={t.cityFilter}
            aria-expanded={openDropdown === 'city'}
            aria-controls="city-dropdown"
            className={`flex w-full items-center justify-between rounded border px-2 py-1.5 text-left transition-all focus-visible:ring-2 focus-visible:ring-offset-2 ${
              selectedCity
                ? isDark
                  ? 'border-white bg-white text-black focus-visible:ring-white/20'
                  : 'border-black bg-black text-white focus-visible:ring-black/20'
                : isDark
                ? 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10 focus-visible:ring-white/20'
                : 'border-black/10 bg-gray-50 hover:border-black/20 hover:bg-gray-100 focus-visible:ring-black/20'
            }`}
          >
            <div className="flex items-center gap-1">
              <MapPin size={12} strokeWidth={1.5} aria-hidden="true" />
              <span className="text-xs font-medium">{t.cityFilter}</span>
            </div>
            <ChevronDown
              size={12}
              className={`transition-transform ${
                openDropdown === 'city' ? 'rotate-180' : ''
              }`}
            />
          </button>

          {openDropdown === 'city' && (
            <div
              className={`absolute left-0 right-0 top-full z-10 mt-1 max-h-40 overflow-y-auto rounded border ${
                isDark
                  ? 'border-white/10 bg-black'
                  : 'border-black/10 bg-white shadow-md'
              }`}
            >
              {cities.map((city) => (
                <button
                  key={city}
                  onClick={() => {
                    onCityChange(city === selectedCity ? null : city);
                    setOpenDropdown(null);
                  }}
                  className={`w-full px-2 py-1 text-left text-xs transition-colors ${
                    selectedCity === city
                      ? isDark
                        ? 'bg-white text-black'
                        : 'bg-black text-white'
                      : isDark
                      ? 'text-white/70 hover:bg-white/10 hover:text-white'
                      : 'text-black/70 hover:bg-gray-100 hover:text-black'
                  }`}
                >
                  {city}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
