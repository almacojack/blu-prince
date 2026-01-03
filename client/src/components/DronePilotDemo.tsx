import { useRef, useState, useEffect, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { 
  PerspectiveCamera, 
  Grid, 
  Environment, 
  Trail,
  Float,
  Text,
  Box,
  Sphere,
  Cylinder
} from "@react-three/drei";
import { Physics, RigidBody, CuboidCollider } from "@react-three/rapier";
import * as THREE from "three";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { 
  Gamepad2, 
  Camera, 
  Wind, 
  Compass, 
  Gauge, 
  BatteryMedium,
  Radio,
  Target,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  RotateCw
} from "lucide-react";

interface DroneInput {
  throttle: number;      // -1 to 1 (down/up)
  yaw: number;           // -1 to 1 (rotate left/right)  
  pitch: number;         // -1 to 1 (tilt forward/back)
  roll: number;          // -1 to 1 (tilt left/right)
}

interface DroneState {
  position: THREE.Vector3;
  rotation: THREE.Euler;
  velocity: THREE.Vector3;
  altitude: number;
  heading: number;
  speed: number;
  battery: number;
  signal: number;
}

// Drone mesh component
function Drone({ 
  inputRef, 
  onStateUpdate 
}: { 
  inputRef: React.MutableRefObject<DroneInput>;
  onStateUpdate: (state: DroneState) => void;
}) {
  const droneRef = useRef<THREE.Group>(null);
  const [rotorSpeed, setRotorSpeed] = useState(0);
  const velocity = useRef(new THREE.Vector3());
  const position = useRef(new THREE.Vector3(0, 5, 0));
  const rotation = useRef(new THREE.Euler(0, 0, 0));

  useFrame((state, delta) => {
    if (!droneRef.current) return;

    const input = inputRef.current;
    const dampening = 0.95;
    const maxSpeed = 15;
    const sensitivity = 8;

    // Apply inputs to velocity
    const forward = new THREE.Vector3(0, 0, -1).applyEuler(rotation.current);
    const right = new THREE.Vector3(1, 0, 0).applyEuler(rotation.current);
    
    // Throttle (up/down)
    velocity.current.y += input.throttle * sensitivity * delta;
    
    // Pitch (forward/back)
    velocity.current.add(forward.multiplyScalar(input.pitch * sensitivity * delta));
    
    // Roll (strafe left/right)
    velocity.current.add(right.multiplyScalar(input.roll * sensitivity * delta));
    
    // Yaw (rotation)
    rotation.current.y -= input.yaw * 2 * delta;

    // Apply dampening
    velocity.current.multiplyScalar(dampening);
    
    // Clamp velocity
    velocity.current.clampLength(0, maxSpeed);

    // Update position
    position.current.add(velocity.current.clone().multiplyScalar(delta));
    
    // Ground collision
    if (position.current.y < 0.5) {
      position.current.y = 0.5;
      velocity.current.y = Math.max(0, velocity.current.y);
    }

    // Tilt based on movement
    const tiltAmount = 0.3;
    rotation.current.x = -input.pitch * tiltAmount;
    rotation.current.z = input.roll * tiltAmount;

    // Apply to mesh
    droneRef.current.position.copy(position.current);
    droneRef.current.rotation.copy(rotation.current);

    // Update rotor speed based on throttle
    setRotorSpeed(prev => prev + (0.5 + input.throttle * 0.5) * 50 * delta);

    // Report state
    onStateUpdate({
      position: position.current.clone(),
      rotation: rotation.current.clone(),
      velocity: velocity.current.clone(),
      altitude: position.current.y,
      heading: (rotation.current.y * 180 / Math.PI) % 360,
      speed: velocity.current.length(),
      battery: 87,
      signal: 95
    });
  });

  return (
    <group ref={droneRef} position={[0, 5, 0]}>
      {/* Main body */}
      <mesh castShadow>
        <boxGeometry args={[0.8, 0.15, 0.8]} />
        <meshStandardMaterial color="#1a1a2e" metalness={0.8} roughness={0.2} />
      </mesh>
      
      {/* Camera housing */}
      <mesh position={[0, -0.1, 0.3]} castShadow>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial color="#0f0f23" metalness={0.9} roughness={0.1} />
      </mesh>
      <mesh position={[0, -0.1, 0.38]} rotation={[Math.PI/2, 0, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 0.05, 16]} />
        <meshStandardMaterial color="#00ff88" emissive="#00ff88" emissiveIntensity={0.5} />
      </mesh>

      {/* Arms and rotors */}
      {[
        [0.5, 0, 0.5],
        [-0.5, 0, 0.5],
        [0.5, 0, -0.5],
        [-0.5, 0, -0.5]
      ].map((pos, i) => (
        <group key={i} position={pos as [number, number, number]}>
          {/* Arm */}
          <mesh castShadow>
            <boxGeometry args={[0.08, 0.05, 0.5]} />
            <meshStandardMaterial color="#2a2a4e" />
          </mesh>
          {/* Motor housing */}
          <mesh position={[0, 0.05, 0]} castShadow>
            <cylinderGeometry args={[0.08, 0.08, 0.1, 16]} />
            <meshStandardMaterial color="#3a3a5e" metalness={0.7} />
          </mesh>
          {/* Rotor */}
          <mesh position={[0, 0.12, 0]} rotation={[0, rotorSpeed * (i % 2 === 0 ? 1 : -1), 0]}>
            <boxGeometry args={[0.4, 0.02, 0.05]} />
            <meshStandardMaterial color="#666" transparent opacity={0.7} />
          </mesh>
          {/* LED */}
          <pointLight 
            position={[0, -0.05, 0]} 
            color={i < 2 ? "#00ff00" : "#ff0000"} 
            intensity={0.5} 
            distance={2} 
          />
        </group>
      ))}

      {/* Landing gear */}
      {[-0.3, 0.3].map((x, i) => (
        <group key={i} position={[x, -0.15, 0]}>
          <mesh>
            <boxGeometry args={[0.03, 0.1, 0.6]} />
            <meshStandardMaterial color="#444" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// Follow camera that tracks drone
function DroneCamera({ 
  droneState, 
  cameraMode 
}: { 
  droneState: DroneState;
  cameraMode: "follow" | "fpv" | "orbit";
}) {
  const { camera } = useThree();
  const targetPos = useRef(new THREE.Vector3());
  const targetLookAt = useRef(new THREE.Vector3());

  useFrame((state, delta) => {
    const pos = droneState.position;
    
    if (cameraMode === "fpv") {
      // First person view - camera at drone position looking forward
      const forward = new THREE.Vector3(0, 0, -10).applyEuler(droneState.rotation);
      targetPos.current.set(pos.x, pos.y - 0.1, pos.z);
      targetLookAt.current.copy(pos).add(forward);
    } else if (cameraMode === "follow") {
      // Third person follow camera
      const offset = new THREE.Vector3(0, 3, 8).applyEuler(
        new THREE.Euler(0, droneState.rotation.y, 0)
      );
      targetPos.current.copy(pos).add(offset);
      targetLookAt.current.copy(pos);
    } else {
      // Orbit - fixed position looking at drone
      const time = state.clock.elapsedTime;
      targetPos.current.set(
        Math.sin(time * 0.2) * 15,
        8,
        Math.cos(time * 0.2) * 15
      );
      targetLookAt.current.copy(pos);
    }

    // Smooth camera movement
    camera.position.lerp(targetPos.current, 5 * delta);
    const currentLookAt = new THREE.Vector3();
    camera.getWorldDirection(currentLookAt);
    const targetDir = targetLookAt.current.clone().sub(camera.position).normalize();
    currentLookAt.lerp(targetDir, 5 * delta);
    camera.lookAt(camera.position.clone().add(currentLookAt));
  });

  return null;
}

// Environment objects
function World() {
  return (
    <>
      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#1a3a1a" />
      </mesh>
      
      {/* Grid overlay */}
      <Grid 
        args={[100, 100]} 
        position={[0, 0.01, 0]}
        cellSize={2}
        cellThickness={0.5}
        cellColor="#2a4a2a"
        sectionSize={10}
        sectionThickness={1}
        sectionColor="#3a6a3a"
        fadeDistance={50}
      />

      {/* Buildings */}
      {[
        { pos: [15, 5, -20], size: [6, 10, 6], color: "#2a2a4a" },
        { pos: [-20, 7.5, -15], size: [8, 15, 8], color: "#3a3a5a" },
        { pos: [25, 3, 10], size: [5, 6, 5], color: "#2a3a4a" },
        { pos: [-15, 4, 20], size: [7, 8, 7], color: "#3a4a5a" },
        { pos: [0, 2.5, -30], size: [10, 5, 4], color: "#4a4a6a" },
      ].map((building, i) => (
        <mesh key={i} position={building.pos as [number, number, number]} castShadow receiveShadow>
          <boxGeometry args={building.size as [number, number, number]} />
          <meshStandardMaterial color={building.color} />
        </mesh>
      ))}

      {/* Trees */}
      {Array.from({ length: 20 }).map((_, i) => {
        const angle = (i / 20) * Math.PI * 2;
        const radius = 25 + Math.random() * 15;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        const height = 2 + Math.random() * 3;
        return (
          <group key={i} position={[x, 0, z]}>
            <mesh position={[0, height / 2, 0]} castShadow>
              <cylinderGeometry args={[0.2, 0.3, height, 8]} />
              <meshStandardMaterial color="#4a3a2a" />
            </mesh>
            <mesh position={[0, height + 1, 0]} castShadow>
              <coneGeometry args={[1.5, 3, 8]} />
              <meshStandardMaterial color="#2a5a2a" />
            </mesh>
          </group>
        );
      })}

      {/* Landing pad */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <circleGeometry args={[3, 32]} />
        <meshStandardMaterial color="#3a3a3a" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <ringGeometry args={[2, 2.5, 32]} />
        <meshStandardMaterial color="#ffaa00" emissive="#ffaa00" emissiveIntensity={0.3} />
      </mesh>
    </>
  );
}

// HUD overlay
function DroneHUD({ state, cameraMode }: { state: DroneState; cameraMode: string }) {
  return (
    <div className="absolute inset-0 pointer-events-none p-4 font-mono text-xs">
      {/* Top bar */}
      <div className="flex justify-between items-start">
        <div className="bg-black/60 backdrop-blur rounded-lg p-3 space-y-1">
          <div className="flex items-center gap-2 text-cyan-400">
            <Gauge className="w-4 h-4" />
            <span>ALT: {state.altitude.toFixed(1)}m</span>
          </div>
          <div className="flex items-center gap-2 text-green-400">
            <Wind className="w-4 h-4" />
            <span>SPD: {(state.speed * 3.6).toFixed(1)}km/h</span>
          </div>
          <div className="flex items-center gap-2 text-amber-400">
            <Compass className="w-4 h-4" />
            <span>HDG: {((state.heading % 360) + 360).toFixed(0)}°</span>
          </div>
        </div>

        <div className="bg-black/60 backdrop-blur rounded-lg p-3 space-y-1">
          <div className="flex items-center gap-2 text-green-400">
            <BatteryMedium className="w-4 h-4" />
            <span>{state.battery}%</span>
          </div>
          <div className="flex items-center gap-2 text-cyan-400">
            <Radio className="w-4 h-4" />
            <span>{state.signal}%</span>
          </div>
          <div className="flex items-center gap-2 text-purple-400">
            <Camera className="w-4 h-4" />
            <span>{cameraMode.toUpperCase()}</span>
          </div>
        </div>
      </div>

      {/* Center crosshair */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative w-32 h-32">
          <div className="absolute top-1/2 left-0 right-0 h-px bg-cyan-500/30" />
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-cyan-500/30" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 border border-cyan-500/50 rounded-full" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-1 bg-cyan-500 rounded-full" />
        </div>
      </div>

      {/* Attitude indicator */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
        <div className="bg-black/60 backdrop-blur rounded-lg p-2">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-gray-500">PITCH</div>
              <div className="text-cyan-400">{(state.rotation.x * 180 / Math.PI).toFixed(0)}°</div>
            </div>
            <div className="text-center">
              <div className="text-gray-500">ROLL</div>
              <div className="text-cyan-400">{(state.rotation.z * 180 / Math.PI).toFixed(0)}°</div>
            </div>
            <div className="text-center">
              <div className="text-gray-500">YAW</div>
              <div className="text-cyan-400">{(state.rotation.y * 180 / Math.PI).toFixed(0)}°</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Control stick visualization
function ControlStick({ 
  x, 
  y, 
  label 
}: { 
  x: number; 
  y: number; 
  label: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="relative w-16 h-16 bg-gray-900 rounded-full border border-gray-700">
        <div 
          className="absolute w-4 h-4 bg-cyan-500 rounded-full shadow-lg shadow-cyan-500/50 transition-all duration-75"
          style={{
            left: `${50 + x * 40}%`,
            top: `${50 - y * 40}%`,
            transform: "translate(-50%, -50%)"
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-px h-full bg-gray-700" />
          <div className="absolute w-full h-px bg-gray-700" />
        </div>
      </div>
    </div>
  );
}

export function DronePilotDemo() {
  const inputRef = useRef<DroneInput>({ throttle: 0, yaw: 0, pitch: 0, roll: 0 });
  const [droneState, setDroneState] = useState<DroneState>({
    position: new THREE.Vector3(0, 5, 0),
    rotation: new THREE.Euler(),
    velocity: new THREE.Vector3(),
    altitude: 5,
    heading: 0,
    speed: 0,
    battery: 87,
    signal: 95
  });
  const [cameraMode, setCameraMode] = useState<"follow" | "fpv" | "orbit">("follow");
  const [showControls, setShowControls] = useState(true);

  // Keyboard controls
  useEffect(() => {
    const keys: Record<string, boolean> = {};

    const handleKeyDown = (e: KeyboardEvent) => {
      keys[e.key.toLowerCase()] = true;
      if (e.key === "c") {
        setCameraMode(prev => 
          prev === "follow" ? "fpv" : prev === "fpv" ? "orbit" : "follow"
        );
      }
      if (e.key === "h") {
        setShowControls(prev => !prev);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keys[e.key.toLowerCase()] = false;
    };

    const updateInput = () => {
      inputRef.current = {
        throttle: (keys["w"] ? 1 : 0) + (keys["s"] ? -1 : 0),
        yaw: (keys["a"] ? 1 : 0) + (keys["d"] ? -1 : 0),
        pitch: (keys["arrowup"] ? 1 : 0) + (keys["arrowdown"] ? -1 : 0),
        roll: (keys["arrowleft"] ? -1 : 0) + (keys["arrowright"] ? 1 : 0)
      };
    };

    const interval = setInterval(updateInput, 16);

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      clearInterval(interval);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  // Gamepad support
  useEffect(() => {
    const pollGamepad = () => {
      const gamepads = navigator.getGamepads();
      const gp = gamepads[0];
      if (gp) {
        const deadzone = 0.15;
        const applyDeadzone = (v: number) => Math.abs(v) < deadzone ? 0 : v;
        
        inputRef.current = {
          throttle: -applyDeadzone(gp.axes[1]),  // Left stick Y
          yaw: applyDeadzone(gp.axes[0]),        // Left stick X
          pitch: -applyDeadzone(gp.axes[3]),     // Right stick Y
          roll: applyDeadzone(gp.axes[2])        // Right stick X
        };

        // Camera toggle on button press
        if (gp.buttons[0]?.pressed) {
          setCameraMode(prev => 
            prev === "follow" ? "fpv" : prev === "fpv" ? "orbit" : "follow"
          );
        }
      }
    };

    const interval = setInterval(pollGamepad, 16);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full h-[600px] rounded-xl overflow-hidden border border-gray-800 bg-gray-950">
      <Canvas shadows camera={{ position: [0, 8, 15], fov: 60 }}>
        <color attach="background" args={["#0a0a1a"]} />
        <fog attach="fog" args={["#0a0a1a", 30, 80]} />
        
        <ambientLight intensity={0.3} />
        <directionalLight 
          position={[20, 30, 10]} 
          intensity={1} 
          castShadow 
          shadow-mapSize={2048}
        />

        <Drone inputRef={inputRef} onStateUpdate={setDroneState} />
        <DroneCamera droneState={droneState} cameraMode={cameraMode} />
        <World />
      </Canvas>

      <DroneHUD state={droneState} cameraMode={cameraMode} />

      {/* Control panel */}
      {showControls && (
        <div className="absolute bottom-4 right-4 bg-black/80 backdrop-blur rounded-xl p-4 pointer-events-auto">
          <div className="flex items-center gap-4 mb-3">
            <ControlStick 
              x={inputRef.current.yaw} 
              y={inputRef.current.throttle} 
              label="LEFT STICK" 
            />
            <ControlStick 
              x={inputRef.current.roll} 
              y={inputRef.current.pitch} 
              label="RIGHT STICK" 
            />
          </div>
          
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={cameraMode === "follow" ? "default" : "outline"}
              onClick={() => setCameraMode("follow")}
              className="text-xs"
            >
              Follow
            </Button>
            <Button
              size="sm"
              variant={cameraMode === "fpv" ? "default" : "outline"}
              onClick={() => setCameraMode("fpv")}
              className="text-xs"
            >
              FPV
            </Button>
            <Button
              size="sm"
              variant={cameraMode === "orbit" ? "default" : "outline"}
              onClick={() => setCameraMode("orbit")}
              className="text-xs"
            >
              Orbit
            </Button>
          </div>

          <div className="mt-3 text-[10px] text-gray-500 space-y-1">
            <div className="flex gap-4">
              <span><kbd className="bg-gray-800 px-1 rounded">W/S</kbd> Throttle</span>
              <span><kbd className="bg-gray-800 px-1 rounded">A/D</kbd> Yaw</span>
            </div>
            <div className="flex gap-4">
              <span><kbd className="bg-gray-800 px-1 rounded">↑/↓</kbd> Pitch</span>
              <span><kbd className="bg-gray-800 px-1 rounded">←/→</kbd> Roll</span>
            </div>
            <div>
              <span><kbd className="bg-gray-800 px-1 rounded">C</kbd> Camera</span>
              <span className="ml-4"><kbd className="bg-gray-800 px-1 rounded">H</kbd> Hide HUD</span>
            </div>
          </div>
        </div>
      )}

      {/* Title badge */}
      <div className="absolute top-4 left-4">
        <Badge className="bg-purple-900/80 text-purple-300 border-purple-500/50">
          <Gamepad2 className="w-3 h-3 mr-1" />
          DRONE PILOT SIMULATOR
        </Badge>
      </div>
    </div>
  );
}

// Portable state model for TUI/MicroPython
export interface DronePilotState {
  position: { x: number; y: number; z: number };
  rotation: { pitch: number; roll: number; yaw: number };
  velocity: { x: number; y: number; z: number };
  telemetry: {
    altitude: number;
    heading: number;
    speed: number;
    battery: number;
    signal: number;
  };
  input: DroneInput;
}

export function exportDroneState(state: DroneState, input: DroneInput): DronePilotState {
  return {
    position: { x: state.position.x, y: state.position.y, z: state.position.z },
    rotation: { 
      pitch: state.rotation.x * 180 / Math.PI, 
      roll: state.rotation.z * 180 / Math.PI, 
      yaw: state.rotation.y * 180 / Math.PI 
    },
    velocity: { x: state.velocity.x, y: state.velocity.y, z: state.velocity.z },
    telemetry: {
      altitude: state.altitude,
      heading: state.heading,
      speed: state.speed,
      battery: state.battery,
      signal: state.signal
    },
    input
  };
}
