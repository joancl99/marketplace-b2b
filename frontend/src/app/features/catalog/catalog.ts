import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { ThemeService } from '../../core/services/theme.service';

type SortKey = 'name' | 'price_asc' | 'price_desc' | 'stock';
type ViewMode = 'grid' | 'list';

@Component({
  selector: 'app-catalog',
  imports: [
    CommonModule, RouterLink, FormsModule,
    MatProgressSpinnerModule, MatSnackBarModule,
    MatTooltipModule, MatIconModule, MatButtonModule,
  ],
  templateUrl: './catalog.html',
  styleUrl: './catalog.scss',
})
export class Catalog implements OnInit {
  private api   = inject(ApiService);
  private snack = inject(MatSnackBar);
  theme         = inject(ThemeService);

  loading      = signal(true);
  products     = signal<any[]>([]);
  categories   = signal<any[]>([]);
  wishlistIds  = signal<Set<string>>(new Set());
  cartIds      = signal<Set<string>>(new Set());
  addingToCart = signal<Set<string>>(new Set());

  search           = signal('');
  selectedCategory = signal('');
  sort             = signal<SortKey>('name');
  view             = signal<ViewMode>('grid');

  readonly sorts: { key: SortKey; label: string }[] = [
    { key: 'name',       label: 'Name A–Z'  },
    { key: 'price_asc',  label: 'Price ↑'   },
    { key: 'price_desc', label: 'Price ↓'   },
    { key: 'stock',      label: 'Stock'      },
  ];

  filteredProducts = computed(() => {
    const term = this.search().toLowerCase();
    const cat  = this.selectedCategory();
    const s    = this.sort();

    let list = this.products().filter(p => p.isActive !== false);
    if (term) list = list.filter(p =>
      p.name.toLowerCase().includes(term) ||
      p.description?.toLowerCase().includes(term)
    );
    if (cat) list = list.filter(p => p.categoryId === cat);

    return list.sort((a, b) => {
      switch (s) {
        case 'price_asc':  return +a.price - +b.price;
        case 'price_desc': return +b.price - +a.price;
        case 'stock':      return b.stock - a.stock;
        default:           return a.name.localeCompare(b.name);
      }
    });
  });

  ngOnInit() {
    forkJoin({
      products:   this.api.getProducts(),
      categories: this.api.getCategories(),
      wishlist:   this.api.getWishlist(),
      cart:       this.api.getCart(),
    }).subscribe({
      next: ({ products, categories, wishlist, cart }) => {
        this.products.set(products);
        this.categories.set(categories);
        this.wishlistIds.set(new Set((wishlist as any[]).map(w => w.productId)));
        const items = (cart as any)?.items ?? [];
        this.cartIds.set(new Set(items.map((i: any) => i.productId)));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  toggleWishlist(product: any, e: Event) {
    e.stopPropagation(); e.preventDefault();
    const ids = new Set(this.wishlistIds());
    if (ids.has(product.id)) {
      this.api.removeFromWishlist(product.id).subscribe(() => {
        ids.delete(product.id);
        this.wishlistIds.set(new Set(ids));
      });
    } else {
      this.api.addToWishlist(product.id).subscribe(() => {
        ids.add(product.id);
        this.wishlistIds.set(new Set(ids));
        this.snack.open('Added to wishlist', '', { duration: 2000 });
      });
    }
  }

  addToCart(product: any, e: Event) {
    e.stopPropagation(); e.preventDefault();
    if (this.cartIds().has(product.id)) return;

    const adding = new Set(this.addingToCart());
    adding.add(product.id);
    this.addingToCart.set(new Set(adding));

    this.api.addToCart(product.id, 1).subscribe({
      next: () => {
        const cart = new Set(this.cartIds());
        cart.add(product.id);
        this.cartIds.set(new Set(cart));
        adding.delete(product.id);
        this.addingToCart.set(new Set(adding));
        this.snack.open('Added to cart', '', { duration: 2000 });
      },
      error: () => {
        adding.delete(product.id);
        this.addingToCart.set(new Set(adding));
      },
    });
  }

  primaryImage(product: any): string | null {
    const imgs = product.images ?? [];
    return imgs.find((i: any) => i.isPrimary)?.url ?? imgs[0]?.url ?? null;
  }

  categoryName(id: string): string {
    return this.categories().find(c => c.id === id)?.name ?? '';
  }

  stockClass(stock: number): string {
    if (stock === 0) return 'stock-out';
    if (stock <= 5)  return 'stock-low';
    return 'stock-ok';
  }

  stockLabel(stock: number): string {
    if (stock === 0) return 'Out of stock';
    if (stock <= 5)  return `Only ${stock} left`;
    return `${stock} in stock`;
  }

  inWishlist(id: string) { return this.wishlistIds().has(id); }
  inCart(id: string)     { return this.cartIds().has(id); }
  isAdding(id: string)   { return this.addingToCart().has(id); }
}
