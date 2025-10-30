'use client';

import { useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { Building2, Users, Briefcase, Search, SlidersHorizontal, ChevronDown, UserCircle, MapPin, X } from 'lucide-react';

interface SpecialistsStatisticsProps {
  totalCompanies: number;
  totalSpecialists: number;
  totalServices: number;
}

export default function SpecialistsStatistics({ totalCompanies, totalSpecialists, totalServices }: SpecialistsStatisticsProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [searchTerm, setSearchTerm] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // Filter states
  const [selectedSpecialistType, setSelectedSpecialistType] = useState<string | null>(null);
  const [selectedSpecialization, setSelectedSpecialization] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);

  // Static data
  const specialistTypes = [
    { id: 'company', name: 'კომპანია' },
    { id: 'solo', name: 'სპეციალისტი' },
  ];

  const specializations = [
    { id: '1', name: 'სპეციალიზაცია' },
  ];

  const cities = ['ქალაქი'];

  const handleClearFilters = () => {
    setSelectedSpecialistType(null);
    setSelectedSpecialization(null);
    setSelectedCity(null);
    setSearchTerm('');
  };

  const toggleDropdown = (dropdown: string) => {
    setOpenDropdown(openDropdown === dropdown ? null : dropdown);
  };

  const hasActiveFilters = selectedSpecialistType || selectedSpecialization || selectedCity;

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
    <div>
      {/* Statistics Cards */}
      <div className="grid gap-2 sm:grid-cols-3 mb-4">
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

      {/* Search & Filter */}
      <div className="mb-3">
        <div className="flex w-full gap-2">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search
              className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 ${
                isDark ? 'text-white/30' : 'text-black/30'
              }`}
              size={16}
              strokeWidth={1.5}
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ძებნა..."
              className={`w-full rounded-lg border py-2 pl-10 pr-3 text-sm transition-all duration-300 placeholder:text-sm focus:outline-none ${
                isDark
                  ? 'border-white/10 bg-white/5 text-white placeholder:text-white/40 hover:border-white/20 focus:border-white/30 focus:bg-white/10'
                  : 'border-black/10 bg-white text-black placeholder:text-black/40 hover:border-black/20 focus:border-black/30 focus:bg-gray-50'
              }`}
            />
          </div>

          {/* Filter Button */}
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={`flex items-center gap-1.5 rounded-lg border px-4 py-2 text-sm font-medium transition-all duration-300 ${
              isFilterOpen
                ? isDark
                  ? 'border-white bg-white text-black'
                  : 'border-black bg-black text-white'
                : isDark
                ? 'border-white/10 bg-white/5 text-white hover:border-white/20 hover:bg-white/10'
                : 'border-black/10 bg-white text-black hover:border-black/20 hover:bg-gray-50'
            }`}
          >
            <SlidersHorizontal size={16} strokeWidth={1.5} />
            <span className="hidden sm:inline">ფილტრაცია</span>
          </button>
        </div>
      </div>

      {/* Filters Dropdown */}
      {isFilterOpen && (
        <div
          className={`rounded-lg border p-3 transition-all duration-300 ${
            isDark
              ? 'border-white/10 bg-white/5'
              : 'border-black/10 bg-white shadow-sm'
          }`}
        >
          <div className="mb-2 flex items-center justify-between">
            <h3 className={`text-sm font-medium ${isDark ? 'text-white' : 'text-black'}`}>
              ფილტრაცია
            </h3>
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className={`flex items-center gap-0.5 text-xs transition-colors ${
                  isDark
                    ? 'text-white/50 hover:text-white'
                    : 'text-black/50 hover:text-black'
                }`}
              >
                <X size={12} />
                გასუფთავება
              </button>
            )}
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            {/* Specialist Type Filter */}
            <div className="relative">
              <button
                onClick={() => toggleDropdown('type')}
                className={`flex w-full items-center justify-between rounded border px-2 py-1.5 text-left transition-all ${
                  selectedSpecialistType
                    ? isDark
                      ? 'border-white bg-white text-black'
                      : 'border-black bg-black text-white'
                    : isDark
                    ? 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                    : 'border-black/10 bg-gray-50 hover:border-black/20 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-1">
                  <UserCircle size={12} strokeWidth={1.5} />
                  <span className="text-xs font-medium">კომპანია</span>
                </div>
                <ChevronDown
                  size={12}
                  className={`transition-transform ${
                    openDropdown === 'type' ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {openDropdown === 'type' && (
                <div
                  className={`absolute left-0 right-0 top-full z-10 mt-1 max-h-40 overflow-y-auto rounded border ${
                    isDark
                      ? 'border-white/10 bg-black'
                      : 'border-black/10 bg-white shadow-md'
                  }`}
                >
                  {specialistTypes.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => {
                        setSelectedSpecialistType(type.id === selectedSpecialistType ? null : type.id);
                        setOpenDropdown(null);
                      }}
                      className={`w-full px-2 py-1 text-left text-xs transition-colors ${
                        selectedSpecialistType === type.id
                          ? isDark
                            ? 'bg-white text-black'
                            : 'bg-black text-white'
                          : isDark
                          ? 'text-white/70 hover:bg-white/10 hover:text-white'
                          : 'text-black/70 hover:bg-gray-100 hover:text-black'
                      }`}
                    >
                      {type.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Specializations Filter */}
            <div className="relative">
              <button
                onClick={() => toggleDropdown('specialization')}
                className={`flex w-full items-center justify-between rounded border px-2 py-1.5 text-left transition-all ${
                  selectedSpecialization
                    ? isDark
                      ? 'border-white bg-white text-black'
                      : 'border-black bg-black text-white'
                    : isDark
                    ? 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                    : 'border-black/10 bg-gray-50 hover:border-black/20 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-1">
                  <Briefcase size={12} strokeWidth={1.5} />
                  <span className="text-xs font-medium">სპეციალიზაცია</span>
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
                        setSelectedSpecialization(spec.id === selectedSpecialization ? null : spec.id);
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
                className={`flex w-full items-center justify-between rounded border px-2 py-1.5 text-left transition-all ${
                  selectedCity
                    ? isDark
                      ? 'border-white bg-white text-black'
                      : 'border-black bg-black text-white'
                    : isDark
                    ? 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                    : 'border-black/10 bg-gray-50 hover:border-black/20 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-1">
                  <MapPin size={12} strokeWidth={1.5} />
                  <span className="text-xs font-medium">ქალაქი</span>
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
                        setSelectedCity(city === selectedCity ? null : city);
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
      )}
    </div>
  );
}
