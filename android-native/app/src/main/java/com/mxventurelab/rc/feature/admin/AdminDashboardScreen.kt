package com.mxventurelab.rc.feature.admin

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.asPaddingValues
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawing
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.Logout
import androidx.compose.material.icons.outlined.AdminPanelSettings
import androidx.compose.material.icons.outlined.Analytics
import androidx.compose.material.icons.outlined.DarkMode
import androidx.compose.material.icons.outlined.Groups
import androidx.compose.material.icons.outlined.LightMode
import androidx.compose.material.icons.outlined.ManageAccounts
import androidx.compose.material.icons.outlined.Payments
import androidx.compose.material.icons.outlined.SupportAgent
import androidx.compose.material.icons.outlined.WorkOutline
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ElevatedButton
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavController
import com.mxventurelab.rc.core.design.LocalRcThemeController
import com.mxventurelab.rc.core.design.RcBadge
import com.mxventurelab.rc.core.design.RcIconActionButton
import com.mxventurelab.rc.navigation.RcRoutes

@Composable
fun AdminDashboardScreen(
    navController: NavController,
    viewModel: AdminDashboardViewModel = hiltViewModel()
) {
    val theme = LocalRcThemeController.current
    val safePadding = WindowInsets.safeDrawing.asPaddingValues()

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(
                    listOf(
                        MaterialTheme.colorScheme.background,
                        MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.55f),
                        MaterialTheme.colorScheme.background
                    )
                )
            )
            .padding(horizontal = 16.dp)
            .padding(
                top = safePadding.calculateTopPadding() + 12.dp,
                bottom = safePadding.calculateBottomPadding() + 24.dp
            ),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            AdminTopBar(
                isDark = theme.isDark,
                onToggleTheme = theme.toggle,
                onLogout = {
                    viewModel.logout {
                        navController.navigate(RcRoutes.Home) {
                            popUpTo(0) { inclusive = true }
                            launchSingleTop = true
                        }
                    }
                }
            )
        }
        item { AdminHeroCard() }
        item { AdminMetricsGrid() }
        item { AdminControlCard() }
        item { AdminOperationsGrid() }
    }
}

@Composable
private fun AdminTopBar(
    isDark: Boolean,
    onToggleTheme: () -> Unit,
    onLogout: () -> Unit
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Box(
                modifier = Modifier
                    .size(46.dp)
                    .clip(CircleShape)
                    .background(
                        Brush.linearGradient(
                            listOf(
                                MaterialTheme.colorScheme.primary,
                                MaterialTheme.colorScheme.secondary
                            )
                        )
                    ),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = Icons.Outlined.AdminPanelSettings,
                    contentDescription = null,
                    tint = Color.White,
                    modifier = Modifier.size(23.dp)
                )
            }
            Spacer(Modifier.width(12.dp))
            Column {
                Text(
                    text = "MXVL Admin",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Black,
                    color = MaterialTheme.colorScheme.onBackground,
                    maxLines = 1
                )
                Text(
                    text = "Command Center",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    maxLines = 1
                )
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
private fun AdminHeroCard() {
    Card(
        shape = RoundedCornerShape(28.dp),
        colors = CardDefaults.cardColors(containerColor = Color.Transparent),
        elevation = CardDefaults.cardElevation(defaultElevation = 8.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(
            modifier = Modifier
                .background(
                    Brush.linearGradient(
                        listOf(
                            MaterialTheme.colorScheme.primary,
                            MaterialTheme.colorScheme.secondary
                        )
                    )
                )
                .padding(22.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            RcBadge(text = "PLATFORM OWNER")
            Text(
                text = "Admin Command Center",
                style = MaterialTheme.typography.headlineSmall,
                fontWeight = FontWeight.Black,
                color = Color.White,
                maxLines = 2
            )
            Text(
                text = "Manage users, jobs, roles, revenue signals, support operations, and platform health from one native dashboard.",
                style = MaterialTheme.typography.bodyMedium,
                color = Color.White.copy(alpha = 0.86f)
            )
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                AdminHeroChip("Live ops")
                AdminHeroChip("Secure roles")
                AdminHeroChip("Reports")
            }
        }
    }
}

@Composable
private fun AdminHeroChip(text: String) {
    Box(
        modifier = Modifier
            .clip(RoundedCornerShape(999.dp))
            .background(Color.White.copy(alpha = 0.16f))
            .padding(horizontal = 12.dp, vertical = 7.dp)
    ) {
        Text(text = text, color = Color.White, style = MaterialTheme.typography.labelMedium, fontWeight = FontWeight.Bold)
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun AdminMetricsGrid() {
    FlowRow(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(10.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp),
        maxItemsInEachRow = 2
    ) {
        AdminMetricCard(Icons.Outlined.Groups, "Users", "247", "Registered")
        AdminMetricCard(Icons.Outlined.WorkOutline, "Active Jobs", "32", "Live roles")
        AdminMetricCard(Icons.Outlined.Analytics, "Applications", "118", "Tracked")
        AdminMetricCard(Icons.Outlined.Payments, "Revenue", "BDT 4.5k", "This month")
    }
}

@Composable
private fun AdminMetricCard(icon: ImageVector, label: String, value: String, caption: String) {
    Card(
        modifier = Modifier
            .fillMaxWidth(0.485f)
            .height(112.dp),
        shape = RoundedCornerShape(22.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 5.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(14.dp),
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(
                    modifier = Modifier
                        .size(34.dp)
                        .clip(CircleShape)
                        .background(MaterialTheme.colorScheme.primary.copy(alpha = 0.12f)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(icon, null, tint = MaterialTheme.colorScheme.primary, modifier = Modifier.size(18.dp))
                }
                Spacer(Modifier.width(8.dp))
                Text(
                    text = label,
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    fontWeight = FontWeight.Bold,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
            }
            Column {
                Text(
                    text = value,
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Black,
                    color = MaterialTheme.colorScheme.onSurface,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                Text(
                    text = caption,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
            }
        }
    }
}

@Composable
private fun AdminControlCard() {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 5.dp)
    ) {
        Column(Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Outlined.ManageAccounts, null, tint = MaterialTheme.colorScheme.primary)
                Spacer(Modifier.width(10.dp))
                Text(
                    text = "Platform controls",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Black,
                    color = MaterialTheme.colorScheme.onSurface
                )
            }
            Text(
                text = "Review user access, role changes, CMS content, ticket queues, and reporting workflows without leaving the mobile admin panel.",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                ElevatedButton(onClick = {}, shape = RoundedCornerShape(14.dp)) {
                    Text("Users")
                }
                OutlinedButton(
                    onClick = {},
                    shape = RoundedCornerShape(14.dp),
                    colors = ButtonDefaults.outlinedButtonColors(contentColor = MaterialTheme.colorScheme.primary)
                ) {
                    Text("Reports")
                }
            }
        }
    }
}

@Composable
private fun AdminOperationsGrid() {
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        AdminActionCard(
            icon = Icons.Outlined.Groups,
            title = "User operations",
            description = "Manage candidates, employers, employees, admin viewers, verification, plans, and suspensions."
        )
        AdminActionCard(
            icon = Icons.Outlined.SupportAgent,
            title = "Support operations",
            description = "Monitor support queues, live chat handoffs, ticket movement, response timing, and escalations."
        )
        AdminActionCard(
            icon = Icons.Outlined.Analytics,
            title = "Business intelligence",
            description = "Track revenue, active jobs, applications, subscriptions, and platform growth signals."
        )
    }
}

@Composable
private fun AdminActionCard(icon: ImageVector, title: String, description: String) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(22.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(42.dp)
                    .clip(RoundedCornerShape(14.dp))
                    .background(MaterialTheme.colorScheme.primary.copy(alpha = 0.12f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(icon, null, tint = MaterialTheme.colorScheme.primary, modifier = Modifier.size(22.dp))
            }
            Spacer(Modifier.width(12.dp))
            Column(Modifier.weight(1f)) {
                Text(
                    text = title,
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.Black,
                    color = MaterialTheme.colorScheme.onSurface
                )
                Text(
                    text = description,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}
