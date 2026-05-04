// ===== 3D/2D Collision Visualization using Three.js =====
window.CollisionViz = (function() {
  let scene, camera, renderer, controls, animationId;
  let particleGroup, detectorGroup, jetGroup, trackGroup;
  let is3D = true, container, canvas2d, ctx2d;
  let currentEvent = null, animProgress = 0, isAnimating = false;
  let showLabels = false;

  function init(containerEl, canvasEl) {
    container = containerEl; canvas2d = canvasEl;
    ctx2d = canvas2d.getContext('2d');
    // Three.js setup
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0a0f1e, 0.08);
    camera = new THREE.PerspectiveCamera(60, container.clientWidth/container.clientHeight, 0.1, 100);
    camera.position.set(4, 3, 5);
    camera.lookAt(0,0,0);
    renderer = new THREE.WebGLRenderer({ antialias:true, alpha:true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x0a0f1e, 1);
    container.appendChild(renderer.domElement);

    // Lights
    scene.add(new THREE.AmbientLight(0x1a2248, 0.5));
    const dirLight = new THREE.DirectionalLight(0x00e5ff, 0.3);
    dirLight.position.set(5,5,5);
    scene.add(dirLight);
    const pointLight = new THREE.PointLight(0x448aff, 0.5, 10);
    scene.add(pointLight);

    // Groups
    particleGroup = new THREE.Group(); scene.add(particleGroup);
    detectorGroup = new THREE.Group(); scene.add(detectorGroup);
    jetGroup = new THREE.Group(); scene.add(jetGroup);
    trackGroup = new THREE.Group(); scene.add(trackGroup);

    // Simple detector outline
    buildDetectorOutline();
    // Beam line
    const beamGeo = new THREE.CylinderGeometry(0.005, 0.005, 10, 8);
    const beamMat = new THREE.MeshBasicMaterial({ color:0x00e5ff, transparent:true, opacity:0.3 });
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.rotation.z = Math.PI/2;
    scene.add(beam);

    // Grid
    const grid = new THREE.GridHelper(10, 20, 0x1a2248, 0x0d1329);
    grid.position.y = -2;
    scene.add(grid);

    // Mouse controls (simple orbit)
    setupOrbitControls();
    window.addEventListener('resize', onResize);
    animate();
  }

  function buildDetectorOutline() {
    detectorGroup.clear();
    // Tracker barrel
    addCylinder(0.5, 2, 0x00e5ff, 0.08, detectorGroup);
    // ECAL
    addCylinder(1.0, 2.5, 0x00e676, 0.06, detectorGroup);
    // HCAL
    addCylinder(1.8, 3, 0x448aff, 0.05, detectorGroup);
    // Muon system
    addCylinder(2.5, 3.5, 0xff5252, 0.04, detectorGroup);
  }

  function addCylinder(radius, height, color, opacity, group) {
    const geo = new THREE.CylinderGeometry(radius, radius, height, 32, 1, true);
    const mat = new THREE.MeshBasicMaterial({ color, transparent:true, opacity, wireframe:true, side:THREE.DoubleSide });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.z = Math.PI/2;
    group.add(mesh);
  }

  function setupOrbitControls() {
    let isDragging = false, prevX, prevY, rotX=0.3, rotY=0.5, dist=7;
    const el = renderer.domElement;
    el.addEventListener('mousedown', e => { isDragging=true; prevX=e.clientX; prevY=e.clientY; });
    el.addEventListener('mousemove', e => {
      if (!isDragging) return;
      rotY += (e.clientX-prevX)*0.005; rotX += (e.clientY-prevY)*0.005;
      rotX = Math.max(-1.5, Math.min(1.5, rotX));
      prevX=e.clientX; prevY=e.clientY;
      updateCamera();
    });
    el.addEventListener('mouseup', () => isDragging=false);
    el.addEventListener('mouseleave', () => isDragging=false);
    el.addEventListener('wheel', e => { dist += e.deltaY*0.005; dist=Math.max(2,Math.min(15,dist)); updateCamera(); e.preventDefault(); }, {passive:false});
    function updateCamera() {
      camera.position.x = dist*Math.sin(rotY)*Math.cos(rotX);
      camera.position.y = dist*Math.sin(rotX);
      camera.position.z = dist*Math.cos(rotY)*Math.cos(rotX);
      camera.lookAt(0,0,0);
    }
    updateCamera();
  }

  function displayEvent(event) {
    currentEvent = event;
    clearParticles();
    animProgress = 0;
    isAnimating = true;
    // Vertex burst flash
    const burstGeo = new THREE.SphereGeometry(0.15, 16, 16);
    const burstMat = new THREE.MeshBasicMaterial({ color:0x00e5ff, transparent:true, opacity:1 });
    const burst = new THREE.Mesh(burstGeo, burstMat);
    burst.userData = { isBurst:true, life:1 };
    particleGroup.add(burst);
    // Add tracks
    event.tracks.forEach(track => {
      const points = track.points.map(p => new THREE.Vector3(p.x, p.y, p.z));
      const geo = new THREE.BufferGeometry().setFromPoints(points);
      const mat = new THREE.LineBasicMaterial({ color: new THREE.Color(track.color), transparent:true, opacity:0.8 });
      const line = new THREE.Line(geo, mat);
      line.userData = { totalPoints: points.length, track };
      trackGroup.add(line);
    });
    // Add particle endpoints
    event.particles.forEach(p => {
      const size = Math.min(0.08, 0.02 + p.pt*0.005);
      const geo = new THREE.SphereGeometry(size, 8, 8);
      const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(p.color) });
      const mesh = new THREE.Mesh(geo, mat);
      const r = 2.5;
      mesh.position.set(r*Math.cos(p.phi)*Math.cos(Math.atan(Math.sinh(p.eta))),
                         r*Math.sin(p.phi)*Math.cos(Math.atan(Math.sinh(p.eta))),
                         r*Math.sin(Math.atan(Math.sinh(p.eta))));
      mesh.visible = false;
      mesh.userData = { particle:p, showAt: 0.7 };
      particleGroup.add(mesh);
    });
    // Jets as cones
    event.jets.forEach(jet => {
      const len = Math.min(2, 0.3+jet.pt*0.05);
      const geo = new THREE.ConeGeometry(0.15+jet.pt*0.01, len, 8);
      const mat = new THREE.MeshBasicMaterial({ color:0xf97316, transparent:true, opacity:0.3 });
      const mesh = new THREE.Mesh(geo, mat);
      const r = 1.5;
      mesh.position.set(r*Math.cos(jet.phi), r*Math.sin(jet.phi), r*Math.tanh(jet.eta));
      mesh.lookAt(0,0,0);
      mesh.visible = false;
      mesh.userData = { showAt: 0.5 };
      jetGroup.add(mesh);
    });
  }

  function clearParticles() {
    [particleGroup, trackGroup, jetGroup].forEach(g => { while(g.children.length) g.remove(g.children[0]); });
  }

  function animate() {
    animationId = requestAnimationFrame(animate);
    if (isAnimating && currentEvent) {
      animProgress = Math.min(1, animProgress + 0.02);
      // Animate tracks growing
      trackGroup.children.forEach(line => {
        const geo = line.geometry;
        const total = line.userData.totalPoints;
        const drawCount = Math.floor(animProgress * total);
        geo.setDrawRange(0, drawCount);
      });
      // Animate vertex burst
      particleGroup.children.forEach(m => {
        if (m.userData.isBurst) { m.userData.life -= 0.03; m.material.opacity = Math.max(0, m.userData.life); m.scale.setScalar(1 + (1-m.userData.life)*3); if(m.userData.life<=0) particleGroup.remove(m); }
        else if (m.userData.showAt !== undefined && animProgress >= m.userData.showAt) m.visible = true;
      });
      jetGroup.children.forEach(m => { if (animProgress >= m.userData.showAt) m.visible = true; });
      if (animProgress >= 1) isAnimating = false;
    }
    // Slow rotation when idle
    if (!isAnimating) {
      particleGroup.rotation.x += 0.001;
      detectorGroup.rotation.x += 0.0005;
    }
    renderer.render(scene, camera);
    if (!is3D) draw2D();
  }

  function draw2D() {
    if (!currentEvent) return;
    const w = canvas2d.width = canvas2d.clientWidth * window.devicePixelRatio;
    const h = canvas2d.height = canvas2d.clientHeight * window.devicePixelRatio;
    ctx2d.clearRect(0,0,w,h);
    const cx=w/2, cy=h/2, scale=Math.min(w,h)*0.35;
    // Detector rings
    [0.3,0.55,0.75,0.95].forEach((r,i) => {
      ctx2d.beginPath(); ctx2d.arc(cx,cy,scale*r,0,Math.PI*2);
      ctx2d.strokeStyle = ['#00e5ff','#00e676','#448aff','#ff5252'][i];
      ctx2d.globalAlpha = 0.15; ctx2d.lineWidth = 1; ctx2d.stroke(); ctx2d.globalAlpha = 1;
    });
    // Tracks
    if (currentEvent) {
      currentEvent.particles.forEach(p => {
        const endR = scale * 0.9;
        const ex = cx + endR*Math.cos(p.phi), ey = cy + endR*Math.sin(p.phi);
        ctx2d.beginPath(); ctx2d.moveTo(cx, cy);
        if (p.charge !== 0) {
          const cpx = cx + (endR*0.5)*Math.cos(p.phi + p.charge*0.3);
          const cpy = cy + (endR*0.5)*Math.sin(p.phi + p.charge*0.3);
          ctx2d.quadraticCurveTo(cpx, cpy, ex, ey);
        } else {
          ctx2d.lineTo(ex, ey);
        }
        ctx2d.strokeStyle = p.color; ctx2d.lineWidth = Math.max(1, p.pt*0.3);
        ctx2d.globalAlpha = 0.7; ctx2d.stroke(); ctx2d.globalAlpha = 1;
        // Endpoint dot
        ctx2d.beginPath(); ctx2d.arc(ex, ey, 3, 0, Math.PI*2);
        ctx2d.fillStyle = p.color; ctx2d.fill();
        // Labels
        if (showLabels) {
          const lx = cx + (endR + 14)*Math.cos(p.phi);
          const ly = cy + (endR + 14)*Math.sin(p.phi);
          ctx2d.font = '10px JetBrains Mono';
          ctx2d.fillStyle = '#e4e8f1';
          ctx2d.textAlign = 'center';
          ctx2d.fillText(p.type + ' ' + p.pt.toFixed(1), lx, ly);
        }
      });
      // Jets
      currentEvent.jets.forEach(jet => {
        const jr = scale*0.7;
        ctx2d.beginPath();
        ctx2d.moveTo(cx + jr*0.2*Math.cos(jet.phi-0.15), cy + jr*0.2*Math.sin(jet.phi-0.15));
        ctx2d.lineTo(cx + jr*Math.cos(jet.phi-0.1-jet.pt*0.003), cy + jr*Math.sin(jet.phi-0.1-jet.pt*0.003));
        ctx2d.lineTo(cx + jr*Math.cos(jet.phi+0.1+jet.pt*0.003), cy + jr*Math.sin(jet.phi+0.1+jet.pt*0.003));
        ctx2d.closePath();
        ctx2d.fillStyle = 'rgba(249,115,22,0.15)'; ctx2d.fill();
        ctx2d.strokeStyle = 'rgba(249,115,22,0.4)'; ctx2d.lineWidth = 1; ctx2d.stroke();
        // Jet labels
        if (showLabels) {
          const jlx = cx + (jr+14)*Math.cos(jet.phi);
          const jly = cy + (jr+14)*Math.sin(jet.phi);
          ctx2d.font = '10px JetBrains Mono';
          ctx2d.fillStyle = '#f97316';
          ctx2d.textAlign = 'center';
          ctx2d.fillText('jet ' + jet.pt.toFixed(1), jlx, jly);
        }
      });
    }
  }

  function setMode(mode3d) {
    is3D = mode3d;
    if (is3D) {
      renderer.domElement.style.display = 'block';
      canvas2d.style.display = 'none';
      canvas2d.style.pointerEvents = 'none';
    } else {
      renderer.domElement.style.display = 'none';
      canvas2d.style.display = 'block';
      canvas2d.style.pointerEvents = 'auto';
      canvas2d.style.zIndex = '5';
      draw2D();
    }
  }

  function toggleDetector(show) { detectorGroup.visible = show; }
  function toggleTracks(show) { trackGroup.visible = show; }
  function toggleJets(show) { jetGroup.visible = show; }

  function onResize() {
    if (!container) return;
    camera.aspect = container.clientWidth/container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  }

  function getFPS() { return 60; } // Simplified

  function toggleLabels(show) { showLabels = show; }

  return { init, displayEvent, clearParticles, setMode, toggleDetector, toggleTracks, toggleJets, toggleLabels, getFPS, onResize };
})();
