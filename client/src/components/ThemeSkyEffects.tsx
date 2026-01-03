import { useRef, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface ShootingStarData {
  id: number;
  startPos: THREE.Vector3;
  direction: THREE.Vector3;
  speed: number;
  startTime: number;
  duration: number;
  brightness: number;
}

function ShootingStar({ data, clock }: { data: ShootingStarData; clock: THREE.Clock }) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame(() => {
    if (!meshRef.current) return;
    
    const elapsed = clock.getElapsedTime() - data.startTime;
    const progress = elapsed / data.duration;
    
    if (progress >= 0 && progress <= 1) {
      const pos = data.startPos.clone().add(
        data.direction.clone().multiplyScalar(progress * data.speed * data.duration)
      );
      meshRef.current.position.copy(pos);
      meshRef.current.visible = true;
      
      const fade = Math.sin(progress * Math.PI);
      const mat = meshRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = fade * data.brightness;
    } else {
      meshRef.current.visible = false;
    }
  });
  
  return (
    <mesh ref={meshRef} visible={false}>
      <sphereGeometry args={[0.03, 8, 8]} />
      <meshBasicMaterial color="#ffffff" transparent opacity={0.8} />
    </mesh>
  );
}

function StarlinkTrain({ startTime, yPos }: { startTime: number; yPos: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const satellites = 12;
  const spacing = 0.8;
  
  useFrame((state) => {
    if (!groupRef.current) return;
    
    const elapsed = state.clock.getElapsedTime() - startTime;
    if (elapsed < 0) {
      groupRef.current.visible = false;
      return;
    }
    
    groupRef.current.visible = true;
    const x = -30 + elapsed * 3;
    groupRef.current.position.x = x;
    
    if (x > 30) {
      groupRef.current.visible = false;
    }
  });
  
  return (
    <group ref={groupRef} position={[0, yPos, -40]} visible={false}>
      {Array.from({ length: satellites }).map((_, i) => (
        <mesh key={i} position={[-i * spacing, 0, 0]}>
          <sphereGeometry args={[0.02, 6, 6]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.7} />
        </mesh>
      ))}
    </group>
  );
}

function Satellite({ orbit, speed, size }: { orbit: number; speed: number; size: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const panelRef1 = useRef<THREE.Mesh>(null);
  const panelRef2 = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (!groupRef.current) return;
    
    const t = state.clock.getElapsedTime() * speed;
    groupRef.current.position.x = Math.cos(t) * orbit;
    groupRef.current.position.z = Math.sin(t) * orbit - 35;
    groupRef.current.rotation.y = t + Math.PI / 2;
  });
  
  return (
    <group ref={groupRef} position={[0, 8, -35]}>
      <mesh>
        <boxGeometry args={[size * 0.3, size * 0.3, size * 0.5]} />
        <meshStandardMaterial color="#888888" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh ref={panelRef1} position={[size * 0.5, 0, 0]}>
        <boxGeometry args={[size * 0.8, size * 0.02, size * 0.4]} />
        <meshStandardMaterial color="#1a3a5c" metalness={0.3} roughness={0.6} emissive="#0066aa" emissiveIntensity={0.2} />
      </mesh>
      <mesh ref={panelRef2} position={[-size * 0.5, 0, 0]}>
        <boxGeometry args={[size * 0.8, size * 0.02, size * 0.4]} />
        <meshStandardMaterial color="#1a3a5c" metalness={0.3} roughness={0.6} emissive="#0066aa" emissiveIntensity={0.2} />
      </mesh>
    </group>
  );
}

function Rocket({ launchTime }: { launchTime: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const flameRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (!groupRef.current || !flameRef.current) return;
    
    const elapsed = state.clock.getElapsedTime() - launchTime;
    if (elapsed < 0 || elapsed > 15) {
      groupRef.current.visible = false;
      return;
    }
    
    groupRef.current.visible = true;
    const y = -5 + elapsed * elapsed * 0.3;
    const x = Math.sin(elapsed * 0.5) * 2;
    groupRef.current.position.set(x + 15, y, -25);
    
    const flicker = 0.8 + Math.random() * 0.4;
    (flameRef.current.material as THREE.MeshBasicMaterial).opacity = flicker;
    flameRef.current.scale.y = 0.8 + Math.random() * 0.4;
  });
  
  return (
    <group ref={groupRef} visible={false}>
      <mesh>
        <cylinderGeometry args={[0.1, 0.15, 0.8, 8]} />
        <meshStandardMaterial color="#dddddd" metalness={0.9} roughness={0.2} />
      </mesh>
      <mesh position={[0, 0.5, 0]}>
        <coneGeometry args={[0.1, 0.3, 8]} />
        <meshStandardMaterial color="#cc0000" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh ref={flameRef} position={[0, -0.6, 0]}>
        <coneGeometry args={[0.12, 0.5, 8]} />
        <meshBasicMaterial color="#ff6600" transparent opacity={0.9} />
      </mesh>
      <pointLight position={[0, -0.8, 0]} color="#ff4400" intensity={3} distance={5} />
    </group>
  );
}

export function NeonSkyEffects() {
  const clockRef = useRef(new THREE.Clock());
  const [shootingStars, setShootingStars] = useState<ShootingStarData[]>([]);
  const [rocketLaunchTime, setRocketLaunchTime] = useState(5);
  const [starlinkTime, setStarlinkTime] = useState(10);
  
  useEffect(() => {
    clockRef.current.start();
    
    const scheduleShootingStar = () => {
      const delay = 2000 + Math.random() * 5000;
      setTimeout(() => {
        const newStar: ShootingStarData = {
          id: Date.now(),
          startPos: new THREE.Vector3(
            (Math.random() - 0.5) * 40,
            5 + Math.random() * 10,
            -30 - Math.random() * 20
          ),
          direction: new THREE.Vector3(
            0.5 + Math.random() * 0.5,
            -0.3 - Math.random() * 0.3,
            0
          ).normalize(),
          speed: 15 + Math.random() * 10,
          startTime: clockRef.current.getElapsedTime(),
          duration: 0.5 + Math.random() * 0.5,
          brightness: 0.5 + Math.random() * 0.5,
        };
        
        setShootingStars(prev => [...prev.slice(-10), newStar]);
        scheduleShootingStar();
      }, delay);
    };
    
    scheduleShootingStar();
    
    const rocketInterval = setInterval(() => {
      setRocketLaunchTime(clockRef.current.getElapsedTime());
    }, 25000);
    
    const starlinkInterval = setInterval(() => {
      setStarlinkTime(clockRef.current.getElapsedTime());
    }, 45000);
    
    return () => {
      clearInterval(rocketInterval);
      clearInterval(starlinkInterval);
    };
  }, []);
  
  return (
    <group>
      {shootingStars.map(star => (
        <ShootingStar key={star.id} data={star} clock={clockRef.current} />
      ))}
      
      <StarlinkTrain startTime={starlinkTime} yPos={12} />
      
      <Satellite orbit={8} speed={0.15} size={0.5} />
      <Satellite orbit={12} speed={0.1} size={0.3} />
      <Satellite orbit={6} speed={0.2} size={0.4} />
      
      <Rocket launchTime={rocketLaunchTime} />
    </group>
  );
}

function SteampunkBlimp() {
  const groupRef = useRef<THREE.Group>(null);
  const propRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (!groupRef.current) return;
    
    const t = state.clock.getElapsedTime() * 0.15;
    groupRef.current.position.x = Math.sin(t) * 15;
    groupRef.current.position.y = 6 + Math.sin(t * 2) * 0.5;
    groupRef.current.position.z = -20 + Math.cos(t) * 5;
    groupRef.current.rotation.y = Math.cos(t) * 0.3;
    
    if (propRef.current) {
      propRef.current.rotation.z += 0.3;
    }
  });
  
  return (
    <group ref={groupRef} position={[0, 6, -20]}>
      <mesh>
        <capsuleGeometry args={[1.2, 4, 16, 32]} />
        <meshStandardMaterial color="#8b4513" metalness={0.3} roughness={0.7} />
      </mesh>
      
      <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[1.3, 0.05, 8, 32]} />
        <meshStandardMaterial color="#b8860b" metalness={0.9} roughness={0.2} />
      </mesh>
      <mesh position={[0.8, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[1.25, 0.04, 8, 32]} />
        <meshStandardMaterial color="#b8860b" metalness={0.9} roughness={0.2} />
      </mesh>
      <mesh position={[-0.8, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[1.25, 0.04, 8, 32]} />
        <meshStandardMaterial color="#b8860b" metalness={0.9} roughness={0.2} />
      </mesh>
      
      <group position={[0, -1.8, 0]}>
        <mesh>
          <boxGeometry args={[1.5, 0.6, 0.8]} />
          <meshStandardMaterial color="#654321" roughness={0.8} />
        </mesh>
        
        {[-0.5, 0, 0.5].map((x, i) => (
          <mesh key={i} position={[x, 0, 0.41]}>
            <planeGeometry args={[0.25, 0.2]} />
            <meshStandardMaterial color="#f5deb3" emissive="#ffcc00" emissiveIntensity={0.3} />
          </mesh>
        ))}
        
        <mesh ref={propRef} position={[-0.9, 0, 0]}>
          <boxGeometry args={[0.05, 0.8, 0.1]} />
          <meshStandardMaterial color="#333333" metalness={0.8} />
        </mesh>
      </group>
      
      {[[-0.6, -0.8], [0.6, -0.8], [-0.6, -1.2], [0.6, -1.2]].map(([x, y], i) => (
        <mesh key={i} position={[x, y, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 1, 8]} />
          <meshStandardMaterial color="#8b4513" roughness={0.5} />
        </mesh>
      ))}
    </group>
  );
}

function Biplane({ id, startX, startY, startZ, color }: { 
  id: number; 
  startX: number; 
  startY: number; 
  startZ: number;
  color: string;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const propRef = useRef<THREE.Mesh>(null);
  const [bullets, setBullets] = useState<{ id: number; pos: THREE.Vector3; dir: THREE.Vector3; time: number }[]>([]);
  
  useFrame((state) => {
    if (!groupRef.current) return;
    
    const t = state.clock.getElapsedTime() * 0.4 + id * 2;
    const radius = 8 + id * 3;
    
    groupRef.current.position.x = startX + Math.cos(t) * radius;
    groupRef.current.position.y = startY + Math.sin(t * 1.5) * 2;
    groupRef.current.position.z = startZ + Math.sin(t) * radius;
    
    const nextT = t + 0.01;
    const nextX = startX + Math.cos(nextT) * radius;
    const nextZ = startZ + Math.sin(nextT) * radius;
    groupRef.current.rotation.y = Math.atan2(nextX - groupRef.current.position.x, nextZ - groupRef.current.position.z);
    groupRef.current.rotation.z = Math.sin(t * 2) * 0.3;
    
    if (propRef.current) {
      propRef.current.rotation.z += 0.5;
    }
    
    if (Math.random() < 0.02) {
      const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(groupRef.current.quaternion);
      setBullets(prev => [...prev.slice(-5), {
        id: Date.now(),
        pos: groupRef.current!.position.clone(),
        dir: forward,
        time: state.clock.getElapsedTime()
      }]);
    }
  });
  
  return (
    <>
      <group ref={groupRef} position={[startX, startY, startZ]} scale={0.3}>
        <mesh>
          <boxGeometry args={[0.3, 0.25, 1.5]} />
          <meshStandardMaterial color={color} roughness={0.6} />
        </mesh>
        
        <mesh position={[0, 0.4, 0]}>
          <boxGeometry args={[2.5, 0.02, 0.5]} />
          <meshStandardMaterial color="#f5deb3" roughness={0.7} />
        </mesh>
        <mesh position={[0, -0.1, 0]}>
          <boxGeometry args={[2.5, 0.02, 0.5]} />
          <meshStandardMaterial color="#f5deb3" roughness={0.7} />
        </mesh>
        
        {[[-0.8, 0.15], [0.8, 0.15]].map(([x, y], i) => (
          <mesh key={i} position={[x, y, 0]}>
            <cylinderGeometry args={[0.02, 0.02, 0.5, 8]} />
            <meshStandardMaterial color="#8b4513" roughness={0.5} />
          </mesh>
        ))}
        
        <mesh position={[0, 0.2, -1]}>
          <boxGeometry args={[0.8, 0.02, 0.3]} />
          <meshStandardMaterial color="#f5deb3" roughness={0.7} />
        </mesh>
        <mesh position={[0, 0.2, -1.1]}>
          <boxGeometry args={[0.02, 0.4, 0.2]} />
          <meshStandardMaterial color="#f5deb3" roughness={0.7} />
        </mesh>
        
        <mesh ref={propRef} position={[0, 0, 0.8]}>
          <boxGeometry args={[0.8, 0.05, 0.02]} />
          <meshStandardMaterial color="#333333" metalness={0.8} />
        </mesh>
      </group>
      
      {bullets.map(bullet => (
        <BulletTracer key={bullet.id} bullet={bullet} />
      ))}
    </>
  );
}

function BulletTracer({ bullet }: { bullet: { id: number; pos: THREE.Vector3; dir: THREE.Vector3; time: number } }) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (!meshRef.current) return;
    
    const elapsed = state.clock.getElapsedTime() - bullet.time;
    if (elapsed > 1) {
      meshRef.current.visible = false;
      return;
    }
    
    const pos = bullet.pos.clone().add(bullet.dir.clone().multiplyScalar(elapsed * 20));
    meshRef.current.position.copy(pos);
    meshRef.current.visible = true;
    
    const mat = meshRef.current.material as THREE.MeshBasicMaterial;
    mat.opacity = 1 - elapsed;
  });
  
  return (
    <mesh ref={meshRef} visible={false}>
      <sphereGeometry args={[0.02, 4, 4]} />
      <meshBasicMaterial color="#ffff00" transparent opacity={1} />
    </mesh>
  );
}

export function BrassSkyEffects() {
  return (
    <group>
      <SteampunkBlimp />
      
      <Biplane id={0} startX={-5} startY={4} startZ={-15} color="#8b0000" />
      <Biplane id={1} startX={5} startY={5} startZ={-18} color="#006400" />
      <Biplane id={2} startX={0} startY={3} startZ={-12} color="#00008b" />
      
      <ambientLight intensity={0.05} color="#b8860b" />
      <directionalLight position={[10, 20, 5]} intensity={0.3} color="#f5deb3" />
    </group>
  );
}
