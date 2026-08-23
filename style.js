// ==================== FIREBASE CONFIGURATION ====================
const firebaseConfig = {
  apiKey: "AIzaSyDbF7VdnNfFt8N9tA3xbbTvHi8JpSJ5PFw",
  authDomain: "attendanceapp-7484d.firebaseapp.com",
  databaseURL: "https://attendanceapp-7484d-default-rtdb.firebaseio.com",
  projectId: "attendanceapp-7484d",
  storageBucket: "attendanceapp-7484d.firebasestorage.app",
  messagingSenderId: "163762786346",
  appId: "1:163762786346:web:b3ca98f8d2dfee9923b353"
};

// Initialize Firebase Realtime Database
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// State Variables
let isAdmin = false;
const ADMIN_PIN = "1234"; // Admin security passcode

let members = JSON.parse(localStorage.getItem('app_members')) || [
  { id: '1', name: 'Aap (Self)', role: 'School Student', task: 'School Attendance' },
  { id: '2', name: 'Sister', role: 'School Student', task: 'School Attendance' },
  { id: '3', name: 'House Helper', role: 'Home Chores', task: 'Bartan & Jhadu Pocha' }
];

let attendanceRecords = JSON.parse(localStorage.getItem('app_attendance')) || {}; 
let leaveRequests = JSON.parse(localStorage.getItem('app_leaves')) || [];
let changeRequests = JSON.parse(localStorage.getItem('app_changes')) || [];

// ==================== FIREBASE REALTIME SYNC ====================
function listenToCloudData() {
  database.ref('attendance_system').on('value', (snapshot) => {
    const data = snapshot.val();
    if (data) {
      if (data.members) members = data.members;
      if (data.attendance) attendanceRecords = data.attendance;
      if (data.leaves) leaveRequests = data.leaves;
      if (data.changes) changeRequests = data.changes;

      localStorage.setItem('app_members', JSON.stringify(members));
      localStorage.setItem('app_attendance', JSON.stringify(attendanceRecords));
      localStorage.setItem('app_leaves', JSON.stringify(leaveRequests));
      localStorage.setItem('app_changes', JSON.stringify(changeRequests));

      refreshUI();
    }
  });
}

function syncToCloud() {
  database.ref('attendance_system').set({
    members: members,
    attendance: attendanceRecords,
    leaves: leaveRequests,
    changes: changeRequests
  });
}

// Initialize Page
document.addEventListener("DOMContentLoaded", () => {
  const dateInput = document.getElementById('attendanceDate');
  const fromDate = document.getElementById('leaveFromDate');
  const toDate = document.getElementById('leaveToDate');

  if (dateInput) dateInput.valueAsDate = new Date();
  if (fromDate) fromDate.valueAsDate = new Date();
  if (toDate) toDate.valueAsDate = new Date();
  
  listenToCloudData();
  refreshUI();
});

function refreshUI() {
  refreshDropdowns();
  renderAdminMemberList();
  renderAttendanceGrid();
  renderLeaveInbox();
  renderChangeRequests();
  renderMonthlyReport();
}

function saveData() {
  localStorage.setItem('app_members', JSON.stringify(members));
  localStorage.setItem('app_attendance', JSON.stringify(attendanceRecords));
  localStorage.setItem('app_leaves', JSON.stringify(leaveRequests));
  localStorage.setItem('app_changes', JSON.stringify(changeRequests));
  
  syncToCloud();
  refreshUI();
}

// ==================== AUTH LOGIC (FIXED) ====================
function toggleAdminLogin() {
  const loginModal = document.getElementById('loginModal');
  const adminBadge = document.getElementById('adminBadge');
  const adminAuthBtn = document.getElementById('adminAuthBtn');
  const adminPanel = document.getElementById('adminPanel');

  if (isAdmin) {
    isAdmin = false;
    if (adminBadge) {
      adminBadge.className = "admin-badge badge-user";
      adminBadge.innerHTML = '<i class="fa-solid fa-user"></i> Public View';
    }
    if (adminAuthBtn) adminAuthBtn.innerHTML = '<i class="fa-solid fa-lock"></i> Admin Login';
    if (adminPanel) adminPanel.classList.add('hidden');
    refreshUI();
    alert("Admin Logged Out!");
  } else {
    if (loginModal) {
      loginModal.classList.remove('hidden');
    } else {
      console.error("loginModal element nahi mila!");
    }
  }
}

function authenticateAdmin() {
  const pinInput = document.getElementById('adminPinInput');
  const adminBadge = document.getElementById('adminBadge');
  const adminAuthBtn = document.getElementById('adminAuthBtn');
  const adminPanel = document.getElementById('adminPanel');

  if (pinInput && pinInput.value === ADMIN_PIN) {
    isAdmin = true;
    if (adminBadge) {
      adminBadge.className = "admin-badge badge-admin";
      adminBadge.innerHTML = '<i class="fa-solid fa-user-check"></i> Admin Access';
    }
    if (adminAuthBtn) adminAuthBtn.innerHTML = '<i class="fa-solid fa-lock-open"></i> Logout Admin';
    if (adminPanel) adminPanel.classList.remove('hidden');
    closeLoginModal();
    refreshUI();
  } else {
    alert("Galat PIN! Dubara koshish karein.");
  }
  if (pinInput) pinInput.value = '';
}

function closeLoginModal() {
  const loginModal = document.getElementById('loginModal');
  if (loginModal) loginModal.classList.add('hidden');
}

// ==================== 1. MEMBER MANAGEMENT ====================
function addMember() {
  const nameInput = document.getElementById('newMemberName');
  const roleSelect = document.getElementById('newMemberRole');
  
  if (!nameInput || !nameInput.value.trim()) return alert("Member naam likhna zaroori hai");
  
  const newMember = {
    id: Date.now().toString(),
    name: nameInput.value.trim(),
    role: roleSelect ? roleSelect.value : 'School Student',
    task: roleSelect && roleSelect.value === 'School Student' ? 'School Attendance' : 'Bartan & Jhadu Pocha'
  };

  members.push(newMember);
  nameInput.value = '';
  saveData();
}

function deleteMember(memberId) {
  const member = members.find(m => m.id === memberId);
  if (confirm(`Kya aap "${member ? member.name : 'is member'}" ko list se hatana chahte hain?`)) {
    members = members.filter(m => m.id !== memberId);
    saveData();
  }
}

function renderAdminMemberList() {
  const listContainer = document.getElementById('adminMemberList');
  if (!listContainer) return;
  listContainer.innerHTML = '';

  if (members.length === 0) {
    listContainer.innerHTML = '<p style="color:#888; font-size:13px;">Koi member nahi hai. Naya add karein.</p>';
    return;
  }

  members.forEach(m => {
    listContainer.innerHTML += `
      <div style="display:flex; justify-content:space-between; align-items:center; background:#fff; padding:8px 12px; border-radius:6px; border:1px solid #e0e0e0; margin-bottom:6px;">
        <span><strong>${m.name}</strong> <small style="color:#666;">(${m.role})</small></span>
        <button class="btn btn-danger" style="padding:3px 8px; font-size:11px;" onclick="deleteMember('${m.id}')">
          <i class="fa-solid fa-trash"></i> Remove
        </button>
      </div>
    `;
  });
}

function refreshDropdowns() {
  const leaveSelect = document.getElementById('leaveMemberSelect');
  if (!leaveSelect) return;
  leaveSelect.innerHTML = '<option value="">Select Member</option>';
  members.forEach(m => {
    leaveSelect.innerHTML += `<option value="${m.id}">${m.name} (${m.role})</option>`;
  });
}

// ==================== 2. ATTENDANCE GRID ====================
function renderAttendanceGrid() {
  const dateInput = document.getElementById('attendanceDate');
  if (!dateInput) return;
  const selectedDate = dateInput.value;
  const tbody = document.getElementById('attendanceGridBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  const dayRecords = attendanceRecords[selectedDate] || {};

  members.forEach(m => {
    const currentStatus = dayRecords[m.id];
    const isLocked = currentStatus !== undefined;

    let statusButtonsHTML = '';
    
    if (isLocked && !isAdmin) {
      statusButtonsHTML = `
        <span class="status-badge badge-${currentStatus.toLowerCase()}">Status: ${currentStatus}</span>
        <small style="display:block; color:#888;">(Locked)</small>
      `;
    } else {
      statusButtonsHTML = `
        <div class="pal-btn-group">
          <button class="pal-btn ${currentStatus === 'P' ? 'active-P' : ''}" onclick="markAttendance('${m.id}', 'P')">P</button>
          <button class="pal-btn ${currentStatus === 'A' ? 'active-A' : ''}" onclick="markAttendance('${m.id}', 'A')">A</button>
          <button class="pal-btn ${currentStatus === 'L' ? 'active-L' : ''}" onclick="markAttendance('${m.id}', 'L')">L</button>
        </div>
      `;
    }

    let actionHTML = '';
    if (isLocked && !isAdmin) {
      actionHTML = `<button class="btn btn-outline" style="padding:4px 8px; font-size:11px;" onclick="openRequestModal('${m.id}', '${m.name}', '${selectedDate}')"><i class="fa-solid fa-pen-to-square"></i> Request Change</button>`;
    } else if (isAdmin && isLocked) {
      actionHTML = `<small style="color:green;"><i class="fa-solid fa-shield-halved"></i> Admin Editable</small>`;
    } else {
      actionHTML = `<small style="color:#aaa;">Ready to mark</small>`;
    }

    tbody.innerHTML += `
      <tr>
        <td><strong>${m.name}</strong></td>
        <td>${m.role}</td>
        <td>${m.task}</td>
        <td>${statusButtonsHTML}</td>
        <td>${actionHTML}</td>
      </tr>
    `;
  });
}

function markAttendance(memberId, status) {
  const dateInput = document.getElementById('attendanceDate');
  if (!dateInput) return;
  const date = dateInput.value;
  
  if (!attendanceRecords[date]) {
    attendanceRecords[date] = {};
  }
  
  attendanceRecords[date][memberId] = status;
  saveData();
}

// ==================== 3. EDIT REQUESTS ====================
function openRequestModal(memberId, memberName, date) {
  const reqMemberId = document.getElementById('reqMemberId');
  const reqDate = document.getElementById('reqDate');
  const modalSubText = document.getElementById('modalSubText');
  const requestModal = document.getElementById('requestModal');

  if (reqMemberId) reqMemberId.value = memberId;
  if (reqDate) reqDate.value = date;
  if (modalSubText) modalSubText.innerText = `${memberName} ki date (${date}) ki attendance change karne ki request send karein.`;
  if (requestModal) requestModal.classList.remove('hidden');
}

function closeModal() {
  const requestModal = document.getElementById('requestModal');
  if (requestModal) requestModal.classList.add('hidden');
}

function submitChangeRequest() {
  const memberId = document.getElementById('reqMemberId').value;
  const date = document.getElementById('reqDate').value;
  const newStatus = document.getElementById('reqNewStatus').value;
  const reasonInput = document.getElementById('reqReason');
  const reason = reasonInput ? reasonInput.value.trim() : '';

  if (!reason) return alert("Reason likhna compulsory hai!");

  changeRequests.push({
    id: Date.now().toString(),
    memberId,
    date,
    newStatus,
    reason,
    status: 'Pending'
  });

  if (reasonInput) reasonInput.value = '';
  closeModal();
  saveData();
  alert("Attendance Change Request Admin ko bhej di gayi hai!");
}

function renderChangeRequests() {
  const tbody = document.getElementById('changeRequestsBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  if (changeRequests.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center" style="color:#999;">Koi Edit Request Nahi Hai</td></tr>`;
    return;
  }

  changeRequests.forEach(req => {
    const member = members.find(m => m.id === req.memberId) || { name: 'Unknown' };
    
    let actionBtns = req.status;
    if (isAdmin && req.status === 'Pending') {
      actionBtns = `
        <button class="btn btn-success" style="padding:3px 8px; font-size:11px;" onclick="approveChangeRequest('${req.id}')">Approve</button>
        <button class="btn btn-danger" style="padding:3px 8px; font-size:11px;" onclick="rejectChangeRequest('${req.id}')">Reject</button>
      `;
    }

    tbody.innerHTML += `
      <tr>
        <td>${member.name}</td>
        <td>${req.date}</td>
        <td><strong>${req.newStatus}</strong></td>
        <td>${req.reason}</td>
        <td><span class="status-badge badge-pending">${req.status}</span></td>
        <td>${actionBtns}</td>
      </tr>
    `;
  });
}

function approveChangeRequest(reqId) {
  const req = changeRequests.find(r => r.id === reqId);
  if (req) {
    req.status = 'Approved';
    if (!attendanceRecords[req.date]) attendanceRecords[req.date] = {};
    attendanceRecords[req.date][req.memberId] = req.newStatus;
    saveData();
  }
}

function rejectChangeRequest(reqId) {
  const req = changeRequests.find(r => r.id === reqId);
  if (req) {
    req.status = 'Rejected';
    saveData();
  }
}

// ==================== 4. LEAVE SYSTEM ====================
function handleLeaveSubmit(e) {
  e.preventDefault();
  const memberSelect = document.getElementById('leaveMemberSelect');
  const fromInput = document.getElementById('leaveFromDate');
  const toInput = document.getElementById('leaveToDate');
  const reasonInput = document.getElementById('leaveReasonText');

  if (!memberSelect || !fromInput || !toInput || !reasonInput) return;

  leaveRequests.push({
    id: Date.now().toString(),
    memberId: memberSelect.value,
    from: fromInput.value,
    to: toInput.value,
    reason: reasonInput.value.trim(),
    status: 'Pending'
  });

  reasonInput.value = '';
  saveData();
  alert("Leave Application Submitted! Admin Approve karega.");
}

function renderLeaveInbox() {
  const tbody = document.getElementById('leaveInboxBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  if (leaveRequests.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center" style="color:#999;">Koi Leave Request Nahi Hai</td></tr>`;
    return;
  }

  leaveRequests.forEach(l => {
    const member = members.find(m => m.id === l.memberId) || { name: 'Unknown' };
    
    let actionBtns = l.status;
    if (isAdmin && l.status === 'Pending') {
      actionBtns = `
        <button class="btn btn-success" style="padding:3px 8px; font-size:11px;" onclick="updateLeaveStatus('${l.id}', 'Approved')">Approve</button>
        <button class="btn btn-danger" style="padding:3px 8px; font-size:11px;" onclick="updateLeaveStatus('${l.id}', 'Rejected')">Reject</button>
      `;
    }

    tbody.innerHTML += `
      <tr>
        <td>${member.name}</td>
        <td><small>${l.from} se ${l.to}</small></td>
        <td>${l.reason}</td>
        <td><span class="status-badge badge-pending">${l.status}</span></td>
        <td>${actionBtns}</td>
      </tr>
    `;
  });
}

function updateLeaveStatus(leaveId, status) {
  const leave = leaveRequests.find(l => l.id === leaveId);
  if (leave) {
    leave.status = status;
    saveData();
  }
}

// ==================== 5. MONTHLY REPORTS ====================
function renderMonthlyReport() {
  const tbody = document.getElementById('reportTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  members.forEach(m => {
    let pCount = 0, aCount = 0, lCount = 0;

    Object.keys(attendanceRecords).forEach(dateKey => {
      const status = attendanceRecords[dateKey][m.id];
      if (status === 'P') pCount++;
      if (status === 'A') aCount++;
      if (status === 'L') lCount++;
    });

    tbody.innerHTML += `
      <tr>
        <td><strong>${m.name}</strong></td>
        <td>${m.role}</td>
        <td><span class="status-badge badge-p">${pCount} Days</span></td>
        <td><span class="status-badge badge-a">${aCount} Days</span></td>
        <td><span class="status-badge badge-l">${lCount} Days</span></td>
      </tr>
    `;
  });
}
