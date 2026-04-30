import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';

const API = 'http://localhost:3000';

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private http: HttpClient) {}

  // ─── Products ───────────────────────────────────────────────────────────────
  getProducts(filters?: any) {
    let params = new HttpParams();
    if (filters) Object.entries(filters).forEach(([k, v]) => v !== undefined && v !== '' && (params = params.set(k, String(v))));
    return this.http.get<any[]>(`${API}/products`, { params });
  }
  getProduct(id: string)             { return this.http.get<any>(`${API}/products/${id}`); }
  createProduct(data: any)           { return this.http.post<any>(`${API}/products`, data); }
  updateProduct(id: string, data: any) { return this.http.patch<any>(`${API}/products/${id}`, data); }
  deleteProduct(id: string)          { return this.http.delete<any>(`${API}/products/${id}`); }

  // ─── Categories ─────────────────────────────────────────────────────────────
  getCategories()                    { return this.http.get<any[]>(`${API}/categories`); }
  createCategory(data: any)          { return this.http.post<any>(`${API}/categories`, data); }
  updateCategory(id: string, d: any) { return this.http.patch<any>(`${API}/categories/${id}`, d); }
  deleteCategory(id: string)         { return this.http.delete<any>(`${API}/categories/${id}`); }

  // ─── Cart ───────────────────────────────────────────────────────────────────
  getCart()                          { return this.http.get<any>(`${API}/cart`); }
  addToCart(productId: string, quantity: number) { return this.http.post<any>(`${API}/cart`, { productId, quantity }); }
  updateCartItem(productId: string, quantity: number) { return this.http.patch<any>(`${API}/cart/${productId}`, { quantity }); }
  removeFromCart(productId: string)  { return this.http.delete<any>(`${API}/cart/${productId}`); }
  clearCart()                        { return this.http.delete<any>(`${API}/cart/clear`); }

  // ─── Wishlist ───────────────────────────────────────────────────────────────
  getWishlist()                      { return this.http.get<any[]>(`${API}/wishlist`); }
  addToWishlist(productId: string)   { return this.http.post<any>(`${API}/wishlist`, { productId }); }
  removeFromWishlist(productId: string) { return this.http.delete<any>(`${API}/wishlist/${productId}`); }

  // ─── Orders ─────────────────────────────────────────────────────────────────
  checkout()                         { return this.http.post<any>(`${API}/orders/checkout`, {}); }
  getOrders()                        { return this.http.get<any[]>(`${API}/orders`); }
  getOrder(id: string)               { return this.http.get<any>(`${API}/orders/${id}`); }
  updateOrderStatus(id: string, status: string) { return this.http.patch<any>(`${API}/orders/${id}/status`, { status }); }

  // ─── Analytics ──────────────────────────────────────────────────────────────
  getDashboard()                     { return this.http.get<any>(`${API}/analytics/dashboard`); }
  getTopProducts(params?: any)       { return this.http.get<any[]>(`${API}/analytics/top-products`, { params }); }
  getSales(params?: any)             { return this.http.get<any>(`${API}/analytics/sales`, { params }); }
  getDemand(params?: any)            { return this.http.get<any[]>(`${API}/analytics/demand`, { params }); }
  getProfitability(params?: any)     { return this.http.get<any[]>(`${API}/analytics/profitability`, { params }); }
  getReturns(params?: any)           { return this.http.get<any[]>(`${API}/analytics/returns`, { params }); }

  // ─── Users ──────────────────────────────────────────────────────────────────
  getMe()                            { return this.http.get<any>(`${API}/users/me`); }
  getUsers()                         { return this.http.get<any[]>(`${API}/users`); }
}
