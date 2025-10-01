import React, { useState, useCallback } from 'react';
import type { ImageFile } from './types';
import ImageUploader from './components/ImageUploader';
import LoadingState from './components/LoadingState';
import ImageViewerModal from './components/ImageViewerModal';
import ErrorState from './components/ErrorState';
import { generateCharacterImages } from './services/geminiService';
import ToggleSwitch from './components/ToggleSwitch';

const DownloadIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" />
    </svg>
);

const getAspectRatioClass = (ratio: '1:1' | '16:9' | '9:16') => {
  switch (ratio) {
    case '16:9': return 'aspect-video';
    case '9:16': return 'aspect-[9/16]';
    case '1:1':
    default:
      return 'aspect-square';
  }
};

interface CharacterSlot {
    id: string;
    label: string;
    image: ImageFile | null;
    removeBg: boolean;
    useOnlyStyle: boolean; // Corresponds to "Xoá nhân vật"
}

function App() {
  const [characterSlots, setCharacterSlots] = useState<CharacterSlot[]>([
    { id: 'char-1', label: 'Ảnh 1', image: null, removeBg: false, useOnlyStyle: false },
    { id: 'char-2', label: 'Ảnh 2', image: null, removeBg: false, useOnlyStyle: false },
    { id: 'char-3', label: 'Ảnh 3', image: null, removeBg: false, useOnlyStyle: false },
    { id: 'char-4', label: 'Ảnh 4', image: null, removeBg: false, useOnlyStyle: false },
  ]);

  const [background, setBackground] = useState<ImageFile | null>(null);
  const [removeBackgroundBg, setRemoveBackgroundBg] = useState<boolean>(false);
  const [prompt, setPrompt] = useState<string>('');
  const [resolution, setResolution] = useState<'2k' | '4k'>('2k');
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '16:9' | '9:16'>('1:1');
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleSlotUpdate = useCallback((id: string, newValues: Partial<CharacterSlot>) => {
    setCharacterSlots(prevSlots =>
      prevSlots.map(slot =>
        slot.id === id ? { ...slot, ...newValues } : slot
      )
    );
  }, []);

  const handleCharacterImageChange = useCallback((id: string) => (file: File | null) => {
    handleSlotUpdate(id, { image: file ? { file, preview: URL.createObjectURL(file) } : null });
  }, [handleSlotUpdate]);
  
  const handleBackgroundImageChange = useCallback((file: File | null) => {
    setBackground(file ? { file, preview: URL.createObjectURL(file) } : null);
    if (!file) {
      setRemoveBackgroundBg(false);
    }
  }, []);
  
  const handleGenerate = async () => {
    setError(null);
    
    const activeCharacterSlots = characterSlots.filter(slot => slot.image);
    const characterImages = activeCharacterSlots.map(slot => slot.image!);

    // The order of images passed to the model must match the prompt instructions.
    // Character images first, then background.
    const allImages: ImageFile[] = [...characterImages, background].filter((img): img is ImageFile => img !== null);
    
    if (allImages.length === 0) {
      setError("Vui lòng tải lên ít nhất một hình ảnh tham chiếu.");
      return;
    }
    if (!prompt.trim()) {
      setError("Vui lòng nhập câu lệnh.");
      return;
    }

    setIsLoading(true);
    setGeneratedImages([]);

    try {
      let finalPrompt = prompt;
      
      const characterImageInstructions = activeCharacterSlots
        .map((slot, index) => {
          const instructionsForSlot: string[] = [];
          if (slot.removeBg) {
            instructionsForSlot.push("remove the background");
          }
          if (slot.useOnlyStyle) {
            instructionsForSlot.push("use only the style (e.g., clothing, aesthetic), not the person's face or body");
          }

          if (instructionsForSlot.length > 0) {
            // Reference images are 1-indexed for clarity in the prompt.
            return `For reference image ${index + 1}: ${instructionsForSlot.join(' and ')}.`;
          }
          return null;
        })
        .filter((instruction): instruction is string => instruction !== null);

      const allInstructions = [...characterImageInstructions];

      if (background && removeBackgroundBg) {
        const bgImageIndex = activeCharacterSlots.length + 1;
        allInstructions.push(`For reference image ${bgImageIndex} (the background image): remove its background.`);
      }

      if (allInstructions.length > 0) {
        const instructionPrefix = `Please follow these instructions for the provided reference images: ${allInstructions.join(' ')}`;
        finalPrompt = `${instructionPrefix}. After applying these changes, create an image based on the following prompt: ${prompt}`;
      }

      const images = await generateCharacterImages(finalPrompt, allImages, resolution, aspectRatio);
      setGeneratedImages(images);
    } catch (err) {
      console.error("Image generation error:", err);
      setError("Ối, đã có lỗi xảy ra trong quá trình tạo ảnh. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };
  
  const downloadImage = (base64Image: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = `data:image/png;base64,${base64Image}`;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadAll = () => {
    generatedImages.forEach((img, index) => {
      downloadImage(img, `generated_image_${index + 1}.png`);
    });
  };

  return (
    <>
      <div className="min-h-screen bg-slate-900 text-white p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <header className="text-center mb-8">
            <h1 className="text-4xl sm:text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500 pb-2">
              Ghép nhân vật đồng nhất
            </h1>
            <p className="text-slate-400">Cung cấp bởi tambmt</p>
          </header>

          <main className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column: Controls */}
            <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
              <div className="grid grid-cols-2 gap-4 mb-4">
                {characterSlots.map((slot) => (
                  <ImageUploader
                    key={slot.id}
                    id={slot.id}
                    label={slot.label}
                    image={slot.image}
                    onImageChange={handleCharacterImageChange(slot.id)}
                    isCharacterUploader={true}
                    removeBg={slot.removeBg}
                    onRemoveBgChange={(checked) => handleSlotUpdate(slot.id, { removeBg: checked })}
                    useOnlyStyle={slot.useOnlyStyle}
                    onUseOnlyStyleChange={(checked) => handleSlotUpdate(slot.id, { useOnlyStyle: checked })}
                  />
                ))}
              </div>
              <div className="mb-4">
                 <ImageUploader id="background" label="Bối cảnh tham chiếu" image={background} onImageChange={handleBackgroundImageChange} />
                 {background && (
                    <div className="space-y-3 mt-3 bg-slate-800/60 p-3 rounded-lg border border-slate-700">
                        <ToggleSwitch
                            id="bg-remove-bg"
                            label="Xoá nền ảnh nền"
                            checked={removeBackgroundBg}
                            onChange={setRemoveBackgroundBg}
                        />
                    </div>
                 )}
              </div>
              <div className="mb-4">
                <label htmlFor="prompt" className="block text-sm font-medium text-gray-300 mb-2">Câu lệnh</label>
                <textarea
                  id="prompt"
                  rows={4}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  placeholder="Mô tả nhân vật hoặc bối cảnh bạn muốn tạo..."
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6 mb-6">
                 <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Chất lượng</label>
                    <div className="flex items-center space-x-4">
                    {(['2k', '4k'] as const).map(res => (
                        <div key={res} className="flex items-center">
                        <input
                            id={`res-${res}`}
                            type="radio"
                            name="resolution"
                            value={res}
                            checked={resolution === res}
                            onChange={() => setResolution(res)}
                            className="h-4 w-4 text-blue-600 bg-gray-700 border-gray-600 focus:ring-blue-500"
                        />
                        <label htmlFor={`res-${res}`} className="ml-2 block text-sm text-gray-300">
                            {res === '2k' ? 'Chuẩn 2K' : 'Chuẩn 4K'}
                        </label>
                        </div>
                    ))}
                    </div>
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Tỉ lệ</label>
                    <div className="flex items-center space-x-2">
                    {(['1:1', '16:9', '9:16'] as const).map(ratio => (
                        <button
                        key={ratio}
                        type="button"
                        onClick={() => setAspectRatio(ratio)}
                        className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-colors duration-200 ${
                            aspectRatio === ratio 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                        }`}
                        >
                        {ratio}
                        </button>
                    ))}
                    </div>
                </div>
              </div>
              <button
                onClick={handleGenerate}
                disabled={isLoading}
                className="w-full font-bold py-3 px-4 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105"
              >
                {isLoading ? 'Đang tạo...' : 'Tạo ảnh'}
              </button>
            </div>

            {/* Right Column: Results */}
            <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 min-h-[400px] flex flex-col">
              <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-gray-200">Kết quả</h2>
                  {generatedImages.length > 0 && !error && !isLoading && (
                      <button onClick={downloadAll} className="flex items-center gap-2 text-sm bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
                          <DownloadIcon />
                          Tải tất cả
                      </button>
                  )}
              </div>
              <div className="flex-grow flex items-center justify-center">
                {isLoading ? (
                  <LoadingState />
                ) : error ? (
                  <ErrorState message={error} onRetry={handleGenerate} />
                ) : generatedImages.length > 0 ? (
                  <div className="w-full grid grid-cols-2 gap-4">
                    {generatedImages.map((imgSrc, index) => (
                      <div
                        key={index}
                        className={`relative group ${getAspectRatioClass(aspectRatio)} rounded-lg overflow-hidden cursor-pointer bg-slate-900`}
                        onClick={() => setSelectedImage(imgSrc)}
                        role="button"
                        tabIndex={0}
                        aria-label={`Xem ảnh ${index + 1} phóng to`}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setSelectedImage(imgSrc); }}
                      >
                        <img src={`data:image/png;base64,${imgSrc}`} alt={`Generated image ${index + 1}`} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                        </div>
                         <button
                           onClick={(e) => {
                             e.stopPropagation();
                             downloadImage(imgSrc, `generated_image_${index + 1}.png`)
                           }}
                           className="absolute bottom-2 right-2 bg-black/60 p-2 rounded-full text-white opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-black/80"
                           aria-label={`Tải xuống ảnh ${index + 1}`}
                         >
                          <DownloadIcon />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-slate-500">
                    <p>Kết quả sẽ xuất hiện ở đây</p>
                  </div>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
      <ImageViewerModal imageSrc={selectedImage} onClose={() => setSelectedImage(null)} />
    </>
  );
}

export default App;
