package com.mxventurelab.rc.feature.auth

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavController
import com.mxventurelab.rc.core.design.RcCard
import com.mxventurelab.rc.core.design.RcPrimaryButton
import com.mxventurelab.rc.domain.model.Role
import com.mxventurelab.rc.navigation.RcRoutes

@Composable
fun LoginScreen(navController: NavController, viewModel: LoginViewModel = hiltViewModel()) {
    val state by viewModel.state.collectAsState()
    LaunchedEffect(state.role) {
        val route = when (state.role) {
            Role.Candidate -> RcRoutes.Candidate
            Role.Employer -> RcRoutes.Employer
            Role.SupportUser -> RcRoutes.Support
            Role.Admin -> RcRoutes.Admin
            Role.Recruiter -> RcRoutes.Recruiter
            else -> null
        }
        if (route != null) navController.navigate(route) { popUpTo(RcRoutes.Home) }
    }
    Column(Modifier.fillMaxSize().padding(20.dp), verticalArrangement = Arrangement.Center) {
        RcCard {
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Text("Welcome back", style = MaterialTheme.typography.headlineMedium)
                OutlinedTextField(state.email, viewModel::email, Modifier.fillMaxWidth(), placeholder = { Text("Email / Username") })
                OutlinedTextField(state.password, viewModel::password, Modifier.fillMaxWidth(), placeholder = { Text("Password") }, visualTransformation = PasswordVisualTransformation())
                state.error?.let { Text(it, color = MaterialTheme.colorScheme.error) }
                RcPrimaryButton(if (state.loading) "Logging in..." else "Login", Modifier.fillMaxWidth(), viewModel::login)
                RcPrimaryButton("Register", Modifier.fillMaxWidth(), onClick = { navController.navigate(RcRoutes.Register) })
                Text("Forgot Password", color = MaterialTheme.colorScheme.primary)
            }
        }
    }
}
