import * as XLSX from "xlsx";

export interface StudentData {
  digitalId: string;
  name: string;
  class: string;
  parentEmail: string;
}

export function parseExcelFile(file: File): Promise<StudentData[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet);

        const students: StudentData[] = jsonData.map((row: any) => ({
          digitalId: row["Digital ID"] || row["digitalId"] || row["DigitalID"] || "",
          name: row["Student Name"] || row["name"] || row["Name"] || "",
          class: row["Class"] || row["class"] || row["Grade"] || "",
          parentEmail: row["Parent Email"] || row["parentEmail"] || row["ParentEmail"] || "",
        })).filter(student => 
          student.digitalId && 
          student.name && 
          student.class && 
          student.parentEmail
        );

        resolve(students);
      } catch (error) {
        reject(new Error("Failed to parse Excel file"));
      }
    };

    reader.onerror = () => {
      reject(new Error("Failed to read file"));
    };

    reader.readAsBinaryString(file);
  });
}
