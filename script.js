import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// 1. Setup GSAP
gsap.registerPlugin(ScrollTrigger);

// 2. Scene Setup
const canvas = document.getElementById("webgl");
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.z = 7;

const renderer = new THREE.WebGLRenderer({ 
  canvas: canvas, 
  antialias: true, 
  alpha: true 
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// 3. Lighting
scene.add(new THREE.AmbientLight(0xffffff, 1.5));
const sunLight = new THREE.DirectionalLight(0xffffff, 3);
sunLight.position.set(5, 5, 5);
scene.add(sunLight);

// 4. Variables
let model;
const extraRoses = [];
let finished = false;

// Für Schwebe-Animation
let floatTime = 0;

// 5. Load Model
const loader = new GLTFLoader();
loader.load("rose.glb", (gltf) => {
  model = gltf.scene;
  
  model.traverse((child) => {
    if (child.isMesh) {
      child.material.side = THREE.DoubleSide;
      child.material.transparent = true;
      child.material.depthWrite = true;
      child.matrixAutoUpdate = true;

      if (child.morphTargetInfluences) {
        child.morphTargetInfluences[0] = 0;
      }
    }
  });

  const model_scale = 20;
  model.scale.set(model_scale, model_scale, model_scale); 
  model.position.y = -2;
  model.rotation.set(0.3, -2.3, 0);
  
  scene.add(model);

  // --- 5 SCHWARZE ROSEN ERSTELLEN ---
  const blackMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });

  for (let i = 0; i < 5; i++) {
    const blackRose = model.clone();

    blackRose.traverse((child) => {
      if (child.isMesh) {
        child.material = blackMaterial;

        if (child.morphTargetInfluences) {
          child.morphTargetInfluences[0] = 1;
        }
      }
    });
    
    blackRose.position.set((Math.random() - 0.5) * 20, -20, -10); 
    blackRose.scale.set(model_scale, model_scale, model_scale);
    blackRose.visible = false;
    
    scene.add(blackRose);
    extraRoses.push(blackRose);
  }

  // 6. SCROLL-STEUERUNG MIT TIMELINE
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: ".scroll-container",
      start: "top top",
      end: "bottom bottom", 
      scrub: 0.8,
      pin: false,

      onLeave: () => finished = true,
      onLeaveBack: () => finished = false
    }
  });

  // PHASE 1: Hauptrose blüht auf
  tl.to({}, {
    duration: 1,
    onUpdate: function() {
      const progress = this.progress();

      model.traverse((child) => {
        if (child.isMesh && child.morphTargetInfluences) {
          child.morphTargetInfluences[0] = progress;
        }
      });
    }
  });

  // PHASE 2: RAUSZOOMEN
  tl.to(camera.position, {
    z: 20, 
    duration: 1.5,
    ease: "power1.inOut"
  }, ">");

  // Hauptrose bewegen
  tl.to(model.position, {
    x: -2, 
    y: 2,
    z: -2,
    duration: 1,
    ease: "power2.out"
  }, "<");

  tl.to(model.rotation, {
    y: model.rotation.y + Math.PI * 2,
    duration: 2,
    ease: "none"
  }, "<");

  // Schwarze Rosen animieren
  extraRoses.forEach((rose, index) => {
    const i = index + 1; 
    const col = i % 2; 
    const row = Math.floor(i / 2);

    tl.to(rose.position, {
      x: col === 0 ? -2 : 2,
      y: 2 - (row * 5),
      z: -2,
      duration: 1.2,
      ease: "power2.out",
      onStart: () => { rose.visible = true; }
    }, "<0.1");

    tl.to(rose.rotation, {
      y: Math.PI * 4,
      duration: 1.5,
      ease: "power1.out"
    }, "<");
  });

}, undefined, (error) => console.error("Loader Error:", error));

// 7. Animation Loop
function animate() {
  requestAnimationFrame(animate);

  // Wenn Scroll-Animation vorbei ist → Rotation + Schweben
  if (finished) {
    floatTime += 0.03;

    // Hauptrose
    if (model) {
      model.rotation.y += 0.01;

      // sanftes Schweben
      model.position.y += Math.sin(floatTime) * 0.008;
    }

    // Schwarze Rosen
    extraRoses.forEach((rose, index) => {
      rose.rotation.y += 0.01;

      // Jede Rose bekommt leicht versetzte Schwebe-Phase
      const offset = index * 0.5;
      rose.position.y += Math.sin(floatTime + offset) * 0.008;
    });
  }

  renderer.render(scene, camera);
}
animate();

// 8. Handle Window Resize
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});