// Test script to verify all request approval types

const { getPool } = require('../dist/src/config/database');
const { DepartmentHeadService } = require('../dist/src/services/department-head/departmentHeadService');

async function testAllRequestApprovals() {
  const pool = getPool();
  const departmentHeadService = new DepartmentHeadService();
  
  try {
    console.log('🔍 Testing All Request Approval Types...\n');
    
    // Find the Engineering department head
    const departmentHeadQuery = `
      SELECT 
        u.id as user_id,
        u.first_name,
        u.last_name,
        u.email,
        d.id as department_id,
        d.name as department_name
      FROM users u
      JOIN departments d ON u.id = d.department_head_user_id
      WHERE u.role = 'department_head' AND d.name = 'Engineering'
      LIMIT 1
    `;
    
    const departmentHeadResult = await pool.query(departmentHeadQuery);
    
    if (departmentHeadResult.rows.length === 0) {
      console.log('❌ No Engineering department head found!');
      return;
    }
    
    const departmentHead = departmentHeadResult.rows[0];
    console.log('👤 Engineering Department Head:', departmentHead);
    
    // Get pending requests
    console.log('\n📋 Getting pending requests...');
    const requests = await departmentHeadService.getRequests(departmentHead.user_id, {
      page: 1,
      limit: 10,
      status: 'pending'
    });
    
    console.log('Pending requests found:', requests.data.length);
    
    if (requests.data.length === 0) {
      console.log('❌ No pending requests to test approval with!');
      return;
    }
    
    // Test approving each request type
    for (const request of requests.data) {
      console.log(`\n🧪 Testing approval for ${request.type} request:`, request.id);
      
      try {
        await departmentHeadService.approveRequest(departmentHead.user_id, request.id);
        console.log(`✅ ${request.type} request approval successful!`);
        
        // Check if the request status was updated
        const tableName = request.type === 'overtime' ? 'overtime_requests' : 
                         request.type === 'leave' ? 'leaves' : 
                         'time_correction_requests';
        
        const checkQuery = `SELECT status FROM ${tableName} WHERE id = $1`;
        const checkResult = await pool.query(checkQuery, [request.id]);
        console.log(`Request status after approval:`, checkResult.rows[0]?.status);
        
      } catch (error) {
        console.log(`❌ ${request.type} request approval failed:`, error.message);
      }
    }
    
    // Get final stats
    console.log('\n📊 Final request statistics...');
    const finalStats = await departmentHeadService.getRequestStats(departmentHead.user_id);
    console.log('Final stats:', finalStats);
    
  } catch (error) {
    console.error('❌ Error testing request approvals:', error);
  } finally {
    await pool.end();
  }
}

testAllRequestApprovals();
