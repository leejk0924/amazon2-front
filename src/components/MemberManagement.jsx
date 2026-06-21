import { useState } from 'react';
import '../styles/MemberManagement.css';

function CategoryBadge({ category }) {
  if (!category) return null;
  return <span className="category-badge">{category.name}</span>;
}

export function MemberManagement({
  members,
  categories,
  weekDates,
  getCount,
  formatDate,
  onAddMember,
  onRemoveMember,
  onAddCategory,
  onRemoveCategory,
  onUpdateCategory,
  error = null,
}) {
  const [subTab, setSubTab] = useState('members');
  const [showMemberForm, setShowMemberForm] = useState(false);
  const [mNickname, setMNickname] = useState('');
  const [mName, setMName] = useState('');
  const [mCategoryId, setMCategoryId] = useState('');
  const [categoryError, setCategoryError] = useState(false);
  const [removeConfirmMember, setRemoveConfirmMember] = useState(null);

  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [cCode, setCCode] = useState('');
  const [cName, setCName] = useState('');
  const [cDesc, setCDesc] = useState('');
  const [removeConfirmCat, setRemoveConfirmCat] = useState(null);
  const [editingCat, setEditingCat] = useState(null);
  const [editCatCode, setEditCatCode] = useState('');
  const [editCatName, setEditCatName] = useState('');
  const [editCatDesc, setEditCatDesc] = useState('');

  const weeklyTotal = (memberId) =>
    weekDates.reduce((s, d) => s + getCount(memberId, formatDate(d)), 0);

  const activeDays = (memberId) =>
    weekDates.filter((d) => getCount(memberId, formatDate(d)) > 0).length;

  const handleAddMember = () => {
    if (!mNickname.trim() || !mName.trim() || !mCategoryId.trim()) {
      setCategoryError(!mCategoryId.trim());
      return;
    }
    setCategoryError(false);
    const initials = mNickname.trim().slice(0, 2).toUpperCase();
    onAddMember({
      id: Date.now().toString(),
      nickname: mNickname.trim(),
      name: mName.trim(),
      blogUrl: `blog.naver.com/${mNickname.trim()}`,
      avatar: initials,
      categoryId: mCategoryId,
    });
    setMNickname('');
    setMName('');
    setMCategoryId('');
    setCategoryError(false);
    setShowMemberForm(false);
  };

  const handleAddCategory = () => {
    if (!cCode.trim() || !cName.trim()) return;
    onAddCategory({
      id: cCode.trim().toUpperCase(),
      name: cName.trim(),
      color: cDesc.trim(),
    });
    setCCode('');
    setCName('');
    setCDesc('');
    setShowCategoryForm(false);
  };

  const startEditCat = (cat) => {
    setEditingCat(cat.id);
    setEditCatCode(cat.id);
    setEditCatName(cat.name);
    setEditCatDesc(cat.color || '');
  };

  const saveEditCat = (id) => {
    if (editCatName.trim()) {
      onUpdateCategory(id, { name: editCatName.trim(), color: editCatDesc.trim() });
    }
    setEditingCat(null);
  };

  const memberCountByCat = (catId) => members.filter((m) => m.categoryId === catId).length;

  return (
    <div className="member-management">
      {/* 서브탭 */}
      <div className="member-management-subtabs">
        {[
          { key: 'members', label: '인원 목록', count: members.length },
          { key: 'categories', label: '카테고리 관리', count: categories.length },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setSubTab(t.key)}
            className={`subtab-button ${subTab === t.key ? 'active' : ''}`}
          >
            {t.label}
            <span className={`subtab-count ${subTab === t.key ? 'active' : ''}`}>{t.count}</span>
          </button>
        ))}
      </div>

      {/* 인원 목록 탭 */}
      {subTab === 'members' && (
        <div className="subtab-content">
          <button className="add-button" onClick={() => setShowMemberForm(!showMemberForm)}>
            + 멤버 추가
          </button>

          {showMemberForm && (
            <div className="form-section">
              <div className="form-group">
                <label>닉네임</label>
                <input
                  type="text"
                  value={mNickname}
                  onChange={(e) => setMNickname(e.target.value)}
                  placeholder="멤버 닉네임"
                />
              </div>
              <div className="form-group">
                <label>이름</label>
                <input
                  type="text"
                  value={mName}
                  onChange={(e) => setMName(e.target.value)}
                  placeholder="멤버 이름"
                />
              </div>
              <div className="form-group">
                <label>카테고리 *</label>
                <select
                  value={mCategoryId}
                  onChange={(e) => {
                    setMCategoryId(e.target.value);
                    setCategoryError(false);
                  }}
                  style={categoryError ? { borderColor: '#ef4444' } : {}}
                >
                  <option value="">카테고리를 선택해주세요</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                {categoryError && (
                  <p
                    style={{
                      fontSize: '0.875rem',
                      color: '#ef4444',
                      margin: '0.25rem 0 0 0',
                    }}
                  >
                    카테고리를 선택해주세요
                  </p>
                )}
              </div>
              <div className="form-actions">
                <button className="btn-primary" onClick={handleAddMember}>
                  추가
                </button>
                <button className="btn-secondary" onClick={() => setShowMemberForm(false)}>
                  취소
                </button>
              </div>
            </div>
          )}

          {members.length > 0 ? (
            <div className="members-table">
              {members.map((member) => (
                <div key={member.id} className="member-row">
                  <div className="member-info">
                    <div className="member-details">
                      <a
                        href={`https://${member.blogUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {member.name}
                      </a>
                      <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{member.nickname}</div>
                      {member.categoryId && (
                        <CategoryBadge
                          category={categories.find((c) => c.id === member.categoryId)}
                        />
                      )}
                    </div>
                  </div>
                  <div className="member-stats">
                    <div className="stat">
                      <span className="stat-value">{weeklyTotal(member.id)}</span>
                      <span className="stat-label">주간</span>
                    </div>
                    <div className="stat">
                      <span className="stat-value">{activeDays(member.id)}</span>
                      <span className="stat-label">활동</span>
                    </div>
                  </div>
                  <div className="member-action">
                    {removeConfirmMember === member.id ? (
                      <div className="confirm-buttons">
                        <button
                          className="btn-confirm"
                          onClick={() => {
                            onRemoveMember(member.id);
                            setRemoveConfirmMember(null);
                          }}
                        >
                          확인
                        </button>
                        <button
                          className="btn-cancel-small"
                          onClick={() => setRemoveConfirmMember(null)}
                        >
                          취소
                        </button>
                      </div>
                    ) : (
                      <button
                        className="btn-delete"
                        onClick={() => setRemoveConfirmMember(member.id)}
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>멤버를 추가해주세요</p>
              {error && (
                <p
                  style={{
                    fontSize: '0.875rem',
                    margin: '0.5rem 0 0 0',
                    opacity: 0.7,
                    color: '#ef4444',
                  }}
                >
                  데이터 로드 실패: {error}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* 카테고리 관리 탭 */}
      {subTab === 'categories' && (
        <div className="subtab-content">
          <button className="add-button" onClick={() => setShowCategoryForm(!showCategoryForm)}>
            + 카테고리 추가
          </button>

          {showCategoryForm && (
            <div className="form-section">
              <div className="form-group">
                <label>코드</label>
                <input
                  type="text"
                  value={cCode}
                  onChange={(e) => setCCode(e.target.value.toUpperCase())}
                  placeholder="예: BEAUTY, FASHION, FOOD"
                />
              </div>
              <div className="form-group">
                <label>이름</label>
                <input
                  type="text"
                  value={cName}
                  onChange={(e) => setCName(e.target.value)}
                  placeholder="예: 뷰티/패션"
                />
              </div>
              <div className="form-group">
                <label>설명</label>
                <input
                  type="text"
                  value={cDesc}
                  onChange={(e) => setCDesc(e.target.value)}
                  placeholder="카테고리 설명"
                />
              </div>
              <div className="form-actions">
                <button className="btn-primary" onClick={handleAddCategory}>
                  추가
                </button>
                <button className="btn-secondary" onClick={() => setShowCategoryForm(false)}>
                  취소
                </button>
              </div>
            </div>
          )}

          {categories.length > 0 ? (
            <div className="categories-list">
              {categories.map((cat) => (
                <div key={cat.id} className="category-row">
                  {editingCat === cat.id ? (
                    <div className="category-edit">
                      <input type="text" value={editCatCode} disabled placeholder="코드" />
                      <input
                        type="text"
                        value={editCatName}
                        onChange={(e) => setEditCatName(e.target.value)}
                        placeholder="카테고리 이름"
                      />
                      <input
                        type="text"
                        value={editCatDesc}
                        onChange={(e) => setEditCatDesc(e.target.value)}
                        placeholder="설명"
                      />
                      <div className="edit-buttons">
                        <button className="btn-confirm" onClick={() => saveEditCat(cat.id)}>
                          저장
                        </button>
                        <button className="btn-cancel-small" onClick={() => setEditingCat(null)}>
                          취소
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="category-info">
                        <CategoryBadge category={cat} />
                        <span className="member-count">({memberCountByCat(cat.id)}명)</span>
                      </div>
                      <div className="category-actions">
                        <button className="btn-edit" onClick={() => startEditCat(cat)}>
                          ✏️
                        </button>
                        {removeConfirmCat === cat.id ? (
                          <div className="confirm-buttons">
                            <button
                              className="btn-confirm"
                              onClick={() => {
                                onRemoveCategory(cat.id);
                                setRemoveConfirmCat(null);
                              }}
                            >
                              확인
                            </button>
                            <button
                              className="btn-cancel-small"
                              onClick={() => setRemoveConfirmCat(null)}
                            >
                              취소
                            </button>
                          </div>
                        ) : (
                          <button
                            className="btn-delete"
                            onClick={() => setRemoveConfirmCat(cat.id)}
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>카테고리를 추가해주세요</p>
              {error && (
                <p
                  style={{
                    fontSize: '0.875rem',
                    margin: '0.5rem 0 0 0',
                    opacity: 0.7,
                    color: '#ef4444',
                  }}
                >
                  데이터 로드 실패: {error}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
