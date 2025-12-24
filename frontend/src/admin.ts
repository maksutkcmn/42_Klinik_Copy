import './style.css'
import { TokenManager, getUserRole, getDoctors, ApiError } from './api'
import type { Doctor } from './types'

// Check if user is authenticated and is admin
if (!TokenManager.isAuthenticated()) {
  window.location.href = '/login.html';
} else {
  checkAdminAccess();
}

async function checkAdminAccess() {
  try {
    const roleResponse = await getUserRole();
    if (roleResponse.userRole !== 'admin') {
      alert('Bu sayfaya erişim yetkiniz yok!');
      window.location.href = '/index.html';
      return;
    }
    initAdminPanel();
  } catch (error) {
    console.error('Failed to verify admin access:', error);
    alert('Yetki kontrolü başarısız oldu!');
    window.location.href = '/index.html';
  }
}

async function initAdminPanel() {
  const app = document.querySelector<HTMLDivElement>('#app')!;

  app.innerHTML = `
    <div style="min-height: 100vh; background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%); padding: 0;">
      <!-- Header -->
      <header style="background: rgba(26, 26, 46, 0.95); backdrop-filter: blur(10px); border-bottom: 1px solid #2a2a4a; padding: 20px 40px; position: sticky; top: 0; z-index: 1000;">
        <div style="max-width: 1600px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <h1 style="font-size: 32px; color: #fff; margin: 0; font-weight: 700; background: linear-gradient(135deg, #f59e0b 0%, #ea580c 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">⚙️ Admin Panel</h1>
            <p style="color: #888; margin: 4px 0 0 0; font-size: 14px;">Sistem Yönetimi</p>
          </div>
          <div style="display: flex; gap: 12px;">
            <button id="backToHomeBtn" style="background: rgba(102, 126, 234, 0.1); color: #667eea; border: 2px solid #667eea; padding: 12px 28px; border-radius: 8px; font-size: 15px; font-weight: 600; cursor: pointer; transition: all 0.3s ease;">
              ← Ana Sayfa
            </button>
            <button id="logoutBtn" style="background: rgba(220, 53, 69, 0.1); color: #dc3545; border: 2px solid #dc3545; padding: 12px 28px; border-radius: 8px; font-size: 15px; font-weight: 600; cursor: pointer; transition: all 0.3s ease;">
              Çıkış Yap
            </button>
          </div>
        </div>
      </header>

      <!-- Main Content -->
      <main style="max-width: 1600px; margin: 0 auto; padding: 40px;">
        <!-- Tab Navigation -->
        <div style="display: flex; gap: 16px; margin-bottom: 32px; border-bottom: 2px solid #2a2a4a; padding-bottom: 16px;">
          <button id="tabAddDoctor" class="admin-tab active" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #fff; border: none; padding: 12px 28px; border-radius: 8px; font-size: 15px; font-weight: 600; cursor: pointer; transition: all 0.3s ease;">
            👨‍⚕️ Doktor Ekle
          </button>
          <button id="tabDoctors" class="admin-tab" style="background: rgba(102, 126, 234, 0.1); color: #667eea; border: 2px solid transparent; padding: 12px 28px; border-radius: 8px; font-size: 15px; font-weight: 600; cursor: pointer; transition: all 0.3s ease;">
            📋 Doktorlar
          </button>
        </div>

        <!-- Tab Content Container -->
        <div id="tabContent"></div>
      </main>
    </div>
  `;

  const logoutBtn = document.getElementById('logoutBtn')!;
  const backToHomeBtn = document.getElementById('backToHomeBtn')!;
  const tabAddDoctor = document.getElementById('tabAddDoctor')!;
  const tabDoctors = document.getElementById('tabDoctors')!;

  logoutBtn.addEventListener('click', logout);
  backToHomeBtn.addEventListener('click', () => {
    window.location.href = '/index.html';
  });

  // Tab switching
  tabAddDoctor.addEventListener('click', () => {
    setActiveTab('addDoctor');
  });

  tabDoctors.addEventListener('click', () => {
    setActiveTab('doctors');
  });

  // Hover effects
  logoutBtn.addEventListener('mouseenter', (e) => {
    (e.target as HTMLButtonElement).style.background = '#dc3545';
    (e.target as HTMLButtonElement).style.color = '#fff';
  });
  logoutBtn.addEventListener('mouseleave', (e) => {
    (e.target as HTMLButtonElement).style.background = 'rgba(220, 53, 69, 0.1)';
    (e.target as HTMLButtonElement).style.color = '#dc3545';
  });

  backToHomeBtn.addEventListener('mouseenter', (e) => {
    (e.target as HTMLButtonElement).style.background = '#667eea';
    (e.target as HTMLButtonElement).style.color = '#fff';
  });
  backToHomeBtn.addEventListener('mouseleave', (e) => {
    (e.target as HTMLButtonElement).style.background = 'rgba(102, 126, 234, 0.1)';
    (e.target as HTMLButtonElement).style.color = '#667eea';
  });

  // Show add doctor tab by default
  setActiveTab('addDoctor');
}

function setActiveTab(tab: 'addDoctor' | 'doctors') {
  const tabAddDoctor = document.getElementById('tabAddDoctor')!;
  const tabDoctors = document.getElementById('tabDoctors')!;

  // Reset all tabs
  [tabAddDoctor, tabDoctors].forEach(btn => {
    btn.style.background = 'rgba(102, 126, 234, 0.1)';
    btn.style.color = '#667eea';
    btn.style.border = '2px solid transparent';
  });

  // Set active tab
  if (tab === 'addDoctor') {
    tabAddDoctor.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    tabAddDoctor.style.color = '#fff';
    tabAddDoctor.style.border = 'none';
    showAddDoctorForm();
  } else if (tab === 'doctors') {
    tabDoctors.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    tabDoctors.style.color = '#fff';
    tabDoctors.style.border = 'none';
    loadDoctors();
  }
}

function showAddDoctorForm() {
  const tabContent = document.getElementById('tabContent')!;

  tabContent.innerHTML = `
    <div style="background: rgba(26, 26, 46, 0.6); backdrop-filter: blur(10px); border: 1px solid #2a2a4a; border-radius: 16px; padding: 32px; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3); max-width: 600px;">
      <h2 style="font-size: 24px; color: #fff; margin: 0 0 24px 0; font-weight: 600;">Yeni Doktor Ekle</h2>

      <form id="addDoctorForm" style="display: flex; flex-direction: column; gap: 20px;">
        <div>
          <label style="color: #aaa; font-size: 14px; display: block; margin-bottom: 8px;">Doktor Adı</label>
          <input
            type="text"
            id="doctorName"
            required
            style="width: 100%; max-width: 100%; box-sizing: border-box; background: rgba(40, 40, 60, 0.8); border: 1px solid #3a3a5a; color: #fff; padding: 12px 16px; border-radius: 8px; font-size: 15px; outline: none; transition: all 0.3s ease;"
            placeholder="Örn: Dr. Ahmet Yılmaz"
          />
        </div>

        <div>
          <label style="color: #aaa; font-size: 14px; display: block; margin-bottom: 8px;">Uzmanlık Alanı</label>
          <input
            type="text"
            id="doctorExpertise"
            required
            style="width: 100%; max-width: 100%; box-sizing: border-box; background: rgba(40, 40, 60, 0.8); border: 1px solid #3a3a5a; color: #fff; padding: 12px 16px; border-radius: 8px; font-size: 15px; outline: none; transition: all 0.3s ease;"
            placeholder="Örn: Kardiyoloji"
          />
        </div>

        <div>
          <label style="color: #aaa; font-size: 14px; display: block; margin-bottom: 8px;">Cinsiyet</label>
          <select
            id="doctorGender"
            required
            style="width: 100%; max-width: 100%; box-sizing: border-box; background: rgba(40, 40, 60, 0.8); border: 1px solid #3a3a5a; color: #fff; padding: 12px 16px; border-radius: 8px; font-size: 15px; outline: none; transition: all 0.3s ease; cursor: pointer;"
          >
            <option value="">Seçiniz</option>
            <option value="male">Erkek</option>
            <option value="female">Kadın</option>
          </select>
        </div>

        <button
          type="submit"
          style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #fff; border: none; padding: 14px 28px; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4); margin-top: 8px;"
        >
          ✓ Doktor Ekle
        </button>
      </form>

      <div id="addDoctorMessage" style="margin-top: 20px;"></div>
    </div>
  `;

  const form = document.getElementById('addDoctorForm') as HTMLFormElement;
  form.addEventListener('submit', handleAddDoctor);

  // Add focus effects to inputs
  const inputs = form.querySelectorAll('input, select');
  inputs.forEach(input => {
    input.addEventListener('focus', () => {
      (input as HTMLElement).style.borderColor = '#667eea';
      (input as HTMLElement).style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.2)';
    });
    input.addEventListener('blur', () => {
      (input as HTMLElement).style.borderColor = '#3a3a5a';
      (input as HTMLElement).style.boxShadow = 'none';
    });
  });

  // Add hover effect to submit button
  const submitBtn = form.querySelector('button[type="submit"]') as HTMLButtonElement;
  submitBtn.addEventListener('mouseenter', (e) => {
    (e.target as HTMLButtonElement).style.transform = 'translateY(-2px)';
    (e.target as HTMLButtonElement).style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.6)';
  });
  submitBtn.addEventListener('mouseleave', (e) => {
    (e.target as HTMLButtonElement).style.transform = 'translateY(0)';
    (e.target as HTMLButtonElement).style.boxShadow = '0 4px 15px rgba(16, 185, 129, 0.4)';
  });
}

async function handleAddDoctor(e: Event) {
  e.preventDefault();

  const nameInput = document.getElementById('doctorName') as HTMLInputElement;
  const expertiseInput = document.getElementById('doctorExpertise') as HTMLInputElement;
  const genderSelect = document.getElementById('doctorGender') as HTMLSelectElement;
  const messageDiv = document.getElementById('addDoctorMessage')!;

  const doctorData = {
    name: nameInput.value.trim(),
    expertise: expertiseInput.value.trim(),
    gender: genderSelect.value
  };

  if (!doctorData.name || !doctorData.expertise || !doctorData.gender) {
    messageDiv.innerHTML = `
      <div style="background: rgba(220, 53, 69, 0.1); border: 1px solid #dc3545; color: #dc3545; padding: 16px; border-radius: 8px;">
        ⚠️ Lütfen tüm alanları doldurun!
      </div>
    `;
    return;
  }

  try {
    const token = TokenManager.get();
    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5084'}/api/add/doctor`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(doctorData)
    });

    const data = await response.json();

    if (response.ok) {
      messageDiv.innerHTML = `
        <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid #10b981; color: #10b981; padding: 16px; border-radius: 8px;">
          ✓ Doktor başarıyla eklendi!
        </div>
      `;
      // Reset form
      nameInput.value = '';
      expertiseInput.value = '';
      genderSelect.value = '';
    } else {
      throw new Error(data.message || 'Doktor eklenemedi');
    }
  } catch (error) {
    messageDiv.innerHTML = `
      <div style="background: rgba(220, 53, 69, 0.1); border: 1px solid #dc3545; color: #dc3545; padding: 16px; border-radius: 8px;">
        ⚠️ Hata: ${error instanceof Error ? error.message : 'Bir hata oluştu'}
      </div>
    `;
  }
}

async function loadDoctors() {
  const tabContent = document.getElementById('tabContent')!;

  tabContent.innerHTML = `
    <div style="background: rgba(26, 26, 46, 0.6); backdrop-filter: blur(10px); border: 1px solid #2a2a4a; border-radius: 16px; padding: 32px; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 28px;">
        <h2 style="font-size: 26px; color: #fff; margin: 0; font-weight: 600;">Tüm Doktorlar</h2>
        <div style="color: #888; font-size: 14px;" id="doctorCount">Yükleniyor...</div>
      </div>
      <div id="doctorsContainer">
        <div style="text-align: center; padding: 60px; color: #888;">
          <div style="font-size: 18px; margin-bottom: 12px;">⏳</div>
          <div style="font-size: 16px;">Doktorlar yükleniyor...</div>
        </div>
      </div>
    </div>
  `;

  try {
    const response = await getDoctors();
    const doctors = response.doctor;
    const doctorCount = document.getElementById('doctorCount')!;
    const container = document.getElementById('doctorsContainer')!;

    if (!doctors || doctors.length === 0) {
      doctorCount.textContent = 'Doktor yok';
      container.innerHTML = `
        <div style="text-align: center; padding: 80px 40px; color: #888;">
          <div style="font-size: 64px; margin-bottom: 20px; opacity: 0.5;">👨‍⚕️</div>
          <div style="font-size: 20px; font-weight: 600; margin-bottom: 12px; color: #aaa;">Henüz doktor eklenmemiş</div>
          <div style="font-size: 15px; color: #777;">Doktor eklemek için "Doktor Ekle" sekmesini kullanın</div>
        </div>
      `;
      return;
    }

    doctorCount.textContent = `${doctors.length} Doktor`;

    container.innerHTML = `
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 20px;">
        ${doctors.map((doctor: Doctor) => {
          const genderIcon = doctor.gender === 'male' ? '👨‍⚕️' : doctor.gender === 'female' ? '👩‍⚕️' : '👤';
          const genderText = doctor.gender === 'male' ? 'Erkek' : doctor.gender === 'female' ? 'Kadın' : 'Belirtilmemiş';

          return `
            <div style="background: rgba(30, 30, 50, 0.8); border: 1px solid #3a3a5a; border-radius: 12px; padding: 24px; transition: all 0.3s ease;" class="doctor-card">
              <div style="display: flex; align-items: start; gap: 16px; margin-bottom: 16px;">
                <div style="font-size: 48px;">${genderIcon}</div>
                <div style="flex: 1;">
                  <div style="color: #fff; font-size: 20px; font-weight: 600; margin-bottom: 6px;">
                    ${doctor.name}
                  </div>
                  <div style="color: #9b9bbb; font-size: 14px; margin-bottom: 8px;">
                    ID: #${doctor.id}
                  </div>
                  <div style="background: rgba(102, 126, 234, 0.2); padding: 6px 14px; border-radius: 12px; display: inline-block; font-weight: 500; color: #a0b0ff; font-size: 13px;">
                    ${doctor.expertise}
                  </div>
                </div>
              </div>
              <div style="border-top: 1px solid #3a3a5a; padding-top: 16px; color: #888; font-size: 14px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span style="color: #667eea;">●</span>
                  <span>${genderText}</span>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    // Add hover effect to doctor cards
    const cards = document.querySelectorAll('.doctor-card');
    cards.forEach(card => {
      card.addEventListener('mouseenter', (e) => {
        (e.target as HTMLElement).style.background = 'rgba(40, 40, 60, 0.9)';
        (e.target as HTMLElement).style.transform = 'translateY(-4px)';
        (e.target as HTMLElement).style.boxShadow = '0 12px 40px rgba(102, 126, 234, 0.3)';
        (e.target as HTMLElement).style.borderColor = '#667eea';
      });
      card.addEventListener('mouseleave', (e) => {
        (e.target as HTMLElement).style.background = 'rgba(30, 30, 50, 0.8)';
        (e.target as HTMLElement).style.transform = 'translateY(0)';
        (e.target as HTMLElement).style.boxShadow = 'none';
        (e.target as HTMLElement).style.borderColor = '#3a3a5a';
      });
    });
  } catch (error) {
    const container = document.getElementById('doctorsContainer')!;
    const doctorCount = document.getElementById('doctorCount')!;

    doctorCount.textContent = 'Hata';

    if (error instanceof ApiError) {
      container.innerHTML = `
        <div style="text-align: center; padding: 60px 40px; color: #dc3545;">
          <div style="font-size: 48px; margin-bottom: 16px;">⚠️</div>
          <div style="font-size: 18px; font-weight: 600;">Hata: ${error.message}</div>
        </div>
      `;
    } else {
      container.innerHTML = `
        <div style="text-align: center; padding: 60px 40px; color: #dc3545;">
          <div style="font-size: 48px; margin-bottom: 16px;">⚠️</div>
          <div style="font-size: 18px; font-weight: 600;">Bir hata oluştu. Lütfen tekrar deneyin.</div>
        </div>
      `;
    }
  }
}

function logout() {
  TokenManager.remove();
  window.location.href = '/login.html';
}
