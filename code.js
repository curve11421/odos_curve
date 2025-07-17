const SHEET_ID = "18pVNW1_3wYdUaOJSJkwPA0MF2h4jaUVJFNQvfHfICoY"; // <-- ตรวจสอบว่าเป็น ID ของคุณ
const SHEET_NAME = "Sheet1"; // <-- ตรวจสอบชื่อ Sheet ของคุณ

// Function to search for students and return multiple results
function doGet(e) {
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
  const data = sheet.getDataRange().getValues();
  const headers = data.shift(); // Get headers and remove them from data
  
  const searchKey = e.parameter.key;
  const searchValue = e.parameter.value.toLowerCase();
  
  let results = [];
  
  let searchIndex = -1;
  if (searchKey === 'studentID') searchIndex = 0;   // Column A
  if (searchKey === 'thaiName') searchIndex = 1;    // Column B
  if (searchKey === 'englishName') searchIndex = 4; // Column E

  if (searchIndex !== -1 && searchValue) {
    for (let i = 0; i < data.length; i++) {
      // Use .includes() for partial matching on names
      if (data[i][searchIndex] && data[i][searchIndex].toString().toLowerCase().includes(searchValue)) {
        let resultData = {};
        headers.forEach((header, index) => {
          resultData[header] = data[i][index];
        });
        results.push(resultData);
      }
    }
  }
  
  return ContentService.createTextOutput(JSON.stringify({ data: results }))
    .setMimeType(ContentService.MimeType.JSON);
}

// Function to handle both updating status AND adding new students
function doPost(e) {
  try {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
    const postData = JSON.parse(e.postData.contents);
    const action = postData.action;

    // ACTION 1: Add a new student
    if (action === 'addStudent') {
      const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      // Create a new row by mapping the postData to the header order
      const newRow = headers.map(header => postData[header] || ""); 
      sheet.appendRow(newRow);
      return ContentService.createTextOutput(JSON.stringify({ success: true, message: "Student added." }));

    // ACTION 2: Update an existing student's status
    } else if (action === 'updateStatus') {
      const studentID = postData.studentID;
      const data = sheet.getDataRange().getValues(); // Get all data again to find row index
      let rowIndex = -1;

      // Find row index by student ID (Column A)
      for (let i = 1; i < data.length; i++) {
          if (data[i][0] && data[i][0].toString() === studentID) {
              rowIndex = i + 1; // Sheet rows are 1-indexed
              break;
          }
      }

      if (rowIndex !== -1) {
        // Find 'Comments' and 'Status' columns by their header name to be more robust
        const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
        const commentCol = headers.indexOf("Comments") + 1; // Assumes you have a "Comments" header
        const statusCol = headers.indexOf("Status") + 1;   // Assumes you have a "Status" header

        if (commentCol > 0) sheet.getRange(rowIndex, commentCol).setValue(postData.comment);
        if (statusCol > 0) sheet.getRange(rowIndex, statusCol).setValue(postData.status);
        
        return ContentService.createTextOutput(JSON.stringify({ success: true, message: "Sheet updated." }));
      } else {
        return ContentService.createTextOutput(JSON.stringify({ success: false, message: "Student ID not found." }));
      }
    }
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, message: error.toString() }));
  }
}