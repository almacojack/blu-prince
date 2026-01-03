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
