// RPNMore Shared Interactivity & WhatsApp Lead Capture

document.addEventListener('DOMContentLoaded', () => {
  // 1. Header scroll effect
  const header = document.querySelector('header');
  const handleScroll = () => {
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  };
  window.addEventListener('scroll', handleScroll);
  handleScroll(); // Run once in case page loads scrolled

  // 2. Mobile Menu Toggle
  const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
  const closeMenuBtn = document.querySelector('.close-menu-btn');
  const mobileNav = document.querySelector('.mobile-nav');

  if (mobileMenuBtn && mobileNav) {
    mobileMenuBtn.addEventListener('click', () => {
      mobileNav.classList.add('open');
      document.body.style.overflow = 'hidden'; // Stop scrolling background
    });
  }

  if (closeMenuBtn && mobileNav) {
    closeMenuBtn.addEventListener('click', () => {
      mobileNav.classList.remove('open');
      document.body.style.overflow = '';
    });
  }

  // Close mobile nav when clicking a link
  const mobileLinks = document.querySelectorAll('.mobile-nav .nav-link');
  mobileLinks.forEach(link => {
    link.addEventListener('click', () => {
      mobileNav.classList.remove('open');
      document.body.style.overflow = '';
    });
  });

  // 3. WhatsApp Direct Navigation
  const WHATSAPP_NUMBER = '971501234567'; // RPNMore official UAE contact
  const API_BASE = '';

  window.triggerWhatsAppChat = (message = "Hello RPNMore, I would like to inquire about your services.") => {
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  async function postLead(endpoint, payload) {
    try {
      await fetch(`${API_BASE}/api/leads/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.error('Lead submission error:', err);
    }
  }

  // 3.5 Dynamic Hero Images
  async function loadHeroImages() {
    const heroEls = document.querySelectorAll('[data-page]');
    for (const el of heroEls) {
      const page = el.getAttribute('data-page');
      try {
        const res = await fetch(`${API_BASE}/api/hero-images/${page}`);
        if (res.ok) {
          const data = await res.json();
          if (data.imageUrl) {
            el.style.backgroundImage = `url('${data.imageUrl}')`;
          }
          if (data.altText && el.alt !== undefined) {
            el.alt = data.altText;
          }
        }
      } catch (err) {
        console.error('Hero image load error:', err);
      }
    }
  }
  loadHeroImages();

  // Bind generic WhatsApp CTA buttons
  const whatsappButtons = document.querySelectorAll('[data-whatsapp-trigger]');
  whatsappButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const message = btn.getAttribute('data-whatsapp-trigger') || undefined;
      window.triggerWhatsAppChat(message);
    });
  });

  // 4. Form Interceptions for WhatsApp Conversions + Backend Capture
  // Intercept the Main Contact Form
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('contact-name')?.value || '';
      const email = document.getElementById('contact-email')?.value || '';
      const service = document.getElementById('contact-service')?.value || 'General Inquiry';
      const message = document.getElementById('contact-message')?.value || '';

      await postLead('contact', { name, email, service, message });

      const whatsappText = `*RPNMore Web Lead - Contact Form*\n\n` +
                           `• *Name:* ${name}\n` +
                           `• *Email:* ${email}\n` +
                           `• *Inquiry Type:* ${service}\n` +
                           `• *Message:* ${message}`;

      window.triggerWhatsAppChat(whatsappText);
    });
  }

  // Intercept Car Preorder/Inquiry Form
  const carInquiryForm = document.getElementById('car-inquiry-form');
  if (carInquiryForm) {
    carInquiryForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('car-client-name')?.value || '';
      const carModel = document.getElementById('car-model-req')?.value || '';
      const budget = document.getElementById('car-budget')?.value || '';
      const budgetCurrency = document.getElementById('car-budget-currency')?.value || 'USD';
      const destinationPort = document.getElementById('car-destination')?.value || '';
      const notes = document.getElementById('car-notes')?.value || '';

      await postLead('car', { name, carModel, budget, budgetCurrency, destinationPort, notes });

      const currencyLabel = budgetCurrency === 'GHS' ? 'GH₵' : '$';
      const whatsappText = `*RPNMore Car Preorder Inquiry*\n\n` +
                           `• *Name:* ${name}\n` +
                           `• *Car Required:* ${carModel}\n` +
                           `• *Budget:* ${currencyLabel}${budget}\n` +
                           `• *Destination Port/Country:* ${destinationPort}\n` +
                           `• *Specific Notes:* ${notes}`;

      window.triggerWhatsAppChat(whatsappText);
    });
  }

  // Intercept Property Inquiry Form
  const propInquiryForm = document.getElementById('property-inquiry-form');
  if (propInquiryForm) {
    propInquiryForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('prop-client-name')?.value || '';
      const propertyInterest = document.getElementById('prop-interest')?.value || '';
      const budget = document.getElementById('prop-budget')?.value || '';
      const timeline = document.getElementById('prop-timeline')?.value || '';

      await postLead('property', { name, propertyInterest, budget, timeline });

      const whatsappText = `*RPNMore Real Estate Inquiry*\n\n` +
                           `• *Name:* ${name}\n` +
                           `• *Property/Location Interest:* ${propertyInterest}\n` +
                           `• *Investment Budget:* ${budget}\n` +
                           `• *Timeline:* ${timeline}`;

      window.triggerWhatsAppChat(whatsappText);
    });
  }

  // Intercept AI/Digital Services Form
  const aiInquiryForm = document.getElementById('ai-inquiry-form');
  if (aiInquiryForm) {
    aiInquiryForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('ai-client-name')?.value || '';
      const businessName = document.getElementById('ai-business-name')?.value || '';
      const need = document.getElementById('ai-need')?.value || '';

      await postLead('ai', { name, businessName, need });

      const whatsappText = `*RPNMore AI & Business Automation Inquiry*\n\n` +
                           `• *Name:* ${name}\n` +
                           `• *Business Name:* ${businessName}\n` +
                           `• *Automation/AI Requirements:* ${need}`;

      window.triggerWhatsAppChat(whatsappText);
    });
  }

  // 5. Scroll-triggered reveal animations (Intersection Observer)
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });

  // Elements to animate on scroll
  const revealSelectors = [
    '.glass-card',
    '.listing-card',
    '.blog-card',
    '.testimonial-card',
    '.gallery-card',
    '.payment-badge',
    '.ai-feature-item',
    '.book-card',
  ];

  revealSelectors.forEach(selector => {
    document.querySelectorAll(selector).forEach((el, i) => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(30px)';
      el.style.transition = `opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${i * 0.1}s, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${i * 0.1}s`;
      revealObserver.observe(el);
    });
  });

  // Gallery card hover slide effect (clip-path shimmer)
  document.querySelectorAll('.gallery-card').forEach(card => {
    card.addEventListener('mouseenter', () => {
      card.style.setProperty('--shimmer', '1');
    });
    card.addEventListener('mouseleave', () => {
      card.style.setProperty('--shimmer', '0');
    });
  });
});
