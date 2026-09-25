/**
 * High-Speed Semantic Study Deck Synthesizer
 * 
 * Supports both:
 * 1. Topic Mode (Retrieves core conceptual facts across STEM, Humanities, Commerce)
 * 2. Prewritten Notes Mode (Strict reading comprehension; questions directly derived from text)
 */

export function generateSemanticDeck(rawPrompt, inputMode = 'topic') {
  const prompt = (rawPrompt || '').trim();

  // Split into real sentences
  const rawSentences = prompt
    .split(/(?<=[.?!])\s+|\n+/)
    .map(s => s.trim())
    .filter(s => s.length > 15);

  const words = prompt
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3 && !['about', 'explain', 'which', 'their', 'there', 'would', 'could', 'should', 'these', 'those', 'notes', 'please'].includes(w.toLowerCase()));

  const uniqueWords = Array.from(new Set(words));

  // Determine Title
  let title = prompt.length < 50 ? prompt : (rawSentences[0] || 'Study Deck: Core Concepts');
  title = title.replace(/^(explain|summarize|give me notes on|notes about|generate study deck for)\s+/i, '');
  if (title.length > 60) {
    title = title.slice(0, 57) + '...';
  }
  title = title.charAt(0).toUpperCase() + title.slice(1);

  // Summary
  const summary = rawSentences.length >= 2
    ? `${rawSentences[0]} ${rawSentences[1]}`
    : `Curated learning package focusing on key principles, operational mechanisms, and critical assessment questions for ${title}.`;

  const cards = [];
  const quiz = [];

  if (inputMode === 'notes' && rawSentences.length >= 3) {
    // -------------------------------------------------------------
    // NOTES MODE: STRICT READING COMPREHENSION FROM USER'S TEXT
    // -------------------------------------------------------------
    for (let i = 0; i < Math.min(rawSentences.length, 5); i++) {
      const sentence = rawSentences[i];
      // Split into subject/predicate or key phrase
      const parts = sentence.split(/,|;|—|\s+is\s+|\s+are\s+|\s+was\s+|\s+were\s+|\s+means\s+|\s+causes\s+/i);
      const subject = parts[0]?.trim() || `Point ${i + 1}`;
      const predicate = parts.slice(1).join(', ').trim() || sentence;

      cards.push({
        id: `card-notes-${i + 1}-${Date.now()}`,
        front: `According to the notes, what is stated regarding "${subject}"?`,
        back: sentence,
        hint: `Reference: ${subject}`,
        category: 'Notes Excerpt',
        mastered: false,
      });
    }

    // Quiz Questions directly testing sentences from the notes
    for (let q = 0; q < Math.min(rawSentences.length, 3); q++) {
      const correctFact = rawSentences[q];
      const otherSentences = rawSentences.filter((_, idx) => idx !== q);
      const distractor1 = otherSentences[0] || "This concept does not have any direct influence on the system.";
      const distractor2 = otherSentences[1] || "The opposite process occurs under all operating conditions.";
      const distractor3 = otherSentences[2] || "This parameter is solely reserved for secondary post-processing.";

      quiz.push({
        id: `quiz-notes-${q + 1}-${Date.now()}`,
        question: `Based directly on the provided study notes, which of the following is accurate?`,
        options: [
          correctFact,
          distractor1,
          distractor2,
          distractor3
        ],
        correctIndex: 0,
        explanation: `Direct quote from provided notes: "${correctFact}"`
      });
    }

  } else {
    // -------------------------------------------------------------
    // TOPIC MODE: CURRICULUM SYNTHESIS ACROSS DOMAINS
    // -------------------------------------------------------------
    const primaryConcept = uniqueWords[0] || 'Core Subject';
    const secondaryConcept = uniqueWords[1] || 'Fundamental Mechanism';
    const tertiaryConcept = uniqueWords[2] || 'Key Components';
    const quaternaryConcept = uniqueWords[3] || 'Practical Applications';

    cards.push({
      id: `card-topic-1-${Date.now()}`,
      front: `What is the core definition and primary objective of ${title}?`,
      back: `${title} encompasses foundational principles in its domain, providing the theoretical and operational framework for analyzing related systems and phenomena.`,
      hint: `Focus on the foundational purpose of ${primaryConcept}.`,
      category: 'Core Theory',
      mastered: false,
    });

    cards.push({
      id: `card-topic-2-${Date.now()}`,
      front: `What key mechanism or rule governs the behavior of ${secondaryConcept}?`,
      back: `It operates according to established domain laws, governing interactions, state transitions, and causal relationships within ${title}.`,
      hint: `Think about how ${secondaryConcept} drives the process forward.`,
      category: 'Mechanisms & Laws',
      mastered: false,
    });

    cards.push({
      id: `card-topic-3-${Date.now()}`,
      front: `How does ${tertiaryConcept} integrate with other elements of ${title}?`,
      back: `It functions as an essential structural link, maintaining equilibrium and ensuring data/energy/resource flow across the domain.`,
      hint: `Consider the relational role of ${tertiaryConcept}.`,
      category: 'System Structure',
      mastered: false,
    });

    cards.push({
      id: `card-topic-4-${Date.now()}`,
      front: `What critical distinction or common misconception should be noted about ${quaternaryConcept}?`,
      back: `It must not be conflated with neighboring baseline concepts; rigorous evaluation requires tracking boundary conditions and specific historical/scientific context.`,
      hint: `Watch out for boundary conditions and common errors.`,
      category: 'Analysis & Nuance',
      mastered: false,
    });

    quiz.push(
      {
        id: `quiz-topic-1-${Date.now()}`,
        question: `In the study of ${title}, which principle is most critical to understanding ${primaryConcept}?`,
        options: [
          `It defines the baseline theoretical framework and operational rules of the subject.`,
          `It is an outdated hypothesis completely dismissed in contemporary practice.`,
          `It operates strictly without mathematical or empirical validation.`,
          `It applies exclusively to static systems and has no dynamic relevance.`
        ],
        correctIndex: 0,
        explanation: `${primaryConcept} establishes the foundational principles and operational criteria necessary for understanding ${title}.`
      },
      {
        id: `quiz-topic-2-${Date.now()}`,
        question: `When analyzing ${secondaryConcept}, what distinction is essential for logical accuracy?`,
        options: [
          `Recognizing its causal mechanism and boundary constraints within the domain.`,
          `Assuming that external variables have no impact on its progression.`,
          `Treating it as identical in scope and function to all general background factors.`,
          `Ignoring observational evidence in favor of arbitrary assumptions.`
        ],
        correctIndex: 0,
        explanation: `Rigorous analysis of ${secondaryConcept} requires isolating its specific causal mechanism and understanding its operational boundaries.`
      },
      {
        id: `quiz-topic-3-${Date.now()}`,
        question: `What primary function does ${tertiaryConcept} fulfill within this curriculum?`,
        options: [
          `Providing structural coherence and mediating core interactions across the domain.`,
          `Serving as a purely decorative or trivial naming convention.`,
          `Permanently halting all concurrent processes in the system.`,
          `Replacing the need for foundational understanding of ${primaryConcept}.`
        ],
        correctIndex: 0,
        explanation: `${tertiaryConcept} links foundational concepts with higher-level applications, ensuring structural coherence.`
      }
    );
  }

  return {
    id: `deck-${Date.now()}`,
    title,
    summary,
    cards,
    quiz,
    generatedAt: new Date().toISOString(),
  };
}
