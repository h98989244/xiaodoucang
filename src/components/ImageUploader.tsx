import { useState, useRef, type DragEvent, type ChangeEvent } from 'react';
import { Upload, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ImageUploaderProps {
  onUpload: (url: string) => void;
  currentUrl?: string;
}

export default function ImageUploader({ onUpload, currentUrl }: ImageUploaderProps) {
  const [preview, setPreview] = useState<string | null>(currentUrl || null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadFile = async (file: File) => {
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `${crypto.randomUUID()}.${ext}`;

    const { error } = await supabase.storage
      .from('product-images')
      .upload(path, file, { upsert: true });

    if (error) {
      console.error('Upload error:', error);
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(path);

    setPreview(publicUrl);
    onUpload(publicUrl);
    setUploading(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) uploadFile(file);
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  };

  const clearImage = () => {
    setPreview(null);
    onUpload('');
  };

  return (
    <div>
      {preview ? (
        <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-gray-900 border border-gray-300">
          <img src={preview} alt="Preview" className="w-full h-full object-contain" />
          <button
            type="button"
            onClick={clearImage}
            className="absolute top-2 right-2 p-1 bg-black/60 rounded-full text-white hover:bg-black/80"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          className={`border-2 border-dashed rounded-2xl p-12 flex flex-col items-center justify-center cursor-pointer transition-colors ${
            dragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300 text-gray-500 hover:bg-gray-50 hover:border-blue-400'
          }`}
        >
          <Upload size={32} className="mb-4 text-gray-400" />
          <p className="font-medium">{uploading ? '上傳中...' : '點擊或拖放圖片至此處上傳'}</p>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />
    </div>
  );
}
