// Test script to verify request approval functionality

const { getPool } = require('../dist/src/config/database');
const { DepartmentHeadService } = require('../dist/src/services/department-head/departmentHeadService');

async function testRequestApproval() {
  const pool = getPool();
  const departmentHeadService = new DepartmentHeadService();
  
  try {
    console.log('🔍 Testing Request Approval functionality...\n');
    
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
    
    // Test approving the first request
    const testRequest = requests.data[0];
    console.log('\n🧪 Testing approval for request:', testRequest.id, 'Type:', testRequest.type);
    
    try {
      await departmentHeadService.approveRequest(departmentHead.user_id, testRequest.id);
      console.log('✅ Request approval successful!');
      
      // Check if the request status was updated
      const checkQuery = `
        SELECT status FROM ${testRequest.type === 'overtime' ? 'overtime_requests' : 
                          testRequest.type === 'leave' ? 'leaves' : 
                          'time_correction_requests'} 
        WHERE id = $1
      `;
      
      const checkResult = await pool.query(checkQuery, [testRequest.id]);
      console.log('Request status after approval:', checkResult.rows[0]?.status);
      
    } catch (error) {
      console.log('❌ Request approval failed:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Error testing request approval:', error);
  } finally {
    await pool.end();
  }
}

testRequestApproval();
