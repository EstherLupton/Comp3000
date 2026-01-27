import mutler from 'multer';

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

export const uploadOrigionalImage = mutler({ storage: createStorage('uploads/originals') });
export const uploadSteggedImage = mutler({ storage: createStorage('uploads/stegged') });
export const uploadAnalysis= mutler({ storage: createStorage('uploads/analysis') });
export const uploadReports = mutler({ storage: createStorage('uploads/reports') });

