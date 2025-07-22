const SHEET_ID = "18pVNW1_3wYdUaOJSJkwPA0MF2h4jaUVJFNQvfHfICoY";
const SHEET_NAME = "Sheet1";

// ฟังก์ชันนี้สำคัญมากสำหรับ Cross-Origin Resource Sharing (CORS)
function doOptions(e) {
  return ContentService.createTextOutput()
    .setHeader('Access-Control-Allow-Origin', '*')
    .setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
    .setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

// ฟังก์ชัน doPost ที่แก้ไขแล้ว
function doPost(e) {
  try {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
    
    // แปลงข้อมูลที่ส่งมาเป็น JSON
    const postData = JSON.parse(e.postData.contents);
    const studentID = postData.studentID;
    const newStatus = postData.status;
    const comment = postData.comment;

    // อ่านข้อมูลทั้งหมดในชีตเพื่อค้นหาแถวที่ถูกต้อง
    const data = sheet.getDataRange().getValues();
    const headers = data.shift(); // นำแถว header ออกมา
    
    // หาตำแหน่งคอลัมน์ "ID", "Status", และ "Comments"
    const idColIndex = headers.indexOf("ID");
    const statusColIndex = headers.indexOf("Status"); // คอลัมน์ O ควรมี header ชื่อ "Status"
    const commentColIndex = headers.indexOf("Comments");

    if (idColIndex === -1 || statusColIndex === -1) {
        throw new Error("Cannot find required columns 'ID' or 'Status' in the sheet.");
    }
    
    let studentFound = false;
    // วนลูปเพื่อหา studentID ที่ตรงกัน (เริ่มจากแถวที่ 2 เพราะเรา shift header ไปแล้ว)
    for (let i = 0; i < data.length; i++) {
      if (data[i][idColIndex].toString() === studentID) {
        const rowIndex = i + 2; // +2 เพราะ index ของ array เริ่มที่ 0 และมีแถว header
        
        // อัปเดตข้อมูลในคอลัมน์ Status (คอลัมน์ O)
        sheet.getRange(rowIndex, statusColIndex + 1).setValue(newStatus);
        
        // อัปเดตข้อมูลในคอลัมน์ Comments (ถ้ามี)
        if (commentColIndex > -1) {
          sheet.getRange(rowIndex, commentColIndex + 1).setValue(comment);
        }
        
        studentFound = true;
        break; // ออกจากลูปเมื่อเจอข้อมูล
      }
    }

    if (!studentFound) {
      throw new Error(`Student with ID ${studentID} not found.`);
    }

    // ส่งการตอบกลับว่าสำเร็จ
    return ContentService.createTextOutput(JSON.stringify({ success: true, message: `Student ${studentID} updated successfully.` }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeader('Access-Control-Allow-Origin', '*');

  } catch (error) {
    // ส่งการตอบกลับเมื่อเกิดข้อผิดพลาด
    return ContentService.createTextOutput(JSON.stringify({ success: false, message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeader('Access-Control-Allow-Origin', '*');
  }
}