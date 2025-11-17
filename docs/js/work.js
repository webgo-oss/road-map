  import * as THREE from 'https://cdn.skypack.dev/three@0.129.0/build/three.module.js';
  import { GLTFLoader } from 'https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/GLTFLoader.js';
  import { MeshoptDecoder } from 'https://cdn.skypack.dev/three@0.129.0/examples/jsm/libs/meshopt_decoder.module.js';
  import { RGBELoader } from 'https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/RGBELoader.js';
  import { EffectComposer } from 'https://cdn.skypack.dev/three@0.129.0/examples/jsm/postprocessing/EffectComposer.js';
  import { RenderPass } from 'https://cdn.skypack.dev/three@0.129.0/examples/jsm/postprocessing/RenderPass.js';
  import { UnrealBloomPass } from 'https://cdn.skypack.dev/three@0.129.0/examples/jsm/postprocessing/UnrealBloomPass.js';
  import { FilmPass } from 'https://cdn.skypack.dev/three@0.129.0/examples/jsm/postprocessing/FilmPass.js';

  let scene, camera, renderer, composer;
  let model, skullGlow, innerLight, glowMat, bloom, filmPass;
  const canvas = document.getElementById('three-canvas');

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, -1.4, 3.3);
  camera.lookAt(0, 0.5, 0);

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setClearColor(0x000000, 1);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.outputEncoding = THREE.sRGBEncoding;

  let envTexture = null;
  new RGBELoader().load('https://threejs.org/examples/textures/equirectangular/royal_esplanade_1k.hdr', (texture) => {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    envTexture = texture;
    scene.environment = envTexture;
    scene.background = new THREE.Color(0x000000);
  });

  scene.add(new THREE.AmbientLight(0xffffff, 0.02));
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.7);
  dirLight.position.set(2, 3, 5);
  scene.add(dirLight);

  const loader = new GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder);

  loader.load('./models/robot_girl_with_hair_wires-v1.glb', (gltf) => {
    model = gltf.scene;
    model.scale.set(1.2, 1.2, 1.2);
    model.position.set(-0.8, -2, 0);
    model.rotation.y = Math.PI * 0.2;
    scene.add(model);

    const glowGeo = new THREE.SphereGeometry(0.12, 32, 32);
    glowMat = new THREE.MeshBasicMaterial({ color: 0xff99ff, transparent: true, opacity: 0.4 });
    skullGlow = new THREE.Mesh(glowGeo, glowMat);
    skullGlow.position.set(0, 1.05, 0.25);
    model.add(skullGlow);

    innerLight = new THREE.PointLight(0xff99ff, 0.5, 1.5);
    innerLight.position.copy(skullGlow.position);
    model.add(innerLight);

    gsap.registerPlugin(ScrollTrigger);
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: ".hero-section",
        start: "top top",
        end: "300% top",
        scrub: 2,
        pin: true,
      }
    });

    const addDescBox = document.querySelector(".add-desc-box");

    tl.to(model.rotation, { y: 0, x: 0.2, ease: "power2.inOut", duration: 2 }, 0)
      .to(model.position, { x: -0.4, y: -3.4, z: 1.8, ease: "power2.inOut", duration: 2 }, 0)
      .to(innerLight, { intensity: 2.5, ease: "power2.inOut", duration: 2 }, 0)
      .to(glowMat, { opacity: 1, ease: "power2.inOut", duration: 2 }, 0)
      .to(".text-left", { x: -500, opacity: 0, ease: "power2.inOut", duration: 2 }, 0)
      .to(".text-right", { x: 500, opacity: 0, ease: "power2.inOut", duration: 2 }, 0)
      .to(".end-box.left", { opacity: 1, duration: 2, ease: "power2.out" }, "<0.5")
      .to(".end-box.right", { opacity: 1, duration: 2, ease: "power2.out" }, "<")
            .to(addDescBox, { opacity: 0, duration: 1.5, ease: "power2.out" }, "<"); // fade out add/desc


    tl.to(model.rotation, { y: 0, x: 0.25, ease: "power1.inOut", duration: 2 }, ">")
      .to(model.position, { x: -0.4, y: -3.8, z: 2.5, ease: "power1.inOut", duration: 2 }, "<")
      .to({}, {
        duration: 2,
        onUpdate: function () {
          const p = this.progress();
          const curve = Math.pow(p, 1.5);
          innerLight.intensity = 2 + curve * 6;
          glowMat.opacity = 0.8 + curve * 1.5;
        },
        ease: "none"
      }, "<")
      .to(".end-box.left, .end-box.right", { opacity: 0, duration: 2, ease: "power1.out" }, "<0.3")
      .to(".delivery-section", { opacity: 1, y: 0, duration: 1.5, ease: "power2.out", delay: 0.5 }, ">")

    tl.to({}, {
      duration: 1,
      onUpdate: function () {
        const p = this.progress();
        bloom.strength = 0.45 * (1 - p * 0.9);
        bloom.radius = 0.7 * (1 - p);
        innerLight.intensity = 3 * (1 - p);
        glowMat.opacity = 1.5 * (1 - p);
      },
      ease: "power2.out"
    }, ">1");
  });

  composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  bloom = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.45, 0.7, 0.02);
  composer.addPass(bloom);
  filmPass = new FilmPass(0.15, 0.3, 512, false);
  composer.addPass(filmPass);

 window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;

  if (window.innerWidth < 768) {
    camera.fov = 55;  // zoom out on mobile
    camera.position.set(0, -1.2, 4.2);
  } else {
    camera.fov = 40;
    camera.position.set(0, -1.4, 3.3);
  }

  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
});

  function animate() {
    requestAnimationFrame(animate);
    if (skullGlow)
      skullGlow.material.opacity = 0.5 + Math.sin(Date.now() * 0.004) * 0.25;
    composer.render();
  }
  animate();
