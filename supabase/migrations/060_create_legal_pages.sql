-- ============================================
-- Migration 060: Legal Pages System
-- Description: Create tables for dynamic Privacy, Terms, and Cookies pages
-- Date: 2025-11-26
-- ============================================

-- ============================================
-- PART 1: CREATE TABLES
-- ============================================

-- Main legal pages table (3 fixed pages: privacy, terms, cookies)
CREATE TABLE IF NOT EXISTS legal_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_type TEXT UNIQUE NOT NULL CHECK (page_type IN ('privacy', 'terms', 'cookies')),
  icon TEXT DEFAULT 'FileText',
  status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'published')),
  updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Translations for legal pages (3 languages per page)
CREATE TABLE IF NOT EXISTS legal_page_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  legal_page_id UUID NOT NULL REFERENCES legal_pages(id) ON DELETE CASCADE,
  language TEXT NOT NULL CHECK (language IN ('ka', 'en', 'ru')),
  title TEXT NOT NULL,
  intro TEXT,
  content JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(legal_page_id, language)
);

-- ============================================
-- PART 2: CREATE INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_legal_pages_page_type ON legal_pages(page_type);
CREATE INDEX IF NOT EXISTS idx_legal_pages_status ON legal_pages(status);
CREATE INDEX IF NOT EXISTS idx_legal_page_translations_page_id ON legal_page_translations(legal_page_id);
CREATE INDEX IF NOT EXISTS idx_legal_page_translations_language ON legal_page_translations(language);
CREATE INDEX IF NOT EXISTS idx_legal_page_translations_page_lang ON legal_page_translations(legal_page_id, language);

-- ============================================
-- PART 3: ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE legal_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE legal_page_translations ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PART 4: RLS POLICIES FOR legal_pages
-- ============================================

-- Public can read published legal pages
CREATE POLICY "Public can read published legal pages"
ON legal_pages FOR SELECT
USING (status = 'published');

-- Super Admin can read all legal pages (including drafts)
CREATE POLICY "Super Admin can read all legal pages"
ON legal_pages FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = (SELECT auth.uid()) 
    AND role = 'SUPER_ADMIN'
  )
);

-- Super Admin can insert legal pages
CREATE POLICY "Super Admin can insert legal pages"
ON legal_pages FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = (SELECT auth.uid()) 
    AND role = 'SUPER_ADMIN'
  )
);

-- Super Admin can update legal pages
CREATE POLICY "Super Admin can update legal pages"
ON legal_pages FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = (SELECT auth.uid()) 
    AND role = 'SUPER_ADMIN'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = (SELECT auth.uid()) 
    AND role = 'SUPER_ADMIN'
  )
);

-- Super Admin can delete legal pages
CREATE POLICY "Super Admin can delete legal pages"
ON legal_pages FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = (SELECT auth.uid()) 
    AND role = 'SUPER_ADMIN'
  )
);

-- ============================================
-- PART 5: RLS POLICIES FOR legal_page_translations
-- ============================================

-- Public can read translations of published pages
CREATE POLICY "Public can read published legal page translations"
ON legal_page_translations FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM legal_pages 
    WHERE legal_pages.id = legal_page_translations.legal_page_id 
    AND legal_pages.status = 'published'
  )
);

-- Super Admin can read all translations
CREATE POLICY "Super Admin can read all legal page translations"
ON legal_page_translations FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = (SELECT auth.uid()) 
    AND role = 'SUPER_ADMIN'
  )
);

-- Super Admin can insert translations
CREATE POLICY "Super Admin can insert legal page translations"
ON legal_page_translations FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = (SELECT auth.uid()) 
    AND role = 'SUPER_ADMIN'
  )
);

-- Super Admin can update translations
CREATE POLICY "Super Admin can update legal page translations"
ON legal_page_translations FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = (SELECT auth.uid()) 
    AND role = 'SUPER_ADMIN'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = (SELECT auth.uid()) 
    AND role = 'SUPER_ADMIN'
  )
);

-- Super Admin can delete translations
CREATE POLICY "Super Admin can delete legal page translations"
ON legal_page_translations FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = (SELECT auth.uid()) 
    AND role = 'SUPER_ADMIN'
  )
);

-- ============================================
-- PART 6: AUTO UPDATE TIMESTAMP TRIGGER
-- ============================================

-- Trigger function for updating updated_at
CREATE OR REPLACE FUNCTION update_legal_pages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to legal_pages
DROP TRIGGER IF EXISTS trigger_legal_pages_updated_at ON legal_pages;
CREATE TRIGGER trigger_legal_pages_updated_at
BEFORE UPDATE ON legal_pages
FOR EACH ROW
EXECUTE FUNCTION update_legal_pages_updated_at();

-- Apply trigger to legal_page_translations
DROP TRIGGER IF EXISTS trigger_legal_page_translations_updated_at ON legal_page_translations;
CREATE TRIGGER trigger_legal_page_translations_updated_at
BEFORE UPDATE ON legal_page_translations
FOR EACH ROW
EXECUTE FUNCTION update_legal_pages_updated_at();

-- ============================================
-- PART 7: SEED DATA - INSERT 3 LEGAL PAGES
-- ============================================

-- Insert the 3 legal pages
INSERT INTO legal_pages (page_type, icon, status) VALUES
  ('privacy', 'Shield', 'published'),
  ('terms', 'FileText', 'published'),
  ('cookies', 'Cookie', 'published')
ON CONFLICT (page_type) DO NOTHING;

-- ============================================
-- PART 8: SEED TRANSLATIONS - PRIVACY PAGE
-- ============================================

-- Get privacy page ID and insert translations
DO $$
DECLARE
  privacy_id UUID;
  terms_id UUID;
  cookies_id UUID;
BEGIN
  -- Get page IDs
  SELECT id INTO privacy_id FROM legal_pages WHERE page_type = 'privacy';
  SELECT id INTO terms_id FROM legal_pages WHERE page_type = 'terms';
  SELECT id INTO cookies_id FROM legal_pages WHERE page_type = 'cookies';

  -- ========== PRIVACY PAGE TRANSLATIONS ==========
  
  -- Georgian
  INSERT INTO legal_page_translations (legal_page_id, language, title, intro, content)
  VALUES (
    privacy_id,
    'ka',
    'კონფიდენციალურობის პოლიტიკა',
    'LegalGE ყურადღებით ეკიდება თქვენი პირადი ინფორმაციის დაცვას და კონფიდენციალურობას. ეს პოლიტიკა განმარტავს როგორ ვაგროვებთ, ვიყენებთ და ვიცავთ თქვენს მონაცემებს.',
    '[
      {"id": "intro", "title": "1. შესავალი", "content": "ეს კონფიდენციალურობის პოლიტიკა განმარტავს თუ როგორ აგროვებს, იყენებს და იცავს LegalGE თქვენს პერსონალურ ინფორმაციას. ჩვენი პლატფორმის გამოყენებით, თქვენ ეთანხმებით ამ პოლიტიკაში აღწერილ პრაქტიკებს."},
      {"id": "collection", "title": "2. ინფორმაციის შეგროვება", "content": "ჩვენ ვაგროვებთ ინფორმაციას, რომელსაც თქვენ გვაწვდით რეგისტრაციისას ან ჩვენი სერვისების გამოყენებისას. ეს მოიცავს: სახელს და გვარს, ელექტრონული ფოსტის მისამართს, ტელეფონის ნომერს, კომპანიის ინფორმაციას (თუ გამოიყენება), და სხვა რელევანტურ პროფესიულ ინფორმაციას."},
      {"id": "usage", "title": "3. ინფორმაციის გამოყენება", "content": "თქვენი პერსონალური ინფორმაცია გამოიყენება შემდეგი მიზნებისთვის: სერვისების უზრუნველსაყოფად და გასაუმჯობესებლად, მომხმარებლებთან კომუნიკაციისთვის, პლატფორმის უსაფრთხოების უზრუნველსაყოფად, იურიდიული მოთხოვნების დასაკმაყოფილებლად, და პერსონალიზებული გამოცდილების შესაქმნელად."},
      {"id": "protection", "title": "4. მონაცემთა დაცვა", "content": "ჩვენ ვიყენებთ ინდუსტრიის სტანდარტულ უსაფრთხოების ზომებს თქვენი პერსონალური ინფორმაციის დასაცავად, მათ შორის: დაშიფვრას (SSL/TLS), უსაფრთხო სერვერებს, წვდომის კონტროლს, რეგულარულ უსაფრთხოების აუდიტს, და პერსონალის ტრენინგს მონაცემთა დაცვის საკითხებში."},
      {"id": "cookies", "title": "5. ქუქი-ფაილები", "content": "ჩვენი ვებსაიტი იყენებს ქუქი-ფაილებს მომხმარებლის გამოცდილების გასაუმჯობესებლად. ქუქი-ფაილები გამოიყენება სესიის მართვისთვის, თქვენი პარამეტრების დასამახსოვრებლად, ანალიტიკის მიზნებისთვის, და საიტის ფუნქციონალობის უზრუნველსაყოფად."},
      {"id": "sharing", "title": "6. ინფორმაციის გაზიარება", "content": "ჩვენ არ ვყიდით, არ ვაქირავებთ და არ ვაცვლით თქვენს პირად ინფორმაციას მესამე მხარეებთან. ინფორმაცია შეიძლება გაიზიაროს მხოლოდ: თქვენი თანხმობით, სერვის პროვაიდერებთან (რომლებიც ვალდებულნი არიან დაიცვან კონფიდენციალურობა), იურიდიული მოთხოვნების შესაბამისად, ან პლატფორმის უსაფრთხოების დასაცავად."},
      {"id": "rights", "title": "7. თქვენი უფლებები", "content": "თქვენ გაქვთ უფლება: წვდომა იქონიოთ თქვენს პერსონალურ ინფორმაციაზე, გამოასწოროთ არასწორი ინფორმაცია, მოითხოვოთ თქვენი მონაცემების წაშლა, შეაჩეროთ ინფორმაციის დამუშავება, გადმოიტანოთ თქვენი მონაცემები, და გააუქმოთ თანხმობა ნებისმიერ დროს."},
      {"id": "contact", "title": "8. კონტაქტი", "content": "თუ გაქვთ კითხვები ამ პოლიტიკასთან დაკავშირებით ან გსურთ განახორციელოთ თქვენი უფლებები, გთხოვთ დაგვიკავშირდეთ: ელ. ფოსტა info@legal.ge"}
    ]'::jsonb
  ) ON CONFLICT (legal_page_id, language) DO UPDATE SET
    title = EXCLUDED.title,
    intro = EXCLUDED.intro,
    content = EXCLUDED.content,
    updated_at = NOW();

  -- English
  INSERT INTO legal_page_translations (legal_page_id, language, title, intro, content)
  VALUES (
    privacy_id,
    'en',
    'Privacy Policy',
    'LegalGE is committed to protecting your personal information and privacy. This policy explains how we collect, use, and safeguard your data.',
    '[
      {"id": "intro", "title": "1. Introduction", "content": "This Privacy Policy explains how LegalGE collects, uses, and protects your personal information. By using our platform, you agree to the practices described in this policy."},
      {"id": "collection", "title": "2. Information Collection", "content": "We collect information you provide during registration or when using our services. This includes: full name, email address, phone number, company information (if applicable), and other relevant professional information."},
      {"id": "usage", "title": "3. Use of Information", "content": "Your personal information is used for: providing and improving services, communicating with users, maintaining platform security, complying with legal requirements, and creating personalized experiences."},
      {"id": "protection", "title": "4. Data Protection", "content": "We use industry-standard security measures to protect your personal information, including: encryption (SSL/TLS), secure servers, access controls, regular security audits, and staff training on data protection."},
      {"id": "cookies", "title": "5. Cookies", "content": "Our website uses cookies to enhance user experience. Cookies are used for session management, remembering your preferences, analytics purposes, and ensuring site functionality."},
      {"id": "sharing", "title": "6. Information Sharing", "content": "We do not sell, rent, or trade your personal information with third parties. Information may only be shared: with your consent, with service providers (who are obligated to maintain confidentiality), as required by law, or to protect platform security."},
      {"id": "rights", "title": "7. Your Rights", "content": "You have the right to: access your personal information, correct inaccurate information, request deletion of your data, stop information processing, transfer your data, and withdraw consent at any time."},
      {"id": "contact", "title": "8. Contact", "content": "If you have questions about this policy or wish to exercise your rights, please contact us: Email info@legal.ge"}
    ]'::jsonb
  ) ON CONFLICT (legal_page_id, language) DO UPDATE SET
    title = EXCLUDED.title,
    intro = EXCLUDED.intro,
    content = EXCLUDED.content,
    updated_at = NOW();

  -- Russian
  INSERT INTO legal_page_translations (legal_page_id, language, title, intro, content)
  VALUES (
    privacy_id,
    'ru',
    'Политика конфиденциальности',
    'LegalGE заботится о защите вашей личной информации и конфиденциальности. Эта политика объясняет, как мы собираем, используем и защищаем ваши данные.',
    '[
      {"id": "intro", "title": "1. Введение", "content": "Эта Политика конфиденциальности объясняет, как LegalGE собирает, использует и защищает вашу личную информацию. Используя нашу платформу, вы соглашаетесь с практиками, описанными в этой политике."},
      {"id": "collection", "title": "2. Сбор информации", "content": "Мы собираем информацию, которую вы предоставляете при регистрации или использовании наших услуг. Это включает: полное имя, адрес электронной почты, номер телефона, информацию о компании (если применимо) и другую релевантную профессиональную информацию."},
      {"id": "usage", "title": "3. Использование информации", "content": "Ваша личная информация используется для: предоставления и улучшения услуг, общения с пользователями, обеспечения безопасности платформы, соблюдения юридических требований и создания персонализированного опыта."},
      {"id": "protection", "title": "4. Защита данных", "content": "Мы используем стандартные отраслевые меры безопасности для защиты вашей личной информации, включая: шифрование (SSL/TLS), защищенные серверы, контроль доступа, регулярные аудиты безопасности и обучение персонала по вопросам защиты данных."},
      {"id": "cookies", "title": "5. Файлы cookie", "content": "Наш веб-сайт использует файлы cookie для улучшения пользовательского опыта. Файлы cookie используются для управления сеансами, запоминания ваших предпочтений, аналитики и обеспечения функциональности сайта."},
      {"id": "sharing", "title": "6. Обмен информацией", "content": "Мы не продаем, не сдаем в аренду и не обмениваем вашу личную информацию с третьими лицами. Информация может быть передана только: с вашего согласия, поставщикам услуг (которые обязаны соблюдать конфиденциальность), по требованию закона или для защиты безопасности платформы."},
      {"id": "rights", "title": "7. Ваши права", "content": "Вы имеете право: получить доступ к вашей личной информации, исправить неточную информацию, запросить удаление ваших данных, остановить обработку информации, передать ваши данные и отозвать согласие в любое время."},
      {"id": "contact", "title": "8. Контакты", "content": "Если у вас есть вопросы об этой политике или вы хотите реализовать свои права, свяжитесь с нами: Email info@legal.ge"}
    ]'::jsonb
  ) ON CONFLICT (legal_page_id, language) DO UPDATE SET
    title = EXCLUDED.title,
    intro = EXCLUDED.intro,
    content = EXCLUDED.content,
    updated_at = NOW();

  -- ========== TERMS PAGE TRANSLATIONS ==========
  
  -- Georgian
  INSERT INTO legal_page_translations (legal_page_id, language, title, intro, content)
  VALUES (
    terms_id,
    'ka',
    'წესები და პირობები',
    'ეს დოკუმენტი განსაზღვრავს წესებსა და პირობებს LegalGE პლატფორმის გამოყენებისთვის. გთხოვთ, ყურადღებით წაიკითხოთ ეს ინფორმაცია.',
    '[
      {"id": "acceptance", "title": "1. მომსახურების პირობების მიღება", "content": "LegalGE პლატფორმის გამოყენებით, თქვენ ეთანხმებით ამ წესებსა და პირობებს. თუ არ ეთანხმებით, გთხოვთ არ გამოიყენოთ პლატფორმა. ეს პირობები წარმოადგენს იურიდიულ შეთანხმებას თქვენსა და LegalGE-ს შორის."},
      {"id": "services", "title": "2. სერვისების აღწერა", "content": "LegalGE არის ონლაინ პლატფორმა, რომელიც აკავშირებს იურიდიულ სპეციალისტებს და კომპანიებს კლიენტებთან. ჩვენ ვთავაზობთ ინფორმაციას პრაქტიკების, სპეციალისტებისა და სერვისების შესახებ. პლატფორმა არ არის იურიდიული სერვისის მიმწოდებელი და არ იღებს პასუხისმგებლობას კონსულტაციების შინაარსზე."},
      {"id": "responsibilities", "title": "3. მომხმარებლის პასუხისმგებლობები", "content": "მომხმარებლები ვალდებულნი არიან: უზრუნველყონ ზუსტი და განახლებული ინფორმაცია, დაიცვან სხვა მომხმარებლების უფლებები და კონფიდენციალურობა, არ გამოიყენონ პლატფორმა უკანონო ან არაეთიკური მიზნებისთვის, არ გაავრცელონ სპამი ან მავნე კონტენტი, და დაიცვან საავტორო უფლებები."},
      {"id": "ip", "title": "4. ინტელექტუალური საკუთრება", "content": "ყველა კონტენტი, ლოგო, დიზაინი და მასალები LegalGE პლატფორმაზე დაცულია საავტორო უფლებებით და არ შეიძლება გამოყენებულ იქნას ნებართვის გარეშე. მომხმარებლები ინარჩუნებენ უფლებებს თავიანთ კონტენტზე, მაგრამ აძლევენ LegalGE-ს ლიცენზიას მათ გამოსაყენებლად პლატფორმის მიზნებისთვის."},
      {"id": "liability", "title": "5. პასუხისმგებლობის შეზღუდვა", "content": "LegalGE არ არის პასუხისმგებელი: მესამე მხარის სერვისების ხარისხზე, ტრანზაქციებზე რომლებიც ხორციელდება პლატფორმის მეშვეობით, მომხმარებლების მიერ განთავსებული ინფორმაციის სიზუსტეზე, პირდაპირ, არაპირდაპირ ან შემთხვევით ზიანზე, და ტექნიკურ შეფერხებებზე ან სერვისის შეწყვეტაზე."},
      {"id": "termination", "title": "6. ანგარიშის შეწყვეტა", "content": "LegalGE იტოვებს უფლებას შეაჩეროს ან შეწყვიტოს ნებისმიერი მომხმარებლის ანგარიში წესების დარღვევის შემთხვევაში. მომხმარებლებს აქვთ უფლება ნებისმიერ დროს წაშალონ თავიანთი ანგარიში."},
      {"id": "changes", "title": "7. ცვლილებები", "content": "ჩვენ ვიტოვებთ უფლებას შევცვალოთ ეს წესები და პირობები ნებისმიერ დროს. ცვლილებები ძალაში შედის გამოქვეყნებისთანავე. გირჩევთ რეგულარულად შეამოწმოთ ეს გვერდი განახლებებისთვის."},
      {"id": "law", "title": "8. მოქმედი კანონმდებლობა", "content": "ეს წესები და პირობები რეგულირდება საქართველოს კანონმდებლობით. ნებისმიერი დავა უნდა გადაწყდეს საქართველოს სასამართლოებში."}
    ]'::jsonb
  ) ON CONFLICT (legal_page_id, language) DO UPDATE SET
    title = EXCLUDED.title,
    intro = EXCLUDED.intro,
    content = EXCLUDED.content,
    updated_at = NOW();

  -- English
  INSERT INTO legal_page_translations (legal_page_id, language, title, intro, content)
  VALUES (
    terms_id,
    'en',
    'Terms & Conditions',
    'This document sets forth the terms and conditions for using the LegalGE platform. Please read this information carefully.',
    '[
      {"id": "acceptance", "title": "1. Acceptance of Terms", "content": "By using the LegalGE platform, you agree to these terms and conditions. If you do not agree, please do not use the platform. These terms constitute a legal agreement between you and LegalGE."},
      {"id": "services", "title": "2. Service Description", "content": "LegalGE is an online platform that connects legal specialists and companies with clients. We provide information about practices, specialists, and services. The platform is not a legal service provider and assumes no responsibility for the content of consultations."},
      {"id": "responsibilities", "title": "3. User Responsibilities", "content": "Users are required to: provide accurate and updated information, respect other users'' rights and confidentiality, not use the platform for illegal or unethical purposes, not distribute spam or harmful content, and respect copyright."},
      {"id": "ip", "title": "4. Intellectual Property", "content": "All content, logos, designs, and materials on the LegalGE platform are protected by copyright and may not be used without permission. Users retain rights to their content but grant LegalGE a license to use it for platform purposes."},
      {"id": "liability", "title": "5. Limitation of Liability", "content": "LegalGE is not responsible for: the quality of third-party services, transactions conducted through the platform, accuracy of user-posted information, direct, indirect, or incidental damages, and technical interruptions or service cessation."},
      {"id": "termination", "title": "6. Account Termination", "content": "LegalGE reserves the right to suspend or terminate any user account in case of violation of rules. Users have the right to delete their account at any time."},
      {"id": "changes", "title": "7. Changes", "content": "We reserve the right to modify these terms and conditions at any time. Changes take effect upon publication. We recommend checking this page regularly for updates."},
      {"id": "law", "title": "8. Governing Law", "content": "These terms and conditions are governed by the laws of Georgia. Any disputes shall be resolved in the courts of Georgia."}
    ]'::jsonb
  ) ON CONFLICT (legal_page_id, language) DO UPDATE SET
    title = EXCLUDED.title,
    intro = EXCLUDED.intro,
    content = EXCLUDED.content,
    updated_at = NOW();

  -- Russian
  INSERT INTO legal_page_translations (legal_page_id, language, title, intro, content)
  VALUES (
    terms_id,
    'ru',
    'Условия использования',
    'Этот документ устанавливает условия использования платформы LegalGE. Пожалуйста, внимательно прочитайте эту информацию.',
    '[
      {"id": "acceptance", "title": "1. Принятие условий", "content": "Используя платформу LegalGE, вы соглашаетесь с этими условиями. Если вы не согласны, пожалуйста, не используйте платформу. Эти условия представляют собой юридическое соглашение между вами и LegalGE."},
      {"id": "services", "title": "2. Описание сервиса", "content": "LegalGE - это онлайн-платформа, которая соединяет юридических специалистов и компании с клиентами. Мы предоставляем информацию о практиках, специалистах и услугах. Платформа не является поставщиком юридических услуг и не несет ответственности за содержание консультаций."},
      {"id": "responsibilities", "title": "3. Обязанности пользователя", "content": "Пользователи обязаны: предоставлять точную и обновленную информацию, уважать права и конфиденциальность других пользователей, не использовать платформу в незаконных или неэтичных целях, не распространять спам или вредоносный контент, и соблюдать авторские права."},
      {"id": "ip", "title": "4. Интеллектуальная собственность", "content": "Весь контент, логотипы, дизайн и материалы на платформе LegalGE защищены авторским правом и не могут быть использованы без разрешения. Пользователи сохраняют права на свой контент, но предоставляют LegalGE лицензию на его использование для целей платформы."},
      {"id": "liability", "title": "5. Ограничение ответственности", "content": "LegalGE не несет ответственности за: качество услуг третьих лиц, транзакции, проводимые через платформу, точность информации, размещенной пользователями, прямой, косвенный или случайный ущерб, и технические перебои или прекращение обслуживания."},
      {"id": "termination", "title": "6. Прекращение учетной записи", "content": "LegalGE оставляет за собой право приостановить или прекратить любую учетную запись пользователя в случае нарушения правил. Пользователи имеют право удалить свою учетную запись в любое время."},
      {"id": "changes", "title": "7. Изменения", "content": "Мы оставляем за собой право изменять эти условия в любое время. Изменения вступают в силу после публикации. Мы рекомендуем регулярно проверять эту страницу на наличие обновлений."},
      {"id": "law", "title": "8. Применимое законодательство", "content": "Эти условия регулируются законодательством Грузии. Любые споры должны разрешаться в судах Грузии."}
    ]'::jsonb
  ) ON CONFLICT (legal_page_id, language) DO UPDATE SET
    title = EXCLUDED.title,
    intro = EXCLUDED.intro,
    content = EXCLUDED.content,
    updated_at = NOW();

  -- ========== COOKIES PAGE TRANSLATIONS ==========
  
  -- Georgian
  INSERT INTO legal_page_translations (legal_page_id, language, title, intro, content)
  VALUES (
    cookies_id,
    'ka',
    'ქუქი-ფაილების პოლიტიკა',
    'ეს დოკუმენტი აღწერს როგორ იყენებს LegalGE ქუქი-ფაილებს თქვენი გამოცდილების გასაუმჯობესებლად.',
    '[
      {"id": "what-are-cookies", "title": "1. რა არის ქუქი-ფაილები?", "content": "ქუქი-ფაილები არის მცირე ტექსტური ფაილები, რომლებიც ინახება თქვენს მოწყობილობაში, როდესაც იყენებთ ვებსაიტებს. ისინი ფართოდ გამოიყენება ვებსაიტების ეფექტურად მუშაობისთვის და მომხმარებლებისთვის უკეთესი გამოცდილების უზრუნველსაყოფად."},
      {"id": "cookie-types", "title": "2. რა სახის ქუქი-ფაილებს ვიყენებთ?", "content": "ჩვენ ვიყენებთ სამ ძირითად ტიპის ქუქი-ფაილებს: აუცილებელი ქუქი-ფაილები (საიტის ფუნქციონირებისთვის), ანალიტიკური ქუქი-ფაილები (მომხმარებელთა ქცევის შესასწავლად) და ფუნქციონალური ქუქი-ფაილები (თქვენი პრეფერენციების დასამახსოვრებლად)."},
      {"id": "essential-cookies", "title": "3. აუცილებელი ქუქი-ფაილები", "content": "ეს ქუქი-ფაილები აუცილებელია ვებსაიტის საბაზისო ფუნქციების მუშაობისთვის. ისინი მოიცავს ავტორიზაციის, უსაფრთხოების და ნავიგაციის ქუქი-ფაილებს. ამ ქუქი-ფაილების გარეშე ზოგიერთი სერვისი შეიძლება არ იმუშაოს სწორად."},
      {"id": "analytics-cookies", "title": "4. ანალიტიკური ქუქი-ფაილები", "content": "ანალიტიკური ქუქი-ფაილები გვეხმარება გავიგოთ როგორ იყენებენ მომხმარებლები ჩვენს ვებსაიტს. ეს ინფორმაცია დაგვეხმარება საიტის გაუმჯობესებაში და უკეთესი გამოცდილების შექმნაში."},
      {"id": "functional-cookies", "title": "5. ფუნქციონალური ქუქი-ფაილები", "content": "ფუნქციონალური ქუქი-ფაილები ინახავს თქვენს პრეფერენციებს, როგორიცაა ენის არჩევანი, თემის რეჟიმი (ღამის/დღის) და სხვა პერსონალიზებული პარამეტრები."},
      {"id": "third-party", "title": "6. მესამე მხარის ქუქი-ფაილები", "content": "ჩვენ შეიძლება გამოვიყენოთ მესამე მხარის სერვისები, როგორიცაა Google Analytics, რომლებიც ასევე აყენებენ საკუთარ ქუქი-ფაილებს. ეს ქუქი-ფაილები ექვემდებარება მათი შესაბამისი პოლიტიკების."},
      {"id": "cookie-management", "title": "7. ქუქი-ფაილების მართვა", "content": "თქვენ შეგიძლიათ მართოთ ან გამორთოთ ქუქი-ფაილები თქვენი ბრაუზერის პარამეტრებიდან. გთხოვთ გაითვალისწინოთ, რომ ქუქი-ფაილების გამორთვამ შეიძლება შეზღუდოს ზოგიერთი ფუნქციის ხელმისაწვდომობა."},
      {"id": "cookie-duration", "title": "8. ქუქი-ფაილების ხანგრძლივობა", "content": "ზოგიერთი ქუქი-ფაილი წაიშლება თქვენი სესიის დასრულებისთანავე (სესიის ქუქი-ფაილები), სხვები კი რჩება თქვენს მოწყობილობაზე გარკვეული დროის განმავლობაში (მუდმივი ქუქი-ფაილები)."},
      {"id": "updates", "title": "9. პოლიტიკის განახლებები", "content": "ჩვენ შეიძლება პერიოდულად განვაახლოთ ეს პოლიტიკა. ყველა ცვლილების შესახებ თქვენ შეიტყობთ ამ გვერდის განახლების თარიღის მეშვეობით."}
    ]'::jsonb
  ) ON CONFLICT (legal_page_id, language) DO UPDATE SET
    title = EXCLUDED.title,
    intro = EXCLUDED.intro,
    content = EXCLUDED.content,
    updated_at = NOW();

  -- English
  INSERT INTO legal_page_translations (legal_page_id, language, title, intro, content)
  VALUES (
    cookies_id,
    'en',
    'Cookie Policy',
    'This document describes how LegalGE uses cookies to improve your experience.',
    '[
      {"id": "what-are-cookies", "title": "1. What are Cookies?", "content": "Cookies are small text files stored on your device when you use websites. They are widely used to make websites work more efficiently and provide a better user experience."},
      {"id": "cookie-types", "title": "2. What Types of Cookies Do We Use?", "content": "We use three main types of cookies: essential cookies (for site functionality), analytics cookies (to understand user behavior), and functional cookies (to remember your preferences)."},
      {"id": "essential-cookies", "title": "3. Essential Cookies", "content": "These cookies are necessary for the basic functions of the website. They include authentication, security, and navigation cookies. Without these cookies, some services may not work properly."},
      {"id": "analytics-cookies", "title": "4. Analytics Cookies", "content": "Analytics cookies help us understand how users interact with our website. This information helps us improve the site and create a better experience."},
      {"id": "functional-cookies", "title": "5. Functional Cookies", "content": "Functional cookies store your preferences, such as language selection, theme mode (dark/light), and other personalized settings."},
      {"id": "third-party", "title": "6. Third-Party Cookies", "content": "We may use third-party services such as Google Analytics, which also set their own cookies. These cookies are subject to their respective policies."},
      {"id": "cookie-management", "title": "7. Cookie Management", "content": "You can manage or disable cookies from your browser settings. Please note that disabling cookies may limit the availability of some features."},
      {"id": "cookie-duration", "title": "8. Cookie Duration", "content": "Some cookies are deleted when you end your session (session cookies), while others remain on your device for a certain period (persistent cookies)."},
      {"id": "updates", "title": "9. Policy Updates", "content": "We may periodically update this policy. You will be notified of any changes through the update date on this page."}
    ]'::jsonb
  ) ON CONFLICT (legal_page_id, language) DO UPDATE SET
    title = EXCLUDED.title,
    intro = EXCLUDED.intro,
    content = EXCLUDED.content,
    updated_at = NOW();

  -- Russian
  INSERT INTO legal_page_translations (legal_page_id, language, title, intro, content)
  VALUES (
    cookies_id,
    'ru',
    'Политика использования файлов cookie',
    'Этот документ описывает, как LegalGE использует файлы cookie для улучшения вашего опыта.',
    '[
      {"id": "what-are-cookies", "title": "1. Что такое файлы cookie?", "content": "Файлы cookie - это небольшие текстовые файлы, которые сохраняются на вашем устройстве при использовании веб-сайтов. Они широко используются для более эффективной работы сайтов и предоставления лучшего пользовательского опыта."},
      {"id": "cookie-types", "title": "2. Какие типы файлов cookie мы используем?", "content": "Мы используем три основных типа файлов cookie: необходимые cookie (для функционирования сайта), аналитические cookie (для понимания поведения пользователей) и функциональные cookie (для запоминания ваших предпочтений)."},
      {"id": "essential-cookies", "title": "3. Необходимые файлы cookie", "content": "Эти файлы cookie необходимы для базовых функций веб-сайта. Они включают cookie авторизации, безопасности и навигации. Без этих файлов некоторые сервисы могут работать некорректно."},
      {"id": "analytics-cookies", "title": "4. Аналитические файлы cookie", "content": "Аналитические файлы cookie помогают нам понять, как пользователи взаимодействуют с нашим сайтом. Эта информация помогает нам улучшить сайт и создать лучший опыт."},
      {"id": "functional-cookies", "title": "5. Функциональные файлы cookie", "content": "Функциональные файлы cookie сохраняют ваши предпочтения, такие как выбор языка, режим темы (темная/светлая) и другие персонализированные настройки."},
      {"id": "third-party", "title": "6. Файлы cookie третьих сторон", "content": "Мы можем использовать сервисы третьих сторон, такие как Google Analytics, которые также устанавливают свои собственные файлы cookie. Эти файлы подчиняются их соответствующим политикам."},
      {"id": "cookie-management", "title": "7. Управление файлами cookie", "content": "Вы можете управлять или отключить файлы cookie в настройках вашего браузера. Обратите внимание, что отключение файлов cookie может ограничить доступность некоторых функций."},
      {"id": "cookie-duration", "title": "8. Продолжительность хранения файлов cookie", "content": "Некоторые файлы cookie удаляются после завершения вашей сессии (сеансовые cookie), в то время как другие остаются на вашем устройстве в течение определенного времени (постоянные cookie)."},
      {"id": "updates", "title": "9. Обновления политики", "content": "Мы можем периодически обновлять эту политику. Вы будете уведомлены о любых изменениях через дату обновления на этой странице."}
    ]'::jsonb
  ) ON CONFLICT (legal_page_id, language) DO UPDATE SET
    title = EXCLUDED.title,
    intro = EXCLUDED.intro,
    content = EXCLUDED.content,
    updated_at = NOW();

END $$;

-- ============================================
-- PART 9: ADD COMMENTS
-- ============================================

COMMENT ON TABLE legal_pages IS 'Stores the 3 legal pages: privacy, terms, cookies';
COMMENT ON TABLE legal_page_translations IS 'Translations for legal pages in ka, en, ru languages';
COMMENT ON COLUMN legal_page_translations.content IS 'JSON array of sections: [{id, title, content}, ...]';

-- ============================================
-- MIGRATION COMPLETE ✅
-- ============================================
-- Summary:
-- ✅ Created legal_pages table (3 rows: privacy, terms, cookies)
-- ✅ Created legal_page_translations table (9 rows: 3 pages × 3 languages)
-- ✅ Added indexes for performance
-- ✅ Enabled RLS on both tables
-- ✅ Created policies for public read access
-- ✅ Created policies for SUPER_ADMIN full access (SELECT, INSERT, UPDATE, DELETE)
-- ✅ Added auto-update timestamp triggers
-- ✅ Seeded all content in Georgian, English, and Russian
