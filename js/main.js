// ===== Main Application Controller =====
(function() {
  const PD = window.PhysicsData;
  const Sim = window.SimulationEngine;
  const Viz = window.CollisionViz;
  const Charts = window.ChartsManager;
  const Det = window.DetectorExplorer;
  const Feyn = window.FeynmanDiagram;
  const Asst = window.PhysicsAssistant;
  const Edu = window.EducationMode;

  // App State
  const state = {
    collisionType: 'pp', beam1: 'proton', beam2: 'proton',
    energy: 13.6, luminosity: 34.3, beamSpread: 3.5, impactParam: 0,
    detector: 'CMS', replaySpeed: 1, currentEvent: null,
    challengesCompleted: new Set(), savedExperiments: []
  };

  // ===== INITIALIZATION =====
  let simInitialized = false;
  let particleAnimId = null;

  function init() {
    setTimeout(() => {
      document.getElementById('loading-screen').classList.add('fade-out');
      setTimeout(() => document.getElementById('loading-screen').style.display='none', 600);
    }, 2200);
    showPage('home');
    bindPageNav();
    bindSidebar();
    bindPanelCollapse();
    initParticleCanvas();
    updateFooterClock();
    setInterval(updateFooterClock, 1000);
  }

  function initSimulator() {
    if (simInitialized) return;
    simInitialized = true;
    Viz.init(document.getElementById('threejs-container'), document.getElementById('collision-canvas'));
    Charts.init('chart-main');
    Edu.init();
    bindEvents();
    bindGraphAnalysis();
    updateDetectorSpecs();
    updateEventSummary(null);
    toast('LHC Simulator initialized. Ready for collisions!', 'success');
  }

  // ===== PARTICLE CANVAS (Home Page Background) =====
  function initParticleCanvas() {
    const c = document.getElementById('particle-canvas');
    if (!c) return;
    const ctx = c.getContext('2d');
    let pts = [];
    function resize() { c.width = c.clientWidth * (window.devicePixelRatio||1); c.height = c.clientHeight * (window.devicePixelRatio||1); }
    resize(); window.addEventListener('resize', resize);
    for (let i=0; i<60; i++) pts.push({x:Math.random()*c.width, y:Math.random()*c.height, vx:(Math.random()-.5)*.4, vy:(Math.random()-.5)*.4, r:Math.random()*2+1, a:Math.random()*.5+.2});
    function draw() {
      particleAnimId = requestAnimationFrame(draw);
      ctx.clearRect(0,0,c.width,c.height);
      pts.forEach(p => { p.x+=p.vx; p.y+=p.vy; if(p.x<0||p.x>c.width) p.vx*=-1; if(p.y<0||p.y>c.height) p.vy*=-1;
        ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fillStyle=`rgba(0,229,255,${p.a})`; ctx.fill();
      });
      for(let i=0;i<pts.length;i++) for(let j=i+1;j<pts.length;j++) {
        const dx=pts[i].x-pts[j].x, dy=pts[i].y-pts[j].y, d=Math.sqrt(dx*dx+dy*dy);
        if(d<120) { ctx.beginPath(); ctx.moveTo(pts[i].x,pts[i].y); ctx.lineTo(pts[j].x,pts[j].y); ctx.strokeStyle=`rgba(0,229,255,${.08*(1-d/120)})`; ctx.stroke(); }
      }
    }
    draw();
  }

  // ===== SIDEBAR =====
  function bindSidebar() {
    const toggle = document.getElementById('sidebar-toggle');
    const menu = document.getElementById('sidebar-menu');
    const autoHide = document.getElementById('sidebar-autohide');
    if (!toggle || !menu) return;
    toggle.addEventListener('click', () => menu.classList.toggle('open'));
    menu.querySelectorAll('.sidebar-link[data-page]').forEach(link => {
      link.addEventListener('click', e => { e.preventDefault(); showPage(link.dataset.page);
        menu.querySelectorAll('.sidebar-link').forEach(l=>l.classList.remove('active')); link.classList.add('active');
        if (autoHide && autoHide.checked) menu.classList.remove('open');
      });
    });
    document.addEventListener('click', e => { if (!menu.contains(e.target) && e.target !== toggle && !toggle.contains(e.target)) menu.classList.remove('open'); });
  }

  // ===== PANEL COLLAPSE =====
  function bindPanelCollapse() {
    const cl = document.getElementById('collapse-left');
    const cr = document.getElementById('collapse-right');
    const main = document.getElementById('main-content');
    if (cl) cl.addEventListener('click', () => {
      const p = document.getElementById('left-panel');
      p.classList.add('collapsed'); main.classList.add('left-collapsed');
      cl.style.display = 'none';
      // Show reopen strip
      let strip = document.getElementById('left-reopen');
      if (!strip) { strip = document.createElement('div'); strip.id='left-reopen'; strip.className='panel-reopen-strip'; strip.textContent='▶ Open Controls'; document.getElementById('center-panel').appendChild(strip); }
      strip.classList.remove('hidden');
      strip.onclick = () => { p.classList.remove('collapsed'); main.classList.remove('left-collapsed'); cl.style.display=''; strip.classList.add('hidden'); };
    });
    if (cr) cr.addEventListener('click', () => {
      const p = document.getElementById('right-panel');
      p.classList.add('collapsed'); main.classList.add('right-collapsed');
      cr.style.display = 'none';
      let strip = document.getElementById('right-reopen');
      if (!strip) { strip = document.createElement('div'); strip.id='right-reopen'; strip.className='panel-reopen-strip'; strip.textContent='◀ Open Analytics'; document.getElementById('center-panel').appendChild(strip); }
      strip.classList.remove('hidden');
      strip.onclick = () => { p.classList.remove('collapsed'); main.classList.remove('right-collapsed'); cr.style.display=''; strip.classList.add('hidden'); };
    });
  }

  function showPage(page) {
    const homePage = document.getElementById('home-page');
    const simPage = document.getElementById('simulator-page');
    document.querySelectorAll('.platform-module[data-page]').forEach(l => l.classList.remove('active'));
    document.querySelectorAll(`.platform-module[data-page="${page}"]`).forEach(l => l.classList.add('active'));

    if (page === 'simulator') {
      homePage.classList.add('hidden'); simPage.classList.remove('hidden');
      document.body.className = 'on-simulator';
      initSimulator();
    } else {
      homePage.classList.remove('hidden'); simPage.classList.add('hidden');
      document.body.className = 'on-home';
      if (page === 'about') setTimeout(() => { const s = document.getElementById('contact-section'); if(s) s.scrollIntoView({behavior:'smooth'}); }, 150);
      if (page === 'contact') setTimeout(() => { const s = document.getElementById('contact-section'); if(s) s.scrollIntoView({behavior:'smooth'}); }, 150);
      if (page === 'learn') { showPage('simulator'); setTimeout(() => { openModal('education-panel'); }, 300); }
    }
  }

  function bindPageNav() {
    document.querySelectorAll('.platform-module[data-page]').forEach(link => {
      link.addEventListener('click', e => { e.preventDefault(); showPage(link.dataset.page); });
    });
    document.getElementById('nav-home-btn')?.addEventListener('click', () => showPage('home'));
    document.getElementById('home-card-lhc')?.addEventListener('click', () => showPage('simulator'));
    document.querySelectorAll('.home-card[data-page]').forEach(card => {
      card.addEventListener('click', () => showPage(card.dataset.page));
    });
  }

  // ===== EVENT BINDING =====
  function bindEvents() {
    // Collision type buttons
    document.querySelectorAll('#collision-type-group .btn-option').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#collision-type-group .btn-option').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.collisionType = btn.dataset.value;
        autoSetBeams();
      });
    });

    // Beam selects
    document.getElementById('beam1-select').addEventListener('change', e => state.beam1 = e.target.value);
    document.getElementById('beam2-select').addEventListener('change', e => state.beam2 = e.target.value);

    // Sliders
    const energySlider = document.getElementById('energy-slider');
    energySlider.addEventListener('input', () => {
      state.energy = parseFloat(energySlider.value);
      document.getElementById('energy-display').textContent = state.energy.toFixed(1) + ' TeV';
    });
    const lumiSlider = document.getElementById('lumi-slider');
    lumiSlider.addEventListener('input', () => {
      state.luminosity = parseFloat(lumiSlider.value);
      const exp = Math.floor(state.luminosity);
      const mantissa = Math.pow(10, state.luminosity - exp);
      document.getElementById('lumi-display').textContent = mantissa.toFixed(1) + ' × 10' + superscript(exp);
    });
    const spreadSlider = document.getElementById('spread-slider');
    spreadSlider.addEventListener('input', () => {
      state.beamSpread = parseFloat(spreadSlider.value);
      document.getElementById('spread-display').textContent = state.beamSpread.toFixed(1) + ' μm';
    });
    const impactSlider = document.getElementById('impact-slider');
    impactSlider.addEventListener('input', () => {
      state.impactParam = parseFloat(impactSlider.value);
      document.getElementById('impact-display').textContent = state.impactParam.toFixed(1) + ' fm';
    });
    const speedSlider = document.getElementById('speed-slider');
    speedSlider.addEventListener('input', () => state.replaySpeed = parseFloat(speedSlider.value));

    // Control buttons
    document.getElementById('btn-collide').addEventListener('click', runCollision);
    document.getElementById('btn-batch').addEventListener('click', runBatch);
    document.getElementById('btn-reset').addEventListener('click', resetSim);

    // Viz toggles
    document.getElementById('btn-3d').addEventListener('click', () => { setVizMode(true); });
    document.getElementById('btn-2d').addEventListener('click', () => { setVizMode(false); });
    document.getElementById('show-tracks').addEventListener('change', e => Viz.toggleTracks(e.target.checked));
    document.getElementById('show-jets').addEventListener('change', e => Viz.toggleJets(e.target.checked));
    document.getElementById('show-detector').addEventListener('change', e => Viz.toggleDetector(e.target.checked));
    document.getElementById('show-labels').addEventListener('change', e => Viz.toggleLabels(e.target.checked));

    // Chart tabs
    document.querySelectorAll('.chart-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.chart-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        Charts.showChart(tab.dataset.chart);
        // Update graph analysis if visible
        const panel = document.getElementById('graph-analysis');
        if (panel && panel.classList.contains('visible')) {
          const info = graphExplanations[tab.dataset.chart];
          if (info) {
            document.getElementById('graph-analysis-title').textContent = info.title;
            document.getElementById('graph-analysis-text').textContent = info.text;
          }
        }
      });
    });

    // Detector selection
    document.querySelectorAll('#detector-group .btn-option').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#detector-group .btn-option').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.detector = btn.dataset.value;
        updateDetectorSpecs();
      });
    });

    // Detector explorer
    document.getElementById('btn-explore-detector').addEventListener('click', () => {
      openModal('detector-modal');
      setTimeout(() => Det.init(document.getElementById('detector-canvas')), 100);
    });
    document.querySelectorAll('.layer-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.layer-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        Det.showLayer(btn.dataset.layer);
        Det.updateDescription(btn.dataset.layer);
      });
    });

    // Nav tabs
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const t = tab.dataset.tab;
        // Highlight active tab
        document.querySelectorAll('.nav-tab').forEach(tb => tb.classList.remove('active'));
        tab.classList.add('active');
        if (t === 'simulate') { /* default view, do nothing special */ }
        else if (t === 'analysis') { document.getElementById('charts-container').scrollIntoView({behavior:'smooth'}); }
        else if (t === 'feynman') { openModal('feynman-panel'); Feyn.init(document.getElementById('feynman-canvas')); }
        else if (t === 'education') { openModal('education-panel'); }
        else if (t === 'detector') { openModal('detector-modal'); setTimeout(()=>Det.init(document.getElementById('detector-canvas')),100); }
      });
    });

    // Info buttons
    document.querySelectorAll('.info-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.info;
        const info = PD.infoContent[key];
        if (info) {
          document.getElementById('modal-title').textContent = info.title;
          document.getElementById('modal-body').innerHTML = info.body;
          openModal('info-modal');
        }
      });
    });

    // Modal close buttons
    document.querySelectorAll('.modal-close, .modal-backdrop').forEach(el => {
      el.addEventListener('click', () => {
        document.querySelectorAll('#info-modal, #detector-modal, #feynman-panel, #education-panel').forEach(m => m.classList.add('modal-hidden'));
      });
    });

    // Assistant
    document.getElementById('btn-assistant').addEventListener('click', () => {
      document.getElementById('assistant-panel').classList.toggle('assistant-hidden');
    });
    document.getElementById('btn-close-assistant').addEventListener('click', () => {
      document.getElementById('assistant-panel').classList.add('assistant-hidden');
    });
    document.getElementById('btn-send-msg').addEventListener('click', sendAssistantMessage);
    document.getElementById('assistant-input').addEventListener('keydown', e => { if(e.key==='Enter') sendAssistantMessage(); });

    // Feynman diagram
    document.getElementById('btn-gen-feynman').addEventListener('click', () => {
      Feyn.draw(document.getElementById('feynman-process').value);
    });

    // Education nav
    document.querySelectorAll('.edu-nav-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.edu-nav-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        Edu.showLesson(btn.dataset.lesson);
      });
    });

    // Export & Save
    document.getElementById('btn-export-data').addEventListener('click', () => { Charts.exportCSV(); toast('Dataset exported as CSV','success'); });
    document.getElementById('btn-chart-export').addEventListener('click', () => { Charts.exportCSV(); toast('Chart data exported','success'); });
    document.getElementById('btn-save').addEventListener('click', saveExperiment);
    document.getElementById('btn-edu-mode').addEventListener('click', () => openModal('education-panel'));
    document.getElementById('btn-chart-info').addEventListener('click', () => {
      const tab = Charts.getActiveTab();
      const msgs = { pt:'pT distribution shows transverse momentum spectrum. Falls steeply — most particles are soft.',
        eta:'Pseudorapidity η = -ln[tan(θ/2)] shows angular distribution relative to beam.',
        mass:'Invariant mass spectrum — look for resonance peaks (Z at 91.2, H at 125.1 GeV)!',
        phi:'Azimuthal angle distribution — should be uniform for a symmetric detector.',
        met:'Missing transverse energy — large MET signals neutrinos or new physics.',
        mult:'Particle multiplicity per event — depends on √s and collision type.' };
      toast(msgs[tab] || 'Chart info', 'info');
    });

  // Tour mode button
    document.getElementById('btn-tour')?.addEventListener('click', startTour);

    // Screenshot
    document.getElementById('btn-screenshot').addEventListener('click', () => toast('Screenshot feature — use browser Print Screen','info'));
    document.getElementById('btn-fullscreen').addEventListener('click', () => {
      const el = document.getElementById('viz-container');
      if (el.requestFullscreen) el.requestFullscreen();
    });
  }

  // ===== TOUR MODE =====
  const tourSteps = [
    { target:'#collision-type-group', title:'1. Choose Your Collision', desc:'Select which particles to smash together. Proton-proton (pp) is the LHC\'s main mode — protons are composite, made of quarks and gluons. Lead-lead (Pb-Pb) creates quark-gluon plasma. Electron-positron (e⁺e⁻) gives the cleanest signals since they\'re point-like particles.' },
    { target:'#beam1-select', title:'2. Select Beam Particles', desc:'Pick specific particles for each beam. Different particles probe different physics: protons for discovery, electrons for precision, heavy ions for extreme matter studies.' },
    { target:'#energy-slider', title:'3. Set Beam Energy (√s)', desc:'The center-of-mass energy determines what can be created. E = mc² means higher energy → heavier particles. The LHC runs at √s = 13.6 TeV. You need at least 125.1 GeV to produce a Higgs boson!' },
    { target:'#lumi-slider', title:'4. Luminosity', desc:'Luminosity measures how many collisions happen per second. Higher luminosity = more data = better statistics. The formula is N_events = σ × L × t, where σ is the cross-section.' },
    { target:'#btn-collide', title:'5. Run a Collision!', desc:'Click COLLIDE to simulate one collision event using Monte Carlo methods. The engine samples parton distributions, generates particles via Tsallis spectra, clusters jets, and detects resonances — just like real CERN software.' },
    { target:'#btn-batch', title:'6. Batch Mode', desc:'Real experiments analyze billions of events to find rare signals. Run thousands at once to build statistical distributions. Watch the histograms fill up with data!' },
    { target:'#viz-container', title:'7. Event Display', desc:'The 3D visualization shows particle tracks from the collision vertex. Charged particles curve in the magnetic field (Lorentz force). Toggle between 3D orbit view and 2D cross-section. The bright flash at the center is the interaction vertex.' },
    { target:'#charts-container', title:'8. Physics Distributions', desc:'These histograms show key observables: pT (transverse momentum), η (pseudorapidity = angle from beam), invariant mass (look for Z at 91 GeV, Higgs at 125 GeV!), and MET (missing energy from neutrinos).' },
    { target:'#detector-group', title:'9. Choose Your Detector', desc:'CMS has a 3.8T solenoid (strongest ever for a detector) — great for muons. ATLAS is the largest detector ever built (25m diameter!) with a toroidal magnet system. They have different resolutions and acceptances.' },
    { target:'#btn-explore-detector', title:'10. Explore Detector Layers', desc:'Open the 3D detector explorer to see inside the CMS/ATLAS structure. From inside out: Tracker → ECAL → HCAL → Muon System. Each layer detects different particles.' },
    { target:'#anomaly-status', title:'11. Anomaly Detection', desc:'The AI scans for unusual events — unexpected mass peaks, high MET, or exotic topologies. A 5σ significance (p < 3×10⁻⁷) is required for a discovery claim in particle physics.' },
    { target:'#challenges-list', title:'12. Challenges', desc:'Test your skills! Find the Higgs boson peak at 125 GeV, discover the Z boson resonance, reconstruct top quarks, or detect anomalous signals. Each challenge teaches real experimental physics techniques.' },
  ];
  let tourIdx = -1;

  function startTour() {
    tourIdx = 0; showTourStep();
  }

  function showTourStep() {
    document.querySelectorAll('.tour-overlay,.tour-highlight,.tour-tooltip').forEach(e=>e.remove());
    if (tourIdx < 0 || tourIdx >= tourSteps.length) return;
    const step = tourSteps[tourIdx];
    const el = document.querySelector(step.target);
    if (!el) { tourIdx++; if(tourIdx<tourSteps.length) showTourStep(); return; }
    // Scroll element into view first
    el.scrollIntoView({ behavior:'smooth', block:'center' });
    setTimeout(() => {
      const rect = el.getBoundingClientRect();
      const ov = document.createElement('div'); ov.className='tour-overlay'; document.body.appendChild(ov);
      ov.addEventListener('click', endTour);
      const hl = document.createElement('div'); hl.className='tour-highlight';
      hl.style.cssText=`top:${rect.top-4}px;left:${rect.left-4}px;width:${rect.width+8}px;height:${rect.height+8}px;`;
      document.body.appendChild(hl);
      const tt = document.createElement('div'); tt.className='tour-tooltip';
      tt.innerHTML=`<div class="tour-step-counter">Step ${tourIdx+1} of ${tourSteps.length}</div><h4>${step.title}</h4><p>${step.desc}</p><div class="tour-btns">${tourIdx>0?'<button class="tour-btn secondary" onclick="window._tourPrev()">Back</button>':''}<button class="tour-btn secondary" onclick="window._tourEnd()">Skip</button><button class="tour-btn primary" onclick="window._tourNext()">${tourIdx<tourSteps.length-1?'Next':'Finish'}</button></div>`;
      // Position tooltip within viewport
      let top = rect.bottom + 12;
      if (top + 200 > window.innerHeight) top = Math.max(8, rect.top - 200);
      const left = Math.max(8, Math.min(rect.left, window.innerWidth - 340));
      tt.style.cssText=`top:${top}px;left:${left}px;`;
      document.body.appendChild(tt);
    }, 400);
  }

  function endTour() { tourIdx=-1; document.querySelectorAll('.tour-overlay,.tour-highlight,.tour-tooltip').forEach(e=>e.remove()); }
  window._tourNext = () => { tourIdx++; if(tourIdx>=tourSteps.length) endTour(); else showTourStep(); };
  window._tourPrev = () => { if(tourIdx>0) tourIdx--; showTourStep(); };
  window._tourEnd = endTour;

  // ===== GRAPH ANALYSIS =====
  const graphExplanations = {
    pt: { title:'📊 Transverse Momentum (pT) Distribution', text:'This histogram shows how many particles have a given transverse momentum pT (momentum perpendicular to the beam). The spectrum falls steeply — most particles are "soft" (low pT). Hard scattering processes produce rare high-pT particles. The shape follows a Tsallis distribution: dN/dpT ∝ pT × (1 + (mT−m₀)/(nT))^(−n). High-pT tails indicate jet production or heavy particle decays.' },
    eta: { title:'📊 Pseudorapidity (η) Distribution', text:'Pseudorapidity η = −ln[tan(θ/2)] measures the angle of particles relative to the beam axis. η = 0 means perpendicular to beam, |η| → ∞ means along the beam. This distribution should be roughly flat near η = 0 for minimum-bias events. Dips near |η| > 2.5 show the detector acceptance limit. Jets tend to be central (low |η|), while beam remnants go forward (high |η|).' },
    mass: { title:'📊 Invariant Mass Spectrum', text:'The invariant mass m = √(E²−p²) of particle pairs reveals resonances — short-lived particles that decayed. Look for peaks! A bump at ~91 GeV = Z boson (discovered 1983). A bump at ~125 GeV = Higgs boson (discovered 2012). The smooth background comes from random combinatorial pairings. The significance S/√(S+B) tells you how real a peak is. This is exactly how ATLAS and CMS discovered the Higgs!' },
    phi: { title:'📊 Azimuthal Angle (φ) Distribution', text:'The azimuthal angle φ measures the direction around the beam axis. For a symmetric detector, this distribution should be flat (uniform). Any non-uniformity indicates detector asymmetries or acceptance gaps. In real experiments, back-to-back peaks in Δφ indicate di-jet events where two jets fly apart at φ and φ+π. This is a key validation plot.' },
    met: { title:'📊 Missing Transverse Energy (MET)', text:'MET (or E_T^miss) is the momentum imbalance in the transverse plane. By conservation of momentum, total pT should be zero. Any imbalance means invisible particles escaped the detector — neutrinos! Large MET (> 100 GeV) is a signature of W bosons (W → ℓν), top quarks, or potential new physics like supersymmetry or dark matter. MET is one of the most important observables in BSM searches.' },
    mult: { title:'📊 Particle Multiplicity', text:'Multiplicity = number of particles produced per collision. It scales as ~ln(√s) for pp collisions (KNO scaling). Pb-Pb collisions produce hundreds to thousands of particles due to the large nuclear overlap. Higher multiplicity indicates more central (head-on) collisions. The distribution follows a negative binomial shape. This observable helps characterize the collision geometry and underlying event activity.' }
  };

  function bindGraphAnalysis() {
    const btn = document.getElementById('btn-analyze-graph');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const tab = Charts.getActiveTab();
      const info = graphExplanations[tab];
      const panel = document.getElementById('graph-analysis');
      if (info && panel) {
        document.getElementById('graph-analysis-title').textContent = info.title;
        document.getElementById('graph-analysis-text').textContent = info.text;
        panel.classList.add('visible');
        panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });
  }

  // ===== SIMULATION =====
  function getConfig() {
    return { collisionType:state.collisionType, beam1:state.beam1, beam2:state.beam2,
      energy:state.energy, luminosity:state.luminosity, beamSpread:state.beamSpread,
      impactParam:state.impactParam, detector:state.detector };
  }

  function runCollision() {
    const config = getConfig();
    const event = Sim.simulateCollision(config);
    state.currentEvent = event;
    Viz.displayEvent(event);
    Charts.addEventData(event);
    updateStats(event);
    updateDetectedParticles(event);
    updateDetectorResponse(event);
    updateEventSummary(event);
    updateEventCount();
    checkAnomalies(event);
    checkChallenges(event);
    flashStatus('COLLIDING');
    setTimeout(() => flashStatus('DATA'), 1000);
  }

  function runBatch() {
    const config = getConfig();
    const batchSize = parseInt(document.getElementById('batch-size').value) || 10000;
    flashStatus('BATCH RUN');
    document.getElementById('footer-batch-status').textContent = `Running batch: 0/${batchSize.toLocaleString()}`;
    document.getElementById('batch-progress').classList.remove('hidden');
    toast(`Running ${batchSize.toLocaleString()} collision events...`, 'info');
    
    let done = 0;
    const chunk = Math.min(200, Math.ceil(batchSize / 20));
    const progressFill = document.getElementById('batch-progress-fill');
    const progressText = document.getElementById('batch-progress-text');
    
    function runChunk() {
      const chunkEnd = Math.min(done + chunk, batchSize);
      for (; done < chunkEnd; done++) {
        const event = Sim.simulateCollision(config);
        Charts.addEventData(event);
        if (done === batchSize - 1) {
          state.currentEvent = event;
          Viz.displayEvent(event);
          updateStats(event);
          updateDetectedParticles(event);
          updateDetectorResponse(event);
          checkAnomalies(event);
        }
      }
      const pct = Math.round(done / batchSize * 100);
      progressFill.style.width = pct + '%';
      progressText.textContent = `${pct}% (${done.toLocaleString()}/${batchSize.toLocaleString()})`;
      document.getElementById('footer-batch-status').textContent = `Batch: ${done.toLocaleString()}/${batchSize.toLocaleString()}`;
      updateEventCount();
      if (done < batchSize) {
        requestAnimationFrame(runChunk);
      } else {
        toast(`Batch complete! ${batchSize.toLocaleString()} events generated.`, 'success');
        flashStatus('DATA');
        document.getElementById('footer-batch-status').textContent = 'Ready';
        checkChallenges(state.currentEvent);
        setTimeout(() => { document.getElementById('batch-progress').classList.add('hidden'); }, 2000);
      }
    }
    runChunk();
  }

  function resetSim() {
    Sim.clearHistory();
    Viz.clearParticles();
    Charts.clear();
    state.currentEvent = null;
    updateEventCount();
    updateStats(null);
    updateEventSummary(null);
    document.getElementById('anomaly-results').innerHTML = '';
    document.getElementById('anomaly-status').innerHTML = '<span class="anomaly-icon">🔍</span><span>Awaiting collision data...</span>';
    document.getElementById('detected-particles-list').innerHTML = '<div class="detected-empty">Run a collision to see detected particles</div>';
    document.getElementById('total-detected').textContent = '0';
    document.getElementById('detection-efficiency').textContent = '—';
    ['resp-tracker','resp-ecal','resp-hcal','resp-muon'].forEach(id => document.getElementById(id).textContent = '—');
    document.getElementById('batch-progress').classList.add('hidden');
    document.getElementById('footer-batch-status').textContent = 'Ready';
    flashStatus('STANDBY');
    toast('Simulation reset', 'info');
  }

  // ===== UI UPDATES =====
  function updateEventCount() {
    const n = Sim.getTotalEvents();
    document.getElementById('event-count').textContent = n.toLocaleString();
    document.getElementById('footer-events').textContent = 'Events: ' + n.toLocaleString();
  }

  function updateStats(event) {
    if (!event) {
      ['stat-particles','stat-jets','stat-et','stat-met','stat-charged','stat-neutral'].forEach(id => document.getElementById(id).textContent = '—');
      return;
    }
    document.getElementById('stat-particles').textContent = event.particles.length;
    document.getElementById('stat-jets').textContent = event.jets.length;
    document.getElementById('stat-et').textContent = event.totalET.toFixed(1) + ' GeV';
    document.getElementById('stat-met').textContent = event.met.mag.toFixed(1) + ' GeV';
    document.getElementById('stat-charged').textContent = event.particles.filter(p => p.charge !== 0).length;
    document.getElementById('stat-neutral').textContent = event.particles.filter(p => p.charge === 0).length;
  }

  function updateEventSummary(event) {
    const el = document.getElementById('event-summary');
    if (!event) { el.innerHTML = `√s = ${state.energy} TeV | ${state.collisionType} | ${state.detector} | Ready`; return; }
    el.innerHTML = `Event #${event.id} | √s = ${state.energy} TeV | ${event.particles.length} particles | ${event.jets.length} jets | MET: ${event.met.mag.toFixed(1)} GeV`;
  }

  function updateDetectorSpecs() {
    const det = PD.detectors[state.detector];
    document.getElementById('spec-bfield').textContent = det.bField + ' T';
    document.getElementById('spec-length').textContent = det.length + ' m';
    document.getElementById('spec-diameter').textContent = det.diameter + ' m';
    document.getElementById('spec-weight').textContent = det.weight.toLocaleString() + ' t';
    document.getElementById('footer-detector').textContent = det.name + ' Detector';
  }

  // Update detected particles panel
  function updateDetectedParticles(event) {
    const el = document.getElementById('detected-particles-list');
    const dp = event.detectedParticles;
    const entries = Object.entries(dp).sort((a,b) => b[1].count - a[1].count);
    if (entries.length === 0) {
      el.innerHTML = '<div class="detected-empty">No particles detected in this event</div>';
    } else {
      el.innerHTML = entries.map(([symbol, data]) => {
        const layerTags = data.layers.map(l => `<span class="particle-layer">${l.toUpperCase()}</span>`).join('');
        return `<div class="detected-row">
          <span class="particle-dot" style="background:${data.color}"></span>
          <span class="particle-name">${symbol} <small style="color:var(--text-muted)">${data.name}</small></span>
          ${layerTags}
          <span class="particle-count">${data.count}</span>
        </div>`;
      }).join('');
    }
    document.getElementById('total-detected').textContent = event.detectorResponse.totalDetected;
    document.getElementById('detection-efficiency').textContent = event.detectorResponse.efficiency.toFixed(1) + '%';
  }

  // Update detector response panel
  function updateDetectorResponse(event) {
    const dr = event.detectorResponse;
    document.getElementById('resp-tracker').textContent = dr.trackerHits;
    document.getElementById('resp-ecal').textContent = dr.ecalDeposits + ' GeV';
    document.getElementById('resp-hcal').textContent = dr.hcalDeposits + ' GeV';
    document.getElementById('resp-muon').textContent = dr.muonHits;
  }

  function checkAnomalies(event) {
    const el = document.getElementById('anomaly-results');
    if (event.anomalyScore > 50) {
      const statusEl = document.getElementById('anomaly-status');
      statusEl.innerHTML = '<span class="anomaly-icon">⚠️</span><span style="color:#f43f5e">Anomaly detected!</span>';
      let html = '';
      if (event.resonances.some(r => r.type === 'higgs')) {
        html += `<div class="anomaly-alert"><div class="anomaly-title">🔴 Higgs-like Signal</div><p>Possible H⁰ candidate at ~125 GeV in diphoton/4-lepton channel. Score: ${event.anomalyScore.toFixed(0)}%</p></div>`;
      }
      if (event.met.mag > state.energy * 100) {
        html += `<div class="anomaly-alert"><div class="anomaly-title">🟡 High MET Event</div><p>Missing ET = ${event.met.mag.toFixed(1)} GeV. Possible neutrino or BSM signal.</p></div>`;
      }
      if (event.anomalyScore > 30 && !html) {
        html += `<div class="anomaly-alert"><div class="anomaly-title">🟠 Unusual Topology</div><p>Event has unusual characteristics. Anomaly score: ${event.anomalyScore.toFixed(0)}%. Investigate further.</p></div>`;
      }
      el.innerHTML = html;
    }
  }

  function checkChallenges(event) {
    if (!event) return;
    const checks = {
      'higgs': () => event.resonances.some(r => r.type === 'higgs'),
      'z-boson': () => event.resonances.some(r => r.type === 'z_boson'),
      'top-quark': () => event.resonances.some(r => r.type === 'top'),
      'jet-event': () => event.jets.length >= 4,
      'anomaly-find': () => event.anomalyScore > 60
    };
    Object.entries(checks).forEach(([key, check]) => {
      if (!state.challengesCompleted.has(key) && check()) {
        state.challengesCompleted.add(key);
        const el = document.querySelector(`.challenge-item[data-challenge="${key}"]`);
        if (el) {
          el.classList.add('completed');
          el.querySelector('.challenge-status').textContent = '✅';
        }
        toast(`🏆 Challenge completed: ${el?.textContent?.trim() || key}`, 'success');
      }
    });
  }

  function saveExperiment() {
    const exp = { name:`Exp ${state.savedExperiments.length+1}`, config:{...state}, events:Sim.getTotalEvents(), timestamp:new Date().toLocaleString() };
    state.savedExperiments.push(exp);
    const el = document.getElementById('saved-experiments');
    el.innerHTML = state.savedExperiments.map((e,i) =>
      `<div class="challenge-item"><span class="challenge-status">📁</span><span>${e.name} — ${e.events} events (${e.timestamp})</span></div>`
    ).join('');
    toast('Experiment saved!', 'success');
  }

  function sendAssistantMessage() {
    const input = document.getElementById('assistant-input');
    const msg = input.value.trim();
    if (!msg) return;
    input.value = '';
    const container = document.getElementById('assistant-messages');
    container.innerHTML += `<div class="msg user"><div class="msg-content"><p>${escapeHtml(msg)}</p></div></div>`;
    const response = Asst.processMessage(msg);
    setTimeout(() => {
      container.innerHTML += `<div class="msg bot"><div class="msg-content">${formatResponse(response)}</div></div>`;
      container.scrollTop = container.scrollHeight;
    }, 300 + Math.random()*400);
    container.scrollTop = container.scrollHeight;
  }

  function autoSetBeams() {
    const b1=document.getElementById('beam1-select'), b2=document.getElementById('beam2-select');
    if (state.collisionType==='pp') { b1.value='proton'; b2.value='proton'; state.beam1='proton'; state.beam2='proton'; }
    else if (state.collisionType==='PbPb') { b1.value='lead'; b2.value='lead'; state.beam1='lead'; state.beam2='lead'; }
    else if (state.collisionType==='ee') { b1.value='electron'; b2.value='positron'; state.beam1='electron'; state.beam2='positron'; }
  }

  function setVizMode(is3D) {
    document.getElementById('btn-3d').classList.toggle('active', is3D);
    document.getElementById('btn-2d').classList.toggle('active', !is3D);
    Viz.setMode(is3D);
  }

  function openModal(id) { document.getElementById(id).classList.remove('modal-hidden'); }
  function flashStatus(text) { document.getElementById('sim-status').textContent = text; }

  function toast(msg, type='info') {
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.textContent = msg;
    document.getElementById('toast-container').appendChild(el);
    setTimeout(() => { el.style.opacity='0'; el.style.transform='translateX(100px)'; setTimeout(()=>el.remove(),300); }, 4000);
  }

  function superscript(n) {
    const map = {'0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹'};
    return String(n).split('').map(c => map[c]||c).join('');
  }

  function escapeHtml(s) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function formatResponse(s) {
    return s.replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>').replace(/`(.*?)`/g,'<code>$1</code>').replace(/\n/g,'<br>');
  }

  function updateFooterClock() {
    const now = new Date();
    document.getElementById('footer-time').textContent = now.toLocaleTimeString();
  }

  // Update footer energy when slider changes
  const origEnergyBind = document.getElementById('energy-slider');
  if (origEnergyBind) {
    origEnergyBind.addEventListener('input', () => {
      document.getElementById('footer-energy').textContent = '√s = ' + parseFloat(origEnergyBind.value).toFixed(1) + ' TeV';
    });
  }

  // Boot
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
