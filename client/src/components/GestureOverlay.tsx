import React, { useRef, useCallback, useEffect, useState, useMemo } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { PhysicsTool } from './ToolsPanel';
import {
  GestureState,
  createGestureState,
  startGesture,
  updateGesture,
  endGesture,
  calculateFlickVelocity,
  calculatePoolCueImpulse,
  calculateSlingshotImpulse,
  applyFlickImpulse,
  applyDirectionalImpulse,
} from '@/lib/gesture-physics';

interface GestureOverlayProps {
  activeTool: PhysicsTool;
  toolPower: number;
  rigidBodies: Map<string, any>;
  onGestureStart?: (itemId: string | null) => void;
  onGestureEnd?: () => void;
}

const GestureLine = React.forwardRef<THREE.Line, { color: string }>(({ color }, ref) => {
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 0, 0, 0], 3));
    return geo;
  }, []);
  
  const material = useMemo(() => new THREE.LineBasicMaterial({ color }), [color]);
  
  return <primitive object={new THREE.Line(geometry, material)} ref={ref} visible={false} />;
});

export function GestureOverlay({
  activeTool,
  toolPower,
  rigidBodies,
  onGestureStart,
  onGestureEnd,
}: GestureOverlayProps) {
  const { camera, raycaster, pointer, scene } = useThree();
  const [gestureState, setGestureState] = useState<GestureState>(createGestureState());
  const [targetBodyId, setTargetBodyId] = useState<string | null>(null);
  const lineRef = useRef<THREE.Line | null>(null);
  const startPointRef = useRef<THREE.Vector3 | null>(null);
  const currentPointRef = useRef<THREE.Vector3 | null>(null);

  const isPhysicsTool = ['flick', 'pool_cue', 'slingshot'].includes(activeTool);

  const getWorldPoint = useCallback((e: THREE.Event): THREE.Vector3 | null => {
    raycaster.setFromCamera(pointer, camera);
    const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const intersect = new THREE.Vector3();
    raycaster.ray.intersectPlane(groundPlane, intersect);
    return intersect;
  }, [camera, raycaster, pointer]);

  const findIntersectedBody = useCallback((): { id: string; body: any } | null => {
    raycaster.setFromCamera(pointer, camera);
    const meshes: THREE.Object3D[] = [];
    scene.traverse((obj) => {
      if (obj.userData?.itemId && rigidBodies.has(obj.userData.itemId)) {
        meshes.push(obj);
      }
    });

    const intersects = raycaster.intersectObjects(meshes, true);
    if (intersects.length > 0) {
      let current = intersects[0].object;
      while (current && !current.userData?.itemId) {
        current = current.parent as THREE.Object3D;
      }
      if (current?.userData?.itemId) {
        const body = rigidBodies.get(current.userData.itemId);
        if (body) {
          return { id: current.userData.itemId, body };
        }
      }
    }
    return null;
  }, [camera, raycaster, pointer, scene, rigidBodies]);

  const handlePointerDown = useCallback((e: any) => {
    if (!isPhysicsTool) return;

    const worldPoint = getWorldPoint(e);
    if (!worldPoint) return;

    const hit = findIntersectedBody();
    if (!hit) return;

    startPointRef.current = worldPoint.clone();
    currentPointRef.current = worldPoint.clone();
    setTargetBodyId(hit.id);
    
    const newState = startGesture(
      createGestureState(),
      { x: worldPoint.x, y: worldPoint.y, z: worldPoint.z },
      hit.body
    );
    setGestureState(newState);
    onGestureStart?.(hit.id);
  }, [isPhysicsTool, getWorldPoint, findIntersectedBody, onGestureStart]);

  const handlePointerMove = useCallback((e: any) => {
    if (!gestureState.isActive || !isPhysicsTool) return;

    const worldPoint = getWorldPoint(e);
    if (!worldPoint) return;

    currentPointRef.current = worldPoint.clone();
    
    const newState = updateGesture(gestureState, {
      x: worldPoint.x,
      y: worldPoint.y,
      z: worldPoint.z,
    });
    setGestureState(newState);
  }, [gestureState, isPhysicsTool, getWorldPoint]);

  const handlePointerUp = useCallback(() => {
    if (!gestureState.isActive || !targetBodyId) {
      setGestureState(endGesture(gestureState));
      return;
    }

    const body = rigidBodies.get(targetBodyId);
    if (!body) {
      setGestureState(endGesture(gestureState));
      return;
    }

    const power = toolPower / 100;

    switch (activeTool) {
      case 'flick': {
        const velocity = calculateFlickVelocity(gestureState);
        applyFlickImpulse(body, velocity, power);
        break;
      }
      case 'pool_cue': {
        const impulse = calculatePoolCueImpulse(gestureState, power);
        applyDirectionalImpulse(body, impulse);
        break;
      }
      case 'slingshot': {
        const impulse = calculateSlingshotImpulse(gestureState, power);
        applyDirectionalImpulse(body, impulse);
        break;
      }
    }

    setGestureState(endGesture(gestureState));
    setTargetBodyId(null);
    startPointRef.current = null;
    currentPointRef.current = null;
    onGestureEnd?.();
  }, [gestureState, targetBodyId, activeTool, toolPower, rigidBodies, onGestureEnd]);

  useEffect(() => {
    window.addEventListener('pointerup', handlePointerUp);
    return () => window.removeEventListener('pointerup', handlePointerUp);
  }, [handlePointerUp]);

  useFrame(() => {
    if (lineRef.current) {
      if (gestureState.isActive && startPointRef.current && currentPointRef.current) {
        const positions = lineRef.current.geometry.attributes.position;
        positions.setXYZ(0, startPointRef.current.x, startPointRef.current.y + 0.1, startPointRef.current.z);
        positions.setXYZ(1, currentPointRef.current.x, currentPointRef.current.y + 0.1, currentPointRef.current.z);
        positions.needsUpdate = true;
        lineRef.current.visible = true;
      } else {
        lineRef.current.visible = false;
      }
    }
  });

  if (!isPhysicsTool) return null;

  const lineColor = activeTool === 'flick' ? '#22d3ee' : 
                    activeTool === 'pool_cue' ? '#f59e0b' : 
                    '#ec4899';

  return (
    <>
      <mesh
        visible={false}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        position={[0, 0, 0]}
      >
        <planeGeometry args={[100, 100]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
      
      <GestureLine ref={lineRef} color={lineColor} />
    </>
  );
}
