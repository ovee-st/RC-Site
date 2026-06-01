package com.mxventurelab.rc.feature.jobs

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.mxventurelab.rc.data.repository.JobsRepository
import com.mxventurelab.rc.domain.model.Job
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import javax.inject.Inject

data class JobsUiState(val jobs: List<Job> = emptyList(), val search: String = "", val loading: Boolean = false, val error: String? = null)

@HiltViewModel
class JobsViewModel @Inject constructor(private val jobsRepository: JobsRepository) : ViewModel() {
    private val search = MutableStateFlow("")
    private val loading = MutableStateFlow(false)
    private val error = MutableStateFlow<String?>(null)

    val state = combine(jobsRepository.observeJobs(), search, loading, error) { jobs, query, isLoading, err ->
        JobsUiState(
            jobs = jobs.filter { it.title.contains(query, true) || it.company.contains(query, true) }.sortedByDescending { it.matchScore ?: 0 },
            search = query,
            loading = isLoading,
            error = err
        )
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), JobsUiState())

    init { refresh() }

    fun updateSearch(value: String) { search.value = value }

    fun refresh() = viewModelScope.launch {
        loading.value = true
        error.value = jobsRepository.refresh(search.value).exceptionOrNull()?.message
        loading.value = false
    }

    fun apply(jobId: String) = viewModelScope.launch {
        jobsRepository.apply(jobId)
    }
}
