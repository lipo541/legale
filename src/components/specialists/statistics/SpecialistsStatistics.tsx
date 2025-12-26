'use client';

import { useState, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { Building2, Users, Briefcase, Search, SlidersHorizontal, ChevronDown, UserCircle, MapPin, X, Globe } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { usePathname } from 'next/navigation';
import ViewModeToggle from '@/components/common/ViewModeToggle';
import Sort from '@/components/common/Sort';
import { specialistsTranslations } from '@/translations/specialists';

interface SpecialistsStatisticsProps {
  totalCompanies: number;
  totalSpecialists: number;
  totalServices: number;
  // Pre-fetched data from server (optional for backward compatibility)
  cities?: Array<{ id: string; name: string; count?: number }>;
  services?: Array<{ id: string; title: string }>;
  onSearchChange?: (search: string) => void;
  onCityChange?: (city: string | null) => void;
  onSpecialistTypeChange?: (type: string | null) => void;
  onServicesChange?: (services: string[]) => void;
  onLanguagesChange?: (languages: string[]) => void;
  viewMode?: 'grid' | 'list';
  onViewModeChange?: (mode: 'grid' | 'list') => void;
  sortBy?: string;
  onSortChange?: (sort: string) => void;
}

export default function SpecialistsStatistics({ 
  totalCompanies, 
  totalSpecialists, 
  totalServices,
  cities: propCities,
  services: propServices,
  onSearchChange,
  onCityChange,
  onSpecialistTypeChange,
  onServicesChange,
  onLanguagesChange,
  viewMode = 'grid',
  onViewModeChange,
  sortBy = 'newest',
  onSortChange
}: SpecialistsStatisticsProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const pathname = usePathname();
  const locale = pathname?.split('/')[1] || 'ka';
  const t = specialistsTranslations[locale as keyof typeof specialistsTranslations] || specialistsTranslations.ka;
  const supabase = createClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // Filter states
  const [selectedSpecialistType, setSelectedSpecialistType] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [servicesSearchTerm, setServicesSearchTerm] = useState('');

  // Available languages
  const AVAILABLE_LANGUAGES = ['English', 'Georgian', 'Russian', 'German', 'Spanish'];

  // Cities data - use props if provided, otherwise fetch
  const [cities, setCities] = useState<Array<{ id: string; name: string; count?: number }>>(propCities || [])
  const [loadingCities, setLoadingCities] = useState(!propCities)

  // Services data - use props if provided, otherwise fetch
  const [services, setServices] = useState<Array<{ id: string; title: string }>>(propServices || [])
  const [loadingServices, setLoadingServices] = useState(!propServices)

  // Load cities with specialist counts - only if not provided via props
  useEffect(() => {
    // Skip fetching if cities were provided via props
    if (propCities && propCities.length > 0) {
      setCities(propCities)
      setLoadingCities(false)
      return
    }

    let isMounted = true
    const loadCities = async () => {
      setLoadingCities(true)
      try {
        // Get all specialist-city relationships with city details
        const { data: specialistCitiesData } = await supabase
          .from('specialist_cities')
          .select('cities(id, name_ka, name_en, name_ru)')

        // Extract unique cities with counts
        const counts: Record<string, { id: string; count: number }> = {}
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        specialistCitiesData?.forEach((item: any) => {
          if (item.cities) {
            const cityName = locale === 'ka' ? item.cities.name_ka 
                           : locale === 'en' ? item.cities.name_en 
                           : item.cities.name_ru
            const cityId = item.cities.id
            if (cityName && cityId) {
              if (!counts[cityName]) {
                counts[cityName] = { id: cityId, count: 0 }
              }
              counts[cityName].count += 1
            }
          }
        })

        // Convert to array and sort by count
        const citiesArray = Object.entries(counts)
          .map(([name, data]) => ({ id: data.id, name, count: data.count }))
          .sort((a, b) => b.count - a.count)

        if (isMounted) {
          setCities(citiesArray)
        }
      } catch (error) {
        console.error('Error loading cities:', error)
      } finally {
        if (isMounted) {
          setLoadingCities(false)
        }
      }
    }

    loadCities()
    return () => { isMounted = false }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale, propCities])

  // Load all services - only if not provided via props
  useEffect(() => {
    // Skip fetching if services were provided via props
    if (propServices && propServices.length > 0) {
      setServices(propServices)
      setLoadingServices(false)
      return
    }

    let isMounted = true
    const loadServices = async () => {
      setLoadingServices(true)
      try {
        const { data: servicesData, error } = await supabase
          .from('service_translations')
          .select(`
            service_id,
            title,
            language,
            services!inner(id)
          `)
          .eq('language', locale)
          .order('title')

        if (error) {
          console.error('Error loading services:', error)
        }

        const servicesArray = servicesData?.map((s: { service_id: string; title: string }) => ({
          id: s.service_id,
          title: s.title
        })) || []

        if (isMounted) {
          setServices(servicesArray)
        }
      } catch (error) {
        console.error('Error loading services:', error)
      } finally {
        if (isMounted) {
          setLoadingServices(false)
        }
      }
    }

    loadServices()
    return () => { isMounted = false }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale, propServices])

  // Notify parent of filter changes
  useEffect(() => {
    if (onSearchChange) {
      onSearchChange(searchTerm)
    }
  }, [searchTerm, onSearchChange])

  useEffect(() => {
    if (onCityChange) {
      onCityChange(selectedCity)
    }
  }, [selectedCity, onCityChange])

  useEffect(() => {
    if (onSpecialistTypeChange) {
      onSpecialistTypeChange(selectedSpecialistType)
    }
  }, [selectedSpecialistType, onSpecialistTypeChange])

  useEffect(() => {
    if (onServicesChange) {
      onServicesChange(selectedServices)
    }
  }, [selectedServices, onServicesChange])

  useEffect(() => {
    if (onLanguagesChange) {
      onLanguagesChange(selectedLanguages)
    }
  }, [selectedLanguages, onLanguagesChange])

  // Static data
  const specialistTypes = [
    { id: 'company', name: t.companySpecialist },
    { id: 'solo', name: t.soloSpecialist },
  ];

  const sortOptions = [
    { value: 'newest', label: t.sortNewest },
    { value: 'oldest', label: t.sortOldest },
    { value: 'a-z', label: t.sortAZ },
    { value: 'z-a', label: t.sortZA },
  ];

  const handleClearFilters = () => {
    setSelectedSpecialistType(null);
    setSelectedCity(null);
    setSelectedServices([]);
    setSelectedLanguages([]);
    setSearchTerm('');
    setServicesSearchTerm('');
  };

  const toggleDropdown = (dropdown: string) => {
    setOpenDropdown(openDropdown === dropdown ? null : dropdown);
  };

  const toggleService = (serviceId: string) => {
    setSelectedServices(prev =>
      prev.includes(serviceId)
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const toggleLanguage = (language: string) => {
    setSelectedLanguages(prev =>
      prev.includes(language)
        ? prev.filter(lang => lang !== language)
        : [...prev, language]
    );
  };

  const filteredServices = services.filter(service =>
    service.title.toLowerCase().includes(servicesSearchTerm.toLowerCase())
  );

  // Get selected city name from cities array
  const getSelectedCityName = () => {
    if (!selectedCity) return null;
    const city = cities.find(c => c.id === selectedCity);
    return city?.name || null;
  };

  const selectedCityName = getSelectedCityName();

  // Get selected specialist type name
  const getSelectedTypeName = () => {
    if (!selectedSpecialistType) return null;
    const type = specialistTypes.find(t => t.id === selectedSpecialistType);
    return type?.name || null;
  };

  const selectedTypeName = getSelectedTypeName();

  const hasActiveFilters = selectedSpecialistType || selectedServices.length > 0 || selectedCity || selectedLanguages.length > 0;

  const cards = [
    {
      icon: Building2,
      label: t.companies,
      count: totalCompanies,
    },
    {
      icon: Users,
      label: t.specialists,
      count: totalSpecialists,
    },
    {
      icon: Briefcase,
      label: t.services,
      count: totalServices,
    },
  ];

  return (
    <div>
      {/* Statistics Cards */}
      <div className="grid gap-3 sm:grid-cols-3 mb-4 md:gap-4">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.label}
              className={`group flex items-center gap-2 rounded-xl border backdrop-blur-md px-3 py-2 transition-all duration-300 md:px-4 md:py-3 ${
                isDark
                  ? 'bg-black/40 border-white/10 hover:bg-black/50 hover:border-white/20 hover:scale-[1.02]'
                  : 'bg-white/20 border-white/30 hover:bg-white/30 hover:border-white/50 shadow-xl hover:shadow-2xl hover:scale-[1.02]'
              }`}
            >
              {/* Icon */}
              <div className={`flex-shrink-0 rounded-lg p-1.5 transition-all duration-300 ${
                isDark ? 'bg-white/5 group-hover:bg-white/10' : 'bg-black/5 group-hover:bg-black/10'
              }`}>
                <Icon
                  className={`transition-all duration-300 group-hover:scale-110 ${
                    isDark ? 'text-white/60 group-hover:text-white/80' : 'text-black/60 group-hover:text-black/80'
                  }`}
                  size={16}
                  strokeWidth={1.5}
                />
              </div>

              {/* Content */}
              <div className="flex flex-1 flex-col gap-0.5">
                {/* Count */}
                <div
                  className={`text-xl font-bold transition-colors duration-300 md:text-2xl ${
                    isDark ? 'text-white' : 'text-black'
                  }`}
                >
                  {card.count}
                </div>

                {/* Label */}
                <div
                  className={`text-xs font-medium transition-colors duration-300 ${
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
      <div className="mb-4">
        {/* Mobile: Stacked layout */}
        <div className="flex flex-col gap-3 sm:hidden">
          {/* Search Input - Full width on mobile */}
          <div className="relative w-full">
            <Search
              className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-300 ${
                isDark ? 'text-white/30' : 'text-black/30'
              }`}
              size={16}
              strokeWidth={1.5}
              aria-hidden="true"
            />
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t.searchPlaceholder}
              aria-label={t.searchAriaLabel}
              aria-describedby="search-description"
              className={`w-full rounded-xl border backdrop-blur-md py-2 pl-9 pr-3 text-sm transition-all duration-300 placeholder:text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                isDark
                  ? 'bg-black/40 border-white/10 text-white placeholder:text-white/40 hover:border-white/20 focus:border-white/20 focus:bg-black/50 focus:ring-white/50'
                  : 'border-white/30 bg-white/20 text-black placeholder:text-black/40 hover:border-white/50 focus:border-white/50 focus:bg-white/30 shadow-xl focus:ring-black/50'
              }`}
            />
            <span id="search-description" className="sr-only">
              {t.searchDescription}
            </span>
          </div>

          {/* Controls Row - Sort, View, Filter */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Sort */}
            {onSortChange && (
              <div className="flex-1">
                <Sort 
                  options={sortOptions} 
                  value={sortBy} 
                  onChange={onSortChange} 
                />
              </div>
            )}

            {/* View Mode Toggle - Centered */}
            {onViewModeChange && (
              <div className="flex-shrink-0">
                <ViewModeToggle view={viewMode} onChange={onViewModeChange} />
              </div>
            )}

            {/* Filter Button */}
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              aria-label={t.filterButton}
              aria-expanded={isFilterOpen}
              aria-controls="filter-dropdown"
              className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 rounded-lg border backdrop-blur-md px-2 py-1.5 sm:px-4 sm:py-2.5 text-xs sm:text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                isFilterOpen
                  ? isDark
                    ? 'border-white bg-white text-black scale-[0.98] focus-visible:ring-white/50'
                    : 'border-black bg-black text-white scale-[0.98] focus-visible:ring-black/50'
                  : isDark
                  ? 'border-white/10 bg-black/40 text-white hover:border-white/20 hover:bg-black/50 hover:scale-[1.02] focus-visible:ring-white/50'
                  : 'border-white/30 bg-white/20 text-black hover:border-white/50 hover:bg-white/30 shadow-xl hover:shadow-2xl hover:scale-[1.02] focus-visible:ring-black/50'
              }`}
            >
              <SlidersHorizontal className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" strokeWidth={1.5} aria-hidden="true" />
              <span className="whitespace-nowrap truncate">
                <span className="sm:hidden">{t.filterButton}</span>
                <span className="hidden sm:inline">{t.filterButton}</span>
              </span>
            </button>
          </div>
        </div>

        {/* Desktop: Single row layout */}
        <div className="hidden sm:flex w-full gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search
              className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-300 ${
                isDark ? 'text-white/30' : 'text-black/30'
              }`}
              size={16}
              strokeWidth={1.5}
              aria-hidden="true"
            />
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t.searchPlaceholder}
              aria-label={t.searchAriaLabel}
              aria-describedby="search-description-desktop"
              className={`w-full rounded-xl border backdrop-blur-md py-2 pl-9 pr-3 text-sm transition-all duration-300 placeholder:text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                isDark
                  ? 'border-white/10 bg-black/40 text-white placeholder:text-white/40 hover:border-white/20 focus:border-white/20 focus:bg-black/50 focus:ring-white/50'
                  : 'border-white/30 bg-white/20 text-black placeholder:text-black/40 hover:border-white/50 focus:border-white/50 focus:bg-white/30 shadow-xl focus:ring-black/50'
              }`}
            />
            <span id="search-description-desktop" className="sr-only">
              {t.searchDescription}
            </span>
          </div>

          {/* Sort and View Mode Toggle */}
          <div className="flex items-center gap-2">
            {/* Sort */}
            {onSortChange && (
              <Sort 
                options={sortOptions} 
                value={sortBy} 
                onChange={onSortChange} 
              />
            )}

            {/* View Mode Toggle */}
            {onViewModeChange && (
              <ViewModeToggle view={viewMode} onChange={onViewModeChange} />
            )}
          </div>

          {/* Filter Button */}
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            aria-label={t.filterButton}
            aria-expanded={isFilterOpen}
            aria-controls="filter-dropdown"
            className={`flex items-center gap-2 rounded-xl border backdrop-blur-md px-3 py-2 text-sm font-medium transition-all duration-300 md:px-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
              isFilterOpen
                ? isDark
                  ? 'border-white bg-white text-black scale-[0.98] focus-visible:ring-white/50'
                  : 'border-black bg-black text-white scale-[0.98] focus-visible:ring-black/50'
                : isDark
                ? 'border-white/10 bg-black/40 text-white hover:border-white/20 hover:bg-black/50 hover:scale-[1.02] focus-visible:ring-white/50'
                : 'border-white/30 bg-white/20 text-black hover:border-white/50 hover:bg-white/30 shadow-xl hover:shadow-2xl hover:scale-[1.02] focus-visible:ring-black/50'
            }`}
          >
            <SlidersHorizontal size={16} strokeWidth={1.5} aria-hidden="true" />
            <span className="hidden sm:inline">{t.filterButton}</span>
          </button>
        </div>
      </div>

      {/* Filters Dropdown */}
      {isFilterOpen && (
        <div
          id="filter-dropdown"
          role="region"
          aria-label={t.filterMenuAriaLabel}
          className={`rounded-xl border backdrop-blur-md p-3 transition-all duration-300 ${
            isDark
              ? 'border-white/10 bg-black/40'
              : 'border-white/30 bg-white/20 shadow-xl'
          }`}
        >
          <div className="mb-3 flex items-center justify-between">
            <h3 className={`text-sm font-medium ${isDark ? 'text-white' : 'text-black'}`}>
              {t.filterTitle}
            </h3>
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className={`flex items-center gap-1 text-xs transition-all duration-300 hover:scale-105 ${
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

          {/* Mobile: Stacked layout with larger touch targets */}
          <div className="flex flex-col gap-2 sm:hidden">
            {/* Specialist Type Filter */}
            <div className="relative">
              <button
                onClick={() => toggleDropdown('type')}
                className={`flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-left transition-all ${
                  selectedSpecialistType
                    ? isDark
                      ? 'border-white bg-white text-black'
                      : 'border-black bg-black text-white'
                    : isDark
                    ? 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                    : 'border-white/30 bg-white/20 backdrop-blur-md hover:border-white/50 hover:bg-white/30'
                }`}
              >
                <div className="flex items-center gap-2">
                  <UserCircle size={14} strokeWidth={1.5} />
                  <span className="text-sm font-medium">
                    {selectedTypeName || t.companyFilter}
                  </span>
                </div>
                <ChevronDown
                  size={14}
                  className={`transition-transform ${
                    openDropdown === 'type' ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {openDropdown === 'type' && (
                <div
                  className={`absolute left-0 right-0 top-full z-10 mt-1 max-h-48 overflow-y-auto rounded-lg border ${
                    isDark
                      ? 'border-white/20 bg-black/80 backdrop-blur-md'
                      : 'border-white/30 bg-white/80 backdrop-blur-md shadow-xl'
                  }`}
                >
                  {specialistTypes.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => {
                        setSelectedSpecialistType(type.id === selectedSpecialistType ? null : type.id);
                        setOpenDropdown(null);
                      }}
                      className={`w-full px-3 py-2.5 text-left text-sm transition-colors ${
                        selectedSpecialistType === type.id
                          ? isDark
                            ? 'bg-white text-black font-medium'
                            : 'bg-black text-white font-medium'
                          : isDark
                          ? 'text-white/70 hover:bg-white/10 hover:text-white'
                          : 'text-black/70 hover:bg-white/30 hover:text-black'
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
                className={`flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-left transition-all ${
                  selectedServices.length > 0
                    ? isDark
                      ? 'border-white bg-white text-black'
                      : 'border-black bg-black text-white'
                    : isDark
                    ? 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                    : 'border-white/30 bg-white/20 backdrop-blur-md hover:border-white/50 hover:bg-white/30'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Briefcase size={14} strokeWidth={1.5} />
                  <span className="text-sm font-medium">
                    {t.specializationFilter} {selectedServices.length > 0 && `(${selectedServices.length})`}
                  </span>
                </div>
                <ChevronDown
                  size={14}
                  className={`transition-transform ${
                    openDropdown === 'specialization' ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {openDropdown === 'specialization' && (
                <div
                  className={`absolute left-0 right-0 top-full z-10 mt-1 rounded-lg border ${
                    isDark
                      ? 'border-white/20 bg-black/80 backdrop-blur-md'
                      : 'border-white/30 bg-white/80 backdrop-blur-md shadow-xl'
                  }`}
                >
                  {/* Search input */}
                  <div className={`p-2.5 border-b ${isDark ? 'border-white/10' : 'border-black/10'}`}>
                    <input
                      type="text"
                      value={servicesSearchTerm}
                      onChange={(e) => setServicesSearchTerm(e.target.value)}
                      placeholder={t.searchServices}
                      className={`w-full px-3 py-2 text-sm rounded-lg border ${
                        isDark
                          ? 'bg-white/5 border-white/10 text-white placeholder:text-white/40'
                          : 'bg-white/20 backdrop-blur-md border-white/30 text-black placeholder:text-black/40'
                      }`}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>

                  {/* Services list */}
                  <div className="max-h-64 overflow-y-auto">
                    {loadingServices ? (
                      <div className="px-3 py-8 text-center text-sm text-white/40">{t.loading}</div>
                    ) : filteredServices.length === 0 ? (
                      <div className="px-3 py-8 text-center text-sm text-white/40">{t.noServicesFound}</div>
                    ) : (
                      filteredServices.map((service) => (
                        <label
                          key={service.id}
                          className={`flex items-center gap-2.5 px-3 py-2.5 cursor-pointer transition-colors ${
                            isDark
                              ? 'hover:bg-white/10'
                              : 'hover:bg-white/30'
                          }`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            checked={selectedServices.includes(service.id)}
                            onChange={() => toggleService(service.id)}
                            className="h-5 w-5 rounded text-emerald-500 focus:ring-emerald-500"
                          />
                          <span className={`text-sm ${
                            isDark ? 'text-white/70' : 'text-black/70'
                          }`}>
                            {service.title}
                          </span>
                        </label>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Cities Filter */}
            <div className="relative">
              <button
                onClick={() => toggleDropdown('city')}
                className={`flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-left transition-all ${
                  selectedCity
                    ? isDark
                      ? 'border-white bg-white text-black'
                      : 'border-black bg-black text-white'
                    : isDark
                    ? 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                    : 'border-white/30 bg-white/20 backdrop-blur-md hover:border-white/50 hover:bg-white/30'
                }`}
              >
                <div className="flex items-center gap-2">
                  <MapPin size={14} strokeWidth={1.5} />
                  <span className="text-sm font-medium">
                    {selectedCityName || t.cityFilter}
                  </span>
                </div>
                <ChevronDown
                  size={14}
                  className={`transition-transform ${
                    openDropdown === 'city' ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {openDropdown === 'city' && (
                <div
                  className={`absolute left-0 right-0 top-full z-10 mt-1 max-h-64 overflow-y-auto rounded-lg border ${
                    isDark
                      ? 'border-white/20 bg-black/80 backdrop-blur-md'
                      : 'border-white/30 bg-white/80 backdrop-blur-md shadow-xl'
                  }`}
                >
                  {loadingCities ? (
                    <div className="px-3 py-8 text-center text-sm text-white/40">{t.loading}</div>
                  ) : cities.length === 0 ? (
                    <div className="px-3 py-8 text-center text-sm text-white/40">{t.noCitiesFound}</div>
                  ) : (
                    cities.map((city) => (
                      <button
                        key={city.id}
                        onClick={() => {
                          setSelectedCity(city.id === selectedCity ? null : city.id);
                          setOpenDropdown(null);
                        }}
                        className={`flex w-full items-center justify-between px-3 py-2.5 text-left transition-colors ${
                          selectedCity === city.id
                            ? isDark
                              ? 'bg-white text-black font-medium'
                              : 'bg-black text-white font-medium'
                            : isDark
                            ? 'text-white/70 hover:bg-white/10 hover:text-white'
                            : 'text-black/70 hover:bg-white/30 hover:text-black'
                        }`}
                      >
                        <span className="text-sm">{city.name}</span>
                        <span className={`text-xs ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                          {city.count}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Languages Filter - Mobile */}
            <div className="relative">
              <button
                onClick={() => toggleDropdown('language')}
                className={`flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-left transition-all ${
                  selectedLanguages.length > 0
                    ? isDark
                      ? 'border-white bg-white text-black'
                      : 'border-black bg-black text-white'
                    : isDark
                    ? 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                    : 'border-white/30 bg-white/20 backdrop-blur-md hover:border-white/50 hover:bg-white/30'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Globe size={14} strokeWidth={1.5} />
                  <span className="text-sm font-medium">
                    {t.languageFilter} {selectedLanguages.length > 0 && `(${selectedLanguages.length})`}
                  </span>
                </div>
                <ChevronDown
                  size={14}
                  className={`transition-transform ${
                    openDropdown === 'language' ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {openDropdown === 'language' && (
                <div
                  className={`absolute left-0 right-0 top-full z-10 mt-1 max-h-64 overflow-y-auto rounded-lg border ${
                    isDark
                      ? 'border-white/20 bg-black/80 backdrop-blur-md'
                      : 'border-white/30 bg-white/80 backdrop-blur-md shadow-xl'
                  }`}
                >
                  {AVAILABLE_LANGUAGES.map((lang) => (
                    <label
                      key={lang}
                      className={`flex items-center gap-2.5 px-3 py-2.5 cursor-pointer transition-colors ${
                        isDark
                          ? 'hover:bg-white/10'
                          : 'hover:bg-white/30'
                      }`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={selectedLanguages.includes(lang)}
                        onChange={() => toggleLanguage(lang)}
                        className="h-5 w-5 rounded text-emerald-500 focus:ring-emerald-500"
                      />
                      <span className={`text-sm ${
                        isDark ? 'text-white/70' : 'text-black/70'
                      }`}>
                        {(t.languages as Record<string, string>)?.[lang] || lang}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Desktop: Grid layout (existing code) */}
          <div className="hidden sm:grid gap-2 sm:grid-cols-4 md:gap-3">
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
                    : 'border-white/30 bg-white/20 backdrop-blur-md hover:border-white/50 hover:bg-white/30'
                }`}
              >
                <div className="flex items-center gap-1 min-w-0 flex-1">
                  <UserCircle size={12} strokeWidth={1.5} className="flex-shrink-0" />
                  <span className="text-xs font-medium truncate">
                    {selectedTypeName || t.companyFilter}
                  </span>
                </div>
                <ChevronDown
                  size={12}
                  className={`flex-shrink-0 ml-1 transition-transform ${
                    openDropdown === 'type' ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {openDropdown === 'type' && (
                <div
                  className={`absolute left-0 right-0 top-full z-10 mt-1 max-h-40 overflow-y-auto rounded border ${
                    isDark
                      ? 'border-white/20 bg-black/80 backdrop-blur-md'
                      : 'border-white/30 bg-white/80 backdrop-blur-md shadow-xl'
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
                          : 'text-black/70 hover:bg-white/30 hover:text-black'
                      }`}
                    >
                      {type.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Specializations Filter - Services with Search & Checkboxes */}
            <div className="relative">
              <button
                onClick={() => toggleDropdown('specialization')}
                className={`flex w-full items-center justify-between rounded border px-2 py-1.5 text-left transition-all ${
                  selectedServices.length > 0
                    ? isDark
                      ? 'border-white bg-white text-black'
                      : 'border-black bg-black text-white'
                    : isDark
                    ? 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                    : 'border-white/30 bg-white/20 backdrop-blur-md hover:border-white/50 hover:bg-white/30'
                }`}
              >
                <div className="flex items-center gap-1 min-w-0 flex-1">
                  <Briefcase size={12} strokeWidth={1.5} className="flex-shrink-0" />
                  <span className="text-xs font-medium truncate">
                    {t.specializationFilter} {selectedServices.length > 0 && `(${selectedServices.length})`}
                  </span>
                </div>
                <ChevronDown
                  size={12}
                  className={`flex-shrink-0 ml-1 transition-transform ${
                    openDropdown === 'specialization' ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {openDropdown === 'specialization' && (
                <div
                  className={`absolute left-0 right-0 top-full z-10 mt-1 rounded border ${
                    isDark
                      ? 'border-white/20 bg-black/80 backdrop-blur-md'
                      : 'border-white/30 bg-white/80 backdrop-blur-md shadow-xl'
                  }`}
                >
                  {/* Search input */}
                  <div className="p-2 border-b border-white/10">
                    <input
                      type="text"
                      value={servicesSearchTerm}
                      onChange={(e) => setServicesSearchTerm(e.target.value)}
                      placeholder={t.searchServices}
                      className={`w-full px-2 py-1 text-xs rounded border ${
                        isDark
                          ? 'bg-white/5 border-white/10 text-white placeholder:text-white/40'
                          : 'bg-white/20 backdrop-blur-md border-white/30 text-black placeholder:text-black/40'
                      }`}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>

                  {/* Services list with checkboxes */}
                  <div className="max-h-60 overflow-y-auto">
                    {loadingServices ? (
                      <div className="px-2 py-4 text-center text-xs text-white/40">{t.loading}</div>
                    ) : filteredServices.length === 0 ? (
                      <div className="px-2 py-4 text-center text-xs text-white/40">{t.noServicesFound}</div>
                    ) : (
                      filteredServices.map((service) => (
                        <label
                          key={service.id}
                          className={`flex items-center gap-2 px-2 py-1.5 cursor-pointer transition-colors ${
                            isDark
                              ? 'hover:bg-white/10'
                              : 'hover:bg-white/30'
                          }`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            checked={selectedServices.includes(service.id)}
                            onChange={() => toggleService(service.id)}
                            className="rounded text-emerald-500 focus:ring-emerald-500"
                          />
                          <span className={`text-xs ${
                            isDark ? 'text-white/70' : 'text-black/70'
                          }`}>
                            {service.title}
                          </span>
                        </label>
                      ))
                    )}
                  </div>
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
                    : 'border-white/30 bg-white/20 backdrop-blur-md hover:border-white/50 hover:bg-white/30'
                }`}
              >
                <div className="flex items-center gap-1 min-w-0 flex-1">
                  <MapPin size={12} strokeWidth={1.5} className="flex-shrink-0" />
                  <span className="text-xs font-medium truncate">
                    {selectedCityName || t.cityFilter}
                  </span>
                </div>
                <ChevronDown
                  size={12}
                  className={`flex-shrink-0 ml-1 transition-transform ${
                    openDropdown === 'city' ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {openDropdown === 'city' && (
                <div
                  className={`absolute left-0 right-0 top-full z-10 mt-1 max-h-40 overflow-y-auto rounded border ${
                    isDark
                      ? 'border-white/20 bg-black/80 backdrop-blur-md'
                      : 'border-white/30 bg-white/80 backdrop-blur-md shadow-xl'
                  }`}
                >
                  {loadingCities ? (
                    <div className="px-2 py-4 text-center text-xs text-white/40">{t.loading}</div>
                  ) : cities.length === 0 ? (
                    <div className="px-2 py-4 text-center text-xs text-white/40">{t.noCitiesFound}</div>
                  ) : (
                    cities.map((city) => (
                      <button
                        key={city.id}
                        onClick={() => {
                          setSelectedCity(city.id === selectedCity ? null : city.id);
                          setOpenDropdown(null);
                        }}
                        className={`w-full px-2 py-1.5 text-left text-xs transition-colors flex items-center justify-between ${
                          selectedCity === city.id
                            ? isDark
                              ? 'bg-white text-black'
                              : 'bg-black text-white'
                            : isDark
                            ? 'text-white/70 hover:bg-white/10 hover:text-white'
                            : 'text-black/70 hover:bg-white/30 hover:text-black'
                        }`}
                      >
                        <span>{city.name}</span>
                        <span className={`text-[10px] ${
                          selectedCity === city.id 
                            ? isDark ? 'text-black/60' : 'text-white/60'
                            : isDark ? 'text-white/40' : 'text-black/40'
                        }`}>
                          ({city.count})
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Languages Filter - Desktop */}
            <div className="relative">
              <button
                onClick={() => toggleDropdown('language')}
                className={`flex w-full items-center justify-between rounded border px-2 py-1.5 text-left transition-all ${
                  selectedLanguages.length > 0
                    ? isDark
                      ? 'border-white bg-white text-black'
                      : 'border-black bg-black text-white'
                    : isDark
                    ? 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                    : 'border-white/30 bg-white/20 backdrop-blur-md hover:border-white/50 hover:bg-white/30'
                }`}
              >
                <div className="flex items-center gap-1 min-w-0 flex-1">
                  <Globe size={12} strokeWidth={1.5} className="flex-shrink-0" />
                  <span className="text-xs font-medium truncate">
                    {t.languageFilter} {selectedLanguages.length > 0 && `(${selectedLanguages.length})`}
                  </span>
                </div>
                <ChevronDown
                  size={12}
                  className={`flex-shrink-0 ml-1 transition-transform ${
                    openDropdown === 'language' ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {openDropdown === 'language' && (
                <div
                  className={`absolute left-0 right-0 top-full z-10 mt-1 max-h-40 overflow-y-auto rounded border ${
                    isDark
                      ? 'border-white/20 bg-black/80 backdrop-blur-md'
                      : 'border-white/30 bg-white/80 backdrop-blur-md shadow-xl'
                  }`}
                >
                  {AVAILABLE_LANGUAGES.map((lang) => (
                    <label
                      key={lang}
                      className={`flex items-center gap-2 px-2 py-1.5 cursor-pointer transition-colors ${
                        isDark
                          ? 'hover:bg-white/10'
                          : 'hover:bg-white/30'
                      }`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={selectedLanguages.includes(lang)}
                        onChange={() => toggleLanguage(lang)}
                        className="rounded text-emerald-500 focus:ring-emerald-500"
                      />
                      <span className={`text-xs ${
                        isDark ? 'text-white/70' : 'text-black/70'
                      }`}>
                        {(t.languages as Record<string, string>)?.[lang] || lang}
                      </span>
                    </label>
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




