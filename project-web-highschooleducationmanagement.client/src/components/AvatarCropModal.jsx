import { useCallback, useState } from "react";
import Cropper from "react-easy-crop";

function createImage(url) {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.addEventListener("load", () => resolve(image));
        image.addEventListener("error", (error) => reject(error));
        image.setAttribute("crossOrigin", "anonymous");
        image.src = url;
    });
}

async function getCroppedImg(imageSrc, pixelCrop) {
    const image = await createImage(imageSrc);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
    );

    return new Promise((resolve) => {
        canvas.toBlob((blob) => {
            if (!blob) return;
            const file = new File([blob], "avatar.jpg", { type: "image/jpeg" });
            resolve(file);
        }, "image/jpeg", 0.92);
    });
}

export default function AvatarCropModal({
    open,
    imageSrc,
    onClose,
    onConfirm,
}) {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

    const onCropComplete = useCallback((_, croppedPixels) => {
        setCroppedAreaPixels(croppedPixels);
    }, []);

    const handleConfirm = async () => {
        if (!imageSrc || !croppedAreaPixels) return;
        const croppedFile = await getCroppedImg(imageSrc, croppedAreaPixels);
        onConfirm?.(croppedFile);
    };

    if (!open) return null;

    return (
        <div className="crop-modal-overlay" onClick={onClose}>
            <div className="crop-modal-box" onClick={(e) => e.stopPropagation()}>
                <h3>Cắt ảnh đại diện</h3>

                <div className="cropper-wrap">
                    <Cropper
                        image={imageSrc}
                        crop={crop}
                        zoom={zoom}
                        aspect={1}
                        cropShape="round"
                        showGrid={false}
                        onCropChange={setCrop}
                        onZoomChange={setZoom}
                        onCropComplete={onCropComplete}
                    />
                </div>

                <div className="crop-zoom-wrap">
                    <label>Phóng to</label>
                    <input
                        type="range"
                        min={1}
                        max={3}
                        step={0.1}
                        value={zoom}
                        onChange={(e) => setZoom(Number(e.target.value))}
                    />
                </div>

                <div className="modal-actions">
                    <button className="cancel-btn" onClick={onClose}>
                        Hủy
                    </button>
                    <button className="save-btn" onClick={handleConfirm}>
                        Cắt và tải lên
                    </button>
                </div>
            </div>
        </div>
    );
}