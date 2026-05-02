import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-admin-products',
  imports: [
    CommonModule, ReactiveFormsModule,
    MatTableModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatSlideToggleModule, MatProgressSpinnerModule,
    MatTooltipModule, MatSnackBarModule,
  ],
  templateUrl: './products.html',
  styleUrl: './products.scss',
})
export class Products implements OnInit {
  private api    = inject(ApiService);
  private fb     = inject(FormBuilder);
  private snack  = inject(MatSnackBar);

  products     = signal<any[]>([]);
  categories   = signal<any[]>([]);
  loading      = signal(true);
  panelOpen    = signal(false);
  editing      = signal<any>(null);
  saving       = signal(false);
  searchTerm   = signal('');
  categoryId   = signal('');
  imageUrl     = signal('');
  productImages = signal<any[]>([]);

  filteredProducts = computed(() => {
    const term = this.searchTerm().toLowerCase();
    const cat  = this.categoryId();
    return this.products().filter(p => {
      const matchSearch = !term || p.name.toLowerCase().includes(term);
      const matchCat    = !cat  || p.categoryId === cat;
      return matchSearch && matchCat;
    });
  });

  form: FormGroup = this.fb.group({
    name:        ['', Validators.required],
    description: [''],
    price:       [null, [Validators.required, Validators.min(0.01)]],
    cost:        [null],
    stock:       [0, [Validators.required, Validators.min(0)]],
    isActive:    [true],
    categoryId:  ['', Validators.required],
  });

  readonly columns = ['status', 'name', 'category', 'price', 'stock', 'actions'];

  ngOnInit() {
    forkJoin({ products: this.api.getProducts(), categories: this.api.getCategories() })
      .subscribe({
        next: ({ products, categories }) => {
          this.products.set(products);
          this.categories.set(categories);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  openCreate() {
    this.editing.set(null);
    this.productImages.set([]);
    this.form.reset({ isActive: true, stock: 0 });
    this.panelOpen.set(true);
  }

  openEdit(product: any) {
    this.editing.set(product);
    this.productImages.set(product.images ?? []);
    this.form.patchValue({
      name:        product.name,
      description: product.description ?? '',
      price:       product.price,
      cost:        product.cost ?? null,
      stock:       product.stock,
      isActive:    product.isActive,
      categoryId:  product.categoryId,
    });
    this.panelOpen.set(true);
  }

  closePanel() {
    this.panelOpen.set(false);
    setTimeout(() => this.editing.set(null), 300);
  }

  save() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    const data    = this.form.value;
    const current = this.editing();
    const op      = current
      ? this.api.updateProduct(current.id, data)
      : this.api.createProduct(data);

    op.subscribe({
      next: (product) => {
        if (current) {
          this.products.update(list => list.map(p => p.id === product.id ? product : p));
        } else {
          this.products.update(list => [product, ...list]);
        }
        this.saving.set(false);
        this.closePanel();
        this.snack.open(current ? 'Producto actualizado' : 'Producto creado', '', { duration: 3000 });
      },
      error: () => this.saving.set(false),
    });
  }

  toggleActive(product: any) {
    this.api.updateProduct(product.id, { isActive: !product.isActive }).subscribe(updated =>
      this.products.update(list => list.map(p => p.id === updated.id ? updated : p))
    );
  }

  delete(product: any) {
    if (!confirm(`¿Eliminar "${product.name}"? Esta acción no se puede deshacer.`)) return;
    this.api.deleteProduct(product.id).subscribe({
      next: () => {
        this.products.update(list => list.filter(p => p.id !== product.id));
        this.snack.open('Producto eliminado', '', { duration: 3000 });
      },
      error: (err) => {
        const msg = err?.error?.message ?? 'No se pudo eliminar el producto';
        this.snack.open(msg, 'Cerrar', { duration: 6000 });
      },
    });
  }

  addImage() {
    const url     = this.imageUrl().trim();
    const product = this.editing();
    if (!url || !product) return;
    const isPrimary = this.productImages().length === 0;
    this.api.addProductImage(product.id, { url, isPrimary }).subscribe(img => {
      this.productImages.update(list => [...list, img]);
      this.imageUrl.set('');
      this.products.update(list => list.map(p =>
        p.id === product.id ? { ...p, images: [...(p.images ?? []), img] } : p
      ));
    });
  }

  removeImage(imageId: string) {
    const product = this.editing();
    if (!product) return;
    this.api.deleteProductImage(product.id, imageId).subscribe(() => {
      this.productImages.update(list => list.filter(i => i.id !== imageId));
      this.products.update(list => list.map(p =>
        p.id === product.id
          ? { ...p, images: (p.images ?? []).filter((i: any) => i.id !== imageId) }
          : p
      ));
    });
  }

  categoryName(id: string): string {
    return this.categories().find(c => c.id === id)?.name ?? '—';
  }

  primaryImage(product: any): string | null {
    const imgs = product.images ?? [];
    return imgs.find((i: any) => i.isPrimary)?.url ?? imgs[0]?.url ?? null;
  }
}
