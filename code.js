// กรุณาเปลี่ยนค่า SHEET_ID และ SHEET_NAME ให้ตรงกับ Google Sheet ของคุณ
const SHEET_ID = '18pVNW1_3wYdUaOJSJkwPA0MF2h4jaUVJFNQvfHfICoY'; // <-- ใส่ ID ของ Google Sheet ที่นี่
const SHEET_NAME = 'Sheet1'; // <-- ใส่ชื่อ Sheet ที่ต้องการใช้งาน

// กำหนดคอลัมน์สำหรับบันทึกข้อมูล
const COMMENT_COL = 14; // คอลัมน์ N
const STATUS_COL = 15;  // คอลัมน์ O
const ID_COL = 1;       // คอลัมน์ A

const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);

function doOptions(e) {
  return ContentService.createTextOutput()
    .setHeader('Access-Control-Allow-Origin', '*')
    .setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    .setHeader('Access-Control-Allow-Headers', 'Content-Type');
}
function doGet(e) {
  try {
    const key = e.parameter.key;
    const value = e.parameter.value;

    if (!key || !value) {
      throw new Error("Missing search key or value.");
    }
    
    const data = sheet.getDataRange().getValues();
    const headers = data.shift(); // นำแถวแรก (header) ออกมา
    
    // หา index ของคอลัมน์ที่ต้องการค้นหาจาก key ที่ส่งมา
    // สมมติว่า key ที่ส่งมา ('studentID', 'thaiName', 'englishName') ตรงกับ header ใน Sheet
    // เราจะใช้การค้นหาจาก 'ID' ซึ่งเป็นค่าที่ส่งมาจาก key 'studentID' เป็นหลัก
    let searchColIndex = headers.indexOf('ID'); // ค้นหาจากคอลัมน์ 'ID' เป็นหลัก
     if (key === 'thaiName') {
        // หากต้องการค้นหาจากชื่อไทย สามารถเพิ่ม logic ได้
        // searchColIndex = headers.indexOf('Thai Firstname'); 
     } else if (key === 'englishName') {
        // หากต้องการค้นหาจากชื่ออังกฤษ
        // searchColIndex = headers.indexOf('English Firstname');
     }

    const results = data.filter(row => {
      // ค้นหาแบบไม่สนตัวพิมพ์เล็ก/ใหญ่ และตัดช่องว่าง
      return String(row[searchColIndex]).trim().toLowerCase() === String(value).trim().toLowerCase();
    }).map(row => {
      // แปลง array ของข้อมูลให้อยู่ในรูปแบบ object { header: value }
      const studentObj = {};
      headers.forEach((header, index) => {
        studentObj[header] = row[index];
      });
      return studentObj;
    });

    return ContentService
      .createTextOutput(JSON.stringify({ data: results }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * ฟังก์ชันสำหรับจัดการ POST requests (ใช้สำหรับอัปเดตสถานะ)
 * @param {Object} e - Event object ที่มีข้อมูลที่ถูกส่งมาใน body
 * @returns {ContentService.TextOutput} - ผลลัพธ์การทำงานในรูปแบบ JSON
 */
function doPost(e) {
  try {
    const requestData = JSON.parse(e.postData.contents);
    const action = requestData.action;

    if (action === 'updateSingleStatus') {
      const { studentID, status, comment } = requestData;
      if (!studentID || !status) {
        throw new Error('Missing studentID or status for update.');
      }
      const result = updateStudentStatus(studentID, status, comment);
      if (!result) {
         throw new Error(`Student with ID ${studentID} not found.`);
      }

    } else if (action === 'approveAll') {
      const { studentIDs } = requestData;
      if (!studentIDs || studentIDs.length === 0) {
        throw new Error('No student IDs provided to approve.');
      }
      studentIDs.forEach(id => {
        // สำหรับ Approve All จะไม่มี comment
        updateStudentStatus(id, 'Approve', ''); 
      });

    } else {
      throw new Error('Invalid action specified.');
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({ success: true, message: "Update successful" }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, message: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}


/**
 * ฟังก์ชันสำหรับค้นหาแถวและอัปเดตข้อมูลนักเรียน
 * @param {string} studentID - ID ของนักเรียนที่ต้องการอัปเดต
 * @param {string} status - สถานะ (Approve/Disapprove)
 * @param {string} comment - ความคิดเห็น
 * @returns {boolean} - คืนค่า true หากอัปเดตสำเร็จ, false หากไม่พบนักเรียน
 */
function updateStudentStatus(studentID, status, comment) {
    const idColumnValues = sheet.getRange(1, ID_COL, sheet.getLastRow(), 1).getValues();
    let rowIndex = -1;

    for (let i = 0; i < idColumnValues.length; i++) {
        if (String(idColumnValues[i][0]).trim() === String(studentID).trim()) {
            rowIndex = i + 1; // rowIndex ใน Google Sheet เริ่มที่ 1
            break;
        }
    }

    if (rowIndex !== -1) {
        // อัปเดตคอลัมน์ N (Comment) และ O (Status)
        sheet.getRange(rowIndex, COMMENT_COL).setValue(comment);
        sheet.getRange(rowIndex, STATUS_COL).setValue(status);
        return true;
    }

    return false; // ไม่พบ ID
}