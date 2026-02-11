import multer from 'multer';

function createStorage(folderPath){
    return multer.diskStorage({
        destination(req, file, cb) {
            cb(null, folderPath)
        },
        filename(req, file, cb) {
            const uniqueFileName = Date.now() + '-' + file.originalname;
            cb(null, uniqueFileName)
        }
    })
}

export const uploadOrigionalImage = multer({ storage: createStorage('uploads/originals') });
export const uploadSteggedImage = multer({ storage: createStorage('uploads/stegged') });
export const uploadAnalysis= multer({ storage: createStorage('uploads/analysis') });
export const uploadReports = multer({ storage: createStorage('uploads/reports') });
