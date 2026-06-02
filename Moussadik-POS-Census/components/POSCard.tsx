
import React from 'react';
import { PointOfSale, POSStatus } from '../types';
import { formatDistance } from '../utils/geoUtils';

interface POSCardProps {
  pos: PointOfSale;
  distance?: number;
  onConfirmClick: (pos: PointOfSale, exists: boolean) => void;
  canConfirm: boolean;
  isOwnerView?: boolean;
}

const POSCard: React.FC<POSCardProps> = ({ pos, distance, onConfirmClick, canConfirm, isOwnerView }) => {
  const getStatusColor = (status: POSStatus) => {
    switch (status) {
      case POSStatus.CONFIRMED: return 'text-emerald-600 bg-emerald-50 border-emerald-100';
      case POSStatus.NOT_CONFIRMED: return 'text-amber-600 bg-amber-50 border-amber-100';
      case POSStatus.CLOSED: return 'text-rose-600 bg-rose-50 border-rose-100';
      default: return 'text-slate-600 bg-slate-50 border-slate-100';
    }
  };

  const isTooFar = !isOwnerView && distance !== undefined && distance > 100;
  const remainingValidations = 10 - pos.monthlyValidationCount;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 mb-4 transition-all active:bg-slate-50">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="font-bold text-slate-800 text-base leading-tight">{pos.name}</h3>
          <p className="text-xs font-medium text-emerald-600 mt-0.5">{pos.type}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase border ${getStatusColor(pos.status)}`}>
            {pos.status === POSStatus.CONFIRMED ? 'Confirmé' : pos.status === POSStatus.NOT_CONFIRMED ? 'À valider' : 'Fermé'}
          </div>
          {!isOwnerView && (
            <div className={`text-[9px] font-black px-1.5 py-0.5 rounded shadow-sm border ${remainingValidations <= 2 ? 'text-rose-600 bg-rose-50 border-rose-100' : 'text-slate-500 bg-slate-50 border-slate-100'}`}>
              {remainingValidations} SLOT{remainingValidations > 1 ? 'S' : ''} RESTANT{remainingValidations > 1 ? 'S' : ''}
            </div>
          )}
        </div>
      </div>
      
      <div className="space-y-2 mb-4">
        <p className="text-xs text-slate-500 flex items-start">
          <i className="fa-solid fa-location-dot mt-0.5 mr-2 text-slate-400"></i>
          {pos.address}
        </p>
        
        {!isOwnerView && distance !== undefined && (
          <p className={`text-xs font-bold flex items-center ${isTooFar ? 'text-amber-600' : 'text-emerald-600'}`}>
            <i className={`fa-solid ${isTooFar ? 'fa-person-walking' : 'fa-location-crosshairs'} mr-2`}></i>
            À {formatDistance(distance)} de vous
          </p>
        )}

        {isOwnerView && (
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
            Dernière validation : {new Date(pos.lastConfirmedAt).toLocaleDateString('fr-FR')}
          </p>
        )}
      </div>

      {canConfirm && (
        <div className="space-y-2">
          {isTooFar ? (
            <div className="bg-amber-50 text-amber-700 text-[10px] p-2 rounded-xl border border-amber-100 flex items-center">
              <i className="fa-solid fa-circle-info mr-2"></i>
              Rapprochez-vous à moins de 100m pour valider.
            </div>
          ) : (
            <div className={`grid ${isOwnerView ? 'grid-cols-1' : 'grid-cols-2'} gap-2`}>
              <button 
                onClick={() => onConfirmClick(pos, true)}
                className="py-3 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 active:scale-95 transition-all flex items-center justify-center"
              >
                <i className={`fa-solid ${isOwnerView ? 'fa-calendar-check' : 'fa-camera'} mr-2`}></i>
                {isOwnerView ? 'Confirmer l\'activité' : 'Confirmer avec Photo'}
              </button>
              {!isOwnerView && (
                <button 
                  onClick={() => onConfirmClick(pos, false)}
                  className="py-3 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-200 active:scale-95 transition-all flex items-center justify-center"
                >
                  <i className="fa-solid fa-xmark mr-2"></i>
                  C'est fermé
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default POSCard;
