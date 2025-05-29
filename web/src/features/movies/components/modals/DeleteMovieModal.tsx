import {
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/react";

import { useAuth } from "@/context/authContext.tsx";

interface DeleteMovieModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  movieId: string;
  navigate: (url: string) => void;
}

const DeleteMovieModal: React.FC<DeleteMovieModalProps> = ({
  isOpen,
  onOpenChange,
  movieId,
  navigate,
}) => {
  const { fetchWithAuth } = useAuth();

  const handleDelete = async () => {
    try {
      await fetchWithAuth(`/movies/${movieId}`, {
        method: "DELETE",
      });
      onOpenChange(false);
      navigate("/");
    } catch (err) {
      alert("Помилка при видаленні фільму");
    }
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
      <ModalContent>
        <ModalHeader>Видалити фільм</ModalHeader>
        <ModalBody>
          <p>Ви впевнені, що хочете видалити цей фільм?</p>
        </ModalBody>
        <ModalFooter className="flex justify-end gap-2">
          <Button
            color="primary"
            variant="light"
            onPress={() => onOpenChange(false)}
          >
            Скасувати
          </Button>
          <Button color="danger" onPress={handleDelete}>
            Видалити
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default DeleteMovieModal;
