package com.mxventurelab.rc.feature.candidate

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.navigation.NavController
import com.mxventurelab.rc.core.design.GradientHeader
import com.mxventurelab.rc.core.design.RcBadge
import com.mxventurelab.rc.core.design.RcCard
import com.mxventurelab.rc.core.design.RcPrimaryButton
import com.mxventurelab.rc.navigation.RcRoutes

@Composable
fun CandidateDashboardScreen(navController: NavController) {
    LazyColumn(Modifier.fillMaxSize().padding(18.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
        item {
            GradientHeader {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("Career Command Center", color = MaterialTheme.colorScheme.onPrimary, style = MaterialTheme.typography.headlineMedium)
                    Text("Track applications, interviews, resume health, and AI job recommendations.", color = MaterialTheme.colorScheme.onPrimary)
                }
            }
        }
        item {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                listOf("88%\nProfile", "3\nApplied", "1\nInterview", "94%\nAI Match").forEach {
                    RcCard(Modifier.weight(1f)) { Text(it, fontWeight = FontWeight.Bold) }
                }
            }
        }
        item { CandidateProfileBuilder() }
        item { ApplicationTimeline() }
        item { AiCareerAssistant() }
        item { RcPrimaryButton("Notifications", Modifier.fillMaxWidth(), onClick = { navController.navigate(RcRoutes.Notifications) }) }
    }
}

@Composable
private fun CandidateProfileBuilder() = RcCard {
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Text("Profile Builder", style = MaterialTheme.typography.titleLarge)
        Text("Personal Info • Education • Experience • Skills • Certifications • Languages • Resume Upload • Profile Photo")
        LinearProgressIndicator(progress = 0.88f, Modifier.fillMaxWidth())
    }
}

@Composable
private fun ApplicationTimeline() = RcCard {
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Text("Job Applications", style = MaterialTheme.typography.titleLarge)
        listOf("Applied", "Under Review", "Shortlisted", "Interview Scheduled", "Selected", "Rejected").forEach { RcBadge(it) }
    }
}

@Composable
private fun AiCareerAssistant() = RcCard {
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Text("AI Career Assistant", style = MaterialTheme.typography.titleLarge)
        Text("CV review, skill gap analysis, profile suggestions, job matching, and interview preparation.")
        RcPrimaryButton("Ask AI Coach", Modifier.fillMaxWidth(), onClick = {})
    }
}
