import React, { useMemo, useState } from 'react';
import '../styles/ResumeBuilderEnhanced.css';
import { fetchAtsScore, fetchResumeQuestions } from '../services/atsService';

const ResumeBuilderEnhanced = () => {
  const [resumeData, setResumeData] = useState({
    personalInfo: {
      fullName: 'Your Name',
      email: 'email@example.com',
      phone: '+1 234 567 8900',
      location: 'City, Country',
      portfolio: 'yourportfolio.com',
      linkedIn: 'linkedin.com/in/yourprofile',
      github: 'github.com/yourprofile',
      title: 'Full Stack Developer'
    },
    summary:
      'Dynamic Full Stack Developer with 3+ years of experience building scalable web applications.',
    experience: [
      {
        company: 'Tech Company Inc',
        position: 'Senior Developer',
        duration: 'Jan 2022 - Present',
        description: 'Led development of microservices architecture serving 100k+ users',
        achievements: [
          'Reduced API response time by 60%',
          'Mentored 3 junior developers',
          'Architected real-time notification system'
        ]
      }
    ],
    skills: ['React', 'Node.js', 'MongoDB', 'Docker', 'AWS', 'TypeScript'],
    projects: [
      {
        name: 'Interview Prep Platform',
        description: 'Full-stack application with AI-powered features for interview preparation',
        technologies: ['React', 'Node.js', 'MongoDB', 'OpenAI API'],
        impact: 'Used by 1000+ users for interview preparation'
      }
    ]
  });
  const [atsResult, setAtsResult] = useState(null);
  const [resumeQuestions, setResumeQuestions] = useState([]);
  const [atsLoading, setAtsLoading] = useState(false);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [atsError, setAtsError] = useState('');

  const [templateSelected, setTemplateSelected] = useState('modern');
  const [activeSection, setActiveSection] = useState('personal');
  const [jobDescription, setJobDescription] = useState('');

  const templates = [
    { id: 'modern', name: 'Modern', desc: 'Clean & Professional' },
    { id: 'classic', name: 'Classic', desc: 'Traditional Format' },
    { id: 'creative', name: 'Creative', desc: 'Bold & Unique' }
  ];

  const ensureUrl = (url = '') => {
    const value = url.trim();
    if (!value) return '';
    if (/^https?:\/\//i.test(value)) return value;
    return `https://${value}`;
  };

  const formatLinkText = (url = '') => {
    const clean = url.replace(/^https?:\/\//i, '');
    return clean.length > 30 ? `${clean.slice(0, 30)}...` : clean;
  };

  const atsReport = useMemo(() => {
    const resumeText = [
      resumeData.personalInfo.fullName,
      resumeData.personalInfo.title,
      resumeData.summary,
      resumeData.skills.join(' '),
      resumeData.experience.map((exp) => `${exp.position} ${exp.company} ${exp.description}`).join(' '),
      resumeData.projects.map((project) => `${project.name} ${project.description} ${project.technologies.join(' ')}`).join(' ')
    ]
      .join(' ')
      .toLowerCase();

    const jdTokens = (jobDescription.toLowerCase().match(/[a-z][a-z0-9+#.]{2,}/g) || [])
      .filter((token) => !['with', 'that', 'from', 'this', 'have', 'will', 'your', 'you', 'for', 'and', 'the'].includes(token));
    const jdKeywords = Array.from(new Set(jdTokens)).slice(0, 25);
    const matchedKeywords = jdKeywords.filter((keyword) => resumeText.includes(keyword));
    const missingKeywords = jdKeywords.filter((keyword) => !resumeText.includes(keyword));

    const completenessChecks = [
      Boolean(resumeData.personalInfo.fullName.trim()),
      Boolean(resumeData.personalInfo.email.trim()),
      Boolean(resumeData.summary.trim()),
      resumeData.skills.some((skill) => skill.trim().length > 1),
      resumeData.experience.some((exp) => exp.company.trim() && exp.position.trim()),
      resumeData.projects.some((project) => project.name.trim())
    ];

    const completenessScore = Math.round((completenessChecks.filter(Boolean).length / completenessChecks.length) * 35);
    const keywordScore = jdKeywords.length ? Math.round((matchedKeywords.length / jdKeywords.length) * 55) : 35;
    const linkScore = [resumeData.personalInfo.linkedIn, resumeData.personalInfo.github, resumeData.personalInfo.portfolio]
      .filter((item) => item.trim()).length * 3;
    const score = Math.min(100, completenessScore + keywordScore + linkScore);

    return {
      score,
      jdKeywords,
      matchedKeywords,
      missingKeywords: missingKeywords.slice(0, 10),
      completenessScore,
      keywordCoverage: jdKeywords.length ? Math.round((matchedKeywords.length / jdKeywords.length) * 100) : 100
    };
  }, [jobDescription, resumeData]);

  const updatePersonal = (field, value) => {
    setResumeData((prev) => ({
      ...prev,
      personalInfo: { ...prev.personalInfo, [field]: value }
    }));
  };

  const handleAddExperience = () => {
    setResumeData((prev) => ({
      ...prev,
      experience: [
        ...prev.experience,
        {
          company: 'Company',
          position: 'Position',
          duration: 'Jan 2024 - Present',
          description: '',
          achievements: []
        }
      ]
    }));
  };

  const handleAddSkill = () => {
    setResumeData((prev) => ({ ...prev, skills: [...prev.skills, 'New Skill'] }));
  };

  const handleDownloadPDF = () => {
    const html = `
      <html>
        <head>
          <title>${resumeData.personalInfo.fullName} - Resume</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #111; }
            h1 { margin: 0 0 6px; font-size: 30px; }
            h2 { margin: 0 0 12px; font-size: 18px; color: #3b4cca; }
            h3 { margin: 18px 0 8px; font-size: 16px; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
            p, li { font-size: 13px; line-height: 1.5; }
            .meta { margin-bottom: 12px; font-size: 13px; }
            .links a { margin-right: 12px; color: #2b57d9; text-decoration: none; }
          </style>
        </head>
        <body>
          <h1>${resumeData.personalInfo.fullName}</h1>
          <h2>${resumeData.personalInfo.title || ''}</h2>
          <div class="meta">${resumeData.personalInfo.email} | ${resumeData.personalInfo.phone} | ${resumeData.personalInfo.location}</div>
          <div class="links">
            ${resumeData.personalInfo.portfolio ? `<a href="${ensureUrl(resumeData.personalInfo.portfolio)}">Portfolio</a>` : ''}
            ${resumeData.personalInfo.linkedIn ? `<a href="${ensureUrl(resumeData.personalInfo.linkedIn)}">LinkedIn</a>` : ''}
            ${resumeData.personalInfo.github ? `<a href="${ensureUrl(resumeData.personalInfo.github)}">GitHub</a>` : ''}
          </div>
          <h3>Professional Summary</h3>
          <p>${resumeData.summary}</p>
          <h3>Experience</h3>
          ${resumeData.experience
            .map(
              (exp) => `
              <p><strong>${exp.position}</strong> - ${exp.company} (${exp.duration})</p>
              <p>${exp.description || ''}</p>
              <ul>${(exp.achievements || []).map((a) => `<li>${a}</li>`).join('')}</ul>
            `
            )
            .join('')}
          <h3>Skills</h3>
          <p>${resumeData.skills.join(', ')}</p>
          <h3>Projects</h3>
          ${resumeData.projects
            .map(
              (project) => `
              <p><strong>${project.name}</strong></p>
              <p>${project.description}</p>
              <p><strong>Tech:</strong> ${(project.technologies || []).join(', ')}</p>
              <p><strong>Impact:</strong> ${project.impact || ''}</p>
            `
            )
            .join('')}
        </body>
      </html>
    `;

    const w = window.open('', '_blank', 'width=1000,height=700');
    if (!w) return;
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 250);
  };

  const buildResumeText = () =>
    [
      resumeData.personalInfo.fullName,
      resumeData.personalInfo.title,
      resumeData.summary,
      resumeData.skills.join(' '),
      resumeData.experience.map((exp) => `${exp.position} ${exp.company} ${exp.description} ${(exp.achievements || []).join(' ')}`).join(' '),
      resumeData.projects.map((project) => `${project.name} ${project.description} ${(project.technologies || []).join(' ')} ${project.impact || ''}`).join(' ')
    ].join('\n');

  const handleAtsScore = async () => {
    setAtsLoading(true);
    setAtsError('');
    try {
      const text = buildResumeText();
      const res = await fetchAtsScore({ resumeText: text, role: resumeData.personalInfo.title });
      setAtsResult(res);
    } catch (err) {
      setAtsError('ATS scoring failed. Check API key.');
    } finally {
      setAtsLoading(false);
    }
  };

  const handleGenerateQuestions = async () => {
    setQuestionsLoading(true);
    try {
      const text = buildResumeText();
      const res = await fetchResumeQuestions({ resumeText: text, role: resumeData.personalInfo.title });
      setResumeQuestions(res.questions || []);
    } catch (err) {
      setResumeQuestions([]);
    } finally {
      setQuestionsLoading(false);
    }
  };

  const handleExportJSON = () => {
    const dataStr = JSON.stringify(resumeData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'resume.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const ResumePreview = () => (
    <div className={`resume-preview resume-${templateSelected}`}>
      <div className="resume-header">
        <h1>{resumeData.personalInfo.fullName}</h1>
        <p className="resume-title">{resumeData.personalInfo.title}</p>
        <div className="resume-contact">
          <span>Email {resumeData.personalInfo.email}</span>
          <span>Phone {resumeData.personalInfo.phone}</span>
          <span>Location {resumeData.personalInfo.location}</span>
        </div>
        <div className="resume-links">
          {resumeData.personalInfo.portfolio && (
            <a href={ensureUrl(resumeData.personalInfo.portfolio)} target="_blank" rel="noreferrer">
              Portfolio: {formatLinkText(resumeData.personalInfo.portfolio)}
            </a>
          )}
          {resumeData.personalInfo.linkedIn && (
            <a href={ensureUrl(resumeData.personalInfo.linkedIn)} target="_blank" rel="noreferrer">
              LinkedIn: {formatLinkText(resumeData.personalInfo.linkedIn)}
            </a>
          )}
          {resumeData.personalInfo.github && (
            <a href={ensureUrl(resumeData.personalInfo.github)} target="_blank" rel="noreferrer">
              GitHub: {formatLinkText(resumeData.personalInfo.github)}
            </a>
          )}
        </div>
      </div>

      <div className="resume-section">
        <h3>Professional Summary</h3>
        <p>{resumeData.summary}</p>
      </div>

      <div className="resume-section">
        <h3>Experience</h3>
        {resumeData.experience.map((exp, idx) => (
          <div key={idx} className="experience-item">
            <div className="exp-header">
              <h4>{exp.position}</h4>
              <span className="exp-duration">{exp.duration}</span>
            </div>
            <p className="exp-company">{exp.company}</p>
            <p>{exp.description}</p>
            {(exp.achievements || []).length > 0 && (
              <ul>
                {exp.achievements.map((achievement, aidx) => (
                  <li key={aidx}>{achievement}</li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>

      <div className="resume-section">
        <h3>Technical Skills</h3>
        <div className="skills-grid">
          {resumeData.skills.map((skill, idx) => (
            <span key={idx} className="skill-badge">
              {skill}
            </span>
          ))}
        </div>
      </div>

      <div className="resume-section">
        <h3>Projects</h3>
        {resumeData.projects.map((project, idx) => (
          <div key={idx} className="project-item">
            <h4>{project.name}</h4>
            <p>{project.description}</p>
            <p className="project-tech"><strong>Tech:</strong> {project.technologies.join(', ')}</p>
            <p className="project-impact"><strong>Impact:</strong> {project.impact}</p>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="resume-builder-enhanced">
      <div className="rb-header">
        <h1>AI-Powered Resume Builder</h1>
        <p>Create a professional resume in minutes with AI suggestions</p>
      </div>

      <div className="template-selector-enhanced">
        {templates.map((template) => (
          <button
            key={template.id}
            className={`template-card ${templateSelected === template.id ? 'active' : ''}`}
            onClick={() => setTemplateSelected(template.id)}
          >
            <div className="template-name">{template.name}</div>
            <div className="template-desc">{template.desc}</div>
          </button>
        ))}
      </div>

      <div className="rb-content">
        <div className="rb-sidebar">
          <button className={`rb-nav-btn ${activeSection === 'personal' ? 'active' : ''}`} onClick={() => setActiveSection('personal')}>Personal</button>
          <button className={`rb-nav-btn ${activeSection === 'summary' ? 'active' : ''}`} onClick={() => setActiveSection('summary')}>Summary</button>
          <button className={`rb-nav-btn ${activeSection === 'experience' ? 'active' : ''}`} onClick={() => setActiveSection('experience')}>Experience</button>
          <button className={`rb-nav-btn ${activeSection === 'skills' ? 'active' : ''}`} onClick={() => setActiveSection('skills')}>Skills</button>
          <button className={`rb-nav-btn ${activeSection === 'projects' ? 'active' : ''}`} onClick={() => setActiveSection('projects')}>Projects</button>
          <button className={`rb-nav-btn ${activeSection === 'ats' ? 'active' : ''}`} onClick={() => setActiveSection('ats')}>ATS Match</button>
        </div>

        <div className="rb-editor">
          {activeSection === 'personal' && (
            <div className="rb-section">
              <h2>Personal Information</h2>
              <div className="form-group">
                <label>Full Name *</label>
                <input type="text" value={resumeData.personalInfo.fullName} onChange={(e) => updatePersonal('fullName', e.target.value)} className="rb-input" />
              </div>
              <div className="form-group">
                <label>Professional Title</label>
                <input type="text" value={resumeData.personalInfo.title} onChange={(e) => updatePersonal('title', e.target.value)} className="rb-input" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Email *</label>
                  <input type="email" value={resumeData.personalInfo.email} onChange={(e) => updatePersonal('email', e.target.value)} className="rb-input" />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input type="tel" value={resumeData.personalInfo.phone} onChange={(e) => updatePersonal('phone', e.target.value)} className="rb-input" />
                </div>
              </div>
              <div className="form-group">
                <label>Location</label>
                <input type="text" value={resumeData.personalInfo.location} onChange={(e) => updatePersonal('location', e.target.value)} className="rb-input" />
              </div>
              <div className="form-group">
                <label>Portfolio URL</label>
                <input type="url" value={resumeData.personalInfo.portfolio} onChange={(e) => updatePersonal('portfolio', e.target.value)} className="rb-input" placeholder="https://yourportfolio.com" />
              </div>
              <div className="form-group">
                <label>LinkedIn Profile</label>
                <input type="url" value={resumeData.personalInfo.linkedIn} onChange={(e) => updatePersonal('linkedIn', e.target.value)} className="rb-input" placeholder="https://linkedin.com/in/yourprofile" />
              </div>
              <div className="form-group">
                <label>GitHub Profile</label>
                <input type="url" value={resumeData.personalInfo.github} onChange={(e) => updatePersonal('github', e.target.value)} className="rb-input" placeholder="https://github.com/yourprofile" />
              </div>
            </div>
          )}

          {activeSection === 'summary' && (
            <div className="rb-section">
              <h2>Professional Summary</h2>
              <textarea
                value={resumeData.summary}
                onChange={(e) => setResumeData((prev) => ({ ...prev, summary: e.target.value }))}
                className="rb-textarea"
                rows={8}
              />
            </div>
          )}

          {activeSection === 'experience' && (
            <div className="rb-section">
              <h2>Work Experience</h2>
              {resumeData.experience.map((exp, idx) => (
                <div key={idx} className="exp-card">
                  <input
                    type="text"
                    value={exp.company}
                    onChange={(e) => {
                      const updated = [...resumeData.experience];
                      updated[idx].company = e.target.value;
                      setResumeData((prev) => ({ ...prev, experience: updated }));
                    }}
                    placeholder="Company Name"
                    className="rb-input"
                  />
                  <input
                    type="text"
                    value={exp.position}
                    onChange={(e) => {
                      const updated = [...resumeData.experience];
                      updated[idx].position = e.target.value;
                      setResumeData((prev) => ({ ...prev, experience: updated }));
                    }}
                    placeholder="Job Title"
                    className="rb-input"
                  />
                </div>
              ))}
              <button className="rb-btn-add" onClick={handleAddExperience}>+ Add Experience</button>
            </div>
          )}

          {activeSection === 'skills' && (
            <div className="rb-section">
              <h2>Skills</h2>
              <div className="skills-editor">
                {resumeData.skills.map((skill, idx) => (
                  <div key={idx} className="skill-input-group">
                    <input
                      type="text"
                      value={skill}
                      onChange={(e) => {
                        const updated = [...resumeData.skills];
                        updated[idx] = e.target.value;
                        setResumeData((prev) => ({ ...prev, skills: updated }));
                      }}
                      className="rb-input"
                    />
                  </div>
                ))}
              </div>
              <button className="rb-btn-add" onClick={handleAddSkill}>+ Add Skill</button>
            </div>
          )}

          {activeSection === 'projects' && (
            <div className="rb-section">
              <h2>Featured Projects</h2>
              {resumeData.projects.map((project, idx) => (
                <div key={idx} className="project-card">
                  <input
                    type="text"
                    value={project.name}
                    onChange={(e) => {
                      const updated = [...resumeData.projects];
                      updated[idx].name = e.target.value;
                      setResumeData((prev) => ({ ...prev, projects: updated }));
                    }}
                    placeholder="Project Name"
                    className="rb-input"
                  />
                  <textarea
                    value={project.description}
                    onChange={(e) => {
                      const updated = [...resumeData.projects];
                      updated[idx].description = e.target.value;
                      setResumeData((prev) => ({ ...prev, projects: updated }));
                    }}
                    placeholder="Project Description"
                    className="rb-textarea"
                    rows={3}
                  />
                </div>
              ))}
            </div>
          )}

          {activeSection === 'ats' && (
            <div className="rb-section">
              <h2>ATS Score & JD Matching</h2>
              <div className="form-group">
                <label>Paste Job Description</label>
                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  className="rb-textarea"
                  rows={8}
                  placeholder="Paste role description here to get ATS score and missing keywords..."
                />
              </div>
              <div className="ats-score-card">
                <div className="ats-score-main">{atsReport.score}</div>
                <div className="ats-score-label">ATS Score / 100</div>
                <div className="ats-sub-stats">
                  <span>Keyword Coverage: {atsReport.keywordCoverage}%</span>
                  <span>Section Completeness: {atsReport.completenessScore}/35</span>
                </div>
              </div>
              <div className="ats-keyword-grid">
                <div className="ats-keyword-col">
                  <h4>Matched Keywords</h4>
                  <div className="ats-keyword-list">
                    {atsReport.matchedKeywords.length ? atsReport.matchedKeywords.map((keyword) => (
                      <span key={`match-${keyword}`} className="ats-keyword match">{keyword}</span>
                    )) : <span className="ats-empty">Add JD text to analyze matches.</span>}
                  </div>
                </div>
                <div className="ats-keyword-col">
                  <h4>Missing Keywords</h4>
                  <div className="ats-keyword-list">
                    {atsReport.missingKeywords.length ? atsReport.missingKeywords.map((keyword) => (
                      <span key={`missing-${keyword}`} className="ats-keyword miss">{keyword}</span>
                    )) : <span className="ats-empty">No major gaps detected.</span>}
                  </div>
                </div>
              </div>
              <div className="ats-actions">
                <button className="rb-btn-action" onClick={handleAtsScore} disabled={atsLoading}>
                  {atsLoading ? 'Scoring…' : 'AI ATS Score'}
                </button>
                <button className="rb-btn-action" onClick={handleGenerateQuestions} disabled={questionsLoading}>
                  {questionsLoading ? 'Generating…' : 'Resume-based Questions'}
                </button>
                {atsError && <span className="ats-error">{atsError}</span>}
              </div>
              {atsResult && (
                <div className="ats-ai-panel">
                  <div className="ats-score-main">{Math.round(atsResult.atsScore || 0)}</div>
                  <div className="ats-score-label">LLM ATS Score</div>
                  <div className="ats-keyword-list">
                    {(atsResult.missingKeywords || []).map((kw) => (
                      <span key={kw} className="ats-keyword miss">{kw}</span>
                    ))}
                  </div>
                  <div className="ats-strengths">
                    <h4>Strengths</h4>
                    <ul>
                      {(atsResult.strengths || []).map((s) => <li key={s}>{s}</li>)}
                    </ul>
                    <h4>Risks</h4>
                    <ul>
                      {(atsResult.risks || []).map((s) => <li key={s}>{s}</li>)}
                    </ul>
                  </div>
                </div>
              )}
              {resumeQuestions.length > 0 && (
                <div className="ats-ai-panel">
                  <h4>Targeted Interview Questions</h4>
                  <ol>
                    {resumeQuestions.map((q, idx) => <li key={idx}>{q}</li>)}
                  </ol>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="rb-preview">
          <div className="preview-header">
            <h3>Preview</h3>
            <div className="preview-actions">
              <button className="rb-btn-action" onClick={handleDownloadPDF}>Download PDF</button>
              <button className="rb-btn-action" onClick={handleExportJSON}>Export JSON</button>
            </div>
          </div>
          <div className="ats-preview">
            <strong>ATS:</strong> {atsReport.score}/100
            <span>Coverage: {atsReport.keywordCoverage}%</span>
          </div>
          <ResumePreview />
        </div>
      </div>
    </div>
  );
};

export default ResumeBuilderEnhanced;
