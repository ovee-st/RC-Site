package com.mxventurelab.rc

import com.mxventurelab.rc.domain.model.Role
import org.junit.Assert.assertEquals
import org.junit.Test

class RoleTest {
    @Test
    fun mapsSupportRoles() {
        assertEquals(Role.SupportUser, Role.fromApi("support_manager"))
        assertEquals(Role.Admin, Role.fromApi("super_admin"))
        assertEquals(Role.Candidate, Role.fromApi("candidate"))
    }
}
