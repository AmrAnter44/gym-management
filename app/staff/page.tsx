'use client'

import { useEffect, useState } from 'react'

interface Staff {
  id: string
  name: string
  phone?: string
  position?: string
  salary?: number
  notes?: string
  isActive: boolean
  createdAt: string
}

export default function StaffPage() {
  const [staff, setStaff] = useState<Staff[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    position: '',
    salary: 0,
    notes: '',
  })

  const fetchStaff = async () => {
    try {
      const response = await fetch('/api/staff')
      const data = await response.json()
      setStaff(data)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStaff()
  }, [])

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      position: '',
      salary: 0,
      notes: '',
    })
    setEditingStaff(null)
    setShowForm(false)
  }

  const handleEdit = (staffMember: Staff) => {
    setFormData({
      name: staffMember.name,
      phone: staffMember.phone || '',
      position: staffMember.position || '',
      salary: staffMember.salary || 0,
      notes: staffMember.notes || '',
    })
    setEditingStaff(staffMember)
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const url = editingStaff ? '/api/staff' : '/api/staff'
      const method = editingStaff ? 'PUT' : 'POST'
      const body = editingStaff 
        ? { id: editingStaff.id, ...formData }
        : formData

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (response.ok) {
        setMessage(editingStaff ? '✅ تم تحديث الموظف بنجاح!' : '✅ تم إضافة الموظف بنجاح!')
        setTimeout(() => setMessage(''), 3000)
        fetchStaff()
        resetForm()
      } else {
        setMessage('❌ فشلت العملية')
      }
    } catch (error) {
      console.error(error)
      setMessage('❌ حدث خطأ')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الموظف؟')) return

    try {
      await fetch(`/api/staff?id=${id}`, { method: 'DELETE' })
      fetchStaff()
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const toggleActive = async (staffMember: Staff) => {
    try {
      await fetch('/api/staff', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: staffMember.id, 
          isActive: !staffMember.isActive 
        }),
      })
      fetchStaff()
    } catch (error) {
      console.error('Error:', error)
    }
  }

  return (
    <div className="container mx-auto p-6" dir="rtl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">👥 إدارة الموظفين</h1>
          <p className="text-gray-600">إضافة وتعديل وحذف الموظفين</p>
        </div>
        <button
          onClick={() => {
            resetForm()
            setShowForm(!showForm)
          }}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
        >
          {showForm ? 'إخفاء النموذج' : '➕ إضافة موظف جديد'}
        </button>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-lg ${message.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message}
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-semibold mb-4">
            {editingStaff ? 'تعديل موظف' : 'إضافة موظف جديد'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">الاسم *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="اسم الموظف"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">رقم الهاتف</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="01xxxxxxxxx"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">الوظيفة</label>
                <input
                  type="text"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="مثال: مدرب، استقبال"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">المرتب</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.salary}
                  onChange={(e) => setFormData({ ...formData, salary: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">ملاحظات</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                rows={3}
                placeholder="ملاحظات إضافية..."
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
              >
                {loading ? 'جاري الحفظ...' : (editingStaff ? 'تحديث' : 'إضافة موظف')}
              </button>
              {editingStaff && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
                >
                  إلغاء
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">إجمالي الموظفين</p>
              <p className="text-3xl font-bold text-blue-600">{staff.length}</p>
            </div>
            <div className="text-4xl">👥</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">الموظفين النشطين</p>
              <p className="text-3xl font-bold text-green-600">
                {staff.filter(s => s.isActive).length}
              </p>
            </div>
            <div className="text-4xl">✅</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">إجمالي المرتبات</p>
              <p className="text-3xl font-bold text-purple-600">
                {staff.reduce((sum, s) => sum + (s.salary || 0), 0).toFixed(0)} ج.م
              </p>
            </div>
            <div className="text-4xl">💰</div>
          </div>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-12">جاري التحميل...</div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-right">الاسم</th>
                <th className="px-4 py-3 text-right">الهاتف</th>
                <th className="px-4 py-3 text-right">الوظيفة</th>
                <th className="px-4 py-3 text-right">المرتب</th>
                <th className="px-4 py-3 text-right">الحالة</th>
                <th className="px-4 py-3 text-right">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {staff.map((staffMember) => (
                <tr key={staffMember.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{staffMember.name}</td>
                  <td className="px-4 py-3">{staffMember.phone || '-'}</td>
                  <td className="px-4 py-3">{staffMember.position || '-'}</td>
                  <td className="px-4 py-3 font-bold text-green-600">
                    {staffMember.salary ? `${staffMember.salary} ج.م` : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleActive(staffMember)}
                      className={`px-3 py-1 rounded text-sm ${
                        staffMember.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {staffMember.isActive ? '✅ نشط' : '❌ غير نشط'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(staffMember)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        تعديل
                      </button>
                      <button
                        onClick={() => handleDelete(staffMember.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        حذف
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {staff.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              لا يوجد موظفين حالياً
            </div>
          )}
        </div>
      )}
    </div>
  )
}