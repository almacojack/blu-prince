import type { RigidBody } from '@dimforge/rapier3d-compat';
import * as THREE from 'three';

export interface GesturePoint {
  x: number;
  y: number;
  z: number;
  time: number;
}

export interface GestureState {
  isActive: boolean;
  startPoint: GesturePoint | null;
  currentPoint: GesturePoint | null;
  points: GesturePoint[];
  targetBody: RigidBody | null;
}

export interface ImpulseResult {
  direction: THREE.Vector3;
  magnitude: number;
}

const MAX_HISTORY = 10;
const VELOCITY_WINDOW_MS = 100;

export function createGestureState(): GestureState {
  return {
    isActive: false,
    startPoint: null,
    currentPoint: null,
    points: [],
    targetBody: null,
  };
}

export function startGesture(
  state: GestureState,
  point: { x: number; y: number; z: number },
  body: RigidBody | null
): GestureState {
  const gesturePoint: GesturePoint = { ...point, time: performance.now() };
  return {
    isActive: true,
    startPoint: gesturePoint,
    currentPoint: gesturePoint,
    points: [gesturePoint],
    targetBody: body,
  };
}

export function updateGesture(
  state: GestureState,
  point: { x: number; y: number; z: number }
): GestureState {
  if (!state.isActive) return state;
  
  const gesturePoint: GesturePoint = { ...point, time: performance.now() };
  const points = [...state.points, gesturePoint].slice(-MAX_HISTORY);
  
  return {
    ...state,
    currentPoint: gesturePoint,
    points,
  };
}

export function endGesture(state: GestureState): GestureState {
  return {
    ...state,
    isActive: false,
  };
}

export function calculateFlickVelocity(state: GestureState): THREE.Vector3 {
  if (state.points.length < 2) {
    return new THREE.Vector3(0, 0, 0);
  }
  
  const now = performance.now();
  const recentPoints = state.points.filter(p => now - p.time < VELOCITY_WINDOW_MS);
  
  if (recentPoints.length < 2) {
    const last = state.points[state.points.length - 1];
    const prev = state.points[state.points.length - 2];
    const dt = (last.time - prev.time) / 1000;
    if (dt <= 0) return new THREE.Vector3(0, 0, 0);
    
    return new THREE.Vector3(
      (last.x - prev.x) / dt,
      (last.y - prev.y) / dt,
      (last.z - prev.z) / dt
    );
  }
  
  const first = recentPoints[0];
  const last = recentPoints[recentPoints.length - 1];
  const dt = (last.time - first.time) / 1000;
  
  if (dt <= 0) return new THREE.Vector3(0, 0, 0);
  
  return new THREE.Vector3(
    (last.x - first.x) / dt,
    (last.y - first.y) / dt,
    (last.z - first.z) / dt
  );
}

export function calculatePoolCueImpulse(state: GestureState, power: number): ImpulseResult {
  if (!state.startPoint || !state.currentPoint) {
    return { direction: new THREE.Vector3(0, 0, 0), magnitude: 0 };
  }
  
  const pullback = new THREE.Vector3(
    state.startPoint.x - state.currentPoint.x,
    state.startPoint.y - state.currentPoint.y,
    state.startPoint.z - state.currentPoint.z
  );
  
  const distance = pullback.length();
  const direction = pullback.normalize();
  
  const magnitude = Math.min(distance * power * 0.5, 50);
  
  return { direction, magnitude };
}

export function calculateSlingshotImpulse(state: GestureState, power: number): ImpulseResult {
  if (!state.startPoint || !state.currentPoint) {
    return { direction: new THREE.Vector3(0, 0, 0), magnitude: 0 };
  }
  
  const stretch = new THREE.Vector3(
    state.startPoint.x - state.currentPoint.x,
    state.startPoint.y - state.currentPoint.y,
    state.startPoint.z - state.currentPoint.z
  );
  
  const distance = stretch.length();
  const direction = stretch.normalize();
  
  const magnitude = Math.pow(distance, 1.5) * power * 0.3;
  const clampedMagnitude = Math.min(magnitude, 80);
  
  return { direction, magnitude: clampedMagnitude };
}

export function applyFlickImpulse(
  body: RigidBody,
  velocity: THREE.Vector3,
  power: number
): void {
  const impulse = velocity.clone().multiplyScalar(power * 0.01);
  
  impulse.clampLength(0, 30);
  
  body.applyImpulse({ x: impulse.x, y: impulse.y, z: impulse.z }, true);
}

export function applyDirectionalImpulse(
  body: RigidBody,
  result: ImpulseResult
): void {
  const impulse = result.direction.clone().multiplyScalar(result.magnitude);
  body.applyImpulse({ x: impulse.x, y: impulse.y, z: impulse.z }, true);
}

export function applyMagnetForce(
  body: RigidBody,
  magnetPosition: THREE.Vector3,
  attract: boolean,
  strength: number,
  maxDistance: number = 10
): void {
  const bodyPos = body.translation();
  const toMagnet = new THREE.Vector3(
    magnetPosition.x - bodyPos.x,
    magnetPosition.y - bodyPos.y,
    magnetPosition.z - bodyPos.z
  );
  
  const distance = toMagnet.length();
  if (distance > maxDistance || distance < 0.1) return;
  
  const falloff = 1 - (distance / maxDistance);
  const forceMagnitude = strength * falloff * falloff;
  
  const direction = toMagnet.normalize();
  if (!attract) direction.negate();
  
  const force = direction.multiplyScalar(forceMagnitude);
  body.addForce({ x: force.x, y: force.y, z: force.z }, true);
}

export interface SpringConnection {
  id: string;
  bodyA: string;
  bodyB: string;
  restLength: number;
  stiffness: number;
  damping: number;
}

export function applySpringForce(
  bodyA: RigidBody,
  bodyB: RigidBody,
  spring: SpringConnection
): void {
  const posA = bodyA.translation();
  const posB = bodyB.translation();
  
  const velA = bodyA.linvel();
  const velB = bodyB.linvel();
  
  const displacement = new THREE.Vector3(
    posB.x - posA.x,
    posB.y - posA.y,
    posB.z - posA.z
  );
  
  const distance = displacement.length();
  if (distance < 0.01) return;
  
  const direction = displacement.normalize();
  
  const stretch = distance - spring.restLength;
  
  const relVel = new THREE.Vector3(
    velB.x - velA.x,
    velB.y - velA.y,
    velB.z - velA.z
  );
  const dampingVel = relVel.dot(direction);
  
  const forceMagnitude = spring.stiffness * stretch + spring.damping * dampingVel;
  const force = direction.multiplyScalar(forceMagnitude);
  
  bodyA.addForce({ x: force.x, y: force.y, z: force.z }, true);
  bodyB.addForce({ x: -force.x, y: -force.y, z: -force.z }, true);
}
