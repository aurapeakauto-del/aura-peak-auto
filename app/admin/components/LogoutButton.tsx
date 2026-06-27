'use client'

import { supabase } from '@/app/lib/supabase'
import { useRouter } from 'next/navigation'
import { FaSignOutAlt } from 'react-icons/fa'

export default function LogoutButton() {
    const router = useRouter()

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/admin/login')
        router.refresh()
    }

    return (
        <button
            onClick={handleLogout}
            className="px-4 py-2 border border-gray-700 text-gray-300 hover:border-white hover:text-white transition-colors text-sm flex items-center gap-2 rounded-lg"
        >
            <FaSignOutAlt />
            تسجيل الخروج
        </button>
    )
}