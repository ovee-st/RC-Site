package com.mxventurelab.rc.domain.model

enum class Role {
    Candidate, Employer, SupportUser, Admin, Recruiter, Guest;

    companion object {
        fun fromApi(value: String?): Role {
            val normalized = value
                ?.trim()
                ?.lowercase()
                ?.replace("-", "_")
                ?.replace(" ", "_")

            return when (normalized) {
                "candidate", "canidate" -> Candidate
                "employer" -> Employer
                "support", "supportuser", "support_user", "support_agent", "support_senior", "support_manager", "employee" -> SupportUser
                "admin", "super_admin", "admin_viewer", "viewer", "administrator" -> Admin
                "recruiter" -> Recruiter
                else -> Guest
            }
        }
    }
}
