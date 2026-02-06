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

// 5. Load Model
const loader = new GLTFLoader();
loader.load("rose.glb", (gltf) => {
  model = gltf.scene;
  
  model.traverse((child) => {
    if (child.isMesh) {
      // Material-Fixes
      child.material.side = THREE.DoubleSide;
      child.material.transparent = true;
      child.material.depthWrite = true;
      
      // WICHTIG: Erzwinge Updates für die Grafikkarte
      child.matrixAutoUpdate = true;
      if (child.morphTargetInfluences) {
        // Setze Startwert auf 0 (geschlossen)
        child.morphTargetInfluences[0] = 0;
      }
    }
  });

  // Skalierung (Anpassen, falls Rose zu groß/klein nach All Transforms)
  const model_scale = 20;
  model.scale.set(model_scale, model_scale, model_scale); 
  model.position.y = -2;
  scene.add(model);

  // 6. DIREKTE SCROLL-STEUERUNG (Ohne Mixer/Action)
  gsap.to({}, {
    scrollTrigger: {
      trigger: "body",
      start: "top top",
      end: "bottom bottom",
      scrub: 0.5, // Weiches Nachlaufen
      onUpdate: (self) => {
        if (model) {
          // Wir gehen durch das Modell und setzen den Morph-Wert manuell
          model.traverse((child) => {
            if (child.isMesh && child.morphTargetInfluences) {
              // self.progress ist ein Wert von 0.0 bis 1.0
              child.morphTargetInfluences[0] = self.progress;
            }
          });
        }
      }
    }
  });

}, undefined, (error) => console.error("Loader Error:", error));

// 7. Animation Loop
function animate() {
  requestAnimationFrame(animate);
  
  // Kontinuierliche Drehung
  if (model) {
    model.rotation.y += 0.002;
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