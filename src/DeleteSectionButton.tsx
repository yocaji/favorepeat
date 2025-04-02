import { Button } from '@headlessui/react';
import type React from 'react';
import { FaRegTrashAlt } from 'react-icons/fa';

interface DeleteButtonProps {
  onClick: () => void;
}

const DeleteSectionButton: React.FC<DeleteButtonProps> = ({ onClick }) => {
  return (
    <Button
      onClick={onClick}
      className={
        'p-4 cursor-pointer rounded-lg text-white hover:bg-rose-800/20 active:bg-rose-800/20'
      }
    >
      <span className={'sr-only'}>Delete</span>
      <FaRegTrashAlt />
    </Button>
  );
};

export default DeleteSectionButton;
