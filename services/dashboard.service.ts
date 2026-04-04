import api from './api'

export const dashboardService = {
  async getSummary() {
    const { data } = await api.get('/dashboard')
    return data
  },

  async getStats() {
    const [fillRate, weeklyTrend, busiestHours, retention, noShowRate] = await Promise.all([
      api.get('/stats/sessions/fill-rate'),
      api.get('/stats/bookings/weekly-trend'),
      api.get('/stats/sessions/busiest-hours'),
      api.get('/stats/members/retention'),
      api.get('/stats/bookings/no-show-rate'),
    ])
    return {
      fillRate: fillRate.data,
      weeklyTrend: weeklyTrend.data,
      busiestHours: busiestHours.data,
      retention: retention.data,
      noShowRate: noShowRate.data,
    }
  },

  async getCoaches() {
    const { data } = await api.get('/coaches')
    return data
  },

  async getMembers() {
    const { data } = await api.get('/users')
    return data
  },
}
