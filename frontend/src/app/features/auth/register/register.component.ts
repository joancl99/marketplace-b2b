import { Component, inject } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink,
    MatFormFieldModule, MatInputModule, MatButtonModule,
    MatIconModule, MatSelectModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private snack = inject(MatSnackBar);

  loading = false;
  hidePassword = true;

  form = this.fb.group({
    name:     ['', Validators.required],
    email:    ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    company:  [''],
    role:     ['DISTRIBUTOR', Validators.required],
  });

  submit() {
    if (this.form.invalid || this.loading) return;
    this.loading = true;
    const { name, email, password, company, role } = this.form.value;
    this.auth.register({ name: name!, email: email!, password: password!, company: company || undefined }).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err) => {
        this.snack.open(err.error?.message || 'Error al registrar', 'OK', { duration: 3000 });
        this.loading = false;
      },
    });
  }
}
