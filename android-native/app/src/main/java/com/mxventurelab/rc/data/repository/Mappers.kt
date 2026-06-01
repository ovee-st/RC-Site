package com.mxventurelab.rc.data.repository

import com.mxventurelab.rc.data.local.JobEntity
import com.mxventurelab.rc.domain.model.Job

fun Job.toEntity(): JobEntity = JobEntity(
    id, title, company, location, salary, deadline, jobType, experienceLevel,
    industry, skills.joinToString("|"), matchScore, description
)

fun JobEntity.toDomain(): Job = Job(
    id, title, company, location, salary, deadline, jobType, experienceLevel,
    industry, skills.split("|").filter { it.isNotBlank() }, matchScore, description
)
