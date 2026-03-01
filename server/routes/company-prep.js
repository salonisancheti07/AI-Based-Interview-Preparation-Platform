const express = require('express');
const router = express.Router();

// Mock company data
const mockCompanies = [
  {
    id: 1,
    name: 'Amazon',
    logo: '🔶',
    rounds: [
      { name: 'Online Assessment', topics: ['DSA', 'System Design'] },
      { name: 'Technical Interview', topics: ['Coding', 'Problem Solving'] },
      { name: 'Behavioral', topics: ['Leadership Principles', 'STAR Method'] }
    ],
    averageSalary: '150000-200000',
    focusAreas: ['System Design', 'Scalability', 'OOP']
  },
  {
    id: 2,
    name: 'Google',
    logo: '🔵',
    rounds: [
      { name: 'Online Test', topics: ['Algorithms', 'Data Structures'] },
      { name: 'Phone Screen', topics: ['Coding Interview', 'Problem Solving'] },
      { name: 'On-site', topics: ['System Design', 'Behavioral', 'Technical'] }
    ],
    averageSalary: '160000-220000',
    focusAreas: ['Algorithms', 'Large Scale Systems', 'Optimization']
  },
  {
    id: 3,
    name: 'Meta',
    logo: '👥',
    rounds: [
      { name: 'Coding Interview', topics: ['DSA', 'Implementation'] },
      { name: 'System Design', topics: ['Design Patterns', 'Scalability'] },
      { name: 'Behavioral', topics: ['Culture Fit', 'Leadership'] }
    ],
    averageSalary: '140000-190000',
    focusAreas: ['Real-time Systems', 'Social Networks', 'Performance']
  },
  {
    id: 4,
    name: 'Microsoft',
    logo: '◻️',
    rounds: [
      { name: 'Online Assessment', topics: ['Coding', 'Problem Solving'] },
      { name: 'Phone Interview', topics: ['Technical Skills'] },
      { name: 'On-site Round', topics: ['System Design', 'Behavioral'] }
    ],
    averageSalary: '145000-210000',
    focusAreas: ['Cloud Computing', 'API Design', 'Databases']
  },
  {
    id: 5,
    name: 'Netflix',
    logo: '🎬',
    rounds: [
      { name: 'Take-home / Online', topics: ['System Design', 'Coding'] },
      { name: 'On-site loop', topics: ['Architecture', 'Behavioral', 'Culture fit'] }
    ],
    averageSalary: '200000-300000',
    focusAreas: ['Distributed Systems', 'Caching', 'Resilience']
  },
  {
    id: 6,
    name: 'Apple',
    logo: '🍏',
    rounds: [
      { name: 'Phone Screen', topics: ['Coding', 'Data Structures'] },
      { name: 'On-site', topics: ['System Design', 'Behavioral'] }
    ],
    averageSalary: '180000-260000',
    focusAreas: ['Concurrency', 'Performance', 'iOS/Platform']
  }
];

// Get all companies
router.get('/', async (req, res) => {
  try {
    res.json({
      success: true,
      data: mockCompanies
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get specific company
router.get('/:companyId', async (req, res) => {
  try {
    const company = mockCompanies.find(c => c.id == req.params.companyId);
    if (company) {
      res.json({ success: true, data: company });
    } else {
      res.status(404).json({ success: false, message: 'Company not found' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
