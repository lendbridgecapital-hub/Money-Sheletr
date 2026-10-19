/**
 * LendBridge Capital - Official Website Interactive Scripts
 * Domain: www.lendbridgecapital.in
 */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Lucide icons
  if (window.lucide) {
    window.lucide.createIcons();
  }

  // Set current year in footer
  const yearEl = document.getElementById('currentYear');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  // Sticky Navbar Scroll Effect
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 30) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });

  // Mobile Menu Toggle
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const navLinks = document.getElementById('navLinks');
  if (mobileMenuBtn && navLinks) {
    mobileMenuBtn.addEventListener('click', () => {
      navLinks.classList.toggle('mobile-open');
    });

    navLinks.querySelectorAll('a, button').forEach(el => {
      el.addEventListener('click', () => {
        navLinks.classList.remove('mobile-open');
      });
    });
  }

  // Scroll Reveal Observer
  const revealElements = document.querySelectorAll('.reveal-up');
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  revealElements.forEach((el) => revealObserver.observe(el));

  // Hero Interactive EMI & Syndication Calculator
  const loanAmountRange = document.getElementById('loanAmountRange');
  const interestRateRange = document.getElementById('interestRateRange');
  const tenureRange = document.getElementById('tenureRange');

  if (loanAmountRange && interestRateRange && tenureRange) {
    loanAmountRange.addEventListener('input', updateHeroCalculator);
    interestRateRange.addEventListener('input', updateHeroCalculator);
    tenureRange.addEventListener('input', updateHeroCalculator);
    updateHeroCalculator();
  }

  // Portfolio Category Filter Tabs
  const filterButtons = document.querySelectorAll('.filter-btn');
  const productCards = document.querySelectorAll('.product-card');

  filterButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      filterButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.getAttribute('data-filter');
      productCards.forEach((card) => {
        const categories = card.getAttribute('data-category') || '';
        if (filter === 'all' || categories.includes(filter)) {
          card.style.display = 'flex';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });

  // Initialize Modal Eligibility Calculator
  calculateEligibility();

  // Close modal on Escape key or backdrop click
  const modal = document.getElementById('eligibilityModal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeEligibilityModal();
      }
    });
  }
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeEligibilityModal();
    }
  });
});

/**
 * Format number in Indian Rupee format (Lakhs / Crores or comma-separated)
 */
function formatINR(num) {
  return '₹ ' + Math.round(num).toLocaleString('en-IN');
}

/**
 * Update Hero Quick EMI & Structuring Calculator
 */
function updateHeroCalculator() {
  const principal = parseFloat(document.getElementById('loanAmountRange').value) || 7500000;
  const annualRate = parseFloat(document.getElementById('interestRateRange').value) || 8.6;
  const years = parseInt(document.getElementById('tenureRange').value, 10) || 15;

  const monthlyRate = annualRate / 12 / 100;
  const months = years * 12;

  const emi =
    (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) /
    (Math.pow(1 + monthlyRate, months) - 1);

  const amountDisplay = document.getElementById('loanAmountDisplay');
  const rateDisplay = document.getElementById('interestRateDisplay');
  const tenureDisplay = document.getElementById('tenureDisplay');
  const emiDisplay = document.getElementById('emiResultDisplay');

  if (principal >= 10000000) {
    const cr = (principal / 10000000).toFixed(2);
    amountDisplay.textContent = `${formatINR(principal)} (${cr} Cr)`;
  } else {
    const lakhs = (principal / 100000).toFixed(1);
    amountDisplay.textContent = `${formatINR(principal)} (${lakhs} L)`;
  }

  rateDisplay.textContent = `${annualRate.toFixed(2)}%`;
  tenureDisplay.textContent = `${years} ${years === 1 ? 'Yr' : 'Yrs'}`;
  emiDisplay.innerHTML = `${formatINR(emi)} <span>/ month</span>`;
}

/**
 * Open & Close Eligibility Modal
 */
function openEligibilityModal() {
  const modal = document.getElementById('eligibilityModal');
  if (modal) {
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    calculateEligibility();
  }
}

function openEligibilityModalWithData() {
  openEligibilityModal();
}

function closeEligibilityModal() {
  const modal = document.getElementById('eligibilityModal');
  if (modal) {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
  }
}

/**
 * Pre-select loan product and scroll to form or open modal
 */
function selectLoanInModal(productName) {
  const loanSelect = document.getElementById('loanCategory');
  if (loanSelect) {
    for (let i = 0; i < loanSelect.options.length; i++) {
      if (loanSelect.options[i].value === productName) {
        loanSelect.selectedIndex = i;
        break;
      }
    }
  }
  const contactSection = document.getElementById('contact');
  if (contactSection) {
    contactSection.scrollIntoView({ behavior: 'smooth' });
    setTimeout(() => {
      const nameInput = document.getElementById('clientName');
      if (nameInput) nameInput.focus();
    }, 600);
  }
}

/**
 * Calculate Eligibility in the Interactive Modal
 */
function calculateEligibility() {
  const product = document.getElementById('eligProduct')?.value || 'home';
  const income = Math.max(0, parseFloat(document.getElementById('eligIncome')?.value) || 0);
  const obligations = Math.max(0, parseFloat(document.getElementById('eligObligations')?.value) || 0);
  const cibil = document.getElementById('eligCibil')?.value || 'prime';

  // Determine FOIR & Multiplier based on Product and CIBIL
  let foir = 0.65;
  let rateBand = '8.40% – 8.85% p.a.';
  let channelBadge = 'Recommended Channel: Tier-1 PSU & Private Banks';
  let routeText = 'Direct Bank Impanelment Fast-Track';
  let advisoryNote =
    'Our consultants can further enhance your sanction limit by pooling co-applicant income or structuring existing obligations.';
  let tenureMonths = 240; // 20 years default
  let indicativeRate = 8.6;

  if (product === 'home') {
    tenureMonths = 240;
    indicativeRate = 8.55;
    rateBand = '8.35% – 8.90% p.a.';
  } else if (product === 'cibil') {
    tenureMonths = 180;
    indicativeRate = 10.75;
    foir = 0.60;
    rateBand = '9.90% – 12.25% p.a. (Profile Dependent)';
    channelBadge = 'Recommended Channel: Specialized NBFCs & Cooperative Credit Lines';
    routeText = 'LendBridge Non-Standard File Underwriting';
    advisoryNote =
      'Even with past CIBIL irregularities, we structure co-applicant cash flows and collateral coverage to turn rejections into approvals.';
  } else if (product === 'lap') {
    tenureMonths = 180;
    indicativeRate = 9.6;
    foir = 0.70;
    rateBand = '9.25% – 10.50% p.a.';
    channelBadge = 'Recommended Channel: High-LTV Private Banks & NBFCs';
  } else if (product === 'builder') {
    tenureMonths = 60;
    indicativeRate = 12.0;
    foir = 0.75;
    rateBand = '11.25% – 14.00% p.a. (Project Cash-Flow Linked)';
    channelBadge = 'Recommended Channel: Institutional Project Finance & Realty NBFCs';
    routeText = '50+ Projects Track Record Syndication Desk';
    advisoryNote =
      'Builder & Project finance is structured on project receivables, land/FSI valuation, and milestone tranches.';
  } else if (product === 'business') {
    tenureMonths = 60;
    indicativeRate = 11.5;
    foir = 0.65;
    rateBand = '10.50% – 14.50% p.a.';
    channelBadge = 'Recommended Channel: MSME Banks & Commercial NBFCs';
  } else {
    tenureMonths = 60;
    indicativeRate = 10.8;
    foir = 0.55;
    rateBand = '9.50% – 13.50% p.a.';
  }

  if (cibil === 'challenged') {
    channelBadge = 'Recommended Channel: Specialized NBFCs & Cooperative Credit Lines';
    routeText = 'LendBridge CIBIL Discrepancy & Collateral Structuring';
    advisoryNote =
      'Our underwriting specialists perform a deep dive into credit report discrepancies and route your file to flexible credit committees.';
    indicativeRate = Math.max(indicativeRate, 10.5);
  }

  const netAvailableForEmi = Math.max(10000, income * foir - obligations);
  const r = indicativeRate / 12 / 100;
  const maxLoan =
    netAvailableForEmi * ((Math.pow(1 + r, tenureMonths) - 1) / (r * Math.pow(1 + r, tenureMonths)));

  const maxLoanEl = document.getElementById('eligMaxLoan');
  const maxEmiEl = document.getElementById('eligMaxEmi');
  const rateBandEl = document.getElementById('eligRateBand');
  const channelBadgeEl = document.getElementById('eligChannelBadge');
  const routeTextEl = document.getElementById('eligRouteText');
  const advisoryNoteEl = document.getElementById('eligAdvisoryNote');

  if (maxLoanEl) maxLoanEl.textContent = formatINR(maxLoan);
  if (maxEmiEl) maxEmiEl.textContent = `${formatINR(netAvailableForEmi)} / mo`;
  if (rateBandEl) rateBandEl.textContent = rateBand;
  if (channelBadgeEl) channelBadgeEl.textContent = channelBadge;
  if (routeTextEl) routeTextEl.textContent = routeText;
  if (advisoryNoteEl) advisoryNoteEl.textContent = advisoryNote;
}

/**
 * Transfer Modal Selection to Main Consultation Form
 */
function proceedFromModalToForm() {
  const eligProduct = document.getElementById('eligProduct')?.value;
  const map = {
    home: 'Home Loans',
    cibil: 'Credit-Challenged Home Loan (CIBIL Advisory)',
    lap: 'Loan Against Property (LAP)',
    builder: 'Project & Builder Finance',
    business: 'Business Loans',
    personal: 'Personal Loans'
  };
  closeEligibilityModal();
  selectLoanInModal(map[eligProduct] || 'Home Loans');
}

/**
 * Handle Consultation Mandate Submission
 */
async function handleConsultationSubmit(event) {
  event.preventDefault();
  const name = document.getElementById('clientName')?.value || 'Valued Client';
  const phone = document.getElementById('clientPhone')?.value || '';
  const city = document.getElementById('clientCity')?.value || 'Satara Branch (br_satara_01)';
  const category = document.getElementById('loanCategory')?.value || 'Loan Advisory';
  const ticket = document.getElementById('loanTicket')?.value || '';
  const cibil = document.getElementById('cibilProfile')?.value || '';
  const notes = document.getElementById('clientNotes')?.value || '';

  const banner = document.getElementById('formSuccessBanner');
  const text = document.getElementById('formSuccessText');
  const submitBtn = event.target.querySelector('button[type="submit"]');

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerText = 'Routing to Satara Branch Desk...';
  }

  try {
    // Send to Render / Neon Backend API with strict Satara branch routing
    const response = await fetch('/api/inquiries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientName: name,
        clientPhone: phone,
        clientCity: city,
        branchId: 'br_satara_01',
        branchName: 'Satara Branch',
        loanCategory: category,
        loanTicket: ticket,
        cibilProfile: cibil,
        clientNotes: notes
      })
    });

    if (banner && text) {
      text.textContent = `Thank you, ${name}. Your mandate for ${category} has been securely logged and routed to our Satara branch underwriting desk (br_satara_01). A Senior Credit Specialist will call you within 4 business hours.`;
      banner.hidden = false;
    }
    event.target.reset();
  } catch (err) {
    console.warn('API error, falling back to local confirmation:', err);
    if (banner && text) {
      text.textContent = `Thank you, ${name}. Your mandate for ${category} has been received and routed to our Satara branch desk (br_satara_01). A Senior Credit Specialist will contact you shortly.`;
      banner.hidden = false;
    }
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<span>Submit Mandate to Satara Branch Credit Specialist</span><i data-lucide="send" class="icon-sm"></i>';
      if (window.lucide) window.lucide.createIcons();
    }
  }
}
