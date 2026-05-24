document.addEventListener('DOMContentLoaded', () => {
    // Inputs
    const inputs = {
        clinicName: document.getElementById('clinicName'),
        docTitle: document.getElementById('docTitle'),
        docText: document.getElementById('docText'),
        showDOB: document.getElementById('showDOB'),
        showPhone: document.getElementById('showPhone'),
        showEmergency: document.getElementById('showEmergency'),
        patientName: document.getElementById('patientName'),
        patientID: document.getElementById('patientID'),
        patientDOB: document.getElementById('patientDOB'),
        patientAge: document.getElementById('patientAge'),
        patientPhone: document.getElementById('patientPhone'),
        emergencyName: document.getElementById('emergencyName'),
        emergencyPhone: document.getElementById('emergencyPhone'),
        doctorName: document.getElementById('doctorName'),
        doctorSpecialty: document.getElementById('doctorSpecialty')
    };

    // Previews
    const previews = {
        clinicName: document.getElementById('prevClinicName'),
        docTitle: document.getElementById('prevDocTitle'),
        docText: document.getElementById('prevDocText'),
        dobRow: document.getElementById('prevDobRow'),
        phoneRow: document.getElementById('prevPhoneRow'),
        emergencyRow: document.getElementById('prevEmergencyRow'),
        doctorRow: document.getElementById('prevDoctorRow'),
        medConditions: document.getElementById('prevMedConditions'),
        patientName: document.getElementById('prevPatientName'),
        patientID: document.getElementById('prevPatientID'),
        patientDOB: document.getElementById('prevPatientDOB'),
        patientAge: document.getElementById('prevPatientAge'),
        patientPhone: document.getElementById('prevPatientPhone'),
        emergencyName: document.getElementById('prevEmergencyName'),
        emergencyPhone: document.getElementById('prevEmergencyPhone'),
        doctorName: document.getElementById('prevDoctorName'),
        doctorSpecialty: document.getElementById('prevDoctorSpecialty')
    };

    const conditionCheckboxes = document.querySelectorAll('.condition-checkbox');
    const printBtn = document.getElementById('printBtn');

    // Format ISO date (YYYY-MM-DD) to readable Arabic format (DD/MM/YYYY)
    function formatDate(isoStr) {
        if (!isoStr) return '____/____/________';
        const parts = isoStr.split('-');
        if (parts.length !== 3) return isoStr;
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }

    // Auto-calculate age from DOB
    function calcAge(isoStr) {
        if (!isoStr) return '';
        const dob = new Date(isoStr);
        const today = new Date();
        let age = today.getFullYear() - dob.getFullYear();
        const monthDiff = today.getMonth() - dob.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
            age--;
        }
        return age > 0 ? String(age) : '';
    }

    // Real-Time text binding
    function updateText() {
        previews.clinicName.textContent = inputs.clinicName.value || 'اسم العيادة / المركز';
        previews.docTitle.textContent = inputs.docTitle.value || 'استمارة إقرار وموافقة طبية';

        // Convert text newlines to HTML breaks
        const formattedText = (inputs.docText.value || '')
            .replace(/\n/g, '<br>');
        previews.docText.innerHTML = formattedText;

        // Patient Details
        previews.patientName.textContent = inputs.patientName.value || '__________________________';
        previews.patientID.textContent = inputs.patientID.value || '_________________';

        // DOB — format date picker value
        const dobVal = inputs.patientDOB.value;
        previews.patientDOB.textContent = dobVal ? formatDate(dobVal) : '____/____/________';

        // Auto-fill age from DOB if age is empty
        if (dobVal && !inputs.patientAge.value) {
            const calculatedAge = calcAge(dobVal);
            previews.patientAge.textContent = calculatedAge || '____';
        } else {
            previews.patientAge.textContent = inputs.patientAge.value || '____';
        }

        // Phone — LTR display
        previews.patientPhone.textContent = inputs.patientPhone.value || '__________________________________';
        previews.patientPhone.style.direction = 'ltr';
        previews.patientPhone.style.display = 'inline-block';

        previews.emergencyName.textContent = inputs.emergencyName.value || '________________';

        previews.emergencyPhone.textContent = inputs.emergencyPhone.value || '________________';
        previews.emergencyPhone.style.direction = 'ltr';
        previews.emergencyPhone.style.display = 'inline-block';

        // Doctor fields
        if (previews.doctorName) {
            previews.doctorName.textContent = inputs.doctorName ? (inputs.doctorName.value || '________________') : '________________';
        }
        if (previews.doctorSpecialty) {
            previews.doctorSpecialty.textContent = inputs.doctorSpecialty ? (inputs.doctorSpecialty.value || '________________') : '________________';
        }
    }

    // Toggle fields
    function updateFieldToggles() {
        previews.dobRow.style.display = inputs.showDOB.checked ? 'block' : 'none';
        previews.phoneRow.style.display = inputs.showPhone.checked ? 'block' : 'none';
        previews.emergencyRow.style.display = inputs.showEmergency.checked ? 'block' : 'none';
    }

    // Update conditions checklist
    function updateConditions() {
        previews.medConditions.innerHTML = '';

        conditionCheckboxes.forEach(cb => {
            if (cb.checked) {
                const label = cb.dataset.label;
                const div = document.createElement('div');
                div.className = 'doc-condition-item';
                div.innerHTML = `
                    <span style="color: #dc2626; font-weight: bold; margin-left: 0.3rem;">✓</span>
                    <span>${label}</span>
                `;
                previews.medConditions.appendChild(div);
            }
        });
    }

    // Event listeners — text fields
    inputs.clinicName.addEventListener('input', updateText);
    inputs.docTitle.addEventListener('input', updateText);
    inputs.docText.addEventListener('input', updateText);
    inputs.patientName.addEventListener('input', updateText);
    inputs.patientID.addEventListener('input', updateText);
    inputs.patientDOB.addEventListener('input', updateText);
    inputs.patientDOB.addEventListener('change', updateText);
    inputs.patientAge.addEventListener('input', updateText);
    inputs.patientPhone.addEventListener('input', updateText);
    inputs.emergencyName.addEventListener('input', updateText);
    inputs.emergencyPhone.addEventListener('input', updateText);
    if (inputs.doctorName) inputs.doctorName.addEventListener('input', updateText);
    if (inputs.doctorSpecialty) inputs.doctorSpecialty.addEventListener('input', updateText);

    inputs.showDOB.addEventListener('change', updateFieldToggles);
    inputs.showPhone.addEventListener('change', updateFieldToggles);
    inputs.showEmergency.addEventListener('change', updateFieldToggles);

    conditionCheckboxes.forEach(cb => {
        cb.addEventListener('change', updateConditions);
    });

    // Print
    printBtn.addEventListener('click', () => {
        window.print();
    });

    // Initialize
    updateText();
    updateFieldToggles();
    updateConditions();
});
