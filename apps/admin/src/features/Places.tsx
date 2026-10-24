import { Edit3, MapPin, Plus, Power, ShieldCheck, X } from 'lucide-react';
import type { Place, PlaceCategory, PlaceInput, PlaceUpdateInput } from '@vnpolice/shared';
import { useEffect, useState } from 'react';
import { adminApi } from '../api';
import { MapPicker } from '../components/MapPicker';

interface PlaceFormState {
  id: number | null;
  name: string;
  category: PlaceCategory;
  address: string;
  latitude: string;
  longitude: string;
  verified: boolean;
  verificationSource: string;
  dataSource: string;
  active: boolean;
}

const emptyForm: PlaceFormState = {
  id: null,
  name: '',
  category: 'food',
  address: '',
  latitude: '9.176800',
  longitude: '105.152400',
  verified: false,
  verificationSource: '',
  dataSource: 'Hồ sơ đăng ký của cơ sở',
  active: true,
};

export function Places() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [form, setForm] = useState<PlaceFormState | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function loadPlaces(): Promise<void> {
    try {
      setPlaces(await adminApi.places());
      setError('');
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Không tải được cơ sở.');
    }
  }

  useEffect(() => {
    void loadPlaces();
  }, []);

  function editPlace(place: Place): void {
    setError('');
    setForm({
      id: place.id,
      name: place.name,
      category: place.category,
      address: place.address,
      latitude: place.latitude.toString(),
      longitude: place.longitude.toString(),
      verified: place.verified,
      verificationSource: place.verificationSource ?? '',
      dataSource: place.dataSource,
      active: place.active,
    });
  }

  async function submit(): Promise<void> {
    if (!form) return;
    const input: PlaceInput = {
      name: form.name,
      category: form.category,
      address: form.address,
      latitude: Number(form.latitude),
      longitude: Number(form.longitude),
      verified: form.verified,
      verificationSource: form.verificationSource || undefined,
      dataSource: form.dataSource,
      active: form.active,
    };
    setBusy(true);
    try {
      if (form.id) {
        const update: PlaceUpdateInput = {
          ...input,
          verificationSource: form.verificationSource.trim() || null,
        };
        await adminApi.updatePlace(form.id, update);
      } else {
        await adminApi.createPlace(input);
      }
      setForm(null);
      await loadPlaces();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Không lưu được cơ sở.');
    } finally {
      setBusy(false);
    }
  }

  async function toggleActive(place: Place): Promise<void> {
    setBusy(true);
    try {
      await adminApi.updatePlace(place.id, { active: !place.active });
      await loadPlaces();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Không cập nhật được cơ sở.');
    } finally {
      setBusy(false);
    }
  }

  const mapLatitude = form ? Number(form.latitude) : null;
  const mapLongitude = form ? Number(form.longitude) : null;

  return (
    <section className="module">
      <div className="module-heading">
        <div><p className="eyebrow">Điểm tin cậy</p><h1>Quán ăn & dịch vụ</h1><p>Thông tin xác minh của cơ sở được quản lý tách biệt với đánh giá do người dùng gửi.</p></div>
        <button type="button" className="button button--primary" onClick={() => { setError(''); setForm({ ...emptyForm }); }}><Plus size={18} /> Thêm cơ sở</button>
      </div>
      {error && !form ? <div className="error-banner" role="alert">{error}<button type="button" onClick={() => setError('')}>Đóng</button></div> : null}
      <div className="place-grid">
        {places.map((place) => (
          <article key={place.id} className={`place-card${place.active ? '' : ' place-card--disabled'}`}>
            <div className="place-card__head"><span className="category">{place.category === 'food' ? 'Ăn uống' : 'Dịch vụ'}</span><span className={`verification ${place.verified ? 'verification--yes' : 'verification--no'}`}>{place.verified ? 'Đã xác minh' : 'Chưa xác minh'}</span></div>
            <h3>{place.name}</h3><p>{place.address}</p>
            <div className="place-meta"><span><MapPin size={15} /> {place.latitude.toFixed(5)}, {place.longitude.toFixed(5)}</span><span>★ {place.averageRating ?? '—'} · {place.reviewCount} đánh giá</span><span>Nguồn: {place.dataSource}</span></div>
            <div className="card-actions"><button type="button" className="button button--secondary" onClick={() => editPlace(place)}><Edit3 size={16} /> Sửa</button><button type="button" className="icon-button" disabled={busy} onClick={() => void toggleActive(place)} title={place.active ? 'Vô hiệu hóa' : 'Kích hoạt'}><Power size={17} /></button></div>
          </article>
        ))}
      </div>

      {form ? (
        <div className="modal-layer" role="dialog" aria-modal="true" aria-label={form.id ? 'Sửa cơ sở' : 'Thêm cơ sở'}>
          <button type="button" className="modal-backdrop" onClick={() => setForm(null)} aria-label="Đóng biểu mẫu" />
          <form className="form-modal" onSubmit={(event) => { event.preventDefault(); void submit(); }}>
            <div className="drawer-header"><div><p className="eyebrow">{form.id ? 'Chỉnh sửa' : 'Tạo mới'}</p><h2>{form.id ? form.name : 'Cơ sở / dịch vụ'}</h2></div><button type="button" className="icon-button" aria-label="Đóng biểu mẫu" onClick={() => setForm(null)}><X size={21} /></button></div>
            {error ? <div className="form-error form-error--modal" role="alert">{error}</div> : null}
            <div className="form-grid">
              <label className="field"><span>Tên cơ sở *</span><input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
              <label className="field"><span>Loại *</span><select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value as PlaceCategory })}><option value="food">Ăn uống</option><option value="service">Dịch vụ</option></select></label>
              <label className="field span-2"><span>Địa chỉ *</span><input required value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} /></label>
              <label className="field"><span>Vĩ độ *</span><input required type="number" min="-90" max="90" step="any" value={form.latitude} onChange={(event) => setForm({ ...form, latitude: event.target.value })} /></label>
              <label className="field"><span>Kinh độ *</span><input required type="number" min="-180" max="180" step="any" value={form.longitude} onChange={(event) => setForm({ ...form, longitude: event.target.value })} /></label>
            </div>
            <div className="map-label"><MapPin size={16} /> Chạm bản đồ để chọn tọa độ</div>
            <MapPicker latitude={Number.isFinite(mapLatitude) ? mapLatitude : null} longitude={Number.isFinite(mapLongitude) ? mapLongitude : null} onSelect={(latitude, longitude) => setForm({ ...form, latitude: latitude.toFixed(6), longitude: longitude.toFixed(6) })} label={form.name || 'Cơ sở mới'} />
            <div className="form-grid form-grid--after-map">
              <label className="field span-2"><span>Nguồn dữ liệu *</span><input required value={form.dataSource} onChange={(event) => setForm({ ...form, dataSource: event.target.value })} /></label>
              <label className="check-field"><input type="checkbox" checked={form.verified} onChange={(event) => setForm({ ...form, verified: event.target.checked })} /><span><ShieldCheck size={17} /> Đã xác minh cơ sở</span></label>
              <label className="check-field"><input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} /><span><Power size={17} /> Đang hiển thị</span></label>
              <label className="field span-2"><span>Nguồn xác minh {form.verified ? '*' : ''}</span><textarea required={form.verified} value={form.verificationSource} onChange={(event) => setForm({ ...form, verificationSource: event.target.value })} /></label>
            </div>
            <div className="form-actions"><button type="button" className="button button--secondary" onClick={() => setForm(null)}>Hủy</button><button type="submit" className="button button--primary" disabled={busy}>{busy ? 'Đang lưu…' : 'Lưu cơ sở'}</button></div>
          </form>
        </div>
      ) : null}
    </section>
  );
}
