import React, { useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Box, 
  Circle, 
  Cylinder, 
  Triangle, 
  Minus, 
  Plus,
  RotateCcw,
  Move,
  Maximize,
  FlipHorizontal,
  Code,
  BookOpen,
  Palette,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';

const OPENSCAD_YELLOW = '#f9d71c';

interface DocSection {
  title: string;
  icon: React.ReactNode;
  items: DocItem[];
}

interface DocItem {
  name: string;
  syntax: string;
  description: string;
  example: string;
  preview?: 'cube' | 'sphere' | 'cylinder' | 'cone' | 'difference' | 'union';
}

const DOCS: DocSection[] = [
  {
    title: 'Primitives',
    icon: <Box className="w-4 h-4" />,
    items: [
      {
        name: 'cube',
        syntax: 'cube(size, center=false)',
        description: 'Creates a cube or rectangular box. Size can be a single number or [x, y, z] array.',
        example: `cube([20, 15, 10]);
cube(10, center=true);`,
        preview: 'cube',
      },
      {
        name: 'sphere',
        syntax: 'sphere(r) or sphere(d=diameter)',
        description: 'Creates a sphere. Use $fn to control smoothness.',
        example: `sphere(r=10);
sphere(d=20, $fn=64);`,
        preview: 'sphere',
      },
      {
        name: 'cylinder',
        syntax: 'cylinder(h, r, center=false)',
        description: 'Creates a cylinder or cone. Use r1/r2 for different radii.',
        example: `cylinder(h=20, r=10);
cylinder(h=20, r1=15, r2=5);`,
        preview: 'cylinder',
      },
      {
        name: 'cone',
        syntax: 'cone(h, r)',
        description: 'Creates a cone (cylinder with r2=0).',
        example: `cone(h=20, r=10);`,
        preview: 'cone',
      },
      {
        name: 'polyhedron',
        syntax: 'polyhedron(points, faces)',
        description: 'Creates a custom solid from vertices and face definitions.',
        example: `polyhedron(
  points=[
    [0,0,0], [10,0,0],
    [10,10,0], [0,10,0],
    [5,5,10]
  ],
  faces=[
    [0,1,2,3],
    [0,1,4], [1,2,4],
    [2,3,4], [3,0,4]
  ]
);`,
      },
    ],
  },
  {
    title: 'Transforms',
    icon: <Move className="w-4 h-4" />,
    items: [
      {
        name: 'translate',
        syntax: 'translate([x, y, z])',
        description: 'Moves children by the specified offset.',
        example: `translate([10, 0, 5])
  cube(5);`,
      },
      {
        name: 'rotate',
        syntax: 'rotate([x, y, z]) or rotate(a, v=[x,y,z])',
        description: 'Rotates children. Angles in degrees.',
        example: `rotate([45, 0, 0])
  cube(10);
rotate(45, v=[0, 0, 1])
  cube(10);`,
      },
      {
        name: 'scale',
        syntax: 'scale([x, y, z])',
        description: 'Scales children by the specified factors.',
        example: `scale([2, 1, 0.5])
  sphere(10);`,
      },
      {
        name: 'mirror',
        syntax: 'mirror([x, y, z])',
        description: 'Mirrors children across a plane defined by the normal vector.',
        example: `mirror([1, 0, 0])
  translate([10, 0, 0])
    cube(5);`,
      },
      {
        name: 'color',
        syntax: 'color("name") or color([r,g,b,a])',
        description: 'Sets the color of children (visual only).',
        example: `color("red")
  cube(10);
color([0.2, 0.5, 1.0])
  sphere(5);`,
      },
    ],
  },
  {
    title: 'CSG Operations',
    icon: <Minus className="w-4 h-4" />,
    items: [
      {
        name: 'union',
        syntax: 'union() { ... }',
        description: 'Combines multiple shapes into one. Default behavior when shapes are siblings.',
        example: `union() {
  cube(10);
  translate([5, 5, 5])
    sphere(8);
}`,
        preview: 'union',
      },
      {
        name: 'difference',
        syntax: 'difference() { ... }',
        description: 'Subtracts all subsequent shapes from the first shape. The key to making holes!',
        example: `difference() {
  cube(20, center=true);
  sphere(12);
}`,
        preview: 'difference',
      },
      {
        name: 'intersection',
        syntax: 'intersection() { ... }',
        description: 'Keeps only the volume where all shapes overlap.',
        example: `intersection() {
  cube(15, center=true);
  sphere(10);
}`,
      },
      {
        name: 'hull',
        syntax: 'hull() { ... }',
        description: 'Creates the convex hull of all children. Great for rounded shapes.',
        example: `hull() {
  translate([0, 0, 0])
    sphere(5);
  translate([20, 0, 0])
    sphere(5);
}`,
      },
    ],
  },
  {
    title: 'Control Flow',
    icon: <Code className="w-4 h-4" />,
    items: [
      {
        name: 'for',
        syntax: 'for (var = range) { ... }',
        description: 'Repeats children for each value in range. Range: [start:end] or [start:step:end].',
        example: `for (i = [0:5])
  translate([i * 10, 0, 0])
    cube(5);

for (angle = [0:45:315])
  rotate([0, 0, angle])
    translate([20, 0, 0])
      sphere(3);`,
      },
      {
        name: 'if',
        syntax: 'if (condition) { ... } else { ... }',
        description: 'Conditional geometry generation.',
        example: `size = 10;
if (size > 5) {
  cube(size);
} else {
  sphere(size);
}`,
      },
      {
        name: 'let',
        syntax: 'let (var = value, ...) { ... }',
        description: 'Creates local variable bindings.',
        example: `let (r = 5, h = 20)
  cylinder(h=h, r=r);`,
      },
    ],
  },
  {
    title: 'Modules & Functions',
    icon: <Sparkles className="w-4 h-4" />,
    items: [
      {
        name: 'module',
        syntax: 'module name(params) { ... }',
        description: 'Defines a reusable component. Call with name(args).',
        example: `module rounded_box(size, r) {
  hull() {
    for (x=[-1,1], y=[-1,1])
      translate([x*(size[0]/2-r),
                 y*(size[1]/2-r), 0])
        cylinder(h=size[2], r=r);
  }
}

rounded_box([30, 20, 10], 3);`,
      },
      {
        name: 'function',
        syntax: 'function name(params) = expression;',
        description: 'Defines a reusable calculation.',
        example: `function inch(x) = x * 25.4;
function circumference(r) = 2 * PI * r;

cube([inch(1), inch(2), inch(0.5)]);`,
      },
    ],
  },
  {
    title: 'Special Variables',
    icon: <Palette className="w-4 h-4" />,
    items: [
      {
        name: '$fn',
        syntax: '$fn = number',
        description: 'Number of fragments for circles/spheres. Higher = smoother.',
        example: `$fn = 64;
sphere(10);  // Smooth sphere

$fn = 6;
cylinder(h=5, r=10);  // Hexagon`,
      },
      {
        name: '$fa / $fs',
        syntax: '$fa = angle; $fs = size;',
        description: '$fa = minimum angle, $fs = minimum size. Alternative to $fn.',
        example: `$fa = 5;   // 5 degree segments
$fs = 0.5; // 0.5mm minimum
sphere(20);`,
      },
    ],
  },
];

function MiniPreview({ type }: { type: string }) {
  return (
    <div className="w-20 h-20 rounded-lg overflow-hidden bg-black/50 border border-yellow-500/30">
      <Canvas camera={{ position: [2.5, 2, 2.5], fov: 45 }}>
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} />
        <Suspense fallback={null}>
          <PreviewShape type={type} />
        </Suspense>
        <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={4} />
      </Canvas>
    </div>
  );
}

function PreviewShape({ type }: { type: string }) {
  const material = <meshStandardMaterial color={OPENSCAD_YELLOW} roughness={0.3} metalness={0.1} />;

  switch (type) {
    case 'cube':
      return (
        <mesh>
          <boxGeometry args={[1, 1, 1]} />
          {material}
        </mesh>
      );
    case 'sphere':
      return (
        <mesh>
          <sphereGeometry args={[0.6, 32, 16]} />
          {material}
        </mesh>
      );
    case 'cylinder':
      return (
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.4, 0.4, 1, 32]} />
          {material}
        </mesh>
      );
    case 'cone':
      return (
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.5, 1, 32]} />
          {material}
        </mesh>
      );
    case 'difference':
      return (
        <group>
          <mesh>
            <boxGeometry args={[1, 1, 1]} />
            {material}
          </mesh>
          <mesh>
            <sphereGeometry args={[0.7, 16, 16]} />
            <meshStandardMaterial color="#ff4444" transparent opacity={0.5} />
          </mesh>
        </group>
      );
    case 'union':
      return (
        <group>
          <mesh position={[-0.3, 0, 0]}>
            <boxGeometry args={[0.7, 0.7, 0.7]} />
            {material}
          </mesh>
          <mesh position={[0.3, 0.2, 0.2]}>
            <sphereGeometry args={[0.4, 16, 16]} />
            {material}
          </mesh>
        </group>
      );
    default:
      return null;
  }
}

function CodeBlock({ code }: { code: string }) {
  return (
    <pre className="bg-black/60 border border-white/10 rounded-lg p-3 text-[11px] font-mono overflow-x-auto">
      <code className="text-green-400">{code}</code>
    </pre>
  );
}

export function OpenSCADDocsPanel() {
  const [activeTab, setActiveTab] = useState('primitives');

  return (
    <div className="h-full flex flex-col bg-black/80 backdrop-blur-sm">
      <div className="p-3 border-b border-white/10">
        <div className="flex items-center gap-2 mb-2">
          <BookOpen className="w-5 h-5 text-yellow-400" />
          <h2 className="font-bold text-lg">OpenSCAD Reference</h2>
          <Badge variant="outline" className="text-[9px] text-yellow-400 border-yellow-400/50">
            Subset
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          Supported operations in the Blu-Prince OpenSCAD interpreter
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="grid grid-cols-3 m-2 h-auto">
          <TabsTrigger value="primitives" className="text-[10px] py-1">
            <Box className="w-3 h-3 mr-1" />
            Shapes
          </TabsTrigger>
          <TabsTrigger value="transforms" className="text-[10px] py-1">
            <Move className="w-3 h-3 mr-1" />
            Transform
          </TabsTrigger>
          <TabsTrigger value="csg" className="text-[10px] py-1">
            <Minus className="w-3 h-3 mr-1" />
            CSG
          </TabsTrigger>
        </TabsList>
        <TabsList className="grid grid-cols-3 mx-2 mb-2 h-auto">
          <TabsTrigger value="control" className="text-[10px] py-1">
            <Code className="w-3 h-3 mr-1" />
            Control
          </TabsTrigger>
          <TabsTrigger value="modules" className="text-[10px] py-1">
            <Sparkles className="w-3 h-3 mr-1" />
            Modules
          </TabsTrigger>
          <TabsTrigger value="special" className="text-[10px] py-1">
            <Palette className="w-3 h-3 mr-1" />
            Special
          </TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1">
          <TabsContent value="primitives" className="m-0 p-2 space-y-4">
            {DOCS[0].items.map(item => (
              <DocItemCard key={item.name} item={item} />
            ))}
          </TabsContent>
          <TabsContent value="transforms" className="m-0 p-2 space-y-4">
            {DOCS[1].items.map(item => (
              <DocItemCard key={item.name} item={item} />
            ))}
          </TabsContent>
          <TabsContent value="csg" className="m-0 p-2 space-y-4">
            {DOCS[2].items.map(item => (
              <DocItemCard key={item.name} item={item} />
            ))}
          </TabsContent>
          <TabsContent value="control" className="m-0 p-2 space-y-4">
            {DOCS[3].items.map(item => (
              <DocItemCard key={item.name} item={item} />
            ))}
          </TabsContent>
          <TabsContent value="modules" className="m-0 p-2 space-y-4">
            {DOCS[4].items.map(item => (
              <DocItemCard key={item.name} item={item} />
            ))}
          </TabsContent>
          <TabsContent value="special" className="m-0 p-2 space-y-4">
            {DOCS[5].items.map(item => (
              <DocItemCard key={item.name} item={item} />
            ))}
          </TabsContent>
        </ScrollArea>
      </Tabs>

      <div className="p-2 border-t border-white/10 bg-yellow-500/5">
        <div className="flex items-center gap-2 text-[10px] text-yellow-400/80">
          <Sparkles className="w-3 h-3" />
          <span>Tip: Use $fn=32 or higher for smooth curves</span>
        </div>
      </div>
    </div>
  );
}

function DocItemCard({ item }: { item: DocItem }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/40 overflow-hidden">
      <div className="p-3 border-b border-white/5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <h3 className="font-mono font-bold text-yellow-400">{item.name}</h3>
            <code className="text-[10px] text-cyan-400 block mt-1">{item.syntax}</code>
          </div>
          {item.preview && <MiniPreview type={item.preview} />}
        </div>
        <p className="text-xs text-muted-foreground mt-2">{item.description}</p>
      </div>
      <div className="p-2 bg-black/30">
        <CodeBlock code={item.example} />
      </div>
    </div>
  );
}

export function OpenSCADQuickRef() {
  return (
    <div className="p-2 space-y-2 text-[10px]">
      <div className="font-bold text-yellow-400 flex items-center gap-1">
        <BookOpen className="w-3 h-3" /> Quick Reference
      </div>
      <div className="grid grid-cols-2 gap-1">
        <div className="bg-black/30 rounded p-1">
          <span className="text-cyan-400">cube</span>
          <span className="text-muted-foreground">([x,y,z])</span>
        </div>
        <div className="bg-black/30 rounded p-1">
          <span className="text-cyan-400">sphere</span>
          <span className="text-muted-foreground">(r=n)</span>
        </div>
        <div className="bg-black/30 rounded p-1">
          <span className="text-cyan-400">cylinder</span>
          <span className="text-muted-foreground">(h,r)</span>
        </div>
        <div className="bg-black/30 rounded p-1">
          <span className="text-cyan-400">translate</span>
          <span className="text-muted-foreground">([x,y,z])</span>
        </div>
        <div className="bg-black/30 rounded p-1">
          <span className="text-cyan-400">rotate</span>
          <span className="text-muted-foreground">([x,y,z])</span>
        </div>
        <div className="bg-black/30 rounded p-1">
          <span className="text-cyan-400">difference</span>
          <span className="text-muted-foreground">()</span>
        </div>
      </div>
    </div>
  );
}
