
import React, { useState, useEffect } from 'react';
import { 
  Search, Plus, Filter, MoreVertical, Edit, Trash2, Shield, User, 
  CheckCircle, XCircle, Key, ChevronLeft, ChevronRight, Lock
} from 'lucide-react';
import { db } from '../utils/db';
import { UserProfile } from '../types';
import { useUI } from '../components/GlobalUI';

export const UserManagementView: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile>(db.user.get());
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'user'>('all');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isPassModalOpen, setIsPassModalOpen] = useState(false);
  
  // Forms
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [newUserForm, setNewUserForm] = useState({ username: '', name: '', email: '', role: 'user', password: '' });
  const [passForm, setPassForm] = useState({ new: '', confirm: '' });

  const ui = useUI();

  useEffect(() => {
    // Load users
    setUsers(db.users.getAll());
    setCurrentUser(db.user.get());
  }, []);

  const filteredUsers = users.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) || 
                        u.email.toLowerCase().includes(search.toLowerCase()) ||
                        u.username.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleAddUser = () => {
    if(!newUserForm.username || !newUserForm.password || !newUserForm.name) {
        ui.showToast('error', 'Vui lòng điền đầy đủ thông tin bắt buộc');
        return;
    }

    // Check duplicate
    if(users.some(u => u.username === newUserForm.username)) {
        ui.showToast('error', 'Tên đăng nhập đã tồn tại');
        return;
    }

    const newUser: UserProfile = {
        id: `u-${Date.now()}`,
        username: newUserForm.username,
        password: newUserForm.password,
        name: newUserForm.name,
        email: newUserForm.email || `${newUserForm.username}@tatrach.vn`,
        role: newUserForm.role as 'admin' | 'user',
        status: 'active',
        lastActive: new Date().toISOString(),
        avatar: newUserForm.name.slice(0, 2).toUpperCase()
    };

    db.users.add(newUser);
    setUsers(db.users.getAll());
    setIsAddModalOpen(false);
    setNewUserForm({ username: '', name: '', email: '', role: 'user', password: '' });
    ui.showToast('success', 'Đã thêm người dùng mới');
  };

  const handleDeleteUser = (user: UserProfile) => {
      if(user.id === currentUser.id) {
          ui.showToast('error', 'Bạn không thể xóa tài khoản đang đăng nhập');
          return;
      }
      ui.confirm({
          title: 'Xóa người dùng',
          message: `Bạn có chắc chắn muốn xóa tài khoản "${user.name}"? Hành động này không thể hoàn tác.`,
          type: 'danger',
          onConfirm: () => {
              db.users.delete(user.id);
              setUsers(db.users.getAll());
              ui.showToast('success', 'Đã xóa người dùng');
          }
      });
  };

  const handleChangePassword = () => {
     if(!passForm.new || passForm.new !== passForm.confirm) {
         ui.showToast('error', 'Mật khẩu không khớp hoặc để trống');
         return;
     }
     if(selectedUser) {
         const updated = { ...selectedUser, password: passForm.new };
         db.users.update(updated);
         setUsers(db.users.getAll());
         setIsPassModalOpen(false);
         setPassForm({ new: '', confirm: '' });
         setSelectedUser(null);
         ui.showToast('success', 'Đã đổi mật khẩu');
     }
  };

  const openPassModal = (user: UserProfile) => {
      setSelectedUser(user);
      setIsPassModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
         <div>
             <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Quản lý người dùng</h2>
             <p className="text-sm text-slate-500 dark:text-slate-400">Quản lý tài khoản và phân quyền truy cập hệ thống</p>
         </div>
         <button 
           onClick={() => setIsAddModalOpen(true)}
           className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-blue-200 dark:shadow-blue-900/50 hover:bg-blue-700 transition-all flex items-center gap-2"
         >
           <Plus size={18}/> Thêm người dùng
         </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col min-h-[600px]">
          {/* Filters */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col md:flex-row gap-4 justify-between items-center">
             <div className="relative w-full md:w-80">
                 <input 
                   type="text" 
                   placeholder="Tìm kiếm theo tên, email..." 
                   value={search}
                   onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
                   className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                 />
                 <Search className="absolute left-3 top-2.5 text-slate-400" size={18}/>
             </div>
             <div className="flex gap-2 w-full md:w-auto overflow-x-auto">
                 <button 
                   onClick={() => setRoleFilter('all')} 
                   className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap ${roleFilter === 'all' ? 'bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                 >
                   Tất cả
                 </button>
                 <button 
                   onClick={() => setRoleFilter('admin')} 
                   className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap ${roleFilter === 'admin' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                 >
                   Quản trị viên
                 </button>
                 <button 
                   onClick={() => setRoleFilter('user')} 
                   className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap ${roleFilter === 'user' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                 >
                   Người dùng
                 </button>
             </div>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-x-auto">
              <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-400 uppercase text-xs">
                      <tr>
                          <th className="px-6 py-4">Người dùng</th>
                          <th className="px-6 py-4">Vai trò</th>
                          <th className="px-6 py-4">Trạng thái</th>
                          <th className="px-6 py-4">Hoạt động cuối</th>
                          <th className="px-6 py-4 text-center">Thao tác</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                      {paginatedUsers.map(user => (
                          <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                              <td className="px-6 py-4">
                                  <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                                          {user.avatar}
                                      </div>
                                      <div>
                                          <p className="font-bold text-slate-800 dark:text-white">{user.name}</p>
                                          <p className="text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
                                          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-0.5">@{user.username}</p>
                                      </div>
                                  </div>
                              </td>
                              <td className="px-6 py-4">
                                  {user.role === 'admin' ? (
                                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 text-xs font-bold border border-blue-100 dark:border-blue-900/30">
                                          <Shield size={12}/> Admin
                                      </span>
                                  ) : (
                                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold border border-slate-200 dark:border-slate-600">
                                          <User size={12}/> User
                                      </span>
                                  )}
                              </td>
                              <td className="px-6 py-4">
                                  {user.status === 'active' ? (
                                      <span className="inline-flex items-center gap-1.5 text-green-600 dark:text-green-400 text-xs font-medium">
                                          <CheckCircle size={14}/> Hoạt động
                                      </span>
                                  ) : (
                                      <span className="inline-flex items-center gap-1.5 text-slate-400 dark:text-slate-500 text-xs font-medium">
                                          <XCircle size={14}/> Vô hiệu
                                      </span>
                                  )}
                              </td>
                              <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-xs">
                                  {new Date(user.lastActive).toLocaleString('vi-VN')}
                              </td>
                              <td className="px-6 py-4">
                                  <div className="flex items-center justify-center gap-2">
                                      <button 
                                        onClick={() => openPassModal(user)}
                                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                        title="Đổi mật khẩu"
                                      >
                                          <Key size={16}/>
                                      </button>
                                      {user.id !== currentUser.id ? (
                                          <button 
                                            onClick={() => handleDeleteUser(user)}
                                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                            title="Xóa người dùng"
                                          >
                                              <Trash2 size={16}/>
                                          </button>
                                      ) : (
                                          <div className="w-8 h-8"></div> // Spacer
                                      )}
                                  </div>
                              </td>
                          </tr>
                      ))}
                      {paginatedUsers.length === 0 && (
                          <tr>
                              <td colSpan={5} className="py-12 text-center text-slate-400 italic">
                                  Không tìm thấy người dùng phù hợp
                              </td>
                          </tr>
                      )}
                  </tbody>
              </table>
          </div>

          {/* Pagination */}
          <div className="p-4 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
               <span className="text-xs text-slate-500 dark:text-slate-400">
                   Hiển thị {paginatedUsers.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} - {Math.min(currentPage * itemsPerPage, filteredUsers.length)} trong tổng số {filteredUsers.length}
               </span>
               <div className="flex gap-2">
                   <button 
                     onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                     disabled={currentPage === 1}
                     className="p-2 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                   >
                       <ChevronLeft size={16}/>
                   </button>
                   <span className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300">
                       Trang {currentPage} / {totalPages || 1}
                   </span>
                   <button 
                     onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                     disabled={currentPage === totalPages || totalPages === 0}
                     className="p-2 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                   >
                       <ChevronRight size={16}/>
                   </button>
               </div>
          </div>
      </div>

      {/* Add User Modal */}
      {isAddModalOpen && (
          <div className="fixed inset-0 z-[1000] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                  <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
                      <h3 className="font-bold text-slate-800 dark:text-white">Thêm người dùng mới</h3>
                      <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><XCircle size={20}/></button>
                  </div>
                  <div className="p-6 space-y-4">
                      <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tên đăng nhập *</label>
                          <input 
                             type="text" 
                             value={newUserForm.username}
                             onChange={e => setNewUserForm({...newUserForm, username: e.target.value})}
                             className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                             placeholder="user123"
                          />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Mật khẩu *</label>
                          <input 
                             type="password" 
                             value={newUserForm.password}
                             onChange={e => setNewUserForm({...newUserForm, password: e.target.value})}
                             className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                             placeholder="••••••"
                          />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Họ và tên *</label>
                          <input 
                             type="text" 
                             value={newUserForm.name}
                             onChange={e => setNewUserForm({...newUserForm, name: e.target.value})}
                             className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                             placeholder="Nguyễn Văn A"
                          />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
                          <input 
                             type="email" 
                             value={newUserForm.email}
                             onChange={e => setNewUserForm({...newUserForm, email: e.target.value})}
                             className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                             placeholder="user@tatrach.vn"
                          />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Vai trò</label>
                          <div className="flex gap-4 mt-2">
                              <label className="flex items-center gap-2 cursor-pointer">
                                  <input type="radio" name="role" checked={newUserForm.role === 'user'} onChange={() => setNewUserForm({...newUserForm, role: 'user'})} className="accent-blue-600"/>
                                  <span className="text-sm text-slate-700 dark:text-slate-300">User</span>
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer">
                                  <input type="radio" name="role" checked={newUserForm.role === 'admin'} onChange={() => setNewUserForm({...newUserForm, role: 'admin'})} className="accent-blue-600"/>
                                  <span className="text-sm text-slate-700 dark:text-slate-300">Admin</span>
                              </label>
                          </div>
                      </div>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-700">
                      <button onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg text-sm font-medium">Hủy</button>
                      <button onClick={handleAddUser} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold shadow-md">Tạo tài khoản</button>
                  </div>
              </div>
          </div>
      )}

      {/* Change Password Modal */}
      {isPassModalOpen && selectedUser && (
          <div className="fixed inset-0 z-[1000] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
                  <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
                      <h3 className="font-bold text-slate-800 dark:text-white">Đổi mật khẩu: {selectedUser.username}</h3>
                      <button onClick={() => setIsPassModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><XCircle size={20}/></button>
                  </div>
                  <div className="p-6 space-y-4">
                      <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Mật khẩu mới</label>
                          <div className="relative">
                            <input 
                                type="password" 
                                value={passForm.new}
                                onChange={e => setPassForm({...passForm, new: e.target.value})}
                                className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 pl-10 outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                                placeholder="••••••"
                            />
                            <Lock className="absolute left-3 top-3 text-slate-400" size={16}/>
                          </div>
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Xác nhận mật khẩu</label>
                          <div className="relative">
                            <input 
                                type="password" 
                                value={passForm.confirm}
                                onChange={e => setPassForm({...passForm, confirm: e.target.value})}
                                className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 pl-10 outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                                placeholder="••••••"
                            />
                             <Lock className="absolute left-3 top-3 text-slate-400" size={16}/>
                          </div>
                      </div>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-700">
                      <button onClick={() => setIsPassModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg text-sm font-medium">Hủy</button>
                      <button onClick={handleChangePassword} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold shadow-md">Cập nhật</button>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};
