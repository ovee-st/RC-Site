package com.mxventurelab.rc.domain.model

data class UserSession(
    val accessToken: String,
    val refreshToken: String?,
    val userId: String,
    val username: String,
    val fullName: String,
    val email: String,
    val role: Role,
    val avatarUrl: String? = null
)
