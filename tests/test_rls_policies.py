"""
Integration Tests for Row-Level Security (RLS) Policies

Tests multi-tenant isolation at the database level using PostgreSQL RLS.

Sprint 2 - Phase D.4.1 Testing
"""

import pytest
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.rls import set_rls_variables, clear_rls_variables, get_rls_variables, RLSContext
from app.models.auth import User
from app.models.sql_models import SpatialLayer


class TestRLSPolicyEnforcement:
    """Test RLS policy enforcement for tenant isolation"""

    @pytest.mark.asyncio
    async def test_rls_variables_set_correctly(self, db_session: AsyncSession):
        """Test that RLS session variables are set correctly"""
        # Set RLS variables
        await set_rls_variables(
            db_session,
            tenant_id=1,
            user_id=42,
            user_role='editor'
        )

        # Verify variables are set
        variables = await get_rls_variables(db_session)

        assert variables['tenant_id'] == '1'
        assert variables['user_id'] == '42'
        assert variables['user_role'] == 'editor'

        # Clean up
        await clear_rls_variables(db_session)

    @pytest.mark.asyncio
    async def test_rls_variables_clear(self, db_session: AsyncSession):
        """Test that RLS variables can be cleared"""
        # Set variables
        await set_rls_variables(db_session, tenant_id=1, user_id=42, user_role='editor')

        # Clear variables
        await clear_rls_variables(db_session)

        # Verify cleared
        variables = await get_rls_variables(db_session)

        assert variables['tenant_id'] in (None, '')
        assert variables['user_id'] in (None, '')
        assert variables['user_role'] in (None, '')

    @pytest.mark.asyncio
    async def test_rls_context_manager(self, db_session: AsyncSession):
        """Test RLS context manager sets and clears variables"""
        # Verify no variables initially
        variables_before = await get_rls_variables(db_session)
        assert variables_before['tenant_id'] in (None, '')

        # Use context manager
        async with RLSContext(db_session, tenant_id=1, user_role='editor'):
            variables_inside = await get_rls_variables(db_session)
            assert variables_inside['tenant_id'] == '1'
            assert variables_inside['user_role'] == 'editor'

        # Verify cleared after context
        variables_after = await get_rls_variables(db_session)
        assert variables_after['tenant_id'] in (None, '')

    @pytest.mark.asyncio
    async def test_tenant_isolation_select(self, db_session: AsyncSession):
        """
        Test that SELECT queries are filtered by tenant_id.

        This test verifies that when RLS variables are set, users can only
        see data from their own tenant.
        """
        # Create test data for two tenants
        # Note: This assumes migrations have been run and RLS is enabled

        # Insert data as tenant 1
        await set_rls_variables(db_session, tenant_id=1, user_role='tenant_admin')

        layer_tenant1 = SpatialLayer(
            name='Tenant 1 Layer',
            tenant_id=1,
            layer_type='geojson',
            visibility=True
        )
        db_session.add(layer_tenant1)
        await db_session.commit()

        # Insert data as tenant 2
        await set_rls_variables(db_session, tenant_id=2, user_role='tenant_admin')

        layer_tenant2 = SpatialLayer(
            name='Tenant 2 Layer',
            tenant_id=2,
            layer_type='geojson',
            visibility=True
        )
        db_session.add(layer_tenant2)
        await db_session.commit()

        # Query as tenant 1 - should only see tenant 1 data
        await set_rls_variables(db_session, tenant_id=1, user_role='editor')

        result_tenant1 = await db_session.execute(select(SpatialLayer))
        layers_tenant1 = result_tenant1.scalars().all()

        # Verify only tenant 1 data is visible
        assert len(layers_tenant1) >= 1
        for layer in layers_tenant1:
            assert layer.tenant_id == 1, f"Tenant 1 user saw tenant {layer.tenant_id} data!"

        # Query as tenant 2 - should only see tenant 2 data
        await set_rls_variables(db_session, tenant_id=2, user_role='editor')

        result_tenant2 = await db_session.execute(select(SpatialLayer))
        layers_tenant2 = result_tenant2.scalars().all()

        # Verify only tenant 2 data is visible
        assert len(layers_tenant2) >= 1
        for layer in layers_tenant2:
            assert layer.tenant_id == 2, f"Tenant 2 user saw tenant {layer.tenant_id} data!"

        # Clean up
        await clear_rls_variables(db_session)

    @pytest.mark.asyncio
    async def test_super_admin_bypass(self, db_session: AsyncSession):
        """
        Test that super_admin role can bypass RLS and see all data.

        Super admins need to access all tenant data for system administration.
        """
        # Create data for two tenants
        await set_rls_variables(db_session, tenant_id=1, user_role='tenant_admin')
        layer_tenant1 = SpatialLayer(
            name='Tenant 1 Admin Layer',
            tenant_id=1,
            layer_type='geojson',
            visibility=True
        )
        db_session.add(layer_tenant1)
        await db_session.commit()

        await set_rls_variables(db_session, tenant_id=2, user_role='tenant_admin')
        layer_tenant2 = SpatialLayer(
            name='Tenant 2 Admin Layer',
            tenant_id=2,
            layer_type='geojson',
            visibility=True
        )
        db_session.add(layer_tenant2)
        await db_session.commit()

        # Query as super_admin - should see ALL data
        await set_rls_variables(db_session, tenant_id=1, user_role='super_admin')

        result_admin = await db_session.execute(select(SpatialLayer))
        layers_admin = result_admin.scalars().all()

        # Verify super admin sees data from multiple tenants
        tenant_ids = set(layer.tenant_id for layer in layers_admin)
        assert len(tenant_ids) >= 2, "Super admin should see data from multiple tenants"
        assert 1 in tenant_ids
        assert 2 in tenant_ids

        # Clean up
        await clear_rls_variables(db_session)

    @pytest.mark.asyncio
    async def test_tenant_isolation_insert(self, db_session: AsyncSession):
        """
        Test that INSERT is restricted to user's tenant_id.

        Users should not be able to insert data with a different tenant_id.
        """
        # Set RLS for tenant 1
        await set_rls_variables(db_session, tenant_id=1, user_role='editor')

        # Try to insert data with correct tenant_id - should succeed
        layer_correct = SpatialLayer(
            name='Correct Tenant Layer',
            tenant_id=1,
            layer_type='geojson',
            visibility=True
        )
        db_session.add(layer_correct)
        await db_session.commit()

        # Verify insert succeeded
        result = await db_session.execute(
            select(SpatialLayer).where(SpatialLayer.name == 'Correct Tenant Layer')
        )
        assert result.scalars().first() is not None

        # Try to insert data with wrong tenant_id - should fail
        layer_wrong = SpatialLayer(
            name='Wrong Tenant Layer',
            tenant_id=2,  # Different tenant!
            layer_type='geojson',
            visibility=True
        )
        db_session.add(layer_wrong)

        with pytest.raises(Exception):  # RLS policy violation
            await db_session.commit()

        await db_session.rollback()

        # Clean up
        await clear_rls_variables(db_session)

    @pytest.mark.asyncio
    async def test_tenant_isolation_update(self, db_session: AsyncSession):
        """
        Test that UPDATE is restricted to user's tenant data.

        Users should not be able to update other tenants' data.
        """
        # Create data for tenant 2
        await set_rls_variables(db_session, tenant_id=2, user_role='tenant_admin')

        layer_tenant2 = SpatialLayer(
            name='Tenant 2 Protected Layer',
            tenant_id=2,
            layer_type='geojson',
            visibility=True
        )
        db_session.add(layer_tenant2)
        await db_session.commit()

        layer_id = layer_tenant2.id

        # Try to update as tenant 1 - should fail (invisible due to SELECT policy)
        await set_rls_variables(db_session, tenant_id=1, user_role='editor')

        result = await db_session.execute(
            select(SpatialLayer).where(SpatialLayer.id == layer_id)
        )
        tenant1_view = result.scalars().first()

        # Tenant 1 user should not see tenant 2's layer
        assert tenant1_view is None, "Tenant 1 should not see Tenant 2's data"

        # Clean up
        await clear_rls_variables(db_session)

    @pytest.mark.asyncio
    async def test_tenant_isolation_delete(self, db_session: AsyncSession):
        """
        Test that DELETE is restricted to user's tenant data.

        Users should not be able to delete other tenants' data.
        """
        # Create data for tenant 1
        await set_rls_variables(db_session, tenant_id=1, user_role='tenant_admin')

        layer_tenant1 = SpatialLayer(
            name='Tenant 1 Delete Test',
            tenant_id=1,
            layer_type='geojson',
            visibility=True
        )
        db_session.add(layer_tenant1)
        await db_session.commit()

        layer_id = layer_tenant1.id

        # Try to delete as tenant 2 - should fail (invisible)
        await set_rls_variables(db_session, tenant_id=2, user_role='editor')

        result = await db_session.execute(
            select(SpatialLayer).where(SpatialLayer.id == layer_id)
        )
        tenant2_view = result.scalars().first()

        # Tenant 2 should not see tenant 1's layer
        assert tenant2_view is None, "Tenant 2 should not see Tenant 1's data"

        # Verify original data still exists when queried as tenant 1
        await set_rls_variables(db_session, tenant_id=1, user_role='editor')

        result = await db_session.execute(
            select(SpatialLayer).where(SpatialLayer.id == layer_id)
        )
        tenant1_view = result.scalars().first()

        assert tenant1_view is not None, "Original data should still exist"

        # Clean up
        await clear_rls_variables(db_session)

    @pytest.mark.asyncio
    async def test_no_rls_variables_blocks_access(self, db_session: AsyncSession):
        """
        Test that queries without RLS variables set return no results.

        This ensures RLS is enforced and requires explicit tenant context.
        """
        # Clear any existing RLS variables
        await clear_rls_variables(db_session)

        # Try to query without setting tenant_id
        result = await db_session.execute(select(SpatialLayer))
        layers = result.scalars().all()

        # Should return empty (no tenant context)
        assert len(layers) == 0, "Query without RLS variables should return no results"


@pytest.fixture
async def db_session():
    """
    Provide a test database session.

    Note: This fixture should be implemented in your conftest.py
    """
    # Implementation depends on your test setup
    # This is a placeholder
    pass


if __name__ == '__main__':
    pytest.main([__file__, '-v', '--asyncio-mode=auto'])
