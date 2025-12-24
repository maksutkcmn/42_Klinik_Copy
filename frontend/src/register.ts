import { register, TokenManager, ApiError } from './api';
import type { RegisterRequest } from './types';

// Form Elements
const registerForm = document.getElementById('registerForm') as HTMLFormElement;
const fullNameInput = document.getElementById('fullName') as HTMLInputElement;
const emailInput = document.getElementById('email') as HTMLInputElement;
const phoneInput = document.getElementById('phone') as HTMLInputElement;
const passwordInput = document.getElementById('password') as HTMLInputElement;
const confirmPasswordInput = document.getElementById('confirmPassword') as HTMLInputElement;
const errorMessage = document.getElementById('errorMessage') as HTMLDivElement;
const successMessage = document.getElementById('successMessage') as HTMLDivElement;
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

// Email validation
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Form validation
function validateForm(): string | null {
  const fullName = fullNameInput.value.trim();
  const email = emailInput.value.trim();
  const phone = phoneInput.value.trim();
  const password = passwordInput.value.trim();
  const confirmPassword = confirmPasswordInput.value.trim();

  if (!fullName) {
    return 'Ad Soyad gerekli';
  }

  const nameParts = fullName.split(' ').filter(part => part.length > 0);

  if (nameParts.length < 2) {
    return 'Lütfen hem adınızı hem soyadınızı girin';
  }

  if (nameParts.some(part => part.length < 2)) {
    return 'Ad ve soyad en az 2 karakter olmalı';
  }

  if (!email) {
    return 'E-posta gerekli';
  }

  if (!isValidEmail(email)) {
    return 'Geçerli bir e-posta adresi girin';
  }

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

  if (!confirmPassword) {
    return 'Şifre tekrarı gerekli';
  }

  if (password !== confirmPassword) {
    return 'Şifreler eşleşmiyor';
  }

  return null;
}

// Show error message
function showError(message: string) {
  hideSuccess();
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

// Show success message
function showSuccess(message: string) {
  hideError();
  successMessage.textContent = message;
  successMessage.classList.add('show');
}

// Hide success message
function hideSuccess() {
  successMessage.classList.remove('show');
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
registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideError();
  hideSuccess();

  // Validate form
  const validationError = validateForm();
  if (validationError) {
    showError(validationError);
    return;
  }

  // Prepare register data
  const fullName = fullNameInput.value.trim();
  const nameParts = fullName.split(' ').filter(part => part.length > 0);
  const name = nameParts[0];
  const surname = nameParts.slice(1).join(' ');

  const registerData: RegisterRequest = {
    name: name,
    surname: surname,
    email: emailInput.value.trim(),
    phone: phoneInput.value.trim(),
    password: passwordInput.value.trim(),
  };

  try {
    setLoading(true);

    // Call register API
    const response = await register(registerData);

    // Show success message
    showSuccess(response.message + ' - Giriş sayfasına yönlendiriliyorsunuz...');

    // Reset form
    registerForm.reset();

    // Redirect to login after 2 seconds
    setTimeout(() => {
      window.location.href = '/login.html';
    }, 2000);
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
[fullNameInput, emailInput, phoneInput, passwordInput, confirmPasswordInput].forEach(input => {
  input.addEventListener('input', () => {
    hideError();
    hideSuccess();
  });
});
