package com.mxventurelab.rc.data.local

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "jobs")
data class JobEntity(
    @PrimaryKey val id: String,
    val title: String,
    val company: String,
    val location: String,
    val salary: String,
    val deadline: String,
    val jobType: String,
    val experienceLevel: String,
    val industry: String,
    val skills: String,
    val matchScore: Int?,
    val description: String
)
