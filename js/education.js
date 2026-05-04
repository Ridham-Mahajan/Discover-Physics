// ===== Educational Mode =====
window.EducationMode = (function() {
  const lessons = {
    intro: {
      title: 'Introduction to Particle Physics',
      content: `<h3>Welcome to the World of Subatomic Particles!</h3>
        <p>Particle physics studies the fundamental building blocks of matter and the forces that govern their interactions. Everything around you — your body, this computer, the stars — is made of just a handful of elementary particles.</p>
        <div class="highlight"><strong>Key Idea:</strong> At the most fundamental level, the universe is made of 12 matter particles (fermions) and 4 force carriers (bosons), plus the Higgs boson.</div>
        <h3>The Large Hadron Collider</h3>
        <p>The LHC at CERN is the world's largest and most powerful particle accelerator. It's a 27 km ring beneath the France-Switzerland border where protons are accelerated to 99.9999991% the speed of light and collided head-on.</p>
        <p>By converting kinetic energy into mass (via E = mc²), these collisions can create particles that haven't existed since moments after the Big Bang.</p>
        <h3>Why Collide Particles?</h3>
        <div class="highlight">Higher energy → smaller distances probed → more massive particles created. The LHC reaches energies of 13.6 TeV, probing distances of ~10⁻¹⁹ meters!</div>`
    },
    particles: {
      title: 'The Particle Zoo',
      content: `<h3>Fermions — The Matter Particles</h3>
        <p>Fermions have half-integer spin and obey the Pauli exclusion principle. They come in two types:</p>
        <div class="highlight"><strong>Quarks</strong> (feel the strong force): up, down, charm, strange, top, bottom<br>
        <strong>Leptons</strong> (no strong force): electron, muon, tau, and their neutrinos</div>
        <h3>Bosons — The Force Carriers</h3>
        <p>Bosons have integer spin and mediate the fundamental forces:</p>
        <p>• <strong>Photon (γ)</strong> — electromagnetic force, massless<br>
        • <strong>W± and Z⁰</strong> — weak force, massive (80.4 and 91.2 GeV)<br>
        • <strong>Gluon (g)</strong> — strong force, massless but self-interacting<br>
        • <strong>Higgs (H⁰)</strong> — gives mass to particles, 125.1 GeV</p>
        <h3>Antimatter</h3>
        <p>Every particle has an antiparticle with the same mass but opposite quantum numbers. When particle meets antiparticle → annihilation into pure energy!</p>`
    },
    forces: {
      title: 'The Four Fundamental Forces',
      content: `<h3>Strong Nuclear Force</h3>
        <p>The strongest force! Holds quarks together inside protons/neutrons and binds nuclei. Carried by gluons. Range: ~10⁻¹⁵ m. Unique property: <strong>confinement</strong> — quarks can never be isolated.</p>
        <h3>Electromagnetic Force</h3>
        <p>Acts on all charged particles. Carried by photons. Infinite range. Responsible for chemistry, light, electricity, and magnetism.</p>
        <div class="highlight"><strong>Coupling strengths at low energy:</strong><br>Strong: α_s ≈ 1 | EM: α ≈ 1/137 | Weak: α_W ≈ 10⁻⁶ | Gravity: ~10⁻³⁹</div>
        <h3>Weak Nuclear Force</h3>
        <p>Responsible for radioactive beta decay and neutrino interactions. Only force that can change quark/lepton flavor. Carried by massive W± and Z⁰ bosons. Short range: ~10⁻¹⁸ m.</p>
        <h3>Gravity</h3>
        <p>By far the weakest at particle scales — not included in the Standard Model. A quantum theory of gravity remains one of physics' greatest open problems.</p>`
    },
    collisions: {
      title: 'Particle Collisions',
      content: `<h3>What Happens in a Collision?</h3>
        <p>When two protons collide at the LHC, it's actually their constituent quarks and gluons (called <strong>partons</strong>) that interact. The process unfolds in stages:</p>
        <p><strong>1. Hard Scattering:</strong> Two partons interact at high energy, described by Feynman diagrams and perturbative QCD.</p>
        <p><strong>2. Parton Shower:</strong> Outgoing partons radiate gluons and quark pairs, creating a cascade.</p>
        <p><strong>3. Hadronization:</strong> Quarks/gluons combine into hadrons (confinement). Models: string fragmentation, cluster hadronization.</p>
        <p><strong>4. Decay:</strong> Unstable hadrons decay into stable particles (p, n, e, γ, ν).</p>
        <div class="highlight"><strong>E = mc² in action:</strong> The kinetic energy of the beams converts into the mass of new particles. To create a particle of mass m, you need √s ≥ 2mc².</div>
        <h3>Cross Sections</h3>
        <p>The probability of a specific process is measured by its cross section σ (in barns). More probable = larger σ. Event rate: N = L × σ.</p>`
    },
    detectors: {
      title: 'How Detectors Work',
      content: `<h3>The Onion-Layer Design</h3>
        <p>Modern particle detectors surround the collision point with concentric layers, each specialized for different particles:</p>
        <p><strong>Layer 1 — Tracker:</strong> Silicon sensors in a magnetic field. Charged particles leave curved tracks → measure momentum via p = 0.3·B·R (GeV, Tesla, meters).</p>
        <p><strong>Layer 2 — ECAL:</strong> Dense crystals where electrons and photons create electromagnetic showers. Measures their energy.</p>
        <p><strong>Layer 3 — HCAL:</strong> Alternating absorber/sensor layers where hadrons shower. Measures hadronic energy.</p>
        <p><strong>Layer 4 — Muon System:</strong> Only muons reach here (they don't shower easily). Gas detectors track them.</p>
        <div class="highlight"><strong>Neutrinos</strong> escape undetected! We infer their presence from <strong>missing transverse energy (MET)</strong> — an imbalance in the total transverse momentum.</div>
        <h3>Particle Signatures</h3>
        <p>• Electrons: track + ECAL cluster<br>• Photons: ECAL cluster, no track<br>• Muons: track through entire detector<br>• Jets: broad HCAL deposits<br>• Neutrinos: missing ET</p>`
    },
    analysis: {
      title: 'Data Analysis Techniques',
      content: `<h3>Key Distributions</h3>
        <p><strong>Transverse Momentum (pT):</strong> Most particles have low pT (soft QCD). High-pT particles come from hard scattering. Distribution follows approximately a power law at high pT.</p>
        <p><strong>Pseudorapidity (η):</strong> Describes angle from beam. η = -ln[tan(θ/2)]. The detector covers |η| < 2.5 typically.</p>
        <p><strong>Invariant Mass:</strong> m² = (ΣE)² - |Σp|². Peaks reveal resonances (parent particles)!</p>
        <div class="highlight"><strong>Discovery Recipe:</strong><br>1. Collect millions of collision events<br>2. Select events matching your signal topology<br>3. Plot invariant mass of decay products<br>4. Look for a bump above the smooth background<br>5. If significance > 5σ → DISCOVERY! 🎉</div>
        <h3>Statistical Significance</h3>
        <p>We quantify discoveries using σ (sigma): probability of background fluctuation.<br>• 3σ = "evidence" (1 in 740 chance of fluctuation)<br>• 5σ = "discovery" (1 in 3.5 million chance)</p>`
    },
    standard_model: {
      title: 'The Standard Model',
      content: `<h3>The Most Successful Theory in Physics</h3>
        <p>The Standard Model (SM) is a quantum field theory that describes three of the four fundamental forces and all known elementary particles. Developed between the 1960s-1970s, it has survived every experimental test with extraordinary precision.</p>
        <div class="highlight"><strong>The Standard Model contains:</strong><br>• 6 quarks (up, down, charm, strange, top, bottom)<br>• 6 leptons (electron, muon, tau + their neutrinos)<br>• 4 force carriers (photon, W±, Z⁰, 8 gluons)<br>• 1 Higgs boson</div>
        <h3>Symmetry Groups</h3>
        <p>The SM is based on the gauge symmetry group SU(3) × SU(2) × U(1):</p>
        <p>• <strong>SU(3):</strong> Quantum Chromodynamics (QCD) — strong force, 8 gluons, color charge<br>
        • <strong>SU(2) × U(1):</strong> Electroweak theory — unifies EM and weak forces</p>
        <h3>Key Predictions Confirmed</h3>
        <p>• W and Z bosons (discovered 1983, Nobel Prize 1984)<br>• Top quark (discovered 1995 at Fermilab)<br>• Tau neutrino (confirmed 2000)<br>• Higgs boson (discovered 2012, Nobel Prize 2013)</p>`
    },
    higgs: {
      title: 'The Higgs Mechanism',
      content: `<h3>Why Do Particles Have Mass?</h3>
        <p>The Higgs mechanism, proposed in 1964 by Peter Higgs and others, explains how particles acquire mass through interaction with the Higgs field — a quantum field that permeates all of space.</p>
        <div class="highlight"><strong>The Higgs Field:</strong> Unlike other quantum fields, the Higgs field has a non-zero value in its ground state (vacuum expectation value v ≈ 246 GeV). Particles that interact with this field gain mass.</div>
        <h3>Spontaneous Symmetry Breaking</h3>
        <p>The electroweak symmetry SU(2) × U(1) is spontaneously broken by the Higgs field. This gives mass to W± and Z⁰ bosons while leaving the photon massless. The "Mexican hat" potential V(φ) = −μ²|φ|² + λ|φ|⁴ describes this process.</p>
        <h3>Discovery at the LHC (2012)</h3>
        <p>The Higgs boson was discovered simultaneously by ATLAS and CMS on July 4, 2012. Key decay channels:</p>
        <p>• H → γγ (diphoton, clean signal)<br>• H → ZZ → 4ℓ (golden channel)<br>• H → WW → ℓνℓν<br>• H → bb̄ (largest branching ratio ~58%)<br>• H → ττ</p>
        <div class="highlight"><strong>Try it!</strong> Run ~10,000 events in this simulator at √s = 13 TeV and look for a bump near 125 GeV in the invariant mass plot!</div>`
    },
    bsm: {
      title: 'Beyond the Standard Model',
      content: `<h3>Open Questions in Physics</h3>
        <p>Despite its success, the Standard Model leaves many questions unanswered:</p>
        <p>• <strong>Dark Matter (27% of universe):</strong> No SM particle matches the observed gravitational effects. Candidates: WIMPs, axions, sterile neutrinos.</p>
        <p>• <strong>Dark Energy (68%):</strong> The accelerating expansion of the universe has no SM explanation.</p>
        <p>• <strong>Matter-Antimatter Asymmetry:</strong> Why is there more matter than antimatter? CP violation in SM is not enough.</p>
        <p>• <strong>Neutrino Masses:</strong> Neutrinos oscillate (change flavor), proving they have mass — but SM predicts massless neutrinos.</p>
        <p>• <strong>Gravity:</strong> Not included in SM. A quantum theory of gravity is needed.</p>
        <div class="highlight"><strong>BSM Theories:</strong><br>• Supersymmetry (SUSY) — doubles the particle spectrum<br>• Extra dimensions — Kaluza-Klein, ADD, Randall-Sundrum<br>• Grand Unified Theories (GUT) — unify strong and electroweak<br>• String Theory — 1D strings instead of point particles</div>
        <h3>What To Look For</h3>
        <p>At the LHC, BSM physics could appear as: new resonances in mass spectra, excess events at high MET (dark matter), deviations from SM predictions, or long-lived particles with displaced vertices.</p>`
    }
  };

  function showLesson(key) {
    const lesson = lessons[key];
    if (!lesson) return;
    document.getElementById('edu-lesson-content').innerHTML = lesson.content;
  }

  function init() { showLesson('intro'); }

  return { init, showLesson, getLessons: () => Object.keys(lessons) };
})();
