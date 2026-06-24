import { useState, useEffect } from 'react';
import '../styles/EditCategoryModal.css';

export function EditCategoryModal({
  isOpen,
  category,
  onClose,
  onSave,
}) {
  const [cCode, setCCode] = useState('');
  const [cName, setCName] = useState('');
  const [cDesc, setCDesc] = useState('');

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    if (category && isOpen) {
      setCCode(category.id || '');
      setCName(category.name || '');
      setCDesc(category.description || '');
    }
  }, [category, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!cName.trim()) return;
    onSave({
      name: cName.trim(),
      description: cDesc.trim(),
    });
    handleClose();
  };

  const handleClose = () => {
    setCCode('');
    setCName('');
    setCDesc('');
    onClose();
  };

  return (
    <>
      <div className="modal-overlay" onClick={handleClose} />
      <div className="modal-popup">
        <div className="modal-header">
          <h2>카테고리 수정</h2>
          <button className="modal-close" onClick={handleClose}>
            ×
          </button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label>코드</label>
            <input
              type="text"
              value={cCode}
              disabled
              placeholder="코드"
            />
          </div>

          <div className="form-group">
            <label>이름 *</label>
            <input
              type="text"
              value={cName}
              onChange={(e) => setCName(e.target.value)}
              placeholder="카테고리 이름"
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
