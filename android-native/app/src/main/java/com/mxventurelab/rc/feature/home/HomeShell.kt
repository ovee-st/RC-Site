package com.mxventurelab.rc.feature.home

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Home
import androidx.compose.material.icons.outlined.Work
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.navigation.NavController
import com.mxventurelab.rc.feature.jobs.JobsScreen

@Composable
fun HomeShell(navController: NavController) {
    var selected by remember { mutableIntStateOf(0) }
    Scaffold(bottomBar = {
        NavigationBar {
            NavigationBarItem(selected = selected == 0, onClick = { selected = 0 }, icon = { Icon(Icons.Outlined.Home, null) }, label = { Text("Home") })
            NavigationBarItem(selected = selected == 1, onClick = { selected = 1 }, icon = { Icon(Icons.Outlined.Work, null) }, label = { Text("Jobs") })
        }
    }) { padding ->
        Column(Modifier.padding(padding)) {
            if (selected == 0) PublicHomeScreen(navController) else JobsScreen(navController)
        }
    }
}
