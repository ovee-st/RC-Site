package com.mxventurelab.rc.feature.employer

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
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

@Composable
fun EmployerDashboardScreen(navController: NavController) {
    LazyColumn(Modifier.fillMaxSize().padding(18.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
        item { GradientHeader { Text("Recruiter Dashboard", fontWeight = FontWeight.Black) } }
        item {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                listOf("3\nActive Jobs", "8\nApplications", "4\nShortlisted", "2\nInterviews").forEach { RcCard(Modifier.weight(1f)) { Text(it, fontWeight = FontWeight.Bold) } }
            }
        }
        item { JobManagement() }
        item { CandidateManagement() }
        item { AiRecruiterAssistant() }
    }
}

@Composable
private fun JobManagement() = RcCard {
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Text("Job Management")
        Text("Create, edit, duplicate, pause, close, and delete jobs.")
        RcPrimaryButton("Create Job", Modifier.fillMaxWidth(), onClick = {})
    }
}

@Composable
private fun CandidateManagement() = RcCard {
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Text("Candidate Management")
        Text("Search candidates, preview resumes, shortlist, reject, and move to interview.")
        RcBadge("94% best match")
    }
}

@Composable
private fun AiRecruiterAssistant() = RcCard {
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Text("AI Recruiter Assistant")
        Text("Explains match score, strengths, weaknesses, and recommendations.")
    }
}
