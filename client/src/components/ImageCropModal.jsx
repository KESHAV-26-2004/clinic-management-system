//client/src/components/ImageCropModal.jsx
import { useState, useCallback, useEffect } from "react";
import Cropper from "react-easy-crop";
import getCroppedImg from "../utils/cropImage"; // make sure this exists

export default function ImageCropModal({
  open,
  image,
  aspect = 1,
  onClose,
  onComplete,
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  useEffect(() => {
    if (open) {
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    }
  }, [open, image]);

  const onCropComplete = useCallback((_, croppedPixels) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleSave = async () => {
    if (!croppedAreaPixels) return;

    const croppedBlob = await getCroppedImg(image, croppedAreaPixels);
    onComplete(croppedBlob);
  };

  if (!open) return null;

  return (
    <div className="crop-overlay">
      <div className="crop-card">
        <h3 className="crop-title">Adjust Image</h3>

        <div className="crop-container">
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            cropShape="round"
            showGrid={false}
            objectFit="cover"
            minZoom={1}
            maxZoom={3}
            onCropChange={setCrop}
            onZoomChange={(z) => setZoom(Number(z))}
            onCropComplete={onCropComplete}
          />
        </div>

        <div className="crop-slider">
          <input
            type="range"
            min={1}
            max={3}
            step={0.1}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
          />
        </div>

        <div className="crop-actions">
          <button className="confirm-btn cancel" onClick={onClose}>
            Cancel
          </button>

          <button className="confirm-btn confirm" onClick={handleSave}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
