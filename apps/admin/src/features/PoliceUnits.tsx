import { Edit3, MapPin, Plus, Power, ShieldCheck, X } from 'lucide-react';
import type { PoliceUnit, PoliceUnitInput, PoliceUnitUpdateInput } from '@vnpolice/shared';
import { useEffect, useState } from 'react';
import { adminApi } from '../api';
import { MapPicker } from '../components/MapPicker';

interface UnitFormState {
  id: number | null;
  name: string;
  administrativeLevel: string;
  address: string;
  dutyHotline: string;
  latitude: string;
  longitude: string;
  verified: boolean;
  verificationSource: string;
  active: boolean;
}

const emptyForm: UnitFormState = {
  id: null,
  name: '',
  administrativeLevel: 'Công an xã/phường',
  address: '',
  dutyHotline: '',
  latitude: '',
  longitude: '',
  verified: false,
  verificationSource: '',
  active: true,
};

export function PoliceUnits() {
  const [units, setUnits] = useState<PoliceUnit[]>([]);
  const [form, setForm] = useState<UnitFormState | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function loadUnits(): Promise<void> {
    try {
      setUnits(await adminApi.policeUnits());
      setError('');
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Không tải được đơn vị.');
    }
  }

  useEffect(() => {
    void loadUnits();
  }, []);

  function editUnit(unit: PoliceUnit): void {
    setError('');
    setForm({
      id: unit.id,
      name: unit.name,
      administrativeLevel: unit.administrativeLevel,
      address: unit.address ?? '',
      dutyHotline: unit.dutyHotline ?? '',
      latitude: unit.latitude?.toString() ?? '',
      longitude: unit.longitude?.toString() ?? '',
      verified: unit.verified,
      verificationSource: unit.verificationSource ?? '',
      active: unit.active,
    });
  }

  async function submit(): Promise<void> {
    if (!form) return;
    const latitude = form.latitude.trim() ? Number(form.latitude) : undefined;
    const longitude = form.longitude.trim() ? Number(form.longitude) : undefined;
    const input: PoliceUnitInput = {
      name: form.name,
      administrativeLevel: form.administrativeLevel,
      address: form.address || undefined,
      dutyHotline: form.dutyHotline || undefined,
      latitude,
      longitude,
      verified: form.verified,
      verificationSource: form.verificationSource || undefined,
      active: form.active,
    };
    setBusy(true);
    try {
      if (form.id) {
        const update: PoliceUnitUpdateInput = {
          ...input,
          address: form.address.trim() || null,
          dutyHotline: form.dutyHotline.trim() || null,
          latitude: form.latitude.trim() ? latitude : null,
          longitude: form.longitude.trim() ? longitude : null,
          verificationSource: form.verificationSource.trim() || null,
        };
        await adminApi.updatePoliceUnit(form.id, update);
      } else {
        await adminApi.createPoliceUnit(input);
      }
      setForm(null);
      await loadUnits();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Không lưu được đơn vị.');
    } finally {
      setBusy(false);
    }
  }

  async function toggleActive(unit: PoliceUnit): Promise<void> {
    setBusy(true);
    try {
      await adminApi.updatePoliceUnit(unit.id, { active: !unit.active });
      await loadUnits();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Không cập nhật được đơn vị.');
    } finally {
      setBusy(false);
    }
  }

  const mapLatitude = form?.latitude.trim() ? Number(form.latitude) : null;
  const mapLongitude = form?.longitude.trim() ? Number(form.longitude) : null;

  return (
    <section className="module">
      <div className="module-heading">
        <div><p className="eyebrow">Dữ liệu đơn vị</p><h1>Đơn vị công an</h1><p>Bản ghi chưa xác minh vẫn xuất hiện trong danh sách nhưng không được dùng để gợi ý điều phối.</p></div>
        <button type="button" className="button button--primary" onClick={() => { setError(''); setForm({ ...emptyForm }); }}><Plus size={18} /> Thêm đơn vị</button>
      </div>
      {error && !form ? <div className="error-banner" role="alert">{error}<button type="button" onClick={() => setError('')}>Đóng</button></div> : null}
      <div className="data-card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Đơn vị</th><th>Địa chỉ / số trực</th><th>Tọa độ</th><th>Xác minh</th><th>Hoạt động</th><th /></tr></thead>
            <tbody>
              {units.map((unit) => (
                <tr key={unit.id} className={unit.active ? '' : 'muted-row'}>
                  <td><strong>{unit.name}</strong><small>{unit.administrativeLevel}</small></td>
                  <td>{unit.address ?? <em>Chưa có địa chỉ</em>}<small>{unit.dutyHotline ?? 'Chưa có số trực'}</small></td>
                  <td>{unit.latitude !== null && unit.longitude !== null ? `${unit.latitude.toFixed(6)}, ${unit.longitude.toFixed(6)}` : <em>Chưa có</em>}</td>
                  <td><span className={`verification ${unit.verified ? 'verification--yes' : 'verification--no'}`}>{unit.verified ? 'Đã xác minh' : 'Chưa xác minh'}</span></td>
                  <td>{unit.active ? 'Đang bật' : 'Đã tắt'}</td>
                  <td><div className="row-actions"><button type="button" className="icon-button" onClick={() => editUnit(unit)} title="Sửa"><Edit3 size={17} /></button><button type="button" className="icon-button" disabled={busy} onClick={() => void toggleActive(unit)} title={unit.active ? 'Vô hiệu hóa' : 'Kích hoạt'}><Power size={17} /></button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {form ? (
        <div className="modal-layer" role="dialog" aria-modal="true" aria-label={form.id ? 'Sửa đơn vị' : 'Thêm đơn vị'}>
          <button type="button" className="modal-backdrop" onClick={() => setForm(null)} aria-label="Đóng biểu mẫu" />
          <form className="form-modal" onSubmit={(event) => { event.preventDefault(); void submit(); }}>
            <div className="drawer-header"><div><p className="eyebrow">{form.id ? 'Chỉnh sửa' : 'Tạo mới'}</p><h2>{form.id ? form.name : 'Đơn vị công an'}</h2></div><button type="button" className="icon-button" aria-label="Đóng biểu mẫu" onClick={() => setForm(null)}><X size={21} /></button></div>
            {error ? <div className="form-error form-error--modal" role="alert">{error}</div> : null}
            <div className="form-grid">
              <label className="field span-2"><span>Tên đơn vị *</span><input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
              <label className="field"><span>Cấp hành chính *</span><input required value={form.administrativeLevel} onChange={(event) => setForm({ ...form, administrativeLevel: event.target.value })} /></label>
              <label className="field"><span>Số trực đơn vị</span><input value={form.dutyHotline} onChange={(event) => setForm({ ...form, dutyHotline: event.target.value })} /></label>
              <label className="field span-2"><span>Địa chỉ</span><input value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} /></label>
              <label className="field"><span>Vĩ độ</span><input type="number" step="any" value={form.latitude} onChange={(event) => setForm({ ...form, latitude: event.target.value })} /></label>
              <label className="field"><span>Kinh độ</span><input type="number" step="any" value={form.longitude} onChange={(event) => setForm({ ...form, longitude: event.target.value })} /></label>
            </div>
            <div className="map-label"><MapPin size={16} /> Chạm bản đồ để chọn tọa độ</div>
            <MapPicker latitude={Number.isFinite(mapLatitude) ? mapLatitude : null} longitude={Number.isFinite(mapLongitude) ? mapLongitude : null} onSelect={(latitude, longitude) => setForm({ ...form, latitude: latitude.toFixed(6), longitude: longitude.toFixed(6) })} label={form.name || 'Đơn vị mới'} />
            <div className="form-grid form-grid--after-map">
              <label className="check-field"><input type="checkbox" checked={form.verified} onChange={(event) => setForm({ ...form, verified: event.target.checked })} /><span><ShieldCheck size={17} /> Đã xác minh dữ liệu</span></label>
              <label className="check-field"><input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} /><span><Power size={17} /> Đang hoạt động</span></label>
              <label className="field span-2"><span>Nguồn xác minh {form.verified ? '*' : ''}</span><textarea required={form.verified} value={form.verificationSource} onChange={(event) => setForm({ ...form, verificationSource: event.target.value })} /></label>
            </div>
            <div className="form-actions"><button type="button" className="button button--secondary" onClick={() => setForm(null)}>Hủy</button><button type="submit" className="button button--primary" disabled={busy}>{busy ? 'Đang lưu…' : 'Lưu đơn vị'}</button></div>
          </form>
        </div>
      ) : null}
    </section>
  );
}
