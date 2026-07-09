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

export const ZONE = [
  { lat: 16.6866612, lng: -96.7196176 },
  { lat: 16.6729613, lng: -96.7204312 },
  { lat: 16.6755328, lng: -96.7018884 },
  { lat: 16.6741067, lng: -96.6826704 },
  { lat: 16.6760514, lng: -96.6667006 },
  { lat: 16.6919971, lng: -96.6671066 },
  { lat: 16.707812, lng: -96.6669712 },
  { lat: 16.7050196, lng: -96.6818193 },
  { lat: 16.7032048, lng: -96.694541 },
  { lat: 16.7025567, lng: -96.7071274 },
  { lat: 16.6943098, lng: -96.7138657 },
  { lat: 16.6866612, lng: -96.7196176 }
]
