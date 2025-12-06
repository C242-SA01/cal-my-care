// src/components/FlipbookViewer.tsx
import React, { useCallback, useEffect, useRef, useState } from 'react';
import HTMLFlipBook from 'react-pageflip';
import { getDocument, GlobalWorkerOptions, PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist/legacy/build/pdf';
import pdfWorker from 'pdfjs-dist/build/pdf.worker?url';
import ViewerToolbar from '../ViewerToolbar';

GlobalWorkerOptions.workerSrc = pdfWorker as unknown as string;

type Props = {
  pdfUrl: string | null;
  title?: string;
  cover?: string | null;
  className?: string;
  // optional maxHeight to respect modal height
  maxViewerHeight?: number | null;
};

type PageImageMap = Record<number, string | null>;

const FlipbookViewer: React.FC<Props> = ({ pdfUrl, title = 'E-Module', cover = null, className = '', maxViewerHeight = null }) => {
  const flipRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [pageImages, setPageImages] = useState<PageImageMap>({});
  const [loadingPages, setLoadingPages] = useState<Record<number, boolean>>({});
  const [currentSheet, setCurrentSheet] = useState<number>(0);
  const [scale, setScale] = useState<number>(1.0);

  // responsive container size
  const [containerSize, setContainerSize] = useState({ width: 900, height: 1100 });
  const measure = useCallback(() => {
    const el = containerRef.current;
    const safeWidth = Math.min(window.innerWidth - 48, 1360); // leave some page margin
    if (!el) {
      // default fallback
      setContainerSize((s) => ({ ...s, width: safeWidth }));
      return;
    }
    const width = el.clientWidth || safeWidth;
    // determine height from width to keep A4-ish ratio; for single page we use higher ratio
    const isMobile = width < 640;
    const pageWidth = isMobile ? width - 16 : Math.max(420, Math.floor(width / 1.6));
    const height = Math.min(window.innerHeight * 0.78, Math.max(480, Math.floor(pageWidth * 1.33)));
    setContainerSize({ width, height: maxViewerHeight ? Math.min(height, maxViewerHeight) : height });
  }, [maxViewerHeight]);

  useEffect(() => {
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [measure]);

  // load pdf
  useEffect(() => {
    let cancelled = false;
    if (!pdfUrl) {
      setPdfDoc(null);
      setNumPages(0);
      setPageImages({});
      return;
    }

    setPdfDoc(null);
    setNumPages(0);
    setPageImages({});
    setLoadingPages({});

    (async () => {
      try {
        const pdf = await getDocument({ url: pdfUrl }).promise;
        if (cancelled) return;
        setPdfDoc(pdf);
        setNumPages(pdf.numPages);
        if (cover) setPageImages((p) => ({ ...p, 1: cover }));
      } catch (err: any) {
        console.error('PDF load error:', err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [pdfUrl, cover]);

  // render single page to image
  const renderPageToImage = useCallback(
    async (pageNumber: number, scaleOverride?: number) => {
      if (!pdfDoc) return null;
      if (pageImages[pageNumber]) return pageImages[pageNumber];
      if (loadingPages[pageNumber]) return null;

      setLoadingPages((s) => ({ ...s, [pageNumber]: true }));
      try {
        const page: PDFPageProxy = await pdfDoc.getPage(pageNumber);
        const scaleToUse = scaleOverride ?? scale;
        const viewport = page.getViewport({ scale: scaleToUse });
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(viewport.width);
        canvas.height = Math.round(viewport.height);
        const ctx = canvas.getContext('2d', { alpha: false })!;
        await page.render({ canvasContext: ctx, viewport }).promise;
        const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
        setPageImages((p) => ({ ...p, [pageNumber]: dataUrl }));
        setLoadingPages((s) => ({ ...s, [pageNumber]: false }));
        return dataUrl;
      } catch (err) {
        console.error('render page failed', pageNumber, err);
        setLoadingPages((s) => ({ ...s, [pageNumber]: false }));
        return null;
      }
    },
    [pdfDoc, pageImages, scale, loadingPages]
  );

  // lazy-load window
  useEffect(() => {
    if (!pdfDoc || numPages <= 0) return;
    const visible = currentSheet + 1;
    const toLoad = new Set<number>([visible]);
    if (visible - 1 >= 1) toLoad.add(visible - 1);
    if (visible + 1 <= numPages) toLoad.add(visible + 1);
    if (visible + 2 <= numPages) toLoad.add(visible + 2);

    toLoad.forEach((p) => {
      if (!pageImages[p] && !loadingPages[p]) renderPageToImage(p).catch(() => {});
    });
  }, [currentSheet, pdfDoc, numPages, pageImages, loadingPages, renderPageToImage]);

  // flip handler
  const onFlip = (e: any) => setCurrentSheet(e.data);

  // toolbar actions
  const goPrev = () => flipRef.current?.pageFlip()?.flipPrev();
  const goNext = () => flipRef.current?.pageFlip()?.flipNext();
  const zoomIn = () => {
    const newScale = Math.min(2.2, +(scale + 0.2).toFixed(2));
    setScale(newScale);
    const p = currentSheet + 1;
    [p, p - 1, p + 1].forEach((pg) => {
      if (pg >= 1 && pg <= numPages) renderPageToImage(pg, newScale).catch(() => {});
    });
  };
  const zoomOut = () => {
    const newScale = Math.max(0.7, +(scale - 0.2).toFixed(2));
    setScale(newScale);
    const p = currentSheet + 1;
    [p, p - 1, p + 1].forEach((pg) => {
      if (pg >= 1 && pg <= numPages) renderPageToImage(pg, newScale).catch(() => {});
    });
  };

  const toggleFullscreen = async () => {
    const root = containerRef.current;
    if (!root) return;
    if (!document.fullscreenElement) await root.requestFullscreen().catch(() => {});
    else await document.exitFullscreen().catch(() => {});
  };

  // computed sizes for flipbook
  const isMobile = containerSize.width < 640;
  // If mobile -> show single page occupying most width; else two-page spread width ~ half container
  const pageRenderWidth = isMobile ? Math.max(320, containerSize.width - 36) : Math.max(380, Math.floor(containerSize.width / 2) - 16);
  const flipWidthProp = pageRenderWidth;
  const flipHeightProp = Math.min(containerSize.height, maxViewerHeight ?? containerSize.height);

  // page element
  const renderPageElement = (pageNumber: number) => {
    const img = pageImages[pageNumber];
    const loading = !!loadingPages[pageNumber];
    return (
      <div key={`page-${pageNumber}`} className="flex items-center justify-center w-full h-full p-4" data-density="soft">
        <div className="w-full h-full max-h-[calc(100vh-220px)] bg-white rounded-xl overflow-hidden shadow-soft-lg border border-pink-50 flex items-center justify-center">
          {img ? (
            <img src={img} alt={`page-${pageNumber}`} draggable={false} className="w-full h-full object-contain" />
          ) : loading ? (
            <div className="animate-pulse w-full h-full bg-gradient-to-br from-[#FFF0F4] to-[#FFDDE6]" />
          ) : (
            <div className="flex flex-col items-center gap-3 p-6 text-pink-600">
              <div className="w-16 h-16 rounded-full bg-pink-50 flex items-center justify-center shadow">
                <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
                  <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5h11A2.5 2.5 0 0 1 20 7.5V18" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div className="text-sm">Memuat halaman {pageNumber} …</div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // empty or error
  if (!pdfUrl) {
    return (
      <div className={`w-full ${className}`} ref={containerRef}>
        <div className="rounded-xl bg-[#FFF0F4] border border-pink-50 p-6 text-center">
          <h3 className="text-lg font-semibold text-pink-700">Tidak ada PDF</h3>
          <p className="text-sm text-pink-500">File modul belum tersedia.</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`w-full ${className}`}>
      {/* header */}
      <div className="flex items-start justify-between p-4 sm:p-6">
        <div>
          <h3 className="text-lg md:text-xl font-semibold text-pink-700">{title}</h3>
          <p className="text-sm text-pink-500">E-Module • Flipbook</p>
        </div>

        <ViewerToolbar currentPage={Math.min(currentSheet + 1, numPages || 1)} pageCount={numPages} onNext={goNext} onPrev={goPrev} onZoomIn={zoomIn} onZoomOut={zoomOut} onFullscreen={toggleFullscreen} />
      </div>

      {/* flipbook area */}
      <div className="px-4 pb-6 flex justify-center">
        <div className="w-full max-w-[calc(100vw-48px)] rounded-xl overflow-hidden">
          <div className="rounded-xl bg-[#FFF0F4] p-4">
            {numPages <= 0 ? (
              <div className="rounded-xl min-h-[260px] md:min-h-[420px] bg-gradient-to-br from-[#FFF0F4] to-[#FFDDE6] animate-pulse flex items-center justify-center">
                <div className="text-pink-600">Memuat dokumen …</div>
              </div>
            ) : (
              <HTMLFlipBook
                width={flipWidthProp}
                height={flipHeightProp}
                size="stretch"
                minWidth={280}
                maxWidth={1200}
                minHeight={320}
                maxHeight={1400}
                maxShadowOpacity={0.25}
                showCover={true}
                mobileScrollSupport={false}
                onFlip={onFlip}
                ref={flipRef}
                className="mx-auto rounded-xl"
                usePortrait={isMobile}
              >
                {/* cover */}
                <div className="page p-3" data-density="hard">
                  <div className="w-full h-full rounded-xl overflow-hidden bg-gradient-to-b from-[#FFF0F4] to-[#FFDDE6] flex flex-col items-center justify-center">
                    <div className="text-center px-6">
                      <h2 className="text-2xl md:text-3xl font-bold text-pink-700">{title}</h2>
                      <p className="mt-2 text-sm text-pink-500">Sampul E-Module</p>
                    </div>
                  </div>
                </div>

                {/* pages */}
                {Array.from({ length: numPages }).map((_, idx) => {
                  const pageNo = idx + 1;
                  return (
                    <div key={pageNo} className="page">
                      {renderPageElement(pageNo)}
                    </div>
                  );
                })}

                {/* back cover */}
                <div className="page p-3" data-density="hard">
                  <div className="w-full h-full rounded-xl overflow-hidden bg-gradient-to-b from-[#FFF0F4] to-[#FFDDE6] flex items-center justify-center">
                    <div className="text-center px-6">
                      <h3 className="text-xl font-semibold text-pink-700">Terima kasih</h3>
                      <p className="text-sm text-pink-500">Anda telah membaca modul ini.</p>
                    </div>
                  </div>
                </div>
              </HTMLFlipBook>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlipbookViewer;
