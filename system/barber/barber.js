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

    let currentSkin = 'barber';
    let categories = [
        {
            name: 'قص الشعر الرجالي',
            items: [
                { name: 'قص شعر كلاسيكي',          desc: 'قص + تشكيل + مرطب',          price: '45' },
                { name: 'قص فيد وتلاشي (Fade)',     desc: 'من الجوانب بتدرج احترافي',   price: '55' },
                { name: 'قص + غسيل + مجفف',         desc: 'شامل الشامبو والتنعيم',      price: '65' },
            ]
        },
        {
            name: 'خدمات اللحية',
            items: [
                { name: 'حلاقة اللحية بالموس',      desc: 'موس كلاسيكي + كريم ما قبل',  price: '40' },
                { name: 'تشكيل وتقليم اللحية',      desc: 'تصميم حسب الوجه',            price: '35' },
                { name: 'علاج اللحية بالزيت',       desc: 'زيت أرغان طبيعي مع مساج',    price: '50' },
            ]
        },
        {
            name: 'باقات كاملة',
            items: [
                { name: 'باقة الرجل الكلاسيكية',   desc: 'قص + لحية + مرطب كامل',      price: '110' },
                { name: 'باقة العريس (VIP)',         desc: 'جميع الخدمات + عطر + ماسك',  price: '220' },
            ]
        }
    ];

    function renderBrochure() {
        const biz      = bizNameInput.value  || 'صالون الباشا للحلاقة الكلاسيكية';
        const tagline  = taglineInput.value  || 'أصالة الحلاقة الكلاسيكية منذ 1985';
        const footer   = footerInput.value   || 'نرحب بكم · أوقات العمل 9ص - 11م';
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
                    <div class="logo-placeholder"><i class="ph-duotone ph-scissors"></i></div>
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
                    <input class="category-name-input" type="text" placeholder="${cat.name}" value="" data-ci="${ci}">
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
                        <input class="item-input item-name-input" type="text" placeholder="${item.name}" value="" data-ci="${ci}" data-ii="${ii}">
                        <button class="btn-remove remove-item" data-ci="${ci}" data-ii="${ii}"><i class="ph-bold ph-x"></i></button>
                    </div>
                    <input class="item-input item-desc-input" type="text" placeholder="${item.desc || 'الوصف (اختياري)'}" value="" data-ci="${ci}" data-ii="${ii}">
                    <div class="item-price-row">
                        <span class="item-price-label">السعر:</span>
                        <input class="item-price-input" type="text" placeholder="${item.price}" value="" data-ci="${ci}" data-ii="${ii}">
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
        if (el.classList.contains('category-name-input'))  categories[ci].name = el.value || el.placeholder;
        else if (el.classList.contains('item-name-input')) categories[ci].items[ii].name = el.value || el.placeholder;
        else if (el.classList.contains('item-desc-input')) categories[ci].items[ii].desc = el.value || el.placeholder;
        else if (el.classList.contains('item-price-input')) categories[ci].items[ii].price = el.value || el.placeholder;
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

    addCategoryBtn.addEventListener('click', () => {
        categories.push({ name: 'قسم جديد', items: [{ name: 'خدمة جديدة', desc: '', price: '0' }] });
        renderControls(); renderBrochure();
    });

    logoInput.addEventListener('change', e => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = ev => { logoInput._dataURL = ev.target.result; renderBrochure(); };
        reader.readAsDataURL(file);
    });

    printBtn.addEventListener('click', () => window.print());

    const urlParams = new URLSearchParams(window.location.search);
    const themeParam = urlParams.get('theme');
    if (themeParam) {
        const card = Array.from(themeCards).find(c => c.dataset.skin === themeParam);
        if (card) { themeCards.forEach(c => c.classList.remove('active')); card.classList.add('active'); }
        currentSkin = themeParam;
        menuBrochure.className = `menu-brochure skin-${currentSkin}`;
    }

    renderControls();
    renderBrochure();
});
