
import React, { useState, useEffect } from 'react';
import { POSType, PointOfSale, POSStatus } from '../types';

interface AddPOSModalProps {
  onClose: () => void;
  onAdd: (pos: Partial<PointOfSale>) => void;
}

const AddPOSModal: React.FC<AddPOSModalProps> = ({ onClose, onAdd }) => {
  const [formData, setFormData] = useState({
    name: '',
    type: POSType.EPICERIE,
    address: '',
    lat: 0,
    lng: 0,
  });
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);

  useEffect(() => {
    // Get current location on mount
    setLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFormData(prev => ({ ...prev, lat: pos.coords.latitude, lng: pos.coords.longitude }));
        setLoadingLocation(false);
      },
      () => setLoadingLocation(false)
    );
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!photo) {
      alert("Veuillez prendre une photo pour prouver l'existence du point de vente.");
      return;
    }
    onAdd({
      ...formData,
      status: POSStatus.NOT_CONFIRMED,
      lastConfirmedAt: new Date().toISOString(),
      confirmedByCount: 1,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-800 tracking-tight">Ajouter un Point de Vente</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center bg-slate-100 rounded-full text-slate-500">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Nom de l'établissement</label>
            <input 
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
              placeholder="Ex: Épicerie Chez Ahmed"
              value={formData.name}
              onChange={e => setFormData(p => ({...p, name: e.target.value}))}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Type de commerce</label>
            <select 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none"
              value={formData.type}
              onChange={e => setFormData(p => ({...p, type: e.target.value as POSType}))}
            >
              {Object.values(POSType).map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Adresse approximative</label>
            <textarea 
              required
              rows={2}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
              placeholder="Ex: Rue 4, Secteur 2, Casablanca"
              value={formData.address}
              onChange={e => setFormData(p => ({...p, address: e.target.value}))}
            />
          </div>

          <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-emerald-800">Géolocalisation automatique</p>
              <p className="text-[10px] text-emerald-600">
                {loadingLocation ? "Localisation en cours..." : `${formData.lat.toFixed(4)}, ${formData.lng.toFixed(4)}`}
              </p>
            </div>
            <i className={`fa-solid fa-location-crosshairs text-emerald-500 ${loadingLocation ? 'animate-pulse' : ''}`}></i>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Preuve photo (Obligatoire)</label>
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-2xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
                {photo ? (
                  <div className="flex flex-col items-center text-emerald-600">
                    <i className="fa-solid fa-circle-check text-2xl mb-2"></i>
                    <span className="text-xs font-medium">{photo.name}</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <i className="fa-solid fa-camera text-slate-400 text-2xl mb-2"></i>
                    <p className="text-xs text-slate-500">Prendre une photo</p>
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
          </div>

          <button 
            type="submit"
            className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 active:scale-[0.98] transition-all flex items-center justify-center space-x-2"
          >
            <span>Soumettre pour validation</span>
            <i className="fa-solid fa-paper-plane text-xs"></i>
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddPOSModal;
