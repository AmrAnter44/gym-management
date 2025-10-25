'use client'

interface PaymentMethodSelectorProps {
  value: string
  onChange: (method: string) => void
  required?: boolean
}

export default function PaymentMethodSelector({ value, onChange, required = false }: PaymentMethodSelectorProps) {
  const paymentMethods = [
    { value: 'cash', label: 'كاش 💵', icon: '💵', color: 'bg-green-100 border-green-500' },
    { value: 'visa', label: 'فيزا 💳', icon: '💳', color: 'bg-blue-100 border-blue-500' },
    { value: 'instapay', label: 'إنستا باي 📱', icon: '📱', color: 'bg-purple-100 border-purple-500' },
    { value: 'wallet', label: 'محفظة إلكترونية 💰', icon: '💰', color: 'bg-orange-100 border-orange-500' },
  ]

  return (
    <div>
      <label className="block text-sm font-medium mb-2">
        طريقة الدفع {required && <span className="text-red-600">*</span>}
      </label>
      
      <div className="grid grid-cols-2 gap-3">
        {paymentMethods.map((method) => (
          <button
            key={method.value}
            type="button"
            onClick={() => onChange(method.value)}
            className={`
              flex items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all
              ${value === method.value 
                ? `${method.color} border-2 shadow-md scale-105` 
                : 'bg-white border-gray-300 hover:border-gray-400'
              }
            `}
          >
            <span className="text-3xl">{method.icon}</span>
            <span className="font-medium text-sm">{method.label}</span>
          </button>
        ))}
      </div>
      
      {/* عرض الطريقة المختارة */}
      {value && (
        <div className="mt-3 text-center">
          <p className="text-sm text-gray-600">
            الطريقة المختارة: 
            <span className="font-bold text-blue-600 mr-1">
              {paymentMethods.find(m => m.value === value)?.label}
            </span>
          </p>
        </div>
      )}
    </div>
  )
}

// دالة مساعدة للحصول على اسم طريقة الدفع بالعربية
export function getPaymentMethodLabel(method: string): string {
  const methods: { [key: string]: string } = {
    'cash': 'كاش 💵',
    'visa': 'فيزا 💳',
    'instapay': 'إنستا باي 📱',
    'wallet': 'محفظة إلكترونية 💰'
  }
  return methods[method] || method
}

// دالة للحصول على أيقونة طريقة الدفع
export function getPaymentMethodIcon(method: string): string {
  const icons: { [key: string]: string } = {
    'cash': '💵',
    'visa': '💳',
    'instapay': '📱',
    'wallet': '💰'
  }
  return icons[method] || '💰'
}