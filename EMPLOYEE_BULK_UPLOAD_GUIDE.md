# Employee Bulk Upload Guide

This guide explains how to use the CSV bulk upload feature to add multiple employees to the TITO HR system at once.

## 📁 CSV Template Files

Two template files are provided:

1. **`employee_bulk_template.csv`** - Simple template with example data
2. **`employee_bulk_template_detailed.csv`** - Detailed template with instructions and comments

## 📋 Required CSV Columns

Your CSV file must include the following columns (case-insensitive):

| Column | Description | Example | Validation |
|--------|-------------|---------|------------|
| **Email** | Employee email address | `john.doe@company.com` | Must be valid email format |
| **First Name** | Employee first name | `John` | Required, non-empty |
| **Last Name** | Employee last name | `Doe` | Required, non-empty |
| **Department ID** | Department identifier | `dept-123` | Must exist in system |
| **Position** | Job position/title | `Software Engineer` | Required, non-empty |
| **Employment Type** | Employment classification | `regular` | Must be: `regular`, `contractual`, or `jo` |
| **Hire Date** | Employment start date | `2024-01-15` | Format: YYYY-MM-DD |
| **Base Salary** | Monthly salary amount | `50000` | Must be positive number |

## 🔧 How to Use

### Step 1: Download Template
1. Go to HR → Employee Management
2. Click "Bulk Add" button
3. In the modal, click "Download Template" button
4. Save the CSV file to your computer

### Step 2: Prepare Your Data
1. Open the downloaded template in Excel, Google Sheets, or any CSV editor
2. Replace the example data with your actual employee information
3. Ensure all required columns are filled
4. Verify data formats (especially dates and numbers)
5. Save as CSV format

### Step 3: Upload and Process
1. In the Bulk Add modal, click "Choose File" or drag your CSV file
2. Review the file information displayed
3. Click "Upload and Create Employees"
4. Wait for processing to complete
5. Review the results summary

## ✅ Data Validation Rules

### Email
- Must be valid email format
- Must be unique (no duplicates)
- Will be used for login and notifications

### Names
- First Name and Last Name are required
- Cannot be empty or just spaces

### Department ID
- Must match an existing department in the system
- Check your department list for valid IDs

### Employment Type
- **`regular`** - Full-time regular employee
- **`contractual`** - Contract-based employee
- **`jo`** - Job Order employee

### Hire Date
- Format: YYYY-MM-DD (e.g., 2024-01-15)
- Must be a valid date
- Cannot be in the future

### Base Salary
- Must be a positive number
- Represents monthly salary
- No currency symbols or commas

## 🚨 Common Errors and Solutions

### "Missing required CSV headers"
- **Problem**: CSV file doesn't have all required columns
- **Solution**: Use the template file and ensure all columns are present

### "Invalid email format"
- **Problem**: Email address is not properly formatted
- **Solution**: Check email addresses for typos and proper format

### "Department not found"
- **Problem**: Department ID doesn't exist in the system
- **Solution**: Verify department IDs in your system or create departments first

### "Invalid employment type"
- **Problem**: Employment type is not one of the allowed values
- **Solution**: Use only: `regular`, `contractual`, or `jo`

### "Invalid hire date format"
- **Problem**: Date is not in YYYY-MM-DD format
- **Solution**: Ensure dates are formatted as YYYY-MM-DD

### "Base salary must be greater than 0"
- **Problem**: Salary is zero, negative, or not a number
- **Solution**: Enter positive numbers only

## 📊 Processing Results

After upload, you'll see a summary showing:
- **Total Processed**: Number of rows in your CSV
- **Successful**: Number of employees created successfully
- **Failed**: Number of employees that failed to create
- **Error Details**: Specific errors for failed rows

## 🔄 What Happens After Upload

For each successful employee creation:
1. **User Account**: A user account is created with temporary password
2. **Employee Record**: Employee information is stored in the database
3. **Email Invitation**: Password setup email is sent to the employee
4. **ID Card**: Employee becomes eligible for ID card generation

## 💡 Tips for Success

1. **Start Small**: Test with a few employees first
2. **Check Department IDs**: Verify all department IDs exist before uploading
3. **Validate Data**: Double-check email addresses and dates
4. **Use Template**: Always start with the provided template
5. **Review Results**: Check the error summary to fix any issues
6. **Be Patient**: Large CSV files may take several minutes to process
7. **Batch Processing**: For very large files (100+ employees), consider splitting into smaller batches

## 🆘 Need Help?

If you encounter issues:
1. Check the error messages in the results summary
2. Verify your CSV format matches the template
3. Ensure all department IDs exist in your system
4. Contact your system administrator for assistance

## 📝 Example CSV Content

```csv
Email,First Name,Last Name,Department ID,Position,Employment Type,Hire Date,Base Salary
john.doe@company.com,John,Doe,dept-123,Software Engineer,regular,2024-01-15,50000
jane.smith@company.com,Jane,Smith,dept-456,HR Manager,regular,2024-02-01,60000
mike.johnson@company.com,Mike,Johnson,dept-789,Marketing Specialist,contractual,2024-02-15,45000
```

---

**Note**: This feature requires HR Admin privileges. Each employee will receive an email invitation to set up their password and access the system.
