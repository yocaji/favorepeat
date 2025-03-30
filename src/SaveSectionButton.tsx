import React from 'react';

interface SaveButtonProps {
  onClick: () => void;
}

const SaveSectionButton: React.FC<SaveButtonProps> = ({ onClick }) => {
  return (
    <button
      type={'button'}
      onClick={onClick}
      className={'btn btn-primary w-full'}
    >
      Save
    </button>
  );
};

export default SaveSectionButton;
