const categories = [
  'Accounting & Finance',
  'Banking & Financial Services',
  'HR & Organization Development',
  'General Management & Admin',
  'Marketing & Sales',
  'Customer Service & Call Center',
  'IT & Telecommunication',
  'Engineering & Architecture',
  'Healthcare & Medical',
  'Education & Training',
  'Garments & Textile',
  'Production & Operation',
  'Driver',
  'Security Guard',
  'Cleaner',
  'Hospitality / Travel / Tourism',
  'Chef / Cook',
  'Receptionist / Personal Secretary',
  'Agro (Plant / Animal / Fisheries)',
  'Others',
];

const CATEGORY_ROLE_MAP = {
  'Accounting & Finance': ['Accounts Officer', 'Accountant', 'Finance Executive', 'Audit Assistant'],
  'Banking & Financial Services': ['Banking Officer', 'Credit Officer', 'Loan Officer', 'Relationship Officer'],
  'HR & Organization Development': ['HR Executive', 'HR Assistant', 'Recruitment Officer', 'Training Coordinator'],
  'General Management & Admin': ['Admin Officer', 'Office Assistant', 'Office Coordinator', 'Executive Assistant'],
  'Marketing & Sales': ['Sales Executive', 'Marketing Executive', 'Digital Marketing Executive', 'Business Development Executive'],
  'Customer Service & Call Center': ['Call Center Agent', 'Customer Support Executive', 'CRM Support Executive', 'Client Service Officer'],
  'IT & Telecommunication': ['Frontend Developer', 'Backend Developer', 'Full Stack Developer', 'QA Engineer', 'UI/UX Designer', 'Network Engineer', 'IT Support Engineer', 'DevOps Engineer'],
  'Engineering & Architecture': ['Civil Engineer', 'Electrical Engineer', 'Architect', 'Maintenance Engineer'],
  'Healthcare & Medical': ['Medical Assistant', 'Nurse', 'Lab Assistant', 'Healthcare Support Officer'],
  'Education & Training': ['Teacher', 'Trainer', 'Academic Coordinator', 'Education Counselor'],
  'Garments & Textile': ['Garments Operator', 'Quality Inspector', 'Line Supervisor', 'Merchandiser'],
  'Production & Operation': ['Production Operator', 'Operations Executive', 'Floor Supervisor', 'Warehouse Supervisor'],
  Driver: ['Driver', 'Delivery Driver', 'Personal Driver', 'Commercial Driver'],
  'Security Guard': ['Security Guard', 'Security Supervisor', 'Access Control Officer', 'Patrol Guard'],
  Cleaner: ['Cleaner', 'Office Cleaner', 'Housekeeping Staff', 'Sanitation Worker'],
  'Hospitality / Travel / Tourism': ['Hotel Front Desk Executive', 'Travel Consultant', 'Guest Relations Officer', 'Tour Coordinator'],
  'Chef / Cook': ['Chef', 'Cook', 'Kitchen Assistant', 'Commis Chef'],
  'Receptionist / Personal Secretary': ['Receptionist', 'Personal Secretary', 'Front Desk Executive', 'Office Receptionist'],
  'Agro (Plant / Animal / Fisheries)': ['Agriculture Officer', 'Farm Supervisor', 'Fisheries Assistant', 'Livestock Assistant'],
  Others: ['General Worker', 'Support Staff', 'Trainee', 'Other Role'],
};

const JOB_CATEGORIES = Object.fromEntries(
  categories.map((category) => [category, CATEGORY_ROLE_MAP[category] || []])
);

const PROFILE_SKILL_CATEGORIES = {
  'IT & Telecommunication': ['JavaScript', 'React', 'Node.js', 'HTML', 'CSS', 'SQL', 'QA Testing', 'UI/UX'],
  'Marketing & Sales': ['Negotiation', 'CRM', 'Lead Generation', 'Digital Marketing', 'Campaigns', 'Presentation'],
  'Customer Service & Call Center': ['Communication', 'Active Listening', 'CRM Support', 'Complaint Handling', 'Call Handling'],
  'HR & Organization Development': ['Recruitment', 'Payroll', 'Documentation', 'Office Coordination', 'HR Operations'],
  'Production & Operation': ['Inventory', 'Logistics', 'Reporting', 'Supervision', 'Vendor Coordination'],
  'Engineering & Architecture': ['Technical Support', 'Network Setup', 'Maintenance', 'Troubleshooting', 'Safety Compliance'],
};

const PROFILE_PHOTO_BUCKET = 'profile-photos';
const CV_STORAGE_BUCKET = 'cvs';

const ROLE_DEFAULT_SKILLS = {
  'Call Center Agent': ['communication', 'listening', 'crm'],
  'Customer Support Executive': ['communication', 'crm', 'excel'],
  'CRM Support Executive': ['crm', 'data entry', 'communication'],
  'Client Service Officer': ['client service', 'communication', 'reporting'],
  'Data Entry Operator': ['typing', 'excel', 'accuracy'],
  'BPO Executive': ['bpo', 'data processing', 'communication'],
  'Back Office Executive': ['documentation', 'excel', 'reporting'],
  'Document Processing Officer': ['documentation', 'accuracy', 'data entry'],
  'Sales Executive': ['sales', 'negotiation', 'communication'],
  'Marketing Executive': ['marketing', 'campaigns', 'reporting'],
  'Digital Marketing Executive': ['social media', 'analytics', 'content'],
  'Business Development Executive': ['sales', 'lead generation', 'presentation'],
  'HR Assistant': ['hr', 'recruitment', 'admin'],
  'Admin Officer': ['admin', 'documentation', 'coordination'],
  'Office Assistant': ['documentation', 'admin', 'office'],
  'Office Coordinator': ['coordination', 'scheduling', 'admin'],
  'Frontend Developer': ['html', 'css', 'javascript'],
  'Backend Developer': ['node', 'api', 'database'],
  'Full Stack Developer': ['javascript', 'frontend', 'backend'],
  'QA Engineer': ['testing', 'qa', 'bug reporting'],
  'UI/UX Designer': ['figma', 'ui', 'ux'],
  'DevOps Engineer': ['cloud', 'ci/cd', 'linux'],
  'Network Engineer': ['network', 'infrastructure', 'security'],
  'IT Support Engineer': ['troubleshooting', 'hardware', 'network'],
  'Electrical Technician': ['electrical', 'maintenance', 'safety'],
  'Maintenance Engineer': ['maintenance', 'technical', 'repair'],
  'Medical Assistant': ['patient support', 'records', 'healthcare'],
  'Nurse': ['patient care', 'clinical', 'communication'],
  'Lab Assistant': ['lab', 'sample handling', 'reporting'],
  'Healthcare Support Officer': ['healthcare', 'support', 'records'],
  'Operations Executive': ['operations', 'coordination', 'reporting'],
  'Supply Chain Assistant': ['inventory', 'procurement', 'logistics'],
  'Warehouse Supervisor': ['warehouse', 'inventory', 'supervision'],
  'Floor Supervisor': ['supervision', 'operations', 'reporting'],
  'Security Supervisor': ['security', 'supervision', 'incident reporting'],
};

const CATEGORY_DEFAULT_SKILLS = {
  'Accounting & Finance': ['accounting', 'excel', 'reporting'],
  'Banking & Financial Services': ['banking', 'customer service', 'documentation'],
  'HR & Organization Development': ['recruitment', 'documentation', 'coordination'],
  'General Management & Admin': ['admin', 'documentation', 'coordination'],
  'Marketing & Sales': ['sales', 'communication', 'lead generation'],
  'Customer Service & Call Center': ['communication', 'crm', 'customer handling'],
  'IT & Telecommunication': ['technical support', 'troubleshooting', 'network'],
  'Engineering & Architecture': ['technical', 'maintenance', 'safety'],
  'Healthcare & Medical': ['patient support', 'records', 'communication'],
  'Education & Training': ['training', 'communication', 'lesson planning'],
  'Garments & Textile': ['quality control', 'production', 'supervision'],
  'Production & Operation': ['operations', 'reporting', 'supervision'],
  Driver: ['driving', 'route knowledge', 'safety'],
  'Security Guard': ['security', 'patrol', 'incident reporting'],
  Cleaner: ['cleaning', 'sanitation', 'time management'],
  'Hospitality / Travel / Tourism': ['guest service', 'communication', 'booking'],
  'Chef / Cook': ['cooking', 'kitchen hygiene', 'food preparation'],
  'Receptionist / Personal Secretary': ['front desk', 'communication', 'scheduling'],
  'Agro (Plant / Animal / Fisheries)': ['farm operations', 'monitoring', 'field work'],
  Others: ['communication', 'teamwork', 'reliability'],
};

const getDefaultSkillsForRole = (role = '', category = '') => ROLE_DEFAULT_SKILLS[role] || CATEGORY_DEFAULT_SKILLS[category] || [];

const jobData = Object.fromEntries(
  Object.entries(JOB_CATEGORIES).map(([category, roles]) => [
    category,
    {
      roles: Object.fromEntries(
        roles.map((role) => [
          role,
          getDefaultSkillsForRole(role, category).map((skill) => String(skill).replace(/\b\w/g, (char) => char.toUpperCase())),
        ])
      ),
    },
  ])
);

const PLATFORM_JOBS = Object.entries(JOB_CATEGORIES).flatMap(([category, roles]) =>
  roles.map((role) => ({
    title: role,
    category,
    location: ['IT & Telecommunication', 'Engineering & Architecture'].includes(category) ? 'Remote' : 'Dhaka',
    type: 'Full-time',
    skills: getDefaultSkillsForRole(role, category),
    description: `Recommended opportunity for ${role} candidates in ${category}.`,
  }))
);
const platformClient = () => getSupabaseClient();
const normalize = (value) => String(value || '').toLowerCase().trim();
const splitSkills = (value) => normalize(value).split(',').map((item) => item.trim()).filter(Boolean);
const titleCase = (value) => String(value || '').replace(/\b\w/g, (char) => char.toUpperCase());
let selectedSkills = [];

const loadCategories = () => Object.keys(jobData);
const loadRoles = (category = '') => Object.keys(jobData[category]?.roles || {});
const loadSkills = (category = '', role = '') => jobData[category]?.roles?.[role] || [];

const getRoleCategory = (role = '') => loadCategories().find((category) => loadRoles(category).includes(role)) || '';
const getRoleSkills = (role = '', category = '') => {
  const resolvedCategory = category || getRoleCategory(role);
  return loadSkills(resolvedCategory, role);
};

const getCategorySkills = (category = '') => uniqueSkills(
  loadRoles(category).flatMap((roleName) => getRoleSkills(roleName, category))
);

const setSkillInputFromCategory = (categorySelect, force = false) => {
  if (!categorySelect?.dataset.roleSkillInput) return;
  const input = document.getElementById(categorySelect.dataset.roleSkillInput);
  const target = document.getElementById(categorySelect.dataset.roleSkillTarget);
  const skills = getCategorySkills(categorySelect.value);
  if (!input || !target) return;

  if (force || !input.value.trim()) input.value = skills.map(titleCase).join(', ');
  const selectedCategorySkills = splitSkills(input.value);
  target.innerHTML = skills.length
    ? skills.map((skill) => {
      const checked = selectedCategorySkills.includes(normalize(skill));
      return `<label class="choice-pill"><input type="checkbox" value="${titleCase(skill)}" ${checked ? 'checked' : ''} data-role-skill-chip /><span>${titleCase(skill)}</span></label>`;
    }).join('')
    : '<p class="field-hint">No default skills mapped for this category. Add skills manually.</p>';

  target.querySelectorAll('[data-role-skill-chip]').forEach((checkbox) => {
    checkbox.addEventListener('change', () => {
      const chipSkills = Array.from(target.querySelectorAll('[data-role-skill-chip]:checked')).map((item) => item.value);
      input.value = chipSkills.join(', ');
    });
  });
};

const setSkillInputFromRole = (roleSelect, force = false) => {
  if (!roleSelect?.dataset.roleSkillInput) return;
  const input = document.getElementById(roleSelect.dataset.roleSkillInput);
  const target = document.getElementById(roleSelect.dataset.roleSkillTarget);
  const category = roleSelect.dataset.roleCategory || getRoleCategory(roleSelect.value);
  const skills = getRoleSkills(roleSelect.value, category);
  if (!input || !target) return;

  if (force || !input.value.trim()) input.value = skills.map(titleCase).join(', ');
  const selectedSkills = splitSkills(input.value);
  target.innerHTML = skills.length
    ? skills.map((skill) => {
      const checked = selectedSkills.includes(normalize(skill));
      return `<label class="choice-pill"><input type="checkbox" value="${titleCase(skill)}" ${checked ? 'checked' : ''} data-role-skill-chip /><span>${titleCase(skill)}</span></label>`;
    }).join('')
    : '<p class="field-hint">No default skills mapped for this role. Add skills manually.</p>';

  target.querySelectorAll('[data-role-skill-chip]').forEach((checkbox) => {
    checkbox.addEventListener('change', () => {
      const chipSkills = Array.from(target.querySelectorAll('[data-role-skill-chip]:checked')).map((item) => item.value);
      input.value = chipSkills.join(', ');
    });
  });
};

const fillRoleSelect = (roleSelect, category, selectedRole = '') => {
  if (!roleSelect) return;
  const roles = loadRoles(category);
  roleSelect.innerHTML = roles
    .map((role) => `<option value="${role}">${role}</option>`)
    .join('');
  if (selectedRole && roles.includes(selectedRole)) roleSelect.value = selectedRole;
  roleSelect.dataset.roleCategory = category;
  setSkillInputFromRole(roleSelect);
};

const initRoleSelectors = () => {
  document.querySelectorAll('[data-role-category]').forEach((categorySelect) => {
    const targetId = categorySelect.dataset.roleTarget;
    const roleSelect = document.getElementById(targetId);
    const categories = loadCategories();
    const existingCategory = categorySelect.dataset.selectedCategory || categorySelect.value || categories[0];
    const existingRole = roleSelect?.dataset.selectedRole || roleSelect?.value || '';

    categorySelect.innerHTML = categories
      .map((category) => `<option value="${category}">${category}</option>`)
      .join('');
    categorySelect.value = categories.includes(existingCategory) ? existingCategory : categories[0];
    if (roleSelect) {
      fillRoleSelect(roleSelect, categorySelect.value, existingRole);
    } else {
      setSkillInputFromCategory(categorySelect);
    }

    categorySelect.addEventListener('change', () => {
      if (roleSelect) {
        fillRoleSelect(roleSelect, categorySelect.value);
        setSkillInputFromRole(roleSelect, true);
      } else {
        setSkillInputFromCategory(categorySelect, true);
      }
    });

    roleSelect?.addEventListener('change', () => setSkillInputFromRole(roleSelect, true));
  });

  document.querySelectorAll('[data-candidate-role-filter]').forEach((filter) => {
    if (filter.dataset.populated === 'true') return;
    const options = loadCategories()
      .map((category) => `<option value="${category}">${category}</option>`)
      .join('');
    filter.insertAdjacentHTML('beforeend', options);
    filter.dataset.populated = 'true';
  });
};

const createCheckbox = ({ name, value, label, checked = false }) => `
  <label class="choice-pill ${checked ? 'selected' : ''}">
    <input type="checkbox" name="${name}" value="${value}" ${checked ? 'checked' : ''} />
    <span>${label}</span>
  </label>
`;

const getCheckedValues = (form, name) => Array.from(form.querySelectorAll(`input[name="${name}"]:checked`)).map((input) => input.value);
const uniqueSkills = (skills = []) => [...new Map(skills.filter(Boolean).map((skill) => [normalize(skill), titleCase(skill)])).values()];
const getSelectedProfileSkills = () => uniqueSkills(selectedSkills.length ? selectedSkills : getCheckedValues(document, 'profile_skills'));

const getProfileRoleOptions = (selectedRole = '') => {
  const roles = loadCategories().flatMap((category) => loadRoles(category));
  return roles.map((role) => `<option value="${role}" ${role === selectedRole ? 'selected' : ''}>${role}</option>`).join('');
};

const renderProfileSkills = (selectedCategories = [], savedSkills = []) => {
  const skillTarget = document.querySelector('[data-profile-skills]');
  if (!skillTarget) return;
  const category = document.querySelector('[name="profile_category"]')?.value || selectedCategories[0] || loadCategories()[0];
  const categoriesForSkills = selectedCategories.length ? selectedCategories : [category].filter(Boolean);
  const skills = uniqueSkills(categoriesForSkills.flatMap((item) => getCategorySkills(item)));
  window.selectedSkills = uniqueSkills(savedSkills);
  selectedSkills = window.selectedSkills;
  skillTarget.innerHTML = skills.length
    ? skills.map((skill) => createCheckbox({ name: 'profile_skills', value: skill, label: skill, checked: selectedSkills.map(normalize).includes(normalize(skill)) })).join('')
    : '<p class="field-hint">Select one or more categories to see related skills.</p>';
  skillTarget.querySelectorAll('input[name="profile_skills"]').forEach((input) => {
    input.addEventListener('change', () => {
      const label = input.closest('.choice-pill');
      if (input.checked) {
        selectedSkills = uniqueSkills([...selectedSkills, input.value]);
        label?.classList.add('selected');
      } else {
        selectedSkills = selectedSkills.filter((skill) => normalize(skill) !== normalize(input.value));
        label?.classList.remove('selected');
      }
      window.selectedSkills = selectedSkills;
    });
  });
};

const initProfileCategoryBuilder = (candidate = {}) => {
  const categorySelect = document.querySelector('[name="profile_category"]');
  if (!categorySelect) return;

  const selectedCategories = Array.isArray(candidate.categories) ? candidate.categories : (candidate.category ? [candidate.category] : []);
  const savedSkillValues = Array.isArray(candidate.skills_array) ? candidate.skills_array : splitSkills(candidate.skills).map(titleCase);
  const selectedCategory = selectedCategories[0] || loadCategories()[0];

  categorySelect.innerHTML = loadCategories()
    .map((category) => `<option value="${category}">${category}</option>`)
    .join('');
  categorySelect.value = selectedCategory;
  renderProfileSkills([selectedCategory], savedSkillValues);

  categorySelect.addEventListener('change', () => {
    selectedSkills = [];
    renderProfileSkills([categorySelect.value], []);
  });
};

const entryTemplates = {
  education: (entry = {}) => `
    <article class="dynamic-entry">
      <button class="entry-remove" type="button" data-remove-entry aria-label="Remove education">Remove</button>
      <div class="form-row">
        <div><label>Degree</label><input name="degree" type="text" value="${entry.degree || ''}" required /></div>
        <div><label>Institution</label><input name="institution" type="text" value="${entry.institution || ''}" required /></div>
      </div>
      <label>Year</label><input name="year" type="text" value="${entry.year || ''}" required />
    </article>
  `,
  experience: (entry = {}) => `
    <article class="dynamic-entry timeline-entry">
      <button class="entry-remove" type="button" data-remove-entry aria-label="Remove experience">Remove</button>
      <div class="form-row">
        <div><label>Company Name</label><input name="company" type="text" value="${entry.company || ''}" required /></div>
        <div><label>Role</label><input name="role" type="text" value="${entry.role || ''}" required /></div>
      </div>
      <div class="form-row">
        <div><label>Employment Type</label><select name="employment_type"><option ${entry.employment_type === 'Full-time' ? 'selected' : ''}>Full-time</option><option ${entry.employment_type === 'Contract' ? 'selected' : ''}>Contract</option></select></div>
        <div><label>Start Date</label><input name="start_date" type="month" value="${entry.start_date || ''}" required /></div>
      </div>
      <div class="form-row">
        <div><label>End Date</label><input name="end_date" type="month" value="${entry.end_date || ''}" ${entry.present ? 'disabled' : ''} /></div>
        <label class="present-check"><input name="present" type="checkbox" ${entry.present ? 'checked' : ''} /> Currently working here</label>
      </div>
      <label>Description</label><textarea name="description" rows="3">${entry.description || ''}</textarea>
    </article>
  `,
  certifications: (entry = {}) => `
    <article class="dynamic-entry">
      <button class="entry-remove" type="button" data-remove-entry aria-label="Remove certification">Remove</button>
      <div class="form-row">
        <div><label>Certificate Name</label><input name="certificate_name" type="text" value="${entry.certificate_name || ''}" /></div>
        <div><label>Organization</label><input name="organization" type="text" value="${entry.organization || ''}" /></div>
      </div>
      <label>Year</label><input name="year" type="text" value="${entry.year || ''}" />
    </article>
  `,
};

const addDynamicEntry = (type, entry = {}) => {
  const list = document.querySelector(`[data-dynamic-list="${type}"]`);
  if (!list || !entryTemplates[type]) return;
  list.insertAdjacentHTML('beforeend', entryTemplates[type](entry));
  bindDynamicEntryControls(list.lastElementChild);
};

const collectDynamicEntries = (type) => Array.from(document.querySelectorAll(`[data-dynamic-list="${type}"] .dynamic-entry`))
  .map((entry) => Object.fromEntries(Array.from(entry.querySelectorAll('input, textarea, select')).map((field) => [field.name, field.type === 'checkbox' ? field.checked : field.value.trim()])))
  .filter((entry) => Object.entries(entry).some(([key, value]) => key !== 'present' && Boolean(value)));

const bindDynamicEntryControls = (entry) => {
  entry.querySelector('[data-remove-entry]')?.addEventListener('click', () => entry.remove());
  entry.querySelector('input[name="present"]')?.addEventListener('change', (event) => {
    const endDate = entry.querySelector('input[name="end_date"]');
    if (endDate) {
      endDate.disabled = event.target.checked;
      if (event.target.checked) endDate.value = '';
    }
  });
};

const addInlineDynamicEntry = (list, type, entry = {}) => {
  if (!list || !entryTemplates[type]) return;
  list.insertAdjacentHTML('beforeend', entryTemplates[type](entry));
  bindDynamicEntryControls(list.lastElementChild);
};

const collectInlineDynamicEntries = (section, type) => Array.from(section.querySelectorAll(`[data-inline-list="${type}"] .dynamic-entry`))
  .map((entry) => Object.fromEntries(Array.from(entry.querySelectorAll('input, textarea, select')).map((field) => [field.name, field.type === 'checkbox' ? field.checked : field.value.trim()])))
  .filter((entry) => Object.entries(entry).some(([key, value]) => key !== 'present' && Boolean(value)));

const initDynamicProfileEntries = (candidate = {}) => {
  ['education', 'experience', 'certifications'].forEach((type) => {
    const list = document.querySelector(`[data-dynamic-list="${type}"]`);
    if (list) list.innerHTML = '';
    const entries = Array.isArray(candidate[type]) && candidate[type].length ? candidate[type] : [{}];
    entries.forEach((entry) => addDynamicEntry(type, entry));
  });

  document.querySelectorAll('[data-add-entry]').forEach((button) => {
    button.addEventListener('click', () => addDynamicEntry(button.dataset.addEntry));
  });
};

const setPhotoPreview = (url, fallback = 'MX') => {
  document.querySelectorAll('[data-photo-preview]').forEach((preview) => {
    preview.innerHTML = url ? `<img src="${url}" alt="Candidate profile photo" />` : `<span>${getInitials(fallback)}</span>`;
  });
};

const uploadProfilePhoto = async (supabase, userId, file) => {
  if (!file || file.size === 0) return '';
  const maxFileSize = 3 * 1024 * 1024;
  if (file.size > maxFileSize) throw new Error('Profile photo must be 3MB or less.');
  const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const filePath = `${userId}/${Date.now()}.${extension}`;
  const { error } = await supabase.storage.from(PROFILE_PHOTO_BUCKET).upload(filePath, file, { upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from(PROFILE_PHOTO_BUCKET).getPublicUrl(filePath);
  return data.publicUrl;
};

const ensureAtsCvElement = () => {
  let element = document.getElementById('applicationAtsCV');
  if (element) return element;
  const wrapper = document.createElement('div');
  wrapper.className = 'generated-cv-print-zone';
  wrapper.innerHTML = '<article class="ats-cv cv-document" id="applicationAtsCV"></article>';
  document.body.appendChild(wrapper);
  return wrapper.querySelector('#applicationAtsCV');
};

const ensureDesignedCvElement = () => {
  let element = document.getElementById('applicationDesignedCV');
  if (element) return element;
  const wrapper = document.querySelector('.generated-cv-print-zone') || document.createElement('div');
  wrapper.className = 'generated-cv-print-zone';
  if (!wrapper.parentElement) document.body.appendChild(wrapper);
  wrapper.insertAdjacentHTML('beforeend', '<article class="regular-cv designed-cv cv-document" id="applicationDesignedCV"></article>');
  return wrapper.querySelector('#applicationDesignedCV');
};

const formatCandidateEntries = (entries = [], fallback = '') => {
  if (Array.isArray(entries) && entries.length) {
    return entries.map((item) => [
      item.role || item.degree || item.certificate_name || '',
      item.company || item.institution || item.organization || '',
      item.year || [item.start_date, item.present ? 'Present' : item.end_date].filter(Boolean).join(' - '),
      item.description || '',
    ].filter(Boolean).join('\n')).join('\n\n');
  }
  return fallback || 'Not provided';
};

const populateAtsCvElement = (element, candidate = {}) => {
  const skills = uniqueSkills([
    ...(Array.isArray(candidate.skills_array) ? candidate.skills_array : splitSkills(candidate.skills || '').map(titleCase)),
    ...splitSkills(candidate.other_skills || '').map(titleCase),
  ]);
  element.innerHTML = `
    <header>
      <h2>${candidate.full_name || candidate.name || 'Candidate'}</h2>
      <p>${[candidate.category, candidate.email, candidate.phone_number, candidate.location].filter(Boolean).join(' | ')}</p>
    </header>
    <section><h3>PROFESSIONAL SUMMARY</h3><p>${candidate.about || 'Professional summary not provided.'}</p></section>
    <section><h3>CORE SKILLS</h3><p>${skills.join(', ') || 'Not provided'}</p></section>
    <section><h3>EXPERIENCE</h3><p>${formatCandidateEntries(candidate.experience_json, candidate.experience)}</p></section>
    <section><h3>EDUCATION</h3><p>${formatCandidateEntries(candidate.education_json, candidate.education)}</p></section>
  `;
  return element;
};

const populateDesignedCvElement = (element, candidate = {}) => {
  const skills = uniqueSkills([
    ...(Array.isArray(candidate.skills_array) ? candidate.skills_array : splitSkills(candidate.skills || '').map(titleCase)),
    ...splitSkills(candidate.other_skills || '').map(titleCase),
  ]);
  element.innerHTML = `
    <header class="regular-cv-header">
      <div>
        <p class="cv-label">Designed CV</p>
        <h2>${candidate.full_name || candidate.name || 'Candidate'}</h2>
        <p>${candidate.category || candidate.career_level || 'Candidate'}</p>
      </div>
      <p>${[candidate.email, candidate.phone_number, candidate.location].filter(Boolean).join('\n')}</p>
    </header>
    <section><h3>Summary</h3><p>${candidate.about || 'Professional summary not provided.'}</p></section>
    <section><h3>Skills</h3><div class="cv-skill-list">${skills.map((skill) => `<span>${skill}</span>`).join('')}</div></section>
    <section><h3>Experience</h3><p>${formatCandidateEntries(candidate.experience_json, candidate.experience)}</p></section>
    <section><h3>Education</h3><p>${formatCandidateEntries(candidate.education_json, candidate.education)}</p></section>
  `;
  return element;
};

const generateCandidateAtsCvBlob = async (candidate = {}) => {
  if (!window.html2pdf) throw new Error('CV generator is still loading. Please try again.');
  const element = populateAtsCvElement(ensureAtsCvElement(), candidate);
  return window.html2pdf()
    .set({
      margin: 0.35,
      filename: `${candidate.full_name || 'Candidate'}-ATS-CV.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' },
    })
    .from(element)
    .outputPdf('blob');
};

const generateCandidateDesignedCvBlob = async (candidate = {}) => {
  if (!window.html2pdf) throw new Error('CV generator is still loading. Please try again.');
  const element = populateDesignedCvElement(ensureDesignedCvElement(), candidate);
  return window.html2pdf()
    .set({
      margin: 0.35,
      filename: `${candidate.full_name || 'Candidate'}-Designed-CV.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' },
    })
    .from(element)
    .outputPdf('blob');
};

const uploadCandidateAtsCv = async (supabase, candidate = {}, jobId = '') => {
  const blob = await generateCandidateAtsCvBlob(candidate);
  const safeName = normalize(candidate.full_name || 'candidate').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'candidate';
  const filePath = `${candidate.user_id}/${jobId || 'general'}-${Date.now()}-${safeName}-ats.pdf`;
  const { error } = await supabase.storage.from(CV_STORAGE_BUCKET).upload(filePath, blob, {
    contentType: 'application/pdf',
    upsert: true,
  });
  if (error) throw error;
  const { data } = supabase.storage.from(CV_STORAGE_BUCKET).getPublicUrl(filePath);
  return data.publicUrl;
};

const setFeedback = (form, message, type = 'success') => {
  const feedback = form?.querySelector('.form-feedback');
  if (!feedback) return;
  feedback.textContent = message;
  feedback.classList.toggle('is-error', type === 'error');
  feedback.classList.toggle('is-success', type !== 'error');
};

const showRedirectToast = (message) => {
  let toast = document.querySelector('[data-redirect-toast]');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'redirect-toast';
    toast.dataset.redirectToast = 'true';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('is-visible');
};

const redirectAfterSuccess = (url, message = 'Action completed successfully.', delay = 1200) => {
  showRedirectToast(message);
  window.setTimeout(() => {
    window.location.href = url;
  }, delay);
};

const validatePlatformForm = (form) => {
  let valid = true;
  form.querySelectorAll('input, textarea, select').forEach((field) => {
    ensureFieldErrorElement(field);
    if (!validateField(field)) valid = false;
  });
  return valid;
};

const getSession = async () => {
  const supabase = platformClient();
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session;
};

const getUserProfile = async (userId) => {
  const supabase = platformClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (error) {
    if (error.code === 'PGRST205' || error.message?.includes("public.profiles")) {
      throw new Error('Database setup incomplete. Run the updated supabase-schema.sql file in Supabase SQL Editor, then try again.');
    }
    throw error;
  }
  return data;
};

const upsertProfile = async ({ id, email, fullName, role }) => {
  const supabase = platformClient();
  const { error } = await supabase.from('profiles').upsert({
    id,
    email,
    full_name: fullName,
    role,
    updated_at: new Date().toISOString(),
  });
  if (error) {
    if (error.code === 'PGRST205' || error.message?.includes("public.profiles")) {
      throw new Error('Database setup incomplete. Run the updated supabase-schema.sql file in Supabase SQL Editor, then try again.');
    }
    throw error;
  }
};

const redirectByRole = (role) => {
  window.location.href = role === 'employer' ? 'employer-dashboard.html' : 'candidate-dashboard.html';
};

const getInitials = (nameOrEmail) => {
  const cleanValue = String(nameOrEmail || 'User').trim();
  const parts = cleanValue.includes('@')
    ? [cleanValue.charAt(0)]
    : cleanValue.split(/\s+/).filter(Boolean).slice(0, 2);
  return parts.map((part) => part.charAt(0).toUpperCase()).join('') || 'U';
};

const NAV_ITEMS = {
  guest: [
    { label: 'Home', href: 'index.html', nav: 'home' },
    { label: 'Jobs', href: 'jobs.html', nav: 'jobs' },
    { label: 'We Hire for You', href: 'we-hire-for-you.html', nav: 'hire' },
    { label: 'Services', href: 'services.html', nav: 'services' },
  ],
  candidate: [
    { label: 'Jobs', href: 'jobs.html', nav: 'jobs' },
    { label: 'We Hire for You', href: 'we-hire-for-you.html', nav: 'hire' },
    { label: 'Dashboard', href: 'candidate-dashboard.html', nav: 'dashboard' },
  ],
  employer: [
    { label: 'Dashboard', href: 'employer-dashboard.html?tab=dashboard', nav: 'dashboard' },
    { label: 'Post Job', href: 'employer-dashboard.html?tab=post-job', nav: 'post-job' },
    { label: 'Published Jobs', href: 'employer-dashboard.html?tab=published-jobs', nav: 'published-jobs' },
    { label: 'Candidates', href: 'employer-dashboard.html?tab=matched-candidates', nav: 'matched-candidates' },
  ],
};

const PROFILE_HREF_BY_ROLE = {
  candidate: 'candidate-dashboard.html?view=profile',
  employer: 'employer-dashboard.html#profile',
};

const navLink = ({ href, label, nav }) => `<a href="${href}" data-nav="${nav || ''}">${label}</a>`;

const renderAccountDropdown = ({ displayName, avatarUrl = '', profileHref }) => `
  <div class="nav-account">
    <button class="nav-account-button" type="button" aria-expanded="false" aria-label="Open account menu">
      <span class="nav-avatar">
        ${avatarUrl ? `<img src="${avatarUrl}" alt="${displayName} profile image" />` : `<span>${getInitials(displayName)}</span>`}
      </span>
      <span class="nav-account-name">${displayName}</span>
    </button>
    <div class="nav-account-menu" hidden>
      <a href="${profileHref}">Profile</a>
      <button type="button" data-auth-logout-menu>Logout</button>
    </div>
  </div>
`;

const setDynamicNavActiveState = (nav) => {
  const currentPage = document.body.dataset.page;
  const params = new URLSearchParams(window.location.search);
  const currentTab = params.get('tab') || params.get('view') || window.location.hash.replace('#', '');
  nav.querySelectorAll('a[data-nav]').forEach((link) => {
    const navKey = link.dataset.nav;
    const dashboardMatch = navKey === 'dashboard' && currentPage?.includes('dashboard');
    const tabMatch = Boolean(currentTab && navKey === currentTab);
    link.classList.toggle('active', Boolean(navKey && (navKey === currentPage || dashboardMatch || tabMatch)));
  });
};

const bindDynamicNavMenu = (nav) => {
  const accountMenu = nav.querySelector('.nav-account');
  const menuButton = accountMenu?.querySelector('.nav-account-button');
  const dropdown = accountMenu?.querySelector('.nav-account-menu');
  const logoutButton = accountMenu?.querySelector('[data-auth-logout-menu]');
  const navToggle = document.querySelector('.nav-toggle');

  nav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      nav.classList.remove('open');
      navToggle?.setAttribute('aria-expanded', 'false');
    });
  });

  if (!accountMenu || !menuButton || !dropdown) return;

  menuButton.addEventListener('click', (event) => {
    event.stopPropagation();
    const isOpen = !dropdown.hidden;
    dropdown.hidden = isOpen;
    menuButton.setAttribute('aria-expanded', String(!isOpen));
  });

  logoutButton?.addEventListener('click', async () => {
    const supabase = platformClient();
    await supabase?.auth.signOut();
    window.location.href = 'index.html';
  });

  document.addEventListener('click', (event) => {
    if (!accountMenu.contains(event.target)) {
      dropdown.hidden = true;
      menuButton.setAttribute('aria-expanded', 'false');
    }
  });
};

const renderDynamicNav = ({ role = 'guest', session = null, profile = null } = {}) => {
  const nav = document.querySelector('.site-nav');
  if (!nav) return;
  const displayName = profile?.full_name || session?.user?.user_metadata?.full_name || session?.user?.email || 'Account';
  const avatarUrl = session?.user?.user_metadata?.avatar_url || '';
  const resolvedRole = NAV_ITEMS[role] ? role : 'guest';
  const navItems = NAV_ITEMS[resolvedRole].map(navLink).join('');
  const rightSide = resolvedRole === 'guest'
    ? `
      <div class="nav-actions">
        <a class="nav-login-link" href="auth.html" data-nav="auth">Login</a>
        <a class="nav-cta-link" href="auth.html">Get Started</a>
      </div>
    `
    : renderAccountDropdown({
      displayName,
      avatarUrl,
      profileHref: PROFILE_HREF_BY_ROLE[resolvedRole] || 'auth.html',
    });

  nav.innerHTML = `
    <div class="nav-role-menu" data-nav-role="${resolvedRole}">${navItems}</div>
    ${rightSide}
  `;
  setDynamicNavActiveState(nav);
  bindDynamicNavMenu(nav);
};

const initAuthNav = async () => {
  const nav = document.querySelector('.site-nav');
  const supabase = platformClient();
  if (!nav) return;

  renderDynamicNav({ role: 'guest' });
  if (!supabase) return;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    let profile = null;
    try {
      profile = await getUserProfile(user.id);
    } catch (error) {
      profile = null;
    }
    const role = profile?.role || user.user_metadata?.role || 'candidate';
    renderDynamicNav({ role, session: { user }, profile });
  } catch (error) {
    renderDynamicNav({ role: 'guest' });
  }
};

const initAuthPage = () => {
  const authTabs = document.querySelectorAll('[data-auth-tab]');
  const authPanels = document.querySelectorAll('[data-auth-panel]');
  const authForms = document.querySelectorAll('[data-auth-form]');
  const loginRoleOptions = document.querySelectorAll('[data-login-role-option]');
  const loginRoleValue = document.querySelector('[data-login-role-value]');
  if (!authForms.length) return;

  const showAuthPanel = (panelName) => {
    authTabs.forEach((item) => {
      const isMainTab = Boolean(item.closest('.auth-tabs'));
      item.classList.toggle('is-active', isMainTab && item.dataset.authTab === panelName);
    });
    authPanels.forEach((panel) => {
      panel.hidden = panel.dataset.authPanel !== panelName;
    });
  };

  authTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      showAuthPanel(tab.dataset.authTab);
    });
  });

  const supabase = platformClient();
  if (supabase) {
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        showAuthPanel('update-password');
      }
    });

    const urlHash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const urlQuery = new URLSearchParams(window.location.search);
    if (urlHash.get('type') === 'recovery' || urlQuery.get('type') === 'recovery') {
      showAuthPanel('update-password');
    }
  }

  loginRoleOptions.forEach((option) => {
    option.addEventListener('click', () => {
      loginRoleOptions.forEach((item) => item.classList.toggle('is-active', item === option));
      if (loginRoleValue) loginRoleValue.value = option.dataset.loginRoleOption;
    });
  });

  authForms.forEach((form) => {
    form.querySelectorAll('input, textarea, select').forEach((field) => {
      ensureFieldErrorElement(field);
      field.addEventListener('blur', () => validateField(field));
    });

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!validatePlatformForm(form)) {
        setFeedback(form, 'Please complete the highlighted fields.', 'error');
        return;
      }

      const supabase = platformClient();
      if (!supabase) {
        setFeedback(form, 'Supabase is not configured on this site.', 'error');
        return;
      }

      const formData = new FormData(form);
      const email = formData.get('email');
      const password = formData.get('password');
      const submitButton = form.querySelector('[type="submit"]');
      submitButton.disabled = true;
      submitButton.classList.add('is-loading');
      submitButton.setAttribute('aria-busy', 'true');

      try {
        if (form.dataset.authForm === 'update-password') {
          const confirmPassword = formData.get('confirm_password');
          if (password !== confirmPassword) {
            throw new Error('Passwords do not match.');
          }

          const { error } = await supabase.auth.updateUser({ password });
          if (error) throw error;
          setFeedback(form, 'Password updated successfully. You can now login.');
          setTimeout(async () => {
            await supabase.auth.signOut();
            showAuthPanel('login');
          }, 1200);
          return;
        }

        if (form.dataset.authForm === 'signup') {
          const role = formData.get('role');
          const fullName = formData.get('full_name');
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { full_name: fullName, role } },
          });
          if (error) throw error;
          if (!data.session) {
            setFeedback(form, 'Account created. Please confirm your email, then login.');
            return;
          }
          if (data.user) await upsertProfile({ id: data.user.id, email, fullName, role });
          setFeedback(form, 'Account created. Redirecting to your dashboard...');
          redirectByRole(role);
          return;
        }

        if (form.dataset.authForm === 'reset') {
          const redirectTo = `${window.location.origin}${window.location.pathname}`;
          const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
          if (error) throw error;
          setFeedback(form, 'Password reset link sent. Please check your email.');
          return;
        }

        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        const profile = await getUserProfile(data.user.id);
        const selectedRole = formData.get('login_role');
        const accountRole = profile?.role || data.user.user_metadata?.role || 'candidate';
        if (selectedRole && accountRole !== selectedRole) {
          await supabase.auth.signOut();
          throw new Error(`This account is registered as ${accountRole}. Please use the ${accountRole} login option.`);
        }
        setFeedback(form, 'Logged in successfully. Redirecting...');
        redirectByRole(accountRole);
      } catch (error) {
        setFeedback(form, error.message || 'Authentication failed.', 'error');
      } finally {
        submitButton.disabled = false;
        submitButton.classList.remove('is-loading');
        submitButton.removeAttribute('aria-busy');
      }
    });
  });
};

const requireDashboardSession = async (expectedRole) => {
  const session = await getSession();
  if (!session) {
    window.location.href = 'auth.html';
    return null;
  }

  let profile = await getUserProfile(session.user.id);
  if (!profile) {
    const role = session.user.user_metadata?.role || expectedRole || 'candidate';
    await upsertProfile({
      id: session.user.id,
      email: session.user.email,
      fullName: session.user.user_metadata?.full_name || session.user.email,
      role,
    });
    profile = await getUserProfile(session.user.id);
  }

  if (expectedRole && profile.role !== expectedRole) {
    redirectByRole(profile.role);
    return null;
  }

  document.querySelectorAll('[data-account-name]').forEach((el) => { el.textContent = profile.full_name || session.user.email; });
  document.querySelectorAll('[data-account-email]').forEach((el) => { el.textContent = session.user.email; });
  document.querySelectorAll('[data-account-role]').forEach((el) => { el.textContent = profile.role; });

  return { session, profile };
};

const initLogout = () => {
  document.querySelectorAll('[data-auth-logout]').forEach((button) => {
    button.addEventListener('click', async () => {
      const supabase = platformClient();
      if (supabase) await supabase.auth.signOut();
      window.location.href = 'auth.html';
    });
  });
};

const calculateMatchScore = (candidate, job) => {
  const candidateCategories = Array.isArray(candidate.categories) && candidate.categories.length ? candidate.categories : [candidate.category];
  const categoryMatch = candidateCategories.map(normalize).includes(normalize(job.category));
  if (!categoryMatch) return 0;

  const candidateSkills = splitSkills(candidate.skills);
  const jobSkills = job.skills.map(normalize);
  const skillHits = jobSkills.filter((skill) => candidateSkills.some((candidateSkill) => candidateSkill.includes(skill) || skill.includes(candidateSkill))).length;
  const skillScore = jobSkills.length ? (skillHits / jobSkills.length) * 70 : 40;
  const locationScore = normalize(candidate.location).includes(normalize(job.location)) || normalize(job.location) === 'remote' ? 10 : 0;
  return Math.min(100, Math.round(20 + skillScore + locationScore));
};

const getBestMatchScore = (candidate, selectedCategory = 'all') => {
  const jobs = selectedCategory === 'all'
    ? PLATFORM_JOBS
    : PLATFORM_JOBS.filter((job) => job.category === selectedCategory);
  return jobs.reduce((best, job) => Math.max(best, calculateMatchScore(candidate, job)), 0);
};

const initCandidatePortalTabs = () => {
  const tabButtons = document.querySelectorAll('.candidate-side-nav .nav-item, [data-portal-tab]');
  const panels = document.querySelectorAll('[data-portal-panel]');
  if (!tabButtons.length || !panels.length) return;
  const viewToPanel = {
    profile: 'profile',
    jobs: 'available-jobs',
    applied: 'applied-jobs',
    resume: 'resume-builder',
  };
  const panelToView = {
    profile: 'profile',
    'available-jobs': 'jobs',
    'applied-jobs': 'applied',
    'resume-builder': 'resume',
  };
  const handleLogout = async () => {
    const supabase = platformClient();
    if (supabase) await supabase.auth.signOut();
    window.location.href = 'auth.html';
  };

  const activateTab = (tabName) => {
    const panelName = viewToPanel[tabName] || tabName || 'profile';
    const viewName = panelToView[panelName] || panelName;
    const targetButton = Array.from(tabButtons).find((item) => item.dataset.view === viewName || item.dataset.portalTab === panelName) || tabButtons[0];
    tabButtons.forEach((item) => {
      const isActive = item === targetButton;
      item.classList.toggle('is-active', isActive);
      item.classList.toggle('active', isActive);
    });
    panels.forEach((panel) => {
      const isActive = panel.dataset.portalPanel === panelName;
      panel.classList.toggle('is-active', isActive);
      panel.style.display = isActive ? '' : 'none';
    });
  };

  tabButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const view = button.dataset.view;
      if (view === 'logout') {
        handleLogout();
        return;
      }
      const target = viewToPanel[view] || button.dataset.portalTab || 'profile';
      activateTab(target);
      history.replaceState(null, '', `#${target}`);
    });
  });
  const params = new URLSearchParams(window.location.search);
  const requestedTab = params.get('tab');
  const requestedView = params.get('view');
  if (requestedTab) {
    activateTab(requestedTab);
  } else if (requestedView === 'profile') {
    activateTab('profile');
  } else if (window.location.hash) {
    activateTab(window.location.hash.replace('#', ''));
  } else {
    activateTab('profile');
  }
};

const renderInlineSkillsEditor = (skills = [], otherSkills = '') => {
  const selected = skills.map(normalize);
  const roleSkills = loadCategories().flatMap((category) => loadRoles(category).flatMap((role) => getRoleSkills(role, category)));
  const allSkills = uniqueSkills([...skills, ...roleSkills]);
  return `
    <div class="skill-chip-grid">
      ${allSkills.map((skill) => createCheckbox({ name: 'inline_skills', value: skill, label: skill, checked: selected.includes(normalize(skill)) })).join('')}
    </div>
    <label>Other Skills</label>
    <input name="other_skills" type="text" value="${otherSkills || ''}" placeholder="Photoshop, AutoCAD, reporting" />
  `;
};

const renderInlineEntriesEditor = (type, entries = []) => `
  <div class="dynamic-list" data-inline-list="${type}">
    ${(entries.length ? entries : [{}]).map((entry) => entryTemplates[type](entry)).join('')}
  </div>
  <button class="btn secondary compact-btn" type="button" data-inline-add="${type}">+ Add ${type === 'certifications' ? 'Certification' : titleCase(type)}</button>
`;

const profileInlineSection = ({ key, title, view, edit, note = '' }) => `
  <article class="section-card profile-view-card profile-inline-section" data-inline-section="${key}">
    <div class="view-mode">
      <div class="profile-view-heading">
        <h3>${title}</h3>
        <button class="profile-section-edit edit-btn" type="button" data-inline-edit aria-label="Edit ${title}">Edit</button>
      </div>
      ${view}
      ${note ? `<p class="field-hint">${note}</p>` : ''}
    </div>
    <div class="edit-mode" hidden>
      <div class="profile-view-heading">
        <h3>Edit ${title}</h3>
        <button class="profile-section-cancel" type="button" data-inline-cancel aria-label="Cancel ${title} edit">Cancel</button>
      </div>
      ${edit}
      <div class="inline-edit-actions">
        <button class="btn primary save-btn" type="button" data-inline-save>Save</button>
        <button class="btn secondary" type="button" data-inline-cancel>Cancel</button>
      </div>
      <p class="form-feedback" aria-live="polite"></p>
    </div>
  </article>
`;

const renderProfileSummary = (candidate, session) => {
  const summary = document.querySelector('[data-profile-summary]');
  if (!summary) return;
  const name = candidate?.full_name || session?.user?.email || 'Candidate';
  const headline = [candidate?.category, candidate?.career_level, candidate?.location].filter(Boolean).join(' | ') || 'Complete your profile to improve matching.';
  const categories = Array.isArray(candidate?.categories) && candidate.categories.length ? candidate.categories : [candidate?.category].filter(Boolean);
  const skills = Array.isArray(candidate?.skills_array) && candidate.skills_array.length ? candidate.skills_array : splitSkills(candidate?.skills || '').map(titleCase);
  const otherSkills = splitSkills(candidate?.other_skills || '').map(titleCase);
  const displaySkills = uniqueSkills([...skills, ...otherSkills]);
  const education = Array.isArray(candidate?.education_json) ? candidate.education_json : [];
  const experience = Array.isArray(candidate?.experience_json) ? candidate.experience_json : [];
  const certifications = Array.isArray(candidate?.certifications) ? candidate.certifications : [];
  const emptyText = (text) => `<p class="profile-empty-copy">${text}</p>`;
  const timelineItems = (items, fallback, type) => {
    if (!items.length && !fallback) return emptyText(`No ${type} added yet.`);
    if (!items.length) return `<p>${fallback}</p>`;
    return `<div class="profile-timeline">${items.map((item) => {
      const title = type === 'education' ? item.degree : item.role || item.certificate_name;
      const org = type === 'education' ? item.institution : item.company || item.organization;
      const meta = [item.employment_type, item.year, item.start_date && `${item.start_date} - ${item.present ? 'Present' : item.end_date || 'Present'}`].filter(Boolean).join(' | ');
      return `<article class="profile-timeline-item"><h4>${title || 'Untitled'}</h4><p>${org || 'Organization not set'}</p>${meta ? `<span>${meta}</span>` : ''}${item.description ? `<p>${item.description}</p>` : ''}</article>`;
    }).join('')}</div>`;
  };

  document.querySelectorAll('[data-profile-name]').forEach((el) => { el.textContent = name; });
  document.querySelectorAll('[data-profile-headline]').forEach((el) => { el.textContent = headline; });
  document.querySelectorAll('[data-sidebar-photo]').forEach((el) => {
    el.innerHTML = candidate?.photo_url ? `<img src="${candidate.photo_url}" alt="${name} profile photo" />` : `<span>${getInitials(name)}</span>`;
  });

  summary.innerHTML = `
    ${profileInlineSection({
      key: 'about',
      title: 'About',
      view: `<p>${candidate?.about || 'No summary added yet.'}</p>`,
      edit: `<label>Professional Summary</label><textarea name="about" rows="5">${candidate?.about || ''}</textarea>`,
    })}
    ${profileInlineSection({
      key: 'skills',
      title: 'Top Skills',
      view: displaySkills.length ? `<div class="profile-skill-tags">${displaySkills.map((skill) => `<span class="skill-tag">${skill}</span>`).join('')}</div>` : emptyText('No skills selected yet.'),
      edit: renderInlineSkillsEditor(skills, candidate?.other_skills || ''),
    })}
    ${profileInlineSection({
      key: 'experience',
      title: 'Experience',
      view: timelineItems(experience, candidate?.experience, 'experience'),
      edit: renderInlineEntriesEditor('experience', experience),
    })}
    ${profileInlineSection({
      key: 'education',
      title: 'Education',
      view: timelineItems(education, candidate?.education, 'education'),
      edit: renderInlineEntriesEditor('education', education),
    })}
    ${profileInlineSection({
      key: 'certifications',
      title: 'Certifications',
      view: timelineItems(certifications, '', 'certifications'),
      edit: renderInlineEntriesEditor('certifications', certifications),
    })}
    ${profileInlineSection({
      key: 'salary',
      title: 'Salary',
      view: `<div class="profile-mini-grid"><div><span>Current Salary</span><p>${candidate?.current_salary ? `BDT ${Number(candidate.current_salary).toLocaleString()}` : 'Not set'}</p></div><div><span>Expected Salary</span><p>${candidate?.expected_salary ? `BDT ${Number(candidate.expected_salary).toLocaleString()}` : 'Not set'}</p></div></div>`,
      edit: `<div class="form-row"><div><label>Current Salary</label><input name="current_salary" type="number" min="0" value="${candidate?.current_salary || ''}" placeholder="BDT" /></div><div><label>Expected Salary</label><input name="expected_salary" type="number" min="0" value="${candidate?.expected_salary || ''}" placeholder="BDT" /></div></div>`,
      note: 'Visible only to shortlisted employers.',
    })}
  `;
  prepareInlineProfileEditors(summary);
};

const focusProfileEditorSection = (section = '') => {
  setCandidateProfileViewMode('edit');
  const target = document.querySelector(`[data-profile-edit-section="${section}"]`) || document.getElementById('edit-profile');
  target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  window.setTimeout(() => {
    const focusTarget = target?.querySelector('textarea, select, input:not([type="hidden"]), button[data-add-entry]');
    focusTarget?.focus({ preventScroll: true });
  }, 350);
};

const setCandidateProfileViewMode = (mode = 'view') => {
  const editor = document.getElementById('edit-profile');
  if (!editor) return;
  const isEditMode = mode === 'edit';
  editor.hidden = !isEditMode;
  document.querySelector('[data-scroll-edit-profile]')?.classList.toggle('is-editing', isEditMode);
};

const getCandidateProfileViewMode = (hasProfile = false) => {
  const params = new URLSearchParams(window.location.search);
  const view = params.get('view');
  if (view === 'profile') return 'view';
  if (view === 'edit') return 'edit';
  return hasProfile ? 'view' : 'edit';
};

const setInlineSectionMode = (section, mode = 'view') => {
  const isEditing = mode === 'edit';
  section.querySelector('.view-mode')?.toggleAttribute('hidden', isEditing);
  section.querySelector('.edit-mode')?.toggleAttribute('hidden', !isEditing);
};

const prepareInlineProfileEditors = (root = document) => {
  root.querySelectorAll('.profile-inline-section .dynamic-entry').forEach(bindDynamicEntryControls);
  root.querySelectorAll('[data-inline-add]').forEach((button) => {
    if (button.dataset.bound === 'true') return;
    button.dataset.bound = 'true';
    button.addEventListener('click', () => addInlineDynamicEntry(
      button.closest('.profile-inline-section')?.querySelector(`[data-inline-list="${button.dataset.inlineAdd}"]`),
      button.dataset.inlineAdd,
      {}
    ));
  });
  root.querySelectorAll('input[name="inline_skills"]').forEach((input) => {
    input.addEventListener('change', () => input.closest('.choice-pill')?.classList.toggle('selected', input.checked));
  });
};

const buildInlineProfilePayload = (sectionKey, section) => {
  if (sectionKey === 'about') {
    return { about: section.querySelector('[name="about"]')?.value.trim() || '' };
  }
  if (sectionKey === 'skills') {
    const skills = uniqueSkills(getCheckedValues(section, 'inline_skills'));
    const otherSkills = section.querySelector('[name="other_skills"]')?.value.trim() || '';
    const mergedSkills = uniqueSkills([...skills, ...splitSkills(otherSkills).map(titleCase)]);
    return {
      skills: mergedSkills.join(', ') || 'Not provided',
      skills_array: skills,
      other_skills: otherSkills,
    };
  }
  if (sectionKey === 'experience') {
    const entries = collectInlineDynamicEntries(section, 'experience');
    return {
      experience: entries.map((item) => `${item.role || ''} at ${item.company || ''}`).join('\n') || 'Not provided',
      experience_json: entries,
    };
  }
  if (sectionKey === 'education') {
    const entries = collectInlineDynamicEntries(section, 'education');
    return {
      education: entries.map((item) => `${item.degree || ''} - ${item.institution || ''} ${item.year ? `(${item.year})` : ''}`).join('\n') || 'Not provided',
      education_json: entries,
    };
  }
  if (sectionKey === 'certifications') {
    return { certifications: collectInlineDynamicEntries(section, 'certifications') };
  }
  if (sectionKey === 'salary') {
    const current = section.querySelector('[name="current_salary"]')?.value;
    const expected = section.querySelector('[name="expected_salary"]')?.value;
    return {
      current_salary: current ? Number(current) : null,
      expected_salary: expected ? Number(expected) : null,
    };
  }
  return {};
};

const saveInlineCandidateSection = async ({ userId, sectionKey, section, existing = {}, session }) => {
  const payload = buildInlineProfilePayload(sectionKey, section);
  const supabase = platformClient();
  const basePayload = existing?.id ? payload : {
    ...payload,
    user_id: userId,
    email: session?.user?.email || '',
    name: session?.user?.email || 'Candidate',
    full_name: session?.user?.email || 'Candidate',
  };
  const response = existing?.id
    ? await supabase.from('candidates').update(basePayload).eq('id', existing.id).select('*').maybeSingle()
    : await supabase.from('candidates').insert(basePayload).select('*').maybeSingle();
  if (response.error) throw response.error;
  return response.data || { ...existing, ...basePayload };
};

const fetchJobs = async (filters = {}) => {
  const supabase = platformClient();
  let query = supabase
    .from('jobs')
    .select('id,employer_id,company_name,job_title,job_location,job_type,job_level,employment_type,category,description,requirements,required_skills,required_skills_array,experience_level,salary_range,salary_min,salary_max,salary_hidden,benefits,last_date,status,created_at')
    .order('created_at', { ascending: false });
  if (filters.employerId) query = query.eq('employer_id', filters.employerId);
  if (filters.status) query = query.eq('status', filters.status);
  const { data, error } = await query;
  if (error) {
    if (error.code === 'PGRST205' || error.message?.includes("public.jobs")) {
      throw new Error('Database setup incomplete. Run the updated supabase-schema.sql to create the jobs table.');
    }
    throw error;
  }
  return data || [];
};

const formatSalaryRange = (job = {}) => {
  if (job.salary_hidden) return 'Hidden by employer';
  if (job.salary_min || job.salary_max) {
    const min = job.salary_min ? `BDT ${Number(job.salary_min).toLocaleString()}` : 'Negotiable';
    const max = job.salary_max ? `BDT ${Number(job.salary_max).toLocaleString()}` : 'Negotiable';
    return `${min} - ${max}`;
  }
  return job.salary_range || 'Negotiable';
};

const isJobExpired = (job = {}) => {
  if (!job.last_date) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(job.last_date) < today;
};

const isJobInactive = (job = {}) => normalize(job.status || 'active') === 'inactive';

const fetchEmployerProfilesByUserIds = async (userIds = []) => {
  const uniqueIds = [...new Set(userIds.filter(Boolean))];
  if (!uniqueIds.length) return new Map();
  const supabase = platformClient();
  const { data, error } = await supabase
    .from('employers')
    .select('user_id,company_name,contact_person,official_email')
    .in('user_id', uniqueIds);
  if (error) return new Map();
  return new Map((data || []).map((item) => [item.user_id, item]));
};

const getCandidateCategories = (candidate = {}) => (
  Array.isArray(candidate.categories) && candidate.categories.length ? candidate.categories : [candidate.category].filter(Boolean)
).map(normalize);

const getCandidateSkills = (candidate = {}) => (
  Array.isArray(candidate.skills_array) && candidate.skills_array.length ? candidate.skills_array : splitSkills(candidate.skills || '')
).map(normalize);

const getJobRequiredSkills = (job = {}) => (
  Array.isArray(job.required_skills_array) && job.required_skills_array.length ? job.required_skills_array : splitSkills(job.required_skills || '')
).map(normalize);

const normalizeCareerLevel = (value) => {
  const normalized = normalize(value);
  if (normalized === 'top-level' || normalized === 'top level' || normalized === 'senior level') return 'top-level';
  if (normalized === 'entry' || normalized === 'entry-level') return 'entry level';
  if (normalized === 'mid-level') return 'mid level';
  return normalized;
};

const getMatchScoreClass = (score = 0) => {
  if (score >= 80) return 'match-high';
  if (score >= 50) return 'match-medium';
  return 'match-low';
};

const calculateJobMatchDetails = (candidate, job) => {
  const categoryMatch = getCandidateCategories(candidate).includes(normalize(job.category));
  const candidateSkills = getCandidateSkills(candidate);
  const requiredSkills = getJobRequiredSkills(job);
  const matchedSkills = requiredSkills.filter((skill) => candidateSkills.some((candidateSkill) => candidateSkill === skill));
  const skillMatch = requiredSkills.length ? matchedSkills.length / requiredSkills.length : 0;
  const levelMatch = Boolean(job.job_level && candidate.career_level && normalizeCareerLevel(candidate.career_level) === normalizeCareerLevel(job.job_level));
  const score = Math.round((skillMatch * 60) + (categoryMatch ? 30 : 0) + (levelMatch ? 10 : 0));

  return {
    score: Math.min(100, score),
    skillMatch,
    categoryMatch,
    levelMatch,
    matchedSkills: uniqueSkills(matchedSkills),
    requiredSkills: uniqueSkills(requiredSkills),
  };
};

const calculateJobMatch = (candidate, job) => calculateJobMatchDetails(candidate, job).score;

const getBestJobMatch = (candidate, jobs = []) => jobs
  .map((job) => ({ job, ...calculateJobMatchDetails(candidate, job) }))
  .filter((item) => item.score > 0)
  .sort((a, b) => b.score - a.score)[0] || null;

const renderAvailableJobs = async (candidate) => {
  const list = document.querySelector('[data-available-jobs]');
  const empty = document.querySelector('[data-available-jobs-empty]');
  if (!list) return;

  const jobs = await fetchJobs({ status: 'active' });
  const employerProfiles = await fetchEmployerProfilesByUserIds(jobs.map((job) => job.employer_id));
  const matches = jobs
    .map((job) => ({ job, ...calculateJobMatchDetails(candidate, job), employer: employerProfiles.get(job.employer_id) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  list.innerHTML = matches.map(({ job, score, matchedSkills, requiredSkills, employer }) => `
    <article class="candidate-job-card compact-job-item">
      <div class="compact-job-left">
        <div class="compact-job-logo">${getInitials(employer?.company_name || job.company_name || 'MX')}</div>
        <div class="compact-job-content">
          <h3>${job.job_title || 'Open Role'}</h3>
          <p>${employer?.company_name || 'MX Partner Employer'} • ${job.job_location || 'Location not set'}</p>
          <div class="compact-job-meta">
            <span>${job.employment_type || 'Employment not set'}</span>
            <span>•</span>
            <span>${job.job_type || 'Type not set'}</span>
            <span>•</span>
            <span>${formatSalaryRange(job)}</span>
          </div>
          <div class="compact-job-skills">
            ${(matchedSkills.length ? matchedSkills : splitSkills(job.required_skills).slice(0, 4)).slice(0, 4).map((skill) => `<span>${titleCase(skill)}</span>`).join('')}
            ${matchedSkills.length ? `<span>${matchedSkills.length}/${requiredSkills.length || matchedSkills.length} skills</span>` : ''}
          </div>
        </div>
      </div>
      <div class="compact-job-actions">
        <span class="compact-match-score ${getMatchScoreClass(score)}">${score}% match</span>
        <a class="compact-link-btn" href="job-details.html?id=${job.id}">View</a>
        <button class="compact-primary-btn" type="button" data-apply-job="${job.id}" ${isJobExpired(job) ? 'disabled' : ''}>${isJobExpired(job) ? 'Expired' : 'Apply'}</button>
      </div>
    </article>
  `).join('');

  if (empty) empty.hidden = matches.length > 0;
};

const applyToEmployerJob = async ({ candidate, jobId }) => {
  const supabase = platformClient();
  const { data: job, error: jobError } = await supabase
    .from('jobs')
    .select('id,employer_id,job_title,last_date,status')
    .eq('id', jobId)
    .maybeSingle();
  if (jobError) throw jobError;
  if (!job) throw new Error('This job is no longer available.');
  if (isJobInactive(job)) throw new Error('This job is currently inactive.');
  if (isJobExpired(job)) throw new Error('This job application deadline has passed.');
  const { data: employerProfile } = await supabase
    .from('employers')
    .select('id')
    .eq('user_id', job.employer_id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const cvUrl = await uploadCandidateAtsCv(supabase, candidate, job.id);
  const { error } = await supabase.from('applications').insert({
    candidate_id: candidate.user_id,
    candidate_user_id: candidate.user_id,
    employer_id: employerProfile?.id || null,
    employer_user_id: job.employer_id,
    job_id: job.id,
    job_role: job.job_title,
    cv_url: cvUrl,
    status: 'Applied',
  });
  if (error) {
    if (error.code === '23505') throw new Error('You already applied to this job.');
    throw error;
  }
};

const fetchAppliedJobs = async (candidateUserId) => {
  const supabase = platformClient();
  const { data: applications, error } = await supabase
    .from('applications')
    .select('id,candidate_id,candidate_user_id,employer_user_id,job_id,job_role,status,cv_url,created_at')
    .or(`candidate_id.eq.${candidateUserId},candidate_user_id.eq.${candidateUserId}`)
    .order('created_at', { ascending: false });
  if (error) throw error;

  const jobs = await fetchJobs({ status: 'active' });
  const jobMap = new Map(jobs.map((job) => [job.id, job]));
  const employerProfiles = await fetchEmployerProfilesByUserIds(jobs.map((job) => job.employer_id));

  return (applications || []).map((application) => {
    const job = jobMap.get(application.job_id);
    return {
      ...application,
      job,
      employer: job ? employerProfiles.get(job.employer_id) : null,
    };
  });
};

const renderAppliedJobs = async (candidateUserId) => {
  const list = document.querySelector('[data-applied-jobs]');
  const empty = document.querySelector('[data-applied-jobs-empty]');
  if (!list) return;
  const applications = await fetchAppliedJobs(candidateUserId);
  list.innerHTML = applications.map((application) => `
    <article class="candidate-job-card compact-job-item">
      <div class="compact-job-left">
        <div class="compact-job-logo">${getInitials(application.employer?.company_name || 'MX')}</div>
        <div class="compact-job-content">
          <h3>${application.job?.job_title || application.job_role || 'Role'}</h3>
          <p>${application.employer?.company_name || 'MX Partner Employer'} • ${application.job?.job_location || 'Location not set'}</p>
          <div class="compact-job-meta">
            <span>${application.job?.employment_type || 'Employment not set'}</span>
            <span>•</span>
            <span>${application.job?.job_type || 'Type not set'}</span>
            <span>•</span>
            <span>Applied ${new Date(application.created_at).toLocaleDateString()}</span>
          </div>
          <div class="compact-job-skills">
            <span>${application.job?.category || 'Category not set'}</span>
            <span>${application.status || 'Applied'}</span>
          </div>
        </div>
      </div>
      <div class="compact-job-actions">
        <span class="compact-status-text">${application.status || 'Applied'}</span>
        ${application.cv_url ? `<a class="compact-link-btn" href="${application.cv_url}" target="_blank" rel="noreferrer">View ATS CV</a>` : ''}
      </div>
    </article>
  `).join('');
  if (empty) empty.hidden = applications.length > 0;
};
const populatePublicJobFilters = (jobs = []) => {
  const locationFilter = document.querySelector('[data-public-location-filter]');
  const selectedLocation = locationFilter?.value || 'all';
  const categories = [...new Set(jobs.map((job) => job.category).filter(Boolean))].sort();
  const skills = uniqueSkills(jobs.flatMap((job) => splitSkills(job.required_skills))).slice(0, 16);
  const locations = [...new Set(jobs.map((job) => job.job_location).filter(Boolean))].sort();
  const selectedCategories = getCheckedValues(document, 'public_filter_category');
  const selectedSkills = getCheckedValues(document, 'public_filter_skill');
  const categoryTarget = document.querySelector('[data-public-category-checkboxes]');
  const skillTarget = document.querySelector('[data-public-skill-tags]');

  if (categoryTarget) {
    categoryTarget.innerHTML = categories.map((category) => `
      <label class="marketplace-check">
        <input type="checkbox" name="public_filter_category" value="${category}" data-filter-category ${selectedCategories.includes(category) ? 'checked' : ''} />
        <span>${category}</span>
      </label>
    `).join('');
  }

  if (skillTarget) {
    skillTarget.innerHTML = skills.map((skill) => `
      <button class="marketplace-skill-filter ${selectedSkills.includes(titleCase(skill)) ? 'is-selected' : ''}" type="button" data-filter-skill="${titleCase(skill)}">
        ${selectedSkills.includes(titleCase(skill)) ? `<input type="checkbox" name="public_filter_skill" value="${titleCase(skill)}" checked hidden />` : ''}
        ${titleCase(skill)}
      </button>
    `).join('');
  }

  if (locationFilter) {
    locationFilter.innerHTML = '<option value="all">All locations</option>' + locations.map((location) => `<option value="${location}">${location}</option>`).join('');
    if ([...locationFilter.options].some((option) => option.value === selectedLocation)) locationFilter.value = selectedLocation;
  }
  updatePublicFilterMeta();
};

const groupJobsByCategory = (jobs = []) => jobs.reduce((groups, job) => {
  const category = job.category || 'Uncategorized';
  if (!groups[category]) groups[category] = [];
  groups[category].push(job);
  return groups;
}, {});

const PUBLIC_JOBS_PER_PAGE = 25;
let publicJobsPage = 1;
let selectedPublicJobId = '';
let publicCandidateProfile = null;

const cosineSimilarity = (a = [], b = []) => {
  if (!a.length || !b.length || a.length !== b.length) return 0;
  const dot = a.reduce((sum, value, index) => sum + (Number(value) || 0) * (Number(b[index]) || 0), 0);
  const magA = Math.sqrt(a.reduce((sum, value) => sum + (Number(value) || 0) * (Number(value) || 0), 0));
  const magB = Math.sqrt(b.reduce((sum, value) => sum + (Number(value) || 0) * (Number(value) || 0), 0));
  return magA && magB ? dot / (magA * magB) : 0;
};

const createLocalEmbedding = (text = '', size = 24) => {
  const vector = Array(size).fill(0);
  normalize(text).split(/[^a-z0-9+#.]+/).filter(Boolean).forEach((token) => {
    let hash = 0;
    for (let index = 0; index < token.length; index += 1) {
      hash = ((hash << 5) - hash) + token.charCodeAt(index);
      hash |= 0;
    }
    vector[Math.abs(hash) % size] += 1;
  });
  return vector;
};

const getCandidateEmbedding = (candidate = {}) => {
  if (Array.isArray(candidate.embedding) && candidate.embedding.length) return candidate.embedding.map(Number);
  const profileText = [
    candidate.category,
    Array.isArray(candidate.categories) ? candidate.categories.join(' ') : '',
    getCandidateSkills(candidate).join(' '),
    candidate.experience,
    candidate.about,
    candidate.career_level,
  ].join(' ');
  return createLocalEmbedding(profileText);
};

const getJobEmbedding = (job = {}) => {
  if (Array.isArray(job.embedding) && job.embedding.length) return job.embedding.map(Number);
  const jobText = [
    job.job_title,
    job.category,
    job.job_level,
    job.employment_type,
    job.job_type,
    getJobRequiredSkills(job).join(' '),
    job.description,
    job.requirements,
  ].join(' ');
  return createLocalEmbedding(jobText);
};

const getPublicUserProfileForMatching = () => {
  if (publicCandidateProfile) return publicCandidateProfile;
  return {
    category: '',
    skills: getCheckedValues(document, 'public_filter_skill').join(', '),
    career_level: '',
    about: '',
    experience: '',
  };
};

const calculatePublicJobMatchScore = (job = {}, candidate = getPublicUserProfileForMatching()) => {
  const embeddingScore = Math.max(0, cosineSimilarity(getCandidateEmbedding(candidate), getJobEmbedding(job)));
  const candidateSkills = getCandidateSkills(candidate);
  const jobSkills = getJobRequiredSkills(job);
  const matchedSkills = jobSkills.filter((skill) => candidateSkills.includes(skill));
  const skillMatch = jobSkills.length ? matchedSkills.length / jobSkills.length : 0;
  const categoryMatch = getCandidateCategories(candidate).includes(normalize(job.category)) ? 1 : 0;
  const levelMatch = candidate.career_level && job.job_level && normalizeCareerLevel(candidate.career_level) === normalizeCareerLevel(job.job_level) ? 1 : 0;
  const finalScore = (embeddingScore * 0.55) + (skillMatch * 0.3) + (categoryMatch * 0.1) + (levelMatch * 0.05);
  return Math.max(0, Math.min(100, Math.round(finalScore * 100)));
};

const calculateAiCandidateJobMatch = (candidate = {}, job = {}) => {
  const embeddingScore = Math.max(0, cosineSimilarity(getJobEmbedding(job), getCandidateEmbedding(candidate)));
  const candidateSkills = getCandidateSkills(candidate);
  const requiredSkills = getJobRequiredSkills(job);
  const matchedSkills = requiredSkills.filter((skill) => candidateSkills.includes(skill));
  const skillMatch = requiredSkills.length ? matchedSkills.length / requiredSkills.length : 0;
  const categoryMatch = getCandidateCategories(candidate).includes(normalize(job.category)) ? 1 : 0;
  const levelMatch = candidate.career_level && job.job_level && normalizeCareerLevel(candidate.career_level) === normalizeCareerLevel(job.job_level) ? 1 : 0;
  const finalScore = (embeddingScore * 0.55) + (skillMatch * 0.3) + (categoryMatch * 0.1) + (levelMatch * 0.05);

  return {
    job,
    score: Math.max(0, Math.min(100, Math.round(finalScore * 100))),
    semanticScore: Math.round(embeddingScore * 100),
    skillMatch,
    categoryMatch,
    levelMatch,
    matchedSkills: uniqueSkills(matchedSkills),
    requiredSkills: uniqueSkills(requiredSkills),
  };
};

const getBestAiJobMatch = (candidate, jobs = []) => jobs
  .map((job) => calculateAiCandidateJobMatch(candidate, job))
  .filter((match) => match.score > 0)
  .sort((a, b) => b.score - a.score)[0] || null;

const getPublicMatchBadgeClass = (score = 0) => {
  if (score > 80) return 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300';
  if (score > 60) return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300';
  return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300';
};

const getFilteredPublicJobs = (jobs = []) => {
  const search = normalize(document.querySelector('[data-public-search-filter]')?.value);
  const categories = getCheckedValues(document, 'public_filter_category');
  const experiences = Array.from(document.querySelectorAll('[data-filter-experience]:checked')).map((input) => input.value);
  const jobTypes = Array.from(document.querySelectorAll('[data-filter-job-type]:checked')).map((input) => input.value);
  const selectedSkills = getCheckedValues(document, 'public_filter_skill').map(normalize);
  const maxSalary = Number(document.querySelector('[data-public-salary-range]')?.value || 200000);
  const topJobType = document.querySelector('[data-public-job-type-filter]')?.value || 'all';
  const location = document.querySelector('[data-public-location-filter]')?.value || 'all';
  const sortMode = document.querySelector('[data-public-sort-filter]')?.value || 'relevance';
  const candidate = getPublicUserProfileForMatching();
  return jobs.filter((job) => {
    const haystack = normalize(`${job.job_title} ${job.company_name} ${job.category} ${job.required_skills} ${job.job_location}`);
    const jobSkills = splitSkills(job.required_skills);
    const categoryMatch = !categories.length || categories.includes(job.category);
    const typeMatch = (!jobTypes.length && topJobType === 'all') ||
      jobTypes.includes(job.employment_type) ||
      jobTypes.includes(job.job_type) ||
      topJobType === job.job_type;
    const locationMatch = location === 'all' || job.job_location === location;
    const levelMatch = !experiences.length || experiences.includes(job.job_level) || experiences.includes(job.experience_level);
    const searchMatch = !search || haystack.includes(search);
    const salaryValue = Number(job.salary_max || job.salary_min || 0);
    const salaryMatch = !salaryValue || salaryValue <= maxSalary;
    const skillsMatch = !selectedSkills.length || selectedSkills.every((skill) => jobSkills.includes(skill));
    return searchMatch && categoryMatch && typeMatch && locationMatch && levelMatch && salaryMatch && skillsMatch;
  }).map((job) => ({
    ...job,
    matchScore: calculatePublicJobMatchScore(job, candidate),
  })).sort((a, b) => {
    if (sortMode === 'latest') return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    if (sortMode === 'salary') return Number(b.salary_max || b.salary_min || 0) - Number(a.salary_max || a.salary_min || 0);
    return (b.matchScore || 0) - (a.matchScore || 0);
  });
};

const updatePublicFilterMeta = () => {
  const activeCount = [
    ...document.querySelectorAll('[data-filter-category]:checked'),
    ...document.querySelectorAll('[data-filter-experience]:checked'),
    ...document.querySelectorAll('[data-filter-job-type]:checked'),
    ...document.querySelectorAll('input[name="public_filter_skill"]:checked'),
  ].length + (Number(document.querySelector('[data-public-salary-range]')?.value || 200000) < 200000 ? 1 : 0);
  const countTarget = document.querySelector('[data-active-filter-count]');
  const salaryTarget = document.querySelector('[data-public-salary-value]');
  if (countTarget) countTarget.textContent = String(activeCount);
  if (salaryTarget) salaryTarget.textContent = Number(document.querySelector('[data-public-salary-range]')?.value || 200000).toLocaleString();
};

const syncPublicFilterAccordions = () => {
  const hasActiveFilter = {
    category: document.querySelectorAll('[data-filter-category]:checked').length > 0,
    experience: document.querySelectorAll('[data-filter-experience]:checked').length > 0,
    'job-type': document.querySelectorAll('[data-filter-job-type]:checked').length > 0,
    salary: Number(document.querySelector('[data-public-salary-range]')?.value || 200000) < 200000,
    skills: document.querySelectorAll('input[name="public_filter_skill"]:checked').length > 0,
  };

  document.querySelectorAll('[data-filter-accordion]').forEach((accordion) => {
    accordion.open = Boolean(hasActiveFilter[accordion.dataset.filterAccordion]);
  });
};

const renderPublicJobs = (jobs = []) => {
  const groupsTarget = document.querySelector('[data-public-job-groups]');
  const empty = document.querySelector('[data-public-jobs-empty]');
  const status = document.querySelector('[data-public-jobs-status]');
  const pagination = document.querySelector('[data-public-job-pagination]');
  if (!groupsTarget) return;
  const filteredJobs = getFilteredPublicJobs(jobs);
  const totalPages = Math.max(1, Math.ceil(filteredJobs.length / PUBLIC_JOBS_PER_PAGE));
  publicJobsPage = Math.min(Math.max(1, publicJobsPage), totalPages);
  const startIndex = (publicJobsPage - 1) * PUBLIC_JOBS_PER_PAGE;
  const pageJobs = filteredJobs.slice(startIndex, startIndex + PUBLIC_JOBS_PER_PAGE);
  if (!selectedPublicJobId || !filteredJobs.some((job) => job.id === selectedPublicJobId)) {
    selectedPublicJobId = pageJobs[0]?.id || '';
  }
  document.querySelector('[data-public-job-count]') && (document.querySelector('[data-public-job-count]').textContent = jobs.length);
  document.querySelector('[data-public-category-count]') && (document.querySelector('[data-public-category-count]').textContent = new Set(jobs.map((job) => job.category).filter(Boolean)).size);
  groupsTarget.innerHTML = `
    <div class="space-y-3" role="list" aria-label="Open jobs">
      ${pageJobs.map((job) => `
        <article class="rounded-xl border bg-white p-4 transition hover:shadow-md dark:bg-slate-900 ${job.id === selectedPublicJobId ? 'border-blue-500 shadow-md ring-2 ring-blue-500/10 dark:border-blue-400' : 'border-slate-200 dark:border-slate-800'} ${isJobExpired(job) ? 'opacity-70' : ''}" role="listitem" data-job-row="${job.id}" data-view-public-job="${job.id}" tabindex="0">
          <div class="flex justify-between gap-4">
            <div>
              <h3 class="font-semibold text-slate-900 dark:text-white">${job.job_title || 'Open Role'}</h3>
              <p class="text-sm text-slate-500 dark:text-slate-400">${job.company_name || 'MX Partner Employer'} • ${job.job_location || 'Location not set'}</p>
            </div>
            <div class="flex flex-col items-end gap-1">
              <span class="h-fit rounded-full px-2 py-1 text-xs font-semibold ${getPublicMatchBadgeClass(job.matchScore)}">${job.matchScore || 0}% match</span>
              <span class="h-fit rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700 dark:bg-green-900/40 dark:text-green-300">${isJobExpired(job) ? 'EXPIRED' : 'ACTIVE'}</span>
            </div>
          </div>
          <div class="mt-2 flex flex-wrap gap-2 text-xs">
            <span class="rounded bg-slate-100 px-2 py-1 dark:bg-slate-800">${job.employment_type || 'Employment not set'}</span>
            <span class="rounded bg-slate-100 px-2 py-1 dark:bg-slate-800">${job.job_type || 'Type not set'}</span>
            <span class="rounded bg-slate-100 px-2 py-1 dark:bg-slate-800">${job.job_level || 'Level not set'}</span>
          </div>
          <div class="mt-2 flex items-center justify-between gap-3 text-sm text-slate-500 dark:text-slate-400">
            <span>${formatSalaryRange(job)} • ${job.last_date ? `Deadline: ${new Date(job.last_date).toLocaleDateString()}` : 'Deadline not set'}</span>
            <button class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60" type="button" data-public-apply-job="${job.id}" ${isJobExpired(job) ? 'disabled' : ''}>${isJobExpired(job) ? 'Expired' : 'Apply'}</button>
          </div>
        </article>
      `).join('')}
    </div>
  `;
  if (pagination) {
    pagination.innerHTML = filteredJobs.length ? `
      <button class="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:text-blue-600 dark:border-slate-800 dark:text-slate-300" type="button" data-public-page="prev" ${publicJobsPage === 1 ? 'disabled' : ''}>Previous</button>
      <span>Page ${publicJobsPage} of ${totalPages}</span>
      <button class="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:text-blue-600 dark:border-slate-800 dark:text-slate-300" type="button" data-public-page="next" ${publicJobsPage === totalPages ? 'disabled' : ''}>Next</button>
      <button class="marketplace-load-more" type="button" data-public-page="next" ${publicJobsPage === totalPages ? 'hidden' : ''}>Load more jobs</button>
    ` : '';
  }
  if (empty) empty.hidden = filteredJobs.length > 0;
  if (status) status.textContent = jobs.length ? `Showing ${filteredJobs.length ? `${startIndex + 1}-${Math.min(startIndex + PUBLIC_JOBS_PER_PAGE, filteredJobs.length)} of ` : ''}${filteredJobs.length} filtered jobs. ${jobs.length} live jobs total.` : 'No employer jobs have been posted yet.';
  updatePublicFilterMeta();
  syncPublicFilterAccordions();
  renderPublicJobPreview(jobs.find((job) => job.id === selectedPublicJobId) || null);
};

const renderPublicJobPreview = (job) => {
  const preview = document.querySelector('[data-public-job-preview]');
  if (!preview) return;

  if (!job) {
    preview.innerHTML = `
      <h2 class="mb-2 text-xl font-bold text-slate-900 dark:text-white">Select a job to view details</h2>
      <p class="text-sm text-slate-500 dark:text-slate-400">Job details, salary, requirements, and apply action will appear here without reloading the page.</p>
    `;
    return;
  }

  const skillTags = splitSkills(job.required_skills).slice(0, 8);
  preview.innerHTML = `
    <div>
      <span class="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">${job.category || 'Job Category'}</span>
      <span class="ml-2 rounded-full px-3 py-1 text-xs font-semibold ${getPublicMatchBadgeClass(job.matchScore)}">${job.matchScore || 0}% match</span>
      <h2 class="mt-4 text-2xl font-bold text-slate-900 dark:text-white">${job.job_title || 'Open Role'}</h2>
      <p class="mt-1 text-slate-500 dark:text-slate-400">${job.company_name || 'MX Partner Employer'} • ${job.job_location || 'Location not set'}</p>

      <div class="mt-4 flex flex-wrap gap-2">
        <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold dark:bg-slate-800">${job.employment_type || 'Employment not set'}</span>
        <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold dark:bg-slate-800">${job.job_type || 'Type not set'}</span>
        <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold dark:bg-slate-800">${job.job_level || 'Level not set'}</span>
      </div>

      <div class="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
        <p class="text-sm font-bold text-slate-900 dark:text-white">${formatSalaryRange(job)}</p>
        <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">${job.last_date ? `Apply by ${new Date(job.last_date).toLocaleDateString()}` : 'Deadline not set'}</p>
      </div>

      <div class="mt-6">
        <h3 class="text-sm font-bold text-slate-900 dark:text-white">Description</h3>
        <p class="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600 dark:text-slate-300">${job.description || 'No description added.'}</p>
      </div>

      <div class="mt-6">
        <h3 class="text-sm font-bold text-slate-900 dark:text-white">Requirements</h3>
        <p class="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600 dark:text-slate-300">${job.requirements || 'No requirements added.'}</p>
      </div>

      <div class="mt-6">
        <h3 class="text-sm font-bold text-slate-900 dark:text-white">Skills</h3>
        <div class="mt-2 flex flex-wrap gap-2">
          ${skillTags.length ? skillTags.map((skill) => `<span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">${titleCase(skill)}</span>`).join('') : '<span class="text-sm text-slate-500">No skills listed.</span>'}
        </div>
      </div>

      <button class="mt-6 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60" type="button" data-public-apply-job="${job.id}" ${isJobExpired(job) ? 'disabled' : ''}>${isJobExpired(job) ? 'Expired' : 'Apply Now'}</button>
    </div>
  `;
};

const applyToPublicJob = async (jobId) => {
  const session = await getSession();
  if (!session?.user) {
    window.location.href = 'auth.html';
    throw new Error('Redirecting to login...');
  }
  const profile = await getUserProfile(session.user.id);
  if (profile?.role !== 'candidate') throw new Error('Please login with a candidate account to apply.');
  const candidate = await loadCandidateProfile(session.user.id);
  if (!candidate?.user_id) throw new Error('Please complete your candidate profile before applying.');
  const job = await fetchJobById(jobId);
  if (isJobInactive(job)) throw new Error('This job is currently inactive.');
  if (isJobExpired(job)) throw new Error('This job application deadline has passed.');
  await applyToEmployerJob({ candidate, jobId });
};

const openPublicJobDetails = (job) => {
  if (!job) return;
  const modal = document.getElementById('public-job-modal');
  const content = document.querySelector('[data-public-job-modal-content]');
  if (!modal || !content) return;
  content.innerHTML = `
    <div class="modal-profile-head">
      <div>
        <p class="eyebrow">${job.category || 'Job Details'}</p>
        <h2 id="public-job-modal-title">${job.job_title || 'Open Role'}</h2>
        <p>${job.company_name || 'MX Partner Employer'} | ${job.job_location || 'Location not set'}</p>
        <p>${job.job_level || 'Level not set'} • ${job.employment_type || 'Employment not set'} • ${job.job_type || 'Type not set'}</p>
      </div>
    </div>
    <div class="report-block"><h3>Job Category</h3><p>${job.category || 'Not set'}</p></div>
    <div class="report-block"><h3>Description</h3><p>${job.description || 'No description added.'}</p></div>
    <div class="report-block"><h3>Requirements</h3><p>${job.requirements || 'No requirements added.'}</p></div>
    <div class="report-block"><h3>Required Skills</h3><p>${job.required_skills || 'Not specified'}</p></div>
    <div class="report-block report-recommendation"><h3>Salary & Deadline</h3><p>${formatSalaryRange(job)}<br>Last Date: ${job.last_date ? new Date(job.last_date).toLocaleDateString() : 'Not set'}</p></div>
    <div class="report-block"><h3>Benefits</h3><p>${job.benefits || 'Not specified'}</p></div>
    <div class="hero-actions">
      <button class="btn primary" type="button" data-public-apply-job="${job.id}" ${isJobExpired(job) ? 'disabled' : ''}>${isJobExpired(job) ? 'Expired' : 'Apply Now'}</button>
      <button class="btn secondary" type="button" data-public-job-modal-close>Close</button>
    </div>
  `;
  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
};

const closePublicJobModal = () => {
  const modal = document.getElementById('public-job-modal');
  if (!modal) return;
  modal.classList.remove('is-open');
  modal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');
};

const fetchJobById = async (jobId) => {
  if (!jobId) return null;
  const supabase = platformClient();
  const { data, error } = await supabase
    .from('jobs')
    .select('id,employer_id,company_name,job_title,job_location,job_type,job_level,employment_type,category,description,requirements,required_skills,required_skills_array,experience_level,salary_range,salary_min,salary_max,salary_hidden,benefits,last_date,status,created_at')
    .eq('id', jobId)
    .maybeSingle();
  if (error) throw error;
  return data;
};

const renderJobDetailsPage = (job) => {
  const hero = document.querySelector('[data-job-details-hero]');
  const content = document.querySelector('[data-job-details-content]');
  const applyButton = document.querySelector('[data-details-apply-job]');
  if (!hero || !content || !job) return;
  const expired = isJobExpired(job);
  hero.innerHTML = `
    <p class="eyebrow">${job.category || 'Job Details'}</p>
    <h1>${job.job_title || 'Open Role'}</h1>
    <p class="lead">${job.company_name || 'MX Partner Employer'} | ${job.job_location || 'Location not set'}</p>
    <div class="track-role-list">
      <span class="track-role-pill">${job.category || 'Category not set'}</span>
      <span class="track-role-pill">${job.job_level || 'Level not set'}</span>
      <span class="track-role-pill">${job.employment_type || 'Employment not set'}</span>
      <span class="track-role-pill">${job.job_type || 'Type not set'}</span>
      <span class="track-role-pill">${formatSalaryRange(job)}</span>
      <span class="track-role-pill">${expired ? 'Expired' : `Apply by ${job.last_date ? new Date(job.last_date).toLocaleDateString() : 'Not set'}`}</span>
    </div>
  `;
  content.innerHTML = `
    <div class="job-detail-block"><h2>Description</h2><p>${job.description || 'No description added.'}</p></div>
    <div class="job-detail-block"><h2>Job Classification</h2><p>${job.job_level || 'Level not set'} • ${job.employment_type || 'Employment not set'} • ${job.job_type || 'Type not set'}</p></div>
    <div class="job-detail-block"><h2>Requirements</h2><p>${job.requirements || 'No requirements added.'}</p></div>
    <div class="job-detail-block"><h2>Required Skills</h2><p>${job.required_skills || 'Not specified'}</p></div>
    <div class="job-detail-block salary-detail"><h2>Salary Range</h2><p>${formatSalaryRange(job)}</p></div>
    <div class="job-detail-block"><h2>Benefits</h2><p>${job.benefits || 'Not specified'}</p></div>
    <div class="job-detail-block"><h2>Deadline</h2><p>${job.last_date ? new Date(job.last_date).toLocaleDateString() : 'Not set'} ${expired ? '<span class="status-pill status-rejected">Expired</span>' : ''}</p></div>
  `;
  if (applyButton) {
    applyButton.dataset.detailsApplyJob = job.id;
    applyButton.disabled = expired;
    applyButton.textContent = expired ? 'Expired' : 'Apply Now';
  }
};

const initJobDetailsPage = async () => {
  if (document.body.dataset.page !== 'job-details') return;
  const jobId = new URLSearchParams(window.location.search).get('id');
  const feedback = document.querySelector('[data-job-details-feedback]');
  try {
    const job = await fetchJobById(jobId);
    if (!job) throw new Error('Job not found.');
    renderJobDetailsPage(job);
  } catch (error) {
    const content = document.querySelector('[data-job-details-content]');
    if (content) content.innerHTML = `<p class="admin-empty-state">${error.message || 'Could not load job details.'}</p>`;
  }

  document.querySelector('[data-details-apply-job]')?.addEventListener('click', async (event) => {
    const button = event.currentTarget;
    button.disabled = true;
    try {
      await applyToPublicJob(button.dataset.detailsApplyJob);
      button.textContent = 'Applied';
      if (feedback) {
        feedback.textContent = 'Application submitted successfully. Redirecting to applied jobs...';
        feedback.classList.add('is-success');
        feedback.classList.remove('is-error');
      }
      redirectAfterSuccess('candidate-dashboard.html?tab=applied-jobs', 'Application submitted successfully.');
    } catch (error) {
      button.textContent = 'Apply Now';
      button.disabled = false;
      if (feedback) {
        feedback.textContent = error.message || 'Apply failed.';
        feedback.classList.add('is-error');
      }
    }
  });
};

const initPublicJobsPage = async () => {
  if (document.body.dataset.page !== 'jobs') return;
  const groupsTarget = document.querySelector('[data-public-job-groups]');
  if (!groupsTarget) return;
  const supabase = platformClient();
  let jobs = [];
  const loadAndRender = async () => {
    const status = document.querySelector('[data-public-jobs-status]');
    if (status) status.textContent = 'Loading latest jobs...';
    try {
      jobs = await fetchJobs({ status: 'active' });
      populatePublicJobFilters(jobs);
      renderPublicJobs(jobs);
    } catch (error) {
      if (status) status.textContent = error.message || 'Could not load jobs.';
    }
  };
  await loadAndRender();
  try {
    const session = await getSession();
    if (session?.user) {
      publicCandidateProfile = await loadCandidateProfile(session.user.id);
      renderPublicJobs(jobs);
    }
  } catch (error) {
    publicCandidateProfile = null;
  }
  document.querySelector('[data-refresh-public-jobs]')?.addEventListener('click', loadAndRender);
  const rerenderFromFilters = () => {
    publicJobsPage = 1;
    selectedPublicJobId = '';
    updatePublicFilterMeta();
    renderPublicJobs(jobs);
  };
  document.querySelector('[data-public-job-filters]')?.addEventListener('change', rerenderFromFilters);
  document.querySelector('[data-public-salary-range]')?.addEventListener('input', rerenderFromFilters);
  document.querySelector('[data-public-skill-tags]')?.addEventListener('click', (event) => {
    const button = event.target.closest('[data-filter-skill]');
    if (!button) return;
    const selected = button.classList.toggle('is-selected');
    button.innerHTML = `<input type="checkbox" name="public_filter_skill" value="${button.dataset.filterSkill}" ${selected ? 'checked' : ''} hidden />${button.dataset.filterSkill}`;
    rerenderFromFilters();
  });
  document.querySelector('[data-clear-public-filters]')?.addEventListener('click', () => {
    document.querySelector('[data-public-search-filter]').value = '';
    document.querySelector('[data-public-location-filter]').value = 'all';
    document.querySelector('[data-public-job-type-filter]').value = 'all';
    document.querySelectorAll('[data-filter-category], [data-filter-experience], [data-filter-job-type]').forEach((input) => {
      input.checked = false;
    });
    document.querySelectorAll('[data-filter-skill]').forEach((button) => {
      button.classList.remove('is-selected');
      button.innerHTML = button.dataset.filterSkill;
    });
    const salary = document.querySelector('[data-public-salary-range]');
    if (salary) salary.value = '200000';
    rerenderFromFilters();
  });
  document.querySelector('[data-public-search-filter]')?.addEventListener('input', rerenderFromFilters);
  document.querySelector('[data-public-location-filter]')?.addEventListener('change', rerenderFromFilters);
  document.querySelector('[data-public-job-type-filter]')?.addEventListener('change', rerenderFromFilters);
  document.querySelector('[data-public-sort-filter]')?.addEventListener('change', rerenderFromFilters);
  document.querySelector('[data-public-job-pagination]')?.addEventListener('click', (event) => {
    const button = event.target.closest('[data-public-page]');
    if (!button) return;
    publicJobsPage += button.dataset.publicPage === 'next' ? 1 : -1;
    renderPublicJobs(jobs);
    document.getElementById('live-jobs')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  groupsTarget.addEventListener('click', async (event) => {
    const applyButton = event.target.closest('[data-public-apply-job]');
    if (applyButton) {
      applyButton.disabled = true;
      try {
        await applyToPublicJob(applyButton.dataset.publicApplyJob);
        applyButton.textContent = 'Applied';
        redirectAfterSuccess('candidate-dashboard.html?tab=applied-jobs', 'Application submitted successfully.');
      } catch (error) {
        applyButton.textContent = error.message || 'Apply failed';
      }
      return;
    }
    const detailsButton = event.target.closest('[data-view-public-job]');
    if (detailsButton) {
      selectedPublicJobId = detailsButton.dataset.viewPublicJob;
      renderPublicJobs(jobs);
    }
  });
  groupsTarget.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter') return;
    const detailsCard = event.target.closest('[data-view-public-job]');
    if (detailsCard) {
      selectedPublicJobId = detailsCard.dataset.viewPublicJob;
      renderPublicJobs(jobs);
    }
  });
  document.querySelectorAll('[data-public-job-modal-close]').forEach((button) => button.addEventListener('click', closePublicJobModal));
  document.querySelector('[data-public-job-preview]')?.addEventListener('click', async (event) => {
    const applyButton = event.target.closest('[data-public-apply-job]');
    if (!applyButton) return;
    applyButton.disabled = true;
    try {
      await applyToPublicJob(applyButton.dataset.publicApplyJob);
      applyButton.textContent = 'Applied';
      redirectAfterSuccess('candidate-dashboard.html?tab=applied-jobs', 'Application submitted successfully.');
    } catch (error) {
      applyButton.textContent = error.message || 'Apply failed';
    }
  });
  document.querySelector('[data-public-job-modal-content]')?.addEventListener('click', async (event) => {
    if (event.target.closest('[data-public-job-modal-close]')) {
      closePublicJobModal();
      return;
    }
    const applyButton = event.target.closest('[data-public-apply-job]');
    if (!applyButton) return;
    applyButton.disabled = true;
    try {
      await applyToPublicJob(applyButton.dataset.publicApplyJob);
      applyButton.textContent = 'Applied';
      redirectAfterSuccess('candidate-dashboard.html?tab=applied-jobs', 'Application submitted successfully.');
    } catch (error) {
      applyButton.textContent = error.message || 'Apply failed';
    }
  });
  if (supabase?.channel) {
    supabase.channel('public-jobs-feed').on('postgres_changes', { event: '*', schema: 'public', table: 'jobs' }, loadAndRender).subscribe();
  }
};
const buildCVDataFromCandidate = (candidate) => ({
  fullName: candidate?.full_name || 'Candidate',
  email: candidate?.email || '',
  phone: candidate?.phone_number || '',
  location: candidate?.location || '',
  summary: candidate?.about || `${candidate?.career_level || ''} ${candidate?.category || 'candidate'}`.trim(),
  skills: Array.isArray(candidate?.skills_array) && candidate.skills_array.length ? candidate.skills_array.join(', ') : candidate?.skills || '',
  experience: Array.isArray(candidate?.experience_json) && candidate.experience_json.length
    ? candidate.experience_json.map((item) => `${item.role || ''} at ${item.company || ''}\\n${item.description || ''}`).join('\\n\\n')
    : candidate?.experience || '',
  education: Array.isArray(candidate?.education_json) && candidate.education_json.length
    ? candidate.education_json.map((item) => `${item.degree || ''}, ${item.institution || ''} ${item.year ? `(${item.year})` : ''}`).join('\\n')
    : candidate?.education || '',
  projects: Array.isArray(candidate?.certifications) && candidate.certifications.length
    ? candidate.certifications.map((item) => `${item.certificate_name || ''} - ${item.organization || ''} ${item.year ? `(${item.year})` : ''}`).join('\\n')
    : 'Certifications available on profile.',
});

const loadCandidateProfile = async (userId) => {
  const supabase = platformClient();
  const { data, error } = await supabase.from('candidates').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(1).maybeSingle();
  if (error) throw error;
  return data;
};

const fillCandidateForm = (candidate) => {
  if (!candidate) return;
  const form = document.querySelector('[data-platform-form="candidate-profile"]');
  if (!form) return;
  ['full_name', 'phone_number', 'location', 'other_skills', 'about', 'current_salary', 'expected_salary', 'career_level'].forEach((name) => {
    const field = form.elements[name];
    if (!field || !candidate[name]) return;
    field.value = candidate[name];
  });
  setPhotoPreview(candidate.photo_url, candidate.full_name);
};

const renderCandidateMatches = (candidate) => {
  const target = document.querySelector('[data-candidate-matches]');
  if (!target) return;
  const source = candidate || { skills: '', category: '', location: '' };
  target.innerHTML = PLATFORM_JOBS
    .map((job) => ({ job, score: calculateMatchScore(source, job) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ job, score }) => `
      <article class="match-card">
        <div class="match-card-top">
          <span class="plan-badge">${job.category}</span>
          <strong>${score}% match</strong>
        </div>
        <h3>${job.title}</h3>
        <p>${job.location} | ${job.type}</p>
        <p>${job.description}</p>
        <div class="track-role-list">${job.skills.map((skill) => `<span class="track-role-pill">${skill}</span>`).join('')}</div>
      </article>
    `)
    .join('') || '<p class="admin-empty-state">Select a category and target role to see recommended jobs.</p>';
};

const initCandidateDashboard = async () => {
  if (document.body.dataset.dashboardRole !== 'candidate') return;
  const context = await requireDashboardSession('candidate');
  if (!context) return;

  initCandidatePortalTabs();
  const form = document.querySelector('[data-platform-form="candidate-profile"]');
  let existing = await loadCandidateProfile(context.session.user.id);
  initProfileCategoryBuilder(existing || {});
  initDynamicProfileEntries(existing || {});
  fillCandidateForm(existing);
  renderProfileSummary(existing, context.session);
  renderCandidateMatches(existing);
  if (existing) {
    await renderAvailableJobs(existing);
    await renderAppliedJobs(context.session.user.id);
  }

  const profileScore = document.querySelector('[data-profile-score]');
  if (profileScore) profileScore.textContent = existing ? 'Profile active' : '0% complete';
  setCandidateProfileViewMode(getCandidateProfileViewMode(Boolean(existing)));

  document.querySelector('[data-scroll-edit-profile]')?.addEventListener('click', () => {
    setCandidateProfileViewMode('edit');
    document.getElementById('edit-profile')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  document.querySelector('[data-profile-summary]')?.addEventListener('click', async (event) => {
    const section = event.target.closest('[data-inline-section]');
    if (!section) return;
    if (event.target.closest('[data-inline-edit]')) {
      setInlineSectionMode(section, 'edit');
      return;
    }
    if (event.target.closest('[data-inline-cancel]')) {
      renderProfileSummary(existing, context.session);
      return;
    }
    const saveButton = event.target.closest('[data-inline-save]');
    if (!saveButton) return;
    saveButton.disabled = true;
    const feedback = section.querySelector('.form-feedback');
    try {
      const updated = await saveInlineCandidateSection({
        userId: context.session.user.id,
        sectionKey: section.dataset.inlineSection,
        section,
        existing,
        session: context.session,
      });
      existing = updated;
      renderProfileSummary(existing, context.session);
      fillCandidateForm(existing);
      initDynamicProfileEntries(existing || {});
      await renderAvailableJobs(existing);
      if (profileScore) profileScore.textContent = 'Profile active';
    } catch (error) {
      if (feedback) {
        feedback.textContent = error.message || 'Could not save this section.';
        feedback.classList.add('is-error');
      }
      saveButton.disabled = false;
    }
  });

  document.querySelector('[data-available-jobs]')?.addEventListener('click', async (event) => {
    const applyButton = event.target.closest('[data-apply-job]');
    if (!applyButton || !existing) return;
    applyButton.disabled = true;
    try {
      await applyToEmployerJob({
        candidate: existing,
        jobId: applyButton.dataset.applyJob,
      });
      applyButton.textContent = 'Applied';
      await renderAppliedJobs(context.session.user.id);
      redirectAfterSuccess('candidate-dashboard.html?tab=applied-jobs', 'Application submitted successfully.');
    } catch (error) {
      applyButton.textContent = error.message || 'Apply failed';
    }
  });

  document.querySelector('[data-generate-profile-cv]')?.addEventListener('click', () => {
    if (!existing) return;
    const cvData = buildCVDataFromCandidate(existing);
    if (window.setCVData) window.setCVData(cvData);
    document.querySelector('[data-dashboard-cv-preview]').hidden = false;
    const feedback = document.querySelector('[data-resume-feedback]');
    if (feedback) {
      feedback.textContent = 'CV generated from your profile. Download buttons are ready.';
      feedback.classList.add('is-success');
    }
  });

  form?.elements.photo?.addEventListener('change', (event) => {
    const file = event.target.files?.[0];
    if (file) setPhotoPreview(URL.createObjectURL(file), form.elements.full_name?.value || 'MX');
  });

  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!validatePlatformForm(form)) {
      setFeedback(form, 'Please complete the highlighted fields.', 'error');
      return;
    }

    const formData = new FormData(form);
    const selectedCategories = getCheckedValues(form, 'profile_categories');
    if (!selectedCategories.length && formData.get('profile_category')) selectedCategories.push(formData.get('profile_category'));
    const selectedSkillValues = getSelectedProfileSkills();
    const otherSkillValues = splitSkills(formData.get('other_skills') || '').map(titleCase);
    const educationEntries = collectDynamicEntries('education');
    const experienceEntries = collectDynamicEntries('experience');
    const certificationEntries = collectDynamicEntries('certifications');
    const primaryCategory = selectedCategories[0] || '';
    const skillsText = uniqueSkills([...selectedSkillValues, ...otherSkillValues]).join(', ');

    try {
      const supabase = platformClient();
      const photoUrl = await uploadProfilePhoto(
        supabase,
        context.session.user.id,
        formData.get('photo')
      );
      const payload = {
        user_id: context.session.user.id,
        name: formData.get('full_name'),
        full_name: formData.get('full_name'),
        phone_number: formData.get('phone_number'),
        email: context.session.user.email,
        location: formData.get('location'),
        photo_url: photoUrl || existing?.photo_url || '',
        category: primaryCategory,
        categories: selectedCategories,
        skills: skillsText || 'Not provided',
        skills_array: selectedSkillValues,
        other_skills: formData.get('other_skills'),
        education: educationEntries.map((item) => `${item.degree} - ${item.institution} (${item.year})`).join('\n') || 'Not provided',
        education_json: educationEntries,
        experience: experienceEntries.map((item) => `${item.role} at ${item.company}`).join('\n') || 'Not provided',
        experience_json: experienceEntries,
        certifications: certificationEntries,
        about: formData.get('about'),
        current_salary: formData.get('current_salary') ? Number(formData.get('current_salary')) : null,
        expected_salary: formData.get('expected_salary') ? Number(formData.get('expected_salary')) : null,
        career_level: formData.get('career_level'),
      };
      const existingCandidate = await loadCandidateProfile(context.session.user.id);
      const response = existingCandidate
        ? await supabase.from('candidates').update(payload).eq('id', existingCandidate.id)
        : await supabase.from('candidates').insert(payload);
      if (response.error) throw response.error;
      await upsertProfile({ id: context.session.user.id, email: context.session.user.email, fullName: payload.full_name, role: 'candidate' });
      setFeedback(form, 'Profile saved successfully. Returning to profile view...');
      setPhotoPreview(payload.photo_url, payload.full_name);
      existing = payload;
      renderProfileSummary(payload, context.session);
      renderCandidateMatches(payload);
      await renderAvailableJobs(payload);
      await renderAppliedJobs(context.session.user.id);
      if (profileScore) profileScore.textContent = 'Profile active';
      window.setTimeout(() => {
        window.location.href = 'candidate-dashboard.html?view=profile';
      }, 1200);
    } catch (error) {
      setFeedback(form, error.message || 'Could not save profile.', 'error');
    }
  });
};

const fetchCandidates = async () => {
  const supabase = platformClient();
  const safeColumns = 'id,user_id,created_at,full_name,location,photo_url,category,categories,skills,skills_array,other_skills,experience,experience_json,education,education_json,certifications,about,career_level,resume_url';
  const { data, error } = await supabase.from('candidates').select(safeColumns).order('created_at', { ascending: false }).limit(100);
  if (error) throw error;
  return data || [];
};

const fetchLatestEmployerJob = async (userId) => {
  const supabase = platformClient();
  const { data, error } = await supabase
    .from('job_posts')
    .select('*')
    .eq('employer_user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
};

const renderCandidateListing = (candidates) => {
  const list = document.querySelector('[data-candidate-list]');
  const empty = document.querySelector('[data-candidate-empty]');
  const search = normalize(document.querySelector('[data-candidate-search]')?.value);
  const selectedCategory = document.querySelector('[data-candidate-role-filter]')?.value || 'all';
  if (!list) return;

  const filtered = candidates.filter((candidate) => {
    const haystack = normalize(`${candidate.full_name} ${candidate.skills} ${candidate.location} ${candidate.category}`);
    const searchMatch = !search || haystack.includes(search);
    const categoryMatch = selectedCategory === 'all' || normalize(candidate.category) === normalize(selectedCategory);
    return searchMatch && categoryMatch;
  });

  list.innerHTML = filtered.map((candidate) => {
    const score = getBestMatchScore(candidate, selectedCategory);
    const avatar = candidate.photo_url
      ? `<img src="${candidate.photo_url}" alt="${candidate.full_name || 'Candidate'} profile photo" />`
      : `<span>${getInitials(candidate.full_name || candidate.email)}</span>`;
    return `
      <article class="candidate-list-card">
        <div class="candidate-list-top">
          <div class="candidate-card-avatar">${avatar}</div>
          <div>
            <h3>${candidate.full_name || 'Candidate'}</h3>
            <p>${candidate.location || 'Location not set'} | ${candidate.category || 'No category'}</p>
          </div>
          <span class="match-score-badge ${getMatchScoreClass(score)}">${score}% match</span>
        </div>
        <p><strong>Skills:</strong> ${candidate.skills || 'Not provided'}</p>
        <p><strong>Category:</strong> ${candidate.category || 'Not selected'}</p>
        <p><strong>Experience:</strong> ${candidate.experience || 'Not provided'}</p>
        <div class="candidate-list-actions">
          ${candidate.resume_url ? `<a class="btn secondary" href="${candidate.resume_url}" target="_blank" rel="noreferrer">View Resume</a>` : ''}
          <a class="btn primary" href="mailto:${candidate.email || ''}">Contact</a>
        </div>
      </article>
    `;
  }).join('');

  if (empty) empty.hidden = filtered.length > 0;
};

const initEmployerPortalTabs = () => {
  const tabButtons = document.querySelectorAll('[data-employer-tab]');
  const panels = document.querySelectorAll('[data-employer-panel]');
  if (!tabButtons.length || !panels.length) return;
  const activateTab = (tabName) => {
    const targetButton = Array.from(tabButtons).find((item) => item.dataset.employerTab === tabName) || tabButtons[0];
    tabButtons.forEach((item) => item.classList.toggle('is-active', item === targetButton));
    panels.forEach((panel) => panel.classList.toggle('is-active', panel.dataset.employerPanel === targetButton.dataset.employerTab));
  };
  tabButtons.forEach((button) => {
    button.addEventListener('click', () => {
      activateTab(button.dataset.employerTab);
      history.replaceState(null, '', `#${button.dataset.employerTab}`);
    });
  });
  const params = new URLSearchParams(window.location.search);
  const requestedTab = params.get('tab');
  const tabAliases = {
    'published-jobs': 'my-jobs',
    'my-jobs': 'my-jobs',
    'post-job': 'post-job',
    'matched-candidates': 'matched-candidates',
    'applied-candidates': 'applied-candidates',
    shortlisted: 'shortlisted',
    profile: 'profile',
    dashboard: 'dashboard',
  };
  if (requestedTab) {
    activateTab(tabAliases[requestedTab] || requestedTab);
  } else if (window.location.hash) {
    activateTab(window.location.hash.replace('#', ''));
  }
};

const fetchEmployerProfile = async (userId) => {
  const supabase = platformClient();
  const { data, error } = await supabase
    .from('employers')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
};

const renderEmployerProfile = (employer, session) => {
  const target = document.querySelector('[data-employer-profile]');
  const empty = document.querySelector('[data-employer-profile-empty]');
  if (!target) return;
  const hasProfile = Boolean(employer?.company_name || employer?.contact_person || employer?.email || employer?.official_email || employer?.phone || employer?.contact_number);
  target.dataset.hasProfile = String(hasProfile);
  if (empty) empty.hidden = hasProfile;
  target.innerHTML = `
    <article><span>Company Name</span><p>${employer?.company_name || 'Not set'}</p></article>
    <article><span>Contact Person</span><p>${employer?.contact_person || 'Not set'}</p></article>
    <article><span>Email</span><p>${employer?.email || employer?.official_email || session?.user?.email || 'Not set'}</p></article>
    <article><span>Phone</span><p>${employer?.phone || employer?.contact_number || 'Not set'}</p></article>
    <article><span>Location</span><p>${employer?.location || 'Not set'}</p></article>
    <article><span>Industry</span><p>${employer?.industry || 'Not set'}</p></article>
    <article><span>Company Size</span><p>${employer?.company_size || 'Not set'}</p></article>
    <article><span>About</span><p>${employer?.about || 'Not set'}</p></article>
  `;
};

const setEmployerProfileMode = (mode = 'view') => {
  const profileGrid = document.querySelector('[data-employer-profile]');
  const empty = document.querySelector('[data-employer-profile-empty]');
  const form = document.querySelector('[data-platform-form="employer-profile"]');
  const editButton = document.querySelector('[data-edit-employer-profile]');
  const editing = mode === 'edit';
  const hasRenderedProfile = Boolean(profileGrid?.dataset.hasProfile === 'true');
  if (profileGrid) profileGrid.hidden = editing;
  if (empty) empty.hidden = editing || hasRenderedProfile;
  if (form) form.hidden = !editing;
  if (editButton) editButton.hidden = editing;
};

const fillEmployerProfileForm = (employer, session) => {
  const form = document.querySelector('[data-platform-form="employer-profile"]');
  if (!form) return;
  form.elements.company_name.value = employer?.company_name || '';
  form.elements.contact_person.value = employer?.contact_person || '';
  form.elements.email.value = employer?.email || employer?.official_email || session?.user?.email || '';
  form.elements.phone.value = employer?.phone || employer?.contact_number || '';
  form.elements.location.value = employer?.location || '';
  form.elements.industry.value = employer?.industry || '';
  form.elements.company_size.value = employer?.company_size || '';
  form.elements.about.value = employer?.about || '';
};

const fillJobPostDefaults = (employer, profile = {}) => {
  const form = document.querySelector('[data-platform-form="job-post"]');
  if (!form) return;
  const companyField = form.elements.company_name;
  if (companyField && !companyField.value) {
    companyField.value = employer?.company_name || profile.full_name || '';
  }
};

const collectRequiredSkillsArray = (form) => splitSkills(form?.elements?.required_skills?.value || '')
  .map(titleCase)
  .filter(Boolean);

const getCurrentPublishedJobStatus = () => document.querySelector('[data-employer-jobs]')?.dataset.currentJobStatus || 'active';

const renderEmployerJobs = (jobs = [], status = getCurrentPublishedJobStatus()) => {
  const target = document.querySelector('[data-employer-jobs]');
  const empty = document.querySelector('[data-employer-jobs-empty]');
  if (!target) return;

  target.dataset.currentJobStatus = status;
  document.querySelectorAll('[data-job-status-tab]').forEach((button) => {
    button.classList.toggle('is-active', button.dataset.jobStatusTab === status);
  });

  const filteredJobs = jobs.filter((job) => normalize(job.status || 'active') === status);
  target.innerHTML = filteredJobs.map((job) => {
    const archived = normalize(job.status || 'active') === 'inactive';
    const expired = isJobExpired(job);
    const deadline = job.last_date ? new Date(job.last_date).toLocaleDateString() : 'Not set';
    const skillTags = splitSkills(job.required_skills).slice(0, 4);
    return `
      <article class="job-card published-job-card compact-job-item employer-compact-job ${archived ? 'is-archived' : ''}">
        <div class="compact-job-left">
          <div class="compact-job-logo">${getInitials(job.company_name || 'MX')}</div>
          <div class="compact-job-content">
            <h3>${job.job_title || 'Open Role'}</h3>
            <p>${job.company_name || 'MX Partner Employer'} • ${job.job_location || 'Location not set'}</p>
            <div class="compact-job-meta">
              <span>${job.employment_type || 'Employment not set'}</span>
              <span>•</span>
              <span>${job.job_type || 'Type not set'}</span>
              <span>•</span>
              <span>${formatSalaryRange(job)}</span>
              <span>•</span>
              <span>Deadline: ${deadline}</span>
            </div>
            <div class="compact-job-skills">
              <span>${job.category || 'Category'}</span>
              <span>${job.job_level || 'Level not set'}</span>
              ${skillTags.map((skill) => `<span>${titleCase(skill)}</span>`).join('')}
              ${expired ? '<span class="compact-expired-tag">Expired</span>' : ''}
            </div>
          </div>
        </div>
        <div class="compact-job-actions">
          <span class="compact-status-text">${archived ? 'Archived' : 'Active'}</span>
          <span class="compact-applicant-count">Applicants live</span>
          <a class="compact-green-btn" href="employer-dashboard.html?tab=matched-candidates">View Candidates</a>
          <button class="compact-link-btn" type="button" data-edit-job="${job.id}">Edit</button>
          <button class="${archived ? 'compact-primary-btn' : 'compact-secondary-outline-btn'}" type="button" data-toggle-job-status="${job.id}" data-next-status="${archived ? 'active' : 'inactive'}">${archived ? 'Mark Active' : 'Inactive'}</button>
        </div>
      </article>
    `;
  }).join('');

  if (empty) {
    empty.hidden = filteredJobs.length > 0;
    empty.textContent = status === 'active' ? 'No active jobs found.' : 'No archived jobs found.';
  }
};

const fillJobEditForm = (job = {}) => {
  const form = document.querySelector('[data-platform-form="job-edit"]');
  if (!form) return;
  form.elements.job_id.value = job.id || '';
  form.elements.job_title.value = job.job_title || '';
  form.elements.job_location.value = job.job_location || '';
  form.elements.job_type.value = job.job_type || 'On-site';
  form.elements.job_level.value = job.job_level || 'Entry Level';
  form.elements.employment_type.value = job.employment_type || 'Full Time';
  form.elements.last_date.value = job.last_date || '';
  form.elements.description.value = job.description || '';
  form.elements.requirements.value = job.requirements || '';
  form.elements.required_skills.value = Array.isArray(job.required_skills_array) && job.required_skills_array.length ? job.required_skills_array.map(titleCase).join(', ') : job.required_skills || '';
  setSkillInputFromCategory({
    value: job.category || '',
    dataset: {
      roleSkillInput: 'edit-job-skills',
      roleSkillTarget: 'edit-job-skill-suggestions',
    },
  });
  form.elements.salary_min.value = job.salary_min || '';
  form.elements.salary_max.value = job.salary_max || '';
  form.elements.salary_hidden.checked = Boolean(job.salary_hidden);
  form.elements.benefits.value = job.benefits || '';
};

const openJobEditModal = (job = {}) => {
  const modal = document.getElementById('job-edit-modal');
  if (!modal) return;
  fillJobEditForm(job);
  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
};

const closeJobEditModal = () => {
  const modal = document.getElementById('job-edit-modal');
  if (!modal) return;
  modal.classList.remove('is-open');
  modal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');
};
const findApplicationForCandidateJob = (applications = [], candidateId, jobId = '') => applications.find((item) => {
  const candidateMatch = item.candidate_id === candidateId || item.candidate_user_id === candidateId;
  const jobMatch = jobId ? item.job_id === jobId : true;
  return candidateMatch && jobMatch;
});

const populateRecruiterJobSelect = (jobs = []) => {
  const select = document.querySelector('[data-recruiter-job-select]');
  if (!select) return;
  const activeJobs = jobs.filter((job) => !isJobInactive(job));
  const currentValue = select.value;
  select.innerHTML = activeJobs.length
    ? activeJobs.map((job) => `<option value="${job.id}">${job.job_title || 'Open Role'} - ${job.company_name || 'MX Venture Lab'}</option>`).join('')
    : '<option value="">No active jobs</option>';
  select.value = activeJobs.some((job) => job.id === currentValue) ? currentValue : (activeJobs[0]?.id || '');
};

const renderMatchedSkillTags = (matchedSkills = [], requiredSkills = []) => {
  const visibleMatched = matchedSkills.slice(0, 5);
  const missingSkills = requiredSkills.filter((skill) => !matchedSkills.includes(skill)).slice(0, 4);
  return `
    <div class="recruiter-skill-tags" aria-label="Candidate match skills">
      ${visibleMatched.length ? visibleMatched.map((skill) => `<span class="is-matched">${titleCase(skill)}</span>`).join('') : '<span>No direct skill overlap yet</span>'}
      ${missingSkills.map((skill) => `<span class="is-missing">${titleCase(skill)}</span>`).join('')}
    </div>
  `;
};

const renderRecruiterCandidateRow = ({ candidate, match, application }) => {
  const job = match.job;
  const isShortlisted = application?.status === 'Shortlisted';
  const isInvited = application?.status === 'Invited';
  const avatar = candidate.photo_url ? `<img src="${candidate.photo_url}" alt="${candidate.full_name || 'Candidate'} profile photo" />` : `<span>${getInitials(candidate.full_name || candidate.email)}</span>`;
  const matchedText = match.matchedSkills?.length
    ? `Matched on: ${match.matchedSkills.map(titleCase).join(', ')}`
    : 'Matched through category, experience, and profile similarity';

  return `
    <article class="recruiter-candidate-row ${isShortlisted ? 'is-shortlisted' : ''}">
      <div class="recruiter-candidate-main">
        <div class="candidate-card-avatar">${avatar}</div>
        <div class="recruiter-candidate-copy">
          <div class="recruiter-candidate-title">
            <h3>${candidate.full_name || 'Candidate'}</h3>
            <span class="match-score-badge ${getMatchScoreClass(match.score)}">${match.score}% match</span>
          </div>
          <p>${candidate.career_level || 'Career level not set'} | ${candidate.category || 'Category not set'}</p>
          <p class="field-hint">${matchedText}</p>
          ${renderMatchedSkillTags(match.matchedSkills, match.requiredSkills)}
        </div>
      </div>
      <div class="recruiter-candidate-actions">
        <span class="semantic-score">AI similarity ${match.semanticScore}%</span>
        <button class="btn secondary" type="button" data-view-candidate="${candidate.user_id}" data-job-id="${job.id}" data-unlocked="${isShortlisted}">View Profile</button>
        <button class="btn secondary" type="button" data-shortlist-candidate="${candidate.user_id}" data-job-id="${job.id}" data-application-status="Invited" ${isInvited || isShortlisted ? 'disabled' : ''}>${isInvited ? 'Invited' : 'Invite'}</button>
        <button class="btn primary" type="button" data-shortlist-candidate="${candidate.user_id}" data-job-id="${job.id}" data-application-status="Shortlisted" ${isShortlisted ? 'disabled' : ''}>${isShortlisted ? 'Shortlisted' : 'Shortlist'}</button>
      </div>
    </article>
  `;
};

const renderEmployerCandidateCards = (candidates, jobs = [], applications = [], targetSelector = '[data-candidate-list]', limit = 0) => {
  const target = document.querySelector(targetSelector);
  const empty = document.querySelector('[data-candidate-empty]');
  if (!target) return;
  const search = normalize(document.querySelector('[data-employer-candidate-search]')?.value);
  const selectedCategory = document.querySelector('[data-candidate-role-filter]')?.value || 'all';
  const selectedJobId = document.querySelector('[data-recruiter-job-select]')?.value || '';
  const activeJobs = jobs.filter((job) => !isJobInactive(job));
  const perJobLimit = limit || 12;

  if (limit > 0) {
    const matched = candidates
      .map((candidate) => ({ candidate, match: getBestAiJobMatch(candidate, activeJobs) }))
      .filter(({ candidate, match }) => {
        const haystack = normalize(`${candidate.full_name} ${candidate.skills} ${candidate.location} ${candidate.category} ${candidate.career_level}`);
        const searchMatch = !search || haystack.includes(search);
        const categoryMatch = selectedCategory === 'all' || normalize(candidate.category) === normalize(selectedCategory) || normalize(match?.job?.category) === normalize(selectedCategory);
        return Boolean(match) && match.score > 30 && searchMatch && categoryMatch;
      })
      .sort((a, b) => b.match.score - a.match.score)
      .slice(0, limit);

    target.innerHTML = matched.map(({ candidate, match }) => {
      const job = match.job;
      const application = findApplicationForCandidateJob(applications, candidate.user_id, job.id);
      const isShortlisted = application?.status === 'Shortlisted';
      const avatar = candidate.photo_url ? `<img src="${candidate.photo_url}" alt="${candidate.full_name || 'Candidate'} profile photo" />` : `<span>${getInitials(candidate.full_name || candidate.email)}</span>`;
      return `
        <article class="candidate-list-card dashboard-match-card ${isShortlisted ? 'is-shortlisted' : ''}">
          <div class="candidate-list-top">
            <div class="candidate-card-avatar">${avatar}</div>
            <div>
              <h3>${candidate.full_name || 'Candidate'}</h3>
              <p>${candidate.career_level || 'Career level not set'} | ${candidate.category || 'Category not set'}</p>
            </div>
            <span class="match-score-badge ${getMatchScoreClass(match.score)}">${match.score}% match</span>
          </div>
      <p><strong>Matched for:</strong> ${job.job_title || 'Open Role'}</p>
          <p><strong>Matched on:</strong> ${match.matchedSkills?.length ? match.matchedSkills.map(titleCase).join(', ') : 'AI profile similarity'}</p>
          <p><strong>Experience:</strong> ${candidate.experience || 'Not provided'}</p>
          <div class="candidate-list-actions">
            <button class="btn secondary" type="button" data-view-candidate="${candidate.user_id}" data-job-id="${job.id}" data-unlocked="${isShortlisted}">View Profile</button>
            <button class="btn secondary" type="button" data-shortlist-candidate="${candidate.user_id}" data-job-id="${job.id}" data-application-status="Invited" ${application?.status === 'Invited' || isShortlisted ? 'disabled' : ''}>${application?.status === 'Invited' ? 'Invited' : 'Invite'}</button>
            <button class="btn primary" type="button" data-shortlist-candidate="${candidate.user_id}" data-job-id="${job.id}" data-application-status="Shortlisted" ${isShortlisted ? 'disabled' : ''}>${isShortlisted ? 'Shortlisted' : 'Shortlist'}</button>
          </div>
        </article>
      `;
    }).join('');
    if (empty) empty.hidden = matched.length > 0;
    return;
  }

  const selectedJobs = selectedJobId
    ? activeJobs.filter((job) => job.id === selectedJobId)
    : activeJobs.slice(0, 1);

  const groups = selectedJobs.map((job) => {
    const matches = candidates
      .map((candidate) => ({ candidate, match: calculateAiCandidateJobMatch(candidate, job) }))
      .filter(({ candidate, match }) => {
        const haystack = normalize(`${candidate.full_name} ${candidate.skills} ${candidate.location} ${candidate.category} ${candidate.career_level}`);
        const searchMatch = !search || haystack.includes(search);
        const categoryMatch = selectedCategory === 'all' || normalize(candidate.category) === normalize(selectedCategory) || normalize(job.category) === normalize(selectedCategory);
        return match.score > 30 && searchMatch && categoryMatch;
      })
      .sort((a, b) => b.match.score - a.match.score)
      .slice(0, perJobLimit);
    return { job, matches };
  }).filter((group) => group.matches.length);

  target.innerHTML = groups.map(({ job, matches }) => `
    <section class="job-match-group">
      <div class="job-match-group-head">
        <div>
          <span class="plan-badge">${matches.length} matched ${matches.length === 1 ? 'candidate' : 'candidates'}</span>
          <h3>${job.job_title || 'Open Role'}</h3>
          <p>${job.category || 'Category not set'} | ${job.job_level || 'Level not set'} | ${job.job_location || 'Location not set'}</p>
        </div>
      </div>
      <div class="recruiter-candidate-list">
        ${matches.map(({ candidate, match }) => renderRecruiterCandidateRow({
          candidate,
          match,
          application: findApplicationForCandidateJob(applications, candidate.user_id, job.id),
        })).join('')}
      </div>
    </section>
  `).join('');
  if (empty) {
    empty.hidden = groups.length > 0;
    empty.textContent = activeJobs.length ? 'No candidates matched above 30% for the selected filters.' : 'Post an active job to see candidate matches.';
  }
};

const fetchEmployerApplications = async (employerUserId) => {
  if (!employerUserId) return [];
  const supabase = platformClient();
  const { data, error } = await supabase
    .from('applications')
    .select('id,candidate_id,candidate_user_id,employer_user_id,job_id,job_role,status,cv_url,created_at')
    .eq('employer_user_id', employerUserId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
};

const renderEmployerApplications = (applications, candidates, jobs = [], targetSelector = '[data-employer-applications]', onlyShortlisted = false) => {
  const target = document.querySelector(targetSelector);
  const empty = document.querySelector(onlyShortlisted ? '[data-shortlisted-empty]' : '[data-employer-applications-empty]');
  if (!target) return;
  const jobMap = new Map(jobs.map((job) => [job.id, job]));
  const filtered = onlyShortlisted ? applications.filter((item) => item.status === 'Shortlisted') : applications;

  target.innerHTML = filtered.map((application) => {
    const candidate = candidates.find((item) => item.user_id === application.candidate_id || item.user_id === application.candidate_user_id) || {};
    const job = jobMap.get(application.job_id) || {};
    const unlocked = application.status === 'Shortlisted';
    return `
      <article class="candidate-job-card ${unlocked ? 'is-shortlisted' : ''}">
        <div class="candidate-list-top">
          <div>
            <h3>${candidate.full_name || 'Candidate'}</h3>
            <p>${job.job_title || application.job_role || candidate.category || 'Application'}</p>
          </div>
          <span class="status-pill status-qualified">${application.status || 'Applied'}</span>
        </div>
        <p><strong>Applied Date:</strong> ${new Date(application.created_at).toLocaleDateString()}</p>
        <p><strong>Category:</strong> ${job.category || candidate.category || 'Not set'}</p>
        <p><strong>Required Level:</strong> ${job.experience_level || 'Any level'}</p>
        ${unlocked ? `<p><strong>Unlocked:</strong> Contact and salary are available in the candidate profile.</p>` : '<p class="field-hint">Phone, email, and salary unlock after shortlisting.</p>'}
        <div class="candidate-list-actions">
          <button class="btn secondary" type="button" data-view-candidate="${candidate.user_id || ''}" data-job-id="${job.id || ''}" data-unlocked="${unlocked}">View Candidate</button>
          ${application.cv_url ? `<a class="btn secondary" href="${application.cv_url}" target="_blank" rel="noreferrer">View CV</a>` : ''}
          <button class="btn primary" type="button" data-shortlist-application="${application.id}" data-candidate-id="${candidate.user_id || ''}">${unlocked ? 'Shortlisted' : 'Shortlist'}</button>
        </div>
      </article>
    `;
  }).join('');
  if (empty) empty.hidden = filtered.length > 0;
};

const fetchCandidatePrivateDetails = async (candidateUserId) => {
  if (!candidateUserId) return {};
  const supabase = platformClient();
  const { data, error } = await supabase
    .from('candidates')
    .select('email,phone_number,current_salary,expected_salary')
    .eq('user_id', candidateUserId)
    .maybeSingle();
  if (error) return {};
  return data || {};
};

const findApplicationForCandidate = (applications = [], candidateId = '', jobId = '') => applications.find((application) => {
  const candidateMatch = application.candidate_id === candidateId || application.candidate_user_id === candidateId;
  const jobMatch = jobId ? application.job_id === jobId : true;
  return candidateMatch && jobMatch;
});

const renderEmployerAtsPreview = (candidate = {}) => {
  const skills = uniqueSkills([
    ...(Array.isArray(candidate.skills_array) ? candidate.skills_array : splitSkills(candidate.skills || '').map(titleCase)),
    ...splitSkills(candidate.other_skills || '').map(titleCase),
  ]);
  return `
    <article class="ats-cv cv-document employer-ats-preview">
      <header>
        <h2>${candidate.full_name || candidate.name || 'Candidate'}</h2>
        <p>${[candidate.category, candidate.location].filter(Boolean).join(' | ')}</p>
      </header>
      <section><h3>SUMMARY</h3><p>${candidate.about || 'No summary added.'}</p></section>
      <section><h3>SKILLS</h3><p>${skills.join(', ') || 'No skills added.'}</p></section>
      <section><h3>EXPERIENCE</h3><p>${formatCandidateEntries(candidate.experience_json, candidate.experience)}</p></section>
      <section><h3>EDUCATION</h3><p>${formatCandidateEntries(candidate.education_json, candidate.education)}</p></section>
    </article>
  `;
};

const openEmployerCandidateModal = async (candidate, unlocked = false, application = null) => {
  const modal = document.getElementById('employer-candidate-modal');
  const content = document.querySelector('[data-employer-candidate-modal]');
  if (!modal || !content || !candidate) return;
  const privateDetails = unlocked ? await fetchCandidatePrivateDetails(candidate.user_id) : {};
  const viewCandidate = { ...candidate, ...privateDetails };
  const avatar = viewCandidate.photo_url ? `<img src="${viewCandidate.photo_url}" alt="${viewCandidate.full_name || 'Candidate'} profile photo" />` : `<span>${getInitials(viewCandidate.full_name || viewCandidate.email)}</span>`;
  const experience = Array.isArray(viewCandidate.experience_json) && viewCandidate.experience_json.length
    ? viewCandidate.experience_json.map((item) => `<li><strong>${item.role || ''}</strong> at ${item.company || ''}<br><span>${item.description || ''}</span></li>`).join('')
    : `<li>${viewCandidate.experience || 'No experience added.'}</li>`;
  const education = Array.isArray(viewCandidate.education_json) && viewCandidate.education_json.length
    ? viewCandidate.education_json.map((item) => `<li>${item.degree || ''} - ${item.institution || ''} ${item.year ? `(${item.year})` : ''}</li>`).join('')
    : `<li>${viewCandidate.education || 'No education added.'}</li>`;
  const certifications = Array.isArray(viewCandidate.certifications) && viewCandidate.certifications.length
    ? viewCandidate.certifications.map((item) => `<li>${item.certificate_name || ''} - ${item.organization || ''} ${item.year ? `(${item.year})` : ''}</li>`).join('')
    : '<li>No certifications added.</li>';

  content.innerHTML = `
    <div class="modal-profile-head">
      <div class="candidate-card-avatar large-avatar">${avatar}</div>
      <div>
        <p class="eyebrow">Candidate Profile</p>
        <h2 id="modal-candidate-name">${viewCandidate.full_name || 'Candidate'}</h2>
        <p>${viewCandidate.category || 'Category not set'} | ${viewCandidate.career_level || 'Career level not set'}</p>
      </div>
    </div>
    <div class="report-block"><h3>About</h3><p>${viewCandidate.about || 'No summary added.'}</p></div>
    <div class="report-block"><h3>Skills</h3><p>${viewCandidate.skills || 'No skills added.'}</p></div>
    <div class="report-block"><h3>Experience</h3><ul class="modal-list">${experience}</ul></div>
    <div class="report-block"><h3>Education</h3><ul class="modal-list">${education}</ul></div>
    <div class="report-block"><h3>Certifications</h3><ul class="modal-list">${certifications}</ul></div>
    <div class="report-block ${unlocked ? 'report-recommendation' : ''}">
      <h3>${unlocked ? 'Unlocked Contact & Salary' : 'Locked Details'}</h3>
      ${unlocked ? `<p>Email: ${viewCandidate.email || 'Not provided'}<br>Phone: ${viewCandidate.phone_number || 'Not provided'}<br>Current Salary: ${viewCandidate.current_salary || 'Not provided'}<br>Expected Salary: ${viewCandidate.expected_salary || 'Not provided'}</p>` : '<p>Shortlist this candidate to unlock salary and full contact details.</p>'}
    </div>
    <div class="report-block">
      <h3>ATS CV</h3>
      <p class="field-hint">Read-only employer view. Candidate CV controls are hidden.</p>
      ${application?.cv_url ? `<a class="btn secondary compact-btn" href="${application.cv_url}" target="_blank" rel="noreferrer">View / Download ATS CV</a>` : renderEmployerAtsPreview(viewCandidate)}
    </div>
  `;
  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
};

const closeEmployerCandidateModal = () => {
  const modal = document.getElementById('employer-candidate-modal');
  if (!modal) return;
  modal.classList.remove('is-open');
  modal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');
};

const createOrShortlistApplication = async ({ candidateId, job, applications = [], status = 'Shortlisted' }) => {
  if (!candidateId || !job?.id) throw new Error('Select a valid candidate and job first.');
  const supabase = platformClient();
  const existingApplication = findApplicationForCandidateJob(applications, candidateId, job.id);
  if (existingApplication) {
    const { error } = await supabase.from('applications').update({ status }).eq('id', existingApplication.id);
    if (error) throw error;
    return;
  }

  const { error } = await supabase.from('applications').insert({
    candidate_id: candidateId,
    candidate_user_id: candidateId,
    employer_id: null,
    employer_user_id: job.employer_id,
    job_id: job.id,
    job_role: job.job_title,
    status,
  });
  if (error) throw error;
};

const initEmployerDashboard = async () => {
  if (document.body.dataset.dashboardRole !== 'employer') return;
  const context = await requireDashboardSession('employer');
  if (!context) return;

  initEmployerPortalTabs();
  initRoleSelectors();

  const form = document.querySelector('[data-platform-form="job-post"]');
  const employerProfileForm = document.querySelector('[data-platform-form="employer-profile"]');
  let employer = await fetchEmployerProfile(context.session.user.id);
  let jobs = [];
  let candidates = [];
  let applications = [];

  const refreshEmployerDashboard = async () => {
    employer = await fetchEmployerProfile(context.session.user.id);
    jobs = await fetchJobs({ employerId: context.session.user.id });
    candidates = await fetchCandidates();
    applications = await fetchEmployerApplications(context.session.user.id);
    const matchedCandidateCount = candidates.filter((candidate) => getBestAiJobMatch(candidate, jobs)).length;

    renderEmployerProfile(employer, context.session);
    fillEmployerProfileForm(employer, context.session);
    fillJobPostDefaults(employer, context.profile);
    setEmployerProfileMode(employer ? 'view' : 'edit');
    renderEmployerJobs(jobs, getCurrentPublishedJobStatus());
    populateRecruiterJobSelect(jobs);
    renderEmployerCandidateCards(candidates, jobs, applications, '[data-candidate-list]');
    renderEmployerCandidateCards(candidates, jobs, applications, '[data-employer-dashboard-matches]', 4);
    renderEmployerApplications(applications, candidates, jobs, '[data-employer-applications]', false);
    renderEmployerApplications(applications, candidates, jobs, '[data-shortlisted-candidates]', true);

    document.querySelector('[data-stat-jobs]') && (document.querySelector('[data-stat-jobs]').textContent = jobs.length);
    document.querySelector('[data-stat-candidates]') && (document.querySelector('[data-stat-candidates]').textContent = matchedCandidateCount);
    document.querySelector('[data-stat-applications]') && (document.querySelector('[data-stat-applications]').textContent = applications.length);
    document.querySelector('[data-stat-shortlisted]') && (document.querySelector('[data-stat-shortlisted]').textContent = applications.filter((item) => item.status === 'Shortlisted').length);
  };

  try {
    await refreshEmployerDashboard();
  } catch (error) {
    const empty = document.querySelector('[data-candidate-empty]');
    if (empty) {
      empty.hidden = false;
      empty.textContent = error.message || 'Could not load employer dashboard.';
    }
  }

  document.querySelector('[data-employer-candidate-search]')?.addEventListener('input', () => {
    renderEmployerCandidateCards(candidates, jobs, applications, '[data-candidate-list]');
  });
  document.querySelector('[data-candidate-role-filter]')?.addEventListener('change', () => {
    renderEmployerCandidateCards(candidates, jobs, applications, '[data-candidate-list]');
  });
  document.querySelector('[data-recruiter-job-select]')?.addEventListener('change', () => {
    renderEmployerCandidateCards(candidates, jobs, applications, '[data-candidate-list]');
  });
  document.querySelectorAll('[data-job-status-tab]').forEach((button) => {
    button.addEventListener('click', () => renderEmployerJobs(jobs, button.dataset.jobStatusTab));
  });
  document.querySelector('[data-edit-employer-profile]')?.addEventListener('click', () => {
    fillEmployerProfileForm(employer, context.session);
    setEmployerProfileMode('edit');
  });
  document.querySelector('[data-cancel-employer-profile]')?.addEventListener('click', () => {
    setEmployerProfileMode('view');
  });

  const handleCandidateActions = async (event) => {
    const viewButton = event.target.closest('[data-view-candidate]');
    const shortlistCandidateButton = event.target.closest('[data-shortlist-candidate]');
    const shortlistApplicationButton = event.target.closest('[data-shortlist-application]');

    if (viewButton) {
      const candidate = candidates.find((item) => item.user_id === viewButton.dataset.viewCandidate);
      const application = findApplicationForCandidate(applications, viewButton.dataset.viewCandidate, viewButton.dataset.jobId);
      await openEmployerCandidateModal(candidate, viewButton.dataset.unlocked === 'true', application);
      return;
    }

    if (shortlistCandidateButton) {
      const candidateId = shortlistCandidateButton.dataset.shortlistCandidate;
      const candidate = candidates.find((item) => item.user_id === candidateId);
      const job = jobs.find((item) => item.id === shortlistCandidateButton.dataset.jobId) || getBestAiJobMatch(candidate, jobs)?.job;
      const status = shortlistCandidateButton.dataset.applicationStatus || 'Shortlisted';
      shortlistCandidateButton.disabled = true;
      try {
        await createOrShortlistApplication({ candidateId, job, applications, status });
        await refreshEmployerDashboard();
      } catch (error) {
        shortlistCandidateButton.textContent = error.message || 'Failed';
      }
      return;
    }

    if (shortlistApplicationButton) {
      shortlistApplicationButton.disabled = true;
      try {
        const supabase = platformClient();
        const { error } = await supabase.from('applications').update({ status: 'Shortlisted' }).eq('id', shortlistApplicationButton.dataset.shortlistApplication);
        if (error) throw error;
        await refreshEmployerDashboard();
      } catch (error) {
        shortlistApplicationButton.textContent = error.message || 'Failed';
      }
    }
  };

  document.querySelector('[data-candidate-list]')?.addEventListener('click', handleCandidateActions);
  document.querySelector('[data-employer-dashboard-matches]')?.addEventListener('click', handleCandidateActions);
  document.querySelector('[data-employer-applications]')?.addEventListener('click', handleCandidateActions);
  document.querySelector('[data-shortlisted-candidates]')?.addEventListener('click', handleCandidateActions);
  document.querySelectorAll('[data-employer-modal-close]').forEach((button) => button.addEventListener('click', closeEmployerCandidateModal));
  document.querySelectorAll('[data-job-edit-close]').forEach((button) => button.addEventListener('click', closeJobEditModal));

  document.querySelector('[data-employer-jobs]')?.addEventListener('click', async (event) => {
    const editButton = event.target.closest('[data-edit-job]');
    const toggleButton = event.target.closest('[data-toggle-job-status]');

    if (editButton) {
      const job = jobs.find((item) => item.id === editButton.dataset.editJob);
      openJobEditModal(job);
      return;
    }

    if (toggleButton) {
      toggleButton.disabled = true;
      try {
        const supabase = platformClient();
        const { error } = await supabase
          .from('jobs')
          .update({ status: toggleButton.dataset.nextStatus })
          .eq('id', toggleButton.dataset.toggleJobStatus);
        if (error) throw error;
        await refreshEmployerDashboard();
      } catch (error) {
        toggleButton.textContent = error.message || 'Failed';
      }
    }
  });

  employerProfileForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!validatePlatformForm(employerProfileForm)) {
      setFeedback(employerProfileForm, 'Please complete the highlighted fields.', 'error');
      return;
    }

    const formData = new FormData(employerProfileForm);
    const payload = {
      user_id: context.session.user.id,
      company_name: formData.get('company_name'),
      contact_person: formData.get('contact_person'),
      email: context.session.user.email,
      official_email: context.session.user.email,
      phone: formData.get('phone'),
      contact_number: formData.get('phone'),
      location: formData.get('location'),
      industry: formData.get('industry'),
      company_size: formData.get('company_size'),
      about: formData.get('about'),
      monthly_needed_hiring: employer?.monthly_needed_hiring || 1,
      plan_interest: employer?.plan_interest || 'Starter',
      talent_categories_role_requirements: employer?.talent_categories_role_requirements || 'General hiring needs',
    };

    try {
      const supabase = platformClient();
      const response = employer?.id
        ? await supabase.from('employers').update(payload).eq('id', employer.id)
        : await supabase.from('employers').insert(payload).select('*').maybeSingle();
      if (response.error) {
        if (response.error.code === 'PGRST204' || response.error.message?.includes('schema cache')) {
          throw new Error('Database setup incomplete. Run the updated supabase-schema.sql so employer profile columns exist.');
        }
        throw response.error;
      }
      setFeedback(employerProfileForm, 'Employer profile saved successfully.');
      await upsertProfile({ id: context.session.user.id, email: context.session.user.email, fullName: payload.contact_person, role: 'employer' });
      await refreshEmployerDashboard();
      setEmployerProfileMode('view');
    } catch (error) {
      setFeedback(employerProfileForm, error.message || 'Could not save employer profile.', 'error');
    }
  });

  document.querySelector('[data-platform-form="job-edit"]')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const editForm = event.currentTarget;
    if (!validatePlatformForm(editForm)) {
      setFeedback(editForm, 'Please complete the highlighted fields.', 'error');
      return;
    }

    const formData = new FormData(editForm);
    const jobId = formData.get('job_id');
    const payload = {
      job_title: formData.get('job_title'),
      job_location: formData.get('job_location'),
      job_type: formData.get('job_type'),
      job_level: formData.get('job_level'),
      employment_type: formData.get('employment_type'),
      description: formData.get('description'),
      requirements: formData.get('requirements'),
      required_skills: formData.get('required_skills'),
      required_skills_array: collectRequiredSkillsArray(editForm),
      salary_min: formData.get('salary_min') ? Number(formData.get('salary_min')) : null,
      salary_max: formData.get('salary_max') ? Number(formData.get('salary_max')) : null,
      salary_hidden: formData.get('salary_hidden') === 'on',
      salary_range: formData.get('salary_hidden') === 'on' ? 'Hidden by employer' : '',
      benefits: formData.get('benefits'),
      last_date: formData.get('last_date'),
    };

    try {
      const supabase = platformClient();
      const { error } = await supabase
        .from('jobs')
        .update(payload)
        .eq('id', jobId)
        .eq('employer_id', context.session.user.id);
      if (error) throw error;
      setFeedback(editForm, 'Job updated successfully.');
      await refreshEmployerDashboard();
      closeJobEditModal();
    } catch (error) {
      setFeedback(editForm, error.message || 'Could not update job.', 'error');
    }
  });

  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!validatePlatformForm(form)) {
      setFeedback(form, 'Please complete the highlighted fields.', 'error');
      return;
    }

    const formData = new FormData(form);
    const payload = {
      employer_id: context.session.user.id,
      company_name: formData.get('company_name') || employer?.company_name || context.profile.full_name || 'MX Partner Employer',
      job_title: formData.get('job_title'),
      job_location: formData.get('job_location'),
      job_type: formData.get('job_type'),
      job_level: formData.get('job_level'),
      employment_type: formData.get('employment_type'),
      category: formData.get('category'),
      description: formData.get('description'),
    requirements: formData.get('requirements'),
    required_skills: formData.get('required_skills'),
    required_skills_array: collectRequiredSkillsArray(form),
    experience_level: '',
    salary_min: formData.get('salary_min') ? Number(formData.get('salary_min')) : null,
    salary_max: formData.get('salary_max') ? Number(formData.get('salary_max')) : null,
    salary_hidden: formData.get('salary_hidden') === 'on',
    salary_range: formData.get('salary_hidden') === 'on' ? 'Hidden by employer' : '',
    benefits: formData.get('benefits'),
    last_date: formData.get('last_date'),
    status: 'active',
  };

    try {
      const supabase = platformClient();
      const { error } = await supabase.from('jobs').insert(payload);
      if (error) {
        if (error.code === 'PGRST205' || error.message?.includes("public.jobs")) {
          throw new Error('Database setup incomplete. Run the updated supabase-schema.sql to create the jobs table.');
        }
        if (error.message?.includes('null value in column "role"')) {
          throw new Error('Database cleanup needed. Run: alter table public.jobs alter column role drop not null;');
        }
        throw error;
      }
      setFeedback(form, 'Job published successfully. Redirecting to published jobs...');
      form.reset();
      initRoleSelectors();
      await refreshEmployerDashboard();
      window.setTimeout(() => {
        window.location.href = 'employer-dashboard.html?tab=published-jobs';
      }, 1200);
    } catch (error) {
      setFeedback(form, error.message || 'Could not publish job.', 'error');
    }
  });
};

initAuthPage();
initLogout();
initRoleSelectors();
initPublicJobsPage();
initJobDetailsPage();
initCandidateDashboard();
initEmployerDashboard();
initAuthNav();










