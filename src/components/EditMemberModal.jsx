import { useState, useEffect } from 'react';
import '../styles/EditMemberModal.css';

export function EditMemberModal({
  isOpen,
  member,
  categories = [],
  onClose,
  onSave,
}) {
  const [mNickname, setMNickname] = useState('');
  const [mName, setMName] = useState('');
  const [mCategoryId, setMCategoryId] = useState('');
  const [categoryError, setCategoryError] = useState(false);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    if (isOpen && member) {
      setMNickname(member.nickname || '');
      setMName(member.name || '');
      setMCategoryId(member.categoryId ? String(member.categoryId) : '');
      setCategoryError(false);
    }
  }, [isOpen, member]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!mNickname.trim() || !mName.trim() || !mCategoryId.trim()) {
      setCategoryError(!mCategoryId.trim());
      return;
    }
    setCategoryError(false);
    onSave({
      nickname: mNickname.trim(),
      name: mName.trim(),
      categoryId: mCategoryId,
    });
    handleClose();
  };

  const handleClose = () => {
    setMNickname('');
    setMName('');
    setMCategoryId('');
    setCategoryError(false);
    onClose();
  };

  return (
    <>
      <div className="modal-overlay" onClick={handleClose} />
      <div className="modal-popup">
        <div className="modal-header">
          <h2>멤버 정보 수정</h2>
          <button className="modal-close" onClick={handleClose}>
            ×
          </button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label>닉네임 *</label>
            <input
              type="text"
              value={mNickname}
              onChange={(e) => setMNickname(e.target.value)}
              placeholder="멤버 닉네임"
            />
          </div>

          <div className="form-group">
            <label>이름 *</label>
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
              <p className="error-message">카테고리를 선택해주세요</p>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-cancel" onClick={handleClose}>
            취소
          </button>
          <button className="btn-save" onClick={handleSave}>
            저장
          </button>
        </div>
      </div>
    </>
  );
}
