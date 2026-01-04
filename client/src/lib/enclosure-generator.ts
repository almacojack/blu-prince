import * as THREE from 'three';

export interface EnclosureParams {
  outerWidth: number;
  outerHeight: number;
  outerDepth: number;
  wallThickness: number;
  cornerRadius: number;
  hasLid: boolean;
  lidHeight: number;
  lidTolerance: number;
  segments: number;
}

export const DEFAULT_ENCLOSURE_PARAMS: EnclosureParams = {
  outerWidth: 80,
  outerHeight: 50,
  outerDepth: 30,
  wallThickness: 2,
  cornerRadius: 3,
  hasLid: true,
  lidHeight: 10,
  lidTolerance: 0.3,
  segments: 8,
};

function createRoundedBoxShape(
  width: number,
  height: number,
  radius: number
): THREE.Shape {
  const shape = new THREE.Shape();
  const w = width / 2;
  const h = height / 2;
  const r = Math.min(radius, Math.min(w, h));

  shape.moveTo(-w + r, -h);
  shape.lineTo(w - r, -h);
  shape.quadraticCurveTo(w, -h, w, -h + r);
  shape.lineTo(w, h - r);
  shape.quadraticCurveTo(w, h, w - r, h);
  shape.lineTo(-w + r, h);
  shape.quadraticCurveTo(-w, h, -w, h - r);
  shape.lineTo(-w, -h + r);
  shape.quadraticCurveTo(-w, -h, -w + r, -h);

  return shape;
}

function createRoundedBoxHole(
  width: number,
  height: number,
  radius: number
): THREE.Path {
  const path = new THREE.Path();
  const w = width / 2;
  const h = height / 2;
  const r = Math.min(radius, Math.min(w, h));

  path.moveTo(-w + r, -h);
  path.lineTo(w - r, -h);
  path.quadraticCurveTo(w, -h, w, -h + r);
  path.lineTo(w, h - r);
  path.quadraticCurveTo(w, h, w - r, h);
  path.lineTo(-w + r, h);
  path.quadraticCurveTo(-w, h, -w, h - r);
  path.lineTo(-w, -h + r);
  path.quadraticCurveTo(-w, -h, -w + r, -h);

  return path;
}

export function generateEnclosureBody(params: EnclosureParams): THREE.BufferGeometry {
  const {
    outerWidth,
    outerHeight,
    outerDepth,
    wallThickness,
    cornerRadius,
    hasLid,
    lidHeight,
    segments,
  } = params;

  const bodyHeight = hasLid ? outerDepth - lidHeight : outerDepth;
  const innerWidth = outerWidth - wallThickness * 2;
  const innerHeight = outerHeight - wallThickness * 2;
  const innerRadius = Math.max(0, cornerRadius - wallThickness);

  const outerShape = createRoundedBoxShape(outerWidth, outerHeight, cornerRadius);
  const innerHole = createRoundedBoxHole(innerWidth, innerHeight, innerRadius);
  outerShape.holes.push(innerHole);

  const extrudeSettings: THREE.ExtrudeGeometryOptions = {
    depth: bodyHeight - wallThickness,
    bevelEnabled: false,
    steps: 1,
  };

  const wallsGeometry = new THREE.ExtrudeGeometry(outerShape, extrudeSettings);

  const bottomShape = createRoundedBoxShape(outerWidth, outerHeight, cornerRadius);
  const bottomGeometry = new THREE.ExtrudeGeometry(bottomShape, {
    depth: wallThickness,
    bevelEnabled: false,
    steps: 1,
  });

  wallsGeometry.translate(0, 0, wallThickness);

  const geometries = [wallsGeometry, bottomGeometry];
  const mergedGeometry = mergeGeometries(geometries);

  geometries.forEach(g => g.dispose());

  mergedGeometry.rotateX(-Math.PI / 2);
  mergedGeometry.translate(0, bodyHeight / 2, 0);

  mergedGeometry.computeVertexNormals();
  mergedGeometry.computeBoundingBox();

  return mergedGeometry;
}

export function generateEnclosureLid(params: EnclosureParams): THREE.BufferGeometry | null {
  if (!params.hasLid) return null;

  const {
    outerWidth,
    outerHeight,
    wallThickness,
    cornerRadius,
    lidHeight,
    lidTolerance,
  } = params;

  const lipWidth = outerWidth - wallThickness * 2 - lidTolerance * 2;
  const lipHeight = outerHeight - wallThickness * 2 - lidTolerance * 2;
  const lipDepth = lidHeight - wallThickness;
  const lipRadius = Math.max(0, cornerRadius - wallThickness - lidTolerance);

  const topShape = createRoundedBoxShape(outerWidth, outerHeight, cornerRadius);
  const topGeometry = new THREE.ExtrudeGeometry(topShape, {
    depth: wallThickness,
    bevelEnabled: false,
    steps: 1,
  });

  const lipShape = createRoundedBoxShape(lipWidth, lipHeight, lipRadius);
  const lipGeometry = new THREE.ExtrudeGeometry(lipShape, {
    depth: lipDepth,
    bevelEnabled: false,
    steps: 1,
  });

  lipGeometry.translate(0, 0, -lipDepth);

  const mergedGeometry = mergeGeometries([topGeometry, lipGeometry]);

  topGeometry.dispose();
  lipGeometry.dispose();

  mergedGeometry.rotateX(-Math.PI / 2);
  mergedGeometry.translate(0, wallThickness / 2, 0);

  mergedGeometry.computeVertexNormals();
  mergedGeometry.computeBoundingBox();

  return mergedGeometry;
}

function mergeGeometries(geometries: THREE.BufferGeometry[]): THREE.BufferGeometry {
  let totalVertices = 0;
  let totalIndices = 0;

  geometries.forEach(geo => {
    totalVertices += geo.attributes.position.count;
    if (geo.index) {
      totalIndices += geo.index.count;
    } else {
      totalIndices += geo.attributes.position.count;
    }
  });

  const positions = new Float32Array(totalVertices * 3);
  const normals = new Float32Array(totalVertices * 3);
  const indices = new Uint32Array(totalIndices);

  let vertexOffset = 0;
  let indexOffset = 0;
  let indexVertexOffset = 0;

  geometries.forEach(geo => {
    const posAttr = geo.attributes.position;
    const normAttr = geo.attributes.normal;

    for (let i = 0; i < posAttr.count; i++) {
      positions[(vertexOffset + i) * 3] = posAttr.getX(i);
      positions[(vertexOffset + i) * 3 + 1] = posAttr.getY(i);
      positions[(vertexOffset + i) * 3 + 2] = posAttr.getZ(i);

      if (normAttr) {
        normals[(vertexOffset + i) * 3] = normAttr.getX(i);
        normals[(vertexOffset + i) * 3 + 1] = normAttr.getY(i);
        normals[(vertexOffset + i) * 3 + 2] = normAttr.getZ(i);
      }
    }

    if (geo.index) {
      for (let i = 0; i < geo.index.count; i++) {
        indices[indexOffset + i] = geo.index.getX(i) + indexVertexOffset;
      }
      indexOffset += geo.index.count;
    } else {
      for (let i = 0; i < posAttr.count; i++) {
        indices[indexOffset + i] = i + indexVertexOffset;
      }
      indexOffset += posAttr.count;
    }

    indexVertexOffset += posAttr.count;
    vertexOffset += posAttr.count;
  });

  const merged = new THREE.BufferGeometry();
  merged.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  merged.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  merged.setIndex(new THREE.BufferAttribute(indices, 1));

  return merged;
}

export function createEnclosureMesh(
  params: EnclosureParams,
  bodyMaterial?: THREE.Material,
  lidMaterial?: THREE.Material
): { body: THREE.Mesh; lid: THREE.Mesh | null } {
  const defaultMaterial = new THREE.MeshStandardMaterial({
    color: 0x4488ff,
    roughness: 0.7,
    metalness: 0.1,
  });

  const bodyGeometry = generateEnclosureBody(params);
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial || defaultMaterial);
  body.castShadow = true;
  body.receiveShadow = true;
  body.name = 'enclosure_body';

  let lid: THREE.Mesh | null = null;
  if (params.hasLid) {
    const lidGeometry = generateEnclosureLid(params);
    if (lidGeometry) {
      lid = new THREE.Mesh(lidGeometry, lidMaterial || defaultMaterial.clone());
      lid.castShadow = true;
      lid.receiveShadow = true;
      lid.name = 'enclosure_lid';
      lid.position.y = params.outerDepth - params.lidHeight + params.wallThickness + 5;
    }
  }

  return { body, lid };
}

export function serializeEnclosureParams(params: EnclosureParams): object {
  return { ...params };
}

export function deserializeEnclosureParams(data: any): EnclosureParams {
  return {
    ...DEFAULT_ENCLOSURE_PARAMS,
    ...data,
  };
}

export function calculatePrintVolume(params: EnclosureParams): {
  totalVolume: number;
  materialVolume: number;
  printTime: number;
} {
  const outer = params.outerWidth * params.outerHeight * params.outerDepth;
  const inner = (params.outerWidth - params.wallThickness * 2) *
                (params.outerHeight - params.wallThickness * 2) *
                (params.outerDepth - params.wallThickness);
  
  const materialVolume = outer - inner;
  const printTime = materialVolume / 1000;

  return {
    totalVolume: outer / 1000,
    materialVolume: materialVolume / 1000,
    printTime,
  };
}
