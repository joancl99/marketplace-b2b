import { Component, computed, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  adminOnly?: boolean;
}

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    CommonModule, RouterOutlet, RouterLink, RouterLinkActive,
    MatSidenavModule, MatToolbarModule, MatIconModule,
    MatButtonModule, MatBadgeModule, MatMenuModule, MatTooltipModule,
  ],
  templateUrl: './shell.component.html',
  styleUrls: ['./shell.component.scss'],
})
export class ShellComponent {
  auth = inject(AuthService);

  navItems: NavItem[] = [
    { label: 'Dashboard',  icon: 'bar_chart',            route: '/dashboard' },
    { label: 'Catálogo',   icon: 'inventory_2',          route: '/catalog' },
    { label: 'Carrito',    icon: 'shopping_cart',        route: '/cart' },
    { label: 'Wishlist',   icon: 'favorite',             route: '/wishlist' },
    { label: 'Pedidos',    icon: 'receipt_long',         route: '/orders' },
    { label: 'Productos',  icon: 'edit_note',            route: '/admin/products', adminOnly: true },
    { label: 'Gestión',    icon: 'admin_panel_settings', route: '/admin/orders',   adminOnly: true },
  ];

  visibleNav = computed(() =>
    this.navItems.filter(n => !n.adminOnly || this.auth.isAdmin())
  );

  logout() { this.auth.logout(); }
}
