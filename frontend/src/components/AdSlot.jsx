import React, { useEffect } from 'react';

export default function AdSlot({ slotId, className = "" }) {
  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      console.warn("AdSense script not loaded yet or failed to push ad unit:", err);
    }
  }, []);

  return (
    <div className={`w-full flex justify-center overflow-hidden my-2 max-w-full ${className}`}>
      {/* Google AdSense Unit */}
      <ins
        className="adsbygoogle"
        style={{ display: 'block', minWidth: '250px', minHeight: '90px' }}
        data-ad-client="ca-pub-XXXXXXXXXXXXXXXX" // ponytail: replace with real client ID when deploying
        data-ad-slot={slotId}
        data-ad-format="auto"
        data-full-width-responsive="true"
      ></ins>
    </div>
  );
}
