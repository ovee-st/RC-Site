package com.mxventurelab.rc.feature.messaging

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
fun MessagingScreen(navController: NavController) {
    Column(Modifier.fillMaxSize().padding(18.dp)) {
        RcCard { Text("Real-time messaging with read receipts and attachments.") }
    }
}
