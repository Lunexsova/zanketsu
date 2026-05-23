// ============================================================
// Zanketsu Legal Script — Deferred, non-blocking
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

// Tab switching logic
const tabs = document.querySelectorAll('.legal-nav-btn');
const contents = document.querySelectorAll('.legal-tab-content');

function switchTab(tabId) {
    tabs.forEach(btn => {
        if (btn.getAttribute('data-tab') === tabId) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    contents.forEach(content => {
        if (content.id === tabId) {
            content.classList.add('active');
        } else {
            content.classList.remove('active');
        }
    });
}

tabs.forEach(btn => {
    btn.addEventListener('click', () => {
        const tabId = btn.getAttribute('data-tab');
        switchTab(tabId);
        window.location.hash = tabId;
    });
});

// Initialize from URL hash on load & hashchange
function handleHash() {
    const hash = window.location.hash.substring(1);
    if (hash && (hash === 'terms' || hash === 'privacy')) {
        switchTab(hash);
    }
}

window.addEventListener('DOMContentLoaded', handleHash);
window.addEventListener('hashchange', handleHash);

// ——— Heavy work deferred to window.load ———
window.addEventListener('load', () => {

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

    if (socialFabToggle)  socialFabToggle.addEventListener('click', openSocialModal);
    if (socialModalClose) socialModalClose.addEventListener('click', closeSocialModal);
    if (socialModal) {
        socialModal.addEventListener('click', e => { if (e.target === socialModal) closeSocialModal(); });
    }

    // Particle background animation
    const canvas = document.getElementById('particles');
    if (canvas) {
        const ctx = canvas.getContext('2d');

        function resizeCanvas() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
        window.addEventListener('resize', resizeCanvas, { passive: true });
        resizeCanvas();

        const particleCount = 30;
        const pArr = [];
        for (let i = 0; i < particleCount; i++) {
            pArr.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                radius: Math.random() * 1.5 + 0.5,
                vx: (Math.random() - 0.5) * 0.4,
                vy: (Math.random() - 0.5) * 0.4,
                alpha: Math.random() * 0.5 + 0.1
            });
        }
        function drawP() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            pArr.forEach(p => {
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(220, 38, 38, ${p.alpha})`;
                ctx.fill();
                p.x += p.vx;
                p.y += p.vy;
                if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
                if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
            });
            requestAnimationFrame(drawP);
        }
        drawP();
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
