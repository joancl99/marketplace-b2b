import { Routes } from '@angular/router';
import { authGuard, adminGuard, guestGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent),
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent),
  },

  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/shell/shell.component').then(m => m.ShellComponent),
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard').then(m => m.Dashboard),
      },
      {
        path: 'catalog',
        loadComponent: () => import('./features/catalog/catalog').then(m => m.Catalog),
      },
      {
        path: 'catalog/:id',
        loadComponent: () => import('./features/catalog/product-detail/product-detail').then(m => m.ProductDetail),
      },
      {
        path: 'cart',
        loadComponent: () => import('./features/cart/cart').then(m => m.Cart),
      },
      {
        path: 'wishlist',
        loadComponent: () => import('./features/wishlist/wishlist').then(m => m.Wishlist),
      },
      {
        path: 'orders',
        loadComponent: () => import('./features/orders/orders').then(m => m.Orders),
      },
      {
        path: 'orders/:id',
        loadComponent: () => import('./features/orders/order-detail/order-detail').then(m => m.OrderDetail),
      },
      {
        path: 'admin',
        canActivate: [adminGuard],
        children: [
          {
            path: 'products',
            loadComponent: () => import('./features/admin/products/products').then(m => m.Products),
          },
          {
            path: 'orders',
            loadComponent: () => import('./features/admin/orders/orders').then(m => m.Orders),
          },
        ],
      },
    ],
  },

  { path: '**', redirectTo: 'dashboard' },
];
