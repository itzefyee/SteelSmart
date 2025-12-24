import { supabase } from '@/lib/supabase';
import { ValidationError } from '@/lib/errors/app-errors';

export interface SignUpData {
  email: string;
  password: string;
  company?: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export interface AuthResult {
  user: any;
  session?: any;
}

export interface SignOutResult {
  success: boolean;
}

export class AuthService {
  async signUp(data: SignUpData): Promise<AuthResult> {
    // Validate input
    this.validateEmail(data.email);
    this.validatePassword(data.password);

    const { data: result, error } = await supabase.auth.signUp({
      email: data.email.trim(),
      password: data.password,
      options: {
        data: data.company ? { company: data.company } : {}
      }
    });

    if (error) {
      throw new Error(error.message);
    }

    return {
      user: result.user,
      session: result.session
    };
  }

  async signIn(data: SignInData): Promise<AuthResult> {
    // Validate input
    this.validateEmail(data.email);
    this.validatePassword(data.password);

    const { data: result, error } = await supabase.auth.signInWithPassword({
      email: data.email.trim(),
      password: data.password
    });

    if (error) {
      throw new Error(error.message);
    }

    return {
      user: result.user,
      session: result.session
    };
  }

  async signOut(): Promise<SignOutResult> {
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw new Error(error.message);
    }

    return { success: true };
  }

  private validateEmail(email: string): void {
    if (!email || email.trim() === '') {
      throw new ValidationError('Email is required');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      throw new ValidationError('Invalid email format');
    }
  }

  private validatePassword(password: string): void {
    if (!password || password === '') {
      throw new ValidationError('Password is required');
    }

    // Password strength requirements:
    // - Length between 8-12 characters
    // - At least one uppercase letter
    // - At least one lowercase letter
    // - At least one special character
    if (password.length < 8) {
      throw new ValidationError('Password must be at least 8 characters long');
    }

    if (password.length > 12) {
      throw new ValidationError('Password must be no more than 12 characters long');
    }

    if (!/[A-Z]/.test(password)) {
      throw new ValidationError('Password must contain at least one uppercase letter');
    }

    if (!/[a-z]/.test(password)) {
      throw new ValidationError('Password must contain at least one lowercase letter');
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      throw new ValidationError('Password must contain at least one special character');
    }
  }
}