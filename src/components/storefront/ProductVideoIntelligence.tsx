import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Video, 
  ExternalLink, 
  Clock
} from 'lucide-react';
import { CanonicalProduct } from '../../types';

interface VideoItem {
  id: string;
  platform: 'YOUTUBE' | 'APARAT';
  title: string;
  channelName: string;
  channelAvatar?: string;
  publishedDate: string;
  videoType: 'REVIEW' | 'UNBOXING' | 'COMPARISON';
  embedUrl: string;
  externalUrl?: string;
  duration?: string;
  summaryPoints?: string[];
}

interface ProductVideoIntelligenceProps {
  product: CanonicalProduct;
}

export const ProductVideoIntelligence: React.FC<ProductVideoIntelligenceProps> = ({ product }) => {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [activeVideo, setActiveVideo] = useState<VideoItem | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    setIsLoading(true);
    fetch(`/api/products/${product.id}/videos`)
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.videos) && data.videos.length > 0) {
          setVideos(data.videos);
          setActiveVideo(data.videos[0]);
        } else {
          setVideos([]);
          setActiveVideo(null);
        }
      })
      .catch(() => {
        setVideos([]);
        setActiveVideo(null);
      })
      .finally(() => setIsLoading(false));
  }, [product.id]);

  if (isLoading) {
    return (
      <div className="p-8 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] text-center text-xs text-[var(--text-muted)]">
        در حال بارگذاری بررسی‌های ویدیویی...
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="p-8 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] text-center text-xs text-[var(--text-muted)] space-y-2">
        <Video className="w-8 h-8 text-[var(--accent-primary)] opacity-60 mx-auto" />
        <p>در حال حاضر ویدیوی بررسی برای این کالا ثبت نشده است.</p>
      </div>
    );
  }

  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl p-6 space-y-6">
      <div className="flex items-center gap-2 pb-3 border-b border-[var(--border-color)] text-xs font-bold text-[var(--text-main)]">
        <Video className="w-4 h-4 text-[var(--accent-primary)]" />
        <span>بررسی‌های ویدیویی کالا</span>
      </div>

      {activeVideo && (
        <div className="space-y-4">
          <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black border border-[var(--border-color)]">
            <iframe
              src={activeVideo.embedUrl}
              title={activeVideo.title}
              className="w-full h-full"
              allowFullScreen
            />
          </div>
          <h4 className="text-sm font-bold text-[var(--text-main)]">{activeVideo.title}</h4>
        </div>
      )}
    </div>
  );
};
