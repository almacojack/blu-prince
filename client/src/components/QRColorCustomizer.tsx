import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { QrCode, Download, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Hint } from "@/components/ui/Hint";
import { useTranslation } from "react-i18next";
import QRCodeLib from "qrcode";

export interface QRPreset {
  name: string;
  i18nKey: string;
  dark: string;
  light: string;
}

export const DEFAULT_QR_PRESETS: QRPreset[] = [
  { name: "Classic", i18nKey: "qr.presets.classic", dark: "#000000", light: "#ffffff" },
  { name: "Cyberpunk", i18nKey: "qr.presets.cyberpunk", dark: "#a855f7", light: "#0a0a14" },
  { name: "Terminal", i18nKey: "qr.presets.terminal", dark: "#22c55e", light: "#0d1117" },
  { name: "Blueprint", i18nKey: "qr.presets.blueprint", dark: "#1e40af", light: "#dbeafe" },
  { name: "Sunset", i18nKey: "qr.presets.sunset", dark: "#ea580c", light: "#fef3c7" },
  { name: "Vapor", i18nKey: "qr.presets.vapor", dark: "#ec4899", light: "#fdf4ff" },
  { name: "Gold Leaf", i18nKey: "qr.presets.goldLeaf", dark: "#854d0e", light: "#fef9c3" },
  { name: "Steampunk", i18nKey: "qr.presets.steampunk", dark: "#78350f", light: "#d4a574" },
];

export interface QRColorCustomizerProps {
  url: string;
  identifier?: string;
  title?: string;
  presets?: QRPreset[];
  defaultDark?: string;
  defaultLight?: string;
  size?: number;
  showDownload?: boolean;
  showUrl?: boolean;
  className?: string;
}

export function QRColorCustomizer({
  url,
  identifier,
  title = "QR Code",
  presets = DEFAULT_QR_PRESETS,
  defaultDark = "#000000",
  defaultLight = "#ffffff",
  size = 200,
  showDownload = true,
  showUrl = true,
  className = "",
}: QRColorCustomizerProps) {
  const { t } = useTranslation();
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [darkColor, setDarkColor] = useState(defaultDark);
  const [lightColor, setLightColor] = useState(defaultLight);

  useEffect(() => {
    QRCodeLib.toDataURL(url, {
      width: size,
      margin: 2,
      color: { dark: darkColor, light: lightColor },
      errorCorrectionLevel: "H",
    }).then(setQrDataUrl).catch(console.error);
  }, [url, darkColor, lightColor, size]);

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const link = document.createElement("a");
    const filename = identifier ? `${identifier}-qr.png` : "qr-code.png";
    link.download = filename;
    link.href = qrDataUrl;
    link.click();
  };

  const applyPreset = (preset: QRPreset) => {
    setDarkColor(preset.dark);
    setLightColor(preset.light);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`flex flex-col items-center gap-2 p-4 rounded-lg bg-black/40 border border-purple-500/20 ${className}`}
    >
      <div className="flex items-center justify-between w-full">
        {identifier && (
          <div className="text-xs text-purple-400 font-mono flex items-center gap-1">
            <QrCode className="w-3 h-3" />
            {identifier}
          </div>
        )}
        <Popover>
          <Hint i18nKey="tooltips.qrColors">
            <PopoverTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 w-6 p-0 ml-auto" 
                data-testid="button-qr-colors"
              >
                <Palette className="w-3.5 h-3.5 text-purple-400" />
              </Button>
            </PopoverTrigger>
          </Hint>
          <PopoverContent className="w-72 bg-gray-900 border-purple-500/30" align="end">
            <div className="space-y-3">
              <div className="text-xs font-semibold text-white">{t("qr.colors")}</div>
              
              <div className="grid grid-cols-4 gap-1.5">
                {presets.map((preset) => (
                  <Hint key={preset.name} text={t(preset.i18nKey)}>
                    <button
                      onClick={() => applyPreset(preset)}
                      className="group relative h-8 rounded border border-gray-700 hover:border-purple-500 transition-colors overflow-hidden"
                      data-testid={`button-preset-${preset.name.toLowerCase().replace(' ', '-')}`}
                    >
                      <div className="absolute inset-0 flex">
                        <div className="w-1/2 h-full" style={{ backgroundColor: preset.light }} />
                        <div className="w-1/2 h-full" style={{ backgroundColor: preset.dark }} />
                      </div>
                      <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold opacity-0 group-hover:opacity-100 bg-black/60 text-white transition-opacity">
                        {t(preset.i18nKey)}
                      </span>
                    </button>
                  </Hint>
                ))}
              </div>

              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-[10px] text-gray-400 block mb-1">{t("qr.foreground")}</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={darkColor}
                      onChange={(e) => setDarkColor(e.target.value)}
                      className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent"
                      data-testid="input-qr-dark-color"
                    />
                    <input
                      type="text"
                      value={darkColor}
                      onChange={(e) => setDarkColor(e.target.value)}
                      className="flex-1 text-xs font-mono bg-black/50 border border-gray-700 rounded px-2 py-1 text-white uppercase"
                      data-testid="input-qr-dark-hex"
                    />
                  </div>
                </div>
                <div className="flex-1">
                  <label className="text-[10px] text-gray-400 block mb-1">{t("qr.background")}</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={lightColor}
                      onChange={(e) => setLightColor(e.target.value)}
                      className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent"
                      data-testid="input-qr-light-color"
                    />
                    <input
                      type="text"
                      value={lightColor}
                      onChange={(e) => setLightColor(e.target.value)}
                      className="flex-1 text-xs font-mono bg-black/50 border border-gray-700 rounded px-2 py-1 text-white uppercase"
                      data-testid="input-qr-light-hex"
                    />
                  </div>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
      
      {qrDataUrl && (
        <img 
          src={qrDataUrl} 
          alt={`QR for ${title}`} 
          className="rounded-lg" 
          style={{ width: size, height: size }} 
        />
      )}
      
      {showUrl && (
        <div className="text-[10px] text-gray-500 font-mono text-center break-all" style={{ maxWidth: size }}>
          {url}
        </div>
      )}
      
      {showDownload && (
        <Hint i18nKey="tooltips.downloadQr">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-xs text-purple-400" 
            onClick={handleDownload} 
            data-testid="button-download-qr"
          >
            <Download className="w-3 h-3 mr-1" /> {t("qr.downloadQr")}
          </Button>
        </Hint>
      )}
    </motion.div>
  );
}
