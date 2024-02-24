const { exec } = require('child_process');

const pythonFile = 'a.py'; // Thay đổi đường dẫn này đến tệp Python của bạn

exec(`python ${pythonFile}`, (error, stdout, stderr) => {
    if (error) {
        console.error(`Lỗi: ${error}`);
        return;
    }

    // Xử lý kết quả trả về từ Python
    console.log('Kết quả từ Python:', stdout);

    if (stderr) {
        console.error(`Lỗi tiêu chuẩn: ${stderr}`);
    }
});