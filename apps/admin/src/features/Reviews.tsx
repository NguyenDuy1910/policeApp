import { Check, MessageSquareText, Star, X } from 'lucide-react';
import type { Place, Review, ReviewStatus } from '@vnpolice/shared';
import { useEffect, useMemo, useState } from 'react';
import { adminApi } from '../api';

const reviewStatusLabels: Record<ReviewStatus, string> = {
  pending: 'Chờ duyệt',
  approved: 'Đã duyệt',
  rejected: 'Đã từ chối',
};

export function Reviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);
  const [status, setStatus] = useState<ReviewStatus | ''>('pending');
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<number | null>(null);

  async function load(): Promise<void> {
    try {
      const [nextReviews, nextPlaces] = await Promise.all([adminApi.reviews(status), adminApi.places()]);
      setReviews(nextReviews);
      setPlaces(nextPlaces);
      setError('');
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Không tải được đánh giá.');
    }
  }

  useEffect(() => {
    void load();
  }, [status]);

  const placeNames = useMemo(() => new Map(places.map((place) => [place.id, place.name])), [places]);

  async function moderate(reviewId: number, nextStatus: ReviewStatus): Promise<void> {
    setBusyId(reviewId);
    try {
      await adminApi.moderateReview(reviewId, nextStatus);
      await load();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Không kiểm duyệt được đánh giá.');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="module">
      <div className="module-heading">
        <div><p className="eyebrow">Nội dung cộng đồng</p><h1>Kiểm duyệt đánh giá</h1><p>Đánh giá người dùng không được gắn nhãn là xác nhận của công an hoặc của cơ sở.</p></div>
      </div>
      {error ? <div className="error-banner">{error}<button type="button" onClick={() => setError('')}>Đóng</button></div> : null}
      <div className="toolbar">
        <label><span>Trạng thái</span><select value={status} onChange={(event) => setStatus(event.target.value as ReviewStatus | '')}><option value="">Tất cả</option><option value="pending">Chờ duyệt</option><option value="approved">Đã duyệt</option><option value="rejected">Đã từ chối</option></select></label>
        <button type="button" className="button button--secondary" onClick={() => void load()}>Làm mới</button>
      </div>
      <div className="review-grid">
        {reviews.map((review) => (
          <article key={review.id} className="review-card">
            <div className="review-card__head"><div className="review-icon"><MessageSquareText size={20} /></div><span className={`review-status review-status--${review.status}`}>{reviewStatusLabels[review.status]}</span></div>
            <h3>{placeNames.get(review.placeId) ?? `Cơ sở #${review.placeId}`}</h3>
            <div className="review-author"><strong>{review.authorName}</strong><span><Star size={14} fill="currentColor" /> {review.rating}/5</span></div>
            <p>{review.comment}</p>
            <small>Người dùng gửi · {new Date(review.createdAt).toLocaleString('vi-VN')}</small>
            <div className="card-actions">
              <button type="button" className="button button--approve" disabled={busyId === review.id || review.status === 'approved'} onClick={() => void moderate(review.id, 'approved')}><Check size={16} /> Duyệt</button>
              <button type="button" className="button button--reject" disabled={busyId === review.id || review.status === 'rejected'} onClick={() => void moderate(review.id, 'rejected')}><X size={16} /> Từ chối</button>
            </div>
          </article>
        ))}
        {reviews.length === 0 ? <div className="empty-panel">Không có đánh giá trong trạng thái này.</div> : null}
      </div>
    </section>
  );
}
