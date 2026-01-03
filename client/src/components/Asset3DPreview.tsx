import { useRef, useEffect, useState, Suspense } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Center, Environment, Grid } from '@react-three/drei';
import * as THREE from 'three';
import { loadAsset } from '@/lib/asset-loader';
import type { Toss3DAsset } from '@/lib/toss';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, Box, RotateCw } from 'lucide-react';

interface Asset3DPreviewProps {
  asset: Toss3DAsset | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExportSTL?: (asset: Toss3DAsset) => void;
}

function LoadedModel({ asset }: { asset: Toss3DAsset }) {
  const [object, setObject] = useState<THREE.Object3D | null>(null);
  const [error, setError] = useState<string | null>(null);
  const groupRef = useRef<THREE.Group>(null);
  
  useEffect(() => {
    let mounted = true;
    
    loadAsset(asset).then((result) => {
      if (!mounted) return;
      if (result.success && result.object3D) {
        setObject(result.object3D);
        setError(null);
      } else {
        setError(result.error || 'Failed to load model');
      }
    });
    
    return () => {
      mounted = false;
    };
  }, [asset.id]);
  
  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.2;
    }
  });
  
  if (error) {
    return (
      <mesh>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="red" wireframe />
      </mesh>
    );
  }
  
  if (!object) {
    return (
      <mesh>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#7c3aed" wireframe />
      </mesh>
    );
  }
  
  return (
    <Center>
      <group ref={groupRef}>
        <primitive object={object} />
      </group>
    </Center>
  );
}

function SceneSetup() {
  const { camera } = useThree();
  
  useEffect(() => {
    camera.position.set(3, 2, 5);
    camera.lookAt(0, 0, 0);
  }, [camera]);
  
  return null;
}

export function Asset3DPreview({ asset, open, onOpenChange, onExportSTL }: Asset3DPreviewProps) {
  if (!asset) return null;
  
  const { metadata } = asset;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] bg-[#111] border-white/20 flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-4 pb-2 border-b border-white/10">
          <DialogTitle className="flex items-center gap-3">
            <Box className="w-5 h-5 text-cyan-400" />
            {metadata.name}
          </DialogTitle>
          <DialogDescription className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="text-[10px] border-purple-500/50 text-purple-400 bg-purple-500/10">
              {metadata.format.toUpperCase()}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {metadata.vertexCount?.toLocaleString()} vertices
            </span>
            <span className="text-xs text-muted-foreground">
              {metadata.faceCount?.toLocaleString()} faces
            </span>
            <span className="text-xs text-muted-foreground">
              {(metadata.fileSize / 1024).toFixed(1)} KB
            </span>
            {metadata.printable && (
              <Badge variant="outline" className="text-[10px] border-green-500/50 text-green-400 bg-green-500/10">
                3D Printable
              </Badge>
            )}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 relative bg-gradient-to-b from-[#0a0a12] to-[#0d0d15]">
          <Canvas shadows camera={{ fov: 50 }}>
            <SceneSetup />
            <ambientLight intensity={0.5} />
            <directionalLight position={[5, 10, 5]} intensity={1} castShadow />
            <pointLight position={[-5, 5, -5]} intensity={0.5} color="#7c3aed" />
            
            <Suspense fallback={null}>
              <LoadedModel asset={asset} />
            </Suspense>
            
            <Grid 
              args={[10, 10]} 
              position={[0, -1, 0]} 
              cellSize={0.5} 
              cellThickness={0.5}
              cellColor="#333"
              sectionSize={2}
              sectionThickness={1}
              sectionColor="#555"
              fadeDistance={20}
            />
            
            <OrbitControls 
              enablePan 
              enableZoom 
              enableRotate
              autoRotate={false}
              minDistance={1}
              maxDistance={20}
            />
          </Canvas>
          
          <div className="absolute bottom-4 left-4 flex gap-2">
            <Badge variant="outline" className="text-[10px] bg-black/50 backdrop-blur border-white/20">
              <RotateCw className="w-3 h-3 mr-1 animate-spin" style={{ animationDuration: '3s' }} />
              Drag to rotate
            </Badge>
          </div>
        </div>
        
        {metadata.printable && (
          <div className="p-4 border-t border-white/10 bg-black/30">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="text-xs font-mono text-muted-foreground">3D PRINTING INFO</div>
                <div className="flex gap-4 text-xs">
                  <span>
                    <span className="text-muted-foreground">Volume:</span>{' '}
                    <span className="text-white font-mono">
                      {(metadata.printable.volume_mm3 || 0).toFixed(2)} mm&sup3;
                    </span>
                  </span>
                  <span>
                    <span className="text-muted-foreground">Surface:</span>{' '}
                    <span className="text-white font-mono">
                      {(metadata.printable.surfaceArea_mm2 || 0).toFixed(2)} mm&sup2;
                    </span>
                  </span>
                  <span>
                    <span className="text-muted-foreground">Watertight:</span>{' '}
                    <span className={metadata.printable.watertight ? 'text-green-400' : 'text-yellow-400'}>
                      {metadata.printable.watertight ? 'Yes' : 'No'}
                    </span>
                  </span>
                </div>
              </div>
              
              {onExportSTL && (
                <Button 
                  variant="outline" 
                  size="sm"
                  className="gap-2 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
                  onClick={() => onExportSTL(asset)}
                  data-testid="button-export-stl"
                >
                  <Download className="w-4 h-4" />
                  Export STL
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
