document.addEventListener('DOMContentLoaded', () => {
    // Default categories & items
    let menuData = [
        {
            id: 1,
            name: 'العناية بالشعر (Hair Care)',
            items: [
                { id: 101, name: 'قص شعر كلاسيكي', price: '75', desc: 'قص مع غسيل وتصفيف احترافي بالسيشوار.' },
                { id: 102, name: 'صبغة كاملة خالية من الأمونيا', price: '250', desc: 'صبغة شعر صحية ومغذية بألوان عصرية.' }
            ]
        },
        {
            id: 2,
            name: 'العناية بالبشرة (Skin Care)',
            items: [
                { id: 201, name: 'جلسة هيدرافيشيل نضارة', price: '350', desc: 'تنظيف عميق للبشرة مع تقشير مائي وتغذية بالفيتامينات.' }
            ]
        }
    ];

    // Select elements
    const brandNameInput = document.getElementById('brandName');
    const brandSubtitleInput = document.getElementById('brandSubtitle');
    const currencySelect = document.getElementById('currency');
    const categoriesContainer = document.getElementById('categoriesContainer');
    const addCategoryBtn = document.getElementById('addCategoryBtn');

    const prevBrandName = document.getElementById('prevBrandName');
    const prevBrandSubtitle = document.getElementById('prevBrandSubtitle');
    const prevCatsWrapper = document.getElementById('prevCatsWrapper');

    const menuBrochure = document.getElementById('menuBrochure');
    const themeCards = document.querySelectorAll('.theme-card');
    const printBtn = document.getElementById('printBtn');

    // Theme skin switcher
    themeCards.forEach(card => {
        card.addEventListener('click', () => {
            themeCards.forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            
            const skin = card.dataset.skin;
            menuBrochure.className = 'menu-brochure';
            menuBrochure.classList.add(`skin-${skin}`);
        });
    });

    // Add new category block
    addCategoryBtn.addEventListener('click', () => {
        const newCat = {
            id: Date.now(),
            name: 'تصنيف جديد',
            items: []
        };
        menuData.push(newCat);
        renderControls();
        renderBrochure();
    });

    // Render the interactive controls panel
    function renderControls() {
        categoriesContainer.innerHTML = '';

        menuData.forEach((cat, catIdx) => {
            const catBlock = document.createElement('div');
            catBlock.className = 'category-block';
            catBlock.innerHTML = `
                <div class="category-header">
                    <input type="text" class="form-control cat-name-input" placeholder="${cat.name}" value="" style="font-weight: 700; flex: 1;">
                    <button type="button" class="delete-btn delete-cat-btn" title="حذف التصنيف"><i class="ph-bold ph-trash"></i></button>
                </div>
                <div class="category-items-list"></div>
                <button type="button" class="add-btn-small add-item-btn"><i class="ph-bold ph-plus"></i> إضافة خدمة لهذا القسم</button>
            `;

            // Category name change listener
            const catInput = catBlock.querySelector('.cat-name-input');
            catInput.addEventListener('input', () => {
                cat.name = catInput.value || catInput.placeholder;
                renderBrochure();
            });

            // Delete category listener
            catBlock.querySelector('.delete-cat-btn').addEventListener('click', () => {
                menuData.splice(catIdx, 1);
                renderControls();
                renderBrochure();
            });

            // Add item to category
            catBlock.querySelector('.add-item-btn').addEventListener('click', () => {
                cat.items.push({
                    id: Date.now(),
                    name: 'خدمة جديدة',
                    price: '0',
                    desc: 'وصف الخدمة هنا...'
                });
                renderControls();
                renderBrochure();
            });

            // Render items under this category in controls
            const itemsListContainer = catBlock.querySelector('.category-items-list');
            cat.items.forEach((item, itemIdx) => {
                const itemRow = document.createElement('div');
                itemRow.className = 'menu-item-row';
                itemRow.innerHTML = `
                    <div style="display: flex; flex-direction: column; gap: 0.2rem;">
                        <input type="text" class="form-control item-name-input" value="${item.name}" placeholder="اسم الخدمة..." style="font-weight: 700;">
                        <input type="text" class="form-control item-desc-input" value="${item.desc}" placeholder="شرح مبسط..." style="font-size: 0.75rem;">
                    </div>
                    <input type="number" class="form-control item-price-input" value="${item.price}" placeholder="السعر" style="text-align: center;">
                    <button type="button" class="delete-btn delete-item-btn" title="حذف الخدمة"><i class="ph-bold ph-x"></i></button>
                `;

                // Item inputs listeners
                itemRow.querySelector('.item-name-input').addEventListener('input', (e) => {
                    item.name = e.target.value || e.target.placeholder;
                    renderBrochure();
                });
                itemRow.querySelector('.item-desc-input').addEventListener('input', (e) => {
                    item.desc = e.target.value || e.target.placeholder;
                    renderBrochure();
                });
                itemRow.querySelector('.item-price-input').addEventListener('input', (e) => {
                    item.price = e.target.value || e.target.placeholder;
                    renderBrochure();
                });

                // Delete item listener
                itemRow.querySelector('.delete-item-btn').addEventListener('click', () => {
                    cat.items.splice(itemIdx, 1);
                    renderControls();
                    renderBrochure();
                });

                itemsListContainer.appendChild(itemRow);
            });

            categoriesContainer.appendChild(catBlock);
        });
    }

    // Render the visual brochure card preview
    function renderBrochure() {
        const currency = currencySelect.value;
        
        // Brand details
        prevBrandName.textContent = brandNameInput.value || 'اسم المركز أو الصالون';
        prevBrandSubtitle.textContent = brandSubtitleInput.value || 'باقات وخدمات تجميلية حصرية';

        prevCatsWrapper.innerHTML = '';

        menuData.forEach(cat => {
            if (cat.items.length === 0 && !cat.name) return;

            const catSec = document.createElement('div');
            catSec.className = 'menu-cat-section';
            catSec.innerHTML = `<h3>${cat.name}</h3>`;

            const itemsContainer = document.createElement('div');
            itemsContainer.className = 'menu-cat-items';

            cat.items.forEach(item => {
                const itemCard = document.createElement('div');
                itemCard.className = 'menu-item-card';
                itemCard.innerHTML = `
                    <div class="menu-item-details">
                        <h5>${item.name}</h5>
                        <p>${item.desc}</p>
                    </div>
                    <div class="menu-item-price">${item.price} ${currency}</div>
                `;
                itemsContainer.appendChild(itemCard);
            });

            catSec.appendChild(itemsContainer);
            prevCatsWrapper.appendChild(catSec);
        });
    }

    // Input listeners
    brandNameInput.addEventListener('input', renderBrochure);
    brandSubtitleInput.addEventListener('input', renderBrochure);
    currencySelect.addEventListener('change', renderBrochure);

    // Print
    printBtn.addEventListener('click', () => {
        window.print();
    });

    // Init: Check url search params for theme skin selection
    const urlParams = new URLSearchParams(window.location.search);
    const themeParam = urlParams.get('theme'); // samurai, sakura, gold, ink
    if (themeParam) {
        themeCards.forEach(c => c.classList.remove('active'));
        const activeCard = Array.from(themeCards).find(c => c.dataset.skin === themeParam);
        if (activeCard) {
            activeCard.classList.add('active');
        }
        menuBrochure.className = 'menu-brochure';
        menuBrochure.classList.add(`skin-${themeParam}`);
    }

    renderControls();
    renderBrochure();
});
