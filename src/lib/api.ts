import axios from 'axios';

export const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
export const B2C_URL = process.env.NEXT_PUBLIC_B2C_URL || 'http://localhost:3002';

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
});

export interface Agency {
  id: number;
  name: string;
  slug: string;
  phone?: string;
  telegram_username?: string;
  instagram_username?: string;
  website_url?: string;
  description?: string;
  logo_url?: string;
  is_verified: boolean;
  rating: number;
  review_count: number;
  tours_count?: number;
  bookings_count?: number;
}

export interface Tour {
  id: number;
  title?: string;
  destination_country?: string;
  destination_city?: string;
  category: string;
  meal_type: string;
  hotel_name?: string;
  hotel_stars?: number;
  price_usd?: number;
  price_uzs?: number;
  nights?: number;
  departure_date?: string;
  return_date?: string;
  departure_city: string;
  description?: string;
  photos?: string[];
  is_hot: boolean;
  is_active: boolean;
  source_type: string;
  source_url?: string;
  views_count: number;
  agency: Agency;
  created_at: string;
}

export interface Booking {
  id: number;
  tour_id: number;
  agency_id: number;
  client_name: string;
  client_phone: string;
  preferred_channel: string;
  travelers_count: number;
  total_price_usd?: number;
  status: 'new' | 'contacted' | 'confirmed' | 'paid' | 'cancelled';
  comment?: string;
  manager_notes?: string;
  created_at: string;
  updated_at: string;
  tour?: Tour;
}

export interface CRMOverview {
  tours_total: number;
  tours_active: number;
  tours_hot: number;
  total_views: number;
  bookings_total: number;
  bookings_by_status: {
    new: number;
    contacted: number;
    confirmed: number;
    paid: number;
    cancelled: number;
  };
  revenue_confirmed_usd: number;
  pipeline_value_usd: number;
  recent_bookings: Booking[];
  top_tours: Tour[];
}

export interface TourCreateInput {
  agency_id: number;
  title: string;
  destination_country: string;
  destination_city: string;
  category: string;
  meal_type: string;
  hotel_name?: string;
  hotel_stars: number;
  price_usd: number;
  nights: number;
  departure_city: string;
  departure_date?: string;
  description?: string;
  photo_url?: string;
  is_hot: boolean;
  is_active: boolean;
}

export const crmApi = {
  overview: (agencyId?: number | null) =>
    api
      .get<CRMOverview>('/crm/overview', { params: agencyId ? { agency_id: agencyId } : {} })
      .then((r) => r.data),

  agencies: () => api.get<Agency[]>('/crm/agencies').then((r) => r.data),

  updateAgency: (agencyId: number, data: Partial<Agency>) =>
    api.patch<Agency>(`/crm/agencies/${agencyId}`, data).then((r) => r.data),

  bookings: (params: { agency_id?: number | null; status?: string; q?: string } = {}) =>
    api
      .get<Booking[]>('/crm/bookings', {
        params: {
          ...(params.agency_id ? { agency_id: params.agency_id } : {}),
          ...(params.status ? { status: params.status } : {}),
          ...(params.q ? { q: params.q } : {}),
        },
      })
      .then((r) => r.data),

  updateBooking: (
    bookingId: number,
    data: { status?: string; manager_notes?: string; travelers_count?: number }
  ) => api.patch<Booking>(`/crm/bookings/${bookingId}`, data).then((r) => r.data),

  deleteBooking: (bookingId: number) =>
    api.delete(`/crm/bookings/${bookingId}`).then((r) => r.data),

  tours: (
    params: {
      agency_id?: number | null;
      is_active?: boolean;
      is_hot?: boolean;
      q?: string;
      page?: number;
      size?: number;
    } = {}
  ) =>
    api
      .get<{ items: Tour[]; total: number; page: number; size: number; pages: number }>(
        '/crm/tours',
        {
          params: {
            ...(params.agency_id ? { agency_id: params.agency_id } : {}),
            ...(params.is_active !== undefined ? { is_active: params.is_active } : {}),
            ...(params.is_hot !== undefined ? { is_hot: params.is_hot } : {}),
            ...(params.q ? { q: params.q } : {}),
            page: params.page || 1,
            size: params.size || 24,
          },
        }
      )
      .then((r) => r.data),

  createTour: (data: TourCreateInput) =>
    api.post<Tour>('/crm/tours', data).then((r) => r.data),

  updateTour: (tourId: number, data: Partial<TourCreateInput>) =>
    api.patch<Tour>(`/crm/tours/${tourId}`, data).then((r) => r.data),

  deleteTour: (tourId: number) =>
    api.delete(`/crm/tours/${tourId}`).then((r) => r.data),

  telegramFeed: () =>
    api
      .get<{
        items: {
          id: number;
          booking_id: number;
          client_name: string;
          client_phone: string;
          tour_title: string;
          agency_name: string;
          total_price_usd: number;
          text: string;
          sent_at: string;
          delivered_to_telegram_api: boolean;
        }[];
      }>('/crm/telegram-feed')
      .then((r) => r.data.items),

  telegramTest: (payload: { bot_token?: string; chat_id?: string }) =>
    api.post('/crm/telegram-test', payload).then((r) => r.data),

  telegramCallbackSimulate: (bookingId: number, status: string) =>
    api
      .post('/crm/telegram-webhook', {
        callback_query: {
          data: `booking_status:${bookingId}:${status}`,
        },
      })
      .then((r) => r.data),
};

// ─── Reviews (модерация отзывов) ──────────────────────────────────────────────

export type ReviewSource = 'site' | 'telegram' | 'demo';
export type ReviewStatusFilter = 'all' | 'pending' | 'approved';

export interface Review {
  id: number;
  agency_id: number;
  tour_id?: number | null;
  author_name: string;
  rating: number;
  comment: string;
  source: ReviewSource;
  agency_reply?: string | null;
  is_approved: boolean;
  created_at: string;
  updated_at?: string;
  agency_name?: string | null;
  tour_title?: string | null;
}

export interface ReviewListCRM {
  items: Review[];
  counts: { all: number; pending: number; approved: number };
}

export const reviewsApi = {
  list: (
    params: {
      agency_id?: number | null;
      status?: ReviewStatusFilter;
      rating?: number | null;
      q?: string;
    } = {}
  ) =>
    api
      .get<ReviewListCRM>('/crm/reviews', {
        params: {
          ...(params.agency_id ? { agency_id: params.agency_id } : {}),
          ...(params.status && params.status !== 'all' ? { status: params.status } : {}),
          ...(params.rating ? { rating: params.rating } : {}),
          ...(params.q ? { q: params.q } : {}),
        },
      })
      .then((r) => r.data),

  update: (reviewId: number, data: { is_approved?: boolean; agency_reply?: string | null }) =>
    api.patch<Review>(`/crm/reviews/${reviewId}`, data).then((r) => r.data),

  remove: (reviewId: number) => api.delete(`/crm/reviews/${reviewId}`).then((r) => r.data),
};
