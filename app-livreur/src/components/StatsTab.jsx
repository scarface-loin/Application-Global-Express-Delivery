// components/StatsTab.jsx
import React, { useState, useEffect } from 'react';
import { TrendingUp, Package, CheckCircle2, Calendar } from 'lucide-react';
import apiService from '../services/api';

const StatsTab = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setLoading(true);
    const data = await apiService.history.get('week');
    setHistory(data);
    setLoading(false);
  };

  const totalDeliveries = history.reduce((sum, day) => sum + day.deliveries, 0);
  const totalAmount = history.reduce((sum, day) => sum + day.amount, 0);
  const totalPackages = history.reduce((sum, day) => sum + day.packages, 0);
  const avgPerDay = history.length > 0 ? Math.round(totalAmount / history.length) : 0;

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center" style={{ backgroundColor: '#f2f2f7' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-200 border-t-purple-600 mx-auto mb-3"></div>
          <p className="text-gray-500 text-sm">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto pb-24" style={{ backgroundColor: '#f2f2f7' }}>
      <div className="sticky top-0 z-10 backdrop-blur-xl bg-white/80 border-b border-gray-200/50 px-5 pt-14 pb-4">
        <h1 className="text-3xl font-bold text-gray-900">Statistiques</h1>
      </div>

      <div className="px-4 pt-4">
        {/* Stats cards grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="rounded-2xl p-4 shadow-sm" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <TrendingUp className="text-white/80 mb-2" size={22} />
            <div className="text-white text-2xl font-bold mb-1">{totalAmount.toLocaleString('fr-FR')}</div>
            <div className="text-white/80 text-xs">Revenus 5 jours (FCFA)</div>
          </div>

          <div className="rounded-2xl p-4 shadow-sm" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
            <Package className="text-white/80 mb-2" size={22} />
            <div className="text-white text-2xl font-bold mb-1">{totalPackages}</div>
            <div className="text-white/80 text-xs">Colis livrés</div>
          </div>

          <div className="rounded-2xl p-4 shadow-sm" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
            <CheckCircle2 className="text-white/80 mb-2" size={22} />
            <div className="text-white text-2xl font-bold mb-1">{totalDeliveries}</div>
            <div className="text-white/80 text-xs">Livraisons</div>
          </div>

          <div className="rounded-2xl p-4 shadow-sm" style={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' }}>
            <Calendar className="text-white/80 mb-2" size={22} />
            <div className="text-white text-2xl font-bold mb-1">{avgPerDay.toLocaleString('fr-FR')}</div>
            <div className="text-white/80 text-xs">Moyenne/jour (FCFA)</div>
          </div>
        </div>

        <h2 className="text-lg font-bold text-gray-900 mb-3 px-1">Historique</h2>

        <div className="space-y-2 pb-4">
          {history.map((day, index) => (
            <div key={index} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center flex-1">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center mr-3" style={{ backgroundColor: '#f0f0f5' }}>
                    <Calendar size={18} style={{ color: '#667eea' }} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 text-sm">{formatDate(day.date)}</h3>
                    <p className="text-gray-500 text-xs">{day.deliveries} livraisons · {day.packages} colis</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-base" style={{ color: '#667eea' }}>{day.amount.toLocaleString('fr-FR')} FCFA</div>
                  <div className="text-gray-400 text-xs">{Math.round(day.amount / day.deliveries).toLocaleString('fr-FR')} FCFA/liv</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StatsTab;