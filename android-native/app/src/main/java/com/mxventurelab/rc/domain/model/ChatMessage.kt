package com.mxventurelab.rc.domain.model

data class ChatMessage(
    val id: String,
    val senderId: String,
    val senderName: String,
    val message: String,
    val createdAt: String,
    val read: Boolean
)
