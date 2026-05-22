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
        emergencyPhone: document.getElementById('emergencyPhone')
    };

    // Previews
    const previews = {
        clinicName: document.getElementById('prevClinicName'),
        docTitle: document.getElementById('prevDocTitle'),
        docText: document.getElementById('prevDocText'),
        dobRow: document.getElementById('prevDobRow'),
        phoneRow: document.getElementById('prevPhoneRow'),
        emergencyRow: document.getElementById('prevEmergencyRow'),
        medConditions: document.getElementById('prevMedConditions'),
        patientName: document.getElementById('prevPatientName'),
        patientID: document.getElementById('prevPatientID'),
        patientDOB: document.getElementById('prevPatientDOB'),
        patientAge: document.getElementById('prevPatientAge'),
        patientPhone: document.getElementById('prevPatientPhone'),
        emergencyName: document.getElementById('prevEmergencyName'),
        emergencyPhone: document.getElementById('prevEmergencyPhone')
    };

    const conditionCheckboxes = document.querySelectorAll('.condition-checkbox');
    const printBtn = document.getElementById('printBtn');

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
        previews.patientDOB.textContent = inputs.patientDOB.value || '____/____/________';
        previews.patientAge.textContent = inputs.patientAge.value || '____';
        previews.patientPhone.textContent = inputs.patientPhone.value || '__________________________________';
        previews.emergencyName.textContent = inputs.emergencyName.value || '________________';
        previews.emergencyPhone.textContent = inputs.emergencyPhone.value || '________________';
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

    // Event listeners
    inputs.clinicName.addEventListener('input', updateText);
    inputs.docTitle.addEventListener('input', updateText);
    inputs.docText.addEventListener('input', updateText);

    // Patient Details listeners
    inputs.patientName.addEventListener('input', updateText);
    inputs.patientID.addEventListener('input', updateText);
    inputs.patientDOB.addEventListener('input', updateText);
    inputs.patientAge.addEventListener('input', updateText);
    inputs.patientPhone.addEventListener('input', updateText);
    inputs.emergencyName.addEventListener('input', updateText);
    inputs.emergencyPhone.addEventListener('input', updateText);

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
