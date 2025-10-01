import React, { useRef, useCallback } from 'react';
import type { ImageFile } from '../types';
import ToggleSwitch from './ToggleSwitch';

interface ImageUploaderProps {
  id: string;
  label: string;
  image: ImageFile | null;
  onImageChange: (file: File | null) => void;
  isCharacterUploader?: boolean;
  removeBg?: boolean;
  onRemoveBgChange?: (checked: boolean) => void;
  useOnlyStyle?: boolean;
  onUseOnlyStyleChange?: (checked: boolean) => void;
}

const UploadIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10 text-gray-500 mb-2">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" x2="12" y1="3" y2="15" />
  </svg>
);

const ImageUploader: React.FC<ImageUploaderProps> = ({ 
    id, 
    label, 
    image, 
    onImageChange,
    isCharacterUploader = false,
    removeBg,
    onRemoveBgChange = () => {},
    useOnlyStyle,
    onUseOnlyStyleChange = () => {},
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      onImageChange(event.target.files[0]);
    }
  };

  const handleRemoveImage = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onImageChange(null);
    if(inputRef.current) {
        inputRef.current.value = "";
    }
  }, [onImageChange]);

  return (
    <div className="w-full">
      <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-2">{label}</label>
      <div
        onClick={() => inputRef.current?.click()}
        className="relative aspect-square w-full bg-slate-800/50 rounded-lg border-2 border-dashed border-gray-600 hover:border-blue-500 transition-colors duration-300 flex items-center justify-center cursor-pointer overflow-hidden group"
      >
        <input
          type="file"
          id={id}
          ref={inputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/png, image/jpeg, image/webp"
        />
        {image ? (
          <>
            <img src={image.preview} alt={label} className="w-full h-full object-cover" loading="lazy" />
            <div 
                onClick={handleRemoveImage}
                className="absolute top-2 right-2 w-7 h-7 bg-black/60 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
            >
                &#x2715;
            </div>
          </>
        ) : (
          <div className="text-center">
            <UploadIcon />
            <p className="text-xs text-gray-400">Tải ảnh lên</p>
          </div>
        )}
      </div>
      {image && isCharacterUploader && (
        <div className="space-y-3 mt-3 bg-slate-800/60 p-3 rounded-lg border border-slate-700">
           <ToggleSwitch 
              id={`${id}-remove-bg`} 
              label="Xoá nền ảnh" 
              checked={removeBg || false} 
              onChange={onRemoveBgChange} 
           />
           <ToggleSwitch 
              id={`${id}-remove-char`} 
              label="Xoá nhân vật" 
              checked={useOnlyStyle || false} 
              onChange={onUseOnlyStyleChange} 
           />
        </div>
      )}
    </div>
  );
};

export default ImageUploader;