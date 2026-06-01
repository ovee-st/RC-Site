package com.mxventurelab.rc.feature.support

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.navigation.NavController
import com.mxventurelab.rc.core.design.RcCard
import com.mxventurelab.rc.core.design.RcPrimaryButton

@Composable
fun SupportDashboardScreen(navController: NavController) {
    Column(Modifier.fillMaxSize().padding(18.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
        Text("Support Desk", fontWeight = FontWeight.Black)
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            listOf("12\nOpen", "6\nCandidate Queries", "4\nEmployer Queries").forEach { RcCard(Modifier.weight(1f)) { Text(it, fontWeight = FontWeight.Bold) } }
        }
        RcCard {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text("Ticket Management")
                Text("Live chat, escalations, internal notes, SLA tracking, and support workflow.")
                RcPrimaryButton("Open Queue", Modifier.fillMaxWidth(), onClick = {})
            }
        }
    }
}
