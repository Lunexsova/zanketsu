document.addEventListener('DOMContentLoaded', () => {
    // Default Staff
    let staffList = ['د. خالد (عام)', 'أ. سارة (تجميل)', 'د. ليلى (جلدية)'];

    // Today's date string YYYY-MM-DD
    const todayStr = new Date().toISOString().split('T')[0];

    // Default mock appointments
    let appointments = [
        { id: 1, client: 'أحمد العتيبي', service: 'كشف عام', staff: 'د. خالد (عام)', date: todayStr, time: '09:00', status: 'scheduled' },
        { id: 2, client: 'سميرة عبد العزيز', service: 'جلسة ليزر كربوني', staff: 'أ. سارة (تجميل)', date: todayStr, time: '11:00', status: 'inprogress' },
        { id: 3, client: 'فاطمة الحربي', service: 'تنظيف بشرة هيدرافيشيل', staff: 'د. ليلى (جلدية)', date: todayStr, time: '13:00', status: 'completed' },
        { id: 4, client: 'رائد المطيري', service: 'استشارة جلدية', staff: 'د. ليلى (جلدية)', date: todayStr, time: '10:00', status: 'checkedin' }
    ];

    // All unique time slots shown in the board — built dynamically
    function getTimeSlotsForDate(dateStr) {
        const slots = new Set();
        // Default slots
        ['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00'].forEach(t => slots.add(t));
        // Also add any custom appointment times for this date
        appointments.filter(a => a.date === dateStr).forEach(a => slots.add(a.time));
        return Array.from(slots).sort();
    }

    // Select elements
    const staffInput = document.getElementById('staffName');
    const addStaffBtn = document.getElementById('addStaffBtn');
    const staffBadgeList = document.getElementById('staffBadgeList');

    const appointmentForm = document.getElementById('appointmentForm');
    const clientNameInput = document.getElementById('clientName');
    const serviceInput = document.getElementById('serviceName');
    const selectStaff = document.getElementById('selectStaff');
    const bookingDate = document.getElementById('bookingDate');
    const bookingTime = document.getElementById('bookingTime');
    const selectStatus = document.getElementById('selectStatus');
    const boardDateFilter = document.getElementById('boardDateFilter');

    const schedulerGrid = document.getElementById('schedulerGrid');

    // Set defaults
    if (bookingDate) bookingDate.value = todayStr;
    if (bookingTime) bookingTime.value = '09:00';
    if (boardDateFilter) {
        boardDateFilter.value = todayStr;
        boardDateFilter.addEventListener('change', () => renderBoard());
    }

    // Redraw select options and badges for staff
    function updateStaffControls() {
        staffBadgeList.innerHTML = '';
        selectStaff.innerHTML = '';

        staffList.forEach((staff, index) => {
            // Badges
            const badge = document.createElement('div');
            badge.className = 'staff-badge';
            badge.innerHTML = `
                <span>${staff}</span>
                <button type="button" data-index="${index}"><i class="ph-bold ph-x"></i></button>
            `;
            badge.querySelector('button').addEventListener('click', () => {
                staffList.splice(index, 1);
                updateStaffControls();
                renderBoard();
            });
            staffBadgeList.appendChild(badge);

            // Select Options
            const option = document.createElement('option');
            option.value = staff;
            option.textContent = staff;
            selectStaff.appendChild(option);
        });
    }

    // Add new staff
    addStaffBtn.addEventListener('click', () => {
        const name = staffInput.value.trim();
        if (name) {
            staffList.push(name);
            staffInput.value = '';
            updateStaffControls();
            renderBoard();
        }
    });

    // Format display time HH:MM → HH:MM ص/م
    function formatTimeDisplay(time24) {
        const [hStr, mStr] = time24.split(':');
        const h = parseInt(hStr);
        const suffix = h < 12 ? 'ص' : 'م';
        const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
        return `${String(h12).padStart(2,'0')}:${mStr} ${suffix}`;
    }

    // Render Calendar Board
    function renderBoard() {
        schedulerGrid.innerHTML = '';
        const activeDate = boardDateFilter ? boardDateFilter.value : todayStr;
        const timeSlots = getTimeSlotsForDate(activeDate);

        // 1. Create table header
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        headerRow.innerHTML = '<th>الوقت</th>';
        staffList.forEach(staff => {
            headerRow.innerHTML += `<th>${staff}</th>`;
        });
        thead.appendChild(headerRow);
        schedulerGrid.appendChild(thead);

        // 2. Create table body
        const tbody = document.createElement('tbody');

        timeSlots.forEach(time => {
            const tr = document.createElement('tr');

            // Time Column
            tr.innerHTML = `<td class="time-col">${formatTimeDisplay(time)}</td>`;

            // Staff Columns
            staffList.forEach(staff => {
                const td = document.createElement('td');
                td.dataset.staff = staff;
                td.dataset.time = time;

                // Check if appointment exists for this date+time+staff
                const app = appointments.find(a => a.staff === staff && a.time === time && a.date === activeDate);
                if (app) {
                    const appCard = document.createElement('div');
                    appCard.className = `appointment-card`;
                    appCard.style.borderRightColor = getStatusColor(app.status);
                    appCard.innerHTML = `
                        <div>
                            <div class="appointment-header">
                                <span>${app.client}</span>
                                <span class="status-badge status-${app.status}">${getStatusLabel(app.status)}</span>
                            </div>
                            <div class="appointment-service">${app.service}</div>
                        </div>
                        <div class="appointment-actions" style="margin-top: 0.3rem;">
                            <button type="button" title="تغيير الحالة" class="change-status-btn"><i class="ph-bold ph-arrows-clockwise"></i></button>
                            <button type="button" title="حذف الحجز" class="delete-app-btn"><i class="ph-bold ph-trash"></i></button>
                        </div>
                    `;

                    // Cycle Status listener
                    appCard.querySelector('.change-status-btn').addEventListener('click', (e) => {
                        e.stopPropagation();
                        cycleStatus(app);
                    });

                    // Delete listener
                    appCard.querySelector('.delete-app-btn').addEventListener('click', (e) => {
                        e.stopPropagation();
                        appointments = appointments.filter(a => a.id !== app.id);
                        renderBoard();
                    });

                    td.appendChild(appCard);
                }

                tr.appendChild(td);
            });

            tbody.appendChild(tr);
        });

        schedulerGrid.appendChild(tbody);
    }

    // Helper functions for status
    function getStatusLabel(status) {
        const labels = {
            scheduled: 'مؤكد',
            checkedin: 'حاضر',
            inprogress: 'في الجلسة',
            completed: 'مكتمل',
            cancelled: 'ملغي'
        };
        return labels[status] || status;
    }

    function getStatusColor(status) {
        const colors = {
            scheduled: 'var(--blue)',
            checkedin: 'var(--purple)',
            inprogress: 'var(--gold)',
            completed: 'var(--green)',
            cancelled: 'var(--crimson)'
        };
        return colors[status] || 'var(--blue)';
    }

    function cycleStatus(app) {
        const states = ['scheduled', 'checkedin', 'inprogress', 'completed', 'cancelled'];
        const currentIndex = states.indexOf(app.status);
        const nextIndex = (currentIndex + 1) % states.length;
        app.status = states[nextIndex];
        renderBoard();
    }

    // Form Submit (Add Appointment)
    appointmentForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const client = clientNameInput.value.trim();
        const service = serviceInput.value.trim();
        const staff = selectStaff.value;
        const date = bookingDate.value;
        const time = bookingTime.value;
        const status = selectStatus.value;

        if (!date || !time) {
            alert('يرجى تحديد تاريخ ووقت الحجز.');
            return;
        }

        if (client && service && staff) {
            // Check for double booking
            const collision = appointments.some(a => a.staff === staff && a.date === date && a.time === time);
            if (collision) {
                alert('عذراً! هذا الموظف لديه حجز بالفعل في هذا الوقت.');
                return;
            }

            const newApp = {
                id: Date.now(),
                client,
                service,
                staff,
                date,
                time,
                status
            };

            appointments.push(newApp);
            clientNameInput.value = '';
            serviceInput.value = '';

            // Switch board to the new appointment's date
            if (boardDateFilter) boardDateFilter.value = date;
            renderBoard();
        }
    });

    // Initialize Page
    updateStaffControls();
    renderBoard();
});
