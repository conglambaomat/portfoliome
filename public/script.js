let words = document.querySelectorAll('.word');
words.forEach(word => {
    let letters = word.textContent.split('');
    word.textContent = '';
    letters.forEach(letter => {
        let span = document.createElement('span');
        span.textContent = letter;
        span.className = 'letter';
        word.appendChild(span);
    });
});

let currentWordIndex = 0;
let maxWordIndex = words.length - 1;

words[currentWordIndex].style.opacity = '1';

let changeText = () => {
    let currentWord = words[currentWordIndex];
    let nextWord = currentWordIndex === maxWordIndex ? words[0] : words[currentWordIndex + 1];
    Array.from(currentWord.children).forEach((letter, index) => {
        setTimeout(() => {
            letter.className = 'letter out';
        }, index * 80);
    });
    nextWord.style.opacity = '1';
    Array.from(nextWord.children).forEach((letter, index) => {
        letter.className = 'letter behind';
        setTimeout(() => {
            letter.className = 'letter in';
        }, 340 + (index * 80));
    });
    currentWordIndex = currentWordIndex === maxWordIndex ? 0 : currentWordIndex + 1;
}
changeText();
setInterval(changeText, 3000);

// Chức năng modal và xử lý form đã được chuyển sang inline script trong index.html
// Để tránh xung đột, phần này đã được loại bỏ


// Giải pháp mới hoàn toàn cho portfolio section - không sử dụng MixItUp
document.addEventListener('DOMContentLoaded', function() {
    // Lấy tất cả các phần tử portfolio
    const portfolioItems = document.querySelectorAll('.port-box');
    const filterButtons = document.querySelectorAll('.fillter-buttons .btn');

    // Hàm để lọc các mục portfolio
    function filterPortfolio(filter) {
        // Hiển thị hoặc ẩn các mục dựa trên bộ lọc
        portfolioItems.forEach(item => {
            // Ẩn tất cả trước
            item.style.display = 'none';

            // Nếu là 'all' hoặc item có class phù hợp với bộ lọc
            if (filter === 'all' || item.classList.contains(filter.replace('.', ''))) {
                // Hiển thị mục này
                item.style.display = 'block';

                // Thêm hiệu ứng fade in
                item.style.opacity = '0';
                item.style.transform = 'translateY(20px)';

                // Sử dụng setTimeout để tạo hiệu ứng fade in
                setTimeout(() => {
                    item.style.opacity = '1';
                    item.style.transform = 'translateY(0)';
                }, 50);
            }
        });
    }

    // Thêm sự kiện click cho các nút filter
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Xóa class active từ tất cả các nút
            filterButtons.forEach(btn => {
                btn.classList.remove('mixitup-control-active');
            });

            // Thêm class active vào nút được click
            this.classList.add('mixitup-control-active');

            // Lấy giá trị filter và áp dụng
            const filterValue = this.getAttribute('data-filter');
            filterPortfolio(filterValue);
        });
    });

    // Khởi tạo với filter 'all' mặc định
    filterPortfolio('all');

    // Thêm transition cho các mục portfolio
    portfolioItems.forEach(item => {
        item.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    });
});

// Navigation menu toggle
let menuIcon = document.querySelector('#menu-icon');
let navlist = document.querySelector('.navlist');

menuIcon.addEventListener('click', () => {
    menuIcon.classList.toggle('bx-x');
    navlist.classList.toggle('active');

    // Update aria-expanded attribute
    const isExpanded = navlist.classList.contains('active');
    menuIcon.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
});

// Xử lý sự kiện click cho các liên kết trong thanh điều hướng
document.querySelectorAll('.navlist a').forEach(link => {
    link.addEventListener('click', (e) => {
        // Ẩn menu trên mobile
        menuIcon.classList.remove('bx-x');
        navlist.classList.remove('active');
        menuIcon.setAttribute('aria-expanded', 'false');

        // Xử lý đặc biệt cho các liên kết đến các section
        const targetId = link.getAttribute('href');
        if (targetId.startsWith('#') && targetId !== '#' && document.querySelector(targetId)) {
            e.preventDefault(); // Ngăn chặn hành vi mặc định

            // Xóa class active từ tất cả các liên kết
            menuLi.forEach(item => item.classList.remove('active'));

            // Thêm class active vào liên kết được click
            link.classList.add('active');

            // Cuộn đến section tương ứng
            const targetSection = document.querySelector(targetId);
            window.scrollTo({
                top: targetSection.offsetTop - 80, // Trừ đi chiều cao của header
                behavior: 'smooth'
            });
        }
    });
});

// active menu - cải tiến để xử lý chính xác các section
let menuLi = document.querySelectorAll('header ul li a');
let sections = document.querySelectorAll('section[id]'); // Chỉ lấy các section có id

function activeMenu() {
    // Lấy vị trí cuộn hiện tại
    let scrollY = window.scrollY;

    // Xóa active từ tất cả các menu item trước
    menuLi.forEach(item => item.classList.remove('active'));

    // Tìm section hiện tại dựa trên vị trí cuộn (từ dưới lên trên)
    // Điều này đảm bảo section cuối cùng (như contact) sẽ được ưu tiên khi hiển thị
    for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i];
        const sectionTop = section.offsetTop - 150; // Tăng vùng đệm lên để phát hiện section sớm hơn
        const sectionHeight = section.offsetHeight;
        const sectionId = section.getAttribute('id');

        // Kiểm tra xem người dùng đã cuộn đến section này chưa
        if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
            // Thêm active vào menu item tương ứng với section hiện tại
            const menuItem = document.querySelector('header ul li a[href="#' + sectionId + '"]');
            if (menuItem) {
                menuItem.classList.add('active');
            }
            // Dừng vòng lặp khi đã tìm thấy section phù hợp
            break;
        }
    }
}

activeMenu();
window.addEventListener("scroll", activeMenu);

// Close menu when Escape key is pressed
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navlist.classList.contains('active')) {
        menuIcon.classList.remove('bx-x');
        navlist.classList.remove('active');
        menuIcon.setAttribute('aria-expanded', 'false');
    }
});

// sticky navbar //////////

const header = document.querySelector('header');
window.addEventListener("scroll", function(){
    // Thêm class sticky khi cuộn xuống hơn 50px
    if (window.scrollY > 50) {
        header.classList.add("sticky");
    } else {
        header.classList.remove("sticky");
    }
})

// Auto set percent for Skills bar
window.onload = () => {
    const skills = document.querySelectorAll('.skills .skill-bar');
    skills.forEach(bar => {
        const percentage = bar.querySelector('.percent').innerText;
        const skillBar = bar.querySelector('.bar span')
        skillBar.style.width = percentage;
        skillBar.style.animation = `${skillBar.classList[0]} ${parseInt(percentage) / 25}s`;
    });
};

// Circle skills
const circleSkills = document.querySelectorAll('.skill-right .professional .box .circle');
circleSkills.forEach(circle => {
    const dots = circle.getAttribute('data-dots');
    const marked = circle.getAttribute('data-percent');
    const percent = Math.floor(dots * marked / 100);
    let points = "";
    const rotate = 360 / dots;

    for (let i = 0; i < dots; ++i) {
        points += `<div class="points" style="--i:${i}; --rot:${rotate}deg;"></div>`;
    }
    circle.innerHTML = points;

    const poinstMarked = circle.querySelectorAll('.points');
    for (let i = 0; i < percent; ++i) {
        poinstMarked[i].classList.add('marked');
    }
});