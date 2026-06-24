import { useState } from 'react';
import '../styles/AddMemberModal.css';

export function AddMemberModal({
  isOpen,
  categories = [],
  onClose,
  onSave,
}) {
  const [mNickname, setMNickname] = useState('');
  const [mName, setMName] = useState('');
  const [mCategoryId, setMCategoryId] = useState('');
  const [categoryError, setCategoryError] = useState(false);

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
    setMNickname('');
    setMName('');
    setMCategoryId('');
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
          <h2>멤버 추가</h2>
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
            추가
          </button>
        </div>
      </div>
    </>
  );
}
