// Loaded via <script> tag, create shortcut to access PDF.js exports.
const pdfjsLib = window["pdfjs-dist/build/pdf"];
const images = []
const linkHref = document.getElementById('img-link')
const pdfx = document.getElementById('pdf');
const canvasContainer = document.getElementById('canvas-container')
const progressBar = document.getElementById('progress');
const clearBtn = document.getElementById('clear');

function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const getPercentageOfCompletion = (current, total) => parseFloat((parseFloat(current) / parseFloat(total)) * 100).toFixed(2)

linkHref.onclick = evt => {
    const downloadSize = images.length
    const yn = confirm(`You are downloading ${downloadSize}, click okay to download.`)
    console.log(yn)
}

pdfx.onclick = evt => clear(true);

// Process
pdfx.onchange = function (ev) {

    const file = pdfx.files[0]
    const reader = new FileReader()
    reader.readAsArrayBuffer(file)

    reader.onload = () => {

        const loadingTask = pdfjsLib.getDocument(reader.result)

        canvasContainer.innerText = ''
        canvasContainer.style.overflowY = canvasContainer.style.overflowX = 'scroll'

        linkHref.removeAttribute('disabled')
        linkHref.innerText = "Please wait.."

        loadingTask.promise.then(
            async pdf => {
                for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
                    // Fetch the first page
                    await pdf.getPage(pageNumber).then(async page => {
                        console.log(page)
                        console.log(`Page ${pageNumber} loaded`);

                        let scale = 0.8;
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
                            const lnk = document.createElement('a')
                            lnk.href = canvas.toDataURL('image/jpeg')
                            lnk.download =`${file.name.split('.')[0]}-${pageNumber}.jpg`
                            images.push(lnk)
                        });

                        canvasContainer.appendChild(canvas)
                        progressBar.style.width = `${getPercentageOfCompletion(pageNumber, pdf.numPages)}%`
                    });


                }

                linkHref.innerText = `${images.length} image converted, Click here to download.`
                linkHref.className = 'btn btn-sm btn-success'
                clearBtn.classList.remove('visually-hidden')
            },
            reason => {
                // PDF loading error
                clear()
                alert(`Loading Error: Either the pdf selected is corrupted or invalid.`);
            }
        )
    }
}


clearBtn.addEventListener('click', clear)

function clear(evt) {
    canvasContainer.innerHTML = ''
    canvasContainer.style.overflow = canvasContainer.style.overflow = 'hidden'
    progressBar.style.width = '0%'
    pdfx.value = ''
    clearBtn.classList.add('visually-hidden')
    canvasContainer.innerText = 'No loaded pdf.'
    linkHref.setAttribute('disabled', true)
    linkHref.innerText = 'No loaded pdf.'
}