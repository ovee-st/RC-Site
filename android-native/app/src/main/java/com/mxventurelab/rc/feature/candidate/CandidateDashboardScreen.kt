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
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.Logout
import androidx.compose.material.icons.outlined.DarkMode
import androidx.compose.material.icons.outlined.Download
import androidx.compose.material.icons.outlined.Edit
import androidx.compose.material.icons.outlined.LightMode
import androidx.compose.material.icons.outlined.Notifications
import androidx.compose.material.icons.outlined.Work
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Checkbox
import androidx.compose.material3.Icon
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TextField
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
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
import com.mxventurelab.rc.core.design.RcIconActionButton
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
    var activePanel by rememberSaveable { mutableStateOf<String?>(null) }

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
        item {
            CandidateProfileBuilder(
                session = session,
                onEditProfile = { activePanel = "profile" },
                onDownloadCv = { activePanel = "cv" }
            )
        }
        item { ApplicationTimeline() }
        item { AiCareerAssistant(onAskCoach = { activePanel = "coach" }) }
        item { RecommendedJobs(navController) }
        item { Spacer(Modifier.height(20.dp)) }
    }

    CandidateActionDialog(
        panel = activePanel,
        session = session,
        onDismiss = { activePanel = null }
    )
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
                Text(
                    "MXVL",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.ExtraBold,
                    color = MaterialTheme.colorScheme.onBackground
                )
                Text("Candidate", style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
        }
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            RcIconActionButton(
                icon = if (isDark) Icons.Outlined.LightMode else Icons.Outlined.DarkMode,
                contentDescription = "Toggle theme",
                onClick = onToggleTheme
            )
            RcIconActionButton(
                icon = Icons.AutoMirrored.Outlined.Logout,
                contentDescription = "Logout",
                onClick = onLogout
            )
        }
    }
}

@Composable
private fun CandidateAvatar(avatarUrl: String?, name: String, size: Dp) {
    val cleanUrl = avatarUrl?.trim()?.takeIf { it.isNotBlank() }
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
private fun CandidateProfileBuilder(
    session: UserSession?,
    onEditProfile: () -> Unit,
    onDownloadCv: () -> Unit
) = RcCard {
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
            OutlinedButton(onClick = onEditProfile, modifier = Modifier.weight(1f)) {
                Icon(Icons.Outlined.Edit, null, Modifier.size(16.dp))
                Text(" Edit profile", maxLines = 1)
            }
            OutlinedButton(onClick = onDownloadCv, modifier = Modifier.weight(1f)) {
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
private fun ApplicationTimeline() = RcCard(Modifier.fillMaxWidth()) {
    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
        Text("Application tracker", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
        listOf("Applied", "Under Review", "Shortlisted", "Interview", "Selected", "Rejected").chunked(3).forEach { row ->
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                row.forEach { RcBadge(it) }
            }
        }
    }
}

@Composable
private fun AiCareerAssistant(onAskCoach: () -> Unit) = RcCard {
    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
        Text("AI Career Assistant", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
        Text(
            "CV review, skill gap analysis, profile suggestions, job matching, and interview preparation.",
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        RcPrimaryButton("Ask AI Coach", Modifier.fillMaxWidth(), onClick = onAskCoach)
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

@Composable
private fun CandidateActionDialog(panel: String?, session: UserSession?, onDismiss: () -> Unit) {
    when (panel) {
        "profile" -> ProfileEditorDialog(session, onDismiss)
        "cv" -> CvDownloadDialog(onDismiss)
        "coach" -> AiCoachDialog(onDismiss)
    }
}

@Composable
private fun ProfileEditorDialog(session: UserSession?, onDismiss: () -> Unit) {
    var displayName by rememberSaveable(session?.fullName) { mutableStateOf(session?.fullName ?: "") }
    var headline by rememberSaveable { mutableStateOf("Administrative Human Resources") }
    var phone by rememberSaveable { mutableStateOf("") }
    var location by rememberSaveable { mutableStateOf("Dhaka, Bangladesh") }
    var careerLevel by rememberSaveable { mutableStateOf("Mid Level") }
    var category by rememberSaveable { mutableStateOf("HR & Admin") }
    var preferredLocation by rememberSaveable { mutableStateOf("On-site") }
    var skills by rememberSaveable { mutableStateOf("Admin, Excel, Coordination, Documentation") }
    var linkedIn by rememberSaveable { mutableStateOf("") }
    var expectedSalary by rememberSaveable { mutableStateOf("") }
    var summary by rememberSaveable {
        mutableStateOf("I am an Assistant Manager - Administration with experience supporting fast-growing operations, vendor coordination, facilities, and daily reporting.")
    }
    var immediateAvailability by rememberSaveable { mutableStateOf(true) }
    var noticePeriod by rememberSaveable { mutableStateOf("") }
    var noticeUnit by rememberSaveable { mutableStateOf("Days") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Edit full profile", fontWeight = FontWeight.ExtraBold) },
        text = {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .heightIn(max = 560.dp)
                    .verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Text(
                    "Update the profile details employers see in the mobile app.",
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )

                Text("Identity", style = MaterialTheme.typography.labelLarge, color = MaterialTheme.colorScheme.primary)
                TextField(value = displayName, onValueChange = { displayName = it }, label = { Text("Full name") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                TextField(value = headline, onValueChange = { headline = it }, label = { Text("Professional headline") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                TextField(value = phone, onValueChange = { phone = it }, label = { Text("Phone number") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                TextField(value = location, onValueChange = { location = it }, label = { Text("Current location") }, singleLine = true, modifier = Modifier.fillMaxWidth())

                Text("Career profile", style = MaterialTheme.typography.labelLarge, color = MaterialTheme.colorScheme.primary)
                TextField(value = careerLevel, onValueChange = { careerLevel = it }, label = { Text("Career level") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                TextField(value = category, onValueChange = { category = it }, label = { Text("Department / category") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                TextField(value = preferredLocation, onValueChange = { preferredLocation = it }, label = { Text("Preferred job location") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                TextField(value = expectedSalary, onValueChange = { expectedSalary = it }, label = { Text("Expected salary") }, singleLine = true, modifier = Modifier.fillMaxWidth())

                Text("Skills and links", style = MaterialTheme.typography.labelLarge, color = MaterialTheme.colorScheme.primary)
                TextField(value = skills, onValueChange = { skills = it }, label = { Text("Skills") }, modifier = Modifier.fillMaxWidth())
                TextField(value = linkedIn, onValueChange = { linkedIn = it }, label = { Text("LinkedIn profile") }, singleLine = true, modifier = Modifier.fillMaxWidth())

                Text("Availability", style = MaterialTheme.typography.labelLarge, color = MaterialTheme.colorScheme.primary)
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Checkbox(checked = immediateAvailability, onCheckedChange = { immediateAvailability = it })
                    Column {
                        Text("Immediate availability", fontWeight = FontWeight.Bold)
                        Text("Tick this if you can join immediately.", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                }
                if (!immediateAvailability) {
                    Row(horizontalArrangement = Arrangement.spacedBy(10.dp), modifier = Modifier.fillMaxWidth()) {
                        TextField(
                            value = noticePeriod,
                            onValueChange = { noticePeriod = it },
                            label = { Text("Notice period") },
                            singleLine = true,
                            modifier = Modifier.weight(1f)
                        )
                        TextField(
                            value = noticeUnit,
                            onValueChange = { noticeUnit = it },
                            label = { Text("Days / Months") },
                            singleLine = true,
                            modifier = Modifier.weight(1f)
                        )
                    }
                }

                Text("About", style = MaterialTheme.typography.labelLarge, color = MaterialTheme.colorScheme.primary)
                TextField(
                    value = summary,
                    onValueChange = { summary = it },
                    label = { Text("Professional summary") },
                    minLines = 4,
                    maxLines = 6,
                    modifier = Modifier.fillMaxWidth()
                )

                Text(
                    "Profile photo is loaded from your MXVL web profile and syncs after login refresh.",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        },
        confirmButton = { TextButton(onClick = onDismiss) { Text("Save") } },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancel") } }
    )
}

@Composable
private fun CvDownloadDialog(onDismiss: () -> Unit) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Download CV", fontWeight = FontWeight.ExtraBold) },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Text("Choose the CV format you want to prepare from your profile data.", color = MaterialTheme.colorScheme.onSurfaceVariant)
                RcPrimaryButton("Download ATS CV", Modifier.fillMaxWidth(), onClick = onDismiss)
                OutlinedButton(onClick = onDismiss, modifier = Modifier.fillMaxWidth()) { Text("Download Customized CV") }
                Text("If the file is not available yet, complete your profile in the web portal first.", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
        },
        confirmButton = { TextButton(onClick = onDismiss) { Text("Close") } }
    )
}

@Composable
private fun AiCoachDialog(onDismiss: () -> Unit) {
    var input by rememberSaveable { mutableStateOf("") }
    var response by rememberSaveable { mutableStateOf("Ask about CV keywords, interview prep, skill gaps, or how to improve your profile score.") }
    val prompts = listOf("Improve my CV", "Missing skills", "Interview prep")

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("AI Career Coach", fontWeight = FontWeight.ExtraBold) },
        text = {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    prompts.forEach { prompt ->
                        OutlinedButton(onClick = { response = coachReply(prompt) }) { Text(prompt, maxLines = 1) }
                    }
                }
                RcCard {
                    Text(response, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
                TextField(
                    value = input,
                    onValueChange = { input = it },
                    label = { Text("Ask the coach") },
                    modifier = Modifier.fillMaxWidth(),
                    minLines = 2
                )
            }
        },
        confirmButton = {
            TextButton(onClick = {
                response = coachReply(input.ifBlank { "Profile improvement" })
                input = ""
            }) { Text("Send") }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Close") } }
    )
}

private fun coachReply(prompt: String): String {
    val focus = prompt.lowercase()
    return when {
        "skill" in focus -> "Prioritize 4-6 role-matched skills, keep the strongest ones first, and connect each skill to one measurable work example."
        "interview" in focus -> "Prepare two STAR stories: one about operational ownership and one about solving a difficult coordination issue under time pressure."
        "cv" in focus || "resume" in focus -> "Make your CV ATS-safe by using clear section headings, measurable outcomes, and exact keywords from the jobs you want to apply for."
        else -> "Start with one stronger proof point in your summary, add measurable outcomes, and keep your profile aligned to the roles you want most."
    }
}
