/**
 * Asset Loader - Load 3D assets from TOSS cartridge data back into Three.js objects
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';
import type { Toss3DAsset } from './toss';

export interface LoadResult {
  success: boolean;
  object3D?: THREE.Object3D;
  animations?: THREE.AnimationClip[];
  error?: string;
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

export async function loadAsset(asset: Toss3DAsset): Promise<LoadResult> {
  const { format } = asset.metadata;
  
  try {
    switch (format) {
      case 'glb':
        return await loadGLB(asset.data);
      case 'gltf':
        return await loadGLTF(asset.data);
      case 'obj':
        return await loadOBJ(asset.data);
      case 'stl':
        return await loadSTL(asset.data);
      case 'threejs-json':
        return await loadThreeJSJSON(asset.data);
      default:
        return { success: false, error: `Unsupported format: ${format}` };
    }
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

async function loadGLB(base64Data: string): Promise<LoadResult> {
  const arrayBuffer = base64ToArrayBuffer(base64Data);
  const loader = new GLTFLoader();
  
  return new Promise((resolve) => {
    loader.parse(
      arrayBuffer,
      '',
      (gltf) => {
        resolve({
          success: true,
          object3D: gltf.scene,
          animations: gltf.animations,
        });
      },
      (error) => {
        resolve({ success: false, error: String(error) });
      }
    );
  });
}

async function loadGLTF(jsonData: string): Promise<LoadResult> {
  const encoder = new TextEncoder();
  const arrayBuffer = encoder.encode(jsonData).buffer;
  const loader = new GLTFLoader();
  
  return new Promise((resolve) => {
    loader.parse(
      arrayBuffer,
      '',
      (gltf) => {
        resolve({
          success: true,
          object3D: gltf.scene,
          animations: gltf.animations,
        });
      },
      (error) => {
        resolve({ success: false, error: String(error) });
      }
    );
  });
}

async function loadOBJ(textData: string): Promise<LoadResult> {
  const loader = new OBJLoader();
  const object = loader.parse(textData);
  return { success: true, object3D: object };
}

async function loadSTL(base64Data: string): Promise<LoadResult> {
  const arrayBuffer = base64ToArrayBuffer(base64Data);
  const loader = new STLLoader();
  const geometry = loader.parse(arrayBuffer);
  
  const material = new THREE.MeshStandardMaterial({
    color: 0x7c3aed,
    roughness: 0.5,
    metalness: 0.1,
  });
  
  const mesh = new THREE.Mesh(geometry, material);
  return { success: true, object3D: mesh };
}

async function loadThreeJSJSON(jsonData: string): Promise<LoadResult> {
  const json = JSON.parse(jsonData);
  const loader = new THREE.ObjectLoader();
  const object = loader.parse(json);
  return { success: true, object3D: object };
}

export function createThumbnailFromData(thumbnail?: string): string | null {
  if (!thumbnail) return null;
  return `data:image/png;base64,${thumbnail}`;
}

export async function exportAsSTL(asset: Toss3DAsset): Promise<Blob | null> {
  const result = await loadAsset(asset);
  if (!result.success || !result.object3D) return null;
  
  const geometries: THREE.BufferGeometry[] = [];
  
  result.object3D.traverse((child) => {
    if (child instanceof THREE.Mesh && child.geometry) {
      const clonedGeometry = child.geometry.clone();
      child.updateMatrixWorld();
      clonedGeometry.applyMatrix4(child.matrixWorld);
      geometries.push(clonedGeometry);
    }
  });
  
  if (geometries.length === 0) return null;
  
  let mergedGeometry: THREE.BufferGeometry;
  if (geometries.length === 1) {
    mergedGeometry = geometries[0];
  } else {
    const { mergeGeometries } = await import('three/addons/utils/BufferGeometryUtils.js');
    const merged = mergeGeometries(geometries, false);
    if (!merged) return null;
    mergedGeometry = merged;
  }
  
  const stlData = generateSTLBinary(mergedGeometry);
  return new Blob([stlData], { type: 'application/octet-stream' });
}

function generateSTLBinary(geometry: THREE.BufferGeometry): ArrayBuffer {
  const positionAttr = geometry.getAttribute('position');
  const indexAttr = geometry.getIndex();
  
  let triangleCount: number;
  if (indexAttr) {
    triangleCount = indexAttr.count / 3;
  } else {
    triangleCount = positionAttr.count / 3;
  }
  
  const bufferSize = 84 + triangleCount * 50;
  const buffer = new ArrayBuffer(bufferSize);
  const dv = new DataView(buffer);
  
  let offset = 80;
  dv.setUint32(offset, triangleCount, true);
  offset += 4;
  
  const v1 = new THREE.Vector3();
  const v2 = new THREE.Vector3();
  const v3 = new THREE.Vector3();
  const normal = new THREE.Vector3();
  const edge1 = new THREE.Vector3();
  const edge2 = new THREE.Vector3();
  
  for (let i = 0; i < triangleCount; i++) {
    let i1: number, i2: number, i3: number;
    if (indexAttr) {
      i1 = indexAttr.getX(i * 3);
      i2 = indexAttr.getX(i * 3 + 1);
      i3 = indexAttr.getX(i * 3 + 2);
    } else {
      i1 = i * 3;
      i2 = i * 3 + 1;
      i3 = i * 3 + 2;
    }
    
    v1.fromBufferAttribute(positionAttr, i1);
    v2.fromBufferAttribute(positionAttr, i2);
    v3.fromBufferAttribute(positionAttr, i3);
    
    edge1.subVectors(v2, v1);
    edge2.subVectors(v3, v1);
    normal.crossVectors(edge1, edge2).normalize();
    
    dv.setFloat32(offset, normal.x, true); offset += 4;
    dv.setFloat32(offset, normal.y, true); offset += 4;
    dv.setFloat32(offset, normal.z, true); offset += 4;
    
    dv.setFloat32(offset, v1.x, true); offset += 4;
    dv.setFloat32(offset, v1.y, true); offset += 4;
    dv.setFloat32(offset, v1.z, true); offset += 4;
    
    dv.setFloat32(offset, v2.x, true); offset += 4;
    dv.setFloat32(offset, v2.y, true); offset += 4;
    dv.setFloat32(offset, v2.z, true); offset += 4;
    
    dv.setFloat32(offset, v3.x, true); offset += 4;
    dv.setFloat32(offset, v3.y, true); offset += 4;
    dv.setFloat32(offset, v3.z, true); offset += 4;
    
    dv.setUint16(offset, 0, true); offset += 2;
  }
  
  return buffer;
}
