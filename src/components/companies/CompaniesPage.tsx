'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useTheme } from '@/contexts/ThemeContext';
import { createClient } from '@/lib/supabase/client';
import { Building2, Loader2 } from 'lucide-react';
import CompanyCard from './companycard/CompanyCard';
import CompanySearch from './companysearch/CompanySearch';
import CompanyFilters from './companyfilters/CompanyFilters';
import InfoCards from './infocards/InfoCards';

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

  const [companies, setCompanies] = useState<Company[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Filter states
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [selectedSpecialization, setSelectedSpecialization] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);

  // Stats
  const [totalSpecialists, setTotalSpecialists] = useState(0);
  const [totalServices, setTotalServices] = useState(0);

  // Filter data
  const [specializations, setSpecializations] = useState<Array<{ id: string; name: string }>>([]);

  const [cities, setCities] = useState<string[]>([]);

  // Fetch companies and stats
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch companies
        const { data: companiesData, error: companiesError } = await supabase
          .from('profiles')
          .select('*')
          .eq('role', 'COMPANY')
          .order('full_name', { ascending: true });

        if (companiesError) {
          console.error('Error fetching companies:', companiesError.message, companiesError);
          throw companiesError;
        }

        console.log('Companies fetched:', companiesData?.length || 0);
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

        // Fetch ALL specialists count (company + independent)
        const { count: specialistsCount, error: specialistsError } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'SPECIALIST');

        if (specialistsError) {
          console.error('Error fetching specialists:', specialistsError.message, specialistsError);
        } else {
          console.log('Specialists count:', specialistsCount);
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
          console.log('Services count:', servicesCount);
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

  // Apply filters
  useEffect(() => {
    const applyFilters = async () => {
      let filtered = companies;

      // Search filter
      if (searchTerm.trim()) {
        filtered = filtered.filter((company) =>
          company.full_name.toLowerCase().includes(searchTerm.toLowerCase())
        );
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

      setFilteredCompanies(filtered);
    };

    applyFilters();
  }, [searchTerm, selectedCompany, selectedSpecialization, selectedCity, companies, supabase]);

  const handleClearFilters = () => {
    setSelectedCompany(null);
    setSelectedSpecialization(null);
    setSelectedCity(null);
    setSearchTerm('');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className={`animate-spin ${isDark ? 'text-white' : 'text-black'}`} size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-6">
      <div className="mx-auto max-w-[1200px]">
        {/* Header */}
        <div className="mb-6 text-center">
          <h1 className={`mb-1 text-3xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-black'}`}>
            კომპანიები
          </h1>
          <p className={`text-sm ${isDark ? 'text-white/70' : 'text-black/70'}`}>
            დარეგისტრირებული იურიდიული კომპანიები პლატფორმაზე
          </p>
        </div>

        {/* Info Cards */}
        <div className="mb-4">
          <InfoCards
            totalCompanies={companies.length}
            totalSpecialists={totalSpecialists}
            totalServices={totalServices}
          />
        </div>

        {/* Search & Filter */}
        <div className="mb-3">
          <CompanySearch
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onFilterClick={() => setIsFilterOpen(!isFilterOpen)}
            isFilterOpen={isFilterOpen}
          />
        </div>

        {/* Filters Dropdown */}
        <div className="mb-3">
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

        {/* Companies Count */}
        <div className="mb-4 text-center">
          <p className={`text-xs ${isDark ? 'text-white/50' : 'text-black/50'}`}>
            {filteredCompanies.length} კომპანია
          </p>
        </div>

        {/* Companies Grid */}
        {filteredCompanies.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
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
              />
            ))}
          </div>
        ) : (
          <div className="py-12 text-center">
            <Building2
              className={`mx-auto mb-2 ${isDark ? 'text-white/10' : 'text-black/10'}`}
              size={40}
              strokeWidth={1}
            />
            <p className={`text-sm ${isDark ? 'text-white/50' : 'text-black/50'}`}>
              {searchTerm || selectedCompany || selectedCity
                ? 'კომპანია ვერ მოიძებნა'
                : 'ჯერ არ არის დარეგისტრირებული კომპანიები'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
