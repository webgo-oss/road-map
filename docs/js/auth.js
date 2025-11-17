
        function togglePasswordVisibility(iconElement) {
            const passwordInput = iconElement.previousElementSibling;
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                iconElement.innerHTML ='<i class="bi bi-eye-slash"></i>';
            } else {
                passwordInput.type = 'password';
                iconElement.innerHTML='<i class="bi bi-eye"></i>';
            }
        }

        function toggleFormState(view) {
            const formTitle = document.getElementById('form-title');
            const formSubtitle = document.getElementById('form-subtitle');
            const registerView = document.getElementById('register-view');
            const loginView = document.getElementById('login-view');
            
            document.getElementById('register-form').reset();
            document.getElementById('login-form').reset();
            
            if (view === 'login') {
                formTitle.textContent = 'Welcome back!';
                formSubtitle.innerHTML = `Don't have an account yet? <a href="#" class="state-link" onclick="toggleFormState('register'); return false;">Register</a>`;
                registerView.classList.add('hidden');
                loginView.classList.remove('hidden');
            } else {
                formTitle.textContent = 'Create an account';
                formSubtitle.innerHTML = `Already have an account? <a href="#" class="state-link" onclick="toggleFormState('login'); return false;">Log in</a>`;
                registerView.classList.remove('hidden');
                loginView.classList.add('hidden');
            }
        }
        
        document.addEventListener('DOMContentLoaded', () => {
             toggleFormState('register');
        });
  