import React from 'react';

interface MediaPreviewProps {
  fileUrl: string;
  fileType: string;
}

export const MediaPreview: React.FC<MediaPreviewProps> = ({ fileUrl, fileType }) => {
  const isVideo = fileType.startsWith('video/');

  if (isVideo) {
    return (
      <div className="rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
        <video controls className="w-full max-h-96 object-contain">
          <source src={fileUrl} type={fileType} />
          Browser Anda tidak mendukung tag video.
        </video>
      </div>
    );
  }

  return (
    <div className="rounded-lg overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={fileUrl}
        alt="Attachment"
        className="w-full max-h-96 object-contain"
        loading="lazy"
      />
    </div>
  );
};
