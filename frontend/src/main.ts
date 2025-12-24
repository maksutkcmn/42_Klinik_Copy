import './style.css'
import { TokenManager, getAppointments, getDoctors, ApiError } from './api'
import type { Appointment, Doctor } from './types'

// Check if user is authenticated
if (!TokenManager.isAuthenticated()) {
  window.location.href = '/login.html';
} else {
  initApp();
}

async function initApp() {
  const app = document.querySelector<HTMLDivElement>('#app')!;

  app.innerHTML = `
    <div style="min-height: 100vh; background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%); padding: 0;">
      <!-- Header -->
      <header style="background: rgba(26, 26, 46, 0.95); backdrop-filter: blur(10px); border-bottom: 1px solid #2a2a4a; padding: 20px 40px; position: sticky; top: 0; z-index: 1000;">
        <div style="max-width: 1600px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <h1 style="font-size: 32px; color: #fff; margin: 0; font-weight: 700; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">42 Klinik</h1>
            <p style="color: #888; margin: 4px 0 0 0; font-size: 14px;">Sağlık Yönetim Sistemi</p>
          </div>
          <div style="display: flex; gap: 12px;">
            <button id="newAppointmentBtn" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #fff; border: none; padding: 12px 28px; border-radius: 8px; font-size: 15px; font-weight: 600; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
              + Yeni Randevu
            </button>
            <button id="logoutBtn" style="background: rgba(220, 53, 69, 0.1); color: #dc3545; border: 2px solid #dc3545; padding: 12px 28px; border-radius: 8px; font-size: 15px; font-weight: 600; cursor: pointer; transition: all 0.3s ease;">
              Çıkış Yap
            </button>
          </div>
        </div>
      </header>

      <!-- Main Content -->
      <main style="max-width: 1600px; margin: 0 auto; padding: 40px;">
        <!-- Appointments Section -->
        <div style="background: rgba(26, 26, 46, 0.6); backdrop-filter: blur(10px); border: 1px solid #2a2a4a; border-radius: 16px; padding: 32px; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 28px;">
            <h2 style="font-size: 26px; color: #fff; margin: 0; font-weight: 600;">Randevularım</h2>
            <div style="color: #888; font-size: 14px;" id="appointmentCount">Yükleniyor...</div>
          </div>
          <div id="appointmentsContainer">
            <div style="text-align: center; padding: 60px; color: #888;">
              <div style="font-size: 18px; margin-bottom: 12px;">⏳</div>
              <div style="font-size: 16px;">Randevular yükleniyor...</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  `;

  const logoutBtn = document.getElementById('logoutBtn')!;
  const newAppointmentBtn = document.getElementById('newAppointmentBtn')!;

  logoutBtn.addEventListener('click', logout);
  newAppointmentBtn.addEventListener('click', () => {
    window.location.href = '/appointment.html';
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

  newAppointmentBtn.addEventListener('mouseenter', (e) => {
    (e.target as HTMLButtonElement).style.transform = 'translateY(-2px)';
    (e.target as HTMLButtonElement).style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.6)';
  });
  newAppointmentBtn.addEventListener('mouseleave', (e) => {
    (e.target as HTMLButtonElement).style.transform = 'translateY(0)';
    (e.target as HTMLButtonElement).style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
  });

  // Load appointments
  await loadAppointments();
}

async function loadAppointments() {
  const container = document.getElementById('appointmentsContainer')!;
  const appointmentCount = document.getElementById('appointmentCount')!;

  try {
    // Load both appointments and doctors in parallel
    const [appointmentsResponse, doctorsResponse] = await Promise.all([
      getAppointments(),
      getDoctors()
    ]);

    const appointments = appointmentsResponse.appointments;
    const doctors = doctorsResponse.doctor;

    // Create a map of doctors for quick lookup
    const doctorMap = new Map<number, Doctor>();
    doctors.forEach((doctor: Doctor) => {
      doctorMap.set(doctor.id, doctor);
    });

    if (!appointments || appointments.length === 0) {
      appointmentCount.textContent = 'Randevu yok';
      container.innerHTML = `
        <div style="text-align: center; padding: 80px 40px; color: #888;">
          <div style="font-size: 64px; margin-bottom: 20px; opacity: 0.5;">📅</div>
          <div style="font-size: 20px; font-weight: 600; margin-bottom: 12px; color: #aaa;">Henüz randevunuz bulunmuyor</div>
          <div style="font-size: 15px; color: #777;">Yeni randevu almak için "+ Yeni Randevu" butonuna tıklayın</div>
        </div>
      `;
      return;
    }

    appointmentCount.textContent = `${appointments.length} Randevu`;

    container.innerHTML = appointments.map((appointment: Appointment) => {
      const doctor = doctorMap.get(appointment.doctorId);
      const doctorName = doctor ? doctor.name : 'Bilinmiyor';
      const doctorExpertise = doctor ? doctor.expertise : 'N/A';
      const doctorGender = doctor ? doctor.gender : '';
      const genderIcon = doctorGender === 'male' ? '👨‍⚕️' : doctorGender === 'female' ? '👩‍⚕️' : '👤';

      return `
        <div style="background: rgba(30, 30, 50, 0.8); border: 1px solid #3a3a5a; border-radius: 12px; padding: 24px; margin-bottom: 16px; transition: all 0.3s ease; position: relative; overflow: hidden;" class="appointment-card">
          <div style="position: absolute; top: 0; right: 0; width: 100px; height: 100px; background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%); border-radius: 0 12px 0 100%;"></div>

          <div style="display: grid; grid-template-columns: auto 1fr auto; gap: 24px; align-items: center; position: relative;">
            <!-- Left: Randevu ID Badge -->
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #fff; padding: 16px 20px; border-radius: 10px; text-align: center; min-width: 100px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);">
              <div style="font-size: 12px; opacity: 0.9; margin-bottom: 4px;">Randevu</div>
              <div style="font-size: 24px; font-weight: 700;">#${appointment.id}</div>
            </div>

            <!-- Middle: Doctor & Details -->
            <div style="display: flex; flex-direction: column; gap: 12px;">
              <div style="display: flex; align-items: center; gap: 12px;">
                <div style="font-size: 32px;">${genderIcon}</div>
                <div>
                  <div style="color: #fff; font-size: 20px; font-weight: 600; margin-bottom: 4px;">
                    ${doctorName}
                  </div>
                  <div style="color: #9b9bbb; font-size: 14px; display: flex; align-items: center; gap: 8px;">
                    <span style="background: rgba(102, 126, 234, 0.2); padding: 4px 12px; border-radius: 12px; font-weight: 500; color: #a0b0ff;">
                      ${doctorExpertise}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Right: Date & Time -->
            <div style="display: flex; flex-direction: column; gap: 12px; text-align: right;">
              <div style="background: rgba(255, 255, 255, 0.05); padding: 12px 20px; border-radius: 8px; border-left: 3px solid #667eea;">
                <div style="color: #888; font-size: 12px; margin-bottom: 4px;">Tarih</div>
                <div style="color: #fff; font-size: 16px; font-weight: 600;">📅 ${appointment.date}</div>
              </div>
              <div style="background: rgba(255, 255, 255, 0.05); padding: 12px 20px; border-radius: 8px; border-left: 3px solid #764ba2;">
                <div style="color: #888; font-size: 12px; margin-bottom: 4px;">Saat</div>
                <div style="color: #fff; font-size: 16px; font-weight: 600;">🕐 ${appointment.time}</div>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Add hover effect to appointment cards
    const cards = document.querySelectorAll('.appointment-card');
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
    if (error instanceof ApiError) {
      if (error.statusCode === 401) {
        TokenManager.remove();
        window.location.href = '/login.html';
        return;
      }

      if (error.statusCode === 404) {
        appointmentCount.textContent = 'Randevu yok';
        container.innerHTML = `
          <div style="text-align: center; padding: 80px 40px; color: #888;">
            <div style="font-size: 64px; margin-bottom: 20px; opacity: 0.5;">📅</div>
            <div style="font-size: 20px; font-weight: 600; margin-bottom: 12px; color: #aaa;">Henüz randevunuz bulunmuyor</div>
            <div style="font-size: 15px; color: #777;">Yeni randevu almak için "+ Yeni Randevu" butonuna tıklayın</div>
          </div>
        `;
        return;
      }

      appointmentCount.textContent = 'Hata';
      container.innerHTML = `
        <div style="text-align: center; padding: 60px 40px; color: #dc3545;">
          <div style="font-size: 48px; margin-bottom: 16px;">⚠️</div>
          <div style="font-size: 18px; font-weight: 600;">Hata: ${error.message}</div>
        </div>
      `;
    } else {
      appointmentCount.textContent = 'Hata';
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
