const SHEET_ID = "18pVNW1_3wYdUaOJSJkwPA0MF2h4jaUVJFNQvfHfICoY"; // <-- ใส่ ID ของ Google Sheet ของคุณที่นี่
const SHEET_NAME = "Sheet1"; // <-- เปลี่ยนเป็นชื่อชีตของคุณ ถ้าไม่ใช่ "Sheet1"

// Function to get data from the sheet
function doGet(e) {
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
  const data = sheet.getDataRange().getValues();
  const headers = data.shift(); 
  
  const searchKey = e.parameter.key;
  const searchValue = e.parameter.value.toLowerCase();
  
  let results = []; // เปลี่ยนเป็น Array เพื่อเก็บผลลัพธ์หลายรายการ
  
  let searchIndex = -1;
  if (searchKey === 'studentID') searchIndex = 0;
  if (searchKey === 'thaiName') searchIndex = 1;
  if (searchKey === 'englishName') searchIndex = 4;

  if (searchIndex !== -1) {
    for (let i = 0; i < data.length; i++) {
      if (data[i][searchIndex] && data[i][searchIndex].toString().toLowerCase().includes(searchValue)) {
        let resultData = {};
        headers.forEach((header, index) => {
          resultData[header] = data[i][index];
        });
        results.push(resultData); // เพิ่มผลลัพธ์ที่เจอเข้าไปใน Array
      }
    }
  }
  
  // ส่งข้อมูลกลับไปเป็น JSON ที่มี key เป็น 'data' และ value เป็น Array ของผลลัพธ์
  return ContentService.createTextOutput(JSON.stringify({ data: results }))
    .setMimeType(ContentService.MimeType.JSON);
}

// Function to update the sheet
function doPost(e) {
  try {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
    const postData = JSON.parse(e.postData.contents);
    
    const studentID = postData.studentID;
    const comment = postData.comment;
    const status = postData.status;
    
    const data = sheet.getDataRange().getValues();
    let rowIndex = -1;

    // Find the row index for the given student ID
    for(let i = 1; i < data.length; i++) { // Start from 1 to skip header
        if(data[i][0].toString() === studentID) { // Column A is student ID
            rowIndex = i + 1; // Sheet rows are 1-indexed
            break;
        }
    }

    if (rowIndex !== -1) {
      sheet.getRange(rowIndex, 14).setValue(comment); // Column N
      sheet.getRange(rowIndex, 15).setValue(status);  // Column O
      
      return ContentService.createTextOutput(JSON.stringify({ success: true, message: "Sheet updated successfully." }))
        .setMimeType(ContentService.MimeType.JSON);
    } else {
      return ContentService.createTextOutput(JSON.stringify({ success: false, message: "Student ID not found." }))
        .setMimeType(ContentService.MimeType.JSON);
    }
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}