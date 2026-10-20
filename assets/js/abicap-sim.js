/*
 * ABICAP interactive simulator.
 *
 * Browser ports of the two agent-based models in github.com/sinaris76/ABICAP:
 *   - the ICAP knowledge-graph model (ABICAP.ipynb, main branch)
 *   - the procedural / mastery model (mastery.ipynb, mastery_model branch)
 *
 * The model code (first half of this file) has no DOM dependencies so it can
 * be run headless under Node for testing; the UI (second half) only runs in a
 * browser.
 */
(function () {
  "use strict";

  // ---------------------------------------------------------------------------
  // Random numbers (seeded so runs are reproducible)
  // ---------------------------------------------------------------------------

  function makeRng(seed) {
    let a = seed >>> 0 || 1;
    const rng = function () {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    rng.int = (n) => Math.floor(rng() * n);
    rng.uniform = (lo, hi) => lo + (hi - lo) * rng();
    rng.shuffle = (arr) => {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = rng.int(i + 1);
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    };
    rng.sample = (arr, k) => rng.shuffle(arr.slice()).slice(0, k);
    return rng;
  }

  // ---------------------------------------------------------------------------
  // Knowledge graph: Watts-Strogatz, following networkx.watts_strogatz_graph
  // ---------------------------------------------------------------------------

  function wattsStrogatz(n, k, p, rng) {
    // Maps keep insertion order, mirroring networkx adjacency order (which the
    // mastery model relies on when it picks "the first two neighbours").
    const adj = Array.from({ length: n }, () => new Map());
    const addEdge = (u, v) => {
      adj[u].set(v, true);
      adj[v].set(u, true);
    };
    const half = Math.floor(k / 2);
    for (let j = 1; j <= half; j++) for (let u = 0; u < n; u++) addEdge(u, (u + j) % n);
    for (let j = 1; j <= half; j++) {
      for (let u = 0; u < n; u++) {
        const v = (u + j) % n;
        if (rng() < p) {
          let w = rng.int(n);
          let skip = false;
          while (w === u || adj[u].has(w)) {
            w = rng.int(n);
            if (adj[u].size >= n - 1) {
              skip = true;
              break;
            }
          }
          if (!skip) {
            adj[u].delete(v);
            adj[v].delete(u);
            addEdge(u, w);
          }
        }
      }
    }
    // Freeze into arrays with stable edge ids.
    const edges = [];
    const ids = new Map();
    const nbrs = [];
    const nbrEdge = [];
    for (let u = 0; u < n; u++) {
      const list = [];
      const elist = [];
      for (const v of adj[u].keys()) {
        const key = u < v ? u * n + v : v * n + u;
        let id = ids.get(key);
        if (id === undefined) {
          id = edges.length;
          ids.set(key, id);
          edges.push([Math.min(u, v), Math.max(u, v)]);
        }
        list.push(v);
        elist.push(id);
      }
      nbrs.push(list);
      nbrEdge.push(elist);
    }
    return { n, edges, nbrs, nbrEdge };
  }

  function buildGraph(params, rng) {
    const g = wattsStrogatz(params.nodes, params.k, params.p, rng);
    const lo = Math.min(params.wMin, params.wMax);
    const hi = Math.max(params.wMin, params.wMax);
    g.w = new Float64Array(g.edges.length);
    for (let e = 0; e < g.edges.length; e++) g.w[e] = rng.uniform(lo, hi);
    return g;
  }

  // Groups are {name, order: [[type, fraction], ...], count}. A learner starts
  // in order[0] and switches to the next type when its clock reaches
  // floor(maxTime * fraction), exactly as in the notebooks.
  function nextType(agent, maxTime) {
    const idx = agent.orderIdx;
    const frac = agent.group.order[idx] ? agent.group.order[idx][1] : null;
    if (frac === null || agent.time !== Math.floor(maxTime * frac)) return false;
    const next = agent.group.order[idx + 1];
    agent.orderIdx = idx + 1;
    // The notebooks would raise an IndexError here; we let the learner stop.
    agent.type = next ? next[0] : "non-learner";
    return true;
  }

  function pairAgents(model, groupName) {
    const pool = model.agents.filter((a) => a.type === "interactive" && a.group.name === groupName);
    model.rng.shuffle(pool);
    for (let i = 0; i + 1 < pool.length; i += 2) {
      model.pairs.set(pool[i], pool[i + 1]);
      model.pairs.set(pool[i + 1], pool[i]);
    }
  }

  function sigmoid(x) {
    return 1 / (1 + Math.exp(-x));
  }

  // ---------------------------------------------------------------------------
  // Model 1: ICAP knowledge-graph model (ABICAP.ipynb)
  // ---------------------------------------------------------------------------

  function runIcap(params, groups, seed) {
    const rng = makeRng(seed);
    const g = buildGraph(params, rng);
    const n = g.n;
    const model = { rng, g, agents: [], pairs: new Map(), node: 0, changed: new Set() };

    // Edge weight between u and one of its neighbours (by position in u's list).
    const strengthFrom = (known, node) => {
      let s = 0;
      const nb = g.nbrs[node];
      const ne = g.nbrEdge[node];
      for (let i = 0; i < nb.length; i++) if (known[nb[i]]) s += g.w[ne[i]];
      return s;
    };

    // Learner.get_learning_strength_for_node
    const strength = (self, node, partner) => {
      if (!partner) return strengthFrom(self.known, node);
      let selfDeg = 0;
      let partnerDeg = 0;
      let both = 0;
      const nb = g.nbrs[node];
      const ne = g.nbrEdge[node];
      for (let i = 0; i < nb.length; i++) {
        const w = g.w[ne[i]];
        const a = self.known[nb[i]];
        const b = partner.known[nb[i]];
        if (a) selfDeg += w;
        if (b) partnerDeg += w;
        if (a && b) both += w;
      }
      return selfDeg + 0.5 * partnerDeg - 0.5 * both;
    };

    // Learner.learn
    const learn = (self, node, easiness, active, partner) => {
      const r = rng();
      const s = active ? strength(self, node, partner) : 0;
      if (r < sigmoid(easiness + s)) {
        if (active) {
          const nb = g.nbrs[node];
          for (let i = 0; i < nb.length; i++) if (self.known[nb[i]]) self.links.push(node, nb[i]);
        }
        self.known[node] = 1;
        self.amount++;
        if (model.focal[node]) self.posttest++;
        return true;
      }
      return false;
    };

    // Learner.sort_neighbors: neighbours ranked by how many of *their*
    // neighbours are already known, ties broken randomly.
    const unlearnedNeighbours = (self, node) =>
      g.nbrs[node]
        .map((v) => {
          let c = 0;
          for (const x of g.nbrs[v]) if (self.known[x]) c++;
          return [v, c + rng()];
        })
        .sort((a, b) => b[1] - a[1])
        .map((x) => x[0])
        .filter((v) => !self.known[v]);

    const interactiveLearn = (self, partner) => {
      const cand = unlearnedNeighbours(self, model.node);
      if (cand.length) {
        const inferred = learn(self, cand[0], -1, true, partner);
        if (inferred && !partner.known[cand[0]]) learn(partner, cand[0], -1, true, self);
      }
    };

    // Create learners, optionally with prior knowledge.
    const allNodes = Array.from({ length: n }, (_, i) => i);
    const prior = Math.min(params.prior || 0, n);
    const sharedPrior = prior ? rng.sample(allNodes, prior) : [];
    for (const grp of groups) {
      for (let c = 0; c < grp.count; c++) {
        const a = {
          group: grp,
          orderIdx: 0,
          type: grp.order[0][0],
          time: 0,
          known: new Uint8Array(n),
          amount: 0,
          posttest: 0,
          links: [],
          prior: [],
          interacted: false,
        };
        if (prior) {
          a.prior = params.differentPrior ? rng.sample(allNodes, prior) : sharedPrior;
          for (const v of a.prior) a.known[v] = 1;
          a.amount = prior;
        }
        model.agents.push(a);
      }
    }
    for (const grp of groups) pairAgents(model, grp.name);

    const steps = params.steps;
    const skip = Math.max(1, params.nodeSkip);
    model.focal = new Uint8Array(n);
    for (let x = 0; x < skip * steps; x += skip) if (x < n) model.focal[x] = 1;

    const agentStep = (a) => {
      if (a.time > params.maxTime - 1) return;
      const node = model.node;
      if (a.type === "passive") {
        if (!a.known[node]) learn(a, node, 0, false);
      } else if (a.type === "active") {
        if (!a.known[node]) learn(a, node, 0, true);
      } else if (a.type === "constructive") {
        const learned = a.known[node] ? true : learn(a, node, 0.25, true);
        if (learned) {
          const cand = unlearnedNeighbours(a, node);
          if (cand.length) learn(a, cand[0], -1, true);
          if (cand.length > 1) learn(a, cand[1], -3, true);
        }
      } else if (a.type === "interactive") {
        if (a.interacted) {
          a.interacted = false;
        } else {
          const partner = model.pairs.get(a);
          if (!partner) {
            // Odd one out (the notebook assumes even group sizes): learn solo.
            if (!a.known[node]) learn(a, node, 0.5, true);
          } else {
            const selfLearned = a.known[node] ? true : learn(a, node, 0.5, true, partner);
            const partnerLearned = partner.known[node] ? true : learn(partner, node, 0.5, true, a);
            if (selfLearned || partnerLearned) {
              interactiveLearn(a, partner);
              interactiveLearn(partner, a);
            }
            partner.interacted = true;
          }
        }
      }
      const prev = a.type;
      if (nextType(a, params.maxTime) && (a.type === "interactive" || prev === "interactive")) {
        model.changed.add(a.group.name);
      }
      a.time += 1;
    };

    const metrics = ["amount", "subgraph", "posttest"];
    const record = newRecord(groups, metrics, steps);
    for (let t = 0; t < steps; t++) {
      if (t === 0) {
        for (const a of model.agents) {
          a.posttest = 0;
          for (const v of a.prior) if (model.focal[v]) a.posttest++;
        }
      }
      for (const a of model.agents) {
        collect(record, a, t, {
          amount: a.amount,
          subgraph: largestComponent(a.links, n),
          posttest: a.posttest,
        });
      }
      for (const a of model.agents) agentStep(a);
      for (const name of model.changed) pairAgents(model, name);
      model.changed.clear();
      model.node += skip;
      if (model.node >= n) model.node -= n % skip === 0 ? n - 1 : n;
    }

    record.graph = g;
    record.nodeValue = nodeShares(groups, model.agents, n, (a, v) => a.known[v]);
    return record;
  }

  // Size of the largest connected component formed by a learner's links (flat
  // [u0, v0, u1, v1, ...] list). 1 when there are no links, as in the notebook.
  function largestComponent(links, n) {
    if (!links.length) return 1;
    const parent = new Int32Array(n).fill(-1);
    const find = (x) => {
      while (parent[x] >= 0 && parent[parent[x]] >= 0) {
        parent[x] = parent[parent[x]];
        x = parent[x];
      }
      return parent[x] >= 0 ? parent[x] : x;
    };
    for (let i = 0; i < links.length; i += 2) {
      const a = find(links[i]);
      const b = find(links[i + 1]);
      if (a !== b) {
        if (parent[a] > parent[b]) {
          parent[b] += parent[a];
          parent[a] = b;
        } else {
          parent[a] += parent[b];
          parent[b] = a;
        }
      }
    }
    let best = 1;
    for (let i = 0; i < n; i++) if (parent[i] < 0 && -parent[i] > best) best = -parent[i];
    return best;
  }

  // ---------------------------------------------------------------------------
  // Model 2: procedural / mastery model (mastery.ipynb)
  // ---------------------------------------------------------------------------

  function runMastery(params, groups, seed) {
    const rng = makeRng(seed);
    const g = buildGraph(params, rng);
    const n = g.n;
    const model = { rng, g, agents: [], pairs: new Map(), changed: new Set() };
    const b = {
      passive: params.bPassive,
      active: params.bActive,
      constructive: params.bConstructive,
      interactive: params.bInteractive,
    };
    // sigmoid(x, b) from mastery.ipynb: 1 / (1 + exp(-(3.5x - b)))
    const sig = (x, bb) => 1 / (1 + Math.exp(-(3.5 * x - bb)));

    // Learner.practice. Each learner keeps its own copy of the edge weights.
    const practice = (a, node, active) => {
      if (node >= n) return;
      let s = 0;
      if (active) {
        const nb = g.nbrs[node];
        const ne = g.nbrEdge[node];
        for (let i = 0; i < nb.length; i++) s += a.w[ne[i]] * a.m[nb[i]];
      }
      a.m[node] = sig(s + a.m[node], b[a.type]);
    };

    // Learner.reinforce_edges (constructive learners strengthen the links
    // between the skill they practise and its first two neighbours).
    const reinforce = (a) => {
      const node = a.pn;
      if (node >= n) return;
      const ne = g.nbrEdge[node];
      if (ne.length > 0) a.w[ne[0]] = Math.min(1, a.w[ne[0]] + 0.15);
      if (ne.length > 1) a.w[ne[1]] = Math.min(1, a.w[ne[1]] + 0.1);
    };

    // Learner.interactive_practice: partners pool their link strengths. When
    // both already agree, the notebook adds min(w + .15, 1) to w, which we keep.
    const share = (a, partner) => {
      const node = a.pn;
      if (node >= n) return;
      const ne = g.nbrEdge[node];
      for (let i = 0; i < Math.min(2, ne.length); i++) {
        const e = ne[i];
        if (a.w[e] === partner.w[e]) {
          a.w[e] += Math.min(a.w[e] + 0.15, 1);
          partner.w[e] = a.w[e];
        } else {
          const mx = Math.max(a.w[e], partner.w[e]);
          a.w[e] = mx;
          partner.w[e] = mx;
        }
      }
    };

    for (const grp of groups) {
      for (let c = 0; c < grp.count; c++) {
        const m = new Float64Array(n);
        for (let v = 0; v < n; v++) m[v] = rng.uniform(0, 0.1);
        model.agents.push({
          group: grp,
          orderIdx: 0,
          type: grp.order[0][0],
          time: 0,
          m,
          w: Float64Array.from(g.w),
          pn: 0,
          cycle: 0,
          interacted: false,
        });
      }
    }
    for (const grp of groups) pairAgents(model, grp.name);

    const reps = Math.max(1, params.practiceReps);
    const cycles = Math.max(1, params.cycles);
    const thr = params.threshold;

    const agentStep = (a) => {
      if (a.type === "non-learner" || a.time > params.maxTime - 1) return;
      if (a.type === "passive") practice(a, a.pn, false);
      else if (a.type === "active") practice(a, a.pn, true);
      else if (a.type === "constructive") {
        practice(a, a.pn, true);
        reinforce(a);
      } else if (a.type === "interactive") {
        if (a.interacted) {
          a.interacted = false;
        } else {
          const partner = model.pairs.get(a);
          practice(a, a.pn, true);
          if (partner) {
            practice(partner, a.pn, true);
            share(a, partner);
            partner.interacted = true;
          }
        }
      }
      // Practise a block of `reps` skills in rotation, `cycles` times, then
      // move on to the next block. Learners who run out of skills stop.
      a.pn += 1;
      if (a.pn % reps === 0) {
        a.pn -= reps;
        a.cycle += 1;
        if (a.cycle === cycles) {
          a.cycle = 0;
          a.pn += reps;
          if (a.pn >= n) a.type = "non-learner";
        }
      }
      if (a.type === "non-learner") return;
      const prev = a.type;
      if (nextType(a, params.maxTime) && (a.type === "interactive" || prev === "interactive")) {
        model.changed.add(a.group.name);
      }
      a.time += 1;
    };

    const metrics = ["knowledge", "mastery"];
    const steps = params.steps;
    const record = newRecord(groups, metrics, steps);
    for (let t = 0; t < steps; t++) {
      for (const a of model.agents) {
        let known = 0;
        let sum = 0;
        for (let v = 0; v < n; v++) {
          sum += a.m[v];
          if (a.m[v] > thr) known++;
        }
        collect(record, a, t, { knowledge: known, mastery: sum / n });
      }
      for (const a of model.agents) agentStep(a);
      for (const name of model.changed) pairAgents(model, name);
      model.changed.clear();
    }

    record.graph = g;
    record.nodeValue = nodeShares(groups, model.agents, n, (a, v) => a.m[v]);
    return record;
  }

  // ---------------------------------------------------------------------------
  // Recording and aggregation
  // ---------------------------------------------------------------------------

  // record[metric][group] is an array (one per step) of per-agent values.
  function newRecord(groups, metrics, steps) {
    const rec = { steps, metrics: {} };
    for (const m of metrics) {
      rec.metrics[m] = {};
      for (const grp of groups) rec.metrics[m][grp.name] = Array.from({ length: steps }, () => []);
    }
    return rec;
  }

  function collect(rec, agent, t, values) {
    for (const m in values) rec.metrics[m][agent.group.name][t].push(values[m]);
  }

  // Mean value per node across each group's learners at the end of a run.
  function nodeShares(groups, agents, n, valueOf) {
    const out = {};
    for (const grp of groups) {
      const members = agents.filter((a) => a.group === grp);
      const arr = new Float64Array(n);
      for (const a of members) for (let v = 0; v < n; v++) arr[v] += valueOf(a, v);
      if (members.length) for (let v = 0; v < n; v++) arr[v] /= members.length;
      out[grp.name] = arr;
    }
    return out;
  }

  // Merge several runs (repeats) and summarise per step: mean, sd, min, max.
  function summarise(records, metric, groupName) {
    const steps = records[0].steps;
    const out = { mean: [], sd: [], min: [], max: [] };
    for (let t = 0; t < steps; t++) {
      let vals = [];
      for (const r of records) vals = vals.concat(r.metrics[metric][groupName][t]);
      const s = stats(vals);
      out.mean.push(s.mean);
      out.sd.push(s.sd);
      out.min.push(s.min);
      out.max.push(s.max);
    }
    return out;
  }

  function stats(vals) {
    if (!vals.length) return { mean: NaN, sd: NaN, min: NaN, max: NaN };
    let sum = 0;
    let min = Infinity;
    let max = -Infinity;
    for (const v of vals) {
      sum += v;
      if (v < min) min = v;
      if (v > max) max = v;
    }
    const mean = sum / vals.length;
    let ss = 0;
    for (const v of vals) ss += (v - mean) * (v - mean);
    const sd = vals.length > 1 ? Math.sqrt(ss / (vals.length - 1)) : 0;
    return { mean, sd, min, max };
  }

  // Parse learner sequences such as "P", "PI", "I C A P" or "P:0.25 A:0.5 I"
  // into group orders. Without explicit fractions the session is split evenly.
  const LETTER = { P: "passive", A: "active", C: "constructive", I: "interactive" };
  function parseSequence(text) {
    const tokens = text
      .toUpperCase()
      .replace(/[^PACI0-9.:]/g, " ")
      .trim()
      .split(/\s+/)
      .flatMap((tok) => (tok.includes(":") ? [tok] : tok.split("")))
      .filter(Boolean);
    const parts = [];
    for (const tok of tokens) {
      const [letter, frac] = tok.split(":");
      if (!LETTER[letter]) return null;
      parts.push([LETTER[letter], frac === undefined ? null : parseFloat(frac)]);
    }
    if (!parts.length) return null;
    const order = parts.map(([type, frac], i) => [type, frac !== null && !isNaN(frac) ? frac : (i + 1) / parts.length]);
    order[order.length - 1][1] = 1;
    return order;
  }

  const ABICAP = { makeRng, wattsStrogatz, runIcap, runMastery, summarise, stats, parseSequence, largestComponent };
  if (typeof module !== "undefined" && module.exports) module.exports = ABICAP;
  if (typeof document === "undefined") return;

  // ===========================================================================
  // UI
  // ===========================================================================

  const PALETTE = ["#56B4E9", "#009E73", "#E69F00", "#CC79A7", "#0072B2", "#D55E00", "#8C8C8C", "#B07AA1"];
  const TYPE_COLOR = { passive: "#56B4E9", active: "#009E73", constructive: "#E69F00", interactive: "#CC79A7" };

  const g = (o) => ({ name: o.name, order: o.order, count: o.count || 50 });
  const pure = (count) => ["passive", "active", "constructive", "interactive"].map((t) => g({ name: t, order: [[t, 1]], count }));

  const MODELS = {
    icap: {
      run: runIcap,
      metrics: [
        { key: "amount", label: "Knowledge amount", y: "Nodes learned" },
        { key: "subgraph", label: "Largest connected subgraph", y: "Nodes in largest component" },
        { key: "posttest", label: "Post-test score", y: "Focal nodes learned" },
      ],
      presets: {
        modes: {
          label: "The four ICAP modes",
          groups: (c) => pure(c),
          params: {},
        },
        twoOrders: {
          label: "Multimodal: P→A→I vs. I→P→A",
          groups: (c) => [
            g({
              name: "P → A → I",
              order: [
                ["passive", 0.25],
                ["active", 0.5],
                ["interactive", 1],
              ],
              count: c,
            }),
            g({
              name: "I → P → A",
              order: [
                ["interactive", 0.5],
                ["passive", 0.75],
                ["active", 1],
              ],
              count: c,
            }),
          ],
          params: { steps: 100 },
        },
        orderings: {
          label: "Multimodal: seven orderings",
          groups: (c) =>
            [
              ["PACI", "passive active constructive interactive"],
              ["APCI", "active passive constructive interactive"],
              ["ICPA", "interactive constructive passive active"],
              ["PICA", "passive interactive constructive active"],
              ["PCIA", "passive constructive interactive active"],
              ["ICAP", "interactive constructive active passive"],
              ["I only", "interactive"],
            ].map(([name, seq]) => {
              const types = seq.split(" ");
              return g({ name, order: types.map((t, i) => [t, (i + 1) / types.length]), count: c });
            }),
          params: { steps: 100 },
        },
        prior: {
          label: "Prior knowledge (50% known up front)",
          groups: (c) => pure(c),
          params: { prior: 50 },
        },
        custom: { label: "Custom sequences…", custom: true, params: {} },
      },
      params: [
        { key: "count", label: "Learners per group", min: 2, max: 100, step: 2, value: 50, group: "Learners" },
        { key: "prior", label: "Prior knowledge (nodes known up front)", min: 0, max: 100, step: 1, value: 0, group: "Learners", sweep: true },
        { key: "differentPrior", label: "Each learner knows different nodes", type: "check", value: false, group: "Learners" },
        { key: "nodes", label: "Concepts (nodes)", min: 10, max: 300, step: 10, value: 100, group: "Knowledge graph", sweep: true },
        {
          key: "k",
          label: "Neighbours per node (k)",
          min: 2,
          max: 20,
          step: 1,
          value: 5,
          group: "Knowledge graph",
          sweep: true,
          hint: "networkx uses ⌊k/2⌋ on each side, so 5 behaves like 4",
        },
        { key: "p", label: "Rewiring probability (p)", min: 0, max: 1, step: 0.05, value: 0.8, group: "Knowledge graph", sweep: true },
        { key: "wMin", label: "Edge weight min", min: 0, max: 2, step: 0.05, value: 0, group: "Knowledge graph", sweep: true },
        { key: "wMax", label: "Edge weight max", min: 0, max: 2, step: 0.05, value: 0.5, group: "Knowledge graph", sweep: true },
        { key: "steps", label: "Steps to simulate", min: 10, max: 300, step: 10, value: 50, group: "Session", sweep: true },
        {
          key: "maxTime",
          label: "Session length (max_time)",
          min: 10,
          max: 300,
          step: 10,
          value: 100,
          group: "Session",
          hint: "Mode switches happen at max_time × fraction",
        },
        { key: "nodeSkip", label: "Node skip", min: 1, max: 10, step: 1, value: 2, group: "Session", sweep: true },
      ],
    },
    mastery: {
      run: runMastery,
      metrics: [
        { key: "knowledge", label: "Skills mastered", y: "Skills above threshold" },
        { key: "mastery", label: "Average mastery", y: "Mean mastery (0–1)" },
      ],
      presets: {
        modes: { label: "The four ICAP modes", groups: (c) => pure(c), params: {} },
        mceldoon: {
          label: "McEldoon et al.: observed vs. ideal",
          groups: (c) => [
            g({ name: "Observed less-FP", order: [["active", 0.5]], count: c }),
            g({ name: "Ideal less-FP", order: [["active", 1]], count: c }),
            g({
              name: "Observed more-FP",
              order: [
                ["constructive", 0.5],
                ["active", 1],
              ],
              count: c,
            }),
            g({ name: "Ideal more-FP", order: [["constructive", 1]], count: c }),
          ],
          params: {},
        },
        custom: { label: "Custom sequences…", custom: true, params: {} },
      },
      params: [
        { key: "count", label: "Learners per group", min: 2, max: 100, step: 2, value: 50, group: "Learners" },
        { key: "nodes", label: "Skills (nodes)", min: 4, max: 60, step: 4, value: 20, group: "Skill graph", sweep: true },
        { key: "k", label: "Neighbours per skill (k)", min: 2, max: 10, step: 1, value: 3, group: "Skill graph", sweep: true },
        { key: "p", label: "Rewiring probability (p)", min: 0, max: 1, step: 0.05, value: 0.9, group: "Skill graph", sweep: true },
        { key: "wMin", label: "Edge weight min", min: 0, max: 1, step: 0.05, value: 0, group: "Skill graph", sweep: true },
        { key: "wMax", label: "Edge weight max", min: 0, max: 1, step: 0.05, value: 0.3, group: "Skill graph", sweep: true },
        { key: "bPassive", label: "Difficulty b — passive", min: 0, max: 3, step: 0.05, value: 1.1, group: "Mode difficulty (b)", sweep: true },
        { key: "bActive", label: "Difficulty b — active", min: 0, max: 3, step: 0.05, value: 1.25, group: "Mode difficulty (b)", sweep: true },
        {
          key: "bConstructive",
          label: "Difficulty b — constructive",
          min: 0,
          max: 3,
          step: 0.05,
          value: 1.4,
          group: "Mode difficulty (b)",
          sweep: true,
        },
        {
          key: "bInteractive",
          label: "Difficulty b — interactive",
          min: 0,
          max: 3,
          step: 0.05,
          value: 1.6,
          group: "Mode difficulty (b)",
          sweep: true,
        },
        { key: "practiceReps", label: "Skills per practice block", min: 1, max: 10, step: 1, value: 4, group: "Practice schedule", sweep: true },
        { key: "cycles", label: "Passes over each block", min: 1, max: 10, step: 1, value: 5, group: "Practice schedule", sweep: true },
        { key: "threshold", label: "Mastery threshold", min: 0.3, max: 0.95, step: 0.05, value: 0.7, group: "Practice schedule", sweep: true },
        { key: "steps", label: "Steps to simulate", min: 10, max: 300, step: 10, value: 70, group: "Session", sweep: true },
        {
          key: "maxTime",
          label: "Session length (max_time)",
          min: 10,
          max: 300,
          step: 10,
          value: 100,
          group: "Session",
          hint: "Mode switches happen at max_time × fraction",
        },
      ],
    },
  };

  // ---------------------------------------------------------------------------
  // Small DOM helpers
  // ---------------------------------------------------------------------------

  const SVGNS = "http://www.w3.org/2000/svg";
  function el(tag, attrs, ...kids) {
    const node = document.createElement(tag);
    for (const k in attrs || {}) {
      if (k === "class") node.className = attrs[k];
      else if (k.startsWith("on")) node.addEventListener(k.slice(2), attrs[k]);
      else if (attrs[k] !== undefined && attrs[k] !== null && attrs[k] !== false) node.setAttribute(k, attrs[k]);
    }
    for (const kid of kids.flat()) if (kid !== null && kid !== undefined) node.append(kid);
    return node;
  }
  function svg(tag, attrs) {
    const node = document.createElementNS(SVGNS, tag);
    for (const k in attrs || {}) node.setAttribute(k, attrs[k]);
    return node;
  }
  const fmt = (v, d) => (Number.isFinite(v) ? v.toFixed(d === undefined ? (Math.abs(v) < 10 ? 2 : 1) : d) : "–");
  const decimals = (step) => (String(step).split(".")[1] || "").length;
  const nextFrame = () => new Promise((r) => setTimeout(r, 0));

  function niceTicks(lo, hi, count) {
    if (!(hi > lo)) hi = lo + 1;
    const span = hi - lo;
    const raw = span / count;
    const mag = Math.pow(10, Math.floor(Math.log10(raw)));
    const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => span / s <= count) || 10 * mag;
    const ticks = [];
    for (let v = Math.ceil(lo / step) * step; v <= hi + step * 1e-9; v += step) ticks.push(+v.toFixed(10));
    return ticks;
  }

  // ---------------------------------------------------------------------------
  // Line chart with uncertainty bands and a hover read-out
  // ---------------------------------------------------------------------------

  function lineChart(host, opts) {
    host.innerHTML = "";
    const W = 720;
    const H = 360;
    const M = { l: 56, r: 16, t: 14, b: 44 };
    const series = opts.series;
    const xs = series.flatMap((s) => s.x);
    const ys = series.flatMap((s) => s.lo.concat(s.hi, s.mean)).filter(Number.isFinite);
    const x0 = Math.min(...xs);
    const x1 = Math.max(...xs);
    const yMax = Math.max(...ys, 0);
    const yMin = Math.min(...ys, 0);
    const yt = niceTicks(yMin, yMax || 1, 5);
    const xt = niceTicks(x0, x1 === x0 ? x0 + 1 : x1, 6);
    const ylo = Math.min(yt[0], yMin);
    const yhi = Math.max(yt[yt.length - 1], yMax);
    const sx = (v) => M.l + ((v - x0) / (x1 - x0 || 1)) * (W - M.l - M.r);
    const sy = (v) => H - M.b - ((v - ylo) / (yhi - ylo || 1)) * (H - M.t - M.b);

    const root = svg("svg", { viewBox: `0 0 ${W} ${H}`, class: "abi-chart__svg", role: "img", "aria-label": opts.aria || "chart" });
    for (const t of yt) {
      root.append(svg("line", { x1: M.l, x2: W - M.r, y1: sy(t), y2: sy(t), class: "abi-grid" }));
      const lab = svg("text", { x: M.l - 8, y: sy(t) + 4, "text-anchor": "end", class: "abi-tick" });
      lab.textContent = fmt(t, decimals(t));
      root.append(lab);
    }
    for (const t of xt) {
      if (t < x0 || t > x1) continue;
      const lab = svg("text", { x: sx(t), y: H - M.b + 18, "text-anchor": "middle", class: "abi-tick" });
      lab.textContent = fmt(t, decimals(t));
      root.append(lab);
    }
    root.append(svg("line", { x1: M.l, x2: W - M.r, y1: H - M.b, y2: H - M.b, class: "abi-axis" }));
    const xl = svg("text", { x: (M.l + W - M.r) / 2, y: H - 6, "text-anchor": "middle", class: "abi-axis-label" });
    xl.textContent = opts.xLabel;
    root.append(xl);
    const yl = svg("text", {
      x: 14,
      y: (M.t + H - M.b) / 2,
      "text-anchor": "middle",
      class: "abi-axis-label",
      transform: `rotate(-90 14 ${(M.t + H - M.b) / 2})`,
    });
    yl.textContent = opts.yLabel;
    root.append(yl);

    for (const s of series) {
      if (opts.band && !s.ghost) {
        const pts = s.x.map((x, i) => `${sx(x)},${sy(s.hi[i])}`).concat(s.x.map((x, i) => `${sx(x)},${sy(s.lo[i])}`).reverse());
        root.append(svg("polygon", { points: pts.join(" "), fill: s.color, opacity: 0.14 }));
      }
    }
    for (const s of series) {
      const d = s.x.map((x, i) => `${i ? "L" : "M"}${sx(x).toFixed(1)},${sy(s.mean[i]).toFixed(1)}`).join("");
      root.append(
        svg("path", {
          d,
          fill: "none",
          stroke: s.color,
          "stroke-width": s.ghost ? 1.5 : 2.25,
          "stroke-dasharray": s.ghost ? "5 4" : "none",
          opacity: s.ghost ? 0.75 : 1,
        })
      );
      if (opts.markers) for (let i = 0; i < s.x.length; i++) root.append(svg("circle", { cx: sx(s.x[i]), cy: sy(s.mean[i]), r: 3.5, fill: s.color }));
    }

    const rule = svg("line", { y1: M.t, y2: H - M.b, class: "abi-rule", visibility: "hidden" });
    root.append(rule);
    const hit = svg("rect", { x: M.l, y: M.t, width: W - M.l - M.r, height: H - M.t - M.b, fill: "transparent" });
    root.append(hit);

    const tip = el("div", { class: "abi-tip", hidden: true });
    const wrap = el("div", { class: "abi-chart" }, root, tip);
    host.append(wrap);
    const legend = el("div", { class: "abi-legend" });
    for (const s of series) {
      legend.append(
        el(
          "span",
          { class: "abi-legend__item" + (s.ghost ? " is-ghost" : "") },
          el("span", { class: "abi-swatch", style: `background:${s.color}` }),
          s.name
        )
      );
    }
    host.append(legend);

    const move = (evt) => {
      const box = root.getBoundingClientRect();
      const px = ((evt.clientX - box.left) / box.width) * W;
      const xv = x0 + ((px - M.l) / (W - M.l - M.r)) * (x1 - x0);
      const ref = series.find((s) => !s.ghost) || series[0];
      let idx = 0;
      for (let i = 1; i < ref.x.length; i++) if (Math.abs(ref.x[i] - xv) < Math.abs(ref.x[idx] - xv)) idx = i;
      const xx = ref.x[idx];
      rule.setAttribute("x1", sx(xx));
      rule.setAttribute("x2", sx(xx));
      rule.setAttribute("visibility", "visible");
      tip.innerHTML = "";
      tip.append(el("div", { class: "abi-tip__head" }, `${opts.xLabel}: ${fmt(xx, decimals(xx))}`));
      const rows = series
        .map((s) => ({ s, i: s.x.indexOf(xx) }))
        .filter((r) => r.i >= 0)
        .sort((a, b) => b.s.mean[b.i] - a.s.mean[a.i]);
      for (const { s, i } of rows) {
        tip.append(
          el(
            "div",
            { class: "abi-tip__row" },
            el("span", { class: "abi-swatch", style: `background:${s.color}` }),
            el("span", { class: "abi-tip__name" }, s.name),
            el("b", null, fmt(s.mean[i]))
          )
        );
      }
      tip.hidden = false;
      const left = (sx(xx) / W) * box.width;
      tip.style.left = left > box.width / 2 ? "" : `${left + 12}px`;
      tip.style.right = left > box.width / 2 ? `${box.width - left + 12}px` : "";
    };
    hit.addEventListener("mousemove", move);
    hit.addEventListener("mouseleave", () => {
      tip.hidden = true;
      rule.setAttribute("visibility", "hidden");
    });
  }

  // Circle layout of the knowledge graph, nodes shaded by how much of each
  // concept the selected group learned (or mastered) by the end of the run.
  function graphView(host, record, groupName, color) {
    host.innerHTML = "";
    const g2 = record.graph;
    const vals = record.nodeValue[groupName];
    const S = 320;
    const R = S / 2 - 18;
    const pos = (i) => [S / 2 + R * Math.cos((2 * Math.PI * i) / g2.n - Math.PI / 2), S / 2 + R * Math.sin((2 * Math.PI * i) / g2.n - Math.PI / 2)];
    const root = svg("svg", { viewBox: `0 0 ${S} ${S}`, class: "abi-graph__svg", role: "img", "aria-label": "Knowledge graph" });
    const wmax = Math.max(...g2.w, 1e-9);
    g2.edges.forEach(([u, v], e) => {
      const [a, b] = [pos(u), pos(v)];
      root.append(svg("line", { x1: a[0], y1: a[1], x2: b[0], y2: b[1], class: "abi-edge", "stroke-opacity": 0.12 + 0.5 * (g2.w[e] / wmax) }));
    });
    const r = Math.max(2.2, Math.min(7, 260 / g2.n));
    for (let i = 0; i < g2.n; i++) {
      const [x, y] = pos(i);
      const c = svg("circle", { cx: x, cy: y, r, fill: color, "fill-opacity": 0.08 + 0.92 * Math.max(0, Math.min(1, vals[i])), class: "abi-node" });
      const t = svg("title", {});
      t.textContent = `Node ${i}: ${fmt(vals[i] * 100, 0)}%`;
      c.append(t);
      root.append(c);
    }
    host.append(root);
  }

  // ---------------------------------------------------------------------------
  // A simulator panel (one per model)
  // ---------------------------------------------------------------------------

  function mountSimulator(host) {
    const cfg = MODELS[host.dataset.model];
    if (!cfg) return;
    const state = { values: {}, preset: Object.keys(cfg.presets)[0], metric: cfg.metrics[0].key, band: "range", pinned: null, last: null };
    for (const p of cfg.params) state.values[p.key] = p.value;
    state.custom = host.dataset.model === "icap" ? "P, A, C, I, PI, IP" : "A, C, CA, AC";

    // ---- controls -----------------------------------------------------------
    const inputs = {};
    const presetSel = el("select", { class: "abi-select", "aria-label": "Scenario" });
    for (const k in cfg.presets) presetSel.append(el("option", { value: k }, cfg.presets[k].label));
    const customInput = el("input", {
      class: "abi-text",
      type: "text",
      value: state.custom,
      "aria-label": "Custom learner sequences",
      spellcheck: "false",
    });
    const customRow = el(
      "div",
      { class: "abi-custom", hidden: true },
      el("label", { class: "abi-label" }, "Groups (comma-separated)"),
      customInput,
      el(
        "p",
        { class: "abi-hint" },
        "Letters P, A, C, I in the order a learner moves through them, e.g. ",
        el("code", null, "PI"),
        " = passive then interactive. Add fractions to set switch points: ",
        el("code", null, "P:0.3 I"),
        "."
      )
    );
    const seedInput = el("input", { class: "abi-num", type: "number", value: 42, min: 1, "aria-label": "Random seed" });
    const repeatsInput = el("input", { class: "abi-num", type: "number", value: 1, min: 1, max: 20, "aria-label": "Repeats" });

    const fieldsets = {};
    for (const p of cfg.params) {
      if (!fieldsets[p.group]) fieldsets[p.group] = el("fieldset", { class: "abi-fieldset" }, el("legend", null, p.group));
      let control;
      if (p.type === "check") {
        const box = el("input", { type: "checkbox" });
        box.checked = p.value;
        box.addEventListener("change", () => (state.values[p.key] = box.checked));
        inputs[p.key] = { set: (v) => (box.checked = v) };
        control = el("label", { class: "abi-check" }, box, " ", p.label);
      } else {
        const out = el("output", { class: "abi-out" }, fmt(p.value, decimals(p.step)));
        const range = el("input", { type: "range", min: p.min, max: p.max, step: p.step, value: p.value, "aria-label": p.label });
        range.addEventListener("input", () => {
          state.values[p.key] = parseFloat(range.value);
          out.textContent = fmt(state.values[p.key], decimals(p.step));
        });
        inputs[p.key] = {
          set: (v) => {
            range.value = v;
            out.textContent = fmt(v, decimals(p.step));
          },
        };
        control = el(
          "div",
          { class: "abi-slider" },
          el("div", { class: "abi-slider__top" }, el("label", { class: "abi-label" }, p.label), out),
          range,
          p.hint ? el("p", { class: "abi-hint" }, p.hint) : null
        );
      }
      fieldsets[p.group].append(control);
    }
    const setParam = (k, v) => {
      state.values[k] = v;
      inputs[k].set(v);
    };

    const applyPreset = () => {
      state.preset = presetSel.value;
      const preset = cfg.presets[state.preset];
      customRow.hidden = !preset.custom;
      for (const p of cfg.params) setParam(p.key, preset.params[p.key] !== undefined ? preset.params[p.key] : p.value);
    };
    presetSel.addEventListener("change", applyPreset);

    const groupsNow = () => {
      const preset = cfg.presets[state.preset];
      const count = state.values.count;
      if (!preset.custom) return preset.groups(count);
      const groups = [];
      for (const raw of customInput.value.split(",")) {
        const name = raw.trim();
        if (!name) continue;
        const order = parseSequence(name);
        if (!order) throw new Error(`Couldn't read "${name}". Use the letters P, A, C and I.`);
        groups.push(g({ name: name.toUpperCase(), order, count }));
      }
      if (!groups.length) throw new Error("Add at least one group.");
      return groups;
    };

    const colorFor = (groups) => {
      const used = {};
      let i = 0;
      return groups.map((grp) => {
        const single = grp.order.length === 1 ? TYPE_COLOR[grp.order[0][0]] : null;
        let c = single && !used[single] ? single : null;
        while (!c) {
          const cand = PALETTE[i++ % PALETTE.length];
          if (!used[cand] || i > PALETTE.length) c = cand;
        }
        used[c] = true;
        return c;
      });
    };

    // ---- run panel ----------------------------------------------------------
    const status = el("span", { class: "abi-status", role: "status" });
    const runBtn = el("button", { class: "abi-btn abi-btn--primary", type: "button" }, "▶ Run simulation");
    const rerollBtn = el("button", { class: "abi-btn", type: "button", title: "New random seed, then run" }, "New seed");
    const pinBtn = el(
      "button",
      { class: "abi-btn", type: "button", disabled: true, title: "Keep this run as dashed lines for comparison" },
      "Pin for comparison"
    );
    const resetBtn = el("button", { class: "abi-btn abi-btn--ghost", type: "button" }, "Reset");

    const metricTabs = el("div", { class: "abi-tabs", role: "tablist" });
    const tabBtns = cfg.metrics.map((m) => {
      const b = el(
        "button",
        {
          type: "button",
          role: "tab",
          class: "abi-tab",
          onclick: () => {
            state.metric = m.key;
            draw();
          },
        },
        m.label
      );
      metricTabs.append(b);
      return [m.key, b];
    });
    const bandSel = el(
      "select",
      { class: "abi-select abi-select--sm", "aria-label": "Band" },
      el("option", { value: "range" }, "Band: min–max"),
      el("option", { value: "sd" }, "Band: ±1 SD"),
      el("option", { value: "none" }, "No band")
    );
    bandSel.addEventListener("change", () => {
      state.band = bandSel.value;
      draw();
    });

    const chartHost = el("div", { class: "abi-chart-host" }, el("p", { class: "abi-empty" }, "Press “Run simulation” to see the learning curves."));
    const tableHost = el("div", { class: "abi-table-host" });
    const graphSel = el("select", { class: "abi-select abi-select--sm", "aria-label": "Group shown on graph" });
    const graphHost = el("div", { class: "abi-graph" });
    const graphCaption = el("p", { class: "abi-hint" });
    const graphBox = el(
      "div",
      { class: "abi-graphbox", hidden: true },
      el(
        "div",
        { class: "abi-graphbox__head" },
        el("span", { class: "abi-mini-title" }, host.dataset.model === "icap" ? "Knowledge graph after the run" : "Skill graph after the run"),
        graphSel
      ),
      graphHost,
      graphCaption
    );
    graphSel.addEventListener("change", () => drawGraph());

    const summary = (records, groups, colors) =>
      groups.map((grp, i) => {
        const s = summarise(records, state.metric, grp.name);
        const x = s.mean.map((_, t) => t);
        const lo = state.band === "sd" ? s.mean.map((m, t) => m - s.sd[t]) : s.min;
        const hi = state.band === "sd" ? s.mean.map((m, t) => m + s.sd[t]) : s.max;
        return { name: grp.name, color: colors[i], x, mean: s.mean, lo, hi, sd: s.sd };
      });

    function draw() {
      for (const [k, b] of tabBtns) b.setAttribute("aria-selected", String(k === state.metric));
      if (!state.last) return;
      const metric = cfg.metrics.find((m) => m.key === state.metric);
      const { records, groups, colors } = state.last;
      const series = summary(records, groups, colors);
      let all = series;
      if (state.pinned) {
        const ghost = summary(state.pinned.records, state.pinned.groups, state.pinned.colors).map((s) => ({
          ...s,
          name: `${s.name} (pinned)`,
          ghost: true,
        }));
        all = ghost.concat(series);
      }
      lineChart(chartHost, { series: all, xLabel: "Step", yLabel: metric.y, band: state.band !== "none", aria: metric.label });

      // Final-step table
      const rows = series.map((s) => {
        const t = s.mean.length - 1;
        return { s, mean: s.mean[t], sd: s.sd[t] };
      });
      const best = Math.max(...rows.map((r) => r.mean));
      const table = el(
        "table",
        { class: "abi-table" },
        el("thead", null, el("tr", null, el("th", null, "Group"), el("th", null, `${metric.label} at final step`), el("th", null, "SD")))
      );
      const tb = el("tbody");
      for (const r of rows.sort((a, b) => b.mean - a.mean)) {
        tb.append(
          el(
            "tr",
            null,
            el("td", null, el("span", { class: "abi-swatch", style: `background:${r.s.color}` }), r.s.name),
            el("td", null, el("span", { class: "abi-bar", style: `--w:${best > 0 ? (100 * r.mean) / best : 0}%;--c:${r.s.color}` }), fmt(r.mean)),
            el("td", { class: "abi-muted" }, fmt(r.sd))
          )
        );
      }
      table.append(tb);
      tableHost.innerHTML = "";
      tableHost.append(table);
    }

    function drawGraph() {
      if (!state.last) return;
      const { records, groups, colors } = state.last;
      const idx = Math.max(
        0,
        groups.findIndex((grp) => grp.name === graphSel.value)
      );
      graphView(graphHost, records[records.length - 1], groups[idx].name, colors[idx]);
      graphCaption.textContent =
        host.dataset.model === "icap"
          ? "Each dot is a concept; darker means a larger share of this group learned it. Edge opacity shows the edge weight. Shown for the last repeat."
          : "Each dot is a skill; darker means higher average mastery in this group. Edge opacity shows the starting edge weight. Shown for the last repeat.";
    }

    let busy = false;
    async function run() {
      if (busy) return;
      let groups;
      try {
        groups = groupsNow();
      } catch (e) {
        status.textContent = e.message;
        status.classList.add("is-error");
        return;
      }
      status.classList.remove("is-error");
      busy = true;
      runBtn.disabled = true;
      const repeats = Math.max(1, Math.min(20, parseInt(repeatsInput.value, 10) || 1));
      const seed = parseInt(seedInput.value, 10) || 1;
      const params = { ...state.values };
      const records = [];
      const t0 = performance.now();
      for (let r = 0; r < repeats; r++) {
        status.textContent = repeats > 1 ? `Running ${r + 1} of ${repeats}…` : "Running…";
        await nextFrame();
        records.push(cfg.run(params, groups, seed + r * 7919));
      }
      const colors = colorFor(groups);
      state.last = { records, groups, colors };
      const total = groups.reduce((s, grp) => s + grp.count, 0);
      status.textContent = `${total} learners × ${params.steps} steps${repeats > 1 ? ` × ${repeats} repeats` : ""} · ${Math.round(
        performance.now() - t0
      )} ms`;
      pinBtn.disabled = false;
      graphSel.innerHTML = "";
      for (const grp of groups) graphSel.append(el("option", { value: grp.name }, grp.name));
      graphSel.value = groups[groups.length - 1].name;
      graphBox.hidden = false;
      draw();
      drawGraph();
      busy = false;
      runBtn.disabled = false;
    }

    runBtn.addEventListener("click", run);
    rerollBtn.addEventListener("click", () => {
      seedInput.value = 1 + Math.floor(Math.random() * 99999);
      run();
    });
    pinBtn.addEventListener("click", () => {
      if (!state.last) return;
      state.pinned = state.pinned === state.last ? null : state.last;
      pinBtn.textContent = state.pinned ? "Unpin" : "Pin for comparison";
      draw();
    });
    resetBtn.addEventListener("click", () => {
      presetSel.value = Object.keys(cfg.presets)[0];
      applyPreset();
      state.pinned = null;
      pinBtn.textContent = "Pin for comparison";
      seedInput.value = 42;
      repeatsInput.value = 1;
      run();
    });

    // ---- parameter sweep ----------------------------------------------------
    const sweepParams = cfg.params.filter((p) => p.sweep);
    const sweepSel = el("select", { class: "abi-select", "aria-label": "Parameter to vary" });
    for (const p of sweepParams) sweepSel.append(el("option", { value: p.key }, p.label));
    const fromIn = el("input", { class: "abi-num", type: "number", step: "any", "aria-label": "From" });
    const toIn = el("input", { class: "abi-num", type: "number", step: "any", "aria-label": "To" });
    const ptsIn = el("input", { class: "abi-num", type: "number", value: 6, min: 2, max: 15, "aria-label": "Values" });
    const sRepIn = el("input", { class: "abi-num", type: "number", value: 3, min: 1, max: 10, "aria-label": "Runs per value" });
    const sMetric = el("select", { class: "abi-select", "aria-label": "Outcome" });
    for (const m of cfg.metrics) sMetric.append(el("option", { value: m.key }, m.label));
    const sweepStatus = el("span", { class: "abi-status", role: "status" });
    const sweepBtn = el("button", { class: "abi-btn abi-btn--primary", type: "button" }, "▶ Run sweep");
    const sweepHost = el(
      "div",
      { class: "abi-chart-host" },
      el("p", { class: "abi-empty" }, "Pick a parameter and a range, then run the sweep. The other parameters keep the values set above.")
    );
    const setSweepDefaults = () => {
      const p = sweepParams.find((q) => q.key === sweepSel.value);
      const cur = state.values[p.key];
      const span = (p.max - p.min) / 4;
      fromIn.value = +Math.max(p.min, cur - span).toFixed(4);
      toIn.value = +Math.min(p.max, cur + span).toFixed(4);
      if (+fromIn.value === +toIn.value) toIn.value = p.max;
    };
    sweepSel.addEventListener("change", setSweepDefaults);
    setSweepDefaults();

    let sweeping = false;
    sweepBtn.addEventListener("click", async () => {
      if (sweeping) return;
      let groups;
      try {
        groups = groupsNow();
      } catch (e) {
        sweepStatus.textContent = e.message;
        return;
      }
      const p = sweepParams.find((q) => q.key === sweepSel.value);
      const pts = Math.max(2, Math.min(15, parseInt(ptsIn.value, 10) || 6));
      const reps = Math.max(1, Math.min(10, parseInt(sRepIn.value, 10) || 3));
      const a = parseFloat(fromIn.value);
      const b = parseFloat(toIn.value);
      if (!Number.isFinite(a) || !Number.isFinite(b)) {
        sweepStatus.textContent = "Enter a numeric range.";
        return;
      }
      const isInt = Number.isInteger(p.step);
      let values = Array.from({ length: pts }, (_, i) => a + ((b - a) * i) / (pts - 1)).map((v) =>
        isInt ? Math.round(v / p.step) * p.step : +v.toFixed(4)
      );
      values = [...new Set(values)];
      const metric = cfg.metrics.find((m) => m.key === sMetric.value);
      sweeping = true;
      sweepBtn.disabled = true;
      const colors = colorFor(groups);
      const per = groups.map(() => ({ mean: [], lo: [], hi: [] }));
      const seed = parseInt(seedInput.value, 10) || 1;
      const t0 = performance.now();
      let done = 0;
      for (const v of values) {
        const finals = groups.map(() => []);
        for (let r = 0; r < reps; r++) {
          sweepStatus.textContent = `Run ${++done} of ${values.length * reps}…`;
          await nextFrame();
          const params = { ...state.values, [p.key]: v };
          if (p.key === "k") params.k = Math.min(params.k, params.nodes - 1);
          const rec = cfg.run(params, groups, seed + r * 7919);
          groups.forEach((grp, gi) => {
            const last = rec.metrics[metric.key][grp.name][rec.steps - 1];
            finals[gi].push(stats(last).mean);
          });
        }
        groups.forEach((_, gi) => {
          const s = stats(finals[gi]);
          per[gi].mean.push(s.mean);
          per[gi].lo.push(s.mean - s.sd);
          per[gi].hi.push(s.mean + s.sd);
        });
      }
      const series = groups.map((grp, gi) => ({ name: grp.name, color: colors[gi], x: values, ...per[gi] }));
      lineChart(sweepHost, {
        series,
        xLabel: p.label,
        yLabel: `${metric.label} at final step`,
        band: reps > 1,
        markers: true,
        aria: "Parameter sweep",
      });
      sweepStatus.textContent = `${values.length} values × ${reps} runs · ${
        (performance.now() - t0) / 1000 < 1 ? Math.round(performance.now() - t0) + " ms" : ((performance.now() - t0) / 1000).toFixed(1) + " s"
      }${reps > 1 ? " · band = ±1 SD across runs" : ""}`;
      sweeping = false;
      sweepBtn.disabled = false;
    });

    // ---- layout -------------------------------------------------------------
    const controls = el(
      "div",
      { class: "abi-controls" },
      el("div", { class: "abi-fieldset abi-fieldset--plain" }, el("label", { class: "abi-label" }, "Scenario"), presetSel, customRow),
      Object.values(fieldsets),
      el(
        "fieldset",
        { class: "abi-fieldset" },
        el("legend", null, "Randomness"),
        el(
          "div",
          { class: "abi-inline" },
          el("label", { class: "abi-label" }, "Seed", seedInput),
          el("label", { class: "abi-label" }, "Repeats", repeatsInput)
        ),
        el("p", { class: "abi-hint" }, "Same seed + same settings = same result. Repeats pool learners across several random graphs.")
      )
    );
    const results = el(
      "div",
      { class: "abi-results" },
      el("div", { class: "abi-actions" }, runBtn, rerollBtn, pinBtn, resetBtn),
      status,
      el("div", { class: "abi-toolbar" }, metricTabs, bandSel),
      chartHost,
      tableHost,
      graphBox
    );
    const sweep = el(
      "div",
      { class: "abi-sweep" },
      el("p", { class: "abi-mini-title" }, "Run an experiment: sweep one parameter"),
      el(
        "div",
        { class: "abi-sweep__form" },
        el("label", { class: "abi-label" }, "Vary", sweepSel),
        el("label", { class: "abi-label" }, "From", fromIn),
        el("label", { class: "abi-label" }, "To", toIn),
        el("label", { class: "abi-label" }, "Values", ptsIn),
        el("label", { class: "abi-label" }, "Runs each", sRepIn),
        el("label", { class: "abi-label" }, "Outcome", sMetric),
        sweepBtn
      ),
      sweepStatus,
      sweepHost
    );
    const toggle = el("button", { class: "abi-btn abi-btn--ghost abi-toggle", type: "button", "aria-expanded": "true" }, "Hide parameters");
    const body = el("div", { class: "abi-body" }, controls, results);
    toggle.addEventListener("click", () => {
      const open = controls.hidden;
      controls.hidden = !open;
      body.classList.toggle("is-collapsed", !open);
      toggle.textContent = open ? "Hide parameters" : "Show parameters";
      toggle.setAttribute("aria-expanded", String(open));
    });
    // On narrow screens, start with the parameters folded away so the chart is visible.
    if (window.matchMedia && window.matchMedia("(max-width: 991px)").matches) toggle.click();
    host.innerHTML = "";
    host.append(
      el(
        "div",
        { class: "abi-panel" },
        el(
          "div",
          { class: "abi-panel__bar" },
          el("span", { class: "bot__dot" }),
          el("span", { class: "bot__dot" }),
          el("span", { class: "bot__dot" }),
          el("span", { class: "bot__label" }, host.dataset.title || "Simulator"),
          toggle
        ),
        body,
        sweep
      )
    );

    // Let the page link to a scenario, e.g. data-preset="twoOrders".
    if (host.dataset.preset && cfg.presets[host.dataset.preset]) presetSel.value = host.dataset.preset;
    applyPreset();
    draw();
    run();

    // Buttons elsewhere on the page can load a scenario into this simulator.
    host.loadScenario = (presetKey, overrides) => {
      presetSel.value = presetKey;
      applyPreset();
      for (const k in overrides || {}) if (inputs[k]) setParam(k, overrides[k]);
      if (overrides && overrides.custom !== undefined) customInput.value = overrides.custom;
      run();
    };
  }

  function init() {
    document.querySelectorAll("[data-abicap-sim]").forEach(mountSimulator);
    document.querySelectorAll("[data-abicap-try]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const target = document.getElementById(btn.dataset.target);
        if (!target || !target.loadScenario) return;
        target.loadScenario(btn.dataset.abicapTry, JSON.parse(btn.dataset.overrides || "{}"));
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
