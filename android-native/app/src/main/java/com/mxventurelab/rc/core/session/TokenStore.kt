package com.mxventurelab.rc.core.session

import android.content.Context
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import com.mxventurelab.rc.domain.model.Role
import com.mxventurelab.rc.domain.model.UserSession
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

private val Context.dataStore by preferencesDataStore("secure_session")

@Singleton
class TokenStore @Inject constructor(@ApplicationContext private val context: Context) {
    private val token = stringPreferencesKey("token")
    private val refresh = stringPreferencesKey("refresh")
    private val userId = stringPreferencesKey("user_id")
    private val email = stringPreferencesKey("email")
    private val name = stringPreferencesKey("name")
    private val username = stringPreferencesKey("username")
    private val role = stringPreferencesKey("role")
    private val avatar = stringPreferencesKey("avatar")

    val session: Flow<UserSession?> = context.dataStore.data.map { pref ->
        val accessToken = pref[token] ?: return@map null
        UserSession(
            accessToken = accessToken,
            refreshToken = pref[refresh],
            userId = pref[userId].orEmpty(),
            username = pref[username].orEmpty(),
            fullName = pref[name].orEmpty(),
            email = pref[email].orEmpty(),
            role = Role.fromApi(pref[role]),
            avatarUrl = pref[avatar]
        )
    }

    suspend fun save(session: UserSession) {
        context.dataStore.edit {
            it[token] = session.accessToken
            it[refresh] = session.refreshToken.orEmpty()
            it[userId] = session.userId
            it[email] = session.email
            it[name] = session.fullName
            it[username] = session.username
            it[role] = session.role.name
            it[avatar] = session.avatarUrl.orEmpty()
        }
    }

    suspend fun clear() {
        context.dataStore.edit { it.clear() }
    }
}
