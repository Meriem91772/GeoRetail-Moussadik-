
import React, { useState, useEffect, useMemo } from 'react';
import { User, UserRole, PointOfSale, POSStatus, POSType } from './types';
import { MOCK_POS } from './constants';
import Navigation from './components/Navigation';
import POSCard from './components/POSCard';
import AddPOSModal from './components/AddPOSModal';
import ConfirmPOSModal from './components/ConfirmPOSModal';
import { calculateDistance } from './utils/geoUtils';

const App: React.FC = () => {
  // Authentication State
  const [user, setUser] = useState<User | null>(null);
  const [roleSelection, setRoleSelection] = useState<UserRole | null>(null);
  
  // App State
  const [activeTab, setActiveTab] = useState('map');
  const [pointsOfSale, setPointsOfSale] = useState<PointOfSale[]>(MOCK_POS);
  const [showAddModal, setShowAddModal] = useState(false);
  const [confirmingPOS, setConfirmingPOS] = useState<PointOfSale | null>(null);
  const [points, setPoints] = useState(0);
  const [notifs, setNotifs] = useState<string[]>([]);
  
  // Geolocation State
  const [userCoords, setUserCoords] = useState<{lat: number, lng: number} | null>(null);
  const [testModeActive, setTestModeActive] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('moussadik_user');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      setUser(parsed);
      setPoints(parsed.points || 0);
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setUserCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        });
      },
      (err) => console.error("GPS Error:", err),
      { enableHighAccuracy: true }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // Simulation Points Test Marocains
  useEffect(() => {
    if (userCoords && testModeActive) {
      const currentMonth = new Date().toISOString().substring(0, 7);
      const testPOS: PointOfSale[] = [
        {
          id: 'test-vrai-1',
          name: 'Hanout Al-Amal (Épicerie)',
          type: POSType.EPICERIE,
          address: 'Angle Rue des Oudayas, Casablanca',
          lat: userCoords.lat + 0.0001,
          lng: userCoords.lng + 0.0001,
          status: POSStatus.NOT_CONFIRMED,
          lastConfirmedAt: new Date().toISOString(),
          confirmedByCount: 4,
          monthlyValidationCount: 2,
          lastValidationMonth: currentMonth,
        },
        {
          id: 'test-vrai-2',
          name: 'Café Fleur d\'Oranger',
          type: POSType.CAFE,
          address: '14 Boulevard Ghandi, Casablanca',
          lat: userCoords.lat - 0.0003,
          lng: userCoords.lng + 0.0002,
          status: POSStatus.NOT_CONFIRMED,
          lastConfirmedAt: new Date().toISOString(),
          confirmedByCount: 12,
          monthlyValidationCount: 9, // Sera masqué après 1 validation
          lastValidationMonth: currentMonth,
        },
        {
          id: 'test-quota-full',
          name: 'Supermarché BIM (Quota Atteint)',
          type: POSType.SUPERMARCHE,
          address: 'Avenue 2 Mars, Casablanca',
          lat: userCoords.lat + 0.0005,
          lng: userCoords.lng - 0.0005,
          status: POSStatus.CONFIRMED,
          lastConfirmedAt: new Date().toISOString(),
          confirmedByCount: 150,
          monthlyValidationCount: 10, // NE DEVRAIT PAS S'AFFICHER POUR LE CONSOMMATEUR
          lastValidationMonth: currentMonth,
        }
      ];
      
      setPointsOfSale(prev => {
        const filtered = prev.filter(p => !p.id.startsWith('test-'));
        return [...testPOS, ...filtered];
      });
      setTestModeActive(false);
      addNotification("Mode Test : Points injectés !");
    }
  }, [userCoords, testModeActive]);

  // FILTRAGE : Un point ne s'affiche que si son quota mensuel est < 10
  // Sauf pour le propriétaire qui voit toujours ses propres commerces.
  const visiblePointsForConsumer = useMemo(() => {
    const currentMonth = new Date().toISOString().substring(0, 7);
    return pointsOfSale.filter(pos => {
      // Si on a changé de mois, on ignore le quota (en réalité il faudrait reset en DB)
      if (pos.lastValidationMonth !== currentMonth) return true;
      return pos.monthlyValidationCount < 10;
    });
  }, [pointsOfSale]);

  const posWithDistance = useMemo(() => {
    if (!userCoords) return visiblePointsForConsumer.map(pos => ({ ...pos, distance: 0 }));
    
    return visiblePointsForConsumer
      .map(pos => ({
        ...pos,
        distance: calculateDistance(userCoords.lat, userCoords.lng, pos.lat, pos.lng)
      }))
      .sort((a, b) => a.distance - b.distance);
  }, [visiblePointsForConsumer, userCoords]);

  const nearbyPOS = useMemo(() => {
    return posWithDistance.filter(pos => pos.distance < 3000);
  }, [posWithDistance]);

  const myShops = useMemo(() => {
    if (!user) return [];
    // Le propriétaire voit son commerce peu importe le quota mensuel atteint par les utilisateurs
    return pointsOfSale.filter(pos => pos.ownerId === user.id);
  }, [pointsOfSale, user]);

  const handleRegister = (name: string, role: UserRole) => {
    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      role,
      points: 0
    };
    setUser(newUser);
    localStorage.setItem('moussadik_user', JSON.stringify(newUser));
  };

  const addNotification = (msg: string) => {
    setNotifs(prev => [msg, ...prev].slice(0, 3));
    setTimeout(() => {
      setNotifs(prev => prev.filter(m => m !== msg));
    }, 4000);
  };

  const handleAddPOS = async (posData: Partial<PointOfSale>) => {
    const currentMonth = new Date().toISOString().substring(0, 7);
    const newPos: PointOfSale = {
      id: Math.random().toString(36).substr(2, 9),
      name: posData.name || 'Nouveau POS',
      type: posData.type || POSType.AUTRE,
      address: posData.address || 'Adresse inconnue',
      lat: posData.lat || (userCoords?.lat || 0),
      lng: posData.lng || (userCoords?.lng || 0),
      status: POSStatus.NOT_CONFIRMED,
      lastConfirmedAt: new Date().toISOString(),
      confirmedByCount: 1,
      monthlyValidationCount: 1, // On compte l'ajout comme une 1ère validation
      lastValidationMonth: currentMonth,
      ownerId: user?.role === UserRole.OWNER ? user.id : undefined
    };

    setPointsOfSale(prev => [newPos, ...prev]);
    setShowAddModal(false);
    
    if (user?.role === UserRole.CONSUMER) {
      setPoints(p => p + 50);
      addNotification("+50 points !");
    } else {
      addNotification("Commerce enregistré !");
      setActiveTab('my-shop');
    }
  };

  const onConfirmClick = (pos: PointOfSale, exists: boolean) => {
    if (user?.role === UserRole.OWNER || !exists) {
      handleConfirmPOS(pos.id, exists);
    } else {
      setConfirmingPOS(pos);
    }
  };

  const handleConfirmPOS = (id: string, exists: boolean, photo?: File) => {
    const currentMonth = new Date().toISOString().substring(0, 7);
    
    setPointsOfSale(prev => prev.map(pos => {
      if (pos.id === id) {
        const newStatus = exists ? POSStatus.CONFIRMED : POSStatus.CLOSED;
        
        // Reset du quota si on change de mois (simulation locale)
        const isNewMonth = pos.lastValidationMonth !== currentMonth;
        const newCount = isNewMonth ? 1 : (pos.monthlyValidationCount + 1);

        return {
          ...pos,
          status: newStatus,
          lastConfirmedAt: new Date().toISOString(),
          confirmedByCount: pos.confirmedByCount + 1,
          monthlyValidationCount: newCount,
          lastValidationMonth: currentMonth
        };
      }
      return pos;
    }));

    setConfirmingPOS(null);

    if (user?.role === UserRole.CONSUMER) {
      const bonus = exists ? 25 : 10;
      setPoints(p => p + bonus);
      addNotification(`+${bonus} points ! Quota : +1`);
    } else {
      addNotification("Validation mensuelle réussie !");
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-emerald-700 flex flex-col items-center justify-center p-6 text-white text-center">
        <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mb-8 rotate-3 border-2 border-white/30">
          <i className="fa-solid fa-location-crosshairs text-3xl"></i>
        </div>
        <h1 className="text-4xl font-black mb-2 tracking-tight">Moussadik</h1>
        <p className="text-emerald-100 mb-12 max-w-xs text-sm opacity-80 leading-relaxed text-center">
          Recensement collaboratif des points de vente au Maroc.
        </p>

        {!roleSelection ? (
          <div className="w-full space-y-4 max-w-sm">
            <button onClick={() => setRoleSelection(UserRole.CONSUMER)} className="w-full bg-white text-emerald-800 py-4 rounded-2xl font-bold shadow-xl flex items-center justify-center space-x-3">
              <i className="fa-solid fa-user-check"></i>
              <span>Consommateur</span>
            </button>
            <button onClick={() => setRoleSelection(UserRole.OWNER)} className="w-full bg-emerald-600 text-white border-2 border-emerald-400 py-4 rounded-2xl font-bold flex items-center justify-center space-x-3">
              <i className="fa-solid fa-shop"></i>
              <span>Commerçant</span>
            </button>
          </div>
        ) : (
          <div className="w-full max-w-sm bg-white p-8 rounded-3xl text-slate-800 shadow-2xl animate-in fade-in zoom-in">
            <h2 className="text-xl font-bold mb-6">Votre identité</h2>
            <input id="name-input" type="text" placeholder="Nom complet" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl mb-4 focus:ring-2 focus:ring-emerald-500 outline-none text-sm" />
            <button onClick={() => { const name = (document.getElementById('name-input') as HTMLInputElement).value; if(name) handleRegister(name, roleSelection); }} className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold shadow-lg">
              Commencer
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 max-w-md mx-auto relative bg-slate-50">
      <div className="fixed top-4 left-0 right-0 z-[120] pointer-events-none flex flex-col items-center gap-2">
        {notifs.map((n, i) => (
          <div key={i} className="bg-slate-900 text-white px-5 py-2.5 rounded-2xl shadow-2xl font-bold text-xs animate-in slide-in-from-top flex items-center gap-2 border border-white/10">
            <i className="fa-solid fa-check-circle text-emerald-400"></i>
            {n}
          </div>
        ))}
      </div>

      <header className="bg-white border-b border-slate-100 p-6 sticky top-0 z-40">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-black text-slate-800 tracking-tight">Moussadik</h1>
            <div className="flex items-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-2"></span>
              {userCoords ? "Habitat Connecté" : "GPS..."}
            </div>
          </div>
          {user.role === UserRole.CONSUMER && (
            <div className="bg-emerald-600 px-3 py-1.5 rounded-xl shadow-lg shadow-emerald-100 flex items-center">
              <i className="fa-solid fa-coins text-white/80 mr-2 text-[10px]"></i>
              <span className="text-sm font-black text-white">{points} pts</span>
            </div>
          )}
        </div>
      </header>

      <main className="p-4">
        {activeTab === 'map' && (
          <div className="space-y-6">
             {/* Petit indicateur de quota */}
             <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                <p className="text-[10px] font-bold text-slate-500 uppercase">Infos Quota</p>
                <p className="text-[10px] font-medium text-slate-400">Max 10 validations/mois par commerce</p>
             </div>

             <div className="bg-slate-100 w-full h-32 rounded-[2rem] relative overflow-hidden flex items-center justify-center border-2 border-white shadow-md">
                <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'radial-gradient(#000 1px, transparent 0)', backgroundSize: '24px 24px'}}></div>
                <div className="relative z-20">
                  <div className="w-6 h-6 bg-blue-500 border-4 border-white rounded-full shadow-lg flex items-center justify-center">
                    <i className="fa-solid fa-person text-[8px] text-white"></i>
                  </div>
                </div>
             </div>

             <div className="flex justify-between items-center px-1">
                <h2 className="text-lg font-bold text-slate-800 tracking-tight">À proximité</h2>
                <div className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-md uppercase tracking-tighter">Voisinage</div>
             </div>

             <div className="space-y-4">
                {nearbyPOS.length > 0 ? nearbyPOS.map(pos => (
                  <POSCard 
                    key={pos.id} 
                    pos={pos} 
                    distance={pos.distance}
                    onConfirmClick={onConfirmClick} 
                    canConfirm={user.role === UserRole.CONSUMER} 
                  />
                )) : (
                  <div className="text-center py-10">
                    <p className="text-xs text-slate-400 italic">Tous les points locaux ont atteint leur quota ou sont trop loin.</p>
                  </div>
                )}
             </div>
          </div>
        )}

        {activeTab === 'list' && (
          <div className="space-y-4">
             <div className="relative mb-6">
                <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                <input 
                  type="text" 
                  placeholder="Rechercher..." 
                  className="w-full pl-12 pr-4 py-4 bg-white border border-slate-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
                />
             </div>
             {posWithDistance.map(pos => (
                <POSCard 
                  key={pos.id} 
                  pos={pos} 
                  distance={pos.distance}
                  onConfirmClick={onConfirmClick} 
                  canConfirm={user.role === UserRole.CONSUMER} 
                />
             ))}
          </div>
        )}

        {activeTab === 'my-shop' && (
          <div className="space-y-6 animate-in slide-in-from-right duration-300">
            <h2 className="text-xl font-bold text-slate-800 tracking-tight">Mon commerce</h2>
            {myShops.length > 0 ? (
              myShops.map(shop => (
                <div key={shop.id}>
                  <div className="mb-2 flex justify-between px-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Crowdsourcing ce mois</span>
                    <span className={`text-[10px] font-bold ${shop.monthlyValidationCount >= 10 ? 'text-rose-500' : 'text-emerald-500'}`}>
                      {shop.monthlyValidationCount} / 10 validations
                    </span>
                  </div>
                  <POSCard 
                    pos={shop} 
                    onConfirmClick={onConfirmClick} 
                    canConfirm={true} 
                    isOwnerView={true}
                  />
                </div>
              ))
            ) : (
              <div className="text-center py-12 px-6 bg-white rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center">
                <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mb-4">
                  <i className="fa-solid fa-store text-2xl"></i>
                </div>
                <p className="text-sm text-slate-500 font-medium mb-6">Ajoutez votre commerce pour le gérer.</p>
                <button onClick={() => setShowAddModal(true)} className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg shadow-emerald-100">
                  Ajouter maintenant
                </button>
              </div>
            )}
          </div>
        )}

        {/* Rewards & Profile ... */}
        {activeTab === 'rewards' && (
          <div className="space-y-6">
            <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 rounded-full blur-[60px]"></div>
               <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-4">Solde Points</p>
               <h3 className="text-5xl font-black mb-2 tracking-tighter text-emerald-400">{points}</h3>
               <p className="text-xs text-slate-500 font-medium italic">Seules les 10 premières preuves/mois par lieu comptent.</p>
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
           <div className="space-y-6">
              <div className="flex flex-col items-center py-10">
                <div className="w-24 h-24 bg-emerald-50 rounded-[2rem] flex items-center justify-center mb-4 border-2 border-emerald-100 shadow-inner">
                  <i className={`fa-solid ${user.role === UserRole.OWNER ? 'fa-shop' : 'fa-user-check'} text-3xl text-emerald-600`}></i>
                </div>
                <h3 className="text-xl font-bold text-slate-800">{user.name}</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-full mt-2">
                  {user.role}
                </p>
              </div>
              <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="w-full bg-rose-50 text-rose-600 py-4 rounded-2xl font-bold text-sm transition-colors hover:bg-rose-100">
                Déconnexion
              </button>
           </div>
        )}
      </main>

      {(user.role === UserRole.CONSUMER || (user.role === UserRole.OWNER && myShops.length === 0)) && activeTab === 'map' && (
        <button onClick={() => setShowAddModal(true)} className="fixed right-6 bottom-24 w-14 h-14 bg-slate-900 text-white rounded-2xl shadow-2xl flex items-center justify-center active:scale-90 transition-transform z-40">
          <i className="fa-solid fa-plus text-xl"></i>
        </button>
      )}

      {showAddModal && <AddPOSModal onClose={() => setShowAddModal(false)} onAdd={handleAddPOS} />}
      {confirmingPOS && (
        <ConfirmPOSModal pos={confirmingPOS} onClose={() => setConfirmingPOS(null)} onConfirm={handleConfirmPOS} />
      )}
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} userRole={user.role} />
    </div>
  );
};

export default App;
