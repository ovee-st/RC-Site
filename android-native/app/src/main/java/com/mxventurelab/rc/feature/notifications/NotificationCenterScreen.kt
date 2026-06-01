package com.mxventurelab.rc.feature.notifications

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.navigation.NavController
import com.mxventurelab.rc.core.design.RcCard

@Composable
fun NotificationCenterScreen(navController: NavController) {
    Column(Modifier.fillMaxSize().padding(18.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Text("Notifications")
        listOf("New Application", "Interview Invite", "Shortlist", "Job Approval", "Ticket Update").forEach { RcCard { Text(it) } }
    }
}
