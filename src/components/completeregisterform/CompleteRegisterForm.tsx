"use client";
import { createClient } from "@/lib/supabase/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useState, useEffect } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { User, Phone, FileText } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import type { Locale } from "@/lib/i18n/config";

interface Company {
  id: string
  full_name: string
  company_slug: string
}

const FormSchema = z.object({
  full_name: z.string().optional(),
  company_slug: z.string().optional(),
  phone_number: z.string().min(1, "Phone number is required"),
  about: z.string().min(1, "Please tell us about yourself"),
  existing_company_id: z.string().optional(),
});

export default function CompleteRegisterForm() {
  const [requestType, setRequestType] = useState<"specialist" | "company">("specialist");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [accessRequestStatus, setAccessRequestStatus] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const router = useRouter();
  const pathname = usePathname();
  const currentLocale = (pathname.split('/')[1] as Locale) || 'ka';
  
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      full_name: "",
      company_slug: "",
      phone_number: "",
      about: "",
      existing_company_id: "",
    },
  });

  // Fetch approved companies when component mounts
  useEffect(() => {
    const checkAccessRequest = async () => {
      const supabase = createClient();
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Check user's role first - if not USER, redirect to dashboard
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile && profile.role !== 'USER') {
        // User already has a role, redirect to appropriate dashboard
        const roleRedirects: Record<string, string> = {
          'SUPER_ADMIN': `/${currentLocale}/admin`,
          'ADMIN': `/${currentLocale}/admin`,
          'SOLO_SPECIALIST': `/${currentLocale}/solo-specialist-dashboard`,
          'SPECIALIST': `/${currentLocale}/specialist-dashboard`,
          'COMPANY': `/${currentLocale}/company-dashboard`,
          'AUTHOR': `/${currentLocale}/author-dashboard`,
        };
        const redirectPath = roleRedirects[profile.role] || `/${currentLocale}`;
        router.push(redirectPath);
        return;
      }

      // Check if user has pending access request
      const { data: accessRequest } = await supabase
        .from('access_requests')
        .select('status, rejection_reason')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (accessRequest) {
        setAccessRequestStatus(accessRequest.status as 'PENDING' | 'APPROVED' | 'REJECTED');
        setRejectionReason(accessRequest.rejection_reason);
        
        if (accessRequest.status === 'APPROVED') {
          // Should have been updated already, but redirect just in case
          router.push(`/${currentLocale}`);
          return;
        }
      }

      setLoading(false);
    };

    const fetchCompanies = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, company_slug')
        .eq('role', 'COMPANY')
        .not('company_slug', 'is', null)
        .order('full_name', { ascending: true });

      if (error) {
        console.error('Error fetching companies:', error);
      } else {
        setCompanies(data || []);
      }
    };

    checkAccessRequest();
    fetchCompanies();
  }, [router, currentLocale]);

  // Auto-generate slug from company name (same logic as admin panel)
  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')        // Replace spaces with -
      .replace(/[^\w\u10A0-\u10FF\-]/g, '') // Keep letters (including Georgian), numbers, and -
      .replace(/\-\-+/g, '-')      // Replace multiple - with single -
      .replace(/^-+/, '')          // Trim - from start
      .replace(/-+$/, '')          // Trim - from end
  }

  const onSubmit = async (data: z.infer<typeof FormSchema>) => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      // If specialist is joining an existing company
      if (requestType === 'specialist' && selectedCompanyId) {
        // Get the selected company's details
        const selectedCompany = companies.find(c => c.id === selectedCompanyId);
        
        if (!selectedCompany) {
          alert("შეცდომა: არჩეული კომპანია ვერ მოიძებნა");
          return;
        }
        
        console.log("Submitting specialist request for company:", selectedCompany);
        
        // Create access request as SPECIALIST with company_id reference
        const { error: requestError } = await supabase
          .from("access_requests")
          .insert({
            user_id: user.id,
            request_type: 'SPECIALIST',
            full_name: selectedCompany.full_name,
            company_slug: selectedCompany.company_slug,
            company_id: selectedCompanyId, // Link to company for dual approval
            phone_number: data.phone_number,
            about: data.about,
            status: 'PENDING'
          });

        if (requestError) {
          console.error("Error creating access request:", requestError);
          alert(`შეცდომა მოთხოვნის გაგზავნისას: ${requestError.message}`);
        } else {
          console.log("Request created successfully!");
          alert("თქვენი მოთხოვნა წარმატებით გაიგზავნა! კომპანიასა და ადმინისტრატორს გადაეცა განსახილველად.");
          window.location.href = "/";
        }
      } 
      // Solo Specialist - Create access request for admin approval
      else if (requestType === 'specialist' && !selectedCompanyId) {
        // Validate full_name
        if (!data.full_name || data.full_name.trim() === '') {
          alert("გთხოვთ შეავსოთ სახელი");
          return;
        }
        
        console.log("Submitting solo specialist request for admin approval");
        
        // Create access request for solo specialist
        const { error: requestError } = await supabase
          .from("access_requests")
          .insert({
            user_id: user.id,
            request_type: 'SOLO_SPECIALIST',
            full_name: data.full_name,
            phone_number: data.phone_number,
            about: data.about,
            status: 'PENDING'
          });

        if (requestError) {
          console.error("Error creating access request:", requestError);
          alert(`შეცდომა მოთხოვნის გაგზავნისას: ${requestError.message}`);
        } else {
          console.log("Solo specialist request created successfully!");
          alert("თქვენი მოთხოვნა წარმატებით გაიგზავნა! ადმინისტრატორი განიხილავს მოთხოვნას და დაგიკავშირდებათ.");
          window.location.href = "/";
        }
      }
      // Company registration - requires admin approval
      else if (requestType === 'company') {
        // Validate full_name
        if (!data.full_name || data.full_name.trim() === '') {
          alert("გთხოვთ შეავსოთ კომპანიის სახელწოდება");
          return;
        }
        
        console.log("Submitting company request");
        
        // Auto-generate slug from company name
        const autoGeneratedSlug = generateSlug(data.full_name || '');

        // Create access request for company
        const { error: requestError } = await supabase
          .from("access_requests")
          .insert({
            user_id: user.id,
            request_type: 'COMPANY',
            full_name: data.full_name || '',
            company_slug: autoGeneratedSlug,
            phone_number: data.phone_number,
            about: data.about,
            status: 'PENDING'
          });

        if (requestError) {
          console.error("Error creating access request:", requestError);
          alert(`შეცდომა მოთხოვნის გაგზავნისას: ${requestError.message}`);
        } else {
          console.log("Company request created successfully!");
          alert("თქვენი მოთხოვნა წარმატებით გაიგზავნა! ადმინისტრატორი განიხილავს მოთხოვნას და დაგიკავშირდებათ.");
          window.location.href = "/";
        }
      }
    }
  };

  return (
    <div className="relative isolate flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <span className={`text-xs font-semibold uppercase tracking-[0.3em] transition-colors duration-300 ${isDark ? 'text-white' : 'text-black'}`}>
            LegalGE
          </span>
        </div>

        <div className={`rounded-3xl border p-8 transition-all duration-300 sm:p-10 ${isDark ? 'border-white/10 bg-black' : 'border-black/10 bg-white'}`}>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className={`h-8 w-8 animate-spin rounded-full border-2 border-t-transparent ${isDark ? 'border-white' : 'border-black'}`}></div>
            </div>
          ) : accessRequestStatus === 'PENDING' ? (
            <div className="space-y-4 text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-yellow-500/20 flex items-center justify-center">
                <svg className="w-8 h-8 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className={`text-2xl font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
                მოთხოვნა განხილვაშია
              </h2>
              <p className={`text-sm ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                თქვენი მოთხოვნა ადმინისტრატორის განხილვაშია. მიიღებთ შეტყობინებას შედეგის შესახებ.
              </p>
            </div>
          ) : accessRequestStatus === 'REJECTED' ? (
            <div className="space-y-6">
              <div className="space-y-4 text-center">
                <div className="mx-auto w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
                  <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h2 className={`text-2xl font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
                  მოთხოვნა უარყოფილია
                </h2>
                {rejectionReason && (
                  <div className={`rounded-lg p-4 ${isDark ? 'bg-red-500/10' : 'bg-red-50'}`}>
                    <p className={`text-sm ${isDark ? 'text-red-400' : 'text-red-700'}`}>
                      <strong>მიზეზი:</strong> {rejectionReason}
                    </p>
                  </div>
                )}
                <p className={`text-sm ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                  შეგიძლიათ ხელახლა შეავსოთ ფორმა და გაგზავნოთ ახალი მოთხოვნა.
                </p>
              </div>

              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="text-center space-y-2">
                  <p className={`text-sm ${isDark ? 'text-white/80' : 'text-black/80'}`}>
                    თქვენ შეგიძლიათ შეავსოთ ფორმა თავიდან
                  </p>
                </div>
                {/* TODO: Add form fields here */}
              </form>
            </div>
          ) : (
            <>
              <div className="space-y-2 text-center">
                <h1 className={`text-[30px] font-semibold transition-all duration-300 ${isDark ? 'text-white' : 'text-black'}`}>
                  Complete Your Profile
                </h1>
                <p className={`text-sm ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                  Fill out the form below to request specialist or company access
                </p>
              </div>

              <form onSubmit={form.handleSubmit(onSubmit)} className="mt-8 space-y-6">
                {/* TODO: Add form fields here - same as REJECTED state */}
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
