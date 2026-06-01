package com.mxventurelab.rc.domain.model

data class Job(
    val id: String,
    val title: String,
    val company: String,
    val location: String,
    val salary: String,
    val deadline: String,
    val jobType: String,
    val experienceLevel: String,
    val industry: String,
    val skills: List<String>,
    val matchScore: Int? = null,
    val description: String
)
