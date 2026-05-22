document.addEventListener('DOMContentLoaded', () => {
    // Default Staff
    let staffList = ['د. خالد (عام)', 'أ. سارة (تجميل)', 'د. ليلى (جلدية)'];
    
    // Default Time Slots
    const timeSlots = [
        '09:00 ص',
        '10:00 ص',
        '11:00 ص',
        '12:00 م',
        '01:00 م',
        '02:00 م',
        '03:00 م',
        '04:00 م',
        '05:00 م'
    ];

    // Default mock appointments
    let appointments = [
        { id: 1, client: 'أحمد العتيبي', service: 'كشف عام', staff: 'د. خالد (عام)', time: '09:00 ص', status: 'scheduled' },
        { id: 2, client: 'سميرة عبد العزيز', service: 'جلسة ليزر كربوني', staff: 'أ. سارة (تجميل)', time: '11:00 ص', status: 'inprogress' },
        { id: 3, client: 'فاطمة الحربي', service: 'تنظيف بشرة هيدرافيشيل', staff: 'د. ليلى (جلدية)', time: '13:00 م', status: 'completed' },
        { id: 4, client: 'رائد المطيري', service: 'استشارة جلدية', staff: 'د. ليلى (جلدية)', time: '10:00 ص', status: 'checkedin' }
    ];

    // Select elements
    const staffInput = document.getElementById('staffName');
    const addStaffBtn = document.getElementById('addStaffBtn');
    const staffBadgeList = document.getElementById('staffBadgeList');

    const appointmentForm = document.getElementById('appointmentForm');
    const clientNameInput = document.getElementById('clientName');
    const serviceInput = document.getElementById('serviceName');
    const selectStaff = document.getElementById('selectStaff');
    const selectTime = document.getElementById('selectTime');
    const selectStatus = document.getElementById('selectStatus');

    const schedulerGrid = document.getElementById('schedulerGrid');

    // Redraw select options and badges for staff
    function updateStaffControls() {
        // Redraw badges
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

    // Populate Time slots select
    function updateTimeControls() {
        selectTime.innerHTML = '';
        timeSlots.forEach(time => {
            const option = document.createElement('option');
            option.value = time;
            option.textContent = time;
            selectTime.appendChild(option);
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

    // Render Calendar Board
    function renderBoard() {
        schedulerGrid.innerHTML = '';

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
            tr.innerHTML = `<td class="time-col">${time}</td>`;

            // Staff Columns
            staffList.forEach(staff => {
                const td = document.createElement('td');
                td.dataset.staff = staff;
                td.dataset.time = time;

                // Check if appointment exists
                const app = appointments.find(a => a.staff === staff && a.time === time);
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
                            <button type="button" title="تغيير الحالة" class="change-status-btn"><i class="ph-bold ph-cycle"></i></button>
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
        const time = selectTime.value;
        const status = selectStatus.value;

        if (client && service && staff && time) {
            // Check for double booking
            const collision = appointments.some(a => a.staff === staff && a.time === time);
            if (collision) {
                alert('عذراً! هذا الموظف لديه حجز بالفعل في هذا الوقت.');
                return;
            }

            const newApp = {
                id: Date.now(),
                client,
                service,
                staff,
                time,
                status
            };

            appointments.push(newApp);
            clientNameInput.value = '';
            serviceInput.value = '';
            renderBoard();
        }
    });

    // Initialize Page
    updateStaffControls();
    updateTimeControls();
    renderBoard();
});
