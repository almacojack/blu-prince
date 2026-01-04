import { useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { 
  Float, 
  Sphere,
  RoundedBox,
  Text,
  Stars,
} from "@react-three/drei";
import { EffectComposer, Bloom, ChromaticAberration, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";
import { useLocation } from "wouter";
import { useTheme } from "@/contexts/ThemeContext";
import { NeonSkyEffects, BrassSkyEffects } from "./ThemeSkyEffects";

function CRTMonitor({ position = [0, 0, 0] as [number, number, number] }) {
  const screenRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.PointLight>(null);
  
  useFrame((state) => {
    if (screenRef.current) {
      const material = screenRef.current.material as THREE.MeshStandardMaterial;
      const flicker = 0.8 + Math.sin(state.clock.elapsedTime * 60) * 0.02;
      material.emissiveIntensity = flicker;
    }
    if (glowRef.current) {
      glowRef.current.intensity = 2 + Math.sin(state.clock.elapsedTime * 2) * 0.3;
    }
  });

  return (
    <group position={position}>
      <RoundedBox args={[3.2, 2.4, 2]} radius={0.15} smoothness={4} position={[0, 0, 0]}>
        <meshStandardMaterial color="#1a1a2e" roughness={0.3} metalness={0.8} />
      </RoundedBox>
      
      <mesh ref={screenRef} position={[0, 0, 0.95]}>
        <planeGeometry args={[2.6, 1.9]} />
        <meshStandardMaterial 
          color="#0a0a1a"
          emissive="#7c3aed"
          emissiveIntensity={0.8}
        />
      </mesh>
      
      <pointLight ref={glowRef} position={[0, 0, 2]} color="#7c3aed" intensity={2} distance={8} />
      
      <mesh position={[0, -1.5, 0.5]}>
        <boxGeometry args={[1.5, 0.3, 0.8]} />
        <meshStandardMaterial color="#2a2a4e" metalness={0.9} roughness={0.2} />
      </mesh>
      
      <mesh position={[1.2, -0.8, 0.9]}>
        <cylinderGeometry args={[0.08, 0.08, 0.1, 16]} />
        <meshStandardMaterial color="#333" metalness={0.8} />
      </mesh>
      <mesh position={[1.0, -0.8, 0.9]}>
        <cylinderGeometry args={[0.06, 0.06, 0.08, 16]} />
        <meshStandardMaterial color="#444" metalness={0.8} />
      </mesh>
    </group>
  );
}

function CartridgeShelf({ position = [4, -1, -2] as [number, number, number] }) {
  const cartridgeColors = ["#ef4444", "#3b82f6", "#22c55e", "#f59e0b", "#8b5cf6", "#ec4899"];
  
  return (
    <group position={position} rotation={[0, -0.3, 0]}>
      <RoundedBox args={[2.5, 0.15, 0.8]} radius={0.02} position={[0, 0, 0]}>
        <meshStandardMaterial color="#3d2817" roughness={0.8} />
      </RoundedBox>
      <RoundedBox args={[2.5, 0.15, 0.8]} radius={0.02} position={[0, 1, 0]}>
        <meshStandardMaterial color="#3d2817" roughness={0.8} />
      </RoundedBox>
      <RoundedBox args={[0.1, 1.15, 0.8]} radius={0.02} position={[-1.2, 0.5, 0]}>
        <meshStandardMaterial color="#3d2817" roughness={0.8} />
      </RoundedBox>
      <RoundedBox args={[0.1, 1.15, 0.8]} radius={0.02} position={[1.2, 0.5, 0]}>
        <meshStandardMaterial color="#3d2817" roughness={0.8} />
      </RoundedBox>
      
      {cartridgeColors.map((color, i) => (
        <Float key={i} speed={1 + i * 0.2} rotationIntensity={0.1} floatIntensity={0.1}>
          <group position={[-0.9 + i * 0.35, 0.25, 0]}>
            <RoundedBox args={[0.25, 0.4, 0.15]} radius={0.02}>
              <meshStandardMaterial 
                color={color} 
                emissive={color}
                emissiveIntensity={0.2}
                roughness={0.3}
                metalness={0.5}
              />
            </RoundedBox>
            <mesh position={[0, 0, 0.08]}>
              <planeGeometry args={[0.18, 0.12]} />
              <meshStandardMaterial color="#1a1a1a" />
            </mesh>
          </group>
        </Float>
      ))}
    </group>
  );
}

function NeonSign({ text = "tingOS", position = [-4, 2.5, -3] as [number, number, number] }) {
  const lightRef = useRef<THREE.PointLight>(null);
  
  useFrame((state) => {
    if (lightRef.current) {
      const flicker = Math.random() > 0.98 ? 0.5 : 1;
      lightRef.current.intensity = (3 + Math.sin(state.clock.elapsedTime * 3) * 0.5) * flicker;
    }
  });

  return (
    <group position={position} rotation={[0, 0.4, 0]}>
      <Text
        fontSize={0.5}
        color="#ff00ff"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="#ff00ff"
      >
        {text}
        <meshStandardMaterial 
          color="#ff00ff"
          emissive="#ff00ff"
          emissiveIntensity={2}
        />
      </Text>
      <pointLight ref={lightRef} position={[1, 0, 1]} color="#ff00ff" intensity={3} distance={6} />
    </group>
  );
}

function Room({ isCyberpunk = true }: { isCyberpunk?: boolean }) {
  const floorColor = isCyberpunk ? "#1a1a2e" : "#2a2218";
  const wallColor = isCyberpunk ? "#0f0f23" : "#1e1a12";
  const sideColor = isCyberpunk ? "#12122e" : "#241f15";
  
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.5, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color={floorColor} roughness={0.9} />
      </mesh>
      
      <mesh position={[0, 2, -5]} receiveShadow>
        <planeGeometry args={[20, 10]} />
        <meshStandardMaterial color={wallColor} roughness={0.95} />
      </mesh>
      
      <mesh rotation={[0, Math.PI / 2, 0]} position={[-8, 2, 0]}>
        <planeGeometry args={[15, 10]} />
        <meshStandardMaterial color={sideColor} roughness={0.95} />
      </mesh>
      
      <mesh rotation={[0, -Math.PI / 2, 0]} position={[8, 2, 0]}>
        <planeGeometry args={[15, 10]} />
        <meshStandardMaterial color={sideColor} roughness={0.95} />
      </mesh>
    </group>
  );
}

function NeonGrid() {
  const gridRef = useRef<THREE.GridHelper>(null);
  
  useFrame((state) => {
    if (gridRef.current) {
      gridRef.current.position.z = (state.clock.elapsedTime * 0.5) % 1;
    }
  });

  return (
    <group position={[0, -2.49, 0]}>
      <gridHelper 
        ref={gridRef}
        args={[40, 40, "#7c3aed", "#3b0764"]} 
      />
    </group>
  );
}

function Beanbag({ position = [-2, -2, 2] as [number, number, number] }) {
  return (
    <group position={position}>
      <Sphere args={[0.8, 32, 32]} scale={[1, 0.6, 1]}>
        <meshStandardMaterial color="#4a1d96" roughness={0.9} />
      </Sphere>
    </group>
  );
}

function AtariConsole({ position = [0, -2.2, 1] as [number, number, number] }) {
  return (
    <group position={position}>
      <RoundedBox args={[1.2, 0.15, 0.5]} radius={0.02}>
        <meshStandardMaterial color="#2d2d2d" metalness={0.3} roughness={0.7} />
      </RoundedBox>
      
      <mesh position={[0.3, 0.08, 0]}>
        <boxGeometry args={[0.5, 0.02, 0.3]} />
        <meshStandardMaterial color="#8b4513" />
      </mesh>
      
      <mesh position={[-0.4, 0.1, 0]}>
        <boxGeometry args={[0.15, 0.05, 0.1]} />
        <meshStandardMaterial color="#333" />
      </mesh>
      
      <mesh position={[0.15, 0.12, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.08, 8]} />
        <meshStandardMaterial color="#111" />
      </mesh>
    </group>
  );
}

function FloatingParticles() {
  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < 50; i++) {
      temp.push({
        position: [
          (Math.random() - 0.5) * 15,
          Math.random() * 6 - 2,
          (Math.random() - 0.5) * 10,
        ] as [number, number, number],
        scale: Math.random() * 0.03 + 0.01,
      });
    }
    return temp;
  }, []);

  return (
    <>
      {particles.map((p, i) => (
        <Float key={i} speed={0.5 + Math.random()} floatIntensity={0.5}>
          <Sphere args={[p.scale, 8, 8]} position={p.position}>
            <meshBasicMaterial color="#7c3aed" transparent opacity={0.6} />
          </Sphere>
        </Float>
      ))}
    </>
  );
}

function SceneContent({ themeVariant }: { themeVariant: 'cyberpunk' | 'victorian' }) {
  const { camera } = useThree();
  const [location] = useLocation();
  
  useFrame((state) => {
    const targetY = 0.5 + Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetY, 0.02);
    
    const lookOffset = Math.sin(state.clock.elapsedTime * 0.2) * 0.05;
    camera.lookAt(lookOffset, 0, -2);
  });

  const isCyberpunk = themeVariant === 'cyberpunk';
  const bgColor = isCyberpunk ? "#050510" : "#1a1510";

  return (
    <>
      <color attach="background" args={[bgColor]} />
      <fog attach="fog" args={[bgColor, 5, 25]} />
      
      <ambientLight intensity={0.1} />
      {isCyberpunk ? (
        <>
          <pointLight position={[0, 5, 5]} color="#7c3aed" intensity={0.5} />
          <pointLight position={[-5, 3, -2]} color="#ec4899" intensity={0.3} />
          <pointLight position={[5, 3, -2]} color="#3b82f6" intensity={0.3} />
        </>
      ) : (
        <>
          <pointLight position={[0, 5, 5]} color="#b8860b" intensity={0.4} />
          <pointLight position={[-5, 3, -2]} color="#daa520" intensity={0.2} />
          <pointLight position={[5, 3, -2]} color="#8b4513" intensity={0.2} />
        </>
      )}
      
      <Room isCyberpunk={isCyberpunk} />
      {isCyberpunk && (
        <>
          <NeonGrid />
          <CRTMonitor position={[0, 0, -2]} />
          <CartridgeShelf position={[4, -1, -2]} />
          <Beanbag position={[-2.5, -2, 1]} />
          <AtariConsole position={[0, -2.2, 0.5]} />
          <FloatingParticles />
        </>
      )}
      <Stars radius={50} depth={50} count={isCyberpunk ? 1000 : 300} factor={2} fade speed={0.5} />
      
      {isCyberpunk ? <NeonSkyEffects /> : <BrassSkyEffects />}
      
      <EffectComposer>
        <Bloom 
          intensity={isCyberpunk ? 0.8 : 0.4}
          luminanceThreshold={0.2}
          luminanceSmoothing={0.9}
        />
        <ChromaticAberration offset={isCyberpunk ? [0.001, 0.001] : [0.0003, 0.0003]} />
        <Vignette eskil={false} offset={0.1} darkness={isCyberpunk ? 0.8 : 0.6} />
      </EffectComposer>
    </>
  );
}

function BackgroundStageInner({ themeVariant }: { themeVariant: 'cyberpunk' | 'victorian' }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    return () => {
      if (canvasRef.current) {
        const gl = canvasRef.current.getContext('webgl2') || canvasRef.current.getContext('webgl');
        if (gl) {
          const ext = gl.getExtension('WEBGL_lose_context');
          if (ext) ext.loseContext();
        }
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 z-0" data-testid="background-stage">
      <Canvas
        ref={canvasRef}
        camera={{ 
          position: [0, 0.5, 6], 
          fov: 60,
          near: 0.1,
          far: 100 
        }}
        gl={{ 
          antialias: true,
          alpha: false,
          powerPreference: "high-performance",
          failIfMajorPerformanceCaveat: false
        }}
        dpr={[1, 1.5]}
        onCreated={({ gl }) => {
          gl.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        }}
        frameloop="demand"
      >
        <SceneContent themeVariant={themeVariant} />
      </Canvas>
    </div>
  );
}

export function BackgroundStage() {
  const { themeVariant } = useTheme();
  return <BackgroundStageInner themeVariant={themeVariant} />;
}

export default BackgroundStage;
