import React, { useEffect, useState } from 'react';
import axios from '../services/apiClient';
import '../styles/CompanyPrep.css';

const getPayload = (response) => (response && typeof response === 'object' && 'data' in response ? response.data : response);

const normalizeCompany = (raw = {}, index = 0) => ({
  _id: raw.id || `c-${index}`,
  name: raw.name || 'Company',
  logo: raw.logo || null,
  industry: raw.industry || 'Technology',
  totalQuestions: raw.totalQuestions || raw.rounds?.reduce((acc, r) => acc + (r.topics?.length || 0), 0) || 0,
  averageRating: raw.averageRating || 4.0,
  selectionRate: raw.selectionRate || 50,
  headquarters: raw.headquarters || 'N/A',
  founded: raw.founded || '2000-01-01',
  employees: raw.employees || 1000,
  description: raw.description || `${raw.name || 'Company'} interview preparation track`,
  interviewProcess: {
    rounds: (raw.rounds || []).map((round) => ({
      title: round.name || 'Round',
      duration: round.duration || '45 min',
      type: round.topics?.join(', ') || 'Technical'
    }))
  },
  questions: (raw.rounds || []).flatMap((round, roundIndex) =>
    (round.topics || []).map((topic, topicIndex) => ({
      question: `${topic} interview question`,
      difficulty: ['Easy', 'Medium', 'Hard'][(roundIndex + topicIndex) % 3],
      category: topic,
      frequency: 10 + roundIndex + topicIndex
    }))
  ),
  positions: [
    { role: 'Software Engineer', level: 'SDE 1/2', averageSalary: Number((raw.averageSalary || '0-0').split('-')[0]) || 100000 }
  ],
  resources: (raw.focusAreas || []).map((focusArea) => ({
    title: `${focusArea} Guide`,
    difficulty: 'Medium'
  }))
});

export default function CompanyPrep() {
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterIndustry, setFilterIndustry] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const response = await axios.get('/api/company-prep');
        const payload = getPayload(response) || [];
        const normalized = payload.map(normalizeCompany);
        setCompanies(normalized);
        setSelectedCompany(normalized[0] || null);
      } catch (err) {
        console.error('Error fetching companies:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCompanies();
  }, []);

  const filteredCompanies = companies.filter((company) => {
    const matchesSearch = company.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesIndustry = filterIndustry === 'All' || company.industry === filterIndustry;
    return matchesSearch && matchesIndustry;
  });

  const industries = [...new Set(companies.map((company) => company.industry))];

  if (loading) return <div className="loading">Loading companies...</div>;

  return (
    <div className="company-prep-container">
      <div className="company-header">
        <h1>Company Preparation Hub</h1>
        <p>Practice company-specific interview tracks.</p>
      </div>
      <div className="company-main">
        <div className="company-sidebar">
          <div className="search-filters">
            <input type="text" placeholder="Search companies..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="search-input" />
            <div className="filter-group">
              <label>Industry:</label>
              <select value={filterIndustry} onChange={(e) => setFilterIndustry(e.target.value)} className="filter-select">
                <option>All</option>
                {industries.map((industry) => (
                  <option key={industry}>{industry}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="companies-list">
            {filteredCompanies.map((company) => (
              <div key={company._id} className={`company-item ${selectedCompany?._id === company._id ? 'active' : ''}`} onClick={() => setSelectedCompany(company)}>
                <div className="company-logo">
                  <div className="logo-placeholder">{company.name.charAt(0)}</div>
                </div>
                <div className="company-name-badge">
                  <h4>{company.name}</h4>
                  <span className="badge">{company.totalQuestions} Q</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {selectedCompany ? (
          <div className="company-details">
            <div className="details-header">
              <h2>{selectedCompany.name}</h2>
              <div className="company-stats">
                <span>{selectedCompany.averageRating.toFixed(1)}/5</span>
                <span>{selectedCompany.totalQuestions} Questions</span>
                <span>{selectedCompany.selectionRate}% Selection</span>
              </div>
            </div>
            <div className="company-info-section">
              <h3>Company Information</h3>
              <div className="info-grid">
                <div className="info-card"><label>Industry</label><p>{selectedCompany.industry}</p></div>
                <div className="info-card"><label>Headquarters</label><p>{selectedCompany.headquarters}</p></div>
                <div className="info-card"><label>Founded</label><p>{new Date(selectedCompany.founded).getFullYear()}</p></div>
                <div className="info-card"><label>Employees</label><p>{selectedCompany.employees.toLocaleString()}</p></div>
              </div>
              <div className="description"><p>{selectedCompany.description}</p></div>
            </div>
            <div className="interview-process">
              <h3>Interview Process</h3>
              <div className="process-steps">
                {selectedCompany.interviewProcess.rounds.map((round, index) => (
                  <div key={`${round.title}-${index}`} className="step-card">
                    <div className="step-number">{index + 1}</div>
                    <h4>{round.title}</h4>
                    <p>Duration: {round.duration}</p>
                    <p>Type: {round.type}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="empty-state">
            <p>Select a company to view details</p>
          </div>
        )}
      </div>
    </div>
  );
}
