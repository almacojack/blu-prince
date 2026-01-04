import * as THREE from 'three';
import * as AST from './parser';

export interface EvalError {
  message: string;
  line: number;
}

export interface EvalResult {
  geometry: THREE.BufferGeometry | null;
  meshes: THREE.Mesh[];
  errors: EvalError[];
}

type Value = number | string | boolean | Value[] | undefined;

interface Environment {
  vars: Map<string, Value>;
  modules: Map<string, AST.ModuleDefNode>;
  functions: Map<string, AST.FunctionDefNode>;
  parent?: Environment;
  $fn: number;
  $fa: number;
  $fs: number;
}

const BUILTIN_FUNCTIONS: Record<string, (...args: number[]) => number> = {
  sin: (x) => Math.sin(x * Math.PI / 180),
  cos: (x) => Math.cos(x * Math.PI / 180),
  tan: (x) => Math.tan(x * Math.PI / 180),
  asin: (x) => Math.asin(x) * 180 / Math.PI,
  acos: (x) => Math.acos(x) * 180 / Math.PI,
  atan: (x) => Math.atan(x) * 180 / Math.PI,
  atan2: (y, x) => Math.atan2(y, x) * 180 / Math.PI,
  abs: Math.abs,
  ceil: Math.ceil,
  floor: Math.floor,
  round: Math.round,
  min: Math.min,
  max: Math.max,
  sqrt: Math.sqrt,
  pow: Math.pow,
  exp: Math.exp,
  log: Math.log,
  ln: Math.log,
  sign: Math.sign,
  len: (arr: any) => Array.isArray(arr) ? arr.length : 0,
  norm: (...v: number[]) => Math.sqrt(v.reduce((sum, x) => sum + x * x, 0)),
  cross: () => 0,
  rands: (min, max, count) => {
    const result: number[] = [];
    for (let i = 0; i < count; i++) {
      result.push(min + Math.random() * (max - min));
    }
    return result as any;
  },
};

export class Evaluator {
  private errors: EvalError[] = [];
  private meshes: THREE.Mesh[] = [];
  private globalEnv: Environment;

  constructor() {
    this.globalEnv = this.createEnvironment();
  }

  private createEnvironment(parent?: Environment): Environment {
    return {
      vars: new Map(),
      modules: new Map(),
      functions: new Map(),
      parent,
      $fn: parent?.$fn ?? 32,
      $fa: parent?.$fa ?? 12,
      $fs: parent?.$fs ?? 2,
    };
  }

  evaluate(ast: AST.ASTNode[]): EvalResult {
    this.errors = [];
    this.meshes = [];

    const allGeometries: THREE.BufferGeometry[] = [];

    for (const node of ast) {
      const geometries = this.evalStatement(node, this.globalEnv);
      allGeometries.push(...geometries);
    }

    const defaultMaterial = new THREE.MeshStandardMaterial({
      color: 0xf9d71c,
      roughness: 0.4,
      metalness: 0.1,
    });

    for (const geo of allGeometries) {
      if (geo && geo.attributes && geo.attributes.position) {
        const mesh = new THREE.Mesh(geo, defaultMaterial);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        this.meshes.push(mesh);
      }
    }

    const merged = this.mergeGeometries(allGeometries.filter(g => g && g.attributes && g.attributes.position));

    return {
      geometry: merged,
      meshes: this.meshes,
      errors: this.errors,
    };
  }

  private evalStatement(node: AST.ASTNode, env: Environment): THREE.BufferGeometry[] {
    switch (node.type) {
      case 'assignment':
        return this.evalAssignment(node, env);
      case 'module_def':
        env.modules.set(node.name, node);
        return [];
      case 'function_def':
        env.functions.set(node.name, node);
        return [];
      case 'module_call':
        return this.evalModuleCall(node, env);
      case 'for':
        return this.evalFor(node, env);
      case 'if':
        return this.evalIf(node, env);
      case 'let':
        return this.evalLet(node, env);
      case 'block':
        return this.evalBlock(node, env);
      case 'empty':
        return [];
      default:
        return [];
    }
  }

  private evalAssignment(node: AST.AssignmentNode, env: Environment): THREE.BufferGeometry[] {
    const value = this.evalExpr(node.value, env);
    if (node.name.startsWith('$')) {
      if (node.name === '$fn') env.$fn = value as number;
      else if (node.name === '$fa') env.$fa = value as number;
      else if (node.name === '$fs') env.$fs = value as number;
    }
    env.vars.set(node.name, value);
    return [];
  }

  private evalModuleCall(node: AST.ModuleCallNode, env: Environment): THREE.BufferGeometry[] {
    const args = node.args.map(a => this.evalExpr(a, env));
    const namedArgs = new Map<string, Value>();
    for (const na of node.namedArgs) {
      namedArgs.set(na.name, this.evalExpr(na.value, env));
    }

    const childGeometries: THREE.BufferGeometry[] = [];
    for (const child of node.children) {
      childGeometries.push(...this.evalStatement(child, env));
    }

    switch (node.name) {
      case 'cube':
        return [this.createCube(args, namedArgs, env)];
      case 'sphere':
        return [this.createSphere(args, namedArgs, env)];
      case 'cylinder':
        return [this.createCylinder(args, namedArgs, env)];
      case 'cone':
        return [this.createCone(args, namedArgs, env)];
      case 'polyhedron':
        return [this.createPolyhedron(args, namedArgs, env)];
      case 'translate':
        return this.applyTranslate(args, namedArgs, childGeometries);
      case 'rotate':
        return this.applyRotate(args, namedArgs, childGeometries);
      case 'scale':
        return this.applyScale(args, namedArgs, childGeometries);
      case 'mirror':
        return this.applyMirror(args, namedArgs, childGeometries);
      case 'color':
        return this.applyColor(args, namedArgs, childGeometries, env);
      case 'union':
        return [this.csgUnion(childGeometries)];
      case 'difference':
        return [this.csgDifference(childGeometries)];
      case 'intersection':
        return [this.csgIntersection(childGeometries)];
      case 'hull':
        return [this.csgHull(childGeometries)];
      case 'linear_extrude':
        return [this.linearExtrude(args, namedArgs, childGeometries, env)];
      case 'rotate_extrude':
        return [this.rotateExtrude(args, namedArgs, childGeometries, env)];
      case 'circle':
        return [this.createCircle(args, namedArgs, env)];
      case 'square':
        return [this.createSquare(args, namedArgs, env)];
      case 'polygon':
        return [this.createPolygon(args, namedArgs, env)];
      case 'text':
        return [this.createText(args, namedArgs, env)];
      default:
        const userModule = this.lookupModule(node.name, env);
        if (userModule) {
          return this.evalUserModule(userModule, args, namedArgs, childGeometries, env);
        }
        this.errors.push({ message: `Unknown module: ${node.name}`, line: node.line });
        return childGeometries;
    }
  }

  private evalFor(node: AST.ForNode, env: Environment): THREE.BufferGeometry[] {
    const range = this.evalExpr(node.range, env);
    const results: THREE.BufferGeometry[] = [];

    if (Array.isArray(range)) {
      for (const val of range) {
        const childEnv = this.createEnvironment(env);
        childEnv.vars.set(node.variable, val);
        results.push(...this.evalStatement(node.body, childEnv));
      }
    }

    return results;
  }

  private evalIf(node: AST.IfNode, env: Environment): THREE.BufferGeometry[] {
    const condition = this.evalExpr(node.condition, env);
    if (this.isTruthy(condition)) {
      return this.evalStatement(node.consequent, env);
    } else if (node.alternate) {
      return this.evalStatement(node.alternate, env);
    }
    return [];
  }

  private evalLet(node: AST.LetNode, env: Environment): THREE.BufferGeometry[] {
    const childEnv = this.createEnvironment(env);
    for (const binding of node.bindings) {
      childEnv.vars.set(binding.name, this.evalExpr(binding.value, env));
    }
    return this.evalStatement(node.body, childEnv);
  }

  private evalBlock(node: AST.BlockNode, env: Environment): THREE.BufferGeometry[] {
    const results: THREE.BufferGeometry[] = [];
    for (const stmt of node.statements) {
      results.push(...this.evalStatement(stmt, env));
    }
    return results;
  }

  private evalExpr(node: AST.ASTNode, env: Environment): Value {
    switch (node.type) {
      case 'number':
        return node.value;
      case 'string':
        return node.value;
      case 'boolean':
        return node.value;
      case 'identifier':
        return this.lookupVar(node.name, env);
      case 'array':
        return node.elements.map(e => this.evalExpr(e, env));
      case 'range':
        return this.evalRange(node, env);
      case 'unary':
        return this.evalUnary(node, env);
      case 'binary':
        return this.evalBinary(node, env);
      case 'ternary':
        return this.isTruthy(this.evalExpr(node.condition, env))
          ? this.evalExpr(node.consequent, env)
          : this.evalExpr(node.alternate, env);
      case 'call':
        return this.evalCall(node, env);
      case 'index':
        const arr = this.evalExpr(node.object, env);
        const idx = this.evalExpr(node.index, env) as number;
        return Array.isArray(arr) ? arr[idx] : undefined;
      default:
        return undefined;
    }
  }

  private evalRange(node: AST.RangeNode, env: Environment): Value[] {
    const start = this.evalExpr(node.start, env) as number;
    const end = this.evalExpr(node.end, env) as number;
    const step = node.step ? (this.evalExpr(node.step, env) as number) : 1;

    const result: number[] = [];
    if (step > 0) {
      for (let i = start; i <= end; i += step) result.push(i);
    } else if (step < 0) {
      for (let i = start; i >= end; i += step) result.push(i);
    }
    return result;
  }

  private evalUnary(node: AST.UnaryNode, env: Environment): Value {
    const operand = this.evalExpr(node.operand, env);
    switch (node.operator) {
      case '-': return -(operand as number);
      case '!': return !this.isTruthy(operand);
      default: return operand;
    }
  }

  private evalBinary(node: AST.BinaryNode, env: Environment): Value {
    const left = this.evalExpr(node.left, env);
    const right = this.evalExpr(node.right, env);

    switch (node.operator) {
      case '+':
        if (Array.isArray(left) && Array.isArray(right)) return [...left, ...right];
        return (left as number) + (right as number);
      case '-': return (left as number) - (right as number);
      case '*':
        if (Array.isArray(left) && typeof right === 'number') {
          return left.map(x => (x as number) * right);
        }
        return (left as number) * (right as number);
      case '/': return (left as number) / (right as number);
      case '%': return (left as number) % (right as number);
      case '^': return Math.pow(left as number, right as number);
      case '==': return left === right;
      case '!=': return left !== right;
      case '<': return (left as number) < (right as number);
      case '>': return (left as number) > (right as number);
      case '<=': return (left as number) <= (right as number);
      case '>=': return (left as number) >= (right as number);
      case '&&': return this.isTruthy(left) && this.isTruthy(right);
      case '||': return this.isTruthy(left) || this.isTruthy(right);
      default: return undefined;
    }
  }

  private evalCall(node: AST.CallNode, env: Environment): Value {
    const args = node.args.map(a => this.evalExpr(a, env));

    if (BUILTIN_FUNCTIONS[node.name]) {
      return BUILTIN_FUNCTIONS[node.name](...(args as number[]));
    }

    const userFunc = this.lookupFunction(node.name, env);
    if (userFunc) {
      const funcEnv = this.createEnvironment(env);
      for (let i = 0; i < userFunc.params.length; i++) {
        const param = userFunc.params[i];
        const value = args[i] ?? (param.default ? this.evalExpr(param.default, env) : undefined);
        funcEnv.vars.set(param.name, value);
      }
      return this.evalExpr(userFunc.body, funcEnv);
    }

    if (node.name === 'concat') {
      return args.flat();
    }
    if (node.name === 'str') {
      return args.map(String).join('');
    }

    this.errors.push({ message: `Unknown function: ${node.name}`, line: node.line });
    return undefined;
  }

  private lookupVar(name: string, env: Environment): Value {
    if (name === '$fn') return env.$fn;
    if (name === '$fa') return env.$fa;
    if (name === '$fs') return env.$fs;
    if (env.vars.has(name)) return env.vars.get(name);
    if (env.parent) return this.lookupVar(name, env.parent);
    return undefined;
  }

  private lookupModule(name: string, env: Environment): AST.ModuleDefNode | undefined {
    if (env.modules.has(name)) return env.modules.get(name);
    if (env.parent) return this.lookupModule(name, env.parent);
    return undefined;
  }

  private lookupFunction(name: string, env: Environment): AST.FunctionDefNode | undefined {
    if (env.functions.has(name)) return env.functions.get(name);
    if (env.parent) return this.lookupFunction(name, env.parent);
    return undefined;
  }

  private isTruthy(value: Value): boolean {
    if (value === undefined || value === false || value === 0) return false;
    if (Array.isArray(value) && value.length === 0) return false;
    return true;
  }

  private evalUserModule(
    module: AST.ModuleDefNode,
    args: Value[],
    namedArgs: Map<string, Value>,
    children: THREE.BufferGeometry[],
    env: Environment
  ): THREE.BufferGeometry[] {
    const moduleEnv = this.createEnvironment(env);

    for (let i = 0; i < module.params.length; i++) {
      const param = module.params[i];
      let value = args[i];
      if (value === undefined && namedArgs.has(param.name)) {
        value = namedArgs.get(param.name);
      }
      if (value === undefined && param.default) {
        value = this.evalExpr(param.default, env);
      }
      moduleEnv.vars.set(param.name, value);
    }

    if (module.body.type === 'block') {
      const results: THREE.BufferGeometry[] = [];
      for (const stmt of module.body.statements) {
        results.push(...this.evalStatement(stmt, moduleEnv));
      }
      return results;
    }

    return this.evalStatement(module.body, moduleEnv);
  }

  private getNum(args: Value[], idx: number, def: number): number {
    const v = args[idx];
    return typeof v === 'number' ? v : def;
  }

  private getVec3(val: Value, def: [number, number, number]): [number, number, number] {
    if (Array.isArray(val) && val.length >= 3) {
      return [val[0] as number, val[1] as number, val[2] as number];
    }
    if (typeof val === 'number') {
      return [val, val, val];
    }
    return def;
  }

  private getBool(val: Value, def: boolean): boolean {
    if (typeof val === 'boolean') return val;
    return def;
  }

  private createCube(args: Value[], named: Map<string, Value>, env: Environment): THREE.BufferGeometry {
    let size: [number, number, number] = [1, 1, 1];
    const sizeArg = args[0] ?? named.get('size');
    if (sizeArg !== undefined) {
      size = this.getVec3(sizeArg, [1, 1, 1]);
    }

    const center = this.getBool(args[1] ?? named.get('center'), false);

    const geometry = new THREE.BoxGeometry(size[0], size[1], size[2]);
    if (!center) {
      geometry.translate(size[0] / 2, size[1] / 2, size[2] / 2);
    }
    return geometry;
  }

  private createSphere(args: Value[], named: Map<string, Value>, env: Environment): THREE.BufferGeometry {
    const r = (args[0] ?? named.get('r') ?? named.get('d') !== undefined ? (named.get('d') as number) / 2 : 1) as number;
    const d = named.get('d');
    const radius = d !== undefined ? (d as number) / 2 : r;

    const segments = Math.max(8, Math.floor(env.$fn));
    return new THREE.SphereGeometry(radius, segments, segments / 2);
  }

  private createCylinder(args: Value[], named: Map<string, Value>, env: Environment): THREE.BufferGeometry {
    const h = (args[0] ?? named.get('h') ?? 1) as number;
    const r1 = (named.get('r1') ?? named.get('r') ?? (named.get('d1') !== undefined ? (named.get('d1') as number) / 2 : (named.get('d') !== undefined ? (named.get('d') as number) / 2 : 1))) as number;
    const r2 = (named.get('r2') ?? named.get('r') ?? (named.get('d2') !== undefined ? (named.get('d2') as number) / 2 : (named.get('d') !== undefined ? (named.get('d') as number) / 2 : 1))) as number;
    const center = this.getBool(named.get('center'), false);

    const segments = Math.max(8, Math.floor(env.$fn));
    const geometry = new THREE.CylinderGeometry(r2, r1, h, segments);

    geometry.rotateX(Math.PI / 2);

    if (!center) {
      geometry.translate(0, 0, h / 2);
    }

    return geometry;
  }

  private createCone(args: Value[], named: Map<string, Value>, env: Environment): THREE.BufferGeometry {
    const h = (args[0] ?? named.get('h') ?? 1) as number;
    const r = (args[1] ?? named.get('r') ?? (named.get('d') !== undefined ? (named.get('d') as number) / 2 : 1)) as number;
    const center = this.getBool(named.get('center'), false);

    const segments = Math.max(8, Math.floor(env.$fn));
    const geometry = new THREE.ConeGeometry(r, h, segments);

    geometry.rotateX(Math.PI / 2);

    if (!center) {
      geometry.translate(0, 0, h / 2);
    }

    return geometry;
  }

  private createPolyhedron(args: Value[], named: Map<string, Value>, env: Environment): THREE.BufferGeometry {
    const points = (args[0] ?? named.get('points') ?? []) as number[][];
    const faces = (args[1] ?? named.get('faces') ?? named.get('triangles') ?? []) as number[][];

    const geometry = new THREE.BufferGeometry();
    const vertices: number[] = [];
    const indices: number[] = [];

    for (const point of points) {
      vertices.push(point[0] || 0, point[1] || 0, point[2] || 0);
    }

    for (const face of faces) {
      for (let i = 1; i < face.length - 1; i++) {
        indices.push(face[0], face[i], face[i + 1]);
      }
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();

    return geometry;
  }

  private createCircle(args: Value[], named: Map<string, Value>, env: Environment): THREE.BufferGeometry {
    const r = (args[0] ?? named.get('r') ?? (named.get('d') !== undefined ? (named.get('d') as number) / 2 : 1)) as number;
    const segments = Math.max(8, Math.floor(env.$fn));
    return new THREE.CircleGeometry(r, segments);
  }

  private createSquare(args: Value[], named: Map<string, Value>, env: Environment): THREE.BufferGeometry {
    let size: [number, number] = [1, 1];
    const sizeArg = args[0] ?? named.get('size');
    if (Array.isArray(sizeArg)) {
      size = [sizeArg[0] as number, sizeArg[1] as number];
    } else if (typeof sizeArg === 'number') {
      size = [sizeArg, sizeArg];
    }

    const center = this.getBool(args[1] ?? named.get('center'), false);
    const geometry = new THREE.PlaneGeometry(size[0], size[1]);

    if (!center) {
      geometry.translate(size[0] / 2, size[1] / 2, 0);
    }

    return geometry;
  }

  private createPolygon(args: Value[], named: Map<string, Value>, env: Environment): THREE.BufferGeometry {
    const points = (args[0] ?? named.get('points') ?? []) as number[][];

    const shape = new THREE.Shape();
    if (points.length > 0) {
      shape.moveTo(points[0][0], points[0][1]);
      for (let i = 1; i < points.length; i++) {
        shape.lineTo(points[i][0], points[i][1]);
      }
      shape.closePath();
    }

    return new THREE.ShapeGeometry(shape);
  }

  private createText(args: Value[], named: Map<string, Value>, env: Environment): THREE.BufferGeometry {
    const text = (args[0] ?? named.get('text') ?? '') as string;
    const size = (named.get('size') ?? 10) as number;

    const geometry = new THREE.PlaneGeometry(size * text.length * 0.6, size);
    return geometry;
  }

  private applyTranslate(args: Value[], named: Map<string, Value>, children: THREE.BufferGeometry[]): THREE.BufferGeometry[] {
    const v = this.getVec3(args[0] ?? named.get('v'), [0, 0, 0]);
    return children.map(geo => {
      const cloned = geo.clone();
      cloned.translate(v[0], v[1], v[2]);
      return cloned;
    });
  }

  private applyRotate(args: Value[], named: Map<string, Value>, children: THREE.BufferGeometry[]): THREE.BufferGeometry[] {
    const a = args[0] ?? named.get('a');
    let rotation: [number, number, number];

    if (Array.isArray(a)) {
      rotation = [
        (a[0] as number || 0) * Math.PI / 180,
        (a[1] as number || 0) * Math.PI / 180,
        (a[2] as number || 0) * Math.PI / 180,
      ];
    } else {
      const angle = (a as number || 0) * Math.PI / 180;
      const v = this.getVec3(named.get('v'), [0, 0, 1]);
      const axis = new THREE.Vector3(v[0], v[1], v[2]).normalize();

      return children.map(geo => {
        const cloned = geo.clone();
        const matrix = new THREE.Matrix4().makeRotationAxis(axis, angle);
        cloned.applyMatrix4(matrix);
        return cloned;
      });
    }

    return children.map(geo => {
      const cloned = geo.clone();
      cloned.rotateX(rotation[0]);
      cloned.rotateY(rotation[1]);
      cloned.rotateZ(rotation[2]);
      return cloned;
    });
  }

  private applyScale(args: Value[], named: Map<string, Value>, children: THREE.BufferGeometry[]): THREE.BufferGeometry[] {
    const v = this.getVec3(args[0] ?? named.get('v'), [1, 1, 1]);
    return children.map(geo => {
      const cloned = geo.clone();
      cloned.scale(v[0], v[1], v[2]);
      return cloned;
    });
  }

  private applyMirror(args: Value[], named: Map<string, Value>, children: THREE.BufferGeometry[]): THREE.BufferGeometry[] {
    const v = this.getVec3(args[0] ?? named.get('v'), [1, 0, 0]);
    const matrix = new THREE.Matrix4().makeScale(
      v[0] !== 0 ? -1 : 1,
      v[1] !== 0 ? -1 : 1,
      v[2] !== 0 ? -1 : 1
    );

    return children.map(geo => {
      const cloned = geo.clone();
      cloned.applyMatrix4(matrix);
      return cloned;
    });
  }

  private applyColor(args: Value[], named: Map<string, Value>, children: THREE.BufferGeometry[], env: Environment): THREE.BufferGeometry[] {
    return children;
  }

  private csgUnion(children: THREE.BufferGeometry[]): THREE.BufferGeometry {
    if (children.length === 0) return new THREE.BufferGeometry();
    if (children.length === 1) return children[0];
    return this.mergeGeometries(children);
  }

  private csgDifference(children: THREE.BufferGeometry[]): THREE.BufferGeometry {
    if (children.length === 0) return new THREE.BufferGeometry();
    const result = children[0].clone();
    result.userData.csgOperations = result.userData.csgOperations || [];
    for (let i = 1; i < children.length; i++) {
      result.userData.csgOperations.push({ type: 'subtract', geometry: children[i] });
    }
    return result;
  }

  private csgIntersection(children: THREE.BufferGeometry[]): THREE.BufferGeometry {
    if (children.length === 0) return new THREE.BufferGeometry();
    const result = children[0].clone();
    result.userData.csgOperations = result.userData.csgOperations || [];
    for (let i = 1; i < children.length; i++) {
      result.userData.csgOperations.push({ type: 'intersect', geometry: children[i] });
    }
    return result;
  }

  private csgHull(children: THREE.BufferGeometry[]): THREE.BufferGeometry {
    if (children.length === 0) return new THREE.BufferGeometry();
    return this.mergeGeometries(children);
  }

  private linearExtrude(args: Value[], named: Map<string, Value>, children: THREE.BufferGeometry[], env: Environment): THREE.BufferGeometry {
    const height = (args[0] ?? named.get('height') ?? 1) as number;
    const center = this.getBool(named.get('center'), false);
    const twist = (named.get('twist') ?? 0) as number;
    const slices = (named.get('slices') ?? Math.max(1, Math.abs(twist) / 10)) as number;

    if (children.length === 0) return new THREE.BufferGeometry();

    const child = children[0];
    const posAttr = child.attributes.position;
    if (!posAttr) return new THREE.BufferGeometry();

    const vertices: number[] = [];
    const indices: number[] = [];

    const basePoints: THREE.Vector2[] = [];
    for (let i = 0; i < posAttr.count; i++) {
      basePoints.push(new THREE.Vector2(posAttr.getX(i), posAttr.getY(i)));
    }

    const steps = Math.max(1, Math.floor(slices));
    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      const z = height * t;
      const angle = (twist * t) * Math.PI / 180;

      for (const p of basePoints) {
        const x = p.x * Math.cos(angle) - p.y * Math.sin(angle);
        const y = p.x * Math.sin(angle) + p.y * Math.cos(angle);
        vertices.push(x, y, center ? z - height / 2 : z);
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.computeVertexNormals();

    return geometry;
  }

  private rotateExtrude(args: Value[], named: Map<string, Value>, children: THREE.BufferGeometry[], env: Environment): THREE.BufferGeometry {
    const angle = (named.get('angle') ?? 360) as number;
    const segments = Math.max(4, Math.floor(env.$fn));

    if (children.length === 0) return new THREE.BufferGeometry();
    return new THREE.LatheGeometry([], segments, 0, (angle * Math.PI) / 180);
  }

  private mergeGeometries(geometries: THREE.BufferGeometry[]): THREE.BufferGeometry {
    if (geometries.length === 0) return new THREE.BufferGeometry();
    if (geometries.length === 1) return geometries[0];

    let totalVertices = 0;
    let totalIndices = 0;

    geometries.forEach(geo => {
      totalVertices += geo.attributes.position?.count || 0;
      totalIndices += geo.index?.count || geo.attributes.position?.count || 0;
    });

    const positions = new Float32Array(totalVertices * 3);
    const normals = new Float32Array(totalVertices * 3);
    const indices: number[] = [];

    let vertexOffset = 0;

    geometries.forEach(geo => {
      const posAttr = geo.attributes.position;
      const normAttr = geo.attributes.normal;
      if (!posAttr) return;

      for (let i = 0; i < posAttr.count; i++) {
        const idx = (vertexOffset + i) * 3;
        positions[idx] = posAttr.getX(i);
        positions[idx + 1] = posAttr.getY(i);
        positions[idx + 2] = posAttr.getZ(i);

        if (normAttr) {
          normals[idx] = normAttr.getX(i);
          normals[idx + 1] = normAttr.getY(i);
          normals[idx + 2] = normAttr.getZ(i);
        }
      }

      if (geo.index) {
        for (let i = 0; i < geo.index.count; i++) {
          indices.push(geo.index.getX(i) + vertexOffset);
        }
      } else {
        for (let i = 0; i < posAttr.count; i++) {
          indices.push(i + vertexOffset);
        }
      }

      vertexOffset += posAttr.count;
    });

    const merged = new THREE.BufferGeometry();
    merged.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    merged.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
    merged.setIndex(indices);

    return merged;
  }

  private mergeMeshes(meshes: THREE.Mesh[]): THREE.BufferGeometry | null {
    if (meshes.length === 0) return null;
    return this.mergeGeometries(meshes.map(m => m.geometry));
  }
}
