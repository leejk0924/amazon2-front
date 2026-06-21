import { useState } from 'react';
import '../styles/PostModal.css';

const DAYS_KO = ['일', '월', '화', '수', '목', '금', '토'];

export function PostModal({ members, memberId, date, currentCount, onSave, onClose }) {
  const [count, setCount] = useState(currentCount);
  const member = members.find((m) => m.id === memberId);

  const d = new Date(date + 'T12:00:00');
  const dateLabel = `${d.getMonth() + 1}월 ${d.getDate()}일 (${DAYS_KO[d.getDay()]})`;

  const handleSave = () => {
    onSave(memberId, date, count);
  };

  return (
    <div className="post-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="post-modal" onClick={(e) => e.stopPropagation()}>
        <div className="post-modal-header">
          <div>
            <p className="post-modal-member">{member?.name ?? '알 수 없음'}</p>
            <p className="post-modal-date">{dateLabel}</p>
          </div>
          <button className="post-modal-close" onClick={onClose} aria-label="닫기">
            ✕
          </button>
        </div>

        <div className="post-modal-body">
          <p className="post-modal-label">포스팅 수를 입력하세요</p>

          <div className="post-modal-counter">
            <button
              className="counter-btn"
              onClick={() => setCount((c) => Math.max(0, c - 1))}
              aria-label="수 감소"
            >
              −
            </button>
            <span className="counter-display">{count}</span>
            <button
              className="counter-btn"
              onClick={() => setCount((c) => c + 1)}
              aria-label="수 증가"
            >
              +
            </button>
          </div>

          <div className="quick-select">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onClick={() => setCount(n)}
                className={`quick-select-btn ${count === n ? 'active' : ''}`}
              >
                {n}개
              </button>
            ))}
          </div>
        </div>

        <div className="post-modal-footer">
          <button className="btn-cancel" onClick={onClose}>
            취소
          </button>
          <button className="btn-save" onClick={handleSave}>
            저장
          </button>
        </div>
      </div>
    </div>
  );
}
