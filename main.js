import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import {print, printp} from "/other.js";

print("Hello world!");
printp("Hello page!");

// ---------------- Scene setup ----------------
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  10000
);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setClearColor("lightblue");
document.body.appendChild(renderer.domElement);

// ---------------- Blocks config ----------------
const blocksize = 1;

const blockGeo = new THREE.BoxGeometry(blocksize, blocksize, blocksize);

const textureLoader = new THREE.TextureLoader();
const sidegrasstexture   = textureLoader.load('imgs/grasssides.jpg');
const bottomgrasstexture = textureLoader.load('imgs/grassbottom.jpg');
const topgrasstexture    = textureLoader.load('imgs/grasstop.jpg');

sidegrasstexture.colorSpace   = THREE.SRGBColorSpace;
bottomgrasstexture.colorSpace = THREE.SRGBColorSpace;
topgrasstexture.colorSpace    = THREE.SRGBColorSpace;

const grasssideMaterial   = new THREE.MeshPhongMaterial({ map: sidegrasstexture });
const grassbottomMaterial = new THREE.MeshPhongMaterial({ map: bottomgrasstexture });
const grasstopMaterial    = new THREE.MeshPhongMaterial({ map: topgrasstexture });

// Order: Right, Left, Top, Bottom, Back and Front.
const grassmaterialsets = [
  grasssideMaterial,
  grasssideMaterial,
  grasstopMaterial,
  grassbottomMaterial,
  grasssideMaterial,
  grasssideMaterial,
];
// Load chunk and first scene
const chunkGroup = new THREE.Group();
scene.add(chunkGroup);

// ---------------- Sliders----------------
const sliderX = document.getElementById("terrain_sliderX");
const sliderY = document.getElementById("terrain_sliderY");
const sliderZ = document.getElementById("terrain_sliderZ");

const sliderspaceX = document.getElementById("spacing_sliderX");
const sliderspaceY = document.getElementById("spacing_sliderY");
const sliderspaceZ = document.getElementById("spacing_sliderZ");

const sliderdivisionX = document.getElementById("division_sliderX");
const sliderdivisionY = document.getElementById("division_sliderY");
const sliderdivisionZ = document.getElementById("division_sliderZ");

let worldX = Number(sliderX.value);
let worldY = Number(sliderY.value);
let worldZ = Number(sliderZ.value);

let spacingX = Number(sliderspaceX.value);
let spacingY = Number(sliderspaceY.value);
let spacingZ = Number(sliderspaceZ.value);

let divisionX = Number(sliderdivisionX.value);
let divisionY = Number(sliderdivisionY.value);
let divisionZ = Number(sliderdivisionZ.value);

// Chunk group cleaner
function clearChunks() {
  for (let i = chunkGroup.children.length - 1; i >= 0; i--) {
    const child = chunkGroup.children[i];
    chunkGroup.remove(child);
  }
}

// ---------------- terrain generation algorithm ----------------
function terraingen(Tx, Ty, Tz, sx, sy, sz, dix, diy, diz) {
  const chunkSizeX = Tx * blocksize * sx;
  const chunkSizeY = Ty * blocksize * sy;
  const chunkSizeZ = Tz * blocksize * sz;

  for (let cx = 0; cx < dix; cx++) {
    for (let cy = 0; cy < diy; cy++) {
      for (let cz = 0; cz < diz; cz++) {

        const terrainGroup = new THREE.Group();
        terrainGroup.position.set(
          cx * chunkSizeX,
          cy * chunkSizeY,
          cz * chunkSizeZ
        );

        for (let bx = 0; bx < Tx; bx++) {
          for (let bz = 0; bz < Tz; bz++) {

            const worldBX = cx * Tx + bx;
            const worldBZ = cz * Tz + bz;

            const freqX = 0.25;
            const freqZ = 0.05;

            const waveX = Math.sin(worldBX * freqX);
            const waveZ = Math.cos(worldBZ * freqZ); // cos dá offset de fase

            const combined = (waveX + waveZ) * 0.5;

            const h = Math.floor(
              Ty * 0.5 + combined * (Ty * 0.4)
            );

            const topY = Math.max(1, Math.min(Ty, h));

            for (let by = 0; by < topY; by++) {
              const block = new THREE.Mesh(blockGeo, grassmaterialsets);
              block.position.set(
                bx * blocksize * sx,
                by * blocksize * sy,
                bz * blocksize * sz
              );
              terrainGroup.add(block);
            }
          }
        }

        chunkGroup.add(terrainGroup);
      }
    }
  }
}

// ---------------- Camera controls ----------------
const controls = new OrbitControls(camera, renderer.domElement);

// ---------------- Reload and applying terrain function----------------
function loadterrain() {
  clearChunks();

  terraingen(
    worldX, worldY, worldZ,
    spacingX, spacingY, spacingZ,
    divisionX, divisionY, divisionZ
  );

  const box = new THREE.Box3().setFromObject(chunkGroup);
  if (box.isEmpty()) return;

  const center = box.getCenter(new THREE.Vector3());
  const size   = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);

  controls.target.copy(center);
  camera.position.set(
    center.x + maxDim * 0.8,
    box.max.y + maxDim * 0.6,
    center.z + maxDim * 0.8
  );
  camera.far = maxDim * 10;
  camera.updateProjectionMatrix();
  controls.update();
}

// ---------------- Sliders listeners ----------------
sliderX.addEventListener("input", () => { worldX = Number(sliderX.value); loadterrain(); });
sliderY.addEventListener("input", () => { worldY = Number(sliderY.value); loadterrain(); });
sliderZ.addEventListener("input", () => { worldZ = Number(sliderZ.value); loadterrain(); });

sliderspaceX.addEventListener("input", () => { spacingX = Number(sliderspaceX.value); loadterrain(); });
sliderspaceY.addEventListener("input", () => { spacingY = Number(sliderspaceY.value); loadterrain(); });
sliderspaceZ.addEventListener("input", () => { spacingZ = Number(sliderspaceZ.value); loadterrain(); });

sliderdivisionX.addEventListener("input", () => { divisionX = Number(sliderdivisionX.value); loadterrain(); });
sliderdivisionY.addEventListener("input", () => { divisionY = Number(sliderdivisionY.value); loadterrain(); });
sliderdivisionZ.addEventListener("input", () => { divisionZ = Number(sliderdivisionZ.value); loadterrain(); });

// ---------------- Lights ----------------
const dir = new THREE.DirectionalLight(0xffffff, 1.0);
dir.position.set(100, 200, 100);
scene.add(dir);

const ambient = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambient);

// ---------------- Initial terrain ----------------
loadterrain();

// ---------------- Render loop ----------------
const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  clock.getDelta();
  renderer.render(scene, camera);
}
animate();

// ---------------- Resize ----------------
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});