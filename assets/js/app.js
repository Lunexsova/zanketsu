document.addEventListener('DOMContentLoaded', () => {
  // ==========================================
  // 1. THEME SWITCHER (DARK & LIGHT)
  // ==========================================
  const themeToggleBtn = document.getElementById('theme-toggle');
  const body = document.body;

  // Retrieve saved theme preference or default to dark
  const savedTheme = localStorage.getItem('zanketsu-theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      const newTheme = currentTheme === 'light' ? 'dark' : 'light';

      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('zanketsu-theme', newTheme);
    });
  }

  // ==========================================
  // 2. STICKY HEADER & SCROLL EFFECT
  // ==========================================
  const header = document.querySelector('header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });

  // ==========================================
  // 3. MOBILE NAV OVERLAY TOGGLE
  // ==========================================
  const menuToggle = document.getElementById('menu-toggle');
  const navModalOverlay = document.getElementById('navModalOverlay');
  const navModalClose = document.getElementById('navModalClose');

  if (menuToggle && navModalOverlay) {
    const openMenu = () => {
      menuToggle.classList.add('open');
      menuToggle.setAttribute('aria-expanded', 'true');
      navModalOverlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    };

    const closeMenu = () => {
      menuToggle.classList.remove('open');
      menuToggle.setAttribute('aria-expanded', 'false');
      navModalOverlay.classList.remove('active');
      document.body.style.overflow = '';
    };

    menuToggle.addEventListener('click', () => {
      if (navModalOverlay.classList.contains('active')) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    if (navModalClose) {
      navModalClose.addEventListener('click', closeMenu);
    }

    // Close when clicking outside content box
    navModalOverlay.addEventListener('click', (e) => {
      if (e.target === navModalOverlay) {
        closeMenu();
      }
    });

    // Close mobile menu on clicking any link or CTA button inside modal
    navModalOverlay.querySelectorAll('.nav-modal-link, .nav-modal-cta').forEach(link => {
      link.addEventListener('click', closeMenu);
    });
  }

  // ==========================================
  // 4. COUNTDOWN TIMER TO 2027
  // ==========================================
  const countdownDate = new Date('July 15, 2027 00:00:00').getTime();

  const updateCountdown = () => {
    const daysEl = document.getElementById('days');
    if (!daysEl) return;

    const now = new Date().getTime();
    const distance = countdownDate - now;

    if (distance < 0) {
      const grid = document.querySelector('.countdown-grid');
      if (grid) grid.innerHTML = '<div style="grid-column: span 4; font-size: 1.5rem; color: var(--gold-primary); font-weight: 700;">انطلقنا رسميًا!</div>';
      return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    const formatNum = (num) => String(num).padStart(2, '0');

    daysEl.innerText = formatNum(days);
    const hoursEl = document.getElementById('hours');
    const minutesEl = document.getElementById('minutes');
    const secondsEl = document.getElementById('seconds');
    if (hoursEl) hoursEl.innerText = formatNum(hours);
    if (minutesEl) minutesEl.innerText = formatNum(minutes);
    if (secondsEl) secondsEl.innerText = formatNum(seconds);
  };

  const daysElCheck = document.getElementById('days');
  if (daysElCheck) {
    setInterval(updateCountdown, 1000);
    updateCountdown();
  }

  // ==========================================
  // 5. PROJECTS FILTERING LOGIC
  // ==========================================
  const filterTabs = document.querySelectorAll('.tab-btn');
  const projectCards = document.querySelectorAll('.project-card');

  filterTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Remove active class from all tabs
      filterTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const filter = tab.dataset.filter;

      projectCards.forEach(card => {
        if (filter === 'all' || card.dataset.category === filter) {
          card.style.display = 'flex';
          setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
          }, 50);
        } else {
          card.style.opacity = '0';
          card.style.transform = 'translateY(20px)';
          setTimeout(() => {
            card.style.display = 'none';
          }, 300);
        }
      });
    });
  });

  // ==========================================
  // 6. BUSINESS TOOL (INTERACTIVE ROI CALCULATOR)
  // ==========================================
  const selectSystem = document.getElementById('calc-system');
  const sliderVolume = document.getElementById('calc-volume');
  const valVolume = document.getElementById('volume-value');
  const labelVolume = document.getElementById('volume-label');

  const resHours = document.getElementById('result-hours');
  const resMoney = document.getElementById('result-money');
  const resEfficiency = document.getElementById('result-efficiency');

  const isEnglish = document.documentElement.lang === 'en' || window.location.pathname.includes('/EN/');
  const numLocale = isEnglish ? 'en-US' : 'ar-YE';

  const systemConfigs = {
    'docspot': {
      label: isEnglish ? 'Monthly Patients Volume' : 'عدد المرضى شهرياً',
      min: 100,
      max: 5000,
      value: 1200,
      step: 100,
      calc: (val) => {
        const hoursSaved = Math.round(val * 0.25); // 15 mins saved per patient
        const moneySaved = Math.round(hoursSaved * 12500); // 12,500 YER saved hourly
        const efficiency = 85;
        return { hoursSaved, moneySaved, efficiency };
      }
    },
    'zenix': {
      label: isEnglish ? 'Monthly Transaction Volume' : 'حجم المعاملات الشهرية',
      min: 500,
      max: 100000,
      value: 15000,
      step: 500,
      calc: (val) => {
        const hoursSaved = Math.round(val * 0.05); // 3 mins saved per transaction
        const moneySaved = Math.round(val * 350); // Direct savings on cash handling fees per transaction
        const efficiency = 94;
        return { hoursSaved, moneySaved, efficiency };
      }
    },
    'academix': {
      label: isEnglish ? 'Enrolled Students Count' : 'عدد الطلاب المسجلين',
      min: 50,
      max: 3000,
      value: 750,
      step: 50,
      calc: (val) => {
        const hoursSaved = Math.round(val * 0.8); // 48 mins saved per student/parent interaction per month
        const moneySaved = Math.round(hoursSaved * 6000); // Admin cost savings
        const efficiency = 78;
        return { hoursSaved, moneySaved, efficiency };
      }
    },
    'flexhub': {
      label: isEnglish ? 'Active Members Count' : 'عدد المشتركين الفعالين',
      min: 100,
      max: 4000,
      value: 800,
      step: 50,
      calc: (val) => {
        const hoursSaved = Math.round(val * 0.4); // 24 mins saved per member in subscription and check-in overhead
        const moneySaved = Math.round(hoursSaved * 8000);
        const efficiency = 82;
        return { hoursSaved, moneySaved, efficiency };
      }
    }
  };

  const updateCalculator = () => {
    const sysKey = selectSystem.value;
    const config = systemConfigs[sysKey];

    // Apply configs
    labelVolume.textContent = config.label;
    sliderVolume.min = config.min;
    sliderVolume.max = config.max;
    sliderVolume.step = config.step;

    // Ensure value is within bounds
    let currentVal = parseInt(sliderVolume.value);
    if (currentVal < config.min || currentVal > config.max) {
      currentVal = config.value;
      sliderVolume.value = currentVal;
    }

    valVolume.textContent = currentVal.toLocaleString(numLocale);

    // Run calculations
    const { hoursSaved, moneySaved, efficiency } = config.calc(currentVal);

    // Update UI (with language-specific number formatting)
    resHours.textContent = hoursSaved.toLocaleString(numLocale);
    resMoney.textContent = moneySaved.toLocaleString(numLocale);
    resEfficiency.textContent = isEnglish ? `${efficiency}%` : `${efficiency}٪`;
  };

  if (selectSystem && sliderVolume) {
    selectSystem.addEventListener('change', updateCalculator);
    sliderVolume.addEventListener('input', updateCalculator);
    updateCalculator(); // Initial calculation
  }

  // ==========================================
  // 6. GLOBAL SOCIAL MODAL TOGGLE
  // ==========================================
  const socialFabToggle = document.getElementById('socialFabToggle');
  const socialModal = document.getElementById('socialModal');
  const socialModalClose = document.getElementById('socialModalClose');

  if (socialFabToggle && socialModal) {
    socialFabToggle.addEventListener('click', () => {
      socialModal.classList.add('active');
    });
  }

  if (socialModalClose && socialModal) {
    socialModalClose.addEventListener('click', () => {
      socialModal.classList.remove('active');
    });
  }

  if (socialModal) {
    socialModal.addEventListener('click', (e) => {
      if (e.target === socialModal) {
        socialModal.classList.remove('active');
      }
    });
  }

  // ==========================================
  // 7. BLOG SLIDER / CAROUSEL
  // ==========================================
  const track = document.getElementById('blogSliderTrack');
  const dots  = document.querySelectorAll('.blog-dot');
  const prevBtn = document.getElementById('blogPrev');
  const nextBtn = document.getElementById('blogNext');

  if (track && dots.length) {
    const slides = track.querySelectorAll('.blog-slide-card');
    let current  = 0;
    let autoTimer = null;
    let isHovered = false;

    const goTo = (index) => {
      current = (index + slides.length) % slides.length;
      const isRTL = document.documentElement.getAttribute('dir') === 'rtl' || document.documentElement.lang === 'ar';
      const sign = isRTL ? 1 : -1;
      track.style.transform = `translateX(${sign * current * 100}%)`;
      dots.forEach(d => d.classList.remove('active'));
      if (dots[current]) dots[current].classList.add('active');
    };

    const stopAuto = () => {
      if (autoTimer) {
        clearInterval(autoTimer);
        autoTimer = null;
      }
    };

    const startAuto = () => {
      stopAuto(); // Clear any existing timer to prevent fast stacking
      if (!isHovered) {
        autoTimer = setInterval(() => {
          goTo(current + 1);
        }, 5000); // Wait 5 seconds between slides
      }
    };

    const sliderWrap = track.closest('.blog-slider-wrap') || track.parentElement;
    if (sliderWrap) {
      sliderWrap.addEventListener('mouseenter', () => {
        isHovered = true;
        stopAuto();
      });
      sliderWrap.addEventListener('mouseleave', () => {
        isHovered = false;
        startAuto();
      });
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        goTo(current - 1);
        startAuto();
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        goTo(current + 1);
        startAuto();
      });
    }

    dots.forEach(dot => {
      dot.addEventListener('click', () => {
        const idx = parseInt(dot.dataset.index || dot.getAttribute('data-index'));
        if (!isNaN(idx)) {
          goTo(idx);
          startAuto();
        }
      });
    });

    // Touch swipe support
    let touchStartX = 0;
    track.addEventListener('touchstart', e => { 
      touchStartX = e.touches[0].clientX; 
      stopAuto();
    }, { passive: true });

    track.addEventListener('touchend', e => {
      const diff = touchStartX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 50) { 
        goTo(diff > 0 ? current + 1 : current - 1); 
      }
      startAuto();
    });

    startAuto();
  }

  // ==========================================
  // 6. DYNAMIC SHARE ARTICLE SECTION
  // ==========================================
  const articleBody = document.querySelector('.article-body');
  if (articleBody) {
    const isEnglish = document.documentElement.lang === 'en' || window.location.pathname.includes('/EN/');
    const shareTitle = isEnglish ? 'Share this Article' : 'مشاركة المقال';
    const copyLabel = isEnglish ? 'Copy Link' : 'نسخ الرابط';
    const whatsappLabel = isEnglish ? 'WhatsApp' : 'واتساب';
    const facebookLabel = isEnglish ? 'Facebook' : 'فيسبوك';
    const xLabel = isEnglish ? 'Share' : 'إكس';
    const copiedMessage = isEnglish ? 'Link copied to clipboard!' : 'تم نسخ رابط المقال بنجاح!';

    const shareContainer = document.createElement('div');
    shareContainer.className = 'share-article-section';
    shareContainer.innerHTML = `
      <h4 class="share-title">${shareTitle}</h4>
      <div class="share-buttons">
        <button class="share-btn share-copy" id="shareCopyBtn" aria-label="${copyLabel}">
          <i class="ph-bold ph-link"></i>
          <span>${copyLabel}</span>
        </button>
        <a href="#" class="share-btn share-whatsapp" id="shareWhatsappBtn" target="_blank" aria-label="${whatsappLabel}">
          <i class="ph-fill ph-whatsapp-logo"></i>
          <span>${whatsappLabel}</span>
        </a>
        <a href="#" class="share-btn share-x" id="shareXBtn" target="_blank" aria-label="${xLabel}">
          <i class="ph-fill ph-x-logo"></i>
          <span>${xLabel}</span>
        </a>
        <a href="#" class="share-btn share-facebook" id="shareFacebookBtn" target="_blank" aria-label="${facebookLabel}">
          <i class="ph-fill ph-facebook-logo"></i>
          <span>${facebookLabel}</span>
        </a>
      </div>
      <div class="share-toast" id="shareToast">${copiedMessage}</div>
    `;
    
    // Insert after the article-body content
    articleBody.after(shareContainer);

    // Get article details
    const articleUrl = encodeURIComponent(window.location.href);
    const articleTitle = encodeURIComponent(document.title);

    // Set share links
    document.getElementById('shareWhatsappBtn').href = `https://api.whatsapp.com/send?text=${articleTitle}%20${articleUrl}`;
    document.getElementById('shareXBtn').href = `https://twitter.com/intent/tweet?text=${articleTitle}&url=${articleUrl}`;
    document.getElementById('shareFacebookBtn').href = `https://www.facebook.com/sharer/sharer.php?u=${articleUrl}`;

    // Handle Copy Link
    const copyBtn = document.getElementById('shareCopyBtn');
    const toast = document.getElementById('shareToast');
    if (copyBtn && toast) {
      copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(window.location.href)
          .then(() => {
            toast.classList.add('show');
            setTimeout(() => {
              toast.classList.remove('show');
            }, 3000);
          })
          .catch(err => {
            console.error('Could not copy text: ', err);
          });
      });
    }
  }
});

