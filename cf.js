const fs = require('fs');
const path = require('path');

function copyFolderSync(from, to) {
    fs.mkdirSync(to, { recursive: true });

    fs.readdirSync(from).forEach(element => {
        const fromPath = path.join(from, element);
        const toPath = path.join(to, element);

        // Bỏ qua thư mục "file tool"
        if (element === 'file tool') {
            return;
        }

        if (fs.lstatSync(fromPath).isFile()) {
            fs.copyFileSync(fromPath, toPath);
        } else {
            copyFolderSync(fromPath, toPath);
        }
    });
}

// Đường dẫn tới thư mục A và B
const folderA = '\\\\192.168.1.240\\in\\ts cf';
const folderB = '\\\\192.168.1.230\\in';

// Lấy tên của thư mục A
const folderAName = path.basename(folderA);

// Tạo đường dẫn đích với cùng tên
const destinationFolder = path.join(folderB, folderAName);

// Sao chép nội dung từ thư mục A sang thư mục đích mới, bỏ qua thư mục "file tool"
copyFolderSync(folderA, destinationFolder);

console.log(`Đã sao chép nội dung từ thư mục ${folderA} sang thư mục ${destinationFolder}, bỏ qua thư mục "file tool"`);
