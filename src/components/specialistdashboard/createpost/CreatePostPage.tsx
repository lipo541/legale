'use client'

import { useTheme } from '@/contexts/ThemeContext'
import { FileText, Image, Send } from 'lucide-react'

export default function CreatePostPage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <div>
      <h1 className={`text-4xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>
        Create New Post
      </h1>
      <p className={`mt-2 text-lg ${isDark ? 'text-white/60' : 'text-black/60'}`}>
        გააზიარეთ თქვენი ექსპერტიზა და ცოდნა
      </p>

      <div className="mt-8 max-w-4xl">
        <div className={`rounded-xl border p-8 ${isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-white'}`}>
          <div className="space-y-6">
            {/* Title */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-black'}`}>
                <FileText className="inline w-4 h-4 mr-2" />
                Post Title
              </label>
              <input
                type="text"
                className={`w-full rounded-lg border px-4 py-3 transition-all ${
                  isDark
                    ? 'border-white/10 bg-black text-white placeholder:text-white/40 focus:border-white/30'
                    : 'border-black/10 bg-white text-black placeholder:text-black/40 focus:border-black/30'
                }`}
                placeholder="Enter post title..."
              />
            </div>

            {/* Featured Image */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-black'}`}>
                <Image className="inline w-4 h-4 mr-2" />
                Featured Image
              </label>
              <div className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
                isDark
                  ? 'border-white/10 hover:border-white/30 bg-white/5'
                  : 'border-black/10 hover:border-black/30 bg-black/5'
              }`}>
                <Image className={`w-12 h-12 mx-auto mb-4 ${isDark ? 'text-white/40' : 'text-black/40'}`} />
                <p className={`text-sm ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                  Click to upload or drag and drop
                </p>
                <p className={`text-xs mt-1 ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                  PNG, JPG, GIF up to 10MB
                </p>
              </div>
            </div>

            {/* Content */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-black'}`}>
                Content
              </label>
              <textarea
                rows={12}
                className={`w-full rounded-lg border px-4 py-3 transition-all resize-none ${
                  isDark
                    ? 'border-white/10 bg-black text-white placeholder:text-white/40 focus:border-white/30'
                    : 'border-black/10 bg-white text-black placeholder:text-black/40 focus:border-black/30'
                }`}
                placeholder="Write your post content here..."
              />
            </div>

            {/* Category */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-black'}`}>
                Category
              </label>
              <select
                className={`w-full rounded-lg border px-4 py-3 transition-all ${
                  isDark
                    ? 'border-white/10 bg-black text-white focus:border-white/30'
                    : 'border-black/10 bg-white text-black focus:border-black/30'
                }`}
              >
                <option value="">Select a category</option>
                <option value="legal-advice">Legal Advice</option>
                <option value="case-study">Case Study</option>
                <option value="news">Legal News</option>
                <option value="opinion">Opinion</option>
              </select>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <button
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                  isDark
                    ? 'bg-white/10 text-white hover:bg-white/20'
                    : 'bg-black/10 text-black hover:bg-black/20'
                }`}
              >
                Save as Draft
              </button>
              <button
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                  isDark
                    ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700'
                }`}
              >
                <Send className="w-5 h-5" />
                Publish Post
              </button>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className={`mt-6 rounded-xl border p-6 ${isDark ? 'border-blue-500/20 bg-blue-500/10' : 'border-blue-500/20 bg-blue-50'}`}>
          <h3 className={`font-semibold mb-2 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
            📝 Post Guidelines
          </h3>
          <ul className={`space-y-1 text-sm ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
            <li>• პოსტი უნდა იყოს ინფორმაციული და სასარგებლო</li>
            <li>• გამოიყენეთ მკაფიო და გასაგები ენა</li>
            <li>• დაამატეთ რელევანტური სურათები</li>
            <li>• არ დაუშვათ ორთოგრაფიული შეცდომები</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
