package com.mxventurelab.rc.core.di

import android.content.Context
import androidx.room.Room
import com.mxventurelab.rc.data.local.JobDao
import com.mxventurelab.rc.data.local.RcDatabase
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object DatabaseModule {
    @Provides
    @Singleton
    fun database(@ApplicationContext context: Context): RcDatabase =
        Room.databaseBuilder(context, RcDatabase::class.java, "rc.db")
            .fallbackToDestructiveMigration()
            .build()

    @Provides
    fun jobDao(database: RcDatabase): JobDao = database.jobDao()
}
