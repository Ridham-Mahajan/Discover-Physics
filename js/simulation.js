// ===== Monte Carlo Simulation Engine =====
window.SimulationEngine = (function() {
  const PD = window.PhysicsData;
  let eventHistory = [], totalEvents = 0;

  function gaussian() { let u=0,v=0; while(!u) u=Math.random(); while(!v) v=Math.random(); return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v); }
  function exponential(lambda) { return -Math.log(1-Math.random())/lambda; }
  function powerLaw(alpha, xmin) { return xmin*Math.pow(1-Math.random(), -1/(alpha-1)); }
  function breitWigner(mass, width) { return mass + width*Math.tan(Math.PI*(Math.random()-0.5)); }
  function poisson(lambda) { let L=Math.exp(-lambda),k=0,p=1; do { k++; p*=Math.random(); } while(p>L); return k-1; }

  function generatePartonX() { return Math.pow(Math.random(), 2.5) * 0.4 + 0.001; }

  function simulateCollision(config) {
    const { collisionType, beam1, beam2, energy, luminosity, detector, impactParam } = config;
    const sqrtS = energy * 1000; // TeV to GeV
    const event = { id: ++totalEvents, timestamp: Date.now(), config: {...config}, particles: [], jets: [], tracks: [],
      totalET: 0, met: {x:0,y:0,mag:0}, multiplicity: 0, resonances: [], anomalyScore: 0,
      detectorResponse: { trackerHits:0, ecalDeposits:0, hcalDeposits:0, muonHits:0, totalDetected:0, efficiency:0 },
      detectedParticles: {} };

    // Determine effective collision energy via parton distribution
    let effectiveE = sqrtS;
    if (collisionType === 'pp' || collisionType === 'PbPb') {
      const x1 = generatePartonX(), x2 = generatePartonX();
      effectiveE = sqrtS * Math.sqrt(x1 * x2);
    }

    // Multiplicity from KNO scaling
    const avgMult = collisionType === 'PbPb' ?
      Math.floor(800 * Math.pow(effectiveE/5500, 0.15) * (1 - impactParam/15)) :
      Math.floor(6 * Math.log(effectiveE) + gaussian()*3);
    const nParticles = Math.max(4, avgMult);

    // Generate particles
    let sumPx=0, sumPy=0, sumPz=0, sumE=0;
    const particleTypes = getProductionWeights(effectiveE, collisionType);

    for (let i=0; i<nParticles; i++) {
      const type = weightedChoice(particleTypes);
      const pInfo = PD.produced[type] || { mass:0.13957, charge:0, color:'#888', name:type, symbol:type };
      const mass = pInfo.mass;

      // Transverse momentum from Tsallis distribution
      const T = 0.17 + 0.03*Math.log(effectiveE/100); // Temperature parameter
      const n = 6.6;
      const pt = tsallisPt(T, n, mass);
      const eta = (gaussian()*2.2); // pseudorapidity
      const phi = Math.random()*2*Math.PI;
      const px = pt*Math.cos(phi), py = pt*Math.sin(phi);
      const pz = pt*Math.sinh(eta);
      const E = Math.sqrt(px*px+py*py+pz*pz+mass*mass);

      // Apply detector resolution
      const det = PD.detectors[detector];
      const smearPt = pt * (1 + gaussian()*det.trackerRes);
      const charge = pInfo.charge || 0;

      const particle = { type, name:pInfo.name, symbol:pInfo.symbol, mass, charge,
        px, py, pz, pt: smearPt, eta, phi, energy: E, color: pInfo.color,
        theta: 2*Math.atan(Math.exp(-eta)), r: Math.sqrt(px*px+py*py+pz*pz) };

      event.particles.push(particle);
      sumPx += px; sumPy += py; sumPz += pz; sumE += E;
      event.totalET += pt;

      // Realistic detector response per particle
      const detResp = simulateDetectorResponse(particle, det);
      particle.detected = detResp.detected;
      particle.detectedBy = detResp.layers;
      if (detResp.detected) {
        event.detectorResponse.totalDetected++;
        if (detResp.layers.includes('tracker')) event.detectorResponse.trackerHits++;
        if (detResp.layers.includes('ecal')) event.detectorResponse.ecalDeposits += detResp.ecalE;
        if (detResp.layers.includes('hcal')) event.detectorResponse.hcalDeposits += detResp.hcalE;
        if (detResp.layers.includes('muon')) event.detectorResponse.muonHits++;
        // Count by type
        const key = particle.symbol || particle.type;
        event.detectedParticles[key] = (event.detectedParticles[key] || { count:0, color:particle.color, name:particle.name, layers:detResp.layers }) ;
        event.detectedParticles[key].count++;
      }
    }

    // Resonance production (probabilistic)
    if (effectiveE > 91 && Math.random() < 0.08) {
      const zMass = breitWigner(91.1876, 2.4952);
      event.resonances.push({ name:'Z⁰', mass:zMass, width:2.5, type:'z_boson' });
      injectResonanceProducts(event, 'z_boson', zMass);
    }
    if (effectiveE > 125 && Math.random() < 0.01) {
      const hMass = breitWigner(125.1, 0.004);
      event.resonances.push({ name:'H⁰', mass:hMass, width:0.004, type:'higgs' });
      injectResonanceProducts(event, 'higgs', hMass);
    }
    if (effectiveE > 173 && Math.random() < 0.03) {
      event.resonances.push({ name:'tt̄', mass: 173+gaussian()*2, width:1.4, type:'top' });
    }
    if (effectiveE > 80 && Math.random() < 0.06) {
      const wMass = breitWigner(80.379, 2.085);
      event.resonances.push({ name:'W±', mass:wMass, width:2.085, type:'w_plus' });
    }

    // Jet clustering (simplified anti-kT)
    event.jets = clusterJets(event.particles, 0.4);

    // Missing transverse energy
    event.met = { x: -sumPx, y: -sumPy, mag: Math.sqrt(sumPx*sumPx+sumPy*sumPy) };
    event.multiplicity = event.particles.length;

    // Generate tracks for visualization
    event.tracks = generateTracks(event.particles, detector);

    // Anomaly detection
    event.anomalyScore = computeAnomalyScore(event, effectiveE);

    // Detector efficiency
    event.detectorResponse.efficiency = event.multiplicity > 0 ? 
      (event.detectorResponse.totalDetected / event.multiplicity * 100) : 0;
    event.detectorResponse.ecalDeposits = parseFloat(event.detectorResponse.ecalDeposits.toFixed(1));
    event.detectorResponse.hcalDeposits = parseFloat(event.detectorResponse.hcalDeposits.toFixed(1));

    eventHistory.push(event);
    return event;
  }

  // Simulate how each particle interacts with detector layers
  function simulateDetectorResponse(particle, det) {
    const result = { detected: false, layers: [], ecalE: 0, hcalE: 0 };
    const type = particle.type;
    const absEta = Math.abs(particle.eta);
    const pt = particle.pt;

    // Outside detector acceptance
    if (absEta > det.etaMax + 0.5) return result;
    // Below pT threshold
    if (pt < 0.1) return result;

    // Tracker: detects charged particles with pT > 0.5 GeV within |η| < etaMax
    if (particle.charge !== 0 && pt > 0.5 && absEta < det.etaMax) {
      if (Math.random() < 0.95) { // 95% tracker efficiency
        result.layers.push('tracker');
        result.detected = true;
      }
    }

    // ECAL: electrons, positrons, photons deposit all energy
    if (['electron','positron','photon','pion_zero'].includes(type) || (type === 'photon')) {
      const ecalEff = absEta < det.etaMax ? 0.98 : 0.7;
      if (Math.random() < ecalEff) {
        result.layers.push('ecal');
        const smear = 1 + gaussian() * det.ecalRes / Math.sqrt(Math.max(particle.energy, 0.1));
        result.ecalE = particle.energy * smear;
        result.detected = true;
      }
    }

    // HCAL: hadrons (pions, kaons, protons, neutrons)
    if (['pion_plus','pion_minus','pion_zero','kaon_plus','proton','neutron'].includes(type)) {
      const hcalEff = absEta < det.etaMax ? 0.90 : 0.6;
      if (Math.random() < hcalEff) {
        result.layers.push('hcal');
        const smear = 1 + gaussian() * det.hcalRes / Math.sqrt(Math.max(particle.energy, 0.1));
        result.hcalE = particle.energy * smear;
        result.detected = true;
      }
    }

    // Muon System: only muons penetrate
    if (['muon','antimuon'].includes(type)) {
      const muonEff = absEta < det.etaMax ? 0.96 : 0.5;
      if (Math.random() < muonEff && pt > 3) {
        result.layers.push('muon');
        result.detected = true;
      }
    }

    // Neutrinos: never detected (but contribute to MET)
    if (['neutrino_e','neutrino_mu'].includes(type)) {
      result.detected = false;
      result.layers = [];
    }

    return result;
  }

  function tsallisPt(T, n, m) {
    // Inverse CDF sampling from Tsallis distribution
    const pt = Math.abs(gaussian()*T*2 + exponential(1/(T*3)));
    return Math.max(0.1, pt * (1 + Math.random()*0.5));
  }

  function getProductionWeights(energy, type) {
    const w = { pion_plus:30, pion_minus:30, pion_zero:25, kaon_plus:8, photon:15,
      muon:3, antimuon:3, neutrino_e:2, neutrino_mu:2 };
    if (energy > 10) { w.pion_plus += 10; w.photon += 5; }
    if (type === 'PbPb') { w.pion_plus *= 3; w.pion_minus *= 3; w.pion_zero *= 3; }
    return w;
  }

  function weightedChoice(weights) {
    const keys = Object.keys(weights);
    const total = keys.reduce((s,k) => s+weights[k], 0);
    let r = Math.random()*total;
    for (const k of keys) { r -= weights[k]; if (r <= 0) return k; }
    return keys[keys.length-1];
  }

  function injectResonanceProducts(event, type, mass) {
    const phi = Math.random()*2*Math.PI;
    const eta1 = gaussian()*1.5, eta2 = -eta1 + gaussian()*0.3;
    const pt = mass/2 * (0.5+Math.random()*0.5);
    let p1, p2;
    if (type === 'z_boson') {
      p1 = { type:'muon', name:'Muon', symbol:'μ⁻', mass:0.106, charge:-1, color:'#22c55e',
        pt, eta:eta1, phi, px:pt*Math.cos(phi), py:pt*Math.sin(phi), pz:pt*Math.sinh(eta1), energy:Math.sqrt(pt*pt*(1+Math.sinh(eta1)**2)+0.106**2) };
      p2 = { type:'antimuon', name:'Antimuon', symbol:'μ⁺', mass:0.106, charge:1, color:'#22c55e',
        pt, eta:eta2, phi:phi+Math.PI, px:-pt*Math.cos(phi), py:-pt*Math.sin(phi), pz:pt*Math.sinh(eta2), energy:Math.sqrt(pt*pt*(1+Math.sinh(eta2)**2)+0.106**2) };
    } else {
      p1 = { type:'photon', name:'Photon', symbol:'γ', mass:0, charge:0, color:'#fbbf24',
        pt:mass/2, eta:eta1, phi, px:(mass/2)*Math.cos(phi), py:(mass/2)*Math.sin(phi), pz:(mass/2)*Math.sinh(eta1), energy:mass/2*Math.cosh(eta1) };
      p2 = { type:'photon', name:'Photon', symbol:'γ', mass:0, charge:0, color:'#fbbf24',
        pt:mass/2, eta:eta2, phi:phi+Math.PI, px:-(mass/2)*Math.cos(phi), py:-(mass/2)*Math.sin(phi), pz:(mass/2)*Math.sinh(eta2), energy:mass/2*Math.cosh(eta2) };
    }
    event.particles.push(p1, p2);
  }

  function clusterJets(particles, R) {
    const jets = [];
    const used = new Set();
    const charged = particles.filter(p => Math.abs(p.pt) > 0.5);
    charged.sort((a,b) => b.pt - a.pt);
    for (let i=0; i<charged.length && jets.length<8; i++) {
      if (used.has(i)) continue;
      const seed = charged[i];
      if (seed.pt < 2) continue;
      const jet = { eta:seed.eta, phi:seed.phi, pt:seed.pt, energy:seed.energy, constituents:[seed], mass:0 };
      used.add(i);
      for (let j=i+1; j<charged.length; j++) {
        if (used.has(j)) continue;
        const dEta = charged[j].eta-jet.eta, dPhi = Math.atan2(Math.sin(charged[j].phi-jet.phi), Math.cos(charged[j].phi-jet.phi));
        const dR = Math.sqrt(dEta*dEta+dPhi*dPhi);
        if (dR < R) { jet.pt += charged[j].pt; jet.energy += charged[j].energy; jet.constituents.push(charged[j]); used.add(j); }
      }
      if (jet.constituents.length >= 2) jets.push(jet);
    }
    return jets;
  }

  function generateTracks(particles, detector) {
    const det = PD.detectors[detector];
    return particles.map(p => {
      const nPoints = 30;
      const curvature = p.charge !== 0 ? (0.3 * det.bField) / (p.pt * 1000) : 0;
      const points = [];
      for (let i=0; i<nPoints; i++) {
        const t = i / nPoints;
        const r = t * 3;
        const angle = p.phi + curvature * r * 50;
        const x = r * Math.cos(angle);
        const y = r * Math.sin(angle);
        const z = r * Math.sinh(p.eta) * 0.3;
        points.push({x, y, z});
      }
      return { particle: p, points, color: p.color, charge: p.charge };
    });
  }

  function computeAnomalyScore(event, energy) {
    let score = 0;
    if (event.met.mag > energy * 0.15) score += 30;
    if (event.jets.length >= 4) score += 15;
    if (event.multiplicity > 50) score += 10;
    event.resonances.forEach(r => { if (r.type === 'higgs') score += 40; });
    const leptons = event.particles.filter(p => ['muon','antimuon','electron','positron'].includes(p.type));
    if (leptons.length >= 3) score += 25;
    score += Math.random() * 5;
    return Math.min(100, score);
  }

  function batchSimulate(config, n) {
    const events = [];
    for (let i=0; i<n; i++) events.push(simulateCollision(config));
    return events;
  }

  function getHistory() { return eventHistory; }
  function clearHistory() { eventHistory = []; totalEvents = 0; }
  function getTotalEvents() { return totalEvents; }

  function computeInvariantMass(p1, p2) {
    const E = p1.energy+p2.energy, px=p1.px+p2.px, py=p1.py+p2.py, pz=p1.pz+p2.pz;
    return Math.sqrt(Math.max(0, E*E-px*px-py*py-pz*pz));
  }

  function getAllInvariantMasses() {
    const masses = [];
    eventHistory.forEach(ev => {
      const muons = ev.particles.filter(p => p.type==='muon' || p.type==='antimuon');
      for (let i=0; i<muons.length; i++) for (let j=i+1; j<muons.length; j++) {
        if (muons[i].charge !== muons[j].charge) masses.push(computeInvariantMass(muons[i], muons[j]));
      }
      // Also di-photon
      const photons = ev.particles.filter(p => p.type==='photon');
      for (let i=0; i<photons.length; i++) for (let j=i+1; j<photons.length; j++) {
        masses.push(computeInvariantMass(photons[i], photons[j]));
      }
    });
    return masses;
  }

  return { simulateCollision, batchSimulate, getHistory, clearHistory, getTotalEvents,
    computeInvariantMass, getAllInvariantMasses, gaussian, breitWigner };
})();
