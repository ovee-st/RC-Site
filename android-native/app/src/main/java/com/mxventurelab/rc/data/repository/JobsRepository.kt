package com.mxventurelab.rc.data.repository

import com.mxventurelab.rc.data.local.JobDao
import com.mxventurelab.rc.data.remote.RcApiService
import com.mxventurelab.rc.domain.model.Job
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class JobsRepository @Inject constructor(
    private val api: RcApiService,
    private val jobDao: JobDao
) {
    fun observeJobs(): Flow<List<Job>> = jobDao.observeJobs().map { it.map { entity -> entity.toDomain() } }

    suspend fun refresh(search: String? = null): Result<Unit> = runCatching {
        val remote = api.jobs(page = 1, search = search).data ?: sampleJobs
        jobDao.upsertAll(remote.map { it.toEntity() })
    }

    suspend fun apply(jobId: String): Result<Unit> = runCatching {
        require(jobId.isNotBlank())
    }

    companion object {
        val sampleJobs = listOf(
            Job("1", "Admin & Operations Manager", "MX Partner Employer", "Dhaka", "BDT 30k-50k", "31 May 2026", "Full Time", "Mid Level", "HR & Admin", listOf("Admin", "Excel", "Coordination"), 94, "Lead operations and reporting discipline."),
            Job("2", "Frontend Developer", "Venture SaaS Lab", "Remote", "BDT 70k-120k", "12 Jun 2026", "Full Time", "Mid Level", "IT", listOf("React", "TypeScript", "API"), 82, "Build modern product interfaces."),
            Job("3", "Customer Support Executive", "Remote Support BD", "Uttara", "BDT 18k-28k", "20 Jun 2026", "Full Time", "Entry Level", "Customer Service", listOf("Communication", "CRM"), 76, "Support customers and ticket workflows.")
        )
    }
}
