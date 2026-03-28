document.addEventListener('DOMContentLoaded', () => {
    const loginToggle = document.getElementById('login-toggle');
    const registerToggle = document.getElementById('register-toggle');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const authSubtitle = document.getElementById('auth-subtitle');
    const roleBtns = document.querySelectorAll('.role-btn');
    const roleIdInput = document.getElementById('role-id-input');

    let currentMode = 'login'; 
    let currentRole = 'student'; 

    const roleConfig = {
        student: { icon: 'fa-id-card', placeholder: 'USN Number' },
        teacher: { icon: 'fa-id-badge', placeholder: 'Employee/Teacher ID' },
        office: { icon: 'fa-hashtag', placeholder: 'Staff Access Code' }
    };

    function switchMode(mode) {
        currentMode = mode;
        if (mode === 'login') {
            loginToggle.classList.add('active');
            registerToggle.classList.remove('active');
            loginForm.classList.add('active-form');
            registerForm.classList.remove('active-form');
            authSubtitle.textContent = 'Welcome back! Please login to your account.';
        } else {
            registerToggle.classList.add('active');
            loginToggle.classList.remove('active');
            registerForm.classList.add('active-form');
            loginForm.classList.remove('active-form');
            authSubtitle.textContent = 'Create an account to join the portal.';
        }
    }

    function switchRole(role, btnElement) {
        currentRole = role;
        roleBtns.forEach(btn => btn.classList.remove('active'));
        btnElement.classList.add('active');
        if (roleConfig[role]) {
            roleIdInput.placeholder = roleConfig[role].placeholder;
            const containerIcon = roleIdInput.previousElementSibling;
            if (containerIcon) containerIcon.className = `fas ${roleConfig[role].icon}`;
        }

        const studentFields = document.getElementById('student-only-fields');
        if (studentFields) {
            studentFields.style.display = (role === 'student') ? 'block' : 'none';
        }
    }

    if (loginToggle && registerToggle) {
        loginToggle.addEventListener('click', () => switchMode('login'));
        registerToggle.addEventListener('click', () => switchMode('register'));
    }

    if (roleBtns.length > 0) {
        roleBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault(); 
                switchRole(btn.getAttribute('data-role'), btn);
            });
        });
    }

    // Backend Integration logic
    async function handleAuth(url, data) {
        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await res.json();
            
            if (res.ok) {
                localStorage.setItem('token', result.token);
                localStorage.setItem('role', result.role);
                alert(`${currentMode === 'login' ? 'Login' : 'Registration'} Successful!`);
                window.location.href = result.role + '-dashboard.html';
            } else {
                alert(`Error: ${result.message}`);
            }
        } catch (error) {
            alert("Network error, please ensure the backend server is running.");
        }
    }

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = loginForm.querySelector('input[type="email"]').value;
            const password = loginForm.querySelector('input[type="password"]').value;
            handleAuth('/api/auth/login', { email, password });
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('reg-name').value;
            const usn = document.getElementById('role-id-input').value; // usn/cSN
            const email = document.getElementById('reg-email').value;
            const password = document.getElementById('reg-pass').value;
            const confirmPassword = document.getElementById('reg-conf-pass').value;
            
            if(password !== confirmPassword) return alert('Passwords do not match');

            let mobile = '', parentMobile = '';
            if(currentRole === 'student') {
                mobile = document.getElementById('student-mobile')?.value || '';
                parentMobile = document.getElementById('parent-mobile')?.value || '';
            }

            handleAuth('/api/auth/register', { 
                name, email, password, role: currentRole, usn, mobile, parentMobile
            });
        });
    }
});
