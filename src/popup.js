// Loaded via <script> tag, create shortcut to access PDF.js exports.
const pdfjsLib = window["pdfjs-dist/build/pdf"];
let images = [], downloadables = []
const linkHref = document.getElementById('img-link')
const pdfx = document.getElementById('pdf');
const canvasContainer = document.getElementById('canvas-container')
const progressBar = document.getElementById('progress');
const progressBarDownload = document.getElementById('progress-download');
const clearBtn = document.getElementById('clear');
const toggle = document.getElementById('converterSwitch')
const toggleTitle = document.getElementById('convertOptTitle')
const imgtopdfsettings = document.getElementById('imgtopdfsettings');

const orientationSelection = document.getElementById('select-orientation')
const formatSelection = document.getElementById('select-format')
const encryptionPassword = document.getElementById('encryptionPassword')
const encryptCheckbox = document.getElementById('encrypt')

let shouldEncrypt = false
let isToggledToImgToPdf = false

// Toggle
toggle.onchange = evt => {
    isToggledToImgToPdf = evt.target.checked
    
    clear()

    encryptCheckbox.checked = localStorage.getItem('shouldEncrypt') == 'true' ? true : false
    // encryptionPassword.value = localStorage.getItem('encryptionPassword') || ''
    if (encryptCheckbox.checked) {
        encryptionPassword.removeAttribute('disabled')
        encryptionPassword.setAttribute('required', true)
    }
    else encryptionPassword.setAttribute('disabled', true)

    if (isToggledToImgToPdf) {
        pdfx.setAttribute('accept', 'image/png, image/jpeg');
        document.getElementById('navbar-title').innerText = "Image/PDF Converter"
        toggleTitle.innerText = "Switch to PDF/Image"
        canvasContainer.innerText = 'No loaded image.'
        linkHref.innerText = 'No loaded image.'

        document.getElementById('imgtopdfsettings').style = ''
        document.getElementById('pdfpwsettings').style = 'display:none;'
    } else {
        pdfx.setAttribute('accept', 'application/pdf');
        document.getElementById('navbar-title').innerText = "PDF/Image Converter"
        toggleTitle.innerText = "Switch to Image/PDF"
        canvasContainer.innerText = 'No loaded pdf.'
        linkHref.innerText = 'No loaded pdf.'

        document.getElementById('imgtopdfsettings').style = 'display:none;'
        document.getElementById('pdfpwsettings').style = ''
    }

    imgtopdfsettings.style.display = isToggledToImgToPdf ? '' : 'none'
}


encryptCheckbox.onchange = evt => {
    shouldEncrypt = evt.target.checked
    localStorage.setItem('shouldEncrypt', shouldEncrypt)
    if (shouldEncrypt) encryptionPassword.removeAttribute('disabled') 
    else {
        encryptionPassword.setAttribute('disabled', true)
    }
}


function showModal (id) {
    let myModal = new bootstrap.Modal(`#${id}`);
    myModal.show();
}

function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const getPercentageOfCompletion = (current, total) => parseFloat((parseFloat(current) / parseFloat(total)) * 100).toFixed(2)

/**
 * Confirming download as zip.
 * @param {*} evt 
 * @returns 
 */
linkHref.onclick = evt => {
    const downloadSize = images.length
    let zipFileName = ""
    const yn = confirm(`You are downloading ${downloadSize} file(s), click okay to proceed.`)
    if (yn) {
        if (images.length < 1) {
            console.error('Nothing to download.')
            return
        }

        const zip = new JSZip();

        for (let i = 0; i < images.length; i++) {
            try {
                const imgSrc = images[i]

                zip.file(imgSrc.fileName, imgSrc.blob)

                zipFileName = imgSrc.mainFileName

                // saveAs(blob, imgUrl.fileName)

                progressBarDownload.style.width = `${getPercentageOfCompletion((i + 1), images.length)}%`
            } catch (e) {
                console.error(e)
            }
        }

        zip.generateAsync({ type: "blob" }).then(blob => saveAs(blob, zipFileName), console.error)
    }
}

pdfx.onclick = evt => clear(true);
pdfx.onchange = function (ev) {

    const file = pdfx.files[0]
    const reader = new FileReader()
    
    reader.readAsDataURL(file)

    reader.onload = function () {
        if (!isToggledToImgToPdf) {
            pdfToImg(reader, file);
        } else {
            imgToPdf(reader, file)
        }
    }
}


clearBtn.addEventListener('click', clear)

/**
 * Clear inputs
 * @param {*} evt 
 */
function clear(evt) {
    canvasContainer.style.overflow = canvasContainer.style.overflow = 'hidden'
    progressBar.style.width = '0%'
    pdfx.value = ''
    clearBtn.classList.add('visually-hidden')
    canvasContainer.innerText = isToggledToImgToPdf ? 'No loaded image.' : 'No loaded pdf.'
    linkHref.innerText = isToggledToImgToPdf ? 'No loaded image.' : 'No loaded pdf.'
    linkHref.setAttribute('disabled', true)
    images = []
}

/**
 * IMAGE to PDF Converter
 * @param {*} reader 
 * @param {*} file 
 */
const imgToPdf = (reader, file) => {
    let options = {
        orientation: orientationSelection.value,
        unit: "mm",
        format: formatSelection.value
    }
   
    if (shouldEncrypt) {
        options.encryption = {
            userPassword: encryptionPassword.value,
            ownerPassword: encryptionPassword.value,
            userPermissions: ["print", "modify", "copy", "annot-forms"]
        }
    }

    let doc = new window.jspdf.jsPDF(options);
    const imgTypes = {
        'image/png': 'PNG',
        'image/jpeg': 'JPEG'
    }

    let width = doc.internal.pageSize.getWidth();
    let height = doc.internal.pageSize.getHeight();

    // validation of base64
    const isValid = isValidBase64(reader.result)
    if (!isValid) {
        alert("Catch some invalid base64 in your file. Please report this file to security team (@InformationSecurity@medicardphils.com)")
    }

    doc.addImage(reader.result, imgTypes[file.type], 0, 0, width, height);

    loadToCanvas(doc.output('datauristring'), () => {
        canvasContainer.innerText = ''
        canvasContainer.style.overflowY = canvasContainer.style.overflowX = 'scroll'
    
        linkHref.removeAttribute('disabled')
        linkHref.innerText = "Please wait.."
    }, () => {
        const jData = { fileName: `${file.name.split('.')[0]}.pdf`, mainFileName: file.name.split('.')[0] }

        jData.blob = doc.output('blob')

        images.push(jData)
    }, () => {
        linkHref.innerText = `${images.length} file converted, Click here to download.`
        linkHref.className = 'btn btn-sm btn-success'
        clearBtn.classList.remove('visually-hidden')
    }, encryptionPassword.value)
}


/**
 * PDF to IMAGE Converter
 * @param {*} reader 
 * @param {*} file 
 */
function pdfToImg(reader, file) {
    const password = document.getElementById('pdfpassword').value
    const isValid = isValidBase64(reader.result)
    if (!isValid) {
        alert("Catch some invalid base64 in your file. Please report this file to security team (@InformationSecurity@medicardphils.com)")
    }

    loadToCanvas(reader.result, () => {
        canvasContainer.innerText = ''
        canvasContainer.style.overflowY = canvasContainer.style.overflowX = 'scroll'
    
        linkHref.removeAttribute('disabled')
        linkHref.innerText = "Please wait.."
    }, ({ canvas, pageNumber }) => {
        const jData = { fileName: `${file.name.split('.')[0]}-page-${pageNumber}.jpg`, mainFileName: file.name.split('.')[0] }

        jData.blob = convertToBlob(canvas.toDataURL("image/jpeg").split(';base64,')[1], 'image/jpeg')

        images.push(jData)
    }, () => {
        linkHref.innerText = `${images.length} file converted, Click here to download.`
        linkHref.className = 'btn btn-sm btn-success'
        clearBtn.classList.remove('visually-hidden')
    }, password)
}

/**
 * Loading to canvas
 * @param {*} uristring 
 * @param {*} preCallback 
 * @param {*} onProcessCallback 
 * @param {*} postCallback 
 * @param {*} password 
 */
function loadToCanvas(uristring, preCallback = () => {}, onProcessCallback = () => {}, postCallback = () => {}, password = undefined) {
    const loadingTask = pdfjsLib.getDocument({ url: uristring, password: password })

    preCallback()
    loadingTask.promise.then(async pdf => {
        for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
            await pdf.getPage(pageNumber).then(async page => {
                let scale = 1.5;
                let viewport = page.getViewport({ scale: scale });

                // Prepare canvas using PDF page dimensions
                let canvas = document.createElement("canvas");
                let context = canvas.getContext("2d");
                
                canvas.width = viewport.width
                canvas.height = viewport.height;


                let renderContext = {
                    canvasContext: context,
                    viewport: viewport
                }

                let renderTask = page.render(renderContext);

                await renderTask.promise.then(() => {
                    onProcessCallback({
                        canvas, pageNumber
                    })
                });

                canvasContainer.appendChild(canvas)
                progressBar.style.width = `${getPercentageOfCompletion((pageNumber + 1), pdf.numPages)}%`
            });
        }

        postCallback()
    },
    reason => {
        // PDF loading error
        clear()
        alert(`Loading Error: ${reason ? reason : 'Either the pdf selected is corrupted or invalid.'}`);
    })

}

/**
 * Converting to blob
 * @param {*} uriString 
 * @param {*} type 
 * @returns 
 */
function convertToBlob(uriString, type) {
    const byteCharacters = atob(uriString)
    const byteNumbers = new Array(byteCharacters.length)

    for (let i = 0; i < byteCharacters.length; i++) byteNumbers[i] = byteCharacters.charCodeAt(i)
    
    const byteArray = new Uint8Array(byteNumbers)

    const blob = new Blob([byteArray], {type: type })
    return blob
}

/**
 * Validating base64 string
 * @param {*} str 
 * @returns 
 */
function isValidBase64(str) {
    // Check the length of the string
    if (str.length % 4 !== 0) {
      return false;
    }
  
    // Check the characters in the string
    if (/[^A-Za-z0-9+/=]/.test(str)) {
      return false;
    }
  
    // Check the number of padding characters at the end of the string
    let paddingCount = 0;
    for (let i = str.length - 1; str[i] === "="; i--) {
      paddingCount++;
    }
    if (paddingCount > 2) {
      return false;
    }
  
    // The string is a valid Base64 encoded string
    return true;
}
