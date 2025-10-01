import React, { useState, useRef, useLayoutEffect, useCallback } from 'react';

interface ImageViewerModalProps {
  imageSrc: string | null;
  onClose: () => void;
}

const ZoomInIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line>
  </svg>
);

const ZoomOutIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="8" y1="11" x2="14" y2="11"></line>
  </svg>
);

const ResetZoomIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="m21 3-7 7"/><path d="m3 21 7-7"/>
    </svg>
);

const MIN_SCALE = 0.1;
const MAX_SCALE = 8;

const ImageViewerModal: React.FC<ImageViewerModalProps> = ({ imageSrc, onClose }) => {
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [initialTransform, setInitialTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);
  const [isPanning, setIsPanning] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const panStartRef = useRef({ x: 0, y: 0, transformX: 0, transformY: 0 });

  const clampPosition = useCallback((pos: { x: number; y: number }, scale: number) => {
    if (!imageSize || !modalRef.current) return pos;

    const modal = modalRef.current.getBoundingClientRect();
    const scaledWidth = imageSize.width * scale;
    const scaledHeight = imageSize.height * scale;
    const newPos = { ...pos };

    if (scaledWidth <= modal.width) {
      newPos.x = (modal.width - scaledWidth) / 2;
    } else {
      newPos.x = Math.max(modal.width - scaledWidth, Math.min(0, newPos.x));
    }

    if (scaledHeight <= modal.height) {
      newPos.y = (modal.height - scaledHeight) / 2;
    } else {
      newPos.y = Math.max(modal.height - scaledHeight, Math.min(0, newPos.y));
    }
    
    return newPos;
  }, [imageSize]);

  const fitView = useCallback(() => {
    if (!imageSize || !modalRef.current) return;
    
    const modal = modalRef.current.getBoundingClientRect();
    const scaleX = modal.width / imageSize.width;
    const scaleY = modal.height / imageSize.height;
    const newScale = Math.min(scaleX, scaleY, 1);
    
    const newPos = {
      x: (modal.width - imageSize.width * newScale) / 2,
      y: (modal.height - imageSize.height * newScale) / 2,
    };

    const newTransform = { ...newPos, scale: newScale };
    setTransform(newTransform);
    setInitialTransform(newTransform);
  }, [imageSize]);
  
  const handleZoom = useCallback((delta: number, clientX?: number, clientY?: number) => {
    if (!modalRef.current) return;

    const modal = modalRef.current.getBoundingClientRect();
    const zoomPoint = {
      x: clientX ? clientX - modal.left : modal.width / 2,
      y: clientY ? clientY - modal.top : modal.height / 2,
    };
    
    const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, transform.scale * delta));
    
    const imagePoint = {
      x: (zoomPoint.x - transform.x) / transform.scale,
      y: (zoomPoint.y - transform.y) / transform.scale,
    };
    
    const newPos = {
      x: zoomPoint.x - imagePoint.x * newScale,
      y: zoomPoint.y - imagePoint.y * newScale,
    };
    
    setTransform({ ...clampPosition(newPos, newScale), scale: newScale });
  }, [transform, clampPosition]);

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    handleZoom(e.deltaY > 0 ? 0.9 : 1.1, e.clientX, e.clientY);
  }, [handleZoom]);
  
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();

    const modalBounds = modalRef.current?.getBoundingClientRect();
    const isPannable = imageSize && modalBounds && (
        imageSize.width * transform.scale > modalBounds.width + 1 ||
        imageSize.height * transform.scale > modalBounds.height + 1
    );

    if (!isPannable) return;

    setIsPanning(true);
    panStartRef.current = { x: e.clientX, y: e.clientY, transformX: transform.x, transformY: transform.y };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const dx = moveEvent.clientX - panStartRef.current.x;
      const dy = moveEvent.clientY - panStartRef.current.y;
      const newPos = {
        x: panStartRef.current.transformX + dx,
        y: panStartRef.current.transformY + dy,
      };
      setTransform(prev => ({ ...clampPosition(newPos, prev.scale), scale: prev.scale }));
    };

    const handleMouseUp = () => {
      setIsPanning(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  useLayoutEffect(() => {
    if (!imageSrc) {
      setImageSize(null);
      return;
    }
    const img = new Image();
    img.src = `data:image/png;base64,${imageSrc}`;
    img.onload = () => {
      setImageSize({ width: img.naturalWidth, height: img.naturalHeight });
    };
  }, [imageSrc]);

  useLayoutEffect(() => {
    fitView();
    window.addEventListener('resize', fitView);
    return () => window.removeEventListener('resize', fitView);
  }, [fitView]);
  
  useLayoutEffect(() => {
    const modalElement = modalRef.current;
    if (modalElement) {
      modalElement.addEventListener('wheel', handleWheel, { passive: false });
      return () => modalElement.removeEventListener('wheel', handleWheel);
    }
  }, [handleWheel]);

  if (!imageSrc) return null;

  const modalBounds = modalRef.current?.getBoundingClientRect();
  const isPannable = imageSize && modalBounds && (
      imageSize.width * transform.scale > modalBounds.width + 1 ||
      imageSize.height * transform.scale > modalBounds.height + 1
  );
  const cursorClass = isPanning ? 'cursor-grabbing' : (isPannable ? 'cursor-grab' : 'cursor-default');

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-fade-in"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        ref={modalRef}
        className="relative w-full h-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={handleMouseDown}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-10 h-10 bg-slate-800 border border-slate-600 rounded-full flex items-center justify-center text-white text-2xl hover:bg-slate-700 transition-colors z-20"
          aria-label="Đóng trình xem ảnh"
        >
          &times;
        </button>

        <img
          ref={imageRef}
          src={`data:image/png;base64,${imageSrc}`}
          alt="Generated image enlarged"
          className={`max-w-none max-h-none rounded ${cursorClass}`}
          style={{
            transform: `translate3d(${transform.x}px, ${transform.y}px, 0) scale(${transform.scale})`,
            transition: isPanning ? 'none' : 'transform 0.2s cubic-bezier(0.25, 1, 0.5, 1)',
            visibility: imageSize ? 'visible' : 'hidden',
            transformOrigin: '0 0',
          }}
          loading="lazy"
        />
        
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 bg-slate-900/70 backdrop-blur-sm p-2 rounded-full flex items-center gap-2 border border-slate-700 z-10">
          <button
            onClick={() => handleZoom(0.8)}
            disabled={transform.scale <= MIN_SCALE}
            className="p-2 rounded-full text-white hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Thu nhỏ"
          >
            <ZoomOutIcon />
          </button>
          <button
            onClick={fitView}
            className="p-2 rounded-full text-white hover:bg-slate-700 transition-colors"
            aria-label="Đặt lại kích thước"
          >
            <ResetZoomIcon />
          </button>
          <button
            onClick={() => handleZoom(1.2)}
            disabled={transform.scale >= MAX_SCALE}
            className="p-2 rounded-full text-white hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Phóng to"
          >
            <ZoomInIcon />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageViewerModal;