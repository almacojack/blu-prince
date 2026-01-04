import * as THREE from 'three';

export interface TrackControlPoint {
  position: THREE.Vector3;
  width: number;
  banking: number;
}

export interface TrackSegment {
  id: string;
  controlPoints: TrackControlPoint[];
  surfaceType: 'asphalt' | 'grass' | 'dirt' | 'water' | 'sand' | 'cobblestone';
  closed: boolean;
}

export interface TrackMeshData {
  positions: Float32Array;
  normals: Float32Array;
  uvs: Float32Array;
  indices: Uint32Array;
}

const SURFACE_COLORS: Record<TrackSegment['surfaceType'], string> = {
  asphalt: '#333333',
  grass: '#4a7c23',
  dirt: '#8b6914',
  water: '#2196f3',
  sand: '#e8d4a8',
  cobblestone: '#666666',
};

const SURFACE_ROUGHNESS: Record<TrackSegment['surfaceType'], number> = {
  asphalt: 0.8,
  grass: 0.95,
  dirt: 0.9,
  water: 0.1,
  sand: 0.85,
  cobblestone: 0.75,
};

export function createTrackControlPoint(
  x: number, 
  y: number, 
  z: number, 
  width = 4, 
  banking = 0
): TrackControlPoint {
  return {
    position: new THREE.Vector3(x, y, z),
    width,
    banking,
  };
}

export function generateTrackMesh(
  segment: TrackSegment,
  resolution = 20
): TrackMeshData {
  const { controlPoints, closed } = segment;
  
  if (controlPoints.length < 2) {
    return {
      positions: new Float32Array(0),
      normals: new Float32Array(0),
      uvs: new Float32Array(0),
      indices: new Uint32Array(0),
    };
  }

  const curve = new THREE.CatmullRomCurve3(
    controlPoints.map(cp => cp.position),
    closed,
    'catmullrom',
    0.5
  );

  const points = curve.getPoints(controlPoints.length * resolution);
  const tangents = points.map((_, i) => curve.getTangent(i / points.length));

  const vertices: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  let totalLength = 0;
  const lengths: number[] = [0];
  
  for (let i = 1; i < points.length; i++) {
    totalLength += points[i].distanceTo(points[i - 1]);
    lengths.push(totalLength);
  }

  for (let i = 0; i < points.length; i++) {
    const t = i / (points.length - 1);
    const cpIndex = Math.min(
      Math.floor(t * (controlPoints.length - 1)),
      controlPoints.length - 2
    );
    const localT = (t * (controlPoints.length - 1)) - cpIndex;
    
    const width1 = controlPoints[cpIndex].width;
    const width2 = controlPoints[Math.min(cpIndex + 1, controlPoints.length - 1)].width;
    const width = THREE.MathUtils.lerp(width1, width2, localT);
    
    const banking1 = controlPoints[cpIndex].banking;
    const banking2 = controlPoints[Math.min(cpIndex + 1, controlPoints.length - 1)].banking;
    const banking = THREE.MathUtils.lerp(banking1, banking2, localT);

    const point = points[i];
    const tangent = tangents[i].normalize();
    
    const up = new THREE.Vector3(0, 1, 0);
    const right = new THREE.Vector3().crossVectors(up, tangent).normalize();
    const normal = new THREE.Vector3().crossVectors(tangent, right).normalize();

    if (banking !== 0) {
      const bankQuat = new THREE.Quaternion().setFromAxisAngle(tangent, banking);
      right.applyQuaternion(bankQuat);
      normal.applyQuaternion(bankQuat);
    }

    const halfWidth = width / 2;
    const leftPoint = point.clone().addScaledVector(right, -halfWidth);
    const rightPoint = point.clone().addScaledVector(right, halfWidth);

    vertices.push(leftPoint.x, leftPoint.y, leftPoint.z);
    vertices.push(rightPoint.x, rightPoint.y, rightPoint.z);

    normals.push(normal.x, normal.y, normal.z);
    normals.push(normal.x, normal.y, normal.z);

    const u = lengths[i] / totalLength;
    uvs.push(0, u * 10);
    uvs.push(1, u * 10);

    if (i < points.length - 1) {
      const baseIndex = i * 2;
      indices.push(baseIndex, baseIndex + 1, baseIndex + 2);
      indices.push(baseIndex + 1, baseIndex + 3, baseIndex + 2);
    }
  }

  if (closed && points.length > 2) {
    const lastIndex = (points.length - 1) * 2;
    indices.push(lastIndex, lastIndex + 1, 0);
    indices.push(lastIndex + 1, 1, 0);
  }

  return {
    positions: new Float32Array(vertices),
    normals: new Float32Array(normals),
    uvs: new Float32Array(uvs),
    indices: new Uint32Array(indices),
  };
}

export function createTrackGeometry(meshData: TrackMeshData): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  
  geometry.setAttribute('position', new THREE.BufferAttribute(meshData.positions, 3));
  geometry.setAttribute('normal', new THREE.BufferAttribute(meshData.normals, 3));
  geometry.setAttribute('uv', new THREE.BufferAttribute(meshData.uvs, 2));
  geometry.setIndex(new THREE.BufferAttribute(meshData.indices, 1));
  
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  
  return geometry;
}

export function createTrackMaterial(
  surfaceType: TrackSegment['surfaceType'],
  quality: 'low' | 'medium' | 'high'
): THREE.Material {
  const color = SURFACE_COLORS[surfaceType];
  const roughness = SURFACE_ROUGHNESS[surfaceType];

  if (quality === 'low') {
    return new THREE.MeshLambertMaterial({
      color,
      flatShading: true,
      side: THREE.DoubleSide,
    });
  }

  return new THREE.MeshStandardMaterial({
    color,
    roughness,
    metalness: surfaceType === 'water' ? 0.3 : 0,
    side: THREE.DoubleSide,
    flatShading: quality === 'medium',
  });
}

export function serializeTrackSegment(segment: TrackSegment): object {
  return {
    id: segment.id,
    controlPoints: segment.controlPoints.map(cp => ({
      position: [cp.position.x, cp.position.y, cp.position.z],
      width: cp.width,
      banking: cp.banking,
    })),
    surfaceType: segment.surfaceType,
    closed: segment.closed,
  };
}

export function deserializeTrackSegment(data: any): TrackSegment {
  return {
    id: data.id,
    controlPoints: data.controlPoints.map((cp: any) => ({
      position: new THREE.Vector3(cp.position[0], cp.position[1], cp.position[2]),
      width: cp.width,
      banking: cp.banking,
    })),
    surfaceType: data.surfaceType,
    closed: data.closed,
  };
}

export class TrackBuilder {
  private segment: TrackSegment;
  private geometry: THREE.BufferGeometry | null = null;
  private mesh: THREE.Mesh | null = null;
  private material: THREE.Material;
  private quality: 'low' | 'medium' | 'high';

  constructor(
    id: string,
    surfaceType: TrackSegment['surfaceType'] = 'asphalt',
    quality: 'low' | 'medium' | 'high' = 'medium'
  ) {
    this.segment = {
      id,
      controlPoints: [],
      surfaceType,
      closed: false,
    };
    this.quality = quality;
    this.material = createTrackMaterial(surfaceType, quality);
  }

  addPoint(x: number, y: number, z: number, width = 4, banking = 0): this {
    this.segment.controlPoints.push(createTrackControlPoint(x, y, z, width, banking));
    this.rebuild();
    return this;
  }

  removeLastPoint(): this {
    if (this.segment.controlPoints.length > 0) {
      this.segment.controlPoints.pop();
      this.rebuild();
    }
    return this;
  }

  updatePoint(index: number, updates: Partial<TrackControlPoint>): this {
    if (index >= 0 && index < this.segment.controlPoints.length) {
      const point = this.segment.controlPoints[index];
      if (updates.position) point.position.copy(updates.position);
      if (updates.width !== undefined) point.width = updates.width;
      if (updates.banking !== undefined) point.banking = updates.banking;
      this.rebuild();
    }
    return this;
  }

  setClosed(closed: boolean): this {
    this.segment.closed = closed;
    this.rebuild();
    return this;
  }

  setSurfaceType(surfaceType: TrackSegment['surfaceType']): this {
    this.segment.surfaceType = surfaceType;
    this.material = createTrackMaterial(surfaceType, this.quality);
    if (this.mesh) {
      this.mesh.material = this.material;
    }
    return this;
  }

  setQuality(quality: 'low' | 'medium' | 'high'): this {
    this.quality = quality;
    this.material = createTrackMaterial(this.segment.surfaceType, quality);
    if (this.mesh) {
      this.mesh.material = this.material;
    }
    return this;
  }

  private rebuild(): void {
    if (this.segment.controlPoints.length < 2) {
      if (this.geometry) {
        this.geometry.dispose();
        this.geometry = null;
      }
      return;
    }

    const meshData = generateTrackMesh(this.segment);
    
    if (this.geometry) {
      this.geometry.dispose();
    }
    
    this.geometry = createTrackGeometry(meshData);
    
    if (this.mesh) {
      this.mesh.geometry = this.geometry;
    }
  }

  getMesh(): THREE.Mesh | null {
    if (!this.geometry) return null;
    
    if (!this.mesh) {
      this.mesh = new THREE.Mesh(this.geometry, this.material);
      this.mesh.receiveShadow = true;
      this.mesh.castShadow = false;
    }
    
    return this.mesh;
  }

  getSegment(): TrackSegment {
    return this.segment;
  }

  dispose(): void {
    if (this.geometry) {
      this.geometry.dispose();
    }
    if (this.material) {
      this.material.dispose();
    }
  }
}
