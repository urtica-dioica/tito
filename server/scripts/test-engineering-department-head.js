// Test with the Engineering department head

const { getPool } = require('../dist/src/config/database');
const { DepartmentHeadService } = require('../dist/src/services/department-head/departmentHeadService');

async function testEngineeringDepartmentHead() {
  const pool = getPool();
  const departmentHeadService = new DepartmentHeadService();
  
  try {
    console.log('🔍 Testing with Engineering Department Head...\n');
    
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
    
    // Test getRequests method
    console.log('\n📋 Testing getRequests method...');
    try {
      const requests = await departmentHeadService.getRequests(departmentHead.user_id, {
        page: 1,
        limit: 10
      });
      
      console.log('✅ getRequests successful!');
      console.log('Requests found:', requests.data.length);
      console.log('Total:', requests.pagination.total);
      
      if (requests.data.length > 0) {
        console.log('Sample request:', requests.data[0]);
      }
    } catch (error) {
      console.log('❌ getRequests failed:', error.message);
    }
    
    // Test getRequestStats method
    console.log('\n📊 Testing getRequestStats method...');
    try {
      const stats = await departmentHeadService.getRequestStats(departmentHead.user_id);
      
      console.log('✅ getRequestStats successful!');
      console.log('Stats:', stats);
    } catch (error) {
      console.log('❌ getRequestStats failed:', error.message);
    }
    
    // Test with filters
    console.log('\n🔍 Testing with filters...');
    try {
      const pendingRequests = await departmentHeadService.getRequests(departmentHead.user_id, {
        page: 1,
        limit: 10,
        status: 'pending'
      });
      
      console.log('✅ Filtered requests (pending):', pendingRequests.data.length);
      
      const overtimeRequests = await departmentHeadService.getRequests(departmentHead.user_id, {
        page: 1,
        limit: 10,
        type: 'overtime'
      });
      
      console.log('✅ Filtered requests (overtime):', overtimeRequests.data.length);
    } catch (error) {
      console.log('❌ Filtered requests failed:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Error testing Engineering department head:', error);
  } finally {
    await pool.end();
  }
}

testEngineeringDepartmentHead();
