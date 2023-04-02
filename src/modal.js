const saveSettings = document.getElementById('saveSettings');
const feedback = document.getElementById('feedback-pw');

document.getElementById('myModal').addEventListener('shown.bs.modal', function () {
    orientationSelection.value = localStorage.getItem('orientation') || ''
    formatSelection.value = localStorage.getItem('format') || ''
})

saveSettings.addEventListener('click', evt => {
    inputValidation()
    const yn = confirm('Are you sure about the values inputted?')
    if (encryptionPassword.value != sanitizePassword(encryptionPassword.value)) {
        encryptionPassword.value = ""
        feedback.innerText = 'Your password contains invalid characters.'

        var forms = document.querySelectorAll('.needs-validation')
        forms.forEach(form => form.classList.add('was-validated'))
        inputValidation()
        return
    }

    if (yn) {
        localStorage.setItem('shouldEncrypt', shouldEncrypt)

        // localStorage.setItem('encryptionPassword', encryptionPassword.value)
        if (!shouldEncrypt) {
            localStorage.removeItem('encryptionPassword');
            encryptionPassword.value = ""
        }
        localStorage.setItem('orientation', orientationSelection.value)
        localStorage.setItem('format', formatSelection.value)
    } 

    document.getElementById('closeSettings').click()
})

/**
 * Sanitizing password
 * @param {*} password 
 * @returns 
 */
function sanitizePassword(password) {
    // Trim leading and trailing white space
    password = password.trim();
  
    // Remove any HTML or JavaScript tags
    password = password.replace(/<[^>]*>/g, "");
  
    // Replace any non-alphanumeric characters with underscores
    password = password.replace(/[^a-zA-Z0-9]/g, "_");
  
    // Return the sanitized password
    return password;
}

function inputValidation () {
    'use strict'

    // Fetch all the forms we want to apply custom Bootstrap validation styles to
    var forms = document.querySelectorAll('.needs-validation')

    // Loop over them and prevent submission
    Array.prototype.slice.call(forms)
    .forEach(function (form) {
        form.addEventListener('submit', function (event) {
        if (!form.checkValidity()) {
            event.preventDefault()
            event.stopPropagation()
        }

        form.classList.add('was-validated')
        }, false)
    })
}