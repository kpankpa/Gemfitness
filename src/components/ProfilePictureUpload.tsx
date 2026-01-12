'use client';

import { useState, useRef } from 'react';
import { Camera, Upload, User, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ProfilePictureUploadProps {
  currentImage?: string | null;
  userId?: string; // For staff uploading on behalf of member
  onUploadSuccess?: (imageUrl: string) => void;
  isStaffMode?: boolean;
}

export default function ProfilePictureUpload({
  currentImage,
  userId,
  onUploadSuccess,
  isStaffMode = false,
}: ProfilePictureUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentImage || null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const webcamInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError('Image must be smaller than 2MB');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    setError(null);

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload
    await uploadImage(file);
  };

  const uploadImage = async (file: File) => {
    try {
      setUploading(true);
      setError(null);

      const formData = new FormData();
      formData.append('image', file);
      if (userId) {
        formData.append('userId', userId);
      }

      const response = await fetch('/api/members/profile-image', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload image');
      }

      setPreview(data.profileImage);
      onUploadSuccess?.(data.profileImage);

      // Show success message
      if (typeof window !== 'undefined') {
        const event = new CustomEvent('toast', {
          detail: { message: 'Profile picture uploaded successfully!', type: 'success' },
        });
        window.dispatchEvent(event);
      }
    } catch (err: unknown) {
      console.error('Upload error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload image';
      setError(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!confirm('Are you sure you want to remove your profile picture?')) return;

    try {
      setUploading(true);
      const url = userId
        ? `/api/members/profile-image?userId=${userId}`
        : '/api/members/profile-image';

      const response = await fetch(url, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to remove image');
      }

      setPreview(null);
      if (onUploadSuccess) {
        onUploadSuccess('');
      }

      if (typeof window !== 'undefined') {
        const event = new CustomEvent('toast', {
          detail: { message: 'Profile picture removed', type: 'success' },
        });
        window.dispatchEvent(event);
      }
    } catch {
      setError('Failed to remove image');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5 text-orange-600" />
          Profile Picture
        </CardTitle>
        <CardDescription>
          {isStaffMode
            ? 'Upload a profile picture for this member'
            : 'Upload a clear photo of yourself for identification'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Preview */}
        <div className="flex justify-center">
          <div className="relative w-48 h-48 rounded-full overflow-hidden border-4 border-gray-200 bg-gray-100">
            {preview ? (
              <Image
                src={preview}
                alt="Profile"
                fill
                className="object-cover"
                unoptimized={preview.startsWith('data:')}
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <User className="h-24 w-24 text-gray-400" />
              </div>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Upload Buttons */}
        <div className="flex flex-col gap-2">
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="bg-orange-600 hover:bg-orange-700 w-full"
          >
            <Upload className="h-4 w-4 mr-2" />
            {uploading ? 'Uploading...' : 'Choose Photo from Device'}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileSelect}
            className="hidden"
          />

          <Button
            onClick={() => webcamInputRef.current?.click()}
            disabled={uploading}
            variant="outline"
            className="w-full border-orange-300 text-orange-700 hover:bg-orange-50"
          >
            <Camera className="h-4 w-4 mr-2" />
            Take Photo with Camera
          </Button>
          <input
            ref={webcamInputRef}
            type="file"
            accept="image/*"
            capture="user"
            onChange={handleFileSelect}
            className="hidden"
          />

          {preview && (
            <Button
              onClick={handleRemove}
              disabled={uploading}
              variant="outline"
              className="w-full border-red-300 text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Remove Photo
            </Button>
          )}
        </div>

        {/* Tips */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-xs text-blue-800 font-medium mb-1">📌 Tips for best results:</p>
          <ul className="text-xs text-blue-700 space-y-1 ml-4 list-disc">
            <li>Use a clear, well-lit photo</li>
            <li>Face the camera directly</li>
            <li>Remove sunglasses or hats</li>
            <li>Maximum file size: 2MB</li>
            <li>Formats: JPEG, PNG, WebP</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
