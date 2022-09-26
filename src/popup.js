// Loaded via <script> tag, create shortcut to access PDF.js exports.
const pdfjsLib = window["pdfjs-dist/build/pdf"];
let images = []
const linkHref = document.getElementById('img-link')
const pdfx = document.getElementById('pdf');
const canvasContainer = document.getElementById('canvas-container')
const progressBar = document.getElementById('progress');
const progressBarDownload = document.getElementById('progress-download');
const clearBtn = document.getElementById('clear');
const toggle = document.getElementById('converterSwitch')
let isToggledToImgToPdf = false

// Toggle
toggle.onchange = evt => {
    isToggledToImgToPdf = evt.target.checked
    clear()
    if (isToggledToImgToPdf) {
        pdfx.setAttribute('accept', 'image/png, image/jpeg');
        document.getElementById('navbar-title').innerText = "Medicard - Image to PDF Converter"

        canvasContainer.innerText = 'No loaded image.'
        linkHref.innerText = 'No loaded image.'
    } else {
        pdfx.setAttribute('accept', 'application/pdf');
        document.getElementById('navbar-title').innerText = "Medicard - PDF to Image Converter"

        canvasContainer.innerText = 'No loaded pdf.'
        linkHref.innerText = 'No loaded pdf.'
    }

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
                const imgUrl = JSON.parse(images[i])
                if (imgUrl == undefined) {
                    console.error("No data found in storage.")
                    continue
                }

                const byteCharacters = atob(imgUrl.base64)
                const byteNumbers = new Array(byteCharacters.length)

                for (let i = 0; i < byteCharacters.length; i++) byteNumbers[i] = byteCharacters.charCodeAt(i)
                
                const byteArray = new Uint8Array(byteNumbers)

                const blob = new Blob([byteArray], {type: imgUrl.type })

                console.log(imgUrl.fileName)
                zip.file(imgUrl.fileName, blob)

                zipFileName = imgUrl.mainFileName

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
    
    if (!isToggledToImgToPdf) {
        reader.readAsArrayBuffer(file)
    } else {
        reader.readAsDataURL(file)
    }

    reader.onload = function () {
        if (!isToggledToImgToPdf) {
            pdfToImg(reader, file);
        } else {
            imgToPdf(reader, file)
        }
    }
}


clearBtn.addEventListener('click', clear)

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
    let doc = new window.jspdf.jsPDF('l', 'mm', 'a4');
    const imgTypes = {
        'image/png': 'PNG',
        'image/jpeg': 'JPEG'
    }

    let width = doc.internal.pageSize.getWidth();
    let height = doc.internal.pageSize.getHeight();
    doc.addImage(reader.result, imgTypes[file.type], 0, 0, width, height);

    loadToCanvas(doc.output('datauristring'), () => {
        canvasContainer.innerText = ''
        canvasContainer.style.overflowY = canvasContainer.style.overflowX = 'scroll'
    
        linkHref.removeAttribute('disabled')
        linkHref.innerText = "Please wait.."
    }, () => {
        const jData = JSON.stringify({ base64: doc.output('dataurlstring').split(';base64,')[1], fileName: `${file.name.split('.')[0]}.pdf`, mainFileName: file.name.split('.')[0], type: 'application/pdf' }),
        fileName = `${file.name.split('.')[0]}.pdf`;

        images.push(jData)
    }, () => {
        linkHref.innerText = `${images.length} file converted, Click here to download.`
        linkHref.className = 'btn btn-sm btn-success'
        clearBtn.classList.remove('visually-hidden')
    })
}


/**
 * PDF to IMAGE Converter
 * @param {*} reader 
 * @param {*} file 
 */
function pdfToImg(reader, file) {
    loadToCanvas(reader.result, () => {
        canvasContainer.innerText = ''
        canvasContainer.style.overflowY = canvasContainer.style.overflowX = 'scroll'
    
        linkHref.removeAttribute('disabled')
        linkHref.innerText = "Please wait.."
    }, ({ canvas, pageNumber }) => {
        console.log(canvas.toDataURL("image/jpeg").split(';base64,'))
        const jData = JSON.stringify({ base64: canvas.toDataURL("image/jpeg").split(';base64,')[1], fileName: `${file.name.split('.')[0]}-page-${pageNumber}.jpg`, mainFileName: file.name.split('.')[0], type: 'image/jpeg' }),
        fileName = `${file.name.split('.')[0]}-page-${pageNumber}.jpg`;

        images.push(jData)
    }, () => {
        linkHref.innerText = `${images.length} file converted, Click here to download.`
        linkHref.className = 'btn btn-sm btn-success'
        clearBtn.classList.remove('visually-hidden')
    })
}

function loadToCanvas(uristring, preCallback = () => {}, onProcessCallback = () => {}, postCallback = () => {}) {
    const loadingTask = pdfjsLib.getDocument(uristring)

    preCallback()
    loadingTask.promise.then(async pdf => {
        for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
            await pdf.getPage(pageNumber).then(async page => {
                console.log(`Page ${pageNumber} loaded`);

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
        alert(`Loading Error: Either the pdf selected is corrupted or invalid.`);
    })

}