// src/components/ViewerToolbar.tsx
import React from 'react';
import { FiChevronLeft, FiChevronRight, FiZoomIn, FiZoomOut, FiMaximize } from 'react-icons/fi';

type Props = {
  onNext: () => void;
  onPrev: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFullscreen: () => void;
  currentPage: number;
  pageCount: number;
};

const ViewerToolbar: React.FC<Props> = ({ onNext, onPrev, onZoomIn, onZoomOut, onFullscreen, currentPage, pageCount }) => {
  return (
    <div className="flex items-center gap-3">
      <div className="hidden sm:flex items-center gap-2 bg-white/60 backdrop-blur-sm rounded-full p-1 shadow-sm border border-pink-50">
        <button onClick={onPrev} aria-label="Prev" className="p-2 rounded-full hover:bg-pink-50 text-pink-600">
          <FiChevronLeft />
        </button>

        <div className="px-3 text-sm font-medium text-pink-700">
          {currentPage} / {pageCount || '-'}
        </div>

        <button onClick={onNext} aria-label="Next" className="p-2 rounded-full hover:bg-pink-50 text-pink-600">
          <FiChevronRight />
        </button>
      </div>

      <div className="flex items-center gap-1 bg-white/60 backdrop-blur-sm rounded-full p-1 shadow-sm border border-pink-50">
        <button onClick={onZoomOut} aria-label="Zoom Out" className="p-2 rounded-full hover:bg-pink-50 text-pink-600">
          <FiZoomOut />
        </button>
        <button onClick={onZoomIn} aria-label="Zoom In" className="p-2 rounded-full hover:bg-pink-50 text-pink-600">
          <FiZoomIn />
        </button>
      </div>

      <button onClick={onFullscreen} className="flex items-center gap-2 bg-pink-600 text-white px-3 py-2 rounded-full shadow hover:opacity-95">
        <FiMaximize />
        <span className="hidden sm:block text-sm">Fullscreen</span>
      </button>
    </div>
  );
};

export default ViewerToolbar;
