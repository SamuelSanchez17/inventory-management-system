import { useEffect, useRef, useState } from 'react';
import { invoke, isTauri } from '@tauri-apps/api/core';
import toast from 'react-hot-toast';
import Cropper from 'react-easy-crop';
import { Camera, UserCircle, X } from 'phosphor-react';

export default function ProfileModal({ open: isOpen, profile, onClose, onSaved, isDark, t }) {
  const [profileName, setProfileName] = useState('');
  const [profileRole, setProfileRole] = useState('');
  const [profilePhotoPreview, setProfilePhotoPreview] = useState(null);
  const [profilePhotoFile, setProfilePhotoFile] = useState(null);
  const [profileMiniatura, setProfileMiniatura] = useState(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const profilePhotoRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setProfileName(profile?.nombre || '');
    setProfileRole(profile?.cargo || '');
    setProfilePhotoFile(null);
    setProfileMiniatura(profile?.miniatura_base64 || null);
    setProfilePhotoPreview(profile?.miniatura_base64 ? `data:image/jpeg;base64,${profile.miniatura_base64}` : null);
    setIsCropModalOpen(false);
    setCropImageSrc(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
  }, [isOpen, profile]);

  if (!isOpen) {
    return null;
  }

  const makeProfileThumbnail = (file, maxSize = 200) =>
    new Promise((resolve, reject) => {
      const img = new window.Image();
      const reader = new FileReader();

      reader.onload = (event) => {
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const scale = Math.min(maxSize / img.width, maxSize / img.height);
          canvas.width = Math.round(img.width * scale);
          canvas.height = Math.round(img.height * scale);
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const base64 = canvas.toDataURL('image/jpeg', 0.7).split(',')[1];
          resolve(base64);
        };

        img.onerror = reject;
        img.src = event.target.result;
      };

      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const readFileAsDataURL = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const createImageElement = (src) =>
    new Promise((resolve, reject) => {
      const img = new window.Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });

  const getCircularCroppedImage = async (imageSrc, areaPixels) => {
    const image = await createImageElement(imageSrc);
    const size = Math.round(Math.min(areaPixels.width, areaPixels.height));
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, size, size);
    ctx.save();
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    ctx.drawImage(
      image,
      areaPixels.x,
      areaPixels.y,
      areaPixels.width,
      areaPixels.height,
      0,
      0,
      size,
      size
    );
    ctx.restore();

    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob((value) => {
        if (!value) {
          reject(new Error('No se pudo generar la imagen recortada'));
          return;
        }
        resolve(value);
      }, 'image/jpeg', 0.9);
    });

    const file = new File([blob], `profile-crop-${Date.now()}.jpg`, { type: 'image/jpeg' });
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    return { file, dataUrl };
  };

  const handleProfilePhotoUpload = async (event) => {
    const file = event.target.files[0];
    event.target.value = '';

    if (!file) {
      return;
    }

    try {
      const nextSrc = await readFileAsDataURL(file);
      setCropImageSrc(nextSrc);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCroppedAreaPixels(null);
      setIsCropModalOpen(true);
    } catch (error) {
      console.error('Error al preparar imagen para recorte:', error);
      toast.error(t('toast_profile_error'));
    }
  };

  const handleCancelCrop = () => {
    setIsCropModalOpen(false);
    setCropImageSrc(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
  };

  const handleConfirmCrop = async () => {
    if (!cropImageSrc || !croppedAreaPixels) {
      return;
    }

    try {
      const { file, dataUrl } = await getCircularCroppedImage(cropImageSrc, croppedAreaPixels);
      setProfilePhotoFile(file);
      setProfilePhotoPreview(dataUrl);

      const base64 = await makeProfileThumbnail(file);
      setProfileMiniatura(base64);
      handleCancelCrop();
    } catch (error) {
      console.error('Error al recortar imagen:', error);
      toast.error(t('toast_profile_error'));
    }
  };

  const handleSaveProfile = async () => {
    if (!isTauri()) return;
    setIsSavingProfile(true);

    try {
      let imageBytes = null;
      let imageExt = null;

      if (profilePhotoFile) {
        const arrayBuffer = await profilePhotoFile.arrayBuffer();
        imageBytes = Array.from(new Uint8Array(arrayBuffer));
        imageExt = profilePhotoFile.name.split('.').pop();
      }

      await invoke('save_perfil', {
        nombre: profileName,
        cargo: profileRole,
        imageBytes,
        imageExt,
        miniaturaBase64: profileMiniatura,
      });

      toast.success(t('toast_profile_saved'));
      setProfilePhotoFile(null);
      if (onSaved) onSaved();
      onClose();
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error(t('toast_profile_error'));
    } finally {
      setIsSavingProfile(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 py-8 backdrop-blur-sm">
      <div className={`relative w-full max-w-2xl overflow-hidden rounded-3xl border shadow-2xl ${isDark ? 'border-slate-700 bg-slate-900' : 'border-rose-100 bg-white'}`}>
        <div className="flex items-start justify-between gap-4 border-b border-black/5 px-6 py-5">
          <div>
            <p className={`text-[11px] font-semibold uppercase tracking-[0.22em] ${isDark ? 'text-rose-300' : 'text-rose-500'}`}>
              {t('profile_modal_eyebrow')}
            </p>
            <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {t('profile_modal_title')}
            </h2>
            <p className={`mt-1 text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              {t('profile_desc')}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('update_modal_close')}
            className={`inline-flex h-10 w-10 items-center justify-center rounded-full border transition-colors ${isDark ? 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700' : 'border-rose-100 bg-rose-50 text-rose-700 hover:bg-rose-100'}`}
          >
            <X size={18} weight="bold" />
          </button>
        </div>

        <div className="grid gap-6 px-6 py-6 lg:grid-cols-[260px_1fr]">
          <div className="flex flex-col items-center gap-4 rounded-3xl border border-dashed border-rose-200/70 p-5 text-center">
            <div
              className={`flex h-36 w-36 items-center justify-center overflow-hidden rounded-full border-4 ${isDark ? 'border-slate-700 bg-gradient-to-br from-slate-700 to-slate-600' : 'border-rose-100 bg-gradient-to-br from-rose-200 to-rose-300'}`}
              onClick={() => profilePhotoRef.current?.click()}
            >
              {profilePhotoPreview ? (
                <img src={profilePhotoPreview} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                <UserCircle size={72} weight="duotone" className={isDark ? 'text-slate-400' : 'text-rose-400'} />
              )}
            </div>

            <input
              type="file"
              ref={profilePhotoRef}
              onChange={handleProfilePhotoUpload}
              accept="image/*"
              className="hidden"
            />

            <button
              type="button"
              onClick={() => profilePhotoRef.current?.click()}
              className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold transition-colors ${isDark ? 'bg-slate-800 text-slate-200 hover:bg-slate-700' : 'bg-rose-50 text-rose-700 hover:bg-rose-100'}`}
            >
              <Camera size={16} weight="duotone" />
              {profilePhotoPreview ? t('profile_photo_change') : t('profile_photo_upload')}
            </button>

            <p className={`text-xs leading-5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {t('profile_modal_photo_hint')}
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className={`mb-1 block text-xs font-semibold uppercase tracking-[0.16em] ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                {t('profile_name_label')}
              </label>
              <input
                type="text"
                value={profileName}
                onChange={(event) => setProfileName(event.target.value)}
                placeholder={t('profile_name_placeholder')}
                className={`w-full rounded-2xl border-2 px-4 py-3 text-sm outline-none transition-colors ${isDark ? 'border-slate-700 bg-slate-800 text-slate-100 placeholder:text-slate-500 focus:border-rose-400' : 'border-rose-100 bg-white text-slate-900 placeholder:text-slate-400 focus:border-rose-400'}`}
              />
            </div>

            <div>
              <label className={`mb-1 block text-xs font-semibold uppercase tracking-[0.16em] ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                {t('profile_role_label')}
              </label>
              <input
                type="text"
                value={profileRole}
                onChange={(event) => setProfileRole(event.target.value)}
                placeholder={t('profile_role_placeholder')}
                className={`w-full rounded-2xl border-2 px-4 py-3 text-sm outline-none transition-colors ${isDark ? 'border-slate-700 bg-slate-800 text-slate-100 placeholder:text-slate-500 focus:border-rose-400' : 'border-rose-100 bg-white text-slate-900 placeholder:text-slate-400 focus:border-rose-400'}`}
              />
            </div>

            <div className={`rounded-2xl border px-4 py-3 text-sm ${isDark ? 'border-slate-700 bg-slate-800 text-slate-300' : 'border-rose-100 bg-rose-50 text-slate-600'}`}>
              {t('profile_modal_summary')}
            </div>

            <button
              type="button"
              onClick={handleSaveProfile}
              disabled={isSavingProfile}
              className={`inline-flex w-full items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold text-white shadow-lg transition-all ${isSavingProfile ? 'cursor-not-allowed opacity-60' : isDark ? 'bg-pink-600 hover:bg-pink-500' : 'bg-rose-500 hover:bg-rose-600'}`}
            >
              {isSavingProfile ? t('profile_btn_saving') : t('profile_btn_save')}
            </button>
          </div>
        </div>
      </div>

      {isCropModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/80 px-4 py-8 backdrop-blur-sm">
          <div className={`w-full max-w-2xl rounded-3xl border shadow-2xl ${isDark ? 'border-slate-700 bg-slate-900' : 'border-rose-100 bg-white'}`}>
            <div className="border-b border-black/5 px-6 py-5">
              <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {t('profile_crop_title')}
              </h3>
              <p className={`mt-1 text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                {t('profile_crop_subtitle')}
              </p>
            </div>

            <div className="space-y-5 px-6 py-6">
              <div className="relative h-[320px] overflow-hidden rounded-3xl bg-slate-950">
                <Cropper
                  image={cropImageSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  cropShape="round"
                  showGrid={false}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={(_, pixels) => setCroppedAreaPixels(pixels)}
                />
              </div>

              <div className="space-y-2">
                <label className={`block text-xs font-semibold uppercase tracking-[0.16em] ${isDark ? 'text-slate-300' : 'text-slate-700'}`} htmlFor="profile-crop-zoom">
                  {t('profile_crop_zoom_label')}
                </label>
                <input
                  id="profile-crop-zoom"
                  type="range"
                  min={1}
                  max={3}
                  step={0.1}
                  value={zoom}
                  onChange={(event) => setZoom(Number(event.target.value))}
                  className="w-full"
                />
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={handleCancelCrop}
                  className={`rounded-2xl px-5 py-3 text-sm font-semibold transition-colors ${isDark ? 'bg-slate-800 text-slate-200 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                >
                  {t('profile_crop_cancel')}
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCrop}
                  className={`rounded-2xl px-5 py-3 text-sm font-semibold text-white transition-colors ${isDark ? 'bg-pink-600 hover:bg-pink-500' : 'bg-rose-500 hover:bg-rose-600'}`}
                >
                  {t('profile_crop_apply')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}