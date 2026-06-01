package com.mxventurelab.rc.core.network

import com.mxventurelab.rc.core.session.TokenStore
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.runBlocking
import okhttp3.Interceptor
import okhttp3.Response
import javax.inject.Inject

class AuthInterceptor @Inject constructor(
    private val tokenStore: TokenStore
) : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val session = runBlocking { tokenStore.session.first() }
        val request = chain.request().newBuilder().apply {
            session?.accessToken?.takeIf { it.isNotBlank() }?.let {
                addHeader("Authorization", "Bearer $it")
            }
        }.build()
        return chain.proceed(request)
    }
}
