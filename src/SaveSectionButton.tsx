import type React from 'react';

interface SaveButtonProps {
  onClick: () => void;
}

const SaveSectionButton: React.FC<SaveButtonProps> = ({ onClick }) => {
  return (
    <button
      type={'button'}
      onClick={onClick}
      className={'btn btn-secondary w-1/2'}
    >
      Save
    </button>
  );
};

export default SaveSectionButton;
