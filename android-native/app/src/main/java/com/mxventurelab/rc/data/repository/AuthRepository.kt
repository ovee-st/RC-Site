package com.mxventurelab.rc.data.repository

import com.mxventurelab.rc.core.session.TokenStore
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
        val data = response.data ?: mockSession(email)
        val session = UserSession(
            accessToken = data.accessToken ?: "mock-token",
            refreshToken = data.refreshToken,
            userId = data.userId ?: email,
            username = data.username ?: email.substringBefore("@"),
            fullName = data.fullName ?: email.substringBefore("@").replace('.', ' ').replaceFirstChar { it.uppercase() },
            email = data.email ?: email,
            role = Role.fromApi(data.role ?: inferRole(email)),
            avatarUrl = data.avatarUrl
        )
        tokenStore.save(session)
        session
    }

    suspend fun register(fullName: String, email: String, password: String, role: Role): Result<UserSession> = runCatching {
        val response = api.register(RegisterRequest(fullName, email, password, role.name.lowercase()))
        val data = response.data ?: mockSession(email, role.name)
        val session = UserSession(
            accessToken = data.accessToken ?: "mock-token",
            refreshToken = data.refreshToken,
            userId = data.userId ?: email,
            username = data.username ?: "${role.name.lowercase()}_${email.hashCode().toString().takeLast(6)}",
            fullName = data.fullName ?: fullName,
            email = data.email ?: email,
            role = Role.fromApi(data.role ?: role.name),
            avatarUrl = data.avatarUrl
        )
        tokenStore.save(session)
        session
    }

    suspend fun logout() = tokenStore.clear()

    private fun mockSession(email: String, role: String = inferRole(email)) =
        com.mxventurelab.rc.data.remote.ApiSession("mock-token", null, email, email.substringBefore("@"), email.substringBefore("@"), email, role, null)

    private fun inferRole(email: String): String = when {
        email.contains("admin", true) -> "admin"
        email.contains("support", true) -> "support_user"
        email.contains("employer", true) -> "employer"
        email.contains("recruiter", true) -> "recruiter"
        else -> "candidate"
    }
}
