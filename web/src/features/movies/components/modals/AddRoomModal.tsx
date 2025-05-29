import {
    Button,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter, Switch,
} from "@heroui/react";
import { useState } from "react";

import { useAuth } from "@/context/authContext.tsx";

interface AddRoomModalProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
}

const AddRoomModal: React.FC<AddRoomModalProps> = ({
                                                       isOpen,
                                                       onOpenChange,
                                                   }) => {
    const { fetchWithAuth } = useAuth();
    const [form, setForm] = useState({
        name: "",
        capacity: "",
        rows: ""
    });

    const [isSelected, setIsSelected] = useState(true);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!form.name || !form.capacity) {
            return alert("Будь ласка, заповніть всі поля");
        }

        const roomData: Record<string, any> = {
            name: form.name,
            capacity: parseInt(form.capacity, 10),
        };

        if(isSelected && parseInt(form.rows,10) > 0) {
            roomData.rows = parseInt(form.rows);
        }

        try {
            await fetchWithAuth("/rooms", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(roomData),
            });

            onOpenChange(false);
            setForm({ name: "", capacity: "", rows: "" });
            setIsSelected(false);
        } catch (err) {
            alert("Помилка при створенні кімнати");
        }
    };

    return (
        <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
            <ModalContent>
                <ModalHeader>Додати нову кімнату</ModalHeader>
                <ModalBody>
                    <form className="space-y-4" onSubmit={handleSubmit}>
                        <input
                            required
                            className="w-full border p-2 rounded"
                            name="name"
                            placeholder="Назва кімнати"
                            type="text"
                            value={form.name}
                            onChange={handleChange}
                        />
                        <input
                            required
                            className="w-full border p-2 rounded"
                            name="capacity"
                            placeholder="Вмістимість кімнати"
                            type="number"
                            value={form.capacity}
                            onChange={handleChange}
                        />
                        <Switch isSelected={isSelected} onValueChange={setIsSelected}>
                            Автоматично заповнити залу місцями
                        </Switch>
                        <input
                            disabled={!isSelected}
                            className="w-full border p-2 rounded"
                            name="rows"
                            placeholder="Кількість рядів для заповнення"
                            type="number"
                            value={form.rows}
                            onChange={handleChange}
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

export default AddRoomModal;
