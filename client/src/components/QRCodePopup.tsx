import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  QrCode, X, Copy, ExternalLink, Download, Share2,
  Smartphone, Globe, Wifi
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface QRCodePopupProps {
  tngliId: string;
  title?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TNGLY_BASE_URL = 'https://tng.li';

export function QRCodePopup({ tngliId, title, open, onOpenChange }: QRCodePopupProps) {
  const { themeVariant } = useTheme();
  const isVictorian = themeVariant === 'victorian';
  const { toast } = useToast();
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const fullUrl = `${TNGLY_BASE_URL}/${tngliId}`;

  useEffect(() => {
    if (open && tngliId) {
      setLoading(true);
      QRCode.toDataURL(fullUrl, {
        width: 280,
        margin: 2,
        color: {
          dark: isVictorian ? '#b8860b' : '#a855f7',
          light: isVictorian ? '#1a1510' : '#0a0a0f',
        },
        errorCorrectionLevel: 'H',
      })
        .then(url => {
          setQrDataUrl(url);
          setLoading(false);
        })
        .catch(err => {
          console.error('QR generation error:', err);
          setLoading(false);
        });
    }
  }, [open, tngliId, fullUrl, isVictorian]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      toast({ title: 'Copied!', description: 'tng.li URL copied to clipboard' });
    } catch {
      toast({ title: 'Failed to copy', variant: 'destructive' });
    }
  };

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.download = `tngly-${tngliId}.png`;
    link.href = qrDataUrl;
    link.click();
    toast({ title: 'Downloaded!', description: 'QR code saved to your device' });
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title || 'TingOs Thing',
          text: `Check out this Thing: ${title || tngliId}`,
          url: fullUrl,
        });
      } catch {
        handleCopy();
      }
    } else {
      handleCopy();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(
        "max-w-sm",
        isVictorian 
          ? "bg-gradient-to-br from-amber-950 to-amber-900 border-amber-700/50" 
          : "bg-gradient-to-br from-slate-950 to-slate-900 border-purple-500/30"
      )}>
        <DialogHeader>
          <DialogTitle className={cn(
            "flex items-center gap-2",
            isVictorian ? "font-serif text-amber-100" : "text-white"
          )}>
            <QrCode className={cn(
              "w-5 h-5",
              isVictorian ? "text-amber-500" : "text-purple-400"
            )} />
            Scan to Access
          </DialogTitle>
          <DialogDescription className={isVictorian ? "text-amber-300/60" : "text-zinc-400"}>
            {title || 'This Thing'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-4">
          <div className={cn(
            "relative p-4 rounded-xl",
            isVictorian 
              ? "bg-amber-900/50 border-2 border-amber-600/30" 
              : "bg-black/50 border-2 border-purple-500/30 shadow-[0_0_30px_rgba(168,85,247,0.2)]"
          )}>
            {loading ? (
              <div className="w-[280px] h-[280px] flex items-center justify-center">
                <div className={cn(
                  "w-8 h-8 border-2 rounded-full animate-spin",
                  isVictorian 
                    ? "border-amber-500/30 border-t-amber-500" 
                    : "border-purple-500/30 border-t-purple-500"
                )} />
              </div>
            ) : (
              <motion.img
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                src={qrDataUrl}
                alt={`QR code for ${tngliId}`}
                className="rounded-lg"
              />
            )}
            
            <div className={cn(
              "absolute -bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-mono",
              isVictorian 
                ? "bg-amber-800 text-amber-200 border border-amber-600/50" 
                : "bg-purple-900 text-purple-200 border border-purple-500/50"
            )}>
              tng.li/{tngliId}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
            <Badge variant="outline" className={cn(
              "gap-1 text-[10px]",
              isVictorian ? "border-amber-600/50 text-amber-400" : "border-cyan-500/30 text-cyan-400"
            )}>
              <Smartphone className="w-3 h-3" />
              Mobile Ready
            </Badge>
            <Badge variant="outline" className={cn(
              "gap-1 text-[10px]",
              isVictorian ? "border-amber-600/50 text-amber-400" : "border-fuchsia-500/30 text-fuchsia-400"
            )}>
              <Wifi className="w-3 h-3" />
              IoT Compatible
            </Badge>
            <Badge variant="outline" className={cn(
              "gap-1 text-[10px]",
              isVictorian ? "border-amber-600/50 text-amber-400" : "border-green-500/30 text-green-400"
            )}>
              <Globe className="w-3 h-3" />
              Universal
            </Badge>
          </div>

          <div className={cn(
            "w-full p-3 rounded-lg text-center font-mono text-sm",
            isVictorian 
              ? "bg-amber-950/50 text-amber-200 border border-amber-700/30" 
              : "bg-slate-900/50 text-purple-200 border border-white/10"
          )}>
            {fullUrl}
          </div>

          <div className="flex gap-2 w-full">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className={cn(
                "flex-1 gap-1",
                isVictorian 
                  ? "border-amber-600/50 text-amber-300 hover:bg-amber-800/30" 
                  : "border-purple-500/30 text-purple-300 hover:bg-purple-900/30"
              )}
              data-testid="btn-copy-tngly"
            >
              <Copy className="w-4 h-4" />
              Copy
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className={cn(
                "flex-1 gap-1",
                isVictorian 
                  ? "border-amber-600/50 text-amber-300 hover:bg-amber-800/30" 
                  : "border-cyan-500/30 text-cyan-300 hover:bg-cyan-900/30"
              )}
              data-testid="btn-download-qr"
            >
              <Download className="w-4 h-4" />
              Save
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
              className={cn(
                "flex-1 gap-1",
                isVictorian 
                  ? "border-amber-600/50 text-amber-300 hover:bg-amber-800/30" 
                  : "border-fuchsia-500/30 text-fuchsia-300 hover:bg-fuchsia-900/30"
              )}
              data-testid="btn-share-tngly"
            >
              <Share2 className="w-4 h-4" />
              Share
            </Button>
          </div>

          <a 
            href={fullUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="w-full"
          >
            <Button
              className={cn(
                "w-full gap-2",
                isVictorian 
                  ? "bg-amber-700 hover:bg-amber-600 text-white" 
                  : "bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700"
              )}
              data-testid="btn-open-tngly"
            >
              <ExternalLink className="w-4 h-4" />
              Open in New Tab
            </Button>
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface TngliLinkProps {
  tngliId: string;
  title?: string;
  showFull?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function TngliLink({ tngliId, title, showFull = false, size = 'sm', className }: TngliLinkProps) {
  const { themeVariant } = useTheme();
  const isVictorian = themeVariant === 'victorian';
  const [showQR, setShowQR] = useState(false);

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const buttonSizes = {
    sm: 'h-6 px-1.5 text-[10px]',
    md: 'h-7 px-2 text-xs',
    lg: 'h-8 px-2.5 text-sm',
  };

  return (
    <>
      <button
        onClick={() => setShowQR(true)}
        className={cn(
          "inline-flex items-center gap-1 rounded font-mono transition-all",
          buttonSizes[size],
          isVictorian 
            ? "bg-amber-900/30 border border-amber-700/30 text-amber-400 hover:bg-amber-800/40 hover:border-amber-600/50" 
            : "bg-purple-950/30 border border-purple-500/20 text-purple-400 hover:bg-purple-900/40 hover:border-purple-400/40 hover:shadow-[0_0_10px_rgba(168,85,247,0.2)]",
          className
        )}
        title="Show QR Code"
        data-testid={`tngly-link-${tngliId}`}
      >
        <QrCode className={iconSizes[size]} />
        {showFull ? (
          <span>tng.li/{tngliId}</span>
        ) : (
          <span>{tngliId.slice(0, 8)}...</span>
        )}
      </button>

      <QRCodePopup
        tngliId={tngliId}
        title={title}
        open={showQR}
        onOpenChange={setShowQR}
      />
    </>
  );
}

interface QRIconButtonProps {
  tngliId: string;
  title?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function QRIconButton({ tngliId, title, size = 'sm', className }: QRIconButtonProps) {
  const { themeVariant } = useTheme();
  const isVictorian = themeVariant === 'victorian';
  const [showQR, setShowQR] = useState(false);

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const buttonSizes = {
    sm: 'h-6 w-6',
    md: 'h-7 w-7',
    lg: 'h-8 w-8',
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setShowQR(true)}
        className={cn(
          buttonSizes[size],
          isVictorian 
            ? "text-amber-500/60 hover:text-amber-400 hover:bg-amber-800/30" 
            : "text-purple-400/60 hover:text-purple-300 hover:bg-purple-900/30",
          className
        )}
        title="Show QR Code"
        aria-label="Show QR Code for this Thing"
        data-testid={`qr-btn-${tngliId}`}
      >
        <QrCode className={iconSizes[size]} />
      </Button>

      <QRCodePopup
        tngliId={tngliId}
        title={title}
        open={showQR}
        onOpenChange={setShowQR}
      />
    </>
  );
}
