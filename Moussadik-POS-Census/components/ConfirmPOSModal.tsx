
import React, { useState } from 'react';
import { PointOfSale } from '../types';

interface ConfirmPOSModalProps {
  pos: PointOfSale;
  onClose: () => void;
  onConfirm: (id: string, exists: boolean, photo: File) => void;
}

const ConfirmPOSModal: React.FC<ConfirmPOSModalProps> = ({ pos, onClose, onConfirm }) => {
  const [photo, setPhoto] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!photo) {
      alert("Une photo est requise pour valider ce point de vente.");
      return;
    }
    setIsSubmitting(true);
    // Simulation d'upload/traitement
    setTimeout(() => {
      onConfirm(pos.id, true, photo);
      setIsSubmitting(false);
    }, 8000);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-end sm:items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-slate-800 tracking-tight">Confirmer l'ouverture</h2>
            <p className="text-xs text-slate-400 font-medium">{pos.name}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center bg-slate-100 rounded-full text-slate-500">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
            <div className="flex items-center space-x-3 text-emerald-700">
              <i className="fa-solid fa-shield-halved text-xl"></i>
              <p className="text-[11px] font-bold leading-tight">
                Pour garantir la fiabilité du recensement, prenez une photo claire de la devanture ou de l'intérieur.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Preuve visuelle (Directe)</label>
            <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-slate-300 border-dashed rounded-3xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-all overflow-hidden relative">
              {photo ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-emerald-600 text-white p-4 text-center">
                  <i className="fa-solid fa-circle-check text-4xl mb-3 animate-bounce"></i>
                  <span className="text-sm font-bold">Photo capturée !</span>
                  <span className="text-[10px] opacity-70 mt-1">{photo.name}</span>
                  <p className="mt-4 text-[10px] uppercase font-black bg-white/20 px-3 py-1 rounded-full">Changer la photo</p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4 text-slate-400">
                    <i className="fa-solid fa-camera text-2xl"></i>
                  </div>
                  <p className="text-xs font-bold text-slate-500">Ouvrir l'appareil photo</p>
                  <p className="text-[10px] text-slate-400 mt-1">Format JPG, PNG supporté</p>
                </div>
              )}
              <input 
                type="file" 
                accept="image/*" 
                capture="environment" 
                className="hidden" 
                onChange={e => setPhoto(e.target.files ? e.target.files[0] : null)}
              />
            </label>
          </div>

          <button 
            type="submit"
            disabled={!photo || isSubmitting}
            className={`w-full py-4 rounded-2xl font-bold shadow-lg transition-all flex items-center justify-center space-x-3 ${
              !photo || isSubmitting 
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' 
                : 'bg-emerald-600 text-white shadow-emerald-100 hover:bg-emerald-700 active:scale-95'
            }`}
          >
            {isSubmitting ? (
              <>
                <i className="fa-solid fa-circle-notch animate-spin"></i>
                <span>Vérification en cours...</span>
              </>
            ) : (
              <>
                <i className="fa-solid fa-certificate"></i>
                <span>Certifier l'existence</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ConfirmPOSModal;
