import * as THREE from 'three';

export type HoleShape = 'circle' | 'square' | 'hexagon' | 'slot' | 'countersink' | 'keyhole';

export interface HoleParams {
  shape: HoleShape;
  diameter: number;
  depth: number;
  position: THREE.Vector3;
  normal: THREE.Vector3;
  slotLength?: number;
  countersinkAngle?: number;
  countersinkDiameter?: number;
  keyholeSmallDiameter?: number;
}

export interface CSGOperation {
  type: 'subtract' | 'union' | 'intersect';
  operand: THREE.BufferGeometry;
  transform: THREE.Matrix4;
}

export function createHoleGeometry(params: HoleParams): THREE.BufferGeometry {
  const { shape, diameter, depth, slotLength, countersinkAngle, countersinkDiameter, keyholeSmallDiameter } = params;
  const radius = diameter / 2;
  const segments = 32;

  let geometry: THREE.BufferGeometry;

  switch (shape) {
    case 'circle':
      geometry = new THREE.CylinderGeometry(radius, radius, depth, segments);
      break;

    case 'square':
      geometry = new THREE.BoxGeometry(diameter, depth, diameter);
      break;

    case 'hexagon':
      geometry = new THREE.CylinderGeometry(radius, radius, depth, 6);
      break;

    case 'slot': {
      const length = slotLength || diameter * 2;
      const shape2d = new THREE.Shape();
      
      shape2d.moveTo(-length / 2 + radius, -radius);
      shape2d.lineTo(length / 2 - radius, -radius);
      shape2d.absarc(length / 2 - radius, 0, radius, -Math.PI / 2, Math.PI / 2, false);
      shape2d.lineTo(-length / 2 + radius, radius);
      shape2d.absarc(-length / 2 + radius, 0, radius, Math.PI / 2, -Math.PI / 2, false);

      geometry = new THREE.ExtrudeGeometry(shape2d, {
        depth: depth,
        bevelEnabled: false,
      });
      geometry.rotateX(Math.PI / 2);
      geometry.translate(0, depth / 2, 0);
      break;
    }

    case 'countersink': {
      const csAngle = countersinkAngle || 90;
      const csDiameter = countersinkDiameter || diameter * 2;
      const csRadius = csDiameter / 2;
      const csDepth = csRadius / Math.tan((csAngle / 2) * Math.PI / 180);

      const holeGeo = new THREE.CylinderGeometry(radius, radius, depth, segments);
      const coneGeo = new THREE.ConeGeometry(csRadius, csDepth, segments);
      coneGeo.rotateX(Math.PI);
      coneGeo.translate(0, -csDepth / 2, 0);

      geometry = mergeBufferGeometries([holeGeo, coneGeo]);
      holeGeo.dispose();
      coneGeo.dispose();
      break;
    }

    case 'keyhole': {
      const smallRadius = (keyholeSmallDiameter || diameter * 0.6) / 2;
      const slotLen = diameter;

      const bigCircle = new THREE.CylinderGeometry(radius, radius, depth, segments);
      const smallCircle = new THREE.CylinderGeometry(smallRadius, smallRadius, depth, segments);
      smallCircle.translate(0, 0, slotLen);

      const slotGeo = new THREE.BoxGeometry(smallRadius * 2, depth, slotLen);
      slotGeo.translate(0, 0, slotLen / 2);

      geometry = mergeBufferGeometries([bigCircle, smallCircle, slotGeo]);
      bigCircle.dispose();
      smallCircle.dispose();
      slotGeo.dispose();
      break;
    }

    default:
      geometry = new THREE.CylinderGeometry(radius, radius, depth, segments);
  }

  return geometry;
}

function mergeBufferGeometries(geometries: THREE.BufferGeometry[]): THREE.BufferGeometry {
  let totalVertices = 0;
  let totalIndices = 0;

  geometries.forEach(geo => {
    totalVertices += geo.attributes.position.count;
    if (geo.index) {
      totalIndices += geo.index.count;
    }
  });

  const positions = new Float32Array(totalVertices * 3);
  const normals = new Float32Array(totalVertices * 3);
  const indices: number[] = [];

  let vertexOffset = 0;

  geometries.forEach(geo => {
    const posAttr = geo.attributes.position;
    const normAttr = geo.attributes.normal;

    for (let i = 0; i < posAttr.count; i++) {
      const idx = (vertexOffset + i) * 3;
      positions[idx] = posAttr.getX(i);
      positions[idx + 1] = posAttr.getY(i);
      positions[idx + 2] = posAttr.getZ(i);

      if (normAttr) {
        normals[idx] = normAttr.getX(i);
        normals[idx + 1] = normAttr.getY(i);
        normals[idx + 2] = normAttr.getZ(i);
      }
    }

    if (geo.index) {
      for (let i = 0; i < geo.index.count; i++) {
        indices.push(geo.index.getX(i) + vertexOffset);
      }
    }

    vertexOffset += posAttr.count;
  });

  const merged = new THREE.BufferGeometry();
  merged.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  merged.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  merged.setIndex(indices);

  return merged;
}

export function orientHoleToNormal(
  geometry: THREE.BufferGeometry,
  position: THREE.Vector3,
  normal: THREE.Vector3
): THREE.BufferGeometry {
  const oriented = geometry.clone();

  const up = new THREE.Vector3(0, 1, 0);
  const quaternion = new THREE.Quaternion();
  quaternion.setFromUnitVectors(up, normal);

  const matrix = new THREE.Matrix4();
  matrix.compose(position, quaternion, new THREE.Vector3(1, 1, 1));

  oriented.applyMatrix4(matrix);

  return oriented;
}

export function createHolePreviewMesh(params: HoleParams): THREE.Mesh {
  const geometry = createHoleGeometry(params);
  const oriented = orientHoleToNormal(geometry, params.position, params.normal);
  geometry.dispose();

  const material = new THREE.MeshBasicMaterial({
    color: 0xff0000,
    transparent: true,
    opacity: 0.5,
    side: THREE.DoubleSide,
  });

  return new THREE.Mesh(oriented, material);
}

export function subtractHoleFromMesh(
  targetGeometry: THREE.BufferGeometry,
  holeParams: HoleParams
): THREE.BufferGeometry {
  const holeGeo = createHoleGeometry(holeParams);
  const orientedHole = orientHoleToNormal(holeGeo, holeParams.position, holeParams.normal);
  holeGeo.dispose();

  const result = performCSGSubtract(targetGeometry, orientedHole);
  orientedHole.dispose();

  return result;
}

function performCSGSubtract(
  target: THREE.BufferGeometry,
  operand: THREE.BufferGeometry
): THREE.BufferGeometry {
  const result = target.clone();
  
  const targetBB = new THREE.Box3().setFromBufferAttribute(
    target.attributes.position as THREE.BufferAttribute
  );
  const operandBB = new THREE.Box3().setFromBufferAttribute(
    operand.attributes.position as THREE.BufferAttribute
  );

  if (!targetBB.intersectsBox(operandBB)) {
    return result;
  }

  result.userData.csgOperations = result.userData.csgOperations || [];
  result.userData.csgOperations.push({
    type: 'subtract',
    params: operand.clone(),
  });

  return result;
}

export interface PokeHoleResult {
  geometry: THREE.BufferGeometry;
  holes: HoleParams[];
}

export function serializeHoleParams(params: HoleParams): object {
  return {
    shape: params.shape,
    diameter: params.diameter,
    depth: params.depth,
    position: [params.position.x, params.position.y, params.position.z],
    normal: [params.normal.x, params.normal.y, params.normal.z],
    slotLength: params.slotLength,
    countersinkAngle: params.countersinkAngle,
    countersinkDiameter: params.countersinkDiameter,
    keyholeSmallDiameter: params.keyholeSmallDiameter,
  };
}

export function deserializeHoleParams(data: any): HoleParams {
  return {
    shape: data.shape,
    diameter: data.diameter,
    depth: data.depth,
    position: new THREE.Vector3(data.position[0], data.position[1], data.position[2]),
    normal: new THREE.Vector3(data.normal[0], data.normal[1], data.normal[2]),
    slotLength: data.slotLength,
    countersinkAngle: data.countersinkAngle,
    countersinkDiameter: data.countersinkDiameter,
    keyholeSmallDiameter: data.keyholeSmallDiameter,
  };
}
