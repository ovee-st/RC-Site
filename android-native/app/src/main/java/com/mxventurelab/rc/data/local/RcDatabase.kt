package com.mxventurelab.rc.data.local

import androidx.room.Database
import androidx.room.RoomDatabase

@Database(
    entities = [JobEntity::class, CandidateProfileEntity::class],
    version = 1,
    exportSchema = true
)
abstract class RcDatabase : RoomDatabase() {
    abstract fun jobDao(): JobDao
}
