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
import { siteConfig } from "@/config/site.ts";

interface AddSessionModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  refetch: () => void;
  movieId: number;
}

const AddSessionModal: React.FC<AddSessionModalProps> = ({
  isOpen,
  onOpenChange,
  refetch,
  movieId,
}) => {
  const { fetchWithAuth } = useAuth();
  const [rooms, setRooms] = useState<any[]>([]);
  const [form, setForm] = useState({
    roomId: "",
    startTime: "",
    price: "",
  });

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const response = await fetch(`${siteConfig.server_api}/rooms/`);
        const data = await response.json();

        setRooms(data.data || []);
      } catch (error) {
        alert("Не вдалося завантажити кімнати");
      }
    };

    fetchRooms();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.roomId || !form.startTime || !form.price) {
      return alert("Будь ласка, заповніть всі поля");
    }

    try {
      const sessionData = {
        movie_id: movieId,
        room_id: parseInt(form.roomId),
        start_time: new Date(form.startTime).toISOString(),
        price: parseFloat(form.price),
      };

      await fetchWithAuth("/sessions", {
        method: "POST",
        body: JSON.stringify(sessionData),
      });

      onOpenChange(false);
      setForm({
        roomId: "",
        startTime: "",
        price: "",
      });

      refetch();
    } catch (err) {
      alert("Сталася помилка при створенні сесії");
    }
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
      <ModalContent>
        <ModalHeader>Додати нову сесію</ModalHeader>
        <ModalBody>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <select
              className="w-full border p-2 rounded"
              name="roomId"
              value={form.roomId}
              onChange={handleChange}
            >
              <option value="">Виберіть кімнату</option>
              {rooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.name} - {room.capacity} місць
                </option>
              ))}
            </select>

            <input
              required
              className="w-full border p-2 rounded"
              name="startTime"
              type="datetime-local"
              value={form.startTime}
              onChange={handleChange}
            />

            <input
              required
              className="w-full border p-2 rounded"
              name="price"
              placeholder="Ціна квитка"
              step="0.01"
              type="number"
              value={form.price}
              onChange={handleChange}
            />

            <ModalFooter className="flex justify-end gap-2">
              <Button
                color="primary"
                variant="flat"
                onPress={() => onOpenChange(false)}
              >
                Скасувати
              </Button>
              <Button color="danger" type="submit" variant="bordered">
                Створити
              </Button>
            </ModalFooter>
          </form>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default AddSessionModal;
