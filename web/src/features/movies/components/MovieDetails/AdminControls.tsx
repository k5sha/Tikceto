import React from "react";
import { motion } from "framer-motion";
import { Button } from "@heroui/button";
import { Plus, Edit, Trash } from "lucide-react";


interface AdminControlsProps {
  selectedSession: number | null;
  onOpenAddSessionModal: () => void;
  onOpenEditModal: () => void;
  onOpenDeleteModal: () => void;
  onOpenSessionDeleteModal: () => void;
}

const AdminControls: React.FC<AdminControlsProps> = ({
  selectedSession,
  onOpenAddSessionModal,
  onOpenEditModal,
  onOpenDeleteModal,
  onOpenSessionDeleteModal,
}) => {
  return (
    <motion.div
      animate={{ opacity: 1 }}
      initial={{ opacity: 0 }}
      transition={{ delay: 0.3, duration: 0.6 }}
      className="flex flex-col md:flex-row items-center gap-8"
    >
      <Button
        color="secondary"
        startContent={<Plus />}
        variant="bordered"
        onPress={onOpenAddSessionModal}
      >
        Додати сеанс
      </Button>
      <Button
        color="warning"
        startContent={<Edit />}
        variant="bordered"
        onPress={onOpenEditModal}
      >
        Редагувати фільм
      </Button>
      <Button
        color="danger"
        startContent={<Trash />}
        variant="bordered"
        onPress={onOpenDeleteModal}
      >
        Видалити фільм
      </Button>
      <Button
        color="danger"
        disabled={!(selectedSession && selectedSession > 0)}
        startContent={<Trash />}
        variant="bordered"
        onPress={onOpenSessionDeleteModal}
      >
        Видалити сеанс
      </Button>
    </motion.div>
  );
};

export default AdminControls;