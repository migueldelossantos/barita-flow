export type LicenseType = "DEMO" | "RENTA";

export type DeliveryMethod = "delivery" | "pickup" | "dine_in";

export type PaymentMethod = "cash" | "transfer";

export type OrderStatus =
  | "open"
  | "active"
  | "waiting"
  | "preparing"
  | "completed"
  | "delivered"
  | "finished";

export type ToppingMode =
  | "locked"
  | "default_included"
  | "required_choice"
  | "optional";

export const TOPPING_MODE_LABELS: Record<ToppingMode, string> = {
  locked: "Obligatorio (fijo)",
  default_included: "Incluido por defecto",
  required_choice: "Obligatorio para el cliente",
  optional: "Opcional",
};

export const DELIVERY_METHODS = ["delivery", "pickup", "dine_in"];

export const DELIVERY_METHOD_LABELS: Record<DeliveryMethod, string> = {
  delivery: "Envío a domicilio",
  pickup: "Pasar a recoger",
  dine_in: "Comer en establecimiento",
};

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  open: "Abierto",
  active: "Activo",
  waiting: "En espera",
  preparing: "En preparación",
  completed: "Completado",
  delivered: "Entregado",
  finished: "Terminado",
};

export const ORDER_STATUS_SEQUENCE: OrderStatus[] = [
  "active",
  "waiting",
  "preparing",
  "completed",
  "delivered",
  "finished",
];
