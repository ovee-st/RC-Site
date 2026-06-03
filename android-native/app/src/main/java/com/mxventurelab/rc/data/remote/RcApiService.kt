package com.mxventurelab.rc.data.remote

import com.mxventurelab.rc.domain.model.CandidateProfile
import com.mxventurelab.rc.domain.model.ChatMessage
import com.mxventurelab.rc.domain.model.DashboardMetric
import com.mxventurelab.rc.domain.model.Job
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Query

interface RcApiService {
    @POST("mobile/auth/login")
    suspend fun login(@Body request: LoginRequest): ApiEnvelope<ApiSession>

    @POST("mobile/auth/register")
    suspend fun register(@Body request: RegisterRequest): ApiEnvelope<ApiSession>

    @GET("mobile/auth/session")
    suspend fun currentSession(): ApiEnvelope<ApiSession>

    @GET("mobile/jobs")
    suspend fun jobs(@Query("page") page: Int, @Query("search") search: String? = null): ApiEnvelope<List<Job>>

    @GET("mobile/candidate/profile")
    suspend fun candidateProfile(): ApiEnvelope<CandidateProfile>

    @GET("mobile/dashboard")
    suspend fun dashboardMetrics(): ApiEnvelope<List<DashboardMetric>>

    @GET("mobile/messages")
    suspend fun messages(): ApiEnvelope<List<ChatMessage>>
}
