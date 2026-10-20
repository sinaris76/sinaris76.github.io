---
layout: page
title: AI for IV
permalink: /projects/ai-for-iv/
description: AI-powered learning experiences designed to cultivate intellectual virtues.
nav: false
---

<style>
  /* ---------- Layout & rhythm ---------- */
  .aiv-hero { margin: 0.5rem 0 2.5rem; }
  .aiv-hero__eyebrow {
    font-size: 0.72rem; letter-spacing: 0.09em; text-transform: uppercase;
    font-weight: 600; color: var(--global-theme-color); margin: 0 0 0.5rem;
  }
  .aiv-hero__lede { font-size: 1.12rem; line-height: 1.7; color: var(--global-text-color); }
  .aiv-hero__lede .muted { color: var(--global-text-color-light); }

  .aiv-back { display: inline-block; margin-bottom: 1.5rem; font-weight: 600; font-size: 0.9rem; }
  .aiv-back .arrow { display: inline-block; transition: transform 0.18s ease; }
  .aiv-back:hover .arrow { transform: translateX(-4px); }

  /* ---------- Experience card ---------- */
  .xp {
    border: 1px solid var(--global-divider-color);
    border-radius: 20px;
    background-color: var(--global-card-bg-color);
    padding: 2rem;
    margin: 2rem 0;
  }
  @media (min-width: 576px) { .xp { padding: 2.5rem; } }

  .xp__head { display: flex; align-items: flex-start; gap: 1rem; margin-bottom: 1rem; }
  .xp__num {
    flex: 0 0 auto;
    width: 2.4rem; height: 2.4rem;
    display: grid; place-items: center;
    border-radius: 50%;
    background: var(--global-theme-color);
    color: #fff; font-weight: 700; font-size: 1.05rem;
  }
  .xp__titles { flex: 1 1 auto; }
  .xp__kicker {
    font-size: 0.72rem; letter-spacing: 0.08em; text-transform: uppercase;
    font-weight: 600; color: var(--global-text-color-light); margin: 0.2rem 0 0.15rem;
  }
  .xp__title { font-size: 1.5rem; font-weight: 700; margin: 0; line-height: 1.25; color: var(--global-text-color); }
  .xp__desc { color: var(--global-text-color-light); line-height: 1.65; margin: 0.25rem 0 0; }

  /* ---------- Steps ---------- */
  .xp-steps { list-style: none; padding: 0; margin: 1.5rem 0 0; }
  .xp-steps li {
    position: relative; padding-left: 1.9rem; margin-bottom: 0.6rem;
    color: var(--global-text-color); line-height: 1.55;
  }
  .xp-steps li::before {
    content: "→"; position: absolute; left: 0; top: 0;
    color: var(--global-theme-color); font-weight: 700;
  }

  /* ---------- Chatbot device frame ---------- */
  .bot {
    margin: 1.75rem 0 0;
    border: 1px solid var(--global-divider-color);
    border-radius: 14px; overflow: hidden;
    box-shadow: 0 10px 30px rgba(0,0,0,0.08);
  }
  .bot__bar {
    display: flex; align-items: center; gap: 0.55rem;
    padding: 0.7rem 1rem;
    background: var(--global-bg-color);
    border-bottom: 1px solid var(--global-divider-color);
  }
  .bot__dot { width: 0.7rem; height: 0.7rem; border-radius: 50%; background: var(--global-divider-color); }
  .bot__label {
    margin-left: 0.4rem; font-size: 0.8rem; font-weight: 600;
    color: var(--global-text-color-light);
  }
  .bot iframe { display: block; width: 100%; height: 620px; border: 0; background: var(--global-bg-color); }
  @media (max-width: 575px) { .bot iframe { height: 70vh; } }

  /* ---------- Reflect ---------- */
  .reflect { margin-top: 1.75rem; padding: 1.4rem 1.5rem; border-radius: 14px;
             background: rgba(128,128,128,0.06); border: 1px solid var(--global-divider-color); }
  .reflect__label {
    display: inline-flex; align-items: center; gap: 0.45rem;
    font-size: 0.74rem; letter-spacing: 0.07em; text-transform: uppercase;
    font-weight: 700; color: var(--global-theme-color); margin-bottom: 0.7rem;
  }
  .reflect ol { margin: 0; padding-left: 1.2rem; }
  .reflect li { margin-bottom: 0.5rem; line-height: 1.6; color: var(--global-text-color); }
  .reflect li:last-child { margin-bottom: 0; }

  /* ---------- Reveal (spoiler) ---------- */
  .reveal { margin-top: 1.25rem; border-radius: 14px; border: 1px dashed var(--global-theme-color);
            background: rgba(128,128,128,0.04); overflow: hidden; }
  .reveal > summary {
    cursor: pointer; list-style: none; padding: 1rem 1.3rem; font-weight: 600;
    color: var(--global-text-color); display: flex; align-items: center; gap: 0.6rem;
  }
  .reveal > summary::-webkit-details-marker { display: none; }
  .reveal > summary .chev { transition: transform 0.2s ease; color: var(--global-theme-color); }
  .reveal[open] > summary .chev { transform: rotate(90deg); }
  .reveal__body { padding: 0 1.3rem 1.3rem; line-height: 1.65; color: var(--global-text-color); }
  .reveal__body code {
    background: var(--global-bg-color); border: 1px solid var(--global-divider-color);
    padding: 0.15rem 0.4rem; border-radius: 6px; font-size: 0.9em;
  }

  /* ---------- Design notes (for Sina to fill in) ---------- */
  .dnote {
    margin-top: 1.5rem; padding: 1.3rem 1.5rem; border-radius: 14px;
    border-left: 4px solid var(--global-theme-color);
    background: rgba(128,128,128,0.05);
  }
  .dnote__label {
    display: inline-flex; align-items: center; gap: 0.45rem;
    font-size: 0.74rem; letter-spacing: 0.07em; text-transform: uppercase;
    font-weight: 700; color: var(--global-text-color-light); margin-bottom: 0.55rem;
  }
  .dnote p { margin: 0; line-height: 1.7; color: var(--global-text-color); }
</style>

<a class="aiv-back" href="{{ '/projects/' | relative_url }}"><span class="arrow">&larr;</span>&nbsp;All projects</a>

<div class="aiv-hero">
  <p class="aiv-hero__eyebrow">AI for Intellectual Virtues</p>
  <p class="aiv-hero__lede">
    These are learning experiences that we co-designed with a group of undergraduate students from philosophy and computer science on <a href="https://www.playlab.ai/" target="_blank">Playlab</a> for the Artificial Intelligence for Intellectual Virtues project. 
    The chatbots are each a small microworlds that serve as objects-to-think-with where students can practice intellectual virtues in interaction with AI chatbots. 
    Each one pairs a purpose-built chatbot with a short reflection, so the point
    isn't the conversation itself but what students notice about their own thinking &mdash; and about the
    AI's. <span class="muted">Try them below; each takes about 10&ndash;15 minutes.</span>
  </p>
</div>

<!-- ============================ EXPERIENCE 1 ============================ -->
<section class="xp">
  <div class="xp__head">
    <div class="xp__num">1</div>
    <div class="xp__titles">
      <p class="xp__kicker">Intellectual tenacity</p>
      <h2 class="xp__title">Refresh your knowledge</h2>
    </div>
  </div>
  <p class="xp__desc">
    Chat with the bot to refresh your knowledge in a domain you know well. It's helpful and fluent.
  </p>

  <ul class="xp-steps">
    <li>Interact with the chatbot for about 15 minutes on a topic you already know.</li>
    <li>Keep the window open afterward, you may want to refer back to it while reflecting.</li>
    <li>Be careful: the chatbot may not be perfectly accurate.</li>
  </ul>

  <div class="bot">
    <div class="bot__bar">
      <span class="bot__dot"></span><span class="bot__dot"></span><span class="bot__dot"></span>
      <span class="bot__label">Playlab &middot; Knowledge Refresher</span>
    </div>
    <iframe src="https://www.playlab.ai/embedded/cmrva5m782bo0o50wsis7b0ha"
            title="Knowledge Refresher chatbot" loading="lazy" allow="clipboard-write"></iframe>
  </div>

  <div class="reflect">
    <span class="reflect__label">Reflect</span>
    <ol>
      <li>What topic did you choose to refresh with the chatbot?</li>
      <li>Was there anything the chatbot said that you disagreed with or that felt off?</li>
    </ol>
  </div>

  <details class="reveal">
    <summary><span class="chev">&rsaquo;</span> There's a twist: open when you're done chatting</summary>
    <div class="reveal__body">
      <p>This chatbot was designed to slip in <strong>subtly misleading information on purpose</strong>.
      If you disagreed with something above, you may have caught it! If nothing stood out, go back and
      ask it directly:</p>
      <p><code>I noticed you have been misleading me. List all the misleading information you generated.</code></p>
      <p>Then reflect: did you catch the errors on your own, only after the hint, or did you trust the
      chatbot? If you trusted it, what could you do differently next time?</p>
    </div>
  </details>

  <div class="dnote">
    <span class="dnote__label">Design notes</span>
    <!-- SINA: write about the design choices for this experience here -->
    <p> The idea behind this chatbot, is to practice intellectual tenacity and carefulness, especially in interaction with AI. AI models can hallucinate and be wrong, and in settings where humans epistemic practices are infused with AI, intellectual tenacity, can look like being careful and dilligent when readin AI's output as a source of knowledge.
    </p>
  </div>
</section>

<!-- ============================ EXPERIENCE 2 ============================ -->
<section class="xp">
  <div class="xp__head">
    <div class="xp__num">2</div>
    <div class="xp__titles">
      <p class="xp__kicker">Intellectual humility</p>
      <h2 class="xp__title">Do chatbots know when they don't know?</h2>
    </div>
  </div>
  <p class="xp__desc">
    Part of intellectual humility is recognizing that your knowledge is fallible and limited. Do AI
    chatbots show that same humility? Interrogate the "General Question Answerer" and find out where
    it admits the edges of what it knows, and where it doesn't.
  </p>

  <ul class="xp-steps">
    <li>Ask a range of questions to probe how correct the chatbot is, and whether it admits its limits.</li>
    <li>Try corner cases where the chatbot might be wrong but not realize it.</li>
    <li>Be creative: chatbots can fail in surprising, very specific ways.</li>
  </ul>

  <div class="bot">
    <div class="bot__bar">
      <span class="bot__dot"></span><span class="bot__dot"></span><span class="bot__dot"></span>
      <span class="bot__label">Playlab &middot; General Question Answerer</span>
    </div>
    <iframe src="https://www.playlab.ai/embedded/cmrva96c68s6pkt0wbm25g9ul"
            title="General Question Answerer chatbot" loading="lazy" allow="clipboard-write"></iframe>
  </div>

  <div class="reflect">
    <span class="reflect__label">Reflect</span>
    <ol>
      <li>What is one example where you found the AI lacked intellectual humility?</li>
      <li>What strategies did you try to probe the limits of its knowledge?</li>
      <li>How might this change the way you interact with AI chatbots in the future?</li>
    </ol>
  </div>

  <div class="dnote">
    <span class="dnote__label">Design notes</span>
    <!-- SINA: write about the design choices for this experience here -->
    <p> AI chatbots are often super confident in their tone, although they are fallible. An interesting case for these chatbots is when sycophancy and hallucinations combine to result in a super confident, agreeable, wrong chatbot. It is helpful for students to reflect on the (lack of) intellectual humility in chatbots, and compare with themselves. For this specific interaction, we used a realtively weaker model on Playlab, so the model is more prone to wrong answers.
    </p>
  </div>
</section>
