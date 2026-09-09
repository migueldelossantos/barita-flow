import type { ToppingMode } from "../enums";

export interface Category {
  id: string;
  companyId: string;
  name: string;
  shortName: string;
  description: string | null;
  sortOrder: number;
}

export interface Product {
  id: string;
  companyId: string;
  categoryId: string | null;
  code: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  isActive: boolean;
  isBestseller: boolean;
  salesCount: number;
}

export interface ProductTopping {
  id: string;
  productId: string;
  name: string;
  mode: ToppingMode;
  sortOrder: number;
  variantId: string;
  maxSelectable: number;
}

export interface ProductVariant {
  id: string;
  name: string,
  price: number
}

export interface ProductOptionValue { id: string; name: string; priceAdjustment: number; sortOrder: number; }
export interface ProductOptionGroup { id: string; name: string; selectionType: "required" | "optional" | "multiple"; minSelections: number; maxSelections: number; sortOrder: number; options: ProductOptionValue[]; }

export interface ProductWithDetails extends Product {
  variants: ProductVariant[];
  optionGroups: ProductOptionGroup[];
  toppings: ProductTopping[];
  addonProducts: Product[];
  category: Category | null;
}
