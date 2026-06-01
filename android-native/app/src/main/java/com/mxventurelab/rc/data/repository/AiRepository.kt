package com.mxventurelab.rc.data.repository

import kotlinx.coroutines.delay
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AiRepository @Inject constructor() {
    suspend fun careerAdvice(prompt: String): String {
        delay(500)
        return "Based on your profile, prioritize measurable outcomes, align skills to target roles, and prepare two STAR interview stories for: $prompt"
    }

    suspend fun recruiterMatchExplanation(candidateName: String): String =
        "Strong profile fit for $candidateName based on skills, experience level, and availability."
}
