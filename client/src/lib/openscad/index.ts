import * as THREE from 'three';
import { Lexer, LexerError } from './lexer';
import { Parser, ParseError } from './parser';
import { Evaluator, EvalError, EvalResult } from './evaluator';

export interface OpenSCADError {
  type: 'lexer' | 'parser' | 'runtime';
  message: string;
  line: number;
  column?: number;
}

export interface OpenSCADResult {
  success: boolean;
  geometry: THREE.BufferGeometry | null;
  meshes: THREE.Mesh[];
  errors: OpenSCADError[];
  parseTime: number;
  evalTime: number;
}

export function compileOpenSCAD(source: string): OpenSCADResult {
  const errors: OpenSCADError[] = [];
  let geometry: THREE.BufferGeometry | null = null;
  let meshes: THREE.Mesh[] = [];

  const parseStart = performance.now();

  const lexer = new Lexer(source);
  const { tokens, errors: lexerErrors } = lexer.tokenize();

  for (const err of lexerErrors) {
    errors.push({
      type: 'lexer',
      message: err.message,
      line: err.line,
      column: err.column,
    });
  }

  if (errors.length > 0) {
    return {
      success: false,
      geometry: null,
      meshes: [],
      errors,
      parseTime: performance.now() - parseStart,
      evalTime: 0,
    };
  }

  const parser = new Parser(tokens);
  const { ast, errors: parseErrors } = parser.parse();

  for (const err of parseErrors) {
    errors.push({
      type: 'parser',
      message: err.message,
      line: err.line,
      column: err.column,
    });
  }

  const parseTime = performance.now() - parseStart;

  if (errors.length > 0) {
    return {
      success: false,
      geometry: null,
      meshes: [],
      errors,
      parseTime,
      evalTime: 0,
    };
  }

  const evalStart = performance.now();

  try {
    const evaluator = new Evaluator();
    const result = evaluator.evaluate(ast);

    geometry = result.geometry;
    meshes = result.meshes;

    for (const err of result.errors) {
      errors.push({
        type: 'runtime',
        message: err.message,
        line: err.line,
      });
    }
  } catch (e) {
    errors.push({
      type: 'runtime',
      message: e instanceof Error ? e.message : 'Unknown runtime error',
      line: 1,
    });
  }

  const evalTime = performance.now() - evalStart;

  return {
    success: errors.length === 0,
    geometry,
    meshes,
    errors,
    parseTime,
    evalTime,
  };
}

export function createMeshFromGeometry(
  geometry: THREE.BufferGeometry,
  material?: THREE.Material
): THREE.Mesh {
  const defaultMaterial = new THREE.MeshStandardMaterial({
    color: 0xf9d71c,
    roughness: 0.4,
    metalness: 0.1,
  });

  const mesh = new THREE.Mesh(geometry, material || defaultMaterial);
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  return mesh;
}

export const OPENSCAD_EXAMPLES = {
  cube: `// Simple cube
cube([20, 20, 20], center=true);`,

  hollowBox: `// Hollow box (enclosure)
difference() {
  cube([80, 50, 30], center=true);
  translate([0, 0, 2])
    cube([76, 46, 30], center=true);
}`,

  roundedBox: `// Rounded box using hull
$fn = 32;
module rounded_cube(size, r) {
  hull() {
    for (x = [-1, 1], y = [-1, 1], z = [-1, 1])
      translate([x*(size[0]/2-r), y*(size[1]/2-r), z*(size[2]/2-r)])
        sphere(r);
  }
}
rounded_cube([40, 30, 20], 3);`,

  gearLike: `// Gear-like shape
$fn = 6;
difference() {
  cylinder(h=5, r=20, center=true);
  cylinder(h=10, r=8, center=true);
}
for (i = [0:5])
  rotate([0, 0, i*60])
    translate([15, 0, 0])
      cylinder(h=5, r=5, center=true);`,

  enclosureWithHoles: `// Enclosure with mounting holes
difference() {
  // Outer shell
  cube([100, 60, 40], center=true);
  
  // Inner cavity
  translate([0, 0, 2])
    cube([96, 56, 40], center=true);
  
  // Mounting holes
  for (x = [-40, 40], y = [-20, 20])
    translate([x, y, -20])
      cylinder(h=10, r=2, $fn=16);
}`,

  parametricBox: `// Parametric box with lid lip
width = 60;
depth = 40;
height = 25;
wall = 2;
lip = 3;

// Body
difference() {
  cube([width, depth, height]);
  translate([wall, wall, wall])
    cube([width-wall*2, depth-wall*2, height]);
}

// Lid (offset for visualization)
translate([0, 0, height + 5]) {
  cube([width, depth, wall]);
  translate([wall, wall, -lip])
    difference() {
      cube([width-wall*2, depth-wall*2, lip]);
      translate([wall, wall, 0])
        cube([width-wall*4, depth-wall*4, lip]);
    }
}`,
};

export { Lexer } from './lexer';
export { Parser } from './parser';
export { Evaluator } from './evaluator';
export type { LexerError } from './lexer';
export type { ParseError } from './parser';
export type { EvalError, EvalResult } from './evaluator';
