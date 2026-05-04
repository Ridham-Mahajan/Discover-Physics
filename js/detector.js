// ===== 3D Detector Explorer =====
window.DetectorExplorer = (function() {
  let scene, camera, renderer, detectorGroup, activeLayer = 'all';
  let isInit = false, rotY = 0;
  const layers = {};
  const layerInfo = {
    tracker: { name:'Silicon Tracker', color:0x00d4ff, radius:0.4, length:2.2,
      desc:'<strong>Silicon Tracker</strong> — Precision tracking of charged particles using silicon pixel and strip detectors. Measures particle trajectories with ~15μm resolution. The strong magnetic field bends charged tracks, allowing momentum measurement via: <div class="formula">p = 0.3 × B × R</div>where B is the field strength and R is the curvature radius.' },
    ecal: { name:'Electromagnetic Calorimeter', color:0x22c55e, radius:0.9, length:2.8,
      desc:'<strong>ECAL</strong> — Absorbs and measures energy of electrons, positrons, and photons through electromagnetic showers. CMS uses PbWO₄ crystals; ATLAS uses liquid argon. Resolution: <div class="formula">σ(E)/E = 3%/√E ⊕ 0.5%</div>' },
    hcal: { name:'Hadronic Calorimeter', color:0xf59e0b, radius:1.5, length:3.2,
      desc:'<strong>HCAL</strong> — Absorbs and measures energy of hadrons (protons, pions, kaons, neutrons) through hadronic showers. Uses alternating layers of dense absorber and active material. Resolution: <div class="formula">σ(E)/E = 80%/√E ⊕ 5%</div>' },
    solenoid: { name:'Superconducting Solenoid', color:0x8b5cf6, radius:1.9, length:3.5,
      desc:'<strong>Solenoid Magnet</strong> — Creates a uniform magnetic field parallel to the beam axis. CMS has 3.8T (strongest for a detector); ATLAS has 2T solenoid plus toroidal magnets. The field bends charged particle paths for momentum measurement.' },
    muon: { name:'Muon System', color:0xf43f5e, radius:2.5, length:4.0,
      desc:'<strong>Muon System</strong> — The outermost layer. Only muons (and neutrinos) penetrate this far. Multiple layers of gas detectors track muons with high precision. Muons are key signatures for many important processes including H→ZZ→4μ.' }
  };

  function init(canvasEl) {
    if (isInit) return;
    isInit = true;
    const w = canvasEl.parentElement.clientWidth, h = 400;
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0e1a);
    camera = new THREE.PerspectiveCamera(50, w/h, 0.1, 50);
    camera.position.set(5, 3, 5);
    camera.lookAt(0,0,0);
    renderer = new THREE.WebGLRenderer({ canvas:canvasEl, antialias:true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    scene.add(new THREE.AmbientLight(0xffffff, 0.4));
    const dl = new THREE.DirectionalLight(0xffffff, 0.6); dl.position.set(3,5,3); scene.add(dl);

    detectorGroup = new THREE.Group();
    scene.add(detectorGroup);
    // Beam line
    const bg = new THREE.CylinderGeometry(0.01,0.01,8,8);
    const bm = new THREE.MeshBasicMaterial({color:0x00d4ff, transparent:true, opacity:0.5});
    const beam = new THREE.Mesh(bg,bm); beam.rotation.z=Math.PI/2; scene.add(beam);

    Object.entries(layerInfo).forEach(([key, info]) => {
      const geo = new THREE.CylinderGeometry(info.radius, info.radius, info.length, 48, 1, true);
      const mat = new THREE.MeshPhongMaterial({ color:info.color, transparent:true, opacity:0.25, wireframe:false, side:THREE.DoubleSide });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.rotation.z = Math.PI/2;
      // Wireframe overlay
      const wf = new THREE.Mesh(geo.clone(), new THREE.MeshBasicMaterial({color:info.color, transparent:true, opacity:0.4, wireframe:true}));
      wf.rotation.z = Math.PI/2;
      const group = new THREE.Group();
      group.add(mesh); group.add(wf);
      layers[key] = group;
      detectorGroup.add(group);
    });

    // Endcaps
    Object.entries(layerInfo).forEach(([key, info]) => {
      const geo = new THREE.RingGeometry(0.05, info.radius, 32);
      const mat = new THREE.MeshBasicMaterial({color:info.color, transparent:true, opacity:0.1, side:THREE.DoubleSide});
      const d1 = new THREE.Mesh(geo, mat); d1.position.x = info.length/2; d1.rotation.y = Math.PI/2;
      const d2 = d1.clone(); d2.position.x = -info.length/2;
      layers[key].add(d1); layers[key].add(d2);
    });

    // Controls
    let isDrag=false, pX, pY, rX=0.3, rY=0, dist=6;
    canvasEl.addEventListener('mousedown', e=>{isDrag=true;pX=e.clientX;pY=e.clientY;});
    canvasEl.addEventListener('mousemove', e=>{if(!isDrag)return;rY+=(e.clientX-pX)*0.005;rX+=(e.clientY-pY)*0.005;rX=Math.max(-1.2,Math.min(1.2,rX));pX=e.clientX;pY=e.clientY;});
    canvasEl.addEventListener('mouseup', ()=>isDrag=false);
    canvasEl.addEventListener('wheel', e=>{dist+=e.deltaY*0.005;dist=Math.max(2,Math.min(12,dist));e.preventDefault();},{passive:false});

    function animateDetector() {
      requestAnimationFrame(animateDetector);
      if (!isDrag) rY += 0.003;
      camera.position.x=dist*Math.sin(rY)*Math.cos(rX);
      camera.position.y=dist*Math.sin(rX);
      camera.position.z=dist*Math.cos(rY)*Math.cos(rX);
      camera.lookAt(0,0,0);
      renderer.render(scene, camera);
    }
    animateDetector();
    showLayer('all');
    updateDescription('all');
  }

  function showLayer(key) {
    activeLayer = key;
    Object.entries(layers).forEach(([k, g]) => {
      if (key === 'all') { g.visible = true; g.children.forEach(c => { if(c.material) c.material.opacity = 0.25; }); }
      else { g.visible = (k === key); if(k === key) g.children.forEach(c => { if(c.material) c.material.opacity = 0.5; }); }
    });
  }

  function updateDescription(key) {
    const el = document.getElementById('layer-description');
    if (key === 'all') el.innerHTML = 'Select a detector layer to explore its structure and function. Each layer is designed to detect specific particle types.';
    else el.innerHTML = layerInfo[key].desc;
  }

  return { init, showLayer, updateDescription };
})();
