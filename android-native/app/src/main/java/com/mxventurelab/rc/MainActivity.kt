package com.mxventurelab.rc

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import com.mxventurelab.rc.core.design.LocalRcThemeController
import com.mxventurelab.rc.core.design.RcTheme
import com.mxventurelab.rc.core.design.RcThemeController
import com.mxventurelab.rc.navigation.RcNavHost
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            var isDark by rememberSaveable { mutableStateOf(false) }
            RcTheme(darkTheme = isDark) {
                CompositionLocalProvider(
                    LocalRcThemeController provides RcThemeController(
                        isDark = isDark,
                        toggle = { isDark = !isDark }
                    )
                ) {
                    RcNavHost()
                }
            }
        }
    }
}


