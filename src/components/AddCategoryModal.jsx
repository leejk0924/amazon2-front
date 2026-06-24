import { useState } from 'react';
import '../styles/AddCategoryModal.css';

export function AddCategoryModal({
  isOpen,
  onClose,
  onSave,
}) {
  const [cCode, setCCode] = useState('');
  const [cName, setCName] = useState('');
  const [cDesc, setCDesc] = useState('');

  if (!isOpen) return null;

  const handleSave = () => {
    if (!cCode.trim() || !cName.trim()) return;
    onSave({
      id: cCode.trim().toUpperCase(),
      name: cName.trim(),
      description: cDesc.trim(),
    });
    setCCode('');
    setCName('');
    setCDesc('');
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
          <h2>카테고리 추가</h2>
          <button className="modal-close" onClick={handleClose}>
            ×
          </button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label>코드 *</label>
            <input
              type="text"
              value={cCode}
              onChange={(e) => setCCode(e.target.value.toUpperCase())}
              placeholder="예: BEAUTY, FASHION, FOOD"
            />
          </div>

          <div className="form-group">
            <label>이름 *</label>
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
