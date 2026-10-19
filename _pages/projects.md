---
layout: page
title: projects
permalink: /projects/
description: Learning experiences and tools we design to study and support how people learn with AI.
nav: true
nav_order: 3
---

<style>
  .proj-index { margin-top: 1.5rem; }
  .proj-card {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.25rem;
    padding: 1.75rem;
    border: 1px solid var(--global-divider-color);
    border-radius: 18px;
    background-color: var(--global-card-bg-color);
    text-decoration: none !important;
    color: inherit;
    transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
  }
  .proj-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.10);
    border-color: var(--global-theme-color);
  }
  .proj-card__eyebrow {
    font-size: 0.72rem;
    letter-spacing: 0.09em;
    text-transform: uppercase;
    font-weight: 600;
    color: var(--global-theme-color);
    margin: 0 0 0.35rem;
  }
  .proj-card__title {
    font-size: 1.55rem;
    font-weight: 700;
    margin: 0 0 0.5rem;
    color: var(--global-text-color);
  }
  .proj-card__desc {
    margin: 0 0 0.9rem;
    color: var(--global-text-color-light);
    line-height: 1.6;
  }
  .proj-card__tags { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.5rem; }
  .proj-tag {
    font-size: 0.74rem;
    font-weight: 500;
    padding: 0.2rem 0.7rem;
    border-radius: 999px;
    border: 1px solid var(--global-divider-color);
    color: var(--global-text-color-light);
  }
  .proj-card__cta {
    font-weight: 600;
    color: var(--global-theme-color);
    font-size: 0.95rem;
  }
  .proj-card:hover .proj-card__cta .arrow { transform: translateX(4px); }
  .proj-card__cta .arrow { display: inline-block; transition: transform 0.18s ease; }
</style>

<div class="proj-index">

<a class="proj-card" href="{{ '/projects/ai-for-iv/' | relative_url }}">
  <div>
    <p class="proj-card__eyebrow">AI for Intellectual Virtues</p>
    <h2 class="proj-card__title">AI&nbsp;for&nbsp;IV</h2>
    <div class="proj-card__tags">
      <span class="proj-tag">Learning design</span>
      <span class="proj-tag">Intellectual virtues</span>
      <span class="proj-tag">Playlab chatbots</span>
    </div>
    <p class="proj-card__desc">
      A set of AI-powered learning experiences designed to practice specific intellectual virtues, such as humility, tenacity, and curiosity. 
      The full course is currently being studied in a randomized controlled study. Try the chatbots and reflect.
    </p>
    <span class="proj-card__cta">Explore the experiences&nbsp;<span class="arrow">&rarr;</span></span>
  </div>
</a>

</div>
