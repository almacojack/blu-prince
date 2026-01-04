import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Text, RoundedBox } from "@react-three/drei";
import * as THREE from "three";

interface Cartridge3DProps {
  title: string;
  author?: string;
  color?: string;
  labelColor?: string;
  selected?: boolean;
  onClick?: () => void;
  position?: [number, number, number];
  rotation?: [number, number, number];
}

const CART_WIDTH = 2.4;
const CART_HEIGHT = 3.2;
const CART_DEPTH = 0.5;
const GROOVE_DEPTH = 0.02;
const GROOVE_COUNT = 8;
const LABEL_INSET = 0.01;

export function Cartridge3D({
  title,
  author = "Unknown",
  color = "#1a1a2e",
  labelColor = "#f8f8f8",
  selected = false,
  onClick,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
}: Cartridge3DProps) {
  const groupRef = useRef<THREE.Group>(null);
  const hoverRef = useRef(false);

  const plasticMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: color,
    roughness: 0.4,
    metalness: 0.05,
    envMapIntensity: 0.3,
  }), [color]);

  const glossyMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: color,
    roughness: 0.15,
    metalness: 0.1,
    envMapIntensity: 0.5,
  }), [color]);

  const labelMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: labelColor,
    roughness: 0.7,
    metalness: 0,
  }), [labelColor]);

  const connectorMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: "#2a2a2a",
    roughness: 0.8,
    metalness: 0.3,
  }), []);

  const goldPinMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: "#d4af37",
    roughness: 0.3,
    metalness: 0.8,
  }), []);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const targetScale = hoverRef.current || selected ? 1.05 : 1;
    groupRef.current.scale.lerp(
      new THREE.Vector3(targetScale, targetScale, targetScale),
      delta * 8
    );
  });

  const grooves = useMemo(() => {
    const items = [];
    const grooveSpacing = (CART_HEIGHT - 1) / GROOVE_COUNT;
    for (let i = 0; i < GROOVE_COUNT; i++) {
      const y = -CART_HEIGHT / 2 + 0.6 + i * grooveSpacing;
      items.push(
        <mesh
          key={`groove-left-${i}`}
          position={[-CART_WIDTH / 2 + GROOVE_DEPTH / 2, y, 0]}
          rotation={[0, 0, Math.PI / 2]}
        >
          <boxGeometry args={[0.04, GROOVE_DEPTH, CART_DEPTH - 0.1]} />
          <meshStandardMaterial color="#0a0a15" roughness={0.9} />
        </mesh>
      );
      items.push(
        <mesh
          key={`groove-right-${i}`}
          position={[CART_WIDTH / 2 - GROOVE_DEPTH / 2, y, 0]}
          rotation={[0, 0, Math.PI / 2]}
        >
          <boxGeometry args={[0.04, GROOVE_DEPTH, CART_DEPTH - 0.1]} />
          <meshStandardMaterial color="#0a0a15" roughness={0.9} />
        </mesh>
      );
    }
    return items;
  }, []);

  const connectorPins = useMemo(() => {
    const pins = [];
    const pinCount = 12;
    const pinSpacing = (CART_WIDTH - 0.6) / pinCount;
    for (let i = 0; i < pinCount; i++) {
      const x = -CART_WIDTH / 2 + 0.4 + i * pinSpacing;
      pins.push(
        <mesh
          key={`pin-${i}`}
          position={[x, -CART_HEIGHT / 2 - 0.25, 0]}
        >
          <boxGeometry args={[0.08, 0.3, 0.02]} />
          <primitive object={goldPinMaterial} attach="material" />
        </mesh>
      );
    }
    return pins;
  }, [goldPinMaterial]);

  return (
    <group
      ref={groupRef}
      position={position}
      rotation={rotation}
      onClick={onClick}
      onPointerEnter={() => { hoverRef.current = true; }}
      onPointerLeave={() => { hoverRef.current = false; }}
    >
      <RoundedBox
        args={[CART_WIDTH, CART_HEIGHT, CART_DEPTH]}
        radius={0.08}
        smoothness={4}
        castShadow
        receiveShadow
      >
        <primitive object={plasticMaterial} attach="material" />
      </RoundedBox>

      <RoundedBox
        args={[CART_WIDTH - 0.1, 0.4, CART_DEPTH + 0.02]}
        position={[0, CART_HEIGHT / 2 - 0.15, 0]}
        radius={0.04}
        smoothness={2}
      >
        <primitive object={glossyMaterial} attach="material" />
      </RoundedBox>

      {grooves}

      <RoundedBox
        args={[CART_WIDTH - 0.3, CART_HEIGHT * 0.55, LABEL_INSET]}
        position={[0, 0.3, CART_DEPTH / 2 + LABEL_INSET / 2]}
        radius={0.02}
        smoothness={2}
      >
        <primitive object={labelMaterial} attach="material" />
      </RoundedBox>

      <Text
        position={[0, 0.5, CART_DEPTH / 2 + LABEL_INSET + 0.01]}
        fontSize={0.22}
        color="#1a1a2e"
        anchorX="center"
        anchorY="middle"
        maxWidth={CART_WIDTH - 0.5}
        textAlign="center"
        font="/fonts/Inter-Bold.woff"
      >
        {title}
      </Text>

      <Text
        position={[0, 0.1, CART_DEPTH / 2 + LABEL_INSET + 0.01]}
        fontSize={0.12}
        color="#555"
        anchorX="center"
        anchorY="middle"
        maxWidth={CART_WIDTH - 0.5}
        textAlign="center"
      >
        {author}
      </Text>

      <mesh
        position={[0, -CART_HEIGHT / 2 - 0.15, 0]}
      >
        <boxGeometry args={[CART_WIDTH - 0.2, 0.35, CART_DEPTH - 0.08]} />
        <primitive object={connectorMaterial} attach="material" />
      </mesh>

      {connectorPins}

      <mesh
        position={[0, -CART_HEIGHT / 2 - 0.35, 0]}
      >
        <boxGeometry args={[CART_WIDTH - 0.4, 0.08, CART_DEPTH - 0.15]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
      </mesh>

      {selected && (
        <pointLight
          position={[0, 0, 1.5]}
          intensity={0.5}
          color="#00ffff"
          distance={3}
        />
      )}

      <mesh
        position={[CART_WIDTH / 2 - 0.25, CART_HEIGHT / 2 - 0.5, CART_DEPTH / 2 + 0.01]}
      >
        <circleGeometry args={[0.08, 16]} />
        <meshStandardMaterial
          color={selected ? "#00ff88" : "#444"}
          emissive={selected ? "#00ff44" : "#000"}
          emissiveIntensity={selected ? 0.5 : 0}
          roughness={0.3}
        />
      </mesh>
    </group>
  );
}

export default Cartridge3D;
