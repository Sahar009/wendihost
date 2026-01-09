import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { getCurrentWorkspace } from '@/store/slices/system';
import { Search, Filter, Phone, Mail, MapPin, Star, Eye, Upload, FileText, Users, Target, TrendingUp, Plus } from 'lucide-react';
import { useRouter } from 'next/router';
import axios from 'axios';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { withIronSessionSsr } from 'iron-session/next';
import { sessionCookie, sessionRedirects, validateUser } from '@/services/session';

export const getServerSideProps = withIronSessionSsr(async({req, res}) => {
  const user = await validateUser(req)
  const data = user as any
  if (data?.redirect) return sessionRedirects(data?.redirect)
  return { 
    props: {
      user: JSON.stringify(user),
    }, 
  }
}, sessionCookie())

interface IProps {
  user: string;
}

function LeadGenDashboard(props: IProps) {
  const user = JSON.parse(props.user);
  const currentWorkspace = useSelector(getCurrentWorkspace);
  const router = useRouter();
  const [stats, setStats] = useState({
    totalLeads: 0,
    activeCampaigns: 0,
    totalContacted: 0,
    conversionRate: 0,
    totalForms: 0,
    totalSubmissions: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentWorkspace?.id) {
      fetchStats();
    }
  }, [currentWorkspace?.id]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/${currentWorkspace.id}/leadgen/stats`);
      if (response.data.status === 'success') {
        setStats({
          ...response.data.data,
          totalForms: response.data.data.totalForms || 0,
          totalSubmissions: response.data.data.totalSubmissions || 0,
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Leads',
      value: stats.totalLeads,
      icon: Users,
      color: 'bg-blue-500',
      link: '/dashboard/leadgen/leads',
    },
    {
      title: 'Active Campaigns',
      value: stats.activeCampaigns,
      icon: Target,
      color: 'bg-green-500',
      link: '/dashboard/leadgen/campaigns',
    },
    {
      title: 'Contacted',
      value: stats.totalContacted,
      icon: FileText,
      color: 'bg-purple-500',
      link: '/dashboard/leadgen/leads',
    },
    {
      title: 'Conversion Rate',
      value: `${stats.conversionRate}%`,
      icon: TrendingUp,
      color: 'bg-orange-500',
      link: '/dashboard/leadgen/campaigns',
    },
  ];

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lead Generation</h1>
          <p className="text-gray-600 mt-1">Manage your leads and outreach campaigns</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <button
            onClick={() => router.push('/dashboard/leadgen/submissions')}
            className="bg-orange-600 text-white px-3 sm:px-4 py-2 rounded-lg font-medium hover:bg-orange-700 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
          >
            <Mail className="w-4 h-4" />
            <span className="hidden sm:inline">Form Submissions</span>
            <span className="sm:hidden">Submissions</span>
          </button>
          <button
            onClick={() => router.push('/dashboard/leadgen/scraper')}
            className="bg-primary text-white px-3 sm:px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Scrape Leads</span>
            <span className="sm:hidden">Scrape</span>
          </button>
          <button
            onClick={() => router.push('/dashboard/leadgen/campaigns/create')}
            className="bg-green-600 text-white px-3 sm:px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Campaign</span>
            <span className="sm:hidden">Campaign</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, index) => (
          <div
            key={index}
            onClick={() => router.push(stat.link)}
            className="bg-white rounded-xl shadow p-6 cursor-pointer hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900">
                  {loading ? '...' : stat.value}
                </p>
              </div>
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-sm text-gray-500">This month</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{stats.totalForms}</h3>
          <p className="text-gray-600">Total Forms</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-sm text-gray-500">This month</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{stats.totalLeads}</h3>
          <p className="text-gray-600">Total Leads</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Target className="w-6 h-6 text-purple-600" />
            </div>
            <span className="text-sm text-gray-500">Active</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{stats.activeCampaigns}</h3>
          <p className="text-gray-600">Active Campaigns</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Mail className="w-6 h-6 text-orange-600" />
            </div>
            <span className="text-sm text-gray-500">All time</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{stats.totalSubmissions || 0}</h3>
          <p className="text-gray-600">Form Submissions</p>
        </div>
      </div>
    </div>
  );
}

export default function LeadGenDashboardPage(props: IProps) {
  const user = JSON.parse(props.user);
  return (
    <DashboardLayout user={user}>
      <LeadGenDashboard {...props} />
    </DashboardLayout>
  );
}
