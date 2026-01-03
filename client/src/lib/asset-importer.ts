/**
 * Unified 3D Asset Importer
 * Supports: glTF, GLB, OBJ, STL, Three.js JSON
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';
import type { Toss3DAsset, Toss3DAssetMetadata } from './toss';

type Asset3DFormat = 'gltf' | 'glb' | 'obj' | 'stl' | 'threejs-json' | 'svg';

export interface ImportResult {
  success: boolean;
  asset?: Toss3DAsset;
  object3D?: THREE.Object3D;
  error?: string;
}

export interface ImportProgress {
  stage: 'reading' | 'parsing' | 'analyzing' | 'encoding' | 'done';
  percent: number;
  message: string;
}

function generateId(): string {
  return `asset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function detectFormat(filename: string, arrayBuffer?: ArrayBuffer): Asset3DFormat | null {
  const ext = filename.toLowerCase().split('.').pop();
  
  switch (ext) {
    case 'gltf':
      return 'gltf';
    case 'glb':
      return 'glb';
    case 'obj':
      return 'obj';
    case 'stl':
      return 'stl';
    case 'json':
      return 'threejs-json';
    case 'svg':
      return 'svg';
    default:
      return null;
  }
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function computeMeshStats(object: THREE.Object3D): { vertexCount: number; faceCount: number } {
  let vertexCount = 0;
  let faceCount = 0;
  
  object.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      const geometry = child.geometry;
      if (geometry.attributes.position) {
        vertexCount += geometry.attributes.position.count;
      }
      if (geometry.index) {
        faceCount += geometry.index.count / 3;
      } else if (geometry.attributes.position) {
        faceCount += geometry.attributes.position.count / 3;
      }
    }
  });
  
  return { vertexCount, faceCount };
}

function computeBoundingBox(object: THREE.Object3D): Toss3DAssetMetadata['boundingBox'] {
  const box = new THREE.Box3().setFromObject(object);
  return {
    min: { x: box.min.x, y: box.min.y, z: box.min.z },
    max: { x: box.max.x, y: box.max.y, z: box.max.z },
  };
}

function hasAnimations(object: THREE.Object3D & { animations?: THREE.AnimationClip[] }): boolean {
  return !!(object.animations && object.animations.length > 0);
}

function hasTextures(object: THREE.Object3D): boolean {
  let found = false;
  object.traverse((child) => {
    if (child instanceof THREE.Mesh && child.material) {
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      for (const mat of materials) {
        if ((mat as any).map || (mat as any).normalMap || (mat as any).roughnessMap) {
          found = true;
        }
      }
    }
  });
  return found;
}

async function generateThumbnail(object: THREE.Object3D, size = 128): Promise<string> {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1a1a2e);
  
  const clone = object.clone();
  scene.add(clone);
  
  const box = new THREE.Box3().setFromObject(clone);
  const center = box.getCenter(new THREE.Vector3());
  const boxSize = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(boxSize.x, boxSize.y, boxSize.z);
  
  clone.position.sub(center);
  
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000);
  camera.position.set(maxDim * 1.5, maxDim * 1.2, maxDim * 1.5);
  camera.lookAt(0, 0, 0);
  
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);
  
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(5, 10, 5);
  scene.add(directionalLight);
  
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(size, size);
  renderer.setPixelRatio(1);
  
  renderer.render(scene, camera);
  
  const dataUrl = renderer.domElement.toDataURL('image/png');
  
  renderer.dispose();
  scene.clear();
  
  return dataUrl.split(',')[1];
}

export async function importGLTF(
  file: File,
  onProgress?: (progress: ImportProgress) => void
): Promise<ImportResult> {
  try {
    onProgress?.({ stage: 'reading', percent: 10, message: 'Reading file...' });
    
    const arrayBuffer = await file.arrayBuffer();
    const isGLB = file.name.toLowerCase().endsWith('.glb');
    
    onProgress?.({ stage: 'parsing', percent: 30, message: 'Parsing 3D model...' });
    
    const loader = new GLTFLoader();
    
    const gltf = await new Promise<any>((resolve, reject) => {
      loader.parse(arrayBuffer, '', resolve, reject);
    });
    
    onProgress?.({ stage: 'analyzing', percent: 60, message: 'Analyzing geometry...' });
    
    const object = gltf.scene;
    const stats = computeMeshStats(object);
    const boundingBox = computeBoundingBox(object);
    
    onProgress?.({ stage: 'encoding', percent: 80, message: 'Encoding asset...' });
    
    const thumbnail = await generateThumbnail(object);
    
    const metadata: Toss3DAssetMetadata = {
      name: file.name.replace(/\.(gltf|glb)$/i, ''),
      format: isGLB ? 'glb' : 'gltf',
      fileSize: file.size,
      vertexCount: stats.vertexCount,
      faceCount: stats.faceCount,
      hasAnimations: hasAnimations(gltf.scene),
      hasTextures: hasTextures(object),
      boundingBox,
      importedAt: new Date().toISOString(),
      originalFilename: file.name,
    };
    
    const data = isGLB 
      ? arrayBufferToBase64(arrayBuffer)
      : await file.text();
    
    const asset: Toss3DAsset = {
      id: generateId(),
      type: 'model',
      metadata,
      data,
      thumbnail,
    };
    
    onProgress?.({ stage: 'done', percent: 100, message: 'Import complete!' });
    
    return { success: true, asset, object3D: object };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function importOBJ(
  file: File,
  onProgress?: (progress: ImportProgress) => void
): Promise<ImportResult> {
  try {
    onProgress?.({ stage: 'reading', percent: 10, message: 'Reading file...' });
    
    const text = await file.text();
    
    onProgress?.({ stage: 'parsing', percent: 30, message: 'Parsing OBJ model...' });
    
    const loader = new OBJLoader();
    const object = loader.parse(text);
    
    onProgress?.({ stage: 'analyzing', percent: 60, message: 'Analyzing geometry...' });
    
    const stats = computeMeshStats(object);
    const boundingBox = computeBoundingBox(object);
    
    onProgress?.({ stage: 'encoding', percent: 80, message: 'Encoding asset...' });
    
    const thumbnail = await generateThumbnail(object);
    
    const metadata: Toss3DAssetMetadata = {
      name: file.name.replace(/\.obj$/i, ''),
      format: 'obj',
      fileSize: file.size,
      vertexCount: stats.vertexCount,
      faceCount: stats.faceCount,
      hasAnimations: false,
      hasTextures: false,
      boundingBox,
      importedAt: new Date().toISOString(),
      originalFilename: file.name,
    };
    
    const asset: Toss3DAsset = {
      id: generateId(),
      type: 'model',
      metadata,
      data: text,
      thumbnail,
    };
    
    onProgress?.({ stage: 'done', percent: 100, message: 'Import complete!' });
    
    return { success: true, asset, object3D: object };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function importSTL(
  file: File,
  onProgress?: (progress: ImportProgress) => void
): Promise<ImportResult> {
  try {
    onProgress?.({ stage: 'reading', percent: 10, message: 'Reading file...' });
    
    const arrayBuffer = await file.arrayBuffer();
    
    onProgress?.({ stage: 'parsing', percent: 30, message: 'Parsing STL model...' });
    
    const loader = new STLLoader();
    const geometry = loader.parse(arrayBuffer);
    
    const material = new THREE.MeshStandardMaterial({ 
      color: 0x7c3aed,
      roughness: 0.5,
      metalness: 0.1,
    });
    const mesh = new THREE.Mesh(geometry, material);
    
    onProgress?.({ stage: 'analyzing', percent: 60, message: 'Analyzing geometry...' });
    
    geometry.computeBoundingBox();
    const box = geometry.boundingBox!;
    const boundingBox = {
      min: { x: box.min.x, y: box.min.y, z: box.min.z },
      max: { x: box.max.x, y: box.max.y, z: box.max.z },
    };
    
    const vertexCount = geometry.attributes.position.count;
    const faceCount = vertexCount / 3;
    
    let volume = 0;
    let surfaceArea = 0;
    const positions = geometry.attributes.position.array;
    
    for (let i = 0; i < positions.length; i += 9) {
      const v1 = new THREE.Vector3(positions[i], positions[i + 1], positions[i + 2]);
      const v2 = new THREE.Vector3(positions[i + 3], positions[i + 4], positions[i + 5]);
      const v3 = new THREE.Vector3(positions[i + 6], positions[i + 7], positions[i + 8]);
      
      const edge1 = v2.clone().sub(v1);
      const edge2 = v3.clone().sub(v1);
      const cross = edge1.cross(edge2);
      const triangleArea = cross.length() / 2;
      surfaceArea += triangleArea;
      
      volume += v1.dot(v2.clone().cross(v3)) / 6;
    }
    
    volume = Math.abs(volume);
    
    onProgress?.({ stage: 'encoding', percent: 80, message: 'Encoding asset...' });
    
    const thumbnail = await generateThumbnail(mesh);
    
    const metadata: Toss3DAssetMetadata = {
      name: file.name.replace(/\.stl$/i, ''),
      format: 'stl',
      fileSize: file.size,
      vertexCount,
      faceCount,
      hasAnimations: false,
      hasTextures: false,
      boundingBox,
      printable: {
        watertight: volume > 0,
        volume_mm3: volume,
        surfaceArea_mm2: surfaceArea,
        units: 'mm',
      },
      importedAt: new Date().toISOString(),
      originalFilename: file.name,
    };
    
    const asset: Toss3DAsset = {
      id: generateId(),
      type: 'model',
      metadata,
      data: arrayBufferToBase64(arrayBuffer),
      thumbnail,
    };
    
    onProgress?.({ stage: 'done', percent: 100, message: 'Import complete!' });
    
    return { success: true, asset, object3D: mesh };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function importThreeJSJSON(
  file: File,
  onProgress?: (progress: ImportProgress) => void
): Promise<ImportResult> {
  try {
    onProgress?.({ stage: 'reading', percent: 10, message: 'Reading file...' });
    
    const text = await file.text();
    const json = JSON.parse(text);
    
    onProgress?.({ stage: 'parsing', percent: 30, message: 'Parsing Three.js scene...' });
    
    const loader = new THREE.ObjectLoader();
    const object = loader.parse(json);
    
    onProgress?.({ stage: 'analyzing', percent: 60, message: 'Analyzing geometry...' });
    
    const stats = computeMeshStats(object);
    const boundingBox = computeBoundingBox(object);
    
    onProgress?.({ stage: 'encoding', percent: 80, message: 'Encoding asset...' });
    
    const thumbnail = await generateThumbnail(object);
    
    const metadata: Toss3DAssetMetadata = {
      name: file.name.replace(/\.json$/i, ''),
      format: 'threejs-json',
      fileSize: file.size,
      vertexCount: stats.vertexCount,
      faceCount: stats.faceCount,
      hasAnimations: hasAnimations(object as any),
      hasTextures: hasTextures(object),
      boundingBox,
      importedAt: new Date().toISOString(),
      originalFilename: file.name,
    };
    
    const asset: Toss3DAsset = {
      id: generateId(),
      type: 'model',
      metadata,
      data: text,
      thumbnail,
    };
    
    onProgress?.({ stage: 'done', percent: 100, message: 'Import complete!' });
    
    return { success: true, asset, object3D: object };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export interface SVGImportOptions {
  extrudeDepth: number;
  scale: number;
  centerOrigin: boolean;
}

export async function importSVG(
  file: File,
  options: Partial<SVGImportOptions> = {},
  onProgress?: (progress: ImportProgress) => void
): Promise<ImportResult> {
  const { extrudeDepth = 0.2, scale = 0.01, centerOrigin = true } = options;
  
  try {
    onProgress?.({ stage: 'reading', percent: 10, message: 'Reading SVG file...' });
    
    const text = await file.text();
    
    onProgress?.({ stage: 'parsing', percent: 30, message: 'Parsing SVG paths...' });
    
    const loader = new SVGLoader();
    const svgData = loader.parse(text);
    
    onProgress?.({ stage: 'analyzing', percent: 50, message: 'Extruding shapes...' });
    
    const group = new THREE.Group();
    const material = new THREE.MeshStandardMaterial({
      color: 0x7c3aed,
      roughness: 0.5,
      metalness: 0.1,
      side: THREE.DoubleSide,
    });
    
    for (const path of svgData.paths) {
      const shapes = SVGLoader.createShapes(path);
      
      for (const shape of shapes) {
        let geometry: THREE.BufferGeometry;
        
        if (extrudeDepth > 0) {
          const extrudeSettings = {
            depth: extrudeDepth,
            bevelEnabled: false,
          };
          geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        } else {
          geometry = new THREE.ShapeGeometry(shape);
        }
        
        const mesh = new THREE.Mesh(geometry, material.clone());
        
        if (path.color) {
          (mesh.material as THREE.MeshStandardMaterial).color.set(path.color);
        }
        
        group.add(mesh);
      }
    }
    
    group.scale.set(scale, -scale, scale);
    
    if (centerOrigin) {
      const box = new THREE.Box3().setFromObject(group);
      const center = box.getCenter(new THREE.Vector3());
      group.position.sub(center);
    }
    
    onProgress?.({ stage: 'encoding', percent: 80, message: 'Encoding asset...' });
    
    const stats = computeMeshStats(group);
    const boundingBox = computeBoundingBox(group);
    const thumbnail = await generateThumbnail(group);
    
    const metadata: Toss3DAssetMetadata = {
      name: file.name.replace(/\.svg$/i, ''),
      format: 'svg' as any,
      fileSize: file.size,
      vertexCount: stats.vertexCount,
      faceCount: stats.faceCount,
      hasAnimations: false,
      hasTextures: false,
      boundingBox,
      importedAt: new Date().toISOString(),
      originalFilename: file.name,
    };
    
    const asset: Toss3DAsset = {
      id: generateId(),
      type: 'model',
      metadata,
      data: text,
      thumbnail,
    };
    
    onProgress?.({ stage: 'done', percent: 100, message: 'SVG import complete!' });
    
    return { success: true, asset, object3D: group };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function importAsset(
  file: File,
  onProgress?: (progress: ImportProgress) => void
): Promise<ImportResult> {
  const format = detectFormat(file.name);
  
  if (!format) {
    return { 
      success: false, 
      error: `Unsupported file format. Supported: glTF, GLB, OBJ, STL, Three.js JSON, SVG` 
    };
  }
  
  switch (format) {
    case 'gltf':
    case 'glb':
      return importGLTF(file, onProgress);
    case 'obj':
      return importOBJ(file, onProgress);
    case 'stl':
      return importSTL(file, onProgress);
    case 'threejs-json':
      return importThreeJSJSON(file, onProgress);
    case 'svg':
      return importSVG(file, {}, onProgress);
    default:
      return { success: false, error: 'Unknown format' };
  }
}

export function getSupportedExtensions(): string[] {
  return ['.gltf', '.glb', '.obj', '.stl', '.json', '.svg'];
}

export function getAcceptString(): string {
  return '.gltf,.glb,.obj,.stl,.json,.svg';
}
