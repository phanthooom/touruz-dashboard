'use client';
import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Sparkles, Save } from 'lucide-react';
import { crmApi, type Tour, type TourCreateInput } from '../lib/api';
import { useAgency } from '../context/AgencyContext';

interface TourFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTour?: Tour | null;
}

export default function TourFormModal({
  isOpen,
  onClose,
  initialTour,
}: TourFormModalProps) {
  const queryClient = useQueryClient();
  const { agencies, selectedAgencyId } = useAgency();

  const [agencyId, setAgencyId] = useState<number>(1);
  const [title, setTitle] = useState('');
  const [country, setCountry] = useState('Turkey');
  const [city, setCity] = useState('Antalya');
  const [category, setCategory] = useState('beach');
  const [mealType, setMealType] = useState('AI');
  const [hotelName, setHotelName] = useState('');
  const [hotelStars, setHotelStars] = useState(5);
  const [priceUsd, setPriceUsd] = useState(650);
  const [nights, setNights] = useState(7);
  const [departureCity, setDepartureCity] = useState('Tashkent');
  const [photoUrl, setPhotoUrl] = useState('');
  const [description, setDescription] = useState('');
  const [isHot, setIsHot] = useState(false);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (initialTour) {
      setAgencyId(initialTour.agency.id);
      setTitle(initialTour.title || '');
      setCountry(initialTour.destination_country || 'Turkey');
      setCity(initialTour.destination_city || 'Antalya');
      setCategory(initialTour.category || 'beach');
      setMealType(initialTour.meal_type || 'AI');
      setHotelName(initialTour.hotel_name || '');
      setHotelStars(initialTour.hotel_stars || 5);
      setPriceUsd(initialTour.price_usd || 650);
      setNights(initialTour.nights || 7);
      setDepartureCity(initialTour.departure_city || 'Tashkent');
      setPhotoUrl(initialTour.photos?.[0] || '');
      setDescription(initialTour.description || '');
      setIsHot(initialTour.is_hot);
      setIsActive(initialTour.is_active);
    } else {
      setAgencyId(selectedAgencyId || agencies[0]?.id || 1);
      setTitle('');
      setCountry('Turkey');
      setCity('Antalya');
      setCategory('beach');
      setMealType('AI');
      setHotelName('');
      setHotelStars(5);
      setPriceUsd(650);
      setNights(7);
      setDepartureCity('Tashkent');
      setPhotoUrl('');
      setDescription('');
      setIsHot(true);
      setIsActive(true);
    }
  }, [initialTour, selectedAgencyId, agencies, isOpen]);

  const mutation = useMutation({
    mutationFn: async (payload: TourCreateInput) => {
      if (initialTour) {
        return crmApi.updateTour(initialTour.id, payload);
      }
      return crmApi.createTour(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-tours'] });
      queryClient.invalidateQueries({ queryKey: ['crm-overview'] });
      queryClient.invalidateQueries({ queryKey: ['crm-agencies'] });
      onClose();
    },
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({
      agency_id: agencyId,
      title: title.trim() || `Тур в ${city}, ${country}`,
      destination_country: country,
      destination_city: city,
      category,
      meal_type: mealType,
      hotel_name: hotelName,
      hotel_stars: Number(hotelStars),
      price_usd: Number(priceUsd),
      nights: Number(nights),
      departure_city: departureCity,
      photo_url: photoUrl,
      description,
      is_hot: isHot,
      is_active: isActive,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 my-8">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary-50 text-primary-500 flex items-center justify-center">
              <Sparkles size={18} />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">
                {initialTour ? 'Редактировать тур' : 'Опубликовать новый тур'}
              </h2>
              <p className="text-xs text-slate-400">
                Изменения мгновенно появятся на витрине TourUZ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 text-slate-400"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid sm:grid-cols-2 gap-3.5">
            <div>
              <label className="font-bold text-slate-600 block mb-1">Туроператор</label>
              <select
                value={agencyId}
                onChange={(e) => setAgencyId(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 bg-sand-50 font-semibold text-slate-800"
              >
                {agencies.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-600 block mb-1">Город вылета</label>
              <select
                value={departureCity}
                onChange={(e) => setDepartureCity(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 bg-sand-50 font-semibold text-slate-800"
              >
                <option value="Tashkent">Ташкент (TAS)</option>
                <option value="Samarkand">Самарканд (SKD)</option>
                <option value="Fergana">Фергана (FEG)</option>
                <option value="Bukhara">Бухара (BHK)</option>
                <option value="Namangan">Наманган (NMA)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-600 block mb-1">Заголовок тура</label>
            <input
              type="text"
              required
              placeholder="Например: Прямой рейс в Анталью — Rixos Premium Belek 5★"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 font-medium text-slate-800"
            />
          </div>

          <div className="grid sm:grid-cols-3 gap-3.5">
            <div>
              <label className="font-bold text-slate-600 block mb-1">Страна (EN)</label>
              <input
                type="text"
                required
                placeholder="Turkey, Uzbekistan, Egypt..."
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 font-medium"
              />
            </div>

            <div>
              <label className="font-bold text-slate-600 block mb-1">Город / Курорт</label>
              <input
                type="text"
                required
                placeholder="Antalya, Samarkand, Dubai..."
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 font-medium"
              />
            </div>

            <div>
              <label className="font-bold text-slate-600 block mb-1">Категория</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 bg-sand-50 font-semibold"
              >
                <option value="beach">Пляжный (beach)</option>
                <option value="excursion">Экскурсия (excursion)</option>
                <option value="umrah">Умра (umrah)</option>
                <option value="family">Семейный (family)</option>
                <option value="romantic">Романтика (romantic)</option>
                <option value="adventure">Приключения (adventure)</option>
              </select>
            </div>
          </div>

          <div className="grid sm:grid-cols-4 gap-3.5">
            <div className="sm:col-span-2">
              <label className="font-bold text-slate-600 block mb-1">Название отеля</label>
              <input
                type="text"
                placeholder="Rixos Premium / Hilton"
                value={hotelName}
                onChange={(e) => setHotelName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 font-medium"
              />
            </div>

            <div>
              <label className="font-bold text-slate-600 block mb-1">Звёзды отеля</label>
              <select
                value={hotelStars}
                onChange={(e) => setHotelStars(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 bg-sand-50 font-semibold"
              >
                <option value={5}>5 ★</option>
                <option value={4}>4 ★</option>
                <option value={3}>3 ★</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-600 block mb-1">Питание</label>
              <select
                value={mealType}
                onChange={(e) => setMealType(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 bg-sand-50 font-semibold"
              >
                <option value="AI">All Inclusive (AI)</option>
                <option value="UAI">Ultra All Inc (UAI)</option>
                <option value="BB">Завтрак (BB)</option>
                <option value="HB">Полупансион (HB)</option>
                <option value="FB">Полный пансион (FB)</option>
                <option value="RO">Без питания (RO)</option>
              </select>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-3.5">
            <div>
              <label className="font-bold text-slate-600 block mb-1">Цена за чел. ($ USD)</label>
              <input
                type="number"
                required
                min={30}
                value={priceUsd}
                onChange={(e) => setPriceUsd(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 font-extrabold text-primary-600"
              />
            </div>

            <div>
              <label className="font-bold text-slate-600 block mb-1">Количество ночей</label>
              <input
                type="number"
                required
                min={1}
                max={30}
                value={nights}
                onChange={(e) => setNights(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 font-bold"
              />
            </div>

            <div className="flex items-end gap-4 pb-2">
              <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                <input
                  type="checkbox"
                  checked={isHot}
                  onChange={(e) => setIsHot(e.target.checked)}
                  className="rounded text-primary-500 w-4 h-4"
                />
                <span>Горящий 🔥</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded text-primary-500 w-4 h-4"
                />
                <span>На витрине</span>
              </label>
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-600 block mb-1">Ссылка на фото (URL)</label>
            <input
              type="url"
              placeholder="https://images.unsplash.com/..."
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 font-medium"
            />
          </div>

          <div>
            <label className="font-bold text-slate-600 block mb-1">Описание программы и условий</label>
            <textarea
              rows={3}
              placeholder="Авиаперелёт, проживание, трансфер, страховка..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 font-medium"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="px-5 py-2.5 rounded-full bg-primary-500 hover:bg-primary-600 text-white font-bold flex items-center gap-1.5 shadow-sm shadow-primary-500/25"
            >
              <Save size={14} />
              <span>{mutation.isPending ? 'Сохранение...' : 'Сохранить тур'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
