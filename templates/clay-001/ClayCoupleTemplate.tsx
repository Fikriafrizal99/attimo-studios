"use client";

import {
  useEffect,
  useRef,
  useState,
  type ComponentType,
  type PointerEvent as ReactPointerEvent,
} from "react";
import CoupleSection from "@/components/CoupleSection";
import DateSection from "@/components/DateSection";
import GallerySection from "@/components/GallerySection";
import GiftSection from "@/components/GiftSection";
import { InvitationProvider, useInvitation } from "@/components/InvitationContext";
import LocationSection from "@/components/LocationSection";
import MusicPlayer from "@/components/MusicPlayer";
import RSVPSection from "@/components/RSVPSection";
import StorySection from "@/components/StorySection";
import WishesSection from "@/components/WishesSection";
import type { WeddingSectionId } from "@/lib/wedding-contract";
import type { TemplateRenderProps } from "@/templates/types";
import styles from "./ClayCoupleTemplate.module.css";

const SECTION_COMPONENTS: Partial<Record<WeddingSectionId, ComponentType>> = {
  couple: CoupleSection,
  date: DateSection,
  location: LocationSection,
  story: StorySection,
  gallery: GallerySection,
  rsvp: RSVPSection,
  wishes: WishesSection,
  gift: GiftSection,
  music: MusicPlayer,
};

const SCENE_POINTS = new Float32Array([
  // x, y, z, size, r, g, b — groom
  -0.46, 0.35, 0.04, 92, 0.90, 0.67, 0.53,
  -0.46, 0.00, 0.00, 112, 0.17, 0.29, 0.34,
  -0.46,-0.24, 0.02, 105, 0.15, 0.25, 0.29,
  -0.61, 0.02, 0.01, 46, 0.17, 0.29, 0.34,
  -0.31, 0.02, 0.01, 46, 0.17, 0.29, 0.34,
  -0.57,-0.47, 0.02, 52, 0.13, 0.22, 0.25,
  -0.35,-0.47, 0.02, 52, 0.13, 0.22, 0.25,
  -0.46, 0.51, 0.02, 68, 0.20, 0.13, 0.11,
  // bride
   0.46, 0.35, 0.10, 92, 0.92, 0.69, 0.55,
   0.46, 0.00, 0.08, 118, 0.92, 0.86, 0.77,
   0.46,-0.24, 0.08, 112, 0.88, 0.81, 0.72,
   0.31, 0.02, 0.08, 46, 0.91, 0.84, 0.75,
   0.61, 0.02, 0.08, 46, 0.91, 0.84, 0.75,
   0.35,-0.47, 0.08, 52, 0.82, 0.74, 0.66,
   0.57,-0.47, 0.08, 52, 0.82, 0.74, 0.66,
   0.46, 0.51, 0.08, 70, 0.24, 0.15, 0.13,
  // bouquet
   0.66, 0.02, 0.20, 34, 0.88, 0.42, 0.48,
   0.71, 0.08, 0.18, 31, 0.94, 0.60, 0.58,
   0.62, 0.10, 0.19, 30, 0.86, 0.50, 0.62,
   0.69,-0.02, 0.16, 27, 0.95, 0.71, 0.62,
  // floor petals / depth markers
  -0.80,-0.62,-0.10, 24, 0.92, 0.55, 0.56,
  -0.67,-0.68, 0.18, 18, 0.95, 0.70, 0.63,
   0.04,-0.67,-0.18, 21, 0.90, 0.48, 0.55,
   0.77,-0.64, 0.13, 23, 0.95, 0.66, 0.62,
   0.89,-0.57,-0.14, 17, 0.88, 0.52, 0.60,
]);

function compileShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function ClayWebGLScene({ pointerX }: { pointerX: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl", { alpha: true, antialias: true });
    if (!gl) return;

    const vertex = compileShader(gl, gl.VERTEX_SHADER, `
      attribute vec3 aPosition;
      attribute float aSize;
      attribute vec3 aColor;
      uniform float uAngle;
      uniform float uAspect;
      uniform float uDpr;
      varying vec3 vColor;
      void main() {
        float c = cos(uAngle);
        float s = sin(uAngle);
        float xr = aPosition.x * c - aPosition.z * s;
        float zr = aPosition.x * s + aPosition.z * c;
        float perspective = 1.35 / (2.15 - zr);
        gl_Position = vec4((xr * perspective) / uAspect, aPosition.y * perspective, zr * 0.1, 1.0);
        gl_PointSize = aSize * perspective * uDpr;
        vColor = aColor;
      }
    `);
    const fragment = compileShader(gl, gl.FRAGMENT_SHADER, `
      precision mediump float;
      varying vec3 vColor;
      void main() {
        vec2 p = gl_PointCoord * 2.0 - 1.0;
        float d = dot(p, p);
        if (d > 1.0) discard;
        float sphere = sqrt(max(0.0, 1.0 - d));
        float highlight = 0.72 + sphere * 0.30 + max(0.0, (-p.x - p.y)) * 0.05;
        gl_FragColor = vec4(vColor * highlight, 1.0);
      }
    `);
    if (!vertex || !fragment) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    if (!buffer) return;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, SCENE_POINTS, gl.STATIC_DRAW);

    const stride = 7 * Float32Array.BYTES_PER_ELEMENT;
    const bind = (name: string, size: number, offset: number) => {
      const location = gl.getAttribLocation(program, name);
      if (location < 0) return;
      gl.enableVertexAttribArray(location);
      gl.vertexAttribPointer(location, size, gl.FLOAT, false, stride, offset * Float32Array.BYTES_PER_ELEMENT);
    };
    bind("aPosition", 3, 0);
    bind("aSize", 1, 3);
    bind("aColor", 3, 4);

    const angleLocation = gl.getUniformLocation(program, "uAngle");
    const aspectLocation = gl.getUniformLocation(program, "uAspect");
    const dprLocation = gl.getUniformLocation(program, "uDpr");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;
    let start = performance.now();

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform1f(aspectLocation, Math.max(rect.width / Math.max(rect.height, 1), .75));
      gl.uniform1f(dprLocation, dpr);
    };

    const render = (time: number) => {
      const idleOrbit = reducedMotion ? 0 : Math.sin((time - start) / 3000) * 0.08;
      gl.uniform1f(angleLocation, idleOrbit + pointerX * 0.12);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.enable(gl.DEPTH_TEST);
      gl.drawArrays(gl.POINTS, 0, SCENE_POINTS.length / 7);
      if (!reducedMotion) frame = window.requestAnimationFrame(render);
    };

    resize();
    window.addEventListener("resize", resize);
    setReady(true);
    render(performance.now());

    return () => {
      window.removeEventListener("resize", resize);
      if (frame) window.cancelAnimationFrame(frame);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vertex);
      gl.deleteShader(fragment);
    };
  }, [pointerX]);

  return (
    <>
      <canvas
        ref={canvasRef}
        className={styles.webglCanvas}
        aria-hidden="true"
        data-webgl-ready={ready ? "true" : "false"}
      />
      <div className={`${styles.clayFallback} ${ready ? styles.fallbackHidden : ""}`} aria-hidden="true">
        <div className={`${styles.fallbackPerson} ${styles.fallbackGroom}`}><span /><i /></div>
        <div className={`${styles.fallbackPerson} ${styles.fallbackBride}`}><span /><i /></div>
      </div>
    </>
  );
}

function ClayHero({ pointerX }: { pointerX: number }) {
  const invitation = useInvitation();
  const bride = invitation?.content?.couple?.bride;
  const groom = invitation?.content?.couple?.groom;
  const hero = invitation?.content?.hero;
  const guest = invitation?.guest;
  const brideName = bride?.shortName || bride?.name || "Bride";
  const groomName = groom?.shortName || groom?.name || "Groom";

  return (
    <section id="hero" className={styles.hero}>
      <div className={styles.glow} aria-hidden="true" />
      <div className={styles.sceneShell}>
        <ClayWebGLScene pointerX={pointerX} />
        <div className={styles.platform} aria-hidden="true" />
      </div>
      <div className={styles.heroCopy}>
        {guest?.displayName && <div className={styles.guest}>For <strong>{guest.displayName}</strong></div>}
        <p className={styles.kicker}>A little clay world for our big day</p>
        <h1 className={styles.names}><span>{brideName}</span><em>&amp;</em><span>{groomName}</span></h1>
        <p className={styles.subtitle}>{hero?.subtitle || "Dua karakter, dua perjalanan, dan satu dunia kecil yang kami bangun menuju hari pernikahan."}</p>
        <button type="button" className={styles.openButton} onClick={() => document.getElementById("couple")?.scrollIntoView({ behavior: "smooth" })}>
          Open Wedding
        </button>
      </div>
    </section>
  );
}

export function ClayCoupleTemplate({ weddingId, publicSlug, content, sections, theme, guest }: TemplateRenderProps) {
  const [pointerX, setPointerX] = useState(0);
  const sorted = [...sections].filter((section) => section.enabled).sort((a, b) => a.order - b.order);

  const handlePointer = (event: ReactPointerEvent<HTMLElement>) => {
    if (event.pointerType === "touch") return;
    const rect = event.currentTarget.getBoundingClientRect();
    setPointerX(((event.clientX - rect.left) / Math.max(rect.width, 1) - 0.5) * 2);
  };

  return (
    <InvitationProvider value={{ weddingId, publicSlug, content, sections, theme, guest }}>
      <main
        className={styles.root}
        onPointerMove={handlePointer}
        onPointerLeave={() => setPointerX(0)}
        data-endriya-template="clay-001"
        data-endriya-visual-tier="3d"
        data-endriya-experience="clay-couple-webgl"
        data-endriya-progressive-enhancement="dom-core-webgl-scene"
        data-endriya-typography="sacramento+nunito"
      >
        {sorted.map((section) => {
          if (section.id === "hero") return <ClayHero key={section.id} pointerX={pointerX} />;
          const Component = SECTION_COMPONENTS[section.id];
          if (!Component) return null;
          if (section.id === "music") return <Component key={section.id} />;
          return (
            <div className={styles.claySection} key={section.id} data-clay-section={section.id}>
              <div className={styles.sectionFrame}><Component /></div>
            </div>
          );
        })}
      </main>
    </InvitationProvider>
  );
}
