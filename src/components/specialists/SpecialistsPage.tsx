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

  useEffect(() => {
    fetchSpecialists();
  }, []);

  const fetchSpecialists = async () => {
    try {
      const supabase = createClient();
      
      console.log('Fetching specialists...');
      
      // Fetch solo specialists - only verified
      const { data: soloData, error: soloError } = await supabase
        .from('profiles')
        .select('id, full_name, role_title, bio, avatar_url, slug')
        .ilike('role', '%solo%')
        .eq('verification_status', 'verified');

      if (soloError) {
        console.error('Error fetching solo specialists:', soloError);
      } else {
        console.log('Fetched solo specialists:', soloData);
        setSoloSpecialists(soloData || []);
      }

      // Fetch company specialists - only verified
      const { data: companyData, error: companyError } = await supabase
        .from('profiles')
        .select('id, full_name, role_title, bio, avatar_url, company_id, slug')
        .eq('role', 'SPECIALIST')
        .not('company_id', 'is', null)
        .eq('verification_status', 'verified');

      if (companyError) {
        console.error('Error fetching company specialists:', companyError);
        console.error('Error details:', JSON.stringify(companyError, null, 2));
      } else if (companyData && companyData.length > 0) {
        console.log('Fetched company specialists:', companyData);
        
        // Get unique company IDs
        const companyIds = [...new Set(companyData.map(s => s.company_id).filter(Boolean))];
        console.log('Company IDs to fetch:', companyIds);
        
        // Fetch company names from profiles table where role = 'COMPANY'
        const { data: companiesData, error: companiesError } = await supabase
          .from('profiles')
          .select('id, full_name, company_slug')
          .in('id', companyIds)
          .eq('role', 'COMPANY');
        
        console.log('Fetched companies:', companiesData);
        if (companiesError) {
          console.error('Error fetching companies:', companiesError);
        }
        
        // Create a map of company ID to name and slug
        const companyMap = new Map(companiesData?.map(c => [c.id, { name: c.full_name, slug: c.company_slug }]) || []);
        console.log('Company map:', Object.fromEntries(companyMap));
        
        // Map company name to specialists
        const mappedData = companyData.map((s: { id: string; full_name: string; role_title: string; bio: string; avatar_url: string; company_id: string; slug: string }) => {
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
        
        console.log('Final mapped data:', mappedData);
        setCompanySpecialists(mappedData);
      } else {
        setCompanySpecialists([]);
      }
      
      // Fetch statistics counts - only verified
      // Count companies
      const { count: companiesCount, error: companiesCountError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'COMPANY')
        .eq('verification_status', 'verified');
      
      if (companiesCountError) {
        console.error('Error counting companies:', companiesCountError);
      } else {
        setTotalCompanies(companiesCount || 0);
      }
      
      // Count all specialists (company + solo) - only verified
      const { count: specialistsCount, error: specialistsCountError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .or('role.eq.SPECIALIST,role.ilike.%solo%')
        .eq('verification_status', 'verified');
      
      if (specialistsCountError) {
        console.error('Error counting specialists:', specialistsCountError);
      } else {
        setTotalSpecialists(specialistsCount || 0);
      }
      
      // Count services
      const { count: servicesCount, error: servicesCountError } = await supabase
        .from('services')
        .select('*', { count: 'exact', head: true });
      
      if (servicesCountError) {
        console.error('Error counting services:', servicesCountError);
        setTotalServices(0);
      } else {
        setTotalServices(servicesCount || 0);
      }
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
