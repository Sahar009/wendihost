import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { getCurrentWorkspace } from '@/store/slices/system';
import MetaAdDetailsModal from './MetaAdDetailsModal';
import axios from 'axios';
import { MetaAd } from '@/types/meta-ads';

interface Stats {
  label: string;
  value: number;
}

export default function MetaAdsTable() {
  const [selectedAd, setSelectedAd] = useState<MetaAd | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [ads, setAds] = useState<MetaAd[]>([]);
  const [stats, setStats] = useState<Stats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const currentWorkspace = useSelector(getCurrentWorkspace);

  const fetchMetaAds = async () => {
    if (!currentWorkspace) return;
    
    try {
      setLoading(true);
      const response = await axios.get('/api/metaads/get', {
        params: {
          workspaceId: currentWorkspace.id,
          page: currentPage,
          limit: 10,
          search: searchTerm,
        }
      });

      if (response.data.status === 'success') {
        setAds(response.data.data.ads);
        setStats(response.data.data.stats);
        setTotalPages(response.data.data.pagination.totalPages);
      }
    } catch (error) {
      console.error('Error fetching MetaAds:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetaAds();
  }, [currentWorkspace, currentPage, searchTerm]);

  const handleRowClick = (ad: MetaAd) => {
    setSelectedAd(ad);
    setModalOpen(true);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); 
  };

  return (
    <div className="w-full">
      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search"
          value={searchTerm}
          onChange={handleSearch}
          className="w-full max-w-xs px-4 py-2 rounded-md border border-gray-100 bg-gray-50 text-sm focus:outline-none"
        />
      </div>
      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-lg p-4 flex flex-col items-center shadow-sm">
            <div className="text-xs text-gray-500 mb-1">{stat.label}</div>
            <div className="text-xl font-bold">{stat.value}</div>
          </div>
        ))}
      </div>
      {/* Table */}
      <div className="bg-gray-50 rounded-xl overflow-x-auto">
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="text-gray-500">Loading...</div>
          </div>
        ) : ads.length === 0 ? (
          <div className="flex justify-center items-center py-8">
            <div className="text-gray-500">No ads found</div>
          </div>
        ) : (
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="text-gray-400">
              <th className="px-6 py-3 font-medium">Advertisement</th>
              <th className="px-6 py-3 font-medium">Status</th>
              <th className="px-6 py-3 font-medium">Reach</th>
              <th className="px-6 py-3 font-medium">Created at</th>
              <th className="px-3 py-3"></th>
            </tr>
          </thead>
          <tbody>
              {ads.map((ad) => (
                <tr key={ad.id} className="bg-white border-b last:border-b-0 hover:bg-gray-50 transition cursor-pointer" onClick={() => handleRowClick(ad)}>
                <td className="px-6 py-4 whitespace-nowrap font-medium">{ad.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      ad.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                      ad.status === 'PAUSED' ? 'bg-yellow-100 text-yellow-800' :
                      ad.status === 'PENDING_REVIEW' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {ad.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{ad.reach.toLocaleString()}</td>
                <td className="px-6 py-4 whitespace-nowrap">{ad.createdAt}</td>
                <td className="px-3 py-4 text-right">
                  <button className="p-2 rounded-full hover:bg-gray-100 transition" onClick={e => e.stopPropagation()}>
                    <span className="text-xl">&#8942;</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        )}
      </div>
      <MetaAdDetailsModal open={modalOpen} onClose={() => setModalOpen(false)} ad={selectedAd} />
    </div>
  );
} 