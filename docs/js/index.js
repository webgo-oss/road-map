    import * as THREE from 'https://cdn.skypack.dev/three@0.129.0/build/three.module.js';
    import { OrbitControls } from 'https://cdn.skypack.dev/three@0.129.0/examples/jsm/controls/OrbitControls.js';
    import { EffectComposer } from 'https://cdn.skypack.dev/three@0.129.0/examples/jsm/postprocessing/EffectComposer.js';
    import { RenderPass } from 'https://cdn.skypack.dev/three@0.129.0/examples/jsm/postprocessing/RenderPass.js';
    import { UnrealBloomPass } from 'https://cdn.skypack.dev/three@0.129.0/examples/jsm/postprocessing/UnrealBloomPass.js';

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 15;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.outputEncoding = THREE.sRGBEncoding;
    document.body.appendChild(renderer.domElement);

    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0);
    composer.addPass(bloomPass);

    const light = new THREE.PointLight(0x99ccff, 2, 300);
    scene.add(light);

    const core = new THREE.Mesh(
      new THREE.SphereGeometry(2, 32, 32),
      new THREE.MeshBasicMaterial({ color: 0x99ccff, transparent: true, opacity: 0.9 })
    );
    scene.add(core);

    const lineMat = new THREE.LineBasicMaterial({
      color: 0x99ccff,
      transparent: true,
      opacity: 0.3,
      blending: THREE.AdditiveBlending
    });
    const lines = [];
    for (let i = 0; i < 180; i++) {
      const pts = [];
      const phi = Math.acos(2 * Math.random() - 1);
      const theta = Math.random() * Math.PI * 2;
      const dir = new THREE.Vector3(Math.sin(phi) * Math.cos(theta), Math.sin(phi) * Math.sin(theta), Math.cos(phi));
      for (let j = 0; j < 20; j++) {
        const r = 5 + j * 0.8 + Math.sin(i * 0.2 + j * 0.3) * 0.5;
        pts.push(dir.clone().multiplyScalar(r));
      }
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      const line = new THREE.Line(geo, lineMat);
      scene.add(line);
      lines.push(line);
    }

    let topics = [];
    try {
      const res = await fetch('http://127.0.0.1:5000/roadmap');
      topics = await res.json();
      console.log("✅ Topics Loaded:", topics);
    } catch (err) {
      console.error("⚠ Could not fetch topics:", err);
      topics = ["AI Basics", "Machine Learning", "Deep Learning", "Computer Vision", "NLP", "Reinforcement Learning"];
    }

    const cubes = [];
    const cubeMat = new THREE.MeshBasicMaterial({ color: 0x99ccff });
    for (let i = 0; i < topics.length; i++) {
      const cube = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.8, 1.8), cubeMat.clone());
      const phi = Math.acos(2 * Math.random() - 1);
      const theta = Math.random() * Math.PI * 2;
      const r = 20 + Math.random() * 20;
      cube.position.set(Math.sin(phi) * Math.cos(theta) * r, Math.sin(phi) * Math.sin(theta) * r, Math.cos(phi) * r);
      cube.userData.topic = topics[i];
      scene.add(cube);
      cubes.push(cube);
    }

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    window.addEventListener('click', (event) => {
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(cubes);
      if (intersects.length > 0) {
        const cube = intersects[0].object;
        const infoBox = document.getElementById('info');
        infoBox.style.left = event.clientX + 'px';
        infoBox.style.top = event.clientY + 'px';
        document.getElementById('topicTitle').innerText = cube.userData.topic;
        infoBox.classList.add('active');
      }
    });

    window.hideInfo = function() {
      document.getElementById('info').classList.remove('active');
    };

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.8;

    function animate() {
      requestAnimationFrame(animate);
      const t = Date.now() * 0.001;
      core.scale.setScalar(1 + Math.sin(t * 3) * 0.05);
      light.intensity = 2 + Math.sin(t * 2) * 0.5;
      lines.forEach((line, i) => {
        const pos = line.geometry.attributes.position;
        for (let j = 0; j < pos.count; j++) {
          const index = j * 3;
          const amp = Math.sin(t * 1.5 + i * 0.3 + j * 0.4) * 0.5;
          pos.array[index + 1] += amp * 0.02;
        }
        pos.needsUpdate = true;
      });
      cubes.forEach(cube => {
        cube.rotation.x += 0.003;
        cube.rotation.y += 0.003;
      });
      controls.update();
      composer.render();
    }
    animate();

    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      composer.setSize(window.innerWidth, window.innerHeight);
    });