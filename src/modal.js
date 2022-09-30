const saveSettings = document.getElementById('saveSettings');

document.getElementById('myModal').addEventListener('shown.bs.modal', function () {
    orientationSelection.value = localStorage.getItem('orientation') || ''
    formatSelection.value = localStorage.getItem('format') || ''
})

saveSettings.addEventListener('click', evt => {
    const yn = confirm('Are you sure about the values inputted?')
    if (yn) {
        localStorage.setItem('shouldEncrypt', shouldEncrypt)
        localStorage.setItem('encryptionPassword', encryptionPassword.value)
        if (!shouldEncrypt) {
            localStorage.removeItem('encryptionPassword');
            encryptionPassword.value = ""
        }
        localStorage.setItem('orientation', orientationSelection.value)
        localStorage.setItem('format', formatSelection.value)
    } 

    document.getElementById('closeSettings').click()
})