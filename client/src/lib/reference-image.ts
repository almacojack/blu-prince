import * as THREE from "three";
import type { Transform } from "./toss-v1.1";

export interface ReferenceImage {
  id: string;
  label: string;
  imageUrl: string;
  assetId?: string;
  transform: Transform;
  opacity: number;
  locked: boolean;
  doubleSided: boolean;
  mirrorBack: boolean;
}

export function createDefaultReferenceImage(
  imageUrl: string,
  assetId?: string
): ReferenceImage {
  return {
    id: `refimg_${Date.now()}`,
    label: "Reference Image",
    imageUrl,
    assetId,
    transform: {
      position: { x: 0, y: 1, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 2, y: 2, z: 0.01 },
    },
    opacity: 0.8,
    locked: false,
    doubleSided: true,
    mirrorBack: true,
  };
}

export function createReferenceImageMaterial(
  texture: THREE.Texture,
  refImage: ReferenceImage,
  isFrontFace: boolean = true
): THREE.MeshBasicMaterial {
  const clonedTexture = texture.clone();
  clonedTexture.needsUpdate = true;
  
  if (!isFrontFace && refImage.mirrorBack) {
    clonedTexture.wrapS = THREE.MirroredRepeatWrapping;
    clonedTexture.repeat.x = 1;
    clonedTexture.offset.x = 1;
  }
  
  return new THREE.MeshBasicMaterial({
    map: clonedTexture,
    transparent: true,
    opacity: refImage.opacity,
    side: isFrontFace ? THREE.FrontSide : THREE.BackSide,
    depthWrite: false,
  });
}

export function createReferenceImageMesh(
  texture: THREE.Texture,
  refImage: ReferenceImage
): THREE.Group {
  const group = new THREE.Group();
  group.name = refImage.id;
  
  const img = texture.image as HTMLImageElement | undefined;
  const aspectRatio = img ? img.width / img.height : 1;
  
  const geometry = new THREE.PlaneGeometry(
    refImage.transform.scale.x,
    refImage.transform.scale.x / aspectRatio
  );
  
  const frontMaterial = createReferenceImageMaterial(texture, refImage, true);
  const frontMesh = new THREE.Mesh(geometry, frontMaterial);
  frontMesh.name = `${refImage.id}_front`;
  group.add(frontMesh);
  
  if (refImage.doubleSided) {
    const backGeometry = geometry.clone();
    const backMaterial = createReferenceImageMaterial(texture, refImage, false);
    const backMesh = new THREE.Mesh(backGeometry, backMaterial);
    backMesh.name = `${refImage.id}_back`;
    backMesh.rotation.y = Math.PI;
    group.add(backMesh);
  }
  
  group.position.set(
    refImage.transform.position.x,
    refImage.transform.position.y,
    refImage.transform.position.z
  );
  
  group.rotation.set(
    THREE.MathUtils.degToRad(refImage.transform.rotation.x),
    THREE.MathUtils.degToRad(refImage.transform.rotation.y),
    THREE.MathUtils.degToRad(refImage.transform.rotation.z)
  );
  
  return group;
}

export type PlacementMode = "floating" | "on_surface" | "billboard";

export interface ImagePlacementOptions {
  mode: PlacementMode;
  faceNormal?: THREE.Vector3;
  surfacePoint?: THREE.Vector3;
  offset?: number;
}

export function calculateImageTransformForPlacement(
  options: ImagePlacementOptions,
  imageSize: { width: number; height: number }
): Transform {
  const { mode, faceNormal, surfacePoint, offset = 0.01 } = options;
  
  switch (mode) {
    case "on_surface": {
      if (!faceNormal || !surfacePoint) {
        return createDefaultReferenceImage("").transform;
      }
      
      const normal = faceNormal.clone().normalize();
      const euler = new THREE.Euler();
      const quaternion = new THREE.Quaternion();
      
      quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
      euler.setFromQuaternion(quaternion);
      
      const position = surfacePoint.clone().add(normal.multiplyScalar(offset));
      
      return {
        position: { x: position.x, y: position.y, z: position.z },
        rotation: {
          x: THREE.MathUtils.radToDeg(euler.x),
          y: THREE.MathUtils.radToDeg(euler.y),
          z: THREE.MathUtils.radToDeg(euler.z),
        },
        scale: { x: imageSize.width, y: imageSize.height, z: 0.01 },
      };
    }
    
    case "billboard": {
      return {
        position: surfacePoint ? 
          { x: surfacePoint.x, y: surfacePoint.y, z: surfacePoint.z } :
          { x: 0, y: 1, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: imageSize.width, y: imageSize.height, z: 0.01 },
      };
    }
    
    case "floating":
    default: {
      return {
        position: { x: 0, y: 1, z: -3 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: imageSize.width, y: imageSize.height, z: 0.01 },
      };
    }
  }
}

export function updateReferenceImageInScene(
  scene: THREE.Scene,
  refImage: ReferenceImage,
  texture: THREE.Texture
): void {
  const existing = scene.getObjectByName(refImage.id);
  if (existing) {
    scene.remove(existing);
  }
  
  const mesh = createReferenceImageMesh(texture, refImage);
  scene.add(mesh);
}
