import React, { useState } from 'react';
import '../styles/Flashcards.css';

const decks = [
  {
    name: 'DSA Patterns',
    cards: [
      { front: 'Sliding Window: when?', back: 'Variable-length subarray/string with optimality over a window.' },
      { front: 'Binary Search on Answer', back: 'Monotonic yes/no condition over integer space.' },
      { front: 'Two Pointers', back: 'Opposite ends or same direction to shrink/expand; often after sorting.' }
    ]
  },
  {
    name: 'System Design',
    cards: [
      { front: 'CAP tradeoff', back: 'Pick 2 of Consistency, Availability, Partition tolerance.' },
      { front: 'Cache stampede', back: 'Use locks or dogpile prevention (lazy expiring, request coalescing).' }
    ]
  },
  {
    name: 'Behavioral (STAR)',
    cards: [
      { front: 'STAR intro', back: 'Situation, Task, Action, Result; keep it concise and quantified.' },
      { front: 'Failure story', back: 'Pick a contained failure, own it, show learning and prevention.' }
    ]
  }
];

export default function Flashcards() {
  const [active, setActive] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [cardIndex, setCardIndex] = useState(0);

  const currentDeck = decks[active];
  const currentCard = currentDeck.cards[cardIndex % currentDeck.cards.length];

  const nextCard = () => {
    setCardIndex((i) => (i + 1) % currentDeck.cards.length);
    setFlipped(false);
  };

  const prevCard = () => {
    setCardIndex((i) => (i - 1 + currentDeck.cards.length) % currentDeck.cards.length);
    setFlipped(false);
  };

  return (
    <div className="fc-page">
      <div className="fc-hero">
        <div>
          <p className="kicker">Spaced repetition · Quick refresh</p>
          <h1>Flashcards for fast recall</h1>
          <p className="sub">Concepts, complexities, edge cases, and behavioral cues.</p>
        </div>
      </div>

      <div className="fc-layout">
        <div className="fc-sidebar">
          {decks.map((d, idx) => (
            <button
              key={d.name}
              className={`deck-btn ${idx === active ? 'active' : ''}`}
              onClick={() => { setActive(idx); setFlipped(false); setCardIndex(0); }}
            >
              <div className="deck-name">{d.name}</div>
              <div className="deck-count">{d.cards.length} cards</div>
            </button>
          ))}
        </div>
        <div className="fc-card-wrap">
          <div
            className={`fc-card ${flipped ? 'flipped' : ''}`}
            onClick={() => setFlipped(!flipped)}
            role="button"
            tabIndex={0}
          >
            <div className="fc-face front">
              <h3>{currentCard.front}</h3>
              <p>Tap to flip</p>
            </div>
            <div className="fc-face back">
              <h3>{currentCard.back}</h3>
              <p className="hint">Tap to go back</p>
            </div>
          </div>
          <div className="fc-actions">
            <button className="btn small ghost" onClick={prevCard}>Prev</button>
            <button className="btn small primary" onClick={nextCard}>Next</button>
            <button className="btn small ghost" onClick={() => setCardIndex(0)}>Reset</button>
          </div>
        </div>
      </div>
    </div>
  );
}
