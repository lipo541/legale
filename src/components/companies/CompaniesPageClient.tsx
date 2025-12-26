'use client';

import { useCallback } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { Building2, Search, SlidersHorizontal } from 'lucide-react';
import CompanyCard from './companycard/CompanyCard';
import CompanyCardSkeleton from './CompanyCardSkeleton';
import CompanyFilters from './companyfilters/CompanyFilters';
import InfoCards from './infocards/InfoCards';
import CompaniesHero from './CompaniesHero';
import Breadcrumb from '../common/Breadcrumb';
import Sort from '../common/Sort';
import ViewModeToggle from '../common/ViewModeToggle';
import { companiesTranslations } from '@/translations/companies';
// Hooks
import { 
  useCompaniesFilters, 
  useCompaniesView,
  useCompaniesData
} from './hooks';
// Types
import type { CompaniesPageClientProps } from './types';
import { useState } from 'react';

// ============================================================================
// COMPANIES PAGE CLIENT COMPONENT
// ============================================================================

export default function CompaniesPageClient({ 
  locale, 
  initialData 
}: CompaniesPageClientProps) {
  // Debug: log initial data
  console.log('[CompaniesPageClient] initialData.companies:', initialData.companies?.length, initialData.companies);
  
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const t = companiesTranslations[locale as keyof typeof companiesTranslations] || companiesTranslations.ka;
  
  // Pre-fetched data from server
  const { stats, cities = [], specializations = [] } = initialData;
  const { totalCompanies, totalSpecialists, totalServices } = stats;
  
  // Filter dropdown state
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  // Use optimized hooks
  const filters = useCompaniesFilters();
  const { viewMode, setViewMode, sortBy, setSortBy } = useCompaniesView();
  
  // Wrapper for Sort component type compatibility
  const handleSortChange = useCallback((value: string) => {
    setSortBy(value as 'newest' | 'oldest' | 'a-z' | 'z-a');
  }, [setSortBy]);
  
  // Use centralized data hook
  const {
    companies: filteredCompanies,
    loading,
    hasActiveFilters,
  } = useCompaniesData({
    initialCompanies: initialData.companies,
    filters: {
      searchTerm: filters.searchTerm,
      debouncedSearchTerm: filters.debouncedSearchTerm,
      selectedCompany: filters.selectedCompany,
      selectedSpecialization: filters.selectedSpecialization,
      selectedCity: filters.selectedCity,
    },
    locale,
    sortBy,
  });

  // Get city names for filter dropdown
  const cityNames = cities.map(c => c.name);

  // Handle clear filters
  const handleClearFilters = useCallback(() => {
    filters.clearFilters();
  }, [filters]);

  // Render skeleton loader
  const renderSkeletons = () => (
    <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 12 }).map((_, i) => (
        <CompanyCardSkeleton key={i} />
      ))}
    </div>
  );

  // Grid class helper
  const getGridClass = () => viewMode === 'grid' 
    ? "grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4" 
    : "flex flex-col gap-3";

  return (
    <div className="min-h-screen py-6">
      <div className="mx-auto max-w-[1200px] px-6 sm:px-8 lg:px-10">
        {/* Breadcrumb Navigation */}
        <Breadcrumb 
          items={[{ label: t.breadcrumb }]} 
        />

        {/* Hero Section */}
        <CompaniesHero 
          locale={locale}
          totalCompanies={totalCompanies}
        />

        {/* Info Cards */}
        <div className="mb-4">
          <InfoCards
            totalCompanies={totalCompanies}
            totalSpecialists={totalSpecialists}
            totalServices={totalServices}
          />
        </div>

        {/* Search, Sort, View Mode, Filter - All in One Row (Desktop) */}
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
                value={filters.searchTerm}
                onChange={(e) => filters.setSearchTerm(e.target.value)}
                placeholder={t.searchPlaceholder}
                aria-label={t.searchAriaLabelFull}
                aria-describedby="search-description"
                className={`w-full rounded-xl border backdrop-blur-md py-2 pl-9 pr-3 text-sm transition-all duration-300 placeholder:text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  isDark
                    ? 'border-white/10 bg-black/40 text-white placeholder:text-white/40 hover:border-white/20 focus:border-white/30 focus:bg-black/50 focus:ring-white/50'
                    : 'border-white/30 bg-white/20 text-black placeholder:text-black/40 hover:border-white/50 focus:border-white/50 focus:bg-white/30 shadow-xl focus:ring-black/50'
                }`}
              />
              <span id="search-description" className="sr-only">
                {t.searchDescriptionText}
              </span>
            </div>

            {/* Controls Row - Sort, View, Filter */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Sort */}
              <div className="flex-1">
                <Sort 
                  options={[
                    { value: 'a-z', label: t.sortAZ },
                    { value: 'z-a', label: t.sortZA },
                    { value: 'newest', label: t.sortNewest },
                    { value: 'oldest', label: t.sortOldest },
                  ]}
                  value={sortBy}
                  onChange={handleSortChange}
                />
              </div>

              {/* View Mode Toggle - Centered */}
              <div className="flex-shrink-0">
                <ViewModeToggle view={viewMode} onChange={setViewMode} />
              </div>

              {/* Filter Button */}
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                aria-label={t.filterButton}
                aria-expanded={isFilterOpen}
                aria-controls="company-filters"
                className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 rounded-lg border px-2 py-1.5 sm:px-4 sm:py-2.5 text-xs sm:text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                  isFilterOpen
                    ? isDark
                      ? 'border-white bg-white text-black scale-[0.98] focus-visible:ring-white/50'
                      : 'border-black bg-black text-white scale-[0.98] focus-visible:ring-black/50'
                    : isDark
                    ? 'border-white/10 bg-white/5 text-white hover:border-white/20 hover:bg-white/10 hover:scale-[1.02] focus-visible:ring-white/50'
                    : 'border-black/10 bg-white text-black hover:border-black/20 hover:bg-gray-50 shadow-sm hover:shadow-md hover:scale-[1.02] focus-visible:ring-black/50'
                }`}
              >
                <SlidersHorizontal className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" strokeWidth={1.5} aria-hidden="true" />
                <span className="whitespace-nowrap truncate">{t.filterButton}</span>
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
                value={filters.searchTerm}
                onChange={(e) => filters.setSearchTerm(e.target.value)}
                placeholder={t.searchPlaceholder}
                aria-label={t.searchAriaLabelFull}
                aria-describedby="search-description-desktop"
                className={`w-full rounded-xl border backdrop-blur-md py-2 pl-9 pr-3 text-sm transition-all duration-300 placeholder:text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  isDark
                    ? 'border-white/10 bg-black/40 text-white placeholder:text-white/40 hover:border-white/20 focus:border-white/30 focus:bg-black/50 focus:ring-white/50'
                    : 'border-white/30 bg-white/20 text-black placeholder:text-black/40 hover:border-white/50 focus:border-white/50 focus:bg-white/30 shadow-xl focus:ring-black/50'
                }`}
              />
              <span id="search-description-desktop" className="sr-only">
                {t.searchDescriptionText}
              </span>
            </div>

            {/* Sort and View Mode Toggle */}
            <div className="flex items-center gap-2">
              {/* Sort */}
              <Sort 
                options={[
                  { value: 'a-z', label: t.sortAZ },
                  { value: 'z-a', label: t.sortZA },
                  { value: 'newest', label: t.sortNewest },
                  { value: 'oldest', label: t.sortOldest },
                ]}
                value={sortBy}
                onChange={handleSortChange}
              />

              {/* View Mode Toggle */}
              <ViewModeToggle view={viewMode} onChange={setViewMode} />
            </div>

            {/* Filter Button */}
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              aria-label={t.filterButton}
              aria-expanded={isFilterOpen}
              aria-controls="company-filters"
              className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-all duration-300 md:px-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                isFilterOpen
                  ? isDark
                    ? 'border-white bg-white text-black scale-[0.98] focus-visible:ring-white/50'
                    : 'border-black bg-black text-white scale-[0.98] focus-visible:ring-black/50'
                  : isDark
                  ? 'border-white/10 bg-black/40 text-white hover:border-white/20 hover:bg-black/550 hover:scale-[1.02] focus-visible:ring-white/50'
                  : 'border-black/10 bg-white text-black hover:border-black/20 hover:bg-gray-50 shadow-sm hover:shadow-md hover:scale-[1.02] focus-visible:ring-black/50'
              }`}
            >
              <SlidersHorizontal size={16} strokeWidth={1.5} aria-hidden="true" />
              <span>{t.filterButton}</span>
            </button>
          </div>
        </div>

        {/* Filters Dropdown */}
        {isFilterOpen && (
          <div className="mb-4">
            <CompanyFilters
              isOpen={isFilterOpen}
              companies={initialData.companies}
              specializations={specializations}
              cities={cityNames}
              selectedCompany={filters.selectedCompany}
              selectedSpecialization={filters.selectedSpecialization}
              selectedCity={filters.selectedCity}
              onCompanyChange={filters.setSelectedCompany}
              onSpecializationChange={filters.setSelectedSpecialization}
              onCityChange={filters.setSelectedCity}
              onClearFilters={handleClearFilters}
            />
          </div>
        )}

        {/* Screen Reader Announcement for Results */}
        <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
          {filteredCompanies.length} {t.companiesFoundAria}
        </div>

        <div className="mb-4 text-center">
          <p className={`text-xs ${isDark ? 'text-white/50' : 'text-black/50'}`}>
            {filteredCompanies.length} {t.companiesCount}
          </p>
        </div>

        {/* Companies Grid */}
        {loading ? (
          renderSkeletons()
        ) : filteredCompanies.length > 0 ? (
          <div className={getGridClass()}>
            {filteredCompanies.map((company) => (
              <CompanyCard
                key={company.id}
                full_name={company.full_name}
                company_slug={company.company_slug}
                logo_url={company.logo_url}
                summary={company.summary}
                address={company.address}
                phone_number={company.phone_number}
                website={company.website}
                viewMode={viewMode}
              />
            ))}
          </div>
        ) : (
          <div className="py-16 text-center">
            <div className="mb-4 flex justify-center">
              <div
                className={`rounded-full p-4 transition-all duration-300 ${
                  isDark ? 'bg-white/5' : 'bg-black/5'
                }`}
              >
                <Building2
                  className={`transition-colors duration-300 ${
                    isDark ? 'text-white/20' : 'text-black/20'
                  }`}
                  size={48}
                  strokeWidth={1.5}
                />
              </div>
            </div>
            <p className={`mb-2 text-base font-medium ${isDark ? 'text-white/70' : 'text-black/70'}`}>
              {hasActiveFilters
                ? t.noCompaniesFound
                : t.noCompaniesYet}
            </p>
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className={`mt-4 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                  isDark
                    ? 'bg-white/10 text-white hover:bg-white/20 focus-visible:ring-white/30'
                    : 'bg-black/10 text-black hover:bg-black/20 focus-visible:ring-black/30'
                }`}
              >
                {t.clearFiltersButton}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
