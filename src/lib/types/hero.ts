export interface HeroSlide {
  id: string;
  image_url_light: string;
  image_url_dark: string;
  title_ka: string;
  title_en: string;
  title_ru: string;
  description_ka?: string;
  description_en?: string;
  description_ru?: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Relations
  buttons?: HeroSlideButton[];
}

export interface HeroSlideButton {
  id: string;
  slide_id: string;
  text_ka: string;
  text_en: string;
  text_ru: string;
  action_type: 'link' | 'contact' | 'specialist' | 'practice' | 'company';
  action_url?: string;
  specialist_id?: string;
  practice_id?: string;
  company_id?: string;
  open_in_new_tab: boolean;
  variant: 'primary' | 'secondary' | 'outline';
  display_order: number;
  created_at: string;
}

export type HeroSlideFormData = Omit<HeroSlide, 'id' | 'created_at' | 'updated_at' | 'buttons'>;
export type HeroButtonFormData = Omit<HeroSlideButton, 'id' | 'slide_id' | 'created_at'>;
