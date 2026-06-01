package com.mxventurelab.rc.feature.jobs

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material3.AssistChip
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavController
import com.mxventurelab.rc.core.design.RcBadge
import com.mxventurelab.rc.core.design.RcCard
import com.mxventurelab.rc.core.design.RcPrimaryButton

@Composable
fun JobsScreen(navController: NavController, viewModel: JobsViewModel = hiltViewModel()) {
    val state by viewModel.state.collectAsState()
    Column(Modifier.fillMaxSize().padding(18.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Text("Jobs", style = MaterialTheme.typography.headlineMedium)
        OutlinedTextField(value = state.search, onValueChange = viewModel::updateSearch, modifier = Modifier.fillMaxWidth(), placeholder = { Text("Search jobs, skills, companies") })
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            listOf("Dhaka", "Remote", "Full Time", "Mid Level").forEach { AssistChip(onClick = {}, label = { Text(it) }) }
        }
        if (state.loading) CircularProgressIndicator()
        LazyColumn(verticalArrangement = Arrangement.spacedBy(12.dp)) {
            items(state.jobs.size) { index ->
                val job = state.jobs[index]
                RcCard {
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text(job.title, style = MaterialTheme.typography.titleMedium)
                            job.matchScore?.let { RcBadge("$it% match") }
                        }
                        Text("${job.company} • ${job.location}", color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f))
                        Text("${job.jobType} • ${job.experienceLevel} • ${job.salary}")
                        Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) { job.skills.take(4).forEach { RcBadge(it) } }
                        RcPrimaryButton("Apply", Modifier.fillMaxWidth(), onClick = { viewModel.apply(job.id) })
                    }
                }
            }
        }
    }
}
