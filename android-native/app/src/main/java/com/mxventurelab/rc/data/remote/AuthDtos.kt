package com.mxventurelab.rc.data.remote

import com.squareup.moshi.Json

data class LoginRequest(val email: String, val password: String)
data class RegisterRequest(val fullName: String, val email: String, val password: String, val role: String)
data class ApiSession(
    val accessToken: String? = null,
    @Json(name = "access_token") val accessTokenSnake: String? = null,
    val refreshToken: String? = null,
    @Json(name = "refresh_token") val refreshTokenSnake: String? = null,
    val userId: String? = null,
    @Json(name = "user_id") val userIdSnake: String? = null,
    val username: String? = null,
    val fullName: String? = null,
    @Json(name = "full_name") val fullNameSnake: String? = null,
    val name: String? = null,
    val email: String? = null,
    val role: String? = null,
    val avatarUrl: String? = null,
    @Json(name = "avatar_url") val avatarUrlSnake: String? = null,
    @Json(name = "photo_url") val photoUrl: String? = null,
    @Json(name = "profile_photo_url") val profilePhotoUrl: String? = null,
    @Json(name = "profile_image_url") val profileImageUrl: String? = null,
    val picture: String? = null
) {
    fun resolvedAccessToken(): String? = accessToken ?: accessTokenSnake
    fun resolvedRefreshToken(): String? = refreshToken ?: refreshTokenSnake
    fun resolvedUserId(): String? = userId ?: userIdSnake
    fun resolvedFullName(): String? = fullName ?: fullNameSnake ?: name
    fun resolvedAvatarUrl(): String? = listOf(
        avatarUrl,
        avatarUrlSnake,
        photoUrl,
        profilePhotoUrl,
        profileImageUrl,
        picture
    ).firstOrNull { !it.isNullOrBlank() }
}
data class ApiEnvelope<T>(val data: T?, val error: String?)
