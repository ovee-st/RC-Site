package com.mxventurelab.rc.navigation

import androidx.compose.runtime.Composable
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.mxventurelab.rc.feature.admin.AdminDashboardScreen
import com.mxventurelab.rc.feature.auth.LoginScreen
import com.mxventurelab.rc.feature.auth.RegisterScreen
import com.mxventurelab.rc.feature.candidate.CandidateDashboardScreen
import com.mxventurelab.rc.feature.employer.EmployerDashboardScreen
import com.mxventurelab.rc.feature.home.HomeShell
import com.mxventurelab.rc.feature.messaging.MessagingScreen
import com.mxventurelab.rc.feature.notifications.NotificationCenterScreen
import com.mxventurelab.rc.feature.recruiter.RecruiterDashboardScreen
import com.mxventurelab.rc.feature.splash.SplashScreen
import com.mxventurelab.rc.feature.support.SupportDashboardScreen

@Composable
fun RcNavHost() {
    val navController = rememberNavController()
    NavHost(navController = navController, startDestination = RcRoutes.Splash) {
        composable(RcRoutes.Splash) { SplashScreen(navController) }
        composable(RcRoutes.Home) { HomeShell(navController) }
        composable(RcRoutes.Login) { LoginScreen(navController) }
        composable(RcRoutes.Register) { RegisterScreen(navController) }
        composable(RcRoutes.Candidate) { CandidateDashboardScreen(navController) }
        composable(RcRoutes.Employer) { EmployerDashboardScreen(navController) }
        composable(RcRoutes.Support) { SupportDashboardScreen(navController) }
        composable(RcRoutes.Admin) { AdminDashboardScreen(navController) }
        composable(RcRoutes.Recruiter) { RecruiterDashboardScreen(navController) }
        composable(RcRoutes.Notifications) { NotificationCenterScreen(navController) }
        composable(RcRoutes.Messaging) { MessagingScreen(navController) }
    }
}
