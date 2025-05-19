// استدعاء مكتبة jsPDF
const { jsPDF } = window.jspdf;

// تهيئة مصفوفة المهام
let tasks = [];

// الحصول على العناصر من DOM
const taskForm = document.getElementById('task-form');
const tasksList = document.getElementById('tasks-list');
const searchBtn = document.getElementById('search-btn');
const resetSearchBtn = document.getElementById('reset-search-btn');
const exportPdfBtn = document.getElementById('export-pdf-btn');

// عرض المهام
function displayTasks(tasksToDisplay = tasks) {
    tasksList.innerHTML = '';
    
    if (tasksToDisplay.length === 0) {
        tasksList.innerHTML = '<p class="no-tasks">لا توجد مهام للعرض</p>';
        return;
    }
    
    tasksToDisplay.forEach((task, index) => {
        const taskItem = document.createElement('div');
        taskItem.classList.add('task-item');
        
        // إضافة فئة الأولوية
        if (task.priority === 'عالية') {
            taskItem.classList.add('high-priority');
        } else if (task.priority === 'متوسطة') {
            taskItem.classList.add('medium-priority');
        } else {
            taskItem.classList.add('low-priority');
        }
        
        // إضافة فئة المهام المكتملة
        if (task.completed) {
            taskItem.classList.add('completed');
        }
        
        // تنسيق التاريخ
        const taskDate = new Date(task.date);
        const formattedDate = taskDate.toLocaleDateString('ar-SA', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        // إنشاء محتوى المهمة
        taskItem.innerHTML = `
            <div class="task-header">
                <h3 class="task-title">${task.title}</h3>
                <span class="task-date">${formattedDate}</span>
            </div>
            <p class="task-description">${task.description || 'لا يوجد وصف'}</p>
            <div class="task-footer">
                <span class="task-priority ${task.priority === 'عالية' ? 'high' : task.priority === 'متوسطة' ? 'medium' : 'low'}">
                    ${task.priority}
                </span>
                <div class="task-actions">
                    <button class="btn complete-btn" onclick="toggleTaskCompletion(${index})">
                        ${task.completed ? 'تراجع' : 'إكمال'}
                    </button>
                    <button class="btn delete-btn" onclick="deleteTask(${index})">حذف</button>
                </div>
            </div>
        `;
        
        tasksList.appendChild(taskItem);
    });
}

// إضافة مهمة جديدة
function addTask(e) {
    e.preventDefault();
    
    const title = document.getElementById('task-title').value;
    const description = document.getElementById('task-description').value;
    const date = document.getElementById('task-date').value;
    const priority = document.getElementById('task-priority').value;
    
    if (!title || !date) {
        alert('يرجى ملء جميع الحقول المطلوبة');
        return;
    }
    
    const newTask = {
        title,
        description,
        date,
        priority,
        completed: false,
        createdAt: new Date().toISOString()
    };
    
    console.log('إضافة مهمة جديدة:', newTask);
    
    tasks.push(newTask);
    
    // استخدام دالة حفظ المهام من Firebase
    if (typeof window.saveTasks === 'function') {
        window.saveTasks();
    } else {
        // استخدام التخزين المحلي كاحتياطي
        localStorage.setItem('tasks', JSON.stringify(tasks));
        console.log('تم استخدام التخزين المحلي الاحتياطي');
    }
    
    // عرض المهام بعد الإضافة
    displayTasks();
    
    // إعادة ضبط النموذج
    taskForm.reset();
    
    console.log('تم إضافة المهمة بنجاح');
}

// تبديل حالة إكمال المهمة
function toggleTaskCompletion(index) {
    tasks[index].completed = !tasks[index].completed;
    
    // استخدام دالة حفظ المهام من Firebase
    if (typeof window.saveTasks === 'function') {
        window.saveTasks();
    } else {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }
    
    displayTasks();
}

// حذف مهمة
function deleteTask(index) {
    if (confirm('هل أنت متأكد من حذف هذه المهمة؟')) {
        tasks.splice(index, 1);
        
        // استخدام دالة حفظ المهام من Firebase
        if (typeof window.saveTasks === 'function') {
            window.saveTasks();
        } else {
            localStorage.setItem('tasks', JSON.stringify(tasks));
        }
        
        displayTasks();
    }
}

// البحث عن المهام حسب التاريخ
function searchTasks() {
    const startDate = document.getElementById('search-start-date').value;
    const endDate = document.getElementById('search-end-date').value;
    
    if (!startDate && !endDate) {
        alert('الرجاء تحديد تاريخ البداية أو تاريخ النهاية على الأقل');
        return;
    }
    
    let filteredTasks = [...tasks];
    
    if (startDate) {
        filteredTasks = filteredTasks.filter(task => task.date >= startDate);
    }
    
    if (endDate) {
        filteredTasks = filteredTasks.filter(task => task.date <= endDate);
    }
    
    displayTasks(filteredTasks);
}

// إعادة ضبث البحث
function resetSearch() {
    document.getElementById('search-start-date').value = '';
    document.getElementById('search-end-date').value = '';
    displayTasks();
}

// تصدير المهام إلى PDF
function exportToPDF() {
    // إنشاء مستند PDF جديد
    const doc = new jsPDF();
    
    // إضافة العنوان
    doc.setFont("Cairo", "normal");
    doc.setFontSize(22);
    doc.text("قائمة المهام اليومية", 105, 20, null, null, "center");
    
    // تحديد التاريخ الحالي
    const today = new Date();
    const formattedDate = today.toLocaleDateString('ar-SA');
    doc.setFontSize(12);
    doc.text(`تاريخ التصدير: ${formattedDate}`, 105, 30, null, null, "center");
    
    // إعداد بيانات الجدول
    const tableColumn = ["العنوان", "الوصف", "التاريخ", "الأولوية", "الحالة"];
    const tableRows = [];
    
    // تجميع بيانات المهام
    tasks.forEach(task => {
        const taskDate = new Date(task.date).toLocaleDateString('ar-SA');
        const status = task.completed ? "مكتملة" : "قيد التنفيذ";
        const taskData = [
            task.title,
            task.description || "لا يوجد وصف",
            taskDate,
            task.priority,
            status
        ];
        tableRows.push(taskData);
    });
    
    // إنشاء الجدول
    doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 40,
        styles: { halign: 'right', font: 'Cairo' },
        headStyles: { fillColor: [52, 152, 219] },
        alternateRowStyles: { fillColor: [240, 240, 240] },
        margin: { right: 15 },
        theme: 'grid'
    });
    
    // حفظ الملف
    doc.save("المهام_اليومية.pdf");
}

// تحميل المهام من التخزين المحلي (احتياطي)
function loadTasksFromLocalStorage() {
    // نستخدم هذه الدالة فقط إذا لم يكن المستخدم مسجل الدخول
    if (typeof window.currentUser === 'undefined' || window.currentUser === null) {
        const savedTasks = localStorage.getItem('tasks');
        if (savedTasks) {
            tasks = JSON.parse(savedTasks);
            console.log('تم تحميل المهام من التخزين المحلي:', tasks.length);
            displayTasks();
        }
    }
}

// إضافة مستمعي الأحداث
taskForm.addEventListener('submit', addTask);
searchBtn.addEventListener('click', searchTasks);
resetSearchBtn.addEventListener('click', resetSearch);
exportPdfBtn.addEventListener('click', exportToPDF);

// تعريف الدوال العامة للاستخدام في HTML
window.toggleTaskCompletion = toggleTaskCompletion;
window.deleteTask = deleteTask;
window.displayTasks = displayTasks;

// تحميل المهام عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    console.log('تم تحميل الصفحة');
    // نستخدم التخزين المحلي فقط إذا لم يكن Firebase متاحًا
    if (typeof window.loadTasks !== 'function') {
        loadTasksFromLocalStorage();
    }
});