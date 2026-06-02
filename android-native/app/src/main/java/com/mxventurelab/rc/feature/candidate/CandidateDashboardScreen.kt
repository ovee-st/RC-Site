package com.mxventurelab.rc.feature.candidate

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.Logout
import androidx.compose.material.icons.outlined.DarkMode
import androidx.compose.material.icons.outlined.Download
import androidx.compose.material.icons.outlined.Edit
import androidx.compose.material.icons.outlined.LightMode
import androidx.compose.material.icons.outlined.Notifications
import androidx.compose.material.icons.outlined.Work
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavController
import coil.compose.AsyncImage
import com.mxventurelab.rc.core.design.GradientHeader
import com.mxventurelab.rc.core.design.LocalRcThemeController
import com.mxventurelab.rc.core.design.RcBadge
import com.mxventurelab.rc.core.design.RcCard
import com.mxventurelab.rc.core.design.RcPrimaryButton
import com.mxventurelab.rc.domain.model.UserSession
import com.mxventurelab.rc.navigation.RcRoutes

@Composable
fun CandidateDashboardScreen(
    navController: NavController,
    viewModel: CandidateDashboardViewModel = hiltViewModel()
) {
    val theme = LocalRcThemeController.current
    val session by viewModel.session.collectAsState()

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .statusBarsPadding()
            .navigationBarsPadding()
            .padding(horizontal = 16.dp, vertical = 12.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        item {
            CandidateTopBar(
                session = session,
                isDark = theme.isDark,
                onToggleTheme = theme.toggle,
                onLogout = {
                    viewModel.logout {
                        navController.navigate(RcRoutes.Login) {
                            popUpTo(0) { inclusive = true }
                        }
                    }
                }
            )
        }

        item {
            GradientHeader {
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Text(
                        "Career Command Center",
                        color = MaterialTheme.colorScheme.onPrimary,
                        style = MaterialTheme.typography.headlineSmall,
                        fontWeight = FontWeight.ExtraBold
                    )
                    Text(
                        "Track jobs, applications, interviews, resume health, and AI recommendations.",
                        color = MaterialTheme.colorScheme.onPrimary.copy(alpha = 0.9f),
                        style = MaterialTheme.typography.bodyMedium
                    )
                    Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        RcPrimaryButton(
                            "Browse Jobs",
                            Modifier.weight(1f),
                            onClick = { navController.navigate(RcRoutes.Jobs) }
                        )
                        OutlinedButton(
                            onClick = { navController.navigate(RcRoutes.Notifications) },
                            modifier = Modifier.weight(1f),
                            colors = ButtonDefaults.outlinedButtonColors(contentColor = MaterialTheme.colorScheme.onPrimary)
                        ) { Text("Notifications", maxLines = 1) }
                    }
                }
            }
        }

        item { MetricGrid() }
        item { CandidateProfileBuilder(session) }
        item { ApplicationTimeline() }
        item { AiCareerAssistant() }
        item { RecommendedJobs(navController) }
        item { Spacer(Modifier.height(20.dp)) }
    }
}

@Composable
private fun CandidateTopBar(
    session: UserSession?,
    isDark: Boolean,
    onToggleTheme: () -> Unit,
    onLogout: () -> Unit
) {
    val displayName = session?.fullName?.takeIf { it.isNotBlank() } ?: "MXVL Candidate"
    Row(
        modifier = Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            CandidateAvatar(
                avatarUrl = session?.avatarUrl,
                name = displayName,
                size = 40.dp
            )
            Column {
                Text("MXVL", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.ExtraBold)
                Text("Candidate", style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
        }
        Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
            IconButton(onClick = onToggleTheme) {
                Icon(if (isDark) Icons.Outlined.LightMode else Icons.Outlined.DarkMode, contentDescription = "Toggle theme")
            }
            IconButton(onClick = onLogout) {
                Icon(Icons.AutoMirrored.Outlined.Logout, contentDescription = "Logout")
            }
        }
    }
}

@Composable
private fun CandidateAvatar(avatarUrl: String?, name: String, size: Dp) {
    val cleanUrl = avatarUrl?.takeIf { it.isNotBlank() }
    Box(
        modifier = Modifier
            .size(size)
            .clip(CircleShape)
            .background(MaterialTheme.colorScheme.primary.copy(alpha = 0.12f)),
        contentAlignment = Alignment.Center
    ) {
        if (cleanUrl != null) {
            AsyncImage(
                model = cleanUrl,
                contentDescription = "$name profile photo",
                contentScale = ContentScale.Crop,
                modifier = Modifier
                    .fillMaxSize()
                    .clip(CircleShape)
            )
        } else {
            Text(initials(name), color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.ExtraBold)
        }
    }
}

private fun initials(name: String): String = name
    .split(" ")
    .filter { it.isNotBlank() }
    .take(2)
    .joinToString("") { it.first().uppercase() }
    .ifBlank { "MX" }

@Composable
private fun MetricGrid() {
    val metrics = remember {
        listOf(
            "88%" to "Profile",
            "3" to "Applied",
            "1" to "Interviews",
            "94%" to "Best fit"
        )
    }
    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            metrics.take(2).forEach { (value, label) -> MetricCard(value, label, Modifier.weight(1f)) }
        }
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            metrics.drop(2).forEach { (value, label) -> MetricCard(value, label, Modifier.weight(1f)) }
        }
    }
}

@Composable
private fun MetricCard(value: String, label: String, modifier: Modifier = Modifier) = RcCard(modifier) {
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Text(value, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.ExtraBold)
        Text(label, style = MaterialTheme.typography.labelLarge, color = MaterialTheme.colorScheme.onSurfaceVariant, maxLines = 1)
    }
}

@Composable
private fun CandidateProfileBuilder(session: UserSession?) = RcCard {
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
            Text("Profile Builder", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
            RcBadge("88%")
        }
        Text(
            "Personal info, education, experience, skills, certifications, languages, resume upload, and profile photo.",
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            style = MaterialTheme.typography.bodyMedium
        )
        LinearProgressIndicator(progress = { 0.88f }, modifier = Modifier.fillMaxWidth())
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            OutlinedButton(onClick = { }, modifier = Modifier.weight(1f)) {
                Icon(Icons.Outlined.Edit, null, Modifier.size(16.dp))
                Text(" Edit profile", maxLines = 1)
            }
            OutlinedButton(onClick = { }, modifier = Modifier.weight(1f)) {
                Icon(Icons.Outlined.Download, null, Modifier.size(16.dp))
                Text(" Download CV", maxLines = 1)
            }
        }
        session?.email?.takeIf { it.isNotBlank() }?.let {
            Text(it, style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}

@Composable
private fun ApplicationTimeline() = RcCard {
    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
        Text("Application tracker", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
        listOf("Applied", "Under Review", "Shortlisted", "Interview", "Selected", "Rejected").chunked(3).forEach { row ->
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                row.forEach { RcBadge(it) }
            }
        }
    }
}

@Composable
private fun AiCareerAssistant() = RcCard {
    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
        Text("AI Career Assistant", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
        Text(
            "CV review, skill gap analysis, profile suggestions, job matching, and interview preparation.",
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        RcPrimaryButton("Ask AI Coach", Modifier.fillMaxWidth(), onClick = {})
    }
}

@Composable
private fun RecommendedJobs(navController: NavController) = RcCard {
    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
            Text("Best-fit roles", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
            RcBadge("Live")
        }
        listOf(
            Triple("Admin & Operations Manager", "MX Partner Employer", "94%"),
            Triple("Customer Support Executive", "Remote Support BD", "82%")
        ).forEach { (title, company, score) ->
            Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                Box(
                    Modifier
                        .size(36.dp)
                        .clip(CircleShape)
                        .background(MaterialTheme.colorScheme.secondary.copy(alpha = 0.16f)),
                    contentAlignment = Alignment.Center
                ) { Icon(Icons.Outlined.Work, null, tint = MaterialTheme.colorScheme.secondary) }
                Column(Modifier.weight(1f)) {
                    Text(title, fontWeight = FontWeight.Bold, maxLines = 1, overflow = TextOverflow.Ellipsis)
                    Text(company, color = MaterialTheme.colorScheme.onSurfaceVariant, style = MaterialTheme.typography.bodySmall)
                }
                RcBadge(score)
            }
        }
        RcPrimaryButton("Browse and apply", Modifier.fillMaxWidth(), onClick = { navController.navigate(RcRoutes.Jobs) })
    }
}