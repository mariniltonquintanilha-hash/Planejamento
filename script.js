// Día names em português
const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

// Estado da aplicação
let agendaData = {};
let currentView = 'week';
let todayDate = new Date();
let customEvents = [];
let deletedEvents = [];
let editingEventIndex = null;

// Elementos do DOM
const daysGrid = document.getElementById('daysGrid');
const timeline = document.getElementById('timeline');
const summaryStats = document.getElementById('summaryStats');
const loading = document.getElementById('loading');
const eventModal = document.getElementById('eventModal');
const eventDetails = document.getElementById('eventDetails');
const formModal = document.getElementById('formModal');
const eventForm = document.getElementById('eventForm');
const headerDate = document.getElementById('headerDate');
const navBtns = document.querySelectorAll('.nav-btn');
const views = document.querySelectorAll('.view');
const modalClose = document.querySelector('.modal-close');
const openFormBtn = document.getElementById('openFormBtn');

// Inicialização
document.addEventListener('DOMContentLoaded', init);

async function init() {
    setupEventListeners();
    loadCustomEvents();
    loadDeletedEvents();
    updateHeaderDate();
    await loadAgenda();
}

function setupEventListeners() {
    navBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            if (e.target.dataset.view) {
                switchView(e.target.dataset.view);
            }
        });
    });

    modalClose.addEventListener('click', closeModal);
    eventModal.addEventListener('click', (e) => {
        if (e.target === eventModal) closeModal();
    });

    openFormBtn.addEventListener('click', openFormModal);
    eventForm.addEventListener('submit', handleFormSubmit);

    // Fechar formulário ao clicar fora
    formModal.addEventListener('click', (e) => {
        if (e.target === formModal) closeFormModal();
    });
}

function updateHeaderDate() {
    const today = new Date();
    const weekStart = getMonday(today);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    
    const format = (d) => `${d.getDate()} ${monthNames[d.getMonth()]}`;
    headerDate.textContent = `${format(weekStart)} - ${format(weekEnd)}`;
}

function getMonday(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
}

function loadCustomEvents() {
    const stored = localStorage.getItem('agendaEvents');
    customEvents = stored ? JSON.parse(stored) : [];
}

function saveCustomEvents() {
    localStorage.setItem('agendaEvents', JSON.stringify(customEvents));
}

function loadDeletedEvents() {
    const stored = localStorage.getItem('deletedEvents');
    deletedEvents = stored ? JSON.parse(stored) : [];
}

function saveDeletedEvents() {
    localStorage.setItem('deletedEvents', JSON.stringify(deletedEvents));
}

async function loadAgenda() {
    try {
        loading.classList.add('active');
        
        // Gerar dados mock localmente
        const agendaGenerated = generateMockAgenda();
        
        // Mesclar com eventos customizados
        mergeCustomEvents(agendaGenerated);
        
        agendaData = agendaGenerated;
        
        renderWeekView();
        renderTodayView();
        renderSummaryView();
        
    } catch (error) {
        console.error('Erro:', error);
        daysGrid.innerHTML = `<div style="grid-column: 1/-1; color: #ff006e; text-align: center; padding: 40px;">
            <p>❌ Erro ao carregar dados</p>
            <small>${error.message}</small>
        </div>`;
    } finally {
        loading.classList.remove('active');
    }
}

function mergeCustomEvents(agenda) {
    customEvents.forEach(event => {
        const dateStr = event.start.split(' ')[0];
        if (!agenda[dateStr]) {
            agenda[dateStr] = [];
        }
        agenda[dateStr].push(event);
    });
    
    // Ordenar todos os eventos por hora
    Object.values(agenda).forEach(dayEvents => {
        dayEvents.sort((a, b) => a.start.localeCompare(b.start));
    });
}

function generateMockAgenda() {
    const weekStart = getMonday(todayDate);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    
    const agenda = {};
    const current = new Date(weekStart);
    
    while (current <= weekEnd) {
        const dateStr = formatDate(current);
        const dayOfWeek = current.getDay();
        const dayEvents = [];
        
        // Trabalho e desenvolvimento apenas em dias úteis (segunda a sexta)
        if (dayOfWeek >= 1 && dayOfWeek <= 5) {
            // Manhã - Trabalho Fiscal (8h-12h)
            const workEvent = {
                title: 'Trabalho Principal (Fiscal)',
                start: `${dateStr} 08:00`,
                end: `${dateStr} 12:00`,
                duration: '4h 0m',
                priority: 'Média',
                category: 'Fiscal',
                priorityKey: 'MEDIUM',
                notes: null,
                isCustom: false
            };
            
            if (!isEventDeleted(workEvent)) {
                dayEvents.push(workEvent);
            }
            
            // Tarde - Desenvolvimento (14h-18h)
            const devEvent = {
                title: 'Desenvolvimento Web & Automação',
                start: `${dateStr} 14:00`,
                end: `${dateStr} 18:00`,
                duration: '4h 0m',
                priority: 'Média',
                category: 'Desenvolvimento',
                priorityKey: 'MEDIUM',
                notes: null,
                isCustom: false
            };
            
            if (!isEventDeleted(devEvent)) {
                dayEvents.push(devEvent);
            }
        }
        
        // Exercício todos os dias (19h-20h)
        const exerciseEvent = {
            title: 'Exercícios / Academia',
            start: `${dateStr} 19:00`,
            end: `${dateStr} 20:00`,
            duration: '1h 0m',
            priority: 'Baixa',
            category: 'Lazer',
            priorityKey: 'LOW',
            notes: null,
            isCustom: false
        };
        
        if (!isEventDeleted(exerciseEvent)) {
            dayEvents.push(exerciseEvent);
        }
        
        // Adicionar eventos aleatórios em alguns dias
        if (Math.random() > 0.6 && dayOfWeek >= 1 && dayOfWeek <= 5) {
            const extras = [
                {
                    title: 'Reunião de Planejamento',
                    start: `${dateStr} 10:00`,
                    end: `${dateStr} 10:30`,
                    duration: '30m',
                    priority: 'Alta',
                    category: 'Fiscal',
                    priorityKey: 'HIGH',
                    notes: null,
                    isCustom: false
                },
                {
                    title: 'Review de Código',
                    start: `${dateStr} 15:30`,
                    end: `${dateStr} 16:30`,
                    duration: '1h 0m',
                    priority: 'Alta',
                    category: 'Desenvolvimento',
                    priorityKey: 'HIGH',
                    notes: null,
                    isCustom: false
                },
                {
                    title: 'Coffee Break',
                    start: `${dateStr} 15:00`,
                    end: `${dateStr} 15:15`,
                    duration: '15m',
                    priority: 'Baixa',
                    category: 'Pessoal',
                    priorityKey: 'LOW',
                    notes: null,
                    isCustom: false
                }
            ];
            
            const extraEvent = extras[Math.floor(Math.random() * extras.length)];
            if (!isEventDeleted(extraEvent)) {
                dayEvents.push(extraEvent);
            }
        }
        
        // Ordenar eventos por hora
        dayEvents.sort((a, b) => a.start.localeCompare(b.start));
        
        if (dayEvents.length > 0) {
            agenda[dateStr] = dayEvents;
        }
        
        current.setDate(current.getDate() + 1);
    }
    
    return agenda;
}

function isEventDeleted(event) {
    return deletedEvents.some(deleted => 
        deleted.start === event.start && 
        deleted.title === event.title && 
        deleted.category === event.category
    );
}

function renderWeekView() {
    daysGrid.innerHTML = '';
    
    const weekStart = getMonday(todayDate);
    
    for (let i = 0; i < 7; i++) {
        const currentDate = new Date(weekStart);
        currentDate.setDate(currentDate.getDate() + i);
        
        const dateStr = formatDate(currentDate);
        const dayEvents = agendaData[dateStr] || [];
        
        const dayCard = createDayCard(currentDate, dayEvents);
        daysGrid.appendChild(dayCard);
    }
}

function createDayCard(date, events) {
    const dayNum = date.getDay();
    const dayName = dayNames[dayNum];
    const dateStr = formatDate(date);
    
    const card = document.createElement('div');
    card.className = 'day-card';
    
    const isToday = formatDate(new Date()) === dateStr;
    if (isToday) {
        card.style.borderColor = '#00d4ff';
        card.style.boxShadow = '0 0 20px rgba(0, 212, 255, 0.3)';
    }
    
    let eventsHTML = '';
    let totalHours = 0;
    let highPriority = 0;
    
    events.forEach((event, idx) => {
        const [startH, startM] = event.start.split(' ')[1].split(':');
        const [endH, endM] = event.end.split(' ')[1].split(':');
        
        const durationHours = (parseInt(endH) - parseInt(startH) + (parseInt(endM) - parseInt(startM)) / 60);
        totalHours += durationHours;
        
        if (event.priorityKey === 'HIGH') highPriority++;
        
        const eventJson = JSON.stringify(event).replace(/\"/g, '&quot;');
        const deleteBtn = event.isCustom ? `<button class="btn-action btn-delete" onclick="deleteEvent('${event.start}'); return false;" title="Deletar">🗑️</button>` : '';
        const editBtn = event.isCustom ? `<button class="btn-action btn-edit" onclick="editCustomEvent('${event.start}'); return false;" title="Editar">✏️</button>` : '';
        
        eventsHTML += `
            <div class="event-item ${event.priorityKey}">
                <div style="flex: 1;" onclick="showEventDetails('${eventJson}')">
                    <div class="event-time">${event.start.split(' ')[1]} - ${event.end.split(' ')[1]}</div>
                    <div class="event-title">${event.title}</div>
                    <div class="event-duration">${event.duration}</div>
                </div>
                <div class="event-actions">
                    ${editBtn}
                    ${deleteBtn}
                </div>
            </div>
        `;
    });
    
    card.innerHTML = `
        <div class="day-header">
            <div>
                <div class="day-name">${dayName}</div>
                <div class="day-date">${date.getDate()}</div>
            </div>
        </div>
        <div class="day-stats">
            <div class="stat">📌 ${events.length} eventos</div>
            <div class="stat">⏱️ ${totalHours.toFixed(1)}h</div>
        </div>
        <div class="events-list">
            ${eventsHTML || '<p style="color: var(--text-secondary); font-size: 12px;">Nenhum evento</p>'}
        </div>
    `;
    
    return card;
}

function renderTodayView() {
    timeline.innerHTML = '';
    
    const dateStr = formatDate(todayDate);
    const todayEvents = agendaData[dateStr] || [];
    
    if (todayEvents.length === 0) {
        timeline.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 40px;">Nenhum evento para hoje</p>';
        return;
    }
    
    todayEvents.forEach((event, idx) => {
        const timelineItem = document.createElement('div');
        timelineItem.className = 'timeline-item';
        const eventJson = JSON.stringify(event).replace(/\"/g, '&quot;');
        const deleteBtn = `<button class="btn-action btn-delete" onclick="deleteEventByKey('${dateStr}', ${idx}); return false;" title="Deletar Evento">🗑️</button>`;
        const editBtn = event.isCustom ? `<button class="btn-action btn-edit" onclick="editCustomEvent('${event.start}'); return false;" title="Editar">✏️</button>` : '';
        
        timelineItem.innerHTML = `
            <div class="timeline-content" onclick="showEventDetails('${eventJson}')">
                <div class="timeline-time">${event.start.split(' ')[1]} - ${event.end.split(' ')[1]}</div>
                <div class="timeline-title">${event.title}</div>
                <div class="timeline-duration">
                    <strong>Categoria:</strong> ${event.category}<br>
                    <strong>Prioridade:</strong> ${event.priority}<br>
                    <strong>Duração:</strong> ${event.duration}
                </div>
                <div style="margin-top: 12px; display: flex; gap: 10px;">
                    ${editBtn}
                    ${deleteBtn}
                </div>
            </div>
            <div class="timeline-dot"></div>
        `;
        timeline.appendChild(timelineItem);
    });
}

function renderSummaryView() {
    summaryStats.innerHTML = '';
    
    let totalEvents = 0;
    let totalHours = 0;
    let eventsByCategory = {};
    let eventsByPriority = {};
    
    Object.values(agendaData).forEach(dayEvents => {
        dayEvents.forEach(event => {
            totalEvents++;
            const [startH, startM] = event.start.split(' ')[1].split(':');
            const [endH, endM] = event.end.split(' ')[1].split(':');
            totalHours += (parseInt(endH) - parseInt(startH) + (parseInt(endM) - parseInt(startM)) / 60);
            
            eventsByCategory[event.category] = (eventsByCategory[event.category] || 0) + 1;
            eventsByPriority[event.priority] = (eventsByPriority[event.priority] || 0) + 1;
        });
    });
    
    // Card total
    const totalCard = document.createElement('div');
    totalCard.className = 'stat-card';
    totalCard.innerHTML = `
        <div>📊</div>
        <div class="stat-value">${totalEvents}</div>
        <div class="stat-label">Total de Eventos</div>
        <div class="stat-description">${totalHours.toFixed(1)} horas agendadas</div>
    `;
    summaryStats.appendChild(totalCard);
    
    // Cards por categoria
    Object.entries(eventsByCategory).forEach(([category, count]) => {
        const card = document.createElement('div');
        card.className = 'stat-card';
        const icon = getCategoryIcon(category);
        card.innerHTML = `
            <div>${icon}</div>
            <div class="stat-value">${count}</div>
            <div class="stat-label">${category}</div>
        `;
        summaryStats.appendChild(card);
    });
    
    // Cards por prioridade
    Object.entries(eventsByPriority).forEach(([priority, count]) => {
        const card = document.createElement('div');
        card.className = 'stat-card';
        const icon = getPriorityIcon(priority);
        card.innerHTML = `
            <div>${icon}</div>
            <div class="stat-value">${count}</div>
            <div class="stat-label">Prioridade ${priority}</div>
        `;
        summaryStats.appendChild(card);
    });
}

function switchView(view) {
    currentView = view;
    
    navBtns.forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-view="${view}"]`).classList.add('active');
    
    views.forEach(v => v.classList.remove('active'));
    document.getElementById(view + 'View').classList.add('active');
}

function showEventDetails(eventObj) {
    const event = typeof eventObj === 'string' ? JSON.parse(eventObj) : eventObj;
    
    // Encontrar índice do evento
    const dateStr = event.start.split(' ')[0];
    const eventIndex = agendaData[dateStr] ? agendaData[dateStr].findIndex(e => e.start === event.start && e.title === event.title) : -1;
    
    const deleteBtn = eventIndex !== -1 ? `
        <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid var(--border-color);">
            <button onclick="deleteEventByKey('${dateStr}', ${eventIndex}); return false;" 
                    style="background: rgba(255, 0, 110, 0.2); border: 1px solid #ff006e; color: #ff006e; padding: 10px 16px; border-radius: 6px; cursor: pointer; font-weight: 600; width: 100%; transition: all 0.3s ease;">
                🗑️ Deletar Evento
            </button>
        </div>
    ` : '';
    
    const html = `
        <div class="event-detail-title">${event.title}</div>
        <div class="event-detail-row">
            <strong>Horário:</strong>
            <span>${event.start.split(' ')[1]} - ${event.end.split(' ')[1]}</span>
        </div>
        <div class="event-detail-row">
            <strong>Data:</strong>
            <span>${formatDateBR(event.start.split(' ')[0])}</span>
        </div>
        <div class="event-detail-row">
            <strong>Duração:</strong>
            <span>${event.duration}</span>
        </div>
        <div class="event-detail-row">
            <strong>Categoria:</strong>
            <span>${event.category}</span>
        </div>
        <div class="event-detail-row">
            <strong>Prioridade:</strong>
            <span style="color: ${getPriorityColor(event.priority)};">${event.priority}</span>
        </div>
        ${event.notes ? `
            <div class="event-detail-row">
                <strong>Notas:</strong>
                <span>${event.notes}</span>
            </div>
        ` : ''}
        ${deleteBtn}
    `;
    
    eventDetails.innerHTML = html;
    eventModal.classList.add('active');
}

function closeModal() {
    eventModal.classList.remove('active');
}

function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function formatDateBR(dateStr) {
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
}

function getCategoryIcon(category) {
    const icons = {
        'Fiscal': '💼',
        'Desenvolvimento': '💻',
        'Lazer': '🎮',
        'Pessoal': '👤'
    };
    return icons[category] || '📌';
}

function getPriorityIcon(priority) {
    const icons = {
        'Alta': '🔴',
        'Média': '🟡',
        'Baixa': '🟢'
    };
    return icons[priority] || '⚪';
}

function getPriorityColor(priority) {
    const colors = {
        'Alta': '#ff006e',
        'Média': '#00d4ff',
        'Baixa': '#06d6a0'
    };
    return colors[priority] || '#ffffff';
}

/* ==================== FORM FUNCTIONS ==================== */
function openFormModal() {
    editingEventIndex = null;
    formModal.classList.add('active');
    // Set default date to today
    document.getElementById('eventDate').valueAsDate = new Date();
    // Update title
    const h2 = formModal.querySelector('h2');
    if (h2) h2.textContent = 'Novo Evento';
}

function closeFormModal() {
    formModal.classList.remove('active');
    eventForm.reset();
    editingEventIndex = null;
}

function editCustomEvent(eventStart) {
    const eventIndex = customEvents.findIndex(e => e.start === eventStart);
    if (eventIndex === -1) return;
    
    editingEventIndex = eventIndex;
    const event = customEvents[eventIndex];
    
    // Preenchimento do formulário
    document.getElementById('eventTitle').value = event.title;
    document.getElementById('eventDate').value = event.start.split(' ')[0];
    document.getElementById('eventStartTime').value = event.start.split(' ')[1];
    document.getElementById('eventEndTime').value = event.end.split(' ')[1];
    document.getElementById('eventCategory').value = event.category;
    document.getElementById('eventPriority').value = event.priority;
    document.getElementById('eventNotes').value = event.notes || '';
    
    // Atualizar título do modal
    const h2 = formModal.querySelector('h2');
    if (h2) h2.textContent = 'Editar Evento';
    
    formModal.classList.add('active');
}

function handleFormSubmit(e) {
    e.preventDefault();
    
    const title = document.getElementById('eventTitle').value.trim();
    const date = document.getElementById('eventDate').value;
    const startTime = document.getElementById('eventStartTime').value;
    const endTime = document.getElementById('eventEndTime').value;
    const category = document.getElementById('eventCategory').value;
    const priority = document.getElementById('eventPriority').value;
    const notes = document.getElementById('eventNotes').value.trim();
    
    if (!title || !date || !startTime || !endTime || !category || !priority) {
        alert('Por favor, preencha todos os campos obrigatórios!');
        return;
    }
    
    // Validar horários
    if (startTime >= endTime) {
        alert('A hora de início deve ser antes da hora de fim!');
        return;
    }
    
    // Calcular duration
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    const durationMinutes = (endH * 60 + endM) - (startH * 60 + startM);
    const durationHours = Math.floor(durationMinutes / 60);
    const durationMins = durationMinutes % 60;
    const duration = `${durationHours}h ${durationMins}m`;
    
    // Map priority to priorityKey
    const priorityKeyMap = {
        'Alta': 'HIGH',
        'Média': 'MEDIUM',
        'Baixa': 'LOW'
    };
    
    // Create event object
    const newEvent = {
        title: title,
        start: `${date} ${startTime}`,
        end: `${date} ${endTime}`,
        duration: duration,
        priority: priority,
        category: category,
        priorityKey: priorityKeyMap[priority],
        notes: notes || null,
        isCustom: true
    };
    
    if (editingEventIndex !== null) {
        // Editar evento existente
        customEvents[editingEventIndex] = newEvent;
        showSuccessMessage('Evento atualizado com sucesso!');
    } else {
        // Adicionar novo evento
        customEvents.push(newEvent);
        showSuccessMessage('Evento criado com sucesso!');
    }
    
    saveCustomEvents();
    loadAgenda();
    closeFormModal();
}

function deleteEvent(eventStart) {
    if (confirm('Tem certeza que deseja deletar este evento?')) {
        customEvents = customEvents.filter(e => e.start !== eventStart);
        saveCustomEvents();
        loadAgenda();
        closeModal();
        showSuccessMessage('Evento deletado com sucesso!');
    }
}

function deleteEventByKey(dateStr, eventIndex) {
    if (confirm('Tem certeza que deseja deletar este evento?')) {
        const event = agendaData[dateStr][eventIndex];
        
        // Se é um evento customizado, remover do array de customEvents
        if (event && event.isCustom) {
            customEvents = customEvents.filter(e => e.start !== event.start);
            saveCustomEvents();
        }
        
        // Adicionar evento ao array de deletados para que não seja regenerado
        if (event) {
            deletedEvents.push({
                start: event.start,
                title: event.title,
                category: event.category
            });
            saveDeletedEvents();
        }
        
        // Remover do agendaData
        if (agendaData[dateStr]) {
            agendaData[dateStr].splice(eventIndex, 1);
            if (agendaData[dateStr].length === 0) {
                delete agendaData[dateStr];
            }
        }
        
        loadAgenda();
        closeModal();
        showSuccessMessage('Evento deletado com sucesso!');
    }
}

function showSuccessMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #06d6a0, #00d4ff);
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        font-weight: 600;
        z-index: 9999;
        animation: slideInRight 0.4s ease-out;
    `;
    messageDiv.textContent = message;
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        messageDiv.style.animation = 'slideOutRight 0.4s ease-out forwards';
        setTimeout(() => messageDiv.remove(), 400);
    }, 3000);
}
