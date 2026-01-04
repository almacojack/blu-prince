import { z } from 'zod';

export const FontSourceSchema = z.enum(['google', 'user', 'system', 'embedded']);

export const FontAssetSchema = z.object({
  type: z.literal('font'),
  id: z.string(),
  name: z.string(),
  family: z.string(),
  source: FontSourceSchema,
  variants: z.array(z.string()).default(['400']),
  category: z.enum(['serif', 'sans-serif', 'display', 'handwriting', 'monospace']),
  data: z.string().optional(),
  url: z.string().optional(),
});

export type FontAsset = z.infer<typeof FontAssetSchema>;

export const BitmapGlyphSchema = z.object({
  char: z.string(),
  x: z.number(),
  y: z.number(),
  w: z.number(),
  h: z.number(),
  ox: z.number(),
  oy: z.number(),
  adv: z.number(),
});

export const BitmapFontAssetSchema = z.object({
  type: z.literal('bitmap_font'),
  id: z.string(),
  name: z.string(),
  size: z.number(),
  charset: z.string(),
  glyphs: z.array(BitmapGlyphSchema),
  textureBase64: z.string(),
  textureWidth: z.number(),
  textureHeight: z.number(),
  platform: z.enum(['web', 'micropython', 'all']).default('all'),
});

export type BitmapFontAsset = z.infer<typeof BitmapFontAssetSchema>;

export const ImageAssetSchema = z.object({
  type: z.literal('image'),
  id: z.string(),
  name: z.string(),
  width: z.number(),
  height: z.number(),
  format: z.enum(['png', 'jpg', 'webp', 'gif']),
  dataBase64: z.string(),
});

export type ImageAsset = z.infer<typeof ImageAssetSchema>;

export const SpriteSheetAssetSchema = z.object({
  type: z.literal('spritesheet'),
  id: z.string(),
  name: z.string(),
  width: z.number(),
  height: z.number(),
  frameWidth: z.number(),
  frameHeight: z.number(),
  frames: z.array(z.object({
    name: z.string(),
    x: z.number(),
    y: z.number(),
    w: z.number(),
    h: z.number(),
  })),
  animations: z.array(z.object({
    name: z.string(),
    frames: z.array(z.number()),
    fps: z.number(),
    loop: z.boolean().default(true),
  })),
  dataBase64: z.string(),
});

export type SpriteSheetAsset = z.infer<typeof SpriteSheetAssetSchema>;

export const Model3DAssetSchema = z.object({
  type: z.literal('model_3d'),
  id: z.string(),
  name: z.string(),
  format: z.enum(['gltf', 'glb', 'obj', 'stl', 'threejs_json']),
  dataBase64: z.string(),
  metadata: z.object({
    vertices: z.number().optional(),
    faces: z.number().optional(),
    materials: z.array(z.string()).optional(),
    animations: z.array(z.string()).optional(),
    bounds: z.object({
      min: z.tuple([z.number(), z.number(), z.number()]),
      max: z.tuple([z.number(), z.number(), z.number()]),
    }).optional(),
  }).optional(),
});

export type Model3DAsset = z.infer<typeof Model3DAssetSchema>;

export const AudioAssetSchema = z.object({
  type: z.literal('audio'),
  id: z.string(),
  name: z.string(),
  format: z.enum(['mp3', 'ogg', 'wav', 'webm']),
  duration: z.number(),
  dataBase64: z.string(),
});

export type AudioAsset = z.infer<typeof AudioAssetSchema>;

export const SculptedModelAssetSchema = z.object({
  type: z.literal('sculpted_model'),
  id: z.string(),
  name: z.string(),
  openscadSource: z.string(),
  compiledMeshBase64: z.string().optional(),
  parameters: z.record(z.union([z.number(), z.string(), z.boolean()])).optional(),
});

export type SculptedModelAsset = z.infer<typeof SculptedModelAssetSchema>;

export const CartridgeAssetSchema = z.discriminatedUnion('type', [
  FontAssetSchema,
  BitmapFontAssetSchema,
  ImageAssetSchema,
  SpriteSheetAssetSchema,
  Model3DAssetSchema,
  AudioAssetSchema,
  SculptedModelAssetSchema,
]);

export type CartridgeAsset = z.infer<typeof CartridgeAssetSchema>;

export const AssetsContainerSchema = z.object({
  fonts: z.array(FontAssetSchema).default([]),
  bitmapFonts: z.array(BitmapFontAssetSchema).default([]),
  images: z.array(ImageAssetSchema).default([]),
  spritesheets: z.array(SpriteSheetAssetSchema).default([]),
  models: z.array(Model3DAssetSchema).default([]),
  audio: z.array(AudioAssetSchema).default([]),
  sculptedModels: z.array(SculptedModelAssetSchema).default([]),
});

export type AssetsContainer = z.infer<typeof AssetsContainerSchema>;

export function createFontAsset(
  family: string,
  source: FontAsset['source'],
  data?: string
): FontAsset {
  return {
    type: 'font',
    id: `font_${family.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`,
    name: family,
    family,
    source,
    variants: ['400'],
    category: 'sans-serif',
    data,
  };
}

export function embedGoogleFont(family: string): FontAsset {
  return {
    type: 'font',
    id: `font_${family.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`,
    name: family,
    family,
    source: 'google',
    variants: ['400', '700'],
    category: 'sans-serif',
    url: `https://fonts.googleapis.com/css2?family=${family.replace(/\s+/g, '+')}:wght@400;700&display=swap`,
  };
}

export interface FontEmbedOptions {
  embedVectorFonts: boolean;
  generateBitmapFallback: boolean;
  bitmapSizes: number[];
  micropythonOptimized: boolean;
}

export const DEFAULT_FONT_EMBED_OPTIONS: FontEmbedOptions = {
  embedVectorFonts: true,
  generateBitmapFallback: true,
  bitmapSizes: [12, 16, 24],
  micropythonOptimized: true,
};
