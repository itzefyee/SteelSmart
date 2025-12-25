# SteelSmart Test Documentation

## Overview
This document provides comprehensive test documentation for the SteelSmart application, covering Login/Register, User Product, Admin Product, and Admin Report modules.

---

## 1. LOGIN/REGISTER MODULE

### UC201: User Registration

#### TC_LR_UC201_001: Register User Successfully
- **Description**: Test successful user registration with valid credentials
- **Preconditions**: 
  - User is not already registered
  - Valid email and password provided
- **Test Steps**:
  1. Navigate to registration page
  2. Enter valid email: `test@example.com`
  3. Enter valid password: `SecurePass123!`
  4. Enter company name: `Test Company`
  5. Click register button
- **Test Data**:
  - Email: `test@example.com`
  - Password: `SecurePass123!`
  - Company: `Test Company`
- **Expected Result**: 
  - User account created successfully
  - User object returned with email `test@example.com`
  - Company data stored in user metadata
- **Actual Result**: ✅ Pass
- **Post Conditions**: User account exists in database

#### TC_LR_UC201_002: Reject Registration with Invalid Input
- **Description**: Test validation of user input during registration
- **Preconditions**: Registration form is accessible
- **Test Steps**:
  1. Attempt registration with invalid email format
  2. Attempt registration with weak password
- **Test Data**:
  - Invalid email: `invalid-email`
  - Weak password: `123`
- **Expected Result**: ValidationError thrown for both cases
- **Actual Result**: ✅ Pass
- **Post Conditions**: No user account created

### UC202: User Login

#### TC_LR_UC202_001: Login User Successfully
- **Description**: Test successful user authentication with valid credentials
- **Preconditions**: User account exists and is confirmed
- **Test Steps**:
  1. Navigate to login page
  2. Enter valid email: `test@example.com`
  3. Enter valid password: `SecurePass123!`
  4. Click login button
- **Test Data**:
  - Email: `test@example.com`
  - Password: `SecurePass123!`
- **Expected Result**: 
  - User authenticated successfully
  - Session created with access token
  - User object returned
- **Actual Result**: ✅ Pass
- **Post Conditions**: User is logged in with active session

#### TC_LR_UC202_002: Handle Invalid Credentials Error
- **Description**: Test handling of incorrect login credentials
- **Preconditions**: User account exists
- **Test Steps**:
  1. Enter valid email
  2. Enter incorrect password
  3. Attempt login
- **Test Data**:
  - Email: `test@example.com`
  - Password: `WrongPassword123!`
- **Expected Result**: Error "Invalid login credentials" thrown
- **Actual Result**: ✅ Pass
- **Post Conditions**: User remains unauthenticated

### UC203: User Logout

#### TC_LR_UC203_001: Logout User Successfully
- **Description**: Test successful user logout and session cleanup
- **Preconditions**: User is logged in with active session
- **Test Steps**:
  1. User clicks logout button
  2. System processes logout request
- **Test Data**: N/A
- **Expected Result**: 
  - Logout successful
  - Session terminated
  - Success flag returned
- **Actual Result**: ✅ Pass
- **Post Conditions**: User session is terminated

### UC204: Edit User Profile

#### TC_LR_UC204_001: Update User Profile Successfully
- **Description**: Test successful profile update with valid data
- **Preconditions**: User is authenticated and has existing profile
- **Test Steps**:
  1. Navigate to profile edit page
  2. Update company name to "Updated Company"
  3. Submit changes
- **Test Data**:
  - Company: `Updated Company`
- **Expected Result**: 
  - Profile updated successfully
  - Updated data returned
- **Actual Result**: ✅ Pass
- **Post Conditions**: Profile data updated in database

#### TC_LR_UC204_002: Reject Edit with Invalid Input
- **Description**: Test validation of profile update input
- **Preconditions**: User is authenticated
- **Test Steps**:
  1. Attempt to update with invalid phone number
  2. Attempt to update with empty company name
- **Test Data**:
  - Invalid phone: `invalid-phone`
  - Empty company: ``
- **Expected Result**: ValidationError thrown for both cases
- **Actual Result**: ✅ Pass
- **Post Conditions**: Profile remains unchanged

---

## 2. USER PRODUCT MODULE

### UC101: View Product Details

#### TC_UP_UC101_001: Retrieve Product Details Successfully
- **Description**: Test successful retrieval of product details for valid product ID
- **Preconditions**: Product exists in database
- **Test Steps**:
  1. Request product details with valid ID
  2. System retrieves product information
- **Test Data**:
  - Product ID: `052df8db-b0a1-4c2e-8fc5-28297362801d`
- **Expected Result**: 
  - Complete product object returned
  - All product fields populated correctly
- **Actual Result**: ✅ Pass
- **Post Conditions**: Product data displayed to user

### UC102: Search Products

#### TC_UP_UC102_001: Search Products by Name Successfully
- **Description**: Test successful product search by name
- **Preconditions**: Products exist in database
- **Test Steps**:
  1. Enter search term "pressure"
  2. Execute search
- **Test Data**:
  - Search term: `pressure`
  - Page: 1, Limit: 20
- **Expected Result**: 
  - Products containing "pressure" returned
  - Pagination information included
- **Actual Result**: ✅ Pass
- **Post Conditions**: Search results displayed

#### TC_UP_UC102_002: Return Empty Array for No Matches
- **Description**: Test search behavior when no products match criteria
- **Preconditions**: Database contains products
- **Test Steps**:
  1. Search for non-existent product
- **Test Data**:
  - Search term: `nonexistent-product`
- **Expected Result**: 
  - Empty products array returned
  - Total count is 0
- **Actual Result**: ✅ Pass
- **Post Conditions**: "No results found" message displayed

### UC103: Filter Products

#### TC_UP_UC103_001: Filter Products by Multiple Criteria
- **Description**: Test filtering products by category, price, and stock status
- **Preconditions**: Products exist with various attributes
- **Test Steps**:
  1. Apply category filter: "robotic"
  2. Apply minimum price filter: 50
  3. Apply stock filter: true
- **Test Data**:
  - Category: `robotic`
  - Min Price: `50`
  - In Stock: `true`
- **Expected Result**: 
  - Only products matching all criteria returned
  - Correct pagination information
- **Actual Result**: ✅ Pass
- **Post Conditions**: Filtered results displayed

#### TC_UP_UC103_002: Return Empty Array for No Filter Matches
- **Description**: Test filter behavior when no products match criteria
- **Preconditions**: Database contains products
- **Test Steps**:
  1. Apply filter for non-existent category
- **Test Data**:
  - Category: `nonexistent-category`
- **Expected Result**: 
  - Empty products array returned
  - Total count is 0
- **Actual Result**: ✅ Pass
- **Post Conditions**: "No products match filters" message displayed

---

## 3. ADMIN PRODUCT MODULE

### UC301: View Product Details (Admin)

#### TC_AP_UC301_001: Retrieve Product Details Successfully
- **Description**: Test admin retrieval of detailed product information
- **Preconditions**: 
  - Admin is authenticated
  - Product exists in database
- **Test Steps**:
  1. Admin requests product details
  2. System retrieves complete product information
- **Test Data**:
  - Product ID: `052df8db-b0a1-4c2e-8fc5-28297362801d`
- **Expected Result**: 
  - Complete product object with all admin fields
  - All images and technical details included
- **Actual Result**: ✅ Pass
- **Post Conditions**: Admin can view all product information

### UC302: Create Product (Admin)

#### TC_AP_UC302_001: Create Product Successfully
- **Description**: Test successful creation of new product by admin
- **Preconditions**: Admin is authenticated with create permissions
- **Test Steps**:
  1. Fill product creation form with valid data
  2. Submit form
- **Test Data**:
  - Name: `Industrial Pressure Sensor 0-200 Bar`
  - Category: `robotic`
  - Price: `129.95`
  - Material: `Stainless Steel`
- **Expected Result**: 
  - Product created successfully
  - Unique ID generated
  - Timestamps added
- **Actual Result**: ✅ Pass
- **Post Conditions**: New product exists in database

#### TC_AP_UC302_002: Reject Creation with Invalid Input
- **Description**: Test validation during product creation
- **Preconditions**: Admin is authenticated
- **Test Steps**:
  1. Attempt creation with empty name
  2. Attempt creation with negative price
  3. Attempt creation with empty category
- **Test Data**:
  - Invalid inputs: empty name, negative price, empty category
- **Expected Result**: ValidationError thrown for each invalid input
- **Actual Result**: ✅ Pass
- **Post Conditions**: No invalid products created

### UC303: Edit Product (Admin)

#### TC_AP_UC303_001: Update Product Successfully
- **Description**: Test successful product update by admin
- **Preconditions**: 
  - Admin is authenticated
  - Product exists
- **Test Steps**:
  1. Modify product name, price, and description
  2. Submit updates
- **Test Data**:
  - Name: `Updated Industrial Pressure Sensor 0-150 Bar`
  - Price: `99.95`
  - Description: `Updated high-accuracy pressure sensor`
- **Expected Result**: 
  - Product updated successfully
  - Updated timestamp modified
- **Actual Result**: ✅ Pass
- **Post Conditions**: Product data updated in database

#### TC_AP_UC303_002: Reject Update with Invalid Price
- **Description**: Test validation during product update
- **Preconditions**: Admin is authenticated, product exists
- **Test Steps**:
  1. Attempt update with negative price
  2. Attempt update with undefined price
- **Test Data**:
  - Invalid prices: `-10`, `undefined`
- **Expected Result**: ValidationError thrown for invalid prices
- **Actual Result**: ✅ Pass
- **Post Conditions**: Product remains unchanged

### UC304: Delete Product (Admin)

#### TC_AP_UC304_001: Delete Product Successfully
- **Description**: Test successful product deletion by admin
- **Preconditions**: 
  - Admin is authenticated
  - Product exists
- **Test Steps**:
  1. Select product for deletion
  2. Confirm deletion
- **Test Data**:
  - Product ID: `052df8db-b0a1-4c2e-8fc5-28297362801d`
- **Expected Result**: 
  - Product deleted successfully
  - No error thrown
- **Actual Result**: ✅ Pass
- **Post Conditions**: Product removed from database

---

## 4. ADMIN REPORT MODULE

### UC401: View Report Details (Admin)

#### TC_AR_UC401_001: Retrieve Report Details Successfully
- **Description**: Test admin retrieval of report details
- **Preconditions**: 
  - Admin is authenticated
  - Report exists
- **Test Steps**:
  1. Request report details by ID
- **Test Data**:
  - Report ID: `report-001`
- **Expected Result**: 
  - Complete report object returned
  - All metadata included
- **Actual Result**: ✅ Pass
- **Post Conditions**: Report details displayed to admin

#### TC_AR_UC401_002: Throw NotFoundError for Non-existent Report
- **Description**: Test error handling for invalid report ID
- **Preconditions**: Admin is authenticated
- **Test Steps**:
  1. Request non-existent report
- **Test Data**:
  - Report ID: `non-existent-id`
- **Expected Result**: NotFoundError thrown
- **Actual Result**: ✅ Pass
- **Post Conditions**: Error message displayed

### UC402: Download Report (Admin)

#### TC_AR_UC402_001: Download Report Successfully
- **Description**: Test successful report download
- **Preconditions**: 
  - Admin is authenticated
  - Report is completed with file URL
- **Test Steps**:
  1. Request report download
  2. System provides file URL
- **Test Data**:
  - Report with file URL: `https://storage.supabase.co/admin-reports/audit/report-001.pdf`
- **Expected Result**: Valid file URL returned
- **Actual Result**: ✅ Pass
- **Post Conditions**: Admin can download report file

#### TC_AR_UC402_002: Return Null for Report Without File
- **Description**: Test handling of reports without generated files
- **Preconditions**: Report exists but has no file URL
- **Test Steps**:
  1. Request download for report without file
- **Test Data**:
  - Report without file URL
- **Expected Result**: Null returned
- **Actual Result**: ✅ Pass
- **Post Conditions**: Admin notified that file is not available

### UC403: Delete Report (Admin)

#### TC_AR_UC403_001: Delete Report Successfully
- **Description**: Test successful report deletion including file cleanup
- **Preconditions**: 
  - Admin is authenticated
  - Report exists with associated file
- **Test Steps**:
  1. Select report for deletion
  2. Confirm deletion
  3. System removes file and database record
- **Test Data**:
  - Report ID: `report-001`
- **Expected Result**: 
  - Report deleted from database
  - Associated file removed from storage
- **Actual Result**: ✅ Pass
- **Post Conditions**: Report and file completely removed

### UC404: Generate Report (Admin)

#### TC_AR_UC404_001: Generate Report Successfully
- **Description**: Test successful report generation initiation
- **Preconditions**: Admin is authenticated with report generation permissions
- **Test Steps**:
  1. Fill report generation form
  2. Submit request
  3. System creates report record and starts generation
- **Test Data**:
  - Title: `Monthly Product Analysis`
  - Type: `AUDIT_LOG`
  - Parameters: `{month: 1, year: 2024}`
- **Expected Result**: 
  - Report record created with PENDING status
  - Generation process initiated
  - Report ID returned
- **Actual Result**: ✅ Pass
- **Post Conditions**: Report generation in progress

#### TC_AR_UC404_002: Reject Invalid Input
- **Description**: Test validation during report generation
- **Preconditions**: Admin is authenticated
- **Test Steps**:
  1. Attempt generation with empty title
  2. Attempt generation with missing report type
- **Test Data**:
  - Invalid inputs: empty title, missing type
- **Expected Result**: ValidationError thrown for invalid inputs
- **Actual Result**: ✅ Pass
- **Post Conditions**: No invalid reports created

---

## Test Summary

### Overall Test Results
- **Total Test Cases**: 20
- **Passed**: 20 ✅
- **Failed**: 0 ❌
- **Pass Rate**: 100%

### Module Coverage
- **Login/Register**: 7 test cases - All passed
- **User Product**: 5 test cases - All passed  
- **Admin Product**: 5 test cases - All passed
- **Admin Report**: 7 test cases - All passed

### Key Testing Areas Covered
- ✅ User Authentication & Authorization
- ✅ Input Validation & Error Handling
- ✅ CRUD Operations (Create, Read, Update, Delete)
- ✅ Search & Filtering Functionality
- ✅ File Management & Downloads
- ✅ Admin Permissions & Security
- ✅ Database Operations & Data Integrity

### Test Environment
- **Framework**: Vitest with jsdom
- **Mocking**: Vi mocks for external dependencies
- **Database**: Supabase with mocked responses
- **Authentication**: Mocked auth services
- **File Storage**: Mocked Supabase storage

---

*Last Updated: December 23, 2025*
*Test Documentation Version: 1.0*

---

## TEST DATA SPECIFICATIONS

### UC101: View Product Details - Test Data

#### Valid Product Data
```json
{
  "id": "052df8db-b0a1-4c2e-8fc5-28297362801d",
  "sku": "pressure-sensor-001",
  "name": "Industrial Pressure Sensor 0-100 Bar",
  "category": "robotic",
  "material": "Stainless Steel",
  "material_family": "steel",
  "component_type_id": "00000000-0000-4000-8000-00000000010c",
  "price": 89.95,
  "description": "High-accuracy pressure sensor for industrial automation and control systems.",
  "technical_details": "4-20mA output, M12 connector, IP67 rated, CE certified",
  "specifications": {
    "weight": "0.12 kg",
    "tolerance": "±0.25% FS",
    "dimensions": "50mm x 25mm x 15mm",
    "loadCapacity": "100 bar maximum",
    "operatingTemp": "-40°C to +125°C"
  },
  "images": [
    "https://emgzohbqnkfxgzfvphzc.supabase.co/storage/v1/object/public/product-images/products/pressure-sensor-001/preview.png",
    "https://emgzohbqnkfxgzfvphzc.supabase.co/storage/v1/object/public/product-images/products/pressure-sensor-001/iso-front-top-left.png",
    "https://emgzohbqnkfxgzfvphzc.supabase.co/storage/v1/object/public/product-images/products/pressure-sensor-001/iso-front-bottom-right.png"
  ],
  "compatible_with": ["linear-actuator-001", "control-module-001"],
  "in_stock": true,
  "lead_time": "3-5 business days",
  "created_at": "2025-11-17T03:10:39.121284Z",
  "updated_at": "2025-12-23T10:19:54.486863Z"
}
```

#### Invalid Product IDs
- `non-existent-id`
- `invalid-uuid-format`
- `null`
- `undefined`
- Empty string `""`

### UC102: Search Products - Test Data

#### Valid Search Terms
- `"pressure"` - Returns pressure sensor products
- `"steel"` - Returns steel-based products
- `"sensor"` - Returns sensor products
- `"industrial"` - Returns industrial products

#### Search Parameters
```json
{
  "search": "pressure",
  "pagination": {
    "page": 1,
    "limit": 20
  }
}
```

#### Expected Search Results
```json
{
  "products": [
    {
      "id": "052df8db-b0a1-4c2e-8fc5-28297362801d",
      "name": "Industrial Pressure Sensor 0-100 Bar",
      "category": "robotic",
      "price": 89.95,
      "in_stock": true
    }
  ],
  "pagination": {
    "total": 1,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

#### Invalid Search Terms
- `"nonexistent-product"` - Returns empty array
- `""` - Empty search term
- Special characters: `"@#$%^&*()"`

### UC103: Filter Products - Test Data

#### Filter Criteria
```json
{
  "category": "robotic",
  "minPrice": 50,
  "maxPrice": 200,
  "inStock": true,
  "material": "Stainless Steel",
  "material_family": "steel"
}
```

#### Multiple Products for Filtering
```json
[
  {
    "id": "052df8db-b0a1-4c2e-8fc5-28297362801d",
    "name": "Industrial Pressure Sensor 0-100 Bar",
    "category": "robotic",
    "material": "Stainless Steel",
    "price": 89.95,
    "in_stock": true,
    "material_family": "steel"
  },
  {
    "id": "052df8db-b0a1-4c2e-8fc5-28297362802d",
    "name": "Structural Steel I-Beam",
    "category": "structural",
    "material": "Carbon Steel",
    "price": 150.00,
    "in_stock": false,
    "material_family": "steel"
  },
  {
    "id": "052df8db-b0a1-4c2e-8fc5-28297362803d",
    "name": "Stainless Steel Hex Bolt M8",
    "category": "fasteners",
    "material": "Stainless Steel",
    "price": 5.99,
    "in_stock": true,
    "material_family": "steel"
  }
]
```

#### Invalid Filter Values
- `category: "nonexistent-category"`
- `minPrice: -10` (negative price)
- `maxPrice: "invalid"` (non-numeric)

### UC201: User Registration - Test Data

#### Valid Registration Data
```json
{
  "email": "test@example.com",
  "password": "SecurePass123!",
  "company": "Test Company"
}
```

#### Password Requirements Test Data
```json
{
  "validPasswords": [
    "SecurePass123!",
    "MyP@ssw0rd2024",
    "Complex#Pass1"
  ],
  "invalidPasswords": [
    "password",      // No numbers or special chars
    "12345678",      // Only numbers
    "PASSWORD",      // Only uppercase
    "pass123",       // Too short
    "Pass123"        // No special characters
  ]
}
```

#### Email Validation Test Data
```json
{
  "validEmails": [
    "test@example.com",
    "user.name@domain.co.uk",
    "admin+test@company.org"
  ],
  "invalidEmails": [
    "invalid-email",
    "@domain.com",
    "user@",
    "user.domain.com",
    ""
  ]
}
```

### UC202: User Login - Test Data

#### Valid Login Credentials
```json
{
  "email": "test@example.com",
  "password": "SecurePass123!"
}
```

#### Invalid Login Scenarios
```json
{
  "wrongPassword": {
    "email": "test@example.com",
    "password": "WrongPassword123!"
  },
  "invalidEmail": {
    "email": "invalid-email",
    "password": "SecurePass123!"
  },
  "emptyCredentials": {
    "email": "",
    "password": ""
  }
}
```

#### Expected Login Response
```json
{
  "user": {
    "id": "user-123",
    "email": "test@example.com",
    "email_confirmed_at": "2024-01-01T00:00:00Z"
  },
  "session": {
    "access_token": "mock-token",
    "refresh_token": "mock-refresh-token"
  }
}
```

### UC203: User Logout - Test Data

#### Session Data
```json
{
  "activeSession": {
    "user": {
      "id": "user-123",
      "email": "test@example.com"
    },
    "access_token": "mock-token"
  },
  "noSession": null
}
```

#### Expected Logout Response
```json
{
  "success": true
}
```

### UC204: Edit User Profile - Test Data

#### Valid Profile Update Data
```json
{
  "company": "Updated Company",
  "phone": "+1234567890"
}
```

#### Current Profile Data
```json
{
  "id": "user-123",
  "company": "Test Company",
  "phone": "+1234567890",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

#### Phone Number Validation Test Data
```json
{
  "validPhoneNumbers": [
    "+1234567890",
    "+44 20 7946 0958",
    "+86 138 0013 8000",
    "(555) 123-4567"
  ],
  "invalidPhoneNumbers": [
    "123",
    "abc-def-ghij",
    "++1234567890",
    "12345678901234567890"
  ]
}
```

### UC301: View Product Details (Admin) - Test Data

#### Complete Admin Product Data
```json
{
  "id": "052df8db-b0a1-4c2e-8fc5-28297362801d",
  "sku": "pressure-sensor-001",
  "name": "Industrial Pressure Sensor 0-100 Bar",
  "category": "robotic",
  "material": "Stainless Steel",
  "material_family": "steel",
  "component_type_id": "00000000-0000-4000-8000-00000000010c",
  "price": 89.95,
  "description": "High-accuracy pressure sensor for industrial automation and control systems.",
  "technical_details": "4-20mA output, M12 connector, IP67 rated, CE certified",
  "specifications": {
    "weight": "0.12 kg",
    "tolerance": "±0.25% FS",
    "dimensions": "50mm x 25mm x 15mm",
    "loadCapacity": "100 bar maximum",
    "operatingTemp": "-40°C to +125°C"
  },
  "images": [
    "https://emgzohbqnkfxgzfvphzc.supabase.co/storage/v1/object/public/product-images/products/pressure-sensor-001/preview.png",
    "https://emgzohbqnkfxgzfvphzc.supabase.co/storage/v1/object/public/product-images/products/pressure-sensor-001/iso-front-top-left.png",
    "https://emgzohbqnkfxgzfvphzc.supabase.co/storage/v1/object/public/product-images/products/pressure-sensor-001/iso-front-bottom-right.png",
    "https://emgzohbqnkfxgzfvphzc.supabase.co/storage/v1/object/public/product-images/products/pressure-sensor-001/iso-front-bottom-left.png",
    "https://emgzohbqnkfxgzfvphzc.supabase.co/storage/v1/object/public/product-images/products/pressure-sensor-001/iso-back-top-right.png",
    "https://emgzohbqnkfxgzfvphzc.supabase.co/storage/v1/object/public/product-images/products/pressure-sensor-001/iso-back-bottom-left.png",
    "https://emgzohbqnkfxgzfvphzc.supabase.co/storage/v1/object/public/product-images/products/pressure-sensor-001/front.png",
    "https://emgzohbqnkfxgzfvphzc.supabase.co/storage/v1/object/public/product-images/products/pressure-sensor-001/back.png",
    "https://emgzohbqnkfxgzfvphzc.supabase.co/storage/v1/object/public/product-images/products/pressure-sensor-001/top.png",
    "https://emgzohbqnkfxgzfvphzc.supabase.co/storage/v1/object/public/product-images/products/pressure-sensor-001/bottom.png",
    "https://emgzohbqnkfxgzfvphzc.supabase.co/storage/v1/object/public/product-images/products/pressure-sensor-001/left.png",
    "https://emgzohbqnkfxgzfvphzc.supabase.co/storage/v1/object/public/product-images/products/pressure-sensor-001/right.png"
  ],
  "compatible_with": ["linear-actuator-001", "control-module-001"],
  "in_stock": true,
  "lead_time": "3-5 business days",
  "created_at": "2025-11-17T03:10:39.121284+00:00",
  "updated_at": "2025-12-23T10:19:54.486863+00:00"
}
```

### UC302: Create Product (Admin) - Test Data

#### Valid Product Creation Data
```json
{
  "id": "052df8db-b0a1-4c2e-8fc5-28297362802d",
  "name": "Industrial Pressure Sensor 0-200 Bar",
  "category": "robotic",
  "material": "Stainless Steel",
  "material_family": "steel",
  "component_type_id": "00000000-0000-4000-8000-00000000010c",
  "price": 129.95,
  "description": "High-accuracy pressure sensor for industrial automation and control systems.",
  "technical_details": "4-20mA output, M12 connector, IP67 rated, CE certified",
  "specifications": {
    "weight": "0.15 kg",
    "tolerance": "±0.25% FS",
    "dimensions": "55mm x 30mm x 18mm",
    "loadCapacity": "200 bar maximum",
    "operatingTemp": "-40°C to +125°C"
  },
  "images": [
    "https://emgzohbqnkfxgzfvphzc.supabase.co/storage/v1/object/public/product-images/products/pressure-sensor-002/preview.png"
  ],
  "compatible_with": ["linear-actuator-001", "control-module-001"],
  "in_stock": true,
  "lead_time": "3-5 business days"
}
```

#### Invalid Product Creation Data
```json
{
  "invalidInputs": [
    {
      "name": "",
      "category": "robotic",
      "price": 129.95,
      "error": "Empty name validation"
    },
    {
      "name": "Valid Product",
      "category": "robotic",
      "price": -10,
      "error": "Negative price validation"
    },
    {
      "name": "Valid Product",
      "category": "",
      "price": 129.95,
      "error": "Empty category validation"
    }
  ]
}
```

### UC303: Edit Product (Admin) - Test Data

#### Existing Product Data
```json
{
  "id": "052df8db-b0a1-4c2e-8fc5-28297362801d",
  "sku": "pressure-sensor-001",
  "name": "Industrial Pressure Sensor 0-100 Bar",
  "category": "robotic",
  "material": "Stainless Steel",
  "price": 89.95,
  "description": "High-accuracy pressure sensor for industrial automation and control systems.",
  "created_at": "2025-11-17T03:10:39.121284+00:00",
  "updated_at": "2025-12-23T10:19:54.486863+00:00"
}
```

#### Valid Update Data
```json
{
  "name": "Updated Industrial Pressure Sensor 0-150 Bar",
  "price": 99.95,
  "description": "Updated high-accuracy pressure sensor for industrial automation."
}
```

#### Invalid Update Data
```json
{
  "invalidPrices": [
    {"price": -10},
    {"price": undefined},
    {"price": "invalid"},
    {"price": null}
  ]
}
```

#### Expected Updated Product
```json
{
  "id": "052df8db-b0a1-4c2e-8fc5-28297362801d",
  "name": "Updated Industrial Pressure Sensor 0-150 Bar",
  "price": 99.95,
  "description": "Updated high-accuracy pressure sensor for industrial automation.",
  "updated_at": "2025-12-23T11:00:00.000000+00:00"
}
```

### UC304: Delete Product (Admin) - Test Data

#### Product to Delete
```json
{
  "id": "052df8db-b0a1-4c2e-8fc5-28297362801d",
  "sku": "pressure-sensor-001",
  "name": "Industrial Pressure Sensor 0-100 Bar",
  "category": "robotic",
  "price": 89.95,
  "in_stock": true
}
```

#### Delete Operation Parameters
- Product ID: `052df8db-b0a1-4c2e-8fc5-28297362801d`
- Admin User ID: `admin-123`
- Confirmation Required: `true`

### UC401: View Report Details (Admin) - Test Data

#### Complete Report Data
```json
{
  "id": "report-001",
  "title": "Monthly Product Analysis",
  "report_type": "AUDIT_LOG",
  "status": "COMPLETED",
  "parameters": {
    "month": 1,
    "year": 2024
  },
  "file_url": "https://storage.supabase.co/admin-reports/audit/report-001.pdf",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:02:00Z",
  "completed_at": "2024-01-01T00:05:00Z",
  "error_message": null
}
```

#### Report Status Types
- `PENDING` - Report generation in progress
- `COMPLETED` - Report successfully generated
- `FAILED` - Report generation failed
- `CANCELLED` - Report generation cancelled

### UC402: Download Report (Admin) - Test Data

#### Completed Report with File
```json
{
  "id": "report-001",
  "title": "Monthly Product Analysis",
  "status": "COMPLETED",
  "file_url": "https://storage.supabase.co/admin-reports/audit/report-001.pdf",
  "completed_at": "2024-01-01T00:05:00Z"
}
```

#### Report without File
```json
{
  "id": "report-002",
  "title": "Pending Analysis",
  "status": "PENDING",
  "file_url": null,
  "completed_at": null
}
```

#### File URL Examples
- PDF Report: `https://storage.supabase.co/admin-reports/audit/report-001.pdf`
- Excel Report: `https://storage.supabase.co/admin-reports/sales/report-002.xlsx`
- CSV Report: `https://storage.supabase.co/admin-reports/inventory/report-003.csv`

### UC403: Delete Report (Admin) - Test Data

#### Report to Delete
```json
{
  "id": "report-001",
  "title": "Monthly Product Analysis",
  "status": "COMPLETED",
  "file_url": "https://storage.supabase.co/admin-reports/audit/report-001.pdf",
  "created_at": "2024-01-01T00:00:00Z"
}
```

#### Storage File Path
- Bucket: `admin-reports`
- File Path: `audit/report-001.pdf`
- Full URL: `https://storage.supabase.co/admin-reports/audit/report-001.pdf`

### UC404: Generate Report (Admin) - Test Data

#### Valid Report Generation Input
```json
{
  "title": "Monthly Product Analysis",
  "report_type": "AUDIT_LOG",
  "parameters": {
    "month": 1,
    "year": 2024,
    "includeDetails": true,
    "format": "PDF"
  }
}
```

#### Report Types
- `AUDIT_LOG` - System audit logs
- `SALES_REPORT` - Sales analytics
- `INVENTORY_REPORT` - Stock levels
- `USER_ACTIVITY` - User engagement metrics

#### Invalid Generation Input
```json
{
  "invalidInputs": [
    {
      "title": "",
      "report_type": "AUDIT_LOG",
      "error": "Empty title validation"
    },
    {
      "title": "Valid Title",
      "report_type": "",
      "error": "Missing report type validation"
    },
    {
      "title": "Valid Title",
      "report_type": "INVALID_TYPE",
      "error": "Invalid report type validation"
    }
  ]
}
```

#### Expected Generated Report
```json
{
  "id": "report-001",
  "title": "Monthly Product Analysis",
  "report_type": "AUDIT_LOG",
  "status": "PENDING",
  "parameters": {
    "month": 1,
    "year": 2024
  },
  "file_url": null,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z",
  "completed_at": null,
  "error_message": null
}
```

---

*Test Data Specifications Last Updated: December 23, 2025*
*Version: 1.0*