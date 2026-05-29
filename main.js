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
  
  window.triggerWhatsAppChat = (message = "Hello RPNMore, I would like to inquire about your services.") => {
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  // Bind generic WhatsApp CTA buttons
  const whatsappButtons = document.querySelectorAll('[data-whatsapp-trigger]');
  whatsappButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const message = btn.getAttribute('data-whatsapp-trigger') || undefined;
      window.triggerWhatsAppChat(message);
    });
  });

  // 4. Form Interceptions for WhatsApp Conversions
  // Intercept the Main Contact Form
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('contact-name')?.value || '';
      const email = document.getElementById('contact-email')?.value || '';
      const service = document.getElementById('contact-service')?.value || 'General Inquiry';
      const message = document.getElementById('contact-message')?.value || '';
      
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
    carInquiryForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('car-client-name')?.value || '';
      const carModel = document.getElementById('car-model-req')?.value || '';
      const budget = document.getElementById('car-budget')?.value || '';
      const destPort = document.getElementById('car-destination')?.value || '';
      const notes = document.getElementById('car-notes')?.value || '';
      
      const whatsappText = `*RPNMore Car Preorder Inquiry*\n\n` +
                           `• *Name:* ${name}\n` +
                           `• *Car Required:* ${carModel}\n` +
                           `• *Budget:* ${budget}\n` +
                           `• *Destination Port/Country:* ${destPort}\n` +
                           `• *Specific Notes:* ${notes}`;
                           
      window.triggerWhatsAppChat(whatsappText);
    });
  }

  // Intercept Property Inquiry Form
  const propInquiryForm = document.getElementById('property-inquiry-form');
  if (propInquiryForm) {
    propInquiryForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('prop-client-name')?.value || '';
      const propInterest = document.getElementById('prop-interest')?.value || '';
      const budget = document.getElementById('prop-budget')?.value || '';
      const timeline = document.getElementById('prop-timeline')?.value || '';
      
      const whatsappText = `*RPNMore Real Estate Inquiry*\n\n` +
                           `• *Name:* ${name}\n` +
                           `• *Property/Location Interest:* ${propInterest}\n` +
                           `• *Investment Budget:* ${budget}\n` +
                           `• *Timeline:* ${timeline}`;
                           
      window.triggerWhatsAppChat(whatsappText);
    });
  }

  // Intercept AI/Digital Services Form
  const aiInquiryForm = document.getElementById('ai-inquiry-form');
  if (aiInquiryForm) {
    aiInquiryForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('ai-client-name')?.value || '';
      const business = document.getElementById('ai-business-name')?.value || '';
      const need = document.getElementById('ai-need')?.value || '';
      
      const whatsappText = `*RPNMore AI & Business Automation Inquiry*\n\n` +
                           `• *Name:* ${name}\n` +
                           `• *Business Name:* ${business}\n` +
                           `• *Automation/AI Requirements:* ${need}`;
                           
      window.triggerWhatsAppChat(whatsappText);
    });
  }
});
