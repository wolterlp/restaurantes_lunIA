import React, { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { uploadImage } from "../../https";
import { enqueueSnackbar } from "notistack";
import { FaCloudUploadAlt, FaTimes, FaSpinner } from "react-icons/fa";

const ImageUpload = ({ label, currentImage, onImageUpload, placeholder }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [preview, setPreview] = useState(currentImage);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef(null);

    const uploadMutation = useMutation({
        mutationFn: uploadImage,
        onSuccess: (res) => {
            const imageUrl = res.data.url;
            setPreview(imageUrl);
            onImageUpload(imageUrl);
            setIsUploading(false);
            enqueueSnackbar("Imagen subida correctamente", { variant: "success" });
        },
        onError: (error) => {
            setIsUploading(false);
            console.error(error);
            enqueueSnackbar("Error al subir la imagen", { variant: "error" });
        }
    });

    const handleFile = (file) => {
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            enqueueSnackbar("Solo se permiten archivos de imagen", { variant: "error" });
            return;
        }

        setIsUploading(true);
        const formData = new FormData();
        formData.append("image", file);
        uploadMutation.mutate(formData);
    };

    const onDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const onDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const onDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        handleFile(file);
    };

    const handleChange = (e) => {
        const file = e.target.files[0];
        handleFile(file);
    };

    const handleRemove = (e) => {
        e.stopPropagation();
        setPreview("");
        onImageUpload("");
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    return (
        <div className="flex flex-col gap-2">
            <label className="text-gray-300 font-semibold">{label}</label>
            <div
                className={`relative border-2 border-dashed rounded-lg p-4 transition-all duration-200 ${
                    isDragging
                        ? "border-yellow-400 bg-yellow-400/10"
                        : "border-[#383838] bg-[#1f1f1f] hover:border-gray-500"
                } cursor-pointer group`}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
            >
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleChange}
                />

                {isUploading ? (
                    <div className="flex flex-col items-center justify-center py-8">
                        <FaSpinner className="animate-spin text-3xl text-yellow-400 mb-2" />
                        <span className="text-gray-400 text-sm">Subiendo...</span>
                    </div>
                ) : preview ? (
                    <div className="relative w-full flex justify-center">
                        <img
                            src={preview}
                            alt="Preview"
                            className="max-h-48 w-auto object-contain rounded"
                        />
                        <button
                            type="button"
                            onClick={handleRemove}
                            className="absolute top-[-10px] right-[-10px] bg-red-500 text-white rounded-full p-1.5 shadow-lg hover:bg-red-600 transition-colors z-10"
                            title="Eliminar imagen"
                        >
                            <FaTimes size={12} />
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                        <FaCloudUploadAlt className="text-4xl mb-2 group-hover:text-yellow-400 transition-colors" />
                        <p className="text-sm font-medium">Click para seleccionar o arrastra una imagen aquí</p>
                        <p className="text-xs mt-1 text-gray-500">{placeholder || "PNG, JPG, WEBP (Max 5MB)"}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ImageUpload;
