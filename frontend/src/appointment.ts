import './style.css'
import { TokenManager, getDoctorsExpertise, getDoctors, getDoctorsByExpertise, getDoctorAppointments, createAppointment, acquireLock, releaseLock, ApiError } from './api'
import type { Doctor, Appointment } from './types'

// Check if user is authenticated
if (!TokenManager.isAuthenticated()) {
  window.location.href = '/login.html';
} else {
  initApp();
}

let currentExpertise: string | null = null;

async function initApp() {
  const app = document.querySelector<HTMLDivElement>('#app')!;

  app.innerHTML = `
    <div style="min-height: 100vh; background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%); padding: 0;">
      <!-- Header -->
      <header style="background: rgba(26, 26, 46, 0.95); backdrop-filter: blur(10px); border-bottom: 1px solid #2a2a4a; padding: 20px 40px; position: sticky; top: 0; z-index: 1000;">
        <div style="max-width: 1600px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <h1 style="font-size: 32px; color: #fff; margin: 0; font-weight: 700; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Yeni Randevu</h1>
            <p style="color: #888; margin: 4px 0 0 0; font-size: 14px;">Doktor seçin ve randevu oluşturun</p>
          </div>
          <div style="display: flex; gap: 12px;">
            <button id="backBtn" style="background: rgba(102, 126, 234, 0.1); color: #667eea; border: 2px solid #667eea; padding: 12px 28px; border-radius: 8px; font-size: 15px; font-weight: 600; cursor: pointer; transition: all 0.3s ease;">
              ← Geri Dön
            </button>
          </div>
        </div>
      </header>

      <!-- Main Content -->
      <main style="max-width: 1600px; margin: 0 auto; padding: 40px;">
        <div style="display: grid; grid-template-columns: 300px 1fr; gap: 24px;">
          <!-- Sidebar - Expertise Filter -->
          <div style="background: rgba(26, 26, 46, 0.6); backdrop-filter: blur(10px); border: 1px solid #2a2a4a; border-radius: 16px; padding: 24px; height: fit-content; position: sticky; top: 100px;">
            <h3 style="color: #fff; font-size: 18px; margin: 0 0 20px 0; font-weight: 600;">Uzmanlık Alanı</h3>
            <div id="expertiseContainer" style="display: flex; flex-direction: column; gap: 8px;">
              <div style="text-align: center; padding: 20px; color: #888;">
                <div style="font-size: 14px;">Yükleniyor...</div>
              </div>
            </div>
          </div>

          <!-- Doctors List -->
          <div style="background: rgba(26, 26, 46, 0.6); backdrop-filter: blur(10px); border: 1px solid #2a2a4a; border-radius: 16px; padding: 32px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 28px;">
              <h2 style="font-size: 24px; color: #fff; margin: 0; font-weight: 600;">Doktorlarımız</h2>
              <div style="color: #888; font-size: 14px;" id="doctorCount">Yükleniyor...</div>
            </div>
            <div id="doctorsContainer">
              <div style="text-align: center; padding: 60px; color: #888;">
                <div style="font-size: 18px; margin-bottom: 12px;">⏳</div>
                <div style="font-size: 16px;">Doktorlar yükleniyor...</div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  `;

  const backBtn = document.getElementById('backBtn')!;
  backBtn.addEventListener('click', () => {
    window.location.href = '/';
  });

  // Hover effect for back button
  backBtn.addEventListener('mouseenter', (e) => {
    (e.target as HTMLButtonElement).style.background = '#667eea';
    (e.target as HTMLButtonElement).style.color = '#fff';
  });
  backBtn.addEventListener('mouseleave', (e) => {
    (e.target as HTMLButtonElement).style.background = 'rgba(102, 126, 234, 0.1)';
    (e.target as HTMLButtonElement).style.color = '#667eea';
  });

  // Load expertises and doctors
  await loadExpertises();
  await loadDoctors();
}

async function loadExpertises() {
  const container = document.getElementById('expertiseContainer')!;

  try {
    const response = await getDoctorsExpertise();
    const expertises = response.expertises;

    if (!expertises || expertises.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 20px; color: #888;">
          <div style="font-size: 14px;">Uzmanlık alanı bulunamadı</div>
        </div>
      `;
      return;
    }

    // Add "Tümü" button as first option
    container.innerHTML = `
      <label class="expertise-radio" style="display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-radius: 8px; cursor: pointer; transition: all 0.3s ease; background: rgba(102, 126, 234, 0.2); border: 2px solid #667eea;">
        <input type="radio" name="expertise" value="" checked style="width: 18px; height: 18px; cursor: pointer; accent-color: #667eea;">
        <span style="color: #fff; font-size: 15px; font-weight: 500;">Tümü</span>
      </label>
      ${expertises.map((expertise: string) => `
        <label class="expertise-radio" style="display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-radius: 8px; cursor: pointer; transition: all 0.3s ease; background: rgba(255, 255, 255, 0.02); border: 2px solid transparent;">
          <input type="radio" name="expertise" value="${expertise}" style="width: 18px; height: 18px; cursor: pointer; accent-color: #667eea;">
          <span style="color: #ddd; font-size: 15px;">${expertise}</span>
        </label>
      `).join('')}
    `;

    // Add event listeners to radio buttons
    const radios = container.querySelectorAll('input[type="radio"]');
    radios.forEach(radio => {
      radio.addEventListener('change', async (e) => {
        const target = e.target as HTMLInputElement;
        currentExpertise = target.value || null;

        // Update UI
        const labels = container.querySelectorAll('.expertise-radio');
        labels.forEach(label => {
          const input = label.querySelector('input') as HTMLInputElement;
          if (input.checked) {
            (label as HTMLElement).style.background = 'rgba(102, 126, 234, 0.2)';
            (label as HTMLElement).style.borderColor = '#667eea';
            const span = label.querySelector('span') as HTMLSpanElement;
            span.style.color = '#fff';
            span.style.fontWeight = '500';
          } else {
            (label as HTMLElement).style.background = 'rgba(255, 255, 255, 0.02)';
            (label as HTMLElement).style.borderColor = 'transparent';
            const span = label.querySelector('span') as HTMLSpanElement;
            span.style.color = '#ddd';
            span.style.fontWeight = '400';
          }
        });

        // Reload doctors based on selected expertise
        await loadDoctors();
      });

      // Hover effects
      const label = radio.parentElement as HTMLElement;
      const radioInput = radio as HTMLInputElement;
      label.addEventListener('mouseenter', () => {
        if (!radioInput.checked) {
          label.style.background = 'rgba(102, 126, 234, 0.1)';
          label.style.borderColor = '#667eea';
        }
      });
      label.addEventListener('mouseleave', () => {
        if (!radioInput.checked) {
          label.style.background = 'rgba(255, 255, 255, 0.02)';
          label.style.borderColor = 'transparent';
        }
      });
    });

  } catch (error) {
    if (error instanceof ApiError) {
      if (error.statusCode === 401) {
        TokenManager.remove();
        window.location.href = '/login.html';
        return;
      }
      container.innerHTML = `
        <div style="text-align: center; padding: 20px; color: #dc3545;">
          <div style="font-size: 14px;">Hata: ${error.message}</div>
        </div>
      `;
    } else {
      container.innerHTML = `
        <div style="text-align: center; padding: 20px; color: #dc3545;">
          <div style="font-size: 14px;">Bir hata oluştu</div>
        </div>
      `;
    }
  }
}

async function loadDoctors() {
  const container = document.getElementById('doctorsContainer')!;
  const doctorCount = document.getElementById('doctorCount')!;

  try {
    let response;
    if (currentExpertise) {
      response = await getDoctorsByExpertise(currentExpertise);
    } else {
      response = await getDoctors();
    }

    const doctors = response.doctor;

    if (!doctors || doctors.length === 0) {
      doctorCount.textContent = 'Doktor yok';
      container.innerHTML = `
        <div style="text-align: center; padding: 80px 40px; color: #888;">
          <div style="font-size: 64px; margin-bottom: 20px; opacity: 0.5;">👨‍⚕️</div>
          <div style="font-size: 20px; font-weight: 600; margin-bottom: 12px; color: #aaa;">Doktor bulunamadı</div>
          <div style="font-size: 15px; color: #777;">Seçili uzmanlık alanında doktor bulunmamaktadır</div>
        </div>
      `;
      return;
    }

    doctorCount.textContent = `${doctors.length} Doktor`;

    container.innerHTML = `
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px;">
        ${doctors.map((doctor: Doctor) => {
          const genderIcon = doctor.gender === 'female' ? '👩‍⚕️' : '👨‍⚕️';

          return `
            <div class="doctor-card" style="background: rgba(30, 30, 50, 0.8); border: 1px solid #3a3a5a; border-radius: 12px; padding: 24px; transition: all 0.3s ease; position: relative; overflow: hidden; cursor: pointer;">
              <div style="position: absolute; top: 0; right: 0; width: 80px; height: 80px; background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%); border-radius: 0 12px 0 100%;"></div>

              <div style="position: relative; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 16px;">
                <div style="font-size: 64px; margin-bottom: 8px;">${genderIcon}</div>

                <div style="width: 100%;">
                  <div style="color: #fff; font-size: 20px; font-weight: 600; margin-bottom: 8px;">
                    ${doctor.name}
                  </div>
                  <div style="background: rgba(102, 126, 234, 0.2); padding: 6px 16px; border-radius: 16px; display: inline-block;">
                    <span style="color: #a0b0ff; font-size: 14px; font-weight: 500;">
                      ${doctor.expertise}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    // Add hover effects and click handlers to doctor cards
    const cards = document.querySelectorAll('.doctor-card');
    cards.forEach((card, index) => {
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
      card.addEventListener('click', () => {
        openAppointmentModal(doctors[index]);
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
        doctorCount.textContent = 'Doktor yok';
        container.innerHTML = `
          <div style="text-align: center; padding: 80px 40px; color: #888;">
            <div style="font-size: 64px; margin-bottom: 20px; opacity: 0.5;">👨‍⚕️</div>
            <div style="font-size: 20px; font-weight: 600; margin-bottom: 12px; color: #aaa;">Doktor bulunamadı</div>
            <div style="font-size: 15px; color: #777;">Seçili uzmanlık alanında doktor bulunmamaktadır</div>
          </div>
        `;
        return;
      }

      doctorCount.textContent = 'Hata';
      container.innerHTML = `
        <div style="text-align: center; padding: 60px 40px; color: #dc3545;">
          <div style="font-size: 48px; margin-bottom: 16px;">⚠️</div>
          <div style="font-size: 18px; font-weight: 600;">Hata: ${error.message}</div>
        </div>
      `;
    } else {
      doctorCount.textContent = 'Hata';
      container.innerHTML = `
        <div style="text-align: center; padding: 60px 40px; color: #dc3545;">
          <div style="font-size: 48px; margin-bottom: 16px;">⚠️</div>
          <div style="font-size: 18px; font-weight: 600;">Bir hata oluştu. Lütfen tekrar deneyin.</div>
        </div>
      `;
    }
  }
}

// Generate time slots for a day (8:00 AM - 5:00 PM, 30-minute intervals)
function generateTimeSlots(): string[] {
  const slots: string[] = [];
  for (let hour = 8; hour < 17; hour++) {
    slots.push(`${hour.toString().padStart(2, '0')}:00`);
    slots.push(`${hour.toString().padStart(2, '0')}:30`);
  }
  return slots;
}

// Generate dates for the next 7 days starting from today
function getNextSevenDays(): Date[] {
  const days: Date[] = [];
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    days.push(date);
  }
  return days;
}

// Format date to YYYY-MM-DD
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Format date to readable format (e.g., "Pzt, 24 Ara")
function formatDateReadable(date: Date): string {
  const days = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
  const months = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];

  const dayName = days[date.getDay()];
  const day = date.getDate();
  const month = months[date.getMonth()];

  return `${dayName}, ${day} ${month}`;
}

// Check if a slot is booked
function isSlotBooked(appointments: Appointment[], date: string, time: string): boolean {
  return appointments.some(apt => apt.date === date && apt.time === time);
}

// Open appointment modal for a doctor
async function openAppointmentModal(doctor: Doctor) {
  const app = document.querySelector<HTMLDivElement>('#app')!;

  // Create modal overlay
  const modal = document.createElement('div');
  modal.id = 'appointmentModal';
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(5px);
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    animation: fadeIn 0.3s ease;
  `;

  modal.innerHTML = `
    <div style="background: rgba(26, 26, 46, 0.98); border: 1px solid #3a3a5a; border-radius: 20px; max-width: 900px; width: 100%; max-height: 90vh; overflow-y: auto; position: relative; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);">
      <!-- Modal Header -->
      <div style="position: sticky; top: 0; background: rgba(26, 26, 46, 0.98); backdrop-filter: blur(10px); border-bottom: 1px solid #3a3a5a; padding: 24px 32px; border-radius: 20px 20px 0 0; z-index: 10;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <h2 style="color: #fff; font-size: 24px; font-weight: 600; margin: 0 0 8px 0;">Randevu Oluştur</h2>
            <div style="display: flex; align-items: center; gap: 12px;">
              <span style="font-size: 32px;">${doctor.gender === 'female' ? '👩‍⚕️' : '👨‍⚕️'}</span>
              <div>
                <div style="color: #fff; font-size: 18px; font-weight: 500;">${doctor.name}</div>
                <div style="color: #888; font-size: 14px;">${doctor.expertise}</div>
              </div>
            </div>
          </div>
          <button id="closeModal" style="background: rgba(220, 53, 69, 0.1); color: #dc3545; border: none; width: 40px; height: 40px; border-radius: 50%; font-size: 20px; cursor: pointer; transition: all 0.3s ease; display: flex; align-items: center; justify-content: center;">
            ✕
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div id="modalContent" style="padding: 32px;">
        <div style="text-align: center; padding: 60px 20px; color: #888;">
          <div style="font-size: 18px; margin-bottom: 12px;">⏳</div>
          <div style="font-size: 16px;">Randevu saatleri yükleniyor...</div>
        </div>
      </div>
    </div>
  `;

  app.appendChild(modal);

  // Close modal handlers
  const closeBtn = modal.querySelector('#closeModal') as HTMLButtonElement;
  closeBtn.addEventListener('click', () => {
    modal.style.animation = 'fadeOut 0.3s ease';
    setTimeout(() => modal.remove(), 300);
  });

  closeBtn.addEventListener('mouseenter', () => {
    closeBtn.style.background = '#dc3545';
    closeBtn.style.color = '#fff';
  });
  closeBtn.addEventListener('mouseleave', () => {
    closeBtn.style.background = 'rgba(220, 53, 69, 0.1)';
    closeBtn.style.color = '#dc3545';
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.style.animation = 'fadeOut 0.3s ease';
      setTimeout(() => modal.remove(), 300);
    }
  });

  // Load appointments
  try {
    const response = await getDoctorAppointments(doctor.id);
    const appointments = response.appointments || [];

    renderAppointmentSlots(doctor, appointments);
  } catch (error) {
    const modalContent = document.getElementById('modalContent')!;
    if (error instanceof ApiError) {
      if (error.statusCode === 401) {
        TokenManager.remove();
        window.location.href = '/login.html';
        return;
      }

      modalContent.innerHTML = `
        <div style="text-align: center; padding: 60px 20px; color: #dc3545;">
          <div style="font-size: 48px; margin-bottom: 16px;">⚠️</div>
          <div style="font-size: 18px; font-weight: 600;">Hata: ${error.message}</div>
        </div>
      `;
    } else {
      modalContent.innerHTML = `
        <div style="text-align: center; padding: 60px 20px; color: #dc3545;">
          <div style="font-size: 48px; margin-bottom: 16px;">⚠️</div>
          <div style="font-size: 18px; font-weight: 600;">Randevular yüklenirken bir hata oluştu</div>
        </div>
      `;
    }
  }
}

// Render appointment slots in modal
function renderAppointmentSlots(doctor: Doctor, appointments: Appointment[]) {
  const modalContent = document.getElementById('modalContent')!;
  const timeSlots = generateTimeSlots();
  const days = getNextSevenDays();

  modalContent.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 24px;">
      ${days.map(day => {
        const dateStr = formatDate(day);
        const dateReadable = formatDateReadable(day);

        return `
          <div style="background: rgba(30, 30, 50, 0.6); border: 1px solid #3a3a5a; border-radius: 12px; padding: 20px;">
            <h3 style="color: #fff; font-size: 16px; font-weight: 600; margin: 0 0 16px 0; display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 20px;">📅</span>
              ${dateReadable}
            </h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(90px, 1fr)); gap: 8px;">
              ${timeSlots.map(time => {
                const isBooked = isSlotBooked(appointments, dateStr, time);
                return `
                  <button
                    class="time-slot ${isBooked ? 'booked' : 'available'}"
                    data-date="${dateStr}"
                    data-time="${time}"
                    style="
                      background: ${isBooked ? 'rgba(100, 100, 120, 0.3)' : 'rgba(102, 126, 234, 0.1)'};
                      color: ${isBooked ? '#666' : '#667eea'};
                      border: 2px solid ${isBooked ? '#444' : '#667eea'};
                      padding: 10px 12px;
                      border-radius: 8px;
                      font-size: 14px;
                      font-weight: 600;
                      cursor: ${isBooked ? 'not-allowed' : 'pointer'};
                      transition: all 0.3s ease;
                      opacity: ${isBooked ? '0.5' : '1'};
                    "
                    ${isBooked ? 'disabled' : ''}
                  >
                    ${time}
                  </button>
                `;
              }).join('')}
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;

  // Add click handlers to available slots
  const availableSlots = modalContent.querySelectorAll('.time-slot.available');
  availableSlots.forEach(slot => {
    const btn = slot as HTMLButtonElement;

    btn.addEventListener('mouseenter', () => {
      btn.style.background = '#667eea';
      btn.style.color = '#fff';
      btn.style.transform = 'scale(1.05)';
    });

    btn.addEventListener('mouseleave', () => {
      btn.style.background = 'rgba(102, 126, 234, 0.1)';
      btn.style.color = '#667eea';
      btn.style.transform = 'scale(1)';
    });

    btn.addEventListener('click', async () => {
      const date = btn.dataset.date!;
      const time = btn.dataset.time!;
      await bookAppointment(doctor, date, time);
    });
  });
}

// Book an appointment
async function bookAppointment(doctor: Doctor, date: string, time: string) {
  const modal = document.getElementById('appointmentModal')!;
  const modalContent = document.getElementById('modalContent')!;

  // Show loading state - acquiring lock
  modalContent.innerHTML = `
    <div style="text-align: center; padding: 60px 20px; color: #888;">
      <div style="font-size: 18px; margin-bottom: 12px;">🔒</div>
      <div style="font-size: 16px;">Randevu slotu kilitleniyor...</div>
    </div>
  `;

  let lockKey: string | null = null;
  let lockValue: string | null = null;

  try {
    // Step 1: Acquire lock
    const lockResponse = await acquireLock({
      doctorId: doctor.id,
      date: date,
      time: time
    });

    if (!lockResponse.lockAcquired) {
      throw new ApiError(409, 'Bu randevu slotu şu anda başka bir kullanıcı tarafından işleniyor. Lütfen tekrar deneyin.');
    }

    lockKey = lockResponse.lockKey;
    lockValue = lockResponse.lockValue;

    // Show confirmation card after lock acquired
    modalContent.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px 20px;">
        <div style="background: rgba(30, 30, 50, 0.8); border: 2px solid #667eea; border-radius: 16px; padding: 32px; max-width: 500px; width: 100%; box-shadow: 0 8px 32px rgba(102, 126, 234, 0.3);">
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="font-size: 48px; margin-bottom: 16px;">${doctor.gender === 'female' ? '👩‍⚕️' : '👨‍⚕️'}</div>
            <h3 style="color: #fff; font-size: 22px; font-weight: 600; margin: 0 0 8px 0;">Randevu Onayı</h3>
            <div style="color: #888; font-size: 14px;">Randevunuzu onaylamak üzeresiniz</div>
            <div style="color: #667eea; font-size: 12px; margin-top: 8px;">🔒 Slot kilitlendi (30 saniye)</div>
          </div>

          <div style="background: rgba(102, 126, 234, 0.1); border: 1px solid #667eea; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
            <div style="display: flex; flex-direction: column; gap: 12px;">
              <div style="display: flex; align-items: center; gap: 12px;">
                <span style="font-size: 20px;">👨‍⚕️</span>
                <div>
                  <div style="color: #888; font-size: 12px;">Doktor</div>
                  <div style="color: #fff; font-size: 16px; font-weight: 500;">${doctor.name}</div>
                </div>
              </div>
              <div style="height: 1px; background: rgba(102, 126, 234, 0.2);"></div>
              <div style="display: flex; align-items: center; gap: 12px;">
                <span style="font-size: 20px;">📅</span>
                <div>
                  <div style="color: #888; font-size: 12px;">Tarih</div>
                  <div style="color: #fff; font-size: 16px; font-weight: 500;">${formatDateReadable(new Date(date))}</div>
                </div>
              </div>
              <div style="height: 1px; background: rgba(102, 126, 234, 0.2);"></div>
              <div style="display: flex; align-items: center; gap: 12px;">
                <span style="font-size: 20px;">🕐</span>
                <div>
                  <div style="color: #888; font-size: 12px;">Saat</div>
                  <div style="color: #fff; font-size: 16px; font-weight: 500;">${time}</div>
                </div>
              </div>
            </div>
          </div>

          <div style="display: flex; gap: 12px;">
            <button id="cancelBooking" style="flex: 1; background: rgba(220, 53, 69, 0.1); color: #dc3545; border: 2px solid #dc3545; padding: 14px 24px; border-radius: 8px; font-size: 15px; font-weight: 600; cursor: pointer; transition: all 0.3s ease;">
              İptal
            </button>
            <button id="confirmBooking" style="flex: 1; background: #667eea; color: #fff; border: none; padding: 14px 24px; border-radius: 8px; font-size: 15px; font-weight: 600; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);">
              Onayla
            </button>
          </div>
        </div>
      </div>
    `;

    const cancelBtn = document.getElementById('cancelBooking')!;
    const confirmBtn = document.getElementById('confirmBooking')!;

    // Cancel button handlers
    cancelBtn.addEventListener('click', async () => {
      // Release lock before canceling
      if (lockKey && lockValue) {
        try {
          await releaseLock({ lockKey, lockValue });
        } catch (error) {
          console.error('Failed to release lock:', error);
        }
      }

      // Reload appointment slots
      const response = await getDoctorAppointments(doctor.id);
      const appointments = response.appointments || [];
      renderAppointmentSlots(doctor, appointments);
    });

    cancelBtn.addEventListener('mouseenter', () => {
      (cancelBtn as HTMLButtonElement).style.background = '#dc3545';
      (cancelBtn as HTMLButtonElement).style.color = '#fff';
    });
    cancelBtn.addEventListener('mouseleave', () => {
      (cancelBtn as HTMLButtonElement).style.background = 'rgba(220, 53, 69, 0.1)';
      (cancelBtn as HTMLButtonElement).style.color = '#dc3545';
    });

    // Confirm button handlers
    confirmBtn.addEventListener('mouseenter', () => {
      (confirmBtn as HTMLButtonElement).style.background = '#5568d3';
      (confirmBtn as HTMLButtonElement).style.transform = 'scale(1.02)';
    });
    confirmBtn.addEventListener('mouseleave', () => {
      (confirmBtn as HTMLButtonElement).style.background = '#667eea';
      (confirmBtn as HTMLButtonElement).style.transform = 'scale(1)';
    });

    confirmBtn.addEventListener('click', async () => {
      // Show loading state
      modalContent.innerHTML = `
        <div style="text-align: center; padding: 60px 20px; color: #888;">
          <div style="font-size: 18px; margin-bottom: 12px;">⏳</div>
          <div style="font-size: 16px;">Randevu oluşturuluyor...</div>
        </div>
      `;

      try {
        // Step 2: Create appointment
        await createAppointment({
          doctorId: doctor.id,
          date: date,
          time: time
        });

        // Step 3: Release lock after successful creation
        if (lockKey && lockValue) {
          try {
            await releaseLock({ lockKey, lockValue });
          } catch (error) {
            console.error('Failed to release lock:', error);
          }
        }

        // Show success message
        modalContent.innerHTML = `
          <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px 20px;">
            <div style="background: linear-gradient(135deg, rgba(40, 167, 69, 0.1) 0%, rgba(34, 139, 34, 0.1) 100%); border: 2px solid #28a745; border-radius: 16px; padding: 40px; max-width: 500px; width: 100%; text-align: center; box-shadow: 0 8px 32px rgba(40, 167, 69, 0.3);">
              <div style="background: rgba(40, 167, 69, 0.2); width: 80px; height: 80px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px;">
                <div style="font-size: 48px;">✅</div>
              </div>
              <h3 style="color: #28a745; font-size: 26px; font-weight: 700; margin: 0 0 12px 0;">Randevu Başarıyla Oluşturuldu!</h3>
              <div style="color: #aaa; font-size: 15px; margin-bottom: 24px; line-height: 1.6;">
                ${doctor.name} ile <strong style="color: #fff;">${formatDateReadable(new Date(date))}</strong> tarihinde saat <strong style="color: #fff;">${time}</strong> için randevunuz oluşturuldu.
              </div>
              <div style="background: rgba(40, 167, 69, 0.1); border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                <div style="color: #888; font-size: 13px; margin-bottom: 4px;">Randevu kodunuz e-posta adresinize gönderildi</div>
              </div>
              <button id="closeSuccessBtn" style="background: #28a745; color: #fff; border: none; padding: 14px 40px; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 4px 12px rgba(40, 167, 69, 0.4);">
                Tamam
              </button>
            </div>
          </div>
        `;

        const closeBtn = document.getElementById('closeSuccessBtn')!;
        closeBtn.addEventListener('click', () => {
          modal.style.animation = 'fadeOut 0.3s ease';
          setTimeout(() => modal.remove(), 300);
        });

        closeBtn.addEventListener('mouseenter', () => {
          (closeBtn as HTMLButtonElement).style.background = '#218838';
          (closeBtn as HTMLButtonElement).style.transform = 'scale(1.05)';
        });
        closeBtn.addEventListener('mouseleave', () => {
          (closeBtn as HTMLButtonElement).style.background = '#28a745';
          (closeBtn as HTMLButtonElement).style.transform = 'scale(1)';
        });

      } catch (error) {
        // Release lock on error
        if (lockKey && lockValue) {
          try {
            await releaseLock({ lockKey, lockValue });
          } catch (err) {
            console.error('Failed to release lock on error:', err);
          }
        }

        if (error instanceof ApiError) {
          if (error.statusCode === 401) {
            TokenManager.remove();
            window.location.href = '/login.html';
            return;
          }

          modalContent.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px 20px;">
              <div style="background: linear-gradient(135deg, rgba(220, 53, 69, 0.1) 0%, rgba(200, 35, 51, 0.1) 100%); border: 2px solid #dc3545; border-radius: 16px; padding: 40px; max-width: 500px; width: 100%; text-align: center; box-shadow: 0 8px 32px rgba(220, 53, 69, 0.3);">
                <div style="background: rgba(220, 53, 69, 0.2); width: 80px; height: 80px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px;">
                  <div style="font-size: 48px;">❌</div>
                </div>
                <h3 style="color: #dc3545; font-size: 24px; font-weight: 700; margin: 0 0 12px 0;">Randevu Oluşturulamadı</h3>
                <div style="color: #aaa; font-size: 15px; margin-bottom: 28px; line-height: 1.6;">
                  ${error.message}
                </div>
                <button id="tryAgainBtn" style="background: #667eea; color: #fff; border: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);">
                  Tekrar Dene
                </button>
              </div>
            </div>
          `;

          const tryAgainBtn = document.getElementById('tryAgainBtn')!;
          tryAgainBtn.addEventListener('click', async () => {
            // Reload appointment slots
            try {
              const response = await getDoctorAppointments(doctor.id);
              const appointments = response.appointments || [];
              renderAppointmentSlots(doctor, appointments);
            } catch (err) {
              modalContent.innerHTML = `
                <div style="text-align: center; padding: 60px 20px; color: #dc3545;">
                  <div style="font-size: 48px; margin-bottom: 16px;">⚠️</div>
                  <div style="font-size: 18px; font-weight: 600;">Bir hata oluştu. Lütfen modalı kapatıp tekrar deneyin.</div>
                </div>
              `;
            }
          });

          tryAgainBtn.addEventListener('mouseenter', () => {
            (tryAgainBtn as HTMLButtonElement).style.background = '#5568d3';
            (tryAgainBtn as HTMLButtonElement).style.transform = 'scale(1.05)';
          });
          tryAgainBtn.addEventListener('mouseleave', () => {
            (tryAgainBtn as HTMLButtonElement).style.background = '#667eea';
            (tryAgainBtn as HTMLButtonElement).style.transform = 'scale(1)';
          });

        } else {
          modalContent.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px 20px;">
              <div style="background: linear-gradient(135deg, rgba(220, 53, 69, 0.1) 0%, rgba(200, 35, 51, 0.1) 100%); border: 2px solid #dc3545; border-radius: 16px; padding: 40px; max-width: 500px; width: 100%; text-align: center; box-shadow: 0 8px 32px rgba(220, 53, 69, 0.3);">
                <div style="background: rgba(220, 53, 69, 0.2); width: 80px; height: 80px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px;">
                  <div style="font-size: 48px;">⚠️</div>
                </div>
                <h3 style="color: #dc3545; font-size: 24px; font-weight: 700; margin: 0 0 12px 0;">Bir Hata Oluştu</h3>
                <div style="color: #aaa; font-size: 15px; margin-bottom: 28px; line-height: 1.6;">
                  Randevu oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.
                </div>
                <button id="closeErrorBtn" style="background: #dc3545; color: #fff; border: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 4px 12px rgba(220, 53, 69, 0.4);">
                  Kapat
                </button>
              </div>
            </div>
          `;

          const closeErrorBtn = document.getElementById('closeErrorBtn')!;
          closeErrorBtn.addEventListener('click', () => {
            modal.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => modal.remove(), 300);
          });

          closeErrorBtn.addEventListener('mouseenter', () => {
            (closeErrorBtn as HTMLButtonElement).style.background = '#c82333';
            (closeErrorBtn as HTMLButtonElement).style.transform = 'scale(1.05)';
          });
          closeErrorBtn.addEventListener('mouseleave', () => {
            (closeErrorBtn as HTMLButtonElement).style.background = '#dc3545';
            (closeErrorBtn as HTMLButtonElement).style.transform = 'scale(1)';
          });
        }
      }
    });

  } catch (error) {
    // Release lock on outer error (e.g., lock acquisition failure)
    if (lockKey && lockValue) {
      try {
        await releaseLock({ lockKey, lockValue });
      } catch (err) {
        console.error('Failed to release lock on outer error:', err);
      }
    }

    if (error instanceof ApiError) {
      if (error.statusCode === 401) {
        TokenManager.remove();
        window.location.href = '/login.html';
        return;
      }

      modalContent.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px 20px;">
          <div style="background: linear-gradient(135deg, rgba(220, 53, 69, 0.1) 0%, rgba(200, 35, 51, 0.1) 100%); border: 2px solid #dc3545; border-radius: 16px; padding: 40px; max-width: 500px; width: 100%; text-align: center; box-shadow: 0 8px 32px rgba(220, 53, 69, 0.3);">
            <div style="background: rgba(220, 53, 69, 0.2); width: 80px; height: 80px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px;">
              <div style="font-size: 48px;">🔒</div>
            </div>
            <h3 style="color: #dc3545; font-size: 24px; font-weight: 700; margin: 0 0 12px 0;">Slot Kilitlenemedi</h3>
            <div style="color: #aaa; font-size: 15px; margin-bottom: 28px; line-height: 1.6;">
              ${error.message}
            </div>
            <button id="closeLockErrorBtn" style="background: #667eea; color: #fff; border: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);">
              Kapat
            </button>
          </div>
        </div>
      `;

      const closeLockErrorBtn = document.getElementById('closeLockErrorBtn')!;
      closeLockErrorBtn.addEventListener('click', () => {
        modal.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => modal.remove(), 300);
      });

      closeLockErrorBtn.addEventListener('mouseenter', () => {
        (closeLockErrorBtn as HTMLButtonElement).style.background = '#5568d3';
        (closeLockErrorBtn as HTMLButtonElement).style.transform = 'scale(1.05)';
      });
      closeLockErrorBtn.addEventListener('mouseleave', () => {
        (closeLockErrorBtn as HTMLButtonElement).style.background = '#667eea';
        (closeLockErrorBtn as HTMLButtonElement).style.transform = 'scale(1)';
      });
    } else {
      modalContent.innerHTML = `
        <div style="text-align: center; padding: 60px 20px; color: #dc3545;">
          <div style="font-size: 48px; margin-bottom: 16px;">⚠️</div>
          <div style="font-size: 18px; font-weight: 600;">Bir hata oluştu. Lütfen tekrar deneyin.</div>
        </div>
      `;
    }
  }
}
