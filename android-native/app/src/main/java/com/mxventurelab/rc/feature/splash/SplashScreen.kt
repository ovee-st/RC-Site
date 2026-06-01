package com.mxventurelab.rc.feature.splash

import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Image
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.size
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.scale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavController
import com.mxventurelab.rc.R
import com.mxventurelab.rc.navigation.RcRoutes
import kotlinx.coroutines.delay

@Composable
fun SplashScreen(navController: NavController, viewModel: SplashViewModel = hiltViewModel()) {
    val destination by viewModel.destination.collectAsState()
    val pulse = rememberInfiniteTransition(label = "pulse")
    val scale by pulse.animateFloat(0.94f, 1.06f, infiniteRepeatable(tween(900)), label = "scale")
    val logo = if (isSystemInDarkTheme()) R.drawable.mxvl_logo_dark else R.drawable.mxvl_logo

    LaunchedEffect(destination) {
        if (destination == "loading") return@LaunchedEffect
        delay(2200)
        navController.navigate(destination.toRoute()) {
            popUpTo(RcRoutes.Splash) { inclusive = true }
            launchSingleTop = true
        }
    }

    Column(
        modifier = Modifier.fillMaxSize(),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Image(
            painter = painterResource(logo),
            contentDescription = "MXVL logo",
            modifier = Modifier.size(128.dp).scale(scale)
        )
        Text("MXVL", color = MaterialTheme.colorScheme.primary, fontSize = 42.sp, fontWeight = FontWeight.Black)
        Text("MX Venture Lab", style = MaterialTheme.typography.titleLarge)
        Text("AI Hiring Platform", color = MaterialTheme.colorScheme.secondary)
    }
}

private fun String.toRoute(): String = when (this) {
    "candidate" -> RcRoutes.Candidate
    "employer" -> RcRoutes.Employer
    "support" -> RcRoutes.Support
    "admin" -> RcRoutes.Admin
    "recruiter" -> RcRoutes.Recruiter
    else -> RcRoutes.Home
}




