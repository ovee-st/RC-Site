package com.mxventurelab.rc.feature.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.mxventurelab.rc.data.repository.AuthRepository
import com.mxventurelab.rc.domain.model.Role
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class LoginUiState(val email: String = "", val password: String = "", val loading: Boolean = false, val error: String? = null, val role: Role? = null)

@HiltViewModel
class LoginViewModel @Inject constructor(private val authRepository: AuthRepository) : ViewModel() {
    private val _state = MutableStateFlow(LoginUiState())
    val state: StateFlow<LoginUiState> = _state

    fun email(value: String) { _state.value = _state.value.copy(email = value) }
    fun password(value: String) { _state.value = _state.value.copy(password = value) }

    fun login() = viewModelScope.launch {
        val current = _state.value
        if (!current.email.contains("@") || current.password.length < 6) {
            _state.value = current.copy(error = "Enter a valid email and password.")
            return@launch
        }
        _state.value = current.copy(loading = true, error = null)
        val result = authRepository.login(current.email, current.password)
        _state.value = result.fold(
            onSuccess = { _state.value.copy(loading = false, role = it.role) },
            onFailure = { _state.value.copy(loading = false, error = it.message ?: "Login failed") }
        )
    }
}
