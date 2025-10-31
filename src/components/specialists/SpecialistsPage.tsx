'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import SpecialistsStatistics from './statistics/SpecialistsStatistics';
import CompanySpecialistCard from './company-specialists/CompanySpecialistCard';
import SoloSpecialistCard from './solo-specialists/SoloSpecialistCard';

interface SoloSpecialist {
  id: string;
  full_name: string;
  role_title: string | null;
  bio: string | null;
  avatar_url?: string | null;
  slug?: string;
}

interface CompanySpecialist {
  id: string;
  full_name: string;
  role_title: string | null;
  company: string;
  company_slug?: string;
  bio: string | null;
  avatar_url?: string | null;
  slug?: string;
}

export default function SpecialistsPage() {
  const [soloSpecialists, setSoloSpecialists] = useState<SoloSpecialist[]>([]);
  const [companySpecialists, setCompanySpecialists] = useState<CompanySpecialist[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Statistics counts
  const [totalCompanies, setTotalCompanies] = useState(0);
  const [totalSpecialists, setTotalSpecialists] = useState(0);
  const [totalServices, setTotalServices] = useState(0);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [selectedSpecialistType, setSelectedSpecialistType] = useState<string | null>(null);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  useEffect(() => {
    fetchSpecialists();
  }, [searchTerm, selectedCity, selectedSpecialistType, selectedServices]);

  const fetchSpecialists = async () => {
    try {
      const supabase = createClient();
      
      console.log('Fetching specialists with filters:', { searchTerm, selectedCity, selectedSpecialistType, selectedServices });
      
      let allSpecialistIds: string[] = [];
      
      // 1. Filter by city if selected
      if (selectedCity) {
        console.log('Filtering by city:', selectedCity);
        
        const { data: specialistCityData } = await supabase
          .from('specialist_cities')
          .select('specialist_id')
          .eq('city_id', selectedCity);

        console.log('Specialist city data:', specialistCityData);

        allSpecialistIds = specialistCityData?.map(sc => sc.specialist_id) || [];
        
        console.log('Filtered specialist IDs by city:', allSpecialistIds);
      }
      
      // 2. Filter by services if selected
      if (selectedServices.length > 0) {
        const { data: specialistServicesData } = await supabase
          .from('specialist_services')
          .select('profile_id')
          .in('service_id', selectedServices);

        const serviceFilteredIds = specialistServicesData?.map(ss => ss.profile_id) || [];
        
        if (allSpecialistIds.length > 0) {
          // Intersect with existing IDs
          allSpecialistIds = allSpecialistIds.filter(id => serviceFilteredIds.includes(id));
        } else if (selectedCity) {
          // If city filter was applied but no results, keep empty
          allSpecialistIds = [];
        } else {
          // Only service filter applied
          allSpecialistIds = serviceFilteredIds;
        }
      }
      
      // 3. Search in both profiles and translations if searchTerm exists
      let searchFilteredIds: string[] = [];
      if (searchTerm) {
        // Search in profiles table (for basic info)
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id')
          .or(`full_name.ilike.%${searchTerm}%,role_title.ilike.%${searchTerm}%,bio.ilike.%${searchTerm}%`)
          .in('role', ['SPECIALIST', 'SOLO_SPECIALIST']);

        const profileIds = profilesData?.map(p => p.id) || [];

        // Search in specialist_translations table (for translated content)
        const { data: translationsData } = await supabase
          .from('specialist_translations')
          .select('specialist_id')
          .or(`full_name.ilike.%${searchTerm}%,role_title.ilike.%${searchTerm}%,bio.ilike.%${searchTerm}%,philosophy.ilike.%${searchTerm}%,teaching_writing_speaking.ilike.%${searchTerm}%`);

        const translationIds = translationsData?.map(t => t.specialist_id) || [];

        // Combine both results (union)
        searchFilteredIds = [...new Set([...profileIds, ...translationIds])];
        
        if (allSpecialistIds.length > 0) {
          // Intersect with existing IDs
          allSpecialistIds = allSpecialistIds.filter(id => searchFilteredIds.includes(id));
        } else if (selectedCity || selectedServices.length > 0) {
          // If other filters were applied but no results, keep empty
          allSpecialistIds = [];
        } else {
          // Only search filter applied
          allSpecialistIds = searchFilteredIds;
        }
      }
      
      const hasFilters = selectedCity || selectedServices.length > 0 || searchTerm;
      
      // 4. Fetch solo specialists based on type filter
      if (!selectedSpecialistType || selectedSpecialistType === 'solo') {
        let soloQuery = supabase
          .from('profiles')
          .select('id, full_name, role_title, bio, avatar_url, slug')
          .ilike('role', '%solo%')
          .eq('verification_status', 'verified');

        if (hasFilters && allSpecialistIds.length === 0) {
          setSoloSpecialists([]);
        } else {
          if (allSpecialistIds.length > 0) {
            soloQuery = soloQuery.in('id', allSpecialistIds);
          }

          const { data: soloData, error: soloError } = await soloQuery;

          if (soloError) {
            console.error('Error fetching solo specialists:', soloError);
          } else {
            setSoloSpecialists(soloData || []);
          }
        }
      } else {
        setSoloSpecialists([]);
      }

      // 5. Fetch company specialists based on type filter
      if (!selectedSpecialistType || selectedSpecialistType === 'company') {
        let companyQuery = supabase
          .from('profiles')
          .select('id, full_name, role_title, bio, avatar_url, company_id, slug')
          .eq('role', 'SPECIALIST')
          .not('company_id', 'is', null)
          .eq('verification_status', 'verified');

        if (hasFilters && allSpecialistIds.length === 0) {
          setCompanySpecialists([]);
        } else {
          if (allSpecialistIds.length > 0) {
            companyQuery = companyQuery.in('id', allSpecialistIds);
          }

          const { data: companyData, error: companyError } = await companyQuery;

          if (companyError) {
            console.error('Error fetching company specialists:', companyError);
            setCompanySpecialists([]);
          } else if (companyData && companyData.length > 0) {
            const companyIds = [...new Set(companyData.map(s => s.company_id).filter(Boolean))];
            
            const { data: companiesData } = await supabase
              .from('profiles')
              .select('id, full_name, company_slug')
              .in('id', companyIds)
              .eq('role', 'COMPANY');
            
            const companyMap = new Map(companiesData?.map(c => [c.id, { name: c.full_name, slug: c.company_slug }]) || []);
            
            const mappedData = companyData.map((s: { id: string; full_name: string; role_title: string; bio: string; company_id: string; photo_url?: string; email?: string; phone_number?: string; avatar_url?: string; slug?: string }) => {
              const companyInfo = companyMap.get(s.company_id);
              return {
                id: s.id,
                full_name: s.full_name,
                role_title: s.role_title,
                bio: s.bio,
                avatar_url: s.avatar_url,
                company: companyInfo?.name || 'Company',
                company_slug: companyInfo?.slug,
                slug: s.slug
              };
            });
            
            setCompanySpecialists(mappedData);
          } else {
            setCompanySpecialists([]);
          }
        }
      } else {
        setCompanySpecialists([]);
      }
      
      // Fetch statistics counts - only verified
      const { count: companiesCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'COMPANY')
        .eq('verification_status', 'verified');
      
      setTotalCompanies(companiesCount || 0);
      
      const { count: specialistsCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .or('role.eq.SPECIALIST,role.ilike.%solo%')
        .eq('verification_status', 'verified');
      
      setTotalSpecialists(specialistsCount || 0);
      
      const { count: servicesCount } = await supabase
        .from('services')
        .select('*', { count: 'exact', head: true });
      
      setTotalServices(servicesCount || 0);
    } catch (error) {
      console.error('Catch error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen px-4 py-6">
      <div className="mx-auto max-w-[1200px]">
        <h1 className="text-3xl font-bold mb-8">სპეციალისტები</h1>
        
        {/* Statistics Section */}
        <div className="mb-8">
          <SpecialistsStatistics 
            totalCompanies={totalCompanies}
            totalSpecialists={totalSpecialists}
            totalServices={totalServices}
            onSearchChange={setSearchTerm}
            onCityChange={setSelectedCity}
            onSpecialistTypeChange={setSelectedSpecialistType}
            onServicesChange={setSelectedServices}
          />
        </div>

        {/* Divider */}
        <div className="mb-8 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent dark:via-white/20"></div>

        {/* Company Specialists Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">
            კომპანიის სპეციალისტები ({companySpecialists.length})
          </h2>
          {loading ? (
            <div className="text-center py-8">იტვირთება...</div>
          ) : companySpecialists.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {companySpecialists.map((specialist) => (
                <CompanySpecialistCard key={specialist.id} specialist={specialist} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">კომპანიის სპეციალისტები არ მოიძებნა</div>
          )}
        </div>

        {/* Divider */}
        <div className="mb-8 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent dark:via-white/20"></div>

        {/* Solo Specialists Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">
            დამოუკიდებელი სპეციალისტები ({soloSpecialists.length})
          </h2>
          {loading ? (
            <div className="text-center py-8">იტვირთება...</div>
          ) : soloSpecialists.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {soloSpecialists.map((specialist) => (
                <SoloSpecialistCard key={specialist.id} specialist={specialist} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">დამოუკიდებელი სპეციალისტები არ მოიძებნა</div>
          )}
        </div>
      </div>
    </div>
  );
}
