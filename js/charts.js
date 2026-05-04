// ===== Interactive Charts (Chart.js) =====
window.ChartsManager = (function() {
  let mainChart = null, activeTab = 'pt';
  const allPt=[], allEta=[], allPhi=[], allMET=[], allMult=[], allMass=[];

  const chartColors = {
    line: '#00e5ff', fill: 'rgba(0,229,255,0.15)', grid: '#1a2245',
    text: '#8a94b2', accent2: '#448aff', accent3: '#ff5252'
  };

  const chartOpts = {
    responsive: true, maintainAspectRatio: false, animation: { duration: 400 },
    plugins: { legend: { display: false },
      tooltip: { backgroundColor:'#131a3a', borderColor:'#253060', borderWidth:1, titleColor:'#e4e8f1',
        bodyColor:'#8a94b2', titleFont:{family:'Inter'}, bodyFont:{family:'JetBrains Mono',size:11}, padding:10, cornerRadius:6 }
    },
    scales: {
      x: { grid:{color:chartColors.grid}, ticks:{color:chartColors.text, font:{family:'Inter',size:10}}, border:{color:'#253060'} },
      y: { grid:{color:chartColors.grid}, ticks:{color:chartColors.text, font:{family:'Inter',size:10}}, border:{color:'#253060'} }
    }
  };

  function init(canvasId) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    mainChart = new Chart(ctx, { type:'bar', data:{ labels:[], datasets:[] }, options:{...chartOpts} });
    showChart('pt');
  }

  function addEventData(event) {
    event.particles.forEach(p => {
      allPt.push(p.pt);
      allEta.push(p.eta);
      allPhi.push(p.phi);
    });
    allMET.push(event.met.mag);
    allMult.push(event.multiplicity);
    // Invariant mass from muon pairs
    const muons = event.particles.filter(p => p.type==='muon'||p.type==='antimuon');
    for (let i=0;i<muons.length;i++) for(let j=i+1;j<muons.length;j++){
      if(muons[i].charge!==muons[j].charge){
        const E=muons[i].energy+muons[j].energy, px=muons[i].px+muons[j].px, py=muons[i].py+muons[j].py, pz=muons[i].pz+muons[j].pz;
        allMass.push(Math.sqrt(Math.max(0,E*E-px*px-py*py-pz*pz)));
      }
    }
    const photons = event.particles.filter(p => p.type==='photon');
    for (let i=0;i<photons.length;i++) for(let j=i+1;j<photons.length;j++){
      const E=photons[i].energy+photons[j].energy, px=photons[i].px+photons[j].px, py=photons[i].py+photons[j].py, pz=photons[i].pz+photons[j].pz;
      allMass.push(Math.sqrt(Math.max(0,E*E-px*px-py*py-pz*pz)));
    }
    showChart(activeTab);
  }

  function histogram(data, nBins, min, max) {
    const bins = new Array(nBins).fill(0);
    const labels = [];
    const bw = (max-min)/nBins;
    for (let i=0;i<nBins;i++) labels.push((min+bw*(i+0.5)).toFixed(1));
    data.forEach(v => { const b=Math.floor((v-min)/bw); if(b>=0&&b<nBins) bins[b]++; });
    return { labels, values: bins };
  }

  function showChart(tab) {
    activeTab = tab;
    if (!mainChart) return;
    let config;
    switch(tab) {
      case 'pt': {
        const h = histogram(allPt, 40, 0, 20);
        config = { type:'bar', data:{ labels:h.labels, datasets:[{label:'dN/dp_T', data:h.values,
          backgroundColor:chartColors.fill, borderColor:chartColors.line, borderWidth:1}] },
          options:{...chartOpts, scales:{...chartOpts.scales, x:{...chartOpts.scales.x, title:{display:true,text:'pT (GeV/c)',color:chartColors.text}},
            y:{...chartOpts.scales.y, title:{display:true,text:'Counts',color:chartColors.text}}}} };
        break;
      }
      case 'eta': {
        const h = histogram(allEta, 40, -5, 5);
        config = { type:'bar', data:{ labels:h.labels, datasets:[{label:'dN/dη', data:h.values,
          backgroundColor:'rgba(124,58,237,0.2)', borderColor:chartColors.accent2, borderWidth:1}] },
          options:{...chartOpts, scales:{...chartOpts.scales, x:{...chartOpts.scales.x, title:{display:true,text:'Pseudorapidity η',color:chartColors.text}},
            y:{...chartOpts.scales.y, title:{display:true,text:'Counts',color:chartColors.text}}}} };
        break;
      }
      case 'mass': {
        const h = histogram(allMass, 60, 0, 200);
        config = { type:'bar', data:{ labels:h.labels, datasets:[{label:'dN/dm', data:h.values,
          backgroundColor:'rgba(244,63,94,0.2)', borderColor:chartColors.accent3, borderWidth:1}] },
          options:{...chartOpts, scales:{...chartOpts.scales, x:{...chartOpts.scales.x, title:{display:true,text:'Invariant Mass (GeV/c²)',color:chartColors.text}},
            y:{...chartOpts.scales.y, title:{display:true,text:'Counts',color:chartColors.text}}}} };
        break;
      }
      case 'phi': {
        const h = histogram(allPhi, 36, 0, 2*Math.PI);
        config = { type:'bar', data:{ labels:h.labels, datasets:[{label:'dN/dφ', data:h.values,
          backgroundColor:'rgba(34,197,94,0.2)', borderColor:'#22c55e', borderWidth:1}] },
          options:{...chartOpts, scales:{...chartOpts.scales, x:{...chartOpts.scales.x, title:{display:true,text:'Azimuthal Angle φ (rad)',color:chartColors.text}},
            y:{...chartOpts.scales.y, title:{display:true,text:'Counts',color:chartColors.text}}}} };
        break;
      }
      case 'met': {
        const h = histogram(allMET, 30, 0, Math.max(50,...allMET));
        config = { type:'bar', data:{ labels:h.labels, datasets:[{label:'MET Distribution', data:h.values,
          backgroundColor:'rgba(245,158,11,0.2)', borderColor:'#f59e0b', borderWidth:1}] },
          options:{...chartOpts, scales:{...chartOpts.scales, x:{...chartOpts.scales.x, title:{display:true,text:'Missing ET (GeV)',color:chartColors.text}},
            y:{...chartOpts.scales.y, title:{display:true,text:'Events',color:chartColors.text}}}} };
        break;
      }
      case 'mult': {
        const h = histogram(allMult, 30, 0, Math.max(60,...allMult));
        config = { type:'bar', data:{ labels:h.labels, datasets:[{label:'Multiplicity', data:h.values,
          backgroundColor:'rgba(236,72,153,0.2)', borderColor:'#ec4899', borderWidth:1}] },
          options:{...chartOpts, scales:{...chartOpts.scales, x:{...chartOpts.scales.x, title:{display:true,text:'Particle Multiplicity',color:chartColors.text}},
            y:{...chartOpts.scales.y, title:{display:true,text:'Events',color:chartColors.text}}}} };
        break;
      }
    }
    if (config) {
      mainChart.destroy();
      const ctx = document.getElementById('chart-main').getContext('2d');
      mainChart = new Chart(ctx, config);
    }
  }

  function clear() { allPt.length=0; allEta.length=0; allPhi.length=0; allMET.length=0; allMult.length=0; allMass.length=0; showChart(activeTab); }
  function getActiveTab() { return activeTab; }
  function exportCSV() {
    let csv = 'pT,eta,phi\n';
    for (let i=0;i<allPt.length;i++) csv += `${allPt[i].toFixed(4)},${allEta[i].toFixed(4)},${allPhi[i].toFixed(4)}\n`;
    const blob = new Blob([csv], {type:'text/csv'});
    const a = document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='lhc_sim_data.csv'; a.click();
  }

  return { init, addEventData, showChart, clear, getActiveTab, exportCSV };
})();
