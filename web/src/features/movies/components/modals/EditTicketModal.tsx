import {
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/react";
import React, { useState, useEffect } from "react";
import { toast } from "sonner";

import { useAuth } from "@/context/authContext.tsx";
import {
  StatusBadge,
  statusLabels,
  TicketStatus,
} from "@/features/tickets/components/StatusBadge";

interface TicketResponse {
  data: {
    id: number;
    price: number;
    status: TicketStatus;
    seat: {
      seat_number: string;
    };
    user_id: number;
  };
}

interface EditTicketModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  sessionId: number;
  seatId: number;
  refetch: () => void;
}

const EditTicketModal: React.FC<EditTicketModalProps> = ({
  isOpen,
  onOpenChange,
  sessionId,
  seatId,
  refetch,
}) => {
  const { fetchWithAuth } = useAuth();

  const [ticket, setTicket] = useState<{
    id: number | null;
    seatNumber: string;
    price: number;
    status: TicketStatus;
    originalStatus: TicketStatus;
    userId: number | null;
  }>({
    id: null,
    seatNumber: "",
    price: 0,
    status: "available",
    originalStatus: "available",
    userId: null,
  });

  const [loading, setLoading] = useState(false);

  const {
    isOpen: isDeleteModalOpen,
    onOpen: openDeleteModal,
    onOpenChange: onDeleteModalChange,
  } = useDisclosure();

  const fetchTicket = async () => {
    try {
      const { data } = await fetchWithAuth<TicketResponse>(
        `/tickets/session/${sessionId}/seat/${seatId}`,
        { method: "GET" }
      );

      setTicket({
        id: data.id,
        seatNumber: data.seat.seat_number,
        price: data.price,
        status: data.status,
        originalStatus: data.status,
        userId: data.user_id,
      });
    } catch (err) {
      toast.error("Не вдалося завантажити дані квитка.");
    }
  };

  useEffect(() => {
    if (sessionId && seatId && isOpen) {
      fetchTicket();
    }
  }, [sessionId, seatId, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticket.id || loading) return;

    const isToDelete =
      ["available", "cancelled", "refunded"].includes(ticket.status) &&
      ticket.originalStatus !== "available";

    if (isToDelete) {
      openDeleteModal();
      return;
    }

    await updateTicket();
  };

  const updateTicket = async () => {
    if (!ticket.id) return;

    setLoading(true);
    try {
      await fetchWithAuth(`/tickets/${ticket.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          price: ticket.price,
          status: ticket.status,
        }),
      });

      toast.success("Квиток успішно оновлений!");
      refetch();
      onOpenChange(false);
    } catch (err) {
      toast.error("Помилка при оновленні квитка.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!ticket.id) return;

    setLoading(true);
    try {
      await fetchWithAuth(`/tickets/${ticket.id}`, {
        method: "DELETE",
      });

      toast.success("Квиток видалено, місце стало доступним.");
      refetch();
      onDeleteModalChange();
      onOpenChange(false);
    } catch (err) {
      toast.error("Не вдалося видалити квиток.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent className="rounded-xl bg-white shadow-xl">
          <ModalHeader className="text-center text-xl font-semibold text-blue-700">
            Редагування квитка
          </ModalHeader>
          <ModalBody>
            <div className="mb-4 bg-gray-50 p-3 rounded-lg shadow-sm">
              <p className="text-sm text-gray-700 space-y-1">
                <span className="block">
                  <span className="font-semibold">Місце:</span> {ticket.seatNumber}
                </span>
                <span className="block">
                  <span className="font-semibold">ID користувача:</span>{" "}
                  {ticket.userId ?? "—"}
                </span>
              </p>
              <p className="flex items-center text-sm font-medium mt-2">
                <StatusBadge status={ticket.status} />
              </p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-600">
                  Ціна
                </label>
                <input
                  id="price"
                  required
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  type="number"
                  value={ticket.price}
                  onChange={(e) =>
                    setTicket((prev) => ({ ...prev, price: Number(e.target.value) }))
                  }
                />
              </div>

              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-600">
                  Статус
                </label>
                <select
                  id="status"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={ticket.status}
                  onChange={(e) =>
                    setTicket((prev) => ({
                      ...prev,
                      status: e.target.value as TicketStatus,
                    }))
                  }
                >
                  {(Object.entries(statusLabels) as [TicketStatus, string][]).map(
                    ([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    )
                  )}
                </select>
              </div>

              <ModalFooter className="flex justify-end gap-3 pt-4">
                <Button variant="light" onPress={() => onOpenChange(false)}>
                  Скасувати
                </Button>
                <Button color="primary" isLoading={loading} type="submit">
                  Зберегти
                </Button>
              </ModalFooter>
            </form>
          </ModalBody>
        </ModalContent>
      </Modal>

      <Modal isOpen={isDeleteModalOpen} onOpenChange={onDeleteModalChange}>
        <ModalContent className="bg-white rounded-xl shadow-lg">
          <ModalHeader className="text-lg font-semibold text-red-600">
            Підтвердження видалення
          </ModalHeader>
            <ModalBody className="text-sm inline-block text-gray-700">
            Ви хочете змінити статус на{" "}
            <span className="font-bold">&#34;{statusLabels[ticket.status]}&#34;</span>? Квиток буде{" "}
            <span className="font-bold">видалено</span>, і місце стане вільним.
          </ModalBody>
          <ModalFooter className="flex justify-end gap-3">
            <Button variant="light" onPress={onDeleteModalChange}>
              Скасувати
            </Button>
            <Button color="danger" isLoading={loading} onPress={handleConfirmDelete}>
              Так, видалити
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default EditTicketModal;
