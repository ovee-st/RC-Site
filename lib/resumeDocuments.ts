export type ResumeProfile = {
  name?: string | null;
  title?: string | null;
  email?: string | null;
  phone?: string | null;
  location?: string | null;
  about?: string | null;
  avatar?: string | null;
  skills?: string[] | string | null;
  experience?: unknown;
  education?: unknown;
  certifications?: unknown;
};

type ResumeItem = {
  title?: string;
  subtitle?: string;
  meta?: string;
  description?: string;
};

function escapeHtml(value?: string | number | null) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function normalizeSkills(skills: ResumeProfile["skills"]) {
  if (Array.isArray(skills)) return skills.map(String).map((skill) => skill.trim()).filter(Boolean);
  return String(skills || "")
    .split(",")
    .map((skill) => skill.trim())
    .filter(Boolean);
}

function normalizeItems(value: unknown): ResumeItem[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((item) => {
      if (typeof item === "string") return { title: item };
      const row = item as Record<string, unknown>;
      return {
        title: String(row.title || row.role || row.degree || row.name || row.company || "Item"),
        subtitle: String(row.subtitle || row.company || row.school || row.organization || ""),
        meta: String(row.meta || row.period || row.year || [row.start_date, row.end_date].filter(Boolean).join(" - ") || ""),
        description: String(row.description || row.details || "")
      };
    });
  }
  return String(value)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => ({ title: line }));
}

function renderAtsSection(title: string, content: string) {
  if (!content.trim()) return "";
  return `
    <section>
      <h2>${escapeHtml(title)}</h2>
      ${content}
    </section>
  `;
}

function renderItemList(items: ResumeItem[]) {
  if (!items.length) return "";
  return items
    .map((item) => `
      <div class="item">
        <h3>${escapeHtml(item.title)}</h3>
        ${item.subtitle ? `<p class="subtitle">${escapeHtml(item.subtitle)}</p>` : ""}
        ${item.meta ? `<p class="meta">${escapeHtml(item.meta)}</p>` : ""}
        ${item.description ? `<p>${escapeHtml(item.description)}</p>` : ""}
      </div>
    `)
    .join("");
}

export function getResumeFilename(name?: string | null) {
  const cleanName = String(name || "Candidate")
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9_-]/g, "");
  return `Resume_of_${cleanName || "Candidate"}`;
}

export function buildAtsResumeHtml(profile: ResumeProfile, email?: string | null) {
  const name = profile.name || "Candidate";
  const skills = normalizeSkills(profile.skills);
  const experience = normalizeItems(profile.experience);
  const education = normalizeItems(profile.education);
  const certifications = normalizeItems(profile.certifications);
  const contact = [email || profile.email, profile.phone, profile.location].filter(Boolean).map(escapeHtml).join(" | ");

  return `<!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <title>${escapeHtml(getResumeFilename(name))}</title>
      <style>
        @page { margin: 18mm; }
        * { box-sizing: border-box; }
        body { margin: 0; background: #fff; color: #111827; font-family: Arial, Helvetica, sans-serif; font-size: 11.5pt; line-height: 1.45; }
        main { max-width: 780px; margin: 0 auto; padding: 24px; }
        h1 { margin: 0; font-size: 25pt; line-height: 1.1; letter-spacing: -0.02em; }
        .title { margin-top: 5px; font-size: 12pt; font-weight: 700; color: #374151; }
        .contact { margin-top: 8px; color: #4b5563; }
        section { margin-top: 18px; padding-top: 12px; border-top: 1px solid #111827; }
        h2 { margin: 0 0 8px; font-size: 12pt; text-transform: uppercase; letter-spacing: 0.08em; }
        h3 { margin: 0; font-size: 11.5pt; }
        p { margin: 3px 0 0; }
        .item { margin-bottom: 10px; }
        .subtitle, .meta { color: #4b5563; }
        .skills { margin: 0; padding-left: 18px; columns: 2; }
        .skills li { margin-bottom: 3px; }
      </style>
    </head>
    <body>
      <main>
        <header>
          <h1>${escapeHtml(name)}</h1>
          ${profile.title ? `<div class="title">${escapeHtml(profile.title)}</div>` : ""}
          ${contact ? `<div class="contact">${contact}</div>` : ""}
        </header>
        ${renderAtsSection("Professional Summary", profile.about ? `<p>${escapeHtml(profile.about)}</p>` : "")}
        ${renderAtsSection("Core Skills", skills.length ? `<ul class="skills">${skills.map((skill) => `<li>${escapeHtml(skill)}</li>`).join("")}</ul>` : "")}
        ${renderAtsSection("Experience", renderItemList(experience))}
        ${renderAtsSection("Education", renderItemList(education))}
        ${renderAtsSection("Certifications", renderItemList(certifications))}
      </main>
    </body>
  </html>`;
}

export function buildCustomizedResumeHtml(profile: ResumeProfile, email?: string | null) {
  const name = profile.name || "Candidate";
  const skills = normalizeSkills(profile.skills);
  const experience = normalizeItems(profile.experience);
  const education = normalizeItems(profile.education);
  const certifications = normalizeItems(profile.certifications);
  const contact = [email || profile.email, profile.phone, profile.location].filter(Boolean);

  return `<!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <title>${escapeHtml(getResumeFilename(name))}</title>
      <style>
        @page { margin: 12mm; }
        * { box-sizing: border-box; }
        body { margin: 0; background: #eef2f7; color: #101828; font-family: Arial, Helvetica, sans-serif; line-height: 1.5; }
        .sheet { width: 794px; min-height: 1123px; margin: 0 auto; background: #fff; display: grid; grid-template-columns: 260px 1fr; box-shadow: 0 20px 60px rgba(15,23,42,.12); }
        aside { background: #0f172a; color: #fff; padding: 34px 26px; }
        main { padding: 34px 38px; }
        .avatar { height: 86px; width: 86px; border-radius: 24px; overflow: hidden; background: linear-gradient(135deg,#2563eb,#16a34a); display: grid; place-items: center; font-size: 26px; font-weight: 900; margin-bottom: 18px; }
        .avatar img { width: 100%; height: 100%; object-fit: cover; }
        h1 { margin: 0; font-size: 31px; line-height: 1.05; letter-spacing: -0.05em; }
        .role { margin-top: 8px; color: #2563eb; font-weight: 800; }
        h2 { margin: 28px 0 10px; font-size: 13px; letter-spacing: .12em; text-transform: uppercase; color: #2563eb; }
        aside h2 { color: #93c5fd; }
        p { margin: 0 0 8px; color: #475467; }
        aside p { color: #dbeafe; }
        .skill { display: inline-block; margin: 0 6px 8px 0; padding: 7px 10px; border-radius: 999px; background: rgba(37,99,235,.1); color: #1d4ed8; font-size: 12px; font-weight: 800; }
        aside .skill { background: rgba(255,255,255,.12); color: #fff; }
        .item { padding: 14px 0; border-bottom: 1px solid #e5e7eb; }
        .item h3 { margin: 0; font-size: 16px; }
        .meta, .subtitle { color: #667085; font-size: 13px; font-weight: 700; }
      </style>
    </head>
    <body>
      <div class="sheet">
        <aside>
          <div class="avatar">${profile.avatar ? `<img src="${escapeHtml(profile.avatar)}" alt="${escapeHtml(name)}" />` : escapeHtml(name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase())}</div>
          <h2>Contact</h2>
          ${contact.map((item) => `<p>${escapeHtml(String(item))}</p>`).join("") || "<p>Contact details available on request.</p>"}
          <h2>Core Skills</h2>
          <div>${skills.map((skill) => `<span class="skill">${escapeHtml(skill)}</span>`).join("") || "<p>No skills listed.</p>"}</div>
        </aside>
        <main>
          <h1>${escapeHtml(name)}</h1>
          ${profile.title ? `<div class="role">${escapeHtml(profile.title)}</div>` : ""}
          ${profile.about ? `<h2>Profile</h2><p>${escapeHtml(profile.about)}</p>` : ""}
          ${experience.length ? `<h2>Experience</h2>${renderItemList(experience)}` : ""}
          ${education.length ? `<h2>Education</h2>${renderItemList(education)}` : ""}
          ${certifications.length ? `<h2>Certifications</h2>${renderItemList(certifications)}` : ""}
        </main>
      </div>
    </body>
  </html>`;
}

export function openResumeDocument(html: string, filename: string) {
  if (typeof window === "undefined") return;
  const resumeWindow = window.open("", "_blank", "noopener,noreferrer");
  if (!resumeWindow) {
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${filename}.html`;
    link.click();
    URL.revokeObjectURL(url);
    return;
  }

  resumeWindow.document.open();
  resumeWindow.document.write(html);
  resumeWindow.document.close();
  resumeWindow.document.title = filename;
  resumeWindow.focus();
  setTimeout(() => resumeWindow.print(), 450);
}
