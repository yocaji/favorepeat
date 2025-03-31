import React from 'react';
import { FaRegTrashAlt } from 'react-icons/fa';

interface DeleteButtonProps {
  onClick: () => void;
}

const DeleteSectionButton: React.FC<DeleteButtonProps> = ({ onClick }) => {
  return (
    <button
      type={'button'}
      onClick={onClick}
      className={'btn btn-secondary'}
    >
      <span className={'sr-only'}>Delete</span>
      <FaRegTrashAlt/>
    </button>
  );
};

export default DeleteSectionButton;
