package com.mxventurelab.rc.feature.auth

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.navigation.NavController
import com.mxventurelab.rc.core.design.RcCard
import com.mxventurelab.rc.core.design.RcPrimaryButton
import com.mxventurelab.rc.navigation.RcRoutes

@Composable
fun RegisterScreen(navController: NavController) {
    var role by remember { mutableStateOf("Candidate") }
    Column(Modifier.fillMaxSize().padding(20.dp), verticalArrangement = Arrangement.Center) {
        RcCard {
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Text("Create account")
                OutlinedTextField("", {}, Modifier.fillMaxWidth(), placeholder = { Text("Full name") })
                OutlinedTextField("", {}, Modifier.fillMaxWidth(), placeholder = { Text("Email") })
                OutlinedTextField("", {}, Modifier.fillMaxWidth(), placeholder = { Text("Password") })
                RcPrimaryButton("Register as $role", Modifier.fillMaxWidth(), onClick = { navController.navigate(RcRoutes.Login) })
                RcPrimaryButton(if (role == "Candidate") "Switch to Employer" else "Switch to Candidate", Modifier.fillMaxWidth(), onClick = { role = if (role == "Candidate") "Employer" else "Candidate" })
            }
        }
    }
}
