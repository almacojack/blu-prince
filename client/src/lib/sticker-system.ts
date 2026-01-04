import * as THREE from "three";
import type { Transform } from "./toss-v1.1";

export interface StickerTarget {
  objectId: string;
  faceIndex: number;
  faceNormal: THREE.Vector3;
  faceCenter: THREE.Vector3;
  faceBounds: {
    width: number;
    height: number;
  };
}

export interface StickerPlacement {
  sourceAssetId: string;
  targetObjectId: string;
  transform: Transform;
  projectionType: "planar" | "cylindrical" | "spherical";
  offset: { u: number; v: number };
  scale: { u: number; v: number };
  rotation: number;
}

export function calculateStickerTransform(target: StickerTarget, offset: number = 0.01): Transform {
  const normal = target.faceNormal.clone().normalize();
  
  const euler = new THREE.Euler();
  const quaternion = new THREE.Quaternion();
  
  quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
  euler.setFromQuaternion(quaternion);
  
  const offsetPosition = target.faceCenter.clone().add(normal.multiplyScalar(offset));
  
  return {
    position: {
      x: offsetPosition.x,
      y: offsetPosition.y,
      z: offsetPosition.z,
    },
    rotation: {
      x: THREE.MathUtils.radToDeg(euler.x),
      y: THREE.MathUtils.radToDeg(euler.y),
      z: THREE.MathUtils.radToDeg(euler.z),
    },
    scale: {
      x: target.faceBounds.width * 0.8,
      y: target.faceBounds.height * 0.8,
      z: 0.01,
    },
  };
}

export function getFaceFromRaycast(
  intersection: THREE.Intersection,
  geometry: THREE.BufferGeometry
): { normal: THREE.Vector3; center: THREE.Vector3; bounds: { width: number; height: number } } | null {
  if (!intersection.face) return null;
  
  const faceNormal = intersection.face.normal.clone();
  
  if (intersection.object.matrixWorld) {
    const normalMatrix = new THREE.Matrix3().getNormalMatrix(intersection.object.matrixWorld);
    faceNormal.applyMatrix3(normalMatrix).normalize();
  }
  
  const faceCenter = intersection.point.clone();
  
  let width = 1;
  let height = 1;
  
  const positionAttr = geometry.getAttribute("position");
  if (positionAttr && intersection.face) {
    const { a, b, c } = intersection.face;
    
    const va = new THREE.Vector3().fromBufferAttribute(positionAttr, a);
    const vb = new THREE.Vector3().fromBufferAttribute(positionAttr, b);
    const vc = new THREE.Vector3().fromBufferAttribute(positionAttr, c);
    
    const edge1 = vb.clone().sub(va).length();
    const edge2 = vc.clone().sub(va).length();
    
    width = Math.max(edge1, edge2);
    height = Math.min(edge1, edge2);
  }
  
  return {
    normal: faceNormal,
    center: faceCenter,
    bounds: { width, height },
  };
}

export type StickerModeState = 
  | { mode: "inactive" }
  | { mode: "selecting_source"; sourceId: string }
  | { mode: "picking_face"; sourceId: string }
  | { mode: "preview"; sourceId: string; target: StickerTarget; previewTransform: Transform }
  | { mode: "applied"; placement: StickerPlacement };

export function createStickerModeManager() {
  let state: StickerModeState = { mode: "inactive" };
  let listeners: Array<(state: StickerModeState) => void> = [];
  
  return {
    getState: () => state,
    
    subscribe: (listener: (state: StickerModeState) => void) => {
      listeners.push(listener);
      return () => {
        listeners = listeners.filter(l => l !== listener);
      };
    },
    
    startStickerMode: (sourceAssetId: string) => {
      state = { mode: "picking_face", sourceId: sourceAssetId };
      listeners.forEach(l => l(state));
    },
    
    previewOnFace: (target: StickerTarget) => {
      if (state.mode === "picking_face") {
        const previewTransform = calculateStickerTransform(target);
        state = { 
          mode: "preview", 
          sourceId: state.sourceId, 
          target, 
          previewTransform 
        };
        listeners.forEach(l => l(state));
      }
    },
    
    confirmPlacement: (): StickerPlacement | null => {
      if (state.mode === "preview") {
        const placement: StickerPlacement = {
          sourceAssetId: state.sourceId,
          targetObjectId: state.target.objectId,
          transform: state.previewTransform,
          projectionType: "planar",
          offset: { u: 0, v: 0 },
          scale: { u: 1, v: 1 },
          rotation: 0,
        };
        state = { mode: "applied", placement };
        listeners.forEach(l => l(state));
        return placement;
      }
      return null;
    },
    
    cancel: () => {
      state = { mode: "inactive" };
      listeners.forEach(l => l(state));
    },
    
    reset: () => {
      state = { mode: "inactive" };
      listeners.forEach(l => l(state));
    },
  };
}
