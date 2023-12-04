

// //////////////////////////////////////////////////////////////////////////
const Excel = require('exceljs');
const axios = require('axios');
const cors = require('cors');
// const fs = require('fs');
const path = require('path');
const _ = require('lodash');

const excelFileName = 'file.xlsx';
const DefaultLink = '//192.168.1.240/design/A Design';
const express = require('express');
const multer = require('multer');
const app = express();
const fs = require('fs-extra');
const port = 3008;
app.use(cors()); // Sử dụng CORS middleware



/////////////////////////////drive
const readline = require('readline');
const { google } = require('googleapis');
const SCOPES = ['https://www.googleapis.com/auth/drive'];
const TOKEN_PATH = 'token.json';


////////////////////////////drive
const upload = multer({ dest: 'uploads/' });
async function getImageExtensionFromUrl(url) {
    const parts = url.split('.');
    return parts[parts.length - 1];
}

async function downloadImage(link, name, downloadDirectory) {
    function authorize(credentials, callback, idDrive, downloadDirectory, name) {
        const { client_secret, client_id, redirect_uris } = credentials.installed;
        const oAuth2Client = new google.auth.OAuth2(
            client_id, client_secret, redirect_uris[0]);
        fs.readFile(TOKEN_PATH, (err, token) => {
            if (err) return getAccessToken(oAuth2Client, callback);
            oAuth2Client.setCredentials(JSON.parse(token));
            // callback(oAuth2Client);//list files and upload file
            callback(oAuth2Client, idDrive, downloadDirectory, name);//get file

        });
    }
    function getAccessToken(oAuth2Client, callback) {
        const authUrl = oAuth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: SCOPES,
        });
        console.log('Authorize this app by visiting this url:', authUrl);
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });
        rl.question('Enter the code from that page here: ', (code) => {
            rl.close();
            oAuth2Client.getToken(code, (err, token) => {
                if (err) return console.error('Error retrieving access token', err);
                oAuth2Client.setCredentials(token);
                // Store the token to disk for later program executions
                fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
                    if (err) return console.error("line 66",err);
                    // console.log('Token stored to', TOKEN_PATH);
                });
                callback(oAuth2Client);
            });
        });
    }

    function getFile(auth, fileId, downloadDirectory, name) {
        const drive = google.drive({ version: 'v3', auth });
        drive.files.get({ fileId: fileId, fields: '*' }, (err, res) => {

            async function downloadImageDrive(link, nameDrive, downloadDirectory, name) {
                try {
                    const response = await axios.get(link, { responseType: 'stream' });

                    var imageExtension = nameDrive.split(".");
                    imageExtension = imageExtension[imageExtension.length - 1]
                    const imageName = `${name}.${imageExtension}`;

                    const imagePath = path.join(downloadDirectory, imageName);

                    const writer = fs.createWriteStream(imagePath);
                    response.data.pipe(writer);

                    await new Promise((resolve, reject) => {
                        writer.on('finish', resolve);
                        writer.on('error', reject);
                    });


                } catch (error) {
                    console.error("errr.......", error.message);

                }
            }
            if (err) return console.log('The API returned an error: ' + err);
            // console.log(res.data.name);
            // console.log(res.data.webContentLink);

            downloadImageDrive(res.data.webContentLink, res.data.name, downloadDirectory, name)
        });
    }
    const regex = /drive\.google/;
    if (regex.test(link)) {


        const regex2 = /\/uc\?id=([\w-]+)/;
        const match = link.match(regex2);

        if (match) {
            const driveId = match[1];
            fs.readFile('credentials.json', (err, content) => {
                if (err) return console.log('Error loading client secret file:', err);
                authorize(JSON.parse(content), getFile, driveId, downloadDirectory, name);
            });
        } else {


            const regexLink2 = /\/file\/d\/([a-zA-Z0-9_-]+)\//;
            const matchLink2 = link.match(regexLink2);

            if (matchLink2) {
                const driveIdLink2 = matchLink2[1];
                fs.readFile('credentials.json', (err, content) => {
                    if (err) return console.log('Error loading client secret file:', err);
                    authorize(JSON.parse(content), getFile, driveIdLink2, downloadDirectory, name);
                });
            } else {
                console.log("Không tìm thấy Google Drive ID trong URL.");
            }

        }




    } else {
        try {
            const response = await axios.get(link, { responseType: 'stream' });

            var imageExtension = await getImageExtensionFromUrl(link);
            var duoi = imageExtension;
            duoi = duoi.split("?");
            if (duoi.length > 1) imageExtension = duoi[0]

            const imageName = `${name}.${imageExtension}`;

            const imagePath = path.join(downloadDirectory, imageName);

            const writer = fs.createWriteStream(imagePath);
            response.data.pipe(writer);

            await new Promise((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
            });


        } catch (error) {
            console.error("errr.......", error.message);

        }
    }

}


async function readExcelAndDownloadImages(GLLM, sheet, NameFolder) {
    try {
        const workbook = new Excel.Workbook();
        await workbook.xlsx.readFile(excelFileName);

        const worksheet = sheet;

        var downloadDirectory = DefaultLink + "/" + NameFolder


        if (!fs.existsSync(downloadDirectory)) {
            fs.mkdirSync(downloadDirectory);
        }

        for (let rowNumber = 3; rowNumber <= worksheet.rowCount; rowNumber++) {
            const row = worksheet.getRow(rowNumber);
            const name = row.getCell('C').value; // Lấy giá trị từ cột  // ten file

            const link = row.getCell('I').value; // Lấy giá trị từ cột // url
            const product = row.getCell('F').value; // Lấy giá trị từ cột// product
            const variant = row.getCell('E').value; // Lấy giá trị từ cột// variant
            var ThoiGian = row.getCell('J').value; // ngay
            
            let sccccc = GLLM.filter(itemGllm => _.intersection(itemGllm.ProductType, [product.toLowerCase().trim().replace(/ /g, '')]).length !== 0)
                .filter(itemx => _.intersection(itemx.variant, [variant.toLowerCase().trim().replace(/ /g, '')]).length !== 0)

            ThoiGian = ThoiGian.split(" ");
            ThoiGian = ThoiGian[0];
            ThoiGian = ThoiGian.split("-");
            if (sccccc[0].amountFile === "1") {

                // Kiểm tra xem tệp có tồn tại trong thư mục máy chủ không
                const imagePath = path.join('//192.168.1.230/production', ThoiGian[0], ThoiGian[1], ThoiGian[2], product, `${name}.png`);
                const imagePath2 = path.join('//192.168.1.230/production', ThoiGian[0], ThoiGian[1], ThoiGian[2], product, `${name}.jpg`);

                let linkSplit;
                if (typeof (link) !== "object")
                    linkSplit = link.split(";")[0].replace(/www\.dropbox\.com/g, 'dl.dropboxusercontent.com')
                else linkSplit = link.text.replace(/www\.dropbox\.com/g, 'dl.dropboxusercontent.com');




                if (fs.existsSync(imagePath)) {
                    const fileStream = fs.createReadStream(imagePath);
                    fileStream.pipe(fs.createWriteStream(path.join(downloadDirectory, `${name}.png`)));
                    console.log(`ip---- ${name}.png `);

                }
                else if (fs.existsSync(imagePath2)) {
                    const fileStream = fs.createReadStream(imagePath2);
                    fileStream.pipe(fs.createWriteStream(path.join(downloadDirectory, `${name}.jpg`)));
                    console.log(`ip---- ${name}.jpg `);

                }
                else {

                    await downloadImage(linkSplit, name, downloadDirectory);
                    console.log(`link---- ${name} `);

                }

            }
            else if (sccccc[0].amountFile === "2") {

                let linkSplit;
                if (typeof (link) !== "object")
                    linkSplit = link.replace(/www\.dropbox\.com/g, 'dl.dropboxusercontent.com').split(";");
                else linkSplit = link.text.replace(/www\.dropbox\.com/g, 'dl.dropboxusercontent.com').split(";");

                const imagePathF = path.join('//192.168.1.230/production', ThoiGian[0], ThoiGian[1], ThoiGian[2], product, `${name} front.png`);
                const imagePathB = path.join('//192.168.1.230/production', ThoiGian[0], ThoiGian[1], ThoiGian[2], product, `${name} back.png`);
                if (fs.existsSync(imagePathF)) {
                    const fileStream = fs.createReadStream(imagePathF);
                    fileStream.pipe(fs.createWriteStream(path.join(downloadDirectory, `${name} front.png`)));
                    console.log(`ip---- ${name} front.png `);

                } else {


                    await downloadImage(linkSplit[0], name + " front", downloadDirectory);


                    console.log(`link---- ${name} front `);

                }
                if (fs.existsSync(imagePathB)) {
                    const fileStream = fs.createReadStream(imagePathB);
                    fileStream.pipe(fs.createWriteStream(path.join(downloadDirectory, `${name} back.png`)));
                    console.log(`ip---- ${name} back.png `);

                } else {
                    let linkSplit = link.split(";")
                    await downloadImage(linkSplit[1], name + " back", downloadDirectory);
                    console.log(`link---- ${name} back `);

                }

            }

        }
    } catch (err) {
        console.error('Error reading Excel file:', err);
    }
}

app.post('/upload', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }
    const NameFolder = JSON.parse(req.body.NameFolder);

    try {
        const workbook = new Excel.Workbook();
        await workbook.xlsx.readFile(req.file.path);

        const worksheet = workbook.getWorksheet(1);
        

        // const url = "https://sheetdb.io/api/v1/mobao5qvh19ze";
        const url = 'https://sheet.best/api/sheets/0c6ecbff-1ea5-4717-998c-546dd52034cb';
        const response = await axios.get(url);
        const GLLM = response.data.map(item => {
            let item2 = item;
            item2.ProductType = item2.ProductType.toLowerCase().trim().replace(/ /g, '').split(",");
            item2.variant = item2.variant.toLowerCase().trim().replace(/ /g, '').split(",");
            return item2;
        });

        // Xử lý tải ảnh và đợi cho đến khi tất cả hoàn thành
        await readExcelAndDownloadImages(GLLM, worksheet, NameFolder);

        // Sau khi tải xong, gửi phản hồi về cho client
        const data = worksheet.getSheetValues();
        res.status(200).json({ data: data });
    } catch (error) {
        res.status(500).send('Error processing file.');
    }
});




app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});




