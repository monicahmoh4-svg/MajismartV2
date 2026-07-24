import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import AdminDashboard from '../components/dashboards/AdminDashboard'
import CountyDashboard from '../components/dashboards/CountyDashboard'
import OperatorDashboard from '../components/dashboards/OperatorDashboard'
import CommunityDashboard from '../components/dashboards/CommunityDashboard'

export default function Dashboard() {
  const { user } = useAuth()

  const dashboards = {
    admin:          <AdminDashboard />,
    county_officer: <CountyDashboard />,
    operator:       <OperatorDashboard />,
    community:      <CommunityDashboard />,
  }

  return dashboards[user?.role] || <CommunityDashboard />
}
