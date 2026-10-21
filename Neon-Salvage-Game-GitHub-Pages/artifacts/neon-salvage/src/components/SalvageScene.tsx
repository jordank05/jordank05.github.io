import { useEffect, useRef } from 'react';
import RAPIER from '@dimforge/rapier3d-compat';
import * as THREE from 'three';
import { GAME_MODES, MAX_DRONE_COUNT, type GameModeId } from '../gameModes';

type SalvageSceneProps = {
  active: boolean;
  resetKey: number;
  mode: GameModeId;
  onCoreCollected: () => void;
  onHazardHit: () => void;
};

export default function SalvageScene({ active, resetKey, mode, onCoreCollected, onHazardHit }: SalvageSceneProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef(active);
  activeRef.current = active;
  const resetKeyRef = useRef(resetKey);
  resetKeyRef.current = resetKey;
  const modeRef = useRef(mode);
  modeRef.current = mode;
  const callbacksRef = useRef({ onCoreCollected, onHazardHit });
  callbacksRef.current = { onCoreCollected, onHazardHit };

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#080e19');
    scene.fog = new THREE.FogExp2('#080e19', 0.027);
    const camera = new THREE.PerspectiveCamera(43, 1, 0.1, 150);
    camera.position.set(12, 12.8, 19);
    camera.lookAt(0, 0, 0);

    let renderer: THREE.WebGLRenderer | null = null;
    let fallbackCanvas: HTMLCanvasElement | null = null;
    let fallbackContext: CanvasRenderingContext2D | null = null;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.7));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.22;
      mount.appendChild(renderer.domElement);
    } catch (error) {
      console.warn('WebGL is unavailable; using the simplified 2D scene fallback.', error);
      fallbackCanvas = document.createElement('canvas');
      fallbackCanvas.className = 'salvage-fallback-canvas';
      mount.appendChild(fallbackCanvas);
      fallbackContext = fallbackCanvas.getContext('2d');
    }

    scene.add(new THREE.HemisphereLight('#a1bfd0', '#101522', 2.3));
    const keyLight = new THREE.DirectionalLight('#b9f8e6', 3.8);
    keyLight.position.set(-8, 14, 9);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(1024, 1024);
    scene.add(keyLight);
    const amberLight = new THREE.PointLight('#ff9d56', 58, 22, 2);
    amberLight.position.set(6, 4, -5);
    scene.add(amberLight);

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(60, 60),
      new THREE.MeshStandardMaterial({ color: '#121c28', roughness: 0.82, metalness: 0.4 }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.12;
    floor.receiveShadow = true;
    scene.add(floor);

    const grid = new THREE.GridHelper(46, 46, '#2d5a65', '#203544');
    grid.position.y = -0.08;
    const gridMaterials = Array.isArray(grid.material) ? grid.material : [grid.material];
    gridMaterials.forEach((material) => {
      material.transparent = true;
      material.opacity = 0.38;
    });
    scene.add(grid);

    const arenaRing = new THREE.Mesh(
      new THREE.CylinderGeometry(11.35, 11.35, 0.12, 64, 1, true),
      new THREE.MeshStandardMaterial({ color: '#263d4b', emissive: '#16343a', emissiveIntensity: 0.6, metalness: 0.8, roughness: 0.32, side: THREE.DoubleSide }),
    );
    arenaRing.position.y = 0.08;
    scene.add(arenaRing);

    const edgeRing = new THREE.Mesh(
      new THREE.TorusGeometry(11.34, 0.075, 8, 96),
      new THREE.MeshBasicMaterial({ color: '#37e0bf', transparent: true, opacity: 0.58 }),
    );
    edgeRing.rotation.x = Math.PI / 2;
    edgeRing.position.y = 0.16;
    scene.add(edgeRing);

    const starGeometry = new THREE.BufferGeometry();
    const starPoints = new Float32Array(1000 * 3);
    for (let i = 0; i < 1000; i += 1) {
      starPoints[i * 3] = (Math.random() - 0.5) * 100;
      starPoints[i * 3 + 1] = 3 + Math.random() * 44;
      starPoints[i * 3 + 2] = (Math.random() - 0.5) * 100;
    }
    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPoints, 3));
    const stars = new THREE.Points(starGeometry, new THREE.PointsMaterial({ color: '#a9d9dc', size: 0.095, transparent: true, opacity: 0.82 }));
    scene.add(stars);

    const structureMaterial = new THREE.MeshStandardMaterial({ color: '#263440', metalness: 0.72, roughness: 0.36 });
    const trimMaterial = new THREE.MeshStandardMaterial({ color: '#657984', metalness: 0.68, roughness: 0.3 });
    const hazardMaterial = new THREE.MeshStandardMaterial({ color: '#9d4036', emissive: '#8e241d', emissiveIntensity: 1.1, metalness: 0.45, roughness: 0.38 });

    const addBox = (x: number, y: number, z: number, sx: number, sy: number, sz: number, material = structureMaterial) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), material);
      mesh.position.set(x, y, z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);
      return mesh;
    };

    // Chunked bulkheads and exposed ribs make the arena read as a ruined orbital deck.
    for (let i = 0; i < 16; i += 1) {
      const angle = (i / 16) * Math.PI * 2;
      const radius = 11.1;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const rib = addBox(x, 1.05, z, 0.62, 2.2, 1.15, i % 4 === 0 ? trimMaterial : structureMaterial);
      rib.rotation.y = -angle;
      const cap = addBox(x, 2.12, z, 0.8, 0.15, 1.32, i % 4 === 0 ? hazardMaterial : trimMaterial);
      cap.rotation.y = -angle;
    }

    // Broken industrial consoles, cargo stacks and floor plates.
    const crateDefinitions = [
      [-7.2, 0.62, -2.9, 2.4, 1.2, 1.5], [7.4, 0.48, 2.9, 2.6, 0.95, 1.9],
      [-4.6, 0.42, 7.2, 2.2, 0.82, 1.1], [5.3, 0.62, -7.1, 2.4, 1.25, 1.35],
      [-8.5, 0.28, 5.4, 1.1, 0.55, 3], [8.5, 0.35, -3.8, 1.15, 0.68, 2.6],
      [0.2, 0.18, -8.8, 4.4, 0.3, 1.2], [-1.3, 0.32, 4.4, 1.5, 0.64, 1.5],
    ];
    crateDefinitions.forEach(([x, y, z, sx, sy, sz], index) => {
      const crate = addBox(x, y, z, sx, sy, sz, index % 3 === 0 ? trimMaterial : structureMaterial);
      crate.rotation.y = index % 2 ? 0.18 : -0.15;
    });

    const cores: THREE.Group[] = [];
    const corePositions = [
      [-6.1, -6.4], [-1.1, -7], [5.3, -5.3], [7.2, 0.2],
      [4.8, 6.1], [-1.4, 7], [-7.2, 3.1], [1.2, -1.6],
    ];
    corePositions.forEach(([x, z], index) => {
      const core = new THREE.Group();
      core.position.set(x, 0.8, z);
      const crystal = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.48, 0),
        new THREE.MeshStandardMaterial({ color: '#b7fff1', emissive: '#28f1c9', emissiveIntensity: 2.8, metalness: 0.38, roughness: 0.15 }),
      );
      crystal.scale.set(0.78, 1.3, 0.78);
      crystal.castShadow = true;
      core.add(crystal);
      const halo = new THREE.Mesh(
        new THREE.TorusGeometry(0.72, 0.025, 8, 40),
        new THREE.MeshBasicMaterial({ color: index % 3 === 0 ? '#f6b763' : '#3ff5d0', transparent: true, opacity: 0.7 }),
      );
      halo.rotation.x = Math.PI / 2;
      core.add(halo);
      const light = new THREE.PointLight('#39eac8', 2.2, 4.2, 2);
      core.add(light);
      scene.add(core);
      cores.push(core);
    });

    const makeDrone = (security = false) => {
      const drone = new THREE.Group();
      const hullMaterial = new THREE.MeshStandardMaterial({
        color: security ? '#a7443e' : '#49c8b2',
        emissive: security ? '#4d1314' : '#0b665f',
        emissiveIntensity: security ? 0.8 : 0.45,
        metalness: 0.7,
        roughness: 0.25,
      });
      const body = new THREE.Mesh(new THREE.OctahedronGeometry(security ? 0.68 : 0.76, 1), hullMaterial);
      body.scale.set(1.35, 0.64, 1);
      body.castShadow = true;
      drone.add(body);
      const cockpit = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 12), new THREE.MeshStandardMaterial({ color: '#e5fff7', emissive: security ? '#ff574d' : '#39f5d0', emissiveIntensity: 2.5, roughness: 0.18 }));
      cockpit.position.y = 0.12;
      drone.add(cockpit);
      for (let i = 0; i < 4; i += 1) {
        const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
        const arm = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.08, 0.15), trimMaterial);
        arm.position.set(Math.cos(angle) * 0.65, -0.04, Math.sin(angle) * 0.65);
        arm.rotation.y = angle;
        drone.add(arm);
        const rotor = new THREE.Mesh(new THREE.TorusGeometry(0.29, 0.035, 6, 20), new THREE.MeshBasicMaterial({ color: security ? '#ff6c54' : '#b6fff0' }));
        rotor.position.set(Math.cos(angle) * 0.9, 0.05, Math.sin(angle) * 0.9);
        rotor.rotation.x = Math.PI / 2;
        drone.add(rotor);
      }
      if (security) {
        const scan = new THREE.Mesh(new THREE.TorusGeometry(1.05, 0.025, 6, 48), new THREE.MeshBasicMaterial({ color: '#ff554a', transparent: true, opacity: 0.52 }));
        scan.rotation.x = Math.PI / 2;
        scan.position.y = -0.55;
        drone.add(scan);
      }
      scene.add(drone);
      return drone;
    };

    const player = makeDrone();
    player.position.set(-1.6, 1, 1.2);
    const patrols = Array.from({ length: MAX_DRONE_COUNT }, () => makeDrone(true));
    patrols.forEach((drone, index) => {
      drone.scale.setScalar(0.72);
      drone.position.y = 0.8;
      drone.userData.phase = index * 2.15;
      drone.visible = index < GAME_MODES[modeRef.current].droneCount;
    });

    const beaconMaterial = new THREE.MeshBasicMaterial({ color: '#ffb85e', transparent: true, opacity: 0.84 });
    const beacons: THREE.Mesh[] = [];
    [[-9, -9], [9, -9], [-9, 9], [9, 9]].forEach(([x, z]) => {
      const beacon = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 2.2, 8), beaconMaterial);
      beacon.position.set(x, 1.1, z);
      scene.add(beacon);
      beacons.push(beacon);
    });

    let disposed = false;
    let physicsWorld: RAPIER.World | null = null;
    let eventQueue: RAPIER.EventQueue | null = null;
    let playerBody: RAPIER.RigidBody | null = null;
    let playerCollider: RAPIER.Collider | null = null;
    const patrolBodies: RAPIER.RigidBody[] = [];
    const patrolColliders: RAPIER.Collider[] = [];
    const collisionTargets = new Map<number, { type: 'player' } | { type: 'core' | 'hazard'; index: number }>();
    const collectedCores = new Set<number>();
    const pressedKeys = new Set<string>();
    const startPosition = { x: -1.6, y: 1, z: 1.2 };
    let lastResetKey = resetKeyRef.current;
    let lastDroneCount = GAME_MODES[modeRef.current].droneCount;
    let hitCooldown = 0;
    let physicsReady = false;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.code)) {
        event.preventDefault();
      }
      pressedKeys.add(event.code);
    };
    const handleKeyUp = (event: KeyboardEvent) => pressedKeys.delete(event.code);
    const clearKeys = () => pressedKeys.clear();
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', clearKeys);

    const initializePhysics = async () => {
      await RAPIER.init();
      if (disposed) return;

      const world = new RAPIER.World({ x: 0, y: 0, z: 0 });
      world.timestep = 1 / 60;
      const events = new RAPIER.EventQueue(true);
      physicsWorld = world;
      eventQueue = events;

      const addFixedBox = (
        position: { x: number; y: number; z: number },
        halfExtents: { x: number; y: number; z: number },
        rotationY = 0,
      ) => {
        const rotation = { x: 0, y: Math.sin(rotationY / 2), z: 0, w: Math.cos(rotationY / 2) };
        const body = world.createRigidBody(
          RAPIER.RigidBodyDesc.fixed()
            .setTranslation(position.x, position.y, position.z)
            .setRotation(rotation),
        );
        world.createCollider(
          RAPIER.ColliderDesc.cuboid(halfExtents.x, halfExtents.y, halfExtents.z),
          body,
        );
      };

      // Solid perimeter segments and the visible cargo stacks block the player.
      for (let index = 0; index < 16; index += 1) {
        const angle = (index / 16) * Math.PI * 2;
        const radius = 11.1;
        addFixedBox(
          { x: Math.cos(angle) * radius, y: 1.05, z: Math.sin(angle) * radius },
          { x: 0.31, y: 1.1, z: 0.58 },
          -angle,
        );
      }
      crateDefinitions.forEach(([x, y, z, sx, sy, sz], index) => {
        addFixedBox(
          { x, y: y + sy / 2, z },
          { x: sx / 2, y: sy / 2, z: sz / 2 },
          index % 2 ? 0.18 : -0.15,
        );
      });

      playerBody = world.createRigidBody(
        RAPIER.RigidBodyDesc.dynamic()
          .setTranslation(startPosition.x, startPosition.y, startPosition.z)
          .setLinearDamping(5.5)
          .setAngularDamping(8)
          .setCcdEnabled(true),
      );
      playerBody.setGravityScale(0, true);
      playerCollider = world.createCollider(
        RAPIER.ColliderDesc.ball(0.55)
          .setRestitution(0.15)
          .setFriction(0.8)
          .setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS),
        playerBody,
      );
      collisionTargets.set(playerCollider.handle, { type: 'player' });

      corePositions.forEach(([x, z], index) => {
        const body = world.createRigidBody(
          RAPIER.RigidBodyDesc.fixed().setTranslation(x, 0.8, z),
        );
        const collider = world.createCollider(
          RAPIER.ColliderDesc.ball(0.82)
            .setSensor(true)
            .setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS),
          body,
        );
        collisionTargets.set(collider.handle, { type: 'core', index });
      });

      patrols.forEach((drone, index) => {
        const phase = index * 2.15;
        const radius = 6.7 + index * 0.4;
        const body = world.createRigidBody(
          RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(
            Math.cos(phase) * radius,
            0.8,
            Math.sin(phase) * radius,
          ),
        );
        const collider = world.createCollider(
          RAPIER.ColliderDesc.ball(0.78)
            .setSensor(true)
            .setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS),
          body,
        );
        collisionTargets.set(collider.handle, { type: 'hazard', index });
        patrolBodies.push(body);
        collider.setEnabled(index < GAME_MODES[modeRef.current].droneCount);
        patrolColliders.push(collider);
      });

      physicsReady = true;
    };

    void initializePhysics().catch((error: unknown) => {
      console.error('Rapier physics initialization failed.', error);
    });

    const resize = () => {
      if (!mount) return;
      const width = Math.max(1, mount.clientWidth);
      const height = Math.max(1, mount.clientHeight);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      if (renderer) {
        renderer.setSize(width, height, false);
      } else if (fallbackCanvas) {
        const ratio = Math.min(window.devicePixelRatio || 1, 1.7);
        fallbackCanvas.width = Math.round(width * ratio);
        fallbackCanvas.height = Math.round(height * ratio);
        fallbackCanvas.style.width = `${width}px`;
        fallbackCanvas.style.height = `${height}px`;
      }
    };
    const observer = new ResizeObserver(resize);
    observer.observe(mount);
    resize();

    let frame = 0;
    let lastFrameTime = performance.now();
    const drawFallback = () => {
      const context = fallbackContext;
      if (!context || !fallbackCanvas || !mount) return;
      const width = mount.clientWidth;
      const height = mount.clientHeight;
      const ratio = Math.min(window.devicePixelRatio || 1, 1.7);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.clearRect(0, 0, width, height);
      context.fillStyle = '#080e19';
      context.fillRect(0, 0, width, height);

      for (let index = 0; index < 120; index += 1) {
        const x = ((index * 7919) % 997) / 997 * width;
        const y = ((index * 3571) % 991) / 991 * height;
        context.fillStyle = `rgba(181, 226, 224, ${0.15 + ((index * 7) % 8) / 30})`;
        context.fillRect(x, y, index % 9 === 0 ? 2 : 1, index % 9 === 0 ? 2 : 1);
      }

      const scale = Math.min(width / 28, height / 25);
      const centerX = width * 0.66;
      const centerY = height * 0.55;
      const radius = scale * 10.8;
      context.save();
      context.beginPath();
      context.arc(centerX, centerY, radius, 0, Math.PI * 2);
      context.fillStyle = '#101b27';
      context.fill();
      context.clip();
      context.strokeStyle = 'rgba(87, 136, 143, 0.22)';
      context.lineWidth = 1;
      for (let grid = -12; grid <= 12; grid += 1) {
        const offset = grid * scale;
        context.beginPath();
        context.moveTo(centerX + offset, centerY - radius);
        context.lineTo(centerX + offset, centerY + radius);
        context.moveTo(centerX - radius, centerY + offset);
        context.lineTo(centerX + radius, centerY + offset);
        context.stroke();
      }
      context.restore();

      context.beginPath();
      context.arc(centerX, centerY, radius, 0, Math.PI * 2);
      context.strokeStyle = 'rgba(67, 237, 199, 0.62)';
      context.lineWidth = 2;
      context.stroke();

      const toScreen = (x: number, z: number) => ({ x: centerX + x * scale, y: centerY + z * scale });
      crateDefinitions.forEach(([x, , z, sx, , sz], index) => {
        const point = toScreen(x, z);
        context.fillStyle = index % 3 === 0 ? '#43505a' : '#273845';
        context.fillRect(point.x - sx * scale / 2, point.y - sz * scale / 2, sx * scale, sz * scale);
        context.strokeStyle = 'rgba(150, 182, 181, 0.34)';
        context.strokeRect(point.x - sx * scale / 2, point.y - sz * scale / 2, sx * scale, sz * scale);
      });

      cores.forEach((core, index) => {
        if (!core.visible) return;
        const point = toScreen(core.position.x, core.position.z);
        const pulse = 0.72 + Math.sin(tFallback() * 2 + index) * 0.12;
        context.beginPath();
        context.arc(point.x, point.y, Math.max(5, scale * pulse), 0, Math.PI * 2);
        context.fillStyle = 'rgba(46, 239, 199, 0.18)';
        context.fill();
        context.beginPath();
        context.arc(point.x, point.y, Math.max(3, scale * 0.25), 0, Math.PI * 2);
        context.fillStyle = '#8fffe2';
        context.shadowColor = '#43edc7';
        context.shadowBlur = 16;
        context.fill();
        context.shadowBlur = 0;
      });

      patrols.forEach((drone) => {
        if (!drone.visible) return;
        const point = toScreen(drone.position.x, drone.position.z);
        context.beginPath();
        context.arc(point.x, point.y, Math.max(7, scale * 0.65), 0, Math.PI * 2);
        context.fillStyle = '#e45f54';
        context.shadowColor = '#ff544b';
        context.shadowBlur = 12;
        context.fill();
        context.shadowBlur = 0;
      });

      const playerPoint = toScreen(player.position.x, player.position.z);
      context.save();
      context.translate(playerPoint.x, playerPoint.y);
      context.rotate(player.rotation.y);
      context.beginPath();
      context.moveTo(0, -Math.max(9, scale * 0.82));
      context.lineTo(Math.max(7, scale * 0.64), Math.max(7, scale * 0.6));
      context.lineTo(0, Math.max(4, scale * 0.25));
      context.lineTo(-Math.max(7, scale * 0.64), Math.max(7, scale * 0.6));
      context.closePath();
      context.fillStyle = '#59f1cf';
      context.shadowColor = '#43edc7';
      context.shadowBlur = 16;
      context.fill();
      context.restore();
      context.shadowBlur = 0;
    };
    const tFallback = () => performance.now() / 1000;

    const animate = () => {
      frame = window.requestAnimationFrame(animate);
      const now = performance.now();
      const delta = Math.min((now - lastFrameTime) / 1000, 1 / 30);
      lastFrameTime = now;
      const t = now / 1000;
      cores.forEach((core, index) => {
        core.rotation.y = t * 0.65 + index * 0.8;
        core.position.y = 0.82 + Math.sin(t * 1.7 + index) * 0.12;
      });
      player.rotation.y = Math.sin(t * 0.3) * 0.13;
      stars.rotation.y = t * 0.0018;
      beacons.forEach((beacon, index) => {
        (beacon.material as THREE.MeshBasicMaterial).opacity = 0.45 + Math.sin(t * 2.5 + index) * 0.22;
      });

      if (physicsReady && physicsWorld && eventQueue && playerBody && playerCollider) {
        if (lastResetKey !== resetKeyRef.current) {
          lastResetKey = resetKeyRef.current;
          collectedCores.clear();
          cores.forEach((core) => { core.visible = true; });
          playerBody.setTranslation(startPosition, true);
          playerBody.setLinvel({ x: 0, y: 0, z: 0 }, true);
          hitCooldown = 0;
        }

        if (activeRef.current) {
          const horizontal = Number(pressedKeys.has('KeyD') || pressedKeys.has('ArrowRight'))
            - Number(pressedKeys.has('KeyA') || pressedKeys.has('ArrowLeft'));
          const vertical = Number(pressedKeys.has('KeyS') || pressedKeys.has('ArrowDown'))
            - Number(pressedKeys.has('KeyW') || pressedKeys.has('ArrowUp'));
          const magnitude = Math.hypot(horizontal, vertical) || 1;
          const speed = 8.2;
          playerBody.setLinvel(
            { x: (horizontal / magnitude) * speed, y: 0, z: (vertical / magnitude) * speed },
            true,
          );
        } else {
          playerBody.setLinvel({ x: 0, y: 0, z: 0 }, true);
        }

        hitCooldown = Math.max(0, hitCooldown - delta);
        const modeSettings = GAME_MODES[modeRef.current];
        if (lastDroneCount !== modeSettings.droneCount) {
          lastDroneCount = modeSettings.droneCount;
          patrols.forEach((drone, index) => {
            const enabled = index < modeSettings.droneCount;
            drone.visible = enabled;
            patrolColliders[index]?.setEnabled(enabled);
          });
        }
        patrolBodies.forEach((body, index) => {
          const phase = t * (activeRef.current ? modeSettings.patrolSpeed : 0.2) + index * 2.15;
          const radius = 6.7 + index * 0.4;
          body.setNextKinematicTranslation({
            x: Math.cos(phase) * radius,
            y: 0.8 + Math.sin(t * 1.6 + index) * 0.12,
            z: Math.sin(phase) * radius,
          });
        });

        physicsWorld.timestep = Math.max(delta, 1 / 120);
        physicsWorld.step(eventQueue);

        const playerPosition = playerBody.translation();
        player.position.set(playerPosition.x, playerPosition.y + Math.sin(t * 2.1) * 0.09, playerPosition.z);
        player.scale.setScalar(hitCooldown > 0 ? 1.04 + Math.sin(t * 28) * 0.045 : 1);
        patrolBodies.forEach((body, index) => {
          const position = body.translation();
          patrols[index].position.set(position.x, position.y, position.z);
          const velocity = body.linvel();
          patrols[index].rotation.y = Math.atan2(velocity.x, velocity.z);
        });

        eventQueue.drainCollisionEvents((handleA, handleB, started) => {
          if (!started || !activeRef.current) return;
          const targetA = collisionTargets.get(handleA);
          const targetB = collisionTargets.get(handleB);
          const target = targetA?.type === 'player'
            ? targetB
            : targetB?.type === 'player'
              ? targetA
              : undefined;
          if (!target || target.type === 'player') return;

          if (target.type === 'core' && !collectedCores.has(target.index)) {
            collectedCores.add(target.index);
            cores[target.index].visible = false;
            callbacksRef.current.onCoreCollected();
            return;
          }

          if (target.type === 'hazard' && hitCooldown <= 0) {
            hitCooldown = 1.15;
            callbacksRef.current.onHazardHit();
            const hazardPosition = patrolBodies[target.index].translation();
            const dx = playerPosition.x - hazardPosition.x;
            const dz = playerPosition.z - hazardPosition.z;
            const length = Math.hypot(dx, dz) || 1;
            playerBody?.setLinvel({ x: (dx / length) * 7, y: 0, z: (dz / length) * 7 }, true);
          }
        });
      }

      if (renderer) renderer.render(scene, camera);
      else drawFallback();
    };
    animate();

    return () => {
      disposed = true;
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', clearKeys);
      eventQueue?.free();
      physicsWorld?.free();
      scene.traverse((object) => {
        const mesh = object as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        if (mesh.material) {
          if (Array.isArray(mesh.material)) mesh.material.forEach((material) => material.dispose());
          else mesh.material.dispose();
        }
      });
      renderer?.dispose();
      renderer?.domElement.remove();
      fallbackCanvas?.remove();
    };
  }, []);

  return <div ref={mountRef} className="salvage-scene" aria-label="Three-dimensional abandoned orbital salvage station" data-testid="salvage-scene" />;
}
