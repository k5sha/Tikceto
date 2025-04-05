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

interface AddMovieModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  refetch: () => void;
}

const AddMovieModal: React.FC<AddMovieModalProps> = ({
  isOpen,
  onOpenChange,
  refetch,
}) => {
  const { fetchWithAuth } = useAuth();
  const [form, setForm] = useState({
    title: "",
    description: "",
    duration: "",
    release_date: "",
    file: null as File | null,
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, file: e.target.files?.[0] || null });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.file) return alert("Будь ласка, оберіть постер");

    const formData = new FormData();

    formData.append("file", form.file);
    formData.append("title", form.title);
    formData.append("description", form.description);
    formData.append("duration", form.duration);
    formData.append("release_date", form.release_date);

    try {
      await fetchWithAuth("/movies", {
        method: "POST",
        body: formData,
      });

      onOpenChange(false);
      setForm({
        title: "",
        description: "",
        duration: "",
        release_date: "",
        file: null as File | null,
      });
      refetch();
    } catch (err) {
      alert("Помилка при створенні фільму");
    }
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
      <ModalContent>
        <ModalHeader>Додати новий фільм</ModalHeader>
        <ModalBody>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <input
              required
              className="w-full border p-2 rounded"
              name="title"
              placeholder="Назва"
              type="text"
              value={form.title}
              onChange={handleChange}
            />
            <textarea
              required
              className="w-full border p-2 rounded h-24"
              name="description"
              placeholder="Опис"
              value={form.description}
              onChange={handleChange}
            />
            <input
              required
              className="w-full border p-2 rounded"
              name="duration"
              placeholder="Тривалість (хв)"
              type="number"
              value={form.duration}
              onChange={handleChange}
            />
            <input
              required
              className="w-full border p-2 rounded"
              name="release_date"
              type="date"
              value={form.release_date}
              onChange={handleChange}
            />
            <input
              required
              accept="image/*"
              className="w-full"
              name="file"
              type="file"
              onChange={handleFileChange}
            />
            <ModalFooter className="flex justify-end gap-2">
              <Button
                color="danger"
                variant="flat"
                onPress={() => onOpenChange(false)}
              >
                Скасувати
              </Button>
              <Button color="primary" type="submit" variant="bordered">
                Створити
              </Button>
            </ModalFooter>
          </form>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default AddMovieModal;
