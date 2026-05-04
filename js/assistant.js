// ===== AI Physics Assistant =====
window.PhysicsAssistant = (function() {
  const responses = {
    'higgs': 'The **Higgs boson** (H⁰) was discovered in 2012 at the LHC by ATLAS and CMS. It has mass ~125.1 GeV and zero spin. It\'s produced mainly via gluon-gluon fusion (gg→H through a top-quark loop). The Higgs mechanism gives mass to W, Z bosons and fermions via the Higgs field. Key decay channels: H→γγ, H→ZZ→4ℓ, H→WW, H→bb̄, H→ττ.',
    'quark': 'Quarks are fundamental fermions that experience the strong force. There are 6 flavors: up (u), down (d), charm (c), strange (s), top (t), bottom (b). Quarks carry color charge (red, green, blue) and fractional electric charge (+2/3 or -1/3). They\'re never found isolated due to **confinement** — they always form hadrons (baryons: 3 quarks, mesons: quark-antiquark).',
    'standard model': 'The Standard Model describes 17 fundamental particles:\n• **6 quarks**: u, d, c, s, t, b\n• **6 leptons**: e, μ, τ and their neutrinos\n• **4 gauge bosons**: γ (EM), W±/Z⁰ (weak), g (strong)\n• **1 scalar**: Higgs boson\n\nIt explains 3 of 4 fundamental forces (not gravity) and has been tested to incredible precision.',
    'momentum': '**Transverse momentum (pT)** is the component of momentum perpendicular to the beam axis. It\'s crucial at hadron colliders because the initial longitudinal momentum of partons is unknown. Formula: `pT = p·sin(θ)`. High-pT particles often signal interesting physics like heavy particle decays.',
    'pseudorapidity': '**Pseudorapidity (η)** is a spatial coordinate describing the angle of a particle relative to the beam. Formula: `η = -ln[tan(θ/2)]` where θ is the polar angle. η=0 is perpendicular to beam; η→±∞ is along beam. It\'s preferred over θ because differences in η are Lorentz-invariant under boosts along the beam axis.',
    'invariant mass': 'The **invariant mass** of a system of particles is calculated from total energy and momentum: `m² = E² - |p|²c²`. It\'s the same in all reference frames (Lorentz invariant). When two particles come from a resonance decay (like Z→μ⁺μ⁻), their invariant mass peaks at the parent particle\'s mass. This is how we discover new particles!',
    'luminosity': '**Luminosity** measures the collision rate capability: `N = L × σ × t`. Instantaneous luminosity depends on beam parameters: `L = N₁N₂f/(4πσxσy)`. The LHC achieves ~2×10³⁴ cm⁻²s⁻¹. Integrated luminosity (∫L dt) measures total data collected, in units of fb⁻¹. More luminosity = more rare events observed.',
    'jet': 'A **jet** is a collimated spray of hadrons produced when a quark or gluon is produced in a collision. Due to color confinement, the parton can\'t exist freely — it hadronizes into many particles traveling in roughly the same direction. Jets are reconstructed using algorithms like anti-kT with radius parameter R=0.4.',
    'missing energy': '**Missing transverse energy (MET or ETmiss)** is the imbalance of momentum in the transverse plane. Since initial pT is zero, total final pT should also be zero. Significant MET indicates invisible particles (neutrinos, or possibly dark matter) carried away energy. Formula: `MET = -Σ pT(visible)`.',
    'cross section': 'The **cross section (σ)** is the quantum mechanical probability of an interaction, measured in barns (1 barn = 10⁻²⁴ cm²). Common units: pb (picobarn), fb (femtobarn). Example: σ(pp→H) ≈ 50 pb at 13 TeV. The total pp cross section is ~100 mb — dominated by soft QCD.',
    'z boson': 'The **Z boson** is the neutral carrier of the weak force. Mass = 91.1876 GeV, width Γ = 2.4952 GeV. It decays to fermion-antifermion pairs: Z→ℓ⁺ℓ⁻ (3.4% per lepton flavor), Z→qq̄ (70%), Z→νν̄ (20%). The Z peak in the invariant mass spectrum is one of the clearest signals in particle physics.',
    'detector': 'Particle detectors have an onion-like layered structure:\n1. **Tracker**: Measures charged particle tracks in B field → momentum\n2. **ECAL**: Absorbs e±, γ → electromagnetic energy\n3. **HCAL**: Absorbs hadrons → hadronic energy\n4. **Muon System**: Tracks muons that penetrate everything\n\nNeutrinos escape undetected → measured as missing energy.',
    'feynman': '**Feynman diagrams** are pictorial representations of particle interactions in quantum field theory. Rules:\n• Straight lines = fermions (arrows show particle/antiparticle)\n• Wavy lines = photons or W/Z bosons\n• Curly lines = gluons\n• Dashed lines = Higgs\n• Each vertex = interaction point with coupling constant\n\nThe diagram maps to a mathematical amplitude.',
    'qgp': 'The **Quark-Gluon Plasma (QGP)** is a state of matter where quarks and gluons are deconfined — no longer bound inside hadrons. It existed ~microseconds after the Big Bang. Created in heavy-ion collisions (Pb-Pb at LHC). Temperature > 2×10¹² K. Signatures: jet quenching, elliptic flow, J/ψ suppression.',
    'help': 'I can help you with:\n• Particle physics concepts (quarks, leptons, bosons)\n• Explain distributions (pT, η, invariant mass, MET)\n• Detector physics and how particles are detected\n• Feynman diagrams and interaction rules\n• LHC operations and beam physics\n• Your simulation results and what they mean\n\nTry asking about: "higgs", "quarks", "pseudorapidity", "jets", "missing energy", "Z boson", "standard model"'
  };

  function findResponse(input) {
    const q = input.toLowerCase();
    for (const [key, resp] of Object.entries(responses)) {
      if (q.includes(key)) return resp;
    }
    // Fuzzy matching
    if (q.includes('mass') && q.includes('invari')) return responses['invariant mass'];
    if (q.includes('pt') || q.includes('transverse') && q.includes('mom')) return responses['momentum'];
    if (q.includes('eta') || q.includes('rapid')) return responses['pseudorapidity'];
    if (q.includes('met') || q.includes('missing')) return responses['missing energy'];
    if (q.includes('what') && q.includes('can')) return responses['help'];
    if (q.includes('hello') || q.includes('hi')) return 'Hello! I\'m your particle physics assistant. Ask me about any concept — quarks, the Higgs, detectors, or your simulation results. Type "help" to see what I can do!';
    if (q.includes('peak') || q.includes('bump') || q.includes('resonance')) return 'A **resonance peak** appears in the invariant mass spectrum when particles come from the decay of an unstable parent. The peak position gives the parent\'s mass, and the width gives its lifetime via the uncertainty principle: Γ·τ = ℏ. Look for bumps at 91.2 GeV (Z⁰) and 125.1 GeV (H⁰) in your data!';
    if (q.includes('graph') || q.includes('chart') || q.includes('plot')) return 'Your plots show key physics distributions:\n• **pT**: Transverse momentum — falls steeply (Tsallis/power-law). High-pT tails signal hard scattering.\n• **η**: Pseudorapidity — roughly flat near η=0 (central region). Most particles go forward.\n• **Invariant mass**: Look for peaks! Z at 91.2 GeV, Higgs at 125.1 GeV.\n• **φ**: Should be ~uniform (azimuthal symmetry). Deviations signal detector effects.\n• **MET**: Should be small unless neutrinos/new physics present.';
    return 'That\'s an interesting question! While I have knowledge about many particle physics topics, I don\'t have a specific answer for that. Try asking about: the Higgs boson, quarks, detectors, pseudorapidity, invariant mass, jets, missing energy, luminosity, or the Standard Model. Type "help" for a full list!';
  }

  function processMessage(input) { return findResponse(input); }
  return { processMessage };
})();
