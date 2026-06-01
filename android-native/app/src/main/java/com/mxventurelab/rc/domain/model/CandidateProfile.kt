package com.mxventurelab.rc.domain.model

data class CandidateProfile(
    val id: String,
    val fullName: String,
    val title: String,
    val location: String,
    val completion: Int,
    val avatarUrl: String?,
    val skills: List<String>,
    val resumeUrl: String?
)
