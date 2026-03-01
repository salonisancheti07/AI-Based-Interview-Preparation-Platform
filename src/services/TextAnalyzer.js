/**
 * TextAnalyzer Service
 * Comprehensive NLP for analyzing communication, sentiment, structure, and quality
 */

class TextAnalyzer {
  /**
   * Analyze text for interview quality metrics
   */
  static analyzeText(text) {
    return {
      sentiment: this.analyzeSentiment(text),
      structure: this.analyzeStructure(text),
      communication: this.analyzeCommunication(text),
      engagement: this.analyzeEngagement(text),
      keywords: this.extractKeywords(text),
      readability: this.analyzeReadability(text),
      confidence: this.detectConfidence(text),
      overallScore: 0 // Will be calculated below
    };
  }

  /**
   * Sentiment Analysis
   */
  static analyzeSentiment(text) {
    const positiveWords = /great|excellent|amazing|wonderful|fantastic|brilliant|outstanding|perfect|superb|innovative|creative|unique|strong|passionate|enthusiastic|motivated|confident/gi;
    const negativeWords = /bad|terrible|awful|horrible|weak|mediocre|fail|difficult|hard|struggle|problem|issue|concern|worry|uncertain|unsure|confused/gi;
    const uncertainWords = /maybe|perhaps|sort of|kind of|somewhat|I think|I guess|probably|possibly/gi;

    const positiveCount = (text.match(positiveWords) || []).length;
    const negativeCount = (text.match(negativeWords) || []).length;
    const uncertainCount = (text.match(uncertainWords) || []).length;

    const totalSentimentWords = positiveCount + negativeCount + uncertainCount;
    const sentimentScore = totalSentimentWords > 0 
      ? ((positiveCount - negativeCount) / totalSentimentWords) * 100
      : 0;

    return {
      score: Math.max(-100, Math.min(100, sentimentScore)),
      positive: positiveCount,
      negative: negativeCount,
      uncertain: uncertainCount,
      type: sentimentScore > 20 ? 'positive' : sentimentScore < -20 ? 'negative' : 'neutral'
    };
  }

  /**
   * Analyze text structure (STAR method, paragraphs, flow)
   */
  static analyzeStructure(text) {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0);
    const avgWordsPerSentence = text.split(/\s+/).length / Math.max(sentences.length, 1);
    
    // Check for STAR method elements
    const hasContext = /situation|background|context|previously|was working|at the time/i.test(text);
    const hasTask = /task|responsibility|was asked|needed|had to|my role|i was responsible/i.test(text);
    const hasAction = /did|implemented|created|developed|designed|built|led|managed|organized|coordinated/i.test(text);
    const hasResult = /result|outcome|achieved|accomplished|delivered|completed|succeeded|improved|increased|decreased/i.test(text);

    const starScore = (hasContext + hasTask + hasAction + hasResult) / 4 * 100;

    return {
      sentenceCount: sentences.length,
      paragraphCount: paragraphs.length,
      avgWordsPerSentence,
      starMethodScore: starScore,
      hasContext,
      hasTask,
      hasAction,
      hasResult,
      organization: paragraphs.length > 1 ? 'good' : 'needs_improvement'
    };
  }

  /**
   * Analyze communication quality
   */
  static analyzeCommunication(text) {
    const words = text.split(/\s+/);
    const uniqueWords = new Set(words.map(w => w.toLowerCase())).size;
    const vocabularyDiversity = (uniqueWords / words.length) * 100;

    // Check for fillers and weak language
    const fillers = /\bum\b|\bah\b|\blike\b|\byou know\b|\bbasically\b|\bliterally\b/gi;
    const fillerCount = (text.match(fillers) || []).length;

    // Check for strong verbs and action words
    const strongVerbs = /led|pioneered|spearheaded|orchestrated|engineered|architected|accelerated|amplified|optimized|streamlined/gi;
    const strongVerbCount = (text.match(strongVerbs) || []).length;

    // Grammar and clarity indicators
    const hasContraction = /n't|'ve|'re|'ll|'d/g.test(text);
    const isFormality = !hasContraction ? 'formal' : 'conversational';

    return {
      vocabularyDiversity: Math.min(vocabularyDiversity, 100),
      fillerCount,
      fillerScore: Math.max(0, 100 - (fillerCount * 5)),
      strongVerbCount,
      strongVerbScore: Math.min(strongVerbCount * 10, 100),
      formality: isFormality,
      clarity: this.calculateClarity(text),
      avoidanceOfFiller: Math.max(0, 100 - (fillerCount * 10))
    };
  }

  /**
   * Calculate clarity score
   */
  static calculateClarity(text) {
    const words = text.split(/\s+/).length;
    const sentences = text.split(/[.!?]+/).length;
    const avgLength = words / sentences;
    
    // Ideal sentence length is 15-20 words
    if (avgLength >= 15 && avgLength <= 25) {
      return 100;
    } else if (avgLength >= 12 && avgLength <= 28) {
      return 80;
    } else if (avgLength >= 10 && avgLength <= 30) {
      return 60;
    }
    return 40;
  }

  /**
   * Analyze engagement and enthusiasm
   */
  static analyzeEngagement(text) {
    const exclamations = (text.match(/!/g) || []).length;
    const capitalizedWords = (text.match(/\b[A-Z][a-z]*\b/g) || []).length;
    const emojis = (text.match(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g) || []).length;
    
    const enthusiasmIndicators = /excited|interested|passionate|enthusiastic|motivated|engaged|focused|determined/gi;
    const enthusiasmCount = (text.match(enthusiasmIndicators) || []).length;

    const engagementScore = Math.min((exclamations * 10 + enthusiasmCount * 15 + capitalizedWords * 5) / 10, 100);

    return {
      exclamationCount: exclamations,
      capitalizedWords,
      enthusiasmCount,
      engagementScore: Math.min(engagementScore, 100),
      level: engagementScore > 70 ? 'high' : engagementScore > 40 ? 'medium' : 'low'
    };
  }

  /**
   * Extract keywords and key concepts
   */
  static extractKeywords(text) {
    // Remove common words
    const stopWords = new Set([
      'a', 'an', 'the', 'is', 'are', 'was', 'were', 'been', 'be', 'have', 'has', 'had',
      'do', 'does', 'did', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
      'by', 'from', 'as', 'up', 'about', 'into', 'through', 'during', 'i', 'you', 'he', 'she',
      'it', 'we', 'they', 'what', 'which', 'who', 'when', 'where', 'why', 'how'
    ]);

    const words = text.toLowerCase().split(/\s+/);
    const keywordFreq = {};

    words.forEach(word => {
      const cleanWord = word.replace(/[^a-z0-9]/g, '');
      if (cleanWord.length > 3 && !stopWords.has(cleanWord)) {
        keywordFreq[cleanWord] = (keywordFreq[cleanWord] || 0) + 1;
      }
    });

    return Object.entries(keywordFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word, freq]) => ({ word, frequency: freq }));
  }

  /**
   * Analyze readability (Flesch-Kincaid)
   */
  static analyzeReadability(text) {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
    const words = text.split(/\s+/).length;
    const syllables = this.countSyllables(text);

    // Flesch Reading Ease
    const flesch = 206.835 - (1.015 * (words / sentences)) - (84.6 * (syllables / words));
    const grade = (0.39 * (words / sentences)) + (11.8 * (syllables / words)) - 15.59;

    let level;
    if (flesch > 90) level = 'very_easy';
    else if (flesch > 80) level = 'easy';
    else if (flesch > 70) level = 'fairly_easy';
    else if (flesch > 60) level = 'standard';
    else if (flesch > 50) level = 'fairly_difficult';
    else if (flesch > 30) level = 'difficult';
    else level = 'very_difficult';

    return {
      fleschScore: Math.max(0, Math.min(100, flesch)),
      gradeLevel: Math.max(1, Math.round(grade)),
      readabilityLevel: level,
      syllablesPerWord: Math.round((syllables / words) * 10) / 10
    };
  }

  /**
   * Count syllables (simple estimation)
   */
  static countSyllables(text) {
    const words = text.toLowerCase().split(/\s+/);
    let syllableCount = 0;

    words.forEach(word => {
      let count = 0;
      word = word.replace(/[^a-z]/g, '');
      
      const vowels = 'aeiouy';
      let prevWasVowel = false;
      
      for (let char of word) {
        const isVowel = vowels.includes(char);
        if (isVowel && !prevWasVowel) {
          count++;
        }
        prevWasVowel = isVowel;
      }
      
      if (word.endsWith('e')) count--;
      if (word.endsWith('le')) count++;
      if (count === 0) count = 1;
      
      syllableCount += count;
    });

    return syllableCount;
  }

  /**
   * Detect confidence level from text patterns
   */
  static detectConfidence(text) {
    const confidentIndicators = /definitely|certainly|absolutely|always|clearly|obviously|strongly|confident|convinced|sure/gi;
    const uncertainIndicators = /maybe|perhaps|possibly|might|could|somewhat|kind of|sort of|I think|I guess|not sure|uncertain/gi;

    const confidentCount = (text.match(confidentIndicators) || []).length;
    const uncertainCount = (text.match(uncertainIndicators) || []).length;

    const netConfidence = confidentCount - uncertainCount;
    const confidenceScore = Math.max(0, Math.min(100, 50 + (netConfidence * 10)));

    return {
      score: confidenceScore,
      level: confidenceScore > 70 ? 'high' : confidenceScore > 40 ? 'medium' : 'low',
      indicators: {
        confident: confidentCount,
        uncertain: uncertainCount
      }
    };
  }

  /**
   * Generate comprehensive feedback
   */
  static generateFeedback(analysis) {
    const feedback = {
      strengths: [],
      improvements: [],
      score: 0
    };

    // Calculate overall score
    const weights = {
      sentiment: 0.15,
      structure: 0.2,
      communication: 0.25,
      engagement: 0.15,
      readability: 0.1,
      confidence: 0.15
    };

    let totalScore = 0;
    let totalWeight = 0;

    if (analysis.sentiment.type === 'positive') {
      feedback.strengths.push('✅ Positive tone and language');
      totalScore += 85 * weights.sentiment;
    } else if (analysis.sentiment.type === 'negative') {
      feedback.improvements.push('⚠️ Consider more positive language');
      totalScore += 40 * weights.sentiment;
    } else {
      totalScore += 60 * weights.sentiment;
    }

    if (analysis.structure.starMethodScore > 75) {
      feedback.strengths.push('✅ Well-structured answer (STAR method)');
      totalScore += 90 * weights.structure;
    } else if (analysis.structure.starMethodScore > 50) {
      feedback.improvements.push('⚠️ Try to follow STAR method more clearly');
      totalScore += 65 * weights.structure;
    } else {
      feedback.improvements.push('⚠️ Consider using STAR method (Situation, Task, Action, Result)');
      totalScore += 45 * weights.structure;
    }

    if (analysis.communication.fillerScore > 80) {
      feedback.strengths.push('✅ Minimal filler words');
      totalScore += 85 * weights.communication;
    } else {
      feedback.improvements.push(`⚠️ Reduce filler words (found ${analysis.communication.fillerCount})`);
      totalScore += (80 - analysis.communication.fillerCount * 5) * weights.communication;
    }

    if (analysis.communication.strongVerbCount > 3) {
      feedback.strengths.push('✅ Strong action verbs used');
      totalScore += 85 * weights.communication;
    } else {
      feedback.improvements.push('⚠️ Use more strong action verbs');
      totalScore += 60 * weights.communication;
    }

    if (analysis.engagement.engagementScore > 70) {
      feedback.strengths.push('✅ High engagement and enthusiasm');
      totalScore += 85 * weights.engagement;
    } else {
      feedback.improvements.push('⚠️ Show more enthusiasm and engagement');
      totalScore += analysis.engagement.engagementScore * weights.engagement;
    }

    if (analysis.readability.fleschScore > 60) {
      feedback.strengths.push('✅ Clear and readable language');
      totalScore += 85 * weights.readability;
    } else {
      feedback.improvements.push('⚠️ Simplify language for better clarity');
      totalScore += analysis.readability.fleschScore * weights.readability;
    }

    if (analysis.confidence.level === 'high') {
      feedback.strengths.push('✅ Confident tone');
      totalScore += 85 * weights.confidence;
    } else if (analysis.confidence.level === 'low') {
      feedback.improvements.push('⚠️ Be more confident in your answers');
      totalScore += 45 * weights.confidence;
    } else {
      totalScore += 65 * weights.confidence;
    }

    feedback.score = Math.round(totalScore);
    return feedback;
  }

  /**
   * Compare two answers and provide comparative analysis
   */
  static compareAnswers(answer1, answer2) {
    const analysis1 = this.analyzeText(answer1);
    const analysis2 = this.analyzeText(answer2);

    return {
      answer1: {
        analysis: analysis1,
        feedback: this.generateFeedback(analysis1)
      },
      answer2: {
        analysis: analysis2,
        feedback: this.generateFeedback(analysis2)
      },
      winner: analysis1.sentiment.score > analysis2.sentiment.score ? 'answer1' : 'answer2',
      differences: {
        sentiment: Math.abs(analysis1.sentiment.score - analysis2.sentiment.score),
        structure: Math.abs(analysis1.structure.starMethodScore - analysis2.structure.starMethodScore),
        communication: Math.abs(analysis1.communication.clarity - analysis2.communication.clarity),
        confidence: Math.abs(analysis1.confidence.score - analysis2.confidence.score)
      }
    };
  }
}

export default TextAnalyzer;
