'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/utils/supabase/client';

export default function Navbar() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <nav className="flex justify-between items-center px-6 py-4 bg-white border-b">
      <h1
        onClick={() => router.push('/dashboard')}
        className="text-xl font-bold cursor-pointer"
      >
        Better Zlecenia
      </h1>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Avatar className="cursor-pointer">
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => router.push('/settings')}>
            Settings
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleLogout}>
            {loading ? 'Logging out…' : 'Logout'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </nav>
  );
}
