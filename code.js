const SHEET_ID = "18pVNW1_3wYdUaOJSJkwPA0MF2h4jaUVJFNQvfHfICoY"; // <-- ใส่ ID ของ Google Sheet ของคุณที่นี่
const SHEET_NAME = "Sheet1"; // <-- ตรวจสอบชื่อ Sheet ของคุณ

function doGet(e) {
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
  const data = sheet.getDataRange().getValues();
  const headers = data.shift();
  
  let results = [];
  
  // ตรวจสอบก่อนว่ามีการส่ง parameter มาหรือไม่
  const searchKey = e.parameter.key;
  const searchValue = e.parameter.value ? e.parameter.value.toLowerCase() : null;

  // จะค้นหาต่อเมื่อมีค่าที่ต้องการค้นหาเท่านั้น
  if (searchValue) {
      let searchIndex = -1;
      if (searchKey === 'studentID') searchIndex = 0;   // Column A
      if (searchKey === 'thaiName') searchIndex = 1;    // Column B
      if (searchKey === 'englishName') searchIndex = 4; // Column E

      if (searchIndex !== -1) {
        for (let i = 0; i < data.length; i++) {
          if (data[i][searchIndex] && data[i][searchIndex].toString().toLowerCase().includes(searchValue)) {
            let resultData = {};
            headers.forEach((header, index) => {
              resultData[header] = data[i][index];
            });
            results.push(resultData);
          }
        }
      }
  }
  
  return ContentService.createTextOutput(JSON.stringify({ data: results }))
    .setMimeType(ContentService.MimeType.JSON);
}


function doPost(e) {
  try {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
    const postData = JSON.parse(e.postData.contents);
    
    // Logic for updating status
    const studentID = postData.studentID;
    const comment = postData.comment;
    const status = postData.status;
    
    const data = sheet.getDataRange().getValues();
    let rowIndex = -1;

    for (let i = 1; i < data.length; i++) {
        if (data[i][0] && data[i][0].toString() === studentID) {
            rowIndex = i + 1;
            break;
        }
    }

    if (rowIndex !== -1) {
      const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      const commentCol = headers.indexOf("Comments") + 1; // หาคอลัมน์ Comments
      const statusCol = headers.indexOf("Status") + 1;   // หาคอลัมน์ Status

      if (commentCol > 0) sheet.getRange(rowIndex, commentCol).setValue(comment);
      if (statusCol > 0) sheet.getRange(rowIndex, statusCol).setValue(status);
      
      return ContentService.createTextOutput(JSON.stringify({ success: true, message: "Sheet updated." }));
    } else {
      return ContentService.createTextOutput(JSON.stringify({ success: false, message: "Student ID not found." }));
    }
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, message: error.toString() }));
  }
}