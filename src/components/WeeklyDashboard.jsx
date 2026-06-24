import { useState, useEffect } from 'react';
import '../styles/WeeklyDashboard.css';

function CountBadge({ count, onClick }) {
  if (count === 0) {
    return (
      <button
        className="count-badge count-badge--empty"
        onClick={onClick}
        aria-label="포스팅 수 입력"
      >
        0
      </button>
    );
  }

  const intensity = Math.min(count, 5);
  const opacity = 0.15 + intensity * 0.17;

  return (
    <button
      className="count-badge count-badge--interactive"
      onClick={onClick}
      style={{
        background: `rgba(61, 214, 140, ${opacity})`,
        color: intensity >= 3 ? '#ffffff' : '#047857',
      }}
      aria-label={`포스팅 수 ${count}개 - 클릭하여 수정`}
    >
      {count}
    </button>
  );
}

export function WeeklyDashboard({
  members = [],
  // eslint-disable-next-line no-unused-vars
  categories = [],
  weekDates = [],
  daysKo = [],
  getCount = () => 0,
  formatDate = (d) => d.toISOString().slice(0, 10),
  // eslint-disable-next-line no-unused-vars
  today = new Date(),
  error = null,
  weekOffset = 0,
  totalPages = 1,
  batchLoading = false,
  onPageSizeChange = () => {},
  onPageChange = () => {},
  onCellClick = () => {},
  onBatchExecute = () => {},
}) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);
  const [filterMode, setFilterMode] = useState(false);
  const [filterMax, setFilterMax] = useState(5);
  const [filterInput, setFilterInput] = useState('5');

  // weekOffset 변경 시 page 리셋
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    setPage(1);
    onPageChange(0);
  }, [weekOffset, onPageChange]);

  // 주간 합계
  const weeklyTotal = (memberId) =>
    weekDates.reduce((sum, date) => sum + getCount(memberId, formatDate(date)), 0);

  // 필터 적용
  const filteredMembers = filterMode
    ? members.filter((m) => weeklyTotal(m.id) < filterMax)
    : members;

  // 날짜별 합계 (필터 적용 시에는 필터링된 멤버들만 포함)
  const dayTotal = (dateStr) =>
    filteredMembers.reduce((sum, member) => sum + getCount(member.id, dateStr), 0);

  // 페이지네이션
  // filterMode 없을 때는 API의 pagination 사용 (이미 페이징된 데이터)
  // filterMode 있을 때는 로컬 pagination 사용
  const localTotalPages = Math.max(1, Math.ceil(filteredMembers.length / pageSize));
  const apiTotalPages = filterMode ? localTotalPages : totalPages;
  const safePage = Math.min(page, apiTotalPages);
  const pagedMembers = filterMode
    ? filteredMembers.slice((safePage - 1) * pageSize, safePage * pageSize)
    : filteredMembers; // API에서 이미 페이징된 데이터이므로 전체 사용

  // 필터 적용
  const applyFilter = () => {
    const val = parseInt(filterInput, 10);
    if (!isNaN(val) && val >= 0) {
      setFilterMax(val);
      setPage(1);
    }
  };

  // 필터 토글
  const toggleFilter = () => {
    setFilterMode((v) => !v);
    setPage(1);
  };

  // 페이지 크기 변경
  const handlePageSize = (size) => {
    setPageSize(size);
    setPage(1);
    onPageSizeChange(size);
    onPageChange(0);
  };

  // 배치 실행
  const handleBatchExecute = async () => {
    if (weekDates.length < 2) return;
    await onBatchExecute(formatDate(weekDates[0]), formatDate(weekDates[6]));
  };

  return (
    <div className="weekly-dashboard">
      {/* 헤더 */}
      <div className="dashboard-header">
        <div className="header-controls">
          {/* 배치 데이터 수집 */}
          <button
            className="control-btn batch-btn"
            onClick={handleBatchExecute}
            disabled={batchLoading}
            aria-label="배치 데이터 수집"
          >
            {batchLoading ? '⏳ 수집 중...' : '📊 데이터 수집'}
          </button>

          {/* 필터 토글 */}
          <button
            className={`control-btn ${filterMode ? 'active' : ''}`}
            onClick={toggleFilter}
            aria-label="포스팅 수 필터 토글"
          >
            🔍 {filterMode ? '필터 적용 중' : '포스팅 수 필터'}
          </button>

          {/* 필터 입력 */}
          {filterMode && (
            <div className="filter-input-group">
              <input
                type="number"
                min="0"
                value={filterInput}
                onChange={(e) => setFilterInput(e.target.value)}
                placeholder="최대값"
                className="filter-input"
                aria-label="필터 최대값"
              />
              <button onClick={applyFilter} className="filter-apply-btn">
                적용
              </button>
              {filterMax > 0 && (
                <span className="filter-status">(포스팅 &lt; {filterMax}인 멤버만 표시)</span>
              )}
            </div>
          )}

          {/* 페이지 크기 선택 */}
          <select
            value={pageSize}
            onChange={(e) => handlePageSize(Number(e.target.value))}
            className="pagesize-select"
            aria-label="페이지당 멤버 수"
          >
            <option value={10}>10명</option>
            <option value={20}>20명</option>
            <option value={50}>50명</option>
            <option value={100}>100명</option>
          </select>
        </div>
      </div>

      {/* 테이블 */}
      <div className="dashboard-table-wrapper">
        <table className="dashboard-table">
          <thead>
            <tr>
              <th className="col-member">멤버</th>
              {weekDates.map((date, i) => (
                <th key={formatDate(date)} className="col-date">
                  <div className="date-header">
                    <span className="day-name">{daysKo[i]}</span>
                    <span className="date-num">{date.getDate()}</span>
                  </div>
                </th>
              ))}
              <th className="col-total">합계</th>
            </tr>
          </thead>
          <tbody>
            {pagedMembers.length > 0 ? (
              pagedMembers.map((member) => (
                <tr key={member.id}>
                  <td className="col-member">
                    <a
                      href={member.blogUrl || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="member-name"
                    >
                      {member.name}
                    </a>
                  </td>
                  {weekDates.map((date) => {
                    const dateStr = formatDate(date);
                    return (
                      <td key={`${member.id}-${dateStr}`} className="col-date">
                        <CountBadge
                          count={getCount(member.id, dateStr)}
                          onClick={() => onCellClick(member.id, dateStr)}
                        />
                      </td>
                    );
                  })}
                  <td className="col-total">
                    <strong>{weeklyTotal(member.id)}</strong>
                  </td>
                </tr>
              ))
            ) : (
              <tr className="empty-row">
                <td colSpan={weekDates.length + 2}>
                  <div>
                    <p style={{ margin: '0 0 0.5rem 0' }}>표시할 데이터가 없습니다.</p>
                    {error && (
                      <p
                        style={{ margin: 0, fontSize: '0.875rem', opacity: 0.7, color: '#ef4444' }}
                      >
                        데이터 로드 실패: {error}
                      </p>
                    )}
                  </div>
                </td>
              </tr>
            )}
            {/* 날짜별 합계 */}
            <tr className="total-row">
              <td className="col-member">
                <strong>일일 합계</strong>
              </td>
              {weekDates.map((date) => (
                <td key={`total-${formatDate(date)}`} className="col-date">
                  <strong>{dayTotal(formatDate(date))}</strong>
                </td>
              ))}
              <td className="col-total">
                <strong>
                  {weekDates.reduce((sum, date) => sum + dayTotal(formatDate(date)), 0)}
                </strong>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 푸터 - 페이지네이션 */}
      {filteredMembers.length > 0 && (
        <div className="dashboard-footer">
          <div className="pagination">
            <button
              disabled={safePage <= 1}
              onClick={() => {
                const newPage = Math.max(1, safePage - 1);
                setPage(newPage);
                onPageChange(newPage - 1);
              }}
              className="pagination-btn"
              aria-label="이전 페이지"
            >
              ← 이전
            </button>
            <span className="pagination-info">
              {safePage} / {apiTotalPages} 페이지
            </span>
            <button
              disabled={safePage === apiTotalPages}
              onClick={() => {
                const newPage = Math.min(totalPages, safePage + 1);
                setPage(newPage);
                onPageChange(newPage - 1);
              }}
              className="pagination-btn"
              aria-label="다음 페이지"
            >
              다음 →
            </button>
          </div>
          <div className="members-info">
            표시 중: {pagedMembers.length} / {filteredMembers.length}명
            {filterMode && ` (필터 적용)`}
          </div>
        </div>
      )}
    </div>
  );
}
