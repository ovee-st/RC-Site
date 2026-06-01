package com.mxventurelab.rc.core.design

import androidx.compose.material3.Typography
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp

val RcTypography = Typography(
    headlineLarge = Typography().headlineLarge.copy(fontSize = 30.sp, fontWeight = FontWeight.Black),
    headlineMedium = Typography().headlineMedium.copy(fontSize = 24.sp, fontWeight = FontWeight.Bold),
    titleLarge = Typography().titleLarge.copy(fontSize = 20.sp, fontWeight = FontWeight.Bold),
    titleMedium = Typography().titleMedium.copy(fontWeight = FontWeight.SemiBold),
    bodyMedium = Typography().bodyMedium.copy(fontSize = 14.sp)
)
