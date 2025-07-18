const SHEET_ID = "18pVNW1_3wYdUaOJSJkwPA0MF2h4jaUVJFNQvfHfICoY";
const SHEET_NAME = "Sheet1";

// ===============================================================
// NEW FUNCTION TO HANDLE CORS PREFLIGHT REQUESTS
// ===============================================================
function doOptions(e) {
  return ContentService.createTextOutput()
    .setHeader('Access-Control-Allow-Origin', '*')
    .setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
    .setHeader('Access-Control-Allow-Headers', 'Content-Type');
}
// ===============================================================

function doGet(e) {
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
  const data = sheet.getDataRange().getValues();
  const headers = data.shift();
  let results = [];
  const searchKey = e.parameter.key;
  const searchValue = e.parameter.value ? e.parameter.value.toLowerCase() : null;
  if (searchValue) {
    let searchIndex = -1;
    if (searchKey === 'studentID') searchIndex = 0;
    if (searchKey === 'thaiName') searchIndex = 1;
    if (searchKey === 'englishName') searchIndex = 4;
    if (searchIndex !== -1) {
      for (let i = 0; i < data.length; i++) {
        if (data[i][searchIndex] && data[i][searchIndex].toString().toLowerCase().includes(searchValue)) {
          let resultData = {};
          headers.forEach((header, index) => { resultData[header] = data[i][index]; });
          results.push(resultData);
          if (searchKey === 'studentID') break;
        }
      }
    }
  }
  return ContentService.createTextOutput(JSON.stringify({ data: results })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
    const postData = JSON.parse(e.postData.contents);
    const action = postData.action;

    const allData = sheet.getDataRange().getValues();
    const headers = allData.shift(); 
    const commentColIndex = headers.indexOf("Comments");
    const statusColIndex = headers.indexOf("Status");

    if (action === 'updateSingleStatus') {
      const studentID = postData.studentID;
      for (let i = 0; i < allData.length; i++) {
        if (allData[i][0] && allData[i][0].toString() === studentID) {
          const rowIndex = i + 2;
          if (commentColIndex > -1) sheet.getRange(rowIndex, commentColIndex + 1).setValue(postData.comment);
          if (statusColIndex > -1) sheet.getRange(rowIndex, statusColIndex + 1).setValue(postData.status);
          break;
        }
      }
      return ContentService.createTextOutput(JSON.stringify({ success: true, message: "Student updated." })).setMimeType(ContentService.MimeType.JSON);
    
    } else if (action === 'approveAll') {
      const studentIDs = postData.studentIDs;
      studentIDs.forEach(studentID => {
        for (let i = 0; i < allData.length; i++) {
          if (allData[i][0] && allData[i][0].toString() === studentID) {
            const rowIndex = i + 2;
            if (statusColIndex > -1) sheet.getRange(rowIndex, statusColIndex + 1).setValue("Approve");
            break; 
          }
        }
      });
      return ContentService.createTextOutput(JSON.stringify({ success: true, message: "All approved." })).setMimeType(ContentService.MimeType.JSON);
    }

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, message: error.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}