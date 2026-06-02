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

enum class JobFilterType { Location, JobType, Experience, Industry }

data class JobFilterOption(
    val id: String,
    val label: String,
    val type: JobFilterType
)

data class JobsUiState(
    val jobs: List<Job> = emptyList(),
    val search: String = "",
    val filterOptions: List<JobFilterOption> = emptyList(),
    val selectedFilters: Set<String> = emptySet(),
    val loading: Boolean = false,
    val error: String? = null
)

@HiltViewModel
class JobsViewModel @Inject constructor(private val jobsRepository: JobsRepository) : ViewModel() {
    private val search = MutableStateFlow("")
    private val selectedFilters = MutableStateFlow<Set<String>>(emptySet())
    private val loading = MutableStateFlow(false)
    private val error = MutableStateFlow<String?>(null)

    val state = combine(jobsRepository.observeJobs(), search, selectedFilters, loading, error) { jobs, query, filters, isLoading, err ->
        val options = buildFilterOptions(jobs)
        val selectedOptions = options.filter { filters.contains(it.id) }
        val filteredJobs = jobs
            .asSequence()
            .filter { it.matchesSearch(query) }
            .filter { it.matchesFilters(selectedOptions) }
            .sortedByDescending { it.matchScore ?: 0 }
            .toList()

        JobsUiState(
            jobs = filteredJobs,
            search = query,
            filterOptions = options,
            selectedFilters = filters.intersect(options.map { it.id }.toSet()),
            loading = isLoading,
            error = err
        )
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), JobsUiState())

    init { refresh() }

    fun updateSearch(value: String) { search.value = value }

    fun toggleFilter(option: JobFilterOption) {
        selectedFilters.value = if (selectedFilters.value.contains(option.id)) {
            selectedFilters.value - option.id
        } else {
            selectedFilters.value + option.id
        }
    }

    fun clearFilters() { selectedFilters.value = emptySet() }

    fun refresh() = viewModelScope.launch {
        loading.value = true
        error.value = jobsRepository.refresh(search.value).exceptionOrNull()?.message
        loading.value = false
    }

    fun apply(jobId: String) = viewModelScope.launch {
        jobsRepository.apply(jobId)
    }

    private fun Job.matchesSearch(query: String): Boolean {
        val q = query.trim()
        if (q.isBlank()) return true
        return title.contains(q, true) ||
            company.contains(q, true) ||
            location.contains(q, true) ||
            industry.contains(q, true) ||
            skills.any { it.contains(q, true) }
    }

    private fun Job.matchesFilters(options: List<JobFilterOption>): Boolean {
        if (options.isEmpty()) return true
        return options.groupBy { it.type }.all { (_, groupOptions) ->
            groupOptions.any { option -> matchesFilter(option) }
        }
    }

    private fun Job.matchesFilter(option: JobFilterOption): Boolean = when (option.type) {
        JobFilterType.Location -> locationLabel() == option.label || location.contains(option.label, true) || jobType.contains(option.label, true)
        JobFilterType.JobType -> jobType.equals(option.label, true)
        JobFilterType.Experience -> experienceLevel.equals(option.label, true)
        JobFilterType.Industry -> industry.equals(option.label, true)
    }

    private fun buildFilterOptions(jobs: List<Job>): List<JobFilterOption> {
        val locations = jobs.map { it.locationLabel() }.distinctStable().map { it.toFilterOption(JobFilterType.Location) }
        val jobTypes = jobs.map { it.jobType.cleanLabel() }.filter { it.isNotBlank() }.distinctStable().map { it.toFilterOption(JobFilterType.JobType) }
        val levels = jobs.map { it.experienceLevel.cleanLabel() }.filter { it.isNotBlank() }.distinctStable().map { it.toFilterOption(JobFilterType.Experience) }
        val industries = jobs.map { it.industry.cleanLabel() }.filter { it.isNotBlank() }.distinctStable().map { it.toFilterOption(JobFilterType.Industry) }
        return locations + jobTypes + levels + industries
    }

    private fun Job.locationLabel(): String {
        val joined = listOf(location, jobType).joinToString(" ").lowercase()
        return when {
            joined.contains("remote") -> "Remote"
            joined.contains("hybrid") -> "Hybrid"
            joined.contains("on-site") || joined.contains("onsite") -> "On-site"
            location.contains("dhaka", true) -> "Dhaka"
            location.contains("chattogram", true) || location.contains("chittagong", true) -> "Chattogram"
            location.contains("sylhet", true) -> "Sylhet"
            location.contains("rajshahi", true) -> "Rajshahi"
            location.contains("khulna", true) -> "Khulna"
            location.contains("barishal", true) || location.contains("barisal", true) -> "Barishal"
            location.contains("rangpur", true) -> "Rangpur"
            location.contains("mymensingh", true) -> "Mymensingh"
            else -> location.substringBefore(',').trim().ifBlank { "Bangladesh" }
        }
    }

    private fun String.toFilterOption(type: JobFilterType): JobFilterOption {
        val label = cleanLabel()
        return JobFilterOption(id = "${type.name}:$label", label = label, type = type)
    }

    private fun String.cleanLabel(): String = trim().replace(Regex("\\s+"), " ")

    private fun List<String>.distinctStable(): List<String> {
        val seen = linkedSetOf<String>()
        forEach { value ->
            val label = value.cleanLabel()
            if (label.isNotBlank()) seen.add(label)
        }
        return seen.toList()
    }
}
