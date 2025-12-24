import { login, TokenManager, ApiError } from './api';
import type { LoginRequest } from './types';

// Form Elements
const loginForm = document.getElementById('loginForm') as HTMLFormElement;
const phoneInput = document.getElementById('phone') as HTMLInputElement;
const passwordInput = document.getElementById('password') as HTMLInputElement;
const errorMessage = document.getElementById('errorMessage') as HTMLDivElement;
const submitBtn = document.getElementById('submitBtn') as HTMLButtonElement;
const btnText = submitBtn.querySelector('.btn-text') as HTMLSpanElement;
const btnLoader = submitBtn.querySelector('.btn-loader') as HTMLSpanElement;

// Check if already logged in
if (TokenManager.isAuthenticated()) {
  window.location.href = '/';
}

// Phone input formatting
phoneInput.addEventListener('input', (e) => {
  const target = e.target as HTMLInputElement;
  let value = target.value.replace(/\D/g, '');

  if (value.length > 10) {
    value = value.substring(0, 10);
  }

  target.value = value;
});

// Form validation
function validateForm(): string | null {
  const phone = phoneInput.value.trim();
  const password = passwordInput.value.trim();

  if (!phone) {
    return 'Telefon numarası gerekli';
  }

  if (phone.length < 10) {
    return 'Geçerli bir telefon numarası girin';
  }

  if (!password) {
    return 'Şifre gerekli';
  }

  if (password.length < 6) {
    return 'Şifre en az 6 karakter olmalı';
  }

  return null;
}

// Show error message
function showError(message: string) {
  errorMessage.textContent = message;
  errorMessage.classList.add('show');

  setTimeout(() => {
    errorMessage.classList.remove('show');
  }, 5000);
}

// Hide error message
function hideError() {
  errorMessage.classList.remove('show');
}

// Set loading state
function setLoading(isLoading: boolean) {
  submitBtn.disabled = isLoading;

  if (isLoading) {
    btnText.style.display = 'none';
    btnLoader.style.display = 'inline-block';
  } else {
    btnText.style.display = 'inline';
    btnLoader.style.display = 'none';
  }
}

// Handle form submission
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideError();

  // Validate form
  const validationError = validateForm();
  if (validationError) {
    showError(validationError);
    return;
  }

  // Prepare login data
  const loginData: LoginRequest = {
    phone: phoneInput.value.trim(),
    password: passwordInput.value.trim(),
  };

  try {
    setLoading(true);

    // Call login API
    const response = await login(loginData);

    // Save token
    TokenManager.set(response.jwtToken);

    // Redirect to home or dashboard
    window.location.href = '/';
  } catch (error) {
    if (error instanceof ApiError) {
      showError(error.message);
    } else {
      showError('Bir hata oluştu. Lütfen tekrar deneyin.');
    }
  } finally {
    setLoading(false);
  }
});

// Clear error on input change
[phoneInput, passwordInput].forEach(input => {
  input.addEventListener('input', hideError);
});
