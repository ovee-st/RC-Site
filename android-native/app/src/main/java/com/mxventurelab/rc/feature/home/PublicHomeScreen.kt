package com.mxventurelab.rc.feature.home

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.navigation.NavController
import com.mxventurelab.rc.core.design.GradientHeader
import com.mxventurelab.rc.core.design.RcCard
import com.mxventurelab.rc.core.design.RcPrimaryButton
import com.mxventurelab.rc.navigation.RcRoutes

@Composable
fun PublicHomeScreen(navController: NavController) {
    LazyColumn(Modifier.fillMaxSize().padding(18.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
        item {
            GradientHeader {
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Text("Hire top talent with one AI command center.", style = MaterialTheme.typography.headlineLarge, color = MaterialTheme.colorScheme.onPrimary)
                    Text("Native recruitment workflows for jobs, shortlists, ATS, live support, and managed hiring.", color = MaterialTheme.colorScheme.onPrimary.copy(alpha = 0.9f))
                    RcPrimaryButton("Login", onClick = { navController.navigate(RcRoutes.Login) })
                }
            }
        }
        item {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                listOf("48h\nShortlist", "90%\nMatch", "10k+\nProfiles").forEach {
                    RcCard(Modifier.weight(1f)) { Text(it, fontWeight = FontWeight.Bold) }
                }
            }
        }
        items(services.size) { index ->
            val service = services[index]
            RcCard {
                Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    Text(service.first, style = MaterialTheme.typography.titleMedium)
                    Text(service.second, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f))
                }
            }
        }
    }
}

private val services = listOf(
    "Featured Jobs" to "Browse active roles across Dhaka, remote, hybrid, and onsite teams.",
    "Recruitment Services" to "White collar, blue collar, business promoters, and staffing support.",
    "Success Stories" to "Companies use MXVL to reduce screening time and hire faster.",
    "News & Updates" to "Hiring insights, platform releases, and candidate success stories.",
    "Contact" to "Reach MX Venture Lab for managed recruitment and business support."
)
