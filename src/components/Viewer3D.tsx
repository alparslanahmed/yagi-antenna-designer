import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import type { YagiDesign } from '../lib/yagi';
import type { Highlight, HighlightKind } from '../lib/highlight';
import { NO_HIGHLIGHT, roleToKind } from '../lib/highlight';

interface Props {
  design: YagiDesign;
  highlight: Highlight;
  onHighlight: (h: Highlight) => void;
}

interface PartMeta {
  kind: HighlightKind;
  index: number | null;
  label: string;
  baseColor: THREE.Color;
  baseEmissive: THREE.Color;
}

const ALU = new THREE.Color(0xb9bec7);
const DRIVEN_C = new THREE.Color(0x67e8f9);
const HOT_C = new THREE.Color(0xfbbf24);
const HOT_E = new THREE.Color(0xb45309);

/**
 * True-scale 3D model: boom along X, elements along Z (horizontal
 * polarisation), mast along Y. Hover any part to identify it and to
 * highlight the matching parameter.
 */
export function Viewer3D({ design: d, highlight, onHighlight }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    group: THREE.Group;
    parts: Array<{ mesh: THREE.Mesh; meta: PartMeta }>;
    controls: OrbitControls;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    raycaster: THREE.Raycaster;
  } | null>(null);
  const designRef = useRef(d);
  designRef.current = d;
  const onHighlightRef = useRef(onHighlight);
  onHighlightRef.current = onHighlight;
  const [tip, setTip] = useState<{
    label: string;
    x: number;
    y: number;
    w: number;
    h: number;
  } | null>(null);
  const [spin, setSpin] = useState(
    () =>
      typeof window !== 'undefined' &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );

  // ---- one-time scene setup ----
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.01, 5000);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;

    scene.add(new THREE.HemisphereLight(0xdfe6f2, 0x1a1a20, 0.85));
    const key = new THREE.DirectionalLight(0xffffff, 1.6);
    key.position.set(4, 7, 3);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x88aaff, 0.5);
    rim.position.set(-5, 2, -4);
    scene.add(rim);

    const group = new THREE.Group();
    scene.add(group);
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let hoverCheck = false;
    let px = 0;
    let py = 0;
    let pw = 0;
    let ph = 0;

    sceneRef.current = { group, parts: [], controls, camera, renderer, raycaster };

    const onMove = (e: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      px = e.clientX - rect.left;
      py = e.clientY - rect.top;
      pw = rect.width;
      ph = rect.height;
      hoverCheck = true;
    };
    const onLeave = () => {
      setTip(null);
      onHighlightRef.current(NO_HIGHLIGHT);
    };
    renderer.domElement.addEventListener('pointermove', onMove);
    renderer.domElement.addEventListener('pointerleave', onLeave);

    const resize = () => {
      const w = mount.clientWidth || 1;
      const h = mount.clientHeight || 1;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    const ro = new ResizeObserver(resize);
    ro.observe(mount);
    resize();

    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      if (hoverCheck && sceneRef.current) {
        hoverCheck = false;
        raycaster.setFromCamera(pointer, camera);
        const hits = raycaster.intersectObjects(group.children, true);
        let found: PartMeta | null = null;
        for (const h of hits) {
          let o: THREE.Object3D | null = h.object;
          while (o && !o.userData.part) o = o.parent;
          if (o) {
            found = o.userData.part as PartMeta;
            break;
          }
        }
        if (found) {
          const f: PartMeta = found;
          setTip({ label: f.label, x: px, y: py, w: pw, h: ph });
          onHighlightRef.current({ kind: f.kind, index: f.index });
          renderer.domElement.style.cursor = 'pointer';
        } else {
          setTip(null);
          onHighlightRef.current(NO_HIGHLIGHT);
          renderer.domElement.style.cursor = 'grab';
        }
      }
      controls.update();
      renderer.render(scene, camera);
    };
    loop();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      renderer.domElement.removeEventListener('pointermove', onMove);
      renderer.domElement.removeEventListener('pointerleave', onLeave);
      controls.dispose();
      renderer.dispose();
      mount.removeChild(renderer.domElement);
      sceneRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- rebuild geometry when design changes ----
  useEffect(() => {
    const s = sceneRef.current;
    if (!s) return;
    const { group, controls, camera } = s;

    // dispose previous
    for (let i = group.children.length - 1; i >= 0; i--) {
      const c = group.children[i];
      group.remove(c);
      c.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.isMesh) {
          m.geometry.dispose();
          const mat = m.material as THREE.Material | THREE.Material[];
          (Array.isArray(mat) ? mat : [mat]).forEach((x) => x.dispose());
        }
      });
    }
    s.parts = [];

    const M = (mm: number) => mm / 1000;
    const boomLen = M(d.boomElectricalMm);
    const maxEl = M(d.longestElementMm);
    const elR = Math.max(M(d.inputs.elementDiameterMm) / 2, boomLen * 0.0016 + 0.0008);
    const boomR = Math.max(M(d.inputs.boomDiameterMm) / 2, boomLen * 0.002 + 0.001);
    const cx = boomLen / 2;

    const metal = (c: THREE.Color) =>
      new THREE.MeshStandardMaterial({ color: c.clone(), metalness: 0.9, roughness: 0.34 });
    const darkMat = () =>
      new THREE.MeshStandardMaterial({ color: 0x2b2b31, metalness: 0.4, roughness: 0.7 });

    const addPart = (
      mesh: THREE.Mesh,
      kind: HighlightKind,
      index: number | null,
      label: string,
    ) => {
      mesh.castShadow = true;
      const mat = mesh.material as THREE.MeshStandardMaterial;
      const meta: PartMeta = {
        kind,
        index,
        label,
        baseColor: mat.color.clone(),
        baseEmissive: mat.emissive.clone(),
      };
      mesh.userData.part = meta;
      group.add(mesh);
      s.parts.push({ mesh, meta });
    };

    const cycX = (r: number, len: number) => {
      const geo = new THREE.CylinderGeometry(r, r, len, 20);
      geo.rotateZ(Math.PI / 2);
      return geo;
    };
    const cycZ = (r: number, len: number) => {
      const geo = new THREE.CylinderGeometry(r, r, len, 20);
      geo.rotateX(Math.PI / 2);
      return geo;
    };

    // boom
    addPart(
      new THREE.Mesh(cycX(boomR, M(d.boomLengthMm)), metal(ALU)),
      'boom',
      null,
      `Boom — ${(d.boomLengthMm / 1000).toFixed(2)} m (${d.boomLengthLambda.toFixed(2)}λ)`,
    );
    group.children[group.children.length - 1].position.set(cx, 0, 0);

    // elements
    for (const e of d.elements) {
      const x = M(e.positionMm);
      const len = M(e.lengthMm);
      const kind = roleToKind(e.role);
      const label = `${e.label} — ${e.lengthMm.toFixed(0)} mm (${e.lengthLambda.toFixed(3)}λ)`;
      if (e.role === 'driven' && d.inputs.drivenType === 'folded') {
        const gap = Math.max(elR * 4, maxEl * 0.012);
        const sub = new THREE.Group();
        const m1 = new THREE.Mesh(cycZ(elR * 0.8, len), metal(DRIVEN_C));
        m1.position.set(-gap / 2, 0, 0);
        const m2 = new THREE.Mesh(cycZ(elR * 0.8, len), metal(DRIVEN_C));
        m2.position.set(gap / 2, 0, 0);
        const cap1 = new THREE.Mesh(cycX(elR * 0.8, gap), metal(DRIVEN_C));
        cap1.position.set(0, 0, -len / 2);
        const cap2 = new THREE.Mesh(cycX(elR * 0.8, gap), metal(DRIVEN_C));
        cap2.position.set(0, 0, len / 2);
        for (const m of [m1, m2, cap1, cap2]) {
          m.castShadow = true;
          sub.add(m);
        }
        const meta: PartMeta = {
          kind,
          index: e.index,
          label: `${label} (folded)`,
          baseColor: new THREE.Color(),
          baseEmissive: new THREE.Color(),
        };
        sub.userData.part = meta;
        sub.position.set(x, 0, 0);
        group.add(sub);
        // register each mesh for highlight updates
        for (const m of [m1, m2, cap1, cap2]) {
          const mm = m.material as THREE.MeshStandardMaterial;
          s.parts.push({
            mesh: m,
            meta: { ...meta, baseColor: mm.color.clone(), baseEmissive: mm.emissive.clone() },
          });
        }
      } else {
        const mesh = new THREE.Mesh(
          cycZ(elR, len),
          metal(e.role === 'driven' ? DRIVEN_C : ALU),
        );
        mesh.position.set(x, 0, 0);
        addPart(mesh, kind, e.index, label);
      }
      // insulator blocks for insulated mounts (parasitics)
      if (d.inputs.boomMount === 'insulated' && e.role !== 'driven') {
        const ins = new THREE.Mesh(
          new THREE.BoxGeometry(boomR * 2.6, boomR * 2.6, elR * 5),
          darkMat(),
        );
        ins.position.set(x, 0, 0);
        ins.castShadow = true;
        group.add(ins);
      }
    }

    // feed box under driven element
    if (d.elements[1]) {
      const fx = M(d.elements[1].positionMm);
      const box = new THREE.Mesh(
        new THREE.BoxGeometry(Math.max(boomLen * 0.02, 0.03), Math.max(boomLen * 0.014, 0.02), Math.max(boomLen * 0.03, 0.04)),
        darkMat(),
      );
      box.position.set(fx, -boomR * 2.2, 0);
      box.castShadow = true;
      addPart(box, 'feed', 1, 'Feedpoint — balun / match mounts here');
    }

    // mast
    const mastX = boomLen * 0.45;
    const mastLen = Math.max(maxEl * 0.9, boomLen * 0.25);
    const mast = new THREE.Mesh(
      new THREE.CylinderGeometry(boomR * 1.3, boomR * 1.3, mastLen, 16),
      darkMat(),
    );
    mast.position.set(mastX, -mastLen / 2, 0);
    mast.castShadow = true;
    group.add(mast);

    // ground grid
    const gridSize = Math.max(boomLen, maxEl) * 1.7;
    const grid = new THREE.GridHelper(
      gridSize,
      16,
      new THREE.Color(0x3a3a44),
      new THREE.Color(0x232329),
    );
    grid.position.set(cx, -mastLen - 0.001, 0);
    group.add(grid);

    // frame camera
    const R = Math.max(boomLen, maxEl);
    camera.position.set(cx + R * 0.55, R * 0.75, R * 1.15 + maxEl * 0.4);
    camera.near = Math.max(R / 1000, 0.001);
    camera.far = R * 60 + 100;
    camera.updateProjectionMatrix();
    controls.target.set(cx, 0, 0);
    controls.minDistance = R * 0.2;
    controls.maxDistance = R * 6;
    controls.update();
  }, [d]);

  // ---- spin toggle ----
  useEffect(() => {
    if (sceneRef.current) sceneRef.current.controls.autoRotate = spin;
  }, [spin]);

  // ---- apply highlight ----
  useEffect(() => {
    const s = sceneRef.current;
    if (!s) return;
    for (const { mesh, meta } of s.parts) {
      const mat = mesh.material as THREE.MeshStandardMaterial;
      const hot =
        (highlight.index != null && meta.index === highlight.index) ||
        (highlight.index == null &&
          (highlight.kind === meta.kind ||
            (highlight.kind === 'diameter' &&
              (meta.kind === 'reflector' || meta.kind === 'driven' || meta.kind === 'directors')) ||
            (highlight.kind === 'frequency' &&
              (meta.kind === 'reflector' || meta.kind === 'driven' || meta.kind === 'directors'))));
      if (hot) {
        mat.color.copy(HOT_C);
        mat.emissive.copy(HOT_E);
        mat.emissiveIntensity = 0.85;
      } else {
        mat.color.copy(meta.baseColor);
        mat.emissive.copy(meta.baseEmissive);
        mat.emissiveIntensity = 1;
      }
    }
  }, [highlight]);

  return (
    <div className="relative h-full w-full" ref={mountRef} style={{ minHeight: 420 }}>
      {tip &&
        (() => {
          // Clamp the tooltip inside the viewport: flip to the left / above
          // the cursor when there is no room on the right / below.
          const TW = 264; // max-w-[16rem] + padding + border
          const TH = 64; // generous upper bound for two lines
          const left =
            tip.x + 14 + TW > tip.w ? Math.max(8, tip.x - TW - 6) : tip.x + 14;
          const top =
            tip.y + 12 + TH > tip.h ? Math.max(8, tip.y - TH - 6) : tip.y + 12;
          return (
            <div
              className="pointer-events-none absolute z-10 max-w-[16rem] rounded border border-amber-400/60 bg-zinc-950/95 px-2 py-1 font-mono text-[11px] text-amber-100"
              style={{ left, top }}
            >
              {tip.label}
            </div>
          );
        })()}
      <div className="absolute bottom-2 left-2 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setSpin((v) => !v)}
          className="rounded border border-zinc-700 bg-zinc-950/90 px-2 py-1 font-mono text-[11px] text-zinc-300 hover:border-amber-400/60 hover:text-amber-200"
        >
          {spin ? '⏸ auto-rotate' : '▶ auto-rotate'}
        </button>
        <span className="font-mono text-[10px] text-zinc-600">
          drag to orbit · scroll to zoom · hover parts
        </span>
      </div>
    </div>
  );
}
