import React from 'react';

interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

const ErrorIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
);

const ErrorState: React.FC<ErrorStateProps> = ({ message, onRetry }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-red-900/20 border border-red-500/30 rounded-lg w-full">
      <ErrorIcon />
      <p className="text-xl font-semibold text-red-300 mb-3">{message}</p>
      <div className="text-left text-slate-400 space-y-2 mb-6 max-w-md">
        <p className="font-semibold text-slate-300">Một vài gợi ý:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Hãy thử sử dụng câu lệnh đơn giản và rõ ràng hơn.</li>
          <li>Kiểm tra lại để chắc chắn rằng tất cả các ảnh đã được tải lên đúng cách.</li>
          <li>Đôi khi API có thể bị quá tải, hãy chờ một lát rồi thử lại.</li>
          <li>Đảm bảo kết nối mạng của bạn ổn định.</li>
        </ul>
      </div>
      <button
        onClick={onRetry}
        className="font-bold py-2 px-6 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105"
      >
        Thử lại
      </button>
    </div>
  );
};

export default ErrorState;
