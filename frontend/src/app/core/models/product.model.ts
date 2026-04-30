export interface Category {
  id: string;
  name: string;
  parentId?: string;
  children?: Category[];
}

export interface ProductImage {
  id: string;
  url: string;
  isPrimary: boolean;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: string;
  cost?: string;
  stock: number;
  isActive: boolean;
  categoryId: string;
  category: Category;
  images: ProductImage[];
  createdAt: string;
}
