import React, { useState, useEffect } from 'react';

const loadingMessages = [
  "Đang triệu hồi các nghệ sĩ AI...",
  "Đang pha trộn màu sắc kỹ thuật số...",
  "Đang tập trung ống kính sáng tạo...",
  "Các pixel đang được sắp xếp...",
  "Một chút ma thuật AI đang diễn ra...",
];

const LoadingState: React.FC = () => {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setMessageIndex((prevIndex) => (prevIndex + 1) % loadingMessages.length);
    }, 2500);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
       <svg className="animate-spin h-12 w-12 text-blue-400 mb-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <p className="text-xl font-semibold text-white mb-2">Đang tạo hình ảnh của bạn...</p>
      <p className="text-gray-400 transition-opacity duration-500">{loadingMessages[messageIndex]}</p>
    </div>
  );
};

export default LoadingState;
