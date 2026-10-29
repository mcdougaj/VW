// Post chain adapted from joeyi.org (js/post.js): bloom, then grain, chromatic fringe, vignette and grade.
import * as THREE from '../vendor/three/build/three.module.min.js';
import { EffectComposer } from '../vendor/three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from '../vendor/three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from '../vendor/three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from '../vendor/three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from '../vendor/three/addons/postprocessing/OutputPass.js';

// Runs after tone mapping, in display space: chromatic fringe, vignette, grade, film grain.
const FinalShader = {
  uniforms: { tDiffuse: { value: null }, uTime: { value: 0 }, uCA: { value: 0.004 }, uGrain: { value: 0.05 }, uVig: { value: 0.85 }, uRes: { value: new THREE.Vector2(1, 1) } },
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform float uTime, uCA, uGrain, uVig; uniform vec2 uRes; varying vec2 vUv;
    float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
    void main(){
      vec2 c = vUv - 0.5; float d = length(c);
      vec2 off = c * d * uCA;
      vec3 col = vec3(texture2D(tDiffuse, vUv + off).r, texture2D(tDiffuse, vUv).g, texture2D(tDiffuse, vUv - off).b);
      col *= mix(1.0, 1.0 - smoothstep(0.28, 0.92, d), uVig);
      float l = dot(col, vec3(0.299, 0.587, 0.114));
      col = mix(col, col * vec3(0.9, 1.0, 1.1), (1.0 - l) * 0.45);
      col += (hash(vUv * uRes + fract(uTime) * 91.0) - 0.5) * uGrain;
      gl_FragColor = vec4(col, 1.0);
    }`,
};

export function createPost(renderer, scene, camera, isLow) {
  const size = renderer.getDrawingBufferSize(new THREE.Vector2());
  const target = new THREE.WebGLRenderTarget(size.x, size.y, { type: THREE.HalfFloatType, samples: isLow ? 0 : 4 });
  const composer = new EffectComposer(renderer, target);
  composer.setPixelRatio(1); // sizes below are already in drawing-buffer pixels
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(size.x / 2, size.y / 2), 0.5, 0.5, 0.92);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());
  const final = new ShaderPass(FinalShader);
  composer.addPass(final);

  return {
    bloom,
    setSize() {
      renderer.getDrawingBufferSize(size);
      composer.setSize(size.x, size.y);
      final.uniforms.uRes.value.copy(size);
    },
    render(dt, time, speed) {
      final.uniforms.uTime.value = time;
      final.uniforms.uCA.value = 0.0035 + Math.min(0.02, speed * 0.06);
      composer.render(dt);
    },
  };
}
