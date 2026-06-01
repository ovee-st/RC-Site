package com.mxventurelab.rc.domain.model

enum class Role {
    Candidate, Employer, SupportUser, Admin, Recruiter, Guest;

    companion object {
        fun fromApi(value: String?): Role = when (value?.trim()?.lowercase()) {
            "candidate" -> Candidate
            "employer" -> Employer
            "support", "support_user", "support_agent", "support_senior", "support_manager", "employee" -> SupportUser
            "admin", "super_admin" -> Admin
            "recruiter" -> Recruiter
            else -> Guest
        }
    }
}
