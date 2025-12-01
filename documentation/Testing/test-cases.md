# SteelSmart Test Cases

## Test Case Template

**Test Case ID**: TC_Cart_001  
**Test Designed by**: Ching E-Fye  
**Test Priority (Low/Medium/High)**: High  
**Test Designed date**: Sat 3/15/25  
**Module Name**: Shopping Cart Module  
**Test Executed by**: Ching E-Fye  
**Test Title**: Add To Cart Successfully  
**Test Execution date**: Sat 4/26/25  
**Description**: To test whether the user can add product to the cart successfully that is in stock, valid and within the allowed limit.  
**Pre-Conditions**: User is logged in.

| Step | Test Steps | Test Data | Expected Result | Actual Result | Status (Pass/Fail) | Notes |
|------|-----------|-----------|-----------------|---------------|-------------------|-------|
| 1 | Select a desired product | Product name: UGREEN Uno 65W GaN Charger | The system displays the product page. | As expected | Pass |  |
| 2 | Click on "Add to Cart" | Quantity : 1 | The system adds the product to cart | As expected | Pass |  |
| 3 | Click on the "Cart" logo | N/A | The system shows the cart page and displays the newly added product. | As expected | Pass |  |

**Post-conditions**: N/A

---

## CAD Drawing Generator Module

### UC101: Generate drawing from text input

#### TC_CAD_UC101_001: Generate drawing from valid text description

**Test Case ID**: TC_CAD_UC101_001  
**Test Designed by**: \<Name>  
**Test Priority**: High  
**Test Designed date**: \<Date>  
**Module Name**: CAD Drawing Generator  
**Test Executed by**: \<Name>  
**Test Title**: Generate drawing from valid text description  
**Test Execution date**: \<Date>  
**Description**: Verify that a valid natural language description generates a correct CAD drawing.  
**Pre-Conditions**: User is logged in and on the "Generate from Text" screen.

| Step | Test Steps | Test Data | Expected Result | Actual Result | Status | Notes |
|------|-----------|-----------|-----------------|---------------|--------|-------|
| 1 | Enter a valid text description | "Create a 1000mm long steel I-beam with 200mm flange width and 10mm web thickness." | System accepts description without validation errors. | As expected | Pass |  |
| 2 | Click "Generate Drawing" | N/A | System shows progress and generates a drawing. | As expected | Pass |  |
| 3 | Inspect generated drawing dimensions | N/A | Drawing length = 1000mm, flange width = 200mm, web thickness = 10mm. | As expected | Pass |  |

**Post-conditions**: Drawing is saved in user's workspace.

---

#### TC_CAD_UC101_002: Validation on empty text input

**Test Case ID**: TC_CAD_UC101_002  
**Test Title**: Validation on empty text input  
**Description**: Ensure system prevents drawing generation when the description is empty.  
**Pre-Conditions**: User on "Generate from Text" screen.

| Step | Test Steps | Test Data | Expected Result | Actual Result | Status | Notes |
|------|-----------|-----------|-----------------|---------------|--------|-------|
| 1 | Leave description textbox empty | N/A | System marks field as required. | As expected | Pass |  |
| 2 | Click "Generate Drawing" | N/A | System shows "Description is required" and does not start generation. | As expected | Pass |  |

**Post-conditions**: No drawing created.

---

#### TC_CAD_UC101_003: Handle ambiguous text with clarification prompt

**Test Case ID**: TC_CAD_UC101_003  
**Test Title**: Handle ambiguous text with clarification prompt  
**Description**: Verify system prompts for clarification when description lacks specific dimensions.  
**Pre-Conditions**: User on "Generate from Text" screen.

| Step | Test Steps | Test Data | Expected Result | Actual Result | Status | Notes |
|------|-----------|-----------|-----------------|---------------|--------|-------|
| 1 | Enter ambiguous description | "Create a short beam with standard thickness" | System detects missing dimensions. | As expected | Pass |  |
| 2 | Click "Generate Drawing" | N/A | System prompts user to specify missing values instead of generating incorrect drawing. | As expected | Pass |  |

---

#### TC_CAD_UC101_004: Validation error on unsupported shape

**Test Case ID**: TC_CAD_UC101_004  
**Test Title**: Validation error on unsupported shape  
**Description**: Ensure system rejects requests for unsupported geometry types.  
**Pre-Conditions**: User on "Generate from Text" screen.

| Step | Test Steps | Test Data | Expected Result | Actual Result | Status | Notes |
|------|-----------|-----------|-----------------|---------------|--------|-------|
| 1 | Enter description of unsupported geometry | "Create a freeform curved steel plate with variable thickness." | System validates geometry type. | As expected | Pass |  |
| 2 | Click "Generate Drawing" | N/A | System shows error "Unsupported geometry type" and does not generate drawing. | As expected | Pass |  |

---

### UC102: Generate drawing from template

#### TC_CAD_UC102_001: Generate drawing from standard template

**Test Case ID**: TC_CAD_UC102_001  
**Test Title**: Generate drawing from standard template  
**Description**: Verify user can generate drawing using a standard template with default parameters.  
**Pre-Conditions**: User logged in and on "Templates" screen.

| Step | Test Steps | Test Data | Expected Result | Actual Result | Status | Notes |
|------|-----------|-----------|-----------------|---------------|--------|-------|
| 1 | Select "Standard I-Beam" template | N/A | Template details (default length, flange width, material) are displayed. | As expected | Pass |  |
| 2 | Keep default parameters and click "Generate" | N/A | System generates CAD drawing based on template defaults. | As expected | Pass |  |
| 3 | Review generated drawing summary | N/A | Parameters in summary match template defaults. | As expected | Pass |  |

---

#### TC_CAD_UC102_002: Reject out-of-range dimension in template

**Test Case ID**: TC_CAD_UC102_002  
**Test Title**: Reject out-of-range dimension in template  
**Description**: Ensure invalid dimension values are blocked.  
**Pre-Conditions**: User on "Templates" screen.

| Step | Test Steps | Test Data | Expected Result | Actual Result | Status | Notes |
|------|-----------|-----------|-----------------|---------------|--------|-------|
| 1 | Select "Standard I-Beam" template | N/A | Template form appears. | As expected | Pass |  |
| 2 | Change beam length to -500mm | Length: -500mm | System highlights length field as invalid. | As expected | Pass |  |
| 3 | Click "Generate" | N/A | System shows validation error (e.g., "Length must be between 100mm and 12000mm") and does not generate drawing. | As expected | Pass |  |

---

#### TC_CAD_UC102_003: Generate from template with modified parameters

**Test Case ID**: TC_CAD_UC102_003  
**Test Title**: Generate from template with modified parameters  
**Description**: Verify user can modify template parameters and generate drawing.  
**Pre-Conditions**: User on "Templates" screen.

| Step | Test Steps | Test Data | Expected Result | Actual Result | Status | Notes |
|------|-----------|-----------|-----------------|---------------|--------|-------|
| 1 | Select "Standard I-Beam" template | N/A | Template form appears. | As expected | Pass |  |
| 2 | Change length to 1200mm, flange width to 250mm | Length: 1200mm, Flange: 250mm | Fields accept new values. | As expected | Pass |  |
| 3 | Click "Generate" | N/A | System generates drawing with updated parameters. | As expected | Pass |  |

---

### UC103: Edit generated CAD drawing

#### TC_CAD_UC103_001: Edit beam length in generated drawing

**Test Case ID**: TC_CAD_UC103_001  
**Test Title**: Edit beam length in generated drawing  
**Description**: Verify user can modify beam length and system updates the drawing correctly.  
**Pre-Conditions**: A previously generated beam drawing is open in the CAD editor.

| Step | Test Steps | Test Data | Expected Result | Actual Result | Status | Notes |
|------|-----------|-----------|-----------------|---------------|--------|-------|
| 1 | Select the beam length dimension | N/A | Length dimension control is activated. | As expected | Pass |  |
| 2 | Change length from 1000mm to 1200mm | New length: 1200mm | Dimension field accepts new value. | As expected | Pass |  |
| 3 | Apply/save changes | N/A | Geometry regenerates; beam length now 1200mm; no geometry errors. | As expected | Pass |  |

---

#### TC_CAD_UC103_002: Prevent invalid hole placement

**Test Case ID**: TC_CAD_UC103_002  
**Test Title**: Prevent invalid hole placement  
**Description**: Ensure the editor blocks a hole that violates minimum edge distance.  
**Pre-Conditions**: Beam drawing with at least one flange; min edge distance rule configured.

| Step | Test Steps | Test Data | Expected Result | Actual Result | Status | Notes |
|------|-----------|-----------|-----------------|---------------|--------|-------|
| 1 | Add a new bolt hole feature on flange | Position too close to flange edge | System indicates hole position is invalid (constraint violation). | As expected | Pass |  |
| 2 | Attempt to save drawing | N/A | Save is blocked or user is warned; hole must be corrected or removed. | As expected | Pass |  |

---

### UC104: Download CAD drawing

#### TC_CAD_UC104_001: Download valid drawing as STEP

**Test Case ID**: TC_CAD_UC104_001  
**Test Title**: Download valid drawing as STEP  
**Description**: Verify a valid drawing can be downloaded as STEP and opened in external CAD software.  
**Pre-Conditions**: Valid saved drawing open.

| Step | Test Steps | Test Data | Expected Result | Actual Result | Status | Notes |
|------|-----------|-----------|-----------------|---------------|--------|-------|
| 1 | Click "Download" button | N/A | Download dialog opens. | As expected | Pass |  |
| 2 | Select "STEP" format and confirm | Format: STEP | File download starts and completes without error. | As expected | Pass |  |
| 3 | Open downloaded file in external CAD tool | N/A | External tool opens file successfully; geometry matches original drawing. | As expected | Pass |  |

---

#### TC_CAD_UC104_002: Download with unsaved edits

**Test Case ID**: TC_CAD_UC104_002  
**Test Title**: Download with unsaved edits  
**Description**: Verify behavior when user downloads with unsaved edits.  
**Pre-Conditions**: Drawing open with unsaved changes.

| Step | Test Steps | Test Data | Expected Result | Actual Result | Status | Notes |
|------|-----------|-----------|-----------------|---------------|--------|-------|
| 1 | Make a visible change (e.g., change length) but do not save | N/A | Editor shows unsaved state. | As expected | Pass |  |
| 2 | Click "Download STEP" | N/A | System either prompts to save or indicates that only saved version will be exported. | As expected | Pass | Clarify chosen behavior in spec. |
| 3 | Proceed with export as per UX | N/A | Exported file content is consistent with documented behavior (saved or latest). | As expected | Pass |  |

---

## CAD Drawing Analyser Module

### UC201: Validate drawing manufacturability

#### TC_ANA_UC201_001: Manufacturability check passes for compliant drawing

**Test Case ID**: TC_ANA_UC201_001  
**Test Title**: Manufacturability check passes for compliant drawing  
**Description**: Ensure a compliant drawing passes manufacturability checks.  
**Pre-Conditions**: Valid drawing with standard hole spacing and edge distances open.

| Step | Test Steps | Test Data | Expected Result | Actual Result | Status | Notes |
|------|-----------|-----------|-----------------|---------------|--------|-------|
| 1 | Open "Manufacturability Check" panel | N/A | Panel opens with default settings. | As expected | Pass |  |
| 2 | Click "Run Check" | N/A | System runs analysis and completes without errors. | As expected | Pass |  |
| 3 | Review results | N/A | Status: "Manufacturable"; zero critical issues; possible informational warnings only. | As expected | Pass |  |

---

#### TC_ANA_UC201_002: Detect non-manufacturable hole near edge

**Test Case ID**: TC_ANA_UC201_002  
**Test Title**: Detect non-manufacturable hole near edge  
**Description**: Ensure system flags a hole violating minimum edge distance.  
**Pre-Conditions**: Drawing with at least one hole violating edge distance rule.

| Step | Test Steps | Test Data | Expected Result | Actual Result | Status | Notes |
|------|-----------|-----------|-----------------|---------------|--------|-------|
| 1 | Run "Manufacturability Check" | N/A | System analyses drawing. | As expected | Pass |  |
| 2 | Inspect issue list | N/A | Issue reported: "Hole too close to edge" with location and threshold details. | As expected | Pass |  |

---

### UC202: Verify drawing specifications

#### TC_ANA_UC202_001: Dimensions within tolerance pass spec check

**Test Case ID**: TC_ANA_UC202_001  
**Test Title**: Dimensions within tolerance pass spec check  
**Description**: Verify that dimensions within tolerance are accepted.  
**Pre-Conditions**: Drawing with length 1000.5mm.

| Step | Test Steps | Test Data | Expected Result | Actual Result | Status | Notes |
|------|-----------|-----------|-----------------|---------------|--------|-------|
| 1 | Open spec verification screen | N/A | Spec input form visible. | As expected | Pass |  |
| 2 | Enter target length 1000mm with ±1mm tolerance | Target: 1000mm, Tol: ±1mm | System accepts spec. | As expected | Pass |  |
| 3 | Run verification | N/A | Result: Pass; reported measured length = 1000.5mm within tolerance. | As expected | Pass |  |

---

#### TC_ANA_UC202_002: Material mismatch fails spec check

**Test Case ID**: TC_ANA_UC202_002  
**Test Title**: Material mismatch fails spec check  
**Description**: Verify that a drawing with wrong material grade fails spec check.  
**Pre-Conditions**: Drawing material = S235.

| Step | Test Steps | Test Data | Expected Result | Actual Result | Status | Notes |
|------|-----------|-----------|-----------------|---------------|--------|-------|
| 1 | Enter required material = S355 | Material: S355 | System accepts spec. | As expected | Pass |  |
| 2 | Run verification | N/A | System reports failure with "Required material: S355, Actual: S235". | As expected | Pass |  |

---

### UC203: Generate analysis report

#### TC_ANA_UC203_001: Generate PDF report after analysis

**Test Case ID**: TC_ANA_UC203_001  
**Test Title**: Generate PDF report after analysis  
**Description**: Verify full analysis report generation after checks are run.  
**Pre-Conditions**: Manufacturability and spec checks completed for a drawing.

| Step | Test Steps | Test Data | Expected Result | Actual Result | Status | Notes |
|------|-----------|-----------|-----------------|---------------|--------|-------|
| 1 | Click "Generate Report" | N/A | Report settings dialog appears (format selection). | As expected | Pass |  |
| 2 | Select PDF and confirm | Format: PDF | System generates and downloads report. | As expected | Pass |  |
| 3 | Open report | N/A | Report contains summary, detailed issues, pass/fail status, and optionally annotated images. | As expected | Pass |  |

---

#### TC_ANA_UC203_002: Block report generation without analysis

**Test Case ID**: TC_ANA_UC203_002  
**Test Title**: Block report generation without analysis  
**Description**: Ensure report cannot be generated if no analysis has been run.  
**Pre-Conditions**: A drawing is open; no analysis executed yet.

| Step | Test Steps | Test Data | Expected Result | Actual Result | Status | Notes |
|------|-----------|-----------|-----------------|---------------|--------|-------|
| 1 | Click "Generate Report" | N/A | System shows message "No analysis available; please run checks first" and disables report generation. | As expected | Pass |  |

---

## Product Recommender Module

### UC301: Match similar components

#### TC_REC_UC301_001: Find catalog matches from drawing

**Test Case ID**: TC_REC_UC301_001  
**Test Title**: Find catalog matches from drawing  
**Description**: Verify the system matches catalog components to a valid drawing.  
**Pre-Conditions**: Valid drawing with standard beam profile open.

| Step | Test Steps | Test Data | Expected Result | Actual Result | Status | Notes |
|------|-----------|-----------|-----------------|---------------|--------|-------|
| 1 | Click "Find Matching Components" | N/A | Matching process starts. | As expected | Pass |  |
| 2 | Wait for results | N/A | List of catalog components with identical/similar geometry appears. | As expected | Pass |  |

---

#### TC_REC_UC301_002: Display similar components when no exact match

**Test Case ID**: TC_REC_UC301_002  
**Test Title**: Display similar components when no exact match  
**Description**: Verify system displays similar components when exact match is unavailable.  
**Pre-Conditions**: Drawing with dimensions not exactly in catalog.

| Step | Test Steps | Test Data | Expected Result | Actual Result | Status | Notes |
|------|-----------|-----------|-----------------|---------------|--------|-------|
| 1 | Run "Find Matching Components" | N/A | System processes drawing. | As expected | Pass |  |
| 2 | Review results | N/A | System states "No exact match" and lists similar items with differences highlighted. | As expected | Pass |  |

---

### UC302: Recommend alternative products

#### TC_REC_UC302_001: Recommend alternatives for out-of-stock component

**Test Case ID**: TC_REC_UC302_001  
**Test Title**: Recommend alternatives for out-of-stock component  
**Description**: Verify alternatives are suggested when a selected product is unavailable.  
**Pre-Conditions**: Component selected from catalog; stock = 0.

| Step | Test Steps | Test Data | Expected Result | Actual Result | Status | Notes |
|------|-----------|-----------|-----------------|---------------|--------|-------|
| 1 | Click "Recommend Alternatives" | N/A | System searches for compatibles. | As expected | Pass |  |
| 2 | View alternatives list | N/A | List shows compatible products with stock, price, and lead time. | As expected | Pass |  |

---

### UC303: Display ranked recommendations

#### TC_REC_UC303_001: Rank recommendations by compatibility

**Test Case ID**: TC_REC_UC303_001  
**Test Title**: Rank recommendations by compatibility  
**Description**: Verify recommendations are ranked correctly by default.  
**Pre-Conditions**: Recommendations computed.

| Step | Test Steps | Test Data | Expected Result | Actual Result | Status | Notes |
|------|-----------|-----------|-----------------|---------------|--------|-------|
| 1 | Open recommendations view | N/A | List of recommended products displayed. | As expected | Pass |  |
| 2 | Check default sort | N/A | Items ordered by descending compatibility score; top items are most compatible. | As expected | Pass |  |

---

## RFQ Module

### UC401: Create RFQ request

#### TC_RFQ_UC401_001: Create RFQ from selected component

**Test Case ID**: TC_RFQ_UC401_001  
**Test Title**: Create RFQ from selected component  
**Description**: Verify that user can create an RFQ from a recommended component.  
**Pre-Conditions**: User logged in; component selected in recommendation list.

| Step | Test Steps | Test Data | Expected Result | Actual Result | Status | Notes |
|------|-----------|-----------|-----------------|---------------|--------|-------|
| 1 | Click "Create RFQ" from component | N/A | RFQ form opens with component pre-filled. | As expected | Pass |  |
| 2 | Enter quantity and required date | Qty: 10, Date: \<date> | Fields validate successfully. | As expected | Pass |  |
| 3 | Save RFQ as draft | N/A | New RFQ draft created with unique ID. | As expected | Pass |  |

---

### UC402: Auto-fill RFQ details

#### TC_RFQ_UC402_001: Auto-fill RFQ from CAD drawing

**Test Case ID**: TC_RFQ_UC402_001  
**Test Title**: Auto-fill RFQ from CAD drawing  
**Description**: Verify technical fields are auto-filled from drawing.  
**Pre-Conditions**: Drawing open with material, section, and quantity metadata.

| Step | Test Steps | Test Data | Expected Result | Actual Result | Status | Notes |
|------|-----------|-----------|-----------------|---------------|--------|-------|
| 1 | Click "Request Quote" from drawing | N/A | RFQ form opens. | As expected | Pass |  |
| 2 | Review auto-filled fields | N/A | Material, dimensions, and quantity match drawing metadata. | As expected | Pass |  |

---

### UC403: Submit RFQ form

#### TC_RFQ_UC403_001: Submit valid RFQ successfully

**Test Case ID**: TC_RFQ_UC403_001  
**Test Title**: Submit valid RFQ successfully  
**Description**: Verify that a complete RFQ can be submitted to suppliers.  
**Pre-Conditions**: RFQ draft with all mandatory fields completed.

| Step | Test Steps | Test Data | Expected Result | Actual Result | Status | Notes |
|------|-----------|-----------|-----------------|---------------|--------|-------|
| 1 | Open RFQ draft | RFQ ID: \<ID> | RFQ details display correctly. | As expected | Pass |  |
| 2 | Click "Submit" | N/A | System sends RFQ to suppliers and shows confirmation with RFQ ID. | As expected | Pass |  |
| 3 | Check RFQ status | N/A | Status in RFQ list updated to "Submitted". | As expected | Pass |  |

---

### UC404: Track RFQ status

#### TC_RFQ_UC404_001: View RFQ status history

**Test Case ID**: TC_RFQ_UC404_001  
**Test Title**: View RFQ status history  
**Description**: Verify user can see current status and history of RFQ.  
**Pre-Conditions**: At least one RFQ with multiple status updates exists.

| Step | Test Steps | Test Data | Expected Result | Actual Result | Status | Notes |
|------|-----------|-----------|-----------------|---------------|--------|-------|
| 1 | Open "My RFQs" | N/A | List of RFQs with statuses displayed. | As expected | Pass |  |
| 2 | Click on an RFQ with quotes | RFQ ID: \<ID> | Detailed view shows status timeline (Submitted → In Review → Quoted). | As expected | Pass |  |

---


