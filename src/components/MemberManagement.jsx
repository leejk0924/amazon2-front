import { useState } from 'react';
import '../styles/MemberManagement.css';
import { AddMemberModal } from './AddMemberModal';
import { AddCategoryModal } from './AddCategoryModal';
import { EditMemberModal } from './EditMemberModal';
import { EditCategoryModal } from './EditCategoryModal';

function CategoryBadge({ category }) {
  if (!category) return null;
  return <span className="category-badge">{category.name}</span>;
}

export function MemberManagement({
  members,
  categories,
  onAddMember,
  onRemoveMember,
  onUpdateMember,
  onAddCategory,
  onRemoveCategory,
  onUpdateCategory,
  onPermanentDeleteMember,
  onRestoreMember,
  onFilterChange = () => {},
  error = null,
}) {
  const [subTab, setSubTab] = useState('members');
  const [showMemberForm, setShowMemberForm] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [removeConfirmMember, setRemoveConfirmMember] = useState(null);
  const [showDeletedOnly, setShowDeletedOnly] = useState(false);

  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [removeConfirmCat, setRemoveConfirmCat] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);

  return (
    <div className="member-management">
      {/* 서브탭 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '2px solid #e5e7eb',
          paddingBottom: 0,
        }}
      >
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
        {subTab === 'members' && (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => {
                setShowDeletedOnly(false);
                onFilterChange('active');
              }}
              style={{
                padding: '0.5rem 1rem',
                background: !showDeletedOnly ? '#3dd68c' : 'white',
                border: !showDeletedOnly ? '1px solid #3dd68c' : '1px solid #d1d5db',
                color: !showDeletedOnly ? 'white' : '#6b7280',
                borderRadius: '0.375rem',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: 500,
                transition: 'all 0.2s',
              }}
            >
              👥 모든 멤버
            </button>
            <button
              onClick={() => {
                setShowDeletedOnly(true);
                onFilterChange('deleted');
              }}
              style={{
                padding: '0.5rem 1rem',
                background: showDeletedOnly ? '#fee2e2' : 'white',
                border: showDeletedOnly ? '1px solid #ef4444' : '1px solid #d1d5db',
                color: showDeletedOnly ? '#dc2626' : '#6b7280',
                borderRadius: '0.375rem',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: 500,
                transition: 'all 0.2s',
              }}
            >
              🗑️ 삭제된 멤버
            </button>
          </div>
        )}
      </div>

      {/* 인원 목록 탭 */}
      {subTab === 'members' && (
        <div className="subtab-content">
          <button className="add-button" onClick={() => setShowMemberForm(true)}>
            + 멤버 추가
          </button>

          <AddMemberModal
            isOpen={showMemberForm}
            categories={categories}
            onClose={() => setShowMemberForm(false)}
            onSave={(memberData) => {
              const m = {
                id: Date.now().toString(),
                avatar: memberData.nickname.slice(0, 2).toUpperCase(),
                ...memberData,
                blogUrl: `https://blog.naver.com/${memberData.nickname}`,
              };
              onAddMember(m);
              setShowMemberForm(false);
            }}
          />

          <EditMemberModal
            isOpen={!!editingMember}
            member={editingMember}
            categories={categories}
            onClose={() => setEditingMember(null)}
            onSave={(memberData) => {
              onUpdateMember(editingMember.id, memberData);
              setEditingMember(null);
            }}
          />

          {members.length > 0 ? (
            <div className="members-grid">
              {members
                .filter((m) => (showDeletedOnly ? m.status === 'deleted' : m.status !== 'deleted'))
                .map((member) => (
                  <div
                    key={member.id}
                    className="member-card"
                    style={{ opacity: member.status === 'deleted' ? 0.6 : 1 }}
                  >
                    <div className="card-header">
                      <a
                        href={member.blogUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="member-name-link"
                      >
                        {member.name}
                      </a>
                      {member.status === 'deleted' && <span className="deleted-badge">삭제됨</span>}
                    </div>
                    <div className="card-body">
                      <div className="member-nickname">{member.nickname}</div>
                      <CategoryBadge
                        category={
                          categories.find((c) => c.id === member.categoryId) || {
                            id: '',
                            name: '미분류',
                          }
                        }
                      />
                    </div>
                    <div className="card-footer">
                      {member.status === 'deleted' ? (
                        <div className="button-group">
                          <button
                            className="btn-confirm"
                            onClick={() => onRestoreMember(member.nickname)}
                            style={{ background: '#16a34a', fontSize: '0.75rem', flex: 1 }}
                            title="복원"
                          >
                            🔄 복원
                          </button>
                          {removeConfirmMember === member.id ? (
                            <>
                              <button
                                className="btn-confirm"
                                onClick={() => {
                                  onPermanentDeleteMember(member.id);
                                  setRemoveConfirmMember(null);
                                }}
                                style={{ background: '#7c2d12', fontSize: '0.7rem', flex: 1 }}
                              >
                                영구삭제
                              </button>
                              <button
                                className="btn-cancel-small"
                                onClick={() => setRemoveConfirmMember(null)}
                                style={{ flex: 1 }}
                              >
                                취소
                              </button>
                            </>
                          ) : (
                            <button
                              className="btn-delete"
                              onClick={() => setRemoveConfirmMember(member.id)}
                              title="영구 삭제"
                              style={{ flex: 1 }}
                            >
                              🔥
                            </button>
                          )}
                        </div>
                      ) : removeConfirmMember === member.id ? (
                        <div className="button-group">
                          <button
                            className="btn-confirm"
                            onClick={() => {
                              onRemoveMember(member.id);
                              setRemoveConfirmMember(null);
                            }}
                            style={{ flex: 1 }}
                          >
                            확인
                          </button>
                          <button
                            className="btn-cancel-small"
                            onClick={() => setRemoveConfirmMember(null)}
                            style={{ flex: 1 }}
                          >
                            취소
                          </button>
                        </div>
                      ) : (
                        <div className="button-group">
                          <button
                            className="btn-edit"
                            onClick={() => setEditingMember(member)}
                            style={{ flex: 1 }}
                          >
                            ✏️ 수정
                          </button>
                          <button
                            className="btn-delete"
                            onClick={() => setRemoveConfirmMember(member.id)}
                            style={{ flex: 1 }}
                          >
                            🗑️ 삭제
                          </button>
                        </div>
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
          <button className="add-button" onClick={() => setShowCategoryForm(true)}>
            + 카테고리 추가
          </button>

          <AddCategoryModal
            isOpen={showCategoryForm}
            onClose={() => setShowCategoryForm(false)}
            onSave={(categoryData) => {
              onAddCategory(categoryData);
              setShowCategoryForm(false);
            }}
          />

          <EditCategoryModal
            isOpen={!!editingCategory}
            category={editingCategory}
            onClose={() => setEditingCategory(null)}
            onSave={(categoryData) => {
              onUpdateCategory(editingCategory.id, categoryData);
              setEditingCategory(null);
            }}
          />

          {categories.length > 0 ? (
            <div className="categories-grid">
              {categories.map((cat) => (
                <div key={cat.id} className="category-card">
                  <div className="card-header">
                    <CategoryBadge category={cat} />
                  </div>
                  <div className="card-body">
                    {cat.description && <p className="category-description">{cat.description}</p>}
                  </div>
                  <div className="card-footer">
                    {removeConfirmCat === cat.id ? (
                      <div className="button-group">
                        <button
                          className="btn-confirm"
                          onClick={() => {
                            onRemoveCategory(cat.id);
                            setRemoveConfirmCat(null);
                          }}
                          style={{ flex: 1 }}
                        >
                          확인
                        </button>
                        <button
                          className="btn-cancel-small"
                          onClick={() => setRemoveConfirmCat(null)}
                          style={{ flex: 1 }}
                        >
                          취소
                        </button>
                      </div>
                    ) : (
                      <div className="button-group">
                        <button
                          className="btn-edit"
                          onClick={() => setEditingCategory(cat)}
                          style={{ flex: 1 }}
                        >
                          ✏️ 수정
                        </button>
                        <button
                          className="btn-delete"
                          onClick={() => setRemoveConfirmCat(cat.id)}
                          style={{ flex: 1 }}
                        >
                          🗑️ 삭제
                        </button>
                      </div>
                    )}
                  </div>
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
