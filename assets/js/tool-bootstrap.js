// Theme Initialization to prevent flash
(function() {
  var savedTheme = localStorage.getItem('zanketsu-theme') || localStorage.getItem('zan_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
})();

document.addEventListener('DOMContentLoaded', function() {
  // Determine relative path depth dynamically
  var path = window.location.pathname;
  var rootPrefix = '../../';
  if (path.includes('/system/EN/')) {
    var afterEN = path.split('/system/EN/')[1];
    var parts = afterEN.split('/').filter(Boolean);
    rootPrefix = '../'.repeat(parts.length + 1);
  } else if (path.includes('/system/')) {
    var afterSystem = path.split('/system/')[1];
    var parts = afterSystem.split('/').filter(Boolean);
    rootPrefix = '../'.repeat(parts.length);
  }

  // Determine language (is Arabic if path does not contain /system/EN/)
  var isAr = !path.includes('/system/EN/');

  var labels = {
    backText: isAr ? 'الرجوع للأدوات' : 'Back to Tools',
    backIcon: 'ph-arrow-left',
    copyText: isAr ? 'نسخ الرابط' : 'Save Link',
    copyCopied: isAr ? 'تم النسخ!' : 'Copied!',
    brandTitle: isAr ? 'زَانْكِتْسُو القابضة' : 'ZANKETSU Holding',
    brandDesc: isAr 
      ? 'مجموعة زانكتسو القابضة هي تكتل تكنولوجي برؤية يمنية حديثة، تهدف لبناء وتأسيس البنية التحتية الرقمية للقطاعات المالية والخدمية والتجارية في العالم العربي.' 
      : 'Zanketsu Holding is a technology conglomerate with a modern Yemeni vision, aiming to build and establish the digital infrastructure for financial, service, and business sectors in the Arab world.',
    quickLinks: isAr ? 'روابط سريعة' : 'Quick Links',
    linkTechProj: isAr ? 'المشاريع التقنية' : 'Technical Projects',
    linkTechDetails: isAr ? 'التفاصيل التقنية' : 'Technical Details',
    linkLaunchPlan: isAr ? 'خطة الإطلاق 2027' : 'Launch Plan 2027',
    linkPartners: isAr ? 'شركاء البنوك والخدمات' : 'Bank & Service Partners',
    coreSystems: isAr ? 'الأنظمة الأساسية' : 'Core Systems',
    sysYemengate: isAr ? 'بوابة التكامل YEMENGATE' : 'YEMENGATE Integration Gate',
    sysZenix: isAr ? 'المحفظة الشخصية ZENIX' : 'ZENIX Personal Wallet',
    sysDocspot: isAr ? 'إدارة المستشفيات DOCSPOT-X1' : 'DOCSPOT-X1 Medical Management',
    sysAcademix: isAr ? 'إدارة المدارس YEMEN ACADEMIX' : 'YEMEN ACADEMIX School Management',
    copyright: isAr ? '© 2026 مجموعة زانكتسو القابضة. جميع الحقوق محفوظة. تأسست وتنطلق في 2027.' : '© 2026 Zanketsu Holding. All rights reserved. Founded & launching in 2027.',
    homeUrl: isAr ? `${rootPrefix}index.html` : `${rootPrefix}index-en.html`
  };

  // 1. Replace Navigation with Premium Header
  var oldNav = document.getElementById('zankNav') || document.querySelector('.zank-nav');
  if (oldNav) {
    var newHeader = document.createElement('header');
    newHeader.className = 'tool-header';
    newHeader.innerHTML = `
      <div class="nav-container">
        <div class="brand">
          <a href="${labels.homeUrl}" id="brand-link" aria-label="Zanketsu Holding Home">
            <img src="${rootPrefix}img/logo/zankw.webp" alt="Zanketsu Holding Logo" id="nav-logo">
          </a>
        </div>
        
        <div class="tool-nav-middle">
          <a href="../index.html" class="tool-back-btn">
            <i class="ph-bold ${labels.backIcon}"></i>
            <span>${labels.backText}</span>
          </a>
        </div>
  
        <div class="nav-actions">
          <button class="tool-copy-btn" id="tool-copy-link" aria-label="Copy page link to save for later">
            <i class="ph-bold ph-link"></i>
            <span>${labels.copyText}</span>
          </button>
          <button class="theme-toggle-btn" id="theme-toggle" aria-label="Toggle dark and light mode">
            <i class="ph-fill ph-sun-horizon" aria-hidden="true"></i>
            <i class="ph-fill ph-moon-stars" aria-hidden="true"></i>
          </button>
        </div>
      </div>
    `;
    oldNav.parentNode.replaceChild(newHeader, oldNav);
  }

  // Remove Mobile Overlay
  var oldOverlay = document.getElementById('zankMobileOverlay') || document.querySelector('.zank-mobile-overlay');
  if (oldOverlay) {
    oldOverlay.remove();
  }

  // Remove old back button if it exists
  var oldBackBtn = document.querySelector('.back-btn');
  if (oldBackBtn) {
    oldBackBtn.style.display = 'none';
  }

  // 2. Replace Footer with Full Footer
  var oldFooter = document.querySelector('footer.zank-footer') || document.querySelector('footer');
  if (oldFooter) {
    var newFooter = document.createElement('footer');
    newFooter.className = 'tool-footer';
    newFooter.innerHTML = `
      <div class="footer-yemeni-grid"></div>
      <div class="container">
        <div class="footer-top">
          <div class="footer-brand">
            <h3 class="gold-text">${labels.brandTitle}</h3>
            <p>${labels.brandDesc}</p>
          </div>
  
          <div class="footer-links">
            <h4>${labels.quickLinks}</h4>
            <ul>
              <li><a href="${labels.homeUrl}#projects">${labels.linkTechProj}</a></li>
              <li><a href="${labels.homeUrl}#details">${labels.linkTechDetails}</a></li>
              <li><a href="${labels.homeUrl}#schedule">${labels.linkLaunchPlan}</a></li>
              <li><a href="${labels.homeUrl}#partners">${labels.linkPartners}</a></li>
            </ul>
          </div>
  
          <div class="footer-links">
            <h4>${labels.coreSystems}</h4>
            <ul>
              <li><a href="${labels.homeUrl}#projects">${labels.sysYemengate}</a></li>
              <li><a href="${labels.homeUrl}#projects">${labels.sysZenix}</a></li>
              <li><a href="${labels.homeUrl}#projects">${labels.sysDocspot}</a></li>
              <li><a href="${labels.homeUrl}#projects">${labels.sysAcademix}</a></li>
            </ul>
          </div>
        </div>
  
        <div class="footer-bottom">
          <p>${labels.copyright}</p>
  
          <div class="social-links">
            <a href="https://wa.me/201202583640" target="_blank" class="social-icon social-icon-whatsapp" aria-label="WhatsApp">
              <i class="ph-fill ph-whatsapp-logo"></i>
            </a>
            <a href="https://www.instagram.com/zanketsue?igsh=MWFlcmZ4bjByN3pidg==" target="_blank" class="social-icon social-icon-instagram" aria-label="Instagram">
              <i class="ph-bold ph-instagram-logo"></i>
            </a>
            <a href="https://www.facebook.com/share/17tMUPP5A3/" target="_blank" class="social-icon social-icon-facebook" aria-label="Facebook">
              <i class="ph-bold ph-facebook-logo"></i>
            </a>
          </div>
        </div>
      </div>
    `;
    oldFooter.parentNode.replaceChild(newFooter, oldFooter);
  }

  // 3. Attach Listeners
  // Theme Toggle Listener
  var themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', function() {
      var currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
      var newTheme = currentTheme === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('zanketsu-theme', newTheme);
      localStorage.setItem('zan_theme', newTheme);
    });
  }

  // Copy Link (Save) Listener
  var copyLinkBtn = document.getElementById('tool-copy-link');
  if (copyLinkBtn) {
    copyLinkBtn.addEventListener('click', function() {
      var btn = this;
      navigator.clipboard.writeText(window.location.href).then(function() {
        var originalHTML = btn.innerHTML;
        btn.innerHTML = `<i class="ph-bold ph-check"></i><span>${labels.copyCopied}</span>`;
        btn.classList.add('copied');
        setTimeout(function() {
          btn.innerHTML = originalHTML;
          btn.classList.remove('copied');
        }, 2000);
      });
    });
  }
});
