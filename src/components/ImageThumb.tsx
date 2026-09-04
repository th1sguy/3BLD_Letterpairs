import { useObjectUrl } from '../state/imageStore';

export interface ImageThumbProps {
  imageUrl?: string;
  imageAssetId?: string;
  alt: string;
  className?: string;
}

export function ImageThumb({ imageUrl, imageAssetId, alt, className }: ImageThumbProps) {
  const objectUrl = useObjectUrl(imageAssetId);
  const src = imageAssetId ? objectUrl : imageUrl;
  if (!src) return null;
  return <img className={className} src={src} alt={alt} />;
}
