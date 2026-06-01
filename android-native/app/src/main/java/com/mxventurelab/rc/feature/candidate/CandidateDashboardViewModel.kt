package com.mxventurelab.rc.feature.candidate

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.mxventurelab.rc.data.repository.AuthRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class CandidateDashboardViewModel @Inject constructor(
    private val authRepository: AuthRepository
) : ViewModel() {
    fun logout(onComplete: () -> Unit) {
        viewModelScope.launch {
            authRepository.logout()
            onComplete()
        }
    }
}
