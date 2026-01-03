export const SNAP_THRESHOLD = 24;

export interface SnapResult {
  x: number;
  y: number;
  snappedX: 'left' | 'center' | 'right' | null;
  snappedY: 'top' | 'center' | 'bottom' | null;
  snapLineX: number | null;
  snapLineY: number | null;
}

export function calculateSnap(
  posX: number,
  posY: number,
  width: number,
  height: number,
  containerWidth: number,
  containerHeight: number
): SnapResult {
  let snappedX = posX;
  let snappedY = posY;
  let snapTypeX: 'left' | 'center' | 'right' | null = null;
  let snapTypeY: 'top' | 'center' | 'bottom' | null = null;
  let snapLineX: number | null = null;
  let snapLineY: number | null = null;

  const panelCenterX = posX + width / 2;
  const panelCenterY = posY + height / 2;
  const containerCenterX = containerWidth / 2;
  const containerCenterY = containerHeight / 2;

  if (Math.abs(posX) < SNAP_THRESHOLD) {
    snappedX = 0;
    snapTypeX = 'left';
    snapLineX = 0;
  } else if (Math.abs(posX + width - containerWidth) < SNAP_THRESHOLD) {
    snappedX = containerWidth - width;
    snapTypeX = 'right';
    snapLineX = containerWidth;
  } else if (Math.abs(panelCenterX - containerCenterX) < SNAP_THRESHOLD) {
    snappedX = containerCenterX - width / 2;
    snapTypeX = 'center';
    snapLineX = containerCenterX;
  }

  if (Math.abs(posY) < SNAP_THRESHOLD) {
    snappedY = 0;
    snapTypeY = 'top';
    snapLineY = 0;
  } else if (Math.abs(posY + height - containerHeight) < SNAP_THRESHOLD) {
    snappedY = containerHeight - height;
    snapTypeY = 'bottom';
    snapLineY = containerHeight;
  } else if (Math.abs(panelCenterY - containerCenterY) < SNAP_THRESHOLD) {
    snappedY = containerCenterY - height / 2;
    snapTypeY = 'center';
    snapLineY = containerCenterY;
  }

  return { x: snappedX, y: snappedY, snappedX: snapTypeX, snappedY: snapTypeY, snapLineX, snapLineY };
}

export const bounceTransition = {
  type: "spring" as const,
  stiffness: 500,
  damping: 25,
  mass: 0.8,
};
