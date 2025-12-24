import './style.css'
import { TokenManager, getAppointments, getDoctors, ApiError, sendChatMessage, getUserRole } from './api'
import type { Appointment, Doctor } from './types'

// Check if user is authenticated
if (!TokenManager.isAuthenticated()) {
  window.location.href = '/login.html';
} else {
  initApp();
}

async function initApp() {
  const app = document.querySelector<HTMLDivElement>('#app')!;

  // Check user role
  let isAdmin = false;
  try {
    const roleResponse = await getUserRole();
    console.log('User role response:', roleResponse);
    console.log('User role:', roleResponse.userRole);
    // Case-insensitive check
    isAdmin = roleResponse.userRole?.toLowerCase() === 'admin';
    console.log('Is admin:', isAdmin);
  } catch (error) {
    console.error('Failed to get user role:', error);
  }

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
            ${isAdmin ? `
            <button id="adminPanelBtn" style="background: linear-gradient(135deg, #f59e0b 0%, #ea580c 100%); color: #fff; border: none; padding: 12px 28px; border-radius: 8px; font-size: 15px; font-weight: 600; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 4px 15px rgba(245, 158, 11, 0.4);">
              ⚙️ Admin Panel
            </button>
            ` : ''}
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

      <!-- Chatbot Widget -->
      <div id="chatbotWidget" style="position: fixed; bottom: 30px; right: 30px; z-index: 2000;">
        <!-- Chatbot Container (Hidden by default) -->
        <div id="chatbotContainer" style="display: none; width: 380px; height: 550px; background: rgba(26, 26, 46, 0.98); backdrop-filter: blur(20px); border: 1px solid #3a3a5a; border-radius: 20px; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5); margin-bottom: 20px; flex-direction: column; overflow: hidden;">
          <!-- Chatbot Header -->
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #3a3a5a;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="font-size: 24px;">🤖</div>
              <div>
                <div style="color: #fff; font-weight: 600; font-size: 16px;">Sağlık Asistanı</div>
                <div style="color: rgba(255,255,255,0.8); font-size: 12px;">Nasıl yardımcı olabilirim?</div>
              </div>
            </div>
            <button id="closeChatBtn" style="background: rgba(255,255,255,0.2); border: none; color: #fff; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; font-size: 18px; display: flex; align-items: center; justify-content: center; transition: all 0.3s ease;">×</button>
          </div>

          <!-- Chatbot Messages -->
          <div id="chatMessages" style="flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 16px;">
            <div style="display: flex; gap: 12px; align-items: flex-start;">
              <div style="font-size: 24px; flex-shrink: 0;">🤖</div>
              <div style="background: rgba(102, 126, 234, 0.2); color: #e0e0ff; padding: 12px 16px; border-radius: 12px; font-size: 14px; max-width: 80%; border: 1px solid rgba(102, 126, 234, 0.3);">
                Merhaba! Size nasıl yardımcı olabilirim?
              </div>
            </div>
          </div>

          <!-- Chatbot Input -->
          <div style="border-top: 1px solid #3a3a5a; padding: 16px; background: rgba(20, 20, 40, 0.8);">
            <div style="display: flex; gap: 8px;">
              <input id="chatInput" type="text" placeholder="Mesajınızı yazın..." style="flex: 1; background: rgba(40, 40, 60, 0.8); border: 1px solid #3a3a5a; color: #fff; padding: 12px 16px; border-radius: 12px; font-size: 14px; outline: none; transition: all 0.3s ease;">
              <button id="sendChatBtn" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border: none; color: #fff; padding: 12px 20px; border-radius: 12px; cursor: pointer; font-size: 14px; font-weight: 600; transition: all 0.3s ease; white-space: nowrap;">Gönder</button>
            </div>
          </div>
        </div>

        <!-- Chatbot Toggle Button -->
        <button id="chatbotToggle" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border: none; color: #fff; width: 64px; height: 64px; border-radius: 50%; cursor: pointer; font-size: 28px; box-shadow: 0 8px 24px rgba(102, 126, 234, 0.5); transition: all 0.3s ease; display: flex; align-items: center; justify-content: center; margin-left: auto;">
          💬
        </button>
      </div>
    </div>
  `;

  const logoutBtn = document.getElementById('logoutBtn')!;
  const newAppointmentBtn = document.getElementById('newAppointmentBtn')!;
  const adminPanelBtn = document.getElementById('adminPanelBtn');

  logoutBtn.addEventListener('click', logout);
  newAppointmentBtn.addEventListener('click', () => {
    window.location.href = '/appointment.html';
  });

  if (adminPanelBtn) {
    adminPanelBtn.addEventListener('click', () => {
      window.location.href = '/admin.html';
    });

    // Hover effect for admin button
    adminPanelBtn.addEventListener('mouseenter', (e) => {
      (e.target as HTMLButtonElement).style.transform = 'translateY(-2px)';
      (e.target as HTMLButtonElement).style.boxShadow = '0 6px 20px rgba(245, 158, 11, 0.6)';
    });
    adminPanelBtn.addEventListener('mouseleave', (e) => {
      (e.target as HTMLButtonElement).style.transform = 'translateY(0)';
      (e.target as HTMLButtonElement).style.boxShadow = '0 4px 15px rgba(245, 158, 11, 0.4)';
    });
  }

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

  // Initialize chatbot
  initChatbot();
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

function initChatbot() {
  const chatbotToggle = document.getElementById('chatbotToggle')!;
  const chatbotContainer = document.getElementById('chatbotContainer')!;
  const closeChatBtn = document.getElementById('closeChatBtn')!;
  const chatInput = document.getElementById('chatInput') as HTMLInputElement;
  const sendChatBtn = document.getElementById('sendChatBtn')!;
  const chatMessages = document.getElementById('chatMessages')!;

  let isChatOpen = false;

  // Toggle chatbot
  chatbotToggle.addEventListener('click', () => {
    isChatOpen = !isChatOpen;
    if (isChatOpen) {
      chatbotContainer.style.display = 'flex';
      chatbotToggle.textContent = '✕';
      chatInput.focus();
    } else {
      chatbotContainer.style.display = 'none';
      chatbotToggle.textContent = '💬';
    }
  });

  // Close chatbot
  closeChatBtn.addEventListener('click', () => {
    isChatOpen = false;
    chatbotContainer.style.display = 'none';
    chatbotToggle.textContent = '💬';
  });

  // Hover effects
  chatbotToggle.addEventListener('mouseenter', (e) => {
    (e.target as HTMLButtonElement).style.transform = 'scale(1.1)';
    (e.target as HTMLButtonElement).style.boxShadow = '0 12px 32px rgba(102, 126, 234, 0.7)';
  });
  chatbotToggle.addEventListener('mouseleave', (e) => {
    (e.target as HTMLButtonElement).style.transform = 'scale(1)';
    (e.target as HTMLButtonElement).style.boxShadow = '0 8px 24px rgba(102, 126, 234, 0.5)';
  });

  closeChatBtn.addEventListener('mouseenter', (e) => {
    (e.target as HTMLButtonElement).style.background = 'rgba(255,255,255,0.3)';
  });
  closeChatBtn.addEventListener('mouseleave', (e) => {
    (e.target as HTMLButtonElement).style.background = 'rgba(255,255,255,0.2)';
  });

  chatInput.addEventListener('focus', () => {
    chatInput.style.borderColor = '#667eea';
    chatInput.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.2)';
  });
  chatInput.addEventListener('blur', () => {
    chatInput.style.borderColor = '#3a3a5a';
    chatInput.style.boxShadow = 'none';
  });

  sendChatBtn.addEventListener('mouseenter', (e) => {
    (e.target as HTMLButtonElement).style.transform = 'scale(1.05)';
  });
  sendChatBtn.addEventListener('mouseleave', (e) => {
    (e.target as HTMLButtonElement).style.transform = 'scale(1)';
  });

  // Send message function
  async function sendMessage() {
    const message = chatInput.value.trim();
    if (!message) return;

    // Add user message to chat
    addMessageToChat(message, true);
    chatInput.value = '';

    // Show loading indicator
    const loadingId = addLoadingMessage();

    try {
      const response = await sendChatMessage(message);
      removeLoadingMessage(loadingId);
      addMessageToChat(response, false);
    } catch (error) {
      removeLoadingMessage(loadingId);
      addMessageToChat('Üzgünüm, bir hata oluştu. Lütfen tekrar deneyin.', false);
    }
  }

  // Send message on button click
  sendChatBtn.addEventListener('click', sendMessage);

  // Send message on Enter key
  chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  });

  // Helper functions
  function addMessageToChat(message: string, isUser: boolean) {
    const messageDiv = document.createElement('div');
    messageDiv.style.display = 'flex';
    messageDiv.style.gap = '12px';
    messageDiv.style.alignItems = 'flex-start';

    if (isUser) {
      messageDiv.style.flexDirection = 'row-reverse';
      messageDiv.innerHTML = `
        <div style="font-size: 24px; flex-shrink: 0;">👤</div>
        <div style="background: rgba(118, 75, 162, 0.3); color: #f0e0ff; padding: 12px 16px; border-radius: 12px; font-size: 14px; max-width: 80%; border: 1px solid rgba(118, 75, 162, 0.4); text-align: left;">
          ${escapeHtml(message)}
        </div>
      `;
    } else {
      messageDiv.innerHTML = `
        <div style="font-size: 24px; flex-shrink: 0;">🤖</div>
        <div style="background: rgba(102, 126, 234, 0.2); color: #e0e0ff; padding: 12px 16px; border-radius: 12px; font-size: 14px; max-width: 80%; border: 1px solid rgba(102, 126, 234, 0.3);">
          ${escapeHtml(message)}
        </div>
      `;
    }

    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function addLoadingMessage(): string {
    const loadingId = 'loading-' + Date.now();
    const loadingDiv = document.createElement('div');
    loadingDiv.id = loadingId;
    loadingDiv.style.display = 'flex';
    loadingDiv.style.gap = '12px';
    loadingDiv.style.alignItems = 'flex-start';
    loadingDiv.innerHTML = `
      <div style="font-size: 24px; flex-shrink: 0;">🤖</div>
      <div style="background: rgba(102, 126, 234, 0.2); color: #e0e0ff; padding: 12px 16px; border-radius: 12px; font-size: 14px; max-width: 80%; border: 1px solid rgba(102, 126, 234, 0.3);">
        <span style="opacity: 0.6;">Yazıyor...</span>
      </div>
    `;
    chatMessages.appendChild(loadingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return loadingId;
  }

  function removeLoadingMessage(loadingId: string) {
    const loadingElement = document.getElementById(loadingId);
    if (loadingElement) {
      loadingElement.remove();
    }
  }

  function escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
