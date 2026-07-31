// ============================================================
// Zanketsu Marketing Script (English) — Deferred, non-blocking
// ============================================================

// Mobile Menu Interactivity
const mobileMenuToggle = document.getElementById('mobileMenuToggle');
const mobileMenuClose   = document.getElementById('mobileMenuClose');
const mobileMenu        = document.getElementById('mobileMenu');
const mobileLinks       = document.querySelectorAll('.mobile-nav-links a');

function openMobileMenu()  { mobileMenu.classList.add('active');    document.body.classList.add('mobile-menu-open'); }
function closeMobileMenu() { mobileMenu.classList.remove('active'); document.body.classList.remove('mobile-menu-open'); }

if (mobileMenuToggle) mobileMenuToggle.addEventListener('click', openMobileMenu);
if (mobileMenuClose)  mobileMenuClose.addEventListener('click', closeMobileMenu);
if (mobileMenu)       mobileMenu.addEventListener('click', e => { if (e.target === mobileMenu) closeMobileMenu(); });
mobileLinks.forEach(link => link.addEventListener('click', closeMobileMenu));

// Toast Function with Dynamic Fallback Creation
function showToast(message, isSuccess = true) {
    let toast = document.getElementById('toast');
    let toastMessage = document.getElementById('toast-message');
    
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        toast.style.position = 'fixed';
        toast.style.bottom = '30px';
        toast.style.left = '50%';
        toast.style.transform = 'translateX(-50%) translateY(100px)';
        toast.style.zIndex = '999999';
        toast.style.padding = '14px 28px';
        toast.style.borderRadius = '12px';
        toast.style.background = isSuccess 
            ? 'linear-gradient(135deg, rgba(22, 32, 25, 0.95), rgba(15, 25, 18, 0.98))' 
            : 'linear-gradient(135deg, rgba(35, 20, 20, 0.95), rgba(25, 12, 12, 0.98))';
        toast.style.border = isSuccess 
            ? '1px solid rgba(46, 204, 113, 0.4)' 
            : '1px solid rgba(231, 76, 60, 0.4)';
        toast.style.color = '#ffffff';
        toast.style.fontSize = '0.95rem';
        toast.style.fontWeight = '600';
        toast.style.boxShadow = '0 10px 30px rgba(0,0,0,0.5)';
        toast.style.backdropFilter = 'blur(10px)';
        toast.style.webkitBackdropFilter = 'blur(10px)';
        toast.style.transition = 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
        toast.style.opacity = '0';
        toast.style.direction = (document.documentElement.lang === 'ar' || document.documentElement.dir === 'rtl') ? 'rtl' : 'ltr';
        toast.style.textAlign = 'center';
        
        toastMessage = document.createElement('span');
        toastMessage.id = 'toast-message';
        toast.appendChild(toastMessage);
        document.body.appendChild(toast);
    }
    
    toastMessage.textContent = message;
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(-50%) translateY(0)';
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(-50%) translateY(100px)';
    }, 4500);
}

// Earnings Simulator Logic
const salesSlider = document.getElementById('salesSlider');
const salesValDisplay = document.getElementById('salesValueDisplay');
const l1Earn = document.getElementById('l1Earn');
const l2Earn = document.getElementById('l2Earn');
const l3Earn = document.getElementById('l3Earn');
const l4Earn = document.getElementById('l4Earn');
const l5Earn = document.getElementById('l5Earn');

function calculateEarnings() {
    const sales = parseFloat(salesSlider.value);
    salesValDisplay.textContent = '$' + sales.toLocaleString();
    
    l1Earn.textContent = '$' + Math.round(sales * 0.20).toLocaleString();
    l2Earn.textContent = '$' + Math.round(sales * 0.22).toLocaleString();
    l3Earn.textContent = '$' + Math.round(sales * 0.25).toLocaleString();
    l4Earn.textContent = '$' + Math.round(sales * 0.30).toLocaleString();
    l5Earn.textContent = '$' + Math.round(sales * 0.35).toLocaleString();
}

if (salesSlider) {
    salesSlider.addEventListener('input', calculateEarnings);
    calculateEarnings();
}

// Scroll Progress
window.addEventListener('scroll', () => {
    const scrollTop = document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const progress = (scrollTop / scrollHeight) * 100;
    const bar = document.querySelector('.scroll-progress');
    if (bar) bar.style.height = progress + '%';
}, { passive: true });

// Smooth scroll for nav links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
});

// EmailJS Partner Form Submission
const partnerForm = document.getElementById('partnerForm');
if (partnerForm) {
    partnerForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const form = e.target;
        const button = form.querySelector('button[type="submit"]');
        
        const nameVal = document.getElementById('joinName').value;
        const emailVal = document.getElementById('joinEmail').value;
        const socialVal = document.getElementById('joinSocial').value;
        const msgVal = document.getElementById('joinMsg').value;
        
        button.disabled = true;
        const originalText = button.innerHTML;
        button.innerHTML = '<i class="ph-duotone ph-spinner-gap" style="animation: spin-glow 1s linear infinite; display: inline-block;"></i> Submitting...';
        
        const payload = {
            service_id: 'service_t82gdnx',
            template_id: 'template_wfek2eb',
            user_id: 'Y6a7P5hB8wvhRElO-',
            template_params: {
                title: 'New Founding Partner Application',
                name: nameVal,
                email: emailVal,
                social: socialVal,
                message: msgVal,
                new_customer: 'Partners Portal'
            }
        };
        
        fetch('https://api.emailjs.com/api/v1.0/email/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        })
        .then(async (response) => {
            if (response.status == 200) {
                showToast('Your interest has been successfully registered! Your founding partner seat is reserved and we will contact you soon.');
                form.reset();
            } else {
                showToast('An error occurred while submitting, please try again later.', false);
            }
        })
        .catch(error => {
            showToast('Connection error. Please check your internet connection.', false);
            console.error('EmailJS network error:', error);
        })
        .finally(() => {
            button.disabled = false;
            button.innerHTML = originalText;
        });
    });
}

// EmailJS Contact & Consultation Form Submission (استشارات وحلول — تواصل معنا الآن)
const contactForm = document.getElementById('contact-form');
if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const form = e.target;
        const button = form.querySelector('button[type="submit"]') || document.getElementById('submit-contact-btn');
        
        const nameVal = (document.getElementById('contact-name') || {}).value || '';
        const phoneVal = (document.getElementById('contact-phone') || {}).value || '';
        const emailVal = (document.getElementById('contact-email') || {}).value || '';
        const msgVal = (document.getElementById('contact-msg') || {}).value || '';
        
        const isArabic = document.documentElement.lang === 'ar' || document.documentElement.getAttribute('dir') === 'rtl';
        
        button.disabled = true;
        const originalText = button.innerHTML;
        const loadingText = isArabic 
            ? '<i class="ph-duotone ph-spinner-gap" style="animation: spin-glow 1s linear infinite; display: inline-block;"></i> جاري إرسال الطلب...'
            : '<i class="ph-duotone ph-spinner-gap" style="animation: spin-glow 1s linear infinite; display: inline-block;"></i> Submitting...';
        button.innerHTML = loadingText;
        
        const payload = {
            service_id: 'service_t82gdnx',
            template_id: 'template_wfek2eb',
            user_id: 'Y6a7P5hB8wvhRElO-',
            template_params: {
                title: isArabic ? 'طلب استشارة جديد (استشارات وحلول)' : 'New Consultation Inquiry (Contact Us)',
                name: nameVal,
                phone: phoneVal,
                social: phoneVal,
                email: emailVal,
                message: `${msgVal}\n\n—\nرقم الهاتف: ${phoneVal}`,
                new_customer: isArabic ? 'قسم الاستشارات والحلول — زانكيتسو' : 'Consulting & Solutions Section'
            }
        };
        
        fetch('https://api.emailjs.com/api/v1.0/email/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        })
        .then(async (response) => {
            const resText = await response.text();
            if (response.status === 200) {
                const successMsg = isArabic 
                    ? 'تم استلام طلبكم الاستشاري بنجاح! سيقوم مستشار زانكيتسو بالتواصل معكم قريباً.'
                    : 'Your consultation request has been received successfully! A Zanketsu advisor will contact you soon.';
                showToast(successMsg, true);
                form.reset();
            } else {
                console.error('EmailJS response error:', response.status, resText);
                const errorMsg = isArabic 
                    ? 'حدث خطأ أثناء إرسال الطلب، يرجى المحاولة مرة أخرى لاحقاً.'
                    : 'An error occurred while submitting. Please try again later.';
                showToast(errorMsg, false);
            }
        })
        .catch(error => {
            const netErrorMsg = isArabic 
                ? 'تعذر الاتصال بالخادم. يرجى التحقق من اتصال الإنترنت.'
                : 'Connection error. Please check your internet connection.';
            showToast(netErrorMsg, false);
            console.error('EmailJS network error:', error);
        })
        .finally(() => {
            button.disabled = false;
            button.innerHTML = originalText;
        });
    });
}

// ——— Heavy work deferred to window.load ———
window.addEventListener('load', () => {

    // Particle System
    const canvas = document.getElementById('particles');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        let particles = [];

        function resize() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
        resize();
        window.addEventListener('resize', resize, { passive: true });

        class Particle {
            constructor() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.size = Math.random() * 2 + 0.5;
                this.speedX = (Math.random() - 0.5) * 0.5;
                this.speedY = (Math.random() - 0.5) * 0.5;
                this.opacity = Math.random() * 0.5 + 0.1;
            }
            update() {
                this.x += this.speedX;
                this.y += this.speedY;
                if (this.x > canvas.width) this.x = 0;
                if (this.x < 0) this.x = canvas.width;
                if (this.y > canvas.height) this.y = 0;
                if (this.y < 0) this.y = canvas.height;
            }
            draw() {
                ctx.fillStyle = `rgba(107, 30, 35, ${this.opacity})`;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        function initParticles() {
            particles = [];
            const count = window.innerWidth < 768 ? 20 : 50;
            for (let i = 0; i < count; i++) {
                particles.push(new Particle());
            }
        }
        initParticles();

        function animateParticles() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach(p => {
                p.update();
                p.draw();
            });
            if (window.innerWidth > 768) {
                let linesDrawn = 0;
                for (let i = 0; i < particles.length && linesDrawn < 30; i++) {
                    for (let j = i + 1; j < particles.length && linesDrawn < 30; j++) {
                        const dx = particles[i].x - particles[j].x;
                        const dy = particles[i].y - particles[j].y;
                        const distSq = dx * dx + dy * dy;
                        if (distSq < 10000) {
                            const dist = Math.sqrt(distSq);
                            ctx.strokeStyle = `rgba(107, 30, 35, ${0.07 * (1 - dist / 100)})`;
                            ctx.lineWidth = 0.5;
                            ctx.beginPath();
                            ctx.moveTo(particles[i].x, particles[i].y);
                            ctx.lineTo(particles[j].x, particles[j].y);
                            ctx.stroke();
                            linesDrawn++;
                        }
                    }
                }
            }
            requestAnimationFrame(animateParticles);
        }
        animateParticles();
    }

    // Reveal on Scroll
    const revealElements = document.querySelectorAll('.reveal');
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    }, { threshold: 0.1 });
    revealElements.forEach(el => revealObserver.observe(el));

    // Social Modal Interactivity
    const socialFabToggle = document.getElementById('socialFabToggle');
    const socialModalClose = document.getElementById('socialModalClose');
    const socialModal = document.getElementById('socialModal');

    const openSocialModal = () => {
        socialModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    };

    const closeSocialModal = () => {
        socialModal.classList.remove('active');
        document.body.style.overflow = '';
    };

    if (socialFabToggle) {
        socialFabToggle.addEventListener('click', openSocialModal);
    }
    if (socialModalClose) {
        socialModalClose.addEventListener('click', closeSocialModal);
    }
    if (socialModal) {
        socialModal.addEventListener('click', function(e) {
            if (e.target === socialModal) {
                closeSocialModal();
            }
        });
    }
});

// Navigation Active State & ScrollSpy
(function() {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-links a, .mobile-nav-links a');
    const isHome = currentPath.endsWith('/') || currentPath.endsWith('index.html') || currentPath.endsWith('index-en.html') || (!currentPath.includes('.html') && !currentPath.includes('/blog/') && !currentPath.includes('/system/'));

    function updateNavigation() {
        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (!href) return;
            link.classList.remove('active');

            if (!isHome) {
                if (currentPath.includes('marketing') && href.includes('marketing')) {
                    link.classList.add('active');
                } else if ((currentPath.includes('/blog/') || currentPath.includes('/blog')) && href.includes('blog/')) {
                    link.classList.add('active');
                } else if ((currentPath.includes('/system/') || currentPath.includes('/system')) && href.includes('system/')) {
                    link.classList.add('active');
                }
            }
        });
    }

    updateNavigation();

    if (isHome) {
        const sections = document.querySelectorAll('section[id], header[id]');
        const scrollSpy = () => {
            let currentSectionId = '';
            const scrollPosition = window.scrollY + 200;

            sections.forEach(section => {
                const sectionTop = section.offsetTop;
                const sectionHeight = section.offsetHeight;
                if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                    currentSectionId = section.getAttribute('id');
                }
            });

            navLinks.forEach(link => {
                const href = link.getAttribute('href');
                if (!href) return;
                
                if (currentSectionId && (href.endsWith('#' + currentSectionId) || href === '#' + currentSectionId)) {
                    link.classList.add('active');
                } else if (href.startsWith('#') || href.includes('#')) {
                    link.classList.remove('active');
                }
            });
        };
        window.addEventListener('scroll', scrollSpy, { passive: true });
        scrollSpy();
    }
})();
