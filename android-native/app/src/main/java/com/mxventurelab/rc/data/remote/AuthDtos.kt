package com.mxventurelab.rc.data.remote

data class LoginRequest(val email: String, val password: String)
data class RegisterRequest(val fullName: String, val email: String, val password: String, val role: String)
data class ApiSession(
    val accessToken: String?,
    val refreshToken: String?,
    val userId: String?,
    val username: String?,
    val fullName: String?,
    val email: String?,
    val role: String?,
    val avatarUrl: String?
)
data class ApiEnvelope<T>(val data: T?, val error: String?)
