import type React from 'react';

interface CancelButtonProps {
  onClick: () => void;
}

const CancelSectionButton: React.FC<CancelButtonProps> = ({ onClick }) => {
  return (
    <button
      type={'button'}
      onClick={onClick}
      className={'btn btn-secondary w-full'}
    >
      Cancel
    </button>
  );
};

export default CancelSectionButton;
