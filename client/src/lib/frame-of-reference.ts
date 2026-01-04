import * as THREE from "three";
import type { Transform, TossMesh } from "./toss-v1.1";

export type FrameShape = "sphere" | "cube";
export type FrameVisibility = "solid" | "dotted" | "hidden";

export interface FrameOfReference {
  id: string;
  label: string;
  shape: FrameShape;
  transform: Transform;
  dimensions: {
    width: number;
    height: number;
    depth: number;
    radius?: number;
  };
  visibility: FrameVisibility;
  isActive: boolean;
  color: string;
}

export type AlignmentAxis = "x" | "y" | "z";
export type AlignmentEdge = "min" | "center" | "max";

export interface AlignmentOptions {
  axis: AlignmentAxis;
  edge: AlignmentEdge;
  distributeEvenly?: boolean;
  spacing?: number;
}

export function createDefaultFrame(id?: string): FrameOfReference {
  return {
    id: id || `frame_${Date.now()}`,
    label: "Reference Frame",
    shape: "cube",
    transform: {
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
    },
    dimensions: {
      width: 10,
      height: 10,
      depth: 10,
      radius: 5,
    },
    visibility: "dotted",
    isActive: false,
    color: "#00ffff",
  };
}

export function getFrameBounds(frame: FrameOfReference): THREE.Box3 {
  const { position } = frame.transform;
  const { width, height, depth } = frame.dimensions;
  
  const halfW = width / 2;
  const halfH = height / 2;
  const halfD = depth / 2;
  
  return new THREE.Box3(
    new THREE.Vector3(position.x - halfW, position.y - halfH, position.z - halfD),
    new THREE.Vector3(position.x + halfW, position.y + halfH, position.z + halfD)
  );
}

export function isItemInFrame(item: TossMesh, frame: FrameOfReference): boolean {
  const bounds = getFrameBounds(frame);
  const itemPos = new THREE.Vector3(
    item.transform.position.x,
    item.transform.position.y,
    item.transform.position.z
  );
  
  if (frame.shape === "sphere") {
    const frameCenter = new THREE.Vector3(
      frame.transform.position.x,
      frame.transform.position.y,
      frame.transform.position.z
    );
    const distance = itemPos.distanceTo(frameCenter);
    return distance <= (frame.dimensions.radius || 5);
  }
  
  return bounds.containsPoint(itemPos);
}

export function getEligibleItems(
  items: TossMesh[], 
  frame: FrameOfReference
): TossMesh[] {
  return items.filter(item => {
    if (!isItemInFrame(item, frame)) return false;
    return true;
  });
}

export function getGroupRoots(items: TossMesh[], allItems: TossMesh[] = items): TossMesh[] {
  const childIds = new Set<string>();
  const itemsWithParent = new Set<string>();
  
  allItems.forEach(item => {
    if (item.children_ids) {
      item.children_ids.forEach(id => childIds.add(id));
    }
    if (item.parent_id) {
      itemsWithParent.add(item.id);
    }
  });
  
  return items.filter(item => {
    if (childIds.has(item.id)) return false;
    if (item.parent_id) return false;
    return true;
  });
}

export function alignItemsToFrame(
  items: TossMesh[],
  frame: FrameOfReference,
  options: AlignmentOptions
): Map<string, Transform> {
  const updates = new Map<string, Transform>();
  const eligibleItems = getEligibleItems(items, frame);
  const roots = getGroupRoots(eligibleItems, items);
  
  if (roots.length === 0) return updates;
  
  const { axis, edge, distributeEvenly, spacing = 0.5 } = options;
  const bounds = getFrameBounds(frame);
  
  if (distributeEvenly && roots.length > 1) {
    const sortedRoots = [...roots].sort((a, b) => {
      const aVal = a.transform.position[axis];
      const bVal = b.transform.position[axis];
      return aVal - bVal;
    });
    
    const axisMin = bounds.min[axis];
    const axisMax = bounds.max[axis];
    const totalSpace = axisMax - axisMin;
    const step = totalSpace / (sortedRoots.length + 1);
    
    sortedRoots.forEach((item, index) => {
      const newPosition = { ...item.transform.position };
      newPosition[axis] = axisMin + step * (index + 1);
      
      updates.set(item.id, {
        ...item.transform,
        position: newPosition,
      });
    });
  } else {
    let targetValue: number;
    
    switch (edge) {
      case "min":
        targetValue = bounds.min[axis] + spacing;
        break;
      case "max":
        targetValue = bounds.max[axis] - spacing;
        break;
      case "center":
      default:
        targetValue = (bounds.min[axis] + bounds.max[axis]) / 2;
    }
    
    roots.forEach(item => {
      const newPosition = { ...item.transform.position };
      newPosition[axis] = targetValue;
      
      updates.set(item.id, {
        ...item.transform,
        position: newPosition,
      });
    });
  }
  
  return updates;
}

export function centerAllToFrame(
  items: TossMesh[],
  frame: FrameOfReference
): Map<string, Transform> {
  const updates = new Map<string, Transform>();
  const eligibleItems = getEligibleItems(items, frame);
  const roots = getGroupRoots(eligibleItems, items);
  
  const frameCenter = frame.transform.position;
  
  roots.forEach(item => {
    updates.set(item.id, {
      ...item.transform,
      position: { ...frameCenter },
    });
  });
  
  return updates;
}

export function stackItems(
  items: TossMesh[],
  frame: FrameOfReference,
  axis: AlignmentAxis = "y",
  spacing: number = 0.5
): Map<string, Transform> {
  const updates = new Map<string, Transform>();
  const eligibleItems = getEligibleItems(items, frame);
  const roots = getGroupRoots(eligibleItems, items);
  
  if (roots.length === 0) return updates;
  
  const sortedRoots = [...roots].sort((a, b) => {
    const aVal = a.transform.position[axis];
    const bVal = b.transform.position[axis];
    return aVal - bVal;
  });
  
  let currentOffset = frame.transform.position[axis];
  const basePosition = { ...frame.transform.position };
  
  sortedRoots.forEach((item, index) => {
    const newPosition = { ...basePosition };
    
    newPosition[axis] = currentOffset + (index * spacing);
    
    updates.set(item.id, {
      ...item.transform,
      position: newPosition,
    });
  });
  
  return updates;
}

export function createFrameGeometry(frame: FrameOfReference): THREE.BufferGeometry {
  if (frame.shape === "sphere") {
    return new THREE.SphereGeometry(frame.dimensions.radius || 5, 16, 12);
  }
  return new THREE.BoxGeometry(
    frame.dimensions.width,
    frame.dimensions.height,
    frame.dimensions.depth
  );
}

export function createFrameMaterial(frame: FrameOfReference): THREE.Material {
  const color = new THREE.Color(frame.color);
  
  switch (frame.visibility) {
    case "hidden":
      return new THREE.MeshBasicMaterial({ 
        visible: false 
      });
    case "dotted":
      return new THREE.MeshBasicMaterial({
        color,
        wireframe: true,
        transparent: true,
        opacity: 0.3,
      });
    case "solid":
    default:
      return new THREE.MeshBasicMaterial({
        color,
        wireframe: true,
        transparent: true,
        opacity: 0.8,
      });
  }
}
