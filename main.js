// RPNMore Shared Interactivity & WhatsApp Lead Capture

const API_BASE = '';

/* ─── XSS Protection: escape HTML before innerHTML ─── */
function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

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
  const WHATSAPP_NUMBER = '971508472503'; // RPNMore official UAE contact

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
            el.style.backgroundImage = `url('${escapeHtml(data.imageUrl)}')`;
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

  // CMS Dynamic Content Injection
  initDynamicContent();
});

// --- CMS Dynamic Content Helpers ---

async function fetchCMS(endpoint) {
  try {
    const res = await fetch(`${API_BASE}/api/cms/${endpoint}`);
    if (!res.ok) throw new Error('Fetch failed');
    return await res.json();
  } catch (err) {
    console.error(`CMS fetch error for ${endpoint}:`, err);
    return null;
  }
}

function observeNewElements(els) {
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });

  els.forEach((el, i) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = `opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${i * 0.1}s, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${i * 0.1}s`;
    revealObserver.observe(el);
  });
}

function renderCarCard(car) {
  const safeTitle = escapeHtml(car.title);
  const imageHtml = car.imageUrl
    ? `<img class="listing-image" src="${escapeHtml(car.imageUrl)}" alt="${safeTitle}" loading="lazy">`
    : `<div style="background: linear-gradient(135deg, #101f42 0%, #030712 100%); width:100%; height:100%; position:absolute; display:flex; align-items:center; justify-content:center; flex-direction:column; gap:10px;"><svg width="50" height="50" fill="none" stroke="var(--accent)" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"/><path stroke-linecap="round" stroke-linejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l2.414 2.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17h5m10 0h-5"/></svg><span style="font-family:var(--font-heading); color:white; font-size:1.2rem; font-weight:600;">${safeTitle}</span></div>`;

  const badge = car.status === 'preorder' ? 'Available Preorder' : car.status === 'sold' ? 'Sold' : 'Closed';
  const priceLabel = car.price ? `${car.currency === 'GHS' ? 'GH₵' : '$'}${escapeHtml(car.price)}` : 'Inquire for Pricing';

  return `
    <div class="listing-card">
      <div class="listing-image-container">
        ${imageHtml}
        <span class="listing-badge">${escapeHtml(badge)}</span>
      </div>
      <div class="listing-content">
        <h3 class="listing-title">${safeTitle}</h3>
        <div class="listing-details">
          <div class="listing-detail-item"><strong>Engine:</strong> ${escapeHtml(car.engine || '-')}</div>
          <div class="listing-detail-item"><strong>Mileage:</strong> ${escapeHtml(car.mileage || '-')}</div>
          <div class="listing-detail-item"><strong>Specs:</strong> ${escapeHtml(car.specs || '-')}</div>
        </div>
        <p style="margin-bottom: 1.5rem; font-size: 0.9rem;">${escapeHtml(car.shipping || 'Direct export shipping available to major African ports.')}</p>
        <div class="listing-price">${priceLabel}</div>
        <a href="#" class="btn btn-whatsapp" onclick="triggerWhatsAppChat('Hello RPNMore, I would like to inquire about the ${safeTitle}.'); return false;">
          Inquire on WhatsApp
        </a>
      </div>
    </div>
  `;
}

function renderPropertyCard(prop) {
  const safeTitle = escapeHtml(prop.title);
  const imageHtml = prop.imageUrl
    ? `<img class="listing-image" src="${escapeHtml(prop.imageUrl)}" alt="${safeTitle}" loading="lazy">`
    : `<div style="background: linear-gradient(135deg, #101f42 0%, #030712 100%); width:100%; height:100%; position:absolute; display:flex; align-items:center; justify-content:center; flex-direction:column; gap:10px;"><svg width="50" height="50" fill="none" stroke="var(--accent)" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg><span style="font-family:var(--font-heading); color:white; font-size:1.2rem; font-weight:600;">${safeTitle}</span></div>`;

  const badge = prop.badge || (prop.status === 'available' ? 'Available' : prop.status === 'sold' ? 'Sold' : 'Pending');

  return `
    <div class="listing-card">
      <div class="listing-image-container">
        ${imageHtml}
        <span class="listing-badge">${escapeHtml(badge)}</span>
      </div>
      <div class="listing-content">
        <h3 class="listing-title">${safeTitle}</h3>
        <div class="listing-details">
          <div class="listing-detail-item"><strong>Location:</strong> ${escapeHtml(prop.location || '-')}</div>
          <div class="listing-detail-item"><strong>Size:</strong> ${escapeHtml(prop.size || '-')}</div>
          <div class="listing-detail-item"><strong>ROI:</strong> ${escapeHtml(prop.roi || '-')}</div>
        </div>
        <p style="margin-bottom: 1.5rem; font-size: 0.9rem;">${prop.price ? 'Investment opportunity with verified title and escrow support.' : 'Inquire for detailed investor specifications and payment structures.'}</p>
        <div class="listing-price">${escapeHtml(prop.price || 'Inquire for Investor Pricing')}</div>
        <a href="#" class="btn btn-whatsapp" onclick="triggerWhatsAppChat('Hello RPNMore, I would like to receive investor specifications on the ${safeTitle}.'); return false;">
          Inquire on WhatsApp
        </a>
      </div>
    </div>
  `;
}

function renderBlogPost(post, compact = false) {
  const safeTitle = escapeHtml(post.title);
  if (compact) {
    return `
      <div class="blog-card">
        <div class="blog-image-wrap">
          <img src="${escapeHtml(post.imageUrl || '/hero_wealth_bridge.png')}" alt="${safeTitle}" style="width:100%;height:100%;object-fit:cover;border-radius:8px;display:block;">
        </div>
        <div class="blog-card-content">
          <div class="blog-meta">
            <span>${escapeHtml(post.date || '-')}</span>
            <span>•</span>
            <span>${escapeHtml(post.category || 'General')}</span>
          </div>
          <h3 class="blog-card-title"><a href="/blog.html">${safeTitle}</a></h3>
          <p class="blog-card-excerpt">${escapeHtml(post.excerpt || '')}</p>
          <a href="/blog.html" class="read-more">Read Guide →</a>
        </div>
      </div>
    `;
  }

  const fallbackImage = '/hero_wealth_bridge.png';
  const imageSrc = post.imageUrl || fallbackImage;
  const imageHtml = `<div style="width:100%;height:280px;overflow:hidden;border-radius:12px;margin-bottom:1rem;"><img src="${escapeHtml(imageSrc)}" alt="${safeTitle}" style="width:100%;height:100%;object-fit:cover;display:block;"></div>`;

  return `
    <article class="glass-card" style="margin-bottom: 3rem; display: flex; flex-direction: column; gap: 1.5rem; padding: 3rem;">
      ${imageHtml}
      <div class="blog-meta">
        <span>${escapeHtml(post.date || '-')}</span>
        <span>•</span>
        <span class="accent-text">${escapeHtml(post.category || 'General')}</span>
        <span>•</span>
        <span>Author: ${escapeHtml(post.author || 'RPNMore Team')}</span>
      </div>
      <h2 style="font-size: 2.2rem; color: white;">${safeTitle}</h2>
      <p style="font-size: 1.1rem; color: var(--text-muted);">${escapeHtml(post.excerpt || '')}</p>
      ${post.content ? `<div style="color: var(--text-muted);">${escapeHtml(post.content)}</div>` : ''}
      <div style="margin-top: 1rem; display:flex; gap:1rem; flex-wrap:wrap;">
        <a href="https://www.facebook.com/Dobuygoods" target="_blank" rel="noopener" class="btn btn-secondary btn-sm">
          Follow on Facebook
        </a>
        <a href="https://t.me/rpnmoreuaebot" target="_blank" rel="noopener" class="btn btn-secondary btn-sm">
          Follow on Telegram
        </a>
      </div>
    </article>
  `;
}

function renderTestimonial(t) {
  const safeName = escapeHtml(t.name);
  const initials = safeName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  const projectLink = t.projectUrl
    ? `<a href="${escapeHtml(t.projectUrl)}" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:6px;margin-top:0.75rem;color:var(--accent);font-weight:600;font-size:0.9rem;text-decoration:none;">View Project →</a>`
    : '';
  return `
    <div class="testimonial-card">
      <p class="testimonial-quote">${escapeHtml(t.text)}</p>
      <div class="testimonial-author">
        <div class="testimonial-avatar">${escapeHtml(initials)}</div>
        <div class="testimonial-info">
          <h4>${safeName}</h4>
          <p>${escapeHtml(t.role)}</p>
          ${projectLink}
        </div>
      </div>
    </div>
  `;
}

function renderBook(book) {
  const safeTitle = escapeHtml(book.title);
  const coverHtml = book.coverImageUrl
    ? `<img src="${escapeHtml(book.coverImageUrl)}" alt="${safeTitle}" style="position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;">`
    : `<div class="book-cover-placeholder"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg><span style="font-size:0.85rem;font-weight:600;">Book Cover</span></div>`;

  const ctaHtml = book.gumroadUrl
    ? `<a href="${escapeHtml(book.gumroadUrl)}" class="btn btn-primary" target="_blank" rel="noopener">Buy on Gumroad →</a>`
    : `<a href="#" class="btn btn-whatsapp" onclick="triggerWhatsAppChat('Hello RPNMore, I would like to order the book: ${safeTitle}.'); return false;">Inquire to Order</a>`;

  return `
    <div class="book-card">
      <div class="book-cover-wrap">
        ${coverHtml}
      </div>
      <div class="book-card-content">
        <h3 class="book-card-title">${safeTitle}</h3>
        <p class="book-card-author">${escapeHtml(book.author)}</p>
        <p class="book-card-desc">${escapeHtml(book.description || '')}</p>
        <p class="book-card-price">${escapeHtml(book.price || 'Inquire for Price')}</p>
        ${ctaHtml}
      </div>
    </div>
  `;
}

function initDynamicContent() {
  const path = window.location.pathname;
  if (path === '/' || path === '/index.html') initIndexPage();
  else if (path === '/cars.html') initCarsPage();
  else if (path === '/real-estate.html') initRealEstatePage();
  else if (path === '/blog.html') initBlogPage();
  else if (path === '/books.html') initBooksPage();
}

async function initIndexPage() {
  // Featured Cars
  const carsContainer = document.getElementById('featured-cars-grid');
  if (carsContainer) {
    const cars = await fetchCMS('car-listings');
    if (cars && cars.length) {
      const featured = cars.filter(c => c.featured);
      if (featured.length) {
        carsContainer.innerHTML = featured.map(renderCarCard).join('');
        observeNewElements(carsContainer.querySelectorAll('.listing-card'));
      }
    }
  }

  // Featured Properties
  const propsContainer = document.getElementById('featured-properties-grid');
  if (propsContainer) {
    const props = await fetchCMS('property-listings');
    if (props && props.length) {
      const featured = props.filter(p => p.featured);
      if (featured.length) {
        propsContainer.innerHTML = featured.map(renderPropertyCard).join('');
        observeNewElements(propsContainer.querySelectorAll('.listing-card'));
      }
    }
  }

  // Latest Blog Posts
  const blogContainer = document.getElementById('blog-preview-grid');
  if (blogContainer) {
    const posts = await fetchCMS('blog-posts');
    if (posts && posts.length) {
      const published = posts.filter(p => p.published).slice(0, 3);
      if (published.length) {
        blogContainer.innerHTML = published.map(p => renderBlogPost(p, true)).join('');
        observeNewElements(blogContainer.querySelectorAll('.blog-card'));
      }
    }
  }

  // Featured Testimonials
  const testimonialContainer = document.getElementById('testimonials-grid');
  if (testimonialContainer) {
    const testimonials = await fetchCMS('testimonials');
    if (testimonials && testimonials.length) {
      const featured = testimonials.filter(t => t.featured);
      if (featured.length) {
        testimonialContainer.innerHTML = featured.map(renderTestimonial).join('');
        observeNewElements(testimonialContainer.querySelectorAll('.testimonial-card'));
      }
    }
  }
}

async function initCarsPage() {
  const container = document.getElementById('car-listings-grid');
  if (!container) return;
  const cars = await fetchCMS('car-listings');
  if (cars && cars.length) {
    container.innerHTML = cars.map(renderCarCard).join('');
    observeNewElements(container.querySelectorAll('.listing-card'));
  }
}

async function initRealEstatePage() {
  const container = document.getElementById('property-listings-grid');
  if (!container) return;
  const props = await fetchCMS('property-listings');
  if (props && props.length) {
    container.innerHTML = props.map(renderPropertyCard).join('');
    observeNewElements(container.querySelectorAll('.listing-card'));
  }
}

async function initBlogPage() {
  const container = document.getElementById('blog-posts-grid');
  if (!container) return;
  const posts = await fetchCMS('blog-posts');
  if (!posts || !posts.length) return;

  const published = posts.filter(p => p.published);
  if (!published.length) return;

  container.innerHTML = published.map(p => renderBlogPost(p, false)).join('');
  observeNewElements(container.querySelectorAll('.glass-card'));

  // Wire category filter buttons
  const catButtons = document.querySelectorAll('.blog-cat-btn');
  catButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      catButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.dataset.category || '';
      const filtered = filter ? published.filter(p => p.category && p.category.toLowerCase().includes(filter.toLowerCase())) : published;
      container.innerHTML = filtered.map(p => renderBlogPost(p, false)).join('');
      observeNewElements(container.querySelectorAll('.glass-card'));
    });
  });
}

async function initBooksPage() {
  const container = document.getElementById('books-grid');
  if (!container) return;
  const books = await fetchCMS('books');
  if (books && books.length) {
    container.innerHTML = books.map(renderBook).join('');
    observeNewElements(container.querySelectorAll('.book-card'));
  }
}
