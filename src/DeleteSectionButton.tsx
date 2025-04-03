import { Button } from '@headlessui/react';
import type React from 'react';
import { FaRegTrashAlt } from 'react-icons/fa';

interface DeleteButtonProps {
  onClick: () => void;
}

const DeleteSectionButton: React.FC<DeleteButtonProps> = ({ onClick }) => {
  return (
    <Button onClick={onClick} className={'btn btn-transparent'}>
      <span className={'sr-only'}>Delete</span>
      <FaRegTrashAlt />
    </Button>
  );
};

export default DeleteSectionButton;
