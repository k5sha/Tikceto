import {
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/react";
import { useState, useEffect } from "react";

import { useAuth } from "@/context/authContext.tsx";

interface EditMovieModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  movie: any; // Type this properly
  refetch: () => void;
}

const EditMovieModal: React.FC<EditMovieModalProps> = ({
  isOpen,
  onOpenChange,
  movie,
  refetch,
}) => {
  const { fetchWithAuth } = useAuth();
  const [form, setForm] = useState({
    title: movie.title || "",
    description: movie.description || "",
    duration: movie.duration || "",
    release_date: movie.release_date || "",
    file: null as File | null,
  });

  useEffect(() => {
    if (movie) {
      setForm({
        title: movie.title,
        description: movie.description,
        duration: movie.duration,
        release_date: movie.release_date,
        file: null,
      });
    }
  }, [movie]);

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
    const formData = new FormData();

    formData.append("title", form.title);
    formData.append("description", form.description);
    formData.append("duration", form.duration);
    formData.append("release_date", form.release_date);
    if (form.file) formData.append("file", form.file);

    try {
      await fetchWithAuth(`/movies/${movie.id}`, {
        method: "PATCH",
        body: formData,
      });

      onOpenChange(false);
      refetch();
    } catch (err) {
      alert("Помилка при оновленні фільму");
    }
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
      <ModalContent>
        <ModalHeader>Редагувати фільм</ModalHeader>
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
              value={new Date(form.release_date).toISOString().split("T")[0]}
              onChange={handleChange}
            />
            <input
              accept="image/*"
              className="w-full"
              name="file"
              type="file"
              onChange={handleFileChange}
            />
            <ModalFooter className="flex justify-end gap-2">
              <Button
                color="danger"
                variant="light"
                onPress={() => onOpenChange(false)}
              >
                Скасувати
              </Button>
              <Button color="primary" type="submit" onSubmit={handleSubmit}>
                Оновити
              </Button>
            </ModalFooter>
          </form>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default EditMovieModal;
