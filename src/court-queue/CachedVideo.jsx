import { useState, useEffect, forwardRef } from "react";
import { getCachedVideoUrl } from "./videoCache.js";

const CachedVideo = forwardRef(({ url, onVideoReady, ...videoProps }, ref) => {
  const [localSrc, setLocalSrc] = useState(null);
  const [isDownloading, setIsDownloading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setIsDownloading(true);

    const loadVideo = async () => {
      const cachedUrl = await getCachedVideoUrl(url);
      
      if (isMounted) {
        setLocalSrc(cachedUrl);
        setIsDownloading(false);
        if (onVideoReady) onVideoReady();
      }
    };

    loadVideo();

    return () => {
      isMounted = false;
    };
  }, [url, onVideoReady]);

  if (isDownloading) {
    // Uses the new CSS classes for the spinner
    return (
      <div className="ad-loader-container">
        <div className="ad-spinner"></div>
        <div>Downloading media...</div>
      </div>
    );
  }

  return <video ref={ref} src={localSrc} {...videoProps} maxWidth="80%" />;
});

export default CachedVideo;