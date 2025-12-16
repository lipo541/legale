// ============================================================================
// CompanyDetails Component - View Mode
// ============================================================================

import { memo } from 'react'
import { 
  Building2, 
  Mail, 
  Phone, 
  Globe, 
  MapPin,
  Facebook,
  Instagram,
  Linkedin,
  Twitter,
  FileText,
  Target,
  Lightbulb,
  History,
  Users,
  Calendar,
  Shield,
  Edit
} from 'lucide-react'
import type { CompanyProfile, City } from '../types'

interface CompanyDetailsProps {
  company: CompanyProfile
  cities: City[]
  onEdit: () => void
  isDark: boolean
}

function CompanyDetails({ company, cities, onEdit, isDark }: CompanyDetailsProps) {
  return (
    <div className={`rounded-xl border p-6 ${isDark ? 'border-white/10 bg-black' : 'border-black/10 bg-white'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-black'}`}>
          კომპანიის დეტალები
        </h3>
        <button
          onClick={onEdit}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 transition-colors ${
            isDark
              ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
              : 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20'
          }`}
        >
          <Edit className="h-4 w-4" />
          რედაქტირება
        </button>
      </div>

      <div className="space-y-8">
        {/* Logo & Basic Info */}
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
              ლოგო
            </label>
            <div className="flex items-center gap-4">
              <div className={`flex h-16 w-16 items-center justify-center rounded-full overflow-hidden ${isDark ? 'bg-white/10' : 'bg-black/10'}`}>
                {company.logo_url ? (
                  <img src={company.logo_url} alt={company.full_name || 'Company'} className="h-full w-full object-cover" />
                ) : (
                  <Building2 className={`h-8 w-8 ${isDark ? 'text-white/60' : 'text-black/60'}`} />
                )}
              </div>
              <p className={`text-sm ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                {company.logo_url ? 'ლოგო ატვირთულია' : 'ლოგო არ არის'}
              </p>
            </div>
          </div>

          <div>
            <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
              კომპანიის სახელი
            </label>
            <p className={`font-medium ${isDark ? 'text-white' : 'text-black'}`}>
              {company.full_name || 'N/A'}
            </p>
          </div>

          <div>
            <label className={`mb-2 flex items-center gap-2 text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
              <Mail className="h-4 w-4" />
              ელფოსტა
            </label>
            <p className={`font-medium ${isDark ? 'text-white' : 'text-black'}`}>
              {company.email || 'N/A'}
            </p>
          </div>

          <div>
            <label className={`mb-2 flex items-center gap-2 text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
              <Phone className="h-4 w-4" />
              ტელეფონი
            </label>
            <p className={`font-medium ${isDark ? 'text-white' : 'text-black'}`}>
              {company.phone_number || 'N/A'}
            </p>
          </div>

          <div>
            <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
              Slug (URL სახელი)
            </label>
            <p className={`font-medium ${isDark ? 'text-white' : 'text-black'}`}>
              {company.company_slug || 'N/A'}
            </p>
            {company.company_slug && (
              <p className={`mt-1 text-xs ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                URL: /practices/{company.company_slug}
              </p>
            )}
          </div>
        </div>

        {/* Company Overview Section */}
        <div>
          <h4 className={`mb-4 text-sm font-bold ${isDark ? 'text-white' : 'text-black'}`}>
            კომპანიის შესახებ
          </h4>
          <div className="grid gap-4">
            <div>
              <label className={`mb-2 flex items-center gap-2 text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                <FileText className="h-4 w-4" />
                მოკლე აღწერა
              </label>
              <p className={`text-sm ${isDark ? 'text-white/80' : 'text-black/80'}`}>
                {company.summary || 'N/A'}
              </p>
            </div>

            <div>
              <label className={`mb-2 flex items-center gap-2 text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                <Building2 className="h-4 w-4" />
                დეტალური აღწერა
              </label>
              <p className={`text-sm whitespace-pre-wrap ${isDark ? 'text-white/80' : 'text-black/80'}`}>
                {company.company_overview || 'N/A'}
              </p>
            </div>

            <div>
              <label className={`mb-2 flex items-center gap-2 text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                <Target className="h-4 w-4" />
                მისია
              </label>
              <p className={`text-sm whitespace-pre-wrap ${isDark ? 'text-white/80' : 'text-black/80'}`}>
                {company.mission_statement || 'N/A'}
              </p>
            </div>

            <div>
              <label className={`mb-2 flex items-center gap-2 text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                <Lightbulb className="h-4 w-4" />
                ხედვა და ღირებულებები
              </label>
              <p className={`text-sm whitespace-pre-wrap ${isDark ? 'text-white/80' : 'text-black/80'}`}>
                {company.vision_values || 'N/A'}
              </p>
            </div>

            <div>
              <label className={`mb-2 flex items-center gap-2 text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                <History className="h-4 w-4" />
                ისტორია
              </label>
              <p className={`text-sm whitespace-pre-wrap ${isDark ? 'text-white/80' : 'text-black/80'}`}>
                {company.history || 'N/A'}
              </p>
            </div>

            <div>
              <label className={`mb-2 flex items-center gap-2 text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                <Users className="h-4 w-4" />
                როგორ ვმუშაობთ
              </label>
              <p className={`text-sm whitespace-pre-wrap ${isDark ? 'text-white/80' : 'text-black/80'}`}>
                {company.how_we_work || 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div>
          <h4 className={`mb-4 text-sm font-bold ${isDark ? 'text-white' : 'text-black'}`}>
            საკონტაქტო ინფორმაცია
          </h4>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={`mb-2 flex items-center gap-2 text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                <Globe className="h-4 w-4" />
                ვებსაიტი
              </label>
              <p className={`font-medium ${isDark ? 'text-white' : 'text-black'}`}>
                {company.website ? (
                  <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                    {company.website}
                  </a>
                ) : 'N/A'}
              </p>
            </div>

            <div>
              <label className={`mb-2 flex items-center gap-2 text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                <MapPin className="h-4 w-4" />
                მისამართი
              </label>
              <p className={`font-medium ${isDark ? 'text-white' : 'text-black'}`}>
                {company.address || 'N/A'}
              </p>
            </div>

            <div className="sm:col-span-2">
              <label className={`mb-2 flex items-center gap-2 text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                <MapPin className="h-4 w-4" />
                რუკაზე
              </label>
              <p className={`font-medium ${isDark ? 'text-white' : 'text-black'}`}>
                {company.map_link ? (
                  <a href={company.map_link} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                    ნახეთ რუკაზე →
                  </a>
                ) : 'N/A'}
              </p>
            </div>

            {/* Cities */}
            <div className="sm:col-span-2">
              <label className={`mb-2 flex items-center gap-2 text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                <MapPin className="h-4 w-4" />
                ქალაქები
              </label>
              {cities.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {cities.map(city => (
                    <span
                      key={city.id}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                        isDark 
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                          : 'bg-emerald-500/20 text-emerald-600 border border-emerald-500/30'
                      }`}
                    >
                      {city.name_ka}
                    </span>
                  ))}
                </div>
              ) : (
                <p className={`text-sm ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                  არ არის მითითებული
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Social Links */}
        <div>
          <h4 className={`mb-4 text-sm font-bold ${isDark ? 'text-white' : 'text-black'}`}>
            სოციალური ქსელები
          </h4>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={`mb-2 flex items-center gap-2 text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                <Facebook className="h-4 w-4" />
                Facebook
              </label>
              {company.facebook_link ? (
                <a href={company.facebook_link} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline text-sm">
                  {company.facebook_link}
                </a>
              ) : (
                <p className={`text-sm ${isDark ? 'text-white/60' : 'text-black/60'}`}>N/A</p>
              )}
            </div>

            <div>
              <label className={`mb-2 flex items-center gap-2 text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                <Instagram className="h-4 w-4" />
                Instagram
              </label>
              {company.instagram_link ? (
                <a href={company.instagram_link} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline text-sm">
                  {company.instagram_link}
                </a>
              ) : (
                <p className={`text-sm ${isDark ? 'text-white/60' : 'text-black/60'}`}>N/A</p>
              )}
            </div>

            <div>
              <label className={`mb-2 flex items-center gap-2 text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                <Linkedin className="h-4 w-4" />
                LinkedIn
              </label>
              {company.linkedin_link ? (
                <a href={company.linkedin_link} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline text-sm">
                  {company.linkedin_link}
                </a>
              ) : (
                <p className={`text-sm ${isDark ? 'text-white/60' : 'text-black/60'}`}>N/A</p>
              )}
            </div>

            <div>
              <label className={`mb-2 flex items-center gap-2 text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                <Twitter className="h-4 w-4" />
                Twitter
              </label>
              {company.twitter_link ? (
                <a href={company.twitter_link} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline text-sm">
                  {company.twitter_link}
                </a>
              ) : (
                <p className={`text-sm ${isDark ? 'text-white/60' : 'text-black/60'}`}>N/A</p>
              )}
            </div>
          </div>
        </div>

        {/* System Info */}
        <div className={`pt-4 border-t ${isDark ? 'border-white/10' : 'border-black/10'}`}>
          <h4 className={`mb-4 text-sm font-bold ${isDark ? 'text-white' : 'text-black'}`}>
            სისტემური ინფორმაცია
          </h4>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={`mb-2 flex items-center gap-2 text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                <Shield className="h-4 w-4" />
                როლი
              </label>
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium ${isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-500/10 text-green-600'}`}>
                კომპანია
              </span>
            </div>

            <div>
              <label className={`mb-2 flex items-center gap-2 text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                <Calendar className="h-4 w-4" />
                რეგისტრაცია
              </label>
              <p className={`font-medium ${isDark ? 'text-white' : 'text-black'}`}>
                {new Date(company.created_at).toLocaleString('ka-GE')}
              </p>
            </div>

            <div>
              <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                ბოლო განახლება
              </label>
              <p className={`font-medium ${isDark ? 'text-white' : 'text-black'}`}>
                {new Date(company.updated_at).toLocaleString('ka-GE')}
              </p>
            </div>

            <div>
              <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                Company ID
              </label>
              <p className={`font-mono text-xs ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                {company.id}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default memo(CompanyDetails)
