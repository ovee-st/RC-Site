const initStickyHeader = () => {
  const header = document.querySelector('.site-header');
  if (!header) return;

  const updateHeaderState = () => {
    header.classList.toggle('scrolled', window.scrollY > 12);
  };

  updateHeaderState();
  window.addEventListener('scroll', updateHeaderState, { passive: true });
};

const initThemeToggle = () => {
  document.querySelectorAll('[data-theme-toggle]').forEach((button) => {
    button.remove();
  });

  const themeToggle = document.createElement('button');
  themeToggle.className = 'theme-toggle';
  themeToggle.type = 'button';
  themeToggle.dataset.themeToggle = '';
  themeToggle.style.position = 'fixed';
  themeToggle.style.right = '24px';
  themeToggle.style.bottom = '24px';
  themeToggle.style.zIndex = '999';
  themeToggle.style.display = 'inline-flex';
  document.body.appendChild(themeToggle);

  const storageKey = 'mx-theme';
  const savedTheme = window.localStorage.getItem(storageKey);
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');

  const applyTheme = (theme) => {
    const isDark = theme === 'dark';
    document.documentElement.classList.toggle('dark', isDark);
    document.body.classList.toggle('theme-dark', isDark);
    document.body.classList.toggle('light', !isDark);
    document.body.dataset.theme = isDark ? 'dark' : 'light';
    themeToggle.classList.toggle('is-dark', isDark);
    themeToggle.innerHTML = `
      <span class="theme-toggle-symbol theme-toggle-sun" aria-hidden="true">
        <svg viewBox="0 0 24 24" focusable="false">
          <circle cx="12" cy="12" r="4"></circle>
          <path d="M12 2V5"></path>
          <path d="M12 19V22"></path>
          <path d="M4.93 4.93L7.05 7.05"></path>
          <path d="M16.95 16.95L19.07 19.07"></path>
          <path d="M2 12H5"></path>
          <path d="M19 12H22"></path>
          <path d="M4.93 19.07L7.05 16.95"></path>
          <path d="M16.95 7.05L19.07 4.93"></path>
        </svg>
      </span>
      <span class="theme-toggle-symbol theme-toggle-moon" aria-hidden="true">
        <svg viewBox="0 0 24 24" focusable="false">
          <path d="M20 14.6A7.8 7.8 0 0 1 9.4 4A8 8 0 1 0 20 14.6Z"></path>
          <path d="M17.5 4.5V7.5"></path>
          <path d="M16 6H19"></path>
          <path d="M20 8V10"></path>
          <path d="M19 9H21"></path>
        </svg>
      </span>
      <span class="theme-toggle-knob" aria-hidden="true"></span>
      <span class="theme-toggle-label">${isDark ? 'Switch to light mode' : 'Switch to dark mode'}</span>
    `;
    themeToggle.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
  };

  applyTheme(initialTheme);

  themeToggle.addEventListener('click', () => {
    const nextTheme = document.body.classList.contains('theme-dark') ? 'light' : 'dark';
    window.localStorage.setItem(storageKey, nextTheme);
    applyTheme(nextTheme);
  });

  window.toggleTheme = () => {
    const nextTheme = document.body.classList.contains('theme-dark') ? 'light' : 'dark';
    window.localStorage.setItem(storageKey, nextTheme);
    applyTheme(nextTheme);
  };
};

const initMobileNav = () => {
  const navToggle = document.querySelector('.nav-toggle');
  const siteNav = document.querySelector('.site-nav');
  if (!navToggle || !siteNav) return;

  navToggle.addEventListener('click', () => {
    const expanded = navToggle.getAttribute('aria-expanded') === 'true';
    navToggle.setAttribute('aria-expanded', String(!expanded));
    siteNav.classList.toggle('open');
  });

  siteNav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      siteNav.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });
};

const initActiveNav = () => {
  const currentPage = document.body.dataset.page;
  document.querySelectorAll('.site-nav a').forEach((link) => {
    if (link.dataset.nav === currentPage) {
      link.classList.add('active');
    }
  });
};

const initReportModal = () => {
  const reportModal = document.getElementById('candidate-report-modal');
  const reportOpenButton = document.querySelector('[data-report-open]');
  const reportCloseButtons = document.querySelectorAll('[data-report-close]');
  if (!reportModal || !reportOpenButton) return;

  const openReportModal = () => {
    reportModal.classList.add('is-open');
    reportModal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
  };

  const closeReportModal = () => {
    reportModal.classList.remove('is-open');
    reportModal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
  };

  reportOpenButton.addEventListener('click', openReportModal);
  reportCloseButtons.forEach((button) => {
    button.addEventListener('click', closeReportModal);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && reportModal.classList.contains('is-open')) {
      closeReportModal();
    }
  });
};

const getFieldErrorMessage = (field) => {
  const validity = field.validity;

  if (validity.valueMissing) return 'This field is required.';
  if (validity.typeMismatch && field.type === 'email') return 'Enter a valid email address.';
  if (validity.patternMismatch) return 'Enter a valid value in the expected format.';
  if (validity.tooShort) return `Please enter at least ${field.minLength} characters.`;
  if (validity.rangeUnderflow) return `Value must be at least ${field.min}.`;
  if (validity.rangeOverflow) return `Value must be ${field.max} or less.`;

  return '';
};

const ensureFieldErrorElement = (field) => {
  const selector = `.field-error[data-error-for="${field.id}"]`;
  let errorEl = field.parentElement.querySelector(selector);

  if (!errorEl) {
    errorEl = document.createElement('p');
    errorEl.className = 'field-error';
    errorEl.dataset.errorFor = field.id;
    field.insertAdjacentElement('afterend', errorEl);
  }

  return errorEl;
};

const validateField = (field) => {
  const errorEl = ensureFieldErrorElement(field);
  const isValid = field.checkValidity();

  if (isValid) {
    field.classList.remove('is-invalid');
    field.removeAttribute('aria-invalid');
    errorEl.textContent = '';
    return true;
  }

  field.classList.add('is-invalid');
  field.setAttribute('aria-invalid', 'true');
  errorEl.textContent = getFieldErrorMessage(field);
  return false;
};

const initForms = () => {
  const forms = document.querySelectorAll('.js-form');

  forms.forEach((form) => {
    const feedback = form.querySelector('.form-feedback');
    const formType = form.dataset.formType || 'Form';
    const fields = form.querySelectorAll('input, textarea, select');

    fields.forEach((field) => {
      ensureFieldErrorElement(field);

      field.addEventListener('blur', () => {
        validateField(field);
      });

      field.addEventListener('input', () => {
        if (field.classList.contains('is-invalid')) {
          validateField(field);
        }
      });
    });

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      let formIsValid = true;

      fields.forEach((field) => {
        if (!validateField(field)) {
          formIsValid = false;
        }
      });

      if (!feedback) return;

      if (!formIsValid) {
        feedback.textContent = 'Please correct the highlighted fields and try again.';
        feedback.classList.add('is-error');
        feedback.classList.remove('is-success');
        return;
      }

      feedback.textContent = `${formType} submitted successfully. Our team will contact you soon.`;
      feedback.classList.remove('is-error');
      feedback.classList.add('is-success');
      form.reset();

      fields.forEach((field) => {
        field.classList.remove('is-invalid');
        field.removeAttribute('aria-invalid');
        ensureFieldErrorElement(field).textContent = '';
      });
    });
  });
};

const SUPABASE_URL = 'https://lqjbiqngjrmocavqfevx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxamJpcW5nanJtb2NhdnFmZXZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxNzE4MzcsImV4cCI6MjA5Mjc0NzgzN30.mLBwJC5jNiGG9lbfgiouhMzGexJUYhZS9VHNl6jNypg';
const SUPABASE_RESUME_BUCKET = 'candidate-resumes';

const getSupabaseClient = () => {
  const isConfigured = SUPABASE_URL.startsWith('https://') && !SUPABASE_ANON_KEY.startsWith('YOUR_');

  if (!isConfigured || !window.supabase) {
    return null;
  }

  return window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
};

const setFormSubmitting = (form, isSubmitting) => {
  const submitButton = form.querySelector('[type="submit"]');
  if (!submitButton) return;

  submitButton.disabled = isSubmitting;
  submitButton.classList.toggle('is-loading', isSubmitting);
  submitButton.setAttribute('aria-busy', String(isSubmitting));
  submitButton.textContent = isSubmitting ? 'Submitting...' : submitButton.dataset.defaultText;
};

const uploadCandidateResume = async (supabaseClient, file) => {
  if (!file) return { path: '', publicUrl: '' };

  const maxFileSize = 10 * 1024 * 1024;
  if (file.size > maxFileSize) {
    throw new Error('Resume must be 10MB or less.');
  }

  const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-');
  const filePath = `${Date.now()}-${safeFileName}`;
  const { error } = await supabaseClient.storage
    .from(SUPABASE_RESUME_BUCKET)
    .upload(filePath, file, { upsert: false });

  if (error) throw error;

  const { data } = supabaseClient.storage
    .from(SUPABASE_RESUME_BUCKET)
    .getPublicUrl(filePath);

  return {
    path: filePath,
    publicUrl: data.publicUrl,
  };
};

const initHiringWizard = () => {
  const forms = document.querySelectorAll('[data-hiring-wizard]');
  if (!forms.length) return;

  forms.forEach((form) => {
    const steps = Array.from(form.querySelectorAll('[data-wizard-step]'));
    const progress = form.querySelector('[data-wizard-progress]');
    const currentLabel = form.querySelector('[data-wizard-step-current]');
    const nextButton = form.querySelector('[data-wizard-next]');
    const backButton = form.querySelector('[data-wizard-back]');
    const submitButton = form.querySelector('[data-wizard-submit]');
    const success = form.querySelector('[data-wizard-success]');
    let currentStep = 0;

    const setStep = (index) => {
      currentStep = Math.max(0, Math.min(index, steps.length - 1));
      steps.forEach((step, stepIndex) => {
        const isActive = stepIndex === currentStep;
        step.hidden = !isActive;
        step.classList.toggle('is-active', isActive);
      });

      if (progress) progress.style.width = `${((currentStep + 1) / steps.length) * 100}%`;
      if (currentLabel) currentLabel.textContent = String(currentStep + 1);
      if (backButton) backButton.hidden = currentStep === 0;
      if (nextButton) nextButton.hidden = currentStep === steps.length - 1;
      if (submitButton) submitButton.hidden = currentStep !== steps.length - 1;
      form.classList.remove('is-complete');
      if (success) success.hidden = true;
    };

    const validateCurrentStep = () => {
      const fields = steps[currentStep].querySelectorAll('input, textarea, select');
      let isValid = true;
      fields.forEach((field) => {
        if (!validateField(field)) isValid = false;
      });
      return isValid;
    };

    nextButton?.addEventListener('click', () => {
      if (!validateCurrentStep()) return;
      setStep(currentStep + 1);
    });

    backButton?.addEventListener('click', () => setStep(currentStep - 1));

    form.addEventListener('submit', (event) => {
      if (currentStep < steps.length - 1) {
        event.preventDefault();
        event.stopImmediatePropagation();
        if (validateCurrentStep()) setStep(currentStep + 1);
        return;
      }

      if (!validateCurrentStep()) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    });

    form.addEventListener('supabase:success', () => {
      steps.forEach((step) => {
        step.hidden = true;
        step.classList.remove('is-active');
      });
      if (nextButton) nextButton.hidden = true;
      if (backButton) backButton.hidden = true;
      if (submitButton) submitButton.hidden = true;
      if (progress) progress.style.width = '100%';
      form.classList.add('is-complete');
      if (success) success.hidden = false;
      success?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });

    setStep(0);
  });
};

const initSupabaseForms = () => {
  const forms = document.querySelectorAll('.js-supabase-form');
  if (!forms.length) return;

  forms.forEach((form) => {
    const feedback = form.querySelector('.form-feedback');
    const fields = form.querySelectorAll('input, textarea, select');
    const submitButton = form.querySelector('[type="submit"]');
    if (submitButton) submitButton.dataset.defaultText = submitButton.textContent;

    fields.forEach((field) => {
      ensureFieldErrorElement(field);
      field.addEventListener('blur', () => validateField(field));
      field.addEventListener('input', () => {
        if (field.classList.contains('is-invalid')) validateField(field);
      });
    });

    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      let formIsValid = true;
      fields.forEach((field) => {
        if (!validateField(field)) formIsValid = false;
      });

      if (!feedback) return;

      if (!formIsValid) {
        feedback.textContent = 'Please correct the highlighted fields and try again.';
        feedback.classList.add('is-error');
        feedback.classList.remove('is-success');
        return;
      }

      const supabaseClient = getSupabaseClient();
      if (!supabaseClient) {
        feedback.textContent = 'Supabase is not configured yet. Add your project URL and anon key in script.js.';
        feedback.classList.add('is-error');
        feedback.classList.remove('is-success');
        return;
      }

      setFormSubmitting(form, true);
      feedback.textContent = '';
      feedback.classList.remove('is-error', 'is-success');

      try {
        const formData = new FormData(form);
        const formType = form.dataset.supabaseForm;

        if (formType === 'candidate') {
          const resumeFile = formData.get('resume');
          const resume = await uploadCandidateResume(
            supabaseClient,
            resumeFile instanceof File && resumeFile.size > 0 ? resumeFile : null
          );

          const payload = {
            full_name: formData.get('full_name'),
            phone_number: formData.get('phone_number'),
            email: formData.get('email'),
            location: formData.get('location'),
            category: formData.get('category'),
            education: formData.get('education'),
            skills: formData.get('skills'),
            experience: formData.get('experience'),
            resume_path: resume.path,
            resume_url: resume.publicUrl,
          };

          const { error } = await supabaseClient.from('candidates').insert(payload);
          if (error) throw error;
        }

        if (formType === 'employer') {
          const payload = {
            company_name: formData.get('company_name'),
            contact_person: formData.get('contact_person'),
            contact_number: formData.get('contact_number'),
            official_email: formData.get('official_email'),
            monthly_needed_hiring: Number(formData.get('monthly_needed_hiring')),
            plan_interest: formData.get('plan_interest'),
            category: formData.get('category'),
            required_skills: formData.get('required_skills'),
            talent_categories_role_requirements: formData.get('talent_categories_role_requirements'),
          };

          const { error } = await supabaseClient.from('employers').insert(payload);
          if (error) throw error;
        }

        if (formType === 'hiring-request') {
          const hiringType = formData.get('hiring_type');
          const roles = formData.get('roles');
          const quantity = formData.get('quantity');
          const payload = {
            hiring_type: hiringType,
            roles,
            quantity,
            contact_person: formData.get('contact_person'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            company_name: formData.get('company_name'),
            hiring_category: hiringType,
            number_of_employees: Number.parseInt(String(quantity), 10) || 1,
            job_roles: roles,
            location: formData.get('location'),
            budget: formData.get('budget'),
            timeline: formData.get('timeline'),
          };

          const { error } = await supabaseClient.from('hiring_requests').insert(payload);
          if (error) throw error;
        }

        feedback.textContent = 'Submitted successfully. Our team will contact you soon.';
        feedback.classList.add('is-success');
        feedback.classList.remove('is-error');
        form.reset();

        fields.forEach((field) => {
          field.classList.remove('is-invalid');
          field.removeAttribute('aria-invalid');
          ensureFieldErrorElement(field).textContent = '';
        });

        form.dispatchEvent(new CustomEvent('supabase:success', { detail: { formType } }));
      } catch (error) {
        feedback.textContent = error.message || 'Submission failed. Please try again.';
        feedback.classList.add('is-error');
        feedback.classList.remove('is-success');
      } finally {
        setFormSubmitting(form, false);
      }
    });
  });
};

const initDashboardFilters = () => {
  const skillFilter = document.querySelector('[data-filter="skill"]');
  const statusFilter = document.querySelector('[data-filter="status"]');
  const candidateRows = document.querySelectorAll('#candidate-table-body tr');
  const adminEmptyState = document.getElementById('admin-empty-state');
  if (!skillFilter || !statusFilter || !candidateRows.length) return;

  const applyCandidateFilters = () => {
    const selectedSkill = skillFilter.value;
    const selectedStatus = statusFilter.value;
    let visibleCount = 0;

    candidateRows.forEach((row) => {
      const rowSkill = row.dataset.skill || '';
      const rowStatus = row.dataset.status || '';
      const skillMatch = selectedSkill === 'all' || rowSkill.includes(selectedSkill);
      const statusMatch = selectedStatus === 'all' || rowStatus === selectedStatus;
      const shouldShow = skillMatch && statusMatch;

      row.hidden = !shouldShow;
      if (shouldShow) visibleCount += 1;
    });

    if (adminEmptyState) {
      adminEmptyState.hidden = visibleCount > 0;
    }
  };

  skillFilter.addEventListener('change', applyCandidateFilters);
  statusFilter.addEventListener('change', applyCandidateFilters);
  applyCandidateFilters();
};

const initJobsFilters = () => {
  const categoryFilter = document.querySelector('[data-job-filter="category"]');
  const typeFilter = document.querySelector('[data-job-filter="type"]');
  const locationFilter = document.querySelector('[data-job-filter="location"]');
  const jobCards = document.querySelectorAll('.job-card');
  const emptyState = document.getElementById('jobs-empty-state');
  if (!categoryFilter || !typeFilter || !locationFilter || !jobCards.length) return;

  const applyJobFilters = () => {
    const category = categoryFilter.value;
    const type = typeFilter.value;
    const location = locationFilter.value;
    let visibleCount = 0;

    jobCards.forEach((card) => {
      const categoryMatch = category === 'all' || card.dataset.category === category;
      const typeMatch = type === 'all' || card.dataset.type === type;
      const locationMatch = location === 'all' || card.dataset.location === location;
      const shouldShow = categoryMatch && typeMatch && locationMatch;

      card.hidden = !shouldShow;
      if (shouldShow) visibleCount += 1;
    });

    if (emptyState) {
      emptyState.hidden = visibleCount > 0;
    }
  };

  categoryFilter.addEventListener('change', applyJobFilters);
  typeFilter.addEventListener('change', applyJobFilters);
  locationFilter.addEventListener('change', applyJobFilters);
  applyJobFilters();
};

let currentCVData = null;

const setText = (id, value) => {
  const element = document.getElementById(id);
  if (element) element.textContent = value || '';
};

const buildCVFileName = (suffix) => {
  const name = currentCVData?.fullName || 'Candidate';
  const safeName = name.trim().replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '') || 'Candidate';
  return `${safeName}-${suffix}.pdf`;
};

const populateCVTemplates = (data) => {
  const contact = [data.email, data.phone, data.location].filter(Boolean).join(' | ');
  const skills = data.skills
    .split(',')
    .map((skill) => skill.trim())
    .filter(Boolean);

  setText('regName', data.fullName);
  setText('regContact', contact);
  setText('regSummary', data.summary);
  setText('regExperience', data.experience);
  setText('regEducation', data.education);
  setText('regProjects', data.projects);

  const regularSkills = document.getElementById('regSkills');
  if (regularSkills) {
    regularSkills.innerHTML = '';
    skills.forEach((skill) => {
      const skillTag = document.createElement('span');
      skillTag.textContent = skill;
      regularSkills.appendChild(skillTag);
    });
  }

  setText('atsName', data.fullName);
  setText('atsContact', contact);
  setText('atsSummary', data.summary);
  setText('atsSkills', skills.join(', '));
  setText('atsExperience', data.experience);
  setText('atsEducation', data.education);
  setText('atsProjects', data.projects);
};

window.setCVData = (data) => {
  currentCVData = data;
  populateCVTemplates(data);
};

const initCVBuilder = () => {
  const form = document.getElementById('cvBuilderForm');
  const previewPanel = document.getElementById('cvPreviewPanel');
  const feedback = document.getElementById('cvBuilderFeedback');
  if (!form || !previewPanel) return;

  const fields = form.querySelectorAll('input, textarea, select');

  fields.forEach((field) => {
    ensureFieldErrorElement(field);
    field.addEventListener('blur', () => validateField(field));
    field.addEventListener('input', () => {
      if (field.classList.contains('is-invalid')) validateField(field);
    });
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    let formIsValid = true;
    fields.forEach((field) => {
      if (!validateField(field)) formIsValid = false;
    });

    if (!formIsValid) {
      if (feedback) {
        feedback.textContent = 'Please complete the highlighted fields before generating your CV.';
        feedback.classList.add('is-error');
        feedback.classList.remove('is-success');
      }
      return;
    }

    const formData = new FormData(form);
    currentCVData = {
      fullName: formData.get('fullName').trim(),
      email: formData.get('email').trim(),
      phone: formData.get('phone').trim(),
      location: formData.get('location').trim(),
      summary: formData.get('summary').trim(),
      skills: formData.get('skills').trim(),
      experience: formData.get('experience').trim(),
      education: formData.get('education').trim(),
      projects: formData.get('projects').trim(),
    };

    populateCVTemplates(currentCVData);
    previewPanel.hidden = false;

    if (feedback) {
      feedback.textContent = 'CV generated successfully. Download buttons are ready.';
      feedback.classList.add('is-success');
      feedback.classList.remove('is-error');
    }

    previewPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
};

const downloadCV = (elementId, fileName) => {
  const element = document.getElementById(elementId);
  if (!element || !window.html2pdf) return;

  const options = {
    margin: 0.35,
    filename: fileName,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' },
  };

  window.html2pdf().set(options).from(element).save();
};

function downloadRegularCV() {
  downloadCV('regularCV', buildCVFileName('Regular-CV'));
}

function downloadDesignedCV() {
  downloadCV('regularCV', buildCVFileName('Designed-CV'));
}

function downloadATSCV() {
  downloadCV('atsCV', buildCVFileName('ATS-CV'));
}

initThemeToggle();
initStickyHeader();
initMobileNav();
initActiveNav();
initReportModal();
initForms();
initHiringWizard();
initSupabaseForms();
initDashboardFilters();
initJobsFilters();
initCVBuilder();
