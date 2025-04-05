import {
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/react";
import { useState } from "react";

import { useAuth } from "@/context/authContext.tsx";

interface DeleteSessionModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  sessionId: number;
  refetch: () => void;
}

const DeleteSessionModal: React.FC<DeleteSessionModalProps> = ({
  isOpen,
  onOpenChange,
  sessionId,
  refetch,
}) => {
  const { fetchWithAuth } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      await fetchWithAuth(`/sessions/${sessionId}`, {
        method: "DELETE",
      });

      setIsDeleting(false);
      onOpenChange(false);
      refetch();
    } catch (error) {
      setIsDeleting(false);
      alert("Помилка при видаленні сесії");
    }
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
      <ModalContent>
        <ModalHeader>Видалити сесію</ModalHeader>
        <ModalBody>
          <p>Ви впевнені, що хочете видалити цю сесію?</p>
        </ModalBody>
        <ModalFooter className="flex justify-end gap-2">
          <Button
            color="primary"
            variant="flat"
            onPress={() => onOpenChange(false)}
          >
            Скасувати
          </Button>
          <Button
            color="danger"
            disabled={isDeleting}
            variant="bordered"
            onPress={handleDelete}
          >
            {isDeleting ? "Видалення..." : "Видалити"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default DeleteSessionModal;
