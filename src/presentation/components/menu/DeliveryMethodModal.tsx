"use client";

import type { DeliveryMethod } from "@/domain/enums";
import { DELIVERY_METHOD_LABELS } from "@/domain/enums";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";

const METHODS: DeliveryMethod[] = ["delivery", "pickup", "dine_in"];

interface DeliveryMethodModalProps {
  open: boolean;
  onSelect: (method: DeliveryMethod) => void;
}

export function DeliveryMethodModal({ open, onSelect }: DeliveryMethodModalProps) {
  return (
    <Modal open={open} closable={false} title="¿Cómo deseas recibir tu pedido?">
      <div className="flex flex-col gap-3">
        {METHODS.map((method) => (
          <Button
            key={method}
            variant="blue"
            fullWidth
            size="lg"
            onClick={() => onSelect(method)}
          >
            {DELIVERY_METHOD_LABELS[method]}
          </Button>
        ))}
      </div>
    </Modal>
  );
}
