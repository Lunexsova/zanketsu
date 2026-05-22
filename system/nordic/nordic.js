document.addEventListener('DOMContentLoaded', () => {
    const menuBrochure   = document.getElementById('menuBrochure');
    const bizNameInput   = document.getElementById('bizName');
    const taglineInput   = document.getElementById('tagline');
    const footerInput    = document.getElementById('footerText');
    const logoInput      = document.getElementById('logoUpload');
    const currencySelect = document.getElementById('currency');
    const themeCards     = document.querySelectorAll('.theme-card');
    const categoryList   = document.getElementById('categoryList');
    const addCategoryBtn = document.getElementById('addCategory');
    const printBtn       = document.getElementById('printBtn');

    let currentSkin = 'nordic';
    let categories = [
        {
            name: 'العناية بالبشرة الطبيعية',
            items: [
                { name: 'تنظيف البشرة بمستخلصات عضوية',  desc: 'زيت خزامى + ألوة فيرا',      price: '120' },
                { name: 'ماسك الطين الأخضر الطبيعي',      desc: 'تقليص المسام + إشراق',       price: '90' },
                { name: 'علاج ترطيب بالمياه الحرارية',    desc: 'مناسب للبشرة الحساسة',      price: '150' },
            ]
        },
        {
            name: 'العناية بالجسم العضوية',
            items: [
                { name: 'تقشير السكر والعسل الطبيعي',   desc: 'تجديد خلايا الجسم بالكامل',  price: '130' },
                { name: 'ترطيب زبدة الشيا الكاملة',     desc: 'للجسم + اليدين والقدمين',   price: '180' },
            ]
        }
    ];

    function renderBrochure() {
        const biz      = bizNameInput.value  || 'مركز الطبيعة لعناية البشرة العضوية';
        const tagline  = taglineInput.value  || 'طبيعة نقية · بشرة مشرقة';
        const footer   = footerInput.value   || 'نحتفي بجمالك الطبيعي · حجوزات محدودة';
        const currency = currencySelect.value || 'ر.س';

        let catsHTML = '';
        categories.forEach((cat, ci) => {
            let itemsHTML = '';
            cat.items.forEach(item => {
                itemsHTML += `
                <div class="menu-item">
                    <div class="menu-item-details">
                        <div class="item-name">${item.name}</div>
                        ${item.desc ? `<div class="item-desc">${item.desc}</div>` : ''}
                    </div>
                    <div class="item-dots"></div>
                    <div class="item-price">${item.price} ${currency}</div>
                </div>`;
            });
            catsHTML += `<div class="menu-cat-section" data-ci="${ci}"><div class="cat-title">${cat.name}</div>${itemsHTML}</div>`;
        });

        menuBrochure.innerHTML = `
            <div class="brochure-header">
                <div class="brochure-logo-wrap" id="brochureLogoWrap">
                    <div class="logo-placeholder"><i class="ph-duotone ph-leaf"></i></div>
                </div>
                <div class="brochure-biz-name">${biz}</div>
                <div class="brochure-tagline">${tagline}</div>
            </div>
            ${catsHTML}
            <div class="brochure-footer">${footer}</div>`;

        if (logoInput._dataURL) {
            const img = document.createElement('img');
            img.src = logoInput._dataURL;
            const wrap = menuBrochure.querySelector('#brochureLogoWrap');
            if (wrap) { wrap.innerHTML = ''; wrap.appendChild(img); }
        }
    }

    function renderControls() {
        categoryList.innerHTML = '';
        categories.forEach((cat, ci) => {
            const catDiv = document.createElement('div');
            catDiv.className = 'category-item';
            catDiv.innerHTML = `
                <div class="category-header">
                    <input class="category-name-input" type="text" value="${cat.name}" data-ci="${ci}">
                    <button class="btn-remove remove-cat" data-ci="${ci}"><i class="ph-bold ph-trash"></i></button>
                </div>
                <div class="items-list" id="items-${ci}"></div>
                <button class="btn-add-item" data-ci="${ci}"><i class="ph-bold ph-plus"></i> إضافة خدمة</button>`;
            categoryList.appendChild(catDiv);
            const itemsList = catDiv.querySelector(`#items-${ci}`);
            cat.items.forEach((item, ii) => {
                const row = document.createElement('div');
                row.className = 'item-card';
                row.innerHTML = `
                    <div class="item-row-header">
                        <input class="item-input item-name-input" type="text" placeholder="اسم الخدمة" value="${item.name}" data-ci="${ci}" data-ii="${ii}">
                        <button class="btn-remove remove-item" data-ci="${ci}" data-ii="${ii}"><i class="ph-bold ph-x"></i></button>
                    </div>
                    <input class="item-input item-desc-input" type="text" placeholder="الوصف (اختياري)" value="${item.desc}" data-ci="${ci}" data-ii="${ii}">
                    <div class="item-price-row">
                        <span class="item-price-label">السعر:</span>
                        <input class="item-price-input" type="text" placeholder="0" value="${item.price}" data-ci="${ci}" data-ii="${ii}">
                    </div>`;
                itemsList.appendChild(row);
            });
        });
    }

    themeCards.forEach(card => {
        card.addEventListener('click', () => {
            themeCards.forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            currentSkin = card.dataset.skin;
            menuBrochure.className = `menu-brochure skin-${currentSkin}`;
        });
    });

    [bizNameInput, taglineInput, footerInput].forEach(el => el.addEventListener('input', renderBrochure));
    currencySelect.addEventListener('change', renderBrochure);

    categoryList.addEventListener('input', e => {
        const el = e.target;
        const ci = +el.dataset.ci, ii = +el.dataset.ii;
        if (el.classList.contains('category-name-input'))  categories[ci].name = el.value;
        else if (el.classList.contains('item-name-input')) categories[ci].items[ii].name = el.value;
        else if (el.classList.contains('item-desc-input')) categories[ci].items[ii].desc = el.value;
        else if (el.classList.contains('item-price-input')) categories[ci].items[ii].price = el.value;
        renderBrochure();
    });

    categoryList.addEventListener('click', e => {
        const btn = e.target.closest('button');
        if (!btn) return;
        const ci = +btn.dataset.ci, ii = +btn.dataset.ii;
        if (btn.classList.contains('remove-cat'))   { categories.splice(ci, 1); renderControls(); renderBrochure(); }
        else if (btn.classList.contains('remove-item')) { categories[ci].items.splice(ii, 1); renderControls(); renderBrochure(); }
        else if (btn.classList.contains('btn-add-item')) { categories[ci].items.push({ name: 'خدمة جديدة', desc: '', price: '0' }); renderControls(); renderBrochure(); }
    });

    addCategoryBtn.addEventListener('click', () => { categories.push({ name: 'قسم جديد', items: [{ name: 'خدمة جديدة', desc: '', price: '0' }] }); renderControls(); renderBrochure(); });
    logoInput.addEventListener('change', e => { const file = e.target.files[0]; if (!file) return; const reader = new FileReader(); reader.onload = ev => { logoInput._dataURL = ev.target.result; renderBrochure(); }; reader.readAsDataURL(file); });
    printBtn.addEventListener('click', () => window.print());

    const urlParams = new URLSearchParams(window.location.search);
    const themeParam = urlParams.get('theme');
    if (themeParam) { const card = Array.from(themeCards).find(c => c.dataset.skin === themeParam); if (card) { themeCards.forEach(c => c.classList.remove('active')); card.classList.add('active'); } currentSkin = themeParam; menuBrochure.className = `menu-brochure skin-${currentSkin}`; }

    renderControls();
    renderBrochure();
});
