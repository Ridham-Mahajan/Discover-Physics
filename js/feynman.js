// ===== Feynman Diagram Generator =====
window.FeynmanDiagram = (function() {
  let canvas, ctx;
  const diagrams = {
    'ee-mumu': { title:'e\u207ae\u207b \u2192 \u03bc\u207a\u03bc\u207b (via \u03b3/Z\u2070)', desc:'Electron-positron annihilation producing a muon pair via virtual photon or Z boson exchange. This is one of the cleanest processes at e\u207ae\u207b colliders.',
      incoming:[{label:'e\u207b'},{label:'e\u207a'}], outgoing:[{label:'\u03bc\u207b'},{label:'\u03bc\u207a'}], propagator:{type:'wavy',label:'\u03b3/Z\u2070'} },
    'ee-qq': { title:'e\u207ae\u207b \u2192 qq\u0304', desc:'Quark-antiquark pair production. The quarks immediately hadronize, producing jets of particles observed in the detector.',
      incoming:[{label:'e\u207b'},{label:'e\u207a'}], outgoing:[{label:'q'},{label:'q\u0304'}], propagator:{type:'wavy',label:'\u03b3/Z\u2070'} },
    'gg-higgs': { title:'gg \u2192 H (via top loop)', desc:'Gluon-gluon fusion is the dominant Higgs production mechanism at the LHC. A top quark loop mediates the coupling since gluons don\'t directly couple to the Higgs.',
      incoming:[{label:'g'},{label:'g'}], outgoing:[{label:'H\u2070'}], propagator:{type:'loop',label:'t'} },
    'qq-z': { title:'qq\u0304 \u2192 Z\u2070 \u2192 \u2113\u207a\u2113\u207b', desc:'Drell-Yan Z boson production and decay to a lepton pair. The Z mass peak at 91.2 GeV is one of the most precisely measured quantities in physics.',
      incoming:[{label:'q'},{label:'q\u0304'}], outgoing:[{label:'\u2113\u207b'},{label:'\u2113\u207a'}], propagator:{type:'wavy',label:'Z\u2070'} },
    'qq-w': { title:'ud\u0304 \u2192 W\u207a \u2192 \u2113\u207a\u03bd', desc:'W boson production from quark-antiquark annihilation. The W only couples to left-handed fermions, a key feature of the weak interaction.',
      incoming:[{label:'u'},{label:'d\u0304'}], outgoing:[{label:'\u2113\u207a'},{label:'\u03bd'}], propagator:{type:'wavy',label:'W\u207a'} },
    'gg-tt': { title:'gg \u2192 tt\u0304', desc:'Top quark pair production via gluon fusion. The top quark (173 GeV) decays almost immediately to Wb, making it unique among quarks.',
      incoming:[{label:'g'},{label:'g'}], outgoing:[{label:'t'},{label:'t\u0304'}], propagator:{type:'curly',label:'g'} },
    'compton': { title:'e\u03b3 \u2192 e\u03b3 (Compton Scattering)', desc:'A photon scattering off an electron, one of the first QED processes calculated.',
      incoming:[{label:'e\u207b'},{label:'\u03b3'}], outgoing:[{label:'e\u207b'},{label:'\u03b3'}], propagator:{type:'straight',label:'e\u207b'} },
    'bhabha': { title:'e\u207ae\u207b \u2192 e\u207ae\u207b (Bhabha)', desc:'Electron-positron elastic scattering. Both s-channel (annihilation) and t-channel (exchange) contribute.',
      incoming:[{label:'e\u207b'},{label:'e\u207a'}], outgoing:[{label:'e\u207b'},{label:'e\u207a'}], propagator:{type:'wavy',label:'\u03b3'} },
  };

  function init(canvasEl) { canvas = canvasEl; ctx = canvas.getContext('2d'); draw('ee-mumu'); }

  function draw(process) {
    const d = diagrams[process]; if (!d) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvas.clientWidth * dpr;
    canvas.height = (canvas.clientHeight || 400) * dpr;
    ctx.scale(dpr, dpr);
    const cw = canvas.clientWidth, ch = canvas.clientHeight || 400;
    ctx.clearRect(0,0,cw,ch);

    ctx.fillStyle = '#06060f'; ctx.fillRect(0,0,cw,ch);
    // Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.03)'; ctx.lineWidth = 1;
    for (let x=0; x<cw; x+=40) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,ch); ctx.stroke(); }
    for (let y=0; y<ch; y+=40) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(cw,y); ctx.stroke(); }

    ctx.fillStyle = '#e8e6e3'; ctx.font = 'bold 15px Inter'; ctx.textAlign = 'center';
    ctx.fillText(d.title, cw/2, 30);

    const cy = ch/2;
    const spread = ch * 0.22;
    const armLen = cw * 0.28;
    const vx1 = cw/2 - 30, vx2 = cw/2 + 30;

    // Incoming lines to left vertex
    d.incoming.forEach((p, i) => {
      const py = cy + (i === 0 ? -spread : spread);
      drawFermionLine(ctx, vx1 - armLen, py, vx1, cy, p.label, true);
    });

    // Propagator between two vertices
    if (d.propagator.type === 'wavy') {
      drawWavyLine(ctx, vx1, cy, vx2, cy, d.propagator.label);
    } else if (d.propagator.type === 'curly') {
      drawCurlyLine(ctx, vx1, cy, vx2, cy, d.propagator.label);
    } else if (d.propagator.type === 'loop') {
      drawTriangleLoop(ctx, cw/2, cy, 30, d.propagator.label);
    } else {
      ctx.beginPath(); ctx.moveTo(vx1,cy); ctx.lineTo(vx2,cy);
      ctx.strokeStyle = '#e8e6e3'; ctx.lineWidth = 2; ctx.stroke();
    }

    // Outgoing lines from right vertex
    if (d.outgoing.length === 1) {
      drawScalarLine(ctx, vx2, cy, vx2 + armLen, cy, d.outgoing[0].label);
    } else {
      d.outgoing.forEach((p, i) => {
        const py = cy + (i === 0 ? -spread : spread);
        drawFermionLine(ctx, vx2, cy, vx2 + armLen, py, p.label, false);
      });
    }

    drawVertex(ctx, vx1, cy);
    if (d.propagator.type !== 'loop') drawVertex(ctx, vx2, cy);

    // Time arrow
    ctx.fillStyle = '#6b6762'; ctx.font = '10px Inter'; ctx.textAlign = 'center';
    ctx.fillText('time \u2192', cw/2, ch - 18);

    document.getElementById('feynman-info').innerHTML = '<p>' + d.desc + '</p>';
  }

  function drawFermionLine(c, x1,y1,x2,y2, label, isIncoming) {
    c.beginPath(); c.moveTo(x1,y1); c.lineTo(x2,y2);
    c.strokeStyle = '#e8e6e3'; c.lineWidth = 2; c.stroke();
    var mx = (x1+x2)/2, my = (y1+y2)/2;
    var angle = Math.atan2(y2-y1, x2-x1);
    c.beginPath();
    c.moveTo(mx - 5*Math.cos(angle-0.5), my - 5*Math.sin(angle-0.5));
    c.lineTo(mx + 3*Math.cos(angle), my + 3*Math.sin(angle));
    c.lineTo(mx - 5*Math.cos(angle+0.5), my - 5*Math.sin(angle+0.5));
    c.strokeStyle = '#e8e6e3'; c.lineWidth = 1.5; c.stroke();
    if (!label) return;
    var lx = isIncoming ? x1 - 12 : x2 + 12;
    var ly = isIncoming ? y1 : y2;
    c.fillStyle = '#e8a838'; c.font = '13px JetBrains Mono'; c.textAlign = isIncoming ? 'right' : 'left';
    c.fillText(label, lx, ly + 5);
  }

  function drawWavyLine(c, x1, y1, x2, y2, label) {
    var dx = x2-x1, dy = y2-y1, len = Math.sqrt(dx*dx+dy*dy);
    var steps = 30, amp = 5, waves = 4;
    c.beginPath();
    for (var i = 0; i <= steps; i++) {
      var t = i / steps;
      var bx = x1 + dx * t, by = y1 + dy * t;
      var nx = -dy/len, ny = dx/len;
      var offset = Math.sin(t * Math.PI * 2 * waves) * amp;
      var px = bx + nx * offset, py = by + ny * offset;
      if (i === 0) c.moveTo(px, py); else c.lineTo(px, py);
    }
    c.strokeStyle = '#ffc107'; c.lineWidth = 2; c.stroke();
    c.fillStyle = '#ffc107'; c.font = '12px JetBrains Mono'; c.textAlign = 'center';
    c.fillText(label, (x1+x2)/2, y1 - 14);
  }

  function drawCurlyLine(c, x1, y1, x2, y2, label) {
    var dx = x2-x1, dy = y2-y1, len = Math.sqrt(dx*dx+dy*dy);
    var steps = 40, amp = 6, loops = 6;
    c.beginPath();
    for (var i = 0; i <= steps; i++) {
      var t = i / steps;
      var bx = x1 + dx * t, by = y1 + dy * t;
      var nx = -dy/len, ny = dx/len;
      var offset = Math.sin(t * Math.PI * 2 * loops) * amp;
      var px = bx + nx * offset, py = by + ny * offset;
      if (i === 0) c.moveTo(px, py); else c.lineTo(px, py);
    }
    c.strokeStyle = '#00e676'; c.lineWidth = 2.5; c.stroke();
    c.fillStyle = '#00e676'; c.font = '12px JetBrains Mono'; c.textAlign = 'center';
    c.fillText(label, (x1+x2)/2, y1 - 14);
  }

  function drawScalarLine(c, x1,y1,x2,y2, label) {
    c.beginPath(); c.setLineDash([6,4]); c.moveTo(x1,y1); c.lineTo(x2,y2);
    c.strokeStyle = '#e8a838'; c.lineWidth = 2.5; c.stroke(); c.setLineDash([]);
    c.fillStyle = '#e8a838'; c.font = '13px JetBrains Mono'; c.textAlign = 'center';
    c.fillText(label, (x1+x2)/2, y1 - 12);
  }

  function drawTriangleLoop(c, cx, cy, r, label) {
    var pts = [[cx-r, cy+r*0.6], [cx, cy-r*0.8], [cx+r, cy+r*0.6]];
    c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); c.lineTo(pts[1][0], pts[1][1]);
    c.lineTo(pts[2][0], pts[2][1]); c.closePath();
    c.strokeStyle = '#ff5252'; c.lineWidth = 2.5; c.stroke();
    c.fillStyle = '#ff5252'; c.font = '12px JetBrains Mono'; c.textAlign = 'center';
    c.fillText(label, cx, cy + 5);
    drawVertex(c, pts[0][0], pts[0][1]);
    drawVertex(c, pts[1][0], pts[1][1]);
    drawVertex(c, pts[2][0], pts[2][1]);
  }

  function drawVertex(c, x, y) {
    c.beginPath(); c.arc(x, y, 4, 0, Math.PI*2);
    c.fillStyle = '#e8e6e3'; c.fill();
    c.beginPath(); c.arc(x, y, 7, 0, Math.PI*2);
    c.strokeStyle = 'rgba(232,168,56,0.3)'; c.lineWidth = 1; c.stroke();
  }

  function getProcesses() { return Object.keys(diagrams).map(function(k) { return {key:k, title:diagrams[k].title}; }); }

  return { init: init, draw: draw, getProcesses: getProcesses };
})();
