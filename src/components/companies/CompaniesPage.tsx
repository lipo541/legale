'use client';

import { useEffect, useState, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { useTheme } from '@/contexts/ThemeContext';
import { createClient } from '@/lib/supabase/client';
import { Building2, Search, SlidersHorizontal } from 'lucide-react';
import CompanyCard from './companycard/CompanyCard';
import CompanyCardSkeleton from './CompanyCardSkeleton';
import CompanySearch from './companysearch/CompanySearch';
import CompanyFilters from './companyfilters/CompanyFilters';
import InfoCards from './infocards/InfoCards';
import CompaniesHero from './CompaniesHero';
import Breadcrumb from '../common/Breadcrumb';
import Sort from '../common/Sort';
import ViewModeToggle from '../common/ViewModeToggle';
import { companiesTranslations } from '@/translations/companies';

interface Company {
  id: string;
  full_name: string;
  company_slug: string;
  logo_url?: string | null;
  summary?: string | null;
  address?: string | null;
  phone_number?: string | null;
  website?: string | null;
  role: string;
  status: string;
}

export default function CompaniesPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const supabase = createClient();
  const pathname = usePathname();
  const locale = pathname?.split('/')[1] || 'ka';
  const t = companiesTranslations[locale as keyof typeof companiesTranslations] || companiesTranslations.ka;

  const [companies, setCompanies] = useState<Company[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Filter states
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [selectedSpecialization, setSelectedSpecialization] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);

  // Sort and View Mode states
  const [sortBy, setSortBy] = useState<string>('a-z');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Stats
  const [totalSpecialists, setTotalSpecialists] = useState(0);
  const [totalServices, setTotalServices] = useState(0);

  // Filter data
  const [specializations, setSpecializations] = useState<Array<{ id: string; name: string }>>([]);

  const [cities, setCities] = useState<string[]>([]);

  // Load view mode and sort from localStorage
  useEffect(() => {
    const savedViewMode = localStorage.getItem('companiesViewMode');
    const savedSortBy = localStorage.getItem('companiesSortBy');
    
    if (savedViewMode === 'grid' || savedViewMode === 'list') {
      setViewMode(savedViewMode);
    }
    if (savedSortBy) {
      setSortBy(savedSortBy);
    }
  }, []);

  // Save view mode to localStorage
  useEffect(() => {
    localStorage.setItem('companiesViewMode', viewMode);
  }, [viewMode]);

  // Save sort preference to localStorage
  useEffect(() => {
    localStorage.setItem('companiesSortBy', sortBy);
  }, [sortBy]);

  // Debounce search term to reduce API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch companies and stats
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch companies
        const { data: companiesData, error: companiesError } = await supabase
          .from('profiles')
          .select('*')
          .eq('role', 'COMPANY')
          .eq('verification_status', 'verified')
          .order('full_name', { ascending: true });

        if (companiesError) {
          console.error('Error fetching companies:', companiesError.message, companiesError);
          throw companiesError;
        }

        setCompanies(companiesData || []);
        setFilteredCompanies(companiesData || []);

        // Fetch only cities that are actually assigned to companies
        const { data: companyCitiesData, error: companyCitiesError } = await supabase
          .from('company_cities')
          .select('cities(id, name_ka, name_en, name_ru)');

        if (companyCitiesError) {
          console.error('Error fetching company cities:', companyCitiesError.message);
        } else {
          // Extract unique cities
          const uniqueCities = new Map();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          companyCitiesData?.forEach((item: any) => {
            if (item.cities) {
              const cityName = locale === 'en' ? item.cities.name_en : locale === 'ru' ? item.cities.name_ru : item.cities.name_ka;
              if (cityName && !uniqueCities.has(cityName)) {
                uniqueCities.set(cityName, item.cities);
              }
            }
          });
          
          // Sort cities by name
          const sortedCities = Array.from(uniqueCities.keys()).sort();
          setCities(sortedCities);
        }

        // Fetch specializations that are actually assigned to companies
        const { data: companySpecializationsData, error: companySpecializationsError } = await supabase
          .from('company_specializations')
          .select('specializations(id, name_ka, name_en, name_ru)');

        if (companySpecializationsError) {
          console.error('Error fetching company specializations:', companySpecializationsError.message);
        } else {
          // Extract unique specializations
          const uniqueSpecializations = new Map();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          companySpecializationsData?.forEach((item: any) => {
            if (item.specializations) {
              const specName = locale === 'en' ? item.specializations.name_en : locale === 'ru' ? item.specializations.name_ru : item.specializations.name_ka;
              if (specName && !uniqueSpecializations.has(item.specializations.id)) {
                uniqueSpecializations.set(item.specializations.id, { id: item.specializations.id, name: specName });
              }
            }
          });
          
          // Sort specializations by name
          const sortedSpecializations = Array.from(uniqueSpecializations.values()).sort((a, b) => a.name.localeCompare(b.name));
          setSpecializations(sortedSpecializations);
        }

        // Fetch ALL specialists count (company + independent) - only verified
        const { count: specialistsCount, error: specialistsError } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'SPECIALIST')
          .eq('verification_status', 'verified');

        if (specialistsError) {
          console.error('Error fetching specialists:', specialistsError.message, specialistsError);
        } else {
          setTotalSpecialists(specialistsCount || 0);
        }

        // Fetch services count from services table
        const { count: servicesCount, error: servicesError } = await supabase
          .from('services')
          .select('*', { count: 'exact', head: true });

        if (servicesError) {
          console.error('Error fetching services:', servicesError.message, servicesError);
          // Services table might not exist yet, set to 0
          setTotalServices(0);
        } else {
          setTotalServices(servicesCount || 0);
        }
      } catch (error) {
        console.error('Error fetching data:', error instanceof Error ? error.message : error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [supabase, locale]);

  // Apply filters - memoized to prevent recreation on every render
  const applyFilters = useCallback(async () => {
    let filtered = companies;

      // Enhanced search filter - search across multiple fields and languages
      if (debouncedSearchTerm.trim()) {
        const searchLower = debouncedSearchTerm.toLowerCase();
        
        // Get all company IDs that match search criteria
        const matchingCompanyIds = new Set<string>();

        // Search in company name
        companies.forEach(company => {
          if (company.full_name.toLowerCase().includes(searchLower)) {
            matchingCompanyIds.add(company.id);
          }
        });

        try {
          // Search in cities (all languages)
          const { data: allCities } = await supabase
            .from('cities')
            .select('id, name_ka, name_en, name_ru');

          const cityMatches = allCities?.filter(city => 
            city.name_ka.toLowerCase().includes(searchLower) ||
            city.name_en.toLowerCase().includes(searchLower) ||
            city.name_ru.toLowerCase().includes(searchLower)
          ) || [];

          if (cityMatches.length > 0) {
            const cityIds = cityMatches.map(c => c.id);
            const { data: companyCities } = await supabase
              .from('company_cities')
              .select('company_id')
              .in('city_id', cityIds);
            
            companyCities?.forEach(cc => matchingCompanyIds.add(cc.company_id));
          }

          // Search in specializations (all languages)
          const { data: allSpecs } = await supabase
            .from('specializations')
            .select('id, name_ka, name_en, name_ru');

          const specializationMatches = allSpecs?.filter(spec =>
            spec.name_ka.toLowerCase().includes(searchLower) ||
            spec.name_en.toLowerCase().includes(searchLower) ||
            spec.name_ru.toLowerCase().includes(searchLower)
          ) || [];

          if (specializationMatches.length > 0) {
            const specIds = specializationMatches.map(s => s.id);
            const { data: companySpecs, error: companySpecError } = await supabase
              .from('company_specializations')
              .select('company_id')
              .in('specialization_id', specIds);
            
            if (companySpecError) {
              console.error('❌ Company specialization search error:', companySpecError);
            }
            
            companySpecs?.forEach(cs => matchingCompanyIds.add(cs.company_id));
          }

          // Search in specialists (full_name)
          const { data: allSpecialists } = await supabase
            .from('profiles')
            .select('company_id, full_name')
            .eq('role', 'SPECIALIST')
            .not('company_id', 'is', null);

          const specialistMatches = allSpecialists?.filter(s =>
            s.full_name.toLowerCase().includes(searchLower)
          ) || [];

          specialistMatches.forEach(s => {
            if (s.company_id) matchingCompanyIds.add(s.company_id);
          });

          // Search in services (all language fields)
          const { data: allServices } = await supabase
            .from('services')
            .select('company_id, title_ka, title_en, title_ru')
            .not('company_id', 'is', null);

          const serviceMatches = allServices?.filter(service =>
            (service.title_ka && service.title_ka.toLowerCase().includes(searchLower)) ||
            (service.title_en && service.title_en.toLowerCase().includes(searchLower)) ||
            (service.title_ru && service.title_ru.toLowerCase().includes(searchLower))
          ) || [];

          serviceMatches.forEach(s => {
            if (s.company_id) matchingCompanyIds.add(s.company_id);
          });

        } catch (error) {
          console.error('❌ Error in search:', error);
        }
        
        // Filter companies by matching IDs
        filtered = filtered.filter((company) => matchingCompanyIds.has(company.id));
      }

      // Company filter
      if (selectedCompany) {
        filtered = filtered.filter((company) => company.id === selectedCompany);
      }

      // City filter - check against company_cities table
      if (selectedCity) {
        try {
          // Get city ID from cities table (search in all language fields)
          const { data: cityData } = await supabase
            .from('cities')
            .select('id')
            .or(`name_ka.eq.${selectedCity},name_en.eq.${selectedCity},name_ru.eq.${selectedCity}`)
            .single();

          if (cityData) {
            // Get company IDs that have this city
            const { data: companyCities } = await supabase
              .from('company_cities')
              .select('company_id')
              .eq('city_id', cityData.id);

            const companyIdsWithCity = companyCities?.map(cc => cc.company_id) || [];
            
            // Filter companies by those IDs
            filtered = filtered.filter((company) => 
              companyIdsWithCity.includes(company.id)
            );
          }
        } catch (error) {
          console.error('Error filtering by city:', error);
        }
      }

      // Specialization filter - check against company_specializations table
      if (selectedSpecialization) {
        try {
          // Get company IDs that have this specialization
          const { data: companySpecializations } = await supabase
            .from('company_specializations')
            .select('company_id')
            .eq('specialization_id', selectedSpecialization);

          const companyIdsWithSpecialization = companySpecializations?.map(cs => cs.company_id) || [];
          
          // Filter companies by those IDs
          filtered = filtered.filter((company) => 
            companyIdsWithSpecialization.includes(company.id)
          );
        } catch (error) {
          console.error('Error filtering by specialization:', error);
        }
      }

      // Apply sorting
      const sortedFiltered = [...filtered].sort((a, b) => {
        switch (sortBy) {
          case 'a-z':
            return a.full_name.localeCompare(b.full_name, locale);
          case 'z-a':
            return b.full_name.localeCompare(a.full_name, locale);
          case 'newest':
            return b.id.localeCompare(a.id);
          case 'oldest':
            return a.id.localeCompare(b.id);
          default:
            return 0;
        }
      });

      setFilteredCompanies(sortedFiltered);
  }, [debouncedSearchTerm, selectedCompany, selectedSpecialization, selectedCity, companies, supabase, sortBy, locale]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const handleClearFilters = () => {
    setSelectedCompany(null);
    setSelectedSpecialization(null);
    setSelectedCity(null);
    setSearchTerm('');
  };

  if (loading) {
    return (
      <div className="min-h-screen px-4 py-6">
        <div className="mx-auto max-w-[1200px]">
          {/* Header */}
          <div className="mb-6 text-center">
            <h1 className={`mb-1 text-3xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-black'}`}>
              {t.breadcrumb}
            </h1>
            <p className={`text-sm ${isDark ? 'text-white/70' : 'text-black/70'}`}>
              {t.loading}
            </p>
          </div>

          {/* Skeleton Grid */}
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 12 }).map((_, index) => (
              <CompanyCardSkeleton key={index} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-6">
      <div className="mx-auto max-w-7xl px-2 py-4 sm:px-4 lg:px-8">
        {/* Breadcrumb Navigation */}
        <Breadcrumb 
          items={[{ 
            label: t.breadcrumb
          }]} 
        />

        {/* Hero Section */}
        <CompaniesHero 
          locale={locale}
          totalCompanies={companies.length}
        />

        {/* Info Cards */}
        <div className="mb-4">
          <InfoCards
            totalCompanies={companies.length}
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
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t.searchPlaceholder}
                aria-label={t.searchAriaLabelFull}
                aria-describedby="search-description"
                className={`w-full rounded-xl border py-2 pl-9 pr-3 text-sm transition-all duration-300 placeholder:text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  isDark
                    ? 'border-white/10 bg-white/5 text-white placeholder:text-white/40 hover:border-white/20 focus:border-white/30 focus:bg-white/10 focus:ring-white/50'
                    : 'border-black/10 bg-white text-black placeholder:text-black/40 hover:border-black/20 focus:border-black/30 focus:bg-gray-50 shadow-sm focus:ring-black/50'
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
                  onChange={setSortBy}
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
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t.searchPlaceholder}
                aria-label={t.searchAriaLabelFull}
                aria-describedby="search-description-desktop"
                className={`w-full rounded-xl border py-2 pl-9 pr-3 text-sm transition-all duration-300 placeholder:text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  isDark
                    ? 'border-white/10 bg-white/5 text-white placeholder:text-white/40 hover:border-white/20 focus:border-white/30 focus:bg-white/10 focus:ring-white/50'
                    : 'border-black/10 bg-white text-black placeholder:text-black/40 hover:border-black/20 focus:border-black/30 focus:bg-gray-50 shadow-sm focus:ring-black/50'
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
                onChange={setSortBy}
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
                  ? 'border-white/10 bg-white/5 text-white hover:border-white/20 hover:bg-white/10 hover:scale-[1.02] focus-visible:ring-white/50'
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
              companies={companies}
              specializations={specializations}
              cities={cities}
              selectedCompany={selectedCompany}
              selectedSpecialization={selectedSpecialization}
              selectedCity={selectedCity}
              onCompanyChange={setSelectedCompany}
              onSpecializationChange={setSelectedSpecialization}
              onCityChange={setSelectedCity}
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
        {filteredCompanies.length > 0 ? (
          <div className={viewMode === 'grid' 
            ? "grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4" 
            : "flex flex-col gap-3"
          }>
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
              {searchTerm || selectedCompany || selectedCity || selectedSpecialization
                ? t.noCompaniesFound
                : t.noCompaniesYet}
            </p>
            {(searchTerm || selectedCompany || selectedCity || selectedSpecialization) && (
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
