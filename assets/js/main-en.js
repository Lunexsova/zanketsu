// ============================================================
// Zanketsu Main Script (English) — Deferred, non-blocking
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

// Toast Function
function showToast(message) {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');
    toastMessage.textContent = message;
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(-50%) translateY(0)';
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(-50%) translateY(100px)';
    }, 3000);
}

// Scroll Progress
window.addEventListener('scroll', () => {
    const scrollTop    = document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const bar = document.querySelector('.scroll-progress');
    if (bar) bar.style.height = (scrollTop / scrollHeight) * 100 + '%';
}, { passive: true });

// Smooth scroll for nav links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
});

// EmailJS Form Submission
const waitlistForm = document.getElementById('waitlistForm');
if (waitlistForm) {
    waitlistForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const form = e.target;
        const button = form.querySelector('button[type="submit"]');
        const emailInput = form.querySelector('input[type="email"]');
        button.disabled = true;
        const originalText = button.innerHTML;
        button.innerHTML = '<i class="ph-duotone ph-spinner-gap" style="animation: spin-glow 1s linear infinite; display: inline-block;"></i> Sending...';
        fetch('https://api.emailjs.com/api/v1.0/email/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                service_id: 'service_t82gdnx',
                template_id: 'template_wfek2eb',
                user_id: 'Y6a7P5hB8wvhRElO-',
                template_params: {
                    title: 'New waitlist registration (English)',
                    name: emailInput.value,
                    email: emailInput.value,
                    social: 'None (Waitlist registration)',
                    message: 'This email was registered in the waitlist successfully from the English home page.',
                    new_customer: 'Zanketsu Portal'
                }
            })
        })
        .then(async (response) => {
            if (response.status === 200) { showToast('Thank you for registering! Your email has been saved successfully.'); form.reset(); }
            else { showToast('An error occurred, please try again later.'); }
        })
        .catch(() => showToast('Connection error. Please check your internet connection.'))
        .finally(() => { button.disabled = false; button.innerHTML = originalText; });
    });
}

// ——— Heavy work deferred to window.load ———
window.addEventListener('load', () => {

    // Particle System
    const canvas = document.getElementById('particles');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        let particles = [];

        function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
        resize();
        window.addEventListener('resize', resize, { passive: true });

        class Particle {
            constructor() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.size   = Math.random() * 2 + 0.5;
                this.speedX = (Math.random() - 0.5) * 0.5;
                this.speedY = (Math.random() - 0.5) * 0.5;
                this.opacity = Math.random() * 0.5 + 0.1;
            }
            update() {
                this.x += this.speedX; this.y += this.speedY;
                if (this.x > canvas.width)  this.x = 0;
                if (this.x < 0)             this.x = canvas.width;
                if (this.y > canvas.height) this.y = 0;
                if (this.y < 0)             this.y = canvas.height;
            }
            draw() {
                ctx.fillStyle = `rgba(220, 38, 38, ${this.opacity})`;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        function initParticles() {
            particles = [];
            const count = window.innerWidth < 768 ? 20 : 50;
            for (let i = 0; i < count; i++) particles.push(new Particle());
        }
        initParticles();

        function animateParticles() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach(p => { p.update(); p.draw(); });
            if (window.innerWidth > 768) {
                let linesDrawn = 0;
                for (let i = 0; i < particles.length && linesDrawn < 30; i++) {
                    for (let j = i + 1; j < particles.length && linesDrawn < 30; j++) {
                        const dx = particles[i].x - particles[j].x;
                        const dy = particles[i].y - particles[j].y;
                        const distSq = dx * dx + dy * dy;
                        if (distSq < 10000) {
                            const dist = Math.sqrt(distSq);
                            ctx.strokeStyle = `rgba(220, 38, 38, ${0.07 * (1 - dist / 100)})`;
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

    // Countdown
    function updateCountdown() {
        const diff = new Date('2027-07-15T00:00:00').getTime() - Date.now();
        const dEl = document.getElementById('days');
        const hEl = document.getElementById('hours');
        const mEl = document.getElementById('minutes');
        const sEl = document.getElementById('seconds');
        
        if (diff <= 0) {
            if (dEl) dEl.textContent    = '000';
            if (hEl) hEl.textContent   = '00';
            if (mEl) mEl.textContent = '00';
            if (sEl) sEl.textContent = '00';
            return;
        }
        if (dEl) dEl.textContent    = String(Math.floor(diff / 86400000)).padStart(3, '0');
        if (hEl) hEl.textContent   = String(Math.floor((diff % 86400000) / 3600000)).padStart(2, '0');
        if (mEl) mEl.textContent = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0');
        if (sEl) sEl.textContent = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0');
    }
    setInterval(updateCountdown, 1000);
    updateCountdown();

    // Reveal on Scroll
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('active'); });
    }, { threshold: 0.1 });
    document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

    // Social Modal
    const socialFabToggle  = document.getElementById('socialFabToggle');
    const socialModalClose = document.getElementById('socialModalClose');
    const socialModal      = document.getElementById('socialModal');
    const openSocialModal  = () => { socialModal.classList.add('active');    document.body.style.overflow = 'hidden'; };
    const closeSocialModal = () => { socialModal.classList.remove('active'); document.body.style.overflow = ''; };
    if (socialFabToggle)  socialFabToggle.addEventListener('click', openSocialModal);
    if (socialModalClose) socialModalClose.addEventListener('click', closeSocialModal);
    if (socialModal)      socialModal.addEventListener('click', e => { if (e.target === socialModal) closeSocialModal(); });

    // Ads Slider
    const slides      = document.querySelectorAll('.ads-slide');
    const dots        = document.querySelectorAll('.ads-dot');
    const prevBtn     = document.querySelector('.ads-prev');
    const nextBtn     = document.querySelector('.ads-next');
    const progressFill = document.querySelector('.ads-progress-fill');
    if (slides.length) {
        let currentIndex = 0, startTime, elapsed = 0, animFrameId;
        const intervalTime = 6000;

        function showSlide(index) {
            slides.forEach(s => s.classList.remove('active'));
            dots.forEach(d => d.classList.remove('active'));
            slides[index].classList.add('active');
            if (dots[index]) dots[index].classList.add('active');
            currentIndex = index;
            resetProgressBar();
        }
        function nextSlide() { showSlide((currentIndex + 1) % slides.length); }
        function prevSlide() { showSlide((currentIndex - 1 + slides.length) % slides.length); }
        function startTimer() { startTime = Date.now() - elapsed; animateProgress(); }
        function pauseTimer() { elapsed = Date.now() - startTime; cancelAnimationFrame(animFrameId); }
        function resetProgressBar() {
            cancelAnimationFrame(animFrameId);
            elapsed = 0; startTime = Date.now();
            if (progressFill) progressFill.style.width = '0%';
            animateProgress();
        }
        function animateProgress() {
            const progress = (Date.now() - startTime) / intervalTime;
            if (progress >= 1) { if (progressFill) progressFill.style.width = '100%'; nextSlide(); }
            else { if (progressFill) progressFill.style.width = `${progress * 100}%`; animFrameId = requestAnimationFrame(animateProgress); }
        }

        if (nextBtn) nextBtn.addEventListener('click', nextSlide);
        if (prevBtn) prevBtn.addEventListener('click', prevSlide);
        dots.forEach(dot => dot.addEventListener('click', e => showSlide(parseInt(e.target.getAttribute('data-index')))));
        const sliderContainer = document.querySelector('.ads-slider-container');
        if (sliderContainer) {
            sliderContainer.addEventListener('mouseenter', pauseTimer);
            sliderContainer.addEventListener('mouseleave', startTimer);
        }
        showSlide(0);
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
