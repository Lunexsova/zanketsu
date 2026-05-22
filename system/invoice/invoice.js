document.addEventListener('DOMContentLoaded', () => {
    // Select elements
    const inputs = {
        bizName: document.getElementById('bizName'),
        bizAddress: document.getElementById('bizAddress'),
        bizPhone: document.getElementById('bizPhone'),
        clientName: document.getElementById('clientName'),
        clientAddress: document.getElementById('clientAddress'),
        clientPhone: document.getElementById('clientPhone'),
        invNumber: document.getElementById('invNumber'),
        invDate: document.getElementById('invDate'),
        invDue: document.getElementById('invDue'),
        taxRate: document.getElementById('taxRate'),
        discountRate: document.getElementById('discountRate'),
        currency: document.getElementById('currency'),
        logoInput: document.getElementById('logoInput')
    };

    const previews = {
        bizName: document.getElementById('prevBizName'),
        bizAddress: document.getElementById('prevBizAddress'),
        bizPhone: document.getElementById('prevBizPhone'),
        clientName: document.getElementById('prevClientName'),
        clientAddress: document.getElementById('prevClientAddress'),
        clientPhone: document.getElementById('prevClientPhone'),
        invNumber: document.getElementById('prevInvNumber'),
        invDate: document.getElementById('prevInvDate'),
        invDue: document.getElementById('prevInvDue'),
        subtotal: document.getElementById('prevSubtotal'),
        taxAmount: document.getElementById('prevTaxAmount'),
        discountAmount: document.getElementById('prevDiscountAmount'),
        grandTotal: document.getElementById('prevGrandTotal'),
        logo: document.getElementById('prevLogo'),
        itemsTable: document.getElementById('prevItemsTable'),
        taxRateLabel: document.getElementById('prevTaxRateLabel'),
        discountRateLabel: document.getElementById('prevDiscountRateLabel')
    };

    const itemsContainer = document.getElementById('itemsContainer');
    const addItemBtn = document.getElementById('addItemBtn');
    const printBtn = document.getElementById('printBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const invoicePaper = document.getElementById('invoicePaper');
    const templateCards = document.querySelectorAll('.template-card');

    // Handle template style switching
    templateCards.forEach(card => {
        card.addEventListener('click', () => {
            templateCards.forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            
            const style = card.dataset.style;
            invoicePaper.className = 'invoice-paper'; // reset
            invoicePaper.classList.add(`style-${style}`);
        });
    });

    // Parse URL theme param on load
    const urlParams = new URLSearchParams(window.location.search);
    const initialTheme = urlParams.get('theme');
    if (initialTheme && ['classic', 'cyber', 'gold', 'crimson'].includes(initialTheme)) {
        templateCards.forEach(c => c.classList.remove('active'));
        const selectedCard = document.getElementById(`card-${initialTheme}`);
        if (selectedCard) {
            selectedCard.classList.add('active');
        }
        invoicePaper.className = 'invoice-paper';
        invoicePaper.classList.add(`style-${initialTheme}`);
    }

    // Logo Upload handler
    inputs.logoInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const localUrl = URL.createObjectURL(file);
            previews.logo.src = localUrl;
            previews.logo.style.display = 'block';
        }
    });

    // Simple Real-Time Binding
    function bindInput(inputEl, previewEl) {
        inputEl.addEventListener('input', () => {
            previewEl.textContent = inputEl.value;
        });
    }

    bindInput(inputs.bizName, previews.bizName);
    bindInput(inputs.bizAddress, previews.bizAddress);
    bindInput(inputs.bizPhone, previews.bizPhone);
    bindInput(inputs.clientName, previews.clientName);
    bindInput(inputs.clientAddress, previews.clientAddress);
    bindInput(inputs.clientPhone, previews.clientPhone);
    bindInput(inputs.invNumber, previews.invNumber);
    bindInput(inputs.invDate, previews.invDate);
    bindInput(inputs.invDue, previews.invDue);

    // Dynamic Calculations
    function calculateTotals() {
        const rows = itemsContainer.querySelectorAll('.item-control-row');
        let subtotal = 0;
        const currencySymbol = inputs.currency.value;

        // Clear preview items table
        previews.itemsTable.innerHTML = '';

        rows.forEach(row => {
            const desc = row.querySelector('.item-desc').value || 'خدمة / منتج';
            const qty = parseFloat(row.querySelector('.item-qty').value) || 0;
            const price = parseFloat(row.querySelector('.item-price').value) || 0;
            const total = qty * price;
            subtotal += total;

            // Append row to preview table
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${desc}</td>
                <td class="num-cell">${price.toFixed(2)} ${currencySymbol}</td>
                <td class="num-cell">${qty}</td>
                <td class="num-cell" style="font-weight: 700;">${total.toFixed(2)} ${currencySymbol}</td>
            `;
            previews.itemsTable.appendChild(tr);
        });

        const taxRate = parseFloat(inputs.taxRate.value) || 0;
        const discountRate = parseFloat(inputs.discountRate.value) || 0;

        const taxAmount = subtotal * (taxRate / 100);
        const discountAmount = subtotal * (discountRate / 100);
        const grandTotal = subtotal + taxAmount - discountAmount;

        // Update labels and values
        previews.taxRateLabel.textContent = taxRate;
        previews.discountRateLabel.textContent = discountRate;

        previews.subtotal.textContent = `${subtotal.toFixed(2)} ${currencySymbol}`;
        previews.taxAmount.textContent = `${taxAmount.toFixed(2)} ${currencySymbol}`;
        previews.discountAmount.textContent = `${discountAmount.toFixed(2)} ${currencySymbol}`;
        previews.grandTotal.textContent = `${grandTotal.toFixed(2)} ${currencySymbol}`;
    }

    // Dynamic Currency listener
    inputs.currency.addEventListener('change', calculateTotals);
    inputs.taxRate.addEventListener('input', calculateTotals);
    inputs.discountRate.addEventListener('input', calculateTotals);

    // Items list controller
    function createItemRow() {
        const row = document.createElement('div');
        row.className = 'item-control-row';
        row.innerHTML = `
            <input type="text" class="form-control item-desc" placeholder="اسم الخدمة أو المنتج..." required>
            <input type="number" class="form-control item-price" placeholder="السعر" min="0" step="0.01" value="0.00" required>
            <input type="number" class="form-control item-qty" placeholder="الكمية" min="1" value="1" required>
            <button type="button" class="delete-row-btn"><i class="ph-bold ph-trash"></i></button>
        `;

        // Listeners for values change
        row.querySelector('.item-desc').addEventListener('input', calculateTotals);
        row.querySelector('.item-price').addEventListener('input', calculateTotals);
        row.querySelector('.item-qty').addEventListener('input', calculateTotals);

        // Delete listener
        row.querySelector('.delete-row-btn').addEventListener('click', () => {
            row.remove();
            calculateTotals();
        });

        itemsContainer.appendChild(row);
        calculateTotals();
    }

    addItemBtn.addEventListener('click', createItemRow);

    // Trigger Print
    printBtn.addEventListener('click', () => {
        window.print();
    });

    downloadBtn.addEventListener('click', () => {
        window.print();
    });

    // Initialize with 1 item row
    createItemRow();
});
