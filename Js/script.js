// ===============================================================
//           Activity_FIET_Webpage.html (API Login)
// ===============================================================

window.moveNext = function(element, event) {
    if (event.key === "Backspace") {
        if (element.previousElementSibling) {
            element.previousElementSibling.focus();
            element.previousElementSibling.value = '';
        }
    } else {
        if (element.value && element.nextElementSibling) {
            element.nextElementSibling.focus();
        }
    }
};

const container = document.getElementById('container');
const officer = document.getElementById('officer');
const student = document.getElementById('student');
window.API_BASE_URL = window.API_BASE_URL || 'http://127.0.0.1:5000';
const API_BASE_URL = window.API_BASE_URL;


if (officer) {
    officer.addEventListener('click', () => {
        if (container) container.classList.toggle("active");
    });
}

if (student) {
    student.addEventListener('click', () => {
        if (container) container.classList.toggle("active");
    });
}

const togglePassword = document.querySelector('#togglePassword');
const passwordInput = document.querySelector('#passwordInput') || document.querySelector('#password');
if (togglePassword && passwordInput) {
    togglePassword.addEventListener('click', function () {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text': 'password';
        passwordInput.setAttribute('type', type);
        this.classList.toggle('fa-eye');
        this.classList.toggle('fa-eye-slash');
    });
}

// ---------------------------------------------------------------
// API Login Handling (การแจ้งเตือนเหมือนช่องที่ยังไม่ได้ใส่)
// ---------------------------------------------------------------

function handleLoginSuccess(userData) {
    let userRole = (userData && userData.role) ? userData.role.toString().toLowerCase().trim() : '';

    if (userData) {
        localStorage.setItem('user_full_name', userData.full_name || '');
        localStorage.setItem('user_role', userRole);
        localStorage.setItem('user_id', userData.user_id || '');
    }

    if (userRole === 'admin') {
        window.location.href = '/Html/AdminBuild_Activity.html';
    } else if (userRole === 'teacher' || userRole === 'staff' || userRole === 'ta') {
        window.location.href = '/Html/HomepageTeacher.html';
    } else {
        window.location.href = '/Html/Homepage.html';
    }
}

const loginForms = document.querySelectorAll('.login-inputs');

loginForms.forEach(form => {
    form.addEventListener('submit', async function(e) {
        // ถ้าฟอร์มนี้ชี้ไปหน้าที่ไม่ได้ใช้ API อาจจะไม่ต้อง block แต่ในที่นี้เราใช้ API นำ
        // ถ้าอยากใช้เป็น UI Demo เฉยๆ โดยไม่ต่อ Python ให้เอาโค้ดใน try...catch ออก
        e.preventDefault(); 

        const inputs = this.querySelectorAll('input:not([type="checkbox"])');
        let username = '';
        let password = '';
        
        // เช็คว่ามีกี่ input 
        // ถ้าเป็น Teacher มี 2 (user, pass)
        // ถ้าเป็น Student มี 1 (ID Card)
        if (inputs.length >= 2) {
            username = inputs[0].value;
            password = inputs[1].value;
        } else if (inputs.length === 1) {
            // สำหรับ Student ลบเครื่องหมาย - ออกให้เหลือแต่ตัวเลข ก่อนส่งไปที่ Database
            username = inputs[0].value.replace(/-/g, '');
            password = inputs[0].value.replace(/-/g, ''); // Student อาจจะไม่มีฟิลด์รหัสผ่าน
        }

        try {
            // แสดงหน้าโหลดขณะกำลังส่ง OTP
            Swal.fire({
                title: 'กำลังเข้าสู่ระบบ...',
                text: 'ระบบกำลังตรวจสอบข้อมูลและส่งรหัส OTP ไปยังอีเมลของคุณ',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            // สมมติว่ายิงไปหา Python ที่ http://127.0.0.1:5000/login
            const response = await fetch(`${API_BASE_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: username, password: password })
            });

            const data = await response.json();

            if (data.status === 'success') {
                Swal.fire({
                    title: 'สำเร็จ!',
                    text: 'เข้าสู่ระบบเรียบร้อยแล้ว',
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false
                }).then(() => {
                    handleLoginSuccess(data.data);
                });
            } else if (data.status === 'otp_required') {
                // แสดหน้าต่างให้กรอก OTP แบบ 6 ช่อง
                const { value: verifyData } = await Swal.fire({
                    title: 'ยืนยันรหัส OTP',
                    html: `
                        <p style="margin-bottom: 20px; color: #545454; font-size: 16px;">กรุณากรอกรหัส 6 หลักที่ส่งไปยังอีเมลของคุณ</p>
                        <div class="otp-container">
                            <input type="text" class="otp-box" maxlength="1" pattern="[0-9]" inputmode="numeric" onkeyup="moveNext(this, event)" oninput="this.value=this.value.replace(/[^0-9]/g,'')">
                            <input type="text" class="otp-box" maxlength="1" pattern="[0-9]" inputmode="numeric" onkeyup="moveNext(this, event)" oninput="this.value=this.value.replace(/[^0-9]/g,'')">
                            <input type="text" class="otp-box" maxlength="1" pattern="[0-9]" inputmode="numeric" onkeyup="moveNext(this, event)" oninput="this.value=this.value.replace(/[^0-9]/g,'')">
                            <input type="text" class="otp-box" maxlength="1" pattern="[0-9]" inputmode="numeric" onkeyup="moveNext(this, event)" oninput="this.value=this.value.replace(/[^0-9]/g,'')">
                            <input type="text" class="otp-box" maxlength="1" pattern="[0-9]" inputmode="numeric" onkeyup="moveNext(this, event)" oninput="this.value=this.value.replace(/[^0-9]/g,'')">
                            <input type="text" class="otp-box" maxlength="1" pattern="[0-9]" inputmode="numeric" onkeyup="moveNext(this, event)" oninput="this.value=this.value.replace(/[^0-9]/g,'')">
                        </div>
                    `,
                    showCancelButton: true,
                    confirmButtonText: 'ยืนยัน',
                    cancelButtonText: 'ยกเลิก',
                    confirmButtonColor: '#70D0F4',
                    showLoaderOnConfirm: true,
                    didOpen: () => {
                        const firstBox = document.querySelector('.otp-box');
                        if (firstBox) firstBox.focus();
                    },
                    preConfirm: async () => {
                        const inputs = document.querySelectorAll('.otp-box');
                        let code = '';
                        inputs.forEach(input => code += input.value);
                        
                        if (code.length !== 6) {
                            Swal.showValidationMessage('กรุณากรอกรหัส OTP ให้ครบ 6 หลัก');
                            return false;
                        }

                        try {
                            const verifyResponse = await fetch(`${API_BASE_URL}/verify_otp`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ user_id: data.data.user_id, otp_code: code })
                            });
                            const result = await verifyResponse.json();
                            if (result.status !== 'success') {
                                Swal.showValidationMessage(result.message || 'รหัส OTP ไม่ถูกต้อง');
                            }
                            return result;
                        } catch (error) {
                            Swal.showValidationMessage(`เกิดข้อผิดพลาด: ${error}`);
                        }
                    },
                    allowOutsideClick: () => !Swal.isLoading()
                });

                if (verifyData && verifyData.status === 'success') {
                    Swal.fire({
                        title: 'สำเร็จ!',
                        text: 'เข้าสู่ระบบเรียบร้อยแล้ว',
                        icon: 'success',
                        timer: 1500,
                        showConfirmButton: false
                    }).then(() => {
                        handleLoginSuccess(verifyData.data);
                    });
                } else {
                    inputs.forEach(input => input.value = '');
                }
            } else {
                // ถ้าไม่สำเร็จ ให้แสดง SweetAlert แจ้งเตือน
                Swal.fire({
                    title: 'เข้าสู่ระบบไม่สำเร็จ',
                    text: data.message || 'User หรือ รหัสผ่านไม่ถูกต้อง',
                    icon: 'error',
                    confirmButtonText: 'ตกลง',
                    confirmButtonColor: '#70D0F4'
                });
                
                // เคลียร์ช่อง input ทั้งหมดให้ว่างเปล่า
                inputs.forEach(input => input.value = '');
            }
        } catch (error) {
            // กรณีลืมเปิด Python Server หรือต่อไม่ได้
            console.error('API Error:', error);
            alert("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ Python ได้! ลืมรัน Data.py หรือเปล่า?\n" + error);
            const originalOnInvalid = inputs[0].getAttribute('oninvalid');
            if (originalOnInvalid) inputs[0].removeAttribute('oninvalid');
            
            inputs[0].setCustomValidity('ไม่สามารถเชื่อมต่อฐานข้อมูลได้ กรุณาลองใหม่');
            inputs[0].reportValidity();
            
            inputs[0].addEventListener('input', function() {
                this.setCustomValidity('');
                if (originalOnInvalid) this.setAttribute('oninvalid', originalOnInvalid);
            }, { once: true });
        }
    });
});

// ===============================================================
//      Register.html, Activity_FIET_Webpage.html
// ===============================================================

async function submitForm(event) {
    event.preventDefault();

    // ดึงข้อมูลจากฟอร์ม
    const data = {
        id_card: document.getElementById('id_card').value.replace(/-/g, ''),
        thai_first_name: document.getElementById('thai_first_name').value,
        thai_last_name: document.getElementById('thai_last_name').value,
        eng_first_name: document.getElementById('eng_first_name').value,
        eng_last_name: document.getElementById('eng_last_name').value,
        school: document.getElementById('school').value,
        birthday: document.getElementById('birthday').value,
        email: document.getElementById('email').value,
        telephone: document.getElementById('telephone').value.replace(/-/g, '')
    };

    // แสดงหน้าโหลด
    Swal.fire({
        title: 'กำลังลงทะเบียน...',
        text: 'กรุณารอสักครู่ ระบบกำลังส่งอีเมลยืนยัน',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });

    try {
        const response = await fetch(`${API_BASE_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (result.status === 'success') {
            Swal.fire({
                title: 'ลงทะเบียนสำเร็จ!',
                text: 'กรุณาตรวจสอบอีเมลของคุณเพื่อยืนยันตัวตน',
                icon: 'success',
                confirmButtonText: 'ตกลง',
                confirmButtonColor: '#70D0F4',
                allowOutsideClick: false 
            }).then((res) => {
                if (res.isConfirmed) {
                    document.body.classList.remove('show-register'); // กลับไปหน้าล็อกอิน
                }
            });
        } else {
            Swal.fire('ข้อผิดพลาด', result.message || 'ไม่สามารถลงทะเบียนได้', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        Swal.fire('ข้อผิดพลาด', 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้', 'error');
    }
}

async function submitTeacherForm(event) {
    event.preventDefault();

    // สร้าง FormData เพราะมีไฟล์รูปภาพ
    const formData = new FormData();
    formData.append('id_card', document.getElementById('id_card').value.replace(/-/g, ''));
    formData.append('password', document.getElementById('password').value);
    formData.append('thai_first_name', document.getElementById('thai_first_name').value);
    formData.append('thai_last_name', document.getElementById('thai_last_name').value);
    formData.append('position', document.getElementById('position').value);
    formData.append('major', document.getElementById('major').value);
    formData.append('birthday', document.getElementById('birthday').value);
    formData.append('email', document.getElementById('email').value);
    formData.append('telephone', document.getElementById('telephone').value.replace(/-/g, ''));
    
    const fileInput = document.getElementById('profile_picture');
    if (fileInput.files.length > 0) {
        formData.append('profile_picture', fileInput.files[0]);
    }

    // แสดงหน้าโหลด
    Swal.fire({
        title: 'กำลังลงทะเบียน...',
        text: 'กรุณารอสักครู่ ระบบกำลังส่งอีเมลยืนยัน',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });

    try {
        const response = await fetch(`${API_BASE_URL}/register_teacher`, {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (result.status === 'success') {
            Swal.fire({
                title: 'ลงทะเบียนสำเร็จ!',
                text: 'กรุณาตรวจสอบอีเมลของคุณเพื่อยืนยันตัวตน',
                icon: 'success',
                confirmButtonText: 'ตกลง',
                confirmButtonColor: '#70D0F4',
                allowOutsideClick: false 
            }).then((res) => {
                if (res.isConfirmed) {
                    window.close(); // กลับไปหน้าล็อกอิน
                }
            });
        } else {
            Swal.fire('ข้อผิดพลาด', result.message || 'ไม่สามารถลงทะเบียนได้', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        Swal.fire('ข้อผิดพลาด', 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้', 'error');
    }
}

function goLogin(event) {
    event.preventDefault(); // ป้องกันไม่ให้หน้าเว็บกระตุกไปบนสุดเพราะ href="#"
    
    // ปิดหน้าต่าง register ทิ้ง เพื่อกลับไปหน้าล็อกอินที่เปิดค้างไว้อยู่แล้ว
    window.close();
}

// ===============================================================
//      Register.html, Activity_FIET_Webpage.html
// ===============================================================

function formatIDCard(input) {
    let value = input.value.replace(/\D/g, '');
    
    if (value.length > 13) value = value.slice(0, 13);

    let formatted = '';
    
    if (value.length > 0) {
        formatted += value.substring(0, 1);
    }
    if (value.length > 1) {
        formatted += '-' + value.substring(1, 5);
    }
    if (value.length > 5) {
        formatted += '-' + value.substring(5, 10);
    }
    if (value.length > 10) {
        formatted += '-' + value.substring(10, 12);
    }
    if (value.length > 12) {
        formatted += '-' + value.substring(12, 13);
    }

    input.value = formatted;
}

function formatPhoneNumber(input) {
    let value = input.value.replace(/\D/g, '');
    
    if (value.length > 10) value = value.slice(0, 10);

    let formatted = '';
    
    if (value.length > 0) {
        formatted = value.substring(0, 3);
    }
    if (value.length > 3) {
        formatted += '-' + value.substring(3, 6);
    }
    if (value.length > 6) {
        formatted += '-' + value.substring(6, 10);
    }

    input.value = formatted;
}

// ===============================================================
//         Homepage.html, HomepageTeacher.html
// ===============================================================

const profileMenuBtn = document.getElementById('profileMenuBtn');
const profileSidebar = document.getElementById('profileSidebar');

if (profileMenuBtn && profileSidebar) {
    // Toggle Sidebar on Click
    profileMenuBtn.addEventListener('click', function(e) {
        e.preventDefault();
        profileSidebar.classList.toggle('show');
    });

    // Close sidebar if clicked outside of it
    document.addEventListener('click', function(e) {
        const container = document.querySelector('.profile-dropdown-container');
        if (container && !container.contains(e.target)) {
            profileSidebar.classList.remove('show');
        }
    });
}

// ===============================================================
//            Major.html, MajorTeacher.html
// ===============================================================

const majorData = {
    mte: {
        logo: "../Photo/Logo_MTE.png", 
        title: "สาขาวิชาครุศาสตร์เครื่องกล",
        subtitle: "Mechanical Technology Education",
        images: ["../Photo/MTE3.jpg", "../Photo/MTE2.jpg", "../Photo/MTE4.jpg"],
        description: "หลักสูตรครุศาสตร์อุตสาหกรรมบัณฑิต สาขาวิชาวิศวกรรมเครื่องกล เป็นหลักสูตรที่จัดให้ผู้เรียนมีองค์ความรู้ ทักษะ ทัศนคติ โดยเฉพาะจิตสำ นึกของความเป็นครูช่างด้วยการผสผสานศาสตร์ทางวิชาชีพ การสอนและศาสตร์ทางวิชาชีพวิศวกรรมควบคู่กันไปโดยจัดให้ผู้เรียน เรียนรายวิชพื้นฐานทางวิทยาศาสตร์และรายวิชาทางเทคโนโลยี และถูกบ่มเพาะอย่างเพียงพอเพื่อให้มีคุณธรรม และจริยธรรมในวิชานั้น ผู้เรียนมีความสามารถในการถ่ายทอดและปฏิบัติการสอนวิชาชีพทางวิศวกรรมและเป็นวิทยากรฝึกอบรมใน สถานประกอบการ ด้วยการเลือกใช้กรรมวิธีการสอน/การถ่ายทอด/การฝึกอบรมในสถานศึกษาหรือในโรงงานอุตสาหกรรมได้อย่างเหมาะสม สามารถถ่ายทอดแนวความคิดที่ก่อให้เกิดความสามารถสร้างสรรค์ สามารถคิดเชิงออกแบบ ผลิต พัฒนา และเลือกใช้สื่อการสอนได้อย่างมีประสิทธิภาพแสวงหาเทคโนโลยี สมัยใหม่ซึ่งเชื่อมโยงกับสื่อการสอนต่าง ๆ ตลอดจนการวัดและประเมินผลการสอน/การถ่ายทอด/การฝึกอบรมได้อย่างเป็นระบบรอข้อมูลสาขาวิชา...",
        curriculum: `
            <div class="course-group">
                <span class="course-title">● ปริญญาตรี เทคโนโลยีบัณฑิต (ทล.บ.) 4 ปี</span>
                <ul>
                    <li><i class="fa-solid fa-graduation-cap"></i> สาขาเทคโนโลยีเครื่องกล</li>
                </ul>
            </div>
            <div class="course-group">
                <span class="course-title">● ปริญญาตรี ครุศาสตร์อุตสาหกรรมบัณฑิต (ค.อ.บ.) 5 ปี</span>
                <ul>
                    <li><i class="fa-solid fa-graduation-cap"></i> สาขาครุศาสตร์เครื่องกล</li>
                </ul>
            </div>
            `
    },
    cte: {
        logo: "../Photo/Logo_CTE.png",
        title: "สาขาวิชาครุศาสตร์โยธา",
        subtitle: "Civil Technology Education",
        images: ["../Photo/CTE1.jpg", "../Photo/CTE2.jpg", "../Photo/CTE3.jpg"],
        description: "หลักสูตรครุศาสตร์อุตสาหกรรมบัณฑิต สาขาวิชาวิศวกรรมโยธา เป็นหลักสูตรที่จัดให้ทรัพยากรบุคคลที่สำเร็จจากหลักสูตรนี้จะเป็นผู้ที่มีความรู้ความสามารถทางด้านการสอน การถ่ายทอดความรู้ มีทักษะการปฏิบัติงานช่างโยธา และมีความรู้ทางวิศวกรรมโยธา สามารถนำความรู้ไปประยุกต์ใช้กับการประกอบวิชาชีพครู สาขาวิศวกรรมโยธาได้ มีทัศนคติและมีจิตสำนึกที่ดีของความเป็นครูช่าง สามารถที่จะถ่ายทอดความรู้ทั้งภาคทฤษฎีและภาคปฏิบัติให้กับผู้เรียนได้อย่างเป็นระบบ มีความสามารถที่จะค้นคว้าหาความรู้เพิ่มเติมและพัฒนางานวิจัยทางเทคโนโลยีโยธา สามารถที่จะปรับตัวเข้ากับสังคมและสถานการณ์ทั้งปัจจุบันและอนาคตได้",
        curriculum: `
            <div class="course-group">  
                <span class="course-title">● ปริญญาตรี เทคโนโลยีบัณฑิต (ทล.บ.) 4 ปี</span>
                <ul>
                    <li><i class="fa-solid fa-graduation-cap"></i> สาขาเทคโนโลยีโยธา</li>
                </ul>
            </div>
            <div class="course-group">
                <span class="course-title">● ปริญญาตรี ครุศาสตร์อุตสาหกรรมบัณฑิต (ค.อ.บ.) 5 ปี</span>
                <ul>
                    <li><i class="fa-solid fa-graduation-cap"></i> สาขาครุศาสตร์โยธา</li>
                </ul>
            </div>
            `
    },
    ete: {
        logo: "../Photo/logo_ETE.png",
        title: "สาขาวิชาครุศาสตร์ไฟฟ้า",
        subtitle: "Electrical Technology Education",
        images: ["../Photo/ETE3.jpg", "../Photo/ETE2.jpg", "../Photo/ETE1.png"],
        description: "หลักสูตรครุศาสตร์อุตสาหกรรมบัณฑิต สาขาวิชาวิศวกรรมโยธา เป็นหลักสูตรที่มุ่งผลิตครูผู้สอนสายวิศวกรรม และนักฝึกอบรมในภาคอุตสาหกรรม ที่มีความรู้ ความสามารถและความเชี่ยวชาญ ทั้งด้านทฤษฎีและปฏิบัติ โดยเน้นความเข้มแข็งทางวิศวกรรมไฟฟ้าในสาขาวิชาไฟฟ้ากำลัง สาขาอิเล็กทรอนิกส์ และสาขาคอมพิวเตอร์ บัณฑิตจะได้รับการพัฒนาให้มีทักษะด้านการสอนและการถ่ายทอดความรู้อย่างเป็นระบบ สามารถออกแบบการเรียนรู้ทั้งภาคทฤษฎีและภาคปฏิบัติได้อย่างมีประสิทธิภาพ พร้อมทั้งมีทัศนคติที่ดีและจิตสำนึกแห่งความเป็นครู",
        curriculum: `
            <div class="course-group">
                <span class="course-title">● ปริญญาตรี เทคโนโลยีบัณฑิต (ทล.บ.) 4 ปี</span>
                <ul>
                    <li><i class="fa-solid fa-graduation-cap"></i> สาขาเทคโนโลยีไฟฟ้า</li>
                </ul>
            </div>
            <div class="course-group">
                <span class="course-title">● ปริญญาตรี ครุศาสตร์อุตสาหกรรมบัณฑิต (ค.อ.บ.) 5 ปี</span>
                <ul>
                    <li><i class="fa-solid fa-graduation-cap"></i> สาขาครุศาสตร์ไฟฟ้า (เอกไฟฟ้ากำลัง)</li>
                    <li><i class="fa-solid fa-graduation-cap"></i> สาขาครุศาสตร์ไฟฟ้า (เอกคอมพิวเตอร์)</li>
                    <li><i class="fa-solid fa-graduation-cap"></i> สาขาครุศาสตร์ไฟฟ้า (เอกอิเล็กทรอนิกส์)</li>
                </ul>
            </div>
        `
    },
    pte: {
        logo: "../Photo/Logo_PTE.png",
        title: "สาขาวิชาครุศาสตร์อุตสาหการ",
        subtitle: "Production Technology Education",
        images: ["../Photo/PTE1.jpg", "../Photo/PTE2.JPG", "../Photo/PTE3.jpg"],
        description: "หลักสูตรครุศาสตร์อุตสาหกรรมบัณฑิต สาขาวิชาวิศวกรรมอุตสาหการ เป็นหลักสูตรที่",
        curriculum: `<div class="course-group">
                <span class="course-title">● ปริญญาตรี เทคโนโลยีบัณฑิต (ทล.บ.) 4 ปี</span>
                <ul>
                    <li><i class="fa-solid fa-graduation-cap"></i> สาขาเทคโนโลยีอุตสาหการ</li>
                </ul>
            </div>
            <div class="course-group">
                <span class="course-title">● ปริญญาตรี ครุศาสตร์อุตสาหกรรมบัณฑิต (ค.อ.บ.) 5 ปี</span>
                <ul>
                    <li><i class="fa-solid fa-graduation-cap"></i> สาขาครุศาสตร์อุตสาหการ</li>
                </ul>
            </div>
            `
    },
    ect: {
        logo: "../Photo/Logo_ECT1.png",
        title: "สาขาวิชาเทคโนโลยีการศึกษาและสื่อสารมวลชน",
        subtitle: "Educational Communications and Technology",
        images: ["../Photo/ECT.png", "../Photo/ECT2.jpg", "../Photo/ECT.png"],
        description: "หลักสูตรเทคโนโลยีบัณฑิต สาขาวิชาเทคโนโลยีการศึกษาและสื่อสารมวลชน เป็นหลักสูตรผลิตบัณฑิตที่มีความรู้ในภาคทฤษฎีและภาคปฏิบัติ ในศาสตร์เทคโนโลยีการศึกษาและสื่อสารมวลชน ที่เก่งและดี มีจรรยาบรรณในวิชาชีพ",
        curriculum: `
            <div class="course-group">
                <span class="course-title">● ปริญญาตรี เทคโนโลยีบัณฑิต (ทล.บ) 4 ปี</span>
                <ul>
                    <li><i class="fa-solid fa-graduation-cap"></i> สาขาเทคโนโลยีการศึกษาและสื่อสารมวลชน</li>
                </ul>
            </div>
        `
    },
    ppt: {
        logo: "../Photo/Logo_PPT.png",
        title: "สาขาวิชาเทคโนโลยีการพิมพ์และบรรจุภัณฑ์",
        subtitle: "Printing and Packaging Technology",
        images: ["../Photo/PPT1.jpg", "../Photo/PPT2.JPG", "../Photo/PPT3.JPG"],
        description: "หลักสูตรวิทยาศาสตรบัณฑิต สาขาวิชาเทคโนโลยีบรรจุภัณฑ์และการพิมพ์ เป็นหลักสูตรผลิตบัณฑิตที่มีความรู้ทางเทคโนโลยีบรรจุภัณฑ์และการพิมพ์ ทั้งในด้านทฤษฎีและปฎิบัติ มีความเข้าใจถึงกระบวนการจัดการผลิตบรรจุภัณฑ์และสิ่งพิมพ์ สามารออกแบบพัฒนาสิ่งพิมพ์บรรจุภัณฑ์ ให้สอดคล้องกับการใช้งานและเทคโนโลยีการผลิตได้ มีทักษะในการแก้ปัญหา พัฒนาผลิตผลงานด้านบรรจุภัณฑ์และสิ่งพิมพ์ โดยการบูรณาการความรู้ต่าง ๆ โดยใช้กระบวนการทางวิทยาศาสตร์ที่คำนึงถึง สิ่งแวดล้อมและความยั่งยืน พัฒนาตนเองให้ทันกับความก้าวหน้าทางเทคโนโลยีรวมถึงที่เกี่ยวข้องกับบรรจุภัณฑ์และการพิมพ์ สามารถทำงานเป็นทีม นำเสนอผลงานได้อย่างมีประสิทธิผล รวมถึงสามารถปรับตัว ให้เข้ากับสภาพการทำงานได้เป็นบัณฑิตที่มีจริยธรรม มีจรรยาบรรณในวิชาการ วิชาชีพ และรับผิดชอบต่อสังคมเพื่อเป็นบุคลากรที่มีคุณภาพ ร่วมพัฒนาวงการอุตสาหกรรมบรรจุภัณฑ์และสิ่งพิมพ์ของประเทศให้ยั่งยืนก้าวไกลต่อไป",
        curriculum: `
            <div class="course-group">
                <span class="course-title">● ปริญญาตรี วิทยาศาสตรบัณฑิต (วท.บ.) 4 ปี</span>
                <ul>
                    <li><i class="fa-solid fa-graduation-cap"></i> สาขาเทคโนโลยีการพิมพ์และบรรจุภัณฑ์</li>
                </ul>
                </div>`
    },
    cmm: {
        logo: "../Photo/Logo_CMM.png",
        title: "สาขาวิชาวิทยาการคอมพิวเตอร์ประยุกต์-มัลติมีเดีย",
        subtitle: "Computer and Multimedia",
        images: ["../Photo/CMM1.JPG", "../Photo/CMM3.jpg", "../Photo/CMM2.jpg"],
        description: "หลักสูตรวิทยาศาสตรบัณฑิต สาขาวิชาวิทยาการคอมพิวเตอร์ประยุกต์-มัลติมีเดีย เป็นหลักสูตรที่มุ่งผลิตบัณฑิตให้มีความรู้รอบด้านเทคโนโลยีมัลติมีเดีย มีความสามารถในการเรียนรู้ด้วยตนเองเพื่อรองรับการเปลี่ยนแปลงในอนาคต มีความรับผิดชอบต่อตนเองและสังคม และมีจรรยาบรรณในวิชาชีพ",
        curriculum: `
            <div class="course-group">
            <span class="course-title">● ปริญญาตรี วิทยาศาสตรบัณฑิต (วท.บ.) 4 ปี</span>
            <ul>
                <li><i class="fa-solid fa-graduation-cap"></i> สาขาวิทยาการคอมพิวเตอร์ประยุกต์-มัลติมีเดีย</li>
            </ul>
            </div>`
    }
};

function openActivityModal(activityKey) {
    const data = activityData[activityKey];
    if (!data) return;

    document.getElementById('activity-modal-banner').src = data.banner;
    document.getElementById('activity-modal-title').textContent = data.title;
    document.getElementById('activity-modal-subtitle').textContent = data.subtitle;
    document.getElementById('activity-modal-workshops').innerHTML = data.workshops;

    const modal = document.getElementById('activity-modal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeActivityModal() {
    const modal = document.getElementById('activity-modal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// ===============================================================
//         Homepage.html, HomepageTeacher.html
// ===============================================================
document.addEventListener("DOMContentLoaded", function() {
    const sidebar = document.querySelector('.sidebar-menu');
    const indicator = document.querySelector('.active-indicator');
    if (!sidebar || !indicator) return;

    const activeItem = sidebar.querySelector('li.active');

    function moveIndicator(element) {
        if (!element) return;
        const top = element.offsetTop;
        const height = element.offsetHeight;
        indicator.style.display = 'block';
        indicator.style.height = `${height}px`;
        indicator.style.transform = `translateY(${top}px)`;
    }

    moveIndicator(activeItem);

    const menuItems = sidebar.querySelectorAll('li:not(.divider)');
    menuItems.forEach(item => {
        item.addEventListener('click', function() {
            menuItems.forEach(i => i.classList.remove('active'));
            this.classList.add('active');
            moveIndicator(this);
        });
    });
});

// ===============================================================
//            Major.html, MajorTeacher.html
// ===============================================================
function openMajorModal(majorKey) {
    const data = majorData[majorKey];
    if (!data) return;

    // Inject data into HTML elements
    document.getElementById('modal-logo').src = data.logo;
    document.getElementById('modal-title').textContent = data.title;
    document.getElementById('modal-subtitle').textContent = data.subtitle;
    
    document.getElementById('modal-img-1').src = data.images[0];
    document.getElementById('modal-img-2').src = data.images[1];
    document.getElementById('modal-img-3').src = data.images[2];
    
    document.getElementById('modal-description').textContent = data.description;
    document.getElementById('modal-curriculum').innerHTML = data.curriculum;

    // Show modal
    const modal = document.getElementById('major-modal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }
}

function closeMajorModal() {
    const modal = document.getElementById('major-modal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = ''; // Restore background scrolling
    }
}

// ===============================================================
//                         Global (All pages)
// ===============================================================
// Close modal when clicking outside of the modal container
document.addEventListener('click', function(e) {
    if (e.target.id === 'activity-modal' || e.target.id === 'major-modal') {
        e.target.classList.remove('active');
        document.body.style.overflow = '';
    }
});

// ===============================================================
//         Activity.html, ActivityTeacher.html
// ===============================================================

const activityData = {
    workshop2: {
        banner: "../Photo/seriesworkshop2.png",
        title: "FIET SERIES WORKSHOP SEASON 2",
        subtitle: "สาขาวิชาที่เปิดรับสมัคร",
        workshops: `
            <!-- Card 1: โยธา -->
            <div class="workshop-card">
                <div class="card-image">
                    <img src="../Photo/CTE.png" alt="โยธา">
                </div>
                <div class="card-body">
                    <div class="workshop-tag">โยธา</div>
                    <h3 class="workshop-name">กิจกรรม เขียนแบบกันไหมจ๊ะคนดี</h3>
                    <div class="workshop-info">
                        <div class="info-item">
                            <i class="fa-regular fa-calendar"></i>
                            <span>28 มีนาคม 2570</span>
                        </div>
                        <div class="info-item">
                            <i class="fa-solid fa-location-dot"></i>
                            <span>คณะศรุศาสตร์อุตสาหกรรมและเทคโนโลยี S13 ชั้น 3</span>
                        </div>
                    </div>
                    <button class="register-btn-workshop" onclick="window.location.href='RegisterWorkshop.html?major=ครุศาสตร์โยธา&activity=FIET SERIES WORKSHOP SEASON 2&date=28 มีนาคม 2570&loc=คณะครุศาสตร์อุตสาหกรรมและเทคโนโลยี S13 ชั้น 3'">สมัคร</button>
                </div>
            </div>

            <!-- Card 2: เครื่องกล -->
            <div class="workshop-card">
                <div class="card-image">
                    <img src="../Photo/MTE.png" alt="เครื่องกล">
                </div>
                <div class="card-body">
                    <div class="workshop-tag">เครื่องกล</div>
                    <h3 class="workshop-name">กิจกรรม EV&Battery หมุดหมายแห่งอนาคต</h3>
                    <div class="workshop-info">
                        <div class="info-item">
                            <i class="fa-regular fa-calendar"></i>
                            <span>28 มีนาคม 2570</span>
                        </div>
                        <div class="info-item">
                            <i class="fa-solid fa-location-dot"></i>
                            <span>คณะศรุศาสตร์อุตสาหกรรมและเทคโนโลยี S13 ชั้น 4</span>
                        </div>
                    </div>
                    <button class="register-btn-workshop" onclick="window.location.href='RegisterWorkshop.html?major=ครุศาสตร์เครื่องกล&activity=FIET SERIES WORKSHOP SEASON 2&date=28 มีนาคม 2570&loc=คณะครุศาสตร์อุตสาหกรรมและเทคโนโลยี S13 ชั้น 4'">สมัคร</button>
                </div>
            </div>
        `
    },
    fietland: {
        banner: "../Photo/fiteland.png",
        title: "กิจกรรม FIET LAND",
        subtitle: "ดินแดนแห่งการเรียนรู้",
        workshops: `
            <div style="text-align: center; padding: 20px; width: 100%;">
                <p>รออัปเดตกิจกรรมย่อย...</p>
            </div>
        `
    }
};
// ===============================================================
//               AdminBuild_Activity.html
// ===============================================================
if (document.getElementById('majorDropdown')) {

/* ── Tab switching ── */
function switchTab(id, btn) {
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    btn.classList.add('active');
}

/* ── Checklist Dropdown toggle ── */
function toggleChecklist() {
    const trigger = document.getElementById('majorTrigger');
    const panel   = document.getElementById('majorPanel');
    const isOpen  = panel.classList.contains('open');
    panel.classList.toggle('open', !isOpen);
    trigger.classList.toggle('open', !isOpen);
}

/* ── Update trigger label + re-render section cards ── */
function updateMajors() {
    const checks = document.querySelectorAll('#majorPanel input[type="checkbox"]:checked');
    const names  = Array.from(checks).map(c => c.value);

    const triggerText = document.getElementById('majorTriggerText');
    triggerText.textContent = names.length === 0
        ? '-- เลือกสาขาวิชา --'
        : `เลือกแล้ว ${names.length} สาขา`;

    renderMajorSections(names);
}

/* ── Render one form-card per selected major ── */
function renderMajorSections(names) {
    const container = document.getElementById('majorSectionsContainer');
    container.innerHTML = '';

    names.forEach((majorName, idx) => {
        const uid  = 'major_' + idx;
        const card = document.createElement('div');
        card.className = 'form-card';
        card.setAttribute('data-major', majorName);
        card.innerHTML = `
            <div class="form-card-title">ข้อมูลกิจกรรม ${majorName}</div>

            <div class="field-row full mb-16">
                <div class="field-group">
                    <label>ชื่อกิจกรรม <span class="req">*</span></label>
                    <input type="text" name="name_${uid}" placeholder="ชื่อกิจกรรมสำหรับ ${majorName}">
                </div>
            </div>
            <div class="field-row three mb-16">
                <div class="field-group">
                    <label>จำนวนที่รับสูงสุด <span class="req">*</span></label>
                    <input type="number" name="quota_${uid}" placeholder="เช่น 100" min="1">
                </div>
                <div class="field-group">
                    <label>วันที่เริ่ม <span class="req">*</span></label>
                    <input type="date" name="start_${uid}">
                </div>
                <div class="field-group">
                    <label>วันที่สิ้นสุด <span class="req">*</span></label>
                    <input type="date" name="end_${uid}">
                </div>
            </div>
            <div class="field-row full mb-16">
                <div class="field-group">
                    <label>สถานที่ <span class="req">*</span></label>
                    <input type="text" name="place_${uid}" placeholder="เช่น ตึก S13 ห้อง 301">
                </div>
            </div>
            <div class="field-row full mb-16">
                <div class="field-group">
                    <label>อาจารย์ผู้รับผิดชอบ <span class="req">*</span></label>
                    <input type="text" name="teacher_${uid}" placeholder="ชื่ออาจารย์ผู้รับผิดชอบ">
                </div>
            </div>
            <div class="field-row full mb-16">
                <div class="field-group">
                    <label>รายละเอียดกิจกรรม</label>
                    <textarea name="desc_${uid}" placeholder="อธิบายรายละเอียดกิจกรรม (ไม่บังคับ)" style="min-height:80px;"></textarea>
                </div>
            </div>
            <div class="field-row full">
                <div class="field-group">
                    <label>รูปภาพกิจกรรม <span class="req">*</span></label>
                    <label class="upload-box" for="img_${uid}">
                        <input type="file" id="img_${uid}" accept="image/*" onchange="previewImage(this)">
                        <i class='bx bx-image-add'></i>
                        <p>คลิกเพื่ออัปโหลดรูปภาพ</p>
                        <span>PNG, JPG, WEBP สูงสุด 5MB</span>
                    </label>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

/* ── Image preview for dynamic upload boxes ── */
function previewImage(input) {
    const box = input.closest('.upload-box');
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = e => {
            box.innerHTML = `<img src="${e.target.result}" style="max-height:160px; border-radius:8px; object-fit:cover; width:100%;">`;
        };
        reader.readAsDataURL(input.files[0]);
    }
}

/* ── Close checklist panel when clicking outside ── */
document.addEventListener('click', function(e) {
    const dropdown = document.getElementById('majorDropdown');
    if (dropdown && !dropdown.contains(e.target)) {
        document.getElementById('majorPanel').classList.remove('open');
        document.getElementById('majorTrigger').classList.remove('open');
    }
});
} // end AdminBuild guard

// ===============================================================
//   HomepageTeacher.html, ProfileTeacher.html
// ===============================================================
document.addEventListener("DOMContentLoaded", function() {
    // 1. ดึงชื่อผู้ใช้มาแสดงใน Sidebar
    const profileLink = document.querySelector('.profile-dropdown .profile-link');
    if (profileLink) {
        const fullName = localStorage.getItem('user_full_name');
        const userRole = localStorage.getItem('user_role');
        
        if (fullName && fullName !== 'null' && fullName !== 'undefined') {
            let displayName = fullName;
            // ถ้าเป็นอาจารย์ หรือ TA และชื่อยังไม่มีคำนำหน้า ให้เติมเข้าไป
            if (userRole === 'teacher' && !displayName.startsWith('อาจารย์')) {
                displayName = 'อาจารย์ ' + displayName;
            } else if (userRole === 'ta' && !displayName.startsWith('TA')) {
                displayName = 'TA ' + displayName;
            }
            
            // เก็บ icon แบบเดิมไว้แล้วต่อด้วยชื่อ
            profileLink.innerHTML = `<i class="fa-regular fa-circle-user icon-spacing"></i> ${displayName}`;
            
            // ตั้งค่าลิงก์ไปยังหน้าโปรไฟล์
            if (userRole === 'teacher') {
                profileLink.href = 'Profile.html';
            } else if (userRole === 'student') {
                profileLink.href = 'StudentProfile.html';
            }
        }
    }

    // 2. จัดการเมื่อกดออกจากระบบ ให้ล้างค่า localStorage
    const logoutLinks = document.querySelectorAll('.logout-link');
    logoutLinks.forEach(link => {
        link.addEventListener('click', function() {
            localStorage.removeItem('user_full_name');
            localStorage.removeItem('user_role');
            localStorage.removeItem('user_id');
        });
    });
});

// --- RegisterTeacher Custom Dropdown ---
function toggleSingleDropdown(panelId, chevronId, dropdownId) {
    const panel = document.getElementById(panelId);
    const chevron = document.getElementById(chevronId);
    const trigger = document.querySelector(`#${dropdownId} .checklist-trigger`);
    
    // Close others
    document.querySelectorAll('.checklist-panel').forEach(p => {
        if (p.id !== panelId) p.classList.remove('open');
    });
    document.querySelectorAll('.checklist-trigger .chevron').forEach(c => {
        if (c.id !== chevronId) c.style.transform = 'rotate(0deg)';
    });
    document.querySelectorAll('.checklist-trigger').forEach(t => {
        if (t !== trigger) t.classList.remove('open');
    });

    const isOpen = panel.classList.contains('open');
    if (isOpen) {
        panel.classList.remove('open');
        trigger.classList.remove('open');
        if(chevron) chevron.style.transform = 'rotate(0deg)';
    } else {
        panel.classList.add('open');
        trigger.classList.add('open');
        if(chevron) chevron.style.transform = 'rotate(180deg)';
    }
}

function selectDropdownItem(radioElement, triggerTextId, dropdownId, hiddenSelectId) {
    const triggerText = document.getElementById(triggerTextId);
    const hiddenSelect = document.getElementById(hiddenSelectId);
    
    // Update text
    triggerText.innerText = radioElement.nextElementSibling.innerText;
    triggerText.style.color = '#333';
    
    // Update hidden select
    hiddenSelect.value = radioElement.value;
    // Clear validation error if any
    hiddenSelect.setCustomValidity('');
    
    // Close panel
    const panel = radioElement.closest('.checklist-panel');
    const trigger = document.querySelector(`#${dropdownId} .checklist-trigger`);
    const chevron = document.querySelector(`#${dropdownId} .chevron`);
    
    panel.classList.remove('open');
    trigger.classList.remove('open');
    if (chevron) chevron.style.transform = 'rotate(0deg)';
}

// Close dropdowns when clicking outside
document.addEventListener('click', function(event) {
    if (!event.target.closest('.checklist-dropdown')) {
        document.querySelectorAll('.checklist-panel').forEach(p => p.classList.remove('open'));
        document.querySelectorAll('.checklist-trigger').forEach(t => t.classList.remove('open'));
        document.querySelectorAll('.checklist-trigger .chevron').forEach(c => c.style.transform = 'rotate(0deg)');
    }
});

// --- RegisterTeacher Image Upload ---
function updateFileName(inputElement) {
    const uploadText = document.getElementById('uploadText');
    const uploadBox = document.getElementById('uploadBox');
    const uploadPlaceholder = document.getElementById('uploadPlaceholder');
    const imagePreview = document.getElementById('imagePreview');
    
    if (inputElement.files && inputElement.files.length > 0) {
        const file = inputElement.files[0];
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(e) {
                imagePreview.src = e.target.result;
                imagePreview.style.display = 'block';
                uploadPlaceholder.style.display = 'none';
                uploadBox.style.borderColor = '#70D0F4';
                uploadBox.style.background = '#f0faff';
                uploadBox.style.padding = '10px';
            };
            reader.readAsDataURL(file);
        } else {
            uploadText.innerText = `เลือกไฟล์: ${file.name}`;
            uploadText.style.color = '#333';
            uploadText.style.fontWeight = '500';
            uploadBox.style.borderColor = '#70D0F4';
            uploadBox.style.background = '#f0faff';
        }
    } else {
        imagePreview.style.display = 'none';
        imagePreview.src = '';
        uploadPlaceholder.style.display = 'block';
        uploadText.innerText = 'คลิกเพื่ออัปโหลดรูปภาพโปรไฟล์';
        uploadText.style.color = '#757575';
        uploadText.style.fontWeight = 'normal';
        uploadBox.style.borderColor = '#ddd';
        uploadBox.style.background = '#FFFAFA';
        uploadBox.style.padding = '25px 20px';
    }
}

// --- Teacher Profile Functions ---
async function fetchTeacherProfile() {
    const userId = localStorage.getItem('user_id');
    if (!userId) return;

    try {
        const response = await fetch(`${API_BASE_URL}/api/teacher/profile?user_id=${userId}`);
        const data = await response.json();

        if (data.status === 'success') {
            updateTeacherProfileUI(data.data);
        }
    } catch (error) {
        console.error('Error fetching teacher profile:', error);
    }
}

function updateTeacherProfileUI(teacher) {
    // Update Header Name (for both Homepage and Profile)
    const headerName = document.getElementById('teacherNameHeader');
    if (headerName) {
        let prefix = (teacher.position === 'TA') ? 'TA ' : 'อาจารย์ ';
        headerName.innerHTML = `<i class="fa-regular fa-circle-user icon-spacing"></i> ${prefix}${teacher.full_name}`;
    }

    // Update Profile Page specific fields
    const nameCard = document.getElementById('teacherNameCard');
    if (nameCard) nameCard.innerText = teacher.full_name;

    const majorCard = document.getElementById('teacherMajorCard');
    if (majorCard) majorCard.innerText = `ภาควิชา${teacher.major}`;

    const roleBadge = document.getElementById('teacherRoleBadge');
    if (roleBadge) {
        roleBadge.innerHTML = `<i class="fa-solid fa-dog"></i> ${teacher.position}`;
    }

    const emailCard = document.getElementById('teacherEmailCard');
    if (emailCard) emailCard.innerText = teacher.email;

    const phoneCard = document.getElementById('teacherPhoneCard');
    if (phoneCard) phoneCard.innerText = teacher.telephone;

    // Info Grid
    const nameInfo = document.getElementById('teacherNameInfo');
    if (nameInfo) nameInfo.innerText = teacher.full_name;

    const emailInfo = document.getElementById('teacherEmailInfo');
    if (emailInfo) emailInfo.innerText = teacher.email;

    const phoneInfo = document.getElementById('teacherPhoneInfo');
    if (phoneInfo) phoneInfo.innerText = teacher.telephone;

    const posInfo = document.getElementById('teacherPositionInfo');
    if (posInfo) posInfo.innerText = teacher.position === 'TEACHER' ? 'อาจารย์ประจำสาขา' : 'TA ประจำสาขา';

    const majorInfo = document.getElementById('teacherMajorInfo');
    if (majorInfo) majorInfo.innerText = teacher.major;

    const idInfo = document.getElementById('teacherIDInfo');
    if (idInfo) idInfo.innerText = teacher.username;

    // Avatar
    const avatar = document.getElementById('teacherAvatar');
    if (avatar && teacher.profile_picture) {
        avatar.classList.remove('placeholder-avatar');
        avatar.style.backgroundImage = `url('${teacher.profile_picture}')`;
        avatar.style.backgroundSize = 'cover';
        avatar.style.backgroundPosition = 'center';
    }
}

// Auto-run on page load
document.addEventListener('DOMContentLoaded', function() {
    const path = window.location.pathname;
    if (path.includes('HomepageTeacher.html') || path.includes('ProfileTeacher.html') || path.includes('ActivityTeacher.html') || path.includes('MajorTeacher.html')) {
        fetchTeacherProfile();
    }
});

// ===============================================================
//                           Activity_FIET_Webpage.html
// ===============================================================

        const cardViewport = document.getElementById('cardViewport');
        const pageFlipBtn = document.getElementById('pageFlipBtn');
        const pageFlipBtnText = document.getElementById('pageFlipBtnText');

        // State tracker
        let isFlipped = false;

        // Card flip activation function
        function toggleCardFlip() {
            isFlipped = !isFlipped;
            if (isFlipped) {
                cardViewport.classList.add('flipped');
                pageFlipBtnText.textContent = 'สำหรับนักเรียน';
                pageFlipBtn.title = 'คลิกเพื่อเข้าสู่หน้าล็อกอินของนักศึกษา';
            } else {
                cardViewport.classList.remove('flipped');
                pageFlipBtnText.textContent = 'สำหรับเจ้าหน้าที่ / อาจารย์';
                pageFlipBtn.title = 'คลิกเพื่อเข้าสู่หน้าล็อกอินของเจ้าหน้าที่และอาจารย์';
            }
        }

        // Add event listeners to all flip buttons
        pageFlipBtn.addEventListener('click', toggleCardFlip);

        // Format ID Card on input
        function formatIDCard(input) {
            let value = input.value.replace(/\D/g, '');
            if (value.length > 13) value = value.slice(0, 13);

            let formatted = '';
            if (value.length > 0) {
                formatted += value.substring(0, 1);
            }
            if (value.length > 1) {
                formatted += '-' + value.substring(1, 5);
            }
            if (value.length > 5) {
                formatted += '-' + value.substring(5, 10);
            }
            if (value.length > 10) {
                formatted += '-' + value.substring(10, 12);
            }
            if (value.length > 12) {
                formatted += '-' + value.substring(12, 13);
            }
            input.value = formatted;
        }

        // Toggle Password visibility
        function togglePasswordVisibility(fieldId, iconElement) {
            const passwordField = document.getElementById(fieldId);
            if (passwordField.type === 'password') {
                passwordField.type = 'text';
                iconElement.classList.remove('fa-eye-slash');
                iconElement.classList.add('fa-eye');
            } else {
                passwordField.type = 'password';
                iconElement.classList.remove('fa-eye');
                iconElement.classList.add('fa-eye-slash');
            }
        }

        // Navigation Link Handler
        function handleNavigation(destination) {
            Swal.fire({
                title: destination,
                text: `คุณคลิกปุ่มเชื่อมโยงไปยังหน้า: "${destination}"`,
                icon: 'info',
                confirmButtonText: 'ตกลง',
                confirmButtonColor: '#0088db',
                customClass: {
                    popup: 'swal2-thai'
                }
            });
        }

        // Form Submit handler
        function handleFormSubmit(event, role) {
            event.preventDefault();
            const form = event.target;
            const inputField = form.querySelector('input[type="text"]');
            const username = inputField ? inputField.value : '';

            Swal.fire({
                title: 'เข้าสู่ระบบสำเร็จ!',
                html: `ยินดีต้อนรับเข้าสู่ระบบ <b>${role === 'student' ? 'นักศึกษา' : 'เจ้าหน้าที่ / อาจารย์'}</b><br><br><b>ผู้ใช้งาน:</b> ${username}`,
                icon: 'success',
                confirmButtonText: 'ตกลง',
                confirmButtonColor: role === 'student' ? '#0088db' : '#f27800'
            }).then(() => {
                // Redirect user to original target page
                if (role === 'student') {
                    window.location.href = '/Html/Homepage.html';
                } else {
                    window.location.href = '/Html/HomepageTeacher.html';
                }
            });
        }

        // Register Page interactive transition events
        const toRegisterBtn = document.getElementById('toRegisterBtn');
        const toLoginBtn = document.getElementById('toLoginBtn');

        toRegisterBtn.addEventListener('click', (e) => {
            e.preventDefault();
            document.body.classList.add('show-register');
        });

        toLoginBtn.addEventListener('click', (e) => {
            e.preventDefault();
            document.body.classList.remove('show-register');
        });

        // Format Phone Number on input (0xx-xxx-xxxx)
        function formatPhoneNumber(input) {
            let value = input.value.replace(/\D/g, '');
            if (value.length > 10) value = value.slice(0, 10);
            
            let formatted = '';
            if (value.length > 0) {
                formatted += value.substring(0, 3);
            }
            if (value.length > 3) {
                formatted += '-' + value.substring(3, 6);
            }
            if (value.length > 6) {
                formatted += '-' + value.substring(6, 10);
            }
            input.value = formatted;
        }

        // Register Form submission with SweetAlert2 and Auto-Fill Login
        function handleRegisterSubmit(event) {
            event.preventDefault();
            const idCard = document.getElementById('reg_id_card').value;
            const firstName = document.getElementById('reg_first_name').value;
            
            Swal.fire({
                title: 'สมัครสมาชิกสำเร็จ!',
                html: `ยินดีต้อนรับคุณ <b>${firstName}</b> เข้าสู่ระบบบริการข้อมูลกิจกรรม FIET<br><br><b>เลขประจำตัวบัตรประชาชน:</b> ${idCard}`,
                icon: 'success',
                confirmButtonText: 'ตกลง',
                confirmButtonColor: '#0088db'
            }).then(() => {
                // Return to login card
                document.body.classList.remove('show-register');
                
                // Proactively autofill the student login card input
                const studentIdInput = document.querySelector('#studentLoginForm input[type="text"]');
                if (studentIdInput) {
                    studentIdInput.value = idCard;
                }
            });
        }

