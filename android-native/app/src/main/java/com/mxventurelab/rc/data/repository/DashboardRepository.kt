package com.mxventurelab.rc.data.repository

import com.mxventurelab.rc.data.remote.RcApiService
import com.mxventurelab.rc.domain.model.DashboardMetric
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class DashboardRepository @Inject constructor(private val api: RcApiService) {
    suspend fun metrics(): List<DashboardMetric> =
        api.dashboardMetrics().data ?: listOf(
            DashboardMetric("Profile Completion", "88%", "Keep your profile updated"),
            DashboardMetric("Applications", "3", "Active applications"),
            DashboardMetric("Interviews", "1", "Upcoming schedule"),
            DashboardMetric("AI Match", "94%", "Best-fit role")
        )
}
