const AIEvaluator = require('./AIEvaluator');

const STOPWORDS = new Set([
  'a', 'an', 'the', 'is', 'are', 'was', 'were', 'to', 'for', 'of', 'on', 'in', 'with',
  'and', 'or', 'by', 'as', 'at', 'be', 'can', 'how', 'what', 'why', 'when', 'where',
  'it', 'this', 'that', 'from', 'about', 'into', 'your', 'you', 'i', 'we', 'our',
  'their', 'they', 'do', 'does', 'did', 'if', 'then', 'than', 'using', 'use'
]);

const KNOWLEDGE_BASE = [
  {
    id: 'dsa-two-sum',
    title: 'Two Sum Pattern',
    topic: 'Arrays & Hashing',
    source: 'InterviewPrep Knowledge Base',
    content: 'For Two Sum, use a hash map to store value to index while traversing once. For each number x, check if target - x is already in the map. This gives O(n) time and O(n) space.'
  },
  {
    id: 'dsa-binary-search',
    title: 'Binary Search Template',
    topic: 'Searching',
    source: 'InterviewPrep Knowledge Base',
    content: 'Binary search requires sorted data. Maintain left and right pointers, compute mid safely, and shrink the half-space based on comparison. Time complexity is O(log n).'
  },
  {
    id: 'dsa-dp',
    title: 'Dynamic Programming Workflow',
    topic: 'Dynamic Programming',
    source: 'InterviewPrep Knowledge Base',
    content: 'Define state, transition, and base cases first. Start with recursion, then memoize, and finally convert to tabulation if needed. Track time and space tradeoffs.'
  },
  {
    id: 'system-design-scaling',
    title: 'System Design Scaling Basics',
    topic: 'System Design',
    source: 'InterviewPrep Knowledge Base',
    content: 'Start with requirements, estimate scale, define APIs, choose data model, and design read/write path. Add caching, load balancing, database sharding, and observability incrementally.'
  },
  {
    id: 'behavioral-star',
    title: 'Behavioral STAR Method',
    topic: 'Behavioral Questions',
    source: 'InterviewPrep Knowledge Base',
    content: 'Use STAR: Situation, Task, Action, Result. Focus on your individual contribution and quantify impact. Keep answers concise and relevant to the role.'
  },
  {
    id: 'aptitude-time-work',
    title: 'Aptitude Time and Work',
    topic: 'Aptitude',
    source: 'InterviewPrep Knowledge Base',
    content: 'If A finishes work in x days, one-day work is 1/x. For combined rate, add individual rates. Total time is inverse of combined one-day work.'
  },
  {
    id: 'aptitude-profit-loss',
    title: 'Aptitude Profit and Loss',
    topic: 'Aptitude',
    source: 'InterviewPrep Knowledge Base',
    content: 'Profit percent equals (profit over cost price) times 100. Loss percent equals (loss over cost price) times 100. Selling price equals cost price times (1 plus or minus percentage fraction).'
  },
  {
    id: 'java-twosum-signature',
    title: 'Java LeetCode Signature',
    topic: 'Java Coding',
    source: 'InterviewPrep Knowledge Base',
    content: 'For LeetCode style Java, keep all imports at top-level and implement inside class Solution with method public int[] twoSum(int[] nums, int target). Do not place import statements inside methods.'
  },
  {
    id: 'python-twosum-signature',
    title: 'Python LeetCode Signature',
    topic: 'Python Coding',
    source: 'InterviewPrep Knowledge Base',
    content: 'Use class Solution with def twoSum(self, nums, target). Return list of indices. Use dictionary map from value to index for linear-time solution.'
  },
  {
    id: 'cpp-twosum-signature',
    title: 'C++ LeetCode Signature',
    topic: 'C++ Coding',
    source: 'InterviewPrep Knowledge Base',
    content: 'For C++, implement vector<int> twoSum(vector<int>& nums, int target). Use unordered_map<int, int> for complement lookup and return indices as soon as match is found.'
  }
];

function normalizeText(input = '') {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(input = '') {
  return normalizeText(input)
    .split(' ')
    .filter((token) => token.length > 1 && !STOPWORDS.has(token));
}

function scoreDocument(queryTokens, doc) {
  const text = `${doc.title} ${doc.topic} ${doc.content}`.toLowerCase();
  let score = 0;

  for (const token of queryTokens) {
    if (text.includes(token)) score += 2;
    if (doc.topic.toLowerCase().includes(token)) score += 2;
    if (doc.title.toLowerCase().includes(token)) score += 1;
  }

  return score;
}

function retrieveRelevantChunks(query, topic = '', topK = 4) {
  const queryTokens = tokenize(`${query} ${topic}`);
  const normalizedTopic = (topic || '').toLowerCase();
  const scored = KNOWLEDGE_BASE
    .map((doc) => {
      let score = scoreDocument(queryTokens, doc);
      const docTopic = doc.topic.toLowerCase();

      // Strong topic boost for session-selected topic.
      if (normalizedTopic && docTopic.includes(normalizedTopic)) {
        score += 4;
      }

      // Small boost for exact "two sum" intent.
      if (query.toLowerCase().includes('two sum') && doc.id.includes('two-sum')) {
        score += 4;
      }

      return { ...doc, score };
    })
    .filter((doc) => doc.score >= 2)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  return scored;
}

function buildGroundedPrompt({ userMessage, topic, sessionType, contextChunks, conversationHistory = [] }) {
  const normalizedMessage = normalizeText(userMessage);
  const wantsCode = /\b(code|implement|solution|answer|program|java|python|cpp|c\+\+|javascript|js)\b/.test(normalizedMessage);
  const contextText = contextChunks
    .map((chunk, idx) => `[${idx + 1}] ${chunk.title} (${chunk.topic}): ${chunk.content}`)
    .join('\n');

  const shortHistory = conversationHistory.slice(-6).map((msg) => {
    const role = msg.sender === 'ai' ? 'assistant' : 'user';
    return `${role}: ${msg.message}`;
  }).join('\n');

  return `
You are an interview preparation assistant.
Session type: ${sessionType || 'doubt-solving'}
Primary topic: ${topic || 'general interview prep'}

Use the retrieved context to answer. If context is insufficient, say what is missing and then give best-practice guidance.
Keep answer practical and structured.

Retrieved context:
${contextText || 'No specific retrieved context.'}

Conversation history:
${shortHistory || 'No prior messages'}

User question:
${userMessage}

Output requirements:
1. Give a direct answer first.
2. Provide short actionable steps.
3. If code-related, include complete working code in requested language.
4. Mention context reference numbers used, like [1], [2].
5. ${wantsCode ? 'User asked for solution code. Do not give only hints.' : 'Use concise explanation first, then code only if needed.'}
`;
}

function buildFallbackAnswer(message, chunks) {
  const normalizedMessage = normalizeText(message);
  const wantsCode = /\b(code|implement|solution|answer|program|java|python|cpp|c\+\+|javascript|js)\b/.test(normalizedMessage);

  if (!chunks.length) {
    const generic = wantsCode
      ? [
          'I do not have enough matching context yet. Share the exact problem statement and language.',
          '',
          'Starter template:',
          '```javascript',
          'function solve(input) {',
          '  // implement logic',
          '  return output;',
          '}',
          '```'
        ].join('\n')
      : 'I could not find a direct reference in the current knowledge base. Share the exact problem statement or language, and I will provide a targeted solution.';

    return {
      answer: generic,
      sources: []
    };
  }

  const primary = chunks[0];
  const answerParts = [
    'Here is the best answer from interview-prep context:',
    primary.content
  ];

  if (primary.id.includes('two-sum')) {
    answerParts.push(
      '',
      'JavaScript solution:',
      '```javascript',
      'function twoSum(nums, target) {',
      '  const map = new Map();',
      '  for (let i = 0; i < nums.length; i++) {',
      '    const need = target - nums[i];',
      '    if (map.has(need)) return [map.get(need), i];',
      '    map.set(nums[i], i);',
      '  }',
      '  return [-1, -1];',
      '}',
      '```'
    );

    if (wantsCode) {
      answerParts.push(
        '',
        'Python solution:',
        '```python',
        'def twoSum(nums, target):',
        '    seen = {}',
        '    for i, x in enumerate(nums):',
        '        need = target - x',
        '        if need in seen:',
        '            return [seen[need], i]',
        '        seen[x] = i',
        '    return [-1, -1]',
        '```'
      );
    }
  } else if (wantsCode) {
    answerParts.push(
      '',
      'Requested code answer:',
      '',
      'Please share exact problem statement + language (Java/Python/JS/C++).',
      'I will return complete runnable code for that specific question.'
    );
  }

  if (wantsCode && primary.id.includes('java-twosum-signature')) {
    answerParts.push(
      '',
      'Java (LeetCode style):',
      '```java',
      'class Solution {',
      '    public int[] twoSum(int[] nums, int target) {',
      '        java.util.Map<Integer, Integer> map = new java.util.HashMap<>();',
      '        for (int i = 0; i < nums.length; i++) {',
      '            int need = target - nums[i];',
      '            if (map.containsKey(need)) return new int[]{map.get(need), i};',
      '            map.put(nums[i], i);',
      '        }',
      '        return new int[]{-1, -1};',
      '    }',
      '}',
      '```'
    );
  }

  return {
    answer: answerParts.join('\n'),
    sources: [{
      ref: 1,
      id: primary.id,
      title: primary.title,
      topic: primary.topic,
      source: primary.source
    }]
  };
}

class RAGService {
  static getKnowledgeBaseStats() {
    const topics = [...new Set(KNOWLEDGE_BASE.map((item) => item.topic))];
    return {
      totalChunks: KNOWLEDGE_BASE.length,
      topics
    };
  }

  static retrieve(query, topic, topK = 4) {
    return retrieveRelevantChunks(query, topic, topK);
  }

  static async askWithRAG({ message, topic, sessionType, conversationHistory }) {
    const chunks = this.retrieve(message, topic, 4);
    const sources = chunks.map((chunk, idx) => ({
      ref: idx + 1,
      id: chunk.id,
      title: chunk.title,
      topic: chunk.topic,
      source: chunk.source
    }));

    if (!process.env.OPENAI_API_KEY && !process.env.VITE_OPENAI_API_KEY) {
      const fallback = buildFallbackAnswer(message, chunks);
      return {
        response: fallback.answer,
        sources: fallback.sources,
        usedRag: true,
        provider: 'local-fallback'
      };
    }

    const prompt = buildGroundedPrompt({
      userMessage: message,
      topic,
      sessionType,
      contextChunks: chunks,
      conversationHistory
    });

    try {
      const response = await AIEvaluator.callOpenAI(prompt, {
        model: 'gpt-3.5-turbo',
        temperature: 0.4,
        maxTokens: 700,
        systemPrompt: 'You are a strict, grounded interview tutor. Prefer retrieved context over assumptions.'
      });

      return {
        response,
        sources,
        usedRag: true,
        provider: 'openai'
      };
    } catch (error) {
      const fallback = buildFallbackAnswer(message, chunks);
      const status = error?.response?.status;
      const rateLimitMsg = status === 429
        ? '\n\nNote: OpenAI rate limit/quota reached. Using local tutor mode for now.'
        : '\n\nNote: OpenAI temporarily unavailable. Using local tutor mode.';
      return {
        response: `${fallback.answer}${rateLimitMsg}`,
        sources: fallback.sources,
        usedRag: true,
        provider: 'local-fallback'
      };
    }
  }
}

module.exports = RAGService;
