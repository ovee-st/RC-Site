package com.mxventurelab.rc.data.local

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "candidate_profiles")
data class CandidateProfileEntity(
    @PrimaryKey val id: String,
    val fullName: String,
    val title: String,
    val location: String,
    val completion: Int,
    val avatarUrl: String?,
    val skills: String,
    val resumeUrl: String?
)
