package com.mxventurelab.rc.data.repository

import com.mxventurelab.rc.core.session.TokenStore
import com.mxventurelab.rc.data.remote.ApiSession
import com.mxventurelab.rc.data.remote.LoginRequest
import com.mxventurelab.rc.data.remote.RcApiService
import com.mxventurelab.rc.data.remote.RegisterRequest
import com.mxventurelab.rc.domain.model.Role
import com.mxventurelab.rc.domain.model.UserSession
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AuthRepository @Inject constructor(
    private val api: RcApiService,
    private val tokenStore: TokenStore
) {
    val session: Flow<UserSession?> = tokenStore.session

    suspend fun login(email: String, password: String): Result<UserSession> = runCatching {
        val response = api.login(LoginRequest(email, password))
        response.error?.let { throw IllegalStateException(it) }
        val data = response.data ?: throw IllegalStateException("Login failed. Please try again.")
        val session = data.toUserSession(
            fallbackEmail = email,
            fallbackName = email.substringBefore("@").replace('.', ' ').replaceFirstChar { it.uppercase() },
            fallbackRole = Role.Candidate,
            missingSessionMessage = "Login session was not returned."
        )
        tokenStore.save(session)
        session
    }

    suspend fun register(fullName: String, email: String, password: String, role: Role): Result<UserSession> = runCatching {
        val response = api.register(RegisterRequest(fullName, email, password, role.name.lowercase()))
        response.error?.let { throw IllegalStateException(it) }
        val data = response.data ?: throw IllegalStateException("Registration failed. Please try again.")
        val session = data.toUserSession(
            fallbackEmail = email,
            fallbackName = fullName,
            fallbackUsername = "${role.name.lowercase()}_${email.hashCode().toString().takeLast(6)}",
            fallbackRole = role,
            missingSessionMessage = "Registration session was not returned."
        )
        tokenStore.save(session)
        session
    }

    suspend fun refreshSession(): Result<UserSession> = runCatching {
        val response = api.currentSession()
        response.error?.let { throw IllegalStateException(it) }
        val data = response.data ?: throw IllegalStateException("Session refresh failed. Please sign in again.")
        val session = data.toUserSession(missingSessionMessage = "Session refresh failed. Please sign in again.")
        tokenStore.save(session)
        session
    }

    suspend fun logout() = tokenStore.clear()

    private fun ApiSession.toUserSession(
        fallbackEmail: String? = null,
        fallbackName: String? = null,
        fallbackUsername: String? = null,
        fallbackRole: Role? = null,
        missingSessionMessage: String
    ): UserSession {
        val resolvedEmail = email ?: fallbackEmail ?: username ?: "user@mxventurelab.com"
        val apiRole = Role.fromApi(role)
        val resolvedRole = if (apiRole != Role.Guest) apiRole else (fallbackRole ?: Role.Candidate)
        return UserSession(
            accessToken = resolvedAccessToken() ?: throw IllegalStateException(missingSessionMessage),
            refreshToken = resolvedRefreshToken(),
            userId = resolvedUserId() ?: resolvedEmail,
            username = username ?: fallbackUsername ?: resolvedEmail.substringBefore("@"),
            fullName = resolvedFullName() ?: fallbackName ?: resolvedEmail.substringBefore("@").replace('.', ' ').replaceFirstChar { it.uppercase() },
            email = resolvedEmail,
            role = resolvedRole,
            avatarUrl = resolvedAvatarUrl()
        )
    }
}
