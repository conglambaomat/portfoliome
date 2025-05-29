document.addEventListener('DOMContentLoaded', function() {
    // Xử lý menu hamburger cho mobile
    const menuIcon = document.querySelector('#menu-icon');
    const navlist = document.querySelector('.navlist');

    if (menuIcon && navlist) {
        menuIcon.addEventListener('click', () => {
            console.log('Menu icon clicked'); // Debug log
            menuIcon.classList.toggle('bx-x');
            navlist.classList.toggle('active');

            // Update aria-expanded attribute
            const isExpanded = navlist.classList.contains('active');
            menuIcon.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
        });

        // Đóng menu khi nhấp vào liên kết
        document.querySelectorAll('.navlist a').forEach(link => {
            link.addEventListener('click', () => {
                menuIcon.classList.remove('bx-x');
                navlist.classList.remove('active');
                menuIcon.setAttribute('aria-expanded', 'false');
            });
        });

        // Đóng menu khi nhấn phím Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && navlist.classList.contains('active')) {
                menuIcon.classList.remove('bx-x');
                navlist.classList.remove('active');
                menuIcon.setAttribute('aria-expanded', 'false');
            }
        });
    }

    // Lấy tham chiếu đến các phần tử DOM
    const refreshButton = document.getElementById('refreshButton');
    const logoutButton = document.getElementById('logoutButton');
    const navLogoutBtn = document.getElementById('navLogoutBtn');
    const messagesTable = document.getElementById('messagesTable');
    const tableBody = messagesTable.querySelector('tbody');
    const emptyState = document.getElementById('emptyState');

    // Thống kê
    const totalMessagesElement = document.getElementById('totalMessages');
    const lastMessageTimeElement = document.getElementById('lastMessageTime');
    const uniqueContactsElement = document.getElementById('uniqueContacts');

    // Hàm để hiển thị thông báo toast
    function showToast(message, type = 'success') {
        // Xóa toast cũ nếu có
        const existingToast = document.querySelector('.toast-notification');
        if (existingToast) {
            existingToast.remove();
        }

        // Tạo toast mới
        const toast = document.createElement('div');
        toast.className = 'toast-notification';

        // Chọn icon dựa vào loại thông báo
        let icon = 'bx-check-circle';
        if (type === 'error') {
            icon = 'bx-error-circle';
        } else if (type === 'info') {
            icon = 'bx-info-circle';
        }

        toast.innerHTML = `
            <i class='bx ${icon}'></i>
            <span>${message}</span>
        `;

        document.body.appendChild(toast);

        // Hiển thị toast
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);

        // Tự động ẩn toast sau 3 giây
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 3000);
    }

    // Hàm để lấy dữ liệu tin nhắn từ API
    async function fetchMessages() {
        try {
            // Thêm class để hiển thị hiệu ứng loading
            refreshButton.classList.add('refreshing');
            refreshButton.disabled = true; // Vô hiệu hóa nút trong khi đang tải

            const response = await fetch('/api/messages');

            if (!response.ok) {
                throw new Error('Failed to fetch messages');
            }

            const messages = await response.json();

            // Log dữ liệu để kiểm tra
            console.log('Messages from API:', messages);

            // Hiển thị dữ liệu vào bảng
            displayMessages(messages);

            // Cập nhật thống kê
            updateStats(messages);

            // Hiển thị thông báo thành công
            showToast('Messages refreshed successfully!', 'success');

            // Xóa hiệu ứng loading sau khi hoàn thành
            setTimeout(() => {
                refreshButton.classList.remove('refreshing');
                refreshButton.disabled = false; // Kích hoạt lại nút
            }, 500);
        } catch (error) {
            console.error('Error fetching messages:', error);

            // Hiển thị thông báo lỗi
            showToast('Error refreshing messages. Please try again.', 'error');

            // Xóa hiệu ứng loading
            refreshButton.classList.remove('refreshing');
            refreshButton.disabled = false;
        }
    }

    // Hàm để hiển thị tin nhắn vào bảng với hiệu ứng
    function displayMessages(messages) {
        // Xóa dữ liệu cũ
        tableBody.innerHTML = '';

        if (messages.length === 0) {
            // Hiển thị trạng thái trống nếu không có tin nhắn
            messagesTable.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }

        // Hiển thị bảng và ẩn trạng thái trống
        messagesTable.style.display = 'table';
        emptyState.style.display = 'none';

        // Thêm CSS cho hiệu ứng fade-in
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }
            .fade-in-row {
                animation: fadeIn 0.3s ease forwards;
                opacity: 0;
            }
        `;
        document.head.appendChild(style);

        // Thêm dữ liệu mới vào bảng với hiệu ứng
        messages.forEach((message, index) => {
            // Tạo hàng mới
            const row = document.createElement('tr');
            row.className = 'fade-in-row';

            // Thêm style để tạo hiệu ứng delay cho từng hàng
            row.style.animationDelay = `${index * 0.05}s`;

            // Định dạng thời gian
            const createdAt = new Date(message.createdAt);
            const formattedDate = createdAt.toLocaleDateString() + ' ' + createdAt.toLocaleTimeString();

            // Tạo ID ngắn gọn
            const shortId = message._id.substring(message._id.length - 6);

            // Tạo các ô dữ liệu
            const cells = [
                { value: shortId },
                { value: message.email },
                { value: message.subject || 'No Subject' },
                { value: formattedDate }
            ];

            // Thêm các ô vào hàng
            cells.forEach(cell => {
                const td = document.createElement('td');
                td.textContent = cell.value;
                row.appendChild(td);
            });

            // Thêm sự kiện click để xem chi tiết tin nhắn
            row.addEventListener('click', () => {
                showMessageDetails(message);
            });

            // Thêm tooltip để chỉ rõ có thể nhấp vào
            row.title = "Click to view message details";

            // Thêm vào bảng
            tableBody.appendChild(row);
        });

        // Xóa style sau 2 giây để tránh xung đột
        setTimeout(() => {
            if (style.parentNode) {
                style.parentNode.removeChild(style);
            }
        }, 2000);
    }

    // Hàm để hiển thị chi tiết tin nhắn
    function showMessageDetails(message) {
        console.log('Showing message details:', message); // Log để debug

        // Kiểm tra xem đã có overlay và message detail nào đang hiển thị không
        const existingOverlay = document.querySelector('.message-overlay');
        const existingMessageDetail = document.querySelector('.message-cell.expanded');

        // Nếu có, xóa chúng trước khi tạo mới
        if (existingOverlay) existingOverlay.remove();
        if (existingMessageDetail) existingMessageDetail.remove();

        try {
            // Tạo overlay
            const overlay = document.createElement('div');
            overlay.className = 'message-overlay';
            document.body.appendChild(overlay);

            // Hiển thị overlay ngay lập tức
            overlay.style.display = 'block';

            // Tạo phần tử hiển thị chi tiết tin nhắn
            const messageCell = document.createElement('div');
            messageCell.className = 'message-cell expanded';
            messageCell.setAttribute('role', 'dialog'); // Thêm role cho accessibility
            messageCell.setAttribute('aria-modal', 'true');
            messageCell.setAttribute('aria-labelledby', 'message-detail-title');

            // Định dạng thời gian
            const createdAt = new Date(message.createdAt);
            const formattedDate = createdAt.toLocaleDateString() + ' ' + createdAt.toLocaleTimeString();

            // Xử lý nội dung tin nhắn an toàn (tránh XSS)
            const safeMessage = message.message ?
                message.message.replace(/</g, '&lt;').replace(/>/g, '&gt;') :
                'No message content';

            // Xử lý tên người gửi an toàn
            const safeName = message.name ?
                message.name.replace(/</g, '&lt;').replace(/>/g, '&gt;') :
                'Unknown';

            messageCell.innerHTML = `
                <i class='bx bx-x' id="closeMessageDetails" aria-label="Close message details"></i>
                <div class="message-details">
                    <div class="message-header">
                        <h3 id="message-detail-title" style="margin-top: 0; margin-bottom: 15px; color: var(--hover-color);">Message Details</h3>
                        <div class="message-info-row">
                            <strong>From:</strong> <span>${safeName} (${message.email})</span>
                        </div>
                        <div class="message-info-row">
                            <strong>Subject:</strong> <span>${message.subject || 'No Subject'}</span>
                        </div>
                        <div class="message-info-row">
                            <strong>Date:</strong> <span>${formattedDate}</span>
                        </div>
                    </div>
                    <div class="message-content">
                        ${safeMessage}
                    </div>
                </div>
            `;

            // Thêm vào body
            document.body.appendChild(messageCell);
            console.log('Message cell added to DOM:', messageCell); // Log để debug

            // Thêm sự kiện đóng
            const closeButton = document.getElementById('closeMessageDetails');
            if (closeButton) {
                closeButton.addEventListener('click', (e) => {
                    e.stopPropagation(); // Ngăn sự kiện lan ra overlay
                    closeMessageDetail(messageCell, overlay);
                });
            } else {
                console.error('Close button not found');
            }

            overlay.addEventListener('click', () => {
                closeMessageDetail(messageCell, overlay);
            });

            // Thêm sự kiện bàn phím để đóng bằng phím Escape
            document.addEventListener('keydown', function escapeHandler(e) {
                if (e.key === 'Escape') {
                    closeMessageDetail(messageCell, overlay);
                    document.removeEventListener('keydown', escapeHandler);
                }
            });
        } catch (error) {
            console.error('Error showing message details:', error);
        }
    }

    // Hàm để đóng chi tiết tin nhắn với hiệu ứng
    function closeMessageDetail(messageCell, overlay) {
        try {
            console.log('Closing message detail'); // Log để debug

            // Thêm class để tạo hiệu ứng fade out
            if (messageCell) {
                messageCell.style.opacity = '0';
                messageCell.style.transform = 'translate(-50%, -50%) scale(0.9)';
            }

            if (overlay) {
                overlay.style.opacity = '0';
            }

            // Xóa các phần tử sau khi hiệu ứng hoàn thành
            setTimeout(() => {
                if (messageCell && messageCell.parentNode) {
                    messageCell.remove();
                }

                if (overlay && overlay.parentNode) {
                    overlay.remove();
                }

                console.log('Message detail closed'); // Log để debug
            }, 300);
        } catch (error) {
            console.error('Error closing message detail:', error);

            // Xóa các phần tử ngay lập tức nếu có lỗi
            if (messageCell && messageCell.parentNode) {
                messageCell.remove();
            }

            if (overlay && overlay.parentNode) {
                overlay.remove();
            }
        }
    }

    // Hàm để cập nhật thống kê
    function updateStats(messages) {
        // Tổng số tin nhắn
        totalMessagesElement.textContent = messages.length;

        // Thời gian tin nhắn gần nhất
        if (messages.length > 0) {
            const latestMessage = messages[0]; // Giả sử messages đã được sắp xếp theo thời gian giảm dần
            const createdAt = new Date(latestMessage.createdAt);
            lastMessageTimeElement.textContent = createdAt.toLocaleDateString();
        } else {
            lastMessageTimeElement.textContent = '-';
        }

        // Số lượng liên hệ duy nhất
        const uniqueEmails = new Set(messages.map(message => message.email));
        uniqueContactsElement.textContent = uniqueEmails.size;
    }

    // Hàm để đăng xuất
    async function logout() {
        try {
            const response = await fetch('/api/logout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Logout failed');
            }

            const result = await response.json();

            if (result.success) {
                // Chuyển hướng về trang chủ sau khi đăng xuất thành công
                window.location.href = '/';
            } else {
                alert(result.message || 'Logout failed. Please try again.');
            }
        } catch (error) {
            console.error('Error during logout:', error);
            alert('Error during logout. Please try again.');
        }
    }

    // Thêm sự kiện cho nút refresh
    if (refreshButton) {
        refreshButton.addEventListener('click', fetchMessages);
    }

    // Thêm sự kiện cho các nút logout
    if (logoutButton) {
        logoutButton.addEventListener('click', logout);
    }

    if (navLogoutBtn) {
        navLogoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
    }

    // Biến để lưu trữ interval ID cho auto refresh
    let autoRefreshInterval = null;

    // Hàm để bắt đầu auto refresh
    function startAutoRefresh(intervalMinutes = 5) {
        // Xóa interval cũ nếu có
        if (autoRefreshInterval) {
            clearInterval(autoRefreshInterval);
        }

        // Chuyển đổi phút thành mili giây
        const intervalMs = intervalMinutes * 60 * 1000;

        // Tạo interval mới
        autoRefreshInterval = setInterval(() => {
            console.log('Auto refreshing messages...');
            fetchMessages();
        }, intervalMs);

        // Hiển thị thông báo
        showToast(`Auto refresh enabled (every ${intervalMinutes} minutes)`, 'info');
    }

    // Hàm để dừng auto refresh
    function stopAutoRefresh() {
        if (autoRefreshInterval) {
            clearInterval(autoRefreshInterval);
            autoRefreshInterval = null;

            // Hiển thị thông báo
            showToast('Auto refresh disabled', 'info');
        }
    }

    // Thêm nút auto refresh vào trang
    function addAutoRefreshButton() {
        const adminActions = document.querySelector('.admin-actions');
        if (!adminActions) return;

        // Tạo nút auto refresh
        const autoRefreshButton = document.createElement('button');
        autoRefreshButton.id = 'autoRefreshButton';
        autoRefreshButton.className = 'admin-btn';
        autoRefreshButton.innerHTML = '<i class="bx bx-time"></i> Auto Refresh';

        // Thêm sự kiện click
        autoRefreshButton.addEventListener('click', () => {
            if (autoRefreshInterval) {
                stopAutoRefresh();
                autoRefreshButton.classList.remove('active');
            } else {
                startAutoRefresh(5); // Auto refresh mỗi 5 phút
                autoRefreshButton.classList.add('active');
            }
        });

        // Thêm vào DOM
        adminActions.appendChild(autoRefreshButton);
    }

    // Lấy dữ liệu khi trang được tải và thêm nút auto refresh
    fetchMessages();
    addAutoRefreshButton();
});