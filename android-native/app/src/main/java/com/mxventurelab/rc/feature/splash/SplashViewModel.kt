package com.mxventurelab.rc.feature.splash

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.mxventurelab.rc.data.repository.AuthRepository
import com.mxventurelab.rc.domain.model.Role
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn
import javax.inject.Inject

@HiltViewModel
class SplashViewModel @Inject constructor(authRepository: AuthRepository) : ViewModel() {
    val destination = authRepository.session.map { session ->
        when (session?.role) {
            Role.Candidate -> "candidate"
            Role.Employer -> "employer"
            Role.SupportUser -> "support"
            Role.Admin -> "admin"
            Role.Recruiter -> "recruiter"
            else -> "home"
        }
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), "home")
}
