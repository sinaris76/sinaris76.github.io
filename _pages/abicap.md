---
layout: page
title: ABICAP
permalink: /projects/abicap/
description: An agent-based model of the ICAP framework you can run in your browser.
nav: false
---

<style>
  /* ---------- Layout & rhythm (shared with the AI for IV page) ---------- */
  .aiv-hero { margin: 0.5rem 0 2.5rem; }
  .aiv-hero__eyebrow {
    font-size: 0.72rem; letter-spacing: 0.09em; text-transform: uppercase;
    font-weight: 600; color: var(--global-theme-color); margin: 0 0 0.5rem;
  }
  .aiv-hero__lede { font-size: 1.12rem; line-height: 1.7; color: var(--global-text-color); }
  .aiv-hero__lede .muted { color: var(--global-text-color-light); }
  .aiv-hero__links { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 1rem; }
  .aiv-hero__links a {
    font-size: 0.82rem; font-weight: 600; padding: 0.3rem 0.85rem; border-radius: 999px;
    border: 1px solid var(--global-divider-color); text-decoration: none;
  }
  .aiv-hero__links a:hover { border-color: var(--global-theme-color); }

  .aiv-back { display: inline-block; margin-bottom: 1.5rem; font-weight: 600; font-size: 0.9rem; }
  .aiv-back .arrow { display: inline-block; transition: transform 0.18s ease; }
  .aiv-back:hover .arrow { transform: translateX(-4px); }

  .xp {
    border: 1px solid var(--global-divider-color); border-radius: 20px;
    background-color: var(--global-card-bg-color); padding: 1.5rem; margin: 2rem 0;
  }
  @media (min-width: 576px) { .xp { padding: 2.5rem; } }
  .xp__head { display: flex; align-items: flex-start; gap: 1rem; margin-bottom: 1rem; }
  .xp__num {
    flex: 0 0 auto; width: 2.4rem; height: 2.4rem; display: grid; place-items: center;
    border-radius: 50%; background: var(--global-theme-color); color: #fff; font-weight: 700; font-size: 1.05rem;
  }
  .xp__titles { flex: 1 1 auto; }
  .xp__kicker {
    font-size: 0.72rem; letter-spacing: 0.08em; text-transform: uppercase;
    font-weight: 600; color: var(--global-text-color-light); margin: 0.2rem 0 0.15rem;
  }
  .xp__title { font-size: 1.5rem; font-weight: 700; margin: 0; line-height: 1.25; color: var(--global-text-color); }
  .xp__desc { color: var(--global-text-color-light); line-height: 1.65; margin: 0.25rem 0 0; }

  .xp-steps { list-style: none; padding: 0; margin: 1.5rem 0 0; }
  .xp-steps li { position: relative; padding-left: 1.9rem; margin-bottom: 0.6rem; color: var(--global-text-color); line-height: 1.55; }
  .xp-steps li::before { content: "→"; position: absolute; left: 0; top: 0; color: var(--global-theme-color); font-weight: 700; }

  .bot__dot { width: 0.7rem; height: 0.7rem; border-radius: 50%; background: var(--global-divider-color); }
  .bot__label { margin-left: 0.4rem; font-size: 0.8rem; font-weight: 600; color: var(--global-text-color-light); }

  .reflect { margin-top: 1.75rem; padding: 1.4rem 1.5rem; border-radius: 14px;
             background: rgba(128,128,128,0.06); border: 1px solid var(--global-divider-color); }
  .reflect__label {
    display: inline-flex; align-items: center; gap: 0.45rem; font-size: 0.74rem; letter-spacing: 0.07em;
    text-transform: uppercase; font-weight: 700; color: var(--global-theme-color); margin-bottom: 0.7rem;
  }
  .reflect ol { margin: 0; padding-left: 1.2rem; }
  .reflect li { margin-bottom: 0.75rem; line-height: 1.6; color: var(--global-text-color); }
  .reflect li:last-child { margin-bottom: 0; }

  .reveal { margin-top: 1.25rem; border-radius: 14px; border: 1px dashed var(--global-theme-color);
            background: rgba(128,128,128,0.04); overflow: hidden; }
  .reveal > summary { cursor: pointer; list-style: none; padding: 1rem 1.3rem; font-weight: 600;
    color: var(--global-text-color); display: flex; align-items: center; gap: 0.6rem; }
  .reveal > summary::-webkit-details-marker { display: none; }
  .reveal > summary .chev { transition: transform 0.2s ease; color: var(--global-theme-color); }
  .reveal[open] > summary .chev { transform: rotate(90deg); }
  .reveal__body { padding: 0 1.3rem 1.3rem; line-height: 1.65; color: var(--global-text-color); }

  .dnote { margin-top: 1.5rem; padding: 1.3rem 1.5rem; border-radius: 14px;
    border-left: 4px solid var(--global-theme-color); background: rgba(128,128,128,0.05); }
  .dnote__label { display: inline-flex; align-items: center; gap: 0.45rem; font-size: 0.74rem; letter-spacing: 0.07em;
    text-transform: uppercase; font-weight: 700; color: var(--global-text-color-light); margin-bottom: 0.55rem; }
  .dnote p { margin: 0 0 0.6rem; line-height: 1.7; color: var(--global-text-color); }
  .dnote p:last-child { margin-bottom: 0; }

  /* ---------- ICAP mode glossary ---------- */
  .modes { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 0.75rem; margin: 1.5rem 0 0; }
  .mode { border: 1px solid var(--global-divider-color); border-radius: 12px; padding: 0.9rem 1rem; border-top: 4px solid var(--c); }
  .mode b { display: block; color: var(--global-text-color); margin-bottom: 0.2rem; }
  .mode span { font-size: 0.88rem; line-height: 1.5; color: var(--global-text-color-light); }

  /* ---------- Simulator ---------- */
  .abi-panel { margin: 1.75rem 0 0; border: 1px solid var(--global-divider-color); border-radius: 14px; overflow: hidden;
    box-shadow: 0 10px 30px rgba(0,0,0,0.08); background: var(--global-bg-color); }
  .abi-panel__bar { display: flex; align-items: center; gap: 0.55rem; padding: 0.7rem 1rem;
    border-bottom: 1px solid var(--global-divider-color); }
  .abi-toggle { margin-left: auto; flex: 0 0 auto; }
  .abi-panel__bar .bot__label { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0; }
  @media (max-width: 575px) { .abi-panel__bar .bot__dot { display: none; } .abi-panel__bar .bot__label { margin-left: 0; } }
  .abi-body { display: grid; grid-template-columns: minmax(0, 1fr); }
  @media (min-width: 992px) {
    .abi-body { grid-template-columns: 290px minmax(0, 1fr); }
    .abi-body.is-collapsed { grid-template-columns: minmax(0, 1fr); }
    .abi-controls { border-right: 1px solid var(--global-divider-color); max-height: 1100px; overflow-y: auto; }
  }
  .abi-controls { padding: 1rem 1.1rem; border-bottom: 1px solid var(--global-divider-color); }
  @media (min-width: 992px) { .abi-controls { border-bottom: 0; } }
  .abi-results { padding: 1rem 1.1rem 1.25rem; min-width: 0; }

  .abi-fieldset { border: 0; padding: 0; margin: 0 0 1.1rem; min-width: 0; }
  .abi-fieldset legend { font-size: 0.7rem; letter-spacing: 0.08em; text-transform: uppercase; font-weight: 700;
    color: var(--global-theme-color); margin-bottom: 0.45rem; float: none; width: auto; padding: 0; }
  .abi-label { display: flex; flex-direction: column; gap: 0.2rem; font-size: 0.82rem; font-weight: 600; color: var(--global-text-color); margin: 0; }
  .abi-slider { margin-bottom: 0.65rem; }
  .abi-slider__top { display: flex; justify-content: space-between; align-items: baseline; gap: 0.5rem; }
  .abi-slider__top .abi-label { font-weight: 500; }
  .abi-out { font-variant-numeric: tabular-nums; font-size: 0.82rem; font-weight: 700; color: var(--global-text-color); }
  .abi-slider input[type="range"] { width: 100%; accent-color: var(--global-theme-color); margin: 0.15rem 0 0; }
  .abi-hint { font-size: 0.74rem; line-height: 1.45; color: var(--global-text-color-light); margin: 0.2rem 0 0; }
  .abi-hint code { font-size: 0.95em; }
  .abi-check { display: flex; gap: 0.4rem; align-items: center; font-size: 0.82rem; margin: 0 0 0.6rem; color: var(--global-text-color); }
  .abi-check input { accent-color: var(--global-theme-color); }
  .abi-inline { display: flex; gap: 0.75rem; }
  .abi-select, .abi-num, .abi-text {
    font: inherit; font-size: 0.85rem; font-weight: 400; color: var(--global-text-color); background: var(--global-bg-color);
    border: 1px solid var(--global-divider-color); border-radius: 8px; padding: 0.35rem 0.5rem; width: 100%; min-width: 0;
  }
  .abi-select--sm { width: auto; font-size: 0.8rem; padding: 0.25rem 0.4rem; }
  .abi-num { width: 6rem; }
  .abi-custom { margin-top: 0.6rem; }
  .abi-custom .abi-text { margin-top: 0.2rem; font-family: var(--global-code-font, monospace); }

  .abi-actions { display: flex; flex-wrap: wrap; gap: 0.5rem; }
  .abi-btn { font: inherit; font-size: 0.85rem; font-weight: 600; padding: 0.45rem 0.9rem; border-radius: 999px; cursor: pointer;
    border: 1px solid var(--global-divider-color); background: transparent; color: var(--global-text-color);
    transition: border-color 0.15s ease, opacity 0.15s ease; }
  .abi-btn:hover:not(:disabled) { border-color: var(--global-theme-color); }
  .abi-btn:disabled { opacity: 0.5; cursor: default; }
  .abi-btn--primary { background: var(--global-theme-color); border-color: var(--global-theme-color); color: #fff; }
  .abi-btn--ghost { border-color: transparent; color: var(--global-text-color-light); padding-left: 0.6rem; padding-right: 0.6rem; }
  .abi-status { display: block; min-height: 1.3em; margin: 0.5rem 0 0.25rem; font-size: 0.78rem; color: var(--global-text-color-light); font-variant-numeric: tabular-nums; }
  .abi-status.is-error { color: #d55e00; font-weight: 600; }

  .abi-toolbar { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 0.5rem; margin: 0.5rem 0 0.25rem; }
  .abi-tabs { display: inline-flex; flex-wrap: wrap; gap: 0.25rem; padding: 0.2rem; border-radius: 16px; border: 1px solid var(--global-divider-color); }
  .abi-tab { font: inherit; font-size: 0.8rem; font-weight: 600; padding: 0.3rem 0.8rem; border-radius: 999px; border: 0;
    background: transparent; color: var(--global-text-color-light); cursor: pointer; }
  .abi-tab[aria-selected="true"] { background: var(--global-theme-color); color: #fff; }

  .abi-chart-host { margin-top: 0.5rem; }
  .abi-chart { position: relative; }
  .abi-chart__svg { display: block; width: 100%; height: auto; overflow: visible; }
  .abi-grid { stroke: var(--global-divider-color); stroke-width: 1; }
  .abi-axis { stroke: var(--global-text-color-light); stroke-width: 1; }
  .abi-tick { fill: var(--global-text-color-light); font-size: 12px; font-variant-numeric: tabular-nums; }
  .abi-axis-label { fill: var(--global-text-color-light); font-size: 12.5px; font-weight: 600; }
  .abi-rule { stroke: var(--global-text-color-light); stroke-dasharray: 3 3; }
  .abi-tip { position: absolute; top: 0.5rem; z-index: 2; min-width: 170px; padding: 0.55rem 0.7rem; border-radius: 10px; pointer-events: none;
    background: var(--global-bg-color); border: 1px solid var(--global-divider-color); box-shadow: 0 6px 18px rgba(0,0,0,0.12); font-size: 0.78rem; }
  .abi-tip__head { font-weight: 700; margin-bottom: 0.25rem; color: var(--global-text-color); }
  .abi-tip__row { display: flex; align-items: center; gap: 0.4rem; color: var(--global-text-color); }
  .abi-tip__name { flex: 1 1 auto; color: var(--global-text-color-light); }
  .abi-tip__row b { font-variant-numeric: tabular-nums; }
  .abi-legend { display: flex; flex-wrap: wrap; gap: 0.35rem 1rem; margin: 0.4rem 0 0 3rem; font-size: 0.8rem; color: var(--global-text-color); }
  .abi-legend__item { display: inline-flex; align-items: center; gap: 0.35rem; }
  .abi-legend__item.is-ghost { opacity: 0.7; font-style: italic; }
  .abi-swatch { display: inline-block; flex: 0 0 auto; width: 0.7rem; height: 0.7rem; border-radius: 3px; margin-right: 0.35rem; vertical-align: -0.05em; }
  .abi-tip .abi-swatch, .abi-legend .abi-swatch { margin-right: 0; }
  .abi-empty { padding: 3rem 1rem; text-align: center; color: var(--global-text-color-light); font-size: 0.9rem;
    border: 1px dashed var(--global-divider-color); border-radius: 12px; margin: 0; }

  .abi-table-host { margin-top: 1rem; overflow-x: auto; }
  .abi-table { width: 100%; border-collapse: collapse; font-size: 0.84rem; }
  .abi-table th { text-align: left; font-size: 0.7rem; letter-spacing: 0.06em; text-transform: uppercase; font-weight: 700;
    color: var(--global-text-color-light); padding: 0.35rem 0.5rem; border-bottom: 1px solid var(--global-divider-color); }
  .abi-table td { padding: 0.4rem 0.5rem; border-bottom: 1px solid var(--global-divider-color); color: var(--global-text-color);
    font-variant-numeric: tabular-nums; white-space: nowrap; }
  .abi-table td:nth-child(2) { width: 55%; }
  .abi-bar { display: inline-block; height: 0.55rem; width: calc(var(--w) * 0.7); background: var(--c); border-radius: 3px; margin-right: 0.5rem; opacity: 0.85; }
  .abi-muted { color: var(--global-text-color-light) !important; }

  .abi-graphbox { margin-top: 1.25rem; padding-top: 1rem; border-top: 1px solid var(--global-divider-color); }
  .abi-graphbox__head { display: flex; justify-content: space-between; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
  .abi-mini-title { font-size: 0.72rem; letter-spacing: 0.08em; text-transform: uppercase; font-weight: 700; color: var(--global-text-color-light); margin: 0; }
  .abi-graph { max-width: 340px; margin: 0.5rem auto 0; }
  .abi-graph__svg { display: block; width: 100%; height: auto; }
  .abi-edge { stroke: var(--global-text-color); stroke-width: 0.8; }
  .abi-node { stroke: var(--global-bg-color); stroke-width: 0.6; }

  .abi-sweep { border-top: 1px solid var(--global-divider-color); padding: 1rem 1.1rem 1.25rem; background: rgba(128,128,128,0.035); }
  .abi-sweep__form { display: flex; flex-wrap: wrap; align-items: flex-end; gap: 0.6rem 0.75rem; margin-top: 0.6rem; }
  .abi-sweep__form .abi-label:first-child { flex: 1 1 200px; }
  .abi-sweep__form .abi-num { width: 5.2rem; }
  .abi-sweep__form .abi-select { width: auto; }

  .try { display: inline; font: inherit; font-size: 0.82rem; font-weight: 600; color: var(--global-theme-color); background: none;
    border: 1px solid var(--global-theme-color); border-radius: 999px; padding: 0.05rem 0.6rem; margin-left: 0.3rem; cursor: pointer; white-space: nowrap; }
  .try:hover { background: var(--global-theme-color); color: #fff; }
</style>

<a class="aiv-back" href="{{ '/projects/' | relative_url }}"><span class="arrow">&larr;</span>&nbsp;All projects</a>

<div class="aiv-hero">
  <p class="aiv-hero__eyebrow">Agent-based modeling of ICAP</p>
  <p class="aiv-hero__lede">
    The <a href="https://doi.org/10.1080/00461520.2014.965823" target="_blank" rel="noopener">ICAP framework</a> (Chi &amp; Wylie, 2014) predicts that learning improves as students move from
    <strong>Passive</strong> to <strong>Active</strong> to <strong>Constructive</strong> to <strong>Interactive</strong> engagement.
    ABICAP turns that verbal theory into a computational one: simulated learners walk through a network of connected ideas, and each mode of
    engagement is a concrete rule for how they learn from it. Once a theory is a model, you can poke at it, asking when the ordering holds,
    when it breaks, and what the theory left unsaid.
    <span class="muted">Both models below run entirely in your browser. Change a parameter, press run, and compare.</span>
  </p>
  <div class="aiv-hero__links">
    <a href="https://doi.org/10.1007/978-3-031-36272-9_73" target="_blank" rel="noopener">Paper (AIED 2023)</a>
    <a href="https://github.com/sinaris76/ABICAP" target="_blank" rel="noopener">Source code</a>
    <a href="https://github.com/sinaris76/ABICAP/tree/mastery_model" target="_blank" rel="noopener">Mastery model branch</a>
  </div>
</div>

<div class="modes">
  <div class="mode" style="--c:#56B4E9"><b>Passive</b><span>Receives information without doing anything with it. Learns each concept on its own, ignoring links to what it already knows.</span></div>
  <div class="mode" style="--c:#009E73"><b>Active</b><span>Manipulates the material. Prior knowledge of connected concepts makes a new concept easier to learn.</span></div>
  <div class="mode" style="--c:#E69F00"><b>Constructive</b><span>Generates beyond the material. After learning a concept, tries to infer neighbouring concepts that were never presented.</span></div>
  <div class="mode" style="--c:#CC79A7"><b>Interactive</b><span>Co-constructs with a partner. Pairs draw on each other's knowledge and pass inferences back and forth.</span></div>
</div>

<!-- ============================ MODEL 1 ============================ -->
<section class="xp" id="knowledge-graph-model">
  <div class="xp__head">
    <div class="xp__num">1</div>
    <div class="xp__titles">
      <p class="xp__kicker">Conceptual knowledge &middot; AIED 2023</p>
      <h2 class="xp__title">Learning a network of concepts</h2>
    </div>
  </div>
  <p class="xp__desc">
    The domain is a random <em>small-world</em> knowledge graph: nodes are concepts and weighted edges are how strongly two ideas support each other.
    A lesson presents one concept per step. Each learner learns it with probability
    <code>sigmoid(easiness + strength)</code>, where <em>strength</em> is the total weight of edges to concepts the learner already knows.
    Passive learners get no strength bonus, constructive learners also try to infer two neighbouring concepts, and interactive pairs pool their knowledge.
  </p>

  <ul class="xp-steps">
    <li>Press <strong>Run</strong> to simulate 50 learners in each mode, then switch between the three outcomes above the chart.</li>
    <li>Move the sliders and run again. <strong>Pin</strong> a run first to keep it on the chart as dashed lines for comparison.</li>
    <li>Use the <strong>sweep</strong> at the bottom to run a small experiment: vary one parameter and see how each group's final outcome responds.</li>
  </ul>

  <div id="sim-icap" data-abicap-sim data-model="icap" data-title="ABICAP &middot; Knowledge-graph model">
    <p class="abi-empty">The simulator needs JavaScript to run.</p>
  </div>

  <div class="reflect">
    <span class="reflect__label">Experiments to try</span>
    <ol>
      <li>Is the ICAP ordering a property of the learners, or of the domain? Set <em>Edge weight max</em> to 0 so concepts are unrelated.
        <button class="try" type="button" data-abicap-try="modes" data-target="sim-icap" data-overrides='{"wMax":0}'>Try it</button>
        Which advantages disappear, and which survive?</li>
      <li>Does it matter <em>when</em> a learner is interactive? Compare passive&rarr;active&rarr;interactive with interactive&rarr;passive&rarr;active.
        <button class="try" type="button" data-abicap-try="twoOrders" data-target="sim-icap">Try it</button>
        Why might starting passive help later interaction?</li>
      <li>Give every learner half the concepts up front, as in classroom studies where students arrive with prior knowledge.
        <button class="try" type="button" data-abicap-try="prior" data-target="sim-icap">Try it</button>
        Look at the <em>post-test</em> tab: do the gaps between modes shrink?</li>
      <li>Sweep <em>Rewiring probability</em> from 0 (an orderly lattice of ideas) to 1 (a random tangle). Which mode depends most on the shape of the domain?</li>
    </ol>
  </div>

  <details class="reveal">
    <summary><span class="chev">&rsaquo;</span> What we found in the paper</summary>
    <div class="reveal__body">
      <p>With the default settings the model reproduces the ICAP hypothesis, I&nbsp;&gt;&nbsp;C&nbsp;&gt;&nbsp;A&nbsp;&gt;&nbsp;P, both in <em>how much</em> learners know
      and in <em>how connected</em> their knowledge is. The gaps grow with edge weights, because the richer the connections between ideas, the more there is to gain from engaging with them.</p>
      <p>Some predictions are less obvious. Moving from passive to interactive beats moving from interactive to passive: our hypothesis is that learners who spend time passively first arrive at the interaction with knowledge to share.
      The model can also be set up to mirror classroom studies, for example by giving every learner substantial prior knowledge and comparing post-test gains with those reported by Menekse et al. (2013).</p>
    </div>
  </details>

  <div class="dnote">
    <span class="dnote__label">Design notes</span>
    <!-- SINA: edit or extend these notes -->
    <p>ICAP is a verbal theory, and verbal theories leave a lot unsaid: what does it mean, mechanically, to &ldquo;construct&rdquo; knowledge? Writing an agent-based model forces those decisions into the open.
    Every rule here is one possible reading of the theory, and the point of a model like this is less to predict test scores than to give researchers an object to think with,
    a place to ask &ldquo;if this is how constructive learning works, what else must be true?&rdquo;</p>
    <p>This page is a JavaScript port of the notebook in the repository. Runs are seeded, so the same settings give the same result. Numbers will be close to, but not identical with, the Python version, since the random number generators differ.</p>
  </div>
</section>

<!-- ============================ MODEL 2 ============================ -->
<section class="xp" id="mastery-model">
  <div class="xp__head">
    <div class="xp__num">2</div>
    <div class="xp__titles">
      <p class="xp__kicker">Procedural knowledge &middot; mastery model</p>
      <h2 class="xp__title">Practising connected skills to mastery</h2>
    </div>
  </div>
  <p class="xp__desc">
    Skills aren't simply known or unknown; they are practised and strengthened. In this extension, every learner has a <em>mastery level</em> between 0 and 1 for each skill in a small skill graph.
    Learners practise skills in blocks (four skills, five passes each, by default), and each practice step updates mastery with
    <code>sigmoid(3.5&middot;(mastery + support) &minus; b)</code>, where <em>support</em> comes from mastery of connected skills.
    Passive practice gets no support. Constructive learners also strengthen the links between skills, and interactive pairs share their strongest links with each other.
  </p>

  <ul class="xp-steps">
    <li>A skill counts as <strong>mastered</strong> once its level passes the threshold (0.7 by default). <em>Average mastery</em> shows the continuous picture.</li>
    <li>The four <em>difficulty b</em> sliders set how hard each mode's practice step is. Larger b means each step moves mastery less.</li>
    <li>The <em>McEldoon et al.</em> scenario mimics a classroom finding: students asked to be constructive often slip back to active halfway through.</li>
  </ul>

  <div id="sim-mastery" data-abicap-sim data-model="mastery" data-title="ABICAP &middot; Mastery model">
    <p class="abi-empty">The simulator needs JavaScript to run.</p>
  </div>

  <div class="reflect">
    <span class="reflect__label">Experiments to try</span>
    <ol>
      <li>By default, constructive and interactive practice have <em>harder</em> steps (higher b), yet they reach higher average mastery. Make all four b values equal (say 1.25):
        <button class="try" type="button" data-abicap-try="modes" data-target="sim-mastery" data-overrides='{"bPassive":1.25,"bActive":1.25,"bConstructive":1.25,"bInteractive":1.25}'>Try it</button>
        how much of the advantage comes from strengthening links between skills?</li>
      <li>Load the McEldoon scenario.
        <button class="try" type="button" data-abicap-try="mceldoon" data-target="sim-mastery">Try it</button>
        How much does &ldquo;observed&rdquo; constructive work, which drifts back to active halfway, lose compared with the ideal?</li>
      <li>Sweep <em>Passes over each block</em>. Is there a point where extra practice stops paying off, and does it differ by mode?</li>
      <li>Sweep the <em>Mastery threshold</em>. Do conclusions about which mode is &ldquo;best&rdquo; depend on where you draw the line for mastery?</li>
    </ol>
  </div>

  <div class="dnote">
    <span class="dnote__label">Design notes</span>
    <!-- SINA: edit or extend these notes -->
    <p>The first model treats knowledge as all-or-nothing, which fits concepts better than skills. The mastery model asks how ICAP would play out for procedural knowledge,
    where repeated practice gradually builds fluency and skills support one another. It is work in progress, ported from the <code>mastery_model</code> branch of the repository,
    and it is used to compare against classroom data such as McEldoon, Durkin &amp; Rittle-Johnson (2013).</p>
  </div>
</section>

<script defer src="{{ '/assets/js/abicap-sim.js' | relative_url | bust_file_cache }}"></script>
